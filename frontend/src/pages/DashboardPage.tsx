 
import React from 'react';
import { useAuth } from '../context/AuthContext';

export const DashboardPage: React.FC = () => {
    const { user, logout } = useAuth();

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
            {/* Navbar */}
            <nav style={{
                backgroundColor: 'white',
                padding: '16px 24px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>
                    Helpdesk Portal
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '14px', color: '#374151' }}>
                        {user?.nombre} {user?.apellido}
                    </span>
                    <button
                        onClick={logout}
                        style={{
                            padding: '8px 16px',
                            color: '#dc2626',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        Cerrar sesión
                    </button>
                </div>
            </nav>

            {/* Main content */}
            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '24px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
                        ¡Bienvenido, {user?.nombre}! 🎉
                    </h2>
                    <p style={{ color: '#6b7280' }}>
                        Este es tu dashboard de Helpdesk. Aquí verás tus tickets y estadísticas.
                    </p>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '16px',
                        marginTop: '24px'
                    }}>
                        <div style={{
                            backgroundColor: '#eff6ff',
                            padding: '16px',
                            borderRadius: '8px'
                        }}>
                            <h3 style={{ fontWeight: '600', color: '#1e40af' }}>Tickets pendientes</h3>
                            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e40af' }}>0</p>
                        </div>
                        <div style={{
                            backgroundColor: '#f0fdf4',
                            padding: '16px',
                            borderRadius: '8px'
                        }}>
                            <h3 style={{ fontWeight: '600', color: '#166534' }}>Tickets resueltos</h3>
                            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#166534' }}>0</p>
                        </div>
                        <div style={{
                            backgroundColor: '#fefce8',
                            padding: '16px',
                            borderRadius: '8px'
                        }}>
                            <h3 style={{ fontWeight: '600', color: '#854d0e' }}>En progreso</h3>
                            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#854d0e' }}>0</p>
                        </div>
                    </div>

                    <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
                        <p style={{ color: '#6b7280', fontSize: '14px' }}>
                            Aquí aparecerán tus tickets próximamente...
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};