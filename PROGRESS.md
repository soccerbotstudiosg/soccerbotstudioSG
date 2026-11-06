# Current checkpoint

Observed 6 November 2026 (Singapore). History: [Journey](docs/journey.md).

## PR32 muted-orange Contact banner

Branch `fix/hero-session-copy`; baseline `bf8e57f` passed CI42164028674, CodeQL42164022847 and staging42164958647 with matching public health. PR32 remains open/unmerged; settings unchanged. **Do not merge or enable settings.**

Owner confirmed the bottom Contact banner for a new muted burnt-orange treatment. Apply scoped #d99058 with soft abstract highlights, navy text and navy/white action states; preserve its straight edges, compact geometry and alignment. The Studio footer retains its navy treatment. Light homepage/Studio image sections, restored original performance strip, header, booking states and all other behavior remain unchanged.

Extend existing contrast/mutation and public-route palette assertions without adding test cases or changing inventories. Reconcile current presentation owners, verify the consolidated source, publish to PR32 and verify exact-head CI/staging. Physical visual and post-merge A–D acceptance remain owner-operated; final delivery receipt belongs in PR32.

## Remaining work

- Review the local mobile correction and revised worksheet. Run consolidated verification, publish to PR32, then verify exact-head CI and staging. **Do not merge or enable settings.** Owner visual acceptance remains pending.
- Provider decision remains ten-minute timeout; screenshot shows10 selected, but saving/effective new invoice deadline still needs owner verification. App timing remains8-minute payment,1-minute checking,3-minute recovery. [A–D worksheet](docs/uat/simulated-user.md#ad-acceptance-worksheet) remains owner-operated and pending.
- Domain connection/WAF/rate-limit work is deferred until owner tests are finalized. Read-only inspection found soccerbotsg.com active in Cloudflare but no production Worker custom domain; managed rulesets listed, no custom edge-rate-limit ruleset established. This is not evidence of protection for the workers.dev route.
- Wider external work remains in [Runbook](docs/runbook.md), [Admin UAT](docs/uat/admin.md) and [Trainer UAT](docs/uat/trainers.md).
