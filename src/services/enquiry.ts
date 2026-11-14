import { enquiryErrors } from "@/domain/enquiry";
import { CustomerMessageError, type EnquiryService } from "./contracts";

export const liveEnquiryService: EnquiryService = {
  mode: "live",
  /** Send one idempotent enquiry without reporting success before acknowledgement. */
  async submit(values, proof) {
    const invalid = Object.values(enquiryErrors(values))[0];
    if (invalid) throw new CustomerMessageError(invalid);
    if (!proof?.key || !proof.botToken)
      throw new CustomerMessageError(
        "Please complete the security check and try again.",
      );
    const controller = new AbortController();
    const deadline = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch("/api/enquiry", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        redirect: "error",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ values, ...proof }),
        signal: controller.signal,
      });
      if (response.status === 429)
        throw new CustomerMessageError(
          "Please wait a few minutes before sending another enquiry.",
        );
      if (!response.ok) throw new Error("Enquiry unavailable");
      const result: unknown = await response.json();
      if (
        !result ||
        typeof result !== "object" ||
        !("status" in result) ||
        result.status !== "sent"
      )
        throw new Error("Enquiry acknowledgement unavailable");
      return { email: values.email.trim(), delivered: true };
    } finally {
      clearTimeout(deadline);
    }
  },
};
