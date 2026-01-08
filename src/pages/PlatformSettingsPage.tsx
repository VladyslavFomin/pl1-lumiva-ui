import React, { useEffect, useState } from "react";
import {
  fetchPlatformSettings,
  updatePlatformSettings,
  sendTelegramTest,
} from "../api/settings";

const PlatformSettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [form, setForm] = useState({
    telegramBotToken: "",
    telegramChatId: "",
    googleOauthClientId: "",
    googleOauthClientSecret: "",
    metaOauthAppId: "",
    metaOauthAppSecret: "",
    vkOauthClientId: "",
    vkOauthClientSecret: "",
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPlatformSettings();
      setForm({
        telegramBotToken: data.telegramBotToken || "",
        telegramChatId: data.telegramChatId || "",
        googleOauthClientId: data.googleOauthClientId || "",
        googleOauthClientSecret: data.googleOauthClientSecret || "",
        metaOauthAppId: data.metaOauthAppId || "",
        metaOauthAppSecret: data.metaOauthAppSecret || "",
        vkOauthClientId: data.vkOauthClientId || "",
        vkOauthClientSecret: data.vkOauthClientSecret || "",
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    setSaving(true);
    setError(null);
    setStatus(null);
    try {
      await updatePlatformSettings({
        telegramBotToken: form.telegramBotToken.trim() || null,
        telegramChatId: form.telegramChatId.trim() || null,
        googleOauthClientId: form.googleOauthClientId.trim() || null,
        googleOauthClientSecret: form.googleOauthClientSecret.trim() || null,
        metaOauthAppId: form.metaOauthAppId.trim() || null,
        metaOauthAppSecret: form.metaOauthAppSecret.trim() || null,
        vkOauthClientId: form.vkOauthClientId.trim() || null,
        vkOauthClientSecret: form.vkOauthClientSecret.trim() || null,
      });
      setStatus("Сохранено");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const testTelegram = async () => {
    setTesting(true);
    setError(null);
    setStatus(null);
    try {
      await sendTelegramTest();
      setStatus("Тестовое сообщение отправлено.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
          Настройки
        </p>
        <h1 className="text-xl font-semibold text-slate-50">
          Уведомления и интеграции
        </h1>
        <p className="text-sm text-slate-400">
          Настройка Telegram для входящих запросов на демо.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-700/50 bg-rose-900/30 px-4 py-3 text-sm text-rose-50">
          {error}
        </div>
      )}

      {status && (
        <div className="rounded-2xl border border-emerald-700/50 bg-emerald-900/30 px-4 py-3 text-sm text-emerald-50">
          {status}
        </div>
      )}

      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 backdrop-blur-lg p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] space-y-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Telegram bot
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Заполните токен и chat ID, чтобы получать новые заявки.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
            Bot token
            <input
              value={form.telegramBotToken}
              onChange={(e) =>
                setForm((s) => ({ ...s, telegramBotToken: e.target.value }))
              }
              className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-100"
              placeholder="123456789:AA..."
            />
          </label>
          <label className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
            Chat ID
            <input
              value={form.telegramChatId}
              onChange={(e) =>
                setForm((s) => ({ ...s, telegramChatId: e.target.value }))
              }
              className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-100"
              placeholder="-1001234567890"
            />
          </label>
        </div>

        <div className="border-t border-slate-800/80 pt-4">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Google OAuth (Search Console)
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Используется для подключения SEO‑метрик в CRM.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
            OAuth Client ID
            <input
              value={form.googleOauthClientId}
              onChange={(e) =>
                setForm((s) => ({ ...s, googleOauthClientId: e.target.value }))
              }
              className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-100"
              placeholder="xxxx.apps.googleusercontent.com"
            />
          </label>
          <label className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
            OAuth Client Secret
            <input
              value={form.googleOauthClientSecret}
              onChange={(e) =>
                setForm((s) => ({ ...s, googleOauthClientSecret: e.target.value }))
              }
              className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-100"
              placeholder="GOCSPX-..."
            />
          </label>
        </div>

        <div className="border-t border-slate-800/80 pt-4">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Meta OAuth (SMM)
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Используется для подключения Instagram / Facebook профилей.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
            App ID
            <input
              value={form.metaOauthAppId}
              onChange={(e) =>
                setForm((s) => ({ ...s, metaOauthAppId: e.target.value }))
              }
              className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-100"
              placeholder="1234567890"
            />
          </label>
          <label className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
            App Secret
            <input
              value={form.metaOauthAppSecret}
              onChange={(e) =>
                setForm((s) => ({ ...s, metaOauthAppSecret: e.target.value }))
              }
              className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-100"
              placeholder="••••••••••"
            />
          </label>
        </div>

        <div className="border-t border-slate-800/80 pt-4">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
            VK OAuth (SMM)
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Используется для подключения сообществ VK.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
            Client ID
            <input
              value={form.vkOauthClientId}
              onChange={(e) =>
                setForm((s) => ({ ...s, vkOauthClientId: e.target.value }))
              }
              className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-100"
              placeholder="12345678"
            />
          </label>
          <label className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
            Client Secret
            <input
              value={form.vkOauthClientSecret}
              onChange={(e) =>
                setForm((s) => ({ ...s, vkOauthClientSecret: e.target.value }))
              }
              className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-100"
              placeholder="••••••••••"
            />
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving || loading}
            className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-100 hover:border-slate-500 transition-colors disabled:opacity-60"
          >
            {saving ? "Сохраняем..." : "Сохранить"}
          </button>
          <button
            onClick={testTelegram}
            disabled={testing || loading}
            className="rounded-2xl border border-cyan-700/60 bg-cyan-900/30 px-4 py-2 text-sm text-cyan-50 hover:border-cyan-400 transition-colors disabled:opacity-60"
          >
            {testing ? "Отправляем..." : "Тест Telegram"}
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="rounded-2xl border border-slate-800 px-4 py-2 text-sm text-slate-400 hover:text-slate-100 transition-colors disabled:opacity-60"
          >
            Обновить
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlatformSettingsPage;
