import type { BikeId, DecalDesignId, DecalMaterialId, ShippingId } from "./catalog";

// Tipe akun dan riwayat pesanan (MOCKUP: belum tersambung ke server).

/** Tampilan overlay akun: masuk dengan Google, atau riwayat pesanan setelah masuk. */
export type AccountView = "masuk" | "riwayat";

export interface Account {
  nama: string;
  email: string;
}

/**
 * Status pesanan: dari menunggu bayar sampai selesai (sudah sampai tujuan),
 * atau berhenti di tengah jalan karena dibatalkan user / batas bayar terlewat.
 */
export type OrderStatus = "menunggu-bayar" | "diproses" | "produksi" | "dikirim" | "selesai" | "batal" | "kadaluarsa";

/** Satu pesanan di riwayat. Harga dihitung dari katalog, bukan disimpan. */
export interface OrderRecord {
  id: string;
  /** Tanggal pesan, format ISO (YYYY-MM-DD). */
  tanggal: string;
  bikeId: BikeId;
  design: DecalDesignId;
  /** Id varian warna, atau "kustom" bila warnanya dijelaskan lewat teks. */
  color: string;
  customColor?: string;
  material: DecalMaterialId;
  /** Permintaan kustomisasi desain dari user (teks bebas). */
  catatanDesain?: string;
  pengiriman: ShippingId;
  status: OrderStatus;
  /** Nomor resi, hanya ada setelah pesanan dikirim. */
  resi?: string;
  /** Alasan pembatalan dari user (hanya untuk status batal). */
  alasanBatal?: string;
  /** Batas waktu pembayaran (YYYY-MM-DDTHH:mm, waktu setempat), untuk pesanan yang belum dibayar. */
  batasBayar?: string;
}
