// Tipe bersama untuk scene 3D dan kontrol kamera.

export type CameraPresetId = "depan" | "samping" | "belakang" | "atas";

/** Sudut pandang kamera dalam koordinat bola mengelilingi titik fokus. */
export interface CameraView {
  /** Sudut horizontal (radian). 0 = dari sisi kiri motor (+Z), π/2 = dari depan (+X). */
  azimuth: number;
  /** Sudut dari sumbu vertikal (radian). Kecil = dari atas, ~π/2 = sejajar lantai. */
  polar: number;
  /** Jarak minimum kamera ke titik fokus (meter). */
  minDistance: number;
  /** Setengah lebar area yang wajib terlihat di layar (meter). */
  fitHalfWidth: number;
  /** Setengah tinggi area yang wajib terlihat di layar (meter). */
  fitHalfHeight: number;
}

export interface CameraPreset extends CameraView {
  id: CameraPresetId;
  label: string;
  /** Penyesuaian untuk layar potret (HP), mis. tampak atas diputar agar motor memanjang vertikal. */
  portrait?: Partial<CameraView>;
}

/**
 * Rotasi 360° seluruh scene (bengkel beserta motor):
 * - "spin": berputar pelan terus-menerus
 * - "hold": berhenti di posisi terakhir
 * - "home": kembali ke sudut 0 (dipakai saat preset kamera dipilih)
 */
export type SpinMode = "spin" | "hold" | "home";