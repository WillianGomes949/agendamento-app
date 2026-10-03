"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";
import {
  User,
  Bell,
  Shield,
  Palette,
  Blocks,
  AlertTriangle,
  Upload,
  Laptop,
  Check,
} from "lucide-react";

export default function Configuracao() {
  const [activeTab, setActiveTab] = useState("perfil");
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [language, setLanguage] = useState("pt-BR");

  const [user, setUser] = useState({
    nome: "Willian Gomes",
    email: "contato@williangomes.dev",
    telefone: "",
    empresa: "Willian Gomes Dev",
    bio: "",
  });

  const handleSave = () => {
    toast.success("Configurações salvas com sucesso!");
  };

  const tabs = [
    { id: "perfil", label: "Perfil", icon: User },
    { id: "notificacoes", label: "Notificações", icon: Bell },
    { id: "seguranca", label: "Segurança", icon: Shield },
    { id: "aparencia", label: "Aparência", icon: Palette },
    { id: "integracoes", label: "Integrações", icon: Blocks },
  ];

  const integrations = [
    { name: "Google Analytics", connected: true },
    { name: "Stripe", connected: false },
    { name: "Slack", connected: true },
    { name: "GitHub", connected: false },
  ];



  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <Toaster
        position="top-right"
        toastOptions={{
          className: "shadow-xl rounded-2xl font-medium text-sm border border-slate-100",
          duration: 4000,
        }}
      />

      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700/60 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Configurações
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Gerencie suas preferências, segurança e dados da conta.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 shrink-0 flex flex-col gap-6">
            <nav className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 overflow-hidden p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                      isActive
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white font-medium"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            {/* Danger Zone */}
            <div className="bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-800/30 p-5">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-sm uppercase tracking-wider">Zona de Perigo</h3>
              </div>
              <p className="text-xs text-rose-600/70 dark:text-rose-400/70 mb-4">
                Ações irreversíveis para a sua conta.
              </p>
              <button className="w-full px-4 py-2 bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 rounded-xl text-sm font-semibold transition-colors">
                Excluir conta
              </button>
            </div>
          </aside>

          {/* Content Area */}
          <main className="flex-1">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 p-6 md:p-8 overflow-hidden min-h-125 flex flex-col">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1"
                >
                  {/* Perfil */}
                  {activeTab === "perfil" && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                        Informações do Perfil
                      </h2>

                      {/* Avatar */}
                      <div className="flex items-center gap-6 mb-8 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-inner">
                          {user.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                            <Upload className="w-4 h-4" />
                            Alterar foto
                          </button>
                          <p className="text-xs text-slate-500 mt-2">JPG, PNG ou GIF. Máx. 2MB</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Nome completo
                          </label>
                          <input
                            type="text"
                            value={user.nome}
                            onChange={(e) => setUser({ ...user, nome: e.target.value })}
                            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50/50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                            E-mail
                          </label>
                          <input
                            type="email"
                            value={user.email}
                            onChange={(e) => setUser({ ...user, email: e.target.value })}
                            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50/50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Telefone
                          </label>
                          <input
                            type="tel"
                            value={user.telefone}
                            onChange={(e) => setUser({ ...user, telefone: e.target.value })}
                            placeholder="(00) 00000-0000"
                            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50/50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Empresa
                          </label>
                          <input
                            type="text"
                            value={user.empresa}
                            onChange={(e) => setUser({ ...user, empresa: e.target.value })}
                            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50/50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                          />
                        </div>
                        <div className="md:col-span-2 space-y-1.5">
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Bio
                          </label>
                          <textarea
                            rows={4}
                            value={user.bio}
                            onChange={(e) => setUser({ ...user, bio: e.target.value })}
                            placeholder="Conte um pouco sobre você e seus projetos..."
                            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50/50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notificações */}
                  {activeTab === "notificacoes" && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                        Preferências de Notificação
                      </h2>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-5 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-blue-200 transition-colors">
                          <div>
                            <h3 className="font-bold text-slate-900 dark:text-white">
                              Notificações push
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                              Receba alertas em tempo real no navegador
                            </p>
                          </div>
                          <ToggleSwitch enabled={notifications} onToggle={() => setNotifications(!notifications)} />
                        </div>

                        <div className="flex items-center justify-between p-5 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-blue-200 transition-colors">
                          <div>
                            <h3 className="font-bold text-slate-900 dark:text-white">
                              Alertas por e-mail
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                              Receba resumos diários e alertas importantes
                            </p>
                          </div>
                          <ToggleSwitch enabled={emailAlerts} onToggle={() => setEmailAlerts(!emailAlerts)} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Segurança */}
                  {activeTab === "seguranca" && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                        Segurança da Conta
                      </h2>

                      <div className="space-y-4">
                        <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-2xl">
                          <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                            Alterar senha
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                            Última alteração há 3 meses
                          </p>
                          <button className="px-5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                            Redefinir senha
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-5 border border-slate-200 dark:border-slate-700 rounded-2xl">
                          <div>
                            <h3 className="font-bold text-slate-900 dark:text-white">
                              Autenticação de dois fatores (2FA)
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                              Adicione uma camada extra de segurança
                            </p>
                          </div>
                          <ToggleSwitch enabled={twoFactor} onToggle={() => setTwoFactor(!twoFactor)} />
                        </div>

                        <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-2xl">
                          <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                            Sessões ativas
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                            Gerencie os dispositivos conectados
                          </p>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600/50">
                              <div className="flex items-center gap-4">
                                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
                                  <Laptop className="w-5 h-5 text-slate-500" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                                    Chrome - Linux (Pop!_OS)
                                  </p>
                                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                                    Sessão Atual • Fortaleza, BR
                                  </p>
                                </div>
                              </div>
                              <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                                Online
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Aparência */}
                  {activeTab === "aparencia" && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                        Aparência
                      </h2>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-5 border border-slate-200 dark:border-slate-700 rounded-2xl">
                          <div>
                            <h3 className="font-bold text-slate-900 dark:text-white">
                              Modo escuro
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                              Alterne entre tema claro e escuro
                            </p>
                          </div>
                          <ToggleSwitch enabled={darkMode} onToggle={() => setDarkMode(!darkMode)} />
                        </div>

                        <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-2xl">
                          <h3 className="font-bold text-slate-900 dark:text-white mb-3">
                            Idioma do Sistema
                          </h3>
                          <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full md:w-1/2 px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50/50 dark:bg-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer"
                          >
                            <option value="pt-BR">Português (Brasil)</option>
                            <option value="en-US">English (US)</option>
                            <option value="es">Español</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Integrações */}
                  {activeTab === "integracoes" && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                        Integrações de Ferramentas
                      </h2>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {integrations.map((integration) => (
                          <div
                            key={integration.name}
                            className="flex flex-col justify-between p-5 border border-slate-200 dark:border-slate-700 rounded-2xl hover:shadow-md transition-shadow bg-slate-50/30 dark:bg-slate-800/50"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-white dark:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-600 shadow-sm">
                                  <Blocks className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-slate-900 dark:text-white">
                                    {integration.name}
                                  </h3>
                                  <span
                                    className={`text-xs font-semibold ${
                                      integration.connected
                                        ? "text-emerald-600"
                                        : "text-slate-400"
                                    }`}
                                  >
                                    {integration.connected ? "Conectado" : "Não conectado"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button
                              className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors border ${
                                integration.connected
                                  ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-700 hover:bg-slate-50 hover:text-rose-600 hover:border-rose-200"
                                  : "bg-blue-600 border-blue-600 text-white hover:bg-blue-700 shadow-sm"
                              }`}
                            >
                              {integration.connected ? "Desconectar" : "Conectar Conta"}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Botões de Ação Fixos no Rodapé */}
              <div className="mt-auto pt-8 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                <button className="px-6 py-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-400 rounded-xl font-bold transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md hover:shadow-lg transition-all"
                >
                  <Check className="w-4 h-4" />
                  Salvar Alterações
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
  // Componente reutilizável para o Toggle Switch
  const ToggleSwitch = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        enabled ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );