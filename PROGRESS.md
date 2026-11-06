# Current checkpoint

Observed 6 November 2026 (Singapore). History: [Journey](docs/journey.md).

## PR32 public presentation and outlet-first session flow

Branch `fix/hero-session-copy`; starting head32e2018 passed CI42145064845 and staging42146035084 with matching public health. Owner now requests another UI iteration, then staging and merge, followed by revisiting the A–D tests; the latest owner decision restores a ten-minute provider timeout. This supersedes the earlier merge hold for this verified UI candidate; production activation remains held.

Implemented candidate: 15% shorter straight-edged homepage hero; second section curved top/bottom; final Contact us image promotion curved at top only; 30% smaller flag aligned lower/left; two header links with Download app removed; minimal app popup with the exact requested heading and three store links/icons; official Studio stream video only, no imagery captions; outlet-first session disclosure for Apex @ Henderson before session type, then players/inclusions/times. The expiry calendar notice now warns that the session may not be immediately bookable and asks the customer to try again later, retaining saved-details reassurance. Existing provider identities, pricing, application payment windows, recovery and capacity stay unchanged.

Validation budget: one focused outlet/pricing/parity pass, one consolidated local code verification and exact-head CI, then staging health and authorized merge. Browser execution remains owner/CI-only. Final run/deployment receipt belongs in [PR32](https://github.com/soccerbotstudiosg/soccerbotstudioSG/pull/32), avoiding status-only commits.

The requested booking-path audit found no removed or bypassed guard in the diff: route/payment locks, identity/revision protection, duplicate dispatch, selection/time rules, verified expiry release and server capacity/payment authority remain unchanged. Full local code verification passed after the expiry-message update; exact final CI remains pending.

## Remaining work

- Finish consolidated checks and publish; inspect exact-head CI and staging. Merge only that verified candidate under the owner's new instruction; verify merged-main CI/deployment separately.
- Revisit [A–D worksheet](docs/uat/simulated-user.md#current-pr29-ad-acceptance-worksheet) with the restored ten-minute provider timeout decision (admin screenshot shows10 selected; saving/effective invoice deadline unverified). Owner operates provider/browser actions; preserve original invoice due times and evidence. Do not activate production or change timing to make tests pass.
- Physical video, curves and responsive acceptance remains under Customer UAT. Wider provider/domain/email/staff/Grafana/security work remains in [Runbook](docs/runbook.md), [Admin UAT](docs/uat/admin.md) and [Trainer UAT](docs/uat/trainers.md).
