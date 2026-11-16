"use client";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import Link from "next/link";
import { BookingLink } from "./booking-navigation";
import { Icon } from "./icon";

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
  const [active, setActive] = useState(false);
  useEffect(() => {
    const element = panel.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    /** Keep tall cards readable and align both heading variants against their shared column. */
    function measure() {
      const heading = element!.querySelector<HTMLElement>(".feature-heading")!;
      element!.style.setProperty(
        "--panel-height",
        `${element!.getBoundingClientRect().height}px`,
      );
      for (const variant of ["initial", "expanded"]) {
        const words = heading.querySelector<HTMLElement>(
          `.feature-title-${variant}`,
        )!;
        element!.style.setProperty(
          `--${variant}-travel`,
          `${Math.max(0, heading.clientWidth - words.offsetWidth)}px`,
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
  useEffect(() => {
    const element = panel.current;
    if (!element) return;
    let previousScroll = window.scrollY;
    /** Release the engaged style only when scrolling upward fully uncovers this card. */
    function revealAgain() {
      const current = window.scrollY;
      if (current < previousScroll) {
        const bounds = element!.getBoundingClientRect();
        const following =
          element!.nextElementSibling ??
          element!.parentElement?.nextElementSibling;
        if (
          bounds.top >= 0 &&
          (!following ||
            following.getBoundingClientRect().top >= bounds.bottom - 1)
        )
          setActive(false);
      }
      previousScroll = current;
    }
    window.addEventListener("scroll", revealAgain, { passive: true });
    return () => window.removeEventListener("scroll", revealAgain);
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
      {href && (
        <span className="feature-arrow" aria-hidden="true">
          <Icon name="chevron" />
        </span>
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
      style={{ "--stack-index": index } as CSSProperties}
      tabIndex={href ? undefined : 0}
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch") setActive(true);
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
