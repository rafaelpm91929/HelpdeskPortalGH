import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import { getConnection } from '../../config/database';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

// ============================================
// 🔥 IP PÚBLICA DESDE VARIABLES DE ENTORNO
// ============================================
const PUBLIC_IP = process.env.PUBLIC_IP || '201.149.60.82';
const PORT = parseInt(process.env.PORT || '4000', 10);

// ============================================
// CONFIGURACIÓN DE MULTER
// ============================================
const storage = multer.diskStorage({
    destination: (req: any, file: any, cb: any) => {
        const agencia_id = req.params.agencia_id;
        
        console.log('📁 agencia_id desde params:', agencia_id);
        
        if (!agencia_id) {
            console.error('❌ agencia_id no proporcionado en params');
            cb(new Error('agencia_id es requerido'), '');
            return;
        }

        const uploadDir = path.join(__dirname, '../../../uploads/logos', String(agencia_id));
        
        console.log('📁 Carpeta de destino:', uploadDir);
        
        try {
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
                console.log('📁 Carpeta creada:', uploadDir);
            }
        } catch (err: any) {
            console.error('❌ Error al crear carpeta:', err);
            cb(err, '');
            return;
        }
        
        cb(null, uploadDir);
    },
    filename: (req: any, file: any, cb: any) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const filename = `logo${ext}`;
        console.log('📄 Nombre de archivo:', filename);
        cb(null, filename);
    }
});

const fileFilter = (req: any, file: any, cb: any) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Formato no permitido. Solo imágenes (JPG, PNG, GIF, WEBP, SVG)'));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB
    }
});

// ============================================
// POST /api/upload/logo/:agencia_id - Subir logo de agencia
// ============================================
router.post('/logo/:agencia_id', authMiddleware, upload.single('logo'), async (req: any, res: any) => {
    try {
        const { agencia_id } = req.params;
        const currentUser = req.user;

        console.log('📤 agencia_id desde params:', agencia_id);
        console.log('👤 Usuario:', currentUser);
        console.log('📄 Archivo:', req.file);

        if (!agencia_id) {
            return res.status(400).json({
                success: false,
                error: 'ID de agencia requerido'
            });
        }

        const agenciaIdNum = parseInt(agencia_id);
        if (isNaN(agenciaIdNum)) {
            return res.status(400).json({
                success: false,
                error: 'ID de agencia inválido'
            });
        }

        // Verificar permisos
        if (currentUser.rol !== 'superadmin' && currentUser.agenciaId !== agenciaIdNum) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para modificar esta agencia'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No se subió ningún archivo'
            });
        }

        // 🔥 URL del logo con IP PÚBLICA (completa)
        const ext = path.extname(req.file.filename);
        const logoUrl = `/uploads/logos/${agenciaIdNum}/logo${ext}`;
        const fullUrl = `http://${PUBLIC_IP}:${PORT}${logoUrl}`;

        console.log('✅ Logo guardado en:', fullUrl);

        const pool = await getConnection();
        await pool.request()
            .input('id', agenciaIdNum)
            .input('logo_url', fullUrl)  // 🔥 Guardar URL completa con IP pública
            .query(`
                UPDATE tbl_agencias 
                SET logo_url = @logo_url
                WHERE id = @id
            `);

        res.json({
            success: true,
            url: fullUrl,
            logo_url: fullUrl,
            message: '✅ Logo subido correctamente'
        });
    } catch (error: any) {
        console.error('❌ Error al subir logo:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;