// src/api/tenants.ts
import { apiClient, getApiErrorMessage } from "./client";

/** Статус тенанта в платформе */
export type TenantStatus = "active" | "blocked";

/** Тарифный план */
export type TenantPlan = "basic" | "pro";

/** Объект тенанта из платформенного API */
export interface TenantSummary {
  id: string;
  name: string;
  clientKey: string;
  status: TenantStatus;
  plan: TenantPlan | null;
  apiEnabled: boolean;

  activeUntil: string | null;

  ownerName: string | null;
  ownerEmail: string | null;

  createdAt: string;
  updatedAt: string;
}

/** DTO для создания тенанта */
export interface CreateTenantDto {
  name: string;
  clientKey: string;
  plan?: TenantPlan | null;
}

/** DTO для обновления тенанта (частичное обновление) */
export interface UpdateTenantDto {
  name?: string;
  clientKey?: string;
  status?: TenantStatus;
  plan?: TenantPlan | null;
  apiEnabled?: boolean;
  activeUntil?: string | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
}

/* ───── Базовые запросы ───── */

export async function fetchTenants(): Promise<TenantSummary[]> {
  try {
    const res = await apiClient.get<TenantSummary[]>("/tenants");
    return res.data;
  } catch (err) {
    throw new Error(getApiErrorMessage(err));
  }
}

export async function createTenant(
  dto: CreateTenantDto,
): Promise<TenantSummary> {
  try {
    const res = await apiClient.post<TenantSummary>("/tenants", dto);
    return res.data;
  } catch (err) {
    throw new Error(getApiErrorMessage(err));
  }
}

/**
 * Универсальный апдейт.
 * ВАЖНО: здесь путь БЕЗ `/status` или `/api` — просто `/tenants/:id`
 * Именно этот эндпоинт есть на бекенде Nest.
 */
export async function updateTenant(
  id: string,
  dto: UpdateTenantDto,
): Promise<TenantSummary> {
  try {
    const res = await apiClient.patch<TenantSummary>(`/tenants/${id}`, dto);
    return res.data;
  } catch (err) {
    throw new Error(getApiErrorMessage(err));
  }
}

/* ───── Удобные обёртки для UI ───── */

export function enableTenant(id: string) {
  return updateTenant(id, { status: "active" });
}

export function disableTenant(id: string) {
  return updateTenant(id, { status: "blocked" });
}

export function setTenantApi(id: string, enabled: boolean) {
  return updateTenant(id, { apiEnabled: enabled });
}