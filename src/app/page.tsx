import Link from "next/link";
import { Arena } from "@/components/arena";
import { BookingLink } from "@/components/booking-navigation";
import { Icon } from "@/components/icon";
import { homeMedia } from "@/content/media";
import { SessionPrice } from "@/features/booking/session-price";
/** Present the studio introduction and booking entry points. */
export default function Home() {
  return (
    <>
      <Arena />
      <section
        className="home-promotion home-promotion--studio"
        aria-labelledby="home-studio-title"
      >
        <svg
          className="promotion-edge promotion-edge--top"
          viewBox="0 0 1440 40"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M0 0H1440V23Q720 57 0 23Z" />
        </svg>
        <figure className="promotion-image">
          <img
            src={homeMedia.studio.src}
            alt={homeMedia.studio.alt}
            width={homeMedia.studio.width}
            height={homeMedia.studio.height}
            loading="lazy"
            decoding="async"
          />
        </figure>
        <div className="promotion-copy">
          <span className="promotion-eyebrow">The experience</span>
          <h2 id="home-studio-title">Inside the studio</h2>
          <p>
            Interactive projections surround the turf, bringing targets and
            football scenarios into the arena. Every session includes full
            instructor guidance for your group.
          </p>
          <BookingLink className="button promotion-cta" href="/studio/">
            Explore the studio <Icon name="arrow" />
          </BookingLink>
        </div>
        <svg
          className="promotion-edge promotion-edge--bottom"
          viewBox="0 0 1440 40"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M0 0H1440V23Q720 57 0 23Z" />
        </svg>
      </section>
      <section
        className="home-promotion home-promotion--booking"
        id="sessions"
        aria-labelledby="home-session-title"
      >
        <figure className="promotion-image">
          <img
            src={homeMedia.kickoff.src}
            alt={homeMedia.kickoff.alt}
            width={homeMedia.kickoff.width}
            height={homeMedia.kickoff.height}
            loading="lazy"
            decoding="async"
          />
        </figure>
        <div className="promotion-copy">
          <span className="promotion-eyebrow">Your next session</span>
          <h2 id="home-session-title">Kickoff Special</h2>
          <p>
            A 40-minute studio session for up to four players. Explore Single,
            Team and Battle play in the immersive arena, with an instructor
            guiding your group throughout.
          </p>
          <div className="promotion-details">
            <span>40 minutes · 1–4 players</span>
            <strong>
              <SessionPrice />
            </strong>
          </div>
          <BookingLink className="button promotion-cta" href="/book/account/">
            Book now <Icon name="arrow" />
          </BookingLink>
        </div>
      </section>
      <section
        className="home-promotion--contact abstract-promotion"
        aria-labelledby="home-contact-title"
      >
        <svg
          className="promotion-edge promotion-edge--contact-top"
          viewBox="0 0 1440 57"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M0 0H1440V57Q720 -1 0 57Z" />
        </svg>
        <div className="abstract-promotion-heading">
          <span className="promotion-eyebrow">Bring your group</span>
          <h2 id="home-contact-title">Contact us</h2>
        </div>
        <p>
          For Multi-Session Bundles, Membership, Academy, Corporate and
          Sponsorship Rates
        </p>
        <Link href="/enquiry/" className="button promotion-cta">
          Contact us <Icon name="arrow" />
        </Link>
      </section>
    </>
  );
}
