import { createBookingMechanism } from "./booking-mechanism-fixture.mjs";
export function createBookingSequence(
  sizes: number[],
  options?: Parameters<typeof createBookingMechanism>[0],
): Promise<
  Awaited<ReturnType<typeof createBookingMechanism>> & {
    journeys: { starts: number[]; checkoutUrl: string; invoiceId: string }[];
    completeJourney(index: number): Promise<{ status: number }>;
  }
>;
