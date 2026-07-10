const mssql = require('mssql');
const fs = require('fs');
const path = require('path');

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

const manualsSourceDir = 'C:\\Users\\Sistemas\\Desktop\\heldeskportal';
const manualsDestDir = path.join(__dirname, '../uploads/manuales');

async function run() {
    try {
        console.log('📁 Creando carpeta de destino si no existe:', manualsDestDir);
        if (!fs.existsSync(manualsDestDir)) {
            fs.mkdirSync(manualsDestDir, { recursive: true });
        }

        const files = [
            { name: 'Manual_Superadmin.doc', label: 'Manual de Superadministrador' },
            { name: 'Manual_Admin.doc', label: 'Manual de Administrador de Agencia' },
            { name: 'Manual_Usuario.doc', label: 'Manual de Cliente / Usuario Final' }
        ];

        console.log('🔄 Conectando a la base de datos...');
        await mssql.connect(config);

        for (const file of files) {
            const srcPath = path.join(manualsSourceDir, file.name);
            const destPath = path.join(manualsDestDir, file.name);
            
            if (fs.existsSync(srcPath)) {
                console.log(`📋 Copiando ${file.name} a uploads...`);
                fs.copyFileSync(srcPath, destPath);

                const relativePath = `/uploads/manuales/${file.name}`;
                
                // Verificar si ya existe en la base de datos
                const checkReq = new mssql.Request();
                checkReq.input('ruta', relativePath);
                const checkRes = await checkReq.query('SELECT id FROM tbl_manuales WHERE ruta = @ruta');

                if (checkRes.recordset.length === 0) {
                    console.log(`💾 Registrando en BD: ${file.label}`);
                    const insertReq = new mssql.Request();
                    insertReq.input('nombre', file.label);
                    insertReq.input('ruta', relativePath);
                    await insertReq.query('INSERT INTO tbl_manuales (nombre, ruta) VALUES (@nombre, @ruta)');
                } else {
                    console.log(`⚠️ Ya registrado en BD: ${file.name}`);
                }
            } else {
                console.error(`❌ Archivo no encontrado en origen: ${srcPath}`);
            }
        }

        console.log('✅ Proceso completado exitosamente.');
    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await mssql.close();
        process.exit(0);
    }
}

run();
