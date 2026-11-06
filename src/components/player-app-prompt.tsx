"use client";
import { useState, useSyncExternalStore } from "react";
import { PLAYER_APP_STORES } from "@/domain/catalog";
import { safeRead, safeWrite } from "@/services/storage";
import { Dialog } from "./dialog";
const KEY = "soccerbot-player-app-prompt";
function subscribe(notify: () => void) {
  window.addEventListener("storage", notify);
  return () => window.removeEventListener("storage", notify);
}
const firstVisit = () => safeRead(KEY, true) !== true;
const serverVisit = () => false;
/** Present the player application prompt and its dismissal control. */
export function PlayerAppPrompt() {
  const unseen = useSyncExternalStore(subscribe, firstVisit, serverVisit);
  const [dismissed, setDismissed] = useState(false);
  function close() {
    safeWrite(KEY, true, true);
    setDismissed(true);
  }
  if (!unseen || dismissed) return null;
  return (
    <Dialog
      title="Download the official soccerbot360 app now."
      onClose={close}
      variant="player-app"
    >
      <div className="app-store-links">
        {PLAYER_APP_STORES.map((store, index) => (
          <a
            className="app-store-link"
            key={store.label}
            href={store.url}
            target="_blank"
            rel="noreferrer"
            onClick={close}
            aria-label={store.label}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {index === 0 ? (
                <path
                  fill="currentColor"
                  d="M16.8 2c.2 1.5-.4 2.8-1.2 3.7-.9.9-2.1 1.4-3.2 1.3-.2-1.4.5-2.8 1.3-3.6.9-.9 2.2-1.5 3.1-1.4ZM20 17.5c-.5 1.2-.8 1.7-1.5 2.7-.9 1.3-2.1 2.9-3.6 2.9-1.3 0-1.7-.9-3.5-.9s-2.3.9-3.5.9c-1.5 0-2.6-1.4-3.5-2.7C1.8 16.7 1.3 12.2 3 9.7c1.2-1.8 3-2.8 4.7-2.8 1.4 0 2.3.8 3.5.8 1.1 0 1.8-.8 3.5-.8 1.4 0 2.9.7 4 1.9-3.5 2-2.9 7.1 1.3 8.7Z"
                />
              ) : index === 1 ? (
                <>
                  <path
                    d="M3 2v20l13-10L3 2Zm14 9 4-3L7 2l10 9Zm0 2 4 3L7 22l10-9Z"
                    fill="currentColor"
                  />
                </>
              ) : (
                <>
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="m4 7 6 1 1 4-4 3 1 5m7-17-2 5 5 3 3-1m-8 5 5 1-2 5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </>
              )}
            </svg>
            <strong>{store.label}</strong>
          </a>
        ))}
      </div>
    </Dialog>
  );
}
