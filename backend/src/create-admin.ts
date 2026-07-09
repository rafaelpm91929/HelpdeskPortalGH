import { getConnection } from './config/database';
import { hashPassword } from './shared/utils/bcrypt.utils';

async function createAdmin() {
    try {
        console.log('🔄 Conectando a la base de datos...');
        const pool = await getConnection();
        
        console.log('🔑 Generando hash de contraseña...');
        const hashedPassword = await hashPassword('1234');
        
        console.log('👑 Creando SuperAdmin...');
        const result = await pool.request()
            .input('nombre', 'Roberto')
            .input('apellido', 'Pérez')
            .input('email', 'rpm91929@gmail.com')
            .input('password_hash', hashedPassword)
            .query(`
                -- Eliminar si ya existe
                IF EXISTS (SELECT * FROM tbl_usuarios WHERE email = @email)
                BEGIN
                    DELETE FROM tbl_actividades WHERE usuario_id IN (SELECT id FROM tbl_usuarios WHERE email = @email);
                    DELETE FROM tbl_notificaciones WHERE usuario_id IN (SELECT id FROM tbl_usuarios WHERE email = @email);
                    DELETE FROM tbl_mensajes WHERE usuario_id IN (SELECT id FROM tbl_usuarios WHERE email = @email);
                    DELETE FROM tbl_tickets WHERE usuario_id IN (SELECT id FROM tbl_usuarios WHERE email = @email);
                    DELETE FROM tbl_usuarios WHERE email = @email;
                    PRINT '✅ Usuario anterior eliminado';
                END
                
                -- Insertar nuevo SuperAdmin
                INSERT INTO tbl_usuarios (
                    agencia_id, nombre, apellido, email, password_hash, rol, email_verificado, activo
                ) VALUES (
                    3, @nombre, @apellido, @email, @password_hash, 'superadmin', 1, 1
                );
                
                -- Mostrar resultado
                SELECT id, nombre, apellido, email, rol, agencia_id FROM tbl_usuarios WHERE email = @email;
            `);
        
        console.log('✅ SuperAdmin creado exitosamente');
        console.log('📧 Email: rpm91929@gmail.com');
        console.log('🔑 Contraseña: 1234');
        console.log('👤 Rol: superadmin');
        console.log('🏢 Agencia: Suzuki Montevideo (ID: 3)');
        
        if (result.recordset && result.recordset.length > 0) {
            console.log('📊 Datos del usuario:', result.recordset[0]);
        }
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        console.log('🔌 Cerrando conexión...');
        process.exit(0);
    }
}

createAdmin();