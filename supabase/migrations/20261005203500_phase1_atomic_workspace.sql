-- One versioned document commits balances and their ledger together. Legacy rows stay intact.
create table public.app_workspaces (
 user_id uuid primary key references auth.users(id), data jsonb not null,
 revision bigint not null check (revision > 0), updated_at timestamptz not null default now()
);
create table public.workspace_receipts (
 user_id uuid not null references auth.users(id), operation_id uuid not null,
 revision bigint not null, primary key(user_id, operation_id)
);
create table public.workspace_history (
 user_id uuid not null references auth.users(id), revision bigint not null,
 data jsonb not null, saved_at timestamptz not null default now(), primary key(user_id,revision)
);
do $$ declare tab text; begin
 foreach tab in array array['app_workspaces','workspace_receipts','workspace_history'] loop
 execute format('alter table public.%I enable row level security',tab);
 execute format('revoke all on public.%I from anon, authenticated',tab);
 execute format('grant select, insert, update on public.%I to authenticated',tab);
 execute format('create policy owner_access on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',tab);
 end loop;
end $$;
create function public.hisab_money(value jsonb, positive boolean default false, nonnegative boolean default false)
returns boolean language sql immutable set search_path = '' as $$
 select case when jsonb_typeof(value) <> 'number' or value is null then false
 else (value::text)::numeric = round((value::text)::numeric,2)
 and abs((value::text)::numeric) < 1000000000000
 and (not positive or (value::text)::numeric > 0)
 and (not nonnegative or (value::text)::numeric >= 0) end
$$;
create function public.validate_hisab_workspace() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare key text; row_data jsonb; old_row jsonb; amount_key text; account_key text;
begin
 if new.user_id is distinct from auth.uid() then raise exception 'Account ownership mismatch'; end if;
 if jsonb_typeof(new.data) <> 'object' then raise exception 'Invalid workspace'; end if;
 foreach key in array array['accounts','transactions','budgets','adjustments','savingsGoals','recurringBills'] loop
  if jsonb_typeof(new.data->key) is distinct from 'array' then raise exception 'Missing array: %',key; end if;
  if exists(select 1 from jsonb_array_elements(new.data->key) x where jsonb_typeof(x->'id') is distinct from 'string' or x->>'id' = '')
   or (select count(*) from jsonb_array_elements(new.data->key)) <> (select count(distinct x->>'id') from jsonb_array_elements(new.data->key) x)
  then raise exception 'Invalid or duplicate IDs: %',key; end if;
 end loop;
 if jsonb_typeof(new.data->'categories'->'income') is distinct from 'array'
 or jsonb_typeof(new.data->'categories'->'expense') is distinct from 'array'
 or jsonb_typeof(new.data->'profile') is distinct from 'object'
 or jsonb_typeof(new.data->'settings') is distinct from 'object'
 then raise exception 'Incomplete workspace'; end if;
 for row_data in select * from jsonb_array_elements(new.data->'accounts') loop
  if not public.hisab_money(row_data->'balance') then raise exception 'Invalid account balance'; end if;
 end loop;
 for row_data in select * from jsonb_array_elements(new.data->'transactions') loop
  if not public.hisab_money(row_data->'amount',true) or coalesce(row_data->>'type','') not in ('income','expense')
  or coalesce(row_data->>'categoryId','')='' or coalesce(row_data->>'date','')='' then raise exception 'Invalid transaction'; end if;
  -- PostgreSQL rejects impossible calendar dates; both old timestamps and civil dates are accepted.
  perform (row_data->>'date')::timestamptz;
  if not exists(select 1 from jsonb_array_elements(new.data->'accounts') a where a->>'id'=row_data->>'accountId') then
   old_row := null;
   if tg_op='UPDATE' then select x into old_row from jsonb_array_elements(old.data->'transactions') x where x->>'id'=row_data->>'id'; end if;
   if old_row is distinct from row_data and not exists (
    select 1 from public.transactions t where t.user_id=new.user_id and t.id=row_data->>'id'
    and t.account_id is not distinct from row_data->>'accountId' and t.amount=(row_data->>'amount')::numeric
    and t.type=row_data->>'type' and t.date=row_data->>'date'
   ) then raise exception 'Transaction account is missing'; end if;
  end if;
 end loop;
 for row_data in select * from jsonb_array_elements(new.data->'budgets') loop
  if not public.hisab_money(coalesce(row_data->'limit',row_data->'amount'),true) then raise exception 'Invalid budget'; end if;
 end loop;
 for row_data in select * from jsonb_array_elements(new.data->'savingsGoals') loop
  if not public.hisab_money(row_data->'targetAmount',true) or not public.hisab_money(row_data->'currentAmount',false,true) then raise exception 'Invalid savings amount'; end if;
  if coalesce(row_data->>'linkedAccountId','')<>'' and not exists(select 1 from jsonb_array_elements(new.data->'accounts') a where a->>'id'=row_data->>'linkedAccountId') then raise exception 'Savings account is missing'; end if;
 end loop;
 for row_data in select * from jsonb_array_elements(new.data->'recurringBills') loop
  if not public.hisab_money(row_data->'amount',true) or (row_data->>'dueDay')::integer not between 1 and 31 then raise exception 'Invalid bill'; end if;
  if coalesce(row_data->>'accountId','')<>'' and not exists(select 1 from jsonb_array_elements(new.data->'accounts') a where a->>'id'=row_data->>'accountId') then raise exception 'Bill account is missing'; end if;
 end loop;
 return new;
end $$;
create trigger validate_workspace before insert or update on public.app_workspaces for each row execute function public.validate_hisab_workspace();
create function public.commit_hisab_workspace(payload jsonb, expected_revision bigint, operation_id uuid)
returns bigint language plpgsql security invoker set search_path = '' as $$
declare uid uuid := auth.uid(); current_row public.app_workspaces; receipt bigint; next_revision bigint;
begin
 if uid is null then raise exception 'Sign in required' using errcode='28000'; end if;
 if operation_id is null or expected_revision < 0 then raise exception 'Invalid save request'; end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 select r.revision into receipt from public.workspace_receipts r where r.user_id=uid and r.operation_id=commit_hisab_workspace.operation_id;
 if found then return receipt; end if;
 select * into current_row from public.app_workspaces w where w.user_id=uid for update;
 if coalesce(current_row.revision,0) <> expected_revision then raise exception 'Workspace changed on another device; reload after exporting pending changes' using errcode='PT409'; end if;
 next_revision := expected_revision+1;
 if current_row.user_id is not null then
  insert into public.workspace_history(user_id,revision,data) values(uid,current_row.revision,current_row.data) on conflict do nothing;
 end if;
 insert into public.app_workspaces(user_id,data,revision) values(uid,payload,next_revision)
 on conflict(user_id) do update set data=excluded.data,revision=excluded.revision,updated_at=now();
 insert into public.workspace_receipts values(uid,operation_id,next_revision);
 return next_revision;
end $$;
revoke all on function public.commit_hisab_workspace(jsonb,bigint,uuid) from public,anon;
grant execute on function public.commit_hisab_workspace(jsonb,bigint,uuid) to authenticated;
