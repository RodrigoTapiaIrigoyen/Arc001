import { useState } from 'react';
import {
  Database,
  Home,
  Target,
  Sword,
  Shield,
  Package,
  Map,
  Users,
  ScrollText,
  Trophy,
  ShoppingCart,
  Menu,
  X,
  Search
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
}

export default function Layout({ children, currentView, onViewChange }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'weapons', label: 'Weapons', icon: Sword },
    { id: 'armor', label: 'Armor', icon: Shield },
    { id: 'items', label: 'Items', icon: Package },
    { id: 'enemies', label: 'Enemies', icon: Target },
    { id: 'maps', label: 'Maps', icon: Map },
    { id: 'quests', label: 'Quests', icon: ScrollText },
    { id: 'trackers', label: 'Trackers', icon: Trophy },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingCart },
    { id: 'community', label: 'Community', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-gray-100">
      <div className="fixed top-0 left-0 right-0 h-16 bg-[#0f1420]/80 backdrop-blur-xl border-b border-cyan-500/10 z-50">
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-cyan-500/10 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Database className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  ARC RAIDERS
                </h1>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Tactical Database</p>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3 flex-1 max-w-2xl mx-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Search weapons, enemies, quests..."
                className="w-full bg-[#1a1f2e] border border-cyan-500/20 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-cyan-400">ONLINE</span>
            </div>
          </div>
        </div>
      </div>

      <div className={`fixed top-16 left-0 bottom-0 w-64 bg-[#0f1420]/80 backdrop-blur-xl border-r border-cyan-500/10 z-40 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onViewChange(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400'
                    : 'hover:bg-cyan-500/5 text-gray-400 hover:text-gray-200'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-cyan-400' : 'text-gray-500 group-hover:text-cyan-400'} />
                <span className="font-medium text-sm tracking-wide">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                )}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-cyan-500/10">
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-2">TACTICAL STATUS</p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Data Sync</span>
                <span className="text-cyan-400">Active</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">API Status</span>
                <span className="text-green-400">Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="lg:ml-64 pt-16">
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
