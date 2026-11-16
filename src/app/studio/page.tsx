import { studioMedia } from "@/content/media";
import { StudioHeroVideo } from "@/components/studio-hero-video";
import { PromotionPanel, PromotionBanner } from "@/components/promotion-panel";
export const metadata = { title: "The studio" };
/** Present informational studio cards followed by one full-banner booking destination. */
export default function Studio() {
  return (
    <>
      <div className="studio-intro">
        <p className="studio-signature">
          Performance · Experience · Production
        </p>
        <figure className="studio-hero">
          <StudioHeroVideo />
        </figure>
      </div>
      <section
        className="studio-showcase promotion-stack"
        aria-labelledby="studio-title"
      >
        <h1 className="sr-only" id="studio-title">
          SOCCERBOTSTUDIO Singapore
        </h1>
        {studioMedia.map((photo, index) => (
          <PromotionPanel
            key={photo.src}
            id={`studio-section-${index + 1}`}
            className={`studio-row${index % 2 ? " reverse" : ""}`}
            index={index}
            eyebrow={photo.eyebrow}
            title={photo.titleLines}
            activeTitle={photo.activeTitle}
            teaser={photo.teaser}
            description={photo.description}
            photo={photo}
          />
        ))}
      </section>
      <PromotionBanner
        id="studio-book-title"
        className="studio-bottom"
        eyebrow="Step into the arena"
        title="Your move."
        description="Single, Team and Battle play, with full instructor guidance for your group."
        href="/book/account/"
        actionLabel="Book now"
      />
    </>
  );
}
