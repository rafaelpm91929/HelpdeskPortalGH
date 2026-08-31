import React, { useState } from 'react';
import { AGENCIAS_OFICIALES } from './ExecutiveDashboard';
import logoGrupoHuerta from '../assets/logo_grupo_huerta.jpg';

export type AutoridadTipo = 'PROFECO' | 'IMSS' | 'SAT' | 'Ayuntamiento / Alcaldía' | 'Fiscalía' | 'Laboral' | 'Ninguna / Corporativo';

export type AsuntoTipo = 
  | 'Solicitud'
  | 'Revisión'
  | 'Visto Bueno'
  | 'Elaboración'
  | 'Visita'
  | 'Inspección'
  | 'Demanda / Denuncia'
  | 'Informe'
  | 'Conciliación'
  | 'Elaboración de Contrato'
  | 'Consulta';

export type PrioridadTipo = 'Alta' | 'Media' | 'Urgente' | 'Vencido';

export interface UserTicket {
  id: string;
  folio: string;
  agencia: string;
  autoridad: AutoridadTipo;
  asuntoTipo: AsuntoTipo;
  titulo: string;
  correosCopia: string;
  descripcion: string;
  fechaSolicitud: string;
  fechaCompromiso: string;
  diasAbierto: number;
  estado: 'En Revisión' | 'En Dictamen' | 'Requiere Información' | 'Concluido';
  prioridad: PrioridadTipo;
  documentos: string[];
  historial: { fecha: string; autor: string; mensaje: string }[];
}

export const AUTORIDADES_LISTA: AutoridadTipo[] = [
  'PROFECO',
  'IMSS',
  'SAT',
  'Ayuntamiento / Alcaldía',
  'Fiscalía',
  'Laboral',
  'Ninguna / Corporativo'
];

export const ASUNTOS_LISTA: AsuntoTipo[] = [
  'Solicitud',
  'Revisión',
  'Visto Bueno',
  'Elaboración',
  'Visita',
  'Inspección',
  'Demanda / Denuncia',
  'Informe',
  'Conciliación',
  'Elaboración de Contrato',
  'Consulta'
];

export const UserPortal: React.FC<{ onLogout: () => void; onSwitchRole?: () => void }> = ({ onLogout, onSwitchRole }) => {
  const [activeView, setActiveView] = useState<'principal' | 'nuevo' | 'detalle' | 'perfil'>('principal');
  const [selectedTicket, setSelectedTicket] = useState<UserTicket | null>(null);

  // User Profile State
  const [empresaUsuario] = useState('Divol Norte');
  const [usuarioNombre] = useState('Ing. Carlos Mendoza');
  const [usuarioCorreo] = useState('cmendoza@divol.com');
  const [usuarioCargo] = useState<'Gerente General' | 'Gerente Administrativo' | 'Recursos Humanos'>('Gerente Administrativo');
  
  // New Ticket Form State
  const [autoridad, setAutoridad] = useState<AutoridadTipo>('PROFECO');
  const [asuntoTipo, setAsuntoTipo] = useState<AsuntoTipo>('Revisión');
  const [prioridad, setPrioridad] = useState<PrioridadTipo>('Alta');
  const [fechaCompromiso, setFechaCompromiso] = useState('05/09/2026');
  const [correosCopia, setCorreosCopia] = useState('gerencia@divol.com, contabilidad@divol.com');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [archivosSimulados, setArchivosSimulados] = useState<string[]>([]);

  // State for new comment input in ticket detail
  const [nuevoComentario, setNuevoComentario] = useState('');

  // User tickets list
  const [myTickets, setMyTickets] = useState<UserTicket[]>([
    {
      id: '1',
      folio: 'SOL-JUR-089',
      agencia: 'Divol Norte',
      autoridad: 'Laboral',
      asuntoTipo: 'Demanda / Denuncia',
      titulo: 'Notificación Mercantil y Emplazamiento Judicial',
      correosCopia: 'gerencia@divol.com, contabilidad@divol.com',
      descripcion: 'Se recibió emplazamiento respecto al expediente mercantil 402/2026. Se requiere contestación de demanda antes de la fecha compromiso.',
      fechaSolicitud: '20/08/2026',
      fechaCompromiso: '02/09/2026',
      diasAbierto: 9,
      estado: 'En Dictamen',
      prioridad: 'Urgente',
      documentos: ['Emplazamiento_Notificacion.pdf', 'Anexo_Documental.pdf'],
      historial: [
        { fecha: '20/08/2026 09:30', autor: 'Carlos Mendoza (Gerente Admin)', mensaje: 'Se registró la solicitud inicial adjuntando la cédula de notificación judicial.' },
        { fecha: '20/08/2026 14:15', autor: 'Lic. Mariana Fernández (Dirección Jurídica)', mensaje: 'Solicitud recibida. Clasificada en prioridad Urgente y asignada a contestación.' },
        { fecha: '21/08/2026 11:00', autor: 'Lic. Mariana Fernández (Dirección Jurídica)', mensaje: 'Se formuló la contestación de la demanda. En proceso de certificación notarial.' }
      ]
    },
    {
      id: '2',
      folio: 'SOL-JUR-076',
      agencia: 'Divol Norte',
      autoridad: 'PROFECO',
      asuntoTipo: 'Inspección',
      titulo: 'Visita de Inspección de Precios y Garantías',
      correosCopia: 'rh@divol.com, gerencia@divol.com',
      descripcion: 'Solicitud de asesoría jurídica para contestación de acta de inspección ordinaria PROFECO.',
      fechaSolicitud: '25/08/2026',
      fechaCompromiso: '04/09/2026',
      diasAbierto: 4,
      estado: 'En Revisión',
      prioridad: 'Media',
      documentos: ['Acta_Inspeccion_Profeco.pdf'],
      historial: [
        { fecha: '25/08/2026 10:00', autor: 'Carlos Mendoza (Gerente Admin)', mensaje: 'Ingreso de acta de inspección para elaboración de informe de cumplimiento.' },
        { fecha: '26/08/2026 16:45', autor: 'Lic. Roberto Garza (Dirección Jurídica)', mensaje: 'Escrito de desahogo de observaciones elaborado y listo para su entrega.' }
      ]
    }
  ]);

  // Last submitted ticket (Ultimo Ticket)
  const ultimoTicket = myTickets.length > 0 ? myTickets[0] : null;

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !descripcion.trim()) return;

    const newT: UserTicket = {
      id: Date.now().toString(),
      folio: `SOL-JUR-${Math.floor(100 + Math.random() * 900)}`,
      agencia: empresaUsuario,
      autoridad,
      asuntoTipo,
      titulo,
      correosCopia,
      descripcion,
      fechaSolicitud: new Date().toLocaleDateString('es-MX'),
      fechaCompromiso: fechaCompromiso || '08/09/2026',
      diasAbierto: 0,
      estado: 'En Revisión',
      prioridad,
      documentos: archivosSimulados.length > 0 ? archivosSimulados : ['Expediente_Documental_Inicial.pdf'],
      historial: [
        { 
          fecha: `${new Date().toLocaleDateString('es-MX')} ${new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`,
          autor: `${usuarioNombre} (${usuarioCargo})`,
          mensaje: `Registro de solicitud enviado a Jurídico para Autoridad [${autoridad}] y Asunto [${asuntoTipo}].`
        }
      ]
    };

    setMyTickets([newT, ...myTickets]);
    setActiveView('principal');
    setTitulo('');
    setDescripcion('');
    setArchivosSimulados([]);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoComentario.trim() || !selectedTicket) return;

    const comentarioObj = {
      fecha: `${new Date().toLocaleDateString('es-MX')} ${new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`,
      autor: `${usuarioNombre} (${usuarioCargo})`,
      mensaje: nuevoComentario
    };

    const updatedTickets = myTickets.map(t => {
      if (t.id === selectedTicket.id) {
        return {
          ...t,
          historial: [...t.historial, comentarioObj]
        };
      }
      return t;
    });

    setMyTickets(updatedTickets);
    setSelectedTicket({
      ...selectedTicket,
      historial: [...selectedTicket.historial, comentarioObj]
    });
    setNuevoComentario('');
  };

  return (
    <div style={{ width: '100%', maxWidth: '1180px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      
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
            background: '#ffffff',
            padding: '5px 10px',
            borderRadius: '6px',
            border: '1px solid #c29b47',
            display: 'flex',
            alignItems: 'center'
          }}>
            <img src={logoGrupoHuerta} alt="Grupo Huerta" style={{ height: '30px', width: 'auto' }} />
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
            onClick={() => setActiveView('principal')}
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
            ← Volver a la Vista Principal
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

        /* VISTA 2: HISTORIAL CRONOLOGICO COMPLETO + SECCIÓN DE COMENTARIOS EN EL TICKET */
        <div>
          <button
            onClick={() => setActiveView('principal')}
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
            ← Volver a la Vista Principal
          </button>

          <div style={{ background: '#141a24', border: '1px solid #263347', borderRadius: '8px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #263347', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#c29b47', fontWeight: 700, fontFamily: 'Montserrat, sans-serif' }}>{selectedTicket.folio}</span>
                  <span style={{ padding: '2px 8px', background: '#19212d', border: '1px solid #334155', borderRadius: '4px', fontSize: '0.7rem', color: '#ffffff', fontWeight: 600 }}>
                    {selectedTicket.autoridad}
                  </span>
                  <span style={{ padding: '2px 8px', background: 'rgba(194, 155, 71, 0.12)', border: '1px solid rgba(194, 155, 71, 0.3)', borderRadius: '4px', fontSize: '0.7rem', color: '#c29b47', fontWeight: 600 }}>
                    {selectedTicket.asuntoTipo}
                  </span>
                </div>
                <h3 className="formal-header-font" style={{ fontSize: '1.5rem', color: '#ffffff', marginTop: '2px' }}>{selectedTicket.titulo}</h3>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ padding: '6px 12px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, background: selectedTicket.prioridad === 'Urgente' || selectedTicket.prioridad === 'Vencido' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)', color: selectedTicket.prioridad === 'Urgente' || selectedTicket.prioridad === 'Vencido' ? '#f87171' : '#60a5fa', border: selectedTicket.prioridad === 'Urgente' || selectedTicket.prioridad === 'Vencido' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(59, 130, 246, 0.4)', fontFamily: 'Montserrat, sans-serif' }}>
                  PRIORIDAD: {selectedTicket.prioridad}
                </span>

                <span style={{ padding: '6px 12px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.35)', fontFamily: 'Montserrat, sans-serif' }}>
                  {selectedTicket.estado}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: '#0b0e14', padding: '1.25rem', borderRadius: '6px', border: '1px solid #263347', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Empresa / Sucursal</span>
                <div style={{ color: '#ffffff', fontWeight: 600 }}>{selectedTicket.agencia}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Fecha de Solicitud</span>
                <div style={{ color: '#cbd5e1' }}>{selectedTicket.fechaSolicitud}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#fbbf24', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'Montserrat, sans-serif' }}>Fecha Compromiso</span>
                <div style={{ color: '#fbbf24', fontWeight: 700 }}>{selectedTicket.fechaCompromiso}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Correos en Copia (CC)</span>
                <div style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>{selectedTicket.correosCopia || 'Sin copias en correo'}</div>
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
            <div style={{ marginBottom: '2rem' }}>
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

            {/* SECCIÓN INTERACTIVA PARA AGREGAR COMENTARIOS EN EL TICKET */}
            <div style={{ background: '#0b0e14', border: '1px solid #263347', borderRadius: '6px', padding: '1.25rem' }}>
              <h4 style={{ fontSize: '0.85rem', color: '#ffffff', fontFamily: 'Montserrat, sans-serif', marginBottom: '0.5rem' }}>
                Agregar Comentario o Evidencia Adicional
              </h4>
              <form onSubmit={handleAddComment}>
                <textarea
                  rows={3}
                  required
                  className="custom-input"
                  style={{ paddingLeft: '12px', resize: 'vertical', marginBottom: '1rem' }}
                  placeholder="Escribe una actualización o respuesta para la Dirección Jurídica..."
                  value={nuevoComentario}
                  onChange={e => setNuevoComentario(e.target.value)}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    style={{
                      background: '#c29b47',
                      border: 'none',
                      color: '#0b0e14',
                      padding: '8px 20px',
                      borderRadius: '4px',
                      fontWeight: 700,
                      fontFamily: 'Montserrat, sans-serif',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      cursor: 'pointer'
                    }}
                  >
                    Enviar Comentario
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      ) : activeView === 'nuevo' ? (

        /* VISTA 3: FORMULARIO COMPLETO PARA NUEVA SOLICITUD (CAMPOS REQUERIDOS) */
        <div>
          <button
            onClick={() => setActiveView('principal')}
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
            ← Volver a la Vista Principal
          </button>

          <div style={{ background: '#141a24', border: '1px solid #263347', borderRadius: '8px', padding: '2.25rem' }}>
            <div style={{ borderBottom: '1px solid #263347', paddingBottom: '1rem', marginBottom: '1.75rem' }}>
              <h3 className="formal-header-font" style={{ fontSize: '1.45rem', color: '#ffffff' }}>
                Registro Formal de Solicitud Legal
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Completa los campos institucionales para el envío de trámites al Departamento Jurídico de Grupo Huerta
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

              {/* AUTORIDAD Y ASUNTO */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label className="input-label">Autoridad Competente</label>
                  <select 
                    className="custom-input" 
                    value={autoridad} 
                    onChange={e => setAutoridad(e.target.value as AutoridadTipo)}
                    style={{ paddingLeft: '12px' }}
                  >
                    {AUTORIDADES_LISTA.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="input-label">Tipo de Asunto / Trámite</label>
                  <select 
                    className="custom-input" 
                    value={asuntoTipo} 
                    onChange={e => setAsuntoTipo(e.target.value as AsuntoTipo)}
                    style={{ paddingLeft: '12px' }}
                  >
                    {ASUNTOS_LISTA.map(ast => (
                      <option key={ast} value={ast}>{ast}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* PRIORIDAD Y FECHA COMPROMISO */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label className="input-label">Prioridad Requerida</label>
                  <select 
                    className="custom-input" 
                    value={prioridad} 
                    onChange={e => setPrioridad(e.target.value as PrioridadTipo)}
                    style={{ paddingLeft: '12px' }}
                  >
                    <option value="Media">Media (SLA normal de atención)</option>
                    <option value="Alta">Alta (Atención prioritaria corporativa)</option>
                    <option value="Urgente">Urgente (Notificación judicial / Inspección en curso)</option>
                    <option value="Vencido">Vencido (Atención inmediata / Término venciendo)</option>
                  </select>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    * El Abogado Administrador podrá reclasificar la prioridad según términos legales.
                  </span>
                </div>

                <div>
                  <label className="input-label">Fecha Compromiso (¿Para cuándo requiere estar listo?)</label>
                  <input 
                    type="date" 
                    required 
                    className="custom-input" 
                    style={{ paddingLeft: '12px' }}
                    value="2026-09-05"
                    onChange={e => setFechaCompromiso(e.target.value)}
                  />
                </div>
              </div>

              {/* COPIAR EN CORREOS CC */}
              <div className="input-group">
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

              <div className="input-group">
                <label className="input-label">Título / Resumen del Trámite</label>
                <input 
                  type="text" 
                  required 
                  className="custom-input" 
                  style={{ paddingLeft: '12px' }}
                  placeholder="Ej: Revisión de Acta de Inspección Ordinaria PROFECO Sucursal Norte"
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Descripción Detallada y Antecedentes del Caso</label>
                <textarea 
                  required
                  rows={4}
                  className="custom-input" 
                  style={{ paddingLeft: '12px', resize: 'vertical', lineHeight: 1.5 }}
                  placeholder="Desglose los antecedentes jurídicos, notificaciones recibidas, números de acta y especificaciones para el abogado..."
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                />
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
              onClick={() => setArchivosSimulados(['Acta_Inspeccion_Notificacion.pdf'])}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ margin: '0 auto 8px auto', display: 'block' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <span style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'block', fontWeight: 600 }}>
                  Adjuntar Expedientes y Notificaciones (PDF, Word, ZIP)
                </span>
                <span style={{ fontSize: '0.725rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
                  Haz clic para simular la carga del archivo adjunto
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
                  onClick={() => setActiveView('principal')}
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

        /* VISTA PRINCIPAL DEL USUARIO (ESTATUS DEL ÚLTIMO TICKET + BOTÓN CREAR TICKET + LISTA TICKETS) */
        <div>
          
          {/* BANNER DE ACCIÓN: CREAR TICKET */}
          <div style={{
            background: '#141a24',
            border: '1px solid #263347',
            borderRadius: '8px',
            padding: '1.5rem 2rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <h3 className="formal-header-font" style={{ fontSize: '1.35rem', color: '#ffffff', marginBottom: '0.2rem' }}>
                Atención a Solicitudes Legales
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Registra un nuevo trámite legal completando la autoridad, tipo de asunto y fecha compromiso
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
              <span>+ Crear Ticket</span>
            </button>
          </div>

          {/* APARTADO 1: ESTATUS DE SU ÚLTIMO TICKET */}
          {ultimoTicket && (
            <div style={{ background: '#141a24', border: '1px solid rgba(194, 155, 71, 0.35)', borderRadius: '8px', padding: '1.75rem', marginBottom: '2rem', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #263347', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: 'rgba(194, 155, 71, 0.15)', padding: '6px 10px', borderRadius: '4px', border: '1px solid rgba(194, 155, 71, 0.3)', color: '#c29b47', fontSize: '0.725rem', fontWeight: 700, fontFamily: 'Montserrat, sans-serif' }}>
                    📌 ESTATUS DE TU ÚLTIMO TICKET ENVIADO
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600 }}>{ultimoTicket.folio}</span>
                </div>

                <span style={{ padding: '4px 12px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.35)', fontFamily: 'Montserrat, sans-serif' }}>
                  {ultimoTicket.estado}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Título del Asunto</span>
                  <h4 style={{ fontSize: '1.05rem', color: '#ffffff', fontWeight: 600, marginTop: '2px' }}>{ultimoTicket.titulo}</h4>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Autoridad & Asunto</span>
                  <div style={{ fontSize: '0.85rem', color: '#c29b47', fontWeight: 600, marginTop: '2px' }}>{ultimoTicket.autoridad} • {ultimoTicket.asuntoTipo}</div>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', color: '#fbbf24', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'Montserrat, sans-serif' }}>Fecha Compromiso</span>
                  <div style={{ fontSize: '0.9rem', color: '#fbbf24', fontWeight: 700, marginTop: '2px' }}>{ultimoTicket.fechaCompromiso}</div>
                </div>
              </div>

              {/* ULTIMA RESPUESTA DEL ABOGADO */}
              {ultimoTicket.historial.length > 0 && (
                <div style={{ background: '#0b0e14', border: '1px solid #263347', padding: '1rem', borderRadius: '6px', marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.725rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif', marginBottom: '4px' }}>
                    Última Actuación del Departamento Jurídico ({ultimoTicket.historial[ultimoTicket.historial.length - 1].fecha}):
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: 0 }}>
                    <strong>{ultimoTicket.historial[ultimoTicket.historial.length - 1].autor}:</strong> {ultimoTicket.historial[ultimoTicket.historial.length - 1].mensaje}
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setSelectedTicket(ultimoTicket); setActiveView('detalle'); }}
                  style={{
                    background: 'rgba(194, 155, 71, 0.08)',
                    border: '1px solid rgba(194, 155, 71, 0.3)',
                    color: '#c29b47',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    fontSize: '0.775rem',
                    fontFamily: 'Montserrat, sans-serif',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Ver Expediente Completo y Comentarios ➔
                </button>
              </div>
            </div>
          )}

          {/* APARTADO 2: LISTADO DE TICKETS / EXPEDIENTES */}
          <div style={{ background: '#141a24', border: '1px solid #263347', borderRadius: '8px', padding: '1.75rem' }}>
            <h4 className="formal-header-font" style={{ fontSize: '1.25rem', color: '#ffffff', marginBottom: '1.25rem' }}>
              TICKETS / EXPEDIENTES REGISTRADOS
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
                      <span style={{ fontSize: '0.725rem', padding: '2px 6px', background: '#19212d', border: '1px solid #334155', borderRadius: '4px', color: '#ffffff' }}>{item.autoridad}</span>
                      <span style={{ fontSize: '0.725rem', padding: '2px 6px', background: 'rgba(194, 155, 71, 0.1)', border: '1px solid rgba(194, 155, 71, 0.25)', borderRadius: '4px', color: '#c29b47' }}>{item.asuntoTipo}</span>
                      <span style={{ fontSize: '0.725rem', color: '#64748b' }}>• Solicitado el {item.fechaSolicitud}</span>
                    </div>

                    <h5 style={{ fontSize: '0.975rem', color: '#ffffff', fontWeight: 600, marginBottom: '0.3rem' }}>
                      {item.titulo}
                    </h5>

                    <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      Fecha Compromiso: <span style={{ color: '#fbbf24', fontWeight: 700 }}>{item.fechaCompromiso}</span> • Sucursal: <span style={{ color: '#cbd5e1' }}>{item.agencia}</span>
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
