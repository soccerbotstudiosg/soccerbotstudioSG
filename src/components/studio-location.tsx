"use client";
import { useState } from "react";
import { ADDRESS, LOCATION } from "@/domain/catalog";
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
        <Dialog title="Find the studio" onClose={() => setOpen(false)}>
          <p className="studio-location-address">{ADDRESS}</p>
          <div className="studio-map-frame">
            <iframe
              title="Satellite map of Apex at Henderson and surrounding roads"
              src={`https://www.google.com/maps?q=${mapQuery}&t=k&z=18&output=embed`}
              referrerPolicy="no-referrer"
              allowFullScreen
            />
          </div>
          <p className="studio-map-help">
            Take the lift from the food court to Level 5. Turn left as you exit
            the lift lobby.
          </p>
          <a
            className="button wide"
            href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
            target="_blank"
            rel="noreferrer"
          >
            Open Google Maps <Icon name="chevron" />
          </a>
        </Dialog>
      )}
    </>
  );
}
