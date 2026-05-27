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
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans selection:bg-slate-200 selection:text-slate-900">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut", type: "spring", stiffness: 300, damping: 25 }}
        className="max-w-md w-full bg-white p-8 sm:p-10 rounded-4xl shadow-xl shadow-slate-200/40 border border-slate-200/60 text-center relative overflow-hidden"
      >
        {/* Decoração de fundo sutil (Blobs) */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-slate-100 rounded-full blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-slate-100 rounded-full blur-3xl opacity-60 pointer-events-none" />

        <div className="relative z-10">
          {/* Ícone com leve inclinação para dar um tom mais "perdido" */}
          <motion.div 
            initial={{ rotate: -15 }}
            animate={{ rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-sm"
          >
            <Compass className="w-10 h-10 text-slate-400" />
          </motion.div>

          <h1 className="text-6xl font-extrabold text-slate-900 tracking-tighter mb-2">
            404
          </h1>
          <h2 className="text-xl font-bold text-slate-800 mb-3">
            Página não encontrada
          </h2>
          <p className="text-slate-500 mb-8 leading-relaxed text-sm sm:text-base">
            Ops! Parece que você se perdeu. A página que está procurando não existe, foi movida ou o link está incorreto.
          </p>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="w-full py-3 sm:py-3.5 h-auto text-slate-600 hover:text-slate-900 border-slate-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para onde estava
            </Button>
            
            <Link href="/" className="w-full focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 rounded-xl">
              <Button
                variant="primary"
                className="w-full py-3 sm:py-3.5 h-auto bg-slate-900 hover:bg-slate-800 text-white shadow-md"
              >
                <Home className="w-4 h-4 mr-2" />
                Ir para o Início
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </main>
  );
}