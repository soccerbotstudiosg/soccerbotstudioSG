"use client";
import { createContext, useContext, type ReactNode } from "react";
export const BookingHeadingStatus = createContext<ReactNode>(null);
/** Keep the current identity beside each booking step's title. */
export function BookingHeading({
  lines,
  status: suppliedStatus,
}: {
  lines: readonly [string, string];
  status?: ReactNode;
}) {
  const inheritedStatus = useContext(BookingHeadingStatus);
  const status = suppliedStatus ?? inheritedStatus;
  const title = (
    <h1 className="page-title booking-title">
      <span className="booking-title-line">{lines[0]}</span>{" "}
      <span className="booking-title-line">{lines[1]}</span>
    </h1>
  );
  if (!status) return title;
  return (
    <div className="booking-heading-row">
      {title}
      {status}
    </div>
  );
}

/** Show verified contact identity without implying reservation-management access. */
export function VerifiedEmailStatus({ email }: { email: string }) {
  return (
    <span className="booking-verified-status">
      <strong>Email verified</strong>
      <span>{email}</span>
    </span>
  );
}
