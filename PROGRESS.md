# Current checkpoint

## Current change

Branch `fix/calendar-cart-layout`, based on released PR40 main `f4aab38`. User authorized CI, staging then merge. Calendar defaults to Month; date transitions reserve the preceding times-region height to prevent transient page collapse. Selected trainer pickers collapse into compact highlighted tiles. Your Cart uses session count/Clear all without a service-dependent heading; desktop cart/session lists no longer scroll internally. Mobile retains one overflow body. Review resolves the originally selected catalogue service.

## Verification and delivery

29 focused calendar/selection tests passed, including measured loading height, collapsed selections/reload and optional rolling-week navigation. Browser assertions updated without title/inventory changes; CI and physical-device checks pending. Frontend types, scoped lint and source integrity passed. The height regression failed when its height reservation was deliberately removed, then all29 cases passed with the implementation restored. Top combined desktop Continue/amount and compact banner added by owner request; duplicate total removed. Original card sizing retained except reduced spacing for five sessions in short desktop windows. Ten affected component cases passed; browser assertions now verify five rows fit1366×768 and the action remains reachable at1100×600. Ready to publish the consolidated candidate. This work block covers one UI slice; provider/payment contracts and effects are unchanged.

## Remaining scope

Unknown SimplyBook no-creation reconciliation, production Grafana activation/contact point and analytics/Search Console/OpenGraph remain separate. Docs PR33 stays paused. PR40 passed candidate/main CI, staged and deployed production; its18 booking/HitPay sandbox settings were restored and independently read back.
