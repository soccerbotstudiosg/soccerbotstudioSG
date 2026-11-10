import { describe, expect, it } from "vitest";
import { sessionRate } from "./session-pricing";
import { blankDraft, totalCents } from "./booking";
import { publicCalendarSchema, nativeCalendarSchema } from "./native-checkout";

describe("Singapore session pricing", () => {
  it("bounds calendar day month and UTF-8 payload sizes without truncating offers", () => {
    const offer = {
      serviceId: "3",
      serviceName: "Session",
      instructorId: "2",
      instructorName: "Trainer",
      startMs: Date.parse("2026-11-10T12:00:00+08:00"),
      priceMinor: 10800,
      currency: "SGD",
    };
    const day = (count: number) => ({
      date: "2026-11-10",
      observedAtMs: 1,
      offers: Array.from({ length: count }, () => ({ ...offer })),
    });
    const calendar = (dates: ReturnType<typeof day>[]) => ({
      month: "2026-11",
      observedAtMs: 1,
      dates,
    });
    expect(nativeCalendarSchema.safeParse(calendar([day(180)])).success).toBe(
      true,
    );
    expect(nativeCalendarSchema.safeParse(calendar([day(2001)])).success).toBe(
      false,
    );
    expect(
      nativeCalendarSchema.safeParse(
        calendar([day(2000), day(2000), day(2000), day(1)]),
      ).success,
    ).toBe(false);
    const large = day(1000);
    for (const value of large.offers) {
      value.serviceName = "球".repeat(256);
      value.instructorName = "员".repeat(256);
    }
    expect(nativeCalendarSchema.safeParse(calendar([large])).success).toBe(
      false,
    );
  });
  it("charges weekdays at 88 and weekends and gazetted substitute holidays at 108", () => {
    for (const date of ["2026-10-14", "2026-11-10", "2027-02-09"])
      expect(sessionRate(date)?.priceMinor).toBe(8800);
    for (const date of [
      "2026-10-17",
      "2026-10-18",
      "2026-11-08",
      "2026-11-09",
      "2026-06-01",
      "2026-08-10",
      "2027-01-01",
      "2027-02-08",
      "2027-10-28",
    ])
      expect(sessionRate(date)?.priceMinor).toBe(10800);
    expect(sessionRate("2026-10-17")?.holiday).toBe(false);
    expect(sessionRate("2026-11-09")?.holiday).toBe(true);
    expect(sessionRate("2028-01-03")).toBeNull();
    expect(sessionRate("2026-02-30")).toBeNull();
  });
  it("totals a mixed demo cart by date and preserves native quote amounts", () => {
    const draft = blankDraft();
    draft.slots = [
      { date: "2026-10-16", start: "09:00", instructor: "faisal" },
      { date: "2026-10-17", start: "09:00", instructor: "faisal" },
    ];
    expect(totalCents(draft)).toBe(19600);
    draft.slots[0].native = {
      serviceId: "2",
      serviceName: "Session",
      instructorName: "Faisal",
      priceMinor: 9000,
      currency: "SGD",
    };
    expect(totalCents(draft)).toBe(19800);
  });
  it("keeps client rates separate from staging and preserves client quotes in the cart", () => {
    for (const date of ["2026-11-10", "2027-02-09"])
      expect(sessionRate(date, "production")?.priceMinor).toBe(10800);
    for (const date of ["2026-11-21", "2026-11-22", "2026-11-09", "2027-02-08"])
      expect(sessionRate(date, "production")?.priceMinor).toBe(12800);
    expect(sessionRate("2026-11-09", "production")?.holiday).toBe(true);
    expect(sessionRate("2028-01-03", "production")).toBeNull();
    expect(sessionRate("2026-02-30", "production")).toBeNull();
    expect(sessionRate("2026-11-10", "developer")?.priceMinor).toBe(8800);
    expect(sessionRate("2026-11-21", "developer")?.priceMinor).toBe(10800);
    const draft = blankDraft();
    draft.slots = [
      {
        date: "2026-11-10",
        start: "12:00",
        instructor: "2",
        native: {
          serviceId: "3",
          serviceName: "Session",
          instructorName: "Faisal",
          priceMinor: 10800,
          currency: "SGD",
        },
      },
      {
        date: "2026-11-21",
        start: "12:00",
        instructor: "3",
        native: {
          serviceId: "4",
          serviceName: "Session",
          instructorName: "Nabil",
          priceMinor: 12800,
          currency: "SGD",
        },
      },
    ];
    expect(totalCents(draft)).toBe(23600);
  });
  it("accepts priced public slots and rejects foreign dates, services, duplicate trainer offers and private fields", () => {
    const offer = {
      serviceId: "3",
      productServiceId: "2",
      serviceName: "Session",
      instructorId: "3",
      instructorName: "Nabil",
      startMs: Date.parse("2026-10-17T09:00:00+08:00"),
      priceMinor: 10800,
      currency: "SGD",
    };
    const value = {
      month: "2026-10",
      serviceId: "2",
      observedAtMs: 1,
      dates: [{ date: "2026-10-17", available: true, offers: [offer] }],
    };
    expect(publicCalendarSchema.safeParse(value).success).toBe(true);
    const monthCoverage = [
      {
        month: "2026-10",
        state: "available",
        observedAtMs: 1,
        displayExpiresAtMs: 1800001,
      },
      {
        month: "2026-11",
        state: "empty",
        observedAtMs: 1,
        displayExpiresAtMs: 1800001,
      },
      { month: "2026-12", state: "unknown" },
    ];
    expect(
      publicCalendarSchema.safeParse({ ...value, monthCoverage }).success,
    ).toBe(true);
    for (const invalid of [
      [...monthCoverage, { month: "2027-01", state: "unknown" }],
      [monthCoverage[0], monthCoverage[0]],
      [{ ...monthCoverage[2], displayExpiresAtMs: 10 }],
      [{ month: "2026-10", state: "empty" }],
      [{ ...monthCoverage[0], displayExpiresAtMs: 1800002 }],
      [{ ...monthCoverage[0], displayExpiresAtMs: 1 }],
      [{ ...monthCoverage[0], privateClient: "forbidden" }],
    ])
      expect(
        publicCalendarSchema.safeParse({ ...value, monthCoverage: invalid })
          .success,
      ).toBe(false);

    expect(
      publicCalendarSchema.safeParse({
        ...value,
        dates: [
          {
            ...value.dates[0],
            offers: [
              offer,
              { ...offer, instructorId: "4", instructorName: "Other trainer" },
            ],
          },
        ],
      }).success,
    ).toBe(true);
    for (const patch of [
      { productServiceId: "4" },
      { startMs: offer.startMs + 86400000 },
      { clientId: "private" },
    ])
      expect(
        publicCalendarSchema.safeParse({
          ...value,
          dates: [{ ...value.dates[0], offers: [{ ...offer, ...patch }] }],
        }).success,
      ).toBe(false);
    expect(
      publicCalendarSchema.safeParse({
        ...value,
        dates: [{ ...value.dates[0], offers: [offer, offer] }],
      }).success,
    ).toBe(false);
    expect(
      publicCalendarSchema.safeParse({
        ...value,
        dates: [{ ...value.dates[0], available: false }],
      }).success,
    ).toBe(false);
  });
});
