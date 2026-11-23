import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { expect, test, vi } from "vitest";
import { services } from "@/services";
import { EnquiryPage } from "./enquiry-page";
const navigation = vi.hoisted(() => ({ replace: vi.fn(), pathname: "/" }));
vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
  usePathname: () => navigation.pathname,
}));

test("enquiry waits for hydration then preserves entered details through submission", async () => {
  const container = document.createElement("div");
  const markup = new DOMParser().parseFromString(
    renderToString(<EnquiryPage />),
    "text/html",
  );
  expect(markup.querySelector("address")?.textContent).toBe(
    "201 Henderson Road, #05-01 Apex @ Henderson, Singapore 159545",
  );
  expect(markup.body.textContent).toContain("Open daily · 12pm–8pm");
  expect(
    markup.querySelector(
      '.enquiry-contact-links a[href="mailto:contact@soccerbotsg.com"]',
    ),
  ).not.toBeNull();
  expect(
    markup.querySelector('.enquiry-contact-links a[href="tel:+6590143819"]'),
  ).not.toBeNull();
  expect(
    markup.querySelector(
      '.enquiry-contact-links a[href="https://wa.me/6590143819"]',
    ),
  ).not.toBeNull();
  expect(markup.querySelector(".enquiry-page > .back")).toBeNull();
  container.append(...markup.body.childNodes);
  document.body.append(container);
  const name = screen.getByLabelText("Full name", { exact: false });
  const controls = container.querySelectorAll(
    "input, select, textarea, button",
  );
  expect(controls).toHaveLength(11);
  for (const control of controls) expect(control).toBeDisabled();

  const hydrationErrors: unknown[] = [];
  await act(async () => {
    render(<EnquiryPage />, {
      container,
      hydrate: true,
      onRecoverableError: (error) => hydrationErrors.push(error),
    });
  });
  expect(hydrationErrors).toEqual([]);
  expect(screen.getByLabelText("Full name", { exact: false })).toBe(name);
  for (const control of controls) expect(control).toBeEnabled();

  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Send enquiry" }));
  expect(name).toBeInvalid();
  expect(screen.queryByText("Preview · No enquiry sent.")).toBeNull();
  fireEvent.change(name, { target: { value: "Demo Customer" } });
  fireEvent.change(screen.getByLabelText("Email address", { exact: false }), {
    target: { value: "demo@example.com" },
  });
  expect(name).toHaveValue("Demo Customer");
  fireEvent.change(screen.getByLabelText("Mobile number", { exact: false }), {
    target: { value: "+65 8123 4567" },
  });
  await user.selectOptions(
    screen.getByLabelText("Enquiry type", { exact: false }),
    "Corporate booking",
  );
  fireEvent.change(
    screen.getByLabelText("Your requirements", { exact: false }),
    {
      target: { value: "A group session for our team." },
    },
  );
  expect(screen.getByRole("button", { name: "Send enquiry" })).toBeEnabled();
  const submit = vi
    .spyOn(services.enquiry, "submit")
    .mockRejectedValueOnce(
      new Error("SQLITE_FULL internal request identity=private"),
    );
  await user.click(screen.getByRole("button", { name: "Send enquiry" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "We couldn’t send your enquiry. Please try again or contact the studio.",
  );
  expect(screen.getByRole("alert")).toHaveClass("alert");
  expect(screen.queryByText(/SQLITE_FULL|identity=private/)).toBeNull();
  expect(name).toHaveValue("Demo Customer");
  const failedKey = submit.mock.calls[0][1]?.key;
  submit.mockRestore();
  const retry = vi.spyOn(services.enquiry, "submit");
  await user.click(screen.getByRole("button", { name: "Send enquiry" }));
  expect(retry.mock.calls[0][1]?.key).toBe(failedKey);
  expect(await screen.findByText("Preview · No enquiry sent.")).toBeVisible();
  expect(navigation.replace).not.toHaveBeenCalled();
  expect(screen.queryByText("demo@example.com")).toBeNull();
  expect(screen.getByLabelText("Full name", { exact: false })).toHaveValue("");
  expect(screen.getByRole("button", { name: "Send enquiry" })).toBeEnabled();
  for (const [label, text] of [
    ["Full name", "Demo Customer"],
    ["Email address", "demo@example.com"],
    ["Mobile number", "+65 8123 4567"],
    ["Your requirements", "A group session for our team."],
  ]) {
    fireEvent.change(screen.getByLabelText(label, { exact: false }), {
      target: { value: text },
    });
  }
  await user.selectOptions(
    screen.getByLabelText("Enquiry type", { exact: false }),
    "Corporate booking",
  );
  await user.click(screen.getByRole("button", { name: "Send enquiry" }));
  expect(retry).toHaveBeenCalledTimes(2);
  expect(retry.mock.calls[1][1]?.key).not.toBe(failedKey);
  retry.mockRestore();
});

test("enquiry reveals errors after blur or submission and blocks invalid service submission", () => {
  const frames: FrameRequestCallback[] = [];
  const raf = vi
    .spyOn(window, "requestAnimationFrame")
    .mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
  const scroll = vi.spyOn(window, "scrollBy").mockImplementation(() => {});
  render(<EnquiryPage />);
  expect(screen.getByRole("button", { name: "Send enquiry" })).toBeEnabled();
  const submit = vi.spyOn(services.enquiry, "submit");
  expect(screen.queryByRole("link", { name: /^Home$/ })).toBeNull();
  expect(
    screen.getByRole("heading", { name: /^Contact the studio$/ }),
  ).toBeVisible();
  for (const removed of [
    "Tell us about your special arrangements or reservation.",
    "Choose the option that best describes your enquiry.",
    "Your preferred date, subject to availability.",
    "Your preferred time in Singapore time (SGT).",
    "Enter 1–2,000 characters.",
  ])
    expect(screen.queryByText(removed)).toBeNull();
  expect(
    screen.getByLabelText("Your requirements", { exact: false }),
  ).not.toHaveAttribute("aria-describedby");
  expect(
    screen.getByLabelText("Preferred date", { exact: false }),
  ).toHaveAccessibleDescription("Select a date.");
  expect(
    screen.getByLabelText("Preferred time", { exact: false }),
  ).toHaveAccessibleDescription("Select a time (SGT).");
  for (const label of [
    "Full name",
    "Email address",
    "Mobile number",
    "Enquiry type",
    "Your requirements",
  ]) {
    expect(screen.getByLabelText(label, { exact: false })).toHaveAttribute(
      "aria-invalid",
      "false",
    );
  }
  expect(screen.getByLabelText(/Academy, school/)).toHaveAttribute(
    "aria-invalid",
    "false",
  );
  const name = screen.getByLabelText("Full name", { exact: false });
  expect(name).toHaveAttribute("aria-invalid", "false");
  fireEvent.change(name, { target: { value: "John★" } });
  expect(name).toHaveAttribute("aria-invalid", "false");
  fireEvent.blur(name);
  expect(name).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByText("Enter your full name.")).toBeVisible();
  fireEvent.change(name, { target: { value: "John Doe" } });
  expect(name).toHaveAttribute("aria-invalid", "false");
  const organisation = screen.getByLabelText(/Academy, school/);
  expect(organisation).toHaveAttribute(
    "placeholder",
    "International Sports School",
  );
  fireEvent.change(organisation, { target: { value: "School★" } });
  expect(organisation).toHaveAttribute("aria-invalid", "false");
  fireEvent.blur(organisation);
  expect(organisation).toHaveAttribute("aria-invalid", "true");
  fireEvent.submit(
    screen.getByRole("button", { name: "Send enquiry" }).closest("form")!,
  );
  expect(submit).not.toHaveBeenCalled();
  expect(
    screen.getByLabelText("Email address", { exact: false }),
  ).toHaveFocus();
  const email = screen.getByLabelText("Email address", { exact: false });
  const box = vi.spyOn(email, "getBoundingClientRect").mockReturnValue({
    top: -120,
    bottom: -76,
    height: 44,
  } as DOMRect);
  act(() => frames.splice(0).forEach((callback) => callback(0)));
  expect(scroll).toHaveBeenCalledWith({ top: -136, behavior: "instant" });
  box.mockRestore();
  raf.mockRestore();
  scroll.mockRestore();
  expect(screen.getByText("Please tell us what you need.")).toBeVisible();
  const requirements = screen.getByLabelText("Your requirements", {
    exact: false,
  });
  expect(requirements).toHaveAttribute(
    "aria-describedby",
    "enquiry-message-error",
  );
  fireEvent.change(requirements, { target: { value: "A group session." } });
  expect(screen.queryByText("Please tell us what you need.")).toBeNull();
  submit.mockRestore();
});

test("enquiry acknowledgement stays beneath the heading until editing or leaving", async () => {
  const submit = vi
    .spyOn(services.enquiry, "submit")
    .mockResolvedValue({ email: "demo@example.com", delivered: true });
  const view = render(<EnquiryPage />);
  for (const [label, value] of [
    ["Full name", "Demo Customer"],
    ["Email address", "demo@example.com"],
    ["Mobile number", "+65 8123 4567"],
    ["Enquiry type", "Corporate booking"],
    ["Your requirements", "A group session for our team."],
  ])
    fireEvent.change(screen.getByLabelText(label, { exact: false }), {
      target: { value },
    });
  await act(async () =>
    fireEvent.submit(
      screen.getByRole("button", { name: "Send enquiry" }).closest("form")!,
    ),
  );
  const notice = screen.getByRole("status");
  expect(notice).toHaveClass("notice", "success");
  expect(notice).toHaveTextContent(
    "Enquiry sent. We’ll reach out as soon as we can.",
  );
  expect(notice).toHaveFocus();
  expect(
    screen.getByRole("heading", { name: "Contact the studio" }).parentElement
      ?.nextElementSibling,
  ).toBe(notice);
  expect(navigation.replace).not.toHaveBeenCalled();
  vi.useFakeTimers();
  try {
    act(() => vi.advanceTimersByTime(10000));
    expect(notice).toBeVisible();
  } finally {
    vi.useRealTimers();
  }
  fireEvent.change(screen.getByLabelText("Full name", { exact: false }), {
    target: { value: "Another Enquiry" },
  });
  expect(screen.queryByRole("status")).toBeNull();
  view.unmount();
  render(<EnquiryPage />);
  expect(screen.queryByRole("status")).toBeNull();
  submit.mockRestore();
});
