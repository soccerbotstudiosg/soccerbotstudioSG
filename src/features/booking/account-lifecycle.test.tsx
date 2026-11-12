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
import { BookingProvider, useBooking } from "./provider";
import { demoCustomerIdentity } from "@/services/demo/identity";
import { liveBookingService } from "@/services/booking";
import {
  CustomerMessageError,
  VerificationRequestLimitedError,
} from "@/services/contracts";
import type {
  CustomerIdentityService,
  CustomerChallenge,
} from "@/services/contracts";
const navigation = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => navigation,
}));
vi.mock("./email-bot-proof", () => ({
  EmailBotProof: ({ onToken }: { onToken: (token: string) => void }) => (
    <button type="button" onClick={() => onToken("synthetic-proof")}>
      Complete synthetic security check
    </button>
  ),
}));
test("guest selection advances locally without repeating access or showing preparation", async () => {
  const guest = vi.fn(async () => {});
  const identityService = { ...demoCustomerIdentity, guest };
  navigation.push.mockClear();
  const view = (step: "account" | "session") => (
    <BookingProvider identityService={identityService}>
      <BookingPage step={step} />
    </BookingProvider>
  );
  const { rerender } = render(view("account"));
  await act(async () => {});
  fireEvent.click(screen.getByRole("button", { name: "Continue as Guest" }));
  expect(navigation.push).toHaveBeenCalledWith("/book/session/");
  expect(guest).not.toHaveBeenCalled();
  expect(document.querySelector(".booking-flow-overlay")).toBeNull();
  expect(screen.queryByText("Preparing booking…")).toBeNull();
  expect(
    screen.getByRole("button", { name: "Continue as Guest" }),
  ).toBeEnabled();
  expect(
    screen.getByRole("button", { name: "Continue with email" }),
  ).toBeEnabled();
  rerender(view("session"));
  expect(screen.getByRole("heading", { name: "Your session" })).toBeVisible();
  expect(screen.getByLabelText("Booking identity")).toHaveTextContent("Guest");
  rerender(view("account"));
  fireEvent.click(screen.getByRole("button", { name: "Continue as Guest" }));
  expect(guest).not.toHaveBeenCalled();
  expect(document.querySelector(".booking-flow-overlay")).toBeNull();
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
  fireEvent.click(
    await screen.findByRole("button", { name: /Continue with email/ }),
  );
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
        .getByRole("button", { name: "Get Verification Code" })
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
      .getByRole("button", { name: "Get Verification Code" })
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
  let releaseProfile!: () => void;
  profile.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        releaseProfile = () =>
          resolve({
            name: "Shared Contact",
            email: verified.email,
            phone: "+65 8123 4567",
            contactMethod: "email",
            academy: "",
          });
      }),
  );
  fireEvent.click(manage);
  expect(
    screen.getByRole("status", { name: "Opening booking" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Continue as Guest" }),
  ).toBeNull();
  expect(screen.queryByText("Welcome back")).toBeNull();
  await act(async () => releaseProfile());
  expect(
    await screen.findByRole("heading", { name: "Saved contact details" }),
  ).toBeInTheDocument();
  expect(profile).toHaveBeenCalledExactlyOnceWith(
    verified.email,
    expect.any(AbortSignal),
  );
  expect(refresh).toHaveBeenCalledTimes(1);
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
  fireEvent.click(screen.getByRole("button", { name: "Manage saved contact" }));
  await screen.findByRole("heading", { name: "Saved contact details" });
  fireEvent.click(screen.getAllByRole("button", { name: "Back" })[0]);
  expect(
    screen.getByRole("heading", { name: "Start your booking" }),
  ).toBeInTheDocument();
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
  let current: typeof verified | null = verified;
  const refresh = vi.fn().mockResolvedValue(verified);
  const profile = vi.fn();
  render(
    <BookingProvider
      identityService={{
        ...demoCustomerIdentity,
        current: () => current,
        refresh,
        profile,
      }}
    >
      <BookingPage step="account" />
    </BookingProvider>,
  );
  await act(async () => {});
  current = null;
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
  let current: typeof identity | null = identity;
  let finishSignOut!: () => void;
  const signOut = vi
    .fn()
    .mockRejectedValueOnce(new Error("SQLITE_FULL private provider diagnostic"))
    .mockImplementationOnce(async () => {
      current = null;
      await new Promise<void>((resolve) => {
        finishSignOut = resolve;
      });
    });
  render(
    <BookingProvider
      identityService={{
        ...demoCustomerIdentity,
        mode: "live",
        current: () => current,
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
      "Could not finish signing out. Please try again.",
    ),
  );
  expect(
    screen.queryByText(/SQLITE_FULL|private provider diagnostic/),
  ).toBeNull();
  expect(screen.getByRole("alert")).toHaveClass("alert");
  expect(screen.queryByLabelText("Booking identity")).toBeNull();
  expect(
    screen.getByRole("button", { name: "Continue as Guest" }),
  ).toBeEnabled();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(document.querySelector(".booking-flow-overlay")).toBeNull();
  expect(
    screen.getByRole("button", { name: "Continue as Guest" }),
  ).toBeEnabled();
  await act(async () => finishSignOut());
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Continue as Guest" }),
    ).toBeEnabled(),
  );
  expect(screen.queryByText(identity.email)).not.toBeInTheDocument();
  expect(document.querySelector(".booking-flow-overlay")).toBeNull();
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
  let finishSignOut!: () => void;
  let firstSignOut = true;
  const signOut = vi.fn(async () => {
    current = null;
    if (firstSignOut) {
      firstSignOut = false;
      await new Promise<void>((resolve) => {
        finishSignOut = resolve;
      });
    }
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
  expect(document.querySelector(".booking-flow-overlay")).toBeNull();
  expect(
    screen.queryByRole("button", { name: "Continue as Guest" }),
  ).toBeNull();
  expect(
    screen.queryByRole("button", { name: "Continue signed in" }),
  ).toBeNull();
  expect(screen.getByLabelText("Email address")).toBeEnabled();
  expect(
    screen.getByRole("button", { name: "Get Verification Code" }),
  ).toBeEnabled();
  await act(async () => finishSignOut());
  await screen.findByRole("heading", { name: "Continue with email" });
  expect(document.querySelector(".booking-flow-overlay")).toBeNull();
  expect(signOut).toHaveBeenCalledExactlyOnceWith(
    expect.any(AbortSignal),
    false,
  );
  expect(await screen.findByLabelText("Email address")).toHaveValue("");
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
      .getByRole("button", { name: "Get Verification Code" })
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
  expect(await screen.findByLabelText("Email address")).toHaveValue("");
  expect(screen.getByLabelText("Remember me")).not.toBeChecked();
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "new@example.invalid" },
  });
  fireEvent.submit(
    screen
      .getByRole("button", { name: "Get Verification Code" })
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
  let current: typeof identity | null = identity;
  const refresh = vi.fn().mockResolvedValue(identity);
  render(
    <BookingProvider
      identityService={{
        ...demoCustomerIdentity,
        current: () => current,
        refresh,
      }}
    >
      <BookingPage step="account" />
    </BookingProvider>,
  );
  await act(async () => {});
  current = null;
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

test("invalid code can return to guest options without carrying an old error", async () => {
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
      .getByRole("button", { name: "Get Verification Code" })
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
  expect(screen.queryByRole("button", { name: "Change email" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Back" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Booking identity")).toBeNull();
  expect(
    screen.getByRole("button", { name: "Continue as Guest" }),
  ).toBeEnabled();
  fireEvent.click(screen.getByRole("button", { name: "Continue with email" }));
  expect(
    screen.getByRole("button", { name: "Get Verification Code" }),
  ).toBeEnabled();
});

test("remembered identity restoration shows only the full-width welcome card without a guest flash", async () => {
  const verified = {
    email: "restored@example.invalid",
    expiresAt: Date.now() + 600000,
    remember: true,
  };
  let current: typeof verified | null = null;
  let finish!: () => void;
  const refresh = vi.fn(
    () =>
      new Promise<typeof verified>((resolve) => {
        finish = () => {
          current = verified;
          resolve(verified);
        };
      }),
  );
  const signOut = vi.fn(async () => {
    current = null;
  });
  const mounted = render(
    <BookingProvider
      identityService={{
        ...demoCustomerIdentity,
        mode: "live",
        current: () => current,
        refresh,
        signOut,
      }}
    >
      <BookingPage step="account" />
    </BookingProvider>,
  );
  expect(
    screen.getByRole("status", { name: "Opening booking" }),
  ).toBeInTheDocument();
  expect(document.querySelector(".page-loading")).not.toBeNull();
  expect(document.querySelector(".booking-loading")).toBeNull();
  expect(
    screen.queryByRole("heading", { name: "Start your booking" }),
  ).toBeNull();
  expect(
    screen.queryByRole("button", { name: "Continue as Guest" }),
  ).toBeNull();
  expect(
    screen.queryByRole("button", { name: "Continue with email" }),
  ).toBeNull();
  await act(async () => finish());
  expect(screen.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  expect(document.querySelector(".access-options-verified")).not.toBeNull();
  expect(document.querySelectorAll(".access-option")).toHaveLength(1);
  expect(
    screen.queryByRole("button", { name: "Continue as Guest" }),
  ).toBeNull();
  expect(screen.queryByRole("button", { name: "Sign out" })).toBeNull();
  expect(
    screen.queryByRole("button", { name: "Try signing out again" }),
  ).toBeNull();
  expect(
    screen.getByRole("button", { name: "Manage saved contact" }),
  ).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Sign out all devices" }));
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Continue as Guest" }),
    ).toBeEnabled(),
  );
  expect(document.querySelectorAll(".access-option")).toHaveLength(2);
  expect(screen.queryByRole("heading", { name: "Welcome back" })).toBeNull();
  expect(signOut).toHaveBeenCalledExactlyOnceWith(
    expect.any(AbortSignal),
    true,
  );
  mounted.unmount();
  vi.useFakeTimers();
  let timedOut = () => {};
  let unmount = () => {};
  let signal: AbortSignal | undefined;
  const stalled = vi.fn((incoming: AbortSignal) => {
    signal = incoming;
    return new Promise<typeof verified>((resolve) => {
      timedOut = () => resolve(verified);
    });
  });
  try {
    await act(async () => {
      ({ unmount } = render(
        <BookingProvider
          identityService={{
            ...demoCustomerIdentity,
            mode: "live",
            current: () => null,
            refresh: stalled,
          }}
        >
          <BookingPage step="account" />
        </BookingProvider>,
      ));
    });
    expect(
      screen.getByRole("status", { name: "Opening booking" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Continue as Guest" }),
    ).toBeNull();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(9999);
    });
    expect(
      screen.queryByRole("button", { name: "Continue as Guest" }),
    ).toBeNull();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(signal?.aborted).toBe(true);
    expect(
      screen.getByRole("button", { name: "Continue as Guest" }),
    ).toBeEnabled();
    expect(
      screen.queryByRole("status", { name: "Opening booking" }),
    ).toBeNull();
    await act(async () => timedOut());
    expect(screen.queryByRole("heading", { name: "Welcome back" })).toBeNull();
    expect(screen.queryByLabelText("Booking identity")).toBeNull();
    expect(stalled).toHaveBeenCalledTimes(1);
  } finally {
    unmount();
    vi.useRealTimers();
  }
});

test("later booking headings inspect identity without refreshing or recreating guest access", async () => {
  const verified = {
    email: "display@example.invalid",
    expiresAt: Date.now() + 600000,
  };
  let current: typeof verified | null = verified;
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
  expect(readCurrent).not.toHaveBeenCalled();
  expect(refresh).not.toHaveBeenCalled();
  expect(guest).not.toHaveBeenCalled();
  expect(screen.queryByRole("button", { name: "Sign out" })).toBeNull();
});

test("guest identity is shown only after choosing guest and stays hidden on return to booking choices", async () => {
  const refresh = vi.fn(async () => null);
  const guest = vi.fn(async () => {});
  const identityService = {
    ...demoCustomerIdentity,
    mode: "live" as const,
    current: () => null,
    refresh,
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
  expect(screen.queryByRole("status", { name: "Opening booking" })).toBeNull();
  await act(async () => {});
  expect(refresh).toHaveBeenCalledTimes(1);
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
  expect(guest).not.toHaveBeenCalled();
});

test("email resend follows server deadlines and third-request cooldown without automatic sends", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-11T08:00:00Z"));
  let requests = 0;
  const challenge = vi.fn(async (email: string) => {
    requests++;
    return {
      email,
      challengeId: `synthetic-${requests}`,
      expiresAt: Date.now() + 120000,
      resendAfter: Date.now(),
      requestLimited: false,
    };
  });
  const verify = vi
    .fn()
    .mockRejectedValue(
      new CustomerMessageError("Check your code or request a new one."),
    );
  let unmount = () => {};
  try {
    await act(async () => {
      ({ unmount } = render(
        <BookingProvider
          identityService={{
            ...demoCustomerIdentity,
            current: () => null,
            refresh: async () => null,
            challenge,
            verify,
          }}
        >
          <BookingPage step="account" />
        </BookingProvider>,
      ));
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Continue with email" }),
    );
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "timer@example.invalid" },
    });
    await act(async () => {
      fireEvent.submit(
        screen
          .getByRole("button", { name: "Get Verification Code" })
          .closest("form")!,
      );
    });
    expect(screen.getByRole("timer")).toHaveTextContent("02:00");
    expect(
      screen.getByRole("button", { name: "Request another code" }),
    ).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Change email" })).toBeNull();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(20000);
    });
    expect(screen.getByRole("timer")).toHaveTextContent(
      "Code expires in: 01:40",
    );
    expect(challenge).toHaveBeenCalledTimes(1);
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Request another code" }),
      );
    });
    expect(screen.getByRole("timer")).toHaveTextContent("02:00");
    // A suspended tab must use the deadline, not restart a relative countdown.
    vi.setSystemTime(Date.now() + 20000);
    fireEvent(window, new Event("focus"));
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Request another code" }),
      );
    });
    expect(screen.getByRole("timer")).toHaveTextContent("02:00");
    expect(document.querySelector(".auth-code-feedback.alert")).toBeNull();
    const blockEnds = Date.now() + 600000;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(20000);
    });
    challenge.mockRejectedValueOnce(
      new VerificationRequestLimitedError(blockEnds),
    );
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Request another code" }),
      );
    });
    expect(screen.getByRole("timer")).toHaveTextContent("09:40");
    expect(
      screen
        .getByText("Too many code requests. Try again later.")
        .closest(".alert"),
    ).not.toBeNull();
    expect(challenge).toHaveBeenCalledTimes(4);
    expect(
      screen.getByRole("button", { name: "Verify and continue" }),
    ).toBeEnabled();
    fireEvent.change(screen.getByLabelText("Verification code"), {
      target: { value: "123456" },
    });
    await act(async () => {
      fireEvent.submit(
        screen
          .getByRole("button", { name: "Verify and continue" })
          .closest("form")!,
      );
    });
    expect(verify).toHaveBeenCalledTimes(1);
    expect(verify.mock.calls[0][0].challengeId).toBe("synthetic-3");
    expect(screen.getByRole("timer")).toHaveTextContent("09:40");

    vi.setSystemTime(Date.now() + 579999);
    fireEvent(document, new Event("visibilitychange"));
    expect(
      screen.queryByRole("button", { name: "Request another code" }),
    ).toBeNull();
    vi.setSystemTime(Date.now() + 1);
    fireEvent(window, new Event("focus"));
    expect(
      screen.getByRole("button", { name: "Request another code" }),
    ).toBeEnabled();
    expect(
      screen.queryByText("Too many code requests. Try again later."),
    ).toBeNull();
    expect(challenge).toHaveBeenCalledTimes(4);
    challenge.mockRejectedValueOnce(
      new CustomerMessageError(
        "Email verification unavailable. Please continue as a guest.",
      ),
    );
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Request another code" }),
      );
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Email verification unavailable",
    );
    expect(
      screen.getByRole("button", { name: "Request another code" }),
    ).toBeEnabled();
    expect(challenge).toHaveBeenCalledTimes(5);
  } finally {
    unmount();
    vi.useRealTimers();
  }
});

test("email request throttling displays server retry time without automatic or premature requests", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-11T08:00:00Z"));
  const challenge = vi
    .fn()
    .mockRejectedValue(
      new VerificationRequestLimitedError(Date.now() + 420000),
    );
  let unmount = () => {};
  try {
    await act(async () => {
      ({ unmount } = render(
        <BookingProvider
          identityService={{
            ...demoCustomerIdentity,
            current: () => null,
            refresh: async () => null,
            challenge,
          }}
        >
          <BookingPage step="account" />
        </BookingProvider>,
      ));
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Continue with email" }),
    );
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "limit@example.invalid" },
    });
    await act(async () => {
      fireEvent.submit(
        screen
          .getByRole("button", { name: "Get Verification Code" })
          .closest("form")!,
      );
    });
    expect(screen.getByRole("timer")).toHaveTextContent("07:00");
    expect(
      screen.getByRole("button", { name: "Get Verification Code" }),
    ).toBeDisabled();
    fireEvent.submit(
      screen
        .getByRole("button", { name: "Get Verification Code" })
        .closest("form")!,
    );
    expect(challenge).toHaveBeenCalledTimes(1);
    vi.setSystemTime(Date.now() + 420000);
    fireEvent(window, new Event("focus"));
    expect(
      screen.getByRole("button", { name: "Get Verification Code" }),
    ).toBeEnabled();
    expect(
      screen.queryByText("Too many code requests. Try again later."),
    ).toBeNull();
    expect(challenge).toHaveBeenCalledTimes(1);
  } finally {
    unmount();
    vi.useRealTimers();
  }
});

test("fresh security proof clears only stale security feedback and reentry starts clean", async () => {
  let current: ReturnType<CustomerIdentityService["current"]> = null;
  const challenge = vi.fn<CustomerIdentityService["challenge"]>(
    async (email, _signal, token) => {
      if (!token)
        throw new CustomerMessageError(
          "Complete the security check and try again.",
        );
      return {
        email,
        challengeId: "synthetic",
        expiresAt: Date.now() + 600000,
        resendAfter: 0,
      };
    },
  );
  const verify = vi.fn<CustomerIdentityService["verify"]>(async (challenge) => {
    current = { email: challenge.email, expiresAt: Date.now() + 600000 };
    return current;
  });
  const signOut = vi.fn(async () => {
    current = null;
  });
  render(
    <BookingProvider
      identityService={{
        ...demoCustomerIdentity,
        mode: "live",
        current: () => current,
        refresh: async () => current,
        profile: async () => null,
        challenge,
        verify,
        signOut,
      }}
    >
      <BookingPage step="account" />
    </BookingProvider>,
  );
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Continue with email" }),
    ).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole("button", { name: "Continue with email" }));
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "proof@example.invalid" },
  });
  const submit = () =>
    fireEvent.submit(
      screen
        .getByRole("button", { name: "Get Verification Code" })
        .closest("form")!,
    );
  await act(async () => {
    submit();
  });
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Complete the security check and try again.",
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Complete synthetic security check" }),
  );
  expect(screen.queryByRole("alert")).toBeNull();
  challenge.mockRejectedValueOnce(
    new CustomerMessageError(
      "Email verification unavailable. Please continue as a guest.",
    ),
  );
  await act(async () => {
    submit();
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Complete synthetic security check" }),
  );
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Email verification unavailable.",
  );
  await act(async () => {
    submit();
  });
  expect(screen.queryByRole("alert")).toBeNull();
  fireEvent.change(screen.getByLabelText("Verification code"), {
    target: { value: "123456" },
  });
  await act(async () => {
    fireEvent.submit(
      screen
        .getByRole("button", { name: "Verify and continue" })
        .closest("form")!,
    );
  });
  expect(verify).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Back" }));
  expect(screen.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  expect(
    screen.queryByRole("button", { name: "Manage saved contact" }),
  ).toBeNull();
  expect(
    screen.queryByRole("button", { name: "Continue as Guest" }),
  ).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Sign out all devices" }));
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Continue with email" }),
    ).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole("button", { name: "Continue with email" }));
  expect(await screen.findByLabelText("Email address")).toHaveValue("");
  expect(screen.queryByRole("alert")).toBeNull();
  await act(async () => {
    submit();
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Complete synthetic security check" }),
  );
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Enter a valid email address.",
  );
});

test("email requests wait for background signout while the replacement form opens immediately", async () => {
  let finish!: () => void;
  let current: ReturnType<CustomerIdentityService["current"]> = {
    email: "old@example.invalid",
    expiresAt: Date.now() + 600000,
  };
  const challenge = vi.fn(async (email: string) => ({
    email,
    challengeId: "synthetic",
    expiresAt: Date.now() + 120000,
    resendAfter: 0,
  }));
  const service: CustomerIdentityService = {
    ...demoCustomerIdentity,
    current: () => current,
    refresh: async () => current,
    guest: async () => {},
    challenge,
    signOut: async () => {
      current = null;
      await new Promise<void>((resolve) => {
        finish = resolve;
      });
    },
  };
  render(
    <BookingProvider identityService={service}>
      <BookingPage step="account" />
    </BookingProvider>,
  );
  await act(async () => {});
  fireEvent.click(screen.getByRole("button", { name: "Use another email" }));
  expect(document.querySelector(".booking-flow-overlay")).toBeNull();
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "new@example.invalid" },
  });
  fireEvent.submit(
    screen
      .getByRole("button", { name: "Get Verification Code" })
      .closest("form")!,
  );
  expect(document.querySelector(".booking-flow-overlay")).toBeNull();
  expect(
    screen.getByRole("status", { name: "Requesting verification code" }),
  ).toBeVisible();
  expect(challenge).not.toHaveBeenCalled();
  await act(async () => finish());
  expect(await screen.findByLabelText("Verification code")).toBeEnabled();
  expect(challenge).toHaveBeenCalledTimes(1);
  expect(document.querySelector(".booking-flow-overlay")).toBeNull();
});

test("switching identity clears selected session and cart without repeating entry preparation", async () => {
  let current: ReturnType<CustomerIdentityService["current"]> = {
    email: "old@example.invalid",
    expiresAt: Date.now() + 600000,
  };
  const service = {
    ...demoCustomerIdentity,
    current: () => current,
    refresh: async () => current,
    guest: async () => {},
    signOut: async () => {
      current = null;
    },
  };
  function Selection() {
    const { update, draft, sessionChoices, setSessionChoices } = useBooking();
    return (
      <>
        <button
          onClick={() => {
            update({ players: 4, nativeServiceId: "old-service" });
            setSessionChoices({ outlet: true, session: true });
          }}
        >
          Seed selection
        </button>
        <output data-testid="selection">
          {JSON.stringify({
            players: draft.players,
            service: draft.nativeServiceId,
            sessionChoices,
            slots: draft.slots,
          })}
        </output>
      </>
    );
  }
  render(
    <BookingProvider identityService={service}>
      <Selection />
      <BookingPage step="account" />
    </BookingProvider>,
  );
  await act(async () => {});
  fireEvent.click(screen.getByText("Seed selection"));
  expect(screen.getByTestId("selection")).toHaveTextContent("old-service");
  fireEvent.click(screen.getByRole("button", { name: "Use another email" }));
  expect(screen.getByTestId("selection")).not.toHaveTextContent("old-service");
  expect(screen.getByTestId("selection")).toHaveTextContent('"players":1');
  expect(screen.getByTestId("selection")).toHaveTextContent('"session":false');
  expect(document.querySelector(".booking-flow-overlay")).toBeNull();
  await act(async () => {});
});
