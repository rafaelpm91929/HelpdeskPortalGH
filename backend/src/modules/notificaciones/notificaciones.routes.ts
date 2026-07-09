import { Router } from 'express';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import { getConnection } from '../../config/database';

const router = Router();

router.use(authMiddleware);

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
