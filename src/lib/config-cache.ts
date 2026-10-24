// src/lib/config-cache.ts
export const CONFIG_CACHE_KEY = "@AgendaApp:config";
export const CONFIG_UPDATED_EVENT = "agendaapp:config-updated";
const CONFIG_CACHE_VERSION_KEY = "@AgendaApp:config-version";

/** Após esse tempo o cache é considerado "velho" e é revalidado na API */
export const CONFIG_TTL_MS = 5 * 60 * 1000;
/** Intervalo de checagem periódica na API (aba visível) */
export const CONFIG_POLL_MS = 60 * 1000;
/** Evita revalidar em rajada (focus + visibilitychange) */
const MIN_REVALIDATE_MS = 15 * 1000;

const isBrowser = () => typeof window !== "undefined";

// ─── Versão (invalidação manual, inclusive entre abas) ─────────────────────
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

// ─── Hash para detectar mudança real nos dados da API ──────────────────────
function hashOf(value: unknown): string {
  const str = JSON.stringify(value) ?? "";
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  }
  return `${h}:${str.length}`;
}

// ─── Leitura / escrita ─────────────────────────────────────────────────────
interface CacheEntry<T> {
  data: T;
  hash: string;
  savedAt: number;
  version: number;
}

export interface CachedConfig<T> {
  data: T;
  hash: string;
  savedAt: number;
  /** true quando passou do TTL (ainda utilizável, mas deve ser revalidado) */
  stale: boolean;
}

export function readConfigCache<T>(
  ttl: number = CONFIG_TTL_MS,
): CachedConfig<T> | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(CONFIG_CACHE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (entry.version !== getVersion()) return null; // invalidado
    return {
      data: entry.data,
      hash: entry.hash,
      savedAt: entry.savedAt,
      stale: Date.now() - entry.savedAt > ttl,
    };
  } catch {
    return null;
  }
}

/** Salva no cache. Retorna true (e avisa os listeners) só se os dados mudaram. */
export function writeConfigCache<T>(data: T): boolean {
  if (!isBrowser()) return false;
  const hash = hashOf(data);
  const prev = readConfigCache<T>();
  const entry: CacheEntry<T> = {
    data,
    hash,
    savedAt: Date.now(),
    version: getVersion(),
  };
  try {
    localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(entry));
  } catch {
    return false; // quota cheia / modo privado
  }
  const changed = prev?.hash !== hash;
  if (changed) window.dispatchEvent(new Event(CONFIG_UPDATED_EVENT));
  return changed;
}

// ─── Busca com deduplicação ────────────────────────────────────────────────
let inflight: Promise<unknown> | null = null;

/**
 * Retorna a config. Usa o cache se ainda estiver fresco; caso contrário (ou com
 * `force`) busca na API. Se a API falhar, devolve o cache velho como fallback.
 */
export async function loadConfig<T>(
  fetcher: () => Promise<T>,
  opts: { force?: boolean; ttl?: number } = {},
): Promise<T> {
  const { force = false, ttl = CONFIG_TTL_MS } = opts;

  const cached = readConfigCache<T>(ttl);
  if (!force && cached && !cached.stale) return cached.data;
  if (inflight) return inflight as Promise<T>;

  const startVersion = getVersion();

  const p: Promise<T> = (async () => {
    try {
      const data = await fetcher();
      // Foi invalidado durante a requisição → o dado pode estar velho, busca de novo
      if (getVersion() !== startVersion) {
        inflight = null;
        return loadConfig(fetcher, { force: true, ttl });
      }
      writeConfigCache(data);
      return data;
    } catch (err) {
      if (cached) return cached.data;
      throw err;
    }
  })().finally(() => {
    if (inflight === p) inflight = null;
  });

  inflight = p;
  return p;
}

/** Força uma busca na API, ignorando o TTL */
export const refreshConfig = <T>(fetcher: () => Promise<T>) =>
  loadConfig(fetcher, { force: true });

// ─── Invalidação ───────────────────────────────────────────────────────────
/** Limpa o cache de config e avisa todos os listeners (mesma aba e outras abas) */
export function invalidateConfigCache() {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(CONFIG_CACHE_VERSION_KEY, String(getVersion() + 1));
    localStorage.removeItem(CONFIG_CACHE_KEY);
  } catch {
    // storage indisponível
  }
  inflight = null;
  window.dispatchEvent(new Event(CONFIG_UPDATED_EVENT));
}

// ─── Eventos ───────────────────────────────────────────────────────────────
/** Dispara quando a config muda ou é invalidada (mesma aba + outras abas) */
export function onConfigUpdated(callback: () => void): () => void {
  if (!isBrowser()) return () => {};

  const onLocal = () => callback();
  const onStorage = (e: StorageEvent) => {
    // e.key === null → localStorage.clear()
    if (
      e.key === null ||
      e.key === CONFIG_CACHE_KEY ||
      e.key === CONFIG_CACHE_VERSION_KEY
    )
      callback();
  };

  window.addEventListener(CONFIG_UPDATED_EVENT, onLocal);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CONFIG_UPDATED_EVENT, onLocal);
    window.removeEventListener("storage", onStorage);
  };
}

// ─── Assinatura (stale-while-revalidate + detecção de mudanças da API) ────
export interface SubscribeConfigOptions {
  ttl?: number;
  /** Intervalo de checagem na API em ms; `false` desativa o polling */
  pollMs?: number | false;
  onError?: (error: unknown) => void;
}

/**
 * 1. Entrega o cache na hora (se existir)
 * 2. Revalida na API se estiver velho/ausente
 * 3. Continua checando: polling, volta o foco, volta a conexão,
 *    invalidação local ou de outra aba
 * `onData` só é chamado quando os dados realmente mudam.
 */
export function subscribeConfig<T>(
  fetcher: () => Promise<T>,
  onData: (data: T) => void,
  opts: SubscribeConfigOptions = {},
): () => void {
  if (!isBrowser()) return () => {};

  const { ttl = CONFIG_TTL_MS, pollMs = CONFIG_POLL_MS, onError } = opts;

  let active = true;
  let lastHash: string | null = null;
  let lastCheck = 0;

  const emit = (data: T) => {
    if (!active) return;
    const h = hashOf(data);
    if (h === lastHash) return;
    lastHash = h;
    onData(data);
  };

  const revalidate = async (force: boolean) => {
    lastCheck = Date.now();
    try {
      emit(await loadConfig(fetcher, { force, ttl }));
    } catch (err) {
      if (active) onError?.(err);
    }
  };

  // Cache mudou/foi invalidado (aqui ou em outra aba)
  const syncFromCache = () => {
    const cached = readConfigCache<T>(ttl);
    if (cached) emit(cached.data);
    else revalidate(true); // invalidado → busca na API
  };

  const onFocus = () => {
    if (Date.now() - lastCheck > MIN_REVALIDATE_MS) revalidate(true);
  };
  const onVisibility = () => {
    if (document.visibilityState === "visible") onFocus();
  };
  const onOnline = () => revalidate(true);

  // Início
  const initial = readConfigCache<T>(ttl);
  if (initial) emit(initial.data);
  revalidate(false);

  const offUpdated = onConfigUpdated(syncFromCache);
  window.addEventListener("focus", onFocus);
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("online", onOnline);

  const timer =
    pollMs === false
      ? null
      : setInterval(() => {
          if (document.visibilityState === "visible") revalidate(true);
        }, pollMs);

  return () => {
    active = false;
    offUpdated();
    window.removeEventListener("focus", onFocus);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("online", onOnline);
    if (timer) clearInterval(timer);
  };
}