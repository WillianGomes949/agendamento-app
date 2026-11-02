// src/app/not-found.tsx
"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Compass, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg p-4 selection:bg-primary/20 selection:text-text">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25,
        }}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-bg-elevated p-8 text-center shadow-lg sm:p-10"
      >
        {/* Decoração de fundo sutil */}
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-primary/5 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-primary/5 blur-3xl"
          aria-hidden
        />

        <div className="relative z-10">
          {/* Ícone */}
          <motion.div
            initial={{ rotate: -15 }}
            animate={{ rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-bg-elevated/60"
          >
            <Compass className="h-8 w-8 text-text-muted" aria-hidden />
          </motion.div>

          <h1 className="mb-2 text-7xl font-bold tracking-tighter text-text">
            404
          </h1>
          <h2 className="mb-3 text-lg font-semibold tracking-tight text-text">
            Página não encontrada
          </h2>
          <p className="mb-6 text-sm leading-relaxed text-text-muted sm:text-base">
            Ops! Parece que você se perdeu. A página que está procurando não
            existe, foi movida ou o link está incorreto.
          </p>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => router.back()}
              variant="outline"
              size="lg"
              icon={ArrowLeft}
              className="w-full"
            >
              Voltar para onde estava
            </Button>
            <Link href="/" className="block w-full">
              <Button
                variant="primary"
                size="lg"
                icon={Home}
                className="w-full"
              >
                Ir para o Início
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
