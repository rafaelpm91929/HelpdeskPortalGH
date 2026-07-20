import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IMAGE_BASE_URL } from '../config';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const logoUrl = `${IMAGE_BASE_URL}/uploads/logos/logo_gh.jpg`;
    const [isTransitioning, setIsTransitioning] = useState(false);

    const handleEnter = () => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setTimeout(() => {
            navigate('/login');
        }, 2200);
    };

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
                        alt="Logo Smart Solutions"
                        style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain'
                        }}
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/120?text=Smart+Solutions';
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
                    SMART SOLUTIONS
                </h2>

                <p style={{
                    fontSize: '14px',
                    color: '#94a3b8',
                    lineHeight: '1.6',
                    marginBottom: '36px',
                    padding: '0 10px'
                }}>
                    Bienvenido a nuestro portal de soporte técnico.
                </p>

                {/* Botón de acción */}
                <button
                    onClick={handleEnter}
                    disabled={isTransitioning}
                    style={{
                        width: '100%',
                        padding: '16px 28px',
                        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: '700',
                        cursor: isTransitioning ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                        transition: 'all 0.25s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        opacity: isTransitioning ? 0.7 : 1
                    }}
                    onMouseEnter={(e) => {
                        if (isTransitioning) return;
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                        if (isTransitioning) return;
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
                    }}
                >
                    {isTransitioning ? 'Preparando Portal...' : 'Ingresar al Portal'}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>

            {/* Pantalla de transición con Smarty Volando */}
            {isTransitioning && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'radial-gradient(circle at center, #090d16 30%, #020617 100%)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    animation: 'portalFadeIn 0.5s ease-out forwards'
                }}>
                    {/* Anillos de portal de fondo */}
                    <div className="portal-ring ring-1"></div>
                    <div className="portal-ring ring-2"></div>
                    <div className="portal-ring ring-3"></div>

                    {/* Efecto de partículas de velocidad */}
                    <div style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
                        {[...Array(20)].map((_, i) => {
                            const top = Math.random() * 100;
                            const left = Math.random() * 100;
                            const delay = Math.random() * 1.2;
                            const duration = 0.4 + Math.random() * 0.6;
                            return (
                                <div
                                    key={i}
                                    style={{
                                        position: 'absolute',
                                        width: `${40 + Math.random() * 120}px`,
                                        height: '2px',
                                        background: 'linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.5), transparent)',
                                        top: `${top}%`,
                                        left: `${left}%`,
                                        animation: `speedLineAnim ${duration}s linear infinite`,
                                        animationDelay: `${delay}s`
                                    }}
                                />
                            );
                        })}
                    </div>

                    {/* Robot Smarty Volando */}
                    <div style={{
                        position: 'absolute',
                        bottom: '-200px',
                        left: '-200px',
                        animation: 'smartySuperFly 2.2s cubic-bezier(0.25, 1, 0.5, 1) forwards',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        pointerEvents: 'none'
                    }}>
                        {/* Estela de luz */}
                        <div style={{
                            position: 'absolute',
                            width: '90px',
                            height: '160px',
                            background: 'linear-gradient(to top, rgba(56, 189, 248, 0.8), transparent)',
                            filter: 'blur(8px)',
                            borderRadius: '50%',
                            bottom: '-50px',
                            transform: 'rotate(-45deg)',
                            opacity: 0.8,
                            animation: 'firePulse 0.1s infinite alternate'
                        }} />
                        
                        <img
                            src="/robot.png"
                            alt="Smarty Volando"
                            style={{
                                width: '160px',
                                height: 'auto',
                                filter: 'drop-shadow(0 0 25px rgba(56, 189, 248, 0.75))',
                                transform: 'rotate(25deg)'
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Estilos CSS para animaciones básicas y de transición */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes portalFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes firePulse {
                    from { transform: rotate(-45deg) scaleY(0.9); opacity: 0.6; }
                    to { transform: rotate(-45deg) scaleY(1.1); opacity: 0.9; }
                }
                @keyframes textPulse {
                    from { transform: scale(0.95); }
                    to { transform: scale(1.05); }
                }
                @keyframes smartySuperFly {
                    0% {
                        transform: translate(0, 0) scale(0.6) rotate(15deg);
                        opacity: 0;
                    }
                    15% {
                        opacity: 1;
                    }
                    40% {
                        transform: translate(calc(50vw + 120px), calc(-50vh - 120px)) scale(1) rotate(5deg);
                    }
                    65% {
                        transform: translate(calc(50vw + 120px), calc(-50vh - 120px)) scale(1) rotate(35deg);
                    }
                    100% {
                        transform: translate(calc(100vw + 400px), calc(-100vh - 400px)) scale(1.6) rotate(45deg);
                    }
                }
                @keyframes speedLineAnim {
                    0% {
                        transform: rotate(-45deg) translate(-300px, -300px);
                        opacity: 0;
                    }
                    50% {
                        opacity: 0.8;
                    }
                    100% {
                        transform: rotate(-45deg) translate(300px, 300px);
                        opacity: 0;
                    }
                }
                
                /* Anillos del portal */
                .portal-ring {
                    position: absolute;
                    border: 2px solid rgba(56, 189, 248, 0.15);
                    border-radius: 50%;
                    animation: ringZoom 2.2s cubic-bezier(0.1, 0.8, 0.3, 1) infinite;
                    pointer-events: none;
                }
                .ring-1 {
                    width: 100px;
                    height: 100px;
                    animation-delay: 0s;
                }
                .ring-2 {
                    width: 100px;
                    height: 100px;
                    animation-delay: 0.5s;
                }
                .ring-3 {
                    width: 100px;
                    height: 100px;
                    animation-delay: 1s;
                }
                @keyframes ringZoom {
                    0% {
                        transform: scale(0.1);
                        opacity: 0;
                        border-color: rgba(139, 92, 246, 0.6);
                        box-shadow: 0 0 20px rgba(139, 92, 246, 0.4);
                    }
                    50% {
                        opacity: 0.6;
                        border-color: rgba(56, 189, 248, 0.6);
                        box-shadow: 0 0 45px rgba(56, 189, 248, 0.4);
                    }
                    100% {
                        transform: scale(16);
                        opacity: 0;
                        border-color: rgba(56, 189, 248, 0);
                    }
                }
            `}} />
        </div>
    );
};
