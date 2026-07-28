import React, { useState } from 'react';
import { X, Check, Settings, Upload, Image as ImageIcon } from 'lucide-react';
import type { FirmBrandingConfig } from '../../documents/services/documentExport.service';

interface FirmBrandingModalProps {
  isOpen: boolean;
  onClose: () => void;
  branding: FirmBrandingConfig;
  onSaveBranding: (updated: FirmBrandingConfig) => void;
}

export const FirmBrandingModal: React.FC<FirmBrandingModalProps> = ({
  isOpen,
  onClose,
  branding,
  onSaveBranding
}) => {
  const [formState, setFormState] = useState<FirmBrandingConfig>(branding);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        setFormState((prev) => ({ ...prev, logoUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveBranding(formState);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-900 border border-blue-950 flex items-center justify-center text-white">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Membrete Oficial de la Firma Cliente
              </h3>
              <p className="text-[11px] text-slate-500 font-body">
                Configura los logos, encabezados y fuentes para la exportación de documentos.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-body">
          {/* Logo Upload Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <label className="text-[11px] font-bold text-slate-800 block flex items-center justify-between">
              <span>Logo Oficial de la Firma (.PNG, .JPG, .SVG):</span>
              {formState.logoUrl && <span className="text-emerald-700 text-[10px]">✓ Logo Cargado</span>}
            </label>

            <div className="flex items-center gap-3">
              {formState.logoUrl ? (
                <img
                  src={formState.logoUrl}
                  alt="Logo Firma"
                  className="w-12 h-12 object-contain bg-white border border-slate-200 rounded-lg p-1"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-slate-200/70 border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                  <ImageIcon className="w-5 h-5" />
                </div>
              )}

              <div className="flex-1">
                <label className="cursor-pointer px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors">
                  <Upload className="w-3.5 h-3.5 text-blue-900" />
                  <span>{formState.logoUrl ? 'Cambiar Logo' : 'Subir Imagen del Logo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[10px] text-slate-400 mt-1">Se incluirá automáticamente en el encabezado de los PDF/Word exportados.</p>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">Nombre Oficial de la Firma:</label>
            <input
              type="text"
              value={formState.firmName}
              onChange={(e) => setFormState({ ...formState, firmName: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-md p-2.5 text-slate-900 text-xs font-sans focus:outline-none focus:border-blue-900"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">NIT / Identificación Fiscal:</label>
              <input
                type="text"
                value={formState.firmNit}
                onChange={(e) => setFormState({ ...formState, firmNit: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-md p-2.5 text-slate-900 text-xs font-mono focus:outline-none focus:border-blue-900"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">Tipografía Preferida:</label>
              <select
                value={formState.fontFamily}
                onChange={(e) => setFormState({ ...formState, fontFamily: e.target.value as any })}
                className="w-full bg-slate-50 border border-slate-200 rounded-md p-2.5 text-slate-900 text-xs font-sans focus:outline-none focus:border-blue-900"
              >
                <option value="Inter">Inter (Limpio Corporativo)</option>
                <option value="Times New Roman">Times New Roman (Tradicional Judicial)</option>
                <option value="Arial">Arial (Estándar)</option>
                <option value="Calibri">Calibri</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">Dirección &amp; Teléfono PBX:</label>
            <input
              type="text"
              value={formState.firmAddress}
              onChange={(e) => setFormState({ ...formState, firmAddress: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-md p-2.5 text-slate-900 text-xs font-sans focus:outline-none focus:border-blue-900"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">Buzón Judicial de Notificaciones:</label>
            <input
              type="email"
              value={formState.firmEmail}
              onChange={(e) => setFormState({ ...formState, firmEmail: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-md p-2.5 text-slate-900 text-xs font-mono focus:outline-none focus:border-blue-900"
              required
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            {savedSuccess ? (
              <span className="text-emerald-700 text-xs font-semibold flex items-center gap-1">
                <Check className="w-4 h-4" />
                Membrete actualizado correctamente.
              </span>
            ) : <span />}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-md font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Guardar Membrete</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
