"use client";

import { useAccountStore } from "@/store/useAccountStore";
import { UserIcon } from "../icons";

/** Tombol akun di HUD atas: "Masuk" bila belum login, inisial + nama bila sudah. Membuka overlay akun. */
export function AccountButton() {
  const account = useAccountStore((s) => s.account);
  const openAccount = useAccountStore((s) => s.openAccount);
  const label = account ? `Akun ${account.nama}: lihat riwayat pesanan` : "Masuk ke akun";

  return (
    <button
      type="button"
      data-sound="select"
      aria-haspopup="dialog"
      aria-label={label}
      title={label}
      onClick={openAccount}
      className={`hud-panel hud-cut-sm pointer-events-auto flex h-10 items-center gap-2 border px-2.5 transition-[border-color,color,transform] duration-150 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        account ? "border-accent/60 text-white" : "border-white/12 text-white/75 hover:border-white/40 hover:text-white"
      }`}
    >
      {account ? (
        <span className="flex h-6 w-6 items-center justify-center bg-accent font-display text-sm font-extrabold italic text-ink-950">
          {account.nama.charAt(0).toUpperCase()}
        </span>
      ) : (
        <UserIcon className="h-5 w-5" />
      )}
      <span
        className={`max-w-28 truncate font-display text-sm font-bold uppercase italic leading-none ${account ? "hidden sm:inline" : ""}`}
      >
        {account ? account.nama.split(" ")[0] : "Masuk"}
      </span>
    </button>
  );
}
