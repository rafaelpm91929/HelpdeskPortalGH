import React, { useState } from 'react';

interface CaseItem {
  id: string;
  folio: string;
  agencia: string;
  tipo: string;
  materia: 'Corporativo' | 'Mercantil' | 'Laboral' | 'Contratos';
  estado: 'En Proceso' | 'Revisión Final' | 'Concluido' | 'Urgente';
  abogado: string;
  fecha: string;
}

export const ExecutiveDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'todos' | 'Corporativo' | 'Mercantil' | 'Laboral' | 'Contratos'>('todos');
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);

  const mockCases: CaseItem[] = [
    {
      id: '1',
      folio: 'JUR-2026-042',
      agencia: 'Suzuki Montevideo',
      tipo: 'Revisión de Contrato de Arrendamiento Comercial',
      materia: 'Contratos',
      estado: 'Urgente',
      abogado: 'Lic. Mariana Fernández',
      fecha: '28/08/2026'
    },
    {
      id: '2',
      folio: 'JUR-2026-041',
      agencia: 'Ford Huerta Vallarta',
      tipo: 'Auditoría Anual de Cumplimiento Normativo',
      materia: 'Corporativo',
      estado: 'Revisión Final',
      abogado: 'Lic. Roberto Garza',
      fecha: '27/08/2026'
    },
    {
      id: '3',
      folio: 'JUR-2026-039',
      agencia: 'Corporativo Grupo Huerta',
      tipo: 'Convenio de Confidencialidad y Propiedad Intelectual',
      materia: 'Mercantil',
      estado: 'En Proceso',
      abogado: 'Lic. Carlos Mendoza',
      fecha: '25/08/2026'
    },
    {
      id: '4',
      folio: 'JUR-2026-038',
      agencia: 'Mazda Guadalajara',
      tipo: 'Dictamen de Estructura Societaria y Poderes',
      materia: 'Corporativo',
      estado: 'Concluido',
      abogado: 'Lic. Mariana Fernández',
      fecha: '22/08/2026'
    },
    {
      id: '5',
      folio: 'JUR-2026-035',
      agencia: 'Honda Grupo Huerta',
      tipo: 'Rescisión y Finiquito de Contrato Proveedor Tecnológico',
      materia: 'Laboral',
      estado: 'En Proceso',
      abogado: 'Lic. Roberto Garza',
      fecha: '20/08/2026'
    }
  ];

  const filteredCases = activeTab === 'todos' 
    ? mockCases 
    : mockCases.filter(c => c.materia === activeTab);

  const getStatusBadge = (status: CaseItem['estado']) => {
    switch (status) {
      case 'Urgente':
        return { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.4)' };
      case 'En Proceso':
        return { bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.4)' };
      case 'Revisión Final':
        return { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.4)' };
      case 'Concluido':
        return { bg: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: 'rgba(34, 197, 94, 0.4)' };
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>
      
      {/* NAVBAR SUPERIOR EJECUTIVA */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#151c28',
        padding: '1rem 1.75rem',
        borderRadius: '12px',
        border: '1px solid #2a364f',
        marginBottom: '2rem',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            background: 'rgba(197, 160, 89, 0.12)',
            border: '1px solid rgba(197, 160, 89, 0.3)',
            padding: '8px',
            borderRadius: '8px',
            color: '#c5a059',
            display: 'flex'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 3v18M3 7h18M6 12l-3 5h6l-3-5zm12 0l-3 5h6l-3-5z"/>
            </svg>
          </div>
          <div>
            <h2 className="executive-font" style={{ fontSize: '1.25rem', color: '#ffffff', letterSpacing: '0.5px' }}>
              PORTAL JURÍDICO
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Grupo Huerta • Panel de Alta Dirección
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* BOTÓN CONMUTADOR DE PORTAL */}
          <button 
            onClick={() => alert('Redirigiendo al Portal de Agencias (Helpdesk)...')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid #334155',
              color: '#cbd5e1',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.825rem',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
            <span>🏢 Cambiar a Portal Agencias</span>
          </button>

          {/* USUARIO EJECUTIVO & SALIR */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '1px solid #2a364f', paddingLeft: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f1f5f9' }}>Dirección General</div>
              <div style={{ fontSize: '0.725rem', color: '#c5a059' }}>Alta Dirección</div>
            </div>
            <button 
              onClick={onLogout}
              title="Cerrar Sesión"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                padding: '8px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* METRICAS KPI DE ALTA DIRECCIÓN */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        {/* KPI 1 */}
        <div style={{
          background: '#151c28',
          border: '1px solid #2a364f',
          padding: '1.25rem',
          borderRadius: '12px',
          position: 'relative'
        }}>
          <div style={{ fontSize: '0.775rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>
            Expedientes Activos
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#ffffff' }}>12 <span style={{ fontSize: '0.9rem', color: '#60a5fa', fontWeight: 400 }}>Casos</span></div>
          <div style={{ fontSize: '0.75rem', color: '#4ade80', marginTop: '0.4rem' }}>↑ 2 asignados esta semana</div>
        </div>

        {/* KPI 2 */}
        <div style={{
          background: '#151c28',
          border: '1px solid #2a364f',
          padding: '1.25rem',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '0.775rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>
            Contratos en Revisión
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#ffffff' }}>5 <span style={{ fontSize: '0.9rem', color: '#fbbf24', fontWeight: 400 }}>Documentos</span></div>
          <div style={{ fontSize: '0.75rem', color: '#fbbf24', marginTop: '0.4rem' }}>⏱ 1 listo para firma</div>
        </div>

        {/* KPI 3 */}
        <div style={{
          background: '#151c28',
          border: '1px solid #2a364f',
          padding: '1.25rem',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '0.775rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>
            Cumplimiento & Auditoría
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#4ade80' }}>98.5%</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.4rem' }}>Estatus Normativo OK</div>
        </div>

        {/* KPI 4 */}
        <div style={{
          background: '#151c28',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          padding: '1.25rem',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '0.775rem', color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>
            Atención Prioritaria
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f87171' }}>1 <span style={{ fontSize: '0.9rem', fontWeight: 400 }}>Asunto Urgente</span></div>
          <div style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.4rem' }}>Requiere dictamen hoy</div>
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL: TABLA DE EXPEDIENTES */}
      <div style={{
        background: '#151c28',
        border: '1px solid #2a364f',
        borderRadius: '12px',
        padding: '1.5rem'
      }}>
        {/* ENCABEZADO DE TABLA Y PESTAÑAS */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #2a364f'
        }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: '#ffffff', fontWeight: 600, marginBottom: '0.2rem' }}>
              Expedientes Legales y Asuntos Corporativos
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Listado de asuntos asignados a la Dirección Jurídica
            </p>
          </div>

          {/* FILTROS POR MATERIA */}
          <div style={{ display: 'flex', gap: '6px', background: '#0b0f17', padding: '4px', borderRadius: '8px' }}>
            {(['todos', 'Corporativo', 'Mercantil', 'Laboral', 'Contratos'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: activeTab === tab ? '#1e293b' : 'transparent',
                  border: 'none',
                  color: activeTab === tab ? '#c5a059' : '#94a3b8',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.775rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {tab === 'todos' ? 'Todos los Asuntos' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* TABLA DE ASUNTOS */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2a364f', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px' }}>Folio</th>
                <th style={{ padding: '12px' }}>Empresa / Agencia</th>
                <th style={{ padding: '12px' }}>Asunto Legal</th>
                <th style={{ padding: '12px' }}>Materia</th>
                <th style={{ padding: '12px' }}>Abogado Asignado</th>
                <th style={{ padding: '12px' }}>Estatus</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map(item => {
                const badge = getStatusBadge(item.estado);
                return (
                  <tr 
                    key={item.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'background 0.2s'
                    }}
                  >
                    <td style={{ padding: '14px 12px', fontWeight: 600, color: '#c5a059' }}>{item.folio}</td>
                    <td style={{ padding: '14px 12px', color: '#ffffff', fontWeight: 500 }}>{item.agencia}</td>
                    <td style={{ padding: '14px 12px', color: '#cbd5e1', maxWidth: '280px' }}>{item.tipo}</td>
                    <td style={{ padding: '14px 12px', color: '#94a3b8' }}>{item.materia}</td>
                    <td style={{ padding: '14px 12px', color: '#cbd5e1' }}>{item.abogado}</td>
                    <td style={{ padding: '14px 12px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.725rem',
                        fontWeight: 600,
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`
                      }}>
                        {item.estado}
                      </span>
                    </td>
                    <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedCase(item)}
                        style={{
                          background: 'rgba(197, 160, 89, 0.1)',
                          border: '1px solid rgba(197, 160, 89, 0.3)',
                          color: '#c5a059',
                          padding: '5px 12px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        Ver Detalle
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DETALLE DE CASO */}
      {selectedCase && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '1rem'
        }}>
          <div style={{
            background: '#151c28',
            border: '1px solid #2a364f',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '560px',
            padding: '1.75rem',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #2a364f', paddingBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#c5a059', fontWeight: 600 }}>{selectedCase.folio}</span>
                <h3 style={{ fontSize: '1.2rem', color: '#ffffff', marginTop: '2px' }}>{selectedCase.tipo}</h3>
              </div>
              <button 
                onClick={() => setSelectedCase(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>Empresa / Sucursal:</span>
                <strong style={{ color: '#ffffff' }}>{selectedCase.agencia}</strong>
              </div>
              <div>
                <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>Abogado Asignado:</span>
                <strong style={{ color: '#ffffff' }}>{selectedCase.abogado}</strong>
              </div>
              <div>
                <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>Materia:</span>
                <strong style={{ color: '#ffffff' }}>{selectedCase.materia}</strong>
              </div>
              <div>
                <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>Fecha de Registro:</span>
                <strong style={{ color: '#ffffff' }}>{selectedCase.fecha}</strong>
              </div>
            </div>

            <div style={{ background: '#0b0f17', padding: '1rem', borderRadius: '8px', border: '1px solid #2a364f', marginBottom: '1.5rem' }}>
              <span style={{ color: '#c5a059', fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                DOCUMENTACIÓN ADJUNTA Y DICTAMEN:
              </span>
              <p style={{ fontSize: '0.825rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                📄 Expediente_Contrato_Firmado.pdf (2.4 MB)<br/>
                ⚖️ Dictamen_Preliminar_Riesgos.docx (1.1 MB)
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <button
                onClick={() => setSelectedCase(null)}
                style={{
                  background: '#c5a059',
                  border: 'none',
                  color: '#0b0f17',
                  padding: '8px 18px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cerrar Expediente
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
