import React, { useState } from 'react';
import { UserPlus, Edit, Trash2, AlertTriangle, User, Users } from 'lucide-react';
import type { LawFirmTenant } from '../Header';
import type { FirmUser, FirmUserRole } from '../../types';
import { NO_FIRM, resolveFirmId, roleRequiresFirm } from '../../types';
import type { ConfirmationRequest } from '../../hooks/useActionConfirmation';

interface UsersTabProps {
  firms: LawFirmTenant[];
  usersList: FirmUser[];
  onAddUser: (user: FirmUser) => void;
  onUpdateUser: (id: string, changes: Partial<FirmUser>) => void;
  onRemoveUser: (id: string) => void;
  confirm: (request: ConfirmationRequest) => void;
}

/**
 * Lawyer account directory. Roles decide tenancy: firm lawyers need a client
 * firm to exist, independents and the global super admin do not.
 */
export const UsersTab: React.FC<UsersTabProps> = ({
  firms,
  usersList,
  onAddUser,
  onUpdateUser,
  onRemoveUser,
  confirm
}) => {
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<FirmUserRole>('LAWYER');
  const [newUserFirmId, setNewUserFirmId] = useState(firms[0]?.id || NO_FIRM.SUPER_ADMIN);

  const [editingUser, setEditingUser] = useState<FirmUser | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserRole, setEditUserRole] = useState<FirmUserRole>('LAWYER');
  const [editUserFirmId, setEditUserFirmId] = useState('');

  const requestCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    if (firms.length === 0 && roleRequiresFirm(newUserRole)) {
      alert('⚠️ Para crear cuentas de usuarios vinculados a firma debes registrar al menos una Firma Cliente primero. O puedes registrar al usuario como Abogado Particular.');
      return;
    }

    const assignedFirmId = resolveFirmId(newUserRole, newUserFirmId || firms[0]?.id || NO_FIRM.SUPER_ADMIN);

    confirm({
      title: '⚠️ ¿Crear Cuenta de Usuario Abogado?',
      message: `Se otorgarán credenciales de acceso para "${newUserName.trim()}" (${newUserEmail.trim()}).`,
      confirmText: 'Crear Usuario',
      variant: 'success',
      onConfirm: () => {
        onAddUser({
          id: `user-${Date.now()}`,
          firmId: assignedFirmId,
          fullName: newUserName.trim(),
          email: newUserEmail.trim(),
          role: newUserRole,
          status: 'active',
          createdAt: new Date().toLocaleDateString('es-CO')
        });
        setIsCreatingUser(false);
        setNewUserName('');
        setNewUserEmail('');
      }
    });
  };

  const startEditUser = (u: FirmUser) => {
    setEditingUser(u);
    setEditUserName(u.fullName);
    setEditUserEmail(u.email);
    setEditUserRole(u.role);
    setEditUserFirmId(u.firmId);
  };

  const requestEditUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editUserName.trim() || !editUserEmail.trim()) return;

    const assignedFirmId = resolveFirmId(editUserRole, editUserFirmId);

    confirm({
      title: '⚠️ ¿Guardar Cambios en la Cuenta de Usuario?',
      message: `Se actualizarán los datos de acceso del usuario "${editUserName.trim()}" (${editUserEmail.trim()}).`,
      confirmText: 'Guardar Cambios',
      variant: 'primary',
      onConfirm: () => {
        onUpdateUser(editingUser.id, {
          fullName: editUserName.trim(),
          email: editUserEmail.trim(),
          role: editUserRole,
          firmId: assignedFirmId
        });
        setEditingUser(null);
      }
    });
  };

  const requestDeleteUser = (u: FirmUser) => {
    confirm({
      title: '🚨 ¿Eliminar Cuenta de Usuario Abogado?',
      message: `¿Está seguro de que desea eliminar a "${u.fullName}" (${u.email})? Se revocarán de inmediato sus credenciales de acceso. Esta acción es irreversible.`,
      confirmText: 'Sí, Eliminar Usuario',
      variant: 'danger',
      onConfirm: () => onRemoveUser(u.id)
    });
  };

  return (
<div className="space-y-4">
  <div className="flex items-center justify-between">
    <div>
      <h4 className="font-bold text-slate-900 text-sm">Abogados &amp; Usuarios Registrados</h4>
      <p className="text-slate-500 text-[11px]">Crea y gestiona cuentas de acceso para abogados de firma o independientes particulares.</p>
    </div>
    <button
      onClick={() => setIsCreatingUser(!isCreatingUser)}
      className="px-3.5 py-2 bg-blue-950 hover:bg-blue-900 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs"
    >
      <UserPlus className="w-4 h-4" />
      <span>{isCreatingUser ? 'Cancelar' : 'Crear Usuario Abogado'}</span>
    </button>
  </div>

  {/* Notice if no firms exist */}
  {firms.length === 0 && (
    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-semibold flex items-center gap-2">
      <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0" />
      <span>ℹ️ No hay firmas cliente registradas. Puedes registrar un <b>Abogado Particular (Sin Firma)</b> o crear una firma primero en la pestaña "Firmas Cliente".</span>
    </div>
  )}

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
            placeholder="Ej. Dr. Andrés Felipe Osorio"
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
            placeholder="abogado@firma.co"
            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono focus:outline-none focus:border-blue-900"
            required
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-700 block mb-1">Rol Procesal:</label>
          <select
            value={newUserRole}
            onChange={(e) => {
              const val = e.target.value as any;
              setNewUserRole(val);
              if (val === 'SUPER_ADMIN') setNewUserFirmId('N/A');
              if (val === 'INDEPENDENT_LAWYER') setNewUserFirmId('INDEPENDENT');
            }}
            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-blue-900"
          >
            <option value="LAWYER">Abogado Litigante de Firma</option>
            <option value="FIRM_ADMIN">Socio Administrador de Firma</option>
            <option value="INDEPENDENT_LAWYER">Abogado Independiente / Particular (Sin Firma)</option>
            <option value="SUPER_ADMIN">SuperUsuario Global</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-700 block mb-1">Asignar a Firma:</label>
          {newUserRole === 'SUPER_ADMIN' ? (
            <div className="w-full bg-purple-50 border border-purple-200 rounded-lg p-2 text-purple-900 font-bold text-xs">
              👑 N/A (SuperUsuario)
            </div>
          ) : newUserRole === 'INDEPENDENT_LAWYER' ? (
            <div className="w-full bg-teal-50 border border-teal-200 rounded-lg p-2 text-teal-900 font-bold text-xs flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-teal-700" />
              <span>👤 Sin Firma (Abogado Particular)</span>
            </div>
          ) : (
            <select
              value={newUserFirmId}
              onChange={(e) => setNewUserFirmId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-blue-900"
            >
              {firms.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          )}
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

  {/* Form to Edit Existing User */}
  {editingUser && (
    <form onSubmit={requestEditUserSubmit} className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h5 className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
          <Edit className="w-3.5 h-3.5 text-amber-800" />
          <span>Editar Cuenta de Usuario: {editingUser.fullName}</span>
        </h5>
        <button
          type="button"
          onClick={() => setEditingUser(null)}
          className="text-amber-800 hover:text-amber-950 text-[11px] font-semibold"
        >
          Cancelar Edición
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="text-[11px] font-semibold text-slate-700 block mb-1">Nombre Completo:</label>
          <input
            type="text"
            value={editUserName}
            onChange={(e) => setEditUserName(e.target.value)}
            className="w-full bg-white border border-amber-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-amber-700"
            required
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-700 block mb-1">Correo Electrónico:</label>
          <input
            type="email"
            value={editUserEmail}
            onChange={(e) => setEditUserEmail(e.target.value)}
            className="w-full bg-white border border-amber-300 rounded-lg p-2 text-slate-900 font-mono focus:outline-none focus:border-amber-700"
            required
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-700 block mb-1">Rol Procesal:</label>
          <select
            value={editUserRole}
            onChange={(e) => {
              const val = e.target.value as any;
              setEditUserRole(val);
              if (val === 'SUPER_ADMIN') setEditUserFirmId('N/A');
              if (val === 'INDEPENDENT_LAWYER') setEditUserFirmId('INDEPENDENT');
            }}
            className="w-full bg-white border border-amber-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-amber-700"
          >
            <option value="LAWYER">Abogado Litigante de Firma</option>
            <option value="FIRM_ADMIN">Socio Administrador de Firma</option>
            <option value="INDEPENDENT_LAWYER">Abogado Independiente / Particular (Sin Firma)</option>
            <option value="SUPER_ADMIN">SuperUsuario Global</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-700 block mb-1">Firma Asignada:</label>
          {editUserRole === 'SUPER_ADMIN' ? (
            <div className="w-full bg-purple-50 border border-purple-200 rounded-lg p-2 text-purple-900 font-bold text-xs">
              👑 N/A (SuperUsuario)
            </div>
          ) : editUserRole === 'INDEPENDENT_LAWYER' ? (
            <div className="w-full bg-teal-50 border border-teal-200 rounded-lg p-2 text-teal-900 font-bold text-xs flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-teal-700" />
              <span>👤 Sin Firma (Abogado Particular)</span>
            </div>
          ) : (
            <select
              value={editUserFirmId}
              onChange={(e) => setEditUserFirmId(e.target.value)}
              className="w-full bg-white border border-amber-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-amber-700"
            >
              {firms.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="submit"
          className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white font-semibold rounded-lg text-xs"
        >
          Actualizar Usuario
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
          <th className="p-3">Firma Asignada</th>
          <th className="p-3">Fecha Alta</th>
          <th className="p-3 text-right">Acción</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-200 bg-white">
        {usersList.map((u) => {
          const isSuperUser = u.role === 'SUPER_ADMIN' || u.firmId === 'N/A';
          const isParticular = u.role === 'INDEPENDENT_LAWYER' || u.firmId === 'INDEPENDENT';
          const assignedFirm = firms.find((f) => f.id === u.firmId);

          return (
            <tr key={u.id} className="hover:bg-slate-50">
              <td className="p-3 font-semibold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-900 shrink-0" />
                <span>{u.fullName}</span>
              </td>
              <td className="p-3 font-mono text-slate-600">{u.email}</td>
              <td className="p-3">
                <span
                  className={`px-2 py-0.5 font-bold text-[10px] rounded uppercase ${
                    isSuperUser
                      ? 'bg-purple-100 text-purple-900'
                      : isParticular
                      ? 'bg-teal-100 text-teal-900'
                      : u.role === 'FIRM_ADMIN'
                      ? 'bg-indigo-100 text-indigo-900'
                      : 'bg-blue-100 text-blue-900'
                  }`}
                >
                  {u.role === 'INDEPENDENT_LAWYER' ? 'PARTICULAR' : u.role}
                </span>
              </td>
              <td className="p-3 font-medium text-slate-700">
                {isSuperUser ? (
                  <span className="px-2 py-0.5 bg-purple-50 text-purple-900 font-bold text-[10px] rounded border border-purple-200">
                    👑 N/A (SuperUsuario)
                  </span>
                ) : isParticular ? (
                  <span className="px-2 py-0.5 bg-teal-50 text-teal-900 font-bold text-[10px] rounded border border-teal-200 flex items-center gap-1 inline-flex">
                    <User className="w-3 h-3 text-teal-700" />
                    <span>Sin Firma (Abogado Particular)</span>
                  </span>
                ) : (
                  <span>{assignedFirm?.name || 'Firma no encontrada'}</span>
                )}
              </td>
              <td className="p-3 text-slate-500">{u.createdAt}</td>
              <td className="p-3 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => startEditUser(u)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-medium flex items-center gap-1"
                    title="Editar Cuenta de Usuario"
                  >
                    <Edit className="w-3 h-3 text-slate-500" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => requestDeleteUser(u)}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-medium flex items-center gap-1"
                    title="Eliminar Usuario Abogado"
                  >
                    <Trash2 className="w-3 h-3 text-rose-600" />
                    <span>Eliminar</span>
                  </button>
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
