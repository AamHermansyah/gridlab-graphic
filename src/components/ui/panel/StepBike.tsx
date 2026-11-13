"use client";

import { BIKES } from "@/data/bikes";
import { useConfigStore } from "@/store/useConfigStore";
import { CheckIcon } from "../icons";
import { FOCUS, SectionTitle } from "./controls";

const meter = new Intl.NumberFormat("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Tahap 1: memilih motor. Motor di scene langsung berganti saat kartu dipilih. */
export function StepBike() {
  const bikeId = useConfigStore((s) => s.bikeId);
  const selectBike = useConfigStore((s) => s.selectBike);

  return (
    <section aria-label="Pilih motor">
      <SectionTitle note={`${BIKES.length} motor`}>Motor tersedia</SectionTitle>
      <div className="flex flex-col gap-2">
        {BIKES.map((bike, index) => {
          const active = bike.id === bikeId;
          return (
            <button
              key={bike.id}
              type="button"
              data-sound="select"
              aria-pressed={active}
              onClick={() => selectBike(bike.id)}
              className={`${FOCUS} hud-cut-sm relative border px-4 py-3 text-left transition-[background-color,border-color,transform] duration-150 active:scale-[0.98] ${
                active ? "border-accent bg-accent/12" : "border-white/10 bg-white/[0.04] hover:border-white/30"
              }`}
            >
              <span className="hud-label text-white/40">{String(index + 1).padStart(2, "0")}</span>
              <span className="mt-0.5 flex items-baseline gap-2">
                <span className="font-display text-3xl font-extrabold uppercase italic leading-none text-white">
                  {bike.nama}
                </span>
                <span className={`hud-label ${active ? "text-accent" : "text-white/55"}`}>{bike.tipe}</span>
              </span>
              <span className="mt-1.5 block text-sm leading-snug text-white/60">{bike.deskripsi}</span>
              <span className="hud-label mt-2 block text-white/45">
                P {meter.format(bike.spec.panjang)} m · L {meter.format(bike.spec.lebar)} m · T{" "}
                {meter.format(bike.spec.tinggi)} m
              </span>
              {active && (
                <span className="absolute right-3 top-3 flex items-center gap-1 bg-accent px-1.5 py-0.5 text-ink-950">
                  <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.6} />
                  <span className="hud-label">Dipilih</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-3 border-l-2 border-accent/60 pl-3 text-sm leading-snug text-white/60">
        Pilih motor, lalu lanjut ke kustomisasi.
      </p>
    </section>
  );
}
