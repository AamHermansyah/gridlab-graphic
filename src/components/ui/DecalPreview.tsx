"use client";

import { useEffect, useRef } from "react";
import { drawDecal } from "@/lib/decalTextures";
import type { DecalDesignId } from "@/types/catalog";

/** Pratinjau kecil sebuah desain decal dalam satu warna (kiri = belakang motor, kanan = depan). */
export function DecalPreview({ design, color, className = "w-full" }: { design: DecalDesignId; color: string; className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (ctx) drawDecal(ctx, design, color);
  }, [design, color]);

  return <canvas ref={canvas} width={384} height={192} className={`aspect-2/1 bg-ink-700 ${className}`} aria-hidden="true" />;
}
