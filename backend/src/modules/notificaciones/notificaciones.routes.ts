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
    const usuarioId = parseInt(req.params.usuario_id);
    console.log(`🔌 Intento de conexión SSE para usuario ID: ${usuarioId}`);

    try {
        // Verificar que el usuario solo escuche sus propias notificaciones
        if (req.user.id != usuarioId) {
            console.warn(`⚠️ Intento de acceso denegado a SSE: req.user.id (${req.user.id}) != usuarioId (${usuarioId})`);
            return res.status(403).json({ success: false, error: 'Acceso denegado' });
        }

        // Configurar cabeceras de SSE de forma robusta
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no' // Desactivar almacenamiento en búfer de Nginx/proxies
        });
        res.flushHeaders();

        // Enviar un comentario inicial para establecer la conexión inmediatamente en el cliente
        res.write(': connected\n\n');
        if (typeof res.flush === 'function') {
            res.flush();
        }
        console.log(`✅ Conexión SSE establecida con éxito para usuario ID: ${usuarioId}`);

        // Enviar un ping cada 10 segundos para mantener la conexión activa
        const pingInterval = setInterval(() => {
            res.write(': ping\n\n');
            if (typeof res.flush === 'function') {
                res.flush();
            }
        }, 10000);

        const listener = (data: any) => {
            if (data.usuario_id == usuarioId) {
                console.log(`🔔 Enviando notificación en tiempo real a usuario ID: ${usuarioId}`, data.notification);
                res.write(`data: ${JSON.stringify(data.notification)}\n\n`);
                if (typeof res.flush === 'function') {
                    res.flush();
                }
            }
        };

        notificationEvents.on('new-notification', listener);

        req.on('close', () => {
            console.log(`🔌 Conexión SSE cerrada para usuario ID: ${usuarioId}`);
            clearInterval(pingInterval);
            notificationEvents.off('new-notification', listener);
            res.end();
        });
    } catch (error: any) {
        console.error(`❌ Error en SSE stream para usuario ID: ${usuarioId}:`, error);
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
                SELECT id, ticket_id, titulo, mensaje, leido, fecha_creacion
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

// ============================================
// POST /api/notificaciones/enviar
// ============================================
router.post('/enviar', async (req: any, res: any) => {
    try {
        const { usuario_id, titulo, mensaje } = req.body;
        if (!usuario_id || !mensaje) {
            return res.status(400).json({ success: false, error: 'Faltan campos requeridos' });
        }

        const pool = await getConnection();
        const result = await pool.request()
            .input('usuario_id', parseInt(usuario_id))
            .input('titulo', titulo || 'Mensaje de SuperAdmin')
            .input('mensaje', mensaje)
            .query(`
                INSERT INTO tbl_notificaciones (usuario_id, titulo, mensaje, leido)
                VALUES (@usuario_id, @titulo, @mensaje, 0);
                SELECT SCOPE_IDENTITY() as id;
            `);

        const notifId = result.recordset[0].id;

        // Emitir evento para tiempo real
        notificationEvents.emit('new-notification', {
            usuario_id: parseInt(usuario_id),
            notification: {
                id: notifId,
                ticket_id: null,
                titulo: titulo || 'Mensaje de SuperAdmin',
                mensaje: mensaje,
                leido: 0,
                fecha_creacion: new Date()
            }
        });

        res.json({ success: true, message: '✉️ Mensaje enviado con éxito' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// POST /api/notificaciones/enviar-todos
// ============================================
router.post('/enviar-todos', async (req: any, res: any) => {
    try {
        const { titulo, mensaje } = req.body;
        if (!mensaje) {
            return res.status(400).json({ success: false, error: 'El mensaje es requerido' });
        }

        const pool = await getConnection();
        // Obtener todos los usuarios con rol = 'admin'
        const adminsResult = await pool.request()
            .query(`SELECT id FROM tbl_usuarios WHERE rol = 'admin' AND activo = 1`);
        
        const admins = adminsResult.recordset;

        for (const admin of admins) {
            const result = await pool.request()
                .input('usuario_id', admin.id)
                .input('titulo', titulo || 'Mensaje Global de SuperAdmin')
                .input('mensaje', mensaje)
                .query(`
                    INSERT INTO tbl_notificaciones (usuario_id, titulo, mensaje, leido)
                    VALUES (@usuario_id, @titulo, @mensaje, 0);
                    SELECT SCOPE_IDENTITY() as id;
                `);
            
            const notifId = result.recordset[0].id;

            // Emitir evento para tiempo real
            notificationEvents.emit('new-notification', {
                usuario_id: admin.id,
                notification: {
                    id: notifId,
                    ticket_id: null,
                    titulo: titulo || 'Mensaje Global de SuperAdmin',
                    mensaje: mensaje,
                    leido: 0,
                    fecha_creacion: new Date()
                }
            });
        }

        res.json({ success: true, message: `✉️ Mensaje enviado a ${admins.length} administradores` });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
