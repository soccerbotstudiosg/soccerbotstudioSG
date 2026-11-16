"use client";
import { usePathname } from "next/navigation";
import {
  BookingLoading as BrandLoading,
  checkoutRouteLoadingLabel,
} from "@/features/booking/booking-loading";
/** Render the booking route's loading presentation. */
export default function Loading() {
  const pathname = usePathname();
  return (
    <BrandLoading
      label={checkoutRouteLoadingLabel(pathname) ?? "Opening booking"}
    />
  );
}
