# Hisab Phase 1 release report

Updated 6 October 2026 (Asia/Dhaka). **Phase 1 implementation: DONE and deployed to production.** The fresh-account recovery drill and owner review of historical data remain open acceptance checks. Phase 2 simplification and Phase 3 public onboarding are outside this release; this report does not declare the full public launch ready.

Live app: [Hisab](https://hisab-psi-eight.vercel.app). Implementation merged in [PR #1](https://github.com/ibrahimshimanto/Hisab/pull/1) and [PR #2](https://github.com/ibrahimshimanto/Hisab/pull/2).

## Completed work

| Plan ID | Status | What changed | Evidence and limits |
|---|---|---|---|
| FIN-01 | DONE — LIVE | Shared finite, positive, two-decimal money validation; server validation; visible errors | Live negative expense rejected without closing the form; valid decimal saved once and survived reload. Invalid amounts and budget limits covered by regression and production SQL tests. |
| FIN-02 | DONE — LIVE | Separate opening balances, earned income, transfers, savings, adjustments and refunds | Live labelled opening wallet persisted with one `opening` record. Tests confirm opening funds excluded from income, refund offsets expense and internal movements conserve tracked assets. Old ambiguous entries require review. |
| FIN-03 | DONE — LIVE | Atomic revisioned workspace save, durable operation IDs, stable form IDs and bill month guard | Production SQL verifies duplicate retry, stale revision conflict and rollback. Store tests cover repeated form/bill actions. Live records persisted with correct balances. |
| FIN-04 | DONE — LIVE | Quoted CSV parser, exact account mapping, preview, all-or-nothing import and duplicate rejection | Live quote/newline description survived, Other MFS mapped correctly and balance changed by the imported expense. Reimport showed one duplicate and disabled import. |
| FIN-05 | DONE — LIVE | Local civil dates for entry defaults, grouping, reports and calendars | Live local-day grouping corrected. Automated boundary tests pass in Asia/Dhaka and America/Los_Angeles. Impossible dates rejected. |
| DATA-01 | DONE — production | RLS enabled on six legacy tables and three workspace tables; owner and reference checks; anonymous access revoked | Production role tests cover signed-out denial, cross-owner reads/writes/references and forgery. All nine tables have RLS enabled. A second real-user browser check remains in the release matrix. |
| DATA-02 | DONE — LIVE | Per-user cache, checked cloud errors, durable pending saves, retry, conflict handling, stale-response protection | Tests cover network failure, retry ID stability, conflict, account switch and stale responses. Live Pending changed to Cloud saved and reload retained records. Real multi-device offline/session-expiry drills remain open. |
| DATA-03 | DONE — LIVE implementation; fresh-account QA PENDING | Full versioned JSON backup, validated preview, preserved pre-restore/pre-reload copies and private revision history | Live export text contained all 14 persisted field groups. Same-account restore of 3 accounts, 11 transactions, budget, savings goal, bill and preferences committed; database equality check against the prior revision was true. Preserved copy remained available after reload. Fresh-account restore is not yet demonstrated. |
| DATA-04 | DONE — LIVE | Removed name-based demo purging and automatic account consolidation | Existing legacy rows preserved; old unscoped device copy stays separate and exportable. Account names are not used for destructive cleanup. Public isolated demo belongs to Phase 3. |
| DATA-05 | DONE — LIVE review tool; owner reconciliation PENDING | Historical review with classification/account-link preview and explanation; no silent correction | Review flags every unclassified legacy entry and missing account link. Production's 14 historical orphan rows remain intact. Owner confirmation is needed to resolve affected records. |

## Data preservation and recovery

Production inspection initially found RLS disabled on all six legacy tables. Policies existed but were inactive. This was a critical access-control issue; RLS and grants are now enforced and tested. There is no evidence in this bounded work establishing whether any past unauthorized access occurred.

All 28 original production transaction rows remain intact. Fourteen historical transactions have no matching same-owner account; no account, amount or classification was guessed. New saves use one private canonical workspace. Legacy tables remain readable as a migration source, but old app tabs cannot overwrite canonical data once a workspace exists. Refresh old tabs after this release.

The unscoped device copy is not assigned or uploaded to an account whose ownership cannot be established. Restore and conflict reload preserve a device copy before replacing data, and cloud saves retain prior revisions. The unsafe Settings reset was removed until its deletion/recovery contract is implemented.

The test account retains three clearly identified synthetic additions from this release: decimal expense, quoted CSV expense and opening wallet. No real money moved. Test backup files and screenshots stay local; they are not committed to the public repository.

## Verification completed

- 11 accounting/store/import/backup/auth regression tests pass in each of Asia/Dhaka and America/Los_Angeles.
- Production build passes.
- Production SQL assertions pass in a transaction rolled back afterward; no SQL test fixtures remain.
- Live negative amount, decimal save/reload, quoted CSV/account mapping, repeated import, custom account/opening balance and same-account full restore checks pass.
- Same-account restore committed revision 4, exactly matching revision 3's full workspace; all legacy transactions remain preserved.
- No captured console warnings/errors during the final Settings reload and recovery check. This is limited to the tested session, not a claim of zero errors across the product.
- Browser download automation was inconclusive. The live explicit download link and readable full-backup text fallback were verified, and the fallback payload was used for the restore. Automatic file download is not claimed verified across browsers.

## Deployment evidence

Application commit `632b2886c30caa5a1c9c57526e30b729fa81e5b3` is merged into `main`. Vercel production deployment `dpl_7GvHhUYadoAnUembwTXHEf7oTwBR` reached READY and owns `hisab-psi-eight.vercel.app`; the updated labels, backup controls and successful restore were verified on that live alias. Three versioned SQL migrations have been applied to the existing production Supabase project. A subsequent documentation-only commit updates this report and does not change the verified application code.

## Open acceptance and launch checks

- Fresh authorized test-account backup restore and independent second-user/browser sign-in.
- Real offline, expired-session and concurrent multi-device recovery drills.
- Owner review/reconciliation of historical missing links and ambiguous classifications, after backup.
- Enable leaked-password protection before broad public launch; it remains the security advisor's outstanding warning. See [Supabase password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
- Phase 2 accessibility, mobile layout, emergency-fund default and product simplification; health advice still needs its insufficient-data/product treatment even though accounting inputs are corrected.
- Phase 3 public landing/demo/onboarding/help; Phase 4 real-device, large-ledger performance, monitoring and recovery drill.

## Rollback limits

Do not simply redeploy the old frontend after canonical workspace saves: old clients use legacy tables. A rollback requires a compatibility build reading the current workspace, or an explicit export/migration of the latest data. The legacy write guard intentionally prevents stale tabs overwriting newer records.

Full-workspace snapshots fit this release's small dataset. Pagination, bounded history retention and large-record performance testing remain public-launch work.
