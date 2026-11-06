# Booking scenarios and messages

- [Progress](../PROGRESS.md) owns current delivery status; this document owns scenario messages; [contracts](api-contracts.md) own proof and recovery rules.
- Diagrams and the current copy table below describe implemented behavior.
- The explicitly archived copy review is historical evidence, not the current message inventory.
- HitPay/bank screens are provider-owned; their return paths remain physical UAT.

## 1. Guest entry

- Continue as guest, then select sessions without creating an account.

```mermaid
flowchart LR
  A["Continue as guest"] --> B["Preparing booking…"]
  B -->|Access granted| C["Your session"]
  B -->|Failure| D["We couldn’t continue. Please try again."]
  D --> A
```

## 2. Email entry and verification

- Verify email before loading saved details; a code or service failure never grants access.

```mermaid
flowchart TD
  A["Continue with email"] --> B["Enter the six-digit code for email"]
  B --> C["Verify and continue"]
  C -->|Valid| D["Your session"]
  C -->|Invalid code| E["Check your code or request a new one."]
  A -->|Too many requests| F["Wait a few minutes before requesting another code."]
  A -->|Unavailable| G["Email verification unavailable. Please continue as a guest."]
```

## 3. Expired or revoked access

- Identity and confirmation access use different messages; neither reveals a server revocation reason.
- Explicit access entry and checkout renew only a valid unexpired capability, preserving its owner.
- Expired/revoked access is not revived; payment, hold and checking deadlines remain independent.

```mermaid
flowchart TD
  A["Access expires or is revoked"] --> B{"Current action"}
  B -->|Checkout identity changes| C["Please verify your email again."]
  B -->|Identity API rejects access| D["Return to booking options and sign in again."]
  B -->|Verification response loses identity| E["Email verification unavailable. Please continue as a guest."]
  B -->|Open protected confirmation| F["Confirmation unavailable"]
  F --> G["Contact the studio to view this booking. Don’t pay again."]
```

## 4. Session choice and calendar

- Choose the priced session card (one-third desktop width, full mobile width) to open player count and the three included features.
- The compact card stays in place with a blue selected highlight.
- Clicking reveals the full-width player control and three inclusions beneath the card grid; it does not replace the card or open a dialog.
- See available times continues from this view.
- Trainer choices share one studio and never add capacity.

```mermaid
flowchart TD
  A["Loading sessions…"] -->|Failure| B["Unable to load available sessions. Please try again."]
  B --> C["Try again"] --> A
  A -->|Success| D["Priced session card"]
  D --> E["Full-width session information, player count and included features"]
  E --> F["See available times"]
  F --> G["Calendar and trainer selection"]
  G -->|Empty day| H["No sessions available on this date."]
  G -->|Read fails| I["Unable to load available sessions. Please try again."]
```

- Calendar Refresh remains available.
- A verified conflict removes overlapping studio offers across trainers from the affected cached day and removes rejected cart selection(s), retaining contact details and unaffected valid dates/months.
- It must not clear the whole calendar or wait for scheduled warming.
- Missing/expired snapshots and provider-delayed release can still require reads; a local timer never invents a free slot.
- See [capacity and recovery rules](business-rules.md#br-001).

## 5. Details and review

- Your details shows each session's small price right-aligned on its Trainer row.
- Review has Your sessions, Booking contact, and Order summary; the numbered date/time/trainer rows and per-session prices belong inside Order summary.
- There is no separate Dates & times section or aggregate “N × 40 min session” row.
- Edit links all read “Edit”.
- Final totals use a larger Total label and amount, with a muted SGD immediately to the left of the amount.
- There is no currency caption underneath.

```mermaid
flowchart LR
  A["Your details"] --> B["Review booking"]
  B -->|Invalid contact| C["Review your contact details."] --> A
  B -->|No consent| D["Review and accept the booking information."]
  B -->|Valid| E["Continue to payment"]
```

- Saved contact details are not booking confirmation.
- Basket items have distinct boundaries/backgrounds, with the remove × at the top and a light-red cue; prices align right on the trainer row.

## 6. Checkout creation and rejected or uncertain writes

- Classify from protected evidence, not HTTP status alone.
- Same studio time is shared regardless of trainer or service.
- See the [recovery decision contract](api-contracts.md#conflict-recovery-decision-contract).

```mermaid
flowchart TD
  A["Continue to payment"] --> B["Opening checkout…"]
  B -->|Complete validated booking| C["Hosted HitPay checkout"]
  B -->|Server proves no start| D["Nothing was booked or charged. Your details are saved; try again shortly."]
  B -->|Uncertain dispatched write| E["Checking your booking. Do not book or pay again."]
  B -->|Verified unavailable selection| F["Session no longer available."]
  F --> G["Repair affected cache and return to time selection"]
  B -->|Rejected window; owned checkout found| H["You already have a checkout in progress. These selections were not booked."]
  H --> I["Stay on Review; View existing checkout is explicit"]
  B -->|Rejected window; no restorable checkout| J["We couldn’t start checkout. Please try again later."]
```

- Never silently replace the requested draft with another checkout.
- Unknown writes keep the original attempt and recovery identity; they must not become a new booking/payment retry.

## 7. Multi-session partial failure

- Payment is offered only for a complete validated batch; partial/unknown creation uses recovery.

```mermaid
flowchart TD
  A["Create selected sessions"] --> B{"Complete batch validated?"}
  B -->|Yes| C["Hosted HitPay checkout"]
  B -->|Partial or unknown| D["Checking your booking. Do not book or pay again."]
  D --> E["Server reconciles original bookings"]
  E -->|Unresolved| D
  E -->|Verified rejected selection| F["Session no longer available."]
```

## 8. Back and Continue payment

- Payment and confirmation routes may reopen only the same server-authorized, unexpired unpaid HitPay link in the same tab.
- A completed return hint suppresses continuation immediately, but does not prove payment.
- Paid evidence, expiry and unresolved/denied states must not expose continuation.

```mermaid
flowchart TD
  A["Return from HitPay or browser Back"] --> B["Checking payment…"]
  B -->|Completed return hint or paid evidence| C["No Continue payment; await protected proof"]
  B -->|Server-authorized eligible unpaid link| D["Continue to pay. If already paid, please wait..."]
  D --> E["Session prices; Total with SGD beside amount; Time left to pay"]
  E --> F["Continue payment"]
  F -->|Original link, same tab| G["HitPay checkout"]
```

- The countdown is centred and bold above the button.
- Structured details persist into unresolved feedback; missing metadata never invents a trainer or per-session amount.

## 9. Card authentication and provider return

- HitPay handles issuer authentication; browser return alone never confirms payment.

```mermaid
flowchart LR
  A["HitPay: pay by card"] --> B["Bank OTP / 3DS / bank app, if required"]
  B -->|Provider completes return| C["Confirmation route: Checking payment…"]
  B -->|Closed or interrupted| D["Original attempt remains recoverable"]
  C --> E["Server verifies payment and booking"]
  D --> E
  E -->|Safe confirmed proof| F["Booking confirmed"]
```

## 10. Payment and booking confirmation

- Paid evidence can show progress, but success and the invoice number require confirmed booking proof.

```mermaid
flowchart TD
  A["Checking payment…"] -->|Verified payment| B["Payment received. Confirming booking."]
  B --> C["Please do not close or refresh."]
  C -->|Verified booking and accounting proof| D["Booking confirmed"]
  D --> E["Brief checkmark pop; static with reduced motion"]
  E --> F["Paid; confirmed booking"]
  F --> G["Invoice number · mini loader"]
  G -->|Final document available| H["Show invoice number; keep confirmation"]
  G -->|Unavailable or window ended| I["Keep confirmation; omit invoice number"]
  C -->|Still unresolved| J["Payment received. Contact us about your booking. Do not pay again."]
```

## 11. Temporary status failure

- A failed read offers status checking without treating it as a failed payment.

```mermaid
flowchart LR
  A["Read confirmation status"] -->|Temporary failure, no paid evidence| B["Confirmation unavailable"]
  B --> C["Payment status unavailable. Please check again shortly."]
  C --> D["Check status"]
  D --> E["Checking status…"] --> A
```

## 12. Unresolved payment or reconciliation

- An incomplete booking with no payment dispatch shows “Unable to complete this booking. Contact the studio for help with this reservation.” instead of a payment spinner.
- Automatic release of an attempt without a completed association is not implemented; changing this message does not resolve that recovery limitation.
- A known occupied start is classified using fresh provider availability even when its retained attempt lacks a completed association.
- No replacement write is permitted.

- After unresolved checking, Check status displays “Status checked. Payment is still unconfirmed.” after an unchanged result, a wait message when rate-limited, or a retry message after failure.
- The button is absent from the active automatic-checking layout.
- Structured booking details remain visible across the transition.

- Unknown payment uses a neutral notice; known paid evidence, including an authenticated `paid_booking_invalid` result, retains the payment-received wording.
- Check status shares the existing 30-second foreground recheck limit and cannot reset the original checking budget.

```mermaid
flowchart TD
  A["Checking ends without confirmed proof"] --> B{"Payment evidence known?"}
  B -->|No| C["Check the calendar again in up to 5 minutes to rebook your session."]
  B -->|Yes| E["Payment received / booking confirmation pending"]
  E --> F["Payment received. Contact us about your booking. Do not pay again."]
```

## 13. Expiry, grace and late payment

- A timer ending hides payment continuation; only verified releasable expiry permits a restart.
- New attempts use8 minutes to pay,1 further minute of checking and3 further minutes of recovery before grant release eligibility.
- The configured10-minute provider hold remains independently capped by invoice due time; cancellation may occur later.
- The recovery buffer does not extend payment or provider occupancy.
- Old attempts retain their windows.
- After the original recovery and hold deadlines, an authenticated matching expired/canceled request with an explicit empty list or only matching, zero-refund unstarted payment-method entries may release; ambiguous evidence and unprocessed receipts stay protected.
- The original financial journal is retained for late payment.
- The five-minute customer prompt is a recheck instruction, not a guarantee of provider release.
- Authoritative affected-day reads update retained calendar snapshots before return; a local timer never adds a session back.
- Bounded affected-day probes handle delayed provider release independently of browser life; the slot remains unavailable until current provider capacity permits it.

```mermaid
flowchart TD
  A["Time left to pay ends"] --> B["Hide Continue payment; retain checking"]
  B -->|Verified releasable expiry| C["Your unpaid reservation has ended. This session may not be available to book again immediately. Please try again later. Your details are saved."]
  B -->|Release not verified| D["Still checking your payment. Don’t pay again."]
  B -->|Late payment or invalid booking| E["Payment received. Contact us about your booking. Do not pay again."]
  C --> F["Choose a new time"]
```

- Confirmation summary follows review: provider service name, player count without “per session”; each session uses “Trainer: <name>”.
- Supporting client/location/disclaimer details remain collapsed under View full details.
- The continuation countdown is centred and bold above its payment button.
- Missing validated display metadata never substitutes a guessed trainer.

## 14. Confirmed details temporarily unavailable

- A receipt-read failure does not undo verified confirmation or authorize another payment.

```mermaid
flowchart LR
  A["Confirmed status, no renderable receipt/proof details"] --> B["Booking confirmed"]
  B --> C["Booking confirmed. Try loading your details again."]
  C --> D["Load booking details"]
  D -->|Valid receipt| E["Confirmed booking summary"]
  D -->|Unavailable| C
```

## 15. Saved confirmation and old links

- Each protected old link shows only its own booking; it cannot replace a newer active checkout.

```mermaid
flowchart TD
  A["Open old confirmation or reload"] --> B{"Protected retained proof available?"}
  B -->|Yes| C["Booking confirmed"]
  C --> D["Saved confirmation · Verified timestamp"]
  D --> E["Optional invoice number from that booking"]
  B -->|Access denied| F["Confirmation unavailable"]
  F --> G["Contact the studio to view this booking. Don’t pay again."]
  C -.-> H["Newer attempt remains separate"]
```

## 16. Make another booking and Back to home

- A completed receipt remains immutable.
- Leaving an older receipt must not silently adopt a newer completed booking, or discard a newer unpaid/uncertain checkout.

```mermaid
flowchart TD
  A["Make another booking or Back to home"] --> B{"Newer retained attempt?"}
  B -->|No| C["Reset draft; dismiss completed attempt through guarded exit"]
  B -->|Yes| D["Read protected newer context"]
  D -->|Completion verified| E["Await successful dismissal; recheck current revision"]
  E --> C
  D -->|Unpaid or uncertain| F["Preserve newer attempt and its recovery"]
  D -->|Read or dismissal fails| G["Please try again to leave this booking."]
  C --> H["Booking options or home"]
```

- The same-attempt exit uses the existing guarded background dismissal/retry; its failure can show “Unable to start a new booking. Please try again. Your confirmed booking is unchanged.” For a different newer completed attempt, dismissal must succeed before reset/navigation.
- Navigation never cancels a booking or resets payment deadlines.

## 17. Three complete journeys

- Retain one browser context through single → single → single or multi → single → single.

```mermaid
flowchart LR
  A["Single or multi-session checkout"] --> B["Booking confirmed: A"]
  B -->|Make another booking| C["Single checkout"]
  C --> D["Booking confirmed: B"]
  D -->|Make another booking| E["Single checkout"]
  E --> F["Booking confirmed: C"]
  F --> G["Reopen A, B and C: independent details and invoice values"]
```

## 18. WhatsApp and staff action

- Contacting the studio requests a change; it does not automatically cancel, reschedule or refund.

```mermaid
flowchart LR
  A["Booking confirmed"] --> B["WhatsApp Enquiry"]
  B --> C["Glenna: +65 9014 3819"]
  C --> D["Staff reviews request in SimplyBook"]
  D --> E["Owner-approved change / cancellation / refund handling"]
```

## 19. Preview-only payment states

- Preview messages are not proof of real payment or booking.

```mermaid
flowchart TD
  A["Hosted payment preview"] --> B["Payment preview · No money will be charged."]
  B -->|Pending| C["Your payment is still processing. Please avoid starting another payment."]
  B -->|Late| D["Payment under review"]
  B -->|Failed simulation| E["Your payment wasn’t completed. No charge was made. Try again or return to your booking."]
  B -->|Confirmed simulation| F["Paid · Preview"]
```

- Historical copy-review decisions: [Journey](journey.md#archived-copy-review-historical-baseline-and-disposition).

## Current changed copy and presentation

- These rows supersede historical baseline wording for the named paths.
- Deployment/test evidence belongs only in [Progress](../PROGRESS.md) and dated [Journey](journey.md).

| Surface / condition                                                              | Current copy or behavior                                                                                                                       | Source                                                                                                                                                           |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Proven unavailable session; basket unavailable selection; demo capacity conflict | Session no longer available.                                                                                                                   | [booking adapter](../src/services/booking.ts), [basket](../src/features/booking/summary.tsx), [demo](../src/services/demo/booking.ts)                            |
| Availability/catalogue read fails                                                | Unable to load available sessions. Please try again.                                                                                           | [shared copy](../src/domain/booking-messages.ts), catalogue and availability views                                                                               |
| Verified empty date                                                              | No sessions available on this date.                                                                                                            | [shared copy](../src/domain/booking-messages.ts), [time selection](../src/features/booking/time-step.tsx)                                                        |
| Rejected preparation with owned existing checkout                                | You already have a checkout in progress. These selections were not booked. / View existing checkout                                            | [provider](../src/features/booking/provider.tsx), [Review](../src/features/booking/review-step.tsx)                                                              |
| Rejected preparation without restorable checkout                                 | We couldn’t start checkout. Please try again later.                                                                                            | [booking adapter](../src/services/booking.ts)                                                                                                                    |
| Changed selection / price; uncertain payment                                     | Keep distinct existing evidence-specific feedback; do not replace with a proven session conflict                                               | [booking adapter](../src/services/booking.ts)                                                                                                                    |
| Manual status check, unchanged                                                   | Status checked. Payment is still unconfirmed.                                                                                                  | [protected confirmation](../src/features/booking/protected-confirmation.tsx)                                                                                     |
| Manual status check, rate limited                                                | Please wait a moment before checking again. Your booking is unchanged.                                                                         | [protected confirmation](../src/features/booking/protected-confirmation.tsx)                                                                                     |
| Manual status check, failed read                                                 | We couldn’t check your payment just now. Please try again in a moment.                                                                         | [protected confirmation](../src/features/booking/protected-confirmation.tsx)                                                                                     |
| Player App popup                                                                 | App Store / Google Play / Web App; owner-supplied destinations; clear borderless ×, no Not now footer or leftover gap; keyboard focus retained | [popup](../src/components/player-app-prompt.tsx), [dialog](../src/components/dialog.tsx)                                                                         |
| Session selection                                                                | Priced clickable card; click shows original full-width player selection and three inclusions                                                   | [session step](../src/features/booking/session-step.tsx)                                                                                                         |
| Details / Review / pending payment                                               | Small session prices right-aligned with Trainer; larger Total label and amount; muted SGD immediately left of the amount                       | [summary](../src/features/booking/summary.tsx), [Review](../src/features/booking/review-step.tsx), [confirmation](../src/features/booking/confirmation-step.tsx) |
| Confirmed session                                                                | Paid badge and paid amount align on Trainer row; supporting details collapsed under View full details                                          | [confirmation](../src/features/booking/confirmation-step.tsx)                                                                                                    |

- The first-visit app prompt supports ×, Escape and backdrop dismissal; dialog headings have unique accessible IDs and the close target remains 44px.
- The calendar allows only the current Singapore month plus two.
- Status/error notices remain separated from Continue by the shared spacing.
- No presentation change grants booking, payment or expiry authority.

- The three availability messages are owned by [booking-messages.ts](../src/domain/booking-messages.ts).
- Confirmed conflicts use the same singular “Session no longer available.” for single and multi-session requests, regardless of trainer.
- There is one studio and only one session at any time; trainer choice never creates separate capacity.
- A failed read is never rendered as an empty date or proven conflict.
- Global lack of an eligible session type is distinct from an empty selected date and retains “No sessions are currently available.”

## Public entry surfaces

- [Technical behaviour](code-owners/technical-behavior.md#public-homepage-and-studio-presentation) owns header/footer, media, curves, gradients, sizing, public motion and mobile booking-bar details.
- [Customer UAT](tests/uat/customer.md) owns task/expected-result checks;
  - CI and physical/provider acceptance remain separate.
- Outlet selection is presentation scaffolding for the existing single venue.
  - Session selection passes the existing `serviceId`; it does not create a new provider mapping or capacity pool.
- Booking components remain static except existing confirmation/invoice cues; public reveals/back-to-top do not run in booking, confirmation or experiment checkout.
