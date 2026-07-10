const mssql = require('mssql');
const bcrypt = require('bcrypt');

const config = {
    user: 'admin',
    password: 'sa',
    server: '192.168.26.97',
    database: 'helpdeskDB',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function run() {
    try {
        console.log('🔄 Conectando a la base de datos...');
        await mssql.connect(config);
        
        console.log('🔑 Generando hash de contraseña...');
        const hashedPassword = await bcrypt.hash('1234', 10);
        
        console.log('👑 Creando SuperAdmin Ricardo Perez...');
        const request = new mssql.Request();
        request.input('nombre', 'Ricardo');
        request.input('apellido', 'Perez');
        request.input('email', 'ricardo.perez@grupohuerta.mx');
        request.input('password_hash', hashedPassword);
        request.input('puesto', 'Gerente de Sistemas');

        const result = await request.query(`
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
        console.log('📧 Email: ricardo.perez@grupohuerta.mx');
        console.log('🔑 Contraseña: 1234');
        console.log('👤 Rol: superadmin');
        console.log('🏢 Puesto: Gerente de Sistemas');
        
        if (result.recordset && result.recordset.length > 0) {
            console.log('📊 Datos del usuario:', result.recordset[0]);
        }
    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await mssql.close();
        process.exit(0);
    }
}

run();
