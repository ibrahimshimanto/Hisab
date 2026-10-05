-- Ownership is enforced in the database, not by a client-supplied filter.
do $migration$
declare table_name text; policy_name text; owner_column text;
begin
  foreach table_name in array array['accounts','transactions','budgets','savings_goals','recurring_bills','profiles'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on public.%I from anon', table_name);
    for policy_name in select policyname from pg_policies where schemaname='public' and tablename=table_name loop
      execute format('drop policy %I on public.%I', policy_name, table_name);
    end loop;
    owner_column := case when table_name='profiles' then 'id' else 'user_id' end;
    execute format('create policy owner_access on public.%I for all to authenticated using ((select auth.uid()) = %I) with check ((select auth.uid()) = %I)', table_name, owner_column, owner_column);
  end loop;
end $migration$;

create policy transaction_account_owner on public.transactions as restrictive for all to authenticated
using (true) with check (exists (select 1 from public.accounts a where a.id=account_id and a.user_id=(select auth.uid())));
create policy savings_account_owner on public.savings_goals as restrictive for all to authenticated
using (true) with check (coalesce(linked_account_id,'')='' or exists (select 1 from public.accounts a where a.id=linked_account_id and a.user_id=(select auth.uid())));
create policy bill_account_owner on public.recurring_bills as restrictive for all to authenticated
using (true) with check (coalesce(account_id,'')='' or exists (select 1 from public.accounts a where a.id=account_id and a.user_id=(select auth.uid())));

-- NOT VALID preserves existing records for review while enforcing new writes.
alter table public.transactions add constraint positive_transaction_amount check (amount > 0 and amount < 1000000000000 and amount=round(amount,2)) not valid;
alter table public.budgets add constraint positive_budget_amount check (amount > 0 and amount < 1000000000000 and amount=round(amount,2)) not valid;
create index if not exists accounts_owner_idx on public.accounts(user_id);
create index if not exists transactions_owner_idx on public.transactions(user_id);
create index if not exists budgets_owner_idx on public.budgets(user_id);
create index if not exists savings_goals_owner_idx on public.savings_goals(user_id);
create index if not exists recurring_bills_owner_idx on public.recurring_bills(user_id);
