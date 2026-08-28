import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Calendar as CalendarIcon, 
  Cake, 
  Clock, 
  MessageCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Package, 
  Sparkles, 
  PhoneCall, 
  Plus, 
  Trash2,
  Gift
} from 'lucide-react';
import { 
  formatDate, 
  formatCurrency, 
  getWhatsAppUrl, 
  generateBirthdayMessage, 
  generatePaymentReminderMessage,
  isBirthdayThisMonth,
  isBirthdayToday,
  isDateOverdue 
} from '../../utils/formatters';

export const AgendaView: React.FC = () => {
  const { 
    clients, 
    sales, 
    products, 
    consultantName, 
    consultantPixKey,
    currentCycle, 
    cycles 
  } = useApp();

  const [filterType, setFilterType] = useState<'todos' | 'aniversarios' | 'cobrancas' | 'estoque' | 'followup'>('todos');

  // 1. Birthday clients
  const birthdayClients = clients.filter(c => isBirthdayThisMonth(c.birthDate));

  // 2. Pending Fiado reminders
  const overdueOrUpcomingFiado: {
    clientName: string;
    phone: string;
    saleId: string;
    instId: string;
    installmentNumber: number;
    totalInstallments: number;
    amount: number;
    dueDate: string;
    isOverdue: boolean;
  }[] = [];

  sales.forEach(sale => {
    if (sale.installments && sale.installments.length > 0) {
      sale.installments.forEach(inst => {
        if (!inst.isPaid) {
          overdueOrUpcomingFiado.push({
            clientName: sale.clientName,
            phone: sale.clientPhone,
            saleId: sale.id,
            instId: inst.id,
            installmentNumber: inst.installmentNumber,
            totalInstallments: inst.totalInstallments,
            amount: inst.amount,
            dueDate: inst.dueDate,
            isOverdue: isDateOverdue(inst.dueDate),
          });
        }
      });
    } else if ((sale.paymentMethod === 'fiado' || sale.status === 'pendente') && sale.status !== 'pago') {
      overdueOrUpcomingFiado.push({
        clientName: sale.clientName,
        phone: sale.clientPhone,
        saleId: sale.id,
        instId: `inst-${sale.id}`,
        installmentNumber: 1,
        totalInstallments: 1,
        amount: sale.totalAmount,
        dueDate: sale.date,
        isOverdue: isDateOverdue(sale.date),
      });
    }
  });

  // 3. Low stock replenishment reminders
  const lowStockProducts = products.filter(p => p.stock <= p.minStockAlert);

  // 4. Sales Follow-up (sales delivered in last 14 days)
  const followUpSales = sales.filter(s => s.deliveryStatus === 'entregue').slice(0, 4);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Agenda & Lembretes da Consultora</h2>
            <span className="shrink-0 bg-emerald-50 text-emerald-900 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200/60">
              {birthdayClients.length + overdueOrUpcomingFiado.length + lowStockProducts.length} ações
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Aniversários, pós-venda, cobranças de fiado e reposição de pedidos
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 pb-1">
        <button
          onClick={() => setFilterType('todos')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            filterType === 'todos' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Todos os Lembretes
        </button>
        <button
          onClick={() => setFilterType('aniversarios')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            filterType === 'aniversarios' ? 'bg-pink-700 text-white shadow-xs' : 'bg-white border border-slate-200 text-pink-700 hover:bg-pink-50'
          }`}
        >
          🎂 Aniversários ({birthdayClients.length})
        </button>
        <button
          onClick={() => setFilterType('cobrancas')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            filterType === 'cobrancas' ? 'bg-amber-700 text-white shadow-xs' : 'bg-white border border-slate-200 text-amber-700 hover:bg-amber-50'
          }`}
        >
          ⏳ Cobranças de Fiado ({overdueOrUpcomingFiado.length})
        </button>
        <button
          onClick={() => setFilterType('estoque')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            filterType === 'estoque' ? 'bg-rose-800 text-white shadow-xs' : 'bg-white border border-slate-200 text-rose-800 hover:bg-rose-50'
          }`}
        >
          📦 Repor Estoque ({lowStockProducts.length})
        </button>
        <button
          onClick={() => setFilterType('followup')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            filterType === 'followup' ? 'bg-emerald-800 text-white shadow-xs' : 'bg-white border border-slate-200 text-emerald-800 hover:bg-emerald-50'
          }`}
        >
          🌸 Pós-Venda ({followUpSales.length})
        </button>
      </div>

      {/* Reminders List */}
      <div className="space-y-4">
        {/* 1. Aniversariantes Section */}
        {(filterType === 'todos' || filterType === 'aniversarios') && (
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="p-4 bg-pink-50/60 border-b border-pink-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-pink-950 font-bold text-sm">
                <Cake className="w-4 h-4 text-pink-700" />
                <span>Aniversariantes do Mês ({birthdayClients.length})</span>
              </div>
              <span className="text-[11px] text-pink-800 font-medium">
                Envie felicitações com cupom de desconto
              </span>
            </div>

            {birthdayClients.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Nenhum cliente faz aniversário neste mês.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {birthdayClients.map((client) => {
                  const isToday = isBirthdayToday(client.birthDate);
                  const waUrl = getWhatsAppUrl(client.phone, generateBirthdayMessage(client));

                  return (
                    <div key={client.id} className="p-4 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-pink-100 text-pink-800 flex items-center justify-center font-bold text-base shrink-0 border border-pink-200">
                          🎂
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{client.name}</span>
                            {isToday && (
                              <span className="bg-pink-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                                É HOJE!
                              </span>
                            )}
                          </div>
                          <div className="text-slate-500 text-[11px]">
                            Data: <strong>{formatDate(client.birthDate)}</strong> • Preferência: {client.notes || 'Perfumaria'}
                          </div>
                        </div>
                      </div>

                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-pink-700 hover:bg-pink-800 text-white px-3.5 py-2 rounded-xl font-semibold shadow-xs transition-all cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Mandar Parabéns</span>
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 2. Cobranças de Fiado Section */}
        {(filterType === 'todos' || filterType === 'cobrancas') && (
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="p-4 bg-amber-50/60 border-b border-amber-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
                <Clock className="w-4 h-4 text-amber-700" />
                <span>Cobranças de Fiado ({overdueOrUpcomingFiado.length})</span>
              </div>
              <span className="text-[11px] text-amber-800 font-medium">
                Lembretes carinhosos de pagamento
              </span>
            </div>

            {overdueOrUpcomingFiado.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Nenhum pagamento pendente.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {overdueOrUpcomingFiado.map((item, idx) => {
                  const reminderMsg = generatePaymentReminderMessage(
                    item.clientName,
                    {
                      id: item.instId,
                      saleId: item.saleId,
                      installmentNumber: item.installmentNumber,
                      totalInstallments: item.totalInstallments,
                      amount: item.amount,
                      dueDate: item.dueDate,
                      isPaid: false,
                    },
                    consultantName,
                    consultantPixKey
                  );
                  const waUrl = getWhatsAppUrl(item.phone, reminderMsg);

                  return (
                    <div key={idx} className="p-4 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 border ${
                          item.isOverdue ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}>
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{item.clientName}</span>
                            {item.isOverdue && (
                              <span className="bg-rose-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                Vencida em {formatDate(item.dueDate)}
                              </span>
                            )}
                          </div>
                          <div className="text-slate-500 text-[11px]">
                            {item.installmentNumber}ª Parcela no valor de <strong>{formatCurrency(item.amount)}</strong>
                          </div>
                        </div>
                      </div>

                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-amber-700 hover:bg-amber-800 text-white px-3.5 py-2 rounded-xl font-semibold shadow-xs transition-all cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Lembrar no WhatsApp</span>
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 3. Reposição de Estoque Section */}
        {(filterType === 'todos' || filterType === 'estoque') && (
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-100/70 border-b border-slate-200/60 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <Package className="w-4 h-4 text-slate-700" />
                <span>Alerta de Reposição ao Boticário / Eudora ({lowStockProducts.length})</span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Itens para incluir no próximo pedido da marca
              </span>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Todos os produtos estão com estoque seguro.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {lowStockProducts.map((prod) => (
                  <div key={prod.id} className="p-4 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{prod.name}</div>
                      <div className="text-slate-500 text-[11px]">
                        Marca: <strong>{prod.brand === 'boticario' ? 'O Boticário' : 'Eudora'}</strong> • Código Revista: {prod.code} • Custo: {formatCurrency(prod.costPrice)}
                      </div>
                    </div>

                    <span className={`font-bold text-xs px-3 py-1 rounded-xl border ${
                      prod.stock === 0 ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-amber-100 text-amber-900 border-amber-200'
                    }`}>
                      {prod.stock === 0 ? 'Zerado (Pedir urgente)' : `Apenas ${prod.stock} em mãos`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. Pós Venda Follow-up */}
        {(filterType === 'todos' || filterType === 'followup') && (
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="p-4 bg-emerald-50/60 border-b border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span>Follow-up & Pós-Venda de Beleza</span>
              </div>
              <span className="text-[11px] text-emerald-800 font-medium">
                Pergunte se a cliente gostou dos produtinhos
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {followUpSales.map((sale) => {
                const firstProduct = sale.items[0]?.productName || 'seus produtos';
                const followUpMsg = `Olá ${sale.clientName}! Tudo bem? 🌸\n\nPassando para saber o que você achou do *${firstProduct}* que você adquiriu comigo! Está gostando do resultado na pele/cabelo? ✨\n\nSe precisar de reposição ou tiver alguma dúvida de como usar, estou à disposição! Um beijo! 💄`;
                const waUrl = getWhatsAppUrl(sale.clientPhone, followUpMsg);

                return (
                  <div key={sale.id} className="p-4 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{sale.clientName}</div>
                      <div className="text-slate-500 text-[11px]">
                        Comprou: <em>{sale.items.map(i => i.productName).join(', ')}</em> em {formatDate(sale.date)}
                      </div>
                    </div>

                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-emerald-900 hover:bg-emerald-950 text-white px-3.5 py-2 rounded-xl font-semibold shadow-xs transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Fazer Pós-Venda</span>
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
