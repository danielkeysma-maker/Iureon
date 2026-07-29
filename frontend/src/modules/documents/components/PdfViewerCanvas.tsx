import React, { useState, useMemo } from 'react';
import { FileText, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Eye, UploadCloud, Printer } from 'lucide-react';

interface PdfViewerCanvasProps {
  fileName?: string;
  pdfUrl?: string;
  draftText?: string;
  draftTitle?: string;
}

export const PdfViewerCanvas: React.FC<PdfViewerCanvasProps> = ({
  fileName,
  pdfUrl,
  draftText,
  draftTitle
}) => {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [viewMode, setViewMode] = useState<'document' | 'raw_text'>('document');
  const [currentPage, setCurrentPage] = useState(1);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 15, 150));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 15, 60));

  const hasDraft = !!draftText;
  const hasFile = !!pdfUrl || !!fileName;
  const isEmpty = !hasDraft && !hasFile;

  // Dividir el texto en "páginas" simuladas de ~3000 caracteres para paginación
  const pages = useMemo(() => {
    if (!draftText) return [''];
    const pageSize = 3000;
    return Array.from(
      { length: Math.ceil(draftText.length / pageSize) },
      (_, i) => draftText.slice(i * pageSize, (i + 1) * pageSize)
    );
  }, [draftText]);

  const totalPages = Math.max(pages.length, 1);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const content = draftText || '';
    printWindow.document.write(`
      <html>
        <head>
          <title>${draftTitle || 'Documento Jurídico'}</title>
          <style>
            @page { margin: 2.54cm; }
            body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.8; color: #000; white-space: pre-wrap; }
          </style>
        </head>
        <body>${content.replace(/\n/g, '<br/>')}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Estado vacío: no hay archivo ni borrador
  if (isEmpty) {
    return (
      <div className="max-w-4xl mx-auto space-y-5 font-sans">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-sm space-y-4">
          <div className="w-16 h-16 bg-blue-50 text-blue-900 rounded-2xl flex items-center justify-center mx-auto border border-blue-100">
            <UploadCloud className="w-8 h-8 text-blue-900" />
          </div>

          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900">Visor de Documento</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Genere un borrador con el orquestador de la izquierda para visualizar el documento aquí en formato de impresión, o adjunte un expediente PDF para examinar sus folios.
            </p>
          </div>

          <div className="pt-2">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold">
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Vista previa de impresión • PDF • DOCX</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 font-sans">
      {/* Controls bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <FileText className="w-4 h-4 text-blue-900" />
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-slate-900">
              {hasDraft ? (draftTitle || 'Borrador Jurídico') : (fileName || 'Expediente_Adjunto.pdf')}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              {hasDraft ? 'Vista Previa de Impresión • Generado por IA' : 'Bóveda Cifrada • Rama Judicial'}
            </p>
          </div>
        </div>

        {/* Toolbar */}
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

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-700">
              <button disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className="disabled:opacity-40 hover:text-blue-900">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span>Página {currentPage} de {totalPages}</span>
              <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} className="disabled:opacity-40 hover:text-blue-900">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {hasDraft && (
            <button
              onClick={() => setViewMode(viewMode === 'document' ? 'raw_text' : 'document')}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>{viewMode === 'document' ? 'Texto Plano' : 'Vista Documento'}</span>
            </button>
          )}

          {hasDraft && (
            <button
              onClick={handlePrint}
              className="px-2.5 py-1 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
          )}
        </div>
      </div>

      {/* Paper Canvas — simula una hoja de papel */}
      <div
        className="bg-white border border-slate-200/80 rounded-xl shadow-sm relative border-t-4 border-t-slate-800 transition-all duration-300"
        style={{ minHeight: '800px' }}
      >
        {viewMode === 'document' ? (
          hasDraft ? (
            <div
              className="text-slate-900 leading-[1.8] whitespace-pre-wrap transition-all duration-200"
              style={{
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: `${Math.round(12 * zoomLevel / 100)}px`,
                padding: `${Math.round(48 * zoomLevel / 100)}px ${Math.round(64 * zoomLevel / 100)}px`,
                transformOrigin: 'top center'
              }}
            >
              {pages[currentPage - 1]}
            </div>
          ) : pdfUrl ? (
            <iframe src={pdfUrl} title="Visor PDF Integrado" className="w-full h-[600px] border-0 rounded-lg" />
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-xs m-8">
              Visualización de expediente digital ({fileName}).
            </div>
          )
        ) : (
          <div className="bg-slate-900 text-emerald-400 font-mono text-xs p-5 rounded-xl space-y-2 overflow-x-auto m-4">
            <div className="text-slate-400 pb-2 border-b border-slate-800 flex justify-between">
              <span>/// TEXTO PLANO DEL DOCUMENTO GENERADO</span>
              <span>{draftText?.length?.toLocaleString()} caracteres</span>
            </div>
            <pre className="whitespace-pre-wrap leading-relaxed">
              {pages[currentPage - 1]}
            </pre>
          </div>
        )}

        <div className="px-8 py-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Vista Previa de Documento • IUREON B2B</span>
          <span>Página {currentPage} de {totalPages}</span>
        </div>
      </div>
    </div>
  );
};
