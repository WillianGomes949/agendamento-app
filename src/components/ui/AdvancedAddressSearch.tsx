// src/components/ui/AdvancedAddressSearch.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Search,
  MapPin,
  Home,
  Building,
  Navigation,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Input } from "./Input";
import { Button } from "./Button";
import { addressService, EnderecoResponse } from "@/services/addressService";
import { useGeolocation } from "@/hooks/useGeolocation";

interface AdvancedAddressSearchProps {
  onAddressSelect: (address: {
    cep: string;
    rua: string;
    bairro: string;
    cidade: string;
    estado: string;
  }) => void;
  className?: string;
}

type SearchType = "cep" | "address" | "geolocation";

export function AdvancedAddressSearch({
  onAddressSelect,
  className = "",
}: AdvancedAddressSearchProps) {
  const [searchType, setSearchType] = useState<SearchType>("cep");
  const [cep, setCep] = useState("");
  const [uf, setUf] = useState("");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [results, setResults] = useState<EnderecoResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const {
    location,
    loading: geoLoading,
    error: geoError,
    getLocation,
  } = useGeolocation();

  // Buscar por CEP
  const buscarPorCep = useCallback(async () => {
    if (cep.replace(/\D/g, "").length !== 8) {
      setError("Digite um CEP válido com 8 dígitos");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await addressService.buscarPorCep(cep);

      if (result) {
        onAddressSelect({
          cep: result.cep,
          rua: result.street,
          bairro: result.neighborhood,
          cidade: result.city,
          estado: result.state,
        });
        setResults([]);
        setShowResults(false);
      } else {
        setError("CEP não encontrado");
      }
    } catch (err) {
      setError("Erro ao buscar CEP");
    } finally {
      setLoading(false);
    }
  }, [cep, onAddressSelect]);

  // Buscar por endereço
  const buscarPorEndereco = useCallback(async () => {
    if (!uf || !city || !street) {
      setError("Preencha UF, Cidade e Rua para buscar");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const enderecos = await addressService.buscarPorEndereco({
        uf,
        city,
        street,
      });

      if (enderecos.length > 0) {
        setResults(enderecos);
        setShowResults(true);
      } else {
        setError("Nenhum endereço encontrado");
        setResults([]);
      }
    } catch (err) {
      setError("Erro ao buscar endereço");
    } finally {
      setLoading(false);
    }
  }, [uf, city, street]);

  // Buscar por geolocalização
  const buscarPorGeolocalizacao = useCallback(async () => {
    try {
      const position = await getLocation();
      setLoading(true);
      setError(null);

      const endereco = await addressService.buscarPorCoordenadas(
        position.latitude,
        position.longitude,
      );

      if (endereco) {
        onAddressSelect({
          cep: endereco.cep,
          rua: endereco.street,
          bairro: endereco.neighborhood,
          cidade: endereco.city,
          estado: endereco.state,
        });
      } else {
        setError("Não foi possível obter o endereço da sua localização");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao obter localização",
      );
    } finally {
      setLoading(false);
    }
  }, [getLocation, onAddressSelect]);

  // Selecionar resultado da busca
  const selecionarEndereco = (endereco: EnderecoResponse) => {
    onAddressSelect({
      cep: endereco.cep,
      rua: endereco.street,
      bairro: endereco.neighborhood,
      cidade: endereco.city,
      estado: endereco.state,
    });
    setShowResults(false);
    setResults([]);
  };

  // Efeito para geolocalização
  useEffect(() => {
    if (location && searchType === "geolocation") {
      buscarPorGeolocalizacao();
    }
  }, [location, searchType, buscarPorGeolocalizacao]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Tipo de Busca Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setSearchType("cep")}
          className={`px-4 py-2 text-sm font-medium transition-all relative ${
            searchType === "cep"
              ? "text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <Home size={16} />
            Buscar por CEP
          </div>
          {searchType === "cep" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setSearchType("address")}
          className={`px-4 py-2 text-sm font-medium transition-all relative ${
            searchType === "address"
              ? "text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <Building size={16} />
            Buscar por Endereço
          </div>
          {searchType === "address" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>
      </div>

      {/* Formulário de Busca */}
      <div className="space-y-4">
        {searchType === "cep" && (
          <div className="flex gap-2 bg-blue-100 p-4 rounded-lg justify-center items-center">
            <Input
              label="CEP"
              placeholder="00000000"
              value={cep}
              onChange={(e) =>
                setCep(e.target.value.replace(/\D/g, "").slice(0, 8))
              }
              onKeyPress={(e) => e.key === "Enter" && buscarPorCep()}
              helperText="Digite o CEP com 8 dígitos"
              error={error}
            />
            <Button type="button" onClick={buscarPorCep} disabled={loading}>
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Search size={16} />
              )}
              Buscar
            </Button>
          </div>
        )}

        {searchType === "address" && (
          <div className="space-y-3 bg-blue-100 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="UF"
                placeholder="SP"
                maxLength={2}
                value={uf}
                onChange={(e) =>
                  setUf(e.target.value.toUpperCase().slice(0, 2))
                }
                helperText="Sigla do estado"
              />
              <Input
                label="Cidade"
                placeholder="São Paulo"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Input
                label="Rua / Logradouro"
                placeholder="Av. Paulista"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && buscarPorEndereco()}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={buscarPorEndereco}
                disabled={loading}
                className="self-end"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Search size={16} />
                )}
                Buscar
              </Button>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
          </div>
        )}

        {searchType === "geolocation" && (
          <div className="text-center py-4">
            <Button
              type="button"
              onClick={buscarPorGeolocalizacao}
              disabled={loading || geoLoading}
              variant="secondary"
              className="w-full"
            >
              {loading || geoLoading ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : (
                <Navigation size={16} className="mr-2" />
              )}
              Usar minha localização atual
            </Button>
            {(error || geoError) && (
              <p className="text-sm text-red-600 mt-2">{error || geoError}</p>
            )}
          </div>
        )}
      </div>

      {/* Resultados da Busca */}
      {showResults && results.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-700">
              {results.length} endereço(s) encontrado(s)
            </p>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {results.map((result, index) => (
              <button
                key={index}
                type="button"
                onClick={() => selecionarEndereco(result)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
              >
                <div className="flex items-start gap-3">
                  <MapPin
                    size={18}
                    className="text-gray-400 flex-shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {result.street}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {result.neighborhood} - {result.city}/{result.state}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      CEP: {result.cep}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
