// src/pages/PanelLoginPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setPanelAuthed } from "../auth/panelSession";

const PANEL_PASSWORD =
  import.meta.env.VITE_PANEL_PASSWORD ?? "pl1-super-secret";

const PanelLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);

    if (!password.trim()) {
      setError("Введите пароль панели");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      if (password === PANEL_PASSWORD) {
        setPanelAuthed("local-panel-secret");
        navigate("/", { replace: true });
      } else {
        setError("Неверный пароль панели");
      }
      setLoading(false);
    }, 350);
  };

  return (
    <div className="pl1-login-screen">
      <div className="pl1-login-box">
        <div className="pl1-login-logo">LUMIVA PLATFORM</div>

        <h1 className="pl1-login-title">Доступ к панели pl1</h1>

        <p className="pl1-login-desc">
          Эта страница защищает панель управления тенантами.  
          Введите пароль второй ступени.
        </p>

        <form className="pl1-login-form" onSubmit={handleSubmit}>
          <label className="pl1-field">
            <span>Пароль панели</span>
            <input
              type="password"
              className="pl1-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </label>

          {error && <div className="pl1-error-box">{error}</div>}

          <button type="submit" className="pl1-btn" disabled={loading}>
            {loading ? "Проверяем…" : "Войти в панель"}
          </button>
        </form>

        <p className="pl1-login-footer">
          Доступ есть только у владельца сервера.  
          Если вы видите эту страницу и не знаете пароль, просто закройте вкладку.
        </p>
      </div>
    </div>
  );
};

export default PanelLoginPage;