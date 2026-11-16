import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import type { ReactNode } from "react";
import Link from "next/link";
import { SiteShell, useStandalonePage } from "./site-shell";
const navigation = vi.hoisted(() => ({
  path: "/book/session/yes",
  push: vi.fn(),
}));
const booking = vi.hoisted(() => ({
  attempt: null,
  action: { status: "idle" },
  leave: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => navigation.path,
  useRouter: () => ({ push: navigation.push }),
}));
vi.mock("@/features/booking/provider", () => ({ useBooking: () => booking }));
vi.mock("next/link", () => ({
  default: (props: React.ComponentProps<"a">) => <a {...props} />,
}));
vi.mock("./booking-navigation", () => ({
  BookingLink: (props: React.ComponentProps<"a">) => <a {...props} />,
}));
vi.mock("./section-reveals", () => ({
  SectionReveals: () => null,
  BackToTop: () => null,
}));
vi.mock("./player-app-prompt", () => ({
  PlayerAppPrompt: () => <span>Player app prompt</span>,
}));
/** Exercise the real standalone lifecycle independently of canvas animation. */
function Standalone({ children }: { children: ReactNode }) {
  useStandalonePage();
  return children;
}
test("nested booking 404 bypasses departure prompts and restores the guard only on valid booking pages", () => {
  const follow = vi.fn();
  const home = (
    <Link
      href="/"
      onClick={(event) => {
        event.preventDefault();
        follow();
      }}
    >
      Artwork Home
    </Link>
  );
  const view = render(
    <SiteShell>
      <Standalone>{home}</Standalone>
    </SiteShell>,
  );
  fireEvent.click(screen.getByRole("link", { name: "Artwork Home" }));
  expect(follow).toHaveBeenCalledOnce();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.queryByText("Player app prompt")).not.toBeInTheDocument();
  expect(booking.leave).not.toHaveBeenCalled();
  navigation.path = "/book/session/";
  view.rerender(<SiteShell>{home}</SiteShell>);
  fireEvent.click(screen.getByRole("link", { name: "Artwork Home" }));
  expect(
    screen.getByRole("dialog", { name: "Leave this booking?" }),
  ).toBeVisible();
  expect(follow).toHaveBeenCalledOnce();
  navigation.path = "/book/session/yes";
  view.rerender(
    <SiteShell>
      <Standalone>{home}</Standalone>
    </SiteShell>,
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("link", { name: "Artwork Home" }));
  expect(follow).toHaveBeenCalledTimes(2);
  navigation.path = "/book/session/";
  view.rerender(<SiteShell>{home}</SiteShell>);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("link", { name: "Artwork Home" }));
  expect(
    screen.getByRole("dialog", { name: "Leave this booking?" }),
  ).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Stay" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(booking.leave).not.toHaveBeenCalled();
});
