import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { getConnection } from '../../config/database';
import bcrypt from 'bcrypt';
import { UsuarioModel } from '../../shared/models/Usuario.model';

export class AuthController {
    // ✅ LOGIN (público)
    static async login(req: Request, res: Response) {
        try {
            const { email, password, agencia_id } = req.body;
            
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Email y contraseña son requeridos'
                });
            }

            const result = await AuthService.login(email, password, agencia_id ? parseInt(agencia_id, 10) : undefined);

            res.json({
                success: true,
                data: result
            });
        } catch (error: any) {
            res.status(401).json({
                success: false,
                error: error.message
            });
        }
    }

    // 🔥 CREAR PRIMER ADMINISTRADOR (público)
    static async registerFirstAdmin(req: Request, res: Response) {
        try {
            const { nombre, apellido, email, password, agencia_id } = req.body;

            if (!nombre || !apellido || !email || !password || !agencia_id) {
                return res.status(400).json({
                    success: false,
                    error: 'Faltan campos requeridos: nombre, apellido, email, password, agencia_id'
                });
            }

            const users = await AuthService.getUsersByAgencia(parseInt(agencia_id));
            const admins = users.filter((u: any) => u.rol === 'admin' || u.rol === 'superadmin');
            
            if (admins.length > 0) {
                return res.status(403).json({
                    success: false,
                    error: 'Ya existe un administrador en esta agencia. Usa el login normal.'
                });
            }

            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    error: 'La contraseña debe tener al menos 6 caracteres'
                });
            }

            const result = await AuthService.register({
                nombre,
                apellido,
                email,
                password,
                agencia_id: parseInt(agencia_id),
                rol: 'admin'
            });

            res.status(201).json({
                success: true,
                data: result,
                message: '✅ Primer administrador creado exitosamente'
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    // ✅ Crear usuario (solo admin autenticado)
    static async createUser(req: any, res: Response) {
        try {
            const { 
                nombre, 
                apellido, 
                email, 
                password, 
                agencia_id, 
                rol,
                telefono,
                puesto,
                area
            } = req.body;
            
            const currentUser = req.user;
            
            if (!currentUser || (currentUser.rol !== 'admin' && currentUser.rol !== 'superadmin')) {
                return res.status(403).json({
                    success: false,
                    error: 'No tienes permiso para crear usuarios'
                });
            }

            if (currentUser.rol === 'admin' && currentUser.agenciaId !== parseInt(agencia_id)) {
                return res.status(403).json({
                    success: false,
                    error: 'No puedes crear usuarios en otra agencia'
                });
            }

            if (!nombre || !apellido || !email || !password || !agencia_id) {
                return res.status(400).json({
                    success: false,
                    error: 'Faltan campos requeridos: nombre, apellido, email, password, agencia_id'
                });
            }

            const existingUser = await UsuarioModel.findByEmail(email, parseInt(agencia_id));
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    error: 'El email ya está registrado en esta agencia'
                });
            }

            const userRol = currentUser.rol === 'admin' ? 'usuario' : (rol || 'usuario');
            
            if (currentUser.rol === 'superadmin' && rol && !['admin', 'agente', 'usuario'].includes(rol)) {
                return res.status(400).json({
                    success: false,
                    error: 'Rol no válido. Roles permitidos: admin, agente, usuario'
                });
            }

            const result = await AuthService.register({
                nombre,
                apellido,
                email,
                password,
                agencia_id: parseInt(agencia_id),
                rol: userRol,
                telefono: telefono || '',
                puesto: puesto || '',
                area: area || ''
            });

            res.status(201).json({
                success: true,
                data: result,
                message: `Usuario ${userRol} creado exitosamente`
            });
        } catch (error: any) {
            console.error('❌ Error en createUser:', error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    // ✅ Obtener usuarios de una agencia (solo admin)
    static async getUsers(req: any, res: Response) {
        try {
            const currentUser = req.user;
            const { agencia_id } = req.params;

            const agenciaId = parseInt(agencia_id as string, 10);

            if (isNaN(agenciaId)) {
                return res.status(400).json({
                    success: false,
                    error: 'ID de agencia inválido'
                });
            }

            if (currentUser.rol !== 'superadmin' && currentUser.agenciaId !== agenciaId) {
                return res.status(403).json({
                    success: false,
                    error: 'No tienes permiso para ver usuarios de otra agencia'
                });
            }

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

            res.json({
                success: true,
                data: result.recordset
            });
        } catch (error: any) {
            console.error('Error en getUsers:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // ✅ Obtener todos los administradores (solo superadmin)
    static async getAllAdmins(req: any, res: Response) {
        try {
            const currentUser = req.user;
            
            if (!currentUser || currentUser.rol !== 'superadmin') {
                return res.status(403).json({
                    success: false,
                    error: 'Solo el SuperAdmin puede ver todos los administradores'
                });
            }

            const pool = await getConnection();
            const result = await pool.request().query(`
                SELECT id, nombre, apellido, email, rol, agencia_id, activo, fecha_creacion
                FROM tbl_usuarios 
                WHERE rol IN ('admin', 'superadmin')
                ORDER BY fecha_creacion DESC
            `);
            
            res.json({
                success: true,
                data: result.recordset
            });
        } catch (error: any) {
            console.error('Error en getAllAdmins:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // ✅ Actualizar usuario (solo admin o superadmin)
    static async updateUser(req: any, res: Response) {
        try {
            const { id } = req.params;
            const { 
                nombre, 
                apellido, 
                email, // 🔥 Habilitar edición de correo
                password, 
                agencia_id,
                telefono,
                puesto,
                area
            } = req.body;
            const currentUser = req.user;

            const userId = parseInt(id as string, 10);

            if (isNaN(userId)) {
                return res.status(400).json({
                    success: false,
                    error: 'ID de usuario inválido'
                });
            }

            if (!currentUser || (currentUser.rol !== 'admin' && currentUser.rol !== 'superadmin')) {
                return res.status(403).json({
                    success: false,
                    error: 'No tienes permiso para actualizar usuarios'
                });
            }

            const pool = await getConnection();

            const userCheck = await pool.request()
                .input('id', userId)
                .query('SELECT id, agencia_id, rol FROM tbl_usuarios WHERE id = @id');

            if (userCheck.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Usuario no encontrado'
                });
            }

            const userToUpdate = userCheck.recordset[0];

            if (currentUser.rol === 'admin' && currentUser.agenciaId !== userToUpdate.agencia_id) {
                return res.status(403).json({
                    success: false,
                    error: 'No puedes editar usuarios de otra agencia'
                });
            }

            if (currentUser.rol === 'admin' && userToUpdate.rol === 'admin') {
                return res.status(403).json({
                    success: false,
                    error: 'No puedes editar a otro administrador'
                });
            }

            let updateQuery = 'UPDATE tbl_usuarios SET ';
            const updates: string[] = [];
            const request = pool.request();
            request.input('id', userId);

            if (nombre !== undefined) {
                updates.push('nombre = @nombre');
                request.input('nombre', nombre);
            }

            if (apellido !== undefined) {
                updates.push('apellido = @apellido');
                request.input('apellido', apellido);
            }

            if (email !== undefined && email.trim() !== '') {
                const emailCheck = await pool.request()
                    .input('email', email)
                    .input('id', userId)
                    .query('SELECT id FROM tbl_usuarios WHERE email = @email AND id != @id');

                if (emailCheck.recordset.length > 0) {
                    return res.status(400).json({
                        success: false,
                        error: 'El correo electrónico ya está registrado por otro usuario.'
                    });
                }
                updates.push('email = @email');
                request.input('email', email);
            }

            if (telefono !== undefined) {
                updates.push('telefono = @telefono');
                request.input('telefono', telefono);
            }

            if (puesto !== undefined) {
                updates.push('puesto = @puesto');
                request.input('puesto', puesto);
            }

            if (area !== undefined) {
                updates.push('area = @area');
                request.input('area', area);
            }

            if (password && password.trim() !== '') {
                const hashedPassword = await bcrypt.hash(password, 10);
                updates.push('password_hash = @password_hash');
                request.input('password_hash', hashedPassword);
            }

            if (agencia_id && currentUser.rol === 'superadmin') {
                updates.push('agencia_id = @agencia_id');
                request.input('agencia_id', parseInt(agencia_id));
            }

            if (updates.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No hay campos para actualizar'
                });
            }

            updateQuery += updates.join(', ') + ' WHERE id = @id';
            updateQuery += ' SELECT * FROM tbl_usuarios WHERE id = @id';

            const result = await request.query(updateQuery);

            const user = result.recordset[0];
            delete user.password_hash;

            res.json({
                success: true,
                data: user,
                message: '✅ Usuario actualizado correctamente'
            });
        } catch (error: any) {
            console.error('Error en updateUser:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // ✅ Eliminar usuario (solo admin o superadmin)
    static async deleteUser(req: any, res: Response) {
        try {
            const { id } = req.params;
            const currentUser = req.user;

            const userId = parseInt(id as string, 10);

            if (isNaN(userId)) {
                return res.status(400).json({
                    success: false,
                    error: 'ID de usuario inválido'
                });
            }

            if (!currentUser || (currentUser.rol !== 'admin' && currentUser.rol !== 'superadmin')) {
                return res.status(403).json({
                    success: false,
                    error: 'No tienes permiso para eliminar usuarios'
                });
            }

            const pool = await getConnection();

            const userCheck = await pool.request()
                .input('id', userId)
                .query('SELECT id, agencia_id, rol FROM tbl_usuarios WHERE id = @id');

            if (userCheck.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Usuario no encontrado'
                });
            }

            const userToDelete = userCheck.recordset[0];

            if (userId === currentUser.id) {
                return res.status(400).json({
                    success: false,
                    error: 'No puedes eliminarte a ti mismo'
                });
            }

            if (currentUser.rol === 'admin' && currentUser.agenciaId !== userToDelete.agencia_id) {
                return res.status(403).json({
                    success: false,
                    error: 'No puedes eliminar usuarios de otra agencia'
                });
            }

            if (currentUser.rol === 'admin' && userToDelete.rol === 'admin') {
                return res.status(403).json({
                    success: false,
                    error: 'No puedes eliminar a otro administrador'
                });
            }

            await pool.request()
                .input('id', userId)
                .query('DELETE FROM tbl_actividades WHERE usuario_id = @id');

            await pool.request()
                .input('id', userId)
                .query('DELETE FROM tbl_notificaciones WHERE usuario_id = @id');

            await pool.request()
                .input('id', userId)
                .query('DELETE FROM tbl_mensajes WHERE usuario_id = @id');

            await pool.request()
                .input('id', userId)
                .query('DELETE FROM tbl_tickets WHERE usuario_id = @id');

            await pool.request()
                .input('id', userId)
                .query('DELETE FROM tbl_usuarios WHERE id = @id');

            res.json({
                success: true,
                message: '✅ Usuario eliminado correctamente'
            });
        } catch (error: any) {
            console.error('Error en deleteUser:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // ✅ Cambiar contraseña
    static async changePassword(req: any, res: Response) {
        try {
            const { currentPassword, newPassword } = req.body;
            const currentUser = req.user;

            console.log('🔑 Cambiando contraseña para usuario:', currentUser?.email);

            if (!currentUser) {
                return res.status(401).json({
                    success: false,
                    error: 'No autenticado'
                });
            }

            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    error: 'Contraseña actual y nueva son requeridas'
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    error: 'La nueva contraseña debe tener al menos 6 caracteres'
                });
            }

            const pool = await getConnection();

            const result = await pool.request()
                .input('id', currentUser.userId)
                .query('SELECT id, password_hash FROM tbl_usuarios WHERE id = @id');

            if (result.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Usuario no encontrado'
                });
            }

            const user = result.recordset[0];

            const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
            if (!passwordMatch) {
                return res.status(400).json({
                    success: false,
                    error: 'Contraseña actual incorrecta'
                });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await pool.request()
                .input('id', currentUser.userId)
                .input('password_hash', hashedPassword)
                .query('UPDATE tbl_usuarios SET password_hash = @password_hash WHERE id = @id');

            console.log('✅ Contraseña actualizada para usuario:', currentUser.email);

            res.json({
                success: true,
                message: '✅ Contraseña actualizada correctamente'
            });
        } catch (error: any) {
            console.error('Error al cambiar contraseña:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    static async getCurrentUser(req: any, res: Response) {
        try {
            const currentUser = req.user;
            if (!currentUser) {
                return res.status(401).json({
                    success: false,
                    error: 'No autenticado'
                });
            }

            const pool = await getConnection();
            const result = await pool.request()
                .input('id', currentUser.id)
                .query(`
                    SELECT u.id, u.nombre, u.apellido, u.email, u.rol, u.agencia_id, u.telefono, u.puesto, u.area, u.activo, a.nombre AS agencia_name, a.subdominio AS agencia_subdominio
                    FROM tbl_usuarios u
                    LEFT JOIN tbl_agencias a ON u.agencia_id = a.id
                    WHERE u.id = @id
                `);

            if (result.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Usuario no encontrado'
                });
            }

            const dbUser = result.recordset[0];
            
            if (!dbUser.activo) {
                return res.status(401).json({
                    success: false,
                    error: 'Usuario desactivado'
                });
            }

            res.json({
                success: true,
                data: {
                    id: dbUser.id,
                    nombre: dbUser.nombre,
                    apellido: dbUser.apellido,
                    email: dbUser.email,
                    rol: dbUser.rol,
                    agencia_id: dbUser.agencia_id,
                    telefono: dbUser.telefono || '',
                    puesto: dbUser.puesto || '',
                    area: dbUser.area || '',
                    agencia_name: dbUser.agencia_name || '',
                    agencia_subdominio: dbUser.agencia_subdominio || ''
                }
            });
        } catch (error: any) {
            console.error('Error al obtener usuario actual:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

export default AuthController;