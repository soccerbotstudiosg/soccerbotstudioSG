# Customer UAT — two-page checklist

## Page 1 of 2 — setup, access and first booking

- **Record:** tester/date;
  - URL/environment; deployed SHA/run; device model/exact OS/browser; approved company/merchant; test inbox; service/trainer/date; private attempt/invoice evidence.
- **Results:** mark each item Pass / Fail / Blocked / Not tested; retain the failing step, timing and original evidence on retest.
- **Boundary:** owner-operated approved test records only; no device-clock/storage manipulation, production failure injection or repeat payment of an uncertain attempt.
  - Missing fixtures stay Blocked; never substitute demo acceptance.

- [ ] **Access and saved contact — CUS-001–009.** Browse before verification; test valid/wrong/expired/used code; remember on/off; close/reopen; sign out both devices; verify again with both choices; change email; edit/cancel/save invalid and valid contact; exercise expired editing authority.
  - **Expect:** private data requires current proof; no cross-account disclosure; revoked access stays revoked; cancel does not save; save returns to booking options; recoverable errors preserve appropriate input.
- [ ] **Presentation — CUS-025–027.** Check desktop/phone/tablet, keyboard, rotation, zoom and reduced motion; open home, Studio, app popup, enquiry and legal pages.
  - **Expect:** readable unclipped content, stable focus, sticky header and working links; phone header controls form a centred group; desktop stream/mobile cropped hero video has controls and no autoplay; five Studio rows join with only outer photo curves; compact centred gradient banners meet white footer.
  - **Expect:** footer Services / Connect With Us / Find Us / Download Official Soccerbot360 App:; horizontal icons, desktop logo aligned with Services bottom at the app-column left edge; aligned rows with40% tighter pitch; address below Flagship Studio label; phones pair Services/Connect With Us and centre remaining groups/logo;
    - no footer Enquire link; empty white legal bodies; public reveals do not flicker/move controls; public up-chevron returns focus/top; booking stays static except confirmation/invoice and count-badge pops.
- [ ] **Selection and pricing — CUS-010–014,032–033.** Select/deselect outlet and session; retain2 players after session reselection; test1–4 limits; choose/change/remove per-slot trainers; reload; browse empty months and three-month limit; review without submitting.
  - **Expect:** matching outlet/session cards; address below flagship label; no trailing outlet arrow; dependent controls hide/reset correctly; eligible trainers only; one grouped summary per trainer; valid drafts survive;
    - Review alone creates nothing; consent required.
  - **Expect:** staging S$88/108, client S$108/128 weekday/premium including Singapore holidays; provider quote agrees; no demo price on live-catalogue failure.
    - Summary: service · outlet, then player count.
    - Mobile Back/step≤54px with6px divider gap; single Continue bar≤72px before safe-area, floating only until its original position and stopping above footer; keyboard/content clear; disabled states hold.
    - Time/Details/Review cart/trainer icons open right-hand scrollable panels; plain × closes/restores focus. Cart counts sessions; trainer counts unique trainers; zero badges hidden; changed counts pop unless reduced motion. Time title breaks before “and times”; cart removal updates both counts.
    - App popup icons/labels stay white and readable; close controls have no circle/border.

<div style="break-before: page;"></div>

<a id="ad-acceptance-worksheet"></a>

## Page 2 of 2 — A–D payment and recovery

- **Prerequisite:** separately authorised merge, fresh-main CI, deployment and sandbox activation.
  - PR32 merge/settings are currently on hold.
  - Verify saved10-minute provider timeout using a fresh invoice; old2-minute invoices retain old deadlines.
- **Evidence:** normal cache/storage;
  - Network Preserve log; original deadline and elapsed times; sanitized private traces.
  - Record confirmation latency/`confirmation_ui` marks, accounting/proof/visible-frame timing and any manual refresh; no unverified latency promise.

- [ ] **A — first paid return — CUS-016,018–019,022,024.** Book one session; double-submit once;
  - Back from provider;
  - Continue while eligible; pay once; reload/reopen receipt after5–10 minutes; compare actual inbox/provider records.
  - **Expect:** same tab, attempt/link/deadline; one booking/payment; authoritative confirmation only; no timer/Continue on provider return route; exact final provider invoice, never guessed prefix/order-ID fallback;
    - WhatsApp +65 9014 3819; no PDF/calendar actions; no duplicate notifications.
- [ ] **B — repeated bookings — CUS-017,022–023.** Run single→multi→single, plus single→single→single and multi→single→single; visit older receipt during newer unpaid and paid attempts; use Make another booking/Back home; try a supplied foreign receipt with wrong identity.
  - **Expect:** independent totals/sessions/invoices; old receipt cannot replace new payment; one effect per reservation/session; fresh usable calendar excludes occupied studio times across trainers; no foreign disclosure or completed-checkout bounce.
- [ ] **C — expiry and delayed release — CUS-020–021.** After20–25 minutes browsing, create unpaid attempt; refresh near expiry; repeat background/closed-tab expiry; observe natural50–60-minute renewal and delayed invoice only if available.
  - **Expect:** app8-minute payment,1-minute checking,3-minute recovery; provider deadline independent, never extended.
    - No expired pay link, reset budget, false confirmation or re-created checkout.
    - Paid/unknown attempts remain preserved.
  - **Expect after verified release:** “Your unpaid reservation has ended. This session may not be available to book again immediately. Please try again later. Your details are saved.” New selection clears notice; only fresh provider capacity restores availability.
    - Invoice loading ends without replaying confirmation animation; reduced motion stays static.
- [ ] **D — capacity/cache — CUS-012,015,034.** Two independent contexts race same time/different trainers; repeat partial multi-selection conflict; test retained new Review against existing checkout; compare fresh reads/warming and approved manual off-grid bookings with Admin.
  - **Expect:** “Session no longer available.”; no second payable booking; remove conflicting overlaps only; retain contact/unaffected dates; explicit View existing checkout; no full-month rebuild after confirmation.
    - Four-hour cutoff, nine50-minute starts and changeover hold;14:00–16:00 availability offers14:30 only; manual13:00–13:50 blocks12:50/13:40.
  - **Expect:** failed read ≠ empty day; no partial trainer list; snapshot expiry never extends; manual edits require fresh read/warming, not push.
    - Record provider release separately from calendar return and15-minute warming.
- **Close:** counts ___; defects/retest IDs ___; private evidence ___; tester/date ___; owner decision/exceptions ___; unavailable delays/devices remain unverified.
