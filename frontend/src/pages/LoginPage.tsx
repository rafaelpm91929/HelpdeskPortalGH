import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../api/axios.config';
import { PUBLIC_IP } from '../config';

export const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    // Estados para login de múltiples agencias (correo duplicado)
    const [agenciesList, setAgenciesList] = useState<Array<{ id: number; nombre: string; subdominio: string }>>([]);
    const [requiresSelection, setRequiresSelection] = useState(false);
    const [selectedAgenciaId, setSelectedAgenciaId] = useState<number | null>(null);

    // Refs para el efecto de olas
    const containerRef = useRef<HTMLDivElement>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    // --- SMARTY INTERACTIVO ---
    const [smartyPos, setSmartyPos] = useState({ x: 100, y: 150 });
    const [smartyAngle, setSmartyAngle] = useState(0);

    const smartyPosRef = useRef({ x: 100, y: 150 });
    const angleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Sincronizar el Ref de posición
    useEffect(() => {
        smartyPosRef.current = smartyPos;
    }, [smartyPos]);

    // Establecer la posición inicial de Smarty
    useEffect(() => {
        const initialX = window.innerWidth - 200;
        const initialY = 120;
        setSmartyPos({ x: initialX, y: initialY });

        return () => {
            if (angleTimeoutRef.current) clearTimeout(angleTimeoutRef.current);
        };
    }, []);

    // Función para hacer que Smarty escape del mouse
    const escapeSmarty = useCallback((mouseX: number, mouseY: number) => {
        const smartyWidth = 120;
        const smartyHeight = 120;
        const padding = 80;

        const maxX = window.innerWidth - smartyWidth - padding;
        const maxY = window.innerHeight - smartyHeight - padding;

        let newX = 0;
        let newY = 0;
        let attempts = 0;
        let valid = false;

        while (!valid && attempts < 30) {
            newX = padding + Math.random() * (maxX - padding);
            newY = padding + Math.random() * (maxY - padding);

            const distFromMouse = Math.sqrt(
                Math.pow(newX + smartyWidth / 2 - mouseX, 2) +
                Math.pow(newY + smartyHeight / 2 - mouseY, 2)
            );

            const distFromOld = Math.sqrt(
                Math.pow(newX - smartyPosRef.current.x, 2) +
                Math.pow(newY - smartyPosRef.current.y, 2)
            );

            if (distFromMouse > 280 && distFromOld > 150) {
                valid = true;
            }
            attempts++;
        }

        if (!valid) {
            newX = mouseX > window.innerWidth / 2 ? padding : maxX;
            newY = mouseY > window.innerHeight / 2 ? padding : maxY;
        }

        const deltaX = newX - smartyPosRef.current.x;
        const tilt = deltaX > 0 ? 20 : -20;

        setSmartyPos({ x: newX, y: newY });
        setSmartyAngle(tilt);

        if (angleTimeoutRef.current) clearTimeout(angleTimeoutRef.current);
        angleTimeoutRef.current = setTimeout(() => {
            setSmartyAngle(0);
        }, 500);
    }, []);

    // Detectar la proximidad del mouse de manera global
    useEffect(() => {
        const handleGlobalMouseMove = (e: MouseEvent) => {
            const smartyWidth = 120;
            const smartyHeight = 120;
            const smartyCenterX = smartyPosRef.current.x + smartyWidth / 2;
            const smartyCenterY = smartyPosRef.current.y + smartyHeight / 2;

            const dx = e.clientX - smartyCenterX;
            const dy = e.clientY - smartyCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Si el cursor se acerca a menos de 160px de Smarty, escapa
            if (distance < 160) {
                escapeSmarty(e.clientX, e.clientY);
            }
        };

        window.addEventListener('mousemove', handleGlobalMouseMove);
        return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
    }, [escapeSmarty]);
    // --- FIN SMARTY INTERACTIVO ---

    const handleSubmit = async (e: React.FormEvent, forceAgenciaId?: number) => {
        if (e) e.preventDefault();
        setLoading(true);
        try {
            const loginAgenciaId = forceAgenciaId !== undefined ? forceAgenciaId : (selectedAgenciaId || undefined);
            const result = await login(email, password, loginAgenciaId);
            
            // Si requiere selección de agencias
            if (result && result.requiresAgencySelection && forceAgenciaId === undefined) {
                setAgenciesList(result.agencias);
                setRequiresSelection(true);
                setSelectedAgenciaId(result.agencias[0].id);
                setLoading(false);
                toast.success('🏢 Selecciona la agencia a la que deseas acceder');
                return;
            }

            toast.success('✅ Inicio de sesión exitoso');

            const user = JSON.parse(sessionStorage.getItem('user') || '{}');
            console.log('👤 Usuario logueado:', user);

            if (user.rol === 'superadmin') {
                console.log('👑 Redirigiendo a SuperAdmin Dashboard');
                navigate('/superadmin');
            } else if (user.rol === 'admin') {
                console.log('🏢 Admin - Redirigiendo a su agencia');
                try {
                    const response = await api.get(`/agencias/${user.agencia_id}`);
                    if (response.data.success) {
                        const subdominio = response.data.data.subdominio;
                        const url = `/?agencia=${subdominio}&admin=true`;
                        console.log('🔗 Redirigiendo a:', url);
                        window.location.href = url;
                        return;
                    } else {
                        console.log('⚠️ No se encontró subdominio, redirigiendo a /admin');
                        navigate('/admin');
                    }
                } catch (error) {
                    console.error('❌ Error al obtener subdominio:', error);
                    navigate('/admin');
                }
            } else if (user.rol === 'usuario') {
                console.log('👤 Usuario - Redirigiendo a su portal');
                try {
                    const response = await api.get(`/agencias/${user.agencia_id}`);
                    if (response.data.success) {
                        const subdominio = response.data.data.subdominio;
                        const url = `/?agencia=${subdominio}&usuario=true`;
                        console.log('🔗 Redirigiendo a:', url);
                        window.location.href = url;
                        return;
                    } else {
                        console.log('⚠️ No se encontró subdominio, redirigiendo a /dashboard');
                        navigate('/dashboard');
                    }
                } catch (error) {
                    console.error('❌ Error al obtener subdominio:', error);
                    navigate('/dashboard');
                }
            } else {
                console.log('👤 Usuario normal - Redirigiendo a Dashboard');
                navigate('/dashboard');
            }
        } catch (error: any) {
            console.error('❌ Error en login:', error);
            toast.error(error.response?.data?.error || error.message || '❌ Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    // Manejar movimiento del mouse para el efecto de olas
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setMousePosition({ x, y });
    };

    return (
        <div
            ref={containerRef}
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

                {/* Ola 2 - Secundaria con desfase */}
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

                {/* Ola 3 - Efecto de brillo */}
                <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    background: `radial-gradient(ellipse at ${mousePosition.x}% ${mousePosition.y}%, 
                        rgba(255, 255, 255, 0.03) 0%,
                        transparent 50%
                    )`,
                    animation: 'wavePulse 4s ease-in-out infinite',
                }} />

                {/* Líneas de onda decorativas */}
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            width: '100%',
                            height: '2px',
                            background: `linear-gradient(90deg, 
                                transparent, 
                                rgba(96, 165, 250, ${0.1 + (i * 0.02)}), 
                                transparent
                            )`,
                            top: `${20 + i * 20}%`,
                            left: 0,
                            animation: `waveLine ${6 + i * 0.5}s ease-in-out infinite ${i * 0.5}s`,
                            opacity: 0.5,
                            transform: `translateX(${(mousePosition.x - 50) * (0.02 + i * 0.01)}%)`,
                            transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                        }}
                    />
                ))}
            </div>

            {/* Inyección de estilos CSS para animaciones y efectos interactivos */}
            <style>{`
                @keyframes waveFloat {
                    0%, 100% {
                        transform: scale(1) rotate(0deg);
                    }
                    50% {
                        transform: scale(1.05) rotate(2deg);
                    }
                }

                @keyframes wavePulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.6;
                    }
                }

                @keyframes waveLine {
                    0%, 100% {
                        transform: translateX(0) scaleX(0.8);
                    }
                    50% {
                        transform: translateX(10px) scaleX(1.2);
                    }
                }

                .login-input {
                    width: 100%;
                    padding: 12px 16px;
                    background-color: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 8px;
                    color: white;
                    outline: none;
                    transition: all 0.25s ease;
                    font-size: 15px;
                    box-sizing: border-box;
                    position: relative;
                    z-index: 1;
                }
                .login-input:focus {
                    border-color: #60a5fa;
                    background-color: rgba(255, 255, 255, 0.08);
                    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.3);
                    transform: scale(1.02);
                }
                .login-input::placeholder {
                    color: rgba(255, 255, 255, 0.35);
                }
                .login-btn {
                    width: 100%;
                    padding: 12px;
                    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.25s ease;
                    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
                    position: relative;
                    z-index: 1;
                }
                .login-btn:hover:not(:disabled) {
                    background: linear-gradient(135deg, #60a5fa 0%, #2563eb 100%);
                    transform: translateY(-2px) scale(1.02);
                    box-shadow: 0 8px 24px rgba(37, 99, 235, 0.5);
                }
                .login-btn:active:not(:disabled) {
                    transform: translateY(0) scale(0.98);
                }
                .login-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                /* Efecto de brillo en el logo al mover el mouse */
                .logo-container {
                    position: relative;
                    z-index: 1;
                    transition: all 0.3s ease;
                }
                .logo-container:hover {
                    transform: scale(1.05) rotate(-1deg);
                    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.25);
                }

                /* Efecto de ola en el borde del formulario */
                .form-container {
                    position: relative;
                    z-index: 1;
                    animation: formAppear 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                @keyframes formAppear {
                    0% {
                        opacity: 0;
                        transform: translateY(30px) scale(0.95);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                /* Efecto de brillo en el borde del formulario */
                .form-container::before {
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
                    animation: borderWave 4s ease-in-out infinite;
                }

                @keyframes borderWave {
                    0%, 100% {
                        opacity: 0.5;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 1;
                        transform: scale(1.02);
                    }
                }

                @keyframes smartyFloatIdle {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-8px);
                    }
                }
                @keyframes smartyShadowIdle {
                    0%, 100% {
                        transform: scaleX(1);
                        opacity: 0.8;
                    }
                    50% {
                        transform: scaleX(0.7);
                        opacity: 0.4;
                    }
                }
            `}</style>

            <div
                className="form-container"
                style={{
                    maxWidth: '400px',
                    width: '90%',
                    padding: '40px 32px',
                    backgroundColor: 'rgba(15, 23, 42, 0.7)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                }}
            >
                {/* Logo de GH en contenedor blanco premium */}
                <div
                    className="logo-container"
                    style={{
                        width: '180px',
                        height: '65px',
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '8px 16px',
                        margin: '0 auto 28px auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                >
                    <img
                        src="/logo_gh.jpg"
                        alt="GH Logo"
                        style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain'
                        }}
                        onError={(e) => {
                            // Fallback por si la imagen cargada es el archivo alternativo
                            e.currentTarget.src = '/logo_gh_alt.jpg';
                        }}
                    />
                </div>

                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', letterSpacing: '-0.025em' }}>
                        Portal Helpdesk
                    </h2>
                    <p style={{ marginTop: '6px', fontSize: '14px', color: '#94a3b8' }}>
                        Inicia sesión para continuar
                    </p>
                </div>

                {requiresSelection ? (
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        if (selectedAgenciaId) {
                            handleSubmit(e, selectedAgenciaId);
                        }
                    }}>
                        <div style={{ marginBottom: '28px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#cbd5e1', marginBottom: '12px', textAlign: 'center', lineHeight: '1.5' }}>
                                Se detectó que tu correo pertenece a múltiples agencias.<br />
                                <strong>Selecciona la agencia a la que deseas ingresar:</strong>
                            </label>
                            
                            <select
                                value={selectedAgenciaId || ''}
                                onChange={(e) => setSelectedAgenciaId(Number(e.target.value))}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    borderRadius: '8px',
                                    backgroundColor: '#1e293b',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    fontSize: '15px',
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                {agenciesList.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.nombre} ({a.subdominio})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="login-btn"
                            style={{ marginBottom: '12px' }}
                        >
                            {loading ? 'Ingresando...' : 'Ingresar a esta Agencia'}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setRequiresSelection(false);
                                setAgenciesList([]);
                                setSelectedAgenciaId(null);
                            }}
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: 'transparent',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: '#94a3b8',
                                borderRadius: '8px',
                                fontSize: '14px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                        >
                            Volver
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#cbd5e1', marginBottom: '6px' }}>
                                Correo Electrónico
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="login-input"
                                placeholder="usuario@grupohuerta.mx"
                            />
                        </div>

                        <div style={{ marginBottom: '28px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#cbd5e1', marginBottom: '6px' }}>
                                Contraseña
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="login-input"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="login-btn"
                        >
                            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                        </button>
                    </form>
                )}
            </div>

            {/* Smarty Asistente Interactivo */}
            <div
                style={{
                    position: 'fixed',
                    left: `${smartyPos.x}px`,
                    top: `${smartyPos.y}px`,
                    width: '120px',
                    height: '120px',
                    zIndex: 1000,
                    transition: 'left 0.5s cubic-bezier(0.19, 1, 0.22, 1), top 0.5s cubic-bezier(0.19, 1, 0.22, 1), transform 0.5s cubic-bezier(0.19, 1, 0.22, 1)',
                    transform: `translate3d(0, 0, 0) rotate(${smartyAngle}deg)`,
                    pointerEvents: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'grab'
                }}
            >

                {/* Smarty imagen con halo y float de inactividad */}
                <img
                    src="/robot.png"
                    alt="Smarty Asistente"
                    style={{
                        width: '100%',
                        height: 'auto',
                        filter: 'drop-shadow(0 0 15px rgba(56, 189, 248, 0.55))',
                        animation: 'smartyFloatIdle 3s ease-in-out infinite'
                    }}
                />

                {/* Estela/Brillo debajo de Smarty */}
                <div
                    style={{
                        width: '60px',
                        height: '6px',
                        background: 'rgba(56, 189, 248, 0.3)',
                        borderRadius: '50%',
                        filter: 'blur(3px)',
                        animation: 'smartyShadowIdle 3s ease-in-out infinite',
                        marginTop: '5px'
                    }}
                />
            </div>
        </div>
    );
};

export default LoginPage;