import React, { useState } from 'react';
import logoGrupoHuerta from '../assets/logo_grupo_huerta.jpg';

export const ExecutiveLogin: React.FC<{ onLoginSuccess: () => void }> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess();
    }, 600);
  };

  return (
    <div className="login-container">
      <div style={{ textAlign: 'center' }}>
        <div className="header-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
          <span>Acceso Restringido • Alta Dirección</span>
        </div>

        {/* LOGO OFICIAL DE GRUPO HUERTA */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            background: '#ffffff',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)',
            border: '1px solid #c29b47',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img 
              src={logoGrupoHuerta} 
              alt="Grupo Huerta" 
              style={{ height: '56px', width: 'auto', objectFit: 'contain' }} 
            />
          </div>
        </div>

        <h1 className="brand-title formal-header-font" style={{ fontSize: '1.75rem', marginTop: '0.5rem' }}>
          PORTAL JURÍDICO
        </h1>
        <p className="brand-subtitle" style={{ marginBottom: '1.75rem' }}>
          Dirección de Asuntos Corporativos & Legales
        </p>
      </div>

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
            ¿Restablecer credenciales?
          </a>
        </div>

        <button type="submit" className="btn-executive" disabled={loading}>
          {loading ? (
            <span>Verificando Autenticación...</span>
          ) : (
            <>
              <span>Ingresar al Portal Jurídico</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </>
          )}
        </button>
      </form>

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
