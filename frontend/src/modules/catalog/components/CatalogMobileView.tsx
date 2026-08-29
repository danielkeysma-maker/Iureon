import React from 'react';
import { Loader2 } from 'lucide-react';
import {
  IconoBuscar,
  IconoSinVerificar,
  IconoVerificado,
  IconoVolver
} from '../../../design/ArtboardIcons';
import { useCatalogCuration } from '../hooks/useCatalogCuration';
import { VerificationForm } from './VerificationForm';
import { ActuacionDetail } from './ActuacionDetail';
import { BRANCH_LABELS } from '../branchLabels';
import type { Actuacion } from '../types';

/**
 * Catálogo en móvil. Artboard 5c — pantalla propia, NO la de escritorio encogida.
 *
 * ─── LA DIFERENCIA DE FONDO CON LA 1i ───────────────────────────────────────
 *
 * En escritorio hay una lista angosta y una ficha al lado: la lista solo tiene
 * que decir el nombre, porque el término y el artículo se leen en el panel. En
 * móvil ese panel no existe —no hay «al lado»—, así que 5c mueve el dato a la
 * TARJETA: nombre, término en grande, artículo debajo y quién lo verificó. El
 * abogado resuelve la consulta sin abrir nada, que es lo que se hace de pie en
 * un juzgado.
 *
 * Encoger la 1i habría dado lo contrario: una lista de nombres sin plazo, y un
 * panel de 460px atravesado. Por eso esto es un componente aparte y no un
 * puñado de `lg:` sobre el otro.
 *
 * ─── EL TÉRMINO ES EL ELEMENTO MÁS GRANDE DE LA TARJETA ─────────────────────
 *
 * «3 meses» va en 15px y el nombre de la actuación en 13. Es deliberado y es de
 * 5c: en una pantalla pequeña se lee lo grande primero, y lo que se viene a
 * buscar es el plazo. El nombre ya lo trae el abogado en la cabeza.
 *
 * ─── LAS RAMAS SON CHIPS QUE SE DESPLAZAN, NO UN SELECTOR ───────────────────
 *
 * Un `<select>` de veintitrés ramas obliga a abrir, buscar y confirmar. Los
 * chips muestran dónde está uno sin abrir nada, y el desplazamiento horizontal
 * es el gesto que ya se conoce. Se contiene dentro de su fila: la página no se
 * ensancha.
 *
 * ─── LO QUE EL ARTBOARD PIDE Y AQUÍ NO ESTÁ, con la razón ───────────────────
 *
 * · El conteo por rama en el encabezado de sección («Laboral · 84
 *   actuaciones») se calcula sobre lo VISIBLE, no sobre la rama entera, porque
 *   con búsqueda activa el total de la rama sería un número que no corresponde
 *   a lo que se está viendo. Se rotula «coincidencias» cuando hay búsqueda.
 */

const TERMINO_GRANDE = 'text-[15px] font-semibold leading-none';

const terminoDe = (a: Actuacion): { texto: string; clase: string } => {
  if (a.term.status === 'NO_CADUCA') return { texto: 'No aplica término', clase: 'text-ink-500' };
  if (a.term.status === 'NO_VERIFICADO')
    return { texto: 'Sin verificar', clase: 'text-unverified' };
  /*
   * El término se publica ENTERO en el detalle, pero en la tarjeta se muestra
   * su primera frase: varios términos del catálogo son párrafos de cuatro
   * plazos distintos, y un párrafo dentro de una tarjeta de lista deja de
   * leerse. Quien necesita el matiz abre la ficha, que está a un toque.
   */
  const primera = (a.term.description ?? '').split(/(?<=\.)\s|·/)[0];
  return { texto: primera.length > 60 ? `${primera.slice(0, 57)}…` : primera, clase: 'text-ink-900' };
};

export const CatalogMobileView: React.FC = () => {
  const curation = useCatalogCuration();
  const [abierta, setAbierta] = React.useState<Actuacion | null>(null);

  // Se relee de la lista fresca tras cada guardado, no de una copia vieja.
  const actual = abierta
    ? curation.actuaciones.find((a) => a.id === abierta.id) ?? abierta
    : null;

  if (actual) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto bg-canvas">
        <button
          type="button"
          onClick={() => setAbierta(null)}
          className="sticky top-0 z-10 flex min-h-[44px] shrink-0 items-center gap-2 border-b border-line-200 bg-surface px-4 text-[13px] font-semibold text-ink-700"
        >
          <IconoVolver className="h-4 w-4" />
          Catálogo
        </button>

        <div className="p-4">
          <h1 className="mb-3 text-[15px] font-semibold leading-tight text-ink-900">
            {actual.exactName}
          </h1>
          <ActuacionDetail actuacion={actual} />
        </div>

        <VerificationForm
          actuacion={actual}
          isSaving={curation.isSaving}
          error={curation.saveError}
          onSave={curation.save}
          onRevert={async (id) => {
            const listo = await curation.revert(id);
            if (listo) setAbierta(null);
            return listo;
          }}
          onClose={() => setAbierta(null)}
        />
      </div>
    );
  }

  const hayBusqueda = curation.query.trim().length > 0;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-canvas">
      {/* El titulo y el censo los pone `MobileHeader`: una sola cabecera (4d). */}
      <header className="shrink-0 border-b border-line-200 bg-surface px-4 py-3">
        <div className="relative">
          <IconoBuscar className="pointer-events-none absolute left-3 top-[11px] h-3.5 w-3.5 text-ink-400" />
          <input
            value={curation.query}
            onChange={(e) => curation.setQuery(e.target.value)}
            placeholder="Buscar actuación"
            className="field h-[38px] w-full pl-9"
          />
        </div>
      </header>

      {/*
        Los chips se desplazan DENTRO de su fila. `overflow-x-auto` aquí y no en
        la página: una barra de ramas que ensanche el documento vuelve a
        recortar todo lo demás, que es el defecto que ya se pagó una vez.
      */}
      <div className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-line-200 bg-surface px-4 py-2">
        <button
          type="button"
          onClick={() => curation.setBranchFilter('TODAS')}
          className={`min-h-[32px] shrink-0 rounded-full px-3 text-[11.5px] font-semibold ${
            curation.branchFilter === 'TODAS'
              ? 'bg-brand-700 text-white'
              : 'bg-canvas text-ink-500'
          }`}
        >
          Todas
        </button>
        {curation.branches.map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => curation.setBranchFilter(b)}
            className={`min-h-[32px] shrink-0 rounded-full px-3 text-[11.5px] font-semibold ${
              curation.branchFilter === b ? 'bg-brand-700 text-white' : 'bg-canvas text-ink-500'
            }`}
          >
            {BRANCH_LABELS[b] ?? b}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {curation.isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-[12.5px] text-ink-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando catálogo…
          </div>
        )}

        {!curation.isLoading && curation.actuaciones.length === 0 && (
          <p className="px-4 py-16 text-center text-[12.5px] text-ink-500">
            Ninguna actuación coincide.
          </p>
        )}

        {!curation.isLoading && curation.actuaciones.length > 0 && (
          <>
            <p className="px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-400">
              {curation.branchFilter === 'TODAS'
                ? 'Todas las ramas'
                : BRANCH_LABELS[curation.branchFilter] ?? curation.branchFilter}
              {' · '}
              {curation.actuaciones.length} {hayBusqueda ? 'coincidencias' : 'actuaciones'}
            </p>

            <ul className="space-y-2 px-3 pb-4">
              {curation.actuaciones.map((a) => {
                const sinVerificar = a.term.status === 'NO_VERIFICADO';
                const t = terminoDe(a);

                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => setAbierta(a)}
                      className={`w-full rounded-card bg-surface px-3.5 py-3 text-left ${
                        sinVerificar
                          ? 'border border-dashed border-[rgb(var(--unverified-line))]'
                          : 'border border-line-200'
                      }`}
                    >
                      <p className="text-[13px] font-medium leading-tight text-ink-900">
                        {a.exactName}
                      </p>

                      <p className={`mt-1.5 ${TERMINO_GRANDE} ${t.clase}`}>{t.texto}</p>

                      <p className="mt-1.5 text-[11.5px] leading-snug text-ink-500">
                        {a.legalBasis}
                      </p>

                      {a.verification ? (
                        <p className="mt-1.5 flex items-center gap-1 text-[11px] text-verified">
                          <IconoVerificado className="h-3 w-3 shrink-0" />
                          Verificada por {a.verification.verifiedBy}
                        </p>
                      ) : (
                        sinVerificar && (
                          <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-unverified">
                            <IconoSinVerificar className="h-3 w-3 shrink-0" />
                            Verificar contra la norma
                          </p>
                        )
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};
