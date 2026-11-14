"use client";
import { useEffect, useState } from "react";
import { sessionPrices } from "@/domain/session-pricing";
import {
  customerCatalogueService,
  type CustomerCatalogueService,
} from "@/services/customer-catalogue";
import { useBooking } from "./provider";

/** Format approved display prices without granting booking or payment authority. */
function sessionPriceLabel(environment: "developer" | "production") {
  const prices = sessionPrices(environment);
  return `S$${prices.ordinary / 100} weekdays · S$${prices.premium / 100} weekends and Singapore public holidays`;
}

/** Resolve homepage prices from the same validated catalogue used by booking. */
export function SessionPrice({
  service = customerCatalogueService,
}: {
  service?: CustomerCatalogueService;
}) {
  const { bookingService } = useBooking();
  const live = bookingService.mode === "live";
  const [result, setResult] = useState<{
    service: CustomerCatalogueService;
    environment: "developer" | "production";
  } | null>(null);
  useEffect(() => {
    if (!live) return;
    const controller = new AbortController();
    void service.read(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted)
          setResult({ service, environment: data.environment });
      },
      () => {
        if (!controller.signal.aborted) setResult(null);
      },
    );
    return () => controller.abort();
  }, [live, service]);
  const environment = live
    ? result?.service === service
      ? result.environment
      : undefined
    : "developer";
  return (
    <span>
      {environment ? sessionPriceLabel(environment) : "See prices when booking"}
    </span>
  );
}
