// ============================================
// CONFIGURACIÓN CENTRALIZADA
// ============================================

// 🔥 Usar las variables de entorno de Vite
const env = import.meta.env;

export const PUBLIC_IP = env.VITE_PUBLIC_IP || '201.149.60.82';

// 🔥 URLs del sistema
export const API_BASE_URL = env.VITE_API_URL || `http://${PUBLIC_IP}:4000/api`;
export const IMAGE_BASE_URL = env.VITE_IMAGE_BASE_URL || `http://${PUBLIC_IP}:4000`;
export const FRONTEND_BASE_URL = env.VITE_FRONTEND_URL || `http://${PUBLIC_IP}:5173`;
export const BACKEND_BASE_URL = env.VITE_BACKEND_URL || `http://${PUBLIC_IP}:4000`;

// 🔥 Log de configuración (solo en desarrollo)
if (env.DEV) {
    console.log('🔧 Configuración:', {
        PUBLIC_IP,
        API_BASE_URL,
        FRONTEND_BASE_URL,
        IMAGE_BASE_URL
    });
}