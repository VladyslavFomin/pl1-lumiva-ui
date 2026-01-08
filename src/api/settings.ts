import { apiClient, getApiErrorMessage } from "./client";

export interface PlatformSettings {
  telegramBotToken: string | null;
  telegramChatId: string | null;
  googleOauthClientId: string | null;
  googleOauthClientSecret: string | null;
  metaOauthAppId: string | null;
  metaOauthAppSecret: string | null;
  vkOauthClientId: string | null;
  vkOauthClientSecret: string | null;
}

export async function fetchPlatformSettings(): Promise<PlatformSettings> {
  try {
    const res = await apiClient.get<PlatformSettings>(`/platform/settings`);
    return res.data;
  } catch (err) {
    throw new Error(getApiErrorMessage(err));
  }
}

export async function updatePlatformSettings(
  payload: Partial<PlatformSettings>,
): Promise<PlatformSettings> {
  try {
    const res = await apiClient.patch<PlatformSettings>(`/platform/settings`, payload);
    return res.data;
  } catch (err) {
    throw new Error(getApiErrorMessage(err));
  }
}

export async function sendTelegramTest(message?: string): Promise<{ ok: boolean }> {
  try {
    const res = await apiClient.post<{ ok: boolean }>(
      `/platform/settings/telegram-test`,
      message ? { message } : undefined,
    );
    return res.data;
  } catch (err) {
    throw new Error(getApiErrorMessage(err));
  }
}
