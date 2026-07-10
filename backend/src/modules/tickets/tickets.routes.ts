import { Router } from 'express';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import { getConnection } from '../../config/database';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { notificationEvents } from '../../shared/utils/event-emitter';

const router = Router();

// ============================================
// HELPER PARA NOTIFICACIONES
// ============================================
async function crearNotificaciones(ticketId: number, agenciaId: number, mensaje: string, agenteId: number | null, excluirUsuarioId?: number) {
    try {
        const pool = await getConnection();
        const adminsResult = await pool.request()
            .input('agencia_id', agenciaId)
            .query("SELECT id FROM tbl_usuarios WHERE agencia_id = @agencia_id AND rol IN ('admin', 'superadmin')");
            
        const recipients = new Set<number>();
        adminsResult.recordset.forEach((r: any) => recipients.add(r.id));
        
        if (agenteId) {
            recipients.add(agenteId);
        }
        
        if (excluirUsuarioId) {
            recipients.delete(excluirUsuarioId);
        }
        
        // Determinar el título dinámicamente según el mensaje para cumplir con la restricción de NOT NULL en BD
        let titulo = 'Notificación';
        if (mensaje.includes('creado')) {
            titulo = 'Nuevo Ticket';
        } else if (mensaje.includes('reabierto')) {
            titulo = 'Ticket Reabierto';
        } else if (mensaje.includes('mensaje')) {
            titulo = 'Nuevo Mensaje';
        }

        for (const recipientId of recipients) {
            const insertResult = await pool.request()
                .input('usuario_id', recipientId)
                .input('ticket_id', ticketId)
                .input('titulo', titulo)
                .input('mensaje', mensaje)
                .query(`
                    INSERT INTO tbl_notificaciones (usuario_id, ticket_id, titulo, mensaje)
                    VALUES (@usuario_id, @ticket_id, @titulo, @mensaje);
                    
                    SELECT id, ticket_id, mensaje, leido, fecha_creacion
                    FROM tbl_notificaciones
                    WHERE id = SCOPE_IDENTITY();
                `);
            const newNotif = insertResult.recordset[0];
            notificationEvents.emit('new-notification', { usuario_id: recipientId, notification: newNotif });
        }
    } catch (error) {
        console.error('❌ Error al crear notificaciones:', error);
    }
}

// ============================================
// CONFIGURACIÓN DE ARCHIVOS
// ============================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../../uploads/tickets');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = `${uuidv4()}${ext}`;
        cb(null, filename);
    }
});

const fileFilter = (req: any, file: any, cb: any) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Formato no permitido. Solo PDF e imágenes'));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});

// ============================================
// GET /api/tickets/agencia/:agencia_id
// ============================================
router.get('/agencia/:agencia_id', authMiddleware, async (req: any, res: any) => {
    try {
        const { agencia_id } = req.params;
        const currentUser = req.user;

        console.log('📋 GET /tickets/agencia/:agencia_id');
        console.log('📍 Agencia ID:', agencia_id);
        console.log('👤 Usuario:', currentUser);

        const agenciaIdNum = parseInt(agencia_id);
        if (isNaN(agenciaIdNum)) {
            return res.status(400).json({
                success: false,
                error: 'ID de agencia inválido'
            });
        }

        if (currentUser.rol === 'admin' && currentUser.agenciaId !== agenciaIdNum) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para ver tickets de otra agencia'
            });
        }

        const pool = await getConnection();
        const result = await pool.request()
            .input('agencia_id', agenciaIdNum)
            .query(`
                SELECT 
                    t.id,
                    t.asunto,
                    t.tipo,
                    t.estado,
                    t.prioridad,
                    t.descripcion,
                    t.area,
                    t.fecha_creacion,
                    t.fecha_actualizacion,
                    t.fecha_resolucion,
                    t.fecha_cierre,
                    t.archivos_adjuntos,
                    t.numero_secuencial,
                    u.nombre as usuario_nombre,
                    u.apellido as usuario_apellido,
                    u.email as usuario_email,
                    a.nombre as agente_nombre,
                    a.apellido as agente_apellido
                FROM tbl_tickets t
                LEFT JOIN tbl_usuarios u ON t.usuario_id = u.id
                LEFT JOIN tbl_usuarios a ON t.agente_id = a.id
                WHERE t.agencia_id = @agencia_id
                ORDER BY t.fecha_creacion DESC
            `);

        const tickets = result.recordset.map((t: any) => ({
            ...t,
            archivos: t.archivos_adjuntos ? JSON.parse(t.archivos_adjuntos) : []
        }));

        console.log('📊 Tickets encontrados:', tickets.length);

        res.json({
            success: true,
            data: tickets
        });
    } catch (error: any) {
        console.error('❌ Error al obtener tickets:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================
// GET /api/tickets/usuario/:usuario_id
// ============================================
router.get('/usuario/:usuario_id', authMiddleware, async (req: any, res: any) => {
    try {
        const { usuario_id } = req.params;
        const currentUser = req.user;

        console.log('📋 GET /tickets/usuario/:usuario_id');
        console.log('📍 Usuario ID:', usuario_id);

        const usuarioIdNum = parseInt(usuario_id);
        if (isNaN(usuarioIdNum)) {
            return res.status(400).json({
                success: false,
                error: 'ID de usuario inválido'
            });
        }

        // Verificar permisos: el usuario puede ver sus propios tickets
        if (currentUser.id !== usuarioIdNum && currentUser.rol !== 'admin' && currentUser.rol !== 'superadmin') {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para ver estos tickets'
            });
        }

        const pool = await getConnection();
        const result = await pool.request()
            .input('usuario_id', usuarioIdNum)
            .query(`
                SELECT 
                    t.id,
                    t.asunto,
                    t.tipo,
                    t.estado,
                    t.prioridad,
                    t.descripcion,
                    t.area,
                    t.fecha_creacion,
                    t.archivos_adjuntos,
                    t.numero_secuencial,
                    u.nombre as agente_nombre,
                    u.apellido as agente_apellido
                FROM tbl_tickets t
                LEFT JOIN tbl_usuarios u ON t.agente_id = u.id
                WHERE t.usuario_id = @usuario_id
                ORDER BY t.fecha_creacion DESC
            `);

        const tickets = result.recordset.map((t: any) => ({
            ...t,
            archivos: t.archivos_adjuntos ? JSON.parse(t.archivos_adjuntos) : []
        }));

        console.log('📊 Tickets encontrados:', tickets.length);

        res.json({
            success: true,
            data: tickets
        });
    } catch (error: any) {
        console.error('❌ Error al obtener tickets:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================
// 🔥 GET /api/tickets/:id/detalle - Obtener detalle con mensajes
// ============================================
router.get('/:id/detalle', authMiddleware, async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const currentUser = req.user;

        console.log('========================================');
        console.log('📋 GET /tickets/:id/detalle');
        console.log('📍 Ticket ID:', id);
        console.log('👤 Usuario autenticado:', currentUser);
        console.log('========================================');

        const ticketIdNum = parseInt(id);
        if (isNaN(ticketIdNum)) {
            return res.status(400).json({
                success: false,
                error: 'ID de ticket inválido'
            });
        }

        const pool = await getConnection();

        // Obtener ticket
        const ticketResult = await pool.request()
            .input('id', ticketIdNum)
            .query(`
                SELECT 
                    t.id,
                    t.agencia_id,
                    t.usuario_id,
                    t.asunto,
                    t.tipo,
                    t.estado,
                    t.prioridad,
                    t.descripcion,
                    t.area,
                    t.fecha_creacion,
                    t.fecha_actualizacion,
                    t.fecha_resolucion,
                    t.fecha_cierre,
                    t.archivos_adjuntos,
                    t.numero_secuencial,
                    u.nombre as usuario_nombre,
                    u.apellido as usuario_apellido,
                    u.email as usuario_email,
                    a.nombre as agente_nombre,
                    a.apellido as agente_apellido
                FROM tbl_tickets t
                LEFT JOIN tbl_usuarios u ON t.usuario_id = u.id
                LEFT JOIN tbl_usuarios a ON t.agente_id = a.id
                WHERE t.id = @id
            `);

        if (ticketResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Ticket no encontrado'
            });
        }

        const ticket = ticketResult.recordset[0];

        console.log('📊 Ticket encontrado:');
        console.log('   ID:', ticket.id);
        console.log('   Agencia ID:', ticket.agencia_id);
        console.log('   Usuario ID:', ticket.usuario_id);
        console.log('   Estado:', ticket.estado);

        // 🔥 VERIFICAR PERMISOS DETALLADAMENTE
        console.log('🔍 Verificando permisos...');
        console.log(`   Rol del usuario: ${currentUser.rol}`);
        console.log(`   ID del usuario: ${currentUser.id}`);
        console.log(`   Agencia del usuario: ${currentUser.agenciaId}`);
        console.log(`   Agencia del ticket: ${ticket.agencia_id}`);
        console.log(`   Usuario del ticket: ${ticket.usuario_id}`);

        // Superadmin puede ver todo
        if (currentUser.rol === 'superadmin') {
            console.log('✅ SuperAdmin - Permiso concedido');
        }
        // Admin puede ver tickets de su agencia
        else if (currentUser.rol === 'admin' && currentUser.agenciaId === ticket.agencia_id) {
            console.log('✅ Admin - Permiso concedido (misma agencia)');
        }
        // Usuario puede ver sus propios tickets
        else if (currentUser.rol === 'usuario' && currentUser.id === ticket.usuario_id) {
            console.log('✅ Usuario - Permiso concedido (su ticket)');
        }
        // Si es admin pero de otra agencia
        else if (currentUser.rol === 'admin' && currentUser.agenciaId !== ticket.agencia_id) {
            console.log('❌ Admin - Permiso denegado (otra agencia)');
        }
        // Si es usuario pero no es su ticket
        else if (currentUser.rol === 'usuario' && currentUser.id !== ticket.usuario_id) {
            console.log('❌ Usuario - Permiso denegado (no es su ticket)');
        }
        else {
            console.log('❌ Permiso denegado - Rol no reconocido');
        }

        if (currentUser.rol !== 'superadmin' && 
            currentUser.rol !== 'admin' && 
            currentUser.rol !== 'usuario') {
            console.log('❌ Rol no reconocido:', currentUser.rol);
            return res.status(403).json({
                success: false,
                error: 'Rol no válido'
            });
        }

        // Verificar permisos
        if (currentUser.rol === 'admin' && currentUser.agenciaId !== ticket.agencia_id) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para ver este ticket'
            });
        }

        if (currentUser.rol === 'usuario' && currentUser.id !== ticket.usuario_id) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para ver este ticket'
            });
        }

        // Obtener mensajes (solo los que no son internos para usuarios normales)
        let mensajesQuery = `
            SELECT 
                m.id,
                m.ticket_id,
                m.usuario_id,
                m.contenido,
                m.es_interno,
                m.fecha_creacion,
                u.nombre as usuario_nombre,
                u.apellido as usuario_apellido,
                u.rol as usuario_rol
            FROM tbl_mensajes m
            LEFT JOIN tbl_usuarios u ON m.usuario_id = u.id
            WHERE m.ticket_id = @ticket_id
        `;

        // Si es usuario normal, no mostrar mensajes internos
        if (currentUser.rol === 'usuario') {
            mensajesQuery += ` AND (m.es_interno = 0 OR m.es_interno IS NULL)`;
        }

        mensajesQuery += ` ORDER BY m.fecha_creacion ASC`;

        const mensajesResult = await pool.request()
            .input('ticket_id', ticketIdNum)
            .query(mensajesQuery);

        // Parsear archivos
        const ticketData = {
            ...ticket,
            archivos: ticket.archivos_adjuntos ? JSON.parse(ticket.archivos_adjuntos) : [],
            mensajes: mensajesResult.recordset
        };

        console.log('📊 Mensajes encontrados:', mensajesResult.recordset.length);
        console.log('✅ Permiso concedido - Enviando respuesta');

        res.json({
            success: true,
            data: ticketData
        });
    } catch (error: any) {
        console.error('❌ Error al obtener detalle del ticket:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================
// POST /api/tickets - Crear ticket
// ============================================
router.post('/', authMiddleware, upload.array('archivos', 5), async (req: any, res: any) => {
    try {
        const { 
            asunto, 
            tipo, 
            estado, 
            prioridad, 
            area, 
            descripcion, 
            usuario_id, 
            agencia_id 
        } = req.body;

        console.log('📝 POST /tickets - Crear ticket');
        console.log('📝 Datos:', req.body);

        if (!asunto || !descripcion || !usuario_id || !agencia_id) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos requeridos'
            });
        }

        const pool = await getConnection();

        const result = await pool.request()
            .input('agencia_id', parseInt(agencia_id))
            .input('usuario_id', parseInt(usuario_id))
            .input('asunto', asunto)
            .input('tipo', tipo || 'problema')
            .input('descripcion', descripcion)
            .input('prioridad', prioridad || 'media')
            .input('estado', estado || 'pendiente')
            .input('area', area || '')
            .query(`
                INSERT INTO tbl_tickets 
                (agencia_id, usuario_id, asunto, tipo, descripcion, prioridad, estado, area, numero_secuencial)
                OUTPUT INSERTED.id, INSERTED.numero_secuencial
                VALUES (
                    @agencia_id, 
                    @usuario_id, 
                    @asunto, 
                    @tipo, 
                    @descripcion, 
                    @prioridad, 
                    @estado, 
                    @area,
                    COALESCE((SELECT MAX(numero_secuencial) FROM tbl_tickets WHERE agencia_id = @agencia_id), 0) + 1
                )
            `);

        const ticketId = result.recordset[0].id;
        const numeroSecuencial = result.recordset[0].numero_secuencial;

        // Obtener nombre del usuario creador para la notificación
        const userRes = await pool.request()
            .input('usuario_id_notif', parseInt(usuario_id))
            .query('SELECT nombre, apellido FROM tbl_usuarios WHERE id = @usuario_id_notif');
        
        const creadorNombre = userRes.recordset.length > 0
            ? `${userRes.recordset[0].nombre} ${userRes.recordset[0].apellido || ''}`.trim()
            : 'Usuario';

        // Crear notificación para admins de la agencia
        await crearNotificaciones(
            ticketId,
            parseInt(agencia_id),
            `Nuevo ticket #${numeroSecuencial} creado por ${creadorNombre}: ${asunto}`,
            null,
            parseInt(usuario_id)
        );

        const files = req.files || [];
        const fileData = files.map((file: any) => ({
            nombre: file.originalname,
            ruta: `/uploads/tickets/${file.filename}`,
            tamano: file.size,
            tipo: file.mimetype
        }));

        if (fileData.length > 0) {
            await pool.request()
                .input('ticket_id', ticketId)
                .input('archivos', JSON.stringify(fileData))
                .query(`
                    UPDATE tbl_tickets 
                    SET archivos_adjuntos = @archivos
                    WHERE id = @ticket_id
                `);
        }

        res.status(201).json({
            success: true,
            data: { id: ticketId },
            message: '✅ Ticket creado exitosamente'
        });
    } catch (error: any) {
        console.error('❌ Error al crear ticket:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================
// PUT /api/tickets/:id/estado - Cambiar estado
// ============================================
router.put('/:id/estado', authMiddleware, async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const { estado, agente_id } = req.body;
        const currentUser = req.user;

        console.log('📝 PUT /tickets/:id/estado');
        console.log('📍 Ticket ID:', id);
        console.log('📝 Nuevo estado:', estado);

        const pool = await getConnection();

        // Verificar que el ticket existe
        const ticketCheck = await pool.request()
            .input('id', parseInt(id))
            .query('SELECT agencia_id, estado FROM tbl_tickets WHERE id = @id');

        if (ticketCheck.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Ticket no encontrado'
            });
        }

        const ticket = ticketCheck.recordset[0];

        // Verificar permisos
        if (currentUser.rol === 'admin' && currentUser.agenciaId !== ticket.agencia_id) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para modificar este ticket'
            });
        }

        // Obtener datos actuales del ticket
        const ticketInfo = await pool.request()
            .input('id', parseInt(id))
            .query('SELECT numero_secuencial, asunto, agente_id, agencia_id, estado FROM tbl_tickets WHERE id = @id');
        
        if (ticketInfo.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Ticket no encontrado'
            });
        }
        
        const prevEstado = ticketInfo.recordset[0]?.estado;
        const numeroSecuencial = ticketInfo.recordset[0]?.numero_secuencial;
        const asunto = ticketInfo.recordset[0]?.asunto;
        const currentAgenciaId = ticketInfo.recordset[0]?.agencia_id;
        const currentAgenteId = ticketInfo.recordset[0]?.agente_id;

        // Actualizar estado
        await pool.request()
            .input('id', parseInt(id))
            .input('estado', estado)
            .input('agente_id', agente_id || null)
            .query(`
                UPDATE tbl_tickets 
                SET estado = @estado, 
                    agente_id = @agente_id,
                    fecha_actualizacion = GETDATE(),
                    fecha_resolucion = CASE WHEN @estado = 'resuelto' THEN GETDATE() ELSE NULL END,
                    fecha_cierre = CASE WHEN @estado = 'cerrado' THEN GETDATE() ELSE NULL END
                WHERE id = @id
            `);

        // Si el usuario reabre el ticket (pasa de resuelto/cerrado a abierto)
        if (currentUser.rol === 'usuario' && estado === 'abierto' && (prevEstado === 'resuelto' || prevEstado === 'cerrado')) {
            const userRes = await pool.request()
                .input('usuario_id_notif', currentUser.id)
                .query('SELECT nombre, apellido FROM tbl_usuarios WHERE id = @usuario_id_notif');
            
            const reabridorNombre = userRes.recordset.length > 0
                ? `${userRes.recordset[0].nombre} ${userRes.recordset[0].apellido || ''}`.trim()
                : 'Usuario';

            await crearNotificaciones(
                parseInt(id),
                currentAgenciaId,
                `El ticket #${numeroSecuencial} ha sido reabierto por ${reabridorNombre}: ${asunto}`,
                currentAgenteId,
                currentUser.id
            );
        }

        // Obtener el ticket actualizado
        const result = await pool.request()
            .input('id', parseInt(id))
            .query(`
                SELECT 
                    t.*,
                    u.nombre as usuario_nombre,
                    u.apellido as usuario_apellido,
                    u.email as usuario_email,
                    a.nombre as agente_nombre,
                    a.apellido as agente_apellido
                FROM tbl_tickets t
                LEFT JOIN tbl_usuarios u ON t.usuario_id = u.id
                LEFT JOIN tbl_usuarios a ON t.agente_id = a.id
                WHERE t.id = @id
            `);

        res.json({
            success: true,
            data: result.recordset[0],
            message: '✅ Estado actualizado correctamente'
        });
    } catch (error: any) {
        console.error('❌ Error al cambiar estado:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================
// PUT /api/tickets/:id/asignar - Asignar agente
// ============================================
router.put('/:id/asignar', authMiddleware, async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const { agente_id } = req.body;
        const currentUser = req.user;

        console.log('📝 PUT /tickets/:id/asignar');
        console.log('📍 Ticket ID:', id);
        console.log('👤 Agente ID:', agente_id);

        const pool = await getConnection();

        const ticketCheck = await pool.request()
            .input('id', parseInt(id))
            .query('SELECT agencia_id FROM tbl_tickets WHERE id = @id');

        if (ticketCheck.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Ticket no encontrado'
            });
        }

        const ticket = ticketCheck.recordset[0];

        if (currentUser.rol === 'admin' && currentUser.agenciaId !== ticket.agencia_id) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para modificar este ticket'
            });
        }

        await pool.request()
            .input('id', parseInt(id))
            .input('agente_id', agente_id)
            .query(`
                UPDATE tbl_tickets 
                SET agente_id = @agente_id,
                    fecha_actualizacion = GETDATE()
                WHERE id = @id
            `);

        res.json({
            success: true,
            message: '✅ Agente asignado correctamente'
        });
    } catch (error: any) {
        console.error('❌ Error al asignar agente:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================
// POST /api/tickets/:id/responder - Responder ticket
// ============================================
router.post('/:id/responder', authMiddleware, async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const { mensaje, usuario_id, es_interno } = req.body;
        const currentUser = req.user;

        console.log('📝 POST /tickets/:id/responder');
        console.log('📍 Ticket ID:', id);
        console.log('📝 Mensaje:', mensaje);

        if (!mensaje) {
            return res.status(400).json({
                success: false,
                error: 'El mensaje es requerido'
            });
        }

        const pool = await getConnection();

        const ticketCheck = await pool.request()
            .input('id', parseInt(id))
            .query('SELECT agencia_id FROM tbl_tickets WHERE id = @id');

        if (ticketCheck.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Ticket no encontrado'
            });
        }

        const ticket = ticketCheck.recordset[0];

        if (currentUser.rol === 'admin' && currentUser.agenciaId !== ticket.agencia_id) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para responder este ticket'
            });
        }

        await pool.request()
            .input('ticket_id', parseInt(id))
            .input('usuario_id', parseInt(usuario_id) || currentUser.userId)
            .input('contenido', mensaje)
            .input('es_interno', es_interno || 0)
            .query(`
                INSERT INTO tbl_mensajes (ticket_id, usuario_id, contenido, es_interno)
                VALUES (@ticket_id, @usuario_id, @contenido, @es_interno)
            `);

        // Actualizar fecha de actualización del ticket
        await pool.request()
            .input('id', parseInt(id))
            .query(`
                UPDATE tbl_tickets 
                SET fecha_actualizacion = GETDATE()
                WHERE id = @id
            `);

        // Si el remitente es un cliente/usuario, notificar a los admins/agente
        if (currentUser.rol === 'usuario') {
            const ticketInfo = await pool.request()
                .input('id', parseInt(id))
                .input('usuario_id_notif', currentUser.id)
                .query(`
                    SELECT t.numero_secuencial, t.agente_id, t.agencia_id, u.nombre, u.apellido
                    FROM tbl_tickets t
                    INNER JOIN tbl_usuarios u ON u.id = @usuario_id_notif
                    WHERE t.id = @id
                `);
            
            if (ticketInfo.recordset.length > 0) {
                const { numero_secuencial, agente_id, agencia_id, nombre, apellido } = ticketInfo.recordset[0];
                const remitenteNombre = nombre ? `${nombre} ${apellido || ''}`.trim() : 'Usuario';
                await crearNotificaciones(
                    parseInt(id),
                    agencia_id,
                    `Nuevo mensaje en ticket #${numero_secuencial} de ${remitenteNombre}`,
                    agente_id,
                    currentUser.id
                );
            }
        }

        res.json({
            success: true,
            message: '✅ Respuesta enviada correctamente'
        });
    } catch (error: any) {
        console.error('❌ Error al responder ticket:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;