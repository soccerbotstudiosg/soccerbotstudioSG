import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { BookingPage } from "./booking-page";
import { blankDraft } from "@/domain/booking";
import { saveBooking } from "@/services/storage";
import { BookingProvider } from "./provider";
import { demoCustomerIdentity } from "@/services/demo/identity";
import { liveBookingService } from "@/services/booking";
import { CustomerMessageError } from "@/services/contracts";
import type {
  CustomerIdentityService,
  CustomerChallenge,
} from "@/services/contracts";
const navigation = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => navigation,
}));
test("account waits for owned guest access and duplicate click cannot navigate early", async () => {
  let finish!: () => void;
  const guest = vi
    .fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    )
    .mockRejectedValueOnce(
      new CustomerMessageError(
        "We couldn’t start your booking. Please try again.",
      ),
    );
  navigation.push.mockClear();
  render(
    <BookingProvider identityService={{ ...demoCustomerIdentity, guest }}>
      <BookingPage step="account" />
    </BookingProvider>,
  );
  const button = screen.getByRole("button", { name: /Continue as Guest/ });
  fireEvent.click(button);
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent(
      "We couldn’t start your booking. Please try again.",
    ),
  );
  expect(navigation.push).not.toHaveBeenCalled();
  expect(screen.queryByText(/Email verification unavailable/)).toBeNull();
  fireEvent.click(button);
  fireEvent.click(button);
  expect(
    screen.getByRole("status", { name: "Preparing booking…" }),
  ).toHaveClass("sr-only");
  expect(document.querySelector(".booking-flow-overlay")).toBeNull();
  expect(button.closest("[inert]")).toBeNull();
  expect(button).toHaveTextContent("Preparing booking…");
  expect(document.querySelector(".booking-loading-inline")).toBeNull();
  expect(
    screen.getByRole("button", { name: /Continue with email/ }),
  ).toBeDisabled();
  expect(guest).toHaveBeenCalledTimes(2);
  expect(navigation.push).not.toHaveBeenCalled();
  await act(async () => finish());
  expect(navigation.push).toHaveBeenCalledWith("/book/session/");
});
test("account leaving email challenge ignores delayed completion and live mode never displays demo code", async () => {
  let finish!: (value: CustomerChallenge) => void;
  const challenge = vi.fn(
    () =>
      new Promise<CustomerChallenge>((resolve) => {
        finish = resolve;
      }),
  );
  render(
    <BookingProvider
      identityService={{ ...demoCustomerIdentity, mode: "live", challenge }}
    >
      <BookingPage step="account" />
    </BookingProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: /Continue with email/ }));
  for (const invalid of [
    "",
    "missing-at.example.com",
    "name@domain",
    "name @example.com",
  ]) {
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: invalid },
    });
    fireEvent.blur(screen.getByLabelText("Email address"));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter a valid email address.",
    );
    fireEvent.submit(
      screen
        .getByRole("button", { name: /Continue with email/ })
        .closest("form")!,
    );
    expect(challenge).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Email address")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  }
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "synthetic@example.invalid" },
  });
  fireEvent.submit(
    screen
      .getByRole("button", { name: /Continue with email/ })
      .closest("form")!,
  );
  fireEvent.click(screen.getByRole("button", { name: "Back" }));
  await act(async () =>
    finish({
      email: "synthetic@example.invalid",
      challengeId: "synthetic-id",
      expiresAt: Date.now() + 600000,
      resendAfter: 0,
    }),
  );
  expect(
    screen.getByRole("heading", { name: "Start your booking" }),
  ).toBeInTheDocument();
  expect(screen.queryByText(/Demo code/)).not.toBeInTheDocument();
});

test("signed-in customer manages saved contact on Account without entering unavailable booking steps", async () => {
  navigation.push.mockClear();
  const verified = {
    email: "shared@example.invalid",
    expiresAt: Date.now() + 600000,
    remember: true,
  };
  const profile = vi.fn().mockResolvedValue({
    name: "Shared Contact",
    email: verified.email,
    phone: "+65 8123 4567",
    contactMethod: "email",
    academy: "",
  });
  const saveProfile = vi.fn().mockResolvedValue(undefined);
  const refresh = vi.fn().mockResolvedValue(verified);
  render(
    <BookingProvider
      bookingService={liveBookingService}
      identityService={{
        ...demoCustomerIdentity,
        mode: "live",
        current: () => verified,
        refresh,
        profile,
        saveProfile,
      }}
    >
      <BookingPage step="account" />
    </BookingProvider>,
  );
  const manage = await screen.findByRole("button", {
    name: "Manage saved contact",
  });
  fireEvent.click(manage);
  expect(
    await screen.findByRole("heading", { name: "Saved contact details" }),
  ).toBeInTheDocument();
  expect(profile).toHaveBeenCalledExactlyOnceWith(
    verified.email,
    expect.any(AbortSignal),
  );
  expect(refresh).toHaveBeenCalledTimes(2);
  expect(screen.getByLabelText("Full name *")).toHaveValue("Shared Contact");
  expect(screen.getByLabelText("Email address (verified) *")).toHaveAttribute(
    "readonly",
  );
  expect(
    screen.queryByRole("button", { name: /^Review Booking \$[\d,.]+$/ }),
  ).not.toBeInTheDocument();
  expect(screen.queryByLabelText(/Preferred contact/)).not.toBeInTheDocument();
  expect(saveProfile).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Full name *"), {
    target: { value: "Updated Contact" },
  });
  expect(saveProfile).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Save contact details" }));
  await screen.findByRole("heading", { name: "Start your booking" });
  expect(
    screen.queryByRole("heading", { name: "Saved contact details" }),
  ).not.toBeInTheDocument();
  expect(saveProfile).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({ name: "Updated Contact", email: verified.email }),
    expect.any(AbortSignal),
  );
  expect(navigation.push).not.toHaveBeenCalled();
  expect(
    screen.getByRole("heading", { name: "Start your booking" }),
  ).toBeInTheDocument();
});
test("saved-contact entry revalidates expired identity before loading private details", async () => {
  const verified = {
    email: "expired@example.invalid",
    expiresAt: Date.now() + 600000,
    remember: true,
  };
  const refresh = vi
    .fn()
    .mockResolvedValueOnce(verified)
    .mockResolvedValueOnce(null);
  const profile = vi.fn();
  render(
    <BookingProvider
      identityService={{
        ...demoCustomerIdentity,
        current: () => verified,
        refresh,
        profile,
      }}
    >
      <BookingPage step="account" />
    </BookingProvider>,
  );
  await act(async () => {});
  fireEvent.click(screen.getByRole("button", { name: "Manage saved contact" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Select Remember me and verify your email to save details.",
  );
  expect(profile).not.toHaveBeenCalled();
  expect(
    screen.queryByRole("button", { name: "Manage saved contact" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("heading", { name: "Saved contact details" }),
  ).not.toBeInTheDocument();
});
test("leaving saved-contact form discards delayed save acknowledgement", async () => {
  const verified = {
    email: "saved@example.invalid",
    expiresAt: Date.now() + 600000,
    remember: true,
  };
  let finish!: () => void;
  const saveProfile = vi.fn<CustomerIdentityService["saveProfile"]>(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  render(
    <BookingProvider
      identityService={{
        ...demoCustomerIdentity,
        current: () => verified,
        refresh: async () => verified,
        profile: async () => ({
          name: "Saved Contact",
          email: verified.email,
          phone: "+65 8123 4567",
          contactMethod: "email",
          academy: "",
        }),
        saveProfile,
      }}
    >
      <BookingPage step="account" />
    </BookingProvider>,
  );
  await act(async () => {});
  fireEvent.click(screen.getByRole("button", { name: "Manage saved contact" }));
  await screen.findByRole("heading", { name: "Saved contact details" });
  fireEvent.click(screen.getByRole("button", { name: "Save contact details" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Back to booking options" }),
  );
  expect(saveProfile.mock.calls[0][1].aborted).toBe(true);
  await act(async () => finish());
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Start your booking" }),
  ).toBeInTheDocument();
});

test("all-device signout shows failure, permits retry and clears the signed-in email on success", async () => {
  const identity = {
    email: "signout@example.invalid",
    expiresAt: Date.now() + 600000,
    remember: true,
  };
  const signOut = vi
    .fn()
    .mockRejectedValueOnce(new Error("SQLITE_FULL private provider diagnostic"))
    .mockResolvedValueOnce(undefined);
  render(
    <BookingProvider
      identityService={{
        ...demoCustomerIdentity,
        mode: "live",
        current: () => identity,
        refresh: async () => identity,
        signOut,
      }}
    >
      <BookingPage step="account" />
    </BookingProvider>,
  );
  await act(async () => {});
  fireEvent.click(screen.getByRole("button", { name: "Sign out all devices" }));
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent(
      "We couldn’t continue. Please try again.",
    ),
  );
  expect(
    screen.queryByText(/SQLITE_FULL|private provider diagnostic/),
  ).toBeNull();
  expect(screen.getByRole("alert")).toHaveClass("alert");
  expect(
    within(screen.getByLabelText("Booking identity")).getByText(identity.email),
  ).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Sign out all devices" }));
  await waitFor(() =>
    expect(screen.queryByText(identity.email)).not.toBeInTheDocument(),
  );
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(signOut).toHaveBeenCalledTimes(2);
  expect(signOut).toHaveBeenLastCalledWith(expect.any(AbortSignal), true);
});

test("switching email clears the old account and supports back guest and fresh remembered sign-in paths", async () => {
  navigation.push.mockClear();
  let current: ReturnType<CustomerIdentityService["current"]> = {
    email: "old@example.invalid",
    expiresAt: Date.now() + 600000,
    remember: true,
  };
  const signOut = vi.fn(async () => {
    current = null;
  });
  const verify = vi.fn<CustomerIdentityService["verify"]>(
    async (challenge, _code, remember) => {
      current = {
        email: challenge.email,
        expiresAt: Date.now() + 600000,
        remember,
      };
      return current;
    },
  );
  const service: CustomerIdentityService = {
    ...demoCustomerIdentity,
    mode: "live",
    current: () => current,
    refresh: async () => current,
    signOut,
    verify,
    profile: async () => null,
    challenge: async (email) => ({
      email,
      challengeId: "synthetic-new",
      expiresAt: Date.now() + 600000,
      resendAfter: 0,
    }),
  };
  render(
    <BookingProvider identityService={service}>
      <BookingPage step="account" />
    </BookingProvider>,
  );
  await act(async () => {});
  fireEvent.click(screen.getByRole("button", { name: "Use another email" }));
  await screen.findByRole("heading", { name: "Continue with email" });
  expect(signOut).toHaveBeenCalledExactlyOnceWith(expect.any(AbortSignal));
  expect(screen.getByLabelText("Email address")).toHaveValue("");
  expect(screen.getByLabelText("Remember me")).not.toBeChecked();
  fireEvent.click(screen.getByRole("button", { name: "Back" }));
  expect(
    screen.getByRole("button", { name: "Continue as Guest" }),
  ).toBeEnabled();
  expect(screen.queryByText("old@example.invalid")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Continue with email" }));
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "new@example.invalid" },
  });
  fireEvent.click(screen.getByLabelText("Remember me"));
  fireEvent.submit(
    screen
      .getByRole("button", { name: "Continue with email" })
      .closest("form")!,
  );
  await screen.findByLabelText("Verification code");
  fireEvent.change(screen.getByLabelText("Verification code"), {
    target: { value: "123456" },
  });
  fireEvent.submit(
    screen
      .getByRole("button", { name: "Verify and continue" })
      .closest("form")!,
  );
  await waitFor(() =>
    expect(navigation.push).toHaveBeenCalledWith("/book/session/"),
  );
  expect(verify).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({ email: "new@example.invalid" }),
    "123456",
    true,
    expect.any(AbortSignal),
  );
  fireEvent.click(screen.getByRole("button", { name: "Back" }));
  expect(
    within(screen.getByLabelText("Booking identity")).getByText(
      "new@example.invalid",
    ),
  ).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Manage saved contact" }),
  ).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Sign out all devices" }));
  await waitFor(() =>
    expect(screen.queryByText("new@example.invalid")).not.toBeInTheDocument(),
  );
  expect(signOut).toHaveBeenLastCalledWith(expect.any(AbortSignal), true);
  fireEvent.click(screen.getByRole("button", { name: "Continue with email" }));
  expect(screen.getByLabelText("Email address")).toHaveValue("");
  expect(screen.getByLabelText("Remember me")).not.toBeChecked();
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "new@example.invalid" },
  });
  fireEvent.submit(
    screen
      .getByRole("button", { name: "Continue with email" })
      .closest("form")!,
  );
  await screen.findByLabelText("Verification code");
  fireEvent.change(screen.getByLabelText("Verification code"), {
    target: { value: "123456" },
  });
  fireEvent.submit(
    screen
      .getByRole("button", { name: "Verify and continue" })
      .closest("form")!,
  );
  await waitFor(() => expect(verify).toHaveBeenCalledTimes(2));
  expect(verify).toHaveBeenLastCalledWith(
    expect.objectContaining({ email: "new@example.invalid" }),
    "123456",
    false,
    expect.any(AbortSignal),
  );
  fireEvent.click(screen.getByRole("button", { name: "Back" }));
  expect(
    within(screen.getByLabelText("Booking identity")).getByText(
      "new@example.invalid",
    ),
  ).toBeVisible();
  expect(
    screen.queryByRole("button", { name: "Manage saved contact" }),
  ).not.toBeInTheDocument();
});

test("expired continue-signed-in state returns a usable email choice instead of trapping the account menu", async () => {
  const identity = {
    email: "expired@example.invalid",
    expiresAt: Date.now() + 600000,
    remember: true,
  };
  const refresh = vi
    .fn()
    .mockResolvedValueOnce(identity)
    .mockResolvedValueOnce(null);
  render(
    <BookingProvider
      identityService={{
        ...demoCustomerIdentity,
        current: () => identity,
        refresh,
      }}
    >
      <BookingPage step="account" />
    </BookingProvider>,
  );
  await act(async () => {});
  fireEvent.click(screen.getByRole("button", { name: "Continue signed in" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Verify your email again.",
  );
  expect(
    screen.queryByRole("button", { name: "Continue signed in" }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Continue with email" }));
  expect(
    screen.getByRole("heading", { name: "Continue with email" }),
  ).toBeVisible();
});

test("failed profile saves keep the form and retry returns to booking options only after success", async () => {
  const identity = {
    email: "saved@example.invalid",
    expiresAt: Date.now() + 600000,
    remember: true,
  };
  const saveProfile = vi
    .fn()
    .mockRejectedValueOnce(new Error("synthetic failure"))
    .mockResolvedValueOnce(undefined);
  render(
    <BookingProvider
      identityService={{
        ...demoCustomerIdentity,
        current: () => identity,
        refresh: async () => identity,
        profile: async () => ({
          name: "Saved Contact",
          email: identity.email,
          phone: "+65 8123 4567",
          contactMethod: "email",
          academy: "",
        }),
        saveProfile,
      }}
    >
      <BookingPage step="account" />
    </BookingProvider>,
  );
  await act(async () => {});
  fireEvent.click(screen.getByRole("button", { name: "Manage saved contact" }));
  await screen.findByRole("heading", { name: "Saved contact details" });
  fireEvent.click(screen.getByRole("button", { name: "Save contact details" }));
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent(
      "We couldn’t save your details",
    ),
  );
  expect(
    screen.getByRole("heading", { name: "Saved contact details" }),
  ).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Save contact details" }));
  await screen.findByRole("heading", { name: "Start your booking" });
  expect(saveProfile).toHaveBeenCalledTimes(2);
});

test("invalid code can change email or return to guest options without carrying an old error", async () => {
  const verify = vi
    .fn()
    .mockRejectedValue(
      new CustomerMessageError("Check your code or request a new one."),
    );
  render(
    <BookingProvider
      identityService={{
        ...demoCustomerIdentity,
        current: () => null,
        refresh: async () => null,
        verify,
        challenge: async (email) => ({
          email,
          challengeId: "synthetic",
          expiresAt: Date.now() + 600000,
          resendAfter: 0,
        }),
      }}
    >
      <BookingPage step="account" />
    </BookingProvider>,
  );
  await act(async () => {});
  fireEvent.click(screen.getByRole("button", { name: "Continue with email" }));
  expect(screen.queryByLabelText("Booking identity")).toBeNull();
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "synthetic@example.invalid" },
  });
  fireEvent.submit(
    screen
      .getByRole("button", { name: "Continue with email" })
      .closest("form")!,
  );
  await screen.findByLabelText("Verification code");
  expect(screen.queryByLabelText("Booking identity")).toBeNull();
  fireEvent.change(screen.getByLabelText("Verification code"), {
    target: { value: "999999" },
  });
  fireEvent.submit(
    screen
      .getByRole("button", { name: "Verify and continue" })
      .closest("form")!,
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Check your code or request a new one",
  );
  fireEvent.click(screen.getByRole("button", { name: "Change email" }));
  expect(screen.queryByLabelText("Booking identity")).toBeNull();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.getByLabelText("Email address")).toHaveValue(
    "synthetic@example.invalid",
  );
  fireEvent.click(screen.getByRole("button", { name: "Back" }));
  expect(screen.queryByLabelText("Booking identity")).toBeNull();
  expect(
    screen.getByRole("button", { name: "Continue as Guest" }),
  ).toBeEnabled();
});

test("booking-options signout retries failure and leaves only after acknowledgement", async () => {
  const verified = {
    email: "header@example.invalid",
    expiresAt: Date.now() + 600000,
    remember: true,
  };
  let current: typeof verified | null = verified;
  let finishSignOut!: () => void;
  const signOut = vi
    .fn<CustomerIdentityService["signOut"]>()
    .mockImplementationOnce(async () => {
      current = null;
      throw new Error("private failure");
    })
    .mockImplementation(
      () =>
        new Promise((resolve) => {
          finishSignOut = resolve;
        }),
    );
  navigation.push.mockClear();
  render(
    <BookingProvider
      identityService={{
        ...demoCustomerIdentity,
        current: () => current,
        refresh: async () => current,
        signOut,
      }}
    >
      <BookingPage step="account" />
    </BookingProvider>,
  );
  await act(async () => {});
  expect(
    within(screen.getByLabelText("Booking identity")).getByText(
      "Email verified",
    ),
  ).toBeVisible();
  expect(
    within(screen.getByLabelText("Booking identity")).getByText(verified.email),
  ).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent(
      "We couldn’t continue. Please try again.",
    ),
  );
  expect(navigation.push).not.toHaveBeenCalled();
  expect(screen.queryByLabelText("Booking identity")).toBeNull();
  fireEvent.click(
    screen.getByRole("button", { name: "Try signing out again" }),
  );
  expect(
    screen.getByRole("button", { name: "Continue as Guest" }),
  ).toBeDisabled();
  expect(navigation.push).not.toHaveBeenCalled();
  await act(async () => finishSignOut());
  expect(signOut).toHaveBeenCalledTimes(2);
  expect(navigation.push).toHaveBeenLastCalledWith("/");
});

test("later booking headings inspect identity without refreshing or recreating guest access", async () => {
  const verified = {
    email: "display@example.invalid",
    expiresAt: Date.now() + 600000,
  };
  let current: typeof verified | null = null;
  const readCurrent = vi.fn(async () => {
    current = verified;
    return current;
  });
  const refresh = vi.fn(async () => {
    throw new Error("Display must not restore access");
  });
  const guest = vi.fn(async () => {});
  saveBooking({
    version: 2,
    draft: { ...blankDraft(), mode: "guest" },
    attempt: null,
  });
  render(
    <BookingProvider
      identityService={{
        ...demoCustomerIdentity,
        current: () => current,
        readCurrent,
        refresh,
        guest,
      }}
    >
      <BookingPage step="session" />
    </BookingProvider>,
  );
  await waitFor(() =>
    expect(screen.getByLabelText("Booking identity")).toHaveTextContent(
      verified.email,
    ),
  );
  expect(readCurrent).toHaveBeenCalledTimes(1);
  expect(refresh).not.toHaveBeenCalled();
  expect(guest).not.toHaveBeenCalled();
  expect(screen.queryByRole("button", { name: "Sign out" })).toBeNull();
});

test("guest identity is shown only after choosing guest and stays hidden on return to booking choices", async () => {
  const guest = vi.fn(async () => {});
  const identityService = {
    ...demoCustomerIdentity,
    current: () => null,
    refresh: async () => null,
    readCurrent: async () => null,
    guest,
  };
  const view = (step: "account" | "session") => (
    <BookingProvider identityService={identityService}>
      <BookingPage step={step} />
    </BookingProvider>
  );
  navigation.push.mockClear();
  const { rerender } = render(view("account"));
  await act(async () => {});
  expect(screen.queryByLabelText("Booking identity")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Continue as Guest" }));
  await waitFor(() =>
    expect(navigation.push).toHaveBeenCalledWith("/book/session/"),
  );
  rerender(view("session"));
  expect(screen.getByLabelText("Booking identity")).toHaveTextContent("Guest");
  expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute(
    "href",
    "/book/account",
  );
  rerender(view("account"));
  await act(async () => {});
  expect(
    screen.getByRole("heading", { name: "Start your booking" }),
  ).toBeVisible();
  expect(screen.queryByLabelText("Booking identity")).toBeNull();
  expect(
    screen.getByRole("button", { name: "Continue as Guest" }),
  ).toBeEnabled();
  fireEvent.click(screen.getByRole("button", { name: "Continue with email" }));
  expect(screen.getByLabelText("Email address")).toBeVisible();
  expect(screen.queryByLabelText("Booking identity")).toBeNull();
  expect(guest).toHaveBeenCalledTimes(1);
});
