"use client";
import { useState, useSyncExternalStore } from "react";
import { Dialog } from "@/components/dialog";
import { Icon } from "@/components/icon";
import { useBooking } from "./provider";
import { Summary, SelectedTrainers } from "./summary";

const query = "(max-width: 700px)";
/** Subscribe to phone layout changes without changing booking state. */
function subscribe(callback: () => void) {
  if (typeof window.matchMedia !== "function") return () => {};
  const media = window.matchMedia(query);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
const snapshot = () =>
  typeof window.matchMedia === "function" && window.matchMedia(query).matches;
const serverSnapshot = () => false;
/** Resolve the shared phone breakpoint with a stable server render. */
export function useMobileBooking() {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

/** Open phone cart and trainer panels from the persistent booking navigation. */
export function BookingTools({ basket = false }: { basket?: boolean }) {
  const { draft } = useBooking();
  const mobile = useMobileBooking();
  const [panel, setPanel] = useState<"cart" | "trainers" | null>(null);
  const count = draft.slots.length;
  const trainerCount = new Set(draft.slots.map((slot) => slot.instructor)).size;
  return (
    <>
      <div className="booking-panel-buttons">
        <button
          type="button"
          className="booking-panel-button"
          aria-label={`Open cart, ${count} ${count === 1 ? "session" : "sessions"}`}
          aria-haspopup="dialog"
          onClick={() => setPanel("cart")}
        >
          <Icon name="cart" />
          {count > 0 && (
            <span className="booking-cart-count" key={count} aria-hidden="true">
              {count}
            </span>
          )}
        </button>
        <button
          type="button"
          className="booking-panel-button"
          aria-label={`View selected trainers, ${trainerCount} ${trainerCount === 1 ? "trainer" : "trainers"}`}
          aria-haspopup="dialog"
          onClick={() => setPanel("trainers")}
        >
          <Icon name="users" />
          {trainerCount > 0 && (
            <span
              className="booking-cart-count"
              key={trainerCount}
              aria-hidden="true"
            >
              {trainerCount}
            </span>
          )}
        </button>
      </div>
      {mobile && panel && (
        <Dialog
          variant="booking-panel"
          title={panel === "cart" ? "Your Cart" : "Selected trainers"}
          onClose={() => setPanel(null)}
        >
          {panel === "cart" ? (
            <Summary
              basket={basket}
              includeAction={false}
              showTrainers={false}
            />
          ) : (
            <SelectedTrainers />
          )}
        </Dialog>
      )}
    </>
  );
}
