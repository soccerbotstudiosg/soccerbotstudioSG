import { useState } from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  cleanup,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import { BookingProvider, useBooking } from "./provider";
import { ReviewStep } from "./review-step";
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
  const visibility: IntersectionObserverCallback[] = [];
  const disconnect = vi.fn();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: IntersectionObserverCallback) {
        visibility.push(callback);
      }
      observe() {}
      disconnect = disconnect;
    },
  );
  const user = userEvent.setup();
  render(
    <BookingProvider>
      <DetailsStep />
    </BookingProvider>,
  );
  expect(screen.getByRole("button", { name: "Review Booking" })).toBeDisabled();
  for (const label of [/Full name/, /Email address/, /Mobile number/])
    expect(screen.getByLabelText(label)).toHaveAttribute(
      "aria-invalid",
      "false",
    );
  expect(screen.getAllByRole("textbox")).toHaveLength(4);
  expect(screen.getAllByRole("combobox")).toHaveLength(1);
  expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  for (const [label, value, message] of [
    [/Full name/, " ", "Enter the booking contact’s full name."],
    [/Email address/, "name@domain", "Enter a valid email address."],
    [
      /Mobile number/,
      "abc",
      "Remove invalid characters or extra digits from the mobile number.",
    ],
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
  expect(screen.getByRole("button", { name: "Review Booking" })).toBeDisabled();
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
  const reviewButton = screen.getByRole("button", { name: "Review Booking" });
  const confirmEmail = screen.getByRole("button", {
    name: "Confirm email address is correct",
  });
  expect(
    screen.getByText(
      "Please double-check your email address, then confirm by selecting the exclamation mark.",
    ),
  ).toBeVisible();
  expect(reviewButton).toBeDisabled();
  fireEvent.submit(document.getElementById("details-form")!);
  expect(mocks.push).not.toHaveBeenCalled();
  await user.click(confirmEmail);
  expect(confirmEmail).toHaveAttribute("aria-pressed", "true");
  expect(reviewButton).toBeEnabled();
  const action = reviewButton.parentElement!;
  expect(action).not.toHaveAttribute("data-halo");
  const notify = visibility.at(-1)!;
  act(() =>
    notify(
      [
        {
          isIntersecting: true,
          intersectionRatio: 0.5,
        } as IntersectionObserverEntry,
      ],
      {} as IntersectionObserver,
    ),
  );
  expect(action).not.toHaveAttribute("data-halo");
  act(() =>
    notify(
      [
        {
          isIntersecting: true,
          intersectionRatio: 1,
        } as IntersectionObserverEntry,
      ],
      {} as IntersectionObserver,
    ),
  );
  expect(action).toHaveAttribute("data-halo", "true");
  expect(disconnect).toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText(/Email address/), {
    target: { value: "changed@example.com" },
  });
  expect(confirmEmail).toHaveAttribute("aria-pressed", "false");
  expect(reviewButton).toBeDisabled();
  expect(action).not.toHaveAttribute("data-halo");
  act(() =>
    notify(
      [
        {
          isIntersecting: true,
          intersectionRatio: 1,
        } as IntersectionObserverEntry,
      ],
      {} as IntersectionObserver,
    ),
  );
  expect(action).not.toHaveAttribute("data-halo");
  fireEvent.change(screen.getByLabelText(/Email address/), {
    target: { value: "customer@example.com" },
  });
  expect(reviewButton).toBeDisabled();
  await user.click(confirmEmail);
  expect(reviewButton).toBeEnabled();
  expect(
    screen.getByRole("button", { name: "Review Booking" }).parentElement,
  ).toHaveAttribute("data-ready-animation", "true");
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
  expect(mocks.push).toHaveBeenCalledWith("/book/review/");
  expect(screen.queryByText("Saving details…")).toBeNull();
  expect(
    document.querySelector(".page-loading, .booking-flow-overlay"),
  ).toBeNull();
  expect(screen.getByLabelText(/Full name/)).toBeEnabled();
  await user.type(screen.getByLabelText(/Full name/), " Edited");
  expect(saveProfile.mock.calls[0][1].aborted).toBe(true);
  await act(async () => finish());
  expect(screen.queryByText("Details saved.")).not.toBeInTheDocument();
  expect(screen.getByLabelText(/Full name/)).toHaveValue(
    "First Contact Edited",
  );
  expect(mocks.push).toHaveBeenCalledExactlyOnceWith("/book/review/");
});
test("verified details advances immediately and reports background save failure on review", async () => {
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
      <ReviewStep />
    </BookingProvider>,
  );
  await user.click(screen.getByRole("button", { name: "Choose member" }));
  await user.click(screen.getByRole("button", { name: "Review Booking" }));
  expect(mocks.push).toHaveBeenCalledWith("/book/review/");
  await user.click(screen.getByRole("button", { name: "Review Booking" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "We couldn’t save your details",
  );
  expect(screen.getByLabelText(/Full name/)).toHaveValue("Shared Contact");
  expect(mocks.push).toHaveBeenCalledTimes(2);
  await user.click(screen.getByRole("button", { name: "Try again" }));
  expect(
    screen.queryByText("We couldn’t save your details. Please try again."),
  ).toBeNull();
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

test("invalid saved contacts remain editable in booking details and contact management", async () => {
  for (const profileOnly of [false, true]) {
    const saveProfile = vi
      .fn<CustomerIdentityService["saveProfile"]>()
      .mockResolvedValue(undefined);
    const identity = {
      ...demoCustomerIdentity,
      current: () => ({
        email: "saved@example.com",
        expiresAt: Date.now() + 600000,
        remember: true,
      }),
      saveProfile,
    };
    function SavedEditor() {
      const { update } = useBooking();
      const [open, setOpen] = useState(false);
      return open ? (
        <DetailsStep profileOnly={profileOnly} />
      ) : (
        <button
          onClick={() => {
            update({
              mode: "member",
              accountEmail: "saved@example.com",
              contact: {
                name: "Test\tCustomer",
                email: "saved@example.com",
                phone: "81234567",
                contactMethod: "email",
                academy: "",
              },
            });
            setOpen(true);
          }}
        >
          Open saved contact
        </button>
      );
    }
    render(
      <BookingProvider identityService={identity}>
        <SavedEditor />
      </BookingProvider>,
    );
    fireEvent.click(screen.getByText("Open saved contact"));
    const name = screen.getByLabelText(/Full name/);
    expect(name).not.toBeDisabled();
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(/Email address/)).toHaveAttribute(
      "maxlength",
      "254",
    );
    fireEvent.submit(document.getElementById("details-form")!);
    expect(name).toHaveFocus();
    expect(saveProfile).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
    fireEvent.change(name, { target: { value: "J" } });
    expect(name).toHaveAttribute("aria-invalid", "true");
    fireEvent.change(name, { target: { value: "José O’Neill 王" } });
    expect(name).toHaveAttribute("aria-invalid", "false");
    expect(
      screen.queryByText("Enter the booking contact’s full name."),
    ).toBeNull();
    cleanup();
    sessionStorage.clear();
  }
});
