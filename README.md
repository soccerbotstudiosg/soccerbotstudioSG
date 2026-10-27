# SoccerBotStudioSG

Development entry point for the SoccerBotStudioSG customer booking website. See [AGENTS](AGENTS.md#authority-and-document-ownership) for the document map and engineering instructions.

## Development setup

Use Node/npm pinned by `.nvmrc` and `package.json`, Python 3.11+ and Git. On initial setup, install the reviewed lockfile with `npm ci`; routine work reuses matching dependencies and browser caches. Browser dependencies are installed deliberately by the owner or CI.

CI uses the official Playwright Noble image matching the locked Playwright version, with browsers/system libraries already installed. Node remains pinned by `.nvmrc`; the pinned setup-python action supplies Python 3.12 for installer checks. Update the image alongside Playwright when upgrading. This avoids repeated Ubuntu mirror downloads without changing test gates or job limits.

`npm run dev` starts local development; `npm run build` creates `out/`; `npm run preview` serves that export locally. The default base path is `/SoccerBotStudioSG`; root hosting uses a separately verified empty-prefix build. Client provisioning and portability requirements live in [Service Contracts](docs/SERVICE_CONTRACTS.md#deployment-migration-and-acceptance).

## Verification commands

| Command                                     | Scope                                                           |
| ------------------------------------------- | --------------------------------------------------------------- |
| `npm run check:source` / `check:policy`     | Source ownership, imports and configuration policy.             |
| `npm run check:tooling` / `check:installer` | Tooling and guarded installer regression checks.                |
| `npm run verify:code`                       | Full non-browser application/tooling checks, build and export.  |
| `npm run verify:worker`                     | Isolated Worker types and runtime suite.                        |
| `npm run verify:browser`                    | Browser suite operated by owner/CI under AGENTS.                |
| `npm run verify`                            | Combined application/browser verification operated by owner/CI. |

## Configuration

For a local live frontend build, supply the public `NEXT_PUBLIC_TURNSTILE_SITE_KEY` through your shell or an ignored `.env.local` file. The `live-email` CI job supplies this build-time value in `.github/workflows/verify.yml`; client setup must supply the client's public widget key. Cloudflare Worker secrets separately hold the private `TURNSTILE_SECRET_KEY` and provider credentials; setting Worker secrets does not configure the static frontend build. Default local development remains demo; live builds require their own verification.

[Historical verification receipts](https://github.com/LimYouSheng/SoccerBotStudioSG/tree/d7a8d2b209b535d23a62702e4d59538e00a47012/docs) remain in Git history, not current source inventories.

## Portable deployment scaffold

`deployment/staging.json` owns the existing developer resource identity and sandbox mapping. `deployment/production.json` records the verified client account and D1 IDs but remains deliberately incomplete: supply the canonical HTTPS origin and public Turnstile key after the remaining resource/domain decisions. The required `coordinatorLocationHint` is empty for existing developer staging and `apac-ne` for the client KIX database. Production rejects an empty or unsupported hint. `worker/bindings.ts` owns all application coordinator acquisition and supplies the hint on first use; hints do not relocate existing objects or establish actual location. Neither file accepts secret fields. Missing values fail validation; production cannot inherit staging identities or enable customer/provider access.

The prepared workflows are:

| Workflow                | Operation                                                                                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `verify-target.yml`     | Manually verify the selected target/revision with frontend, backend and live-email gates. Package the tested root export, backend, SQL and optional Pages entry; no deployment credentials. |
| `deploy-staging.yml`    | Manually deploy the exact reserved, verified staging revision to the developer account.                                                                                                     |
| `deploy-production.yml` | Manually deploy the exact verified current-main revision to the client account, closed to customer/provider operations.                                                                     |

Deployment inputs are the full revision and successful target verification run ID. The deploy job checks GitHub's run/repository/attempt/gate evidence, then artifact hashes, target digest, browser composition, selected account, existing D1 and Pages project before writes. It consumes the artifact without rebuilding. Pages forwards to the same-account backend; previews and alternate origins remain denied. Production does not assume a paid GitHub environment/reviewer feature. Repository write access can dispatch workflows; this is an explicit operator action, not independent two-person approval.

Configuration to supply later (external setup is paused):

| Location                        | Required setting                                                                                                                                                                                                                                                                 |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repository variables            | `DEPLOYMENT_MODE=portable` switches off the legacy main Cloudflare job; leave unset until cutover is reviewed.                                                                                                                                                                   |
| Repository variables            | `STAGING_DEPLOY_ENABLED=true`, `PRODUCTION_DEPLOY_ENABLED=true` independently enable the prepared workflows. Leave unset during preparation.                                                                                                                                     |
| Repository variables            | `STAGING_CLOUDFLARE_ACCOUNT_ID`, `PRODUCTION_CLOUDFLARE_ACCOUNT_ID` must match their reviewed JSON targets.                                                                                                                                                                      |
| Repository variable             | `STAGING_RESERVED_REVISION` reserves exactly one full source SHA during owner testing.                                                                                                                                                                                           |
| Repository secrets              | `STAGING_CLOUDFLARE_API_TOKEN` and `PRODUCTION_CLOUDFLARE_API_TOKEN`, separately scoped to their accounts/resources. Do not put provider secrets in these JSON files or CI build inputs.                                                                                         |
| Public target JSON              | Repository, account, existing resource names/IDs, coordinator name, canonical origin, Turnstile public key and Pages production branch. Keep staging's Worker/D1/DO identities unchanged. Update the staging repository field only when moving control to the client repository. |
| Cloudflare, separately reviewed | Existing D1 and Pages project, Pages canonical domain, backend Worker secrets and immutable foundation registration. A closed first upload may create the declared Worker; it never creates databases, Pages projects, DNS, provider accounts or foundation identity.            |

A closed client install does not require a prior healthy Worker. D1 skips applied migrations; intermediate deployment receipts identify the last completed phase if upload or Pages deployment fails. Reuse the same reviewed resource IDs/artifact after diagnosing a failure. There is no automatic rollback, data reset or resource recreation. First-install/interruption behavior still needs cloud acceptance; database foundation registration and placement must be validated separately before opening access.

This scaffold is **not live client portability acceptance**. Ongoing provider service/price mappings, sender scope, production payment host/merchant contracts and activation remain closed/pending; developer-specific historical tools and accepted migrations are preserved. Finish those runtime/provider contracts before enabling client bookings. Automatic PR-to-staging deployment is also deferred; these workflows require an explicit reserved-candidate dispatch. Disable deployment in the former repository before enabling the client-owned repository.
