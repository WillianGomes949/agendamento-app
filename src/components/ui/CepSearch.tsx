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
  service?: string;
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

export function CepSearch({ onEnderecoFound, onError, isLoading = false, className = "" }: CepSearchProps) {
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
      const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cepLimpo}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("CEP não encontrado");
        }
        throw new Error("Erro ao buscar CEP");
      }

      const data: EnderecoData = await response.json();
      
      // Mapear os dados da API para o formato do formulário
      const endereco = {
        cep: data.cep,
        rua: data.street || "",
        bairro: data.neighborhood || "",
        cidade: data.city || "",
        estado: data.state || "",
      };

      onEnderecoFound(endereco);
      setSuccess(true);
      
      // Limpar mensagem de sucesso após 4 segundos
      setTimeout(() => setSuccess(false), 4000);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao buscar CEP";
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
      <div className="flex gap-2 items-center justify-center bg-blue-100 p-3 rounded-lg">
        <div className="flex-1">
          <Input
            label="Buscar por CEP"
            helperText="Digite o CEP para preencher automaticamente"
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
          disabled={searching || isLoading || cep.replace(/\D/g, "").length !== 8}
        
        >
          {searching ? <Spinner size="sm" variant="primary" /> : "Buscar"}
        </Button>
      </div>
      
      {success && (
        <div className="text-sm text-green-600 bg-green-50 p-2 rounded-lg flex items-center gap-2">
          <Check className="w-3 h-3" />
          Endereço preenchido automaticamente! Coloque o numero da residencia.
        </div>
      )}
    </div>
  );
}