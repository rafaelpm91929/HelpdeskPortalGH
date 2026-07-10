import { getConnection } from './config/database';
import { crearNotificaciones } from './modules/tickets/tickets.routes';

async function run() {
    try {
        console.log('🔄 Conectando a la base de datos...');
        const pool = await getConnection();
        
        // Buscar un ticket_id válido
        const ticketRes = await pool.request().query('SELECT TOP 1 id FROM tbl_tickets');
        if (ticketRes.recordset.length === 0) {
            console.log('❌ No hay tickets en tbl_tickets para probar');
            process.exit(1);
        }
        const ticketId = ticketRes.recordset[0].id;
        console.log(`🎫 Usando Ticket ID: ${ticketId}`);
        
        console.log('🔔 Llamando a crearNotificaciones...');
        await crearNotificaciones(ticketId, 4, 'Test notification message creado at ' + new Date().toISOString(), null);
        console.log('✅ Ejecución de crearNotificaciones terminada.');
        
    } catch (e) {
        console.error('❌ Error fatal en script de prueba:', e);
    } finally {
        process.exit(0);
    }
}

run();
