"use client";
import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

export default function TopButton() {
  const [isVisible, setIsVisible] = useState(false);

  // Monitora o scroll da página
  useEffect(() => {
    const toggleVisibility = () => {
      // Mostra o botão se o scroll for maior que 300px
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  // Função para voltar ao topo
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      {isVisible && (
        // 1. Container relativo para o tooltip (classe 'group')
        //    Posicionado fixo no canto da tela
        <div className="group fixed bottom-6 right-6 z-50">
          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Voltar ao topo"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-bg shadow-md ring-1 ring-inset ring-white/15 transition-all duration-200 hover:bg-primary/90 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg active:scale-95"
          >
            <ArrowUp size={20} strokeWidth={2.25} aria-hidden />
          </button>

          {/* 2. O Tooltip */}
          <span className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 origin-bottom whitespace-nowrap rounded-md border border-border bg-bg-elevated px-2.5 py-1 text-xs font-medium text-text shadow-md transition-all duration-200 scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100">
            Voltar ao topo
          </span>
        </div>
      )}
    </>
  );
}
