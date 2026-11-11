import type { Miniflare } from "miniflare";
export function createBookingMechanism(options?: {
  observationMaxAgeMs?: number;
  checkoutBotProof?: boolean;
  botResult?: (body: {
    secret: string;
    response: string;
  }) => Response | Promise<Response>;
  batch?: boolean;
  batchSize?: number;
  missingCreationDeadline?: boolean;
  creationPriceDrift?: boolean;
  onTiming?: (timing: { phase: string; durationMs: number }) => void;
  onLog?: (message: string) => void;
  displayWarming?: boolean;
  respond?: (call: {
    url: string;
    method: string;
    body: Record<string, unknown> | null;
  }) => Promise<Response | undefined>;
}): Promise<{
  mf: Miniflare;
  db: Awaited<ReturnType<Miniflare["getD1Database"]>>;
  origin: string;
  date: string;
  startMs: number;
  checkoutUrl: string;
  calls: {
    url: string;
    method: string;
    body: Record<string, unknown> | null;
  }[];
  botCalls: { token: string }[];
  unexpected: string[];
  completePayment(): Promise<{ status: number }>;
  recover(): Promise<unknown>;
  close(): Promise<void>;
}>;
