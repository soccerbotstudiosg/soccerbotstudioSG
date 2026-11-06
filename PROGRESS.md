# Current checkpoint

<!-- document-chapter-menu -->
<details>
<summary>Chapter menu</summary>

- [1. Next actions](#next-actions)

</details>
<!-- /document-chapter-menu -->

- Documentation branch: `docs/test-guides-and-reference-cleanup`; UI parent `fix/hero-session-copy`; [PR32](https://github.com/soccerbotstudiosg/soccerbotstudioSG/pull/32) remains open.
  - **Do not merge or enable settings.**
- Prepared: current-reference docs in point form, Journey-only history, one-page suite guide and two-page UAT per customer/admin/trainer; documentation skill requires in-place reconciliation without patch-style appendices. Every document now has its own chapter menu and numbered sections; AGENTS remains the only main router.
- Source candidate: `2b907c56a362d793bf1d88e70321de96c730419f`; mobile cart/trainer panels, distinct-count pop badges, original-position Continue, footer/header refinements and app-popup contrast implemented.
  - UI parent includes compact aligned desktop rows, paired phone Services/Connect With Us and centred remaining groups; address, official app heading and Enquire removal. UI CI42191700781 and CodeQL42191693711 passed. Staging42192988061 attempt2 passed; public health confirms2b907c5/versionf07adbd5-784c-426d-991b-b34a2d4a26dc. Exact receipt belongs in PR32; owner/device acceptance remains pending.
- Audit against2b907c5 passed:6,379 retained units,123 stable IDs,84 role cases,2,588 links and56 parsed diagrams;29 Markdown files have no top-level prose paragraphs. Numbering/menu checks and final code verification/CI/publication remain. No application/test-inventory changes; version-report generator changes prose formatting only.

<a id="next-actions"></a>

## 1. Next actions

- Publish the separate dependent documentation PR after final verification; inspect its exact-head CI.
  - Retain failures/history only in [Journey](docs/journey.md); documentation PR owns its final checks.
- Owner runs [Customer UAT](docs/tests/uat/customer.md), [Admin UAT](docs/tests/uat/admin.md) and [Trainer UAT](docs/tests/uat/trainers.md) on the accepted target.
- Provider timeout target:10 minutes; saved/effective fresh-invoice deadline unverified.
  - App timing remains8/1/3 minutes.
  - A–D testing follows separately authorised merge/activation; neither is currently authorised.
- Domain/WAF/rate-limit work waits for owner tests.
  - See [provider settings](docs/external-providers-config.md) and [Runbook](docs/runbook.md);
  - Workers.dev protection must not be inferred from the domain zone.
