import { z } from "zod";
import { ApiError } from "./policy";
import {
  OPENING_MINUTE,
  CLOSING_MINUTE,
  START_INTERVAL_MINUTES,
} from "../src/domain/booking-policy";

const boundary = z
  .string()
  .regex(/^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$|^24:00:00$/);
const intervals = z.array(z.tuple([boundary, boundary])).max(288);
const seconds = (time: string) => {
  const [h, m, s] = time.split(":").map(Number);
  return h * 3600 + m * 60 + s;
};
/** Fit fixed public starts inside complete provider-reported free intervals. */
export function studioStartsFromIntervals(
  raw: unknown,
  date: string,
  instructorId: string,
): string[] {
  const parsed = z
    .record(z.string(), z.record(z.string(), intervals))
    .safeParse(raw);
  if (!parsed.success || !(date in parsed.data))
    throw new ApiError(503, "availability_representation_unavailable");
  const day = parsed.data[date];
  if (Object.keys(day).some((id) => id !== instructorId))
    throw new ApiError(503, "availability_representation_unavailable");
  const ranges = (day[instructorId] ?? [])
    .map(([from, to]) => ({ from: seconds(from), to: seconds(to) }))
    .sort((a, b) => a.from - b.from);
  if (ranges.some((range) => range.from >= range.to))
    throw new ApiError(503, "availability_representation_unavailable");
  const continuous: typeof ranges = [];
  for (const range of ranges) {
    const previous = continuous.at(-1);
    if (previous && range.from <= previous.to)
      previous.to = Math.max(previous.to, range.to);
    else continuous.push({ ...range });
  }
  const starts: string[] = [];
  for (
    let minute = OPENING_MINUTE;
    minute + START_INTERVAL_MINUTES <= CLOSING_MINUTE;
    minute += START_INTERVAL_MINUTES
  ) {
    if (
      continuous.some(
        (range) =>
          range.from <= minute * 60 &&
          range.to >= (minute + START_INTERVAL_MINUTES) * 60,
      )
    )
      starts.push(
        `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}:00`,
      );
  }
  return starts;
}
