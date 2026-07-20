import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/axios.config';
import toast from 'react-hot-toast';
import { logout } from '../utils/logout';
import { PUBLIC_IP, FRONTEND_BASE_URL, IMAGE_BASE_URL } from '../config';
import { SuperAdminStats } from '../components/SuperAdminStats';

// ============================================
// TIPOS
// ============================================
interface IAgencia {
    id: number;
    nombre: string;
    subdominio: string;
    logo_url: string | null;
    colores_primario: string;
    colores_secundario: string;
    activo: boolean;
    fecha_creacion: string;
    bloqueada?: boolean;
    mensaje_bloqueo?: string;
    fecha_licencia?: string | null;
    usuarios_activos?: {
        id: number;
        nombre: string;
        apellido: string;
        email: string;
        rol: string;
    }[];
    total_usuarios?: number;
    admin_info?: string | null;
}

interface IUsuario {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    rol: string;
    agencia_id: number;
    activo: boolean;
    fecha_creacion: string;
}

interface AgenciaCardProps {
    agencia: IAgencia;
    openAgenciaInfoModal: (id: number, nombre: string) => void;
    deleteAgencia: (id: number) => void;
    toggleLockAgencia: (agencia: IAgencia) => void;
    openLicenseModal: (agencia: IAgencia) => void;
    onEditAgencia: (agencia: IAgencia) => void;
}

const AgenciaCard = React.memo<AgenciaCardProps>(({ 
    agencia, 
    openAgenciaInfoModal, 
    deleteAgencia, 
    toggleLockAgencia, 
    openLicenseModal,
    onEditAgencia
}) => {
    const hasActiveUsers = agencia.usuarios_activos && agencia.usuarios_activos.length > 0;

    return (
        <div style={{
            backgroundColor: 'rgba(30, 41, 59, 0.45)',
            backdropFilter: 'blur(12px)',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: hasActiveUsers
                ? '0 0 20px rgba(34, 197, 94, 0.2), 0 4px 12px rgba(0, 0, 0, 0.2)'
                : '0 8px 32px rgba(0, 0, 0, 0.25)',
            border: hasActiveUsers
                ? '1px solid rgba(34, 197, 94, 0.4)'
                : '1px solid rgba(255, 255, 255, 0.08)',
            borderLeft: `5px solid ${agencia.colores_primario || '#2563eb'}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = hasActiveUsers
                ? '0 0 25px rgba(34, 197, 94, 0.35), 0 10px 20px rgba(0, 0, 0, 0.25)'
                : '0 12px 40px rgba(0, 0, 0, 0.35)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = hasActiveUsers
                ? '0 0 20px rgba(34, 197, 94, 0.2), 0 4px 12px rgba(0, 0, 0, 0.2)'
                : '0 8px 32px rgba(0, 0, 0, 0.25)';
        }}>
            <div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
                    {/* Contenedor del logo de la agencia */}
                    <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                    }}>
                        {agencia.logo_url ? (
                            <img 
                                src={agencia.logo_url} 
                                alt={agencia.nombre} 
                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const parent = e.currentTarget.parentElement;
                                    if (parent) {
                                        parent.innerHTML = '<span style="font-size:24px">🏢</span>';
                                    }
                                }}
                            />
                        ) : (
                            <span style={{ fontSize: '24px' }}>🏢</span>
                        )}
                    </div>
                    <div>
                        <h3 style={{ 
                            fontWeight: 'bold', 
                            color: '#ffffff', 
                            fontSize: '18px', 
                            margin: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            flexWrap: 'wrap'
                        }}>
                            {agencia.nombre}
                            {!!agencia.bloqueada && (
                                <span style={{
                                    fontSize: '11px',
                                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                    color: '#ef4444',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontWeight: 'bold'
                                }}>
                                    🚫 Bloqueada
                                </span>
                            )}
                            {hasActiveUsers && (
                                <span style={{
                                    fontSize: '11px',
                                    backgroundColor: 'rgba(34, 197, 94, 0.2)',
                                    color: '#4ade80',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    <span style={{
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        backgroundColor: '#22c55e',
                                        display: 'inline-block'
                                    }}></span>
                                    Activo
                                </span>
                            )}
                        </h3>
                        <p style={{ fontSize: '14px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                            Subdominio: <strong style={{ color: '#f8fafc' }}>{agencia.subdominio}</strong>
                        </p>
                    </div>
                </div>

                <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                    <span>📅 Creada el {new Date(agencia.fecha_creacion).toLocaleDateString()}</span>
                    <span>🔗 {`${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/?agencia=${agencia.subdominio}`}</span>
                </div>

                {/* Renglón de usuarios activos */}
                {agencia.usuarios_activos && agencia.usuarios_activos.length > 0 && (
                    <div style={{
                        marginTop: '12px',
                        padding: '10px 12px',
                        backgroundColor: 'rgba(34, 197, 94, 0.08)',
                        border: '1px solid rgba(34, 197, 94, 0.25)',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: '#4ade80',
                        marginBottom: '10px'
                    }}>
                        <div style={{ fontWeight: '600', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>🟢 En línea ahora ({agencia.usuarios_activos.length}):</span>
                        </div>
                        <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '6px', 
                            maxHeight: '82px', 
                            overflowY: 'auto',
                            paddingRight: '4px'
                        }}>
                            {agencia.usuarios_activos.map((u) => (
                                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>👤 {u.nombre} {u.apellido}</span>
                                    <span style={{ 
                                        fontSize: '11px', 
                                        backgroundColor: 'rgba(96, 165, 250, 0.15)',
                                        color: '#60a5fa',
                                        padding: '1px 6px',
                                        borderRadius: '4px',
                                        fontWeight: '600',
                                        textTransform: 'uppercase'
                                    }}>
                                        {u.rol}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Botones de acción mejorados */}
            <div style={{ 
                display: 'flex', 
                gap: '10px', 
                marginTop: '20px', 
                paddingTop: '16px', 
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                justifyContent: 'flex-end',
                flexWrap: 'wrap'
            }}>
                <button
                    onClick={() => openAgenciaInfoModal(agencia.id, agencia.nombre)}
                    style={{
                        padding: '8px 14px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        color: '#e2e8f0',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                    title="Ver estadísticas e información de la agencia"
                >
                    ℹ️ Info
                </button>
                <button
                    onClick={() => {
                        const url = `/?agencia=${agencia.subdominio}&superadmin=true`;
                        window.location.href = url;
                    }}
                    style={{
                        padding: '8px 14px',
                        backgroundColor: 'rgba(96, 165, 250, 0.1)',
                        color: '#60a5fa',
                        border: '1px solid rgba(96, 165, 250, 0.25)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(96, 165, 250, 0.18)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(96, 165, 250, 0.1)'}
                    title="Entrar como Administrador de esta agencia"
                >
                    👑 Entrar
                </button>

                <button
                    onClick={() => toggleLockAgencia(agencia)}
                    style={{
                        padding: '8px 14px',
                        backgroundColor: agencia.bloqueada 
                            ? 'rgba(34, 197, 94, 0.1)'
                            : 'rgba(245, 158, 11, 0.1)',
                        color: agencia.bloqueada ? '#4ade80' : '#fbbf24',
                        border: agencia.bloqueada 
                            ? '1px solid rgba(34, 197, 94, 0.25)'
                            : '1px solid rgba(245, 158, 11, 0.25)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = agencia.bloqueada 
                            ? 'rgba(34, 197, 94, 0.18)'
                            : 'rgba(245, 158, 11, 0.18)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = agencia.bloqueada 
                            ? 'rgba(34, 197, 94, 0.1)'
                            : 'rgba(245, 158, 11, 0.1)';
                    }}
                >
                    {agencia.bloqueada ? '🔓 Desbloquear' : '🔒 Bloquear'}
                </button>

                <button
                    onClick={() => onEditAgencia(agencia)}
                    style={{
                        padding: '8px 14px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        color: '#cbd5e1',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                >
                    ✏️ Editar
                </button>

                <button
                    onClick={() => deleteAgencia(agencia.id)}
                    style={{
                        padding: '8px 14px',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.18)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                >
                    🗑️ Eliminar
                </button>
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.agencia.id === nextProps.agencia.id &&
        prevProps.agencia.nombre === nextProps.agencia.nombre &&
        prevProps.agencia.subdominio === nextProps.agencia.subdominio &&
        prevProps.agencia.logo_url === nextProps.agencia.logo_url &&
        prevProps.agencia.colores_primario === nextProps.agencia.colores_primario &&
        prevProps.agencia.colores_secundario === nextProps.agencia.colores_secundario &&
        prevProps.agencia.activo === nextProps.agencia.activo &&
        prevProps.agencia.bloqueada === nextProps.agencia.bloqueada &&
        prevProps.agencia.mensaje_bloqueo === nextProps.agencia.mensaje_bloqueo &&
        prevProps.agencia.fecha_licencia === nextProps.agencia.fecha_licencia &&
        JSON.stringify(prevProps.agencia.usuarios_activos) === JSON.stringify(nextProps.agencia.usuarios_activos)
    );
});

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const SuperAdminDashboard: React.FC = () => {
    const { user, logout: authLogout } = useAuth();
    
    // --- EFECTO INICIO MATRIX SUPERADMIN ---
    const [isInitializing, setIsInitializing] = useState(true);
    const [logoBinaryMap, setLogoBinaryMap] = useState<boolean[][] | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsInitializing(false);
        }, 2800); // 2.8 segundos de pantalla de carga

        return () => clearTimeout(timer);
    }, []);

    // Crear y mapear la silueta de las letras "SS" en binario (35x35 de resolución)
    useEffect(() => {
        const size = 35; // 35x35 caracteres
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = size;
        tempCanvas.height = size;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
            // Rellenar fondo transparente
            tempCtx.fillStyle = 'rgba(0,0,0,0)';
            tempCtx.fillRect(0, 0, size, size);
            
            // Dibujar las letras "SS" gruesas y centradas
            tempCtx.fillStyle = 'black';
            tempCtx.font = '900 24px system-ui, -apple-system, sans-serif';
            tempCtx.textAlign = 'center';
            tempCtx.textBaseline = 'middle';
            tempCtx.fillText('SS', size / 2, size / 2);

            const imgData = tempCtx.getImageData(0, 0, size, size).data;
            const opacityMap: boolean[][] = [];
            for (let y = 0; y < size; y++) {
                opacityMap[y] = [];
                for (let x = 0; x < size; x++) {
                    const alpha = imgData[(y * size + x) * 4 + 3];
                    opacityMap[y][x] = alpha > 40; // pixel opaco
                }
            }
            setLogoBinaryMap(opacityMap);
        }
    }, []);

    // Efecto de lluvia binaria y renderizado del logo SS
    useEffect(() => {
        if (!isInitializing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Ajustar canvas al tamaño de pantalla
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        const fontSize = 16;
        const columns = Math.floor(canvas.width / fontSize);
        const rainDrops: number[] = Array(columns).fill(1);
        const binaryChars = ['0', '1'];

        const draw = () => {
            // Fondo semitransparente oscuro
            ctx.fillStyle = 'rgba(2, 6, 23, 0.15)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 1. Dibujar Lluvia Binaria del Fondo
            ctx.font = `bold ${fontSize}px monospace`;
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#1e3a8a');   // Azul oscuro arriba
            gradient.addColorStop(0.5, '#0284c7'); // Azul cian intermedio
            gradient.addColorStop(1, '#38bdf8');   // Celeste brillante abajo

            for (let i = 0; i < rainDrops.length; i++) {
                const text = binaryChars[Math.floor(Math.random() * binaryChars.length)];
                ctx.fillStyle = gradient;
                ctx.fillText(text, i * fontSize, rainDrops[i] * fontSize);

                if (rainDrops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    rainDrops[i] = 0;
                }
                rainDrops[i]++;
            }

            // 2. Dibujar Silueta Holográfica de "SS" en Binario
            if (logoBinaryMap) {
                const mapSize = logoBinaryMap.length;
                const charSize = 9; // resolución fina
                const startX = Math.floor((canvas.width - mapSize * charSize) / 2);
                const startY = Math.floor((canvas.height - mapSize * charSize) / 2) - 40; // centrado vertical ligeramente elevado

                ctx.font = `bold ${charSize}px monospace`;
                
                for (let y = 0; y < mapSize; y++) {
                    for (let x = 0; x < mapSize; x++) {
                        if (logoBinaryMap[y][x]) {
                            // Caracteres binarios parpadeantes
                            const text = Math.random() > 0.5 ? '1' : '0';
                            
                            // Gradiente vertical para "SS"
                            const gradientY = startY + y * charSize;
                            const charGradient = ctx.createLinearGradient(0, startY, 0, startY + mapSize * charSize);
                            charGradient.addColorStop(0, '#38bdf8'); // Celeste brillante arriba
                            charGradient.addColorStop(1, '#0284c7'); // Azul cian medio abajo
                            
                            ctx.fillStyle = charGradient;
                            
                            // Añadir efecto de resplandor holográfico
                            ctx.shadowColor = '#06b6d4';
                            ctx.shadowBlur = 8;
                            
                            ctx.fillText(text, startX + x * charSize, gradientY);
                            
                            // Limpiar sombra para no arruinar la performance
                            ctx.shadowBlur = 0;
                        }
                    }
                }
            }
        };

        const interval = setInterval(draw, 33); // aprox 30 fps

        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', handleResize);
        };
    }, [isInitializing, logoBinaryMap]);
    // --- FIN EFECTO INICIO MATRIX SUPERADMIN ---

    const [activeTab, setActiveTab] = useState<'menu' | 'agencias' | 'admins' | 'manuales' | 'licencias' | 'estadisticas'>(() => {
        return (localStorage.getItem(`active_tab_superadmin_${user?.id}`) as any) || 'menu';
    });

    useEffect(() => {
        if (user?.id) {
            localStorage.setItem(`active_tab_superadmin_${user.id}`, activeTab);
        }
    }, [activeTab, user]);
    
    // Estados para Agencias
    const [agencias, setAgencias] = useState<IAgencia[]>([]);
    const [loadingAgencias, setLoadingAgencias] = useState(false);
    const [showAgenciaModal, setShowAgenciaModal] = useState(false);
    const [editingAgencia, setEditingAgencia] = useState<IAgencia | null>(null);
    const [agenciaForm, setAgenciaForm] = useState({
        nombre: '',
        subdominio: '',
        colores_primario: '#2563eb',
        colores_secundario: '#3b82f6'
    });
    const [currentAgenciaIndex, setCurrentAgenciaIndex] = useState(0);


    // Estados para Admins
    const [admins, setAdmins] = useState<IUsuario[]>([]);
    const [loadingAdmins, setLoadingAdmins] = useState(false);
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState<IUsuario | null>(null);
    const [adminForm, setAdminForm] = useState({
        nombre: '',
        apellido: '',
        email: '',
        password: '',
        agencia_id: 1
    });
    const [messagingUser, setMessagingUser] = useState<IUsuario | null>(null);
    const [showBroadcastModal, setShowBroadcastModal] = useState<boolean>(false);
    const [directMessageText, setDirectMessageText] = useState<string>('');
    const [broadcastMessageText, setBroadcastMessageText] = useState<string>('');

    // Estados para Bloqueo y Manuales
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [blockingAgencia, setBlockingAgencia] = useState<IAgencia | null>(null);
    const [blockMessage, setBlockMessage] = useState('');

    const [manuales, setManuales] = useState<any[]>([]);
    const [loadingManuales, setLoadingManuales] = useState(false);
    const [showManualModal, setShowManualModal] = useState(false);
    const [manualForm, setManualForm] = useState({ nombre: '', archivo: null as File | null });
    const [subiendoManual, setSubiendoManual] = useState(false);

    // Estados para Licencias
    const [showLicenseModal, setShowLicenseModal] = useState(false);
    const [licensingAgencia, setLicensingAgencia] = useState<IAgencia | null>(null);
    const [licenseDate, setLicenseDate] = useState('');

    // Estados para Enviar Claves
    const [showSendKeysModal, setShowSendKeysModal] = useState(false);
    const [sendKeysAdmin, setSendKeysAdmin] = useState<IUsuario | null>(null);
    const [sendKeysPassword, setSendKeysPassword] = useState('');
    const [sendingKeys, setSendingKeys] = useState(false);

    // 🔥 Nuevos estados de búsqueda y modal de estadísticas
    const [searchAgencia, setSearchAgencia] = useState('');
    const [searchAdmin, setSearchAdmin] = useState('');
    const [searchLicencia, setSearchLicencia] = useState('');

    const filteredAgencias = useMemo(() => {
        return agencias.filter(agencia => 
            agencia.nombre.toLowerCase().includes(searchAgencia.toLowerCase()) ||
            agencia.subdominio.toLowerCase().includes(searchAgencia.toLowerCase())
        );
    }, [agencias, searchAgencia]);

    useEffect(() => {
        if (currentAgenciaIndex >= filteredAgencias.length) {
            setCurrentAgenciaIndex(0);
        }
    }, [filteredAgencias.length, currentAgenciaIndex]);

    const [showAgenciaInfoModal, setShowAgenciaInfoModal] = useState(false);
    const [loadingAgenciaInfo, setLoadingAgenciaInfo] = useState(false);
    const [selectedAgenciaName, setSelectedAgenciaName] = useState('');
    const [agenciaInfoDetails, setAgenciaInfoDetails] = useState<{
        adminName: string;
        adminEmail: string;
        totalUsuarios: number;
        totalAreas: number;
        ticketsAbiertos: number;
    } | null>(null);

    const loadAgencias = useCallback(async (isBackground = false) => {
        try {
            if (!isBackground) setLoadingAgencias(true);
            const response = await api.get('/agencias');
            setAgencias(prev => {
                // Comparación profunda para evitar re-renderizados innecesarios si los datos son idénticos
                if (JSON.stringify(prev) === JSON.stringify(response.data.data)) {
                    return prev;
                }
                return response.data.data;
            });
        } catch (error) {
            console.error('Error al cargar agencias:', error);
            if (!isBackground) toast.error('Error al cargar agencias');
        } finally {
            if (!isBackground) setLoadingAgencias(false);
        }
    }, []);

    const openAgenciaInfoModal = useCallback(async (agenciaId: number, agenciaNombre: string) => {
        setSelectedAgenciaName(agenciaNombre);
        setLoadingAgenciaInfo(true);
        setShowAgenciaInfoModal(true);
        try {
            const response = await api.get(`/agencias/${agenciaId}/info`);
            if (response.data.success) {
                setAgenciaInfoDetails(response.data.data);
            } else {
                toast.error('❌ No se pudo cargar la información de la agencia');
            }
        } catch (error: any) {
            console.error('Error al obtener info de agencia:', error);
            toast.error(error.response?.data?.error || '❌ Error al obtener la información');
        } finally {
            setLoadingAgenciaInfo(false);
        }
    }, []);

    // ============================================
    // VERIFICAR PERMISOS
    // ============================================
    if (!user || user.rol !== 'superadmin') {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <h2>⛔ Acceso Denegado</h2>
                <p>Solo el SuperAdmin puede acceder a este panel.</p>
            </div>
        );
    }

    // ============================================
    // MÉTODOS PARA BLOQUEAR, MANUALES Y LICENCIAS
    // ============================================
    const openLicenseModal = useCallback((agencia: IAgencia) => {
        setLicensingAgencia(agencia);
        setLicenseDate(agencia.fecha_licencia ? new Date(agencia.fecha_licencia).toISOString().split('T')[0] : '');
        setShowLicenseModal(true);
    }, []);

    const submitLicenseDate = async () => {
        if (!licensingAgencia) return;
        try {
            const response = await api.put(`/agencias/${licensingAgencia.id}/licencia`, {
                fecha_licencia: licenseDate ? new Date(licenseDate).toISOString() : null
            });
            if (response.data.success) {
                toast.success('Licencia actualizada correctamente');
                setShowLicenseModal(false);
                setLicensingAgencia(null);
                loadAgencias();
            }
        } catch (e: any) {
            toast.error(e.response?.data?.error || 'Error al actualizar licencia');
        }
    };

    const openSendKeysModal = (admin: IUsuario) => {
        setSendKeysAdmin(admin);
        setSendKeysPassword('');
        setShowSendKeysModal(true);
    };

    const submitSendKeys = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sendKeysAdmin || !sendKeysPassword) return;
        try {
            setSendingKeys(true);
            const response = await api.post(`/auth/users/${sendKeysAdmin.id}/enviar-claves`, {
                password: sendKeysPassword
            });
            if (response.data.success) {
                toast.success('🔑 Claves enviadas correctamente por correo');
                setShowSendKeysModal(false);
                setSendKeysAdmin(null);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Error al enviar claves');
        } finally {
            setSendingKeys(false);
        }
    };

    const toggleLockAgencia = useCallback(async (agencia: IAgencia) => {
        if (agencia.bloqueada) {
            try {
                const response = await api.put(`/agencias/${agencia.id}/bloquear`, { bloqueada: false });
                if (response.data.success) {
                    toast.success('Agencia desbloqueada correctamente');
                    loadAgencias();
                }
            } catch (e: any) {
                toast.error(e.response?.data?.error || 'Error al desbloquear agencia');
            }
        } else {
            setBlockingAgencia(agencia);
            setBlockMessage('');
            setShowBlockModal(true);
        }
    }, [loadAgencias]);

    const submitBlockAgencia = async () => {
        if (!blockingAgencia) return;
        try {
            const response = await api.put(`/agencias/${blockingAgencia.id}/bloquear`, {
                bloqueada: true,
                mensaje_bloqueo: blockMessage
            });
            if (response.data.success) {
                toast.success('Agencia bloqueada correctamente');
                setShowBlockModal(false);
                setBlockingAgencia(null);
                loadAgencias();
            }
        } catch (e: any) {
            toast.error(e.response?.data?.error || 'Error al bloquear agencia');
        }
    };

    const loadManuales = async () => {
        try {
            setLoadingManuales(true);
            const response = await api.get('/manuales');
            if (response.data.success) {
                setManuales(response.data.data);
            }
        } catch (error) {
            console.error('Error al cargar manuales:', error);
            toast.error('Error al cargar manuales');
        } finally {
            setLoadingManuales(false);
        }
    };

    const submitManual = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualForm.archivo) {
            toast.error('Por favor, selecciona un archivo PDF');
            return;
        }

        try {
            setSubiendoManual(true);
            const formData = new FormData();
            formData.append('nombre', manualForm.nombre);
            formData.append('manual', manualForm.archivo);

            const response = await api.post('/manuales/subir', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                toast.success('Manual subido correctamente');
                setShowManualModal(false);
                setManualForm({ nombre: '', archivo: null });
                loadManuales();
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || 'Error al subir manual');
        } finally {
            setSubiendoManual(false);
        }
    };

    const deleteManual = async (id: number) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este manual?')) return;
        try {
            const response = await api.delete(`/manuales/${id}`);
            if (response.data.success) {
                toast.success('Manual eliminado correctamente');
                loadManuales();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Error al eliminar manual');
        }
    };


    const createAgencia = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await api.post('/agencias', agenciaForm);
            toast.success('✅ Agencia creada exitosamente');
            setShowAgenciaModal(false);
            setAgenciaForm({ nombre: '', subdominio: '', colores_primario: '#2563eb', colores_secundario: '#3b82f6' });
            loadAgencias();
            loadAdmins();
        } catch (error: any) {
            toast.error(error.response?.data?.error || '❌ Error al crear agencia');
        }
    };

    const updateAgencia = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAgencia) return;
        try {
            await api.put(`/agencias/${editingAgencia.id}`, agenciaForm);
            toast.success('✅ Agencia actualizada');
            setShowAgenciaModal(false);
            setEditingAgencia(null);
            setAgenciaForm({ nombre: '', subdominio: '', colores_primario: '#2563eb', colores_secundario: '#3b82f6' });
            loadAgencias();
            loadAdmins();
        } catch (error: any) {
            toast.error(error.response?.data?.error || '❌ Error al actualizar agencia');
        }
    };

    const deleteAgencia = useCallback(async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar esta agencia?')) return;
        try {
            await api.delete(`/agencias/${id}`);
            toast.success('✅ Agencia eliminada');
            loadAgencias();
            loadAdmins();
        } catch (error: any) {
            toast.error(error.response?.data?.error || '❌ Error al eliminar agencia');
        }
    }, [loadAgencias]);

    const onEditAgencia = useCallback((agencia: IAgencia) => {
        setEditingAgencia(agencia);
        setAgenciaForm({
            nombre: agencia.nombre,
            subdominio: agencia.subdominio,
            colores_primario: agencia.colores_primario || '#2563eb',
            colores_secundario: agencia.colores_secundario || '#3b82f6'
        });
        setShowAgenciaModal(true);
    }, []);

    // ============================================
    // CRUD ADMINS
    // ============================================
    const loadAdmins = async () => {
        try {
            setLoadingAdmins(true);
            const response = await api.get('/auth/users/all');
            
            if (response.data.success) {
                const adminsList = response.data.data.filter((u: any) => u.rol === 'admin' || u.rol === 'superadmin');
                setAdmins(adminsList);
            } else {
                toast.error('Error al cargar administradores');
            }
        } catch (error: any) {
            console.error('Error loading admins:', error);
            toast.error(error.response?.data?.error || 'Error al cargar administradores');
        } finally {
            setLoadingAdmins(false);
        }
    };

    const createAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await api.post('/auth/users', {
                ...adminForm,
                rol: 'admin'
            });
            toast.success('✅ Administrador creado');
            setShowAdminModal(false);
            setAdminForm({ nombre: '', apellido: '', email: '', password: '', agencia_id: agencias[0]?.id || 1 });
            loadAdmins();
        } catch (error: any) {
            toast.error(error.response?.data?.error || '❌ Error al crear administrador');
        }
    };

    const updateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAdmin) return;
        try {
            await api.put(`/auth/users/${editingAdmin.id}`, {
                nombre: adminForm.nombre,
                apellido: adminForm.apellido,
                email: adminForm.email,
                agencia_id: adminForm.agencia_id,
                password: adminForm.password || undefined
            });
            toast.success('✅ Administrador actualizado');
            setShowAdminModal(false);
            setEditingAdmin(null);
            setAdminForm({ nombre: '', apellido: '', email: '', password: '', agencia_id: agencias[0]?.id || 1 });
            loadAdmins();
        } catch (error: any) {
            toast.error(error.response?.data?.error || '❌ Error al actualizar administrador');
        }
    };

    const deleteAdmin = async (id: number) => {
        if (id === user.id) {
            toast.error('No puedes eliminarte a ti mismo');
            return;
        }
        if (!confirm('¿Estás seguro de eliminar este administrador?')) return;
        try {
            await api.delete(`/auth/users/${id}`);
            toast.success('✅ Administrador eliminado');
            loadAdmins();
        } catch (error: any) {
            toast.error(error.response?.data?.error || '❌ Error al eliminar administrador');
        }
    };

    const handleSendDirectMessage = async () => {
        if (!messagingUser || !directMessageText.trim()) return;
        try {
            await api.post('/notificaciones/enviar', {
                usuario_id: messagingUser.id,
                titulo: 'Mensaje para ti',
                mensaje: directMessageText
            });
            toast.success(`✅ Mensaje enviado a ${messagingUser.nombre}`);
            setDirectMessageText('');
            setMessagingUser(null);
        } catch (error: any) {
            toast.error(error.response?.data?.error || '❌ Error al enviar mensaje');
        }
    };

    const handleSendBroadcastMessage = async () => {
        if (!broadcastMessageText.trim()) return;
        try {
            await api.post('/notificaciones/enviar-todos', {
                titulo: 'Mensaje Global para ti',
                mensaje: broadcastMessageText
            });
            toast.success('✅ Mensaje enviado a todos los administradores');
            setBroadcastMessageText('');
            setShowBroadcastModal(false);
        } catch (error: any) {
            toast.error(error.response?.data?.error || '❌ Error al enviar mensaje global');
        }
    };

    // ============================================
    // EFECTOS
    // ============================================
    useEffect(() => {
        loadAgencias();
    }, []);

    useEffect(() => {
        if (agencias.length > 0 && admins.length === 0) {
            loadAdmins();
        }
    }, [agencias, admins.length]);

    useEffect(() => {
        if (activeTab !== 'agencias') return;

        const intervalId = setInterval(() => {
            loadAgencias(true);
        }, 5000);

        return () => clearInterval(intervalId);
    }, [activeTab, loadAgencias]);

    // ============================================
    // RENDER
    // ============================================
    return (
        <div style={{ 
            minHeight: '100vh', 
            background: 'radial-gradient(circle at center, #1e3a8a 0%, #090d16 100%) fixed', 
            fontFamily: 'system-ui, -apple-system, sans-serif' 
        }}>
            {/* Pantalla de Inicio Hack Matrix Binaria para SuperAdmin */}
            {isInitializing && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: '#020617',
                    zIndex: 99999,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                }}>
                    <canvas 
                        ref={canvasRef} 
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none'
                        }}
                    />
                    
                    {/* Estilos CSS para animaciones básicas */}
                    <style dangerouslySetInnerHTML={{__html: `
                        @keyframes dotPulseSA {
                            0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
                            40% { transform: scale(1.2); opacity: 1; }
                        }
                    `}} />

                    {/* Texto de Acceso SuperAdmin Flotante */}
                    <div style={{
                        position: 'relative',
                        zIndex: 1,
                        marginTop: '380px', // Colocado debajo de Smarty
                        textAlign: 'center',
                        fontFamily: 'monospace',
                    }}>
                        <div style={{
                            fontSize: '24px',
                            fontWeight: 'bold',
                            color: '#38bdf8',
                            textShadow: '0 0 12px rgba(56, 189, 248, 0.8)',
                            letterSpacing: '2px',
                            marginBottom: '6px'
                        }}>
                            SMARTY.SYS -- INITIALIZED
                        </div>
                        <div style={{
                            fontSize: '14px',
                            color: '#06b6d4',
                            fontWeight: 'bold',
                            letterSpacing: '1px',
                            marginBottom: '20px'
                        }}>
                            MODO: SUPERADMINISTRADOR
                        </div>

                        {/* Indicador de carga binario */}
                        <div style={{
                            display: 'flex',
                            gap: '8px',
                            justifyContent: 'center'
                        }}>
                            {[...Array(6)].map((_, i) => (
                                <div 
                                    key={i} 
                                    style={{
                                        width: '8px',
                                        height: '8px',
                                        backgroundColor: '#06b6d4',
                                        borderRadius: '50%',
                                        animation: `dotPulseSA 1.2s infinite ease-in-out both ${i * 0.15}s`
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {/* Navbar */}
            <nav style={{
                backgroundColor: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(12px)',
                padding: '12px 24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* GH Logo container */}
                    <div style={{
                        height: '35px',
                        backgroundColor: 'white',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <img 
                            src="/logo_gh.jpg" 
                            alt="GH Logo" 
                            style={{ height: '100%', objectFit: 'contain' }}
                            onError={(e) => {
                                e.currentTarget.src = '/logo_gh_alt.jpg';
                            }}
                        />
                    </div>
                    <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>
                        Super Admin Dashboard
                    </h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '14px', color: '#f8fafc', fontWeight: '500' }}>
                        {user?.nombre} {user?.apellido}
                    </span>
                    <button
                        onClick={() => {
                            authLogout();
                            logout();
                        }}
                        style={{
                            padding: '6px 14px',
                            color: '#ef4444',
                            background: 'none',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.6)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                        }}
                    >
                        Cerrar sesión
                    </button>
                </div>
            </nav>

            {/* Tabs & Content Container */}
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
                {/* Navigation Tabs (Hidden when in Menu) */}
                {activeTab !== 'menu' && (
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        backgroundColor: 'rgba(15, 23, 42, 0.55)',
                        backdropFilter: 'blur(8px)',
                        padding: '6px',
                        borderRadius: '10px',
                        marginBottom: '24px',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
                    }}>
                        <button
                            onClick={() => setActiveTab('menu')}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: 'transparent',
                                color: '#94a3b8',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                        >
                            ⬅️ Menú Principal
                        </button>
                        {(['agencias', 'admins', 'manuales', 'licencias', 'estadisticas'] as const).map((tab) => {
                            const isActive = activeTab === tab;
                            const labels: Record<string, string> = {
                                agencias: '🏢 Agencias',
                                admins: '👥 Administradores',
                                manuales: '📄 Manuales',
                                licencias: '📅 Licencias',
                                estadisticas: '📈 Estadísticas'
                            };
                            return (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        border: isActive ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: isActive ? '600' : '500',
                                        backgroundColor: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                        color: isActive ? '#60a5fa' : '#cbd5e1',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.color = '#ffffff';
                                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.color = '#cbd5e1';
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }
                                    }}
                                >
                                    {labels[tab]}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* ============================================
                MENÚ PRINCIPAL (BOTONES GRANDES)
                ============================================ */}
                {activeTab === 'menu' && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '24px',
                        marginTop: '10px'
                    }}>
                        {[
                            {
                                tab: 'agencias' as const,
                                icon: '🏢',
                                title: 'Agencias',
                                description: 'Administra y configura las agencias registradas, carga de logos y personaliza colores.'
                            },
                            {
                                tab: 'admins' as const,
                                icon: '👥',
                                title: 'Administradores',
                                description: 'Gestiona las cuentas de administradores de cada agencia de soporte.'
                            },
                            {
                                tab: 'manuales' as const,
                                icon: '📄',
                                title: 'Manuales',
                                description: 'Sube y gestiona la documentación y manuales de ayuda para los usuarios.'
                            },
                            {
                                tab: 'licencias' as const,
                                icon: '📅',
                                title: 'Licencias',
                                description: 'Controla el estado y vencimiento de las licencias de las agencias.'
                            },
                            {
                                tab: 'estadisticas' as const,
                                icon: '📈',
                                title: 'Estadísticas',
                                description: 'Analiza el volumen de tickets, tiempos de respuesta, carga por agente y tendencias de soporte.'
                            }
                        ].map((item) => (
                            <div 
                                key={item.tab}
                                onClick={() => setActiveTab(item.tab)}
                                style={{
                                    backgroundColor: 'rgba(30, 41, 59, 0.45)',
                                    backdropFilter: 'blur(12px)',
                                    borderRadius: '16px',
                                    padding: '32px 24px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
                                    transition: 'all 0.2s ease-in-out',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '16px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.4)';
                                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.25)';
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                                }}
                            >
                                <div style={{ fontSize: '48px' }}>{item.icon}</div>
                                <div>
                                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>
                                        {item.title}
                                    </h3>
                                    <p style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.5' }}>
                                        {item.description}
                                    </p>
                                </div>
                                <button style={{
                                    marginTop: 'auto',
                                    padding: '10px 20px',
                                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    color: 'white',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    width: '100%',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                                >
                                    Ingresar
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* ============================================
                TAB AGENCIAS
                ============================================ */}
                {activeTab === 'agencias' && (
                    <div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '16px'
                        }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#f8fafc' }}>
                                Agencias Registradas
                            </h2>
                            <button
                                onClick={() => {
                                    setEditingAgencia(null);
                                    setAgenciaForm({ nombre: '', subdominio: '', colores_primario: '#2563eb', colores_secundario: '#3b82f6' });
                                    setShowAgenciaModal(true);
                                }}
                                style={{
                                    padding: '10px 20px',
                                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    color: 'white',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                + Nueva Agencia
                            </button>
                        </div>

                        {/* 🔥 Buscador de Agencias */}
                        <div style={{ marginBottom: '20px' }}>
                            <input
                                type="text"
                                placeholder="🔍 Buscar agencia por nombre o subdominio..."
                                value={searchAgencia}
                                onChange={(e) => setSearchAgencia(e.target.value)}
                                style={{
                                    width: '100%',
                                    maxWidth: '400px',
                                    padding: '10px 14px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    backgroundColor: '#1e293b',
                                    color: 'white',
                                    fontSize: '14px',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        {loadingAgencias ? (
                            <p style={{ color: '#f8fafc' }}>Cargando...</p>
                        ) : (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '100%',
                                position: 'relative',
                                margin: '20px 0 40px 0'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                    width: '100%',
                                    height: '420px',
                                    perspective: '1000px',
                                    transformStyle: 'preserve-3d',
                                    overflow: 'hidden'
                                }}>
                                    {/* Botón Flecha Izquierda */}
                                    {filteredAgencias.length > 1 && (
                                        <button
                                            onClick={() => setCurrentAgenciaIndex(prev => (prev === 0 ? Math.max(filteredAgencias.length - 1, 0) : prev - 1))}
                                            style={{
                                                position: 'absolute',
                                                left: '20px',
                                                zIndex: 30,
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '50%',
                                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                                backgroundColor: 'rgba(30, 41, 59, 0.75)',
                                                color: 'white',
                                                fontSize: '20px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backdropFilter: 'blur(8px)',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                                                transition: 'all 0.2s',
                                                userSelect: 'none'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = '#2563eb';
                                                e.currentTarget.style.transform = 'scale(1.05)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.75)';
                                                e.currentTarget.style.transform = 'scale(1)';
                                            }}
                                        >
                                            ◀
                                        </button>
                                    )}

                                    {/* Contenedor de Tarjetas 3D */}
                                    <div style={{
                                        position: 'relative',
                                        width: '100%',
                                        maxWidth: '420px',
                                        height: '340px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transformStyle: 'preserve-3d'
                                    }}>
                                        {filteredAgencias.length === 0 ? (
                                            <p style={{ color: '#94a3b8', fontSize: '15px' }}>No hay agencias disponibles</p>
                                        ) : (
                                            filteredAgencias.map((agencia, idx) => {
                                                let diff = idx - currentAgenciaIndex;
                                                const len = filteredAgencias.length;
                                                if (len > 2) {
                                                    if (diff > len / 2) diff -= len;
                                                    if (diff < -len / 2) diff += len;
                                                }
                                                const absDiff = Math.abs(diff);
                                                
                                                let transformStr = '';
                                                let opacity = 1;
                                                let zIndex = 10 - absDiff;
                                                let pointerEvents: 'auto' | 'none' = 'none';

                                                if (absDiff === 0) {
                                                    transformStr = 'translateX(0) scale(1) translateZ(0) rotateY(0deg)';
                                                    opacity = 1;
                                                    pointerEvents = 'auto';
                                                } else if (diff === -1 || (diff > 0 && len === 2 && currentAgenciaIndex === 1)) {
                                                    transformStr = 'translateX(-280px) scale(0.78) translateZ(-150px) rotateY(28deg)';
                                                    opacity = 0.5;
                                                } else if (diff === 1 || (diff < 0 && len === 2 && currentAgenciaIndex === 0)) {
                                                    transformStr = 'translateX(280px) scale(0.78) translateZ(-150px) rotateY(-28deg)';
                                                    opacity = 0.5;
                                                } else {
                                                    transformStr = diff < 0 
                                                        ? 'translateX(-500px) scale(0.6) translateZ(-300px) rotateY(40deg)'
                                                        : 'translateX(500px) scale(0.6) translateZ(-300px) rotateY(-40deg)';
                                                    opacity = 0;
                                                }

                                                return (
                                                    <div
                                                        key={agencia.id}
                                                        style={{
                                                            position: 'absolute',
                                                            width: '100%',
                                                            maxWidth: '380px',
                                                            transform: transformStr,
                                                            opacity: opacity,
                                                            zIndex: zIndex,
                                                            pointerEvents: pointerEvents,
                                                            transition: 'all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)',
                                                            transformStyle: 'preserve-3d'
                                                        }}
                                                    >
                                                        <AgenciaCard 
                                                            agencia={agencia}
                                                            openAgenciaInfoModal={openAgenciaInfoModal}
                                                            deleteAgencia={deleteAgencia}
                                                            toggleLockAgencia={toggleLockAgencia}
                                                            openLicenseModal={openLicenseModal}
                                                            onEditAgencia={onEditAgencia}
                                                        />
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>

                                    {/* Botón Flecha Derecha */}
                                    {filteredAgencias.length > 1 && (
                                        <button
                                            onClick={() => setCurrentAgenciaIndex(prev => (prev === Math.max(filteredAgencias.length - 1, 0) ? 0 : prev + 1))}
                                            style={{
                                                position: 'absolute',
                                                right: '20px',
                                                zIndex: 30,
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '50%',
                                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                                backgroundColor: 'rgba(30, 41, 59, 0.75)',
                                                color: 'white',
                                                fontSize: '20px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backdropFilter: 'blur(8px)',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                                                transition: 'all 0.2s',
                                                userSelect: 'none'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = '#2563eb';
                                                e.currentTarget.style.transform = 'scale(1.05)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.75)';
                                                e.currentTarget.style.transform = 'scale(1)';
                                            }}
                                        >
                                            ▶
                                        </button>
                                    )}
                                </div>

                                {/* Indicadores de Puntos */}
                                {filteredAgencias.length > 1 && (
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                        {filteredAgencias.map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setCurrentAgenciaIndex(idx)}
                                                style={{
                                                    width: idx === currentAgenciaIndex ? '24px' : '8px',
                                                    height: '8px',
                                                    borderRadius: '4px',
                                                    backgroundColor: idx === currentAgenciaIndex ? '#2563eb' : 'rgba(255, 255, 255, 0.3)',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                                {/* Tabla Resumen de todas las Agencias */}
                                <div style={{ marginTop: '30px', width: '100%' }}>
                                    <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#ffffff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        📋 Resumen General de Agencias ({filteredAgencias.length})
                                    </h3>
                                    <div style={{
                                        maxHeight: '260px',
                                        overflowY: 'auto',
                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                        borderRadius: '12px',
                                        backgroundColor: 'rgba(30, 41, 59, 0.25)',
                                        backdropFilter: 'blur(10px)'
                                    }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                                            <thead>
                                                <tr style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', position: 'sticky', top: 0, zIndex: 10 }}>
                                                    <th style={{ padding: '10px 14px', fontWeight: '600', color: '#cbd5e1' }}>Nombre</th>
                                                    <th style={{ padding: '10px 14px', fontWeight: '600', color: '#cbd5e1', textAlign: 'center' }}>Logo</th>
                                                    <th style={{ padding: '10px 14px', fontWeight: '600', color: '#cbd5e1', textAlign: 'center' }}>Usuarios</th>
                                                    <th style={{ padding: '10px 14px', fontWeight: '600', color: '#cbd5e1', textAlign: 'center' }}>En Línea</th>
                                                    <th style={{ padding: '10px 14px', fontWeight: '600', color: '#cbd5e1' }}>Administrador</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredAgencias.map((ag) => (
                                                    <tr 
                                                        key={ag.id} 
                                                        onClick={() => {
                                                            const originalIndex = filteredAgencias.findIndex(x => x.id === ag.id);
                                                            if (originalIndex !== -1) {
                                                                setCurrentAgenciaIndex(originalIndex);
                                                            }
                                                        }}
                                                        style={{ 
                                                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)', 
                                                            cursor: 'pointer',
                                                            transition: 'background-color 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                    >
                                                        <td style={{ padding: '10px 14px' }}>
                                                            <div style={{ fontWeight: '600', color: '#ffffff' }}>{ag.nombre}</div>
                                                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{ag.subdominio}.grupohuerta.com</div>
                                                        </td>
                                                        <td style={{ padding: '10px 14px', display: 'flex', justifyContent: 'center' }}>
                                                            <div style={{
                                                                width: '30px',
                                                                height: '30px',
                                                                borderRadius: '6px',
                                                                backgroundColor: ag.colores_primario || '#1e3a8a',
                                                                color: 'white',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontWeight: 'bold',
                                                                fontSize: '11px',
                                                                border: '1px solid rgba(255,255,255,0.1)'
                                                            }}>
                                                                {ag.nombre.substring(0, 2).toUpperCase()}
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 'bold', color: '#e2e8f0' }}>
                                                            {ag.total_usuarios ?? 0}
                                                        </td>
                                                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                                            <span style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                padding: '2px 8px',
                                                                borderRadius: '10px',
                                                                fontSize: '11px',
                                                                fontWeight: 'bold',
                                                                backgroundColor: (ag.usuarios_activos?.length || 0) > 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                                                color: (ag.usuarios_activos?.length || 0) > 0 ? '#4ade80' : '#94a3b8'
                                                            }}>
                                                                <span style={{
                                                                    width: '6px',
                                                                    height: '6px',
                                                                    borderRadius: '50%',
                                                                    backgroundColor: (ag.usuarios_activos?.length || 0) > 0 ? '#22c55e' : '#94a3b8'
                                                                }} />
                                                                {ag.usuarios_activos?.length || 0}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '10px 14px', color: '#cbd5e1', fontSize: '12px' }}>
                                                            {ag.admin_info || <span style={{ color: '#64748b', fontStyle: 'italic' }}>Sin asignar</span>}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ============================================
                TAB ADMINS
                ============================================ */}
                {activeTab === 'admins' && (
                    <div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '16px'
                        }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#f8fafc' }}>
                                                            Administradores del Sistema
                                                        </h2>
                            <button
                                onClick={() => {
                                    setEditingAdmin(null);
                                    setAdminForm({ 
                                        nombre: '', 
                                        apellido: '', 
                                        email: '', 
                                        password: '', 
                                        agencia_id: agencias[0]?.id || 1 
                                    });
                                    setShowAdminModal(true);
                                }}
                                style={{
                                    padding: '10px 20px',
                                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    color: 'white',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                + Nuevo Admin
                            </button>
                        </div>

                        {/* 🔥 Buscador de Administradores */}
                        <div style={{ marginBottom: '20px' }}>
                            <input
                                type="text"
                                placeholder="🔍 Buscar administrador por nombre, apellido o correo..."
                                value={searchAdmin}
                                onChange={(e) => setSearchAdmin(e.target.value)}
                                style={{
                                    width: '100%',
                                    maxWidth: '400px',
                                    padding: '10px 14px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    backgroundColor: '#1e293b',
                                    color: 'white',
                                    fontSize: '14px',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        {loadingAdmins ? (
                            <p style={{ color: '#f8fafc' }}>Cargando...</p>
                        ) : (
                            <div style={{
                                backgroundColor: 'rgba(30, 41, 59, 0.45)',
                                backdropFilter: 'blur(12px)',
                                borderRadius: '12px',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                overflowY: 'auto',
                                overflowX: 'auto',
                                maxHeight: '320px',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.25)'
                            }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
                                        <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#cbd5e1' }}>Nombre</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#cbd5e1' }}>Email</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#cbd5e1' }}>Agencia</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#cbd5e1' }}>Rol</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#cbd5e1' }}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {admins
                                            .filter(admin => 
                                                admin.nombre.toLowerCase().includes(searchAdmin.toLowerCase()) ||
                                                admin.apellido.toLowerCase().includes(searchAdmin.toLowerCase()) ||
                                                admin.email.toLowerCase().includes(searchAdmin.toLowerCase())
                                            )
                                            .map((admin) => {
                                            const agencia = agencias.find(a => a.id === admin.agencia_id);
                                            const initials = ((admin.nombre ? admin.nombre[0] : '') + (admin.apellido ? admin.apellido[0] : '')).toUpperCase();
                                            return (
                                                <tr key={admin.id} style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div style={{
                                                                width: '32px',
                                                                height: '32px',
                                                                borderRadius: '50%',
                                                                backgroundColor: agencia?.colores_primario || '#2563eb',
                                                                color: 'white',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '12px',
                                                                fontWeight: 'bold',
                                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                            }}>
                                                                {initials}
                                                            </div>
                                                            <div>
                                                                <span style={{ fontWeight: '600', color: '#ffffff' }}>{admin.nombre} {admin.apellido}</span>
                                                                {admin.id === user.id && (
                                                                    <span style={{
                                                                        marginLeft: '8px',
                                                                        padding: '2px 8px',
                                                                        backgroundColor: 'rgba(96, 165, 250, 0.15)',
                                                                        borderRadius: '4px',
                                                                        fontSize: '10px',
                                                                        color: '#60a5fa',
                                                                        fontWeight: 'bold'
                                                                    }}>
                                                                        Tú
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{admin.email}</td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <span style={{
                                                            padding: '2px 8px',
                                                            backgroundColor: 'rgba(99, 102, 241, 0.15)',
                                                            borderRadius: '4px',
                                                            fontSize: '12px',
                                                            color: '#818cf8',
                                                            fontWeight: '600'
                                                        }}>
                                                            {agencia?.nombre || 'Sin agencia'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <span style={{
                                                            padding: '2px 8px',
                                                            backgroundColor: admin.rol === 'superadmin' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                                            borderRadius: '4px',
                                                            fontSize: '12px',
                                                            color: admin.rol === 'superadmin' ? '#fbbf24' : '#60a5fa',
                                                            fontWeight: '600'
                                                        }}>
                                                            {admin.rol}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                        {admin.id !== user.id && (
                                                            <button
                                                                onClick={() => setMessagingUser(admin)}
                                                                style={{
                                                                    padding: '6px 12px',
                                                                    backgroundColor: 'rgba(96, 165, 250, 0.1)',
                                                                    border: '1px solid rgba(96, 165, 250, 0.25)',
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer',
                                                                    marginRight: '6px',
                                                                    color: '#60a5fa',
                                                                    fontSize: '12px',
                                                                    fontWeight: '600',
                                                                    transition: 'all 0.2s'
                                                                }}
                                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(96, 165, 250, 0.18)'}
                                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(96, 165, 250, 0.1)'}
                                                                title="Enviar mensaje directo"
                                                            >
                                                                ✉️ Mensaje
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={() => {
                                                                setEditingAdmin(admin);
                                                                setAdminForm({
                                                                    nombre: admin.nombre,
                                                                    apellido: admin.apellido,
                                                                    email: admin.email,
                                                                    password: '',
                                                                    agencia_id: admin.agencia_id
                                                                });
                                                                setShowAdminModal(true);
                                                            }}
                                                            style={{
                                                                padding: '6px 12px',
                                                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                marginRight: '6px',
                                                                color: '#cbd5e1',
                                                                fontSize: '12px',
                                                                fontWeight: '600',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)'}
                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                                                            title="Editar administrador"
                                                        >
                                                            ✏️
                                                        </button>
                                                        {admin.id !== user.id && (
                                                            <button
                                                                onClick={() => deleteAdmin(admin.id)}
                                                                style={{
                                                                    padding: '6px 12px',
                                                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                                    border: '1px solid rgba(239, 68, 68, 0.25)',
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer',
                                                                    color: '#f87171',
                                                                    fontSize: '12px',
                                                                    fontWeight: '600',
                                                                    transition: 'all 0.2s'
                                                                }}
                                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.18)'}
                                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                                                                title="Eliminar administrador"
                                                            >
                                                                🗑️
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-start' }}>
                            <button
                                onClick={() => setShowBroadcastModal(true)}
                                style={{
                                    padding: '10px 20px',
                                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    borderRadius: '8px',
                                    color: '#ffffff',
                                    fontSize: '13px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                📢 Enviar Mensaje Global a Todos los Admins
                            </button>
                        </div>
                    </div>
                )}

                {/* ============================================
                TAB MANUALES
                ============================================ */}
                {activeTab === 'manuales' && (
                    <div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '16px'
                        }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#f8fafc' }}>
                                Manuales de Usuario y Guías
                            </h2>
                            <button
                                onClick={() => {
                                    setManualForm({ nombre: '', archivo: null });
                                    setShowManualModal(true);
                                }}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#2563eb',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                            >
                                + Subir Manual (PDF)
                            </button>
                        </div>

                        {loadingManuales ? (
                            <p style={{ color: '#f8fafc' }}>Cargando manuales...</p>
                        ) : (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                gap: '16px'
                            }}>
                                {manuales.length === 0 ? (
                                    <div style={{
                                        gridColumn: '1 / -1',
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                        padding: '40px',
                                        borderRadius: '8px',
                                        textAlign: 'center',
                                        color: '#cbd5e1'
                                    }}>
                                        No hay manuales subidos actualmente.
                                    </div>
                                ) : (
                                    manuales.map((m) => (
                                        <div key={m.id} style={{
                                            backgroundColor: 'rgba(30, 41, 59, 0.45)',
                                            backdropFilter: 'blur(12px)',
                                            padding: '20px',
                                            borderRadius: '12px',
                                            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between'
                                        }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                                    <span style={{ fontSize: '32px' }}>📕</span>
                                                    <h3 style={{ fontWeight: 'bold', color: '#ffffff', fontSize: '16px', margin: 0 }}>
                                                        {m.nombre}
                                                    </h3>
                                                </div>
                                                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 16px 0' }}>
                                                    Subido el {new Date(m.fecha_creacion).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px' }}>
                                                <a
                                                    href={m.ruta.startsWith('http') ? m.ruta : `${IMAGE_BASE_URL}${m.ruta}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        flex: 1,
                                                        padding: '8px',
                                                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                                        color: '#60a5fa',
                                                        border: '1px solid rgba(59, 130, 246, 0.25)',
                                                        textAlign: 'center',
                                                        textDecoration: 'none',
                                                        borderRadius: '6px',
                                                        fontSize: '13px',
                                                        fontWeight: '600',
                                                        display: 'inline-block',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.18)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'}
                                                >
                                                    ⬇️ Descargar PDF
                                                </a>
                                                <button
                                                    onClick={() => deleteManual(m.id)}
                                                    style={{
                                                        padding: '8px 12px',
                                                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                        color: '#ef4444',
                                                        border: '1px solid rgba(239, 68, 68, 0.25)',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '13px',
                                                        fontWeight: '600',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.18)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                                                >
                                                    🗑️ Borrar
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ============================================
                TAB LICENCIAS
                ============================================ */}
                {activeTab === 'licencias' && (
                    <div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '16px'
                        }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#f8fafc' }}>
                                Control de Licencias por Agencia
                            </h2>
                        </div>

                        {/* 🔥 Buscador de Licencias */}
                        <div style={{ marginBottom: '20px' }}>
                            <input
                                type="text"
                                placeholder="🔍 Buscar agencia por nombre o subdominio..."
                                value={searchLicencia}
                                onChange={(e) => setSearchLicencia(e.target.value)}
                                style={{
                                    width: '100%',
                                    maxWidth: '400px',
                                    padding: '10px 14px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    fontSize: '14px',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        <div style={{
                            backgroundColor: 'rgba(30, 41, 59, 0.45)',
                            backdropFilter: 'blur(12px)',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            overflow: 'hidden',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)'
                        }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                        <th style={{ padding: '16px', color: '#cbd5e1', fontWeight: '600' }}>Agencia</th>
                                        <th style={{ padding: '16px', color: '#cbd5e1', fontWeight: '600' }}>Subdominio</th>
                                        <th style={{ padding: '16px', color: '#cbd5e1', fontWeight: '600' }}>Expiración de Licencia</th>
                                        <th style={{ padding: '16px', color: '#cbd5e1', fontWeight: '600' }}>Estado</th>
                                        <th style={{ padding: '16px', color: '#cbd5e1', fontWeight: '600', textAlign: 'center' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {agencias
                                        .filter(a => 
                                            a.nombre.toLowerCase().includes(searchLicencia.toLowerCase()) || 
                                            a.subdominio.toLowerCase().includes(searchLicencia.toLowerCase())
                                        )
                                        .map((agencia) => {
                                        const dateStr = agencia.fecha_licencia;
                                        let statusBadge = { bg: '#e2e8f0', text: '#475569', label: 'Sin Asignar' };
                                        
                                        if (dateStr) {
                                            const exp = new Date(dateStr);
                                            const today = new Date();
                                            exp.setHours(0,0,0,0);
                                            today.setHours(0,0,0,0);
                                            const diff = exp.getTime() - today.getTime();
                                            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                                            
                                            if (days <= 0) {
                                                statusBadge = { bg: '#fee2e2', text: '#b91c1c', label: 'Expirada 🚫' };
                                            } else if (days <= 2) {
                                                statusBadge = { bg: '#ffedd5', text: '#ea580c', label: `Crítico (Vence en ${days}d) ⚠️` };
                                            } else if (days <= 5) {
                                                statusBadge = { bg: '#fef9c3', text: '#ca8a04', label: `Pronto a Vencer (${days}d) ⚠️` };
                                            } else {
                                                statusBadge = { bg: '#dcfce7', text: '#15803d', label: 'Activa ✅' };
                                            }
                                        }

                                        return (
                                            <tr key={agencia.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '16px', fontWeight: '600', color: '#0f172a' }}>{agencia.nombre}</td>
                                                <td style={{ padding: '16px', color: '#64748b' }}>{agencia.subdominio}</td>
                                                <td style={{ padding: '16px', color: '#334155' }}>
                                                    {dateStr ? new Date(dateStr).toLocaleDateString() : 'Licencia Permanente'}
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    <span style={{
                                                        backgroundColor: statusBadge.bg,
                                                        color: statusBadge.text,
                                                        padding: '4px 10px',
                                                        borderRadius: '12px',
                                                        fontSize: '12px',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {statusBadge.label}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => openLicenseModal(agencia)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            backgroundColor: '#2563eb',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontSize: '13px',
                                                            fontWeight: '600'
                                                        }}
                                                    >
                                                        📅 Modificar
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'estadisticas' && (
                    <SuperAdminStats agencias={agencias} />
                )}
            </div>

            {/* ============================================
            MODAL AGENCIAS
            ============================================ */}
            {showAgenciaModal && (
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
                        backgroundColor: 'white',
                        padding: '32px',
                        borderRadius: '12px',
                        maxWidth: '500px',
                        width: '90%'
                    }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
                            {editingAgencia ? '✏️ Editar Agencia' : '+ Nueva Agencia'}
                        </h2>
                        <form onSubmit={editingAgencia ? updateAgencia : createAgencia}>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                                    Nombre *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={agenciaForm.nombre}
                                    onChange={(e) => setAgenciaForm({ ...agenciaForm, nombre: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                                    Subdominio *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={agenciaForm.subdominio}
                                    onChange={(e) => setAgenciaForm({ ...agenciaForm, subdominio: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        outline: 'none'
                                    }}
                                    placeholder="ej: techcorp"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                                        Color Primario
                                    </label>
                                    <input
                                        type="color"
                                        value={agenciaForm.colores_primario}
                                        onChange={(e) => setAgenciaForm({ ...agenciaForm, colores_primario: e.target.value })}
                                        style={{
                                            width: '100%',
                                            height: '40px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            cursor: 'pointer'
                                        }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                                        Color Secundario
                                    </label>
                                    <input
                                        type="color"
                                        value={agenciaForm.colores_secundario}
                                        onChange={(e) => setAgenciaForm({ ...agenciaForm, colores_secundario: e.target.value })}
                                        style={{
                                            width: '100%',
                                            height: '40px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            cursor: 'pointer'
                                        }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAgenciaModal(false);
                                        setEditingAgencia(null);
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        backgroundColor: '#e5e7eb',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        flex: 2,
                                        padding: '10px',
                                        backgroundColor: '#2563eb',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {editingAgencia ? 'Actualizar' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============================================
            MODAL ADMINS (con selector de agencia)
            ============================================ */}
            {showAdminModal && (
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
                        backgroundColor: 'white',
                        padding: '32px',
                        borderRadius: '12px',
                        maxWidth: '500px',
                        width: '90%'
                    }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
                            {editingAdmin ? '✏️ Editar Administrador' : '+ Nuevo Administrador'}
                        </h2>
                        <form onSubmit={editingAdmin ? updateAdmin : createAdmin}>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                                    Nombre *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={adminForm.nombre}
                                    onChange={(e) => setAdminForm({ ...adminForm, nombre: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                                    Apellido *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={adminForm.apellido}
                                    onChange={(e) => setAdminForm({ ...adminForm, apellido: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={adminForm.email}
                                    onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            
                            {/* 🔥 Selector de Agencia */}
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                                    Agencia *
                                </label>
                                <select
                                    required
                                    value={adminForm.agencia_id}
                                    onChange={(e) => setAdminForm({ ...adminForm, agencia_id: parseInt(e.target.value) })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        outline: 'none'
                                    }}
                                >
                                    <option value="">Seleccionar agencia</option>
                                    {agencias.map((ag) => (
                                        <option key={ag.id} value={ag.id}>
                                            {ag.nombre} ({ag.subdominio})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                                    {editingAdmin ? 'Nueva Contraseña (opcional)' : 'Contraseña *'}
                                </label>
                                <input
                                    type="password"
                                    required={!editingAdmin}
                                    value={adminForm.password}
                                    onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        outline: 'none'
                                    }}
                                    placeholder={editingAdmin ? 'Dejar vacío para no cambiar' : 'Mínimo 6 caracteres'}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAdminModal(false);
                                        setEditingAdmin(null);
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        backgroundColor: '#e5e7eb',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        flex: 2,
                                        padding: '10px',
                                        backgroundColor: '#7c3aed',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {editingAdmin ? 'Actualizar' : 'Crear Admin'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Mensaje Directo a Administrador */}
            {messagingUser && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(9, 13, 22, 0.75)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'rgba(30, 41, 59, 0.9)',
                        backdropFilter: 'blur(16px)',
                        padding: '28px',
                        borderRadius: '16px',
                        width: '90%',
                        maxWidth: '500px',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        boxShadow: '0 24px 48px rgba(0, 0, 0, 0.45)',
                        color: 'white'
                    }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            ✉️ Enviar Mensaje a {messagingUser.nombre} {messagingUser.apellido}
                        </h3>
                        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
                            Este mensaje se le mostrará a este administrador en una notificación destacada en cuanto ingrese a su portal y podrá marcarlo como leído.
                        </p>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '8px' }}>Mensaje:</label>
                            <textarea
                                value={directMessageText}
                                onChange={(e) => setDirectMessageText(e.target.value)}
                                placeholder="Escribe el mensaje aquí..."
                                style={{
                                    width: '100%',
                                    height: '120px',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    backgroundColor: '#1e293b',
                                    color: 'white',
                                    fontSize: '14px',
                                    outline: 'none',
                                    resize: 'none'
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={() => {
                                    setMessagingUser(null);
                                    setDirectMessageText('');
                                }}
                                style={{
                                    padding: '10px 18px',
                                    backgroundColor: 'transparent',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '6px',
                                    color: '#cbd5e1',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    transition: 'all 0.15s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleSendDirectMessage}
                                disabled={!directMessageText.trim()}
                                style={{
                                    padding: '10px 20px',
                                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    borderRadius: '6px',
                                    color: 'white',
                                    cursor: directMessageText.trim() ? 'pointer' : 'not-allowed',
                                    opacity: directMessageText.trim() ? 1 : 0.5,
                                    fontSize: '13px',
                                    fontWeight: '700',
                                    transition: 'all 0.15s'
                                }}
                            >
                                Enviar Mensaje
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Mensaje Global a Todos los Administradores */}
            {showBroadcastModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(9, 13, 22, 0.75)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'rgba(30, 41, 59, 0.9)',
                        backdropFilter: 'blur(16px)',
                        padding: '28px',
                        borderRadius: '16px',
                        width: '90%',
                        maxWidth: '500px',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        boxShadow: '0 24px 48px rgba(0, 0, 0, 0.45)',
                        color: 'white'
                    }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            📢 Mensaje Global a Todos los Administradores
                        </h3>
                        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
                            Este comunicado masivo aparecerá a todos los administradores activos de todas las agencias en cuanto inicien sesión o entren a su panel. Podrán marcarlo como leído individualmente.
                        </p>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '8px' }}>Mensaje:</label>
                            <textarea
                                value={broadcastMessageText}
                                onChange={(e) => setBroadcastMessageText(e.target.value)}
                                placeholder="Escribe el comunicado global aquí..."
                                style={{
                                    width: '100%',
                                    height: '120px',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    backgroundColor: '#1e293b',
                                    color: 'white',
                                    fontSize: '14px',
                                    outline: 'none',
                                    resize: 'none'
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowBroadcastModal(false);
                                    setBroadcastMessageText('');
                                }}
                                style={{
                                    padding: '10px 18px',
                                    backgroundColor: 'transparent',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '6px',
                                    color: '#cbd5e1',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    transition: 'all 0.15s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleSendBroadcastMessage}
                                disabled={!broadcastMessageText.trim()}
                                style={{
                                    padding: '10px 20px',
                                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    borderRadius: '6px',
                                    color: 'white',
                                    cursor: broadcastMessageText.trim() ? 'pointer' : 'not-allowed',
                                    opacity: broadcastMessageText.trim() ? 1 : 0.5,
                                    fontSize: '13px',
                                    fontWeight: '700',
                                    transition: 'all 0.15s'
                                }}
                            >
                                Difundir Comunicado
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================
            MODAL PARA BLOQUEAR AGENCIA
            ============================================ */}
            {showBlockModal && blockingAgencia && (
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
                        backgroundColor: 'white',
                        padding: '24px',
                        borderRadius: '12px',
                        width: '90%',
                        maxWidth: '450px',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                    }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', marginBottom: '12px' }}>
                            🔒 Bloquear Agencia: {blockingAgencia.nombre}
                        </h3>
                        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', lineHeight: '1.4' }}>
                            Ingresa el motivo de la suspensión. Este mensaje será visible para los administradores de la agencia al intentar ingresar.
                        </p>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>
                                Razón del Bloqueo
                            </label>
                            <textarea
                                value={blockMessage}
                                onChange={(e) => setBlockMessage(e.target.value)}
                                style={{
                                    width: '100%',
                                    height: '100px',
                                    padding: '8px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    resize: 'none',
                                    outline: 'none',
                                    fontFamily: 'inherit'
                                }}
                                placeholder="Ej: Pago pendiente, mantenimiento programado, etc."
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => {
                                    setShowBlockModal(false);
                                    setBlockingAgencia(null);
                                }}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    backgroundColor: '#e5e7eb',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={submitBlockAgencia}
                                style={{
                                    flex: 2,
                                    padding: '10px',
                                    backgroundColor: '#d97706',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                Confirmar Bloqueo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================
            MODAL PARA SUBIR MANUAL
            ============================================ */}
            {showManualModal && (
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
                        backgroundColor: 'white',
                        padding: '24px',
                        borderRadius: '12px',
                        width: '90%',
                        maxWidth: '450px',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                    }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', marginBottom: '16px' }}>
                            📕 Subir Manual de Usuario
                        </h3>
                        <form onSubmit={submitManual}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>
                                    Nombre del Manual
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={manualForm.nombre}
                                    onChange={(e) => setManualForm(prev => ({ ...prev, nombre: e.target.value }))}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        outline: 'none'
                                    }}
                                    placeholder="Ej: Manual de Administrador de Soporte"
                                />
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>
                                    Archivo PDF (.pdf)
                                </label>
                                <input
                                    type="file"
                                    required
                                    accept=".pdf,application/pdf"
                                    onChange={(e) => setManualForm(prev => ({ ...prev, archivo: e.target.files?.[0] || null }))}
                                    style={{
                                        width: '100%',
                                        padding: '6px',
                                        fontSize: '13px'
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowManualModal(false)}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        backgroundColor: '#e5e7eb',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: '500'
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={subiendoManual}
                                    style={{
                                        flex: 2,
                                        padding: '10px',
                                        backgroundColor: '#2563eb',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    {subiendoManual ? 'Subiendo...' : 'Subir Archivo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============================================
            MODAL PARA EDITAR LICENCIA
            ============================================ */}
            {showLicenseModal && licensingAgencia && (
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
                        backgroundColor: 'white',
                        padding: '24px',
                        borderRadius: '12px',
                        width: '90%',
                        maxWidth: '450px',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                    }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', marginBottom: '12px' }}>
                            📅 Modificar Licencia: {licensingAgencia.nombre}
                        </h3>
                        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', lineHeight: '1.4' }}>
                            Define la fecha de vencimiento de la licencia para esta agencia. Una vez llegada la fecha, el acceso al portal se bloqueará automáticamente. Deja la fecha vacía para habilitar acceso permanente.
                        </p>
                        
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>
                                Fecha de Vencimiento
                            </label>
                            <input
                                type="date"
                                value={licenseDate}
                                onChange={(e) => setLicenseDate(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    outline: 'none',
                                    fontSize: '14px'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => {
                                    setShowLicenseModal(false);
                                    setLicensingAgencia(null);
                                }}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    backgroundColor: '#e5e7eb',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={submitLicenseDate}
                                style={{
                                    flex: 2,
                                    padding: '10px',
                                    backgroundColor: '#2563eb',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                Guardar Licencia
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================
            MODAL DE INFORMACIÓN Y ESTADÍSTICAS DE AGENCIA
            ============================================ */}
            {showAgenciaInfoModal && (
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
                        backgroundColor: 'white',
                        padding: '28px',
                        borderRadius: '12px',
                        width: '90%',
                        maxWidth: '450px',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)',
                        border: '1px solid #cbd5e1'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '19px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>
                                ℹ️ Información: {selectedAgenciaName}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowAgenciaInfoModal(false);
                                    setAgenciaInfoDetails(null);
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '20px',
                                    cursor: 'pointer',
                                    color: '#94a3b8'
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {loadingAgenciaInfo ? (
                            <div style={{ textAlign: 'center', padding: '30px 0' }}>
                                <span style={{ fontSize: '14px', color: '#64748b' }}>Cargando información...</span>
                            </div>
                        ) : agenciaInfoDetails ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ 
                                    padding: '16px', 
                                    backgroundColor: '#f8fafc', 
                                    borderRadius: '8px',
                                    border: '1px solid #f1f5f9'
                                }}>
                                    <span style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                                        Administrador Principal
                                    </span>
                                    <span style={{ display: 'block', fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>
                                        👤 {agenciaInfoDetails.adminName}
                                    </span>
                                    {agenciaInfoDetails.adminEmail && (
                                        <span style={{ display: 'block', fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                                            ✉️ {agenciaInfoDetails.adminEmail}
                                        </span>
                                    )}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div style={{ padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #dcfce7', textAlign: 'center' }}>
                                        <span style={{ display: 'block', fontSize: '24px', marginBottom: '4px' }}>👥</span>
                                        <span style={{ display: 'block', fontSize: '20px', fontWeight: 'bold', color: '#166534' }}>
                                            {agenciaInfoDetails.totalUsuarios}
                                        </span>
                                        <span style={{ fontSize: '12px', color: '#166534', fontWeight: '500' }}>Usuarios</span>
                                    </div>

                                    <div style={{ padding: '16px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #dbeafe', textAlign: 'center' }}>
                                        <span style={{ display: 'block', fontSize: '24px', marginBottom: '4px' }}>🏢</span>
                                        <span style={{ display: 'block', fontSize: '20px', fontWeight: 'bold', color: '#1e40af' }}>
                                            {agenciaInfoDetails.totalAreas}
                                        </span>
                                        <span style={{ fontSize: '12px', color: '#1e40af', fontWeight: '500' }}>Áreas</span>
                                    </div>
                                </div>

                                <div style={{ 
                                    padding: '16px', 
                                    backgroundColor: '#fff7ed', 
                                    borderRadius: '8px', 
                                    border: '1px solid #ffedd5',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '24px' }}>🎫</span>
                                        <div>
                                            <span style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#9a3412' }}>
                                                Tickets Abiertos
                                            </span>
                                            <span style={{ fontSize: '12px', color: '#c2410c' }}>Pendientes de atención</span>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#9a3412', marginRight: '8px' }}>
                                        {agenciaInfoDetails.ticketsAbiertos}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '20px 0', color: '#dc2626' }}>
                                Ocurrió un error al cargar los datos.
                            </div>
                        )}

                        <button
                            onClick={() => {
                                setShowAgenciaInfoModal(false);
                                setAgenciaInfoDetails(null);
                            }}
                            style={{
                                width: '100%',
                                marginTop: '20px',
                                padding: '10px',
                                backgroundColor: '#0f172a',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '600'
                            }}
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminDashboard;