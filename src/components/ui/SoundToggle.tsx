"use client";

import { useSceneStore } from "@/store/useSceneStore";
import { SoundIcon } from "./icons";
import { saveSoundPreference } from "./UiSoundEffects";

/** Tombol kecil untuk menyalakan/mematikan efek suara HUD. */
export function SoundToggle() {
  const enabled = useSceneStore((s) => s.soundEnabled);
  const setSoundEnabled = useSceneStore((s) => s.setSoundEnabled);
  const label = enabled ? "Matikan suara" : "Nyalakan suara";

  return (
    <button
      type="button"
      data-sound="toggle"
      aria-pressed={enabled}
      aria-label={label}
      title={label}
      onClick={() => {
        setSoundEnabled(!enabled);
        saveSoundPreference(!enabled);
      }}
      className={`hud-panel hud-cut-sm pointer-events-auto flex h-10 w-10 items-center justify-center border transition-[border-color,color,transform] duration-150 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        enabled ? "border-accent/60 text-accent" : "border-white/12 text-white/50 hover:text-white"
      }`}
    >
      <SoundIcon on={enabled} className="h-5 w-5" />
    </button>
  );
}
