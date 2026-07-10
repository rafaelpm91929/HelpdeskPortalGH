import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/axios.config';
import toast from 'react-hot-toast';
import { IMAGE_BASE_URL } from '../config';

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
    const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setMousePosition({ x, y });
    };

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
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                background: 'radial-gradient(circle at center, #1e3a8a 0%, #090d16 100%)',
                color: 'white',
                fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
                <p>Cargando portal de {subdominio}...</p>
            </div>
        );
    }

    if (!agencia) {
        return (
            <div style={{ 
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(circle at center, #1e3a8a 0%, #090d16 100%)',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                color: 'white',
                padding: '20px'
            }}>
                <div style={{
                    maxWidth: '400px',
                    width: '90%',
                    padding: '40px 32px',
                    backgroundColor: 'rgba(15, 23, 42, 0.7)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    textAlign: 'center'
                }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>🏢 Agencia no encontrada</h2>
                    <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>
                        El subdominio "{subdominio}" no está registrado.
                    </p>
                    <button
                        onClick={() => window.location.href = '/login'}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                            transition: 'all 0.2s'
                        }}
                    >
                        Volver al Portal
                    </button>
                </div>
            </div>
        );
    }

    // Si tiene logo, construimos la URL usando IMAGE_BASE_URL
    const logoSrc = agencia.logo_url 
        ? (agencia.logo_url.startsWith('http') ? agencia.logo_url : `${IMAGE_BASE_URL}${agencia.logo_url}`)
        : null;

    return (
        <div
            onMouseMove={handleMouseMove}
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(circle at center, #1e3a8a 0%, #090d16 100%)',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Animación de olas con movimiento del mouse */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                overflow: 'hidden',
                pointerEvents: 'none'
            }}>
                {/* Ola 1 - Principal */}
                <div style={{
                    position: 'absolute',
                    width: '200%',
                    height: '200%',
                    top: '-50%',
                    left: '-50%',
                    background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
                        rgba(96, 165, 250, 0.15) 0%,
                        rgba(37, 99, 235, 0.08) 25%,
                        transparent 60%
                    )`,
                    animation: 'waveFloat 8s ease-in-out infinite',
                    transform: `translate(${(mousePosition.x - 50) * 0.02}%, ${(mousePosition.y - 50) * 0.02}%)`,
                    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }} />

                {/* Ola 2 - Secundaria */}
                <div style={{
                    position: 'absolute',
                    width: '200%',
                    height: '200%',
                    top: '-50%',
                    left: '-50%',
                    background: `radial-gradient(circle at ${100 - mousePosition.x}% ${100 - mousePosition.y}%, 
                        rgba(147, 197, 253, 0.1) 0%,
                        rgba(59, 130, 246, 0.05) 30%,
                        transparent 65%
                    )`,
                    animation: 'waveFloat 10s ease-in-out infinite reverse',
                    transform: `translate(${(50 - mousePosition.x) * 0.015}%, ${(50 - mousePosition.y) * 0.015}%)`,
                    transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }} />
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                @keyframes waveFloat {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-10px) scale(1.01); }
                }
                .portal-card::before {
                    content: '';
                    position: absolute;
                    top: -2px;
                    left: -2px;
                    right: -2px;
                    bottom: -2px;
                    border-radius: 18px;
                    background: linear-gradient(45deg, 
                        rgba(96, 165, 250, 0.1),
                        rgba(59, 130, 246, 0.2),
                        rgba(96, 165, 250, 0.1)
                    );
                    z-index: -1;
                }
                .btn-login:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
                    background: linear-gradient(135deg, #60a5fa 0%, #2563eb 100%) !important;
                }
                .btn-login:active {
                    transform: translateY(0);
                }
            `}} />

            <div
                className="portal-card"
                style={{
                    maxWidth: '420px',
                    width: '90%',
                    padding: '40px 32px',
                    backgroundColor: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    textAlign: 'center',
                    position: 'relative',
                    zIndex: 10
                }}
            >
                {/* Logo de la agencia */}
                {logoSrc ? (
                    <div
                        style={{
                            width: '180px',
                            height: '70px',
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            padding: '8px 16px',
                            margin: '0 auto 24px auto',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                    >
                        <img
                            src={logoSrc}
                            alt={`Logo ${agencia.nombre}`}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain'
                            }}
                        />
                    </div>
                ) : (
                    <div
                        style={{
                            width: '70px',
                            height: '70px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '50%',
                            margin: '0 auto 24px auto',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                    >
                        <span style={{ fontSize: '32px' }}>🏢</span>
                    </div>
                )}

                <h2 style={{ 
                    fontSize: '22px', 
                    fontWeight: 'bold', 
                    color: 'white',
                    margin: '0 0 12px 0',
                    letterSpacing: '-0.5px'
                }}>
                    {agencia.nombre}
                </h2>

                {/* Banner de expiración por inactividad */}
                <div style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '28px',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'start',
                    gap: '10px'
                }}>
                    <span style={{ fontSize: '18px', marginTop: '2px' }}>⏰</span>
                    <div>
                        <p style={{
                            margin: '0 0 4px 0',
                            fontWeight: '600',
                            color: '#fca5a5',
                            fontSize: '14px'
                        }}>
                            Sesión Cerrada
                        </p>
                        <p style={{
                            margin: 0,
                            color: '#f8fafc',
                            fontSize: '12px',
                            lineHeight: '1.5'
                        }}>
                            Se salió del sistema por inactividad. Vuelve a iniciar sesión para continuar.
                        </p>
                    </div>
                </div>

                {/* Botón de re-login */}
                <button
                    className="btn-login"
                    onClick={() => window.location.href = '/login'}
                    style={{
                        width: '100%',
                        padding: '14px',
                        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '15px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                        transition: 'all 0.25s ease',
                        outline: 'none'
                    }}
                >
                    Iniciar Sesión
                </button>
            </div>
        </div>
    );
};

export default AgencyPortal;