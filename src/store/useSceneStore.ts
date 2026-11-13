import { create } from "zustand";
import type { CustomCategoryId } from "@/types/catalog";
import type { CameraPresetId, SpinMode } from "@/types/scene";

// State tampilan scene dan HUD (kamera, rotasi scene, panel, suara).
// Pilihan konfigurasi motor ada di useConfigStore.

interface SceneState {
  /** true setelah frame pertama scene 3D selesai digambar. */
  sceneReady: boolean;
  /** Preset kamera yang sedang aktif; null jika user sudah menggeser kamera sendiri. */
  cameraPreset: CameraPresetId | null;
  /** Naik setiap preset dipilih, supaya preset yang sama bisa dipicu ulang. */
  cameraNonce: number;
  /** Rotasi 360° seluruh scene (bengkel beserta motor). */
  spinMode: SpinMode;
  /** Bottom sheet mobile terbuka/tertutup. */
  panelOpen: boolean;
  /** Kategori yang sedang dibuka di tahap kustomisasi. */
  activeCategory: CustomCategoryId;
  /** Efek suara HUD menyala/mati. */
  soundEnabled: boolean;

  setSceneReady: () => void;
  setSoundEnabled: (enabled: boolean) => void;
  selectCameraPreset: (id: CameraPresetId) => void;
  clearCameraPreset: () => void;
  toggleSpin: () => void;
  togglePanel: () => void;
  openPanel: () => void;
  selectCategory: (id: CustomCategoryId) => void;
  resetCategory: () => void;
}

export const useSceneStore = create<SceneState>((set) => ({
  sceneReady: false,
  cameraPreset: null,
  cameraNonce: 0,
  spinMode: "spin",
  panelOpen: false,
  activeCategory: "bodi",
  soundEnabled: true,

  setSceneReady: () => set({ sceneReady: true }),
  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),

  // Memilih preset juga mengembalikan rotasi scene ke sudut 0, supaya "Depan"
  // benar-benar memperlihatkan bagian depan motor.
  selectCameraPreset: (id) =>
    set((s) => ({ cameraPreset: id, cameraNonce: s.cameraNonce + 1, spinMode: "home" })),

  clearCameraPreset: () => set((s) => (s.cameraPreset === null ? s : { cameraPreset: null })),

  toggleSpin: () => set((s) => ({ spinMode: s.spinMode === "spin" ? "hold" : "spin" })),

  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  openPanel: () => set({ panelOpen: true }),

  // Memilih kategori sekaligus membuka sheet (di mobile).
  selectCategory: (id) => set({ activeCategory: id, panelOpen: true }),

  // Masuk tahap kustom selalu mulai dari kategori bodi.
  resetCategory: () => set((s) => (s.activeCategory === "bodi" ? s : { activeCategory: "bodi" })),
}));
