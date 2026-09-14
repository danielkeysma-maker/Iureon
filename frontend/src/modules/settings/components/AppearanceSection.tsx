import React from 'react';
import {
  useSistemaOscuro,
  type Density,
  type Preferences,
  type Theme,
  type UiFont
} from '../preferences';
import { Cabecera } from './SeccionesSuyas';

/**
 * Ajustes · Apariencia.
 *
 * SIGUE EL ARTBOARD «APARIENCIA» DE `public/handoff/app-ajustes-y-plan.html`
 * (:309): tres tarjetas de tema con su miniatura, la nota del papel blanco sobre
 * ámbar, las familias de letra como opciones sobre gris y la densidad como
 * botones del mismo peso.
 *
 * SOLO SU SESIÓN, y la pantalla lo dice. El diseño pone esa frontera por
 * escrito porque el error más caro en una app de despacho es cambiarle el
 * membrete a todos creyendo que se cambiaba el propio.
 *
 * SE APLICA AL ELEGIR, sin botón de guardar. Un ajuste de apariencia que exija
 * confirmar obliga a imaginar el resultado; aplicándolo, se ve.
 *
 * LO QUE EL ARTBOARD PIDE Y AQUÍ ES DISTINTO, con la razón:
 *  · Tres familias (Satoshi, sistema, Plex Mono) — la aplicación ofrece ocho y
 *    las guarda el servidor; quitar cinco le cambiaría la letra a quien ya las
 *    eligió. «Todo monoespaciado» no se ofrece: la monoespaciada es la señal de
 *    lo citable, y usarla en todo borraría esa señal.
 *  · Dos densidades — hay tres guardadas; se muestran las tres.
 */

interface AppearanceSectionProps {
  prefs: Preferences;
  cambiar: (parcial: Partial<Preferences>) => void;
}

const TEMAS: { valor: Theme; titulo: string }[] = [
  { valor: 'system', titulo: 'Sigue al sistema' },
  { valor: 'light', titulo: 'Claro siempre' },
  { valor: 'dark', titulo: 'Oscuro siempre' }
];

/** Las ocho familias, cada una descrita por lo que hace bien y escrita en sí misma. */
const FUENTES: { valor: UiFont; nombre: string; nota: string; css: string }[] = [
  { valor: 'plex', nombre: 'IBM Plex Sans', nota: 'Por defecto · neutra, para tablas densas', css: "'IBM Plex Sans', system-ui, sans-serif" },
  { valor: 'satoshi', nombre: 'Satoshi', nota: 'Geométrica y limpia', css: "'Satoshi', system-ui, sans-serif" },
  { valor: 'system', nombre: 'La del sistema', nota: 'Sin descargar nada', css: 'system-ui, -apple-system, sans-serif' },
  { valor: 'jakarta', nombre: 'Plus Jakarta Sans', nota: 'Geométrica y cálida', css: "'Plus Jakarta Sans', system-ui, sans-serif" },
  { valor: 'manrope', nombre: 'Manrope', nota: 'Buen ritmo en cifras', css: "'Manrope', system-ui, sans-serif" },
  { valor: 'instrument', nombre: 'Instrument Sans', nota: 'Estrecha · cabe más por fila', css: "'Instrument Sans', system-ui, sans-serif" },
  { valor: 'public', nombre: 'Public Sans', nota: 'De uso oficial', css: "'Public Sans', system-ui, sans-serif" },
  { valor: 'worksans', nombre: 'Work Sans', nota: 'Abierta y legible en pantalla', css: "'Work Sans', system-ui, sans-serif" }
];

const DENSIDADES: { valor: Density; titulo: string; nota: string }[] = [
  { valor: 'comfortable', titulo: 'Amplia', nota: 'Más aire entre líneas' },
  { valor: 'normal', titulo: 'Normal', nota: 'La de siempre' },
  { valor: 'compact', titulo: 'Compacta', nota: 'Más filas en pantalla' }
];

export const AppearanceSection: React.FC<AppearanceSectionProps> = ({ prefs, cambiar }) => {
  const sistemaOscuro = useSistemaOscuro();

  return (
    <section>
      <Cabecera titulo="Apariencia" texto="Cómo se ve la aplicación para usted, en este y en sus demás dispositivos. No afecta a nadie más." />

      <p className="cn-aju-subtitulo">Tema</p>
      <div className="cn-aju-temas" role="radiogroup" aria-label="Tema">
        {TEMAS.map((t) => {
          const activo = prefs.theme === t.valor;
          return (
            <button
              key={t.valor}
              type="button"
              role="radio"
              aria-checked={activo}
              onClick={() => cambiar({ theme: t.valor })}
              className={`cn-aju-tema${activo ? ' cn-aju-tema--activo' : ''}`}
            >
              <VistaPrevia tema={t.valor} />
              <span className="cn-aju-tema-pie">
                <span className="cn-aju-tema-nombre">{t.titulo}</span>
                {/*
                  Solo lo comprobable. `prefers-color-scheme` dice claro u oscuro
                  ahora mismo; ningún API expone a qué hora cambia el sistema.
                */}
                {t.valor === 'system' && (
                  <span className="cn-aju-tema-nota">Ahora en {sistemaOscuro ? 'oscuro' : 'claro'}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      <div className="cn-aju-nota-aviso">
        <p>
          El escrito se exporta <b>siempre en papel blanco</b>, aunque usted trabaje en oscuro. Lo que va a un juzgado
          no lleva su tema de pantalla.
        </p>
      </div>

      <p className="cn-aju-subtitulo">Tipografía de la interfaz</p>
      <p className="cn-aju-ayuda cn-aju-ayuda--antes">
        La del escrito no cambia, y términos, radicados y saldos van siempre en monoespaciada.
      </p>
      <div className="cn-aju-opciones" role="radiogroup" aria-label="Tipografía de la interfaz">
        {FUENTES.map((f) => {
          const activa = prefs.uiFont === f.valor;
          return (
            <button
              key={f.valor}
              type="button"
              role="radio"
              aria-checked={activa}
              onClick={() => cambiar({ uiFont: f.valor })}
              className={`cn-aju-opcion${activa ? ' cn-aju-opcion--activa' : ''}`}
            >
              <span className="cn-aju-opcion-nombre" style={{ fontFamily: f.css }}>
                {f.nombre}
              </span>
              <span className="cn-aju-opcion-nota">{f.nota}</span>
            </button>
          );
        })}
      </div>

      <p className="cn-aju-subtitulo">Densidad</p>
      <div className="cn-aju-segmentos" role="radiogroup" aria-label="Densidad">
        {DENSIDADES.map((d) => {
          const activa = prefs.density === d.valor;
          return (
            <button
              key={d.valor}
              type="button"
              role="radio"
              aria-checked={activa}
              onClick={() => cambiar({ density: d.valor })}
              className={`cn-aju-opcion${activa ? ' cn-aju-opcion--activa' : ''}`}
            >
              <span className="cn-aju-opcion-nombre">{d.titulo}</span>
              <span className="cn-aju-opcion-nota">{d.nota}</span>
            </button>
          );
        })}
      </div>
      <p className="cn-aju-ayuda">
        La densidad no cambia los tamaños de letra: cambia el espacio. El texto mínimo sigue siendo legible en las tres.
      </p>
    </section>
  );
};

/**
 * La miniatura de cada tema (:315). Sus colores son los de la maqueta y NO
 * siguen el tema: muestran cómo se verá cada opción, así que la de «Oscuro
 * siempre» tiene que verse oscura aunque la pantalla esté en claro. Para
 * «sigue al sistema» se parte en diagonal y muestra los dos a la vez, que es lo
 * que esa opción hace.
 */
const VistaPrevia: React.FC<{ tema: Theme }> = ({ tema }) => (
  <span className={`cn-aju-tema-muestra cn-aju-tema-muestra--${tema}`} aria-hidden="true">
    <span className="cn-aju-tema-raya cn-aju-tema-raya--larga" />
    <span className="cn-aju-tema-raya" />
    <span className="cn-aju-tema-raya cn-aju-tema-raya--media" />
  </span>
);
