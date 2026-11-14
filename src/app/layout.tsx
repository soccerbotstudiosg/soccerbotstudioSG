import type { Metadata, Viewport } from "next";
import { BookingProvider } from "@/features/booking/provider";
import { BookingNavigation } from "@/components/booking-navigation";
import { SiteShell } from "@/components/site-shell";
import { sitePath } from "@/content/site-path";
import { socialPreview } from "@/content/media";
import productionTarget from "../../deployment/production.json";
import "./globals.css";
const shareTitle =
  "SOCCERBOTSTUDIO Singapore | Interactive Football Experience";
const shareDescription =
  "Discover immersive football games and interactive training at SOCCERBOTSTUDIO Singapore. Play, compete and sharpen your skills in a 360° football arena.";
const shareImage = socialPreview;
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
  description: shareDescription,
  icons: {
    icon: {
      url: sitePath("/favicon.svg"),
      type: "image/svg+xml",
      sizes: "any",
    },
  },
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
