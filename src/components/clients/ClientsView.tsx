import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Client, ClientTag } from '../../types';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Cake, 
  MapPin, 
  Star, 
  MessageCircle, 
  Edit3, 
  Trash2, 
  ShoppingBag, 
  Clock, 
  DollarSign, 
  X, 
  Check, 
  Sparkles,
  Heart,
  AlertCircle
} from 'lucide-react';
import { 
  formatCurrency, 
  formatDate, 
  formatPhone, 
  getWhatsAppUrl, 
  generateBirthdayMessage,
  isBirthdayThisMonth,
  isBirthdayToday
} from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';

interface ClientsViewProps {
  onOpenNewSaleForClient?: (client: Client) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({ onOpenNewSaleForClient }) => {
  const { 
    clients, 
    sales, 
    addClient, 
    updateClient, 
    deleteClient,
    markInstallmentPaid 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [tagFilter, setTagFilter] = useState<'todos' | ClientTag | 'fiado' | 'aniversario'>('todos');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedClientForDetails, setSelectedClientForDetails] = useState<Client | null>(null);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<{ id: string; name: string } | null>(null);

  // Form states for Add/Edit
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formNeighborhood, setFormNeighborhood] = useState('');
  const [formBirthDate, setFormBirthDate] = useState('');
  const [formTag, setFormTag] = useState<ClientTag>('Novo');
  const [formNotes, setFormNotes] = useState('');
  const [formPreferredBrand, setFormPreferredBrand] = useState<'boticario' | 'eudora' | 'ambas'>('ambas');

  const openAddModal = () => {
    setClientToEdit(null);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
    setFormNeighborhood('');
    setFormBirthDate('');
    setFormTag('Novo');
    setFormNotes('');
    setFormPreferredBrand('ambas');
    setIsAddModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setClientToEdit(client);
    setFormName(client.name);
    setFormPhone(client.phone);
    setFormEmail(client.email || '');
    setFormAddress(client.address || '');
    setFormNeighborhood(client.neighborhood || '');
    setFormBirthDate(client.birthDate || '');
    setFormTag(client.tag);
    setFormNotes(client.notes || '');
    setFormPreferredBrand(client.preferredBrand || 'ambas');
    setIsAddModalOpen(true);
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) {
      alert('Nome e WhatsApp são obrigatórios!');
      return;
    }

    if (clientToEdit) {
      updateClient(clientToEdit.id, {
        name: formName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim() || undefined,
        address: formAddress.trim() || undefined,
        neighborhood: formNeighborhood.trim() || undefined,
        birthDate: formBirthDate || undefined,
        tag: formTag,
        notes: formNotes.trim() || undefined,
        preferredBrand: formPreferredBrand,
      });
      if (selectedClientForDetails?.id === clientToEdit.id) {
        setSelectedClientForDetails({
          ...selectedClientForDetails,
          name: formName.trim(),
          phone: formPhone.trim(),
          email: formEmail.trim() || undefined,
          address: formAddress.trim() || undefined,
          neighborhood: formNeighborhood.trim() || undefined,
          birthDate: formBirthDate || undefined,
          tag: formTag,
          notes: formNotes.trim() || undefined,
          preferredBrand: formPreferredBrand,
        });
      }
    } else {
      addClient({
        name: formName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim() || undefined,
        address: formAddress.trim() || undefined,
        neighborhood: formNeighborhood.trim() || undefined,
        birthDate: formBirthDate || undefined,
        tag: formTag,
        notes: formNotes.trim() || undefined,
        preferredBrand: formPreferredBrand,
      });
    }

    setIsAddModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    setClientToDelete({ id, name });
  };

  const handleConfirmDelete = () => {
    if (clientToDelete) {
      deleteClient(clientToDelete.id);
      if (selectedClientForDetails?.id === clientToDelete.id) {
        setSelectedClientForDetails(null);
      }
      setClientToDelete(null);
    }
  };

  // Helper to compute client financial stats
  const getClientStats = (clientId: string) => {
    const clientSales = sales.filter(s => s.clientId === clientId);
    const totalSpent = clientSales.reduce((sum, s) => sum + s.totalAmount, 0);
    
    let pendingFiado = 0;
    clientSales.forEach(s => {
      if (s.paymentMethod === 'fiado') {
        s.installments.forEach(inst => {
          if (!inst.isPaid) pendingFiado += inst.amount;
        });
      }
    });

    return {
      salesCount: clientSales.length,
      totalSpent,
      pendingFiado,
      sales: clientSales,
    };
  };

  // Filter clients
  const filteredClients = clients.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.neighborhood && c.neighborhood.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (tagFilter === 'todos') return true;
    if (tagFilter === 'aniversario') return isBirthdayThisMonth(c.birthDate);
    if (tagFilter === 'fiado') {
      const { pendingFiado } = getClientStats(c.id);
      return pendingFiado > 0;
    }
    return c.tag === tagFilter;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header with Title & Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Minhas Clientes & Contatos</h2>
            <span className="shrink-0 bg-emerald-50 text-emerald-900 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200/60">
              {clients.length} cadastradas
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie preferências de beleza, datas especiais, histórico de pedidos e parcelamentos
          </p>
        </div>

        <button
          onClick={openAddModal}
          id="btn-add-new-client"
          className="flex items-center justify-center gap-2 bg-emerald-900 hover:bg-emerald-950 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 text-emerald-300" />
          <span>Cadastrar Nova Cliente</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone ou bairro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-800/15 focus:border-emerald-800 transition-all shadow-xs text-slate-900 placeholder:text-slate-400"
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

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full pb-1 sm:pb-0">
          <button
            onClick={() => setTagFilter('todos')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              tagFilter === 'todos'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Todas ({clients.length})
          </button>
          <button
            onClick={() => setTagFilter('VIP')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              tagFilter === 'VIP'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-amber-800 hover:bg-amber-50/60'
            }`}
          >
            ⭐ VIP
          </button>
          <button
            onClick={() => setTagFilter('Frequente')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              tagFilter === 'Frequente'
                ? 'bg-emerald-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-emerald-900 hover:bg-emerald-50/60'
            }`}
          >
            🌸 Frequentes
          </button>
          <button
            onClick={() => setTagFilter('fiado')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              tagFilter === 'fiado'
                ? 'bg-rose-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-rose-900 hover:bg-rose-50/60'
            }`}
          >
            ⏳ Com Fiado em Aberto
          </button>
          <button
            onClick={() => setTagFilter('aniversario')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              tagFilter === 'aniversario'
                ? 'bg-pink-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-pink-800 hover:bg-pink-50/60'
            }`}
          >
            🎂 Aniversariantes do Mês
          </button>
        </div>
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Nenhuma cliente encontrada</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Tente buscar com outro termo ou cadastre uma nova cliente para gerenciar suas compras.
          </p>
          <button
            onClick={openAddModal}
            className="mt-4 inline-flex items-center gap-1.5 bg-emerald-900 hover:bg-emerald-950 text-white px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4 text-emerald-300" /> Cadastrar Cliente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const stats = getClientStats(client.id);
            const isBirthday = isBirthdayThisMonth(client.birthDate);
            const isToday = isBirthdayToday(client.birthDate);
            const waUrl = getWhatsAppUrl(
              client.phone,
              isBirthday ? generateBirthdayMessage(client) : `Olá ${client.name}! Tudo bem? 🌸`
            );

            return (
              <div
                key={client.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-4.5 shadow-xs hover:border-emerald-800/40 hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Tag & Brand preference */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        client.tag === 'VIP' ? 'bg-amber-50 text-amber-900 border border-amber-200/80' :
                        client.tag === 'Frequente' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/80' :
                        client.tag === 'Novo' ? 'bg-sky-50 text-sky-900 border border-sky-200/80' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {client.tag}
                      </span>
                      
                      {isToday ? (
                        <span className="bg-pink-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-md animate-pulse">
                          🎂 HOJE!
                        </span>
                      ) : isBirthday ? (
                        <span className="bg-pink-50 text-pink-900 border border-pink-200 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                          🎂 Niver este mês
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(client)}
                        className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Editar"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(client.id, client.name)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Name and avatar */}
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-emerald-100 via-slate-100 to-rose-100 border border-slate-200/70 flex items-center justify-center font-bold text-slate-900 text-base shrink-0 shadow-xs">
                      {client.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 
                        onClick={() => setSelectedClientForDetails(client)}
                        className="font-bold text-slate-900 text-sm hover:text-emerald-900 cursor-pointer truncate"
                      >
                        {client.name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        <Phone className="w-3 h-3 text-emerald-700" />
                        <span>{formatPhone(client.phone)}</span>
                      </div>
                      {client.neighborhood && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5 truncate">
                          <MapPin className="w-3 h-3" />
                          <span>{client.neighborhood}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Preferences / Notes snippet */}
                  {client.notes && (
                    <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl mt-3 line-clamp-2 border border-slate-100">
                      💬 <span className="italic">{client.notes}</span>
                    </p>
                  )}

                  {/* Financial Stats Bar */}
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Total Comprado</span>
                      <span className="font-bold text-slate-900">{formatCurrency(stats.totalSpent)}</span>
                      <span className="text-[10px] text-slate-500 block">{stats.salesCount} pedidos</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Fiado Pendente</span>
                      {stats.pendingFiado > 0 ? (
                        <span className="font-bold text-rose-800 block">
                          {formatCurrency(stats.pendingFiado)}
                        </span>
                      ) : (
                        <span className="font-semibold text-emerald-800 block">Em dia ✓</span>
                      )}
                      <span className="text-[10px] text-slate-400 block">
                        {stats.pendingFiado > 0 ? 'Aguardando' : 'Sem dívida'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center gap-2 mt-4 pt-2 border-t border-slate-100">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white py-2 rounded-xl text-xs font-semibold transition-all shadow-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp
                  </a>

                  <button
                    onClick={() => setSelectedClientForDetails(client)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    Ver Histórico
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Client Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200/60 flex items-center justify-center font-bold text-sm">
                  👤
                </div>
                <h3 className="font-bold text-base text-slate-900">
                  {clientToEdit ? 'Editar Cliente' : 'Cadastrar Nova Cliente'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mariana Silveira"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-800/15 focus:border-emerald-800 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    WhatsApp / Telefone *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 98765-4321"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-800/15 focus:border-emerald-800 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Data de Nascimento (Aniversário)
                  </label>
                  <input
                    type="date"
                    value={formBirthDate}
                    onChange={(e) => setFormBirthDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-800/15 focus:border-emerald-800 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Classificação da Cliente
                  </label>
                  <select
                    value={formTag}
                    onChange={(e) => setFormTag(e.target.value as ClientTag)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-800/15 focus:border-emerald-800 focus:outline-hidden bg-white"
                  >
                    <option value="VIP">⭐ VIP (Alto valor)</option>
                    <option value="Frequente">🌸 Frequente (Compra todo ciclo)</option>
                    <option value="Esporádico">✨ Esporádico</option>
                    <option value="Novo">🌱 Novo Cadastro</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Marca Preferida
                  </label>
                  <select
                    value={formPreferredBrand}
                    onChange={(e) => setFormPreferredBrand(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-800/15 focus:border-emerald-800 focus:outline-hidden bg-white"
                  >
                    <option value="ambas">Ambas (O Boticário & Eudora)</option>
                    <option value="boticario">O Boticário</option>
                    <option value="eudora">Eudora</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Bairro / Região
                </label>
                <input
                  type="text"
                  placeholder="Ex: Jardim Paulista, Centro..."
                  value={formNeighborhood}
                  onChange={(e) => setFormNeighborhood(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-800/15 focus:border-emerald-800 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Endereço Completo para Entregas (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Rua, número, apto/bloco..."
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-800/15 focus:border-emerald-800 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Observações de Beleza & Preferências
                </label>
                <textarea
                  rows={3}
                  placeholder="Tipo de pele, perfumes que gosta (florais, amadeirados), tom de base, alergias, restrições..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-800/15 focus:border-emerald-800 focus:outline-hidden"
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
                  {clientToEdit ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Details & History Drawer/Modal */}
      {selectedClientForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-100 to-rose-100 text-slate-900 border border-slate-200 flex items-center justify-center font-bold text-lg">
                  {selectedClientForDetails.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {selectedClientForDetails.name}
                  </h3>
                  <span className="text-xs text-slate-500">
                    Cliente desde {formatDate(selectedClientForDetails.createdAt)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedClientForDetails(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-xs">
              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">WhatsApp</span>
                  <span className="font-bold text-slate-800 block truncate">
                    {formatPhone(selectedClientForDetails.phone)}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">Aniversário</span>
                  <span className="font-bold text-slate-800 block">
                    {formatDate(selectedClientForDetails.birthDate)}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">Total Comprado</span>
                  <span className="font-bold text-emerald-900 block">
                    {formatCurrency(getClientStats(selectedClientForDetails.id).totalSpent)}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">Fiado Pendente</span>
                  <span className="font-bold text-rose-800 block">
                    {formatCurrency(getClientStats(selectedClientForDetails.id).pendingFiado)}
                  </span>
                </div>
              </div>

              {/* Preferences & Beauty Notes */}
              {selectedClientForDetails.notes && (
                <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/70">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
                    <Heart className="w-3.5 h-3.5 text-amber-700" />
                    Preferências de Beleza & Observações
                  </div>
                  <p className="text-slate-700">{selectedClientForDetails.notes}</p>
                </div>
              )}

              {/* Address */}
              {selectedClientForDetails.address && (
                <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800">Endereço de Entrega:</span>
                    <p className="text-slate-600">{selectedClientForDetails.address} - {selectedClientForDetails.neighborhood}</p>
                  </div>
                </div>
              )}

              {/* Purchase History */}
              <div>
                <h4 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-800" />
                  Histórico de Compras ({getClientStats(selectedClientForDetails.id).salesCount})
                </h4>

                {getClientStats(selectedClientForDetails.id).sales.length === 0 ? (
                  <p className="text-slate-400 py-4 text-center bg-slate-50 rounded-xl">
                    Nenhum pedido registrado para esta cliente ainda.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {getClientStats(selectedClientForDetails.id).sales.map((sale) => (
                      <div
                        key={sale.id}
                        className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-900">
                              Pedido em {formatDate(sale.date)}
                            </span>
                            <span className="text-slate-400 ml-2">({sale.cycle})</span>
                          </div>
                          <span className="font-bold text-emerald-900 text-sm">
                            {formatCurrency(sale.totalAmount)}
                          </span>
                        </div>

                        {/* Items list */}
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 space-y-1">
                          {sale.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-[11px] text-slate-700">
                              <span>
                                {item.quantity}x {item.productName} ({item.brand === 'boticario' ? 'O Boticário' : 'Eudora'})
                              </span>
                              <span className="font-semibold text-slate-900">{formatCurrency(item.subtotal)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Installments / Fiado management */}
                        {sale.paymentMethod === 'fiado' && (
                          <div className="pt-2 border-t border-slate-200">
                            <span className="font-bold text-slate-700 text-[11px] block mb-1.5">
                              Parcelas do Fiado:
                            </span>
                            <div className="space-y-1.5">
                              {sale.installments.map((inst) => (
                                <div
                                  key={inst.id}
                                  className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 text-[11px]"
                                >
                                  <div>
                                    <span className="font-semibold text-slate-800">
                                      Parcela {inst.installmentNumber}/{inst.totalInstallments}: {formatCurrency(inst.amount)}
                                    </span>
                                    <span className="text-slate-500 ml-2">
                                      Vencimento: {formatDate(inst.dueDate)}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {inst.isPaid ? (
                                      <span className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded-md font-bold text-[10px]">
                                        ✓ Paga
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => markInstallmentPaid(sale.id, inst.id, true)}
                                        className="bg-emerald-800 hover:bg-emerald-900 text-white px-2.5 py-1 rounded-md font-bold text-[10px] cursor-pointer shadow-xs"
                                      >
                                        Dar Baixa (Recebido)
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <a
                href={getWhatsAppUrl(selectedClientForDetails.phone, `Olá ${selectedClientForDetails.name}! Tudo bem? 🌸`)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                Conversar no WhatsApp
              </a>

              <button
                onClick={() => setSelectedClientForDetails(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Client Deletion */}
      <ConfirmModal
        isOpen={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Cliente"
        confirmLabel="Excluir Cliente"
        cancelLabel="Cancelar"
        variant="danger"
        icon="trash"
        message={
          clientToDelete ? (
            <p>
              Tem certeza que deseja excluir o cadastro de <strong className="text-slate-900">{clientToDelete.name}</strong>? Esta ação removerá o histórico cadastral deste cliente.
            </p>
          ) : ''
        }
      />
    </div>
  );
};
