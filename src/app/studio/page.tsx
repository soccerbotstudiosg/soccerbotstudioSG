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
        <div className="studio-bottom">
          <BookingLink className="button" href="/book/account/">
            <span className="studio-book-content">
              <span>Book now</span>
              <span className="studio-book-arrow" aria-hidden="true">
                <Icon name="arrow" />
              </span>
            </span>
          </BookingLink>
        </div>
      </section>
    </>
  );
}
