import { create } from "zustand";
import { MOCK_ORDERS } from "@/data/mockOrders";
import type { Account, AccountView, OrderRecord } from "@/types/account";

// State akun: siapa yang masuk, overlay akun (masuk dengan Google / riwayat), dan daftar pesanan.
// MOCKUP: belum ada server, jadi semuanya hidup di memori dan kembali ke data contoh saat halaman dimuat ulang.

interface AccountState {
  account: Account | null;
  open: boolean;
  view: AccountView;
  orders: OrderRecord[];

  /** Buka overlay: riwayat jika sudah masuk, selain itu layar masuk. */
  openAccount: () => void;
  close: () => void;
  /** Masuk lalu menutup overlay; riwayat baru terbuka saat user menekan tombol akun. */
  login: (account: Account) => void;
  logout: () => void;
  /** Simulasi bayar: pesanan yang menunggu bayar langsung masuk tahap diproses. */
  payOrder: (id: string) => void;
  /** Membatalkan pesanan beserta alasannya; hanya berlaku selama belum dibayar. */
  cancelOrder: (id: string, alasan: string) => void;
}

function updateUnpaid(orders: OrderRecord[], id: string, changes: Partial<OrderRecord>): OrderRecord[] {
  return orders.map((o) => (o.id === id && o.status === "menunggu-bayar" ? { ...o, ...changes, batasBayar: undefined } : o));
}

export const useAccountStore = create<AccountState>((set) => ({
  account: null,
  open: false,
  view: "masuk",
  orders: [...MOCK_ORDERS],

  openAccount: () => set((s) => ({ open: true, view: s.account ? "riwayat" : "masuk" })),
  close: () => set({ open: false }),
  login: (account) => set({ account, open: false }),
  logout: () => set({ account: null, view: "masuk" }),
  payOrder: (id) => set((s) => ({ orders: updateUnpaid(s.orders, id, { status: "diproses" }) })),
  cancelOrder: (id, alasan) => set((s) => ({ orders: updateUnpaid(s.orders, id, { status: "batal", alasanBatal: alasan }) })),
}));
