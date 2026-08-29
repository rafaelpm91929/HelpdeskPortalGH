import React, { useState } from 'react';
import { ExecutiveLogin } from './components/ExecutiveLogin';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { UserPortal } from './components/UserPortal';

export const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<'executive' | 'user'>('executive');

  return (
    <main>
      {!isLoggedIn ? (
        <ExecutiveLogin onLoginSuccess={() => setIsLoggedIn(true)} />
      ) : userRole === 'executive' ? (
        <div>
          {/* BARRA FLOTANTE INSTITUCIONAL DE SELECCIÓN DE VISTA */}
          <div style={{
            background: '#141a24',
            borderBottom: '1px solid #263347',
            padding: '8px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            fontSize: '0.775rem',
            color: '#94a3b8',
            fontFamily: 'Montserrat, sans-serif',
            letterSpacing: '0.02em'
          }}>
            <span style={{ textTransform: 'uppercase', fontWeight: 600, color: '#64748b' }}>
              Entorno de Pruebas:
            </span>
            <button
              style={{
                background: '#c29b47',
                color: '#0b0e14',
                border: 'none',
                padding: '4px 12px',
                borderRadius: '4px',
                fontWeight: 700,
                fontSize: '0.75rem',
                cursor: 'default',
                letterSpacing: '0.02em'
              }}
            >
              Alta Dirección y Dirección Jurídica
            </button>
            <button
              onClick={() => setUserRole('user')}
              style={{
                background: 'transparent',
                color: '#cbd5e1',
                border: '1px solid #334155',
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Cambiar a Vista Colaborador / Solicitante
            </button>
          </div>

          <ExecutiveDashboard onLogout={() => setIsLoggedIn(false)} />
        </div>
      ) : (
        <div>
          {/* BARRA FLOTANTE INSTITUCIONAL DE SELECCIÓN DE VISTA */}
          <div style={{
            background: '#141a24',
            borderBottom: '1px solid #263347',
            padding: '8px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            fontSize: '0.775rem',
            color: '#94a3b8',
            fontFamily: 'Montserrat, sans-serif',
            letterSpacing: '0.02em'
          }}>
            <span style={{ textTransform: 'uppercase', fontWeight: 600, color: '#64748b' }}>
              Entorno de Pruebas:
            </span>
            <button
              onClick={() => setUserRole('executive')}
              style={{
                background: 'transparent',
                color: '#cbd5e1',
                border: '1px solid #334155',
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Cambiar a Alta Dirección y Dirección Jurídica
            </button>
            <button
              style={{
                background: '#c29b47',
                color: '#0b0e14',
                border: 'none',
                padding: '4px 12px',
                borderRadius: '4px',
                fontWeight: 700,
                fontSize: '0.75rem',
                cursor: 'default',
                letterSpacing: '0.02em'
              }}
            >
              Vista Colaborador / Solicitante
            </button>
          </div>

          <UserPortal 
            onLogout={() => setIsLoggedIn(false)} 
            onSwitchRole={() => setUserRole('executive')}
          />
        </div>
      )}
    </main>
  );
};

export default App;
