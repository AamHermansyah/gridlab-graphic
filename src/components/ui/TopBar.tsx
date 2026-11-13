"use client";

import { getBike } from "@/data/bikes";
import { formatRupiah } from "@/data/catalog";
import { selectDecalPrice, useConfigStore } from "@/store/useConfigStore";
import { AccountButton } from "./account/AccountButton";
import { SoundToggle } from "./SoundToggle";

/** HUD atas: motor terpilih di kiri, estimasi harga decal (desain + bahan) di kanan. */
export function TopBar() {
  const bike = getBike(useConfigStore((s) => s.bikeId));
  const total = useConfigStore(selectDecalPrice);

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-4 pt-[max(1rem,env(safe-area-inset-top))] lg:right-(--sidebar-w) lg:p-7">
      <div className="hud-shadow min-w-0">
        <p className="hud-label flex items-center gap-2 text-white/75">
          <span className="h-3 w-1.5 -skew-x-12 bg-accent" aria-hidden="true" />
          GridLab Graphic
        </p>
        <p className="hud-text-glow mt-1 font-display text-[2.5rem] font-extrabold uppercase italic leading-[0.9] tracking-tight text-white lg:text-6xl">
          {bike.nama}
        </p>
        <p className="hud-label mt-1.5 text-white/55">
          {bike.tipe}
          <span className="hidden lg:inline"> · Konfigurator Decal</span>
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <div className="hud-panel hud-cut-sm border-l-2 border-accent px-3.5 py-2 text-right lg:px-5 lg:py-3">
          <p className="hud-label text-white/55">Estimasi</p>
          <p className="font-display text-2xl font-bold italic leading-none text-white tabular-nums lg:text-3xl">
            <span className="mr-1 text-base text-accent lg:text-lg">Rp</span>
            {formatRupiah(total)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AccountButton />
          <SoundToggle />
        </div>
      </div>
    </header>
  );
}
