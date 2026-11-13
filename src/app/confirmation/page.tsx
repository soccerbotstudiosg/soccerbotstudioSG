"use client";
import { PendingConfirmation } from "@/features/booking/confirmation-step";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useBooking } from "@/features/booking/provider";
import { ProtectedConfirmation } from "@/features/booking/protected-confirmation";
/** Resolve the attempt parameter into a protected confirmation view. */
function ConfirmationRoute() {
  const params = useSearchParams();
  const [providerReturn] = useState(
    () => params.has("reference") && params.has("status"),
  );
  const [paymentContinuation] = useState(
    () => params.get("status") !== "completed",
  );
  useEffect(() => {
    if (!providerReturn) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("status");
    url.searchParams.delete("reference");
    window.history.replaceState(window.history.state, "", url);
  }, [providerReturn]);
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
      attemptId={params.get("attempt") || ""}
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
    <Suspense fallback={<PendingConfirmation />}>
      <ConfirmationRoute />
    </Suspense>
  );
}
