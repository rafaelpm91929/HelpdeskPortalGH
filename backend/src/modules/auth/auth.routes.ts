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

// 🔥 Obtener todos los administradores (solo superadmin)
router.get('/users/all', authMiddleware, AuthController.getAllAdmins);

// 🔥 Crear usuario (admin o superadmin)
router.post('/users', authMiddleware, AuthController.createUser);

// 🔥 ACTUALIZAR usuario (admin o superadmin)
router.put('/users/:id', authMiddleware, AuthController.updateUser);

// 🔥 ELIMINAR usuario (admin o superadmin)
router.delete('/users/:id', authMiddleware, AuthController.deleteUser);

// 🔥 Obtener usuarios por agencia
router.get('/users/:agencia_id', authMiddleware, AuthController.getUsers);
// 🔥 Cambiar contraseña (requiere autenticación)
router.put('/change-password', authMiddleware, AuthController.changePassword);

router.get('/users/:agencia_id', authMiddleware, AuthController.getUsers);

export default router;