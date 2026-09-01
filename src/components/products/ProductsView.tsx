import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, ProductCategory, Brand, ProductStatus } from '../../types';
import { 
  Package, 
  Search, 
  Plus, 
  Filter, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  TrendingUp, 
  Tag, 
  Upload, 
  Sparkles, 
  X, 
  Check, 
  Layers, 
  FileSpreadsheet,
  DollarSign
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';

interface ProductsViewProps {
  onOpenCatalog: () => void;
}

const CATEGORIES: ProductCategory[] = [
  'Perfumaria',
  'Maquiagem',
  'Cuidados com a Pele',
  'Cabelos',
  'Corpo & Banho',
  'Infantil',
  'Kits & Presentes',
];

export const ProductsView: React.FC<ProductsViewProps> = ({ onOpenCatalog }) => {
  const { 
    products, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    updateProductStock, 
    importProducts,
    activeBrandFilter,
    setActiveBrandFilter,
    currentCycle 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formBrand, setFormBrand] = useState<Brand>('boticario');
  const [formCategory, setFormCategory] = useState<ProductCategory>('Perfumaria');
  const [formCode, setFormCode] = useState('');
  const [formCatalogPrice, setFormCatalogPrice] = useState<number>(0);
  const [formCostPrice, setFormCostPrice] = useState<number>(0);
  const [formSalePrice, setFormSalePrice] = useState<number>(0);
  const [formStock, setFormStock] = useState<number>(1);
  const [formMinStockAlert, setFormMinStockAlert] = useState<number>(2);
  const [formStatus, setFormStatus] = useState<ProductStatus>('ativo');
  const [formVolumeMl, setFormVolumeMl] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');

  // CSV Import State
  const [csvText, setCsvText] = useState('');
  const [importFeedback, setImportFeedback] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setFormImageUrl(dataUrl);
        }
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
    // Reset file input so same file can be uploaded again if needed
    e.target.value = '';
  };

  const openAddModal = () => {
    setProductToEdit(null);
    setFormName('');
    setFormBrand('boticario');
    setFormCategory('Perfumaria');
    setFormCode('');
    setFormCatalogPrice(100);
    setFormCostPrice(70);
    setFormSalePrice(100);
    setFormStock(3);
    setFormMinStockAlert(2);
    setFormStatus('ativo');
    setFormVolumeMl('');
    setFormDescription('');
    setFormImageUrl('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setProductToEdit(product);
    setFormName(product.name);
    setFormBrand(product.brand);
    setFormCategory(product.category);
    setFormCode(product.code);
    setFormCatalogPrice(product.catalogPrice);
    setFormCostPrice(product.costPrice);
    setFormSalePrice(product.salePrice);
    setFormStock(product.stock);
    setFormMinStockAlert(product.minStockAlert);
    setFormStatus(product.status);
    setFormVolumeMl(product.volumeMl || '');
    setFormDescription(product.description || '');
    setFormImageUrl(product.imageUrl || '');
    setIsAddModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) {
      alert('Nome e Código do produto são obrigatórios!');
      return;
    }

    if (productToEdit) {
      updateProduct(productToEdit.id, {
        name: formName.trim(),
        brand: formBrand,
        category: formCategory,
        code: formCode.trim(),
        catalogPrice: Number(formCatalogPrice),
        costPrice: Number(formCostPrice),
        salePrice: Number(formSalePrice),
        stock: Number(formStock),
        minStockAlert: Number(formMinStockAlert),
        status: formStatus,
        volumeMl: formVolumeMl.trim() || undefined,
        description: formDescription.trim() || undefined,
        imageUrl: formImageUrl.trim() || undefined,
        cycle: currentCycle,
      });
    } else {
      addProduct({
        name: formName.trim(),
        brand: formBrand,
        category: formCategory,
        code: formCode.trim(),
        catalogPrice: Number(formCatalogPrice),
        costPrice: Number(formCostPrice),
        salePrice: Number(formSalePrice),
        stock: Number(formStock),
        minStockAlert: Number(formMinStockAlert),
        status: formStatus,
        volumeMl: formVolumeMl.trim() || undefined,
        description: formDescription.trim() || undefined,
        imageUrl: formImageUrl.trim() || undefined,
        cycle: currentCycle,
      });
    }

    setIsAddModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    setProductToDelete({ id, name });
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
      deleteProduct(productToDelete.id);
      setProductToDelete(null);
    }
  };

  // CSV Import Parser
  const handleProcessCsv = () => {
    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        setImportFeedback('O texto CSV precisa conter um cabeçalho e pelo menos 1 linha de produto.');
        return;
      }

      // Expected format: Nome;Marca;Categoria;Codigo;PrecoCatalogo;PrecoCusto;PrecoVenda;Estoque
      const imported: Omit<Product, 'id'>[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const separator = line.includes(';') ? ';' : ',';
        const cols = line.split(separator).map(c => c.trim().replace(/^["']|["']$/g, ''));

        if (cols.length >= 4) {
          const name = cols[0];
          const brandRaw = cols[1]?.toLowerCase();
          const brand: Brand = brandRaw?.includes('eudora') ? 'eudora' : 'boticario';
          const category = (cols[2] as ProductCategory) || 'Perfumaria';
          const code = cols[3] || `${Math.floor(10000 + Math.random() * 90000)}`;
          const catalogPrice = parseFloat(cols[4]?.replace(',', '.') || '99.90') || 99.90;
          const costPrice = parseFloat(cols[5]?.replace(',', '.') || '69.90') || (catalogPrice * 0.7);
          const salePrice = parseFloat(cols[6]?.replace(',', '.') || String(catalogPrice)) || catalogPrice;
          const stock = parseInt(cols[7] || '3', 10) || 3;

          imported.push({
            name,
            brand,
            category,
            code,
            catalogPrice,
            costPrice,
            salePrice,
            stock,
            minStockAlert: 2,
            status: 'ativo',
            cycle: currentCycle,
          });
        }
      }

      if (imported.length > 0) {
        const count = importProducts(imported);
        setImportFeedback(`✅ Sucesso! ${count} produtos foram importados para o seu catálogo.`);
        setTimeout(() => {
          setIsImportModalOpen(false);
          setImportFeedback(null);
          setCsvText('');
        }, 1200);
      } else {
        setImportFeedback('Nenhum produto válido foi identificado nas linhas.');
      }
    } catch {
      setImportFeedback('Erro ao processar CSV. Verifique a formatação.');
    }
  };

  // Filtered Products
  const filteredProducts = products.filter(p => {
    // Brand filter
    if (activeBrandFilter !== 'todas' && p.brand !== activeBrandFilter) {
      return false;
    }

    // Category filter
    if (selectedCategory !== 'todas' && p.category !== selectedCategory) {
      return false;
    }

    // Status filter
    if (statusFilter === 'baixo_estoque' && p.stock > p.minStockAlert) {
      return false;
    }
    if (statusFilter === 'promocao' && p.status !== 'promocao') {
      return false;
    }
    if (statusFilter === 'lancamento' && p.status !== 'lancamento') {
      return false;
    }

    // Search term
    if (searchTerm) {
      const matchName = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCode = p.code.includes(searchTerm);
      const matchCat = p.category.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchName && !matchCode && !matchCat) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header with Title & Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Catálogo de Produtos & Estoque</h2>
            <span className="shrink-0 bg-emerald-50 text-emerald-900 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200/60">
              {products.length} itens
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Preços de catálogo, custo da consultora, controle de estoque e cálculo de lucros
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer border border-slate-200/60"
            title="Importar planilha de produtos"
          >
            <Upload className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Importar Planilha</span>
          </button>

          <button
            onClick={openAddModal}
            id="btn-add-new-product"
            className="flex items-center gap-1.5 bg-emerald-900 hover:bg-emerald-950 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-300" />
            <span>Cadastrar Produto</span>
          </button>
        </div>
      </div>

      {/* Brand Switcher & Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, código ou categoria..."
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

        {/* Categories Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full pb-1 md:pb-0">
          <button
            onClick={() => setSelectedCategory('todas')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'todas'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Todas as Categorias
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-emerald-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Status Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">Filtrar:</span>
        <button
          onClick={() => setStatusFilter('todos')}
          className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
            statusFilter === 'todos' ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setStatusFilter('baixo_estoque')}
          className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            statusFilter === 'baixo_estoque' ? 'bg-amber-100 text-amber-900 border border-amber-200/80' : 'text-amber-800 hover:bg-amber-50'
          }`}
        >
          <span>⚠️</span> Estoque Baixo / Zerado
        </button>
        <button
          onClick={() => setStatusFilter('promocao')}
          className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            statusFilter === 'promocao' ? 'bg-rose-100 text-rose-900 border border-rose-200/80' : 'text-rose-800 hover:bg-rose-50'
          }`}
        >
          <span>🏷️</span> Em Promoção
        </button>
        <button
          onClick={() => setStatusFilter('lancamento')}
          className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            statusFilter === 'lancamento' ? 'bg-purple-100 text-purple-900 border border-purple-200/80' : 'text-purple-800 hover:bg-purple-50'
          }`}
        >
          <span>✨</span> Lançamento
        </button>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Nenhum produto encontrado</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Não encontramos produtos com os filtros selecionados. Tente limpar os filtros ou adicionar novos itens.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const profitValue = product.salePrice - product.costPrice;
            const profitMarginPct = product.salePrice > 0 
              ? Math.round((profitValue / product.salePrice) * 100) 
              : 0;
            const isLowStock = product.stock <= product.minStockAlert;
            const isOutOfStock = product.stock === 0;

            const isBoticario = product.brand === 'boticario';

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:border-emerald-800/40 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Image or Header */}
                  <div className="relative h-40 bg-slate-100 overflow-hidden">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          // Graceful fallback if external link fails
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          if (target.parentElement) {
                            const fallback = target.parentElement.querySelector('.image-fallback');
                            if (fallback) (fallback as HTMLElement).style.display = 'flex';
                          }
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : null}
                    <div 
                      className={`image-fallback w-full h-full ${product.imageUrl ? 'hidden' : 'flex'} items-center justify-center bg-linear-to-br ${
                        isBoticario ? 'from-emerald-900/10 to-emerald-900/20 text-emerald-900' : 'from-rose-900/10 to-rose-900/20 text-rose-950'
                      } font-bold text-xs p-3 text-center`}
                    >
                      <span>{product.name.split(' ')[0]} • {product.category}</span>
                    </div>

                    {/* Brand Badge */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-white shadow-xs ${
                        isBoticario ? 'bg-emerald-900' : 'bg-rose-950'
                      }`}>
                        {isBoticario ? 'O Boticário' : 'Eudora'}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 items-end">
                      {product.status === 'promocao' && (
                        <span className="bg-rose-600 text-white px-2 py-0.5 rounded-md text-[10px] font-bold shadow-xs">
                          🏷️ Promoção
                        </span>
                      )}
                      {product.status === 'lancamento' && (
                        <span className="bg-purple-700 text-white px-2 py-0.5 rounded-md text-[10px] font-bold shadow-xs">
                          ✨ Lançamento
                        </span>
                      )}
                      {isOutOfStock ? (
                        <span className="bg-rose-700 text-white px-2 py-0.5 rounded-md text-[10px] font-black shadow-xs animate-pulse">
                          ⚠️ Zerado
                        </span>
                      ) : isLowStock ? (
                        <span className="bg-amber-500 text-white px-2 py-0.5 rounded-md text-[10px] font-bold shadow-xs">
                          ⚠️ Estoque Baixo
                        </span>
                      ) : null}
                    </div>

                    {/* Code badge */}
                    <div className="absolute bottom-2 left-2 bg-slate-950/70 backdrop-blur-xs text-white px-2 py-0.5 rounded-md text-[10px] font-mono">
                      Cód: {product.code}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2.5">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                        {product.category} {product.volumeMl ? `• ${product.volumeMl}` : ''}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug">
                        {product.name}
                      </h3>
                    </div>

                    {/* Financial details & Profit Margin */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">Preço de Venda:</span>
                        <span className="font-bold text-slate-900 text-sm">
                          {formatCurrency(product.salePrice)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Custo da Consultora:</span>
                        <span className="font-semibold text-slate-700">{formatCurrency(product.costPrice)}</span>
                      </div>

                      <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                        <span className="text-emerald-800 font-bold flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" /> Lucro: {formatCurrency(profitValue)}
                        </span>
                        <span className="bg-emerald-50 text-emerald-900 border border-emerald-200/80 px-1.5 py-0.5 rounded font-bold text-[10px]">
                          {profitMarginPct}% Margem
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stock Controls & Actions Footer */}
                <div className="p-4 pt-0">
                  <div className="flex items-center justify-between bg-slate-100/80 p-1.5 rounded-xl mb-3">
                    <span className="text-[11px] font-bold text-slate-600 px-1.5">
                      Estoque em mãos:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateProductStock(product.id, product.stock - 1)}
                        className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs cursor-pointer active:scale-95 shadow-2xs"
                        title="Diminuir estoque"
                      >
                        -
                      </button>
                      <span className={`w-7 text-center font-bold text-xs ${
                        isOutOfStock ? 'text-rose-700' : isLowStock ? 'text-amber-800' : 'text-slate-900'
                      }`}>
                        {product.stock}
                      </span>
                      <button
                        onClick={() => updateProductStock(product.id, product.stock + 1)}
                        className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs cursor-pointer active:scale-95 shadow-2xs"
                        title="Aumentar estoque"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => openEditModal(product)}
                      className="flex-1 flex items-center justify-center gap-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button
                      onClick={() => handleDelete(product.id, product.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Excluir produto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200/60 flex items-center justify-center font-bold text-sm">
                  📦
                </div>
                <h3 className="font-bold text-base text-slate-900">
                  {productToEdit ? 'Editar Produto' : 'Cadastrar Novo Produto'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Marca do Produto *
                  </label>
                  <select
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value as Brand)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-800/15 focus:border-emerald-800 focus:outline-hidden bg-white"
                  >
                    <option value="boticario">O Boticário</option>
                    <option value="eudora">Eudora</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ProductCategory)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-800/15 focus:border-emerald-800 focus:outline-hidden bg-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Malbec Black Desodorante Colônia 100ml"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-800/15 focus:border-emerald-800 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Código no Catálogo / Revista *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 73512"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-800/15 focus:border-emerald-800 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Volume / Tamanho (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 100ml, 400ml, 30g..."
                    value={formVolumeMl}
                    onChange={(e) => setFormVolumeMl(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-800/15 focus:border-emerald-800 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Pricing Grid */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-800" />
                  Preços e Margem de Lucro
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1 truncate" title="Preço Revista (R$)">
                      Preço Revista
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formCatalogPrice}
                      onChange={(e) => setFormCatalogPrice(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1 truncate" title="Preço Custo (R$) *">
                      Preço Custo *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formCostPrice}
                      onChange={(e) => setFormCostPrice(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1 truncate" title="Preço Venda (R$) *">
                      Preço Venda *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formSalePrice}
                      onChange={(e) => setFormSalePrice(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-emerald-900"
                    />
                  </div>
                </div>

                {/* Real-time Profit Preview */}
                <div className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-slate-200/60">
                  <span className="font-semibold text-slate-700">Lucro Estimado por Unidade:</span>
                  <span className="font-bold text-emerald-900">
                    {formatCurrency(formSalePrice - formCostPrice)} ({formSalePrice > 0 ? Math.round(((formSalePrice - formCostPrice) / formSalePrice) * 100) : 0}% margem)
                  </span>
                </div>
              </div>

              {/* Stock & Status */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 truncate" title="Estoque Atual">
                    Estoque Atual
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formStock}
                    onChange={(e) => setFormStock(parseInt(e.target.value, 10) || 0)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 truncate" title="Alerta Estoque Mínimo">
                    Estoque Mín.
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formMinStockAlert}
                    onChange={(e) => setFormMinStockAlert(parseInt(e.target.value, 10) || 1)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 truncate" title="Status do Produto">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ProductStatus)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="promocao">Promoção</option>
                    <option value="lancamento">Lançamento</option>
                    <option value="fora_de_linha">Fora de Linha</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Foto do Produto (Opcional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="URL (https://...) ou enviar do dispositivo"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    className="flex-1 p-2.5 border border-slate-200 rounded-xl min-w-0"
                  />
                  <label className="shrink-0 flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer transition-colors border border-slate-200">
                    <Upload className="w-4 h-4" />
                    <span className="hidden sm:inline">Enviar Foto</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageUpload} 
                    />
                  </label>
                </div>
                {formImageUrl && (
                  <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 relative w-16 h-16 shadow-xs">
                    <img src={formImageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormImageUrl('')}
                      className="absolute top-0.5 right-0.5 bg-white p-1 rounded-full shadow hover:bg-red-50 text-slate-600 hover:text-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Descrição / Notas Olfativas
                </label>
                <textarea
                  rows={2}
                  placeholder="Notas de topo, fundo, benefícios, modo de usar..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  {productToEdit ? 'Salvar Alterações' : 'Cadastrar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-900" />
                <h3 className="font-bold text-base text-slate-900">
                  Importar Produtos em Lote (CSV)
                </h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Cole sua planilha separada por ponto e vírgula (;) ou vírgula no formato:
              <br />
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-mono block mt-1 text-slate-800">
                Nome;Marca;Categoria;Codigo;PrecoCatalogo;PrecoCusto;PrecoVenda;Estoque
              </code>
            </p>

            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={`Exemplo:\nLily Eau de Parfum 75ml;boticario;Perfumaria;25619;289.90;202.93;289.90;3\nEudora Rouge 75ml;eudora;Perfumaria;91204;214.90;150.43;214.90;4`}
              className="w-full p-3 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-800/15 focus:border-emerald-800 focus:outline-hidden"
            />

            {importFeedback && (
              <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200/80 rounded-xl text-xs font-semibold">
                {importFeedback}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={handleProcessCsv}
                className="px-4 py-2 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Processar e Importar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Product Deletion */}
      <ConfirmModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Remover Produto"
        confirmLabel="Remover Produto"
        cancelLabel="Cancelar"
        variant="danger"
        icon="trash"
        message={
          productToDelete ? (
            <p>
              Deseja realmente remover o produto <strong className="text-slate-900">{productToDelete.name}</strong> da sua lista de pronta-entrega?
            </p>
          ) : ''
        }
      />
    </div>
  );
};
