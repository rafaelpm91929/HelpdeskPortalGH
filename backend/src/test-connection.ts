import sql from 'mssql';

async function testDirectConnection() {
    console.log('🧪 Probando conexión directa...');
    
    const config = {
        user: 'sa',
        password: 'Admin3808#',
        server: '192.168.26.97',
        database: 'helpdeskDB',
        port: 1433,
        options: {
            encrypt: false,
            trustServerCertificate: true,
            enableArithAbort: true
        }
    };

    try {
        console.log('🔄 Conectando...');
        const pool = await sql.connect(config);
        console.log('✅ Conectado!');
        
        const result = await pool.request().query('SELECT GETDATE() as fecha');
        console.log('📅 Fecha:', result.recordset[0].fecha);
        
        await pool.close();
        console.log('🔌 Conexión cerrada');
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testDirectConnection();