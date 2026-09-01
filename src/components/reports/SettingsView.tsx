import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import {
  Sparkles,
  Save,
  Database,
  Check,
  MessageSquareHeart,
  Upload,
  Download,
  CalendarDays,
  Plus,
  X,
  Cloud,
  LogOut,
  UserCheck,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { formatCurrency } from "../../utils/formatters";

export const SettingsView: React.FC = () => {
  const { user, logout } = useAuth();
  const {
    consultantName,
    consultantPhone,
    consultantEmail,
    consultantPhotoUrl,
    consultantPixKey,
    consultantReceiptNote,
    updateConsultantProfile,
    exportDataJSON,
    importDataJSON,
    cycles,
    currentCycle,
    setCurrentCycle,
    addCycle,
    syncToCloudNow,
    isSyncing,
    isCloudConnected,
  } = useApp();

  const [nameInput, setNameInput] = useState(consultantName);
  const [phoneInput, setPhoneInput] = useState(consultantPhone);
  const [emailInput, setEmailInput] = useState(consultantEmail);
  const [photoInput, setPhotoInput] = useState(consultantPhotoUrl);
  const [pixInput, setPixInput] = useState(consultantPixKey);
  const [receiptNoteInput, setReceiptNoteInput] = useState(
    consultantReceiptNote,
  );
  const [savedSettingsNotice, setSavedSettingsNotice] = useState(false);
  const [manualSyncNotice, setManualSyncNotice] = useState(false);

  // Sync inputs with context when consultant profile is loaded from storage/cloud
  useEffect(() => {
    setNameInput(consultantName);
  }, [consultantName]);

  useEffect(() => {
    setPhoneInput(consultantPhone);
  }, [consultantPhone]);

  useEffect(() => {
    setEmailInput(consultantEmail);
  }, [consultantEmail]);

  useEffect(() => {
    setPhotoInput(consultantPhotoUrl);
  }, [consultantPhotoUrl]);

  useEffect(() => {
    setPixInput(consultantPixKey);
  }, [consultantPixKey]);

  useEffect(() => {
    setReceiptNoteInput(consultantReceiptNote);
  }, [consultantReceiptNote]);

  const [isAddCycleModalOpen, setIsAddCycleModalOpen] = useState(false);
  const [newCycleName, setNewCycleName] = useState("");
  const [newCycleBrand, setNewCycleBrand] = useState<
    "boticario" | "eudora" | "ambas"
  >("ambas");
  const [newCycleStartDate, setNewCycleStartDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [newCycleEndDate, setNewCycleEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 21);
    return d.toISOString().split("T")[0];
  });
  const [newCycleTarget, setNewCycleTarget] = useState<number>(0);

  const handleAddCycle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCycleName.trim()) {
      alert("Preencha o nome do ciclo");
      return;
    }

    addCycle({
      name: newCycleName.trim(),
      brand: newCycleBrand,
      startDate: newCycleStartDate,
      endDate: newCycleEndDate,
      isActive: true,
      salesTarget: newCycleTarget,
    });

    setIsAddCycleModalOpen(false);
    setNewCycleName("");
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = nameInput.trim() || "Consultora de Beleza";
    const finalPhone = phoneInput.trim();
    const finalEmail = emailInput.trim();
    const finalPhoto = photoInput.trim();
    const finalPix = pixInput.trim();
    const finalNote = receiptNoteInput.trim() || "💖 Muito obrigada pela sua preferência e carinho!";

    updateConsultantProfile({
      name: finalName,
      phone: finalPhone,
      email: finalEmail,
      photoUrl: finalPhoto,
      pixKey: finalPix,
      receiptNote: finalNote,
    });

    setSavedSettingsNotice(true);
    setTimeout(() => setSavedSettingsNotice(false), 2500);
  };

  const handleManualCloudSync = async () => {
    try {
      await syncToCloudNow();
      setManualSyncNotice(true);
      setTimeout(() => setManualSyncNotice(false), 2500);
    } catch {
      alert("Não foi possível sincronizar no momento. Os dados estão salvos localmente.");
    }
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportDataJSON();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `backup_consultora_beleza_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = evt.target?.result as string;
        const success直接 = importDataJSON(json);
        if (success直接) {
          alert("Backup restaurado com sucesso! Seus dados foram carregados no celular e sincronizados na nuvem.");
        } else {
          alert(
            "Erro ao restaurar backup. Verifique se o arquivo é um JSON válido.",
          );
        }
      } catch {
        alert("Erro ao ler arquivo de backup.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex flex-col gap-1 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Configurações & Perfil
        </h2>
        <p className="text-xs text-slate-500">
          Gerencie seus dados pessoais, ciclos, sincronização em nuvem e backups
        </p>
      </div>

      {/* Cloud Status & Account Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isCloudConnected ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
            }`}>
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">
                  Sincronização Nuvem (Modo Híbrido)
                </h3>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Conectado
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {user?.isAnonymous 
                  ? "Dispositivo autenticado com chave invisível" 
                  : `Conectado como: ${user?.email || "Usuária Ativa"}`}
              </p>
            </div>
          </div>

          <button
            onClick={handleManualCloudSync}
            disabled={isSyncing}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold border border-slate-200/60"
            title="Forçar Sincronização Agora"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-emerald-800" : ""}`} />
            <span className="hidden sm:inline">{isSyncing ? "Sincronizando..." : "Sincronizar"}</span>
          </button>
        </div>

        {manualSyncNotice && (
          <div className="bg-emerald-50 text-emerald-800 text-xs p-2.5 rounded-xl border border-emerald-200 flex items-center gap-1.5 font-medium">
            <Check className="w-4 h-4" /> Dados sincronizados com a nuvem com sucesso!
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Persistência local ativada (funciona mesmo sem sinal de internet).</span>
          {user && !user.isAnonymous && (
            <button
              onClick={() => logout()}
              className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair da Conta
            </button>
          )}
        </div>
      </div>

      {/* Consultant Profile Settings & Receipt Customization */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Sparkles className="w-5 h-5 text-emerald-800" />
          <div>
            <h3 className="font-bold text-base text-slate-900 tracking-tight">
              Dados da Consultora & Mensagens dos Recibos
            </h3>
            <p className="text-xs text-slate-500">
              Personalize o nome, foto, chave PIX e mensagem padrão que saem nos
              comprovantes do WhatsApp
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nome da Consultora (Aparece no recibo)
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-800/15 focus:border-emerald-800 focus:outline-hidden"
                placeholder="Ex: Consultoria de Beleza"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Chave PIX Oficial (Para cobranças)
              </label>
              <input
                type="text"
                value={pixInput}
                onChange={(e) => setPixInput(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-800/15 focus:border-emerald-800 focus:outline-hidden"
                placeholder="Ex: seu-cpf, email ou celular"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-800/15 focus:border-emerald-800 focus:outline-hidden"
                placeholder="Ex: (11) 99999-9999"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                E-mail (Opcional)
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-800/15 focus:border-emerald-800 focus:outline-hidden"
                placeholder="Ex: seuemail@exemplo.com"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Foto de Perfil (Opcional)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={photoInput}
                onChange={(e) => setPhotoInput(e.target.value)}
                className="flex-1 p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-800/15 focus:border-emerald-800 focus:outline-hidden min-w-0"
                placeholder="Cole a URL ou envie uma foto..."
              />
              <label className="shrink-0 flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer transition-colors border border-slate-200">
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Enviar Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const img = new Image();
                      img.onload = () => {
                        const canvas = document.createElement("canvas");
                        const MAX_SIZE = 300;
                        let { width, height } = img;
                        if (width > height && width > MAX_SIZE) {
                          height *= MAX_SIZE / width;
                          width = MAX_SIZE;
                        } else if (height > MAX_SIZE) {
                          width *= MAX_SIZE / height;
                          height = MAX_SIZE;
                        }
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext("2d");
                        if (ctx) {
                          ctx.drawImage(img, 0, 0, width, height);
                          setPhotoInput(canvas.toDataURL("image/jpeg", 0.8));
                        }
                      };
                      if (event.target?.result)
                        img.src = event.target.result as string;
                    };
                    reader.readAsDataURL(file);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            {photoInput && (
              <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 relative w-16 h-16 shadow-xs">
                <img
                  src={photoInput}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPhotoInput("")}
                  className="absolute top-0.5 right-0.5 bg-white p-1 rounded-full shadow hover:bg-red-50 text-slate-600 hover:text-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <MessageSquareHeart className="w-3.5 h-3.5 text-emerald-800" />
              <span>
                Mensagem de Agradecimento Padrão (Rodapé do Recibo WhatsApp)
              </span>
            </label>
            <textarea
              rows={2}
              value={receiptNoteInput}
              onChange={(e) => setReceiptNoteInput(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-800/15 focus:border-emerald-800 focus:outline-hidden resize-none"
              placeholder="Ex: 💖 Muito obrigada pela sua preferência e carinho! Qualquer dúvida sobre os produtos é só me chamar."
            />
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Essa mensagem será incluída automaticamente ao final de todos os
              recibos enviados para o WhatsApp.
            </span>
          </div>

          <div className="flex items-center justify-between pt-2">
            {savedSettingsNotice ? (
              <span className="text-emerald-800 font-bold flex items-center gap-1">
                <Check className="w-4 h-4" /> Dados salvos com sucesso!
              </span>
            ) : (
              <span />
            )}
            <button
              type="submit"
              className="flex items-center gap-1.5 bg-emerald-900 hover:bg-emerald-950 text-white px-5 py-2.5 rounded-xl font-semibold shadow-xs cursor-pointer transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </form>
      </div>

      {/* Cycle Management Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-emerald-800" />
            <div>
              <h3 className="font-bold text-base text-slate-900 tracking-tight">
                Gerenciamento de Ciclos
              </h3>
              <p className="text-xs text-slate-500">
                Acompanhe e cadastre seus ciclos de vendas, selecionando o ciclo
                ativo para a dashboard
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAddCycleModalOpen(true)}
            className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 px-3 py-1.5 rounded-xl font-bold shadow-xs cursor-pointer transition-colors text-xs border border-emerald-200/60"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Novo Ciclo</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {cycles.map((cycle) => (
            <div
              key={cycle.id}
              className={`p-3 rounded-xl border relative transition-all ${
                currentCycle === cycle.name
                  ? "bg-emerald-50/50 border-emerald-500 shadow-xs"
                  : "bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/50 cursor-pointer"
              }`}
              onClick={() => {
                if (currentCycle !== cycle.name) {
                  setCurrentCycle(cycle.name);
                }
              }}
            >
              {currentCycle === cycle.name && (
                <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                  ATIVO
                </div>
              )}
              <h4 className="font-bold text-sm text-slate-900 mb-1">
                {cycle.name}
              </h4>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                <span>
                  Meta:{" "}
                  <strong className="text-slate-700">
                    {formatCurrency(cycle.salesTarget)}
                  </strong>
                </span>
                <span className="capitalize">{cycle.brand}</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {cycle.startDate.split("-").reverse().join("/")} até{" "}
                {cycle.endDate.split("-").reverse().join("/")}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cloud & Local Backup Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Database className="w-5 h-5 text-emerald-800" />
          <div>
            <h3 className="font-bold text-base text-slate-900 tracking-tight">
              Backup & Segurança dos Dados
            </h3>
            <p className="text-xs text-slate-500">
              Exporte seus dados em arquivo seguro ou restaure a qualquer momento
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <span className="font-bold text-slate-900 block">
              1. Fazer Cópia de Segurança (Download)
            </span>
            <p className="text-slate-500 text-[11px]">
              Gera um arquivo .json seguro contendo todos os clientes, produtos, vendas, parcelas e ciclos.
            </p>
            <button
              onClick={handleDownloadBackup}
              className="mt-2 flex items-center gap-1.5 bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-xl font-semibold shadow-xs cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Arquivo de Backup</span>
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <span className="font-bold text-slate-900 block">
              2. Restaurar Backup
            </span>
            <p className="text-slate-500 text-[11px]">
              Carregue um arquivo de backup previamente salvo para restaurar suas informações no dispositivo e na nuvem.
            </p>
            <label className="mt-2 inline-flex items-center gap-1.5 bg-emerald-900 hover:bg-emerald-950 text-white px-4 py-2 rounded-xl font-semibold shadow-xs cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              <span>Restaurar de Arquivo JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Add Cycle Modal */}
      {isAddCycleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-emerald-800" />
                Novo Ciclo
              </h3>
              <button
                onClick={() => setIsAddCycleModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCycle} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nome do Ciclo
                </label>
                <input
                  type="text"
                  required
                  value={newCycleName}
                  onChange={(e) => setNewCycleName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-800/15 focus:border-emerald-800 focus:outline-hidden"
                  placeholder="Ex: Ciclo 12/2023"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Marca Principal
                </label>
                <select
                  value={newCycleBrand}
                  onChange={(e) =>
                    setNewCycleBrand(
                      e.target.value as "boticario" | "eudora" | "ambas",
                    )
                  }
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-800/15 focus:border-emerald-800 focus:outline-hidden bg-white"
                >
                  <option value="ambas">Ambas / Multimarca</option>
                  <option value="boticario">O Boticário</option>
                  <option value="eudora">Eudora</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    required
                    value={newCycleStartDate}
                    onChange={(e) => setNewCycleStartDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-800/15 focus:border-emerald-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Data de Término
                  </label>
                  <input
                    type="date"
                    required
                    value={newCycleEndDate}
                    onChange={(e) => setNewCycleEndDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-800/15 focus:border-emerald-800 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Meta de Vendas (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newCycleTarget}
                  onChange={(e) => setNewCycleTarget(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-800/15 focus:border-emerald-800 focus:outline-hidden"
                  placeholder="0.00"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-emerald-900 hover:bg-emerald-950 text-white font-bold py-3 rounded-xl transition-all shadow-xs"
                >
                  Criar Ciclo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
