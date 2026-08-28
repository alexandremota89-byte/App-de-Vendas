import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sale, SaleStatus, PaymentMethod } from '../../types';
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Truck, 
  DollarSign, 
  TrendingUp, 
  Receipt, 
  Trash2, 
  MessageCircle, 
  ChevronDown, 
  Calendar,
  X
} from 'lucide-react';
import { 
  formatCurrency, 
  formatDate, 
  formatPhone, 
  getWhatsAppUrl, 
  generateSaleReceiptMessage 
} from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';

interface SalesViewProps {
  onOpenNewSale: () => void;
  onSelectSaleForReceipt: (sale: Sale) => void;
}

export const SalesView: React.FC<SalesViewProps> = ({
  onOpenNewSale,
  onSelectSaleForReceipt,
}) => {
  const { 
    sales, 
    deleteSale, 
    updateSale, 
    markInstallmentPaid, 
    cycles, 
    currentCycle, 
    consultantName 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [cycleFilter, setCycleFilter] = useState<string>('todos');
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);

  const handleDeleteClick = (sale: Sale) => {
    setSaleToDelete(sale);
  };

  const handleConfirmDelete = () => {
    if (saleToDelete) {
      deleteSale(saleToDelete.id);
      setSaleToDelete(null);
    }
  };

  const toggleDeliveryStatus = (sale: Sale) => {
    const newStatus = sale.deliveryStatus === 'entregue' ? 'pendente' : 'entregue';
    updateSale(sale.id, {
      deliveryStatus: newStatus,
      deliveryDate: newStatus === 'entregue' ? new Date().toISOString().split('T')[0] : undefined,
    });
  };

  const filteredSales = sales.filter(s => {
    if (searchTerm) {
      const matchClient = s.clientName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchPhone = s.clientPhone.includes(searchTerm);
      if (!matchClient && !matchPhone) return false;
    }

    if (statusFilter !== 'todos') {
      if (statusFilter === 'fiado' && s.paymentMethod !== 'fiado') return false;
      if (statusFilter === 'pago' && s.status !== 'pago') return false;
      if (statusFilter === 'pendente' && s.status !== 'pendente') return false;
    }

    if (cycleFilter !== 'todos' && s.cycle !== cycleFilter) {
      return false;
    }

    return true;
  });

  const paymentLabels: Record<string, string> = {
    pix: 'PIX',
    dinheiro: 'Dinheiro',
    cartao_credito: 'Cartão de Crédito',
    cartao_debito: 'Cartão de Débito',
    fiado: 'Fiado / Parcelado',
  };

  const totalFilteredAmount = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalFilteredProfit = filteredSales.reduce((sum, s) => sum + s.grossProfit, 0);

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Histórico de Vendas & Pedidos</h2>
            <span className="shrink-0 bg-emerald-50 text-emerald-900 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200/60">
              {sales.length} vendas
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhe pedidos, entregas, comprovantes e parcelas de pagamentos
          </p>
        </div>

        <button
          onClick={onOpenNewSale}
          id="btn-add-sale-page"
          className="flex items-center justify-center gap-2 bg-emerald-900 hover:bg-emerald-950 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 text-emerald-300" />
          <span>Registrar Nova Venda</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-800/15 focus:border-emerald-800 focus:outline-hidden transition-all shadow-xs text-slate-900 placeholder:text-slate-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap items-center gap-1.5 w-full pb-1 md:pb-0">
          <button
            onClick={() => setStatusFilter('todos')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === 'todos'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Todas as Vendas
          </button>
          <button
            onClick={() => setStatusFilter('pago')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === 'pago'
                ? 'bg-emerald-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-emerald-900 hover:bg-emerald-50'
            }`}
          >
            ✓ Pagas
          </button>
          <button
            onClick={() => setStatusFilter('fiado')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === 'fiado'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-amber-800 hover:bg-amber-50'
            }`}
          >
            ⏳ Fiado / Parceladas
          </button>
          <button
            onClick={() => setStatusFilter('pendente')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === 'pendente'
                ? 'bg-rose-800 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-rose-800 hover:bg-rose-50'
            }`}
          >
            ⚠️ Com Pendência
          </button>
        </div>

        {/* Cycle Filter */}
        <div className="w-full md:w-auto shrink-0">
          <select
            value={cycleFilter}
            onChange={(e) => setCycleFilter(e.target.value)}
            className="w-full md:w-auto px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
          >
            <option value="todos">Todos os Ciclos</option>
            {cycles.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filtered Totals Summary Card */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-100/90 p-3.5 rounded-2xl border border-slate-200 text-xs">
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-bold">Total nos Filtros</span>
          <div className="font-bold text-slate-900 text-base">{formatCurrency(totalFilteredAmount)}</div>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-bold">Lucro Líquido</span>
          <div className="font-bold text-emerald-900 text-base">+{formatCurrency(totalFilteredProfit)}</div>
        </div>
        <div className="col-span-2 sm:col-span-1 flex items-center justify-end text-slate-500 font-medium">
          Exibindo {filteredSales.length} pedidos
        </div>
      </div>

      {/* Sales List */}
      {filteredSales.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Nenhuma venda encontrada</h3>
          <p className="text-xs text-slate-500 mt-1">
            Não há pedidos registrados com os filtros atuais.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSales.map((sale) => {
            const isExpanded = expandedSaleId === sale.id;
            const waReceiptUrl = getWhatsAppUrl(
              sale.clientPhone,
              generateSaleReceiptMessage(sale, consultantName)
            );

            return (
              <div
                key={sale.id}
                className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:border-emerald-800/40 transition-all text-xs"
              >
                {/* Main Card Row */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-slate-800 text-base shrink-0 border border-slate-200/60">
                      {sale.clientName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">{sale.clientName}</h3>
                        <span className="text-[11px] text-slate-400 font-mono">
                          #{sale.id.slice(-5).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-slate-500 text-[11px] mt-0.5">
                        <span>📅 {formatDate(sale.date)}</span>
                        <span>•</span>
                        <span>🏷️ {sale.cycle}</span>
                        <span>•</span>
                        <span>💳 {paymentLabels[sale.paymentMethod] || sale.paymentMethod}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right side: Amount, Status & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <div className="font-bold text-base text-slate-900 leading-tight">
                        {formatCurrency(sale.totalAmount)}
                      </div>
                      <div className="text-[10px] text-emerald-800 font-bold">
                        Lucro: +{formatCurrency(sale.grossProfit)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onSelectSaleForReceipt(sale)}
                        className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 rounded-xl font-semibold text-xs transition-colors cursor-pointer border border-slate-200/60"
                        title="Ver Comprovante do Pedido"
                      >
                        <Receipt className="w-3.5 h-3.5 text-slate-600" />
                        <span>Recibo</span>
                      </button>

                      <a
                        href={waReceiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-emerald-700 hover:bg-emerald-800 text-white p-2 rounded-xl transition-colors shadow-2xs"
                        title="Enviar Comprovante no WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>

                      <button
                        onClick={() => setExpandedSaleId(isExpanded ? null : sale.id)}
                        className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="bg-slate-50/90 p-4 border-t border-slate-200 space-y-3">
                    {/* Products table in order */}
                    <div>
                      <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider block mb-1.5">
                        Itens Vendidos ({sale.items.length}):
                      </span>
                      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 p-2">
                        {sale.items.map((item, idx) => (
                          <div key={idx} className="py-1.5 px-2 flex justify-between text-xs">
                            <div>
                              <span className="font-bold text-slate-900">{item.productName}</span>
                              <span className="text-[10px] text-slate-400 ml-2">
                                ({item.brand === 'boticario' ? 'O Boticário' : 'Eudora'})
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-slate-600">{item.quantity}x {formatCurrency(item.unitSalePrice)} = </span>
                              <strong className="text-slate-900 font-bold">{formatCurrency(item.subtotal)}</strong>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Fiado Installments Management */}
                    {sale.paymentMethod === 'fiado' && (
                      <div>
                        <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider block mb-1.5">
                          Parcelas do Fiado:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {sale.installments.map((inst) => (
                            <div
                              key={inst.id}
                              className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200"
                            >
                              <div>
                                <span className="font-bold text-slate-900">
                                  {inst.installmentNumber}ª Parcela: {formatCurrency(inst.amount)}
                                </span>
                                <span className="text-[11px] text-slate-500 block">
                                  Vencimento: {formatDate(inst.dueDate)}
                                </span>
                              </div>

                              <div>
                                {inst.isPaid ? (
                                  <button
                                    onClick={() => markInstallmentPaid(sale.id, inst.id, false)}
                                    className="bg-emerald-50 text-emerald-900 border border-emerald-200/80 hover:bg-emerald-100 px-2.5 py-1 rounded-lg font-bold text-[10px] cursor-pointer"
                                    title="Clique para desfazer baixa"
                                  >
                                    ✓ Paga em {formatDate(inst.paidAt)}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => markInstallmentPaid(sale.id, inst.id, true)}
                                    className="bg-emerald-900 hover:bg-emerald-950 text-white px-2.5 py-1 rounded-lg font-semibold text-[10px] shadow-xs cursor-pointer"
                                  >
                                    Dar Baixa (Receber)
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Delivery toggle & notes */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleDeliveryStatus(sale)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                            sale.deliveryStatus === 'entregue'
                              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/80'
                              : 'bg-amber-50 text-amber-900 border border-amber-200/80'
                          }`}
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Status Entrega: {sale.deliveryStatus === 'entregue' ? 'Entregue ao Cliente' : 'Pendente de Entrega'}</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteClick(sale)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-rose-700 hover:text-rose-900 hover:bg-rose-50 border border-rose-200/60 text-xs font-bold self-end sm:self-auto cursor-pointer transition-all active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Excluir Venda</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal for Sale Deletion */}
      <ConfirmModal
        isOpen={!!saleToDelete}
        onClose={() => setSaleToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Venda"
        confirmLabel="Excluir Venda"
        cancelLabel="Cancelar"
        variant="danger"
        icon="trash"
        message={
          saleToDelete ? (
            <div className="space-y-2.5">
              <p>
                Tem certeza que deseja excluir a venda de <strong className="text-slate-900">{saleToDelete.clientName}</strong> no valor de <strong className="text-slate-900">{formatCurrency(saleToDelete.totalAmount)}</strong> realizada em {formatDate(saleToDelete.date)}?
              </p>
              <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900 space-y-1">
                <span className="font-bold flex items-center gap-1">📦 Devolução Automática ao Estoque:</span>
                <p className="text-[11px] text-amber-800">
                  Os {saleToDelete.items?.length || 0} produto(s) vendidos nesta compra serão somados de volta ao seu estoque de pronta-entrega.
                </p>
              </div>
            </div>
          ) : ''
        }
      />
    </div>
  );
};
