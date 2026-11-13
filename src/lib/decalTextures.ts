import type { DecalDesignId } from "@/types/catalog";

// Desain decal digambar di kanvas 2D transparan sebagai pratinjau kecil
// di panel tahap decal. Belum diaplikasikan ke model 3D.
// Sumbu kanvas: kiri = belakang motor, kanan = depan motor, atas = atas bodi.
// Hanya boleh dipanggil di browser (butuh `document`).

type Ctx = CanvasRenderingContext2D;
type Point = [number, number];

/** Poligon dengan titik dalam koordinat 0..1. */
function poly(ctx: Ctx, color: string, points: Point[]) {
  ctx.fillStyle = color;
  ctx.beginPath();
  const { width, height } = ctx.canvas;
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x * width, y * height) : ctx.moveTo(x * width, y * height)));
  ctx.closePath();
  ctx.fill();
}

/** PRNG kecil ber-seed supaya desain acak selalu sama. */
function seeded(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const WHITE = "#f4f4f1";
const BLACK = "#0d0e10";

/** Warna pendamping yang kontras dengan warna utama. */
function contrast(main: string): string {
  const r = parseInt(main.slice(1, 3), 16);
  const g = parseInt(main.slice(3, 5), 16);
  const b = parseInt(main.slice(5, 7), 16);
  return r * 0.299 + g * 0.587 + b * 0.114 > 150 ? BLACK : WHITE;
}

/** Sayatan tajam menyerong ke depan. */
function drawStyleKtm(ctx: Ctx, main: string) {
  const accent = contrast(main);
  // Sayatan miring: [x awal di bawah, lebar, warna]
  const slashes: [number, number, string][] = [
    [0.06, 0.03, accent],
    [0.11, 0.1, main],
    [0.37, 0.025, accent],
    [0.415, 0.12, main],
    [0.555, 0.025, accent],
    [0.74, 0.08, main],
    [0.84, 0.02, accent],
  ];
  const lean = 0.2;
  for (const [x, width, color] of slashes) {
    poly(ctx, color, [
      [x, 1],
      [x + width, 1],
      [x + width + lean, 0],
      [x + lean, 0],
    ]);
  }
  // Potongan balik di bagian bawah depan
  poly(ctx, accent, [
    [0.66, 1],
    [1, 0.66],
    [1, 0.72],
    [0.72, 1],
  ]);
}

/** Blok kecepatan memanjang dengan ujung runcing. */
function drawStyleYz(ctx: Ctx, main: string) {
  const accent = contrast(main);
  poly(ctx, main, [
    [0.04, 0.3],
    [0.8, 0.3],
    [0.98, 0.44],
    [0.8, 0.58],
    [0.16, 0.58],
  ]);
  poly(ctx, accent, [
    [0.2, 0.61],
    [0.78, 0.61],
    [0.9, 0.68],
    [0.26, 0.68],
  ]);
  // Garis kecepatan di belakang blok
  for (let i = 0; i < 4; i++) {
    const y = 0.34 + i * 0.058;
    poly(ctx, accent, [
      [0.0, y],
      [0.1 + i * 0.03, y],
      [0.12 + i * 0.03, y + 0.022],
      [0.0, y + 0.022],
    ]);
  }
  // Blok kedua di bagian bawah depan
  poly(ctx, main, [
    [0.42, 0.76],
    [0.9, 0.76],
    [0.8, 0.92],
    [0.5, 0.92],
  ]);
}

/** Dua garis sejajar klasik sepanjang bodi. */
function drawRacingStripes(ctx: Ctx, main: string) {
  const accent = contrast(main);
  poly(ctx, main, [
    [0, 0.33],
    [1, 0.33],
    [1, 0.47],
    [0, 0.47],
  ]);
  poly(ctx, accent, [
    [0, 0.5],
    [1, 0.5],
    [1, 0.54],
    [0, 0.54],
  ]);
  poly(ctx, main, [
    [0, 0.57],
    [1, 0.57],
    [1, 0.61],
    [0, 0.61],
  ]);
}

/** Serpihan segitiga: rapat di depan, makin jarang ke belakang. */
function drawGeometric(ctx: Ctx, main: string) {
  const rand = seeded(23);
  const colors = [main, main, contrast(main), main];
  for (let i = 0; i < 90; i++) {
    const x = 1 - Math.pow(rand(), 1.7); // lebih banyak di dekat depan
    const y = rand();
    const size = 0.03 + rand() * 0.09 * (0.4 + x);
    const angle = rand() * Math.PI * 2;
    const points: Point[] = [0, 1, 2].map((k) => {
      const a = angle + (k * Math.PI * 2) / 3 + (rand() - 0.5) * 0.9;
      return [x + Math.cos(a) * size * 0.5, y + Math.sin(a) * size];
    });
    ctx.globalAlpha = 0.75 + rand() * 0.25;
    poly(ctx, colors[i % colors.length], points);
  }
  ctx.globalAlpha = 1;
}

const DRAWERS: Record<DecalDesignId, (ctx: Ctx, main: string) => void> = {
  "style-ktm": drawStyleKtm,
  "style-yz": drawStyleYz,
  "garis-balap": drawRacingStripes,
  geometris: drawGeometric,
};

/** Menggambar satu desain ke kanvas pratinjau di panel. */
export function drawDecal(ctx: Ctx, design: DecalDesignId, mainColor: string) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  DRAWERS[design](ctx, mainColor);
}