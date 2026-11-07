# Current checkpoint

## Current change

Branch `fix/calendar-cart-layout`, based on released PR40 main `f4aab38`. User authorized CI, staging then merge. Calendar defaults to Month; date transitions reserve the preceding times-region height to prevent transient page collapse. Selected trainer pickers collapse into compact highlighted tiles. Your Cart uses session count/Clear all without a service-dependent heading; desktop cart/session lists no longer scroll internally. Mobile retains one overflow body. Review resolves the originally selected catalogue service.

## Verification and delivery

29 focused calendar/selection tests passed, including measured loading height, collapsed selections/reload and optional rolling-week navigation. Browser assertions updated without title/inventory changes; CI and physical-device checks pending. Frontend types, scoped lint and source integrity passed. The height regression failed when its height reservation was deliberately removed, then all29 cases passed with the implementation restored. Top combined desktop Continue/amount and compact banner added by owner request; duplicate total removed. Original card sizing retained except reduced spacing for five sessions in short desktop windows. Ten affected component cases passed; browser assertions now verify five rows fit1366×768 and the action remains reachable at1100×600. Ready to publish the consolidated candidate. This work block covers one UI slice; provider/payment contracts and effects are unchanged.

## Remaining scope

Unknown SimplyBook no-creation reconciliation, production Grafana activation/contact point and analytics/Search Console/OpenGraph remain separate. Docs PR33 stays paused. PR40 passed candidate/main CI, staged and deployed production; its18 booking/HitPay sandbox settings were restored and independently read back.

CI42412507412 exposed7 direct-checkout regressions: the new Review catalogue component performed an unwanted request. Replaced it with a display-only name captured during session selection and retained in the draft, plus a read-only cache fallback for older drafts. Exact request-count assertions remain unchanged. All268 component/service tests and the strict unit receipt passed after the repair; types, scoped lint/source checks passed. Footer Book/Studio links removed with the legal-link departure guard retained. Final repaired CI pending.

Initial backend browser sizing probe selected a deliberately occupied demo time; corrected its fifth slot from16:10 to17:00. No product availability guard or sizing assertion changed.

CI42413247476 passed the five-session viewport checks in Chromium/WebKit. Its footer alignment assertion still indexed the removed fourth/fifth Services links; updated to assert3/3/4 row counts and every row on the existing measured row spacing (independently bounded29–31px). Repair is test-only; all remaining alignment/content checks retained.

CI42413890706 exposed that the footer’s actual pitch is29.6px (24px row plus5.6px gap), not exactly30px. The cross-column assertion now uses the observed reference pitch, retaining the29–31px spacing bounds, exact counts and1px alignment tolerance. No CSS change.
