import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'mi_clave_super_secreta_123456789';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const generateToken = (payload: any): string => {
    console.log('🔑 Generando token con payload:', payload);
    
    // 🔥 Asegurar que el payload sea un objeto plano
    const tokenPayload = {
        userId: payload.userId,
        email: payload.email,
        agenciaId: payload.agenciaId,
        rol: payload.rol
    };
    
    // 🔥 Usar la firma correcta de jwt.sign
    const token = jwt.sign(
        tokenPayload,
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );
    
    return token;
};

export const verifyToken = (token: string): any => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('✅ Token verificado:', decoded);
        return decoded;
    } catch (error) {
        console.error('❌ Error verificando token:', error);
        return null;
    }
};