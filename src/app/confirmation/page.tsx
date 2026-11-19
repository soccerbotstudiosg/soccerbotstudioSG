"use client";
import { PendingConfirmation } from "@/features/booking/confirmation-step";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useBooking } from "@/features/booking/provider";
import { ProtectedConfirmation } from "@/features/booking/protected-confirmation";
/** Keep return hints with the corresponding attempt when history changes only the query. */
function ConfirmationRoute() {
  const params = useSearchParams();
  const id = params.get("attempt") || "";
  return (
    <AttemptConfirmation
      key={id}
      attemptId={id}
      status={params.get("status")}
      hasReference={params.has("reference")}
    />
  );
}

/** Retain this attempt's return presentation after cleaning the provider parameters. */
function AttemptConfirmation({
  attemptId,
  status,
  hasReference,
}: {
  attemptId: string;
  status: string | null;
  hasReference: boolean;
}) {
  const [hint, setHint] = useState({ status, hasReference });
  if (
    status !== null &&
    (hint.status !== status || hint.hasReference !== hasReference)
  )
    setHint({ status, hasReference });
  const providerReturn = hint.status !== null && hint.hasReference;
  const paymentContinuation = hint.status !== "completed";
  useEffect(() => {
    if (status === null || !hasReference) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("status");
    url.searchParams.delete("reference");
    window.history.replaceState(window.history.state, "", url);
  }, [status, hasReference]);
  const {
    reset,
    restartAfterConfirmation,
    restartAfterExpiry,
    browseAfterChecking,
    rejectRecoveredSelection,
    resolveUncreatedBooking,
    confirmationRevision,
    bookingService,
  } = useBooking();
  return (
    <ProtectedConfirmation
      attemptId={attemptId}
      // Provider return hints may suppress payment, never establish paid status.
      allowPaymentContinuation={paymentContinuation}
      providerReturn={providerReturn}
      confirmationRoute
      sessionRevision={confirmationRevision}
      checkoutMode={bookingService.mode === "live" ? "live" : undefined}
      onExpired={restartAfterExpiry}
      onAwaitingExpiry={browseAfterChecking}
      onSelectionRejected={rejectRecoveredSelection}
      onCreationResolved={resolveUncreatedBooking}
      onAgain={reset}
      onRestart={restartAfterConfirmation}
    />
  );
}
/** Render the confirmation route with a loading boundary. */
export default function ConfirmationPage() {
  return (
    <Suspense fallback={<PendingConfirmation label="Checking payment…" />}>
      <ConfirmationRoute />
    </Suspense>
  );
}
