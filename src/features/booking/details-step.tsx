"use client";
import {
  profileAccessGeneration,
  reportProfileAccessLoss,
} from "@/services/profile-access";
import {
  customerMessage,
  ProfileAccessRevokedError,
} from "@/services/contracts";
import { PhoneInput } from "./phone-input";
import { BookingHeading } from "./booking-heading";
import {
  BookingPrimaryAction,
  BookingActionTotal,
} from "./booking-primary-action";
import { BookingLoading as BrandLoading } from "./booking-loading";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import { CONTACT_METHODS } from "@/domain/catalog";
import {
  contactErrors,
  EMAIL_MAX_LENGTH,
  type ContactDetails,
  type ContactErrors,
} from "@/domain/contact";
import { useBooking } from "./provider";
import { ReviewStep } from "./review-step";
import { checkEmailDomain } from "@/services/email-domain";
type TextKey = {
  [K in keyof ContactDetails]: ContactDetails[K] extends string ? K : never;
}[keyof ContactDetails];
/** Collect contact, player and consent details before booking review. */
export function DetailsStep({
  profileOnly = false,
  onClose,
}: { profileOnly?: boolean; onClose?: () => void } = {}) {
  const {
      draft,
      attempt,
      update,
      identityService,
      bookingService,
      review,
      saveContact,
      action,
      selectionNotice,
      cancel,
    } = useBooking(),
    router = useRouter(),
    c = draft.contact;
  const needsProfile =
    !profileOnly &&
    bookingService.mode === "live" &&
    identityService.mode === "live" &&
    draft.mode === "member";
  const [profileRead, setProfileRead] = useState<{
    email: string;
    ready: boolean;
    error: string;
  }>({ email: "", ready: false, error: "" });
  const [profileRetry, setProfileRetry] = useState(0);
  const profileTarget = useRef({ contact: draft.contact, update });
  profileTarget.current = { contact: draft.contact, update };
  useEffect(() => {
    if (!needsProfile) return;
    const controller = new AbortController();
    const email = draft.accountEmail;
    const own = profileAccessGeneration();
    setProfileRead({ email, ready: false, error: "" });
    // A restored draft does not prove that its saved-profile identity is valid.
    if (identityService.current()?.email !== email) {
      reportProfileAccessLoss(own);
      return () => controller.abort();
    }
    const timeout = setTimeout(() => {
      setProfileRead({
        email,
        ready: false,
        error: "Unable to load saved details. Please try again.",
      });
      controller.abort();
    }, 10000);
    void identityService
      .profile(email, controller.signal)
      .then(
        (profile) => {
          if (controller.signal.aborted) return;
          if (own !== profileAccessGeneration()) {
            setProfileRead({
              email,
              ready: false,
              error: "Your sign-in changed. Please try again.",
            });
            return;
          }
          if (identityService.current()?.email !== email) {
            reportProfileAccessLoss(own);
            return;
          }
          if (profile) {
            const contact = {
              ...profile,
              ...Object.fromEntries(
                Object.entries(profileTarget.current.contact).filter(
                  ([, value]) => value !== "",
                ),
              ),
              email,
            };
            profileTarget.current.update({ contact });
          }
          setProfileRead({ email, ready: true, error: "" });
        },
        (error: unknown) => {
          if (!controller.signal.aborted)
            setProfileRead({
              email,
              ready: false,
              error: customerMessage(
                error,
                "Unable to load saved details. Please try again.",
              ),
            });
        },
      )
      .finally(() => clearTimeout(timeout));
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
    // One protected read per editor entry/retry; typing must never refetch or overwrite the draft.
  }, [
    needsProfile,
    draft.accountEmail,
    identityService,
    profileRetry,
    profileOnly,
  ]);
  const [working, setChecking] = useState(false);
  const [navigating, startNavigation] = useTransition();
  const checking = working || navigating;
  const submitting = useRef(false);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      cancel();
    };
  }, [cancel]);
  const [touchedErrors, setErrors] = useState<ContactErrors>({});
  const currentErrors = contactErrors(
    c,
    draft.mode === "member" ? draft.accountEmail : undefined,
  );
  const errors = touchedErrors;
  const [checkedEmail, setCheckedEmail] = useState<string | null>(null);
  const [emailChecking, setEmailChecking] = useState(false);
  const emailWork = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      emailWork.current?.abort();
      emailWork.current = null;
    },
    [c.email, draft.mode],
  );
  /** Check guest email routing and ignore results for an edited address. */
  async function confirmEmail() {
    if (currentErrors.email || emailWork.current) return;
    if (bookingService.mode !== "live") {
      setCheckedEmail(c.email);
      return;
    }
    const request = new AbortController();
    emailWork.current = request;
    setEmailChecking(true);
    setErrors((errors) => ({ ...errors, email: undefined }));
    const timeout = setTimeout(() => request.abort(), 7000);
    const status = await checkEmailDomain(c.email, request.signal);
    clearTimeout(timeout);
    if (emailWork.current !== request) return;
    emailWork.current = null;
    setEmailChecking(false);
    if (status === "valid" && !request.signal.aborted) setCheckedEmail(c.email);
    else
      setErrors((errors) => ({
        ...errors,
        email:
          status === "invalid"
            ? "This email domain cannot receive email. Check your email address."
            : "Couldn’t check your email domain. Please try again.",
      }));
  }
  const needsEmailCheck = !profileOnly && draft.mode !== "member";
  const emailChecked = !needsEmailCheck || checkedEmail === c.email;
  const contactValid = Object.keys(currentErrors).length === 0 && emailChecked;
  const [saveState, setSaveState] = useState({
    key: "",
    saving: false,
    message: "",
    failed: false,
  });
  const activeSave = useRef<AbortController | null>(null);
  const contactKey = JSON.stringify([draft.mode, draft.accountEmail, c]);
  const saving = saveState.key === contactKey && saveState.saving;
  const saveMessage = saveState.key === contactKey ? saveState.message : "";
  const saveNotice = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (!profileOnly || !saveMessage) return;
    saveNotice.current?.focus({ preventScroll: true });
    saveNotice.current?.scrollIntoView({ block: "start" });
  }, [profileOnly, saveMessage]);
  useEffect(
    () => () => {
      activeSave.current?.abort();
      activeSave.current = null;
    },
    [contactKey, identityService],
  );
  const remember = identityService.current()?.remember === true;
  /** Validate and retain customer details before advancing to review. */
  async function save() {
    if (activeSave.current || !remember) return false;
    const next = contactErrors(c, draft.accountEmail);
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) {
      document.getElementById(first)?.focus();
      return false;
    }
    const controller = new AbortController();
    const own = profileAccessGeneration();
    activeSave.current = controller;
    setSaveState({ key: contactKey, saving: true, message: "", failed: false });
    try {
      await identityService.saveProfile(c, controller.signal);
      if (!controller.signal.aborted)
        setSaveState({
          key: contactKey,
          saving: false,
          message: "Details saved.",
          failed: false,
        });
      return !controller.signal.aborted;
    } catch (error) {
      if (
        error instanceof ProfileAccessRevokedError &&
        !controller.signal.aborted
      ) {
        reportProfileAccessLoss(own);
        return false;
      }
      if (!controller.signal.aborted)
        setSaveState({
          key: contactKey,
          saving: false,
          message: "We couldn’t save your details. Please try again.",
          failed: true,
        });
      return false;
    } finally {
      if (activeSave.current === controller) {
        activeSave.current = null;
      }
    }
  }
  /** Update a contact field and invalidate any superseded save or email check. */
  function change<K extends keyof ContactDetails>(
    key: K,
    value: ContactDetails[K],
  ) {
    activeSave.current?.abort();
    activeSave.current = null;
    setSaveState({ key: "", saving: false, message: "", failed: false });
    if (key === "email") {
      emailWork.current?.abort();
      emailWork.current = null;
      setEmailChecking(false);
      setCheckedEmail(null);
    }
    update({ contact: { ...c, [key]: value } });
    setErrors((current) =>
      !Object.hasOwn(current, key)
        ? current
        : {
            ...current,
            [key]: contactErrors(
              { ...c, [key]: value },
              draft.mode === "member" ? draft.accountEmail : undefined,
            )[key],
          },
    );
  }
  function validateField(key: keyof ContactDetails) {
    const next = contactErrors(
      c,
      draft.mode === "member" ? draft.accountEmail : undefined,
    );
    setErrors((current) => ({ ...current, [key]: next[key] }));
  }
  const hints: Record<keyof ContactDetails, string> = {
    name: "John Doe",
    email: draft.mode === "member" ? "" : "abc@gmail.com",
    phone: "Select your country code and enter your mobile number.",
    contactMethod: "",
    academy: "International Sports School",
  };
  /** Render a contact input with its validation feedback. */
  function field(
    key: TextKey,
    label: string,
    type = "text",
    required = true,
    maxLength = 80,
  ) {
    return (
      <div className="field">
        {key === "email" && draft.mode === "member" ? (
          <div className="field-label" id="verified-email-label">
            {label} *
          </div>
        ) : (
          <label className="field-label" htmlFor={key}>
            {label}
            {required ? " *" : <span className="field-optional">Optional</span>}
          </label>
        )}
        <div
          className={
            key === "email" && needsEmailCheck
              ? "email-confirm-input"
              : undefined
          }
        >
          {key === "email" && draft.mode === "member" ? (
            <div
              id={key}
              className="verified-email-value"
              aria-labelledby="verified-email-label"
            >
              {c.email}
            </div>
          ) : (
            <input
              id={key}
              name={key}
              type={type}
              maxLength={maxLength}
              required={required}
              placeholder={hints[key] || undefined}
              value={c[key]}
              aria-invalid={!!errors[key]}
              aria-describedby={
                [
                  errors[key] ? `${key}-error` : "",
                  key === "email" &&
                  needsEmailCheck &&
                  !currentErrors.email &&
                  !errors.email
                    ? "email-check-help"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ") || undefined
              }
              onPaste={(event) => {
                const pasted = event.clipboardData.getData("text").trim();
                if (/[\x00-\x1f\x7f-\x9f]/.test(pasted)) {
                  event.preventDefault();
                  const next = contactErrors({ ...c, [key]: pasted });
                  setErrors((current) =>
                    Object.hasOwn(current, key)
                      ? { ...current, [key]: next[key] }
                      : current,
                  );
                }
              }}
              onChange={(e) => change(key, e.target.value)}
              onBlur={() => validateField(key)}
            />
          )}
          {key === "email" && needsEmailCheck && (
            <button
              type="button"
              className="email-confirm-control"
              aria-label="Confirm email address is correct"
              aria-pressed={emailChecked}
              disabled={!!currentErrors.email || emailChecking}
              aria-busy={emailChecking}
              onClick={() => void confirmEmail()}
            >
              {emailChecked && !emailChecking ? (
                <Icon name="check" />
              ) : (
                <svg
                  className="email-check-icon"
                  viewBox="0 0 28 30"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 5h18" />
                  <g fill="currentColor" stroke="none">
                    <circle cx="5" cy="5" r="2" />
                    <circle cx="14" cy="5" r="2" />
                    <circle cx="23" cy="5" r="2" />
                  </g>
                  <rect x="3" y="13" width="22" height="14" rx="2" />
                  <path d="m4 14 10 7 10-7" />
                </svg>
              )}
            </button>
          )}
        </div>
        {key === "email" &&
          needsEmailCheck &&
          !currentErrors.email &&
          !errors.email && (
            <p
              className="email-check-help"
              id="email-check-help"
              aria-live="polite"
            >
              {emailChecking
                ? "Checking email…"
                : emailChecked
                  ? "You’ve checked your email address."
                  : "Select the envelope to confirm your email address."}
            </p>
          )}
        {errors[key] && (
          <p className="field-error" id={`${key}-error`}>
            {errors[key]}
          </p>
        )}
      </div>
    );
  }
  /** Render a contact selection control with validation feedback. */
  function select(
    key: TextKey,
    label: string,
    options: Record<string, string>,
  ) {
    return (
      <div className="field">
        <label className="field-label" htmlFor={key}>
          {label} *
        </label>
        <select
          id={key}
          name={key}

          value={c[key]}
          required
          aria-invalid={!!errors[key]}
          aria-describedby={errors[key] ? `${key}-error` : undefined}
          onChange={(e) => change(key, e.target.value)}
          onBlur={() => validateField(key)}
        >
          {Object.entries(options).map(([value, name]) => (
            <option key={value} value={value}>
              {name}
            </option>
          ))}
        </select>
        {errors[key] && (
          <p className="field-error" id={`${key}-error`}>
            {errors[key]}
          </p>
        )}
      </div>
    );
  }
  if (
    !profileOnly &&
    !action.calendarRecovery &&
    (attempt?.verifying || attempt?.held)
  )
    return <ReviewStep verifying={attempt.verifying === true} />;
  if (
    needsProfile &&
    (!profileRead.ready || profileRead.email !== draft.accountEmail)
  ) {
    if (profileRead.error)
      return (
        <div className="alert" role="alert">
          <p>{profileRead.error}</p>
          <button
            className="button secondary"
            onClick={() => setProfileRetry((value) => value + 1)}
          >
            Try again
          </button>
        </div>
      );
    return <BrandLoading />;
  }
  return (
    <>
      {profileOnly ? (
        <BookingHeading lines={["Saved contact", "details"]} />
      ) : (
        <BookingHeading lines={["Your", "details"]} />
      )}
      <p className="lead">
        {profileOnly
          ? "Update your saved contact."
          : "Enter your contact details."}
      </p>
      <form
        id="details-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (profileOnly) {
            void save();
            return;
          }
          const next = contactErrors(
            c,
            draft.mode === "member" ? draft.accountEmail : undefined,
          );
          setErrors(next);
          const first = Object.keys(next)[0];
          if (first) document.getElementById(first)?.focus();
          else {
            if (!emailChecked) {
              document
                .querySelector<HTMLButtonElement>(".email-confirm-control")
                ?.focus();
              return;
            }
            if (submitting.current) return;
            submitting.current = true;
            setChecking(true);
            void (async () => {
              try {
                if (draft.mode === "member" && remember) void saveContact();
                // Review uses the local draft; checkout owns server validation.
                if (!mounted.current) return;
                if (bookingService.mode === "live") {
                  if (!(await review())) return;
                }
                if (mounted.current)
                  startNavigation(() => router.push("/book/review/"));
              } finally {
                submitting.current = false;
                if (mounted.current) setChecking(false);
              }
            })();
          }
        }}
      >
        <section className="surface">
          <div className="contact-heading-row">
            <h2 className="section-title">Booking Contact</h2>
            <p className="required-fields">* Required fields</p>
          </div>
          {saveMessage && (
            <p
              className={saveState.failed ? "alert" : "notice success"}
              role={saveState.failed ? "alert" : "status"}
              ref={saveNotice}
              tabIndex={-1}
            >
              {saveMessage}
            </p>
          )}
          <div className="field-grid">
            {field("name", "Full name")}
            {field(
              "email",
              draft.mode === "member"
                ? "Email address (verified)"
                : "Email address",
              "email",
              true,
              EMAIL_MAX_LENGTH,
            )}
            <PhoneInput
              value={c.phone}
              onChange={(value) => change("phone", value)}
              onBlur={() => validateField("phone")}
              error={errors.phone}
            />
            {!profileOnly &&
              select(
                "contactMethod",
                "Preferred contact method",
                CONTACT_METHODS,
              )}
            {!profileOnly &&
              field(
                "academy",
                "Academy / school / organisation",
                "text",
                false,
                120,
              )}
          </div>
        </section>
        {profileOnly && (
          <div className="profile-actions">
            {draft.mode === "member" && remember && (
              <button
                type="submit"
                className="button"
                disabled={saving || checking || !contactValid}
              >
                {saving ? (
                  <span className="button-loading">
                    <Icon name="spinner" className="spinner" />
                    Saving…
                  </span>
                ) : (
                  "Save contact details"
                )}
              </button>
            )}
            <button
              type="button"
              className="button secondary"
              onClick={onClose}
            >
              Back to booking options
            </button>
          </div>
        )}
        {!profileOnly && selectionNotice && (
          <p className="notice" role="status">
            {selectionNotice}
          </p>
        )}
        {action.error && (
          <p className="alert" role="alert">
            {action.error}
          </p>
        )}
        {!profileOnly && (
          <BookingPrimaryAction
            loading={saving}
            className="actions"
            ready={contactValid && !saving}
          >
            <button
              className="button"
              type="submit"
              disabled={saving || checking || !contactValid}
            >
              {saving && <Icon name="spinner" className="spinner" />}
              {saving ? "Saving details…" : "Review Booking"}{" "}
              <BookingActionTotal />
              {!saving && <Icon name="chevron" />}
            </button>
          </BookingPrimaryAction>
        )}
      </form>
    </>
  );
}
