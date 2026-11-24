"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { CloseIcon } from "./icons";

/**
 * Native <dialog> wrapper: focus trap, Escape to close, inert page and
 * backdrop click. `variant` sets the drawer side or a centred modal.
 */
export function Dialog({
  open,
  onClose,
  label,
  variant = "right",
  className = "",
  children,
  showClose = true,
  closeClassName = "",
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  variant?: "left" | "right" | "top" | "center";
  className?: string;
  children: ReactNode;
  showClose?: boolean;
  closeClassName?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const handle = () => onClose();
    d.addEventListener("close", handle);
    return () => d.removeEventListener("close", handle);
  }, [onClose]);

  // Close if the component unmounts while open (e.g. route hidden by <Activity>)
  useEffect(() => {
    const d = ref.current;
    return () => {
      if (d?.open) d.close();
    };
  }, []);

  const placement = {
    right:
      "ml-auto mr-0 h-dvh max-h-dvh w-[min(26rem,100vw)] translate-x-full open:translate-x-0 starting:open:translate-x-full",
    left: "ml-0 mr-auto h-dvh max-h-dvh w-[min(22rem,90vw)] -translate-x-full open:translate-x-0 starting:open:-translate-x-full",
    top: "mt-0 mb-auto w-full max-w-none -translate-y-full open:translate-y-0 starting:open:-translate-y-full",
    center:
      "m-auto max-h-[90dvh] w-[min(44rem,calc(100vw-2rem))] scale-95 opacity-0 open:scale-100 open:opacity-100 starting:open:scale-95 starting:open:opacity-0",
  }[variant];

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={`max-w-none overflow-y-auto overscroll-contain p-0 ${/\bbg-/.test(className) ? "" : "bg-white text-brand-green"} shadow-lift transition-[translate,scale,opacity,display,overlay] transition-discrete duration-300 ease-out backdrop:bg-brand-green/55 ${placement} ${className}`}
    >
      {showClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className={`absolute right-3 top-3 z-10 grid size-11 place-items-center ${closeClassName}`}
        >
          <CloseIcon />
        </button>
      )}
      {children}
    </dialog>
  );
}
