export interface IUsuario {
    id?: number;
    agencia_id: number;
    nombre: string;
    apellido: string;
    email: string;
    password_hash?: string;
    telefono?: string;
    puesto?: string;
    area?: string;
    avatar_url?: string;
    rol: 'superadmin' | 'admin' | 'agente' | 'usuario';
    email_verificado?: boolean;
    activo?: boolean;
    fecha_creacion?: Date;
}
export interface ITicket {
    id?: number;
    agencia_id: number;
    usuario_id: number;
    agente_id?: number;
    asunto: string;
    tipo: 'problema' | 'solicitud' | 'consulta' | 'queja' | 'otro';
    descripcion: string;
    prioridad: 'baja' | 'media' | 'alta' | 'critica';
    estado: 'pendiente' | 'en_progreso' | 'espera' | 'resuelto' | 'cerrado';
    fecha_creacion?: Date;
    fecha_actualizacion?: Date;
}