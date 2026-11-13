"use client";

import { getBike } from "@/data/bikes";
import { CUSTOM_CATEGORIES, HEAD_STYLE_OPTIONS, PAINT_COLORS, PLATE_BRAND_OPTIONS, SWINGARM_OPTIONS, TIRE_OPTIONS, findOption } from "@/data/catalog";
import { useConfigStore } from "@/store/useConfigStore";
import { useSceneStore } from "@/store/useSceneStore";
import { CategoryIcon } from "../icons";
import { ColorSwatches, FOCUS, Note, OptionCard, SectionTitle } from "./controls";

/** Bodi: warna semua bagian sekaligus + per bagian cover (bagian tanpaInput tidak jadi input). */
function BodyColors() {
  const bikeId = useConfigStore((s) => s.bikeId);
  const bodyColors = useConfigStore((s) => s.bodyColors);
  const setBodyColor = useConfigStore((s) => s.setBodyColor);
  const setAllBodyColors = useConfigStore((s) => s.setAllBodyColors);
  const resetBodyColors = useConfigStore((s) => s.resetBodyColors);
  const bike = getBike(bikeId);
  const parts = bike.bodyParts.filter((p) => !p.tanpaInput);
  const changed = parts.some((p) => bodyColors[p.id] !== p.warnaBawaan);

  // Warna "semua bagian" hanya ditandai jika seluruh bagian memang sewarna.
  const values = parts.map((p) => bodyColors[p.id]);
  const uniform = values.every((v) => v === values[0]) ? values[0] : null;

  return (
    <section aria-label="Warna bodi">
      <SectionTitle note={`${parts.length} bagian`}>Warna cover</SectionTitle>

      <div className="hud-cut-sm mb-2 border border-white/10 bg-white/[0.04] px-3 py-2.5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="font-display text-base font-bold uppercase italic leading-none text-white">Semua bagian</p>
          <button
            type="button"
            data-sound="tap"
            onClick={resetBodyColors}
            disabled={!changed}
            className={`${FOCUS} hud-label border border-white/20 px-2 py-1 text-white/70 hover:border-white/50 hover:text-white disabled:opacity-30`}
          >
            Reset
          </button>
        </div>
        <ColorSwatches label="Warna semua bagian" colors={PAINT_COLORS} selected={uniform} onSelect={setAllBodyColors} />
      </div>

      <ul className="flex flex-col gap-2">
        {parts.map((part) => {
          const colorId = bodyColors[part.id];
          return (
            <li key={part.id} className="hud-cut-sm border border-white/10 bg-white/[0.04] px-3 py-2.5">
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <p className="font-display text-base font-bold uppercase italic leading-none text-white">{part.nama}</p>
                <p className="hud-label text-white/45">{findOption(PAINT_COLORS, colorId).nama}</p>
              </div>
              <ColorSwatches
                label={`Warna ${part.nama}`}
                colors={PAINT_COLORS}
                selected={colorId}
                onSelect={(id) => setBodyColor(part.id, id)}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Ban: pilihan jenis ban berupa kartu opsi (bukan warna). */
function TireOptions() {
  const tire = useConfigStore((s) => s.tire);
  const setTire = useConfigStore((s) => s.setTire);
  return (
    <section aria-label="Ban">
      <SectionTitle note={`${TIRE_OPTIONS.length} pilihan`}>Jenis ban</SectionTitle>
      <div className="flex flex-col gap-1.5">
        {TIRE_OPTIONS.map((option) => (
          <OptionCard
            key={option.id}
            title={option.nama}
            description={option.deskripsi}
            active={option.id === tire}
            onClick={() => setTire(option.id)}
          />
        ))}
      </div>
    </section>
  );
}

/** Kepala depan: pilih headlamp atau papan nomor, lalu merek papannya. */
function HeadOptions() {
  const headStyle = useConfigStore((s) => s.headStyle);
  const setHeadStyle = useConfigStore((s) => s.setHeadStyle);
  const plateBrand = useConfigStore((s) => s.plateBrand);
  const setPlateBrand = useConfigStore((s) => s.setPlateBrand);
  const plate = headStyle === "papan";

  return (
    <section aria-label="Kepala">
      <SectionTitle note={`${HEAD_STYLE_OPTIONS.length} pilihan`}>Kepala depan</SectionTitle>
      <div className="flex flex-col gap-1.5">
        {HEAD_STYLE_OPTIONS.map((option) => (
          <OptionCard
            key={option.id}
            title={option.nama}
            description={option.deskripsi}
            active={option.id === headStyle}
            onClick={() => setHeadStyle(option.id)}
          />
        ))}
      </div>

      {plate && (
        <div className="mt-5">
          <SectionTitle note="Sepaket spakbor depan">Merek papan nomor</SectionTitle>
          <div className="flex flex-col gap-1.5">
            {PLATE_BRAND_OPTIONS.map((option) => (
              <OptionCard
                key={option.id}
                title={option.nama}
                description={option.deskripsi}
                active={option.id === plateBrand}
                onClick={() => setPlateBrand(option.id)}
              />
            ))}
          </div>
          <p className="mt-2 text-xs leading-snug text-white/45">
            Papan nomor biasanya sudah sepaket dengan spakbor depan dari motornya.
          </p>
        </div>
      )}
    </section>
  );
}

function SwingarmOptions() {
  const swingarm = useConfigStore((s) => s.swingarm);
  const setSwingarm = useConfigStore((s) => s.setSwingarm);
  return (
    <section aria-label="Swing arm">
      <SectionTitle note={`${SWINGARM_OPTIONS.length} pilihan`}>Swing arm</SectionTitle>
      <div className="flex flex-col gap-1.5">
        {SWINGARM_OPTIONS.map((option) => (
          <OptionCard
            key={option.id}
            title={option.nama}
            description={option.deskripsi}
            active={option.id === swingarm}
            onClick={() => setSwingarm(option.id)}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * Tahap 2: menyamakan tampilan motor di layar dengan motor milik user (bodi,
 * ban, kepala, swing arm). Tahap ini tidak berbiaya; yang dijual hanya decal.
 */
export function StepCustomize() {
  const activeCategory = useSceneStore((s) => s.activeCategory);
  const selectCategory = useSceneStore((s) => s.selectCategory);

  return (
    <>
      <div className="mb-3">
        <Note>Samakan dengan kondisi motormu sekarang supaya hasil decal terlihat akurat. Tahap ini tanpa biaya.</Note>
      </div>

      <nav aria-label="Kategori kustomisasi" className="mb-3 grid grid-cols-4 gap-1.5">
        {CUSTOM_CATEGORIES.map((category) => {
          const isActive = category.id === activeCategory;
          return (
            <button
              key={category.id}
              type="button"
              data-sound="select"
              aria-pressed={isActive}
              onClick={() => selectCategory(category.id)}
              className={`${FOCUS} hud-cut-sm flex h-[62px] flex-col items-center justify-center gap-1 border transition-[background-color,color,border-color,transform] duration-150 active:scale-95 ${
                isActive
                  ? "border-accent bg-accent text-ink-950"
                  : "border-white/10 bg-white/[0.04] text-white/65 hover:border-white/30 hover:text-white"
              }`}
            >
              <CategoryIcon id={category.id} className="h-5 w-5" />
              <span className="font-display text-[0.8rem] font-bold uppercase italic leading-none tracking-wide">
                {category.label}
              </span>
            </button>
          );
        })}
      </nav>

      {activeCategory === "bodi" && <BodyColors />}
      {activeCategory === "ban" && <TireOptions />}
      {activeCategory === "kepala" && <HeadOptions />}
      {activeCategory === "swingarm" && <SwingarmOptions />}
    </>
  );
}
