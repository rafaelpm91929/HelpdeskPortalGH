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
    <div className="login-page-wrapper">
      
      {/* SECCIÓN IZQUIERDA: HERO / TEXTO INFORMATIVO CON EFECTO CRISTAL */}
      <div className="login-hero-section">
        <div className="hero-glass-card">
          <div className="hero-brand-tag">GRUPO HUERTA</div>
          <h1 className="hero-title formal-header-font">Portal Jurídico</h1>
          <p className="hero-description">
            Gestión corporativa, atención de dictámenes y estado de cumplimiento legal de todas las agencias y sucursales, en un solo lugar.
          </p>

          <div className="hero-tags-container">
            <span className="hero-tag-pill">Suzuki Montevideo</span>
            <span className="hero-tag-pill">Divol Norte</span>
            <span className="hero-tag-pill">Divol Perinorte</span>
            <span className="hero-tag-pill">Divol Lindavista</span>
            <span className="hero-tag-pill">Omoda Esmeralda</span>
            <span className="hero-tag-pill">Divol Truks</span>
            <span className="hero-tag-pill">Cupra La Villa</span>
            <span className="hero-tag-pill">Divol Tlalnepantla</span>
          </div>
        </div>
      </div>

      {/* SECCIÓN DERECHA: TARJETA DE LOGIN CON EFECTO CRISTAL Y DEGRADADOS */}
      <div className="login-container-wrapper">
        <div className="login-container">
          <div style={{ textAlign: 'center' }}>
            <div className="header-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
              <span>Acceso Restringido • Alta Dirección</span>
            </div>

            {/* LOGO OFICIAL GRUPO HUERTA */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <div style={{
                background: '#ffffff',
                padding: '10px 18px',
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
                  style={{ height: '48px', width: 'auto', objectFit: 'contain' }} 
                />
              </div>
            </div>

            <h2 className="brand-title formal-header-font" style={{ fontSize: '1.65rem' }}>
              Iniciar sesión
            </h2>
            <p className="brand-subtitle" style={{ marginBottom: '1.75rem' }}>
              Accede al portal de la Dirección Jurídica
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Usuario / Correo</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
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
                <span>Recordarme</span>
              </label>
              <a href="#forgot" className="forgot-link" onClick={(e) => e.preventDefault()}>
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <button type="submit" className="btn-executive" disabled={loading}>
              {loading ? (
                <span>Verificando Autenticación...</span>
              ) : (
                <>
                  <span>Iniciar sesión</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="footer-notice">
            <span>Acceso exclusivo para personal autorizado de Grupo Huerta</span>
          </div>
        </div>
      </div>

    </div>
  );
};
