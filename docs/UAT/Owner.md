# Owner — SoccerBot acceptance worksheet

| Test session                                                       | Fill in |
| ------------------------------------------------------------------ | ------- |
| Tester / date (Singapore time)                                     |         |
| Website URL / environment                                          |         |
| Deployed commit / verification run                                 |         |
| SimplyBook company / staff role (no passwords)                     |         |
| HitPay sandbox or approved live merchant                           |         |
| Designated test customer / receiving inbox                         |         |
| Device / browser                                                   |         |
| Partner for coordinated checks                                     |         |
| Test service / instructor / dates / booking and invoice references |         |

Use the organiser-confirmed deployed environment and designated test records. Complete the [run prerequisites](README.md#before-testing) first. Write **Pass / Fail / Blocked / Not tested** in Result; leave it blank until checked. Record actual outcomes, evidence links, reference numbers and delays in Remarks. A previous CI pass does not prefill this worksheet. Mark missing permissions, integration or prepared examples **Blocked** and record why; do not switch to demo mode to obtain a pass.

Owner/testers operate browsers and provider dashboards. Only authorised people perform the specifically agreed test bookings, payments, notifications or administrative changes. The assistant does not execute them. Use approved sandbox/test fixtures; any production transaction or disruptive change requires its own arranged owner procedure. Do not change device time, reset shared data or expose secrets/customer details in evidence.

## Release identity and business setup

Rules: [BR-001](../SERVICE_CONTRACTS.md#br-001), [BR-005](../SERVICE_CONTRACTS.md#br-005), [BR-021](../SERVICE_CONTRACTS.md#br-021), [BR-022](../SERVICE_CONTRACTS.md#br-022), [BR-028](../SERVICE_CONTRACTS.md#br-028). See [code owners](../Code-Owners.md#11-business-rule-to-owner-index).

| Case    | What to do                                                                                                                                    | What should happen                                                                                                        | Result | Remarks |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------ | ------- |
| OWN-001 | Record deployed commit, successful three-gate CI run, deployment receipt, website origin and account/resource mapping.                        | The tested release and deployed artifact match; staging and production providers, accounts and secrets remain separate.   |        |         |
| OWN-002 | Approve current services, prices, instructors, opening hours, cutoff, hold/payment/invoice timings and shared studio capacity with Admin.     | Mappings are recorded from current provider configuration; historical chat values are not the acceptance baseline.        |        |         |
| OWN-003 | Verify staff/Admin/Trainer permissions, MFA, billing/subscription ownership and secure credential custody.                                    | Responsible people have their intended access; secrets are not copied into worksheets or screenshots.                     |        |         |
| OWN-004 | Perform one complete approved booking/payment journey with Customer and Admin, including return, invoice evidence and received notifications. | Website, SimplyBook, HitPay and receiving inbox agree for the same transaction; record actual references and environment. |        |         |

## Domain and HTTPS acceptance

Rules: [BR-025](../SERVICE_CONTRACTS.md#br-025), [BR-026](../SERVICE_CONTRACTS.md#br-026), [BR-027](../SERVICE_CONTRACTS.md#br-027). See [code owners](../Code-Owners.md#11-business-rule-to-owner-index).

| Case    | What to do                                                                                                                          | What should happen                                                                                                                                   | Result | Remarks |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------- |
| OWN-005 | Review the owner-operated DNS proof for test subdomain and test apex in the separate DNS/hosting accounts.                          | Both tested hostnames route correctly with trusted certificates; a subdomain-only pass is not accepted as apex proof.                                |        |         |
| OWN-006 | Review final vendor instructions and check HTTPS coverage, redirects, same-origin API and secure cookies on the arranged target.    | Instructions specify records, proxy/CAA/validation requirements and rollback; existing mail records are preserved.                                   |        |         |
| OWN-007 | Inspect automated certificate validation and expiry/availability alerts. Record issuance evidence separately from renewal evidence. | Renewal prerequisites persist without recurring manual TXT/certificate uploads. Actual renewal is Not tested until an observed renewal is evidenced. |        |         |

## Recovery, monitoring and deployment operations

Rules: [BR-014](../SERVICE_CONTRACTS.md#br-014), [BR-018](../SERVICE_CONTRACTS.md#br-018), [BR-019](../SERVICE_CONTRACTS.md#br-019), [BR-020](../SERVICE_CONTRACTS.md#br-020), [BR-021](../SERVICE_CONTRACTS.md#br-021), [BR-023](../SERVICE_CONTRACTS.md#br-023), [BR-024](../SERVICE_CONTRACTS.md#br-024), [BR-027](../SERVICE_CONTRACTS.md#br-027). See [code owners](../Code-Owners.md#11-business-rule-to-owner-index).

| Case    | What to do                                                                                                                                  | What should happen                                                                                                                                | Result | Remarks |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------- |
| OWN-008 | With support, review first installation, safe rerun, interrupted deployment and incorrect-account rejection evidence for the client target. | Each required scenario has traceable evidence; existing staging data and coordinator identity are preserved. Missing cloud acceptance is Blocked. |        |         |
| OWN-009 | Have the authorised operator demonstrate the agreed rollback using a verified prior artifact in the arranged environment.                   | The recorded revision is restored with health evidence; database/provider effects are not assumed reversed by code rollback.                      |        |         |
| OWN-010 | Inspect the company Grafana dashboard and an arranged alert/receiver test after telemetry activation.                                       | Correct environment/service labels, useful sanitized data and receiver evidence exist. Prepared dashboard/export code alone is not a pass.        |        |         |
| OWN-011 | Review sanitized diagnostics and controlled load evidence, including queue rejection and recovery.                                          | Supported capacity and rejected work are reported honestly; synthetic-provider results are not represented as live provider throughput.           |        |         |
| OWN-012 | Review actual client D1/DO location evidence and normal journey timings.                                                                    | Location is observed rather than inferred from a hint or browser edge. The waived separate placement experiment is not reopened.                  |        |         |

## Acceptance and handover

Rules: [BR-003](../SERVICE_CONTRACTS.md#br-003), [BR-013](../SERVICE_CONTRACTS.md#br-013), [BR-022](../SERVICE_CONTRACTS.md#br-022), [BR-024](../SERVICE_CONTRACTS.md#br-024). See [code owners](../Code-Owners.md#11-business-rule-to-owner-index).

| Case    | What to do                                                                                                                                       | What should happen                                                                                                      | Result | Remarks |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- | ------ | ------- |
| OWN-013 | Review Customer results for fresh Remember me after all-device sign-out, all three email account actions, saved-details return and Back/Forward. | Each required regression has an explicit result on the candidate release and required devices; blockers remain visible. |        |         |
| OWN-014 | Review Customer, Admin and Trainer worksheets; reconcile all failures, blocked cases and agreed residual risks.                                  | No blank/blocked item is counted as passed. Any accepted risk names its owner, rationale and follow-up.                 |        |         |
| OWN-015 | Confirm operations manual, provider escalation contacts, access inventory, monitoring/renewal owners and recovery procedures are handed over.    | The owner can operate the system and identify responsibility for incidents, financial changes and certificate alerts.   |        |         |
| OWN-016 | Record final UAT decision for the exact deployed revision and environment.                                                                       | Acceptance is explicitly signed and dated; SMS, packages and MCP admin integration remain separately quoted scope.      |        |         |

## Session outcome

| Decision                                         | Fill in |
| ------------------------------------------------ | ------- |
| Passed / Failed / Blocked / Not tested counts    |         |
| Defect links and retest case IDs                 |         |
| Evidence location (redacted)                     |         |
| Tester signature / date                          |         |
| Owner decision / accepted exceptions / follow-up |         |
