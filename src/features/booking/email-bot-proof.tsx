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
}: {
  onToken: (token: string) => void;
  purpose: "verify-email" | "create-checkout";
  label: string;
  unavailable: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  useEffect(() => {
    const api = window.turnstile;
    if (!ready || !sitekey || !api || !container.current) return;
    let active = true;
    const token = (value: string) => {
      if (active) {
        if (value) setFailed(false);
        onToken(value);
      }
    };
    const id = api.render(container.current, {
      sitekey,
      action: purpose,
      appearance: purpose === "create-checkout" ? "interaction-only" : "always",
      callback: token,
      "expired-callback": () => token(""),
      "error-callback": () => {
        if (active) setFailed(true);
        token("");
      },
    });
    return () => {
      active = false;
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
      <div className="auth-bot-proof">
        <div ref={container} aria-label={label} />
      </div>
    </>
  );
}

/** Prepare email proof while preserving the email-specific unavailable guidance. */
export function EmailBotProof({
  onToken,
}: {
  onToken: (token: string) => void;
}) {
  return (
    <BotProof
      onToken={onToken}
      purpose="verify-email"
      label="Email security check"
      unavailable="Email verification unavailable. Please continue as a guest."
    />
  );
}

/** Prepare checkout proof on Review without challenging payment continuation. */
export function CheckoutBotProof({
  onToken,
}: {
  onToken: (token: string) => void;
}) {
  return (
    <BotProof
      onToken={onToken}
      purpose="create-checkout"
      label="Checkout security check"
      unavailable="Security check unavailable. Please refresh this page and try again."
    />
  );
}
