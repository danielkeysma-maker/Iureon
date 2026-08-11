import React, { useState } from 'react';
import { X, Building2, Users, Key, Shield } from 'lucide-react';
import type { LawFirmTenant } from './Header';
import { ActionConfirmationModal } from './ActionConfirmationModal';
import { FirmsTab } from './tabs/FirmsTab';
import { UsersTab } from './tabs/UsersTab';
import { LoginTab } from './tabs/LoginTab';
import { useActionConfirmation } from '../hooks/useActionConfirmation';
import { useFirmUsers } from '../hooks/useFirmUsers';

export type { FirmUser } from '../types';

type TabKey = 'firms' | 'users' | 'login';

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

const TAB_STYLES = 'px-4 py-2.5 font-semibold rounded-t-xl transition-all flex items-center gap-2';
const ACTIVE_TAB_STYLES = 'bg-white text-blue-950 border-t-2 border-t-blue-900 shadow-xs';
const INACTIVE_TAB_STYLES = 'text-slate-500 hover:text-slate-800';

/**
 * Tenant administration shell.
 *
 * Holds only the tab selection and the shared confirmation modal; each tab
 * owns its own form state, so adding a field to one never touches the others.
 */
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
  const [activeTab, setActiveTab] = useState<TabKey>('firms');
  const { confirm, modalProps } = useActionConfirmation();
  const { users, addUser, updateUser, removeUser } = useFirmUsers();

  if (!isOpen) return null;

  const tabClassName = (tab: TabKey): string =>
    `${TAB_STYLES} ${activeTab === tab ? ACTIVE_TAB_STYLES : INACTIVE_TAB_STYLES}`;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
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
          <button onClick={() => setActiveTab('firms')} className={tabClassName('firms')}>
            <Building2 className="w-4 h-4 text-blue-900" />
            <span>Firmas Cliente ({firms.length})</span>
          </button>

          <button onClick={() => setActiveTab('users')} className={tabClassName('users')}>
            <Users className="w-4 h-4 text-blue-900" />
            <span>Abogados &amp; Usuarios ({users.length})</span>
          </button>

          <button onClick={() => setActiveTab('login')} className={tabClassName('login')}>
            <Key className="w-4 h-4 text-blue-900" />
            <span>Iniciar Sesión / Autenticación</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {activeTab === 'firms' && (
            <FirmsTab
              firms={firms}
              activeFirm={activeFirm}
              onSelectFirm={onSelectFirm}
              onCreateFirm={onCreateFirm}
              onUpdateFirm={onUpdateFirm}
              onDeleteFirm={onDeleteFirm}
              confirm={confirm}
            />
          )}

          {activeTab === 'users' && (
            <UsersTab
              firms={firms}
              usersList={users}
              onAddUser={addUser}
              onUpdateUser={updateUser}
              onRemoveUser={removeUser}
              confirm={confirm}
            />
          )}

          {activeTab === 'login' && <LoginTab onClose={onClose} />}
        </div>
      </div>

      <ActionConfirmationModal {...modalProps} />
    </div>
  );
};
