 
import { api } from './axios.config';
import { IAuthResponse } from '../types';

export const authApi = {
    register: async (data: {
        nombre: string;
        apellido: string;
        email: string;
        password: string;
        agencia_id: number;
        rol?: string;
    }) => {
        const response = await api.post<IAuthResponse>('/auth/register', data);
        return response.data;
    },

    login: async (data: { email: string; password: string }) => {
        const response = await api.post<IAuthResponse>('/auth/login', data);
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },
};