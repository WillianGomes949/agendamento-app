// src/components/layout/Header.tsx
"use client";

import { Menu, Bell, Search, ChevronLeft, Sun, Moon, LogOut, User, Settings as SettingsIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import { useClickOutside } from "@/hooks/useClickOutside";

interface HeaderProps {
  onToggleSidebar: () => void;
  onToggleMobile: () => void;
  isSidebarCollapsed: boolean;
  isMobile: boolean;
}

export default function Header({ 
  onToggleSidebar, 
  onToggleMobile, 
  isSidebarCollapsed, 
  isMobile 
}: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  
  const searchRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useClickOutside(searchRef, () => setSearchOpen(false));
  useClickOutside(notificationsRef, () => setNotificationsOpen(false));
  useClickOutside(userMenuRef, () => setUserMenuOpen(false));

  // Mock de notificações
  const notifications = [
    { id: 1, title: "Novo agendamento", message: "Serviço agendado para hoje às 14h", time: "5 min atrás", read: false },
    { id: 2, title: "Atualização de sistema", message: "Novas funcionalidades disponíveis", time: "1 hora atrás", read: false },
    { id: 3, title: "Relatório semanal", message: "Seu relatório está pronto", time: "2 horas atrás", read: true },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 h-16 px-4 md:px-6 flex items-center justify-between gap-4 shadow-sm">
      {/* Left Section */}
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={isMobile ? onToggleMobile : onToggleSidebar}
          className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label={isMobile ? "Abrir menu mobile" : (isSidebarCollapsed ? "Expandir sidebar" : "Colapsar sidebar")}
          title={isMobile ? "Menu" : (isSidebarCollapsed ? "Expandir menu (Ctrl+B)" : "Colapsar menu (Ctrl+B)")}
        >
          <Menu size={20} />
        </button>

        <div className="hidden md:flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">TA</span>
          </div>
          <h1 className="text-lg font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            TrackApp
          </h1>
        </div>

        {/* Desktop Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md ml-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar agendamentos, clientes ou serviços..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
            />
            <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Mobile Search Button */}
        <div className="relative md:hidden" ref={searchRef}>
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
            aria-label="Buscar"
          >
            <Search size={20} />
          </button>
          
          {searchOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-2 animate-in slide-in-from-top-2 duration-200">
              <input
                type="text"
                placeholder="Buscar..."
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
          aria-label="Alternar tema"
          title={`Mudar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
            aria-label="Notificações"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" aria-hidden="true" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden animate-in slide-in-from-top-2 duration-200">
              <div className="p-3 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">Notificações</h3>
                <button className="text-xs text-blue-600 hover:text-blue-700">Marcar todas como lidas</button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.map(notif => (
                  <div key={notif.id} className={`p-3 hover:bg-gray-50 transition-colors cursor-pointer ${!notif.read ? 'bg-blue-50/50' : ''}`}>
                    <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-gray-100 text-center">
                <button className="text-xs text-gray-500 hover:text-gray-700">Ver todas</button>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 hover:bg-gray-100 rounded-lg transition-colors group"
            aria-label="Menu do usuário"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm shadow-sm group-hover:shadow-md transition-shadow">
              WG
            </div>
            <span className="hidden md:block text-sm font-medium text-gray-700">Willian</span>
            <ChevronLeft size={16} className="hidden md:block text-gray-400 group-hover:rotate-180 transition-transform duration-200" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden animate-in slide-in-from-top-2 duration-200">
              <div className="p-3 border-b border-gray-100">
                <p className="font-medium text-gray-900">Willian Gonçalves</p>
                <p className="text-xs text-gray-500 mt-0.5">willian@trackapp.com</p>
              </div>
              <div className="py-2">
                <Link href="/perfil" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <User size={16} />
                  Meu Perfil
                </Link>
                <Link href="/configuracoes" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <SettingsIcon size={16} />
                  Configurações
                </Link>
                <hr className="my-1 border-gray-100" />
                <button className="flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full">
                  <LogOut size={16} />
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}