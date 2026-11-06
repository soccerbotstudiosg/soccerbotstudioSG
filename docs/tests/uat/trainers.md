# Trainer UAT — two-page checklist

<!-- document-chapter-menu -->
<details>
<summary>Chapter menu</summary>

- [1. Page 1 of 2 — individual access and availability](#page-1-of-2--individual-access-and-availability)
- [2. Page 2 of 2 — bookings, shared studio and mobile use](#page-2-of-2--bookings-shared-studio-and-mobile-use)

</details>
<!-- /document-chapter-menu -->

<a id="page-1-of-2--individual-access-and-availability"></a>

## 1. Page 1 of 2 — individual access and availability

- **Record:** tester/date; intended SimplyBook company; individual role/provider mapping; deployed website SHA/run; phone/model/exact OS/browser/app; designated test dates/services/customer;
  - Admin partner; private evidence location.
- **Results:** Pass / Fail / Blocked / Not tested per item; record actual result, delay and defect ID.
  - Preserve original failures on retest;
  - CI does not complete provider/mobile acceptance.
- **Boundary:** owner-operated approved fixtures only; no shared Admin credentials, destructive records, financial actions or unapproved notifications.
  - No new custom staff portal or approval feature is assumed.

- [ ] **Own account — TRA-001.** Sign in to the designated company using your individual Trainer account; inspect assigned services/provider identity.
  - **Expect:** correct instructor and owner-approved permissions; account plan/seat and supported mobile app/browser confirmed before invitation.
    - Individual email login, not an assumed phone-number login.
- [ ] **Allowed and denied access — TRA-002,009.** Inspect own schedule/bookings and an organiser-supplied other-instructor record; attempt a restricted field using the permitted test procedure.
  - **Expect:** actual provider role boundaries hold.
    - Record owner approval for wider unavoidable visibility.
    - If own-only scheduling cannot be enforced, use Admin-entered changes; self-service remains Blocked rather than inventing restrictions.
- [ ] **Logout and recovery — TRA-003.** Sign out, refresh and press Back; review configured password/MFA/recovery and offboarding with Admin.
  - **Expect:** protected access requires current sign-in; recovery/offboarding follows actual account configuration; missing controls recorded for owner action.
- [ ] **Date-specific availability — TRA-004–005.** Enter approved hours on an unused Singapore test date; save, leave and reopen; inspect an adjacent unconfigured date; keep recurring weekly days off.
  - **Expect:** only intended date/instructor changes; saved hours persist; adjacent date remains unavailable; no unintended weekly recurrence.
- [ ] **Breaks and invalid input — TRA-006–007.** Add approved break/day-off exception; try reversed/invalid/overlapping hours through provider validation; coordinate customer availability refresh.
  - **Expect:** provider rejects or clearly resolves invalid input; final schedule has no unintended availability; unavailable periods disappear after supported refresh.
    - Record propagation delay; do not assume instant push updates.
- [ ] **Existing booking and restoration — TRA-008,010.** With Admin, inspect effects of editing near a designated booking; stop before destructive confirmation; restore agreed unused-date schedule.
  - **Expect:** consequences reviewed; no automatic cancellation/refund/reassignment; restored availability matches baseline without deleting history or extra sessions.

<div style="break-before: page;"></div>

<a id="page-2-of-2--bookings-shared-studio-and-mobile-use"></a>

## 2. Page 2 of 2 — bookings, shared studio and mobile use

- [ ] **Single and multi bookings — TRA-011.** Open designated customer UAT bookings and compare assigned date/time/duration/service/player details and permitted customer information.
  - **Expect:** correct assignments; no missing/duplicated sessions; only necessary customer/session details are exposed under the approved role.
- [ ] **Paid versus uncertain — TRA-012.** Compare confirmed paid and Admin-supplied unpaid/pending examples; explain escalation for uncertainty.
  - **Expect:** statuses distinguishable; trainer never manually marks payment settled or tells an uncertain customer to pay again.
    - Provider timeout is not proof of cancellation/release.
- [ ] **Shared-studio clash — TRA-013.** Coordinate approved same-time availability across two trainers with Admin/customer.
  - **Expect:** different trainer does not bypass one-studio capacity or10-minute changeover; no unrelated customer booking changes.
    - Do not enable overlapping schedules before provider capacity acceptance.
- [ ] **Per-slot trainer choice — TRA-016.** Inspect an approved multi-slot booking where the customer selected different trainers; compare each trainer’s appointments.
  - **Expect:** each appointment belongs to the selected eligible trainer; no silent substitution; shared capacity stays one; all required service/provider mappings present.
- [ ] **Schedule grid.** Compare permitted slots with Admin after availability changes; include late start, early finish and break within a50-minute occupied slot.
  - **Expect:** fixed public grid and full session/changeover fit; incomplete windows cannot create extra studio capacity; website freshness and provider enforcement verified separately.
- [ ] **Customer requests — TRA-014.** Walk through prepared rescheduling/cancellation request with Admin without performing a financial change.
  - **Expect:** authorised operator/policy identified; trainer access does not imply refund permission or automatic website synchronization.
    - Customer request alone leaves the booking unchanged.
- [ ] **Work phone — TRA-015.** Inspect a busy day, choose a record, enter/cancel/save a designated availability change; verify all allowed/denied actions on the actual mobile app/browser.
  - **Expect:** dates, controls and records readable/selectable; no accidental adjacent-record changes; delays recorded.
    - Staff access grants no HitPay/Cloudflare authority.
- [ ] **Restricted duties and notifications.** With Admin, verify no unapproved billing, API keys, exports, other-trainer edits, broad customer access or cancellation/refund rights; inspect prepared trainer notification preview only when authorised.
  - **Expect:** approved restrictions enforced or limitations recorded; trainer receives only own assignments/necessary details, not other trainers’ sessions or payment/customer contact by default.
    - Drafts/invitations are not installed or accepted by this checklist.
- **Close:** counts ___; defect/retest IDs ___; private evidence ___; agreed schedule restored ___; tester/date ___; owner decision/exceptions/follow-up ___.
- **Keep separate:** successful website CI, provider permission acceptance, physical-phone usability and actual notification delivery.
