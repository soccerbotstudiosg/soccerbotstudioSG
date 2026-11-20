import { createBookingMechanism } from "./booking-mechanism-fixture.mjs";
export function createBookingSequence(
  sizes: number[],
  options?: Parameters<typeof createBookingMechanism>[0] & {
    linkWindowsMs?: (number | undefined)[];
  },
): Promise<
  Awaited<ReturnType<typeof createBookingMechanism>> & {
    journeys: {
      readonly expiresAtMs?: number;
      starts: number[];
      checkoutUrl: string;
      invoiceId: string;
    }[];
    completeJourney(index: number): Promise<{ status: number }>;
  }
>;
