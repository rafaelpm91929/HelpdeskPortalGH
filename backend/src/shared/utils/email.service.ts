import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';

// Utilidad local de log
function writeEmailLog(message: string) {
    try {
        const logPath = path.join(__dirname, '../../../debug.log');
        const timestamp = new Date().toISOString();
        fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
    } catch (e) {
        console.error('Error writing email log:', e);
    }
}

let resendInstance: Resend | null = null;
const getResendClient = () => {
    if (!resendInstance) {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            throw new Error('Missing RESEND_API_KEY in environment variables');
        }
        resendInstance = new Resend(apiKey);
    }
    return resendInstance;
};

export const sendNotificationEmail = async (to: string, subject: string, htmlContent: string) => {
    try {
        const senderEmail = process.env.SENDER_EMAIL || 'onboarding@resend.dev';
        writeEmailLog(`[email.service] Intentando enviar email a: ${to}, asunto: "${subject}"`);
        
        // Sandbox de Resend: si no hay dominio verificado, forzamos enviar al correo registrado del admin
        const targetEmail = process.env.RESEND_FORCE_TO_EMAIL || to;
        
        if (targetEmail.toLowerCase() !== to.toLowerCase()) {
            writeEmailLog(`[email.service] Redireccionando email de ${to} a ${targetEmail} por estar en modo sandbox.`);
        }

        const client = getResendClient();
        const data = await client.emails.send({
            from: `Helpdesk Portal <${senderEmail}>`,
            to: [targetEmail],
            subject: subject,
            html: htmlContent,
        });

        if (data.error) {
            throw new Error(data.error.message);
        }

        writeEmailLog(`[email.service] ✅ Email enviado exitosamente. ID: ${data.data?.id}`);
        return { success: true, id: data.data?.id };
    } catch (error: any) {
        writeEmailLog(`[email.service] ❌ Error enviando email: ${error.message}`);
        console.error('Error enviando email con Resend:', error);
        return { success: false, error: error.message };
    }
};
