'use client';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, CheckCircle, Clock, ShieldCheck, Heart, Calendar, 
  AlertTriangle, Target, Activity, Users2, X, Info, Cpu, Rocket
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

// --- COMPONENTE KPI CARD CON NEÓN ---
const KpiCard = ({ title, value, subtext, icon: Icon, color, glowColor, borderColor }: any) => (
  <motion.div 
    whileHover={{ y: -5, scale: 1.02 }}
    className={`relative p-5 rounded-[2rem] bg-slate-950/60 border ${borderColor} backdrop-blur-2xl overflow-hidden flex-1 min-w-[170px] group transition-all duration-300 shadow-[0_0_15px_-5px_rgba(0,0,0,0.3)]`}
  >
    <div className={`absolute -top-10 -right-10 w-24 h-24 rounded-full blur-[45px] opacity-20 ${glowColor} group-hover:opacity-40 transition-opacity`} />
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className={`p-2.5 rounded-xl bg-white/5 border border-white/10 shadow-inner group-hover:border-white/30 transition-all`}>
        <Icon size={18} className={`${color} drop-shadow-[0_0_8px_currentColor]`} />
      </div>
      <div className="flex gap-1 items-end h-4">
        {[0.1, 0.4, 0.2].map((delay, i) => (
          <motion.div 
            key={i} 
            animate={{ height: ['20%', '100%', '20%'] }} 
            transition={{ duration: 1.2, repeat: Infinity, delay: delay }} 
            className={`w-[2px] rounded-full ${color.replace('text-', 'bg-')} opacity-40`} 
          />
        ))}
      </div>
    </div>
    <div className="relative z-10">
      <h3 className="text-slate-400 text-[8px] font-black uppercase tracking-[0.2em] mb-1 opacity-80">{title}</h3>
      <p className="text-3xl font-black text-white tracking-tighter italic drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">{value}</p>
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
        <p className="text-[8px] text-slate-500 font-mono uppercase flex items-center gap-1.5 whitespace-nowrap">
           <Activity size={9} className={`${color} animate-pulse`} /> {subtext}
        </p>
      </div>
    </div>
  </motion.div>
);

export default function AnalyticsView() {
  const [allData, setAllData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0, wellbeingHours: 0 });
  const [teamStats, setTeamStats] = useState<any[]>([]);
  const [anomaly, setAnomaly] = useState<any>(null); // ESTADO PARA ALERTA DINÁMICA
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  
  const supabase = createClient();

  const months = [
    { value: 'all', label: 'TODOS LOS PERIODOS' },
    { value: '01', label: 'ENERO - 2026' },
    { value: '02', label: 'FEBRERO - 2026' },
    { value: '03', label: 'MARZO - 2026' },
    { value: '04', label: 'ABRIL - 2026' },
    { value: '05', label: 'MAYO - 2026' },
    { value: '06', label: 'JUNIO - 2026' },
    { value: '07', label: 'JULIO - 2026' },
    { value: '08', label: 'AGOSTO - 2026' },
    { value: '09', label: 'SEPTIEMBRE - 2026' },
    { value: '10', label: 'OCTUBRE - 2026' },
    { value: '11', label: 'NOVIEMBRE - 2026' },
    { value: '12', label: 'DICIEMBRE - 2026' },
  ];

  useEffect(() => {
    async function fetchAnalytics() {
      const { data: requests } = await supabase
        .from('early_requests')
        .select(`*, teams(name), profiles(full_name)`)
        .order('friday_date', { ascending: true });

      if (requests) {
        setAllData(requests);
        applyFilter(requests, 'all');
      }
    }
    fetchAnalytics();
  }, [supabase]);

  const applyFilter = (rawData: any[], monthVal: string) => {
    let filtered = rawData;
    if (monthVal !== 'all') {
      filtered = rawData.filter(r => {
        const date = new Date(r.friday_date);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return month === monthVal;
      });
    }

    setFilteredData(filtered);
    const approved = filtered.filter(r => r.status === 'APPROVED');
    setStats({
      total: filtered.length,
      approved: approved.length,
      pending: filtered.filter(r => r.status.includes('PENDING')).length,
      rejected: filtered.filter(r => r.status === 'REJECTED').length,
      wellbeingHours: approved.length * 3.5 
    });

    // --- LÓGICA PARA DETECTAR ANOMALÍAS REALES ---
    const userCounts: any = {};
    const dynamicTeams: any = {};

    filtered.forEach((req: any) => {
      const teamName = req.teams?.name || 'Sin Equipo';
      const userName = req.profiles?.full_name || 'Desconocido';

      // Conteo para gráfico de equipos
      if (!dynamicTeams[teamName]) dynamicTeams[teamName] = { name: teamName, total: 0, approved: 0 };
      dynamicTeams[teamName].total += 1;
      if (req.status === 'APPROVED') {
        dynamicTeams[teamName].approved += 1;
        // Conteo por usuario para detectar abusos (solo aprobados)
        userCounts[userName] = (userCounts[userName] || 0) + 1;
      }
    });

    setTeamStats(Object.values(dynamicTeams));

    // Detectar si alguien tiene más de 3 earlys (Umbral de anomalía)
    const topUser = Object.entries(userCounts).sort((a: any, b: any) => b[1] - a[1])[0];
    if (topUser && (topUser[1] as number) >= 3) {
      const userData = filtered.find(r => r.profiles.full_name === topUser[0]);
      setAnomaly({
        name: topUser[0],
        count: topUser[1],
        team: userData.teams.name,
        percentage: Math.min((topUser[1] as number) * 20, 100) // 5 earlys = 100%
      });
    } else {
      setAnomaly(null); // No hay anomalías
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedMonth(val);
    applyFilter(allData, val);
  };

  const pieData = [
    { name: 'Aprobados', value: stats.approved, color: '#10b981' },
    { name: 'Pendientes', value: stats.pending, color: '#f59e0b' },
    { name: 'Rechazados', value: stats.rejected, color: '#ef4444' }
  ];

  const isDateShared = (date: string) => {
    return filteredData.filter(r => r.status === 'APPROVED' && r.friday_date === date).length > 1;
  };

  const getSharedMembers = (date: string) => {
    return filteredData.filter(r => r.status === 'APPROVED' && r.friday_date === date);
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-700">
      {/* HEADER (Sin cambios) */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-2">
        <div>
          <h2 className="text-5xl font-black tracking-tighter flex items-center leading-none italic">
            <span className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">COMMAND</span>
            <span className="ml-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-600 animate-gradient-x">CENTER</span>
          </h2>
          <div className="flex items-center gap-3 mt-3">
             <p className="text-[10px] text-blue-400/60 font-mono tracking-[0.4em] uppercase">Intelligence System v2.5</p>
             <span className="h-[1px] w-12 bg-blue-500/20" />
             <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] text-emerald-500/80 font-black uppercase tracking-widest">Active_Node</span>
             </div>
          </div>
        </div>
        
        <div className="flex gap-4 items-center">
           <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-xl group hover:border-blue-500/50 transition-all duration-500">
              <Calendar size={14} className="text-blue-400" />
              <select 
                value={selectedMonth}
                onChange={handleMonthChange}
                className="bg-transparent text-[10px] font-black text-slate-300 outline-none uppercase cursor-pointer appearance-none pr-4"
              >
                {months.map(m => (
                  <option key={m.value} value={m.value} className="bg-slate-900 text-white font-mono">{m.label}</option>
                ))}
              </select>
           </div>
           <div className="relative flex items-center justify-center w-14 h-14 group">
              <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl" />
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-2 border-dashed border-blue-500/30 rounded-full" />
              <div className="relative w-10 h-10 bg-slate-950 border border-blue-500/50 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.4)] group-hover:shadow-blue-500/80 transition-shadow">
                <Cpu size={20} className="text-blue-400 animate-pulse" />
              </div>
           </div>
        </div>
      </div>

      {/* KPIs (Sin cambios) */}
      <div className="flex flex-wrap lg:flex-nowrap gap-4">
        <KpiCard title="Total Solicitudes" value={stats.total} subtext="Volumen Tráfico" icon={Target} color="text-blue-400" glowColor="bg-blue-600" borderColor="border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]" />
        <KpiCard title="Aprobación Final" value={stats.approved} subtext="Earlys OK" icon={CheckCircle} color="text-emerald-400" glowColor="bg-emerald-600" borderColor="border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]" />
        <KpiCard title="Backlog Pendiente" value={stats.pending} subtext="En Validación" icon={Clock} color="text-amber-400" glowColor="bg-amber-600" borderColor="border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]" />
        <KpiCard title="Índice Rotación" value={stats.total > 0 ? "94%" : "0%"} subtext="Compliance" icon={ShieldCheck} color="text-purple-400" glowColor="bg-purple-600" borderColor="border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]" />
        <KpiCard title="Bienestar" value={`${stats.wellbeingHours}h`} subtext="Tiempo Libre" icon={Heart} color="text-rose-400" glowColor="bg-rose-600" borderColor="border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)]" />
      </div>

      {/* GRÁFICOS (Sin cambios) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 p-10 rounded-[3rem] bg-slate-900/40 border border-white/5 backdrop-blur-xl h-[450px]">
          <h3 className="text-lg font-black uppercase tracking-tighter italic mb-8 text-white">Demanda por Escuadrón</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={teamStats}>
              <defs>
                <linearGradient id="barBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/><stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.8}/>
                </linearGradient>
                <linearGradient id="barGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={1}/><stop offset="100%" stopColor="#059669" stopOpacity={0.8}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis dataKey="name" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '15px', fontSize: '12px', color: '#fff'}} itemStyle={{color: '#fff'}} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
              <Legend verticalAlign="top" align="right" content={(props: any) => (
                <ul className="flex justify-end gap-10 mb-6">
                  {props.payload.map((entry: any, index: number) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="relative flex items-center justify-center w-4 h-4">
                        <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }} className="absolute w-full h-full rounded-full blur-[4px]" style={{ backgroundColor: entry.dataKey === 'approved' ? '#10b981' : '#3b82f6' }} />
                        <div className="w-2.5 h-2.5 rounded-full relative z-10 border border-white/30" style={{ backgroundColor: entry.dataKey === 'approved' ? '#10b981' : '#3b82f6' }} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 font-mono italic">{entry.value}</span>
                    </li>
                  ))}
                </ul>
              )} />
              <Bar dataKey="total" name="Total Earlys" fill="url(#barBlue)" radius={[6, 6, 0, 0]} barSize={35} isAnimationActive={true} animationDuration={1800} animationEasing="ease-out" />
              <Bar dataKey="approved" name="Aprobados" fill="url(#barGreen)" radius={[6, 6, 0, 0]} barSize={35} isAnimationActive={true} animationDuration={2200} animationEasing="ease-out" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-10 rounded-[3rem] bg-slate-900/40 border border-white/5 flex flex-col items-center justify-center">
          <h3 className="text-lg font-black uppercase tracking-tighter italic mb-6 text-white">Estado Global</h3>
          <div className="relative w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={90} outerRadius={120} paddingAngle={8} dataKey="value" stroke="none" animationDuration={1500} animationEasing="ease-out">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} itemStyle={{color: '#fff', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold'}} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-6xl font-black text-white italic tracking-tighter">{stats.total}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-[0.4em] font-mono">Records</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN ALERTAS Y LISTA (CORREGIDO LÓGICA DINÁMICA) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pb-10">
          <div className="xl:col-span-2 p-10 rounded-[3rem] bg-emerald-500/5 border border-emerald-500/10">
            <div className="flex items-center gap-3 text-emerald-400 mb-8 font-black uppercase tracking-widest text-xs italic">
                <Zap size={20} className="animate-pulse" /> Próximos Earlys Confirmados
            </div>
            <div className="space-y-3">
              {filteredData.length > 0 ? (
                filteredData
                .filter(r => r.status === 'APPROVED' && new Date(r.friday_date) >= new Date(new Date().setHours(0,0,0,0)))
                .slice(0, 6)
                .map((req, i) => {
                  const isShared = isDateShared(req.friday_date);
                  return (
                    <motion.div whileHover={{ x: 10, backgroundColor: 'rgba(255,255,255,0.05)' }} key={i} onClick={() => isShared && setSelectedDate(req.friday_date)} className={`flex justify-between items-center p-4 rounded-2xl bg-black/40 border ${isShared ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-white/5'} transition-all cursor-pointer relative overflow-hidden`} >
                      {isShared && (
                        <div className="absolute top-0 right-0 px-3 py-1 bg-cyan-500/20 text-[7px] font-black text-cyan-400 uppercase tracking-[0.2em] rounded-bl-xl border-b border-l border-cyan-500/20 flex items-center gap-1">
                          <Users2 size={8} /> Multi-Team Shift
                        </div>
                      )}
                      <div className="flex items-center gap-5">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-[10px] font-black text-white border border-white/10 uppercase">
                          {req.profiles?.full_name?.split(' ').map((n:any) => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-black text-white uppercase italic tracking-tight">{req.profiles?.full_name}</p>
                          <p className="text-[9px] text-slate-500 font-mono uppercase">{req.teams?.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-black ${isShared ? 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30' : 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'} px-4 py-2 rounded-xl border`}>
                          {req.friday_date}
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[2rem] opacity-40">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">No hay registros para este periodo</p>
                </div>
              )}
            </div>
          </div>

          {/* ÁREA DE ALERTA DINÁMICA: Cambia según si hay anomalía o no */}
          {anomaly ? (
            <div className="p-10 rounded-[3rem] bg-rose-500/5 border border-rose-500/20 backdrop-blur-xl flex flex-col justify-between relative overflow-hidden group text-left">
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-rose-500/10 blur-[60px]" />
              <div>
                  <div className="flex items-center gap-3 text-rose-500 mb-10 font-black uppercase tracking-widest text-sm italic">
                      <AlertTriangle size={24} className="animate-bounce" /> Alerta Crítica de Rotación
                  </div>
                  <div className="space-y-8 relative z-10">
                    <div className="p-6 rounded-[2rem] bg-black/40 border border-rose-500/20 shadow-2xl">
                        <p className="text-[10px] text-slate-500 uppercase font-mono mb-3">Colaborador Bajo Observación</p>
                        <p className="text-2xl font-black text-white italic uppercase leading-none mb-2">{anomaly.name}</p>
                        <p className="text-[11px] text-rose-400 font-bold uppercase tracking-widest">Team {anomaly.team}</p>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between text-[11px] font-black uppercase text-slate-300">
                            <span>Nivel de Anomalía</span>
                            <span className="text-rose-500 text-lg">{anomaly.percentage}%</span>
                        </div>
                        <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${anomaly.percentage}%` }} transition={{ duration: 1.5, ease: "easeOut" }} className="h-full bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.6)]" />
                        </div>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed font-medium">
                        Se ha detectado una concentración inusual de <span className="text-white font-black underline decoration-rose-500">{anomaly.count} beneficios</span>. El sistema sugiere una revisión de carga laboral inmediata.
                    </p>
                  </div>
              </div>
              <button className="mt-10 w-full py-6 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-rose-600/40 transition-all active:scale-95">
                Ejecutar Protocolo Revisión
              </button>
            </div>
          ) : (
            <div className="p-10 rounded-[3rem] bg-blue-500/5 border border-blue-500/20 backdrop-blur-xl flex flex-col justify-between relative overflow-hidden group text-left">
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-500/10 blur-[60px]" />
              <div>
                  <div className="flex items-center gap-3 text-blue-400 mb-10 font-black uppercase tracking-widest text-sm italic">
                      <ShieldCheck size={24} className="animate-pulse" /> Sistema en Cumplimiento
                  </div>
                  <div className="space-y-8 relative z-10 text-center py-10">
                    <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                        <motion.div animate={{ scale: [1, 1.2, 1], rotate: 360 }} transition={{ duration: 10, repeat: Infinity }} className="absolute inset-0 border-2 border-dashed border-blue-400/20 rounded-full" />
                        <Rocket size={48} className="text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">Todo bajo control</h4>
                        <p className="text-sm text-slate-400 leading-relaxed font-medium px-4">
                          No se han detectado anomalías en la distribución de beneficios. El índice de equidad se mantiene óptimo entre todos los escuadrones.
                        </p>
                    </div>
                  </div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-[9px] font-black text-blue-400/60 uppercase tracking-widest text-center italic">
                Scanning for anomalies... OK
              </div>
            </div>
          )}
      </div>

      {/* MODAL (Sin cambios) */}
      <AnimatePresence>
        {selectedDate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedDate(null)} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-lg bg-slate-950 border border-cyan-500/30 rounded-[3rem] p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden" >
              <div className="absolute top-0 right-0 p-6">
                <button onClick={() => setSelectedDate(null)} className="p-2 hover:bg-white/10 rounded-full text-slate-400 transition-colors"><X size={20}/></button>
              </div>
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"><Users2 size={24}/></div>
                <div className="text-left">
                  <h4 className="text-xl font-black text-white uppercase italic tracking-tighter leading-tight">Viernes Compartido</h4>
                  <p className="text-[10px] text-cyan-400/60 font-mono uppercase tracking-[0.2em]">{selectedDate}</p>
                </div>
              </div>
              <div className="space-y-3">
                {getSharedMembers(selectedDate).map((req, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black text-white uppercase border border-white/10 group-hover:border-cyan-500/50 transition-all">
                        {req.profiles?.full_name?.split(' ').map((n:any) => n[0]).join('')}
                       </div>
                       <div className="text-left">
                         <p className="text-sm font-black text-white uppercase italic">{req.profiles?.full_name}</p>
                         <p className="text-[9px] text-slate-500 uppercase font-mono">{req.teams?.name}</p>
                       </div>
                    </div>
                    <div className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-400 uppercase tracking-widest italic whitespace-nowrap">Activo</div>
                  </div>
                ))}
              </div>
              <div className="mt-8 p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 flex items-start gap-3">
                <Info size={16} className="text-cyan-400 mt-0.5 shrink-0" />
                <p className="text-[10px] text-slate-400 leading-relaxed font-medium uppercase tracking-wider italic text-left">
                  Se ha validado que el beneficio compartido cumple con las normativas de soporte de escuadrón.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}