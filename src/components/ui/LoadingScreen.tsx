"use client";

/**
 * Loading screen bergaya layar muat game.
 * Saat scene siap, layar bergeser ke atas seperti pintu garasi yang terbuka.
 */
export function LoadingScreen({ visible }: { visible: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
      className={`loading-backdrop fixed inset-0 z-50 flex flex-col items-center justify-center transition-[transform,opacity,visibility] duration-700 ease-[cubic-bezier(0.7,0,0.2,1)] motion-reduce:transition-opacity ${
        visible
          ? "visible translate-y-0 opacity-100"
          : "pointer-events-none invisible -translate-y-full opacity-95 motion-reduce:translate-y-0 motion-reduce:opacity-0"
      }`}
    >
      <p className="hud-label flex items-center gap-2 text-white/60">
        <span className="h-3 w-1.5 -skew-x-12 bg-accent" aria-hidden="true" />
        Konfigurator Decal
      </p>
      <p className="mt-2 font-display text-6xl font-extrabold uppercase italic leading-[0.9] tracking-tight text-white sm:text-7xl">
        GridLab
      </p>
      <p className="hud-text-glow font-display text-6xl font-extrabold uppercase italic leading-[0.9] tracking-tight text-accent sm:text-7xl">
        Graphic
      </p>

      {/* Bar progres tak tentu (tidak ada persentase nyata yang bisa diukur) */}
      <div className="mt-8 h-1 w-56 -skew-x-[20deg] overflow-hidden bg-white/10" aria-hidden="true">
        <div className="loading-bar h-full w-1/3 bg-accent" />
      </div>
      <p className="hud-label mt-3 text-white/60">Memuat garasi…</p>

      <p className="hud-label absolute inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] px-6 text-center text-white/35">
        Tips · Geser layar untuk memutar kamera
      </p>
    </div>
  );
}
