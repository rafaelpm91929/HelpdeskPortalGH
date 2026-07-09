import React, { useState, useEffect } from 'react';
import { api } from '../api/axios.config';
import toast from 'react-hot-toast';

interface IArea {
    id: number;
    nombre: string;
    descripcion: string;
    activo: boolean;
    fecha_creacion: string;
}

interface AreasManagerProps {
    agenciaId: number;
    colores?: any;
    isDarkMode?: boolean;
}

export const AreasManager: React.FC<AreasManagerProps> = ({ agenciaId, colores, isDarkMode }) => {
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

    const [areas, setAreas] = useState<IArea[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingArea, setEditingArea] = useState<IArea | null>(null);
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: ''
    });

    // ============================================
    // CARGAR ÁREAS
    // ============================================
    const loadAreas = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/areas/${agenciaId}`);
            if (response.data.success) {
                setAreas(response.data.data);
            }
        } catch (error) {
            toast.error('Error al cargar áreas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (agenciaId) {
            loadAreas();
        }
    }, [agenciaId]);

    // ============================================
    // CREAR / ACTUALIZAR ÁREA
    // ============================================
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (editingArea) {
                await api.put(`/areas/${editingArea.id}`, {
                    ...formData,
                    agencia_id: agenciaId
                });
                toast.success('✅ Área actualizada');
            } else {
                await api.post('/areas', {
                    ...formData,
                    agencia_id: agenciaId
                });
                toast.success('✅ Área creada');
            }
            setShowModal(false);
            setEditingArea(null);
            setFormData({ nombre: '', descripcion: '' });
            loadAreas();
        } catch (error: any) {
            toast.error(error.response?.data?.error || '❌ Error al guardar área');
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // ELIMINAR ÁREA
    // ============================================
    const deleteArea = async (id: number) => {
        if (!confirm('¿Eliminar esta área?')) return;
        try {
            await api.delete(`/areas/${id}`);
            toast.success('✅ Área eliminada');
            loadAreas();
        } catch (error) {
            toast.error('❌ Error al eliminar área');
        }
    };

    // ============================================
    // RENDER
    // ============================================
    return (
        <div>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
            }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: c.texto }}>
                    🏢 Áreas de la Agencia
                </h3>
                <button
                    onClick={() => {
                        setEditingArea(null);
                        setFormData({ nombre: '', descripcion: '' });
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
                    + Nueva Área
                </button>
            </div>

            {loading ? (
                <p style={{ color: c.texto }}>Cargando...</p>
            ) : areas.length === 0 ? (
                <div style={{
                    backgroundColor: c.hoverBg,
                    border: '1px solid ' + c.borde,
                    padding: '32px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    color: c.textoMuted
                }}>
                    No hay áreas registradas. Crea una nueva área.
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                    gap: '12px'
                }}>
                    {areas.map((area) => (
                        <div key={area.id} style={{
                            backgroundColor: c.tarjeta,
                            color: c.texto,
                            padding: '16px',
                            borderRadius: '8px',
                            border: '1px solid ' + c.borde,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <div style={{ fontWeight: '500', color: c.texto }}>{area.nombre}</div>
                                {area.descripcion && (
                                    <div style={{ fontSize: '12px', color: c.textoMuted }}>
                                        {area.descripcion}
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <button
                                    onClick={() => {
                                        setEditingArea(area);
                                        setFormData({
                                            nombre: area.nombre,
                                            descripcion: area.descripcion || ''
                                        });
                                        setShowModal(true);
                                    }}
                                    style={{
                                        padding: '4px 10px',
                                        backgroundColor: isDarkMode ? '#1e3a8a' : '#dbeafe',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        color: isDarkMode ? '#3b82f6' : '#1e40af'
                                    }}
                                >
                                    ✏️
                                </button>
                                <button
                                    onClick={() => deleteArea(area.id)}
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
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
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
                    <div style={{
                        backgroundColor: c.tarjeta,
                        color: c.texto,
                        padding: '32px',
                        borderRadius: '12px',
                        maxWidth: '400px',
                        width: '90%',
                        border: '1px solid ' + c.borde
                    }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: c.texto }}>
                            {editingArea ? '✏️ Editar Área' : '+ Nueva Área'}
                        </h2>

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: c.texto }}>
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
                                        border: '1px solid ' + c.borde,
                                        borderRadius: '6px',
                                        outline: 'none',
                                        backgroundColor: c.inputBg,
                                        color: c.inputText
                                    }}
                                    placeholder="Ej: Desarrollo"
                                />
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: c.texto }}>
                                    Descripción
                                </label>
                                <textarea
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid ' + c.borde,
                                        borderRadius: '6px',
                                        outline: 'none',
                                        minHeight: '60px',
                                        resize: 'vertical',
                                        backgroundColor: c.inputBg,
                                        color: c.inputText
                                    }}
                                    placeholder="Descripción del área"
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingArea(null);
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
                                    {loading ? 'Guardando...' : editingArea ? 'Actualizar' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AreasManager;