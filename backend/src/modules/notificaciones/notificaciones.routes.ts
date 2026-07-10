import { Router } from 'express';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import { getConnection } from '../../config/database';
import { notificationEvents } from '../../shared/utils/event-emitter';

const router = Router();

router.use(authMiddleware);

// ============================================
// GET /api/notificaciones/stream/:usuario_id (SSE)
// ============================================
router.get('/stream/:usuario_id', async (req: any, res: any) => {
    try {
        const usuarioId = parseInt(req.params.usuario_id);
        
        // Verificar que el usuario solo escuche sus propias notificaciones
        if (req.user.id != usuarioId) {
            return res.status(403).json({ success: false, error: 'Acceso denegado' });
        }

        // Configurar cabeceras de SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Desactivar almacenamiento en búfer de Nginx/proxies
        res.flushHeaders();

        // Enviar un ping cada 10 segundos para mantener la conexión activa
        const pingInterval = setInterval(() => {
            res.write(': ping\n\n');
            if (typeof res.flush === 'function') {
                res.flush();
            }
        }, 10000);

        const listener = (data: any) => {
            if (data.usuario_id == usuarioId) {
                res.write(`data: ${JSON.stringify(data.notification)}\n\n`);
                if (typeof res.flush === 'function') {
                    res.flush();
                }
            }
        };

        notificationEvents.on('new-notification', listener);

        req.on('close', () => {
            clearInterval(pingInterval);
            notificationEvents.off('new-notification', listener);
            res.end();
        });
    } catch (error: any) {
        console.error('❌ Error en SSE stream:', error);
    }
});

// ============================================
// GET /api/notificaciones/usuario/:usuario_id
// ============================================
router.get('/usuario/:usuario_id', async (req: any, res: any) => {
    try {
        const { usuario_id } = req.params;
        const pool = await getConnection();
        const result = await pool.request()
            .input('usuario_id', parseInt(usuario_id))
            .query(`
                SELECT id, ticket_id, mensaje, leido, fecha_creacion
                FROM tbl_notificaciones
                WHERE usuario_id = @usuario_id
                ORDER BY leido ASC, fecha_creacion DESC
            `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================
// PUT /api/notificaciones/:id/leer
// ============================================
router.put('/:id/leer', async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const pool = await getConnection();
        await pool.request()
            .input('id', parseInt(id))
            .query(`
                UPDATE tbl_notificaciones
                SET leido = 1
                WHERE id = @id
            `);

        res.json({
            success: true,
            message: '✅ Notificación marcada como leída'
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================
// PUT /api/notificaciones/usuario/:usuario_id/leer-todas
// ============================================
router.put('/usuario/:usuario_id/leer-todas', async (req: any, res: any) => {
    try {
        const { usuario_id } = req.params;
        const pool = await getConnection();
        await pool.request()
            .input('usuario_id', parseInt(usuario_id))
            .query(`
                UPDATE tbl_notificaciones
                SET leido = 1
                WHERE usuario_id = @usuario_id
            `);

        res.json({
            success: true,
            message: '✅ Todas las notificaciones marcadas como leídas'
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
