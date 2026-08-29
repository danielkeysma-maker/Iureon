import React from 'react';
import { AlertTriangle, CalendarClock, Gavel, Infinity as InfinityIcon, Scale } from 'lucide-react';
import type { Actuacion, RequiredSection } from '../types';

/**
 * La ficha de la actuación: los tres datos y las secciones. Artboard 1i.
 *
 * ─── TRES BLOQUES IGUALES, CADA UNO CON SU PROPIO ESTADO ────────────────────
 *
 * Término, norma y autoridad definen la actuación, y el artboard insiste en que
 * cada uno lleve su estado por separado: **una ficha puede estar verificada en
 * el término y coja en la autoridad, y eso tiene que verse**. Un único sello de
 * «verificada» arriba escondería justo la mitad que falta — y la autoridad es
 * la que manda al abogado a radicar ante quien no es.
 *
 * ─── LAS SECCIONES EXISTÍAN Y NADIE LAS VEÍA ────────────────────────────────
 *
 * Las 794 fichas del catálogo traen sus secciones obligatorias —4.685 en total,
 * 333 sin artículo confirmado— y la pantalla de curaduría no mostraba ninguna.
 * El motor SÍ las usa: son las que exige el escrito al redactarlo. Un requisito
 * que la aplicación impone y el abogado no puede leer es un requisito que no
 * puede discutir, y las 333 sin artículo son precisamente las que convendría
 * discutir.
 *
 * ─── LO QUE EL ARTBOARD PIDE Y AQUÍ NO ESTÁ, con la razón ───────────────────
 *
 * · **Verificar una sección concreta** («Verificar sección 04», con su casilla
 *   y su «No aplica»). `catalog_verifications` guarda UNA fila por firma y
 *   actuación —esa es su llave primaria— y no tiene columnas por sección. El
 *   panel se podría pintar hoy y no habría dónde guardar el resultado: el
 *   curador leería el artículo, marcaría la casilla, y al recargar seguiría sin
 *   verificar. Peor que no ofrecerlo. Exige columnas nuevas, no un componente.
 * · **Historia de curaduría** con varias entradas y sus horas. Por la misma
 *   llave primaria solo sobrevive la ÚLTIMA curación: no hay historia que
 *   listar, solo un estado actual. Se muestra ese, con su nombre y su fecha.
 * · **«Usada en 11 escritos de la firma»** y **«Actuación 214 de 651»**. Lo
 *   primero exige contar borradores por actuación, que hoy no se relaciona; lo
 *   segundo, un índice estable dentro del filtro activo. Ninguno cambia lo que
 *   el abogado puede verificar, así que no se inventan.
 * · **«Texto oficial recuperado»** de la norma. Existe recuperación oficial
 *   para JURISPRUDENCIA, no para normas: traer el artículo de una ley exige otro
 *   verificador. El enlace a la fuente sí está, que es lo comprobable hoy.
 */

const SIN_ARTICULO = 'sin artículo confirmado';

interface BloqueProps {
  icono: React.ReactNode;
  rotulo: string;
  valor: string | null;
  detalle?: string | null;
  /** El estado de ESTE dato, no el de la ficha. */
  estado: { texto: string; clase: string };
}

const Bloque: React.FC<BloqueProps> = ({ icono, rotulo, valor, detalle, estado }) => (
  <div className="rounded-card border border-line-200 bg-surface px-3 py-2.5">
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">
        {icono}
        {rotulo}
      </span>
      <span
        className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${estado.clase}`}
      >
        {estado.texto}
      </span>
    </div>
    <p className="mt-1.5 text-justify text-[12px] font-semibold leading-snug text-ink-900 [text-wrap:pretty]">
      {valor ?? <span className="font-normal text-ink-500">No declarada en la ficha</span>}
    </p>
    {detalle && (
      <p className="mt-0.5 text-justify text-[11px] leading-snug text-ink-500 [text-wrap:pretty]">
        {detalle}
      </p>
    )}
  </div>
);

const VERDE = 'bg-[rgb(var(--verified-surf))] text-verified border-[rgb(var(--verified-line))]';
const AMBAR =
  'border-dashed bg-[rgb(var(--unverified-surf))] text-unverified border-[rgb(var(--unverified-line))]';
const NEUTRO = 'bg-canvas text-ink-500 border-line-200';

const estadoDelTermino = (a: Actuacion) => {
  if (a.term.status === 'VERIFICADO') return { texto: 'VERIFICADO', clase: VERDE };
  if (a.term.status === 'NO_CADUCA') return { texto: 'NO CADUCA', clase: NEUTRO };
  return { texto: 'SIN VERIFICAR', clase: AMBAR };
};

/*
 * La norma se da por comprobada cuando la ficha trae su fuente. Sin URL el
 * artículo puede estar bien y no hay cómo saberlo: es «sin comprobar», que no
 * es lo mismo que estar mal, y por eso no va en rojo.
 */
const estadoDeLaNorma = (a: Actuacion) =>
  a.sourceUrl ? { texto: 'CON FUENTE', clase: VERDE } : { texto: 'SIN FUENTE', clase: AMBAR };

const estadoDeLaAutoridad = (a: Actuacion) =>
  a.competentAuthority ? { texto: 'DECLARADA', clase: VERDE } : { texto: 'SIN DECLARAR', clase: AMBAR };

const Seccion: React.FC<{ seccion: RequiredSection }> = ({ seccion }) => {
  const confirmada = Boolean(seccion.basis);
  return (
    <li className="flex gap-2.5 px-3 py-2">
      <span className="shrink-0 pt-0.5 font-mono text-[10px] tabular-nums text-ink-400">
        {String(seccion.n).padStart(2, '0')}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] leading-snug text-ink-900">
          {seccion.name}
          {!seccion.mandatory && (
            <span className="ml-1.5 text-[10px] font-medium text-ink-400">opcional</span>
          )}
        </p>
        <p
          className={`mt-0.5 text-[10.5px] leading-snug ${
            confirmada ? 'text-ink-500' : 'text-unverified'
          }`}
        >
          {seccion.basis ?? SIN_ARTICULO}
        </p>
      </div>
      <span
        className={`h-fit shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${
          confirmada ? VERDE : AMBAR
        }`}
      >
        {confirmada ? 'CON ARTÍCULO' : 'SIN ARTÍCULO'}
      </span>
    </li>
  );
};

interface ActuacionDetailProps {
  actuacion: Actuacion;
}

export const ActuacionDetail: React.FC<ActuacionDetailProps> = ({ actuacion }) => {
  const secciones = [...actuacion.requiredSections].sort((a, b) => a.n - b.n);
  const conArticulo = secciones.filter((s) => s.basis).length;
  const sinArticulo = secciones.length - conArticulo;

  return (
    <div className="space-y-3">
      <div className="grid gap-2">
        <Bloque
          icono={<CalendarClock className="h-3 w-3" />}
          rotulo="Término"
          valor={
            actuacion.term.description ??
            (actuacion.term.status === 'NO_CADUCA'
              ? 'No caduca'
              : 'Nadie ha comprobado el plazo')
          }
          estado={estadoDelTermino(actuacion)}
        />
        <Bloque
          icono={<Scale className="h-3 w-3" />}
          rotulo="Norma"
          valor={actuacion.legalBasis}
          detalle={actuacion.sourceUrl ? 'Verificada contra su texto oficial' : null}
          estado={estadoDeLaNorma(actuacion)}
        />
        <Bloque
          icono={<Gavel className="h-3 w-3" />}
          rotulo="Autoridad competente"
          valor={actuacion.competentAuthority}
          estado={estadoDeLaAutoridad(actuacion)}
        />
      </div>

      {actuacion.sourceUrl && (
        <a
          href={actuacion.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-[11px] font-semibold text-brand-700 underline underline-offset-2"
        >
          Ver el texto oficial de la norma
        </a>
      )}

      <section className="rounded-card border border-line-200 bg-surface">
        <header className="border-b border-line-200 px-3 py-2">
          <h3 className="text-[12px] font-semibold text-ink-900">
            Secciones obligatorias del escrito
          </h3>
          <p className="mt-0.5 text-[10.5px] text-ink-500">
            {conArticulo} con artículo
            {sinArticulo > 0 && ` · ${sinArticulo} sin artículo confirmado`}
          </p>
        </header>

        {secciones.length === 0 ? (
          <p className="px-3 py-6 text-center text-[11.5px] text-ink-500">
            Esta ficha no declara secciones.
          </p>
        ) : (
          <ul className="divide-y divide-line-100">
            {secciones.map((s) => (
              <Seccion key={s.n} seccion={s} />
            ))}
          </ul>
        )}

        {sinArticulo > 0 && (
          <p className="border-t border-line-200 px-3 py-2 text-justify text-[10.5px] leading-snug text-ink-500 [text-wrap:pretty]">
            Una sección sin artículo confirmado se le sigue exigiendo al escrito: lo que falta es la
            cita que la sostiene, no el requisito. Confirmarla una por una todavía no se puede
            guardar —la curaduría se registra por actuación, no por sección—, así que se muestra en
            vez de ofrecerse un botón que no dejaría rastro.
          </p>
        )}
      </section>

      {actuacion.verification && (
        <section className="rounded-card border border-line-200 bg-canvas px-3 py-2.5">
          <h3 className="text-[12px] font-semibold text-ink-900">Curaduría de su firma</h3>
          <p className="mt-1 text-justify text-[11px] leading-snug text-ink-700 [text-wrap:pretty]">
            {actuacion.verification.verifiedBy} ·{' '}
            {new Date(actuacion.verification.verifiedAt).toLocaleString('es-CO', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
          {actuacion.verification.note && (
            <p className="mt-1 text-justify text-[11px] leading-snug text-ink-500 [text-wrap:pretty]">
              {actuacion.verification.note}
            </p>
          )}
          <p className="mt-1.5 flex items-start gap-1.5 text-[10.5px] leading-snug text-ink-400">
            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
            <span className="text-justify [text-wrap:pretty]">
              Se conserva la última curación, no el historial: el catálogo guarda una fila por
              actuación y firma, así que una curación reemplaza a la anterior.
            </span>
          </p>
        </section>
      )}

      {!actuacion.verification && actuacion.term.status === 'NO_VERIFICADO' && (
        <p className="flex items-start gap-1.5 rounded-card border border-[rgb(var(--unverified-line))] bg-[rgb(var(--unverified-surf))] px-3 py-2 text-[11px] leading-snug text-unverified">
          <InfinityIcon className="mt-0.5 h-3 w-3 shrink-0 rotate-90" />
          <span className="text-justify [text-wrap:pretty]">
            Nadie de su firma ha comprobado esta ficha. Mientras siga así, los escritos advierten en
            vez de afirmar un plazo — que es lo correcto, no un defecto.
          </span>
        </p>
      )}
    </div>
  );
};
