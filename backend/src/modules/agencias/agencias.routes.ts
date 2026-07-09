import { Router } from 'express';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import { getConnection } from '../../config/database';

const router = Router();

// ============================================
// RUTA PÚBLICA - Buscar agencia por subdominio
// ============================================
router.get('/subdominio/:subdominio', async (req, res) => {
    try {
        const { subdominio } = req.params;
        console.log('🔍 Buscando agencia por subdominio:', subdominio);
        
        const pool = await getConnection();
        const result = await pool.request()
            .input('subdominio', subdominio)
            .query(`
                SELECT id, nombre, subdominio, logo_url, 
                       colores_primario, colores_secundario, 
                       colores_fondo, colores_texto, activo
                FROM tbl_agencias 
                WHERE subdominio = @subdominio AND activo = 1
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Agencia no encontrada'
            });
        }

        res.json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error: any) {
        console.error('Error al buscar agencia por subdominio:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================
// RUTA PÚBLICA - Obtener agencia por ID
// ============================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', parseInt(id))
            .query(`
                SELECT id, nombre, subdominio, logo_url, 
                       colores_primario, colores_secundario, 
                       colores_fondo, colores_texto, activo
                FROM tbl_agencias 
                WHERE id = @id AND activo = 1
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Agencia no encontrada'
            });
        }

        res.json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error: any) {
        console.error('Error al obtener agencia por ID:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================
router.use(authMiddleware);

// GET /api/agencias - Listar todas las agencias
router.get('/', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT id, nombre, subdominio, logo_url, 
                   colores_primario, colores_secundario, 
                   colores_fondo, colores_texto,
                   activo, fecha_creacion
            FROM tbl_agencias 
            ORDER BY fecha_creacion DESC
        `);
        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error: any) {
        console.error('Error al listar agencias:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// POST /api/agencias - Crear agencia
router.post('/', async (req, res) => {
    try {
        const { nombre, subdominio, colores_primario, colores_secundario } = req.body;
        
        if (!nombre || !subdominio) {
            return res.status(400).json({
                success: false,
                error: 'Nombre y subdominio son requeridos'
            });
        }

        const pool = await getConnection();
        
        const existing = await pool.request()
            .input('subdominio', subdominio)
            .query('SELECT id FROM tbl_agencias WHERE subdominio = @subdominio');
        
        if (existing.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'El subdominio ya está en uso'
            });
        }

        const result = await pool.request()
            .input('nombre', nombre)
            .input('subdominio', subdominio)
            .input('colores_primario', colores_primario || '#2563eb')
            .input('colores_secundario', colores_secundario || '#3b82f6')
            .input('colores_fondo', '#f3f4f6')
            .input('colores_texto', '#1f2937')
            .query(`
                INSERT INTO tbl_agencias (
                    nombre, subdominio, colores_primario, colores_secundario,
                    colores_fondo, colores_texto
                )
                OUTPUT INSERTED.*
                VALUES (
                    @nombre, @subdominio, @colores_primario, @colores_secundario,
                    @colores_fondo, @colores_texto
                )
            `);
        
        res.status(201).json({
            success: true,
            data: result.recordset[0],
            message: '✅ Agencia creada exitosamente'
        });
    } catch (error: any) {
        console.error('Error al crear agencia:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// PUT /api/agencias/:id - Actualizar agencia
// PUT /api/agencias/:id - Actualizar agencia
router.put('/:id', async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const { 
            nombre, 
            subdominio, 
            colores_primario, 
            colores_secundario,
            colores_fondo,
            colores_texto,
            logo_url 
        } = req.body;
        const currentUser = req.user;

        console.log('========================================');
        console.log('🔧 PUT /api/agencias/:id');
        console.log('📍 ID de agencia a actualizar:', id);
        console.log('👤 Usuario autenticado COMPLETO:', JSON.stringify(currentUser, null, 2));
        console.log('📍 Rol del usuario:', currentUser?.rol);
        console.log('📍 agenciaId del token:', currentUser?.agenciaId);
        console.log('📍 agencia_id del token:', currentUser?.agencia_id);
        console.log('========================================');

        // 🔥 VERIFICACIÓN DE PERMISOS CORREGIDA
        // Si no hay usuario autenticado
        if (!currentUser) {
            return res.status(401).json({
                success: false,
                error: 'No autenticado'
            });
        }

        const agenciaIdFromToken = currentUser.agenciaId || currentUser.agencia_id;
        const agenciaIdFromParams = parseInt(id);

        console.log(`🔍 Comparando: agenciaIdFromToken=${agenciaIdFromToken} vs agenciaIdFromParams=${agenciaIdFromParams}`);

        // SuperAdmin puede todo
        if (currentUser.rol === 'superadmin') {
            console.log('👑 SuperAdmin - Permiso concedido');
        }
        // Admin solo puede modificar su propia agencia
        else if (currentUser.rol === 'admin' && agenciaIdFromToken === agenciaIdFromParams) {
            console.log('🏢 Admin - Permiso concedido para su agencia');
        }
        // Cualquier otro caso: denegado
        else {
            console.log('❌ Permiso denegado');
            console.log(`   Rol: ${currentUser.rol}`);
            console.log(`   agenciaId del token: ${agenciaIdFromToken}`);
            console.log(`   agenciaId solicitada: ${agenciaIdFromParams}`);
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para modificar esta agencia'
            });
        }

        const pool = await getConnection();

        // Verificar si existe
        const existing = await pool.request()
            .input('id', agenciaIdFromParams)
            .query('SELECT id FROM tbl_agencias WHERE id = @id');
        
        if (existing.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Agencia no encontrada'
            });
        }

        // Construir query dinámica
        const updates: string[] = [];
        const request = pool.request();
        request.input('id', agenciaIdFromParams);

        if (nombre !== undefined) {
            updates.push('nombre = @nombre');
            request.input('nombre', nombre);
        }
        if (subdominio !== undefined) {
            updates.push('subdominio = @subdominio');
            request.input('subdominio', subdominio);
        }
        if (colores_primario !== undefined) {
            updates.push('colores_primario = @colores_primario');
            request.input('colores_primario', colores_primario);
        }
        if (colores_secundario !== undefined) {
            updates.push('colores_secundario = @colores_secundario');
            request.input('colores_secundario', colores_secundario);
        }
        if (colores_fondo !== undefined) {
            updates.push('colores_fondo = @colores_fondo');
            request.input('colores_fondo', colores_fondo);
        }
        if (colores_texto !== undefined) {
            updates.push('colores_texto = @colores_texto');
            request.input('colores_texto', colores_texto);
        }
        if (logo_url !== undefined) {
            updates.push('logo_url = @logo_url');
            request.input('logo_url', logo_url);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No hay campos para actualizar'
            });
        }

        const query = `
            SET NOCOUNT ON;
            UPDATE tbl_agencias 
            SET ${updates.join(', ')}
            WHERE id = @id;
            SELECT * FROM tbl_agencias WHERE id = @id;
        `;

        const result = await request.query(query);

        console.log('✅ Agencia actualizada correctamente:', result.recordset[0]);

        res.json({
            success: true,
            data: result.recordset[0],
            message: '✅ Agencia actualizada correctamente'
        });
    } catch (error: any) {
        console.error('❌ Error al actualizar agencia:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// DELETE /api/agencias/:id - Eliminar agencia
router.delete('/:id', async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const currentUser = req.user;

        console.log('========================================');
        console.log('🗑️ DELETE /api/agencias/:id');
        console.log('📍 ID de agencia a eliminar:', id);
        console.log('👤 Usuario autenticado:', currentUser);
        console.log('📍 Rol del usuario:', currentUser?.rol);
        console.log('========================================');

        if (currentUser.rol !== 'superadmin') {
            console.log('❌ Permiso denegado - Solo SuperAdmin');
            return res.status(403).json({
                success: false,
                error: 'Solo el SuperAdmin puede eliminar agencias'
            });
        }

        const pool = await getConnection();
        
        const existing = await pool.request()
            .input('id', parseInt(id))
            .query('SELECT id FROM tbl_agencias WHERE id = @id');
        
        if (existing.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Agencia no encontrada'
            });
        }

        const users = await pool.request()
            .input('id', parseInt(id))
            .query('SELECT COUNT(*) as total FROM tbl_usuarios WHERE agencia_id = @id');
        
        if (users.recordset[0].total > 0) {
            return res.status(400).json({
                success: false,
                error: 'No se puede eliminar la agencia porque tiene usuarios asociados'
            });
        }

        await pool.request()
            .input('id', parseInt(id))
            .query('DELETE FROM tbl_agencias WHERE id = @id');
        
        console.log('✅ Agencia eliminada correctamente');
        
        res.json({
            success: true,
            message: '✅ Agencia eliminada correctamente'
        });
    } catch (error: any) {
        console.error('Error al eliminar agencia:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

export default router;