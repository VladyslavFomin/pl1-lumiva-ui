// src/pages/ModulesPage.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  fetchTenants,
  type TenantSummary,
} from "../api/tenants";
import {
  fetchTenantModules,
  toggleTenantModule,
  type TenantModule,
} from "../api/modules";
import { getApiErrorMessage } from "../api/client";

const MODULE_NAMES: Record<string, { name: string; icon: string }> = {
  chat: { name: "Онлайн-чат", icon: "💬" },
  clientcabinet: { name: "Client Cabinet Pro", icon: "👤" },
  cf7: { name: "Contact Form 7", icon: "✉️" },
  woo: { name: "WooCommerce", icon: "🛒" },
  telegram: { name: "Telegram", icon: "📨" },
};

const MODULE_ORDER = ["chat", "clientcabinet", "cf7", "woo", "telegram"];

const MODULE_ALIASES: Record<string, string> = {
  client_cabinet: "clientcabinet",
  "client-cabinet": "clientcabinet",
  online_chat: "chat",
  "online-chat": "chat",
  contact_form_7: "cf7",
  contact_form7: "cf7",
  contactform7: "cf7",
  "contact-form-7": "cf7",
  "cf-7": "cf7",
  telegram_bot: "telegram",
  telegram_notifications: "telegram",
  telegram_notify: "telegram",
  tg: "telegram",
};

const ModulesPage: React.FC = () => {
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [modules, setModules] = useState<TenantModule[]>([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [toggling, setToggling] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    void loadTenants();
  }, []);

  useEffect(() => {
    if (selectedTenantId) {
      void loadModules(selectedTenantId);
    } else {
      setModules([]);
    }
  }, [selectedTenantId]);

  const loadTenants = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTenants();
      setTenants(data);
    } catch (e: any) {
      const msg = getApiErrorMessage(e);
      if (e?.response?.status === 401) {
        setError("Ошибка аутентификации. Войдите в панель заново.");
        localStorage.removeItem("pl1_admin_authed");
        localStorage.removeItem("pl1_admin_token");
        navigate("/panel-login", { replace: true });
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadModules = async (tenantId: string) => {
    setModulesLoading(true);
    setError(null); // Очищаем предыдущие ошибки
    try {
      const data = await fetchTenantModules(tenantId);
      setModules(data);
    } catch (e: any) {
      const msg = getApiErrorMessage(e);
      if (e?.response?.status === 401) {
        setError("Ошибка аутентификации. Войдите в панель заново.");
        localStorage.removeItem("pl1_admin_authed");
        localStorage.removeItem("pl1_admin_token");
        navigate("/panel-login", { replace: true });
      } else {
        setError("Не удалось загрузить модули: " + msg);
      }
    } finally {
      setModulesLoading(false);
    }
  };

  const handleToggleModule = async (
    tenantId: string,
    displayKey: string,
    toggleKey: string,
    currentEnabled: boolean,
  ) => {
    const toggleKeyId = `${tenantId}-${displayKey}`;
    setToggling((prev) => new Set(prev).add(toggleKeyId));

    try {
      await toggleTenantModule(tenantId, toggleKey, !currentEnabled);
      setModules((prev) => {
        const normalizedKey = displayKey;
        let hasMatch = false;
        const next = prev.map((m) => {
          if (normalizeModuleKey(m.key) === normalizedKey) {
            hasMatch = true;
            return { ...m, enabled: !currentEnabled };
          }
          return m;
        });
        if (!hasMatch) {
          next.push({ key: normalizedKey, enabled: !currentEnabled });
        }
        return next;
      });
    } catch (e) {
      const msg = getApiErrorMessage(e);
      if (axios.isAxiosError(e) && e.response?.status === 401) {
        setError("Ошибка аутентификации. Войдите в панель заново.");
        localStorage.removeItem("pl1_admin_authed");
        localStorage.removeItem("pl1_admin_token");
        navigate("/panel-login", { replace: true });
        return;
      }
      alert("Не удалось изменить модуль: " + msg);
    } finally {
      setToggling((prev) => {
        const next = new Set(prev);
        next.delete(toggleKeyId);
        return next;
      });
    }
  };

  const selectedTenant = tenants.find((t) => t.id === selectedTenantId);
  const normalizeModuleKey = (key: string) => {
    const normalized = key.toLowerCase();
    return MODULE_ALIASES[normalized] || normalized;
  };
  const normalizedModules = modules.reduce<
    Record<string, TenantModule & { toggleKey: string }>
  >((acc, module) => {
    const normalizedKey = normalizeModuleKey(module.key);
    const existing = acc[normalizedKey];
    if (!existing || (!existing.enabled && module.enabled)) {
      acc[normalizedKey] = {
        key: normalizedKey,
        enabled: module.enabled,
        toggleKey: module.key,
      };
    }
    return acc;
  }, {});
  const visibleModules = MODULE_ORDER.map((moduleKey) => {
    const found = normalizedModules[moduleKey];
    if (found) {
      return found;
    }
    return {
      key: moduleKey,
      enabled: false,
      toggleKey: moduleKey,
    };
  });
  const enabledVisibleModules = visibleModules.filter((m) => m.enabled).length;

  return (
    <div className="pl1-page">
      <header className="pl1-page-header">
        <div>
          <h1 className="pl1-page-title">Модули</h1>
          <p className="pl1-page-subtitle">
            Управление модулями для тенентов. Отключение модуля скрывает его в
            панели CRM и на WordPress сайте клиента.
          </p>
        </div>
        <div className="pl1-header-actions">
          <button
            type="button"
            className="pl1-btn-outline"
            onClick={() => void loadTenants()}
            disabled={loading}
          >
            {loading ? "Обновляем…" : "Обновить"}
          </button>
        </div>
      </header>

      {error && (
        <div className="pl1-alert pl1-alert-error">
          <span className="pl1-alert-badge">ERROR</span>
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Список тенентов */}
        <div className="lg:col-span-1">
          <div className="pl1-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-200">
                Выберите тенант
              </h2>
              <span className="text-xs text-slate-500">
                {tenants.length} {tenants.length === 1 ? "тенант" : "тенантов"}
              </span>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-slate-700 border-t-sky-400 rounded-full animate-spin" />
              </div>
            ) : tenants.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <div className="text-4xl mb-2">📭</div>
                <div className="text-sm">Нет тенантов</div>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {tenants.map((tenant) => (
                  <button
                    key={tenant.id}
                    type="button"
                    onClick={() => setSelectedTenantId(tenant.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                      selectedTenantId === tenant.id
                        ? "bg-gradient-to-r from-sky-500/20 to-indigo-500/20 border-2 border-sky-500/50 text-slate-50 shadow-lg shadow-sky-500/20"
                        : "bg-slate-900/50 border border-slate-800/50 text-slate-300 hover:bg-slate-900 hover:border-slate-700/50"
                    }`}
                  >
                    <div className="font-semibold mb-1">{tenant.name}</div>
                    <div className="text-xs text-slate-500 font-mono">
                      {tenant.clientKey}
                    </div>
                    {tenant.status === "active" && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="text-xs text-emerald-400">Активен</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Модули выбранного тенанта */}
        <div className="lg:col-span-2">
          {!selectedTenantId ? (
            <div className="pl1-card">
              <div className="text-center py-8 text-slate-400">
                Выберите тенант для управления модулями
              </div>
            </div>
          ) : (
            <div className="pl1-card">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/50">
                <div>
                  <h2 className="text-base font-bold text-slate-100 mb-1">
                    Модули тенанта
                  </h2>
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-slate-300 font-medium">
                      {selectedTenant?.name}
                    </p>
                    <span className="text-slate-600">•</span>
                    <p className="text-xs text-slate-500 font-mono">
                      {selectedTenant?.clientKey}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center gap-4">
                    <span className="text-xs text-slate-500">
                      Включено:{" "}
                      <span className="text-emerald-400 font-semibold">
                        {enabledVisibleModules}
                      </span>
                      {" / "}
                      <span className="text-slate-400">
                        {visibleModules.length}
                      </span>
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600 transition-colors"
                  onClick={() => navigate(`/tenants/${selectedTenantId}`)}
                >
                  Детали →
                </button>
              </div>

              {modulesLoading ? (
                <div className="text-sm text-slate-400 py-4">Загрузка…</div>
              ) : visibleModules.length === 0 ? (
                <div className="text-sm text-slate-400 py-4">
                  Нет модулей
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {visibleModules.map((module) => {
                    const moduleInfo =
                      MODULE_NAMES[module.key] || {
                        name: module.key,
                        icon: "📦",
                      };
                    const toggleKeyId = `${selectedTenantId}-${module.key}`;
                    const isToggling = toggling.has(toggleKeyId);

                    return (
                      <div
                        key={module.key}
                        className={`group relative flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                          module.enabled
                            ? "bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/30 shadow-lg shadow-emerald-500/10"
                            : "bg-slate-900/50 border-slate-800/50 hover:border-slate-700/50"
                        }`}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div
                            className={`text-3xl transition-transform duration-200 ${
                              module.enabled
                                ? "scale-110 drop-shadow-lg"
                                : "opacity-60 group-hover:scale-105"
                            }`}
                          >
                            {moduleInfo.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className={`text-sm font-semibold mb-1 ${
                                module.enabled
                                  ? "text-emerald-100"
                                  : "text-slate-300"
                              }`}
                            >
                              {moduleInfo.name}
                            </div>
                            <div className="text-xs text-slate-500 font-mono">
                              {module.key}
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">
                          <label
                            className={`relative inline-flex items-center cursor-pointer ${
                              isToggling ? "opacity-50" : ""
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={module.enabled}
                              onChange={() =>
                                void handleToggleModule(
                                  selectedTenantId,
                                  module.key,
                                  module.toggleKey,
                                  module.enabled,
                                )
                              }
                              disabled={isToggling}
                              className="sr-only peer"
                            />
                            <div
                              className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
                                module.enabled
                                  ? "bg-emerald-500 shadow-lg shadow-emerald-500/50"
                                  : "bg-slate-700"
                              }`}
                            >
                              <div
                                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${
                                  module.enabled
                                    ? "translate-x-7"
                                    : "translate-x-0"
                                }`}
                              />
                            </div>
                          </label>
                        </div>
                        {module.enabled && (
                          <div className="absolute top-2 right-2">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModulesPage;
