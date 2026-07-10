import { FRONTEND_BASE_URL } from '../config';

export const logout = () => {
    console.log('🚪 Cerrando sesión...');
    
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('auth');
    
    sessionStorage.clear();
    
    const loginUrl = `${FRONTEND_BASE_URL}/login`;
    console.log('🔗 Redirigiendo a:', loginUrl);
    window.location.replace(loginUrl);
};