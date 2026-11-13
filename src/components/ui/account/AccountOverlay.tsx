"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { useAccountStore } from "@/store/useAccountStore";
import { CloseIcon } from "../icons";
import { FOCUS } from "../panel/controls";
import { GoogleLogin } from "./GoogleLogin";
import { OrderHistory } from "./OrderHistory";

const FOCUSABLE = 'a[href], button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

function AccountDialog() {
  const view = useAccountStore((s) => s.view);
  const close = useAccountStore((s) => s.close);
  const dialog = useRef<HTMLDivElement>(null);
  const history = view === "riwayat";

  // Fokus pindah ke dialog saat dibuka dan kembali ke tombol pemicu saat ditutup.
  useEffect(() => {
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.current?.focus();
    return () => trigger?.focus();
  }, []);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      close();
      return;
    }
    if (event.key !== "Tab" || !dialog.current) return;

    // Fokus tidak boleh keluar dari dialog.
    const nodes = Array.from(dialog.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const activeEl = document.activeElement;
    if (event.shiftKey && (activeEl === first || activeEl === dialog.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && activeEl === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className="hud-fade-in fixed inset-0 z-40 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="akun-judul"
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={`hud-panel hud-cut hud-rise-in relative flex max-h-[92dvh] w-full flex-col border border-white/10 outline-none ${
          history ? "sm:max-w-xl" : "sm:max-w-md"
        }`}
      >
        {/* Garis aksen di tepi atas, sama seperti panel konfigurator */}
        <div className="absolute left-0 top-0 h-0.5 w-24 bg-accent" aria-hidden="true" />

        <header className="flex shrink-0 items-start justify-between gap-3 px-4 pb-3 pt-6 sm:px-6 sm:pt-7">
          <div className="min-w-0">
            <p className="hud-label flex items-center gap-2 text-accent">
              <span className="h-3 w-1.5 -skew-x-12 bg-accent" aria-hidden="true" />
              {history ? "Garasi pribadi" : "Akun pemain"}
            </p>
            <h2
              id="akun-judul"
              className="mt-1 font-display text-4xl font-extrabold uppercase italic leading-none text-white"
            >
              {history ? "Riwayat Pesanan" : "Masuk Garasi"}
            </h2>
          </div>
          <button
            type="button"
            data-sound="tap"
            onClick={close}
            aria-label="Tutup"
            title="Tutup"
            className={`${FOCUS} hud-cut-sm flex h-10 w-10 shrink-0 items-center justify-center border border-white/15 bg-white/5 text-white/80 transition-[border-color,color,transform] duration-150 hover:border-accent hover:text-accent active:scale-95`}
          >
            <CloseIcon className="h-5 w-5" strokeWidth={2.2} />
          </button>
        </header>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-white/8 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-6 sm:pt-5">
          {history ? <OrderHistory /> : <GoogleLogin />}
        </div>
      </div>
    </div>
  );
}

/** Overlay akun bergaya menu game: layar masuk dengan Google, lalu riwayat pesanan. Esc atau klik di luar untuk menutup. */
export function AccountOverlay() {
  const open = useAccountStore((s) => s.open);
  return open ? <AccountDialog /> : null;
}
