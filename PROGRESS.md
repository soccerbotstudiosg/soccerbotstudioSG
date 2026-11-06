# Current checkpoint

Observed 6 November 2026. Historical decisions and evidence: [Journey](docs/journey.md).

## UI — publish and stage first

- Branch: `fix/hero-session-copy`; existing PR32. Do not merge or enable settings.
- Last verified staging revision: `904414b642ca4de2497601026ef0e269b13a72e9`; newer local changes require final CI/staging.
- Consolidated changes:
  - Desktop footer rows align with40% tighter pitch; logo aligns at the app-column bottom. Phones pair Services/Connect With Us and centre Find Us/app links/logo.
  - Phone header navigation centred; booking Back row has6px divider clearance.
  - Continue floats only until its reserved original position, remaining above the footer.
  - Phone Time/Details/Review use cart/trainer popups with live session/distinct-trainer counts and confirmation-style badge pops; reduced motion disables pops.
  - Time heading: “Select dates” / “and times”. Panels approximately72vw wide, maximum65dvh tall, internally scrollable.
  - App links visibly white; all shared popup close controls plain × with44px targets.
- Local component verification: time-step9/9 passed. Full non-browser verification and exact-head frontend/backend/live-email/CodeQL/staging pending for this candidate.
- Browser/physical acceptance belongs to owner/CI. No assistant browser execution.

## Separate documentation PR

- Prepared/pushed branch: `docs/test-guides-and-reference-cleanup`, commit`27e8e75bb885a02f5ea71fd091bea6064b851833` based on UI904414b.
- Completed baseline audit:6,362 retained units,123 stable IDs,84 mapped role cases,1,410 valid local links,56 parsed diagrams; no information loss detected.
- After UI publication: merge latest UI branch into docs branch, reconcile changes in place, rerun audit, publish separate dependent draft PR.
- Refactor rules: point form; only Journey journals; no patch-style corrections; retain diagrams unless stale. New one-page suite guide and two-page UAT per stakeholder.

## Provider and external acceptance

- SimplyBook10-minute timeout selected in owner screenshot; saved/effective new invoice deadline still needs owner verification.
- App8-minute payment +1-minute checking +3-minute recovery unchanged. Owner A–D tests remain pending; activation held.
- Domain/WAF/rate-limit work deferred until owner tests finish. Prior Cloudflare zone/ruleset reads do not prove workers.dev protection.
- Other external tasks: [Runbook](docs/runbook.md), [Admin UAT](docs/uat/admin.md), [Trainer UAT](docs/uat/trainers.md).
