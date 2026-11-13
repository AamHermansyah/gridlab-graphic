"use client";

import { Suspense } from "react";
import { getBike } from "@/data/bikes";
import { BIKE_SCALE, STAND } from "@/lib/sceneConstants";
import { useConfigStore } from "@/store/useConfigStore";
import { BikeModel } from "./BikeModel";

/**
 * Motor terpilih berdiri di jalur servis bengkel, menghadap rolling door (+X).
 * Titik asal motor = tengah jarak sumbu roda, roda menapak di y = 0.
 */
export function BikeStage() {
  const bike = getBike(useConfigStore((s) => s.bikeId));

  return (
    <group position={[0, STAND.top, 0]} scale={BIKE_SCALE}>
      {/* Suspense sendiri: saat motor diganti, bengkel tetap tampil selama model dimuat */}
      <Suspense fallback={null}>
        <BikeModel key={bike.id} bike={bike} />
      </Suspense>
    </group>
  );
}
