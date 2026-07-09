import React, { useState, useEffect } from 'react';
import { api } from '../api/axios.config';
import toast from 'react-hot-toast';

// ============================================
// TIPOS
// ============================================
interface IUsuario {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    puesto: string;
    area: string;
    rol: string;
    activo: boolean;
    fecha_creacion: string;
    avatar_url: string | null;
}

interface IArea {
    id: number;
    nombre: string;
}

interface UsuariosProps {
    agenciaId: number;
    colores?: any;
    isDarkMode?: boolean;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const Usuarios: React.FC<UsuariosProps> = ({ agenciaId, colores, isDarkMode }) => {
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

    const [usuarios, setUsuarios] = useState<IUsuario[]>([]);
    const [areas, setAreas] = useState<IArea[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<IUsuario | null>(null);
    const [viewingUser, setViewingUser] = useState<IUsuario | null>(null);
    const [filtro, setFiltro] = useState<'todos' | 'activos' | 'inactivos'>('todos');

    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        email: '',
        password: '',
        telefono: '',
        puesto: '',
        area: '',
        rol: 'usuario'
    });

    // ============================================
    // CARGAR USUARIOS
    // ============================================
    const loadUsuarios = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/auth/users/${agenciaId}`);
            if (response.data.success) {
                setUsuarios(response.data.data);
            }
        } catch (error) {
            toast.error('Error al cargar usuarios');
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // CARGAR ÁREAS
    // ============================================
    const loadAreas = async () => {
        try {
            const response = await api.get(`/areas/${agenciaId}`);
            if (response.data.success) {
                setAreas(response.data.data);
            }
        } catch (error) {
            console.error('Error al cargar áreas:', error);
        }
    };

    useEffect(() => {
        if (agenciaId) {
            loadUsuarios();
            loadAreas();
        }
    }, [agenciaId]);

    // ============================================
    // FILTRAR USUARIOS
    // ============================================
    const usuariosFiltrados = usuarios.filter(user => {
        const search = searchTerm.toLowerCase();
        const matchSearch = 
            user.nombre.toLowerCase().includes(search) ||
            user.apellido.toLowerCase().includes(search) ||
            user.email.toLowerCase().includes(search) ||
            (user.puesto && user.puesto.toLowerCase().includes(search));

        const matchEstado = 
            filtro === 'todos' ||
            (filtro === 'activos' && user.activo) ||
            (filtro === 'inactivos' && !user.activo);

        return matchSearch && matchEstado;
    });

    // ============================================
    // CREAR / ACTUALIZAR USUARIO
    // ============================================
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (editingUser) {
                const updateData: any = {
                    nombre: formData.nombre,
                    apellido: formData.apellido,
                    telefono: formData.telefono,
                    puesto: formData.puesto,
                    area: formData.area
                };
                if (formData.password) {
                    updateData.password = formData.password;
                }
                await api.put(`/auth/users/${editingUser.id}`, updateData);
                toast.success('✅ Usuario actualizado');
            } else {
                await api.post('/auth/users', {
                    nombre: formData.nombre,
                    apellido: formData.apellido,
                    email: formData.email,
                    password: formData.password,
                    telefono: formData.telefono,
                    puesto: formData.puesto,
                    area: formData.area,
                    agencia_id: agenciaId,
                    rol: 'usuario'
                });
                toast.success('✅ Usuario creado');
            }
            setShowModal(false);
            setEditingUser(null);
            resetForm();
            loadUsuarios();
        } catch (error: any) {
            console.error('Error:', error);
            toast.error(error.response?.data?.error || '❌ Error al guardar usuario');
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // ELIMINAR USUARIOS
    // ============================================
    const deleteUsers = async () => {
        if (selectedUsers.length === 0) {
            toast.error('Selecciona al menos un usuario');
            return;
        }
        if (!confirm(`¿Eliminar ${selectedUsers.length} usuario(s)?`)) return;

        try {
            setLoading(true);
            for (const id of selectedUsers) {
                await api.delete(`/auth/users/${id}`);
            }
            toast.success(`✅ ${selectedUsers.length} usuario(s) eliminado(s)`);
            setSelectedUsers([]);
            loadUsuarios();
        } catch (error) {
            toast.error('❌ Error al eliminar usuarios');
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // SELECCIONAR USUARIOS
    // ============================================
    const toggleSelectAll = () => {
        if (selectedUsers.length === usuariosFiltrados.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(usuariosFiltrados.map(u => u.id));
        }
    };

    const toggleSelectUser = (id: number) => {
        setSelectedUsers(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // ============================================
    // RESET FORM
    // ============================================
    const resetForm = () => {
        setFormData({
            nombre: '',
            apellido: '',
            email: '',
            password: '',
            telefono: '',
            puesto: '',
            area: '',
            rol: 'usuario'
        });
        setEditingUser(null);
    };

    // ============================================
    // OBTENER INICIALES DEL USUARIO
    // ============================================
    const getInitials = (nombre: string, apellido: string) => {
        return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
    };

    // ============================================
    // RENDER
    // ============================================
    return (
        <div>
            <style>{`
                .user-modal-card {
                    background-color: ${c.tarjeta} !important;
                    color: ${c.texto} !important;
                    border: 1px solid ${c.borde} !important;
                }
                .user-modal-card label {
                    color: ${c.texto} !important;
                }
                .user-modal-card input, .user-modal-card select, .user-modal-card textarea {
                    background-color: ${c.inputBg} !important;
                    color: ${c.inputText} !important;
                    border: 1px solid ${c.borde} !important;
                }
                .user-modal-info-box {
                    background-color: ${c.hoverBg} !important;
                    color: ${c.texto} !important;
                    border: 1px solid ${c.borde} !important;
                }
            `}</style>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: c.texto }}>
                        👥 Usuarios de la Agencia
                    </h2>
                    <p style={{ color: c.textoMuted, fontSize: '14px' }}>
                        {usuariosFiltrados.length} usuarios encontrados
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {selectedUsers.length > 0 && (
                        <button
                            onClick={deleteUsers}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#dc2626',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            🗑️ Eliminar ({selectedUsers.length})
                        </button>
                    )}
                    <button
                        onClick={() => {
                            resetForm();
                            setEditingUser(null);
                            setShowModal(true);
                        }}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: c.primario,
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        + Nuevo Usuario
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '16px',
                flexWrap: 'wrap',
                alignItems: 'center'
            }}>
                <input
                    type="text"
                    placeholder="🔍 Buscar por nombre, email, puesto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        flex: 1,
                        minWidth: '200px',
                        padding: '8px 12px',
                        border: '1px solid ' + c.borde,
                        borderRadius: '6px',
                        outline: 'none',
                        backgroundColor: c.inputBg,
                        color: c.inputText
                    }}
                />
                <select
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value as any)}
                    style={{
                        padding: '8px 12px',
                        border: '1px solid ' + c.borde,
                        borderRadius: '6px',
                        outline: 'none',
                        backgroundColor: c.inputBg,
                        color: c.inputText
                    }}
                >
                    <option value="todos">Todos</option>
                    <option value="activos">Activos</option>
                    <option value="inactivos">Inactivos</option>
                </select>
            </div>

            {/* Tabla de usuarios */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: c.texto }}>Cargando...</div>
            ) : usuariosFiltrados.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: c.textoMuted }}>
                    No hay usuarios que coincidan con los filtros
                </div>
            ) : (
                <div style={{
                    backgroundColor: c.tarjeta,
                    borderRadius: '8px',
                    overflow: 'auto',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    border: '1px solid ' + c.borde
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                        <thead style={{ backgroundColor: isDarkMode ? '#1e293b' : '#f9fafb' }}>
                            <tr>
                                <th style={{ padding: '12px 16px', width: '40px' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.length === usuariosFiltrados.length && usuariosFiltrados.length > 0}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: c.textoMuted }}>
                                    Usuario
                                </th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: c.textoMuted }}>
                                    Email
                                </th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: c.textoMuted }}>
                                    Puesto
                                </th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: c.textoMuted }}>
                                    Estado
                                </th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: c.textoMuted }}>
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuariosFiltrados.map((user) => (
                                <tr key={user.id} style={{ borderTop: '1px solid ' + c.borde }}>
                                    <td style={{ padding: '12px 16px' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.includes(user.id)}
                                            onChange={() => toggleSelectUser(user.id)}
                                        />
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '50%',
                                                backgroundColor: c.primario,
                                                color: 'white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '14px',
                                                fontWeight: 'bold'
                                            }}>
                                                {getInitials(user.nombre, user.apellido)}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '500', color: c.texto }}>
                                                    {user.nombre} {user.apellido}
                                                </div>
                                                <div style={{ fontSize: '12px', color: c.textoMuted }}>
                                                    {user.rol}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 16px', color: c.textoMuted }}>
                                        {user.email}
                                    </td>
                                    <td style={{ padding: '12px 16px', color: c.texto }}>
                                        {user.puesto || '-'}
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={{
                                            padding: '2px 10px',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            fontWeight: '500',
                                            backgroundColor: user.activo ? (isDarkMode ? '#064e3b' : '#d1fae5') : (isDarkMode ? '#7f1d1d' : '#fee2e2'),
                                            color: user.activo ? (isDarkMode ? '#6ee7b7' : '#065f46') : (isDarkMode ? '#fca5a5' : '#dc2626')
                                        }}>
                                            {user.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                        <button
                                            onClick={() => {
                                                setViewingUser(user);
                                            }}
                                            style={{
                                                padding: '4px 10px',
                                                backgroundColor: isDarkMode ? '#334155' : '#e5e7eb',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                marginRight: '4px',
                                                color: c.texto
                                            }}
                                        >
                                            👁️
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingUser(user);
                                                setFormData({
                                                    nombre: user.nombre,
                                                    apellido: user.apellido,
                                                    email: user.email,
                                                    password: '',
                                                    telefono: user.telefono || '',
                                                    puesto: user.puesto || '',
                                                    area: user.area || '',
                                                    rol: user.rol
                                                });
                                                setShowModal(true);
                                            }}
                                            style={{
                                                padding: '4px 10px',
                                                backgroundColor: '#dbeafe',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                marginRight: '4px',
                                                color: '#1e40af'
                                            }}
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm(`¿Eliminar a ${user.nombre} ${user.apellido}?`)) {
                                                    deleteUsers();
                                                }
                                            }}
                                            style={{
                                                padding: '4px 10px',
                                                backgroundColor: '#fee2e2',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                color: '#dc2626'
                                            }}
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ============================================
            MODAL CREAR/EDITAR USUARIO
            ============================================ */}
            {showModal && (
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
                    <div className="user-modal-card" style={{
                        padding: '32px',
                        borderRadius: '12px',
                        maxWidth: '500px',
                        width: '90%',
                        maxHeight: '90vh',
                        overflow: 'auto'
                    }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: c.texto }}>
                            {editingUser ? '✏️ Editar Usuario' : '+ Nuevo Usuario'}
                        </h2>

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                                    Nombre *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
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
                                    value={formData.apellido}
                                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
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
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        outline: 'none'
                                    }}
                                    disabled={!!editingUser}
                                />
                            </div>

                            {!editingUser && (
                                <div style={{ marginBottom: '12px' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                                        Contraseña *
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            outline: 'none'
                                        }}
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                </div>
                            )}

                            {editingUser && (
                                <div style={{ marginBottom: '12px' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                                        Nueva Contraseña (opcional)
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            outline: 'none'
                                        }}
                                        placeholder="Dejar vacío para no cambiar"
                                    />
                                </div>
                            )}

                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                                    Teléfono
                                </label>
                                <input
                                    type="text"
                                    value={formData.telefono}
                                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
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
                                    Puesto
                                </label>
                                <input
                                    type="text"
                                    value={formData.puesto}
                                    onChange={(e) => setFormData({ ...formData, puesto: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            {/* 🔥 SELECTOR DE ÁREA */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                                    Área
                                </label>
                                <select
                                    value={formData.area}
                                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        outline: 'none',
                                        backgroundColor: 'white'
                                    }}
                                >
                                    <option value="">Seleccionar área</option>
                                    {areas.map((area) => (
                                        <option key={area.id} value={area.nombre}>
                                            {area.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingUser(null);
                                        resetForm();
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        backgroundColor: isDarkMode ? '#334155' : '#e5e7eb',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        color: c.texto
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        flex: 2,
                                        padding: '10px',
                                        backgroundColor: c.primario,
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        opacity: loading ? 0.5 : 1
                                    }}
                                >
                                    {loading ? 'Guardando...' : editingUser ? 'Actualizar' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============================================
            MODAL VER USUARIO
            ============================================ */}
            {viewingUser && (
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
                    <div className="user-modal-card" style={{
                        padding: '32px',
                        borderRadius: '12px',
                        maxWidth: '450px',
                        width: '90%'
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                backgroundColor: c.primario,
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '32px',
                                fontWeight: 'bold',
                                margin: '0 auto'
                            }}>
                                {getInitials(viewingUser.nombre, viewingUser.apellido)}
                            </div>
                            <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '12px', color: c.texto }}>
                                {viewingUser.nombre} {viewingUser.apellido}
                            </h2>
                            <span style={{
                                padding: '2px 10px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '500',
                                backgroundColor: isDarkMode ? '#1e3a8a' : '#dbeafe',
                                color: isDarkMode ? '#3b82f6' : '#1e40af'
                            }}>
                                {viewingUser.rol}
                            </span>
                        </div>

                        <div className="user-modal-info-box" style={{
                            padding: '16px',
                            borderRadius: '8px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                        }}>
                            <div><strong>Email:</strong> {viewingUser.email}</div>
                            <div><strong>Teléfono:</strong> {viewingUser.telefono || '-'}</div>
                            <div><strong>Puesto:</strong> {viewingUser.puesto || '-'}</div>
                            <div><strong>Área:</strong> {viewingUser.area || '-'}</div>
                            <div><strong>Estado:</strong> {viewingUser.activo ? 'Activo' : 'Inactivo'}</div>
                            <div><strong>Fecha registro:</strong> {new Date(viewingUser.fecha_creacion).toLocaleDateString()}</div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                            <button
                                onClick={() => {
                                    setViewingUser(null);
                                }}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    backgroundColor: isDarkMode ? '#334155' : '#e5e7eb',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    color: c.texto
                                }}
                            >
                                Cerrar
                            </button>
                            <button
                                onClick={() => {
                                    const user = viewingUser;
                                    setViewingUser(null);
                                    setEditingUser(user);
                                    setFormData({
                                        nombre: user.nombre,
                                        apellido: user.apellido,
                                        email: user.email,
                                        password: '',
                                        telefono: user.telefono || '',
                                        puesto: user.puesto || '',
                                        area: user.area || '',
                                        rol: user.rol
                                    });
                                    setShowModal(true);
                                }}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    backgroundColor: c.primario,
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                            >
                                ✏️ Editar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Usuarios;