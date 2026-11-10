"use client";
import { BookingHeading } from "./booking-heading";
import { BookingPrimaryAction } from "./booking-primary-action";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import { blankContact, validEmail } from "@/domain/contact";
import { DEMO_CODE } from "@/services/demo/identity";
import {
  customerMessage,
  CustomerMessageError,
  type CustomerChallenge,
  type VerifiedIdentity,
} from "@/services/contracts";
import { useBooking } from "./provider";
import { EmailBotProof } from "./email-bot-proof";
import { DetailsStep } from "./details-step";
/** Manage guest or verified-account entry into the booking flow. */
export function AccountStep({
  onBackChange,
  onIdentityChange,
  onExit,
}: {
  onExit?: () => void;
  onBackChange?: (back: (() => void) | null) => void;
  onIdentityChange?: (identity: VerifiedIdentity | null) => void;
} = {}) {
  const {
      now,
      update,
      leave,
      identityService,
      rebookingError,
      retryRebooking,
    } = useBooking(),
    router = useRouter();
  const [view, setView] = useState<"choice" | "email" | "code" | "profile">(
      "choice",
    ),
    [email, setEmail] = useState(""),
    [code, setCode] = useState(""),
    [remember, setRemember] = useState(false),
    [error, setError] = useState(""),
    [challenge, setChallenge] = useState<CustomerChallenge | null>(null);
  const [identity, setIdentity] = useState(() => identityService.current());
  useEffect(() => {
    onIdentityChange?.(identity);
  }, [identity, onIdentityChange]);
  const [signOutFailed, setSignOutFailed] = useState(false);
  const [working, setBusy] = useState(false);
  const [navigating, startNavigation] = useTransition();
  const busy = working || navigating;
  const [botToken, setBotToken] = useState("");
  const [botGeneration, setBotGeneration] = useState(0);
  const refreshing = useRef<AbortController | null>(null);
  const active = useRef<AbortController | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    refreshing.current = controller;
    void identityService
      .refresh(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setIdentity(value);
      })
      .catch(() => {
        if (!controller.signal.aborted) setIdentity(null);
      });
    return () => {
      controller.abort();
      active.current?.abort();
    };
  }, [identityService]);
  const cancel = useCallback(() => {
    active.current?.abort();
    active.current = null;
    setBusy(false);
    setBotToken("");
    setBotGeneration((value) => value + 1);
  }, []);
  useLayoutEffect(() => {
    onBackChange?.(
      view === "email" || view === "code"
        ? () => {
            cancel();
            setView("choice");
            setChallenge(null);
            setCode("");
            setError("");
          }
        : null,
    );
    return () => onBackChange?.(null);
  }, [view, cancel, onBackChange]);
  /** Clear the previous account's entry state after acknowledged sign-out. */
  function resetIdentityEntry() {
    setIdentity(null);
    setEmail("");
    setCode("");
    setChallenge(null);
    setRemember(false);
    setBotToken("");
    setBotGeneration((value) => value + 1);
    update({ mode: "guest", accountEmail: "", contact: blankContact() });
  }
  /** Run an identity action with shared busy and error handling. */
  async function perform(work: (signal: AbortSignal) => Promise<void>) {
    if (active.current) return;
    refreshing.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setBusy(true);
    setError("");
    try {
      await work(controller.signal);
    } catch (e) {
      if (!controller.signal.aborted) {
        if (!identityService.current()) setIdentity(null);
        setError(customerMessage(e, "We couldn’t continue. Please try again."));
      }
    } finally {
      if (active.current === controller) {
        active.current = null;
        setBusy(false);
      }
    }
  }
  /** End the booking flow only after this browser’s sign-out is acknowledged. */
  function signOutToHome() {
    void perform(async (signal) => {
      setSignOutFailed(false);
      try {
        await identityService.signOut(signal);
      } catch (error) {
        if (!signal.aborted) setSignOutFailed(true);
        throw error;
      }
      if (signal.aborted) return;
      setIdentity(null);
      onExit?.();
      leave();
      startNavigation(() => router.push("/"));
    });
  }
  /** Validate the chosen identity path before advancing the booking flow. */
  async function proceed(
    signal: AbortSignal,
    verifiedEmail?: string,
    editProfile = false,
  ) {
    if (!verifiedEmail) await identityService.guest(signal);
    const contact = verifiedEmail
      ? (await identityService.profile(verifiedEmail, signal)) || {
          ...blankContact(),
          email: verifiedEmail,
        }
      : blankContact();
    if (signal.aborted) return;
    update({
      mode: verifiedEmail ? "member" : "guest",
      accountEmail: verifiedEmail || "",
      contact,
    });
    if (editProfile) setView("profile");
    else startNavigation(() => router.push("/book/session/"));
  }
  function request() {
    const normalizedEmail = email.trim();
    if (!validEmail(normalizedEmail)) {
      setError("Enter a valid email address.");
      document.getElementById("auth-email")?.focus();
      return;
    }
    void perform(async (signal) => {
      let next: CustomerChallenge;
      try {
        next = await identityService.challenge(
          normalizedEmail,
          signal,
          botToken,
        );
      } finally {
        if (!signal.aborted) {
          setBotToken("");
          setBotGeneration((value) => value + 1);
        }
      }
      if (signal.aborted) return;
      setChallenge(next);
      setCode("");
      setView("code");
    });
  }
  const verifiedIdentity =
    identity &&
    identity.expiresAt > now &&
    identityService.current()?.email === identity.email
      ? identity
      : null;
  if (view === "profile")
    return <DetailsStep profileOnly onClose={() => setView("choice")} />;
  if (view === "choice")
    return (
      <>
        <BookingHeading
          status={
            <div
              className="booking-identity-status booking-entry-status"
              aria-label="Booking identity"
            >
              <span
                className={
                  verifiedIdentity ? undefined : "pill booking-guest-status"
                }
              >
                {verifiedIdentity?.email ?? "Guest"}
              </span>
              <div className="booking-identity-action">
                {verifiedIdentity && (
                  <button
                    type="button"
                    className="text-link"
                    disabled={busy}
                    onClick={signOutToHome}
                  >
                    Sign out
                  </button>
                )}
              </div>
            </div>
          }
        >
          Start your booking
        </BookingHeading>
        {rebookingError && (
          <div className="alert" role="alert">
            <p>{rebookingError}</p>
            <button className="button secondary" onClick={retryRebooking}>
              Try again
            </button>
          </div>
        )}
        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}
        {signOutFailed && (
          <button
            type="button"
            className="text-link"
            disabled={busy}
            onClick={signOutToHome}
          >
            Try signing out again
          </button>
        )}
        {busy && (
          <span
            className="sr-only"
            role="status"
            aria-label="Preparing booking…"
          />
        )}
        <div className="access-options">
          <section className="surface access-option">
            <span className="auth-mark">
              <Icon name="users" />
            </span>
            <h2>Book as a guest</h2>
            <p className="text-muted">Book without creating an account.</p>
            <button
              className="button wide"
              aria-label="Continue as Guest"
              disabled={busy}
              onClick={() => void perform((signal) => proceed(signal))}
            >
              {busy ? "Preparing booking…" : "Continue as Guest"}{" "}
              <Icon name="chevron" />
            </button>
          </section>
          <section className="surface access-option">
            <span className="auth-mark">
              <Icon name="mail" />
            </span>
            <h2>{identity ? "Welcome back" : "Continue with email"}</h2>
            <p
              className={
                identity ? "signed-in-email" : "break-words text-muted"
              }
            >
              {identity
                ? identity.email
                : "Verify your email to prefill your name and phone number."}
            </p>
            <button
              className="button wide"
              disabled={busy}
              onClick={() =>
                identity
                  ? void perform(async (signal) => {
                      const current = await identityService.refresh(signal);
                      if (signal.aborted) return;
                      setIdentity(current);
                      if (!current)
                        throw new CustomerMessageError(
                          "Verify your email again.",
                        );
                      await proceed(signal, current.email);
                    })
                  : setView("email")
              }
            >
              {identity ? "Continue signed in" : "Continue with email"}
              <Icon name="chevron" />
            </button>
            {identity && (
              <div className="account-actions">
                {identity.remember === true && (
                  <button
                    type="button"
                    className="button secondary"
                    disabled={busy}
                    onClick={() => {
                      void perform(async (signal) => {
                        const current = await identityService.refresh(signal);
                        if (signal.aborted) return;
                        setIdentity(current);
                        if (!current || current.remember !== true)
                          throw new CustomerMessageError(
                            "Select Remember me and verify your email to save details.",
                          );
                        await proceed(signal, current.email, true);
                      });
                    }}
                  >
                    Manage saved contact
                  </button>
                )}
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={() => {
                    void perform(async (signal) => {
                      await identityService.signOut(signal);
                      if (!signal.aborted) {
                        resetIdentityEntry();
                        setView("email");
                      }
                    });
                  }}
                >
                  Use another email
                </button>
                {identityService.mode === "live" && (
                  <button
                    className="button secondary"
                    disabled={busy}
                    onClick={() => {
                      void perform(async (signal) => {
                        await identityService.signOut(signal, true);
                        if (!signal.aborted) resetIdentityEntry();
                      });
                    }}
                  >
                    Sign out all devices
                  </button>
                )}
              </div>
            )}
          </section>
        </div>
      </>
    );
  return (
    <>
      <BookingHeading>
        {view === "email" ? "Continue with email" : "Verify your email"}
      </BookingHeading>
      <p className="lead">
        {view === "email" ? (
          "Verify your email to continue with your saved booking contact details."
        ) : (
          <>
            Enter the six-digit code for{" "}
            <strong className="auth-email-address">{challenge?.email}</strong>
          </>
        )}
      </p>
      {busy && (
        <span
          className="sr-only"
          role="status"
          aria-label="Checking details…"
        />
      )}
      <form
        className="surface auth-panel"
        onSubmit={(event) => {
          event.preventDefault();
          if (view === "email") request();
          else
            void perform(async (signal) => {
              if (!challenge) return;
              const signedIn = await identityService.verify(
                challenge,
                code,
                remember,
                signal,
              );
              if (signal.aborted) return;
              setIdentity(signedIn);
              await proceed(signal, signedIn.email);
            });
        }}
      >
        {view === "email" ? (
          <>
            <label htmlFor="auth-email" className="field-label">
              Email address
            </label>
            <input
              disabled={busy}
              id="auth-email"
              className="field-control"
              type="email"
              autoComplete="email"
              required
              value={email}
              aria-invalid={error === "Enter a valid email address."}
              aria-describedby={error ? "auth-error" : undefined}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              onBlur={() => {
                if (!validEmail(email.trim()))
                  setError("Enter a valid email address.");
              }}
              maxLength={120}
            />
            <label className="check-label auth-remember">
              <input
                type="checkbox"
                disabled={busy}
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Remember me
            </label>
          </>
        ) : (
          <>
            <label htmlFor="auth-code" className="field-label">
              Verification code
            </label>
            <input
              disabled={busy}
              id="auth-code"
              className="field-control auth-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              pattern="[0-9]{6}"
              required
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
            />
            {identityService.mode === "demo" && (
              <p className="auth-demo-code">
                Demo code <strong>{DEMO_CODE}</strong>
                <span>No email sent · Code valid for 10 minutes</span>
              </p>
            )}
          </>
        )}
        {error && (
          <p id="auth-error" role="alert" className="alert auth-error">
            {error}
          </p>
        )}
        {identityService.mode === "live" && (
          <EmailBotProof key={botGeneration} onToken={setBotToken} />
        )}
        <BookingPrimaryAction className="actions" ready={!busy}>
          <button type="submit" className="button" disabled={busy}>
            {view === "email" ? "Continue with email" : "Verify and continue"}
            <Icon name="chevron" />
          </button>
        </BookingPrimaryAction>
        <div className="auth-code-actions">
          {view === "code" && (
            <>
              <button
                type="button"
                disabled={busy}
                className="text-link"
                onClick={request}
              >
                Resend code
              </button>
              <button
                type="button"
                className="text-link"
                onClick={() => {
                  cancel();
                  setChallenge(null);
                  setCode("");
                  setError("");
                  setView("email");
                }}
              >
                Change email
              </button>
            </>
          )}
        </div>
        {view === "email" && identityService.mode === "demo" && (
          <p className="auth-demo">
            Email sign-in preview · No email will be sent.
          </p>
        )}
      </form>
    </>
  );
}
