"use client";

import { FLOW_STEPS } from "@/data/catalog";
import { canAdvance, useConfigStore } from "@/store/useConfigStore";
import { useSceneStore } from "@/store/useSceneStore";
import { ArrowIcon, CheckIcon, ChevronIcon, LockIcon } from "./icons";
import { FOCUS } from "./panel/controls";
import { StepBike } from "./panel/StepBike";
import { StepCustomize } from "./panel/StepCustomize";
import { StepDecal } from "./panel/StepDecal";
import { ORDER_FORM_ID, StepOrder } from "./panel/StepOrder";

const INSET_FOCUS = "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent";
const PRIMARY =
  "hud-cut-sm flex h-11 flex-1 items-center justify-center gap-2 px-4 font-display text-base font-extrabold uppercase italic transition-transform duration-150";
const PRIMARY_ON = `${FOCUS} ${PRIMARY} hud-glow bg-accent text-ink-950 active:scale-[0.97]`;
const PRIMARY_OFF = `${PRIMARY} border border-white/15 font-bold text-white/40`;

/** Penanda empat tahap. Tahap yang belum dibuka terkunci sampai tombol "Lanjut" ditekan. */
function Stepper() {
  const step = useConfigStore((s) => s.step);
  const maxStepIndex = useConfigStore((s) => s.maxStepIndex);
  const goToStep = useConfigStore((s) => s.goToStep);
  const openPanel = useSceneStore((s) => s.openPanel);

  return (
    <ol aria-label="Tahap konfigurasi" className="grid shrink-0 grid-cols-4 gap-1 px-3 pb-3 lg:gap-1.5 lg:px-6 lg:pb-4">
      {FLOW_STEPS.map((item, index) => {
        const active = item.id === step;
        const locked = index > maxStepIndex;
        return (
          <li key={item.id}>
            <button
              type="button"
              data-sound="select"
              disabled={locked}
              aria-current={active ? "step" : undefined}
              onClick={() => {
                goToStep(item.id);
                openPanel();
              }}
              className={`${FOCUS} hud-cut-sm flex h-11 w-full flex-col justify-center border px-2 text-left leading-none transition-[background-color,color,border-color] duration-150 ${
                active
                  ? "border-accent bg-accent text-ink-950"
                  : locked
                    ? "border-white/8 bg-white/[0.02] text-white/30"
                    : "border-white/15 bg-white/[0.05] text-white/75 hover:border-white/40 hover:text-white"
              }`}
            >
              <span className="hud-label flex items-center gap-1 opacity-70">
                {String(index + 1).padStart(2, "0")}
                {locked && <LockIcon className="h-2.5 w-2.5" />}
              </span>
              <span className="block truncate font-display text-[0.95rem] font-bold uppercase italic leading-none">
                {item.label}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/** Tombol Kembali / Lanjut di dasar panel. Di tahap terakhir tombol utama mengirim form pesanan. */
function FlowNav() {
  const step = useConfigStore((s) => s.step);
  const ready = useConfigStore(canAdvance);
  const orderPlaced = useConfigStore((s) => s.orderPlaced);
  const nextStep = useConfigStore((s) => s.nextStep);
  const prevStep = useConfigStore((s) => s.prevStep);
  const openPanel = useSceneStore((s) => s.openPanel);
  const index = FLOW_STEPS.findIndex((s) => s.id === step);
  const next = FLOW_STEPS[index + 1];

  let primary;
  if (next && ready) {
    primary = (
      <button
        type="button"
        data-sound="select"
        onClick={() => {
          nextStep();
          openPanel();
        }}
        className={PRIMARY_ON}
      >
        Lanjut: {next.label}
        <ArrowIcon className="h-4 w-4" strokeWidth={2.4} />
      </button>
    );
  } else if (next) {
    // Tahap decal: pesanan wajib punya decal
    primary = (
      <button type="button" disabled className={PRIMARY_OFF}>
        <LockIcon className="h-4 w-4" />
        Pilih desain dulu
      </button>
    );
  } else if (orderPlaced) {
    primary = (
      <button type="button" disabled className={PRIMARY_OFF}>
        <CheckIcon className="h-4 w-4" strokeWidth={2.4} />
        Data lengkap
      </button>
    );
  } else {
    primary = (
      <button type="submit" form={ORDER_FORM_ID} data-sound="select" onClick={openPanel} className={PRIMARY_ON}>
        Buat Pesanan
        <ArrowIcon className="h-4 w-4" strokeWidth={2.4} />
      </button>
    );
  }

  return (
    <div className="flex shrink-0 gap-2 border-t border-white/10 px-3 pb-[max(0.625rem,env(safe-area-inset-bottom))] pt-2.5 lg:px-6 lg:pb-5 lg:pt-4">
      <button
        type="button"
        data-sound="tap"
        disabled={index === 0}
        onClick={prevStep}
        className={`${FOCUS} hud-cut-sm h-11 border border-white/15 px-4 font-display text-base font-bold uppercase italic text-white/80 transition-[border-color,color,transform] duration-150 hover:border-white/40 hover:text-white active:scale-95 disabled:opacity-30`}
      >
        Kembali
      </button>
      {primary}
    </div>
  );
}

/**
 * Panel konfigurator empat tahap: 1) pilih motor, 2) samakan dengan motor
 * user, 3) pilih decal, 4) ringkasan pembayaran.
 * Mobile: bottom sheet; saat tertutup hanya penanda tahap + tombol navigasi yang terlihat.
 * Desktop: panel kaca melayang di sisi kanan.
 * Ukurannya memakai variabel CSS --sheet-h / --sidebar-w dari ConfiguratorShell,
 * yang juga dipakai scene 3D untuk menjaga motor tetap di tengah area kosong.
 */
export function ConfigPanel() {
  const open = useSceneStore((s) => s.panelOpen);
  const togglePanel = useSceneStore((s) => s.togglePanel);
  const step = useConfigStore((s) => s.step);
  const index = FLOW_STEPS.findIndex((s) => s.id === step);
  const current = FLOW_STEPS[index];

  return (
    <aside
      aria-label="Panel konfigurator"
      className="hud-panel hud-cut-top absolute inset-x-0 bottom-0 z-20 flex h-(--sheet-h) flex-col border-t border-white/10 transition-[height] duration-300 ease-out lg:inset-x-auto lg:bottom-6 lg:right-6 lg:top-6 lg:h-auto lg:w-[calc(var(--sidebar-w)-1.5rem)] lg:border"
    >
      {/* Garis aksen di tepi atas */}
      <div className="absolute left-0 top-0 h-0.5 w-24 bg-accent" aria-hidden="true" />

      {/* Gagang sheet: hanya di mobile */}
      <button
        type="button"
        data-sound="toggle"
        onClick={togglePanel}
        aria-expanded={open}
        aria-controls="panel-konten"
        className={`${INSET_FOCUS} flex h-8 w-full shrink-0 items-center justify-center gap-2 text-white/50 lg:hidden`}
      >
        <ChevronIcon className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
        <span className="hud-label">{open ? "Tutup" : current.judul}</span>
      </button>

      {/* Judul panel: hanya di desktop */}
      <div className="hidden shrink-0 px-6 pb-4 pt-7 lg:block">
        <p className="hud-label text-accent">
          Tahap {index + 1} dari {FLOW_STEPS.length}
        </p>
        <h1 className="mt-1 font-display text-4xl font-extrabold uppercase italic leading-none text-white">
          {current.judul}
        </h1>
      </div>

      <Stepper />

      {/* Isi tahap */}
      <div
        id="panel-konten"
        className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-white/8 px-3 lg:px-6"
      >
        <div className="py-3 lg:py-5">
          {step === "motor" && <StepBike />}
          {step === "kustom" && <StepCustomize />}
          {step === "decal" && <StepDecal />}
          {step === "pesan" && <StepOrder />}
        </div>
      </div>

      <FlowNav />
    </aside>
  );
}
