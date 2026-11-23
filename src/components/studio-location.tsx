"use client";
import { useState } from "react";
import { ADDRESS, LOCATION } from "@/domain/catalog";
import { CLOSING_MINUTE, OPENING_MINUTE } from "@/domain/booking-policy";
import { openingTime } from "@/domain/dates";
import { StudioDirections } from "./studio-directions";
import { Dialog } from "./dialog";
import { Icon } from "./icon";
const mapQuery = encodeURIComponent(
  `${LOCATION.building}, ${LOCATION.street}, ${LOCATION.postal}`,
);
/** Present the studio address and on-demand location dialog. */
export function StudioLocation() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="studio-location-trigger"
        aria-label="View studio location"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <Icon name="location" />
      </button>
      {open && (
        <Dialog
          title="Find the studio"
          variant="location"
          onClose={() => setOpen(false)}
        >
          <p className="studio-location-address">{ADDRESS}</p>
          <p className="studio-location-hours">
            Open daily · {openingTime(OPENING_MINUTE)}–
            {openingTime(CLOSING_MINUTE)}
          </p>
          <StudioDirections />
          <p className="studio-map-help">
            If coming up from the food court at #03-18, take the lift to Level 5
            and turn left as you exit the lift lobby. Follow the blue route to
            #05-01.
          </p>
          <a
            className="text-link studio-map-link"
            href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
            target="_blank"
            rel="noreferrer"
          >
            Open in Google Maps <Icon name="external" />
          </a>
        </Dialog>
      )}
    </>
  );
}
