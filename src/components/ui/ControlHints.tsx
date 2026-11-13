const HINTS = [
  { key: "Seret", action: "Putar kamera" },
  { key: "Scroll", action: "Zoom" },
];

/** Petunjuk kontrol ala prompt tombol di game. Hanya tampil di layar lebar. */
export function ControlHints() {
  return (
    <ul className="hud-shadow pointer-events-none absolute bottom-7 left-7 z-10 hidden flex-col gap-1.5 xl:flex">
      {HINTS.map((hint) => (
        <li key={hint.key} className="flex items-center gap-2">
          <span className="hud-label border border-white/30 bg-black/40 px-1.5 py-0.5 text-white/85">
            {hint.key}
          </span>
          <span className="hud-label text-white/55">{hint.action}</span>
        </li>
      ))}
    </ul>
  );
}
