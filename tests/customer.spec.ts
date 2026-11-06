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
    name: "Download the official soccerbot360 app now.",
  });
  await expect(prompt).toBeVisible();
  await prompt
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await expect(prompt).toHaveCount(0);
}
async function chooseSlots(page: Page, multiple = false) {
  await openSite(page, "/book/account/");
  await page.getByRole("button", { name: "Continue as guest" }).click();
  await page
    .getByRole("button", {
      name: "Select Apex @ Henderson outlet",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", {
      name: "Choose Kickoff Special (Trial Price)",
      exact: true,
    })
    .click();
  await page.getByRole("link", { name: "See available times" }).click();
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
  await page.getByRole("link", { name: "Continue", exact: true }).click();
}
async function details(page: Page) {
  await page.getByLabel("Full name", { exact: false }).fill("Demo Customer");
  await page
    .getByLabel("Email address", { exact: false })
    .fill("customer@example.com");
  await page
    .getByLabel("Mobile number", { exact: false })
    .fill("+65 8123 4567");
  await page.getByRole("button", { name: "Review booking" }).click();
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
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await payAttempt(page, outcome);
}
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
  const studioButton = page.getByRole("link", {
    name: "The studio",
    exact: true,
  });
  const studioButtonBox = await studioButton.boundingBox();
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
  await expect(contactBanner.locator("img")).toHaveCount(0);
  await expect(contactBanner.locator(".promotion-edge")).toHaveCount(0);
  const contactBox = await contactBanner.boundingBox();
  expect(contactBox).not.toBeNull();
  expect(contactBox!.x).toBeCloseTo(0, 0);
  expect(contactBox!.width).toBeCloseTo(page.viewportSize()!.width, 0);
  await expect(
    contactBanner.getByRole("link", { name: "Contact us", exact: true }),
  ).toHaveAttribute("href", sitePath("/enquiry/"));
  await expect(
    page.getByRole("button", { name: /studio assistant/i }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "The studio", exact: true }).click();
  await expect(page.locator(".page-loading .loading-logo")).toBeVisible();
  await expect(page.locator(".page-loading")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Inside the arena." }),
  ).toBeVisible();
  const studioHero = page.locator(".studio-hero");
  await expect(studioHero.locator("video")).toBeVisible();
  await expect(studioHero.locator("video")).toHaveAttribute(
    "src",
    "https://assets.soccerbot360.com/assets/videos/stream.mp4",
  );
  await expect(studioHero.locator("video")).toHaveAttribute("controls", "");
  await expect(studioHero.locator("video")).not.toHaveAttribute("autoplay");
  await expect(studioHero.locator("figcaption")).toHaveCount(0);
  const heroBox = await studioHero.boundingBox();
  const contentBox = await page.locator(".studio-showcase").boundingBox();
  expect(heroBox).not.toBeNull();
  expect(contentBox).not.toBeNull();
  expect(heroBox!.width).toBeCloseTo(page.viewportSize()!.width, 0);
  expect(contentBox!.y - (heroBox!.y + heroBox!.height)).toBe(12);
  await expect(page.locator(".studio-row")).toHaveCount(5);
  for (const row of await page.locator(".studio-row").all()) {
    await expect(row).toHaveCSS("background-color", "rgb(245, 246, 250)");
    await expect(row).toHaveCSS("color", "rgb(16, 22, 54)");
  }
  const studioBanner = page.locator(".studio-bottom.abstract-promotion");
  await expect(studioBanner).toBeAttached();
  await expect(studioBanner.locator("img")).toHaveCount(0);
  await expect(
    studioBanner.getByRole("link", { name: "Book now", exact: true }),
  ).toHaveAttribute("href", sitePath("/book/account/"));
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    ),
  ).toBeLessThanOrEqual(1);
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
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Review booking", exact: true }),
  ).toBeVisible();
  await payment(page);
  await expect(
    page.getByRole("heading", { name: "Booking confirmed", exact: true }),
  ).toBeVisible();
  await page.getByText("View full details", { exact: true }).click();
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
    page.getByRole("heading", { name: "Booking confirmed", exact: true }),
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
  await page.getByRole("button", { name: "Check payment status" }).click();
  await expect(
    page.getByRole("heading", { name: "Processing payment", exact: true }),
  ).toBeVisible();
  await page.clock.runFor(5000);
  await expect(
    page.getByRole("heading", { name: "Booking confirmed", exact: true }),
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
  await page.getByRole("button", { name: "Review booking" }).click();
  await expect(page.locator("#name")).toBeFocused();
  await expect(page.locator("#details-form input")).toHaveCount(4);
  await expect(page.locator("#details-form select")).toHaveCount(1);
  await expect(page.locator("#details-form textarea")).toHaveCount(0);
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
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "no longer available",
  );
  await page.getByRole("link", { name: "Review selections" }).click();
  await expect(page.getByRole("button", { name: /12:50–13:30/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /12:40–13:20/ })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("button", { name: "Continue", exact: true }),
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
  await page.getByLabel("Email address").fill("customer@example.com");
  await page.getByRole("button", { name: "Continue with email" }).click();
  await expect(
    page.getByRole("heading", { name: "Verify your email", exact: true }),
  ).toBeVisible();
  // The code view mounts before the loading overlay releases page inertness.
  await expect(page.locator("main")).not.toHaveAttribute("inert");
  await page.getByLabel("Verification code").fill("000000");
  await expect(page.getByLabel("Verification code")).toHaveValue("000000");
  await page.getByRole("button", { name: "Verify and continue" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "incorrect",
  );
  await page.getByLabel("Verification code").fill("360360");
  await expect(page.getByLabel("Verification code")).toHaveValue("360360");
  await page.getByRole("button", { name: "Verify and continue" }).click();
  await expect(
    page.getByRole("heading", { name: "Your session", exact: true }),
  ).toBeVisible();
});
test("enquiry remains available without external submission or a mock assistant", async ({
  page,
}) => {
  await openSite(page, "/enquiry/");
  await page.getByLabel("Full name").fill("Demo Customer");
  await page.getByLabel("Email address").fill("demo@example.com");
  await expect(page.getByLabel("Full name")).toHaveValue("Demo Customer");
  await page.getByLabel("Contact number").fill("+65 8123 4567");
  await page.getByLabel("Enquiry type").selectOption("Corporate booking");
  await page
    .getByLabel("Your requirements")
    .fill("A group session for our team.");
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page.getByText("Preview · No enquiry sent.")).toBeVisible();
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
  await page.goto(sitePath("/"));
  await page.getByRole("link", { name: /^Book now —/ }).click();
  await expect(page).toHaveURL(/\/book\/account\/$/);
  await expect(page.locator(".pitch-entry, .page-loading")).toHaveCount(0);
});
test("oracle booking sizing and rotation disclaimers persist through checkout", async ({
  page,
}) => {
  async function fullWidth(selector: string, parent: string) {
    await expect(page.locator(selector)).toBeVisible();
    const width = await page
      .locator(selector)
      .evaluate((element) => element.getBoundingClientRect().width);
    const container = await page
      .locator(parent)
      .evaluate((element) => element.getBoundingClientRect().width);
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
  await expect(page.locator(".session-products")).toHaveCount(0);
  await page
    .getByRole("button", {
      name: "Select Apex @ Henderson outlet",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", { name: "Add one player" }),
  ).toHaveCount(0);
  const cardWidths = await page
    .locator(".session-products")
    .evaluate((grid) => ({
      grid: grid.getBoundingClientRect().width,
      card: grid.children[0].getBoundingClientRect().width,
      gap: parseFloat(getComputedStyle(grid).columnGap),
      mobile: matchMedia("(max-width: 700px)").matches,
    }));
  const expectedCardWidth = cardWidths.mobile
    ? cardWidths.grid
    : (cardWidths.grid - 2 * cardWidths.gap) / 3;
  expect(Math.abs(cardWidths.card - expectedCardWidth)).toBeLessThanOrEqual(1);
  const outletWidth = await page
    .locator(".outlet-option")
    .evaluate((element) => element.getBoundingClientRect().width);
  expect(Math.abs(outletWidth - cardWidths.card)).toBeLessThanOrEqual(1);
  await page
    .getByRole("button", {
      name: "Choose Kickoff Special (Trial Price)",
      exact: true,
    })
    .click();
  await fullWidth(".actions .button", ".actions");
  await expect(page.locator(".session-product")).toContainText("40 minutes");
  await expect(page.locator(".session-product")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator(".session-product-prices")).toContainText(
    "Weekdays",
  );
  const selectedCardWidth = await page
    .locator(".session-product")
    .evaluate((element) => element.getBoundingClientRect().width);
  expect(Math.abs(selectedCardWidth - expectedCardWidth)).toBeLessThanOrEqual(
    1,
  );
  const playerWidth = await page
    .locator(".player-selection")
    .evaluate((element) => {
      const style = getComputedStyle(element);
      return (
        element.clientWidth -
        parseFloat(style.paddingLeft) -
        parseFloat(style.paddingRight)
      );
    });
  const counterWidth = await page
    .locator(".counter")
    .evaluate((element) => element.getBoundingClientRect().width);
  expect(Math.abs(playerWidth - counterWidth)).toBeLessThanOrEqual(1);
  await page.getByRole("button", { name: "Add one player" }).click();
  await expect(page.locator(".counter output")).toHaveText("2 players");
  const sessionCard = page.getByRole("button", {
    name: "Choose Kickoff Special (Trial Price)",
    exact: true,
  });
  await sessionCard.click();
  await expect(sessionCard).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".player-selection")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "See available times" }),
  ).toHaveCount(0);
  await sessionCard.click();
  await expect(page.locator(".counter output")).toHaveText("2 players");
  const outletCard = page.getByRole("button", {
    name: "Select Apex @ Henderson outlet",
    exact: true,
  });
  await outletCard.click();
  await expect(outletCard).toHaveAttribute("aria-pressed", "false");
  await expect(sessionCard).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "See available times" }),
  ).toHaveCount(0);
  await outletCard.click();
  await expect(sessionCard).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".player-selection")).toHaveCount(0);
  await sessionCard.click();
  await expect(page.locator(".counter output")).toHaveText("2 players");
  const productFontSize = await page
    .locator(".session-product-name")
    .evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
  expect(productFontSize).toBeCloseTo(20, 5);
  for (const name of [
    "Choose your outlet",
    "Select your session",
    "Included with your session",
  ]) {
    await expect(page.getByRole("heading", { name, exact: true })).toHaveCSS(
      "font-style",
      "normal",
    );
  }
  await page.getByRole("link", { name: "See available times" }).click();
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
  const crossing = page.getByRole("button", { name: /14:30–15:10/ });
  await expect(crossing).toContainText("Crosses the 15:00 instructor rotation");
  await crossing.click();
  await page
    .getByRole("combobox", { name: /Trainer for .* at 14:30/ })
    .selectOption({ index: 1 });
  await expect(page.getByRole("radio")).toHaveCount(0);
  await page.getByRole("button", { name: /15:20–16:00/ }).click();
  await page
    .getByRole("combobox", { name: /Trainer for .* at 15:20/ })
    .selectOption({ index: 1 });
  const instructors = page.getByRole("region", { name: "Your instructors" });
  await expect(instructors.getByRole("article")).toHaveCount(2);
  await expect(
    instructors.getByRole("article", { name: "Faisal Shahril", exact: true }),
  ).toBeVisible();
  await expect(
    instructors.getByRole("article", { name: "Daniel Tan", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Continue", exact: true }),
  ).toBeVisible();
  const positions = await page.locator(".aside-wrap").evaluate((element) => ({
    continueBottom: element
      .querySelector(".basket-continue")!
      .getBoundingClientRect().bottom,
    instructorsTop: element
      .querySelector(".booking-instructors")!
      .getBoundingClientRect().top,
  }));
  expect(positions.instructorsTop).toBeGreaterThanOrEqual(
    positions.continueBottom,
  );
  await expect(page.locator(".summary .rotation-notice")).toContainText(
    "stays for the full session",
  );
  await page.getByRole("link", { name: "Continue", exact: true }).click();
  await fullWidth(".actions .button", ".actions");
  await expect(page.locator("#name")).toHaveCSS("min-height", "52px");
  await details(page);
  await fullWidth(".actions .button", ".actions");
  await expect(page.locator(".series-list .rotation-notice")).toContainText(
    "Crosses the 15:00 instructor rotation",
  );
  await payment(page);
  await expect(
    page.getByRole("heading", { name: "Booking confirmed", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".confirmation-full-details")).not.toHaveAttribute(
    "open",
    "",
  );
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
  await page.getByText("View full details", { exact: true }).click();
  await expect(
    page.locator(".confirmation-card .rotation-notice"),
  ).toContainText("stays for the full session");
  await expect(page.locator("main details[open]")).toHaveCount(1);
  await expect(page.locator(".confirmation-section > h2")).toHaveText([
    "Client Details",
    "Location",
    "Disclaimers",
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
    "Your selections are saved in this browser. Complete payment before checkout expires.",
  );
  await expect(dialog.locator(".dialog-actions button")).toHaveText([
    "Back to home",
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
  await page
    .getByRole("link", { name: "SOCCERBOTSTUDIO Singapore home" })
    .click();
  await dialog
    .getByRole("button", { name: "Back to home", exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(sitePath("/") + "$"));
});
test("first visit offers the Player App with only store links and dismissal persists", async ({
  page,
}) => {
  await page.goto(sitePath("/"));
  const prompt = page.getByRole("dialog", {
    name: "Download the official soccerbot360 app now.",
  });
  await expect(prompt).toBeVisible();
  await expect(prompt.locator("p")).toHaveCount(0);
  await expect(prompt.getByRole("link")).toHaveCount(3);
  for (const [name, href] of [
    [
      "App Store",
      "https://apps.apple.com/us/app/soccerbot-player-app/id6751052041",
    ],
    [
      "Google Play",
      "https://play.google.com/store/apps/details?id=com.umbrella.soccerbot.playerapp&hl=en&pli=1",
    ],
    ["Web App", "https://app.soccerbot360.com/login"],
  ])
    await expect(
      prompt.getByRole("link", { name, exact: true }),
    ).toHaveAttribute("href", href);
  await expect(
    prompt.getByRole("button", { name: "Not now", exact: true }),
  ).toHaveCount(0);
  const close = prompt.getByRole("button", {
    name: "Close dialog",
    exact: true,
  });
  await expect(close).toHaveCSS("border-top-width", "0px");
  await expect(close).toHaveCSS("color", "rgb(255, 255, 255)");
  await close.click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Your next session starts here." }),
  ).toBeVisible();
  await expect(prompt).toHaveCount(0);
  await expect(page.locator(".nav-download")).toHaveCount(0);
  await page.getByRole("link", { name: "The studio", exact: true }).click();
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
  async function pageHeading(name: string, color = "rgb(23, 96, 120)") {
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
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
    ).toBeLessThanOrEqual(1);
  }
  async function sectionType(selector: string) {
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
      expect(style.size).toBeCloseTo(20, 5);
      expect(style.weight).toBe("700");
      expect(style.style).toBe("normal");
      expect(style.color).toBe(brand);
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
  await sectionType(".access-option h2");
  const guest = page.getByRole("button", { name: "Continue as guest" });
  // Inspect the resting action, with the pointer away from the button.
  await page.mouse.move(0, 0);
  await expect(guest).toHaveCSS("background-color", brand);
  await expect(guest).toHaveCSS("text-transform", "none");
  await expect(guest).toHaveCSS("font-size", "16px");
  await guest.click();
  await pageHeading("Your session");
  await page
    .getByRole("button", {
      name: "Select Apex @ Henderson outlet",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", {
      name: "Choose Kickoff Special (Trial Price)",
      exact: true,
    })
    .click();
  await sectionType(".session-product-name, .session-inclusions h2");
  const selectedCardBackground = await page
    .locator('.session-product[aria-pressed="true"]')
    .evaluate((element) => getComputedStyle(element).backgroundColor);
  await expect(
    page.getByRole("dialog", { name: "Kickoff Special (Trial Price)" }),
  ).toHaveCount(0);
  await expect(page.locator(".player-selection")).toBeVisible();
  await page.getByRole("link", { name: "See available times" }).click();
  await pageHeading("Select dates and times");
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
  await crossing.click();
  await page
    .getByRole("combobox", { name: /Trainer for .* at 14:30/ })
    .selectOption({ index: 1 });
  await expect(crossing).toHaveCSS("background-color", selectedCardBackground);
  await expect(crossing.locator(".time-instructor")).toHaveCSS(
    "font-size",
    "14px",
  );
  await expect(crossing.locator(".rotation-notice")).toHaveCSS(
    "font-size",
    "14px",
  );
  await expect(page.locator(".trainer-heading")).toHaveCSS(
    "background-color",
    brand,
  );
  await expect(page.locator(".trainer-bio")).toHaveCSS("font-size", "14px");
  await expect(page.locator(".trainer-identity h3")).toHaveCSS(
    "font-size",
    "18px",
  );
  await page.getByRole("link", { name: "Continue", exact: true }).click();
  await pageHeading("Your details");
  await sectionType("#details-form h2");
  await expect(page.locator("label[for='name']")).toHaveCSS(
    "font-size",
    "14px",
  );
  await expect(page.locator("#name")).toHaveCSS("font-size", "16px");
  await expect(page.locator("#name")).toHaveCSS("min-height", "52px");
  async function bookingDocumentBody() {
    const styles = await page
      .locator(
        ".booking-document p, .booking-document .series-date, .booking-document .series-date span, .booking-document .booking-facts dt, .booking-document .booking-facts dd, .booking-document .line-item, .booking-document .line-item small, .booking-document .paid strong",
      )
      .evaluateAll((nodes) =>
        nodes.map((node) => {
          const style = getComputedStyle(node);
          return {
            size: style.fontSize,
            family: style.fontFamily,
            element: node.outerHTML,
            total: node.matches(".line-item.total"),
          };
        }),
      );
    expect(styles.length).toBeGreaterThan(0);
    expect(
      styles.filter(
        (style) =>
          style.size !== (style.total ? "20px" : "16px") ||
          style.family !== styles[0].family ||
          !style.family.includes("Roboto"),
      ),
      "Booking body uses 16px Roboto; total labels use the approved 20px role",
    ).toEqual([]);
  }
  await details(page);
  await pageHeading("Review booking");
  await bookingDocumentBody();
  const reviewTotal = page.locator(".booking-document .line-item.total strong");
  await expect(reviewTotal).toHaveCSS("font-size", "24px");
  await expect(reviewTotal).toHaveCSS("font-family", /Roboto/);
  await sectionType(".review-head h2, .review-block > h2");
  await expect(page.locator(".booking-facts")).toHaveCSS("font-size", "16px");
  for (const label of await page.locator(".client-details dt").all()) {
    await expect(label).toHaveCSS("color", "rgb(88, 97, 116)");
    await expect(label).toHaveCSS("font-weight", "400");
  }
  for (const value of await page.locator(".client-details dd").all()) {
    await expect(value).toHaveCSS("color", "rgb(16, 22, 54)");
    await expect(value).toHaveCSS("font-size", "16px");
    await expect(value).toHaveCSS("font-weight", "700");
  }

  for (const date of await page
    .locator(".review-block .series-date > strong")
    .all()) {
    await expect(date).toHaveCSS("font-weight", "500");
  }
  for (const detail of await page
    .locator(
      ".review-block .series-date > span:first-of-type, .review-block .session-instructor",
    )
    .all()) {
    await expect(detail).toHaveCSS("color", "rgb(88, 97, 116)");
    await expect(detail).toHaveCSS("font-weight", "400");
  }
  await expect(page.locator(".review-block .rotation-notice")).toHaveCSS(
    "color",
    "rgb(118, 83, 13)",
  );
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await pageHeading("Payment");
  await sectionType(".payment-layout .section-title");
  await expect(page.locator(".method.selected")).toHaveCSS(
    "border-top-color",
    brand,
  );
  await payAttempt(page);
  // H1s share the approved teal accent; the site header retains navy.
  await pageHeading("Booking confirmed", "rgb(23, 96, 120)");
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
  await page.getByText("View full details", { exact: true }).click();
  await sectionType(
    ".confirmation-section > h2, .confirmation-summary > .section-title",
  );
  await bookingDocumentBody();
  await expect(page.locator(".confirmation-summary")).toHaveCSS(
    "text-align",
    "left",
  );
  await expect(page.locator(".confirmation-details-grid")).toHaveCSS(
    "text-align",
    "left",
  );
  await expect(
    page.locator(".confirmation-summary .series-list li").first(),
  ).toHaveCSS("flex-direction", "row");
  const facts = page.locator(".confirmation-details-grid .booking-facts");
  const labelBox = await facts.locator("dt").first().boundingBox();
  const valueBox = await facts.locator("dd").first().boundingBox();
  expect(labelBox).not.toBeNull();
  expect(valueBox).not.toBeNull();
  if (page.viewportSize()!.width <= 700) {
    expect(valueBox!.x).toBeCloseTo(labelBox!.x, 0);
    expect(valueBox!.y).toBeGreaterThan(labelBox!.y);
  } else {
    expect(valueBox!.x).toBeGreaterThan(labelBox!.x);
    expect(valueBox!.y).toBeCloseTo(labelBox!.y, 0);
  }
  await expect(page.locator(".confirmation-card .paid strong")).toHaveCSS(
    "font-size",
    "16px",
  );
  await expect(page.locator(".confirmation-card .paid strong")).toHaveCSS(
    "color",
    brand,
  );
  await expect(page.locator("main details[open]")).toHaveCount(1);
});

test("elapsed selections block checkout on an open page and remain removable before a future multi-session payment", async ({
  page,
}) => {
  await chooseSlots(page);
  await details(page);
  await page.clock.pauseAt(new Date("2026-10-06T11:59:59.999+08:00"));
  await expect(
    page.getByRole("button", { name: "Continue to payment" }),
  ).toBeEnabled();
  await page.clock.runFor(1);
  await expect(
    page.getByRole("heading", { name: "Select dates and times" }),
  ).toBeVisible();
  const basket = page.getByRole("complementary", {
    name: "Your booking summary",
  });
  await expect(
    basket.getByText("Session has started — remove to continue."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue", exact: true }),
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
  await page
    .getByRole("button", { name: "Remove 2026-10-06 at 12:00" })
    .click();
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
  await page.getByRole("link", { name: "Continue", exact: true }).click();
  await details(page);
  await payment(page);
  await expect(
    page.getByRole("heading", { name: "Booking confirmed", exact: true }),
  ).toBeVisible();
  await page.getByText("View full details", { exact: true }).click();
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
    page.getByRole("heading", { name: "Booking confirmed", exact: true }),
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
    page.getByRole("heading", { name: "Booking confirmed", exact: true }),
  ).toHaveCount(0);
  release();
  await expect(
    page.getByRole("heading", { name: "Booking confirmed", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Booking confirmed. Try loading your details again.",
  );
  await expect(
    page.getByRole("button", { name: "Load booking details", exact: true }),
  ).toBeVisible();
  await page.unroute(`**/api/attempts/${attempt}/confirmation`);
  await page.route(`**/api/attempts/${attempt}/confirmation`, (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: '{"error":"access_denied"}',
    }),
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Confirmation unavailable" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Booking confirmed", exact: true }),
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
  await expect(location.locator("small")).toHaveCSS("font-size", "14px");
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
  await page.getByRole("button", { name: "Continue as guest" }).click();
  await page
    .getByRole("button", {
      name: "Select Apex @ Henderson outlet",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", {
      name: "Choose Kickoff Special (Trial Price)",
      exact: true,
    })
    .click();
  await page.getByRole("link", { name: "See available times" }).click();
  const date = addDays(DEMO_TODAY, 1);
  await page
    .getByRole("button", { name: dateLabel(date), exact: true })
    .click();
  await page.getByRole("button", { name: /12:00–12:40/ }).click();
  await expect(
    page.getByRole("button", { name: "Continue", exact: true }),
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
  await noon.selectOption(`${date}|12:00|demo|daniel`);
  await page.getByRole("button", { name: /15:20–16:00/ }).click();
  await page
    .getByRole("combobox", { name: `Trainer for ${date} at 15:20` })
    .selectOption(`${date}|15:20|demo|daniel`);
  const cards = page.getByRole("region", { name: "Your instructors" });
  await expect(cards.getByRole("article")).toHaveCount(1);
  await expect(
    cards.getByRole("article", { name: "Daniel Tan", exact: true }),
  ).toContainText("Demonstration profile. Guides players through ball control");
  await expect(cards.getByRole("listitem")).toHaveCount(0);
  await noon.selectOption(`${date}|12:00|demo|faisal`);
  await expect(cards.getByRole("article")).toHaveCount(2);
  await expect(
    cards.getByRole("article", { name: "Faisal Shahril", exact: true }),
  ).toContainText("A football player, trainer and coach");
  await expect(
    cards.getByRole("article", { name: "Daniel Tan", exact: true }),
  ).toContainText("Demonstration profile. Guides players through ball control");
  await page.reload();
  await expect(noon).toHaveValue(`${date}|12:00|demo|faisal`);
  await expect(
    page.getByRole("combobox", { name: `Trainer for ${date} at 15:20` }),
  ).toHaveValue(`${date}|15:20|demo|daniel`);
  await expect(cards.getByRole("article")).toHaveCount(2);
  await page.getByRole("button", { name: /15:20–16:00/ }).click();
  await expect(cards.getByRole("article")).toHaveCount(1);
  await expect(
    cards.getByRole("article", { name: "Faisal Shahril", exact: true }),
  ).toContainText("A football player, trainer and coach");
  await expect(cards.getByRole("listitem")).toHaveCount(0);
});
