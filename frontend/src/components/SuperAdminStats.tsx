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
    const [chartCategory, setChartCategory] = useState<'todos' | 'tendencias' | 'kpis' | 'distribucion'>('kpis');
    const [activeSubTab, setActiveSubTab] = useState<'graficos' | 'tiempos'>('graficos');
    const [filterUsageRole, setFilterUsageRole] = useState<'all' | 'admin' | 'usuario'>('all');
    const [visibleCharts, setVisibleCharts] = useState({
        creados: true,
        resueltos: true,
        backlog: true,
        estado: true,
        prioridad: true,
        area: true,
        agente: true,
        antiguedad: true,
        heatmap: true,
        comparativo: true
    });

    // Toggle del panel de configuración de gráficos
    const [showConfigPanel, setShowConfigPanel] = useState<boolean>(false);
    const [expandedChart, setExpandedChart] = useState<string | null>(null);

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

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setExpandedChart(null);
            }
        };
        if (expandedChart) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [expandedChart]);

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
                heatmap: result.heatmap,
                comparativo: false
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
                heatmap: false,
                comparativo: result.comparativo
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
                heatmap: false,
                comparativo: result.comparativo
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

    const ticketsPorAgenciaData = useMemo(() => {
        const groups: { [key: string]: number } = {};
        // Inicializar las agencias seleccionadas en 0
        const selectedIds = selectedAgencias.includes('all') 
            ? agencias.map(a => String(a.id)) 
            : selectedAgencias;
            
        selectedIds.forEach(id => {
            const agency = agencias.find(a => String(a.id) === id);
            if (agency) {
                groups[agency.nombre] = 0;
            }
        });

        filteredTickets.forEach(t => {
            const agency = agencias.find(a => a.id === t.agencia_id);
            if (agency) {
                groups[agency.nombre] = (groups[agency.nombre] || 0) + 1;
            }
        });

        return Object.keys(groups).map(name => ({ label: name, value: groups[name] }));
    }, [filteredTickets, selectedAgencias, agencias]);

    const filteredUsageUsers = useMemo(() => {
        if (!usageStats?.uso_por_usuario) return [];
        return usageStats.uso_por_usuario.filter((u: any) => {
            if (filterUsageRole === 'all') return true;
            if (filterUsageRole === 'admin') return u.rol === 'admin';
            if (filterUsageRole === 'usuario') return u.rol === 'usuario';
            return true;
        });
    }, [usageStats?.uso_por_usuario, filterUsageRole]);

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
                        stroke="rgba(255, 255, 255, 0.08)" 
                        strokeWidth="1.2" 
                        strokeDasharray="4 4"
                    />
                    <text 
                        x={paddingLeft - 12} 
                        y={line.y + 4} 
                        fill="#cbd5e1" 
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
                            fill="#cbd5e1" 
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
                                    fill="#cbd5e1" 
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
        const paddingLeft = 160;
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
                                fill="#cbd5e1" 
                                fontSize="11" 
                                textAnchor="end"
                                fontFamily="system-ui"
                                fontWeight="600"
                            >
                                {d.label.length > 24 ? d.label.substring(0, 22) + '..' : d.label}
                            </text>

                            {/* Rectángulo de sombra / fondo */}
                            <rect 
                                x={paddingLeft} 
                                y={y} 
                                width={maxBarWidth} 
                                height={barHeight} 
                                fill="rgba(255, 255, 255, 0.04)" 
                                stroke="rgba(255, 255, 255, 0.08)"
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
                                fill="#ffffff" 
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            
            {/* ============================================
            CABECERA UNIFICADA DE NAVEGACIÓN Y FILTROS (SIN FONDO BLANCO)
            ============================================ */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                padding: '12px 0',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                paddingBottom: '20px'
            }}>
                {/* A LA IZQUIERDA: Selector Único de Categorías y Tiempos */}
                <div style={{ 
                    display: 'flex', 
                    gap: '4px', 
                    backgroundColor: 'rgba(15, 23, 42, 0.6)', 
                    padding: '4px', 
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                    {(['kpis', 'tendencias', 'distribucion', 'todos'] as const).map((cat) => (
                        <button
                            key={cat}
                            onClick={() => {
                                setActiveSubTab('graficos');
                                setChartCategory(cat);
                            }}
                            style={{
                                padding: '8px 16px',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                backgroundColor: activeSubTab === 'graficos' && chartCategory === cat ? '#2563eb' : 'transparent',
                                color: activeSubTab === 'graficos' && chartCategory === cat ? 'white' : '#94a3b8',
                                boxShadow: activeSubTab === 'graficos' && chartCategory === cat ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            {cat === 'kpis' && '🎯 KPIs'}
                            {cat === 'tendencias' && '📈 Tendencias'}
                            {cat === 'distribucion' && '📊 Distribución'}
                            {cat === 'todos' && '🌐 Todos'}
                        </button>
                    ))}
                    <button
                        onClick={() => setActiveSubTab('tiempos')}
                        style={{
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            backgroundColor: activeSubTab === 'tiempos' ? '#2563eb' : 'transparent',
                            color: activeSubTab === 'tiempos' ? 'white' : '#94a3b8',
                            boxShadow: activeSubTab === 'tiempos' ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        ⏱️ Tiempos de Uso
                    </button>
                </div>

                {/* A LA DERECHA: Filtros Generales */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                    {/* Selector de Agencias */}
                    <div style={{ position: 'relative' }}>
                        <div 
                            onClick={() => setShowAgencyDropdown(!showAgencyDropdown)}
                            style={{
                                padding: '10px 14px',
                                borderRadius: '8px',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                fontSize: '13px',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                cursor: 'pointer',
                                display: 'flex',
                                gap: '8px',
                                alignItems: 'center',
                                fontWeight: '600',
                                color: 'white',
                                userSelect: 'none'
                            }}
                        >
                            <span>🏢 {agencyDropdownText}</span>
                            <span style={{ fontSize: '10px', transition: 'transform 0.2s', transform: showAgencyDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                        </div>

                        {showAgencyDropdown && (
                            <>
                                <div 
                                    onClick={() => setShowAgencyDropdown(false)} 
                                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} 
                                />
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    marginTop: '6px',
                                    width: '260px',
                                    maxHeight: '260px',
                                    overflowY: 'auto',
                                    backgroundColor: 'white',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                    zIndex: 1000,
                                    padding: '6px 0'
                                }}>
                                    <div 
                                        onClick={() => handleAgencySelect('all')}
                                        style={{
                                            padding: '10px 14px',
                                            cursor: 'pointer',
                                            fontWeight: '700',
                                            color: selectedAgencias.includes('all') ? '#2563eb' : '#334155',
                                            backgroundColor: selectedAgencias.includes('all') ? '#eff6ff' : 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            borderBottom: '1px solid #f1f5f9'
                                        }}
                                    >
                                        <input type="checkbox" checked={selectedAgencias.includes('all')} readOnly />
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
                                                    color: isSelected ? '#2563eb' : '#334155',
                                                    fontWeight: isSelected ? '600' : '500'
                                                }}
                                            >
                                                <input type="checkbox" checked={isSelected} readOnly />
                                                <span>{ag.nombre}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Rango Predefinido */}
                    <div>
                        <select 
                            value={datePreset}
                            onChange={(e) => setDatePreset(e.target.value)}
                            style={{
                                padding: '10px 12px',
                                borderRadius: '8px',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                fontSize: '13px',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                color: 'white',
                                fontWeight: '600',
                                outline: 'none'
                            }}
                        >
                            <option value="last7" style={{ color: '#0f172a' }}>Últimos 7 días</option>
                            <option value="last30" style={{ color: '#0f172a' }}>Últimos 30 días</option>
                            <option value="thisMonth" style={{ color: '#0f172a' }}>Este mes</option>
                            <option value="thisYear" style={{ color: '#0f172a' }}>Este año</option>
                            <option value="custom" style={{ color: '#0f172a' }}>Personalizado...</option>
                            <option value="all" style={{ color: '#0f172a' }}>Todo el historial</option>
                        </select>
                    </div>

                    {/* Fechas personalizadas */}
                    {datePreset === 'custom' && (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input 
                                type="date" 
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                                style={{
                                    padding: '8px 10px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    fontSize: '13px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    color: 'white',
                                    fontWeight: '600'
                                }}
                            />
                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>al</span>
                            <input 
                                type="date" 
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                                style={{
                                    padding: '8px 10px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    fontSize: '13px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    color: 'white',
                                    fontWeight: '600'
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* FILTROS INTERACTIVOS LOCALES (CASCADA) */}
            {activeSubTab === 'graficos' && (
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
            )}

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid #cbd5e1', borderTopColor: '#2563eb', animation: 'spin 1s linear infinite' }} />
                    <span style={{ color: '#475569', fontSize: '14px', fontWeight: '600' }}>Cargando datos estadísticos...</span>
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                </div>
            ) : (
                <>
                    {activeSubTab === 'graficos' && (
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
                            backgroundColor: 'rgba(30, 41, 59, 0.45)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
                            padding: '24px',
                            borderRadius: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#94a3b8' }} />
                            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '800', letterSpacing: '0.5px' }}>TICKETS EN EL RANGO</span>
                            <span style={{ fontSize: '36px', fontWeight: '900', color: '#ffffff', fontFamily: 'system-ui' }}>{kpis.totalCount}</span>
                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>Volumen correspondiente a los filtros activos</span>
                        </div>

                        {/* KPI Primera Respuesta */}
                        <div style={{
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(59, 130, 246, 0.25)',
                            boxShadow: '0 8px 32px 0 rgba(59, 130, 246, 0.15)',
                            padding: '24px',
                            borderRadius: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#3b82f6' }} />
                            <span style={{ fontSize: '12px', color: '#93c5fd', fontWeight: '800', letterSpacing: '0.5px' }}>⏱️ PROM. PRIMERA RESPUESTA</span>
                            <span style={{ fontSize: '36px', fontWeight: '900', color: '#60a5fa' }}>{kpis.avgPrimeraRespuesta}</span>
                            <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: '500' }}>Velocidad inicial de atención de soporte</span>
                        </div>

                        {/* KPI Resolución/Cierre */}
                        <div style={{
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            boxShadow: '0 8px 32px 0 rgba(16, 185, 129, 0.15)',
                            padding: '24px',
                            borderRadius: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#10b981' }} />
                            <span style={{ fontSize: '12px', color: '#a7f3d0', fontWeight: '800', letterSpacing: '0.5px' }}>⏱️ PROM. CIERRE / RESOLUCIÓN</span>
                            <span style={{ fontSize: '36px', fontWeight: '900', color: '#34d399' }}>{kpis.avgResolucion}</span>
                            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '500' }}>Tiempo total transcurrido hasta resolver el caso</span>
                        </div>
                    </div>

                    {/* ============================================
                    {/* ============================================
                    GRID DE GRÁFICOS Y ANÁLISIS MEJORADOS
                    ============================================ */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
                        gap: '24px'
                    }}>
                        {/* 0. COMPARATIVA ENTRE AGENCIAS (VISTA COMPARATIVA) */}
                        {displayCharts.comparativo && (
                            <div 
                                onDoubleClick={() => setExpandedChart('comparativo')}
                                title="Doble clic para ampliar gráfico"
                                style={{
                                    backgroundColor: 'rgba(30, 41, 59, 0.45)',
                                    backdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)',
                                    borderRadius: '16px',
                                    padding: '24px',
                                    transition: 'all 0.2s',
                                    gridColumn: '1 / -1',
                                    cursor: 'zoom-in'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff', marginBottom: '20px' }}>
                                    📊 Volumen Comparativo por Agencia (Tickets de Soporte)
                                </h3>
                                <div style={{ height: '300px' }}>
                                    <SVGBarChart data={ticketsPorAgenciaData} defaultColor="#3b82f6" gradientId="agencyBarGrad" />
                                </div>
                            </div>
                        )}
                        
                        {/* 1. TICKETS CREADOS */}
                        {displayCharts.creados && (
                            <div 
                                onDoubleClick={() => setExpandedChart('creados')}
                                title="Doble clic para ampliar gráfico"
                                style={{
                                    backgroundColor: 'rgba(30, 41, 59, 0.45)',
                                    backdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)',
                                    borderRadius: '16px',
                                    padding: '24px',
                                    transition: 'all 0.2s',
                                    cursor: 'zoom-in'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff' }}>📈 Tendencia de Tickets Creados</h3>
                                    <div style={{ display: 'flex', gap: '4px', backgroundColor: 'rgba(15, 23, 42, 0.5)', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
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
                                                    backgroundColor: agrupacionCreados === type ? '#2563eb' : 'transparent',
                                                    color: agrupacionCreados === type ? 'white' : '#94a3b8',
                                                    boxShadow: agrupacionCreados === type ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
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
                            <div 
                                onDoubleClick={() => setExpandedChart('resueltos')}
                                title="Doble clic para ampliar gráfico"
                                style={{
                                    backgroundColor: 'rgba(30, 41, 59, 0.45)',
                                    backdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)',
                                    borderRadius: '16px',
                                    padding: '24px',
                                    transition: 'all 0.2s',
                                    cursor: 'zoom-in'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff' }}>✅ Tickets Resueltos y Cerrados</h3>
                                    <div style={{ display: 'flex', gap: '4px', backgroundColor: 'rgba(15, 23, 42, 0.5)', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
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
                                                    backgroundColor: agrupacionResueltos === type ? '#10b981' : 'transparent',
                                                    color: agrupacionResueltos === type ? 'white' : '#94a3b8',
                                                    boxShadow: agrupacionResueltos === type ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
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
                            <div 
                                onDoubleClick={() => setExpandedChart('backlog')}
                                title="Doble clic para ampliar gráfico"
                                style={{
                                    backgroundColor: 'rgba(30, 41, 59, 0.45)',
                                    backdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)',
                                    borderRadius: '16px',
                                    padding: '24px',
                                    transition: 'all 0.2s',
                                    cursor: 'zoom-in'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff', marginBottom: '20px' }}>📊 Backlog Comparativo</h3>
                                <SVGBarChart data={abiertosVsCerradosData} defaultColor="#3b82f6" gradientId="blueBarGrad" />
                            </div>
                        )}

                        {/* 4. ESTADO DE TICKETS */}
                        {displayCharts.estado && (
                            <div 
                                onDoubleClick={() => setExpandedChart('estado')}
                                title="Doble clic para ampliar gráfico"
                                style={{
                                    backgroundColor: 'rgba(30, 41, 59, 0.45)',
                                    backdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)',
                                    borderRadius: '16px',
                                    padding: '24px',
                                    transition: 'all 0.2s',
                                    cursor: 'zoom-in'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff', marginBottom: '20px' }}>🍩 Distribución por Estado</h3>
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
                                    <SVGDoughnutChart data={estadoChartData} />
                                </div>
                            </div>
                        )}

                        {/* 5. PRIORIDAD */}
                        {displayCharts.prioridad && (
                            <div 
                                onDoubleClick={() => setExpandedChart('prioridad')}
                                title="Doble clic para ampliar gráfico"
                                style={{
                                    backgroundColor: 'rgba(30, 41, 59, 0.45)',
                                    backdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)',
                                    borderRadius: '16px',
                                    padding: '24px',
                                    transition: 'all 0.2s',
                                    cursor: 'zoom-in'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff', marginBottom: '20px' }}>⚠️ Criticidad de Tickets</h3>
                                <SVGBarChart data={prioridadChartData} defaultColor="#f59e0b" gradientId="orangeBarGrad" />
                            </div>
                        )}

                        {/* 6. TICKETS POR AREA */}
                        {displayCharts.area && (
                            <div 
                                onDoubleClick={() => setExpandedChart('area')}
                                title="Doble clic para ampliar gráfico"
                                style={{
                                    backgroundColor: 'rgba(30, 41, 59, 0.45)',
                                    backdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)',
                                    borderRadius: '16px',
                                    padding: '24px',
                                    transition: 'all 0.2s',
                                    cursor: 'zoom-in'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff', marginBottom: '20px' }}>🏢 Frecuencia por Área</h3>
                                <SVGBarChart data={areaChartData} defaultColor="#8b5cf6" gradientId="purpleBarGrad" />
                            </div>
                        )}

                        {/* 7. TICKETS POR AGENTE */}
                        {displayCharts.agente && (
                            <div 
                                onDoubleClick={() => setExpandedChart('agente')}
                                title="Doble clic para ampliar gráfico"
                                style={{
                                    backgroundColor: 'rgba(30, 41, 59, 0.45)',
                                    backdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)',
                                    borderRadius: '16px',
                                    padding: '24px',
                                    transition: 'all 0.2s',
                                    cursor: 'zoom-in'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff', marginBottom: '20px' }}>👥 Carga de Trabajo por Agente</h3>
                                <SVGBarChart data={agenteChartData} defaultColor="#06b6d4" gradientId="cyanBarGrad" />
                            </div>
                        )}

                        {/* 9. ANTIGÜEDAD HISTOGRAMA */}
                        {displayCharts.antiguedad && (
                            <div 
                                onDoubleClick={() => setExpandedChart('antiguedad')}
                                title="Doble clic para ampliar gráfico"
                                style={{
                                    backgroundColor: 'rgba(30, 41, 59, 0.45)',
                                    backdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)',
                                    borderRadius: '16px',
                                    padding: '24px',
                                    transition: 'all 0.2s',
                                    cursor: 'zoom-in'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff', marginBottom: '20px' }}>⏳ Antigüedad de Tickets Pendientes</h3>
                                <SVGBarChart data={antiguedadData} defaultColor="#f87171" gradientId="redBarGrad" />
                            </div>
                        )}
                    </div>

                    {/* 8. HEATMAP: TENDENCIA POR HORA DEL DÍA */}
                    {displayCharts.heatmap && (
                        <div 
                            onDoubleClick={() => setExpandedChart('heatmap')}
                            title="Doble clic para ampliar gráfico"
                            style={{
                                backgroundColor: 'rgba(30, 41, 59, 0.45)',
                                backdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)',
                                borderRadius: '16px',
                                padding: '24px',
                                transition: 'all 0.2s',
                                marginTop: '24px',
                                cursor: 'zoom-in'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff', marginBottom: '20px' }}>🔥 Mapa de Calor: Flujo de Incidencias por Hora (Picos)</h3>
                            {renderHeatmap()}
                        </div>
                    )}
                    </>
                )}

                {activeSubTab === 'tiempos' && (
                        <div style={{
                            backgroundColor: 'rgba(30, 41, 59, 0.45)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)',
                            borderRadius: '16px',
                            padding: '24px',
                            marginTop: '24px'
                        }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                ⏱️ Tiempo de Uso y Actividad (SuperAdmin)
                            </h3>

                            {loadingUsage ? (
                                <p style={{ color: '#94a3b8' }}>Cargando estadísticas de tiempo...</p>
                            ) : !usageStats ? (
                                <p style={{ color: '#94a3b8' }}>No se registraron actividades de uso en el periodo seleccionado.</p>
                            ) : (
                                <div>
                                    {/* Indicadores Resumen */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                                        <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                                            <span style={{ fontSize: '13px', color: '#93c5fd', fontWeight: '600' }}>👑 Tiempo Total Admins</span>
                                            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#60a5fa', margin: '8px 0 0 0' }}>
                                                {formatSeconds(usageStats.uso_por_rol?.find((r: any) => r.rol_grupo === 'admin')?.total_segundos || 0)}
                                            </h2>
                                        </div>
                                        <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                                            <span style={{ fontSize: '13px', color: '#a7f3d0', fontWeight: '600' }}>👤 Tiempo Total Usuarios</span>
                                            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#34d399', margin: '8px 0 0 0' }}>
                                                {formatSeconds(usageStats.uso_por_rol?.find((r: any) => r.rol_grupo === 'usuario')?.total_segundos || 0)}
                                            </h2>
                                        </div>
                                    </div>

                                    {/* Tabla 1: Tiempos por Agencia (Con Scroll) */}
                                    <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                                            <thead>
                                                <tr style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                                    <th style={{ padding: '12px 16px', fontWeight: '600', color: '#cbd5e1' }}>Agencia</th>
                                                    <th style={{ padding: '12px 16px', fontWeight: '600', color: '#cbd5e1' }}>Rol</th>
                                                    <th style={{ padding: '12px 16px', fontWeight: '600', color: '#cbd5e1', textAlign: 'right' }}>Tiempo de Uso</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {usageStats.uso_por_agencia && usageStats.uso_por_agencia.length > 0 ? (
                                                    usageStats.uso_por_agencia.map((item: any, idx: number) => (
                                                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                                            <td style={{ padding: '12px 16px', fontWeight: '500', color: '#f8fafc' }}>{item.agencia_nombre}</td>
                                                            <td style={{ padding: '12px 16px' }}>
                                                                <span style={{
                                                                    fontSize: '11px',
                                                                    padding: '2px 8px',
                                                                    borderRadius: '12px',
                                                                    fontWeight: 'bold',
                                                                    backgroundColor: item.rol_grupo === 'admin' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                                                                    color: item.rol_grupo === 'admin' ? '#93c5fd' : '#cbd5e1',
                                                                    textTransform: 'uppercase'
                                                                }}>
                                                                    {item.rol_grupo}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold', color: '#e2e8f0' }}>
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

                                    {/* Tabla 2: Detalle de Uso por Usuario con Filtro (Con Scroll) */}
                                    <div style={{ marginTop: '24px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                                            <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>
                                                👤 Detalle de Uso por Usuario
                                            </h4>
                                            {/* Filtro de rol en línea */}
                                            <div style={{ display: 'flex', gap: '4px', backgroundColor: 'rgba(15, 23, 42, 0.5)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                                {(['all', 'admin', 'usuario'] as const).map((role) => (
                                                    <button
                                                        key={role}
                                                        onClick={() => setFilterUsageRole(role)}
                                                        style={{
                                                            padding: '4px 10px',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            fontSize: '11px',
                                                            fontWeight: '700',
                                                            cursor: 'pointer',
                                                            backgroundColor: filterUsageRole === role ? '#2563eb' : 'transparent',
                                                            color: filterUsageRole === role ? 'white' : '#94a3b8',
                                                            transition: 'all 0.15s'
                                                        }}
                                                    >
                                                        {role === 'all' && '👤 Todos'}
                                                        {role === 'admin' && '👑 Admins'}
                                                        {role === 'usuario' && '👥 Usuarios'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div style={{ maxHeight: '320px', overflowY: 'auto', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                                                <thead>
                                                    <tr style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                                        <th style={{ padding: '12px 16px', fontWeight: '600', color: '#cbd5e1' }}>Usuario</th>
                                                        <th style={{ padding: '12px 16px', fontWeight: '600', color: '#cbd5e1' }}>Agencia</th>
                                                        <th style={{ padding: '12px 16px', fontWeight: '600', color: '#cbd5e1' }}>Rol</th>
                                                        <th style={{ padding: '12px 16px', fontWeight: '600', color: '#cbd5e1' }}>Última Actividad</th>
                                                        <th style={{ padding: '12px 16px', fontWeight: '600', color: '#cbd5e1', textAlign: 'right' }}>Tiempo de Uso</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredUsageUsers && filteredUsageUsers.length > 0 ? (
                                                        filteredUsageUsers.map((userItem: any, idx: number) => (
                                                            <tr key={userItem.usuario_id || idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                                                <td style={{ padding: '12px 16px' }}>
                                                                    <div style={{ fontWeight: '500', color: '#f8fafc' }}>{userItem.nombre} {userItem.apellido}</div>
                                                                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{userItem.email}</div>
                                                                </td>
                                                                <td style={{ padding: '12px 16px', color: '#e2e8f0' }}>{userItem.agencia_nombre}</td>
                                                                <td style={{ padding: '12px 16px' }}>
                                                                    <span style={{
                                                                        fontSize: '11px',
                                                                        padding: '2px 8px',
                                                                        borderRadius: '12px',
                                                                        fontWeight: 'bold',
                                                                        backgroundColor: userItem.rol === 'admin' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                                                                        color: userItem.rol === 'admin' ? '#93c5fd' : '#cbd5e1',
                                                                        textTransform: 'uppercase'
                                                                    }}>
                                                                        {userItem.rol}
                                                                    </span>
                                                                </td>
                                                                <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>
                                                                    {userItem.ultima_fecha ? new Date(userItem.ultima_fecha).toLocaleDateString() : 'N/A'}
                                                                </td>
                                                                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold', color: '#60a5fa' }}>
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
                    )}
                </>
            )}

            {/* Modal de Gráfico Ampliado (Doble clic) */}
            {expandedChart && (
                <div 
                    onClick={() => setExpandedChart(null)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(9, 13, 22, 0.85)',
                        backdropFilter: 'blur(16px)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '24px',
                        animation: 'fadeIn 0.25s ease'
                    }}
                >
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: '100%',
                            maxWidth: '900px',
                            backgroundColor: 'rgba(30, 41, 59, 0.75)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: '24px',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
                            padding: '32px',
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px'
                        }}
                    >
                        {/* Botón de Cerrar */}
                        <button 
                            onClick={() => setExpandedChart(null)}
                            style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                color: '#ffffff',
                                fontSize: '18px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                        >
                            ✕
                        </button>

                        {/* Título de Gráfico */}
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', margin: 0, paddingRight: '40px' }}>
                            {expandedChart === 'comparativo' && '📊 Volumen Comparativo por Agencia (Tickets de Soporte)'}
                            {expandedChart === 'creados' && '📈 Tendencia de Tickets Creados'}
                            {expandedChart === 'resueltos' && '✅ Tickets Resueltos y Cerrados'}
                            {expandedChart === 'backlog' && '📊 Backlog Comparativo'}
                            {expandedChart === 'estado' && '🍩 Distribución por Estado'}
                            {expandedChart === 'prioridad' && '⚠️ Criticidad de Tickets'}
                            {expandedChart === 'area' && '🏢 Frecuencia por Área'}
                            {expandedChart === 'agente' && '👥 Carga de Trabajo por Agente'}
                            {expandedChart === 'antiguedad' && '⏳ Antigüedad de Tickets Pendientes'}
                            {expandedChart === 'heatmap' && '🔥 Mapa de Calor: Flujo de Incidencias por Hora'}
                        </h2>

                        {/* Gráfico Renderizado a Gran Escala */}
                        <div style={{ 
                            width: '100%', 
                            height: '420px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            backgroundColor: 'rgba(15, 23, 42, 0.3)',
                            borderRadius: '16px',
                            padding: '20px',
                            border: '1px solid rgba(255, 255, 255, 0.04)',
                            overflow: 'visible'
                        }}>
                            {expandedChart === 'comparativo' && (
                                <SVGBarChart data={ticketsPorAgenciaData} defaultColor="#3b82f6" gradientId="agencyBarGradModal" />
                            )}
                            {expandedChart === 'creados' && (
                                <SVGLineChart data={creadosChartData} color="#2563eb" gradientId="creadosGradModal" />
                            )}
                            {expandedChart === 'resueltos' && (
                                <SVGLineChart data={resueltosChartData} color="#10b981" gradientId="resueltosGradModal" />
                            )}
                            {expandedChart === 'backlog' && (
                                <SVGBarChart data={abiertosVsCerradosData} defaultColor="#3b82f6" gradientId="blueBarGradModal" />
                            )}
                            {expandedChart === 'estado' && (
                                <SVGDoughnutChart data={estadoChartData} />
                            )}
                            {expandedChart === 'prioridad' && (
                                <SVGBarChart data={prioridadChartData} defaultColor="#f59e0b" gradientId="orangeBarGradModal" />
                            )}
                            {expandedChart === 'area' && (
                                <SVGBarChart data={areaChartData} defaultColor="#8b5cf6" gradientId="purpleBarGradModal" />
                            )}
                            {expandedChart === 'agente' && (
                                <SVGBarChart data={agenteChartData} defaultColor="#06b6d4" gradientId="cyanBarGradModal" />
                            )}
                            {expandedChart === 'antiguedad' && (
                                <SVGBarChart data={antiguedadData} defaultColor="#f87171" gradientId="redBarGradModal" />
                            )}
                            {expandedChart === 'heatmap' && (
                                <div style={{ width: '100%' }}>{renderHeatmap()}</div>
                            )}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', marginTop: '-10px' }}>
                            💡 Presiona ESC o haz clic afuera para cerrar la vista ampliada.
                        </div>
                    </div>
                    <style>{`
                        @keyframes fadeIn {
                            from { opacity: 0; transform: scale(0.98); }
                            to { opacity: 1; transform: scale(1); }
                        }
                    `}</style>
                </div>
            )}
        </div>
    );
};
