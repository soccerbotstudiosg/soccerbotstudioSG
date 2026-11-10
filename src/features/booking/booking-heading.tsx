"use client";
import { createContext, useContext, type ReactNode } from "react";
export const BookingHeadingStatus = createContext<ReactNode>(null);
/** Keep the current identity beside each booking step's title. */
export function BookingHeading({
  children,
  status: suppliedStatus,
}: {
  children: ReactNode;
  status?: ReactNode;
}) {
  const inheritedStatus = useContext(BookingHeadingStatus);
  const status = suppliedStatus ?? inheritedStatus;
  if (!status) return <h1 className="page-title">{children}</h1>;
  return (
    <div className="booking-heading-row">
      <h1 className="page-title">{children}</h1>
      {status}
    </div>
  );
}
