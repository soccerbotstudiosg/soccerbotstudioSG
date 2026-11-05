# Current checkpoint

Observed 5 November 2026. Historical evidence belongs in [Journey](docs/journey.md).

## Active campaign — local session card and popup

Owner initially requested local-only presentation changes and now authorizes pushing for CI. Branch `fix/session-card-dialog` starts at merged production revision `a9489e1` (PR28). Publication scope is a draft PR for CI; no staging, merge or production deployment requested.

The session card occupies one of three desktop columns, full mobile width, and shows the existing environment-specific prices with the service name. Clicking opens the shared dialog with player selection, three included features and See available times. Closing preserves the player count. No provider, capacity, checkout or price-authority changes.

Existing component and browser journeys updated without adding or renaming test cases; native dialog lifecycle supplied in jsdom. First focused failure was missing jsdom showModal. First source wrapper rejected local typography and obsolete duration CSS; corrected by using shared type roles and removing unused styles. All252 tests and build/export passed, but the wrapper refused its receipt because documentation changed during execution. The stable-source rerun passed all local code checks (252 component/service tests,184 tooling checks,31 installer tests, lint/types/audit/build and11-route export). Browser layout/focus/device acceptance remains owner/CI-only. Next: push the reviewed candidate and open a draft PR for exact-head CI. Reuse unchanged application verification; only this publication checkpoint is updated.
