import type { Metadata, Viewport } from "next";
import { BookingProvider } from "@/features/booking/provider";
import { BookingNavigation } from "@/components/booking-navigation";
import { PageRefreshBoundary } from "@/components/page-refresh";
import { documentNavigationScript } from "@/components/document-navigation";
import { SiteShell } from "@/components/site-shell";
import { sitePath } from "@/content/site-path";
import { socialPreview } from "@/content/media";
import productionTarget from "../../deployment/production.json";
import "./globals.css";
const shareTitle = socialPreview.title;
const shareDescription = socialPreview.description;
const shareImage = socialPreview;
export const metadata: Metadata = {
  metadataBase: new URL(productionTarget.origin),
  openGraph: {
    type: "website",
    url: new URL(sitePath("/"), productionTarget.origin).href,
    locale: "en_SG",
    siteName: "SOCCERBOTSTUDIO Singapore",
    title: shareTitle,
    description: shareDescription,
    images: [
      {
        url: shareImage.src,
        type: "image/jpeg",
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
    <html lang="en-SG" suppressHydrationWarning>
      <head>
        <script>{documentNavigationScript}</script>
      </head>
      <body>
        <BookingProvider>
          <BookingNavigation>
            <PageRefreshBoundary>
              <SiteShell>{children}</SiteShell>
            </PageRefreshBoundary>
          </BookingNavigation>
        </BookingProvider>
      </body>
    </html>
  );
}
