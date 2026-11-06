# Current checkpoint

Observed 6 November 2026 (Singapore). History: [Journey](docs/journey.md).

## PR32 consolidated gallery, closing banners and footer app links

Branch `fix/hero-session-copy`; baseline `a77aef6` passed CI42169819231, CodeQL42169815176 and staging42170759529 with matching public health. PR32 remains open/unmerged; settings unchanged. **Do not merge or enable settings.**

Current owner direction: Studio tagline directly below header/above video; all five light picture/content rows form one continuous group with top/bottom outer curves, no internal gaps, and no gap before the separate Book now banner. Both closing banners centre content, target30% lower minimum height (192→134px) with proportionate type/spacing, share soft radial gradient styling and meet the unchanged footer without a gap. Contact CTA uses a tonal peach fill with dark text/border. Promotional CTAs use larger bold italic theme-heading type; closing-banner controls remain proportionate to their reduced height.

Homepage second/third promotion height/spacing/heading targets scale by0.90/0.78; natural mobile Studio photo and curve clearance remain protected, and content may grow rather than clip. Idle custom cursor becomes gentle grey; interactive/text/disabled cursor behavior stays unchanged. Footer adds a fourth Download App column with Apple, Android and web icons using the same component/destinations as the popup; all footer assets centre together without the legacy logo offset. Studio outer curves overlay the pictures rather than grey padding; footer blue-background proposal was cancelled and no such restyling is included.

Extend existing public-route/popup geometry and destination checks, plus contrast mutation coverage, without changing test inventory. Verify the consolidated candidate, publish to PR32 and check exact-head CI/staging. Browser/device and post-merge A–D acceptance remain owner-operated. Final delivery receipt belongs in PR32.

## Remaining work

- Review the local mobile correction and revised worksheet. Run consolidated verification, publish to PR32, then verify exact-head CI and staging. **Do not merge or enable settings.** Owner visual acceptance remains pending.
- Provider decision remains ten-minute timeout; screenshot shows10 selected, but saving/effective new invoice deadline still needs owner verification. App timing remains8-minute payment,1-minute checking,3-minute recovery. [A–D worksheet](docs/uat/simulated-user.md#ad-acceptance-worksheet) remains owner-operated and pending.
- Domain connection/WAF/rate-limit work is deferred until owner tests are finalized. Read-only inspection found soccerbotsg.com active in Cloudflare but no production Worker custom domain; managed rulesets listed, no custom edge-rate-limit ruleset established. This is not evidence of protection for the workers.dev route.
- Wider external work remains in [Runbook](docs/runbook.md), [Admin UAT](docs/uat/admin.md) and [Trainer UAT](docs/uat/trainers.md).
