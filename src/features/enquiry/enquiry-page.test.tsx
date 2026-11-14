import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { expect, test, vi } from "vitest";
import { services } from "@/services";
import { EnquiryPage } from "./enquiry-page";
import { EnquiryNoticeProvider, useEnquiryNotice } from "./enquiry-notice";
const navigation = vi.hoisted(() => ({ replace: vi.fn(), pathname: "/" }));
vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
  usePathname: () => navigation.pathname,
}));
function Enquiry() {
  return (
    <EnquiryNoticeProvider>
      <EnquiryPage />
    </EnquiryNoticeProvider>
  );
}

test("enquiry waits for hydration then preserves entered details through submission", async () => {
  const container = document.createElement("div");
  const markup = new DOMParser().parseFromString(
    renderToString(<Enquiry />),
    "text/html",
  );
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
    render(<Enquiry />, {
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
  expect(navigation.replace).toHaveBeenLastCalledWith("/");
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

test("enquiry validates edits immediately and blocks invalid service submission", () => {
  render(<Enquiry />);
  const submit = vi.spyOn(services.enquiry, "submit");
  expect(screen.getByRole("link", { name: /^Home$/ })).toHaveAttribute(
    "href",
    "/",
  );
  expect(
    screen.getByRole("heading", { name: /^Contact the studio$/ }),
  ).toBeVisible();
  for (const removed of [
    "Tell us about your special arrangements or reservation.",
    "Choose the option that best describes your enquiry.",
    "Your preferred date, subject to availability.",
    "Your preferred time in Singapore time (SGT).",
    "Enter your requirements using 1–2,000 characters.",
  ])
    expect(screen.queryByText(removed)).toBeNull();
  expect(
    screen.getByLabelText("Your requirements", { exact: false }),
  ).not.toHaveAttribute("aria-describedby");
  expect(
    screen.getByLabelText("Preferred date", { exact: false }),
  ).not.toHaveAttribute("aria-describedby");
  expect(
    screen.getByLabelText("Preferred time", { exact: false }),
  ).not.toHaveAttribute("aria-describedby");
  for (const label of [
    "Full name",
    "Email address",
    "Mobile number",
    "Enquiry type",
    "Your requirements",
  ]) {
    expect(screen.getByLabelText(label, { exact: false })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  }
  expect(screen.getByLabelText(/Academy, school/)).toHaveAttribute(
    "aria-invalid",
    "false",
  );
  const name = screen.getByLabelText("Full name", { exact: false });
  expect(name).toHaveAttribute("aria-invalid", "true");
  fireEvent.change(name, { target: { value: "John★" } });
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
  expect(organisation).toHaveAttribute("aria-invalid", "true");
  fireEvent.submit(
    screen.getByRole("button", { name: "Send enquiry" }).closest("form")!,
  );
  expect(submit).not.toHaveBeenCalled();
  submit.mockRestore();
});

function Acknowledge() {
  const notify = useEnquiryNotice();
  return <button onClick={() => notify(true)}>Acknowledge delivery</button>;
}
test("enquiry acknowledgement routes Home and expires after ten seconds without replay", () => {
  vi.useFakeTimers();
  try {
    navigation.pathname = "/enquiry/";
    const view = render(
      <EnquiryNoticeProvider>
        <Acknowledge />
      </EnquiryNoticeProvider>,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Acknowledge delivery" }),
    );
    expect(navigation.replace).toHaveBeenLastCalledWith("/");
    expect(screen.queryByRole("status")).toBeNull();
    navigation.pathname = "/";
    view.rerender(
      <EnquiryNoticeProvider>
        <Acknowledge />
      </EnquiryNoticeProvider>,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Your enquiry has been sent successfully.",
    );
    act(() => vi.advanceTimersByTime(9999));
    expect(screen.getByRole("status")).toBeVisible();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByRole("status")).toBeNull();
    view.rerender(
      <EnquiryNoticeProvider>
        <Acknowledge />
      </EnquiryNoticeProvider>,
    );
    expect(screen.queryByRole("status")).toBeNull();
  } finally {
    navigation.pathname = "/";
    vi.useRealTimers();
  }
});
