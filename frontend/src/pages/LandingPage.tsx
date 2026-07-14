import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IMAGE_BASE_URL } from '../config';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const logoUrl = `${IMAGE_BASE_URL}/uploads/logos/logo_gh.jpg`;

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at top right, #1e293b 0%, #0f172a 100%)',
            fontFamily: "'Outfit', 'Inter', sans-serif",
            color: '#f8fafc',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Elementos decorativos de fondo */}
            <div style={{
                position: 'absolute',
                top: '-10%',
                right: '-10%',
                width: '400px',
                height: '400px',
                borderRadius: '50%',
                background: 'rgba(37, 99, 235, 0.1)',
                filter: 'blur(100px)',
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-10%',
                left: '-10%',
                width: '300px',
                height: '300px',
                borderRadius: '50%',
                background: 'rgba(139, 92, 246, 0.1)',
                filter: 'blur(80px)',
                pointerEvents: 'none'
            }} />

            {/* Tarjeta principal */}
            <div style={{
                maxWidth: '500px',
                width: '100%',
                backgroundColor: 'rgba(30, 41, 59, 0.7)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '24px',
                padding: '40px 30px',
                textAlign: 'center',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                animation: 'fadeIn 0.8s ease-out',
                position: 'relative',
                zIndex: 2
            }}>
                {/* Logo contenedor */}
                <div style={{
                    width: '120px',
                    height: '120px',
                    margin: '0 auto 24px auto',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.25)',
                    border: '3px solid rgba(255, 255, 255, 0.1)',
                    animation: 'scaleIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                    <img 
                        src={logoUrl} 
                        alt="Logo Grupo Huerta" 
                        style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain'
                        }}
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/120?text=Grupo+Huerta';
                        }}
                    />
                </div>

                {/* Títulos */}
                <h1 style={{
                    fontSize: '26px',
                    fontWeight: 800,
                    marginBottom: '8px',
                    background: 'linear-gradient(135deg, #ffffff 30%, #93c5fd 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.5px',
                    lineHeight: '1.2'
                }}>
                    Bienvenido al Portal de Soporte
                </h1>
                
                <h2 style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#3b82f6',
                    marginBottom: '24px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}>
                    Grupo Huerta
                </h2>

                <p style={{
                    fontSize: '14px',
                    color: '#94a3b8',
                    lineHeight: '1.6',
                    marginBottom: '36px',
                    padding: '0 10px'
                }}>
                    Bienvenido a nuestro centro de atención técnica y soporte. Aquí podrás crear reportes, consultar el estado de tus solicitudes y comunicarte directamente con nuestro equipo de ingenieros.
                </p>

                {/* Botón de acción */}
                <button
                    onClick={() => navigate('/login')}
                    style={{
                        width: '100%',
                        padding: '16px 28px',
                        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                        transition: 'all 0.25s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
                    }}
                >
                    Ingresar al Portal
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
            </div>

            {/* Estilos CSS para animaciones básicas */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}} />
        </div>
    );
};
