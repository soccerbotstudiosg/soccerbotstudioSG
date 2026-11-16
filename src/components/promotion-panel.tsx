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
  photo?: {
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
      className={`${className} interactive-promotion${photo ? "" : " promotion-banner"}`}
      aria-labelledby={id}
      data-active={active ? "true" : "false"}
      style={{ "--stack-index": index } as CSSProperties}
      tabIndex={href ? undefined : 0}
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch") setActive(true);
      }}
      onPointerLeave={(event) => {
        if (!event.currentTarget.contains(document.activeElement))
          setActive(false);
      }}
      onPointerDown={(event) => {
        if (event.pointerType === "touch") setActive(true);
      }}
      onFocus={() => setActive(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setActive(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setActive(false);
          event.currentTarget.querySelector<HTMLElement>(":focus")?.blur();
          event.currentTarget.blur();
        }
      }}
    >
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
