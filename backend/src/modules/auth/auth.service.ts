import { UsuarioModel } from '../../shared/models/Usuario.model';
import { generateToken } from '../../shared/utils/jwt.utils';
import { hashPassword, comparePassword } from '../../shared/utils/bcrypt.utils';

export class AuthService {
    static async register(userData: any): Promise<any> {
        const existingUser = await UsuarioModel.findByEmail(userData.email, userData.agencia_id);
        if (existingUser) {
            throw new Error('El email ya está registrado');
        }

        const hashedPassword = await hashPassword(userData.password);

        const userId = await UsuarioModel.create({
            agencia_id: userData.agencia_id,
            nombre: userData.nombre,
            apellido: userData.apellido,
            email: userData.email,
            password_hash: hashedPassword,
            rol: userData.rol || 'usuario',
            telefono: userData.telefono || '',
            puesto: userData.puesto || '',
            area: userData.area || ''  // 🔥 Área asignada por admin
        });

        console.log('👤 Usuario registrado:', { userId, agencia_id: userData.agencia_id, area: userData.area });

        const token = generateToken({
            userId: userId,
            email: userData.email,
            agenciaId: userData.agencia_id,
            rol: userData.rol || 'usuario'
        });

        return {
            token,
            user: {
                id: userId,
                nombre: userData.nombre,
                apellido: userData.apellido,
                email: userData.email,
                rol: userData.rol || 'usuario',
                agencia_id: userData.agencia_id,
                telefono: userData.telefono || '',
                puesto: userData.puesto || '',
                area: userData.area || ''  // 🔥 Incluir área en la respuesta
            }
        };
    }

    static async login(email: string, password: string): Promise<any> {
        const user = await UsuarioModel.findByEmail(email);
        if (!user) {
            throw new Error('Credenciales inválidas');
        }

        if (!user.activo) {
            throw new Error('Usuario desactivado');
        }

        const passwordMatch = await comparePassword(password, user.password_hash);
        if (!passwordMatch) {
            throw new Error('Credenciales inválidas');
        }

        await UsuarioModel.updateLastAccess(user.id);

        console.log('👤 Usuario logueado:', { 
            userId: user.id, 
            agencia_id: user.agencia_id, 
            area: user.area 
        });

        const token = generateToken({
            userId: user.id,
            email: user.email,
            agenciaId: user.agencia_id,
            rol: user.rol
        });

        return {
            token,
            user: {
                id: user.id,
                nombre: user.nombre,
                apellido: user.apellido,
                email: user.email,
                rol: user.rol,
                agencia_id: user.agencia_id,
                telefono: user.telefono || '',
                puesto: user.puesto || '',
                area: user.area || ''  // 🔥 Incluir área en la respuesta
            }
        };
    }

    static async getUsersByAgencia(agenciaId: number): Promise<any[]> {
        return await UsuarioModel.findByAgencia(agenciaId);
    }
}

export default AuthService;