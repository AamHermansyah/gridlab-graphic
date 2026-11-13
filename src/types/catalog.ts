// Tipe katalog: motor, pilihan kustomisasi, decal, dan data pesanan.

export type BikeId = "ninja" | "gsx";

/** Empat tahap konfigurator, berurutan. */
export type FlowStep = "motor" | "kustom" | "decal" | "pesan";

/** Kategori di tahap kustomisasi (menyamakan tampilan dengan motor milik user; tanpa biaya). */
export type CustomCategoryId = "bodi" | "ban" | "kepala" | "swingarm";

export type TireId = "tahu" | "biasa" | "supermotor";

/** Gaya kepala depan: lampu utama atau papan nomor cross. */
export type HeadStyleId = "headlamp" | "papan";

/** Merek/tipe papan nomor (papan biasanya sepaket dengan spakbor depan motor). */
export type PlateBrandId = "rmz" | "crf250" | "yz" | "lainnya";

export type SwingarmId = "standar" | "style-ktm" | "style-yz";
export type DecalDesignId = "style-ktm" | "style-yz" | "garis-balap" | "geometris";
export type DecalMaterialId = "glossy" | "doff" | "chrome" | "hologram" | "stabilo";
export type ShippingId = "reguler" | "ekspres" | "ambil";
export type PaymentId = "transfer" | "qris" | "ewallet" | "cod";

/** Pilihan tanpa harga (kustomisasi motor). */
export interface Option<Id extends string = string> {
  id: Id;
  nama: string;
  deskripsi?: string;
}

/** Pilihan yang punya harga (rupiah). */
export interface PricedOption<Id extends string = string> extends Option<Id> {
  harga: number;
}

export interface ColorOption extends Option {
  hex: string;
}

/**
 * Bagian bodi/cover yang warnanya bisa diatur. `id` = nama node di file GLB,
 * kecuali input yang belum punya node di model (entri panel saja).
 */
export interface BodyPart {
  id: string;
  nama: string;
  /** Id warna bawaan (lihat PAINT_COLORS). */
  warnaBawaan: string;
  /** true = tetap dicat di 3D dengan warna bawaannya, tapi tidak jadi input warna di panel. */
  tanpaInput?: boolean;
}

export interface BikeDefinition {
  id: BikeId;
  nama: string;
  tipe: string;
  deskripsi: string;
  /** File GLB hasil konversi (lihat tools/bike-import). Skala 1:1 dalam meter. */
  url: string;
  /** Dimensi model dalam meter. */
  spec: { panjang: number; lebar: number; tinggi: number; jarakSumbuRoda: number };
  bodyParts: readonly BodyPart[];
  /** Warna swing arm bawaan (node "swingarm" di GLB). */
  warnaSwingarm: string;
}

/** Bahan decal: pilihan berharga (tampilan 3D-nya menyusul; panel saat ini mockup). */
export type DecalMaterial = PricedOption<DecalMaterialId>;

export interface CustomCategory {
  id: CustomCategoryId;
  label: string;
}

/** Data pemesan untuk pembayaran dan pengantaran. */
export interface OrderForm {
  nama: string;
  whatsapp: string;
  email: string;
  alamat: string;
  kota: string;
  provinsi: string;
  kodePos: string;
  catatan: string;
  pengiriman: ShippingId;
  pembayaran: PaymentId;
}
