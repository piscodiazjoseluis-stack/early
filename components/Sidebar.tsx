'use client';
import { useState } from 'react';
import { LayoutDashboard, ClipboardList, Users, Settings, LogOut, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Sidebar({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) {
  const menuItems = [
    { id: 'dashboard', label: 'Mi Panel', icon: LayoutDashboard },
    { id: 'requests', label: 'Solicitudes', icon: ClipboardList },
    { id: 'team', label: 'Mi Equipo', icon: Users },
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
            <item.icon size={22} />
            <span className="hidden lg:block font-medium text-sm">{item.label}</span>
            {activeTab === item.id && (
              <motion.div layoutId="active" className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full" />
            )}
          </button>
        ))}
      </nav>

      <div className="absolute bottom-8 w-full px-4">
        <form action="/auth/signout" method="post">
          <button className="w-full flex items-center gap-4 p-4 rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut size={22} />
            <span className="hidden lg:block font-medium text-sm">Cerrar Enlace</span>
          </button>
        </form>
      </div>
    </div>
  );
}