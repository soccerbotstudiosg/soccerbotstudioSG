"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";

const EnquiryNoticeContext = createContext<
  ((delivered: boolean) => void) | null
>(null);
/** Carry a submission acknowledgement to Home without persisting customer data. */
export function EnquiryNoticeProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [notice, setNotice] = useState<{ delivered: boolean } | null>(null);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 10_000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  return (
    <EnquiryNoticeContext.Provider
      value={(delivered) => {
        setNotice({ delivered });
        router.replace("/");
      }}
    >
      {notice && pathname === "/" && (
        <div className="enquiry-notice" role="status">
          {notice.delivered
            ? "Your enquiry has been sent successfully."
            : "Preview · No enquiry sent."}
        </div>
      )}
      {children}
    </EnquiryNoticeContext.Provider>
  );
}
/** Read the shared submission acknowledgement action. */
export function useEnquiryNotice() {
  const notify = useContext(EnquiryNoticeContext);
  if (!notify) throw new Error("EnquiryNoticeProvider is required");
  return notify;
}
