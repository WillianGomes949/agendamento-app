// src/app/(auth)/page.tsx - Login
"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast, Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Falha na autenticação");
      }

      toast.success("Login realizado!");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao fazer login";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-muted px-4 py-12">
      <Toaster
        position="top-right"
        toastOptions={{
          className:
            "!rounded-lg !bg-bg-elevated !text-text !border !border-border !shadow-lg backdrop-blur-md",
          success: { iconTheme: { primary: "#10b981", secondary: "#fff" } },
          error: { iconTheme: { primary: "#e11d48", secondary: "#fff" } },
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="space-y-6 rounded-2xl border border-border bg-bg-elevated p-8 shadow-lg">
          {/* Header */}
          <div className="space-y-3 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 to-indigo-700 shadow-md ring-1 ring-inset ring-white/15">
              <ShieldCheck className="h-7 w-7 text-white" aria-hidden />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-text">
                Bem-vindo de volta
              </h1>
              <p className="text-sm text-text-muted">
                Insira suas credenciais para acessar o painel.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3.5 py-3 text-sm text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                <span>{error}</span>
              </div>
            )}

            <Input
              label="Email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              leftIcon={Mail}
              required
              autoFocus
            />

            <div className="w-full">
              <label
                htmlFor="senha"
                className="mb-1.5 block text-[13px] font-medium tracking-tight text-text"
              >
                Senha
              </label>
              <div className="relative">
                <Input
                  id="senha"
                  type={showSenha ? "text" : "password"}
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => {
                    setSenha(e.target.value);
                    setError("");
                  }}
                  leftIcon={Lock}
                  required
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg-hover hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/50"
                  tabIndex={-1}
                  aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showSenha ? (
                    <EyeOff className="h-4 w-4" aria-hidden />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full"
            >
              {isLoading ? "Entrando..." : "Acessar Sistema"}
            </Button>
          </form>

          <p className="text-center text-xs text-text-muted">
            Sistema de Agendamento de Serviços v5.2.0
          </p>
        </div>
      </motion.div>
    </div>
  );
}
