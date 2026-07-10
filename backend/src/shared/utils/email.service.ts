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

// Clientes perezosos para evitar condiciones de carrera de inicialización
let resendInstance: Resend | null = null;
let smtpTransporter: any = null;

const getResendClient = () => {
    if (!resendInstance) {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) throw new Error('Missing RESEND_API_KEY in environment variables');
        resendInstance = new Resend(apiKey);
    }
    return resendInstance;
};

const getSmtpTransporter = () => {
    if (!smtpTransporter) {
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS;
        if (!user || !pass) {
            throw new Error('Missing SMTP_USER or SMTP_PASS in environment variables');
        }
        smtpTransporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user, pass }
        });
    }
    return smtpTransporter;
};

export const sendNotificationEmail = async (
    to: string, 
    subject: string, 
    htmlContent: string,
    rawTitle?: string,
    rawMessage?: string
) => {
    try {
        // Opción A: EmailJS (Prioridad 1)
        if (process.env.EMAILJS_PUBLIC_KEY) {
            writeEmailLog(`[email.service] Enviando vía EmailJS a: ${to}, asunto: "${subject}"`);
            
            const serviceId = process.env.EMAILJS_SERVICE_ID || 'default_service';
            const templateId = process.env.EMAILJS_TEMPLATE_ID;
            const publicKey = process.env.EMAILJS_PUBLIC_KEY;
            const privateKey = process.env.EMAILJS_PRIVATE_KEY; // Opcional (Access Token de EmailJS)

            if (!templateId) {
                throw new Error('Missing EMAILJS_TEMPLATE_ID in environment variables');
            }

            const payload: any = {
                service_id: serviceId,
                template_id: templateId,
                user_id: publicKey,
                template_params: {
                    to_email: to,
                    subject: subject,
                    title: rawTitle || subject,
                    message: rawMessage || htmlContent
                }
            };

            // Si se configuró la clave privada/access token de EmailJS, la adjuntamos
            if (privateKey) {
                payload.accessToken = privateKey;
            }

            const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const responseText = await response.text();
                throw new Error(`EmailJS API error: ${response.status} - ${responseText}`);
            }

            writeEmailLog(`[email.service] ✅ Email enviado exitosamente (EmailJS).`);
            return { success: true };
        }

        // Opción B: Gmail SMTP (Ideal si no se quiere configurar o usar dominio propio todavía)
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            writeEmailLog(`[email.service] Enviando vía Gmail SMTP a: ${to}, asunto: "${subject}"`);
            const transporter = getSmtpTransporter();
            const info = await transporter.sendMail({
                from: `"Helpdesk Portal" <${process.env.SMTP_USER}>`,
                to: to,
                subject: subject,
                html: htmlContent
            });
            writeEmailLog(`[email.service] ✅ Email enviado exitosamente (SMTP). Message ID: ${info.messageId}`);
            return { success: true, id: info.messageId };
        }

        // Opción C: Resend (Requiere dominio verificado para enviar a terceros)
        if (process.env.RESEND_API_KEY) {
            writeEmailLog(`[email.service] Enviando vía Resend a: ${to}, asunto: "${subject}"`);
            const senderEmail = process.env.SENDER_EMAIL || 'onboarding@resend.dev';
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

            writeEmailLog(`[email.service] ✅ Email enviado exitosamente (Resend). ID: ${data.data?.id}`);
            return { success: true, id: data.data?.id };
        }

        throw new Error('No email sending method configured (EmailJS, SMTP or Resend variables are missing)');
    } catch (error: any) {
        writeEmailLog(`[email.service] ❌ Error enviando email: ${error.message}`);
        console.error('Error enviando email:', error);
        return { success: false, error: error.message };
    }
};
