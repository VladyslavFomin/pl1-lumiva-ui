// src/api/client.ts
import axios, { AxiosHeaders } from "axios";
import { getPanelToken } from "../auth/panelSession";

const baseURL =
  import.meta.env.VITE_PLATFORM_API_URL?.trim() ||
  "https://crm.lumiva.agency/v1";

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: false,
});

// Добавляем токен аутентификации в заголовки
apiClient.interceptors.request.use(
  (config) => {
    // Не добавляем токен для запросов на логин
    if (config.url?.includes('/platform/auth/login')) {
      return config;
    }
    
    const token = getPanelToken();
    if (token) {
      if (!config.headers) {
        config.headers = new AxiosHeaders();
      }
      if (typeof (config.headers as AxiosHeaders).set === "function") {
        (config.headers as AxiosHeaders).set("Authorization", `Bearer ${token}`);
      } else {
        (config.headers as any).Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Простой лог + прокидка ошибки дальше
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (import.meta.env.DEV) {
      console.error("API error:", error);
    }
    // Не перенаправляем автоматически - пусть компоненты сами решают, что делать
    // Только логируем ошибку
    return Promise.reject(error);
  }
);

// маленький helper, чтобы красиво показывать ошибки в UI
export function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (err.response) {
      const status = err.response.status;
      const data = err.response.data as any;
      const msg =
        (data && (data.message || data.error)) ||
        err.message ||
        "Ошибка запроса";
      return `HTTP ${status}: ${msg}`;
    }
    if (err.request) {
      // запрос ушёл, ответа нет
      return "Сервер не отвечает или блокируется (CORS / сеть)";
    }
    return err.message || "Ошибка запроса";
  }
  if (err instanceof Error) return err.message;
  return "Неизвестная ошибка";
}
