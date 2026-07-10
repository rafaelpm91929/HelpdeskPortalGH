import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/axios.config';
import toast from 'react-hot-toast';
import { Configuracion } from '../components/Configuracion';
import { Usuarios } from '../components/Usuarios';
import { logout } from '../utils/logout';
import { PUBLIC_IP, IMAGE_BASE_URL, FRONTEND_BASE_URL, API_BASE_URL } from '../config';
import { AdminTickets } from '../components/AdminTickets';

// ============================================
// TIPOS
// ============================================
interface ITicket {
    id: number;
    numero_secuencial?: number;
    asunto: string;
    descripcion: string;
    prioridad: 'baja' | 'media' | 'alta' | 'critica';
    estado: 'pendiente' | 'en_progreso' | 'espera' | 'resuelto' | 'cerrado' | 'abierto';
    fecha_creacion: string;
    usuario_nombre: string;
    usuario_apellido: string;
}

interface IEstadisticas {
    total: number;
    pendientes: number;
    en_progreso: number;
    abiertos: number;
    espera: number;
    resueltos: number;
    cerrados: number;
}

interface IAgenciaInfo {
    id: number;
    nombre: string;
    subdominio: string;
    colores_primario: string;
    colores_secundario: string;
    colores_fondo: string;
    colores_texto: string;
    logo_url: string | null;
}

interface INotificacion {
    id: number;
    ticket_id: number;
    mensaje: string;
    leido: boolean;
    fecha_creacion: string;
}

// ============================================
// PROPS
// ============================================
interface AdminDashboardProps {
    subdominio?: string;
    agenciaId?: number;
    isSuperAdminMode?: boolean;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
    subdominio,
    agenciaId, 
    isSuperAdminMode = false 
}) => {
    const { user } = useAuth();
    const [tickets, setTickets] = useState<ITicket[]>([]);
    const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('todos');

    // 🔥 ESTADOS PARA NOTIFICACIONES
    const [notificaciones, setNotificaciones] = useState<INotificacion[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [selectedTicketIdForNotification, setSelectedTicketIdForNotification] = useState<number | null>(null);

    const [estadisticas, setEstadisticas] = useState<IEstadisticas>({
        total: 0,
        pendientes: 0,
        en_progreso: 0,
        abiertos: 0,
        espera: 0,
        resueltos: 0,
        cerrados: 0
    });
    const [loading, setLoading] = useState(true);
    const [initialLoading, setInitialLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'tickets' | 'usuarios' | 'estadisticas' | 'configuracion'>(() => {
        return (localStorage.getItem(`active_tab_admin_${user?.id}`) as any) || 'dashboard';
    });
    const [agenciaInfo, setAgenciaInfo] = useState<IAgenciaInfo | null>(null);
    const [temaUsuario, setTemaUsuario] = useState<string>(() => localStorage.getItem(`theme_admin_${user?.id}`) || 'agencia');

    // 🔥 CARGAR NOTIFICACIONES desde API
    const loadNotificaciones = async () => {
        if (!user?.id) return;
        try {
            const response = await api.get(`/notificaciones/usuario/${user.id}`);
            if (response.data.success) {
                const data = response.data.data;
                setNotificaciones(data);
                setUnreadCount(data.filter((n: any) => !n.leido).length);
            }
        } catch (error) {
            console.error('Error al cargar notificaciones:', error);
        }
    };

    // 🔥 NOTIFICACIONES EN TIEMPO REAL VÍA SSE
    useEffect(() => {
        if (!user?.id) return;

        loadNotificaciones();

        const token = sessionStorage.getItem('token');
        const sseUrl = `${API_BASE_URL}/notificaciones/stream/${user.id}?token=${token}`;
        
        console.log('🔌 Conectando a notificaciones en tiempo real (SSE)...');
        const eventSource = new EventSource(sseUrl);

        eventSource.onmessage = (event) => {
            try {
                const newNotification = JSON.parse(event.data);
                console.log('🔔 Nueva notificación recibida:', newNotification);
                
                setNotificaciones(prev => {
                    if (prev.some(n => n.id === newNotification.id)) return prev;
                    const updated = [newNotification, ...prev];
                    setUnreadCount(updated.filter(n => !n.leido).length);
                    return updated;
                });

                toast.success(newNotification.mensaje, {
                    duration: 6000,
                    icon: '🔔'
                });

                // Recargar tickets y estadísticas en tiempo real
                const currentAgenciaId = agenciaId || agenciaInfo?.id || (!isSuperAdminMode ? user?.agencia_id : undefined);
                if (currentAgenciaId) {
                     loadTickets(currentAgenciaId);
                }
            } catch (err) {
                console.error('Error al procesar notificación en tiempo real:', err);
            }
        };

        eventSource.onerror = (err) => {
            console.error('❌ Error en conexión EventSource:', err);
        };

        return () => {
            console.log('🔌 Desconectando notificaciones en tiempo real (SSE)...');
            eventSource.close();
        };
    }, [user, agenciaId, agenciaInfo?.id, isSuperAdminMode]);

    // 🔥 MARCAR COMO LEÍDA Y ABRIR TICKET
    const handleNotificationClick = async (notif: INotificacion) => {
        try {
            if (!notif.leido) {
                await api.put(`/notificaciones/${notif.id}/leer`);
                setNotificaciones(prev =>
                    prev.map(n => n.id === notif.id ? { ...n, leido: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
            setSelectedTicketIdForNotification(notif.ticket_id);
            setActiveTab('tickets');
            setShowNotifications(false);
        } catch (error) {
            console.error('Error al marcar notificación como leída:', error);
        }
    };

    // 🔥 MARCAR TODAS COMO LEÍDAS
    const handleMarkAllAsRead = async () => {
        if (!user?.id) return;
        try {
            await api.put(`/notificaciones/usuario/${user.id}/leer-todas`);
            setNotificaciones(prev => prev.map(n => ({ ...n, leido: true })));
            setUnreadCount(0);
            toast.success('Notificaciones marcadas como leídas');
        } catch (error) {
            console.error('Error al marcar todas las notificaciones como leídas:', error);
            toast.error('Error al marcar notificaciones');
        }
    };
    useEffect(() => {
        if (user?.id) {
            localStorage.setItem(`active_tab_admin_${user.id}`, activeTab);
        }
    }, [activeTab, user]);

    const defaultTema = (agenciaInfo?.colores_fondo || '').split('|')[1] || 'claro';
    const temaActivo = temaUsuario === 'agencia' ? defaultTema : temaUsuario;
    const isDarkMode = temaActivo === 'oscuro';

    // ============================================
    // COLORES DE LA AGENCIA (con fallbacks)
    // ============================================
    const colores = {
        primario: agenciaInfo?.colores_primario || '#2563eb',
        secundario: agenciaInfo?.colores_secundario || '#3b82f6',
        fondo: isDarkMode ? '#0f172a' : '#f3f4f6',
        texto: isDarkMode ? '#f8fafc' : '#1f2937',
        tarjeta: isDarkMode ? '#1e293b' : '#ffffff',
        borde: isDarkMode ? '#334155' : '#e5e7eb',
        inputBg: isDarkMode ? '#1e293b' : '#ffffff',
        inputText: isDarkMode ? '#ffffff' : '#1f2937',
        textoMuted: isDarkMode ? '#94a3b8' : '#6b7280',
        hoverBg: isDarkMode ? '#334155' : '#f9fafb'
    };

    // ============================================
    // CARGAR DATOS DE LA AGENCIA
    // ============================================
    const loadAgenciaInfo = async () => {
        try {
            let response;
            
            if (subdominio) {
                response = await api.get(`/agencias/subdominio/${subdominio}`);
            } else if (agenciaId) {
                response = await api.get(`/agencias/${agenciaId}`);
            } else if (user?.agencia_id) {
                response = await api.get(`/agencias/${user.agencia_id}`);
            }
            
            if (response?.data.success) {
                const data = response.data.data;
                // 🔥 Si tiene logo, usar IMAGE_BASE_URL
                if (data.logo_url) {
                    data.logo_url = data.logo_url.startsWith('http') ? 
                        data.logo_url : `${IMAGE_BASE_URL}${data.logo_url}`;
                }
                setAgenciaInfo(data);
                console.log('🏢 Agencia cargada:', data);
            }
        } catch (error) {
            console.error('Error loading agencia info:', error);
        }
    };

    useEffect(() => {
        loadAgenciaInfo();
    }, [subdominio, agenciaId, user]);

    // ============================================
    // CARGAR TICKETS
    // ============================================
    useEffect(() => {
        const id = agenciaId || agenciaInfo?.id || (!isSuperAdminMode ? user?.agencia_id : undefined);
        if (id) {
            loadTickets(id);
        }
    }, [user, agenciaId, agenciaInfo, isSuperAdminMode, activeTab]);

    const loadTickets = async (id: number) => {
        try {
            setLoading(true);
            const response = await api.get(`/tickets/agencia/${id}`);
            
            if (response.data.success) {
                const ticketsData = response.data.data;
                setTickets(ticketsData);
                
                const stats: IEstadisticas = {
                    total: ticketsData.length,
                    pendientes: ticketsData.filter((t: ITicket) => t.estado === 'pendiente').length,
                    en_progreso: ticketsData.filter((t: ITicket) => t.estado === 'en_progreso').length,
                    abiertos: ticketsData.filter((t: ITicket) => t.estado === 'abierto').length,
                    espera: ticketsData.filter((t: ITicket) => t.estado === 'espera').length,
                    resueltos: ticketsData.filter((t: ITicket) => t.estado === 'resuelto').length,
                    cerrados: ticketsData.filter((t: ITicket) => t.estado === 'cerrado').length
                };
                setEstadisticas(stats);
            }
        } catch (error) {
            console.error('Error loading tickets:', error);
            toast.error('Error al cargar tickets');
        } finally {
            setLoading(false);
            setTimeout(() => {
                setInitialLoading(false);
            }, 1200);
        }
    };

    // ============================================
    // RENDER
    // ============================================
    if (initialLoading || !user) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(135deg, ${colores.primario} 0%, ${colores.secundario} 100%)`,
                fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
                <style>{`
                    @keyframes pulse-glow {
                        0% { transform: scale(0.95); box-shadow: 0 0 20px rgba(255, 255, 255, 0.2); }
                        50% { transform: scale(1.05); box-shadow: 0 0 40px rgba(255, 255, 255, 0.6); }
                        100% { transform: scale(0.95); box-shadow: 0 0 20px rgba(255, 255, 255, 0.2); }
                    }
                    @keyframes spin-slow {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    @keyframes bounce-delay {
                        0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
                        40% { transform: scale(1.0); opacity: 1; }
                    }
                    .dot {
                        width: 12px;
                        height: 12px;
                        background-color: white;
                        border-radius: 50%;
                        display: inline-block;
                        animation: bounce-delay 1.4s infinite ease-in-out both;
                    }
                    .dot1 { animation-delay: -0.32s; }
                    .dot2 { animation-delay: -0.16s; }
                `}</style>

                <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    padding: '40px 32px',
                    borderRadius: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    maxWidth: '360px',
                    width: '90%',
                    textAlign: 'center'
                }}>
                    <div style={{
                        position: 'relative',
                        width: '120px',
                        height: '120px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '24px'
                    }}>
                        <div style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            border: '3px solid transparent',
                            borderTopColor: 'rgba(255, 255, 255, 0.8)',
                            borderBottomColor: 'rgba(255, 255, 255, 0.2)',
                            animation: 'spin-slow 2s linear infinite'
                        }} />
                        <div style={{
                            width: '90px',
                            height: '90px',
                            borderRadius: '50%',
                            backgroundColor: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            animation: 'pulse-glow 2.5s infinite ease-in-out',
                            padding: '10px',
                            boxSizing: 'border-box'
                        }}>
                            {agenciaInfo?.logo_url ? (
                                <img src={agenciaInfo.logo_url} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                            ) : (
                                <span style={{ fontSize: '40px' }}>🏢</span>
                            )}
                        </div>
                    </div>

                    <h2 style={{
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '22px',
                        margin: '0 0 8px 0',
                        textShadow: '0 2px 4px rgba(0,0,0,0.15)'
                    }}>
                        {agenciaInfo?.nombre || 'Cargando...'}
                    </h2>
                    
                    <p style={{
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: '14px',
                        margin: '0 0 24px 0'
                    }}>
                        Iniciando panel de administración...
                    </p>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <div className="dot dot1" />
                        <div className="dot dot2" />
                        <div className="dot" />
                    </div>
                </div>
            </div>
        );
    }

    const nombreAgencia = agenciaInfo?.nombre || `Agencia ${user?.agencia_id}`;
    const subdominioAgencia = agenciaInfo?.subdominio || subdominio || 'sin-subdominio';

    return (
        <div style={{ 
            display: 'flex', 
            minHeight: '100vh', 
            backgroundColor: colores.fondo,
            color: colores.texto,
            fontFamily: "'Poppins', sans-serif"
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
                
                input, select, textarea {
                    background-color: ${colores.inputBg} !important;
                    color: ${colores.inputText} !important;
                    border: 1px solid ${colores.borde} !important;
                }
                
                table {
                    color: ${colores.texto} !important;
                }
                
                thead {
                    background-color: ${isDarkMode ? '#1e293b' : '#f9fafb'} !important;
                }
                
                th {
                    color: ${colores.textoMuted} !important;
                }
                
                tr {
                    border-color: ${colores.borde} !important;
                }
                
                td {
                    color: ${colores.texto} !important;
                }
                
                /* Estilos globales para divs de subcomponentes */
                .dark-card-bg {
                    background-color: ${colores.tarjeta} !important;
                    color: ${colores.texto} !important;
                    border: 1px solid ${colores.borde} !important;
                }
            `}</style>
            {/* ============================================
            SIDEBAR - Con colores de la agencia
            ============================================ */}
            <div style={{
                width: '250px',
                backgroundColor: colores.tarjeta,
                boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
                borderRight: '1px solid ' + colores.borde,
                padding: '20px 0',
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                top: 0,
                left: 0,
                height: '100vh',
                overflowY: 'auto'
            }}>
                {/* Header del sidebar con LOGO y nombre */}
                <div style={{
                    padding: '0 20px 20px 20px',
                    borderBottom: `3px solid ${colores.primario}`,
                    marginBottom: '16px'
                }}>
                    <div style={{
                        backgroundColor: colores.primario,
                        padding: '16px 12px',
                        borderRadius: '8px',
                        color: 'white',
                        textAlign: 'center'
                    }}>
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: '10px',
                            flexWrap: 'wrap'
                        }}>
                            {agenciaInfo?.logo_url ? (
                                <img 
                                    src={agenciaInfo.logo_url} 
                                    alt="Logo" 
                                    style={{ 
                                        height: '40px', 
                                        width: '40px', 
                                        objectFit: 'contain',
                                        borderRadius: '6px',
                                        backgroundColor: 'white',
                                        padding: '4px'
                                    }} 
                                />
                            ) : (
                                <span style={{ fontSize: '28px' }}>🏢</span>
                            )}
                            <span style={{
                                fontSize: '16px',
                                fontWeight: 'bold',
                                margin: 0,
                                lineHeight: 1.2
                            }}>
                                {nombreAgencia}
                            </span>
                        </div>
                        <p style={{
                            fontSize: '11px',
                            opacity: 0.8,
                            margin: '6px 0 0 0'
                        }}>
                            {subdominioAgencia}
                        </p>
                    </div>
                    <p style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        marginTop: '8px',
                        textAlign: 'center'
                    }}>
                        {user?.nombre} {user?.apellido} • {user?.rol}
                    </p>
                </div>

                {/* 🔥 BOTÓN VOLVER AL SUPERADMIN - Usa FRONTEND_BASE_URL */}
                {isSuperAdminMode && (
                    <div style={{ padding: '0 20px 12px 20px' }}>
                        <button
                            onClick={() => {
                                window.location.href = `${FRONTEND_BASE_URL}/superadmin`;
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                width: '100%',
                                padding: '8px 12px',
                                backgroundColor: '#fef3c7',
                                color: '#92400e',
                                border: '1px solid #f59e0b',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '500',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#fde68a';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#fef3c7';
                            }}
                        >
                            🔙 Volver al SuperAdmin
                        </button>
                    </div>
                )}

                {/* Navegación */}
                <nav style={{ flex: 1 }}>
                    {[
                        { id: 'dashboard', icon: '📊', label: 'Dashboard' },
                        { id: 'tickets', icon: '🎫', label: 'Tickets' },
                        { id: 'usuarios', icon: '👥', label: 'Usuarios' },
                        { id: 'estadisticas', icon: '📈', label: 'Estadísticas' },
                        { id: 'configuracion', icon: '⚙️', label: 'Configuración' }
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                width: '100%',
                                padding: '12px 20px',
                                backgroundColor: activeTab === item.id ? `${colores.primario}15` : 'transparent',
                                color: activeTab === item.id ? colores.primario : colores.texto,
                                border: 'none',
                                borderRight: activeTab === item.id ? `3px solid ${colores.primario}` : 'none',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: activeTab === item.id ? '600' : '400',
                                transition: 'all 0.2s'
                            }}
                        >
                            {item.icon} {item.label}
                        </button>
                    ))}
                </nav>

                {/* 🔥 Cerrar sesión - Usa logout() */}
                <div style={{
                    padding: '16px 20px',
                    borderTop: '1px solid #e5e7eb',
                    marginTop: 'auto'
                }}>
                    <button
                        onClick={() => {
                            logout();
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            width: '100%',
                            padding: '8px 12px',
                            backgroundColor: '#fee2e2',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}
                    >
                        🚪 Cerrar sesión
                    </button>
                </div>
            </div>

            {/* ============================================
            CONTENIDO PRINCIPAL
            ============================================ */}
            <div style={{
                marginLeft: '250px',
                flex: 1,
                padding: '24px',
                minHeight: '100vh'
            }}>
                {/* Header con LOGO */}
                <div style={{
                    backgroundColor: colores.tarjeta,
                    padding: '16px 24px',
                    borderRadius: '8px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    borderTop: '1px solid ' + colores.borde,
                    borderRight: '1px solid ' + colores.borde,
                    borderBottom: '1px solid ' + colores.borde,
                    borderLeft: `4px solid ${colores.primario}`,
                    marginBottom: '24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {agenciaInfo?.logo_url ? (
                            <img 
                                src={agenciaInfo.logo_url} 
                                alt="Logo" 
                                style={{ 
                                    height: '32px', 
                                    width: '32px', 
                                    objectFit: 'contain',
                                    borderRadius: '4px'
                                }} 
                            />
                        ) : (
                            <span style={{ fontSize: '24px' }}>🏢</span>
                        )}
                        <div>
                            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: colores.texto, margin: 0 }}>
                                {activeTab === 'dashboard' && '📊 Dashboard'}
                                {activeTab === 'tickets' && '🎫 Tickets'}
                                {activeTab === 'usuarios' && '👥 Usuarios'}
                                {activeTab === 'estadisticas' && '📈 Estadísticas'}
                                {activeTab === 'configuracion' && '⚙️ Configuración'}
                            </h1>
                            <p style={{ color: colores.textoMuted, fontSize: '13px', margin: 0 }}>
                                {nombreAgencia} • {user?.nombre} {user?.apellido}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {/* 🔥 BOTÓN DE NOTIFICACIONES */}
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '20px',
                                    padding: '8px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: showNotifications ? (isDarkMode ? '#334155' : '#f3f4f6') : 'transparent',
                                    color: colores.texto,
                                    transition: 'background-color 0.2s',
                                    outline: 'none'
                                }}
                                onMouseEnter={(e) => {
                                    if (!showNotifications) e.currentTarget.style.backgroundColor = isDarkMode ? '#1e293b' : '#f9fafb';
                                }}
                                onMouseLeave={(e) => {
                                    if (!showNotifications) e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                </svg>
                                {unreadCount > 0 && (
                                    <span style={{
                                        position: 'absolute',
                                        top: '2px',
                                        right: '2px',
                                        backgroundColor: '#ef4444',
                                        color: 'white',
                                        borderRadius: '50%',
                                        padding: '2px 6px',
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                        lineHeight: 1
                                    }}>
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* DROPDOWN DE NOTIFICACIONES */}
                            {showNotifications && (
                                <>
                                    <div 
                                        onClick={() => setShowNotifications(false)}
                                        style={{
                                            position: 'fixed',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            zIndex: 99,
                                            backgroundColor: 'transparent'
                                        }}
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        right: 0,
                                        marginTop: '8px',
                                        width: '320px',
                                        backgroundColor: colores.tarjeta,
                                        border: '1px solid ' + colores.borde,
                                        borderRadius: '8px',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                        zIndex: 100,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            padding: '12px 16px',
                                            borderBottom: '1px solid ' + colores.borde,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            backgroundColor: isDarkMode ? '#1e293b' : '#f9fafb'
                                        }}>
                                            <span style={{ fontWeight: '600', fontSize: '14px', color: colores.texto }}>Notificaciones</span>
                                            {unreadCount > 0 && (
                                                <button 
                                                    onClick={handleMarkAllAsRead}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: colores.primario,
                                                        fontSize: '12px',
                                                        cursor: 'pointer',
                                                        fontWeight: '500',
                                                        padding: 0
                                                    }}
                                                >
                                                    Marcar todo como leído
                                                </button>
                                            )}
                                        </div>
                                        <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                                            {notificaciones.length === 0 ? (
                                                <div style={{ padding: '24px', textAlign: 'center', color: colores.textoMuted, fontSize: '13px' }}>
                                                    No tienes notificaciones
                                                </div>
                                            ) : (
                                                notificaciones.map((notif) => (
                                                    <div 
                                                        key={notif.id}
                                                        onClick={() => handleNotificationClick(notif)}
                                                        style={{
                                                            padding: '12px 16px',
                                                            borderBottom: '1px solid ' + colores.borde,
                                                            cursor: 'pointer',
                                                            backgroundColor: notif.leido ? 'transparent' : (isDarkMode ? '#1e293b80' : '#3b82f608'),
                                                            transition: 'background-color 0.2s',
                                                            display: 'flex',
                                                            gap: '10px',
                                                            alignItems: 'start'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor = isDarkMode ? '#33415550' : '#f3f4f650';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor = notif.leido ? 'transparent' : (isDarkMode ? '#1e293b80' : '#3b82f608');
                                                        }}
                                                    >
                                                        <div style={{
                                                            marginTop: '4px',
                                                            width: '8px',
                                                            height: '8px',
                                                            borderRadius: '50%',
                                                            backgroundColor: notif.leido ? 'transparent' : colores.primario,
                                                            flexShrink: 0
                                                        }} />
                                                        <div style={{ flex: 1 }}>
                                                            <p style={{ 
                                                                margin: 0, 
                                                                fontSize: '13px', 
                                                                color: colores.texto,
                                                                lineHeight: 1.4,
                                                                fontWeight: notif.leido ? '400' : '500',
                                                                textAlign: 'left'
                                                            }}>
                                                                {notif.mensaje}
                                                            </p>
                                                            <span style={{ fontSize: '11px', color: colores.textoMuted, marginTop: '4px', display: 'block', textAlign: 'left' }}>
                                                                {new Date(notif.fecha_creacion).toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {isSuperAdminMode && (
                            <span style={{
                                padding: '4px 12px',
                                backgroundColor: '#fef3c7',
                                borderRadius: '4px',
                                fontSize: '11px',
                                color: '#92400e',
                                fontWeight: '500',
                                border: '1px solid #f59e0b'
                            }}>
                                👑 SuperAdmin
                            </span>
                        )}
                        <span style={{
                            padding: '4px 12px',
                            backgroundColor: colores.primario,
                            borderRadius: '4px',
                            fontSize: '11px',
                            color: 'white'
                        }}>
                            {subdominioAgencia}
                        </span>
                    </div>
                </div>

                {/* ============================================
                CONTENIDO SEGÚN TAB
                ============================================ */}
                
                {/* DASHBOARD */}
                {activeTab === 'dashboard' && (
                    <div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: '16px',
                            marginBottom: '24px'
                        }}>
                            <div 
                                onClick={() => {
                                    setSelectedStatusFilter('todos');
                                    setActiveTab('tickets');
                                }}
                                style={{
                                    backgroundColor: colores.tarjeta,
                                    padding: '20px',
                                    borderRadius: '8px',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                    border: '1px solid ' + colores.borde,
                                    borderTop: `4px solid ${colores.primario}`,
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                            >
                                <p style={{ fontSize: '14px', color: colores.textoMuted }}>Total</p>
                                <p style={{ fontSize: '32px', fontWeight: 'bold', color: colores.texto }}>
                                    {estadisticas.total}
                                </p>
                            </div>
                            <div 
                                onClick={() => {
                                    setSelectedStatusFilter('pendiente');
                                    setActiveTab('tickets');
                                }}
                                style={{
                                    backgroundColor: colores.tarjeta,
                                    padding: '20px',
                                    borderRadius: '8px',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                    border: '1px solid ' + colores.borde,
                                    borderTop: `4px solid #f59e0b`,
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                            >
                                <p style={{ fontSize: '14px', color: colores.textoMuted }}>Pendientes</p>
                                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>
                                    {estadisticas.pendientes}
                                </p>
                            </div>
                            <div 
                                onClick={() => {
                                    setSelectedStatusFilter('abierto');
                                    setActiveTab('tickets');
                                }}
                                style={{
                                    backgroundColor: colores.tarjeta,
                                    padding: '20px',
                                    borderRadius: '8px',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                    border: '1px solid ' + colores.borde,
                                    borderTop: `4px solid #3b82f6`,
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                            >
                                <p style={{ fontSize: '14px', color: colores.textoMuted }}>Abiertos</p>
                                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>
                                    {estadisticas.abiertos}
                                </p>
                            </div>
                            <div 
                                onClick={() => {
                                    setSelectedStatusFilter('resuelto');
                                    setActiveTab('tickets');
                                }}
                                style={{
                                    backgroundColor: colores.tarjeta,
                                    padding: '20px',
                                    borderRadius: '8px',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                    border: '1px solid ' + colores.borde,
                                    borderTop: `4px solid #10b981`,
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                            >
                                <p style={{ fontSize: '14px', color: colores.textoMuted }}>Resueltos</p>
                                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>
                                    {estadisticas.resueltos}
                                </p>
                            </div>
                        </div>

                        <div style={{
                            backgroundColor: colores.tarjeta,
                            padding: '20px',
                            borderRadius: '8px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            border: '1px solid ' + colores.borde
                        }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: colores.texto, marginBottom: '16px' }}>
                                Últimos tickets
                            </h3>
                            {loading ? (
                                <p>Cargando...</p>
                            ) : tickets.length === 0 ? (
                                <p style={{ color: colores.textoMuted }}>No hay tickets aún</p>
                            ) : (
                                <div>
                                    {tickets.slice(0, 5).map((ticket) => (
                                        <div 
                                            key={ticket.id} 
                                            onClick={() => {
                                                setSelectedTicketIdForNotification(ticket.id);
                                                setActiveTab('tickets');
                                            }}
                                            style={{
                                                padding: '12px',
                                                borderBottom: '1px solid ' + colores.borde,
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                cursor: 'pointer',
                                                transition: 'background-color 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = colores.hoverBg;
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }}
                                        >
                                            <div>
                                                <p style={{ fontWeight: '500' }}>#{ticket.numero_secuencial || ticket.id} - {ticket.asunto}</p>
                                                <p style={{ fontSize: '12px', color: colores.textoMuted }}>
                                                    {ticket.usuario_nombre} {ticket.usuario_apellido} • {new Date(ticket.fecha_creacion).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <span style={{
                                                padding: '2px 10px',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                backgroundColor: 
                                                    ticket.estado === 'pendiente' ? '#fef3c7' :
                                                    ticket.estado === 'en_progreso' ? '#dbeafe' :
                                                    ticket.estado === 'resuelto' ? '#d1fae5' :
                                                    ticket.estado === 'cerrado' ? '#f3f4f6' :
                                                    '#fef3c7',
                                                color:
                                                    ticket.estado === 'pendiente' ? '#92400e' :
                                                    ticket.estado === 'en_progreso' ? '#1e40af' :
                                                    ticket.estado === 'resuelto' ? '#065f46' :
                                                    ticket.estado === 'cerrado' ? '#374151' :
                                                    '#92400e'
                                            }}>
                                                {ticket.estado}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TICKETS - Componente con diseño profesional */}
                {activeTab === 'tickets' && (
                    <AdminTickets 
                        agenciaId={agenciaInfo?.id || user?.agencia_id || 0} 
                        colores={colores}
                        isDarkMode={isDarkMode}
                        initialSelectedTicketId={selectedTicketIdForNotification}
                        onClearInitialTicketId={() => setSelectedTicketIdForNotification(null)}
                        initialStatusFilter={selectedStatusFilter}
                    />
                )}

                {/* USUARIOS */}
                {activeTab === 'usuarios' && (
                    <Usuarios 
                        agenciaId={agenciaInfo?.id || user?.agencia_id || 0} 
                        colores={colores}
                        isDarkMode={isDarkMode}
                    />
                )}

                {/* ESTADÍSTICAS */}
                {activeTab === 'estadisticas' && (
                    <div style={{
                        backgroundColor: colores.tarjeta,
                        color: colores.texto,
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        border: '1px solid ' + colores.borde
                    }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                            📈 Estadísticas Avanzadas
                        </h3>
                        <p style={{ color: colores.textoMuted }}>
                            Próximamente: gráficas y estadísticas detalladas de tickets.
                        </p>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '16px',
                            marginTop: '16px'
                        }}>
                            <div style={{
                                backgroundColor: colores.hoverBg,
                                border: '1px solid ' + colores.borde,
                                padding: '16px',
                                borderRadius: '8px',
                                textAlign: 'center'
                            }}>
                                <p style={{ fontSize: '24px', fontWeight: 'bold', color: colores.primario }}>
                                    {estadisticas.total}
                                </p>
                                <p style={{ fontSize: '13px', color: colores.textoMuted }}>Total</p>
                            </div>
                            <div style={{
                                backgroundColor: colores.hoverBg,
                                border: '1px solid ' + colores.borde,
                                padding: '16px',
                                borderRadius: '8px',
                                textAlign: 'center'
                            }}>
                                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
                                    {estadisticas.pendientes}
                                </p>
                                <p style={{ fontSize: '13px', color: colores.textoMuted }}>Pendientes</p>
                            </div>
                            <div style={{
                                backgroundColor: colores.hoverBg,
                                border: '1px solid ' + colores.borde,
                                padding: '16px',
                                borderRadius: '8px',
                                textAlign: 'center'
                            }}>
                                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
                                    {estadisticas.abiertos}
                                </p>
                                <p style={{ fontSize: '13px', color: colores.textoMuted }}>Abiertos</p>
                            </div>
                            <div style={{
                                backgroundColor: colores.hoverBg,
                                border: '1px solid ' + colores.borde,
                                padding: '16px',
                                borderRadius: '8px',
                                textAlign: 'center'
                            }}>
                                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                                    {estadisticas.resueltos}
                                </p>
                                <p style={{ fontSize: '13px', color: colores.textoMuted }}>Resueltos</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* CONFIGURACIÓN */}
                {activeTab === 'configuracion' && (
                    <Configuracion 
                        agenciaId={agenciaInfo?.id || user?.agencia_id || 0} 
                        subdominio={subdominioAgencia}
                        temaUsuario={temaUsuario}
                        setTemaUsuario={(val) => {
                            setTemaUsuario(val);
                            localStorage.setItem(`theme_admin_${user?.id}`, val);
                        }}
                        onSave={loadAgenciaInfo}
                    />
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;