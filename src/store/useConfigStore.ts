import { create } from "zustand";
import { DEFAULT_BIKE_ID, getBike } from "@/data/bikes";
import { DECAL_DESIGNS, DECAL_MATERIALS, FLOW_STEPS, SHIPPING_OPTIONS, findOption } from "@/data/catalog";
import type { BikeId, DecalDesignId, DecalMaterialId, FlowStep, ForkId, HeadStyleId, OrderForm, PlateBrandId, SwingarmId, TireId } from "@/types/catalog";

// State konfigurasi: tahap alur, motor terpilih, pilihan user, dan data pesanan.

function defaultBodyColors(bikeId: BikeId): Record<string, string> {
  return Object.fromEntries(getBike(bikeId).bodyParts.map((p) => [p.id, p.warnaBawaan]));
}

const EMPTY_ORDER: OrderForm = {
  nama: "",
  whatsapp: "",
  email: "",
  alamat: "",
  kota: "",
  provinsi: "",
  kodePos: "",
  catatan: "",
  pengiriman: "reguler",
  pembayaran: "transfer",
};

interface ConfigState {
  step: FlowStep;
  /** Indeks tahap terjauh yang sudah dibuka (tahap berikutnya terkunci). */
  maxStepIndex: number;
  bikeId: BikeId;
  /** Warna tiap bagian bodi: id bagian -> id warna. */
  bodyColors: Record<string, string>;
  tire: TireId;
  /** Tipe garpu/shockbreaker depan (USD atau tele). */
  fork: ForkId;
  /** Gaya kepala depan; papan nomor memakai merek di plateBrand. */
  headStyle: HeadStyleId;
  plateBrand: PlateBrandId;
  swingarm: SwingarmId;
  /** Desain decal terpilih; null = belum memilih (pesanan wajib punya decal). */
  decalDesign: DecalDesignId | null;
  decalColor: string;
  decalMaterial: DecalMaterialId;
  order: OrderForm;
  /** true setelah data pesanan lolos validasi dan tombol "Buat Pesanan" ditekan. */
  orderPlaced: boolean;

  goToStep: (step: FlowStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  selectBike: (id: BikeId) => void;
  setBodyColor: (partId: string, colorId: string) => void;
  setAllBodyColors: (colorId: string) => void;
  resetBodyColors: () => void;
  setTire: (id: TireId) => void;
  setFork: (id: ForkId) => void;
  setHeadStyle: (id: HeadStyleId) => void;
  setPlateBrand: (id: PlateBrandId) => void;
  setSwingarm: (id: SwingarmId) => void;
  setDecalDesign: (id: DecalDesignId) => void;
  setDecalColor: (id: string) => void;
  setDecalMaterial: (id: DecalMaterialId) => void;
  setOrderField: <K extends keyof OrderForm>(field: K, value: OrderForm[K]) => void;
  setOrderPlaced: (placed: boolean) => void;
}

const stepIndex = (step: FlowStep) => FLOW_STEPS.findIndex((s) => s.id === step);

/** Tahap berikutnya hanya boleh dibuka jika syarat tahap sekarang terpenuhi. */
export function canAdvance(state: Pick<ConfigState, "step" | "decalDesign">): boolean {
  // Tidak ada pesanan tanpa decal: tahap pesan terkunci sampai desain dipilih.
  return state.step !== "decal" || state.decalDesign !== null;
}

export const useConfigStore = create<ConfigState>((set) => ({
  step: "motor",
  maxStepIndex: 0,
  bikeId: DEFAULT_BIKE_ID,
  bodyColors: defaultBodyColors(DEFAULT_BIKE_ID),
  tire: "biasa",
  fork: "usd",
  headStyle: "headlamp",
  plateBrand: "rmz",
  swingarm: "standar",
  decalDesign: null,
  decalColor: "putih",
  decalMaterial: "glossy",
  order: EMPTY_ORDER,
  orderPlaced: false,

  // Tahap hanya bisa dibuka berurutan: lompat ke depan harus lewat nextStep.
  goToStep: (step) => set((s) => (stepIndex(step) <= s.maxStepIndex ? { step } : s)),
  nextStep: () =>
    set((s) => {
      if (!canAdvance(s)) return s;
      const next = Math.min(stepIndex(s.step) + 1, FLOW_STEPS.length - 1);
      return { step: FLOW_STEPS[next].id, maxStepIndex: Math.max(s.maxStepIndex, next) };
    }),
  prevStep: () => set((s) => ({ step: FLOW_STEPS[Math.max(stepIndex(s.step) - 1, 0)].id })),

  // Ganti motor: warna bodi kembali ke bawaan motor itu (bagiannya berbeda).
  selectBike: (id) => set((s) => (s.bikeId === id ? s : { bikeId: id, bodyColors: defaultBodyColors(id) })),

  setBodyColor: (partId, colorId) => set((s) => ({ bodyColors: { ...s.bodyColors, [partId]: colorId } })),
  setAllBodyColors: (colorId) =>
    set((s) => ({ bodyColors: Object.fromEntries(Object.keys(s.bodyColors).map((k) => [k, colorId])) })),
  resetBodyColors: () => set((s) => ({ bodyColors: defaultBodyColors(s.bikeId) })),
  setTire: (id) => set({ tire: id }),
  setFork: (id) => set({ fork: id }),
  setHeadStyle: (id) => set({ headStyle: id }),
  setPlateBrand: (id) => set({ plateBrand: id }),
  setSwingarm: (id) => set({ swingarm: id }),
  setDecalDesign: (id) => set({ decalDesign: id }),
  setDecalColor: (id) => set({ decalColor: id }),
  setDecalMaterial: (id) => set({ decalMaterial: id }),
  // Mengubah data pesanan membatalkan status "sudah dipesan".
  setOrderField: (field, value) => set((s) => ({ order: { ...s.order, [field]: value }, orderPlaced: false })),
  setOrderPlaced: (placed) => set({ orderPlaced: placed }),
}));

/** Harga decal: desain + tambahan bahan. 0 jika desain belum dipilih. */
export function selectDecalPrice(state: Pick<ConfigState, "decalDesign" | "decalMaterial">): number {
  if (!state.decalDesign) return 0;
  return findOption(DECAL_DESIGNS, state.decalDesign).harga + findOption(DECAL_MATERIALS, state.decalMaterial).harga;
}

/** Total pembayaran: harga decal + ongkos kirim. */
export function selectOrderTotal(state: Pick<ConfigState, "decalDesign" | "decalMaterial" | "order">): number {
  return selectDecalPrice(state) + findOption(SHIPPING_OPTIONS, state.order.pengiriman).harga;
}
