'use client';
import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Check, X, User, AlertCircle, Terminal, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LeadView({ teamId, profile }: { teamId: string, profile: any }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchRequests();
  }, [teamId, profile]);

  const fetchRequests = async () => {
    setLoading(true);
    let query = supabase
      .from('early_requests')
      .select(`
        *,
        profiles:user_id (id, full_name, role, team_id),
        teams:team_id (name)
      `);

    if (profile.role === 'MANAGER') {
      /**
       * LÓGICA PARA MANAGER:
       * Traemos solicitudes PENDING (donde buscaremos a los Leads) 
       * y PENDING_MANAGER (validadas por Leads).
       */
      const { data, error } = await query
        .or('status.eq.PENDING,status.eq.PENDING_MANAGER');

      if (!error && data) {
        // Filtramos para que la Manager vea:
        // 1. Lo que ya validó un Lead (PENDING_MANAGER)
        // 2. Lo que envió un Lead directamente (PENDING + role LEAD)
        const managerData = data.filter(req => 
          req.status === 'PENDING_MANAGER' || 
          (req.status === 'PENDING' && req.profiles?.role === 'LEAD')
        );
        setRequests(managerData);
      }
    } else {
      /**
       * LÓGICA PARA LEAD:
       * Solo ve solicitudes de su equipo que estén PENDING y que NO sean la suya.
       */
      const { data, error } = await query
        .eq('team_id', teamId)
        .eq('status', 'PENDING')
        .neq('user_id', profile.id);
        
      if (!error) setRequests(data || []);
    }
    setLoading(false);
  };

  const handleAction = async (requestId: string, action: 'APPROVE' | 'REJECT') => {
    let newStatus;
    
    const targetRequest = requests.find(r => r.id === requestId);
    const isLeadRequest = targetRequest?.profiles?.role === 'LEAD';

    if (action === 'REJECT') {
      newStatus = 'REJECTED';
    } else {
      // Si es Manager o si es una solicitud de un Lead, pasa a APPROVED
      newStatus = (profile.role === 'MANAGER' || isLeadRequest) ? 'APPROVED' : 'PENDING_MANAGER';
    }

    const { error } = await supabase
      .from('early_requests')
      .update({ status: newStatus })
      .eq('id', requestId);

    if (!error) {
      setRequests(prev => prev.filter(r => r.id !== requestId));
    }
  };

  if (loading) return (
    <div className="flex items-center gap-2 text-slate-500 font-mono text-xs p-10">
      <Terminal size={14} className="animate-bounce" /> SINCRONIZANDO PANEL DE GESTIÓN...
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col mb-8">
        <h2 className="text-2xl font-black text-white tracking-tighter uppercase">
          {profile.role === 'MANAGER' ? 'Aprobación Ejecutiva' : 'Gestión de Equipo'}
        </h2>
        <p className={`text-[10px] font-mono tracking-[0.3em] uppercase ${profile.role === 'MANAGER' ? 'text-emerald-400' : 'text-blue-400'}`}>
          {profile.role === 'MANAGER' ? 'Autorización Final de Transmisiones' : 'Panel de Validación Lead'}
        </p>
      </div>

      <AnimatePresence>
        {requests.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="p-16 border border-white/5 bg-white/[0.01] rounded-[3rem] text-center"
          >
            {profile.role === 'MANAGER' ? <Shield className="mx-auto text-slate-800 mb-4" size={40} /> : <AlertCircle className="mx-auto text-slate-700 mb-4" size={40} />}
            <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">
              {profile.role === 'MANAGER' ? 'No hay firmas pendientes' : 'No hay validaciones pendientes'}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {requests.map((req) => {
              const [year, month, day] = req.friday_date.split('-').map(Number);
              const adjustedDate = new Date(year, month - 1, day);

              return (
                <motion.div
                  key={req.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`group relative p-6 rounded-[2rem] border border-white/10 bg-slate-900/40 backdrop-blur-xl transition-all ${profile.role === 'MANAGER' ? 'hover:border-emerald-500/30' : 'hover:border-blue-500/30'}`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-slate-400 transition-colors ${profile.role === 'MANAGER' ? 'group-hover:text-emerald-400' : 'group-hover:text-blue-400'}`}>
                        <User size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-white font-black uppercase tracking-tight">{req.profiles?.full_name}</h4>
                          {req.profiles?.role === 'LEAD' && (
                            <span className="text-[7px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold">LEAD</span>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 mt-1">
                          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                            Fecha: {adjustedDate.toLocaleDateString('es-ES', { month: 'long', day: 'numeric' })}
                          </p>
                          {profile.role === 'MANAGER' && (
                            <span className="text-[8px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 w-fit font-bold uppercase">
                              {req.profiles?.role === 'LEAD' ? 'SOLICITUD DIRECTA' : `VALIDADO POR: ${req.teams?.name || 'LEAD'}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 px-4">
                      <p className={`text-xs text-slate-400 italic border-l-2 pl-4 py-1 ${profile.role === 'MANAGER' ? 'border-emerald-500/30' : 'border-blue-500/30'}`}>
                        "{req.reason || "Sin motivo especificado"}"
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleAction(req.id, 'REJECT')}
                        className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-rose-500 hover:bg-rose-500 hover:text-white transition-all active:scale-95"
                      >
                        <X size={20} />
                      </button>
                      <button 
                        onClick={() => handleAction(req.id, 'APPROVE')}
                        className={`flex items-center gap-3 px-8 py-4 rounded-2xl border transition-all active:scale-95 shadow-lg ${
                          profile.role === 'MANAGER' 
                          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-600 hover:text-white shadow-emerald-500/10' 
                          : 'border-blue-500/20 bg-blue-500/10 text-blue-400 hover:bg-blue-600 hover:text-white shadow-blue-500/10'
                        }`}
                      >
                        <Check size={20} strokeWidth={profile.role === 'MANAGER' ? 3 : 2} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                          {profile.role === 'MANAGER' ? 'Aprobar Final' : 'Validar'}
                        </span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}