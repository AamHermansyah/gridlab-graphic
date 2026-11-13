"use client";

import { useState, type ReactNode } from "react";
import { getBike } from "@/data/bikes";
import { getDecalColorHex, formatRupiah } from "@/data/catalog";
import {
  CANCEL_REASONS,
  OTHER_CANCEL_REASON_ID,
  ORDER_PROGRESS,
  STATUS_LABEL,
  formatOrderDate,
  formatOrderDateTime,
  orderColor,
  orderPricing,
  progressStep,
} from "@/data/mockOrders";
import { useAccountStore } from "@/store/useAccountStore";
import { useConfigStore } from "@/store/useConfigStore";
import type { OrderRecord, OrderStatus } from "@/types/account";
import { DecalPreview } from "../DecalPreview";
import { ChevronIcon } from "../icons";
import { FOCUS, GHOST_BUTTON, INPUT_CLASS, PRIMARY_BUTTON, SectionTitle } from "../panel/controls";

const ACTIVE_STATUSES: readonly OrderStatus[] = ["menunggu-bayar", "diproses", "produksi", "dikirim"];
/** Status yang berarti pembayaran sudah diterima. */
const PAID_STATUSES: readonly OrderStatus[] = ["diproses", "produksi", "dikirim", "selesai"];
/** Status yang boleh memesan ulang: pesanan sudah tuntas atau sudah berhenti (batal / kadaluarsa). */
const REORDER_STATUSES: readonly OrderStatus[] = ["selesai", "batal", "kadaluarsa"];
const CANCEL_NOTE_MAX = 200;

const FILTERS = [
  { id: "semua", label: "Semua", match: () => true },
  { id: "berjalan", label: "Berjalan", match: (s: OrderStatus) => ACTIVE_STATUSES.includes(s) },
  { id: "selesai", label: "Selesai", match: (s: OrderStatus) => s === "selesai" },
  { id: "batal", label: "Batal", match: (s: OrderStatus) => s === "batal" },
  { id: "kadaluarsa", label: "Kadaluarsa", match: (s: OrderStatus) => s === "kadaluarsa" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

function StatusBadge({ status }: { status: OrderStatus }) {
  const tone =
    status === "selesai"
      ? "border-accent bg-accent text-ink-950"
      : status === "batal"
        ? "border-red-400/70 text-red-300"
        : status === "kadaluarsa"
          ? "border-red-400/40 text-red-300/70"
          : status === "menunggu-bayar"
            ? "border-white/30 text-white/70"
            : "border-accent/70 text-accent";
  return <span className={`hud-label inline-block border px-1.5 py-0.5 ${tone}`}>{STATUS_LABEL[status]}</span>;
}

/** Bar tahap pengerjaan: empat segmen miring seperti bar progres game. */
function Progress({ status }: { status: OrderStatus }) {
  const step = progressStep(status);
  const cancelled = status === "batal" || status === "kadaluarsa";
  return (
    <div aria-hidden="true" className="mt-2.5">
      <div className="grid grid-cols-4 gap-1">
        {ORDER_PROGRESS.map((item, index) => (
          <span
            key={item.id}
            className={`h-1.5 -skew-x-[20deg] ${index < step ? "bg-accent" : cancelled ? "bg-red-400/30" : "bg-white/12"}`}
          />
        ))}
      </div>
      <div className="mt-1 grid grid-cols-4 gap-1">
        {ORDER_PROGRESS.map((item, index) => (
          <span key={item.id} className={`hud-label truncate ${index === step - 1 ? "text-accent" : "text-white/35"}`}>
            {item.label}
          </span>
        ))}
      </div>
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

/** Form pembatalan: pilih alasan lewat select; "Lainnya" membuka kolom teks untuk alasan sendiri. */
function CancelForm({ orderId, onCancel, onBack }: { orderId: string; onCancel: (alasan: string) => void; onBack: () => void }) {
  const [reasonId, setReasonId] = useState("");
  const [note, setNote] = useState("");
  const other = reasonId === OTHER_CANCEL_REASON_ID;
  const noteValid = note.trim().length >= 3;
  const ready = reasonId !== "" && (!other || noteValid);

  function submit() {
    if (!ready) return;
    const label = CANCEL_REASONS.find((r) => r.id === reasonId)?.label ?? "";
    onCancel(other ? `Lainnya: ${note.trim()}` : label);
  }

  return (
    <div role="group" aria-label="Batalkan pesanan" className="border-l-2 border-red-400 pl-3">
      <p className="text-sm leading-snug text-red-200">Batalkan pesanan ini? Pesanan yang dibatalkan tidak bisa dipulihkan.</p>

      <label htmlFor={`alasan-${orderId}`} className="hud-label mb-1 mt-3 block text-white/65">
        Alasan pembatalan
      </label>
      <div className="relative">
        <select
          id={`alasan-${orderId}`}
          value={reasonId}
          onChange={(e) => setReasonId(e.target.value)}
          className={`${INPUT_CLASS} h-11 cursor-pointer appearance-none border-white/15 pr-9 ${reasonId ? "" : "text-white/40"}`}
        >
          <option value="" disabled className="bg-ink-800 text-white/50">
            Pilih alasan
          </option>
          {CANCEL_REASONS.map((reason) => (
            <option key={reason.id} value={reason.id} className="bg-ink-800 text-white">
              {reason.label}
            </option>
          ))}
        </select>
        <ChevronIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-180 text-white/50" />
      </div>

      {other && (
        <div className="mt-2">
          <label htmlFor={`alasan-lain-${orderId}`} className="hud-label mb-1 block text-white/65">
            Tulis alasanmu
          </label>
          <textarea
            id={`alasan-lain-${orderId}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={CANCEL_NOTE_MAX}
            placeholder="Ceritakan alasan pembatalan"
            className={`${INPUT_CLASS} resize-none border-white/15 py-2`}
          />
          <p className="hud-label mt-1 text-right text-white/40">
            {note.length}/{CANCEL_NOTE_MAX}
          </p>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <button type="button" data-sound="tap" onClick={onBack} className={`${GHOST_BUTTON} flex-1`}>
          Tidak
        </button>
        <button
          type="button"
          data-sound="select"
          disabled={!ready}
          onClick={submit}
          className={`${FOCUS} hud-cut-sm flex h-11 flex-1 items-center justify-center border border-red-400/70 bg-red-500/15 px-4 font-display text-base font-bold uppercase italic text-red-200 transition-[transform,opacity] duration-150 hover:bg-red-500/25 active:scale-95 disabled:opacity-35 disabled:hover:bg-red-500/15`}
        >
          Ya, batalkan
        </button>
      </div>
    </div>
  );
}

/**
 * Tombol aksi sesuai status: belum bayar -> Bayar + Batal (batal minta alasan dan konfirmasi);
 * selesai, batal, atau kadaluarsa -> Pesan lagi; status yang masih berjalan tidak punya aksi.
 */
function OrderActions({
  order,
  onPay,
  onCancel,
  onReorder,
}: {
  order: OrderRecord;
  onPay: () => void;
  onCancel: (alasan: string) => void;
  onReorder: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  if (REORDER_STATUSES.includes(order.status)) {
    return (
      <button type="button" data-sound="select" onClick={onReorder} className={`${PRIMARY_BUTTON} w-full`}>
        Pesan lagi
      </button>
    );
  }

  if (order.status !== "menunggu-bayar") return null;

  if (confirming) {
    return <CancelForm orderId={order.id} onCancel={onCancel} onBack={() => setConfirming(false)} />;
  }

  return (
    <div className="flex gap-2">
      <button type="button" data-sound="tap" onClick={() => setConfirming(true)} className={GHOST_BUTTON}>
        Batal
      </button>
      <button type="button" data-sound="select" onClick={onPay} className={`${PRIMARY_BUTTON} flex-1`}>
        Bayar
      </button>
    </div>
  );
}

/** Satu pesanan: baris ringkas yang bisa dibuka untuk melihat rincian dan aksinya. */
function OrderCard({
  order,
  expanded,
  onToggle,
  onPay,
  onCancel,
  onReorder,
}: {
  order: OrderRecord;
  expanded: boolean;
  onToggle: () => void;
  onPay: () => void;
  onCancel: (alasan: string) => void;
  onReorder: () => void;
}) {
  const bike = getBike(order.bikeId);
  const { design, material, shipping, total } = orderPricing(order);
  const color = orderColor(order);
  const detailId = `rincian-${order.id}`;

  return (
    <article className={`hud-cut-sm border ${expanded ? "border-accent/60 bg-accent/5" : "border-white/10 bg-white/4"}`}>
      <button
        type="button"
        data-sound="select"
        aria-expanded={expanded}
        aria-controls={detailId}
        onClick={onToggle}
        className={`${FOCUS} block w-full px-3 py-3 text-left`}
      >
        <span className="flex items-start gap-3">
          <DecalPreview design={order.design} color={getDecalColorHex(order.color)} className="w-24 shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="hud-label block truncate text-white/50">
              {order.id} · {formatOrderDate(order.tanggal)}
            </span>
            <span className="block truncate font-display text-xl font-extrabold uppercase italic leading-tight text-white">
              {design.nama}
            </span>
            <span className="block truncate text-xs text-white/55">
              {bike.nama} · {material.nama}
            </span>
          </span>
          <ChevronIcon className={`mt-1 h-4 w-4 shrink-0 text-white/50 transition-transform duration-200 ${expanded ? "" : "rotate-180"}`} />
        </span>
        <span className="mt-2.5 flex items-center justify-between gap-3">
          <StatusBadge status={order.status} />
          <span className="font-display text-xl font-bold italic leading-none text-white tabular-nums">
            <span className="mr-1 text-sm text-accent">Rp</span>
            {formatRupiah(total)}
          </span>
        </span>
        <Progress status={order.status} />
      </button>

      {expanded && (
        <div id={detailId} className="border-t border-white/10 px-3 py-3">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-white/50">Motor</dt>
            <dd className="text-white/80">{bike.nama}</dd>
            <dt className="text-white/50">Warna decal</dt>
            <dd className="flex items-center gap-2 text-white/80">
              <span className="h-3.5 w-3.5 shrink-0 border border-white/25" style={{ backgroundColor: color.hex }} aria-hidden="true" />
              {color.nama}
            </dd>
            <dt className="text-white/50">Bahan</dt>
            <dd className="text-white/80">{material.nama}</dd>
            <dt className="text-white/50">Pengiriman</dt>
            <dd className="text-white/80">{shipping.nama}</dd>
            {order.resi && (
              <>
                <dt className="text-white/50">Nomor resi</dt>
                <dd className="tabular-nums text-white/80">{order.resi}</dd>
              </>
            )}
            {order.alasanBatal && (
              <>
                <dt className="text-white/50">Alasan batal</dt>
                <dd className="wrap-break-word text-red-200/90">{order.alasanBatal}</dd>
              </>
            )}
            {order.batasBayar && (
              <>
                <dt className="text-white/50">{order.status === "kadaluarsa" ? "Batas bayar" : "Bayar sebelum"}</dt>
                <dd className={`tabular-nums ${order.status === "kadaluarsa" ? "text-red-300/80" : "text-accent"}`}>
                  {formatOrderDateTime(order.batasBayar)}
                  {order.status === "kadaluarsa" && " (terlewat)"}
                </dd>
              </>
            )}
          </dl>

          {order.catatanDesain && (
            <div className="mt-3 text-sm text-white/75">
              <p>Kustomisasi desain</p>
              <p className="mt-0.5 whitespace-pre-wrap wrap-break-word border-l-2 border-accent/60 pl-2.5 text-white/60">
                {order.catatanDesain}
              </p>
            </div>
          )}

          <div className="my-3 flex flex-col gap-1 border-t border-white/10 pt-3">
            <Row label={`Decal ${design.nama}`}>Rp {formatRupiah(design.harga)}</Row>
            <Row label={`Bahan ${material.nama}`}>{material.harga ? `Rp ${formatRupiah(material.harga)}` : "Termasuk"}</Row>
            <Row label={`Pengiriman ${shipping.nama.toLowerCase()}`}>
              {shipping.harga ? `Rp ${formatRupiah(shipping.harga)}` : "Gratis"}
            </Row>
            <Row label="Total" strong>
              <span className="font-display text-lg font-bold italic text-accent">Rp {formatRupiah(total)}</span>
            </Row>
          </div>

          <OrderActions order={order} onPay={onPay} onCancel={onCancel} onReorder={onReorder} />
        </div>
      )}
    </article>
  );
}

/** Riwayat pesanan: profil, ringkasan angka, filter status, dan daftar pesanan (MOCKUP: data contoh). */
export function OrderHistory() {
  const account = useAccountStore((s) => s.account);
  const logout = useAccountStore((s) => s.logout);
  const close = useAccountStore((s) => s.close);
  const allOrders = useAccountStore((s) => s.orders);
  const payOrder = useAccountStore((s) => s.payOrder);
  const cancelOrder = useAccountStore((s) => s.cancelOrder);
  const [filter, setFilter] = useState<FilterId>("semua");
  const [openId, setOpenId] = useState<string | null>(null);

  if (!account) return null;

  const active = allOrders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length;
  // Total belanja hanya menghitung pesanan yang sudah dibayar.
  const spent = allOrders.filter((o) => PAID_STATUSES.includes(o.status)).reduce((sum, o) => sum + orderPricing(o).total, 0);
  const current = FILTERS.find((f) => f.id === filter) ?? FILTERS[0];
  const orders = allOrders.filter((o) => current.match(o.status));

  // Isi konfigurator dengan pilihan pesanan lama, lalu kembali ke garasi.
  function reorder(order: OrderRecord) {
    const config = useConfigStore.getState();
    config.selectBike(order.bikeId);
    config.setDecalDesign(order.design);
    config.setDecalColor(order.color);
    config.setDecalCustomColor(order.customColor ?? "");
    config.setDecalMaterial(order.material);
    config.setDecalNotes(order.catatanDesain ?? "");
    close();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <span className="hud-cut-sm flex h-12 w-12 shrink-0 items-center justify-center bg-accent font-display text-2xl font-extrabold italic text-ink-950">
          {account.nama.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-xl font-extrabold uppercase italic leading-none text-white">{account.nama}</p>
          <p className="mt-1 truncate text-xs text-white/55">{account.email}</p>
        </div>
        <button type="button" data-sound="tap" onClick={logout} className={`${GHOST_BUTTON} h-9 px-3 text-sm`}>
          Keluar
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {[
          { label: "Pesanan", value: String(allOrders.length) },
          { label: "Berjalan", value: String(active) },
          { label: "Total belanja", value: `${(spent / 1_000_000).toFixed(1).replace(".", ",")} jt`, hint: `Rp ${formatRupiah(spent)}` },
        ].map((stat) => (
          <div key={stat.label} title={stat.hint} className="hud-cut-sm border-l-2 border-accent bg-white/4 px-2.5 py-2">
            <p className="hud-label truncate text-white/55">{stat.label}</p>
            <p className="font-display text-2xl font-bold italic leading-none text-white tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      <section aria-label="Daftar pesanan">
        <SectionTitle note={`${orders.length} pesanan`}>Pesananmu</SectionTitle>
        <div role="group" aria-label="Saring status" className="mb-2 flex flex-wrap gap-1">
          {FILTERS.map((item) => {
            const selected = item.id === filter;
            return (
              <button
                key={item.id}
                type="button"
                data-sound="select"
                aria-pressed={selected}
                onClick={() => {
                  setFilter(item.id);
                  setOpenId(null);
                }}
                className={`${FOCUS} hud-cut-sm h-9 border px-3 font-display text-sm font-bold uppercase italic transition-[background-color,border-color,color] duration-150 ${
                  selected ? "border-accent bg-accent text-ink-950" : "border-white/10 bg-white/4 text-white/70 hover:border-white/30 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {orders.length === 0 ? (
          <p className="border-l-2 border-accent/60 pl-3 text-sm leading-snug text-white/60">Belum ada pesanan di kategori ini.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                expanded={openId === order.id}
                onToggle={() => setOpenId(openId === order.id ? null : order.id)}
                onPay={() => payOrder(order.id)}
                onCancel={(alasan) => cancelOrder(order.id, alasan)}
                onReorder={() => reorder(order)}
              />
            ))}
          </div>
        )}
        <p className="mt-3 text-xs leading-snug text-white/45">Riwayat ini masih contoh, belum terhubung ke pesanan asli.</p>
      </section>
    </div>
  );
}
