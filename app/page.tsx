'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation'; // IMPORTANTE: Para la redirección
import ViernesCalendar from '@/components/ViernesCalendar';
import RequestList from '@/components/RequestList';
import LeadView from '@/components/LeadView';
import TeamView from '@/components/TeamView';
import HistoryView from '@/components/HistoryView'; 
import AnalyticsView from '@/components/AnalyticsView';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogOut, Zap, ShieldCheck, 
  LayoutDashboard, ClipboardList, Users,
  History, BarChart3, Fingerprint, ShieldAlert, Terminal
} from "lucide-react";

// COMPONENTE DE ACCESO DENEGADO CON ESTÉTICA NEXUS V2.5
const AccessDenied = () => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="h-[600px] flex items-center justify-center p-8"
  >
    <div className="relative p-[1px] rounded-[2.5rem] bg-gradient-to-br from-rose-500/30 via-transparent to-orange-500/30 max-w-2xl w-full">
      <div className="bg-slate-950/90 backdrop-blur-3xl p-12 rounded-[2.5rem] text-center space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.2)]">
            <ShieldAlert size={40} />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Acceso Restringido</h2>
          <div className="flex items-center justify-center gap-2 font-mono text-[10px] text-rose-500/60 uppercase tracking-[0.2em]">
            <Terminal size={12} className="animate-pulse" />
            <span>Security_Protocol: Violation_Detected</span>
          </div>
        </div>
        <p className="text-slate-400 font-mono text-sm leading-relaxed max-w-md mx-auto">
          No tienes los privilegios necesarios para acceder a este módulo de gestión. 
          <span className="block mt-2 text-rose-400/80 border border-rose-500/20 bg-rose-500/5 py-2 px-4 rounded-lg">
            REQUERIDO: PERFIL LEAD O MANAGER
          </span>
        </p>
        <div className="pt-4 flex justify-center gap-4">
          <div className="px-4 py-1.5 rounded-full border border-white/5 bg-white/5 text-[8px] font-mono text-slate-500 uppercase tracking-widest">
            ErrorCode: 403_UNAUTHORIZED
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('analytics');
  const [profile, setProfile] = useState<any>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // Hook para navegar
  const supabase = createClient();

  useEffect(() => {
    async function getInitialData() {
      const { data: { user } } = await supabase.auth.getUser();
      
      // CORRECCIÓN: Si no hay usuario, redirigir al login inmediatamente
      if (!user) {
        router.push('/login');
        return;
      }

      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*, teams(name)')
          .eq('id', user.id)
          .single();
        
        if (!profileData) {
          router.push('/login');
          return;
        }

        setProfile(profileData);
        setActiveTab('analytics');

        let query = supabase.from('early_requests').select('*', { count: 'exact', head: true });
        if (profileData.role === 'MANAGER') {
          query = query.eq('status', 'PENDING_MANAGER');
        } else {
          query = query.eq('team_id', profileData.team_id).eq('status', 'PENDING');
        }
        const { count } = await query;
        setPendingCount(count || 0);
      }
      setLoading(false);
    }
    getInitialData();
  }, [supabase, router]);

  // Pantalla de carga estética mientras verifica sesión
  if (loading) return (
    <div className="bg-[#020617] min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Zap className="text-blue-500 animate-pulse" size={32} />
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.4em]">Sincronizando Nexus...</span>
      </div>
    </div>
  );

  // Si después de cargar no hay perfil, no renderizamos nada (el useEffect ya estará redirigiendo)
  if (!profile) return null;

  const tabs = profile.role === 'MANAGER' 
    ? [
        { id: 'analytics', label: 'Dashboard Pro', icon: BarChart3, color: 'text-blue-400', bg: 'bg-blue-600/20' },
        { id: 'history', label: 'Historial Global', icon: History, color: 'text-emerald-400', bg: 'bg-emerald-600/20' },
        { id: 'requests', label: 'Gestión Solicitudes', icon: ClipboardList, color: 'text-purple-400', bg: 'bg-purple-600/20', badge: pendingCount },
        { id: 'team', label: 'Estado Global', icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-600/20' },
      ]
    : [
        { id: 'analytics', label: 'Dashboard', icon: BarChart3, color: 'text-blue-400', bg: 'bg-blue-600/20' },
        { id: 'dashboard', label: 'Mis Solicitudes', icon: LayoutDashboard, color: 'text-blue-400', bg: 'bg-blue-600/20' },
        { id: 'requests', label: 'Gestión Solicitudes', icon: ClipboardList, color: 'text-purple-400', bg: 'bg-purple-600/20', badge: profile.role !== 'EMPLOYEE' ? pendingCount : 0 },
        { id: 'team', label: 'Mi Equipo', icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-600/20' },
      ];

  return (
    <main className="relative min-h-screen w-full bg-[#020617] text-slate-200 overflow-x-hidden">
      <div className="fixed top-[-10%] left-[-5%] w-[60%] h-[60%] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[60%] h-[60%] rounded-full bg-purple-600/5 blur-[120px] pointer-events-none" />

      <nav className="relative z-20 border-b border-white/[0.03] bg-slate-950/40 backdrop-blur-3xl px-8 py-4">
        <div className="max-w-[1700px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6 group">
            <motion.div whileHover={{ scale: 1.05 }} className="relative h-14 w-14 flex items-center justify-center">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-2 border-dashed border-blue-500/30 rounded-2xl" />
              <motion.div whileHover={{ rotate: 180 }} transition={{ type: "spring", stiffness: 260, damping: 20 }} className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-white/20 z-10">
                <Zap className="text-white fill-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" size={22} />
              </motion.div>
            </motion.div>
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black tracking-tighter flex items-center leading-none">
                  <span className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">PMO</span>
                  <span className="relative ml-1 italic bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-600 bg-[length:200%_auto] animate-gradient-x">PORTAL</span>
                </h1>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shadow-[0_0_5px_#60a5fa]" />
                  <span className="text-[7px] font-black text-blue-400 uppercase tracking-[0.2em]">Live</span>
                </div>
              </div>
              <p className="text-[9px] text-slate-500 font-mono tracking-[0.4em] uppercase mt-1 flex items-center gap-2">
                <span className="text-blue-500/50">#</span> Nexus Engine v2.5 
                <span className="h-[1px] w-8 bg-slate-800" />
                <span className="text-blue-400/40 italic">Active_Session</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right border-r border-white/10 pr-6">
              <p className="text-xs font-black text-white uppercase tracking-tight">{profile.full_name}</p>
              <p className="text-[8px] text-blue-400 font-mono tracking-widest uppercase flex items-center justify-end gap-1">
                <ShieldCheck size={10} /> {profile.role}
              </p>
            </div>
            <form action="/api/auth/signout" method="post">
              <motion.button whileHover={{ scale: 1.05, backgroundColor: 'rgba(244,63,94,0.1)' }} whileTap={{ scale: 0.95 }} className="p-3 rounded-xl bg-white/5 border border-white/10 hover:text-rose-400 transition-all shadow-inner">
                <LogOut size={18} />
              </motion.button>
            </form>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-[1700px] mx-auto px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-2 space-y-6">
          <div className="p-2 rounded-[2rem] border border-white/5 bg-slate-900/20 backdrop-blur-2xl shadow-inner">
            <div className="space-y-1">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`relative w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 group ${activeTab === tab.id ? 'text-white' : 'text-slate-500 hover:bg-white/5'}`}>
                  {activeTab === tab.id && <motion.div layoutId="pill" className={`absolute inset-0 rounded-2xl ${tab.bg} border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]`} />}
                  <div className={`relative z-10 transition-transform ${activeTab === tab.id ? 'scale-110 ' + tab.color : 'group-hover:text-slate-300'}`}>
                    <tab.icon size={18} />
                  </div>
                  <span className="relative z-10 text-[10px] font-black uppercase tracking-wider text-left leading-tight flex-1">{tab.label}</span>
                  {tab.badge ? <span className="relative z-10 bg-rose-600 text-[9px] px-1.5 py-0.5 rounded-md font-bold">{tab.badge}</span> : null}
                </button>
              ))}
            </div>
          </div>
          <div className="p-6 rounded-[2rem] border border-white/10 bg-gradient-to-br from-blue-500/10 to-transparent backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-125 transition-transform duration-700"><Fingerprint size={100} className="text-blue-400" /></div>
            <p className="text-[9px] font-black text-blue-400/60 uppercase tracking-[0.3em] mb-4">Auth Level</p>
            <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-6 drop-shadow-lg">{profile.role}</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-[8px] font-mono text-slate-500 uppercase tracking-widest"><span>Efficiency</span><span className="text-blue-400">Optimized</span></div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-[1px]">
                <motion.div initial={{ width: 0 }} animate={{ width: '75%' }} className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
              </div>
            </div>
          </div>
        </aside>

        <section className="lg:col-span-10 min-h-[800px]">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
              {activeTab === 'analytics' && <AnalyticsView />}
              {activeTab === 'dashboard' && (
                <div className="space-y-8">
                  <ViernesCalendar userProfile={profile} />
                  <RequestList profile={profile} />
                </div>
              )}
              {activeTab === 'history' && <HistoryView />}
              {activeTab === 'team' && <TeamView teamId={profile.team_id} />}
              {activeTab === 'requests' && (
                profile.role === 'EMPLOYEE' ? <AccessDenied /> : <LeadView teamId={profile.team_id} profile={profile} />
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      </div>
    </main>
  );
}