 
import React, { createContext, useState, useContext, useEffect } from 'react';
import { IUsuario } from '../types';
import { authApi } from '../api/auth.api';

interface AuthContextType {
    user: IUsuario | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<IUsuario | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

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
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            
            console.log('✅ Token guardado en localStorage');
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
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
        }
    };

    const logout = () => {
        authApi.logout();
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
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