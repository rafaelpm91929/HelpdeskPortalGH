import React, { useState } from 'react';

export interface TicketItem {
  id: string;
  folio: string;
  agencia: string;
  tipo: 'RH' | 'DEMANDA' | 'SOLICITUD' | 'CONTRATO';
  titulo: string;
  solicitante: string;
  cargoSolicitante: string;
  correoSolicitante: string;
  correosCopia?: string;
  descripcion: string;
  fechaCreacion: string;
  diasAbierto: number;
  estado: 'En Revisión' | 'En Dictamen' | 'Requiere Información' | 'Concluido' | 'Urgente';
  abogadoAsignado: string;
  prioridad: 'Normal' | 'Urgente';
  documentos: string[];
  historial: { fecha: string; autor: string; mensaje: string }[];
}

export interface UsuarioItem {
  id: string;
  nombre: string;
  correo: string;
  agencia: string;
  cargo: 'Gerente General' | 'Gerente Administrativo' | 'Recursos Humanos' | 'Abogado' | 'Colaborador';
  estatus: 'Activo' | 'Inactivo';
}

export const AGENCIAS_OFICIALES = [
  'Suzuki Montevideo',
  'Divol Norte',
  'Divol Perinorte',
  'Divol Lindavista',
  'Omoda Esmeralda',
  'Divol Truks',
  'Cupra La Villa',
  'Divol Tlalnepantla'
];

export const ExecutiveDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [currentSection, setCurrentSection] = useState<'expedientes' | 'agencias' | 'graficas' | 'usuarios'>('expedientes');
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [filtroAgencia, setFiltroAgencia] = useState<string>('TODOS');

  // Filtros de Gráficas
  const [rangoGraficas, setRangoGraficas] = useState<'mes' | 'trimestre' | 'anio'>('mes');

  // Form para dar de alta usuario
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoCorreo, setNuevoCorreo] = useState('');
  const [nuevaAgencia, setNuevaAgencia] = useState(AGENCIAS_OFICIALES[0]);
  const [nuevoCargo, setNuevoCargo] = useState<UsuarioItem['cargo']>('Gerente Administrativo');

  // Datos de prueba: Usuarios sin el apellido Huerta
  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([
    { id: '1', nombre: 'Lic. Ricardo Morales', correo: 'rmorales@grupohuerta.com', agencia: 'Corporativo Grupo Huerta', cargo: 'Gerente General', estatus: 'Activo' },
    { id: '2', nombre: 'Ing. Carlos Mendoza', correo: 'cmendoza@divol.com', agencia: 'Divol Norte', cargo: 'Gerente Administrativo', estatus: 'Activo' },
    { id: '3', nombre: 'Lic. Sofía Ramírez', correo: 'sramirez@grupohuerta.com', agencia: 'Divol Lindavista', cargo: 'Recursos Humanos', estatus: 'Activo' },
    { id: '4', nombre: 'Lic. Mariana Fernández', correo: 'mfernandez@juridico-gh.com', agencia: 'Corporativo Grupo Huerta', cargo: 'Abogado', estatus: 'Activo' },
    { id: '5', nombre: 'Roberto Garza', correo: 'rgarza@suzukimontevideo.com', agencia: 'Suzuki Montevideo', cargo: 'Gerente General', estatus: 'Activo' }
  ]);

  // Datos de prueba: Tickets/Expedientes
  const [tickets] = useState<TicketItem[]>([
    {
      id: '1',
      folio: 'JUR-2026-089',
      agencia: 'Divol Norte',
      tipo: 'DEMANDA',
      titulo: 'Notificación Mercantil de Juicio Ejecutivo',
      solicitante: 'Carlos Mendoza',
      cargoSolicitante: 'Gerente Administrativo',
      correoSolicitante: 'cmendoza@divol.com',
      correosCopia: 'direccion@divol.com, contabilidad@divol.com',
      descripcion: 'Se recibió emplazamiento respecto al expediente mercantil 402/2026. Se requiere contestación de demanda antes del 02/09/2026.',
      fechaCreacion: '20/08/2026',
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
      id: '2',
      folio: 'JUR-2026-084',
      agencia: 'Divol Lindavista',
      tipo: 'RH',
      titulo: 'Rescisión Laboral de Asesor de Ventas por Faltas Injustificadas',
      solicitante: 'Sofía Ramírez',
      cargoSolicitante: 'Recursos Humanos',
      correoSolicitante: 'sramirez@grupohuerta.com',
      correosCopia: 'gerencia@divollindavista.com',
      descripcion: 'Solicitud de elaboración de convenio de finiquito y acta administrativa de rescisión de contrato sin responsabilidad para la empresa.',
      fechaCreacion: '24/08/2026',
      diasAbierto: 5,
      estado: 'En Dictamen',
      abogadoAsignado: 'Lic. Roberto Garza',
      prioridad: 'Normal',
      documentos: ['Acta_Administrativa_Faltas.pdf', 'Kardex_Asistencia.pdf'],
      historial: [
        { fecha: '24/08/2026 10:00', autor: 'Sofía Ramírez (RH)', mensaje: 'Envío de expediente laboral para cálculo de finiquito y finiquito legal.' }
      ]
    },
    {
      id: '3',
      folio: 'JUR-2026-081',
      agencia: 'Suzuki Montevideo',
      tipo: 'CONTRATO',
      titulo: 'Revisión y Convenio Modificatorio de Arrendamiento de Instalaciones',
      solicitante: 'Roberto Garza',
      cargoSolicitante: 'Gerente General',
      correoSolicitante: 'rgarza@suzukimontevideo.com',
      descripcion: 'Revisión de cláusula de plazo forzoso e incremento de renta anual para la sucursal de refacciones.',
      fechaCreacion: '27/08/2026',
      diasAbierto: 2,
      estado: 'En Revisión',
      abogadoAsignado: 'Lic. Mariana Fernández',
      prioridad: 'Normal',
      documentos: ['Borrador_Convenio_Arrendamiento.docx'],
      historial: [
        { fecha: '27/08/2026 16:20', autor: 'Roberto Garza (Gerente General)', mensaje: 'Envío de borrador de contrato para análisis de cláusulas.' }
      ]
    },
    {
      id: '4',
      folio: 'JUR-2026-075',
      agencia: 'Cupra La Villa',
      tipo: 'SOLICITUD',
      titulo: 'Dictamen de Poderes Notariales para Representante Legal',
      solicitante: 'Fernando Alonso',
      cargoSolicitante: 'Gerente Administrativo',
      correoSolicitante: 'falonso@cupralavilla.com',
      descripcion: 'Validación de facultades para actos de administración y pleitos y cobranzas ante autoridades tributarias.',
      fechaCreacion: '22/08/2026',
      diasAbierto: 7,
      estado: 'Concluido',
      abogadoAsignado: 'Lic. Carlos Mendoza',
      prioridad: 'Normal',
      documentos: ['Escritura_Poder_Notarial_584.pdf'],
      historial: [
        { fecha: '22/08/2026 11:00', autor: 'Fernando Alonso (Gerente Admin)', mensaje: 'Registro de solicitud de validación de testimonio notarial.' },
        { fecha: '25/08/2026 17:00', autor: 'Lic. Carlos Mendoza (Abogado)', mensaje: 'Poder emitido y certificado. Dictamen concluido con éxito.' }
      ]
    }
  ]);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim() || !nuevoCorreo.trim()) return;

    const newU: UsuarioItem = {
      id: Date.now().toString(),
      nombre: nuevoNombre,
      correo: nuevoCorreo,
      agencia: nuevaAgencia,
      cargo: nuevoCargo,
      estatus: 'Activo'
    };

    setUsuarios([...usuarios, newU]);
    setShowAddUserModal(false);
    setNuevoNombre('');
    setNuevoCorreo('');
  };

  const filteredTickets = tickets.filter(t => {
    const matchTipo = filtroTipo === 'TODOS' || t.tipo === filtroTipo;
    const matchAgencia = filtroAgencia === 'TODOS' || t.agencia === filtroAgencia;
    return matchTipo && matchAgencia;
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0b0e14' }}>
      
      {/* MENU LATERAL (SIDEBAR) */}
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
          {/* HEADER SIDEBAR */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 0.5rem 1.5rem 0.5rem', borderBottom: '1px solid #263347', marginBottom: '1.5rem' }}>
            <div style={{ background: 'rgba(194, 155, 71, 0.1)', border: '1px solid rgba(194, 155, 71, 0.3)', padding: '6px', borderRadius: '6px', color: '#c29b47' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 3v18M3 7h18M6 12l-3 5h6l-3-5zm12 0l-3 5h6l-3-5z"/>
              </svg>
            </div>
            <div>
              <div className="formal-header-font" style={{ fontSize: '1.1rem', color: '#ffffff' }}>PORTAL JURÍDICO</div>
              <div style={{ fontSize: '0.675rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Grupo Huerta</div>
            </div>
          </div>

          {/* OPCIONES DE MENU */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              onClick={() => { setCurrentSection('expedientes'); setSelectedTicket(null); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '10px 14px',
                borderRadius: '6px',
                border: 'none',
                background: currentSection === 'expedientes' && !selectedTicket ? '#19212d' : 'transparent',
                color: currentSection === 'expedientes' && !selectedTicket ? '#c29b47' : '#94a3b8',
                fontWeight: currentSection === 'expedientes' && !selectedTicket ? 600 : 400,
                fontSize: '0.825rem',
                fontFamily: 'Montserrat, sans-serif',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span>Expedientes y Tickets</span>
            </button>

            <button
              onClick={() => { setCurrentSection('agencias'); setSelectedTicket(null); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '10px 14px',
                borderRadius: '6px',
                border: 'none',
                background: currentSection === 'agencias' ? '#19212d' : 'transparent',
                color: currentSection === 'agencias' ? '#c29b47' : '#94a3b8',
                fontWeight: currentSection === 'agencias' ? 600 : 400,
                fontSize: '0.825rem',
                fontFamily: 'Montserrat, sans-serif',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              <span>Agencias del Grupo</span>
            </button>

            <button
              onClick={() => { setCurrentSection('graficas'); setSelectedTicket(null); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '10px 14px',
                borderRadius: '6px',
                border: 'none',
                background: currentSection === 'graficas' ? '#19212d' : 'transparent',
                color: currentSection === 'graficas' ? '#c29b47' : '#94a3b8',
                fontWeight: currentSection === 'graficas' ? 600 : 400,
                fontSize: '0.825rem',
                fontFamily: 'Montserrat, sans-serif',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              <span>Gráficas & Reportes</span>
            </button>

            <button
              onClick={() => { setCurrentSection('usuarios'); setSelectedTicket(null); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '10px 14px',
                borderRadius: '6px',
                border: 'none',
                background: currentSection === 'usuarios' ? '#19212d' : 'transparent',
                color: currentSection === 'usuarios' ? '#c29b47' : '#94a3b8',
                fontWeight: currentSection === 'usuarios' ? 600 : 400,
                fontSize: '0.825rem',
                fontFamily: 'Montserrat, sans-serif',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <span>Gestión de Usuarios</span>
            </button>
          </nav>
        </div>

        {/* PIE DE SIDEBAR */}
        <div style={{ borderTop: '1px solid #263347', paddingTop: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#ffffff', fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }}>Lic. Ricardo Morales</div>
          <div style={{ fontSize: '0.7rem', color: '#c29b47' }}>Gerente General / Alta Dirección</div>
          <button 
            onClick={onLogout}
            style={{ marginTop: '0.75rem', background: 'transparent', border: '1px solid #334155', color: '#f87171', padding: '6px 12px', borderRadius: '4px', fontSize: '0.725rem', width: '100%', cursor: 'pointer' }}
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto' }}>
        
        {/* VISTA 1: DETALLE DE EXPEDIENTE (PESTAÑA DEDICADA) */}
        {selectedTicket ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <button
                onClick={() => setSelectedTicket(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#19212d',
                  border: '1px solid #334155',
                  color: '#cbd5e1',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  fontFamily: 'Montserrat, sans-serif'
                }}
              >
                ← Volver al Listado de Expedientes
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ padding: '6px 14px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(194, 155, 71, 0.1)', color: '#c29b47', border: '1px solid rgba(194, 155, 71, 0.3)' }}>
                  FOLIO: {selectedTicket.folio}
                </span>
                <span style={{ padding: '6px 14px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, background: selectedTicket.diasAbierto >= 5 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)', color: selectedTicket.diasAbierto >= 5 ? '#f87171' : '#60a5fa', border: selectedTicket.diasAbierto >= 5 ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(59, 130, 246, 0.35)' }}>
                  {selectedTicket.diasAbierto >= 5 ? `ALERTA: ${selectedTicket.diasAbierto} DÍAS SIN CONCLUIR` : `${selectedTicket.diasAbierto} DÍAS TRANSCURRIDOS`}
                </span>
              </div>
            </div>

            {/* EXPEDIENTE COMPLETO */}
            <div style={{ background: '#141a24', border: '1px solid #263347', borderRadius: '8px', padding: '2rem' }}>
              <div style={{ borderBottom: '1px solid #263347', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#c29b47', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Montserrat, sans-serif' }}>
                  EXPEDIENTE TIPO: {selectedTicket.tipo} — {selectedTicket.agencia}
                </div>
                <h2 className="formal-header-font" style={{ fontSize: '1.6rem', color: '#ffffff', marginTop: '4px' }}>
                  {selectedTicket.titulo}
                </h2>
              </div>

              {/* INFORMACION DEL SOLICITANTE */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', background: '#0b0e14', padding: '1.25rem', borderRadius: '6px', border: '1px solid #263347', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Usuario Solicitante</div>
                  <div style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 600 }}>{selectedTicket.solicitante}</div>
                  <div style={{ fontSize: '0.75rem', color: '#c29b47' }}>{selectedTicket.cargoSolicitante}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Correo del Solicitante</div>
                  <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{selectedTicket.correoSolicitante}</div>
                  {selectedTicket.correosCopia && (
                    <div style={{ fontSize: '0.725rem', color: '#64748b' }}>CC: {selectedTicket.correosCopia}</div>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Abogado Asignado</div>
                  <div style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 600 }}>{selectedTicket.abogadoAsignado}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Fecha de Registro</div>
                  <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{selectedTicket.fechaCreacion}</div>
                </div>
              </div>

              {/* DESCRIPCION DE LOS HECHOS */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif', marginBottom: '0.5rem' }}>
                  Descripción y Antecedentes del Asunto Legal
                </h4>
                <div style={{ background: '#19212d', padding: '1.25rem', borderRadius: '6px', border: '1px solid #263347', color: '#f1f5f9', lineHeight: 1.6, fontSize: '0.9rem' }}>
                  {selectedTicket.descripcion}
                </div>
              </div>

              {/* DOCUMENTOS ADJUNTOS */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif', marginBottom: '0.5rem' }}>
                  Documentos y Expedientes Adjuntos
                </h4>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {selectedTicket.documentos.map((doc, idx) => (
                    <div key={idx} style={{ background: '#0b0e14', border: '1px solid #263347', padding: '10px 14px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', color: '#c29b47', fontSize: '0.825rem' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      <span>{doc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* HISTORIAL Y SEGUIMIENTO */}
              <div>
                <h4 style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif', marginBottom: '0.75rem' }}>
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
        ) : currentSection === 'expedientes' ? (
          <div>
            {/* SECCION PRINCIPAL DE EXPEDIENTES */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 className="formal-header-font" style={{ fontSize: '1.5rem', color: '#ffffff' }}>
                  Expedientes Legales y Solicitudes
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Gestión central de asuntos por tipo, antigüedad y empresa
                </p>
              </div>

              {/* FILTROS DE EXPEDIENTES */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <select
                  className="custom-input"
                  value={filtroTipo}
                  onChange={e => setFiltroTipo(e.target.value)}
                  style={{ paddingLeft: '12px', fontSize: '0.8rem' }}
                >
                  <option value="TODOS">Todos los Tipos (RH, DEMANDA, etc.)</option>
                  <option value="RH">Recursos Humanos (RH)</option>
                  <option value="DEMANDA">Demandas & Litigios</option>
                  <option value="SOLICITUD">Solicitudes Notariales</option>
                  <option value="CONTRATO">Revisión de Contratos</option>
                </select>

                <select
                  className="custom-input"
                  value={filtroAgencia}
                  onChange={e => setFiltroAgencia(e.target.value)}
                  style={{ paddingLeft: '12px', fontSize: '0.8rem' }}
                >
                  <option value="TODOS">Todas las Agencias del Grupo</option>
                  {AGENCIAS_OFICIALES.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* TABLA DE EXPEDIENTES */}
            <div style={{ background: '#141a24', border: '1px solid #263347', borderRadius: '8px', padding: '1.5rem' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #263347', color: '#94a3b8', fontSize: '0.725rem', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>
                      <th style={{ padding: '12px' }}>Folio</th>
                      <th style={{ padding: '12px' }}>Tipo</th>
                      <th style={{ padding: '12px' }}>Agencia / Empresa</th>
                      <th style={{ padding: '12px' }}>Asunto Legal</th>
                      <th style={{ padding: '12px' }}>Solicitante & Cargo</th>
                      <th style={{ padding: '12px' }}>Antigüedad</th>
                      <th style={{ padding: '12px' }}>Estatus</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Pestaña de Expediente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.map(item => {
                      const esAlerta = item.diasAbierto >= 5;
                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '14px 12px', fontWeight: 600, color: '#c29b47', fontFamily: 'Montserrat, sans-serif' }}>{item.folio}</td>
                          <td style={{ padding: '14px 12px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, background: '#19212d', border: '1px solid #334155', color: '#ffffff' }}>
                              {item.tipo}
                            </span>
                          </td>
                          <td style={{ padding: '14px 12px', color: '#ffffff', fontWeight: 500 }}>{item.agencia}</td>
                          <td style={{ padding: '14px 12px', color: '#cbd5e1', maxWidth: '240px' }}>{item.titulo}</td>
                          <td style={{ padding: '14px 12px' }}>
                            <div style={{ color: '#ffffff', fontWeight: 500 }}>{item.solicitante}</div>
                            <div style={{ fontSize: '0.725rem', color: '#c29b47' }}>{item.cargoSolicitante}</div>
                          </td>
                          <td style={{ padding: '14px 12px' }}>
                            {esAlerta ? (
                              <span style={{ color: '#f87171', fontWeight: 700, fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.15)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                                ALERTA: {item.diasAbierto} DÍAS
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{item.diasAbierto} días</span>
                            )}
                          </td>
                          <td style={{ padding: '14px 12px' }}>
                            <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, background: item.estado === 'Urgente' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(59, 130, 246, 0.12)', color: item.estado === 'Urgente' ? '#f87171' : '#60a5fa' }}>
                              {item.estado}
                            </span>
                          </td>
                          <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                            <button
                              onClick={() => setSelectedTicket(item)}
                              style={{
                                background: 'rgba(194, 155, 71, 0.08)',
                                border: '1px solid rgba(194, 155, 71, 0.3)',
                                color: '#c29b47',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontFamily: 'Montserrat, sans-serif',
                                cursor: 'pointer',
                                fontWeight: 600
                              }}
                            >
                              Abrir Expediente
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : currentSection === 'agencias' ? (
          <div>
            {/* VISTA AGENCIAS */}
            <h2 className="formal-header-font" style={{ fontSize: '1.5rem', color: '#ffffff', marginBottom: '0.5rem' }}>
              Catálogo de Agencias de Grupo Huerta
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
              Listado de sucursales habilitadas para el envío de trámites legales
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {AGENCIAS_OFICIALES.map((agencia, i) => (
                <div key={i} style={{ background: '#141a24', border: '1px solid #263347', padding: '1.5rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.725rem', color: '#c29b47', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>SUCURSAL REGISTRADA</div>
                  <h3 style={{ fontSize: '1.15rem', color: '#ffffff', marginTop: '4px', marginBottom: '0.75rem' }}>{agencia}</h3>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #263347', paddingTop: '0.75rem' }}>
                    <span>Estatus: <strong style={{ color: '#4ade80' }}>Activa</strong></span>
                    <span>Modo: <strong>Multitenant</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : currentSection === 'graficas' ? (
          <div>
            {/* PANEL DE GRÁFICAS MÚLTIPLES E INTERACTIVAS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 className="formal-header-font" style={{ fontSize: '1.5rem', color: '#ffffff' }}>
                  Estadísticas y Métricas Corporativas
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Análisis consolidado por Agencia, Usuario Resolutor, Tipo de Trámite y SLA de Días
                </p>
              </div>

              {/* FILTROS TEMPORALES */}
              <div style={{ display: 'flex', gap: '8px', background: '#141a24', border: '1px solid #263347', padding: '4px', borderRadius: '6px' }}>
                {(['mes', 'trimestre', 'anio'] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setRangoGraficas(r)}
                    style={{
                      background: rangoGraficas === r ? '#19212d' : 'transparent',
                      border: rangoGraficas === r ? '1px solid #334155' : 'none',
                      color: rangoGraficas === r ? '#c29b47' : '#94a3b8',
                      padding: '6px 14px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontFamily: 'Montserrat, sans-serif',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textTransform: 'uppercase'
                    }}
                  >
                    {r === 'mes' ? 'Este Mes' : r === 'trimestre' ? 'Trimestral' : 'Año 2026'}
                  </button>
                ))}
              </div>
            </div>

            {/* GRID DE 4 GRAFICAS DIVERSAS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '1.5rem' }}>
              
              {/* GRAFICA 1: VOLUMEN POR AGENCIA */}
              <div style={{ background: '#141a24', border: '1px solid #263347', padding: '1.75rem', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '0.875rem', color: '#c29b47', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif', marginBottom: '1.25rem' }}>
                  Volumen de Asuntos por Agencia / Sucursal
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { agencia: 'Suzuki Montevideo', casos: 14, pct: '85%' },
                    { agencia: 'Divol Norte', casos: 12, pct: '72%' },
                    { agencia: 'Divol Lindavista', casos: 9, pct: '55%' },
                    { agencia: 'Cupra La Villa', casos: 8, pct: '48%' },
                    { agencia: 'Mazda Guadalajara', casos: 6, pct: '38%' },
                    { agencia: 'Omoda Esmeralda', casos: 5, pct: '30%' },
                    { agencia: 'Divol Truks', casos: 4, pct: '24%' },
                    { agencia: 'Divol Tlalnepantla', casos: 3, pct: '18%' }
                  ].map((item, idx) => (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', color: '#cbd5e1', marginBottom: '4px' }}>
                        <span>{item.agencia}</span>
                        <span style={{ fontWeight: 600, color: '#ffffff' }}>{item.casos} Expedientes</span>
                      </div>
                      <div style={{ background: '#0b0e14', height: '7px', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ background: '#c29b47', width: item.pct, height: '100%', borderRadius: '4px' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* GRAFICA 2: CARGA DE ASUNTOS POR ABOGADO / USUARIO */}
              <div style={{ background: '#141a24', border: '1px solid #263347', padding: '1.75rem', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '0.875rem', color: '#c29b47', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif', marginBottom: '1.25rem' }}>
                  Carga y Efectividad por Abogado Resolutor
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {[
                    { abogado: 'Lic. Mariana Fernández', asignados: 18, resueltos: 16, sla: '94%' },
                    { abogado: 'Lic. Roberto Garza', asignados: 14, resueltos: 12, sla: '91%' },
                    { abogado: 'Lic. Carlos Mendoza', asignados: 11, resueltos: 11, sla: '98%' }
                  ].map((abg, idx) => (
                    <div key={idx} style={{ background: '#0b0e14', border: '1px solid #263347', padding: '1rem', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <strong style={{ fontSize: '0.875rem', color: '#ffffff' }}>{abg.abogado}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: 600 }}>SLA: {abg.sla}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '6px' }}>
                        <span>Asignados: {abg.asignados}</span>
                        <span>Dictaminados: {abg.resueltos}</span>
                      </div>

                      <div style={{ background: '#19212d', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ background: '#60a5fa', width: abg.sla, height: '100%' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* GRAFICA 3: DISTRIBUCION POR TIPO DE TICKET */}
              <div style={{ background: '#141a24', border: '1px solid #263347', padding: '1.75rem', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '0.875rem', color: '#c29b47', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif', marginBottom: '1.25rem' }}>
                  Clasificación por Tipo de Asunto Legal
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    { tipo: 'DEMANDA (Demandas & Litigios Mercantiles)', pct: '38%', color: '#f87171' },
                    { tipo: 'RH (Recursos Humanos & Rescisiones)', pct: '28%', color: '#fbbf24' },
                    { tipo: 'CONTRATO (Revisión de Arrendamientos & Convenios)', pct: '20%', color: '#60a5fa' },
                    { tipo: 'SOLICITUD (Poderes Notariales & Dictámenes)', pct: '14%', color: '#4ade80' }
                  ].map((t, idx) => (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', color: '#ffffff', marginBottom: '4px' }}>
                        <span>{t.tipo}</span>
                        <strong style={{ color: t.color }}>{t.pct}</strong>
                      </div>
                      <div style={{ background: '#0b0e14', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ background: t.color, width: t.pct, height: '100%' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* GRAFICA 4: ANTIGÜEDAD Y SLA POR DIAS */}
              <div style={{ background: '#141a24', border: '1px solid #263347', padding: '1.75rem', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '0.875rem', color: '#c29b47', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif', marginBottom: '1.25rem' }}>
                  Control de Días Transcurridos y Alertas SLA
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', textAlign: 'center' }}>
                  <div style={{ background: '#0b0e14', border: '1px solid #263347', padding: '1rem 0.5rem', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#4ade80', textTransform: 'uppercase', fontWeight: 600 }}>0 a 3 Días</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#ffffff', margin: '4px 0', fontFamily: 'Cormorant Garamond, serif' }}>75%</div>
                    <div style={{ fontSize: '0.675rem', color: '#94a3b8' }}>A tiempo</div>
                  </div>

                  <div style={{ background: '#0b0e14', border: '1px solid #263347', padding: '1rem 0.5rem', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#fbbf24', textTransform: 'uppercase', fontWeight: 600 }}>4 a 7 Días</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#ffffff', margin: '4px 0', fontFamily: 'Cormorant Garamond, serif' }}>18%</div>
                    <div style={{ fontSize: '0.675rem', color: '#94a3b8' }}>Próximo a límite</div>
                  </div>

                  <div style={{ background: '#0b0e14', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1rem 0.5rem', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#f87171', textTransform: 'uppercase', fontWeight: 600 }}>+7 Días</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f87171', margin: '4px 0', fontFamily: 'Cormorant Garamond, serif' }}>7%</div>
                    <div style={{ fontSize: '0.675rem', color: '#f87171' }}>Alerta Vencida</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div>
            {/* VISTA GESTIÓN DE USUARIOS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 className="formal-header-font" style={{ fontSize: '1.5rem', color: '#ffffff' }}>
                  Gestión de Usuarios del Sistema
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Administración de accesos por cargo y agencia del grupo
                </p>
              </div>

              <button
                onClick={() => setShowAddUserModal(true)}
                style={{
                  background: '#c29b47',
                  border: 'none',
                  color: '#0b0e14',
                  padding: '9px 18px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  fontFamily: 'Montserrat, sans-serif',
                  textTransform: 'uppercase',
                  cursor: 'pointer'
                }}
              >
                + Dar de Alta Usuario
              </button>
            </div>

            <div style={{ background: '#141a24', border: '1px solid #263347', borderRadius: '8px', padding: '1.5rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #263347', color: '#94a3b8', fontSize: '0.725rem', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>
                    <th style={{ padding: '12px' }}>Nombre</th>
                    <th style={{ padding: '12px' }}>Correo Corporativo</th>
                    <th style={{ padding: '12px' }}>Agencia / Empresa</th>
                    <th style={{ padding: '12px' }}>Cargo / Rol</th>
                    <th style={{ padding: '12px' }}>Estatus</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '12px', fontWeight: 600, color: '#ffffff' }}>{u.nombre}</td>
                      <td style={{ padding: '12px', color: '#cbd5e1' }}>{u.correo}</td>
                      <td style={{ padding: '12px', color: '#94a3b8' }}>{u.agencia}</td>
                      <td style={{ padding: '12px', color: '#c29b47', fontWeight: 600 }}>{u.cargo}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', background: 'rgba(34, 197, 94, 0.12)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                          {u.estatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* MODAL DAR DE ALTA USUARIO */}
      {showAddUserModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: '#141a24', border: '1px solid #263347', borderRadius: '8px', width: '100%', maxWidth: '500px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #263347', paddingBottom: '0.75rem' }}>
              <h3 className="formal-header-font" style={{ fontSize: '1.3rem', color: '#ffffff' }}>Dar de Alta Nuevo Usuario</h3>
              <button onClick={() => setShowAddUserModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleAddUser}>
              <div className="input-group">
                <label className="input-label">Nombre Completo</label>
                <input type="text" required className="custom-input" style={{ paddingLeft: '12px' }} value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} />
              </div>

              <div className="input-group">
                <label className="input-label">Correo Electrónico Corporativo</label>
                <input type="email" required className="custom-input" style={{ paddingLeft: '12px' }} value={nuevoCorreo} onChange={e => setNuevoCorreo(e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label className="input-label">Agencia / Empresa</label>
                  <select className="custom-input" style={{ paddingLeft: '12px' }} value={nuevaAgencia} onChange={e => setNuevaAgencia(e.target.value)}>
                    {AGENCIAS_OFICIALES.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>

                <div>
                  <label className="input-label">Cargo / Puesto</label>
                  <select className="custom-input" style={{ paddingLeft: '12px' }} value={nuevoCargo} onChange={e => setNuevoCargo(e.target.value as any)}>
                    <option value="Gerente General">Gerente General</option>
                    <option value="Gerente Administrativo">Gerente Administrativo</option>
                    <option value="Recursos Humanos">Recursos Humanos</option>
                    <option value="Abogado">Abogado</option>
                    <option value="Colaborador">Colaborador</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" onClick={() => setShowAddUserModal(false)} style={{ background: 'transparent', border: '1px solid #334155', color: '#cbd5e1', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ background: '#c29b47', border: 'none', color: '#0b0e14', padding: '8px 20px', borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}>Guardar Usuario</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
