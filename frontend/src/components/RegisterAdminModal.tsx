import React, { useState } from 'react';
import { api } from '../api/axios.config';
import toast from 'react-hot-toast';

interface RegisterAdminModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    agenciaId: number;
}

export const RegisterAdminModal: React.FC<RegisterAdminModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    agenciaId
}) => {
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        email: '',
        password: '',
        confirmPassword: '',
        agencia_id: agenciaId,
        rol: 'admin'
    });
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        if (formData.password.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        try {
            setLoading(true);
            
            const response = await api.post('/auth/register-first-admin', {
                nombre: formData.nombre,
                apellido: formData.apellido,
                email: formData.email,
                password: formData.password,
                agencia_id: formData.agencia_id,
                rol: 'admin'
            });

            if (response.data.success) {
                toast.success('✅ Administrador creado exitosamente');
                setFormData({
                    nombre: '',
                    apellido: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    agencia_id: agenciaId,
                    rol: 'admin'
                });
                onSuccess();
                onClose();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || '❌ Error al crear administrador');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '32px',
                maxWidth: '500px',
                width: '90%',
                maxHeight: '90vh',
                overflow: 'auto',
                position: 'relative'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '12px',
                        right: '16px',
                        fontSize: '24px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#6b7280'
                    }}
                >
                    ×
                </button>

                <h2 style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#111827',
                    marginBottom: '8px'
                }}>
                    👑 Crear Administrador
                </h2>
                <p style={{
                    color: '#6b7280',
                    marginBottom: '24px',
                    fontSize: '14px'
                }}>
                    Completa los datos para crear el primer administrador
                </p>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '4px'
                        }}>
                            Nombre *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                outline: 'none',
                                fontSize: '14px'
                            }}
                            placeholder="Ej: Juan"
                        />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '4px'
                        }}>
                            Apellido *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.apellido}
                            onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                outline: 'none',
                                fontSize: '14px'
                            }}
                            placeholder="Ej: Pérez"
                        />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '4px'
                        }}>
                            Email *
                        </label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                outline: 'none',
                                fontSize: '14px'
                            }}
                            placeholder="admin@techcorp.local"
                        />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '4px'
                        }}>
                            Contraseña *
                        </label>
                        <input
                            type="password"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                outline: 'none',
                                fontSize: '14px'
                            }}
                            placeholder="Mínimo 6 caracteres"
                        />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '4px'
                        }}>
                            Confirmar Contraseña *
                        </label>
                        <input
                            type="password"
                            required
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                outline: 'none',
                                fontSize: '14px'
                            }}
                            placeholder="Repite la contraseña"
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                flex: 1,
                                padding: '10px',
                                backgroundColor: '#e5e7eb',
                                color: '#374151',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: 'pointer'
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
                                backgroundColor: '#7c3aed',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                opacity: loading ? 0.5 : 1
                            }}
                        >
                            {loading ? 'Creando...' : '👑 Crear Administrador'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};