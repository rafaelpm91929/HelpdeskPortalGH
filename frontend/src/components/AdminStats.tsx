import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api/axios.config';
import toast from 'react-hot-toast';

interface AdminStatsProps {
    agenciaId: number;
    colores: {
        primario: string;
        secundario: string;
        fondo: string;
        texto: string;
        tarjeta: string;
        borde: string;
        inputBg: string;
        inputText: string;
        textoMuted: string;
        hoverBg: string;
    };
    isDarkMode: boolean;
    refreshTrigger?: number;
}

interface IStatTicket {
    id: number;
    numero_secuencial?: number;
    agencia_id: number;
    usuario_id: number;
    asunto: string;
    tipo: string;
    estado: string;
    prioridad: string;
    area: string;
    fecha_creacion: string;
    fecha_actualizacion?: string | null;
    fecha_resolucion?: string | null;
    fecha_cierre?: string | null;
    fecha_primera_respuesta?: string | null;
    agente_id?: number | null;
    agente_nombre?: string | null;
    agente_apellido?: string | null;
}

export const AdminStats: React.FC<AdminStatsProps> = ({
    agenciaId,
    colores,
    isDarkMode,
    refreshTrigger
}) => {
    const [tickets, setTickets] = useState<IStatTicket[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // Filtros de fecha
    const [datePreset, setDatePreset] = useState<string>('all');
    const [fechaInicio, setFechaInicio] = useState<string>('');
    const [fechaFin, setFechaFin] = useState<string>('');

    // Filtros locales en tiempo real
    const [filterArea, setFilterArea] = useState<string>('all');
    const [filterPrioridad, setFilterPrioridad] = useState<string>('all');
    const [filterEstado, setFilterEstado] = useState<string>('all');
    const [filterAgente, setFilterAgente] = useState<string>('all');

    // Vista de tabla inferior: por área o por agente
    const [tableMode, setTableMode] = useState<'area' | 'agente'>('area');

    // Calcular fechas cuando cambia el preset
    useEffect(() => {
        const hoy = new Date();
        let inicio = new Date();

        if (datePreset === 'last7') {
            inicio.setDate(hoy.getDate() - 7);
            setFechaInicio(inicio.toISOString().split('T')[0]);
            setFechaFin(hoy.toISOString().split('T')[0]);
        } else if (datePreset === 'last30') {
            inicio.setDate(hoy.getDate() - 30);
            setFechaInicio(inicio.toISOString().split('T')[0]);
            setFechaFin(hoy.toISOString().split('T')[0]);
        } else if (datePreset === 'thisMonth') {
            inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
            setFechaInicio(inicio.toISOString().split('T')[0]);
            setFechaFin(hoy.toISOString().split('T')[0]);
        } else if (datePreset === 'thisYear') {
            inicio = new Date(hoy.getFullYear(), 0, 1);
            setFechaInicio(inicio.toISOString().split('T')[0]);
            setFechaFin(hoy.toISOString().split('T')[0]);
        } else if (datePreset === 'all') {
            setFechaInicio('');
            setFechaFin('');
        }
    }, [datePreset]);

    const loadStats = async (silent = false) => {
        if (!agenciaId) return;
        try {
            if (!silent) setLoading(true);
            const params: any = {
                agencia_id: agenciaId
            };
            if (fechaInicio) params.fecha_inicio = `${fechaInicio}T00:00:00`;
            if (fechaFin) params.fecha_fin = `${fechaFin}T23:59:59`;

            const response = await api.get('/tickets/stats', { params });
            if (response.data.success) {
                setTickets(response.data.data || []);
            } else if (!silent) {
                toast.error('No se pudieron cargar las estadísticas');
            }
        } catch (error: any) {
            console.error('Error al cargar estadísticas de admin:', error);
            if (!silent) {
                toast.error('Error al cargar estadísticas');
            }
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        loadStats(false);
    }, [agenciaId, fechaInicio, fechaFin]);

    useEffect(() => {
        if (refreshTrigger && agenciaId) {
            loadStats(true);
        }
    }, [refreshTrigger]);

    // Helpers de formato de tiempo
    const formatMinutes = (totalMinutos: number | null): string => {
        if (totalMinutos === null || isNaN(totalMinutos) || totalMinutos < 0) return 'Sin datos';
        if (totalMinutos < 1) {
            const segs = Math.max(1, Math.round(totalMinutos * 60));
            return `${segs}s`;
        }
        const horas = Math.floor(totalMinutos / 60);
        const minutos = Math.round(totalMinutos % 60);
        if (horas >= 24) {
            const dias = Math.floor(horas / 24);
            const hrsRestantes = horas % 24;
            return `${dias}d ${hrsRestantes}h ${minutos}m`;
        }
        return horas > 0 ? `${horas}h ${minutos}m` : `${minutos}m`;
    };

    const isResolvedOrClosed = (estado: string) => {
        const st = (estado || '').toLowerCase().trim();
        return st === 'resuelto' || st === 'cerrado';
    };

    // Obtener tiempo en minutos de primera respuesta de un ticket
    const getFirstResponseMinutes = (t: IStatTicket): number | null => {
        const fechaResp = t.fecha_primera_respuesta || t.fecha_resolucion || t.fecha_cierre;
        if (!fechaResp || !t.fecha_creacion) return null;
        const start = new Date(t.fecha_creacion).getTime();
        const end = new Date(fechaResp).getTime();
        if (isNaN(start) || isNaN(end)) return null;
        const diffMin = (end - start) / 60000;
        return diffMin >= 0 ? diffMin : 0;
    };

    // Obtener tiempo en minutos de resolución / cierre de un ticket
    const getResolutionMinutes = (t: IStatTicket): number | null => {
        if (!isResolvedOrClosed(t.estado)) return null;
        const fechaFin = t.fecha_resolucion || t.fecha_cierre || t.fecha_actualizacion;
        if (!fechaFin || !t.fecha_creacion) return null;
        const start = new Date(t.fecha_creacion).getTime();
        const end = new Date(fechaFin).getTime();
        if (isNaN(start) || isNaN(end)) return null;
        const diffMin = (end - start) / 60000;
        return diffMin >= 0 ? diffMin : 0;
    };

    // Listas únicas para selectores de filtro
    const uniqueAreas = useMemo(() => {
        const set = new Set<string>();
        tickets.forEach(t => {
            const areaName = (t.area || '').trim() || 'Sin Área';
            set.add(areaName);
        });
        return Array.from(set).sort();
    }, [tickets]);

    const uniqueAgentes = useMemo(() => {
        const set = new Set<string>();
        tickets.forEach(t => {
            const agentName = t.agente_nombre
                ? `${t.agente_nombre} ${t.agente_apellido || ''}`.trim()
                : 'Sin Asignar';
            set.add(agentName);
        });
        return Array.from(set).sort();
    }, [tickets]);

    // Tickets filtrados localmente
    const filteredTickets = useMemo(() => {
        return tickets.filter(t => {
            const areaName = (t.area || '').trim() || 'Sin Área';
            const agentName = t.agente_nombre
                ? `${t.agente_nombre} ${t.agente_apellido || ''}`.trim()
                : 'Sin Asignar';
            if (filterArea !== 'all' && areaName !== filterArea) return false;
            if (filterPrioridad !== 'all' && (t.prioridad || '').toLowerCase() !== filterPrioridad) return false;
            if (filterEstado !== 'all' && (t.estado || '').toLowerCase() !== filterEstado) return false;
            if (filterAgente !== 'all' && agentName !== filterAgente) return false;
            return true;
        });
    }, [tickets, filterArea, filterPrioridad, filterEstado, filterAgente]);

    // ============================================
    // CÁLCULO DE KPIS PRINCIPALES
    // ============================================
    const kpis = useMemo(() => {
        const total = filteredTickets.length;
        let resueltosCerrados = 0;
        let pendientes = 0;
        let enAtencion = 0;

        let sumPrimeraResp = 0;
        let countPrimeraResp = 0;
        let minPrimeraResp: number | null = null;
        let maxPrimeraResp: number | null = null;

        let sumResolucion = 0;
        let countResolucion = 0;
        let minResolucion: number | null = null;
        let maxResolucion: number | null = null;

        filteredTickets.forEach(t => {
            const st = (t.estado || '').toLowerCase();
            if (st === 'resuelto' || st === 'cerrado') {
                resueltosCerrados++;
            } else if (st === 'pendiente') {
                pendientes++;
            } else {
                enAtencion++;
            }

            const respMin = getFirstResponseMinutes(t);
            if (respMin !== null) {
                sumPrimeraResp += respMin;
                countPrimeraResp++;
                if (minPrimeraResp === null || respMin < minPrimeraResp) minPrimeraResp = respMin;
                if (maxPrimeraResp === null || respMin > maxPrimeraResp) maxPrimeraResp = respMin;
            }

            const resMin = getResolutionMinutes(t);
            if (resMin !== null) {
                sumResolucion += resMin;
                countResolucion++;
                if (minResolucion === null || resMin < minResolucion) minResolucion = resMin;
                if (maxResolucion === null || resMin > maxResolucion) maxResolucion = resMin;
            }
        });

        const avgPrimeraRespMin = countPrimeraResp > 0 ? sumPrimeraResp / countPrimeraResp : null;
        const avgResolucionMin = countResolucion > 0 ? sumResolucion / countResolucion : null;

        // Eficiencia de resolución (% de tickets resueltos o cerrados sobre el total)
        const eficienciaResolucion = total > 0 ? Math.round((resueltosCerrados / total) * 100) : 0;
        // Cobertura de respuesta (% de tickets atendidos con al menos 1ra respuesta)
        const tasaRespuesta = total > 0 ? Math.round((countPrimeraResp / total) * 100) : 0;

        return {
            total,
            resueltosCerrados,
            pendientes,
            enAtencion,
            activos: total - resueltosCerrados,
            avgPrimeraRespMin,
            avgPrimeraRespFormatted: formatMinutes(avgPrimeraRespMin),
            minPrimeraRespFormatted: formatMinutes(minPrimeraResp),
            maxPrimeraRespFormatted: formatMinutes(maxPrimeraResp),
            countPrimeraResp,
            avgResolucionMin,
            avgResolucionFormatted: formatMinutes(avgResolucionMin),
            minResolucionFormatted: formatMinutes(minResolucion),
            maxResolucionFormatted: formatMinutes(maxResolucion),
            countResolucion,
            eficienciaResolucion,
            tasaRespuesta
        };
    }, [filteredTickets]);

    // ============================================
    // DATOS POR ÁREA (CONTEO, TIEMPOS, EFICIENCIA)
    // ============================================
    const areaStats = useMemo(() => {
        const map: Record<string, {
            area: string;
            total: number;
            resueltos: number;
            activos: number;
            sumRespMin: number;
            countResp: number;
            sumResMin: number;
            countRes: number;
        }> = {};

        filteredTickets.forEach(t => {
            const area = (t.area || '').trim() || 'Sin Área';
            if (!map[area]) {
                map[area] = {
                    area,
                    total: 0,
                    resueltos: 0,
                    activos: 0,
                    sumRespMin: 0,
                    countResp: 0,
                    sumResMin: 0,
                    countRes: 0
                };
            }
            map[area].total++;
            if (isResolvedOrClosed(t.estado)) {
                map[area].resueltos++;
            } else {
                map[area].activos++;
            }

            const respMin = getFirstResponseMinutes(t);
            if (respMin !== null) {
                map[area].sumRespMin += respMin;
                map[area].countResp++;
            }

            const resMin = getResolutionMinutes(t);
            if (resMin !== null) {
                map[area].sumResMin += resMin;
                map[area].countRes++;
            }
        });

        return Object.values(map)
            .map(item => ({
                ...item,
                porcentajeDelTotal: filteredTickets.length > 0 ? Math.round((item.total / filteredTickets.length) * 100) : 0,
                eficiencia: item.total > 0 ? Math.round((item.resueltos / item.total) * 100) : 0,
                avgRespMin: item.countResp > 0 ? item.sumRespMin / item.countResp : null,
                avgResMin: item.countRes > 0 ? item.sumResMin / item.countRes : null
            }))
            .sort((a, b) => b.total - a.total);
    }, [filteredTickets]);

    // ============================================
    // DATOS POR AGENTE (CONTEO, TIEMPOS, EFICIENCIA)
    // ============================================
    const agenteStats = useMemo(() => {
        const map: Record<string, {
            agente: string;
            total: number;
            resueltos: number;
            activos: number;
            sumRespMin: number;
            countResp: number;
            sumResMin: number;
            countRes: number;
        }> = {};

        filteredTickets.forEach(t => {
            const agente = t.agente_nombre
                ? `${t.agente_nombre} ${t.agente_apellido || ''}`.trim()
                : 'Sin Asignar';
            if (!map[agente]) {
                map[agente] = {
                    agente,
                    total: 0,
                    resueltos: 0,
                    activos: 0,
                    sumRespMin: 0,
                    countResp: 0,
                    sumResMin: 0,
                    countRes: 0
                };
            }
            map[agente].total++;
            if (isResolvedOrClosed(t.estado)) {
                map[agente].resueltos++;
            } else {
                map[agente].activos++;
            }

            const respMin = getFirstResponseMinutes(t);
            if (respMin !== null) {
                map[agente].sumRespMin += respMin;
                map[agente].countResp++;
            }

            const resMin = getResolutionMinutes(t);
            if (resMin !== null) {
                map[agente].sumResMin += resMin;
                map[agente].countRes++;
            }
        });

        return Object.values(map)
            .map(item => ({
                ...item,
                eficiencia: item.total > 0 ? Math.round((item.resueltos / item.total) * 100) : 0,
                avgRespMin: item.countResp > 0 ? item.sumRespMin / item.countResp : null,
                avgResMin: item.countRes > 0 ? item.sumResMin / item.countRes : null
            }))
            .sort((a, b) => b.total - a.total);
    }, [filteredTickets]);

    // ============================================
    // DISTRIBUCIÓN DE TIEMPOS DE PRIMERA RESPUESTA
    // ============================================
    const firstResponseBuckets = useMemo(() => {
        const buckets = [
            { label: '< 15 min', count: 0, color: '#10b981' },
            { label: '15 - 60 min', count: 0, color: '#3b82f6' },
            { label: '1 - 4 hrs', count: 0, color: '#f59e0b' },
            { label: '4 - 24 hrs', count: 0, color: '#f97316' },
            { label: '> 24 hrs', count: 0, color: '#ef4444' }
        ];
        filteredTickets.forEach(t => {
            const min = getFirstResponseMinutes(t);
            if (min === null) return;
            if (min < 15) buckets[0].count++;
            else if (min <= 60) buckets[1].count++;
            else if (min <= 240) buckets[2].count++;
            else if (min <= 1440) buckets[3].count++;
            else buckets[4].count++;
        });
        return buckets;
    }, [filteredTickets]);

    // ============================================
    // DISTRIBUCIÓN DE TIEMPOS DE CIERRE / RESOLUCIÓN
    // ============================================
    const resolutionBuckets = useMemo(() => {
        const buckets = [
            { label: '< 1 hr', count: 0, color: '#10b981' },
            { label: '1 - 4 hrs', count: 0, color: '#3b82f6' },
            { label: '4 - 24 hrs', count: 0, color: '#8b5cf6' },
            { label: '1 - 3 días', count: 0, color: '#f59e0b' },
            { label: '> 3 días', count: 0, color: '#ef4444' }
        ];
        filteredTickets.forEach(t => {
            const min = getResolutionMinutes(t);
            if (min === null) return;
            if (min < 60) buckets[0].count++;
            else if (min <= 240) buckets[1].count++;
            else if (min <= 1440) buckets[2].count++;
            else if (min <= 4320) buckets[3].count++;
            else buckets[4].count++;
        });
        return buckets;
    }, [filteredTickets]);

    // ============================================
    // DISTRIBUCIÓN POR ESTADO PARA GRÁFICA DE DONA
    // ============================================
    const estadoBreakdown = useMemo(() => {
        const counts: Record<string, { label: string; value: number; color: string }> = {
            resuelto: { label: 'Resuelto', value: 0, color: '#10b981' },
            cerrado: { label: 'Cerrado', value: 0, color: '#059669' },
            en_progreso: { label: 'En Progreso', value: 0, color: '#3b82f6' },
            abierto: { label: 'Abierto', value: 0, color: '#6366f1' },
            espera: { label: 'En Espera', value: 0, color: '#8b5cf6' },
            pendiente: { label: 'Pendiente', value: 0, color: '#f59e0b' }
        };

        filteredTickets.forEach(t => {
            const st = (t.estado || 'pendiente').toLowerCase().trim();
            if (st === 'en proceso' || st === 'en_progreso') {
                counts.en_progreso.value++;
            } else if (counts[st]) {
                counts[st].value++;
            } else {
                counts.pendiente.value++;
            }
        });

        return Object.values(counts).filter(item => item.value > 0);
    }, [filteredTickets]);

    const areaPalette = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#f97316', '#6366f1'];

    const getEfficiencyColor = (pct: number) => {
        if (pct >= 80) return '#10b981';
        if (pct >= 60) return '#3b82f6';
        if (pct >= 40) return '#f59e0b';
        return '#ef4444';
    };

    const getEfficiencyLabel = (pct: number) => {
        if (pct >= 85) return 'Excelente';
        if (pct >= 70) return 'Óptima';
        if (pct >= 50) return 'En Proceso';
        return 'Requiere Atención';
    };

    // ============================================
    // RENDER DEL MEDIDOR DE EFICIENCIA (DONUT SVG)
    // ============================================
    const renderEfficiencyDonut = () => {
        const size = 210;
        const cx = size / 2;
        const cy = size / 2;
        const r = 78;
        const circumference = 2 * Math.PI * r;
        const pct = kpis.eficienciaResolucion;
        const strokeDashoffset = circumference - (pct / 100) * circumference;
        const effColor = getEfficiencyColor(pct);

        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ position: 'relative', width: size, height: size }}>
                    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                        <circle
                            cx={cx}
                            cy={cy}
                            r={r}
                            fill="none"
                            stroke={isDarkMode ? '#334155' : '#e2e8f0'}
                            strokeWidth="18"
                        />
                        <circle
                            cx={cx}
                            cy={cy}
                            r={r}
                            fill="none"
                            stroke={effColor}
                            strokeWidth="18"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            transform={`rotate(-90 ${cx} ${cy})`}
                            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                        />
                        <text
                            x={cx}
                            y={cy - 4}
                            textAnchor="middle"
                            fill={colores.texto}
                            fontSize="30"
                            fontWeight="800"
                        >
                            {pct}%
                        </text>
                        <text
                            x={cx}
                            y={cy + 18}
                            textAnchor="middle"
                            fill={effColor}
                            fontSize="11"
                            fontWeight="700"
                        >
                            {getEfficiencyLabel(pct).toUpperCase()}
                        </text>
                        <text
                            x={cx}
                            y={cy + 34}
                            textAnchor="middle"
                            fill={colores.textoMuted}
                            fontSize="10"
                        >
                            {kpis.resueltosCerrados} de {kpis.total} resueltos
                        </text>
                    </svg>
                </div>

                {/* Desglose por Estado */}
                <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: colores.texto, marginBottom: '2px' }}>
                        Desglose por Estado Actual
                    </div>
                    {estadoBreakdown.length === 0 ? (
                        <p style={{ fontSize: '13px', color: colores.textoMuted, margin: 0 }}>Sin tickets en este periodo</p>
                    ) : (
                        estadoBreakdown.map((item, idx) => {
                            const itemPct = kpis.total > 0 ? Math.round((item.value / kpis.total) * 100) : 0;
                            return (
                                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colores.texto, fontWeight: '500' }}>
                                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color, display: 'inline-block' }} />
                                            {item.label}
                                        </span>
                                        <span style={{ fontWeight: '700', color: colores.texto }}>
                                            {item.value} <span style={{ color: colores.textoMuted, fontWeight: '400' }}>({itemPct}%)</span>
                                        </span>
                                    </div>
                                    <div style={{
                                        width: '100%',
                                        height: '6px',
                                        backgroundColor: isDarkMode ? '#334155' : '#e5e7eb',
                                        borderRadius: '999px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${itemPct}%`,
                                            height: '100%',
                                            backgroundColor: item.color,
                                            borderRadius: '999px',
                                            transition: 'width 0.4s ease'
                                        }} />
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {/* Indicador adicional: Cobertura de 1ra respuesta */}
                    <div style={{
                        marginTop: '8px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
                        border: `1px solid ${colores.borde}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '12px'
                    }}>
                        <span style={{ color: colores.textoMuted }}>⚡ Tasa de 1ra Respuesta:</span>
                        <strong style={{ color: '#3b82f6', fontSize: '13px' }}>
                            {kpis.tasaRespuesta}% ({kpis.countPrimeraResp}/{kpis.total})
                        </strong>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div style={{
                backgroundColor: colores.tarjeta,
                border: `1px solid ${colores.borde}`,
                borderRadius: '12px',
                padding: '48px 24px',
                textAlign: 'center',
                color: colores.textoMuted
            }}>
                <p style={{ fontSize: '15px', fontWeight: '500', margin: 0 }}>📊 Calculando estadísticas y métricas de la agencia...</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* ============================================
                BARRA DE FILTROS (FECHAS, ÁREA, PRIORIDAD, ESTADO, AGENTE)
            ============================================ */}
            <div style={{
                backgroundColor: colores.tarjeta,
                border: `1px solid ${colores.borde}`,
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
                {/* Botones rápidos de periodo */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: colores.textoMuted, marginRight: '4px' }}>
                        📅 Periodo:
                    </span>
                    {[
                        { id: 'all', label: 'Todo' },
                        { id: 'last7', label: '7 días' },
                        { id: 'last30', label: '30 días' },
                        { id: 'thisMonth', label: 'Este mes' },
                        { id: 'thisYear', label: 'Este año' },
                        { id: 'custom', label: 'Personalizado' }
                    ].map(preset => (
                        <button
                            key={preset.id}
                            onClick={() => setDatePreset(preset.id)}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: datePreset === preset.id ? `1px solid ${colores.primario}` : `1px solid ${colores.borde}`,
                                backgroundColor: datePreset === preset.id ? colores.primario : 'transparent',
                                color: datePreset === preset.id ? '#ffffff' : colores.texto,
                                fontSize: '12px',
                                fontWeight: datePreset === preset.id ? '600' : '500',
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                            }}
                        >
                            {preset.label}
                        </button>
                    ))}

                    {datePreset === 'custom' && (
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginLeft: '4px' }}>
                            <input
                                type="date"
                                value={fechaInicio}
                                onChange={e => setFechaInicio(e.target.value)}
                                style={{ padding: '5px 8px', borderRadius: '6px', fontSize: '12px' }}
                            />
                            <span style={{ fontSize: '12px', color: colores.textoMuted }}>a</span>
                            <input
                                type="date"
                                value={fechaFin}
                                onChange={e => setFechaFin(e.target.value)}
                                style={{ padding: '5px 8px', borderRadius: '6px', fontSize: '12px' }}
                            />
                        </div>
                    )}
                </div>

                {/* Selectores de Área, Prioridad, Agente */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    <select
                        value={filterArea}
                        onChange={e => setFilterArea(e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                    >
                        <option value="all">🏢 Todas las Áreas</option>
                        {uniqueAreas.map(a => (
                            <option key={a} value={a}>{a}</option>
                        ))}
                    </select>

                    <select
                        value={filterPrioridad}
                        onChange={e => setFilterPrioridad(e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                    >
                        <option value="all">⚡ Todas las Prioridades</option>
                        <option value="baja">Baja</option>
                        <option value="media">Media</option>
                        <option value="alta">Alta</option>
                        <option value="critica">Crítica</option>
                    </select>

                    <select
                        value={filterAgente}
                        onChange={e => setFilterAgente(e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                    >
                        <option value="all">👤 Todos los Agentes</option>
                        {uniqueAgentes.map(ag => (
                            <option key={ag} value={ag}>{ag}</option>
                        ))}
                    </select>

                    {(filterArea !== 'all' || filterPrioridad !== 'all' || filterEstado !== 'all' || filterAgente !== 'all' || datePreset !== 'all') && (
                        <button
                            onClick={() => {
                                setFilterArea('all');
                                setFilterPrioridad('all');
                                setFilterEstado('all');
                                setFilterAgente('all');
                                setDatePreset('all');
                            }}
                            style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: `1px solid ${colores.borde}`,
                                backgroundColor: colores.hoverBg,
                                color: colores.texto,
                                fontSize: '12px',
                                cursor: 'pointer',
                                fontWeight: '500'
                            }}
                        >
                            🔄 Limpiar
                        </button>
                    )}
                </div>
            </div>

            {/* ============================================
                TARJETAS DE INDICADORES CLAVE (4 KPIS PRINCIPALES)
            ============================================ */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                gap: '16px'
            }}>
                {/* 1. Total Tickets y Áreas */}
                <div style={{
                    backgroundColor: colores.tarjeta,
                    border: `1px solid ${colores.borde}`,
                    borderTop: `4px solid ${colores.primario}`,
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: colores.textoMuted, textTransform: 'uppercase' }}>
                            Total de Tickets
                        </span>
                        <span style={{ fontSize: '20px' }}>🎫</span>
                    </div>
                    <p style={{ fontSize: '32px', fontWeight: '800', color: colores.texto, margin: '8px 0 4px 0' }}>
                        {kpis.total}
                    </p>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: colores.textoMuted }}>
                        <span>🏢 <strong>{areaStats.length}</strong> áreas activas</span>
                        <span>•</span>
                        <span>⏳ <strong>{kpis.activos}</strong> abiertos</span>
                    </div>
                </div>

                {/* 2. Tiempo Promedio en Primera Respuesta */}
                <div style={{
                    backgroundColor: colores.tarjeta,
                    border: `1px solid ${colores.borde}`,
                    borderTop: '4px solid #3b82f6',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: colores.textoMuted, textTransform: 'uppercase' }}>
                            Tiempo 1ra Respuesta
                        </span>
                        <span style={{ fontSize: '20px' }}>⚡</span>
                    </div>
                    <p style={{ fontSize: '30px', fontWeight: '800', color: '#3b82f6', margin: '8px 0 4px 0' }}>
                        {kpis.avgPrimeraRespFormatted}
                    </p>
                    <div style={{ fontSize: '12px', color: colores.textoMuted }}>
                        {kpis.countPrimeraResp > 0 ? (
                            <span>Mín: <strong>{kpis.minPrimeraRespFormatted}</strong> • Máx: <strong>{kpis.maxPrimeraRespFormatted}</strong> ({kpis.countPrimeraResp} atendidos)</span>
                        ) : (
                            <span>Aún sin respuestas registradas</span>
                        )}
                    </div>
                </div>

                {/* 3. Tiempo Promedio en Cerrar / Resolver Ticket */}
                <div style={{
                    backgroundColor: colores.tarjeta,
                    border: `1px solid ${colores.borde}`,
                    borderTop: '4px solid #8b5cf6',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: colores.textoMuted, textTransform: 'uppercase' }}>
                            Tiempo Cierre / Resolución
                        </span>
                        <span style={{ fontSize: '20px' }}>⏱️</span>
                    </div>
                    <p style={{ fontSize: '30px', fontWeight: '800', color: '#8b5cf6', margin: '8px 0 4px 0' }}>
                        {kpis.avgResolucionFormatted}
                    </p>
                    <div style={{ fontSize: '12px', color: colores.textoMuted }}>
                        {kpis.countResolucion > 0 ? (
                            <span>Mín: <strong>{kpis.minResolucionFormatted}</strong> • Máx: <strong>{kpis.maxResolucionFormatted}</strong> ({kpis.countResolucion} cerrados/resueltos)</span>
                        ) : (
                            <span>Aún sin tickets cerrados o resueltos</span>
                        )}
                    </div>
                </div>

                {/* 4. Porcentaje de Eficiencia */}
                <div style={{
                    backgroundColor: colores.tarjeta,
                    border: `1px solid ${colores.borde}`,
                    borderTop: `4px solid ${getEfficiencyColor(kpis.eficienciaResolucion)}`,
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: colores.textoMuted, textTransform: 'uppercase' }}>
                            Porcentaje de Eficiencia
                        </span>
                        <span style={{ fontSize: '20px' }}>🎯</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', margin: '8px 0 6px 0' }}>
                        <span style={{ fontSize: '32px', fontWeight: '800', color: getEfficiencyColor(kpis.eficienciaResolucion) }}>
                            {kpis.eficienciaResolucion}%
                        </span>
                        <span style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '2px 8px',
                            borderRadius: '999px',
                            backgroundColor: `${getEfficiencyColor(kpis.eficienciaResolucion)}20`,
                            color: getEfficiencyColor(kpis.eficienciaResolucion)
                        }}>
                            {getEfficiencyLabel(kpis.eficienciaResolucion)}
                        </span>
                    </div>
                    <div style={{
                        width: '100%',
                        height: '8px',
                        backgroundColor: isDarkMode ? '#334155' : '#e5e7eb',
                        borderRadius: '999px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${kpis.eficienciaResolucion}%`,
                            height: '100%',
                            backgroundColor: getEfficiencyColor(kpis.eficienciaResolucion),
                            transition: 'width 0.5s ease'
                        }} />
                    </div>
                </div>
            </div>

            {/* ============================================
                FILA 1 DE GRÁFICAS: TICKETS POR ÁREA & PORCENTAJE DE EFICIENCIA
            ============================================ */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
                gap: '20px'
            }}>
                {/* GRÁFICA 1: CUÁNTOS TICKETS POR ÁREA */}
                <div style={{
                    backgroundColor: colores.tarjeta,
                    border: `1px solid ${colores.borde}`,
                    borderRadius: '12px',
                    padding: '22px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                            <h3 style={{ fontSize: '16px', fontWeight: '700', color: colores.texto, margin: 0 }}>
                                🏢 Tickets por Área
                            </h3>
                            <p style={{ fontSize: '12px', color: colores.textoMuted, margin: '2px 0 0 0' }}>
                                Volumen de solicitudes generadas por cada departamento
                            </p>
                        </div>
                        <span style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9',
                            color: colores.primario
                        }}>
                            {areaStats.length} {areaStats.length === 1 ? 'Área' : 'Áreas'}
                        </span>
                    </div>

                    {areaStats.length === 0 ? (
                        <div style={{ padding: '40px 0', textAlign: 'center', color: colores.textoMuted, fontSize: '13px' }}>
                            No hay tickets registrados para mostrar por área.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {areaStats.map((item, idx) => {
                                const maxCount = Math.max(...areaStats.map(a => a.total), 1);
                                const barWidthPct = Math.max((item.total / maxCount) * 100, 4);
                                const barColor = areaPalette[idx % areaPalette.length];

                                return (
                                    <div key={item.area} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                                            <span style={{ fontWeight: '600', color: colores.texto, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{
                                                    width: '10px',
                                                    height: '10px',
                                                    borderRadius: '3px',
                                                    backgroundColor: barColor,
                                                    display: 'inline-block'
                                                }} />
                                                {item.area}
                                            </span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ fontSize: '11px', color: colores.textoMuted }}>
                                                    ✅ {item.resueltos} resueltos • ⏳ {item.activos} activos
                                                </span>
                                                <span style={{
                                                    fontWeight: '800',
                                                    color: barColor,
                                                    backgroundColor: `${barColor}18`,
                                                    padding: '2px 8px',
                                                    borderRadius: '6px',
                                                    fontSize: '12px'
                                                }}>
                                                    {item.total} ({item.porcentajeDelTotal}%)
                                                </span>
                                            </div>
                                        </div>

                                        <div style={{
                                            width: '100%',
                                            height: '12px',
                                            backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9',
                                            borderRadius: '999px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                width: `${barWidthPct}%`,
                                                height: '100%',
                                                backgroundColor: barColor,
                                                borderRadius: '999px',
                                                transition: 'width 0.5s ease'
                                            }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* GRÁFICA 2: PORCENTAJE DE EFICIENCIA Y ESTADOS */}
                <div style={{
                    backgroundColor: colores.tarjeta,
                    border: `1px solid ${colores.borde}`,
                    borderRadius: '12px',
                    padding: '22px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                }}>
                    <div style={{ marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', color: colores.texto, margin: 0 }}>
                            🎯 Índice de Eficiencia y Estados
                        </h3>
                        <p style={{ fontSize: '12px', color: colores.textoMuted, margin: '2px 0 0 0' }}>
                            Porcentaje de tickets resueltos/cerrados respecto al total recibido
                        </p>
                    </div>
                    {renderEfficiencyDonut()}
                </div>
            </div>

            {/* ============================================
                FILA 2 DE GRÁFICAS: TIEMPO EN PRIMERA RESPUESTA & TIEMPO EN CERRAR/RESOLVER
            ============================================ */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
                gap: '20px'
            }}>
                {/* GRÁFICA 3: TIEMPO EN LA PRIMERA RESPUESTA */}
                <div style={{
                    backgroundColor: colores.tarjeta,
                    border: `1px solid ${colores.borde}`,
                    borderRadius: '12px',
                    padding: '22px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div>
                            <h3 style={{ fontSize: '16px', fontWeight: '700', color: colores.texto, margin: 0 }}>
                                ⚡ Tiempo en la Primera Respuesta
                            </h3>
                            <p style={{ fontSize: '12px', color: colores.textoMuted, margin: '2px 0 0 0' }}>
                                Distribución por velocidad de atención inicial y promedio por área
                            </p>
                        </div>
                        <span style={{
                            fontSize: '13px',
                            fontWeight: '800',
                            color: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.12)',
                            padding: '4px 10px',
                            borderRadius: '6px'
                        }}>
                            Prom: {kpis.avgPrimeraRespFormatted}
                        </span>
                    </div>

                    {/* Gráfica de columnas SVG por rango de tiempo de 1ra respuesta */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, 1fr)',
                        gap: '10px',
                        alignItems: 'end',
                        height: '150px',
                        padding: '16px 8px 8px 8px',
                        backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
                        borderRadius: '10px',
                        border: `1px solid ${colores.borde}`,
                        marginBottom: '16px'
                    }}>
                        {firstResponseBuckets.map((b, i) => {
                            const maxBucket = Math.max(...firstResponseBuckets.map(x => x.count), 1);
                            const barHeightPct = b.count > 0 ? Math.max((b.count / maxBucket) * 85, 12) : 4;
                            return (
                                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '6px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: '800', color: b.count > 0 ? colores.texto : colores.textoMuted }}>
                                        {b.count}
                                    </span>
                                    <div style={{
                                        width: '100%',
                                        maxWidth: '42px',
                                        height: `${barHeightPct}%`,
                                        backgroundColor: b.color,
                                        borderRadius: '6px 6px 3px 3px',
                                        opacity: b.count > 0 ? 1 : 0.25,
                                        transition: 'height 0.4s ease'
                                    }} />
                                    <span style={{ fontSize: '10px', fontWeight: '600', color: colores.textoMuted, textAlign: 'center', lineHeight: 1.1 }}>
                                        {b.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Tiempo de 1ra Respuesta por Área */}
                    <div style={{ fontSize: '12px', fontWeight: '700', color: colores.textoMuted, marginBottom: '8px' }}>
                        PROMEDIO DE 1RA RESPUESTA POR ÁREA:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '170px', overflowY: 'auto' }}>
                        {areaStats.map((a, idx) => (
                            <div key={idx} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '7px 10px',
                                borderRadius: '6px',
                                backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
                                fontSize: '12px'
                            }}>
                                <span style={{ fontWeight: '600', color: colores.texto }}>{a.area}</span>
                                <span style={{ fontWeight: '700', color: a.avgRespMin !== null ? '#3b82f6' : colores.textoMuted }}>
                                    {formatMinutes(a.avgRespMin)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* GRÁFICA 4: TIEMPO EN CERRAR / RESOLVER EL TICKET */}
                <div style={{
                    backgroundColor: colores.tarjeta,
                    border: `1px solid ${colores.borde}`,
                    borderRadius: '12px',
                    padding: '22px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div>
                            <h3 style={{ fontSize: '16px', fontWeight: '700', color: colores.texto, margin: 0 }}>
                                ⏱️ Tiempo en Cerrar / Resolver Ticket
                            </h3>
                            <p style={{ fontSize: '12px', color: colores.textoMuted, margin: '2px 0 0 0' }}>
                                Distribución de tiempos de solución total y promedio por área
                            </p>
                        </div>
                        <span style={{
                            fontSize: '13px',
                            fontWeight: '800',
                            color: '#8b5cf6',
                            backgroundColor: 'rgba(139, 92, 246, 0.12)',
                            padding: '4px 10px',
                            borderRadius: '6px'
                        }}>
                            Prom: {kpis.avgResolucionFormatted}
                        </span>
                    </div>

                    {/* Gráfica de columnas por rango de resolución */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, 1fr)',
                        gap: '10px',
                        alignItems: 'end',
                        height: '150px',
                        padding: '16px 8px 8px 8px',
                        backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
                        borderRadius: '10px',
                        border: `1px solid ${colores.borde}`,
                        marginBottom: '16px'
                    }}>
                        {resolutionBuckets.map((b, i) => {
                            const maxBucket = Math.max(...resolutionBuckets.map(x => x.count), 1);
                            const barHeightPct = b.count > 0 ? Math.max((b.count / maxBucket) * 85, 12) : 4;
                            return (
                                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '6px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: '800', color: b.count > 0 ? colores.texto : colores.textoMuted }}>
                                        {b.count}
                                    </span>
                                    <div style={{
                                        width: '100%',
                                        maxWidth: '42px',
                                        height: `${barHeightPct}%`,
                                        backgroundColor: b.color,
                                        borderRadius: '6px 6px 3px 3px',
                                        opacity: b.count > 0 ? 1 : 0.25,
                                        transition: 'height 0.4s ease'
                                    }} />
                                    <span style={{ fontSize: '10px', fontWeight: '600', color: colores.textoMuted, textAlign: 'center', lineHeight: 1.1 }}>
                                        {b.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Tiempo de Cierre/Resolución por Área */}
                    <div style={{ fontSize: '12px', fontWeight: '700', color: colores.textoMuted, marginBottom: '8px' }}>
                        PROMEDIO DE CIERRE / RESOLUCIÓN POR ÁREA:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '170px', overflowY: 'auto' }}>
                        {areaStats.map((a, idx) => (
                            <div key={idx} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '7px 10px',
                                borderRadius: '6px',
                                backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
                                fontSize: '12px'
                            }}>
                                <span style={{ fontWeight: '600', color: colores.texto }}>{a.area}</span>
                                <span style={{ fontWeight: '700', color: a.avgResMin !== null ? '#8b5cf6' : colores.textoMuted }}>
                                    {formatMinutes(a.avgResMin)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ============================================
                TABLA DETALLADA DE EFICIENCIA Y TIEMPOS (POR ÁREA Y POR AGENTE)
            ============================================ */}
            <div style={{
                backgroundColor: colores.tarjeta,
                border: `1px solid ${colores.borde}`,
                borderRadius: '12px',
                padding: '22px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginBottom: '16px'
                }}>
                    <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', color: colores.texto, margin: 0 }}>
                            📋 Resumen Detallado de Eficiencia y Tiempos de Respuesta
                        </h3>
                        <p style={{ fontSize: '12px', color: colores.textoMuted, margin: '2px 0 0 0' }}>
                            Comparativa completa de volumen, tiempos promedio y porcentaje de eficiencia
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                            onClick={() => setTableMode('area')}
                            style={{
                                padding: '6px 14px',
                                borderRadius: '6px',
                                border: tableMode === 'area' ? `1px solid ${colores.primario}` : `1px solid ${colores.borde}`,
                                backgroundColor: tableMode === 'area' ? colores.primario : 'transparent',
                                color: tableMode === 'area' ? '#ffffff' : colores.texto,
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            🏢 Por Área
                        </button>
                        <button
                            onClick={() => setTableMode('agente')}
                            style={{
                                padding: '6px 14px',
                                borderRadius: '6px',
                                border: tableMode === 'agente' ? `1px solid ${colores.primario}` : `1px solid ${colores.borde}`,
                                backgroundColor: tableMode === 'agente' ? colores.primario : 'transparent',
                                color: tableMode === 'agente' ? '#ffffff' : colores.texto,
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            👤 Por Agente
                        </button>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ borderBottom: `2px solid ${colores.borde}`, textAlign: 'left' }}>
                                <th style={{ padding: '12px 10px', fontWeight: '700' }}>
                                    {tableMode === 'area' ? 'Área / Departamento' : 'Agente Asignado'}
                                </th>
                                <th style={{ padding: '12px 10px', fontWeight: '700', textAlign: 'center' }}>Total Tickets</th>
                                <th style={{ padding: '12px 10px', fontWeight: '700', textAlign: 'center' }}>Resueltos / Cerrados</th>
                                <th style={{ padding: '12px 10px', fontWeight: '700', textAlign: 'center' }}>Pendientes / Activos</th>
                                <th style={{ padding: '12px 10px', fontWeight: '700', textAlign: 'center' }}>⏱️ Prom. 1ra Respuesta</th>
                                <th style={{ padding: '12px 10px', fontWeight: '700', textAlign: 'center' }}>✅ Prom. Cierre / Resolución</th>
                                <th style={{ padding: '12px 10px', fontWeight: '700', minWidth: '170px' }}>🎯 % Eficiencia</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(tableMode === 'area' ? areaStats : agenteStats).length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: colores.textoMuted }}>
                                        Sin datos para mostrar en el rango seleccionado.
                                    </td>
                                </tr>
                            ) : (
                                (tableMode === 'area' ? areaStats : agenteStats).map((row: any, idx: number) => {
                                    const name = tableMode === 'area' ? row.area : row.agente;
                                    const effColor = getEfficiencyColor(row.eficiencia);
                                    return (
                                        <tr key={idx} style={{ borderBottom: `1px solid ${colores.borde}` }}>
                                            <td style={{ padding: '12px 10px', fontWeight: '600' }}>{name}</td>
                                            <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: '700' }}>{row.total}</td>
                                            <td style={{ padding: '12px 10px', textAlign: 'center', color: '#10b981', fontWeight: '700' }}>
                                                {row.resueltos}
                                            </td>
                                            <td style={{ padding: '12px 10px', textAlign: 'center', color: '#f59e0b', fontWeight: '700' }}>
                                                {row.activos}
                                            </td>
                                            <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: '600', color: '#3b82f6' }}>
                                                {formatMinutes(row.avgRespMin)}
                                            </td>
                                            <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: '600', color: '#8b5cf6' }}>
                                                {formatMinutes(row.avgResMin)}
                                            </td>
                                            <td style={{ padding: '12px 10px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{
                                                        flex: 1,
                                                        height: '8px',
                                                        backgroundColor: isDarkMode ? '#0f172a' : '#e5e7eb',
                                                        borderRadius: '999px',
                                                        overflow: 'hidden'
                                                    }}>
                                                        <div style={{
                                                            width: `${row.eficiencia}%`,
                                                            height: '100%',
                                                            backgroundColor: effColor,
                                                            borderRadius: '999px'
                                                        }} />
                                                    </div>
                                                    <span style={{ fontWeight: '800', fontSize: '12px', color: effColor, minWidth: '38px', textAlign: 'right' }}>
                                                        {row.eficiencia}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
