import React from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, Calendar, Database } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenCatalog: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, onOpenCatalog }) => {
  const { 
    consultantName, 
    consultantPhotoUrl,
    currentCycle, 
    cycles, 
    setCurrentCycle 
  } = useApp();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
      <div className="max-w-md sm:max-w-xl md:max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between gap-2">
        
        {/* Consultant Identity */}
        <div 
          className="flex items-center gap-2.5 min-w-0 cursor-pointer group" 
          onClick={onOpenSettings} 
          title="Editar Perfil"
        >
          {consultantPhotoUrl ? (
            <img 
              src={consultantPhotoUrl} 
              alt="Perfil" 
              className="w-9 h-9 rounded-xl object-cover shadow-xs shrink-0 border border-slate-200 group-hover:opacity-90 transition-opacity" 
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-[#4A0E2E] flex items-center justify-center text-white font-bold text-base shadow-xs shrink-0 group-hover:opacity-90 transition-opacity">
              💄
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-bold text-sm sm:text-base text-slate-900 leading-tight truncate tracking-tight group-hover:text-emerald-800 transition-colors">
              {consultantName}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium truncate">
              O Boticário & Eudora
            </p>
          </div>
        </div>

        {/* Action Controls: Cycle Selector & WhatsApp Catalog */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Cycle Selector Pill */}
          <div className="flex items-center gap-1.5 bg-slate-100/90 hover:bg-slate-200/70 border border-slate-200/80 px-2.5 py-1.5 rounded-xl text-xs transition-colors">
            <Calendar className="w-3.5 h-3.5 text-emerald-900" />
            <select
              value={currentCycle}
              onChange={(e) => setCurrentCycle(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
              id="header-cycle-select"
            >
              {cycles.map((c) => (
                <option key={c.id} value={c.name} className="text-slate-900 bg-white font-semibold">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Catalog Button */}
          <button
            onClick={onOpenCatalog}
            id="open-digital-catalog-btn"
            className="flex items-center gap-1.5 bg-[#4A0E2E] hover:bg-[#5C1239] text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            title="Abrir Catálogo para WhatsApp"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">Catálogo</span>
          </button>
        </div>
      </div>
    </header>
  );
};
