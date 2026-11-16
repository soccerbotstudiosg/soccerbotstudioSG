import { sitePath } from "@/content/site-path";
import { Arena } from "@/components/arena";
import { PromotionPanel } from "@/components/promotion-panel";
import { homeMedia, socialPreview } from "@/content/media";
import { SessionPrice } from "@/features/booking/session-price";
export const metadata = {
  title: { absolute: socialPreview.title },
  description: socialPreview.description,
  alternates: { canonical: sitePath("/") },
};
/** Present compact introductions that reveal detail before following existing destinations. */
export default function Home() {
  return (
    <>
      <Arena />
      <div className="promotion-stack">
        <PromotionPanel
          id="home-studio-title"
          className="home-promotion home-promotion--studio"
          index={0}
          eyebrow="The experience"
          title={["Inside the", "studio"]}
          activeTitle={["Step inside", "360°"]}
          teaser="Football. Immersed in 360°."
          description="Interactive projections surround the turf, bringing targets and football scenarios into the arena. Every session includes full instructor guidance for your group."
          photo={homeMedia.studio}
          href="/studio/"
          actionLabel="Explore the studio"
        />
        <PromotionPanel
          id="home-session-title"
          className="home-promotion home-promotion--booking"
          index={1}
          eyebrow="Your next session"
          title={["Kickoff", "Special"]}
          activeTitle={["Ready for", "kickoff?"]}
          teaser="Your game. A whole new dimension."
          description="A 40-minute studio session for up to four players. Explore Single, Team and Battle play in the immersive arena, with an instructor guiding your group throughout."
          photo={homeMedia.kickoff}
          href="/book/account/"
          actionLabel="Book now"
        >
          <div className="promotion-details">
            <span>40 minutes · 1–4 players</span>
            <strong>
              <SessionPrice />
            </strong>
          </div>
        </PromotionPanel>
        <PromotionPanel
          id="home-contact-title"
          className="home-promotion--contact abstract-promotion"
          index={2}
          eyebrow="Start a conversation"
          title={["Contact", "us"]}
          activeTitle={["Tell us", "your plans."]}
          teaser="An idea, an event, a question."
          description="Have a question, an event in mind or a partnership to discuss? Tell us what you’re planning."
          href="/enquiry/"
          actionLabel="Contact us"
        />
      </div>
    </>
  );
}
