// Ukuran layout yang dipakai bersama oleh UI (CSS) dan scene 3D.
// Scene memakainya untuk menggeser titik tengah render supaya motor tetap
// berada di tengah area yang TIDAK tertutup HUD.

/** Sama dengan breakpoint `lg` Tailwind. Di atas ini panel pindah ke sisi kanan. */
export const DESKTOP_BREAKPOINT = 1024;

/** Ruang yang ditempati panel desktop: lebar panel 400 + margin kanan 24 (px). */
export const SIDEBAR_WIDTH = 424;

/** Tinggi bottom sheet mobile saat tertutup: gagang + penanda tahap + tombol navigasi (px). */
export const SHEET_PEEK_HEIGHT = 153;

/** Tinggi bottom sheet mobile saat terbuka (proporsi tinggi layar). */
export const SHEET_OPEN_RATIO = 0.56;

/** Ruang untuk bar kamera yang melayang di bawah area canvas (px). */
export const PRESET_BAR_SPACE = 64;

/** Ruang untuk judul di atas layar pada mobile (px). */
export const MOBILE_HEADER_SPACE = 96;

export function getSheetHeight(viewportHeight: number, open: boolean): number {
  return open ? viewportHeight * SHEET_OPEN_RATIO : SHEET_PEEK_HEIGHT;
}

/** Nilai CSS untuk tinggi sheet, dipasang sebagai variabel `--sheet-h`. */
export function getSheetHeightCss(open: boolean): string {
  return open ? `${SHEET_OPEN_RATIO * 100}dvh` : `${SHEET_PEEK_HEIGHT}px`;
}
