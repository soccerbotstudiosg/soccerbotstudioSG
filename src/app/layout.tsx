import type { Metadata, Viewport } from "next";
import { BookingProvider } from "@/features/booking/provider";
import { BookingNavigation } from "@/components/booking-navigation";
import { SiteShell } from "@/components/site-shell";
import { sitePath } from "@/content/site-path";
import { studioMedia } from "@/content/media";
import productionTarget from "../../deployment/production.json";
import "./globals.css";
const shareTitle = "SOCCERBOTSTUDIO Singapore | Interactive Football";
const shareDescription =
  "Experience interactive football at Apex @ Henderson. Book a 40-minute session for up to four players, with Single, Team and Battle play and instructor guidance.";
const shareImage = studioMedia[1];
export const metadata: Metadata = {
  metadataBase: new URL(productionTarget.origin),
  openGraph: {
    type: "website",
    locale: "en_SG",
    siteName: "SOCCERBOTSTUDIO Singapore",
    title: shareTitle,
    description: shareDescription,
    images: [
      {
        url: shareImage.src,
        width: shareImage.width,
        height: shareImage.height,
        alt: shareImage.alt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: shareTitle,
    description: shareDescription,
    images: [{ url: shareImage.src, alt: shareImage.alt }],
  },
  title: {
    default: "Book Now | SOCCERBOTSTUDIO Singapore",
    template: "%s | SOCCERBOTSTUDIO Singapore",
  },
  description:
    "Book the Kickoff Special: 40 minutes for up to four players, with Single, Team and Battle play and instructor guidance.",
  icons: { icon: sitePath("/favicon.svg") },
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: "#050a2f" };
/** Wrap all routes in the shared site and booking providers. */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-SG">
      <body>
        <BookingProvider>
          <BookingNavigation>
            <SiteShell>{children}</SiteShell>
          </BookingNavigation>
        </BookingProvider>
      </body>
    </html>
  );
}
