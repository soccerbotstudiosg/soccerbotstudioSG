import { publicMetadata } from "@/content/seo";
import { EnquiryPage } from "@/features/enquiry/enquiry-page";
export const metadata = publicMetadata("/enquiry/");
/** Render the customer enquiry page. */
export default function Page() {
  return <EnquiryPage />;
}
