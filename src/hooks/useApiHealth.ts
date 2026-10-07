// src/hooks/useApiHealth.ts
import { useState, useEffect } from 'react';

export type ApiStatus = 'online' | 'offline' | 'checking';

export function useApiHealth(): ApiStatus {
  const [status, setStatus] = useState<ApiStatus>('checking');

  useEffect(() => {
    let cancelled = false;

    const checkHealth = async () => {
      try {
        // Agora aponta para o nosso endpoint de health local que testa o WordPress
        const response = await fetch('/api/health', {
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