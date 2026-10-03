// src/hooks/useApiHealth.ts
import { useState, useEffect } from 'react';

export type ApiStatus = 'online' | 'offline' | 'checking';

export function useApiHealth(): ApiStatus {
  const [status, setStatus] = useState<ApiStatus>('checking');

  useEffect(() => {
    let cancelled = false;

    const checkHealth = async () => {
      try {
        // Usa o endpoint de health check do Apps Script (doGet)
        // Se preferir, pode usar '/api/servicos' com query param
        const response = await fetch('/api/servicos?health=1', {
          method: 'GET',
          cache: 'no-store',
          headers: { 'Accept': 'application/json' },
        });

        if (!cancelled) {
          setStatus(response.ok ? 'online' : 'offline');
        }
      } catch {
        if (!cancelled) {
          setStatus('offline');
        }
      }
    };

    checkHealth();

    // Re-verifica a cada 30 segundos
    const interval = setInterval(() => {
      if (!cancelled) checkHealth();
    }, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return status;
}