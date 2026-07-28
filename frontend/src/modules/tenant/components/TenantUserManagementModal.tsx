import React, { useState } from 'react';
import { X, Building2, UserPlus, Users, Key, Plus, CheckCircle2, Shield, Edit, Trash2 } from 'lucide-react';
import type { LawFirmTenant } from './Header';
import { ActionConfirmationModal } from './ActionConfirmationModal';

export interface FirmUser {
  id: string;
  firmId: string;
  fullName: string;
  email: string;
  role: 'SUPER_ADMIN' | 'FIRM_ADMIN' | 'LAWYER';
  status: 'active' | 'pending';
  createdAt: string;
}

interface TenantUserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  firms: LawFirmTenant[];
  activeFirm: LawFirmTenant;
  onSelectFirm: (firm: LawFirmTenant) => void;
  onCreateFirm: (newFirm: LawFirmTenant) => void;
  onUpdateFirm: (updatedFirm: LawFirmTenant) => void;
  onDeleteFirm: (firmId: string) => void;
}

export const TenantUserManagementModal: React.FC<TenantUserManagementModalProps> = ({
  isOpen,
  onClose,
  firms,
  activeFirm,
  onSelectFirm,
  onCreateFirm,
  onUpdateFirm,
  onDeleteFirm
}) => {
  const [activeTab, setActiveTab] = useState<'firms' | 'users' | 'login'>('firms');

  // New Firm Form State
  const [isCreatingFirm, setIsCreatingFirm] = useState(false);
  const [newFirmName, setNewFirmName] = useState('');
  const [newFirmNit, setNewFirmNit] = useState('');
  const [newFirmBalance, setNewFirmBalance] = useState<number>(500000);

  // Edit Firm Form State
  const [editingFirm, setEditingFirm] = useState<LawFirmTenant | null>(null);
  const [editFirmName, setEditFirmName] = useState('');
  const [editFirmNit, setEditFirmNit] = useState('');
  const [editFirmBalance, setEditFirmBalance] = useState<number>(500000);

  // Confirmation Warning Modal State
  const [confirmModalData, setConfirmModalData] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    variant: 'danger' | 'primary' | 'success';
    onConfirmAction: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    variant: 'danger',
    onConfirmAction: () => {}
  });

  // Users State
  const [usersList, setUsersList] = useState<FirmUser[]>(() => {
    try {
      const stored = localStorage.getItem('iureon_firm_users');
      return stored ? JSON.parse(stored) : [
        {
          id: 'super-user-001',
          firmId: activeFirm.id,
          fullName: 'Ing. Daniel Ma. (SuperUsuario Global)',
          email: 'ingdanielma@gmail.com',
          role: 'SUPER_ADMIN',
          status: 'active',
          createdAt: new Date().toLocaleDateString('es-CO')
        }
      ];
    } catch {
      return [];
    }
  });

  // New User Form State
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'FIRM_ADMIN' | 'LAWYER'>('LAWYER');
  const [newUserFirmId, setNewUserFirmId] = useState(activeFirm.id);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('ingdanielma@gmail.com');
  const [loginPassword, setLoginPassword] = useState('Dma1102811692@');
  const [loginSuccessMsg, setLoginSuccessMsg] = useState('');

  if (!isOpen) return null;

  const requestCreateFirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirmName.trim() || !newFirmNit.trim()) return;

    setConfirmModalData({
      isOpen: true,
      title: '⚠️ ¿Registrar Nueva Firma Cliente?',
      message: `Se creará la firma "${newFirmName.trim()}" con NIT ${newFirmNit.trim()} y un Saldo Inicial de $${newFirmBalance.toLocaleString('es-CO')} COP.`,
      confirmText: 'Registrar Firma',
      variant: 'primary',
      onConfirmAction: () => {
        const created: LawFirmTenant = {
          id: `firm-${Date.now()}`,
          name: newFirmName.trim(),
          nit: newFirmNit.trim(),
          creditsBalance: newFirmBalance,
          status: 'active'
        };
        onCreateFirm(created);
        setIsCreatingFirm(false);
        setNewFirmName('');
        setNewFirmNit('');
        setConfirmModalData((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  const startEditFirm = (f: LawFirmTenant) => {
    setEditingFirm(f);
    setEditFirmName(f.name);
    setEditFirmNit(f.nit);
    setEditFirmBalance(f.creditsBalance || 500000);
  };

  const requestEditFirmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFirm || !editFirmName.trim()) return;

    setConfirmModalData({
      isOpen: true,
      title: '⚠️ ¿Guardar Cambios en la Firma?',
      message: `Se actualizarán los datos de la firma "${editFirmName.trim()}" (NIT: ${editFirmNit.trim()}) y Saldo de $${editFirmBalance.toLocaleString('es-CO')} COP.`,
      confirmText: 'Guardar Cambios',
      variant: 'primary',
      onConfirmAction: () => {
        onUpdateFirm({
          ...editingFirm,
          name: editFirmName.trim(),
          nit: editFirmNit.trim(),
          creditsBalance: editFirmBalance
        });
        setEditingFirm(null);
        setConfirmModalData((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  const requestDeleteFirm = (f: LawFirmTenant) => {
    setConfirmModalData({
      isOpen: true,
      title: '🚨 ¿Eliminar Firma Cliente?',
      message: `¿Está seguro de que desea eliminar la firma "${f.name}"? Se revocarán los accesos de todos los usuarios vinculados. Esta acción es irreversible.`,
      confirmText: 'Sí, Eliminar Firma',
      variant: 'danger',
      onConfirmAction: () => {
        onDeleteFirm(f.id);
        setConfirmModalData((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  const requestCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    setConfirmModalData({
      isOpen: true,
      title: '⚠️ ¿Crear Cuenta de Usuario Abogado?',
      message: `Se otorgarán credenciales de acceso para "${newUserName.trim()}" (${newUserEmail.trim()}).`,
      confirmText: 'Crear Usuario',
      variant: 'success',
      onConfirmAction: () => {
        const newUser: FirmUser = {
          id: `user-${Date.now()}`,
          firmId: newUserFirmId,
          fullName: newUserName.trim(),
          email: newUserEmail.trim(),
          role: newUserRole,
          status: 'active',
          createdAt: new Date().toLocaleDateString('es-CO')
        };
        const updated = [newUser, ...usersList];
        setUsersList(updated);
        try {
          localStorage.setItem('iureon_firm_users', JSON.stringify(updated));
        } catch (err) {
          console.warn('LocalStorage save user fail:', err);
        }
        setIsCreatingUser(false);
        setNewUserName('');
        setNewUserEmail('');
        setConfirmModalData((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) return;

    if (loginEmail.trim() === 'ingdanielma@gmail.com' && loginPassword === 'Dma1102811692@') {
      setLoginSuccessMsg('👑 Sesión de SuperUsuario Global autenticada exitosamente para Ing. Daniel Ma.');
    } else {
      setLoginSuccessMsg(`✅ Sesión iniciada correctamente para: ${loginEmail}`);
    }

    setTimeout(() => {
      setLoginSuccessMsg('');
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-900 border border-blue-800 flex items-center justify-center text-white">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Gestión de Usuarios, Autenticación y Firmas Cliente</h3>
              <p className="text-[11px] text-slate-300">Administra tus firmas jurídicas, recarga saldos e invita usuarios abogados</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 pt-2 text-xs">
          <button
            onClick={() => setActiveTab('firms')}
            className={`px-4 py-2.5 font-semibold rounded-t-xl transition-all flex items-center gap-2 ${
              activeTab === 'firms' ? 'bg-white text-blue-950 border-t-2 border-t-blue-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4 text-blue-900" />
            <span>Firmas Cliente ({firms.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 font-semibold rounded-t-xl transition-all flex items-center gap-2 ${
              activeTab === 'users' ? 'bg-white text-blue-950 border-t-2 border-t-blue-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4 text-blue-900" />
            <span>Abogados &amp; Usuarios ({usersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('login')}
            className={`px-4 py-2.5 font-semibold rounded-t-xl transition-all flex items-center gap-2 ${
              activeTab === 'login' ? 'bg-white text-blue-950 border-t-2 border-t-blue-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Key className="w-4 h-4 text-blue-900" />
            <span>Iniciar Sesión / Autenticación</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* TAB 1: FIRMS MANAGEMENT */}
          {activeTab === 'firms' && (
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
          )}

          {/* TAB 2: USERS & LAWYERS MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Abogados &amp; Usuarios Registrados</h4>
                  <p className="text-slate-500 text-[11px]">Crea cuentas de acceso para los abogados de tu despacho.</p>
                </div>
                <button
                  onClick={() => setIsCreatingUser(!isCreatingUser)}
                  className="px-3.5 py-2 bg-blue-950 hover:bg-blue-900 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isCreatingUser ? 'Cancelar' : 'Crear Usuario Abogado'}</span>
                </button>
              </div>

                  {/* Form to Create New User */}
                  {isCreatingUser && (
                    <form onSubmit={requestCreateUserSubmit} className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 space-y-3">
                      <h5 className="font-bold text-blue-950 text-xs">Crear Cuenta de Usuario Abogado</h5>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-700 block mb-1">Nombre del Abogado:</label>
                          <input
                            type="text"
                            value={newUserName}
                            onChange={(e) => setNewUserName(e.target.value)}
                            placeholder="Nombre completo del usuario..."
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-blue-900"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-700 block mb-1">Correo Electrónico:</label>
                          <input
                            type="email"
                            value={newUserEmail}
                            onChange={(e) => setNewUserEmail(e.target.value)}
                            placeholder="correo@tufirma.co"
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono focus:outline-none focus:border-blue-900"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-700 block mb-1">Rol Procesal:</label>
                          <select
                            value={newUserRole}
                            onChange={(e) => setNewUserRole(e.target.value as any)}
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-blue-900"
                          >
                            <option value="LAWYER">Abogado Litigante</option>
                            <option value="FIRM_ADMIN">Socio Administrador</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-700 block mb-1">Asignar a Firma:</label>
                          <select
                            value={newUserFirmId}
                            onChange={(e) => setNewUserFirmId(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-blue-900"
                          >
                            {firms.map((f) => (
                              <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg text-xs"
                        >
                          Guardar y Crear Acceso
                        </button>
                      </div>
                    </form>
                  )}

              {/* Users List Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Nombre del Abogado</th>
                      <th className="p-3">Correo Notificaciones</th>
                      <th className="p-3">Rol</th>
                      <th className="p-3">Fecha Alta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="p-3 font-semibold text-slate-900 flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-900 shrink-0" />
                          <span>{u.fullName}</span>
                        </td>
                        <td className="p-3 font-mono text-slate-600">{u.email}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-bold text-[10px] rounded uppercase">
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500">{u.createdAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: AUTH LOGIN */}
          {activeTab === 'login' && (
            <div className="max-w-md mx-auto space-y-4 py-4">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 bg-blue-50 text-blue-950 rounded-2xl flex items-center justify-center mx-auto border border-blue-200">
                  <Key className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-base">Iniciar Sesión de Usuario Abogado</h4>
                <p className="text-slate-500 text-xs">Ingresa tus credenciales corporativas para acceder a tu firma.</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Correo Electrónico:</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="abogado@tufirma.co"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-900"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Contraseña de Acceso:</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-900"
                    required
                  />
                </div>

                {loginSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{loginSuccessMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-950 hover:bg-blue-900 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
                >
                  Ingresar a la Plataforma
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Warning Modal */}
      <ActionConfirmationModal
        isOpen={confirmModalData.isOpen}
        title={confirmModalData.title}
        message={confirmModalData.message}
        confirmText={confirmModalData.confirmText}
        confirmVariant={confirmModalData.variant}
        onConfirm={confirmModalData.onConfirmAction}
        onCancel={() => setConfirmModalData((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
