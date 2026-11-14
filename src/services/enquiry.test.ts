import { expect, test, vi } from "vitest";
import { enquiryErrors } from "@/domain/enquiry";
import { demoEnquiryService } from "@/services/demo/enquiry";
import { todaySG } from "@/domain/dates";
const valid = {
  name: "John Doe",
  email: "john@example.com",
  phone: "+6581234567",
  organisation: "International Sports School",
  purpose: "Corporate booking",
  guests: "12",
  date: todaySG(),
  time: "14:30",
  message: "Hello, team!\nCan we book (12 people)?",
};
test("enquiry fields and submission share strict validation without rejecting ordinary prose", async () => {
  expect(enquiryErrors(valid)).toEqual({});
  await expect(demoEnquiryService.submit(valid)).resolves.toEqual({
    email: valid.email,
    delivered: false,
  });
  for (const patch of [
    { name: "John★" },
    { name: "a".repeat(81) },
    { email: "bad@email" },
    { phone: "+6561234567" },
    { organisation: "School★" },
    { organisation: "a".repeat(121) },
    { purpose: "constructor" },
    { guests: "1.5" },
    { guests: "0" },
    { guests: "1000" },
    { date: "2000-01-01" },
    { date: "2099-02-30" },
    { time: "25:10" },
    { message: "" },
    { message: "a".repeat(2001) },
    { message: "Text\u200bHidden" },
  ]) {
    const input = { ...valid, ...patch };
    expect(Object.keys(enquiryErrors(input))).toContain(Object.keys(patch)[0]);
    await expect(demoEnquiryService.submit(input)).rejects.toThrow();
  }
});

test("live enquiries require proof and acknowledgement while retaining the retry key", async () => {
  const { liveEnquiryService } = await import("./enquiry");
  const request = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", request);
  const proof = {
    key: "7d176e59-1f67-4911-b466-b1e56e3a970b",
    botToken: "test-proof",
  };
  try {
    await expect(liveEnquiryService.submit(valid)).rejects.toThrow(
      /security check/,
    );
    expect(request).not.toHaveBeenCalled();
    request.mockResolvedValueOnce(
      new Response(JSON.stringify({ status: "pending" }), { status: 200 }),
    );
    await expect(liveEnquiryService.submit(valid, proof)).rejects.toThrow(
      /acknowledgement/,
    );
    request.mockResolvedValueOnce(
      new Response(JSON.stringify({ status: "sent" }), { status: 200 }),
    );
    await expect(liveEnquiryService.submit(valid, proof)).resolves.toEqual({
      email: valid.email,
      delivered: true,
    });
    expect(request).toHaveBeenCalledTimes(2);
    for (const [url, init] of request.mock.calls) {
      expect(url).toBe("/api/enquiry");
      expect(JSON.parse(String(init?.body))).toEqual({
        values: valid,
        ...proof,
      });
      expect(init?.credentials).toBe("same-origin");
    }
    request.mockResolvedValueOnce(new Response("{}", { status: 503 }));
    await expect(liveEnquiryService.submit(valid, proof)).rejects.toThrow();
    expect(request).toHaveBeenCalledTimes(3);
  } finally {
    vi.unstubAllGlobals();
  }
});
