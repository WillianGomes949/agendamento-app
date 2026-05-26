// src/components/layout/Header.tsx - versão sem busca
"use client";

import { Menu, Bell } from "lucide-react";

interface HeaderProps {
  onToggleSidebar: () => void;
  onToggleMobile: () => void;
}

export default function Header({ onToggleSidebar, onToggleMobile }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 h-16 px-4 md:px-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobile}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
        >
          <Menu size={20} />
        </button>
        <button
          onClick={onToggleSidebar}
          className="hidden lg:flex p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-semibold text-gray-800 hidden sm:block">
          TrackApp
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
            JS
          </div>
          <span className="hidden md:block text-sm font-medium text-gray-700">Jackson</span>
        </div>
      </div>
    </header>
  );
}