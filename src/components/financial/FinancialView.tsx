import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Expense, ExpenseCategory, Installment } from '../../types';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Receipt, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  PieChart as PieChartIcon, 
  BarChart2, 
  Calendar, 
  MessageCircle, 
  CheckCircle2, 
  X, 
  ArrowDownRight, 
  ArrowUpRight,
  Sparkles,
  HelpCircle,
  Tag,
  Search,
  RotateCcw,
  Check
} from 'lucide-react';
import { 
  formatCurrency, 
  formatDate, 
  formatPhone, 
  getWhatsAppUrl, 
  generatePaymentReminderMessage,
  isDateOverdue 
} from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Amostras & Provadores',
  'Frete & Entregas',
  'Sacolas & Embalagens',
  'Brindes & Mimos',
  'Revistas & Catálogos',
  'Outros',
];

const BRAND_COLORS = ['#005a46', '#801438']; // Emerald Boticário & Wine Eudora
const CATEGORY_COLORS = ['#047857', '#9333ea', '#db2777', '#d97706', '#2563eb', '#475569'];

export const FinancialView: React.FC = () => {
  const { 
    metrics, 
    sales, 
    expenses, 
    addExpense, 
    deleteExpense, 
    markInstallmentPaid,
    consultantName,
    consultantPixKey,
    currentCycle,
    cycles,
    updateCycleTarget 
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'resumo' | 'fiado' | 'despesas' | 'graficos'>('resumo');
  const [fiadoFilter, setFiadoFilter] = useState<'todos_pendentes' | 'vencidos' | 'a_vencer' | 'pagos'>('todos_pendentes');
  const [fiadoSearch, setFiadoSearch] = useState('');
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);

  // Expense form state
  const [expDescription, setExpDescription] = useState('');
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('Amostras & Provadores');
  const [expDate, setExpDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [expNotes, setExpNotes] = useState('');
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  // Target form
  const [newTargetValue, setNewTargetValue] = useState<number>(metrics.currentCycleTarget);

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expDescription.trim() || expAmount <= 0) {
      return;
    }

    addExpense({
      description: expDescription.trim(),
      amount: Number(expAmount),
      date: expDate,
      category: expCategory,
      notes: expNotes.trim() || undefined,
    });

    setExpDescription('');
    setExpAmount(0);
    setExpNotes('');
    setIsAddExpenseModalOpen(false);
  };

  const handleConfirmDeleteExpense = () => {
    if (expenseToDelete) {
      deleteExpense(expenseToDelete.id);
      setExpenseToDelete(null);
    }
  };

  const handleUpdateTarget = (e: React.FormEvent) => {
    e.preventDefault();
    const currentCycleObj = cycles.find(c => c.name === currentCycle) || cycles[0];
    if (currentCycleObj) {
      updateCycleTarget(currentCycleObj.id, Number(newTargetValue));
    }
    setIsTargetModalOpen(false);
  };

  // Compile all installments across sales
  interface FiadoItem {
    clientName: string;
    clientPhone: string;
    saleId: string;
    saleDate: string;
    instId: string;
    installmentNumber: number;
    totalInstallments: number;
    amount: number;
    dueDate: string;
    isPaid: boolean;
    paidAt?: string;
    isOverdue: boolean;
  }

  const allFiadoItems: FiadoItem[] = [];

  sales.forEach(sale => {
    if (sale.installments && sale.installments.length > 0) {
      sale.installments.forEach(inst => {
        allFiadoItems.push({
          clientName: sale.clientName || 'Cliente',
          clientPhone: sale.clientPhone || '',
          saleId: sale.id,
          saleDate: sale.date,
          instId: inst.id,
          installmentNumber: inst.installmentNumber,
          totalInstallments: inst.totalInstallments,
          amount: inst.amount,
          dueDate: inst.dueDate,
          isPaid: !!inst.isPaid,
          paidAt: inst.paidAt,
          isOverdue: !inst.isPaid && isDateOverdue(inst.dueDate),
        });
      });
    } else if (sale.paymentMethod === 'fiado' || sale.status === 'pendente' || sale.status === 'parcial') {
      const isPaid = sale.status === 'pago';
      allFiadoItems.push({
        clientName: sale.clientName || 'Cliente',
        clientPhone: sale.clientPhone || '',
        saleId: sale.id,
        saleDate: sale.date,
        instId: `inst-${sale.id}-1`,
        installmentNumber: 1,
        totalInstallments: 1,
        amount: sale.totalAmount,
        dueDate: sale.date,
        isPaid,
        isOverdue: !isPaid && isDateOverdue(sale.date),
      });
    }
  });

  const pendingList = allFiadoItems.filter(i => !i.isPaid);
  const overdueList = allFiadoItems.filter(i => !i.isPaid && i.isOverdue);
  const upcomingList = allFiadoItems.filter(i => !i.isPaid && !i.isOverdue);
  const paidList = allFiadoItems.filter(i => i.isPaid);

  // Filter based on active fiadoFilter
  let displayedFiadoList: FiadoItem[] = [];
  if (fiadoFilter === 'todos_pendentes') {
    displayedFiadoList = [...pendingList];
  } else if (fiadoFilter === 'vencidos') {
    displayedFiadoList = [...overdueList];
  } else if (fiadoFilter === 'a_vencer') {
    displayedFiadoList = [...upcomingList];
  } else if (fiadoFilter === 'pagos') {
    displayedFiadoList = [...paidList];
  }

  // Filter by search query
  if (fiadoSearch.trim()) {
    const q = fiadoSearch.toLowerCase().trim();
    displayedFiadoList = displayedFiadoList.filter(
      item =>
        item.clientName.toLowerCase().includes(q) ||
        item.clientPhone.includes(q) ||
        item.saleDate.includes(q) ||
        item.dueDate.includes(q)
    );
  }

  // Sort displayed list
  displayedFiadoList.sort((a, b) => {
    if (fiadoFilter === 'pagos') {
      return (b.paidAt || b.dueDate).localeCompare(a.paidAt || a.dueDate);
    }
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    return a.dueDate.localeCompare(b.dueDate);
  });

  // Prepare chart data: Brands
  const brandData = [
    { name: 'O Boticário', value: metrics.boticarioRevenue },
    { name: 'Eudora', value: metrics.eudoraRevenue },
  ].filter(d => d.value > 0);

  // Prepare chart data: Categories
  const categoryMap: Record<string, number> = {};
  sales.forEach(sale => {
    sale.items.forEach(item => {
      categoryMap[item.category] = (categoryMap[item.category] || 0) + item.subtotal;
    });
  });

  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value,
  }));

  // Prepare chart data: Financial overview comparison
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const financialFlowData = [
    { name: 'Faturamento', valor: metrics.totalRevenue, fill: '#047857' },
    { name: 'Custo Produtos', valor: metrics.totalCost, fill: '#d97706' },
    { name: 'Despesas Consultora', valor: totalExpenses, fill: '#dc2626' },
    { name: 'Lucro Líquido', valor: Math.max(0, metrics.netProfit), fill: '#10b981' },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Painel de Controle Financeiro</h2>
            <span className="bg-emerald-50 text-emerald-900 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200/60">
              {currentCycle}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestão detalhada de contas a receber (fiado), despesas operacionais, margens e fluxo de caixa
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTargetModalOpen(true)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer border border-slate-200/60"
          >
            <span>🎯 Ajustar Meta</span>
          </button>

          <button
            onClick={() => setIsAddExpenseModalOpen(true)}
            id="btn-add-expense"
            className="flex items-center gap-1.5 bg-rose-950 hover:bg-rose-900 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-rose-300" />
            <span>Lançar Despesa</span>
          </button>
        </div>
      </div>

      {/* Sub-tabs for financial sections */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60">
        <button
          onClick={() => setActiveSubTab('resumo')}
          className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'resumo' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-4 h-4 text-emerald-800" />
          <span>Resumo & Lucro Real</span>
        </button>

        <button
          onClick={() => setActiveSubTab('fiado')}
          className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'fiado' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-700" />
          <span>Contas a Receber (Fiado)</span>
          {metrics.overdueInstallmentsCount > 0 && (
            <span className="bg-rose-700 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {metrics.overdueInstallmentsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('despesas')}
          className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'despesas' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4 text-rose-800" />
          <span>Despesas da Consultora ({expenses.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('graficos')}
          className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'graficos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart2 className="w-4 h-4 text-emerald-900" />
          <span>Gráficos & Fluxo</span>
        </button>
      </div>

      {/* Sub-tab 1: Resumo & Lucro */}
      {activeSubTab === 'resumo' && (
        <div className="space-y-6">
          {/* Main Financial Flow Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Receita Bruta */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>(+) Faturamento Total</span>
                <span className="text-emerald-800 font-bold">100%</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {formatCurrency(metrics.totalRevenue)}
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">
                Total bruto de todas as vendas
              </span>
            </div>

            {/* 2. Custo dos Produtos */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>(-) Custo Mercadorias</span>
                <span className="text-amber-800 font-bold">
                  {metrics.totalRevenue > 0 ? Math.round((metrics.totalCost / metrics.totalRevenue) * 100) : 0}%
                </span>
              </div>
              <div className="text-2xl font-bold text-amber-800">
                {formatCurrency(metrics.totalCost)}
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">
                Pago a Boticário & Eudora
              </span>
            </div>

            {/* 3. Despesas Operacionais */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>(-) Despesas & Amostras</span>
                <span className="text-rose-800 font-bold">
                  {metrics.totalRevenue > 0 ? Math.round((totalExpenses / metrics.totalRevenue) * 100) : 0}%
                </span>
              </div>
              <div className="text-2xl font-bold text-rose-800">
                {formatCurrency(totalExpenses)}
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">
                Frete, sacolas, amostras, mimos
              </span>
            </div>

            {/* 4. Lucro Líquido Real */}
            <div className="bg-linear-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-white p-4.5 rounded-2xl shadow-sm border border-emerald-800/40">
              <div className="flex items-center justify-between text-xs text-emerald-200 mb-1">
                <span>(=) Lucro Líquido Real</span>
                <span className="text-emerald-300 font-bold">
                  {metrics.totalRevenue > 0 ? Math.round((metrics.netProfit / metrics.totalRevenue) * 100) : 0}% Margem
                </span>
              </div>
              <div className="text-2xl font-bold text-emerald-300">
                {formatCurrency(metrics.netProfit)}
              </div>
              <span className="text-[11px] text-emerald-200/80 block mt-1">
                Dinheiro livre no seu bolso
              </span>
            </div>
          </div>

          {/* Detailed Financial Breakdown Banner */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <h3 className="font-bold text-base text-slate-900 mb-3 tracking-tight">
              Demonstrativo de Resultado do Negócio
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="font-semibold text-slate-700">Faturamento Bruto com Vendas</span>
                <span className="font-bold text-slate-900">{formatCurrency(metrics.totalRevenue)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 text-slate-600">
                <span>(-) Custo de Aquisição dos Produtos O Boticário & Eudora</span>
                <span className="text-rose-800 font-semibold">-{formatCurrency(metrics.totalCost)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 bg-slate-50 px-2.5 rounded-lg font-bold">
                <span className="text-slate-800">(=) Lucro Bruto das Vendas</span>
                <span className="text-emerald-900">+{formatCurrency(metrics.totalRevenue - metrics.totalCost)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 text-slate-600">
                <span>(-) Despesas Operacionais (Frete, Amostras, Mimos, Embalagens)</span>
                <span className="text-rose-800 font-semibold">-{formatCurrency(totalExpenses)}</span>
              </div>
              <div className="flex justify-between py-3 bg-emerald-50 text-emerald-950 border border-emerald-200/80 px-3 rounded-xl font-bold text-sm">
                <span>(=) LUCRO LÍQUIDO FINAL DA CONSULTORA</span>
                <span className="text-emerald-900 text-base font-extrabold">{formatCurrency(metrics.netProfit)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 2: Fiado / Contas a Receber */}
      {activeSubTab === 'fiado' && (
        <div className="space-y-5">
          {/* Header KPI cards for fiado - clickable to filter */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => setFiadoFilter('todos_pendentes')}
              className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                fiadoFilter === 'todos_pendentes'
                  ? 'bg-amber-50/50 border-amber-400 ring-2 ring-amber-400/30 shadow-sm'
                  : 'bg-white border-slate-200/80 hover:border-amber-300 shadow-xs'
              }`}
            >
              <span className="text-xs text-slate-500 font-semibold flex items-center justify-between">
                Total em Aberto (A Receber)
                {fiadoFilter === 'todos_pendentes' && <Check className="w-3.5 h-3.5 text-amber-600" />}
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {formatCurrency(metrics.totalFiadoPending)}
              </div>
              <span className="text-[11px] text-slate-500 block mt-1 font-medium">
                {pendingList.length} parcelas pendentes
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFiadoFilter('vencidos')}
              className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                fiadoFilter === 'vencidos'
                  ? 'bg-rose-100/60 border-rose-500 ring-2 ring-rose-400/40 shadow-sm'
                  : 'bg-rose-50/40 border-rose-200/80 hover:border-rose-400 shadow-xs'
              }`}
            >
              <span className="text-xs text-rose-800 font-bold flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Vencidas / Em Atraso
                </span>
                {fiadoFilter === 'vencidos' && <Check className="w-3.5 h-3.5 text-rose-700" />}
              </span>
              <div className="text-2xl font-bold text-rose-800 mt-1">
                {formatCurrency(metrics.overdueInstallmentsAmount)}
              </div>
              <span className="text-[11px] text-rose-700 font-semibold block mt-1">
                {overdueList.length} parcelas precisam de cobrança
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFiadoFilter('pagos')}
              className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                fiadoFilter === 'pagos'
                  ? 'bg-emerald-50/50 border-emerald-500 ring-2 ring-emerald-400/30 shadow-sm'
                  : 'bg-white border-slate-200/80 hover:border-emerald-300 shadow-xs'
              }`}
            >
              <span className="text-xs text-emerald-800 font-semibold flex items-center justify-between">
                Total Já Recebido
                {fiadoFilter === 'pagos' && <Check className="w-3.5 h-3.5 text-emerald-700" />}
              </span>
              <div className="text-2xl font-bold text-emerald-900 mt-1">
                {formatCurrency(metrics.totalFiadoReceived)}
              </div>
              <span className="text-[11px] text-slate-500 block mt-1 font-medium">
                {paidList.length} parcelas quitadas
              </span>
            </button>
          </div>

          {/* Filter Bar & Search */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Filter pills */}
            <div className="flex flex-wrap items-center gap-1.5 pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setFiadoFilter('todos_pendentes')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  fiadoFilter === 'todos_pendentes'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>Em Aberto</span>
                <span className="bg-white/20 text-current text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {pendingList.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFiadoFilter('vencidos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  fiadoFilter === 'vencidos'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Vencidas / Em Atraso</span>
                <span className="bg-white/20 text-current text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {overdueList.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFiadoFilter('a_vencer')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  fiadoFilter === 'a_vencer'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>A Vencer</span>
                <span className="bg-white/20 text-current text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {upcomingList.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFiadoFilter('pagos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  fiadoFilter === 'pagos'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Quitadas</span>
                <span className="bg-white/20 text-current text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {paidList.length}
                </span>
              </button>
            </div>

            {/* Search input */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={fiadoSearch}
                onChange={e => setFiadoSearch(e.target.value)}
                placeholder="Buscar cliente ou telefone..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
              />
              {fiadoSearch && (
                <button
                  type="button"
                  onClick={() => setFiadoSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Fiado List */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <h3 className="font-bold text-base text-slate-900 tracking-tight">
                  {fiadoFilter === 'vencidos' && '🚨 Parcelas Vencidas que Precisam de Cobrança'}
                  {fiadoFilter === 'a_vencer' && '⏳ Parcelas a Vencer'}
                  {fiadoFilter === 'pagos' && '✅ Histórico de Parcelas Pagas'}
                  {fiadoFilter === 'todos_pendentes' && '📋 Lista de Clientes com Fiado & Parcelas em Aberto'}
                </h3>
                <p className="text-xs text-slate-500">
                  {displayedFiadoList.length} {displayedFiadoList.length === 1 ? 'parcela encontrada' : 'parcelas encontradas'}
                </p>
              </div>
              <span className="text-xs text-slate-500">
                Clique em "Cobrar" para abrir WhatsApp com PIX ou "Dar Baixa" ao receber
              </span>
            </div>

            {displayedFiadoList.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                {fiadoFilter === 'vencidos' ? (
                  <>
                    <CheckCircle2 className="w-12 h-12 text-emerald-700 mx-auto mb-2" />
                    <h4 className="font-bold text-slate-800 text-sm">Nenhuma parcela vencida!</h4>
                    <p className="text-xs text-slate-500 mt-1">Ótima notícia! Nenhuma cliente está com pagamentos em atraso.</p>
                  </>
                ) : fiadoFilter === 'pagos' ? (
                  <>
                    <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <h4 className="font-bold text-slate-800 text-sm">Nenhuma parcela quitada no histórico</h4>
                    <p className="text-xs text-slate-500 mt-1">Conforme você der baixa nas parcelas, elas aparecerão aqui.</p>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-12 h-12 text-emerald-700 mx-auto mb-2" />
                    <h4 className="font-bold text-slate-800 text-sm">Nenhuma parcela pendente encontrada</h4>
                    <p className="text-xs text-slate-500 mt-1">Todas as contas estão em dia.</p>
                  </>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {displayedFiadoList.map((item, idx) => {
                  const reminderText = generatePaymentReminderMessage(
                    item.clientName,
                    {
                      id: item.instId,
                      saleId: item.saleId,
                      installmentNumber: item.installmentNumber,
                      totalInstallments: item.totalInstallments,
                      amount: item.amount,
                      dueDate: item.dueDate,
                      isPaid: item.isPaid,
                    },
                    consultantName,
                    consultantPixKey
                  );
                  const waUrl = getWhatsAppUrl(item.clientPhone, reminderText);

                  return (
                    <div
                      key={idx}
                      className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors ${
                        item.isPaid
                          ? 'bg-emerald-50/20 hover:bg-emerald-50/40'
                          : item.isOverdue
                          ? 'bg-rose-50/50 hover:bg-rose-50/70'
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                            item.isPaid
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : item.isOverdue
                              ? 'bg-rose-100 text-rose-800 border-rose-200'
                              : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}
                        >
                          {item.clientName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm">{item.clientName}</span>
                            {item.isPaid ? (
                              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px] px-2 py-0.5 rounded-full">
                                PAGO
                              </span>
                            ) : item.isOverdue ? (
                              <span className="bg-rose-700 text-white font-bold text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                                EM ATRASO
                              </span>
                            ) : (
                              <span className="bg-amber-100 text-amber-800 border border-amber-300 font-semibold text-[10px] px-2 py-0.5 rounded-full">
                                A VENCER
                              </span>
                            )}
                          </div>
                          <div className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1.5 flex-wrap">
                            <span>
                              Parcela <strong>{item.installmentNumber}/{item.totalInstallments}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Vencimento:{' '}
                              <strong className={item.isOverdue && !item.isPaid ? 'text-rose-800 font-bold' : 'text-slate-800'}>
                                {formatDate(item.dueDate)}
                              </strong>
                            </span>
                            <span>•</span>
                            <span>Venda em {formatDate(item.saleDate)}</span>
                            {item.clientPhone && (
                              <>
                                <span>•</span>
                                <span className="text-slate-400 font-mono">{formatPhone(item.clientPhone)}</span>
                              </>
                            )}
                            {item.paidAt && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-700 font-medium">Pago em {formatDate(item.paidAt)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">Valor da Parcela</span>
                          <span className="font-bold text-base text-slate-900">{formatCurrency(item.amount)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {!item.isPaid ? (
                            <>
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold shadow-xs transition-all ${
                                  item.isOverdue
                                    ? 'bg-rose-700 hover:bg-rose-800 text-white'
                                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                                }`}
                                title="Enviar lembrete amigável no WhatsApp com PIX"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>Cobrar</span>
                              </a>

                              <button
                                type="button"
                                onClick={() => markInstallmentPaid(item.saleId, item.instId, true)}
                                className="flex items-center gap-1.5 bg-emerald-900 hover:bg-emerald-950 text-white px-3.5 py-2 rounded-xl font-semibold shadow-xs transition-all cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Dar Baixa</span>
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => markInstallmentPaid(item.saleId, item.instId, false)}
                              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl font-medium text-xs transition-all cursor-pointer border border-slate-200"
                              title="Reabrir parcela e marcar como pendente"
                            >
                              <RotateCcw className="w-3 h-3 text-slate-500" />
                              <span>Reabrir</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-tab 3: Despesas da Consultora */}
      {activeSubTab === 'despesas' && (
        <div className="space-y-5">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <span className="text-xs text-slate-500">Total de Despesas Registradas</span>
              <div className="text-2xl font-bold text-rose-800">{formatCurrency(totalExpenses)}</div>
            </div>

            <button
              onClick={() => setIsAddExpenseModalOpen(true)}
              className="flex items-center gap-1.5 bg-rose-950 hover:bg-rose-900 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-rose-300" />
              <span>Nova Despesa</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 font-bold text-sm text-slate-900 tracking-tight">
              Histórico de Despesas Operacionais
            </div>

            {expenses.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                Nenhuma despesa lançada ainda. Registre gastos com fretes, provadores e embalagens.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {expenses.map((expense) => (
                  <div key={expense.id} className="p-4 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{expense.description}</span>
                        <span className="bg-slate-100 text-slate-700 border border-slate-200/60 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                          {expense.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        📅 {formatDate(expense.date)} {expense.notes ? `• ${expense.notes}` : ''}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-rose-800 text-sm">
                        -{formatCurrency(expense.amount)}
                      </span>

                      <button
                        type="button"
                        onClick={() => setExpenseToDelete(expense)}
                        className="text-slate-400 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Excluir despesa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-tab 4: Gráficos & Fluxo */}
      {activeSubTab === 'graficos' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Financial Flow Bars */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-900" />
              Fluxo Financeiro: Faturamento vs Custos vs Lucro
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialFlowData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `R$${val}`} />
                  <Tooltip formatter={(value: any) => [formatCurrency(Number(value)), 'Valor']} />
                  <Bar dataKey="valor" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Brand Distribution */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-rose-950" />
              Divisão de Faturamento: O Boticário vs Eudora
            </h3>
            <div className="h-64 flex items-center justify-center">
              {brandData.length === 0 ? (
                <p className="text-xs text-slate-400">Sem dados de vendas</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={brandData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {brandData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={BRAND_COLORS[index % BRAND_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [formatCurrency(Number(value)), 'Faturamento']} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Chart 3: Categories Breakdown */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-2">
            <h3 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-900" />
              Vendas por Categoria de Beleza
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `R$${val}`} />
                  <Tooltip formatter={(value: any) => [formatCurrency(Number(value)), 'Vendas']} />
                  <Bar dataKey="value" fill="#047857" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {isAddExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Lançar Nova Despesa</h3>
              <button onClick={() => setIsAddExpenseModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Descrição do Gasto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 50 Sacolas para presentes, Frete da caixa..."
                  value={expDescription}
                  onChange={(e) => setExpDescription(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-800/15 focus:border-emerald-800 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={expAmount || ''}
                    onChange={(e) => setExpAmount(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-800/15 focus:border-emerald-800 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Data</label>
                  <input
                    type="date"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Categoria</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value as ExpenseCategory)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observações (Opcional)</label>
                <input
                  type="text"
                  placeholder="Anotações..."
                  value={expNotes}
                  onChange={(e) => setExpNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-950 hover:bg-rose-900 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Salvar Despesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Target Modal */}
      {isTargetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-xl border border-slate-200 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Ajustar Meta de Vendas</h3>
              <button onClick={() => setIsTargetModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTarget} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Meta para o {currentCycle} (R$)
                </label>
                <input
                  type="number"
                  step="50"
                  min="100"
                  value={newTargetValue}
                  onChange={(e) => setNewTargetValue(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-base font-bold text-emerald-950"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTargetModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Salvar Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Expense Deletion */}
      <ConfirmModal
        isOpen={!!expenseToDelete}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={handleConfirmDeleteExpense}
        title="Excluir Despesa"
        confirmLabel="Excluir Despesa"
        cancelLabel="Cancelar"
        variant="danger"
        icon="trash"
        message={
          expenseToDelete ? (
            <p>
              Deseja realmente excluir o registro da despesa <strong className="text-slate-900">{expenseToDelete.description}</strong> no valor de <strong className="text-slate-900">{formatCurrency(expenseToDelete.amount)}</strong>?
            </p>
          ) : ''
        }
      />
    </div>
  );
};
