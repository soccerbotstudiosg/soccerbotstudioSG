import { render, screen, waitFor, act } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { EmailBotProof, CheckoutBotProof } from "./email-bot-proof";
vi.mock("next/script", () => ({
  default: ({ onReady }: { onReady: () => void }) => (
    <button onClick={onReady}>Load synthetic widget</button>
  ),
}));
afterEach(() => {
  vi.unstubAllEnvs();
  delete window.turnstile;
});
it("email bot widget is unavailable without a bound public sitekey", () => {
  vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
  render(<EmailBotProof onToken={vi.fn()} />);
  expect(screen.getByRole("status")).toHaveTextContent(
    "Email verification unavailable. Please continue as a guest.",
  );
  expect(screen.queryByText("Load synthetic widget")).toBeNull();
});
it("email bot widget binds purpose clears expired proof and ignores callbacks after disposal", async () => {
  vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "synthetic-public-sitekey");
  const renderWidget = vi.fn().mockReturnValue("synthetic-widget"),
    remove = vi.fn(),
    token = vi.fn();
  window.turnstile = { render: renderWidget, remove };
  const mounted = render(<EmailBotProof onToken={token} />);
  await act(async () => screen.getByText("Load synthetic widget").click());
  await waitFor(() => expect(renderWidget).toHaveBeenCalledTimes(1));
  const options = renderWidget.mock.calls[0][1];
  expect(options).toMatchObject({
    sitekey: "synthetic-public-sitekey",
    action: "verify-email",
    appearance: "always",
  });
  await act(async () => {
    options.callback("proof");
    options["expired-callback"]();
  });
  expect(token.mock.calls).toEqual([["proof"], [""]]);
  mounted.unmount();
  expect(remove).toHaveBeenCalledWith("synthetic-widget");
  options.callback("stale");
  expect(token).toHaveBeenCalledTimes(2);
  const pending = vi.fn();
  const checkout = render(
    <CheckoutBotProof onToken={token} onPendingChange={pending} />,
  );
  expect(pending).toHaveBeenLastCalledWith(true);
  await act(async () => screen.getByText("Load synthetic widget").click());
  await waitFor(() => expect(renderWidget).toHaveBeenCalledTimes(2));
  const checkoutOptions = renderWidget.mock.calls[1][1];
  expect(checkoutOptions.action).toBe("create-checkout");
  expect(checkoutOptions.appearance).toBe("interaction-only");
  const wrapper = screen.getByLabelText(
    "Checkout security check",
  ).parentElement;
  expect(wrapper).toHaveClass("auth-bot-proof-background");
  await act(async () => checkoutOptions["before-interactive-callback"]());
  expect(wrapper).not.toHaveClass("auth-bot-proof-background");
  expect(pending).toHaveBeenLastCalledWith(false);
  await act(async () => checkoutOptions["after-interactive-callback"]());
  expect(wrapper).toHaveClass("auth-bot-proof-background");
  expect(pending).toHaveBeenLastCalledWith(true);
  await act(async () => checkoutOptions["before-interactive-callback"]());
  await act(async () => checkoutOptions["error-callback"]());
  expect(pending).toHaveBeenLastCalledWith(false);
  expect(screen.getByRole("status")).toHaveTextContent(
    "Security check unavailable",
  );
  await act(async () => checkoutOptions.callback("checkout-proof"));
  expect(screen.queryByRole("status")).toBeNull();
  expect(pending).toHaveBeenLastCalledWith(false);
  expect(wrapper).toHaveClass("auth-bot-proof-background");
  await act(async () => checkoutOptions["expired-callback"]());
  expect(pending).toHaveBeenLastCalledWith(true);
  expect(token.mock.calls.slice(-2)).toEqual([["checkout-proof"], [""]]);
  checkout.unmount();
  checkoutOptions.callback("stale-checkout-proof");
  expect(token).toHaveBeenCalledTimes(5);
});
