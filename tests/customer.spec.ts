import { sitePath } from "../src/content/site-path";
import { expect, test, type Page } from "@playwright/test";
import { addDays, dateLabel } from "../src/domain/dates";
const DEMO_TODAY = "2026-10-05";
test.beforeEach(async ({ page }) => {
  // Payment deadlines need Date.now() to advance alongside the timers.
  await page.clock.install({ time: new Date("2026-10-05T08:00:00+08:00") });
});
async function openSite(page: Page, route: string) {
  await page.goto(sitePath(route));
  const prompt = page.getByRole("dialog", {
    name: "Get the Soccerbot360 Player App",
  });
  await expect(prompt).toBeVisible();
  await prompt
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await expect(prompt).toHaveCount(0);
}
/** Open the same information through the phone panel or retain the desktop presentation. */
async function openBookingPanel(page: Page, panel: "cart" | "trainers") {
  if (page.viewportSize()!.width > 700) return;
  await page
    .getByRole("button", {
      name: panel === "cart" ? /^Open cart,/ : /^View selected trainers,/,
    })
    .click();
  const dialog = page.getByRole("dialog", {
    name: panel === "cart" ? "Your Cart" : "Selected trainers",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  const panelHeader = dialog.locator(".booking-panel-header");
  const panelBody = dialog.locator(".booking-panel-body");
  await expect(panelHeader).toHaveCSS("position", "sticky");
  await expect(panelBody).toHaveCSS("overflow-y", "auto");
  const headerBefore = await panelHeader.boundingBox();
  await panelBody.evaluate((node) => {
    node.scrollTop = node.scrollHeight;
  });
  const headerAfter = await panelHeader.boundingBox();
  expect(headerAfter!.y).toBeCloseTo(headerBefore!.y, 0);
  await expect(
    dialog.getByRole("button", { name: "Close dialog" }),
  ).toBeInViewport();
  await panelBody.evaluate((node) => {
    node.scrollTop = 0;
  });

  await expect(
    dialog.getByRole("link", {
      name: /^Enter Booking Details(?: \$[\d,.]+)?$/,
      exact: true,
    }),
  ).toHaveCount(0);
  const box = await dialog.boundingBox();
  expect(box!.width).toBeGreaterThan(page.viewportSize()!.width * 0.65);
  expect(box!.width).toBeLessThanOrEqual(page.viewportSize()!.width * 0.75);
  expect(box!.height).toBeLessThanOrEqual(
    page.viewportSize()!.height * 0.65 + 1,
  );
  await expect(dialog.getByRole("button", { name: "Close dialog" })).toHaveCSS(
    "border-top-width",
    "0px",
  );
}
/** Dismiss phone panels before interacting with the underlying booking page. */
async function closeBookingPanel(page: Page) {
  if (page.viewportSize()!.width > 700) return;
  await page
    .locator(".booking-panel-dialog")
    .getByRole("button", { name: "Close dialog" })
    .click();
  await expect(page.locator(".booking-panel-dialog")).toHaveCount(0);
}
async function chooseSlots(page: Page, multiple = false) {
  await openSite(page, "/book/account/");
  await page.getByRole("button", { name: "Continue as Guest" }).click();
  await page.getByRole("link", { name: "Choose Date & Time" }).click();
  await page
    .getByRole("button", {
      name: dateLabel(addDays(DEMO_TODAY, 1)),
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: /12:00–12:40/ }).click();
  await page
    .getByRole("combobox", { name: /Trainer for .* at 12:00/ })
    .selectOption({ index: 1 });
  if (page.viewportSize()!.width <= 700) {
    await expect(
      page
        .getByRole("button", { name: "Open cart, 1 session", exact: true })
        .locator(".booking-cart-count"),
    ).toHaveText("1");
    await expect(
      page
        .getByRole("button", {
          name: "View selected trainers, 1 trainer",
          exact: true,
        })
        .locator(".booking-cart-count"),
    ).toHaveText("1");
  }
  if (multiple) {
    await page
      .getByRole("button", {
        name: dateLabel(addDays(DEMO_TODAY, 2)),
        exact: true,
      })
      .click();
    await page.getByRole("button", { name: /12:00–12:40/ }).click();
    await page
      .getByRole("combobox", { name: /Trainer for .* at 12:00/ })
      .selectOption({ index: 1 });
  }
  if (page.viewportSize()!.width <= 700) {
    await expect(
      page.getByRole("button", {
        name: `Open cart, ${multiple ? "2 sessions" : "1 session"}`,
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("complementary", { name: "Your booking summary" }),
    ).toHaveCount(0);
  }
  await expect(
    page.locator(".booking-primary-action .booking-action-total").first(),
  ).toHaveText(multiple ? "$176.00" : "$88.00");
  await page
    .getByRole("link", {
      name: /^Enter Booking Details(?: \$[\d,.]+)?$/,
      exact: true,
    })
    .first()
    .click();
  await expect(
    page.locator(".booking-primary-action .booking-action-total").first(),
  ).toHaveText(multiple ? "$176.00" : "$88.00");
  await openBookingPanel(page, "cart");
  await expect(
    page
      .getByRole("complementary", { name: "Your booking summary" })
      .getByRole("listitem"),
  ).toHaveCount(multiple ? 2 : 1);
  await closeBookingPanel(page);
}
async function details(page: Page) {
  await page.getByLabel("Full name", { exact: false }).fill("Demo Customer");
  await page
    .getByRole("textbox", { name: /^Email address/ })
    .fill("customer@example.com");
  await page
    .getByLabel("Mobile number", { exact: false })
    .fill("+65 8123 4567");
  await page
    .getByRole("button", { name: "Confirm email address is correct" })
    .click();
  await page
    .getByRole("button", { name: /^Review Booking \$[\d,.]+$/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Order Summary", exact: true }),
  ).toBeVisible();
  const totalText = await page
    .locator(".booking-document .line-item.total strong")
    .innerText();
  await expect(
    page.locator(".booking-primary-action .booking-action-total").first(),
  ).toHaveText(totalText.replace(/^SGD\s*/, ""));
  if (page.viewportSize()!.width <= 700) {
    await openBookingPanel(page, "cart");
    const cart = page.getByRole("dialog", { name: "Your Cart", exact: true });
    await expect(
      cart.getByRole("complementary", { name: "Your booking summary" }),
    ).toBeVisible();
    await expect(
      cart.getByRole("heading", { name: "Order Summary" }),
    ).toHaveCount(0);
    await closeBookingPanel(page);
  }
  await page.getByRole("checkbox", { name: /I’ve reviewed/ }).check();
}
async function payAttempt(page: Page, outcome = "success") {
  await page.getByRole("button", { name: /^Pay \$/ }).click();
  await expect(
    page.getByRole("heading", { name: "Processing payment", exact: true }),
  ).toBeVisible();
  if (outcome !== "success") {
    // Adverse provider states are test fixtures, never controls in the customer UI.
    await page.evaluate((outcome) => {
      const key = "soccerbot-next-demo-v2";
      const stored = JSON.parse(sessionStorage.getItem(key)!);
      stored.attempt.outcome = outcome;
      sessionStorage.setItem(key, JSON.stringify(stored));
    }, outcome);
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Processing payment", exact: true }),
    ).toBeVisible();
  }
  await page.clock.runFor(5000);
}
async function payment(page: Page, outcome = "success") {
  await page
    .getByRole("button", { name: /^Proceed to Payment \$[\d,.]+$/ })
    .click();
  await payAttempt(page, outcome);
}
/** Hold application scripts until every route proves its initial refresh cover. */
async function checkRefreshCover(hostPage: Page, paths: string[]) {
  const errors: string[] = [];
  for (const path of paths) {
    const page = await hostPage.context().newPage();
    await page.clock.install({ time: new Date("2026-10-05T08:00:00+08:00") });
    await page.addInitScript(() => {
      localStorage.setItem("soccerbot-player-app-prompt", "true");
    });
    const recordError = (error: Error) => errors.push(error.message);
    page.on("pageerror", recordError);
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const scripts = /\/_next\/.*\.js(?:\?|$)/;
    await page.route(scripts, async (route) => {
      await gate;
      await route.continue();
    });
    try {
      await page.goto(sitePath(path), { waitUntil: "commit" });
      const cover = page.locator("#page-refresh");
      await expect(
        cover.getByRole("status", { name: "Refreshing…" }),
      ).toBeVisible();
      await expect(page.locator("#page-refresh-content")).toHaveAttribute(
        "inert",
        "",
      );
      await expect(page.locator("#main")).not.toBeVisible();
      await expect(page.locator(".site-footer")).not.toBeVisible();
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect(
        cover.getByRole("status", { name: "Refreshing…" }),
      ).toBeVisible();
      await page.emulateMedia({ reducedMotion: "no-preference" });
      const bounds = await cover.boundingBox();
      expect(bounds).toEqual({ x: 0, y: 0, ...page.viewportSize()! });
      await page.evaluate(() => {
        const check = (source: string) => {
          if (document.getElementById("page-refresh")) return;
          const main = document.getElementById("main");
          const loading = [...document.querySelectorAll(".page-loading")].some(
            (node) => {
              const box = node.getBoundingClientRect();
              return (
                getComputedStyle(node).visibility === "visible" &&
                // Fixed overlays fill the layout viewport, excluding its reserved scrollbar gutter.
                box.width >= document.documentElement.clientWidth - 1 &&
                box.height >= innerHeight - 1
              );
            },
          );
          if (main && main.getBoundingClientRect().height <= 1 && !loading) {
            document.documentElement.dataset.refreshGap = "true";
            document.documentElement.dataset[
              source === "frame" ? "refreshFrameGap" : "refreshMutationGap"
            ] = "true";
            if (!document.documentElement.dataset.refreshGapDetail)
              document.documentElement.dataset.refreshGapDetail =
                JSON.stringify({
                  source,
                  path: location.pathname,
                  viewport: [innerWidth, innerHeight],
                  clientWidth: document.documentElement.clientWidth,
                  root: document.documentElement
                    .getBoundingClientRect()
                    .toJSON(),
                  main: main.innerHTML.slice(0, 1000),
                  loaders: [...document.querySelectorAll(".page-loading")].map(
                    (node) => ({
                      box: node.getBoundingClientRect().toJSON(),
                      visibility: getComputedStyle(node).visibility,
                      label: node.getAttribute("aria-label"),
                    }),
                  ),
                });
          }
        };
        const observer = new MutationObserver(() => check("mutation"));
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
        });
        let frame = 0;
        const sample = () => {
          check("frame");
          frame = requestAnimationFrame(sample);
        };
        frame = requestAnimationFrame(sample);
        (
          window as unknown as { stopRefreshAudit: () => void }
        ).stopRefreshAudit = () => {
          observer.disconnect();
          cancelAnimationFrame(frame);
        };
      });
      release();
      await expect(cover).toHaveCount(0);
      await expect(page.locator("#page-refresh-content")).not.toHaveAttribute(
        "inert",
        "",
      );
      await expect(
        page
          .locator("#main:visible, .booking-flow-overlay .page-loading:visible")
          .first(),
      ).toBeVisible();
      await expect(
        page.locator("html"),
        JSON.stringify(
          await page.locator("html").evaluate((node) => ({
            detail: node.getAttribute("data-refresh-gap-detail"),
            frame: node.getAttribute("data-refresh-frame-gap"),
            mutation: node.getAttribute("data-refresh-mutation-gap"),
          })),
        ),
      ).not.toHaveAttribute("data-refresh-gap", "true");
      await page.evaluate(() =>
        (
          window as unknown as { stopRefreshAudit: () => void }
        ).stopRefreshAudit(),
      );
    } finally {
      release();
      await page.unroute(scripts);
      page.off("pageerror", recordError);
      await page.close();
    }
  }
  expect(errors).toEqual([]);
}

test("public routes cover incomplete rendering until hydration is ready", async ({
  page,
}) => {
  await checkRefreshCover(page, [
    "/",
    "/studio/",
    "/enquiry/",
    "/terms-of-service/",
    "/privacy-policy/",
    "/refund-policy/",
    "/missing-refresh-route/",
  ]);
});
test("booking and confirmation routes cover incomplete rendering until hydration is ready", async ({
  page,
}) => {
  await checkRefreshCover(page, [
    "/book/account/",
    "/book/session/",
    "/book/time/",
    "/book/details/",
    "/book/review/",
    "/book/payment/",
    "/book/confirmation/",
    "/confirmation/",
  ]);
});

test("public routes remove staff access and fit the viewport", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openSite(page, "/");
  await expect(
    page.getByRole("heading", { name: "Your next session starts here." }),
  ).toBeAttached();
  await expect(
    page.getByText(/staff login|staff access|command centre/i),
  ).toHaveCount(0);
  const flag = page.getByRole("img", { name: "Singapore", exact: true });
  await expect(flag).toBeVisible();
  const flagBox = await flag.boundingBox();
  const studioButton = page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", {
      name: "The studio",
      exact: true,
    });
  const studioButtonBox = await studioButton.boundingBox();
  if (page.viewportSize()!.width <= 700)
    await expect(page.locator(".nav-links")).toHaveCSS(
      "justify-content",
      "center",
    );
  expect(flagBox).not.toBeNull();
  expect(studioButtonBox).not.toBeNull();
  expect(flagBox!.width).toBeCloseTo(25.2, 0);
  expect(flagBox!.height).toBeCloseTo(16.8, 0);
  expect(flagBox!.width / flagBox!.height).toBeCloseTo(1.5, 1);
  expect(flagBox!.x + flagBox!.width).toBeLessThan(studioButtonBox!.x);
  expect(flagBox!.y + flagBox!.height / 2).toBeCloseTo(
    studioButtonBox!.y + studioButtonBox!.height / 2,
    0,
  );
  const promotions = page.locator(".home-promotion");
  await expect(promotions).toHaveCount(2);
  for (const promotion of await promotions.all()) {
    const box = await promotion.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeCloseTo(0, 0);
    expect(box!.width).toBeCloseTo(page.viewportSize()!.width, 0);
    await expect(promotion.locator("img")).toHaveAttribute("alt", /.+/);
    await expect(promotion).toHaveCSS("background-color", "rgb(245, 246, 250)");
    await expect(promotion).toHaveCSS("color", "rgb(16, 22, 54)");
    await expect(promotion.locator(".promotion-cta")).toHaveCSS(
      "background-color",
      "rgb(5, 10, 47)",
    );
  }
  const contactBanner = page.locator(".abstract-promotion");
  await expect(contactBanner).toHaveCount(1);
  await expect(contactBanner).toHaveCSS("background-color", "rgb(5, 10, 47)");
  await expect(contactBanner).toHaveCSS("color", "rgb(255, 255, 255)");
  const contactGradient = await contactBanner.evaluate(
    (node) => getComputedStyle(node).backgroundImage,
  );
  await expect(contactBanner.locator(".promotion-cta")).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
  await expect(contactBanner.locator("img")).toHaveCount(0);
  await expect(contactBanner.locator(".promotion-edge")).toHaveCount(0);
  const contactBox = await contactBanner.boundingBox();
  expect(contactBox).not.toBeNull();
  expect(contactBox!.x).toBeCloseTo(0, 0);
  expect(contactBox!.width).toBeCloseTo(page.viewportSize()!.width, 0);
  const homeFooterBox = await page.locator(".site-footer").boundingBox();
  expect(homeFooterBox).not.toBeNull();
  expect(homeFooterBox!.y).toBeCloseTo(contactBox!.y + contactBox!.height, 0);
  await expect(page.locator(".footer-apps .footer-app-link")).toHaveCount(3);
  await expect(
    page.locator(".footer-contact-row").first().getByRole("link"),
  ).toHaveText(["Terms of Service", "Privacy Policy", "Refund Policy"]);
  await expect(
    page.locator(".footer-contact-grid > .footer-contact-row"),
  ).toHaveCount(4);
  await expect(page.locator("#footer-apps-title")).toHaveText(
    "Soccerbot360 Player App:",
  );
  await expect(page.locator(".footer-contact-heading")).toHaveText([
    "Services",
    "Connect With Us",
    "Find Us",
    "Soccerbot360 Player App:",
  ]);
  await expect(
    page
      .locator(".footer-direct-contact")
      .getByRole("link", { name: /^WhatsApp:/ }),
  ).toHaveAttribute("href", "https://wa.me/6590143819");
  await expect(
    page
      .locator(".footer-direct-contact")
      .getByRole("link", { name: "Enquire", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".footer-apps .footer-logo")).toHaveCount(1);
  await expect(
    page.locator(".footer-direct-contact .footer-contact-link .icon"),
  ).toHaveCount(3);
  await expect(page.locator(".footer-direct-contact a")).toHaveCount(3);
  await expect(page.locator(".footer-direct-contact a").last()).toHaveAttribute(
    "href",
    "https://www.instagram.com/soccerbotstudiosg/",
  );
  await expect(
    page.locator(".footer-direct-contact").getByRole("link", {
      name: "Instagram: @soccerbotstudiosg",
      exact: true,
    }),
  ).toHaveAttribute("href", "https://www.instagram.com/soccerbotstudiosg/");
  if (page.viewportSize()!.width > 1100) {
    const footerRows = await page
      .locator(".footer-contact-grid")
      .evaluate((grid) => {
        const services = grid.querySelectorAll(".footer-direct-links a");
        const contact = grid.querySelector(".footer-contact-link span")!;
        const serviceText = document.createRange();
        serviceText.selectNodeContents(services[0]);
        const contactText = document.createRange();
        contactText.selectNodeContents(contact);
        return {
          serviceTop: serviceText.getBoundingClientRect().top,
          contactTop: contactText.getBoundingClientRect().top,
          rowSpacing:
            services[1].getBoundingClientRect().top -
            services[0].getBoundingClientRect().top,
        };
      });
    expect(
      Math.abs(footerRows.serviceTop - footerRows.contactTop),
    ).toBeLessThanOrEqual(1);
    expect(footerRows.rowSpacing).toBeGreaterThanOrEqual(29);
    expect(footerRows.rowSpacing).toBeLessThanOrEqual(31);
    const informationRows = await page
      .locator(".footer-contact-grid")
      .evaluate((grid) => {
        const groups = [
          grid.querySelectorAll("section:first-child .footer-direct-links a"),
          grid.querySelectorAll(".footer-contact-link span"),
          grid.querySelectorAll(".footer-address span"),
        ];
        return groups.map((nodes) =>
          Array.from(nodes, (node) => {
            const range = document.createRange();
            range.selectNodeContents(node);
            return range.getBoundingClientRect().top;
          }),
        );
      });
    expect(informationRows.map((group) => group.length)).toEqual([3, 3, 4]);
    for (const group of informationRows) {
      for (const [index, top] of group.entries()) {
        expect(
          Math.abs(
            top - (informationRows[0][0] + index * footerRows.rowSpacing),
          ),
        ).toBeLessThanOrEqual(1);
      }
    }
  }
  const footerBandBox = await page
    .locator(".footer-contact-band")
    .boundingBox();
  expect(footerBandBox).not.toBeNull();
  expect(footerBandBox!.x + footerBandBox!.width / 2).toBeCloseTo(
    (await page.locator("body").boundingBox())!.width / 2,
    0,
  );
  if (page.viewportSize()!.width > 1100) {
    const appsBox = await page.locator(".footer-apps").boundingBox();
    const logoBox = await page.locator(".footer-brand").boundingBox();
    const edge = footerBandBox!.x + footerBandBox!.width;
    expect(appsBox!.x + appsBox!.width).toBeCloseTo(edge, 0);
    expect(logoBox!.x + logoBox!.width).toBeCloseTo(edge, 0);
    await expect(page.locator(".footer-contact-grid")).toHaveCSS(
      "column-gap",
      "36px",
    );
    await expect(
      page.locator(".footer-apps .footer-contact-heading"),
    ).toHaveCSS("text-align", "right");
  }
  if (page.viewportSize()!.width > 700 && page.viewportSize()!.width <= 1100) {
    const groups = await page
      .locator(".footer-contact-grid > section")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getBoundingClientRect().toJSON()),
      );
    expect(groups[0].x).toBeCloseTo(groups[2].x, 0);
    expect(groups[1].x).toBeCloseTo(groups[3].x, 0);
    expect(groups[0].y).toBeCloseTo(groups[1].y, 0);
    expect(groups[2].y).toBeCloseTo(groups[3].y, 0);
    const logo = await page.locator(".footer-brand").boundingBox();
    expect(logo!.x).toBeCloseTo(groups[3].x, 0);
    await expect(
      page.locator(".footer-apps .footer-contact-heading"),
    ).toHaveCSS("text-align", "left");
    await expect(page.locator(".footer-contact-grid")).toHaveCSS(
      "row-gap",
      "24px",
    );
    await expect(page.locator(".footer-direct-contact a").first()).toHaveCSS(
      "min-height",
      "32px",
    );
  }
  if (page.viewportSize()!.width <= 700) {
    const email = page.locator(".footer-contact-link[href^='mailto:']");
    await expect(email).toHaveCSS("white-space", "nowrap");
    const emailBox = await email.boundingBox();
    expect(emailBox!.x + emailBox!.width).toBeLessThanOrEqual(
      page.viewportSize()!.width,
    );
    const rowPitch = await page
      .locator(".footer-direct-contact a")
      .evaluateAll(
        (nodes) =>
          nodes[1].getBoundingClientRect().top -
          nodes[0].getBoundingClientRect().top,
      );
    expect(rowPitch).toBeCloseTo(36, 0);
    await expect(page.locator(".footer-apps .footer-contact-copy")).toHaveCSS(
      "justify-items",
      "center",
    );
  }

  await expect(
    contactBanner.getByRole("link", { name: "Contact us", exact: true }),
  ).toHaveAttribute("href", sitePath("/enquiry/"));
  await expect(
    page.getByRole("button", { name: /studio assistant/i }),
  ).toHaveCount(0);
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "The studio", exact: true })
    .click();
  await expect(page.locator(".page-loading .loading-logo")).toBeVisible();
  await expect(page.locator(".page-loading")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Inside the arena." }),
  ).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  const studioHero = page.locator(".studio-hero");
  await expect(studioHero.locator("video")).toBeVisible();
  await expect(studioHero.locator("video")).toHaveAttribute(
    "src",
    page.viewportSize()!.width <= 700
      ? "https://assets.soccerbot360.com/assets/videos/hero-loop.mp4"
      : "https://assets.soccerbot360.com/assets/videos/stream.mp4",
  );
  await expect(studioHero.locator("video")).not.toHaveAttribute("controls");
  await expect(studioHero.locator("video")).toHaveAttribute("autoplay", "");
  await expect(studioHero.locator("video")).not.toHaveAttribute("loop");
  await expect(studioHero.locator("video")).toHaveJSProperty("muted", true);
  await expect(studioHero.locator(".studio-playback")).toHaveCount(1);
  await expect(studioHero.locator("figcaption")).toHaveCount(0);
  const heroBox = await studioHero.boundingBox();
  const contentBox = await page.locator(".studio-showcase").boundingBox();
  expect(heroBox).not.toBeNull();
  expect(contentBox).not.toBeNull();
  expect(heroBox!.width).toBeCloseTo(page.viewportSize()!.width, 0);
  expect(contentBox!.y).toBeCloseTo(heroBox!.y + heroBox!.height, 0);
  const signatureBox = await page.locator(".studio-signature").boundingBox();
  const studioHeaderBox = await page.locator(".site-header").boundingBox();
  expect(signatureBox).not.toBeNull();
  expect(studioHeaderBox).not.toBeNull();
  expect(signatureBox!.y).toBeCloseTo(
    studioHeaderBox!.y + studioHeaderBox!.height,
    0,
  );
  expect(heroBox!.y).toBeCloseTo(signatureBox!.y + signatureBox!.height, 0);
  if (page.viewportSize()!.width <= 700) {
    expect(heroBox!.y + heroBox!.height).toBeCloseTo(
      page.viewportSize()!.height,
      0,
    );
    await expect(studioHero.locator("video")).toHaveCSS("object-fit", "cover");
  }
  await expect(page.locator(".studio-showcase > .promotion-edge")).toHaveCount(
    2,
  );
  await expect(page.locator(".studio-row")).toHaveCount(5);
  const firstPhotoBox = await page
    .locator(".studio-photo")
    .first()
    .boundingBox();
  expect(firstPhotoBox).not.toBeNull();
  expect(firstPhotoBox!.y).toBeCloseTo(contentBox!.y, 0);
  let precedingRowBottom: number | undefined;
  for (const row of await page.locator(".studio-row").all()) {
    await expect(row).toHaveCSS("background-color", "rgb(245, 246, 250)");
    await expect(row).toHaveCSS("color", "rgb(16, 22, 54)");
    const rowBox = await row.boundingBox();
    expect(rowBox).not.toBeNull();
    if (precedingRowBottom !== undefined)
      expect(rowBox!.y).toBeCloseTo(precedingRowBottom, 0);
    precedingRowBottom = rowBox!.y + rowBox!.height;
  }
  const studioBanner = page.locator(".studio-bottom.abstract-promotion");
  await expect(studioBanner).toBeAttached();
  await expect(studioBanner).toHaveCSS("background-color", "rgb(5, 10, 47)");
  await expect(studioBanner).toHaveCSS("background-image", contactGradient);
  await expect(studioBanner.locator("img")).toHaveCount(0);
  await expect(studioBanner).toHaveCSS(
    "background-image",
    /linear-gradient.*rgb\(23, 96, 120\)/,
  );
  const studioBannerBox = await studioBanner.boundingBox();
  const studioFooterBox = await page.locator(".site-footer").boundingBox();
  expect(studioBannerBox).not.toBeNull();
  expect(studioFooterBox).not.toBeNull();
  expect(studioBannerBox!.y - (contentBox!.y + contentBox!.height)).toBeCloseTo(
    0,
    0,
  );
  expect(studioFooterBox!.y).toBeCloseTo(
    studioBannerBox!.y + studioBannerBox!.height,
    0,
  );
  await expect(
    studioBanner.getByRole("link", { name: "Book now", exact: true }),
  ).toHaveAttribute("href", sitePath("/book/account/"));
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    ),
  ).toBeLessThanOrEqual(1);
  const lastStudioRow = page.locator(".studio-row").last();
  await expect(lastStudioRow).toHaveClass(/section-reveal-pending/);
  await expect(lastStudioRow).toHaveCSS("opacity", "0");
  await lastStudioRow.scrollIntoViewIfNeeded();
  await expect(lastStudioRow).toHaveClass(/section-reveal/);
  await lastStudioRow.evaluate(async (element) => {
    await Promise.all(
      element.getAnimations().map((animation) => animation.finished),
    );
  });
  await expect(lastStudioRow).toHaveCSS("opacity", "1");
  const backToTop = page.getByRole("button", {
    name: "Back to top",
    exact: true,
  });
  await expect(backToTop).toBeVisible();
  const backToTopBox = await backToTop.boundingBox();
  expect(backToTopBox!.x + backToTopBox!.width / 2).toBeCloseTo(
    page.viewportSize()!.width / 2,
    0,
  );
  await backToTop.click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(backToTop).toHaveCount(0);
  const stickyHeaderBox = await page.locator(".site-header").boundingBox();
  expect(stickyHeaderBox!.y).toBeCloseTo(0, 0);
  for (const [label, route] of [
    ["Terms of Service", "/terms-of-service/"],
    ["Privacy Policy", "/privacy-policy/"],
    ["Refund Policy", "/refund-policy/"],
  ]) {
    await page
      .locator(".site-footer")
      .getByRole("link", { name: label, exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(route + "$"));
    await expect(page.locator(".legal-placeholder")).toBeEmpty();
    await expect(page.locator(".legal-placeholder")).toHaveCSS(
      "background-color",
      "rgb(255, 255, 255)",
    );
  }
  await page.goto(sitePath("/"));
  await page
    .getByRole("link", { name: "Explore the studio", exact: true })
    .click();
  await expect(page.locator(".page-loading .loading-logo")).toBeVisible();
  await expect(page.locator(".page-loading")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Inside the arena." }),
  ).toBeVisible();
  const response = await page.goto(sitePath("/admin/"));
  expect(response?.status()).toBe(404);
  expect(errors).toEqual([]);
});
test("guest multi-date booking survives reload without retired export actions", async ({
  page,
}) => {
  await chooseSlots(page, true);
  await details(page);
  await page.getByRole("checkbox").check();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Review Booking", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("checkbox")).not.toBeChecked();
  await expect(
    page.getByRole("button", { name: /^Proceed to Payment \$[\d,.]+$/ }),
  ).toBeDisabled();
  await page.getByRole("checkbox").check();
  await payment(page);
  await expect(
    page.getByRole("heading", { name: "Booking Confirmed", exact: true }),
  ).toBeVisible();
  await page.getByText("View Full Details", { exact: true }).click();
  await expect(page.getByText("Studio 1", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    ),
  ).toBeLessThanOrEqual(1);
  await expect(
    page.getByRole("button", {
      name: /Add to calendar|Download booking details/,
    }),
  ).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Booking Confirmed", exact: true }),
  ).toBeVisible();
});
test("declined and pending payments remain controlled through retry and refresh", async ({
  page,
}) => {
  await chooseSlots(page);
  await details(page);
  await payment(page, "declined");
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "wasn’t completed",
  );
  await payAttempt(page, "pending");
  await expect(
    page.getByRole("heading", { name: "Payment pending", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Payment pending", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /check (?:payment )?status/i }),
  ).toHaveCount(0);
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    page.getByRole("heading", { name: "Processing payment", exact: true }),
  ).toBeVisible();
  await page.clock.runFor(5000);
  await expect(
    page.getByRole("heading", { name: "Booking Confirmed", exact: true }),
  ).toBeVisible();
});
test("late payment has a contact path without another payment", async ({
  page,
}) => {
  await chooseSlots(page);
  await details(page);
  await payment(page, "late");
  await expect(
    page.getByRole("heading", { name: "Payment under review" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /^Pay \$/ })).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Contact the studio", exact: true }),
  ).toHaveAttribute("href", /^tel:/);
});
test("50-minute cadence, chosen instructors, contact validation and final-slot conflict", async ({
  page,
}) => {
  await chooseSlots(page);
  await page
    .getByRole("textbox", { name: /^Email address/ })
    .fill("name@domain");
  await page.getByLabel("Mobile number", { exact: false }).fill("abc");
  await expect(page.locator("#email-error")).toHaveText(
    "Enter a valid email address.",
  );
  await page.getByLabel("Full name", { exact: false }).focus();
  await expect(page.locator("#phone-error")).toHaveText(
    "Enter an 8-digit mobile number starting with 8 or 9.",
  );
  await expect(
    page.getByRole("button", { name: /^Review Booking \$[\d,.]+$/ }),
  ).toBeDisabled();
  await page.getByLabel("Full name", { exact: false }).blur();
  await expect(page.locator("#name")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#details-form input")).toHaveCount(4);
  await expect(page.locator("#details-form select")).toHaveCount(1);
  await expect(page.locator("#details-form textarea")).toHaveCount(0);
  await expect(page.locator("#name")).toHaveAttribute(
    "placeholder",
    "John Doe",
  );
  await expect(page.locator("#email")).toHaveAttribute(
    "placeholder",
    "abc@gmail.com",
  );
  await expect(page.locator("#phone")).toHaveAttribute(
    "placeholder",
    "9123 4567",
  );
  await page
    .getByRole("button", { name: "Country code: Singapore +65" })
    .click();
  const countrySearch = page.getByRole("combobox", {
    name: "Search country or dial code",
  });
  await countrySearch.fill("United Kingdom");
  await countrySearch.press("Enter");
  await expect(page.locator("#phone")).toHaveAttribute(
    "placeholder",
    "07400 123456",
  );
  await page.locator("#phone").fill("7911123456");
  await expect(page.locator("#phone")).toHaveAttribute("aria-invalid", "false");
  await page
    .getByRole("button", { name: "Country code: United Kingdom +44" })
    .click();
  await countrySearch.fill("Singapore");
  await countrySearch.press("Enter");
  await details(page);
  await page.evaluate(() => {
    const stored = JSON.parse(
      sessionStorage.getItem("soccerbot-next-demo-v2")!,
    );
    const slot = stored.draft.slots[0];
    sessionStorage.setItem(
      "soccerbot-next-demo-inventory",
      JSON.stringify([`Studio 1|${slot.date}|${slot.start}`]),
    );
  });
  await page
    .getByRole("button", { name: /^Proceed to Payment \$[\d,.]+$/ })
    .click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "no longer available",
  );
  await page.getByRole("link", { name: "Review selections" }).click();
  await expect(page.getByRole("button", { name: /12:50–13:30/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /12:40–13:20/ })).toHaveCount(
    0,
  );
  await expect(
    page
      .getByRole("button", {
        name: /^Enter Booking Details(?: \$[\d,.]+)?$/,
        exact: true,
      })
      .first(),
  ).toBeDisabled();
  await expect(page.getByText("Preview controls", { exact: true })).toHaveCount(
    0,
  );
});
test("email verification rejects an incorrect code and continues after correction", async ({
  page,
}) => {
  await openSite(page, "/book/account/");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page
    .getByRole("textbox", { name: /^Email address/ })
    .fill("name@domain");
  await page.getByRole("button", { name: "Get Verification Code" }).click();
  await expect(page.locator("#auth-error")).toHaveText(
    "Enter a valid email address.",
  );
  await expect(
    page.getByRole("textbox", { name: /^Email address/ }),
  ).toHaveAttribute("aria-invalid", "true");
  await expect(
    page.getByLabel("Verification code", { exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("textbox", { name: /^Email address/ })
    .fill("long.customer.address@example.com");
  await page.getByRole("button", { name: "Get Verification Code" }).click();
  await expect(
    page.getByRole("heading", { name: "Verify your email", exact: true }),
  ).toBeVisible();
  // The code view mounts before the loading overlay releases page inertness.
  await expect(page.locator("main")).not.toHaveAttribute("inert");
  await page.getByLabel("Verification code", { exact: true }).fill("000000");
  await expect(
    page.getByLabel("Verification code", { exact: true }),
  ).toHaveValue("000000");
  await page.getByRole("button", { name: "Verify and continue" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "incorrect",
  );
  await page.getByLabel("Verification code", { exact: true }).fill("360360");
  await expect(
    page.getByLabel("Verification code", { exact: true }),
  ).toHaveValue("360360");
  await page.getByRole("button", { name: "Verify and continue" }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/book\/account\/$/);
  for (const label of [
    page.getByRole("heading", { name: "Welcome back" }),
    page.locator(".signed-in-email"),
  ]) {
    await expect(label).toHaveCSS("font-size", "24px");
    await expect(label).toHaveCSS("font-weight", "900");
    await expect(label).toHaveCSS("font-style", "italic");
    await expect(label).toHaveCSS("text-align", "center");
  }
  await page.getByRole("button", { name: "Continue signed in" }).click();
  await expect(
    page.getByRole("heading", { name: "Your session", exact: true }),
  ).toBeVisible();
  const verified = page.locator(".booking-verified-status");
  await expect(
    verified.getByText("Email verified", { exact: true }),
  ).toBeVisible();
  await expect(
    verified.getByText("long.customer.address@example.com", { exact: true }),
  ).toBeVisible();
  await expect(verified.getByText("Email verified", { exact: true })).toHaveCSS(
    "font-weight",
    "700",
  );
  await expect(verified).toHaveCSS("font-size", "14px");
  await expect(verified).toHaveCSS("text-align", "right");
  if ((page.viewportSize()?.width ?? 1280) <= 700) {
    const address = verified.locator("span").last();
    await expect(address).toHaveCSS("white-space", "nowrap");
    await expect
      .poll(() =>
        address.evaluate(
          (element) => element.scrollWidth <= element.clientWidth + 1,
        ),
      )
      .toBe(true);
  }

  await expect(
    page.getByRole("button", { name: "Sign out", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Choose Date & Time" }).click();
  await expect(
    page.getByRole("heading", { name: "Select dates and times", exact: true }),
  ).toBeVisible();
  await expectCalendarHeadingLayout(page);
});
test("enquiry remains available without external submission or a mock assistant", async ({
  page,
}) => {
  await openSite(page, "/enquiry/");
  const enquiryHome = page
    .locator(".enquiry-page")
    .getByRole("link", { name: "Home", exact: true });
  await expect(enquiryHome).toHaveAttribute("href", sitePath("/"));
  await expect(
    page.getByRole("heading", { name: "Contact the studio", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".nav-flag")).toHaveCSS("border-radius", "1px 3px");
  for (const control of [
    enquiryHome,
    page.getByRole("button", { name: "Send enquiry" }),
  ]) {
    await expect(control).toHaveCSS("border-top-left-radius", "3px");
    await expect(control).toHaveCSS("border-top-right-radius", "12px");
    await expect(control).toHaveCSS("border-bottom-right-radius", "3px");
    await expect(control).toHaveCSS("border-bottom-left-radius", "12px");
  }
  for (const control of [
    page.locator(".nav-studio"),
    page.locator(".nav-book"),
  ]) {
    await expect(control).toHaveCSS("font-family", /Roboto/);
    await expect(control).toHaveCSS("font-weight", "900");
    await expect(control).toHaveCSS("font-style", "italic");
  }
  await expect(
    page.locator(".enquiry-form legend .required-fields"),
  ).toHaveText("* Required fields");
  const enquiryAction = page.getByRole("button", { name: "Send enquiry" });
  await expect(enquiryAction).toBeInViewport({ ratio: 1 });
  await expect(
    page.locator(".enquiry-page .booking-primary-action"),
  ).toHaveCount(1);
  await expect(page.locator(".enquiry-page .booking-action-anchor")).toHaveCSS(
    "padding-top",
    "32px",
  );
  await expect(page.locator(".enquiry-page .booking-action-anchor")).toHaveCSS(
    "padding-bottom",
    "24px",
  );
  await expect(page.locator(".enquiry-page .field-hint")).toHaveCount(0);
  await expect(
    page.getByText("Enter your requirements using 1–2,000 characters."),
  ).toHaveCount(0);
  for (const selector of [
    "#enquiry-name",
    "#enquiry-email",
    ".phone-control",
    "#enquiry-purpose",
    "#enquiry-message",
  ]) {
    await expect(page.locator(selector)).toHaveCSS(
      "border-top-color",
      "rgb(168, 34, 53)",
    );
  }
  const phone = page.getByLabel("Mobile number");
  await phone.focus();
  await expect(page.locator(".phone-control")).toHaveCSS(
    "outline-style",
    "solid",
  );
  await expect(phone).toHaveCSS("outline-style", "none");
  await page.getByLabel("Full name").fill("Demo Customer");
  await page
    .getByRole("textbox", { name: /^Email address/ })
    .fill("demo@example.com");
  await expect(page.getByLabel("Full name")).toHaveValue("Demo Customer");
  await page.getByLabel("Mobile number").fill("+65 8123 4567");
  await page.getByLabel("Enquiry type").selectOption("Corporate booking");
  await page
    .getByLabel("Your requirements")
    .fill("A group session for our team.");
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page).toHaveURL(new RegExp(`${sitePath("/enquiry/")}$`));
  const acknowledgement = page.getByRole("status");
  await expect(acknowledgement).toHaveText("Preview · No enquiry sent.");
  await expect(acknowledgement).toBeInViewport();
  await expect(acknowledgement).toBeFocused();
  await expect(
    page.locator(".enquiry-page .booking-heading-row + [role=status]"),
  ).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: /studio assistant/i }),
  ).toHaveCount(0);
  await expect(page.getByRole("log")).toHaveCount(0);
});

test("hero entry restores the arena scene and click-to-skip without a logo overlay", async ({
  page,
}) => {
  await openSite(page, "/");
  // Keep automatic navigation from winning while this case checks click-to-skip.
  // Natural completion has its own advancing-clock case below.
  await page.clock.pauseAt(new Date("2026-10-05T08:01:00+08:00"));
  await page.getByRole("link", { name: /^Book now —/ }).click();
  const transition = page.getByRole("button", {
    name: "Skip arena transition",
  });
  await expect(transition).toBeVisible();
  await expect(transition.locator("[data-scene-part]")).toHaveCount(47);
  await expect(page.locator(".page-loading")).toHaveCount(0);
  await transition.click();
  await expect(page).toHaveURL(/\/book\/account\/$/);
  await page.clock.resume();
  await expect(transition).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Start your booking" }),
  ).toBeVisible();
});
test("home navigation offer and studio booking buttons display the branded loader", async ({
  page,
}) => {
  await openSite(page, "/");
  for (const [route, selector] of [
    ["/", ".nav-book"],
    ["/", ".home-promotion--booking .promotion-cta"],
    ["/studio/", ".studio-bottom .button"],
  ]) {
    await page.goto(sitePath(route));
    await expect(
      page.getByRole("main").getByRole("heading", { level: 1 }),
    ).toHaveCount(1);
    const link = page.locator(selector);
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute("href", sitePath("/book/account/"));
    await link.click();
    await expect(page.locator(".page-loading .loading-logo")).toBeVisible();
    await expect(page).toHaveURL(/\/book\/account\/$/);
    await expect(page.locator(".page-loading")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Start your booking" }),
    ).toBeVisible();
  }
});
test("hero completes naturally and reduced motion bypasses both transition surfaces", async ({
  page,
}) => {
  await openSite(page, "/");
  await page.getByRole("link", { name: /^Book now —/ }).click();
  await expect(
    page.getByRole("button", { name: "Skip arena transition" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/book\/account\/$/);
  await expect(
    page.getByRole("button", { name: "Skip arena transition" }),
  ).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(sitePath("/studio/"));
  const lastSection = page.locator(".studio-row").last();
  await lastSection.scrollIntoViewIfNeeded();
  await expect(lastSection).toBeVisible();
  await page.getByRole("button", { name: "Back to top", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(
    page.locator(".section-reveal, .section-reveal-pending"),
  ).toHaveCount(0);
  expect(
    await lastSection.evaluate((element) => element.getAnimations().length),
  ).toBe(0);
  await page.goto(sitePath("/"));
  await page.getByRole("link", { name: /^Book now —/ }).click();
  await expect(page).toHaveURL(/\/book\/account\/$/);
  await expect(page.locator(".pitch-entry, .page-loading")).toHaveCount(0);
});
test("oracle booking sizing and crossing sessions persist through checkout", async ({
  page,
}) => {
  async function fullWidth(selector: string, parent: string) {
    await expect(page.locator(selector)).toBeVisible();
    const width = await page.locator(selector).evaluate(async (element) => {
      await Promise.all(
        element
          .getAnimations()
          .filter(
            (animation) =>
              !(
                animation instanceof CSSAnimation &&
                animation.animationName === "booking-action-flow"
              ),
          )
          .map((animation) => animation.finished),
      );
      return element.getBoundingClientRect().width;
    });
    const container = await page.locator(parent).evaluate((element) => {
      const style = getComputedStyle(element);
      return (
        element.clientWidth -
        parseFloat(style.paddingLeft) -
        parseFloat(style.paddingRight)
      );
    });
    expect(Math.abs(width - container)).toBeLessThanOrEqual(1);
  }
  await openSite(page, "/book/account/");
  await expect(page.locator(".footer-logo")).toHaveAttribute(
    "src",
    sitePath("/assets/7a29f38b3c34.webp"),
  );
  await expect(page.locator(".nav .official-logo")).toHaveAttribute(
    "src",
    sitePath("/assets/c275ccd87afb.svg"),
  );
  await page.getByRole("button", { name: "Continue as Guest" }).click();
  await expect(
    page.getByRole("heading", { name: "Your session", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".session-products")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add one player" }),
  ).toBeVisible();
  await expect(page.getByRole("note")).toHaveCount(0);
  const next = page.getByRole("link", { name: "Choose Date & Time" });
  await expect(next).toHaveCSS("background-color", "rgb(5, 10, 47)");
  await expect(next).toHaveCSS("letter-spacing", "normal");
  const gradient = await next.evaluate((element) => ({
    image: getComputedStyle(element, "::before").backgroundImage,
    animation: getComputedStyle(element, "::before").animationName,
    reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
  }));
  expect(gradient.image).toContain("linear-gradient");
  expect(gradient.animation).toBe(
    gradient.reduced ? "none" : "booking-action-flow",
  );
  await expect(next).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(next).toBeInViewport({ ratio: 1 });
  const nextBox = await next.boundingBox();
  expect(nextBox!.y).toBeGreaterThanOrEqual(0);
  expect(nextBox!.y + nextBox!.height).toBeLessThanOrEqual(
    page.viewportSize()!.height - 8,
  );
  const cardWidths = await page
    .locator(".session-products")
    .evaluate(async (grid) => {
      await Promise.all(
        grid.children[0]
          .getAnimations()
          .filter(
            (animation) =>
              animation instanceof CSSAnimation &&
              animation.animationName === "booking-action-ready",
          )
          .map((animation) => animation.finished),
      );
      return {
        grid: grid.getBoundingClientRect().width,
        card: grid.children[0].getBoundingClientRect().width,
        gap: parseFloat(getComputedStyle(grid).columnGap),
        mobile: matchMedia("(max-width: 700px)").matches,
        medium: matchMedia("(max-width: 1200px)").matches,
      };
    });
  const expectedCardWidth = cardWidths.mobile
    ? cardWidths.grid
    : (cardWidths.grid - cardWidths.gap) / 2;
  expect(Math.abs(cardWidths.card - expectedCardWidth)).toBeLessThanOrEqual(1);
  const outletWidth = await page
    .locator(".outlet-option")
    .evaluate((element) => element.getBoundingClientRect().width);
  expect(Math.abs(outletWidth - cardWidths.card)).toBeLessThanOrEqual(1);
  const addressLines = await page
    .locator(".outlet-option > span > span")
    .allTextContents();
  expect(addressLines).toEqual(["201 Henderson Road, #05-01"]);
  for (const selector of [
    ".outlet-option > span > span",
    ".session-product-meta",
    ".session-product-prices > span > span",
    ".session-product-prices strong",
    ".player-selection .field-label",
    ".counter output",
  ]) {
    for (const text of await page.locator(selector).all()) {
      await expect(text).toHaveCSS("font-size", "16px");
      await expect(text).toHaveCSS("color", "rgb(16, 22, 54)");
    }
  }
  await expect(page.locator(".session-product-meta > span")).toHaveCSS(
    "white-space",
    "nowrap",
  );
  await expect(page.locator(".session-product-meta > span")).toHaveCSS(
    "display",
    "block",
  );
  await expect(page.locator(".session-product-meta")).toHaveCSS(
    "border-left-width",
    cardWidths.mobile ? "0px" : "1px",
  );
  await expect(page.locator(".session-product-icon")).toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)",
  );
  await expect(page.locator(".session-product-name")).not.toContainText(
    "(Trial Price)",
  );
  for (const control of await page.locator(".counter > *").all()) {
    await expect(control).toHaveCSS("width", "40px");
    await expect(control).toHaveCSS("height", "40px");
  }
  await expect(page.locator(".counter output")).toHaveCSS("font-weight", "700");
  await expect(page.locator(".counter output")).toHaveText("1");
  const priceRows = await page
    .locator(".session-product-prices > span")
    .evaluateAll((rows) =>
      rows.map((row) => ({
        label: row.querySelector("span")!.getBoundingClientRect().toJSON(),
        amount: row.querySelector("strong")!.getBoundingClientRect().toJSON(),
        box: row.getBoundingClientRect().toJSON(),
      })),
    );
  expect(priceRows).toHaveLength(2);
  expect(priceRows[0].label.x).toBeCloseTo(priceRows[1].label.x, 0);
  expect(priceRows[0].amount.right).toBeCloseTo(priceRows[1].amount.right, 0);
  for (const row of priceRows)
    expect(row.amount.right).toBeLessThanOrEqual(row.box.right + 1);

  await fullWidth(".actions .button", ".actions");
  await expect(page.locator(".session-product")).toContainText("40 minutes");
  await expect(page.locator(".session-product")).toContainText(
    "Trainer included",
  );
  await expect(page.locator(".session-product-prices")).toContainText(
    "Weekdays",
  );
  await expect(
    page.locator(".session-product .player-selection"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add one player" }).click();
  await expect(page.locator(".counter output")).toHaveText("2");
  await page.getByRole("button", { name: "Add one player" }).click();
  await page.getByRole("button", { name: "Add one player" }).click();
  await expect(page.locator(".counter output")).toHaveText("4");
  await expect(
    page.getByRole("button", { name: "Add one player" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Remove one player" }).click();
  await page.getByRole("button", { name: "Remove one player" }).click();
  await expect(page.locator(".counter output")).toHaveText("2");
  const sessionChoice = page.getByRole("button", {
    name: "Choose Kickoff Special",
    exact: true,
  });
  await expect(sessionChoice.locator(":scope > svg")).toHaveCount(0);
  await sessionChoice.click();
  await expect(sessionChoice).toHaveAttribute("aria-pressed", "false");
  await expect(sessionChoice.locator(":scope > svg")).toHaveCount(0);
  await expect(page.locator(".player-selection")).toHaveCount(0);
  await expect(next).toHaveCount(0);
  await sessionChoice.click();
  await expect(page.locator(".counter output")).toHaveText("2");
  const outletChoice = page.getByRole("button", {
    name: "Select Apex @ Henderson outlet",
    exact: true,
  });
  await expect(outletChoice.locator(":scope > svg")).toHaveCount(1);
  await outletChoice.click();
  await expect(outletChoice.locator(":scope > svg")).toHaveCount(1);
  await expect(page.locator(".session-products")).toHaveCount(0);
  await outletChoice.click();
  await expect(sessionChoice).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".player-selection")).toHaveCount(0);
  await sessionChoice.click();
  await expect(page.locator(".counter output")).toHaveText("2");
  const productFontSize = await page
    .locator(".session-product-name")
    .evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
  expect(productFontSize).toBeCloseTo(20, 5);
  for (const name of ["Outlet", "Session"]) {
    await expect(page.getByRole("heading", { name, exact: true })).toHaveCSS(
      "font-style",
      "normal",
    );
  }
  await page.getByRole("link", { name: "Choose Date & Time" }).click();
  await page
    .getByRole("button", {
      name: dateLabel(addDays(DEMO_TODAY, 1)),
      exact: true,
    })
    .click();
  await expect(page.getByRole("button", { name: /12:00–12:40/ })).toContainText(
    "Faisal Shahril",
  );
  await expect(page.getByRole("button", { name: /15:20–16:00/ })).toContainText(
    "Daniel Tan",
  );
  await expect(page.getByRole("button", { name: /18:40–19:20/ })).toContainText(
    "Instructor 3",
  );
  await expect(page.getByRole("button", { name: /18:10–18:50/ })).toHaveCount(
    0,
  );
  await expect(page.getByRole("button", { name: /19:30–20:10/ })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("group", { name: "Session times" }).getByRole("button"),
  ).toHaveCount(9);
  const timeCards = await page
    .locator(".times > .time-choice")
    .evaluateAll((cards) =>
      cards.map((card) => ({
        start: card.querySelector(".time-range")!.textContent!.slice(0, 5),
        x: card.getBoundingClientRect().x,
        y: card.getBoundingClientRect().y,
      })),
    );
  expect(timeCards.map((card) => card.start)).toEqual(
    timeCards.map((card) => card.start).sort(),
  );
  const rows =
    page.viewportSize()!.width > 700
      ? Math.ceil(timeCards.length / 2)
      : timeCards.length;
  for (let index = 1; index < timeCards.length; index += 1) {
    const previous = timeCards[index - 1];
    const current = timeCards[index];
    if (index === rows) {
      expect(current.x).toBeGreaterThan(previous.x);
      expect(current.y).toBeCloseTo(timeCards[0].y, 0);
    } else {
      expect(current.x).toBeCloseTo(previous.x, 0);
      expect(current.y).toBeGreaterThan(previous.y);
    }
  }
  const crossing = page.getByRole("button", { name: /14:30–15:10/ });
  await expect(crossing).not.toContainText("instructor rotation");
  await crossing.click();
  await page
    .getByRole("combobox", { name: /Trainer for .* at 14:30/ })
    .selectOption({ index: 1 });
  await expect(page.getByRole("radio")).toHaveCount(0);
  await page.getByRole("button", { name: /15:20–16:00/ }).click();
  await page
    .getByRole("combobox", { name: /Trainer for .* at 15:20/ })
    .selectOption({ index: 1 });
  await openBookingPanel(page, "trainers");
  const instructors = page.getByRole("region", { name: "Your instructors" });
  await expect(instructors.getByRole("article")).toHaveCount(2);
  await expect(
    instructors.getByRole("article", { name: "Faisal Shahril", exact: true }),
  ).toBeVisible();
  await expect(
    instructors.getByRole("article", { name: "Daniel Tan", exact: true }),
  ).toBeVisible();
  await closeBookingPanel(page);
  await expect(
    page
      .getByRole("link", {
        name: /^Enter Booking Details(?: \$[\d,.]+)?$/,
        exact: true,
      })
      .first(),
  ).toBeVisible();
  if (page.viewportSize()!.width > 700) {
    await expect(page.locator(".booking-layout > .aside-wrap")).toHaveCSS(
      "position",
      "sticky",
    );
    await expect(page.locator(".booking-layout > .aside-wrap")).toHaveCSS(
      "overflow-y",
      "visible",
    );
    await expect(page.locator(".basket-list")).toHaveCSS("max-height", "none");
    const positions = await page.locator(".aside-wrap").evaluate((element) => ({
      cartBottom: element.querySelector(".summary")!.getBoundingClientRect()
        .bottom,
      instructorsTop: element
        .querySelector(".booking-instructors")!
        .getBoundingClientRect().top,
    }));
    expect(positions.instructorsTop).toBeGreaterThanOrEqual(
      positions.cartBottom,
    );
  }
  await openBookingPanel(page, "cart");
  await expect(page.locator(".summary .rotation-notice")).toHaveCount(0);
  await closeBookingPanel(page);
  await page
    .getByRole("link", {
      name: /^Enter Booking Details(?: \$[\d,.]+)?$/,
      exact: true,
    })
    .first()
    .click();
  await expect(page).toHaveURL(/\/book\/details\/$/);
  await expect(
    page.getByRole("heading", { name: "Your details", exact: true }),
  ).toBeVisible();
  await fullWidth(".actions .button", ".actions");
  await expect(page.locator("#name")).toHaveCSS("min-height", "52px");
  await details(page);
  await fullWidth(".actions .button", ".actions");
  await expect(page.locator(".series-list .rotation-notice")).toHaveCount(0);
  await payment(page);
  await expect(
    page.getByRole("heading", { name: "Booking Confirmed", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".confirmation-full-details")).not.toHaveAttribute(
    "open",
    "",
  );
  await expect(
    page.getByRole("heading", { name: "Order Summary", exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/^Total Paid(?: · Preview)?$/)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Before Your Session", exact: true }),
  ).toBeHidden();
  const confirmationLayout = await page
    .locator(".confirmation-shell")
    .evaluate((shell) => ({
      actionsBottom: shell
        .querySelector(".confirmation-actions")!
        .getBoundingClientRect().bottom,
      summaryTop: shell
        .querySelector(".confirmation-card")!
        .getBoundingClientRect().top,
      actions: shell.querySelectorAll(".confirmation-actions .button").length,
    }));
  expect(confirmationLayout.actions).toBe(3);
  expect(confirmationLayout.actionsBottom).toBeLessThanOrEqual(
    confirmationLayout.summaryTop,
  );
  await page.getByText("View Full Details", { exact: true }).click();
  await expect(page.locator(".confirmation-card .rotation-notice")).toHaveCount(
    0,
  );
  await expect(page.locator("main details[open]")).toHaveCount(1);
  await expect(page.locator(".confirmation-section > h2")).toHaveText([
    "Booking Contact",
    "Location",
    "Before Your Session",
  ]);
  await expect(
    page
      .locator(".confirmation-card")
      .getByText("Demo Customer", { exact: true }),
  ).toHaveCount(1);
  await expect(
    page.locator(".confirmation-card").getByText("Studio 1", { exact: true }),
  ).toHaveCount(1);
  await expect(
    page.locator(".confirmation-card .session-instructor"),
  ).toHaveText(["Trainer: Faisal Shahril", "Trainer: Daniel Tan"]);
  await expect(page.getByText("Preview controls", { exact: true })).toHaveCount(
    0,
  );
  const columns = await page
    .locator(".confirmation-actions")
    .evaluate(
      (element) =>
        getComputedStyle(element).gridTemplateColumns.split(" ").length,
    );
  expect(columns).toBe(2);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    ),
  ).toBeLessThanOrEqual(1);
});

test("leave booking uses equal-width sentence-case actions with home left and stay right", async ({
  page,
}) => {
  await chooseSlots(page);
  await page
    .getByRole("link", { name: "SOCCERBOTSTUDIO Singapore home" })
    .click();
  const dialog = page.getByRole("dialog", { name: "Leave this booking?" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(
    "Your selections and changes will not be saved.",
  );
  await expect(dialog.locator(".dialog-actions button")).toHaveText([
    "Leave booking",
    "Stay",
  ]);
  const actions = await dialog
    .locator(".dialog-actions button")
    .evaluateAll((buttons) =>
      buttons.map((button) => ({
        width: button.getBoundingClientRect().width,
        x: button.getBoundingClientRect().x,
        casing: getComputedStyle(button).textTransform,
      })),
    );
  expect(Math.abs(actions[0].width - actions[1].width)).toBeLessThanOrEqual(1);
  expect(actions[0].x).toBeLessThan(actions[1].x);
  expect(actions.map((action) => action.casing)).toEqual(["none", "none"]);
  await dialog.getByRole("button", { name: "Stay", exact: true }).click();
  await expect(page).toHaveURL(/\/book\/details\/$/);
  const beforeFooter = await page.evaluate(
    () => JSON.parse(sessionStorage.getItem("soccerbot-next-demo-v2")!).draft,
  );
  const footerLinks = page.locator(".site-footer a[href]");
  const footerCount = await footerLinks.count();
  expect(footerCount).toBeGreaterThan(0);
  for (let index = 0; index < footerCount; index++) {
    await footerLinks.nth(index).click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Stay", exact: true }).click();
    await expect(page).toHaveURL(/\/book\/details\/$/);
    expect(page.context().pages()).toHaveLength(1);
  }
  expect(
    await page.evaluate(
      () => JSON.parse(sessionStorage.getItem("soccerbot-next-demo-v2")!).draft,
    ),
  ).toEqual(beforeFooter);
  await page
    .getByRole("link", { name: "SOCCERBOTSTUDIO Singapore home" })
    .click();
  await dialog
    .getByRole("button", { name: "Leave booking", exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(sitePath("/") + "$"));
  const saved = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("soccerbot-next-demo-v2")!),
  );
  expect(saved.draft.mode).toBeNull();
  expect(saved.draft.slots).toEqual([]);
  expect(saved.draft.contact.name).toBe("");
  expect(saved.attempt).toBeNull();
  await page.goto(sitePath("/book/account/"));
  await page.getByRole("link", { name: "Home", exact: true }).click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Stay", exact: true }).click();
  await expect(page).toHaveURL(/\/book\/account\/$/);
  await page
    .locator(".site-footer")
    .getByRole("link", { name: "Privacy Policy", exact: true })
    .click();
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole("button", { name: "Leave booking", exact: true })
    .click();
  await expect(page).toHaveURL(/\/privacy-policy\/$/);
  await page.goto(sitePath("/book/account/"));
  // Capture the new-tab handoff without contacting the external service.
  await page.evaluate(() => {
    window.open = (url, target, features) => {
      sessionStorage.setItem(
        "leave-link-handoff",
        JSON.stringify({ url, target, features }),
      );
      return null;
    };
  });
  await page
    .locator(".site-footer")
    .getByRole("link", { name: /WhatsApp:/ })
    .click();
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole("button", { name: "Leave booking", exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(sitePath("/") + "$"));
  expect(
    await page.evaluate(() =>
      JSON.parse(sessionStorage.getItem("leave-link-handoff")!),
    ),
  ).toEqual({
    url: "https://wa.me/6590143819",
    target: "_blank",
    features: "noopener,noreferrer",
  });
});
test("first visit offers the Player App with only store links and dismissal persists", async ({
  page,
}) => {
  const retiredPreview = await page.request.get(sitePath("/experiment/"));
  expect(retiredPreview.status()).toBe(404);
  await page.goto(sitePath("/"));
  const prompt = page.getByRole("dialog", {
    name: "Get the Soccerbot360 Player App",
  });
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    "SOCCERBOTSTUDIO Singapore | Interactive Football Experience",
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    new URL(
      sitePath("/assets/soccerbot-social-preview.jpg"),
      "https://soccerbotsg.com",
    ).href,
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
    "content",
    "Discover immersive football games and interactive training at SOCCERBOTSTUDIO Singapore. Performance · Experience · Production.",
  );
  await expect(
    page.locator('link[rel="icon"][type="image/svg+xml"]'),
  ).toHaveAttribute("href", sitePath("/favicon.svg"));
  const phonePrompt = (page.viewportSize()?.width ?? 1280) <= 700;
  await expect(prompt).toBeVisible();
  await expect(prompt.locator("p")).toHaveCount(0);
  await expect(prompt.getByRole("link")).toHaveCount(3);
  const storeDestinations = [
    [
      "App Store",
      "https://apps.apple.com/us/app/soccerbot-player-app/id6751052041",
    ],
    [
      "Google Play",
      "https://play.google.com/store/apps/details?id=com.umbrella.soccerbot.playerapp&hl=en&pli=1",
    ],
    ["Web App", "https://app.soccerbot360.com/login"],
  ];
  for (const link of await prompt.getByRole("link").all()) {
    await expect(link).toHaveCSS("justify-content", "center");
    await expect(link).toHaveCSS("align-items", "center");
    await expect(link).toHaveCSS("color", "rgb(255, 255, 255)");
    await expect(link.locator("svg")).toHaveCSS("color", "rgb(255, 255, 255)");
  }
  for (const [name, href] of storeDestinations) {
    await expect(
      prompt.getByRole("link", { name, exact: true }),
    ).toHaveAttribute("href", href);
  }
  await expect(
    prompt.getByRole("button", { name: "Not now", exact: true }),
  ).toHaveCount(0);
  const close = prompt.getByRole("button", {
    name: "Close dialog",
    exact: true,
  });
  await expect(prompt).toHaveCSS("background-color", "rgb(5, 10, 47)");
  await expect(prompt.locator(".dialog-title")).toHaveCSS(
    "font-family",
    /Roboto/,
  );
  await expect(prompt.locator(".dialog-title")).toHaveCSS(
    "font-size",
    phonePrompt ? "12px" : "24px",
  );
  await expect(prompt.locator(".dialog-title")).toHaveCSS("font-weight", "400");
  await expect(prompt.locator(".dialog-title")).toHaveCSS(
    "color",
    "rgb(255, 255, 255)",
  );
  for (const label of await prompt.locator(".app-store-link span").all()) {
    await expect(label).toHaveCSS("font-size", phonePrompt ? "12px" : "16px");
    await expect(label).toHaveCSS("font-weight", "400");
  }
  if (phonePrompt) {
    const geometry = await prompt.evaluate((dialog) => {
      const links = [...dialog.querySelectorAll(".app-store-link")].map(
        (link) => link.getBoundingClientRect().toJSON(),
      );
      const title = dialog.querySelector(".dialog-title")!;
      return {
        links,
        height: dialog.getBoundingClientRect().height,
        overflow: dialog.scrollWidth > dialog.clientWidth,
        titleOverflow: title.scrollWidth > title.clientWidth,
      };
    });
    expect(geometry.height).toBeLessThanOrEqual(160);
    expect(geometry.overflow).toBe(false);
    expect(geometry.titleOverflow).toBe(false);
    expect(geometry.links[0].top).toBeCloseTo(geometry.links[1].top, 1);
    expect(geometry.links[1].top).toBeCloseTo(geometry.links[2].top, 1);
    expect(geometry.links[0].right).toBeLessThan(geometry.links[1].left);
    expect(geometry.links[1].right).toBeLessThan(geometry.links[2].left);
  }
  await prompt.getByRole("heading").click();
  await expect(prompt).toBeVisible();
  for (const link of await prompt.getByRole("link").all()) {
    // Exercise the click handler without opening external app-store pages.
    await link.evaluate((element) => {
      element.addEventListener("click", (event) => event.preventDefault(), {
        once: true,
      });
    });
    await link.click();
    await expect(prompt).toBeVisible();
  }
  const placement = await close.evaluate((button) => {
    const dialog = button.closest("dialog")!.getBoundingClientRect();
    const rect = button.getBoundingClientRect();
    return { top: rect.top - dialog.top, right: dialog.right - rect.right };
  });
  expect(placement.top).toBeCloseTo(13, 0);
  expect(placement.right).toBeCloseTo(13, 0);
  // Reach Close with keyboard navigation after pointer interactions so the
  // focus-visible assertion exercises the browser's keyboard modality.
  await prompt
    .getByRole("link", { name: "App Store", exact: true })
    .press("Shift+Tab");
  await expect(close).toBeFocused();
  await expect(close).toHaveCSS("outline-style", "none");
  await expect(close).toHaveCSS("border-top-width", "0px");
  await expect(close).toHaveCSS("border-radius", "0px");
  await expect(close).toHaveCSS("color", "rgb(70, 172, 220)");
  await expect(close).toHaveCSS("box-shadow", "none");
  await expect(close).toHaveCSS("text-decoration-line", "none");
  await close.click();
  for (const [name, href] of storeDestinations) {
    await expect(
      page.locator(".footer-apps").getByRole("link", { name, exact: true }),
    ).toHaveAttribute("href", href);
  }
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Your next session starts here." }),
  ).toBeVisible();
  await expect(prompt).toHaveCount(0);
  await expect(page.locator(".nav-download")).toHaveCount(0);
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "The studio", exact: true })
    .click();
  await expect(page.locator(".page-loading .loading-logo")).toBeVisible();
  await expect(page.locator(".page-loading")).toHaveCount(0);
  await expect(prompt).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    ),
  ).toBeLessThanOrEqual(1);
});

test("header blue and the typography hierarchy stay consistent across every booking step", async ({
  page,
}) => {
  const brand = "rgb(5, 10, 47)";
  const pageSize = page.viewportSize()!.width <= 700 ? 32 : 40;
  async function pageHeading(name: string, color = "rgb(70, 172, 220)") {
    const heading = page
      .getByRole("main")
      .getByRole("heading", { level: 1, name, exact: true });
    await expect(heading).toBeVisible();
    await expect(
      page.getByRole("main").getByRole("heading", { level: 1 }),
    ).toHaveCount(1);
    expect(
      await heading.evaluate((node) =>
        parseFloat(getComputedStyle(node).fontSize),
      ),
    ).toBeCloseTo(pageSize, 5);
    await expect(heading).toHaveCSS("color", color);
    await expect(heading).toHaveCSS("font-weight", "900");
    const instructions: Record<string, string> = {
      "Start your booking":
        "Continue as a guest or sign in to start your booking.",
      "Your session": "Confirm your outlet, session and number of players.",
      "Select dates and times": "40-minute sessions · 10-minute changeover.",
      "Your details": "Enter the contact details for this booking.",
      "Review Booking":
        "Review your booking details before proceeding to payment.",
    };
    if (instructions[name]) {
      const instruction = page.locator(".lead");
      await expect(instruction).toHaveText(instructions[name]);
      await expect(instruction).toHaveCSS("font-size", "16px");
      await expect(instruction).toHaveCSS("color", "rgb(88, 97, 116)");
      await expect(instruction).toHaveCSS("font-family", /Roboto/);
    }

    if (name === "Select dates and times") {
      await expect(page.locator(".calendar-selection-context")).toHaveCSS(
        "font-size",
        "16px",
      );
      await expect(page.locator(".lead")).toHaveCSS("font-size", "16px");
      await expect(
        page.locator(".calendar-selection-context strong"),
      ).toHaveCSS("font-weight", "700");
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
    ).toBeLessThanOrEqual(1);
  }
  async function sectionType(
    selector: string,
    expectedSize = 20,
    expectedColor = brand,
  ) {
    if (
      page.viewportSize()!.width <= 700 &&
      (await page.locator(".booking-navigation").count())
    ) {
      await expect(page.locator(".booking-navigation")).toHaveCSS(
        "position",
        "sticky",
      );
      await expect(page.locator(".booking-current-step")).toBeVisible();
      const navigationBox = await page
        .locator(".booking-navigation")
        .boundingBox();
      expect(navigationBox!.height).toBeLessThanOrEqual(60);
      const stepBox = await page.locator(".booking-current-step").boundingBox();
      expect(stepBox!.x + stepBox!.width / 2).toBeCloseTo(
        navigationBox!.x + navigationBox!.width / 2,
        0,
      );
      const backBox = await page.locator(".booking-top .back").boundingBox();
      expect(backBox!.y - navigationBox!.y).toBeGreaterThanOrEqual(6);
      expect(
        navigationBox!.y + navigationBox!.height - backBox!.y - backBox!.height,
      ).toBeGreaterThanOrEqual(6);
      const primaryBar = page.locator(".booking-primary-action");
      if (await primaryBar.count()) {
        const action = primaryBar.locator(":scope > .button");
        await expect(action).toHaveCount(1);
        await action.evaluate(async (element) => {
          await Promise.all(
            element
              .getAnimations()
              .filter(
                (animation) =>
                  !(
                    animation instanceof CSSAnimation &&
                    animation.animationName === "booking-action-flow"
                  ),
              )
              .map((animation) => animation.finished),
          );
        });
        const anchorBox = await page
          .locator(".booking-action-anchor")
          .boundingBox();
        const floating =
          anchorBox!.y + anchorBox!.height > page.viewportSize()!.height ||
          anchorBox!.y <
            (await page.locator(".site-header").boundingBox())!.height;
        await expect(primaryBar).toHaveAttribute(
          "data-floating",
          String(floating),
        );
        await expect(primaryBar).toHaveCSS(
          "position",
          floating ? "fixed" : "relative",
        );
        const barBox = await primaryBar.boundingBox();
        if (floating) {
          expect(barBox!.y + barBox!.height).toBeCloseTo(
            page.viewportSize()!.height - 24,
            0,
          );
        }
        expect(barBox!.height).toBeLessThanOrEqual(72);
        if (floating) {
          expect(barBox!.x).toBeCloseTo(20, 0);
          expect(barBox!.width).toBeCloseTo(page.viewportSize()!.width - 40, 0);
        }
        const actionBox = await action.boundingBox();
        await expect(primaryBar).toHaveCSS(
          "background-color",
          "rgba(0, 0, 0, 0)",
        );
        await expect(primaryBar).toHaveCSS("box-shadow", "none");
        await expect(primaryBar).toHaveCSS("border-top-width", "0px");
        expect(actionBox!.x).toBeCloseTo(barBox!.x, 0);
        expect(actionBox!.x + actionBox!.width).toBeCloseTo(
          barBox!.x + barBox!.width,
          0,
        );
        expect(actionBox!.height).toBeGreaterThanOrEqual(48);
        const previousScroll = await page.evaluate(() => scrollY);
        await page.locator(".site-footer").scrollIntoViewIfNeeded();
        await expect(action).toBeInViewport({ ratio: 1 });
        const settledAnchor = await page
          .locator(".booking-action-anchor")
          .boundingBox();
        const headerBottom = await page
          .locator(".site-header")
          .evaluate((node) => node.getBoundingClientRect().bottom);
        if (settledAnchor!.y >= headerBottom) {
          await expect(primaryBar).toHaveAttribute("data-floating", "false");
          await expect(primaryBar).toHaveCSS("position", "relative");
          const settledBar = await primaryBar.boundingBox();
          expect(settledBar!.width).toBeCloseTo(settledAnchor!.width, 0);
          expect(settledBar!.y - settledAnchor!.y).toBeCloseTo(32, 0);
          const footer = await page.locator(".site-footer").boundingBox();
          expect(settledBar!.y + settledBar!.height).toBeLessThanOrEqual(
            footer!.y,
          );
        } else {
          await expect(primaryBar).toHaveAttribute("data-floating", "true");
          await expect(primaryBar).toHaveCSS("position", "fixed");
        }
        await page.evaluate((y) => scrollTo(0, y), previousScroll);
      }
    }
    if (
      page.viewportSize()!.width > 700 &&
      (await page.locator(".booking-primary-action").count())
    ) {
      const primaryBar = page.locator(".booking-primary-action");
      const action = primaryBar.locator(":scope > .button");
      await expect(primaryBar).toHaveCount(1);
      await expect(action).toBeInViewport({ ratio: 1 });
      const previousScroll = await page.evaluate(() => scrollY);
      await page.locator(".site-footer").scrollIntoViewIfNeeded();
      await expect(action).toBeInViewport({ ratio: 1 });
      const anchor = await page.locator(".booking-action-anchor").boundingBox();
      const bar = await primaryBar.boundingBox();
      expect(bar!.x).toBeCloseTo(anchor!.x, 0);
      expect(bar!.width).toBeCloseTo(anchor!.width, 0);
      await page.evaluate((y) => scrollTo(0, y), previousScroll);
    }
    await expect(
      page.getByRole("button", { name: "Back to top", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.locator(".section-reveal, .section-reveal-pending"),
    ).toHaveCount(0);
    const actionAnchor = page.locator(".booking-action-anchor");
    if (await actionAnchor.count()) {
      await expect(actionAnchor).toHaveCSS("padding-top", "32px");
      await expect(actionAnchor).toHaveCSS("padding-bottom", "24px");
      const actionButton = actionAnchor.locator(
        ".booking-primary-action > .button",
      );
      expect(
        await actionButton.evaluate((node) =>
          parseFloat(getComputedStyle(node).height),
        ),
      ).toBeCloseTo(page.viewportSize()!.width <= 700 ? 48 : 60.4, 0);
      if (await page.locator(".session-times-region").count())
        await expect(actionAnchor.locator("..")).not.toHaveClass("actions");
    }
    const headings = page.locator(selector);
    expect(await headings.count()).toBeGreaterThan(0);
    const styles = await headings.evaluateAll((nodes) =>
      nodes.map((node) => {
        const style = getComputedStyle(node);
        return {
          size: parseFloat(style.fontSize),
          weight: style.fontWeight,
          style: style.fontStyle,
          color: style.color,
        };
      }),
    );
    for (const style of styles) {
      expect(style.size).toBeCloseTo(expectedSize, 5);
      expect(style.weight).toBe("700");
      expect(style.style).toBe("normal");
      expect(style.color).toBe(expectedColor);
    }
  }
  await openSite(page, "/book/account/");
  await pageHeading("Start your booking");
  await expect(page.locator(".site-header")).toHaveCSS(
    "background-color",
    brand,
  );
  await expect(page.locator("body")).toHaveCSS("font-family", /Roboto/);
  await expect(page.locator("body")).toHaveCSS("font-size", "16px");
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page.evaluate(
      () =>
        document.fonts.check("700 16px Roboto") &&
        document.fonts.check("italic 900 32px Roboto"),
    ),
  ).toBe(true);
  await expect(page.locator(".access-option")).toHaveCount(1);
  await expect(page.locator(".access-option h2")).toHaveCount(0);
  await expect(page.locator(".access-choice-divider")).toHaveText("or");
  const choices = page.locator(".access-choices");
  await expect(choices).toHaveCSS("display", "grid");
  const guest = page.getByRole("button", { name: "Continue as Guest" });
  const signIn = page.getByRole("button", { name: "Sign in", exact: true });
  await page.mouse.move(0, 0);
  for (const button of [guest, signIn]) {
    await expect(button).toBeInViewport({ ratio: 1 });
    await expect(button).toHaveCSS("background-color", brand);
    await expect(button).toHaveCSS("color", "rgb(255, 255, 255)");
    await expect(button).toHaveCSS("font-size", "16px");
    await expect(button).toHaveCSS("font-weight", "900");
    await expect(button).toHaveCSS("font-style", "italic");
    await expect(button).toHaveCSS("letter-spacing", "normal");
    await expect(button).toHaveCSS("border-radius", "3px 12px");
    await expect(button.locator("img")).toHaveCount(0);
    await expect(button.locator("svg")).toHaveCount(2);
    await expect(button).toHaveCSS("align-items", "center");
    await expect(button).toHaveCSS("justify-content", "center");
  }
  const guestBox = await guest.boundingBox();
  const signInBox = await signIn.boundingBox();
  expect(guestBox!.y).toBeCloseTo(signInBox!.y, 0);
  expect(guestBox!.width).toBeCloseTo(signInBox!.width, 0);
  const actionHeight = page.viewportSize()!.width <= 700 ? 48 : 60.4;
  for (const button of [guest, signIn]) {
    expect(
      await button.evaluate((node) =>
        parseFloat(getComputedStyle(node).height),
      ),
    ).toBeCloseTo(actionHeight, 0);
  }
  expect(guestBox!.x + guestBox!.width).toBeLessThan(signInBox!.x);
  const divider = page.locator(".access-choice-divider");
  await expect(divider).toHaveCSS("font-family", /Roboto/);
  await expect(divider).toHaveCSS("font-size", "20px");
  await expect(divider).toHaveCSS("text-transform", "uppercase");
  await expect(divider).toHaveCSS("text-decoration-line", "none");
  const dividerLines = await divider.evaluate((node) =>
    ["::before", "::after"].map((pseudo) => {
      const style = getComputedStyle(node, pseudo);
      return {
        width: style.width,
        height: style.height,
        content: style.content,
      };
    }),
  );
  for (const line of dividerLines) {
    expect(line.width).toBe("1px");
    expect(line.content).toBe('""');
    expect(parseFloat(line.height)).toBeGreaterThan(0);
  }
  // Flex layout can allocate its remaining 1/64px to only one divider line.
  expect(parseFloat(dividerLines[0].height)).toBeCloseTo(
    parseFloat(dividerLines[1].height),
    1,
  );
  await expect(divider).toHaveCSS("font-weight", "900");
  await expect(divider).toHaveCSS("font-style", "italic");
  if (await page.evaluate(() => matchMedia("(hover: hover)").matches)) {
    await guest.hover();
    await expect(guest).toHaveCSS("color", "rgb(255, 255, 255)");
  }
  await guest.click();
  await pageHeading("Your session");
  await sectionType(".session-product-name", 20, "rgb(16, 22, 54)");
  const selectedColour = /color\(srgb 0\.9272\d* 0\.9501\d* 0\.9576\d*\)/;
  for (const card of [
    page.locator(".outlet-option"),
    page.locator(".session-product"),
  ]) {
    await expect(card).toHaveCSS("background-color", selectedColour);
    await expect(card).toHaveCSS("background-image", "none");
    await expect(card).toHaveCSS("border-color", "rgb(23, 96, 120)");
    await expect(card).toHaveCSS("color", "rgb(16, 22, 54)");
    await expect(card).toHaveCSS("border-radius", "3px 12px");
    await expect(card.locator(".selection-indicator")).toHaveCount(0);
  }
  const selectedCardBackground = await page
    .locator(".session-product")
    .evaluate((element) => getComputedStyle(element).backgroundColor);
  await expect(
    page.getByRole("dialog", { name: "Kickoff Special" }),
  ).toHaveCount(0);
  await expect(page.locator(".player-selection")).toBeVisible();
  await page.getByRole("link", { name: "Choose Date & Time" }).click();
  await pageHeading("Select dates and times");
  await expect(
    page.getByRole("combobox", { name: "Calendar view" }),
  ).toHaveValue("month");
  /** Verify the shared day hover treatment in either calendar layout. */
  async function dayHoverColour() {
    if (!(await page.evaluate(() => matchMedia("(hover: hover)").matches)))
      return;
    const day = page.locator(".date:not(:disabled):not(.selected)").first();
    await day.hover();
    await expect(day).toHaveCSS("background-color", selectedColour);
    await expect(day).toHaveCSS("border-color", "rgb(23, 96, 120)");
    await page.mouse.move(0, 0);
  }
  await dayHoverColour();
  await expect(page.locator(".date:disabled").first()).toHaveCSS(
    "border-top-color",
    "rgba(0, 0, 0, 0)",
  );
  await page
    .getByRole("combobox", { name: "Calendar view" })
    .selectOption("week");
  await expect(page.locator(".dates .date")).toHaveCount(7);
  await dayHoverColour();
  const monthPicker = page.getByRole("combobox", { name: "Calendar month" });
  await expect(monthPicker.locator("option:checked")).toHaveText(
    dateLabel(DEMO_TODAY, { month: "long", year: "numeric" }),
  );
  const monthBox = await monthPicker.boundingBox();
  const navBox = await page.locator(".calendar-nav").boundingBox();
  expect(monthBox!.y + monthBox!.height / 2).toBeCloseTo(
    navBox!.y + navBox!.height / 2,
    0,
  );
  expect(monthBox!.x + monthBox!.width).toBeLessThan(navBox!.x);
  if (await page.evaluate(() => matchMedia("(hover: hover)").matches)) {
    for (const control of [
      monthPicker,
      page.getByRole("button", { name: "Next week", exact: true }),
    ]) {
      await control.hover();
      await expect(control).toHaveCSS("background-color", "rgb(238, 240, 247)");
      await expect(control).toHaveCSS("border-top-color", "rgb(86, 102, 168)");
    }
  }
  await expect(page.locator(".calendar-weekdays span").first()).toHaveCSS(
    "font-size",
    "12px",
  );
  await page
    .getByRole("button", {
      name: dateLabel(addDays(DEMO_TODAY, 1)),
      exact: true,
    })
    .click();
  const crossing = page.getByRole("button", { name: /14:30–15:10/ });
  await expect(
    page.locator(".date:not(:disabled):not(.selected)").first(),
  ).toHaveCSS("border-top-color", "rgb(122, 130, 153)");

  await expect(page.locator(".calendar-legend")).toHaveCount(0);
  await expect(page.locator(".date .dot")).toHaveCount(0);
  await expect(page.locator(".date.selected")).not.toHaveClass(/in-booking/);
  await expect(page.locator(".date.selected")).toHaveCSS(
    "border-color",
    "rgb(23, 96, 120)",
  );
  await expect(page.locator(".date.selected")).toHaveCSS(
    "background-color",
    selectedColour,
  );
  await expect(page.locator(".date.selected")).toHaveCSS(
    "color",
    "rgb(16, 22, 54)",
  );
  await expect(page.locator(".date.selected strong")).toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)",
  );
  await expect(page.getByText(/Open noon–8pm/)).toHaveCount(0);
  await expect(crossing.locator(".time-range")).toHaveCSS(
    "white-space",
    "nowrap",
  );
  await expect(crossing.locator(".time-range")).toHaveCSS("font-size", "16px");
  await expect(crossing.locator(".time-rate strong")).toHaveCSS(
    "font-size",
    "16px",
  );
  const slotPlacement = await crossing.evaluate((node) => {
    const range = node.querySelector(".time-range")!.getBoundingClientRect();
    const price = node.querySelector(".time-rate")!.getBoundingClientRect();
    return {
      rangeBottom: range.bottom,
      priceTop: price.top,
    };
  });
  expect(slotPlacement.priceTop).toBeGreaterThan(slotPlacement.rangeBottom);
  await expect(crossing.locator(":scope > svg")).toHaveCount(0);
  if (page.viewportSize()!.width <= 700) {
    await expect(
      page.getByText("Select to view trainers available", { exact: true }),
    ).toBeVisible();
    await expect(crossing.locator(".time-instructor")).toBeHidden();
    await expect(crossing.locator(".time-info")).toHaveCount(0);
    await expect(page.locator(".mobile-time-hint .time-info")).toBeVisible();
    await expect(page.locator(".times .time-info")).toHaveCount(1);
  } else {
    await expect(page.locator(".mobile-time-hint")).toBeHidden();
    await expect(crossing.locator(".time-instructor")).toBeVisible();
  }

  await expect(crossing.locator(".time-instructor")).toHaveCSS(
    "font-size",
    "16px",
  );
  for (const control of await page
    .locator(".month-picker select, .calendar-nav select")
    .all()) {
    await expect(control).toHaveCSS("font-size", "16px");
  }
  await crossing.click();
  await expect(crossing).toHaveAttribute("aria-expanded", "true");
  await expect(crossing).toHaveAttribute("aria-pressed", "false");
  await expect(crossing).toHaveCSS("background-color", selectedColour);
  await expect(crossing).toHaveCSS("border-color", "rgb(23, 96, 120)");
  await page
    .getByRole("combobox", { name: /Trainer for .* at 14:30/ })
    .selectOption({ index: 1 });
  await expect(page.locator(".date.in-booking strong")).toHaveCSS(
    "background-color",
    "rgb(5, 10, 47)",
  );
  await expect(page.locator(".date.in-booking strong")).toHaveCSS(
    "color",
    "rgb(255, 255, 255)",
  );
  await expect(page.locator(".date.in-booking strong")).toHaveCSS(
    "border-radius",
    "50%",
  );
  await expect(crossing).toHaveCSS("background-color", selectedCardBackground);
  await expect(crossing.locator(".time-instructor")).toHaveCSS(
    "font-size",
    "16px",
  );
  await expect(crossing.locator(".time-instructor")).toBeVisible();
  await expect(crossing.locator(".rotation-notice")).toHaveCount(0);
  await openBookingPanel(page, "trainers");
  await expect(page.locator(".trainer-toggle")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await page.locator(".trainer-toggle").click();
  await expect(page.locator(".trainer-toggle")).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect(page.locator(".trainer-bio")).toBeVisible();
  await expect(page.locator(".trainer-bio")).toHaveCSS("font-size", "14px");
  await expect(page.locator(".trainer-name")).toHaveCSS("font-size", "14px");
  await expect(
    page.locator(".booking-instructors .booking-panel-cover .eyebrow"),
  ).toHaveCSS("font-size", "12px");
  await expect(
    page.locator(".booking-instructors .booking-panel-cover .eyebrow"),
  ).toHaveCSS("text-transform", "uppercase");
  const trainerHeader = page.locator(
    ".booking-instructors .booking-panel-cover",
  );
  await expect(trainerHeader).toHaveCSS("height", "40px");
  await expect(trainerHeader).toHaveCSS("padding", "10px 16px");
  await expect(trainerHeader).toHaveCSS("background-position", "50% 57%");
  await expect(trainerHeader).toHaveCSS(
    "background-image",
    /68b1a1790591\.jpg/,
  );
  if (page.viewportSize()!.width > 700) {
    expect(
      await trainerHeader.evaluate(
        (node) => getComputedStyle(node).backgroundImage,
      ),
    ).toBe(
      await page
        .locator(".summary-cover")
        .evaluate((node) => getComputedStyle(node).backgroundImage),
    );
  }
  await expect(page.locator(".trainer-avatar svg")).toHaveCount(1);
  await expect(page.locator(".trainer-avatar")).toHaveText("");
  await expect(page.locator(".trainer-bio")).toHaveCSS("line-height", "21px");
  const trainerToggle = await page.locator(".trainer-toggle").boundingBox();
  expect(trainerToggle!.height).toBeGreaterThanOrEqual(44);
  await closeBookingPanel(page);
  await page
    .getByRole("link", {
      name: /^Enter Booking Details(?: \$[\d,.]+)?$/,
      exact: true,
    })
    .first()
    .click();
  await pageHeading("Your details");
  await expect(page.locator("#details-form h2")).toHaveText("Booking Contact");
  await sectionType("#details-form h2");
  await expect(
    page.locator(".contact-heading-row .required-fields"),
  ).toHaveText("* Required fields");
  await expect(
    page.getByText("Review your selected times and details.", { exact: false }),
  ).toHaveCount(0);
  await expect(page.locator("#details-form .section-description")).toHaveCount(
    0,
  );
  if ((page.viewportSize()?.width ?? 1280) > 700) {
    const row = page.locator(".summary .series-list li").first();
    await expect(row).toHaveCSS("padding-top", "18px");
    await expect(row).toHaveCSS("padding-bottom", "18px");
    await expect(page.locator(".summary-total")).toHaveCSS("margin-top", "0px");
  }
  await expect(page.locator("label[for='name']")).toHaveCSS(
    "font-size",
    "14px",
  );
  await expect(page.locator("#name")).toHaveCSS("font-size", "14px");
  await expect(page.locator("#name")).toHaveCSS("min-height", "52px");
  async function bookingDocumentBody() {
    const styles = await page
      .locator(
        ".booking-document p:not(.payment-foot), .booking-document .series-date, .booking-document .series-date span, .booking-document .booking-facts dt, .booking-document .booking-facts dd, .booking-document .line-item, .booking-document .line-item small, .booking-document .confirmation-total strong",
      )
      .evaluateAll((nodes) =>
        nodes.map((node) => {
          const style = getComputedStyle(node);
          return {
            size: style.fontSize,
            family: style.fontFamily,
            element: node.outerHTML,
            total: node.matches(".line-item.total"),
            amount: node.matches(".confirmation-total strong"),
            supporting: node.matches("small"),
          };
        }),
      );
    expect(styles.length).toBeGreaterThan(0);
    expect(
      styles.filter(
        (style) =>
          style.size !==
            (style.supporting
              ? "14px"
              : style.amount || style.total
                ? "20px"
                : "16px") ||
          style.family !== styles[0].family ||
          !style.family.includes("Roboto"),
      ),
      "Booking body uses 16px Roboto; total labels and amounts use 20px",
    ).toEqual([]);
  }
  await details(page);
  await pageHeading("Review Booking");
  await expect(
    page.getByText("Check your details before payment.", { exact: true }),
  ).toHaveCount(0);
  await bookingDocumentBody();

  await sectionType(".review-head h2, .review-block > h2");
  await expect(page.locator(".booking-facts")).toHaveCSS("font-size", "16px");
  for (const label of await page.locator(".client-details dt").all()) {
    await expect(label).toHaveCSS("color", "rgb(88, 97, 116)");
    await expect(label).toHaveCSS("font-weight", "400");
  }
  for (const value of await page.locator(".client-details dd").all()) {
    await expect(value).toHaveCSS("color", "rgb(16, 22, 54)");
    await expect(value).toHaveCSS("font-size", "16px");
    await expect(value).toHaveCSS("font-weight", "400");
  }

  const reviewTotal = page.locator(".line-item.total strong");
  await expect(reviewTotal).toHaveCSS("font-size", "20px");
  await expect(reviewTotal).toHaveCSS("font-family", /Roboto/);
  for (const date of await page
    .locator(".review-block .series-date > strong")
    .all()) {
    await expect(date).toHaveCSS("font-weight", "700");
  }
  for (const detail of await page
    .locator(
      ".review-block .series-date > span:first-of-type, .review-block .session-instructor",
    )
    .all()) {
    await expect(detail).toHaveCSS("color", "rgb(88, 97, 116)");
    await expect(detail).toHaveCSS("font-weight", "400");
  }
  for (const session of await page
    .locator(".booking-document .series-date")
    .all()) {
    const gaps = await session.evaluate((node) => {
      const rows = Array.from(node.children)
        .slice(0, 3)
        .map((child) => child.getBoundingClientRect());
      return rows.slice(1).map((row, index) => row.top - rows[index].bottom);
    });
    for (const gap of gaps) expect(gap).toBeCloseTo(2, 1);
  }
  await expect(page.locator(".review-block .rotation-notice")).toHaveCount(0);
  await page
    .getByRole("button", { name: /^Proceed to Payment \$[\d,.]+$/ })
    .click();
  await pageHeading("Payment");
  await sectionType(".payment-layout .section-title");
  await expect(page.locator(".method.selected")).toHaveCSS(
    "border-top-color",
    "rgb(23, 96, 120)",
  );
  await payAttempt(page);
  // Confirmation retains its original accent; booking-step headings use logo BOT blue.
  await pageHeading("Booking Confirmed", "rgb(23, 96, 120)");
  await expect(page.locator(".site-header")).toHaveCSS(
    "background-color",
    brand,
  );
  await expect(page.locator(".confirmation-shell .status-icon")).toHaveCSS(
    "background-color",
    "rgb(8, 124, 100)",
  );
  await expect(page.locator(".confirmation-shell .status-icon svg")).toHaveCSS(
    "color",
    "rgb(255, 255, 255)",
  );
  await expect(
    page.getByRole("link", { name: "WhatsApp Enquiry", exact: true }),
  ).toHaveAttribute("href", "https://wa.me/6590143819");
  await page.getByText("View Full Details", { exact: true }).click();
  await sectionType(".confirmation-card h2");
  await bookingDocumentBody();
  await expect(page.locator(".confirmation-full-details")).toHaveCSS(
    "text-align",
    "left",
  );
  await expect(page.locator(".confirmation-details-grid")).toHaveCSS(
    "text-align",
    "left",
  );
  await expect(
    page.locator(".confirmation-card .series-list li").first(),
  ).toHaveCSS("flex-direction", "row");
  const orderAlignment = await page
    .getByRole("region", { name: "Order Summary" })
    .evaluate((section) => ({
      heading: section.querySelector("h2")!.getBoundingClientRect().left,
      circles: Array.from(
        section.querySelectorAll(".series-index"),
        (circle) => circle.getBoundingClientRect().left,
      ),
    }));
  for (const left of orderAlignment.circles)
    expect(left).toBeCloseTo(orderAlignment.heading, 0);
  const facts = page.locator(".confirmation-details-grid .booking-facts");
  const { labelBox, valueBox } = await facts.evaluate(async (element) => {
    const animations: Animation[] = [];
    for (
      let ancestor: Element | null = element;
      ancestor;
      ancestor = ancestor.parentElement
    )
      animations.push(...ancestor.getAnimations());
    await Promise.all(animations.map((animation) => animation.finished));
    // Read the aligned pair in one frame after the containing section settles.
    return {
      labelBox:
        element.querySelector("dt")?.getBoundingClientRect().toJSON() ?? null,
      valueBox:
        element.querySelector("dd")?.getBoundingClientRect().toJSON() ?? null,
    };
  });
  expect(labelBox).not.toBeNull();
  expect(valueBox).not.toBeNull();
  if (page.viewportSize()!.width <= 700) {
    expect(valueBox!.x).toBeCloseTo(labelBox!.x, 0);
    expect(valueBox!.y).toBeGreaterThan(labelBox!.y);
  } else {
    expect(valueBox!.x).toBeGreaterThan(labelBox!.x);
    expect(valueBox!.y).toBeCloseTo(labelBox!.y, 0);
  }
  await expect(
    page.locator(".confirmation-card .confirmation-total strong"),
  ).toHaveCSS("font-size", "20px");
  await expect(
    page.locator(".confirmation-card .confirmation-total"),
  ).toHaveCSS("flex-wrap", "nowrap");
  await expect(
    page.locator(".confirmation-card .confirmation-total strong"),
  ).toHaveCSS("white-space", "nowrap");
  const paymentRow = await page
    .locator(".confirmation-card .confirmation-total")
    .evaluate((element) => {
      const badge = element
        .querySelector(":scope > span")!
        .getBoundingClientRect();
      const amount = element.querySelector("strong")!.getBoundingClientRect();
      return {
        labelTop: badge.y,
        amountTop: amount.y,
      };
    });
  expect(
    Math.abs(paymentRow.labelTop - paymentRow.amountTop),
  ).toBeLessThanOrEqual(1);
  await expect(
    page.locator(".confirmation-card .confirmation-total strong"),
  ).toHaveCSS("color", brand);
  await expect(page.locator("main details[open]")).toHaveCount(1);
});

test("elapsed selections block checkout on an open page and remain removable before a future multi-session payment", async ({
  page,
}) => {
  await chooseSlots(page);
  await details(page);
  await page.clock.pauseAt(new Date("2026-10-06T11:59:59.999+08:00"));
  await expect(
    page.getByRole("button", { name: /^Proceed to Payment \$[\d,.]+$/ }),
  ).toBeEnabled();
  await page.clock.runFor(1);
  await expect(
    page.getByRole("heading", { name: "Select dates and times" }),
  ).toBeVisible();
  await openBookingPanel(page, "cart");
  const basket = page.getByRole("complementary", {
    name: "Your booking summary",
  });
  await expect(
    basket.getByText("Session has started — remove to continue."),
  ).toBeVisible();
  await closeBookingPanel(page);
  await expect(
    page
      .getByRole("button", {
        name: /^Enter Booking Details(?: \$[\d,.]+)?$/,
        exact: true,
      })
      .first(),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: /12:00–12:40/ }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("soccerbot-next-demo-v2")!).draft
          .slots.length,
    ),
  ).toBe(1);
  await openBookingPanel(page, "cart");
  await page
    .getByRole("button", { name: "Remove 2026-10-06 at 12:00" })
    .click();
  await closeBookingPanel(page);
  if (page.viewportSize()!.width <= 700) {
    await expect(
      page
        .getByRole("button", { name: "Open cart, 0 sessions", exact: true })
        .locator(".booking-cart-count"),
    ).toHaveCount(0);
  }
  await expect(
    page.getByRole("button", { name: /12:00–12:40/ }),
  ).toBeDisabled();
  await page.clock.runFor(1);
  await expect(
    page.getByRole("button", { name: /12:00–12:40/ }),
  ).toBeDisabled();
  await page.clock.resume();
  await page.getByRole("button", { name: /12:50–13:30/ }).click();
  await page
    .getByRole("combobox", { name: /Trainer for .* at 12:50/ })
    .selectOption({ index: 1 });
  await page
    .getByRole("button", { name: dateLabel("2026-10-07"), exact: true })
    .click();
  await page.getByRole("button", { name: /12:00–12:40/ }).click();
  await page
    .getByRole("combobox", { name: /Trainer for .* at 12:00/ })
    .selectOption({ index: 1 });
  await page
    .getByRole("link", {
      name: /^Enter Booking Details(?: \$[\d,.]+)?$/,
      exact: true,
    })
    .first()
    .click();
  await details(page);
  await payment(page);
  await expect(
    page.getByRole("heading", { name: "Booking Confirmed", exact: true }),
  ).toBeVisible();
  await page.getByText("View Full Details", { exact: true }).click();
  await expect(
    page.getByRole("list", { name: "Selected sessions" }).getByRole("listitem"),
  ).toHaveCount(2);
  const paid = await page.evaluate(() => {
    const { draft, attempt } = JSON.parse(
      sessionStorage.getItem("soccerbot-next-demo-v2")!,
    );
    return { draft, attempt };
  });
  await page.clock.setSystemTime(new Date("2027-01-01T00:00:00+08:00"));
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Booking Confirmed", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => {
      const { draft, attempt } = JSON.parse(
        sessionStorage.getItem("soccerbot-next-demo-v2")!,
      );
      return { draft, attempt };
    }),
  ).toEqual(paid);
  await expect(page.getByText(/Session has started/)).toHaveCount(0);
});

test("protected confirmation waits for server evidence and rejects a tampered return", async ({
  page,
}) => {
  const attempt = "00000000-0000-4000-8000-000000000001";
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(`**/api/attempts/${attempt}/confirmation`, async (route) => {
    await gate;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "confirmed", reason: "verified" }),
    });
  });
  // This UI fixture must control the receipt read after confirmed evidence too.
  // Otherwise the static preview's unrelated missing route can remain pending.
  await page.route(`**/api/attempts/${attempt}/receipt`, (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "receipt_unavailable" }),
    }),
  );
  await openSite(page, `/confirmation/?attempt=${attempt}&paid=true`);
  await expect(
    page.getByRole("status", { name: "Checking payment…" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Booking Confirmed", exact: true }),
  ).toHaveCount(0);
  release();
  await expect(page).toHaveURL(sitePath("/"));
  await expect(
    page.getByRole("heading", { name: "Booking Confirmed", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Request Help" })).toHaveCount(
    0,
  );
  await page.unroute(`**/api/attempts/${attempt}/confirmation`);
  await page.route(`**/api/attempts/${attempt}/confirmation`, (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: '{"error":"access_denied"}',
    }),
  );
  await page.goto(sitePath(`/confirmation/?attempt=${attempt}&paid=true`));
  await expect(page).toHaveURL(sitePath("/"));
  await expect(
    page.getByRole("heading", { name: "Booking Confirmed", exact: true }),
  ).toHaveCount(0);
});

test("hero location opens its map only on demand without entering booking and header hover stays navy", async ({
  page,
}) => {
  let maps = 0;
  await page.route("https://www.google.com/maps?**", async (route) => {
    maps++;
    await route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><p>Synthetic satellite map</p>",
    });
  });
  await openSite(page, "/");
  await expect(page.locator("iframe")).toHaveCount(0);
  expect(maps).toBe(0);
  const book = page.locator(".nav-book");
  await book.hover();
  await expect(book).toHaveCSS("color", "rgb(5, 10, 47)");
  const location = page.getByRole("button", {
    name: "View studio location",
    exact: true,
  });
  await expect(location.locator("strong")).toHaveCSS("font-size", "18px");
  const mobileAddress = (page.viewportSize()?.width ?? 1280) <= 700;
  await expect(location.locator("small")).toHaveCSS(
    "font-size",
    mobileAddress ? "12px" : "14px",
  );
  await expect(location.locator("small")).toHaveCSS(
    "color",
    mobileAddress ? "rgb(255, 255, 255)" : "rgb(155, 180, 201)",
  );
  const target = await location.boundingBox();
  expect(target?.height).toBeGreaterThanOrEqual(68);
  // The padded corner must open the map rather than the underlying hero.
  await location.click({ position: { x: 5, y: 5 } });
  const dialog = page.getByRole("dialog", {
    name: "Find the studio",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("201 Henderson Road");
  await expect(dialog).toContainText("#05-01");
  await expect(dialog.locator("iframe")).toHaveAttribute(
    "title",
    "Satellite map of Apex at Henderson and surrounding roads",
  );
  await expect(
    page
      .frameLocator(
        'iframe[title="Satellite map of Apex at Henderson and surrounding roads"]',
      )
      .getByText("Synthetic satellite map"),
  ).toBeVisible();
  expect(maps).toBe(1);
  await expect(
    dialog.getByRole("link", { name: "Open Google Maps" }),
  ).toHaveAttribute("target", "_blank");
  await expect(page).toHaveURL(new RegExp(sitePath("/") + "$"));
  await dialog.getByRole("button", { name: "Close dialog" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(location).toBeFocused();
  await expect(page.locator("iframe")).toHaveCount(0);
});

test("Back during hero entry stays on home even when the previous page was Studio", async ({
  page,
}) => {
  await openSite(page, "/studio/");
  await page.goto(sitePath("/"));
  await expect(page.getByRole("link", { name: /^Book now —/ })).toBeVisible();
  await page.clock.install();
  await page.getByRole("link", { name: /^Book now —/ }).click();
  await expect(
    page.getByRole("button", { name: "Skip arena transition" }),
  ).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(new RegExp(sitePath("/") + "$"));
  await page.clock.runFor(5000);
  await expect(page).toHaveURL(new RegExp(sitePath("/") + "$"));
  await expect(
    page.getByRole("button", { name: "Skip arena transition" }),
  ).toHaveCount(0);
  await expect(page.getByRole("link", { name: /^Book now —/ })).toBeVisible();
  await expect(page.getByRole("main")).not.toHaveAttribute("inert");
});

test("per-slot trainer dropdowns show unique trainer biographies and retain changed choices after reload", async ({
  page,
}) => {
  await openSite(page, "/book/account/");
  await page.getByRole("button", { name: "Continue as Guest" }).click();
  await page.getByRole("link", { name: "Choose Date & Time" }).click();
  const date = addDays(DEMO_TODAY, 1);
  const mobile = page.viewportSize()!.width <= 700;
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page
    .getByRole("button", { name: dateLabel(date), exact: true })
    .click();
  {
    await expect
      .poll(async () => {
        const heading = await page.locator(".time-heading").boundingBox();
        const header = await page.locator(".site-header").boundingBox();
        const navigation = await page
          .locator(".booking-navigation")
          .boundingBox();
        const stickyBottom = mobile
          ? navigation!.y + navigation!.height
          : header!.y + header!.height;
        return Math.abs(heading!.y - stickyBottom - 84);
      })
      .toBeLessThanOrEqual(1);
    const returnCue = page.getByRole("button", {
      name: "Back to calendar",
      exact: true,
    });
    await expect(returnCue).toBeVisible();
    await expect(returnCue).toHaveCSS("position", "fixed");
    const cueBox = await returnCue.boundingBox();
    const stickyBar = await page
      .locator(mobile ? ".booking-navigation" : ".site-header")
      .boundingBox();
    expect(
      Math.abs(cueBox!.y - stickyBar!.y - stickyBar!.height - 8),
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(cueBox!.x + cueBox!.width / 2 - page.viewportSize()!.width / 2),
    ).toBeLessThanOrEqual(1);
    await expect(returnCue.locator("svg")).toHaveCSS("animation-name", "none");
    await returnCue.click();
    await expect(returnCue).toHaveCount(0);
    const calendarBox = await page.locator(".calendar-panel").boundingBox();
    const returnedHeader = await page
      .locator(mobile ? ".booking-navigation" : ".site-header")
      .boundingBox();
    expect(
      calendarBox!.y - returnedHeader!.y - returnedHeader!.height,
    ).toBeCloseTo(24, 0);
    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight),
    );
    await expect(returnCue).toBeInViewport();
    await returnCue.click();
    await expect(returnCue).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: dateLabel(date), exact: true }),
    ).toBeInViewport();
    await page
      .getByRole("button", { name: dateLabel(date), exact: true })
      .click();
    await expect(returnCue).toBeVisible();
  }
  await page.getByRole("button", { name: /12:00–12:40/ }).click();
  await expect(
    page
      .getByRole("button", {
        name: /^Enter Booking Details(?: \$[\d,.]+)?$/,
        exact: true,
      })
      .first(),
  ).toBeDisabled();
  const noon = page.getByRole("combobox", {
    name: `Trainer for ${date} at 12:00`,
  });
  const choice = page.locator(".time-choice").filter({ has: noon });
  await expect(choice).toHaveCount(1);
  await expect(choice).toHaveCSS("border-top-width", "1px");
  await expect(choice).toHaveCSS("row-gap", "normal");
  await expect(choice.locator(".time")).toHaveCSS("border-top-width", "0px");
  await expect(choice.locator(".trainer-choice")).toHaveCSS(
    "border-bottom-width",
    "0px",
  );
  await expect(choice.locator(".trainer-choice")).toHaveCSS(
    "border-top-width",
    "1px",
  );
  await choice.locator(".time").focus();
  await page.keyboard.press("Tab");
  await expect(noon).toBeFocused();
  await expect(choice).toHaveCSS("outline-style", "none");
  await expect(noon).toHaveCSS("outline-style", "solid");
  await noon.selectOption(`${date}|12:00|demo|daniel`);
  if (mobile) {
    const selected = page.getByRole("button", { name: /^12:00–12:40/ });
    const next = page.getByRole("button", { name: /^12:50–13:30/ });
    const selectedBox = await selected.boundingBox();
    const nextBox = await next.boundingBox();
    expect(selectedBox!.height).toBeCloseTo(nextBox!.height, 0);
    expect(selectedBox!.x).toBeCloseTo(nextBox!.x, 0);
    expect(nextBox!.y).toBeGreaterThan(selectedBox!.y + selectedBox!.height);
    const trainer = await selected.locator(".time-instructor").boundingBox();
    const price = await selected.locator(".time-rate").boundingBox();
    expect(trainer!.x + trainer!.width).toBeLessThanOrEqual(price!.x);
    expect(trainer!.y).toBeCloseTo(price!.y, 0);
    await expect(selected.locator(".time-instructor")).toHaveCSS(
      "font-size",
      "16px",
    );
    await page.emulateMedia({ reducedMotion: "no-preference" });
  }
  await page.getByRole("button", { name: /15:20–16:00/ }).click();
  await page
    .getByRole("combobox", { name: `Trainer for ${date} at 15:20` })
    .selectOption(`${date}|15:20|demo|daniel`);
  await openBookingPanel(page, "trainers");
  const cards = page.getByRole("region", { name: "Your instructors" });
  await expect(cards.getByRole("article")).toHaveCount(1);
  await expect(
    cards.getByRole("article", { name: "Daniel Tan", exact: true }),
  ).toContainText("Demonstration profile. Guides players through ball control");
  await expect(cards.getByRole("listitem")).toHaveCount(0);
  await closeBookingPanel(page);
  if (page.viewportSize()!.width <= 700) {
    const trainerBadge = page
      .getByRole("button", {
        name: "View selected trainers, 1 trainer",
        exact: true,
      })
      .locator(".booking-cart-count");
    await expect(trainerBadge).toHaveText("1");
    const tools = page.locator(".booking-navigation .booking-panel-buttons");
    await expect(tools).toBeVisible();
    await page
      .getByRole("group", { name: "Session times" })
      .scrollIntoViewIfNeeded();
    const toolsBox = await tools.boundingBox();
    const navBox = await page.locator(".booking-navigation").boundingBox();
    expect(toolsBox!.y).toBeGreaterThanOrEqual(navBox!.y);
    expect(toolsBox!.y + toolsBox!.height).toBeLessThanOrEqual(
      navBox!.y + navBox!.height,
    );
    const stepBox = await page.locator(".booking-current-step").boundingBox();
    expect(stepBox!.x + stepBox!.width / 2).toBeCloseTo(
      page.viewportSize()!.width / 2,
      0,
    );

    await expect(
      page
        .getByRole("button", { name: "Open cart, 2 sessions", exact: true })
        .locator(".booking-cart-count"),
    ).toHaveText("2");
    await expect(trainerBadge).toHaveCSS("animation-name", "confirmation-pop");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(trainerBadge).toHaveCSS("animation-name", "none");
    await page.emulateMedia({ reducedMotion: "no-preference" });
  }
  await page.getByRole("button", { name: /12:00–12:40/ }).click();
  const deselectedSlot = page.getByRole("button", { name: /12:00–12:40/ });
  await expect(deselectedSlot).toHaveAttribute("aria-pressed", "false");
  await expect(
    page.locator(".time-choice").filter({ has: deselectedSlot }),
  ).toHaveCSS("outline-style", "none");
  await page.getByRole("button", { name: /12:00–12:40/ }).click();
  await noon.selectOption(`${date}|12:00|demo|faisal`);
  await openBookingPanel(page, "trainers");
  await expect(cards.getByRole("article")).toHaveCount(2);
  const faisalProfile = cards.getByRole("button", {
    name: "Faisal Shahril",
    exact: true,
  });
  const danielProfile = cards.getByRole("button", {
    name: "Daniel Tan",
    exact: true,
  });
  await faisalProfile.click();
  await expect(faisalProfile).toHaveAttribute("aria-expanded", "true");
  await danielProfile.click();
  await expect(faisalProfile).toHaveAttribute("aria-expanded", "false");
  await expect(danielProfile).toHaveAttribute("aria-expanded", "true");
  await expect(cards.locator(".trainer-bio:not([hidden])")).toHaveCount(1);
  await expect(
    cards.getByRole("article", { name: "Faisal Shahril", exact: true }),
  ).toContainText("A football player, trainer and coach");
  await expect(
    cards.getByRole("article", { name: "Daniel Tan", exact: true }),
  ).toContainText("Demonstration profile. Guides players through ball control");
  await page.reload();
  await expect(page.getByRole("button", { name: /12:00–12:40/ })).toContainText(
    "Trainer: Faisal Shahril",
  );
  await expect(noon).toHaveCount(0);
  await expect(page.getByRole("button", { name: /15:20–16:00/ })).toContainText(
    "Trainer: Daniel Tan",
  );
  await openBookingPanel(page, "trainers");
  await expect(cards.getByRole("article")).toHaveCount(2);
  await closeBookingPanel(page);
  await page.getByRole("button", { name: /15:20–16:00/ }).click();
  await openBookingPanel(page, "trainers");
  await expect(cards.getByRole("article")).toHaveCount(1);
  await expect(
    cards.getByRole("article", { name: "Faisal Shahril", exact: true }),
  ).toContainText("A football player, trainer and coach");
  await expect(cards.getByRole("listitem")).toHaveCount(0);
  await closeBookingPanel(page);
  if (page.viewportSize()!.width > 700) {
    await page.setViewportSize({ width: 1366, height: 768 });
    for (const start of ["12:50", "13:40", "15:20", "17:00"]) {
      await page
        .getByRole("button", { name: new RegExp(`^${start}–`) })
        .click();
      await page
        .getByRole("combobox", { name: `Trainer for ${date} at ${start}` })
        .selectOption({ index: 1 });
    }
    const cart = page.locator(".summary-cart");
    const cartRows = cart.locator(".basket-list > li");
    await expect(cartRows).toHaveCount(5);
    // Adding the fifth session must compact existing rows as well as the new one.
    for (const row of await cartRows.all()) {
      await expect(row).toHaveCSS("padding", "8px");
      await expect(row).toHaveCSS("margin-bottom", "6px");
      await expect(row).toHaveCSS("row-gap", "2px");
      await expect(row.locator(":scope > div").first()).toHaveCSS("gap", "2px");
      await expect(row.locator(".basket-remove")).toHaveCSS(
        "min-height",
        "44px",
      );
      const lines = await row
        .locator(":scope > div")
        .first()
        .evaluate((node) =>
          Array.from(node.children)
            .slice(0, 3)
            .map((line) => line.getBoundingClientRect().toJSON()),
        );
      expect(lines[1].y - lines[0].y).toBeCloseTo(23, 1);
      expect(lines[2].y - lines[1].y).toBeCloseTo(23, 1);
      for (const line of lines) expect(line.height).toBeCloseTo(21, 1);
    }
    await expect(cart.locator(".summary-total")).toHaveCount(1);
    await expect(cart.locator(".basket-continue")).toHaveCount(0);
    await expect(cart.locator(".summary-body")).toHaveCSS(
      "padding-top",
      "28px",
    );
    await expect(cart.locator(".summary-body")).toHaveCSS(
      "padding-bottom",
      "12px",
    );
    const layout = await cart.evaluate((element) => {
      const card = element.getBoundingClientRect();
      const heading = element
        .querySelector(".basket-heading")!
        .getBoundingClientRect();
      const list = element
        .querySelector(".basket-list")!
        .getBoundingClientRect();
      const header = document
        .querySelector(".site-header")!
        .getBoundingClientRect();
      return {
        height: card.height,
        available: window.innerHeight - header.height - 32,
        headingBottom: heading.bottom,
        listTop: list.top,
        overflowing: element.scrollWidth > element.clientWidth,
      };
    });
    expect(layout.height).toBeLessThanOrEqual(layout.available);
    expect(layout.headingBottom).toBeLessThan(layout.listTop);
    expect(layout.overflowing).toBe(false);
    await page.setViewportSize({ width: 1100, height: 600 });
    const continuation = page.locator(
      ".booking-primary-action .basket-continue",
    );
    await expect(continuation).toHaveCount(1);
    await expect(continuation).toBeInViewport({ ratio: 1 });
    await page.locator(".site-footer").scrollIntoViewIfNeeded();
    await expect(continuation).toBeInViewport({ ratio: 1 });
    await expect(cart.locator(".basket-list")).toHaveCSS(
      "overflow-y",
      "visible",
    );
    await cart.getByRole("button", { name: `Remove ${date} at 17:00` }).click();
    await expect(cartRows).toHaveCount(4);
    for (const row of await cartRows.all()) {
      await expect(row).toHaveCSS("padding", "12px");
      await expect(row).toHaveCSS("margin-bottom", "12px");
      await expect(row).toHaveCSS("row-gap", "2px");
    }
  }
});

/** Check that identity badges preserve desktop and phone title geometry. */
async function expectCalendarHeadingLayout(page: Page) {
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  const calendarTitle = page.getByRole("heading", {
    name: "Select dates and times",
    exact: true,
  });
  for (const width of [1280, 1440, 375, 430, 700]) {
    await page.setViewportSize({ width, height: 900 });
    const geometry = await calendarTitle.evaluate((node) => {
      const title = node.getBoundingClientRect();
      const badge = document
        .querySelector(".booking-identity-status > span")!
        .getBoundingClientRect();
      const row = node.parentElement!.getBoundingClientRect();
      return {
        height: title.height,
        lineHeight: parseFloat(getComputedStyle(node).lineHeight),
        titleRight: title.right,
        badgeLeft: badge.left,
        badgeRight: badge.right,
        rowRight: row.right,
        badgeTop: badge.top,
        titleTop: title.top,
      };
    });
    expect(geometry.height).toBeCloseTo(
      geometry.lineHeight * (width <= 700 ? 2 : 1),
      0,
    );
    expect(geometry.badgeLeft).toBeGreaterThanOrEqual(geometry.titleRight);
    expect(geometry.badgeRight).toBeCloseTo(geometry.rowRight, 0);
    expect(geometry.badgeTop - geometry.titleTop).toBeLessThan(
      geometry.lineHeight,
    );
  }
}

test("booking titles keep deliberate phone line breaks and desktop inline layout", async ({
  page,
}) => {
  await openSite(page, "/book/account/");
  const title = page.getByRole("heading", {
    name: "Start your booking",
    exact: true,
  });
  for (const width of [375, 430, 700, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(title).toBeVisible();
    await expect(page.getByLabel("Booking identity")).toHaveCount(0);
    const geometry = await title.evaluate((node) => {
      const lines = [...node.querySelectorAll(".booking-title-line")].map(
        (line) => line.getBoundingClientRect(),
      );
      return {
        top: lines[0].top,
        secondTop: lines[1].top,
        height: node.getBoundingClientRect().height,
        lineHeight: parseFloat(getComputedStyle(node).lineHeight),
        fontSize: getComputedStyle(node).fontSize,
      };
    });
    expect(geometry.secondTop - geometry.top).toBeCloseTo(
      width <= 700 ? geometry.lineHeight : 0,
      0,
    );
    expect(geometry.height).toBeCloseTo(
      geometry.lineHeight * (width <= 700 ? 2 : 1),
      0,
    );
    if (width <= 700) expect(geometry.fontSize).toBe("32px");
  }
  await page
    .getByRole("button", { name: "Continue as Guest", exact: true })
    .click();
  const sessionTitle = page.getByRole("heading", {
    name: "Your session",
    exact: true,
  });
  await expect(sessionTitle).toBeVisible();
  const badge = page
    .getByLabel("Booking identity")
    .getByText("Guest", { exact: true });
  await expect(badge).toHaveCSS("background-color", "rgb(255, 245, 219)");
  await expect(badge).toHaveCSS("font-size", "13.5px");
  await expect(badge).toHaveCSS("padding", "6.375px 11.475px");
  await expect(badge).toHaveCSS("font-weight", "700");
  for (const width of [375, 430, 700]) {
    await page.setViewportSize({ width, height: 900 });
    const headingBox = await sessionTitle.boundingBox();
    const badgeBox = await badge.boundingBox();
    expect(badgeBox!.x).toBeGreaterThanOrEqual(
      headingBox!.x + headingBox!.width,
    );
    expect(badgeBox!.x + badgeBox!.width).toBeLessThanOrEqual(width);
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole("link", { name: "Choose Date & Time" }).click();
  const calendarTitle = page.getByRole("heading", {
    name: "Select dates and times",
    exact: true,
  });
  await expect(calendarTitle).toBeVisible();
  await expectCalendarHeadingLayout(page);
  await page.getByRole("link", { name: "Back", exact: true }).click();
  await expect(sessionTitle).toBeVisible();
  await page.getByRole("link", { name: "Back", exact: true }).click();
  await expect(title).toBeVisible();
  await expect(page.getByLabel("Booking identity")).toHaveCount(0);
});
