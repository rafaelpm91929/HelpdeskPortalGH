import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api/axios.config';
import toast from 'react-hot-toast';

interface SuperAdminStatsProps {
    agencias: any[];
}

export const SuperAdminStats: React.FC<SuperAdminStatsProps> = ({ agencias }) => {
    // Filtros de búsqueda (API)
    const [selectedAgencia, setSelectedAgencia] = useState<string>('all');
    const [datePreset, setDatePreset] = useState<string>('last30');
    const [fechaInicio, setFechaInicio] = useState<string>('');
    const [fechaFin, setFechaFin] = useState<string>('');

    // Datos crudos cargados del backend
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // Filtros interactivos del cliente (en cascada)
    const [filterArea, setFilterArea] = useState<string>('all');
    const [filterPrioridad, setFilterPrioridad] = useState<string>('all');
    const [filterEstado, setFilterEstado] = useState<string>('all');
    
    // Toggles de agrupación
    const [agrupacionCreados, setAgrupacionCreados] = useState<'dia' | 'semana' | 'mes' | 'ano'>('dia');
    const [agrupacionResueltos, setAgrupacionResueltos] = useState<'dia' | 'semana'>('dia');

    // Estado para Tooltips personalizados en SVG
    const [tooltip, setTooltip] = useState<{
        x: number;
        y: number;
        content: string;
        visible: boolean;
    }>({ x: 0, y: 0, content: '', visible: false });

    // Efecto para calcular fechas según presets
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

    // Función para cargar estadísticas del backend
    const loadStatsData = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (selectedAgencia !== 'all') params.agencia_id = selectedAgencia;
            if (fechaInicio) params.fecha_inicio = `${fechaInicio}T00:00:00`;
            if (fechaFin) params.fecha_fin = `${fechaFin}T23:59:59`;

            const response = await api.get('/tickets/stats', { params });
            if (response.data.success) {
                setTickets(response.data.data);
            } else {
                toast.error('Error al cargar estadísticas');
            }
        } catch (error: any) {
            console.error('Error stats:', error);
            toast.error(error.response?.data?.error || 'Error al conectar con el servidor');
        } finally {
            setLoading(false);
        }
    };

    // Recargar datos cuando cambien los filtros principales de la API
    useEffect(() => {
        loadStatsData();
    }, [selectedAgencia, fechaInicio, fechaFin]);

    // Opciones únicas para filtros locales
    const uniqueAreas = useMemo(() => {
        const list = tickets.map((t) => t.area).filter((a) => a);
        return Array.from(new Set(list));
    }, [tickets]);

    // Aplicar filtros locales (en cascada) para obtener el dataset activo
    const filteredTickets = useMemo(() => {
        return tickets.filter((t) => {
            if (filterArea !== 'all' && t.area !== filterArea) return false;
            if (filterPrioridad !== 'all' && t.prioridad !== filterPrioridad) return false;
            if (filterEstado !== 'all' && t.estado !== filterEstado) return false;
            return true;
        });
    }, [tickets, filterArea, filterPrioridad, filterEstado]);

    // ============================================
    // CÁLCULO DE MÉTRICAS & INDICADORES (KPIs)
    // ============================================
    const kpis = useMemo(() => {
        let totalRespuestaMin = 0;
        let countRespuesta = 0;
        let totalResolucionMin = 0;
        let countResolucion = 0;

        filteredTickets.forEach((t) => {
            // Tiempo de respuesta
            if (t.fecha_primera_respuesta) {
                const creacion = new Date(t.fecha_creacion).getTime();
                const respuesta = new Date(t.fecha_primera_respuesta).getTime();
                const diff = (respuesta - creacion) / 60000; // en minutos
                if (diff >= 0) {
                    totalRespuestaMin += diff;
                    countRespuesta++;
                }
            }

            // Tiempo de resolución
            const fechaFinTicket = t.fecha_resolucion || t.fecha_cierre;
            if (fechaFinTicket && (t.estado === 'resuelto' || t.estado === 'cerrado')) {
                const creacion = new Date(t.fecha_creacion).getTime();
                const resolucion = new Date(fechaFinTicket).getTime();
                const diff = (resolucion - creacion) / 60000; // en minutos
                if (diff >= 0) {
                    totalResolucionMin += diff;
                    countResolucion++;
                }
            }
        });

        const formatTiempo = (totalMinutos: number) => {
            if (totalMinutos <= 0) return 'N/A';
            const horas = Math.floor(totalMinutos / 60);
            const minutos = Math.round(totalMinutos % 60);
            if (horas > 24) {
                const dias = Math.floor(horas / 24);
                const hrsRestantes = horas % 24;
                return `${dias}d ${hrsRestantes}h ${minutos}m`;
            }
            return horas > 0 ? `${horas}h ${minutos}m` : `${minutos}m`;
        };

        return {
            avgPrimeraRespuesta: countRespuesta > 0 ? formatTiempo(totalRespuestaMin / countRespuesta) : 'Sin datos',
            avgResolucion: countResolucion > 0 ? formatTiempo(totalResolucionMin / countResolucion) : 'Sin datos',
            totalCount: filteredTickets.length
        };
    }, [filteredTickets]);

    // ============================================
    // 1. TICKETS CREADOS POR DÍA/SEMANA/MES/AÑO
    // ============================================
    const creadosChartData = useMemo(() => {
        const groups: { [key: string]: number } = {};

        filteredTickets.forEach((t) => {
            const date = new Date(t.fecha_creacion);
            if (isNaN(date.getTime())) return;

            let key = '';
            if (agrupacionCreados === 'dia') {
                key = date.toISOString().split('T')[0];
            } else if (agrupacionCreados === 'semana') {
                // Obtener inicio de la semana (Lunes)
                const day = date.getDay();
                const diff = date.getDate() - day + (day === 0 ? -6 : 1);
                const monday = new Date(date.setDate(diff));
                key = `Sem. ${monday.toISOString().split('T')[0].substring(5)}`;
            } else if (agrupacionCreados === 'mes') {
                key = date.toISOString().substring(0, 7); // YYYY-MM
            } else {
                key = date.getFullYear().toString(); // YYYY
            }

            groups[key] = (groups[key] || 0) + 1;
        });

        // Ordenar claves cronológicamente
        const sortedKeys = Object.keys(groups).sort();
        return sortedKeys.map((key) => ({
            label: key,
            value: groups[key]
        }));
    }, [filteredTickets, agrupacionCreados]);

    // ============================================
    // 2. TICKETS RESUELTOS POR DÍA/SEMANA
    // ============================================
    const resueltosChartData = useMemo(() => {
        const groups: { [key: string]: number } = {};

        filteredTickets.forEach((t) => {
            const fechaFinTicket = t.fecha_resolucion || t.fecha_cierre;
            if (!fechaFinTicket) return;
            const date = new Date(fechaFinTicket);
            if (isNaN(date.getTime())) return;

            let key = '';
            if (agrupacionResueltos === 'dia') {
                key = date.toISOString().split('T')[0];
            } else {
                // Semana (Lunes)
                const day = date.getDay();
                const diff = date.getDate() - day + (day === 0 ? -6 : 1);
                const monday = new Date(date.setDate(diff));
                key = `Sem. ${monday.toISOString().split('T')[0].substring(5)}`;
            }

            groups[key] = (groups[key] || 0) + 1;
        });

        const sortedKeys = Object.keys(groups).sort();
        return sortedKeys.map((key) => ({
            label: key,
            value: groups[key]
        }));
    }, [filteredTickets, agrupacionResueltos]);

    // ============================================
    // 3. TICKETS ABIERTOS VS CERRADOS
    // ============================================
    const abiertosVsCerradosData = useMemo(() => {
        let abiertos = 0;
        let cerrados = 0;

        filteredTickets.forEach((t) => {
            if (['pendiente', 'abierto', 'en proceso'].includes(t.estado)) {
                abiertos++;
            } else {
                cerrados++;
            }
        });

        return [
            { label: 'Abiertos (Activos)', value: abiertos, color: '#3b82f6' },
            { label: 'Cerrados/Resueltos', value: cerrados, color: '#10b981' }
        ];
    }, [filteredTickets]);

    // ============================================
    // 4. ESTADO DE TICKETS (DONUT)
    // ============================================
    const estadoChartData = useMemo(() => {
        const counts: { [key: string]: number } = {
            'pendiente': 0,
            'abierto': 0,
            'en proceso': 0,
            'resuelto': 0,
            'cerrado': 0
        };

        filteredTickets.forEach((t) => {
            if (counts[t.estado] !== undefined) {
                counts[t.estado]++;
            }
        });

        const colorMap: { [key: string]: string } = {
            'pendiente': '#ef4444',
            'abierto': '#f59e0b',
            'en proceso': '#3b82f6',
            'resuelto': '#10b981',
            'cerrado': '#64748b'
        };

        return Object.keys(counts).map((key) => ({
            label: key.toUpperCase(),
            value: counts[key],
            color: colorMap[key] || '#94a3b8'
        })).filter(c => c.value > 0);
    }, [filteredTickets]);

    // ============================================
    // 5. TICKETS POR PRIORIDAD
    // ============================================
    const prioridadChartData = useMemo(() => {
        const counts: { [key: string]: number } = {
            'baja': 0,
            'media': 0,
            'alta': 0,
            'critica': 0
        };

        filteredTickets.forEach((t) => {
            const p = t.prioridad?.toLowerCase();
            if (counts[p] !== undefined) {
                counts[p]++;
            }
        });

        return [
            { label: 'Baja', value: counts['baja'], color: '#a7f3d0' },
            { label: 'Media', value: counts['media'], color: '#fef08a' },
            { label: 'Alta', value: counts['alta'], color: '#f97316' },
            { label: 'Crítica', value: counts['critica'], color: '#dc2626' }
        ];
    }, [filteredTickets]);

    // ============================================
    // 6. TICKETS POR AREA (BARRAS HORIZONTALES)
    // ============================================
    const areaChartData = useMemo(() => {
        const groups: { [key: string]: number } = {};

        filteredTickets.forEach((t) => {
            const area = t.area || 'Sin Área';
            groups[area] = (groups[area] || 0) + 1;
        });

        return Object.keys(groups)
            .map((key) => ({ label: key, value: groups[key] }))
            .sort((a, b) => b.value - a.value);
    }, [filteredTickets]);

    // ============================================
    // 7. TICKETS POR AGENTE
    // ============================================
    const agenteChartData = useMemo(() => {
        const groups: { [key: string]: number } = {};

        filteredTickets.forEach((t) => {
            const nombre = t.agente_nombre
                ? `${t.agente_nombre} ${t.agente_apellido || ''}`.trim()
                : 'Sin Asignar';
            groups[nombre] = (groups[nombre] || 0) + 1;
        });

        return Object.keys(groups)
            .map((key) => ({ label: key, value: groups[key] }))
            .sort((a, b) => b.value - a.value);
    }, [filteredTickets]);

    // ============================================
    // 8. TENDENCIA POR HORA DEL DÍA (HEATMAP 7x24)
    // ============================================
    const heatmapData = useMemo(() => {
        // Matriz de 7 filas (Lunes=0, Domingo=6) por 24 columnas (0-23 horas)
        const matrix = Array.from({ length: 7 }, () => Array(24).fill(0));
        let maxCount = 0;

        filteredTickets.forEach((t) => {
            const date = new Date(t.fecha_creacion);
            if (isNaN(date.getTime())) return;

            let day = date.getDay(); // Domingo=0, Lunes=1...
            // Convertir a Lunes=0 ... Domingo=6
            day = day === 0 ? 6 : day - 1;
            const hour = date.getHours();

            matrix[day][hour]++;
            if (matrix[day][hour] > maxCount) {
                maxCount = matrix[day][hour];
            }
        });

        return { matrix, maxCount };
    }, [filteredTickets]);

    // ============================================
    // 9. ANTIGÜEDAD DE TICKETS ABIERTOS (HISTOGRAMA)
    // ============================================
    const antiguedadData = useMemo(() => {
        const ranges = {
            '0-2 días': 0,
            '3-5 días': 0,
            '6-10 días': 0,
            '11-20 días': 0,
            '21+ días': 0
        };

        const ahora = new Date().getTime();

        filteredTickets.forEach((t) => {
            if (!['pendiente', 'abierto', 'en proceso'].includes(t.estado)) return;

            const creacion = new Date(t.fecha_creacion).getTime();
            const diffDays = (ahora - creacion) / (1000 * 60 * 60 * 24);

            if (diffDays <= 2) {
                ranges['0-2 días']++;
            } else if (diffDays <= 5) {
                ranges['3-5 días']++;
            } else if (diffDays <= 10) {
                ranges['6-10 días']++;
            } else if (diffDays <= 20) {
                ranges['11-20 días']++;
            } else {
                ranges['21+ días']++;
            }
        });

        return Object.keys(ranges).map((key) => ({
            label: key,
            value: ranges[key as keyof typeof ranges],
            color: key === '21+ días' ? '#ef4444' : key === '11-20 días' ? '#f97316' : '#3b82f6'
        }));
    }, [filteredTickets]);

    // ============================================
    // COMPONENTES GRÁFICOS SVG NATIVOS
    // ============================================

    // Gráfico de Línea SVG
    const SVGLineChart: React.FC<{
        data: { label: string; value: number }[];
        color: string;
        gradientId: string;
    }> = ({ data, color, gradientId }) => {
        const width = 600;
        const height = 280;
        const paddingLeft = 50;
        const paddingRight = 20;
        const paddingTop = 30;
        const paddingBottom = 40;

        if (data.length === 0) {
            return (
                <div style={{ height: height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                    Sin datos en este rango
                </div>
            );
        }

        const maxVal = Math.max(...data.map(d => d.value), 5);
        const yMax = Math.ceil(maxVal * 1.15); // Añadir espacio arriba

        const points = data.map((d, index) => {
            const x = paddingLeft + (index / Math.max(data.length - 1, 1)) * (width - paddingLeft - paddingRight);
            const y = height - paddingBottom - (d.value / yMax) * (height - paddingTop - paddingBottom);
            return { x, y, label: d.label, value: d.value };
        });

        // Crear la cadena del path de la línea
        let linePath = '';
        points.forEach((p, idx) => {
            if (idx === 0) {
                linePath += `M ${p.x} ${p.y}`;
            } else {
                // Curva Bezier suave para WOW factor
                const prev = points[idx - 1];
                const cpX1 = prev.x + (p.x - prev.x) / 2;
                const cpY1 = prev.y;
                const cpX2 = prev.x + (p.x - prev.x) / 2;
                const cpY2 = p.y;
                linePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p.x} ${p.y}`;
            }
        });

        // Path del área rellena degradada
        const areaPath = data.length > 0 
            ? `${linePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z` 
            : '';

        // Líneas de cuadrícula e indicadores del eje Y
        const yTicks = 4;
        const yGridLines = Array.from({ length: yTicks }, (_, idx) => {
            const val = Math.round((yMax / (yTicks - 1)) * idx);
            const y = height - paddingBottom - (val / yMax) * (height - paddingTop - paddingBottom);
            return { y, val };
        });

        return (
            <div style={{ position: 'relative' }}>
                <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ overflow: 'visible' }}>
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
                        </linearGradient>
                    </defs>

                    {/* Líneas horizontales de cuadrícula */}
                    {yGridLines.map((line, idx) => (
                        <g key={idx}>
                            <line 
                                x1={paddingLeft} 
                                y1={line.y} 
                                x2={width - paddingRight} 
                                y2={line.y} 
                                stroke="#f1f5f9" 
                                strokeWidth="1" 
                            />
                            <text 
                                x={paddingLeft - 10} 
                                y={line.y + 4} 
                                fill="#94a3b8" 
                                fontSize="11" 
                                textAnchor="end"
                                fontFamily="system-ui"
                            >
                                {line.val}
                            </text>
                        </g>
                    ))}

                    {/* Área degradada */}
                    {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}

                    {/* Línea principal */}
                    {linePath && (
                        <path 
                            d={linePath} 
                            fill="none" 
                            stroke={color} 
                            strokeWidth="3" 
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dasharray 0.5s ease-in-out' }}
                        />
                    )}

                    {/* Puntos interactivos con Tooltip */}
                    {points.map((p, idx) => (
                        <circle 
                            key={idx} 
                            cx={p.x} 
                            cy={p.y} 
                            r="5" 
                            fill="white" 
                            stroke={color} 
                            strokeWidth="3" 
                            style={{ cursor: 'pointer', transition: 'all 0.1s' }}
                            onMouseEnter={(e) => {
                                e.currentTarget.setAttribute('r', '7');
                                setTooltip({
                                    x: p.x,
                                    y: p.y - 12,
                                    content: `${p.label}: ${p.value} tickets`,
                                    visible: true
                                });
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.setAttribute('r', '5');
                                setTooltip(prev => ({ ...prev, visible: false }));
                            }}
                        />
                    ))}

                    {/* Etiquetas Eje X (Limitadas si son demasiadas para que no se empalmen) */}
                    {points.filter((_, idx) => {
                        if (points.length <= 10) return true;
                        if (points.length <= 20) return idx % 2 === 0;
                        return idx % 4 === 0 || idx === points.length - 1;
                    }).map((p, idx) => (
                        <text 
                            key={idx} 
                            x={p.x} 
                            y={height - paddingBottom + 20} 
                            fill="#64748b" 
                            fontSize="10" 
                            textAnchor="middle"
                            fontFamily="system-ui"
                        >
                            {p.label}
                        </text>
                    ))}
                </svg>

                {/* Tooltip flotante */}
                {tooltip.visible && (
                    <div style={{
                        position: 'absolute',
                        left: `${(tooltip.x / width) * 100}%`,
                        top: `${(tooltip.y / height) * 100}%`,
                        transform: 'translate(-50%, -100%)',
                        backgroundColor: '#0f172a',
                        color: 'white',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontFamily: 'system-ui',
                        fontWeight: '600',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                        pointerEvents: 'none',
                        zIndex: 10,
                        whiteSpace: 'nowrap'
                    }}>
                        {tooltip.content}
                    </div>
                )}
            </div>
        );
    };

    // Gráfico de Barras SVG
    const SVGBarChart: React.FC<{
        data: { label: string; value: number; color?: string }[];
        defaultColor: string;
    }> = ({ data, defaultColor }) => {
        const width = 600;
        const height = 280;
        const paddingLeft = 50;
        const paddingRight = 20;
        const paddingTop = 30;
        const paddingBottom = 40;

        if (data.length === 0 || data.every(d => d.value === 0)) {
            return (
                <div style={{ height: height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                    Sin datos en este rango
                </div>
            );
        }

        const maxVal = Math.max(...data.map(d => d.value), 5);
        const yMax = Math.ceil(maxVal * 1.1);

        const availableWidth = width - paddingLeft - paddingRight;
        const barSpacing = 16;
        const barWidth = Math.max((availableWidth - (data.length - 1) * barSpacing) / data.length, 10);

        // Gridlines
        const yTicks = 4;
        const yGridLines = Array.from({ length: yTicks }, (_, idx) => {
            const val = Math.round((yMax / (yTicks - 1)) * idx);
            const y = height - paddingBottom - (val / yMax) * (height - paddingTop - paddingBottom);
            return { y, val };
        });

        return (
            <div style={{ position: 'relative' }}>
                <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ overflow: 'visible' }}>
                    {/* Líneas horizontales de cuadrícula */}
                    {yGridLines.map((line, idx) => (
                        <g key={idx}>
                            <line 
                                x1={paddingLeft} 
                                y1={line.y} 
                                x2={width - paddingRight} 
                                y2={line.y} 
                                stroke="#f1f5f9" 
                                strokeWidth="1" 
                            />
                            <text 
                                x={paddingLeft - 10} 
                                y={line.y + 4} 
                                fill="#94a3b8" 
                                fontSize="11" 
                                textAnchor="end"
                                fontFamily="system-ui"
                            >
                                {line.val}
                            </text>
                        </g>
                    ))}

                    {/* Renderizado de barras */}
                    {data.map((d, index) => {
                        const x = paddingLeft + index * (barWidth + barSpacing) + barSpacing / 2;
                        const barHeight = (d.value / yMax) * (height - paddingTop - paddingBottom);
                        const y = height - paddingBottom - barHeight;
                        const color = d.color || defaultColor;

                        return (
                            <g key={index}>
                                <rect 
                                    x={x} 
                                    y={y} 
                                    width={barWidth} 
                                    height={Math.max(barHeight, 2)} 
                                    fill={color}
                                    rx="4"
                                    ry="4"
                                    style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                                    onMouseEnter={() => {
                                        setTooltip({
                                            x: x + barWidth / 2,
                                            y: y - 10,
                                            content: `${d.label}: ${d.value} tickets`,
                                            visible: true
                                        });
                                    }}
                                    onMouseLeave={() => {
                                        setTooltip(prev => ({ ...prev, visible: false }));
                                    }}
                                />
                                {/* Etiqueta del Eje X */}
                                <text 
                                    x={x + barWidth / 2} 
                                    y={height - paddingBottom + 20} 
                                    fill="#64748b" 
                                    fontSize="10" 
                                    textAnchor="middle"
                                    fontFamily="system-ui"
                                    style={{
                                        maxWidth: barWidth,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}
                                >
                                    {d.label.length > 10 ? d.label.substring(0, 8) + '..' : d.label}
                                </text>
                            </g>
                        );
                    })}
                </svg>

                {tooltip.visible && (
                    <div style={{
                        position: 'absolute',
                        left: `${(tooltip.x / width) * 100}%`,
                        top: `${(tooltip.y / height) * 100}%`,
                        transform: 'translate(-50%, -100%)',
                        backgroundColor: '#0f172a',
                        color: 'white',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontFamily: 'system-ui',
                        fontWeight: '600',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                        pointerEvents: 'none',
                        zIndex: 10,
                        whiteSpace: 'nowrap'
                    }}>
                        {tooltip.content}
                    </div>
                )}
            </div>
        );
    };

    // Gráfico de Dona SVG (Doughnut)
    const SVGDoughnutChart: React.FC<{
        data: { label: string; value: number; color: string }[];
    }> = ({ data }) => {
        const size = 300;
        const cx = size / 2;
        const cy = size / 2;
        const r = 90;
        const innerR = 60;

        const total = data.reduce((sum, item) => sum + item.value, 0);

        if (total === 0) {
            return (
                <div style={{ height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                    Sin datos en este rango
                </div>
            );
        }

        let accumulatedAngle = -90; // Empezar arriba (12 en punto)

        const slices = data.map((d) => {
            const percentage = (d.value / total) * 100;
            const angle = (d.value / total) * 360;
            const startAngle = accumulatedAngle;
            const endAngle = accumulatedAngle + angle;
            accumulatedAngle = endAngle;

            // Convertir ángulos a radianes para coordenadas
            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;

            const x1 = cx + r * Math.cos(startRad);
            const y1 = cy + r * Math.sin(startRad);
            const x2 = cx + r * Math.cos(endRad);
            const y2 = cy + r * Math.sin(endRad);

            const x1_inner = cx + innerR * Math.cos(startRad);
            const y1_inner = cy + innerR * Math.sin(startRad);
            const x2_inner = cx + innerR * Math.cos(endRad);
            const y2_inner = cy + innerR * Math.sin(endRad);

            const largeArc = angle > 180 ? 1 : 0;

            // Path para un arco grueso tipo dona
            const pathData = `
                M ${x1} ${y1}
                A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}
                L ${x2_inner} ${y2_inner}
                A ${innerR} ${innerR} 0 ${largeArc} 0 ${x1_inner} ${y1_inner}
                Z
            `;

            return {
                pathData,
                percentage,
                label: d.label,
                value: d.value,
                color: d.color
            };
        });

        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <div style={{ position: 'relative', width: '180px', height: '180px' }}>
                    <svg viewBox={`0 0 ${size} ${size}`} width="180" height="180" style={{ overflow: 'visible' }}>
                        {slices.map((slice, idx) => (
                            <path 
                                key={idx}
                                d={slice.pathData}
                                fill={slice.color}
                                style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                onMouseEnter={(e) => {
                                    setTooltip({
                                        x: cx,
                                        y: cy - 20,
                                        content: `${slice.label}: ${slice.value} (${slice.percentage.toFixed(1)}%)`,
                                        visible: true
                                    });
                                }}
                                onMouseLeave={() => {
                                    setTooltip(prev => ({ ...prev, visible: false }));
                                }}
                            />
                        ))}
                        {/* Texto central con total */}
                        <text x={cx} y={cy + 5} textAnchor="middle" fill="#0f172a" fontSize="18" fontWeight="bold" fontFamily="system-ui">
                            {total}
                        </text>
                        <text x={cx} y={cy + 22} textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="500" fontFamily="system-ui">
                            TICKETS
                        </text>
                    </svg>
                </div>

                {/* Leyenda a la derecha */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '140px' }}>
                    {slices.map((s, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: s.color }} />
                            <span style={{ color: '#334155', fontWeight: '500' }}>
                                {s.label}: <strong>{s.value}</strong>
                            </span>
                        </div>
                    ))}
                </div>

                {tooltip.visible && (
                    <div style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -100%)',
                        backgroundColor: '#0f172a',
                        color: 'white',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontFamily: 'system-ui',
                        fontWeight: '600',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                        pointerEvents: 'none',
                        zIndex: 10,
                        whiteSpace: 'nowrap'
                    }}>
                        {tooltip.content}
                    </div>
                )}
            </div>
        );
    };

    // Gráfico de Barras Horizontales SVG
    const SVGHorizontalBarChart: React.FC<{
        data: { label: string; value: number }[];
        color: string;
    }> = ({ data, color }) => {
        const width = 500;
        const barHeight = 24;
        const barSpacing = 12;
        const paddingLeft = 110; // Espacio para etiquetas largas
        const paddingRight = 40;
        const height = data.length * (barHeight + barSpacing) + 20;

        if (data.length === 0) {
            return (
                <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                    Sin datos en este rango
                </div>
            );
        }

        const maxVal = Math.max(...data.map(d => d.value), 1);
        const maxBarWidth = width - paddingLeft - paddingRight;

        return (
            <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ overflow: 'visible' }}>
                {data.map((d, index) => {
                    const y = index * (barHeight + barSpacing) + 10;
                    const barWidth = (d.value / maxVal) * maxBarWidth;

                    return (
                        <g key={index}>
                            {/* Nombre del área */}
                            <text 
                                x={paddingLeft - 10} 
                                y={y + barHeight / 2 + 4} 
                                fill="#475569" 
                                fontSize="11" 
                                textAnchor="end"
                                fontFamily="system-ui"
                                fontWeight="500"
                            >
                                {d.label.length > 15 ? d.label.substring(0, 13) + '..' : d.label}
                            </text>

                            {/* Rectángulo de Fondo (Sombra de barra) */}
                            <rect 
                                x={paddingLeft} 
                                y={y} 
                                width={maxBarWidth} 
                                height={barHeight} 
                                fill="#f8fafc" 
                                rx="4"
                            />

                            {/* Rectángulo con datos */}
                            <rect 
                                x={paddingLeft} 
                                y={y} 
                                width={Math.max(barWidth, 4)} 
                                height={barHeight} 
                                fill={color} 
                                rx="4"
                                style={{ transition: 'width 0.5s ease-in-out' }}
                            />

                            {/* Valor final de la barra */}
                            <text 
                                x={paddingLeft + Math.max(barWidth, 4) + 8} 
                                y={y + barHeight / 2 + 4} 
                                fill="#0f172a" 
                                fontSize="11" 
                                fontWeight="bold"
                                fontFamily="system-ui"
                            >
                                {d.value}
                            </text>
                        </g>
                    );
                })}
            </svg>
        );
    };

    // Render del Heatmap (Grommets / GitHub style)
    const renderHeatmap = () => {
        const { matrix, maxCount } = heatmapData;
        const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

        return (
            <div style={{ overflowX: 'auto', padding: '10px 0' }}>
                <div style={{ minWidth: '700px', position: 'relative' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '40px repeat(24, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '8px' }}>
                        <div />
                        {Array.from({ length: 24 }).map((_, h) => (
                            <div key={h} style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>
                                {h.toString().padStart(2, '0')}h
                            </div>
                        ))}
                    </div>

                    {diasSemana.map((dia, dIdx) => (
                        <div key={dIdx} style={{ display: 'grid', gridTemplateColumns: '40px repeat(24, 1fr)', gap: '4px', alignItems: 'center', marginBottom: '4px' }}>
                            <div style={{ fontSize: '11px', color: '#475569', fontWeight: '600', textAlign: 'right', paddingRight: '8px' }}>
                                {dia}
                            </div>
                            {Array.from({ length: 24 }).map((_, hIdx) => {
                                const count = matrix[dIdx][hIdx];
                                // Calcular opacidad basada en el valor máximo
                                const opacity = maxCount > 0 ? count / maxCount : 0;
                                const hasData = count > 0;
                                
                                return (
                                    <div 
                                        key={hIdx}
                                        style={{
                                            aspectRatio: '1',
                                            borderRadius: '3px',
                                            backgroundColor: hasData ? '#2563eb' : '#f1f5f9',
                                            opacity: hasData ? Math.max(opacity, 0.15) : 1,
                                            border: '1px solid ' + (hasData ? '#1d4ed8' : '#e2e8f0'),
                                            cursor: 'pointer',
                                            transition: 'transform 0.1s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'scale(1.25)';
                                            e.currentTarget.style.zIndex = '1';
                                            setTooltip({
                                                x: e.currentTarget.offsetLeft,
                                                y: e.currentTarget.offsetTop - 10,
                                                content: `${diasSemana[dIdx]} a las ${hIdx.toString().padStart(2, '0')}:00 hrs: ${count} tickets`,
                                                visible: true
                                            });
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'scale(1)';
                                            e.currentTarget.style.zIndex = '0';
                                            setTooltip(prev => ({ ...prev, visible: false }));
                                        }}
                                    />
                                );
                            })}
                        </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '12px', fontSize: '11px', color: '#64748b', alignItems: 'center' }}>
                        <span>Menos actividad</span>
                        <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0' }} />
                        <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#2563eb', opacity: 0.25 }} />
                        <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#2563eb', opacity: 0.6 }} />
                        <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#2563eb', opacity: 1 }} />
                        <span>Más actividad</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* ============================================
            BARRA DE FILTROS PRINCIPALES
            ============================================ */}
            <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '16px',
                alignItems: 'flex-end'
            }}>
                <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>🏢 Agencia</label>
                    <select 
                        value={selectedAgencia}
                        onChange={(e) => setSelectedAgencia(e.target.value)}
                        style={{
                            padding: '10px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '14px',
                            outline: 'none',
                            backgroundColor: '#f8fafc'
                        }}
                    >
                        <option value="all">Todas las Agencias</option>
                        {agencias.map((ag) => (
                            <option key={ag.id} value={ag.id}>{ag.nombre}</option>
                        ))}
                    </select>
                </div>

                <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>📅 Rango Predefinido</label>
                    <select 
                        value={datePreset}
                        onChange={(e) => setDatePreset(e.target.value)}
                        style={{
                            padding: '10px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '14px',
                            outline: 'none',
                            backgroundColor: '#f8fafc'
                        }}
                    >
                        <option value="last7">Últimos 7 días</option>
                        <option value="last30">Últimos 30 días</option>
                        <option value="thisMonth">Este mes</option>
                        <option value="thisYear">Este año</option>
                        <option value="custom">Personalizado (Ver abajo)</option>
                        <option value="all">Todos los registros</option>
                    </select>
                </div>

                {datePreset === 'custom' && (
                    <>
                        <div style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Fecha de Inicio</label>
                            <input 
                                type="date" 
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                                style={{
                                    padding: '9px',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '14px',
                                    outline: 'none',
                                    backgroundColor: '#f8fafc'
                                }}
                            />
                        </div>
                        <div style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Fecha de Fin</label>
                            <input 
                                type="date" 
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                                style={{
                                    padding: '9px',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '14px',
                                    outline: 'none',
                                    backgroundColor: '#f8fafc'
                                }}
                            />
                        </div>
                    </>
                )}

                <button 
                    onClick={loadStatsData}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        height: '42px',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                >
                    🔄 Recargar
                </button>
            </div>

            {/* ============================================
            FILTROS INTERACTIVOS DEL CLIENTE (CASCADA LOCAL)
            ============================================ */}
            <div style={{
                backgroundColor: '#f8fafc',
                padding: '16px 20px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                alignItems: 'center'
            }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748b', marginRight: '8px' }}>⚡ FILTROS INTERACTIVOS:</span>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Área:</label>
                    <select 
                        value={filterArea}
                        onChange={(e) => setFilterArea(e.target.value)}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '4px',
                            border: '1px solid #e2e8f0',
                            fontSize: '12px',
                            backgroundColor: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="all">Todas</option>
                        {uniqueAreas.map((a) => (
                            <option key={a} value={a}>{a}</option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Prioridad:</label>
                    <select 
                        value={filterPrioridad}
                        onChange={(e) => setFilterPrioridad(e.target.value)}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '4px',
                            border: '1px solid #e2e8f0',
                            fontSize: '12px',
                            backgroundColor: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="all">Todas</option>
                        <option value="baja">Baja</option>
                        <option value="media">Media</option>
                        <option value="alta">Alta</option>
                        <option value="critica">Crítica</option>
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Estado:</label>
                    <select 
                        value={filterEstado}
                        onChange={(e) => setFilterEstado(e.target.value)}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '4px',
                            border: '1px solid #e2e8f0',
                            fontSize: '12px',
                            backgroundColor: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="all">Todos</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="abierto">Abierto</option>
                        <option value="en proceso">En proceso</option>
                        <option value="resuelto">Resuelto</option>
                        <option value="cerrado">Cerrado</option>
                    </select>
                </div>

                {(filterArea !== 'all' || filterPrioridad !== 'all' || filterEstado !== 'all') && (
                    <button 
                        onClick={() => {
                            setFilterArea('all');
                            setFilterPrioridad('all');
                            setFilterEstado('all');
                        }}
                        style={{
                            padding: '4px 10px',
                            backgroundColor: '#cbd5e1',
                            color: '#475569',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        Limpiar filtros
                    </button>
                )}
            </div>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid #cbd5e1', borderTopColor: '#2563eb', animation: 'spin 1s linear infinite' }} />
                    <span style={{ color: '#475569', fontSize: '14px', fontWeight: '600' }}>Cargando datos estadísticos...</span>
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                </div>
            ) : (
                <>
                    {/* ============================================
                    SECCIÓN DE TARJETAS INDICADORES (KPIs)
                    ============================================ */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: '20px'
                    }}>
                        {/* KPI Total */}
                        <div style={{
                            backgroundColor: 'white',
                            padding: '24px',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px'
                        }}>
                            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>TICKETS EN EL RANGO</span>
                            <span style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a' }}>{kpis.totalCount}</span>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Tickets que corresponden a los filtros activos</span>
                        </div>

                        {/* KPI Primera Respuesta */}
                        <div style={{
                            backgroundColor: 'white',
                            padding: '24px',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px'
                        }}>
                            <span style={{ fontSize: '13px', color: '#3b82f6', fontWeight: 'bold' }}>⏱️ PROM. PRIMERA RESPUESTA</span>
                            <span style={{ fontSize: '32px', fontWeight: '800', color: '#1e3a8a' }}>{kpis.avgPrimeraRespuesta}</span>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Tiempo promedio hasta la primera réplica de soporte</span>
                        </div>

                        {/* KPI Resolución/Cierre */}
                        <div style={{
                            backgroundColor: 'white',
                            padding: '24px',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px'
                        }}>
                            <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 'bold' }}>⏱️ PROM. CIERRE / RESOLUCIÓN</span>
                            <span style={{ fontSize: '32px', fontWeight: '800', color: '#064e3b' }}>{kpis.avgResolucion}</span>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Tiempo promedio desde la creación hasta el cierre</span>
                        </div>
                    </div>

                    {/* ============================================
                    GRID DE GRÁFICOS Y ANÁLISIS
                    ============================================ */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                        gap: '24px'
                    }}>
                        
                        {/* 1. TICKETS CREADOS */}
                        <div style={{
                            backgroundColor: 'white',
                            padding: '20px',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>📈 Tickets Creados</h3>
                                <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '6px' }}>
                                    {(['dia', 'semana', 'mes', 'ano'] as const).map((type) => (
                                        <button 
                                            key={type}
                                            onClick={() => setAgrupacionCreados(type)}
                                            style={{
                                                padding: '4px 8px',
                                                border: 'none',
                                                borderRadius: '4px',
                                                fontSize: '11px',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                backgroundColor: agrupacionCreados === type ? 'white' : 'transparent',
                                                color: agrupacionCreados === type ? '#0f172a' : '#64748b',
                                                boxShadow: agrupacionCreados === type ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                                            }}
                                        >
                                            {type.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <SVGLineChart data={creadosChartData} color="#2563eb" gradientId="creadosGrad" />
                        </div>

                        {/* 2. TICKETS RESUELTOS */}
                        <div style={{
                            backgroundColor: 'white',
                            padding: '20px',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>✅ Tickets Resueltos</h3>
                                <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '6px' }}>
                                    {(['dia', 'semana'] as const).map((type) => (
                                        <button 
                                            key={type}
                                            onClick={() => setAgrupacionResueltos(type)}
                                            style={{
                                                padding: '4px 8px',
                                                border: 'none',
                                                borderRadius: '4px',
                                                fontSize: '11px',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                backgroundColor: agrupacionResueltos === type ? 'white' : 'transparent',
                                                color: agrupacionResueltos === type ? '#0f172a' : '#64748b',
                                                boxShadow: agrupacionResueltos === type ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                                            }}
                                        >
                                            {type.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <SVGLineChart data={resueltosChartData} color="#10b981" gradientId="resueltosGrad" />
                        </div>

                        {/* 3. ABIERTOS VS CERRADOS */}
                        <div style={{
                            backgroundColor: 'white',
                            padding: '20px',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', marginBottom: '16px' }}>📊 Backlog (Abiertos vs Cerrados)</h3>
                            <SVGBarChart data={abiertosVsCerradosData} defaultColor="#3b82f6" />
                        </div>

                        {/* 4. ESTADO DE TICKETS */}
                        <div style={{
                            backgroundColor: 'white',
                            padding: '20px',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', marginBottom: '16px' }}>🍩 Distribución por Estado</h3>
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
                                <SVGDoughnutChart data={estadoChartData} />
                            </div>
                        </div>

                        {/* 5. PRIORIDAD */}
                        <div style={{
                            backgroundColor: 'white',
                            padding: '20px',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', marginBottom: '16px' }}>⚠️ Tickets por Prioridad</h3>
                            <SVGBarChart data={prioridadChartData} defaultColor="#f59e0b" />
                        </div>

                        {/* 6. TICKETS POR AREA */}
                        <div style={{
                            backgroundColor: 'white',
                            padding: '20px',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', marginBottom: '16px' }}>🏢 Tickets por Área</h3>
                            <SVGHorizontalBarChart data={areaChartData} color="#8b5cf6" />
                        </div>

                        {/* 7. TICKETS POR AGENTE */}
                        <div style={{
                            backgroundColor: 'white',
                            padding: '20px',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', marginBottom: '16px' }}>👥 Carga por Agente de Soporte</h3>
                            <SVGBarChart data={agenteChartData} defaultColor="#06b6d4" />
                        </div>

                        {/* 9. ANTIGÜEDAD HISTOGRAMA */}
                        <div style={{
                            backgroundColor: 'white',
                            padding: '20px',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', marginBottom: '16px' }}>⏳ Antigüedad de Tickets Abiertos</h3>
                            <SVGBarChart data={antiguedadData} defaultColor="#ef4444" />
                        </div>
                    </div>

                    {/* ============================================
                    8. HEATMAP: TENDENCIA POR HORA DEL DÍA
                    ============================================ */}
                    <div style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        marginTop: '8px'
                    }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', marginBottom: '16px' }}>🔥 Mapa de Calor: Tendencia por Hora del Día</h3>
                        {renderHeatmap()}
                    </div>
                </>
            )}
        </div>
    );
};
