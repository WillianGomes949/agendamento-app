// src/components/layout/Header.tsx
"use client";

import { Menu, Bell, Search } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  onToggleSidebar: () => void;
  onToggleMobile: () => void;
}

export default function Header({ onToggleSidebar, onToggleMobile }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 h-16 px-4 md:px-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={onToggleMobile}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
          aria-label="Abrir menu mobile"
        >
          <Menu size={20} />
        </button>
        <button
          onClick={onToggleSidebar}
          className="hidden lg:flex p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
          aria-label="Colapsar sidebar"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-semibold text-gray-800 hidden sm:block">
          TrackApp
        </h1>
      </div>

      {/* Busca rápida */}
      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar serviço..."
            className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64"
            onClick={() => setSearchOpen(true)}
          />
        </div>

        <button 
          className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
          aria-label="Notificações"
        >
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
            WG
          </div>
          <span className="hidden md:block text-sm font-medium text-gray-700">Willian</span>
        </div>
      </div>
    </header>
  );
}