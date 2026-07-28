import React from 'react';
import { FileText, ShieldCheck, Layers } from 'lucide-react';

export const PdfViewerCanvas: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-5 font-sans">
      {/* Expediente metadata bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
            <FileText className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-slate-900">Expediente Digital</h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Bóveda cifrada • Torres & Asociados S.A.S.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium">EXP-2026-904.pdf</span>
            <span className="text-slate-400">•</span>
            <span>142 folios</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg font-medium">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Cifrado</span>
          </div>
        </div>
      </div>

      {/* Judicial Document Paper */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-8 sm:p-12 shadow-sm relative">
        <div className="border-b border-slate-200 pb-4 mb-6 flex justify-between items-center text-xs">
          <div>
            <span className="font-semibold text-slate-900 block uppercase tracking-wide text-[11px]">Juzgado Dieciocho Laboral del Circuito</span>
            <span className="text-slate-400 text-[11px]">Bogotá D.C., Colombia</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">Folio 001</span>
        </div>

        <div className="space-y-4 text-[13px] sm:text-sm text-slate-800 leading-relaxed font-legal">
          <p className="font-semibold text-center text-slate-900 text-sm sm:text-base tracking-wide py-2">
            DEMANDA LABORAL ORDINARIA DE PRIMERA INSTANCIA
          </p>

          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg text-[12px]">
            <div>
              <span className="text-slate-400 block text-[11px] font-medium">Demandante</span>
              <span className="font-semibold text-slate-900">Mario Alberto Pérez</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] font-medium">Demandado</span>
              <span className="font-semibold text-slate-900">Torres &amp; Asociados S.A.S.</span>
            </div>
          </div>

          <p className="indent-8 text-justify">
            El suscrito apoderado de la parte actora comparece ante su Despacho Judicial con el fin de formular demanda laboral ordinaria encaminada a obtener el reconocimiento y pago de salarios insolutos, reliquidación de prestaciones sociales, indemnización por despido incausado y sanciones moratorias del artículo 65 del Código Sustantivo del Trabajo.
          </p>

          <p className="indent-8 text-justify">
            SEGUNDO: La relación contractual entre las partes inició el día 10 de enero de 2020 y se extendió de manera continua hasta el 15 de marzo de 2023, fecha en la que se produjo la terminación unilateral del contrato de trabajo.
          </p>
        </div>

        {/* Engine pipeline — subtle footer */}
        <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-center gap-6 text-[10px] text-slate-400 font-mono">
          <span>Gemini 3.6 Flash → GPT Router → Claude Opus 5</span>
        </div>
      </div>
    </div>
  );
};
