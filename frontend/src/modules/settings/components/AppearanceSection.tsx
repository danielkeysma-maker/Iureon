import React from 'react';
import { Check } from 'lucide-react';
import {
  useSistemaOscuro,
  type Density,
  type Preferences,
  type Theme,
  type UiFont
} from '../preferences';

/**
 * Ajustes · Apariencia.
 *
 * SOLO SU SESIÓN, y la pantalla lo dice. Es la mitad "Suyos" de Ajustes, frente
 * a la mitad "De la firma" que cambia un socio y aplica a todos. El diseño pone
 * esa frontera por escrito porque el error más caro en una app de despacho es
 * cambiarle el membrete a todos creyendo que se cambiaba el propio.
 *
 * NO CAMBIA EL ESCRITO QUE GENERA LA IA. Ni el tema, ni la familia, ni la
 * densidad tocan el documento: el .docx y el PDF salen siempre en papel blanco
 * con la tipografía que la firma definió. Se dice en la pantalla porque la
 * pregunta se la hace todo el mundo.
 *
 * SE APLICA AL ELEGIR, sin botón de guardar. Un ajuste de apariencia que exija
 * confirmar obliga a imaginar el resultado; aplicándolo, se ve.
 */

interface AppearanceSectionProps {
  prefs: Preferences;
  cambiar: (parcial: Partial<Preferences>) => void;
}

const TEMAS: { valor: Theme; titulo: string }[] = [
  { valor: 'system', titulo: 'Según el sistema' },
  { valor: 'light', titulo: 'Claro' },
  { valor: 'dark', titulo: 'Oscuro' }
];

/**
 * Las siete familias, cada una descrita por lo que hace bien.
 *
 * La muestra "Ag 0123 Il1" está para comparar lo único que importa aquí: si los
 * dígitos y las letras ambiguas se distinguen. Un abogado que confunde un 1 con
 * una l en un radicado pierde una hora.
 */
const FUENTES: { valor: UiFont; nombre: string; nota: string; css: string }[] = [
  {
    valor: 'plex',
    nombre: 'IBM Plex Sans',
    nota: 'Por defecto · neutra, hecha para tablas densas',
    css: "'IBM Plex Sans', system-ui, sans-serif"
  },
  {
    valor: 'jakarta',
    nombre: 'Plus Jakarta Sans',
    nota: 'Geométrica y cálida · la más contemporánea del juego',
    css: "'Plus Jakarta Sans', system-ui, sans-serif"
  },
  {
    valor: 'manrope',
    nombre: 'Manrope',
    nota: 'Cierres abiertos y buen ritmo en cifras',
    css: "'Manrope', system-ui, sans-serif"
  },
  {
    valor: 'instrument',
    nombre: 'Instrument Sans',
    nota: 'Estrecha y sobria · cabe más texto por fila',
    css: "'Instrument Sans', system-ui, sans-serif"
  },
  {
    valor: 'public',
    nombre: 'Public Sans',
    nota: 'De uso oficial · la más institucional',
    css: "'Public Sans', system-ui, sans-serif"
  },
  {
    valor: 'satoshi',
    nombre: 'Satoshi',
    nota: 'Geométrica y limpia · de Indian Type Foundry, vía Fontshare',
    css: "'Satoshi', system-ui, sans-serif"
  },
  {
    valor: 'system',
    nombre: 'La del sistema',
    nota: 'Se ve como el resto de su equipo · no descarga nada',
    css: 'system-ui, -apple-system, sans-serif'
  }
];

const DENSIDADES: { valor: Density; titulo: string; alto: string }[] = [
  { valor: 'compact', titulo: 'Compacta', alto: 'fila 26px' },
  { valor: 'normal', titulo: 'Normal', alto: '36px' },
  { valor: 'comfortable', titulo: 'Amplia', alto: '44px' }
];

/** Cabecera de bloque: etiqueta en mono y una línea que llega hasta el borde. */
const Bloque: React.FC<{ titulo: string; nota?: string; children: React.ReactNode }> = ({
  titulo,
  nota,
  children
}) => (
  <section className="mt-6">
    <div className="flex items-center gap-2">
      <h3 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
        {titulo}
      </h3>
      {nota && <span className="text-meta text-ink-400">{nota}</span>}
      <div className="h-px flex-1 bg-line-200" />
    </div>
    <div className="mt-3">{children}</div>
  </section>
);

/** El punto de selección. Redondo y sólido: es un radio, no una casilla. */
const Marca: React.FC<{ activo: boolean }> = ({ activo }) =>
  activo ? (
    <span className="flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-full bg-brand-700">
      <Check className="h-3 w-3 text-on-brand" strokeWidth={3.2} />
    </span>
  ) : (
    <span className="h-[17px] w-[17px] shrink-0 rounded-full border border-line-200" />
  );

export const AppearanceSection: React.FC<AppearanceSectionProps> = ({ prefs, cambiar }) => {
  const sistemaOscuro = useSistemaOscuro();

  return (
    <div className="max-w-[860px]">
      <h2 className="text-title text-ink-900">Apariencia</h2>
      <p className="mt-1 text-ui text-ink-500">
        Solo su sesión, en este y en sus demás dispositivos. No cambia el escrito que genera la IA.
      </p>

      {/* ─── TEMA ──────────────────────────────────────────────────────────*/}
      <Bloque titulo="Tema">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {TEMAS.map((t) => (
            <button
              key={t.valor}
              onClick={() => cambiar({ theme: t.valor })}
              className={`overflow-hidden rounded-card border bg-surface text-left transition-colors ${
                prefs.theme === t.valor
                  ? 'border-[1.5px] border-brand-700 ring-[3px] ring-brand-700/10'
                  : 'border-line-200 hover:border-[rgb(var(--brand-line))]'
              }`}
            >
              <VistaPrevia tema={t.valor} />
              <div className="flex items-center gap-2 border-t border-line-200 px-3 py-2.5">
                <div className="min-w-0">
                  <div className="text-ui font-semibold text-ink-900">{t.titulo}</div>
                  <div className="mt-px text-meta text-ink-500">
                    {t.valor === 'system'
                      ? /*
                         * Solo lo comprobable. El diseño muestra "oscuro a las
                         * 18:30", pero esa hora NO la sabe el navegador:
                         * `prefers-color-scheme` dice claro u oscuro ahora
                         * mismo, y ningún API expone el horario del sistema
                         * operativo. Escribirla sería poner un dato falso en una
                         * pantalla de ajustes.
                         */
                        `Ahora en ${sistemaOscuro ? 'oscuro' : 'claro'}`
                      : 'Siempre'}
                  </div>
                </div>
                <span className="ml-auto">
                  <Marca activo={prefs.theme === t.valor} />
                </span>
              </div>
            </button>
          ))}
        </div>

        <p className="notice mt-3">
          <span>
            El escrito se exporta <b className="font-semibold">siempre en papel blanco</b> — no se
            puede desactivar.
          </span>
        </p>
      </Bloque>

      {/* ─── TIPOGRAFÍA DE LA INTERFAZ ─────────────────────────────────────*/}
      <Bloque titulo="Tipografía de la interfaz" nota="siete familias probadas con datos densos">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {FUENTES.map((f) => (
            <button
              key={f.valor}
              onClick={() => cambiar({ uiFont: f.valor })}
              className={`flex items-center gap-3 rounded-card border px-3 py-2.5 text-left transition-colors ${
                prefs.uiFont === f.valor
                  ? 'border-brand-700 bg-brand-50'
                  : 'border-line-200 bg-surface hover:bg-canvas'
              }`}
            >
              <div className="min-w-0 flex-1">
                {/* Cada familia se muestra ESCRITA EN SÍ MISMA. */}
                <div className="text-ui font-semibold text-ink-900" style={{ fontFamily: f.css }}>
                  {f.nombre}
                </div>
                <div className="mt-px truncate text-meta text-ink-500">{f.nota}</div>
              </div>
              <span
                className="shrink-0 text-[15px] text-ink-700"
                style={{ fontFamily: f.css }}
                aria-hidden="true"
              >
                Ag 0123 Il1
              </span>
              <Marca activo={prefs.uiFont === f.valor} />
            </button>
          ))}
        </div>

        {/*
          LA MONOESPACIADA NO SE ELIGE, y eso se dice aquí y no en una nota al
          pie: es lo que impide confundir un 1 con una l en un radicado de
          veintitrés dígitos.
        */}
        <div className="mt-2 flex items-center gap-3 rounded-card border border-line-200 bg-canvas px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <div className="font-mono text-ui font-semibold text-ink-900">IBM Plex Mono</div>
            <div className="mt-px truncate font-mono text-meta text-ink-500">
              1l0O · 11001310300320250014700
            </div>
          </div>
          <span className="chip-neutral shrink-0">Fija</span>
        </div>
        <p className="mt-2 text-meta leading-[1.5] text-ink-500">
          Términos, radicados y saldos van siempre en monoespaciada, cualquiera sea la familia
          elegida.
        </p>
      </Bloque>

      {/* ─── DENSIDAD ──────────────────────────────────────────────────────*/}
      <Bloque titulo="Densidad">
        <div className="inline-flex rounded-control border border-line-200 bg-canvas p-0.5">
          {DENSIDADES.map((d) => (
            <button
              key={d.valor}
              onClick={() => cambiar({ density: d.valor })}
              className={`rounded-[3px] px-3 py-1.5 text-meta font-medium transition-colors ${
                prefs.density === d.valor
                  ? 'bg-brand-700 text-on-brand'
                  : 'text-ink-500 hover:text-ink-900'
              }`}
            >
              {d.titulo} <span className="font-mono opacity-70">· {d.alto}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-meta leading-[1.5] text-ink-500">
          La densidad cambia altos de fila y de control, nunca los tamaños de letra: el mínimo de
          11px de las etiquetas no se toca en ninguna opción.
        </p>
      </Bloque>
    </div>
  );
};

/**
 * La miniatura de cada tema: barra, superficie y tres renglones.
 *
 * Para "según el sistema" se parte en diagonal y muestra los dos a la vez, que
 * es lo que esa opción realmente hace. Un solo color ahí obligaría a adivinar
 * cuál de los dos va a tocar.
 */
const VistaPrevia: React.FC<{ tema: Theme }> = ({ tema }) => {
  const diagonal = tema === 'system';
  const oscuro = tema === 'dark';

  const barra = diagonal
    ? 'linear-gradient(135deg,#0F2233 0 50%,#0A121A 50%)'
    : oscuro
    ? '#0A121A'
    : '#0F2233';

  const fondo = diagonal
    ? 'linear-gradient(135deg,#F7F8FA 0 50%,#0B1219 50%)'
    : oscuro
    ? '#0B1219'
    : '#F7F8FA';

  const cabecera = diagonal
    ? 'linear-gradient(135deg,#fff 0 52%,#131B24 52%)'
    : oscuro
    ? '#131B24'
    : '#fff';

  return (
    <div className="flex h-[88px]" aria-hidden="true">
      <div className="w-[38%]" style={{ background: barra }} />
      <div className="flex flex-1 flex-col" style={{ background: fondo }}>
        <div
          className="h-[15px] border-b"
          style={{ background: cabecera, borderColor: oscuro ? '#24303D' : '#E3E7EC' }}
        />
        <div className="flex flex-1 flex-col gap-[5px] p-2">
          <div className="h-[5px] w-[82%] rounded-sm" style={{ background: oscuro ? '#2E3B4A' : '#C3CBD6' }} />
          <div className="h-[5px] w-[64%] rounded-sm" style={{ background: oscuro ? '#3A4756' : '#8B96A6' }} />
          <div className="h-[5px] w-[74%] rounded-sm" style={{ background: oscuro ? '#8FA0B2' : '#4A566B' }} />
        </div>
      </div>
    </div>
  );
};
