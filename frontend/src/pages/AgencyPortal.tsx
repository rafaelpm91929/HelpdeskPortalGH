import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/axios.config';
import toast from 'react-hot-toast';

interface AgencyPortalProps {
    subdominio: string;
}

interface IAgencia {
    id: number;
    nombre: string;
    subdominio: string;
    colores_primario: string;
    colores_secundario: string;
    logo_url: string | null;
}

export const AgencyPortal: React.FC<AgencyPortalProps> = ({ subdominio }) => {
    console.log('🏢 AgencyPortal montado para:', subdominio);
    const { user, logout } = useAuth();
    const [agencia, setAgencia] = useState<IAgencia | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAgencia = async () => {
            try {
                setLoading(true);
                console.log('🔍 Buscando agencia con subdominio:', subdominio);
                const response = await api.get(`/agencias/subdominio/${subdominio}`);
                console.log('📊 Respuesta:', response.data);
                if (response.data.success) {
                    setAgencia(response.data.data);
                } else {
                    toast.error('Agencia no encontrada');
                }
            } catch (error: any) {
                console.error('❌ Error:', error);
                toast.error(error.response?.data?.error || 'Error al cargar la agencia');
            } finally {
                setLoading(false);
            }
        };

        loadAgencia();
    }, [subdominio]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <p>Cargando portal de {subdominio}...</p>
            </div>
        );
    }

    if (!agencia) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <h2>🏢 Agencia no encontrada</h2>
                <p>El subdominio "{subdominio}" no está registrado.</p>
                <p style={{ fontSize: '12px', color: '#6b7280' }}>
                    Hostname: {window.location.hostname}
                </p>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
            <nav style={{
                backgroundColor: agencia.colores_primario || '#2563eb',
                padding: '16px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: 'white'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>
                        {agencia.nombre}
                    </h1>
                    <span style={{ fontSize: '12px', opacity: 0.7 }}>
                        {agencia.subdominio}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {user ? (
                        <>
                            <span>{user.nombre} {user.apellido}</span>
                            <button
                                onClick={logout}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cerrar sesión
                            </button>
                        </>
                    ) : (
                        <a href="/login" style={{ color: 'white' }}>Iniciar sesión</a>
                    )}
                </div>
            </nav>

            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '24px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
                        Bienvenido al portal de {agencia.nombre}
                    </h2>
                    <p style={{ color: '#6b7280' }}>
                        Este es el portal personalizado para tu agencia.
                    </p>
                    <div style={{
                        marginTop: '24px',
                        padding: '16px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '8px'
                    }}>
                        <p style={{ color: '#6b7280', fontSize: '14px' }}>
                            Aquí aparecerán los tickets de tu agencia.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AgencyPortal;