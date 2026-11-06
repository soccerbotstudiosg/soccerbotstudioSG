import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { StudioHeroVideo } from "./studio-hero-video";
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
/** Supply responsive preferences without loading a browser or remote media. */
function media(reduced: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("reduced-motion") && reduced,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
}
test("studio video autoplays silently once and exposes one replay control", async () => {
  media(false);
  const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  render(<StudioHeroVideo />);
  const video = screen.getByLabelText(
    "SOCCERBOT360 studio demonstration",
  ) as HTMLVideoElement;
  await act(async () => {});
  expect(play).toHaveBeenCalled();
  expect(video.muted).toBe(true);
  expect(video.autoplay).toBe(true);
  expect(video.controls).toBe(false);
  expect(video.loop).toBe(false);
  fireEvent.play(video);
  expect(
    screen.getByRole("button", { name: "Pause studio video" }),
  ).toBeVisible();
  const calls = play.mock.calls.length;
  Object.defineProperty(video, "ended", { configurable: true, value: true });
  video.currentTime = 9;
  fireEvent.ended(video);
  expect(play).toHaveBeenCalledTimes(calls);
  expect(screen.getAllByRole("button")).toHaveLength(1);
  fireEvent.click(screen.getByRole("button", { name: "Replay studio video" }));
  expect(video.currentTime).toBe(0);
  expect(play).toHaveBeenCalledTimes(calls + 1);
});
test("studio video respects reduced motion and blocked autoplay retains manual play", async () => {
  media(true);
  const play = vi
    .spyOn(HTMLMediaElement.prototype, "play")
    .mockRejectedValue(new Error("autoplay blocked"));
  const view = render(<StudioHeroVideo />);
  expect(play).not.toHaveBeenCalled();
  expect(
    screen.getByLabelText("SOCCERBOT360 studio demonstration"),
  ).not.toHaveAttribute("autoplay");
  await act(async () =>
    fireEvent.click(screen.getByRole("button", { name: "Play studio video" })),
  );
  expect(play).toHaveBeenCalledTimes(1);
  view.unmount();
  media(false);
  render(<StudioHeroVideo />);
  await act(async () => {});
  expect(play).toHaveBeenCalledTimes(2);
  expect(
    screen.getByRole("button", { name: "Play studio video" }),
  ).toBeVisible();
});
