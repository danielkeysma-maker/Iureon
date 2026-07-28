import React, { useState } from 'react';
import { ChevronRight, Sparkles, BookOpen, Wrench, Shield, CheckCircle2, Copy, Download, FileType, Maximize2, Minimize2, LogOut } from 'lucide-react';
import { ActionConfirmationModal } from './ActionConfirmationModal';

interface HeaderTopProps {
  mainView: 'workspace' | 'search' | 'tools' | 'audit';
  rightView: 'pdf' | 'draft' | 'analytics';
  setRightView: (view: 'pdf' | 'draft' | 'analytics') => void;
  copied: boolean;
  onCopyText: () => void;
  onExportWord: () => void;
  onExportPdf: () => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
  onOpenUserManagementModal?: () => void;
  onLogout?: () => void;
}

export const HeaderTop: React.FC<HeaderTopProps> = ({
  mainView,
  rightView,
  setRightView,
  copied,
  onCopyText,
  onExportWord,
  onExportPdf,
  isFocusMode,
  onToggleFocusMode,
  onOpenUserManagementModal,
  onLogout
}) => {
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const viewMeta: Record<string, { label: string; icon: React.ReactNode }> = {
    workspace: { label: 'Redacción & Providencias', icon: <Sparkles className="w-4 h-4 text-blue-800" /> },
    search: { label: 'Buscador & Sentencias', icon: <BookOpen className="w-4 h-4 text-blue-800" /> },
    tools: { label: 'Herramientas & Cálculos', icon: <Wrench className="w-4 h-4 text-blue-800" /> },
    audit: { label: 'Seguridad & Auditoría', icon: <Shield className="w-4 h-4 text-blue-800" /> }
  };

  const current = viewMeta[mainView];

  return (
    <header className="h-[52px] bg-white border-b border-slate-200/80 px-6 flex items-center justify-between select-none font-sans z-20">
      {/* BREADCRUMB */}
      <div className="flex items-center gap-2 text-[13px]">
        <span className="text-slate-400 font-medium">Módulos</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <div className="flex items-center gap-2 text-slate-900 font-semibold">
          {current.icon}
          <span>{current.label}</span>
        </div>
      </div>

      {/* WORKSPACE-SPECIFIC ACTIONS */}
      {mainView === 'workspace' && (
        <div className="flex items-center gap-3">
          {/* Sub-view Tabs */}
          <div className="flex bg-slate-100/80 p-0.5 rounded-lg text-[12px]">
            <button
              onClick={() => setRightView('pdf')}
              className={`px-3 py-1.5 rounded-md transition-all font-semibold ${
                rightView === 'pdf'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Visor PDF
            </button>
            <button
              onClick={() => setRightView('draft')}
              className={`px-3 py-1.5 rounded-md transition-all font-semibold ${
                rightView === 'draft'
                  ? 'bg-blue-950 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Borrador IA
            </button>
          </div>

          {/* Export Actions */}
          {rightView === 'draft' && (
            <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
              <button
                onClick={onCopyText}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition-colors"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
              <button
                onClick={onExportWord}
                className="px-2.5 py-1.5 bg-blue-950 hover:bg-blue-900 text-white rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Word</span>
              </button>
              <button
                onClick={onExportPdf}
                className="px-2.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition-colors"
              >
                <FileType className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>

              {onToggleFocusMode && (
                <button
                  onClick={onToggleFocusMode}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition-all ml-1 ${
                    isFocusMode
                      ? 'bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-sm'
                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200'
                  }`}
                  title={isFocusMode ? 'Restaurar panel lateral de la plataforma' : 'Expandir editor a Pantalla Central'}
                >
                  {isFocusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  <span>{isFocusMode ? 'Vista Dividida' : 'Pantalla Central'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUPERUSER & LOGOUT QUICK LINKS */}
      <div className="ml-auto flex items-center gap-2">
        {onOpenUserManagementModal && (
          <button
            onClick={onOpenUserManagementModal}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11.5px] font-bold flex items-center gap-1.5 transition-all shadow-xs border border-slate-700"
            title="Gestión de SuperUsuario, Autenticación y Cuentas de Firmas"
          >
            <Shield className="w-3.5 h-3.5 text-blue-300" />
            <span>SuperUsuario &amp; Firmas</span>
          </button>
        )}

        {onLogout && (
          <button
            onClick={() => setIsLogoutConfirmOpen(true)}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-[11.5px] font-bold flex items-center gap-1.5 transition-all shadow-xs"
            title="Cerrar Sesión e Ir al Portal de Login"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span>Cerrar Sesión</span>
          </button>
        )}
      </div>

      {/* ActionConfirmationModal for Logout */}
      <ActionConfirmationModal
        isOpen={isLogoutConfirmOpen}
        title="🚨 ¿Cerrar Sesión de la Plataforma?"
        message="¿Está seguro de que desea salir del Ecosistema E-Judicial de Iureon? Sus datos y configuraciones activas permanecerán seguros."
        confirmText="Sí, Cerrar Sesión"
        confirmVariant="danger"
        onConfirm={() => {
          setIsLogoutConfirmOpen(false);
          if (onLogout) onLogout();
        }}
        onCancel={() => setIsLogoutConfirmOpen(false)}
      />
    </header>
  );
};
