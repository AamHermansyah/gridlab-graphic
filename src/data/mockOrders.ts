import type { OrderRecord, OrderStatus } from "@/types/account";
import { CUSTOM_COLOR_ID, CUSTOM_COLOR_PREVIEW_HEX, DECAL_COLORS, DECAL_DESIGNS, DECAL_MATERIALS, SHIPPING_OPTIONS, findOption } from "./catalog";

// Data contoh untuk riwayat pesanan (MOCKUP: bukan pesanan nyata).

/** Empat tahap pengerjaan pesanan, berurutan. */
export const ORDER_PROGRESS: readonly { id: OrderStatus; label: string }[] = [
  { id: "diproses", label: "Diproses" },
  { id: "produksi", label: "Produksi" },
  { id: "dikirim", label: "Dikirim" },
  { id: "selesai", label: "Selesai" },
];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  "menunggu-bayar": "Menunggu bayar",
  diproses: "Diproses",
  produksi: "Produksi",
  dikirim: "Dikirim",
  selesai: "Selesai",
  batal: "Dibatalkan",
  kadaluarsa: "Kadaluarsa",
};

/** Banyaknya tahap pengerjaan yang sudah terlewati (0 untuk menunggu bayar dan batal). */
export function progressStep(status: OrderStatus): number {
  return ORDER_PROGRESS.findIndex((p) => p.id === status) + 1;
}

/** Id alasan batal yang membuka kolom teks bebas. */
export const OTHER_CANCEL_REASON_ID = "lainnya";

/** Pilihan alasan membatalkan pesanan (MOCKUP: daftar masih contoh). */
export const CANCEL_REASONS: readonly { id: string; label: string }[] = [
  { id: "salah-pilih", label: "Salah memilih desain atau warna" },
  { id: "ubah-pesanan", label: "Ingin mengubah bahan atau pengiriman" },
  { id: "kendala-bayar", label: "Kendala saat pembayaran" },
  { id: "batal-beli", label: "Tidak jadi membeli" },
  { id: OTHER_CANCEL_REASON_ID, label: "Lainnya" },
];

export const MOCK_ORDERS: readonly OrderRecord[] = [
  {
    id: "GL-261112-0158",
    tanggal: "2026-11-12",
    bikeId: "gsx",
    design: "garis-balap",
    color: "biru",
    material: "doff",
    pengiriman: "ekspres",
    status: "menunggu-bayar",
    batasBayar: "2026-11-13T18:00",
  },
  {
    id: "GL-261110-0142",
    tanggal: "2026-11-10",
    bikeId: "ninja",
    design: "style-ktm",
    color: "lime",
    material: "chrome",
    catatanDesain: "Gambar naga di cover samping, kepalanya di bagian depan dekat headlamp.",
    pengiriman: "reguler",
    status: "produksi",
  },
  {
    id: "GL-261106-0121",
    tanggal: "2026-11-06",
    bikeId: "gsx",
    design: "geometris",
    color: CUSTOM_COLOR_ID,
    customColor: "Biru tosca",
    material: "hologram",
    pengiriman: "ekspres",
    status: "dikirim",
    resi: "RSI-8841-2290",
  },
  {
    id: "GL-261030-0104",
    tanggal: "2026-10-30",
    bikeId: "ninja",
    design: "garis-balap",
    color: "merah",
    material: "glossy",
    pengiriman: "reguler",
    status: "kadaluarsa",
    batasBayar: "2026-10-31T10:00",
  },
  {
    id: "GL-261026-0097",
    tanggal: "2026-10-26",
    bikeId: "ninja",
    design: "style-yz",
    color: "hitam",
    material: "glossy",
    pengiriman: "ambil",
    status: "selesai",
  },
  {
    id: "GL-260914-0063",
    tanggal: "2026-09-14",
    bikeId: "gsx",
    design: "style-ktm",
    color: "merah",
    material: "stabilo",
    pengiriman: "reguler",
    status: "batal",
    alasanBatal: "Salah memilih desain atau warna",
  },
];

/** Rincian harga sebuah pesanan, dihitung dari katalog saat ini. */
export function orderPricing(order: OrderRecord) {
  const design = findOption(DECAL_DESIGNS, order.design);
  const material = findOption(DECAL_MATERIALS, order.material);
  const shipping = findOption(SHIPPING_OPTIONS, order.pengiriman);
  return { design, material, shipping, total: design.harga + material.harga + shipping.harga };
}

/** Nama dan warna contoh varian warna decal sebuah pesanan. */
export function orderColor(order: OrderRecord): { nama: string; hex: string } {
  if (order.color === CUSTOM_COLOR_ID) {
    return { nama: `Kustom: ${order.customColor?.trim() || "belum dijelaskan"}`, hex: CUSTOM_COLOR_PREVIEW_HEX };
  }
  const color = findOption(DECAL_COLORS, order.color);
  return { nama: color.nama, hex: color.hex };
}

const date = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** Tanggal ISO (YYYY-MM-DD) menjadi mis. "12 Nov 2026". */
export function formatOrderDate(iso: string): string {
  return date.format(new Date(`${iso}T00:00:00Z`));
}

/** Tanggal dan jam (YYYY-MM-DDTHH:mm) menjadi mis. "13 Nov 2026, 18.00". */
export function formatOrderDateTime(iso: string): string {
  const [day, time = "00:00"] = iso.split("T");
  return `${formatOrderDate(day)}, ${time.replace(":", ".")}`;
}
