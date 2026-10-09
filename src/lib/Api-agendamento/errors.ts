// src/lib/Api/errors.ts
// Erros tipados para a camada Api — permite tratamento específico
// sem depender de strings soltas.

/**
 * Erro lançado quando a resposta do Api (ou do proxy) retorna status lógico >= 400.
 * Carrega o status HTTP real para que o Route Handler possa propagá-lo.
 */
export class ApiApiError extends Error {
  readonly status: number;
  readonly details?: string;
  readonly requestId?: string;

  constructor(
    message: string,
    status: number,
    options?: { details?: string; requestId?: string },
  ) {
    super(message);
    this.name = "ApiApiError";
    this.status = status;
    this.details = options?.details;
    this.requestId = options?.requestId;
  }
}

/**
 * Erro de rede/timeout/infra — não veio do Api, veio do transporte.
 * Sempre mapeado para 502 (Bad Gateway) por padrão.
 */
export class ApiTransportError extends Error {
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "ApiTransportError";
    this.cause = cause;
  }
}

/**
 * Erro de configuração do ambiente (ex.: Api_URL ausente).
 * Sempre mapeado para 500 — é problema do deploy, não da requisição.
 */
export class ApiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiConfigError";
  }
}