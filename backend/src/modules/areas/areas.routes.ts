import { Router } from 'express';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import { getConnection } from '../../config/database';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/areas/:agencia_id - Listar áreas de una agencia
router.get('/:agencia_id', async (req: any, res: any) => {
    try {
        const { agencia_id } = req.params;
        const currentUser = req.user;

        console.log('📋 Listando áreas para agencia:', agencia_id);
        console.log('👤 Usuario:', currentUser);

        // Verificar permisos
        if (currentUser.rol !== 'superadmin' && currentUser.agenciaId !== parseInt(agencia_id)) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para ver áreas de otra agencia'
            });
        }

        const pool = await getConnection();
        const result = await pool.request()
            .input('agencia_id', parseInt(agencia_id))
            .query(`
                SELECT id, nombre, descripcion, activo, fecha_creacion
                FROM tbl_areas
                WHERE agencia_id = @agencia_id
                ORDER BY nombre ASC
            `);

        console.log('📋 Áreas encontradas:', result.recordset.length);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error: any) {
        console.error('Error al listar áreas:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/areas - Crear área
router.post('/', async (req: any, res: any) => {
    try {
        const { nombre, descripcion, agencia_id } = req.body;
        const currentUser = req.user;

        console.log('📝 Creando área:', { nombre, agencia_id });

        if (!nombre || !agencia_id) {
            return res.status(400).json({
                success: false,
                error: 'Nombre y agencia_id son requeridos'
            });
        }

        // Verificar permisos
        if (currentUser.rol !== 'superadmin' && currentUser.agenciaId !== parseInt(agencia_id)) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para crear áreas en otra agencia'
            });
        }

        const pool = await getConnection();

        // Verificar si ya existe
        const existing = await pool.request()
            .input('agencia_id', parseInt(agencia_id))
            .input('nombre', nombre)
            .query('SELECT id FROM tbl_areas WHERE agencia_id = @agencia_id AND nombre = @nombre');

        if (existing.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Ya existe un área con ese nombre en esta agencia'
            });
        }

        const result = await pool.request()
            .input('agencia_id', parseInt(agencia_id))
            .input('nombre', nombre)
            .input('descripcion', descripcion || '')
            .query(`
                INSERT INTO tbl_areas (agencia_id, nombre, descripcion)
                OUTPUT INSERTED.*
                VALUES (@agencia_id, @nombre, @descripcion)
            `);

        res.status(201).json({
            success: true,
            data: result.recordset[0],
            message: '✅ Área creada exitosamente'
        });
    } catch (error: any) {
        console.error('Error al crear área:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// PUT /api/areas/:id - Actualizar área
router.put('/:id', async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, activo } = req.body;
        const currentUser = req.user;

        console.log('✏️ Actualizando área:', id);

        const pool = await getConnection();

        // Verificar que el área existe y obtener su agencia
        const areaCheck = await pool.request()
            .input('id', parseInt(id))
            .query('SELECT agencia_id FROM tbl_areas WHERE id = @id');

        if (areaCheck.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Área no encontrada'
            });
        }

        const agenciaId = areaCheck.recordset[0].agencia_id;

        // Verificar permisos
        if (currentUser.rol !== 'superadmin' && currentUser.agenciaId !== agenciaId) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para modificar áreas de otra agencia'
            });
        }

        const updates: string[] = [];
        const request = pool.request();
        request.input('id', parseInt(id));

        if (nombre !== undefined) {
            updates.push('nombre = @nombre');
            request.input('nombre', nombre);
        }
        if (descripcion !== undefined) {
            updates.push('descripcion = @descripcion');
            request.input('descripcion', descripcion);
        }
        if (activo !== undefined) {
            updates.push('activo = @activo');
            request.input('activo', activo ? 1 : 0);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No hay campos para actualizar'
            });
        }

        const query = `
            SET NOCOUNT ON;
            UPDATE tbl_areas
            SET ${updates.join(', ')}
            WHERE id = @id;
            SELECT * FROM tbl_areas WHERE id = @id;
        `;

        const result = await request.query(query);

        res.json({
            success: true,
            data: result.recordset[0],
            message: '✅ Área actualizada correctamente'
        });
    } catch (error: any) {
        console.error('Error al actualizar área:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// DELETE /api/areas/:id - Eliminar área
router.delete('/:id', async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const currentUser = req.user;

        console.log('🗑️ Eliminando área:', id);

        const pool = await getConnection();

        // Verificar que el área existe y obtener su agencia
        const areaCheck = await pool.request()
            .input('id', parseInt(id))
            .query('SELECT agencia_id FROM tbl_areas WHERE id = @id');

        if (areaCheck.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Área no encontrada'
            });
        }

        const agenciaId = areaCheck.recordset[0].agencia_id;

        // Verificar permisos
        if (currentUser.rol !== 'superadmin' && currentUser.agenciaId !== agenciaId) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para eliminar áreas de otra agencia'
            });
        }

        await pool.request()
            .input('id', parseInt(id))
            .query('DELETE FROM tbl_areas WHERE id = @id');

        res.json({
            success: true,
            message: '✅ Área eliminada correctamente'
        });
    } catch (error: any) {
        console.error('Error al eliminar área:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;