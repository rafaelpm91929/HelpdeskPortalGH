import { Router } from 'express';
import AuthController from './auth.controller';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';

const router = Router();

// ============================================
// RUTAS PÚBLICAS
// ============================================

// Login
router.post('/login', AuthController.login);

// Registrar primer administrador
router.post('/register-first-admin', AuthController.registerFirstAdmin);

// ============================================
// RUTAS PROTEGIDAS (requieren token)
// ============================================

// 🔥 Obtener perfil del usuario autenticado actual
router.get('/me', authMiddleware, AuthController.getCurrentUser);

// 🔥 Obtener todos los administradores (solo superadmin)
router.get('/users/all', authMiddleware, AuthController.getAllAdmins);

// 🔥 Crear usuario (admin o superadmin)
router.post('/users', authMiddleware, AuthController.createUser);

// 🔥 ACTUALIZAR usuario (admin o superadmin)
router.put('/users/:id', authMiddleware, AuthController.updateUser);

// 🔥 Enviar claves a un usuario administrador (solo superadmin)
router.post('/users/:id/enviar-claves', authMiddleware, async (req: any, res: any) => {
    try {
        const currentUser = req.user;
        if (!currentUser || currentUser.rol !== 'superadmin') {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para realizar esta acción'
            });
        }

        const { id } = req.params;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                error: 'La contraseña es requerida'
            });
        }

        const { getConnection } = require('../../config/database');
        const pool = await getConnection();
        
        // 1. Obtener detalles del usuario y su agencia
        const userResult = await pool.request()
            .input('id', parseInt(id))
            .query(`
                SELECT u.id, u.nombre, u.apellido, u.email, u.rol, u.agencia_id,
                       a.nombre AS agency_name, a.subdominio
                FROM tbl_usuarios u
                LEFT JOIN tbl_agencias a ON u.agencia_id = a.id
                WHERE u.id = @id
            `);

        if (userResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        const user = userResult.recordset[0];

        // 2. Hashear la nueva contraseña y actualizar base de datos
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.request()
            .input('id', user.id)
            .input('password_hash', hashedPassword)
            .query('UPDATE tbl_usuarios SET password_hash = @password_hash WHERE id = @id');

        // 3. Enviar correo usando el helper sendCredentialsEmail
        const { sendCredentialsEmail } = require('../../shared/utils/email.service');
        const linkPortal = 'https://helpdesksmartsolutions.mooo.com:5173';

        await sendCredentialsEmail(
            user.email,
            user.agency_name || 'Helpdesk',
            user.subdominio || '',
            user.email,
            password,
            linkPortal
        );

        res.json({
            success: true,
            message: 'Contraseña actualizada y credenciales enviadas por correo correctamente'
        });

    } catch (error: any) {
        console.error('Error al enviar claves:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 🔥 ELIMINAR usuario (admin o superadmin)
router.delete('/users/:id', authMiddleware, AuthController.deleteUser);

// 🔥 Obtener usuarios por agencia
router.get('/users/:agencia_id', authMiddleware, AuthController.getUsers);
// 🔥 Cambiar contraseña (requiere autenticación)
router.put('/change-password', authMiddleware, AuthController.changePassword);

router.get('/users/:agencia_id', authMiddleware, AuthController.getUsers);

export default router;