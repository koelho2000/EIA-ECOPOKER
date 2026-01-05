
import React from 'react';
import { Home, Trophy, BookOpen, Settings } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  gameStarted: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, gameStarted }) => {
  const tabs = [
    { id: 'play', icon: Home, label: 'Jogar' },
    { id: 'scores', icon: Trophy, label: 'Ranking' },
    { id: 'rules', icon: BookOpen, label: 'Regras' },
    { id: 'settings', icon: Settings, label: 'Ajustes' },
  ];

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-zinc-50 dark:bg-zinc-950 shadow-2xl relative">
      <header className="pt-safe bg-emerald-900 dark:bg-emerald-950 text-white px-6 pb-6 rounded-b-[40px] shadow-2xl z-20">
        <div className="flex justify-between items-end pt-4">
          <div>
            <h1 className="text-2xl font-black tracking-tighter leading-none">EIA-ECOPOKER</h1>
            <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mt-1 opacity-80">Sustainable Strategy</p>
          </div>
          <div className="bg-white/10 px-3 py-1 rounded-full backdrop-blur-md">
            <span className="text-[10px] font-bold">v1.0.0</span>
          </div>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
        <div className="p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 pb-safe z-50 rounded-t-3xl">
        <div className="flex justify-around items-center h-20 px-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center space-y-1 w-16 transition-all duration-300 ${
                  isActive ? 'text-emerald-600 dark:text-emerald-400 scale-110' : 'text-zinc-400'
                }`}
              >
                <div className={`p-2 rounded-2xl transition-colors ${isActive ? 'bg-emerald-50 dark:bg-emerald-900/30' : ''}`}>
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
