// src/pages/DashboardPage.tsx
import React from "react";

const DashboardPage: React.FC = () => {
  return (
    <div className="pl1-page">
      <h2 className="pl1-page-title">Обзор платформы</h2>
      <p className="pl1-page-sub">
        Здесь будет краткий обзор количества тенантов, планов и активности
        API. Пока — просто статический экран.
      </p>

      <div className="pl1-cards">
        <div className="pl1-card">
          <div className="pl1-card-label">Тенанты</div>
          <div className="pl1-card-value">1+</div>
          <div className="pl1-card-sub">Demo Client уже подключен</div>
        </div>
        <div className="pl1-card">
          <div className="pl1-card-label">Статус API</div>
          <div className="pl1-card-value">OK</div>
          <div className="pl1-card-sub">crm.lumiva.agency /v1</div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;