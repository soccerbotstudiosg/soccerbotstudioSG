# Current checkpoint

Observed 6 November 2026 (Singapore). History: [Journey](docs/journey.md).

## PR32 tighter shared banner layout and summary labels

Branch `fix/hero-session-copy`; baseline `2cffbb5` passed CI42160801361, CodeQL42160796846 and staging42161812100 with matching public health. PR32 remains open/unmerged; settings unchanged. **Do not merge or enable settings.**

Thin-strip refinement: retain the existing header; make only Performance · Experience · Production stand out with the much darker neutral blue-grey background (#252d38) and bold white text. The existing white-on-signature contrast audit covers this token.

Current refinement: Contact and Studio booking footer share a tighter1080px content target,24px gaps and centred eyebrow over each heading; Contact stays bottom-aligned and the straight Studio footer centres content vertically. The flag is vertically centred with the header buttons. All former right-arrow action icons use the shared chevron, with existing direction transforms retained. The shared booking summary displays provider-derived service name · Apex @ Henderson in bold with player count below; venue remains existing single-outlet configuration, not new routing authority.

Verify the complete candidate, update the existing PR, and confirm its exact-head CI/staging. Existing presentation, navigation and summary tests remain applicable; inventories and booking/payment guards unchanged. Final delivery receipt goes in PR32. Physical visual and post-merge A–D acceptance remain owner-operated.

## Remaining work

- Review the local mobile correction and revised worksheet. Run consolidated verification, publish to PR32, then verify exact-head CI and staging. **Do not merge or enable settings.** Owner visual acceptance remains pending.
- Provider decision remains ten-minute timeout; screenshot shows10 selected, but saving/effective new invoice deadline still needs owner verification. App timing remains8-minute payment,1-minute checking,3-minute recovery. [A–D worksheet](docs/uat/simulated-user.md#ad-acceptance-worksheet) remains owner-operated and pending.
- Domain connection/WAF/rate-limit work is deferred until owner tests are finalized. Read-only inspection found soccerbotsg.com active in Cloudflare but no production Worker custom domain; managed rulesets listed, no custom edge-rate-limit ruleset established. This is not evidence of protection for the workers.dev route.
- Wider external work remains in [Runbook](docs/runbook.md), [Admin UAT](docs/uat/admin.md) and [Trainer UAT](docs/uat/trainers.md).
