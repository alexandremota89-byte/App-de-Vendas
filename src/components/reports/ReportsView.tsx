import React from "react";
import { useApp } from "../../context/AppContext";
import { Download, Award, Users } from "lucide-react";
import { formatCurrency } from "../../utils/formatters";

export const ReportsView: React.FC = () => {
  const { sales, clients } = useApp();

  // Top selling products calculation
  const productSalesMap: Record<
    string,
    {
      name: string;
      brand: string;
      qty: number;
      totalRevenue: number;
      profit: number;
    }
  > = {};
  sales.forEach((s) => {
    s.items.forEach((item) => {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = {
          name: item.productName,
          brand: item.brand,
          qty: 0,
          totalRevenue: 0,
          profit: 0,
        };
      }
      productSalesMap[item.productId].qty += item.quantity;
      productSalesMap[item.productId].totalRevenue += item.subtotal;
      productSalesMap[item.productId].profit +=
        (item.unitSalePrice - item.unitCostPrice) * item.quantity;
    });
  });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // Top clients ranking calculation computed accurately from actual sales
  const clientStatsMap = clients.map((client) => {
    const clientSales = sales.filter(
      (s) =>
        s.clientId === client.id ||
        s.clientName?.toLowerCase() === client.name?.toLowerCase(),
    );
    const totalSpent = clientSales.reduce(
      (sum, s) => sum + (s.totalAmount || 0),
      0,
    );
    const totalPurchases = clientSales.length;

    return {
      ...client,
      totalSpent,
      totalPurchases,
    };
  });

  const topClients = [...clientStatsMap]
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);

  // Export CSV of sales
  const handleExportSalesCsv = () => {
    const headers = [
      "ID_Pedido",
      "Data",
      "Cliente",
      "Telefone",
      "Ciclo",
      "Forma_Pagamento",
      "Total",
      "Lucro",
    ];
    const rows = sales.map((s) => [
      s.id,
      s.date,
      `"${s.clientName}"`,
      s.clientPhone,
      `"${s.cycle}"`,
      s.paymentMethod,
      s.totalAmount.toFixed(2),
      s.grossProfit.toFixed(2),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `relatorio_vendas_consultora_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Relatórios & Análises
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Análises estratégicas de desempenho e ranking de clientes VIP
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportSalesCsv}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer border border-slate-200/60"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Exportar Planilha CSV</span>
          </button>
        </div>
      </div>

      {/* Top Rankings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1 bg-emerald-50/40">
            <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm min-w-0">
              <Award className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="truncate">Top 5 Produtos Mais Vendidos</span>
            </div>
            <span className="text-[11px] text-emerald-800 font-semibold shrink-0">
              Mais procurados
            </span>
          </div>

          {topProducts.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Nenhuma venda registrada ainda para calcular o ranking de
              produtos.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {topProducts.map((prod, idx) => (
                <div
                  key={idx}
                  className="p-3.5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        idx === 0
                          ? "bg-amber-400 text-amber-950 shadow-xs"
                          : idx === 1
                            ? "bg-slate-200 text-slate-800"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {idx + 1}º
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 block truncate">
                        {prod.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {prod.brand === "boticario" ? "O Boticário" : "Eudora"}{" "}
                        • {prod.qty}{" "}
                        {prod.qty === 1
                          ? "unidade vendida"
                          : "unidades vendidas"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <div className="font-bold text-slate-900">
                      {formatCurrency(prod.totalRevenue)}
                    </div>
                    <div className="text-[10px] text-emerald-800 font-semibold">
                      +{formatCurrency(prod.profit)} lucro
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top VIP Clients */}
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1 bg-rose-50/40">
            <div className="flex items-center gap-2 text-rose-950 font-bold text-sm min-w-0">
              <Users className="w-4 h-4 text-rose-700 shrink-0" />
              <span className="truncate">Top 5 Clientes VIP</span>
            </div>
            <span className="text-[11px] text-rose-800 font-semibold shrink-0">
              Suas clientes mais fiéis
            </span>
          </div>

          {topClients.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Nenhuma cliente cadastrada ainda.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {topClients.map((client, idx) => (
                <div
                  key={client.id}
                  className="p-3.5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        idx === 0
                          ? "bg-rose-950 text-white shadow-xs"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {idx + 1}º
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 block truncate">
                        {client.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {client.totalPurchases}{" "}
                        {client.totalPurchases === 1
                          ? "compra realizada"
                          : "compras realizadas"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <div className="font-bold text-rose-900 text-sm">
                      {formatCurrency(client.totalSpent)}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      em compras
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
