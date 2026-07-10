import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { testConnection, getConnection } from './config/database';
import authRoutes from './modules/auth/auth.routes';
import agenciasRoutes from './modules/agencias/agencias.routes';
import ticketsRoutes from './modules/tickets/tickets.routes';
import uploadRoutes from './modules/upload/upload.routes';
import areasRoutes from './modules/areas/areas.routes';
import notificacionesRoutes from './modules/notificaciones/notificaciones.routes';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);
const PUBLIC_IP = process.env.PUBLIC_IP || '192.168.26.97';

// ============================================
// CONFIGURACIÓN CORS
// ============================================
app.use(cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    exposedHeaders: ['Content-Length', 'X-Requested-With'],
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
        res.header('Access-Control-Allow-Origin', origin);
    } else {
        res.header('Access-Control-Allow-Origin', '*');
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "unsafe-none" }
}));

// ============================================
// CONFIGURACIÓN DE RATE LIMIT (Límite de peticiones)
// ============================================
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    limit: 1000, // Limita cada IP a un máximo de 1000 solicitudes por ventana
    standardHeaders: 'draft-7', // Retorna información de rate limit en cabeceras estándar
    legacyHeaders: false, // Deshabilita cabeceras antiguas X-RateLimit-*
    message: {
        success: false,
        error: 'Demasiadas solicitudes desde esta dirección IP. Por favor, intente de nuevo en 15 minutos.'
    }
});
app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use('/uploads', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
    next();
}, express.static('uploads'));

// ============================================
// RUTAS DE API
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/agencias', agenciasRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/areas', areasRoutes);
app.use('/api/notificaciones', notificacionesRoutes);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: '🚀 Helpdesk API funcionando',
        timestamp: new Date().toISOString(),
        publicIP: PUBLIC_IP
    });
});

// Prueba de base de datos
app.get('/api/db-test', async (req, res) => {
    try {
        const connected = await testConnection();
        res.json({
            success: connected,
            message: connected ? '✅ Conexión exitosa' : '❌ Error de conexión'
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================
// MIGRACIONES DE BASE DE DATOS
// ============================================
const runMigrations = async () => {
    try {
        const pool = await getConnection();
        console.log('🔄 Ejecutando migraciones de base de datos...');
        
        // 1. Agregar columna numero_secuencial si no existe
        await pool.request().query(`
            IF NOT EXISTS (
                SELECT * FROM sys.columns 
                WHERE object_id = OBJECT_ID('tbl_tickets') AND name = 'numero_secuencial'
            )
            BEGIN
                ALTER TABLE tbl_tickets ADD numero_secuencial INT NULL;
            END
        `);

        // 2. Numerar tickets existentes que tengan numero_secuencial NULL
        await pool.request().query(`
            WITH CTE AS (
                SELECT 
                    id, 
                    numero_secuencial, 
                    ROW_NUMBER() OVER (PARTITION BY agencia_id ORDER BY fecha_creacion ASC) as RowNum
                FROM tbl_tickets
            )
            UPDATE CTE 
            SET numero_secuencial = RowNum
            WHERE numero_secuencial IS NULL;
        `);
        
        console.log('✅ Migraciones de base de datos completadas con éxito');
    } catch (error) {
        console.error('❌ Error ejecutando migraciones:', error);
    }
};

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, '0.0.0.0', async () => {
    console.log('=================================');
    console.log('🚀 HELPDESK PORTAL API');
    console.log('=================================');
    console.log(`📡 Local: http://localhost:${PORT}`);
    console.log(`🌐 Red: http://${PUBLIC_IP}:${PORT}`);
    console.log(`🌍 Internet: http://${PUBLIC_IP}:${PORT}`);
    console.log('=================================');
    console.log(`📦 Entorno: ${process.env.NODE_ENV}`);
    console.log('=================================');
    
    await runMigrations();
    await testConnection();
});