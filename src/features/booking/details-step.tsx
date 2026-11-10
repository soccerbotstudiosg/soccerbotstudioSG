"use client";
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
  type ContactDetails,
  type ContactErrors,
} from "@/domain/contact";
import { useBooking } from "./provider";
import { ReviewStep } from "./review-step";
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
      action,
      selectionNotice,
      cancel,
    } = useBooking(),
    router = useRouter(),
    c = draft.contact;
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
  const errors = {
    ...touchedErrors,
    name: currentErrors.name,
    email: currentErrors.email,
    phone: currentErrors.phone,
  };
  const [checkedEmail, setCheckedEmail] = useState<string | null>(null);
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
    } catch {
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
  function change<K extends keyof ContactDetails>(
    key: K,
    value: ContactDetails[K],
  ) {
    activeSave.current?.abort();
    activeSave.current = null;
    setSaveState({ key: "", saving: false, message: "", failed: false });
    if (key === "email") setCheckedEmail(null);
    update({ contact: { ...c, [key]: value } });
    setErrors((current) => ({ ...current, [key]: undefined }));
  }
  function validateField(key: keyof ContactDetails) {
    const next = contactErrors(
      c,
      draft.mode === "member" ? draft.accountEmail : undefined,
    );
    setErrors((current) => ({ ...current, [key]: next[key] }));
  }
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
        <label className="field-label" htmlFor={key}>
          {label}
          {required ? " *" : <span className="field-optional">Optional</span>}
        </label>
        <div
          className={
            key === "email" && needsEmailCheck
              ? "email-confirm-input"
              : undefined
          }
        >
          <input
            id={key}
            name={key}
            type={type}
            maxLength={maxLength}
            required={required}
            readOnly={key === "email" && draft.mode === "member"}
            value={c[key]}
            aria-invalid={!!errors[key]}
            aria-describedby={
              [
                errors[key] ? `${key}-error` : "",
                key === "email" && needsEmailCheck ? "email-check-help" : "",
              ]
                .filter(Boolean)
                .join(" ") || undefined
            }
            onChange={(e) => change(key, e.target.value)}
            onBlur={() => validateField(key)}
          />
          {key === "email" && needsEmailCheck && (
            <button
              type="button"
              className="email-confirm-control"
              aria-label="Confirm email address is correct"
              aria-pressed={emailChecked}
              disabled={!!currentErrors.email}
              onClick={() => {
                if (!currentErrors.email) setCheckedEmail(c.email);
              }}
            >
              {emailChecked ? (
                <Icon name="check" />
              ) : (
                <span aria-hidden="true">!</span>
              )}
            </button>
          )}
        </div>
        {key === "email" && needsEmailCheck && (
          <p
            className="email-check-help"
            id="email-check-help"
            aria-live="polite"
          >
            {emailChecked
              ? "You’ve checked your email address."
              : "Please double-check your email address, then confirm using the button."}
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
  if (!profileOnly && (attempt?.verifying || attempt?.held))
    return <ReviewStep verifying={attempt.verifying === true} />;
  return (
    <>
      {profileOnly ? (
        <h1 className="page-title">Saved contact details</h1>
      ) : (
        <h1 className="page-title">Your details</h1>
      )}
      <form
        id="details-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (profileOnly) {
            void save().then((saved) => {
              if (saved && mounted.current) onClose?.();
            });
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
                if (draft.mode === "member" && remember && !(await save()))
                  return;
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
        {!profileOnly && bookingService.mode === "live" && (
          <p>
            Review your selected times and details. Your booking is created when
            you continue to payment.
          </p>
        )}
        <p className="booking-required">* Required fields</p>
        <section className="surface">
          <h2 className="section-title">
            {profileOnly ? "Contact profile" : "Booking Contact"}
          </h2>
          {draft.mode === "member" && (
            <p className="section-description">
              {remember
                ? "Your name and phone will be saved when you submit this form. Anyone using this verified email shares these saved contact details. Previous bookings stay unchanged."
                : "Review your contact details for this booking. Changes will not be saved for your next visit."}
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
              120,
            )}
            {field("phone", "Mobile number", "tel", true, 24)}
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
                  <BrandLoading compact label="Saving details…" />
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
        {saveMessage && (
          <p
            className={saveState.failed ? "alert" : "notice"}
            role={saveState.failed ? "alert" : "status"}
          >
            {saveMessage}
          </p>
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
            className="actions"
            ready={contactValid && !saving && !checking}
          >
            <button
              className="button"
              type="submit"
              disabled={saving || checking || !contactValid}
            >
              {checking || saving ? (
                <BrandLoading
                  compact
                  label={saving ? "Saving details…" : "Checking availability…"}
                />
              ) : (
                "Review Booking"
              )}{" "}
              <BookingActionTotal />
              {!saving && !checking && <Icon name="chevron" />}
            </button>
          </BookingPrimaryAction>
        )}
      </form>
    </>
  );
}
