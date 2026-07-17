import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './api/axios.config';
import { LoginPage } from './pages/LoginPage';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AgencyPortal } from './pages/AgencyPortal';
import { UserPortal } from './pages/UserPortal';

const PUBLIC_IP = '201.149.60.82';

const AppRouter: React.FC = () => {
    const { user, isLoading } = useAuth();
    
    // 🔥 Latido de actividad periódica del usuario
    React.useEffect(() => {
        if (!user) return;

        const sendHeartbeat = async () => {
            try {
                await api.post('/auth/heartbeat');
            } catch (error) {
                console.error('Error al enviar heartbeat:', error);
            }
        };

        sendHeartbeat();
        const intervalId = setInterval(sendHeartbeat, 30000);

        return () => clearInterval(intervalId);
    }, [user]);

    const location = useLocation();
    const hostname = window.location.hostname;
    const pathname = location.pathname;
    const search = location.search;
    
    console.log('========================================');
    console.log('📍 URL:', window.location.href);
    console.log('📍 Hostname:', hostname);
    console.log('📍 Pathname:', pathname);
    console.log('📍 Search:', search);
    console.log('========================================');
    
    // 🔥 1. Verificar parámetros en la URL
    const params = new URLSearchParams(search);
    const agenciaParam = params.get('agencia');
    const superAdminMode = params.get('superadmin') === 'true';
    const adminMode = params.get('admin') === 'true';
    const usuarioMode = params.get('usuario') === 'true';
    
    // 🔥 2. Si está cargando, mostrar loading
    if (isLoading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando...</div>;
    }

    // ============================================
    // 🔥 3. EXTRAER SUBDOMINIO
    // ============================================
    let subdominio = '';
    const isIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    
    if (!isIP && !isLocalhost) {
        const parts = hostname.split('.');
        if (parts.length > 1) {
            subdominio = parts[0];
            console.log('🔍 Subdominio extraído:', subdominio);
        }
    } else {
        console.log('🔍 Es IP o localhost, sin subdominio');
    }

    // ============================================
    // 🔥 4. USUARIO AUTENTICADO
    // ============================================
    if (user) {
        console.log('👤 Usuario autenticado:', user.rol);
        
        // 🔥 4a. SuperAdmin
        if (user.rol === 'superadmin') {
            // Si está en modo superadmin y hay agencia, mostrar AdminDashboard
            if (agenciaParam && superAdminMode) {
                console.log('👑 SuperAdmin accediendo a agencia:', agenciaParam);
                return <AdminDashboard 
                    subdominio={agenciaParam} 
                    isSuperAdminMode={true}
                />;
            }
            // Si no, mostrar SuperAdmin Dashboard
            console.log('👑 Mostrando SuperAdmin Dashboard');
            return <SuperAdminDashboard />;
        }
        
        // 🔥 4b. Admin de agencia
        if (user.rol === 'admin') {
            if (agenciaParam) {
                console.log('🏢 Admin accediendo a su agencia:', agenciaParam);
                return <AdminDashboard 
                    subdominio={agenciaParam} 
                    agenciaId={user.agencia_id}
                />;
            }
            // Si tiene subdominio, usarlo
            if (subdominio) {
                console.log('🏢 Admin accediendo a su agencia por subdominio:', subdominio);
                return <AdminDashboard 
                    subdominio={subdominio} 
                    agenciaId={user.agencia_id}
                />;
            }
            console.log('🏢 Mostrando Admin Dashboard');
            return <AdminDashboard agenciaId={user.agencia_id} />;
        }
        
        // 🔥 4c. Usuario normal
if (user.rol === 'usuario') {
    console.log('👤 Usuario - Mostrando User Portal');
    // Si hay parámetro agencia, usarlo
    if (agenciaParam) {
        return <UserPortal agenciaParam={agenciaParam} />;
    }
    // Si tiene subdominio, usarlo
    if (subdominio) {
        return <UserPortal agenciaParam={subdominio} />;
    }
    // Si no, usar su agencia_id como string
    return <UserPortal agenciaParam={String(user.agencia_id)} />;
}
        
        // 🔥 4d. Dashboard por defecto (fallback)
        console.log('👤 Mostrando Dashboard normal');
        return <DashboardPage />;
    }

    // ============================================
    // 🔥 5. USUARIO NO AUTENTICADO
    // ============================================
    
    // 🔥 5a. Si está en la ruta de login, mostrar login (Primero para permitir iniciar sesión en subdominios)
    if (pathname === '/login') {
        console.log('🔓 Mostrando Login');
        return <LoginPage />;
    }

    // 🔥 5b. Si hay parámetro agencia, mostrar portal público (Prioridad para poder testear/override)
    if (agenciaParam) {
        console.log('🏢 Mostrando portal público para parámetro:', agenciaParam);
        return <AgencyPortal subdominio={agenciaParam} />;
    }

    // 🔥 Mostrar landing page si se entra directamente a la raíz de helpdesksmartsolutions
    if (subdominio === 'helpdesksmartsolutions' && (pathname === '/' || pathname === '')) {
        console.log('✨ Mostrando landing page de bienvenida para helpdesksmartsolutions');
        return <LandingPage />;
    }
    
    // 🔥 5c. Si hay subdominio, mostrar portal público
    if (subdominio) {
        console.log('🏢 Mostrando portal público para subdominio:', subdominio);
        return <AgencyPortal subdominio={subdominio} />;
    }

    // 🔥 5d. Si está en la raíz, mostrar la página de bienvenida (LandingPage)
    if (pathname === '/' || pathname === '') {
        console.log('✨ Mostrando LandingPage de bienvenida');
        return <LandingPage />;
    }

    // 🔥 5e. Si no hay coincidencia, redirigir a la raíz
    console.log('🔓 Ruta no encontrada, redirigiendo a la raíz (/)');
    return <Navigate to="/" replace />;
};

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppRouter />
                <Toaster position="top-right" />
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;