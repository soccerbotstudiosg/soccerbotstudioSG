import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import YAML from "yaml";
import { checkPolicy, policyInputs } from "./check-policy.mjs";
import { checkExport } from "./check-export.mjs";
import { checkSeoExport } from "./check-seo.mjs";
import { exportServer } from "./serve-export.mjs";

for (const [name, mutate] of [
  ["legacy automatic trigger", (d) => (d.on.pull_request = {})],
  [
    "Cloudflare missing backend gate",
    (d) => d.jobs.cloudflare.needs.splice(1, 1),
  ],
  ["Cloudflare deploy on failure", (d) => (d.jobs.cloudflare.if = "always()")],
  [
    "Cloudflare unverified build",
    (d) => d.jobs.cloudflare.steps.push({ run: "npm run build" }),
  ],
  [
    "Cloudflare foreign artifact",
    (d) => (d.jobs.cloudflare.steps[3].run += " --repo foreign/repo"),
  ],
  [
    "Cloudflare token exposed to verification",
    (d) =>
      (d.jobs.backend.env.CLOUDFLARE_API_TOKEN =
        "${{ secrets.CLOUDFLARE_API_TOKEN }}"),
  ],
  ["missing verification dependency", (d) => delete d.jobs.deploy.needs],
  [
    "deploy despite failed verification",
    (d) => (d.jobs.deploy.if = "always()"),
  ],
  [
    "deployment from a PR",
    (d) => (d.jobs.deploy.if = "github.event_name == 'pull_request'"),
  ],
  [
    "PR write permissions",
    (d) => (d.jobs.frontend.permissions = { pages: "write" }),
  ],
  [
    "wrong export directory",
    (d) =>
      (d.jobs.frontend.steps.find((step) =>
        step.uses?.startsWith("actions/upload-pages-artifact@"),
      ).with.path = "."),
  ],
  [
    "upload before testing",
    (d) =>
      d.jobs.frontend.steps.unshift(
        d.jobs.frontend.steps.splice(
          d.jobs.frontend.steps.findIndex((step) =>
            step.uses?.startsWith("actions/upload-pages-artifact@"),
          ),
          1,
        )[0],
      ),
  ],
  [
    "upload on failed test",
    (d) =>
      (d.jobs.frontend.steps.find((step) =>
        step.uses?.startsWith("actions/upload-pages-artifact@"),
      ).if = "always()"),
  ],
  [
    "unverified rebuild during deployment",
    (d) => d.jobs.deploy.steps.unshift({ run: "npm run build" }),
  ],
  [
    "unpinned deployment action",
    (d) => (d.jobs.deploy.steps[0].uses = "actions/deploy-pages@main"),
  ],
  [
    "root path on project hosting",
    (d) => (d.jobs.frontend.env.NEXT_PUBLIC_BASE_PATH = ""),
  ],
  [
    "deployment write permission outside Pages",
    (d) => (d.jobs.deploy.permissions.contents = "write"),
  ],
  [
    "main deployment cancellation",
    (d) => (d.concurrency["cancel-in-progress"] = true),
  ],
  [
    "combined gate replaced",
    (d) =>
      (d.jobs.frontend.steps.find((step) => step.run === "npm run verify").run =
        "npm run build"),
  ],
  [
    "alternate checkout revision",
    (d) => (d.jobs.frontend.steps[0].with = { ref: "old-branch" }),
  ],
])
  test(`Pages policy rejects ${name}`, () => {
    const inputs = policyInputs(process.cwd()),
      doc = YAML.parse(inputs.workflow);
    mutate(doc);
    inputs.workflow = YAML.stringify(doc);
    assert.ok(checkPolicy(inputs).length);
  });

function fixture(t, basePath, indexingOverride) {
  const root = mkdtempSync(join(tmpdir(), "soccerbot-export-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const write = (file, value) => {
    const path = join(root, file);
    mkdirSync(join(path, ".."), { recursive: true });
    writeFileSync(path, value);
  };
  const html = `<head><script>document.documentElement.dataset.documentNavigation=performance.getEntriesByType("navigation")[0]?.type||"navigate";</script></head><body><div id="page-refresh-content" inert style="visibility:hidden"><main><a class="arena-booking" href="${basePath}/book/account/">Book</a><img src="${basePath}/assets/photo.jpg"></main></div><div id="page-refresh" style="position:fixed;inset:0"><div role="status" aria-label="Loading page"><span class="document-reload-message">Refreshing…</span><span class="document-navigation-message">Loading...</span></div></div><script src="${basePath}/_next/app.js"></script><link rel="stylesheet" href="${basePath}/_next/app.css">`;
  for (const file of [
    "index.html",
    "404.html",
    "studio/index.html",
    "enquiry/index.html",
    "confirmation/index.html",
    "terms-of-service/index.html",
    "privacy-policy/index.html",
    "refund-policy/index.html",
    ...[
      "account",
      "session",
      "time",
      "details",
      "review",
      "payment",
      "confirmation",
    ].map((s) => `book/${s}/index.html`),
  ])
    write(file, html);
  for (const file of [
    "book/review/index.html",
    "book/payment/index.html",
    "book/confirmation/index.html",
    "confirmation/index.html",
  ])
    write(
      file,
      html
        .replace(
          "Loading...</span>",
          '<span class="document-review-entry">Checking booking… Please do not close or refresh.</span><span class="document-review-return">Checking payment… Please do not close or refresh.</span></span>',
        )
        .replace(
          'aria-label="Loading page"',
          file === "book/review/index.html"
            ? 'aria-label="Checking booking…"'
            : 'aria-label="Checking payment…"',
        ),
    );
  write("_next/app.js", "export {};");
  write("assets/photo.jpg", "synthetic image");
  write(
    "_next/app.css",
    [1, 2, 3, 4]
      .map(
        (n) =>
          `@font-face{font-family: Test${n};src:url(${basePath}/assets/font${n}.woff2)}`,
      )
      .join("\n"),
  );
  for (const n of [1, 2, 3, 4])
    write(`assets/font${n}.woff2`, "synthetic font");
  const publicPaths = [
    "/",
    "/studio/",
    "/enquiry/",
    "/terms-of-service/",
    "/privacy-policy/",
  ];
  const indexable =
    indexingOverride ??
    (process.env.RELEASE_TARGET === "production" &&
      process.env.NEXT_PUBLIC_BOOKING_MODE === "live" &&
      basePath === "");
  const htmlFiles = [
    "index.html",
    "404.html",
    "studio/index.html",
    "enquiry/index.html",
    "confirmation/index.html",
    "terms-of-service/index.html",
    "privacy-policy/index.html",
    "refund-policy/index.html",
    ...[
      "account",
      "session",
      "time",
      "details",
      "review",
      "payment",
      "confirmation",
    ].map((step) => `book/${step}/index.html`),
  ];
  for (const file of htmlFiles) {
    const route =
      file === "index.html" ? "/" : `/${file.replace(/index\.html$/, "")}`;
    const publicPage =
      publicPaths.includes(route) || route === "/refund-policy/";
    const canonical =
      "https://soccerbotsg.com" +
      (route === "/refund-policy/" ? "/terms-of-service/" : route);
    const metadata =
      `<meta name="robots" content="${indexable && publicPage ? "index, follow" : "noindex, nofollow"}">` +
      (publicPage
        ? `<title>${route}</title><meta name="description" content="Description ${route}"><link rel="canonical" href="${canonical}"><meta property="og:url" content="${canonical}">${["og:title", "twitter:title"].map((key) => `<meta ${key.startsWith("og:") ? "property" : "name"}="${key}" content="${route}">`).join("")}${["og:description", "twitter:description"].map((key) => `<meta ${key.startsWith("og:") ? "property" : "name"}="${key}" content="Description ${route}">`).join("")}${["og:image", "twitter:image"].map((key) => `<meta ${key.startsWith("og:") ? "property" : "name"}="${key}" content="https://soccerbotsg.com/assets/soccerbot-social-preview.jpg">`).join("")}`
        : "");
    const schema =
      file === "index.html"
        ? `<script type="application/ld+json">${JSON.stringify({ "@type": "SportsActivityLocation", url: "https://soccerbotsg.com/", image: "https://soccerbotsg.com/assets/soccerbot-social-preview.jpg", logo: "https://soccerbotsg.com/assets/c275ccd87afb.svg", telephone: "+6590143819", address: { postalCode: "159545" }, openingHoursSpecification: [{ opens: "12:00", closes: "20:00", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "PublicHolidays"] }] })}</script>`
        : "";
    write(
      file,
      readFileSync(join(root, file), "utf8").replace(
        "<head>",
        "<head>" + metadata + schema,
      ),
    );
  }
  write(
    "sitemap.xml",
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${indexable ? publicPaths.map((path) => `<url><loc>https://soccerbotsg.com${path}</loc></url>`).join("") : ""}</urlset>`,
  );
  write(
    "robots.txt",
    indexable
      ? "User-Agent: *\nAllow: /\nDisallow: /api/\nSitemap: https://soccerbotsg.com/sitemap.xml\n"
      : "User-Agent: *\nDisallow: /\n",
  );
  return { root, write };
}
for (const basePath of ["", "/SoccerBotStudioSG"]) {
  test(`export integrity and HTTP mount at ${basePath || "root"}`, async (t) => {
    const { root } = fixture(t, basePath);
    assert.equal(checkExport(root, basePath).routes, 15);
    const server = exportServer(root, basePath);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    t.after(
      () =>
        new Promise((resolve) => {
          server.closeAllConnections();
          server.close(resolve);
        }),
    );
    const origin = `http://127.0.0.1:${server.address().port}`;
    for (const route of [
      "/",
      "/book/payment/",
      "/_next/app.js",
      "/assets/font1.woff2",
    ])
      assert.equal((await fetch(origin + basePath + route)).status, 200, route);
    assert.equal((await fetch(origin + basePath + "/admin/")).status, 404);
    assert.equal(
      (await fetch(origin + basePath + "/%2e%2e%2fpackage.json")).status,
      404,
    );
    if (basePath) {
      assert.equal((await fetch(origin + "/assets/photo.jpg")).status, 404);
      assert.equal((await fetch(origin + basePath + "-other/")).status, 404);
      const redirect = await fetch(origin + basePath, { redirect: "manual" });
      assert.equal(redirect.status, 308);
      assert.equal(redirect.headers.get("location"), basePath + "/");
    }
  });
}
test("preview handler failure stays unavailable and never becomes a static missing page", async (t) => {
  const { root } = fixture(t, "/SoccerBotStudioSG");
  const messages = [];
  t.mock.method(console, "error", (message) =>
    messages.push(JSON.parse(message)),
  );
  const server = exportServer(root, "/SoccerBotStudioSG", async () => {
    const error = new Error("synthetic private diagnostic");
    error.code = "ECONNRESET";
    error.cause = { code: "private detail must not leak" };
    throw error;
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(
    () =>
      new Promise((resolve) => {
        server.closeAllConnections();
        server.close(resolve);
      }),
  );
  const response = await fetch(
    `http://127.0.0.1:${server.address().port}/api/attempts/synthetic/checkout`,
  );
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("content-type"), "application/json");
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), {
    error: "preview_handler_unavailable",
  });
  assert.deepEqual(messages, [
    { event: "preview_handler_failed", code: "ECONNRESET", causeCode: null },
  ]);
});

for (const [name, mutate, error] of [
  [
    "README homepage",
    (f) => f.write("index.html", "<h1>SoccerBotStudioSG README</h1>"),
    /not the SoccerBot app/,
  ],
  [
    "root-relative image",
    (f) => f.write("studio/index.html", '<img src="/assets/photo.jpg">'),
    /Unprefixed/,
  ],
  [
    "root-relative font",
    (f) => f.write("_next/app.css", "@font-face{src:url(/assets/font1.woff2)}"),
    /Unprefixed/,
  ],
  [
    "retired Experiment route",
    (f) => f.write("experiment/index.html", "<h1>Synthetic preview</h1>"),
    /Retired Experiment route/,
  ],
  [
    "missing booking route",
    (f) => rmSync(join(f.root, "book/payment/index.html")),
    /Missing exported route/,
  ],
  [
    "missing confirmation route",
    (f) => rmSync(join(f.root, "confirmation/index.html")),
    /Missing exported route/,
  ],
  [
    "missing initial refresh cover",
    (f) => {
      const file = "confirmation/index.html";
      const original = readFileSync(join(f.root, file), "utf8");
      const broken = original.replace(
        'id="page-refresh"',
        'id="missing-cover"',
      );
      assert.notEqual(broken, original);
      f.write(file, broken);
    },
    /Missing initial refresh cover/,
  ],
  ...[
    "documentNavigation",
    "document-reload-message",
    "document-navigation-message",
  ].map((part) => [
    `missing pre-hydration feedback ${part}`,
    (f) => {
      const file = "confirmation/index.html";
      const original = readFileSync(join(f.root, file), "utf8");
      const broken = original.replace(part, "missing-feedback");
      assert.notEqual(broken, original);
      f.write(file, broken);
    },
    /Missing pre-hydration navigation feedback/,
  ]),
  ...["document-review-entry", "document-review-return"].map((part) => [
    `missing Review history feedback ${part}`,
    (f) => {
      const file = "book/review/index.html";
      const original = readFileSync(join(f.root, file), "utf8");
      const broken = original.replace(part, "missing-feedback");
      assert.notEqual(broken, original);
      f.write(file, broken);
    },
    /Missing pre-hydration navigation feedback/,
  ]),
  [
    "visible incomplete content",
    (f) => {
      const file = "studio/index.html";
      const original = readFileSync(join(f.root, file), "utf8");
      const broken = original.replace(
        "visibility:hidden",
        "visibility:visible",
      );
      assert.notEqual(broken, original);
      f.write(file, broken);
    },
    /Missing initial refresh cover/,
  ],
  ...["book/review", "book/payment", "book/confirmation", "confirmation"].map(
    (route) => [
      `generic checkout cover at ${route}`,
      (f) => {
        const file = `${route}/index.html`;
        const original = readFileSync(join(f.root, file), "utf8");
        const broken = original.replace(
          route === "book/review"
            ? 'aria-label="Checking booking…"'
            : 'aria-label="Checking payment…"',
          'aria-label="Loading page"',
        );
        assert.notEqual(broken, original);
        f.write(file, broken);
      },
      /Missing initial refresh cover/,
    ],
  ),
  [
    "checkout message on a public page",
    (f) => {
      const file = "studio/index.html";
      const original = readFileSync(join(f.root, file), "utf8");
      f.write(
        file,
        original.replace(
          'aria-label="Loading page"',
          'aria-label="Checking booking…"',
        ),
      );
    },
    /Missing initial refresh cover/,
  ],
  [
    "missing image",
    (f) => rmSync(join(f.root, "assets/photo.jpg")),
    /Missing export target/,
  ],
  [
    "source file leakage",
    (f) => f.write("package.json", "{}"),
    /Source leaked/,
  ],
])
  test(`export rejects ${name}`, (t) => {
    const f = fixture(t, "/SoccerBotStudioSG");
    mutate(f);
    assert.throws(() => checkExport(f.root, "/SoccerBotStudioSG"), error);
  });

test("site paths support repository and root builds, refusing unreviewed prefixes", () => {
  for (const [prefix, status, expected] of [
    ["", 0, "/book/account/"],
    ["/SoccerBotStudioSG", 0, "/SoccerBotStudioSG/book/account/"],
    ["//wrong", 1, null],
  ]) {
    const child = spawnSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        'import {sitePath} from "./src/content/site-path.ts"; console.log(sitePath("/book/account/"));',
      ],
      {
        env: { ...process.env, NEXT_PUBLIC_BASE_PATH: prefix },
        encoding: "utf8",
      },
    );
    assert.equal(child.status, status, child.stderr);
    if (expected) assert.equal(child.stdout.trim(), expected);
  }
});

test("SEO export checks production root, staging root and demo subpath identities", (t) => {
  for (const [basePath, indexable] of [
    ["", true],
    ["", false],
    ["/SoccerBotStudioSG", false],
  ]) {
    const f = fixture(t, basePath, indexable);
    assert.equal(
      checkSeoExport(f.root, basePath, indexable).indexable,
      indexable,
    );
  }
});

test("SEO robots rejects public-route blocks and wrong user-agent scope", (t) => {
  const f = fixture(t, "", true);
  const original = readFileSync(join(f.root, "robots.txt"), "utf8");
  for (const altered of [
    original + "Disallow: /studio/\n",
    original.replace("User-Agent: *", "User-Agent: OtherBot"),
  ]) {
    f.write("robots.txt", altered);
    assert.throws(() => checkSeoExport(f.root, "", true), /Robots policy/);
  }
});

// Mutations prove the artifact gate rejects indexing leaks and incorrect public identity.
for (const [name, file, replace, error] of [
  [
    "missing public canonical",
    "studio/index.html",
    (text) => text.replace(/<link rel="canonical"[^>]*>/, ""),
    /Canonical count/,
  ],
  [
    "query-bearing canonical",
    "studio/index.html",
    (text) =>
      text.replace(
        'href="https://soccerbotsg.com/studio/"',
        'href="https://soccerbotsg.com/studio/?tracking=test"',
      ),
    /Canonical URL/,
  ],
  [
    "indexable customer receipt",
    "confirmation/index.html",
    (text) => text.replace("noindex, nofollow", "index, follow"),
    /Incorrect robots/,
  ],
  [
    "private sitemap URL",
    "sitemap.xml",
    (text) =>
      text.replace(
        "</urlset>",
        "<url><loc>https://soccerbotsg.com/confirmation/?attempt=synthetic</loc></url></urlset>",
      ),
    /Sitemap index boundary/,
  ],
  [
    "wrong social image",
    "index.html",
    (text) =>
      text.replace(
        /(<meta property="og:image" content=")[^"]+/,
        "$1https://wrong.invalid/missing.jpg",
      ),
    /Social metadata/,
  ],
  [
    "contradictory robots",
    "index.html",
    (text) => text.replace("noindex, nofollow", "noindex, index, nofollow"),
    /Incorrect robots/,
  ],
  [
    "wrong opening day",
    "index.html",
    (text) => text.replace('"Monday"', '"NotADay"'),
    /Business opening days/,
  ],
  [
    "invalid business JSON",
    "index.html",
    (text) => text.replace('"SportsActivityLocation"', "INVALID"),
    /JSON/,
  ],
])
  test(`SEO export rejects ${name}`, (t) => {
    const f = fixture(t, "/SoccerBotStudioSG");
    f.write(file, replace(readFileSync(join(f.root, file), "utf8")));
    assert.throws(
      () => checkSeoExport(f.root, "/SoccerBotStudioSG", false),
      error,
    );
  });
