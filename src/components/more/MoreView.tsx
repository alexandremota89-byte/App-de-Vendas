import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Wallet, 
  Calendar, 
  BarChart3, 
  Database, 
  UserCheck, 
  Sparkles, 
  ChevronRight, 
  ArrowLeft,
  DollarSign,
  Cake,
  Package,
  ShieldCheck,
  FileSpreadsheet,
  Clock
} from 'lucide-react';
import { FinancialView } from '../financial/FinancialView';
import { AgendaView } from '../agenda/AgendaView';
import { ReportsView } from '../reports/ReportsView';
import { formatCurrency } from '../../utils/formatters';

interface MoreViewProps {
  initialSubSection?: 'menu' | 'financeiro' | 'agenda' | 'relatorios';
}

export const MoreView: React.FC<MoreViewProps> = ({ initialSubSection = 'menu' }) => {
  const [subSection, setSubSection] = useState<'menu' | 'financeiro' | 'agenda' | 'relatorios'>(initialSubSection);
  const { metrics, consultantName, consultantPhone, consultantEmail, consultantPhotoUrl, consultantPixKey, currentCycle } = useApp();

  if (subSection === 'financeiro') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSubSection('menu')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200/80 px-3 py-1.5 rounded-xl shadow-2xs cursor-pointer transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Menu</span>
        </button>
        <FinancialView />
      </div>
    );
  }

  if (subSection === 'agenda') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSubSection('menu')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200/80 px-3 py-1.5 rounded-xl shadow-2xs cursor-pointer transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Menu</span>
        </button>
        <AgendaView />
      </div>
    );
  }

  if (subSection === 'relatorios') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSubSection('menu')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200/80 px-3 py-1.5 rounded-xl shadow-2xs cursor-pointer transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Menu</span>
        </button>
        <ReportsView />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto pb-16">
      {/* Profile & Info Header */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {consultantPhotoUrl ? (
            <img 
              src={consultantPhotoUrl} 
              alt="Perfil" 
              className="w-14 h-14 rounded-2xl object-cover shadow-xs shrink-0 border border-slate-200" 
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-[#4A0E2E] text-white flex items-center justify-center text-xl font-bold shadow-xs">
              💄
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-slate-900 leading-tight tracking-tight">
                {consultantName}
              </h2>
              <span className="bg-emerald-50 text-emerald-900 border border-emerald-200/80 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {currentCycle}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1 space-y-0.5 font-medium">
              {consultantPhone && <p>📱 {consultantPhone}</p>}
              {consultantEmail && <p>✉️ {consultantEmail}</p>}
              <p className="font-mono pt-0.5">PIX: {consultantPixKey || 'Não configurado'}</p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setSubSection('relatorios')}
          className="text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-colors shrink-0 border border-emerald-200/60"
        >
          Editar Perfil
        </button>
      </div>

      {/* Main Menu Navigation Grid / List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
        {/* 1. Financeiro & Lucro */}
        <button
          onClick={() => setSubSection('financeiro')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200/60 flex items-center justify-center font-bold shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span>Financeiro & Lucro Real</span>
                {metrics.overdueInstallmentsCount > 0 && (
                  <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {metrics.overdueInstallmentsCount} fiados vencidos
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Controle de fiado, despesas, margem e recebimentos
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* 2. Agenda & Lembretes */}
        <button
          onClick={() => setSubSection('agenda')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-900 border border-rose-200/60 flex items-center justify-center font-bold shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span>Agenda & Lembretes</span>
                {metrics.birthdaysThisMonthCount > 0 && (
                  <span className="bg-pink-100 text-pink-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {metrics.birthdaysThisMonthCount} aniversários
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Aniversariantes do mês, cobranças e pós-venda
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* 3. Relatórios & Exportação */}
        <button
          onClick={() => setSubSection('relatorios')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/60 flex items-center justify-center font-bold shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900">
                Relatórios & Configurações
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Ranking de mais vendidos, clientes VIP e backup
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Quick Summary Pill */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs space-y-2">
        <div className="flex justify-between items-center font-medium text-slate-600">
          <span>Total Vendido Geral:</span>
          <span className="font-bold text-slate-900">{formatCurrency(metrics.totalRevenue)}</span>
        </div>
        <div className="flex justify-between items-center font-medium text-slate-600">
          <span>Lucro Líquido Acumulado:</span>
          <span className="font-bold text-emerald-800">+{formatCurrency(metrics.netProfit)}</span>
        </div>
        <div className="flex justify-between items-center font-medium text-slate-600">
          <span>Total a Receber (Fiado):</span>
          <span className="font-bold text-amber-800">{formatCurrency(metrics.totalFiadoPending)}</span>
        </div>
      </div>
    </div>
  );
};
