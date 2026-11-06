import { BookingLink } from "@/components/booking-navigation";
import { studioHero, studioMedia } from "@/content/media";
import { Icon } from "@/components/icon";
export const metadata = { title: "The studio" };
/** Present the studio facilities using the approved media catalogue. */
export default function Studio() {
  return (
    <>
      <figure className="studio-hero">
        <video
          src={studioHero.src}
          poster={studioHero.poster}
          controls
          playsInline
          preload="none"
          aria-label="SOCCERBOT360 studio demonstration"
        />
      </figure>
      <section className="studio-showcase" aria-labelledby="studio-title">
        <h1 className="sr-only" id="studio-title">
          SOCCERBOTSTUDIO Singapore
        </h1>
        <p className="studio-signature">
          Performance · Experience · Production
        </p>
        {studioMedia.map((photo, index) => (
          <section
            key={photo.src}
            className={`studio-row${index % 2 ? " reverse" : ""}`}
            aria-labelledby={`studio-section-${index + 1}`}
          >
            <div className="studio-copy">
              <h2 id={`studio-section-${index + 1}`}>{photo.title}</h2>
              <p className="studio-description">{photo.description}</p>
            </div>
            <figure
              className="studio-photo"
              style={{ "--photo-zoom": photo.zoom || 1 } as React.CSSProperties}
            >
              <img
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                loading="lazy"
                decoding="async"
              />
            </figure>
          </section>
        ))}
        <section
          className="studio-bottom abstract-promotion"
          aria-labelledby="studio-book-title"
        >
          <div className="abstract-promotion-heading">
            <span className="promotion-eyebrow">Step into the arena</span>
            <h2 id="studio-book-title">Your move.</h2>
          </div>
          <p>
            Single, Team and Battle play, with full instructor guidance for your
            group.
          </p>
          <BookingLink className="button promotion-cta" href="/book/account/">
            Book now <Icon name="chevron" />
          </BookingLink>
        </section>
      </section>
    </>
  );
}
