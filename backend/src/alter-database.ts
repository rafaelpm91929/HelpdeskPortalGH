import { getConnection } from './config/database';

async function alterDatabase() {
    try {
        console.log('🔄 Conectando a la base de datos...');
        const pool = await getConnection();
        
        console.log('📊 Consultando esquema actual de tbl_agencias...');
        const querySchema = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'tbl_agencias' 
              AND COLUMN_NAME IN ('colores_primario', 'colores_secundario', 'colores_fondo', 'colores_texto');
        `);
        console.log('📌 Columnas encontradas:', querySchema.recordset);

        console.log('🛠️ Alterando columnas de colores en tbl_agencias a VARCHAR(255)...');
        await pool.request().query(`
            ALTER TABLE tbl_agencias ALTER COLUMN colores_primario VARCHAR(255) NULL;
            ALTER TABLE tbl_agencias ALTER COLUMN colores_secundario VARCHAR(255) NULL;
            ALTER TABLE tbl_agencias ALTER COLUMN colores_fondo VARCHAR(255) NULL;
            ALTER TABLE tbl_agencias ALTER COLUMN colores_texto VARCHAR(255) NULL;
        `);
        console.log('✅ Alteración de columnas completada exitosamente.');

        const querySchemaAfter = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'tbl_agencias' 
              AND COLUMN_NAME IN ('colores_primario', 'colores_secundario', 'colores_fondo', 'colores_texto');
        `);
        console.log('📌 Columnas después de la alteración:', querySchemaAfter.recordset);

    } catch (error) {
        console.error('❌ Error al alterar la base de datos:', error);
    } finally {
        console.log('🔌 Cerrando conexión...');
        process.exit(0);
    }
}

alterDatabase();
