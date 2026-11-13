"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, type ReactNode } from "react";
import { MathUtils, type Group } from "three";
import { useSceneStore } from "@/store/useSceneStore";

/** Kecepatan rotasi 360° (radian per detik): satu putaran penuh sekitar 80 detik. */
const SPIN_SPEED = 0.08;
const TWO_PI = Math.PI * 2;

/**
 * Memutar seluruh isinya (bengkel, lampu, dan motor) pelan-pelan mengelilingi
 * sumbu tegak di tengah motor. Karena lampu ikut berputar, hasilnya terlihat
 * seperti kamera yang mengitari bengkel.
 */
export function SpinGroup({ children }: { children: ReactNode }) {
  const group = useRef<Group>(null);
  const mode = useSceneStore((s) => s.spinMode);
  const invalidate = useThree((s) => s.invalidate);

  // Canvas memakai frameloop "demand": minta frame baru saat mode berubah.
  useEffect(() => {
    invalidate();
  }, [mode, invalidate]);

  useFrame((state, delta) => {
    const world = group.current;
    if (!world || mode === "hold") return;
    const dt = Math.min(delta, 0.1); // frame pertama setelah diam bisa punya delta besar

    if (mode === "spin") {
      world.rotation.y = (world.rotation.y + SPIN_SPEED * dt) % TWO_PI;
      state.invalidate();
      return;
    }

    // mode "home": kembali ke sudut 0 lewat jalur terpendek
    const angle = Math.atan2(Math.sin(world.rotation.y), Math.cos(world.rotation.y));
    if (Math.abs(angle) < 0.001) {
      world.rotation.y = 0;
      return;
    }
    world.rotation.y = MathUtils.damp(angle, 0, 5, dt);
    state.invalidate();
  });

  return <group ref={group}>{children}</group>;
}
