"use client";
import { enquiryErrors } from "@/domain/enquiry";
import { EMAIL_MAX_LENGTH } from "@/domain/contact";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
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
  guests: "Optional—your estimated group size, from 1 to 999.",
  date: "Optional—your preferred date, subject to availability.",
  time: "Optional—your preferred time in Singapore time (SGT).",
  message: "Tell us what you need. Maximum 2,000 characters.",
};
// The exported HTML must not accept input before React can retain changes.
const subscribeToHydration = () => () => {};
const hydratedSnapshot = () => true;
const serverSnapshot = () => false;
/** Validate and submit customer enquiries through the configured service. */
export function EnquiryPage() {
  const ready = useSyncExternalStore(
    subscribeToHydration,
    hydratedSnapshot,
    serverSnapshot,
  );
  const [value, setValue] = useState(blank),
    [receipt, setReceipt] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState<
    Partial<Record<keyof Enquiry, boolean>>
  >({});
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
      {receipt ? (
        <div className="py-12 text-center">
          <Icon
            name="check"
            className="mx-auto mb-6 h-16 w-16 text-emerald-600"
          />
          <h1 className="page-title">Thank you.</h1>
          <p className="mt-6">
            Your enquiry for <strong>{receipt}</strong> is ready in this
            preview.
          </p>
          <p className="mt-3 text-sm text-muted">Preview · No enquiry sent.</p>
          <button
            className="button mt-8"
            onClick={() => {
              setReceipt("");
              setValue(blank);
              setTouched({});
            }}
          >
            Send another enquiry
          </button>
        </div>
      ) : (
        <>
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
              if (!ready || busy) return;
              setTouched(
                Object.fromEntries(
                  Object.keys(blank).map((key) => [key, true]),
                ),
              );
              if (Object.keys(validation).length) return;
              setBusy(true);
              setError("");
              try {
                const result = await services.enquiry.submit(value);
                setReceipt(result.email);
              } catch (e) {
                setError(
                  customerMessage(
                    e,
                    "We couldn’t send your enquiry. Please try again or contact the studio.",
                  ),
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <p className="text-xs text-muted">* Required fields</p>
            <fieldset disabled={!ready}>
              <legend className="mb-5 text-xl font-bold">Your details</legend>
              <div className="grid gap-5 sm:grid-cols-2">
                {field("name", "Full name", "text", true)}
                {field("email", "Email address", "email", true)}
                {field("phone", "Contact number", "tel", true)}
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
            <button className="button" disabled={!ready || busy}>
              {busy ? "Preparing…" : "Send enquiry"}
              <Icon name="chevron" />
            </button>
          </form>
        </>
      )}
    </div>
  );
}
