import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/axios.config';
import toast from 'react-hot-toast';
import { IMAGE_BASE_URL } from '../config';

// ============================================
// TIPOS
// ============================================
interface IMensaje {
    id: number;
    ticket_id: number;
    usuario_id: number;
    contenido: string;
    es_interno: boolean;
    fecha_creacion: string;
    usuario_nombre: string;
    usuario_apellido: string;
    usuario_rol: string;
}

interface IArchivo {
    nombre: string;
    ruta: string;
    tamano: number;
    tipo: string;
}

interface ITicket {
    id: number;
    numero_secuencial?: number;
    asunto: string;
    tipo: string;
    estado: string;
    prioridad: string;
    descripcion: string;
    area: string;
    fecha_creacion: string;
    fecha_actualizacion: string;
    fecha_resolucion: string;
    fecha_cierre: string;
    usuario_nombre: string;
    usuario_apellido: string;
    usuario_email: string;
    agente_id: number | null;
    agente_nombre?: string;
    agente_apellido?: string;
    archivos_adjuntos?: IArchivo[] | string;
    mensajes?: IMensaje[];
    ultimo_mensaje_rol?: string;
}

interface IUsuario {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    rol: string;
}

interface AdminTicketsProps {
    agenciaId: number;
    colores?: any;
    isDarkMode?: boolean;
    initialSelectedTicketId?: number | null;
    onClearInitialTicketId?: () => void;
    initialStatusFilter?: string;
    refreshTrigger?: number;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const AdminTickets: React.FC<AdminTicketsProps> = ({ 
    agenciaId, 
    colores, 
    isDarkMode,
    initialSelectedTicketId,
    onClearInitialTicketId,
    initialStatusFilter,
    refreshTrigger
}) => {
    const { user } = useAuth();
    
    const defaultColores = {
        primario: '#2563eb',
        secundario: '#3b82f6',
        fondo: isDarkMode ? '#0f172a' : '#f3f4f6',
        texto: isDarkMode ? '#f8fafc' : '#1f2937',
        tarjeta: isDarkMode ? '#1e293b' : '#ffffff',
        borde: isDarkMode ? '#334155' : '#e5e7eb',
        inputBg: isDarkMode ? '#1e293b' : '#ffffff',
        inputText: isDarkMode ? '#ffffff' : '#1f2937',
        textoMuted: isDarkMode ? '#94a3b8' : '#6b7280',
        hoverBg: isDarkMode ? '#334155' : '#f9fafb'
    };
    const c = colores || defaultColores;

    const [tickets, setTickets] = useState<ITicket[]>([]);
    const [agentes, setAgentes] = useState<IUsuario[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<ITicket | null>(null);
    const selectedTicketIdRef = useRef<number | null>(null);
    useEffect(() => {
        selectedTicketIdRef.current = selectedTicket ? selectedTicket.id : null;
    }, [selectedTicket]);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [replyMessage, setReplyMessage] = useState('');
    const [filtros, setFiltros] = useState({
        estado: 'todos',
        prioridad: 'todas'
    });
    const [updating, setUpdating] = useState(false);
    const [enviandoRespuesta, setEnviandoRespuesta] = useState(false);
    const [archivoSeleccionado, setArchivoSeleccionado] = useState<IArchivo | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // ============================================
    // FUNCIÓN PARA PARSEAR ARCHIVOS ADJUNTOS
    // ============================================
    const parseArchivos = (archivos: any): IArchivo[] => {
        if (!archivos) return [];
        if (Array.isArray(archivos)) return archivos;
        if (typeof archivos === 'string') {
            try {
                const parsed = JSON.parse(archivos);
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return [];
            }
        }
        return [];
    };

    // ============================================
    // FUNCIÓN PARA VERIFICAR SI ES IMAGEN
    // ============================================
    const esImagen = (tipo: string): boolean => {
        return tipo?.startsWith('image/') || 
               tipo?.includes('jpeg') || 
               tipo?.includes('png') || 
               tipo?.includes('jpg') || 
               tipo?.includes('gif') ||
               tipo?.includes('webp');
    };

    // ============================================
    // FUNCIÓN PARA OBTENER ICONO SEGÚN TIPO
    // ============================================
    const getIconoArchivo = (tipo: string): string => {
        if (esImagen(tipo)) return '🖼️';
        if (tipo?.includes('pdf')) return '📄';
        if (tipo?.includes('word') || tipo?.includes('document')) return '📝';
        if (tipo?.includes('excel') || tipo?.includes('sheet')) return '📊';
        return '📎';
    };

    // ============================================
    // CARGAR DATOS
    // ============================================
    const loadTickets = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const response = await api.get(`/tickets/agencia/${agenciaId}`);
            if (response.data.success) {
                setTickets(response.data.data);
            }
        } catch (error) {
            if (!silent) toast.error('Error al cargar tickets');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const loadAgentes = async () => {
        try {
            const response = await api.get(`/auth/users/${agenciaId}`);
            if (response.data.success) {
                const agentesList = response.data.data.filter((u: any) => u.rol === 'agente' || u.rol === 'admin');
                setAgentes(agentesList);
            }
        } catch (error) {
            console.error('Error loading agentes:', error);
        }
    };

    useEffect(() => {
        if (agenciaId) {
            loadTickets(false);
            loadAgentes();
        }
    }, [agenciaId]);

    // Recargas silenciosas en tiempo real al recibir notificaciones por SSE
    useEffect(() => {
        if (refreshTrigger && agenciaId) {
            loadTickets(true);
            if (selectedTicketIdRef.current) {
                loadTicketDetail(selectedTicketIdRef.current, true);
            }
        }
    }, [refreshTrigger]);

    // ============================================
    // FILTRAR TICKETS
    // ============================================
    const ticketsFiltrados = tickets.filter(ticket => {
        if (filtros.estado !== 'todos' && ticket.estado !== filtros.estado) return false;
        if (filtros.prioridad !== 'todas' && ticket.prioridad !== filtros.prioridad) return false;
        
        const search = searchTerm.toLowerCase();
        const matchesSearch = 
            (ticket.numero_secuencial?.toString() || '').includes(search) ||
            ticket.id.toString().includes(search) ||
            (ticket.asunto || '').toLowerCase().includes(search) ||
            (ticket.usuario_nombre || '').toLowerCase().includes(search) ||
            (ticket.usuario_apellido || '').toLowerCase().includes(search) ||
            (ticket.usuario_email || '').toLowerCase().includes(search);
            
        return matchesSearch;
    });

    // ============================================
    // CARGAR DETALLE DEL TICKET CON CONVERSACIÓN
    // ============================================
    const loadTicketDetail = async (ticketId: number, silent = false) => {
        try {
            if (!silent) setLoading(true);
            const response = await api.get(`/tickets/${ticketId}/detalle`);
            if (response.data.success) {
                setSelectedTicket(response.data.data);
                setShowDetailModal(true);
            }
        } catch (error: any) {
            if (!silent) toast.error('Error al cargar detalle del ticket');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    // 🔥 ABRIR TICKET DETALLE CUANDO VIENE DE UNA NOTIFICACIÓN O CLICK EN EL DASHBOARD
    useEffect(() => {
        if (initialSelectedTicketId) {
            loadTicketDetail(initialSelectedTicketId);
            if (onClearInitialTicketId) {
                onClearInitialTicketId();
            }
        }
    }, [initialSelectedTicketId]);

    useEffect(() => {
        if (initialStatusFilter) {
            setFiltros(prev => ({
                ...prev,
                estado: initialStatusFilter
            }));
        }
    }, [initialStatusFilter]);

    // ============================================
    // ENVIAR RESPUESTA
    // ============================================
    const enviarRespuesta = async () => {
        if (!selectedTicket) return;
        if (!replyMessage.trim()) {
            toast.error('Escribe un mensaje antes de enviar');
            return;
        }

        try {
            setEnviandoRespuesta(true);
            await api.post(`/tickets/${selectedTicket.id}/responder`, {
                mensaje: replyMessage,
                usuario_id: user?.id,
                es_interno: false
            });

            toast.success('✅ Respuesta enviada correctamente');
            setReplyMessage('');
            await loadTicketDetail(selectedTicket.id);
            loadTickets();
        } catch (error: any) {
            toast.error(error.response?.data?.error || '❌ Error al enviar respuesta');
        } finally {
            setEnviandoRespuesta(false);
        }
    };

    // ============================================
    // ACTUALIZAR TICKET
    // ============================================
    const handleUpdateTicket = async () => {
        if (!selectedTicket) return;
        
        try {
            setUpdating(true);
            
            await api.put(`/tickets/${selectedTicket.id}/estado`, {
                estado: selectedTicket.estado,
                agente_id: user?.id
            });

            toast.success('✅ Ticket actualizado correctamente');
            loadTickets();
            setShowDetailModal(false);
        } catch (error: any) {
            toast.error(error.response?.data?.error || '❌ Error al actualizar ticket');
        } finally {
            setUpdating(false);
        }
    };

    // ============================================
    // CAMBIAR ESTADO
    // ============================================
    const cambiarEstado = (nuevoEstado: string) => {
        if (selectedTicket) {
            setSelectedTicket({ ...selectedTicket, estado: nuevoEstado });
        }
    };

    // ============================================
    // CAMBIAR PRIORIDAD
    // ============================================
    const cambiarPrioridad = (nuevaPrioridad: string) => {
        if (selectedTicket) {
            setSelectedTicket({ ...selectedTicket, prioridad: nuevaPrioridad });
        }
    };

    // ============================================
    // OBTENER COLORES
    // ============================================
    const getEstadoColor = (estado: string) => {
        const colors: Record<string, { bg: string; text: string }> = {
            pendiente: { bg: '#fef3c7', text: '#92400e' },
            en_progreso: { bg: '#dbeafe', text: '#1e40af' },
            espera: { bg: '#fef3c7', text: '#92400e' },
            resuelto: { bg: '#f3f4f6', text: '#4b5563' },
            cerrado: { bg: '#e5e7eb', text: '#6b7280' },
            abierto: { bg: '#dbeafe', text: '#1e40af' }
        };
        return colors[estado] || colors.pendiente;
    };

    const getPrioridadColor = (prioridad: string) => {
        const colors: Record<string, { bg: string; text: string }> = {
            baja: { bg: '#e5e7eb', text: '#374151' },
            media: { bg: '#dbeafe', text: '#1e40af' },
            alta: { bg: '#fef3c7', text: '#92400e' },
            critica: { bg: '#fee2e2', text: '#dc2626' }
        };
        return colors[prioridad] || colors.media;
    };

    // ============================================
    // RENDER
    // ============================================
    return (
        <div>
            {/* Header y filtros */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: c.texto }}>
                    🎫 Tickets de la Agencia
                </h3>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="🔍 Buscar por número, asunto, usuario..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            padding: '6px 12px',
                            border: '1px solid ' + c.borde,
                            borderRadius: '6px',
                            outline: 'none',
                            minWidth: '220px',
                            fontSize: '14px',
                            backgroundColor: c.inputBg,
                            color: c.inputText
                        }}
                    />
                    <select
                        value={filtros.estado}
                        onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
                        style={{
                            padding: '6px 12px',
                            border: '1px solid ' + c.borde,
                            borderRadius: '6px',
                            outline: 'none',
                            backgroundColor: c.inputBg,
                            color: c.inputText
                        }}
                    >
                        <option value="todos">Todos los estados</option>
                        <option value="abierto">Abierto</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="en_progreso">En progreso</option>
                        <option value="espera">En espera</option>
                        <option value="resuelto">Resuelto</option>
                        <option value="cerrado">Cerrado</option>
                    </select>
                    <select
                        value={filtros.prioridad}
                        onChange={(e) => setFiltros({ ...filtros, prioridad: e.target.value })}
                        style={{
                            padding: '6px 12px',
                            border: '1px solid ' + c.borde,
                            borderRadius: '6px',
                            outline: 'none',
                            backgroundColor: c.inputBg,
                            color: c.inputText
                        }}
                    >
                        <option value="todas">Todas las prioridades</option>
                        <option value="baja">Baja</option>
                        <option value="media">Media</option>
                        <option value="alta">Alta</option>
                        <option value="critica">Crítica</option>
                    </select>
                </div>
            </div>

            {/* Lista de tickets */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: c.texto }}>Cargando tickets...</div>
            ) : ticketsFiltrados.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: c.textoMuted }}>
                    No hay tickets en esta agencia
                </div>
            ) : (
                <div style={{
                    backgroundColor: c.tarjeta,
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    border: '1px solid ' + c.borde
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                        <thead style={{ backgroundColor: isDarkMode ? '#1e293b' : '#f9fafb' }}>
                            <tr>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: c.textoMuted }}>Asunto</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: c.textoMuted }}>Usuario</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: c.textoMuted }}>Prioridad</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: c.textoMuted }}>Estado</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: c.textoMuted }}>Fecha</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: c.textoMuted }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ticketsFiltrados.map((ticket) => {
                                const estadoColor = getEstadoColor(ticket.estado);
                                const prioridadColor = getPrioridadColor(ticket.prioridad);
                                const isResolvedOrClosed = ticket.estado === 'resuelto' || ticket.estado === 'cerrado';
                                
                                return (
                                    <tr key={ticket.id} style={{ 
                                        borderTop: '1px solid ' + c.borde,
                                        opacity: isResolvedOrClosed ? 0.6 : 1,
                                        backgroundColor: isResolvedOrClosed ? 'rgba(128, 128, 128, 0.06)' : 'transparent',
                                        transition: 'all 0.3s ease'
                                    }}>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ 
                                                fontWeight: '500',
                                                textDecoration: isResolvedOrClosed ? 'line-through' : 'none',
                                                color: isResolvedOrClosed ? c.textoMuted : c.texto,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                flexWrap: 'wrap'
                                            }}>
                                                #{ticket.numero_secuencial || ticket.id} - {ticket.asunto}
                                                {(ticket.ultimo_mensaje_rol === 'usuario' && !isResolvedOrClosed) && (
                                                    <span style={{
                                                        backgroundColor: '#3b82f6',
                                                        color: '#ffffff',
                                                        fontSize: '10px',
                                                        padding: '2px 8px',
                                                        borderRadius: '4px',
                                                        fontWeight: 'bold',
                                                        display: 'inline-block'
                                                    }}>
                                                        Contestado por Cliente
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '12px', color: c.textoMuted }}>
                                                {ticket.tipo || 'General'} • {ticket.area || 'Sin área'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ color: c.texto }}>{ticket.usuario_nombre} {ticket.usuario_apellido}</div>
                                            <div style={{ fontSize: '12px', color: c.textoMuted }}>{ticket.usuario_email}</div>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{
                                                padding: '2px 10px',
                                                borderRadius: '4px',
                                                fontSize: '11px',
                                                fontWeight: '500',
                                                backgroundColor: prioridadColor.bg,
                                                color: prioridadColor.text
                                            }}>
                                                {ticket.prioridad}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{
                                                padding: '2px 10px',
                                                borderRadius: '4px',
                                                fontSize: '11px',
                                                fontWeight: '500',
                                                backgroundColor: estadoColor.bg,
                                                color: estadoColor.text
                                            }}>
                                                {ticket.estado}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '13px' }}>
                                            {new Date(ticket.fecha_creacion).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            <button
                                                onClick={() => loadTicketDetail(ticket.id)}
                                                style={{
                                                    padding: '4px 12px',
                                                    backgroundColor: '#2563eb',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                Ver / Gestionar
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ============================================
            MODAL DETALLE DEL TICKET CON VISUALIZACIÓN DE ARCHIVOS
            ============================================ */}
            {showDetailModal && selectedTicket && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: c.tarjeta,
                        color: c.texto,
                        padding: '32px',
                        borderRadius: '12px',
                        maxWidth: '900px',
                        width: '95%',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        position: 'relative',
                        border: '1px solid ' + c.borde
                    }}>
                        <button
                            onClick={() => {
                                setShowDetailModal(false);
                                setSelectedTicket(null);
                                setReplyMessage('');
                                setArchivoSeleccionado(null);
                            }}
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '20px',
                                background: 'none',
                                border: 'none',
                                fontSize: '24px',
                                cursor: 'pointer',
                                color: c.textoMuted,
                                zIndex: 10
                            }}
                        >
                            ×
                        </button>

                        <h2 style={{ 
                            fontSize: '22px', 
                            fontWeight: 'bold', 
                            color: c.texto,
                            marginBottom: '16px',
                            paddingRight: '30px'
                        }}>
                            #{selectedTicket.numero_secuencial || selectedTicket.id} - {selectedTicket.asunto}
                        </h2>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '2fr 1fr',
                            gap: '24px'
                        }}>
                            {/* Columna izquierda - Conversación */}
                            <div>
                                {/* Mensaje inicial */}
                                <div style={{
                                    backgroundColor: isDarkMode ? '#334155' : '#f3f4f6',
                                    color: c.texto,
                                    padding: '12px 16px',
                                    borderRadius: '8px',
                                    marginBottom: '12px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <strong style={{ fontSize: '14px' }}>
                                            {selectedTicket.usuario_nombre} {selectedTicket.usuario_apellido}
                                        </strong>
                                        <span style={{ fontSize: '11px', color: c.textoMuted }}>
                                            {new Date(selectedTicket.fecha_creacion).toLocaleString()}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '14px', whiteSpace: 'pre-wrap', margin: 0 }}>
                                        {selectedTicket.descripcion}
                                    </p>
                                    {(() => {
                                        const archivos = parseArchivos(selectedTicket.archivos_adjuntos);
                                        return archivos.length > 0 ? (
                                            <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {archivos.map((archivo, index) => {
                                                    const esImagenArchivo = esImagen(archivo.tipo);
                                                    const rutaCompleta = archivo.ruta.startsWith('http') ? archivo.ruta : `${IMAGE_BASE_URL}${archivo.ruta}`;
                                                    
                                                    return esImagenArchivo ? (
                                                        <div 
                                                            key={index}
                                                            onClick={() => setArchivoSeleccionado(archivo)}
                                                            style={{
                                                                cursor: 'pointer',
                                                                display: 'inline-block',
                                                                backgroundColor: 'white',
                                                                padding: '4px 8px',
                                                                borderRadius: '4px',
                                                                border: '1px solid #e5e7eb',
                                                                transition: 'all 0.2s',
                                                                maxWidth: '120px'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.borderColor = '#2563eb';
                                                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.borderColor = '#e5e7eb';
                                                                e.currentTarget.style.boxShadow = 'none';
                                                            }}
                                                        >
                                                            <img 
                                                                src={rutaCompleta} 
                                                                alt={archivo.nombre}
                                                                style={{
                                                                    maxWidth: '100px',
                                                                    maxHeight: '60px',
                                                                    objectFit: 'cover',
                                                                    borderRadius: '4px',
                                                                    display: 'block'
                                                                }}
                                                            />
                                                            <div style={{ fontSize: '10px', color: '#6b7280', textAlign: 'center', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {archivo.nombre}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <a
                                                            key={index}
                                                            href={rutaCompleta}
                                                            download={archivo.nombre}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                padding: '4px 10px',
                                                                backgroundColor: 'white',
                                                                borderRadius: '4px',
                                                                border: '1px solid #e5e7eb',
                                                                textDecoration: 'none',
                                                                color: '#2563eb',
                                                                fontSize: '12px',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.borderColor = '#2563eb';
                                                                e.currentTarget.style.backgroundColor = '#eff6ff';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.borderColor = '#e5e7eb';
                                                                e.currentTarget.style.backgroundColor = 'white';
                                                            }}
                                                        >
                                                            {getIconoArchivo(archivo.tipo)} {archivo.nombre}
                                                        </a>
                                                    );
                                                })}
                                            </div>
                                        ) : null;
                                    })()}
                                </div>

                                {/* Historial de mensajes */}
                                {selectedTicket.mensajes && selectedTicket.mensajes.length > 0 && (
                                    <div style={{ marginBottom: '16px' }}>
                                        {selectedTicket.mensajes.map((mensaje) => (
                                            <div
                                                key={mensaje.id}
                                                style={{
                                                    padding: '10px 14px',
                                                    borderRadius: '8px',
                                                    marginBottom: '8px',
                                                    backgroundColor: ['admin', 'superadmin', 'agente'].includes(mensaje.usuario_rol)
                                                        ? (isDarkMode ? 'rgba(37, 99, 235, 0.15)' : '#eff6ff')
                                                        : (isDarkMode ? '#334155' : '#f3f4f6'),
                                                    color: c.texto,
                                                    borderLeft: ['admin', 'superadmin', 'agente'].includes(mensaje.usuario_rol)
                                                        ? '4px solid #2563eb'
                                                        : `4px solid ${c.textoMuted}`
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                    <strong style={{ fontSize: '13px' }}>
                                                        {mensaje.usuario_nombre} {mensaje.usuario_apellido}
                                                        {['admin', 'superadmin', 'agente'].includes(mensaje.usuario_rol) && (
                                                            <span style={{
                                                                fontSize: '11px',
                                                                backgroundColor: '#2563eb',
                                                                color: 'white',
                                                                padding: '1px 8px',
                                                                borderRadius: '4px',
                                                                marginLeft: '8px'
                                                            }}>
                                                                {mensaje.usuario_rol === 'superadmin' ? 'SuperAdmin' : mensaje.usuario_rol === 'admin' ? 'Admin' : 'Soporte'}
                                                            </span>
                                                        )}
                                                    </strong>
                                                    <span style={{ fontSize: '11px', color: c.textoMuted }}>
                                                        {new Date(mensaje.fecha_creacion).toLocaleString()}
                                                    </span>
                                                </div>
                                                <p style={{ fontSize: '14px', whiteSpace: 'pre-wrap', margin: 0 }}>
                                                    {mensaje.contenido}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Campo de respuesta */}
                                <div style={{
                                    backgroundColor: isDarkMode ? '#1e293b' : '#f9fafb',
                                    padding: '16px',
                                    borderRadius: '8px',
                                    border: '1px solid ' + c.borde
                                }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                                        💬 Responder
                                    </label>
                                    <textarea
                                        value={replyMessage}
                                        onChange={(e) => setReplyMessage(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            border: '1px solid ' + c.borde,
                                            borderRadius: '6px',
                                            outline: 'none',
                                            minHeight: '80px',
                                            resize: 'vertical',
                                            fontSize: '14px',
                                            marginBottom: '10px',
                                            backgroundColor: c.inputBg,
                                            color: c.inputText
                                        }}
                                        placeholder="Escribe tu respuesta aquí..."
                                    />
                                    <button
                                        onClick={enviarRespuesta}
                                        disabled={enviandoRespuesta}
                                        style={{
                                            padding: '8px 24px',
                                            backgroundColor: '#10b981',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            opacity: enviandoRespuesta ? 0.5 : 1
                                        }}
                                    >
                                        {enviandoRespuesta ? 'Enviando...' : '📤 Enviar'}
                                    </button>
                                </div>
                            </div>

                            {/* Columna derecha - Resumen y Propiedades */}
                            <div>
                                {/* Resumen */}
                                <div style={{
                                    backgroundColor: isDarkMode ? '#1e293b' : '#f9fafb',
                                    padding: '16px',
                                    borderRadius: '8px',
                                    marginBottom: '16px',
                                    border: '1px solid ' + c.borde
                                }}>
                                    <h4 style={{ 
                                        fontSize: '13px', 
                                        fontWeight: 'bold', 
                                        color: c.textoMuted,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        marginBottom: '8px'
                                    }}>
                                        📋 Resumen
                                    </h4>
                                    <div style={{ fontSize: '14px' }}>
                                        <p><strong>Estado:</strong> {selectedTicket.estado}</p>
                                        {selectedTicket.fecha_cierre && (
                                            <p><strong>Cerrada:</strong> {new Date(selectedTicket.fecha_cierre).toLocaleDateString('es-ES', { 
                                                day: 'numeric',
                                                month: 'short', 
                                                year: 'numeric'
                                            })}</p>
                                        )}
                                        {selectedTicket.fecha_resolucion && (
                                            <p><strong>Resuelta:</strong> {new Date(selectedTicket.fecha_resolucion).toLocaleDateString('es-ES', { 
                                                day: 'numeric',
                                                month: 'short', 
                                                year: 'numeric'
                                            })}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Propiedades */}
                                <div style={{
                                    backgroundColor: isDarkMode ? '#1e293b' : '#f9fafb',
                                    padding: '16px',
                                    borderRadius: '8px',
                                    marginBottom: '16px',
                                    border: '1px solid ' + c.borde
                                }}>
                                    <h4 style={{ 
                                        fontSize: '13px', 
                                        fontWeight: 'bold', 
                                        color: c.textoMuted,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        marginBottom: '8px'
                                    }}>
                                        ⚙️ Propiedades
                                    </h4>
                                    <div style={{ fontSize: '14px' }}>
                                        <p><strong>Tipo:</strong> {selectedTicket.tipo || 'General'}</p>
                                        <p><strong>Estado:</strong> {selectedTicket.estado}</p>
                                        <p><strong>Prioridad:</strong> {selectedTicket.prioridad}</p>
                                        <p><strong>Grupo:</strong> {selectedTicket.area || 'Sin grupo'}</p>
                                        <p><strong>Agente:</strong> {selectedTicket.agente_nombre || 'Sin asignar'}</p>
                                    </div>
                                </div>

                                {/* Selectores de gestión */}
                                <div style={{
                                    backgroundColor: isDarkMode ? '#1e293b' : '#f9fafb',
                                    padding: '16px',
                                    borderRadius: '8px',
                                    marginBottom: '16px',
                                    border: '1px solid ' + c.borde
                                }}>
                                    <h4 style={{ 
                                        fontSize: '13px', 
                                        fontWeight: 'bold', 
                                        color: c.textoMuted,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        marginBottom: '8px'
                                    }}>
                                        🔧 Gestión
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <select
                                            value={selectedTicket.estado}
                                            onChange={(e) => cambiarEstado(e.target.value)}
                                            style={{
                                                padding: '6px 12px',
                                                border: '1px solid ' + c.borde,
                                                borderRadius: '6px',
                                                outline: 'none',
                                                backgroundColor: c.inputBg,
                                                color: c.inputText,
                                                fontSize: '13px',
                                                width: '100%'
                                            }}
                                        >
                                            <option value="abierto">Abierto</option>
                                            <option value="pendiente">Pendiente</option>
                                            <option value="en_progreso">En progreso</option>
                                            <option value="espera">En espera</option>
                                            <option value="resuelto">Resuelto</option>
                                            <option value="cerrado">Cerrado</option>
                                        </select>

                                        <select
                                            value={selectedTicket.prioridad}
                                            onChange={(e) => cambiarPrioridad(e.target.value)}
                                            style={{
                                                padding: '6px 12px',
                                                border: '1px solid ' + c.borde,
                                                borderRadius: '6px',
                                                outline: 'none',
                                                backgroundColor: c.inputBg,
                                                color: c.inputText,
                                                fontSize: '13px',
                                                width: '100%'
                                            }}
                                        >
                                            <option value="baja">Baja</option>
                                            <option value="media">Media</option>
                                            <option value="alta">Alta</option>
                                            <option value="critica">Crítica</option>
                                        </select>

                                        <select
                                            value={selectedTicket.agente_id || ''}
                                            onChange={(e) => {
                                                const agenteId = parseInt(e.target.value);
                                                if (selectedTicket) {
                                                    const agente = agentes.find(a => a.id === agenteId);
                                                    setSelectedTicket({
                                                        ...selectedTicket,
                                                        agente_id: agenteId,
                                                        agente_nombre: agente?.nombre,
                                                        agente_apellido: agente?.apellido
                                                    });
                                                }
                                            }}
                                            style={{
                                                padding: '6px 12px',
                                                border: '1px solid ' + c.borde,
                                                borderRadius: '6px',
                                                outline: 'none',
                                                backgroundColor: c.inputBg,
                                                color: c.inputText,
                                                fontSize: '13px',
                                                width: '100%'
                                            }}
                                        >
                                            <option value="">Sin asignar</option>
                                            {agentes.map((agente) => (
                                                <option key={agente.id} value={agente.id}>
                                                    {agente.nombre} {agente.apellido}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Botón Actualizar */}
                                <button
                                    onClick={handleUpdateTicket}
                                    disabled={updating}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        backgroundColor: '#2563eb',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '16px',
                                        fontWeight: '500',
                                        opacity: updating ? 0.5 : 1
                                    }}
                                >
                                    {updating ? 'Actualizando...' : 'Actualizar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================
            MODAL PARA VER IMAGEN COMPLETA
            ============================================ */}
            {archivoSeleccionado && esImagen(archivoSeleccionado.tipo) && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000
                }}>
                    <div style={{
                        position: 'relative',
                        maxWidth: '90%',
                        maxHeight: '90%'
                    }}>
                        <button
                            onClick={() => setArchivoSeleccionado(null)}
                            style={{
                                position: 'absolute',
                                top: '-40px',
                                right: '0',
                                background: 'none',
                                border: 'none',
                                color: 'white',
                                fontSize: '30px',
                                cursor: 'pointer'
                            }}
                        >
                            ×
                        </button>
                        <img
                            src={archivoSeleccionado.ruta.startsWith('http') ? archivoSeleccionado.ruta : `${IMAGE_BASE_URL}${archivoSeleccionado.ruta}`}
                            alt={archivoSeleccionado.nombre}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '90vh',
                                objectFit: 'contain',
                                borderRadius: '8px',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                            }}
                        />
                        <div style={{
                            position: 'absolute',
                            bottom: '-40px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            color: 'white',
                            fontSize: '14px',
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            padding: '4px 16px',
                            borderRadius: '4px'
                        }}>
                            {archivoSeleccionado.nombre}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTickets;