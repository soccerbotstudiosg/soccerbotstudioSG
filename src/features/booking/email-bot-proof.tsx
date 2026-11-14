"use client";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type Turnstile = {
  render(
    container: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      appearance: "always" | "interaction-only";
      callback: (token: string) => void;
      "before-interactive-callback": () => void;
      "after-interactive-callback": () => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ): string;
  remove(id: string): void;
};
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}
/** Manage purpose-bound Turnstile proof without retaining it outside this page. */
function BotProof({
  onToken,
  purpose,
  label,
  unavailable,
  onPendingChange,
}: {
  onToken: (token: string) => void;
  purpose: "verify-email" | "create-checkout" | "send-enquiry";
  label: string;
  unavailable: string;
  onPendingChange?: (pending: boolean) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [interactive, setInteractive] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  useEffect(() => {
    onPendingChange?.(!!sitekey && !failed && !interactive && !hasToken);
  }, [sitekey, failed, interactive, hasToken, onPendingChange]);
  useEffect(() => {
    const api = window.turnstile;
    if (!ready || !sitekey || !api || !container.current) return;
    let active = true;
    const token = (value: string) => {
      if (active) {
        setHasToken(!!value);
        if (value) {
          setFailed(false);
          setInteractive(false);
        }
        onToken(value);
      }
    };
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(([entry]) => {
            if (active) setVisible(entry.contentRect.height > 0);
          });
    observer?.observe(container.current);
    const id = api.render(container.current, {
      sitekey,
      action: purpose,
      appearance: "interaction-only",
      callback: token,
      "before-interactive-callback": () => {
        if (active) setInteractive(true);
      },
      "after-interactive-callback": () => {
        if (active) setInteractive(false);
      },
      "expired-callback": () => token(""),
      "error-callback": () => {
        if (active) setFailed(true);
        token("");
      },
    });
    return () => {
      active = false;
      observer?.disconnect();
      api.remove(id);
    };
  }, [ready, sitekey, onToken, purpose]);
  if (!sitekey)
    return (
      <p className="notice" role="status">
        {unavailable}
      </p>
    );
  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setReady(true)}
        onError={() => {
          setFailed(true);
          onToken("");
        }}
      />
      {failed && (
        <p className="notice" role="status">
          Security check unavailable. Please refresh this page and try again.
        </p>
      )}
      <div
        className={`auth-bot-proof checkout-bot-proof${!interactive && !visible ? " auth-bot-proof-background" : ""}`}
      >
        <div ref={container} aria-label={label} />
      </div>
    </>
  );
}

/** Prepare email proof while preserving the email-specific unavailable guidance. */
export function EmailBotProof({
  onToken,
  onPendingChange,
}: {
  onToken: (token: string) => void;
  onPendingChange?: (pending: boolean) => void;
}) {
  return (
    <BotProof
      onToken={onToken}
      purpose="verify-email"
      onPendingChange={onPendingChange}
      label="Email security check"
      unavailable="Email verification unavailable. Please continue as a guest."
    />
  );
}

/** Prepare checkout proof on Review without challenging payment continuation. */
export function CheckoutBotProof({
  onToken,
  onPendingChange,
}: {
  onToken: (token: string) => void;
  onPendingChange?: (pending: boolean) => void;
}) {
  return (
    <BotProof
      onToken={onToken}
      onPendingChange={onPendingChange}
      purpose="create-checkout"
      label="Checkout security check"
      unavailable="Security check unavailable. Please refresh this page and try again."
    />
  );
}

/** Bind enquiry submission to its own security challenge. */
export function EnquiryBotProof({
  onToken,
  onPendingChange,
}: {
  onToken: (token: string) => void;
  onPendingChange: (pending: boolean) => void;
}) {
  return (
    <BotProof
      onToken={onToken}
      onPendingChange={onPendingChange}
      purpose="send-enquiry"
      label="Enquiry security check"
      unavailable="Security check unavailable. Please refresh this page and try again."
    />
  );
}
