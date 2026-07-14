 
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

    login: async (data: { email: string; password: string; agencia_id?: number }) => {
        const response = await api.post<any>('/auth/login', data);
        return response.data;
    },

    logout: () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
    },

    getProfile: async () => {
        const response = await api.get<any>('/auth/me');
        return response.data;
    },
};