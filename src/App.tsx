import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import { TabType, BottomNav } from "./components/layout/BottomNav";
import { Header } from "./components/layout/Header";
import { DashboardView } from "./components/dashboard/DashboardView";
import { ClientsView } from "./components/clients/ClientsView";
import { ProductsView } from "./components/products/ProductsView";
import { SalesView } from "./components/sales/SalesView";
import { MoreView } from "./components/more/MoreView";
import { NewSaleModal } from "./components/sales/NewSaleModal";
import { ReceiptModal } from "./components/sales/ReceiptModal";
import { DigitalCatalogModal } from "./components/catalog/DigitalCatalogModal";
import { AuthScreen } from "./components/auth/AuthScreen";
import { Client, Sale } from "./types";

const MainAppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("inicio");
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);
  const [selectedClientForSale, setSelectedClientForSale] =
    useState<Client | null>(null);
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] =
    useState<Sale | null>(null);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);

  // Helper to open sale with preselected client
  const handleOpenSaleWithClient = (client: Client) => {
    setSelectedClientForSale(client);
    setIsNewSaleModalOpen(true);
  };

  const handleOpenNewSale = () => {
    setSelectedClientForSale(null);
    setIsNewSaleModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-950 text-white flex items-center justify-center text-xl animate-bounce shadow-md">
          💄
        </div>
        <p className="mt-3 text-xs font-bold text-slate-600 animate-pulse">
          Carregando dados seguros...
        </p>
      </div>
    );
  }

  // If no user is logged in, present permanent authentication screen (Option B)
  if (!user) {
    return <AuthScreen />;
  }

  return (
    <AppProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900 pb-20">
        {/* Top Header */}
        <Header
          onOpenSettings={() => setActiveTab("relatorios")}
          onOpenCatalog={() => setIsCatalogModalOpen(true)}
        />

        {/* Main Mobile-First Content Area */}
        <main className="flex-1 max-w-md sm:max-w-xl md:max-w-4xl w-full mx-auto p-3.5 sm:p-5">
          {activeTab === "inicio" && (
            <DashboardView
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenNewSale={handleOpenNewSale}
              onOpenCatalog={() => setIsCatalogModalOpen(true)}
              onSelectSaleForReceipt={(sale) => setSelectedSaleForReceipt(sale)}
            />
          )}

          {activeTab === "estoque" && <ProductsView />}

          {activeTab === "vendas" && (
            <SalesView
              onOpenNewSale={handleOpenNewSale}
              onSelectSaleForReceipt={(sale) => setSelectedSaleForReceipt(sale)}
            />
          )}

          {activeTab === "clientes" && (
            <ClientsView onSelectClientForSale={handleOpenSaleWithClient} />
          )}

          {activeTab === "mais" && <MoreView initialSubSection="menu" />}
          {activeTab === "financeiro" && (
            <MoreView initialSubSection="financeiro" />
          )}
          {activeTab === "agenda" && <MoreView initialSubSection="agenda" />}
          {activeTab === "relatorios" && (
            <MoreView initialSubSection="relatorios" />
          )}
        </main>

        {/* Modern Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenNewSale={handleOpenNewSale}
        />

        {/* Global Modals */}
        {isNewSaleModalOpen && (
          <NewSaleModal
            isOpen={isNewSaleModalOpen}
            onClose={() => {
              setIsNewSaleModalOpen(false);
              setSelectedClientForSale(null);
            }}
            preselectedClient={selectedClientForSale}
            onSaleCreated={(sale) => {
              setIsNewSaleModalOpen(false);
              setSelectedClientForSale(null);
              setSelectedSaleForReceipt(sale);
            }}
          />
        )}

        {selectedSaleForReceipt && (
          <ReceiptModal
            sale={selectedSaleForReceipt}
            onClose={() => setSelectedSaleForReceipt(null)}
          />
        )}

        {isCatalogModalOpen && (
          <DigitalCatalogModal
            isOpen={isCatalogModalOpen}
            onClose={() => setIsCatalogModalOpen(false)}
          />
        )}
      </div>
    </AppProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
