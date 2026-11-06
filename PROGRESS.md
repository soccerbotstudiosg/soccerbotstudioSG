# Current checkpoint

Observed 6 November 2026 (Singapore time). History belongs to [Journey](docs/journey.md).

## Public homepage and Studio redesign — PR32

Branch `fix/hero-session-copy`, based on merged main `a4185c8`. The owner supplied the missing local handover and requested completion on [PR32](https://github.com/soccerbotstudiosg/soccerbotstudioSG/pull/32). Earlier presentation polish remains included. The five new UI tasks are implemented:

- Rectangular Singapore flag immediately left of the three public header buttons.
- Persistent mock assistant, reply service/contract, icon/styles and two obsolete component tests removed; enquiry remains separate and preview-only.
- Two full-width navy/teal promotional image banners with a small gap and **Explore the studio** / **Book now** CTAs; original main hero and contact banner preserved.
- Full-width official image hero at the top of Studio, then a 12px gap and all five existing content sections.
- Enlarged two-line clickable hero address (18px / 14px), preserving the on-demand location dialog.

Official `/en` and `/en/studio` pages were accessible and rechecked; the earlier handover's network blocker is resolved. Existing local official images and provenance are reused; no remote video/autoplay or browser execution was added. Updated existing browser cases cover flag order, full-width banners, distinct backgrounds, Studio hero/content, address typography/dialog, enquiry without assistant and booking CTA navigation. Two retired assistant-only cases are removed from the strict inventory; no remaining coverage is skipped or weakened.

## Immediate remaining work

- Complete local non-browser validation, publish the consolidated candidate on PR32, then verify its exact-head CI and staged revision. Record final results in the PR receipt without another status-only commit. Earlier green CI42137785715 and staging42139117805 belong to pre-redesign `7f50759` and do not accept this candidate.
- Owner reviews the new staged presentation on desktop, phone and tablet under [Customer UAT](docs/uat/simulated-user.md). **Hold PR32 open and unmerged until explicitly asked to merge.**
- Owner decision: **retain the two-minute experiment and hold activation**. No provider timeout or eight-minute payment/one-minute checking/three-minute recovery policy change is included. Provider invoices remain authoritative; incomplete unassociated creation still needs assistance. See [provider settings](docs/external-providers-config.md).

## Separate owner/provider acceptance

The handover's wider work remains in its existing owners: booking conflict/expiry/late-payment/reload/multiple-session UAT; release runtime/resource/health and custom-domain/live-merchant acceptance; Resend sender/DNS and identity-email acceptance; uninstalled SimplyBook notification templates and preview-only enquiry; individual provider staff/trainer roles/MFA/access; Grafana attachment/ingestion/redaction/alerts; security/offboarding/renewal/recovery evidence. See [Runbook](docs/runbook.md), [Security](docs/security/security-infrastructure.md), [Admin UAT](docs/uat/admin.md) and [Trainer UAT](docs/uat/trainers.md). These require the named external setup or owner execution; they are not silently implemented or accepted by this UI PR.

PR31 merged main `a4185c8` passed independent verification and production deployment. That proves installation, not current activation or provider/device acceptance. Direct production health from this workspace is blocked by the network policy; staging health is accessible. Preserve shared studio capacity, D1/DO identity and existing sandbox/live boundaries.
