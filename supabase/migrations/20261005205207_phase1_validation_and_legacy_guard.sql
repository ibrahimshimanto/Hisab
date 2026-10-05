create or replace function public.validate_hisab_workspace() returns trigger
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
  or coalesce(row_data->>'kind',row_data->>'type') not in ('income','expense','opening','transfer','savings','refund')
  or (row_data->>'kind'='refund' and row_data->>'type'<>'income')
  or (row_data->>'kind' in ('income','expense') and row_data->>'kind'<>row_data->>'type')
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
  if not public.hisab_money(row_data->'amount',true) or coalesce(row_data->>'dueDay','') !~ '^[0-9]+$' or coalesce((row_data->>'dueDay')::integer,0) not between 1 and 31 then raise exception 'Invalid bill'; end if;
  if coalesce(row_data->>'accountId','')<>'' and not exists(select 1 from jsonb_array_elements(new.data->'accounts') a where a->>'id'=row_data->>'accountId') then raise exception 'Bill account is missing'; end if;
 end loop;
 return new;
end $$;

-- Old application tabs must not overwrite a workspace after its first canonical save.
do $$ declare tab text; owner_column text; begin
 foreach tab in array array['accounts','transactions','budgets','savings_goals','recurring_bills','profiles'] loop
 owner_column:=case when tab='profiles' then 'id' else 'user_id' end;
 execute format('create policy legacy_insert_guard on public.%I as restrictive for insert to authenticated with check (not exists(select 1 from public.app_workspaces w where w.user_id=%I))',tab,owner_column);
 execute format('create policy legacy_update_guard on public.%I as restrictive for update to authenticated using (true) with check (not exists(select 1 from public.app_workspaces w where w.user_id=%I))',tab,owner_column);
 execute format('create policy legacy_delete_guard on public.%I as restrictive for delete to authenticated using (not exists(select 1 from public.app_workspaces w where w.user_id=%I))',tab,owner_column);
 end loop;
end $$;
alter function public.handle_new_user() set search_path = '';
revoke execute on function public.handle_new_user() from public, anon, authenticated;
