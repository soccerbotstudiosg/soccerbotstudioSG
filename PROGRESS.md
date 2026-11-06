# Current checkpoint

Observed 6 November 2026 (Singapore). History: [Journey](docs/journey.md).

## PR32 footer refinement

Branch `fix/hero-session-copy`; baseline0c79157 passed CI42175078630, CodeQL42175073956 and staging42176139791, with public health confirming the exact revision. PR32 remains open/unmerged; settings unchanged. **Do not merge or enable settings.**

Latest requested footer order: Services (Book, Studio, Terms of Service, Privacy Policy, Refund Policy), Connect With Us (WhatsApp, Email, Instagram, Enquire), Find Us (flagship studio/address), Download App (three icons in one horizontal row, logo underneath). Retain the pure-white footer and empty white legal placeholder bodies. New Refund Policy route joins the two existing legal placeholders; approved legal text remains pending.

Preserve the verified sticky header, accessible scroll reveals, corrected gallery curves without grey spacers,107px closing-banner minimum-height target and visible Studio blue-to-navy gradient. Current footer changes require local code verification and exact-head CI/staging. Test inventory stays unchanged; export requirements increase13→14 routes. Final immutable delivery evidence belongs in PR32.

## Remaining work

- Review the local mobile correction and revised worksheet. Run consolidated verification, publish to PR32, then verify exact-head CI and staging. **Do not merge or enable settings.** Owner visual acceptance remains pending.
- Provider decision remains ten-minute timeout; screenshot shows10 selected, but saving/effective new invoice deadline still needs owner verification. App timing remains8-minute payment,1-minute checking,3-minute recovery. [A–D worksheet](docs/uat/simulated-user.md#ad-acceptance-worksheet) remains owner-operated and pending.
- Domain connection/WAF/rate-limit work is deferred until owner tests are finalized. Read-only inspection found soccerbotsg.com active in Cloudflare but no production Worker custom domain; managed rulesets listed, no custom edge-rate-limit ruleset established. This is not evidence of protection for the workers.dev route.
- Wider external work remains in [Runbook](docs/runbook.md), [Admin UAT](docs/uat/admin.md) and [Trainer UAT](docs/uat/trainers.md).



Connect With Us uses icons instead of visible platform labels for WhatsApp, email and Instagram, retaining readable contact values and accessible platform names. Enquire is the final text link.

Latest visual corrections: stage offscreen sections transparently before a clear650ms/32px entrance, with immediate reveal for focus/reduced motion and cleanup. Closing-banner heading, supporting copy and CTA share centred alignment and balanced columns, stacking centrally on phones. Phone header flag and two navigation buttons align together at the right.

Booking routes, confirmation and experiment checkout are excluded from scroll reveals; their components remain static, retaining existing confirmation/invoice popup behavior. On phones the Studio tagline/video intro fills the first viewport below the measured sticky header, with cover video and controls; gallery begins below the fold.

Mobile Studio video uses the official homepage hero-loop.mp4 montage with a centred portrait cover crop; desktop retains stream.mp4. Both retain native controls, playsInline, no autoplay and no preload. The responsive source owner is studio-hero-video.tsx with canonical media provenance in media.ts. Footer headings are16px, details14px, contact icons20px and app icons26px within44px controls; four desktop columns become two on tablets and one on phones.

Public pages show a centred floating up-chevron after200px scrolling. Its icon gently floats; clicking restores header focus and scrolls to the top. Reduced motion disables floating/smooth scrolling. The control is absent throughout booking, confirmation and experiment checkout. Check it on phone/desktop alongside existing public-section motion; no payment/navigation authority changes.
