import React, { useState, useEffect } from 'react';
import { Sale } from '../../types';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Printer, 
  MessageCircle, 
  Copy, 
  Check, 
  Edit3,
  RotateCcw,
  Eye,
  Sparkles
} from 'lucide-react';
import { 
  formatCurrency, 
  formatDate, 
  formatPhone, 
  getWhatsAppUrl, 
  generateSaleReceiptMessage 
} from '../../utils/formatters';

interface ReceiptModalProps {
  sale: Sale | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose }) => {
  const { consultantName, consultantPixKey, consultantReceiptNote } = useApp();
  const [activeTab, setActiveTab] = useState<'visual' | 'edit_whatsapp'>('visual');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (sale) {
      const defaultMsg = generateSaleReceiptMessage(
        sale, 
        consultantName, 
        consultantPixKey, 
        consultantReceiptNote
      );
      setCustomMessage(defaultMsg);
    }
  }, [sale, consultantName, consultantPixKey, consultantReceiptNote]);

  if (!sale) return null;

  const handleResetToDefault = () => {
    const defaultMsg = generateSaleReceiptMessage(
      sale, 
      consultantName, 
      consultantPixKey, 
      consultantReceiptNote
    );
    setCustomMessage(defaultMsg);
  };

  const currentTextToSend = customMessage || generateSaleReceiptMessage(sale, consultantName, consultantPixKey, consultantReceiptNote);
  const waUrl = getWhatsAppUrl(sale.clientPhone, currentTextToSend);

  const handleCopyText = () => {
    navigator.clipboard.writeText(currentTextToSend);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const paymentLabels: Record<string, string> = {
    pix: 'PIX',
    dinheiro: 'Dinheiro à Vista',
    cartao_credito: 'Cartão de Crédito',
    cartao_debito: 'Cartão de Débito',
    fiado: 'Fiado / Parcelado',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200/80 overflow-hidden">
        {/* Top Control Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-900 tracking-tight">Comprovante de Pedido</span>
            <span className="bg-emerald-50 text-emerald-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200/60">
              Pedido #{sale.id.slice(-6).toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              title="Imprimir / Salvar PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Switcher (Comprovante vs Editar Mensagem Zap) */}
        <div className="px-4 pt-3 pb-2 bg-white border-b border-slate-100 flex gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('visual')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'visual'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Recibo Visual / Impressão</span>
          </button>
          <button
            onClick={() => setActiveTab('edit_whatsapp')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'edit_whatsapp'
                ? 'bg-emerald-900 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-950 hover:bg-emerald-100/70 border border-emerald-200/60'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Editar Mensagem WhatsApp</span>
          </button>
        </div>

        {/* Content Area */}
        {activeTab === 'visual' ? (
          /* Printable Receipt Card */
          <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs bg-slate-50/40 font-sans" id="printable-receipt-area">
            {/* Header Brand */}
            <div className="text-center pb-4 border-b border-dashed border-slate-300">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-linear-to-br from-emerald-950 via-emerald-900 to-rose-950 text-white text-2xl font-bold mb-2 shadow-xs">
                💄
              </div>
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
                {consultantName}
              </h2>
              <p className="text-[11px] text-slate-500">
                Consultora Autorizada • O Boticário & Eudora
              </p>
              {consultantPixKey && (
                <div className="mt-1.5 inline-block bg-emerald-50 text-emerald-950 border border-emerald-200 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold">
                  Chave PIX: {consultantPixKey}
                </div>
              )}
            </div>

            {/* Client & Sale Meta */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Cliente</span>
                <span className="font-bold text-slate-900 text-sm">{sale.clientName}</span>
                <span className="text-[11px] text-slate-500 block">{formatPhone(sale.clientPhone)}</span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Data & Ciclo</span>
                <span className="font-bold text-slate-900">{formatDate(sale.date)}</span>
                <span className="text-[11px] text-slate-500 block">{sale.cycle}</span>
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
              <div className="bg-slate-100/70 px-3.5 py-2 font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                Itens do Pedido
              </div>
              <div className="divide-y divide-slate-100 p-2">
                {sale.items.map((item, idx) => (
                  <div key={idx} className="p-2 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-900">{item.productName}</div>
                      <div className="text-[10px] text-slate-400">
                        {item.brand === 'boticario' ? 'O Boticário' : 'Eudora'} • {item.quantity}x {formatCurrency(item.unitSalePrice)}
                      </div>
                    </div>
                    <div className="font-bold text-slate-900">
                      {formatCurrency(item.subtotal)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Subtotal & Discounts */}
              <div className="bg-slate-50/80 p-3.5 border-t border-slate-100 space-y-1">
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(sale.subtotal)}</span>
                </div>
                {sale.discountValue > 0 && (
                  <div className="flex justify-between text-emerald-800 font-semibold text-[11px]">
                    <span>Desconto:</span>
                    <span>
                      -{sale.discountType === 'percentage' ? `${sale.discountValue}%` : formatCurrency(sale.discountValue)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>TOTAL:</span>
                  <span className="text-emerald-950 font-extrabold">{formatCurrency(sale.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Payment Method & Installments */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 space-y-2 shadow-2xs">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-600">Forma de Pagamento:</span>
                <span className="font-bold text-slate-900 uppercase">
                  {paymentLabels[sale.paymentMethod] || sale.paymentMethod}
                </span>
              </div>

              {sale.paymentMethod === 'fiado' && sale.installments.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Detalhamento das Parcelas:
                  </span>
                  {sale.installments.map((inst) => (
                    <div
                      key={inst.id}
                      className="flex justify-between items-center bg-slate-50 p-2 rounded-xl text-xs border border-slate-200/60"
                    >
                      <span className="font-medium text-slate-700">
                        {inst.installmentNumber}ª Parcela (Vence {formatDate(inst.dueDate)})
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{formatCurrency(inst.amount)}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          inst.isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {inst.isPaid ? '✓ Paga' : '⏳ Em aberto'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Thank you note */}
            <div className="text-center text-slate-500 text-[11px] italic py-2">
              {consultantReceiptNote || '💖 Obrigada por valorizar o meu trabalho de consultora de beleza!'}
            </div>
          </div>
        ) : (
          /* WhatsApp Message Live Editor */
          <div className="p-5 overflow-y-auto flex-1 space-y-4 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-slate-800 block">Personalize o texto antes de enviar</span>
                <span className="text-[11px] text-slate-500">Você pode adicionar recados, emojis ou orientações de entrega</span>
              </div>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                title="Voltar ao texto padrão automático"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restaurar Padrão</span>
              </button>
            </div>

            <div className="relative">
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={11}
                className="w-full p-3.5 bg-white border border-slate-300 rounded-2xl font-mono text-xs text-slate-800 leading-relaxed focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 focus:outline-hidden shadow-inner resize-none"
                placeholder="Escreva ou edite a mensagem do recibo aqui..."
              />
              <div className="mt-1 flex justify-between items-center text-[10px] text-slate-400 px-1">
                <span>Dica: Use *texto* para negrito e _texto_ para itálico</span>
                <span>{customMessage.length} caracteres</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/60 text-xs text-emerald-950 flex items-start gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Pronto para o WhatsApp:</span>
                <span className="text-[11px] text-emerald-900">
                  Ao clicar em <strong>Enviar no WhatsApp</strong> abaixo, essa mensagem personalizada será aberta automaticamente na conversa com {sale.clientName}.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2 shrink-0">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-emerald-900 hover:bg-emerald-950 text-white py-3 rounded-xl font-semibold text-xs shadow-xs transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Enviar no WhatsApp</span>
          </a>

          <button
            onClick={handleCopyText}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-3 rounded-xl font-semibold text-xs transition-colors cursor-pointer border border-slate-200/60"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-800" /> : <Copy className="w-4 h-4" />}
            <span>{isCopied ? 'Copiado!' : 'Copiar Texto'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
