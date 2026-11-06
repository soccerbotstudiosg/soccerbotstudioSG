# Current checkpoint

Observed 6 November 2026. Historical decisions and evidence: [Journey](docs/journey.md).

## UI — publish and stage first

- Branch: `fix/hero-session-copy`; existing PR32. Do not merge or enable settings.
- Last verified staging revision: `2b907c56a362d793bf1d88e70321de96c730419f`; newer local changes require final CI/staging.
- Consolidated changes:
  - Desktop footer rows align with40% tighter pitch; logo aligns at the footer’s right edge; desktop group gaps36px. Phones pair Services/Connect With Us and centre Find Us/app links/logo; text rows32px+4px and email stays on one line.
  - Phone header navigation centred; booking Back row has6px divider clearance.
  - Continue is a full-width naked button with24px upper clearance and no white wrapper; floats only until its reserved original position, remaining above the footer.
  - Phone Time/Details/Review keep cart/trainer icons in the sticky top row, with centred step count; use cart/trainer popups with live session/distinct-trainer counts and confirmation-style badge pops; reduced motion disables pops.
  - Time heading: “Select dates” / “and times”. Panels approximately72vw wide, maximum65dvh tall, internally scrollable.
  - App links visibly white; all shared popup close controls plain × with44px targets.
  - Contact us and Book now share identical blue-to-navy gradient and button colours.
- Local component verification: time-step/direct-checkout29/29 passed. Full non-browser verification and exact-head frontend/backend/live-email/CodeQL/staging pending for this candidate.
- Browser/physical acceptance belongs to owner/CI. No assistant browser execution.

## Separate documentation PR

- Separate draft PR33: `docs/test-guides-and-reference-cleanup`, commit`abbf9f2b146e2b6ca31f6373ad9d53e070e95b13` based on UI2b907c5.
- Completed baseline audit:6,379 retained units,123 stable IDs,84 mapped role cases,2,588 valid local links,56 parsed diagrams; no information loss detected.
- After UI publication: merge latest UI branch into docs branch, reconcile changes in place, rerun audit, update dependent draft PR33. Manual docs CI dispatch returned Forbidden; owner can run Verify deployment target on its branch with target staging.
- Refactor rules: point form; only Journey journals; no patch-style corrections; retain diagrams unless stale. New one-page suite guide and two-page UAT per stakeholder.

## Provider and external acceptance

- SimplyBook10-minute timeout selected in owner screenshot; saved/effective new invoice deadline still needs owner verification.
- App8-minute payment +1-minute checking +3-minute recovery unchanged. Owner A–D tests remain pending; activation held.
- Domain/WAF/rate-limit work deferred until owner tests finish. Prior Cloudflare zone/ruleset reads do not prove workers.dev protection.
- Other external tasks: [Runbook](docs/runbook.md), [Admin UAT](docs/uat/admin.md), [Trainer UAT](docs/uat/trainers.md).
