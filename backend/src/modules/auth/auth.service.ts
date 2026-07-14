import { UsuarioModel } from '../../shared/models/Usuario.model';
import { generateToken } from '../../shared/utils/jwt.utils';
import { hashPassword, comparePassword } from '../../shared/utils/bcrypt.utils';
import { getConnection } from '../../config/database';

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

    static async login(email: string, password: string, agenciaId?: number): Promise<any> {
        const pool = await getConnection();
        
        let query = `
            SELECT u.*, a.nombre as agencia_nombre, a.subdominio as agencia_subdominio 
            FROM tbl_usuarios u 
            JOIN tbl_agencias a ON u.agencia_id = a.id
            WHERE u.email = @email AND u.activo = 1 AND a.activa = 1
        `;
        const request = pool.request().input('email', email);
        
        if (agenciaId) {
            query += ' AND u.agencia_id = @agenciaId';
            request.input('agenciaId', agenciaId);
        }
        
        const result = await request.query(query);
        const dbUsers = result.recordset;
        
        if (dbUsers.length === 0) {
            throw new Error('Credenciales inválidas');
        }
        
        // Si hay múltiples agencias asociadas a este correo
        if (!agenciaId && dbUsers.length > 1) {
            const validAgencies = [];
            for (const u of dbUsers) {
                const passwordMatch = await comparePassword(password, u.password_hash);
                if (passwordMatch) {
                    validAgencies.push({
                        id: u.agencia_id,
                        nombre: u.agencia_nombre,
                        subdominio: u.agencia_subdominio
                    });
                }
            }
            
            if (validAgencies.length === 0) {
                throw new Error('Credenciales inválidas');
            }
            
            // Si el correo y contraseña coinciden en más de una agencia, solicitar selección
            if (validAgencies.length > 1) {
                return {
                    requiresAgencySelection: true,
                    agencias: validAgencies
                };
            }
            
            // Si la contraseña solo coincidió con una cuenta de las agencias
            const singleUser = dbUsers.find(u => u.agencia_id === validAgencies[0].id);
            return this.generateUserSession(singleUser);
        }
        
        // Si hay una sola agencia o ya se seleccionó una
        const candidateUser = dbUsers[0];
        const passwordMatch = await comparePassword(password, candidateUser.password_hash);
        if (!passwordMatch) {
            throw new Error('Credenciales inválidas');
        }
        
        return this.generateUserSession(candidateUser);
    }
    
    private static async generateUserSession(user: any) {
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
                area: user.area || ''
            }
        };
    }

    static async getUsersByAgencia(agenciaId: number): Promise<any[]> {
        return await UsuarioModel.findByAgencia(agenciaId);
    }
}

export default AuthService;