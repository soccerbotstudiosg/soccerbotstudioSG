# Admin UAT — two-page checklist

## Page 1 of 2 — account, schedule and booking controls

- **Record:** tester/date;
  - URL/environment; deployed SHA/run; browser/device;
  - SimplyBook company/role;
  - HitPay merchant/mode; inbox; partner; service/trainer/date; private booking/invoice references.
- **Results:** Pass / Fail / Blocked / Not tested per item; preserve failure evidence and retest IDs.
  - Missing permissions/fixtures remain Blocked;
  - CI does not prefill acceptance.
- **Boundary:** owner-operated approved test fixtures; no shared owner credentials, destructive cleanup, unapproved live transactions, DNS edits or financial changes.
  - Restore only agreed schedules; retain booking/payment history.

- [ ] **Company and roles — ADM-001,009,016–019.** Sign in; confirm plan/features and actual staff matrix; locate daily bookings/contact under permitted roles; compare trainers; sign out/Back/refresh; review MFA, recovery and escalation.
  - **Expect:** correct company/role; restricted records/actions denied; website contact still requires identity proof; cancellation, rescheduling and refunds have authorised operators and separate consequences.
- [ ] **Service settings — ADM-002–003.** Compare services, eligible instructors, player fields, invoice settings, Singapore timezone, date-specific hours, special days, lead time and timeout with the site.
  - **Expect:**40-minute session +10-minute changeover;1–4 players; four-hour cutoff; correct staging/client prices; weekly days off; approved fixed grid.
    - Verify saved10-minute timeout and fresh invoice due time; screenshot selection alone is insufficient.
- [ ] **Schedules — ADM-006–008.** Enter/save/reopen designated availability; add/restore an unused-date break/day off; inspect inactive trainer/service assignment fixture; measure website propagation.
  - **Expect:** eligible active roster only; no hidden partial lists; unrelated dates/trainers/history preserved; existing bookings not silently reassigned.
    - Fresh reads/warming reveal edits; no admin push invalidation is promised.
- [ ] **Shared studio — ADM-004,040.** Verify one shared resource across services/trainers and account-wide limit one with admin override disabled; coordinate competing customer/admin and cross-trainer bookings.
  - **Expect:** no overlapping second booking, including changeover; record actual provider outcomes before enabling overlapping schedules.
    - UI availability alone is insufficient.
- [ ] **Grid boundaries.** Use approved manual13:00–13:50 booking, short/broken intervals, exact interval edges and14:00–16:00 trainer availability; retain stale customer selection before a manual edit.
  - **Expect:** nine public starts; manual booking blocks12:50/13:40; only14:30 fits the example window; no payable rejected selection; preserve manual records and unrelated availability.
    - Record interval payload shape/capacity/buffer evidence.
- [ ] **Booking reconciliation — ADM-010–015.** Inspect customer single/multi, double-submit, expired, paid-but-reconciling, uncertain-write and late-settlement fixtures; compare actual notification inbox.
  - **Expect:** correct sessions/customer/trainer/amount/currency and one association/payment; original references retained; no deletion/rebooking/manual paid override; one intended correct notification.

<div style="break-before: page;"></div>

<a id="cloudflare-domain-dns-and-https-checks"></a>

## Page 2 of 2 — payments, infrastructure and staff readiness

- [ ] **HitPay access/configuration — ADM-020–021,029.** Confirm merchant, sandbox/live mode, roles/MFA, payment methods, SGD and owner-verified settlement destination; sign out/Back/refresh.
  - **Expect:** correct merchant and permitted access;
    - SimplyBook role grants no HitPay rights; no bank details or secrets copied into evidence; sandbox does not prove payouts.
- [ ] **Payment reconciliation — ADM-022–028.** Compare single/multi/duplicate-submit payments; unpaid/failed/expired examples; configured return/webhook destinations; supported delivery/readback evidence; duplicate/delayed callbacks and late settlement; prepared refund/partial-refund and settlement reports.
  - **Expect:** exact references/amount/currency; authoritative paid evidence, not return-page/HTTP success; no duplicate accounting/notification; uncertain original attempt preserved; no manual production callback replay.
    - Cancellation ≠ refund; payment ≠ payout; fees/refunds/net differences explained; unavailable evidence Blocked.
- [ ] **Cloudflare domain, DNS and HTTPS checks — ADM-030–037.** Record exact hostname/zone/DNS and hosting account IDs; inspect owner/registrar records, nameservers, A/AAAA/CNAME/TTL/proxy/flattening, Worker route, certificate/CAA, optional SaaS prerequisites, apex and subdomain HTTPS separately; inspect cookies/same-origin API, renewal/alerts and rollback sheet.
  - **Expect:** intended accounts/targets; trusted certificate, no loops; no accidental mail-record changes; registrar ownership distinct from DNS; subdomain success does not accept apex; initial issuance does not prove renewal; unavailable access Blocked.
    - No DNS mutation; app404.ai excluded.
- [ ] **Release pipeline.** Inspect human same-repository PR gates and exact staged revision/health; verify bot/fork/superseded-head exclusion.
  - After separately authorised merge, inspect fresh production gates/account, original D1/coordinator, `apac-ne` configuration and closed Workers.dev health.
  - **Expect:** tested artifact retained; actual placement claimed only with evidence; credentials/old deployer retirement completed before ownership activation.
    - PR32 currently must not merge or activate settings.
- [ ] **Individual mobile staff.** Confirm plan/seats, individual emails/provider mappings, actual mobile interface; test allowed/denied junior duties, recovery/offboarding and trainer isolation before owner invitations.
  - **Expect:** approved daily-booking/contact/WhatsApp duties only; create/edit/cancel only if explicitly allowed; billing, API/integrations, exports, refunds and unrestricted access denied unless approved/supported.
    - Record unavoidable broader access; no invented role restrictions or phone-number login.
- [ ] **Notifications — ADM-005.** Review draft variables, actual trigger/recipient mapping, paid multi-session totals/final invoice, trainer isolation, duplicate delivery and failure handling with approved preview/test inbox.
  - **Expect:** Resend owns identity email;
    - SimplyBook owns booking notifications; no paid-success wording for pending/failed/cancelled bookings; unresolved placeholders never sent; delivery failure does not change confirmed booking/payment.
    - Draft installation remains on hold.
- **Close:** counts ___; defects/retest IDs ___; private evidence ___; restored schedule ___; tester/date ___; owner acceptance/exceptions/follow-up ___; unobserved settlement/renewal/provider behaviour stays unverified.
