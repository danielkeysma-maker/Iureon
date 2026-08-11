import React from 'react';
import { Scale, AlertTriangle, CheckCircle2, XCircle, BookOpen, ShieldCheck } from 'lucide-react';

export type { FactoresRiesgo, RequisitosConcesion, PrecedenteJudicial, CaseProvidenciaEvaluationData } from '../types';
import type { CaseProvidenciaEvaluationData } from '../types';





interface PrecedentsAnalyticsCardProps {
  data: CaseProvidenciaEvaluationData;
}

export const PrecedentsAnalyticsCard: React.FC<PrecedentsAnalyticsCardProps> = ({ data }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      {/* 1. Header Card - Evaluador Prospectivo */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-900 border border-blue-950 flex items-center justify-center text-white shadow-xs">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Evaluador Prospectivo de la Providencia del Caso
                </h3>
                <span className="text-[10px] font-mono bg-blue-50 text-blue-900 border border-blue-200 px-2 py-0.5 rounded font-semibold uppercase">
                  {data.expedienteId}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {data.circunstanciaEstudio} • {data.corporacionPrincipal}
              </p>
            </div>
          </div>
        </div>

        {/* Ratio Concedidos vs Negados Bar */}
        <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-emerald-700 flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-4 h-4" />
              TASA CONCEDIDOS ({data.tasaConcedidosPct}%)
            </span>
            <span className="text-rose-700 flex items-center gap-1 font-mono">
              <XCircle className="w-4 h-4" />
              TASA NEGADOS ({data.tasaNegadosPct}%)
            </span>
          </div>

          <div className="h-4 w-full bg-rose-100 rounded-full overflow-hidden flex border border-slate-200 shadow-inner">
            <div
              className="h-full bg-emerald-600 transition-all duration-500"
              style={{ width: `${data.tasaConcedidosPct}%` }}
            />
            <div
              className="h-full bg-rose-600 transition-all duration-500"
              style={{ width: `${data.tasaNegadosPct}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-500 font-body text-center pt-1 font-medium">
            Basado en el análisis comparativo de jurisprudencia en la Sala Laboral de la Corte Suprema de Justicia.
          </p>
        </div>
      </div>

      {/* 2. Factores de Riesgo de Denegación (Por qué el Juez Negaría) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <h4 className="text-sm font-bold text-slate-900">
            Factores de Riesgo de Denegación (Causales por las que el Juez Negaría el Caso)
          </h4>
        </div>

        <div className="space-y-3">
          {data.factoresRiesgoDenegacion.map((item, idx) => (
            <div key={idx} className="p-4 bg-amber-50/60 border border-amber-200 rounded-lg space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                  {item.riesgo}
                </span>
                <span className="text-[10px] font-mono font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                  IMPACTO {item.impacto}
                </span>
              </div>
              <p className="text-xs text-slate-700 font-body pl-3.5 leading-relaxed">{item.explicacion}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Requisitos Clave para Asegurar Concesión (Blindaje Legal) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <ShieldCheck className="w-5 h-5 text-emerald-700" />
          <h4 className="text-sm font-bold text-slate-900">
            Blindaje Legal &amp; Requisitos Clave para Otorgar la Providencia a Favor
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.requisitosClaveParaConcesion.map((req, idx) => (
            <div key={idx} className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 text-xs">{req.requisito}</span>
                {req.cumplidoEnExpediente && (
                  <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded font-bold">
                    CUMPLIDO
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 font-body">{req.recomendacion}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Precedentes Concedidos vs Negados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Concedidos */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <BookOpen className="w-4 h-4 text-emerald-700" />
            <h5 className="text-xs font-bold text-slate-900">Precedentes CONCEDIDOS a Favor</h5>
          </div>

          <div className="space-y-2">
            {data.topPrecedentesConcedidos.map((p, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-xs">
                <div className="flex items-center justify-between font-mono">
                  <span className="font-bold text-blue-900">{p.sentencia} ({p.ano})</span>
                  <span className="text-[10px] text-slate-500">{p.ponente}</span>
                </div>
                <p className="text-[11px] text-slate-600 font-body italic">"{p.fundamentoClave}"</p>
              </div>
            ))}
          </div>
        </div>

        {/* Negados */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <BookOpen className="w-4 h-4 text-rose-700" />
            <h5 className="text-xs font-bold text-slate-900">Precedentes NEGADOS (Causales)</h5>
          </div>

          <div className="space-y-2">
            {data.topPrecedentesNegados.map((p, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-xs">
                <div className="flex items-center justify-between font-mono">
                  <span className="font-bold text-rose-800">{p.sentencia} ({p.ano})</span>
                  <span className="text-[10px] text-slate-500">{p.ponente}</span>
                </div>
                <p className="text-[11px] text-slate-600 font-body">{p.causalDenegacion}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
