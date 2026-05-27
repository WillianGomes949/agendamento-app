// src/components/ui/AdvancedAddressSearch.tsx
"use client";

import { useState, useCallback } from "react";
import {
  Search,
  MapPin,
  Home,
  Building,
  Loader2,
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
    } catch (err) {
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
    } catch (err) {
      setError("Erro ao buscar endereço");
    } finally {
      setLoading(false);
    }
  }, [uf, city, street]);

  const selecionarEndereco = useCallback((endereco: EnderecoResponse) => {
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
  }, [onAddressSelect]);

  return (
    <div className={`space-y-5 ${className}`}>
      {/* Abas (Tabs) Modernas */}
      <div className="flex gap-4 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setSearchType("cep")}
          className={`pb-3 text-sm font-semibold transition-all relative flex items-center gap-2 ${
            searchType === "cep"
              ? "text-slate-900"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Home size={14} /> Buscar por CEP
          {searchType === "cep" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-t-full" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setSearchType("address")}
          className={`pb-3 text-sm font-semibold transition-all relative flex items-center gap-2 ${
            searchType === "address"
              ? "text-slate-900"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Building size={14} /> Buscar por Endereço
          {searchType === "address" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-t-full" />
          )}
        </button>
      </div>

      {/* Área do Formulário */}
      <div className="bg-slate-50/50 border border-slate-200/60 p-5 rounded-2xl">
        {searchType === "cep" && (
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
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
              className="flex-1 w-full"
            />
            <Button
              type="button"
              onClick={buscarPorCep}
              disabled={loading}
              className="w-full sm:w-auto mb-5"
            >
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
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <Input
                label="Rua / Logradouro"
                placeholder="Ex: Av. Paulista"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && buscarPorEndereco()}
                className="flex-1 w-full"
              />
              <Button
                type="button"
                onClick={buscarPorEndereco}
                disabled={loading}
                className="w-full sm:w-auto"
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
              <div className="flex items-center gap-2 text-sm font-medium text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
                <AlertCircle size={16} /> {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Resultados da Busca (Endereços) */}
      {showResults && results.length > 0 && (
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
            <p className="text-sm font-bold text-slate-700">
              {results.length} endereço(s) encontrado(s)
            </p>
          </div>
          <div className="max-h-64 overflow-y-auto scrollbar-thin">
            {results.map((result, index) => (
              <button
                key={index}
                type="button"
                onClick={() => selecionarEndereco(result)}
                className="w-full text-left px-5 py-3.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                    <MapPin
                      size={16}
                      className="text-slate-500 group-hover:text-slate-700"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {result.street}
                    </p>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">
                      {result.neighborhood} - {result.city}/{result.state}
                    </p>
                    <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
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