
import React, { useState } from 'react';
import { AppRoute, User } from '../types';
import { Icons } from '../constants';
import SignaturePasswordModal from './SignaturePasswordModal';

interface SidebarProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  isOpen: boolean;
  onClose: () => void;
  activeUser: User;
  users: User[];
  onSwitchUser: (user: User) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentRoute, onNavigate, activeUser, users, onSwitchUser }) => {
  const [showSwitch, setShowSwitch] = useState(false);
  const [pendingSwitchUser, setPendingSwitchUser] = useState<User | null>(null);

  const menuItems = [
    { id: AppRoute.DASHBOARD, label: 'Inicio', icon: Icons.Dashboard, restricted: false },
    { id: AppRoute.PATIENTS, label: 'Pacientes', icon: Icons.Users, restricted: false },
    { id: AppRoute.CALENDAR, label: 'Agenda', icon: Icons.Calendar, restricted: false },
    { id: AppRoute.BILLING, label: 'Facturación', icon: Icons.Coins, restricted: false },
    { id: AppRoute.STATISTICS, label: 'Stats', icon: Icons.Briefcase, restricted: true },
    { id: AppRoute.FINANCIAL_DISTRIBUTION, label: 'Liquidación', icon: Icons.Coins, restricted: true },
    { id: AppRoute.INVENTORY, label: 'Stock', icon: Icons.Box, restricted: true },
    { id: AppRoute.INVESTMENTS, label: 'Inversiones', icon: Icons.Coins, restricted: true },
    { id: AppRoute.ASSETS, label: 'Activos', icon: Icons.Stethoscope, restricted: true },
    { id: AppRoute.SERVICES, label: 'Servicios', icon: Icons.Briefcase, restricted: true },
    { id: AppRoute.AI_CONSULTANT, label: 'IA', icon: Icons.Brain, restricted: true },
    { id: AppRoute.SETTINGS, label: 'Ajustes', icon: Icons.Dashboard, restricted: false },
  ];

  const handleNavigate = (route: AppRoute) => {
    onNavigate(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isAdmin = activeUser.roleType === 'ADMIN';

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[100] bg-white border-b border-slate-200 shadow-sm flex flex-col h-auto lg:h-24">
        
        {/* TOP LOGO AND USER AREA */}
        <div className="flex items-center justify-between px-4 lg:px-10 h-14 lg:h-16 border-b border-slate-50 lg:border-none">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => handleNavigate(AppRoute.DASHBOARD)}>
            <div className={`w-8 h-8 lg:w-10 lg:h-10 ${activeUser.color} rounded-xl flex items-center justify-center text-white shadow-lg transition-all duration-500`}>
              <Icons.Stethoscope />
            </div>
            <span className="text-lg lg:text-xl font-black text-slate-800 tracking-tighter">Noah’s <span className="text-sky-600">Agency</span></span>
          </div>

          <button 
            onClick={() => setShowSwitch(!showSwitch)}
            className="flex items-center gap-2 lg:gap-3 p-1 bg-slate-100 rounded-full lg:rounded-2xl hover:bg-slate-200 transition-all border border-transparent"
          >
            <div className="text-right hidden sm:block px-2">
              <p className="text-[10px] font-black text-slate-800 leading-none">{activeUser.name.split(' ')[0]}</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{activeUser.role}</p>
            </div>
            <img src={activeUser.avatar} className="w-8 h-8 lg:w-10 lg:h-10 rounded-full lg:rounded-xl border-2 border-white shadow-sm object-cover" alt="Profile" />
          </button>
        </div>

        {/* TAB NAVIGATION AREA - HORIZONTAL SCROLLABLE ON MOBILE */}
        <nav className="flex items-center gap-1 h-12 lg:h-10 px-2 lg:px-10 overflow-x-auto no-scrollbar scroll-smooth bg-slate-50/50 lg:bg-transparent">
          {menuItems.map((item) => {
            const isActive = currentRoute === item.id;
            if (!isAdmin && item.restricted) return null;

            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`flex items-center gap-2 px-4 lg:px-6 h-full transition-all duration-300 group whitespace-nowrap border-b-2 ${
                  isActive 
                  ? 'border-sky-600 text-sky-700 bg-sky-50/50' 
                  : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-white'
                }`}
              >
                <span className={`${isActive ? 'text-sky-600' : 'text-slate-400 group-hover:text-sky-500'} transition-colors scale-90 lg:scale-100`}>
                  {item.icon()}
                </span>
                <span className={`font-black text-[10px] lg:text-[11px] uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* USER SWITCH MODAL */}
      {showSwitch && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn" onClick={() => setShowSwitch(false)}>
          <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden animate-slideUp" onClick={e => e.stopPropagation()}>
            <div className="p-8 bg-slate-50 border-b border-slate-100 text-center">
              <h3 className="text-xl font-black text-slate-800 italic">Perfiles del Equipo</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gestión Estomatológica</p>
            </div>
            <div className="p-4 space-y-2">
              {users.map(u => (
                <button 
                  key={u.id}
                  onClick={() => { 
                    if (u.id === activeUser.id) { setShowSwitch(false); return; }
                    setPendingSwitchUser(u); 
                  }}
                  className={`w-full flex items-center gap-4 p-4 rounded-[2rem] hover:bg-slate-50 transition-all border border-transparent ${activeUser.id === u.id ? 'bg-sky-50 border-sky-100' : ''}`}
                >
                  <img src={u.avatar} className="w-12 h-12 rounded-[1.25rem] border-2 border-white shadow-sm object-cover" alt="" />
                  <div className="text-left">
                    <p className="text-sm font-black text-slate-800 leading-tight">{u.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{u.role}</p>
                  </div>
                  {activeUser.id === u.id && <div className="ml-auto w-2 h-2 bg-sky-500 rounded-full" />}
                </button>
              ))}
            </div>
            <button onClick={() => setShowSwitch(false)} className="w-full py-6 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors">Cerrar</button>
          </div>
        </div>
      )}

      {pendingSwitchUser && (
        <SignaturePasswordModal 
          isOpen={true} 
          onClose={() => setPendingSwitchUser(null)} 
          onSuccess={() => {
            onSwitchUser(pendingSwitchUser);
            setPendingSwitchUser(null);
            setShowSwitch(false);
          }} 
          doctorName={pendingSwitchUser.name}
          overridePassword={pendingSwitchUser.password}
        />
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </>
  );
};

export default Sidebar;
