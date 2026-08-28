export type Brand = 'boticario' | 'eudora';

export type ProductCategory = 
  | 'Perfumaria'
  | 'Maquiagem'
  | 'Cuidados com a Pele'
  | 'Cabelos'
  | 'Corpo & Banho'
  | 'Infantil'
  | 'Kits & Presentes';

export type ClientTag = 'VIP' | 'Frequente' | 'Esporádico' | 'Novo';

export interface Client {
  id: string;
  name: string;
  phone: string; // WhatsApp
  email?: string;
  address?: string;
  neighborhood?: string;
  birthDate?: string; // YYYY-MM-DD
  avatarUrl?: string;
  tag: ClientTag;
  notes?: string; // Skin type, preferred notes, allergies
  preferredBrand?: 'boticario' | 'eudora' | 'ambas';
  createdAt: string;
}

export type ProductStatus = 'ativo' | 'promocao' | 'lancamento' | 'fora_de_linha';

export interface Product {
  id: string;
  name: string;
  brand: Brand;
  category: ProductCategory;
  code: string; // Código revista
  catalogPrice: number; // Preço de revista sugerido
  costPrice: number; // Preço pago pela consultora
  salePrice: number; // Preço praticado com cliente
  stock: number;
  minStockAlert: number;
  imageUrl?: string;
  status: ProductStatus;
  cycle?: string; // ex: "Ciclo 03/2026"
  description?: string;
  volumeMl?: string; // ex: "100ml", "250g"
}

export type PaymentMethod = 'pix' | 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'fiado';
export type SaleStatus = 'pago' | 'pendente' | 'parcial' | 'entregue' | 'cancelado';

export interface SaleItem {
  productId: string;
  productName: string;
  brand: Brand;
  category: ProductCategory;
  code: string;
  quantity: number;
  unitCostPrice: number;
  unitSalePrice: number;
  subtotal: number;
}

export interface Installment {
  id: string;
  saleId: string;
  installmentNumber: number;
  totalInstallments: number;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  isPaid: boolean;
  paidAt?: string;
}

export interface Sale {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  items: SaleItem[];
  subtotal: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  totalAmount: number;
  totalCost: number;
  grossProfit: number; // totalAmount - totalCost
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  installmentsCount: number;
  installments: Installment[];
  cycle: string;
  date: string; // ISO string or YYYY-MM-DD
  notes?: string;
  deliveryStatus: 'pendente' | 'entregue';
  deliveryDate?: string;
}

export type ExpenseCategory = 
  | 'Amostras & Provadores'
  | 'Frete & Entregas'
  | 'Sacolas & Embalagens'
  | 'Brindes & Mimos'
  | 'Revistas & Catálogos'
  | 'Outros';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  notes?: string;
}

export interface CycleConfig {
  id: string;
  name: string; // ex: "Ciclo 03/2026"
  brand: Brand | 'ambas';
  startDate: string;
  endDate: string;
  isActive: boolean;
  salesTarget: number;
}

export type ReminderType = 'aniversario' | 'cobranca_fiado' | 'pos_venda' | 'estoque_baixo' | 'ciclo';

export interface Reminder {
  id: string;
  type: ReminderType;
  title: string;
  description: string;
  targetId?: string; // Client ID, Sale ID or Product ID
  targetPhone?: string;
  dueDate: string;
  isCompleted: boolean;
  actionText?: string;
}
