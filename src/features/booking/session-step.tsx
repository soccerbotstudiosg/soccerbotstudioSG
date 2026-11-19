"use client";
import { useMobileBooking } from "./booking-tools";
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
  const mobile = useMobileBooking();
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
      <p className="lead booking-step-instruction">
        Confirm your session and players.
      </p>
      {!mobile && <h2 className="section-title">Outlet</h2>}
      <div className="outlet-options">
        {mobile && !outletSelected ? (
          <select
            className="booking-choice-selector"
            aria-label="Outlet"
            value=""
            onChange={(event) => {
              if (event.target.value)
                setSessionChoices({ outlet: true, session: false });
            }}
          >
            <option value="" disabled>
              Choose outlet
            </option>
            <option value={LOCATION.building}>{LOCATION.building}</option>
          </select>
        ) : (
          <button
            className="surface outlet-option booking-entry-action"
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
              <strong>
                {mobile && (
                  <span
                    className="booking-choice-label"
                    role="heading"
                    aria-level={2}
                  >
                    Outlet
                  </span>
                )}
                {LOCATION.building}
              </strong>
              <span>
                {LOCATION.street}, {LOCATION.unit}
              </span>
            </span>
          </button>
        )}
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
      {(!outletSelected || !sessionChoices.session) && (
        <BookingPrimaryAction className="actions" ready={false}>
          <button className="button" disabled>
            Choose sessions <Icon name="chevron" />
          </button>
        </BookingPrimaryAction>
      )}
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
  const mobile = useMobileBooking();
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
        <section className={mobile && eligible.length ? undefined : "surface"}>
          {(!mobile || !eligible.length) && (
            <p>
              {eligible.length
                ? "Choose your session."
                : "No sessions are currently available."}
            </p>
          )}
          {mobile && eligible.length > 0 ? (
            <select
              className="booking-choice-selector"
              aria-label="Session"
              value=""
              onChange={(event) => {
                const service = eligible.find(
                  (item) => item.id === event.target.value,
                );
                if (!service) return;
                update({
                  nativeServiceId: service.id,
                  nativeServiceName: service.name,
                  slots: [],
                });
                if (!presentation.expanded) presentation.toggle();
              }}
            >
              <option value="" disabled>
                Choose session
              </option>
              {eligible.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          ) : (
            eligible.map((service) => (
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
            ))
          )}
        </section>
      </>
    );
  return (
    <SessionPresentation
      {...presentation}
      choices={eligible.map(({ id, name }) => ({ id, name }))}
      onChoose={(id) => {
        const service = eligible.find((item) => item.id === id);
        if (service && service.id !== draft.nativeServiceId)
          update({
            nativeServiceId: service.id,
            nativeServiceName: service.name,
            slots: [],
          });
      }}
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
  choices,
  onChoose,
  expanded,
  toggle,
}: {
  expanded: boolean;
  toggle: () => void;
  serviceName?: string;
  choices?: { id: string; name: string }[];
  onChoose?: (id: string) => void;
  environment?: "developer" | "production";
  pending?: boolean;
}) {
  const { draft, update } = useBooking();
  const prices = sessionPrices(environment);
  const mobile = useMobileBooking();
  if (mobile && !expanded)
    return (
      <div className="session-products">
        <select
          className="booking-choice-selector"
          aria-label="Session"
          value=""
          onChange={(event) => {
            if (event.target.value) {
              onChoose?.(event.target.value);
              toggle();
            }
          }}
        >
          <option value="" disabled>
            Choose session
          </option>
          {(choices ?? [{ id: serviceName, name: serviceName }]).map(
            (choice) => (
              <option key={choice.id} value={choice.id}>
                {choice.name}
              </option>
            ),
          )}
        </select>
      </div>
    );
  return (
    <>
      {!mobile && <h2 className="section-title">Session</h2>}
      <div className="session-products">
        <section
          className="surface session-product booking-entry-action"
          aria-label={serviceName}
        >
          <button
            className="session-product-choice"
            aria-label={`Choose ${serviceName}`}
            aria-pressed={expanded}
            aria-expanded={expanded}
            onClick={toggle}
          >
            <span className="session-product-details">
              {mobile && (
                <span
                  className="booking-choice-label"
                  role="heading"
                  aria-level={2}
                >
                  Session
                </span>
              )}

              <span className="session-product-icon">
                <Icon name="ball" />
              </span>
              <span className="session-product-name">{serviceName}</span>
              <span className="session-product-meta">
                {mobile ? (
                  <>40 minutes · 1–{MAX_PLAYERS} players</>
                ) : (
                  <>
                    <span>40 minutes</span>
                    <span>1–{MAX_PLAYERS} players</span>
                  </>
                )}
                <span>Trainer included</span>
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
          {expanded && (
            <div className="player-selection" aria-labelledby="players-label">
              <span className="field-label" id="players-label">
                Players
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
                  {draft.players}
                </output>
                <button
                  aria-label="Add one player"
                  disabled={draft.players >= MAX_PLAYERS}
                  onClick={() => update({ players: draft.players + 1 })}
                >
                  <Icon name="plus" />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
      {expanded && (
        <BookingPrimaryAction className="actions" ready={!pending}>
          {pending ? (
            <button className="button" disabled>
              <BrandLoading overlay={false} compact label="Loading times…" />
            </button>
          ) : (
            <Link href="/book/time/" className="button">
              Choose sessions <Icon name="chevron" />
            </Link>
          )}
        </BookingPrimaryAction>
      )}
    </>
  );
}
