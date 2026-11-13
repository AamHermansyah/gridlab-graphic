// Efek suara HUD, disintesis langsung dengan Web Audio API (tanpa file audio).
// AudioContext baru dibuat saat klik pertama, sesuai aturan autoplay browser.

export type UiSoundKind = "tap" | "select" | "toggle";

const UI_SOUND_KINDS: readonly string[] = ["tap", "select", "toggle"];

export function isUiSoundKind(value: string | undefined): value is UiSoundKind {
  return value !== undefined && UI_SOUND_KINDS.includes(value);
}

const MASTER_VOLUME = 0.5;

let context: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!context) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
    master = context.createGain();
    master.gain.value = MASTER_VOLUME;
    master.connect(context.destination);
  }
  if (context.state === "suspended") void context.resume();
  return context;
}

/** Nada pendek dengan frekuensi yang meluncur dari `from` ke `to`. */
function blip(
  ctx: AudioContext,
  out: AudioNode,
  opts: { type: OscillatorType; from: number; to: number; start: number; duration: number; volume: number },
) {
  const t0 = ctx.currentTime + opts.start;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = opts.type;
  osc.frequency.setValueAtTime(opts.from, t0);
  osc.frequency.exponentialRampToValueAtTime(opts.to, t0 + opts.duration);
  // Serangan cepat lalu meluruh: terdengar tegas, tidak "klik" kasar
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(opts.volume, t0 + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.duration);
  osc.connect(gain).connect(out);
  osc.start(t0);
  osc.stop(t0 + opts.duration + 0.02);
}

/** Derau pendek berfrekuensi tinggi: memberi kesan "tik" mekanis. */
function tick(ctx: AudioContext, out: AudioNode, volume: number) {
  if (!noiseBuffer) {
    const length = Math.floor(ctx.sampleRate * 0.05);
    noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  }
  const t0 = ctx.currentTime;
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  source.buffer = noiseBuffer;
  filter.type = "highpass";
  filter.frequency.value = 3200;
  gain.gain.setValueAtTime(volume, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.035);
  source.connect(filter).connect(gain).connect(out);
  source.start(t0);
  source.stop(t0 + 0.05);
}

/**
 * Memainkan efek suara HUD.
 * - "tap": tombol biasa (mis. sudut kamera), blip naik singkat
 * - "select": memilih menu/kategori, dua nada naik
 * - "toggle": sakelar hidup/mati, nada turun
 */
export function playUiSound(kind: UiSoundKind = "tap"): void {
  const ctx = getContext();
  if (!ctx || !master) return;

  switch (kind) {
    case "tap":
      tick(ctx, master, 0.18);
      blip(ctx, master, { type: "triangle", from: 620, to: 1040, start: 0, duration: 0.09, volume: 0.22 });
      break;
    case "select":
      tick(ctx, master, 0.2);
      blip(ctx, master, { type: "triangle", from: 520, to: 560, start: 0, duration: 0.07, volume: 0.24 });
      blip(ctx, master, { type: "triangle", from: 880, to: 1180, start: 0.055, duration: 0.12, volume: 0.24 });
      blip(ctx, master, { type: "sine", from: 180, to: 90, start: 0, duration: 0.1, volume: 0.3 });
      break;
    case "toggle":
      tick(ctx, master, 0.16);
      blip(ctx, master, { type: "square", from: 540, to: 320, start: 0, duration: 0.1, volume: 0.1 });
      break;
  }
}
