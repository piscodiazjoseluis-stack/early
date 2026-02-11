'use client';
import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Clock, CheckCircle2, XCircle, Calendar as CalendarIcon, Terminal, Check, UserCheck, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

// Ahora recibimos el perfil completo
export default function RequestList({ profile }: { profile: any }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from('early_requests')
        .select(`
          *,
          teams:team_id (name)
        `)
        .eq('user_id', profile.id)
        .order('friday_date', { ascending: false });

      if (!error) setRequests(data || []);
      setLoading(false);
    };

    fetchRequests();
  }, [profile.id, supabase]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return { 
          text: 'text-emerald-400', 
          bg: 'bg-emerald-500/10', 
          border: 'border-emerald-500/20',
          icon: <CheckCircle2 size={14} className="mr-1.5" />,
          label: 'AUTORIZADO'
        };
      case 'PENDING_MANAGER': 
        return { 
          text: 'text-indigo-400', 
          bg: 'bg-indigo-500/10', 
          border: 'border-indigo-500/20',
          icon: <Shield size={14} className="mr-1.5" />,
          label: 'VALIDADO POR LEAD'
        };
      case 'REJECTED':
        return { 
          text: 'text-rose-400', 
          bg: 'bg-rose-500/10', 
          border: 'border-rose-500/20',
          icon: <XCircle size={14} className="mr-1.5" />,
          label: 'DENEGADO'
        };
      default:
        return { 
          text: 'text-amber-400', 
          bg: 'bg-amber-500/10', 
          border: 'border-amber-500/20',
          icon: <Clock size={14} className="mr-1.5" />,
          label: 'PENDIENTE'
        };
    }
  };

  if (loading) return (
    <div className="animate-pulse flex items-center gap-2 text-slate-500 text-sm italic">
      <Terminal size={16} /> Procesando flujo de aprobación...
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <CalendarIcon size={20} className="text-blue-500" />
          HISTORIAL DE TRANSMISIONES
        </h3>
        <span className="text-[10px] text-slate-500 tracking-[0.3em] font-mono uppercase">Tracking Engine v2.0</span>
      </div>
      
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.02] backdrop-blur-xl overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-500 text-sm font-mono tracking-tighter italic">No se detectan solicitudes previas...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Fecha</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Estado Link</th>
                  {profile.role === 'EMPLOYEE' && (
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Circuito de Aprobación</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {requests.map((req) => {
                  const style = getStatusStyle(req.status);
                  const isApprovedByLead = req.status === 'PENDING_MANAGER' || req.status === 'APPROVED';
                  const isApprovedByManager = req.status === 'APPROVED';

                  const leadDisplayName = req.teams?.name || 'LEAD';

                  // --- CORRECCIÓN DEFINITIVA DE FECHA ---
                  // Dividimos la cadena YYYY-MM-DD para evitar conversiones de zona horaria
                  const [year, month, day] = req.friday_date.split('-').map(Number);
                  const adjustedDate = new Date(year, month - 1, day); 
                  // --------------------------------------

                  return (
                    <tr key={req.id} className="hover:bg-white/[0.03] transition-all group">
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="font-mono text-blue-400 text-sm tracking-wider">
                            {adjustedDate.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="text-[10px] text-slate-500 mt-1 truncate max-w-[150px]">{req.reason || "Salida regular"}</span>
                        </div>
                      </td>
                      
                      <td className="px-8 py-6">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full border ${style.bg} ${style.text} ${style.border} text-[9px] font-black tracking-widest`}>
                          {style.icon} {style.label}
                        </div>
                      </td>

                      {profile.role === 'EMPLOYEE' && (
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col items-center gap-1">
                                <div className={`h-5 w-5 rounded-full flex items-center justify-center border ${isApprovedByLead ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-600'}`}>
                                    {isApprovedByLead ? <UserCheck size={10} /> : <Clock size={10} />}
                                </div>
                                <span className="text-[7px] font-black text-slate-500 uppercase tracking-tighter text-center leading-[1] w-16">
                                  {leadDisplayName}
                                </span>
                            </div>

                            <div className={`h-[1px] w-8 ${isApprovedByManager ? 'bg-emerald-500' : 'bg-slate-800'}`} />

                            <div className="flex flex-col items-center gap-1">
                                <div className={`h-5 w-5 rounded-full flex items-center justify-center border ${isApprovedByManager ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-600'}`}>
                                    {isApprovedByManager ? <Check size={10} /> : <Shield size={10} />}
                                </div>
                                <span className="text-[7px] font-black text-slate-500 uppercase tracking-tighter text-center leading-[1] w-16 text-pretty">MARIA LUISA TEMOCHE</span>
                            </div>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}