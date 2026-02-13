'use client';
import React, { useState, useEffect } from 'react';
import { 
  Zap, CheckCircle, Clock, ShieldCheck, Heart, Calendar, 
  AlertTriangle, Target, Activity, Users2, X, Info, Cpu, Rocket,
  ChevronLeft, ChevronRight, Fingerprint, Network, UserMinus, Award, Star,
  MousePointer2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

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
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0, wellbeingHours: 0 });
  const [teamStats, setTeamStats] = useState<any[]>([]);
  const [anomaly, setAnomaly] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [topUsersMonth, setTopUsersMonth] = useState<any[]>([]);
  const [usersWithoutEarly, setUsersWithoutEarly] = useState<any[]>([]);

  const supabase = createClient();

  const months = [
    { value: 'ALL', label: 'TODOS LOS PERIODOS' },
    { value: '01', label: 'ENERO - 2026' }, { value: '02', label: 'FEBRERO - 2026' },
    { value: '03', label: 'MARZO - 2026' }, { value: '04', label: 'ABRIL - 2026' },
    { value: '05', label: 'MAYO - 2026' }, { value: '06', label: 'JUNIO - 2026' },
    { value: '07', label: 'JULIO - 2026' }, { value: '08', label: 'AGOSTO - 2026' },
    { value: '09', label: 'SEPTIEMBRE - 2026' }, { value: '10', label: 'OCTUBRE - 2026' },
    { value: '11', label: 'NOVIEMBRE - 2026' }, { value: '12', label: 'DICIEMBRE - 2026' },
  ];

  useEffect(() => {
    async function fetchAnalytics() {
      const { data: profiles } = await supabase.from('profiles').select('full_name, teams(name)');
      if (profiles) setAllProfiles(profiles);

      const { data: requests } = await supabase
        .from('early_requests')
        .select(`*, teams(name), profiles(full_name)`)
        .order('friday_date', { ascending: true });

      if (requests) {
        setAllData(requests);
        applyFilter(requests, selectedMonth, profiles || []);
      }
    }
    fetchAnalytics();
  }, [supabase]);

  const applyFilter = (rawData: any[], monthVal: string, profiles: any[] = allProfiles) => {
    let filtered = rawData;
    if (monthVal !== 'ALL') {
      filtered = rawData.filter(r => {
        const date = new Date(r.friday_date);
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        return month === monthVal;
      });
    }

    setFilteredData(filtered);
    const approved = filtered.filter(r => r.status === 'APPROVED');
    const pending = filtered.filter(r => r.status.includes('PENDING'));
    const rejected = filtered.filter(r => r.status === 'REJECTED');

    setStats({
      total: filtered.length,
      approved: approved.length,
      pending: pending.length,
      rejected: rejected.length,
      wellbeingHours: approved.length * 3.5 
    });

    const userCounts: Record<string, {count: number, team: string}> = {};
    const dynamicTeams: any = {};
    
    filtered.forEach((req: any) => {
      const teamName = req.teams?.name || 'Sin Equipo';
      const userName = req.profiles?.full_name || 'Desconocido';
      
      if (!dynamicTeams[teamName]) dynamicTeams[teamName] = { name: teamName, total: 0, approved: 0 };
      dynamicTeams[teamName].total += 1;
      
      if (req.status === 'APPROVED') {
        dynamicTeams[teamName].approved += 1;
        if (!userCounts[userName]) userCounts[userName] = { count: 0, team: teamName };
        userCounts[userName].count += 1;
      }
    });

    setTeamStats(Object.values(dynamicTeams));

    const sortedUsers = Object.entries(userCounts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a: any, b: any) => b.count - a.count);

    setTopUsersMonth(sortedUsers.slice(0, 5));

    const dataForEquity = monthVal === 'ALL' ? rawData : filtered;
    const usersWithEarlyInPeriod = new Set(
      dataForEquity.filter(r => r.status === 'APPROVED').map(r => r.profiles?.full_name)
    );

    const withoutEarly = profiles
      .filter(p => p.full_name !== 'Maria Luisa Temoche') 
      .filter(p => !usersWithEarlyInPeriod.has(p.full_name))
      .map(p => ({
        name: p.full_name,
        team: p.teams?.name || 'Sin Equipo'
      }));
    
    setUsersWithoutEarly(withoutEarly);

    const topUser: any = sortedUsers[0];
    if (topUser && topUser.count >= 3) {
      setAnomaly({ name: topUser.name, count: topUser.count, team: topUser.team, percentage: Math.min(topUser.count * 25, 100) });
    } else {
      setAnomaly(null);
    }
  };

  const navigateMonth = (direction: 'next' | 'prev') => {
    const currentIndex = months.findIndex(m => m.value === selectedMonth);
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= months.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = months.length - 1;
    const nextVal = months[nextIndex].value;
    setSelectedMonth(nextVal);
    applyFilter(allData, nextVal);
  };

  const getEarlysByDate = (dateStr: string) => allData.filter(r => r.status === 'APPROVED' && r.friday_date === dateStr);

  const getDaysArray = () => {
    const year = 2026;
    const month = selectedMonth === 'ALL' ? new Date().getMonth() + 1 : parseInt(selectedMonth);
    const totalDays = new Date(year, month, 0).getDate();
    const fridays = [];
    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(year, month - 1, i);
      if (date.getDay() === 5) fridays.push(i);
    }
    return fridays;
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-700 text-left">
      <style jsx global>{`
        .custom-futuristic-scroll::-webkit-scrollbar { width: 4px; }
        .custom-futuristic-scroll::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); border-radius: 10px; }
        .custom-futuristic-scroll::-webkit-scrollbar-thumb { 
          background: linear-gradient(to bottom, #f59e0b, #92400e); 
          border-radius: 10px;
          box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
        }
      `}</style>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-2">
        <div>
          <h2 className="text-5xl font-black tracking-tighter flex items-center leading-none italic">
            <span className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">COMMAND</span>
            <span className="ml-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-600 animate-gradient-x">CENTER</span>
          </h2>
          <div className="flex items-center gap-3 mt-3">
             <p className="text-[10px] text-blue-400/60 font-mono tracking-[0.4em] uppercase">Intelligence System v2.5</p>
             <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] text-emerald-500/80 font-black uppercase tracking-widest">Active_Node</span>
             </div>
          </div>
        </div>
        
        <div className="flex gap-4 items-center">
           <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-xl group hover:border-blue-500/50 transition-all duration-500 shadow-lg">
              <Calendar size={14} className="text-blue-400" />
              <select 
                value={selectedMonth}
                onChange={(e) => { setSelectedMonth(e.target.value); applyFilter(allData, e.target.value); }}
                className="bg-transparent text-[10px] font-black text-slate-300 outline-none uppercase cursor-pointer appearance-none pr-4"
              >
                {months.map(m => (
                  <option key={m.value} value={m.value} className="bg-slate-900 text-white font-mono">{m.label}</option>
                ))}
              </select>
           </div>
           <div className="relative w-10 h-10 bg-slate-950 border border-blue-500/50 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.4)]">
             <Cpu size={20} className="text-blue-400 animate-pulse" />
           </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="flex flex-wrap lg:flex-nowrap gap-4">
        <KpiCard title="Total Solicitudes" value={stats.total} subtext="Volumen Tráfico" icon={Target} color="text-blue-400" glowColor="bg-blue-600" borderColor="border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]" />
        <KpiCard title="Aprobación Final" value={stats.approved} subtext="Earlys OK" icon={CheckCircle} color="text-emerald-400" glowColor="bg-emerald-600" borderColor="border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]" />
        <KpiCard title="Backlog Pendiente" value={stats.pending} subtext="En Validación" icon={Clock} color="text-amber-400" glowColor="bg-amber-600" borderColor="border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]" />
        <KpiCard title="Índice Rotación" value={stats.total > 0 ? "94%" : "0%"} subtext="Compliance" icon={ShieldCheck} color="text-purple-400" glowColor="bg-purple-600" borderColor="border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]" />
        <KpiCard title="Bienestar" value={`${stats.wellbeingHours}h`} subtext="Tiempo Libre" icon={Heart} color="text-rose-400" glowColor="bg-rose-600" borderColor="border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)]" />
      </div>

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 p-10 rounded-[3rem] bg-slate-900/40 border border-white/5 backdrop-blur-xl h-[450px] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <h3 className="text-lg font-black uppercase tracking-tighter italic mb-8 text-white flex items-center gap-2">
            <Activity size={18} className="text-blue-500" /> Demanda por Escuadrón
          </h3>
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
              <Tooltip 
                cursor={{fill: 'rgba(255,255,255,0.05)'}}
                contentStyle={{backgroundColor: '#0f172a', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '15px', color: '#fff', backdropFilter: 'blur(10px)'}} 
              />
              <Bar dataKey="total" name="Total Earlys" fill="url(#barBlue)" radius={[6, 6, 0, 0]} barSize={35} animationDuration={1500} animationEasing="ease-out" />
              <Bar dataKey="approved" name="Aprobados" fill="url(#barGreen)" radius={[6, 6, 0, 0]} barSize={35} animationDuration={2000} animationEasing="ease-out" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-10 rounded-[3rem] bg-slate-900/40 border border-white/5 flex flex-col items-center justify-center relative group">
          <h3 className="text-lg font-black uppercase tracking-tighter italic mb-6 text-white">Estado Global</h3>
          <div className="relative w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[
                  { name: 'Aprobados', value: stats.approved, color: '#10b981' },
                  { name: 'Pendientes', value: stats.pending, color: '#f59e0b' },
                  { name: 'Rechazados', value: stats.rejected, color: '#ef4444' }
                ]} innerRadius={90} outerRadius={120} paddingAngle={8} dataKey="value" stroke="none">
                  {[0,1,2].map((i) => <Cell key={i} fill={['#10b981', '#f59e0b', '#ef4444'][i]} />)}
                </Pie>
                {/* TOOLTIP AJUSTADO: TEXTO EN BLANCO */}
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <motion.span animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }} className="text-6xl font-black text-white italic tracking-tighter drop-shadow-2xl">{stats.total}</motion.span>
              <span className="text-[10px] text-slate-500 uppercase tracking-[0.4em] font-mono">Records</span>
            </div>
          </div>
        </div>
      </div>

      {/* CALENDARIO Y ALERTAS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 p-6 rounded-[3rem] bg-slate-950 border border-emerald-500/20 relative overflow-hidden shadow-inner text-left">
            <div className="flex justify-between items-center mb-6 relative z-10">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 text-emerald-400 font-black uppercase tracking-widest text-xs italic">
                    <Zap size={20} className="animate-pulse" /> Timeline: Solo Viernes
                </div>
                <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/10 shadow-lg">
                  <button onClick={() => navigateMonth('prev')} className="p-2 hover:bg-emerald-500/20 hover:text-emerald-400 rounded-full transition-all text-slate-400">
                    <ChevronLeft size={18} />
                  </button>
                  <div className="px-4 text-[10px] font-black text-white font-mono min-w-[120px] text-center uppercase">
                    {months.find(m => m.value === selectedMonth)?.label || "GLOBAL"}
                  </div>
                  <button onClick={() => navigateMonth('next')} className="p-2 hover:bg-emerald-500/20 hover:text-emerald-400 rounded-full transition-all text-slate-400">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 lg:grid-cols-5 gap-4 relative z-10">
              {getDaysArray().map((day) => {
                const monthForDate = selectedMonth === 'ALL' ? String(new Date().getMonth() + 1).padStart(2, '0') : selectedMonth;
                const dateStr = `2026-${monthForDate}-${String(day).padStart(2, '0')}`;
                const people = getEarlysByDate(dateStr);
                const hasEarlys = people.length > 0;
                return (
                  <motion.div 
                    key={day}
                    whileHover={{ scale: 1.05, y: -5 }}
                    onClick={() => hasEarlys && setSelectedDate(dateStr)}
                    className={`h-32 rounded-[2rem] border transition-all flex flex-col items-center justify-center relative group
                      ${hasEarlys ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-950/40 border-emerald-500/40 cursor-pointer shadow-[0_10px_30px_-10px_rgba(16,185,129,0.3)]' : 'bg-white/[0.03] border-white/5 opacity-60'}
                    `}
                  >
                    <span className={`text-2xl font-black italic ${hasEarlys ? 'text-white' : 'text-slate-700'}`}>{day}</span>
                    {hasEarlys && (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 mt-2 backdrop-blur-md">
                        <Users2 size={12} className="text-emerald-400" />
                        <span className="text-xs font-black text-white">{people.length}</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* PANEL DE ANOMALÍA / INTEGRIDAD */}
          {anomaly ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-8 rounded-[3rem] bg-rose-500/10 border border-rose-500/30 backdrop-blur-2xl flex flex-col justify-between relative overflow-hidden group text-left">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/20 blur-[50px] animate-pulse" />
                <div className="flex items-center gap-3 text-rose-500 mb-8 font-black uppercase tracking-[0.3em] text-xs italic relative z-10">
                    <AlertTriangle size={24} className="animate-bounce" /> Alerta Crítica
                </div>
                <div className="p-6 rounded-[2.5rem] bg-black/60 border border-rose-500/20 shadow-2xl relative z-10">
                    <p className="text-[10px] text-rose-400/60 uppercase font-mono mb-2">Target Identificado</p>
                    <p className="text-2xl font-black text-white italic uppercase tracking-tighter">{anomaly.name}</p>
                    <div className="mt-4 flex gap-2">
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-[8px] text-rose-400 font-bold border border-rose-500/30">RISK_LEVEL: HIGH</span>
                    </div>
                </div>
                <div className="mt-8 space-y-3 relative z-10">
                    <div className="flex justify-between text-[11px] font-black uppercase text-slate-300">
                        <span>Saturación Beneficios</span>
                        <span className="text-rose-500 text-xl font-mono">{anomaly.percentage}%</span>
                    </div>
                    <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 p-1">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${anomaly.percentage}%` }} transition={{ duration: 1.5 }} className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.8)]" />
                    </div>
                </div>
                <button className="mt-8 w-full py-5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(225,29,72,0.3)] transition-all active:scale-95 relative z-10 flex items-center justify-center gap-2">
                  <Fingerprint size={16} /> Iniciar Auditoría
                </button>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 rounded-[3rem] bg-blue-500/5 border border-blue-500/20 backdrop-blur-xl flex flex-col justify-center text-center relative overflow-hidden group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
                <div className="relative z-10">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="mx-auto w-24 h-24 border-2 border-dashed border-blue-500/20 rounded-full flex items-center justify-center mb-6">
                    <Rocket size={40} className="text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]" />
                  </motion.div>
                  <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-tight">Integridad al 100%</h4>
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                    <p className="text-[10px] text-blue-400/70 font-mono uppercase tracking-widest">System_Scan: Clean</p>
                  </div>
                </div>
            </motion.div>
          )}
      </div>

      {/* RANKING Y EQUIDAD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-10">
          <div className="p-8 rounded-[3rem] bg-slate-900/40 border border-blue-500/20 backdrop-blur-xl group relative overflow-hidden text-left">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Award size={100} /></div>
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 shadow-inner"><Award size={20} /></div>
                <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">Ranking: Máximo Uso</h3>
              </div>
              <div className="space-y-3 relative z-10">
                {topUsersMonth.map((user, i) => (
                  <motion.div 
                    whileHover={{ x: 10, backgroundColor: 'rgba(255,255,255,0.08)' }}
                    key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 transition-all cursor-default group/item shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover/item:border-blue-400 transition-colors">
                        <span className="text-[10px] font-mono text-blue-500 font-bold italic">{i+1}</span>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-black text-white uppercase italic leading-none">{user.name}</p>
                        <p className="text-[9px] text-slate-500 font-mono mt-1 uppercase tracking-tight">{user.team}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-xl font-black text-blue-400 italic leading-none drop-shadow-md">{user.count}</p>
                       <p className="text-[8px] text-slate-500 uppercase font-bold tracking-tighter">Earlys OK</p>
                    </div>
                  </motion.div>
                ))}
              </div>
          </div>

          <div className="p-8 rounded-[3rem] bg-slate-900/40 border border-amber-500/20 backdrop-blur-xl text-left">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400"><UserMinus size={20} /></div>
                <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">
                  {selectedMonth === 'ALL' ? 'Equidad Anual 2026' : 'Equidad Mensual'}
                </h3>
              </div>
              
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-3 custom-futuristic-scroll">
                {usersWithoutEarly.length > 0 ? (
                  usersWithoutEarly.map((user, i) => (
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      key={i} className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 group hover:border-amber-500/40 hover:bg-amber-500/10 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:text-amber-400 border border-white/5 transition-all">
                          {user.name.split(' ').map((n:any) => n[0]).join('')}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-black text-white uppercase italic leading-none">{user.name}</p>
                          <p className="text-[9px] text-slate-500 font-mono mt-1 uppercase">{user.team}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black text-amber-500/60 uppercase italic">Beneficio Libre</span>
                        <div className="h-1 w-12 bg-amber-500/20 rounded-full mt-1 overflow-hidden">
                          <motion.div animate={{ x: [-48, 48] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="h-full bg-amber-500/60 w-1/2" />
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-8 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/20 text-center flex flex-col items-center gap-4">
                    <Star size={40} className="text-emerald-400 fill-emerald-400/20 animate-pulse" />
                    <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">¡Equidad Lograda!</h4>
                    <p className="text-[10px] text-emerald-400/70 font-mono uppercase tracking-widest leading-relaxed">Todos los integrantes han disfrutado del beneficio en este periodo.</p>
                  </motion.div>
                )}
              </div>
          </div>
      </div>

      {/* POP-UP DETALLE POTENCIADO */}
      <AnimatePresence>
        {selectedDate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedDate(null)} className="absolute inset-0 bg-black/80 backdrop-blur-2xl" />
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 50 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.8, opacity: 0, y: 50 }} 
              className="relative w-full max-w-lg bg-slate-950 border border-emerald-500/40 rounded-[3rem] p-10 shadow-[0_0_60px_rgba(16,185,129,0.2)] overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]" />
              
              <button onClick={() => setSelectedDate(null)} className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 transition-all border border-white/10 hover:border-white/20"><X size={20}/></button>
              
              <div className="flex items-center gap-5 mb-10 relative z-10 text-left">
                <div className="p-4 rounded-[1.5rem] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[inset_0_0_15px_rgba(16,185,129,0.2)]">
                  <Calendar size={28} />
                </div>
                <div className="text-left">
                  <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none mb-2">Dotación Early</h4>
                  <p className="text-xs text-emerald-400/70 font-mono uppercase tracking-[0.3em] flex items-center gap-2">
                    <MousePointer2 size={12} className="animate-pulse" /> Node_Time: {selectedDate}
                  </p>
                </div>
              </div>

              <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-3 custom-futuristic-scroll relative z-10 text-left">
                {getEarlysByDate(selectedDate).map((req, idx) => (
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: idx * 0.05 }}
                    key={idx} className="flex items-center justify-between p-5 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:border-emerald-500/40 hover:bg-white/[0.06] transition-all group/item shadow-sm"
                  >
                    <div className="flex items-center gap-4 text-left">
                        <div className="w-12 h-12 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-xs font-black text-white group-hover/item:border-emerald-500/50 transition-all">
                         {req.profiles?.full_name?.split(' ').map((n:any) => n[0]).join('')}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-black text-white uppercase italic leading-none mb-1">{req.profiles?.full_name}</p>
                          <p className="text-[10px] text-slate-500 uppercase font-mono tracking-tight">{req.teams?.name}</p>
                        </div>
                    </div>
                    <div className="px-4 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase italic tracking-widest shadow-inner whitespace-nowrap">Aprobado</div>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-10 pt-6 border-t border-white/5 text-center">
                <p className="text-[9px] text-slate-500 font-mono uppercase tracking-[0.2em]">Verificado por Security Node v2.5</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}