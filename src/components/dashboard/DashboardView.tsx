import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  ShoppingBag, 
  AlertTriangle, 
  Cake, 
  Package, 
  Plus, 
  Sparkles, 
  ChevronRight, 
  Flame,
  MessageCircle,
  FileText
} from 'lucide-react';
import { 
  formatCurrency, 
  formatDate, 
  getWhatsAppUrl, 
  generateBirthdayMessage, 
  generatePaymentReminderMessage,
  isBirthdayThisMonth,
  isDateOverdue 
} from '../../utils/formatters';
import { TabType } from '../layout/BottomNav';
import { Sale, Installment } from '../../types';

interface DashboardViewProps {
  onNavigate: (tab: TabType) => void;
  onOpenNewSale: () => void;
  onOpenCatalog: () => void;
  onSelectSaleForReceipt: (sale: Sale) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenNewSale,
  onOpenCatalog,
  onSelectSaleForReceipt,
}) => {
  const { 
    metrics, 
    currentCycle, 
    clients, 
    sales, 
    products, 
    consultantName 
  } = useApp();

  const cycleProgress = metrics.currentCycleTarget > 0 
    ? Math.min(100, Math.round((metrics.currentCycleSales / metrics.currentCycleTarget) * 100))
    : 0;

  // Birthday clients
  const birthdayClients = clients.filter(c => isBirthdayThisMonth(c.birthDate));

  // Overdue installments
  const overdueItems: { 
    clientName: string; 
    phone: string; 
    installment: Installment;
    saleId: string; 
  }[] = [];

  sales.forEach(sale => {
    if (sale.installments && sale.installments.length > 0) {
      sale.installments.forEach(inst => {
        if (!inst.isPaid && isDateOverdue(inst.dueDate)) {
          overdueItems.push({
            clientName: sale.clientName,
            phone: sale.clientPhone,
            installment: inst,
            saleId: sale.id,
          });
        }
      });
    } else if ((sale.paymentMethod === 'fiado' || sale.status === 'pendente') && sale.status !== 'pago') {
      if (isDateOverdue(sale.date)) {
        overdueItems.push({
          clientName: sale.clientName,
          phone: sale.clientPhone,
          installment: {
            id: `inst-${sale.id}`,
            saleId: sale.id,
            installmentNumber: 1,
            totalInstallments: 1,
            amount: sale.totalAmount,
            dueDate: sale.date,
            isPaid: false,
          },
          saleId: sale.id,
        });
      }
    }
  });

  // Low stock products
  const lowStockItems = products.filter(p => p.stock <= p.minStockAlert);

  const recentSales = [...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4);

  return (
    <div className="space-y-4 max-w-lg mx-auto pb-12">
      {/* 1. Hero Revenue & Goal Progress Card */}
      <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-[#4A0E2E] text-white rounded-3xl p-5 shadow-sm relative overflow-hidden border border-emerald-800/40">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-200/90 font-semibold flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
              <Flame className="w-3.5 h-3.5 text-amber-300" />
              Meta {currentCycle} • {cycleProgress}%
            </span>
            <button
              onClick={() => onNavigate('mais')}
              className="text-xs text-emerald-200 hover:text-white font-medium cursor-pointer"
            >
              Ver Finanças →
            </button>
          </div>

          <div>
            <span className="text-xs text-emerald-200/80 font-medium block">
              Vendido no Ciclo Atual
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {formatCurrency(metrics.currentCycleSales)}
              </span>
              <span className="text-xs text-emerald-200/70 font-medium">
                de {formatCurrency(metrics.currentCycleTarget)}
              </span>
            </div>
          </div>

          {/* Minimal Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full bg-black/30 h-2.5 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 via-amber-300 to-rose-300 rounded-full transition-all duration-500"
                style={{ width: `${cycleProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-emerald-200/80">
              <span>Faltam {formatCurrency(Math.max(0, metrics.currentCycleTarget - metrics.currentCycleSales))}</span>
              <span>{metrics.currentCycleSalesCount} pedidos</span>
            </div>
          </div>

          {/* Quick 2-Column Metrics */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs">
            <div className="bg-white/10 rounded-2xl p-2.5">
              <span className="text-[10px] text-emerald-200 block uppercase font-bold">Lucro Líquido Real</span>
              <span className="font-bold text-white text-sm">+{formatCurrency(metrics.netProfit)}</span>
            </div>
            <div className="bg-white/10 rounded-2xl p-2.5">
              <span className="text-[10px] text-emerald-200 block uppercase font-bold">Fiado a Receber</span>
              <span className="font-bold text-white text-sm">{formatCurrency(metrics.totalFiadoPending)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={onOpenNewSale}
          id="btn-quick-new-sale"
          className="flex items-center gap-3 bg-emerald-900 hover:bg-emerald-950 text-white p-3.5 rounded-2xl font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-98 border border-emerald-700/40"
        >
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5 text-emerald-300" />
          </div>
          <div className="text-left">
            <div className="leading-tight text-sm">Nova Venda</div>
            <span className="text-[10px] text-emerald-200/80 font-normal">Registrar pedido</span>
          </div>
        </button>

        <button
          onClick={onOpenCatalog}
          id="btn-quick-catalog"
          className="flex items-center gap-3 bg-[#4A0E2E] hover:bg-[#5C1239] text-white p-3.5 rounded-2xl font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-98 border border-rose-900/40"
        >
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div className="text-left">
            <div className="leading-tight text-sm">Catálogo Zap</div>
            <span className="text-[10px] text-rose-200/80 font-normal">Enviar ofertas</span>
          </div>
        </button>
      </div>

      {/* 3. Smart Action Alerts (Only shown when there are items needing attention) */}
      {(overdueItems.length > 0 || birthdayClients.length > 0 || lowStockItems.length > 0) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Lembretes Importantes
            </span>
          </div>

          <div className="space-y-2">
            {/* Overdue alert */}
            {overdueItems.length > 0 && (
              <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center shrink-0 font-bold">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-rose-950 block truncate">
                      {overdueItems.length} {overdueItems.length === 1 ? 'fiado vencido' : 'fiados vencidos'}
                    </span>
                    <span className="text-[11px] text-rose-800 truncate block">
                      {overdueItems[0].clientName} ({formatCurrency(overdueItems[0].installment.amount)})
                    </span>
                  </div>
                </div>
                <a
                  href={getWhatsAppUrl(
                    overdueItems[0].phone,
                    generatePaymentReminderMessage(
                      overdueItems[0].clientName,
                      overdueItems[0].installment,
                      consultantName
                    )
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-rose-900 hover:bg-rose-950 text-white px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 flex items-center gap-1 transition-all"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Cobrar
                </a>
              </div>
            )}

            {/* Birthday alert */}
            {birthdayClients.length > 0 && (
              <div className="bg-pink-50 border border-pink-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-800 flex items-center justify-center shrink-0 font-bold">
                    <Cake className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-pink-950 block truncate">
                      Aniversário de {birthdayClients[0].name}
                    </span>
                    <span className="text-[11px] text-pink-800 truncate block">
                      Parabenize e ofereça um mimo especial
                    </span>
                  </div>
                </div>
                <a
                  href={getWhatsAppUrl(
                    birthdayClients[0].phone,
                    generateBirthdayMessage(birthdayClients[0], '10% de desconto especial', consultantName)
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#4A0E2E] hover:bg-[#5C1239] text-white px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 flex items-center gap-1 transition-all"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Parabéns
                </a>
              </div>
            )}

            {/* Low stock alert */}
            {lowStockItems.length > 0 && (
              <div 
                onClick={() => onNavigate('estoque')}
                className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-2 shadow-2xs cursor-pointer hover:bg-amber-100/60 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-bold">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-amber-950 block truncate">
                      {lowStockItems.length} produtos com estoque acabando
                    </span>
                    <span className="text-[11px] text-amber-800 truncate block">
                      Clique para conferir e repor no próximo pedido
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-800 shrink-0" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Recent Sales (Últimas Vendas) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 tracking-tight">
            Últimas Vendas Realizadas
          </span>
          <button
            onClick={() => onNavigate('vendas')}
            className="text-xs text-emerald-900 hover:text-emerald-950 font-bold cursor-pointer flex items-center gap-0.5"
          >
            Ver todas <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentSales.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            Nenhuma venda registrada ainda. Clique em "+ Nova Venda"!
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentSales.map((sale) => (
              <div 
                key={sale.id}
                onClick={() => onSelectSaleForReceipt(sale)}
                className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 rounded-xl px-1 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-xs text-slate-900 block truncate">
                    {sale.clientName}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                    <span>{formatDate(sale.date)}</span>
                    <span>•</span>
                    <span className={`font-semibold ${sale.paymentMethod === 'fiado' ? 'text-amber-800' : 'text-emerald-800'}`}>
                      {sale.paymentMethod === 'fiado' ? 'Fiado' : 'Pago'}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0 flex items-center gap-2">
                  <span className="font-black text-xs text-slate-900">
                    {formatCurrency(sale.totalAmount)}
                  </span>
                  <div className="p-1.5 text-slate-400 hover:text-emerald-900 rounded-lg">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
