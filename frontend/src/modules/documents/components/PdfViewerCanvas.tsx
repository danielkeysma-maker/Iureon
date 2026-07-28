import React, { useState } from 'react';
import { FileText, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Eye, UploadCloud } from 'lucide-react';

interface PdfViewerCanvasProps {
  fileName?: string;
  pdfUrl?: string;
  onUploadFile?: () => void;
}

export const PdfViewerCanvas: React.FC<PdfViewerCanvasProps> = ({
  fileName,
  pdfUrl
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 1;
  const [zoomLevel, setZoomLevel] = useState(100);
  const [viewMode, setViewMode] = useState<'document' | 'raw_text'>('document');

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 15, 150));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 15, 75));

  if (!pdfUrl && !fileName) {
    return (
      <div className="max-w-4xl mx-auto space-y-5 font-sans">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-sm space-y-4">
          <div className="w-16 h-16 bg-blue-50 text-blue-900 rounded-2xl flex items-center justify-center mx-auto border border-blue-100">
            <UploadCloud className="w-8 h-8 text-blue-900" />
          </div>

          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900">Visor de Expedientes Digitales</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              No hay ningún archivo PDF adjunto en este momento. Adjunte un expediente o memorial en el panel de la izquierda para examinar sus folios digitalizados y su texto procesal.
            </p>
          </div>

          <div className="pt-2">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold">
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Formatos soportados: PDF, DOCX (Cifrado Bóveda B2)</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 font-sans">
      {/* Expediente metadata + Controls bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <FileText className="w-4 h-4 text-blue-900" />
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-slate-900">{fileName || 'Expediente_Adjunto.pdf'}</h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Bóveda Cifrada • Rama Judicial</p>
          </div>
        </div>

        {/* Viewer Toolbar Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100/80 rounded-lg p-0.5 text-xs text-slate-700">
            <button onClick={handleZoomOut} className="p-1 hover:bg-white rounded transition-colors" title="Alejar">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono font-semibold text-[11px]">{zoomLevel}%</span>
            <button onClick={handleZoomIn} className="p-1 hover:bg-white rounded transition-colors" title="Acercar">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-700">
            <button disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className="disabled:opacity-40 hover:text-blue-900">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span>Folio {currentPage} de {totalPages}</span>
            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} className="disabled:opacity-40 hover:text-blue-900">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setViewMode(viewMode === 'document' ? 'raw_text' : 'document')}
            className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>{viewMode === 'document' ? 'Texto Extraído' : 'Ver PDF'}</span>
          </button>
        </div>
      </div>

      {/* Interactive PDF Paper Canvas */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-8 sm:p-12 shadow-sm relative border-t-4 border-t-slate-800 transition-all duration-300">
        <div className="border-b border-slate-200 pb-4 mb-6 flex justify-between items-center text-xs">
          <div>
            <span className="font-bold text-slate-900 block uppercase tracking-wide text-[11px]">Expediente Digital Adjunto</span>
            <span className="text-slate-400 text-[11px]">Documento Procesal Digitalizado</span>
          </div>
          <span className="font-mono text-[11px] font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
            Folio {currentPage.toString().padStart(3, '0')}
          </span>
        </div>

        {viewMode === 'document' ? (
          <div style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }} className="space-y-4 text-sm text-slate-800 leading-relaxed font-legal transition-transform duration-200">
            {pdfUrl ? (
              <iframe src={pdfUrl} title="Visor PDF Integrado" className="w-full h-[600px] border-0 rounded-lg" />
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-xs">
                Visualización de expediente digital ({fileName}).
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-900 text-emerald-400 font-mono text-xs p-5 rounded-xl space-y-2 overflow-x-auto">
            <div className="text-slate-400 pb-2 border-b border-slate-800 flex justify-between">
              <span>/// EXTRACCIÓN OCR Y TEXTO PLANO DEL EXPEDIENTE</span>
              <span>VERIFICADO</span>
            </div>
            <pre className="whitespace-pre-wrap leading-relaxed">
{`DOCUMENTO: ${fileName || 'Adjunto'}
FOLIO: ${currentPage} / ${totalPages}`}
            </pre>
          </div>
        )}

        <div className="pt-6 mt-8 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Visor de Folios Procesales • IUREON B2B</span>
          <span>Página {currentPage} de {totalPages}</span>
        </div>
      </div>
    </div>
  );
};
