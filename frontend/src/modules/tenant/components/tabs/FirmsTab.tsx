import React, { useState } from 'react';
import { Building2, Plus, Edit, Trash2 } from 'lucide-react';
import type { LawFirmTenant } from '../Header';
import type { ConfirmationRequest } from '../../hooks/useActionConfirmation';

const DEFAULT_BALANCE_COP = 500000;

interface FirmsTabProps {
  firms: LawFirmTenant[];
  activeFirm: LawFirmTenant;
  onSelectFirm: (firm: LawFirmTenant) => void;
  onCreateFirm: (firm: LawFirmTenant) => void;
  onUpdateFirm: (firm: LawFirmTenant) => void;
  onDeleteFirm: (firmId: string) => void;
  confirm: (request: ConfirmationRequest) => void;
}

/**
 * Client firm directory: switch the active tenant, register a new firm, edit
 * its fiscal data and balance, or revoke it. Every write is gated by the
 * shared confirmation modal.
 */
export const FirmsTab: React.FC<FirmsTabProps> = ({
  firms,
  activeFirm,
  onSelectFirm,
  onCreateFirm,
  onUpdateFirm,
  onDeleteFirm,
  confirm
}) => {
  const [isCreatingFirm, setIsCreatingFirm] = useState(false);
  const [newFirmName, setNewFirmName] = useState('');
  const [newFirmNit, setNewFirmNit] = useState('');
  const [newFirmBalance, setNewFirmBalance] = useState<number>(DEFAULT_BALANCE_COP);

  const [editingFirm, setEditingFirm] = useState<LawFirmTenant | null>(null);
  const [editFirmName, setEditFirmName] = useState('');
  const [editFirmNit, setEditFirmNit] = useState('');
  const [editFirmBalance, setEditFirmBalance] = useState<number>(DEFAULT_BALANCE_COP);

  const requestCreateFirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirmName.trim() || !newFirmNit.trim()) return;

    confirm({
      title: '⚠️ ¿Registrar Nueva Firma Cliente?',
      message: `Se creará la firma "${newFirmName.trim()}" con NIT ${newFirmNit.trim()} y un Saldo Inicial de $${newFirmBalance.toLocaleString('es-CO')} COP.`,
      confirmText: 'Registrar Firma',
      variant: 'primary',
      onConfirm: () => {
        onCreateFirm({
          id: `firm-${Date.now()}`,
          name: newFirmName.trim(),
          nit: newFirmNit.trim(),
          creditsBalance: newFirmBalance,
          status: 'active'
        });
        setIsCreatingFirm(false);
        setNewFirmName('');
        setNewFirmNit('');
      }
    });
  };

  const startEditFirm = (f: LawFirmTenant) => {
    setEditingFirm(f);
    setEditFirmName(f.name);
    setEditFirmNit(f.nit);
    setEditFirmBalance(f.creditsBalance || DEFAULT_BALANCE_COP);
  };

  const requestEditFirmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFirm || !editFirmName.trim()) return;

    confirm({
      title: '⚠️ ¿Guardar Cambios en la Firma?',
      message: `Se actualizarán los datos de la firma "${editFirmName.trim()}" (NIT: ${editFirmNit.trim()}) y Saldo de $${editFirmBalance.toLocaleString('es-CO')} COP.`,
      confirmText: 'Guardar Cambios',
      variant: 'primary',
      onConfirm: () => {
        onUpdateFirm({
          ...editingFirm,
          name: editFirmName.trim(),
          nit: editFirmNit.trim(),
          creditsBalance: editFirmBalance
        });
        setEditingFirm(null);
      }
    });
  };

  const requestDeleteFirm = (f: LawFirmTenant) => {
    confirm({
      title: '🚨 ¿Eliminar Firma Cliente?',
      message: `¿Está seguro de que desea eliminar la firma "${f.name}"? Se revocarán los accesos de todos los usuarios vinculados. Esta acción es irreversible.`,
      confirmText: 'Sí, Eliminar Firma',
      variant: 'danger',
      onConfirm: () => onDeleteFirm(f.id)
    });
  };

  return (
<div className="space-y-4">
  <div className="flex items-center justify-between">
    <div>
      <h4 className="font-bold text-slate-900 text-sm">Directorio de Firmas Cliente Registradas</h4>
      <p className="text-slate-500 text-[11px]">Selecciona la firma activa o registra un nuevo despacho cliente.</p>
    </div>
    <button
      onClick={() => setIsCreatingFirm(!isCreatingFirm)}
      className="px-3.5 py-2 bg-blue-950 hover:bg-blue-900 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs"
    >
      <Plus className="w-4 h-4" />
      <span>{isCreatingFirm ? 'Cancelar' : 'Registrar Nueva Firma'}</span>
    </button>
  </div>

  {/* Form to Create New Firm */}
  {isCreatingFirm && (
    <form onSubmit={requestCreateFirm} className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 space-y-3">
      <h5 className="font-bold text-blue-950 text-xs">Registrar Firma Cliente</h5>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-[11px] font-semibold text-slate-700 block mb-1">Nombre Oficial de la Firma:</label>
          <input
            type="text"
            value={newFirmName}
            onChange={(e) => setNewFirmName(e.target.value)}
            placeholder="Nombre oficial de la firma..."
            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-blue-900"
            required
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-700 block mb-1">NIT / Identificación Fiscal:</label>
          <input
            type="text"
            value={newFirmNit}
            onChange={(e) => setNewFirmNit(e.target.value)}
            placeholder="Ingrese NIT o identificación fiscal..."
            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono focus:outline-none focus:border-blue-900"
            required
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-700 block mb-1">Saldo Inicial (COP $):</label>
          <input
            type="number"
            value={newFirmBalance}
            onChange={(e) => setNewFirmBalance(parseFloat(e.target.value) || 0)}
            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono focus:outline-none focus:border-blue-900"
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="submit"
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg text-xs"
        >
          Guardar Firma
        </button>
      </div>
    </form>
  )}

  {/* Form to Edit Firm */}
  {editingFirm && (
    <form onSubmit={requestEditFirmSubmit} className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h5 className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
          <Edit className="w-3.5 h-3.5 text-amber-800" />
          <span>Editar Firma Cliente: {editingFirm.name}</span>
        </h5>
        <button
          type="button"
          onClick={() => setEditingFirm(null)}
          className="text-amber-800 hover:text-amber-950 text-[11px] font-semibold"
        >
          Cancelar Edición
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-[11px] font-semibold text-slate-700 block mb-1">Nombre Oficial:</label>
          <input
            type="text"
            value={editFirmName}
            onChange={(e) => setEditFirmName(e.target.value)}
            className="w-full bg-white border border-amber-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-amber-700"
            required
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-700 block mb-1">NIT Fiscal:</label>
          <input
            type="text"
            value={editFirmNit}
            onChange={(e) => setEditFirmNit(e.target.value)}
            className="w-full bg-white border border-amber-300 rounded-lg p-2 text-slate-900 font-mono focus:outline-none focus:border-amber-700"
            required
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-700 block mb-1">Saldo en Cuenta (COP $):</label>
          <input
            type="number"
            value={editFirmBalance}
            onChange={(e) => setEditFirmBalance(parseFloat(e.target.value) || 0)}
            className="w-full bg-white border border-amber-300 rounded-lg p-2 text-slate-900 font-mono focus:outline-none focus:border-amber-700"
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="submit"
          className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white font-semibold rounded-lg text-xs"
        >
          Actualizar Datos de Firma
        </button>
      </div>
    </form>
  )}

  {/* Firms List Table */}
  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
    <table className="w-full text-left border-collapse text-xs">
      <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
        <tr>
          <th className="p-3">Firma Cliente</th>
          <th className="p-3">NIT Fiscal</th>
          <th className="p-3">Saldo de Recargas</th>
          <th className="p-3">Estado</th>
          <th className="p-3 text-right">Acción</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-200 bg-white">
        {firms.map((f) => {
          const isActive = f.id === activeFirm.id;
          return (
            <tr key={f.id} className={isActive ? 'bg-blue-50/40' : 'hover:bg-slate-50'}>
              <td className="p-3 font-semibold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-900 shrink-0" />
                <span>{f.name}</span>
                {isActive && (
                  <span className="px-2 py-0.5 bg-blue-900 text-white text-[10px] font-bold rounded-full">
                    Activa Ahora
                  </span>
                )}
              </td>
              <td className="p-3 font-mono text-slate-600">{f.nit}</td>
              <td className="p-3 font-mono font-bold text-slate-900">
                ${(f.creditsBalance || 500000).toLocaleString('es-CO')} COP
              </td>
              <td className="p-3">
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded">
                  Activa
                </span>
              </td>
              <td className="p-3 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  {!isActive && (
                    <button
                      onClick={() => onSelectFirm(f)}
                      className="px-2.5 py-1 bg-blue-950 hover:bg-blue-900 text-white rounded-lg font-semibold text-[11px] transition-colors"
                    >
                      Conmutar
                    </button>
                  )}
                  <button
                    onClick={() => startEditFirm(f)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-medium flex items-center gap-1"
                    title="Editar Datos y Saldo"
                  >
                    <Edit className="w-3 h-3 text-slate-500" />
                    <span>Editar</span>
                  </button>
                  {firms.length > 1 && (
                    <button
                      onClick={() => requestDeleteFirm(f)}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-medium flex items-center gap-1"
                      title="Eliminar Firma Cliente"
                    >
                      <Trash2 className="w-3 h-3 text-rose-600" />
                      <span>Eliminar</span>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
</div>
  );
};
