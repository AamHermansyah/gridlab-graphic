import { CanvasTexture, SRGBColorSpace } from "three";
import { COLORS } from "./sceneConstants";

// Semua tekstur dibuat di kanvas 2D saat runtime, tanpa file gambar eksternal.
// Fungsi-fungsi ini hanya boleh dipanggil di browser (butuh `document`).

/** PRNG kecil ber-seed supaya tekstur selalu sama setiap kali dimuat. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D tidak tersedia");
  return { canvas, ctx };
}

function finish(canvas: HTMLCanvasElement): CanvasTexture {
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

// ---------- Atlas poster bengkel ----------

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface PosterStyle {
  bg: string;
  stripe: string;
  ink: string;
  lines: [string, string];
  note: string;
}

/** Poster tipografi sederhana (tanpa logo/merek pihak lain) di dalam kotak `r`. */
function drawPoster(ctx: CanvasRenderingContext2D, r: Rect, style: PosterStyle) {
  ctx.save();
  ctx.translate(r.x, r.y);
  ctx.beginPath();
  ctx.rect(0, 0, r.w, r.h);
  ctx.clip();

  ctx.fillStyle = style.bg;
  ctx.fillRect(0, 0, r.w, r.h);

  // Garis diagonal di bagian bawah
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, r.h * 0.72, r.w, r.h * 0.12);
  ctx.clip();
  ctx.fillStyle = style.stripe;
  for (let x = -r.h; x < r.w + r.h; x += 36) {
    ctx.beginPath();
    ctx.moveTo(x, r.h * 0.84);
    ctx.lineTo(x + 18, r.h * 0.84);
    ctx.lineTo(x + 18 + 48, r.h * 0.72);
    ctx.lineTo(x + 48, r.h * 0.72);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "italic 900 68px 'Arial Black', Impact, sans-serif";
  ctx.fillStyle = style.ink;
  ctx.fillText(style.lines[0], r.w / 2, r.h * 0.28, r.w - 36);
  ctx.fillStyle = style.stripe;
  ctx.fillText(style.lines[1], r.w / 2, r.h * 0.46, r.w - 36);

  ctx.fillStyle = style.ink;
  ctx.font = "700 16px Arial, sans-serif";
  ctx.fillText(style.note, r.w / 2, r.h * 0.91, r.w - 36);

  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 5;
  ctx.strokeRect(9, 9, r.w - 18, r.h - 18);
  ctx.restore();
}

/** Cetak biru motor trail: kisi + garis besar tampak samping + garis ukuran. */
function drawBlueprint(ctx: CanvasRenderingContext2D, r: Rect) {
  ctx.save();
  ctx.translate(r.x, r.y);
  ctx.beginPath();
  ctx.rect(0, 0, r.w, r.h);
  ctx.clip();

  ctx.fillStyle = "#12509a";
  ctx.fillRect(0, 0, r.w, r.h);

  // Kisi halus dan kisi utama
  for (let i = 0; i * 12 < Math.max(r.w, r.h); i++) {
    const major = i % 5 === 0;
    ctx.strokeStyle = major ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(i * 12, 0);
    ctx.lineTo(i * 12, r.h);
    ctx.moveTo(0, i * 12);
    ctx.lineTo(r.w, i * 12);
    ctx.stroke();
  }

  const ground = r.h * 0.72;
  const wheelR = r.h * 0.17;
  const rearX = r.w * 0.24;
  const frontX = r.w * 0.76;
  const axleY = ground - wheelR;
  ctx.strokeStyle = "rgba(255,255,255,0.92)";
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";

  // Roda
  for (const x of [rearX, frontX]) {
    for (const k of [1, 0.72, 0.16]) {
      ctx.beginPath();
      ctx.arc(x, axleY, wheelR * k, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Rangka, tangki-jok, garpu depan, setang, spakbor
  const path = (points: [number, number][]) => {
    ctx.beginPath();
    points.forEach(([px, py], i) => (i ? ctx.lineTo(px * r.w, py * r.h) : ctx.moveTo(px * r.w, py * r.h)));
    ctx.stroke();
  };
  path([[0.24, 0.55], [0.44, 0.6], [0.52, 0.5], [0.4, 0.4], [0.24, 0.55]]); // lengan ayun + rangka
  path([[0.2, 0.36], [0.4, 0.33], [0.5, 0.27], [0.6, 0.3], [0.58, 0.4], [0.4, 0.4], [0.22, 0.4], [0.2, 0.36]]); // jok + tangki
  path([[0.76, 0.55], [0.64, 0.2], [0.6, 0.18]]); // garpu depan + setang
  path([[0.63, 0.29], [0.74, 0.3], [0.86, 0.36]]); // spakbor depan
  path([[0.2, 0.36], [0.1, 0.3]]); // spakbor belakang
  path([[0.44, 0.44], [0.56, 0.44], [0.56, 0.58], [0.44, 0.58], [0.44, 0.44]]); // mesin

  // Garis ukuran jarak sumbu roda
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 6]);
  const dimY = ground + r.h * 0.08;
  ctx.beginPath();
  ctx.moveTo(rearX, axleY);
  ctx.lineTo(rearX, dimY + 8);
  ctx.moveTo(frontX, axleY);
  ctx.lineTo(frontX, dimY + 8);
  ctx.moveTo(rearX, dimY);
  ctx.lineTo(frontX, dimY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 18px 'Courier New', monospace";
  ctx.fillText("1340 MM", (rearX + frontX) / 2, dimY + 16);
  ctx.textAlign = "left";
  ctx.font = "700 22px 'Courier New', monospace";
  ctx.fillText("TRAIL 150 / TAMPAK SAMPING", 24, 34);
  ctx.font = "700 15px 'Courier New', monospace";
  ctx.fillText("GRIDLAB GRAPHIC - POLA DECAL - SKALA 1:10", 24, r.h - 26);
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, r.w - 20, r.h - 20);
  ctx.restore();
}

/** Papan kayu bertuliskan slogan (tulisan vertikal). */
function drawWoodSign(ctx: CanvasRenderingContext2D, r: Rect) {
  const rand = mulberry32(11);
  ctx.save();
  ctx.translate(r.x, r.y);
  ctx.beginPath();
  ctx.rect(0, 0, r.w, r.h);
  ctx.clip();
  ctx.fillStyle = "#c9a878";
  ctx.fillRect(0, 0, r.w, r.h);
  for (let i = 0; i < 70; i++) {
    ctx.strokeStyle = `rgba(90,60,30,${0.05 + rand() * 0.12})`;
    ctx.lineWidth = 1 + rand() * 2;
    const x = rand() * r.w;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x + 6, r.h * 0.3, x - 6, r.h * 0.7, x + rand() * 8, r.h);
    ctx.stroke();
  }
  ctx.translate(r.w / 2, r.h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = "#5a3a1c";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "italic 900 44px 'Arial Black', Impact, sans-serif";
  ctx.fillText("RAKIT - TEMPEL - GASPOL", 0, 0, r.h - 40);
  ctx.restore();
}

/**
 * Atlas pengganti tekstur poster bawaan model bengkel (yang memuat karya pihak
 * lain). Tata letaknya mengikuti atlas asli supaya UV model tetap pas; karena
 * dipakai material glTF, kanvas tidak dibalik (flipY = false).
 */
export function createPosterAtlasTexture(): CanvasTexture {
  const size = 1024;
  const { canvas, ctx } = makeCanvas(size, size);
  ctx.fillStyle = "#ece7dc";
  ctx.fillRect(0, 0, size, size);

  drawPoster(ctx, { x: 0, y: 0, w: 306, h: 434 }, {
    bg: "#0b0c0f", stripe: COLORS.accent, ink: "#f4f0e8", lines: ["GRIDLAB", "GRAPHIC"], note: "DECAL MOTOR CUSTOM",
  });
  drawPoster(ctx, { x: 308, y: 0, w: 330, h: 436 }, {
    bg: "#16233a", stripe: COLORS.accent, ink: "#f4f0e8", lines: ["150", "CC"], note: "RAKIT / TEMPEL / GASPOL",
  });
  drawPoster(ctx, { x: 648, y: 0, w: 334, h: 436 }, {
    bg: "#b3261e", stripe: "#f4f0e8", ink: "#f4f0e8", lines: ["FULL", "GAS!"], note: "TRAIL / ENDURO / ADVENTURE",
  });
  drawBlueprint(ctx, { x: 0, y: 442, w: 724, h: 582 });
  drawWoodSign(ctx, { x: 724, y: 442, w: 112, h: 582 });

  const texture = finish(canvas);
  texture.flipY = false;
  return texture;
}
