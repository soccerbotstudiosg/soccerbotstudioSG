"use client";
import { useEffect, useId, useRef, useState } from "react";
import { getExampleNumber } from "libphonenumber-js/min";
import examples from "libphonenumber-js/mobile/examples";
import { Icon } from "@/components/icon";
import {
  acceptsPhoneEdit,
  SINGAPORE_PHONE_ERROR,
  INTERNATIONAL_PHONE_ERROR,
  getCountries,
  getCountryCallingCode,
  nationalPhone,
  phoneCountry,
  type CountryCode,
} from "@/domain/phone";
const names = new Intl.DisplayNames(["en"], { type: "region" });
const preferred: CountryCode[] = ["SG", "MY", "ID", "TH", "PH", "VN"];
const countries = [
  ...preferred,
  ...getCountries()
    .filter((country) => !preferred.includes(country))
    .sort((a, b) => (names.of(a) ?? a).localeCompare(names.of(b) ?? b)),
];
const countryLabels = new Map(
  countries.map((country) => [country, names.of(country) ?? country]),
);
const countrySearch = new Map(
  countries.map((country) => [
    country,
    `${country} ${countryLabels.get(country)} +${getCountryCallingCode(country)}`.toLowerCase(),
  ]),
);
/** Country selection and controlled national-number editing share server validation. */
export function PhoneInput({
  value,
  onChange,
  onBlur,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
}) {
  const [selectedCountry, setCountry] = useState<CountryCode>(() =>
    phoneCountry(value),
  );
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [rejected, setRejected] = useState(false);
  const root = useRef<HTMLDivElement>(null),
    trigger = useRef<HTMLButtonElement>(null),
    search = useRef<HTMLInputElement>(null);
  const listId = useId();
  const country =
    value.startsWith("+") &&
    !value.startsWith(`+${getCountryCallingCode(selectedCountry)}`)
      ? phoneCountry(value)
      : selectedCountry;
  const prefix = `+${getCountryCallingCode(country)}`;
  const number = nationalPhone(value, country);
  const options = countries.filter((item) =>
    countrySearch.get(item)!.includes(query.trim().toLowerCase()),
  );
  const message = rejected
    ? "Remove invalid characters or extra digits from the mobile number."
    : error
      ? country === "SG"
        ? SINGAPORE_PHONE_ERROR
        : INTERNATIONAL_PHONE_ERROR
      : undefined;
  useEffect(() => {
    if (!open) return;
    search.current?.focus();
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target))
        setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };
  /** Preserve the entered national digits when changing the selected country. */
  function select(next: CountryCode) {
    setCountry(next);
    setRejected(false);
    onChange(number ? `+${getCountryCallingCode(next)}${number}` : "");
    close();
  }
  /** Reject invalid edits while allowing incomplete numbers to be corrected. */
  function edit(raw: string) {
    const nextCountry = raw.trim().startsWith("+")
      ? phoneCountry(raw.trim())
      : country;
    const digits = nationalPhone(raw, nextCountry);
    if (
      !acceptsPhoneEdit(digits, nextCountry) &&
      !(digits.length < number.length && /^\d*$/.test(digits))
    ) {
      setRejected(true);
      return;
    }
    setRejected(false);
    setCountry(nextCountry);
    onChange(digits ? `+${getCountryCallingCode(nextCountry)}${digits}` : "");
  }
  return (
    <div
      className="field phone-field"
      ref={root}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setOpen(false);
      }}
    >
      <label className="field-label" htmlFor="phone">
        Mobile number *
      </label>
      <div className="phone-control" data-invalid={!!message}>
        <button
          ref={trigger}
          type="button"
          className="phone-country"
          aria-label={`Country code: ${countryLabels.get(country)} ${prefix}`}
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => {
            setOpen(!open);
            setQuery("");
            setActive(0);
          }}
        >
          <span>{country}</span>
          <span>{prefix}</span>
          <Icon name="chevron" />
        </button>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          required
          value={number}
          placeholder={
            country === "SG"
              ? "9123 4567"
              : getExampleNumber(country, examples)?.formatNational()
          }
          aria-invalid={!!message}
          aria-describedby={message ? "phone-error" : undefined}
          onChange={(event) => edit(event.target.value)}
          onBlur={onBlur}
          onPaste={(event) => {
            event.preventDefault();
            const pasted = event.clipboardData.getData("text");
            const input = event.currentTarget;
            edit(
              pasted.trim().startsWith("+")
                ? pasted
                : number.slice(0, input.selectionStart ?? 0) +
                    pasted +
                    number.slice(input.selectionEnd ?? number.length),
            );
          }}
        />
      </div>
      {message && (
        <p className="field-error" id="phone-error" role="alert">
          {message}
        </p>
      )}
      {open && (
        <div
          className="phone-country-menu"
          role="dialog"
          aria-label="Choose country code"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              close();
            }
          }}
        >
          <input
            ref={search}
            className="phone-country-search"
            aria-label="Search country or dial code"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={
              options.length ? `${listId}-${active}` : undefined
            }
            value={query}
            placeholder="Search country or dial code…"
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                const next = options.length
                  ? (active +
                      (event.key === "ArrowDown" ? 1 : options.length - 1)) %
                    options.length
                  : 0;
                setActive(next);
                document
                  .getElementById(`${listId}-${next}`)
                  ?.scrollIntoView?.({ block: "nearest" });
              } else if (event.key === "Enter") {
                event.preventDefault();
                if (options[active]) select(options[active]);
              }
            }}
          />
          <ul
            id={listId}
            role="listbox"
            aria-label="Country calling codes"
            className="phone-country-options"
          >
            {options.map((item, index) => (
              <li
                id={`${listId}-${index}`}
                role="option"
                aria-selected={item === country}
                data-active={index === active}
                key={item}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => select(item)}
              >
                <span className="phone-country-code">{item}</span>
                <span>{countryLabels.get(item)}</span>
                <span className="phone-dial-code">
                  +{getCountryCallingCode(item)}
                  {item === country ? " ✓" : ""}
                </span>
              </li>
            ))}
          </ul>
          {!options.length && (
            <p className="phone-country-empty" role="status">
              No matching countries.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
