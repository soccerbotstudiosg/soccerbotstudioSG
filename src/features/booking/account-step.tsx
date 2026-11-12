"use client";
import { BookingHeading, VerifiedEmailStatus } from "./booking-heading";
import { BookingPrimaryAction } from "./booking-primary-action";
import { BookingLoading } from "./booking-loading";
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
  EMAIL_SECURITY_CHECK_REQUIRED,
  EMAIL_REQUEST_LIMITED,
  VerificationRequestLimitedError,
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
}: {
  onBackChange?: (back: (() => void) | null) => void;
  onIdentityChange?: (identity: VerifiedIdentity | null) => void;
} = {}) {
  const { now, update, identityService, rebookingError, retryRebooking } =
      useBooking(),
    router = useRouter();
  const [view, setView] = useState<"choice" | "email" | "code" | "profile">(
      "choice",
    ),
    [email, setEmail] = useState(""),
    [code, setCode] = useState(""),
    [remember, setRemember] = useState(false),
    [error, setError] = useState(""),
    [challenge, setChallenge] = useState<CustomerChallenge | null>(null);
  const [resendNow, setResendNow] = useState(() => Date.now());
  const [requestBlockedUntil, setRequestBlockedUntil] = useState(0);
  const resendAfter = Math.max(
    view === "code" ? (challenge?.resendAfter ?? 0) : 0,
    requestBlockedUntil,
  );
  const resendSeconds = Math.max(
    0,
    Math.ceil((resendAfter - resendNow) / 1000),
  );
  useEffect(() => {
    if (!resendAfter) return;
    let timer: ReturnType<typeof setTimeout>;
    /** Refresh the countdown from the server deadline, including after suspension. */
    function refresh() {
      clearTimeout(timer);
      const current = Date.now();
      setResendNow(current);
      if (current < resendAfter)
        timer = setTimeout(refresh, Math.min(1000, resendAfter - current));
    }
    refresh();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [resendAfter]);
  const [identity, setIdentity] = useState(() => identityService.current());
  useEffect(() => {
    onIdentityChange?.(identity);
  }, [identity, onIdentityChange]);
  const [restoredService, setRestoredService] = useState(() =>
    identityService.mode === "demo" ? identityService : null,
  );
  const restoring =
    identityService.mode === "live" && restoredService !== identityService;
  const [working, setBusy] = useState(false);
  const [navigating, startNavigation] = useTransition();
  const busy = working || navigating;
  const [botToken, setBotToken] = useState("");
  const [botGeneration, setBotGeneration] = useState(0);
  const receiveBotToken = useCallback((token: string) => {
    setBotToken(token);
    if (token)
      setError((message) =>
        message === EMAIL_SECURITY_CHECK_REQUIRED ? "" : message,
      );
  }, []);
  const refreshing = useRef<AbortController | null>(null);
  const active = useRef<AbortController | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    refreshing.current = controller;
    // Initial restoration must not leave entry choices hidden on a stalled read.
    const timeout = setTimeout(() => {
      if (controller.signal.aborted) return;
      controller.abort();
      setIdentity(null);
      setRestoredService(identityService);
    }, 10_000);
    void identityService
      .refresh(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setIdentity(value);
      })
      .catch(() => {
        if (!controller.signal.aborted) setIdentity(null);
      })
      .finally(() => {
        clearTimeout(timeout);
        if (!controller.signal.aborted) setRestoredService(identityService);
      });
    return () => {
      clearTimeout(timeout);
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
    setError("");
    setEmail("");
    setCode("");
    setChallenge(null);
    setRequestBlockedUntil(0);
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
        if (
          e instanceof VerificationRequestLimitedError &&
          e.retryAt !== null
        ) {
          setResendNow(Date.now());
          setRequestBlockedUntil(e.retryAt);
          setError("");
        } else {
          setError(
            customerMessage(e, "We couldn’t continue. Please try again."),
          );
        }
      }
    } finally {
      if (active.current === controller) {
        active.current = null;
        setBusy(false);
      }
    }
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
    if (Date.now() < resendAfter) return;
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
      setResendNow(Date.now());
      setRequestBlockedUntil(0);
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
          lines={["Start your", "booking"]}
          status={
            verifiedIdentity ? (
              <div
                className="booking-identity-status booking-entry-status"
                aria-label="Booking identity"
              >
                <VerifiedEmailStatus email={verifiedIdentity.email} />
              </div>
            ) : (
              false
            )
          }
        />
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
        {busy && (
          <span
            className="sr-only"
            role="status"
            aria-label="Preparing booking…"
          />
        )}
        {restoring ? (
          <BookingLoading label="Checking saved identity…" overlay={false} />
        ) : (
          <div
            className={`access-options${verifiedIdentity ? " access-options-verified" : ""}`}
          >
            {!verifiedIdentity && (
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
            )}
            <section className="surface access-option">
              <span className="auth-mark">
                <Icon name="mail" />
              </span>
              <h2>
                {verifiedIdentity ? "Welcome back" : "Continue with email"}
              </h2>
              <p
                className={
                  verifiedIdentity
                    ? "signed-in-email"
                    : "break-words text-muted"
                }
              >
                {verifiedIdentity
                  ? verifiedIdentity.email
                  : "Verify your email to prefill your name and phone number."}
              </p>
              <button
                className="button wide"
                disabled={busy}
                onClick={() => {
                  if (verifiedIdentity)
                    void perform(async (signal) => {
                      const current = await identityService.refresh(signal);
                      if (signal.aborted) return;
                      setIdentity(current);
                      if (!current)
                        throw new CustomerMessageError(
                          "Verify your email again.",
                        );
                      await proceed(signal, current.email);
                    });
                  else {
                    setError("");
                    setView("email");
                  }
                }}
              >
                {verifiedIdentity
                  ? "Continue signed in"
                  : "Continue with email"}
                <Icon name="chevron" />
              </button>
              {verifiedIdentity && (
                <div className="account-actions">
                  {verifiedIdentity.remember === true && (
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
        )}
      </>
    );
  return (
    <>
      <BookingHeading
        status={false}
        lines={
          view === "email"
            ? ["Continue", "with email"]
            : ["Verify your", "email"]
        }
      />
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
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                setError("");
              }}
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
        {view === "code" || resendSeconds > 0 ? (
          <div
            className={`auth-code-feedback${requestBlockedUntil > resendNow ? " alert" : ""}`}
          >
            {requestBlockedUntil > resendNow && <p>{EMAIL_REQUEST_LIMITED}</p>}
            {resendSeconds > 0 ? (
              <p role="timer" aria-live="off">
                {requestBlockedUntil > resendNow || view !== "code"
                  ? "Try again in"
                  : "Request another code in"}
                : {String(Math.floor(resendSeconds / 60)).padStart(2, "0")}:
                {String(resendSeconds % 60).padStart(2, "0")}
              </p>
            ) : (
              <button
                type="button"
                disabled={busy}
                className="text-link"
                onClick={request}
              >
                Request another code
              </button>
            )}
          </div>
        ) : null}
        {identityService.mode === "live" && resendSeconds === 0 && (
          <EmailBotProof key={botGeneration} onToken={receiveBotToken} />
        )}
        <BookingPrimaryAction
          className="actions"
          ready={!busy && !(view === "email" && resendSeconds > 0)}
        >
          <button
            type="submit"
            className="button"
            disabled={busy || (view === "email" && resendSeconds > 0)}
          >
            {view === "email" ? "Continue with email" : "Verify and continue"}
            <Icon name="chevron" />
          </button>
        </BookingPrimaryAction>
        {view === "email" && identityService.mode === "demo" && (
          <p className="auth-demo">
            Email sign-in preview · No email will be sent.
          </p>
        )}
      </form>
    </>
  );
}
