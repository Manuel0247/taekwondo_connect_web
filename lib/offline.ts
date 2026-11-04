// Équivalent web de src/utils/offlineStorage.ts.
// Le mobile copie les techniques et illustrations sur le téléphone. Dans le navigateur,
// on conserve le catalogue dans localStorage et on précharge les illustrations dans le
// cache HTTP ; la liste reste consultable si l'API est injoignable.
import type { Technique } from "./types";

const KEY_DATA = "lcc_web_offline_techniques";
const KEY_SYNC = "lcc_web_offline_sync";

export function saveTechniques(list: Technique[]) {
  localStorage.setItem(KEY_DATA, JSON.stringify(list));
  localStorage.setItem(KEY_SYNC, new Date().toISOString());
}

export function loadTechniques(): Technique[] | null {
  try {
    const raw = localStorage.getItem(KEY_DATA);
    return raw ? (JSON.parse(raw) as Technique[]) : null;
  } catch {
    return null;
  }
}

export function getLastSync(): Date | null {
  try {
    const iso = localStorage.getItem(KEY_SYNC);
    return iso ? new Date(iso) : null;
  } catch {
    return null;
  }
}

export function clearOffline() {
  localStorage.removeItem(KEY_DATA);
  localStorage.removeItem(KEY_SYNC);
}

/** Précharge une image dans le cache du navigateur */
export function warmImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve(); // on continue même si une image échoue
    img.src = url;
  });
}
