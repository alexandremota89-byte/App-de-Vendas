import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  Client, 
  Product, 
  Sale, 
  Expense, 
  CycleConfig, 
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
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot 
} from 'firebase/firestore';

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
  
  // Cloud sync status
  isSyncing: boolean;
  isCloudConnected: boolean;

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
  syncToCloudNow: () => Promise<void>;

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
  CLIENTS: 'boticario_eudora_clients_v2',
  PRODUCTS: 'boticario_eudora_products_v2',
  SALES: 'boticario_eudora_sales_v2',
  EXPENSES: 'boticario_eudora_expenses_v2',
  CYCLES: 'boticario_eudora_cycles_v2',
  CURRENT_CYCLE: 'boticario_eudora_current_cycle_v2',
  CONSULTANT_NAME: 'boticario_eudora_consultant_name_v2',
  CONSULTANT_PHONE: 'boticario_eudora_consultant_phone_v2',
  CONSULTANT_EMAIL: 'boticario_eudora_consultant_email_v2',
  CONSULTANT_PHOTO_URL: 'boticario_eudora_consultant_photo_v2',
  CONSULTANT_PIX: 'boticario_eudora_consultant_pix_v2',
  CONSULTANT_RECEIPT_NOTE: 'boticario_eudora_receipt_note_v2',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCloudConnected, setIsCloudConnected] = useState(false);

  // Local state with LocalStorage caching
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

  const [currentCycle, setCurrentCycleState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.CURRENT_CYCLE) || 'Ciclo 03/2026';
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
      return localStorage.getItem(STORAGE_KEYS.CONSULTANT_PIX) || '';
    } catch {
      return '';
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

  // Sync to LocalStorage
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

  // Firestore Real-Time / Offline-First Synchronization
  useEffect(() => {
    if (!user) {
      setIsCloudConnected(false);
      return;
    }

    setIsCloudConnected(true);
    const userDocRef = doc(db, 'users', user.uid, 'appData', 'main');

    // Subscribe to cloud changes
    const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const cloudData = snapshot.data();
        
        // Detect legacy test data (e.g. cli-01 / Mariana Silveira or old mock list) and auto-clean
        const hasLegacyTestData = cloudData.clients?.some((c: any) => c.id === 'cli-01' || c.name === 'Mariana Silveira') ||
          cloudData.sales?.some((s: any) => s.id === 'sale-01');

        if (hasLegacyTestData && !cloudData.hasCleanedLegacyData) {
          const defaultName = user.displayName || (user.email ? user.email.split('@')[0] : 'Consultora');
          const cleanPayload = {
            clients: [],
            products: INITIAL_PRODUCTS,
            sales: [],
            expenses: [],
            cycles: INITIAL_CYCLES,
            currentCycle: 'Ciclo 03/2026',
            consultantName: defaultName,
            consultantPhone: '',
            consultantEmail: user.email || '',
            consultantPhotoUrl: user.photoURL || '',
            consultantPixKey: '',
            consultantReceiptNote: '💖 Muito obrigada pela sua preferência e carinho!',
            hasCleanedLegacyData: true,
            lastUpdatedAt: new Date().toISOString(),
          };
          setClients([]);
          setProducts(INITIAL_PRODUCTS);
          setSales([]);
          setExpenses([]);
          setCycles(INITIAL_CYCLES);
          setCurrentCycleState('Ciclo 03/2026');
          setConsultantNameState(defaultName);
          setConsultantPhoneState('');
          setConsultantEmailState(user.email || '');
          setConsultantPhotoUrlState(user.photoURL || '');
          setConsultantPixKeyState('');
          setConsultantReceiptNoteState('💖 Muito obrigada pela sua preferência e carinho!');
          setDoc(userDocRef, cleanPayload, { merge: true }).catch(console.error);
          return;
        }

        if (cloudData.clients && Array.isArray(cloudData.clients)) setClients(cloudData.clients);
        if (cloudData.products && Array.isArray(cloudData.products)) setProducts(cloudData.products);
        if (cloudData.sales && Array.isArray(cloudData.sales)) setSales(cloudData.sales);
        if (cloudData.expenses && Array.isArray(cloudData.expenses)) setExpenses(cloudData.expenses);
        if (cloudData.cycles && Array.isArray(cloudData.cycles)) setCycles(cloudData.cycles);
        if (cloudData.currentCycle) setCurrentCycleState(cloudData.currentCycle);
        if (cloudData.consultantName) setConsultantNameState(cloudData.consultantName);
        if (cloudData.consultantPhone) setConsultantPhoneState(cloudData.consultantPhone);
        if (cloudData.consultantEmail) setConsultantEmailState(cloudData.consultantEmail);
        if (cloudData.consultantPhotoUrl) setConsultantPhotoUrlState(cloudData.consultantPhotoUrl);
        if (cloudData.consultantPixKey) setConsultantPixKeyState(cloudData.consultantPixKey);
        if (cloudData.consultantReceiptNote) setConsultantReceiptNoteState(cloudData.consultantReceiptNote);
      } else {
        // First time cloud user: initialize with clean slate and pre-registered catalogue
        const defaultName = user.displayName || (user.email ? user.email.split('@')[0] : 'Consultora');
        const initialCloudPayload = {
          clients: [],
          products: INITIAL_PRODUCTS,
          sales: [],
          expenses: [],
          cycles: INITIAL_CYCLES,
          currentCycle: 'Ciclo 03/2026',
          consultantName: defaultName,
          consultantPhone: '',
          consultantEmail: user.email || '',
          consultantPhotoUrl: user.photoURL || '',
          consultantPixKey: '',
          consultantReceiptNote: '💖 Muito obrigada pela sua preferência e carinho!',
          hasCleanedLegacyData: true,
          lastUpdatedAt: new Date().toISOString(),
        };
        setClients([]);
        setProducts(INITIAL_PRODUCTS);
        setSales([]);
        setExpenses([]);
        setCycles(INITIAL_CYCLES);
        setCurrentCycleState('Ciclo 03/2026');
        setConsultantNameState(defaultName);
        setConsultantPhoneState('');
        setConsultantEmailState(user.email || '');
        setConsultantPhotoUrlState(user.photoURL || '');
        setConsultantPixKeyState('');
        setConsultantReceiptNoteState('💖 Muito obrigada pela sua preferência e carinho!');
        setDoc(userDocRef, initialCloudPayload, { merge: true }).catch(console.error);
      }
    }, (err) => {
      console.warn('Firestore snapshot error (working offline):', err);
    });

    return () => unsubscribe();
  }, [user]);

  // Helper to persist to cloud automatically in background
  const saveToCloud = useCallback(async (overrides: Record<string, any> = {}) => {
    if (!user) return;
    try {
      setIsSyncing(true);
      const userDocRef = doc(db, 'users', user.uid, 'appData', 'main');
      await setDoc(userDocRef, {
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
        lastUpdatedAt: new Date().toISOString(),
        ...overrides,
      }, { merge: true });
    } catch (err) {
      console.warn('Auto-save to cloud buffered offline:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [
    user, 
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
    consultantReceiptNote
  ]);

  // Atomic update for consultant profile
  const updateConsultantProfile = useCallback((profile: {
    name?: string;
    phone?: string;
    email?: string;
    photoUrl?: string;
    pixKey?: string;
    receiptNote?: string;
  }) => {
    const payload: Record<string, any> = {};

    if (profile.name !== undefined) {
      setConsultantNameState(profile.name);
      try {
        localStorage.setItem(STORAGE_KEYS.CONSULTANT_NAME, profile.name);
      } catch (e) {
        console.error(e);
      }
      payload.consultantName = profile.name;
    }

    if (profile.phone !== undefined) {
      setConsultantPhoneState(profile.phone);
      try {
        localStorage.setItem(STORAGE_KEYS.CONSULTANT_PHONE, profile.phone);
      } catch (e) {
        console.error(e);
      }
      payload.consultantPhone = profile.phone;
    }

    if (profile.email !== undefined) {
      setConsultantEmailState(profile.email);
      try {
        localStorage.setItem(STORAGE_KEYS.CONSULTANT_EMAIL, profile.email);
      } catch (e) {
        console.error(e);
      }
      payload.consultantEmail = profile.email;
    }

    if (profile.photoUrl !== undefined) {
      setConsultantPhotoUrlState(profile.photoUrl);
      try {
        localStorage.setItem(STORAGE_KEYS.CONSULTANT_PHOTO_URL, profile.photoUrl);
      } catch (e) {
        console.error(e);
      }
      payload.consultantPhotoUrl = profile.photoUrl;
    }

    if (profile.pixKey !== undefined) {
      setConsultantPixKeyState(profile.pixKey);
      try {
        localStorage.setItem(STORAGE_KEYS.CONSULTANT_PIX, profile.pixKey);
      } catch (e) {
        console.error(e);
      }
      payload.consultantPixKey = profile.pixKey;
    }

    if (profile.receiptNote !== undefined) {
      setConsultantReceiptNoteState(profile.receiptNote);
      try {
        localStorage.setItem(STORAGE_KEYS.CONSULTANT_RECEIPT_NOTE, profile.receiptNote);
      } catch (e) {
        console.error(e);
      }
      payload.consultantReceiptNote = profile.receiptNote;
    }

    if (user && Object.keys(payload).length > 0) {
      setIsSyncing(true);
      const userDocRef = doc(db, 'users', user.uid, 'appData', 'main');
      setDoc(userDocRef, {
        ...payload,
        lastUpdatedAt: new Date().toISOString(),
      }, { merge: true })
        .catch((err) => console.warn('Cloud profile save buffered offline:', err))
        .finally(() => setIsSyncing(false));
    }
  }, [user]);

  const setConsultantName = (name: string) => {
    updateConsultantProfile({ name });
  };

  const setConsultantPhone = (phone: string) => {
    updateConsultantProfile({ phone });
  };

  const setConsultantEmail = (email: string) => {
    updateConsultantProfile({ email });
  };

  const setConsultantPhotoUrl = (url: string) => {
    updateConsultantProfile({ photoUrl: url });
  };

  const setConsultantPixKey = (key: string) => {
    updateConsultantProfile({ pixKey: key });
  };

  const setConsultantReceiptNote = (note: string) => {
    updateConsultantProfile({ receiptNote: note });
  };

  const setCurrentCycle = (cycle: string) => {
    setCurrentCycleState(cycle);
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_CYCLE, cycle);
    } catch (e) {
      console.error(e);
    }
    saveToCloud({ currentCycle: cycle });
  };

  // Client actions
  const addClient = (clientData: Omit<Client, 'id' | 'createdAt'>): Client => {
    const newClient: Client = {
      ...clientData,
      id: `cli-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    const updated = [newClient, ...clients];
    setClients(updated);
    saveToCloud({ clients: updated });
    return newClient;
  };

  const updateClient = (id: string, updatedFields: Partial<Client>) => {
    const updated = clients.map(c => c.id === id ? { ...c, ...updatedFields } : c);
    setClients(updated);
    saveToCloud({ clients: updated });
  };

  const deleteClient = (id: string) => {
    const updated = clients.filter(c => c.id !== id);
    setClients(updated);
    saveToCloud({ clients: updated });
  };

  // Product actions
  const addProduct = (productData: Omit<Product, 'id'>): Product => {
    const newProd: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
    };
    const updated = [newProd, ...products];
    setProducts(updated);
    saveToCloud({ products: updated });
    return newProd;
  };

  const updateProduct = (id: string, updatedFields: Partial<Product>) => {
    const updated = products.map(p => p.id === id ? { ...p, ...updatedFields } : p);
    setProducts(updated);
    saveToCloud({ products: updated });
  };

  const deleteProduct = (id: string) => {
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    saveToCloud({ products: updated });
  };

  const updateProductStock = (id: string, newStock: number) => {
    const updated = products.map(p => p.id === id ? { ...p, stock: Math.max(0, newStock) } : p);
    setProducts(updated);
    saveToCloud({ products: updated });
  };

  const importProducts = (newProducts: Omit<Product, 'id'>[]): number => {
    const prodsWithIds: Product[] = newProducts.map((p, idx) => ({
      ...p,
      id: `prod-imp-${Date.now()}-${idx}`,
    }));
    const updated = [...prodsWithIds, ...products];
    setProducts(updated);
    saveToCloud({ products: updated });
    return prodsWithIds.length;
  };

  // Sales actions (with automatic stock deduction)
  const addSale = (saleData: Omit<Sale, 'id'>): Sale => {
    const newSale: Sale = {
      ...saleData,
      id: `sale-${Date.now()}`,
    };
    const updatedSales = [newSale, ...sales];
    setSales(updatedSales);

    // Automatically decrement product stock
    const updatedProducts = products.map(prod => {
      const itemSold = saleData.items.find(it => it.productId === prod.id);
      if (itemSold) {
        return {
          ...prod,
          stock: Math.max(0, prod.stock - itemSold.quantity),
        };
      }
      return prod;
    });
    setProducts(updatedProducts);

    saveToCloud({ sales: updatedSales, products: updatedProducts });
    return newSale;
  };

  const updateSale = (id: string, updatedFields: Partial<Sale>) => {
    const updated = sales.map(s => s.id === id ? { ...s, ...updatedFields } : s);
    setSales(updated);
    saveToCloud({ sales: updated });
  };

  const deleteSale = (id: string, restoreStock: boolean = true) => {
    const saleToDelete = sales.find(s => s.id === id);
    let updatedProducts = products;
    if (saleToDelete && restoreStock && saleToDelete.items && saleToDelete.items.length > 0) {
      updatedProducts = products.map(prod => {
        const itemSold = saleToDelete.items.find(it => it.productId === prod.id);
        if (itemSold) {
          return {
            ...prod,
            stock: prod.stock + itemSold.quantity,
          };
        }
        return prod;
      });
      setProducts(updatedProducts);
    }
    const updatedSales = sales.filter(s => s.id !== id);
    setSales(updatedSales);
    saveToCloud({ sales: updatedSales, products: updatedProducts });
  };

  const markInstallmentPaid = (saleId: string, installmentId: string, isPaid: boolean) => {
    const updatedSales = sales.map(sale => {
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

    setSales(updatedSales);
    saveToCloud({ sales: updatedSales });
  };

  // Expenses
  const addExpense = (expenseData: Omit<Expense, 'id'>): Expense => {
    const newExp: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
    };
    const updated = [newExp, ...expenses];
    setExpenses(updated);
    saveToCloud({ expenses: updated });
    return newExp;
  };

  const deleteExpense = (id: string) => {
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    saveToCloud({ expenses: updated });
  };

  // Cycles
  const addCycle = (cycleData: Omit<CycleConfig, 'id'>) => {
    const newCycle: CycleConfig = {
      ...cycleData,
      id: `cycle-${Date.now()}`,
    };
    const updated = [newCycle, ...cycles];
    setCycles(updated);
    saveToCloud({ cycles: updated });
  };

  const updateCycleTarget = (cycleId: string, newTarget: number) => {
    const updated = cycles.map(c => c.id === cycleId ? { ...c, salesTarget: newTarget } : c);
    setCycles(updated);
    saveToCloud({ cycles: updated });
  };

  // Backup & storage
  const exportDataJSON = (): string => {
    const fullBackup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      consultantName,
      consultantPhone,
      consultantEmail,
      consultantPhotoUrl,
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
      if (data.consultantPhone) setConsultantPhone(data.consultantPhone);
      if (data.consultantEmail) setConsultantEmail(data.consultantEmail);
      if (data.consultantPhotoUrl) setConsultantPhotoUrl(data.consultantPhotoUrl);
      if (data.consultantPixKey) setConsultantPixKey(data.consultantPixKey);
      if (data.consultantReceiptNote) setConsultantReceiptNote(data.consultantReceiptNote);

      saveToCloud({
        clients: data.clients || clients,
        products: data.products || products,
        sales: data.sales || sales,
        expenses: data.expenses || expenses,
        cycles: data.cycles || cycles,
        currentCycle: data.currentCycle || currentCycle,
        consultantName: data.consultantName || consultantName,
        consultantPhone: data.consultantPhone || consultantPhone,
        consultantEmail: data.consultantEmail || consultantEmail,
        consultantPhotoUrl: data.consultantPhotoUrl || consultantPhotoUrl,
        consultantPixKey: data.consultantPixKey || consultantPixKey,
        consultantReceiptNote: data.consultantReceiptNote || consultantReceiptNote,
      });

      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  };

  const syncToCloudNow = async () => {
    await saveToCloud();
  };

  const resetToDefaultData = () => {
    setClients(INITIAL_CLIENTS);
    setProducts(INITIAL_PRODUCTS);
    setSales(INITIAL_SALES);
    setExpenses(INITIAL_EXPENSES);
    setCycles(INITIAL_CYCLES);
    setCurrentCycle('Ciclo 03/2026');
    saveToCloud({
      clients: INITIAL_CLIENTS,
      products: INITIAL_PRODUCTS,
      sales: INITIAL_SALES,
      expenses: INITIAL_EXPENSES,
      cycles: INITIAL_CYCLES,
      currentCycle: 'Ciclo 03/2026',
    });
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
        isSyncing,
        isCloudConnected,
        setActiveBrandFilter,
        updateConsultantProfile,
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
        syncToCloudNow,
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
