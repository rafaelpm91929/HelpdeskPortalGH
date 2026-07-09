export interface IUsuario {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    rol: 'superadmin' | 'admin' | 'agente' | 'usuario';
    agencia_id: number;
    area?: string;  // 🔥 AGREGAR ESTA LÍNEA
    telefono?: string;
    puesto?: string;
}

export interface IAuthResponse {
    success: boolean;
    data: {
        token: string;
        user: IUsuario;
    };
}