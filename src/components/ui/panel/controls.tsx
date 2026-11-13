import type { ReactNode } from "react";
import { formatRupiah } from "@/data/catalog";
import type { ColorOption } from "@/types/catalog";
import { CheckIcon } from "../icons";

// Kontrol kecil yang dipakai bersama oleh isi panel di setiap tahap.

export const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/** Label harga tambahan: "Standar" untuk 0, selain itu "+Rp ...". */
export function extraPriceLabel(harga: number): string {
  return harga === 0 ? "Standar" : `+Rp ${formatRupiah(harga)}`;
}

export function SectionTitle({ children, note }: { children: ReactNode; note?: string }) {
  return (
    <div className="mb-2 flex items-end justify-between gap-3">
      <h3 className="font-display text-lg font-extrabold uppercase italic leading-none text-white">{children}</h3>
      {note && <p className="hud-label text-white/45">{note}</p>}
    </div>
  );
}

/** Catatan singkat dengan garis aksen di kiri. */
export function Note({ children }: { children: ReactNode }) {
  return <p className="border-l-2 border-accent/60 pl-3 text-sm leading-snug text-white/60">{children}</p>;
}

/** Kotak centang kecil di sisi kanan kartu pilihan. */
function CheckMark({ active }: { active: boolean }) {
  return (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center border ${
        active ? "border-accent bg-accent text-ink-950" : "border-white/25 text-transparent"
      }`}
      aria-hidden="true"
    >
      <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.6} />
    </span>
  );
}

/** Deretan kotak warna; kotak terpilih diberi bingkai aksen. */
export function ColorSwatches({
  label,
  colors,
  selected,
  onSelect,
}: {
  label: string;
  colors: readonly ColorOption[];
  /** Id warna terpilih; null jika tidak ada yang ditandai. */
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {colors.map((color) => {
        const active = color.id === selected;
        return (
          <button
            key={color.id}
            type="button"
            data-sound="select"
            aria-pressed={active}
            aria-label={color.nama}
            title={color.nama}
            onClick={() => onSelect(color.id)}
            style={{ backgroundColor: color.hex }}
            className={`${FOCUS} h-7 w-7 border transition-transform duration-150 active:scale-90 ${
              active ? "border-accent outline-2 outline-offset-1 outline-accent" : "border-white/25 hover:border-white/70"
            }`}
          />
        );
      })}
    </div>
  );
}

/** Kartu pilihan berisi teks: judul, keterangan, dan (opsional) harga atau contoh warna. */
export function OptionCard({
  title,
  description,
  price,
  active,
  onClick,
  swatch,
}: {
  title: string;
  description?: string;
  price?: string;
  active: boolean;
  onClick: () => void;
  /** Warna contoh di sisi kiri kartu. */
  swatch?: string;
}) {
  return (
    <button
      type="button"
      data-sound="select"
      aria-pressed={active}
      onClick={onClick}
      className={`${FOCUS} hud-cut-sm flex w-full items-center gap-3 border px-3 py-2.5 text-left transition-[background-color,border-color,transform] duration-150 active:scale-[0.98] ${
        active ? "border-accent bg-accent/12" : "border-white/10 bg-white/[0.04] hover:border-white/30"
      }`}
    >
      {swatch && <span className="h-8 w-8 shrink-0 border border-white/25" style={{ backgroundColor: swatch }} aria-hidden="true" />}
      <span className="min-w-0 flex-1">
        <span className="block font-display text-base font-bold uppercase italic leading-tight text-white">{title}</span>
        {description && <span className="block text-xs leading-snug text-white/55">{description}</span>}
      </span>
      {price && <span className={`hud-label shrink-0 ${active ? "text-accent" : "text-white/55"}`}>{price}</span>}
      <CheckMark active={active} />
    </button>
  );
}

/** Kartu pilihan ringkas berisi teks saja (dipakai dalam kisi, mis. varian warna decal). */
export function ChoiceChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      data-sound="select"
      aria-pressed={active}
      onClick={onClick}
      className={`${FOCUS} hud-cut-sm flex h-11 items-center justify-between gap-2 border px-3 text-left transition-[background-color,border-color,transform] duration-150 active:scale-[0.97] ${
        active ? "border-accent bg-accent/12" : "border-white/10 bg-white/[0.04] hover:border-white/30"
      }`}
    >
      <span className="truncate font-display text-base font-bold uppercase italic leading-none text-white">{label}</span>
      <CheckMark active={active} />
    </button>
  );
}
