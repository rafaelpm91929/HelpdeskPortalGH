import React, { useState, useEffect } from 'react';
import { api } from '../api/axios.config';
import toast from 'react-hot-toast';
import { AreasManager } from './AreasManager';
import { IMAGE_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';

interface ConfiguracionProps {
    agenciaId: number;
    subdominio?: string;
    temaUsuario?: string;
    setTemaUsuario?: (val: string) => void;
    onSave?: () => void;
}

export const Configuracion: React.FC<ConfiguracionProps> = ({ agenciaId, subdominio, temaUsuario, setTemaUsuario, onSave }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [activeSection, setActiveSection] = useState<'portal' | 'ticket' | 'cuenta' | 'areas'>(() => {
        return (localStorage.getItem(`config_section_${agenciaId}`) as any) || 'portal';
    });

    useEffect(() => {
        localStorage.setItem(`config_section_${agenciaId}`, activeSection);
    }, [activeSection, agenciaId]);
    const [agenciaData, setAgenciaData] = useState<any>(null);
    
    const [configPortal, setConfigPortal] = useState<{
        colores_primario: string;
        colores_secundario: string;
        colores_fondo: string;
        colores_texto: string;
        logo_url: string;
        tema_defecto: string;
        tipos_ticket: string[];
    }>({
        colores_primario: '#2563eb',
        colores_secundario: '#3b82f6',
        colores_fondo: '#f3f4f6',
        colores_texto: '#1f2937',
        logo_url: '',
        tema_defecto: 'claro',
        tipos_ticket: ['problema', 'solicitud', 'consulta', 'queja', 'otro']
    });

    const [configCuenta, setConfigCuenta] = useState({
        currentPassword: '',
        password: '',
        confirmPassword: ''
    });

    const [nuevoTipo, setNuevoTipo] = useState('');

    const [manuales, setManuales] = useState<any[]>([]);
    const [loadingManuales, setLoadingManuales] = useState(false);

    const loadManuales = async () => {
        try {
            setLoadingManuales(true);
            const response = await api.get('/manuales');
            if (response.data.success) {
                setManuales(response.data.data);
            }
        } catch (error) {
            console.error('Error al cargar manuales:', error);
        } finally {
            setLoadingManuales(false);
        }
    };

    useEffect(() => {
        if (activeSection === 'cuenta') {
            loadManuales();
        }
    }, [activeSection]);

    const isDarkMode = temaUsuario === 'oscuro' || (temaUsuario === 'agencia' && configPortal.tema_defecto === 'oscuro');
    const colores = {
        primario: configPortal.colores_primario || '#2563eb',
        secundario: configPortal.colores_secundario || '#3b82f6',
        fondo: isDarkMode ? '#0f172a' : '#f3f4f6',
        texto: isDarkMode ? '#f8fafc' : '#1f2937',
        tarjeta: isDarkMode ? '#1e293b' : '#ffffff',
        borde: isDarkMode ? '#334155' : '#e5e7eb',
        inputBg: isDarkMode ? '#1e293b' : '#ffffff',
        inputText: isDarkMode ? '#ffffff' : '#1f2937',
        textoMuted: isDarkMode ? '#94a3b8' : '#6b7280',
        hoverBg: isDarkMode ? '#334155' : '#f9fafb'
    };

    // Cargar datos de la agencia
    useEffect(() => {
        const loadAgencia = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/agencias/${agenciaId}`);
                if (response.data.success) {
                    const data = response.data.data;
                    setAgenciaData(data);
                    
                    // 🔥 Usar IMAGE_BASE_URL para el logo
                    const logoUrl = data.logo_url ? 
                        (data.logo_url.startsWith('http') ? data.logo_url : `${IMAGE_BASE_URL}${data.logo_url}`) : 
                        '';
                    
                    const [fondoColor, tema] = (data.colores_fondo || '#f3f4f6').split('|');
                    const [textoColor, tiposRaw] = (data.colores_texto || '#1f2937').split('|');
                    const tipos = tiposRaw ? tiposRaw.split(',') : ['problema', 'solicitud', 'consulta', 'queja', 'otro'];
                    setConfigPortal({
                        colores_primario: data.colores_primario || '#2563eb',
                        colores_secundario: data.colores_secundario || '#3b82f6',
                        colores_fondo: fondoColor || '#f3f4f6',
                        colores_texto: textoColor || '#1f2937',
                        logo_url: logoUrl,
                        tema_defecto: tema || 'claro',
                        tipos_ticket: tipos
                    });
                }
            } catch (error) {
                toast.error('Error al cargar configuración');
            } finally {
                setLoading(false);
            }
        };
        loadAgencia();
    }, [agenciaId]);

    // Guardar configuración del portal
    const handleSavePortal = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const response = await api.put(`/agencias/${agenciaId}`, {
                colores_primario: configPortal.colores_primario,
                colores_secundario: configPortal.colores_secundario,
                colores_fondo: `${configPortal.colores_fondo}|${configPortal.tema_defecto}`,
                colores_texto: `${configPortal.colores_texto}|${configPortal.tipos_ticket.join(',')}`
            });
            if (response.data.success) {
                toast.success('✅ Configuración del portal actualizada');
                setAgenciaData(response.data.data);
                if (onSave) onSave();
            }
        } catch (error) {
            toast.error('❌ Error al guardar configuración');
        } finally {
            setLoading(false);
        }
    };

    // Cambiar contraseña
    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (configCuenta.password !== configCuenta.confirmPassword) {
            toast.error('❌ Las contraseñas no coinciden');
            return;
        }

        if (configCuenta.password.length < 6) {
            toast.error('❌ La contraseña debe tener al menos 6 caracteres');
            return;
        }

        if (!configCuenta.currentPassword) {
            toast.error('❌ Ingresa tu contraseña actual');
            return;
        }

        try {
            setLoading(true);
            const response = await api.put('/auth/change-password', {
                currentPassword: configCuenta.currentPassword,
                newPassword: configCuenta.password
            });
            
            if (response.data.success) {
                toast.success('✅ Contraseña actualizada correctamente');
                setConfigCuenta({
                    currentPassword: '',
                    password: '',
                    confirmPassword: ''
                });
            } else {
                toast.error(response.data.error || '❌ Error al cambiar contraseña');
            }
        } catch (error: any) {
            console.error('Error al cambiar contraseña:', error);
            toast.error(error.response?.data?.error || '❌ Error al cambiar contraseña');
        } finally {
            setLoading(false);
        }
    };

    // Subir logo
    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        console.log('📤 Subiendo logo para agencia:', agenciaId);

        const formData = new FormData();
        formData.append('logo', file);

        try {
            setLoading(true);
            const response = await api.post(`/upload/logo/${agenciaId}`, formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            console.log('📤 Respuesta:', response.data);
            
            if (response.data.success) {
                const logoUrl = response.data.url;
                setConfigPortal({ ...configPortal, logo_url: logoUrl });
                toast.success('✅ Logo subido correctamente');
                
                // Recargar datos
                const agenciaResponse = await api.get(`/agencias/${agenciaId}`);
                if (agenciaResponse.data.success) {
                    setAgenciaData(agenciaResponse.data.data);
                }
                if (onSave) onSave();
            }
        } catch (error: any) {
            console.error('❌ Error al subir logo:', error);
            toast.error(error.response?.data?.error || '❌ Error al subir logo');
        } finally {
            setLoading(false);
        }
    };

    // Vista previa del portal
    const VistaPreviaPortal = () => (
        <div style={{
            backgroundColor: configPortal.colores_fondo || '#f3f4f6',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            marginTop: '12px'
        }}>
            <div style={{
                backgroundColor: configPortal.colores_primario || '#2563eb',
                padding: '12px 20px',
                borderRadius: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: 'white'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {configPortal.logo_url ? (
                        <img src={configPortal.logo_url} alt="Logo" style={{ height: '30px' }} />
                    ) : (
                        <span>🏢</span>
                    )}
                    <span style={{ fontWeight: 'bold' }}>
                        {agenciaData?.nombre || 'Mi Agencia'}
                    </span>
                </div>
                <span style={{ fontSize: '12px', opacity: 0.8 }}>Portal de ayuda</span>
            </div>
            <div style={{
                padding: '16px',
                backgroundColor: 'white',
                borderRadius: '6px',
                marginTop: '8px',
                color: configPortal.colores_texto || '#1f2937'
            }}>
                <p style={{ fontWeight: 'bold' }}>Vista previa del portal</p>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>
                    Así se verá el portal con los colores seleccionados.
                </p>
                <button style={{
                    backgroundColor: configPortal.colores_secundario || '#3b82f6',
                    color: 'white',
                    padding: '6px 16px',
                    border: 'none',
                    borderRadius: '4px',
                    marginTop: '8px',
                    cursor: 'pointer'
                }}>
                    Botón de ejemplo
                </button>
            </div>
        </div>
    );

    const renderSeccion = () => {
        switch (activeSection) {
            case 'portal':
                return (
                    <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                            🎨 Personalización del Portal
                        </h3>
                        <form onSubmit={handleSavePortal}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                                        Color Primario
                                    </label>
                                    <input
                                        type="color"
                                        value={configPortal.colores_primario}
                                        onChange={(e) => setConfigPortal({ ...configPortal, colores_primario: e.target.value })}
                                        style={{ width: '100%', height: '40px', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                                        Color Secundario
                                    </label>
                                    <input
                                        type="color"
                                        value={configPortal.colores_secundario}
                                        onChange={(e) => setConfigPortal({ ...configPortal, colores_secundario: e.target.value })}
                                        style={{ width: '100%', height: '40px', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                                        Color de Fondo
                                    </label>
                                    <input
                                        type="color"
                                        value={configPortal.colores_fondo}
                                        onChange={(e) => setConfigPortal({ ...configPortal, colores_fondo: e.target.value })}
                                        style={{ width: '100%', height: '40px', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                                        Color de Texto
                                    </label>
                                    <input
                                        type="color"
                                        value={configPortal.colores_texto}
                                        onChange={(e) => setConfigPortal({ ...configPortal, colores_texto: e.target.value })}
                                        style={{ width: '100%', height: '40px', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                                        Tema Predeterminado del Portal
                                    </label>
                                    <select
                                        value={configPortal.tema_defecto}
                                        onChange={(e) => setConfigPortal({ ...configPortal, tema_defecto: e.target.value })}
                                        style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: 'white', outline: 'none' }}
                                    >
                                        <option value="claro">☀️ Claro</option>
                                        <option value="oscuro">🌙 Oscuro</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginTop: '16px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                                    Logo de la Agencia
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                                />
                                {configPortal.logo_url && (
                                    <div style={{ marginTop: '8px' }}>
                                        <img src={configPortal.logo_url} alt="Logo" style={{ height: '50px', borderRadius: '4px' }} />
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    marginTop: '16px',
                                    padding: '10px 24px',
                                    backgroundColor: '#2563eb',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }}
                            >
                                {loading ? 'Guardando...' : '💾 Guardar Cambios'}
                            </button>
                        </form>

                        <VistaPreviaPortal />
                    </div>
                );

            case 'ticket':
                const handleRemoveTipo = (tipoToRemove: string) => {
                    if (configPortal.tipos_ticket.length <= 1) {
                        toast.error('Debes tener al menos un tipo de ticket.');
                        return;
                    }
                    setConfigPortal({
                        ...configPortal,
                        tipos_ticket: configPortal.tipos_ticket.filter(t => t !== tipoToRemove)
                    });
                };

                const handleAddTipo = (e: React.FormEvent) => {
                    e.preventDefault();
                    const cleanTipo = nuevoTipo.trim().toLowerCase();
                    if (!cleanTipo) return;
                    if (configPortal.tipos_ticket.includes(cleanTipo)) {
                        toast.error('Este tipo ya existe.');
                        return;
                    }
                    setConfigPortal({
                        ...configPortal,
                        tipos_ticket: [...configPortal.tipos_ticket, cleanTipo]
                    });
                    setNuevoTipo('');
                };

                const handleSaveTipos = async () => {
                    try {
                        setLoading(true);
                        const response = await api.put(`/agencias/${agenciaId}`, {
                            colores_primario: configPortal.colores_primario,
                            colores_secundario: configPortal.colores_secundario,
                            colores_fondo: `${configPortal.colores_fondo}|${configPortal.tema_defecto}`,
                            colores_texto: `${configPortal.colores_texto}|${configPortal.tipos_ticket.join(',')}`
                        });
                        if (response.data.success) {
                            toast.success('🎯 Tipos de ticket actualizados correctamente');
                        }
                    } catch (error) {
                        toast.error('Error al guardar los tipos de ticket');
                    } finally {
                        setLoading(false);
                    }
                };

                return (
                    <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                            🎫 Configuración de Tickets
                        </h3>
                        <p style={{ color: '#6b7280', marginBottom: '16px' }}>
                            Personaliza los tipos de ticket que los usuarios pueden reportar en su portal.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
                            {/* Editor de Tipos */}
                            <div style={{
                                backgroundColor: colores.hoverBg,
                                padding: '20px',
                                borderRadius: '8px',
                                border: '1px solid ' + colores.borde
                            }}>
                                <h4 style={{ fontWeight: 'bold', marginBottom: '12px' }}>Gestión de Tipos</h4>
                                
                                <form onSubmit={handleAddTipo} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                    <input
                                        type="text"
                                        placeholder="Nuevo tipo (ej: garantía)"
                                        value={nuevoTipo}
                                        onChange={(e) => setNuevoTipo(e.target.value)}
                                        style={{ flex: 1, padding: '8px 12px', border: '1px solid ' + colores.borde, borderRadius: '6px', fontSize: '14px', backgroundColor: colores.inputBg, color: colores.inputText }}
                                    />
                                    <button
                                        type="submit"
                                        style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
                                    >
                                        + Agregar
                                    </button>
                                </form>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                                    {configPortal.tipos_ticket.map((tipo) => (
                                        <div key={tipo} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '8px 12px',
                                            backgroundColor: colores.tarjeta,
                                            border: '1px solid ' + colores.borde,
                                            borderRadius: '6px',
                                            color: colores.texto
                                        }}>
                                            <span style={{ fontSize: '14px', fontWeight: '500', textTransform: 'capitalize' }}>
                                                {tipo}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTipo(tipo)}
                                                style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '14px' }}
                                                title="Eliminar tipo"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={handleSaveTipos}
                                    disabled={loading}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        backgroundColor: '#10b981',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        opacity: loading ? 0.7 : 1
                                    }}
                                >
                                    {loading ? 'Guardando...' : '💾 Guardar Tipos de Ticket'}
                                </button>
                            </div>

                            {/* Vista Previa */}
                            <div style={{
                                backgroundColor: colores.hoverBg,
                                padding: '20px',
                                borderRadius: '8px',
                                border: '1px solid ' + colores.borde,
                                color: colores.texto
                            }}>
                                <h4 style={{ fontWeight: 'bold', marginBottom: '12px' }}>Vista previa del formulario de usuario</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '13px', color: colores.textoMuted }}>Asunto</label>
                                    <input
                                        type="text"
                                        placeholder="Asunto del ticket"
                                        disabled
                                        style={{ padding: '8px', border: '1px solid ' + colores.borde, borderRadius: '4px', backgroundColor: isDarkMode ? '#1e293b' : '#e5e7eb', color: colores.textoMuted }}
                                    />
                                    
                                    <label style={{ fontSize: '13px', color: colores.textoMuted, marginTop: '4px' }}>Tipo *</label>
                                    <select style={{ padding: '8px', border: '1px solid ' + colores.borde, borderRadius: '4px', backgroundColor: colores.inputBg, color: colores.inputText }}>
                                        {configPortal.tipos_ticket.map((tipo) => (
                                            <option key={tipo} value={tipo}>
                                                {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                    
                                    <label style={{ fontSize: '13px', color: colores.textoMuted, marginTop: '4px' }}>Prioridad</label>
                                    <select disabled style={{ padding: '8px', border: '1px solid ' + colores.borde, borderRadius: '4px', backgroundColor: isDarkMode ? '#1e293b' : '#e5e7eb', color: colores.textoMuted }}>
                                        <option>Prioridad</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'cuenta':
                return (
                    <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                            👤 Configuración de Cuenta
                        </h3>

                        <div style={{
                            backgroundColor: colores.hoverBg,
                            padding: '16px',
                            borderRadius: '8px',
                            border: '1px solid ' + colores.borde,
                            marginBottom: '16px',
                            color: colores.texto
                        }}>
                            <h4 style={{ fontWeight: 'bold', marginBottom: '8px', color: colores.texto }}>Datos de la Agencia y Cuenta</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '14px', color: colores.textoMuted }}>Agencia</label>
                                    <p style={{ fontWeight: '500', color: colores.texto }}>{agenciaData?.nombre || '-'}</p>
                                </div>
                                <div>
                                    <label style={{ fontSize: '14px', color: colores.textoMuted }}>Subdominio</label>
                                    <p style={{ fontWeight: '500', color: colores.texto }}>{agenciaData?.subdominio || '-'}</p>
                                </div>
                                <div>
                                    <label style={{ fontSize: '14px', color: colores.textoMuted }}>Administrador</label>
                                    <p style={{ fontWeight: '500', color: colores.texto }}>{user?.nombre} {user?.apellido}</p>
                                </div>
                                <div>
                                    <label style={{ fontSize: '14px', color: colores.textoMuted }}>Email de Admin</label>
                                    <p style={{ fontWeight: '500', color: colores.texto }}>{user?.email || '-'}</p>
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ fontSize: '14px', color: colores.textoMuted }}>Vencimiento de Licencia</label>
                                    <p style={{ 
                                        fontWeight: 'bold', 
                                        color: agenciaData?.fecha_licencia && new Date(agenciaData.fecha_licencia).getTime() < Date.now() ? '#ef4444' : '#10b981'
                                    }}>
                                        {agenciaData?.fecha_licencia 
                                            ? new Date(agenciaData.fecha_licencia).toLocaleDateString() 
                                            : 'Licencia Permanente o Sin Asignar'}
                                    </p>
                                </div>
                            </div>

                            <div style={{ marginTop: '16px', borderTop: '1px solid ' + colores.borde, paddingTop: '16px' }}>
                                <label style={{ fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                                    🌓 Tema de tu Dashboard (Administrador)
                                </label>
                                <select
                                    value={temaUsuario || 'agencia'}
                                    onChange={(e) => setTemaUsuario?.(e.target.value)}
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
                                    <option value="agencia">Por defecto de la Agencia ({configPortal.tema_defecto === 'oscuro' ? 'Oscuro' : 'Claro'})</option>
                                    <option value="claro">☀️ Claro</option>
                                    <option value="oscuro">🌙 Oscuro</option>
                                </select>
                            </div>

                            {/* SECCIÓN DE SOPORTE Y MANUALES PARA ADMINS */}
                            <div style={{ marginTop: '24px', borderTop: '1px solid ' + colores.borde, paddingTop: '16px', color: colores.texto }}>
                                <h4 style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '15px' }}>📞 Soporte Técnico y Renovaciones</h4>
                                <p style={{ fontSize: '13px', color: colores.textoMuted, lineHeight: '1.4' }}>
                                    Para dudas, soporte técnico, renovaciones de licencia o aclaraciones del portal corporativo, contacte al administrador general en:
                                </p>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginTop: '8px',
                                    marginBottom: '16px',
                                    padding: '10px 14px',
                                    backgroundColor: colores.tarjeta,
                                    borderRadius: '6px',
                                    border: '1px solid ' + colores.borde,
                                    width: 'fit-content'
                                }}>
                                    <span style={{ fontSize: '18px' }}>✉️</span>
                                    <a 
                                        href="mailto:helpdesk@grupohuerta.mx" 
                                        style={{ 
                                            color: colores.primario, 
                                            fontWeight: 'bold', 
                                            textDecoration: 'none',
                                            fontSize: '14px'
                                        }}
                                    >
                                        helpdesk@grupohuerta.mx
                                    </a>
                                </div>

                                <h4 style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '15px', borderTop: '1px solid ' + colores.borde, paddingTop: '16px' }}>
                                    📕 Manuales y Guías
                                </h4>
                                {loadingManuales ? (
                                    <p style={{ fontSize: '13px', color: colores.textoMuted }}>Cargando manuales...</p>
                                ) : manuales.length === 0 ? (
                                    <p style={{ fontSize: '13px', color: colores.textoMuted }}>No hay manuales cargados actualmente.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                                        {manuales.map((m) => (
                                            <div key={m.id} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '10px 12px',
                                                backgroundColor: colores.tarjeta,
                                                borderRadius: '6px',
                                                border: '1px solid ' + colores.borde
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '20px' }}>📄</span>
                                                    <div>
                                                        <div style={{ fontSize: '13px', fontWeight: '500', color: colores.texto }}>{m.nombre}</div>
                                                        <div style={{ fontSize: '11px', color: colores.textoMuted }}>{new Date(m.fecha_creacion).toLocaleDateString()}</div>
                                                    </div>
                                                </div>
                                                <a
                                                    href={m.ruta.startsWith('http') ? m.ruta : `${IMAGE_BASE_URL.replace('/uploads', '')}${m.ruta}`}
                                                    download
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        padding: '4px 10px',
                                                        backgroundColor: colores.primario,
                                                        color: 'white',
                                                        borderRadius: '4px',
                                                        fontSize: '12px',
                                                        textDecoration: 'none',
                                                        fontWeight: '600'
                                                    }}
                                                >
                                                    Descargar
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <form onSubmit={handleChangePassword}>
                            <h4 style={{ fontWeight: 'bold', marginBottom: '8px' }}>Cambiar contraseña</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <input
                                    type="password"
                                    placeholder="Contraseña actual *"
                                    value={configCuenta.currentPassword}
                                    onChange={(e) => setConfigCuenta({ ...configCuenta, currentPassword: e.target.value })}
                                    style={{ 
                                        padding: '10px 12px', 
                                        border: '1px solid ' + colores.borde, 
                                        borderRadius: '6px',
                                        outline: 'none',
                                        fontSize: '14px',
                                        backgroundColor: colores.inputBg,
                                        color: colores.inputText
                                    }}
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder="Nueva contraseña *"
                                    value={configCuenta.password}
                                    onChange={(e) => setConfigCuenta({ ...configCuenta, password: e.target.value })}
                                    style={{ 
                                        padding: '10px 12px', 
                                        border: '1px solid ' + colores.borde, 
                                        borderRadius: '6px',
                                        outline: 'none',
                                        fontSize: '14px',
                                        backgroundColor: colores.inputBg,
                                        color: colores.inputText
                                    }}
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder="Confirmar nueva contraseña *"
                                    value={configCuenta.confirmPassword}
                                    onChange={(e) => setConfigCuenta({ ...configCuenta, confirmPassword: e.target.value })}
                                    style={{ 
                                        padding: '10px 12px', 
                                        border: '1px solid ' + colores.borde, 
                                        borderRadius: '6px',
                                        outline: 'none',
                                        fontSize: '14px',
                                        backgroundColor: colores.inputBg,
                                        color: colores.inputText
                                    }}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    marginTop: '12px',
                                    padding: '10px 24px',
                                    backgroundColor: '#2563eb',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    opacity: loading ? 0.5 : 1
                                }}
                            >
                                {loading ? 'Actualizando...' : '🔑 Cambiar contraseña'}
                            </button>
                        </form>
                    </div>
                );

            case 'areas':
                return (
                    <AreasManager 
                        agenciaId={agenciaId} 
                        colores={colores}
                        isDarkMode={isDarkMode}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div style={{
            backgroundColor: colores.tarjeta,
            color: colores.texto,
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            border: '1px solid ' + colores.borde
        }}>
            {/* Submenú */}
            <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '24px',
                borderBottom: '1px solid ' + colores.borde,
                paddingBottom: '12px',
                flexWrap: 'wrap'
            }}>
                <button
                    onClick={() => setActiveSection('portal')}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: activeSection === 'portal' ? '#2563eb' : 'transparent',
                        color: activeSection === 'portal' ? 'white' : colores.texto,
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: activeSection === 'portal' ? '500' : '400'
                    }}
                >
                    🎨 Portal
                </button>
                <button
                    onClick={() => setActiveSection('ticket')}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: activeSection === 'ticket' ? '#2563eb' : 'transparent',
                        color: activeSection === 'ticket' ? 'white' : colores.texto,
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: activeSection === 'ticket' ? '500' : '400'
                    }}
                >
                    🎫 Ticket
                </button>
                <button
                    onClick={() => setActiveSection('cuenta')}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: activeSection === 'cuenta' ? '#2563eb' : 'transparent',
                        color: activeSection === 'cuenta' ? 'white' : colores.texto,
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: activeSection === 'cuenta' ? '500' : '400'
                    }}
                >
                    👤 Cuenta
                </button>
                <button
                    onClick={() => setActiveSection('areas')}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: activeSection === 'areas' ? '#2563eb' : 'transparent',
                        color: activeSection === 'areas' ? 'white' : colores.texto,
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: activeSection === 'areas' ? '500' : '400'
                    }}
                >
                    🏢 Áreas
                </button>
            </div>

            {renderSeccion()}
        </div>
    );
};

export default Configuracion;