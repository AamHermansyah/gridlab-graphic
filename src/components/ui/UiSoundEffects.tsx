"use client";

import { useEffect } from "react";
import { isUiSoundKind, playUiSound } from "@/lib/uiSound";
import { useSceneStore } from "@/store/useSceneStore";

const STORAGE_KEY = "gridlab:suara";

/** Menyimpan pilihan suara per perangkat. Gagal diam-diam jika storage diblokir. */
export function saveSoundPreference(enabled: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    // mode privat / storage diblokir: abaikan
  }
}

/**
 * Memasang satu listener klik global: SETIAP <button> otomatis berbunyi,
 * termasuk tombol yang dibuat di tahap berikutnya.
 * Jenis suara diatur lewat atribut `data-sound="tap|select|toggle|none"`.
 */
export function UiSoundEffects() {
  useEffect(() => {
    // Pulihkan pilihan suara yang tersimpan.
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "0") {
        useSceneStore.getState().setSoundEnabled(false);
      }
    } catch {
      // abaikan
    }

    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest("button");
      if (!button || button.disabled) return;
      if (!useSceneStore.getState().soundEnabled) return;
      const kind = button.dataset.sound;
      if (kind === "none") return;
      playUiSound(isUiSoundKind(kind) ? kind : "tap");
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
