# Current checkpoint

## Active outcome

Simplify remote email revocation to protected saved-contact entry: Booking Details and Manage saved contact return to guest/email choices with the sign-out notice. Already-entered details continue through checkout. Branch `fix/revoked-session-recovery` starts at PR66/main `0abaf9d2a94322f91c1710dafaa11878b793f310`. Prior release is complete; this repair is not deployed.

## Current implementation

Saved-profile fetch moves to Details behind the standard message-free full loader. No extra calendar/session checks or persistent checkout lock. Optional profile save skips confirmed identity revocation without blocking booking; explicit profile editor still redirects. Migration0048 separates all-device email revocation from remote booking-capability revocation, preserving local logout/token replay safeguards and never reviving old capabilities.

## Evidence and next step

All28 isolated Worker identity tests pass after the database-trigger correction; preserved failure evidence and final behavior are in Journey. Final full unit/component suite passes336 tests; all28 isolated Worker identity tests, types, lint and source integrity pass. Foundation migration checks pass; the release migration guard now exercises0048 and checks preservation. No live provider effects or assistant browser execution. Draft PR67 is published via LimYouSheng at c623ddcf3ac3bc31ff9a04c3f20dc45a98487d81. Initial CI43238485689 hit a GitHub503 before frontend tests and an obsolete browser assertion expecting early contact fetch. Correct the assertion to require no pre-Details contact read and push the same PR; CI, staging, merge and physical acceptance remain separate. No new staging/merge authorization is inferred from completed PR66.
