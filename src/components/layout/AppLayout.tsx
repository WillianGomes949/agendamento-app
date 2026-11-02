// src/components/layout/AppLayout.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useServicos } from "@/hooks/useServicos";

interface AppLayoutProps {
  children: any;
  usuario?: {
    tecnico_nome: string;
    email: string;
    role: string;
  };
}

export default function AppLayout({ children, usuario }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isHoveringSidebar, setIsHoveringSidebar] = useState(false);

  const { loading, agendamentosPendentes } = useServicos();

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setMobileMenuOpen(false);
        setSidebarCollapsed(true);
      } else {
        const savedPref = localStorage.getItem("sidebar-collapsed");
        if (savedPref !== null) {
          setSidebarCollapsed(savedPref === "true");
        }
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (mounted && !isMobile) {
      localStorage.setItem("sidebar-collapsed", String(sidebarCollapsed));
    }
  }, [sidebarCollapsed, mounted, isMobile]);

  const toggleSidebar = useCallback(() => {
    if (!isMobile) setSidebarCollapsed((prev) => !prev);
  }, [isMobile]);

  const toggleMobileMenu = useCallback(() => {
    if (isMobile) setMobileMenuOpen((prev) => !prev);
  }, [isMobile]);

  useKeyboardShortcuts([
    { key: "b", ctrlKey: true, action: toggleSidebar },
    { key: "Escape", action: () => setMobileMenuOpen(false) },
  ]);

  if (!mounted) {
    return (
      <div className="flex min-h-screen bg-bg">
        <div className="flex flex-1 flex-col">
          <div className="h-16 border-b border-border bg-bg-elevated/80 backdrop-blur-md" />
          <main className="flex-1 p-4 lg:p-8">
            <div className="mx-auto max-w-7xl animate-pulse space-y-6">
              <div className="h-32 rounded-2xl bg-bg-elevated/40" />
              <div className="h-64 rounded-2xl bg-bg-elevated/30" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  const effectiveSidebarWidth = isMobile
    ? "0px"
    : sidebarCollapsed
      ? "5rem"
      : "16rem";

  return (
    <div className="flex min-h-screen bg-bg font-sans">
      <Sidebar
        isOpen={mobileMenuOpen}
        isCollapsed={sidebarCollapsed && !isMobile}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onHoverStart={() => setIsHoveringSidebar(true)}
        onHoverEnd={() => setIsHoveringSidebar(false)}
        agendamentosPendentes={agendamentosPendentes}
        isLoading={loading}
      />

      <div
        className="flex min-w-0 flex-1 flex-col transition-[margin] duration-300 ease-in-out"
        style={{ marginLeft: effectiveSidebarWidth }}
      >
        <Header
          onToggleSidebar={toggleSidebar}
          onToggleMobile={toggleMobileMenu}
          isSidebarCollapsed={sidebarCollapsed}
          isMobile={isMobile}
          usuario={usuario}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl pb-20 lg:pb-0">{children}</div>
        </main>
      </div>
    </div>
  );
}
