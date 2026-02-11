'use client';
import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { 
  History, 
  Search, 
  Calendar, 
  User, 
  Users, 
  CheckCircle2, 
  Clock,
  ArrowUpRight
} from 'lucide-react';

export default function HistoryView() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchAllHistory() {
      setLoading(true);
      // Traemos todas las solicitudes con la info del perfil y del equipo
      const { data, error } = await supabase
        .from('early_requests')
        .select(`
          *,
          profiles (
            full_name,
            role,
            teams (name)
          )
        `)
        .order('created_at', { ascending: false });

      if (!error) {
        setHistory(data || []);
      }
      setLoading(false);
    }

    fetchAllHistory();
  }, [supabase]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <div className="h-12 w-12 border-t-2 border-emerald-500 rounded-full animate-spin" />
      <p className="text-emerald-500 font-mono text-[10px] uppercase tracking-[0.4em]">Accediendo al Archivo Maestro...</p>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header Estilo Cyberpunk */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <History size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">Archivo Maestro</h2>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.3em]">Registro de Transmisiones Globales</p>
          </div>
        </div>
      </div>

      {/* Tabla de Historial */}
      <div className="rounded-[2.5rem] border border-white/5 bg-slate-900/40 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Unidad / Agente</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Escuadrón</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Fecha Solicitada</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {history.map((req, index) => (
                <motion.tr 
                  key={req.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="hover:bg-emerald-500/[0.02] transition-colors group"
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 transition-colors">
                        <User size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white tracking-tight">{req.profiles?.full_name}</p>
                        <p className="text-[9px] font-mono text-slate-500 uppercase">{req.profiles?.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Users size={14} className="text-blue-500/50" />
                      <span className="text-[10px] font-black uppercase tracking-tighter">{req.profiles?.teams?.name || 'OPERACIONES'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Calendar size={14} className="text-emerald-500/50" />
                      <span className="text-xs font-mono tracking-widest">{req.friday_date}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex justify-center">
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${
                        req.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' :
                        req.status === 'PENDING' || req.status === 'PENDING_MANAGER' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-white/5 text-slate-500 border-white/10'
                      }`}>
                        {req.status === 'APPROVED' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {req.status}
                      </div>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}