import React, { useState } from 'react';
import { ExecutiveLogin } from './components/ExecutiveLogin';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { LawyerPortal } from './components/LawyerPortal';
import { UserPortal } from './components/UserPortal';

export const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<'executive' | 'lawyer' | 'user'>('executive');

  return (
    <main>
      {!isLoggedIn ? (
        <ExecutiveLogin onLoginSuccess={() => setIsLoggedIn(true)} />
      ) : (
        <div>
          {/* BARRA SUPERIOR DE SELECCIÓN DE ENTORNO / ROL (PRUEBAS Y DEMOSTRACIÓN) */}
          <div style={{
            background: '#141a24',
            borderBottom: '1px solid #263347',
            padding: '8px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            fontSize: '0.775rem',
            color: '#94a3b8',
            fontFamily: 'Montserrat, sans-serif',
            letterSpacing: '0.02em',
            flexWrap: 'wrap'
          }}>
            <span style={{ textTransform: 'uppercase', fontWeight: 600, color: '#64748b' }}>
              Demostración de Accesos por Rol:
            </span>

            {/* BOTON ROL 1: ALTA DIRECCION / ADMIN */}
            <button
              onClick={() => setUserRole('executive')}
              style={{
                background: userRole === 'executive' ? '#c29b47' : 'transparent',
                color: userRole === 'executive' ? '#0b0e14' : '#cbd5e1',
                border: userRole === 'executive' ? 'none' : '1px solid #334155',
                padding: '4px 14px',
                borderRadius: '4px',
                fontWeight: userRole === 'executive' ? 700 : 500,
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              👑 Vista Admin (Alta Dirección)
            </button>

            {/* BOTON ROL 2: ABOGADO RESOLUTOR */}
            <button
              onClick={() => setUserRole('lawyer')}
              style={{
                background: userRole === 'lawyer' ? '#c29b47' : 'transparent',
                color: userRole === 'lawyer' ? '#0b0e14' : '#cbd5e1',
                border: userRole === 'lawyer' ? 'none' : '1px solid #334155',
                padding: '4px 14px',
                borderRadius: '4px',
                fontWeight: userRole === 'lawyer' ? 700 : 500,
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              ⚖️ Vista Abogado (Expedientes Asignados & Calendario)
            </button>

            {/* BOTON ROL 3: USUARIO / SOLICITANTE */}
            <button
              onClick={() => setUserRole('user')}
              style={{
                background: userRole === 'user' ? '#c29b47' : 'transparent',
                color: userRole === 'user' ? '#0b0e14' : '#cbd5e1',
                border: userRole === 'user' ? 'none' : '1px solid #334155',
                padding: '4px 14px',
                borderRadius: '4px',
                fontWeight: userRole === 'user' ? 700 : 500,
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              🏢 Vista Usuario (Solicitante de Sucursal)
            </button>
          </div>

          {/* RENDERIZADO DEL COMPONENTE SEGÚN EL ROL SELECCIONADO */}
          {userRole === 'executive' ? (
            <ExecutiveDashboard onLogout={() => setIsLoggedIn(false)} />
          ) : userRole === 'lawyer' ? (
            <LawyerPortal onLogout={() => setIsLoggedIn(false)} onSwitchRole={role => setUserRole(role)} />
          ) : (
            <UserPortal onLogout={() => setIsLoggedIn(false)} onSwitchRole={() => setUserRole('executive')} />
          )}
        </div>
      )}
    </main>
  );
};

export default App;
