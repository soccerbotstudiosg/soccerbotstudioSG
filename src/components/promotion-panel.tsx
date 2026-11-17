"use client";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import Link from "next/link";
import { BookingLink } from "./booking-navigation";

const mobileQuery = "(max-width: 700px)";
/** Keep mobile detail disclosure synchronized with the responsive layout. */
function subscribeMobile(notify: () => void) {
  const media = window.matchMedia(mobileQuery);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
}
const mobileSnapshot = () => window.matchMedia(mobileQuery).matches;

type Props = {
  id: string;
  className: string;
  index: number;
  eyebrow: string;
  title: readonly [string, string];
  activeTitle: readonly [string, string];
  teaser: string;
  description: string;
  photo: {
    src: string;
    alt: string;
    width: number;
    height: number;
    zoom?: number;
  };
  href?: string;
  actionLabel?: string;
  children?: ReactNode;
};

/** Reveal optional detail without changing card geometry or inventing informational destinations. */
export function PromotionPanel({
  id,
  className,
  index,
  eyebrow,
  title,
  activeTitle,
  teaser,
  description,
  photo,
  href,
  actionLabel,
  children,
}: Props) {
  const panel = useRef<HTMLElement>(null);
  const [engaged, setActive] = useState(false);
  const mobile = useSyncExternalStore(
    subscribeMobile,
    mobileSnapshot,
    () => false,
  );
  const active = mobile || engaged;
  useEffect(() => {
    const element = panel.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    /** Keep tall cards readable and align both heading variants against their shared column. */
    function measure() {
      const heading = element!.querySelector<HTMLElement>(".feature-heading")!;
      for (const variant of ["initial", "expanded"]) {
        const words = heading.querySelector<HTMLElement>(
          `.feature-title-${variant}`,
        )!;
        element!.style.setProperty(
          `--${variant}-travel`,
          `${Math.max(0, heading.clientWidth - (parseFloat(getComputedStyle(heading).paddingRight) || 0) - words.offsetWidth)}px`,
        );
      }
    }
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    observer.observe(element.querySelector(".feature-heading")!);
    for (const words of element.querySelectorAll(".feature-heading > span"))
      observer.observe(words);
    measure();
    return () => observer.disconnect();
  }, []);
  const content = (
    <div className="promotion-copy-content">
      <span className="promotion-eyebrow">{eyebrow}</span>
      <h2 id={id} className="feature-heading" aria-label={title.join(" ")}>
        <span className="feature-title-initial" aria-hidden="true">
          {title[0]}
          <span>{title[1]}</span>
        </span>
        <span className="feature-title-expanded" aria-hidden="true">
          {activeTitle[0]}
          <span>{activeTitle[1]}</span>
        </span>
        {href && (
          <span className="feature-arrow" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path className="feature-corner" d="M5 19V5h14" />
              <path className="feature-chevron" d="m8 5 7 7-7 7" />
            </svg>
          </span>
        )}
      </h2>
      <p className="feature-description">
        <span className="feature-teaser" aria-hidden={active}>
          {teaser}
        </span>
        <span className="feature-full" aria-hidden={!active}>
          {description}
        </span>
      </p>
      {children}
      {!href && (
        <svg
          className="feature-circuits"
          viewBox="0 0 100 70"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="50"
            cy="35"
            r="28"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="72 10 20 10"
          />
          <circle
            cx="50"
            cy="35"
            r="20"
            stroke="currentColor"
            strokeWidth="1"
          />
          <circle
            cx="50"
            cy="35"
            r="9"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="18 6"
          />
          <path d="M3 35h17m60 0h17M50 1v10m0 48v10" stroke="currentColor" />
          <circle cx="22" cy="35" r="3" fill="currentColor" />
          <circle cx="78" cy="35" r="3" fill="currentColor" />
        </svg>
      )}
    </div>
  );
  const copyClass = `${className.includes("studio-row") ? "studio-copy" : "promotion-copy"} feature-copy`;
  return (
    <section
      ref={panel}
      className={`${className} interactive-promotion`}
      aria-labelledby={id}
      data-active={active ? "true" : "false"}
      tabIndex={href ? undefined : 0}
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch") setActive(true);
      }}
      onPointerLeave={() => setActive(false)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setActive(false);
      }}
      onPointerDown={(event) => {
        if (event.pointerType === "touch") setActive(true);
      }}
      onFocus={() => setActive(true)}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setActive(false);
          event.currentTarget.querySelector<HTMLElement>(":focus")?.blur();
          event.currentTarget.blur();
        }
      }}
    >
      {index === 0 && (
        <svg
          className="promotion-edge promotion-edge--top"
          viewBox="0 0 1440 40"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M0 0H1440V23Q720 57 0 23Z" />
        </svg>
      )}
      {photo && (
        <figure
          className={
            className.includes("studio-row")
              ? "studio-photo"
              : "promotion-image"
          }
          style={{ "--photo-zoom": photo.zoom || 1 } as CSSProperties}
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
      )}
      {href ? (
        href === "/enquiry/" ? (
          <Link href={href} className={copyClass} aria-label={actionLabel}>
            {content}
          </Link>
        ) : (
          <BookingLink
            href={href}
            className={copyClass}
            aria-label={actionLabel}
          >
            {content}
          </BookingLink>
        )
      ) : (
        <div className={copyClass}>{content}</div>
      )}
    </section>
  );
}

/** Keep the compact closing banner one accessible destination with three centred groups. */
export function PromotionBanner({
  id,
  className,
  eyebrow,
  title,
  description,
  href,
  actionLabel,
}: {
  id: string;
  className: string;
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  actionLabel: string;
}) {
  const content = (
    <>
      <div className="abstract-promotion-heading">
        <span className="promotion-eyebrow">{eyebrow}</span>
        <h2 id={id}>{title}</h2>
      </div>
      <p>{description}</p>
      <span className="abstract-promotion-action">
        {actionLabel}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path d="M5 19 19 5M5 5h14v14" />
        </svg>
      </span>
    </>
  );
  return (
    <section className={`${className} abstract-promotion`} aria-labelledby={id}>
      {href === "/enquiry/" ? (
        <Link
          href={href}
          className="abstract-promotion-link"
          aria-label={actionLabel}
        >
          {content}
        </Link>
      ) : (
        <BookingLink
          href={href}
          className="abstract-promotion-link"
          aria-label={actionLabel}
        >
          {content}
        </BookingLink>
      )}
    </section>
  );
}
