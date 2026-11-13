import type { CameraPreset, CameraView } from "@/types/scene";

// Konvensi arah: motor menghadap +X, dinding belakang garasi ada di -Z.
// Jarak akhir dihitung otomatis di CameraRig supaya area "fit" selalu muat
// di layar (penting untuk layar HP yang sempit).

/** Sudut pandang awal saat halaman dibuka (tiga perempat depan). */
export const DEFAULT_CAMERA_VIEW: CameraView = {
  azimuth: 0.65,
  polar: 1.25,
  // Cukup dekat supaya kamera awal masih di dalam bengkel (z < GARAGE.frontZ)
  // dan dinding depan tidak ikut disembunyikan.
  minDistance: 3.6,
  fitHalfWidth: 1.6,
  fitHalfHeight: 1.1,
};

export const CAMERA_PRESETS: readonly CameraPreset[] = [
  {
    id: "depan",
    label: "Depan",
    azimuth: Math.PI / 2,
    polar: 1.38,
    minDistance: 4.6,
    fitHalfWidth: 0.9,
    fitHalfHeight: 1.1,
  },
  {
    id: "samping",
    label: "Samping",
    azimuth: 0,
    polar: 1.4,
    minDistance: 4.8,
    fitHalfWidth: 1.75,
    fitHalfHeight: 1.1,
  },
  {
    id: "belakang",
    label: "Belakang",
    azimuth: -Math.PI / 2,
    polar: 1.38,
    minDistance: 4.6,
    fitHalfWidth: 0.9,
    fitHalfHeight: 1.1,
  },
  {
    id: "atas",
    label: "Atas",
    azimuth: 0,
    polar: 0.12,
    minDistance: 5,
    fitHalfWidth: 1.75,
    fitHalfHeight: 0.9,
    // Di layar potret motor diputar memanjang vertikal (depan motor di atas layar).
    portrait: { azimuth: -Math.PI / 2, fitHalfWidth: 0.9, fitHalfHeight: 1.8 },
  },
];

export function getCameraPreset(id: CameraPreset["id"]): CameraPreset {
  const preset = CAMERA_PRESETS.find((p) => p.id === id);
  if (!preset) throw new Error(`Preset kamera tidak dikenal: ${id}`);
  return preset;
}
