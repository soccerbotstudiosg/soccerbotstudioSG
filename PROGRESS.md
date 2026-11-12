# Current checkpoint

## Active outcome

Consolidate email-address request limits and owner-requested email UI fixes on feat/email-address-request-limit, based on production/main3f12c6404f24beae683fbc6822d16a37454093eb. Owner authorized one CI PR for staging. Production remains the accepted base; no deployment of this candidate yet.

## Candidate

Migration0046 adds normalized keyed-email limits alongside session/IP, preserving existing counters/history. Successful code requests always show120 seconds, including request3, while the server keeps its fixed600-second third-request block. A denied later request shows “Too many code requests. Try again later.” and the remaining timer below. Issued codes still verify; denials do not extend deadlines or rewrite already-observed blocks.

Email UI clears stale missing-proof guidance on valid proof and entry reset; unrelated errors remain. Verified/restored choices become one full-width Welcome back card with no Guest card or header Sign out. Eligible secondary actions share one row; Manage saved contact remains remembered-only. Initial restoration has a visible bounded loading state, then signed-in/unsigned choices, with stale replies fenced. Autofill was already configured and remains unchanged. Distinct aliases remain distinct identities; owner clarified the reported all-device signout case used different aliases, and production revocation audit found no same-address failure.

## Evidence and next action

Owner reports other email tests passed on production3f12c64; that acceptance does not cover this later candidate. Email backend58/58, migration/group guards9/9, all tooling188/188, populated46-migration SQLite/D1 preservation checks and independent review passed. Missing0046 mutation produces2emails instead of1; restored source passes. Frontend inventory309 and Worker inventory504(128/207/169); browser titles/counts unchanged. Complete consolidated frontend/affected Worker verification, publication, exact-head CI and staging are next. Retain original failed main CI42994909211 and its test-only PR59 repair history in Journey. Domain/WAF, booking-notification formalization and physical acceptance remain separate; no live email/payment/provider changes are authorized by these checks.
