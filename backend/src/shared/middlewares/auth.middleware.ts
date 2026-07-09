import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.utils';

declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.warn('⚠️ Token no proporcionado');
            return res.status(401).json({
                success: false,
                error: 'Token no proporcionado'
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        if (!decoded) {
            console.warn('⚠️ Token inválido o expirado');
            return res.status(401).json({
                success: false,
                error: 'Token inválido o expirado'
            });
        }

        // 🔥 Asignar usuario con TODOS los campos necesarios
        req.user = {
            userId: decoded.userId,
            id: decoded.userId,  // 🔥 Para compatibilidad
            email: decoded.email,
            agenciaId: decoded.agenciaId,
            agencia_id: decoded.agenciaId,  // 🔥 Para compatibilidad
            rol: decoded.rol
        };
        
        console.log('👤 Usuario autenticado:', req.user);
        next();
    } catch (error) {
        console.error('❌ Error de autenticación:', error);
        return res.status(401).json({
            success: false,
            error: 'Error de autenticación'
        });
    }
};