'use client';

import React, { useState, useEffect } from 'react';
import { Resource, Booking, Block } from '@/lib/types';
import { DataService } from '@/lib/dataService';
import { useAuth } from '@/components/GoogleAuthProvider';
import { BlockModal } from '@/components/BlockModal';
import {
  Shield,
  Layers,
  Users,
  Lock,
  Plus,
  Trash2,
  Download,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';

export default function AdminPanelPage() {
  const { user, switchRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'resources' | 'blocks'>('resources');

  const [resources, setResources] = useState<Resource[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);

  // New Resource Form state
  const [newResName, setNewResName] = useState('');
  const [newResType, setNewResType] = useState<'room' | 'tablet' | 'equipment'>('room');
  const [newResQty, setNewResQty] = useState(1);
  const [newResDesc, setNewResDesc] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Block modal
  const [isBlockOpen, setIsBlockOpen] = useState(false);

  const fetchAdminData = () => {
    setLoading(true);
    try {
      setResources(DataService.getResources());
      setBookings(DataService.getBookings());
      setBlocks(DataService.getBlocks());
    } catch (e) {
      console.error('Error fetching admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleCreateResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResName.trim()) {
      alert('Por favor, informe o nome do recurso.');
      return;
    }

    try {
      DataService.saveResource({
        name: newResName.trim(),
        type: newResType,
        totalQuantity: newResQty || 1,
        description: newResDesc.trim(),
      });

      setNewResName('');
      setNewResDesc('');
      setNewResQty(1);
      setShowAddForm(false);
      fetchAdminData();
      alert('Recurso cadastrado com sucesso!');
    } catch (e: any) {
      console.error('Error adding resource:', e);
      alert('Erro ao salvar recurso.');
    }
  };

  const handleToggleResourceActive = (id: string, active: boolean) => {
    const res = resources.find((r) => r.id === id);
    if (res) {
      DataService.saveResource({
        ...res,
        active: !active,
      });
      fetchAdminData();
    }
  };

  const handleDeleteResource = (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este recurso?')) return;
    try {
      DataService.deleteResource(id);
      fetchAdminData();
    } catch (e) {
      console.error('Error deleting resource:', e);
    }
  };

  const handleDeleteBlock = (id: string) => {
    try {
      DataService.deleteBlock(id);
      fetchAdminData();
    } catch (e) {
      console.error('Error deleting block:', e);
    }
  };

  const exportCSV = () => {
    const headers = ['ID', 'Data', 'Recurso', 'Professor', 'Email', 'Turma', 'Quantidade', 'Justificativa', 'Status'];
    const rows = bookings.map((b) => [
      b.id,
      b.date,
      `"${b.resourceName}"`,
      `"${b.professorName}"`,
      b.professorEmail,
      `"${b.turma}"`,
      b.quantity,
      `"${b.justification.replace(/"/g, '""')}"`,
      b.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio-agendamentos-cepr-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (user?.role !== 'admin') {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-lg mx-auto my-12 font-sans">
        <Shield className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Acesso Restrito ao Painel Administrativo</h2>
        <p className="text-xs text-slate-500 mt-2 mb-6">
          Você está logado atualmente com o perfil de <strong>Professor</strong>. Para acessar o painel de gestão de recursos e bloqueios, altere seu perfil abaixo.
        </p>
        <button
          onClick={() => switchRole('admin')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-200 text-sm"
        >
          Alternar para Perfil Administrador
        </button>
      </div>
    );
  }

  const activeBookingsCount = bookings.filter((b) => b.status === 'active').length;

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" />
            <span>Administração Escolar</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Painel Administrativo CEPR</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gerencie recursos tecnológicos, bloqueios de manutenção e relatórios da escola.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Relatório CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
            <span>Total de Recursos</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">{resources.length}</p>
          <span className="text-[11px] text-emerald-600 font-bold block mt-1">
            {resources.filter((r) => r.active).length} ativos
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
            <span>Reservas Ativas</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-emerald-600 mt-2">{activeBookingsCount}</p>
          <span className="text-[11px] text-slate-500 block mt-1">Total acumulado: {bookings.length}</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
            <span>Bloqueios Ativos</span>
            <Lock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-3xl font-black text-amber-600 mt-2">{blocks.length}</p>
          <span className="text-[11px] text-amber-700 font-bold block mt-1">Manutenções / Pré-Conselho</span>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('resources')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
            activeTab === 'resources'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Gerenciar Recursos ({resources.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('blocks')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
            activeTab === 'blocks'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Bloqueios de Manutenção ({blocks.length})</span>
        </button>
      </div>

      {/* TAB 1: RESOURCES CRUD */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900">Lista de Recursos Cadastrados</h3>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddForm ? 'Cancelar' : 'Novo Recurso'}</span>
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleCreateResource} className="bg-indigo-50/60 rounded-2xl p-5 border border-indigo-100 space-y-4">
              <h4 className="text-sm font-extrabold text-indigo-950">Cadastrar Novo Recurso Escolar</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Recurso *</label>
                  <input
                    type="text"
                    required
                    value={newResName}
                    onChange={(e) => setNewResName(e.target.value)}
                    placeholder="Ex: TV Lousa Digital"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Recurso *</label>
                  <select
                    value={newResType}
                    onChange={(e: any) => setNewResType(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                  >
                    <option value="room">Espaço / Sala / Lab</option>
                    <option value="tablet">Carrinho de Tablets / Chromebooks</option>
                    <option value="equipment">Projetor / Kit de Som / Lousa Digital</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quantidade Total *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newResQty}
                    onChange={(e) => setNewResQty(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descrição</label>
                <input
                  type="text"
                  value={newResDesc}
                  onChange={(e) => setNewResDesc(e.target.value)}
                  placeholder="Ex: TV Lousa Digital interativa."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium outline-none"
                />
              </div>

              <button
                type="submit"
                className="bg-indigo-600 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-md hover:bg-indigo-700 transition-all"
              >
                Salvar Recurso
              </button>
            </form>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                  <th className="p-4">Recurso</th>
                  <th className="p-4">Tipo</th>
                  <th className="p-4">Quantidade</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {resources.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4 font-bold text-slate-900">
                      {res.name}
                      {res.description && (
                        <span className="block text-[11px] font-normal text-slate-500 mt-0.5">{res.description}</span>
                      )}
                    </td>
                    <td className="p-4 capitalize text-slate-600 font-semibold">{res.type}</td>
                    <td className="p-4 font-extrabold text-indigo-700">{res.totalQuantity} un.</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleResourceActive(res.id, res.active)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          res.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {res.active ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDeleteResource(res.id)}
                        className="text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-colors"
                        title="Excluir recurso"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: BLOCKS */}
      {activeTab === 'blocks' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900">Bloqueios de Horários e Manutenção</h3>
            <button
              onClick={() => setIsBlockOpen(true)}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
            >
              <Lock className="w-4 h-4" />
              <span>Novo Bloqueio</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                  <th className="p-4">Data</th>
                  <th className="p-4">Recurso</th>
                  <th className="p-4">Período</th>
                  <th className="p-4">Justificativa</th>
                  <th className="p-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {blocks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                      Nenhum bloqueio ativo no momento.
                    </td>
                  </tr>
                ) : (
                  blocks.map((b) => (
                    <tr key={b.id}>
                      <td className="p-4 font-bold text-slate-900">{b.date}</td>
                      <td className="p-4 font-bold text-indigo-700">{b.resourceName}</td>
                      <td className="p-4 text-slate-600 font-semibold">{b.periodId === 'all_day' ? 'Dia Inteiro' : b.periodId}</td>
                      <td className="p-4 text-slate-600 italic">"{b.reason}"</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteBlock(b.id)}
                          className="text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-colors"
                          title="Remover bloqueio"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Block Modal */}
      <BlockModal
        isOpen={isBlockOpen}
        onClose={() => setIsBlockOpen(false)}
        onSuccess={fetchAdminData}
        resources={resources}
        initialDate={format(new Date(), 'yyyy-MM-dd')}
      />
    </div>
  );
}
