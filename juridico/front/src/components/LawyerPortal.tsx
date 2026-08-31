import React, { useState } from 'react';
import logoGrupoHuerta from '../assets/logo_grupo_huerta.jpg';
import { TicketItem, EventoCalendario, AGENCIAS_OFICIALES } from './ExecutiveDashboard';

export const LawyerPortal: React.FC<{ onLogout: () => void; onSwitchRole?: (role: 'executive' | 'lawyer' | 'user') => void }> = ({ onLogout, onSwitchRole }) => {
  const [activeSection, setActiveSection] = useState<'expedientes' | 'calendario' | 'historial'>('expedientes');
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);

  // Perfil del Abogado Logueado
  const [abogadoNombre] = useState('Lic. Mariana Fernández');
  const [abogadoEspecialidad] = useState('Litigio Mercantil & Corporativo');
  const [abogadoCorreo] = useState('mfernandez@juridico-gh.com');

  // Filtros de Expedientes
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('TODOS');
  const [filtroAgencia, setFiltroAgencia] = useState<string>('TODOS');

  // Filtros de Calendario
  const [modoCalendario, setModoCalendario] = useState<'grid' | 'lista'>('grid');
  const [filtroTipoEvento, setFiltroTipoEvento] = useState<string>('TODOS');
  const [selectedEventoModal, setSelectedEventoModal] = useState<EventoCalendario | null>(null);

  // Estado para Dictamen / Respuesta
  const [nuevoDictamen, setNuevoDictamen] = useState('');
  const [nuevoEstadoTicket, setNuevoEstadoTicket] = useState<TicketItem['estado']>('En Dictamen');

  // Lista de Tickets Asignados al Abogado Lic. Mariana Fernández
  const [assignedTickets, setAssignedTickets] = useState<TicketItem[]>([
    {
      id: '1',
      folio: 'JUR-2026-089',
      agencia: 'Divol Norte',
      autoridad: 'Laboral',
      asuntoTipo: 'Demanda / Denuncia',
      tipo: 'DEMANDA',
      titulo: 'Notificación Mercantil de Juicio Ejecutivo 402/2026',
      solicitante: 'Carlos Mendoza',
      cargoSolicitante: 'Gerente Administrativo',
      correoSolicitante: 'cmendoza@divol.com',
      correosCopia: 'direccion@divol.com, contabilidad@divol.com',
      descripcion: 'Se recibió emplazamiento respecto al expediente mercantil 402/2026. Límite improrrogable de contestación para el 02/09/2026.',
      fechaCreacion: '20/08/2026',
      fechaCompromiso: '02/09/2026',
      diasAbierto: 9,
      estado: 'Urgente',
      abogadoAsignado: 'Lic. Mariana Fernández',
      prioridad: 'Urgente',
      documentos: ['Emplazamiento_Notificacion.pdf', 'Anexo_Documental.pdf'],
      historial: [
        { fecha: '20/08/2026 09:30', autor: 'Carlos Mendoza (Gerente Admin)', mensaje: 'Se ingresa demanda urgente con emplazamiento y notificación judicial.' },
        { fecha: '20/08/2026 14:15', autor: 'Lic. Mariana Fernández (Abogado)', mensaje: 'Expediente asignado. Se inicia revisión del documento emplazatorio.' },
        { fecha: '21/08/2026 11:00', autor: 'Lic. Mariana Fernández (Abogado)', mensaje: 'Se redactó la contestación de demanda e incidente de falta de personalidad.' }
      ]
    },
    {
      id: '3',
      folio: 'JUR-2026-081',
      agencia: 'Suzuki Montevideo',
      autoridad: 'Ninguna / Corporativo',
      asuntoTipo: 'Revisión',
      tipo: 'CONTRATO',
      titulo: 'Revisión y Convenio Modificatorio de Arrendamiento de Instalaciones',
      solicitante: 'Roberto Garza',
      cargoSolicitante: 'Gerente General',
      correoSolicitante: 'rgarza@suzukimontevideo.com',
      descripcion: 'Revisión de cláusula de plazo forzoso e incremento de renta anual para la sucursal de refacciones.',
      fechaCreacion: '27/08/2026',
      fechaCompromiso: '05/09/2026',
      diasAbierto: 2,
      estado: 'En Revisión',
      abogadoAsignado: 'Lic. Mariana Fernández',
      prioridad: 'Alta',
      documentos: ['Borrador_Convenio_Arrendamiento.docx'],
      historial: [
        { fecha: '27/08/2026 16:20', autor: 'Roberto Garza (Gerente General)', mensaje: 'Envío de borrador de contrato para análisis de cláusulas.' }
      ]
    },
    {
      id: '5',
      folio: 'JUR-2026-068',
      agencia: 'Divol Norte',
      autoridad: 'PROFECO',
      asuntoTipo: 'Conciliación',
      tipo: 'SOLICITUD',
      titulo: 'Audiencia de Conciliación PROFECO Exp. 892/2026',
      solicitante: 'Carlos Mendoza',
      cargoSolicitante: 'Gerente Administrativo',
      correoSolicitante: 'cmendoza@divol.com',
      descripcion: 'Atención de queja de cliente sobre garantía de mantenimiento de vehículo.',
      fechaCreacion: '10/08/2026',
      fechaCompromiso: '18/08/2026',
      diasAbierto: 15,
      estado: 'Concluido',
      abogadoAsignado: 'Lic. Mariana Fernández',
      prioridad: 'Media',
      documentos: ['Convenio_Profeco_Concluido.pdf'],
      historial: [
        { fecha: '10/08/2026 10:00', autor: 'Carlos Mendoza (Gerente Admin)', mensaje: 'Apertura de caso de queja PROFECO.' },
        { fecha: '18/08/2026 13:00', autor: 'Lic. Mariana Fernández (Abogado)', mensaje: 'Convenio conciliatorio firmado en PROFECO sin multa para la empresa.' }
      ]
    }
  ]);

  // Eventos del Calendario Asignados al Abogado
  const [abogadoEventos] = useState<EventoCalendario[]>([
    {
      id: 'ev-1',
      folio: 'JUR-2026-089',
      agencia: 'Divol Norte',
      tipoEvento: 'Incidencia',
      titulo: 'Vencimiento Emplazamiento Mercantil Juicio 402/2026',
      fecha: '01/09/2026',
      diaNumero: 1,
      hora: '23:59 PM',
      lugar: 'Juzgado 4° de lo Mercantil CDMX',
      abogado: 'Lic. Mariana Fernández',
      detalles: 'Límite improrrogable para ingresar la contestación de demanda mercantil.'
    },
    {
      id: 'ev-3',
      folio: 'JUR-2026-081',
      agencia: 'Suzuki Montevideo',
      tipoEvento: 'Reunión',
      titulo: 'Negociación Cláusulas Arrendamiento Sucursal',
      fecha: '03/09/2026',
      diaNumero: 3,
      hora: '16:00 PM',
      lugar: 'Sala de Juntas Corporativa',
      abogado: 'Lic. Mariana Fernández',
      detalles: 'Mesa de trabajo presencial con representantes del propietario del inmueble.'
    },
    {
      id: 'ev-8',
      folio: 'JUR-2026-089',
      agencia: 'Divol Norte',
      tipoEvento: 'Audiencia',
      titulo: 'Audiencia de Ratificación de Firma Escrito Contestación',
      fecha: '08/09/2026',
      diaNumero: 8,
      hora: '11:00 AM',
      lugar: 'Juzgado 4° de lo Mercantil CDMX',
      abogado: 'Lic. Mariana Fernández',
      detalles: 'Comparecencia con apoderado legal para ratificar documento de defensa.'
    }
  ]);

  const handleAddDictamen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoDictamen.trim() || !selectedTicket) return;

    const nuevaEntrada = {
      fecha: `${new Date().toLocaleDateString('es-MX')} ${new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`,
      autor: `${abogadoNombre} (Abogado Resolutor)`,
      mensaje: nuevoDictamen
    };

    const updated = assignedTickets.map(t => {
      if (t.id === selectedTicket.id) {
        return {
          ...t,
          estado: nuevoEstadoTicket,
          historial: [...t.historial, nuevaEntrada]
        };
      }
      return t;
    });

    setAssignedTickets(updated);
    setSelectedTicket({
      ...selectedTicket,
      estado: nuevoEstadoTicket,
      historial: [...selectedTicket.historial, nuevaEntrada]
    });
    setNuevoDictamen('');
  };

  // Filtrado de expedientes por estatus (Activos vs Concluidos)
  const ticketsActivos = assignedTickets.filter(t => t.estado !== 'Concluido');
  const ticketsConcluidos = assignedTickets.filter(t => t.estado === 'Concluido');

  const filteredExpedientes = (activeSection === 'historial' ? ticketsConcluidos : ticketsActivos).filter(t => {
    const matchPrioridad = filtroPrioridad === 'TODOS' || t.prioridad === filtroPrioridad;
    const matchAgencia = filtroAgencia === 'TODOS' || t.agencia === filtroAgencia;
    return matchPrioridad && matchAgencia;
  });

  const filteredEventos = abogadoEventos.filter(e => {
    return filtroTipoEvento === 'TODOS' || e.tipoEvento === filtroTipoEvento;
  });

  const diasMesSeptiembre: (number | null)[] = [
    null, null,
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0b0e14' }}>
      
      {/* SIDEBAR DEDICADO PARA EL ABOGADO */}
      <aside style={{
        width: '260px',
        background: '#141a24',
        borderRight: '1px solid #263347',
        padding: '1.5rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        <div>
          {/* LOGO E IDENTIFICADOR DE ABOGADO */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 0.5rem 1.5rem 0.5rem', borderBottom: '1px solid #263347', marginBottom: '1.5rem' }}>
            <div style={{ background: '#ffffff', padding: '4px 8px', borderRadius: '6px', border: '1px solid #c29b47', display: 'flex', alignItems: 'center' }}>
              <img src={logoGrupoHuerta} alt="Grupo Huerta" style={{ height: '26px', width: 'auto' }} />
            </div>
            <div>
              <div className="formal-header-font" style={{ fontSize: '1rem', color: '#ffffff' }}>PORTAL JURÍDICO</div>
              <div style={{ fontSize: '0.65rem', color: '#c29b47', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Módulo de Abogados</div>
            </div>
          </div>

          {/* TARJETA DEL ABOGADO LOGUEADO */}
          <div style={{ background: '#0b0e14', border: '1px solid rgba(194, 155, 71, 0.3)', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.675rem', color: '#c29b47', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'Montserrat, sans-serif' }}>ABOGADO RESPONSABLE</div>
            <div style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 700, marginTop: '2px', fontFamily: 'Montserrat, sans-serif' }}>{abogadoNombre}</div>
            <div style={{ fontSize: '0.725rem', color: '#94a3b8' }}>{abogadoEspecialidad}</div>
          </div>

          {/* NAVEGACIÓN DEL ABOGADO */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              onClick={() => { setActiveSection('expedientes'); setSelectedTicket(null); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '10px 14px',
                borderRadius: '6px',
                border: 'none',
                background: activeSection === 'expedientes' && !selectedTicket ? '#19212d' : 'transparent',
                color: activeSection === 'expedientes' && !selectedTicket ? '#c29b47' : '#94a3b8',
                fontWeight: activeSection === 'expedientes' && !selectedTicket ? 600 : 400,
                fontSize: '0.825rem',
                fontFamily: 'Montserrat, sans-serif',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span>Mis Tickets Asignados</span>
              </div>
              <span style={{ background: '#c29b47', color: '#0b0e14', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 800 }}>
                {ticketsActivos.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveSection('calendario'); setSelectedTicket(null); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '10px 14px',
                borderRadius: '6px',
                border: 'none',
                background: activeSection === 'calendario' ? '#19212d' : 'transparent',
                color: activeSection === 'calendario' ? '#c29b47' : '#94a3b8',
                fontWeight: activeSection === 'calendario' ? 600 : 400,
                fontSize: '0.825rem',
                fontFamily: 'Montserrat, sans-serif',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span>Mi Calendario de Audiencias</span>
              </div>
              <span style={{ background: '#19212d', border: '1px solid #334155', color: '#60a5fa', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700 }}>
                {abogadoEventos.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveSection('historial'); setSelectedTicket(null); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '10px 14px',
                borderRadius: '6px',
                border: 'none',
                background: activeSection === 'historial' ? '#19212d' : 'transparent',
                color: activeSection === 'historial' ? '#c29b47' : '#94a3b8',
                fontWeight: activeSection === 'historial' ? 600 : 400,
                fontSize: '0.825rem',
                fontFamily: 'Montserrat, sans-serif',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5"/></svg>
              <span>Historial Concluidos</span>
            </button>
          </nav>
        </div>

        {/* PIE DE SIDEBAR */}
        <div style={{ borderTop: '1px solid #263347', paddingTop: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#ffffff', fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }}>{abogadoCorreo}</div>
          <div style={{ fontSize: '0.7rem', color: '#4ade80' }}>● Estado: Activo / En Turno</div>
          <button 
            onClick={onLogout}
            style={{ marginTop: '0.75rem', background: 'transparent', border: '1px solid #334155', color: '#f87171', padding: '6px 12px', borderRadius: '4px', fontSize: '0.725rem', width: '100%', cursor: 'pointer' }}
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL DEL ABOGADO */}
      <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto' }}>
        
        {/* VISTA 1: MIS TICKETS ASIGNADOS (EN PROCESO) O HISTORIAL (CONCLUIDOS) */}
        {(activeSection === 'expedientes' || activeSection === 'historial') && !selectedTicket ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 className="formal-header-font" style={{ fontSize: '1.6rem', color: '#ffffff' }}>
                  {activeSection === 'expedientes' ? 'Mis Expedientes y Tickets Asignados' : 'Historial de Expedientes Concluidos'}
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Atención, revisión de notificaciones y dictaminación jurídica bajo la tutela de <strong>{abogadoNombre}</strong>
                </p>
              </div>

              {/* FILTROS DE EXPEDIENTES */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <select
                  className="custom-input"
                  value={filtroPrioridad}
                  onChange={e => setFiltroPrioridad(e.target.value)}
                  style={{ paddingLeft: '12px', fontSize: '0.8rem' }}
                >
                  <option value="TODOS">Todas las Prioridades</option>
                  <option value="Urgente">Urgente / Vencido</option>
                  <option value="Alta">Alta Prioridad</option>
                  <option value="Media">Media Prioridad</option>
                </select>

                <select
                  className="custom-input"
                  value={filtroAgencia}
                  onChange={e => setFiltroAgencia(e.target.value)}
                  style={{ paddingLeft: '12px', fontSize: '0.8rem' }}
                >
                  <option value="TODOS">Todas las Agencias</option>
                  {AGENCIAS_OFICIALES.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* TABLA DE EXPEDIENTES DEL ABOGADO */}
            <div style={{ background: '#141a24', border: '1px solid #263347', borderRadius: '8px', padding: '1.5rem' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #263347', color: '#94a3b8', fontSize: '0.725rem', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>
                      <th style={{ padding: '12px' }}>Folio</th>
                      <th style={{ padding: '12px' }}>Autoridad</th>
                      <th style={{ padding: '12px' }}>Asunto Legal</th>
                      <th style={{ padding: '12px' }}>Sucursal / Empresa</th>
                      <th style={{ padding: '12px' }}>Fecha Compromiso</th>
                      <th style={{ padding: '12px' }}>Prioridad</th>
                      <th style={{ padding: '12px' }}>Estatus</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpedientes.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '14px 12px', fontWeight: 600, color: '#c29b47', fontFamily: 'Montserrat, sans-serif' }}>{item.folio}</td>
                        <td style={{ padding: '14px 12px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, background: '#19212d', border: '1px solid #334155', color: '#ffffff' }}>
                            {item.autoridad || item.tipo}
                          </span>
                        </td>
                        <td style={{ padding: '14px 12px', color: '#ffffff', fontWeight: 600, maxWidth: '240px' }}>{item.titulo}</td>
                        <td style={{ padding: '14px 12px', color: '#cbd5e1' }}>{item.agencia}</td>
                        <td style={{ padding: '14px 12px', color: '#fbbf24', fontWeight: 700 }}>{item.fechaCompromiso || 'N/A'}</td>
                        <td style={{ padding: '14px 12px' }}>
                          <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, background: item.prioridad === 'Urgente' || item.prioridad === 'Vencido' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)', color: item.prioridad === 'Urgente' || item.prioridad === 'Vencido' ? '#f87171' : '#60a5fa', border: item.prioridad === 'Urgente' || item.prioridad === 'Vencido' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(59, 130, 246, 0.4)' }}>
                            {item.prioridad}
                          </span>
                        </td>
                        <td style={{ padding: '14px 12px' }}>
                          <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, background: item.estado === 'Concluido' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(59, 130, 246, 0.12)', color: item.estado === 'Concluido' ? '#4ade80' : '#60a5fa' }}>
                            {item.estado}
                          </span>
                        </td>
                        <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                          <button
                            onClick={() => setSelectedTicket(item)}
                            style={{
                              background: '#c29b47',
                              border: 'none',
                              color: '#0b0e14',
                              padding: '7px 14px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontFamily: 'Montserrat, sans-serif',
                              cursor: 'pointer',
                              fontWeight: 700
                            }}
                          >
                            Dictaminar / Ver Expediente
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredExpedientes.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                          No hay expedientes registrados en esta categoría.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        /* VISTA 2: MI CALENDARIO DE AUDIENCIAS Y EVENTOS ASIGNADOS */
        ) : activeSection === 'calendario' && !selectedTicket ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 className="formal-header-font" style={{ fontSize: '1.6rem', color: '#ffffff' }}>
                  Mi Calendario Legal de Audiencias
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Agenda de comparecencias ante tribunales, citas notariales e inspecciones asignadas a <strong>{abogadoNombre}</strong>
                </p>
              </div>

              {/* MODO GRID VS LISTA Y FILTRO */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', background: '#141a24', border: '1px solid #263347', padding: '4px', borderRadius: '6px' }}>
                  <button
                    onClick={() => setModoCalendario('grid')}
                    style={{
                      background: modoCalendario === 'grid' ? '#19212d' : 'transparent',
                      border: modoCalendario === 'grid' ? '1px solid #334155' : 'none',
                      color: modoCalendario === 'grid' ? '#c29b47' : '#94a3b8',
                      padding: '6px 14px',
                      borderRadius: '4px',
                      fontSize: '0.775rem',
                      fontFamily: 'Montserrat, sans-serif',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Vista Calendario Mensual
                  </button>

                  <button
                    onClick={() => setModoCalendario('lista')}
                    style={{
                      background: modoCalendario === 'lista' ? '#19212d' : 'transparent',
                      border: modoCalendario === 'lista' ? '1px solid #334155' : 'none',
                      color: modoCalendario === 'lista' ? '#c29b47' : '#94a3b8',
                      padding: '6px 14px',
                      borderRadius: '4px',
                      fontSize: '0.775rem',
                      fontFamily: 'Montserrat, sans-serif',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Vista Cronológica
                  </button>
                </div>

                <select
                  className="custom-input"
                  value={filtroTipoEvento}
                  onChange={e => setFiltroTipoEvento(e.target.value)}
                  style={{ paddingLeft: '12px', fontSize: '0.8rem' }}
                >
                  <option value="TODOS">Todos mis Eventos</option>
                  <option value="Audiencia">Audiencias Judiciales</option>
                  <option value="Incidencia">Incidencias & Términos</option>
                  <option value="Reunión">Reuniones Corporativas</option>
                </select>
              </div>
            </div>

            {/* MODO GRID MENSUAL */}
            {modoCalendario === 'grid' ? (
              <div style={{ background: '#141a24', border: '1px solid #263347', borderRadius: '8px', padding: '1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #263347', paddingBottom: '1rem' }}>
                  <h3 className="formal-header-font" style={{ fontSize: '1.5rem', color: '#ffffff' }}>
                    SEPTIEMBRE 2026
                  </h3>

                  <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.75rem', fontFamily: 'Montserrat, sans-serif' }}>
                    <span style={{ color: '#f87171' }}>● Incidencias</span>
                    <span style={{ color: '#60a5fa' }}>● Audiencias</span>
                    <span style={{ color: '#c084fc' }}>● Reuniones</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                  {['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'].map((d, i) => (
                    <div key={i} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', padding: '8px 0', borderBottom: '1px solid #263347', fontFamily: 'Montserrat, sans-serif' }}>
                      {d}
                    </div>
                  ))}

                  {diasMesSeptiembre.map((numDia, index) => {
                    if (numDia === null) {
                      return <div key={index} style={{ background: '#0b0e14', opacity: 0.3, minHeight: '110px', borderRadius: '6px' }}></div>;
                    }

                    const eventosDelDia = filteredEventos.filter(e => e.diaNumero === numDia);
                    const esHoy = numDia === 1;

                    return (
                      <div
                        key={index}
                        style={{
                          background: esHoy ? 'rgba(194, 155, 71, 0.04)' : '#0b0e14',
                          border: esHoy ? '1px solid #c29b47' : '1px solid #263347',
                          borderRadius: '6px',
                          padding: '8px',
                          minHeight: '115px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: esHoy ? '#c29b47' : '#ffffff', fontFamily: 'Montserrat, sans-serif' }}>
                            {numDia}
                          </span>
                          {esHoy && <span style={{ fontSize: '0.625rem', background: '#c29b47', color: '#0b0e14', padding: '1px 5px', borderRadius: '3px', fontWeight: 800 }}>HOY</span>}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', maxHeight: '80px' }}>
                          {eventosDelDia.map(ev => {
                            const colorBadge = ev.tipoEvento === 'Incidencia' ? '#f87171' : ev.tipoEvento === 'Audiencia' ? '#60a5fa' : '#c084fc';
                            const bgBadge = ev.tipoEvento === 'Incidencia' ? 'rgba(239, 68, 68, 0.2)' : ev.tipoEvento === 'Audiencia' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(168, 85, 247, 0.2)';

                            return (
                              <div
                                key={ev.id}
                                onClick={() => setSelectedEventoModal(ev)}
                                style={{
                                  background: bgBadge,
                                  border: `1px solid ${colorBadge}`,
                                  color: '#ffffff',
                                  padding: '4px 6px',
                                  borderRadius: '4px',
                                  fontSize: '0.675rem',
                                  cursor: 'pointer',
                                  lineHeight: 1.25
                                }}
                              >
                                <div style={{ color: colorBadge, fontWeight: 700, fontSize: '0.65rem' }}>
                                  {ev.hora} • {ev.folio}
                                </div>
                                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>
                                  {ev.titulo}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (

              /* MODO LISTA CRONOLÓGICA */
              <div style={{ background: '#141a24', border: '1px solid #263347', borderRadius: '8px', padding: '1.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {filteredEventos.map(ev => (
                    <div key={ev.id} style={{ background: '#0b0e14', border: '1px solid #263347', borderRadius: '8px', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
                      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div style={{ background: '#19212d', border: '1px solid #c29b47', padding: '12px 18px', borderRadius: '8px', textAlign: 'center', minWidth: '110px' }}>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#c29b47', fontFamily: 'Montserrat, sans-serif' }}>{ev.fecha}</div>
                          <div style={{ fontSize: '0.775rem', color: '#ffffff', fontWeight: 600, marginTop: '2px' }}>{ev.hora}</div>
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                            <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase' }}>
                              {ev.tipoEvento}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#c29b47', fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }}>
                              FOLIO: {ev.folio}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>• {ev.agencia}</span>
                          </div>

                          <h3 style={{ fontSize: '1.1rem', color: '#ffffff', fontWeight: 600, marginBottom: '4px' }}>
                            {ev.titulo}
                          </h3>

                          <div style={{ fontSize: '0.825rem', color: '#cbd5e1' }}>
                            📍 Sede: <strong>{ev.lugar}</strong>
                          </div>
                        </div>
                      </div>

                      <div>
                        <button
                          onClick={() => {
                            const found = assignedTickets.find(t => t.folio === ev.folio);
                            if (found) setSelectedTicket(found);
                          }}
                          style={{ background: 'rgba(194, 155, 71, 0.08)', border: '1px solid rgba(194, 155, 71, 0.3)', color: '#c29b47', padding: '7px 14px', borderRadius: '4px', fontSize: '0.75rem', fontFamily: 'Montserrat, sans-serif', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Ver Expediente del Ticket
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        ) : selectedTicket ? (

        /* VISTA 3: DETALLE Y DICTAMINACIÓN DEL EXPEDIENTE PARA EL ABOGADO */
          <div>
            <button
              onClick={() => setSelectedTicket(null)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#19212d', border: '1px solid #334155', color: '#cbd5e1', padding: '8px 16px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', marginBottom: '1.5rem', fontFamily: 'Montserrat, sans-serif' }}
            >
              ← Volver a Mis Expedientes
            </button>

            <div style={{ background: '#141a24', border: '1px solid #263347', borderRadius: '8px', padding: '2rem' }}>
              <div style={{ borderBottom: '1px solid #263347', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#c29b47', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Montserrat, sans-serif' }}>
                  FOLIO: {selectedTicket.folio} — {selectedTicket.agencia}
                </div>
                <h2 className="formal-header-font" style={{ fontSize: '1.6rem', color: '#ffffff', marginTop: '4px' }}>
                  {selectedTicket.titulo}
                </h2>
              </div>

              {/* INFORMACIÓN DEL EXPEDIENTE */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', background: '#0b0e14', padding: '1.25rem', borderRadius: '6px', border: '1px solid #263347', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Solicitante</div>
                  <div style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 600 }}>{selectedTicket.solicitante} ({selectedTicket.cargoSolicitante})</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Autoridad & Asunto</div>
                  <div style={{ fontSize: '0.85rem', color: '#c29b47', fontWeight: 600 }}>{selectedTicket.autoridad || selectedTicket.tipo} • {selectedTicket.asuntoTipo}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: '#fbbf24', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'Montserrat, sans-serif' }}>Fecha Compromiso</div>
                  <div style={{ fontSize: '0.9rem', color: '#fbbf24', fontWeight: 700 }}>{selectedTicket.fechaCompromiso}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Estatus Actual</div>
                  <div style={{ fontSize: '0.9rem', color: '#60a5fa', fontWeight: 600 }}>{selectedTicket.estado}</div>
                </div>
              </div>

              {/* DESCRIPCION */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif', marginBottom: '0.5rem' }}>Antecedentes del Caso</h4>
                <div style={{ background: '#19212d', padding: '1.25rem', borderRadius: '6px', border: '1px solid #263347', color: '#f1f5f9', lineHeight: 1.6 }}>
                  {selectedTicket.descripcion}
                </div>
              </div>

              {/* HISTORIAL */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif', marginBottom: '0.75rem' }}>
                  Historial de Actuaciones Jurídicas
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

              {/* DICTAMINACION */}
              <div style={{ background: '#0b0e14', border: '1px solid rgba(194, 155, 71, 0.4)', borderRadius: '6px', padding: '1.5rem' }}>
                <h4 className="formal-header-font" style={{ fontSize: '1.2rem', color: '#ffffff', marginBottom: '0.5rem' }}>
                  Emitir Dictamen Formal y Actualizar Estado
                </h4>

                <form onSubmit={handleAddDictamen}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label className="input-label">Estatus del Ticket</label>
                      <select 
                        className="custom-input" 
                        style={{ paddingLeft: '12px' }}
                        value={nuevoEstadoTicket} 
                        onChange={e => setNuevoEstadoTicket(e.target.value as any)}
                      >
                        <option value="En Revisión">En Revisión</option>
                        <option value="En Dictamen">En Dictamen</option>
                        <option value="Requiere Información">Requiere Información Adicional</option>
                        <option value="Urgente">Marcar Como Urgente</option>
                        <option value="Concluido">Concluido / Dictaminado Final</option>
                      </select>
                    </div>

                    <div>
                      <label className="input-label">Abogado Dictaminador</label>
                      <input type="text" readOnly className="custom-input" style={{ background: '#19212d', color: '#c29b47', fontWeight: 600, paddingLeft: '12px' }} value={abogadoNombre} />
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Dictamen Legal / Respuesta Formal para la Sucursal</label>
                    <textarea 
                      rows={4}
                      required
                      className="custom-input"
                      style={{ paddingLeft: '12px', resize: 'vertical', lineHeight: 1.5 }}
                      placeholder="Escriba aquí la resolución formal, escrito de contestación o requerimiento para la empresa..."
                      value={nuevoDictamen}
                      onChange={e => setNuevoDictamen(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="submit"
                      style={{ background: '#c29b47', border: 'none', color: '#0b0e14', padding: '10px 24px', borderRadius: '4px', fontWeight: 700, fontFamily: 'Montserrat, sans-serif', fontSize: '0.775rem', textTransform: 'uppercase', cursor: 'pointer' }}
                    >
                      Enviar Dictamen Formal
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>
        ) : null}

      </main>

      {/* MODAL DETALLE DE EVENTO EN EL CALENDARIO */}
      {selectedEventoModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: '#141a24', border: '1px solid #263347', borderRadius: '8px', width: '100%', maxWidth: '500px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #263347', paddingBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.725rem', color: '#c29b47', fontWeight: 700, fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase' }}>
                  {selectedEventoModal.tipoEvento} • FOLIO: {selectedEventoModal.folio}
                </span>
                <h3 className="formal-header-font" style={{ fontSize: '1.25rem', color: '#ffffff', marginTop: '2px' }}>
                  {selectedEventoModal.titulo}
                </h3>
              </div>
              <button onClick={() => setSelectedEventoModal(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ background: '#0b0e14', padding: '1rem', borderRadius: '6px', border: '1px solid #263347', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 600 }}>{selectedEventoModal.fecha} a las {selectedEventoModal.hora}</div>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '4px' }}>Sede: 📍 {selectedEventoModal.lugar}</div>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', background: '#19212d', padding: '10px', borderRadius: '4px', border: '1px solid #263347', marginBottom: '1.25rem' }}>
              {selectedEventoModal.detalles}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setSelectedEventoModal(null)} style={{ background: 'transparent', border: '1px solid #334155', color: '#cbd5e1', padding: '8px 14px', borderRadius: '4px', cursor: 'pointer' }}>Cerrar</button>
              <button 
                type="button" 
                onClick={() => {
                  const found = assignedTickets.find(t => t.folio === selectedEventoModal.folio);
                  if (found) {
                    setSelectedTicket(found);
                    setActiveSection('expedientes');
                  }
                  setSelectedEventoModal(null);
                }} 
                style={{ background: '#c29b47', border: 'none', color: '#0b0e14', padding: '8px 18px', borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}
              >
                Abrir Expediente
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
