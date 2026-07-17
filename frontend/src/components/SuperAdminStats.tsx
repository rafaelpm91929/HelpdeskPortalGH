import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api/axios.config';
import toast from 'react-hot-toast';

interface SuperAdminStatsProps {
    agencias: any[];
}

export const SuperAdminStats: React.FC<SuperAdminStatsProps> = ({ agencias }) => {
    // Filtros de búsqueda (API)
    const [selectedAgencias, setSelectedAgencias] = useState<string[]>(['all']);
    const [showAgencyDropdown, setShowAgencyDropdown] = useState<boolean>(false);
    const [datePreset, setDatePreset] = useState<string>('last30');
    const [fechaInicio, setFechaInicio] = useState<string>('');
    const [fechaFin, setFechaFin] = useState<string>('');

    // Datos crudos cargados del backend
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // Tiempo de Uso (Estadísticas SuperAdmin)
    const [usageStats, setUsageStats] = useState<any>(null);
    const [loadingUsage, setLoadingUsage] = useState<boolean>(true);

    // Filtros interactivos del cliente (en cascada)
    const [filterArea, setFilterArea] = useState<string>('all');
    const [filterPrioridad, setFilterPrioridad] = useState<string>('all');
    const [filterEstado, setFilterEstado] = useState<string>('all');
    
    // Toggles de agrupación
    const [agrupacionCreados, setAgrupacionCreados] = useState<'dia' | 'semana' | 'mes' | 'ano'>('dia');
    const [agrupacionResueltos, setAgrupacionResueltos] = useState<'dia' | 'semana'>('dia');

    // Configuración de visibilidad de gráficos
    const [chartCategory, setChartCategory] = useState<'todos' | 'tendencias' | 'kpis' | 'distribucion'>('todos');
    const [visibleCharts, setVisibleCharts] = useState({
        creados: true,
        resueltos: true,
        backlog: true,
        estado: true,
        prioridad: true,
        area: true,
        agente: true,
        antiguedad: true,
        heatmap: true
    });

    // Toggle del panel de configuración de gráficos
    const [showConfigPanel, setShowConfigPanel] = useState<boolean>(false);

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
            
            // Construir parámetro agencia_ids (multi-select)
            if (!selectedAgencias.includes('all') && selectedAgencias.length > 0) {
                params.agencia_ids = selectedAgencias.join(',');
            }
            
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

    // Función para cargar estadísticas de tiempo de uso de la app
    const loadUsageStats = async () => {
        try {
            setLoadingUsage(true);
            const params: any = {};
            if (!selectedAgencias.includes('all') && selectedAgencias.length > 0) {
                params.agencia_ids = selectedAgencias.join(',');
            }
            if (fechaInicio) params.fecha_inicio = `${fechaInicio}T00:00:00`;
            if (fechaFin) params.fecha_fin = `${fechaFin}T23:59:59`;

            const response = await api.get('/tickets/usage-stats', { params });
            if (response.data.success) {
                setUsageStats(response.data.data);
            }
        } catch (error) {
            console.error('Error al cargar estadísticas de uso de tiempo:', error);
        } finally {
            setLoadingUsage(false);
        }
    };

    const formatSeconds = (seconds: number): string => {
        if (!seconds || seconds <= 0) return '0m';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    // Recargar datos cuando cambien los filtros principales de la API
    useEffect(() => {
        loadStatsData();
        loadUsageStats();
    }, [selectedAgencias, fechaInicio, fechaFin]);

    // Manejar selección de agencias
    const handleAgencySelect = (id: string) => {
        if (id === 'all') {
            setSelectedAgencias(['all']);
        } else {
            let next = selectedAgencias.filter(x => x !== 'all');
            if (next.includes(id)) {
                next = next.filter(x => x !== id);
                if (next.length === 0) next = ['all'];
            } else {
                next.push(id);
            }
            setSelectedAgencias(next);
        }
    };

    // Texto visible en el botón del selector múltiple de agencias
    const agencyDropdownText = useMemo(() => {
        if (selectedAgencias.includes('all')) return 'Todas las Agencias';
        if (selectedAgencias.length === 1) {
            const match = agencias.find(a => String(a.id) === selectedAgencias[0]);
            return match ? match.nombre : '1 seleccionada';
        }
        return `${selectedAgencias.length} agencias seleccionadas`;
    }, [selectedAgencias, agencias]);

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

    // Filtrar visibilidad según categorías rápidas de gráficos
    const displayCharts = useMemo(() => {
        const result = { ...visibleCharts };
        if (chartCategory === 'tendencias') {
            return {
                creados: result.creados,
                resueltos: result.resueltos,
                backlog: result.backlog,
                estado: false,
                prioridad: false,
                area: false,
                agente: false,
                antiguedad: false,
                heatmap: result.heatmap
            };
        }
        if (chartCategory === 'kpis') {
            return {
                creados: false,
                resueltos: false,
                backlog: false,
                estado: result.estado,
                prioridad: result.prioridad,
                area: false,
                agente: false,
                antiguedad: false,
                heatmap: false
            };
        }
        if (chartCategory === 'distribucion') {
            return {
                creados: false,
                resueltos: false,
                backlog: false,
                estado: false,
                prioridad: false,
                area: result.area,
                agente: result.agente,
                antiguedad: result.antiguedad,
                heatmap: false
            };
        }
        return result;
    }, [chartCategory, visibleCharts]);

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
                const diff = (respuesta - creacion) / 60000;
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
                const diff = (resolucion - creacion) / 60000;
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
    // CÁLCULOS PARA GRÁFICOS
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
                const day = date.getDay();
                const diff = date.getDate() - day + (day === 0 ? -6 : 1);
                const monday = new Date(date.setDate(diff));
                key = `Sem. ${monday.toISOString().split('T')[0].substring(5)}`;
            } else if (agrupacionCreados === 'mes') {
                key = date.toISOString().substring(0, 7);
            } else {
                key = date.getFullYear().toString();
            }
            groups[key] = (groups[key] || 0) + 1;
        });
        const sortedKeys = Object.keys(groups).sort();
        return sortedKeys.map((key) => ({ label: key, value: groups[key] }));
    }, [filteredTickets, agrupacionCreados]);

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
                const day = date.getDay();
                const diff = date.getDate() - day + (day === 0 ? -6 : 1);
                const monday = new Date(date.setDate(diff));
                key = `Sem. ${monday.toISOString().split('T')[0].substring(5)}`;
            }
            groups[key] = (groups[key] || 0) + 1;
        });
        const sortedKeys = Object.keys(groups).sort();
        return sortedKeys.map((key) => ({ label: key, value: groups[key] }));
    }, [filteredTickets, agrupacionResueltos]);

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
            { label: 'Abiertos (Activos)', value: abiertos, color: 'url(#gradBlueBar)' },
            { label: 'Cerrados/Resueltos', value: cerrados, color: 'url(#gradGreenBar)' }
        ];
    }, [filteredTickets]);

    const estadoChartData = useMemo(() => {
        const counts: { [key: string]: number } = { 'pendiente': 0, 'abierto': 0, 'en proceso': 0, 'resuelto': 0, 'cerrado': 0 };
        filteredTickets.forEach((t) => {
            if (counts[t.estado] !== undefined) counts[t.estado]++;
        });
        const colorMap: { [key: string]: string } = {
            'pendiente': '#f87171',
            'abierto': '#fbbf24',
            'en proceso': '#60a5fa',
            'resuelto': '#34d399',
            'cerrado': '#94a3b8'
        };
        return Object.keys(counts).map((key) => ({
            label: key.toUpperCase(),
            value: counts[key],
            color: colorMap[key] || '#cbd5e1'
        })).filter(c => c.value > 0);
    }, [filteredTickets]);

    const prioridadChartData = useMemo(() => {
        const counts: { [key: string]: number } = { 'baja': 0, 'media': 0, 'alta': 0, 'critica': 0 };
        filteredTickets.forEach((t) => {
            const p = t.prioridad?.toLowerCase();
            if (counts[p] !== undefined) counts[p]++;
        });
        return [
            { label: 'Baja', value: counts['baja'], color: '#a7f3d0' },
            { label: 'Media', value: counts['media'], color: '#fef08a' },
            { label: 'Alta', value: counts['alta'], color: '#fb923c' },
            { label: 'Crítica', value: counts['critica'], color: '#f87171' }
        ];
    }, [filteredTickets]);

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

    const heatmapData = useMemo(() => {
        const matrix = Array.from({ length: 7 }, () => Array(24).fill(0));
        let maxCount = 0;
        filteredTickets.forEach((t) => {
            const date = new Date(t.fecha_creacion);
            if (isNaN(date.getTime())) return;
            let day = date.getDay();
            day = day === 0 ? 6 : day - 1;
            const hour = date.getHours();
            matrix[day][hour]++;
            if (matrix[day][hour] > maxCount) maxCount = matrix[day][hour];
        });
        return { matrix, maxCount };
    }, [filteredTickets]);

    const antiguedadData = useMemo(() => {
        const ranges = { '0-2 días': 0, '3-5 días': 0, '6-10 días': 0, '11-20 días': 0, '21+ días': 0 };
        const ahora = new Date().getTime();
        filteredTickets.forEach((t) => {
            if (!['pendiente', 'abierto', 'en proceso'].includes(t.estado)) return;
            const creacion = new Date(t.fecha_creacion).getTime();
            const diffDays = (ahora - creacion) / (1000 * 60 * 60 * 24);
            if (diffDays <= 2) ranges['0-2 días']++;
            else if (diffDays <= 5) ranges['3-5 días']++;
            else if (diffDays <= 10) ranges['6-10 días']++;
            else if (diffDays <= 20) ranges['11-20 días']++;
            else ranges['21+ días']++;
        });
        return Object.keys(ranges).map((key) => ({
            label: key,
            value: ranges[key as keyof typeof ranges],
            color: key === '21+ días' ? '#f87171' : key === '11-20 días' ? '#fb923c' : '#60a5fa'
        }));
    }, [filteredTickets]);

    // ============================================
    // COMPONENTES GRÁFICOS SVG NATIVOS MEJORADOS (WOW FACTOR)
    // ============================================

    // Eje vertical y de cuadrícula
    const renderYAxisGrid = (yGridLines: { y: number; val: number }[], width: number, paddingLeft: number, paddingRight: number) => (
        <g>
            {yGridLines.map((line, idx) => (
                <g key={idx}>
                    <line 
                        x1={paddingLeft} 
                        y1={line.y} 
                        x2={width - paddingRight} 
                        y2={line.y} 
                        stroke="#f1f5f9" 
                        strokeWidth="1.2" 
                        strokeDasharray="4 4"
                    />
                    <text 
                        x={paddingLeft - 12} 
                        y={line.y + 4} 
                        fill="#64748b" 
                        fontSize="11" 
                        fontWeight="600"
                        textAnchor="end"
                        fontFamily="system-ui"
                    >
                        {line.val}
                    </text>
                </g>
            ))}
        </g>
    );

    // Gráfico de Línea SVG Premium
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
                <div style={{ height: height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px', fontWeight: '500' }}>
                    Sin datos en este rango
                </div>
            );
        }

        const maxVal = Math.max(...data.map(d => d.value), 5);
        const yMax = Math.ceil(maxVal * 1.15);

        const points = data.map((d, index) => {
            const x = paddingLeft + (index / Math.max(data.length - 1, 1)) * (width - paddingLeft - paddingRight);
            const y = height - paddingBottom - (d.value / yMax) * (height - paddingTop - paddingBottom);
            return { x, y, label: d.label, value: d.value };
        });

        let linePath = '';
        points.forEach((p, idx) => {
            if (idx === 0) {
                linePath += `M ${p.x} ${p.y}`;
            } else {
                const prev = points[idx - 1];
                const cpX1 = prev.x + (p.x - prev.x) / 2;
                const cpY1 = prev.y;
                const cpX2 = prev.x + (p.x - prev.x) / 2;
                const cpY2 = p.y;
                linePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p.x} ${p.y}`;
            }
        });

        const areaPath = data.length > 0 
            ? `${linePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z` 
            : '';

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
                            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
                        </linearGradient>
                        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor={color} floodOpacity="0.2" />
                        </filter>
                    </defs>

                    {renderYAxisGrid(yGridLines, width, paddingLeft, paddingRight)}

                    {/* Área degradada con curva suavizada */}
                    {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} style={{ transition: 'all 0.4s ease-in-out' }} />}

                    {/* Línea principal con efecto Glow */}
                    {linePath && (
                        <path 
                            d={linePath} 
                            fill="none" 
                            stroke={color} 
                            strokeWidth="3.5" 
                            strokeLinecap="round"
                            filter="url(#shadow)"
                            style={{ transition: 'all 0.4s ease-in-out' }}
                        />
                    )}

                    {/* Puntos de datos */}
                    {points.map((p, idx) => (
                        <circle 
                            key={idx} 
                            cx={p.x} 
                            cy={p.y} 
                            r="6" 
                            fill="white" 
                            stroke={color} 
                            strokeWidth="3.5" 
                            style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                            onMouseEnter={(e) => {
                                e.currentTarget.setAttribute('r', '8');
                                setTooltip({
                                    x: p.x,
                                    y: p.y - 14,
                                    content: `${p.label}: ${p.value} tickets`,
                                    visible: true
                                });
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.setAttribute('r', '6');
                                setTooltip(prev => ({ ...prev, visible: false }));
                            }}
                        />
                    ))}

                    {/* Eje X Etiquetas */}
                    {points.filter((_, idx) => {
                        if (points.length <= 10) return true;
                        if (points.length <= 20) return idx % 2 === 0;
                        return idx % 4 === 0 || idx === points.length - 1;
                    }).map((p, idx) => (
                        <text 
                            key={idx} 
                            x={p.x} 
                            y={height - paddingBottom + 22} 
                            fill="#64748b" 
                            fontSize="10" 
                            fontWeight="600"
                            textAnchor="middle"
                            fontFamily="system-ui"
                        >
                            {p.label}
                        </text>
                    ))}
                </svg>

                {/* Tooltip Glassmorphic */}
                {tooltip.visible && (
                    <div style={{
                        position: 'absolute',
                        left: `${(tooltip.x / width) * 100}%`,
                        top: `${(tooltip.y / height) * 100}%`,
                        transform: 'translate(-50%, -100%)',
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        color: 'white',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontFamily: 'system-ui',
                        fontWeight: '600',
                        boxShadow: '0 8px 16px -4px rgba(0,0,0,0.3), 0 0 1px 1px rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        pointerEvents: 'none',
                        zIndex: 10,
                        whiteSpace: 'nowrap',
                        backdropFilter: 'blur(4px)'
                    }}>
                        {tooltip.content}
                    </div>
                )}
            </div>
        );
    };

    // Gráfico de Barras SVG con Esquinas Redondeadas y Degradado
    const SVGBarChart: React.FC<{
        data: { label: string; value: number; color?: string }[];
        defaultColor: string;
        gradientId: string;
    }> = ({ data, defaultColor, gradientId }) => {
        const width = 600;
        const height = 280;
        const paddingLeft = 50;
        const paddingRight = 20;
        const paddingTop = 30;
        const paddingBottom = 40;

        if (data.length === 0 || data.every(d => d.value === 0)) {
            return (
                <div style={{ height: height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px', fontWeight: '500' }}>
                    Sin datos en este rango
                </div>
            );
        }

        const maxVal = Math.max(...data.map(d => d.value), 5);
        const yMax = Math.ceil(maxVal * 1.1);

        const availableWidth = width - paddingLeft - paddingRight;
        const barSpacing = 16;
        const barWidth = Math.max((availableWidth - (data.length - 1) * barSpacing) / data.length, 10);

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
                            <stop offset="0%" stopColor={defaultColor} stopOpacity="1" />
                            <stop offset="100%" stopColor={defaultColor} stopOpacity="0.6" />
                        </linearGradient>
                        <linearGradient id="gradBlueBar" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="1" />
                            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.75" />
                        </linearGradient>
                        <linearGradient id="gradGreenBar" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="1" />
                            <stop offset="100%" stopColor="#047857" stopOpacity="0.75" />
                        </linearGradient>
                    </defs>

                    {renderYAxisGrid(yGridLines, width, paddingLeft, paddingRight)}

                    {data.map((d, index) => {
                        const x = paddingLeft + index * (barWidth + barSpacing) + barSpacing / 2;
                        const barHeight = (d.value / yMax) * (height - paddingTop - paddingBottom);
                        const y = height - paddingBottom - barHeight;
                        
                        // Si el color empieza con url(# usará el degradado correspondiente
                        const fillValue = d.color ? d.color : `url(#${gradientId})`;

                        return (
                            <g key={index}>
                                <rect 
                                    x={x} 
                                    y={y} 
                                    width={barWidth} 
                                    height={Math.max(barHeight, 2)} 
                                    fill={fillValue}
                                    rx="6"
                                    ry="6"
                                    style={{ cursor: 'pointer', transition: 'all 0.2s ease-in-out' }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.opacity = '0.85';
                                        setTooltip({
                                            x: x + barWidth / 2,
                                            y: y - 10,
                                            content: `${d.label}: ${d.value} tickets`,
                                            visible: true
                                        });
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.opacity = '1';
                                        setTooltip(prev => ({ ...prev, visible: false }));
                                    }}
                                />
                                <text 
                                    x={x + barWidth / 2} 
                                    y={height - paddingBottom + 22} 
                                    fill="#64748b" 
                                    fontSize="10" 
                                    fontWeight="600"
                                    textAnchor="middle"
                                    fontFamily="system-ui"
                                >
                                    {d.label.length > 11 ? d.label.substring(0, 9) + '..' : d.label}
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
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        color: 'white',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontFamily: 'system-ui',
                        fontWeight: '600',
                        boxShadow: '0 8px 16px -4px rgba(0,0,0,0.3), 0 0 1px 1px rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        pointerEvents: 'none',
                        zIndex: 10,
                        whiteSpace: 'nowrap',
                        backdropFilter: 'blur(4px)'
                    }}>
                        {tooltip.content}
                    </div>
                )}
            </div>
        );
    };

    // Gráfico de Dona SVG (Doughnut) Premium con superposición 3D
    const SVGDoughnutChart: React.FC<{
        data: { label: string; value: number; color: string }[];
    }> = ({ data }) => {
        const size = 300;
        const cx = size / 2;
        const cy = size / 2;
        const r = 95;
        const innerR = 64;

        const total = data.reduce((sum, item) => sum + item.value, 0);

        if (total === 0) {
            return (
                <div style={{ height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px', fontWeight: '500' }}>
                    Sin datos en este rango
                </div>
            );
        }

        let accumulatedAngle = -90;

        const slices = data.map((d) => {
            const percentage = (d.value / total) * 100;
            const angle = (d.value / total) * 360;
            const startAngle = accumulatedAngle;
            const endAngle = accumulatedAngle + angle;
            accumulatedAngle = endAngle;

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '30px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <div style={{ position: 'relative', width: '180px', height: '180px' }}>
                    <svg viewBox={`0 0 ${size} ${size}`} width="180" height="180" style={{ overflow: 'visible' }}>
                        <defs>
                            <filter id="donutShadow" x="-10%" y="-10%" width="120%" height="120%">
                                <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#0f172a" floodOpacity="0.15" />
                            </filter>
                        </defs>
                        {slices.map((slice, idx) => (
                            <path 
                                key={idx}
                                d={slice.pathData}
                                fill={slice.color}
                                style={{ cursor: 'pointer', transition: 'all 0.2s ease-in-out' }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.03)';
                                    e.currentTarget.style.transformOrigin = 'center';
                                    setTooltip({
                                        x: cx,
                                        y: cy - 25,
                                        content: `${slice.label}: ${slice.value} (${slice.percentage.toFixed(1)}%)`,
                                        visible: true
                                    });
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    setTooltip(prev => ({ ...prev, visible: false }));
                                }}
                            />
                        ))}
                        {/* Overlay central para efecto 3D */}
                        <circle cx={cx} cy={cy} r={innerR - 1} fill="white" filter="url(#donutShadow)" />
                        
                        <text x={cx} y={cy + 4} textAnchor="middle" fill="#0f172a" fontSize="20" fontWeight="800" fontFamily="system-ui">
                            {total}
                        </text>
                        <text x={cx} y={cy + 22} textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="700" letterSpacing="1" fontFamily="system-ui">
                            TICKETS
                        </text>
                    </svg>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '150px' }}>
                    {slices.map((s, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                            <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: s.color, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }} />
                            <span style={{ color: '#475569', fontWeight: '600' }}>
                                {s.label}: <strong style={{ color: '#0f172a' }}>{s.value}</strong> <span style={{ color: '#94a3b8', fontSize: '11px' }}>({s.percentage.toFixed(0)}%)</span>
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
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        color: 'white',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontFamily: 'system-ui',
                        fontWeight: '600',
                        boxShadow: '0 8px 16px -4px rgba(0,0,0,0.3), 0 0 1px 1px rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        pointerEvents: 'none',
                        zIndex: 10,
                        whiteSpace: 'nowrap',
                        backdropFilter: 'blur(4px)'
                    }}>
                        {tooltip.content}
                    </div>
                )}
            </div>
        );
    };

    // Gráfico de Barras Horizontales SVG Premium
    const SVGHorizontalBarChart: React.FC<{
        data: { label: string; value: number }[];
        color: string;
    }> = ({ data, color }) => {
        const width = 500;
        const barHeight = 26;
        const barSpacing = 14;
        const paddingLeft = 120;
        const paddingRight = 45;
        const height = data.length * (barHeight + barSpacing) + 20;

        if (data.length === 0) {
            return (
                <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px', fontWeight: '500' }}>
                    Sin datos en este rango
                </div>
            );
        }

        const maxVal = Math.max(...data.map(d => d.value), 1);
        const maxBarWidth = width - paddingLeft - paddingRight;

        return (
            <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ overflow: 'visible' }}>
                <defs>
                    <linearGradient id="gradHorizBar" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={color} stopOpacity="0.75" />
                        <stop offset="100%" stopColor={color} stopOpacity="1" />
                    </linearGradient>
                </defs>
                {data.map((d, index) => {
                    const y = index * (barHeight + barSpacing) + 10;
                    const barWidth = (d.value / maxVal) * maxBarWidth;

                    return (
                        <g key={index}>
                            <text 
                                x={paddingLeft - 12} 
                                y={y + barHeight / 2 + 4} 
                                fill="#475569" 
                                fontSize="11" 
                                textAnchor="end"
                                fontFamily="system-ui"
                                fontWeight="600"
                            >
                                {d.label.length > 17 ? d.label.substring(0, 15) + '..' : d.label}
                            </text>

                            {/* Rectángulo de sombra / fondo */}
                            <rect 
                                x={paddingLeft} 
                                y={y} 
                                width={maxBarWidth} 
                                height={barHeight} 
                                fill="#f8fafc" 
                                stroke="#f1f5f9"
                                strokeWidth="1"
                                rx="5"
                            />

                            {/* Rectángulo activo */}
                            <rect 
                                x={paddingLeft} 
                                y={y} 
                                width={Math.max(barWidth, 4)} 
                                height={barHeight} 
                                fill="url(#gradHorizBar)" 
                                rx="5"
                                style={{ transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
                            />

                            <text 
                                x={paddingLeft + Math.max(barWidth, 4) + 10} 
                                y={y + barHeight / 2 + 4} 
                                fill="#0f172a" 
                                fontSize="11" 
                                fontWeight="800"
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
                    <div style={{ display: 'grid', gridTemplateColumns: '45px repeat(24, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '8px' }}>
                        <div />
                        {Array.from({ length: 24 }).map((_, h) => (
                            <div key={h} style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>
                                {h.toString().padStart(2, '0')}h
                            </div>
                        ))}
                    </div>

                    {diasSemana.map((dia, dIdx) => (
                        <div key={dIdx} style={{ display: 'grid', gridTemplateColumns: '45px repeat(24, 1fr)', gap: '4px', alignItems: 'center', marginBottom: '4px' }}>
                            <div style={{ fontSize: '11px', color: '#475569', fontWeight: '700', textAlign: 'right', paddingRight: '10px' }}>
                                {dia}
                            </div>
                            {Array.from({ length: 24 }).map((_, hIdx) => {
                                const count = matrix[dIdx][hIdx];
                                const opacity = maxCount > 0 ? count / maxCount : 0;
                                const hasData = count > 0;
                                
                                return (
                                    <div 
                                        key={hIdx}
                                        style={{
                                            aspectRatio: '1',
                                            borderRadius: '4px',
                                            backgroundColor: hasData ? '#3b82f6' : '#f8fafc',
                                            opacity: hasData ? Math.max(opacity, 0.2) : 1,
                                            border: '1px solid ' + (hasData ? '#2563eb' : '#e2e8f0'),
                                            cursor: 'pointer',
                                            transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'scale(1.3) translateY(-1px)';
                                            e.currentTarget.style.zIndex = '1';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                                            setTooltip({
                                                x: e.currentTarget.offsetLeft,
                                                y: e.currentTarget.offsetTop - 12,
                                                content: `${diasSemana[dIdx]} a las ${hIdx.toString().padStart(2, '0')}:00 hrs: ${count} tickets`,
                                                visible: true
                                            });
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'scale(1)';
                                            e.currentTarget.style.zIndex = '0';
                                            e.currentTarget.style.boxShadow = 'none';
                                            setTooltip(prev => ({ ...prev, visible: false }));
                                        }}
                                    />
                                );
                            })}
                        </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px', fontSize: '11px', color: '#64748b', alignItems: 'center', fontWeight: '500' }}>
                        <span>Menos actividad</span>
                        <div style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }} />
                        <div style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: '#3b82f6', opacity: 0.25, border: '1px solid #2563eb' }} />
                        <div style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: '#3b82f6', opacity: 0.6, border: '1px solid #2563eb' }} />
                        <div style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: '#3b82f6', opacity: 1, border: '1px solid #2563eb' }} />
                        <span>Más actividad</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            
            {/* ============================================
            BARRA DE FILTROS PRINCIPALES CON SELECCIÓN MÚLTIPLE
            ============================================ */}
            <div style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.03), 0 8px 10px -6px rgba(0,0,0,0.03)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '16px',
                alignItems: 'flex-end',
                position: 'relative'
            }}>
                {/* Selector Múltiple Personalizado (WOW FACTOR) */}
                <div style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569', letterSpacing: '0.3px' }}>🏢 Agencias (Selección Múltiple)</label>
                    <div 
                        onClick={() => setShowAgencyDropdown(!showAgencyDropdown)}
                        style={{
                            padding: '12px 14px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '14px',
                            backgroundColor: '#f8fafc',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontWeight: '600',
                            color: '#1e293b',
                            userSelect: 'none',
                            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
                        }}
                    >
                        <span>{agencyDropdownText}</span>
                        <span style={{ fontSize: '10px', transition: 'transform 0.2s', transform: showAgencyDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                    </div>

                    {/* Capa invisible para cerrar dropdown en clic fuera */}
                    {showAgencyDropdown && (
                        <div 
                            onClick={() => setShowAgencyDropdown(false)}
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                zIndex: 90,
                                cursor: 'default'
                            }}
                        />
                    )}

                    {/* Menú Flotante del Selector Múltiple */}
                    {showAgencyDropdown && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            marginTop: '6px',
                            backgroundColor: 'white',
                            border: '1px solid #cbd5e1',
                            borderRadius: '10px',
                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 16px -8px rgba(0,0,0,0.1)',
                            zIndex: 100,
                            maxHeight: '260px',
                            overflowY: 'auto',
                            padding: '8px 0'
                        }}>
                            {/* Acción rápida */}
                            <div 
                                onClick={() => handleAgencySelect('all')}
                                style={{
                                    padding: '10px 14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    cursor: 'pointer',
                                    backgroundColor: selectedAgencias.includes('all') ? '#eff6ff' : 'transparent',
                                    borderBottom: '1px solid #f1f5f9',
                                    fontWeight: 'bold',
                                    color: selectedAgencias.includes('all') ? '#2563eb' : '#334155'
                                }}
                            >
                                <input 
                                    type="checkbox" 
                                    checked={selectedAgencias.includes('all')} 
                                    readOnly 
                                    style={{ cursor: 'pointer' }}
                                />
                                <span>Todas las Agencias</span>
                            </div>

                            {agencias.map((ag) => {
                                const isSelected = selectedAgencias.includes(String(ag.id));
                                return (
                                    <div 
                                        key={ag.id}
                                        onClick={() => handleAgencySelect(String(ag.id))}
                                        style={{
                                            padding: '10px 14px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            cursor: 'pointer',
                                            backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                                            transition: 'background-color 0.1s',
                                            color: isSelected ? '#2563eb' : '#334155',
                                            fontWeight: isSelected ? '600' : '500'
                                        }}
                                        onMouseEnter={(e) => { if(!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                                        onMouseLeave={(e) => { if(!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                    >
                                        <input 
                                            type="checkbox" 
                                            checked={isSelected} 
                                            readOnly 
                                            style={{ cursor: 'pointer' }}
                                        />
                                        <span>{ag.nombre}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>📅 Rango Predefinido</label>
                    <select 
                        value={datePreset}
                        onChange={(e) => setDatePreset(e.target.value)}
                        style={{
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '14px',
                            outline: 'none',
                            backgroundColor: '#f8fafc',
                            fontWeight: '600',
                            color: '#1e293b'
                        }}
                    >
                        <option value="last7">Últimos 7 días</option>
                        <option value="last30">Últimos 30 días</option>
                        <option value="thisMonth">Este mes</option>
                        <option value="thisYear">Este año</option>
                        <option value="custom">Personalizado...</option>
                        <option value="all">Todo el historial</option>
                    </select>
                </div>

                {datePreset === 'custom' && (
                    <>
                        <div style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>Fecha de Inicio</label>
                            <input 
                                type="date" 
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                                style={{
                                    padding: '11px',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '14px',
                                    outline: 'none',
                                    backgroundColor: '#f8fafc',
                                    fontWeight: '600'
                                }}
                            />
                        </div>
                        <div style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>Fecha de Fin</label>
                            <input 
                                type="date" 
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                                style={{
                                    padding: '11px',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '14px',
                                    outline: 'none',
                                    backgroundColor: '#f8fafc',
                                    fontWeight: '600'
                                }}
                            />
                        </div>
                    </>
                )}

                <button 
                    onClick={loadStatsData}
                    style={{
                        padding: '0 24px',
                        backgroundColor: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        height: '46px',
                        transition: 'background-color 0.2s, transform 0.1s',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.97)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    🔄 Cargar Filtros
                </button>
            </div>

            {/* ============================================
            PANEL INTERACTIVO: SELECCIÓN DE GRÁFICOS (TABS & CONFIG)
            ============================================ */}
            <div style={{
                backgroundColor: 'white',
                padding: '20px 24px',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    
                    {/* Tabs de Filtro de Gráficos Rápido */}
                    <div style={{ display: 'flex', gap: '6px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
                        {(['todos', 'tendencias', 'kpis', 'distribucion'] as const).map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setChartCategory(cat)}
                                style={{
                                    padding: '8px 16px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    backgroundColor: chartCategory === cat ? 'white' : 'transparent',
                                    color: chartCategory === cat ? '#2563eb' : '#64748b',
                                    boxShadow: chartCategory === cat ? '0 4px 6px -1px rgba(0,0,0,0.05)' : 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {cat === 'todos' && '🌐 Ver Todos'}
                                {cat === 'tendencias' && '📈 Tendencias'}
                                {cat === 'kpis' && '🎯 Estados y KPIs'}
                                {cat === 'distribucion' && '👥 Carga y Áreas'}
                            </button>
                        ))}
                    </div>

                    {/* Botón para Configuración Avanzada de Visibilidad */}
                    <button
                        onClick={() => setShowConfigPanel(!showConfigPanel)}
                        style={{
                            padding: '10px 16px',
                            backgroundColor: showConfigPanel ? '#f1f5f9' : 'transparent',
                            color: '#475569',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.15s'
                        }}
                    >
                        ⚙️ {showConfigPanel ? 'Ocultar Panel' : 'Configurar Gráficas'}
                    </button>
                </div>

                {/* Panel de Checkboxes Detallados */}
                {showConfigPanel && (
                    <div style={{
                        padding: '16px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                        gap: '12px'
                    }}>
                        {Object.keys(visibleCharts).map((key) => {
                            const nameMap: { [key: string]: string } = {
                                creados: '📈 Tickets Creados',
                                resueltos: '✅ Tickets Resueltos',
                                backlog: '📊 Backlog (Abiertos vs Cerrados)',
                                estado: '🍩 Distribución por Estado',
                                prioridad: '⚠️ Tickets por Prioridad',
                                area: '🏢 Tickets por Área',
                                agente: '👥 Carga por Agente',
                                heatmap: '🔥 Mapa de Calor (Horas Pico)',
                                antiguedad: '⏳ Antigüedad de Abiertos'
                            };
                            return (
                                <label 
                                    key={key} 
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '8px', 
                                        fontSize: '13px', 
                                        fontWeight: '600', 
                                        color: '#475569',
                                        cursor: 'pointer',
                                        padding: '4px'
                                    }}
                                >
                                    <input 
                                        type="checkbox" 
                                        checked={visibleCharts[key as keyof typeof visibleCharts]}
                                        onChange={(e) => setVisibleCharts({
                                            ...visibleCharts,
                                            [key]: e.target.checked
                                        })}
                                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                    />
                                    <span>{nameMap[key] || key}</span>
                                </label>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* FILTROS INTERACTIVOS LOCALES (CASCADA) */}
            <div style={{
                backgroundColor: '#f8fafc',
                padding: '16px 20px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                alignItems: 'center'
            }}>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#64748b', marginRight: '8px', letterSpacing: '0.5px' }}>⚡ FILTRAR EN TIEMPO REAL:</span>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Área:</label>
                    <select 
                        value={filterArea}
                        onChange={(e) => setFilterArea(e.target.value)}
                        style={{
                            padding: '8px 14px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '12px',
                            backgroundColor: 'white',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        <option value="all">Todas</option>
                        {uniqueAreas.map((a) => (
                            <option key={a} value={a}>{a}</option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Prioridad:</label>
                    <select 
                        value={filterPrioridad}
                        onChange={(e) => setFilterPrioridad(e.target.value)}
                        style={{
                            padding: '8px 14px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '12px',
                            backgroundColor: 'white',
                            cursor: 'pointer',
                            fontWeight: '600'
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
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Estado:</label>
                    <select 
                        value={filterEstado}
                        onChange={(e) => setFilterEstado(e.target.value)}
                        style={{
                            padding: '8px 14px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '12px',
                            backgroundColor: 'white',
                            cursor: 'pointer',
                            fontWeight: '600'
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
                            padding: '6px 12px',
                            backgroundColor: '#e2e8f0',
                            color: '#475569',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#cbd5e1'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
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
                    SECCIÓN DE TARJETAS INDICADORES (KPIs) CON ESTILOS GLOW
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
                            borderRadius: '16px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#94a3b8' }} />
                            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '800', letterSpacing: '0.5px' }}>TICKETS EN EL RANGO</span>
                            <span style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', fontFamily: 'system-ui' }}>{kpis.totalCount}</span>
                            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>Volumen correspondiente a los filtros activos</span>
                        </div>

                        {/* KPI Primera Respuesta */}
                        <div style={{
                            backgroundColor: 'white',
                            padding: '24px',
                            borderRadius: '16px',
                            border: '1px solid #dbeafe',
                            boxShadow: '0 10px 20px -5px rgba(59, 130, 246, 0.08)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#3b82f6' }} />
                            <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: '800', letterSpacing: '0.5px' }}>⏱️ PROM. PRIMERA RESPUESTA</span>
                            <span style={{ fontSize: '36px', fontWeight: '900', color: '#1d4ed8' }}>{kpis.avgPrimeraRespuesta}</span>
                            <span style={{ fontSize: '11px', color: '#60a5fa', fontWeight: '500' }}>Velocidad inicial de atención de soporte</span>
                        </div>

                        {/* KPI Resolución/Cierre */}
                        <div style={{
                            backgroundColor: 'white',
                            padding: '24px',
                            borderRadius: '16px',
                            border: '1px solid #d1fae5',
                            boxShadow: '0 10px 20px -5px rgba(16, 185, 129, 0.08)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#10b981' }} />
                            <span style={{ fontSize: '12px', color: '#059669', fontWeight: '800', letterSpacing: '0.5px' }}>⏱️ PROM. CIERRE / RESOLUCIÓN</span>
                            <span style={{ fontSize: '36px', fontWeight: '900', color: '#047857' }}>{kpis.avgResolucion}</span>
                            <span style={{ fontSize: '11px', color: '#34d399', fontWeight: '500' }}>Tiempo total transcurrido hasta resolver el caso</span>
                        </div>
                    </div>

                    {/* ============================================
                    GRID DE GRÁFICOS Y ANÁLISIS MEJORADOS
                    ============================================ */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
                        gap: '24px'
                    }}>
                        
                        {/* 1. TICKETS CREADOS */}
                        {displayCharts.creados && (
                            <div style={{
                                backgroundColor: 'white',
                                padding: '24px',
                                borderRadius: '16px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.03)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>📈 Tendencia de Tickets Creados</h3>
                                    <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
                                        {(['dia', 'semana', 'mes', 'ano'] as const).map((type) => (
                                            <button 
                                                key={type}
                                                onClick={() => setAgrupacionCreados(type)}
                                                style={{
                                                    padding: '5px 10px',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    fontSize: '11px',
                                                    fontWeight: '700',
                                                    cursor: 'pointer',
                                                    backgroundColor: agrupacionCreados === type ? 'white' : 'transparent',
                                                    color: agrupacionCreados === type ? '#2563eb' : '#64748b',
                                                    boxShadow: agrupacionCreados === type ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                                    transition: 'all 0.15s'
                                                }}
                                            >
                                                {type.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <SVGLineChart data={creadosChartData} color="#2563eb" gradientId="creadosGrad" />
                            </div>
                        )}

                        {/* 2. TICKETS RESUELTOS */}
                        {displayCharts.resueltos && (
                            <div style={{
                                backgroundColor: 'white',
                                padding: '24px',
                                borderRadius: '16px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.03)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>✅ Tickets Resueltos y Cerrados</h3>
                                    <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
                                        {(['dia', 'semana'] as const).map((type) => (
                                            <button 
                                                key={type}
                                                onClick={() => setAgrupacionResueltos(type)}
                                                style={{
                                                    padding: '5px 10px',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    fontSize: '11px',
                                                    fontWeight: '700',
                                                    cursor: 'pointer',
                                                    backgroundColor: agrupacionResueltos === type ? 'white' : 'transparent',
                                                    color: agrupacionResueltos === type ? '#10b981' : '#64748b',
                                                    boxShadow: agrupacionResueltos === type ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                                    transition: 'all 0.15s'
                                                }}
                                            >
                                                {type.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <SVGLineChart data={resueltosChartData} color="#10b981" gradientId="resueltosGrad" />
                            </div>
                        )}

                        {/* 3. ABIERTOS VS CERRADOS */}
                        {displayCharts.backlog && (
                            <div style={{
                                backgroundColor: 'white',
                                padding: '24px',
                                borderRadius: '16px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.03)'
                            }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', marginBottom: '20px' }}>📊 Backlog Comparativo</h3>
                                <SVGBarChart data={abiertosVsCerradosData} defaultColor="#3b82f6" gradientId="blueBarGrad" />
                            </div>
                        )}

                        {/* 4. ESTADO DE TICKETS */}
                        {displayCharts.estado && (
                            <div style={{
                                backgroundColor: 'white',
                                padding: '24px',
                                borderRadius: '16px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.03)'
                            }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', marginBottom: '20px' }}>🍩 Distribución por Estado</h3>
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
                                    <SVGDoughnutChart data={estadoChartData} />
                                </div>
                            </div>
                        )}

                        {/* 5. PRIORIDAD */}
                        {displayCharts.prioridad && (
                            <div style={{
                                backgroundColor: 'white',
                                padding: '24px',
                                borderRadius: '16px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.03)'
                            }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', marginBottom: '20px' }}>⚠️ Criticidad de Tickets</h3>
                                <SVGBarChart data={prioridadChartData} defaultColor="#f59e0b" gradientId="orangeBarGrad" />
                            </div>
                        )}

                        {/* 6. TICKETS POR AREA */}
                        {displayCharts.area && (
                            <div style={{
                                backgroundColor: 'white',
                                padding: '24px',
                                borderRadius: '16px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.03)'
                            }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', marginBottom: '20px' }}>🏢 Frecuencia por Área</h3>
                                <SVGHorizontalBarChart data={areaChartData} color="#8b5cf6" />
                            </div>
                        )}

                        {/* 7. TICKETS POR AGENTE */}
                        {displayCharts.agente && (
                            <div style={{
                                backgroundColor: 'white',
                                padding: '24px',
                                borderRadius: '16px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.03)'
                            }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', marginBottom: '20px' }}>👥 Carga de Trabajo por Agente</h3>
                                <SVGBarChart data={agenteChartData} defaultColor="#06b6d4" gradientId="cyanBarGrad" />
                            </div>
                        )}

                        {/* 9. ANTIGÜEDAD HISTOGRAMA */}
                        {displayCharts.antiguedad && (
                            <div style={{
                                backgroundColor: 'white',
                                padding: '24px',
                                borderRadius: '16px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.03)'
                            }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', marginBottom: '20px' }}>⏳ Antigüedad de Tickets Pendientes</h3>
                                <SVGBarChart data={antiguedadData} defaultColor="#f87171" gradientId="redBarGrad" />
                            </div>
                        )}
                    </div>

                    {/* 8. HEATMAP: TENDENCIA POR HORA DEL DÍA */}
                    {displayCharts.heatmap && (
                        <div style={{
                            backgroundColor: 'white',
                            padding: '24px',
                            borderRadius: '16px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.03)',
                            marginTop: '8px'
                        }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', marginBottom: '20px' }}>🔥 Mapa de Calor: Flujo de Incidencias por Hora (Picos)</h3>
                            {renderHeatmap()}
                        </div>
                    )}

                    {/* 10. TIEMPO DE USO Y ACTIVIDAD (SOLO SUPERADMIN) */}
                    <div style={{
                        backgroundColor: 'white',
                        padding: '24px',
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.03)',
                        marginTop: '24px'
                    }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            ⏱️ Tiempo de Uso y Actividad (SuperAdmin)
                        </h3>

                        {loadingUsage ? (
                            <p style={{ color: '#64748b' }}>Cargando estadísticas de tiempo...</p>
                        ) : !usageStats ? (
                            <p style={{ color: '#64748b' }}>No se registraron actividades de uso en el periodo seleccionado.</p>
                        ) : (
                            <div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                                    <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
                                        <span style={{ fontSize: '13px', color: '#1e3a8a', fontWeight: '600' }}>👑 Tiempo Total Admins</span>
                                        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e40af', margin: '8px 0 0 0' }}>
                                            {formatSeconds(usageStats.uso_por_rol?.find((r: any) => r.rol_grupo === 'admin')?.total_segundos || 0)}
                                        </h2>
                                    </div>
                                    <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                                        <span style={{ fontSize: '13px', color: '#14532d', fontWeight: '600' }}>👤 Tiempo Total Usuarios</span>
                                        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#166534', margin: '8px 0 0 0' }}>
                                            {formatSeconds(usageStats.uso_por_rol?.find((r: any) => r.rol_grupo === 'usuario')?.total_segundos || 0)}
                                        </h2>
                                    </div>
                                </div>

                                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>Agencia</th>
                                                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>Rol</th>
                                                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569', textAlign: 'right' }}>Tiempo de Uso</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {usageStats.uso_por_agencia && usageStats.uso_por_agencia.length > 0 ? (
                                                usageStats.uso_por_agencia.map((item: any, idx: number) => (
                                                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                        <td style={{ padding: '12px 16px', fontWeight: '500', color: '#0f172a' }}>{item.agencia_nombre}</td>
                                                        <td style={{ padding: '12px 16px' }}>
                                                            <span style={{
                                                                fontSize: '11px',
                                                                padding: '2px 8px',
                                                                borderRadius: '12px',
                                                                fontWeight: 'bold',
                                                                backgroundColor: item.rol_grupo === 'admin' ? '#dbeafe' : '#f1f5f9',
                                                                color: item.rol_grupo === 'admin' ? '#1e40af' : '#475569',
                                                                textTransform: 'uppercase'
                                                            }}>
                                                                {item.rol_grupo}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold', color: '#334155' }}>
                                                            {formatSeconds(item.total_segundos)}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={3} style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>
                                                        No hay registros de tiempo en este periodo.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div style={{ marginTop: '24px' }}>
                                    <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a', marginBottom: '12px' }}>
                                        👤 Detalle de Uso por Usuario
                                    </h4>
                                    <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                                            <thead>
                                                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                                    <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>Usuario</th>
                                                    <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>Agencia</th>
                                                    <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>Rol</th>
                                                    <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>Última Actividad</th>
                                                    <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569', textAlign: 'right' }}>Tiempo de Uso</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {usageStats.uso_por_usuario && usageStats.uso_por_usuario.length > 0 ? (
                                                    usageStats.uso_por_usuario.map((userItem: any, idx: number) => (
                                                        <tr key={userItem.usuario_id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                            <td style={{ padding: '12px 16px' }}>
                                                                <div style={{ fontWeight: '500', color: '#0f172a' }}>{userItem.nombre} {userItem.apellido}</div>
                                                                <div style={{ fontSize: '12px', color: '#64748b' }}>{userItem.email}</div>
                                                            </td>
                                                            <td style={{ padding: '12px 16px', color: '#334155' }}>{userItem.agencia_nombre}</td>
                                                            <td style={{ padding: '12px 16px' }}>
                                                                <span style={{
                                                                    fontSize: '11px',
                                                                    padding: '2px 8px',
                                                                    borderRadius: '12px',
                                                                    fontWeight: 'bold',
                                                                    backgroundColor: userItem.rol === 'admin' ? '#dbeafe' : '#f1f5f9',
                                                                    color: userItem.rol === 'admin' ? '#1e40af' : '#475569',
                                                                    textTransform: 'uppercase'
                                                                }}>
                                                                    {userItem.rol}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '12px 16px', color: '#64748b' }}>
                                                                {userItem.ultima_fecha ? new Date(userItem.ultima_fecha).toLocaleDateString() : 'N/A'}
                                                            </td>
                                                            <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold', color: '#2563eb' }}>
                                                                {formatSeconds(userItem.total_segundos)}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={5} style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>
                                                            No hay registros de usuarios en este periodo.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
