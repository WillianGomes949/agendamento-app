// src/lib/config-cache.ts
export const CONFIG_CACHE_KEY = "@TrackApp:config";
export const CONFIG_UPDATED_EVENT = "trackapp:config-updated";

/** Limpa o cache de config e avisa todos os listeners */
export function invalidateConfigCache() {
  try {
    localStorage.removeItem(CONFIG_CACHE_KEY);
    // Dispara evento global (mesma aba)
    window.dispatchEvent(new Event(CONFIG_UPDATED_EVENT));
  } catch {
    // SSR safety
  }
}