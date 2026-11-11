"use client";
import { BookingHeading } from "./booking-heading";
import { BookingPrimaryAction } from "./booking-primary-action";
import { BookingLoading as BrandLoading } from "./booking-loading";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { LOCATION, type CustomerCatalogue } from "@/domain/catalog";
import { Icon } from "@/components/icon";
import { MAX_PLAYERS } from "@/domain/booking-policy";
import { SERVICE_NAME } from "@/domain/demo-catalog";
import { sessionPrices } from "@/domain/session-pricing";
import { LiveCatalogue } from "./live-catalogue";
import { useBooking } from "./provider";
/** Select the live or demo session presentation. */
export function SessionStep() {
  const { bookingService, sessionChoices, setSessionChoices } = useBooking();
  const outletSelected = sessionChoices.outlet;
  const sessions = useRef<HTMLDivElement>(null);
  const scrollTarget = useRef<"session" | "action" | null>(null);
  useEffect(() => {
    const target = scrollTarget.current;
    scrollTarget.current = null;
    if (!target || window.matchMedia("(max-width: 700px)").matches) return;
    const element =
      target === "session"
        ? sessions.current
        : sessions.current?.querySelector<HTMLElement>(
            ".booking-primary-action",
          );
    element?.scrollIntoView({
      block: target === "session" ? "center" : "nearest",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }, [sessionChoices.outlet, sessionChoices.session]);
  const presentation = {
    expanded: sessionChoices.session,
    toggle: () => {
      scrollTarget.current = sessionChoices.session ? null : "action";
      setSessionChoices({ outlet: true, session: !sessionChoices.session });
    },
  };
  return (
    <>
      <BookingHeading lines={["Your", "session"]} />
      <h2 className="section-title">Choose your outlet</h2>
      <div className="outlet-options">
        <button
          className="surface outlet-option"
          aria-label={`Select ${LOCATION.building} outlet`}
          aria-pressed={outletSelected}
          aria-expanded={outletSelected}
          aria-controls="outlet-sessions"
          onClick={() => {
            scrollTarget.current = outletSelected ? null : "session";
            setSessionChoices({ outlet: !outletSelected, session: false });
          }}
        >
          <Icon name="location" />
          <span>
            <strong>{LOCATION.building}</strong>
            <span>Our flagship studio</span>
            <span>{LOCATION.street}</span>
            <span>{LOCATION.unit}</span>
          </span>
        </button>
      </div>
      <div id="outlet-sessions" ref={sessions} hidden={!outletSelected}>
        {outletSelected &&
          (bookingService.mode === "live" ? (
            <LiveCatalogue
              render={(data) => <LiveSession data={data} {...presentation} />}
            />
          ) : (
            <SessionPresentation {...presentation} />
          ))}
      </div>
    </>
  );
}
/** Resolve live catalogue data for the session selection step. */
function LiveSession({
  data,
  ...presentation
}: {
  data: CustomerCatalogue;
  expanded: boolean;
  toggle: () => void;
}) {
  const { draft, update } = useBooking();
  const eligible = data.services.filter(
    (service) =>
      service.active &&
      service.durationMinutes === 40 &&
      service.currency === "SGD" &&
      !service.recurring &&
      data.instructors.some(
        (i) =>
          i.active &&
          (service.instructorIds === null ||
            service.instructorIds.includes(i.id)),
      ),
  );
  const selected =
    eligible.find((service) => service.id === draft.nativeServiceId) ??
    (eligible.length === 1 ? eligible[0] : undefined);
  useEffect(() => {
    if (
      selected &&
      (draft.nativeServiceId !== selected.id ||
        draft.nativeServiceName !== selected.name)
    )
      update({
        nativeServiceId: selected.id,
        nativeServiceName: selected.name,
        ...(draft.nativeServiceId !== selected.id ? { slots: [] } : {}),
      });
  }, [selected, draft.nativeServiceId, draft.nativeServiceName, update]);
  if (!selected)
    return (
      <>
        <section className="surface">
          <p>
            {eligible.length
              ? "Choose your session."
              : "No sessions are currently available."}
          </p>
          {eligible.map((service) => (
            <button
              key={service.id}
              className="button"
              onClick={() =>
                update({
                  nativeServiceId: service.id,
                  nativeServiceName: service.name,
                  slots: [],
                })
              }
            >
              {service.name}
            </button>
          ))}
        </section>
      </>
    );
  return (
    <SessionPresentation
      {...presentation}
      serviceName={selected.name}
      environment={data.environment}
      pending={draft.nativeServiceId !== selected.id}
    />
  );
}
/** Render session information and player-count controls. */
function SessionPresentation({
  serviceName = SERVICE_NAME,
  environment = "developer",
  pending = false,
  expanded,
  toggle,
}: {
  expanded: boolean;
  toggle: () => void;
  serviceName?: string;
  environment?: "developer" | "production";
  pending?: boolean;
}) {
  const { draft, update } = useBooking();
  const prices = sessionPrices(environment);
  const playerSelection = (
    <section
      className="surface player-selection"
      aria-labelledby="players-label"
    >
      <span className="field-label" id="players-label">
        Players · maximum {MAX_PLAYERS}
      </span>
      <div className="counter">
        <button
          aria-label="Remove one player"
          disabled={draft.players <= 1}
          onClick={() => update({ players: draft.players - 1 })}
        >
          <Icon name="minus" />
        </button>
        <output aria-labelledby="players-label" aria-live="polite">
          {draft.players} {draft.players === 1 ? "player" : "players"}
        </output>
        <button
          aria-label="Add one player"
          disabled={draft.players >= MAX_PLAYERS}
          onClick={() => update({ players: draft.players + 1 })}
        >
          <Icon name="plus" />
        </button>
      </div>
    </section>
  );
  return (
    <>
      <h2 className="section-title">Select your session</h2>
      <div className="session-products">
        <button
          className="surface session-product"
          aria-label={`Choose ${serviceName}`}
          aria-pressed={expanded}
          aria-expanded={expanded}
          onClick={toggle}
        >
          <span className="session-product-icon">
            <Icon name="ball" />
          </span>
          <span className="session-product-details">
            <span className="session-product-name">{serviceName}</span>
            <span className="session-product-meta">
              40 minutes · 1–{MAX_PLAYERS} players
            </span>
          </span>
          <span className="session-product-prices">
            <span>
              <span>Weekdays</span> <strong>${prices.ordinary / 100}</strong>
            </span>
            <span>
              <span>Weekends/Public Holiday</span>{" "}
              <strong>${prices.premium / 100}</strong>
            </span>
          </span>
        </button>
      </div>
      {expanded && (
        <>
          {playerSelection}
          <section className="session-inclusions">
            <h2 className="section-title">Included with your session</h2>
            <ul className="inclusion-list">
              {[
                [
                  "Arena access",
                  "Access to the arena’s 360° projection wall and interactive training system.",
                ],
                [
                  "Full instructor guidance",
                  "Your instructor introduces the activities and guides your group throughout the session.",
                ],
                [
                  "Single, Team and Battle play",
                  "Explore all three play modes during your studio session.",
                ],
              ].map(([title, text]) => (
                <li key={title}>
                  <span className="inclusion-check">
                    <Icon name="check" />
                  </span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
          <BookingPrimaryAction className="actions" ready={!pending}>
            {pending ? (
              <button className="button" disabled>
                <BrandLoading overlay={false} compact label="Loading times…" />
              </button>
            ) : (
              <Link href="/book/time/" className="button">
                Choose Date & Time <Icon name="chevron" />
              </Link>
            )}
          </BookingPrimaryAction>
        </>
      )}
    </>
  );
}
