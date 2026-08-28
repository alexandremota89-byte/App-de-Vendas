import React from 'react';
import { 
  Home, 
  Users, 
  Package, 
  ShoppingBag, 
  Menu,
  PlusCircle 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export type TabType = 'inicio' | 'estoque' | 'vendas' | 'clientes' | 'mais' | 'financeiro' | 'agenda' | 'relatorios';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenNewSale: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewSale,
}) => {
  const { metrics } = useApp();

  const primaryNavItems: { id: TabType; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'inicio', label: 'Início', icon: Home },
    { 
      id: 'estoque', 
      label: 'Estoque', 
      icon: Package, 
      badge: metrics.lowStockCount > 0 ? metrics.lowStockCount : undefined 
    },
    { 
      id: 'vendas', 
      label: 'Vendas', 
      icon: ShoppingBag 
    },
    { 
      id: 'clientes', 
      label: 'Clientes', 
      icon: Users, 
      badge: metrics.birthdaysThisMonthCount > 0 ? metrics.birthdaysThisMonthCount : undefined 
    },
    { 
      id: 'mais', 
      label: 'Mais', 
      icon: Menu, 
      badge: metrics.overdueInstallmentsCount > 0 ? metrics.overdueInstallmentsCount : undefined 
    },
  ];

  const isMainTabActive = (id: TabType) => {
    if (activeTab === id) return true;
    if (id === 'mais' && (activeTab === 'financeiro' || activeTab === 'agenda' || activeTab === 'relatorios')) {
      return true;
    }
    return false;
  };

  return (
    <>
      {/* Floating Action Button for "Nova Venda" (Mobile & Desktop) */}
      <div className="fixed bottom-20 right-4 sm:right-8 z-40">
        <button
          onClick={onOpenNewSale}
          id="fab-nova-venda-btn"
          className="group flex items-center justify-center bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 hover:from-emerald-900 hover:to-emerald-800 text-white w-12 h-12 rounded-full shadow-lg active:scale-95 transition-all cursor-pointer border border-emerald-500/40"
          title="Nova Venda"
        >
          <PlusCircle className="w-6 h-6 text-emerald-300 group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      {/* Modern Ergonomic Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-lg safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-1 max-w-md sm:max-w-xl mx-auto h-16">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = isMainTabActive(item.id);
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                id={`bottom-nav-${item.id}`}
                className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 rounded-xl transition-all cursor-pointer ${
                  isActive ? 'text-emerald-900 font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.5px] scale-110 text-emerald-900' : 'text-slate-400'}`} />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center shadow-2xs">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] mt-1 leading-none font-semibold">{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-1 w-6 h-0.5 bg-emerald-900 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
