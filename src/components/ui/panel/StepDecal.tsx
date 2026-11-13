"use client";

import { useEffect, useRef, useState } from "react";
import { DECAL_COLORS, DECAL_DESIGNS, DECAL_MATERIALS, findOption, formatRupiah } from "@/data/catalog";
import { drawDecal } from "@/lib/decalTextures";
import { useConfigStore } from "@/store/useConfigStore";
import type { DecalDesignId } from "@/types/catalog";
import { ArrowIcon, CheckIcon } from "../icons";
import { ChoiceChip, FOCUS, Note, OptionCard, SectionTitle, extraPriceLabel } from "./controls";

/** Pratinjau kecil sebuah desain decal dalam satu warna (kiri = belakang motor, kanan = depan). */
function DecalPreview({ design, color }: { design: DecalDesignId; color: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (ctx) drawDecal(ctx, design, color);
  }, [design, color]);

  return <canvas ref={canvas} width={384} height={192} className="aspect-[2/1] w-full bg-ink-700" aria-hidden="true" />;
}

/** Sub-langkah 1: kisi kartu semua desain. Memilih kartu membuka pengaturan desain itu. */
function DesignGrid({ onConfigure }: { onConfigure: () => void }) {
  const decalDesign = useConfigStore((s) => s.decalDesign);
  const decalColor = useConfigStore((s) => s.decalColor);
  const setDecalDesign = useConfigStore((s) => s.setDecalDesign);
  const colorHex = findOption(DECAL_COLORS, decalColor).hex;

  return (
    <section aria-label="Desain decal">
      <SectionTitle note={`${DECAL_DESIGNS.length} desain`}>Pilih desain</SectionTitle>
      <div className="grid grid-cols-2 gap-1.5 lg:gap-2">
        {DECAL_DESIGNS.map((design, index) => {
          const active = design.id === decalDesign;
          return (
            <button
              key={design.id}
              type="button"
              data-sound="select"
              aria-pressed={active}
              onClick={() => {
                setDecalDesign(design.id);
                onConfigure();
              }}
              className={`${FOCUS} hud-cut-sm relative flex flex-col border text-left transition-[background-color,border-color,transform] duration-150 active:scale-[0.97] ${
                active ? "border-accent bg-accent/12" : "border-white/10 bg-white/[0.04] hover:border-white/30"
              }`}
            >
              <DecalPreview design={design.id} color={colorHex} />
              <span className="hud-label absolute left-1.5 top-1 bg-black/55 px-1 text-white/70">
                {String(index + 1).padStart(2, "0")}
              </span>
              {active && (
                <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center bg-accent text-ink-950">
                  <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.6} />
                </span>
              )}
              <span className="px-2.5 pb-2 pt-1.5">
                <span className="block font-display text-base font-bold uppercase italic leading-tight text-white">
                  {design.nama}
                </span>
                <span className={`hud-label block ${active ? "text-accent" : "text-white/50"}`}>
                  Rp {formatRupiah(design.harga)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-3">
        <Note>Pilih sebuah desain untuk mengatur varian warna dan bahannya.</Note>
      </div>
    </section>
  );
}

/** Sub-langkah 2: varian warna dan bahan untuk desain yang dipilih. */
function DesignOptions({ design, onBack }: { design: DecalDesignId; onBack: () => void }) {
  const decalColor = useConfigStore((s) => s.decalColor);
  const decalMaterial = useConfigStore((s) => s.decalMaterial);
  const setDecalColor = useConfigStore((s) => s.setDecalColor);
  const setDecalMaterial = useConfigStore((s) => s.setDecalMaterial);

  return (
    <>
      {/* Kepala sub-langkah: tombol kembali + nama desain yang sedang diatur */}
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          data-sound="tap"
          onClick={onBack}
          aria-label="Kembali ke semua desain"
          title="Kembali ke semua desain"
          className={`${FOCUS} hud-cut-sm flex h-11 w-11 shrink-0 items-center justify-center border border-white/15 bg-white/[0.05] text-white/80 transition-[border-color,color,transform] duration-150 hover:border-accent hover:text-accent active:scale-95`}
        >
          <ArrowIcon className="h-5 w-5 rotate-180" strokeWidth={2.2} />
        </button>
        <div className="min-w-0">
          <p className="hud-label text-accent">Atur decal</p>
          <p className="truncate font-display text-2xl font-extrabold uppercase italic leading-none text-white">
            {findOption(DECAL_DESIGNS, design).nama}
          </p>
        </div>
      </div>

      <section aria-label="Varian warna">
        <SectionTitle note={`${DECAL_COLORS.length} varian`}>Varian warna</SectionTitle>
        <div className="grid grid-cols-2 gap-1.5">
          {DECAL_COLORS.map((option) => (
            <ChoiceChip
              key={option.id}
              label={option.nama}
              active={option.id === decalColor}
              onClick={() => setDecalColor(option.id)}
            />
          ))}
        </div>
      </section>

      <section aria-label="Bahan decal" className="mt-5">
        <SectionTitle note="Mockup">Bahan decal</SectionTitle>
        <div className="flex flex-col gap-1.5">
          {DECAL_MATERIALS.map((material) => (
            <OptionCard
              key={material.id}
              title={material.nama}
              description={material.deskripsi}
              price={extraPriceLabel(material.harga)}
              active={material.id === decalMaterial}
              onClick={() => setDecalMaterial(material.id)}
            />
          ))}
        </div>
        <p className="mt-2 text-xs leading-snug text-white/45">
          Daftar bahan dan harganya masih contoh, menunggu daftar bahan asli.
        </p>
      </section>
    </>
  );
}

/**
 * Tahap 3: decal. Terdiri dari dua sub-langkah: memilih desain dari kisi kartu,
 * lalu mengatur varian warna dan bahan untuk desain itu. Harga tampil di
 * estimasi pada HUD atas; rinciannya ada di tahap 4.
 */
export function StepDecal() {
  const [configuring, setConfiguring] = useState(false);
  const decalDesign = useConfigStore((s) => s.decalDesign);

  if (configuring && decalDesign) {
    return <DesignOptions design={decalDesign} onBack={() => setConfiguring(false)} />;
  }
  return <DesignGrid onConfigure={() => setConfiguring(true)} />;
}
