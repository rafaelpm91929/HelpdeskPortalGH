import React, { useState } from 'react';

interface LegalRequest {
  id: string;
  folio: string;
  agencia: string;
  tipo: string;
  titulo: string;
  fecha: string;
  estado: 'En Revisión' | 'En Dictamen' | 'Requiere Información' | 'Concluido';
  prioridad: 'Normal' | 'Urgente';
  respuestaJuridico?: string;
}

export const UserPortal: React.FC<{ onLogout: () => void; onSwitchRole?: () => void }> = ({ onLogout, onSwitchRole }) => {
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LegalRequest | null>(null);

  // Form State
  const [agencia, setAgencia] = useState('Suzuki Montevideo');
  const [tipo, setTipo] = useState('Revisión de Contrato');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState<'Normal' | 'Urgente'>('Normal');
  const [archivos, setArchivos] = useState<string[]>([]);

  // Mock list of user requests
  const [requests, setRequests] = useState<LegalRequest[]>([
    {
      id: '1',
      folio: 'SOL-JUR-089',
      agencia: 'Suzuki Montevideo',
      tipo: 'Revisión de Contrato',
      titulo: 'Contrato de Adhesión Proveedor de Limpieza',
      fecha: '29/08/2026',
      estado: 'En Revisión',
      prioridad: 'Normal',
      respuestaJuridico: 'El Departamento Jurídico está revisando las cláusulas de responsabilidad y penalizaciones.'
    },
    {
      id: '2',
      folio: 'SOL-JUR-076',
      agencia: 'Suzuki Montevideo',
      tipo: 'Poder Notarial',
      titulo: 'Solicitud de Poder para Trámites Vehiculares',
      fecha: '20/08/2026',
      estado: 'Concluido',
      prioridad: 'Urgente',
      respuestaJuridico: 'Poder notarial emitido y enviado a la sucursal el 22/08/2026. Documento original archivado.'
    },
    {
      id: '3',
      folio: 'SOL-JUR-062',
      agencia: 'Suzuki Montevideo',
      tipo: 'Asesoría Legal',
      titulo: 'Dictamen de Garantía de Refacciones',
      fecha: '15/08/2026',
      estado: 'En Dictamen',
      prioridad: 'Normal',
      respuestaJuridico: 'Dictamen preliminar elaborado. En espera de visto bueno del abogado sénior.'
    }
  ]);

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    const newReq: LegalRequest = {
      id: Date.now().toString(),
      folio: `SOL-JUR-${Math.floor(100 + Math.random() * 900)}`,
      agencia,
      tipo,
      titulo,
      fecha: new Date().toLocaleDateString('es-MX'),
      estado: 'En Revisión',
      prioridad,
      respuestaJuridico: 'Solicitud registrada exitosamente. Un abogado revisará tu caso en breve.'
    };

    setRequests([newReq, ...requests]);
    setShowNewModal(false);
    setTitulo('');
    setDescripcion('');
    setArchivos([]);
  };

  const getStatusBadge = (status: LegalRequest['estado']) => {
    switch (status) {
      case 'En Revisión':
        return { bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.4)' };
      case 'En Dictamen':
        return { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.4)' };
      case 'Requiere Información':
        return { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.4)' };
      case 'Concluido':
        return { bg: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: 'rgba(34, 197, 94, 0.4)' };
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto', padding: '1.5rem' }}>
      
      {/* NAVBAR USUARIO */}
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
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div>
            <h2 className="executive-font" style={{ fontSize: '1.2rem', color: '#ffffff' }}>
              PORTAL JURÍDICO
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Atención a Solicitudes Legales • Grupo Huerta
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {onSwitchRole && (
            <button
              onClick={onSwitchRole}
              style={{
                background: 'rgba(197, 160, 89, 0.12)',
                border: '1px solid rgba(197, 160, 89, 0.3)',
                color: '#c5a059',
                padding: '7px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3v18M3 7h18M6 12l-3 5h6l-3-5zm12 0l-3 5h6l-3-5z"/>
              </svg>
              <span>Ver Modo Alta Dirección</span>
            </button>
          )}

          <div style={{ textAlign: 'right', borderLeft: '1px solid #2a364f', paddingLeft: '1rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff' }}>Carlos Ramírez</div>
            <div style={{ fontSize: '0.725rem', color: '#94a3b8' }}>Gerencia • Suzuki Montevideo</div>
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </header>

      {/* BANNER ACCIÓN PRINCIPAL */}
      <div style={{
        background: 'linear-gradient(135deg, #151c28 0%, #1a2332 100%)',
        border: '1px solid #2a364f',
        borderRadius: '12px',
        padding: '1.75rem',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', color: '#ffffff', marginBottom: '0.3rem' }}>
            ¿Necesitas asesoría legal o revisión de un contrato?
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', maxWidth: '600px' }}>
            Registra tu solicitud para que el Departamento Jurídico analice y emita el dictamen correspondiente.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          style={{
            background: 'linear-gradient(135deg, #c5a059, #9b7b38)',
            border: 'none',
            color: '#0b0f17',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 15px rgba(197, 160, 89, 0.25)'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>Nueva Solicitud Legal</span>
        </button>
      </div>

      {/* LISTADO DE SOLICITUDES DEL USUARIO */}
      <div style={{
        background: '#151c28',
        border: '1px solid #2a364f',
        borderRadius: '12px',
        padding: '1.5rem'
      }}>
        <h4 style={{ fontSize: '1.05rem', color: '#ffffff', marginBottom: '1.25rem' }}>
          Mis Solicitudes y Trámites Legales
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {requests.map(item => {
            const badge = getStatusBadge(item.estado);
            return (
              <div
                key={item.id}
                style={{
                  background: '#0b0f17',
                  border: '1px solid #2a364f',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c5a059' }}>{item.folio}</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>• {item.tipo}</span>
                    <span style={{ fontSize: '0.725rem', color: '#64748b' }}>• {item.fecha}</span>
                  </div>

                  <h5 style={{ fontSize: '1rem', color: '#ffffff', fontWeight: 600, marginBottom: '0.3rem' }}>
                    {item.titulo}
                  </h5>

                  <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    Sucursal: <span style={{ color: '#cbd5e1' }}>{item.agencia}</span>
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: badge.bg,
                    color: badge.color,
                    border: `1px solid ${badge.border}`
                  }}>
                    {item.estado}
                  </span>

                  <button
                    onClick={() => setSelectedRequest(item)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid #334155',
                      color: '#cbd5e1',
                      padding: '7px 14px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    Ver Seguimiento
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL NUEVA SOLICITUD */}
      {showNewModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
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
            maxWidth: '600px',
            padding: '1.75rem',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #2a364f', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.15rem', color: '#ffffff' }}>Nueva Solicitud Legal</h3>
              <button onClick={() => setShowNewModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleCreateRequest}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="input-label">Sucursal / Empresa</label>
                  <select 
                    className="custom-input" 
                    value={agencia} 
                    onChange={e => setAgencia(e.target.value)}
                    style={{ paddingLeft: '12px' }}
                  >
                    <option value="Suzuki Montevideo">Suzuki Montevideo</option>
                    <option value="Ford Huerta Vallarta">Ford Huerta Vallarta</option>
                    <option value="Mazda Guadalajara">Mazda Guadalajara</option>
                    <option value="Corporativo Grupo Huerta">Corporativo Grupo Huerta</option>
                  </select>
                </div>

                <div>
                  <label className="input-label">Tipo de Trámite</label>
                  <select 
                    className="custom-input" 
                    value={tipo} 
                    onChange={e => setTipo(e.target.value)}
                    style={{ paddingLeft: '12px' }}
                  >
                    <option value="Revisión de Contrato">Revisión de Contrato</option>
                    <option value="Poder Notarial">Poder Notarial</option>
                    <option value="Asesoría Legal">Asesoría Legal</option>
                    <option value="Convenio Mercantil">Convenio Mercantil</option>
                    <option value="Asunto Laboral">Asunto Laboral</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Título / Asunto Breve</label>
                <input 
                  type="text" 
                  required 
                  className="custom-input" 
                  style={{ paddingLeft: '12px' }}
                  placeholder="Ej: Contrato de Prestación de Servicios de Limpieza"
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Descripción y Antecedentes del Caso</label>
                <textarea 
                  required
                  rows={4}
                  className="custom-input" 
                  style={{ paddingLeft: '12px', resize: 'vertical' }}
                  placeholder="Escriba los detalles relevantes para el abogado..."
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Prioridad del Trámite</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#cbd5e1', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input 
                      type="radio" 
                      name="prioridad" 
                      checked={prioridad === 'Normal'} 
                      onChange={() => setPrioridad('Normal')} 
                    />
                    <span>Normal (3 a 5 días hábiles)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input 
                      type="radio" 
                      name="prioridad" 
                      checked={prioridad === 'Urgente'} 
                      onChange={() => setPrioridad('Urgente')} 
                    />
                    <span>Urgente (Urgencia Operativa)</span>
                  </label>
                </div>
              </div>

              {/* UPLOAD DE ARCHIVOS */}
              <div style={{
                border: '2px dashed #2a364f',
                borderRadius: '8px',
                padding: '1.25rem',
                textAlign: 'center',
                background: '#0b0f17',
                marginBottom: '1.5rem',
                cursor: 'pointer'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ margin: '0 auto 6px auto', display: 'block' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>
                  Adjuntar borrador de contrato o documentos de respaldo (PDF, Word)
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowNewModal(false)}
                  style={{ background: 'transparent', border: '1px solid #475569', color: '#cbd5e1', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  style={{ background: '#c5a059', border: 'none', color: '#0b0f17', padding: '8px 20px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Enviar a Jurídico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALLE DE SEGUIMIENTO */}
      {selectedRequest && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
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
            maxWidth: '540px',
            padding: '1.75rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #2a364f', paddingBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#c5a059', fontWeight: 600 }}>{selectedRequest.folio}</span>
                <h4 style={{ fontSize: '1.1rem', color: '#ffffff' }}>{selectedRequest.titulo}</h4>
              </div>
              <button onClick={() => setSelectedRequest(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ background: '#0b0f17', padding: '1.25rem', borderRadius: '10px', border: '1px solid #2a364f', marginBottom: '1.5rem' }}>
              <span style={{ color: '#c5a059', fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                RESPUESTA Y ESTATUS DEL ABOGADO:
              </span>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                {selectedRequest.respuestaJuridico}
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <button 
                onClick={() => setSelectedRequest(null)}
                style={{ background: '#c5a059', border: 'none', color: '#0b0f17', padding: '8px 18px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
