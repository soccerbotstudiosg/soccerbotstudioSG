# Current checkpoint

Observed 6 November 2026 (Singapore). History: [Journey](docs/journey.md).

## PR32 consolidated public-page refinements and button shape

Published74e2f5e passed full local252-test/build/export verification; the follow-up standardizes all promotional CTA corners to match the header (3px/12px alternating), superseding that candidate for CI/staging.

Branch `fix/hero-session-copy`; baseline `98830de` passed CI42153487726 and staging42154510350 with matching health. PR32 remains open/unmerged. **Do not merge or enable settings.**

Owner's phone screenshot shows the Studio promotion's top curve covering the players' heads and its bottom curve overlapping the CTA. The mobile CSS now reserves the top curve's 40px outside the photo, renders this photo at its natural proportions, and preserves 40px extra bottom clearance after the CTA. The second/third sections now target25% lower image minimums and vertical spacing; actual height remains content-driven, and mobile Studio keeps its full photo. Typography and all booking logic remain unchanged.

Popup now shows icons and app names only, widens from max-w-xl to max-w-2xl and darkens only its backdrop from65% to90%; destinations and dismissal behavior remain unchanged.

Additional refinements: outlet trailing indicator removed, flagship/address separated, selected tint/outline shared with session cards; Contact description and CTA bottom-aligned with the heading; Bring your group centred above it. Focused selection tests passed2/2.

Validation: focused source/style checks, existing CI browser coverage and owner phone visual acceptance. No new executable cases or inventory changes for this CSS-only correction. Final exact-head CI/staging receipt belongs in PR32. One bounded repair iteration; no provider or settings changes.

The revised [A–D worksheet](docs/uat/simulated-user.md#ad-acceptance-worksheet) is prepared locally for owner testing after a future authorized merge/deployment/activation. Owner now authorizes pushing the consolidated refinements to PR32 for CI and staging; merge/settings remain on hold.

## Remaining work

- Review the local mobile correction and revised worksheet. Run consolidated verification, publish to PR32, then verify exact-head CI and staging. **Do not merge or enable settings.** Owner visual acceptance remains pending.
- Provider decision remains ten-minute timeout; screenshot shows10 selected, but saving/effective new invoice deadline still needs owner verification. App timing remains8-minute payment,1-minute checking,3-minute recovery. [A–D worksheet](docs/uat/simulated-user.md#ad-acceptance-worksheet) remains owner-operated and pending.
- Domain connection/WAF/rate-limit work is deferred until owner tests are finalized. Read-only inspection found soccerbotsg.com active in Cloudflare but no production Worker custom domain; managed rulesets listed, no custom edge-rate-limit ruleset established. This is not evidence of protection for the workers.dev route.
- Wider external work remains in [Runbook](docs/runbook.md), [Admin UAT](docs/uat/admin.md) and [Trainer UAT](docs/uat/trainers.md).
