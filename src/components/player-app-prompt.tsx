"use client";
import { useState, useSyncExternalStore } from "react";
import { PlayerAppLinks } from "./player-app-links";
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
      title="Download The Official Soccerbot360 Player App Now."
      onClose={close}
      variant="player-app"
    >
      <PlayerAppLinks />
    </Dialog>
  );
}
