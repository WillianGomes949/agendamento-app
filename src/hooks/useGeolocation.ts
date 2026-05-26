// src/hooks/useGeolocation.ts
import { useState, useCallback } from 'react';

interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export function useGeolocation() {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getLocation = useCallback((): Promise<Location> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const errorMsg = "Geolocalização não suportada pelo navegador";
        setError(errorMsg);
        reject(new Error(errorMsg));
        return;
      }

      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setLocation(loc);
          setLoading(false);
          resolve(loc);
        },
        (err) => {
          let errorMsg = "";
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMsg = "Permissão de localização negada";
              break;
            case err.POSITION_UNAVAILABLE:
              errorMsg = "Localização indisponível";
              break;
            case err.TIMEOUT:
              errorMsg = "Tempo limite excedido";
              break;
            default:
              errorMsg = "Erro ao obter localização";
          }
          setError(errorMsg);
          setLoading(false);
          reject(new Error(errorMsg));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  return { location, loading, error, getLocation };
}