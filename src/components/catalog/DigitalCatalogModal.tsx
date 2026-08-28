import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { 
  X, 
  Sparkles, 
  MessageCircle, 
  Copy, 
  Check, 
  Search, 
  Share2, 
  ShoppingBag, 
  CheckCircle2,
  Filter
} from 'lucide-react';
import { formatCurrency, getWhatsAppUrl } from '../../utils/formatters';

interface DigitalCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DigitalCatalogModal: React.FC<DigitalCatalogModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { products, consultantName, consultantPixKey } = useApp();
  const [selectedBrand, setSelectedBrand] = useState<'todas' | 'boticario' | 'eudora'>('todas');
  const [categoryFilter, setCategoryFilter] = useState<string>('todas');
  const [search, setSearch] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  // Filter in-stock items
  const inStockProducts = products.filter(p => {
    if (p.stock <= 0) return false;
    if (selectedBrand !== 'todas' && p.brand !== selectedBrand) return false;
    if (categoryFilter !== 'todas' && p.category !== categoryFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Generate catalog text for WhatsApp broadcast
  const generateCatalogShareText = () => {
    let msg = `✨ *VITRINE PRONTA ENTREGA — ${consultantName.toUpperCase()}* ✨\n`;
    msg += `💄 *O Boticário & Eudora com entrega rápida!*\n\n`;

    if (inStockProducts.length === 0) {
      msg += `Todos os produtos sob encomenda no momento! Me chame para ver o catálogo oficial.`;
      return msg;
    }

    const boticarioItems = inStockProducts.filter(p => p.brand === 'boticario');
    const eudoraItems = inStockProducts.filter(p => p.brand === 'eudora');

    if (boticarioItems.length > 0) {
      msg += `🌿 *PRODUTOS O BOTICÁRIO À PRONTA ENTREGA:*\n`;
      boticarioItems.forEach(p => {
        msg += `• *${p.name}* (${p.category}) — *${formatCurrency(p.salePrice)}* (Restam ${p.stock} un)\n`;
      });
      msg += `\n`;
    }

    if (eudoraItems.length > 0) {
      msg += `💜 *PRODUTOS EUDORA À PRONTA ENTREGA:*\n`;
      eudoraItems.forEach(p => {
        msg += `• *${p.name}* (${p.category}) — *${formatCurrency(p.salePrice)}* (Restam ${p.stock} un)\n`;
      });
      msg += `\n`;
    }

    msg += `💳 *Formas de Pagamento:* PIX, Cartão ou Parcelamento\n`;
    if (consultantPixKey) {
      msg += `🔑 *Chave PIX:* ${consultantPixKey}\n`;
    }
    msg += `\n📦 *Peça já o seu antes que acabe o estoque! Responda esta mensagem para reservar o seu.* 💖`;

    return msg;
  };

  const handleCopy = () => {
    const text = generateCatalogShareText();
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200/80 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-emerald-900/50 flex items-center justify-between bg-linear-to-r from-emerald-950 via-emerald-900 to-rose-950 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center font-bold text-lg border border-white/10 shadow-xs">
              ✨
            </div>
            <div>
              <h3 className="font-bold text-base text-white leading-tight tracking-tight">
                Vitrine Digital & Catálogo Pronta Entrega
              </h3>
              <p className="text-xs text-emerald-200/90">
                Divulgue seus produtos disponíveis para suas clientes no WhatsApp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200/80 space-y-3 shrink-0 text-xs">
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                onClick={() => setSelectedBrand('todas')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  selectedBrand === 'todas' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todas ({products.filter(p => p.stock > 0).length})
              </button>
              <button
                onClick={() => setSelectedBrand('boticario')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  selectedBrand === 'boticario' ? 'bg-emerald-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                O Boticário
              </button>
              <button
                onClick={() => setSelectedBrand('eudora')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  selectedBrand === 'eudora' ? 'bg-rose-950 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Eudora
              </button>
            </div>

            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar por nome do produto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-800/15 focus:border-emerald-800 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* In-Stock Products Grid Preview */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700">
              {inStockProducts.length} Produtos com estoque disponível para pronta entrega:
            </span>
            <span className="text-[11px] text-slate-400">
              Preços de venda ao consumidor
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {inStockProducts.map((p) => (
              <div
                key={p.id}
                className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between shadow-2xs hover:border-slate-300 transition-colors"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <span className="font-semibold text-slate-900 block truncate">{p.name}</span>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                    <span className={p.brand === 'boticario' ? 'text-emerald-800 font-bold' : 'text-rose-900 font-bold'}>
                      {p.brand === 'boticario' ? 'O Boticário' : 'Eudora'}
                    </span>
                    <span>• {p.category}</span>
                    <span>• {p.stock} un</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-bold text-slate-900 text-sm">{formatCurrency(p.salePrice)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-200/80 flex flex-col sm:flex-row items-center gap-2 shrink-0">
          <button
            onClick={handleCopy}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-emerald-900 hover:bg-emerald-950 text-white py-3 rounded-xl font-semibold text-xs shadow-xs transition-all cursor-pointer"
          >
            {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{isCopied ? 'Texto do Catálogo Copiado!' : 'Copiar Catálogo para o WhatsApp'}</span>
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold text-xs transition-colors cursor-pointer border border-slate-200/60"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
