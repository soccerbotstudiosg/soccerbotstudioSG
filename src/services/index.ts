// Build-time composition only. No URL, browser storage or failed request can select Preview.
import { liveBookingService } from "./booking";
import { liveCustomerIdentity } from "./identity";
import { demoCustomerIdentity } from "./demo/identity";
import { demoBookingService } from "./demo/booking";
import { demoIdentityService } from "./demo/identity";
import { liveEnquiryService } from "./enquiry";
import { demoEnquiryService } from "./demo/enquiry";
const mode = process.env.NEXT_PUBLIC_BOOKING_MODE ?? "demo";
if (mode !== "demo" && mode !== "live")
  throw new Error("Unsupported booking mode");
export const services = {
  booking: mode === "live" ? liveBookingService : demoBookingService,
  identity: demoIdentityService,
  customerIdentity:
    mode === "live" ? liveCustomerIdentity : demoCustomerIdentity,
  enquiry: mode === "live" ? liveEnquiryService : demoEnquiryService,
};
