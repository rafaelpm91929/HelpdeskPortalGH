import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/axios.config';
import toast from 'react-hot-toast';
import { logout } from '../utils/logout';
import { PUBLIC_IP, FRONTEND_BASE_URL } from '../config';

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

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const SuperAdminDashboard: React.FC = () => {
    const { user, logout: authLogout } = useAuth();
    const [activeTab, setActiveTab] = useState<'menu' | 'agencias' | 'admins' | 'manuales' | 'licencias'>(() => {
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
    const openLicenseModal = (agencia: IAgencia) => {
        setLicensingAgencia(agencia);
        setLicenseDate(agencia.fecha_licencia ? new Date(agencia.fecha_licencia).toISOString().split('T')[0] : '');
        setShowLicenseModal(true);
    };

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

    const toggleLockAgencia = async (agencia: IAgencia) => {
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
    };

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

    // ============================================
    // CRUD AGENCIAS
    // ============================================
    const loadAgencias = async () => {
        try {
            setLoadingAgencias(true);
            const response = await api.get('/agencias');
            setAgencias(response.data.data);
        } catch (error) {
            toast.error('Error al cargar agencias');
        } finally {
            setLoadingAgencias(false);
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

    const deleteAgencia = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar esta agencia?')) return;
        try {
            await api.delete(`/agencias/${id}`);
            toast.success('✅ Agencia eliminada');
            loadAgencias();
            loadAdmins();
        } catch (error: any) {
            toast.error(error.response?.data?.error || '❌ Error al eliminar agencia');
        }
    };

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

    // ============================================
    // EFECTOS
    // ============================================
    useEffect(() => {
        loadAgencias();
    }, []);

    useEffect(() => {
        if (agencias.length > 0) {
            loadAdmins();
        }
    }, [agencias]);

    // ============================================
    // RENDER
    // ============================================
    return (
        <div style={{ 
            minHeight: '100vh', 
            background: 'radial-gradient(circle at center, #1e3a8a 0%, #090d16 100%) fixed', 
            fontFamily: 'system-ui, -apple-system, sans-serif' 
        }}>
            {/* Navbar */}
            <nav style={{
                backgroundColor: 'white',
                padding: '12px 24px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #e5e7eb'
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
                        border: '1px solid #e5e7eb'
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
                    <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>
                        Super Admin Dashboard
                    </h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                        {user?.nombre} {user?.apellido}
                    </span>
                    <button
                        onClick={() => {
                            authLogout();
                            logout();
                        }}
                        style={{
                            padding: '8px 16px',
                            color: '#dc2626',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600'
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
                        backgroundColor: 'white',
                        padding: '8px',
                        borderRadius: '8px',
                        marginBottom: '24px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}>
                        <button
                            onClick={() => setActiveTab('menu')}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: 'transparent',
                                color: '#475569',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            ⬅️ Menú Principal
                        </button>
                        <button
                            onClick={() => setActiveTab('agencias')}
                            style={{
                                flex: 1,
                                padding: '10px',
                                backgroundColor: activeTab === 'agencias' ? '#2563eb' : 'transparent',
                                color: activeTab === 'agencias' ? 'white' : '#374151',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: '500'
                            }}
                        >
                            🏢 Agencias
                        </button>
                        <button
                            onClick={() => setActiveTab('admins')}
                            style={{
                                flex: 1,
                                padding: '10px',
                                backgroundColor: activeTab === 'admins' ? '#2563eb' : 'transparent',
                                color: activeTab === 'admins' ? 'white' : '#374151',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: '500'
                            }}
                        >
                            👥 Administradores
                        </button>
                        <button
                            onClick={() => setActiveTab('manuales')}
                            style={{
                                flex: 1,
                                padding: '10px',
                                backgroundColor: activeTab === 'manuales' ? '#2563eb' : 'transparent',
                                color: activeTab === 'manuales' ? 'white' : '#374151',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: '500'
                            }}
                        >
                            📄 Manuales
                        </button>
                        <button
                            onClick={() => setActiveTab('licencias')}
                            style={{
                                flex: 1,
                                padding: '10px',
                                backgroundColor: activeTab === 'licencias' ? '#2563eb' : 'transparent',
                                color: activeTab === 'licencias' ? 'white' : '#374151',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: '500'
                            }}
                        >
                            📅 Licencias
                        </button>
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
                        {/* Card Agencias */}
                        <div 
                            onClick={() => setActiveTab('agencias')}
                            style={{
                                backgroundColor: 'white',
                                borderRadius: '12px',
                                padding: '32px 24px',
                                textAlign: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
                                border: '1px solid #e2e8f0',
                                transition: 'all 0.2s ease-in-out',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '16px'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)';
                                e.currentTarget.style.borderColor = '#3b82f6';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)';
                                e.currentTarget.style.borderColor = '#e2e8f0';
                            }}
                        >
                            <div style={{ fontSize: '48px' }}>🏢</div>
                            <div>
                                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>
                                    Agencias
                                </h3>
                                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>
                                    Administra y configura las agencias registradas, carga de logos y personaliza colores.
                                </p>
                            </div>
                            <button style={{
                                marginTop: 'auto',
                                padding: '10px 20px',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                width: '100%'
                            }}>
                                Ingresar
                            </button>
                        </div>

                        {/* Card Administradores */}
                        <div 
                            onClick={() => setActiveTab('admins')}
                            style={{
                                backgroundColor: 'white',
                                borderRadius: '12px',
                                padding: '32px 24px',
                                textAlign: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
                                border: '1px solid #e2e8f0',
                                transition: 'all 0.2s ease-in-out',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '16px'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)';
                                e.currentTarget.style.borderColor = '#3b82f6';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)';
                                e.currentTarget.style.borderColor = '#e2e8f0';
                            }}
                        >
                            <div style={{ fontSize: '48px' }}>👥</div>
                            <div>
                                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>
                                    Administradores
                                </h3>
                                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>
                                    Crea y edita usuarios administradores asignados para gestionar soporte técnico de las agencias.
                                </p>
                            </div>
                            <button style={{
                                marginTop: 'auto',
                                padding: '10px 20px',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                width: '100%'
                            }}>
                                Ingresar
                            </button>
                        </div>

                        {/* Card Manuales */}
                        <div 
                            onClick={() => setActiveTab('manuales')}
                            style={{
                                backgroundColor: 'white',
                                borderRadius: '12px',
                                padding: '32px 24px',
                                textAlign: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
                                border: '1px solid #e2e8f0',
                                transition: 'all 0.2s ease-in-out',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '16px'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)';
                                e.currentTarget.style.borderColor = '#3b82f6';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)';
                                e.currentTarget.style.borderColor = '#e2e8f0';
                            }}
                        >
                            <div style={{ fontSize: '48px' }}>📄</div>
                            <div>
                                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>
                                    Manuales
                                </h3>
                                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>
                                    Sube, descarga y administra los manuales de usuario y guías técnicas en formato PDF.
                                </p>
                            </div>
                            <button style={{
                                marginTop: 'auto',
                                padding: '10px 20px',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                width: '100%'
                            }}>
                                Ingresar
                            </button>
                        </div>

                        {/* Card Licencias */}
                        <div 
                            onClick={() => setActiveTab('licencias')}
                            style={{
                                backgroundColor: 'white',
                                borderRadius: '12px',
                                padding: '32px 24px',
                                textAlign: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
                                border: '1px solid #e2e8f0',
                                transition: 'all 0.2s ease-in-out',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '16px'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)';
                                e.currentTarget.style.borderColor = '#3b82f6';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)';
                                e.currentTarget.style.borderColor = '#e2e8f0';
                            }}
                        >
                            <div style={{ fontSize: '48px' }}>📅</div>
                            <div>
                                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>
                                    Licencias
                                </h3>
                                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>
                                    Administra el vencimiento de licencias de cada portal de ayuda y suspende accesos vencidos.
                                </p>
                            </div>
                            <button style={{
                                marginTop: 'auto',
                                padding: '10px 20px',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                width: '100%'
                            }}>
                                Ingresar
                            </button>
                        </div>
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
                                    backgroundColor: '#2563eb',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                            >
                                + Nueva Agencia
                            </button>
                        </div>

                        {loadingAgencias ? (
                            <p style={{ color: '#f8fafc' }}>Cargando...</p>
                        ) : (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                                gap: '16px'
                            }}>
                                {agencias.map((agencia) => (
                                    <div key={agencia.id} style={{
                                        backgroundColor: 'white',
                                        padding: '24px',
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
                                        border: '1px solid #e2e8f0',
                                        borderLeft: `5px solid ${agencia.colores_primario || '#2563eb'}`,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.02)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)';
                                    }}>
                                        <div>
                                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
                                                {/* Contenedor del logo de la agencia */}
                                                <div style={{
                                                    width: '50px',
                                                    height: '50px',
                                                    borderRadius: '8px',
                                                    backgroundColor: '#f8fafc',
                                                    border: '1px solid #e2e8f0',
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
                                                        color: '#0f172a', 
                                                        fontSize: '18px', 
                                                        margin: 0,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px'
                                                    }}>
                                                        {agencia.nombre}
                                                        {!!agencia.bloqueada && (
                                                            <span style={{
                                                                fontSize: '11px',
                                                                backgroundColor: '#fee2e2',
                                                                color: '#b91c1c',
                                                                padding: '2px 8px',
                                                                borderRadius: '12px',
                                                                fontWeight: 'bold'
                                                            }}>
                                                                🚫 Bloqueada
                                                            </span>
                                                        )}
                                                    </h3>
                                                    <p style={{ fontSize: '14px', color: '#64748b', margin: '2px 0 0 0' }}>
                                                        Subdominio: <strong style={{ color: '#0f172a' }}>{agencia.subdominio}</strong>
                                                    </p>
                                                </div>
                                            </div>

                                            <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span>📅 Creada el {new Date(agencia.fecha_creacion).toLocaleDateString()}</span>
                                                <span>🔗 {`${agencia.subdominio}.${PUBLIC_IP}:5173`}</span>
                                            </div>
                                        </div>

                                        {/* Botones de acción mejorados */}
                                        <div style={{ 
                                            display: 'flex', 
                                            gap: '10px', 
                                            marginTop: '20px', 
                                            paddingTop: '16px', 
                                            borderTop: '1px solid #f1f5f9',
                                            justifyContent: 'flex-end',
                                            flexWrap: 'wrap'
                                        }}>
                                            <button
                                                onClick={() => {
                                                    const url = `http://${PUBLIC_IP}:5173?agencia=${agencia.subdominio}&superadmin=true`;
                                                    window.location.href = url;
                                                }}
                                                style={{
                                                    padding: '8px 16px',
                                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '13px',
                                                    fontWeight: '600',
                                                    boxShadow: '0 2px 4px rgba(109, 40, 217, 0.2)',
                                                    transition: 'all 0.2s'
                                                }}
                                                title="Entrar como Administrador de esta agencia"
                                            >
                                                👑 Entrar como Admin
                                            </button>

                                            <button
                                                onClick={() => toggleLockAgencia(agencia)}
                                                style={{
                                                    padding: '8px 16px',
                                                    background: agencia.bloqueada 
                                                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                                        : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '13px',
                                                    fontWeight: '600',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {agencia.bloqueada ? '🔓 Desbloquear' : '🔒 Bloquear'}
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setEditingAgencia(agencia);
                                                    setAgenciaForm({
                                                        nombre: agencia.nombre,
                                                        subdominio: agencia.subdominio,
                                                        colores_primario: agencia.colores_primario,
                                                        colores_secundario: agencia.colores_secundario
                                                    });
                                                    setShowAgenciaModal(true);
                                                }}
                                                style={{
                                                    padding: '8px 16px',
                                                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                                                    border: '1px solid #cbd5e1',
                                                    color: '#475569',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '13px',
                                                    fontWeight: '500',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                ✏️ Editar
                                            </button>

                                            <button
                                                onClick={() => deleteAgencia(agencia.id)}
                                                style={{
                                                    padding: '8px 16px',
                                                    background: 'linear-gradient(135deg, #fee2e2 0%, #fca5a5 100%)',
                                                    border: '1px solid #fca5a5',
                                                    color: '#b91c1c',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '13px',
                                                    fontWeight: '600',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                🗑️ Eliminar
                                            </button>
                                        </div>
                                    </div>
                                ))}
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
                                    backgroundColor: '#7c3aed',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                            >
                                + Nuevo Admin
                            </button>
                        </div>

                        {loadingAdmins ? (
                            <p style={{ color: '#f8fafc' }}>Cargando...</p>
                        ) : (
                            <div style={{
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ backgroundColor: '#f9fafb' }}>
                                        <tr>
                                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Nombre</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Email</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Agencia</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Rol</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {admins.map((admin) => {
                                            const agencia = agencias.find(a => a.id === admin.agencia_id);
                                            return (
                                                <tr key={admin.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        {admin.nombre} {admin.apellido}
                                                        {admin.id === user.id && (
                                                            <span style={{
                                                                marginLeft: '8px',
                                                                padding: '2px 8px',
                                                                backgroundColor: '#dbeafe',
                                                                borderRadius: '4px',
                                                                fontSize: '10px',
                                                                color: '#1e40af'
                                                            }}>
                                                                Tú
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '12px 16px', color: '#6b7280' }}>{admin.email}</td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <span style={{
                                                            padding: '2px 8px',
                                                            backgroundColor: '#e0e7ff',
                                                            borderRadius: '4px',
                                                            fontSize: '12px',
                                                            color: '#3730a3'
                                                        }}>
                                                            {agencia?.nombre || 'Sin agencia'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <span style={{
                                                            padding: '2px 8px',
                                                            backgroundColor: admin.rol === 'superadmin' ? '#fef3c7' : '#dbeafe',
                                                            borderRadius: '4px',
                                                            fontSize: '12px',
                                                            color: admin.rol === 'superadmin' ? '#92400e' : '#1e40af'
                                                        }}>
                                                            {admin.rol}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                        <button
                                                            onClick={() => openSendKeysModal(admin)}
                                                            style={{
                                                                padding: '4px 12px',
                                                                backgroundColor: '#eff6ff',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                marginRight: '4px',
                                                                color: '#2563eb',
                                                                fontWeight: 'bold'
                                                            }}
                                                            title="Enviar Claves por Correo"
                                                        >
                                                            🔑 Claves
                                                        </button>
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
                                                                padding: '4px 12px',
                                                                backgroundColor: '#e5e7eb',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                marginRight: '4px'
                                                            }}
                                                        >
                                                            ✏️
                                                        </button>
                                                        {admin.id !== user.id && (
                                                            <button
                                                                onClick={() => deleteAdmin(admin.id)}
                                                                style={{
                                                                    padding: '4px 12px',
                                                                    backgroundColor: '#fee2e2',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer',
                                                                    color: '#dc2626'
                                                                }}
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
                                            backgroundColor: 'white',
                                            padding: '20px',
                                            borderRadius: '12px',
                                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                                            border: '1px solid #e2e8f0',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between'
                                        }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                                    <span style={{ fontSize: '32px' }}>📕</span>
                                                    <h3 style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '16px', margin: 0 }}>
                                                        {m.nombre}
                                                    </h3>
                                                </div>
                                                <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px 0' }}>
                                                    Subido el {new Date(m.fecha_creacion).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                                                <a
                                                    href={`http://${PUBLIC_IP}:4000${m.ruta}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        flex: 1,
                                                        padding: '8px',
                                                        backgroundColor: '#eff6ff',
                                                        color: '#2563eb',
                                                        textAlign: 'center',
                                                        textDecoration: 'none',
                                                        borderRadius: '6px',
                                                        fontSize: '13px',
                                                        fontWeight: '600',
                                                        display: 'inline-block'
                                                    }}
                                                >
                                                    ⬇️ Descargar PDF
                                                </a>
                                                <button
                                                    onClick={() => deleteManual(m.id)}
                                                    style={{
                                                        padding: '8px 12px',
                                                        backgroundColor: '#fee2e2',
                                                        color: '#b91c1c',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '13px',
                                                        fontWeight: '600'
                                                    }}
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

                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                            border: '1px solid #e2e8f0',
                            overflow: 'hidden'
                        }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                        <th style={{ padding: '16px', color: '#475569', fontWeight: '600' }}>Agencia</th>
                                        <th style={{ padding: '16px', color: '#475569', fontWeight: '600' }}>Subdominio</th>
                                        <th style={{ padding: '16px', color: '#475569', fontWeight: '600' }}>Expiración de Licencia</th>
                                        <th style={{ padding: '16px', color: '#475569', fontWeight: '600' }}>Estado</th>
                                        <th style={{ padding: '16px', color: '#475569', fontWeight: '600', textAlign: 'center' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {agencias.map((agencia) => {
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
                                    disabled={!!editingAdmin}
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
        </div>
    );
};

export default SuperAdminDashboard;