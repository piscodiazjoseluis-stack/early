'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Send, Terminal, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function ViernesCalendar({ userProfile }: { userProfile: any }) {
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [isTransmitting, setIsTransmitting] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date) return toast.error("COORDENADAS DE FECHA REQUERIDAS");

    // 1. VALIDACIÓN: ¿Es realmente un viernes? (Corrección de zona horaria incluida)
    const selectedDate = new Date(date + 'T12:00:00'); 
    // getDay() devuelve 5 para Viernes
    if (selectedDate.getDay() !== 5) {
      return toast.error("OPERACIÓN FALLIDA: Solo puedes escoger tu Early para los días Viernes.");
    }

    setIsTransmitting(true);

    try {
      // 2. VALIDACIÓN: ¿Alguien de mi equipo ya reservó este viernes?
      const { data: teamConflict } = await supabase
        .from('early_requests')
        .select('id')
        .eq('team_id', userProfile.team_id)
        .eq('friday_date', date)
        .neq('status', 'REJECTED') // Ignorar los que fueron rechazados
        .maybeSingle();

      if (teamConflict) {
        throw new Error("CONFLICTO DE ESCUADRÓN: Ya existe una solicitud activa para este viernes en tu equipo.");
      }

      // 3. VALIDACIÓN: ¿Salí el viernes pasado?
      const lastFriday = new Date(selectedDate);
      lastFriday.setDate(selectedDate.getDate() - 7);
      const lastFridayStr = lastFriday.toISOString().split('T')[0];

      const { data: consecutiveConflict } = await supabase
        .from('early_requests')
        .select('id')
        .eq('user_id', userProfile.id)
        .eq('friday_date', lastFridayStr)
        .eq('status', 'APPROVED') // Solo bloquea si fue aprobado
        .maybeSingle();

      if (consecutiveConflict) {
        throw new Error("RESTRICCIÓN DE FRECUENCIA: No puedes solicitar 2 viernes seguidos.");
      }

      // 4. INSERCIÓN FINAL
      const { error: insertError } = await supabase.from('early_requests').insert([
        { 
          user_id: userProfile.id, 
          team_id: userProfile.team_id,
          friday_date: date, 
          reason,
          status: 'PENDING'
        }
      ]);

      if (insertError) throw insertError;

      toast.success("TRANSMISIÓN EXITOSA: Solicitud en cola de validación.");
      setDate('');
      setReason('');

    } catch (error: any) {
      toast.error(error.message || "ERROR EN EL ENLACE");
    } finally {
      setIsTransmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative p-[1px] rounded-[2.5rem] bg-gradient-to-br from-blue-500/30 via-transparent to-purple-500/30 shadow-2xl overflow-hidden group"
    >
      <div className="bg-slate-950/90 backdrop-blur-3xl p-8 md:p-10 rounded-[2.5rem] relative">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
              <CalendarIcon size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">Agendar Viernes</h2>
              <div className="flex items-center gap-2 font-mono text-[10px] text-blue-500/60 uppercase tracking-[0.2em]">
                <Terminal size={12} className="animate-pulse" />
                <span>Protocolo de Salida: V2.5</span>
              </div>
            </div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-blue-500/5 border border-blue-500/20">
             <span className="text-[10px] font-mono text-blue-400 font-bold tracking-widest uppercase animate-pulse">● System Ready</span>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-blue-400">Coordenadas Temporales</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white font-mono focus:border-blue-500/50 transition-all cursor-pointer [color-scheme:dark]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Justificación del Módulo</label>
            <input 
              type="text" 
              placeholder="Ej: Recarga de batería personal"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white font-mono placeholder:text-slate-800 focus:border-purple-500/50 transition-all"
            />
          </div>

          <div className="md:col-span-2 mt-4">
            <button 
              disabled={isTransmitting}
              className="relative w-full py-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm tracking-[0.4em] uppercase transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] active:scale-[0.98] overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                {isTransmitting ? "Verificando Seguridad..." : (
                  <>
                    <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    <span>Confirmar Transmisión</span>
                  </>
                )}
              </span>
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
              />
            </button>
          </div>
        </form>

        {/* Footer info */}
        <div className="mt-6 pt-6 border-t border-white/5 flex flex-col gap-2">
           <div className="flex items-center gap-2 text-amber-500/50 text-[8px] font-mono uppercase">
             <AlertCircle size={10} />
             <span>RESTRICCIÓN: Máximo 1 early por equipo/viernes. No consecutividad.</span>
           </div>
        </div>
      </div>
    </motion.div>
  );
}