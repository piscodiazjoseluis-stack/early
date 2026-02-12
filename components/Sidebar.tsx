'use client';
import { useState, useEffect } from 'react';
import { LayoutDashboard, ClipboardList, Users, LogOut, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

export default function Sidebar({ activeTab, setActiveTab, profile }: { activeTab: string, setActiveTab: (tab: string) => void, profile: any }) {
  const [pendingCount, setPendingCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    if (!profile) return;

    const fetchCounts = async () => {
      // 1. Traemos los datos incluyendo el perfil para validar roles
      const { data, error }: any = await supabase
        .from('early_requests')
        .select(`
          status,
          user_id,
          team_id,
          profiles:user_id ( role )
        `)
        .or('status.eq.PENDING,status.eq.PENDING_MANAGER');

      if (error) {
        console.error("Error Supabase:", error.message);
        return;
      }

      let count = 0;
      if (profile.role === 'MANAGER') {
        // Filtro para Maria Luisa: ve solicitudes de LEADS o las ya validadas como PENDING_MANAGER
        count = data?.filter((req: any) => {
          const role = Array.isArray(req.profiles) ? req.profiles[0]?.role : req.profiles?.role;
          return req.status === 'PENDING_MANAGER' || (req.status === 'PENDING' && role === 'LEAD');
        }).length;
      } else if (profile.role === 'LEAD') {
        // Filtro para Leads: ven PENDING de su equipo que no sean suyas
        count = data?.filter((req: any) => 
          req.status === 'PENDING' && req.team_id === profile.team_id && req.user_id !== profile.id
        ).length;
      }
      
      setPendingCount(count || 0);
    };

    fetchCounts();

    // Realtime: Ya que activaste los interruptores en Supabase, esto DEBE funcionar
    const channel = supabase
      .channel('sidebar-realtime')
      .on('postgres_changes' as any, { event: '*', table: 'early_requests' }, () => fetchCounts())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile, supabase]);

  const menuItems = [
    { id: 'dashboard', label: profile?.role === 'MANAGER' ? 'Dashboard Pro' : 'Mi Panel', icon: LayoutDashboard },
    { id: 'history', label: 'Historial Global', icon: ClipboardList }, // Cambié el ID para que coincida con tu diseño
    { 
      id: 'team', // ESTE ID DEBE SER 'team' PARA QUE EL BADGE SE MUESTRE ABAJO
      label: profile?.role === 'MANAGER' ? 'Gestión Solicitudes' : 'Gestión de Equipo', 
      icon: Users,
    },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-20 lg:w-64 bg-slate-950/50 backdrop-blur-xl border-r border-white/10 z-50 transition-all">
      <div className="p-6 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.5)]">
          <Zap className="text-white fill-white" size={20} />
        </div>
        <span className="hidden lg:block font-black text-white tracking-widest text-sm">PMO SPACE</span>
      </div>

      <nav className="mt-10 px-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all relative group ${
              activeTab === item.id ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            <div className="relative">
              <item.icon size={22} />
              
              {/* CORRECCIÓN: Si el ID es 'team' (Gestión Solicitudes), mostramos el badge */}
              {item.id === 'team' && pendingCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-slate-950 shadow-lg">
                  {pendingCount}
                </span>
              )}
            </div>
            <span className="hidden lg:block font-medium text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Resto del diseño de salida... */}
      <div className="absolute bottom-8 w-full px-4">
          <button className="w-full flex items-center gap-4 p-4 rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut size={22} />
            <span className="hidden lg:block font-medium text-sm">Cerrar Sesión</span>
          </button>
      </div>
    </div>
  );
}