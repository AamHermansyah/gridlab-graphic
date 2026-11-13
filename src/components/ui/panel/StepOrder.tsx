"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { getBike } from "@/data/bikes";
import {
  DECAL_COLORS,
  DECAL_DESIGNS,
  DECAL_MATERIALS,
  PAYMENT_OPTIONS,
  SHIPPING_OPTIONS,
  findOption,
  formatRupiah,
} from "@/data/catalog";
import { validateOrder, type OrderErrors } from "@/lib/orderSchema";
import { selectOrderTotal, useConfigStore } from "@/store/useConfigStore";
import type { OrderForm } from "@/types/catalog";
import { CheckIcon } from "../icons";
import { FOCUS, Note, OptionCard, SectionTitle } from "./controls";

/** Id elemen <form>; tombol "Buat Pesanan" di dasar panel mengirim form ini. */
export const ORDER_FORM_ID = "form-pesanan";

type TextFieldName = Exclude<keyof OrderForm, "pengiriman" | "pembayaran">;

const INPUT =
  "w-full border bg-white/[0.05] px-3 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-accent";

/** Satu kolom isian teks dengan label dan pesan kesalahan. */
function Field({
  name,
  label,
  error,
  optional = false,
  multiline = false,
  ...input
}: {
  name: TextFieldName;
  label: string;
  error?: string;
  optional?: boolean;
  multiline?: boolean;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
  maxLength?: number;
}) {
  const value = useConfigStore((s) => s.order[name]);
  const setOrderField = useConfigStore((s) => s.setOrderField);
  const id = `pesan-${name}`;
  const className = `${INPUT} ${error ? "border-red-400/80" : "border-white/15"}`;
  const shared = {
    id,
    name,
    value,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-galat` : undefined,
    ...input,
  };

  return (
    <div>
      <label htmlFor={id} className="hud-label mb-1 flex justify-between text-white/65">
        <span>{label}</span>
        {optional && <span className="text-white/35">Opsional</span>}
      </label>
      {multiline ? (
        <textarea {...shared} rows={3} onChange={(e) => setOrderField(name, e.target.value)} className={`${className} resize-none py-2`} />
      ) : (
        <input {...shared} type="text" onChange={(e) => setOrderField(name, e.target.value)} className={`${className} h-11`} />
      )}
      {error && (
        <p id={`${id}-galat`} className="mt-1 text-xs leading-snug text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

function Row({ label, children, strong = false }: { label: string; children: ReactNode; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 text-sm ${strong ? "text-white" : "text-white/75"}`}>
      <span>{label}</span>
      <span className="shrink-0 text-right tabular-nums">{children}</span>
    </div>
  );
}

/** Rincian pesanan: motor, decal yang dipilih, dan total pembayaran. */
function OrderSummary() {
  const state = useConfigStore();
  const bike = getBike(state.bikeId);
  const design = findOption(DECAL_DESIGNS, state.decalDesign ?? "");
  const material = findOption(DECAL_MATERIALS, state.decalMaterial);
  const shipping = findOption(SHIPPING_OPTIONS, state.order.pengiriman);

  return (
    <section aria-label="Pesananmu">
      <SectionTitle note="Harga contoh">Pesananmu</SectionTitle>
      <div className="hud-cut-sm flex flex-col gap-1 border border-white/10 bg-white/[0.04] px-3 py-2.5">
        <Row label="Motor">{bike.nama}</Row>
        <Row label="Varian warna decal">{findOption(DECAL_COLORS, state.decalColor).nama}</Row>
        <div className="my-1 border-t border-white/10" />
        <Row label={`Decal ${design.nama}`}>Rp {formatRupiah(design.harga)}</Row>
        <Row label={`Bahan ${material.nama}`}>{material.harga ? `Rp ${formatRupiah(material.harga)}` : "Termasuk"}</Row>
        <Row label={`Pengiriman ${shipping.nama.toLowerCase()}`}>
          {shipping.harga ? `Rp ${formatRupiah(shipping.harga)}` : "Gratis"}
        </Row>
        <p className="mt-1 flex justify-between gap-3 border-t border-white/10 pt-2 font-display text-lg font-bold uppercase italic text-white">
          <span>Total pembayaran</span>
          <span className="tabular-nums text-accent">Rp {formatRupiah(selectOrderTotal(state))}</span>
        </p>
      </div>
    </section>
  );
}

/** Tampilan setelah data pesanan lengkap dan tombol "Buat Pesanan" ditekan. */
function OrderPlaced() {
  const order = useConfigStore((s) => s.order);
  const setOrderPlaced = useConfigStore((s) => s.setOrderPlaced);
  const pickup = order.pengiriman === "ambil";

  return (
    <section aria-label="Pesanan tercatat" aria-live="polite" className="mt-5">
      <div className="hud-cut-sm border border-accent/60 bg-accent/10 px-3 py-3">
        <p className="flex items-center gap-2 font-display text-xl font-extrabold uppercase italic leading-none text-white">
          <span className="flex h-6 w-6 items-center justify-center bg-accent text-ink-950">
            <CheckIcon className="h-4 w-4" strokeWidth={2.6} />
          </span>
          Data pesanan lengkap
        </p>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm text-white/80">
          <dt className="text-white/50">Penerima</dt>
          <dd>{order.nama}</dd>
          <dt className="text-white/50">WhatsApp</dt>
          <dd>{order.whatsapp}</dd>
          <dt className="text-white/50">{pickup ? "Pengambilan" : "Alamat"}</dt>
          <dd>{pickup ? "Diambil di workshop" : `${order.alamat}, ${order.kota}, ${order.provinsi} ${order.kodePos}`}</dd>
          <dt className="text-white/50">Pembayaran</dt>
          <dd>{findOption(PAYMENT_OPTIONS, order.pembayaran).nama}</dd>
        </dl>
        <p className="mt-3 text-xs leading-snug text-white/55">
          Ini masih simulasi: pesanan belum dikirim atau disimpan, dan pembayaran belum tersambung.
        </p>
        <button
          type="button"
          data-sound="tap"
          onClick={() => setOrderPlaced(false)}
          className={`${FOCUS} hud-label mt-3 border border-white/25 px-2.5 py-1.5 text-white/80 hover:border-white/60 hover:text-white`}
        >
          Ubah data
        </button>
      </div>
    </section>
  );
}

/**
 * Tahap 4: ringkasan pembayaran. Berisi rincian pesanan dan form data
 * penerima, alamat, pengiriman, serta metode pembayaran.
 */
export function StepOrder() {
  const order = useConfigStore((s) => s.order);
  const orderPlaced = useConfigStore((s) => s.orderPlaced);
  const setOrderField = useConfigStore((s) => s.setOrderField);
  const setOrderPlaced = useConfigStore((s) => s.setOrderPlaced);
  const [errors, setErrors] = useState<OrderErrors>({});
  const pickup = order.pengiriman === "ambil";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateOrder(order);
    setErrors(found);
    const firstInvalid = Object.keys(found)[0];
    if (firstInvalid) {
      // Bawa user ke kolom pertama yang perlu diperbaiki
      document.getElementById(`pesan-${firstInvalid}`)?.focus();
      return;
    }
    setOrderPlaced(true);
  }

  if (orderPlaced) {
    return (
      <>
        <OrderSummary />
        <OrderPlaced />
      </>
    );
  }

  const errorCount = Object.keys(errors).length;

  return (
    <>
      <OrderSummary />

      <form id={ORDER_FORM_ID} noValidate onSubmit={handleSubmit} className="mt-5 flex flex-col gap-5">
        {errorCount > 0 && (
          <p role="alert" className="border-l-2 border-red-400 pl-3 text-sm leading-snug text-red-200">
            Masih ada {errorCount} kolom yang perlu diperbaiki.
          </p>
        )}

        <section aria-label="Data penerima">
          <SectionTitle>Data penerima</SectionTitle>
          <div className="flex flex-col gap-2.5">
            <Field name="nama" label="Nama lengkap" error={errors.nama} autoComplete="name" placeholder="Nama sesuai penerima paket" />
            <Field name="whatsapp" label="Nomor WhatsApp" error={errors.whatsapp} autoComplete="tel" inputMode="tel" placeholder="081234567890" />
            <Field name="email" label="Email" error={errors.email} optional autoComplete="email" inputMode="email" placeholder="nama@email.com" />
          </div>
        </section>

        <section aria-label="Pengiriman">
          <SectionTitle note="Mockup">Pengiriman</SectionTitle>
          <div className="flex flex-col gap-1.5">
            {SHIPPING_OPTIONS.map((option) => (
              <OptionCard
                key={option.id}
                title={option.nama}
                description={option.deskripsi}
                price={option.harga ? `Rp ${formatRupiah(option.harga)}` : "Gratis"}
                active={option.id === order.pengiriman}
                onClick={() => setOrderField("pengiriman", option.id)}
              />
            ))}
          </div>
        </section>

        {pickup ? (
          <Note>Alamat dan jam buka workshop akan dikirim lewat WhatsApp setelah pesanan dibuat.</Note>
        ) : (
          <section aria-label="Alamat pengiriman">
            <SectionTitle>Alamat pengiriman</SectionTitle>
            <div className="flex flex-col gap-2.5">
              <Field
                name="alamat"
                label="Alamat lengkap"
                error={errors.alamat}
                multiline
                autoComplete="street-address"
                placeholder="Jalan, nomor rumah, RT/RW, kelurahan, kecamatan"
              />
              <div className="grid grid-cols-2 gap-2.5">
                <Field name="kota" label="Kota / kabupaten" error={errors.kota} autoComplete="address-level2" />
                <Field name="provinsi" label="Provinsi" error={errors.provinsi} autoComplete="address-level1" />
              </div>
              <Field name="kodePos" label="Kode pos" error={errors.kodePos} autoComplete="postal-code" inputMode="numeric" maxLength={5} placeholder="5 angka" />
            </div>
          </section>
        )}

        <section aria-label="Catatan">
          <Field
            name="catatan"
            label="Catatan untuk penjual"
            error={errors.catatan}
            optional
            multiline
            maxLength={300}
            placeholder="Contoh: tahun motor, permintaan khusus, patokan alamat"
          />
        </section>

        <section aria-label="Metode pembayaran">
          <SectionTitle note="Mockup">Metode pembayaran</SectionTitle>
          <div className="flex flex-col gap-1.5">
            {PAYMENT_OPTIONS.map((option) => (
              <OptionCard
                key={option.id}
                title={option.nama}
                description={option.deskripsi}
                active={option.id === order.pembayaran}
                onClick={() => setOrderField("pembayaran", option.id)}
              />
            ))}
          </div>
        </section>
      </form>
    </>
  );
}
