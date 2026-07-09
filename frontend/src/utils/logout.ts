import { FRONTEND_BASE_URL } from '../config';

export const logout = () => {
    console.log('🚪 Cerrando sesión...');
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('auth');
    
    sessionStorage.clear();
    
    const loginUrl = `${FRONTEND_BASE_URL}/login`;
    console.log('🔗 Redirigiendo a:', loginUrl);
    window.location.replace(loginUrl);
};