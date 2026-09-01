'use client';

import React, { useState } from 'react';
import { Resource, DEFAULT_PERIODS } from '@/lib/types';
import { DataService } from '@/lib/dataService';
import { Lock, AlertTriangle, ShieldCheck } from 'lucide-react';

interface BlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  resources: Resource[];
  initialDate: string;
}

export function BlockModal({ isOpen, onClose, onSuccess, resources, initialDate }: BlockModalProps) {
  const [resourceId, setResourceId] = useState('all');
  const [date, setDate] = useState(initialDate);
  const [periodId, setPeriodId] = useState('all_day');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = resourceId === 'all' ? null : resources.find((r) => r.id === resourceId);
      const finalReason = reason.trim() || 'Bloqueado';

      DataService.saveBlock({
        resourceId,
        resourceName: res ? res.name : 'Todos os Recursos',
        date,
        periodId,
        reason: finalReason,
        createdBy: 'admin@pedrorizzi.edu.br',
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar bloqueio.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 font-bold w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
        >
          ✕
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-inner shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">Bloquear Horário / Recurso</h2>
            <p className="text-xs text-gray-500">Bloqueio Administrativo por Manutenção ou Evento</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Recurso Afetado *
            </label>
            <select
              value={resourceId}
              onChange={(e) => setResourceId(e.target.value)}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none"
            >
              <option value="all">⚠️ Bloquear TODOS os recursos da escola</option>
              {resources.map((res) => (
                <option key={res.id} value={res.id}>
                  {res.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Data do Bloqueio *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Período Afetado *
              </label>
              <select
                value={periodId}
                onChange={(e) => setPeriodId(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none"
              >
                <option value="all_day">🔒 Bloquear DIA INTEIRO (Todos os Períodos)</option>
                <option value="matutino">☀️ Bloquear todo o MATUTINO (Manhã)</option>
                <option value="vespertino">🌙 Bloquear todo o VESPERTINO (Tarde)</option>
                <optgroup label="Período Específico">
                  {DEFAULT_PERIODS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Justificativa do Bloqueio <span className="text-gray-400 font-normal">(Opcional)</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Pré-Conselho / Manutenção preventiva (Opcional)"
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none resize-none"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold shadow-lg shadow-amber-200 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'Aplicando...' : 'Confirmar Bloqueio'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
