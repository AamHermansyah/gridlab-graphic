// Ukuran dan warna dasar scene garasi (satuan meter).

export const SCENE_BG = "#050608";

/**
 * Model bengkel (GLB hasil konversi, lihat tools/garage-import).
 * Ukuran asli ruangan 10 x 6 x 3,9 m; dinding belakang di -Z, rolling door di +X.
 */
export const GARAGE = {
  url: "/models/garage/garage.glb",
  // Digeser supaya pelat servis di lantai (tempat motor berdiri) berpusat di titik asal scene.
  offset: [-1.14, 0, 0] as const,
  // Batas zona dalam koordinat model: bagian di luar batas ini disembunyikan
  // ketika kamera melewatinya, supaya dinding tidak menutupi motor.
  frontZ: 2.85,
  // Sisi belakang dan kiri punya perabot (rak, meja perkakas) yang berdiri
  // agak ke tengah ruangan, jadi batasnya lebih ke dalam daripada dindingnya.
  backZ: -1.9,
  rightX: 4.5,
  leftX: -4.1,
  topY: 3.75,
} as const;

/**
 * Tempat motor: jalur servis persegi panjang bergaris kuning-hitam di lantai
 * bengkel (bagian dari model bengkel).
 */
export const STAND = {
  /** Tinggi permukaan jalur servis dari lantai (meter); roda motor berpijak di sini. */
  top: 0.018,
} as const;

/**
 * Pembesaran motor terhadap bengkel. 1 = skala asli (1:1). Bengkel ini dibuat
 * untuk mobil, sehingga motor berskala asli terlihat kecil di dalamnya.
 */
export const BIKE_SCALE = 1.25;

/** Titik yang dilihat kamera: kira-kira tengah badan motor. */
export const CAMERA_TARGET: readonly [number, number, number] = [0, STAND.top + 0.58 * BIKE_SCALE, 0];

/** Batas kontrol orbit. */
export const ORBIT_LIMITS = {
  minDistance: 3,
  maxDistance: 12,
  minPolar: 0.1,
  // Sedikit di atas lantai supaya kamera tidak menembus beton.
  maxPolar: 1.5,
  // ±100° dari sisi samping: depan dan belakang terjangkau, tetapi kamera
  // tidak bisa masuk ke balik dinding belakang.
  maxAzimuth: (100 * Math.PI) / 180,
} as const;

export const COLORS = {
  // Harus sama dengan --color-accent di globals.css
  accent: "#ccff00",
  neonWhite: "#dfe8ff",
  metalDark: "#2b2b2e",
} as const;
