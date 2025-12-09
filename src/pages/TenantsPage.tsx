// src/pages/TenantsPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  fetchTenants,
  enableTenant,
  disableTenant,
  setTenantApi,
  createTenant,
  updateTenant,
  type TenantSummary,
  type TenantPlan,
  type CreateTenantDto,
} from "../api/tenants";
import { getApiErrorMessage } from "../api/client";
const PLATFORM_API_BASE =
  import.meta.env.VITE_PLATFORM_API_URL || "/pl1-platform-api";

type StatusFilter = "all" | "active" | "blocked";
type PlanFilter = "all" | "basic" | "pro";

interface EditTenantForm {
  id: string;
  name: string;
  clientKey: string;
  plan: TenantPlan | "";
  activeUntil: string; // YYYY-MM-DD
  ownerName: string;
  ownerEmail: string;
  apiEnabled: boolean;
}

interface CreateTenantForm {
  name: string;
  clientKey: string;
  plan: TenantPlan;
  activeUntil: string; // YYYY-MM-DD
  ownerName: string;
  ownerEmail: string;
  apiEnabled: boolean;
}
interface CreateTenantPayload extends CreateTenantDto {
  activeUntil: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  apiEnabled: boolean;
}

const TenantsPage: React.FC = () => {
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [planFilter, setPlanFilter] = useState<PlanFilter>("all");

  // ---------- создание ----------
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateTenantForm>({
    name: "",
    clientKey: "",
    plan: "basic",
    activeUntil: "",
    ownerName: "",
    ownerEmail: "",
    apiEnabled: true,
  });
  const [createLoading, setCreateLoading] = useState(false);

  // ---------- редактирование ----------
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditTenantForm | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // ---------- загрузка ----------
  const loadTenants = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTenants();
      setTenants(data);
    } catch (e) {
      const msg = getApiErrorMessage(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTenants();
  }, []);

  // ---------- фильтрация ----------
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !t.name.toLowerCase().includes(q) &&
          !t.clientKey.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (planFilter !== "all" && (t.plan || "basic") !== planFilter) {
        return false;
      }
      return true;
    });
  }, [tenants, search, statusFilter, planFilter]);

  // ---------- действия со статусом / API ----------
  const toggleStatus = async (tenant: TenantSummary) => {
    try {
      if (tenant.status === "active") {
        await disableTenant(tenant.id);
        setTenants((prev) =>
          prev.map((t) =>
            t.id === tenant.id ? { ...t, status: "blocked" } : t
          )
        );
      } else {
        await enableTenant(tenant.id);
        setTenants((prev) =>
          prev.map((t) =>
            t.id === tenant.id ? { ...t, status: "active" } : t
          )
        );
      }
    } catch (e) {
      alert("Не удалось изменить статус тенанта: " + getApiErrorMessage(e));
    }
  };
  
  const toggleApi = async (tenant: TenantSummary) => {
    try {
      const next = !tenant.apiEnabled;
      await setTenantApi(tenant.id, next);
      setTenants((prev) =>
        prev.map((t) =>
          t.id === tenant.id ? { ...t, apiEnabled: next } : t
        )
      );
    } catch (e) {
      alert("Не удалось изменить состояние API: " + getApiErrorMessage(e));
    }
  };


  const deleteTenant = async (tenant: TenantSummary) => {
    const ok = window.confirm(
      `Удалить тенанта "${tenant.name}" (clientKey: ${tenant.clientKey})?\nЭто действие необратимо.`
    );
    if (!ok) return;

    try {
      const res = await fetch(
        `${PLATFORM_API_BASE}/tenants/${tenant.id}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        const msg = await res.json().catch(() => null);
        throw new Error(msg?.message || "Ошибка удаления тенанта");
      }

      setTenants((prev) => prev.filter((t) => t.id !== tenant.id));
    } catch (e) {
      alert("Не удалось удалить тенант: " + getApiErrorMessage(e));
    }
  };

  // ---------- создание ----------
  const resetCreateForm = () => {
    setCreateForm({
      name: "",
      clientKey: "",
      plan: "basic",
      activeUntil: "",
      ownerName: "",
      ownerEmail: "",
      apiEnabled: true,
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.clientKey.trim()) return;

    setCreateLoading(true);
    try {
      const dto: CreateTenantPayload = {
        name: createForm.name.trim(),
        clientKey: createForm.clientKey.trim(),
        plan: createForm.plan,
        activeUntil: createForm.activeUntil
          ? new Date(createForm.activeUntil + "T00:00:00Z").toISOString()
          : null,
        ownerName: createForm.ownerName.trim() || null,
        ownerEmail: createForm.ownerEmail.trim() || null,
        apiEnabled: createForm.apiEnabled,
      };

      const created = await createTenant(dto);
      setTenants((prev) => [created, ...prev]);
      setCreateOpen(false);
      resetCreateForm();
    } catch (err) {
      const msg = getApiErrorMessage(err);
      alert("Не удалось создать тенант: " + msg);
    } finally {
      setCreateLoading(false);
    }
  };

  // ---------- редактирование ----------
  const openEditModal = (t: TenantSummary) => {
    const activeDate = t.activeUntil ? t.activeUntil.slice(0, 10) : "";
    setEditForm({
      id: t.id,
      name: t.name,
      clientKey: t.clientKey,
      plan: t.plan ?? "basic",
      activeUntil: activeDate,
      ownerName: t.ownerName ?? "",
      ownerEmail: t.ownerEmail ?? "",
      apiEnabled: t.apiEnabled,
    });
    setEditOpen(true);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;

    setEditLoading(true);
    try {
      const dto = {
        name: editForm.name.trim(),
        plan: (editForm.plan || "basic") as TenantPlan,
        activeUntil: editForm.activeUntil
          ? new Date(editForm.activeUntil + "T00:00:00Z").toISOString()
          : null,
        ownerName: editForm.ownerName.trim() || null,
        ownerEmail: editForm.ownerEmail.trim() || null,
        apiEnabled: editForm.apiEnabled,
      };

      const updated = await updateTenant(editForm.id, dto);
      setTenants((prev) =>
        prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
      );
      setEditOpen(false);
      setEditForm(null);
    } catch (err) {
      const msg = getApiErrorMessage(err);
      alert("Не удалось сохранить изменения: " + msg);
    } finally {
      setEditLoading(false);
    }
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU");
  };

  // ---------- JSX ----------
  return (
    <div className="pl1-page">
      <header className="pl1-page-header">
        <div>
          <h1 className="pl1-page-title">Тенанты</h1>
          <p className="pl1-page-subtitle">
            Список всех компаний, их статусы, планы и доступ к API.
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
          <button
            type="button"
            className="pl1-btn-primary"
            onClick={() => setCreateOpen(true)}
          >
            + Новый тенант
          </button>
        </div>
      </header>

      {error && (
        <div className="pl1-alert pl1-alert-error">
          <span className="pl1-alert-badge">ERROR</span>
          <span>{error}</span>
        </div>
      )}

      <section className="pl1-filters">
        <div className="pl1-filters-left">
          <input
            className="pl1-input"
            placeholder="Поиск по названию или client key…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="pl1-filters-right">
          <select
            className="pl1-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <option value="all">Все статусы</option>
            <option value="active">active</option>
            <option value="blocked">blocked</option>
          </select>
          <select
            className="pl1-select"
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value as PlanFilter)}
          >
            <option value="all">Все планы</option>
            <option value="basic">basic</option>
            <option value="pro">pro</option>
          </select>
        </div>
      </section>

      <div className="pl1-card pl1-card-table">
        <table className="pl1-table">
          <thead>
            <tr>
              <th>Название</th>
              <th>CLIENT KEY</th>
              <th>СТАТУС</th>
              <th>ПЛАН</th>
              <th>API</th>
              <th>АКТИВЕН ДО</th>
              <th>OWNER</th>
              <th>СОЗДАН</th>
              <th>ОБНОВЛЁН</th>
              <th className="pl1-col-actions">ДЕЙСТВИЯ</th>
            </tr>
          </thead>
          <tbody>
            {filteredTenants.length === 0 && !loading && (
              <tr>
                <td colSpan={10} className="pl1-table-empty">
                  Нет тенантов по текущему фильтру
                </td>
              </tr>
            )}

            {filteredTenants.map((t) => (
              <tr key={t.id}>
                <td>{t.name}</td>
                <td className="pl1-mono">{t.clientKey}</td>
                <td>
                  <span
                    className={
                      t.status === "active"
                        ? "pl1-pill pl1-pill-green"
                        : "pl1-pill pl1-pill-red"
                    }
                  >
                    {t.status}
                  </span>
                </td>
                <td>{t.plan || "—"}</td>
                <td>
                  <button
                    type="button"
                    className={
                      t.apiEnabled
                        ? "pl1-pill pl1-pill-green pl1-pill-clickable"
                        : "pl1-pill pl1-pill-gray pl1-pill-clickable"
                    }
                    onClick={() => void toggleApi(t)}
                  >
                    {t.apiEnabled ? "Вкл" : "Выкл"}
                  </button>
                </td>
                <td>{formatDate(t.activeUntil)}</td>
                <td>
                  {t.ownerName || "—"}
                  {t.ownerEmail && (
                    <div className="pl1-owner-email">{t.ownerEmail}</div>
                  )}
                </td>
                <td>{formatDate(t.createdAt)}</td>
                <td>{formatDate(t.updatedAt)}</td>
                <td className="pl1-col-actions">
                <button
                  type="button"
                  className="pl1-link-button"
                  onClick={() => openEditModal(t)}
                >
                  Редактировать
                </button>

                <button
                  type="button"
                  className="pl1-link-button"
                  onClick={() => void toggleStatus(t)}
                >
                  {t.status === "active" ? "Заблокировать" : "Разблокировать"}
                </button>

                <button
                  type="button"
                  className="pl1-link-button"
                  style={{ color: "#f87171" }} // красный текст
                  onClick={() => void deleteTenant(t)}
                >
                  Удалить
                </button>
              </td>
              </tr>
            ))}

            {loading && (
              <tr>
                <td colSpan={10} className="pl1-table-empty">
                  Загрузка…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ---------- МОДАЛ СОЗДАНИЯ ---------- */}
      {createOpen && (
        <div
          className="pl1-modal-backdrop"
          onClick={() => !createLoading && setCreateOpen(false)}
        >
          <div className="pl1-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="pl1-modal-title">Новый тенант</h2>
            <p className="pl1-modal-subtitle">
              Укажите название, client key, тариф, срок активности и владельца.
            </p>

            <form className="pl1-modal-form" onSubmit={handleCreate}>
              <label className="pl1-field">
                <span>Название компании</span>
                <input
                  className="pl1-input"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                />
              </label>

              <label className="pl1-field">
                <span>Client key</span>
                <input
                  className="pl1-input pl1-mono"
                  value={createForm.clientKey}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, clientKey: e.target.value }))
                  }
                  required
                />
              </label>

              <label className="pl1-field">
                <span>План</span>
                <select
                  className="pl1-select"
                  value={createForm.plan}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      plan: e.target.value as TenantPlan,
                    }))
                  }
                >
                  <option value="basic">basic</option>
                  <option value="pro">pro</option>
                </select>
              </label>

              <label className="pl1-field">
                <span>Активен до</span>
                <input
                  type="date"
                  className="pl1-input"
                  value={createForm.activeUntil}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      activeUntil: e.target.value,
                    }))
                  }
                />
              </label>

              <label className="pl1-field">
                <span>Owner name</span>
                <input
                  className="pl1-input"
                  value={createForm.ownerName}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      ownerName: e.target.value,
                    }))
                  }
                />
              </label>

              <label className="pl1-field">
                <span>Owner email</span>
                <input
                  className="pl1-input"
                  value={createForm.ownerEmail}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      ownerEmail: e.target.value,
                    }))
                  }
                />
              </label>

              <label className="pl1-field pl1-field-inline">
                <span>API доступ</span>
                <label className="pl1-switch">
                  <input
                    type="checkbox"
                    checked={createForm.apiEnabled}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        apiEnabled: e.target.checked,
                      }))
                    }
                  />
                  <span className="pl1-switch-slider" />
                  <span className="pl1-switch-label">
                    {createForm.apiEnabled ? "Включён" : "Выключен"}
                  </span>
                </label>
              </label>

              <div className="pl1-modal-actions">
                <button
                  type="button"
                  className="pl1-btn-ghost"
                  onClick={() => !createLoading && setCreateOpen(false)}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="pl1-btn-primary"
                  disabled={createLoading}
                >
                  {createLoading ? "Создаём…" : "Создать"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------- МОДАЛ РЕДАКТИРОВАНИЯ ---------- */}
      {editOpen && editForm && (
        <div
          className="pl1-modal-backdrop"
          onClick={() => !editLoading && setEditOpen(false)}
        >
          <div className="pl1-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="pl1-modal-title">Редактирование тенанта</h2>
            <p className="pl1-modal-subtitle">
              Здесь можно изменить владельца, тариф, срок активности и API.
            </p>

            <form className="pl1-modal-form" onSubmit={handleEditSave}>
              <label className="pl1-field">
                <span>Название компании</span>
                <input
                  className="pl1-input"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((f) =>
                      f ? { ...f, name: e.target.value } : f
                    )
                  }
                  required
                />
              </label>

              <label className="pl1-field">
                <span>Client key</span>
                <input
                  className="pl1-input pl1-mono"
                  value={editForm.clientKey}
                  disabled
                />
              </label>

              <label className="pl1-field">
                <span>План</span>
                <select
                  className="pl1-select"
                  value={editForm.plan || "basic"}
                  onChange={(e) =>
                    setEditForm((f) =>
                      f
                        ? {
                            ...f,
                            plan: e.target.value as TenantPlan,
                          }
                        : f
                    )
                  }
                >
                  <option value="basic">basic</option>
                  <option value="pro">pro</option>
                </select>
              </label>

              <label className="pl1-field">
                <span>Активен до</span>
                <input
                  type="date"
                  className="pl1-input"
                  value={editForm.activeUntil}
                  onChange={(e) =>
                    setEditForm((f) =>
                      f ? { ...f, activeUntil: e.target.value } : f
                    )
                  }
                />
              </label>

              <label className="pl1-field">
                <span>Owner name</span>
                <input
                  className="pl1-input"
                  value={editForm.ownerName}
                  onChange={(e) =>
                    setEditForm((f) =>
                      f ? { ...f, ownerName: e.target.value } : f
                    )
                  }
                />
              </label>

              <label className="pl1-field">
                <span>Owner email</span>
                <input
                  className="pl1-input"
                  value={editForm.ownerEmail}
                  onChange={(e) =>
                    setEditForm((f) =>
                      f ? { ...f, ownerEmail: e.target.value } : f
                    )
                  }
                />
              </label>

              <label className="pl1-field pl1-field-inline">
                <span>API доступ</span>
                <label className="pl1-switch">
                  <input
                    type="checkbox"
                    checked={editForm.apiEnabled}
                    onChange={(e) =>
                      setEditForm((f) =>
                        f ? { ...f, apiEnabled: e.target.checked } : f
                      )
                    }
                  />
                  <span className="pl1-switch-slider" />
                  <span className="pl1-switch-label">
                    {editForm.apiEnabled ? "Включён" : "Выключен"}
                  </span>
                </label>
              </label>

              <div className="pl1-modal-actions">
                <button
                  type="button"
                  className="pl1-btn-ghost"
                  onClick={() => !editLoading && setEditOpen(false)}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="pl1-btn-primary"
                  disabled={editLoading}
                >
                  {editLoading ? "Сохраняем…" : "Сохранить"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantsPage;