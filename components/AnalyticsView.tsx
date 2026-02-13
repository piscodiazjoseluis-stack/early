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
    <div className="flex justify-between items-start relative z-10">
      <div className={`p-3 rounded-2xl ${color} bg-opacity-10 border border-current border-opacity-20 shadow-inner`}>
        <Icon size={22} className={color} />
      </div>
      <div className="flex flex-col items-end">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1 italic">Status_Live</span>
        <div className="h-1 w-8 bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
      </div>
    </div>
    <div className="mt-6 relative z-10">
      <h3 className="text-3xl font-black text-white tracking-tighter italic">{value}</h3>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 group-hover:text-slate-200 transition-colors">{title}</p>
      <p className="text-[8px] font-mono text-slate-600 mt-2 flex items-center gap-1 uppercase tracking-tighter">
        <Activity size={10} className="animate-pulse" /> {subtext}
      </p>
    </div>
  </motion.div>
);

export default function AnalyticsView() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('early_requests')
        .select(`
          *,
          profiles:user_id(full_name, role),
          teams:team_id(name)
        `);
      setRequests(data || []);
      setLoading(false);
    };
    fetchData();
  }, [supabase]);

  // --- CORRECCIÓN DE LÓGICA DE FILTRADO PARA BACKLOG ---
  const approvedRequests = requests.filter(r => r.status === 'APPROVED');
  // Ahora incluimos tanto PENDING como PENDING_MANAGER en el conteo de pendientes
  const pendingRequests = requests.filter(r => r.status === 'PENDING' || r.status === 'PENDING_MANAGER');
  const rejectedRequests = requests.filter(r => r.status === 'REJECTED');

  const totalProcessed = approvedRequests.length + rejectedRequests.length;
  const efficiency = totalProcessed > 0 
    ? Math.round((approvedRequests.length / totalProcessed) * 100) 
    : 0;

  // Datos para el Donut Chart con la corrección aplicada
  const pieData = [
    { name: 'Aprobados', value: approvedRequests.length, color: '#10b981' },
    { name: 'Pendientes', value: pendingRequests.length, color: '#6366f1' },
    { name: 'Denegados', value: rejectedRequests.length, color: '#f43f5e' },
  ];

  // Lógica de Calendario
  const getEarlysByDate = (dateStr: string) => {
    return requests.filter(r => r.friday_date === dateStr && r.status === 'APPROVED');
  };

  if (loading) return (
    <div className="h-96 flex flex-col items-center justify-center gap-4">
      <div className="relative w-16 h-16">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="absolute inset-0 border-t-2 border-r-2 border-blue-500 rounded-full" />
        <Cpu className="absolute inset-0 m-auto text-blue-500 animate-pulse" size={24} />
      </div>
      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.5em]">Compilando Data...</span>
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title="Total Autorizados" 
          value={approvedRequests.length} 
          subtext="Transmisiones Exitosas"
          icon={CheckCircle}
          color="text-emerald-400"
          glowColor="bg-emerald-500"
          borderColor="border-emerald-500/20"
        />
        <KpiCard 
          title="Backlog Pendiente" 
          value={pendingRequests.length} 
          subtext="En Cola de Validación"
          icon={Clock}
          color="text-indigo-400"
          glowColor="bg-indigo-500"
          borderColor="border-indigo-500/20"
        />
        <KpiCard 
          title="Tasa Aprobación" 
          value={`${efficiency}%`} 
          subtext="Ratio de Efectividad"
          icon={Target}
          color="text-blue-400"
          glowColor="bg-blue-500"
          borderColor="border-blue-500/20"
        />
        <KpiCard 
          title="Total Procesado" 
          value={requests.length} 
          subtext="Registros en Base"
          icon={Activity}
          color="text-purple-400"
          glowColor="bg-purple-500"
          borderColor="border-purple-500/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Gráfico de Distribución */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-4 p-8 rounded-[2.5rem] bg-slate-950/40 border border-white/5 backdrop-blur-3xl flex flex-col items-center justify-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
            <Network size={14} className="text-blue-500" /> Distribución de Estados
          </h4>
          <div className="h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#020617', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px', fontFamily: 'monospace' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-white italic">{requests.length}</span>
              <span className="text-[8px] font-mono text-slate-500 uppercase tracking-tighter">Total</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-8 w-full">
            {pieData.map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="h-1 w-full rounded-full" style={{ backgroundColor: item.color, opacity: 0.3 }} />
                <span className="text-[8px] font-mono text-slate-400 uppercase tracking-tighter">{item.name}</span>
                <span className="text-xs font-black text-white italic">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Mapa de Calor / Calendario de Operaciones */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-8 p-8 rounded-[2.5rem] bg-slate-950/40 border border-white/5 backdrop-blur-3xl relative overflow-hidden"
        >
           <div className="absolute top-0 right-0 p-8 opacity-5">
              <Calendar size={120} className="text-white" />
           </div>

           <div className="flex justify-between items-center mb-8">
              <div>
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                  <Fingerprint size={14} className="text-purple-500" /> Registro de Operaciones
                </h4>
                <p className="text-xs text-slate-400 mt-1 font-mono italic">Haz clic en un nodo activo para ver detalles</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                 <Rocket size={14} className="text-blue-400" />
                 <span className="text-[9px] font-mono text-white uppercase tracking-widest">Live_Nodes</span>
              </div>
           </div>

           <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {Array.from({ length: 24 }).map((_, i) => {
                const date = new Date(2024, 0, (i + 1) * 7 + 5); 
                const dateStr = date.toISOString().split('T')[0];
                const dayEarlys = getEarlysByDate(dateStr);
                const isActive = dayEarlys.length > 0;

                return (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.1, y: -2 }}
                    onClick={() => isActive && setSelectedDate(dateStr)}
                    className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border ${
                      isActive 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                        : 'bg-white/[0.02] border-white/5 text-slate-700 hover:border-white/10'
                    }`}
                  >
                    <span className="text-[8px] font-mono uppercase opacity-50">{date.toLocaleDateString('es', { month: 'short' })}</span>
                    <span className="text-sm font-black italic">{date.getDate()}</span>
                    {isActive && (
                      <div className="absolute top-1 right-1 flex gap-0.5">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                      </div>
                    )}
                  </motion.button>
                );
              })}
           </div>

           {/* Modal de Detalle (Overlay) */}
           <AnimatePresence>
            {selectedDate && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-xl p-8 flex flex-col"
              >
                <button onClick={() => setSelectedDate(null)} className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"><X size={20}/></button>
                <h4 className="text-xl font-black text-white uppercase italic mb-8">Dotación Early: {selectedDate}</h4>
                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-futuristic-scroll text-left">
                  {getEarlysByDate(selectedDate).map((req, idx) => (
                    <motion.div 
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      key={idx} 
                      className="flex items-center justify-between p-5 rounded-[1.5rem] bg-white/[0.03] border border-white/5 hover:border-emerald-500/30 transition-all group/item shadow-sm"
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
            )}
           </AnimatePresence>
        </motion.div>
      </div>

      {/* Footer / Meta Data */}
      <div className="flex flex-col md:flex-row justify-between items-center px-8 py-6 rounded-[2rem] bg-white/[0.02] border border-white/5">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Nexus Analytics Engine</span>
          </div>
          <div className="h-4 w-[1px] bg-white/10" />
          <p className="text-[9px] text-slate-500 font-mono uppercase tracking-tighter flex items-center gap-2">
            <Cpu size={12} /> Sync_Status: Realtime_Active
          </p>
        </div>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
           <div className="flex -space-x-2">
             {Array.from({ length: 3 }).map((_, i) => (
               <div key={i} className="w-6 h-6 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center text-[8px] text-white font-black">
                 {['T1', 'T2', 'T3'][i]}
               </div>
             ))}
           </div>
           <span className="text-[10px] font-mono text-slate-500 uppercase italic tracking-tighter">Active Teams: 12</span>
        </div>
      </div>
    </div>
  );
}