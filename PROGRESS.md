# Current checkpoint

- Documentation branch: `docs/test-guides-and-reference-cleanup`; UI parent `fix/hero-session-copy`; [PR32](https://github.com/soccerbotstudiosg/soccerbotstudioSG/pull/32) remains open.
  - **Do not merge or enable settings.**
- Prepared: current-reference docs in point form, Journey-only history, one-page suite guide and two-page UAT per customer/admin/trainer; documentation skill requires in-place reconciliation without patch-style appendices.
- Source candidate: `904414b642ca4de2497601026ef0e269b13a72e9`; mobile booking bars and public motion fixes implemented.
  - UI parent includes consolidated footer alignment/grouping, address, official app heading and Enquire removal. Exact CI/staging receipt belongs in PR32; owner/device acceptance remains pending.
- Information retention, role-case mapping, links/anchors, point-form structure and Mermaid syntax passed; final code verification/CI and publication remain. No application/test-inventory changes; version-report generator changes prose formatting only.

## Next actions

- Publish the separate dependent documentation PR after final verification; inspect its exact-head CI.
  - Retain failures/history only in [Journey](docs/journey.md); documentation PR owns its final checks.
- Owner runs [Customer UAT](docs/tests/uat/customer.md), [Admin UAT](docs/tests/uat/admin.md) and [Trainer UAT](docs/tests/uat/trainers.md) on the accepted target.
- Provider timeout target:10 minutes; saved/effective fresh-invoice deadline unverified.
  - App timing remains8/1/3 minutes.
  - A–D testing follows separately authorised merge/activation; neither is currently authorised.
- Domain/WAF/rate-limit work waits for owner tests.
  - See [provider settings](docs/external-providers-config.md) and [Runbook](docs/runbook.md);
  - Workers.dev protection must not be inferred from the domain zone.
