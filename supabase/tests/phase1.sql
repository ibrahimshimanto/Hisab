begin;
select set_config('request.jwt.claim.sub',(select id::text from auth.users order by created_at limit 1),true);
select set_config('hisab.test.other_user',(select id::text from auth.users where id<>auth.uid() order by created_at limit 1),true);
insert into public.accounts(id,user_id,name,type,balance) values
 ('phase1-own-test',auth.uid(),'Synthetic phase 1','wallet',100),
 ('phase1-other-test',current_setting('hisab.test.other_user')::uuid,'Synthetic other user','wallet',100);
set local role authenticated;
do $$ declare rev bigint; receipt bigint; previous bigint; operation uuid := gen_random_uuid(); payload jsonb; blocked boolean; begin
 if exists(select 1 from public.accounts where id='phase1-other-test') then raise exception 'Other user visible'; end if;
 update public.accounts set balance=1 where id='phase1-other-test';
 if found then raise exception 'Other user writable'; end if;
 blocked:=false;
 begin
 insert into public.transactions(id,user_id,account_id,category_id,type,amount,date) values('phase1-cross',auth.uid(),'phase1-other-test','food','expense',1,'2026-03-01');
 exception when insufficient_privilege then blocked:=true; end;
 if not blocked then raise exception 'Foreign account transaction accepted'; end if;
 blocked:=false;
 begin
 insert into public.transactions(id,user_id,account_id,category_id,type,amount,date) values('phase1-negative',auth.uid(),'phase1-own-test','food','expense',-1,'2026-03-01');
 exception when check_violation or insufficient_privilege then blocked:=true; end;
 if not blocked then raise exception 'Negative amount accepted'; end if;
 blocked:=false;
 begin insert into public.budgets(id,user_id,category_id,amount,period) values('phase1-negative-budget',auth.uid(),'food',-1,'monthly');
 exception when check_violation or insufficient_privilege then blocked:=true; end;
 if not blocked then raise exception 'Negative budget accepted'; end if;
 payload:='{"accounts":[{"id":"phase1-own-test","name":"Synthetic phase 1","balance":100}],"transactions":[],"budgets":[],"adjustments":[],"savingsGoals":[],"recurringBills":[],"categories":{"income":[],"expense":[]},"profile":{"name":"Synthetic test","monthlySalary":0},"settings":{"theme":"light","currency":"BDT"},"financialMode":"cruise","modeSettings":{},"tourCompleted":false,"onboardingComplete":true,"sidebarCollapsed":false}'::jsonb;
 select coalesce(max(revision),0) into previous from public.app_workspaces where user_id=auth.uid();
 rev:=public.commit_hisab_workspace(payload,previous,operation);
 receipt:=public.commit_hisab_workspace(payload,previous,operation);
 if rev<>previous+1 or rev<>receipt then raise exception 'Idempotent retry failed'; end if;
 blocked:=false;
 begin perform public.commit_hisab_workspace(payload,previous,gen_random_uuid()); exception when sqlstate 'PT409' then blocked:=true; end;
 if not blocked then raise exception 'Stale revision accepted'; end if;
 blocked:=false;
 begin perform public.commit_hisab_workspace(jsonb_set(payload,'{transactions}','[{"id":"bad","type":"expense","amount":-1,"accountId":"phase1-own-test","categoryId":"food","date":"2026-03-01"}]'::jsonb),rev,gen_random_uuid()); exception when raise_exception then blocked:=true; end;
 if not blocked then raise exception 'Invalid snapshot accepted'; end if;
 if (select revision from public.app_workspaces where user_id=auth.uid())<>rev then raise exception 'Failed save changed revision'; end if;
 blocked:=false;
 begin perform public.commit_hisab_workspace(jsonb_set(payload,'{transactions}','[{"id":"orphan","type":"expense","amount":1,"accountId":"phase1-other-test","categoryId":"food","date":"2026-03-01"}]'::jsonb),rev,gen_random_uuid()); exception when raise_exception then blocked:=true; end;
 if not blocked then raise exception 'Foreign snapshot account accepted'; end if;
 blocked:=false;
 begin update public.accounts set balance=200 where id='phase1-own-test'; exception when insufficient_privilege then blocked:=true; end;
 if not blocked then raise exception 'Legacy tab can overwrite canonical data'; end if;
 if exists(select 1 from public.app_workspaces where user_id<>auth.uid()) then raise exception 'Foreign workspace visible'; end if;
 raise notice 'Authenticated owner isolation, positive amounts, atomic rollback, idempotency, and conflict checks passed';
end $$;
set local role anon;
do $$ declare blocked boolean:=false; tab text; begin
 foreach tab in array array['accounts','transactions','budgets','savings_goals','recurring_bills','profiles','app_workspaces','workspace_history','workspace_receipts'] loop
 blocked:=false;
 begin execute format('select count(*) from public.%I',tab); exception when insufficient_privilege then blocked:=true; end;
 if not blocked then raise exception 'Anonymous financial access accepted: %',tab; end if;
 end loop;
 blocked:=false;
 begin perform public.commit_hisab_workspace('{}',0,gen_random_uuid()); exception when insufficient_privilege then blocked:=true; end;
 if not blocked then raise exception 'Anonymous RPC accepted'; end if;
end $$;
rollback;
select 'PASS: owner isolation, signed-out denial, amount constraints, atomic rollback, retry idempotency, revision conflicts' as result;
