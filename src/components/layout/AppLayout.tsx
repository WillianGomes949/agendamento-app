// src/components/layout/AppLayout.tsx
"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Evita mismatch de hidratação e sincroniza com viewport
  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setMobileMenuOpen(false);
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <div className="flex-1 flex flex-col">
          <div className="h-16 bg-white border-b border-gray-200" />
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        isOpen={mobileMenuOpen}
        isCollapsed={sidebarCollapsed && !isMobile}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out"
        style={{ 
          marginLeft: isMobile ? "0" : (sidebarCollapsed ? "4rem" : "16rem") 
        }}
      >
        <Header
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onToggleMobile={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}