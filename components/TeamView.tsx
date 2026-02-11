'use client';
import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Shield, Circle, Smartphone, Radio } from 'lucide-react';

// CAMBIO: teamId puede ser string o null para soportar a la Manager
export default function TeamView({ teamId }: { teamId: string | null }) {
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchTeamStatus() {
      setLoading(true);
      
      // Construimos la base de la consulta
      let query = supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          role,
          team_id,
          early_requests (
            status,
            friday_date
          )
        `);

      // LÓGICA DE FILTRADO:
      // Si teamId existe, filtramos por equipo (Lead).
      // Si teamId es null, no filtramos y trae todo (Manager).
      if (teamId) {
        query = query.eq('team_id', teamId);
      }

      const { data, error } = await query;

      if (!error) {
        setTeamMembers(data || []);
      }
      setLoading(false);
    }

    fetchTeamStatus();
  }, [teamId, supabase]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <Radio className="text-blue-500 animate-spin" size={40} />
      <p className="text-blue-400 font-mono text-[10px] uppercase tracking-[0.4em]">Escaneando Bio-Firmas...</p>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header del Módulo */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            <Users size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">Estado del Escuadrón</h2>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.3em]">
              {teamId ? "Sincronización de Equipo" : "Sincronización Global de Unidades"}
            </p>
          </div>
        </div>
      </div>

      {/* Grid de Miembros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence>
          {teamMembers.map((member, index) => {
            const latestRequest = member.early_requests?.[0]; 
            const hasRequested = !!latestRequest;
            
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                className="relative p-6 rounded-[2.5rem] border border-white/5 bg-slate-900/40 backdrop-blur-xl group overflow-hidden"
              >
                {/* Indicador de Estado Lateral */}
                <div className={`absolute top-0 left-0 w-1.5 h-full ${
                  latestRequest?.status === 'APPROVED' ? 'bg-emerald-500 shadow-[2px_0_15px_rgba(16,185,129,0.5)]' :
                  latestRequest?.status === 'PENDING' ? 'bg-amber-500 shadow-[2px_0_15px_rgba(245,158,11,0.5)]' :
                  latestRequest?.status === 'PENDING_MANAGER' ? 'bg-blue-500 shadow-[2px_0_15px_rgba(59,130,246,0.5)]' :
                  'bg-slate-700'
                }`} />

                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                      <Shield size={20} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold tracking-tight">{member.full_name}</h4>
                      <p className="text-[9px] font-mono text-blue-400 uppercase tracking-widest">{member.role}</p>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <div className={`px-3 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest ${
                    latestRequest?.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    latestRequest?.status === 'PENDING' || latestRequest?.status === 'PENDING_MANAGER' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-white/5 text-slate-500 border-white/10'
                  }`}>
                    {latestRequest?.status === 'PENDING_MANAGER' ? 'WAITING MANAGER' : (latestRequest?.status || 'Offline')}
                  </div>
                </div>

                {/* Información de la solicitud */}
                <div className="bg-black/30 rounded-2xl p-4 border border-white/5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Próximo Viernes:</span>
                    <span className="text-[10px] font-mono text-white">
                      {latestRequest ? latestRequest.friday_date : 'N/A'}
                    </span>
                  </div>
                  <div className="h-[1px] w-full bg-white/5" />
                  <div className="flex items-center gap-2">
                    <div className={`h-1.5 w-1.5 rounded-full ${hasRequested ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-slate-800'}`} />
                    <span className="text-[9px] text-slate-400 italic">
                      {hasRequested ? "Transmisión de datos activa" : "Sin actividad reciente"}
                    </span>
                  </div>
                </div>

                {/* Decoración Estética */}
                <Smartphone size={40} className="absolute -right-4 -bottom-4 text-white/5 rotate-12" />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}