// src/lib/config-cache.ts
export const CONFIG_CACHE_KEY = "@TrackApp:config";
export const CONFIG_UPDATED_EVENT = "trackapp:config-updated";

// ✅ Versão do cache: incrementada a cada invalidação. Leitores guardam a
// versão junto com os dados; se a versão mudou, o dado em memória é descartado.
// Funciona inclusive entre abas (a versão fica no localStorage).
const CONFIG_CACHE_VERSION_KEY = "@TrackApp:config-version";

function getVersion(): number {
  try {
    return Number(localStorage.getItem(CONFIG_CACHE_VERSION_KEY) ?? "0") || 0;
  } catch {
    return 0;
  }
}

export function getConfigCacheVersion(): number {
  return getVersion();
}

/** Limpa o cache de config e avisa todos os listeners (mesma aba e outras abas) */
export function invalidateConfigCache() {
  try {
    const nextVersion = String(getVersion() + 1);
    localStorage.setItem(CONFIG_CACHE_VERSION_KEY, nextVersion);
    localStorage.removeItem(CONFIG_CACHE_KEY);
    // Dispara evento global (mesma aba)
    window.dispatchEvent(new Event(CONFIG_UPDATED_EVENT));
  } catch {
    // SSR safety
  }
}

// ✅ Outras abas recebem "storage" automaticamente quando a chave muda.
// Basta o leitor registrar este helper para reagir à invalidação.
export function onConfigUpdated(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener(CONFIG_UPDATED_EVENT, handler);
  window.addEventListener("storage", handler); // cross-tab
  return () => {
    window.removeEventListener(CONFIG_UPDATED_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
