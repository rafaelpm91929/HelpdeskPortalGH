import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/axios.config';
import toast from 'react-hot-toast';
import ExcelJS from 'exceljs';
import { IMAGE_BASE_URL } from '../config';

// ============================================
// TIPOS
// ============================================
interface IUsuario {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    puesto: string;
    area: string;
    rol: string;
    activo: boolean;
    fecha_creacion: string;
    avatar_url: string | null;
}

interface IArea {
    id: number;
    nombre: string;
}

interface IAgenciaData {
    id: number;
    nombre: string;
    subdominio: string;
    colores_primario?: string;
    colores_secundario?: string;
    logo_url?: string | null;
}

interface IExcelUserRow {
    fila: number;
    nombre: string;
    apellido: string;
    email: string;
    password: string;
    telefono: string;
    puesto: string;
    area: string;
    valido: boolean;
    errorMsg?: string;
}

interface UsuariosProps {
    agenciaId: number;
    colores?: any;
    isDarkMode?: boolean;
    agenciaInfo?: IAgenciaData | null;
}

// ============================================
// HELPERS DE COLOR Y LOGO PARA EXCEL
// ============================================
const cleanHex = (hex?: string, fallback = '2563EB'): string => {
    if (!hex) return fallback;
    const cleaned = hex.replace('#', '').trim().toUpperCase();
    if (/^[0-9A-F]{6}$/.test(cleaned)) return cleaned;
    if (/^[0-9A-F]{3}$/.test(cleaned)) {
        return cleaned.split('').map(ch => ch + ch).join('');
    }
    return fallback;
};

const toArgb = (hex?: string, fallback = '2563EB'): string => {
    return `FF${cleanHex(hex, fallback)}`;
};

// Mezcla un color hex con blanco para obtener un tono suave (tint) para filas alternas y fondos
const tintHex = (hex?: string, whiteRatio = 0.92): string => {
    const base = cleanHex(hex, '2563EB');
    const r = parseInt(base.substring(0, 2), 16);
    const g = parseInt(base.substring(2, 4), 16);
    const b = parseInt(base.substring(4, 6), 16);

    const nr = Math.min(255, Math.round(r + (255 - r) * whiteRatio));
    const ng = Math.min(255, Math.round(g + (255 - g) * whiteRatio));
    const nb = Math.min(255, Math.round(b + (255 - b) * whiteRatio));

    const toHex2 = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
    return `FF${toHex2(nr)}${toHex2(ng)}${toHex2(nb)}`;
};

// Extrae texto plano de cualquier celda de ExcelJS (incluyendo hipervínculos mailto:, fórmulas o richText)
const extractCellText = (cellValue: any): string => {
    if (cellValue === null || cellValue === undefined) return '';
    if (typeof cellValue === 'string' || typeof cellValue === 'number' || typeof cellValue === 'boolean') {
        return String(cellValue).trim();
    }
    if (typeof cellValue === 'object') {
        if (cellValue.text) return String(cellValue.text).trim();
        if (cellValue.result !== undefined) return String(cellValue.result).trim();
        if (Array.isArray(cellValue.richText)) {
            return cellValue.richText.map((rt: any) => rt.text || '').join('').trim();
        }
        if (cellValue.hyperlink) {
            return String(cellValue.hyperlink).replace(/^mailto:/i, '').trim();
        }
    }
    return String(cellValue).trim();
};

// Renderiza el logo de la agencia en una tarjeta blanca de alta resolución manteniendo su proporción exacta
const renderAgencyLogoCardBase64 = async (
    logoUrl: string | null | undefined,
    agenciaNombre: string,
    primaryHex: string
): Promise<string | null> => {
    const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = (err) => reject(err);
            img.src = src;
        });
    };

    const canvas = document.createElement('canvas');
    const width = 360;
    const height = 140;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Dibujar tarjeta blanca con bordes redondeados y sombra sutil
    const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    };

    ctx.fillStyle = '#FFFFFF';
    drawRoundedRect(4, 4, width - 8, height - 8, 18);
    ctx.fill();

    ctx.lineWidth = 3;
    ctx.strokeStyle = `#${cleanHex(primaryHex, '2563EB')}`;
    ctx.stroke();

    // Intentar cargar el logo de la agencia
    const candidateUrls: string[] = [];
    if (logoUrl) {
        if (logoUrl.startsWith('http')) {
            try {
                const parsed = new URL(logoUrl);
                candidateUrls.push(`${IMAGE_BASE_URL}${parsed.pathname}`);
            } catch {
                // ignore
            }
            candidateUrls.push(logoUrl);
        } else {
            candidateUrls.push(`${IMAGE_BASE_URL}${logoUrl}`);
            candidateUrls.push(logoUrl);
        }
    }
    candidateUrls.push('/logo_gh.jpg');

    for (const url of candidateUrls) {
        try {
            const img = await loadImage(url);
            const padX = 24;
            const padY = 18;
            const maxW = width - padX * 2;
            const maxH = height - padY * 2;
            const scale = Math.min(maxW / (img.naturalWidth || img.width || 1), maxH / (img.naturalHeight || img.height || 1));
            const drawW = (img.naturalWidth || img.width) * scale;
            const drawH = (img.naturalHeight || img.height) * scale;
            const drawX = (width - drawW) / 2;
            const drawY = (height - drawH) / 2;

            ctx.drawImage(img, drawX, drawY, drawW, drawH);
            return canvas.toDataURL('image/png');
        } catch {
            // Intentar siguiente candidato
        }
    }

    // Fallback elegante con el nombre de la agencia si no se pudo cargar imagen
    ctx.fillStyle = `#${cleanHex(primaryHex, '2563EB')}`;
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(agenciaNombre.substring(0, 16).toUpperCase(), width / 2, height / 2);
    return canvas.toDataURL('image/png');
};

// Descargar un buffer de Excel en el navegador
const downloadWorkbookBuffer = async (workbook: ExcelJS.Workbook, filename: string) => {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const Usuarios: React.FC<UsuariosProps> = ({ agenciaId, colores, isDarkMode, agenciaInfo }) => {
    const defaultColores = {
        primario: '#2563eb',
        secundario: '#3b82f6',
        fondo: isDarkMode ? '#0f172a' : '#f3f4f6',
        texto: isDarkMode ? '#f8fafc' : '#1f2937',
        tarjeta: isDarkMode ? '#1e293b' : '#ffffff',
        borde: isDarkMode ? '#334155' : '#e5e7eb',
        inputBg: isDarkMode ? '#1e293b' : '#ffffff',
        inputText: isDarkMode ? '#ffffff' : '#1f2937',
        textoMuted: isDarkMode ? '#94a3b8' : '#6b7280',
        hoverBg: isDarkMode ? '#334155' : '#f9fafb'
    };
    const c = colores || defaultColores;

    const [usuarios, setUsuarios] = useState<IUsuario[]>([]);
    const [areas, setAreas] = useState<IArea[]>([]);
    const [agenciaData, setAgenciaData] = useState<IAgenciaData | null>(agenciaInfo || null);
    const [loading, setLoading] = useState(false);
    const [exportingExcel, setExportingExcel] = useState(false);
    const [downloadingTemplate, setDownloadingTemplate] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<IUsuario | null>(null);
    const [viewingUser, setViewingUser] = useState<IUsuario | null>(null);
    const [filtro, setFiltro] = useState<'todos' | 'activos' | 'inactivos'>('todos');

    // Estados para Importación Masiva con Excel
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importedFileName, setImportedFileName] = useState('');
    const [excelRows, setExcelRows] = useState<IExcelUserRow[]>([]);
    const [importingUsers, setImportingUsers] = useState(false);
    const [importResult, setImportResult] = useState<{
        creadosCount: number;
        erroresCount: number;
        errores: { fila?: number; email?: string; nombre?: string; error: string }[];
    } | null>(null);

    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        email: '',
        password: '',
        telefono: '',
        puesto: '',
        area: '',
        rol: 'usuario'
    });

    // ============================================
    // CARGAR DATOS DE LA AGENCIA (LOGO, NOMBRE, COLORES)
    // ============================================
    const loadAgencia = async () => {
        if (!agenciaId) return;
        try {
            const response = await api.get(`/agencias/${agenciaId}`);
            if (response.data.success && response.data.data) {
                const data = response.data.data;
                if (data.logo_url) {
                    if (data.logo_url.startsWith('http')) {
                        try {
                            const parsed = new URL(data.logo_url);
                            data.logo_url = `${IMAGE_BASE_URL}${parsed.pathname}`;
                        } catch {
                            // mantener original
                        }
                    } else {
                        data.logo_url = `${IMAGE_BASE_URL}${data.logo_url}`;
                    }
                }
                setAgenciaData(data);
            }
        } catch (error) {
            console.error('Error al cargar datos de agencia en Usuarios:', error);
        }
    };

    // ============================================
    // CARGAR USUARIOS
    // ============================================
    const loadUsuarios = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/auth/users/${agenciaId}`);
            if (response.data.success) {
                setUsuarios(response.data.data);
            }
        } catch (error) {
            toast.error('Error al cargar usuarios');
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // CARGAR ÁREAS
    // ============================================
    const loadAreas = async () => {
        try {
            const response = await api.get(`/areas/${agenciaId}`);
            if (response.data.success) {
                setAreas(response.data.data);
            }
        } catch (error) {
            console.error('Error al cargar áreas:', error);
        }
    };

    useEffect(() => {
        if (agenciaInfo) {
            setAgenciaData(agenciaInfo);
        }
    }, [agenciaInfo]);

    useEffect(() => {
        if (agenciaId) {
            loadAgencia();
            loadUsuarios();
            loadAreas();
        }
    }, [agenciaId]);

    // ============================================
    // FILTRAR USUARIOS
    // ============================================
    const usuariosFiltrados = usuarios.filter(user => {
        const search = searchTerm.toLowerCase();
        const matchSearch = 
            user.nombre.toLowerCase().includes(search) ||
            user.apellido.toLowerCase().includes(search) ||
            user.email.toLowerCase().includes(search) ||
            (user.puesto && user.puesto.toLowerCase().includes(search)) ||
            (user.area && user.area.toLowerCase().includes(search));

        const matchEstado = 
            filtro === 'todos' ||
            (filtro === 'activos' && user.activo) ||
            (filtro === 'inactivos' && !user.activo);

        return matchSearch && matchEstado;
    });

    // ============================================
    // 1. DESCARGAR PLANTILLA EXCEL PARA REGISTRAR USUARIOS
    // ============================================
    const handleDownloadTemplate = async () => {
        try {
            setDownloadingTemplate(true);
            const agenciaNombre = agenciaData?.nombre || `Agencia_${agenciaId}`;
            const subdominio = agenciaData?.subdominio || '';
            const primaryColor = agenciaData?.colores_primario || c.primario || '#2563eb';
            const secondaryColor = agenciaData?.colores_secundario || c.secundario || '#1e40af';

            const primaryArgb = toArgb(primaryColor, '2563EB');
            const secondaryArgb = toArgb(secondaryColor, '1E40AF');
            const softTintArgb = tintHex(primaryColor, 0.92);
            const zebraTintArgb = tintHex(primaryColor, 0.96);

            const workbook = new ExcelJS.Workbook();
            workbook.creator = `${agenciaNombre} - Helpdesk Portal`;
            workbook.created = new Date();

            const ws = workbook.addWorksheet('Registro de Usuarios', {
                views: [{ state: 'frozen', ySplit: 6, showGridLines: true }]
            });

            // Configurar anchos de columnas
            ws.columns = [
                { key: 'nombre', width: 24 },
                { key: 'apellido', width: 24 },
                { key: 'email', width: 34 },
                { key: 'password', width: 22 },
                { key: 'telefono', width: 18 },
                { key: 'puesto', width: 26 },
                { key: 'area', width: 26 }
            ];

            // ============================================
            // BANNER CORPORATIVO DE LA AGENCIA (FILAS 1 A 4)
            // ============================================
            ws.mergeCells('A1:B4');
            ws.mergeCells('C1:G2');
            ws.mergeCells('C3:G3');
            ws.mergeCells('C4:G4');

            ws.getRow(1).height = 22;
            ws.getRow(2).height = 22;
            ws.getRow(3).height = 20;
            ws.getRow(4).height = 20;

            for (let r = 1; r <= 4; r++) {
                for (let col = 1; col <= 7; col++) {
                    const cell = ws.getCell(r, col);
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: primaryArgb }
                    };
                }
            }

            // Título del documento
            const titleCell = ws.getCell('C1');
            titleCell.value = `PLANTILLA DE REGISTRO DE USUARIOS — ${agenciaNombre.toUpperCase()}`;
            titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
            titleCell.alignment = { vertical: 'bottom', horizontal: 'left', indent: 1 };

            // Subtítulo de la agencia
            const subtitleCell = ws.getCell('C3');
            subtitleCell.value = `🏢 Agencia: ${agenciaNombre}${subdominio ? ` (${subdominio})` : ''}   |   📅 Fecha de descarga: ${new Date().toLocaleDateString('es-MX')}`;
            subtitleCell.font = { name: 'Calibri', size: 11, italic: true, color: { argb: 'FFF1F5F9' } };
            subtitleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

            // Áreas disponibles
            const areasListText = areas.length > 0
                ? areas.map(a => a.nombre).join(', ')
                : 'Escribe el nombre del área correspondiente (se creará automáticamente si no existe)';
            const areasInfoCell = ws.getCell('C4');
            areasInfoCell.value = `📋 Áreas de la agencia: ${areasListText}`;
            areasInfoCell.font = { name: 'Calibri', size: 10, color: { argb: 'FFE2E8F0' } };
            areasInfoCell.alignment = { vertical: 'top', horizontal: 'left', indent: 1 };

            // Incrustar el logo de la agencia
            const logoBase64 = await renderAgencyLogoCardBase64(agenciaData?.logo_url, agenciaNombre, primaryColor);
            if (logoBase64) {
                const imageId = workbook.addImage({
                    base64: logoBase64,
                    extension: 'png'
                });
                ws.addImage(imageId, {
                    tl: { col: 0.15, row: 0.2 },
                    ext: { width: 195, height: 76 }
                });
            }

            // ============================================
            // FILA 5: CINTA DE INSTRUCCIONES
            // ============================================
            ws.mergeCells('A5:G5');
            ws.getRow(5).height = 26;
            const instrCell = ws.getCell('A5');
            instrCell.value = '💡 INSTRUCCIONES: Llena los datos de los usuarios a partir de la fila 7. Los campos con (*) son obligatorios. La contraseña debe tener mínimo 6 caracteres.';
            instrCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E293B' } };
            instrCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: softTintArgb }
            };
            instrCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
            instrCell.border = {
                top: { style: 'thin', color: { argb: secondaryArgb } },
                bottom: { style: 'medium', color: { argb: primaryArgb } }
            };

            // ============================================
            // FILA 6: ENCABEZADOS DE LA TABLA
            // ============================================
            const headers = [
                'Nombre *',
                'Apellido *',
                'Email *',
                'Contraseña *',
                'Teléfono',
                'Puesto',
                'Área'
            ];

            const headerRow = ws.getRow(6);
            headerRow.height = 28;
            headers.forEach((h, idx) => {
                const cell = headerRow.getCell(idx + 1);
                cell.value = h;
                cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: secondaryArgb }
                };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
                    bottom: { style: 'medium', color: { argb: primaryArgb } },
                    left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
                    right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
                };
            });

            // Si la agencia tiene áreas configuradas, crear hoja oculta de catálogo para validación desplegable
            let areaValidationFormula: string | null = null;
            if (areas.length > 0) {
                const catalogSheet = workbook.addWorksheet('Catalogo_Areas', { state: 'veryHidden' });
                areas.forEach((areaObj, index) => {
                    catalogSheet.getCell(`A${index + 1}`).value = areaObj.nombre;
                });
                areaValidationFormula = `Catalogo_Areas!$A$1:$A$${areas.length}`;
            }

            // ============================================
            // FILAS 7 A 106: 100 FILAS PRE-FORMATEADAS PARA LLENAR
            // ============================================
            for (let r = 7; r <= 106; r++) {
                const row = ws.getRow(r);
                row.height = 22;
                const isEven = r % 2 === 0;
                const rowBg = isEven ? zebraTintArgb : 'FFFFFFFF';

                for (let cIdx = 1; cIdx <= 7; cIdx++) {
                    const cell = row.getCell(cIdx);
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: rowBg }
                    };
                    cell.font = { name: 'Calibri', size: 11, color: { argb: 'FF1F2937' } };
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
                    };
                    cell.alignment = {
                        vertical: 'middle',
                        horizontal: cIdx === 5 ? 'center' : 'left'
                    };

                    // Formato texto para evitar que Excel altere contraseñas o teléfonos con ceros al inicio
                    if (cIdx === 3 || cIdx === 4 || cIdx === 5) {
                        cell.numFmt = '@';
                    }

                    // Lista desplegable de áreas de la agencia en la columna G (7)
                    if (cIdx === 7 && areaValidationFormula) {
                        cell.dataValidation = {
                            type: 'list',
                            allowBlank: true,
                            formulae: [areaValidationFormula],
                            showErrorMessage: false
                        };
                    }
                }
            }

            // ============================================
            // HOJA 2: GUÍA RÁPIDA Y EJEMPLO DE LLENADO
            // ============================================
            const guideSheet = workbook.addWorksheet('Guía y Ejemplo');
            guideSheet.columns = [
                { width: 22 },
                { width: 22 },
                { width: 32 },
                { width: 20 },
                { width: 18 },
                { width: 24 },
                { width: 24 }
            ];

            guideSheet.mergeCells('A1:G2');
            const gTitle = guideSheet.getCell('A1');
            gTitle.value = `EJEMPLO DE LLENADO — ${agenciaNombre.toUpperCase()}`;
            gTitle.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
            gTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryArgb } };
            gTitle.alignment = { vertical: 'middle', horizontal: 'center' };

            const exHeaders = ['Nombre *', 'Apellido *', 'Email *', 'Contraseña *', 'Teléfono', 'Puesto', 'Área'];
            const exHeaderRow = guideSheet.getRow(4);
            exHeaderRow.height = 25;
            exHeaders.forEach((h, i) => {
                const cell = exHeaderRow.getCell(i + 1);
                cell.value = h;
                cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: secondaryArgb } };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });

            const sampleArea1 = areas[0]?.nombre || 'Ventas';
            const sampleArea2 = areas[1]?.nombre || areas[0]?.nombre || 'Administración';
            const sampleRows = [
                ['Carlos', 'Ramírez López', 'carlos.ramirez@empresa.com', 'Acceso2025*', '2221234567', 'Asesor Comercial', sampleArea1],
                ['María', 'Hernández Vega', 'maria.hernandez@empresa.com', 'Soporte123#', '2229876543', 'Analista Administrativa', sampleArea2]
            ];
            sampleRows.forEach((sRow, idx) => {
                const r = guideSheet.getRow(5 + idx);
                r.height = 22;
                sRow.forEach((val, cI) => {
                    const cell = r.getCell(cI + 1);
                    cell.value = val;
                    cell.font = { name: 'Calibri', size: 11, color: { argb: 'FF334155' } };
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: softTintArgb } };
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
                    };
                });
            });

            const cleanAgencyFile = agenciaNombre.replace(/[^a-zA-Z0-9_-]/g, '_');
            await downloadWorkbookBuffer(workbook, `Plantilla_Usuarios_${cleanAgencyFile}.xlsx`);
            toast.success(`📥 Plantilla de ${agenciaNombre} descargada`);
        } catch (error) {
            console.error('Error al generar plantilla Excel:', error);
            toast.error('Error al generar la plantilla de Excel');
        } finally {
            setDownloadingTemplate(false);
        }
    };

    // ============================================
    // 2. LEER Y VALIDAR ARCHIVO EXCEL SUBIDO
    // ============================================
    const validateParsedRows = (rows: Omit<IExcelUserRow, 'valido' | 'errorMsg'>[]): IExcelUserRow[] => {
        const existingEmails = new Set(usuarios.map(u => (u.email || '').toLowerCase().trim()));
        const seenInFile = new Set<string>();

        return rows.map((r) => {
            const nombre = r.nombre.trim();
            const apellido = r.apellido.trim();
            const email = r.email.trim().toLowerCase();
            const password = r.password.trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            let errorMsg = '';
            if (!nombre || !apellido || !email || !password) {
                const faltantes: string[] = [];
                if (!nombre) faltantes.push('Nombre');
                if (!apellido) faltantes.push('Apellido');
                if (!email) faltantes.push('Email');
                if (!password) faltantes.push('Contraseña');
                errorMsg = `Falta: ${faltantes.join(', ')}`;
            } else if (!emailRegex.test(email)) {
                errorMsg = 'Formato de correo inválido';
            } else if (password.length < 6) {
                errorMsg = 'Contraseña menor a 6 caracteres';
            } else if (existingEmails.has(email)) {
                errorMsg = 'Ya registrado en esta agencia';
            } else if (seenInFile.has(email)) {
                errorMsg = 'Correo duplicado en el Excel';
            }

            if (email) seenInFile.add(email);

            return {
                ...r,
                nombre,
                apellido,
                email,
                password,
                valido: !errorMsg,
                errorMsg: errorMsg || undefined
            };
        });
    };

    const handleExcelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setImportedFileName(file.name);
            setImportResult(null);

            const arrayBuffer = await file.arrayBuffer();
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(arrayBuffer);

            const worksheet = workbook.getWorksheet('Registro de Usuarios') || workbook.worksheets[0];
            if (!worksheet) {
                toast.error('El archivo Excel no contiene hojas válidas');
                return;
            }

            // Detectar en qué fila están los encabezados (sea fila 6 de nuestra plantilla o fila 1 de un Excel propio)
            let headerRowNumber = 0;
            const colMap: Record<string, number> = {
                nombre: 1,
                apellido: 2,
                email: 3,
                password: 4,
                telefono: 5,
                puesto: 6,
                area: 7
            };

            worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                if (headerRowNumber > 0 || rowNumber > 15) return;

                const rowValues: string[] = [];
                row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    rowValues[colNumber] = extractCellText(cell.value)
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '');
                });

                const hasNombre = rowValues.some(v => v && v.includes('nombre'));
                const hasEmail = rowValues.some(v => v && (v.includes('email') || v.includes('correo')));

                if (hasNombre && hasEmail) {
                    headerRowNumber = rowNumber;
                    rowValues.forEach((val, colIdx) => {
                        if (!val) return;
                        if (val.includes('nombre') && !val.includes('apellido')) colMap.nombre = colIdx;
                        else if (val.includes('apellido')) colMap.apellido = colIdx;
                        else if (val.includes('email') || val.includes('correo')) colMap.email = colIdx;
                        else if (val.includes('contrasena') || val.includes('password') || val.includes('clave')) colMap.password = colIdx;
                        else if (val.includes('telefono') || val.includes('celular') || val.includes('tel')) colMap.telefono = colIdx;
                        else if (val.includes('puesto') || val.includes('cargo')) colMap.puesto = colIdx;
                        else if (val.includes('area') || val.includes('departamento') || val.includes('depto')) colMap.area = colIdx;
                    });
                }
            });

            if (headerRowNumber === 0) {
                // Si no se encontró fila de encabezado explícita, asumir fila 6 si viene de plantilla o fila 1
                headerRowNumber = 1;
            }

            const rawParsed: Omit<IExcelUserRow, 'valido' | 'errorMsg'>[] = [];

            worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                if (rowNumber <= headerRowNumber) return;

                const nombre = extractCellText(row.getCell(colMap.nombre).value);
                const apellido = extractCellText(row.getCell(colMap.apellido).value);
                const email = extractCellText(row.getCell(colMap.email).value);
                const password = extractCellText(row.getCell(colMap.password).value);
                const telefono = extractCellText(row.getCell(colMap.telefono).value);
                const puesto = extractCellText(row.getCell(colMap.puesto).value);
                const area = extractCellText(row.getCell(colMap.area).value);

                // Ignorar filas completamente vacías o filas de instrucciones
                if (!nombre && !apellido && !email && !password && !telefono && !puesto && !area) {
                    return;
                }
                if (nombre.startsWith('💡') || nombre.toUpperCase().includes('INSTRUCCIONES')) {
                    return;
                }

                rawParsed.push({
                    fila: rowNumber,
                    nombre,
                    apellido,
                    email,
                    password,
                    telefono,
                    puesto,
                    area
                });
            });

            if (rawParsed.length === 0) {
                toast.error('No se encontraron usuarios llenados en el archivo Excel');
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }

            const validated = validateParsedRows(rawParsed);
            setExcelRows(validated);
            setShowImportModal(true);
        } catch (error) {
            console.error('Error al leer archivo Excel:', error);
            toast.error('No se pudo leer el archivo Excel. Asegúrate de subir un archivo .xlsx válido.');
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Permitir corregir un dato directamente en la vista previa antes de importar
    const handleUpdateExcelRow = (index: number, field: keyof IExcelUserRow, value: string) => {
        const updated = excelRows.map((row, i) => (i === index ? { ...row, [field]: value } : row));
        setExcelRows(validateParsedRows(updated));
    };

    const handleRemoveExcelRow = (index: number) => {
        const filtered = excelRows.filter((_, i) => i !== index);
        setExcelRows(validateParsedRows(filtered));
    };

    // Confirmar y registrar los usuarios del Excel en la agencia actual
    const handleConfirmBulkImport = async () => {
        const validRows = excelRows.filter(r => r.valido);
        if (validRows.length === 0) {
            toast.error('No hay usuarios válidos para registrar');
            return;
        }

        try {
            setImportingUsers(true);
            try {
                // Intentar endpoint masivo optimizado
                const response = await api.post('/auth/users/bulk', {
                    agencia_id: agenciaId,
                    usuarios: validRows
                });
                if (response.data.success) {
                    const data = response.data.data;
                    setImportResult(data);
                    toast.success(`✅ ${data.creadosCount} usuario(s) registrado(s) exitosamente`);
                    await loadUsuarios();
                    await loadAreas();
                    return;
                }
            } catch (bulkErr: any) {
                // Fallback automático a creación individual si el servidor backend aún no reinició con la ruta /bulk
                if (bulkErr.response?.status && bulkErr.response.status !== 404) {
                    throw bulkErr;
                }
            }

            // Fallback secuencial usando los endpoints existentes
            let creadosCount = 0;
            const errores: { fila?: number; email?: string; nombre?: string; error: string }[] = [];
            const knownAreas = new Set(areas.map(a => a.nombre.toLowerCase().trim()));

            for (const row of validRows) {
                try {
                    const areaName = row.area.trim();
                    if (areaName && !knownAreas.has(areaName.toLowerCase())) {
                        try {
                            await api.post('/areas', {
                                nombre: areaName,
                                descripcion: 'Área creada desde importación Excel',
                                agencia_id: agenciaId
                            });
                            knownAreas.add(areaName.toLowerCase());
                        } catch {
                            // Si ya existe, ignorar
                        }
                    }

                    await api.post('/auth/users', {
                        nombre: row.nombre,
                        apellido: row.apellido,
                        email: row.email,
                        password: row.password,
                        telefono: row.telefono,
                        puesto: row.puesto,
                        area: row.area,
                        agencia_id: agenciaId,
                        rol: 'usuario'
                    });
                    creadosCount++;
                } catch (err: any) {
                    errores.push({
                        fila: row.fila,
                        email: row.email,
                        nombre: `${row.nombre} ${row.apellido}`,
                        error: err.response?.data?.error || 'Error al crear usuario'
                    });
                }
            }

            setImportResult({
                creadosCount,
                erroresCount: errores.length,
                errores
            });

            if (creadosCount > 0) {
                toast.success(`✅ ${creadosCount} usuario(s) registrado(s) en la agencia`);
            }
            await loadUsuarios();
            await loadAreas();
        } catch (error: any) {
            console.error('Error en importación masiva:', error);
            toast.error(error.response?.data?.error || '❌ Error al importar usuarios');
        } finally {
            setImportingUsers(false);
        }
    };

    // ============================================
    // 3. EXPORTAR USUARIOS DE LA AGENCIA CON DISEÑO Y LOGO
    // ============================================
    const handleExportUsersExcel = async () => {
        if (usuariosFiltrados.length === 0) {
            toast.error('No hay usuarios para exportar');
            return;
        }

        try {
            setExportingExcel(true);
            const agenciaNombre = agenciaData?.nombre || `Agencia ${agenciaId}`;
            const subdominio = agenciaData?.subdominio || '';
            const primaryColor = agenciaData?.colores_primario || c.primario || '#2563eb';
            const secondaryColor = agenciaData?.colores_secundario || c.secundario || '#1e40af';

            const primaryArgb = toArgb(primaryColor, '2563EB');
            const secondaryArgb = toArgb(secondaryColor, '1E40AF');
            const softTintArgb = tintHex(primaryColor, 0.90);
            const zebraTintArgb = tintHex(primaryColor, 0.95);

            const workbook = new ExcelJS.Workbook();
            workbook.creator = `${agenciaNombre} - Helpdesk Portal`;
            workbook.created = new Date();

            const ws = workbook.addWorksheet('Usuarios de la Agencia', {
                views: [{ state: 'frozen', ySplit: 7, showGridLines: true }],
                pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true }
            });

            ws.columns = [
                { key: 'num', width: 8 },
                { key: 'nombre', width: 22 },
                { key: 'apellido', width: 22 },
                { key: 'email', width: 34 },
                { key: 'telefono', width: 18 },
                { key: 'puesto', width: 26 },
                { key: 'area', width: 24 },
                { key: 'rol', width: 15 },
                { key: 'estado', width: 15 },
                { key: 'fecha', width: 18 }
            ];

            // ============================================
            // BANNER EJECUTIVO CON LOGO DE LA AGENCIA (FILAS 1 A 4)
            // ============================================
            ws.mergeCells('A1:B4');
            ws.mergeCells('C1:J2');
            ws.mergeCells('C3:J3');
            ws.mergeCells('C4:J4');

            ws.getRow(1).height = 24;
            ws.getRow(2).height = 24;
            ws.getRow(3).height = 20;
            ws.getRow(4).height = 20;

            for (let r = 1; r <= 4; r++) {
                for (let col = 1; col <= 10; col++) {
                    ws.getCell(r, col).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: primaryArgb }
                    };
                }
            }

            const reportTitle = ws.getCell('C1');
            reportTitle.value = `DIRECTORIO DE USUARIOS — ${agenciaNombre.toUpperCase()}`;
            reportTitle.font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
            reportTitle.alignment = { vertical: 'bottom', horizontal: 'left', indent: 1 };

            const reportSubtitle = ws.getCell('C3');
            reportSubtitle.value = `🏢 Agencia: ${agenciaNombre}${subdominio ? `   •   🌐 Portal: ${subdominio}` : ''}`;
            reportSubtitle.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFF8FAFC' } };
            reportSubtitle.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

            const nowStr = new Date().toLocaleString('es-MX', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            const dateCell = ws.getCell('C4');
            dateCell.value = `📅 Fecha de generación: ${nowStr}`;
            dateCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FFE2E8F0' } };
            dateCell.alignment = { vertical: 'top', horizontal: 'left', indent: 1 };

            // Incrustar logo de la agencia en proporción perfecta
            const logoBase64 = await renderAgencyLogoCardBase64(agenciaData?.logo_url, agenciaNombre, primaryColor);
            if (logoBase64) {
                const imageId = workbook.addImage({
                    base64: logoBase64,
                    extension: 'png'
                });
                ws.addImage(imageId, {
                    tl: { col: 0.12, row: 0.22 },
                    ext: { width: 195, height: 76 }
                });
            }

            // ============================================
            // FILA 5: TARJETAS DE RESUMEN (KPIs DE LA AGENCIA)
            // ============================================
            const totalExport = usuariosFiltrados.length;
            const totalActivos = usuariosFiltrados.filter(u => u.activo).length;
            const totalInactivos = totalExport - totalActivos;
            const uniqueAreasCount = new Set(
                usuariosFiltrados.map(u => (u.area || '').trim()).filter(Boolean)
            ).size;

            ws.mergeCells('A5:C5');
            ws.mergeCells('D5:E5');
            ws.mergeCells('F5:G5');
            ws.mergeCells('H5:J5');
            ws.getRow(5).height = 26;

            const kpiConfigs = [
                { cell: 'A5', text: `👥 Total de Usuarios: ${totalExport}`, color: 'FF1E293B' },
                { cell: 'D5', text: `🟢 Usuarios Activos: ${totalActivos}`, color: 'FF065F46' },
                { cell: 'F5', text: `🔴 Usuarios Inactivos: ${totalInactivos}`, color: 'FF991B1B' },
                { cell: 'H5', text: `🏢 Áreas con Personal: ${uniqueAreasCount}`, color: 'FF1E40AF' }
            ];

            for (let col = 1; col <= 10; col++) {
                const cCell = ws.getCell(5, col);
                cCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: softTintArgb }
                };
                cCell.border = {
                    top: { style: 'thin', color: { argb: secondaryArgb } },
                    bottom: { style: 'medium', color: { argb: primaryArgb } }
                };
            }

            kpiConfigs.forEach(kpi => {
                const cell = ws.getCell(kpi.cell);
                cell.value = kpi.text;
                cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: kpi.color } };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });

            // Fila 6 separadora
            ws.getRow(6).height = 10;

            // ============================================
            // FILA 7: ENCABEZADOS DE LA TABLA
            // ============================================
            const tableHeaders = [
                'N°',
                'Nombre(s)',
                'Apellidos',
                'Correo Electrónico',
                'Teléfono',
                'Puesto / Cargo',
                'Área / Departamento',
                'Rol',
                'Estado',
                'Fecha Registro'
            ];

            const headerRow = ws.getRow(7);
            headerRow.height = 30;
            tableHeaders.forEach((h, idx) => {
                const cell = headerRow.getCell(idx + 1);
                cell.value = h;
                cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: secondaryArgb }
                };
                cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                cell.border = {
                    top: { style: 'medium', color: { argb: primaryArgb } },
                    bottom: { style: 'medium', color: { argb: primaryArgb } },
                    left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
                    right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
                };
            });

            // Activar autofiltro en los encabezados
            ws.autoFilter = 'A7:J7';

            // ============================================
            // FILAS DE USUARIOS (8 EN ADELANTE)
            // ============================================
            usuariosFiltrados.forEach((u, index) => {
                const rowIdx = 8 + index;
                const row = ws.getRow(rowIdx);
                row.height = 24;

                const isEven = index % 2 === 1;
                const rowBgArgb = isEven ? zebraTintArgb : 'FFFFFFFF';

                const fechaFormat = u.fecha_creacion
                    ? new Date(u.fecha_creacion).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                      })
                    : '-';

                const rolCapitalizado = u.rol
                    ? u.rol.charAt(0).toUpperCase() + u.rol.slice(1)
                    : 'Usuario';

                const rowValues = [
                    index + 1,
                    u.nombre || '-',
                    u.apellido || '-',
                    u.email || '-',
                    u.telefono || '-',
                    u.puesto || '-',
                    u.area || 'Sin área',
                    rolCapitalizado,
                    u.activo ? 'ACTIVO' : 'INACTIVO',
                    fechaFormat
                ];

                rowValues.forEach((val, colZero) => {
                    const colNum = colZero + 1;
                    const cell = row.getCell(colNum);
                    cell.value = val;

                    const isCentered = colNum === 1 || colNum === 5 || colNum === 7 || colNum === 8 || colNum === 9 || colNum === 10;
                    cell.alignment = {
                        vertical: 'middle',
                        horizontal: isCentered ? 'center' : 'left',
                        indent: isCentered ? 0 : 1
                    };

                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
                    };

                    if (colNum === 9) {
                        // Celda de Estado con badge semántico
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: u.activo ? 'FFD1FAE5' : 'FFFEE2E2' }
                        };
                        cell.font = {
                            name: 'Calibri',
                            size: 10,
                            bold: true,
                            color: { argb: u.activo ? 'FF065F46' : 'FF991B1B' }
                        };
                    } else {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: rowBgArgb }
                        };
                        cell.font = {
                            name: 'Calibri',
                            size: 11,
                            bold: colNum === 1 || colNum === 2,
                            color: { argb: colNum === 4 ? 'FF1D4ED8' : 'FF1E293B' }
                        };
                    }
                });
            });

            // ============================================
            // PIE DE REPORTE
            // ============================================
            const footerRowIdx = 8 + usuariosFiltrados.length + 1;
            ws.mergeCells(`A${footerRowIdx}:J${footerRowIdx}`);
            const footerRow = ws.getRow(footerRowIdx);
            footerRow.height = 24;
            const footerCell = ws.getCell(`A${footerRowIdx}`);
            footerCell.value = `Reporte oficial generado por Helpdesk Portal para ${agenciaNombre} • Total: ${usuariosFiltrados.length} usuario(s)`;
            footerCell.font = { name: 'Calibri', size: 10, italic: true, bold: true, color: { argb: 'FFFFFFFF' } };
            footerCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: primaryArgb }
            };
            footerCell.alignment = { vertical: 'middle', horizontal: 'center' };

            const cleanAgencyFile = agenciaNombre.replace(/[^a-zA-Z0-9_-]/g, '_');
            const dateSlug = new Date().toISOString().split('T')[0];
            await downloadWorkbookBuffer(workbook, `Usuarios_${cleanAgencyFile}_${dateSlug}.xlsx`);
            toast.success(`📊 Excel de usuarios de ${agenciaNombre} descargado`);
        } catch (error) {
            console.error('Error al exportar usuarios a Excel:', error);
            toast.error('Error al generar el archivo Excel de usuarios');
        } finally {
            setExportingExcel(false);
        }
    };

    // ============================================
    // CREAR / ACTUALIZAR USUARIO
    // ============================================
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (editingUser) {
                const updateData: any = {
                    nombre: formData.nombre,
                    apellido: formData.apellido,
                    telefono: formData.telefono,
                    puesto: formData.puesto,
                    area: formData.area
                };
                if (formData.password) {
                    updateData.password = formData.password;
                }
                await api.put(`/auth/users/${editingUser.id}`, updateData);
                toast.success('✅ Usuario actualizado');
            } else {
                await api.post('/auth/users', {
                    nombre: formData.nombre,
                    apellido: formData.apellido,
                    email: formData.email,
                    password: formData.password,
                    telefono: formData.telefono,
                    puesto: formData.puesto,
                    area: formData.area,
                    agencia_id: agenciaId,
                    rol: 'usuario'
                });
                toast.success('✅ Usuario creado');
            }
            setShowModal(false);
            setEditingUser(null);
            resetForm();
            loadUsuarios();
        } catch (error: any) {
            console.error('Error:', error);
            toast.error(error.response?.data?.error || '❌ Error al guardar usuario');
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // ELIMINAR USUARIOS
    // ============================================
    const deleteUsers = async () => {
        if (selectedUsers.length === 0) {
            toast.error('Selecciona al menos un usuario');
            return;
        }
        if (!confirm(`¿Eliminar ${selectedUsers.length} usuario(s)?`)) return;

        try {
            setLoading(true);
            for (const id of selectedUsers) {
                await api.delete(`/auth/users/${id}`);
            }
            toast.success(`✅ ${selectedUsers.length} usuario(s) eliminado(s)`);
            setSelectedUsers([]);
            loadUsuarios();
        } catch (error) {
            toast.error('❌ Error al eliminar usuarios');
        } finally {
            setLoading(false);
        }
    };

    const deleteSingleUser = async (user: IUsuario) => {
        if (!confirm(`¿Eliminar a ${user.nombre} ${user.apellido}?`)) return;
        try {
            setLoading(true);
            await api.delete(`/auth/users/${user.id}`);
            toast.success('✅ Usuario eliminado');
            setSelectedUsers(prev => prev.filter(id => id !== user.id));
            loadUsuarios();
        } catch (error) {
            toast.error('❌ Error al eliminar usuario');
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // SELECCIONAR USUARIOS
    // ============================================
    const toggleSelectAll = () => {
        if (selectedUsers.length === usuariosFiltrados.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(usuariosFiltrados.map(u => u.id));
        }
    };

    const toggleSelectUser = (id: number) => {
        setSelectedUsers(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // ============================================
    // RESET FORM
    // ============================================
    const resetForm = () => {
        setFormData({
            nombre: '',
            apellido: '',
            email: '',
            password: '',
            telefono: '',
            puesto: '',
            area: '',
            rol: 'usuario'
        });
        setEditingUser(null);
    };

    // ============================================
    // OBTENER INICIALES DEL USUARIO
    // ============================================
    const getInitials = (nombre: string, apellido: string) => {
        return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
    };

    const validExcelCount = excelRows.filter(r => r.valido).length;
    const invalidExcelCount = excelRows.length - validExcelCount;

    // ============================================
    // RENDER
    // ============================================
    return (
        <div>
            <style>{`
                .user-modal-card {
                    background-color: ${c.tarjeta} !important;
                    color: ${c.texto} !important;
                    border: 1px solid ${c.borde} !important;
                }
                .user-modal-card label {
                    color: ${c.texto} !important;
                }
                .user-modal-card input, .user-modal-card select, .user-modal-card textarea {
                    background-color: ${c.inputBg} !important;
                    color: ${c.inputText} !important;
                    border: 1px solid ${c.borde} !important;
                }
                .user-modal-info-box {
                    background-color: ${c.hoverBg} !important;
                    color: ${c.texto} !important;
                    border: 1px solid ${c.borde} !important;
                }
                .excel-action-btn {
                    transition: all 0.2s ease;
                }
                .excel-action-btn:hover:not(:disabled) {
                    transform: translateY(-1px);
                    filter: brightness(1.06);
                    box-shadow: 0 4px 10px rgba(0,0,0,0.12);
                }
            `}</style>

            {/* Input oculto para subir archivo Excel */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelFileChange}
                style={{ display: 'none' }}
            />

            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: c.texto }}>
                        👥 Usuarios de la Agencia
                    </h2>
                    <p style={{ color: c.textoMuted, fontSize: '14px' }}>
                        {usuariosFiltrados.length} usuarios encontrados
                    </p>
                </div>

                {/* Botonera de Acciones (Excel por Agencia + Nuevo Usuario) */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {selectedUsers.length > 0 && (
                        <button
                            onClick={deleteUsers}
                            className="excel-action-btn"
                            style={{
                                padding: '8px 14px',
                                backgroundColor: '#dc2626',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: '500',
                                fontSize: '13px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            🗑️ Eliminar ({selectedUsers.length})
                        </button>
                    )}

                    {/* Botón 1: Descargar Plantilla Excel para llenar usuarios */}
                    <button
                        onClick={handleDownloadTemplate}
                        disabled={downloadingTemplate}
                        className="excel-action-btn"
                        title="Descargar plantilla Excel con el formato de esta agencia para registrar usuarios"
                        style={{
                            padding: '8px 14px',
                            backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                            color: isDarkMode ? '#60a5fa' : '#1d4ed8',
                            border: `1px solid ${isDarkMode ? '#3b82f6' : '#93c5fd'}`,
                            borderRadius: '6px',
                            cursor: downloadingTemplate ? 'wait' : 'pointer',
                            fontWeight: '600',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        📥 {downloadingTemplate ? 'Generando...' : 'Descargar Plantilla'}
                    </button>

                    {/* Botón 2: Subir Excel lleno para registrar usuarios */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="excel-action-btn"
                        title="Subir archivo Excel lleno para registrar usuarios en esta agencia"
                        style={{
                            padding: '8px 14px',
                            backgroundColor: '#059669',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        📤 Subir Excel
                    </button>

                    {/* Botón 3: Descargar Usuarios actuales en Excel con logo y diseño de la agencia */}
                    <button
                        onClick={handleExportUsersExcel}
                        disabled={exportingExcel || usuariosFiltrados.length === 0}
                        className="excel-action-btn"
                        title="Descargar los usuarios registrados en Excel con el diseño y logo de la agencia"
                        style={{
                            padding: '8px 14px',
                            backgroundColor: '#0d9488',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: exportingExcel || usuariosFiltrados.length === 0 ? 'not-allowed' : 'pointer',
                            opacity: usuariosFiltrados.length === 0 ? 0.6 : 1,
                            fontWeight: '600',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        📊 {exportingExcel ? 'Exportando...' : 'Descargar Usuarios Excel'}
                    </button>

                    {/* Botón: + Nuevo Usuario */}
                    <button
                        onClick={() => {
                            resetForm();
                            setEditingUser(null);
                            setShowModal(true);
                        }}
                        className="excel-action-btn"
                        style={{
                            padding: '8px 16px',
                            backgroundColor: c.primario,
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '13px'
                        }}
                    >
                        + Nuevo Usuario
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '16px',
                flexWrap: 'wrap',
                alignItems: 'center'
            }}>
                <input
                    type="text"
                    placeholder="🔍 Buscar por nombre, email, puesto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        flex: 1,
                        minWidth: '200px',
                        padding: '8px 12px',
                        border: '1px solid ' + c.borde,
                        borderRadius: '6px',
                        outline: 'none',
                        backgroundColor: c.inputBg,
                        color: c.inputText
                    }}
                />
                <select
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value as any)}
                    style={{
                        padding: '8px 12px',
                        border: '1px solid ' + c.borde,
                        borderRadius: '6px',
                        outline: 'none',
                        backgroundColor: c.inputBg,
                        color: c.inputText
                    }}
                >
                    <option value="todos">Todos</option>
                    <option value="activos">Activos</option>
                    <option value="inactivos">Inactivos</option>
                </select>
            </div>

            {/* Tabla de usuarios */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: c.texto }}>Cargando...</div>
            ) : usuariosFiltrados.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: c.textoMuted }}>
                    No hay usuarios que coincidan con los filtros
                </div>
            ) : (
                <div style={{
                    backgroundColor: c.tarjeta,
                    borderRadius: '8px',
                    overflow: 'auto',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    border: '1px solid ' + c.borde
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                        <thead style={{ backgroundColor: isDarkMode ? '#1e293b' : '#f9fafb' }}>
                            <tr>
                                <th style={{ padding: '12px 16px', width: '40px' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.length === usuariosFiltrados.length && usuariosFiltrados.length > 0}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: c.textoMuted }}>
                                    Usuario
                                </th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: c.textoMuted }}>
                                    Email
                                </th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: c.textoMuted }}>
                                    Puesto
                                </th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: c.textoMuted }}>
                                    Estado
                                </th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: c.textoMuted }}>
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuariosFiltrados.map((user) => (
                                <tr key={user.id} style={{ borderTop: '1px solid ' + c.borde }}>
                                    <td style={{ padding: '12px 16px' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.includes(user.id)}
                                            onChange={() => toggleSelectUser(user.id)}
                                        />
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '50%',
                                                backgroundColor: c.primario,
                                                color: 'white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '14px',
                                                fontWeight: 'bold'
                                            }}>
                                                {getInitials(user.nombre, user.apellido)}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '500', color: c.texto }}>
                                                    {user.nombre} {user.apellido}
                                                </div>
                                                <div style={{ fontSize: '12px', color: c.textoMuted }}>
                                                    {user.rol} {user.area ? `• ${user.area}` : ''}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 16px', color: c.textoMuted }}>
                                        {user.email}
                                    </td>
                                    <td style={{ padding: '12px 16px', color: c.texto }}>
                                        {user.puesto || '-'}
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={{
                                            padding: '2px 10px',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            fontWeight: '500',
                                            backgroundColor: user.activo ? (isDarkMode ? '#064e3b' : '#d1fae5') : (isDarkMode ? '#7f1d1d' : '#fee2e2'),
                                            color: user.activo ? (isDarkMode ? '#6ee7b7' : '#065f46') : (isDarkMode ? '#fca5a5' : '#dc2626')
                                        }}>
                                            {user.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                        <button
                                            onClick={() => {
                                                setViewingUser(user);
                                            }}
                                            style={{
                                                padding: '4px 10px',
                                                backgroundColor: isDarkMode ? '#334155' : '#e5e7eb',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                marginRight: '4px',
                                                color: c.texto
                                            }}
                                        >
                                            👁️
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingUser(user);
                                                setFormData({
                                                    nombre: user.nombre,
                                                    apellido: user.apellido,
                                                    email: user.email,
                                                    password: '',
                                                    telefono: user.telefono || '',
                                                    puesto: user.puesto || '',
                                                    area: user.area || '',
                                                    rol: user.rol
                                                });
                                                setShowModal(true);
                                            }}
                                            style={{
                                                padding: '4px 10px',
                                                backgroundColor: '#dbeafe',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                marginRight: '4px',
                                                color: '#1e40af'
                                            }}
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => deleteSingleUser(user)}
                                            style={{
                                                padding: '4px 10px',
                                                backgroundColor: '#fee2e2',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                color: '#dc2626'
                                            }}
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ============================================
            MODAL VISTA PREVIA E IMPORTACIÓN DE EXCEL
            ============================================ */}
            {showImportModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1100,
                    padding: '16px'
                }}>
                    <div className="user-modal-card" style={{
                        padding: '28px',
                        borderRadius: '14px',
                        maxWidth: '960px',
                        width: '100%',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 20px 45px rgba(0,0,0,0.35)'
                    }}>
                        {/* Encabezado del Modal */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: `1px solid ${c.borde}`,
                            paddingBottom: '16px',
                            marginBottom: '16px',
                            flexWrap: 'wrap',
                            gap: '12px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {agenciaData?.logo_url ? (
                                    <img
                                        src={agenciaData.logo_url}
                                        alt="Logo Agencia"
                                        style={{
                                            width: '44px',
                                            height: '44px',
                                            objectFit: 'contain',
                                            backgroundColor: 'white',
                                            padding: '4px',
                                            borderRadius: '8px',
                                            border: `1px solid ${c.borde}`
                                        }}
                                    />
                                ) : (
                                    <span style={{ fontSize: '28px' }}>📤</span>
                                )}
                                <div>
                                    <h2 style={{ fontSize: '19px', fontWeight: 'bold', margin: 0, color: c.texto }}>
                                        Registro Masivo de Usuarios desde Excel
                                    </h2>
                                    <p style={{ fontSize: '13px', margin: '2px 0 0 0', color: c.textoMuted }}>
                                        📄 Archivo: <strong>{importedFileName}</strong> • Agencia: <strong>{agenciaData?.nombre || `ID ${agenciaId}`}</strong>
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: isDarkMode ? '#334155' : '#f1f5f9',
                                        color: c.texto,
                                        border: `1px solid ${c.borde}`,
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: '600'
                                    }}
                                >
                                    🔄 Cambiar archivo
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowImportModal(false);
                                        setImportResult(null);
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '20px',
                                        cursor: 'pointer',
                                        color: c.textoMuted
                                    }}
                                >
                                    ✖
                                </button>
                            </div>
                        </div>

                        {/* Resumen de resultado post-importación o vista previa */}
                        {importResult ? (
                            <div style={{ padding: '16px 0', overflowY: 'auto' }}>
                                <div style={{
                                    padding: '20px',
                                    borderRadius: '10px',
                                    backgroundColor: isDarkMode ? '#064e3b40' : '#ecfdf5',
                                    border: '1px solid #10b981',
                                    marginBottom: '16px',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>🎉</div>
                                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 6px 0', color: isDarkMode ? '#6ee7b7' : '#065f46' }}>
                                        ¡Proceso de importación completado!
                                    </h3>
                                    <p style={{ margin: 0, fontSize: '14px', color: c.texto }}>
                                        Se registraron <strong>{importResult.creadosCount}</strong> usuario(s) correctamente en <strong>{agenciaData?.nombre}</strong>.
                                    </p>
                                </div>

                                {importResult.errores && importResult.errores.length > 0 && (
                                    <div style={{
                                        padding: '16px',
                                        borderRadius: '8px',
                                        backgroundColor: isDarkMode ? '#7f1d1d40' : '#fef2f2',
                                        border: '1px solid #ef4444',
                                        marginBottom: '16px'
                                    }}>
                                        <h4 style={{ margin: '0 0 8px 0', color: isDarkMode ? '#fca5a5' : '#991b1b', fontSize: '14px' }}>
                                            ⚠️ {importResult.errores.length} registro(s) no se pudieron importar:
                                        </h4>
                                        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: c.texto }}>
                                            {importResult.errores.map((err, i) => (
                                                <li key={i} style={{ marginBottom: '4px' }}>
                                                    <strong>{err.nombre || err.email}</strong> ({err.email}): {err.error}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowImportModal(false);
                                            setImportResult(null);
                                            setExcelRows([]);
                                        }}
                                        style={{
                                            padding: '10px 24px',
                                            backgroundColor: c.primario,
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontWeight: '600'
                                        }}
                                    >
                                        Finalizar y Ver Usuarios
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Indicadores rápidos de validación */}
                                <div style={{
                                    display: 'flex',
                                    gap: '12px',
                                    marginBottom: '14px',
                                    flexWrap: 'wrap'
                                }}>
                                    <div style={{
                                        padding: '8px 14px',
                                        borderRadius: '8px',
                                        backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9',
                                        border: `1px solid ${c.borde}`,
                                        fontSize: '13px',
                                        fontWeight: '600'
                                    }}>
                                        📋 Total detectados: {excelRows.length}
                                    </div>
                                    <div style={{
                                        padding: '8px 14px',
                                        borderRadius: '8px',
                                        backgroundColor: isDarkMode ? '#064e3b' : '#d1fae5',
                                        color: isDarkMode ? '#6ee7b7' : '#065f46',
                                        fontSize: '13px',
                                        fontWeight: '600'
                                    }}>
                                        ✅ Listos para registrar: {validExcelCount}
                                    </div>
                                    {invalidExcelCount > 0 && (
                                        <div style={{
                                            padding: '8px 14px',
                                            borderRadius: '8px',
                                            backgroundColor: isDarkMode ? '#7f1d1d' : '#fee2e2',
                                            color: isDarkMode ? '#fca5a5' : '#991b1b',
                                            fontSize: '13px',
                                            fontWeight: '600'
                                        }}>
                                            ⚠️ Con observaciones: {invalidExcelCount} (puedes corregirlos aquí mismo)
                                        </div>
                                    )}
                                </div>

                                {/* Tabla editable de vista previa */}
                                <div style={{
                                    flex: 1,
                                    overflow: 'auto',
                                    border: `1px solid ${c.borde}`,
                                    borderRadius: '8px',
                                    marginBottom: '16px'
                                }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '780px' }}>
                                        <thead style={{ position: 'sticky', top: 0, backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', zIndex: 1 }}>
                                            <tr>
                                                <th style={{ padding: '10px', textAlign: 'left', borderBottom: `1px solid ${c.borde}` }}>Nombre *</th>
                                                <th style={{ padding: '10px', textAlign: 'left', borderBottom: `1px solid ${c.borde}` }}>Apellido *</th>
                                                <th style={{ padding: '10px', textAlign: 'left', borderBottom: `1px solid ${c.borde}` }}>Email *</th>
                                                <th style={{ padding: '10px', textAlign: 'left', borderBottom: `1px solid ${c.borde}` }}>Contraseña *</th>
                                                <th style={{ padding: '10px', textAlign: 'left', borderBottom: `1px solid ${c.borde}` }}>Teléfono</th>
                                                <th style={{ padding: '10px', textAlign: 'left', borderBottom: `1px solid ${c.borde}` }}>Puesto</th>
                                                <th style={{ padding: '10px', textAlign: 'left', borderBottom: `1px solid ${c.borde}` }}>Área</th>
                                                <th style={{ padding: '10px', textAlign: 'left', borderBottom: `1px solid ${c.borde}` }}>Estado</th>
                                                <th style={{ padding: '10px', textAlign: 'center', borderBottom: `1px solid ${c.borde}` }}>Quitar</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {excelRows.map((row, idx) => (
                                                <tr key={idx} style={{ borderBottom: `1px solid ${c.borde}` }}>
                                                    <td style={{ padding: '6px 8px' }}>
                                                        <input
                                                            type="text"
                                                            value={row.nombre}
                                                            onChange={(e) => handleUpdateExcelRow(idx, 'nombre', e.target.value)}
                                                            style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', fontSize: '12px' }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '6px 8px' }}>
                                                        <input
                                                            type="text"
                                                            value={row.apellido}
                                                            onChange={(e) => handleUpdateExcelRow(idx, 'apellido', e.target.value)}
                                                            style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', fontSize: '12px' }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '6px 8px' }}>
                                                        <input
                                                            type="email"
                                                            value={row.email}
                                                            onChange={(e) => handleUpdateExcelRow(idx, 'email', e.target.value)}
                                                            style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', fontSize: '12px' }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '6px 8px' }}>
                                                        <input
                                                            type="text"
                                                            value={row.password}
                                                            onChange={(e) => handleUpdateExcelRow(idx, 'password', e.target.value)}
                                                            style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', fontSize: '12px' }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '6px 8px' }}>
                                                        <input
                                                            type="text"
                                                            value={row.telefono}
                                                            onChange={(e) => handleUpdateExcelRow(idx, 'telefono', e.target.value)}
                                                            style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', fontSize: '12px' }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '6px 8px' }}>
                                                        <input
                                                            type="text"
                                                            value={row.puesto}
                                                            onChange={(e) => handleUpdateExcelRow(idx, 'puesto', e.target.value)}
                                                            style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', fontSize: '12px' }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '6px 8px' }}>
                                                        <input
                                                            type="text"
                                                            value={row.area}
                                                            onChange={(e) => handleUpdateExcelRow(idx, 'area', e.target.value)}
                                                            list={`areas-datalist-${agenciaId}`}
                                                            style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', fontSize: '12px' }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>
                                                        {row.valido ? (
                                                            <span style={{
                                                                padding: '3px 8px',
                                                                borderRadius: '4px',
                                                                fontSize: '11px',
                                                                fontWeight: '600',
                                                                backgroundColor: isDarkMode ? '#064e3b' : '#d1fae5',
                                                                color: isDarkMode ? '#6ee7b7' : '#065f46'
                                                            }}>
                                                                ✅ Listo
                                                            </span>
                                                        ) : (
                                                            <span style={{
                                                                padding: '3px 8px',
                                                                borderRadius: '4px',
                                                                fontSize: '11px',
                                                                fontWeight: '600',
                                                                backgroundColor: isDarkMode ? '#7f1d1d' : '#fee2e2',
                                                                color: isDarkMode ? '#fca5a5' : '#dc2626'
                                                            }}>
                                                                ⚠️ {row.errorMsg}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveExcelRow(idx)}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                fontSize: '14px'
                                                            }}
                                                            title="Quitar fila"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <datalist id={`areas-datalist-${agenciaId}`}>
                                        {areas.map(a => (
                                            <option key={a.id} value={a.nombre} />
                                        ))}
                                    </datalist>
                                </div>

                                {/* Botones de confirmación */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '12px', color: c.textoMuted }}>
                                        💡 Solo se registrarán las filas marcadas con <strong>✅ Listo</strong>.
                                    </span>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowImportModal(false);
                                                setExcelRows([]);
                                            }}
                                            style={{
                                                padding: '10px 18px',
                                                backgroundColor: isDarkMode ? '#334155' : '#e5e7eb',
                                                color: c.texto,
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontWeight: '500'
                                            }}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            disabled={importingUsers || validExcelCount === 0}
                                            onClick={handleConfirmBulkImport}
                                            style={{
                                                padding: '10px 22px',
                                                backgroundColor: '#059669',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: importingUsers || validExcelCount === 0 ? 'not-allowed' : 'pointer',
                                                opacity: importingUsers || validExcelCount === 0 ? 0.5 : 1,
                                                fontWeight: '600'
                                            }}
                                        >
                                            {importingUsers
                                                ? '⏳ Registrando usuarios...'
                                                : `🚀 Registrar ${validExcelCount} Usuario(s)`}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ============================================
            MODAL CREAR/EDITAR USUARIO
            ============================================ */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="user-modal-card" style={{
                        padding: '32px',
                        borderRadius: '12px',
                        maxWidth: '500px',
                        width: '90%',
                        maxHeight: '90vh',
                        overflow: 'auto'
                    }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: c.texto }}>
                            {editingUser ? '✏️ Editar Usuario' : '+ Nuevo Usuario'}
                        </h2>

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                                    Nombre *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                                    Apellido *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.apellido}
                                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        outline: 'none'
                                    }}
                                    disabled={!!editingUser}
                                />
                            </div>

                            {!editingUser && (
                                <div style={{ marginBottom: '12px' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                                        Contraseña *
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            outline: 'none'
                                        }}
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                </div>
                            )}

                            {editingUser && (
                                <div style={{ marginBottom: '12px' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                                        Nueva Contraseña (opcional)
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            outline: 'none'
                                        }}
                                        placeholder="Dejar vacío para no cambiar"
                                    />
                                </div>
                            )}

                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                                    Teléfono
                                </label>
                                <input
                                    type="text"
                                    value={formData.telefono}
                                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                                    Puesto
                                </label>
                                <input
                                    type="text"
                                    value={formData.puesto}
                                    onChange={(e) => setFormData({ ...formData, puesto: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            {/* 🔥 SELECTOR DE ÁREA */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                                    Área
                                </label>
                                <select
                                    value={formData.area}
                                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        outline: 'none',
                                        backgroundColor: 'white'
                                    }}
                                >
                                    <option value="">Seleccionar área</option>
                                    {areas.map((area) => (
                                        <option key={area.id} value={area.nombre}>
                                            {area.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingUser(null);
                                        resetForm();
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        backgroundColor: isDarkMode ? '#334155' : '#e5e7eb',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        color: c.texto
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        flex: 2,
                                        padding: '10px',
                                        backgroundColor: c.primario,
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        opacity: loading ? 0.5 : 1
                                    }}
                                >
                                    {loading ? 'Guardando...' : editingUser ? 'Actualizar' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============================================
            MODAL VER USUARIO
            ============================================ */}
            {viewingUser && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="user-modal-card" style={{
                        padding: '32px',
                        borderRadius: '12px',
                        maxWidth: '450px',
                        width: '90%'
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                backgroundColor: c.primario,
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '32px',
                                fontWeight: 'bold',
                                margin: '0 auto'
                            }}>
                                {getInitials(viewingUser.nombre, viewingUser.apellido)}
                            </div>
                            <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '12px', color: c.texto }}>
                                {viewingUser.nombre} {viewingUser.apellido}
                            </h2>
                            <span style={{
                                padding: '2px 10px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '500',
                                backgroundColor: isDarkMode ? '#1e3a8a' : '#dbeafe',
                                color: isDarkMode ? '#3b82f6' : '#1e40af'
                            }}>
                                {viewingUser.rol}
                            </span>
                        </div>

                        <div className="user-modal-info-box" style={{
                            padding: '16px',
                            borderRadius: '8px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                        }}>
                            <div><strong>Email:</strong> {viewingUser.email}</div>
                            <div><strong>Teléfono:</strong> {viewingUser.telefono || '-'}</div>
                            <div><strong>Puesto:</strong> {viewingUser.puesto || '-'}</div>
                            <div><strong>Área:</strong> {viewingUser.area || '-'}</div>
                            <div><strong>Estado:</strong> {viewingUser.activo ? 'Activo' : 'Inactivo'}</div>
                            <div><strong>Fecha registro:</strong> {new Date(viewingUser.fecha_creacion).toLocaleDateString()}</div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                            <button
                                onClick={() => {
                                    setViewingUser(null);
                                }}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    backgroundColor: isDarkMode ? '#334155' : '#e5e7eb',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    color: c.texto
                                }}
                            >
                                Cerrar
                            </button>
                            <button
                                onClick={() => {
                                    const user = viewingUser;
                                    setViewingUser(null);
                                    setEditingUser(user);
                                    setFormData({
                                        nombre: user.nombre,
                                        apellido: user.apellido,
                                        email: user.email,
                                        password: '',
                                        telefono: user.telefono || '',
                                        puesto: user.puesto || '',
                                        area: user.area || '',
                                        rol: user.rol
                                    });
                                    setShowModal(true);
                                }}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    backgroundColor: c.primario,
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                            >
                                ✏️ Editar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Usuarios;
