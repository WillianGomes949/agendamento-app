// src/components/ui/CepSearch.tsx
"use client";

import { useState, useCallback } from "react";
import { Input } from "./Input";
import { Button } from "./Button";
import { Spinner } from "./Spinner";
import { Check } from "lucide-react";

interface EnderecoData {
  cep: string;
  street: string;
  city: string;
  neighborhood: string;
  state: string;
}

interface CepSearchProps {
  onEnderecoFound: (data: {
    rua: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  }) => void;
  onError?: (error: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function CepSearch({
  onEnderecoFound,
  onError,
  isLoading = false,
  className = "",
}: CepSearchProps) {
  const [cep, setCep] = useState("");
  const [searching, setSearching] = useState(false);
  const [localError, setLocalError] = useState("");
  const [success, setSuccess] = useState(false);

  const buscarCep = useCallback(async () => {
    const cepLimpo = cep.replace(/\D/g, "");

    if (cepLimpo.length !== 8) {
      setLocalError("CEP deve conter 8 dígitos");
      onError?.("CEP deve conter 8 dígitos");
      return;
    }

    setSearching(true);
    setLocalError("");
    setSuccess(false);

    try {
      const response = await fetch(
        `https://brasilapi.com.br/api/cep/v1/${cepLimpo}`,
      );

      if (!response.ok)
        throw new Error(
          response.status === 404 ? "CEP não encontrado" : "Erro ao buscar CEP",
        );

      const data: EnderecoData = await response.json();

      onEnderecoFound({
        cep: data.cep,
        rua: data.street || "",
        bairro: data.neighborhood || "",
        cidade: data.city || "",
        estado: data.state || "",
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao buscar CEP";
      setLocalError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setSearching(false);
    }
  }, [cep, onEnderecoFound, onError]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      buscarCep();
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end bg-slate-50/50 border border-slate-200/60 p-4 rounded-2xl">
        <div className="flex-1 w-full">
          <Input
            label="Buscar por CEP"
            helperText="Digite o CEP para preencher os dados"
            placeholder="00000000"
            value={cep}
            onChange={(e) => {
              setCep(e.target.value.replace(/\D/g, "").slice(0, 8));
              setLocalError("");
              setSuccess(false);
            }}
            onKeyPress={handleKeyPress}
            error={localError}
            disabled={searching || isLoading}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={buscarCep}
          disabled={
            searching || isLoading || cep.replace(/\D/g, "").length !== 8
          }
          className="w-full sm:w-auto h-10 mb-5" // Compensa o helperText no desktop
        >
          {searching ? <Spinner size="sm" variant="slate" /> : "Buscar"}
        </Button>
      </div>

      {success && (
        <div className="text-sm font-medium text-emerald-700 bg-emerald-50 p-3 rounded-xl flex items-center gap-2 border border-emerald-100 shadow-sm">
          <Check className="w-4 h-4" />
          Endereço preenchido! Lembre-se de adicionar o número.
        </div>
      )}
    </div>
  );
}
