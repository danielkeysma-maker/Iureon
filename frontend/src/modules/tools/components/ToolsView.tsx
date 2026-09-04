import React, { useState } from 'react';
import { BookOpen, CalendarClock, Coins, Search } from 'lucide-react';
import { ProceduralTermsModal } from '../../procedural-terms/components/ProceduralTermsModal';
import { LaborSettlementModal } from '../../settlements/components/LaborSettlementModal';
import { LegalSearchGlossaryModal } from '../../search/components/LegalSearchGlossaryModal';
import { IndexacionModal } from './IndexacionModal';
import { InteresesModal } from './InteresesModal';
import { CuantiaModal } from './CuantiaModal';
import { CalendarioModal } from './CalendarioModal';

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
 * Ejecutoria con traslados: exige modelar cada recurso con su término y su
 * forma de notificación, y no está construida. Pintarla como fila muerta sería
 * una promesa. Se agrega cuando exista.
 *
 * ─── LO QUE SÍ ESTÁ, Y CON QUÉ FUENTE ───────────────────────────────────────
 *
 * Indexación por IPC, intereses de mora, competencia por cuantía y calendario
 * judicial llegaron con la regla del catálogo: cada constante (SMLMV por año,
 * tasa certificada, festivos) viaja desde el servidor con su norma, su URL
 * oficial y su fecha de consulta, y se imprime junto al resultado. Lo que no
 * tiene fuente estable que un servidor pueda leer —el índice IPC del DANE, la
 * tasa bancaria corriente de cada mes— lo ESCRIBE el abogado desde la página
 * oficial enlazada, y la pantalla lo dice antes de calcular.
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
  const [indexacionAbierta, setIndexacionAbierta] = useState(false);
  const [interesesAbiertos, setInteresesAbiertos] = useState(false);
  const [cuantiaAbierta, setCuantiaAbierta] = useState(false);
  const [calendarioAbierto, setCalendarioAbierto] = useState(false);
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
           * Los festivos ya no son una tabla de un año: se calculan de la
           * Ley 51 de 1983 (fechas fijas, traslado al lunes, Pascua), así que
           * cualquier año desde 1984 tiene calendario, y la fuente es la ley.
           */
          fuente: { texto: 'Festivos calculados de la Ley 51 de 1983 · vacancia judicial (CGP art. 118)', verificada: true },
          abrir: () => setTerminosAbierto(true)
        },
        {
          id: 'calendario',
          nombre: 'Calendario judicial',
          queHace: 'Los 18 festivos del año con su regla, la vacancia judicial y la Semana Santa.',
          fuente: { texto: 'Ley 51 de 1983 · CGP art. 118 · Semana Santa completa solo si el acuerdo del año lo dice', verificada: true },
          abrir: () => setCalendarioAbierto(true)
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
        },
        {
          id: 'cuantia',
          nombre: 'Competencia por cuantía',
          queHace: 'Mínima, menor o mayor cuantía y el juez competente, con el SMLMV del año de presentación.',
          fuente: { texto: 'CGP arts. 17, 18, 20, 25 y 26 · SMLMV 2020–2026 por decreto · laboral Ley 2452 de 2025 art. 13', verificada: true },
          abrir: () => setCuantiaAbierta(true)
        },
        {
          id: 'intereses',
          nombre: 'Intereses de mora',
          queHace: 'Mora comercial (1,5 × IBC), legal civil (6 %) o pactada, con control de usura.',
          /*
           * La tasa certificada cambia cada mes: se prellena solo la última
           * verificada, con su mes, y el resto la escribe el abogado.
           */
          fuente: { texto: 'C.Co. art. 884 · C.C. art. 1617 · C.P. art. 305 · IBC certificado que usted ingresa (Superfinanciera)', verificada: true },
          abrir: () => setInteresesAbiertos(true)
        },
        {
          id: 'indexacion',
          nombre: 'Indexación por IPC',
          queHace: 'Actualiza un valor histórico con la fórmula valor × (IPC final ÷ IPC inicial).',
          fuente: { texto: 'Índices que usted toma de la página del IPC del DANE · sin tabla propia', verificada: true },
          abrir: () => setIndexacionAbierta(true)
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
      <IndexacionModal isOpen={indexacionAbierta} onClose={() => setIndexacionAbierta(false)} />
      <InteresesModal isOpen={interesesAbiertos} onClose={() => setInteresesAbiertos(false)} />
      <CuantiaModal isOpen={cuantiaAbierta} onClose={() => setCuantiaAbierta(false)} />
      <CalendarioModal isOpen={calendarioAbierto} onClose={() => setCalendarioAbierto(false)} />

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
            LO QUE FALTA, DICHO EN LA PANTALLA. Una fila muerta prometería una
            calculadora que no calcula; la ausencia se declara en su lugar.
          */}
          <p className="px-1 text-meta leading-[1.6] text-ink-400">
            El cómputo de ejecutoria con traslados se agrega cuando esté construido y verificado — no antes.
            Cada resultado de estas herramientas se exporta a Excel con una hoja de fuentes.
          </p>
        </div>
      </div>
    </div>
  );
};
