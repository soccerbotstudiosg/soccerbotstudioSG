"use client";
import { useEnquiryNotice } from "./enquiry-notice";
import { PhoneInput } from "@/features/booking/phone-input";
import { EnquiryBotProof } from "@/features/booking/email-bot-proof";
import { enquiryErrors } from "@/domain/enquiry";
import { EMAIL_MAX_LENGTH } from "@/domain/contact";
import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/icon";
import { ENQUIRY_TYPES } from "@/domain/catalog";
import { todaySG } from "@/domain/dates";
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
const hints: Record<keyof Enquiry, string> = {
  name: "John Doe",
  email: "abc@gmail.com",
  phone: "Include your country code, for example +65 81234567.",
  organisation: "International Sports School",
  purpose: "Choose the option that best describes your enquiry.",
  guests: "12",
  date: "Your preferred date, subject to availability.",
  time: "Your preferred time in Singapore time (SGT).",
  message: "Tell us what you need. Maximum 2,000 characters.",
};
// The exported HTML must not accept input before React can retain changes.
const subscribeToHydration = () => () => {};
const hydratedSnapshot = () => true;
const serverSnapshot = () => false;
/** Validate and submit customer enquiries through the configured service. */
export function EnquiryPage() {
  const notify = useEnquiryNotice();
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
    touched[key] ||
    ["name", "email", "phone", "purpose", "message"].includes(key)
      ? validation[key]
      : undefined;
  const change = (key: keyof Enquiry, text: string) => {
    if (key === "guests" && !/^\d{0,3}$/.test(text)) return;
    if (
      key === "phone" &&
      (!/^\+?[\d ()-]*$/.test(text) || text.replace(/\D/g, "").length > 15)
    )
      return;
    setTouched((current) => ({ ...current, [key]: true }));
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
      <input
        id={`enquiry-${key}`}
        placeholder={
          type === "date" || type === "time" ? undefined : hints[key]
        }
        aria-describedby={
          errorFor(key)
            ? `enquiry-${key}-error`
            : type === "date" || type === "time"
              ? `enquiry-${key}-hint`
              : undefined
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
      {feedback(key)}
      {!errorFor(key) && (type === "date" || type === "time") && (
        <p className="field-hint" id={`enquiry-${key}-hint`}>
          {hints[key]}
        </p>
      )}
    </div>
  );
  return (
    <div className="mx-auto min-h-[65vh] max-w-4xl px-5 py-10 sm:px-10">
      <Link className="back mb-8" href="/">
        <Icon name="back" />
        Back to home
      </Link>
      <h1 className="page-title">Contact the studio.</h1>
      <p className="mt-4 text-muted">
        Tell us about your special arrangements or reservation.
      </p>
      <form
        className="surface mt-8 space-y-7"
        aria-busy={!ready || busy}
        noValidate
        onSubmit={async (event) => {
          event.preventDefault();
          if (!ready || sending.current || (live && !botToken)) return;
          setTouched(
            Object.fromEntries(Object.keys(blank).map((key) => [key, true])),
          );
          if (Object.keys(validation).length) return;
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
            notify(result.delivered);
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
        <p className="text-xs text-muted">* Required fields</p>
        <fieldset disabled={!ready}>
          <legend className="mb-5 text-xl font-bold">Your details</legend>
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
              <select
                id="enquiry-purpose"
                aria-describedby={
                  errorFor("purpose")
                    ? "enquiry-purpose-error"
                    : "enquiry-purpose-hint"
                }
                aria-invalid={!!errorFor("purpose")}
                className="field-control"
                required
                value={value.purpose}
                onChange={(e) => change("purpose", e.target.value)}
              >
                <option value="">Select an arrangement</option>
                {ENQUIRY_TYPES.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
              {feedback("purpose")}
              <p className="field-hint" id="enquiry-purpose-hint">
                {hints.purpose}
              </p>
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
                placeholder={hints.message}
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
        <button
          className="button wide booking-entry-action"
          disabled={!ready || busy || (live && !botToken)}
        >
          {busy ? (
            <span className="button-loading">
              <Icon name="spinner" className="spinner" />
              Sending enquiry…
            </span>
          ) : live && proofPending && !Object.keys(validation).length ? (
            "Checking security…"
          ) : (
            "Send enquiry"
          )}
          {live && proofPending && !Object.keys(validation).length && !busy ? (
            <Icon name="spinner" className="spinner" />
          ) : !busy ? (
            <Icon name="chevron" />
          ) : null}
        </button>
      </form>
    </div>
  );
}
