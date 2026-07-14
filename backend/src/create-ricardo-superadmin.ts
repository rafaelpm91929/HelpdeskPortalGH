import { getConnection } from './config/database';
import { hashPassword } from './shared/utils/bcrypt.utils';

async function createRicardo() {
    try {
        console.log('🔄 Conectando a la base de datos...');
        const pool = await getConnection();
        
        console.log('🔑 Generando hash de contraseña...');
        const hashedPassword = await hashPassword('1234');
        
        console.log('👑 Creando SuperAdmin Ricardo Perez...');
        const result = await pool.request()
            .input('nombre', 'Ricardo')
            .input('apellido', 'Perez')
            .input('email', 'ricardo.perez@smartsolutions.com.mx')
            .input('password_hash', hashedPassword)
            .input('puesto', 'Gerente de Sistemas')
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
                    agencia_id, nombre, apellido, email, password_hash, rol, email_verificado, activo, puesto
                ) VALUES (
                    3, @nombre, @apellido, @email, @password_hash, 'superadmin', 1, 1, @puesto
                );
                
                -- Mostrar resultado
                SELECT id, nombre, apellido, email, rol, agencia_id, puesto FROM tbl_usuarios WHERE email = @email;
            `);
        
        console.log('✅ SuperAdmin Ricardo Perez creado exitosamente');
        console.log('📧 Email: ricardo.perez@smartsolutions.com.mx');
        console.log('🔑 Contraseña: 1234');
        console.log('👤 Rol: superadmin');
        console.log('🏢 Puesto: Gerente de Sistemas');
        
        if (result.recordset && result.recordset.length > 0) {
            console.log('📊 Datos del usuario:', result.recordset[0]);
        }
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit(0);
    }
}

createRicardo();
