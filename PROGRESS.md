# Current checkpoint

## Active outcome

Owner paused physical testing after production defects and authorized consolidating latest repairs into one CI PR and staging deployment. Branch fix/booking-entry-identity-loading is based on accepted production/main bd8c4b3e4213c1ed91988ba02a8cf6b099386de7 (PR60). The consolidated candidate is being published as a ready PR under explicit owner instruction. Production merge/deployment of this new candidate is not authorized.

## Candidate scope

- Share bounded identity preparation across hero, skip and banner/direct Book Now, with the original full-page loader and no subsection loader or duplicate refresh. Repair the known same-route entry edge before publication.
- Manage saved contact keeps a full loading transition until identity/profile settle; no unsigned/signed-in card flicker. Profile top-left Back returns to booking options.
- Calendar first reveal waits for actual cached-month coverage readiness; switching prepared months has no small loader. Background refresh retains loaded display and fresh-booking guards.
- Details-to-Review validation/contact save runs without blocking overlay. Review Turnstile uses interaction-only appearance with server verification intact.
- Email-block notice has spacing above and only centred MM:SS below its message.
- Owner clarified and confirmed overlapping codes: each issued code expires120seconds after issuance; a replacement does not cancel it. Requests can overlap code validity, while the third successful request starts a fixed600second block on further requests. Existing session/IP/email limits and one-use/ownership protections remain. Third success remains successful; red block notice appears on a denied later request.
- Editable unheld selections crossing the four-hour cutoff are removed automatically; red “Session no longer available.” notice lists affected dates/times, preserving valid survivors and contact. Held/payment recovery remains authoritative.

## Verification and delivery

PR60 head446d211 passed CI43140366298, staging43141805507 attempt2, then mergedbd8c4b3. Main CI43142846008 and production43144157994 passed, with migration0046 and enabled booking/warming/HitPay recovery plus ongoing email delivery. Production payments remain sandbox. Separate assistant public-health request returned403; deployment health/settings checks passed.

Consolidated local verification passed: complete code checks with317 frontend tests; recovery170/170; independent OTP audit found no blocker. Inventories are317 frontend and505 Worker cases (128/207/170). Original comment-policy and isolated mutation-fixture scan failures are retained under /tmp/consolidated61-*; both were corrected before passing verification. A final lifecycle documentation correction follows the application receipts. Browser execution remains CI/owner-only. Push one consolidated PR, verify exact-head gates, then deploy verified staging artifact and public-health check. Preserve original production defect evidence, including testFull-turnstile.devtools and11:20SGT lead-time transition. No live bookings, payments, emails or provider schedule changes.
