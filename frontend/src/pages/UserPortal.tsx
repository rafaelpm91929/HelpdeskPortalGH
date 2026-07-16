import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/axios.config';
import toast from 'react-hot-toast';
import { logout } from '../utils/logout';
import { IMAGE_BASE_URL, API_BASE_URL } from '../config';

// ============================================
// TIPOS
// ============================================
interface IArchivo {
    nombre: string;
    ruta: string;
    tamano: number;
    tipo: string;
}

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
    agente_nombre?: string;
    agente_apellido?: string;
    archivos?: IArchivo[];
    mensajes?: IMensaje[];
    usuario_nombre?: string;
    usuario_apellido?: string;
    usuario_email?: string;
    ultimo_mensaje_rol?: string;
}

interface IArea {
    id: number;
    nombre: string;
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
    bloqueada?: boolean;
    mensaje_bloqueo?: string;
    fecha_licencia?: string | null;
}

// ============================================
// PROPS
// ============================================
interface UserPortalProps {
    agenciaParam?: string;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const UserPortal: React.FC<UserPortalProps> = ({ agenciaParam }) => {
    const { user, refreshProfile } = useAuth();
    const [activeTab, setActiveTab] = useState<'bienvenida' | 'crear' | 'ver' | 'perfil'>(() => {
        return (localStorage.getItem(`active_tab_user_${user?.id}`) as any) || 'bienvenida';
    });

    useEffect(() => {
        if (user?.id) {
            localStorage.setItem(`active_tab_user_${user.id}`, activeTab);
        }
    }, [activeTab, user]);

    // ============================================
    // ESTADOS PRINCIPALES (Declarados al inicio para evitar errores de TDZ / inicialización)
    // ============================================
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [tickets, setTickets] = useState<ITicket[]>([]);
    const [areas, setAreas] = useState<IArea[]>([]);
    const [agenciaInfo, setAgenciaInfo] = useState<IAgenciaInfo | null>(null);
    const [selectedTicket, setSelectedTicket] = useState<ITicket | null>(null);
    const selectedTicketIdRef = useRef<number | null>(null);
    useEffect(() => {
        selectedTicketIdRef.current = selectedTicket ? selectedTicket.id : null;
    }, [selectedTicket]);
    const [showTicketDetail, setShowTicketDetail] = useState(false);
    const [replyMessage, setReplyMessage] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [archivoSeleccionado, setArchivoSeleccionado] = useState<IArchivo | null>(null);
    const [temaUsuario, setTemaUsuario] = useState<string>(() => localStorage.getItem(`theme_usuario_${user?.id}`) || 'agencia');
    const [filtroTexto, setFiltroTexto] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('todos');

    // ============================================
    // NOTIFICACIONES EN TIEMPO REAL PARA USUARIO
    // ============================================
    const [notificaciones, setNotificaciones] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifPermission, setNotifPermission] = useState<string>(() => 'Notification' in window ? Notification.permission : 'default');

    const handleEnableNotifications = () => {
        if ('Notification' in window) {
            if (Notification.permission === 'denied') {
                toast.error('⚠️ Las notificaciones están bloqueadas. Haz clic en el ícono del candado junto a la dirección web (URL) y activa "Notificaciones".', {
                    duration: 8000
                });
                return;
            }
            
            Notification.requestPermission().then(permission => {
                setNotifPermission(permission);
                if (permission === 'granted') {
                    toast.success('🔔 ¡Notificaciones de escritorio activadas!');
                    new Notification('Helpdesk Portal', {
                        body: '¡Las notificaciones de escritorio están activas para este equipo!',
                        icon: agenciaInfo?.logo_url || '/favicon.ico'
                    });
                }
            });
        }
    };

    const loadNotificaciones = async () => {
        if (!user?.id) return;
        try {
            const response = await api.get(`/notificaciones/usuario/${user.id}`);
            if (response.data.success) {
                const data = response.data.data;
                setNotificaciones(prev => {
                    if (prev.length > 0) {
                        data.forEach((n: any) => {
                            if (!prev.some(p => p.id === n.id)) {
                                if ('Notification' in window && Notification.permission === 'granted') {
                                    const nativeNotif = new Notification('🔔 Helpdesk Portal', {
                                        body: n.mensaje,
                                        icon: agenciaInfo?.logo_url || '/favicon.ico'
                                    });
                                    nativeNotif.onclick = () => {
                                        window.focus();
                                        handleNotificationClick(n);
                                    };
                                }
                            }
                        });
                    }
                    setUnreadCount(data.filter((n: any) => !n.leido).length);
                    return data;
                });
            }
        } catch (error) {
            console.error('Error al cargar notificaciones:', error);
        }
    };

    const marcarNotificacionLeida = async (id: number) => {
        try {
            await api.put(`/notificaciones/${id}/leer`);
            setNotificaciones(prev =>
                prev.map(n => n.id === id ? { ...n, leido: true } : n)
            );
            setUnreadCount(c => Math.max(0, c - 1));
        } catch (e) {
            console.error('Error al marcar leída:', e);
        }
    };

    const marcarTodasComoLeidas = async () => {
        if (!user?.id) return;
        try {
            await api.put(`/notificaciones/usuario/${user.id}/leer-todas`);
            setNotificaciones(prev => prev.map(n => ({ ...n, leido: true })));
            setUnreadCount(0);
            toast.success('Todas las notificaciones leídas');
        } catch (e) {
            console.error(e);
        }
    };

    const handleNotificationClick = async (n: any) => {
        await marcarNotificacionLeida(n.id);
        setShowNotifications(false);
        if (n.ticket_id) {
            setActiveTab('ver');
            loadTicketDetail(n.ticket_id);
        }
    };

    // Conexión en tiempo real SSE
    useEffect(() => {
        if (!user?.id) return;

        loadNotificaciones();

        const token = sessionStorage.getItem('token');
        const sseUrl = `${API_BASE_URL}/notificaciones/stream/${user.id}?token=${token}`;
        
        console.log('🔌 Conectando a notificaciones en tiempo real para usuario (SSE)...');
        let eventSource: EventSource | null = null;
        let fallbackInterval: ReturnType<typeof setInterval> | null = null;

        try {
            eventSource = new EventSource(sseUrl);
            eventSource.onopen = () => {
                console.log('🔌 Conexión SSE establecida para usuario.');
            };

            eventSource.onmessage = (event) => {
                try {
                    const newNotification = JSON.parse(event.data);
                    console.log('🔔 Nueva notificación recibida (SSE):', newNotification);
                    
                    setNotificaciones(prev => {
                        if (prev.some(n => n.id === newNotification.id)) return prev;

                        // Mostrar notificación nativa del sistema
                        if ('Notification' in window && Notification.permission === 'granted') {
                            const nativeNotif = new Notification('🔔 Helpdesk Portal', {
                                body: newNotification.mensaje,
                                icon: agenciaInfo?.logo_url || '/favicon.ico'
                            });
                            nativeNotif.onclick = () => {
                                window.focus();
                                handleNotificationClick(newNotification);
                            };
                        }

                        const updated = [newNotification, ...prev];
                        setUnreadCount(updated.filter(n => !n.leido).length);
                        return updated;
                    });

                    toast.success(newNotification.mensaje, {
                        duration: 6000,
                        icon: '🔔'
                    });

                    loadTickets();
                    refreshProfile().catch(() => {});
                    if (selectedTicketIdRef.current) {
                        loadTicketDetail(selectedTicketIdRef.current, true);
                    }
                } catch (err) {
                    console.error('Error al procesar notificación en tiempo real:', err);
                }
            };

            eventSource.onerror = (err) => {
                console.warn('⚠️ Conexión SSE falló para usuario. Activando fallback a polling...');
                if (eventSource) {
                    eventSource.close();
                    eventSource = null;
                }
                
                if (!fallbackInterval) {
                    fallbackInterval = setInterval(() => {
                        loadNotificaciones();
                        loadTickets();
                        refreshProfile().catch(() => {});
                        if (selectedTicketIdRef.current) {
                            loadTicketDetail(selectedTicketIdRef.current, true);
                        }
                    }, 10000);
                }
            };
        } catch (e) {
            console.error('Error al iniciar SSE para usuario:', e);
        }

        return () => {
            if (eventSource) eventSource.close();
            if (fallbackInterval) clearInterval(fallbackInterval);
        };
    }, [user?.id, agenciaInfo?.logo_url]);

    // 🔥 Solicitar permiso de notificaciones nativas en el arranque si es necesario
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                setNotifPermission(permission);
                if (permission === 'granted') {
                    console.log('🔔 Notificaciones de escritorio permitidas por el usuario.');
                }
            });
        }
    }, []);

    const defaultTema = (agenciaInfo?.colores_fondo || '').split('|')[1] || 'claro';
    const temaActivo = temaUsuario === 'agencia' ? defaultTema : temaUsuario;
    const isDarkMode = temaActivo === 'oscuro';

    // ============================================
    // COLORES DE LA AGENCIA (con fallbacks)
    // ============================================
    const colores = {
        primario: agenciaInfo?.colores_primario || '#2563eb',
        secundario: agenciaInfo?.colores_secundario || '#3b82f6',
        fondo: isDarkMode ? '#0f172a' : ((agenciaInfo?.colores_fondo || '').split('|')[0] || '#f3f4f6'),
        texto: isDarkMode ? '#f8fafc' : (agenciaInfo?.colores_texto || '#1f2937'),
        tarjeta: isDarkMode ? '#1e293b' : '#ffffff',
        borde: isDarkMode ? '#334155' : '#e5e7eb',
        inputBg: isDarkMode ? '#1e293b' : '#ffffff',
        inputText: isDarkMode ? '#ffffff' : '#1f2937',
        textoMuted: isDarkMode ? '#94a3b8' : '#6b7280',
        hoverBg: isDarkMode ? '#334155' : '#f9fafb'
    };

    // ============================================
    // FORMULARIO DE TICKET
    // ============================================
    const [formData, setFormData] = useState({
        asunto: '',
        tipo: 'problema',
        estado: 'abierto',
        prioridad: 'media',
        area: user?.area || '',
        descripcion: '',
        archivos: [] as File[]
    });

    // ============================================
    // FUNCIÓN PARA PARSEAR ARCHIVOS
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
    // CARGAR DATOS DE LA AGENCIA
    // ============================================
    useEffect(() => {
        const loadPortalData = async () => {
            let actualAgenciaId = user?.agencia_id;
            let infoResponse = null;

            if (agenciaParam) {
                const parsedId = parseInt(agenciaParam);
                if (!isNaN(parsedId)) {
                    actualAgenciaId = parsedId;
                    try {
                        console.log('📥 Cargando información de la agencia por ID:', actualAgenciaId);
                        infoResponse = await api.get(`/agencias/${actualAgenciaId}`);
                    } catch (error) {
                        console.error('Error loading agencia by ID:', error);
                    }
                } else {
                    // Es un subdominio!
                    try {
                        console.log('📥 Cargando información de la agencia por Subdominio:', agenciaParam);
                        infoResponse = await api.get(`/agencias/subdominio/${agenciaParam}`);
                    } catch (error) {
                        console.error('Error loading agencia by subdomain:', error);
                    }
                }
            } else if (actualAgenciaId) {
                try {
                    console.log('📥 Cargando información de la agencia del usuario:', actualAgenciaId);
                    infoResponse = await api.get(`/agencias/${actualAgenciaId}`);
                } catch (error) {
                    console.error('Error loading user agencia:', error);
                }
            }

            if (infoResponse && infoResponse.data.success) {
                const data = infoResponse.data.data;
                // 🔥 CORREGIDO: Construir URL completa del logo
                if (data.logo_url) {
                    if (data.logo_url.startsWith('http')) {
                        try {
                            const parsed = new URL(data.logo_url);
                            data.logo_url = `${IMAGE_BASE_URL}${parsed.pathname}`;
                        } catch {
                            data.logo_url = data.logo_url;
                        }
                    } else {
                        data.logo_url = `${IMAGE_BASE_URL}${data.logo_url}`;
                    }
                    console.log('🖼️ Logo URL:', data.logo_url);
                }
                setAgenciaInfo(data);
                actualAgenciaId = data.id;
                console.log('🏢 Agencia cargada:', data);
            }

            if (actualAgenciaId) {
                await loadAreas(actualAgenciaId);
            }
            await loadTickets();

            setTimeout(() => {
                setInitialLoading(false);
            }, 1200);
        };

        loadPortalData();

        if (user?.area) {
            setFormData(prev => ({ ...prev, area: user.area || '' }));
        }
    }, [user, agenciaParam]);

    useEffect(() => {
        if (agenciaInfo) {
            const [textoColor, tiposRaw] = (agenciaInfo.colores_texto || '').split('|');
            const tipos = tiposRaw ? tiposRaw.split(',') : ['problema', 'solicitud', 'consulta', 'queja', 'otro'];
            if (tipos.length > 0) {
                setFormData(prev => ({ ...prev, tipo: tipos[0] }));
            }
        }
    }, [agenciaInfo]);

    const loadAreas = async (agenciaId: number) => {
        try {
            const response = await api.get(`/areas/${agenciaId}`);
            if (response.data.success) {
                setAreas(response.data.data);
                console.log('📋 Áreas cargadas:', response.data.data);
            }
        } catch (error) {
            console.error('Error loading areas:', error);
        }
    };

    const loadTickets = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/tickets/usuario/${user?.id}`);
            if (response.data.success) {
                setTickets(response.data.data);
            }
        } catch (error: any) {
            console.error('Error al cargar tickets:', error);
            toast.error('Error al cargar tickets');
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // CARGAR DETALLE DEL TICKET CON MENSAJES
    // ============================================
    const loadTicketDetail = async (ticketId: number, silent = false) => {
        try {
            if (!silent) setLoading(true);
            const response = await api.get(`/tickets/${ticketId}/detalle`);
            if (response.data.success) {
                setSelectedTicket(response.data.data);
                setShowTicketDetail(true);
            }
        } catch (error: any) {
            console.error('Error al cargar detalle:', error);
            if (!silent) toast.error('Error al cargar detalle del ticket');
        } finally {
            if (!silent) setLoading(false);
        }
    };

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
            setEnviando(true);
            const response = await api.post(`/tickets/${selectedTicket.id}/responder`, {
                mensaje: replyMessage,
                usuario_id: user?.id,
                es_interno: false
            });

            if (response.data.success) {
                toast.success('✅ Respuesta enviada');
                setReplyMessage('');
                await loadTicketDetail(selectedTicket.id);
                loadTickets();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || '❌ Error al enviar respuesta');
        } finally {
            setEnviando(false);
        }
    };

    // ============================================
    // CREAR TICKET
    // ============================================
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user?.area || user.area.trim() === '' || user.area.toLowerCase() === 'sin area' || user.area.toLowerCase() === 'sin área') {
            toast.error('⚠️ No puedes enviar un ticket porque no tienes un área asignada en tu perfil.');
            return;
        }

        if (!formData.asunto || !formData.descripcion) {
            toast.error('Asunto y descripción son requeridos');
            return;
        }

        try {
            setLoading(true);

            const submitData = new FormData();
            submitData.append('asunto', formData.asunto);
            submitData.append('tipo', formData.tipo);
            submitData.append('estado', formData.estado);
            submitData.append('prioridad', formData.prioridad);
            submitData.append('area', formData.area);
            submitData.append('descripcion', formData.descripcion);
            submitData.append('usuario_id', String(user?.id));
            submitData.append('agencia_id', String(user?.agencia_id));

            formData.archivos.forEach((file) => {
                submitData.append('archivos', file);
            });

            const response = await api.post('/tickets', submitData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                toast.success('✅ Ticket creado exitosamente');
                setFormData({
                    asunto: '',
                    tipo: 'problema',
                    estado: 'abierto',
                    prioridad: 'media',
                    area: user?.area || '',
                    descripcion: '',
                    archivos: []
                });
                loadTickets();
                setActiveTab('ver');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || '❌ Error al crear ticket');
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // SUBIR ARCHIVOS
    // ============================================
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const fileArray = Array.from(files);

        const invalidFiles = fileArray.filter(f => f.size > 10 * 1024 * 1024);
        if (invalidFiles.length > 0) {
            toast.error('⚠️ Algunos archivos superan los 10MB');
            return;
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
        const invalidTypes = fileArray.filter(f => !allowedTypes.includes(f.type));
        if (invalidTypes.length > 0) {
            toast.error('⚠️ Solo se permiten PDF e imágenes');
            return;
        }

        setFormData({ ...formData, archivos: [...formData.archivos, ...fileArray] });
    };

    const removeFile = (index: number) => {
        const newFiles = [...formData.archivos];
        newFiles.splice(index, 1);
        setFormData({ ...formData, archivos: newFiles });
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
                        Iniciando portal de ayuda...
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

    if (agenciaInfo?.bloqueada) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colores.fondo || '#f3f4f6',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                color: colores.texto || '#1f2937',
                padding: '20px'
            }}>
                <div style={{
                    maxWidth: '500px',
                    width: '90%',
                    padding: '40px 32px',
                    backgroundColor: colores.tarjeta || 'white',
                    borderRadius: '16px',
                    border: `1px solid ${colores.borde || '#e5e7eb'}`,
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)',
                    textAlign: 'center'
                }}>
                    {agenciaInfo.logo_url ? (
                        <div style={{
                            width: '150px',
                            height: '60px',
                            margin: '0 auto 20px auto',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <img src={agenciaInfo.logo_url} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        </div>
                    ) : (
                        <div style={{ fontSize: '50px', marginBottom: '20px' }}>🔧</div>
                    )}
                    <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '16px', color: colores.primario || '#2563eb' }}>
                        Portal en revisión
                    </h2>
                    <p style={{ color: colores.textoMuted || '#6b7280', fontSize: '15px', lineHeight: '1.6', marginBottom: '28px' }}>
                        Este portal de ayuda se encuentra actualmente en revisión o mantenimiento técnico. Por favor, intenta acceder más tarde.
                    </p>
                    <button
                        onClick={() => logout()}
                        style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: colores.primario || '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            boxShadow: `0 4px 12px rgba(37, 99, 235, 0.15)`,
                            transition: 'all 0.2s'
                        }}
                    >
                        Cerrar sesión
                    </button>
                </div>
            </div>
        );
    }

    const userArea = user?.area || 'Sin área asignada';
    const areaLabel = areas.find(a => a.nombre === userArea)?.nombre || userArea;

    // ============================================
    // RENDER DETALLE DEL TICKET
    // ============================================
    const renderTicketDetail = () => {
        if (!selectedTicket) return null;

        const mensajes = selectedTicket.mensajes || [];
        const mensajesOrdenados = [...mensajes].sort((a, b) =>
            new Date(a.fecha_creacion).getTime() - new Date(b.fecha_creacion).getTime()
        );

        const usuarioNombre = selectedTicket.usuario_nombre || user?.nombre || 'Usuario';
        const usuarioApellido = selectedTicket.usuario_apellido || user?.apellido || '';

        return (
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
                    backgroundColor: colores.tarjeta,
                    color: colores.texto,
                    padding: '32px',
                    borderRadius: '12px',
                    maxWidth: '750px',
                    width: '90%',
                    maxHeight: '85vh',
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid ' + colores.borde
                }}>
                    {/* Header */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                        marginBottom: '16px',
                        paddingBottom: '12px',
                        borderBottom: '1px solid ' + colores.borde
                    }}>
                        <div>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                #{selectedTicket.numero_secuencial || selectedTicket.id} - {selectedTicket.asunto}
                            </h3>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                                <span style={{
                                    padding: '2px 10px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    backgroundColor:
                                        (selectedTicket.estado === 'resuelto' || selectedTicket.estado === 'cerrado') ? (isDarkMode ? '#334155' : '#f3f4f6') :
                                        selectedTicket.estado === 'abierto' ? '#dbeafe' : 
                                        selectedTicket.estado === 'pendiente' ? '#fef3c7' : '#f3f4f6',
                                    color:
                                        (selectedTicket.estado === 'resuelto' || selectedTicket.estado === 'cerrado') ? (isDarkMode ? '#94a3b8' : '#4b5563') :
                                        selectedTicket.estado === 'abierto' ? '#1e40af' : 
                                        selectedTicket.estado === 'pendiente' ? '#92400e' : '#374151'
                                }}>
                                    {selectedTicket.estado}
                                </span>
                                <span style={{
                                    padding: '2px 10px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    backgroundColor: '#f3f4f6',
                                    color: '#374151'
                                }}>
                                    Prioridad: {selectedTicket.prioridad}
                                </span>
                                <span style={{
                                    padding: '2px 10px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    backgroundColor: '#f3f4f6',
                                    color: '#374151'
                                }}>
                                    {selectedTicket.area || 'Sin área'}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setShowTicketDetail(false);
                                setSelectedTicket(null);
                                setArchivoSeleccionado(null);
                            }}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '24px',
                                cursor: 'pointer',
                                color: '#6b7280'
                            }}
                        >
                            ×
                        </button>
                    </div>

                    {/* Contenido */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        paddingRight: '8px'
                    }}>
                        {/* Mensaje inicial */}
                        <div style={{
                            backgroundColor: isDarkMode ? '#334155' : '#f3f4f6',
                            color: colores.texto,
                            padding: '12px 16px',
                            borderRadius: '8px',
                            marginBottom: '12px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <strong style={{ fontSize: '14px' }}>
                                    {usuarioNombre} {usuarioApellido}
                                </strong>
                                <span style={{ fontSize: '11px', color: '#6b7280' }}>
                                    {new Date(selectedTicket.fecha_creacion).toLocaleString()}
                                </span>
                            </div>
                            <p style={{ fontSize: '14px', whiteSpace: 'pre-wrap', margin: 0 }}>
                                {selectedTicket.descripcion}
                            </p>
                            {(() => {
                                const archivos = parseArchivos(selectedTicket.archivos);
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
                                                        color: colores.primario,
                                                        fontSize: '12px',
                                                        transition: 'all 0.2s'
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

                        {/* Mensajes de conversación */}
                        {mensajesOrdenados.map((mensaje) => (
                            <div
                                key={mensaje.id}
                                style={{
                                    padding: '10px 14px',
                                    borderRadius: '8px',
                                    marginBottom: '8px',
                                    backgroundColor: ['admin', 'superadmin', 'agente'].includes(mensaje.usuario_rol)
                                        ? `${colores.primario}25`
                                        : (isDarkMode ? '#334155' : '#f3f4f6'),
                                    color: colores.texto,
                                    borderLeft: ['admin', 'superadmin', 'agente'].includes(mensaje.usuario_rol)
                                        ? `4px solid ${colores.primario}`
                                        : `4px solid ${colores.textoMuted}`
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <strong style={{ fontSize: '13px' }}>
                                        {mensaje.usuario_nombre} {mensaje.usuario_apellido}
                                        {['admin', 'superadmin', 'agente'].includes(mensaje.usuario_rol) && (
                                            <span style={{
                                                fontSize: '11px',
                                                backgroundColor: colores.primario,
                                                color: 'white',
                                                padding: '1px 8px',
                                                borderRadius: '4px',
                                                marginLeft: '8px'
                                            }}>
                                                {mensaje.usuario_rol === 'superadmin' ? 'SuperAdmin' : mensaje.usuario_rol === 'admin' ? 'Admin' : 'Soporte'}
                                            </span>
                                        )}
                                    </strong>
                                    <span style={{ fontSize: '11px', color: '#6b7280' }}>
                                        {new Date(mensaje.fecha_creacion).toLocaleString()}
                                    </span>
                                </div>
                                <p style={{ fontSize: '14px', whiteSpace: 'pre-wrap', margin: 0 }}>
                                    {mensaje.contenido}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Campo de respuesta / Reabrir Ticket */}
                    <div style={{
                        borderTop: '1px solid ' + colores.borde,
                        paddingTop: '16px',
                        marginTop: '12px'
                    }}>
                        {(selectedTicket.estado === 'resuelto' || selectedTicket.estado === 'cerrado') ? (
                            <div style={{
                                backgroundColor: colores.hoverBg,
                                border: '1px solid ' + colores.borde,
                                borderRadius: '8px',
                                padding: '16px',
                                textAlign: 'center'
                            }}>
                                <p style={{ fontSize: '14px', color: colores.textoMuted, marginBottom: '12px' }}>
                                    Este ticket se encuentra en estado <strong>{selectedTicket.estado === 'resuelto' ? 'Resuelto' : 'Cerrado'}</strong>. Para poder agregar un comentario o respuesta, necesitas reabrirlo.
                                </p>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        try {
                                            setEnviando(true);
                                            const response = await api.put(`/tickets/${selectedTicket.id}/estado`, {
                                                estado: 'abierto'
                                            });
                                            if (response.data.success) {
                                                toast.success('🔓 Ticket reabierto correctamente');
                                                // Reload ticket detail
                                                const detailRes = await api.get(`/tickets/${selectedTicket.id}/detalle`);
                                                if (detailRes.data.success) {
                                                    setSelectedTicket(detailRes.data.data);
                                                }
                                                // Reload list
                                                loadTickets();
                                            }
                                        } catch (err) {
                                            toast.error('Error al reabrir el ticket');
                                        } finally {
                                            setEnviando(false);
                                        }
                                    }}
                                    style={{
                                        padding: '8px 20px',
                                        backgroundColor: colores.primario,
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '500'
                                    }}
                                >
                                    🔓 Reabrir Ticket
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <textarea
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    style={{
                                        flex: 1,
                                        padding: '10px 12px',
                                        border: '1px solid ' + colores.borde,
                                        borderRadius: '6px',
                                        outline: 'none',
                                        minHeight: '60px',
                                        resize: 'vertical',
                                        fontSize: '14px',
                                        backgroundColor: colores.inputBg,
                                        color: colores.inputText
                                    }}
                                    placeholder="Escribe tu respuesta..."
                                />
                                <button
                                    onClick={enviarRespuesta}
                                    disabled={enviando}
                                    style={{
                                        padding: '8px 20px',
                                        backgroundColor: colores.primario,
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        opacity: enviando ? 0.5 : 1,
                                        alignSelf: 'flex-end'
                                    }}
                                >
                                    {enviando ? 'Enviando...' : 'Enviar'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: colores.fondo,
            display: 'flex',
            flexDirection: 'column',
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
                
                .dark-card-bg {
                    background-color: ${colores.tarjeta} !important;
                    color: ${colores.texto} !important;
                    border: 1px solid ${colores.borde} !important;
                }
            `}</style>
            {/* ============================================
            HEADER / NAVBAR - CON COLORES Y LOGO
            ============================================ */}
            <nav style={{
                backgroundColor: colores.primario,
                padding: '12px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {agenciaInfo?.logo_url ? (
                        <img
                            src={agenciaInfo.logo_url}
                            alt={agenciaInfo?.nombre || 'Logo'}
                            style={{ height: '35px', objectFit: 'contain' }}
                            onError={(e) => {
                                console.error('❌ Error cargando logo:', agenciaInfo?.logo_url);
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                    const icon = document.createElement('span');
                                    icon.textContent = '🏢';
                                    icon.style.fontSize = '24px';
                                    parent.insertBefore(icon, e.currentTarget);
                                }
                            }}
                        />
                    ) : (
                        <span style={{ fontSize: '24px' }}>🏢</span>
                    )}
                    <span style={{ fontWeight: 'bold', fontSize: '18px' }}>
                        {agenciaInfo?.nombre || 'Portal de Ayuda'}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* 🔥 BOTÓN PARA ACTIVAR ALERTA DE ESCRITORIO */}
                    {('Notification' in window && notifPermission !== 'granted') && (
                        <button
                            onClick={handleEnableNotifications}
                            style={{
                                backgroundColor: notifPermission === 'denied' ? '#ef4444' : '#10b981',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            {notifPermission === 'denied' ? '⚠️ Desbloquear Alertas' : '🔔 Activar Alertas'}
                        </button>
                    )}

                    {/* 🔥 CAMPANA DE NOTIFICACIONES */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '18px',
                                padding: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                position: 'relative',
                                outline: 'none'
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                            </svg>
                            {unreadCount > 0 && (
                                <span style={{
                                    position: 'absolute',
                                    top: '0px',
                                    right: '0px',
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    borderRadius: '50%',
                                    padding: '1px 5px',
                                    fontSize: '9px',
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
                                        backgroundColor: isDarkMode ? '#0f172a' : '#f9fafb'
                                    }}>
                                        <span style={{ fontWeight: '600', fontSize: '13px', color: isDarkMode ? '#f8fafc' : '#1f2937' }}>Notificaciones</span>
                                        {unreadCount > 0 && (
                                            <button 
                                                onClick={marcarTodasComoLeidas}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: colores.primario,
                                                    fontSize: '11px',
                                                    cursor: 'pointer',
                                                    fontWeight: '500',
                                                    padding: 0
                                                }}
                                            >
                                                Marcar todo leído
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                                        {notificaciones.length === 0 ? (
                                            <div style={{ padding: '20px', textAlign: 'center', color: colores.textoMuted, fontSize: '12px' }}>
                                                No tienes notificaciones
                                            </div>
                                        ) : (
                                            notificaciones.map((notif) => (
                                                <div 
                                                    key={notif.id}
                                                    onClick={() => handleNotificationClick(notif)}
                                                    style={{
                                                        padding: '10px 16px',
                                                        borderBottom: '1px solid ' + colores.borde,
                                                        cursor: 'pointer',
                                                        backgroundColor: notif.leido ? 'transparent' : (isDarkMode ? '#1e293b80' : '#3b82f608'),
                                                        transition: 'background-color 0.2s',
                                                        display: 'flex',
                                                        gap: '8px',
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
                                                        width: '6px',
                                                        height: '6px',
                                                        borderRadius: '50%',
                                                        backgroundColor: notif.leido ? 'transparent' : colores.primario,
                                                        flexShrink: 0
                                                    }} />
                                                    <div style={{ flex: 1 }}>
                                                        <p style={{ 
                                                            margin: 0, 
                                                            fontSize: '12px', 
                                                            color: isDarkMode ? '#f8fafc' : '#1f2937',
                                                            lineHeight: 1.4,
                                                            fontWeight: notif.leido ? '400' : '500',
                                                            textAlign: 'left'
                                                        }}>
                                                            {notif.mensaje}
                                                        </p>
                                                        <span style={{ fontSize: '10px', color: colores.textoMuted, marginTop: '2px', display: 'block', textAlign: 'left' }}>
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

                    <span style={{ fontSize: '14px' }}>
                        {user.nombre} {user.apellido}
                    </span>
                    <button
                        onClick={() => logout()}
                        style={{
                            padding: '6px 16px',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            borderRadius: '4px',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '13px'
                        }}
                    >
                        Cerrar sesión
                    </button>
                </div>
            </nav>

            {/* ============================================
            TABS CON COLOR PRIMARIO
            ============================================ */}
            <div style={{
                backgroundColor: colores.tarjeta,
                padding: '0 24px',
                display: 'flex',
                gap: '0',
                borderBottom: `2px solid ${colores.primario}`,
                marginBottom: '24px'
            }}>
                {[
                    { id: 'bienvenida', icon: '🏠', label: 'Inicio' },
                    { id: 'crear', icon: '📝', label: 'Nuevo Ticket' },
                    { id: 'ver', icon: '📋', label: 'Mis Tickets' },
                    { id: 'perfil', icon: '👤', label: 'Mi Perfil' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        style={{
                            padding: '14px 20px',
                            border: 'none',
                            borderBottom: activeTab === tab.id ? `3px solid ${colores.primario}` : '3px solid transparent',
                            backgroundColor: 'transparent',
                            color: activeTab === tab.id ? colores.primario : colores.textoMuted,
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: activeTab === tab.id ? '600' : '400',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* ============================================
            CONTENIDO PRINCIPAL
            ============================================ */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 24px', width: '100%', flex: 1 }}>

                {/* TAB: BIENVENIDA */}
                {activeTab === 'bienvenida' && (
                    <div style={{
                        backgroundColor: colores.tarjeta,
                        borderRadius: '12px',
                        padding: '40px 32px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
                        border: '1px solid ' + colores.borde,
                        textAlign: 'center',
                        maxWidth: '800px',
                        margin: '0 auto'
                    }}>
                        <span style={{ fontSize: '64px', display: 'block', marginBottom: '16px' }}>👋</span>
                        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colores.texto, marginBottom: '8px' }}>
                            ¡Hola, {user?.nombre}!
                        </h2>
                        <p style={{ color: colores.textoMuted, fontSize: '16px', marginBottom: '32px' }}>
                            Bienvenido al portal de soporte técnico de <strong>{agenciaInfo?.nombre || 'la Agencia'}</strong>. ¿En qué podemos ayudarte hoy?
                        </p>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                            gap: '24px',
                            justifyContent: 'center'
                        }}>
                            {/* Option 1: Crear Ticket */}
                            <div 
                                onClick={() => setActiveTab('crear')}
                                style={{
                                    backgroundColor: colores.hoverBg,
                                    borderRadius: '12px',
                                    padding: '32px 24px',
                                    cursor: 'pointer',
                                    border: '1px solid ' + colores.borde,
                                    transition: 'all 0.2s ease-in-out',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '16px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
                                    e.currentTarget.style.borderColor = colores.primario;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                    e.currentTarget.style.borderColor = colores.borde;
                                }}
                            >
                                <span style={{ fontSize: '48px' }}>🎫</span>
                                <div>
                                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: colores.texto, marginBottom: '8px' }}>
                                        Crear Nuevo Ticket
                                    </h3>
                                    <p style={{ fontSize: '14px', color: colores.textoMuted, lineHeight: '1.5' }}>
                                        Reporta una incidencia o solicita soporte técnico especializado.
                                    </p>
                                </div>
                            </div>

                            {/* Option 2: Ver Tickets */}
                            <div 
                                onClick={() => setActiveTab('ver')}
                                style={{
                                    backgroundColor: colores.hoverBg,
                                    borderRadius: '12px',
                                    padding: '32px 24px',
                                    cursor: 'pointer',
                                    border: '1px solid ' + colores.borde,
                                    transition: 'all 0.2s ease-in-out',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '16px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
                                    e.currentTarget.style.borderColor = colores.secundario;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                    e.currentTarget.style.borderColor = colores.borde;
                                }}
                            >
                                <span style={{ fontSize: '48px' }}>📋</span>
                                <div>
                                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: colores.texto, marginBottom: '8px' }}>
                                        Ver mis Tickets
                                    </h3>
                                    <p style={{ fontSize: '14px', color: colores.textoMuted, lineHeight: '1.5' }}>
                                        Consulta el estado y da seguimiento a tus tickets existentes.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: CREAR TICKET */}
                {activeTab === 'crear' && (
                    <div style={{
                        backgroundColor: colores.tarjeta,
                        borderRadius: '8px',
                        padding: '24px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        border: '1px solid ' + colores.borde
                    }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>
                            📝 Nuevo Ticket
                        </h2>
                        <p style={{ color: '#6b7280', marginBottom: '20px' }}>
                            Completa los campos para crear un nuevo ticket de soporte.
                        </p>

                        {(!user?.area || user.area.trim() === '' || user.area.toLowerCase() === 'sin area' || user.area.toLowerCase() === 'sin área') ? (
                            <div style={{
                                backgroundColor: '#fef2f2',
                                border: '1px solid #fee2e2',
                                borderRadius: '12px',
                                padding: '24px',
                                textAlign: 'center',
                                marginTop: '10px'
                            }}>
                                <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>⚠️</span>
                                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#991b1b', marginBottom: '8px' }}>
                                    Área No Asignada
                                </h3>
                                <p style={{ fontSize: '14px', color: '#7f1d1d', lineHeight: '1.5', maxWidth: '400px', margin: '0 auto 20px auto' }}>
                                    No tienes un área asignada en tu perfil de usuario. Para poder enviar tickets de soporte, es obligatorio pertenecer a un área o departamento.
                                </p>
                                <div style={{
                                    fontSize: '13px',
                                    color: '#b91c1c',
                                    fontWeight: '500',
                                    backgroundColor: '#fff',
                                    padding: '12px',
                                    borderRadius: '6px',
                                    border: '1px dashed #fca5a5',
                                    display: 'inline-block'
                                }}>
                                    Por favor contacta a tu Administrador para asignar tu área.
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                {/* Asunto */}
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                                        Asunto *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.asunto}
                                        onChange={(e) => setFormData({ ...formData, asunto: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            outline: 'none',
                                            fontSize: '14px'
                                        }}
                                        placeholder="Breve descripción del problema"
                                    />
                                </div>

                                {/* Tipo */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                                        Tipo *
                                    </label>
                                    <select
                                        required
                                        value={formData.tipo}
                                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            border: '1px solid ' + colores.borde,
                                            borderRadius: '6px',
                                            outline: 'none',
                                            fontSize: '14px',
                                            backgroundColor: colores.inputBg,
                                            color: colores.inputText
                                        }}
                                    >
                                        {(() => {
                                            const [textoColor, tiposRaw] = (agenciaInfo?.colores_texto || '').split('|');
                                            const tiposDisponibles = tiposRaw ? tiposRaw.split(',') : ['problema', 'solicitud', 'consulta', 'queja', 'otro'];
                                            return tiposDisponibles.map((tipo) => (
                                                <option key={tipo} value={tipo}>
                                                    {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                                                </option>
                                            ));
                                        })()}
                                    </select>
                                </div>

                                {/* Prioridad */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                                        Prioridad *
                                    </label>
                                    <select
                                        required
                                        value={formData.prioridad}
                                        onChange={(e) => setFormData({ ...formData, prioridad: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            outline: 'none',
                                            fontSize: '14px',
                                            backgroundColor: 'white'
                                        }}
                                    >
                                        <option value="baja">Baja</option>
                                        <option value="media">Media</option>
                                        <option value="alta">Alta</option>
                                        <option value="critica">Crítica</option>
                                    </select>
                                </div>

                                {/* Área - SOLO LECTURA */}
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                                        Área (asignada por el administrador)
                                    </label>
                                    <input
                                        type="text"
                                        disabled
                                        value={areaLabel}
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            backgroundColor: '#f3f4f6',
                                            fontSize: '14px',
                                            color: '#374151',
                                            cursor: 'not-allowed'
                                        }}
                                    />
                                    {!user?.area && (
                                        <p style={{ fontSize: '12px', color: '#f59e0b', marginTop: '4px' }}>
                                            ⚠️ No tienes un área asignada. Contacta al administrador.
                                        </p>
                                    )}
                                </div>

                                {/* Descripción */}
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                                        Descripción *
                                    </label>
                                    <textarea
                                        required
                                        value={formData.descripcion}
                                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            outline: 'none',
                                            minHeight: '120px',
                                            fontSize: '14px',
                                            resize: 'vertical'
                                        }}
                                        placeholder="Describe detalladamente el problema..."
                                    />
                                </div>

                                {/* Archivos adjuntos */}
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                                        Archivos adjuntos (PDF, imágenes - máximo 10MB por archivo)
                                    </label>
                                    <input
                                        type="file"
                                        multiple
                                        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                                        onChange={handleFileUpload}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            outline: 'none'
                                        }}
                                    />
                                    {formData.archivos.length > 0 && (
                                        <div style={{ marginTop: '8px' }}>
                                            {formData.archivos.map((file, index) => (
                                                <div key={index} style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    padding: '6px 12px',
                                                    backgroundColor: '#f3f4f6',
                                                    borderRadius: '4px',
                                                    marginBottom: '4px'
                                                }}>
                                                    <span style={{ fontSize: '13px' }}>
                                                        📎 {file.name} ({(file.size / 1024).toFixed(1)} KB)
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFile(index)}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            color: '#dc2626',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        ❌
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Botones */}
                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                marginTop: '24px',
                                paddingTop: '16px',
                                borderTop: '1px solid #e5e7eb'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormData({
                                            asunto: '',
                                            tipo: 'problema',
                                            estado: 'abierto',
                                            prioridad: 'media',
                                            area: user?.area || '',
                                            descripcion: '',
                                            archivos: []
                                        });
                                    }}
                                    style={{
                                        padding: '10px 24px',
                                        backgroundColor: '#e5e7eb',
                                        color: '#374151',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        padding: '10px 32px',
                                        backgroundColor: colores.primario,
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        opacity: loading ? 0.5 : 1
                                    }}
                                >
                                    {loading ? 'Creando...' : 'Crear Ticket'}
                                </button>
                            </div>
                        </form>
                        )}
                    </div>
                )}

                {/* TAB: VER TICKETS */}
                {activeTab === 'ver' && (
                    <div style={{
                        backgroundColor: colores.tarjeta,
                        borderRadius: '8px',
                        padding: '24px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        border: '1px solid ' + colores.borde
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '16px'
                        }}>
                            <div>
                                <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>
                                    📋 Mis Tickets
                                </h2>
                                <p style={{ color: colores.textoMuted, fontSize: '14px' }}>
                                    {(() => {
                                        const search = filtroTexto.toLowerCase();
                                        const filtered = tickets.filter(ticket => {
                                            const matchesTexto = 
                                                (ticket.numero_secuencial?.toString() || '').includes(search) ||
                                                ticket.id.toString().includes(search) ||
                                                (ticket.asunto || '').toLowerCase().includes(search);
                                            const matchesEstado = filtroEstado === 'todos' || ticket.estado === filtroEstado;
                                            return matchesTexto && matchesEstado;
                                        });
                                        return filtered.length;
                                    })()} tickets encontrados
                                </p>
                            </div>
                            <button
                                onClick={loadTickets}
                                style={{
                                    padding: '6px 16px',
                                    backgroundColor: isDarkMode ? '#334155' : '#e5e7eb',
                                    color: colores.texto,
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '13px'
                                }}
                            >
                                🔄 Recargar
                            </button>
                        </div>

                        {/* Filtros de búsqueda */}
                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            marginBottom: '20px',
                            flexWrap: 'wrap',
                            alignItems: 'center'
                        }}>
                            <input
                                type="text"
                                placeholder="🔍 Buscar por número o asunto..."
                                value={filtroTexto}
                                onChange={(e) => setFiltroTexto(e.target.value)}
                                style={{
                                    flex: 1,
                                    minWidth: '200px',
                                    padding: '8px 12px',
                                    border: '1px solid ' + colores.borde,
                                    borderRadius: '6px',
                                    outline: 'none',
                                    backgroundColor: colores.inputBg,
                                    color: colores.inputText
                                }}
                            />
                            <select
                                value={filtroEstado}
                                onChange={(e) => setFiltroEstado(e.target.value)}
                                style={{
                                    padding: '8px 12px',
                                    border: '1px solid ' + colores.borde,
                                    borderRadius: '6px',
                                    outline: 'none',
                                    backgroundColor: colores.inputBg,
                                    color: colores.inputText
                                }}
                            >
                                <option value="todos">Todos los estados</option>
                                <option value="abierto">Abierto</option>
                                <option value="pendiente">Pendiente</option>
                                <option value="resuelto">Resuelto</option>
                                <option value="cerrado">Cerrado</option>
                            </select>
                        </div>

                        {loading ? (
                            <p style={{ color: colores.texto }}>Cargando...</p>
                        ) : tickets.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: colores.textoMuted }}>
                                No tienes tickets aún. Crea tu primer ticket.
                            </div>
                        ) : (
                            <div>
                                {(() => {
                                    const search = filtroTexto.toLowerCase();
                                    const filtered = tickets.filter(ticket => {
                                        const matchesTexto = 
                                            (ticket.numero_secuencial?.toString() || '').includes(search) ||
                                            ticket.id.toString().includes(search) ||
                                            (ticket.asunto || '').toLowerCase().includes(search);
                                        const matchesEstado = filtroEstado === 'todos' || ticket.estado === filtroEstado;
                                        return matchesTexto && matchesEstado;
                                    });
                                    
                                    if (filtered.length === 0) {
                                        return (
                                            <div style={{ textAlign: 'center', padding: '40px', color: colores.textoMuted }}>
                                                No se encontraron tickets con los filtros aplicados.
                                            </div>
                                        );
                                    }
                                    
                                    return filtered.map((ticket) => {
                                        const isResolvedOrClosed = ticket.estado === 'resuelto' || ticket.estado === 'cerrado';
                                        return (
                                            <div
                                                key={ticket.id}
                                                onClick={() => loadTicketDetail(ticket.id)}
                                                style={{
                                                    padding: '16px',
                                                    borderBottom: '1px solid ' + colores.borde,
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    transition: 'background 0.2s',
                                                    borderRadius: '4px',
                                                    opacity: isResolvedOrClosed ? 0.6 : 1,
                                                    backgroundColor: isResolvedOrClosed ? (isDarkMode ? '#1e293b' : '#f9fafb') : 'transparent'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!isResolvedOrClosed) {
                                                        e.currentTarget.style.backgroundColor = colores.hoverBg;
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!isResolvedOrClosed) {
                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                    }
                                                }}
                                            >
                                                <div>
                                                    <div style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        #{ticket.numero_secuencial || ticket.id} - {ticket.asunto || 'Sin asunto'}
                                                        {(ticket.ultimo_mensaje_rol === 'admin' || ticket.ultimo_mensaje_rol === 'superadmin') && (
                                                            <span style={{
                                                                backgroundColor: '#10b981',
                                                                color: '#ffffff',
                                                                fontSize: '11px',
                                                                padding: '2px 8px',
                                                                borderRadius: '4px',
                                                                fontWeight: 'bold',
                                                                display: 'inline-block'
                                                            }}>
                                                                Respuesta de Soporte
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: '13px', color: colores.textoMuted }}>
                                                        {ticket.tipo || 'General'} • {ticket.area || 'Sin área'} • {new Date(ticket.fecha_creacion).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <span style={{
                                                        padding: '4px 12px',
                                                        borderRadius: '4px',
                                                        fontSize: '12px',
                                                        fontWeight: '500',
                                                        backgroundColor:
                                                            isResolvedOrClosed ? (isDarkMode ? '#334155' : '#f3f4f6') :
                                                            ticket.estado === 'abierto' ? '#dbeafe' :
                                                                ticket.estado === 'pendiente' ? '#fef3c7' :
                                                                    ticket.estado === 'resuelto' ? '#d1fae5' :
                                                                        '#f3f4f6',
                                                        color:
                                                            isResolvedOrClosed ? (isDarkMode ? '#94a3b8' : '#4b5563') :
                                                            ticket.estado === 'abierto' ? '#1e40af' :
                                                                ticket.estado === 'pendiente' ? '#92400e' :
                                                                    ticket.estado === 'resuelto' ? '#065f46' :
                                                                        '#374151'
                                                    }}>
                                                        {ticket.estado || 'Sin estado'}
                                                    </span>
                                                    <span style={{ fontSize: '20px', color: colores.textoMuted }}>›</span>
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB: PERFIL */}
                {activeTab === 'perfil' && (
                    <div style={{
                        backgroundColor: colores.tarjeta,
                        borderRadius: '8px',
                        padding: '24px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        border: '1px solid ' + colores.borde
                    }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: colores.texto, marginBottom: '4px' }}>
                            👤 Mi Perfil
                        </h2>
                        <p style={{ color: colores.textoMuted, marginBottom: '20px' }}>
                            Información de tu cuenta y preferencias del portal.
                        </p>

                        <div style={{
                            backgroundColor: colores.hoverBg,
                            padding: '24px',
                            borderRadius: '8px',
                            border: '1px solid ' + colores.borde
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                marginBottom: '16px'
                            }}>
                                <div style={{
                                    width: '72px',
                                    height: '72px',
                                    borderRadius: '50%',
                                    backgroundColor: colores.primario,
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '28px',
                                    fontWeight: 'bold'
                                }}>
                                    {user.nombre?.charAt(0)}{user.apellido?.charAt(0)}
                                </div>
                                <div>
                                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: colores.texto }}>
                                        {user.nombre} {user.apellido}
                                    </div>
                                    <div style={{ color: colores.textoMuted }}>{user.email}</div>
                                </div>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '16px',
                                marginTop: '16px'
                            }}>
                                <div>
                                    <label style={{ fontSize: '13px', color: colores.textoMuted }}>Rol</label>
                                    <p style={{ fontWeight: '500', color: colores.texto }}>{user.rol}</p>
                                </div>
                                <div>
                                    <label style={{ fontSize: '13px', color: colores.textoMuted }}>Agencia</label>
                                    <p style={{ fontWeight: '500', color: colores.texto }}>{agenciaInfo?.nombre || 'Sin agencia'}</p>
                                </div>
                                <div>
                                    <label style={{ fontSize: '13px', color: colores.textoMuted }}>Área</label>
                                    <p style={{ fontWeight: '500', color: colores.texto }}>{areaLabel}</p>
                                </div>
                            </div>

                            <div style={{ marginTop: '24px', borderTop: '1px solid ' + colores.borde, paddingTop: '16px' }}>
                                <label style={{ fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '8px', color: colores.texto }}>
                                    🌓 Tema del Portal
                                </label>
                                <select
                                    value={temaUsuario}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setTemaUsuario(val);
                                        localStorage.setItem(`theme_usuario_${user?.id}`, val);
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid ' + colores.borde,
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        backgroundColor: colores.inputBg,
                                        color: colores.inputText,
                                        outline: 'none'
                                    }}
                                >
                                    <option value="agencia">Por defecto de la Agencia ({defaultTema === 'oscuro' ? 'Oscuro' : 'Claro'})</option>
                                    <option value="claro">☀️ Claro</option>
                                    <option value="oscuro">🌙 Oscuro</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: MANUALES ELIMINADO */}
            </div>

            {/* MODAL DETALLE DE TICKET */}
            {showTicketDetail && renderTicketDetail()}

            {/* MODAL PARA VER IMAGEN COMPLETA */}
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

export default UserPortal;