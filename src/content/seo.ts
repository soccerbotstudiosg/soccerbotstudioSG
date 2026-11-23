import type { Metadata } from "next";
import productionTarget from "../../deployment/production.json";
import { OPENING_MINUTE, CLOSING_MINUTE } from "@/domain/booking-policy";
import { clock, openingTime } from "@/domain/dates";
import { CONTACT, LOCATION } from "@/domain/catalog";
import { logo, socialPreview } from "./media";
import { siteBasePath } from "./site-path";

// Only the live production build may advertise public pages to search engines.
export const publicIndexing =
  process.env.RELEASE_TARGET === "production" &&
  process.env.NEXT_PUBLIC_BOOKING_MODE === "live" &&
  siteBasePath === "";
const openingWindow = `${openingTime(OPENING_MINUTE)}–${openingTime(CLOSING_MINUTE)}`;
export const publicPages = {
  "/": {
    title: socialPreview.title,
    description: socialPreview.description,
  },
  "/studio/": {
    title: "Media Pitch Studio at Henderson | SoccerBotStudio Singapore",
    description: `Explore our SoccerBot360 media pitch studio at Apex @ Henderson, Singapore. Performance, interactive football experiences and production. Open daily, ${openingWindow}.`,
  },
  "/enquiry/": {
    title: "Contact SoccerBotStudio Singapore",
    description: `Contact SoccerBotStudio Singapore for session enquiries, group visits, events and production bookings. Find us at Apex @ Henderson, daily from ${openingWindow}.`,
  },
  "/terms-of-service/": {
    title: "Terms and Conditions | SoccerBotStudio Singapore",
    description:
      "Read SoccerBotStudio Singapore’s terms and conditions, including booking, payment, cancellation and studio participation policies.",
  },
  "/privacy-policy/": {
    title: "Privacy Policy | SoccerBotStudio Singapore",
    description:
      "Learn how SoccerBotStudio Singapore collects, uses and protects personal information, and how to contact us about your privacy.",
  },
} as const;
/** Build an absolute canonical on the production domain, without tracking parameters. */
export function canonicalUrl(path: string) {
  return new URL(path, productionTarget.origin).href;
}
/** Resolve shared public artwork on production without the demo deployment prefix. */
export function productionAssetUrl(path: string) {
  const assetPath =
    siteBasePath && path.startsWith(`${siteBasePath}/`)
      ? path.slice(siteBasePath.length)
      : path;
  return canonicalUrl(assetPath);
}
/** Give each public page its own search and social identity. */
export function publicMetadata(path: keyof typeof publicPages): Metadata {
  const { title, description } = publicPages[path];
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: canonicalUrl(path) },
    robots: { index: publicIndexing, follow: publicIndexing },
    openGraph: {
      type: "website",
      locale: "en_SG",
      siteName: "SoccerBotStudio Singapore",
      title,
      description,
      url: canonicalUrl(path),
      images: [
        {
          url: productionAssetUrl(socialPreview.src),
          width: socialPreview.width,
          height: socialPreview.height,
          alt: socialPreview.alt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        { url: productionAssetUrl(socialPreview.src), alt: socialPreview.alt },
      ],
    },
  };
}
// Owner-confirmed public business information; no prices, reviews or inferred map identity.
export const studioStructuredData = {
  "@context": "https://schema.org",
  "@type": "SportsActivityLocation",
  "@id": canonicalUrl("/#studio"),
  name: "SoccerBotStudio Singapore",
  url: canonicalUrl("/"),
  description: publicPages["/"].description,
  slogan: "Performance • Experience • Production",
  logo: productionAssetUrl(logo),
  image: productionAssetUrl(socialPreview.src),
  telephone: CONTACT.phone,
  email: CONTACT.email,
  sameAs: [CONTACT.instagram],
  address: {
    "@type": "PostalAddress",
    streetAddress: `${LOCATION.street}, ${LOCATION.unit}, ${LOCATION.building}`,
    addressLocality: "Singapore",
    postalCode: LOCATION.postal.replace("Singapore ", ""),
    addressCountry: "SG",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
        "PublicHolidays",
      ],
      opens: clock(OPENING_MINUTE),
      closes: clock(CLOSING_MINUTE),
    },
  ],
};
