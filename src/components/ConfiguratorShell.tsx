"use client";

import dynamic from "next/dynamic";
import type { CSSProperties } from "react";
import { AccountOverlay } from "@/components/ui/account/AccountOverlay";
import { CameraPresetBar } from "@/components/ui/CameraPresetBar";
import { ConfigPanel } from "@/components/ui/ConfigPanel";
import { ControlHints } from "@/components/ui/ControlHints";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { TopBar } from "@/components/ui/TopBar";
import { UiSoundEffects } from "@/components/ui/UiSoundEffects";
import { SIDEBAR_WIDTH, getSheetHeightCss } from "@/lib/layout";
import { useSceneStore } from "@/store/useSceneStore";

// Three.js hanya berjalan di browser dan ukurannya besar: dimuat terpisah
// dari bundle utama, tanpa SSR. Loading screen menutupi selama proses ini.
const GarageCanvas = dynamic(() => import("@/components/scene/GarageCanvas"), { ssr: false });

/** Kerangka halaman konfigurator: canvas full-screen + HUD yang melayang di atasnya. */
export function ConfiguratorShell() {
  const sceneReady = useSceneStore((s) => s.sceneReady);
  const panelOpen = useSceneStore((s) => s.panelOpen);

  // Ukuran panel dibagikan ke komponen HUD lewat variabel CSS.
  const layoutVars = {
    "--sheet-h": getSheetHeightCss(panelOpen),
    "--sidebar-w": `${SIDEBAR_WIDTH}px`,
  } as CSSProperties;

  return (
    <main className="fixed inset-0 overflow-hidden bg-ink-950" style={layoutVars}>
      <div className="absolute inset-0">
        <GarageCanvas />
      </div>
      {/* Vignette sinematik: menggelapkan tepi dan menjaga teks HUD tetap terbaca */}
      <div className="hud-vignette pointer-events-none absolute inset-0" aria-hidden="true" />
      <TopBar />
      <ControlHints />
      <CameraPresetBar />
      <ConfigPanel />
      <AccountOverlay />
      <LoadingScreen visible={!sceneReady} />
      <UiSoundEffects />
    </main>
  );
}
