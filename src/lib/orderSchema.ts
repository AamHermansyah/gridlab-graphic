import { z } from "zod";
import type { OrderForm } from "@/types/catalog";

// Validasi data pemesan (tahap 4). Alamat hanya wajib jika decal dikirim.

const text = (min: number, message: string) => z.string().trim().min(min, message);

export const orderSchema = z
  .object({
    nama: text(3, "Isi nama lengkap (minimal 3 huruf)."),
    whatsapp: z
      .string()
      .trim()
      .regex(/^(\+62|62|0)8\d{7,12}$/, "Nomor WhatsApp tidak valid. Contoh: 081234567890."),
    email: z
      .string()
      .trim()
      .regex(/^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Format email tidak valid."),
    alamat: z.string().trim(),
    kota: z.string().trim(),
    provinsi: z.string().trim(),
    kodePos: z.string().trim(),
    catatan: z.string().trim().max(300, "Catatan maksimal 300 karakter."),
    pengiriman: z.enum(["reguler", "ekspres", "ambil"]),
    pembayaran: z.enum(["transfer", "qris", "ewallet", "cod"]),
  })
  .superRefine((value, ctx) => {
    if (value.pengiriman === "ambil") return;
    const required: [keyof OrderForm, boolean, string][] = [
      ["alamat", value.alamat.length >= 10, "Isi alamat lengkap (jalan, nomor, RT/RW, kelurahan, kecamatan)."],
      ["kota", value.kota.length >= 3, "Isi kota atau kabupaten."],
      ["provinsi", value.provinsi.length >= 3, "Isi provinsi."],
      ["kodePos", /^\d{5}$/.test(value.kodePos), "Kode pos harus 5 angka."],
    ];
    for (const [field, valid, message] of required) {
      if (!valid) ctx.addIssue({ code: "custom", path: [field], message });
    }
  });

export type OrderErrors = Partial<Record<keyof OrderForm, string>>;

/** Hasil validasi: daftar pesan kesalahan per kolom (kosong jika semua valid). */
export function validateOrder(form: OrderForm): OrderErrors {
  const result = orderSchema.safeParse(form);
  if (result.success) return {};
  const errors: OrderErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof OrderForm | undefined;
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return errors;
}
