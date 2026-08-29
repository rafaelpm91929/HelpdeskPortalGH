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
        return { bg: 'rgba(239, 68, 68, 0.12)', color: '#f87171', border: 'rgba(239, 68, 68, 0.35)' };
      case 'En Proceso':
        return { bg: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.35)' };
      case 'Revisión Final':
        return { bg: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.35)' };
      case 'Concluido':
        return { bg: 'rgba(34, 197, 94, 0.12)', color: '#4ade80', border: 'rgba(34, 197, 94, 0.35)' };
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      
      {/* ENCABEZADO FORMAL Y NAVBAR */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#141a24',
        padding: '1.25rem 2rem',
        borderRadius: '8px',
        border: '1px solid #263347',
        marginBottom: '2rem',
        boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.6)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            background: 'rgba(194, 155, 71, 0.08)',
            border: '1px solid rgba(194, 155, 71, 0.25)',
            padding: '10px',
            borderRadius: '6px',
            color: '#c29b47',
            display: 'flex'
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 3v18M3 7h18M6 12l-3 5h6l-3-5zm12 0l-3 5h6l-3-5z"/>
            </svg>
          </div>
          <div>
            <h2 className="formal-header-font" style={{ fontSize: '1.4rem', color: '#ffffff', letterSpacing: '0.03em' }}>
              PORTAL JURÍDICO
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>
              Grupo Huerta — Dirección de Asuntos Corporativos
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* BOTÓN CONMUTADOR FORMAL */}
          <button 
            onClick={() => alert('Redirigiendo al Portal de Agencias (Helpdesk)...')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#19212d',
              border: '1px solid #334155',
              color: '#cbd5e1',
              padding: '9px 16px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              cursor: 'pointer',
              fontWeight: 500,
              fontFamily: 'Montserrat, sans-serif',
              transition: 'all 0.2s'
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
            <span>Cambiar a Portal Agencias</span>
          </button>

          {/* PERFIL FORMAL & SALIR */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '1px solid #263347', paddingLeft: '1.25rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff', fontFamily: 'Montserrat, sans-serif' }}>
                Dirección General
              </div>
              <div style={{ fontSize: '0.725rem', color: '#c29b47', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Alta Dirección
              </div>
            </div>
            <button 
              onClick={onLogout}
              title="Cerrar Sesión"
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#f87171',
                padding: '9px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* TARJETAS KPI INSTITUCIONALES */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        {/* KPI 1 */}
        <div style={{
          background: '#141a24',
          border: '1px solid #263347',
          padding: '1.35rem',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '0.725rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', fontFamily: 'Montserrat, sans-serif' }}>
            Expedientes Activos
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 700, color: '#ffffff', fontFamily: 'Cormorant Garamond, serif' }}>
            12 <span style={{ fontSize: '0.85rem', color: '#60a5fa', fontWeight: 400, fontFamily: 'Inter, sans-serif' }}>Asuntos</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.4rem' }}>
            2 expedientes asignados esta semana
          </div>
        </div>

        {/* KPI 2 */}
        <div style={{
          background: '#141a24',
          border: '1px solid #263347',
          padding: '1.35rem',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '0.725rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', fontFamily: 'Montserrat, sans-serif' }}>
            Contratos en Revisión
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 700, color: '#ffffff', fontFamily: 'Cormorant Garamond, serif' }}>
            5 <span style={{ fontSize: '0.85rem', color: '#fbbf24', fontWeight: 400, fontFamily: 'Inter, sans-serif' }}>Documentos</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#fbbf24', marginTop: '0.4rem' }}>
            1 pendiente de firma corporativa
          </div>
        </div>

        {/* KPI 3 */}
        <div style={{
          background: '#141a24',
          border: '1px solid #263347',
          padding: '1.35rem',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '0.725rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', fontFamily: 'Montserrat, sans-serif' }}>
            Cumplimiento & Auditoría
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 700, color: '#4ade80', fontFamily: 'Cormorant Garamond, serif' }}>
            98.5%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.4rem' }}>
            Índice de conformidad normativa
          </div>
        </div>

        {/* KPI 4 */}
        <div style={{
          background: '#141a24',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          padding: '1.35rem',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '0.725rem', color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', fontFamily: 'Montserrat, sans-serif' }}>
            Atención Prioritaria
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 700, color: '#f87171', fontFamily: 'Cormorant Garamond, serif' }}>
            1 <span style={{ fontSize: '0.85rem', fontWeight: 400, fontFamily: 'Inter, sans-serif' }}>Asunto Urgente</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.4rem' }}>
            Requiere dictamen hoy
          </div>
        </div>
      </div>

      {/* TABLA FORMAL DE EXPEDIENTES */}
      <div style={{
        background: '#141a24',
        border: '1px solid #263347',
        borderRadius: '8px',
        padding: '1.75rem'
      }}>
        {/* ENCABEZADO Y FILTROS */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid #263347'
        }}>
          <div>
            <h3 className="formal-header-font" style={{ fontSize: '1.25rem', color: '#ffffff', marginBottom: '0.2rem' }}>
              Expedientes Legales y Dictámenes Corporativos
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Registro central de asuntos procesados por la Dirección Jurídica
            </p>
          </div>

          {/* FILTROS POR MATERIA */}
          <div style={{ display: 'flex', gap: '6px', background: '#0b0e14', padding: '4px', borderRadius: '6px', border: '1px solid #263347' }}>
            {(['todos', 'Corporativo', 'Mercantil', 'Laboral', 'Contratos'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: activeTab === tab ? '#19212d' : 'transparent',
                  border: activeTab === tab ? '1px solid #334155' : 'none',
                  color: activeTab === tab ? '#c29b47' : '#94a3b8',
                  padding: '6px 14px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  fontFamily: 'Montserrat, sans-serif',
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
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #263347', color: '#94a3b8', fontSize: '0.725rem', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.04em' }}>
                <th style={{ padding: '12px' }}>Folio</th>
                <th style={{ padding: '12px' }}>Empresa / Agencia</th>
                <th style={{ padding: '12px' }}>Asunto Legal</th>
                <th style={{ padding: '12px' }}>Materia</th>
                <th style={{ padding: '12px' }}>Abogado Asignado</th>
                <th style={{ padding: '12px' }}>Estatus</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map(item => {
                const badge = getStatusBadge(item.estado);
                return (
                  <tr 
                    key={item.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'background 0.2s'
                    }}
                  >
                    <td style={{ padding: '14px 12px', fontWeight: 600, color: '#c29b47', fontFamily: 'Montserrat, sans-serif' }}>{item.folio}</td>
                    <td style={{ padding: '14px 12px', color: '#ffffff', fontWeight: 500 }}>{item.agencia}</td>
                    <td style={{ padding: '14px 12px', color: '#cbd5e1', maxWidth: '300px' }}>{item.tipo}</td>
                    <td style={{ padding: '14px 12px', color: '#94a3b8' }}>{item.materia}</td>
                    <td style={{ padding: '14px 12px', color: '#cbd5e1' }}>{item.abogado}</td>
                    <td style={{ padding: '14px 12px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        fontFamily: 'Montserrat, sans-serif',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
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
                          background: 'rgba(194, 155, 71, 0.08)',
                          border: '1px solid rgba(194, 155, 71, 0.25)',
                          color: '#c29b47',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontFamily: 'Montserrat, sans-serif',
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
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.82)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '1rem'
        }}>
          <div style={{
            background: '#141a24',
            border: '1px solid #263347',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '580px',
            padding: '2rem',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.9)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid #263347', paddingBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#c29b47', fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }}>{selectedCase.folio}</span>
                <h3 className="formal-header-font" style={{ fontSize: '1.35rem', color: '#ffffff', marginTop: '2px' }}>{selectedCase.tipo}</h3>
              </div>
              <button 
                onClick={() => setSelectedCase(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.725rem', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Empresa / Sucursal</span>
                <strong style={{ color: '#ffffff' }}>{selectedCase.agencia}</strong>
              </div>
              <div>
                <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.725rem', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Abogado Asignado</span>
                <strong style={{ color: '#ffffff' }}>{selectedCase.abogado}</strong>
              </div>
              <div>
                <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.725rem', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Materia Legal</span>
                <strong style={{ color: '#ffffff' }}>{selectedCase.materia}</strong>
              </div>
              <div>
                <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.725rem', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Fecha de Registro</span>
                <strong style={{ color: '#ffffff' }}>{selectedCase.fecha}</strong>
              </div>
            </div>

            <div style={{ background: '#0b0e14', padding: '1.25rem', borderRadius: '6px', border: '1px solid #263347', marginBottom: '1.5rem' }}>
              <span style={{ color: '#c29b47', fontSize: '0.725rem', fontWeight: 600, textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif', display: 'block', marginBottom: '0.5rem' }}>
                Documentación y Dictamen Corporativo
              </span>
              <p style={{ fontSize: '0.825rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                • Expediente_Contrato_Firmado.pdf (2.4 MB)<br/>
                • Dictamen_Preliminar_Riesgos.docx (1.1 MB)
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <button
                onClick={() => setSelectedCase(null)}
                style={{
                  background: '#c29b47',
                  border: 'none',
                  color: '#0b0e14',
                  padding: '9px 20px',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  fontFamily: 'Montserrat, sans-serif',
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
