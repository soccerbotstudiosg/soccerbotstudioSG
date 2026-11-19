import { createBookingMechanism } from "./booking-mechanism-fixture.mjs";
export function createBookingCollision(
  options?: Pick<
    NonNullable<Parameters<typeof createBookingMechanism>[0]>,
    "checkoutBotProof" | "onTiming"
  >,
): Promise<
  Awaited<ReturnType<typeof createBookingMechanism>> & {
    heldStartMs: number;
    batchStarts: number[];
    secondAttemptReached: Promise<void>;
    releaseSecondAttempt(): void;
    providerBookings(): { startMs: number; bookingId: string }[];
  }
>;
