// Mengubah tekstur sumber (PNG/JPG/BMP/PSD 4K) menjadi WebP ringan untuk web.
// Pemakaian: node build-textures.js <texture-jobs.json> <folder_sumber> <folder_packed> <folder_keluaran> <path sharp>
const fs = require("fs");
const path = require("path");

const [jobsPath, srcDir, packedDir, outDir, sharpPath] = process.argv.slice(2);
const sharp = require(sharpPath);
const jobs = JSON.parse(fs.readFileSync(jobsPath, "utf8"));
fs.mkdirSync(outDir, { recursive: true });

// Tekstur "Material_*" tidak ikut di paket; pakai padanannya yang tersedia.
const ALIAS = {
  "Material_Base_color.png": "mat_concrete_wall_BaseColor.png",
  "Material_Normal_OpenGL.png": "mat_concrete_wall_Normal.png",
  "Material_Roughness.png": "mat_concrete_wall_Roughness.png",
};

// Resolusi keluaran: permukaan besar lebih tajam, properti kecil lebih hemat.
const LARGE = ["mat_concrete_wall.001", "mat_garage_concrete_slabs"];
const SMALL = ["mat_garage_canister", "mat_garage_car_jack", "mat_garage_cable", "mat_garage_lamp", "mat_garage_floor", "dec_garage_sewage"];
function sizeFor(job) {
  if (SMALL.includes(job.mat)) return 512;
  if (job.kind === "color" && LARGE.includes(job.mat)) return 2048;
  return 1024;
}

function locate(name) {
  const real = ALIAS[name] || name;
  for (const dir of [srcDir, packedDir]) {
    const p = path.join(dir, real);
    if (fs.existsSync(p)) return p;
  }
  throw new Error("Tekstur tidak ditemukan: " + name);
}

/** Baca gambar gabungan PSD 8-bit (mentah / PackBits) -> kanal pertama. */
function readPsdGray(file) {
  const b = fs.readFileSync(file);
  if (b.toString("latin1", 0, 4) !== "8BPS") throw new Error("Bukan PSD: " + file);
  const channels = b.readUInt16BE(12), height = b.readUInt32BE(14), width = b.readUInt32BE(18), depth = b.readUInt16BE(22);
  if (depth !== 8 && depth !== 16 && depth !== 32) throw new Error("Kedalaman PSD tidak didukung: " + file);
  const bps = depth / 8;
  let p = 26;
  p += 4 + b.readUInt32BE(p); // color mode data
  p += 4 + b.readUInt32BE(p); // image resources
  p += 4 + b.readUInt32BE(p); // layer & mask
  const compression = b.readUInt16BE(p);
  p += 2;
  let out = Buffer.alloc(width * height * bps);
  if (compression === 0) {
    b.copy(out, 0, p, p + out.length);
  } else if (compression === 1) {
    let q = p + channels * height * 2; // lewati tabel panjang baris
    let o = 0;
    while (o < out.length) {
      const n = b.readInt8(q++);
      if (n >= 0) { b.copy(out, o, q, q + n + 1); q += n + 1; o += n + 1; }
      else if (n !== -128) { out.fill(b[q++], o, o + 1 - n); o += 1 - n; }
    }
  } else throw new Error("Kompresi PSD tidak didukung: " + compression);
  if (bps === 2) {
    // 16-bit big endian: ambil byte tinggi saja
    const hi = Buffer.alloc(width * height);
    for (let i = 0; i < hi.length; i++) hi[i] = out[i * 2];
    out = hi;
  } else if (bps === 4) {
    // 32-bit float big endian (0..1)
    const u8 = Buffer.alloc(width * height);
    for (let i = 0; i < u8.length; i++) u8[i] = Math.max(0, Math.min(255, Math.round(out.readFloatBE(i * 4) * 255)));
    out = u8;
  }
  console.log("PSD", path.basename(file), width + "x" + height, depth + "bit", channels + "ch", "kompresi", compression);
  return { data: out, width, height };
}

/** Buka gambar sebagai instance sharp; BMP 24/32-bit dibaca manual (tidak didukung sharp). */
function open(file) {
  if (!file.toLowerCase().endsWith(".bmp")) return sharp(file);
  const b = fs.readFileSync(file);
  const offset = b.readUInt32LE(10), width = b.readInt32LE(18), rawH = b.readInt32LE(22), bpp = b.readUInt16LE(28);
  if (b.readUInt32LE(30) !== 0 || (bpp !== 24 && bpp !== 32)) throw new Error("BMP tidak didukung: " + file);
  const height = Math.abs(rawH), step = bpp / 8, stride = Math.ceil((width * step) / 4) * 4;
  const rgb = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++) {
    const row = offset + (rawH > 0 ? height - 1 - y : y) * stride;
    for (let x = 0; x < width; x++) {
      const s = row + x * step, d = (y * width + x) * 3;
      rgb[d] = b[s + 2]; rgb[d + 1] = b[s + 1]; rgb[d + 2] = b[s];
    }
  }
  return sharp(rgb, { raw: { width, height, channels: 3 } });
}

/** Satu kanal abu-abu berukuran size x size sebagai buffer mentah. */
async function gray(name, size) {
  const file = locate(name);
  let img;
  if (file.toLowerCase().endsWith(".psd")) {
    const { data, width, height } = readPsdGray(file);
    img = sharp(data, { raw: { width, height, channels: 1 } });
  } else {
    img = open(file).removeAlpha().extractChannel(0);
  }
  // toColourspace("b-w") memastikan keluaran tepat 1 kanal. Tanpa ini sharp baru
  // mengubah gambar abu-abu menjadi RGB (3 kanal) saat resize, sehingga buffer
  // 3x lebih besar dan alpha/AO/roughness terbaca bergeser (muncul garis-garis).
  return img.resize(size, size, { fit: "fill" }).toColourspace("b-w").raw().toBuffer();
}

async function run() {
  let total = 0;
  for (const [out, job] of Object.entries(jobs)) {
    const size = sizeFor(job);
    const dest = path.join(outDir, out);
    if (job.kind === "color") {
      let rgb = await open(locate(job.src)).removeAlpha().toColourspace("srgb").resize(size, size, { fit: "fill" }).raw().toBuffer();
      if (job.invertG) for (let i = 1; i < rgb.length; i += 3) rgb[i] = 255 - rgb[i];
      if (job.alpha) {
        const a = await gray(job.alpha, size);
        const rgba = Buffer.alloc(size * size * 4);
        for (let i = 0; i < size * size; i++) {
          rgba[i * 4] = rgb[i * 3]; rgba[i * 4 + 1] = rgb[i * 3 + 1]; rgba[i * 4 + 2] = rgb[i * 3 + 2]; rgba[i * 4 + 3] = a[i];
        }
        await sharp(rgba, { raw: { width: size, height: size, channels: 4 } }).webp({ quality: 80, alphaQuality: 85 }).toFile(dest);
      } else {
        await sharp(rgb, { raw: { width: size, height: size, channels: 3 } }).webp({ quality: 80 }).toFile(dest);
      }
    } else if (job.kind === "normal") {
      await open(locate(job.src)).removeAlpha().resize(size, size, { fit: "fill" }).webp({ quality: 88 }).toFile(dest);
    } else {
      // ORM: R = ambient occlusion, G = roughness, B = metallic (susunan glTF)
      const ao = job.ao ? await gray(job.ao, size) : null;
      const rough = job.rough ? await gray(job.rough, size) : null;
      const metal = job.metal ? await gray(job.metal, size) : null;
      const rd = Math.round(255 * job.roughDefault);
      const orm = Buffer.alloc(size * size * 3);
      for (let i = 0; i < size * size; i++) {
        orm[i * 3] = ao ? ao[i] : 255;
        orm[i * 3 + 1] = rough ? rough[i] : rd;
        orm[i * 3 + 2] = metal ? metal[i] : 0;
      }
      await sharp(orm, { raw: { width: size, height: size, channels: 3 } }).webp({ quality: 82 }).toFile(dest);
    }
    const bytes = fs.statSync(dest).size;
    total += bytes;
    console.log(String(size).padStart(4), String(Math.round(bytes / 1024)).padStart(5) + " KB", out);
  }
  console.log("TOTAL", (total / 1048576).toFixed(2), "MB,", Object.keys(jobs).length, "file");
}

run().catch((e) => { console.error(e); process.exit(1); });
