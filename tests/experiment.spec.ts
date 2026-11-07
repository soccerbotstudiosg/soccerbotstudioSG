import { test, expect, type Page } from "@playwright/test";
import { sitePath } from "../src/content/site-path";
async function start(page: Page) {
  await page.goto(sitePath("/experiment/"));
  const prompt = page.getByRole("dialog", {
    name: "Download The Official Soccerbot360 Player App Now.",
  });
  await expect(prompt).toBeVisible();
  await prompt
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await expect(prompt).toHaveCount(0);
  await prepare(page);
  const link = page.getByRole("link", { name: "Open checkout", exact: true });
  await expect(link).toBeVisible();
  return link;
}
async function prepare(page: Page) {
  // Click completion is not server preparation completion. Arm before clicking
  // so fast responses cannot be missed; retain the normal test/action timeout
  // and the unchanged five-second UI assertions after the protected response.
  const [response] = await Promise.all([
    page.waitForResponse((r) =>
      /^\/api\/attempts\/[a-f0-9-]{36}\/checkout$/.test(
        new URL(r.url()).pathname,
      ),
    ),
    page.getByRole("button", { name: "Start synthetic checkout" }).click(),
  ]);
  expect(response.status()).toBe(200);
  const context = await response.json();
  expect(context.attemptId).toBe(
    new URL(page.url()).searchParams.get("attempt"),
  );
  expect(context.mode).toBe("synthetic");
  expect(context.checkout.state).toBe("available");
}
async function restoreContext(
  page: Page,
  attemptId: string,
  navigate: () => Promise<unknown>,
) {
  // A document load does not complete the protected context read. Bind the
  // readiness event before navigation, then retain the normal UI assertion.
  const [response] = await Promise.all([
    page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname === `/api/attempts/${attemptId}/checkout`,
    ),
    navigate(),
  ]);
  expect(response.status()).toBe(200);
  const context = await response.json();
  expect(context.attemptId).toBe(attemptId);
  expect(context.mode).toBe("synthetic");
}
async function outcome(page: Page, label: string) {
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("link", { name: /Open checkout/ }).click();
  const popup = await popupPromise;
  await expect(
    popup.getByRole("heading", { name: "Simulated checkout" }),
  ).toBeVisible();
  // Arm the protected-result listener before the synthetic write. A suspended
  // original page may resume during navigation; never miss its terminal reply.
  await Promise.all([
    page.waitForResponse(async (response) => {
      if (!response.url().endsWith("/confirmation")) return false;
      if (label === "Expire synthetic access") return response.status() === 401;
      if (response.status() !== 200) return false;
      const expected =
        label === "Simulate successful payment" ? "confirmed" : "unresolved";
      return (await response.json()).status === expected;
    }),
    (async () => {
      await popup.getByRole("button", { name: label, exact: true }).click();
      await expect(
        popup.getByRole("heading", { name: "Synthetic evidence saved" }),
      ).toBeVisible();
      await page.bringToFront();
    })(),
  ]);
  return popup;
}
test("synthetic checkout opens separately and only canonical evidence confirms the preserved attempt", async ({
  page,
}, info) => {
  const link = await start(page);
  const url = await link.getAttribute("href");
  const original = page.url();
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  await page.screenshot({
    path: info.outputPath("01-pending.png"),
    fullPage: true,
  });
  const opening = page.waitForEvent("popup");
  await link.click();
  const popup = await opening;
  await expect(
    popup.getByRole("heading", { name: "Simulated checkout" }),
  ).toBeVisible();
  expect(
    await popup.evaluate(() => ({
      opener: window.opener,
      referrer: document.referrer,
    })),
  ).toEqual({ opener: null, referrer: "" });
  await popup.screenshot({
    path: info.outputPath("02-checkout.png"),
    fullPage: true,
  });
  await popup.close();
  await page.bringToFront();
  expect(page.url()).toBe(original);
  await page.evaluate(() => {
    history.replaceState(
      null,
      "",
      location.href + "&paid=true&status=confirmed",
    );
    window.postMessage({ status: "confirmed", paid: true }, "*");
  });
  await expect(
    page.getByRole("heading", { name: "Booking Confirmed", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Open checkout again" }),
  ).toHaveAttribute("href", url!);
  await outcome(page, "Simulate successful payment");
  await expect(
    page.getByRole("heading", { name: "Booking Confirmed", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("03-confirmed.png"),
    fullPage: true,
  });
});
test("synthetic paid but invalid booking needs recovery instead of claiming success", async ({
  page,
}, info) => {
  await start(page);
  await outcome(page, "Simulate payment needing review");
  await expect(
    page.getByRole("heading", {
      name: "Payment received; booking confirmation pending",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Booking Confirmed", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText(
      "Payment received. Contact us about your booking. Do not pay again.",
    ),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("04-recovery.png"),
    fullPage: true,
  });
});
test("synthetic access revocation hides protected details and stops checking", async ({
  page,
}) => {
  await start(page);
  await outcome(page, "Expire synthetic access");
  await expect(
    page.getByRole("heading", { name: "Confirmation unavailable" }),
  ).toBeVisible();
  await expect(
    page.getByText(/Contact the studio to view this booking/),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Current booking summary" }),
  ).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Open checkout/ })).toHaveCount(
    0,
  );
});
test("reload and duplicate tabs retain one checking window with a shared server allowance", async ({
  page,
  context,
}) => {
  // The link can render before the checking effect persists its budget.
  // Arm before setup: the first confirmation request follows that save.
  const [request] = await Promise.all([
    page.waitForRequest((request) =>
      /^\/api\/attempts\/[a-f0-9-]{36}\/confirmation$/.test(
        new URL(request.url()).pathname,
      ),
    ),
    start(page),
  ]);
  const id = new URL(page.url()).searchParams.get("attempt")!;
  expect(new URL(request.url()).pathname).toBe(
    `/api/attempts/${id}/confirmation`,
  );
  const budget = await page.evaluate(
    (id) => JSON.parse(localStorage.getItem(`soccerbot-checking:${id}`)!),
    id,
  );
  expect(budget).toEqual(
    expect.objectContaining({ deadline: expect.any(Number) }),
  );
  expect(Number.isSafeInteger(budget.deadline)).toBe(true);
  await restoreContext(page, id, () => page.reload());
  await expect(
    page.getByRole("region", { name: "Current booking summary" }),
  ).toBeVisible();
  const duplicate = await context.newPage();
  await restoreContext(duplicate, id, () => duplicate.goto(page.url()));
  await expect(
    duplicate.getByRole("region", { name: "Current booking summary" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      (id) =>
        JSON.parse(localStorage.getItem(`soccerbot-checking:${id}`)!).deadline,
      id,
    ),
  ).toBe(budget.deadline);
  const responses = await Promise.all(
    [0, 1, 2].map(() =>
      context.request.get(`/api/attempts/${id}/confirmation`),
    ),
  );
  expect(
    responses.filter((r) => r.status() === 200).length,
  ).toBeLessThanOrEqual(1);
  expect(responses.every((r) => [200, 429].includes(r.status()))).toBe(true);
  for (const r of responses)
    expect(Number(r.headers()["x-checking-deadline"])).toBe(budget.deadline);
  await duplicate.close();
});
test("the Payment preview entry and temporary checking failure retain customer selections and contact", async ({
  page,
}) => {
  const { dateLabel } = await import("../src/domain/dates");
  // Keep calendar selection inside a known month, independent of the CI date.
  await page.clock.install({ time: new Date("2026-10-05T08:00:00+08:00") });
  await page.goto(sitePath("/book/account/"));
  await page
    .getByRole("dialog", {
      name: "Download The Official Soccerbot360 Player App Now.",
    })
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
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
      name: dateLabel("2026-10-06"),
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: /12:00–12:40/ }).click();
  await page
    .getByRole("combobox", { name: /Trainer for .* at 12:00/ })
    .selectOption({ index: 1 });
  await page
    .getByRole("link", { name: /^Continue(?: \$[\d,.]+)?$/, exact: true })
    .click();
  await page
    .getByLabel("Full name", { exact: false })
    .fill("Synthetic Customer");
  await page
    .getByLabel("Email address", { exact: false })
    .fill("synthetic@example.com");
  await page
    .getByLabel("Mobile number", { exact: false })
    .fill("+65 8123 4567");
  await page
    .getByRole("button", { name: /^Review booking \$[\d,.]+$/ })
    .click();
  await page.getByRole("checkbox", { name: /I’ve reviewed/ }).check();
  await page
    .getByRole("button", { name: /^Continue to payment \$[\d,.]+$/ })
    .click();
  const before = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("soccerbot-next-demo-v2")!),
  );
  // Synthetic checkout uses real server deadlines; restore wall time first.
  await page.clock.setSystemTime(new Date());
  await page
    .getByRole("link", { name: "Try separate checkout · Synthetic Preview" })
    .click();
  await page.route("**/api/attempts/*/confirmation", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: '{"error":"temporarily_unavailable"}',
    }),
  );
  await prepare(page);
  await expect(
    page.getByRole("heading", { name: "Confirmation unavailable" }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Current booking summary" }),
  ).toBeVisible();
  const after = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("soccerbot-next-demo-v2")!),
  );
  expect(after.draft).toEqual({ ...before.draft, accepted: false });
  expect(after.attempt).toEqual(before.attempt);
  expect(after.version).toBe(before.version);
});

test("checkout stays unavailable while its protected context is pending", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let reached!: () => void;
  const requested = new Promise<void>((resolve) => {
    reached = resolve;
  });
  await page.route("**/api/attempts/*/checkout", async (route) => {
    reached();
    await gate;
    await route.continue();
  });
  const starting = start(page);
  try {
    await requested;
    await expect(
      page.getByRole("status", { name: "Checking booking…", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Open checkout/ })).toHaveCount(
      0,
    );
    release();
    await starting;
    await expect(
      page.getByRole("region", { name: "Current booking summary" }),
    ).toBeVisible();
  } finally {
    release();
    await starting.catch(() => {});
  }
});

test("checkout binds its server deadline while the first confirmation response is pending", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    "**/api/attempts/*/confirmation",
    async (route) => {
      await gate;
      await route.continue();
    },
    { times: 1 },
  );
  const contextResponse = page.waitForResponse((r) =>
    /\/api\/attempts\/[^/]+\/checkout$/.test(r.url()),
  );
  const confirmationResponse = page.waitForResponse((r) =>
    /\/api\/attempts\/[^/]+\/confirmation$/.test(r.url()),
  );
  try {
    await start(page);
    const context = await (await contextResponse).json();
    const deadline = await page.evaluate(
      (id) =>
        JSON.parse(localStorage.getItem(`soccerbot-checking:${id}`)!).deadline,
      context.attemptId,
    );
    expect(deadline).toBe(context.checking.deadlineMs);
  } finally {
    release();
    await confirmationResponse;
  }
});
