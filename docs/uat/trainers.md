# Trainers — SoccerBot acceptance worksheet

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

Use the organiser-confirmed deployed environment and designated test records. Before testing, confirm the deployed revision, environment, SimplyBook company/role, current service and schedule mappings, receiving inbox and payment mode with the organiser. Arrange controlled examples with support; unavailable fixtures remain Blocked. Write **Pass / Fail / Blocked / Not tested** in Result; leave it blank until checked. Record actual outcomes, evidence links, reference numbers and delays in Remarks. A previous CI pass does not prefill this worksheet. Mark missing permissions, integration or prepared examples **Blocked** and record why; do not switch to demo mode to obtain a pass.

Owner/testers operate browsers and provider dashboards. Only authorised people perform the specifically agreed test bookings, payments, notifications or administrative changes. The assistant does not execute them. Use approved sandbox/test fixtures; any production transaction or disruptive change requires its own arranged owner procedure. Do not change device time, reset shared data or expose secrets/customer details in evidence.

Staff scheduling and booking administration are tested in **SimplyBook**. Provider permission names/screens depend on the selected account plan. Confirm the actual role matrix first; this worksheet does not introduce a custom staff portal or an approval workflow.

## SimplyBook staff access

Rules: [BR-002](../service_contracts.md#br-002), [BR-005](../service_contracts.md#br-005), [BR-022](../service_contracts.md#br-022). See [code owners](../code-owners.md#11-business-rule-to-owner-index).

| Case    | What to do                                                                                                                                 | What should happen                                                                                                                              | Result | Remarks |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------- |
| TRA-001 | Sign in to the designated SimplyBook company using your own Trainer account; inspect your assigned services and role.                      | The correct instructor identity and owner-approved permissions are shown; no separate SoccerBot trainer portal is assumed.                      |        |         |
| TRA-002 | Inspect the schedule and bookings available to you. Try an organiser-supplied other-instructor record within the permitted test procedure. | Access follows configured SimplyBook staff permissions. If wider visibility is intentional, record owner approval; restricted edits are denied. |        |         |
| TRA-003 | Sign out, refresh and press Back. Use the provider’s configured MFA/recovery process if included in your account setup.                    | Protected access requires valid sign-in; MFA/recovery behaves according to the agreed provider configuration.                                   |        |         |

## Enter and maintain your schedule

Rules: [BR-001](../service_contracts.md#br-001), [BR-002](../service_contracts.md#br-002), [BR-006](../service_contracts.md#br-006). See [code owners](../code-owners.md#11-business-rule-to-owner-index).

| Case    | What to do                                                                                                                               | What should happen                                                                                                                                      | Result | Remarks |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------- |
| TRA-004 | In SimplyBook, enter working hours for an agreed unused test date, save, leave the screen and reopen it.                                 | The saved hours belong to the correct instructor and Singapore date; no change affects another instructor.                                              |        |         |
| TRA-005 | Enter an approved recurring weekly schedule over designated test dates; inspect each affected date.                                      | Recurrence applies only to the intended dates; special-day exceptions remain understandable and correct.                                                |        |         |
| TRA-006 | Add a break and a day-off exception. Ask Admin/customer to check eligible website slots after refresh.                                   | The provider excludes those periods and the website follows the approved refresh behavior; measure propagation delay.                                   |        |         |
| TRA-007 | Try invalid/reversed hours and an overlapping period using the provider’s validation UI.                                                 | Invalid input is rejected or clearly resolved by the provider; the final saved schedule contains no unintended availability.                            |        |         |
| TRA-008 | Edit hours near an existing designated test booking with Admin present; stop before any destructive confirmation.                        | The effect on that booking is explicit and reviewed. A schedule edit is not assumed to cancel, refund or reassign an existing booking.                  |        |         |
| TRA-009 | Try editing a schedule field outside your approved role. If self-service editing is disabled, submit the agreed change request to Admin. | The permissions boundary holds; Admin enters approved changes. Record self-service as Blocked if not enabled rather than inventing an approval feature. |        |         |
| TRA-010 | Restore the agreed test schedule after checking; refresh SimplyBook and compare the website.                                             | Restored availability matches the approved baseline without deleting booking history or creating extra sessions.                                        |        |         |

## Bookings and customer operations

Rules: [BR-002](../service_contracts.md#br-002), [BR-007](../service_contracts.md#br-007), [BR-010](../service_contracts.md#br-010), [BR-013](../service_contracts.md#br-013). See [code owners](../code-owners.md#11-business-rule-to-owner-index).

| Case    | What to do                                                                                                          | What should happen                                                                                                                       | Result | Remarks |
| ------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------- |
| TRA-011 | Open the assigned single-session and multi-session test bookings created through the simulated-user worksheet.      | Dates, duration, instructor, service and permitted customer details match; sessions are not missing or duplicated.                       |        |         |
| TRA-012 | Compare a confirmed paid booking with an unpaid/pending example supplied by Admin.                                  | You can distinguish the permitted provider statuses and escalate uncertain payment; you do not manually mark a payment as settled.       |        |         |
| TRA-013 | Check a shared-studio clash with another instructor using the arranged fixture and Admin coordination.              | A different instructor does not bypass shared resource capacity. No unplanned customer booking is changed.                               |        |         |
| TRA-014 | Review a rescheduling/cancellation request with Admin using a prepared record.                                      | The request goes to the authorised operator; Trainer access does not imply refund permission or automatic customer-site synchronisation. |        |         |
| TRA-015 | Use the permitted SimplyBook interface on your work phone; inspect a busy day and enter a test availability change. | Dates, save/cancel and record selection remain usable. Capture device and delays; no accidental change to adjacent records.              |        |         |

Keep completed results in the agreed evidence location with the full revision and environment. Retain original failures when retesting; redact customer data and credentials. Coordinate test schedule restoration with Admin and retain booking/payment history.

## Session outcome

| Decision                                         | Fill in |
| ------------------------------------------------ | ------- |
| Passed / Failed / Blocked / Not tested counts    |         |
| Defect links and retest case IDs                 |         |
| Evidence location (redacted)                     |         |
| Tester signature / date                          |         |
| Owner decision / accepted exceptions / follow-up |         |
