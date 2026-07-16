import { Router } from 'express';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import { getConnection } from '../../config/database';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { notificationEvents } from '../../shared/utils/event-emitter';
import { sendNotificationEmail } from '../../shared/utils/email.service';

const router = Router();

// ============================================
// LOGS A ARCHIVO PARA DEPURACIÓN
// ============================================
export function writeLog(message: string) {
    try {
        const logPath = path.join(__dirname, '../../../debug.log');
        const timestamp = new Date().toISOString();
        fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
    } catch (e) {
        console.error('Error writing log file:', e);
    }
}

// ============================================
// HELPER PARA NOTIFICACIONES
// ============================================
export async function crearNotificaciones(ticketId: number, agenciaId: number, mensaje: string, agenteId: number | null, excluirUsuarioId?: number) {
    try {
        writeLog(`[crearNotificaciones] Iniciando - ticketId: ${ticketId}, agenciaId: ${agenciaId}, mensaje: "${mensaje}", agenteId: ${agenteId}, excluirUsuarioId: ${excluirUsuarioId}`);
        const pool = await getConnection();
        
        // Obtener datos de la agencia (nombre para el correo)
        const agenciaRes = await pool.request()
            .input('agencia_id', agenciaId)
            .query("SELECT nombre FROM tbl_agencias WHERE id = @agencia_id");
        
        const nombreAgencia = agenciaRes.recordset.length > 0 ? agenciaRes.recordset[0].nombre : 'Helpdesk';

        // Enlace del portal estático para atender la solicitud (Soporte HTTPS)
        const linkPortal = 'https://helpdesksmartsolutions.mooo.com:5173/';

        // Seleccionamos tanto el ID como el email de los admins y superadmins de la agencia
        const adminsResult = await pool.request()
            .input('agencia_id', agenciaId)
            .query("SELECT id, email FROM tbl_usuarios WHERE agencia_id = @agencia_id AND rol IN ('admin', 'superadmin')");
            
        // Mapa de destinatarios: id -> email
        const recipientMap = new Map<number, string>();
        adminsResult.recordset.forEach((r: any) => {
            if (r.email) {
                recipientMap.set(r.id, r.email);
            }
        });
        
        if (agenteId) {
            // Obtener el email del agente asignado
            const agenteRes = await pool.request()
                .input('agente_id', agenteId)
                .query("SELECT email FROM tbl_usuarios WHERE id = @agente_id");
            if (agenteRes.recordset.length > 0 && agenteRes.recordset[0].email) {
                recipientMap.set(agenteId, agenteRes.recordset[0].email);
            }
        }
        
        if (excluirUsuarioId) {
            recipientMap.delete(excluirUsuarioId);
        }

        writeLog(`[crearNotificaciones] Destinatarios finales calculados (IDs): ${Array.from(recipientMap.keys()).join(', ')}`);
        
        // Determinar el título dinámicamente según el mensaje para cumplir con la restricción de NOT NULL en BD
        let titulo = 'Notificación';
        if (mensaje.includes('creado')) {
            titulo = 'Nuevo Ticket';
        } else if (mensaje.includes('reabierto')) {
            titulo = 'Ticket Reabierto';
        } else if (mensaje.includes('mensaje')) {
            titulo = 'Nuevo Mensaje';
        }

        for (const [recipientId, recipientEmail] of recipientMap.entries()) {
            writeLog(`[crearNotificaciones] Intentando insertar en tbl_notificaciones para usuario: ${recipientId}`);
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
            writeLog(`[crearNotificaciones] ✅ Inserción exitosa para usuario: ${recipientId} - Notif ID: ${newNotif?.id}`);
            notificationEvents.emit('new-notification', { usuario_id: recipientId, notification: newNotif });

            // 🔥 ENVIAR NOTIFICACIÓN POR EMAIL VÍA EMAILJS, SMTP O RESEND (SOLO CUANDO SE CREA EL TICKET)
            if (titulo === 'Nuevo Ticket' && (process.env.EMAILJS_PUBLIC_KEY || process.env.SMTP_USER || process.env.RESEND_API_KEY)) {
                writeLog(`[crearNotificaciones] Disparando envío de correo a: ${recipientEmail}`);
                
                // Diseño de tabla compatible con Outlook Classic
                const emailHtml = `
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#f3f4f6" style="background-color: #f3f4f6; width: 100%;">
                        <tr>
                            <td align="center" style="padding: 40px 10px;">
                                <table cellpadding="0" cellspacing="0" border="0" width="600" bgcolor="#ffffff" style="background-color: #ffffff; width: 600px; border: 1px solid #e5e7eb;">
                                    <tr>
                                        <td bgcolor="#1e3a8a" align="center" style="background-color: #1e3a8a; padding: 32px 24px; text-align: center;">
                                            <h2 style="color: #ffffff; margin: 0 0 8px 0; font-family: 'Segoe UI', Arial, sans-serif; font-size: 20px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
                                                ${nombreAgencia}
                                            </h2>
                                            <h1 style="color: #ffffff; margin: 0; font-family: 'Segoe UI', Arial, sans-serif; font-size: 24px; font-weight: bold;">
                                                Helpdesk Portal
                                            </h1>
                                            <p style="color: #bfdbfe; margin: 4px 0 0 0; font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px;">
                                                Notificación de Soporte Técnico
                                            </p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 32px 24px;">
                                            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                <tr>
                                                    <td style="padding-bottom: 16px;">
                                                        <span style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; font-weight: bold; color: #1d4ed8; background-color: #eff6ff; padding: 6px 12px; border-radius: 20px; text-transform: uppercase;">
                                                            ${titulo}
                                                        </span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding-bottom: 12px;">
                                                        <h2 style="color: #1f2937; margin: 0; font-family: 'Segoe UI', Arial, sans-serif; font-size: 18px; font-weight: bold;">
                                                            Detalles de la Alerta
                                                        </h2>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td bgcolor="#f9fafb" style="background-color: #f9fafb; border-left: 4px solid #3b82f6; padding: 20px; border-top: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;">
                                                        <p style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #4b5563; margin: 0; white-space: pre-line;">
                                                            ${mensaje}
                                                        </p>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td align="center" style="padding-top: 28px; padding-bottom: 8px;">
                                                        <table cellpadding="0" cellspacing="0" border="0">
                                                            <tr>
                                                                <td bgcolor="#2563eb" align="center" style="background-color: #2563eb; border-radius: 6px;">
                                                                    <a href="${linkPortal}" target="_blank" style="display: block; font-family: 'Segoe UI', Arial, sans-serif; font-size: 15px; font-weight: bold; color: #ffffff; text-decoration: none; padding: 14px 32px; border: 1px solid #2563eb; border-radius: 6px;">
                                                                        Atender Solicitud
                                                                    </a>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td bgcolor="#f9fafb" align="center" style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                                            <p style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #9ca3af; margin: 0 0 4px 0; line-height: 1.5;">
                                                Este correo es de carácter informativo y automático. Por favor no respondas directamente a este mensaje.
                                            </p>
                                            <p style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 10px; color: #d1d5db; margin: 0;">
                                                &copy; 2026 Helpdesk Portal. Todos los derechos reservados.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                `;
                
                // Enviar asíncronamente sin bloquear la respuesta HTTP, incluyendo nombreAgencia y linkPortal
                sendNotificationEmail(recipientEmail, `Helpdesk: ${titulo}`, emailHtml, titulo, mensaje, nombreAgencia, linkPortal).catch(err => {
                    writeLog(`[crearNotificaciones] ❌ Error asíncrono al enviar email: ${err.message}`);
                });
            } else {
                writeLog(`[crearNotificaciones] Envío de correo omitido (No hay variables de configuración de email en .env)`);
            }
        }
    } catch (error: any) {
        writeLog(`[crearNotificaciones] ❌ Error al crear notificaciones: ${error.message}`);
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
// GET /api/tickets/stats
// ============================================
router.get('/stats', authMiddleware, async (req: any, res: any) => {
    try {
        const currentUser = req.user;
        if (currentUser.rol !== 'superadmin' && currentUser.rol !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para ver estadísticas'
            });
        }

        const { agencia_id, fecha_inicio, fecha_fin } = req.query;

        let query = `
            SELECT 
                t.id,
                t.agencia_id,
                ag.nombre as agencia_nombre,
                t.usuario_id,
                t.asunto,
                t.tipo,
                t.estado,
                t.prioridad,
                t.area,
                t.fecha_creacion,
                t.fecha_resolucion,
                t.fecha_cierre,
                t.agente_id,
                a.nombre as agente_nombre,
                a.apellido as agente_apellido,
                (
                    SELECT MIN(m.fecha_creacion)
                    FROM tbl_mensajes m
                    INNER JOIN tbl_usuarios u ON m.usuario_id = u.id
                    WHERE m.ticket_id = t.id AND u.rol IN ('admin', 'superadmin', 'agente')
                ) as fecha_primera_respuesta
            FROM tbl_tickets t
            LEFT JOIN tbl_usuarios a ON t.agente_id = a.id
            LEFT JOIN tbl_agencias ag ON t.agencia_id = ag.id
            WHERE 1=1
        `;

        const pool = await getConnection();
        const request = pool.request();

        // Restringir si es admin normal
        if (currentUser.rol === 'admin') {
            query += ` AND t.agencia_id = @user_agencia_id `;
            request.input('user_agencia_id', currentUser.agenciaId);
        } else if (currentUser.rol === 'superadmin' && agencia_id && agencia_id !== 'all') {
            query += ` AND t.agencia_id = @agencia_id `;
            request.input('agencia_id', parseInt(agencia_id));
        }

        if (fecha_inicio) {
            query += ` AND t.fecha_creacion >= @fecha_inicio `;
            request.input('fecha_inicio', fecha_inicio);
        }

        if (fecha_fin) {
            query += ` AND t.fecha_creacion <= @fecha_fin `;
            request.input('fecha_fin', fecha_fin);
        }

        query += ` ORDER BY t.fecha_creacion DESC`;

        const result = await request.query(query);
        res.json({
            success: true,
            data: result.recordset
        });

    } catch (error: any) {
        console.error('❌ Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
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
                    a.apellido as agente_apellido,
                    (SELECT TOP 1 ur.rol 
                     FROM tbl_mensajes m 
                     INNER JOIN tbl_usuarios ur ON ur.id = m.usuario_id 
                     WHERE m.ticket_id = t.id 
                     ORDER BY m.fecha_creacion DESC) as ultimo_mensaje_rol
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
                    u.apellido as agente_apellido,
                    (SELECT TOP 1 ur.rol 
                     FROM tbl_mensajes m 
                     INNER JOIN tbl_usuarios ur ON ur.id = m.usuario_id 
                     WHERE m.ticket_id = t.id 
                     ORDER BY m.fecha_creacion DESC) as ultimo_mensaje_rol
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

        writeLog(`[POST /tickets] Iniciando creación de ticket - asunto: "${asunto}", usuario_id: ${usuario_id}, agencia_id: ${agencia_id}`);
        console.log('📝 POST /tickets - Crear ticket');
        console.log('📝 Datos:', req.body);

        if (!asunto || !descripcion || !usuario_id || !agencia_id) {
            writeLog(`[POST /tickets] ❌ Error: Faltan campos requeridos`);
            return res.status(400).json({
                success: false,
                error: 'Faltan campos requeridos'
            });
        }

        const pool = await getConnection();

        // 🔥 Validar que el usuario tenga un área asignada activa en la base de datos
        const userCheck = await pool.request()
            .input('usuario_id', parseInt(usuario_id))
            .query('SELECT area, activo FROM tbl_usuarios WHERE id = @usuario_id');

        if (userCheck.recordset.length === 0) {
            writeLog(`[POST /tickets] ❌ Error: Usuario ${usuario_id} no encontrado`);
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        const dbUser = userCheck.recordset[0];
        if (!dbUser.area || dbUser.area.trim() === '' || dbUser.area.toLowerCase() === 'sin area' || dbUser.area.toLowerCase() === 'sin área') {
            writeLog(`[POST /tickets] ❌ Error: Usuario ${usuario_id} sin área asignada intentó crear ticket`);
            return res.status(400).json({
                success: false,
                error: 'No puedes crear tickets de soporte porque no tienes un área asignada en tu perfil. Contacta a tu administrador para que la asigne.'
            });
        }

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
        writeLog(`[POST /tickets] Ticket insertado exitosamente en tbl_tickets - ID: ${ticketId}, Secuencial: #${numeroSecuencial}`);

        // Obtener nombre del usuario creador para la notificación
        const userRes = await pool.request()
            .input('usuario_id_notif', parseInt(usuario_id))
            .query('SELECT nombre, apellido FROM tbl_usuarios WHERE id = @usuario_id_notif');
        
        const creadorNombre = userRes.recordset.length > 0
            ? `${userRes.recordset[0].nombre} ${userRes.recordset[0].apellido || ''}`.trim()
            : 'Usuario';

        writeLog(`[POST /tickets] Llamando a crearNotificaciones para ticketId: ${ticketId}, agencia_id: ${agencia_id}, creador: ${creadorNombre}`);
        // Crear notificación para admins de la agencia
        await crearNotificaciones(
            ticketId,
            parseInt(agencia_id),
            `Nuevo ticket #${numeroSecuencial} creado por ${creadorNombre}: ${asunto}`,
            null,
            parseInt(usuario_id)
        );

        // Si el ticket es creado por un administrador/agente en nombre del cliente, notificar al cliente en tiempo real
        if (req.user && req.user.id !== parseInt(usuario_id)) {
            const adminNombre = req.user.nombre ? `${req.user.nombre} ${req.user.apellido || ''}`.trim() : 'Soporte';
            const tituloNotif = 'Nuevo Ticket';
            const mensajeNotif = `Soporte ha creado el ticket #${numeroSecuencial} a tu nombre: ${asunto}`;
            
            writeLog(`[POST /tickets] Creando notificación para el cliente ID: ${usuario_id} por ticket creado en su nombre`);
            const insertResult = await pool.request()
                .input('usuario_id', parseInt(usuario_id))
                .input('ticket_id', ticketId)
                .input('titulo', tituloNotif)
                .input('mensaje', mensajeNotif)
                .query(`
                    INSERT INTO tbl_notificaciones (usuario_id, ticket_id, titulo, mensaje)
                    VALUES (@usuario_id, @ticket_id, @titulo, @mensaje);
                    
                    SELECT id, ticket_id, mensaje, leido, fecha_creacion
                    FROM tbl_notificaciones
                    WHERE id = SCOPE_IDENTITY();
                `);
            
            const newNotif = insertResult.recordset[0];
            writeLog(`[POST /tickets] ✅ Inserción exitosa para cliente: ${usuario_id} - Notif ID: ${newNotif?.id}`);
            
            // Emitir evento para SSE en tiempo real
            notificationEvents.emit('new-notification', { usuario_id: parseInt(usuario_id), notification: newNotif });
        }

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

        // Obtener datos actuales del ticket (incluyendo usuario_id)
        const ticketInfo = await pool.request()
            .input('id', parseInt(id))
            .query('SELECT numero_secuencial, asunto, agente_id, agencia_id, estado, usuario_id FROM tbl_tickets WHERE id = @id');
        
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
        const creatorId = ticketInfo.recordset[0]?.usuario_id;

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

        // Si el admin/agente cambia el estado del ticket (notificar al usuario/cliente en tiempo real)
        if (currentUser.rol !== 'usuario' && prevEstado !== estado) {
            const adminNombre = currentUser.nombre ? `${currentUser.nombre} ${currentUser.apellido || ''}`.trim() : 'Soporte';
            
            let tituloNotif = 'Ticket Actualizado';
            let mensajeNotif = `Tu ticket #${numeroSecuencial} cambió de estado a ${estado.toUpperCase()}`;
            
            if (estado === 'resuelto') {
                tituloNotif = 'Ticket Resuelto';
                mensajeNotif = `Tu ticket #${numeroSecuencial} ha sido marcado como RESUELTO por ${adminNombre}: ${asunto}`;
            } else if (estado === 'cerrado') {
                tituloNotif = 'Ticket Cerrado';
                mensajeNotif = `Tu ticket #${numeroSecuencial} ha sido CERRADO por ${adminNombre}: ${asunto}`;
            } else if (estado === 'abierto') {
                tituloNotif = 'Ticket Reabierto';
                mensajeNotif = `Tu ticket #${numeroSecuencial} ha sido reabierto por ${adminNombre}: ${asunto}`;
            }

            if (creatorId) {
                writeLog(`[PUT /tickets/:id/estado] Creando notificación para el cliente ID: ${creatorId} por cambio de estado a ${estado}`);
                const insertResult = await pool.request()
                    .input('usuario_id', creatorId)
                    .input('ticket_id', parseInt(id))
                    .input('titulo', tituloNotif)
                    .input('mensaje', mensajeNotif)
                    .query(`
                        INSERT INTO tbl_notificaciones (usuario_id, ticket_id, titulo, mensaje)
                        VALUES (@usuario_id, @ticket_id, @titulo, @mensaje);
                        
                        SELECT id, ticket_id, mensaje, leido, fecha_creacion
                        FROM tbl_notificaciones
                        WHERE id = SCOPE_IDENTITY();
                    `);
                
                const newNotif = insertResult.recordset[0];
                writeLog(`[PUT /tickets/:id/estado] ✅ Inserción exitosa para cliente: ${creatorId} - Notif ID: ${newNotif?.id}`);
                
                // Emitir evento para SSE en tiempo real
                notificationEvents.emit('new-notification', { usuario_id: creatorId, notification: newNotif });
            }
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
            writeLog(`[POST /responder] El remitente es usuario. Consultando info del ticket ID: ${id}`);
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
                writeLog(`[POST /responder] Info ticket obtenida: secuencial #${numero_secuencial}, agente_id: ${agente_id}, agencia_id: ${agencia_id}, remitente: ${remitenteNombre}. Llamando a crearNotificaciones.`);
                await crearNotificaciones(
                    parseInt(id),
                    agencia_id,
                    `Nuevo mensaje en ticket #${numero_secuencial} de ${remitenteNombre}`,
                    agente_id,
                    currentUser.id
                );
            } else {
                writeLog(`[POST /responder] ⚠️ No se encontró info del ticket o usuario en base de datos.`);
            }
        } else {
            // El remitente es un admin/agente/superadmin. Notificar al cliente (creador del ticket).
            writeLog(`[POST /responder] El remitente no es rol 'usuario' (rol actual: ${currentUser.rol}). Creando notificación para el cliente.`);
            
            const ticketInfo = await pool.request()
                .input('id', parseInt(id))
                .query(`
                    SELECT t.numero_secuencial, t.usuario_id, t.agencia_id, u.email
                    FROM tbl_tickets t
                    INNER JOIN tbl_usuarios u ON u.id = t.usuario_id
                    WHERE t.id = @id
                `);
            
            if (ticketInfo.recordset.length > 0) {
                const { numero_secuencial, usuario_id, agencia_id, email } = ticketInfo.recordset[0];
                const remitenteNombre = currentUser.nombre ? `${currentUser.nombre} ${currentUser.apellido || ''}`.trim() : 'Soporte';
                
                const titulo = 'Nuevo Mensaje';
                const mensajeNotif = `Soporte respondió a tu ticket #${numero_secuencial} (Respuesta de ${remitenteNombre})`;

                writeLog(`[POST /responder] Insertando notificación para el cliente ID: ${usuario_id}`);
                const insertResult = await pool.request()
                    .input('usuario_id', usuario_id)
                    .input('ticket_id', parseInt(id))
                    .input('titulo', titulo)
                    .input('mensaje', mensajeNotif)
                    .query(`
                        INSERT INTO tbl_notificaciones (usuario_id, ticket_id, titulo, mensaje)
                        VALUES (@usuario_id, @ticket_id, @titulo, @mensaje);
                        
                        SELECT id, ticket_id, mensaje, leido, fecha_creacion
                        FROM tbl_notificaciones
                        WHERE id = SCOPE_IDENTITY();
                    `);
                
                const newNotif = insertResult.recordset[0];
                writeLog(`[POST /responder] ✅ Inserción exitosa para cliente: ${usuario_id} - Notif ID: ${newNotif?.id}`);
                
                // Emitir evento para SSE en tiempo real
                notificationEvents.emit('new-notification', { usuario_id: usuario_id, notification: newNotif });

                // 🔥 DESACTIVADO POR REQUERIMIENTO: No enviar correo al cliente al contestar
                if (false && (process.env.EMAILJS_PUBLIC_KEY || process.env.SMTP_USER || process.env.RESEND_API_KEY)) {
                    writeLog(`[POST /responder] Enviando correo de alerta al cliente: ${email}`);
                    const emailHtml = `
                        <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#f3f4f6" style="background-color: #f3f4f6; width: 100%;">
                            <tr>
                                <td align="center" style="padding: 40px 10px;">
                                    <table cellpadding="0" cellspacing="0" border="0" width="600" bgcolor="#ffffff" style="background-color: #ffffff; width: 600px; border: 1px solid #e5e7eb;">
                                        <tr>
                                            <td bgcolor="#1e3a8a" align="center" style="background-color: #1e3a8a; padding: 32px 24px; text-align: center;">
                                                <h1 style="color: #ffffff; margin: 0; font-family: 'Segoe UI', Arial, sans-serif; font-size: 24px; font-weight: bold;">
                                                    Helpdesk Portal
                                                </h1>
                                                <p style="color: #bfdbfe; margin: 4px 0 0 0; font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px;">
                                                    Respuesta de Soporte Técnico
                                                </p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 32px 24px;">
                                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                    <tr>
                                                        <td style="padding-bottom: 16px;">
                                                            <span style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; font-weight: bold; color: #1d4ed8; background-color: #eff6ff; padding: 6px 12px; border-radius: 20px; text-transform: uppercase;">
                                                                NUEVA RESPUESTA
                                                            </span>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding-bottom: 12px;">
                                                            <h2 style="color: #1f2937; margin: 0; font-family: 'Segoe UI', Arial, sans-serif; font-size: 18px; font-weight: bold;">
                                                                Detalles de la Respuesta
                                                            </h2>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td bgcolor="#f9fafb" style="background-color: #f9fafb; border-left: 4px solid #3b82f6; padding: 20px; border-top: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;">
                                                            <p style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #4b5563; margin: 0; white-space: pre-line;">
                                                                ${mensajeNotif}
                                                            </p>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td align="center" style="padding-top: 28px; padding-bottom: 8px;">
                                                            <table cellpadding="0" cellspacing="0" border="0">
                                                                <tr>
                                                                    <td bgcolor="#2563eb" align="center" style="background-color: #2563eb; border-radius: 6px;">
                                                                        <a href="https://helpdesksmartsolutions.mooo.com:5173/" target="_blank" style="display: block; font-family: 'Segoe UI', Arial, sans-serif; font-size: 15px; font-weight: bold; color: #ffffff; text-decoration: none; padding: 14px 32px; border: 1px solid #2563eb; border-radius: 6px;">
                                                                            Ver Respuesta
                                                                        </a>
                                                                    </td>
                                                                </tr>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td bgcolor="#f9fafb" align="center" style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                                                <p style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #9ca3af; margin: 0 0 4px 0; line-height: 1.5;">
                                                    Este correo es de carácter informativo y automático. Por favor no respondas directamente a este mensaje.
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    `;
                    sendNotificationEmail(email, `Helpdesk: Nueva Respuesta`, emailHtml, titulo, mensajeNotif, 'Helpdesk', 'https://helpdesksmartsolutions.mooo.com:5173/').catch(err => {
                        writeLog(`[POST /responder] ❌ Error asíncrono al enviar email al cliente: ${err.message}`);
                    });
                }
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