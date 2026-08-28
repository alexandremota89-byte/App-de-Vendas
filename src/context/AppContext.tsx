import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Client, 
  Product, 
  Sale, 
  Expense, 
  CycleConfig, 
  Installment,
  Brand
} from '../types';
import { 
  INITIAL_CLIENTS, 
  INITIAL_PRODUCTS, 
  INITIAL_SALES, 
  INITIAL_EXPENSES, 
  INITIAL_CYCLES 
} from '../data/initialData';
import { isBirthdayThisMonth, isDateOverdue } from '../utils/formatters';

interface AppContextType {
  // State
  clients: Client[];
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  cycles: CycleConfig[];
  currentCycle: string;
  consultantName: string;
  consultantPhone: string;
  consultantEmail: string;
  consultantPhotoUrl: string;
  consultantPixKey: string;
  consultantReceiptNote: string;
  activeBrandFilter: 'todas' | 'boticario' | 'eudora';
  
  // Actions
  setActiveBrandFilter: (brand: 'todas' | 'boticario' | 'eudora') => void;
  setConsultantName: (name: string) => void;
  setConsultantPhone: (phone: string) => void;
  setConsultantEmail: (email: string) => void;
  setConsultantPhotoUrl: (url: string) => void;
  setConsultantPixKey: (key: string) => void;
  setConsultantReceiptNote: (note: string) => void;
  setCurrentCycle: (cycle: string) => void;

  // Clients
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Client;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  // Products
  addProduct: (product: Omit<Product, 'id'>) => Product;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  updateProductStock: (id: string, newStock: number) => void;
  importProducts: (newProducts: Omit<Product, 'id'>[]) => number;

  // Sales
  addSale: (saleData: Omit<Sale, 'id'>) => Sale;
  updateSale: (id: string, saleData: Partial<Sale>) => void;
  deleteSale: (id: string, restoreStock?: boolean) => void;
  markInstallmentPaid: (saleId: string, installmentId: string, isPaid: boolean) => void;

  // Expenses
  addExpense: (expense: Omit<Expense, 'id'>) => Expense;
  deleteExpense: (id: string) => void;

  // Cycles
  addCycle: (cycle: Omit<CycleConfig, 'id'>) => void;
  updateCycleTarget: (cycleId: string, newTarget: number) => void;

  // Backup & Storage
  exportDataJSON: () => string;
  importDataJSON: (jsonString: string) => boolean;
  resetToDefaultData: () => void;

  // Computed metrics
  metrics: {
    totalRevenue: number;
    totalCost: number;
    netProfit: number;
    totalFiadoPending: number;
    totalFiadoReceived: number;
    overdueInstallmentsCount: number;
    overdueInstallmentsAmount: number;
    lowStockCount: number;
    birthdaysThisMonthCount: number;
    boticarioRevenue: number;
    eudoraRevenue: number;
    currentCycleSales: number;
    currentCycleTarget: number;
    totalSalesCount: number;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CLIENTS: 'boticario_eudora_clients_v1',
  PRODUCTS: 'boticario_eudora_products_v1',
  SALES: 'boticario_eudora_sales_v1',
  EXPENSES: 'boticario_eudora_expenses_v1',
  CYCLES: 'boticario_eudora_cycles_v1',
  CURRENT_CYCLE: 'boticario_eudora_current_cycle_v1',
  CONSULTANT_NAME: 'boticario_eudora_consultant_name_v1',
  CONSULTANT_PHONE: 'boticario_eudora_consultant_phone_v1',
  CONSULTANT_EMAIL: 'boticario_eudora_consultant_email_v1',
  CONSULTANT_PHOTO_URL: 'boticario_eudora_consultant_photo_v1',
  CONSULTANT_PIX: 'boticario_eudora_consultant_pix_v1',
  CONSULTANT_RECEIPT_NOTE: 'boticario_eudora_receipt_note_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLIENTS);
      return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
    } catch {
      return INITIAL_CLIENTS;
    }
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SALES);
      return saved ? JSON.parse(saved) : INITIAL_SALES;
    } catch {
      return INITIAL_SALES;
    }
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
    } catch {
      return INITIAL_EXPENSES;
    }
  });

  const [cycles, setCycles] = useState<CycleConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CYCLES);
      return saved ? JSON.parse(saved) : INITIAL_CYCLES;
    } catch {
      return INITIAL_CYCLES;
    }
  });

  const [currentCycle, setCurrentCycle] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_CYCLE);
      return saved || 'Ciclo 03/2026';
    } catch {
      return 'Ciclo 03/2026';
    }
  });

  const [consultantName, setConsultantNameState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.CONSULTANT_NAME) || 'Consultora de Beleza';
    } catch {
      return 'Consultora de Beleza';
    }
  });

  const [consultantPhone, setConsultantPhoneState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.CONSULTANT_PHONE) || '';
    } catch {
      return '';
    }
  });

  const [consultantEmail, setConsultantEmailState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.CONSULTANT_EMAIL) || '';
    } catch {
      return '';
    }
  });

  const [consultantPhotoUrl, setConsultantPhotoUrlState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.CONSULTANT_PHOTO_URL) || '';
    } catch {
      return '';
    }
  });

  const [consultantPixKey, setConsultantPixKeyState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.CONSULTANT_PIX) || 'consultora@pix.com.br';
    } catch {
      return 'consultora@pix.com.br';
    }
  });

  const [consultantReceiptNote, setConsultantReceiptNoteState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.CONSULTANT_RECEIPT_NOTE) || '💖 Muito obrigada pela sua preferência e carinho!';
    } catch {
      return '💖 Muito obrigada pela sua preferência e carinho!';
    }
  });

  const [activeBrandFilter, setActiveBrandFilter] = useState<'todas' | 'boticario' | 'eudora'>('todas');

  // Persistence effects
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    } catch (e) {
      console.error(e);
    }
  }, [clients]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.error(e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
    } catch (e) {
      console.error(e);
    }
  }, [sales]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    } catch (e) {
      console.error(e);
    }
  }, [expenses]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CYCLES, JSON.stringify(cycles));
    } catch (e) {
      console.error(e);
    }
  }, [cycles]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_CYCLE, currentCycle);
    } catch (e) {
      console.error(e);
    }
  }, [currentCycle]);

  const setConsultantName = (name: string) => {
    setConsultantNameState(name);
    try {
      localStorage.setItem(STORAGE_KEYS.CONSULTANT_NAME, name);
    } catch (e) {
      console.error(e);
    }
  };

  const setConsultantPhone = (phone: string) => {
    setConsultantPhoneState(phone);
    try {
      localStorage.setItem(STORAGE_KEYS.CONSULTANT_PHONE, phone);
    } catch (e) {
      console.error(e);
    }
  };

  const setConsultantEmail = (email: string) => {
    setConsultantEmailState(email);
    try {
      localStorage.setItem(STORAGE_KEYS.CONSULTANT_EMAIL, email);
    } catch (e) {
      console.error(e);
    }
  };

  const setConsultantPhotoUrl = (url: string) => {
    setConsultantPhotoUrlState(url);
    try {
      localStorage.setItem(STORAGE_KEYS.CONSULTANT_PHOTO_URL, url);
    } catch (e) {
      console.error(e);
    }
  };

  const setConsultantPixKey = (key: string) => {
    setConsultantPixKeyState(key);
    try {
      localStorage.setItem(STORAGE_KEYS.CONSULTANT_PIX, key);
    } catch (e) {
      console.error(e);
    }
  };

  const setConsultantReceiptNote = (note: string) => {
    setConsultantReceiptNoteState(note);
    try {
      localStorage.setItem(STORAGE_KEYS.CONSULTANT_RECEIPT_NOTE, note);
    } catch (e) {
      console.error(e);
    }
  };

  // Client actions
  const addClient = (clientData: Omit<Client, 'id' | 'createdAt'>): Client => {
    const newClient: Client = {
      ...clientData,
      id: `cli-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setClients(prev => [newClient, ...prev]);
    return newClient;
  };

  const updateClient = (id: string, updatedFields: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updatedFields } : c));
  };

  const deleteClient = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
  };

  // Product actions
  const addProduct = (productData: Omit<Product, 'id'>): Product => {
    const newProd: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
    };
    setProducts(prev => [newProd, ...prev]);
    return newProd;
  };

  const updateProduct = (id: string, updatedFields: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updatedFields } : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const updateProductStock = (id: string, newStock: number) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: Math.max(0, newStock) } : p));
  };

  const importProducts = (newProducts: Omit<Product, 'id'>[]): number => {
    const prodsWithIds: Product[] = newProducts.map((p, idx) => ({
      ...p,
      id: `prod-imp-${Date.now()}-${idx}`,
    }));
    setProducts(prev => [...prodsWithIds, ...prev]);
    return prodsWithIds.length;
  };

  // Sales actions (with stock deduction)
  const addSale = (saleData: Omit<Sale, 'id'>): Sale => {
    const newSale: Sale = {
      ...saleData,
      id: `sale-${Date.now()}`,
    };
    setSales(prev => [newSale, ...prev]);

    // Automatically decrement product stock
    setProducts(prevProducts => {
      return prevProducts.map(prod => {
        const itemSold = saleData.items.find(it => it.productId === prod.id);
        if (itemSold) {
          return {
            ...prod,
            stock: Math.max(0, prod.stock - itemSold.quantity),
          };
        }
        return prod;
      });
    });

    return newSale;
  };

  const updateSale = (id: string, updatedFields: Partial<Sale>) => {
    setSales(prev => prev.map(s => s.id === id ? { ...s, ...updatedFields } : s));
  };

  const deleteSale = (id: string, restoreStock: boolean = true) => {
    setSales(prevSales => {
      const saleToDelete = prevSales.find(s => s.id === id);
      if (saleToDelete && restoreStock && saleToDelete.items && saleToDelete.items.length > 0) {
        setProducts(prevProducts => {
          return prevProducts.map(prod => {
            const itemSold = saleToDelete.items.find(it => it.productId === prod.id);
            if (itemSold) {
              return {
                ...prod,
                stock: prod.stock + itemSold.quantity,
              };
            }
            return prod;
          });
        });
      }
      return prevSales.filter(s => s.id !== id);
    });
  };

  const markInstallmentPaid = (saleId: string, installmentId: string, isPaid: boolean) => {
    setSales(prevSales => {
      return prevSales.map(sale => {
        if (sale.id !== saleId) return sale;

        const updatedInstallments = sale.installments.map(inst => {
          if (inst.id === installmentId) {
            return {
              ...inst,
              isPaid,
              paidAt: isPaid ? new Date().toISOString().split('T')[0] : undefined,
            };
          }
          return inst;
        });

        const allPaid = updatedInstallments.every(i => i.isPaid);
        const somePaid = updatedInstallments.some(i => i.isPaid);

        let newStatus = sale.status;
        if (sale.paymentMethod === 'fiado') {
          if (allPaid) newStatus = 'pago';
          else if (somePaid) newStatus = 'parcial';
          else newStatus = 'pendente';
        }

        return {
          ...sale,
          installments: updatedInstallments,
          status: newStatus,
        };
      });
    });
  };

  // Expenses
  const addExpense = (expenseData: Omit<Expense, 'id'>): Expense => {
    const newExp: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
    };
    setExpenses(prev => [newExp, ...prev]);
    return newExp;
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  // Cycles
  const addCycle = (cycleData: Omit<CycleConfig, 'id'>) => {
    const newCycle: CycleConfig = {
      ...cycleData,
      id: `cycle-${Date.now()}`,
    };
    setCycles(prev => [newCycle, ...prev]);
  };

  const updateCycleTarget = (cycleId: string, newTarget: number) => {
    setCycles(prev => prev.map(c => c.id === cycleId ? { ...c, salesTarget: newTarget } : c));
  };

  // Backup & storage
  const exportDataJSON = (): string => {
    const fullBackup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      consultantName,
      consultantPixKey,
      consultantReceiptNote,
      currentCycle,
      clients,
      products,
      sales,
      expenses,
      cycles,
    };
    return JSON.stringify(fullBackup, null, 2);
  };

  const importDataJSON = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.clients && Array.isArray(data.clients)) setClients(data.clients);
      if (data.products && Array.isArray(data.products)) setProducts(data.products);
      if (data.sales && Array.isArray(data.sales)) setSales(data.sales);
      if (data.expenses && Array.isArray(data.expenses)) setExpenses(data.expenses);
      if (data.cycles && Array.isArray(data.cycles)) setCycles(data.cycles);
      if (data.currentCycle) setCurrentCycle(data.currentCycle);
      if (data.consultantName) setConsultantName(data.consultantName);
      if (data.consultantPixKey) setConsultantPixKey(data.consultantPixKey);
      if (data.consultantReceiptNote) setConsultantReceiptNote(data.consultantReceiptNote);
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  };

  const resetToDefaultData = () => {
    setClients(INITIAL_CLIENTS);
    setProducts(INITIAL_PRODUCTS);
    setSales(INITIAL_SALES);
    setExpenses(INITIAL_EXPENSES);
    setCycles(INITIAL_CYCLES);
    setCurrentCycle('Ciclo 03/2026');
  };

  // Computed metrics calculation
  const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalCost = sales.reduce((sum, s) => sum + s.totalCost, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const grossProfit = totalRevenue - totalCost;
  const netProfit = grossProfit - totalExpenses;

  // Fiado calculation
  let totalFiadoPending = 0;
  let totalFiadoReceived = 0;
  let overdueInstallmentsCount = 0;
  let overdueInstallmentsAmount = 0;

  sales.forEach(sale => {
    if (sale.installments && sale.installments.length > 0) {
      // If sale has installments list
      sale.installments.forEach(inst => {
        if (inst.isPaid) {
          totalFiadoReceived += (inst.amount || 0);
        } else {
          totalFiadoPending += (inst.amount || 0);
          if (isDateOverdue(inst.dueDate)) {
            overdueInstallmentsCount += 1;
            overdueInstallmentsAmount += (inst.amount || 0);
          }
        }
      });
    } else if (sale.paymentMethod === 'fiado' || sale.status === 'pendente' || sale.status === 'parcial') {
      if (sale.status === 'pago') {
        totalFiadoReceived += (sale.totalAmount || 0);
      } else {
        totalFiadoPending += (sale.totalAmount || 0);
        if (isDateOverdue(sale.date)) {
          overdueInstallmentsCount += 1;
          overdueInstallmentsAmount += (sale.totalAmount || 0);
        }
      }
    }
  });

  const lowStockCount = products.filter(p => p.stock <= p.minStockAlert).length;
  const birthdaysThisMonthCount = clients.filter(c => isBirthdayThisMonth(c.birthDate)).length;

  let boticarioRevenue = 0;
  let eudoraRevenue = 0;

  sales.forEach(sale => {
    sale.items.forEach(item => {
      if (item.brand === 'boticario') boticarioRevenue += item.subtotal;
      else if (item.brand === 'eudora') eudoraRevenue += item.subtotal;
    });
  });

  const currentCycleObj = cycles.find(c => c.name === currentCycle) || cycles[0];
  const currentCycleSales = sales
    .filter(s => s.cycle === currentCycle)
    .reduce((sum, s) => sum + s.totalAmount, 0);
  const currentCycleTarget = currentCycleObj?.salesTarget || 4500;

  const metrics = {
    totalRevenue,
    totalCost,
    netProfit,
    totalFiadoPending,
    totalFiadoReceived,
    overdueInstallmentsCount,
    overdueInstallmentsAmount,
    lowStockCount,
    birthdaysThisMonthCount,
    boticarioRevenue,
    eudoraRevenue,
    currentCycleSales,
    currentCycleTarget,
    totalSalesCount: sales.length,
  };

  return (
    <AppContext.Provider
      value={{
        clients,
        products,
        sales,
        expenses,
        cycles,
        currentCycle,
        consultantName,
        consultantPhone,
        consultantEmail,
        consultantPhotoUrl,
        consultantPixKey,
        consultantReceiptNote,
        activeBrandFilter,
        setActiveBrandFilter,
        setConsultantName,
        setConsultantPhone,
        setConsultantEmail,
        setConsultantPhotoUrl,
        setConsultantPixKey,
        setConsultantReceiptNote,
        setCurrentCycle,
        addClient,
        updateClient,
        deleteClient,
        addProduct,
        updateProduct,
        deleteProduct,
        updateProductStock,
        importProducts,
        addSale,
        updateSale,
        deleteSale,
        markInstallmentPaid,
        addExpense,
        deleteExpense,
        addCycle,
        updateCycleTarget,
        exportDataJSON,
        importDataJSON,
        resetToDefaultData,
        metrics,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
