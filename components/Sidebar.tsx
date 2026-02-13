'use client';
import { useState, useEffect } from 'react';
import { LayoutDashboard, ClipboardList, Users, LogOut, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

export default function Sidebar({ activeTab, setActiveTab, profile }: any) {
  const [pendingCount, setPendingCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    // Si no hay perfil, el sidebar no sabe quién es el usuario
    if (!profile?.id) {
      console.log("Sidebar: Esperando datos del perfil...");
      return;
    }

    const fetchCounts = async () => {
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
        console.error("Error cargando notificaciones:", error);
        return;
      }

      let count = 0;
      if (profile.role === 'MANAGER') {
        count = data?.filter((req: any) => {
          const role = Array.isArray(req.profiles) ? req.profiles[0]?.role : req.profiles?.role;
          return req.status === 'PENDING_MANAGER' || (req.status === 'PENDING' && role === 'LEAD');
        }).length;
      } else if (profile.role === 'LEAD') {
        count = data?.filter((req: any) => 
          req.status === 'PENDING' && req.team_id === profile.team_id && req.user_id !== profile.id
        ).length;
      }
      setPendingCount(count || 0);
    };

    fetchCounts();

    const channel = supabase
      .channel('sidebar-changes')
      .on('postgres_changes' as any, { event: '*', table: 'early_requests' }, () => fetchCounts())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  const menuItems = [
    { id: 'dashboard', label: profile?.role === 'MANAGER' ? 'Dashboard Pro' : 'Mi Panel', icon: LayoutDashboard },
    { id: 'history', label: 'Historial Global', icon: ClipboardList },
    { id: 'team', label: 'Gestión Solicitudes', icon: Users }, // Asegúrate que el ID sea 'team'
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-20 lg:w-64 bg-slate-950/50 backdrop-blur-xl border-r border-white/10 z-50">
      <div className="p-6 flex items-center gap-3">
        <Zap className="text-blue-500" size={24} />
        <span className="hidden lg:block font-bold text-white tracking-widest text-sm uppercase">PMO Space</span>
      </div>

      <nav className="mt-10 px-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all relative group ${
              activeTab === item.id ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:bg-white/5'
            }`}
          >
            <div className="relative">
              <item.icon size={22} />
              {/* ESTO ES LO QUE BUSCAMOS: El badge rojo */}
              {item.id === 'team' && pendingCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-slate-950 animate-bounce">
                  {pendingCount}
                </span>
              )}
            </div>
            <span className="hidden lg:block font-medium text-sm">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}