# Current checkpoint

Observed 5 November 2026. Historical evidence belongs in [Journey](docs/journey.md).

## Current task — Full-recording UI fixes and CI preparation

Local branch `fix/booking-price-alignment` is based on merged main `eb0649475c9fe80a4349d87dc945fccbb7bba06b`. The consolidated UI changes are implemented: restoration gate, persistent disabled refresh control, correct external-checkout guidance, cart spacing/cards/remove control, trainer/price alignment, consistent Edit links, review divider/unit-price removal and larger total. Single-session Paid/amount aligns with the trainer; aggregate multi-session totals remain separate. Currency notes remain left aligned. The restoration regression failed before repair; all49 selected component tests pass. Full non-browser verification passed: 251 frontend tests, 184 tooling tests, 58 installer checks, source/policy/format/lint/type checks, dependency audit, production build and export validation. Push CI and mark the PR ready as authorized. Browser/CI/staging acceptance remain distinct.

## Immediate remaining tasks

1. Publish the locally verified consolidated branch and mark the PR ready for staging; exact-head CI and staging deployment/owner acceptance remain pending. No merge or production deployment is authorized by this request.
2. Resolve the separate late-payment release contract before changing8/13/15-minute application deadlines to8/9/10. A dispatched HitPay request currently prevents automatic expiry release; neither15 minutes nor an expired link proves safe rebooking. Do not replace uncertain-payment guidance with permission to pay again.
3. Diagnose failed three-month warming and add authoritative day-refresh behavior after safe release. HAR December/January requests took4.887/17.927 seconds with correlated cache misses. Test D returned `checkout_already_active`; shared-capacity acceptance remains pending. See [retained findings](docs/journey.md#5-november-2026--full-recording-review-and-consolidated-ui-follow-up).
4. Resume owner A–D checks after staged changes are accepted. December/January test availability was entered; [provider configuration](docs/external-providers-config.md#decemberjanuary-test-availability--5-november-2026) records cleanup scope. No cleanup was performed.
