// src/components/ui/AdvancedAddressSearch.tsx
"use client";
import { useState, useCallback } from "react";
import {
  Search,
  MapPin,
  Home,
  Building,
  AlertCircle,
} from "lucide-react";
import { Input } from "./Input";
import { Button } from "./Button";
import { addressService, EnderecoResponse } from "@/services/addressService";

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

type SearchType = "cep" | "address";

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
  const [error, setError] = useState<string | undefined>(undefined);
  const [showResults, setShowResults] = useState(false);

  const buscarPorCep = useCallback(async () => {
    if (cep.replace(/\D/g, "").length !== 8) {
      setError("Digite um CEP válido com 8 dígitos");
      return;
    }

    setLoading(true);
    setError(undefined);

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
    } catch {
      setError("Erro ao buscar CEP");
    } finally {
      setLoading(false);
    }
  }, [cep, onAddressSelect]);

  const buscarPorEndereco = useCallback(async () => {
    if (!uf || !city || !street) {
      setError("Preencha UF, Cidade e Rua para buscar");
      return;
    }

    setLoading(true);
    setError(undefined);

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
    } catch {
      setError("Erro ao buscar endereço");
    } finally {
      setLoading(false);
    }
  }, [uf, city, street]);

  const selecionarEndereco = useCallback(
    (endereco: EnderecoResponse) => {
      onAddressSelect({
        cep: endereco.cep,
        rua: endereco.street,
        bairro: endereco.neighborhood,
        cidade: endereco.city,
        estado: endereco.state,
      });
      setResults([]);
      setShowResults(false);
      setError(undefined);
    },
    [onAddressSelect],
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Abas (Tabs) */}
      <div className="flex gap-4 border-b border-border">
        <button
          type="button"
          onClick={() => setSearchType("cep")}
          className={`relative flex items-center gap-2 pb-2.5 text-[13px] font-medium tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/50 ${
            searchType === "cep"
              ? "text-text"
              : "text-text-muted hover:text-text"
          }`}
        >
          <Home size={14} /> Buscar por CEP
          {searchType === "cep" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-accent" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setSearchType("address")}
          className={`relative flex items-center gap-2 pb-2.5 text-[13px] font-medium tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/50 ${
            searchType === "address"
              ? "text-text"
              : "text-text-muted hover:text-text"
          }`}
        >
          <Building size={14} /> Buscar por Endereço
          {searchType === "address" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-accent" />
          )}
        </button>
      </div>

      {/* Área do Formulário */}
      <div className="rounded-lg border border-border bg-bg-muted/30 p-4">
        {searchType === "cep" && (
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end">
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
              className="w-full flex-1"
            />
            <Button
              type="button"
              onClick={buscarPorCep}
              disabled={loading}
              icon={loading ? undefined : Search}
              isLoading={loading}
              className="mb-5 w-full sm:w-auto"
            >
              {loading ? "" : "Buscar"}
            </Button>
          </div>
        )}

        {searchType === "address" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input
                label="UF"
                placeholder="SP"
                maxLength={2}
                value={uf}
                onChange={(e) =>
                  setUf(e.target.value.toUpperCase().slice(0, 2))
                }
              />
              <div className="sm:col-span-2">
                <Input
                  label="Cidade"
                  placeholder="São Paulo"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col items-end gap-3 sm:flex-row">
              <Input
                label="Rua / Logradouro"
                placeholder="Ex: Av. Paulista"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && buscarPorEndereco()}
                className="w-full flex-1"
              />
              <Button
                type="button"
                onClick={buscarPorEndereco}
                disabled={loading}
                icon={loading ? undefined : Search}
                isLoading={loading}
                className="w-full sm:w-auto"
              >
                {loading ? "" : "Buscar"}
              </Button>
            </div>
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-sm font-medium text-rose-600 dark:text-rose-400">
                <AlertCircle size={16} /> {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Resultados da Busca (Endereços) */}
      {showResults && results.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border shadow-sm">
          <div className="border-b border-border bg-bg-muted/40 px-4 py-2.5">
            <p className="text-sm font-semibold text-text">
              {results.length} endereço(s) encontrado(s)
            </p>
          </div>
          <div className="no-scrollbar max-h-64 overflow-y-auto">
            {results.map((result, index) => (
              <button
                key={index}
                type="button"
                onClick={() => selecionarEndereco(result)}
                className="group w-full border-b border-border px-4 py-3 text-left transition-colors last:border-0 hover:bg-bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-text/50"
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center rounded-md border border-border bg-bg-elevated p-1.5 transition-colors group-hover:bg-bg-muted">
                    <MapPin
                      size={16}
                      className="text-text-muted transition-colors group-hover:text-text"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text">
                      {result.street}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-text-muted">
                      {result.neighborhood} - {result.city}/{result.state}
                    </p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
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
