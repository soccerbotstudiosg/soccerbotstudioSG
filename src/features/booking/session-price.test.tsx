import { act, fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import type { CustomerCatalogue } from "@/domain/catalog";
import { customerCatalogueService } from "@/services/customer-catalogue";
import { SessionPrice } from "./session-price";
import { SessionStep } from "./session-step";
const context = vi.hoisted(() => ({
  bookingService: { mode: "live" },
  draft: { nativeServiceId: "3", players: 1 },
  update: vi.fn(),
}));
vi.mock("./provider", async () => {
  const { useState } = await import("react");
  return {
    useBooking: () => {
      const [sessionChoices, setSessionChoices] = useState({
        outlet: true,
        session: true,
      });
      return { ...context, sessionChoices, setSessionChoices };
    },
  };
});
/** Supply a complete synthetic catalogue for the requested price profile. */
function catalogue(environment: "developer" | "production"): CustomerCatalogue {
  return {
    environment,
    observedAtMs: Date.now(),
    complete: true,
    services: [
      {
        id: "3",
        name: "Kickoff Special",
        active: true,
        durationMinutes: 50,
        recurring: false,
        priceMinor: environment === "production" ? 10800 : 8800,
        currency: "SGD",
        instructorIds: ["2"],
      },
    ],
    instructors: [{ id: "2", name: "Trainer", active: true }],
  };
}
test("homepage prices follow the catalogue environment without a live preview fallback", async () => {
  context.bookingService.mode = "live";
  let finish!: (data: CustomerCatalogue) => void;
  const read = vi.fn(
    () =>
      new Promise<CustomerCatalogue>((resolve) => {
        finish = resolve;
      }),
  );
  const view = render(<SessionPrice service={{ read }} />);
  expect(screen.getByText("See prices when booking")).toBeInTheDocument();
  expect(screen.queryByText(/S\$88/)).not.toBeInTheDocument();
  await act(async () => finish(catalogue("production")));
  expect(
    screen.getByText(
      "S$108 weekdays · S$128 weekends and Singapore public holidays",
    ),
  ).toBeInTheDocument();
  view.rerender(
    <SessionPrice
      service={{
        read: vi.fn().mockRejectedValue(new Error("private provider error")),
      }}
    />,
  );
  await act(async () => {});
  expect(screen.getByText("See prices when booking")).toBeInTheDocument();
  expect(screen.queryByText(/private provider|S\$108/)).not.toBeInTheDocument();
  view.rerender(
    <SessionPrice
      service={{ read: vi.fn().mockResolvedValue(catalogue("developer")) }}
    />,
  );
  expect(
    await screen.findByText(
      "S$88 weekdays · S$108 weekends and Singapore public holidays",
    ),
  ).toBeInTheDocument();
  view.rerender(
    <SessionPrice
      offer
      service={{ read: vi.fn().mockResolvedValue(catalogue("production")) }}
    />,
  );
  await act(async () => {});
  expect(document.querySelector(".arena-offer-prices")).toHaveTextContent(
    "Weekdays S$108Weekends & SG public holidays S$128",
  );
  const demoRead = vi.fn();
  context.bookingService.mode = "demo";
  view.rerender(<SessionPrice service={{ read: demoRead }} />);
  expect(demoRead).not.toHaveBeenCalled();
  expect(screen.getByText(/S\$88 weekdays/)).toBeInTheDocument();
  context.bookingService.mode = "live";
});
test("live session selection uses client prices while demo retains its own rates", async () => {
  context.bookingService.mode = "live";
  const read = vi
    .spyOn(customerCatalogueService, "read")
    .mockResolvedValue(catalogue("production"));
  const view = render(<SessionStep />);
  expect(screen.getByRole("heading", { name: "Outlet" })).toBeVisible();
  expect(
    screen.queryByRole("link", { name: "Choose sessions" }),
  ).not.toBeInTheDocument();
  const session = await screen.findByRole("region", {
    name: "Kickoff Special",
  });
  expect(session).toHaveTextContent(
    "Weekdays $108Weekends/Public Holiday $128",
  );
  expect(session).toHaveTextContent("Trainer included");
  expect(screen.queryByText(/S\$88 weekdays/)).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Add one player" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Choose sessions" })).toBeVisible();
  expect(
    screen.getByRole("link", { name: "Choose sessions" }).parentElement,
  ).toHaveAttribute("data-ready-animation", "true");
  const choice = screen.getByRole("button", { name: "Choose Kickoff Special" });
  fireEvent.click(choice);
  expect(choice).toHaveAttribute("aria-pressed", "false");
  expect(
    screen.getByRole("button", { name: "Choose sessions" }),
  ).toBeDisabled();
  expect(document.querySelectorAll(".booking-primary-action")).toHaveLength(1);
  expect(
    screen.queryByRole("button", { name: "Add one player" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "Choose sessions" }),
  ).not.toBeInTheDocument();
  fireEvent.click(choice);
  expect(screen.getByRole("button", { name: "Add one player" })).toBeVisible();
  fireEvent.click(
    screen.getByRole("button", { name: "Select Apex @ Henderson outlet" }),
  );
  expect(
    screen.queryByRole("region", { name: "Kickoff Special" }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Choose sessions" }),
  ).toBeDisabled();
  expect(document.querySelectorAll(".booking-action-position")).toHaveLength(1);
  fireEvent.click(
    screen.getByRole("button", { name: "Select Apex @ Henderson outlet" }),
  );
  expect(
    await screen.findByRole("button", { name: "Choose Kickoff Special" }),
  ).toHaveAttribute("aria-pressed", "false");
  fireEvent.click(
    screen.getByRole("button", { name: "Choose Kickoff Special" }),
  );
  context.bookingService.mode = "demo";
  view.rerender(<SessionStep />);
  expect(
    screen.getByRole("region", { name: /Kickoff Special/ }),
  ).toHaveTextContent("Weekdays $88Weekends/Public Holiday $108");
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query === "(max-width: 700px)",
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  view.rerender(<SessionStep />);
  const outlet = screen.getByRole("button", {
    name: "Select Apex @ Henderson outlet",
  });
  expect(outlet).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(outlet);
  const outletSelect = screen.getByRole("combobox", { name: "Outlet" });
  expect(outletSelect).toHaveDisplayValue("Choose outlet");
  expect(outletSelect).toHaveClass("booking-choice-selector");
  expect(
    screen.queryByRole("heading", { name: "Outlet" }),
  ).not.toBeInTheDocument();
  expect(outletSelect.closest("label, .surface")).toBeNull();
  expect(
    screen.queryByRole("region", { name: "Kickoff Special" }),
  ).not.toBeInTheDocument();
  fireEvent.change(outletSelect, { target: { value: "Apex @ Henderson" } });
  expect(
    screen.getByRole("button", { name: "Select Apex @ Henderson outlet" }),
  ).toHaveTextContent("201 Henderson Road, #05-01");
  const sessionSelect = screen.getByRole("combobox", { name: "Session" });
  expect(sessionSelect).toHaveDisplayValue("Choose session");
  expect(sessionSelect).toHaveClass("booking-choice-selector");
  expect(
    screen.queryByRole("heading", { name: "Session" }),
  ).not.toBeInTheDocument();
  expect(sessionSelect.closest("label, .surface")).toBeNull();
  expect(
    screen.getByRole("option", { name: "Kickoff Special" }),
  ).toHaveTextContent(/^Kickoff Special$/);
  fireEvent.change(sessionSelect, { target: { value: "Kickoff Special" } });
  expect(
    screen.getByRole("region", { name: "Kickoff Special" }),
  ).toHaveTextContent("Trainer included");
  expect(screen.getByRole("button", { name: "Add one player" })).toBeVisible();
  fireEvent.click(
    screen.getByRole("button", { name: "Choose Kickoff Special" }),
  );
  expect(screen.getByRole("combobox", { name: "Session" })).toHaveDisplayValue(
    "Choose session",
  );
  expect(
    screen.queryByRole("link", { name: "Choose sessions" }),
  ).not.toBeInTheDocument();
  read.mockRestore();
  context.bookingService.mode = "live";
});
