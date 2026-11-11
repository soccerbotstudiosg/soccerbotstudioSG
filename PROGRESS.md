# Current checkpoint

## Active outcome

Enable and test client Turnstile plus Resend email verification first on the existing production Workers.dev origin. Then finalize SimplyBook notifications; customers cannot self-edit/cancel/reschedule reservations. Domain cutover is deferred. Branch `feat/client-domain-email`, based on deployed main `1f5ce0b` (PR56); email activation is published in PR57, not yet deployed.

## Prepared change and evidence

Production uses its validated target-owned sender and production Turnstile secret; ongoing client identity delivery becomes part of the release configuration. Missing sender/secret fails closed. Existing guest/booking/payment/recovery logic is unchanged. Focused production tests and the complete affected Worker group pass: 168/168, no skips. Final deployment/inventory tooling passes24/24; production-only cases pass2/2 after the pre-fix regression proof. Source/type/lint checks pass. First CI frontend job passed188 tooling tests then failed documentation formatting; formatting repair is on the same PR. Full final-head CI, staging and production remain pending. Original test fixture failures and setup evidence belong in Journey.

## External setup confirmed

Resend soccerbotsg.com and all four issued DNS records verified. Existing mailbox routing/DNS preserved. Production RESEND_API_KEY binding present (value not read). Turnstile public sitekey in main matches the client widget and allows Workers.dev production plus soccerbotsg.com. SimplyBook SMTP is enabled/configured after owner setup; actual delivery remains untested. No real email has been sent by the assistant. See external-providers-config and the pending client email worksheet in simulated-user UAT. Resend connector conversation id:01a1c93d-139e-7a32-9cd4-525baed0796f.

## Next action

Finish focused guards/source review and documentation, publish one email activation PR, verify exact-head CI/staging, and follow authorized release steps. Owner then performs Turnstile/email acceptance before notification finalization. Do not infer delivery from saved SMTP settings or secret presence.

## Consolidated UI scope

Owner authorized including the desktop one-line heading fix in PR57, reducing Guest text/background25%, and adding the right-aligned pale-green Email verified/address badge. Mobile retains deliberate two-line headings. Shared status presentation now covers entry and later steps; Sign out remains entry-only. Account lifecycle13/13 passes; browser layout assertions cover Guest and a long verified address at375/430/700/1280/1440px, pending CI. The previous complete CI had only the corrected documentation-format failure; all Worker/browser gates and CodeQL passed. Local types, lint, formatting and40 design/source guard tests pass. One consolidated push is next; prior runs are superseded.
