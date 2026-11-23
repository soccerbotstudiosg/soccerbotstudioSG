import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
const origin = JSON.parse(
  readFileSync(new URL("../deployment/production.json", import.meta.url)),
).origin;
// Independent expected routes: never infer indexability from the artifact being checked.
const publicRoutes = [
  "/",
  "/studio/",
  "/enquiry/",
  "/terms-of-service/",
  "/privacy-policy/",
];
/** Check canonical, crawler and structured-data boundaries in the actual static artifact. */
export function checkSeoExport(
  root,
  basePath,
  indexable = process.env.RELEASE_TARGET === "production" &&
    process.env.NEXT_PUBLIC_BOOKING_MODE === "live" &&
    basePath === "",
) {
  const files = readdirSync(root, { recursive: true }).filter((file) =>
    file.endsWith(".html"),
  );
  const titles = new Set(),
    descriptions = new Set();
  for (const file of files) {
    const route =
      file === "index.html" ? "/" : `/${file.replace(/index\.html$/, "")}`;
    const isPublic = publicRoutes.includes(route);
    const dom = new JSDOM(readFileSync(resolve(root, file), "utf8"));
    try {
      const doc = dom.window.document;
      const robots = [...doc.querySelectorAll('meta[name="robots"]')].flatMap(
        (node) => node.content.toLowerCase().split(/,\s*/),
      );
      const shouldIndex =
        indexable && (isPublic || route === "/refund-policy/");
      assert.ok(
        robots.includes(shouldIndex ? "index" : "noindex") &&
          !robots.includes(shouldIndex ? "noindex" : "index") &&
          !robots.includes(shouldIndex ? "none" : "all"),
        `Incorrect robots: ${file}`,
      );
      const canonicals = doc.querySelectorAll('link[rel="canonical"]');
      if (isPublic || route === "/refund-policy/") {
        const canonical =
          origin + (route === "/refund-policy/" ? "/terms-of-service/" : route);
        assert.equal(canonicals.length, 1, `Canonical count: ${file}`);
        assert.equal(canonicals[0].href, canonical, `Canonical URL: ${file}`);
        assert.equal(
          doc.querySelector('meta[property="og:url"]')?.content,
          canonical,
          `Social URL: ${file}`,
        );
        assert.ok(doc.title.trim(), `Missing title: ${file}`);
        const description = doc.querySelector(
          'meta[name="description"]',
        )?.content;
        assert.ok(description?.trim(), `Missing description: ${file}`);
        for (const [selector, expected] of [
          ['meta[property="og:title"]', doc.title],
          ['meta[name="twitter:title"]', doc.title],
          ['meta[property="og:description"]', description],
          ['meta[name="twitter:description"]', description],
          [
            'meta[property="og:image"]',
            `${origin}/assets/soccerbot-social-preview.jpg`,
          ],
          [
            'meta[name="twitter:image"]',
            `${origin}/assets/soccerbot-social-preview.jpg`,
          ],
        ]) {
          const nodes = doc.querySelectorAll(selector);
          assert.equal(
            nodes.length,
            1,
            `Social metadata count ${selector}: ${file}`,
          );
          assert.equal(
            nodes[0].content,
            expected,
            `Social metadata ${selector}: ${file}`,
          );
        }
        if (isPublic) {
          assert.ok(!titles.has(doc.title), `Duplicate public title: ${file}`);
          assert.ok(
            !descriptions.has(description),
            `Duplicate public description: ${file}`,
          );
          titles.add(doc.title);
          descriptions.add(description);
        }
      } else
        assert.equal(
          canonicals.length,
          0,
          `Private/error route canonical: ${file}`,
        );
      if (route === "/") {
        const scripts = doc.querySelectorAll(
          'script[type="application/ld+json"]',
        );
        assert.equal(scripts.length, 1, "Expected one business identity");
        const business = JSON.parse(scripts[0].textContent);
        assert.equal(business["@type"], "SportsActivityLocation");
        assert.equal(business.url, origin + "/");
        assert.equal(
          business.image,
          `${origin}/assets/soccerbot-social-preview.jpg`,
        );
        assert.equal(business.logo, `${origin}/assets/c275ccd87afb.svg`);
        assert.equal(business.telephone, "+6590143819");
        assert.equal(business.address.postalCode, "159545");
        assert.equal(business.openingHoursSpecification[0].opens, "12:00");
        assert.equal(business.openingHoursSpecification[0].closes, "20:00");
        assert.deepEqual(
          business.openingHoursSpecification[0].dayOfWeek,
          [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
            "PublicHolidays",
          ],
          "Business opening days",
        );
        assert.ok(!business.aggregateRating && !business.review);
      }
    } finally {
      dom.window.close();
    }
  }
  for (const route of publicRoutes)
    assert.ok(
      files.includes(
        route === "/" ? "index.html" : route.slice(1) + "index.html",
      ),
      `Missing public route: ${route}`,
    );
  const xml = new JSDOM(readFileSync(resolve(root, "sitemap.xml"), "utf8"), {
    contentType: "text/xml",
  });
  try {
    assert.deepEqual(
      [...xml.window.document.querySelectorAll("loc")]
        .map((node) => node.textContent)
        .sort(),
      indexable ? publicRoutes.map((route) => origin + route).sort() : [],
      "Sitemap index boundary",
    );
    assert.equal(
      xml.window.document.querySelectorAll("lastmod").length,
      0,
      "Do not fabricate modification dates",
    );
  } finally {
    xml.window.close();
  }
  const robots = readFileSync(resolve(root, "robots.txt"), "utf8");
  // Enforce the complete generated policy, including user-agent scope. Checking
  // isolated lines would miss a more-specific Disallow that blocks public pages.
  const directives = robots
    .split(/\r?\n/)
    .map((line) => line.split("#")[0].trim())
    .filter(Boolean);
  assert.deepEqual(
    directives,
    indexable
      ? [
          "User-Agent: *",
          "Allow: /",
          "Disallow: /api/",
          `Sitemap: ${origin}/sitemap.xml`,
        ]
      : ["User-Agent: *", "Disallow: /"],
    "Robots policy",
  );
  return { indexable, publicPages: publicRoutes.length };
}
