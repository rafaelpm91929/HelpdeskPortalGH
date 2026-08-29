import React, { useState } from 'react';

interface UserTicket {
  id: string;
  folio: string;
  agencia: string;
  tipo: 'RH' | 'DEMANDA' | 'SOLICITUD' | 'CONTRATO';
  titulo: string;
  correosCopia: string;
  descripcion: string;
  fechaCreacion: string;
  diasAbierto: number;
  estado: 'En Revisión' | 'En Dictamen' | 'Requiere Información' | 'Concluido';
  prioridad: 'Normal' | 'Urgente';
  documentos: string[];
  historial: { fecha: string; autor: string; mensaje: string }[];
}

export const UserPortal: React.FC<{ onLogout: () => void; onSwitchRole?: () => void }> = ({ onLogout, onSwitchRole }) => {
  const [activeView, setActiveView] = useState<'lista' | 'nuevo' | 'detalle' | 'perfil'>('lista');
  const [selectedTicket, setSelectedTicket] = useState<UserTicket | null>(null);

  // Form State
  const [empresaUsuario] = useState('Divol Norte');
  const [usuarioNombre] = useState('Ing. Carlos Mendoza');
  const [usuarioCorreo] = useState('cmendoza@divol.com');
  const [usuarioCargo] = useState<'Gerente General' | 'Gerente Administrativo' | 'Recursos Humanos'>('Gerente Administrativo');
  
  const [tipo, setTipo] = useState<UserTicket['tipo']>('CONTRATO');
  const [correosCopia, setCorreosCopia] = useState('gerencia@divol.com, contabilidad@divol.com');
  const [asunto, setAsunto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState<'Normal' | 'Urgente'>('Normal');
  const [archivosSimulados, setArchivosSimulados] = useState<string[]>([]);

  // List of user's tickets with full cronological history
  const [myTickets, setMyTickets] = useState<UserTicket[]>([
    {
      id: '1',
      folio: 'SOL-JUR-089',
      agencia: 'Divol Norte',
      tipo: 'DEMANDA',
      titulo: 'Notificación Mercantil de Juicio Ejecutivo',
      correosCopia: 'gerencia@divol.com, contabilidad@divol.com',
      descripcion: 'Se recibió emplazamiento respecto al expediente mercantil 402/2026. Se requiere contestación de demanda antes del 02/09/2026.',
      fechaCreacion: '20/08/2026',
      diasAbierto: 9,
      estado: 'En Dictamen',
      prioridad: 'Urgente',
      documentos: ['Emplazamiento_Notificacion.pdf', 'Anexo_Documental.pdf'],
      historial: [
        { fecha: '20/08/2026 09:30', autor: 'Carlos Mendoza (Gerente Admin)', mensaje: 'Se registró la solicitud inicial adjuntando la cédula de notificación judicial.' },
        { fecha: '20/08/2026 14:15', autor: 'Lic. Mariana Fernández (Dirección Jurídica)', mensaje: 'Solicitud recibida. Asunto clasificado como Prioridad Alta y asignado a expediente JUR-2026-089.' },
        { fecha: '21/08/2026 11:00', autor: 'Lic. Mariana Fernández (Dirección Jurídica)', mensaje: 'Se formuló la contestación de la demanda. En proceso de certificación notarial de poderes.' }
      ]
    },
    {
      id: '2',
      folio: 'SOL-JUR-076',
      agencia: 'Divol Norte',
      tipo: 'RH',
      titulo: 'Rescisión y Finiquito por Abandono de Empleo',
      correosCopia: 'rh@divol.com, gerencia@divol.com',
      descripcion: 'Solicitud de convenio de rescisión laboral sin responsabilidad patronal por inasistencias consecutivas.',
      fechaCreacion: '25/08/2026',
      diasAbierto: 4,
      estado: 'En Revisión',
      prioridad: 'Normal',
      documentos: ['Acta_Administrativa.pdf'],
      historial: [
        { fecha: '25/08/2026 10:00', autor: 'Carlos Mendoza (Gerente Admin)', mensaje: 'Ingreso de acta administrativa para cálculo de liquidación.' },
        { fecha: '26/08/2026 16:45', autor: 'Lic. Roberto Garza (Dirección Jurídica)', mensaje: 'Convenio de finiquito elaborado y disponible para su firma.' }
      ]
    }
  ]);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!asunto.trim() || !descripcion.trim()) return;

    const newT: UserTicket = {
      id: Date.now().toString(),
      folio: `SOL-JUR-${Math.floor(100 + Math.random() * 900)}`,
      agencia: empresaUsuario,
      tipo,
      titulo: asunto,
      correosCopia,
      descripcion,
      fechaCreacion: new Date().toLocaleDateString('es-MX'),
      diasAbierto: 0,
      estado: 'En Revisión',
      prioridad,
      documentos: archivosSimulados.length > 0 ? archivosSimulados : ['Expediente_Borrador_Legal.pdf'],
      historial: [
        { 
          fecha: `${new Date().toLocaleDateString('es-MX')} ${new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`,
          autor: `${usuarioNombre} (${usuarioCargo})`,
          mensaje: 'Registro de solicitud enviado con copias a las direcciones especificadas.'
        }
      ]
    };

    setMyTickets([newT, ...myTickets]);
    setActiveView('lista');
    setAsunto('');
    setDescripcion('');
    setArchivosSimulados([]);
  };

  return (
    <div style={{ width: '100%', maxWidth: '1150px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      
      {/* NAVBAR USUARIO */}
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
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div>
            <h2 className="formal-header-font" style={{ fontSize: '1.35rem', color: '#ffffff', letterSpacing: '0.03em' }}>
              PORTAL JURÍDICO
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>
              Recepción de Trámites Legales — Grupo Huerta
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {onSwitchRole && (
            <button
              onClick={onSwitchRole}
              style={{
                background: 'rgba(194, 155, 71, 0.08)',
                border: '1px solid rgba(194, 155, 71, 0.25)',
                color: '#c29b47',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '0.775rem',
                fontFamily: 'Montserrat, sans-serif',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Ver Alta Dirección
            </button>
          )}

          {/* PERFIL / INFORMACION DEL USUARIO */}
          <div 
            onClick={() => setActiveView('perfil')}
            style={{ 
              textAlign: 'right', 
              borderLeft: '1px solid #263347', 
              paddingLeft: '1.25rem',
              cursor: 'pointer' 
            }}
            title="Ver Mi Perfil e Información de Usuario"
          >
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff', fontFamily: 'Montserrat, sans-serif', textDecoration: 'underline' }}>{usuarioNombre}</div>
            <div style={{ fontSize: '0.725rem', color: '#c29b47', textTransform: 'uppercase' }}>{usuarioCargo} • {empresaUsuario}</div>
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
      </header>

      {/* VISTA 1: MI PERFIL / INFORMACION DE USUARIO */}
      {activeView === 'perfil' ? (
        <div>
          <button
            onClick={() => setActiveView('lista')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#19212d',
              border: '1px solid #334155',
              color: '#cbd5e1',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              cursor: 'pointer',
              marginBottom: '1.5rem',
              fontFamily: 'Montserrat, sans-serif'
            }}
          >
            ← Volver a Mis Solicitudes
          </button>

          <div style={{ background: '#141a24', border: '1px solid #263347', borderRadius: '8px', padding: '2.25rem' }}>
            <div style={{ borderBottom: '1px solid #263347', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h3 className="formal-header-font" style={{ fontSize: '1.4rem', color: '#ffffff' }}>
                Información y Perfil de Usuario Autorizado
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Datos institucionales registrados para el envío y recepción de trámites legales
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', background: '#0b0e14', padding: '1.5rem', borderRadius: '6px', border: '1px solid #263347' }}>
              <div>
                <span style={{ fontSize: '0.725rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Nombre Completo</span>
                <div style={{ fontSize: '1rem', color: '#ffffff', fontWeight: 600, marginTop: '4px' }}>{usuarioNombre}</div>
              </div>

              <div>
                <span style={{ fontSize: '0.725rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Correo Institucional</span>
                <div style={{ fontSize: '0.95rem', color: '#c29b47', fontWeight: 600, marginTop: '4px' }}>{usuarioCorreo}</div>
              </div>

              <div>
                <span style={{ fontSize: '0.725rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Empresa / Sucursal</span>
                <div style={{ fontSize: '0.95rem', color: '#ffffff', fontWeight: 500, marginTop: '4px' }}>{empresaUsuario}</div>
              </div>

              <div>
                <span style={{ fontSize: '0.725rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Cargo Autorizado</span>
                <div style={{ fontSize: '0.95rem', color: '#ffffff', fontWeight: 600, marginTop: '4px' }}>{usuarioCargo}</div>
              </div>
            </div>
          </div>
        </div>
      ) : activeView === 'detalle' && selectedTicket ? (

        /* VISTA 2: HISTORIAL CRONOLOGICO COMPLETO DE LA SOLICITUD */
        <div>
          <button
            onClick={() => setActiveView('lista')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#19212d',
              border: '1px solid #334155',
              color: '#cbd5e1',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              cursor: 'pointer',
              marginBottom: '1.5rem',
              fontFamily: 'Montserrat, sans-serif'
            }}
          >
            ← Volver a Mis Solicitudes
          </button>

          <div style={{ background: '#141a24', border: '1px solid #263347', borderRadius: '8px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #263347', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#c29b47', fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }}>{selectedTicket.folio}</span>
                <h3 className="formal-header-font" style={{ fontSize: '1.5rem', color: '#ffffff', marginTop: '2px' }}>{selectedTicket.titulo}</h3>
              </div>
              <span style={{ padding: '6px 12px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.35)', fontFamily: 'Montserrat, sans-serif' }}>
                {selectedTicket.estado}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: '#0b0e14', padding: '1.25rem', borderRadius: '6px', border: '1px solid #263347', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Empresa</span>
                <div style={{ color: '#ffffff', fontWeight: 600 }}>{selectedTicket.agencia}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Tipo de Trámite</span>
                <div style={{ color: '#c29b47', fontWeight: 600 }}>{selectedTicket.tipo}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Correos en Copia (CC)</span>
                <div style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>{selectedTicket.correosCopia || 'Sin copias en correo'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Fecha de Envío</span>
                <div style={{ color: '#cbd5e1' }}>{selectedTicket.fechaCreacion}</div>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif', marginBottom: '0.5rem' }}>Descripción del Trámite</h4>
              <div style={{ background: '#19212d', padding: '1.25rem', borderRadius: '6px', border: '1px solid #263347', color: '#f1f5f9', lineHeight: 1.6 }}>
                {selectedTicket.descripcion}
              </div>
            </div>

            {/* EXPEDIENTES Y ADJUNTOS */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif', marginBottom: '0.5rem' }}>Archivos y Expedientes Adjuntos</h4>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {selectedTicket.documentos.map((doc, idx) => (
                  <div key={idx} style={{ background: '#0b0e14', border: '1px solid #263347', padding: '10px 14px', borderRadius: '6px', color: '#c29b47', fontSize: '0.8rem' }}>
                    📎 {doc}
                  </div>
                ))}
              </div>
            </div>

            {/* HISTORIAL CRONOLOGICO COMPLETO */}
            <div>
              <h4 style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif', marginBottom: '0.75rem' }}>
                Historial Cronológico de Dictámenes y Actuaciones
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedTicket.historial.map((h, i) => (
                  <div key={i} style={{ background: '#0b0e14', border: '1px solid #263347', padding: '1rem', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.75rem' }}>
                      <strong style={{ color: '#c29b47' }}>{h.autor}</strong>
                      <span style={{ color: '#64748b' }}>{h.fecha}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: 0 }}>{h.mensaje}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : activeView === 'nuevo' ? (

        /* VISTA 3: FORMULARIO COMPLETO PARA NUEVA SOLICITUD CON COPIA A CORREOS */
        <div>
          <button
            onClick={() => setActiveView('lista')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#19212d',
              border: '1px solid #334155',
              color: '#cbd5e1',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              cursor: 'pointer',
              marginBottom: '1.5rem',
              fontFamily: 'Montserrat, sans-serif'
            }}
          >
            ← Volver a Mis Solicitudes
          </button>

          <div style={{ background: '#141a24', border: '1px solid #263347', borderRadius: '8px', padding: '2.25rem' }}>
            <div style={{ borderBottom: '1px solid #263347', paddingBottom: '1rem', marginBottom: '1.75rem' }}>
              <h3 className="formal-header-font" style={{ fontSize: '1.45rem', color: '#ffffff' }}>
                Registro Formal de Solicitud Legal
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Formulario de envío de trámites corporativos al Departamento Jurídico de Grupo Huerta
              </p>
            </div>

            <form onSubmit={handleCreateTicket}>
              {/* DATOS DE LA EMPRESA Y USUARIO */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem', background: '#0b0e14', padding: '1.25rem', borderRadius: '6px', border: '1px solid #263347' }}>
                <div>
                  <label className="input-label">Empresa / Sucursal Solicitante</label>
                  <input type="text" readOnly className="custom-input" style={{ background: '#19212d', color: '#c29b47', fontWeight: 600, paddingLeft: '12px' }} value={empresaUsuario} />
                </div>

                <div>
                  <label className="input-label">Solicitante Autorizado</label>
                  <input type="text" readOnly className="custom-input" style={{ background: '#19212d', color: '#ffffff', paddingLeft: '12px' }} value={`${usuarioNombre} (${usuarioCargo})`} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label className="input-label">Tipo de Trámite Legal</label>
                  <select 
                    className="custom-input" 
                    value={tipo} 
                    onChange={e => setTipo(e.target.value as any)}
                    style={{ paddingLeft: '12px' }}
                  >
                    <option value="RH">Recursos Humanos (RH / Rescisiones / Finiquitos)</option>
                    <option value="DEMANDA">Demandas & Litigios (Notificaciones Judiciales)</option>
                    <option value="SOLICITUD">Solicitud Notarial / Poderes / Asesoría</option>
                    <option value="CONTRATO">Revisión de Contratos / Convenios</option>
                  </select>
                </div>

                <div>
                  <label className="input-label">Copiar a Correos Adicionales (CC)</label>
                  <input 
                    type="text" 
                    className="custom-input" 
                    style={{ paddingLeft: '12px' }}
                    placeholder="ejemplo: gerencia@divol.com, rh@divol.com, contabilidad@divol.com"
                    value={correosCopia}
                    onChange={e => setCorreosCopia(e.target.value)}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Separa múltiples direcciones de correo con coma (,)
                  </span>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Asunto / Título del Trámite</label>
                <input 
                  type="text" 
                  required 
                  className="custom-input" 
                  style={{ paddingLeft: '12px' }}
                  placeholder="Ej: Revisión de Contrato de Arrendamiento Comercial Sucursal Norte"
                  value={asunto}
                  onChange={e => setAsunto(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Descripción Detallada y Antecedentes del Caso</label>
                <textarea 
                  required
                  rows={5}
                  className="custom-input" 
                  style={{ paddingLeft: '12px', resize: 'vertical', lineHeight: 1.5 }}
                  placeholder="Desglose los antecedentes jurídicos, fechas relevantes y requerimientos específicos para el abogado asignado..."
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Prioridad de Atención</label>
                <div style={{ display: 'flex', gap: '2rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', cursor: 'pointer', fontSize: '0.825rem' }}>
                    <input 
                      type="radio" 
                      name="prioridad" 
                      checked={prioridad === 'Normal'} 
                      onChange={() => setPrioridad('Normal')} 
                    />
                    <span>Normal (SLA de atención: 3 a 5 días hábiles)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', cursor: 'pointer', fontSize: '0.825rem' }}>
                    <input 
                      type="radio" 
                      name="prioridad" 
                      checked={prioridad === 'Urgente'} 
                      onChange={() => setPrioridad('Urgente')} 
                    />
                    <span>Urgente (Notificaciones judiciales / Plazo legal venciendo)</span>
                  </label>
                </div>
              </div>

              {/* UPLOAD DE DOCUMENTOS */}
              <div style={{
                border: '1px dashed #334155',
                borderRadius: '6px',
                padding: '1.5rem',
                textAlign: 'center',
                background: '#0b0e14',
                marginBottom: '1.75rem',
                cursor: 'pointer'
              }}
              onClick={() => setArchivosSimulados(['Expediente_Documental_Respaldado.pdf'])}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ margin: '0 auto 8px auto', display: 'block' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <span style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'block', fontWeight: 600 }}>
                  Adjuntar Expedientes y Borradores (PDF, Word, ZIP)
                </span>
                <span style={{ fontSize: '0.725rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
                  Haz clic para simular la carga de un archivo adjunto
                </span>
                {archivosSimulados.length > 0 && (
                  <div style={{ marginTop: '8px', color: '#4ade80', fontSize: '0.75rem', fontWeight: 600 }}>
                    ✓ Archivo adjunto: {archivosSimulados[0]}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setActiveView('lista')}
                  style={{ background: 'transparent', border: '1px solid #334155', color: '#cbd5e1', padding: '10px 18px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontSize: '0.775rem' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  style={{ background: '#c29b47', border: 'none', color: '#0b0e14', padding: '10px 24px', borderRadius: '4px', fontWeight: 700, fontFamily: 'Montserrat, sans-serif', fontSize: '0.775rem', textTransform: 'uppercase', cursor: 'pointer' }}
                >
                  Enviar Trámite a Jurídico
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (

        /* VISTA PRINCIPAL: LISTADO DE MIS TRÁMITES */
        <div>
          {/* BANNER DE ACCIÓN */}
          <div style={{
            background: '#141a24',
            border: '1px solid #263347',
            borderRadius: '8px',
            padding: '1.75rem 2rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <h3 className="formal-header-font" style={{ fontSize: '1.35rem', color: '#ffffff', marginBottom: '0.3rem' }}>
                Atención a Solicitudes Legales
              </h3>
              <p style={{ fontSize: '0.825rem', color: '#94a3b8', maxWidth: '640px' }}>
                Registra un nuevo trámite o consulta el dictamen emitido por la Dirección Jurídica
              </p>
            </div>

            <button
              onClick={() => setActiveView('nuevo')}
              style={{
                background: 'linear-gradient(135deg, #c29b47, #9e7b30)',
                border: 'none',
                color: '#0b0e14',
                padding: '11px 22px',
                borderRadius: '6px',
                fontSize: '0.825rem',
                fontWeight: 700,
                fontFamily: 'Montserrat, sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(194, 155, 71, 0.2)'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span>Nueva Solicitud Legal</span>
            </button>
          </div>

          {/* REGISTRO DE TRÁMITES */}
          <div style={{ background: '#141a24', border: '1px solid #263347', borderRadius: '8px', padding: '1.75rem' }}>
            <h4 className="formal-header-font" style={{ fontSize: '1.25rem', color: '#ffffff', marginBottom: '1.25rem' }}>
              Mis Trámites Legales Registrados
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {myTickets.map(item => (
                <div
                  key={item.id}
                  style={{
                    background: '#0b0e14',
                    border: '1px solid #263347',
                    borderRadius: '6px',
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
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c29b47', fontFamily: 'Montserrat, sans-serif' }}>{item.folio}</span>
                      <span style={{ fontSize: '0.725rem', padding: '2px 6px', background: '#19212d', border: '1px solid #334155', borderRadius: '4px', color: '#ffffff' }}>{item.tipo}</span>
                      <span style={{ fontSize: '0.725rem', color: '#64748b' }}>• Registrado el {item.fechaCreacion}</span>
                    </div>

                    <h5 style={{ fontSize: '0.975rem', color: '#ffffff', fontWeight: 600, marginBottom: '0.3rem' }}>
                      {item.titulo}
                    </h5>

                    <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      Sucursal: <span style={{ color: '#cbd5e1' }}>{item.agencia}</span>
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      fontFamily: 'Montserrat, sans-serif',
                      textTransform: 'uppercase',
                      background: 'rgba(59, 130, 246, 0.12)',
                      color: '#60a5fa',
                      border: '1px solid rgba(59, 130, 246, 0.35)'
                    }}>
                      {item.estado}
                    </span>

                    <button
                      onClick={() => { setSelectedTicket(item); setActiveView('detalle'); }}
                      style={{
                        background: 'rgba(194, 155, 71, 0.08)',
                        border: '1px solid rgba(194, 155, 71, 0.25)',
                        color: '#c29b47',
                        padding: '7px 14px',
                        borderRadius: '4px',
                        fontSize: '0.775rem',
                        fontFamily: 'Montserrat, sans-serif',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      Abrir Expediente
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
