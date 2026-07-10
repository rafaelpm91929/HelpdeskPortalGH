import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import { getConnection } from '../../config/database';

const router = Router();

// Multer Storage Configuration for Manuals
const storage = multer.diskStorage({
    destination: (req: any, file: any, cb: any) => {
        const uploadDir = path.join(__dirname, '../../../uploads/manuales');
        try {
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
        } catch (err: any) {
            cb(err, '');
            return;
        }
        cb(null, uploadDir);
    },
    filename: (req: any, file: any, cb: any) => {
        const timestamp = Date.now();
        const cleanName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        cb(null, `${timestamp}_${cleanName}`);
    }
});

const fileFilter = (req: any, file: any, cb: any) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos PDF (.pdf)'));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB
    }
});

router.use(authMiddleware);

// GET /api/manuales - Listar manuales
router.get('/', async (req: any, res: any) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT id, nombre, ruta, fecha_creacion FROM tbl_manuales ORDER BY fecha_creacion DESC');
        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error: any) {
        console.error('Error al listar manuales:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/manuales/subir - Subir manual (Solo superadmin)
router.post('/subir', upload.single('manual'), async (req: any, res: any) => {
    try {
        const currentUser = req.user;
        if (!currentUser || currentUser.rol !== 'superadmin') {
            return res.status(403).json({ success: false, error: 'No tienes permiso para realizar esta acción' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'El archivo PDF es requerido' });
        }

        const nombre = req.body.nombre || req.file.originalname;
        const relativePath = `/uploads/manuales/${req.file.filename}`;

        const pool = await getConnection();
        await pool.request()
            .input('nombre', nombre)
            .input('ruta', relativePath)
            .query('INSERT INTO tbl_manuales (nombre, ruta) VALUES (@nombre, @ruta)');

        res.json({
            success: true,
            message: 'Manual subido correctamente'
        });
    } catch (error: any) {
        console.error('Error al subir manual:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/manuales/:id - Eliminar manual (Solo superadmin)
router.delete('/:id', async (req: any, res: any) => {
    try {
        const currentUser = req.user;
        if (!currentUser || currentUser.rol !== 'superadmin') {
            return res.status(403).json({ success: false, error: 'No tienes permiso para realizar esta acción' });
        }

        const { id } = req.params;
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', parseInt(id))
            .query('SELECT ruta FROM tbl_manuales WHERE id = @id');

        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, error: 'Manual no encontrado' });
        }

        const manual = result.recordset[0];
        const filePath = path.join(__dirname, '../../../', manual.ruta);

        // Eliminar del disco
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (err) {
            console.error('Error al borrar archivo físico:', err);
        }

        // Eliminar de base de datos
        await pool.request()
            .input('id', parseInt(id))
            .query('DELETE FROM tbl_manuales WHERE id = @id');

        res.json({
            success: true,
            message: 'Manual eliminado correctamente'
        });
    } catch (error: any) {
        console.error('Error al eliminar manual:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
