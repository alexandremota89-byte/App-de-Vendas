import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Client, Product, SaleItem, PaymentMethod, Sale, Installment } from '../../types';
import { 
  X, 
  Search, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  ShoppingBag, 
  DollarSign, 
  User, 
  Calendar, 
  Percent, 
  Clock, 
  CreditCard, 
  Banknote, 
  Sparkles,
  TrendingUp,
  MessageCircle,
  Package
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  formatCurrency, 
  formatDate, 
  getWhatsAppUrl, 
  generateSaleReceiptMessage 
} from '../../utils/formatters';

interface NewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedClient?: Client | null;
  onSaleCreated?: (sale: Sale) => void;
}

export const NewSaleModal: React.FC<NewSaleModalProps> = ({
  isOpen,
  onClose,
  preselectedClient,
  onSaleCreated,
}) => {
  const { 
    clients, 
    products, 
    addSale, 
    currentCycle, 
    consultantName 
  } = useApp();

  // Wizard state
  const [selectedClient, setSelectedClient] = useState<Client | null>(preselectedClient || null);
  const [clientSearch, setClientSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<'todas' | 'boticario' | 'eudora'>('todas');

  // Items cart
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);

  // Payment & conditions
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('fixed');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [installmentsCount, setInstallmentsCount] = useState<number>(1);
  const [firstDueDate, setFirstDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [saleDate, setSaleDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState<'entregue' | 'pendente'>('entregue');

  // Success view state
  const [createdSale, setCreatedSale] = useState<Sale | null>(null);

  if (!isOpen) return null;

  // Cart calculations
  const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const totalCost = cartItems.reduce((sum, item) => sum + (item.unitCostPrice * item.quantity), 0);

  const discountAmount = discountType === 'percentage'
    ? (subtotal * (discountValue / 100))
    : discountValue;

  const totalAmount = Math.max(0, subtotal - discountAmount);
  const grossProfit = totalAmount - totalCost;
  const profitMarginPct = totalAmount > 0 ? Math.round((grossProfit / totalAmount) * 100) : 0;

  // Add product to cart
  const handleAddToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.unitSalePrice,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          brand: product.brand,
          category: product.category,
          code: product.code,
          quantity: 1,
          unitCostPrice: product.costPrice,
          unitSalePrice: product.salePrice,
          subtotal: product.salePrice,
        },
      ];
    });
  };

  // Update item quantity
  const handleUpdateQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      setCartItems(prev => prev.filter(item => item.productId !== productId));
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        item.productId === productId
          ? {
              ...item,
              quantity: qty,
              subtotal: qty * item.unitSalePrice,
            }
          : item
      )
    );
  };

  // Remove item
  const handleRemoveItem = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.productId !== productId));
  };

  // Submit sale
  const handleConfirmSale = () => {
    if (!selectedClient) {
      alert('Por favor, selecione uma cliente!');
      return;
    }

    if (cartItems.length === 0) {
      alert('Adicione pelo menos 1 produto ao pedido!');
      return;
    }

    // Build installments if fiado
    const installments: Installment[] = [];
    if (paymentMethod === 'fiado') {
      const instAmount = Number((totalAmount / installmentsCount).toFixed(2));
      let currentDue = new Date(firstDueDate + 'T00:00:00');

      for (let i = 1; i <= installmentsCount; i++) {
        const dueDateStr = currentDue.toISOString().split('T')[0];
        installments.push({
          id: `inst-${Date.now()}-${i}`,
          saleId: '', // Will be set
          installmentNumber: i,
          totalInstallments: installmentsCount,
          amount: i === installmentsCount 
            ? totalAmount - (instAmount * (installmentsCount - 1)) 
            : instAmount,
          dueDate: dueDateStr,
          isPaid: false,
        });
        currentDue.setMonth(currentDue.getMonth() + 1);
      }
    } else {
      // Paid in full
      installments.push({
        id: `inst-${Date.now()}-1`,
        saleId: '',
        installmentNumber: 1,
        totalInstallments: 1,
        amount: totalAmount,
        dueDate: saleDate,
        isPaid: true,
        paidAt: saleDate,
      });
    }

    const newSale = addSale({
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      clientPhone: selectedClient.phone,
      items: cartItems,
      subtotal,
      discountType,
      discountValue,
      totalAmount,
      totalCost,
      grossProfit,
      paymentMethod,
      status: paymentMethod === 'fiado' ? 'pendente' : 'pago',
      installmentsCount: paymentMethod === 'fiado' ? installmentsCount : 1,
      installments,
      cycle: currentCycle,
      date: saleDate,
      notes: notes.trim() || undefined,
      deliveryStatus,
      deliveryDate: deliveryStatus === 'entregue' ? saleDate : undefined,
    });

    // Fire celebration
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    setCreatedSale(newSale);
    if (onSaleCreated) {
      onSaleCreated(newSale);
    }
  };

  // Filtered available clients
  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.phone.includes(clientSearch)
  );

  // Filtered products for selection
  const filteredProducts = products.filter(p => {
    if (selectedBrandFilter !== 'todas' && p.brand !== selectedBrandFilter) return false;
    if (productSearch) {
      const matchName = p.name.toLowerCase().includes(productSearch.toLowerCase());
      const matchCode = p.code.includes(productSearch);
      if (!matchName && !matchCode) return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200/80 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-900 text-white flex items-center justify-center font-bold shadow-xs">
              🛍️
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 leading-tight tracking-tight">
                Registrar Nova Venda
              </h3>
              <p className="text-xs text-slate-500">{currentCycle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {createdSale ? (
            /* Success Screen */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto text-3xl shadow-xs">
                ✨
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 tracking-tight">
                  Venda Registrada com Sucesso!
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Estoque atualizado e lançamento financeiro registrado.
                </p>
              </div>

              {/* Summary Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 max-w-sm mx-auto text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Cliente:</span>
                  <span className="font-bold text-slate-900">{createdSale.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total do Pedido:</span>
                  <span className="font-bold text-emerald-950">{formatCurrency(createdSale.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Lucro Líquido Real:</span>
                  <span className="font-semibold text-emerald-800">+{formatCurrency(createdSale.grossProfit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Forma de Pagamento:</span>
                  <span className="font-semibold text-slate-800 uppercase">{createdSale.paymentMethod}</span>
                </div>
              </div>

              {/* WhatsApp Receipt Button */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                <a
                  href={getWhatsAppUrl(
                    createdSale.clientPhone,
                    generateSaleReceiptMessage(createdSale, consultantName)
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-900 hover:bg-emerald-950 text-white px-5 py-3 rounded-xl font-semibold shadow-xs transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  Enviar Comprovante no WhatsApp
                </a>

                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold transition-all cursor-pointer border border-slate-200/60"
                >
                  Concluir e Fechar
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Step 1: Select Client */}
              <div className="space-y-2">
                <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-800" />
                  1. Selecione a Cliente *
                </label>

                {selectedClient ? (
                  <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-200/80 p-3 rounded-2xl">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-900 text-white flex items-center justify-center font-bold">
                        {selectedClient.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{selectedClient.name}</div>
                        <div className="text-[11px] text-slate-500">{selectedClient.phone} • {selectedClient.tag}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedClient(null)}
                      className="text-xs text-rose-800 font-bold hover:underline cursor-pointer"
                    >
                      Trocar
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Buscar cliente por nome ou telefone..."
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-800/15 focus:border-emerald-800 focus:outline-hidden"
                      />
                    </div>
                    <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50">
                      {filteredClients.map((client) => (
                        <div
                          key={client.id}
                          onClick={() => setSelectedClient(client)}
                          className="p-2.5 hover:bg-emerald-50/60 cursor-pointer flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-800">{client.name}</span>
                            <span className="text-[11px] text-slate-500 ml-2">{client.phone}</span>
                          </div>
                          <span className="text-[10px] bg-slate-200/80 text-slate-700 font-medium px-1.5 py-0.5 rounded">
                            {client.tag}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Select Products */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-emerald-800" />
                    2. Adicionar Produtos do Estoque *
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedBrandFilter('todas')}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                        selectedBrandFilter === 'todas' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Todas
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedBrandFilter('boticario')}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                        selectedBrandFilter === 'boticario' ? 'bg-emerald-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Boticário
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedBrandFilter('eudora')}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                        selectedBrandFilter === 'eudora' ? 'bg-rose-950 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Eudora
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar produto por nome ou código..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-800/15 focus:border-emerald-800 focus:outline-hidden"
                  />
                </div>

                {/* Product Search Results (Quick Add) */}
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                  {filteredProducts.slice(0, 6).map((product) => (
                    <div
                      key={product.id}
                      className="p-2.5 flex items-center justify-between hover:bg-slate-50 gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-900 truncate">{product.name}</div>
                        <div className="text-[10px] text-slate-500">
                          {product.brand === 'boticario' ? 'O Boticário' : 'Eudora'} • Cód: {product.code} • Estoque: {product.stock}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{formatCurrency(product.salePrice)}</span>
                        <button
                          type="button"
                          onClick={() => handleAddToCart(product)}
                          className="bg-emerald-900 hover:bg-emerald-950 text-white px-2.5 py-1 rounded-lg text-xs font-semibold shadow-xs cursor-pointer active:scale-95 transition-all"
                        >
                          + Adicionar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Items in Cart */}
                {cartItems.length > 0 && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                    <span className="font-bold text-slate-700 text-xs block">
                      Itens no Carrinho ({cartItems.reduce((sum, i) => sum + i.quantity, 0)} itens):
                    </span>
                    <div className="space-y-2">
                      {cartItems.map((item) => (
                        <div
                          key={item.productId}
                          className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 text-xs shadow-2xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-slate-900 truncate">{item.productName}</div>
                            <div className="text-[10px] text-slate-400">
                              {formatCurrency(item.unitSalePrice)} cada
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                                className="w-5 h-5 rounded bg-white font-bold flex items-center justify-center text-slate-700 shadow-2xs cursor-pointer"
                              >
                                -
                              </button>
                              <span className="w-5 text-center font-bold">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                                className="w-5 h-5 rounded bg-white font-bold flex items-center justify-center text-slate-700 shadow-2xs cursor-pointer"
                              >
                                +
                              </button>
                            </div>

                            <span className="font-bold text-slate-900 w-16 text-right">
                              {formatCurrency(item.subtotal)}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.productId)}
                              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Step 3: Discounts and Payment Method */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-800" />
                  3. Pagamento & Desconto
                </label>

                {/* Payment method selector */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'pix', label: 'PIX' },
                    { id: 'dinheiro', label: 'Dinheiro' },
                    { id: 'cartao_credito', label: 'Cartão Crédito' },
                    { id: 'cartao_debito', label: 'Cartão Débito' },
                    { id: 'fiado', label: 'Fiado / Parcelado' },
                  ].map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                      className={`p-2.5 rounded-xl font-semibold text-xs text-center border transition-all cursor-pointer ${
                        paymentMethod === method.id
                          ? 'bg-emerald-900 text-white border-emerald-950 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>

                {/* If Fiado: Installments count and due date */}
                {paymentMethod === 'fiado' && (
                  <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-3">
                    <div className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-700" />
                      Condições do Fiado / Parcelamento
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Número de Parcelas
                        </label>
                        <select
                          value={installmentsCount}
                          onChange={(e) => setInstallmentsCount(parseInt(e.target.value, 10))}
                          className="w-full p-2 border border-slate-200 rounded-xl bg-white text-xs font-bold focus:ring-2 focus:ring-amber-700/15 focus:border-amber-700 focus:outline-hidden"
                        >
                          <option value={1}>1x (Vencimento único)</option>
                          <option value={2}>2x</option>
                          <option value={3}>3x</option>
                          <option value={4}>4x</option>
                          <option value={5}>5x</option>
                          <option value={6}>6x</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          1º Vencimento
                        </label>
                        <input
                          type="date"
                          value={firstDueDate}
                          onChange={(e) => setFirstDueDate(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-xl bg-white text-xs focus:ring-2 focus:ring-amber-700/15 focus:border-amber-700 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="text-[11px] text-amber-950 font-semibold bg-white p-2 rounded-xl border border-amber-200">
                      Valor por parcela: <strong>{formatCurrency(totalAmount / installmentsCount)}</strong>
                    </div>
                  </div>
                )}

                {/* Discount and Sale Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Desconto Especial
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value as any)}
                        className="p-2 border border-slate-200 rounded-xl bg-white text-xs focus:ring-2 focus:ring-emerald-800/15 focus:border-emerald-800 focus:outline-hidden"
                      >
                        <option value="fixed">R$ Fixo</option>
                        <option value="percentage">% Porcento</option>
                      </select>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                        className="flex-1 p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-800/15 focus:border-emerald-800 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Data da Venda
                    </label>
                    <input
                      type="date"
                      value={saleDate}
                      onChange={(e) => setSaleDate(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-800/15 focus:border-emerald-800 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Step 4: Financial Summary & Profit Bar */}
              <div className="p-4 bg-linear-to-br from-slate-900 via-emerald-950 to-emerald-900 text-white rounded-2xl space-y-2.5 shadow-sm">
                <div className="flex justify-between items-center text-xs text-slate-300">
                  <span>Subtotal dos Produtos:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-xs text-rose-300">
                    <span>Desconto aplicado:</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-base font-bold text-white pt-1 border-t border-white/10">
                  <span>TOTAL A COBRAR:</span>
                  <span className="text-emerald-300 text-lg font-extrabold">{formatCurrency(totalAmount)}</span>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-emerald-200 font-semibold">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    Seu Lucro Real Nesta Venda:
                  </span>
                  <span className="font-bold text-white bg-emerald-800/80 px-2 py-0.5 rounded-md border border-emerald-700/50">
                    +{formatCurrency(grossProfit)} ({profitMarginPct}% margem)
                  </span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSale}
                  disabled={!selectedClient || cartItems.length === 0}
                  className={`px-6 py-3 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer ${
                    !selectedClient || cartItems.length === 0
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200'
                      : 'bg-emerald-900 hover:bg-emerald-950 text-white hover:scale-[1.01] active:scale-98'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmar e Gerar Recibo
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
