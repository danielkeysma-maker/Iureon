import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { ProceduralTermsModal } from '../../procedural-terms/components/ProceduralTermsModal';
import { LaborSettlementModal } from '../../settlements/components/LaborSettlementModal';
import { LegalSearchGlossaryModal } from '../../search/components/LegalSearchGlossaryModal';
import { IndexacionModal } from './IndexacionModal';
import { InteresesModal } from './InteresesModal';
import { CuantiaModal } from './CuantiaModal';
import { CalendarioModal } from './CalendarioModal';
import { PANTALLAS, recordado, recordar } from '../../tenant/pantallaRecordada';

/**
 * Herramientas. Retícula de siete tarjetas con lámina, según la maqueta que el
 * titular dejó en `public/herramientas-modulo.html`.
 *
 * ─── QUÉ SE TOMÓ DE LA MAQUETA Y QUÉ NO ─────────────────────────────────────
 *
 * Se toma la forma: cejilla, título grande, control segmentado de filtros,
 * retícula de siete tarjetas —la primera ancha, la segunda en tinta, la sexta
 * destacada—, número en oro, lámina dibujada con cajas, y el pie de cada
 * tarjeta con la fuente, la insignia «Excel» y «Abrir». En el teléfono, la
 * primera tarjeta completa y las demás como filas con miniatura de 88px.
 *
 * NO se toma el papel crema (#F7F5EF). El titular pidió expresamente que el
 * fondo siga blanco: donde la maqueta pone crema —el segmentado, las etiquetas,
 * el fondo de las láminas, las píldoras del teléfono y la tarjeta 06 entera—
 * aquí va `surface` o `canvas`, el gris muy claro del sistema. La tarjeta en
 * tinta sí se conserva: es tinta, no crema, y usa `nav-900`, que sigue siendo
 * oscuro en los dos temas — `rail-ink` se aclara en oscuro y habría dado una
 * tarjeta clara con letra clara.
 *
 * NO se toma el numeral «09» de la cejilla. El número de módulo lo calcula la
 * barra lateral contando solo lo que el plan deja ver: para una firma Esencial
 * —sin Audiencias, Entrevistas ni Orientación— Herramientas es la 06, no la 09.
 * Escribirlo aquí a mano contradiría al índice justo para quien menos módulos
 * tiene. La cejilla lleva la palabra y el número de utilidades, que es cierto
 * siempre.
 *
 * NO se toma el botón «Nueva liquidación»: esa acción no existe. Lo que sí
 * existe, y ya estaba en esta pantalla, es la búsqueda por nombre o por lo que
 * se necesita calcular; ocupa el sitio del botón principal.
 *
 * ─── LOS FILTROS SON LOS GRUPOS REALES, NO LOS DE LA MAQUETA ────────────────
 *
 * La maqueta ofrece «Todas · Términos · Dinero». El glosario no cae en ninguno
 * de los dos, y forzarlo sería mentir sobre lo que hace; se agrega el tercer
 * grupo que esta pantalla ya usaba —Referencia—, en vez de meterlo con calzador.
 *
 * ─── CADA UTILIDAD DECLARA SU FUENTE, Y LA FUENTE ES LA DEL MÓDULO ──────────
 *
 * El texto de la fuente de cada tarjeta es el que esta pantalla ya declaraba, no
 * el de la maqueta: donde la maqueta atribuía una norma distinta, manda el
 * módulo. Ninguna norma, artículo ni entidad se escribe aquí que no estuviera
 * ya verificada en el producto.
 *
 * ─── LA INSIGNIA «EXCEL» SOLO DONDE LA EXPORTACIÓN EXISTE ───────────────────
 *
 * Seis calculadoras llaman a `exportarExcel`; el glosario no exporta nada
 * porque no calcula nada. Su tarjeta no lleva la insignia.
 *
 * ─── LO QUE EL ARTBOARD 2d LISTA Y AQUÍ NO ESTÁ ─────────────────────────────
 *
 * Ejecutoria con traslados: exige modelar cada recurso con su término y su
 * forma de notificación, y no está construida. Pintarla como tarjeta muerta
 * sería una promesa. Se declara en el pie, y se agrega cuando exista.
 */

type Grupo = 'terminos' | 'dinero' | 'referencia';
type Variante = 'ancha' | 'tinta' | 'destacada' | 'normal';

interface Utilidad {
  id: string;
  numero: string;
  nombre: string;
  queHace: string;
  fuente: { texto: string; verificada: boolean };
  /** Solo si la calculadora llama de verdad a `exportarExcel`. */
  excel: boolean;
  grupo: Grupo;
  variante: Variante;
  lamina: React.ReactNode;
  abrir: () => void;
}

/*
 * ─── LAS LÁMINAS ────────────────────────────────────────────────────────────
 *
 * Gráficos de marca dibujados con cajas: calendario, barras, escalones, tramos,
 * umbrales, año y glosario. Sin fotografía, sin SVG y sin una sola dependencia
 * nueva — son `div` con clases del sistema. Los colores salen de los tokens:
 * `rail-gold` es el mismo oro en los dos temas y `ink-900` se invierte solo.
 *
 * Lo que la maqueta llama «motivos que no caben en 88px» se resuelve con
 * `hidden md:…` y variantes de tamaño, no con una segunda lámina: en la fila del
 * teléfono se esconden leyendas, rótulos y las celdas sobrantes.
 */

const CELDA = 'rounded-[3px]';

const LaminaDias: React.FC = () => (
  <>
    <div className="grid grid-cols-7 gap-1 md:gap-1.5">
      {Array.from({ length: 21 }).map((_, i) => {
        const finDeSemana = i % 7 >= 5;
        const notificacion = i === 3;
        const vence = i === 16;
        return (
          <span
            key={i}
            className={[
              CELDA,
              'h-3 md:h-[26px]',
              i >= 14 ? 'hidden md:block' : '',
              vence
                ? 'bg-[rgb(var(--rail-gold))] ring-[3px] ring-[rgb(var(--rail-gold)/0.25)]'
                : notificacion
                  ? 'bg-ink-900'
                  : finDeSemana
                    ? 'bg-[rgb(var(--rail-gold)/0.28)]'
                    : 'bg-ink-900/[0.07]'
            ].join(' ')}
          />
        );
      })}
    </div>
    <div className="hidden flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-ink-500 md:flex">
      <span className="inline-flex items-center gap-1.5">
        <b className={`${CELDA} inline-block h-2.5 w-2.5 bg-ink-900`} />
        NOTIFICACIÓN
      </span>
      <span className="inline-flex items-center gap-1.5">
        <b className={`${CELDA} inline-block h-2.5 w-2.5 bg-[rgb(var(--rail-gold)/0.28)]`} />
        NO HÁBIL
      </span>
      <span className="inline-flex items-center gap-1.5">
        <b className={`${CELDA} inline-block h-2.5 w-2.5 bg-[rgb(var(--rail-gold))]`} />
        VENCE
      </span>
    </div>
  </>
);

const BARRAS: Array<{ rotulo: string; ancho: string; tono: string }> = [
  { rotulo: 'CESANT.', ancho: '78%', tono: 'bg-[rgb(var(--rail-gold))]' },
  { rotulo: 'INTERES.', ancho: '34%', tono: 'bg-white/55' },
  { rotulo: 'PRIMA', ancho: '58%', tono: 'bg-white/30' },
  { rotulo: 'VACAC.', ancho: '44%', tono: 'bg-white/20' }
];

const LaminaBarras: React.FC = () => (
  <div className="grid gap-1.5 md:gap-2">
    {BARRAS.map((b) => (
      <div key={b.rotulo} className="flex items-center gap-2">
        <span className="hidden w-[52px] shrink-0 font-mono text-[10px] text-white/80 md:block">
          {b.rotulo}
        </span>
        <span className={`h-2 rounded-full md:h-3 ${b.tono}`} style={{ width: b.ancho }} />
      </div>
    ))}
  </div>
);

const ESCALONES = ['24%', '33%', '30%', '46%', '57%', '52%', '72%', '88%'];

const LaminaEscalones: React.FC = () => (
  <div className="flex h-full items-end gap-1 md:gap-[7px]">
    {ESCALONES.map((alto, i) => (
      <span
        key={`${alto}-${i}`}
        style={{ height: alto }}
        className={[
          'flex-1 rounded-t-[4px]',
          i >= 6 ? 'hidden md:block' : '',
          i === 7
            ? 'bg-ink-900'
            : i === 6
              ? 'bg-[rgb(var(--rail-gold))]'
              : i >= 4
                ? 'bg-[rgb(var(--rail-gold)/0.4)]'
                : 'bg-ink-900/[0.12]'
        ].join(' ')}
      />
    ))}
  </div>
);

const LaminaTramos: React.FC = () => (
  <>
    <div className="flex items-center gap-1">
      <span className="h-2 flex-[2] rounded-l-full bg-ink-900/10 md:h-3.5" />
      <span className="h-2 flex-[2] bg-[rgb(var(--rail-gold)/0.3)] md:h-3.5" />
      <span className="h-2 flex-[3] bg-[rgb(var(--rail-gold)/0.55)] md:h-3.5" />
      <span className="h-2 flex-[4] rounded-r-full bg-[rgb(var(--rail-gold))] md:h-3.5" />
    </div>
    <div className="hidden justify-between font-mono text-[10px] text-ink-500 md:flex">
      <span>TRAMO 1</span>
      <span>2</span>
      <span>3</span>
      <span>TASA VIGENTE</span>
    </div>
    <div className="hidden h-px bg-ink-900/10 md:block" />
    <div className="hidden items-baseline gap-2 font-mono text-[10px] text-ink-500 md:flex">
      <span>MORA ACUMULADA</span>
      <i className="min-w-0 flex-1 border-b border-dashed border-ink-900/20" />
      <b className="text-ink-900">$ —</b>
    </div>
  </>
);

const UMBRALES: Array<{ rotulo: string; juez: string; activo: boolean }> = [
  { rotulo: 'MÍNIMA', juez: 'MUNICIPAL', activo: false },
  { rotulo: 'MENOR', juez: 'MUNICIPAL', activo: false },
  { rotulo: 'MAYOR', juez: 'CIRCUITO', activo: true }
];

const LaminaUmbrales: React.FC = () => (
  <div className="grid gap-1 md:gap-2">
    {UMBRALES.map((u) => (
      <div
        key={u.rotulo}
        className={[
          'flex min-w-0 items-center gap-2 rounded-control px-2 font-mono text-[10px] md:gap-2.5 md:px-3',
          u.activo
            ? 'bg-ink-900 py-1.5 text-canvas ring-[3px] ring-[rgb(var(--rail-gold)/0.22)] md:py-2.5'
            : 'bg-ink-900/[0.05] py-1 text-ink-500 md:py-2'
        ].join(' ')}
      >
        <b
          className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
            u.activo ? 'bg-[rgb(var(--rail-gold))]' : 'bg-ink-900/25'
          }`}
        />
        {u.rotulo}
        <span
          className={`ml-auto hidden md:inline ${u.activo ? 'text-canvas/75' : ''}`}
        >
          {u.juez}
        </span>
      </div>
    ))}
  </div>
);

const LaminaAno: React.FC = () => (
  <>
    <div className="grid grid-cols-6 gap-1 md:grid-cols-12 md:gap-[5px]">
      {Array.from({ length: 24 }).map((_, i) => {
        const segundaFila = i >= 12;
        const vacancia = i === 3 || i === 11 || i === 18;
        const marca = i === 6;
        return (
          <span
            key={i}
            className={[
              CELDA,
              'h-3 md:h-4',
              segundaFila ? 'hidden md:block' : '',
              marca
                ? 'bg-ink-900'
                : vacancia
                  ? 'bg-[rgb(var(--rail-gold)/0.35)]'
                  : segundaFila
                    ? 'bg-ink-900/[0.05]'
                    : 'bg-ink-900/[0.09]'
            ].join(' ')}
          />
        );
      })}
    </div>
    <div className="hidden justify-between font-mono text-[10px] text-ink-500 md:flex">
      <span>ENE</span>
      <span>ABR</span>
      <span>JUL</span>
      <span>OCT</span>
      <span>DIC</span>
    </div>
  </>
);

const ENTRADAS: Array<{ termino: string; definicion: string; tono: string; ultima: boolean }> = [
  { termino: '44%', definicion: '88%', tono: 'bg-ink-900', ultima: false },
  { termino: '32%', definicion: '74%', tono: 'bg-[rgb(var(--rail-gold))]', ultima: false },
  { termino: '38%', definicion: '60%', tono: 'bg-ink-900/35', ultima: true }
];

const LaminaGlosario: React.FC = () => (
  <>
    <div className="hidden gap-2 font-mono text-[10px] text-ink-500 md:flex">
      {['A', 'B', 'C', 'D', 'E', 'F', '…', 'Z'].map((l) => (
        <span
          key={l}
          className={
            l === 'C'
              ? 'border-b-2 border-[rgb(var(--rail-gold))] pb-0.5 font-bold text-ink-900'
              : ''
          }
        >
          {l}
        </span>
      ))}
    </div>
    <div className="grid gap-1.5 md:gap-2.5">
      {ENTRADAS.map((e) => (
        <div key={e.termino} className={`grid gap-1 ${e.ultima ? 'hidden md:grid' : ''}`}>
          <span
            className={`h-[7px] rounded-full md:h-[9px] ${e.tono}`}
            style={{ width: e.termino }}
          />
          <span className="h-1.5 rounded-full bg-ink-900/[0.14]" style={{ width: e.definicion }} />
        </div>
      ))}
    </div>
  </>
);

const FILTROS: Array<{ id: Grupo | 'todas'; etiqueta: string }> = [
  { id: 'todas', etiqueta: 'Todas' },
  { id: 'terminos', etiqueta: 'Términos' },
  { id: 'dinero', etiqueta: 'Dinero' },
  { id: 'referencia', etiqueta: 'Referencia' }
];

export const ToolsView: React.FC = () => {
  /*
   * The calculator that was open survives a reload: its id is remembered when
   * it opens and forgotten when it closes. An id that matches no calculator
   * (an old one, a typo) opens nothing and the grid is what shows.
   */
  const [recordada] = useState(() => recordado(PANTALLAS.herramienta));
  const [terminosAbierto, setTerminosAbierto] = useState(recordada === 'terminos');
  const [liquidacionAbierta, setLiquidacionAbierta] = useState(recordada === 'liquidacion');
  const [glosarioAbierto, setGlosarioAbierto] = useState(recordada === 'glosario');
  const [indexacionAbierta, setIndexacionAbierta] = useState(recordada === 'indexacion');
  const [interesesAbiertos, setInteresesAbiertos] = useState(recordada === 'intereses');
  const [cuantiaAbierta, setCuantiaAbierta] = useState(recordada === 'cuantia');
  const [calendarioAbierto, setCalendarioAbierto] = useState(recordada === 'calendario');
  const abrir = (id: string, set: (v: boolean) => void) => () => {
    set(true);
    recordar(PANTALLAS.herramienta, id);
  };
  const cerrar = (set: (v: boolean) => void) => () => {
    set(false);
    recordar(PANTALLAS.herramienta, null);
  };
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<Grupo | 'todas'>('todas');

  const utilidades: Utilidad[] = [
    {
      id: 'terminos',
      numero: '01',
      nombre: 'Contador de términos',
      queHace:
        'Cuenta el término desde la fecha de partida en días hábiles, descuenta los festivos y la vacancia, y muestra qué descontó y por qué.',
      /*
       * Los festivos ya no son una tabla de un año: se calculan de la
       * Ley 51 de 1983 (fechas fijas, traslado al lunes, Pascua), así que
       * cualquier año desde 1984 tiene calendario, y la fuente es la ley.
       */
      fuente: {
        texto: 'Festivos calculados de la Ley 51 de 1983 · vacancia judicial (CGP art. 118)',
        verificada: true
      },
      excel: true,
      grupo: 'terminos',
      variante: 'ancha',
      lamina: <LaminaDias />,
      abrir: abrir('terminos', setTerminosAbierto)
    },
    {
      id: 'liquidacion',
      numero: '02',
      nombre: 'Liquidación de prestaciones',
      queHace:
        'Cesantías, intereses, prima, vacaciones e indemnización desde el salario y las fechas del contrato, cada una con su norma.',
      fuente: { texto: 'Fórmula general del CST · salario fijo', verificada: true },
      excel: true,
      grupo: 'dinero',
      variante: 'tinta',
      lamina: <LaminaBarras />,
      abrir: abrir('liquidacion', setLiquidacionAbierta)
    },
    {
      id: 'indexacion',
      numero: '03',
      nombre: 'Indexación por IPC',
      queHace:
        'Actualiza un valor histórico con la fórmula valor × (IPC final ÷ IPC inicial), con los índices que usted toma de la página oficial.',
      fuente: {
        texto: 'Índices que usted toma de la página del IPC del DANE · sin tabla propia',
        verificada: true
      },
      excel: true,
      grupo: 'dinero',
      variante: 'normal',
      lamina: <LaminaEscalones />,
      abrir: abrir('indexacion', setIndexacionAbierta)
    },
    {
      id: 'intereses',
      numero: '04',
      nombre: 'Intereses de mora',
      queHace: 'Mora comercial (1,5 × IBC), legal civil (6 %) o pactada, con control de usura.',
      /*
       * La tasa certificada cambia cada mes: se prellena solo la última
       * verificada, con su mes, y el resto la escribe el abogado.
       */
      fuente: {
        texto:
          'C.Co. art. 884 · C.C. art. 1617 · C.P. art. 305 · IBC certificado que usted ingresa (Superfinanciera)',
        verificada: true
      },
      excel: true,
      grupo: 'dinero',
      variante: 'normal',
      lamina: <LaminaTramos />,
      abrir: abrir('intereses', setInteresesAbiertos)
    },
    {
      id: 'cuantia',
      numero: '05',
      nombre: 'Competencia por cuantía',
      queHace:
        'Mínima, menor o mayor cuantía y el juez competente, con el SMLMV del año de presentación.',
      fuente: {
        texto:
          'CGP arts. 17, 18, 20, 25 y 26 · SMLMV 2020–2026 por decreto · laboral Ley 2452 de 2025 art. 13',
        verificada: true
      },
      excel: true,
      grupo: 'dinero',
      variante: 'normal',
      lamina: <LaminaUmbrales />,
      abrir: abrir('cuantia', setCuantiaAbierta)
    },
    {
      id: 'calendario',
      numero: '06',
      nombre: 'Calendario judicial',
      queHace:
        'Los 18 festivos del año con su regla, la vacancia judicial y la Semana Santa, año por año.',
      fuente: {
        texto:
          'Ley 51 de 1983 · CGP art. 118 · Semana Santa completa solo si el acuerdo del año lo dice',
        verificada: true
      },
      excel: true,
      grupo: 'terminos',
      variante: 'destacada',
      lamina: <LaminaAno />,
      abrir: abrir('calendario', setCalendarioAbierto)
    },
    {
      id: 'glosario',
      numero: '07',
      nombre: 'Glosario jurídico',
      queHace: 'Términos leídos del catálogo verificado, cada uno con su norma y su fuente.',
      /*
       * Derivado del catálogo — el modal lee searchGlossary, no fichas a
       * mano. El glosario manual que vivía en esta pantalla se eliminó: su
       * propio historial registra una ficha que citaba un código derogado.
       */
      fuente: {
        texto: 'Derivado del catálogo verificado, con la URL de cada norma',
        verificada: true
      },
      excel: false,
      grupo: 'referencia',
      variante: 'normal',
      lamina: <LaminaGlosario />,
      abrir: abrir('glosario', setGlosarioAbierto)
    }
  ];

  const q = busqueda.trim().toLowerCase();
  const visibles = utilidades.filter(
    (u) =>
      (filtro === 'todas' || u.grupo === filtro) &&
      (!q || u.nombre.toLowerCase().includes(q) || u.queHace.toLowerCase().includes(q))
  );

  const cuentaDe = (id: Grupo | 'todas'): number =>
    id === 'todas' ? utilidades.length : utilidades.filter((u) => u.grupo === id).length;

  return (
    /*
      `min-w-0` NO ES ADORNO: SIN ÉL LA PANTALLA MIDE DE MÁS EN UN TELÉFONO.

      Esta columna es un ítem flex y nace con `min-width: auto`, es decir «no me
      encojas por debajo de mi contenido». Cualquier mínimo de dentro —la fila de
      filtros, una lámina, un rótulo— sube por los contenedores hasta aquí y la
      columna mide de más; la página no desborda, porque la raíz recorta, y
      simplemente faltan píxeles por la derecha, en silencio. Medido a 320, 360 y
      393 con los dos barridos de `design/ANCHO-EN-MOVIL.md`.
    */
    <div
      data-visita="vista-tools"
      className="flex h-full min-h-0 min-w-0 flex-1 flex-col bg-canvas font-sans"
    >
      <ProceduralTermsModal isOpen={terminosAbierto} onClose={cerrar(setTerminosAbierto)} />
      <LaborSettlementModal isOpen={liquidacionAbierta} onClose={cerrar(setLiquidacionAbierta)} />
      <LegalSearchGlossaryModal isOpen={glosarioAbierto} onClose={cerrar(setGlosarioAbierto)} />
      <IndexacionModal isOpen={indexacionAbierta} onClose={cerrar(setIndexacionAbierta)} />
      <InteresesModal isOpen={interesesAbiertos} onClose={cerrar(setInteresesAbiertos)} />
      <CuantiaModal isOpen={cuantiaAbierta} onClose={cerrar(setCuantiaAbierta)} />
      <CalendarioModal isOpen={calendarioAbierto} onClose={cerrar(setCalendarioAbierto)} />

      {/*
        LA CABECERA DE LA MAQUETA, CON LOS CONTROLES QUE SON VERDAD. Cejilla,
        título grande, párrafo de dos líneas y, a la derecha, el segmentado y la
        búsqueda. En el teléfono todo baja a renglones propios: el bloque del
        título es `flex-1` —base 0— y nunca fuerza el salto por sí solo, así que
        los dos controles llevan `w-full sm:w-auto`, que sí obliga a envolver.
      */}
      <header className="flex shrink-0 flex-wrap items-end gap-x-3 gap-y-2.5 border-b border-line-200 bg-surface px-4 py-3.5 sm:px-5">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink-400">
              Herramientas
            </span>
            <span className="font-mono text-[10.5px] text-[rgb(var(--rail-gold-ink))]">
              {utilidades.length} utilidades
            </span>
          </div>
          <h1 className="text-title text-ink-900">Cálculos con su fuente, listos para el expediente.</h1>
          <p className="mt-1 max-w-[62ch] text-meta text-ink-500 text-justify">
            Seis calculadoras y un glosario. Cada una dice de qué norma sale su cifra antes de
            abrirla, y las seis que calculan se exportan a Excel con su hoja de fuentes.
          </p>
        </div>

        {/*
          EL SEGMENTADO SE DESPLAZA EN VEZ DE ENCOGER. Cuatro etiquetas con su
          relleno propio no bajan de su ancho, y a 320px la última quedaría medio
          borrada: una pestaña a la que hay que deslizarse se lee, una cortada no.
        */}
        <div className="w-full min-w-0 overflow-x-auto sm:w-auto">
          <div className="inline-flex gap-1 rounded-card bg-canvas p-1">
            {FILTROS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFiltro(f.id)}
                aria-current={filtro === f.id ? 'true' : undefined}
                className={`shrink-0 whitespace-nowrap rounded-control px-3 py-1.5 text-ui transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/40 ${
                  filtro === f.id
                    ? 'bg-surface font-semibold text-ink-900 shadow-e1'
                    : 'text-ink-500 hover:text-ink-900'
                }`}
              >
                {f.etiqueta}
                <span className="ml-1.5 font-mono text-[10.5px] text-ink-400">{cuentaDe(f.id)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full sm:w-auto">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Por nombre o por lo que necesita calcular"
            className="field w-full pl-8 sm:w-[260px]"
          />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
        <div className="mx-auto min-w-0 max-w-6xl">
          {visibles.length === 0 && (
            <p className="card py-8 text-center text-meta text-ink-500">
              Ninguna utilidad coincide con esa búsqueda.
            </p>
          )}

          {/*
            LA RETÍCULA DE LA MAQUETA: tres columnas en grande, dos en el
            intermedio, una en el teléfono. La primera tarjeta ocupa dos columnas
            y reparte lámina y texto en horizontal solo cuando hay tres.
          */}
          <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visibles.map((u) => (
              <TarjetaUtilidad key={u.id} u={u} />
            ))}
          </div>

          {/*
            LO QUE FALTA, DICHO EN LA PANTALLA. Una tarjeta muerta prometería una
            calculadora que no calcula; la ausencia se declara en su lugar.
          */}
          <p className="mt-4 border-t border-line-200 pt-3 text-meta leading-[1.6] text-ink-400 text-justify">
            Las herramientas no consumen saldo y van incluidas en todos los planes. Un resultado es
            un cálculo, no un dictamen: revíselo antes de radicar. El cómputo de ejecutoria con
            traslados se agrega cuando esté construido y verificado — no antes.
          </p>
        </div>
      </div>
    </div>
  );
};

/*
 * ─── LA TARJETA ─────────────────────────────────────────────────────────────
 *
 * Una sola tarjeta sirve las dos formas de la maqueta, con variantes de clase y
 * no con dos componentes: en el teléfono, la primera va completa —lámina arriba,
 * texto debajo— y las demás son filas de miniatura de 88px y texto. Desde `md`
 * todas son tarjetas con la lámina encima.
 *
 * La tarjeta ENTERA es el botón que abre la calculadora: era una fila-botón
 * antes y lo sigue siendo, así que «Abrir» es el rótulo de lo que ya ocurre al
 * pulsar, no un segundo control anidado — un botón dentro de otro no es HTML
 * válido y el teclado lo delata.
 */
const TarjetaUtilidad: React.FC<{ u: Utilidad }> = ({ u }) => {
  const ancha = u.variante === 'ancha';
  const tinta = u.variante === 'tinta';
  const destacada = u.variante === 'destacada';

  const fondo = tinta
    ? 'border-transparent bg-nav'
    : destacada
      ? 'border-[rgb(var(--rail-gold)/0.4)] bg-canvas'
      : 'border-line-200 bg-surface';

  const laminaFondo = tinta
    ? 'bg-[linear-gradient(160deg,rgb(var(--rail-gold)/0.16),transparent_60%)]'
    : destacada
      ? 'bg-surface'
      : 'bg-canvas';

  return (
    <button
      type="button"
      onClick={u.abrir}
      className={[
        'min-w-0 overflow-hidden rounded-card border text-left [overflow-wrap:anywhere]',
        'transition-colors hover:border-[rgb(var(--rail-gold)/0.55)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/40',
        fondo,
        ancha
          ? 'flex flex-col md:col-span-2 xl:grid xl:grid-cols-[minmax(200px,36%)_minmax(0,1fr)]'
          : 'grid grid-cols-[88px_minmax(0,1fr)] items-center gap-3 p-3 md:flex md:flex-col md:items-stretch md:gap-0 md:p-0'
      ].join(' ')}
    >
      <div
        className={[
          'flex min-w-0 flex-col justify-center gap-2 overflow-hidden',
          laminaFondo,
          ancha
            ? 'h-[132px] w-full p-4 md:h-[164px] md:p-5 xl:h-full xl:justify-between'
            : 'h-[88px] w-[88px] rounded-control p-2.5 md:h-[164px] md:w-full md:shrink-0 md:rounded-none md:p-5'
        ].join(' ')}
      >
        {u.lamina}
      </div>

      <div
        className={[
          'flex min-w-0 flex-1 flex-col gap-1.5',
          ancha ? 'p-4 md:gap-2.5 md:p-5' : 'p-0 md:gap-2 md:p-4'
        ].join(' ')}
      >
        <div className="flex min-w-0 items-baseline gap-2.5">
          <span
            className={`shrink-0 font-mono text-[11px] font-semibold ${
              tinta ? 'text-[rgb(var(--rail-gold))]' : 'text-[rgb(var(--rail-gold-ink))]'
            }`}
          >
            {u.numero}
          </span>
          <h2
            className={`min-w-0 ${
              ancha ? 'text-subtitle' : 'text-ui font-semibold md:text-subtitle'
            } ${tinta ? 'text-white' : 'text-ink-900'}`}
          >
            {u.nombre}
          </h2>
        </div>

        <p
          className={`text-meta leading-[1.55] text-justify ${
            tinta ? 'text-white/70' : 'text-ink-500'
          }`}
        >
          {u.queHace}
        </p>

        {/* La fuente, legible SIN abrir la calculadora: es la regla del catálogo. */}
        <div
          className={`mt-auto flex flex-col gap-1.5 pt-2 md:gap-2 md:border-t md:pt-3 ${
            tinta ? 'md:border-white/10' : 'md:border-line-100'
          }`}
        >
          <p
            className={`font-mono text-[10.5px] leading-[1.5] ${
              tinta ? 'text-white/60' : 'text-ink-400'
            }`}
          >
            Fuente: {u.fuente.texto}
          </p>
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            {/* Tres estados, fuera del catálogo: el estado de la fuente ANTES de abrir. */}
            <span className={u.fuente.verificada ? 'chip-verified' : 'chip-unverified'}>
              {u.fuente.verificada ? 'Fuente declarada' : 'Sin verificar'}
            </span>
            {u.excel && (
              <span
                className={`rounded-full px-2 py-[3px] font-mono text-[11px] font-semibold uppercase tracking-[0.07em] ${
                  tinta
                    ? 'bg-[rgb(var(--rail-gold)/0.22)] text-[rgb(var(--rail-gold))]'
                    : 'bg-[rgb(var(--rail-gold)/0.16)] text-[rgb(var(--rail-gold-ink))]'
                }`}
              >
                Excel
              </span>
            )}
            <span
              className={`ml-auto hidden text-ui font-semibold md:inline ${
                tinta ? 'text-white' : 'text-brand-700'
              }`}
            >
              Abrir
            </span>
          </div>
        </div>
      </div>
    </button>
  );
};
