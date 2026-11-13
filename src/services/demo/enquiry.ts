import { CustomerMessageError } from "../contracts";
import { enquiryErrors } from "@/domain/enquiry";
import type { EnquiryService } from "../contracts";
export const demoEnquiryService: EnquiryService = {
  /** Simulate enquiry submission without sending an external notification. */
  async submit(value) {
    const error = Object.values(enquiryErrors(value))[0];
    if (error) throw new CustomerMessageError(error);
    return { email: value.email.trim(), delivered: false };
  },
};
