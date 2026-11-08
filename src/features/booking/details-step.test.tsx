import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import { BookingProvider, useBooking } from "./provider";
import { DetailsStep } from "./details-step";
import { demoCustomerIdentity } from "@/services/demo/identity";
import type { CustomerIdentityService } from "@/services/contracts";

const mocks = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: mocks.push }),
}));
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  mocks.push.mockClear();
});

test("details contains only the five contact fields and validates them before review", async () => {
  const user = userEvent.setup();
  render(
    <BookingProvider>
      <DetailsStep />
    </BookingProvider>,
  );
  expect(screen.getAllByRole("textbox")).toHaveLength(4);
  expect(screen.getAllByRole("combobox")).toHaveLength(1);
  expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  for (const [label, value, message] of [
    [/Full name/, " ", "Enter the booking contact’s full name."],
    [/Email address/, "name@domain", "Enter a valid email address."],
    [/Mobile number/, "abc", "Enter a valid mobile number."],
  ] as const) {
    const input = screen.getByLabelText(label);
    fireEvent.change(input, { target: { value } });
    fireEvent.blur(input);
    expect(screen.getByText(message)).toBeVisible();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(mocks.push).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: "" } });
  }

  const academy = screen.getByLabelText(/Academy \/ school/);
  fireEvent.change(academy, { target: { value: "a".repeat(121) } });
  fireEvent.blur(academy);
  expect(screen.getByText("Use no more than 120 characters.")).toBeVisible();
  fireEvent.change(academy, { target: { value: "" } });
  fireEvent.blur(academy);
  expect(academy).toHaveAttribute("aria-invalid", "false");
  const method = screen.getByLabelText(/Preferred contact method/);
  fireEvent.change(method, { target: { value: "" } });
  fireEvent.blur(method);
  expect(screen.getByText("Select a contact method.")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Review Booking" }));
  expect(screen.getByLabelText(/Full name/)).toHaveFocus();
  expect(mocks.push).not.toHaveBeenCalled();
  await user.type(screen.getByLabelText(/Full name/), "Demo Customer");
  await user.type(
    screen.getByLabelText(/Email address/),
    "customer@example.com",
  );
  await user.type(screen.getByLabelText(/Mobile number/), "+65 8123 4567");
  await user.selectOptions(
    screen.getByLabelText(/Preferred contact method/),
    "whatsapp",
  );
  await user.type(screen.getByLabelText(/Academy \/ school/), "Demo Academy");
  await user.click(screen.getByRole("button", { name: "Review Booking" }));
  expect(mocks.push).toHaveBeenCalledExactlyOnceWith("/book/review/");
});

test("verified details saves only on explicit action and ignores completion after editing", async () => {
  const user = userEvent.setup();
  let finish!: () => void;
  const saveProfile = vi.fn<CustomerIdentityService["saveProfile"]>(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  const identity = {
    ...demoCustomerIdentity,
    current: () => ({
      email: "shared@example.invalid",
      expiresAt: Date.now() + 600000,
      remember: true,
    }),
    saveProfile,
  };
  function ChooseMember() {
    const { update } = useBooking();
    return (
      <button
        onClick={() =>
          update({
            mode: "member",
            accountEmail: "shared@example.invalid",
            contact: {
              name: "First Contact",
              email: "shared@example.invalid",
              phone: "+65 8123 4567",
              contactMethod: "email",
              academy: "",
            },
          })
        }
      >
        Choose member
      </button>
    );
  }
  render(
    <BookingProvider identityService={identity}>
      <ChooseMember />
      <DetailsStep />
    </BookingProvider>,
  );
  await user.click(screen.getByRole("button", { name: "Choose member" }));
  expect(saveProfile).not.toHaveBeenCalled();
  expect(
    screen.getByText(/Anyone using this verified email shares/),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Review Booking" }));
  expect(saveProfile).toHaveBeenCalledTimes(1);
  expect(
    screen.getByRole("button", { name: "Saving details…" }),
  ).toBeDisabled();
  await user.type(screen.getByLabelText(/Full name/), " Edited");
  expect(saveProfile.mock.calls[0][1].aborted).toBe(true);
  await act(async () => finish());
  expect(screen.queryByText("Details saved.")).not.toBeInTheDocument();
  expect(screen.getByLabelText(/Full name/)).toHaveValue(
    "First Contact Edited",
  );
  expect(mocks.push).not.toHaveBeenCalled();
});
test("verified details reports an explicit save and retains editable contact on failure", async () => {
  const user = userEvent.setup();
  const saveProfile = vi
    .fn()
    .mockResolvedValueOnce(undefined)
    .mockRejectedValueOnce(new Error("unavailable"));
  function ChooseMember() {
    const { update } = useBooking();
    return (
      <button
        onClick={() =>
          update({
            mode: "member",
            accountEmail: "shared@example.invalid",
            contact: {
              name: "Shared Contact",
              email: "shared@example.invalid",
              phone: "+65 8123 4567",
              contactMethod: "email",
              academy: "",
            },
          })
        }
      >
        Choose member
      </button>
    );
  }
  render(
    <BookingProvider
      identityService={{
        ...demoCustomerIdentity,
        current: () => ({
          email: "shared@example.invalid",
          expiresAt: Date.now() + 600000,
          remember: true,
        }),
        saveProfile,
      }}
    >
      <ChooseMember />
      <DetailsStep />
    </BookingProvider>,
  );
  await user.click(screen.getByRole("button", { name: "Choose member" }));
  await user.click(screen.getByRole("button", { name: "Review Booking" }));
  expect(await screen.findByRole("status")).toHaveTextContent("Details saved.");
  await user.click(screen.getByRole("button", { name: "Review Booking" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "We couldn’t save your details",
  );
  expect(screen.getByLabelText(/Full name/)).toHaveValue("Shared Contact");
  expect(mocks.push).toHaveBeenCalledExactlyOnceWith("/book/review/");
});

test("verified opt-out details submit without saving a contact profile", async () => {
  const user = userEvent.setup(),
    saveProfile = vi.fn();
  function ChooseMember() {
    const { update } = useBooking();
    return (
      <button
        onClick={() =>
          update({
            mode: "member",
            accountEmail: "shared@example.invalid",
            contact: {
              name: "Booking Only",
              email: "shared@example.invalid",
              phone: "+65 8123 4567",
              contactMethod: "email",
              academy: "",
            },
          })
        }
      >
        Choose member
      </button>
    );
  }
  render(
    <BookingProvider
      identityService={{
        ...demoCustomerIdentity,
        current: () => ({
          email: "shared@example.invalid",
          expiresAt: Date.now() + 600000,
          remember: false,
        }),
        saveProfile,
      }}
    >
      <ChooseMember />
      <DetailsStep />
    </BookingProvider>,
  );
  await user.click(screen.getByRole("button", { name: "Choose member" }));
  expect(
    screen.queryByRole("button", { name: "Save contact details" }),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Review Booking" }));
  expect(saveProfile).not.toHaveBeenCalled();
  expect(mocks.push).toHaveBeenCalledExactlyOnceWith("/book/review/");
});
