# Current checkpoint

Observed 6 November 2026 (Singapore). History: [Journey](docs/journey.md).

## PR32 tighter shared banner layout and summary labels

Branch `fix/hero-session-copy`; baseline `9683d21` passed CI42156462614, CodeQL42156457725 and staging42157690103 with matching public health. PR32 remains open/unmerged; settings unchanged. **Do not merge or enable settings.**

Thin-strip refinement: retain the existing header; make only Performance · Experience · Production stand out with the existing teal identity background and bold white text. Add the white-on-identity contrast pair to the existing audit.

Current refinement: Contact and Studio booking footer share a tighter1080px content target,24px gaps, bottom alignment and centred eyebrow over each heading. All former right-arrow action icons use the shared chevron, with existing direction transforms retained. The shared booking summary displays provider-derived service name · Apex @ Henderson in bold with player count below; venue remains existing single-outlet configuration, not new routing authority.

Verify the complete candidate, update the existing PR, and confirm its exact-head CI/staging. Existing presentation, navigation and summary tests remain applicable; inventories and booking/payment guards unchanged. Final delivery receipt goes in PR32. Physical visual and post-merge A–D acceptance remain owner-operated.

## Remaining work

- Review the local mobile correction and revised worksheet. Run consolidated verification, publish to PR32, then verify exact-head CI and staging. **Do not merge or enable settings.** Owner visual acceptance remains pending.
- Provider decision remains ten-minute timeout; screenshot shows10 selected, but saving/effective new invoice deadline still needs owner verification. App timing remains8-minute payment,1-minute checking,3-minute recovery. [A–D worksheet](docs/uat/simulated-user.md#ad-acceptance-worksheet) remains owner-operated and pending.
- Domain connection/WAF/rate-limit work is deferred until owner tests are finalized. Read-only inspection found soccerbotsg.com active in Cloudflare but no production Worker custom domain; managed rulesets listed, no custom edge-rate-limit ruleset established. This is not evidence of protection for the workers.dev route.
- Wider external work remains in [Runbook](docs/runbook.md), [Admin UAT](docs/uat/admin.md) and [Trainer UAT](docs/uat/trainers.md).
