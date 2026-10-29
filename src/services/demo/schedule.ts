import type { Session, Slot } from "@/domain/booking";
import {
  CLOSING_MINUTE,
  OPENING_MINUTE,
  SESSION_STARTS,
  type InstructorId,
} from "@/domain/demo-catalog";
import { SESSION_MINUTES } from "@/domain/booking-policy";
import { clock, clockMinutes } from "@/domain/dates";
const ROTATION: InstructorId[] = [
  "faisal",
  "daniel",
  "instructor3",
  "instructor4",
];
// The starting instructor remains for the full session, including a crossing.
/** Build the demo session representation for a selected slot. */
export function demoSession(slot: Slot): Session | null {
  const minute = clockMinutes(slot.start);
  if (
    minute < OPENING_MINUTE ||
    minute + SESSION_MINUTES > CLOSING_MINUTE ||
    !SESSION_STARTS.includes(minute)
  )
    return null;
  const block = Math.floor((minute - OPENING_MINUTE) / 180);
  const boundary = OPENING_MINUTE + (block + 1) * 180;
  return {
    ...slot,
    instructor: ROTATION[block],
    ...(minute + SESSION_MINUTES > boundary
      ? { rotationAt: clock(boundary) }
      : {}),
  };
}

/** Offer two rotating demo trainers while retaining one shared studio slot. */
export function demoSessions(slot: Slot): Session[] {
  const first = demoSession(slot);
  if (!first) return [];
  const index = ROTATION.indexOf(first.instructor as InstructorId);
  return [
    first,
    { ...first, instructor: ROTATION[(index + 1) % ROTATION.length] },
  ];
}
