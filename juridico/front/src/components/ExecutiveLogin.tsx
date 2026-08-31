import React, { useState } from 'react';
import logoGrupoHuerta from '../assets/logo_grupo_huerta.jpg';
import logoVw from '../assets/logo_vw.png';
import logoSeatCupra from '../assets/logo_seat_cupra.png';
import logoSuzuki from '../assets/logo_suzuki.png';
import logoGeely from '../assets/logo_geely.png';
import logoChireyOmoda from '../assets/logo_chirey_omoda.png';
import logoChangan from '../assets/logo_changan.png';

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
      <div className="login-content-centered">
        
        {/* SECCIÓN IZQUIERDA: HERO CON LOGO GRUPO HUERTA AL CENTRO Y MARCAS EN GRANDE */}
        <div className="login-hero-section">
          <div className="hero-glass-card" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
            
            {/* LOGO DE GRUPO HUERTA AL CENTRO Y DESTACADO */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <div style={{
                background: '#ffffff',
                padding: '12px 28px',
                borderRadius: '12px',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
                border: '2px solid #c29b47',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img 
                  src={logoGrupoHuerta} 
                  alt="Grupo Huerta" 
                  style={{ height: '62px', width: 'auto', objectFit: 'contain' }} 
                />
              </div>
            </div>

            <div className="hero-brand-tag" style={{ fontSize: '0.85rem', letterSpacing: '0.12em' }}>GRUPO HUERTA</div>
            <h1 className="hero-title formal-header-font" style={{ fontSize: '2.2rem', marginBottom: '0.75rem' }}>Portal Jurídico</h1>
            <p className="hero-description" style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '2rem' }}>
              Gestión corporativa, atención de dictámenes y estado de cumplimiento legal de todas las sucursales del grupo.
            </p>

            {/* RETÍCULA DE MARCAS AUTOMOTRICES GRANDES SIN TEXTOS PENDIENTES */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.45)',
              border: '1px solid rgba(194, 155, 71, 0.35)',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3)'
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: '#c29b47',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 700,
                fontFamily: 'Montserrat, sans-serif',
                marginBottom: '1.25rem',
                textAlign: 'center'
              }}>
                MARCAS OFICIALES DEL GRUPO
              </div>

              {/* GRID DE LOGOTIPOS GRANDES (SUZUKI, VW, SEAT/CUPRA, GEELY, CHIREY/OMODA/JAECOO, CHANGAN) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '14px',
                alignItems: 'center'
              }}>
                <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #c29b47', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '52px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                  <img src={logoSuzuki} alt="Suzuki" style={{ maxHeight: '38px', maxWidth: '100%', objectFit: 'contain' }} />
                </div>

                <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #c29b47', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '52px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                  <img src={logoVw} alt="Volkswagen" style={{ maxHeight: '38px', maxWidth: '100%', objectFit: 'contain' }} />
                </div>

                <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #c29b47', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '52px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                  <img src={logoSeatCupra} alt="SEAT Cupra" style={{ maxHeight: '38px', maxWidth: '100%', objectFit: 'contain' }} />
                </div>

                <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #c29b47', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '52px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                  <img src={logoGeely} alt="Geely" style={{ maxHeight: '38px', maxWidth: '100%', objectFit: 'contain' }} />
                </div>

                <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #c29b47', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '52px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                  <img src={logoChireyOmoda} alt="Chirey Omoda Jaecoo" style={{ maxHeight: '38px', maxWidth: '100%', objectFit: 'contain' }} />
                </div>

                <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #c29b47', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '52px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                  <img src={logoChangan} alt="Changan Auto" style={{ maxHeight: '38px', maxWidth: '100%', objectFit: 'contain' }} />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* SECCIÓN DERECHA: TARJETA DE LOGIN CRISTAL CENTRADA */}
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

              {/* LOGO OFICIAL GRUPO HUERTA EN CABECERA DE LOGIN */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <div style={{
                  background: '#ffffff',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)',
                  border: '1px solid #c29b47',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img 
                    src={logoGrupoHuerta} 
                    alt="Grupo Huerta" 
                    style={{ height: '44px', width: 'auto', objectFit: 'contain' }} 
                  />
                </div>
              </div>

              <h2 className="brand-title formal-header-font" style={{ fontSize: '1.6rem' }}>
                Iniciar sesión
              </h2>
              <p className="brand-subtitle" style={{ marginBottom: '1.5rem' }}>
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
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
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

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', fontSize: '0.8rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', cursor: 'pointer' }}>
                  <input type="checkbox" defaultChecked style={{ accentColor: '#c29b47' }} />
                  Recordar credenciales
                </label>
                <a href="#forgot" onClick={(e) => e.preventDefault()} style={{ color: '#c29b47', textDecoration: 'none' }}>
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="gold-btn-gradient"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  fontFamily: 'Montserrat, sans-serif'
                }}
              >
                {loading ? 'AUTENTICANDO...' : 'INGRESAR AL PORTAL'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};
