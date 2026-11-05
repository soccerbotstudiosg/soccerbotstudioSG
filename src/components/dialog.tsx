"use client";
import { useId, useLayoutEffect, useRef, type ReactNode } from "react";
import { Icon } from "./icon";
/** Manage modal focus, dismissal and restoration for shared dialogs. */
export function Dialog({
  title,
  onClose,
  children,
  variant,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  variant?: "player-app";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useLayoutEffect(() => {
    const dialog = ref.current;
    const opener = document.activeElement;
    dialog?.showModal();
    return () => {
      // Close while the dialog is still attached so native modal state and
      // focus are released before React removes it from the document.
      dialog?.close();
      if (opener instanceof HTMLElement && opener.isConnected)
        opener.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`fixed m-auto max-h-[85dvh] w-[calc(100%-32px)] max-w-xl overflow-auto rounded-2xl border border-line p-6 text-ink shadow-2xl backdrop:bg-navy/65${variant === "player-app" ? " player-app-dialog" : ""}`}
      aria-labelledby={titleId}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === ref.current) {
          const rect = ref.current!.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            onClose();
        }
      }}
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="dialog-title" id={titleId}>
          {title}
        </h2>
        <button
          className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-line"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <Icon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
