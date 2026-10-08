// src/lib/error-parser.ts

interface ParsedError {
  title: string;
  message: string;
  details?: string;
  httpStatus?: number;
}

function tryParseJson(str: string): Record<string, unknown> | null {
  const start = str.indexOf("{");
  const end = str.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    const result = JSON.parse(str.slice(start, end + 1));
    return result && typeof result === "object" ? result : null;
  } catch {
    return null;
  }
}

export function parseErrorMessage(raw: string): ParsedError {
  const statusMatch = raw.match(/HTTP\s+(\d+)/);
  const httpStatus = statusMatch ? parseInt(statusMatch[1], 10) : undefined;

  let current = tryParseJson(raw);
  let error: string | undefined;
  let details: string | undefined;

  // Desembrulha JSON aninhado (até 5 níveis)
  for (let i = 0; i < 5 && current; i++) {
    if (typeof current.error === "string") error = current.error;
    if (typeof current.details === "string") details = current.details;
    else if (current.details != null) details = JSON.stringify(current.details);

    current = typeof current.error === "string" ? tryParseJson(current.error) : null;
  }

  if (error) {
    // Remove prefixo "HTTP 409 do servidor: " caso reste
    const clean = error.replace(/^HTTP\s+\d+[^:]*:\s*/i, "").trim();
    return {
      httpStatus,
      title: clean || "Erro",
      message: clean || "Ocorreu um erro",
      details,
    };
  }

  return {
    httpStatus,
    title: "Erro",
    message: raw.replace(/^HTTP\s+\d+[^:]*:\s*/i, "").substring(0, 200),
  };
}

export function getErrorColor(httpStatus?: number): "rose" | "amber" {
  if (!httpStatus) return "rose";
  if (httpStatus >= 500) return "rose";
  if (httpStatus >= 400) return "amber";
  return "rose";
}