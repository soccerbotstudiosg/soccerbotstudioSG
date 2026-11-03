# Current system diagram

Application topology shared by developer staging and the separately installed client Worker. Client CI/deployment is operational; customer launch, domain routing and live provider acceptance remain pending. Dashed telemetry links are prepared but disabled/unattached. [Architecture decisions](adr.md) · [Database schema](database-schema.md) · [System rules](../business-rules.md#current-system-rules).

```mermaid
flowchart TB
  Browser["Customer browser · Next.js static site"]
  subgraph CF["Cloudflare · separate environment/account resources"]
    Assets["Worker Static Assets · HTML / JS / CSS"]
    Worker["Application Worker · protected HTTP API"]
    D1[("D1 · access, attempts, effects, payments, receipts, snapshots")]
    DO["Account Durable Object · queue and provider coordination"]
    SQLite[("DO SQLite · coordination and encrypted token cache")]
    Cron["Minute cron · recovery and due display warming"]
    Logs["Sanitized platform logs and diagnostic summaries"]
    Tail["Tail Worker · prepared, disabled"]
  end
  SB["SimplyBook · schedules, bookings, invoices"]
  HP["HitPay sandbox · hosted payment and readback"]
  TS["Turnstile · bot verification"]
  Mail["Resend · identity email when enabled"]
  Inbox["Customer inbox"]
  Grafana["Company central Grafana · not connected"]
  CI["GitHub · frontend / backend / live-email CI"]
  Pages["GitHub Pages · separate demo export"]
  Browser --> Assets
  Browser --> Worker
  Worker <--> D1
  Worker --> DO
  DO <--> SQLite
  DO <--> D1
  DO <--> SB
  DO <--> HP
  Browser -->|hosted checkout| HP
  HP -->|return navigation| Browser
  HP -->|authenticated webhook| Worker
  SB -->|provider callback| Worker
  Worker --> TS
  Worker --> Mail
  Mail --> Inbox
  SB -.->|provider notifications require accepted settings| Inbox
  Cron --> Worker
  Worker --> Logs
  DO --> Logs
  Logs -.-> Tail
  Tail -.->|sanitized OTLP HTTP| Grafana
  CI -->|tested root artifact| Assets
  CI -->|tested Worker and migrations| Worker
  CI -->|separate demo artifact| Pages
```

Reconciliation verifies provider state before confirmation; arrows do not imply parallel provider writes or that a callback proves payment. D1 and Durable Object SQLite are separate stores. The diagram shows current integrations, not authorization to provision or activate them.

<a id="planned-client-delivery-topology"></a>

## Client delivery topology

The client repository owns staging and production deployment; both paths have successful execution evidence in Progress. The initial client Worker uses its temporary Workers.dev hostname and the latest production release restores customer/provider access disabled. Domain hookup and activation are later steps. The runtime components above apply independently to each environment.

```mermaid
flowchart TB
  Repo["One client-owned GitHub repository"]
  PR["Ready trusted PR · all configured CI gates"]
  StageGate["Trusted candidate · passing CI · one shared staging candidate"]
  Stage["Developer Cloudflare account · existing Worker / D1 / DO retained"]
  TestProviders["Separate SimplyBook test account · HitPay sandbox"]
  Review["Owner staging acceptance · merge"]
  Main["Main · independent merged-revision CI gates"]
  Approval["Trusted-main controller · verified current main"]
  Prod["Client Cloudflare account · separate Worker / D1 / DO"]
  Registrar["Client registrar · transfer after zone activation"]
  DNS["Client Cloudflare DNS · soccerbotsg.com · delegation pending"]
  Host["Later custom domain · configuration and TLS proof pending"]
  LiveProviders["Client SimplyBook · HitPay live"]
  StageSecrets["Staging configuration / scoped credentials"]
  ProdSecrets["Production configuration / scoped credentials"]
  Repo --> PR --> StageGate
  StageGate -->|trusted-main controller| Stage
  StageSecrets --> Stage
  Stage <--> TestProviders
  Stage --> Review --> Main --> Approval
  Approval -->|verified production artifact| Prod
  DNS -.->|active zone required before transfer| Registrar
  DNS --> Host --> Prod
  ProdSecrets --> Prod
  Prod -.->|closed until provider acceptance| LiveProviders
  Temporary["Workers.dev bootstrap · existing D1 · apac-ne first-use hint"]
  Temporary --> Prod
```
