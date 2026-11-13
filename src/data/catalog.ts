import type {
  ColorOption,
  CustomCategory,
  DecalDesignId,
  DecalMaterial,
  FlowStep,
  ForkId,
  HeadStyleId,
  Option,
  PaymentId,
  PlateBrandId,
  PricedOption,
  ShippingId,
  SwingarmId,
  TireId,
} from "@/types/catalog";

// Registry pilihan konfigurator.
// Situs ini khusus menjual decal: kustomisasi motor (tahap 2) hanya untuk
// menyamakan tampilan dengan motor milik user dan TIDAK berbiaya. Yang
// berharga hanyalah desain decal, bahan decal, dan ongkos kirim.
// SEMUA HARGA MASIH CONTOH (mockup) dan perlu diganti dengan harga asli.

export const FLOW_STEPS: readonly { id: FlowStep; label: string; judul: string }[] = [
  { id: "motor", label: "Motor", judul: "Pilih Motormu" },
  { id: "kustom", label: "Kustom", judul: "Samakan Motormu" },
  { id: "decal", label: "Decal", judul: "Pilih Decal" },
  { id: "pesan", label: "Pesan", judul: "Ringkasan Pembayaran" },
];

export const CUSTOM_CATEGORIES: readonly CustomCategory[] = [
  { id: "bodi", label: "Bodi" },
  { id: "kepala", label: "Kepala" },
  { id: "kaki", label: "Kaki-kaki" },
];

export const PAINT_COLORS: readonly ColorOption[] = [
  { id: "putih", nama: "Putih", hex: "#f1f1ee" },
  { id: "hitam", nama: "Hitam", hex: "#121315" },
  { id: "abu", nama: "Abu-abu", hex: "#6c7179" },
  { id: "merah", nama: "Merah", hex: "#c4122b" },
  { id: "oranye", nama: "Oranye", hex: "#ee6a0c" },
  { id: "kuning", nama: "Kuning", hex: "#f0c010" },
  { id: "lime", nama: "Hijau lime", hex: "#8fd400" },
  { id: "tosca", nama: "Tosca", hex: "#0aa398" },
  { id: "biru", nama: "Biru", hex: "#1548b8" },
  { id: "ungu", nama: "Ungu", hex: "#5a2b9c" },
];

/** Pilihan jenis ban (MOCKUP: deskripsi masih contoh, belum memengaruhi tampilan 3D). */
export const TIRE_OPTIONS: readonly Option<TireId>[] = [
  { id: "tahu", nama: "Ban tahu", deskripsi: "Licin tanpa tapak seperti ban drag." },
  { id: "biasa", nama: "Ban biasa", deskripsi: "Tapak standar bawaan motor." },
  { id: "supermotor", nama: "Ban supermotor", deskripsi: "Tapak lebar dan lebat untuk sportbike." },
];

/** Pilihan shockbreaker/garpu depan (MOCKUP: belum memengaruhi tampilan 3D). */
export const FORK_OPTIONS: readonly Option<ForkId>[] = [
  { id: "usd", nama: "USD", deskripsi: "Upside down: garpu terbalik, lebih kaku dan ringan." },
  { id: "tele", nama: "Tele", deskripsi: "Teleskopik konvensional seperti motor standar." },
];

/** Gaya kepala depan (MOCKUP: belum memengaruhi tampilan 3D). */
export const HEAD_STYLE_OPTIONS: readonly Option<HeadStyleId>[] = [
  { id: "headlamp", nama: "Headlamp", deskripsi: "Lampu utama bawaan motor." },
  { id: "papan", nama: "Papan nomor", deskripsi: "Papan nomor cross di posisi lampu." },
];

/**
 * Merek papan nomor (MOCKUP: daftar masih contoh). Papan nomor biasanya
 * sepaket dengan spakbor depan dari motornya.
 */
export const PLATE_BRAND_OPTIONS: readonly Option<PlateBrandId>[] = [
  { id: "rmz", nama: "RMZ", deskripsi: "Papan model RM-Z, lekuk lebar." },
  { id: "crf250", nama: "CRF 250", deskripsi: "Papan model CRF, potongan ramping." },
  { id: "yz", nama: "YZ", deskripsi: "Papan model YZ, bentuk runcing." },
  { id: "lainnya", nama: "Merek lainnya", deskripsi: "Papan model lain atau papan polos." },
];

export const SWINGARM_OPTIONS: readonly Option<SwingarmId>[] = [
  { id: "standar", nama: "Standar", deskripsi: "Swing arm bawaan motor." },
  { id: "style-ktm", nama: "Style KTM", deskripsi: "Lengan cor berongga dengan rusuk penguat." },
  { id: "style-yz", nama: "Style YZ", deskripsi: "Balok aluminium polos yang meruncing." },
];

export const DECAL_DESIGNS: readonly PricedOption<DecalDesignId>[] = [
  { id: "style-ktm", nama: "Style KTM", harga: 650_000, deskripsi: "Sayatan tajam menyerong." },
  { id: "style-yz", nama: "Style YZ", harga: 650_000, deskripsi: "Blok kecepatan memanjang." },
  { id: "garis-balap", nama: "Garis Balap", harga: 450_000, deskripsi: "Dua garis sejajar klasik." },
  { id: "geometris", nama: "Geometris", harga: 550_000, deskripsi: "Serpihan segitiga acak." },
];

/** Varian warna decal (warna cetak utama). */
export const DECAL_COLORS: readonly ColorOption[] = [
  { id: "putih", nama: "Putih", hex: "#f4f4f1" },
  { id: "hitam", nama: "Hitam", hex: "#101113" },
  { id: "merah", nama: "Merah", hex: "#d4142e" },
  { id: "oranye", nama: "Oranye", hex: "#f26a00" },
  { id: "kuning", nama: "Kuning", hex: "#f5c400" },
  { id: "lime", nama: "Lime", hex: "#b4f000" },
  { id: "biru", nama: "Biru", hex: "#1a5be0" },
  { id: "ungu", nama: "Ungu", hex: "#7a35d0" },
];

/** Id pilihan "Kustom" pada varian warna decal: warna di luar daftar, dijelaskan user lewat teks. */
export const CUSTOM_COLOR_ID = "kustom";

/** Warna netral untuk pratinjau saat varian warna "Kustom" dipilih (warnanya belum diketahui). */
export const CUSTOM_COLOR_PREVIEW_HEX = "#b8bcc4";

/** Warna contoh sebuah varian warna decal (netral untuk "Kustom"). */
export function getDecalColorHex(colorId: string): string {
  return colorId === CUSTOM_COLOR_ID ? CUSTOM_COLOR_PREVIEW_HEX : findOption(DECAL_COLORS, colorId).hex;
}

/**
 * Bahan decal (MOCKUP: daftar dan harganya masih contoh, menunggu daftar bahan
 * asli). Harga adalah tambahan di atas harga desain decal.
 * Belum memengaruhi tampilan 3D.
 */
export const DECAL_MATERIALS: readonly DecalMaterial[] = [
  { id: "glossy", nama: "Glossy", harga: 0, deskripsi: "Mengilap standar." },
  { id: "doff", nama: "Doff", harga: 50_000, deskripsi: "Matte, tidak memantul." },
  { id: "chrome", nama: "Chrome", harga: 250_000, deskripsi: "Logam mengilap seperti cermin." },
  { id: "hologram", nama: "Hologram", harga: 300_000, deskripsi: "Berubah warna mengikuti sudut pandang." },
  { id: "stabilo", nama: "Stabilo", harga: 150_000, deskripsi: "Warna neon menyala." },
];

/** Pilihan pengiriman (MOCKUP: jenis layanan dan ongkosnya masih contoh). */
export const SHIPPING_OPTIONS: readonly PricedOption<ShippingId>[] = [
  { id: "reguler", nama: "Reguler", harga: 25_000, deskripsi: "Estimasi 3–5 hari kerja." },
  { id: "ekspres", nama: "Ekspres", harga: 45_000, deskripsi: "Estimasi 1–2 hari kerja." },
  { id: "ambil", nama: "Ambil di workshop", harga: 0, deskripsi: "Diambil sendiri, tanpa ongkos kirim." },
];

/** Metode pembayaran (MOCKUP: belum tersambung ke penyedia pembayaran). */
export const PAYMENT_OPTIONS: readonly Option<PaymentId>[] = [
  { id: "transfer", nama: "Transfer bank", deskripsi: "Transfer manual, lalu kirim bukti bayar." },
  { id: "qris", nama: "QRIS", deskripsi: "Pindai kode QR dari aplikasi bank atau dompet digital." },
  { id: "ewallet", nama: "Dompet digital", deskripsi: "Bayar lewat aplikasi dompet digital." },
  { id: "cod", nama: "Bayar di tempat (COD)", deskripsi: "Bayar saat decal diterima." },
];

export function findOption<T extends { id: string }>(list: readonly T[], id: string): T {
  return list.find((o) => o.id === id) ?? list[0];
}

const rupiah = new Intl.NumberFormat("id-ID");

/** Format angka rupiah tanpa awalan, mis. 1.250.000. */
export function formatRupiah(value: number): string {
  return rupiah.format(value);
}
