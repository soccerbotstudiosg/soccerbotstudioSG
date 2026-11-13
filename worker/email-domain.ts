import { emailSchema } from "../src/domain/contact";
import { z } from "zod";
import { emailDnsRequest } from "./provider-transport";

const dnsResponse = z.object({
  Status: z.number().int(),
  TC: z.boolean().optional(),
  Answer: z
    .array(
      z.object({
        type: z.number().int(),
        TTL: z.number().nonnegative(),
        data: z.string().max(2048),
      }),
    )
    .max(128)
    .optional(),
});
export type EmailDomainStatus = "valid" | "invalid" | "unavailable";
/** Query a fixed resolver only. Domain checks never send the mailbox/local part. */
export async function emailDomainStatus(
  email: string,
): Promise<EmailDomainStatus> {
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return "invalid";
  const domain = parsed.data.split("@")[1];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    async function query(type: "MX" | "A" | "AAAA") {
      const response = await emailDnsRequest(domain, type, controller.signal);
      if (!response.ok) throw new Error("dns_unavailable");
      if (!response.body) throw new Error("dns_response_invalid");
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8", {
        fatal: true,
        ignoreBOM: false,
      });
      let text = "",
        size = 0;
      try {
        for (;;) {
          const part = await reader.read();
          if (part.done) break;
          size += part.value.byteLength;
          if (size > 65536) throw new Error("dns_response_invalid");
          text += decoder.decode(part.value, { stream: true });
        }
        text += decoder.decode();
      } finally {
        void reader.cancel().catch(() => {});
        reader.releaseLock();
      }
      const value = dnsResponse.parse(JSON.parse(text));
      if (value.TC || ![0, 3].includes(value.Status))
        throw new Error("dns_unavailable");
      return value;
    }
    const mx = await query("MX");
    if (mx.Status === 3) return "invalid";
    const records = mx.Answer?.filter((record) => record.type === 15) ?? [];
    // Null MX explicitly declares that the domain does not accept email.
    if (records.some((record) => /^0\s+\.$/.test(record.data)))
      return "invalid";
    if (records.some((record) => /^\d+\s+[^\s.][^\s]*\.?$/.test(record.data)))
      return "valid";
    // SMTP permits an implicit mail exchanger at the domain's address.
    const addresses = await Promise.all([query("A"), query("AAAA")]);
    return addresses.some(
      (answer) =>
        answer.Status === 0 &&
        answer.Answer?.some(
          (record) => record.type === 1 || record.type === 28,
        ),
    )
      ? "valid"
      : "invalid";
  } catch {
    return "unavailable";
  } finally {
    clearTimeout(timer);
  }
}

/** Cache only conclusive domain results; unavailable DNS is always retryable. */
export async function cachedEmailDomainStatus(
  email: string,
): Promise<EmailDomainStatus> {
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return "invalid";
  const domain = parsed.data.split("@")[1];
  const key = new Request(
    `https://email-domain.internal/${encodeURIComponent(domain)}`,
  );
  const cache = caches.default;
  const saved = await cache.match(key).catch(() => undefined);
  if (saved) {
    const status = await saved.text();
    if (status === "valid" || status === "invalid") return status;
  }
  const status = await emailDomainStatus(parsed.data);
  if (status !== "unavailable")
    await cache
      .put(
        key,
        new Response(status, { headers: { "Cache-Control": "max-age=60" } }),
      )
      .catch(() => {});
  return status;
}
