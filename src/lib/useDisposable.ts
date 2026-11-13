import { useEffect, useState } from "react";

/**
 * Membuat resource Three.js (tekstur, geometri) satu kali per komponen dan
 * membuangnya dari GPU saat komponen dilepas.
 */
export function useDisposable<T extends { dispose: () => void }>(factory: () => T): T {
  const [resource] = useState(factory);
  useEffect(() => () => resource.dispose(), [resource]);
  return resource;
}
