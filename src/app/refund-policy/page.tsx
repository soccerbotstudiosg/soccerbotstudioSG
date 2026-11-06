import type { Metadata } from "next";
export const metadata: Metadata = { title: "Refund Policy" };
/** Reserve the approved legal route with an intentionally empty white body. */
export default function Page() {
  return <div className="legal-placeholder" aria-label="Refund Policy" />;
}
