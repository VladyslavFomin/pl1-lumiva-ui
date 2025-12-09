// src/api/client.ts
import axios from "axios";

const baseURL =
  import.meta.env.VITE_PLATFORM_API_URL?.trim() ||
  "/pl1-platform-api"; // можно потом изменить/убрать, если делаешь прокси через nginx

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: false,
});

// Простой лог + прокидка ошибки дальше
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (import.meta.env.DEV) {
      console.error("API error:", error);
    }
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