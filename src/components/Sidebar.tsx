import React from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Mail, 
  Users, 
  CreditCard, 
  Zap, 
  ShieldAlert, 
  History, 
  Briefcase,
  Menu,
  X
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  balance: number;
  currentUserEmail?: string | null;
  onLogout?: () => void;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  balance,
  currentUserEmail,
  onLogout
}: SidebarProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, category: 'GÉNÉRAL' },
    { id: 'sms', label: 'SMS Marketing', icon: MessageSquare, category: 'MARKETING' },
    { id: 'email', label: 'Email Marketing', icon: Mail, category: 'MARKETING' },
    { id: 'contacts', label: 'Gestion Contacts', icon: Users, category: 'MARKETING' },
    { id: 'billing', label: 'Rechargement Solde', icon: CreditCard, category: 'FINANCES' },
    { id: 'flash-v1', label: 'Flash Account V1', icon: Zap, category: 'KITS CMS OUTILS' },
    { id: 'flash-v2', label: 'Flash Account V2', icon: ShieldAlert, category: 'KITS CMS OUTILS' },
    { id: 'history', label: 'Historique Liens', icon: History, category: 'KITS CMS OUTILS' },
  ];

  const categories = Array.from(new Set(menuItems.map(item => item.category)));

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-blue-400 hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar background overlay for mobile */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-slate-950 border-r border-slate-800 p-5 z-40 transition-transform duration-300 ease-in-out flex flex-col justify-between
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="flex flex-col h-full overflow-y-auto pr-1">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 py-4 mb-4 select-none">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/10">
              <Zap className="text-white fill-amber-300/30" size={22} />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-white leading-tight">KitsCms</h1>
              <span className="text-xs bg-blue-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-blue-500/20 font-mono font-medium">Platform CRM</span>
            </div>
          </div>

          {/* Account Balance Widget */}
          <div className="bg-slate-900/60 premium-wallet border border-slate-800/80 rounded-2xl p-4 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center gap-2 justify-between">
              <span className="text-xs text-slate-400 font-medium">Votre Solde Actuel</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="text-xl font-bold text-emerald-400 mt-1 font-mono tracking-tight">
              {balance.toLocaleString('fr-FR')} <span className="text-xs text-slate-300 font-sans font-normal">FCFA</span>
            </div>
            <button 
              onClick={() => {
                setActiveTab('billing');
                setIsOpen(false);
              }}
              className="w-full text-center mt-3 py-1.5 bg-slate-800 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 rounded-lg text-xs font-semibold border border-slate-700/60 hover:border-blue-500/30 transition-all duration-200 cursor-pointer"
            >
              + Recharger Compte
            </button>
          </div>

          {/* Nav groups */}
          <nav className="space-y-6 flex-1">
            {categories.map(category => (
              <div key={category} className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 tracking-wider px-3 font-mono block">
                  {category}
                </span>
                <div className="space-y-1">
                  {menuItems
                    .filter(item => item.category === category)
                    .map(item => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            setIsOpen(false);
                          }}
                          className={`
                            w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer group
                            ${isActive 
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10' 
                              : 'text-slate-400 hover:text-white hover:bg-slate-900'}
                          `}
                        >
                          <Icon size={18} className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`} />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* User auth state & Logout */}
        {currentUserEmail && (
          <div className="mt-4 pt-3 border-t border-slate-900 flex flex-col gap-1.5 select-none text-left">
            <div className="flex items-center gap-2 px-2 text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono truncate max-w-[180px]" title={currentUserEmail}>
                {currentUserEmail}
              </span>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-rose-950/20 hover:bg-rose-900/30 border border-rose-950/30 text-rose-400 hover:text-rose-300 rounded-xl text-[11px] font-bold cursor-pointer transition-all duration-200"
              >
                Se déconnecter
              </button>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="pt-3 mt-3 border-t border-slate-900 text-center select-none">
          <div className="text-[10px] text-slate-600 font-mono">
            SECURE SANDBOX ENVIRONMENT
          </div>
          <div className="text-[10px] text-blue-500/60 font-mono mt-0.5">
            SillyFR Studio Dev © 2026
          </div>
        </div>
      </aside>
    </>
  );
}
