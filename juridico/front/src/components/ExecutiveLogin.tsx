import React, { useState } from 'react';

export const ExecutiveLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1200);
  };

  return (
    <div className="login-container">
      <div style={{ textAlign: 'center' }}>
        <div className="header-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
          <span>Acceso Reservado • Alta Dirección</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: '#c5a059' }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 3v18M3 7h18M6 12l-3 5h6l-3-5zm12 0l-3 5h6l-3-5z"/>
          </svg>
        </div>

        <h1 className="brand-title executive-font">PORTAL JURÍDICO</h1>
        <p className="brand-subtitle">Grupo Huerta — Asuntos Corporativos & Legales</p>
      </div>

      {submitted ? (
        <div style={{
          padding: '1.5rem',
          background: 'rgba(34, 197, 94, 0.08)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: '10px',
          textAlign: 'center',
          marginTop: '1rem'
        }}>
          <div style={{ color: '#4ade80', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            ✓ Credenciales en Validación
          </div>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.4 }}>
            Entorno de demostración visual ejecutiva para la Alta Dirección.
          </p>
          <button 
            onClick={() => setSubmitted(false)}
            style={{
              marginTop: '1rem',
              background: 'transparent',
              border: '1px solid #475569',
              color: '#cbd5e1',
              padding: '6px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            Volver a intentar
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Correo Institucional</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="20" height="16" x="2" y="4" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </span>
              <input
                type="email"
                required
                className="custom-input"
                placeholder="direccion@grupohuerta.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Contraseña</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input
                type="password"
                required
                className="custom-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" defaultChecked />
              <span>Recordar mi sesión</span>
            </label>
            <a href="#forgot" className="forgot-link" onClick={(e) => e.preventDefault()}>
              ¿Olvidó su acceso?
            </a>
          </div>

          <button type="submit" className="btn-executive" disabled={loading}>
            {loading ? (
              <span>Cargando entorno seguro...</span>
            ) : (
              <>
                <span>Ingresar al Portal Jurídico</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </>
            )}
          </button>
        </form>
      )}

      <div className="footer-notice">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span>Sistema Encriptado • Confidencialidad Nivel Ejecutivo</span>
      </div>
    </div>
  );
};
