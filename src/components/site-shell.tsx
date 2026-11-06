"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ADDRESS, BOOKING_SUPPORT, CONTACT, LOCATION } from "@/domain/catalog";
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
  const [dialog, setDialog] = useState<"leave" | null>(null);
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
  function home(event: React.MouseEvent<HTMLAnchorElement>) {
    if (
      pathname.startsWith("/book/") &&
      booking.draft.mode &&
      booking.attempt?.status !== "paid"
    ) {
      event.preventDefault();
      setDialog("leave");
    }
  }
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
            onClick={home}
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
        {children}
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
                  <strong>Services</strong>
                </h2>
                <div className="footer-contact-detail footer-direct-links">
                  <BookingLink href="/book/account/">Book</BookingLink>
                  <BookingLink href="/studio/">Studio</BookingLink>
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
                  <strong>Connect With Us</strong>
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
                  <strong>Find Us</strong>
                </h2>
                <div className="footer-contact-detail footer-direct-links">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Flagship Studio:
                    <br />
                    {LOCATION.building}
                    <br />
                    {LOCATION.street}, {LOCATION.unit}
                    <br />
                    {LOCATION.postal}
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
                  <strong>Download App</strong>
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
            Your selections are saved in this browser. Complete payment before
            checkout expires.
          </p>
          <div className="dialog-actions">
            <button
              className="button secondary"
              onClick={() => {
                setDialog(null);
                router.push("/");
              }}
            >
              Back to home
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
