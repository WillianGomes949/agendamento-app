// src/app/configuracoes/page.tsx
"use client";

import { useState } from "react";
import { motion, Variants } from "framer-motion";
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
  Save,
  Globe,
  Trash2,
} from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// Variantes de animação padrão do projeto
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

// Componente Toggle Switch alinhado ao design system (slate-900 para ativo)
const ToggleSwitch = ({
  enabled,
  onToggle,
  label,
  description,
}: {
  enabled: boolean;
  onToggle: () => void;
  label: string;
  description?: string;
}) => (
  <div className="flex items-center justify-between p-5 border border-slate-200/60 rounded-2xl bg-white hover:border-slate-300 transition-colors">
    <div className="flex-1 pr-4">
      <h3 className="font-bold text-slate-900">{label}</h3>
      {description && (
        <p className="text-sm text-slate-500 mt-0.5">{description}</p>
      )}
    </div>
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 ${
        enabled ? "bg-slate-900" : "bg-slate-200"
      }`}
      role="switch"
      aria-checked={enabled}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  </div>
);

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState("perfil");

  // Estados mockados (em um app real, viriam de um hook ou contexto)
  const [user, setUser] = useState({
    nome: "Willian Gomes",
    email: "contato@williangomes.dev",
    telefone: "(85) 99999-9999",
    empresa: "Willian Gomes Dev",
    bio: "Desenvolvedor Full Stack especializado em Next.js e automação de processos.",
  });

  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("pt-BR");

  const handleSave = () => {
    toast.success("Configurações salvas com sucesso!", {
      icon: <Check className="w-4 h-4 text-emerald-500" />,
    });
  };

  const tabs = [
    { id: "perfil", label: "Perfil", icon: User },
    { id: "notificacoes", label: "Notificações", icon: Bell },
    { id: "seguranca", label: "Segurança", icon: Shield },
    { id: "aparencia", label: "Aparência", icon: Palette },
    { id: "integracoes", label: "Integrações", icon: Blocks },
  ];

  const integrations = [
    {
      name: "Google Analytics",
      connected: true,
      description: "Rastreamento de visitas",
    },
    {
      name: "Stripe",
      connected: false,
      description: "Processamento de pagamentos",
    },
    {
      name: "Slack",
      connected: true,
      description: "Notificações em tempo real",
    },
    {
      name: "GitHub",
      connected: false,
      description: "Sincronização de repositórios",
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 max-w-7xl mx-auto pb-12"
    >
      <Toaster
        position="top-right"
        toastOptions={{
          className:
            "shadow-xl rounded-2xl font-medium text-sm border border-slate-100",
          duration: 4000,
        }}
      />

      {/* Header com Ação Principal */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
            Configurações
          </h1>
          <p className="text-slate-500 text-sm md:text-base">
            Gerencie suas preferências, segurança e dados da conta.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={handleSave}
          className="flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
        >
          <Save className="w-4 h-4" />
          Salvar Alterações
        </Button>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar de Navegação */}
        <motion.aside
          variants={itemVariants}
          className="lg:w-64 shrink-0 flex flex-col gap-6"
        >
          <Card className="p-2 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`}
                  />
                  <span className="font-semibold text-sm">{tab.label}</span>
                </button>
              );
            })}
          </Card>

          {/* Danger Zone */}
          <Card className="p-5 bg-rose-50/50 border-rose-100">
            <div className="flex items-center gap-2 text-rose-700 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-sm uppercase tracking-wider">
                Zona de Perigo
              </h3>
            </div>
            <p className="text-xs text-rose-600/80 mb-4">
              Ações irreversíveis para a sua conta e dados.
            </p>
            <Button
              variant="outline"
              className="w-full text-rose-600 border-rose-200 hover:bg-rose-100 hover:text-rose-700 hover:border-rose-300"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir conta
            </Button>
          </Card>
        </motion.aside>

        {/* Área de Conteúdo */}
        <main className="flex-1">
          <motion.div variants={itemVariants}>
            <Card className="p-6 md:p-8 min-h-125">
              {/* ABA: PERFIL */}
              {activeTab === "perfil" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-6">
                    Informações do Perfil
                  </h2>

                  <div className="flex items-center gap-6 mb-8 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center text-white text-3xl font-bold shadow-sm">
                      {user.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 bg-white"
                      >
                        <Upload className="w-4 h-4" />
                        Alterar foto
                      </Button>
                      <p className="text-xs text-slate-500 mt-2">
                        JPG, PNG ou GIF. Máx. 2MB
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input
                      label="Nome completo"
                      value={user.nome}
                      onChange={(e) =>
                        setUser({ ...user, nome: e.target.value })
                      }
                    />
                    <Input
                      label="E-mail"
                      type="email"
                      value={user.email}
                      onChange={(e) =>
                        setUser({ ...user, email: e.target.value })
                      }
                    />
                    <Input
                      label="Telefone"
                      value={user.telefone}
                      onChange={(e) =>
                        setUser({ ...user, telefone: e.target.value })
                      }
                      placeholder="(00) 00000-0000"
                    />
                    <Input
                      label="Empresa"
                      value={user.empresa}
                      onChange={(e) =>
                        setUser({ ...user, empresa: e.target.value })
                      }
                    />
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Bio
                      </label>
                      <textarea
                        rows={4}
                        value={user.bio}
                        onChange={(e) =>
                          setUser({ ...user, bio: e.target.value })
                        }
                        placeholder="Conte um pouco sobre você e seus projetos..."
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-900 transition-all resize-none shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ABA: NOTIFICAÇÕES */}
              {activeTab === "notificacoes" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-6">
                    Preferências de Notificação
                  </h2>
                  <div className="space-y-4">
                    <ToggleSwitch
                      enabled={notifications}
                      onToggle={() => setNotifications(!notifications)}
                      label="Notificações push"
                      description="Receba alertas em tempo real no navegador."
                    />
                    <ToggleSwitch
                      enabled={emailAlerts}
                      onToggle={() => setEmailAlerts(!emailAlerts)}
                      label="Alertas por e-mail"
                      description="Receba resumos diários e alertas importantes."
                    />
                  </div>
                </div>
              )}

              {/* ABA: SEGURANÇA */}
              {activeTab === "seguranca" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-6">
                    Segurança da Conta
                  </h2>
                  <div className="space-y-4">
                    <Card className="p-5">
                      <h3 className="font-bold text-slate-900 mb-1">
                        Alterar senha
                      </h3>
                      <p className="text-sm text-slate-500 mb-4">
                        Última alteração há 3 meses
                      </p>
                      <Button variant="outline">Redefinir senha</Button>
                    </Card>

                    <ToggleSwitch
                      enabled={twoFactor}
                      onToggle={() => setTwoFactor(!twoFactor)}
                      label="Autenticação de dois fatores (2FA)"
                      description="Adicione uma camada extra de segurança à sua conta."
                    />

                    <Card className="p-5">
                      <h3 className="font-bold text-slate-900 mb-1">
                        Sessões ativas
                      </h3>
                      <p className="text-sm text-slate-500 mb-4">
                        Gerencie os dispositivos conectados à sua conta.
                      </p>
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                            <Laptop className="w-5 h-5 text-slate-500" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              Chrome - Linux (Pop!_OS)
                            </p>
                            <p className="text-xs text-emerald-600 font-medium mt-0.5">
                              Sessão Atual • Fortaleza, BR
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                          Online
                        </span>
                      </div>
                    </Card>
                  </div>
                </div>
              )}

              {/* ABA: APARÊNCIA */}
              {activeTab === "aparencia" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-6">
                    Aparência e Idioma
                  </h2>
                  <div className="space-y-4">
                    <ToggleSwitch
                      enabled={darkMode}
                      onToggle={() => setDarkMode(!darkMode)}
                      label="Modo escuro"
                      description="Alterne entre o tema claro e escuro da interface."
                    />

                    <Card className="p-5">
                      <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-slate-500" />
                        Idioma do Sistema
                      </h3>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full md:w-1/2 px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-900 transition-all shadow-sm cursor-pointer"
                      >
                        <option value="pt-BR">Português (Brasil)</option>
                        <option value="en-US">English (US)</option>
                        <option value="es">Español</option>
                      </select>
                    </Card>
                  </div>
                </div>
              )}

              {/* ABA: INTEGRAÇÕES */}
              {activeTab === "integracoes" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-6">
                    Integrações de Ferramentas
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {integrations.map((integration) => (
                      <Card
                        key={integration.name}
                        className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                              <Blocks className="w-6 h-6 text-slate-600" />
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-900">
                                {integration.name}
                              </h3>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {integration.description}
                              </p>
                              <span
                                className={`inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                  integration.connected
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {integration.connected
                                  ? "Conectado"
                                  : "Não conectado"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant={
                            integration.connected ? "outline" : "primary"
                          }
                          className={`w-full mt-4 ${
                            integration.connected
                              ? "text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300"
                              : ""
                          }`}
                        >
                          {integration.connected
                            ? "Desconectar"
                            : "Conectar Conta"}
                        </Button>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        </main>
      </div>
    </motion.div>
  );
}
