"use client";
import { useEffect, useRef } from "react";
import { confirmationResponseTime } from "@/services/confirmation";
export type ConfirmationRenderState =
  "summary" | "payment_received" | "confirmed";
export type ConfirmationProofSource =
  | "none"
  | "saved"
  | "status_proof"
  | "context_proof"
  | "receipt"
  | "confirmed_status";
/** Record committed UI and a visible animation-frame observation without affecting checkout. */
export function useConfirmationRenderTrace({
  attemptId,
  revision,
  state,
  proofSource,
  evidence,
  receipt,
}: {
  attemptId: string;
  revision: number;
  state?: ConfirmationRenderState;
  proofSource: ConfirmationProofSource;
  evidence?: object | null;
  receipt?: object | null;
}) {
  const emitted = useRef(new Set<string>());
  useEffect(() => {
    if (
      !/^[a-f0-9-]{36}$/i.test(attemptId) ||
      !state ||
      (state === "confirmed" && proofSource === "none")
    )
      return;
    const committedMs = performance.now();
    const responseReadyMs = confirmationResponseTime(evidence) ?? null;
    let active = true;
    let frame = 0;
    const stages = [state, ...(receipt ? ["receipt_ready"] : [])];
    const publish = async () => {
      if (!active || document.visibilityState !== "visible") return;
      const frameMs = performance.now();
      try {
        const digest = await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode("confirmation:" + attemptId),
        );
        if (!active || document.visibilityState !== "visible") return;
        const recoveryKey = Array.from(new Uint8Array(digest), (b) =>
          b.toString(16).padStart(2, "0"),
        ).join("");
        for (const stage of stages) {
          const key = `${attemptId}:${revision}:${stage}`;
          if (emitted.current.has(key) || emitted.current.size >= 32) continue;
          emitted.current.add(key);
          const detail = {
            event: "confirmation_ui",
            stage,
            proofSource,
            recoveryKey,
            buildRevision: process.env.NEXT_PUBLIC_BUILD_REVISION ?? "unknown",
            timeOriginMs: performance.timeOrigin,
            committedMs,
            frameMs,
            responseReadyMs:
              stage === "receipt_ready"
                ? (confirmationResponseTime(receipt) ?? null)
                : responseReadyMs,
            measurement: "visible_animation_frame",
          };
          // Bounded local diagnostics only: no extra network request or persistent browser storage.
          performance.clearMarks?.(`soccerbot:confirmation:${stage}`);
          performance.mark?.(`soccerbot:confirmation:${stage}`, { detail });
          console.info(JSON.stringify(detail));
        }
      } catch {
        // Diagnostics must never block rendering, expose raw errors or retry provider work.
      }
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      if (document.visibilityState === "visible")
        frame = requestAnimationFrame(() => {
          void publish();
        });
    };
    schedule();
    document.addEventListener("visibilitychange", schedule);
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [attemptId, revision, state, proofSource, evidence, receipt]);
}
