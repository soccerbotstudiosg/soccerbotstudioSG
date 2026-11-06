# Test suite — what it protects

<!-- document-chapter-menu -->
<details>
<summary>Chapter menu</summary>

- [1. Layers and safeguards](#layers-and-safeguards)
- [2. Configured browser coverage](#configured-browser-coverage)
- [3. Evidence limits and execution](#evidence-limits-and-execution)

</details>
<!-- /document-chapter-menu -->

- The suite checks application behaviour, server authority and release integrity using synthetic data; owner UAT separately proves physical-device behaviour and real provider configuration.

<a id="layers-and-safeguards"></a>

## 1. Layers and safeguards

- **Source and tooling:** types, lint, imports, configuration policy, design checks, build/export, dependency audit and guarded installers.
  - Defends against invalid wiring, retired routes, unsafe configuration, substituted artifacts, destructive updates and known high/critical dependency advisories.
- **252 unit/component/service cases:** domain policy, React state and browser adapters.
  - Defends against invalid prices/players/times, stale async updates, lost drafts, wrong receipt ownership, access reuse after sign-out and duplicate checkout effects.
- **56 browser case definitions:** customer/experiment and live-email profiles across three browser projects.
  - Checks navigation, responsive layout, accessibility/focus, reduced motion, static booking screens with count/confirmation cues, mobile cart/trainer panels and original-position sticky controls, reload/Back, consecutive bookings, duplicate tabs and payment recovery.
  - Defends against unusable controls, stale payment invitations, accidental rebooking, false confirmation and old receipts replacing a newer checkout.
- **484 Worker cases:** isolated workerd, D1 and Durable Objects with intercepted providers; contract, recovery and sustained-runtime groups.
  - Checks identity/revocation, origin/owner isolation, catalogue completeness, shared capacity, immutable deadlines, lost/unknown writes, partial batches, signatures and late/duplicate callbacks.
  - Defends against data disclosure, double booking/payment/accounting, forged confirmation, unsafe replay, stale cache authority and recovery/storage regressions.
- **Release guards:** exact file/title inventories, zero browser retries, complete same-run/attempt receipts and source/artifact bindings.
  - Rejects skipped/missing/duplicate/failed/foreign evidence, wrong-account deployment and stale candidates; deployment consumes the verified build.

<a id="configured-browser-coverage"></a>

## 2. Configured browser coverage

- **Desktop:** Chromium / Desktop Chrome;1280×720; no mobile/touch emulation.
- **Phone:** WebKit / iPhone13;390×664; mobile/touch emulation.
- **Tablet:** WebKit / iPad7;810×1080; mobile/touch emulation.
- **Toolchain:** Playwright1.64.1, matching Noble CI image; bundled Chromium156.0.8078.4/revision1248 and WebKit27.2/revision2370.
- **Version limit:** package metadata identifies bundled engines; it is not a captured runtime patch-version receipt.
  - Descriptor screen dimensions also affect emulation.

<a id="evidence-limits-and-execution"></a>

## 3. Evidence limits and execution

- **Required CI gates:** `verify / frontend`, `verify / backend`, `verify / live-email` on the exact candidate;
  - CodeQL is separate security analysis.
- **No acceptance shortcut:** Linux WebKit is not physical Safari; no Firefox, branded Edge, real Android Chrome or continuous browser-version range is established.
- **Provider limit:** `live-email` uses synthetic integration evidence; it does not prove actual email delivery, merchant settlement, saved10-minute timeout, capacity release or production latency.
- **Human checks:** [Customer](uat/customer.md), [Admin](uat/admin.md), [Trainer](uat/trainers.md); record exact deployed revision, OS/browser/device and actual result.
- **Execution:** assistant may run non-browser code/isolated Worker checks; owner/CI operates browsers.
  - Commands: [Development](../development.md#verification-commands).
- **Sources:** [application/browser inventory](../../scripts/test-inventory.json), [Worker inventory](../../scripts/worker-test-inventory.json), [browser configuration](../../playwright.config.ts), [versions](../versions.md), [release workflow](../../.github/workflows/verify-target.yml).
