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
vi.mock("./provider", () => ({ useBooking: () => context }));
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
        durationMinutes: 40,
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
  expect(
    screen.queryByRole("button", { name: /Choose Kickoff Special/ }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "See available times" }),
  ).not.toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: "Select Apex @ Henderson outlet" }),
  );
  expect(
    await screen.findByRole("button", { name: "Choose Kickoff Special" }),
  ).toHaveTextContent("Weekdays $108Weekends/Public Holiday $128");
  expect(screen.queryByText(/S\$88 weekdays/)).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Add one player" }),
  ).not.toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: "Choose Kickoff Special" }),
  );
  expect(screen.getByRole("button", { name: "Add one player" })).toBeVisible();
  expect(
    screen.getByRole("link", { name: "See available times" }),
  ).toBeVisible();
  context.bookingService.mode = "demo";
  view.rerender(<SessionStep />);
  expect(
    screen.getByRole("button", { name: /Choose Kickoff Special/ }),
  ).toHaveTextContent("Weekdays $88Weekends/Public Holiday $108");
  read.mockRestore();
  context.bookingService.mode = "live";
});
