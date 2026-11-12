"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ADDRESS, BOOKING_SUPPORT, CONTACT, LOCATION } from "@/domain/catalog";
import { siteBasePath, sitePath } from "@/content/site-path";
import { darkLogo, logo, singaporeFlag } from "@/content/media";
import { useBooking } from "@/features/booking/provider";
import { Dialog } from "./dialog";
import { BookingLink } from "./booking-navigation";
import { PlayerAppLinks } from "./player-app-links";
import { PlayerAppPrompt } from "./player-app-prompt";
import { BackToTop, SectionReveals } from "./section-reveals";
import { Icon } from "./icon";
/** Render shared navigation, footer and customer support controls. */
export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname(),
    router = useRouter(),
    booking = useBooking();
  const [dialog, setDialog] = useState<{
    href: string;
    local: boolean;
    newTab: boolean;
  } | null>(null);
  const [leavingFrom, setLeavingFrom] = useState<string | null>(null);
  if (leavingFrom && pathname !== leavingFrom) setLeavingFrom(null);
  useEffect(() => {
    const header = document.querySelector(".site-header");
    if (!header) return;
    const root = document.documentElement;
    const previous = root.style.scrollPaddingTop;
    const previousHeight = root.style.getPropertyValue("--site-header-height");
    function measureHeader() {
      const height = header!.getBoundingClientRect().height;
      root.style.scrollPaddingTop = `${height + 16}px`;
      root.style.setProperty("--site-header-height", `${height}px`);
    }
    measureHeader();
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(measureHeader);
    observer?.observe(header);
    return () => {
      observer?.disconnect();
      root.style.scrollPaddingTop = previous;
      if (previousHeight)
        root.style.setProperty("--site-header-height", previousHeight);
      else root.style.removeProperty("--site-header-height");
    };
  }, []);
  useEffect(() => {
    if (!pathname.startsWith("/book/") || booking.attempt?.status === "paid")
      return;
    /** Confirm site-link departures before Link or booking-entry handlers run. */
    function leaveLink(event: MouseEvent) {
      if (event.button > 1 || event.defaultPrevented) return;
      const link =
        event.target instanceof Element
          ? event.target.closest("a[href]")
          : null;
      if (!(link instanceof HTMLAnchorElement)) return;
      const url = new URL(link.href);
      const local =
        url.origin === window.location.origin &&
        url.pathname.startsWith(sitePath("/"));
      const sameDocument =
        url.origin === window.location.origin &&
        url.pathname === window.location.pathname &&
        url.search === window.location.search &&
        !!url.hash;
      // Step navigation and explicit payment/recovery continuations retain
      // their attempt; footer Book is an intentional fresh-flow departure.
      if (
        sameDocument ||
        link.hasAttribute("data-booking-continuation") ||
        (!link.closest(".site-footer") &&
          local &&
          (url.pathname.startsWith(sitePath("/book/")) ||
            url.pathname === sitePath("/confirmation/")))
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      setDialog({
        href: link.href,
        local,
        newTab:
          link.target === "_blank" ||
          event.button === 1 ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey,
      });
    }
    document.addEventListener("click", leaveLink, true);
    document.addEventListener("auxclick", leaveLink, true);
    return () => {
      document.removeEventListener("click", leaveLink, true);
      document.removeEventListener("auxclick", leaveLink, true);
    };
  }, [pathname, booking.attempt?.status]);
  return (
    <>
      <a
        href="#main"
        className="fixed -top-20 left-4 z-50 rounded bg-white p-4 text-ink focus:top-3"
      >
        Skip to content
      </a>
      <header className="site-header">
        <nav className="nav" aria-label="Main navigation">
          <Link
            href="/"
            className="brand"
            aria-label="SOCCERBOTSTUDIO Singapore home"
          >
            <img
              src={logo}
              alt="SOCCERBOTSTUDIO Singapore"
              width={565}
              height={190}
              className="official-logo"
            />
          </Link>
          <div className="nav-links" hidden={pathname.startsWith("/book/")}>
            <img
              className="nav-flag"
              src={singaporeFlag}
              alt="Singapore"
              width={25.2}
              height={16.8}
            />
            <BookingLink
              href="/studio/"
              className="nav-studio"
              aria-current={pathname === "/studio/" ? "page" : undefined}
            >
              The studio
            </BookingLink>
            <BookingLink href="/book/account/" className="nav-book">
              Book now
            </BookingLink>
          </div>
        </nav>
      </header>
      <main id="main" tabIndex={-1}>
        {leavingFrom === pathname ? null : children}
      </main>
      <footer className="site-footer">
        <div className="footer-contact-band">
          <div className="footer-contact-grid">
            <section
              className="footer-contact-row"
              aria-labelledby="footer-service-title"
            >
              <div className="footer-contact-copy">
                <h2
                  className="footer-contact-heading"
                  id="footer-service-title"
                >
                  Services
                </h2>
                <div className="footer-contact-detail footer-direct-links">
                  <Link href="/terms-of-service/">Terms of Service</Link>
                  <Link href="/privacy-policy/">Privacy Policy</Link>
                  <Link href="/refund-policy/">Refund Policy</Link>
                </div>
              </div>
            </section>
            <section
              className="footer-contact-row footer-direct-contact"
              aria-labelledby="footer-help-title"
            >
              <div className="footer-contact-copy">
                <h2 className="footer-contact-heading" id="footer-help-title">
                  Connect With Us
                </h2>
                <div className="footer-contact-detail footer-direct-links">
                  <a
                    className="footer-contact-link"
                    href={BOOKING_SUPPORT.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`WhatsApp: ${CONTACT.phoneDisplay}`}
                  >
                    <Icon name="whatsapp" />
                    <span>{CONTACT.phoneDisplay}</span>
                  </a>
                  <a
                    className="footer-contact-link"
                    href={`mailto:${CONTACT.email}`}
                    aria-label={`Email: ${CONTACT.email}`}
                  >
                    <Icon name="mail" />
                    <span>{CONTACT.email}</span>
                  </a>
                  <a
                    className="footer-contact-link"
                    href={CONTACT.instagram}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram: @soccerbotstudiosg"
                  >
                    <Icon name="instagram" />
                    <span>@soccerbotstudiosg</span>
                  </a>
                </div>
              </div>
            </section>
            <section
              className="footer-contact-row"
              aria-labelledby="footer-location-title"
            >
              <div className="footer-contact-copy">
                <h2
                  className="footer-contact-heading"
                  id="footer-location-title"
                >
                  Find Us
                </h2>
                <div className="footer-contact-detail footer-direct-links">
                  <a
                    className="footer-address"
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>Flagship Studio:</span>
                    <span>{LOCATION.building}</span>
                    <span>
                      {LOCATION.street}, {LOCATION.unit}
                    </span>
                    <span>{LOCATION.postal}</span>
                  </a>
                </div>
              </div>
            </section>
            <section
              className="footer-contact-row footer-apps"
              aria-labelledby="footer-apps-title"
            >
              <div className="footer-contact-copy">
                <h2 className="footer-contact-heading" id="footer-apps-title">
                  Soccerbot360 Player App:
                </h2>
                <PlayerAppLinks compact />
                <div className="footer-brand">
                  <img
                    src={darkLogo}
                    alt="SOCCERBOTSTUDIO Singapore"
                    width={565}
                    height={190}
                    className="footer-logo"
                    loading="lazy"
                  />
                </div>
              </div>
            </section>
          </div>
        </div>
        <div className="footer-inner">
          <span>© 2026 SOCCERBOTSTUDIO Singapore. All rights reserved.</span>
        </div>
      </footer>
      <SectionReveals />
      <BackToTop />
      <PlayerAppPrompt />
      {dialog && (
        <Dialog title="Leave this booking?" onClose={() => setDialog(null)}>
          <p className="mb-5 text-muted">
            Your selections and changes will not be saved.
          </p>
          {(booking.attempt || booking.action.status === "loading") && (
            <p className="mb-5 text-muted">
              Leaving does not cancel a reservation or payment. Any unpaid
              reservation remains held until expiry; payment recovery is
              retained.
            </p>
          )}
          <div className="dialog-actions">
            <button
              className="button secondary"
              onClick={() => {
                const destination = new URL(dialog.href);
                const route = dialog.local
                  ? destination.pathname.slice(siteBasePath.length) +
                    destination.search +
                    destination.hash
                  : null;
                // Unmount the departing guard before clearing prerequisites.
                // New-tab/app links leave the original tab safely on Home.
                setLeavingFrom(
                  route === pathname && !dialog.newTab ? null : pathname,
                );
                if (dialog.newTab)
                  window.open(dialog.href, "_blank", "noopener,noreferrer");
                booking.leave();
                setDialog(null);
                if (dialog.newTab) router.push("/");
                else if (route) router.push(route);
                else {
                  if (!["http:", "https:"].includes(destination.protocol))
                    router.push("/");
                  window.location.assign(dialog.href);
                }
              }}
            >
              Leave booking
            </button>
            <button className="button" onClick={() => setDialog(null)}>
              Stay
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}
