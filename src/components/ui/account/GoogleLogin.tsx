"use client";

import { useEffect, useState } from "react";
import { useAccountStore } from "@/store/useAccountStore";
import { CheckIcon, SpinIcon } from "../icons";
import { FOCUS, GHOST_BUTTON, Note } from "../panel/controls";

const PERKS = ["Lihat status dan riwayat semua pesananmu", "Pesan ulang decal favorit tanpa mengatur dari awal"];

/** Akun contoh yang dipakai selama login masih mockup. */
const MOCK_GOOGLE_ACCOUNT = { nama: "Rizky Pratama", email: "rizky.pratama@gmail.com" };

/** Layar masuk: satu-satunya cara masuk adalah akun Google (MOCKUP: belum tersambung ke Google). */
export function GoogleLogin() {
  const login = useAccountStore((s) => s.login);
  const close = useAccountStore((s) => s.close);
  const [connecting, setConnecting] = useState(false);

  // Jeda singkat meniru proses menyambung ke Google, lalu masuk dengan akun contoh.
  useEffect(() => {
    if (!connecting) return;
    const timer = window.setTimeout(() => login(MOCK_GOOGLE_ACCOUNT), 900);
    return () => window.clearTimeout(timer);
  }, [connecting, login]);

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm leading-snug text-white/65">
        Masuk dengan akun Google untuk melacak pesanan decal dan memesan ulang desain yang pernah kamu buat.
      </p>

      <ul className="flex flex-col gap-2">
        {PERKS.map((perk) => (
          <li key={perk} className="flex items-start gap-2.5 text-sm leading-snug text-white/80">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center bg-accent text-ink-950">
              <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.6} />
            </span>
            {perk}
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          data-sound="select"
          disabled={connecting}
          aria-busy={connecting}
          onClick={() => setConnecting(true)}
          className={`${FOCUS} hud-cut-sm flex h-12 items-center justify-center gap-3 bg-white px-4 font-display text-lg font-extrabold uppercase italic text-ink-950 transition-[transform,opacity] duration-150 active:scale-[0.97] disabled:opacity-70`}
        >
          {connecting ? (
            <SpinIcon className="h-5 w-5 animate-spin motion-reduce:animate-none" strokeWidth={2.2} />
          ) : (
            <span className="flex h-6 w-6 items-center justify-center bg-ink-950 font-sans text-base font-bold not-italic text-white" aria-hidden="true">
              G
            </span>
          )}
          {connecting ? "Menghubungkan…" : "Masuk dengan Google"}
        </button>
        <button type="button" data-sound="tap" onClick={close} disabled={connecting} className={`${GHOST_BUTTON} disabled:opacity-30`}>
          Lanjut tanpa masuk
        </button>
      </div>

      <Note>Ini masih simulasi: tombol belum tersambung ke Google, dan masuk memakai akun contoh.</Note>
    </div>
  );
}
