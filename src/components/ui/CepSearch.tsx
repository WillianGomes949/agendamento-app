// src/components/ui/CepSearch.tsx
"use client";
import { useState, useCallback } from "react";
import { Input } from "./Input";
import { Button } from "./Button";
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
      <div className="flex flex-col items-start gap-3 rounded-lg border border-border bg-bg-muted/30 p-4 sm:flex-row sm:items-end">
        <div className="w-full flex-1">
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
          isLoading={searching}
          className="mb-5 h-10 w-full sm:w-auto"
        >
          {searching ? "" : "Buscar"}
        </Button>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          <Check className="h-4 w-4" />
          Endereço preenchido! Lembre-se de adicionar o número.
        </div>
      )}
    </div>
  );
}
