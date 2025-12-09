// src/auth/panelSession.ts
const STORAGE_KEY = "pl1_admin_authed";
const TOKEN_KEY = "pl1_admin_token";

export function isPanelAuthed(): boolean {
  return localStorage.getItem(STORAGE_KEY) === "1";
}

export function setPanelAuthed(token: string): void {
  localStorage.setItem(STORAGE_KEY, "1");
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearPanelSession(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TOKEN_KEY);
}