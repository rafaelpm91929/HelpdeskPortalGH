import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { IUsuario } from '../types';
import { authApi } from '../api/auth.api';

interface AuthContextType {
    user: IUsuario | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<IUsuario | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const refreshProfile = async () => {
        const storedToken = sessionStorage.getItem('token');
        if (!storedToken) return;
        try {
            const response = await authApi.getProfile();
            if (response.success) {
                const freshUser = response.data;
                setUser(freshUser);
                sessionStorage.setItem('user', JSON.stringify(freshUser));
                console.log('🔄 Perfil de usuario refrescado:', freshUser);
            }
        } catch (err) {
            console.error('Error al refrescar perfil:', err);
        }
    };

    // Cargar sesión guardada desde sessionStorage al iniciar y refrescarla con datos frescos
    useEffect(() => {
        const storedToken = sessionStorage.getItem('token');
        const storedUser = sessionStorage.getItem('user');
        
        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
            
            // Refrescar perfil en segundo plano
            authApi.getProfile()
                .then(response => {
                    if (response.success) {
                        const freshUser = response.data;
                        setUser(freshUser);
                        sessionStorage.setItem('user', JSON.stringify(freshUser));
                        console.log('🔄 Perfil inicial actualizado con datos frescos');
                    }
                })
                .catch(err => {
                    console.error('Error al refrescar perfil inicial:', err);
                });
        }
        setIsLoading(false);
    }, []);

    const logout = () => {
        authApi.logout();
        setToken(null);
        setUser(null);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        // Redirigir al login limpiando parámetros para evitar bucles de redirección
        window.location.replace('/login');
    };

    const resetTimer = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        if (token) {
            timeoutRef.current = setTimeout(() => {
                console.log('⏰ Sesión expirada por inactividad');
                logout();
            }, 10 * 60 * 1000); // 10 minutos
        }
    };

    // Efecto para escuchar la inactividad del usuario
    useEffect(() => {
        if (!token) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            return;
        }

        const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
        
        const handleActivity = () => {
            resetTimer();
        };

        // Iniciar temporizador
        resetTimer();

        // Agregar listeners
        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        // Limpieza de eventos
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [token]);

    const login = async (email: string, password: string) => {
        try {
            const response = await authApi.login({ email, password });
            console.log('📡 Respuesta login:', response);
            
            if (response.success) {
                const { token, user } = response.data;
                console.log('🔑 Token recibido:', token ? 'Sí' : 'No');
                console.log('👤 Usuario recibido:', user);
                
                setToken(token);
                setUser(user);
                sessionStorage.setItem('token', token);
                sessionStorage.setItem('user', JSON.stringify(user));
                
                console.log('✅ Token guardado en sessionStorage');
            } else {
                console.error('❌ Login falló:', response);
            }
        } catch (error) {
            console.error('❌ Error en login:', error);
            throw error;
        }
    };

    const register = async (data: any) => {
        const response = await authApi.register(data);
        if (response.success) {
            const { token, user } = response.data;
            setToken(token);
            setUser(user);
            sessionStorage.setItem('token', token);
            sessionStorage.setItem('user', JSON.stringify(user));
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, isLoading, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};