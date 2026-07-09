import { getConnection } from '../../config/database';
import { IUsuario } from './Usuario';

export class UsuarioModel {
    static async create(usuario: IUsuario): Promise<number> {
        const pool = await getConnection();
        const result = await pool.request()
            .input('agencia_id', usuario.agencia_id)
            .input('nombre', usuario.nombre)
            .input('apellido', usuario.apellido)
            .input('email', usuario.email)
            .input('password_hash', usuario.password_hash)
            .input('rol', usuario.rol || 'usuario')
            .input('telefono', usuario.telefono || '')
            .input('puesto', usuario.puesto || '')
            .input('area', usuario.area || '')  // 🔥 Área asignada por admin
            .query(`
                INSERT INTO tbl_usuarios 
                (agencia_id, nombre, apellido, email, password_hash, rol, telefono, puesto, area)
                OUTPUT INSERTED.id
                VALUES (@agencia_id, @nombre, @apellido, @email, @password_hash, @rol, @telefono, @puesto, @area)
            `);
        return result.recordset[0].id;
    }

    static async findByEmail(email: string, agenciaId?: number): Promise<any> {
        const pool = await getConnection();
        let query = 'SELECT * FROM tbl_usuarios WHERE email = @email';
        const request = pool.request().input('email', email);
        
        if (agenciaId) {
            query += ' AND agencia_id = @agenciaId';
            request.input('agenciaId', agenciaId);
        }
        
        const result = await request.query(query);
        return result.recordset[0] || null;
    }

    static async findById(id: number): Promise<any> {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', id)
            .query('SELECT * FROM tbl_usuarios WHERE id = @id');
        return result.recordset[0] || null;
    }

    static async updateLastAccess(id: number): Promise<void> {
        const pool = await getConnection();
        await pool.request()
            .input('id', id)
            .query('UPDATE tbl_usuarios SET ultimo_acceso = GETDATE() WHERE id = @id');
    }

    static async findByAgencia(agenciaId: number): Promise<any[]> {
        const pool = await getConnection();
        const result = await pool.request()
            .input('agenciaId', agenciaId)
            .query(`
                SELECT id, nombre, apellido, email, telefono, puesto, area, 
                       rol, activo, fecha_creacion, avatar_url
                FROM tbl_usuarios 
                WHERE agencia_id = @agenciaId
                ORDER BY fecha_creacion DESC
            `);
        return result.recordset;
    }
}