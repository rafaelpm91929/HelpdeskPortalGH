import React from 'react';
import { useNavigate } from 'react-router-dom';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #020617 100%)',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                position: 'relative',
                overflow: 'hidden',
                color: 'white',
            }}
        >
            {/* Animación de Fondos y Luces Degradadas */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                zIndex: 1,
            }}>
                {/* Luz circular 1 */}
                <div style={{
                    position: 'absolute',
                    width: '600px',
                    height: '600px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
                    top: '-10%',
                    right: '-10%',
                    animation: 'floatGlow 15s ease-in-out infinite',
                }} />
                {/* Luz circular 2 */}
                <div style={{
                    position: 'absolute',
                    width: '500px',
                    height: '500px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(96, 165, 250, 0.12) 0%, transparent 70%)',
                    bottom: '-10%',
                    left: '-10%',
                    animation: 'floatGlow 20s ease-in-out infinite reverse',
                }} />
            </div>

            {/* Inyección de Keyframes de Animaciones */}
            <style>{`
                @keyframes floatGlow {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(-30px, 30px); }
                }
                @keyframes scaleIn {
                    from {
                        opacity: 0;
                        transform: scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                @keyframes floatLogo {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                @keyframes pulseBtn {
                    0%, 100% {
                        box-shadow: 0 0 15px rgba(59, 130, 246, 0.4);
                    }
                    50% {
                        box-shadow: 0 0 25px rgba(59, 130, 246, 0.7);
                    }
                }
                .landing-card {
                    animation: scaleIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .btn-inicia-sesion {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    animation: pulseBtn 3s infinite;
                }
                .btn-inicia-sesion:hover {
                    background-color: #3b82f6 !important;
                    transform: translateY(-2px) scale(1.03);
                    box-shadow: 0 10px 25px rgba(59, 130, 246, 0.6) !important;
                }
                .btn-inicia-sesion:active {
                    transform: translateY(0) scale(1);
                }
            `}</style>

            {/* Contenedor Principal */}
            <div
                className="landing-card"
                style={{
                    position: 'relative',
                    zIndex: 2,
                    maxWidth: '450px',
                    width: '90%',
                    textAlign: 'center',
                    padding: '50px 30px',
                    backgroundColor: 'rgba(15, 23, 42, 0.55)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
                }}
            >
                {/* Contenedor del Logo de Grupo Huerta */}
                <div
                    style={{
                        width: '220px',
                        height: '80px',
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        padding: '10px 20px',
                        margin: '0 auto 35px auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        animation: 'floatLogo 4s ease-in-out infinite',
                    }}
                >
                    <img
                        src="/logo_gh.jpg"
                        alt="Logo Grupo Huerta"
                        style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                        }}
                        onError={(e) => {
                            e.currentTarget.src = '/logo_gh_alt.jpg';
                        }}
                    />
                </div>

                {/* Título de la Aplicación */}
                <h1
                    style={{
                        fontSize: '28px',
                        fontWeight: '700',
                        margin: '0 0 10px 0',
                        letterSpacing: '-0.03em',
                        background: 'linear-gradient(to right, #ffffff 40%, #93c5fd 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}
                >
                    Helpdesk Portal
                </h1>

                {/* Subtítulo descriptivo */}
                <p
                    style={{
                        fontSize: '15px',
                        color: '#94a3b8',
                        margin: '0 0 40px 0',
                        lineHeight: '1.5',
                    }}
                >
                    Bienvenido al sistema de soporte técnico y gestión de incidencias de Grupo Huerta.
                </p>

                {/* Botón de Entrada */}
                <button
                    onClick={() => navigate('/login')}
                    className="btn-inicia-sesion"
                    style={{
                        width: '100%',
                        padding: '16px 30px',
                        backgroundColor: '#2563eb',
                        border: 'none',
                        borderRadius: '14px',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: '600',
                        letterSpacing: '0.05em',
                        cursor: 'pointer',
                        boxSizing: 'border-box',
                    }}
                >
                    INICIA SESIÓN
                </button>
            </div>
        </div>
    );
};
