import React, { useState } from 'react';
import { BookOpen, CalendarClock, Coins, Search } from 'lucide-react';
import { ProceduralTermsModal } from '../../procedural-terms/components/ProceduralTermsModal';
import { LaborSettlementModal } from '../../settlements/components/LaborSettlementModal';
import { LegalSearchGlossaryModal } from '../../search/components/LegalSearchGlossaryModal';

/**
 * Herramientas. Lista por tarea, no cuadrícula de tarjetas.
 *
 * ─── POR QUÉ LISTA Y NO TARJETAS ────────────────────────────────────────────
 *
 * Una fila con nombre y una línea de qué hace escala a cuarenta utilidades;
 * catorce tarjetas iguales ya no se leen. Los grupos son TAREAS del abogado
 * (términos y plazos · cuantías y liquidaciones · referencia), no categorías
 * técnicas.
 *
 * ─── CADA UTILIDAD DECLARA SU FUENTE ────────────────────────────────────────
 *
 * Una calculadora de términos cuyo calendario de festivos cubre un solo año
 * tiene que decirlo ANTES de usarse: es el sistema de tres estados aplicado
 * fuera del catálogo. La cobertura que se declara aquí es la que el servidor
 * impone — si un término pisa fuera de ella, el cálculo se niega con la razón.
 *
 * ─── LO QUE EL ARTBOARD 2d LISTA Y AQUÍ NO ESTÁ ─────────────────────────────
 *
 * Indexación con IPC (necesita el índice del DANE), competencia por cuantía
 * (SMLMV del año), intereses moratorios (tasa de usura por trimestre),
 * calendario judicial y ejecutoria con traslados: cada una exige una fuente
 * oficial conectada y verificada. Pintarlas como filas muertas sería un menú
 * de promesas. Se agregan cuando su fuente exista.
 *
 * «Usadas por usted esta semana» tampoco está: exige registro de uso por
 * usuario, que hoy no se guarda.
 */

interface Utilidad {
  id: string;
  nombre: string;
  queHace: string;
  fuente: { texto: string; verificada: boolean };
  abrir: () => void;
}

export const ToolsView: React.FC = () => {
  const [terminosAbierto, setTerminosAbierto] = useState(false);
  const [liquidacionAbierta, setLiquidacionAbierta] = useState(false);
  const [glosarioAbierto, setGlosarioAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const grupos: Array<{ titulo: string; icono: typeof CalendarClock; utilidades: Utilidad[] }> = [
    {
      titulo: 'Términos y plazos',
      icono: CalendarClock,
      utilidades: [
        {
          id: 'terminos',
          nombre: 'Contador de términos',
          queHace: 'Días hábiles con festivos de Colombia; muestra qué descontó y por qué.',
          /*
           * La cobertura, dicha donde se elige la herramienta. El servidor
           * RECHAZA un término que pise fuera de ella — mejor sin respuesta
           * que con la fecha equivocada.
           */
          fuente: { texto: 'Festivos 2026 cargados · fuera de 2026 el cálculo se niega', verificada: true },
          abrir: () => setTerminosAbierto(true)
        }
      ]
    },
    {
      titulo: 'Cuantías y liquidaciones',
      icono: Coins,
      utilidades: [
        {
          id: 'liquidacion',
          nombre: 'Liquidación de prestaciones',
          queHace: 'Cesantías, intereses, prima, vacaciones e indemnización, cada una con su norma.',
          fuente: { texto: 'Fórmula general del CST · salario fijo', verificada: true },
          abrir: () => setLiquidacionAbierta(true)
        }
      ]
    },
    {
      titulo: 'Referencia',
      icono: BookOpen,
      utilidades: [
        {
          id: 'glosario',
          nombre: 'Glosario jurídico',
          queHace: 'Términos leídos del catálogo verificado, cada uno con su norma y su fuente.',
          /*
           * Derivado del catálogo — el modal lee searchGlossary, no fichas a
           * mano. El glosario manual que vivía en esta pantalla se eliminó: su
           * propio historial registra una ficha que citaba un código derogado.
           */
          fuente: { texto: 'Derivado del catálogo verificado, con la URL de cada norma', verificada: true },
          abrir: () => setGlosarioAbierto(true)
        }
      ]
    }
  ];

  const q = busqueda.trim().toLowerCase();
  const visibles = grupos
    .map((g) => ({
      ...g,
      utilidades: g.utilidades.filter(
        (u) => !q || u.nombre.toLowerCase().includes(q) || u.queHace.toLowerCase().includes(q)
      )
    }))
    .filter((g) => g.utilidades.length > 0);

  const total = grupos.reduce((n, g) => n + g.utilidades.length, 0);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-canvas font-sans">
      <ProceduralTermsModal isOpen={terminosAbierto} onClose={() => setTerminosAbierto(false)} />
      <LaborSettlementModal isOpen={liquidacionAbierta} onClose={() => setLiquidacionAbierta(false)} />
      <LegalSearchGlossaryModal isOpen={glosarioAbierto} onClose={() => setGlosarioAbierto(false)} />

      <header className="flex shrink-0 flex-wrap items-end gap-3 border-b border-line-200 bg-surface px-5 py-3.5">
        <div className="min-w-0 flex-1">
          <h1 className="text-title text-ink-900">Herramientas</h1>
          <p className="mt-0.5 text-meta text-ink-500">
            Cálculos y verificaciones que no requieren generar un escrito · {total} utilidades
          </p>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Por nombre o por lo que necesita calcular"
            className="field w-[280px] max-w-full pl-8"
          />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="mx-auto max-w-3xl space-y-4">
          {visibles.length === 0 && (
            <p className="card py-8 text-center text-meta text-ink-500">
              Ninguna utilidad coincide con esa búsqueda.
            </p>
          )}

          {visibles.map((grupo) => (
            <section key={grupo.titulo} className="overflow-hidden rounded-card border border-line-200 bg-surface">
              <header className="flex items-center gap-2 border-b border-line-100 bg-canvas px-4 py-2">
                <grupo.icono className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                <h2 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                  {grupo.titulo} · {grupo.utilidades.length}
                </h2>
              </header>

              {grupo.utilidades.map((u) => (
                <button
                  key={u.id}
                  onClick={u.abrir}
                  className="flex w-full items-center gap-3 border-b border-line-100 px-4 py-2.5 text-left last:border-0 hover:bg-canvas"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-ui font-medium text-ink-900">{u.nombre}</span>
                    <span className="mt-0.5 block truncate text-meta text-ink-500">{u.queHace}</span>
                  </span>

                  {/* El estado de la fuente, ANTES de abrir: tres estados, fuera del catálogo. */}
                  <span className={`shrink-0 ${u.fuente.verificada ? 'chip-verified' : 'chip-unverified'}`}>
                    {u.fuente.verificada ? 'Fuente declarada' : 'Sin verificar'}
                  </span>
                </button>
              ))}

              {/* La letra de la fuente, legible sin abrir. */}
              {grupo.utilidades.map((u) => (
                <p key={`${u.id}-fuente`} className="border-t border-line-100 bg-canvas px-4 py-1.5 font-mono text-[10.5px] text-ink-400">
                  {u.nombre}: {u.fuente.texto}
                </p>
              ))}
            </section>
          ))}

          {/*
            LO QUE FALTA, DICHO EN LA PANTALLA. El artboard lista catorce
            utilidades; aquí hay tres porque cada una de las otras exige su
            fuente oficial conectada (IPC del DANE, SMLMV, tasa de usura,
            calendario judicial). Un menú de filas muertas prometería
            calculadoras que no calculan.
          */}
          <p className="px-1 text-meta leading-[1.6] text-ink-400">
            Indexación con IPC, competencia por cuantía, intereses moratorios y calendario
            judicial se agregan cuando su fuente oficial esté conectada y verificada — no antes.
          </p>
        </div>
      </div>
    </div>
  );
};
