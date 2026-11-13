"use client";

import { CAMERA_PRESETS } from "@/data/cameraPresets";
import { useSceneStore } from "@/store/useSceneStore";
import { CameraIcon, SpinIcon } from "./icons";

// Tombol miring (parallelogram). Isi tombol dimiringkan balik supaya tetap tegak.
const SLANT = "-skew-x-[14deg]";
const UNSLANT = "skew-x-[14deg]";
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/**
 * Bar sudut kamera + tombol rotasi 360° (bengkel beserta motor).
 * Mobile: melayang tepat di atas bottom sheet. Desktop: bawah-tengah area canvas.
 */
export function CameraPresetBar() {
  const active = useSceneStore((s) => s.cameraPreset);
  const selectCameraPreset = useSceneStore((s) => s.selectCameraPreset);
  const spinning = useSceneStore((s) => s.spinMode === "spin");
  const toggleSpin = useSceneStore((s) => s.toggleSpin);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[calc(var(--sheet-h)+0.625rem)] z-10 flex justify-center px-4 transition-[bottom] duration-300 ease-out lg:bottom-7 lg:right-(--sidebar-w)">
      <div role="group" aria-label="Sudut kamera" className="pointer-events-auto flex items-stretch gap-1">
        {CAMERA_PRESETS.map((preset) => {
          const isActive = preset.id === active;
          return (
            <button
              key={preset.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => selectCameraPreset(preset.id)}
              className={`${SLANT} ${FOCUS} h-11 border px-3 transition-[background-color,color,transform] duration-150 active:scale-95 sm:px-4 ${
                isActive
                  ? "hud-glow border-accent bg-accent text-ink-950"
                  : "hud-panel border-white/12 text-white/75 hover:border-white/35 hover:text-white"
              }`}
            >
              <span className={`${UNSLANT} flex items-center gap-1.5`}>
                <CameraIcon id={preset.id} className="hidden h-4 w-4 sm:block" />
                <span className="font-display text-[0.95rem] font-bold uppercase italic tracking-wide">
                  {preset.label}
                </span>
              </span>
            </button>
          );
        })}

        <button
          type="button"
          data-sound="toggle"
          aria-pressed={spinning}
          aria-label={spinning ? "Hentikan rotasi 360°" : "Putar bengkel dan motor 360°"}
          title={spinning ? "Hentikan rotasi 360°" : "Putar bengkel dan motor 360°"}
          onClick={toggleSpin}
          className={`${SLANT} ${FOCUS} hud-panel ml-1 h-11 w-11 border transition-[border-color,color,transform] duration-150 active:scale-95 ${
            spinning ? "border-accent/70 text-accent" : "border-white/12 text-white/55 hover:text-white"
          }`}
        >
          <span className={`${UNSLANT} flex items-center justify-center`}>
            <SpinIcon
              className={`h-5 w-5 ${spinning ? "animate-spin [animation-duration:6s] motion-reduce:animate-none" : ""}`}
            />
          </span>
        </button>
      </div>
    </div>
  );
}
