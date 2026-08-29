import React from 'react';
import { IconoBuscar, IconoVolver } from '../../../design/ArtboardIcons';
import {
  ENTRADAS,
  MINUTOS_TOTALES,
  TOTAL_ARTICULOS,
  buscar,
  minutosDeLectura
} from '../content/manual';
import type { ManualEntry } from '../types';
import { Bloque } from './ManualView';
import { useManualReads } from '../useManualReads';
import { IconoVerificado } from '../../../design/ArtboardIcons';

/**
 * El manual en móvil. Artboard 9d, con las medidas copiadas de su HTML.
 *
 * ─── LO QUE DICE LA MAQUETA, CITADO ─────────────────────────────────────────
 *
 *     cabecera:  padding:8px 16px 12px · título 600 15px · sub 400 11px MONO
 *     cuerpo:    padding:12px 16px; gap:8px
 *     rótulo:    600 9.5px MONO tracking .1em uppercase #8B96A6 + filete 1px
 *     tarjeta:   border 1px #E3E7EC; radius 8; padding 12px 13px; gap 10
 *                índice 16px MONO 600 · título 500 13.5px · meta 400 11px MONO
 *     en curso:  border 1.5px #17456B, índice y título en #17456B / #101822
 *
 * ─── LO QUE EL ARTBOARD PIDE Y NO ESTÁ, con la razón (ya declarada) ─────────
 *
 * 9d muestra «6 de 13 leídos», la palomita por artículo y «empezado /
 * Continuar». **No hay estado de lectura**, y no es un olvido: está razonado en
 * `content/manual.ts`. Un socio necesita saber si el abogado nuevo leyó el
 * artículo de verificación ANTES de darle permisos de curaduría, y eso es un
 * registro por usuario en el servidor — no hay tabla, ni endpoint, ni ruta.
 * Fingirlo en `localStorage` respondería la pregunta del socio con algo que
 * solo sabe ese navegador, **en la pantalla cuyo tema entero es no confiar en
 * lo que nadie comprobó**. Se muestra el total y los minutos, que son ciertos.
 *
 * Por eso el contador de la cabecera dice «13 artículos · 47 min» y no «6 de
 * 13»: el numerador no existe.
 */

interface ManualMobileViewProps {
  onSoporte: () => void;
}

/** Los grupos en el orden del manual, con sus entradas. */
const porGrupo = (entradas: readonly ManualEntry[]) => {
  const orden: string[] = [];
  const mapa = new Map<string, ManualEntry[]>();
  for (const e of entradas) {
    if (!mapa.has(e.grupo)) {
      mapa.set(e.grupo, []);
      orden.push(e.grupo);
    }
    mapa.get(e.grupo)!.push(e);
  }
  return orden.map((grupo) => ({ grupo, entradas: mapa.get(grupo)! }));
};

export const ManualMobileView: React.FC<ManualMobileViewProps> = ({ onSoporte }) => {
  const [consulta, setConsulta] = React.useState('');
  const [abierto, setAbierto] = React.useState<ManualEntry | null>(null);
  const lectura = useManualReads();

  const visibles = consulta.trim() ? buscar(consulta) : ENTRADAS;
  const grupos = porGrupo(visibles);

  if (abierto) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto bg-canvas">
        <button
          type="button"
          onClick={() => setAbierto(null)}
          className="sticky top-0 z-10 flex min-h-[44px] shrink-0 items-center gap-2 border-b border-line-200 bg-surface px-4 text-[13px] font-semibold text-ink-700"
        >
          <IconoVolver className="h-4 w-4" />
          Manual
        </button>

        <article className="px-4 py-4">
          <p className="font-mono text-[11px] text-ink-400">
            {abierto.grupo} · {minutosDeLectura(abierto.articulo)} min
          </p>
          <h1 className="mt-1 text-[17px] font-semibold leading-tight text-ink-900">
            {abierto.articulo.titulo}
          </h1>

          <p className="mt-1.5 text-justify text-[13px] leading-snug text-ink-500 [text-wrap:pretty]">
            {abierto.articulo.entradilla}
          </p>

          {/*
            LOS BLOQUES LOS PINTA `Bloque`, EL MISMO DE LA VISTA DE ESCRITORIO.
            Los articulos no son prosa plana: llevan subtitulos, pasos numerados
            y listas, y una copia propia aqui acabaria pintando los pasos como
            parrafos. El mismo manual diciendo dos cosas distintas segun el
            aparato es peor que no tenerlo en el telefono.
          */}
          <div className="mt-3">
            {abierto.articulo.bloques.map((b, i) => (
              <Bloque key={i} bloque={b} />
            ))}
          </div>

          {/*
            MARCAR AL FINAL DEL ARTICULO, no en el indice: la marca dice «lo
            lei», y ofrecerla junto al titulo invita a marcarlo sin abrirlo.
            Aqui hay que haber bajado hasta el final para llegar al boton.
          */}
          <button
            type="button"
            onClick={() => lectura.alternar(abierto.articulo.id)}
            className={`mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-control border text-[13px] font-semibold ${
              lectura.leidos.has(abierto.articulo.id)
                ? 'border-[rgb(var(--verified-line))] bg-[rgb(var(--verified-surf))] text-verified'
                : 'border-line-200 bg-surface text-ink-700'
            }`}
          >
            <IconoVerificado className="h-4 w-4" />
            {lectura.leidos.has(abierto.articulo.id) ? 'Marcado como leído' : 'Marcar como leído'}
          </button>

          <p className="mt-1.5 text-justify text-[11px] leading-snug text-ink-400 [text-wrap:pretty]">
            Queda registrado con su cuenta. Dice que usted lo leyó — no que el sistema haya
            comprobado que lo entendió.
          </p>

          <button
            type="button"
            onClick={onSoporte}
            className="btn-secondary mt-3 h-11 w-full"
          >
            ¿Sigue con la duda? Escriba a soporte
          </button>
        </article>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-canvas">
      <header className="shrink-0 border-b border-line-200 bg-surface px-4 pb-3 pt-2">
        <div className="relative">
          <IconoBuscar className="pointer-events-none absolute left-3 top-[11px] h-3.5 w-3.5 text-ink-400" />
          <input
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            placeholder="Buscar en el manual"
            className="field h-[38px] w-full pl-9 text-[12.5px]"
          />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {grupos.length === 0 ? (
          <p className="py-16 text-center text-[12.5px] text-ink-500">
            Nada en el manual coincide con «{consulta.trim()}».
          </p>
        ) : (
          grupos.map(({ grupo, entradas }) => (
            <section key={grupo} className="mb-2">
              <div className="mb-2 mt-1.5 flex items-center gap-[7px]">
                <span className="shrink-0 font-mono text-[9.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                  {grupo}
                </span>
                <div className="h-px flex-1 bg-line-200" />
              </div>

              <ul className="space-y-2">
                {entradas.map((e) => (
                  <li key={e.articulo.id}>
                    <button
                      type="button"
                      onClick={() => setAbierto(e)}
                      className="flex w-full items-center gap-2.5 rounded-[8px] border border-line-200 bg-surface px-3 py-3 text-left"
                    >
                      {/* 9d: la palomita ocupa el sitio del numero cuando esta leido. */}
                      <span className="flex w-4 shrink-0 justify-center">
                        {lectura.leidos.has(e.articulo.id) ? (
                          <IconoVerificado className="h-3.5 w-3.5 text-verified" />
                        ) : (
                          <span className="text-center font-mono text-[11.5px] font-semibold text-ink-400">
                            {String(e.numero).padStart(2, '0')}
                          </span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block text-[13.5px] leading-tight ${
                            lectura.leidos.has(e.articulo.id)
                              ? 'font-normal text-ink-500'
                              : 'font-medium text-ink-900'
                          }`}
                        >
                          {e.articulo.titulo}
                        </span>
                        <span className="mt-0.5 block font-mono text-[11px] text-ink-400">
                          {lectura.leidos.has(e.articulo.id) ? 'Leído · ' : ''}
                          {minutosDeLectura(e.articulo)} min
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}

        <p className="mt-4 text-justify text-[11px] leading-snug text-ink-400 [text-wrap:pretty]">
          {lectura.leidos.size} de {TOTAL_ARTICULOS} leídos · {MINUTOS_TOTALES} minutos en total.
          El registro va con su cuenta y su firma lo puede consultar: es lo que permite saber si
          alguien leyó el artículo de verificación antes de recibir permisos de curaduría.
        </p>
      </div>
    </div>
  );
};
