import { getConnection } from './config/database';

async function setupUsageTracking() {
    try {
        console.log('🔄 Conectando a la base de datos...');
        const pool = await getConnection();
        
        console.log('📊 Verificando si existe la columna ultimo_ping en tbl_usuarios...');
        const checkColumn = await pool.request().query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'tbl_usuarios' AND COLUMN_NAME = 'ultimo_ping';
        `);

        if (checkColumn.recordset.length === 0) {
            console.log('🛠️ Añadiendo columna ultimo_ping a tbl_usuarios...');
            await pool.request().query(`
                ALTER TABLE tbl_usuarios ADD ultimo_ping DATETIME NULL;
            `);
            console.log('✅ Columna ultimo_ping añadida.');
        } else {
            console.log('✨ La columna ultimo_ping ya existe.');
        }

        console.log('📊 Verificando si existe la tabla tbl_uso_tiempo...');
        const checkTable = await pool.request().query(`
            SELECT * FROM sysobjects WHERE name='tbl_uso_tiempo' and xtype='U';
        `);

        if (checkTable.recordset.length === 0) {
            console.log('🛠️ Creando tabla tbl_uso_tiempo...');
            await pool.request().query(`
                CREATE TABLE tbl_uso_tiempo (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    usuario_id INT NOT NULL,
                    fecha DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
                    segundos_uso INT DEFAULT 0,
                    CONSTRAINT FK_tbl_uso_tiempo_usuarios FOREIGN KEY (usuario_id) REFERENCES tbl_usuarios(id) ON DELETE CASCADE,
                    CONSTRAINT UQ_usuario_fecha UNIQUE (usuario_id, fecha)
                );
            `);
            console.log('✅ Tabla tbl_uso_tiempo creada con éxito.');
        } else {
            console.log('✨ La tabla tbl_uso_tiempo ya existe.');
        }

    } catch (error) {
        console.error('❌ Error al actualizar la base de datos:', error);
    } finally {
        console.log('🔌 Proceso finalizado.');
        process.exit(0);
    }
}

setupUsageTracking();
