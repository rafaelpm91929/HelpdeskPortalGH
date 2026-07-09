import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

// ============================================
// CONFIGURACIÓN DE SQL SERVER
// ============================================
const dbConfig = {
    user: process.env.DB_USER || 'admin',      // 🔥 Usuario: admin
    password: process.env.DB_PASSWORD || 'sa', // 🔥 Contraseña: sa
    server: process.env.DB_HOST || '192.168.26.97',
    database: process.env.DB_NAME || 'helpdeskDB',
    port: parseInt(process.env.DB_PORT || '1433'),
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectTimeout: 30000,
        requestTimeout: 30000,
        useUTC: false
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// ============================================
// MOSTRAR CONFIGURACIÓN
// ============================================
console.log('=================================');
console.log('🔧 CONFIGURACIÓN DE CONEXIÓN:');
console.log(`   📍 Servidor: ${dbConfig.server}`);
console.log(`   📍 Puerto: ${dbConfig.port}`);
console.log(`   📍 Base de datos: ${dbConfig.database}`);
console.log(`   👤 Usuario: ${dbConfig.user}`);
console.log(`   🔑 Contraseña: ${'*'.repeat(dbConfig.password.length)}`);
console.log('=================================');

// ============================================
// POOL DE CONEXIONES
// ============================================
let pool: sql.ConnectionPool | null = null;

// ============================================
// FUNCIÓN PARA OBTENER CONEXIÓN
// ============================================
export const getConnection = async (): Promise<sql.ConnectionPool> => {
    try {
        if (!pool) {
            console.log('🔄 Conectando a SQL Server...');
            pool = await sql.connect(dbConfig);
            console.log('✅ Conectado a SQL Server exitosamente');
        }
        return pool;
    } catch (error: any) {
        console.error('❌ Error conectando a SQL Server:');
        console.error(`   📝 Mensaje: ${error.message}`);
        if (error.code) {
            console.error(`   🔍 Código: ${error.code}`);
        }
        throw error;
    }
};

// ============================================
// FUNCIÓN PARA CERRAR CONEXIÓN
// ============================================
export const closeConnection = async (): Promise<void> => {
    if (pool) {
        await pool.close();
        pool = null;
        console.log('🔌 Conexión cerrada');
    }
};

// ============================================
// FUNCIÓN PARA PROBAR CONEXIÓN
// ============================================
export const testConnection = async (): Promise<boolean> => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT 
                GETDATE() as fecha,
                SYSTEM_USER as usuario,
                DB_NAME() as base_datos,
                @@VERSION as version
        `);
        console.log('✅ Prueba de conexión exitosa:');
        console.log(`   📅 Fecha: ${result.recordset[0].fecha}`);
        console.log(`   👤 Usuario: ${result.recordset[0].usuario}`);
        console.log(`   📊 Base de datos: ${result.recordset[0].base_datos}`);
        console.log(`   📌 SQL Server: ${result.recordset[0].version.substring(0, 60)}...`);
        return true;
    } catch (error: any) {
        console.error('❌ Error en prueba de conexión:');
        console.error(`   ${error.message}`);
        return false;
    }
};