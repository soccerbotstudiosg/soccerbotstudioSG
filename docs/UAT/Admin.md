# Admin — SoccerBot acceptance worksheet

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

Staff scheduling and booking administration are tested in **SimplyBook**. Provider permission names/screens depend on the selected account plan. Confirm the actual role matrix first; this worksheet does not introduce a custom staff portal or an approval workflow.

## SimplyBook access and configuration

Rules: [BR-001](../SERVICE_CONTRACTS.md#br-001), [BR-002](../SERVICE_CONTRACTS.md#br-002), [BR-005](../SERVICE_CONTRACTS.md#br-005), [BR-022](../SERVICE_CONTRACTS.md#br-022). See [code owners](../Code-Owners.md#11-business-rule-to-owner-index).

| Case    | What to do                                                                                                                                     | What should happen                                                                                                                                                 | Result | Remarks |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ------- |
| ADM-001 | In SimplyBook, sign in with the designated Admin account and verify company, subscription and enabled features with the owner.                 | The intended company and permitted Admin role are selected; required booking features are available. Record missing entitlements as Blocked.                       |        |         |
| ADM-002 | Inspect approved services: duration, price/currency, player fields, invoice settings and eligible instructors. Compare the SoccerBot site.     | Both surfaces agree with current owner-approved mappings; 40-minute sessions, 50-minute starts and 1–4 players meet the accepted contract.                         |        |         |
| ADM-003 | Inspect Singapore timezone, opening hours, special days, lead time and payment/invoice timeout settings.                                       | Current approved schedules and timing are recorded; application-enforced rules are distinguished from provider settings. Any mismatch is raised before activation. |        |         |
| ADM-004 | Inspect the shared studio/resource capacity across all eligible instructors. With a partner, attempt the arranged competing test reservations. | The shared studio cannot be sold twice for overlapping sessions merely by selecting different instructors. Capture both provider outcomes.                         |        |         |
| ADM-005 | Inspect email templates, sender/reply details and notification triggers using the agreed test inbox.                                           | Correct business details and recipient mappings are present; identity email ownership remains Resend and booking notification ownership remains SimplyBook.        |        |         |

## Trainer schedules in SimplyBook

Rules: [BR-001](../SERVICE_CONTRACTS.md#br-001), [BR-002](../SERVICE_CONTRACTS.md#br-002), [BR-006](../SERVICE_CONTRACTS.md#br-006). See [code owners](../Code-Owners.md#11-business-rule-to-owner-index).

| Case    | What to do                                                                                                                                                                        | What should happen                                                                                                                         | Result | Remarks |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ------- |
| ADM-006 | In SimplyBook, enter a designated instructor’s working hours on an agreed test date; save, refresh, then compare public booking availability after its documented refresh window. | The schedule persists and eligible website slots follow the provider timetable; record the observed propagation delay.                     |        |         |
| ADM-007 | Add an approved break/day off on an unused test date, then restore the original schedule after checking.                                                                          | Unavailable periods cannot be newly reserved; unrelated instructors/dates and existing booking history remain intact.                      |        |         |
| ADM-008 | Use a prepared instructor-service assignment change or inactive instructor example.                                                                                               | Only eligible active instructors are offered for that service after refresh; no assumption that existing bookings are silently reassigned. |        |         |
| ADM-009 | Compare Trainer A’s permitted schedule editing with Trainer B’s records and Admin’s controls.                                                                                     | Access matches the recorded SimplyBook role configuration; restricted changes are denied, not tested using shared Admin credentials.       |        |         |

## Booking, invoice and payment reconciliation

Rules: [BR-007](../SERVICE_CONTRACTS.md#br-007), [BR-008](../SERVICE_CONTRACTS.md#br-008), [BR-010](../SERVICE_CONTRACTS.md#br-010), [BR-013](../SERVICE_CONTRACTS.md#br-013). See [code owners](../Code-Owners.md#11-business-rule-to-owner-index).

| Case    | What to do                                                                                                                                 | What should happen                                                                                                                                  | Result | Remarks |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------- |
| ADM-010 | Observe the Customer single-session test in SimplyBook. Locate its customer, instructor, date/time, booking, invoice and HitPay reference. | One intended booking and payment association exist; customer, amount and currency agree across all systems.                                         |        |         |
| ADM-011 | Observe the multi-session test. Check every booking, batch association, invoice total and payment record.                                  | All requested sessions and only those sessions are retained with correct totals; no separate duplicate charge.                                      |        |         |
| ADM-012 | Inspect records after the Customer refresh/double-submit test.                                                                             | Repeated browser actions have not created duplicate booking or payment effects.                                                                     |        |         |
| ADM-013 | Inspect an arranged unpaid/expired example and a paid-but-reconciling example.                                                             | The correct unpaid/pending/paid state remains traceable. Do not manually mark paid to make the website pass.                                        |        |         |
| ADM-014 | With authorised support, examine prepared uncertain-booking and late-settlement evidence.                                                  | Original references are retained and reconciliation follows authoritative readback. Unknown outcomes are not deleted/rebooked or presumed refunded. |        |         |
| ADM-015 | After an approved paid journey, verify the SimplyBook notification record and the actual test inbox.                                       | One intended confirmation notification has correct sessions/details; investigate duplicates or missing delivery separately from payment state.      |        |         |

## Daily operations and staff boundaries

Rules: [BR-002](../SERVICE_CONTRACTS.md#br-002), [BR-003](../SERVICE_CONTRACTS.md#br-003), [BR-008](../SERVICE_CONTRACTS.md#br-008), [BR-022](../SERVICE_CONTRACTS.md#br-022). See [code owners](../Code-Owners.md#11-business-rule-to-owner-index).

| Case    | What to do                                                                                                                              | What should happen                                                                                                                                     | Result | Remarks |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ------- |
| ADM-016 | Find designated bookings by date/customer/reference, inspect the daily calendar and refresh.                                            | Staff can locate the intended records under their role; displayed time and instructor are correct.                                                     |        |         |
| ADM-017 | Inspect a customer’s saved details using the permitted SimplyBook staff role, then compare with the customer-facing verified view.      | Staff access follows provider permissions; customer website access still requires identity proof and does not expose unrelated records.                |        |         |
| ADM-018 | Walk through the documented rescheduling/cancellation/refund escalation using a prepared example, without executing a financial change. | Staff can identify the authorised operator, affected booking/payment and reconciliation consequences. Cancellation is not assumed to refund a payment. |        |         |
| ADM-019 | Sign out of SimplyBook and try Back/refresh; verify the configured MFA/account recovery procedure with the owner.                       | The staff account follows the configured provider access controls. Missing MFA or permissions are recorded for handover.                               |        |         |

## Session outcome

| Decision                                         | Fill in |
| ------------------------------------------------ | ------- |
| Passed / Failed / Blocked / Not tested counts    |         |
| Defect links and retest case IDs                 |         |
| Evidence location (redacted)                     |         |
| Tester signature / date                          |         |
| Owner decision / accepted exceptions / follow-up |         |
