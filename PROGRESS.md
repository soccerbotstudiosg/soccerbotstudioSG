# Current checkpoint

UI follow-up is prepared locally after owner production-sandbox testing. Broad documentation PR33 remains paused; dated evidence belongs in [Journey](docs/journey.md).

## Current change

- Branch: `fix/leave-booking-and-card-hover`, based on merged main `e23d203`.
- App popup: title case, centred icon/label pairs and close control aligned with heading top.
- Leave booking: header and first-step home links confirm discard; Stay preserves state. Leave clears editable draft/selection state and invalidates late UI replies, retaining existing attempt recovery snapshots and server expiry records.
- Footer: medium widths use a compact two-column grid; app content/logo aligns with Connect With Us, with32px text rows and24px group spacing.
- Session cards: two columns at medium widths, aligned label/amount price rows and outlet unit number on its own line.
- Hover: enabled unselected outlet/session/time cards and account options highlight; selected/disabled states remain distinct.
- Confirmation: centred Verified timestamp; View Full Details contains Your Sessions, Booking Contact, Order Summary and Location using Review styling, verified Total Paid and no Edit controls. Top actions and the disclaimer below remain unchanged.
- Verification: consolidated non-browser gate passed267 tests/56 browser definitions/14 exported routes in `expiry-conflict-final-code.log`, including expiry, consent and conflict fixes. Targeted mutation checks detected both original conflict defects. Browser/device verification remains CI/owner-run.
- Expiry: after the original checking window, return to calendar with empty cart and an affected-session red notice; keep payment/rebooking locked until server release. No extra home link or automatic cart restoration. Late payment returns to protected payment status.
- Conflict: unindexed conflicts recheck dates, preserve unaffected selections and name only removed sessions. Reload offers another tab’s differing checkout explicitly instead of replacing the draft.
- Review consent resets on leave/re-entry/reload while dispatched payment snapshots remain unchanged.
- PR34 is open and ready. Initial CI42339133920 caught browser expectations that still assumed retained Review consent and implicit disclosure alignment; repairs are consolidated for the next push, including the Leave booking step-guard navigation race and confirmation selectors. Worker contracts/recovery/sustained passed. Staging remains pending; production is unchanged.

## Deployed baseline

- PR32 merged as `e23d203`; independent main CI42251148911 and deployment42252782624 passed. Staging source `9ea535f` has the same application tree.
- Production runtime restored to approved HitPay sandbox testing on7 November. Missing IDENTITY_PEPPER installed after explicit owner approval; eight existing secrets/resources retained. Version `5619f5ac-f746-4aec-86aa-fde64f927c3a`.
- Customer access, sandbox checkout/recovery/webhook and warming enabled; identity email and token refresh-ahead disabled. Workspace public health returns403; owner browser/provider acceptance pending.
- No assistant booking/payment/cancellation/notification operations. Normal production redeployment restores closed defaults; activation is separately scoped.

## Documentation branch

- PR33 `docs/test-guides-and-reference-cleanup` remains paused.
- Queued reminder rule: clients/providers3 days and24 hours before; no provider configuration mutation or delivery claim.
- Preserve document-specific numbered menus, bullet formatting, in-place reconciliation, journals only in Journey and diagrams unless stale.
