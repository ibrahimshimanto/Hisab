# Hisab Phase 1 release report

Scope: Phase 1 of the public launch plan (financial correctness and data safety). Status: code and database checks passed; LIVE browser verification pending deployment. Phase 2 product simplification and Phase 3 public-launch preparation are outside this release.

| Plan ID | Implementation | Verification before deployment | LIVE status |
|---|---|---|---|
| FIN-01 | Shared positive, finite, two-decimal validation; server constraints and workspace validation | Invalid transactions/budgets rejected without balance changes | Pending |
| FIN-02 | Opening balances, earned income, transfers, savings, adjustments and refunds separated | Transfers/savings conserve tracked assets; refund offsets expense; opening balance excluded from income | Pending |
| FIN-03 | Atomic versioned workspace save; durable operation IDs; form submit IDs; bill month guard | Retry returns one revision; invalid save rolls back; duplicate form/bill actions apply once | Pending |
| FIN-04 | Quoted CSV parser, exact account mapping, preview, all-or-nothing import, duplicate rejection | Quote/newline roundtrip; selected balance updated; repeated import rejected | Pending |
| FIN-05 | Local civil date defaults, grouping, report/calendar filtering | Tests in Dhaka and Los Angeles; impossible date rejected | Pending |
| DATA-01 | RLS enabled on all exposed financial tables; ownership/reference checks; private workspace/history/receipts | Production SQL tests: signed-out denial, owner isolation, foreign-account attachment rejected | Database DONE; app pending |
| DATA-02 | Account-scoped cache, explicit checked responses, durable pending saves, revision conflicts, deferred auth callback | Network failure/retry, account switch and stale-response isolation tested | Pending |
| DATA-03 | Full versioned JSON export, validated restore preview, before-restore copy and server revision history | All persisted fields roundtrip; malformed backup rejected | Pending |
| DATA-04 | Removed all name-based demo purging and automatic account consolidation | Real names retained; duplicate account names stay separate | Pending |
| DATA-05 | Historical review with classification/account-link preview and explanation; original legacy tables preserved | Missing links/classification flagged; no automatic correction | Tool pending; user review remains |

## Data preservation

Production inspection found 14 historical transactions without a matching account owned by the same user. They remain intact. No repair was inferred from names or amounts. Existing legacy tables remain available as the migration source; after the first workspace save, old app tabs cannot write over the canonical account data. Refresh old tabs after this release.

The old unscoped device copy remains untouched and can be exported separately from Settings. It is not automatically assigned or uploaded to the signed-in account because its owner is unknown. Reset has been removed from Settings until its deletion/recovery contract is complete.

## Validation

- Node accounting/store/import/backup/auth tests: 10 passing.
- Civil-date suite tested in Asia/Dhaka and America/Los_Angeles.
- Production SQL tests run in a transaction and rolled back; no synthetic SQL fixtures remain.
- Production security advisor no longer reports disabled RLS or publicly callable/mutable-search-path profile trigger. Leaked-password protection remains disabled; configure before broader public launch: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- Production build passed.

## Deployment and rollback

Deploy through the existing GitHub-linked Hisab Vercel project. Verify the production deployment commit and https://hisab-psi-eight.vercel.app in the signed-in test account before marking LIVE rows DONE.

Do not simply redeploy the old frontend after users have saved canonical workspaces: old clients use separate legacy tables. A rollback needs a compatibility build that reads the workspace, or an explicit export/migration of the latest workspace data. The legacy write guard deliberately prevents stale tabs from overwriting newer records. Database history is private to the owner and records prior workspace revisions.

Full-workspace snapshots are appropriate to this release's small data set; pagination, bounded history retention and large-record performance testing remain public-launch work. A second real user/browser sign-in and backup restore into a fresh account remain acceptance checks beyond mocked account-switch tests and database role tests.
