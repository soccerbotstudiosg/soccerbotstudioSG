# SoccerBot user acceptance testing

Role-based worksheets follow the session-details and five-column acceptance-table format in [FitfinityReact UAT](https://github.com/LimYouSheng/FitfinityReact/tree/docs/dependency-version-inventory/docs/UAT). Cases are adapted to SoccerBot; AWS, package purchases, fitness assessments and trainer-pay workflows are not imported.

| Worksheet               | Person and surface                                                    | Scope                                                                                                    |
| ----------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| [Customer](Customer.md) | Customer tester on SoccerBot and hosted checkout                      | Email identity, Remember me, selection, booking/payment, return, confirmation, exports and devices       |
| [Admin](Admin.md)       | Authorised operator in SimplyBook, with payment readback as permitted | Service setup, staff schedules, shared capacity, booking/invoice/payment matching and notifications      |
| [Trainer](Trainer.md)   | Instructor using their own SimplyBook staff account                   | Enter hours, recurring availability, breaks/day off; inspect assigned bookings and permission boundaries |
| [Owner](Owner.md)       | Business owner with authorised deployment/support operator            | End-to-end acceptance, domain/HTTPS, operations, recovery, monitoring and handover                       |

## Before testing

1. Record the deployed full commit, verification run, deployment receipt and exact URL. Confirm which environment is being accepted. Use [Versions](../../Versions.md) and the run evidence for dependency context; neither is deployment proof on its own.
2. Confirm the SimplyBook company, approved service/instructor mappings and shared studio capacity, receiving inboxes, HitPay sandbox/live designation, Resend sender and current schedule/pricing/timing. Use dedicated test customers, slots and inboxes; arrange any actual transaction with the owner first.
3. Record the actual SimplyBook Admin/Trainer role permissions and subscription features. Trainer self-service scheduling may require explicit permissions; if unavailable, mark that case Blocked and test the agreed Admin-assisted workflow separately.
4. Prepare separate accounts/devices for identity isolation and concurrency, plus controlled expired, unavailable, delayed and uncertain examples with support. No device-clock manipulation or unarranged service interruption. Never manufacture a pass by manually changing payment status.
5. Review [business rules](../SERVICE_CONTRACTS.md#part-1--current-system-rules) and their [code owners](../Code-Owners.md#11-business-rule-to-owner-index). Linked rule IDs are traceability references; the worksheets do not replace the canonical requirements.

## Record results

Keep the master sheets blank. Save each completed run in an owner-approved evidence location with date, environment and full revision; link it in the relevant Progress entry. Record case IDs, actual outcomes, defects, redacted screenshots/provider references, device/browser and approximate seconds where relevant. Do not commit secrets, payment credentials or customer personal data.

Use Pass / Fail / Blocked / Not tested. Missing fixture, permission or integration is Blocked, not a pass. For a feature outside the agreed scope, record Not tested with the owner’s scope decision. Retests keep the original failure evidence and reference the corrected revision. CI, provider testing and owner UAT are separate evidence categories; completed testing on another revision/environment does not silently close these sheets.

## Run order and closure

Admin and Trainer confirm the provider configuration and schedule first. Customer then performs the arranged journeys while Admin matches provider records. Owner reviews all four sheets and the required operational evidence before signing acceptance for the specific revision/environment. Test schedule restoration is performed only by the authorised person using the agreed baseline; booking/payment history is retained. Cancellation and refunds are separately authorised provider operations, not automatic test cleanup.

This folder defines acceptance procedures; creating it performs no bookings, payments, notification sends or provider configuration changes. No case is pre-marked passed. Historical acceptance and remaining manual setup stay in [Progress](../../PROGRESS.md); milestones and scope remain in [Service Contracts](../SERVICE_CONTRACTS.md#milestones-and-retained-acceptance-criteria).
