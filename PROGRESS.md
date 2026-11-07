# Current checkpoint

## Current change

Branch `fix/confirmation-section-order`, based on main `fef8751` (released PR39). Confirmation details now contain Your Sessions, Booking Contact, Location and Before Your Session. Order Summary and Total Paid remain visible below the disclosure. Paid moves beside the large total on mobile and desktop; session circles align with the heading. Viewed calendar dates regain a blue outline and soft background; only cart dates have filled navy circles.

## Verification and delivery

PR40 contains the confirmation/calendar presentation changes. Added a conflict-reload fix: this tab retains its rejected calendar draft rather than automatically adopting another tab’s current checkout. All82 focused checkout/storage/confirmation tests pass. Existing browser assertions cover disclosure visibility, session alignment and active-date highlighting; browser execution remains CI/owner-run. No test titles or inventories changed. Scoped lint, source integrity, TypeScript and formatting passed; no staging or production change for this candidate. CI42383885392 exposed an obsolete confirmation-order assertion; corrected with10 local cases passing. Final-head CI is pending.

## Payment-link recovery follow-up

Prepared one creation plus four read-only recovery attempts, a dedicated unavailable screen, redacted OTEL incident input/output and dashboard query. Future Grafana contact point is explicitly not set; no monitoring activation. User authorized CI, staging then merge after consolidation. 58 HitPay/telemetry runtime tests and26 confirmation tests passed, plus the extended context/webhook case and types/lint/source checks. Unknown SimplyBook creation release remains unsupported without provider-backed no-creation proof.

## Remaining scope

Calendar date-switch scroll/flicker diagnosis and full selected-slot highlighting remain pending. Unknown provider creation reconciliation, production Grafana activation and analytics/Search Console/OpenGraph remain separate scope. Docs PR33 remains paused.
