# Current checkpoint

## Active outcome

Review button feedback and accurate second-tab rejection copy, based on merged PR67/main `bf2c6aba31a8f9d8f6eae778b74f5bb45537bc50`. Branch `fix/review-security-loader`. Owner requested spinner only after selecting consent while background Turnstile remains pending; provider challenge still starts when Review opens.

## Current changes

Reuse the small existing spinner in place of the payment arrow, retaining label/total and disabled admission. Interaction, failure and completion stop the background spinner. The supplied second-tab capture confirms503 `checkout_already_active`; map it separately to active-checkout guidance rather than generic session availability. Preserve existing conflict classification, original checkout ownership and capacity guards; persist only the enum reason in the existing tab-local pending-conflict snapshot.

## Evidence and next step

Focused Turnstile/direct-checkout cases pass including actual503 response mapping, retained available cart, no duplicate write and checkbox-controlled spinner. Types, lint and source checks pass. Full suite initially passed335 of337; two existing assertions still expected the superseded active-checkout copy/code. Those were updated, and all60 affected Turnstile/direct-checkout cases now pass. The other27 test files passed unchanged. Corresponding browser assertion updated; CI execution pending. Publish one draft PR after consolidation. No staging, merge or production deployment authorized for this new change; user/CI browser acceptance remains separate.
