import React from 'react';
import { AlertTriangle, CalendarClock, CheckCircle2, ChevronDown, MinusCircle } from 'lucide-react';
import { useBranchActuacionesState } from '../../catalog/hooks/useBranchActuaciones';
import { useCatalogBranchesState } from '../../catalog/hooks/useCatalogBranches';
import { BRANCH_LABELS } from '../../catalog/branchLabels';
import type { ActuacionRole } from '../../catalog/types';

/**
 * La configuración del taller en móvil. Artboard 4d.
 *
 * ─── POR QUÉ NO ES LA BARRA DE ESCRITORIO ───────────────────────────────────
 *
 * La de escritorio son tres selectores en fila —rol, rama, actuación— con sus
 * rótulos y sus anchos. En 375px cada uno quedaba en «Fi… ▾ › ▾ › El… ▾»: tres
 * palabras cortadas que no dicen nada, y encima había que desplazarlas para
 * verlas. Configurar dejó de ser posible sin adivinar.
 *
 * 4d lo resuelve al revés: **la configuración se comprime en DOS CHIPS y lo que
 * se muestra en su lugar es la consecuencia** — la actuación elegida con su
 * término y su fecha de vencimiento, que es lo único que hay que poder leer en
 * 390px antes de escribir. Los selectores se abren al tocar «Cambiar».
 *
 * ─── EL TÉRMINO VA DONDE SE VE, NO DETRÁS DE UN SELECTOR ────────────────────
 *
 * El artboard pone «Nulidad y restablecimiento · 4 meses · 18 jul» como una
 * línea propia. Es la información por la que existe el catálogo, y esconderla
 * dentro de la etiqueta de un `<select>` truncado la volvía invisible justo en
 * la pantalla donde se decide qué escribir.
 *
 * ─── LO QUE EL ARTBOARD PIDE Y AQUÍ NO ESTÁ, con la razón ───────────────────
 *
 * · La FECHA de vencimiento («18 jul»). El catálogo guarda el término en prosa
 *   —«dentro de los cuatro (4) meses siguientes a la notificación»— y no la
 *   fecha: calcularla exige saber cuándo empezó a correr, y eso solo lo sabe
 *   quien lleva el caso. Es la misma razón por la que Orientación tampoco
 *   pinta «Vence». Se muestra el plazo, que es verdad, y no una fecha inventada.
 */

interface WorkshopConfigMobileProps {
  userRole: ActuacionRole;
  setUserRole: (role: ActuacionRole) => void;
  legalBranch: string;
  setLegalBranch: (branch: string) => void;
  documentType: string;
  setDocumentType: (type: string) => void;
}

const ROL_CORTO: Record<ActuacionRole, string> = {
  LITIGANTE: 'Litigante',
  DESPACHO: 'Despacho',
  SECRETARIA: 'Secretaría'
};

export const WorkshopConfigMobile: React.FC<WorkshopConfigMobileProps> = ({
  userRole,
  setUserRole,
  legalBranch,
  setLegalBranch,
  documentType,
  setDocumentType
}) => {
  const [abierto, setAbierto] = React.useState(false);
  const catalogo = useBranchActuacionesState(legalBranch, userRole);
  const ramasEstado = useCatalogBranchesState();

  const elegida = catalogo.actuaciones.find((a) => a.exactName === documentType) ?? null;

  const termino = elegida
    ? elegida.term.status === 'NO_CADUCA'
      ? { texto: 'No caduca', Icono: MinusCircle, clase: 'text-ink-500' }
      : elegida.term.status === 'NO_VERIFICADO'
      ? { texto: 'Término sin verificar', Icono: AlertTriangle, clase: 'text-unverified' }
      : {
          /*
           * La primera frase del término y no el párrafo: varios son cuatro
           * plazos distintos separados por punto, y un párrafo aquí empuja el
           * campo de instrucción fuera de la pantalla.
           */
          texto: (elegida.term.description ?? '').split(/(?<=\.)\s/)[0],
          Icono: CalendarClock,
          clase: 'text-ink-900'
        }
    : null;

  return (
    <div className="shrink-0 border-b border-line-200 bg-surface">
      <div className="flex items-center gap-[7px] px-4 pt-2.5">
        {/* `Config.` en mono, 9.5px, versales y tracking .1em — del HTML. */}
        <span className="shrink-0 font-mono text-[9.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
          Config.
        </span>
        <span className="max-w-[96px] truncate rounded-[6px] border border-line-200 bg-canvas px-2 py-1 text-[12px] font-medium text-ink-900">
          {ROL_CORTO[userRole]}
        </span>
        <span className="max-w-[96px] truncate rounded-[6px] border border-line-200 bg-canvas px-2 py-1 text-[12px] font-medium text-ink-900">
          {BRANCH_LABELS[legalBranch] ?? legalBranch}
        </span>
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          className="ml-auto flex min-h-[32px] shrink-0 items-center gap-1 px-0.5 py-1 text-[12px] font-medium text-brand-700"
        >
          {abierto ? 'Listo' : 'Cambiar'}
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${abierto ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/*
        LA ACTUACION Y SU TERMINO, en su propia linea y siempre visibles. Es lo
        que 4d quiere que se lea en 390px: sin esto, el abogado escribe la
        instruccion sin saber contra que ficha se va a redactar.
      */}
      {elegida && termino && !abierto && (
        <div className="mx-4 mt-2 flex items-center gap-1.5 border-t border-line-100 pb-2.5 pt-2">
          <termino.Icono
            className={`h-[13px] w-[13px] shrink-0 ${termino.clase}`}
            strokeWidth={2.4}
          />
          {/*
            UNA SOLA LINEA, como en el HTML: «Nulidad y restablecimiento ·
            4 meses», con el nombre en 12px regular y el TERMINO en mono
            semibold. Partirlo en dos renglones —como estaba— le quitaba a la
            fila su cualidad de resumen: 4d la quiere de un vistazo.
          */}
          <p className="min-w-0 flex-1 truncate text-[12px] text-ink-700">
            {elegida.exactName}
            {' · '}
            <b className={`font-mono text-[12px] font-semibold ${termino.clase}`}>
              {termino.texto}
            </b>
          </p>
        </div>
      )}

      {!elegida && !abierto && (
        <p className="border-t border-line-100 px-4 py-2 text-[12px] leading-snug text-ink-500">
          Sin actuación elegida: el escrito saldrá sin término ni artículo verificados.
        </p>
      )}

      {abierto && (
        <div className="space-y-2 border-t border-line-100 px-4 py-3">
          <label className="block">
            <span className="field-label">Quién firma</span>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as ActuacionRole)}
              className="field w-full"
            >
              {(Object.keys(ROL_CORTO) as ActuacionRole[]).map((r) => (
                <option key={r} value={r}>
                  {ROL_CORTO[r]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="field-label">Rama</span>
            <select
              value={legalBranch}
              onChange={(e) => setLegalBranch(e.target.value)}
              className="field w-full"
            >
              {ramasEstado.ramas.map((b) => (
                <option key={b} value={b}>
                  {BRANCH_LABELS[b] ?? b}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="field-label">Actuación</span>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="field w-full"
            >
              <option value="">Elija la actuación…</option>
              {catalogo.actuaciones.map((a) => (
                <option key={a.id} value={a.exactName}>
                  {a.exactName}
                  {a.term.status === 'NO_VERIFICADO' ? ' · sin verificar' : ''}
                </option>
              ))}
            </select>
          </label>

          <p className="flex items-start gap-1.5 pt-1 text-[11px] leading-snug text-ink-500">
            <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-verified" />
            <span className="text-justify [text-wrap:pretty]">
              La actuación es la que trae el artículo y el término verificados. Sin ella el
              escrito se redacta sin respaldo del catálogo.
            </span>
          </p>
        </div>
      )}
    </div>
  );
};
