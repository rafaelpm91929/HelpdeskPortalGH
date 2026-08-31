import React, { useState } from 'react';
import logoGrupoHuerta from '../assets/logo_grupo_huerta.jpg';

export interface TicketItem {
  id: string;
  folio: string;
  agencia: string;
  autoridad?: string;
  asuntoTipo?: string;
  tipo: 'RH' | 'DEMANDA' | 'SOLICITUD' | 'CONTRATO';
  titulo: string;
  solicitante: string;
  cargoSolicitante: string;
  correoSolicitante: string;
  correosCopia?: string;
  descripcion: string;
  fechaCreacion: string;
  fechaCompromiso?: string;
  diasAbierto: number;
  estado: 'En Revisión' | 'En Dictamen' | 'Requiere Información' | 'Concluido' | 'Urgente';
  abogadoAsignado: string;
  prioridad: 'Media' | 'Alta' | 'Urgente' | 'Vencido';
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

export interface EventoCalendario {
  id: string;
  folio: string;
  agencia: string;
  tipoEvento: 'Audiencia' | 'Incidencia' | 'Cita Notarial' | 'Reunión';
  titulo: string;
  fecha: string;
  diaNumero: number;
  hora: string;
  lugar: string;
  abogado: string;
  detalles: string;
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

export const ABOGADOS_LISTA = [
  'TODOS (Alta Dirección)',
  'Lic. Mariana Fernández',
  'Lic. Roberto Garza',
  'Lic. Carlos Mendoza'
];

export const ExecutiveDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [currentSection, setCurrentSection] = useState<'principal' | 'mis_expedientes' | 'calendario' | 'expedientes' | 'agencias' | 'graficas' | 'usuarios'>('principal');
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  
  // Abogado Activo en el Selector (Vista de Abogado)
  const [abogadoFiltro, setAbogadoFiltro] = useState<string>('Lic. Mariana Fernández');

  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [filtroAgencia, setFiltroAgencia] = useState<string>('TODOS');
  const [filtroEstatusAbogado, setFiltroEstatusAbogado] = useState<'TODOS' | 'ACTUALES' | 'CONCLUIDOS'>('ACTUALES');

  // Filtros de la vista Calendario
  const [modoCalendario, setModoCalendario] = useState<'grid' | 'lista'>('grid');
  const [filtroTipoEvento, setFiltroTipoEvento] = useState<string>('TODOS');
  const [selectedEventoModal, setSelectedEventoModal] = useState<EventoCalendario | null>(null);

  // Filtros de Gráficas
  const [rangoGraficas, setRangoGraficas] = useState<'mes' | 'trimestre' | 'anio'>('mes');

  // Form para dar de alta usuario
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoCorreo, setNuevoCorreo] = useState('');
  const [nuevaAgencia, setNuevaAgencia] = useState(AGENCIAS_OFICIALES[0]);
  const [nuevoCargo, setNuevoCargo] = useState<UsuarioItem['cargo']>('Gerente Administrativo');

  // Modal para Asignar Abogado a Ticket Sin Atender
  const [assigningTicketFolio, setAssigningTicketFolio] = useState<string | null>(null);
  const [selectedAbogadoAssign, setSelectedAbogadoAssign] = useState('Lic. Mariana Fernández');

  // Estado para responder / dictaminar ticket en el expediente
  const [nuevoDictamen, setNuevoDictamen] = useState('');
  const [nuevoEstadoTicket, setNuevoEstadoTicket] = useState<TicketItem['estado']>('En Dictamen');

  // Datos de prueba: Usuarios sin el apellido Huerta
  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([
    { id: '1', nombre: 'Lic. Ricardo Morales', correo: 'rmorales@grupohuerta.com', agencia: 'Corporativo Grupo Huerta', cargo: 'Gerente General', estatus: 'Activo' },
    { id: '2', nombre: 'Ing. Carlos Mendoza', correo: 'cmendoza@divol.com', agencia: 'Divol Norte', cargo: 'Gerente Administrativo', estatus: 'Activo' },
    { id: '3', nombre: 'Lic. Sofía Ramírez', correo: 'sramirez@grupohuerta.com', agencia: 'Divol Lindavista', cargo: 'Recursos Humanos', estatus: 'Activo' },
    { id: '4', nombre: 'Lic. Mariana Fernández', correo: 'mfernandez@juridico-gh.com', agencia: 'Corporativo Grupo Huerta', cargo: 'Abogado', estatus: 'Activo' },
    { id: '5', nombre: 'Roberto Garza', correo: 'rgarza@suzukimontevideo.com', agencia: 'Suzuki Montevideo', cargo: 'Gerente General', estatus: 'Activo' }
  ]);

  // Datos de prueba: Tickets/Expedientes
  const [tickets, setTickets] = useState<TicketItem[]>([
    {
      id: '1',
      folio: 'JUR-2026-089',
      agencia: 'Divol Norte',
      autoridad: 'Laboral',
      asuntoTipo: 'Demanda / Denuncia',
      tipo: 'DEMANDA',
      titulo: 'Notificación Mercantil de Juicio Ejecutivo',
      solicitante: 'Carlos Mendoza',
      cargoSolicitante: 'Gerente Administrativo',
      correoSolicitante: 'cmendoza@divol.com',
      correosCopia: 'direccion@divol.com, contabilidad@divol.com',
      descripcion: 'Se recibió emplazamiento respecto al expediente mercantil 402/2026. Se requiere contestación de demanda antes de la fecha compromiso.',
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
      id: '2',
      folio: 'JUR-2026-084',
      agencia: 'Divol Lindavista',
      autoridad: 'Laboral',
      asuntoTipo: 'Elaboración',
      tipo: 'RH',
      titulo: 'Rescisión Laboral de Asesor de Ventas por Faltas Injustificadas',
      solicitante: 'Sofía Ramírez',
      cargoSolicitante: 'Recursos Humanos',
      correoSolicitante: 'sramirez@grupohuerta.com',
      correosCopia: 'gerencia@divollindavista.com',
      descripcion: 'Solicitud de elaboración de convenio de finiquito y acta administrativa de rescisión de contrato sin responsabilidad para la empresa.',
      fechaCreacion: '24/08/2026',
      fechaCompromiso: '03/09/2026',
      diasAbierto: 5,
      estado: 'En Dictamen',
      abogadoAsignado: 'Lic. Roberto Garza',
      prioridad: 'Media',
      documentos: ['Acta_Administrativa_Faltas.pdf', 'Kardex_Asistencia.pdf'],
      historial: [
        { fecha: '24/08/2026 10:00', autor: 'Sofía Ramírez (RH)', mensaje: 'Envío de expediente laboral para cálculo de finiquito y finiquito legal.' }
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
      id: '4',
      folio: 'JUR-2026-075',
      agencia: 'Cupra La Villa',
      autoridad: 'Ninguna / Corporativo',
      asuntoTipo: 'Visto Bueno',
      tipo: 'SOLICITUD',
      titulo: 'Dictamen de Poderes Notariales para Representante Legal',
      solicitante: 'Fernando Alonso',
      cargoSolicitante: 'Gerente Administrativo',
      correoSolicitante: 'falonso@cupralavilla.com',
      descripcion: 'Validación de facultades para actos de administración y pleitos y cobranzas ante autoridades tributarias.',
      fechaCreacion: '22/08/2026',
      fechaCompromiso: '28/08/2026',
      diasAbierto: 7,
      estado: 'Concluido',
      abogadoAsignado: 'Lic. Carlos Mendoza',
      prioridad: 'Media',
      documentos: ['Escritura_Poder_Notarial_584.pdf'],
      historial: [
        { fecha: '22/08/2026 11:00', autor: 'Fernando Alonso (Gerente Admin)', mensaje: 'Registro de solicitud de validación de testimonio notarial.' },
        { fecha: '25/08/2026 17:00', autor: 'Lic. Carlos Mendoza (Abogado)', mensaje: 'Poder emitido y certificado. Dictamen concluido con éxito.' }
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

  // Eventos del Calendario vinculados a los días de Septiembre 2026
  const [eventosCalendario] = useState<EventoCalendario[]>([
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
      id: 'ev-2',
      folio: 'JUR-2026-084',
      agencia: 'Divol Perinorte',
      tipoEvento: 'Audiencia',
      titulo: 'Audiencia Conciliatoria Juicio Laboral 145/2026',
      fecha: '02/09/2026',
      diaNumero: 2,
      hora: '10:00 AM',
      lugar: 'Tribunal Laboral N° 4 - Cuautitlán',
      abogado: 'Lic. Roberto Garza',
      detalles: 'Comparecencia de representación legal para firma de desahogo de convenio.'
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
      id: 'ev-4',
      folio: 'JUR-2026-092',
      agencia: 'Omoda Esmeralda',
      tipoEvento: 'Incidencia',
      titulo: 'Vencimiento Impugnación Multa Administraiva',
      fecha: '04/09/2026',
      diaNumero: 4,
      hora: '18:00 PM',
      lugar: 'Tribunal de Justicia Administrativa',
      abogado: 'Lic. Roberto Garza',
      detalles: 'Último día para interposición de recurso de revocación ante autoridad tributaria.'
    },
    {
      id: 'ev-5',
      folio: 'JUR-2026-075',
      agencia: 'Cupra La Villa',
      tipoEvento: 'Cita Notarial',
      titulo: 'Firma y Protocolización Escritura Poderes 584',
      fecha: '09/09/2026',
      diaNumero: 9,
      hora: '09:00 AM',
      lugar: 'Notaría Pública N° 142 CDMX',
      abogado: 'Lic. Carlos Mendoza',
      detalles: 'Recogida de testimonio firmado ante Notario Público.'
    },
    {
      id: 'ev-6',
      folio: 'JUR-2026-095',
      agencia: 'Divol Tlalnepantla',
      tipoEvento: 'Audiencia',
      titulo: 'Comparecencia Inspección STPS Normativa',
      fecha: '12/09/2026',
      diaNumero: 12,
      hora: '11:30 AM',
      lugar: 'Delegación Federal del Trabajo',
      abogado: 'Lic. Roberto Garza',
      detalles: 'Presentación de actas de comisiones mixtas de seguridad e higiene.'
    },
    {
      id: 'ev-7',
      folio: 'JUR-2026-098',
      agencia: 'Divol Lindavista',
      tipoEvento: 'Reunión',
      titulo: 'Junta de Revisión de Contrato Colectivo',
      fecha: '18/09/2026',
      diaNumero: 18,
      hora: '12:00 PM',
      lugar: 'Oficinas Divol Lindavista',
      abogado: 'Lic. Carlos Mendoza',
      detalles: 'Revisión periódica de estipulaciones con representantes sindicales.'
    }
  ]);

  // Datos de prueba: Tickets Abiertos Sin Atender
  const [unattendedTickets, setUnattendedTickets] = useState([
    {
      folio: 'SOL-JUR-095',
      agencia: 'Omoda Esmeralda',
      tipo: 'CONTRATO',
      titulo: 'Revisión Urgente de Contrato de Fianza y Licencia de Software',
      solicitante: 'Ing. Fernando Torres (Gerente Admin)',
      correo: 'ftorres@omodaesmeralda.com',
      horasSinAtender: 4,
      fecha: 'Hoy 08:30 AM'
    },
    {
      folio: 'SOL-JUR-094',
      agencia: 'Divol Truks',
      tipo: 'SOLICITUD',
      titulo: 'Dictamen de Modificación de Poderes Notariales',
      solicitante: 'Lic. Arturo Gómez (Gerente General)',
      correo: 'agomez@divoltruks.com',
      horasSinAtender: 2,
      fecha: 'Hoy 10:15 AM'
    },
    {
      folio: 'SOL-JUR-093',
      agencia: 'Divol Norte',
      tipo: 'RH',
      titulo: 'Convenio de Finiquito por Muestras de Insubordinación',
      solicitante: 'Lic. Sofía Ramírez (RH)',
      correo: 'sramirez@divol.com',
      horasSinAtender: 18,
      fecha: 'Ayer 17:40 PM'
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

  const handleAssignLawyer = () => {
    if (!assigningTicketFolio) return;
    setUnattendedTickets(unattendedTickets.filter(t => t.folio !== assigningTicketFolio));
    setAssigningTicketFolio(null);
  };

  const handleAddLawyerDictamen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoDictamen.trim() || !selectedTicket) return;

    const entradaHistorial = {
      fecha: `${new Date().toLocaleDateString('es-MX')} ${new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`,
      autor: `${abogadoFiltro.includes('TODOS') ? 'Lic. Mariana Fernández' : abogadoFiltro} (Abogado Dictaminador)`,
      mensaje: nuevoDictamen
    };

    const updatedTickets = tickets.map(t => {
      if (t.id === selectedTicket.id) {
        return {
          ...t,
          estado: nuevoEstadoTicket,
          historial: [...t.historial, entradaHistorial]
        };
      }
      return t;
    });

    setTickets(updatedTickets);
    setSelectedTicket({
      ...selectedTicket,
      estado: nuevoEstadoTicket,
      historial: [...selectedTicket.historial, entradaHistorial]
    });
    setNuevoDictamen('');
  };

  // Filtrado de expedientes por abogado y estatus (actuales vs concluidos)
  const ticketsDelAbogado = tickets.filter(t => {
    const esDelAbogado = abogadoFiltro.includes('TODOS') || t.abogadoAsignado === abogadoFiltro;
    if (!esDelAbogado) return false;

    if (filtroEstatusAbogado === 'ACTUALES') {
      return t.estado !== 'Concluido';
    }
    if (filtroEstatusAbogado === 'CONCLUIDOS') {
      return t.estado === 'Concluido';
    }
    return true;
  });

  const filteredTicketsGeneral = tickets.filter(t => {
    const matchTipo = filtroTipo === 'TODOS' || t.tipo === filtroTipo;
    const matchAgencia = filtroAgencia === 'TODOS' || t.agencia === filtroAgencia;
    return matchTipo && matchAgencia;
  });

  // Eventos del calendario filtrados por abogado
  const eventosDelAbogado = eventosCalendario.filter(e => {
    const esDelAbogado = abogadoFiltro.includes('TODOS') || e.abogado === abogadoFiltro;
    const matchTipo = filtroTipoEvento === 'TODOS' || e.tipoEvento === filtroTipoEvento;
    return esDelAbogado && matchTipo;
  });

  // Estructura de Días para el Calendario Mensual de Septiembre 2026
  const diasMesSeptiembre: (number | null)[] = [
    null, null,
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30
  ];

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
            <div style={{ background: '#ffffff', padding: '4px 8px', borderRadius: '6px', border: '1px solid #c29b47', display: 'flex', alignItems: 'center' }}>
              <img src={logoGrupoHuerta} alt="Grupo Huerta" style={{ height: '26px', width: 'auto' }} />
            </div>
            <div>
              <div className="formal-header-font" style={{ fontSize: '1.05rem', color: '#ffffff' }}>PORTAL JURÍDICO</div>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Grupo Huerta</div>
            </div>
          </div>

          {/* OPCIONES DE MENU */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              onClick={() => { setCurrentSection('principal'); setSelectedTicket(null); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '10px 14px',
                borderRadius: '6px',
                border: 'none',
                background: currentSection === 'principal' && !selectedTicket ? '#19212d' : 'transparent',
                color: currentSection === 'principal' && !selectedTicket ? '#c29b47' : '#94a3b8',
                fontWeight: currentSection === 'principal' && !selectedTicket ? 600 : 400,
                fontSize: '0.825rem',
                fontFamily: 'Montserrat, sans-serif',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              <span>Vista Principal</span>
            </button>

            {/* SECCIÓN NUEVA: MIS EXPEDIENTES ASIGNADOS (PERFIL DE ABOGADO) */}
            <button
              onClick={() => { setCurrentSection('mis_expedientes'); setSelectedTicket(null); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '10px 14px',
                borderRadius: '6px',
                border: 'none',
                background: currentSection === 'mis_expedientes' && !selectedTicket ? '#19212d' : 'transparent',
                color: currentSection === 'mis_expedientes' && !selectedTicket ? '#c29b47' : '#94a3b8',
                fontWeight: currentSection === 'mis_expedientes' && !selectedTicket ? 600 : 400,
                fontSize: '0.825rem',
                fontFamily: 'Montserrat, sans-serif',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>
              <span>Mis Tickets Asignados</span>
            </button>

            {/* BOTON CALENDARIO EN LA BARRA LATERAL */}
            <button
              onClick={() => { setCurrentSection('calendario'); setSelectedTicket(null); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '10px 14px',
                borderRadius: '6px',
                border: 'none',
                background: currentSection === 'calendario' ? '#19212d' : 'transparent',
                color: currentSection === 'calendario' ? '#c29b47' : '#94a3b8',
                fontWeight: currentSection === 'calendario' ? 600 : 400,
                fontSize: '0.825rem',
                fontFamily: 'Montserrat, sans-serif',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span>Calendario</span>
            </button>

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
              <span>Todos los Expedientes</span>
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

        {/* PIE DE SIDEBAR CON CONMUTADOR DE ABOGADO */}
        <div style={{ borderTop: '1px solid #263347', paddingTop: '1rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif', marginBottom: '4px' }}>
            Vista de Abogado Activo:
          </div>
          <select 
            value={abogadoFiltro}
            onChange={e => setAbogadoFiltro(e.target.value)}
            style={{
              width: '100%',
              background: '#0b0e14',
              border: '1px solid #c29b47',
              color: '#c29b47',
              padding: '6px',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 700,
              fontFamily: 'Montserrat, sans-serif',
              marginBottom: '0.75rem'
            }}
          >
            {ABOGADOS_LISTA.map(abg => (
              <option key={abg} value={abg}>{abg}</option>
            ))}
          </select>

          <button 
            onClick={onLogout}
            style={{ background: 'transparent', border: '1px solid #334155', color: '#f87171', padding: '6px 12px', borderRadius: '4px', fontSize: '0.725rem', width: '100%', cursor: 'pointer' }}
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto' }}>
        
        {/* BARRA SUPERIOR INDICADORA DE PERFIL DE ABOGADO */}
        <div style={{
          background: '#141a24',
          border: '1px solid #263347',
          borderRadius: '8px',
          padding: '1rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(194, 155, 71, 0.15)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(194, 155, 71, 0.3)', color: '#c29b47', fontSize: '0.8rem', fontWeight: 700, fontFamily: 'Montserrat, sans-serif' }}>
              👤 ABOGADO ASIGNADO
            </div>
            <div>
              <span style={{ fontSize: '0.95rem', color: '#ffffff', fontWeight: 700 }}>
                {abogadoFiltro}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '10px' }}>
                ({ticketsDelAbogado.filter(t => t.estado !== 'Concluido').length} expedientes activos asignados)
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => { setCurrentSection('mis_expedientes'); setSelectedTicket(null); }}
              style={{
                background: currentSection === 'mis_expedientes' ? '#c29b47' : '#19212d',
                color: currentSection === 'mis_expedientes' ? '#0b0e14' : '#cbd5e1',
                border: '1px solid #334155',
                padding: '6px 14px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'Montserrat, sans-serif'
              }}
            >
              Mis Expedientes ({ticketsDelAbogado.length})
            </button>

            <button
              onClick={() => { setCurrentSection('calendario'); setSelectedTicket(null); }}
              style={{
                background: currentSection === 'calendario' ? '#c29b47' : '#19212d',
                color: currentSection === 'calendario' ? '#0b0e14' : '#cbd5e1',
                border: '1px solid #334155',
                padding: '6px 14px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'Montserrat, sans-serif'
              }}
            >
              Mi Calendario ({eventosDelAbogado.length})
            </button>
          </div>
        </div>

        {/* VISTA 1: RESUMEN GENERAL (VISTA PRINCIPAL) */}
        {currentSection === 'principal' && !selectedTicket ? (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h2 className="formal-header-font" style={{ fontSize: '1.6rem', color: '#ffffff' }}>
                Resumen Ejecutivo — Panel Principal
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Monitoreo prioritario de urgencias por vencer, calendario de audiencias y tickets abiertos sin atender
              </p>
            </div>

            {/* SECCIÓN 1: URGENTES POR VENCER */}
            <section style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', padding: '6px', borderRadius: '6px', color: '#f87171' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <div>
                  <h3 className="formal-header-font" style={{ fontSize: '1.25rem', color: '#ffffff', margin: 0 }}>
                    Urgentes por Vencer
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }}>
                    TÉRMINOS LEGALES CON VENCIMIENTO PRÓXIMO EN MENOS DE 48 HORAS
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {/* URGENTE 1 */}
                <div style={{ background: '#141a24', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px', padding: '1.5rem', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#c29b47', fontWeight: 700, fontFamily: 'Montserrat, sans-serif' }}>JUR-2026-089</span>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', fontFamily: 'Montserrat, sans-serif' }}>
                      VENCE MAÑANA 01/09
                    </span>
                  </div>
                  <h4 style={{ fontSize: '1rem', color: '#ffffff', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Contestación de Demanda Mercantil Juicio 402/2026
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '1rem' }}>
                    Empresa: <strong>Divol Norte</strong> • Abogado: <strong>Lic. Mariana Fernández</strong>
                  </div>
                  <button 
                    onClick={() => { setSelectedTicket(tickets[0]); setCurrentSection('expedientes'); }}
                    style={{ width: '100%', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#f87171', padding: '8px', borderRadius: '4px', fontSize: '0.775rem', fontWeight: 700, fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase', cursor: 'pointer' }}
                  >
                    Atender Vencimiento Urgente
                  </button>
                </div>

                {/* URGENTE 2 */}
                <div style={{ background: '#141a24', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '8px', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#c29b47', fontWeight: 700, fontFamily: 'Montserrat, sans-serif' }}>JUR-2026-092</span>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)', fontFamily: 'Montserrat, sans-serif' }}>
                      FALTAN 42 HORAS
                    </span>
                  </div>
                  <h4 style={{ fontSize: '1rem', color: '#ffffff', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Término para Impugnación de Multa Administrativa
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '1rem' }}>
                    Empresa: <strong>Suzuki Montevideo</strong> • Abogado: <strong>Lic. Roberto Garza</strong>
                  </div>
                  <button 
                    onClick={() => alert('Abriendo expediente JUR-2026-092...')}
                    style={{ width: '100%', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.35)', color: '#fbbf24', padding: '8px', borderRadius: '4px', fontSize: '0.775rem', fontWeight: 700, fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase', cursor: 'pointer' }}
                  >
                    Revisar Impugnación
                  </button>
                </div>

                {/* URGENTE 3 */}
                <div style={{ background: '#141a24', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '8px', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#c29b47', fontWeight: 700, fontFamily: 'Montserrat, sans-serif' }}>JUR-2026-084</span>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)', fontFamily: 'Montserrat, sans-serif' }}>
                      FALTAN 3 DÍAS
                    </span>
                  </div>
                  <h4 style={{ fontSize: '1rem', color: '#ffffff', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Firma de Convenio de Rescisión Laboral
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '1rem' }}>
                    Empresa: <strong>Divol Lindavista</strong> • Abogado: <strong>Lic. Roberto Garza</strong>
                  </div>
                  <button 
                    onClick={() => { setSelectedTicket(tickets[1]); setCurrentSection('expedientes'); }}
                    style={{ width: '100%', background: '#19212d', border: '1px solid #334155', color: '#cbd5e1', padding: '8px', borderRadius: '4px', fontSize: '0.775rem', fontWeight: 700, fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase', cursor: 'pointer' }}
                  >
                    Ver Convenio
                  </button>
                </div>
              </div>
            </section>

            {/* SECCIÓN 2: CALENDARIO DE AUDIENCIAS */}
            <section style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.35)', padding: '6px', borderRadius: '6px', color: '#60a5fa' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div>
                  <h3 className="formal-header-font" style={{ fontSize: '1.25rem', color: '#ffffff', margin: 0 }}>
                    Calendario de Audiencias y Citas Notariales
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'Montserrat, sans-serif' }}>
                    PROGRAMACIÓN DE COMPARECENCIAS JUDICIALES Y CUMPLIMIENTO NORMANDO
                  </span>
                </div>
              </div>

              <div style={{ background: '#141a24', border: '1px solid #263347', borderRadius: '8px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    { fecha: '02/09/2026', hora: '10:00 AM', titulo: 'Audiencia Conciliatoria de Juicio Laboral', tribunal: 'Tribunal Laboral N° 4 - Cuautitlán', agencia: 'Divol Perinorte', abogado: 'Lic. Roberto Garza', asunto: 'Exp. Laboral 145/2026' },
                    { fecha: '05/09/2026', hora: '12:30 PM', titulo: 'Audiencia de Desahogo de Pruebas Mercantil', tribunal: 'Juzgado 3° de lo Civil CDMX', agencia: 'Suzuki Montevideo', abogado: 'Lic. Mariana Fernández', asunto: 'Exp. Mercantil 589/2025' },
                    { fecha: '09/09/2026', hora: '09:00 AM', titulo: 'Cita de Ratificación y Certificación de Poderes', tribunal: 'Notaría Pública N° 142 CDMX', agencia: 'Corporativo Grupo Huerta', abogado: 'Lic. Carlos Mendoza', asunto: 'Poderes Generales' },
                    { fecha: '12/09/2026', hora: '11:30 AM', titulo: 'Comparecencia de Inspección Ordinaria STPS', tribunal: 'Delegación Federal del Trabajo', agencia: 'Divol Tlalnepantla', abogado: 'Lic. Roberto Garza', asunto: 'Auditoría Normativa STPS' }
                  ].map((aud, idx) => (
                    <div key={idx} style={{ background: '#0b0e14', border: '1px solid #263347', borderRadius: '6px', padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ background: '#19212d', border: '1px solid #334155', padding: '8px 14px', borderRadius: '6px', textAlign: 'center', minWidth: '100px' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#c29b47', fontFamily: 'Montserrat, sans-serif' }}>{aud.fecha}</div>
                          <div style={{ fontSize: '0.725rem', color: '#cbd5e1' }}>{aud.hora}</div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.725rem', color: '#64748b', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>
                            {aud.agencia} • {aud.asunto}
                          </div>
                          <h4 style={{ fontSize: '1rem', color: '#ffffff', fontWeight: 600, margin: '2px 0' }}>
                            {aud.titulo}
                          </h4>
                          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                            Instancia: <span style={{ color: '#cbd5e1' }}>{aud.tribunal}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.75rem', color: '#c29b47', fontWeight: 600, display: 'block', marginBottom: '4px', fontFamily: 'Montserrat, sans-serif' }}>
                          {aud.abogado}
                        </span>
                        <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                          Audiencia Programada
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* SECCIÓN 3: TICKETS ABIERTOS, SIN ATENDER */}
            <section style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.35)', padding: '6px', borderRadius: '6px', color: '#fbbf24' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </div>
                <div>
                  <h3 className="formal-header-font" style={{ fontSize: '1.25rem', color: '#ffffff', margin: 0 }}>
                    Tickets Abiertos, Sin Atender
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }}>
                    SOLICITUDES NUEVAS PENDIENTES DE ASIGNACIÓN Y PRIMERA REVISIÓN
                  </span>
                </div>
              </div>

              <div style={{ background: '#141a24', border: '1px solid #263347', borderRadius: '8px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {unattendedTickets.map((item, idx) => (
                    <div key={idx} style={{ background: '#0b0e14', border: '1px solid #263347', borderRadius: '6px', padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c29b47', fontFamily: 'Montserrat, sans-serif' }}>{item.folio}</span>
                          <span style={{ fontSize: '0.725rem', padding: '2px 6px', background: '#19212d', border: '1px solid #334155', borderRadius: '4px', color: '#ffffff' }}>{item.tipo}</span>
                          <span style={{ fontSize: '0.725rem', color: '#fbbf24', fontWeight: 600 }}>⏱ {item.horasSinAtender} horas sin atender</span>
                        </div>

                        <h4 style={{ fontSize: '1rem', color: '#ffffff', fontWeight: 600, marginBottom: '0.3rem' }}>
                          {item.titulo}
                        </h4>

                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                          Solicita: <strong style={{ color: '#cbd5e1' }}>{item.solicitante}</strong> • Empresa: <strong style={{ color: '#ffffff' }}>{item.agencia}</strong>
                        </div>
                      </div>

                      <div>
                        <button
                          onClick={() => setAssigningTicketFolio(item.folio)}
                          style={{
                            background: '#c29b47',
                            border: 'none',
                            color: '#0b0e14',
                            padding: '9px 18px',
                            borderRadius: '6px',
                            fontSize: '0.775rem',
                            fontWeight: 700,
                            fontFamily: 'Montserrat, sans-serif',
                            textTransform: 'uppercase',
                            cursor: 'pointer'
                          }}
                        >
                          Asignar Abogado
                        </button>
                      </div>
                    </div>
                  ))}
                  {unattendedTickets.length === 0 && (
                    <div style={{ textTransform: 'uppercase', fontSize: '0.85rem', color: '#4ade80', textAlign: 'center', padding: '1rem' }}>
                      ✓ Todos los tickets abiertos han sido asignados correctamente.
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

        /* VISTA 2: MIS EXPEDIENTES / TICKETS ASIGNADOS (NUEVA VISTA DEDICADA PARA EL ABOGADO) */
        ) : currentSection === 'mis_expedientes' && !selectedTicket ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 className="formal-header-font" style={{ fontSize: '1.6rem', color: '#ffffff' }}>
                  Mis Expedientes y Tickets Asignados
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Historial de asuntos legales actuales y concluidos bajo la responsabilidad de <strong>{abogadoFiltro}</strong>
                </p>
              </div>

              {/* FILTROS DE HISTORIAL (ACTUALES VS CONCLUIDOS VS TODOS) */}
              <div style={{ display: 'flex', gap: '8px', background: '#141a24', border: '1px solid #263347', padding: '4px', borderRadius: '6px' }}>
                {(['ACTUALES', 'CONCLUIDOS', 'TODOS'] as const).map(est => (
                  <button
                    key={est}
                    onClick={() => setFiltroEstatusAbogado(est)}
                    style={{
                      background: filtroEstatusAbogado === est ? '#19212d' : 'transparent',
                      border: filtroEstatusAbogado === est ? '1px solid #334155' : 'none',
                      color: filtroEstatusAbogado === est ? '#c29b47' : '#94a3b8',
                      padding: '6px 14px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontFamily: 'Montserrat, sans-serif',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {est === 'ACTUALES' ? 'En Proceso / Activos' : est === 'CONCLUIDOS' ? 'Historial Concluidos' : 'Ver Todos'}
                  </button>
                ))}
              </div>
            </div>

            {/* TABLA DE EXPEDIENTES ASIGNADOS */}
            <div style={{ background: '#141a24', border: '1px solid #263347', borderRadius: '8px', padding: '1.5rem' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #263347', color: '#94a3b8', fontSize: '0.725rem', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>
                      <th style={{ padding: '12px' }}>Folio</th>
                      <th style={{ padding: '12px' }}>Autoridad</th>
                      <th style={{ padding: '12px' }}>Asunto Legal</th>
                      <th style={{ padding: '12px' }}>Agencia / Empresa</th>
                      <th style={{ padding: '12px' }}>Fecha Compromiso</th>
                      <th style={{ padding: '12px' }}>Prioridad</th>
                      <th style={{ padding: '12px' }}>Estatus</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Dictaminar / Responder</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ticketsDelAbogado.map(item => {
                      return (
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
                              Dictaminar Expediente
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {ticketsDelAbogado.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                          No se encontraron expedientes asignados para el filtro seleccionado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        /* VISTA 3: CALENDARIO LEGAL DE AUDIENCIAS (GRID MENSUAL LITERAL O LISTADO) */
        ) : currentSection === 'calendario' && !selectedTicket ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 className="formal-header-font" style={{ fontSize: '1.6rem', color: '#ffffff' }}>
                  Calendario Legal de Audiencias y Eventos Asignados
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Agenda de comparecencias ante juzgados, citas notariales e incidencias asignadas a <strong>{abogadoFiltro}</strong>
                </p>
              </div>

              {/* OPCIONES DE NAVEGACIÓN ENTRE VISTA CALENDARIO MENSUAL Y LISTA */}
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
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                    <span>Vista Calendario Mensual</span>
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
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                    <span>Vista Cronológica</span>
                  </button>
                </div>

                {/* FILTROS POR TIPO DE EVENTO */}
                <select
                  className="custom-input"
                  value={filtroTipoEvento}
                  onChange={e => setFiltroTipoEvento(e.target.value)}
                  style={{ paddingLeft: '12px', fontSize: '0.8rem' }}
                >
                  <option value="TODOS">Todos los Eventos Legales</option>
                  <option value="Audiencia">Audiencias Judiciales</option>
                  <option value="Incidencia">Incidencias & Términos</option>
                  <option value="Cita Notarial">Citas Notariales</option>
                  <option value="Reunión">Reuniones Corporativas</option>
                </select>
              </div>
            </div>

            {/* MODO 1: VISTA CALENDARIO MENSUAL LITERAL (GRID DE MES COMPLETO FILTRADO POR ABOGADO) */}
            {modoCalendario === 'grid' ? (
              <div style={{ background: '#141a24', border: '1px solid #263347', borderRadius: '8px', padding: '1.75rem' }}>
                
                {/* CABECERA DEL MES */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #263347', paddingBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h3 className="formal-header-font" style={{ fontSize: '1.5rem', color: '#ffffff' }}>
                      SEPTIEMBRE 2026
                    </h3>
                    <span style={{ fontSize: '0.75rem', padding: '3px 10px', background: 'rgba(194, 155, 71, 0.1)', color: '#c29b47', border: '1px solid rgba(194, 155, 71, 0.3)', borderRadius: '4px', fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }}>
                      Agenda de {abogadoFiltro}
                    </span>
                  </div>

                  {/* LEYENDA DE COLORES */}
                  <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.75rem', fontFamily: 'Montserrat, sans-serif' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f87171' }}></span> Incidencias
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#60a5fa' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#60a5fa' }}></span> Audiencias
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fbbf24' }}></span> Citas Notariales
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c084fc' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#c084fc' }}></span> Reuniones
                    </span>
                  </div>
                </div>

                {/* GRID DEL CALENDARIO LITERAL (7 COLUMNAS: DOM A SÁB) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                  
                  {/* DIAS DE LA SEMANA */}
                  {['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'].map((dia, idx) => (
                    <div key={idx} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', padding: '8px 0', borderBottom: '1px solid #263347', fontFamily: 'Montserrat, sans-serif' }}>
                      {dia}
                    </div>
                  ))}

                  {/* CASILLAS DE CADA DÍA DEL MES */}
                  {diasMesSeptiembre.map((numDia, index) => {
                    if (numDia === null) {
                      return <div key={index} style={{ background: '#0b0e14', opacity: 0.3, minHeight: '110px', borderRadius: '6px' }}></div>;
                    }

                    // Buscar eventos de este día para el abogado seleccionado
                    const eventosDelDia = eventosDelAbogado.filter(e => e.diaNumero === numDia);
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
                          justifyContent: 'space-between',
                          position: 'relative'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: esHoy ? '#c29b47' : '#ffffff', fontFamily: 'Montserrat, sans-serif' }}>
                            {numDia}
                          </span>
                          {esHoy && (
                            <span style={{ fontSize: '0.625rem', background: '#c29b47', color: '#0b0e14', padding: '1px 5px', borderRadius: '3px', fontWeight: 800 }}>HOY</span>
                          )}
                        </div>

                        {/* LISTA DE CHIPS DE EVENTOS DEL DÍA */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', maxHeight: '80px' }}>
                          {eventosDelDia.map(ev => {
                            const colorBadge = 
                              ev.tipoEvento === 'Incidencia' ? '#f87171' :
                              ev.tipoEvento === 'Audiencia' ? '#60a5fa' :
                              ev.tipoEvento === 'Cita Notarial' ? '#fbbf24' : '#c084fc';
                            
                            const bgBadge = 
                              ev.tipoEvento === 'Incidencia' ? 'rgba(239, 68, 68, 0.2)' :
                              ev.tipoEvento === 'Audiencia' ? 'rgba(59, 130, 246, 0.2)' :
                              ev.tipoEvento === 'Cita Notarial' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(168, 85, 247, 0.2)';

                            return (
                              <div
                                key={ev.id}
                                onClick={() => setSelectedEventoModal(ev)}
                                title={`${ev.tipoEvento}: ${ev.titulo} (${ev.hora})`}
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

              /* MODO 2: VISTA CRONOLÓGICA LISTADO DESGLOSADO */
              <div style={{ background: '#141a24', border: '1px solid #263347', borderRadius: '8px', padding: '1.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {eventosDelAbogado.map(ev => {
                    const colorBadge = 
                      ev.tipoEvento === 'Incidencia' ? '#f87171' :
                      ev.tipoEvento === 'Audiencia' ? '#60a5fa' :
                      ev.tipoEvento === 'Cita Notarial' ? '#fbbf24' : '#c084fc';
                    
                    const bgBadge = 
                      ev.tipoEvento === 'Incidencia' ? 'rgba(239, 68, 68, 0.12)' :
                      ev.tipoEvento === 'Audiencia' ? 'rgba(59, 130, 246, 0.12)' :
                      ev.tipoEvento === 'Cita Notarial' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(168, 85, 247, 0.12)';

                    return (
                      <div key={ev.id} style={{ background: '#0b0e14', border: '1px solid #263347', borderRadius: '8px', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                          <div style={{ background: '#19212d', border: `1px solid ${colorBadge}`, padding: '12px 18px', borderRadius: '8px', textAlign: 'center', minWidth: '110px' }}>
                            <div style={{ fontSize: '1rem', fontWeight: 700, color: colorBadge, fontFamily: 'Montserrat, sans-serif' }}>{ev.fecha}</div>
                            <div style={{ fontSize: '0.775rem', color: '#ffffff', fontWeight: 600, marginTop: '2px' }}>{ev.hora}</div>
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                              <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, background: bgBadge, color: colorBadge, border: `1px solid ${colorBadge}`, fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase' }}>
                                {ev.tipoEvento}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: '#c29b47', fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }}>
                                FOLIO: {ev.folio}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                • {ev.agencia}
                              </span>
                            </div>

                            <h3 style={{ fontSize: '1.1rem', color: '#ffffff', fontWeight: 600, marginBottom: '4px' }}>
                              {ev.titulo}
                            </h3>

                            <div style={{ fontSize: '0.825rem', color: '#cbd5e1', marginBottom: '4px' }}>
                              📍 Sede / Lugar: <strong>{ev.lugar}</strong>
                            </div>

                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                              {ev.detalles}
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif', marginBottom: '2px' }}>Abogado Responsable</div>
                          <div style={{ fontSize: '0.875rem', color: '#ffffff', fontWeight: 600, marginBottom: '10px' }}>{ev.abogado}</div>
                          
                          <button
                            onClick={() => {
                              const foundTicket = tickets.find(t => t.folio === ev.folio);
                              if (foundTicket) {
                                setSelectedTicket(foundTicket);
                                setCurrentSection('expedientes');
                              } else {
                                alert(`Abriendo expediente de folio ${ev.folio}...`);
                              }
                            }}
                            style={{
                              background: 'rgba(194, 155, 71, 0.08)',
                              border: '1px solid rgba(194, 155, 71, 0.3)',
                              color: '#c29b47',
                              padding: '7px 14px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontFamily: 'Montserrat, sans-serif',
                              cursor: 'pointer',
                              fontWeight: 600
                            }}
                          >
                            Ver Expediente del Ticket
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        ) : selectedTicket ? (

        /* VISTA 4: DETALLE Y DICTAMINACIÓN DEL EXPEDIENTE (CON SECCIÓN DE RESPUESTA DE ABOGADO) */
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
                  AUTORIDAD: {selectedTicket.autoridad || selectedTicket.tipo} — {selectedTicket.agencia}
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
                  <div style={{ fontSize: '0.7rem', color: '#fbbf24', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'Montserrat, sans-serif' }}>Fecha Compromiso</div>
                  <div style={{ fontSize: '0.85rem', color: '#fbbf24', fontWeight: 700 }}>{selectedTicket.fechaCompromiso || selectedTicket.fechaCreacion}</div>
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
              <div style={{ marginBottom: '2rem' }}>
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

              {/* MÓDULO DE DICTAMINACIÓN Y EMISIÓN DE RESPUESTAS DEL ABOGADO */}
              <div style={{ background: '#0b0e14', border: '1px solid rgba(194, 155, 71, 0.4)', borderRadius: '6px', padding: '1.5rem' }}>
                <h4 className="formal-header-font" style={{ fontSize: '1.2rem', color: '#ffffff', marginBottom: '0.5rem' }}>
                  Dictaminar Expediente y Actualizar Estatus (Abogado Resolutor)
                </h4>
                
                <form onSubmit={handleAddLawyerDictamen}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label className="input-label">Actualizar Estatus del Ticket</label>
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
                      <label className="input-label">Abogado Emisor</label>
                      <input 
                        type="text" 
                        readOnly 
                        className="custom-input" 
                        style={{ background: '#19212d', color: '#c29b47', fontWeight: 600, paddingLeft: '12px' }}
                        value={abogadoFiltro.includes('TODOS') ? 'Lic. Mariana Fernández' : abogadoFiltro} 
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Dictamen Legal / Respuesta Formal para la Sucursal</label>
                    <textarea 
                      rows={4}
                      required
                      className="custom-input"
                      style={{ paddingLeft: '12px', resize: 'vertical', lineHeight: 1.5 }}
                      placeholder="Escriba aquí la respuesta jurídica, borrador de escrito, instrucciones de cumplimiento o dictamen formal..."
                      value={nuevoDictamen}
                      onChange={e => setNuevoDictamen(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="submit"
                      style={{
                        background: '#c29b47',
                        border: 'none',
                        color: '#0b0e14',
                        padding: '10px 24px',
                        borderRadius: '4px',
                        fontWeight: 700,
                        fontFamily: 'Montserrat, sans-serif',
                        fontSize: '0.775rem',
                        textTransform: 'uppercase',
                        cursor: 'pointer'
                      }}
                    >
                      Emitir Dictamen Formal
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>
        ) : currentSection === 'expedientes' ? (
          <div>
            {/* SECCIÓN TODOS LOS EXPEDIENTES */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 className="formal-header-font" style={{ fontSize: '1.5rem', color: '#ffffff' }}>
                  Todos los Expedientes Legales y Solicitudes
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

            {/* TABLA DE EXPEDIENTES GENERALES */}
            <div style={{ background: '#141a24', border: '1px solid #263347', borderRadius: '8px', padding: '1.5rem' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #263347', color: '#94a3b8', fontSize: '0.725rem', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>
                      <th style={{ padding: '12px' }}>Folio</th>
                      <th style={{ padding: '12px' }}>Tipo / Autoridad</th>
                      <th style={{ padding: '12px' }}>Agencia / Empresa</th>
                      <th style={{ padding: '12px' }}>Asunto Legal</th>
                      <th style={{ padding: '12px' }}>Abogado Asignado</th>
                      <th style={{ padding: '12px' }}>Antigüedad</th>
                      <th style={{ padding: '12px' }}>Estatus</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Pestaña de Expediente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTicketsGeneral.map(item => {
                      const esAlerta = item.diasAbierto >= 5;
                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '14px 12px', fontWeight: 600, color: '#c29b47', fontFamily: 'Montserrat, sans-serif' }}>{item.folio}</td>
                          <td style={{ padding: '14px 12px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, background: '#19212d', border: '1px solid #334155', color: '#ffffff' }}>
                              {item.autoridad || item.tipo}
                            </span>
                          </td>
                          <td style={{ padding: '14px 12px', color: '#ffffff', fontWeight: 500 }}>{item.agencia}</td>
                          <td style={{ padding: '14px 12px', color: '#cbd5e1', maxWidth: '240px' }}>{item.titulo}</td>
                          <td style={{ padding: '14px 12px' }}>
                            <div style={{ color: '#ffffff', fontWeight: 500 }}>{item.abogadoAsignado}</div>
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

      {/* MODAL DETALLE DE EVENTO AL HACER CLIC EN EL CALENDARIO MENSUAL */}
      {selectedEventoModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: '#141a24', border: '1px solid #263347', borderRadius: '8px', width: '100%', maxWidth: '520px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #263347', paddingBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.725rem', color: '#c29b47', fontWeight: 700, fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase' }}>
                  {selectedEventoModal.tipoEvento} • FOLIO: {selectedEventoModal.folio}
                </span>
                <h3 className="formal-header-font" style={{ fontSize: '1.3rem', color: '#ffffff', marginTop: '2px' }}>
                  {selectedEventoModal.titulo}
                </h3>
              </div>
              <button onClick={() => setSelectedEventoModal(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#0b0e14', padding: '1rem', borderRadius: '6px', border: '1px solid #263347', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Fecha y Hora</span>
                <div style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 600 }}>{selectedEventoModal.fecha} a las {selectedEventoModal.hora}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Sucursal / Agencia</span>
                <div style={{ fontSize: '0.9rem', color: '#c29b47', fontWeight: 600 }}>{selectedEventoModal.agencia}</div>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.725rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Sede / Instancia</span>
              <div style={{ fontSize: '0.85rem', color: '#ffffff', marginTop: '2px' }}>📍 {selectedEventoModal.lugar}</div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.725rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Detalles de la Actuación</span>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', background: '#19212d', padding: '10px 14px', borderRadius: '6px', border: '1px solid #263347', marginTop: '4px', lineHeight: 1.5 }}>
                {selectedEventoModal.detalles}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Abogado: <strong style={{ color: '#ffffff' }}>{selectedEventoModal.abogado}</strong>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => setSelectedEventoModal(null)} style={{ background: 'transparent', border: '1px solid #334155', color: '#cbd5e1', padding: '8px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.775rem' }}>Cerrar</button>
                <button 
                  type="button" 
                  onClick={() => {
                    const foundTicket = tickets.find(t => t.folio === selectedEventoModal.folio);
                    if (foundTicket) {
                      setSelectedTicket(foundTicket);
                      setCurrentSection('expedientes');
                    } else {
                      alert(`Abriendo expediente del folio ${selectedEventoModal.folio}...`);
                    }
                    setSelectedEventoModal(null);
                  }} 
                  style={{ background: '#c29b47', border: 'none', color: '#0b0e14', padding: '8px 18px', borderRadius: '4px', fontWeight: 700, cursor: 'pointer', fontSize: '0.775rem' }}
                >
                  Abrir Expediente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* MODAL ASIGNAR ABOGADO A TICKET SIN ATENDER */}
      {assigningTicketFolio && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: '#141a24', border: '1px solid #263347', borderRadius: '8px', width: '100%', maxWidth: '450px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #263347', paddingBottom: '0.75rem' }}>
              <h3 className="formal-header-font" style={{ fontSize: '1.25rem', color: '#ffffff' }}>Asignar Abogado a Ticket</h3>
              <button onClick={() => setAssigningTicketFolio(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#c29b47', fontWeight: 700, fontFamily: 'Montserrat, sans-serif' }}>FOLIO: {assigningTicketFolio}</span>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '4px' }}>
                Selecciona el abogado de la Dirección Jurídica que tomará la responsabilidad de este expediente:
              </p>
            </div>

            <div className="input-group">
              <label className="input-label">Abogado Responsable</label>
              <select className="custom-input" style={{ paddingLeft: '12px' }} value={selectedAbogadoAssign} onChange={e => setSelectedAbogadoAssign(e.target.value)}>
                <option value="Lic. Mariana Fernández">Lic. Mariana Fernández (Especialista Mercantil)</option>
                <option value="Lic. Roberto Garza">Lic. Roberto Garza (Especialista Laboral / RH)</option>
                <option value="Lic. Carlos Mendoza">Lic. Carlos Mendoza (Especialista Corporativo)</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="button" onClick={() => setAssigningTicketFolio(null)} style={{ background: 'transparent', border: '1px solid #334155', color: '#cbd5e1', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
              <button type="button" onClick={handleAssignLawyer} style={{ background: '#c29b47', border: 'none', color: '#0b0e14', padding: '8px 20px', borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}>Confirmar Asignación</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
