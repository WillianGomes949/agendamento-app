// src/components/layout/AppLayout.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isHoveringSidebar, setIsHoveringSidebar] = useState(false);

  // Verificar mobile e preferências salvas
  useEffect(() => {
    setMounted(true);
    
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      if (mobile) {
        setMobileMenuOpen(false);
        setSidebarCollapsed(true);
      } else {
        // Recuperar preferência do usuário
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

  // Salvar preferência da sidebar
  useEffect(() => {
    if (mounted && !isMobile) {
      localStorage.setItem("sidebar-collapsed", String(sidebarCollapsed));
    }
  }, [sidebarCollapsed, mounted, isMobile]);

  // Atalhos de teclado
  const toggleSidebar = useCallback(() => {
    if (!isMobile) {
      setSidebarCollapsed(prev => !prev);
    }
  }, [isMobile]);

  const toggleMobileMenu = useCallback(() => {
    if (isMobile) {
      setMobileMenuOpen(prev => !prev);
    }
  }, [isMobile]);

  useKeyboardShortcuts([
    { key: "b", ctrlKey: true, action: toggleSidebar },
    { key: "Escape", action: () => setMobileMenuOpen(false) },
  ]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
        <div className="flex-1 flex flex-col">
          <div className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200" />
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded-xl mb-6" />
              <div className="h-64 bg-gray-200 rounded-xl" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  const sidebarWidth = sidebarCollapsed ? "5rem" : "16rem";
  const effectiveSidebarWidth = isMobile ? "0" : sidebarWidth;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      <Sidebar
        isOpen={mobileMenuOpen}
        isCollapsed={sidebarCollapsed && !isMobile}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onHoverStart={() => setIsHoveringSidebar(true)}
        onHoverEnd={() => setIsHoveringSidebar(false)}
      />

      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out"
        style={{ 
          marginLeft: effectiveSidebarWidth,
        }}
      >
        <Header
          onToggleSidebar={toggleSidebar}
          onToggleMobile={toggleMobileMenu}
          isSidebarCollapsed={sidebarCollapsed}
          isMobile={isMobile}
        />
        
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}