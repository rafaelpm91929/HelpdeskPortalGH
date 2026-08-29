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
          {/* BARRA FLOTANTE DE SELECCIÓN DE VISTA DE PRUEBA */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.95)',
            borderBottom: '1px solid #334155',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            fontSize: '0.8rem',
            color: '#cbd5e1'
          }}>
            <span>👁️ Modo de Demostración Visual:</span>
            <button
              style={{
                background: '#c5a059',
                color: '#0b0f17',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '4px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              👑 Vista Alta Dirección / Abogados
            </button>
            <button
              onClick={() => setUserRole('user')}
              style={{
                background: 'transparent',
                color: '#94a3b8',
                border: '1px solid #475569',
                padding: '4px 10px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              👤 Cambiar a Vista Usuario / Solicitante
            </button>
          </div>

          <ExecutiveDashboard onLogout={() => setIsLoggedIn(false)} />
        </div>
      ) : (
        <div>
          {/* BARRA FLOTANTE DE SELECCIÓN DE VISTA DE PRUEBA */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.95)',
            borderBottom: '1px solid #334155',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            fontSize: '0.8rem',
            color: '#cbd5e1'
          }}>
            <span>👁️ Modo de Demostración Visual:</span>
            <button
              onClick={() => setUserRole('executive')}
              style={{
                background: 'transparent',
                color: '#94a3b8',
                border: '1px solid #475569',
                padding: '4px 10px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              👑 Cambiar a Vista Alta Dirección / Abogados
            </button>
            <button
              style={{
                background: '#c5a059',
                color: '#0b0f17',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '4px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              👤 Vista Usuario / Solicitante
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
