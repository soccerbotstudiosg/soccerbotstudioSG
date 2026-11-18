import { sitePath } from "../src/content/site-path";
import { expect, test, type Page } from "@playwright/test";
import { addDays, dateLabel } from "../src/domain/dates";
const DEMO_TODAY = "2026-10-05";
/** Read the button's reserved position without changing its floating state. */
function naturalActionBounds(button: HTMLElement) {
  const control = button.parentElement!;
  const anchor = control.parentElement!;
  const style = getComputedStyle(anchor);
  const top =
    anchor.previousElementSibling!.getBoundingClientRect().top +
    parseFloat(style.paddingTop) +
    button.offsetTop;
  return {
    top,
    bottom:
      top +
      button.getBoundingClientRect().height +
      parseFloat(style.paddingBottom),
  };
}
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
/** Hold actual hero readiness so cover assertions do not depend on a minimum timer. */
async function holdHomeDecode(page: Page) {
  await page.evaluate(() => {
    const original = HTMLImageElement.prototype.decode;
    const pending = new Promise<void>((resolve) => {
      window.addEventListener(
        "test-release-home-decode",
        () => {
          HTMLImageElement.prototype.decode = original;
          resolve();
        },
        { once: true },
      );
    });
    HTMLImageElement.prototype.decode = function () {
      const decoded = original.call(this);
      return this.closest(".arena-photograph")
        ? Promise.all([decoded, pending]).then(() => undefined)
        : decoded;
    };
  });
  return () =>
    page.evaluate(() => {
      window.dispatchEvent(new Event("test-release-home-decode"));
    });
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
      name: /^Enter contact details(?: \$[\d,.]+)?$/,
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
  await page.getByRole("button", { name: "Continue as guest" }).click();
  await page.getByRole("link", { name: "Choose sessions" }).click();
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
      name: /^Enter contact details(?: \$[\d,.]+)?$/,
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
  const emailControl = page.getByRole("button", {
    name: "Confirm email address is correct",
  });
  const emailInput = page.getByRole("textbox", { name: /^Email address/ });
  await expect(emailControl).toHaveCSS("top", "1px");
  await expect(emailControl).toHaveCSS("bottom", "1px");
  await expect(emailControl).toHaveCSS("right", "1px");
  await expect(emailControl).toHaveCSS("border-left-width", "1px");
  const emailBox = await emailInput.boundingBox();
  const controlBox = await emailControl.boundingBox();
  expect(controlBox!.height).toBeCloseTo(emailBox!.height - 2, 0);
  await expect(page.locator("#email-check-help")).toHaveText(
    "Select blue circle to confirm email.",
  );
  if (page.viewportSize()!.width <= 700) {
    const helper = page.locator("#email-check-help");
    const dimensions = await helper.evaluate((element) => ({
      height: element.getBoundingClientRect().height,
      lineHeight: Number.parseFloat(getComputedStyle(element).lineHeight),
      width: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(dimensions.height).toBeLessThanOrEqual(dimensions.lineHeight + 1);
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width);
  }
  await expect(
    emailControl.locator(".email-transfer-particles circle"),
  ).toHaveCount(3);
  await emailControl.click();
  await expect(emailControl).toHaveAttribute("data-state", "valid");
  await expect(emailControl.locator(".email-transfer-tick")).toHaveCSS(
    "opacity",
    "1",
  );
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
    // Playwright's installed clock clears navigation timing entries, so this
    // fixture retains the operation label. Real reload labels are covered by
    // the live-email tests without a mocked Performance API.
    await expect(
      page.getByRole("status", { name: "Processing payment", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".page-loading")).toHaveCount(1);
    await expect(page.locator(".booking-flow-overlay")).toHaveCount(0);
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
      const initialLabel = [
        "/book/payment/",
        "/book/confirmation/",
        "/confirmation/",
      ].includes(path)
        ? "Checking payment…"
        : path === "/book/review/"
          ? "Checking booking…"
          : "Loading page";
      await expect(
        cover.getByRole("status", { name: initialLabel, exact: true }),
      ).toBeVisible();
      await expect(page.locator("#page-refresh-content")).toHaveAttribute(
        "inert",
        "",
      );
      await expect(page.locator("#main")).not.toBeVisible();
      await expect(page.locator(".site-footer")).not.toBeVisible();
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect(
        cover.getByRole("status", { name: initialLabel, exact: true }),
      ).toBeVisible();
      await page.emulateMedia({ reducedMotion: "no-preference" });
      const bounds = await cover.boundingBox();
      expect(bounds).toEqual({ x: 0, y: 0, ...page.viewportSize()! });
      await page.evaluate(() => {
        const check = (source: string) => {
          if (document.getElementById("page-refresh")) return;
          const main = document.getElementById("main");
          const root = document.documentElement.getBoundingClientRect();
          const loading = [...document.querySelectorAll(".page-loading")].some(
            (node) => {
              const box = node.getBoundingClientRect();
              return (
                getComputedStyle(node).visibility === "visible" &&
                // Chromium clientWidth includes the stable gutter even when the
                // root and fixed overlay both exclude it. Compare actual bounds.
                box.left <= root.left + 1 &&
                box.right >= root.right - 1 &&
                box.top <= 1 &&
                box.bottom >= innerHeight - 1
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
      await page.unrouteAll({ behavior: "wait" });
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
  hasTouch,
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
    await expect(promotion).toHaveCSS("margin-top", "0px");
    const box = await promotion.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeCloseTo(0, 0);
    expect(box!.width).toBeCloseTo(page.viewportSize()!.width, 0);
    await expect(promotion.locator("img")).toHaveAttribute("alt", /.+/);
    await expect(promotion).toHaveCSS("background-color", "rgb(245, 246, 250)");
    await expect(promotion).toHaveCSS("color", "rgb(16, 22, 54)");
    await expect(promotion.locator(".promotion-cta")).toHaveCount(0);
    await expect(promotion.locator("a.feature-copy")).toHaveCount(1);
    await expect(promotion).toHaveCSS(
      "position",
      page.viewportSize()!.width <= 700 ? "relative" : "sticky",
    );
    await expect(promotion.locator(".feature-heading")).toHaveCSS(
      "margin-bottom",
      page.viewportSize()!.width <= 700 ? "32px" : "40px",
    );
  }
  await expect(page.locator(".promotion-edge")).toHaveCount(0);
  const initialBookingCopy = page.locator(
    ".home-promotion--booking .promotion-copy-content",
  );
  await expect(initialBookingCopy).toHaveCSS(
    "text-align",
    hasTouch && page.viewportSize()!.width > 700 ? "left" : "right",
  );
  await expect(page.locator(".promotion-journey")).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
  await expect(page.locator(".promotion-stack")).toHaveCSS(
    "background-color",
    page.viewportSize()!.width <= 700
      ? "rgb(255, 255, 255)"
      : "rgba(0, 0, 0, 0)",
  );
  await expect(page.locator(".promotion-journey > :first-child")).toHaveCSS(
    "position",
    page.viewportSize()!.width <= 700 ? "static" : "sticky",
  );
  if (hasTouch) {
    for (const panel of await promotions.all()) {
      await expect(panel).toHaveAttribute("data-active", "true");
      await expect(panel.locator(".feature-full")).toHaveAttribute(
        "aria-hidden",
        "false",
      );
    }
  }
  const firstPanel = promotions.first();
  await expect(firstPanel).toHaveCSS(
    "border-radius",
    page.viewportSize()!.width <= 700 ? "0px" : "18px 18px 0px 0px",
  );
  await expect(firstPanel).toHaveCSS("box-shadow", "none");
  if (page.viewportSize()!.width > 700) {
    const photo = firstPanel.locator(".promotion-image");
    for (const panel of await promotions.all()) {
      await expect(panel.locator(".promotion-image img")).toHaveCSS(
        "object-fit",
        "cover",
      );
      await expect(panel.locator(".feature-copy")).toHaveCSS(
        "padding-top",
        "32px",
      );
      await expect(panel.locator(".feature-copy")).toHaveCSS(
        "padding-bottom",
        "80px",
      );
    }
    expect((await photo.boundingBox())!.height).toBeGreaterThanOrEqual(360);
    expect((await photo.boundingBox())!.width).toBeLessThanOrEqual(924);
    expect(
      await promotions
        .nth(1)
        .evaluate((node) => parseFloat(getComputedStyle(node).marginTop)),
    ).toBe(0);
    await expect(photo.locator("img")).toHaveCSS("object-position", "50% 80%");
  }
  if (page.viewportSize()!.width <= 700) {
    for (const panel of await promotions.all()) {
      await expect(panel).toHaveAttribute("data-active", "true");
      await expect(panel.locator(".feature-full")).toHaveCSS("opacity", "1");
      const rightAligned = (await panel.getAttribute("class"))!.includes(
        "home-promotion--booking",
      );
      for (const selector of [
        ".promotion-copy-content",
        ".feature-title-expanded",
        ".feature-description",
      ])
        await expect(panel.locator(selector)).toHaveCSS(
          "text-align",
          rightAligned ? "right" : "left",
        );
    }
  }
  if (page.viewportSize()!.width > 700) {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const photo = firstPanel.locator(".promotion-image img");
    const originalTransform = await photo.evaluate(
      (node) => getComputedStyle(node).transform,
    );
    const originalSize = await firstPanel.evaluate((node) => ({
      width: (node as HTMLElement).offsetWidth,
      height: (node as HTMLElement).offsetHeight,
    }));
    await firstPanel.locator("a.feature-copy").focus();
    await expect(firstPanel).toHaveAttribute("data-active", "true");
    await expect(firstPanel.locator(".feature-title-initial")).toHaveCSS(
      "visibility",
      "hidden",
    );
    await expect(photo).toHaveCSS("transform", originalTransform);
    expect(
      await firstPanel.evaluate((node) => ({
        width: (node as HTMLElement).offsetWidth,
        height: (node as HTMLElement).offsetHeight,
      })),
    ).toEqual(originalSize);
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.emulateMedia({ reducedMotion: "reduce" });
  }
  const prominentPrice = page.locator(
    ".home-promotion--booking .promotion-details strong",
  );
  expect(
    await prominentPrice.evaluate((node) =>
      parseFloat(getComputedStyle(node).fontSize),
    ),
  ).toBeGreaterThanOrEqual(18);
  await firstPanel.locator("a.feature-copy").focus();
  const chevron = firstPanel.locator(".feature-arrow svg");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(chevron).toHaveCSS("animation-name", "feature-chevron-nudge");
  await expect(chevron).toHaveCSS("animation-iteration-count", "infinite");
  await expect(chevron.locator(".feature-chevron path")).toHaveCount(2);
  await expect(
    firstPanel.locator(".feature-heading .feature-arrow"),
  ).toHaveCount(0);
  const cueBounds = await firstPanel.locator(".feature-arrow").boundingBox();
  const copyBounds = await firstPanel.locator(".feature-copy").boundingBox();
  expect(cueBounds!.width).toBe(25);
  expect(cueBounds!.height).toBe(18);
  expect(
    copyBounds!.y + copyBounds!.height - cueBounds!.y - cueBounds!.height,
  ).toBeGreaterThanOrEqual(24);
  expect(
    copyBounds!.x + copyBounds!.width - cueBounds!.x - cueBounds!.width,
  ).toBeGreaterThanOrEqual(24);

  await expect(chevron.locator(".feature-chevron path").first()).toHaveCSS(
    "animation-name",
    "feature-chevron-light",
  );
  await expect(chevron.locator(".feature-chevron path").last()).toHaveCSS(
    "animation-delay",
    "-0.9s",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(chevron).toHaveCSS("animation-name", "none");
  await expect(chevron.locator(".feature-chevron path").first()).toHaveCSS(
    "animation-name",
    "none",
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
  const contactBanner = page.locator(".abstract-promotion");
  await expect(contactBanner).toHaveCount(1);
  await expect(contactBanner).toHaveCSS("background-color", "rgb(5, 10, 47)");
  await expect(contactBanner).toHaveCSS("color", "rgb(255, 255, 255)");
  const contactGradient = await contactBanner.evaluate(
    (node) => getComputedStyle(node).backgroundImage,
  );
  const mobileBanner = page.viewportSize()!.width <= 700;
  const touchBanner = hasTouch || mobileBanner;
  await expect(contactBanner.locator(".promotion-cta")).toHaveCount(
    touchBanner ? 1 : 0,
  );
  const bannerLink = contactBanner.getByRole("link", {
    name: "Enquire",
    exact: true,
  });
  await expect(bannerLink).toHaveClass(
    touchBanner
      ? "button promotion-cta"
      : /^abstract-promotion-link(?: section-reveal(?:-pending)?)?$/,
  );
  const bannerLayout = contactBanner.locator(
    touchBanner ? ".abstract-promotion-mobile" : ".abstract-promotion-link",
  );
  await expect(bannerLayout.locator(":scope > *")).toHaveCount(3);
  if (touchBanner) {
    await expect(bannerLink.locator("svg")).toHaveCount(0);
    await expect(bannerLink).toHaveCSS("border-radius", "3px 12px");
    await expect(bannerLink).toHaveCSS("min-height", "48px");
  }
  await expect(
    bannerLink.locator(".abstract-promotion-action svg"),
  ).toHaveCount(0);
  await expect(bannerLayout).toHaveCSS("min-height", "107px");
  await expect(contactBanner).toHaveCSS(
    "margin-top",
    mobileBanner ? "12px" : "24px",
  );
  expect(
    await contactBanner.evaluate((node) => ({
      color: getComputedStyle(node, "::before").backgroundColor,
      height: getComputedStyle(node, "::before").height,
    })),
  ).toEqual({
    color: "rgb(255, 255, 255)",
    height: mobileBanner ? "12px" : "24px",
  });
  const bannerHeadingSize = await contactBanner
    .locator("h2")
    .evaluate((node) => getComputedStyle(node).fontSize);
  if (!touchBanner) {
    await expect(bannerLink.locator(".abstract-promotion-action")).toHaveCSS(
      "font-size",
      bannerHeadingSize,
    );
    await expect(bannerLink.locator(".abstract-promotion-action")).toHaveCSS(
      "color",
      "rgb(70, 172, 220)",
    );
  }
  await expect(contactBanner.locator("img")).toHaveCount(0);
  await expect(contactBanner.locator(".promotion-edge")).toHaveCount(0);
  if (
    !touchBanner &&
    (await page.evaluate(() => matchMedia("(hover: hover)").matches))
  ) {
    await bannerLink.scrollIntoViewIfNeeded();
    const restingHeight = (await bannerLink.boundingBox())!.height;
    await bannerLink.hover();
    await expect(contactBanner).toHaveCSS("transform", "none");
    // Production CSS normalizes zero percentages to unitless zero (computed as px).
    await expect(bannerLink).toHaveCSS("background-position-x", /^0(?:%|px)$/);
    await expect(bannerLink).toHaveCSS("box-shadow", /inset/);
    expect(
      await bannerLink.evaluate((node) =>
        ["::before", "::after"].map(
          (pseudo) => getComputedStyle(node, pseudo).animationName,
        ),
      ),
    ).toEqual(["banner-light", "banner-light"]);
    await expect(bannerLink.locator("h2")).toHaveCSS(
      "font-size",
      bannerHeadingSize,
    );
    await expect(bannerLink.locator(".abstract-promotion-action")).toHaveCSS(
      "font-size",
      bannerHeadingSize,
    );
    expect((await bannerLink.boundingBox())!.height).toBeCloseTo(
      restingHeight,
      0,
    );
    await page.mouse.move(0, 0);
  }
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
  const appCenters = await page
    .locator(
      ".footer-apps .footer-contact-heading, .footer-app-links, .footer-brand",
    )
    .evaluateAll((nodes) =>
      nodes.map((node) => {
        const bounds = node.getBoundingClientRect();
        return bounds.x + bounds.width / 2;
      }),
    );
  expect(appCenters).toHaveLength(3);
  for (const center of appCenters) expect(center).toBeCloseTo(appCenters[0], 0);
  if (page.viewportSize()!.width > 1100) {
    const appsBox = await page.locator(".footer-apps").boundingBox();
    const edge = footerBandBox!.x + footerBandBox!.width;
    expect(appsBox!.x + appsBox!.width).toBeCloseTo(edge, 0);
    await expect(page.locator(".footer-contact-grid")).toHaveCSS(
      "column-gap",
      "36px",
    );
    await expect(
      page.locator(".footer-apps .footer-contact-heading"),
    ).toHaveCSS("text-align", "center");
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
    await expect(
      page.locator(".footer-apps .footer-contact-heading"),
    ).toHaveCSS("text-align", "center");
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
    contactBanner.getByRole("link", { name: "Enquire", exact: true }),
  ).toHaveAttribute("href", sitePath("/enquiry/"));
  await expect(
    page.getByRole("button", { name: /studio assistant/i }),
  ).toHaveCount(0);
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "The studio", exact: true })
    .click();
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
  await expect(
    page.getByRole("link", { name: "Back", exact: true }),
  ).toHaveAttribute("href", sitePath("/"));
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
  expect(contentBox!.y).toBeCloseTo(heroBox!.y + heroBox!.height + 12, 0);
  const studioBackAlignment = page.locator(".studio-back");
  const backIcon = await studioBackAlignment.locator("svg").boundingBox();
  const backLabel = await studioBackAlignment.locator("span").boundingBox();
  expect(backIcon!.y + backIcon!.height / 2).toBeCloseTo(
    backLabel!.y + backLabel!.height / 2,
    0,
  );
  const signatureBox = await page.locator(".studio-signature").boundingBox();
  const studioHeaderBox = await page.locator(".site-header").boundingBox();
  expect(signatureBox).not.toBeNull();
  expect(studioHeaderBox).not.toBeNull();
  expect(signatureBox!.y + signatureBox!.height).toBeCloseTo(
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
    0,
  );
  await expect(page.locator(".studio-row")).toHaveCount(5);
  const firstPhotoBox = await page
    .locator(".studio-photo")
    .first()
    .boundingBox();
  expect(firstPhotoBox).not.toBeNull();
  expect(firstPhotoBox!.y).toBeCloseTo(contentBox!.y, 0);
  await expect(
    page.locator(".studio-row").first().locator(".promotion-edge--top"),
  ).toHaveCount(0);
  for (const row of await page.locator(".studio-row").all()) {
    await expect(row).toHaveCSS(
      "position",
      page.viewportSize()!.width <= 700 ? "relative" : "sticky",
    );
    const studioImage = row.locator(".studio-photo img");
    await expect(studioImage).toHaveCSS("object-fit", "cover");
    const photoFrame = await row.locator(".studio-photo").boundingBox();
    const imageBox = await studioImage.boundingBox();
    expect(imageBox!.width).toBeGreaterThanOrEqual(photoFrame!.width);
    expect(imageBox!.height).toBeGreaterThanOrEqual(photoFrame!.height);
    await expect(row).toHaveCSS("margin-top", "0px");
    await expect(row.locator("a, button")).toHaveCount(0);
    await expect(row).toHaveAttribute("tabindex", "0");
    if (hasTouch) await expect(row).toHaveAttribute("data-active", "true");
    if (page.viewportSize()!.width <= 700) {
      const photo = row.locator(".studio-photo");
      const copy = row.locator(".studio-copy");
      await expect(photo).toHaveCSS("grid-column-start", "1");
      await expect(copy).toHaveCSS("grid-column-start", "1");
      const photoBox = await photo.boundingBox();
      const copyBox = await copy.boundingBox();
      expect(copyBox!.y).toBeCloseTo(photoBox!.y + photoBox!.height, 0);
      expect(copyBox!.width).toBeCloseTo(photoBox!.width, 0);
    }
    const reversed = /\breverse\b/.test(
      (await row.getAttribute("class")) || "",
    );
    await expect(row.locator(".feature-title-initial")).toHaveCSS(
      "justify-self",
      page.viewportSize()!.width > 700 && reversed ? "end" : "start",
    );
    await expect(row.locator(".feature-title-expanded")).toHaveCSS(
      "justify-self",
      page.viewportSize()!.width <= 700
        ? reversed
          ? "end"
          : "start"
        : reversed
          ? "start"
          : "end",
    );
    if (page.viewportSize()!.width <= 700) {
      for (const selector of [
        ".promotion-copy-content",
        ".feature-title-expanded",
        ".feature-description",
      ])
        await expect(row.locator(selector)).toHaveCSS(
          "text-align",
          reversed ? "right" : "left",
        );
    }
  }
  await expect(page.locator(".promotion-stack")).toHaveCSS(
    "background-color",
    page.viewportSize()!.width <= 700
      ? "rgb(255, 255, 255)"
      : "rgba(0, 0, 0, 0)",
  );
  const studioBanner = page.locator(".studio-bottom.abstract-promotion");
  await expect(studioBanner).toBeAttached();
  await expect(studioBanner).toHaveCSS(
    "margin-top",
    mobileBanner ? "12px" : "24px",
  );
  await expect(studioBanner).toHaveCSS("background-color", "rgb(5, 10, 47)");
  await expect(studioBanner).toHaveCSS("background-image", contactGradient);
  await expect(studioBanner.locator("img")).toHaveCount(0);
  await expect(studioBanner).toHaveCSS(
    "background-image",
    /linear-gradient.*rgb\(23, 96, 120\)/,
  );
  if (!touchBanner)
    await expect(studioBanner.locator(".abstract-promotion-action")).toHaveCSS(
      "color",
      "rgb(70, 172, 220)",
    );
  const studioBannerBox = await studioBanner.boundingBox();
  const studioFooterBox = await page.locator(".site-footer").boundingBox();
  expect(studioBannerBox).not.toBeNull();
  expect(studioFooterBox).not.toBeNull();
  expect(studioFooterBox!.y).toBeGreaterThanOrEqual(
    studioBannerBox!.y + studioBannerBox!.height - 1,
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
  await lastStudioRow.scrollIntoViewIfNeeded();
  const studioBack = page
    .locator(".site-header")
    .getByRole("link", { name: "Back", exact: true });
  await expect(studioBack).toBeInViewport();
  await expect(studioBack).toHaveCount(1);
  await expect(studioBack).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(studioBack).toHaveCSS("border-width", "0px");
  const pinnedBackBox = await studioBack.boundingBox();
  const pinnedHeaderBox = await page
    .locator(".site-header .studio-signature")
    .boundingBox();
  expect(pinnedBackBox!.y + pinnedBackBox!.height / 2).toBeCloseTo(
    pinnedHeaderBox!.y + pinnedHeaderBox!.height / 2,
    1,
  );

  await lastStudioRow.focus();
  await expect(lastStudioRow).toHaveAttribute("data-active", "true");
  await expect(lastStudioRow.locator(".feature-arrow")).toHaveCount(0);
  await expect(lastStudioRow.locator(".feature-circuits")).toBeVisible();
  await expect(lastStudioRow.locator(".feature-full")).toHaveCSS(
    "opacity",
    "1",
  );
  await expect(lastStudioRow.locator(".feature-copy")).toHaveCSS(
    "background-color",
    "rgb(5, 10, 47)",
  );
  await expect(
    lastStudioRow.locator(".feature-title-expanded > span"),
  ).toHaveCSS("color", "rgb(70, 172, 220)");
  await expect(
    lastStudioRow.locator(".section-reveal, .section-reveal-pending"),
  ).toHaveCount(0);
  if (page.viewportSize()!.width > 700) {
    await lastStudioRow.evaluate(async (node) => {
      node.scrollIntoView({ block: "start", behavior: "instant" });
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    });
  }
  const previousCard = page.locator(".studio-row").nth(3);
  const previousBox = await previousCard.boundingBox();
  const lastBox = await lastStudioRow.boundingBox();
  if (page.viewportSize()!.width <= 700)
    expect(previousBox!.y + previousBox!.height).toBeLessThanOrEqual(
      lastBox!.y + 1,
    );
  else expect(previousBox!.y + previousBox!.height).toBeGreaterThan(lastBox!.y);
  await page.keyboard.press("Escape");
  await expect(lastStudioRow).toHaveAttribute(
    "data-active",
    hasTouch || page.viewportSize()!.width <= 700 ? "true" : "false",
  );
  const backToTop = page.getByRole("button", {
    name: "Back to top",
    exact: true,
  });
  await page.evaluate(() => scrollBy(0, -1));
  await expect(backToTop).toBeVisible();
  const backToTopBox = await backToTop.boundingBox();
  await expect(backToTop).toHaveCount(1);
  expect(
    page.viewportSize()!.width - backToTopBox!.x - backToTopBox!.width,
  ).toBeCloseTo(20, 0);
  expect(
    page.viewportSize()!.height - backToTopBox!.y - backToTopBox!.height,
  ).toBeCloseTo(24, 0);
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
  await expect(page.locator(".page-loading")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Inside the arena." }),
  ).toBeVisible();
  const response = await page.goto(sitePath("/admin/"));
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "404 — Page not found" }),
  ).toHaveCount(1);
  await expect(page.locator(".not-found-grid-art")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await expect(page.locator(".site-header")).toBeVisible();
  await expect(page.locator(".site-footer")).toBeVisible();
  await expect(
    page
      .locator(".site-header")
      .getByRole("img", { name: "SOCCERBOTSTUDIO Singapore", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".not-found-brand")).toHaveCount(0);
  await expect(page.locator(".player-app-dialog")).toHaveCount(0);
  if (page.viewportSize()!.width <= 600) {
    const message = await page.locator(".not-found-message").boundingBox();
    const explorer = await page.locator(".not-found-explorer").boundingBox();
    const art = await page.locator(".not-found-art").boundingBox();
    expect(explorer!.y + explorer!.height).toBeLessThan(message!.y);
    expect(message!.y + message!.height).toBeLessThan(art!.y + art!.height);
  }
  const hiddenInstagram = page.locator(".not-found-instagram");
  await expect(hiddenInstagram).toHaveCSS("opacity", "0.3");
  await hiddenInstagram.focus();
  await expect(hiddenInstagram).toHaveCSS("opacity", "1");
  await expect(hiddenInstagram).toHaveCSS("color", "rgb(128, 147, 174)");
  await expect(hiddenInstagram).toHaveCSS("background-image", "none");
  // Translation can introduce fractional WebKit bounding-box rounding; the hit target retains its exact layout size.
  await expect(hiddenInstagram).toHaveCSS("width", "44px");
  await expect(hiddenInstagram).toHaveCSS("height", "44px");
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
  const home = page.getByRole("link", { name: "Back to home", exact: true });
  await expect(home).toBeVisible();
  await expect(
    home.locator(".not-found-home-label, .not-found-home-shine"),
  ).toHaveCount(0);
  const astronaut = await page.locator(".not-found-astronaut").boundingBox();
  const sphere = await home.boundingBox();
  // The source artwork's open palm is centred at18% across and34% down.
  expect(sphere!.width).toBeGreaterThanOrEqual(44);
  expect(
    Math.abs(
      (sphere!.x + sphere!.width / 2 - astronaut!.x) / astronaut!.width - 0.18,
    ),
  ).toBeLessThan(0.015);
  expect(
    Math.abs(
      (sphere!.y + sphere!.height - astronaut!.y) / astronaut!.height - 0.34,
    ),
  ).toBeLessThan(0.015);
  await home.focus();
  await expect(home).toBeFocused();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(home).toHaveCSS("transition-duration", "0.25s, 5s");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(() =>
      home.evaluate((element) =>
        getComputedStyle(element)
          .transitionDuration.split(",")
          .map((duration) => Number.parseFloat(duration)),
      ),
    )
    .toEqual([0.00001]);
  await home.press("Enter");
  await expect(page).toHaveURL(new RegExp(sitePath("/") + "$"));
  await expect(page.locator(".site-header")).toBeVisible();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect
    .poll(() =>
      page.locator(".arena-booking").evaluate((node) => {
        const shine = getComputedStyle(node, "::after");
        return [
          shine.animationName,
          shine.animationDuration,
          shine.animationIterationCount,
        ].join("/");
      }),
    )
    .toBe("home-light-sweep/5s/infinite");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(() =>
      page
        .locator(".arena-booking")
        .evaluate((node) => getComputedStyle(node, "::after").animationName),
    )
    .toBe("none");
  const nestedResponse = await page.goto(sitePath("/book/session/yes"));
  expect(nestedResponse?.status()).toBe(404);
  await expect(page.locator(".not-found-grid-art")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await expect(page.locator(".player-app-dialog")).toHaveCount(0);
  await page.getByRole("link", { name: "Back to home", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Leave this booking?" }),
  ).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(sitePath("/") + "$"));
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
  await expect(
    page.getByRole("heading", { name: "Booking Contact", exact: true }),
  ).toBeVisible();
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
  hasTouch,
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
    "Use 8 digits, starting with 8 or 9.",
  );
  if (page.viewportSize()!.width <= 700) {
    const hint = await page.locator("#phone-error").evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        height: node.getBoundingClientRect().height,
        line: parseFloat(style.lineHeight),
        width: node.clientWidth,
        content: node.scrollWidth,
      };
    });
    expect(hint.height).toBeLessThanOrEqual(hint.line + 1);
    expect(hint.content).toBeLessThanOrEqual(hint.width);
  }
  await expect(
    page.getByRole("button", { name: /^Review Booking \$[\d,.]+$/ }),
  ).toBeDisabled();
  await page.getByLabel("Full name", { exact: false }).blur();
  await expect(page.locator("#name")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#details-form input")).toHaveCount(4);
  await expect(page.locator("#details-form select")).toHaveCount(
    hasTouch || page.viewportSize()!.width <= 700 ? 2 : 1,
  );
  await expect(page.locator("#details-form textarea")).toHaveCount(0);
  const bookingFieldSize = await page.locator("#name").boundingBox();
  const contactMethodSize = await page
    .getByLabel("Preferred contact method", { exact: false })
    .boundingBox();
  expect(contactMethodSize!.height).toBeCloseTo(bookingFieldSize!.height, 0);
  expect(contactMethodSize!.width).toBeCloseTo(bookingFieldSize!.width, 0);

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
  const touchCountry = hasTouch || page.viewportSize()!.width <= 700;
  const countrySearch = page.getByRole("combobox", {
    name: "Search country or dial code",
  });
  if (touchCountry) {
    await expect(countrySearch).toHaveCount(0);
    await page
      .getByRole("combobox", { name: "Country code: Singapore +65" })
      .selectOption("GB");
    await expect(
      page.getByRole("dialog", { name: "Choose country code" }),
    ).toHaveCount(0);
  } else {
    await page
      .getByRole("button", { name: "Country code: Singapore +65" })
      .click();
    const countryLayers = await page
      .getByRole("dialog", { name: "Choose country code" })
      .evaluate((menu) => ({
        menu: Number(getComputedStyle(menu).zIndex),
        action: Number(
          getComputedStyle(document.querySelector(".booking-action-anchor")!)
            .zIndex,
        ),
        header: Number(
          getComputedStyle(document.querySelector(".site-header")!).zIndex,
        ),
      }));
    expect(countryLayers.menu).toBeGreaterThan(countryLayers.action);
    expect(countryLayers.menu).toBeLessThan(countryLayers.header);
    await countrySearch.fill("United Kingdom");
    await countrySearch.press("Enter");
  }
  await expect(page.locator("#phone")).toHaveAttribute(
    "placeholder",
    "07400 123456",
  );
  await page.locator("#phone").fill("7911123456");
  await expect(page.locator("#phone")).toHaveAttribute("aria-invalid", "false");
  if (!touchCountry) {
    await page
      .getByRole("button", { name: "Country code: United Kingdom +44" })
      .click();
    await countrySearch.fill("Singapore");
    await countrySearch.press("Enter");
  } else {
    await page
      .getByRole("combobox", { name: "Country code: United Kingdom +44" })
      .selectOption("SG");
  }
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
  if (page.viewportSize()!.width <= 700) {
    const proceed = page.getByRole("button", {
      name: /^Proceed to Payment \$[\d,.]+$/,
    });
    const natural = await proceed.evaluate(naturalActionBounds);
    await page.evaluate(async ({ top }) => {
      const header = document
        .querySelector(".site-header")!
        .getBoundingClientRect();
      scrollTo({
        top: Math.max(0, scrollY + top - header.bottom - 24),
        behavior: "instant",
      });
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    }, natural);
    // The hint may cross the header; the visible click target must stay put.
    await expect(page.locator(".booking-action-anchor")).toHaveCSS(
      "position",
      "sticky",
    );
    await expect(proceed).toBeInViewport({ ratio: 1 });
  }
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
        name: /^Enter contact details(?: \$[\d,.]+)?$/,
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
  await page.getByRole("button", { name: "Continue with email" }).click();
  const emailHeading = page.getByRole("heading", {
    name: "Continue with email",
    exact: true,
  });
  await expect(emailHeading.locator(".booking-title-line")).toHaveCount(1);
  await expect(page.getByLabel("Booking progress")).toHaveCount(0);
  const headingLines = await emailHeading.evaluate((heading) => ({
    height: heading.getBoundingClientRect().height,
    lineHeight: Number.parseFloat(getComputedStyle(heading).lineHeight),
  }));
  expect(headingLines.height).toBeCloseTo(headingLines.lineHeight, 0);
  await page
    .getByRole("textbox", { name: /^Email address/ })
    .fill("name@domain");
  await page.getByRole("button", { name: "Email me a code" }).click();
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
  await page.getByRole("button", { name: "Email me a code" }).click();
  await expect(
    page.getByRole("heading", { name: "Verify your email", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Booking progress")).toHaveCount(0);
  // The code view mounts before the loading overlay releases page inertness.
  await expect(page.locator("main")).not.toHaveAttribute("inert");
  for (const selector of [".auth-code-recipient", ".auth-code-label"]) {
    await expect(page.locator(selector)).toHaveCSS("text-align", "center");
  }
  await expect(
    page.locator(".auth-code-recipient .auth-email-address"),
  ).toHaveCSS("display", "block");
  const expiryGap = await page
    .locator(".auth-code-expiry")
    .evaluate(
      (timer) =>
        timer.getBoundingClientRect().top -
        document.getElementById("auth-code")!.getBoundingClientRect().bottom,
    );
  expect(expiryGap).toBeCloseTo(6, 0);
  for (const selector of [
    ".auth-code-recipient",
    ".auth-code-label",
    ".auth-code-expiry",
    ".auth-code-help p",
    ".auth-code-help .text-link",
  ]) {
    await expect(page.locator(selector)).toHaveCSS("font-size", "16px");
  }
  await expect(page.locator(".auth-code-help")).toHaveCSS("margin-top", "36px");
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
  await page.getByRole("link", { name: "Choose sessions" }).click();
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
  const enquiryFieldSize = await page.locator("#enquiry-guests").boundingBox();
  for (const selector of [
    "#enquiry-purpose",
    "#enquiry-date",
    "#enquiry-time",
  ]) {
    const size = await page.locator(selector).boundingBox();
    expect(size!.height).toBeCloseTo(enquiryFieldSize!.height, 0);
    expect(size!.width).toBeCloseTo(enquiryFieldSize!.width, 0);
  }
  await expect(page.locator("#enquiry-date")).toHaveAccessibleDescription(
    "Select a date.",
  );
  await expect(page.locator("#enquiry-time")).toHaveAccessibleDescription(
    "Select a time (SGT).",
  );

  for (const key of ["date", "time"]) {
    const input = page.locator(`#enquiry-${key}`);
    const hint = page.locator(`#enquiry-${key}-hint`);
    await expect(hint).toBeVisible();
    const fieldBox = await input.boundingBox();
    const hintBox = await hint.boundingBox();
    expect(hintBox!.y).toBeGreaterThan(fieldBox!.y);
    expect(hintBox!.y + hintBox!.height).toBeLessThan(
      fieldBox!.y + fieldBox!.height,
    );
  }

  await expect(page.getByText("Enter 1–2,000 characters.")).toHaveCount(0);
  await expect(page.locator('.enquiry-form [aria-invalid="true"]')).toHaveCount(
    0,
  );
  await expect(enquiryAction).toHaveAttribute("data-valid", "false");
  await page.getByLabel("Your requirements").focus();
  await page.getByLabel("Your requirements").blur();
  await expect(page.locator("#enquiry-message-error")).toHaveText(
    "Please tell us what you need.",
  );
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
  await expect(enquiryAction).toHaveAttribute("data-valid", "true");
  await expect(page.locator("#enquiry-message-error")).toHaveCount(0);
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
  // Finish initial document loading before freezing the animation clock.
  await expect(page.locator("#page-refresh")).toHaveCount(0);
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
test("home navigation offer and studio booking buttons reveal ready destinations without a minimum wait", async ({
  page,
}) => {
  await openSite(page, "/");
  for (const [route, selector] of [
    ["/", ".nav-book"],
    ["/", ".home-promotion--booking a.feature-copy"],
    ["/studio/", ".studio-bottom a"],
  ]) {
    await page.goto(sitePath(route));
    await expect(
      page.getByRole("main").getByRole("heading", { level: 1 }),
    ).toHaveCount(1);
    const link = page.locator(selector);
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute("href", sitePath("/book/account/"));
    await link.click();
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
    await page.mouse.move(0, 0);
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
  await page.getByRole("button", { name: "Continue as guest" }).click();
  await expect(
    page.getByRole("heading", { name: "Your session", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".session-products")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add one player" }),
  ).toBeVisible();
  await expect(page.getByRole("note")).toHaveCount(0);
  const next = page.getByRole("link", { name: "Choose sessions" });
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
  const sessionMeta = page.locator(".session-product-meta");
  for (const line of await sessionMeta.locator(":scope > span").all()) {
    await expect(line).toHaveCSS("white-space", "nowrap");
    await expect(line).toHaveCSS("display", "block");
  }
  await expect(sessionMeta).toHaveCSS(
    "text-align",
    cardWidths.mobile ? "left" : "right",
  );
  if (!cardWidths.mobile) {
    await expect(sessionMeta.locator(":scope > span")).toHaveText([
      "40 minutes",
      "1–4 players",
      "Trainer included",
    ]);
    const outletTitle = await page
      .locator(".outlet-option strong")
      .boundingBox();
    const sessionTitle = await page
      .locator(".session-product-name")
      .boundingBox();
    expect(Math.abs(outletTitle!.x - sessionTitle!.x)).toBeLessThanOrEqual(1);
  }
  await expect(page.locator(".session-product-meta")).toHaveCSS(
    "border-left-width",
    cardWidths.mobile ? "0px" : "1px",
  );
  await expect(page.locator(".session-product-icon")).toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)",
  );
  for (const selector of [
    ".outlet-option > svg",
    ".session-product-icon svg",
  ]) {
    await expect(page.locator(selector)).toHaveCSS(
      "width",
      cardWidths.mobile ? "20px" : "24px",
    );
    await expect(page.locator(selector)).toHaveCSS(
      "height",
      cardWidths.mobile ? "20px" : "24px",
    );
  }
  await expect(page.locator(".session-product-icon svg")).toHaveCSS(
    "padding-top",
    cardWidths.mobile ? "1px" : "1.2px",
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

  if (
    await page.evaluate(
      () =>
        matchMedia("(min-width: 701px) and (hover: hover) and (pointer: fine)")
          .matches,
    )
  ) {
    const continueButton = page.locator(".actions .button");
    const slotHeight = await continueButton.evaluate(
      (element) => element.parentElement!.offsetHeight,
    );
    await continueButton.hover();
    await expect(continueButton).toHaveCSS("scale", "1.025");
    expect(
      await continueButton.evaluate(
        (element) => element.parentElement!.offsetHeight,
      ),
    ).toBe(slotHeight);
    await page.mouse.move(0, 0);
    await expect(continueButton).toHaveCSS("scale", "none");
  }
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
  if (cardWidths.mobile) {
    await expect(
      page.getByRole("combobox", { name: "Session", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".player-selection")).toHaveCount(0);
    await expect(next).toHaveCount(0);
    await page
      .getByRole("combobox", { name: "Session", exact: true })
      .selectOption({ label: "Kickoff Special" });
  } else {
    await expect(sessionChoice).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator(".player-selection")).toHaveCount(0);
    await expect(next).toHaveCount(0);
    await sessionChoice.click();
  }
  await expect(page.locator(".counter output")).toHaveText("2");
  const outletChoice = page.getByRole("button", {
    name: "Select Apex @ Henderson outlet",
    exact: true,
  });
  await outletChoice.click();
  await expect(page.locator(".session-products")).toHaveCount(0);
  if (cardWidths.mobile) {
    await page
      .getByRole("combobox", { name: "Outlet", exact: true })
      .selectOption({ label: "Apex @ Henderson" });
    await page
      .getByRole("combobox", { name: "Session", exact: true })
      .selectOption({ label: "Kickoff Special" });
  } else {
    await outletChoice.click();
    await expect(sessionChoice).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator(".player-selection")).toHaveCount(0);
    await sessionChoice.click();
  }
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
  await page.getByRole("link", { name: "Choose sessions" }).click();
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
        name: /^Enter contact details(?: \$[\d,.]+)?$/,
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
    await page.locator(".calendar-selection-context").scrollIntoViewIfNeeded();
    const cartClearance = await page
      .locator(".aside-wrap")
      .evaluate((element) => {
        const nav = document
          .querySelector(".booking-navigation")!
          .getBoundingClientRect();
        return element.getBoundingClientRect().top - nav.bottom;
      });
    expect(cartClearance).toBeGreaterThanOrEqual(15);
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
      name: /^Enter contact details(?: \$[\d,.]+)?$/,
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
  const phoneControl = page.viewportSize()!.width <= 700;
  await expect(page.locator(".email-confirm-control")).toHaveCSS(
    "width",
    phoneControl ? "56px" : "74px",
  );
  await expect(page.locator(".email-check-icon")).toHaveCSS(
    "width",
    phoneControl ? "48px" : "64px",
  );
  const navigationHeight = await page
    .locator(".booking-navigation")
    .evaluate((node) => node.getBoundingClientRect().height);
  const fieldClearance = await page
    .locator("#name")
    .evaluate((node) => parseFloat(getComputedStyle(node).scrollMarginTop));
  expect(fieldClearance).toBeGreaterThanOrEqual(navigationHeight + 16);

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
    page.getByRole("heading", { name: "Before your session", exact: true }),
  ).toBeVisible();
  const confirmationLayout = await page
    .locator(".confirmation-shell")
    .evaluate((shell) => ({
      actionsTop: shell
        .querySelector(".confirmation-actions")!
        .getBoundingClientRect().top,
      summaryBottom: shell
        .querySelector(".confirmation-card")!
        .getBoundingClientRect().bottom,
      actions: shell.querySelectorAll(".confirmation-actions .button").length,
    }));
  expect(confirmationLayout.actions).toBe(3);
  const guidancePoints = page.locator(
    ".confirmation-disclaimers .arrival-points li",
  );
  await expect(guidancePoints).toHaveCount(4);
  for (const point of await guidancePoints.all()) {
    await expect(point).toHaveCSS("display", "list-item");
    await expect(point).toHaveCSS("list-style-type", "disc");
  }
  const pointBoxes = await guidancePoints.evaluateAll((points) =>
    points.map((point) => {
      const { x, y } = point.getBoundingClientRect();
      return { x, y };
    }),
  );
  const arrivalText = await page
    .locator(".confirmation-disclaimers .arrival-time strong")
    .boundingBox();
  expect(arrivalText!.x).toBeCloseTo(pointBoxes[0].x, 0);
  await expect(
    page.locator(".confirmation-disclaimers .arrival-time"),
  ).toHaveText("Please arrive 10 minutes early.");
  expect(pointBoxes[0].y).toBeCloseTo(pointBoxes[1].y, 0);
  expect(pointBoxes[2].y).toBeCloseTo(pointBoxes[3].y, 0);
  expect(pointBoxes[1].x).toBeGreaterThan(pointBoxes[0].x);
  expect(pointBoxes[2].y).toBeGreaterThan(pointBoxes[0].y);

  expect(confirmationLayout.actionsTop).toBeGreaterThanOrEqual(
    confirmationLayout.summaryBottom,
  );
  await expect(
    page.getByRole("heading", { name: "Booking Contact", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".confirmation-card .rotation-notice")).toHaveCount(
    0,
  );
  await expect(page.locator(".confirmation-full-details summary")).toHaveCount(
    0,
  );
  await expect(
    page.locator(".confirmation-section .review-head > h2"),
  ).toHaveText(["Location", "Booking Contact", "Order Summary"]);
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
  const releaseHome = await holdHomeDecode(page);
  await dialog
    .getByRole("button", { name: "Leave booking", exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(sitePath("/") + "$"));
  await expect(page.locator(".page-loading")).toHaveCount(1);
  await releaseHome();
  await expect(page.locator("#page-refresh")).toHaveCount(0);
  await expect(page.locator(".arena-booking")).toBeVisible();
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
  await expect(page).toHaveTitle(
    "Interactive Football Experience | SOCCERBOTSTUDIO Singapore",
  );
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute(
    "content",
    "Interactive Football Experience | SOCCERBOTSTUDIO Singapore",
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    new URL(sitePath("/"), "https://soccerbotsg.com").href,
  );
  const crawlerPage = await page.request.get(sitePath("/"));
  expect(crawlerPage.ok()).toBe(true);
  const initialHead = (await crawlerPage.text()).split("</head>")[0];
  expect(initialHead).toContain(
    "<title>Interactive Football Experience | SOCCERBOTSTUDIO Singapore</title>",
  );
  expect(initialHead).toContain('property="og:title"');
  expect(initialHead).toContain('name="twitter:title"');
  const previewImage = await page.request.get(
    sitePath("/assets/soccerbot-social-preview.jpg"),
  );
  expect(previewImage.ok()).toBe(true);
  expect(previewImage.headers()["content-type"]).toContain("image/jpeg");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    "Interactive Football Experience | SOCCERBOTSTUDIO Singapore",
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
  await expect(page.locator(".page-loading")).toHaveCount(0);
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
  await expect(page.locator(".page-loading")).toHaveCount(0);
  await expect(prompt).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    ),
  ).toBeLessThanOrEqual(1);
});

/** Share presentation assertions without coupling every booking phase to one timeout. */
function bookingTypography(page: Page) {
  const brand = "rgb(5, 10, 47)";
  const width = page.viewportSize()!.width;
  const pageSize = width <= 700 ? 32 : width <= 1000 ? 24 : 28;
  async function pageHeading(name: string, color = "rgb(70, 172, 220)") {
    const heading = page
      .getByRole("main")
      .getByRole("heading", { level: 1, name, exact: true });
    await expect(heading).toBeVisible();
    const standalone = name === "Payment" || name === "Booking Confirmed";
    await expect(
      page.getByRole("main").getByRole("heading", { level: 1 }),
    ).toHaveCount(1);
    expect(
      await heading.evaluate((node) =>
        parseFloat(getComputedStyle(node).fontSize),
      ),
    ).toBeCloseTo(
      name === "Your session" &&
        page.viewportSize()!.width <= 700 &&
        page.viewportSize()!.height <= 850
        ? 28
        : standalone && width > 700
          ? 40
          : pageSize,
      5,
    );
    await expect(heading).toHaveCSS("color", color);
    await expect(heading).toHaveCSS("font-weight", "900");
    const instructions: Record<string, string> = {
      "Start your booking": "Choose how to continue.",
      "Your session": "Confirm your session and players.",
      "Select dates and times": "40-min session · 10-min changeover.",
      "Your details": "Enter your contact details.",
      "Review Booking": "Review your booking before payment.",
    };
    if (instructions[name]) {
      const calendarNote = name === "Select dates and times" && width > 700;
      const instruction = page.locator(
        calendarNote ? ".calendar-duration-note" : ".lead",
      );
      await expect(instruction).toHaveText(
        `${calendarNote ? "*" : ""}${instructions[name]}`,
      );
      await expect(instruction).toHaveCSS(
        "font-size",
        calendarNote ? "12px" : "16px",
      );
      await expect(instruction).toHaveCSS("color", "rgb(88, 97, 116)");
      await expect(instruction).toHaveCSS("font-family", /Roboto/);
      if (width > 700 && !calendarNote) {
        await expect(instruction).toBeHidden();
      } else {
        const line = await instruction.evaluate((node) => ({
          height: node.getBoundingClientRect().height,
          lineHeight: parseFloat(getComputedStyle(node).lineHeight),
          width: node.clientWidth,
          textWidth: node.scrollWidth,
        }));
        expect(line.height).toBeCloseTo(line.lineHeight, 0);
        expect(line.textWidth).toBeLessThanOrEqual(line.width);
      }
    }

    if (name === "Select dates and times" && width <= 700) {
      await expect(page.locator(".calendar-selection-context")).toHaveCSS(
        "font-size",
        "16px",
      );
      await expect(page.locator(".lead")).toHaveCSS("font-size", "16px");
      await expect(
        page.locator(".calendar-selection-context strong"),
      ).toHaveCSS("font-weight", "700");
    }
    if (width > 700 && !standalone) {
      await expect(page.locator(".booking-top h1")).toHaveText(name);
      await expect(page.locator(".booking-main h1")).toHaveCount(0);
      if (name === "Select dates and times") {
        await expect(page.locator(".calendar-context-cards > span")).toHaveText(
          ["Apex @ Henderson", "Kickoff Special"],
        );
        await expect(
          page.locator(".calendar-panel .calendar-duration-note"),
        ).toBeVisible();
        const geometry = await page.locator(".time-heading").evaluate((row) => {
          const date = row.querySelector("h2")!.getBoundingClientRect();
          const cards = row
            .querySelector(".calendar-context-cards")!
            .getBoundingClientRect();
          const calendar = document
            .querySelector(".calendar-panel")!
            .getBoundingClientRect();
          const cart = document
            .querySelector(".booking-layout > .aside-wrap")!
            .getBoundingClientRect();
          return {
            dateBottom: date.bottom,
            cardsBottom: cards.bottom,
            dateRight: date.right,
            cardsLeft: cards.left,
            calendarTop: calendar.top,
            cartTop: cart.top,
          };
        });
        expect(geometry.dateBottom).toBeCloseTo(geometry.cardsBottom, 0);
        expect(geometry.cardsLeft).toBeGreaterThan(geometry.dateRight);
        expect(geometry.calendarTop).toBeCloseTo(geometry.cartTop, 0);
      }
    } else if (!standalone) {
      await expect(page.locator(".booking-main h1")).toHaveText(name);
      await expect(page.locator(".booking-top h1")).toHaveCount(0);
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
    await expect(page.locator(".booking-flow-overlay")).toHaveCount(0);
    const compactSession =
      page.viewportSize()!.width <= 700 &&
      page.viewportSize()!.height <= 850 &&
      (await page.locator(".outlet-options").count()) > 0;
    if (await page.locator(".booking-navigation").count()) {
      await expect(page.locator(".booking-navigation")).toHaveCSS(
        "border-bottom-width",
        "0px",
      );
      await expect(page.locator(".booking-navigation")).toHaveCSS(
        "position",
        "sticky",
      );
      if (page.viewportSize()!.width > 700)
        await expect(
          page.locator(".booking-navigation .progress"),
        ).toBeVisible();
    }
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
        const natural = await action.evaluate(naturalActionBounds);
        const floating = natural.bottom > page.viewportSize()!.height;
        await expect(page.locator(".booking-action-anchor")).toHaveCSS(
          "position",
          "sticky",
        );
        await expect(primaryBar).toHaveCSS("position", "relative");
        const barBox = await primaryBar.boundingBox();
        if (floating) {
          expect(barBox!.y + barBox!.height).toBeCloseTo(
            page.viewportSize()!.height - (compactSession ? 16 : 24),
            0,
          );
        }
        const reservedBox = await page
          .locator(".booking-action-anchor")
          .boundingBox();
        expect(barBox!.x).toBeCloseTo(reservedBox!.x, 0);
        expect(barBox!.width).toBeCloseTo(reservedBox!.width, 0);
        const actionBox = await action.boundingBox();
        expect(actionBox!.height).toBeLessThanOrEqual(72);
        const redirect = primaryBar.locator(".checkout-redirect");
        if ((await redirect.count()) && page.viewportSize()!.width <= 559) {
          await expect(redirect).toBeHidden();
          const logo = action.locator(".checkout-button-logo");
          await expect(logo).toBeVisible();
          const logoBox = await logo.boundingBox();
          expect(logoBox!.x).toBeGreaterThan(
            actionBox!.x + actionBox!.width / 2,
          );
          expect(logoBox!.x + logoBox!.width).toBeLessThanOrEqual(
            actionBox!.x + actionBox!.width,
          );
          expect(barBox!.height).toBeLessThanOrEqual(72);
        } else if (await redirect.count()) {
          const logo = redirect.locator("img");
          await expect(logo).toBeVisible();
          expect(
            await logo.evaluate(
              (node) => (node as HTMLImageElement).naturalWidth,
            ),
          ).toBeGreaterThan(0);
          const hint = await redirect.boundingBox();
          const primary = await action
            .locator(".checkout-primary-line")
            .boundingBox();
          expect(hint!.y).toBeGreaterThanOrEqual(primary!.y + primary!.height);
          expect(hint!.y + hint!.height).toBeLessThanOrEqual(
            actionBox!.y + actionBox!.height,
          );
          expect(hint!.x).toBeGreaterThanOrEqual(actionBox!.x);
          expect(hint!.x + hint!.width).toBeLessThanOrEqual(
            actionBox!.x + actionBox!.width,
          );
          expect(barBox!.height).toBeLessThanOrEqual(72);
        } else expect(barBox!.height).toBeLessThanOrEqual(72);
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
        await expect(page.locator(".booking-action-anchor")).toHaveCSS(
          "position",
          "sticky",
        );
        await expect(primaryBar).toHaveCSS("position", "relative");
        const settledAnchor = await page
          .locator(".booking-action-anchor")
          .boundingBox();
        const settledBar = await primaryBar.boundingBox();
        expect(settledBar!.width).toBeCloseTo(settledAnchor!.width, 0);
        expect(settledBar!.y - settledAnchor!.y).toBeCloseTo(
          compactSession ? 24 : 32,
          0,
        );
        const footer = await page.locator(".site-footer").boundingBox();
        expect(settledBar!.y + settledBar!.height).toBeLessThanOrEqual(
          footer!.y,
        );
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
      await expect(page.locator(".booking-action-anchor")).toHaveCSS(
        "position",
        "sticky",
      );
      const anchor = await page.locator(".booking-action-anchor").boundingBox();
      const bar = await primaryBar.boundingBox();
      expect(bar!.x).toBeCloseTo(anchor!.x, 0);
      expect(bar!.width).toBeCloseTo(anchor!.width, 0);
      await page.evaluate((y) => scrollTo(0, y), previousScroll);
    }
    const scrollTop = page.getByRole("button", {
      name: "Back to top",
      exact: true,
    });
    const savedScroll = await page.evaluate(() => scrollY);
    await page.evaluate(() =>
      scrollTo(0, document.documentElement.scrollHeight),
    );
    const scrollable = await page.evaluate(
      () => document.documentElement.scrollHeight - innerHeight,
    );
    if (scrollable > 0) {
      await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
      await expect(scrollTop).toBeVisible();
      await expect(scrollTop).toHaveCount(1);
      const cueBounds = await scrollTop.boundingBox();
      expect(
        page.viewportSize()!.width - cueBounds!.x - cueBounds!.width,
      ).toBeCloseTo(20, 0);
      expect(
        await scrollTop.evaluate((circle) => {
          const action = document.querySelector(
            ".booking-primary-action > .button",
          );
          if (!action) return false;
          const cue = circle.getBoundingClientRect();
          const button = action.getBoundingClientRect();
          return (
            cue.left < button.right &&
            cue.right > button.left &&
            cue.top < button.bottom &&
            cue.bottom > button.top
          );
        }),
      ).toBe(false);
      await expect(scrollTop).toHaveCSS("border-radius", "50%");
      await expect(scrollTop).toHaveCSS("z-index", "36");
      await expect(scrollTop.locator("svg path")).toHaveCount(1);
      await expect(scrollTop.locator("svg path")).toHaveAttribute(
        "d",
        "m9 6 6 6-6 6",
      );
      await scrollTop.click();
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
      await expect(scrollTop).toHaveCount(0);
    } else {
      expect(await page.evaluate(() => scrollY)).toBe(0);
      await expect(scrollTop).toHaveCount(0);
    }
    await page.evaluate((y) => scrollTo(0, y), savedScroll);
    await expect(
      page.locator(".section-reveal, .section-reveal-pending"),
    ).toHaveCount(0);
    const actionAnchor = page.locator(".booking-action-anchor");
    if (await actionAnchor.count()) {
      const primary = actionAnchor.locator(".booking-primary-action");
      if (await page.evaluate(() => CSS.supports("overflow-anchor", "none"))) {
        await expect(primary).toHaveCSS("overflow-anchor", "none");
        await expect(actionAnchor).toHaveCSS("overflow-anchor", "none");
      }
      // Cross both floating/resting boundaries in both directions. Moving the
      // action must not pull the document into its footer or change its height.
      const geometry = await actionAnchor.evaluate((node) => ({
        top: node.previousElementSibling!.getBoundingClientRect().top + scrollY,
        bottom:
          node.previousElementSibling!.getBoundingClientRect().top +
          scrollY +
          node.getBoundingClientRect().height,
        header: document.querySelector(".site-header")!.getBoundingClientRect()
          .bottom,
        height: document.documentElement.scrollHeight,
        viewport: innerHeight,
        original: scrollY,
      }));
      const buttonPosition = await primary
        .locator(":scope > .button")
        .evaluate(naturalActionBounds);
      const naturalTop = buttonPosition.top + geometry.original;
      const stops = [
        geometry.bottom - geometry.viewport - 2,
        geometry.bottom - geometry.viewport + 2,
        naturalTop - geometry.header - 2,
        naturalTop - geometry.header + 2,
        geometry.height - geometry.viewport,
      ].map((y) =>
        Math.round(
          Math.max(0, Math.min(y, geometry.height - geometry.viewport)),
        ),
      );
      // Sample every rendered frame through the resting boundary in both
      // directions: native sticky must never teleport or change document height.
      const frames = await page.evaluate(async (centre) => {
        const values: { scroll: number; top: number; height: number }[] = [];
        const positions = Array.from(
          { length: 9 },
          (_, i) => centre - 64 + i * 16,
        );
        for (const y of [...positions, ...positions.toReversed()]) {
          scrollTo({ top: Math.max(0, y), behavior: "instant" });
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => resolve()),
          );
          values.push({
            scroll: scrollY,
            top: document
              .querySelector(".booking-primary-action")!
              .getBoundingClientRect().top,
            height: document.documentElement.scrollHeight,
          });
        }
        return values;
      }, geometry.bottom - geometry.viewport);
      for (let index = 1; index < frames.length; index++) {
        expect(frames[index].height).toBe(geometry.height);
        expect(
          Math.abs(frames[index].top - frames[index - 1].top),
        ).toBeLessThanOrEqual(
          Math.abs(frames[index].scroll - frames[index - 1].scroll) + 1,
        );
      }
      for (const target of [...stops, ...stops.toReversed()]) {
        const settled = await page.evaluate(async (y) => {
          scrollTo({ top: y, behavior: "instant" });
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          );
          return { y: scrollY, height: document.documentElement.scrollHeight };
        }, target);
        expect(Math.abs(settled.y - target)).toBeLessThanOrEqual(1);
        expect(settled.height).toBe(geometry.height);
        await expect(actionAnchor).toHaveCSS("position", "sticky");
        await expect(primary).toHaveCSS("position", "relative");
        const natural = await primary
          .locator(":scope > .button")
          .evaluate(naturalActionBounds);
        const actual = await primary.locator(":scope > .button").boundingBox();
        expect(actual!.y).toBeLessThanOrEqual(natural.top + 1);
        const footerTop = await page
          .locator(".site-footer")
          .evaluate((node) => node.getBoundingClientRect().top);
        if (footerTop < geometry.viewport) {
          await expect(actionAnchor).toHaveCSS("position", "sticky");
          const bounds = await primary.boundingBox();
          expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(footerTop);
        }
      }
      await page.evaluate(
        (y) => scrollTo({ top: y, behavior: "instant" }),
        geometry.original,
      );
      await expect(actionAnchor).toHaveCSS(
        "padding-top",
        compactSession ? "24px" : "32px",
      );
      await expect(actionAnchor).toHaveCSS(
        "padding-bottom",
        compactSession ? "16px" : "24px",
      );
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
  async function bookingDocumentBody() {
    const styles = await page
      .locator(
        ".booking-document p:not(.payment-foot), .booking-document .arrival-points li, .booking-document .series-date, .booking-document .series-date span, .booking-document .booking-facts dt, .booking-document .booking-facts dd, .booking-document .line-item, .booking-document .line-item small, .booking-document .confirmation-total strong",
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
            arrival: !!node.closest(".arrival-information"),
          };
        }),
      );
    expect(styles.length).toBeGreaterThan(0);
    expect(
      styles.filter(
        (style) =>
          style.size !==
            (style.arrival && page.viewportSize()!.width <= 700
              ? "12px"
              : style.supporting
                ? "14px"
                : style.amount || style.total
                  ? "20px"
                  : "16px") ||
          style.family !== styles[0].family ||
          !style.family.includes("Roboto"),
      ),
      "Booking body uses 16px Roboto; mobile arrival guidance uses 12px and totals use 20px",
    ).toEqual([]);
  }
  return { brand, pageHeading, sectionType, bookingDocumentBody };
}

test("header blue and typography stay consistent through account and session selection", async ({
  page,
}) => {
  const { brand, pageHeading, sectionType } = bookingTypography(page);
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
  const guest = page.getByRole("button", { name: "Continue as guest" });
  const signIn = page.getByRole("button", {
    name: "Continue with email",
    exact: true,
  });
  await expect(guest).toHaveAccessibleDescription("No account needed.");
  await expect(signIn).toHaveAccessibleDescription(
    "New or returning? We’ll email you a verification code.",
  );
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
  const divider = page.locator(".access-choice-divider");
  const dividerBox = await divider.boundingBox();
  if (page.viewportSize()!.width <= 700) {
    expect(guestBox!.x).toBeCloseTo(signInBox!.x, 0);
    expect(guestBox!.y + guestBox!.height).toBeLessThan(dividerBox!.y);
    expect(dividerBox!.y + dividerBox!.height).toBeLessThan(signInBox!.y);
    await expect(divider).toHaveCSS("text-align", "center");
  } else {
    expect(guestBox!.y).toBeCloseTo(signInBox!.y, 0);
    expect(guestBox!.x + guestBox!.width).toBeLessThan(dividerBox!.x);
    expect(dividerBox!.x + dividerBox!.width).toBeLessThan(signInBox!.x);
  }
  expect(guestBox!.width).toBeCloseTo(signInBox!.width, 0);
  const actionHeight = page.viewportSize()!.width <= 700 ? 48 : 60.4;
  for (const button of [guest, signIn]) {
    expect(
      await button.evaluate((node) =>
        parseFloat(getComputedStyle(node).height),
      ),
    ).toBeCloseTo(actionHeight, 0);
  }
  await expect(divider).toHaveCSS("font-family", /Roboto/);
  await expect(divider).toHaveCSS("font-size", "20px");
  await expect(divider).toHaveCSS("text-transform", "uppercase");
  await expect(divider).toHaveCSS("text-decoration-line", "underline");
  const dividerLines = await divider.evaluate((node) =>
    ["::before", "::after"].map(
      (pseudo) => getComputedStyle(node, pseudo).content,
    ),
  );
  expect(dividerLines).toEqual(["none", "none"]);
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
  await expect(
    page.getByRole("dialog", { name: "Kickoff Special" }),
  ).toHaveCount(0);
  await expect(page.locator(".player-selection")).toBeVisible();
});

test("calendar and contact retain typography and continuous sticky geometry", async ({
  page,
  hasTouch,
}) => {
  const { pageHeading, sectionType } = bookingTypography(page);
  await openSite(page, "/book/account/");
  await page.getByRole("button", { name: "Continue as guest" }).click();
  await expect(page.locator(".session-product")).toBeVisible();
  const selectedColour = /color\(srgb 0\.9272\d* 0\.9501\d* 0\.9576\d*\)/;
  const selectedCardBackground = await page
    .locator(".session-product")
    .evaluate((element) => getComputedStyle(element).backgroundColor);
  await page.getByRole("link", { name: "Choose sessions" }).click();
  await pageHeading("Select dates and times");
  await expect(
    page.getByRole("combobox", { name: "Calendar view" }),
  ).toHaveValue("month");
  await expect(
    page.getByRole("option", { name: "Weekly", exact: true }),
  ).toHaveCount(1);
  await expect(
    page.getByRole("option", { name: "Monthly", exact: true }),
  ).toHaveCount(1);
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
  if (page.viewportSize()!.width <= 700) {
    expect(navBox!.y - (monthBox!.y + monthBox!.height)).toBeCloseTo(8, 0);
    expect(navBox!.x + navBox!.width).toBeCloseTo(
      monthBox!.x + monthBox!.width,
      0,
    );
  } else {
    expect(monthBox!.y + monthBox!.height / 2).toBeCloseTo(
      navBox!.y + navBox!.height / 2,
      0,
    );
    expect(monthBox!.x + monthBox!.width).toBeLessThan(navBox!.x);
  }
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
  const monthFit = await page
    .locator("#calendar-month")
    .evaluate((node: HTMLSelectElement) => {
      const style = getComputedStyle(node);
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d")!;
      context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const longest = Math.max(
        ...Array.from(
          node.options,
          (option) => context.measureText(option.text).width,
        ),
      );
      return {
        required:
          longest +
          parseFloat(style.paddingLeft) +
          parseFloat(style.paddingRight),
        width: node.clientWidth,
      };
    });
  expect(monthFit.width).toBeGreaterThanOrEqual(monthFit.required);
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
      name: /^Enter contact details(?: \$[\d,.]+)?$/,
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
  await expect(page.locator("#name")).toHaveCSS(
    "font-size",
    hasTouch || page.viewportSize()!.width <= 700 ? "16px" : "14px",
  );
  await expect(page.locator("#name")).toHaveCSS("min-height", "52px");
  const phoneControl = page.viewportSize()!.width <= 700;
  await expect(page.locator(".email-confirm-control")).toHaveCSS(
    "width",
    phoneControl ? "56px" : "74px",
  );
  await expect(page.locator(".email-check-icon")).toHaveCSS(
    "width",
    phoneControl ? "48px" : "64px",
  );
  const navigationHeight = await page
    .locator(".booking-navigation")
    .evaluate((node) => node.getBoundingClientRect().height);
  const fieldClearance = await page
    .locator("#name")
    .evaluate((node) => parseFloat(getComputedStyle(node).scrollMarginTop));
  expect(fieldClearance).toBeGreaterThanOrEqual(navigationHeight + 16);
});

test("review payment and confirmation retain typography and continuous sticky geometry", async ({
  page,
}) => {
  const { brand, pageHeading, sectionType, bookingDocumentBody } =
    bookingTypography(page);
  await openSite(page, "/book/account/");
  await page.getByRole("button", { name: "Continue as guest" }).click();
  await page.getByRole("link", { name: "Choose sessions" }).click();
  await page
    .getByRole("button", {
      name: dateLabel(addDays(DEMO_TODAY, 1)),
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: /14:30–15:10/ }).click();
  await page
    .getByRole("combobox", { name: /Trainer for .* at 14:30/ })
    .selectOption({ index: 1 });
  await page
    .getByRole("link", {
      name: /^Enter contact details(?: \$[\d,.]+)?$/,
      exact: true,
    })
    .click();
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
  await expect(
    page.getByRole("heading", { name: "Booking Contact", exact: true }),
  ).toBeVisible();
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
  await expect(page.locator(".confirmation-full-details summary")).toHaveCount(
    0,
  );
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
  // The expiry boundary above remains exact; finish the new Calendar cover
  // before interacting with its cart while the clock remains controlled.
  await page.clock.runFor(1000);
  await expect(page.locator(".booking-flow-overlay")).toHaveCount(0);
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
        name: /^Enter contact details(?: \$[\d,.]+)?$/,
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
      name: /^Enter contact details(?: \$[\d,.]+)?$/,
      exact: true,
    })
    .first()
    .click();
  await details(page);
  await payment(page);
  await expect(
    page.getByRole("heading", { name: "Booking Confirmed", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Booking Contact", exact: true }),
  ).toBeVisible();
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
  await page.goto(sitePath(`/confirmation/?attempt=${attempt}&paid=true`));
  const prompt = page.getByRole("dialog", {
    name: "Get the Soccerbot360 Player App",
  });
  await expect(prompt).toHaveCount(0);
  await expect(
    page.getByRole("status", { name: "Checking payment…" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Booking Confirmed", exact: true }),
  ).toHaveCount(0);
  release();
  await expect(page).toHaveURL(sitePath("/"));
  await expect(prompt).toBeVisible();
  await expect(page.locator(".page-loading")).toHaveCount(0);
  await prompt
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Booking Confirmed", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Ask the studio to contact me" }),
  ).toHaveCount(0);
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
  await expect(location).toHaveText("");
  await expect(location.locator("svg")).toHaveCSS("width", "28px");
  await expect(location).toHaveCSS("color", "rgb(255, 255, 255)");
  const target = await location.boundingBox();
  expect(target?.height).toBe(52);
  expect(target?.width).toBe(52);
  // Padding inside the circular target must open the map, not the hero.
  await location.click({ position: { x: 26, y: 5 } });
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
  hasTouch,
}) => {
  await openSite(page, "/book/account/");
  await page.getByRole("button", { name: "Continue as guest" }).click();
  await page.getByRole("link", { name: "Choose sessions" }).click();
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
        const navigation = await page
          .locator(".booking-navigation")
          .boundingBox();
        const stickyBottom = navigation!.y + navigation!.height;
        return Math.abs(heading!.y - stickyBottom - 72);
      })
      .toBeLessThanOrEqual(1);
    const returnCue = page.getByRole("button", {
      name: "Back to top",
      exact: true,
    });
    await expect(returnCue).toBeVisible();
    await expect(returnCue).toHaveCSS("position", "fixed");
    await expect(returnCue).toHaveCSS("border-radius", "50%");
    const cueBox = await returnCue.boundingBox();
    await expect(returnCue).toHaveCount(1);
    expect(page.viewportSize()!.width - cueBox!.x - cueBox!.width).toBeCloseTo(
      20,
      0,
    );
    expect(cueBox!.y).toBeGreaterThan(page.viewportSize()!.height / 2);
    await page.clock.runFor(3000);
    await expect(returnCue).toHaveCount(0);
    await page.evaluate(() => scrollBy(0, 1));
    await expect(returnCue).toBeVisible();
    await expect(returnCue.locator("svg")).toHaveCSS("animation-name", "none");
    await expect
      .poll(async () => {
        const circle = await returnCue.boundingBox();
        const action = await page
          .locator(".booking-primary-action > .button")
          .boundingBox();
        if (!circle || !action) return false;
        return (
          circle.x + circle.width <= action.x ||
          circle.x >= action.x + action.width ||
          circle.y + circle.height + 12 <= action.y ||
          circle.y >= action.y + action.height + 12
        );
      })
      .toBe(true);
    await returnCue.click();
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    await expect(returnCue).toHaveCount(0);
    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight),
    );
    await expect(returnCue).toBeInViewport();
    await returnCue.click();
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    await expect(returnCue).toHaveCount(0);
    await page
      .getByRole("button", { name: dateLabel(date), exact: true })
      .click();
    await expect(returnCue).toBeVisible();
  }
  await page.getByRole("button", { name: /12:00–12:40/ }).click();
  await expect(
    page
      .getByRole("button", {
        name: /^Enter contact details(?: \$[\d,.]+)?$/,
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
  await expect(noon).toBeVisible();
  await expect(noon).toHaveValue(`${date}|12:00|demo|daniel`);
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
  await expect(noon).toHaveValue(`${date}|12:00|demo|daniel`);
  await expect(
    page.getByRole("button", { name: /12:00–12:40/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", {
      name: `Remove selected session ${date} at 12:00`,
      exact: true,
    })
    .click();
  await expect(noon).toHaveCount(0);
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
  const selectedAfternoon = page.getByRole("button", { name: /^15:20–16:00/ });
  await selectedAfternoon.click();
  await expect(selectedAfternoon).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByRole("combobox", { name: `Trainer for ${date} at 15:20` }),
  ).toHaveValue(`${date}|15:20|demo|daniel`);
  const removeAfternoon = page.getByRole("button", {
    name: `Remove selected session ${date} at 15:20`,
    exact: true,
  });
  await expect(removeAfternoon).toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)",
  );
  await expect(removeAfternoon).toHaveCSS("border-top-width", "0px");
  await expect(removeAfternoon).toHaveCSS("color", "rgb(0, 0, 0)");
  await expect(removeAfternoon).toHaveCSS("width", "44px");
  await expect(removeAfternoon).toHaveCSS("height", "44px");
  await expect(removeAfternoon).toHaveCSS("border-radius", "8px");
  if (!hasTouch) {
    await removeAfternoon.hover();
    await expect(removeAfternoon).toHaveCSS(
      "background-color",
      "rgb(220, 225, 241)",
    );
    await expect(removeAfternoon).toHaveCSS("width", "44px");
    await expect(removeAfternoon).toHaveCSS("height", "44px");
    await selectedAfternoon.locator(".time-range").hover();
    await expect(removeAfternoon).toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0)",
    );
  }
  const removeBounds = await removeAfternoon.boundingBox();
  const rateBounds = await selectedAfternoon
    .locator(".time-rate")
    .boundingBox();
  expect(rateBounds!.y).toBeGreaterThanOrEqual(
    removeBounds!.y + removeBounds!.height,
  );
  expect(rateBounds!.x + rateBounds!.width).toBeGreaterThan(removeBounds!.x);
  await removeAfternoon.click();
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
    await expect(
      page
        .locator(width > 700 ? ".booking-top-title" : ".booking-main")
        .getByRole("heading", { name: "Select dates and times", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".booking-top .eyebrow")).toHaveCount(0);
    const verified = page.locator(".booking-verified-status");
    if (await verified.count()) {
      await expect(verified.locator("strong")).toHaveCSS(
        "white-space",
        "nowrap",
      );
      await expect(verified.locator("span")).toHaveCSS("white-space", "nowrap");
      const fits = await verified.locator("span").evaluate((node) => {
        const range = document.createRange();
        range.selectNodeContents(node);
        return range.getBoundingClientRect().width <= node.clientWidth + 1;
      });
      expect(fits).toBe(true);
    }
    const geometry = await calendarTitle.evaluate((node) => {
      const title = node.getBoundingClientRect();
      const badge = document
        .querySelector(".booking-identity-status > span")!
        .getBoundingClientRect();
      const row = (
        window.innerWidth > 700
          ? document.querySelector(".booking-top-identity")!
          : node.parentElement!
      ).getBoundingClientRect();
      const top = document
        .querySelector(".booking-top")!
        .getBoundingClientRect();
      return {
        titleCenter: title.left + title.width / 2,
        topCenter: top.left + top.width / 2,
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
    if (width > 700)
      expect(geometry.titleCenter).toBeCloseTo(geometry.topCenter, 0);
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
    await expect(
      page
        .locator(width > 700 ? ".booking-top-title" : ".booking-main")
        .getByRole("heading", { name: "Start your booking", exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel("Booking progress")).toHaveCount(0);
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
    .getByRole("button", { name: "Continue as guest", exact: true })
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
    await expect(
      page
        .locator(".booking-main")
        .getByRole("heading", { name: "Your session", exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel("Booking progress").locator("li")).toHaveCount(
      4,
    );
    const headingBox = await sessionTitle.boundingBox();
    const badgeBox = await badge.boundingBox();
    expect(badgeBox!.x).toBeGreaterThanOrEqual(
      headingBox!.x + headingBox!.width,
    );
    expect(badgeBox!.x + badgeBox!.width).toBeLessThanOrEqual(width);
  }
  for (const viewport of [
    { width: 375, height: 740 },
    { width: 390, height: 700 },
    { width: 430, height: 780 },
  ]) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.locator(".outlet-option")).toBeInViewport({ ratio: 1 });
    await expect(page.locator(".session-product")).toBeInViewport({ ratio: 1 });
    const proceed = page.getByRole("link", { name: "Choose sessions" });
    await expect(proceed).toBeInViewport({ ratio: 1 });
    const players = await page.locator(".player-selection").boundingBox();
    const action = await proceed.boundingBox();
    expect(action!.y - players!.y - players!.height).toBeGreaterThanOrEqual(16);
    await expect(sessionTitle).toHaveCSS("font-size", "28px");
    const alignment = await page
      .locator(".session-product")
      .evaluate(async (card) => {
        await Promise.all(
          card
            .getAnimations()
            .filter(
              (animation) =>
                animation instanceof CSSAnimation &&
                animation.animationName === "booking-action-ready",
            )
            .map((animation) => animation.finished),
        );
        // Compare one settled frame, rather than different moments in the card's entrance scale.
        return {
          name: card
            .querySelector(".session-product-name")!
            .getBoundingClientRect().x,
          aligned: [
            ".session-product-details .booking-choice-label",
            ".session-product-meta",
            ".session-product-prices",
            ".player-selection",
          ].map(
            (selector) =>
              card.querySelector(selector)!.getBoundingClientRect().x,
          ),
        };
      });
    for (const x of alignment.aligned) expect(x).toBeCloseTo(alignment.name, 0);
    for (const selector of [
      ".session-product-icon svg",
      ".outlet-option > svg",
    ]) {
      await expect(page.locator(selector)).toHaveCSS("width", "20px");
      await expect(page.locator(selector)).toHaveCSS("height", "20px");
    }
  }
  const selectedFill = await page
    .locator(".outlet-option")
    .evaluate((node) => getComputedStyle(node).backgroundColor);
  await page
    .getByRole("button", { name: "Select Apex @ Henderson outlet" })
    .click();
  for (const [name, option, parent] of [
    ["Outlet", "Apex @ Henderson", ".outlet-options"],
    ["Session", "Kickoff Special", ".session-products"],
  ]) {
    const picker = page.getByRole("combobox", { name, exact: true });
    await expect(page.getByRole("heading", { name, exact: true })).toHaveCount(
      0,
    );
    await expect(picker).toHaveCSS("font-size", "16px");
    await expect(picker).toHaveCSS("border-top-left-radius", "3px");
    await expect(picker).toHaveCSS("border-top-right-radius", "12px");
    await expect(picker).toHaveCSS("border-bottom-right-radius", "3px");
    await expect(picker).toHaveCSS("border-bottom-left-radius", "12px");
    const bounds = await picker.boundingBox();
    const container = await page.locator(parent).boundingBox();
    expect(bounds!.width).toBeCloseTo(container!.width, 0);
    expect(bounds!.height).toBeGreaterThanOrEqual(54);
    if (await page.evaluate(() => matchMedia("(hover: hover)").matches)) {
      await picker.hover();
      await expect(picker).toHaveCSS("background-color", selectedFill);
      await expect(picker).toHaveCSS("border-color", "rgb(23, 96, 120)");
      const hovered = await picker.boundingBox();
      expect(hovered).toEqual(bounds);
    }
    await picker.selectOption({ label: option });
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole("link", { name: "Choose sessions" }).click();
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

test("returning home uses one ready cover without replaying the first entrance", async ({
  page,
}) => {
  await openSite(page, "/");
  await expect(page.locator("#page-refresh-content")).toHaveAttribute(
    "data-home-arrival",
    "true",
  );
  for (const destination of ["/enquiry/", "/privacy-policy/"]) {
    await page.locator(`a[href="${sitePath(destination)}"]`).click();
    await expect(page).toHaveURL(new RegExp(sitePath(destination) + "$"));
    const releaseHome = await holdHomeDecode(page);
    await page
      .getByRole("link", { name: "SOCCERBOTSTUDIO Singapore home" })
      .click();
    await expect(page.locator("#page-refresh")).toBeVisible();
    await expect(page.locator(".page-loading")).toHaveCount(1);
    await expect(page.getByText("Refreshing…", { exact: true })).toHaveCount(0);
    await releaseHome();
    await expect(page.locator("#page-refresh")).toHaveCount(0);
    await expect(page.locator(".arena-booking")).toBeVisible();
    await expect(page.locator("#page-refresh-content")).not.toHaveAttribute(
      "data-home-arrival",
    );
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
  await page.goBack();
  await expect(page).toHaveURL(new RegExp(sitePath("/privacy-policy/") + "$"));
  const releaseHistoryHome = await holdHomeDecode(page);
  await page.goForward();
  await expect(page.locator("#page-refresh")).toBeVisible();
  await releaseHistoryHome();
  await expect(page.locator("#page-refresh")).toHaveCount(0);
  await expect(page.locator(".arena-booking")).toBeVisible();
});
