"use client";
import { Icon } from "@/components/icon";
import { focusFormError } from "@/components/form-focus";
import { BookingPrimaryAction } from "@/features/booking/booking-primary-action";
import { PhoneInput } from "@/features/booking/phone-input";
import { EnquiryBotProof } from "@/features/booking/email-bot-proof";
import { enquiryErrors } from "@/domain/enquiry";
import { EMAIL_MAX_LENGTH } from "@/domain/contact";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { OPENING_MINUTE, CLOSING_MINUTE } from "@/domain/booking-policy";
import {
  LOCATION,
  CONTACT,
  BOOKING_SUPPORT,
  ENQUIRY_TYPES,
} from "@/domain/catalog";
import { openingTime, todaySG } from "@/domain/dates";
import { services } from "@/services";
import { customerMessage, type Enquiry } from "@/services/contracts";
const blank: Enquiry = {
  name: "",
  email: "",
  phone: "",
  organisation: "",
  purpose: "",
  guests: "",
  date: "",
  time: "",
  message: "",
};
const placeholders: Partial<Record<keyof Enquiry, string>> = {
  name: "John Doe",
  email: "abc@gmail.com",
  organisation: "International Sports School",
  guests: "12",
  message: "Tell us what you need. Maximum 2,000 characters.",
};
// The exported HTML must not accept input before React can retain changes.
const subscribeToHydration = () => () => {};
const hydratedSnapshot = () => true;
const serverSnapshot = () => false;
/** Validate and submit customer enquiries through the configured service. */
export function EnquiryPage() {
  const [acknowledged, setAcknowledged] = useState<boolean | null>(null);
  const acknowledgement = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (acknowledged === null) return;
    acknowledgement.current?.focus({ preventScroll: true });
    acknowledgement.current?.scrollIntoView({ block: "start" });
  }, [acknowledged]);
  const ready = useSyncExternalStore(
    subscribeToHydration,
    hydratedSnapshot,
    serverSnapshot,
  );
  const [value, setValue] = useState(blank),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState<
    Partial<Record<keyof Enquiry, boolean>>
  >({});
  const [botToken, setBotToken] = useState("");
  const [proofPending, setProofPending] = useState(false);
  const [botGeneration, setBotGeneration] = useState(0);
  const submission = useRef<{ snapshot: string; key: string } | null>(null);
  const sending = useRef(false);
  const live = services.enquiry.mode === "live";
  const validation = enquiryErrors(value);
  const errorFor = (key: keyof Enquiry) =>
    touched[key] ? validation[key] : undefined;
  const change = (key: keyof Enquiry, text: string) => {
    if (key === "guests" && !/^\d{0,3}$/.test(text)) return;
    if (
      key === "phone" &&
      (!/^\+?[\d ()-]*$/.test(text) || text.replace(/\D/g, "").length > 15)
    )
      return;
    setAcknowledged(null);
    setValue((current) => ({ ...current, [key]: text }));
  };
  const feedback = (key: keyof Enquiry) =>
    errorFor(key) ? (
      <p className="field-error" id={`enquiry-${key}-error`} role="alert">
        {errorFor(key)}
      </p>
    ) : null;
  const field = (
    key: keyof Enquiry,
    label: string,
    type = "text",
    required = false,
  ) => (
    <div>
      <label className="field-label" htmlFor={`enquiry-${key}`}>
        {label}{" "}
        {required ? (
          "*"
        ) : (
          <span className="font-normal text-muted">Optional</span>
        )}
      </label>
      <div className="enquiry-input-wrap" data-empty={!value[key]}>
        <input
          id={`enquiry-${key}`}
          placeholder={
            type === "date" || type === "time" ? undefined : placeholders[key]
          }
          aria-describedby={
            [
              type === "date" || type === "time" ? `enquiry-${key}-hint` : "",
              errorFor(key) ? `enquiry-${key}-error` : "",
            ]
              .filter(Boolean)
              .join(" ") || undefined
          }
          aria-invalid={!!errorFor(key)}
          className="field-control"
          value={value[key]}
          type={type}
          required={required}
          min={type === "date" ? todaySG() : type === "number" ? 1 : undefined}
          max={type === "number" ? 999 : undefined}
          maxLength={
            key === "email"
              ? EMAIL_MAX_LENGTH
              : key === "name"
                ? 80
                : key === "organisation"
                  ? 120
                  : 160
          }
          onChange={(e) => change(key, e.target.value)}
          onBlur={() => setTouched((current) => ({ ...current, [key]: true }))}
        />
        {(type === "date" || type === "time") && (
          <span
            className="native-field-hint"
            id={`enquiry-${key}-hint`}
            hidden={!!value[key]}
          >
            {type === "date" ? "Select a date." : "Select a time (SGT)."}
          </span>
        )}
      </div>
      {feedback(key)}
    </div>
  );
  return (
    <div className="enquiry-page mx-auto min-h-[65vh] max-w-4xl px-5 py-10 sm:px-10">
      <div className="booking-heading-row">
        <h1 className="page-title">Contact the studio</h1>
      </div>
      {acknowledged !== null && (
        <div
          className={`notice ${acknowledged ? "success" : "warning"} mt-5`}
          role="status"
          tabIndex={-1}
          ref={acknowledgement}
        >
          {acknowledged
            ? "Enquiry sent. We’ll reach out as soon as we can."
            : "Preview · No enquiry sent."}
        </div>
      )}
      <section
        className="enquiry-contact-details"
        aria-label="Studio contact details"
      >
        <div className="enquiry-location-details">
          <div>
            <p className="enquiry-contact-label">Visit us</p>
            <address>
              <strong>{LOCATION.building}</strong>
              <span>
                {LOCATION.street}, {LOCATION.unit}
              </span>
              <span>{LOCATION.postal}</span>
            </address>
          </div>
          <div className="enquiry-opening-hours">
            <p className="enquiry-contact-label">Opening hours</p>
            <p>
              Open daily · {openingTime(OPENING_MINUTE)}–
              {openingTime(CLOSING_MINUTE)}
            </p>
          </div>
        </div>
        <div className="enquiry-contact-links">
          <a href={`mailto:${CONTACT.email}`}>
            <Icon name="mail" />
            <span>
              <span className="enquiry-contact-label">Email</span>
              <span className="enquiry-contact-value">{CONTACT.email}</span>
            </span>
          </a>
          <a href={`tel:${CONTACT.phone}`}>
            <Icon name="phone" />
            <span>
              <span className="enquiry-contact-label">Call</span>
              <span className="enquiry-contact-value">
                {CONTACT.phoneDisplay}
              </span>
            </span>
          </a>
          <a
            href={BOOKING_SUPPORT.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="whatsapp" />
            <span>
              <span className="enquiry-contact-label">WhatsApp</span>
              <span className="enquiry-contact-value">
                {CONTACT.phoneDisplay}
              </span>
            </span>
          </a>
        </div>
      </section>
      <form
        className="surface mt-8 enquiry-form"
        aria-busy={!ready || busy}
        noValidate
        onSubmit={async (event) => {
          event.preventDefault();
          if (!ready || sending.current) return;
          setTouched(
            Object.fromEntries(Object.keys(blank).map((key) => [key, true])),
          );
          if (Object.keys(validation).length) {
            focusFormError(
              event.currentTarget,
              Object.keys(validation).map((key) =>
                key === "phone" ? "phone" : `enquiry-${key}`,
              ),
            );
            return;
          }
          if (live && !botToken) return;
          sending.current = true;
          setBusy(true);
          setError("");
          try {
            const snapshot = JSON.stringify(value);
            if (submission.current?.snapshot !== snapshot)
              submission.current = { snapshot, key: crypto.randomUUID() };
            const result = await services.enquiry.submit(value, {
              key: submission.current.key,
              botToken,
            });
            submission.current = null;
            setValue(blank);
            setTouched({});
            setAcknowledged(result.delivered);
          } catch (e) {
            setError(
              customerMessage(
                e,
                "We couldn’t send your enquiry. Please try again or contact the studio.",
              ),
            );
          } finally {
            sending.current = false;
            setBusy(false);
            setBotToken("");
            setBotGeneration((current) => current + 1);
          }
        }}
      >
        <fieldset disabled={!ready}>
          <legend className="mb-5 w-full">
            <span className="contact-heading-row">
              <span className="text-xl font-bold">Your details</span>
              <span className="required-fields">* Required fields</span>
            </span>
          </legend>
          <div className="grid gap-5 sm:grid-cols-2">
            {field("name", "Full name", "text", true)}
            {field("email", "Email address", "email", true)}
            <PhoneInput
              value={value.phone}
              onChange={(phone) => change("phone", phone)}
              onBlur={() =>
                setTouched((current) => ({ ...current, phone: true }))
              }
              error={errorFor("phone")}
            />
            {field("organisation", "Academy, school or organisation")}
          </div>
        </fieldset>
        <fieldset disabled={!ready}>
          <legend className="mb-5 text-xl font-bold">Your plans</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="enquiry-purpose" className="field-label">
                Enquiry type *
              </label>
              <div className="field-select-control">
                <select
                  id="enquiry-purpose"
                  aria-describedby={
                    errorFor("purpose") ? "enquiry-purpose-error" : undefined
                  }
                  aria-invalid={!!errorFor("purpose")}
                  className="field-control"
                  required
                  value={value.purpose}
                  onChange={(e) => change("purpose", e.target.value)}
                  onBlur={() =>
                    setTouched((current) => ({ ...current, purpose: true }))
                  }
                >
                  <option value="">Select an arrangement</option>
                  {ENQUIRY_TYPES.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
                <Icon name="chevron" />
              </div>
              {feedback("purpose")}
            </div>
            {field("guests", "Number of guests", "number")}
            {field("date", "Preferred date", "date")}
            {field("time", "Preferred time", "time")}
            <div className="sm:col-span-2">
              <label htmlFor="enquiry-message" className="field-label">
                Your requirements *
              </label>
              <textarea
                id="enquiry-message"
                aria-invalid={!!errorFor("message")}
                aria-describedby={
                  errorFor("message") ? "enquiry-message-error" : undefined
                }
                placeholder={placeholders.message}
                rows={5}
                className="field-control"
                required
                maxLength={2000}
                value={value.message}
                onChange={(e) => change("message", e.target.value)}
                onBlur={() =>
                  setTouched((current) => ({ ...current, message: true }))
                }
              />
              {feedback("message")}
            </div>
          </div>
        </fieldset>
        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}
        {live && (
          <EnquiryBotProof
            key={botGeneration}
            onToken={setBotToken}
            onPendingChange={setProofPending}
          />
        )}
        <BookingPrimaryAction
          ready={ready && !busy && (!live || !!botToken)}
          loading={
            busy || (live && proofPending && !Object.keys(validation).length)
          }
        >
          <button
            className="button wide"
            disabled={
              !ready ||
              busy ||
              (live && !botToken && !Object.keys(validation).length)
            }
          >
            {(busy ||
              (live && proofPending && !Object.keys(validation).length)) && (
              <Icon name="spinner" className="spinner" />
            )}
            {busy ? (
              <span className="button-loading">Sending enquiry…</span>
            ) : live && proofPending && !Object.keys(validation).length ? (
              "Checking security…"
            ) : (
              "Send enquiry"
            )}
            {!busy &&
              !(live && proofPending && !Object.keys(validation).length) && (
                <Icon name="chevron" />
              )}
          </button>
        </BookingPrimaryAction>
      </form>
    </div>
  );
}
