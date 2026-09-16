import React from 'react';
import { readSession } from '../../auth/session';
import { useExpedientes } from '../useExpedientes';
import { SelectorDelFormulario } from '../../workspace/components/SelectorDelFormulario';
import {
  buscarCasos,
  filtrarPorRama,
  indexarCaso,
  opcionesDeRama,
  type CasoIndexado
} from '../services/buscarCasos';
import {
  CASOS_PARA_FILTRAR_POR_RAMA,
  anotarCasoAbierto,
  casosParaEscoger,
  casosRecientesDe
} from '../services/casosDelSelector';
import type { CasoBuscable } from '../types';

/*
 * El tipo de la opción se deduce del componente que se compone, en vez de
 * importarlo del archivo de otro módulo: la frontera de módulos prohíbe traer
 * tipos de componentes ajenos (scripts/check-module-boundaries.sh), no usarlos.
 */
type OpcionEnCascada = React.ComponentProps<typeof SelectorDelFormulario>['opciones'][number];

/**
 * «DE QUÉ CASO ES», UNA SOLA VEZ.
 *
 * ─── POR QUÉ EXISTE ────────────────────────────────────────────────────────
 *
 * Este control se escribió a mano cuatro veces en dos días —la revisión, la
 * agenda, y las dos barras de Redacción— y hacían falta dos más, para el
 * transcrito y la orientación. Seis copias de la misma lista, el mismo
 * «— sin expediente —», el mismo «solo si la firma tiene alguno», y la misma
 * carga silenciosa.
 *
 * Copiarlo una sexta vez es cómo se separan: la primera corrección se hace en
 * una y las otras cinco se quedan atrás, sin que nada falle. Es exactamente el
 * defecto que este proyecto ya documentó con las dos barras de configuración y
 * con el gancho de los adjuntos.
 *
 * LA CARGA DE LA LISTA VIVE EN `useExpedientes`, no aquí: las dos barras de
 * configuración de Redacción no caben en este bloque —su control es un
 * `Combobox` horizontal— y aun así comparten los datos. Se parte por donde de
 * verdad se comparte.
 *
 * ─── Y AHORA SE PUEDE ENCONTRAR UN CASO ENTRE DOSCIENTOS ───────────────────
 *
 * La lista salía tal como la devolvía el servidor —carátula y radicado— y se
 * filtraba por un «contiene» sobre esas dos cadenas. Con doce casos eso basta.
 * Con doscientos, el abogado escribía la cédula del cliente y no salía nada, el
 * radicado con guiones y tampoco, y acababa desplazándose por una lista que no
 * dice de quién es cada asunto.
 *
 * LAS REGLAS DE BÚSQUEDA SON LAS DE «MIS CASOS», no unas nuevas: se importan de
 * `services/buscarCasos.ts`. Cédula o NIT por dígitos y desde el principio
 * —puntos, espacios y guiones dan igual—, radicado con o sin guiones, nombre
 * del cliente, de la contraparte y de cada persona registrada, carátula,
 * despacho, y la rama por su código y por su nombre del catálogo. Escribir aquí
 * una segunda búsqueda es cómo se llega a que la lista encuentre por cédula y
 * el selector no.
 *
 * ─── AGRUPADO POR CLIENTE, Y LO DE ESTA MAÑANA ARRIBA ──────────────────────
 *
 * El orden y los grupos los decide `services/casosDelSelector.ts`, que también
 * explica por qué la recencia ordena los GRUPOS y no rompe la contigüidad de
 * uno. Aquí solo se pinta.
 *
 * ─── EL FILTRO DE RAMA SOLO APARECE CUANDO SIRVE ───────────────────────────
 *
 * Con ${CASOS_PARA_FILTRAR_POR_RAMA} casos o menos no se pinta: es un control
 * que ocupa sitio para ahorrar un desplazamiento en una lista que cabe en dos
 * pantallazos — el mismo criterio con que la lupa se apaga en las listas
 * cortas. Tampoco con una sola rama, que no filtra nada.
 *
 * ─── NO SE PINTA SI NO HAY EXPEDIENTES ─────────────────────────────────────
 *
 * Una firma que no ha creado ninguno vería un desplegable con una sola opción
 * —«sin expediente»— que no ofrece nada y enseña que sobra un campo. Mientras
 * carga tampoco se pinta: aparecer vacío y llenarse después mueve el
 * formulario bajo el cursor.
 *
 * ─── Y SU FALLO NO ES EL FALLO DE LA PANTALLA ──────────────────────────────
 *
 * Si la lista no se puede leer, el control desaparece y lo demás sigue: nadie
 * deja de redactar, de orientar ni de transcribir porque el catálogo de casos
 * no respondió. Atar es un extra; el trabajo es el trabajo.
 */

/** Cómo se nombra un caso en la lista nativa del teléfono y en la cara vieja. */
const rotuloDeLaFila = (fila: { rama: string; caso: CasoBuscable }): string =>
  fila.caso.radicado ? `${fila.rama} · ${fila.caso.radicado}` : fila.rama;

export const SelectorDeExpediente: React.FC<{
  valor: string;
  onCambio: (id: string) => void;
  /** Encima del control. Cambia según la pantalla: no es lo mismo un escrito que un audio. */
  etiqueta?: string;
  /** Debajo. Qué gana el abogado por atarlo aquí. */
  pie?: React.ReactNode;
  id?: string;
  /**
   * LA CARA NUEVA ES OPT-IN, POR PANTALLA. La agenda, el triaje y el diálogo de
   * subir audiencias todavía llevan la cara vieja y se rediseñan por su lado:
   * cambiarla aquí para todos les movería pantallas que nadie pidió tocar. La
   * lista, el «sin expediente» y la regla de no pintarse sin casos siguen
   * siendo UNA sola, que es la razón de ser de este componente.
   */
  cara?: 'vieja' | 'nueva';
}> = ({ valor, onCambio, etiqueta = 'De qué caso es', pie, id = 'expediente-del-trabajo', cara = 'vieja' }) => {
  const expedientes = useExpedientes();

  /*
   * QUIÉN ESTÁ SENTADO AQUÍ, leído de la sesión firmada y no del contexto de
   * inquilino: `useTenant()` LANZA fuera de su proveedor, y este control lo
   * montan seis pantallas de cuatro módulos. Un selector de casos que tumba el
   * diálogo que lo contiene sería peor que no recordar el orden. Se lee una vez.
   */
  const correo = React.useMemo(() => readSession()?.user.email ?? null, []);
  const [recientes, setRecientes] = React.useState<string[]>(() => casosRecientesDe(correo));

  const [filtro, setFiltro] = React.useState('');
  /** `null` es «Todas». */
  const [rama, setRama] = React.useState<string | null>(null);

  const indices = React.useMemo(() => expedientes.map((e) => indexarCaso(e)), [expedientes]);
  const ramas = React.useMemo(() => opcionesDeRama(indices, rama), [indices, rama]);
  const conFiltroDeRama = expedientes.length > CASOS_PARA_FILTRAR_POR_RAMA && ramas.length > 1;

  const filas = React.useMemo(() => {
    const porRama = filtrarPorRama<CasoIndexado<CasoBuscable>>(indices, conFiltroDeRama ? rama : null);
    /*
     * `buscarCasos` devuelve los casos, no sus índices; se vuelve al índice por
     * id para agrupar y ordenar sin recalcular la indexación, que es lo caro.
     */
    const porId = new Map(porRama.map((x) => [x.caso.id, x]));
    const encontrados = buscarCasos(porRama, filtro)
      .map((r) => porId.get(r.caso.id))
      .filter((x): x is CasoIndexado<CasoBuscable> => x !== undefined);
    return casosParaEscoger(encontrados, recientes);
  }, [indices, filtro, rama, conFiltroDeRama, recientes]);

  /*
   * «SIN EXPEDIENTE» VA SIEMPRE Y VA PRIMERO, también con la búsqueda escrita.
   * No es un resultado: es cómo se desata el trabajo del caso, y esconderlo
   * porque la palabra tecleada no coincide dejaría al abogado sin forma de
   * quitar el expediente que puso por error. No lleva grupo, así que se pinta
   * suelto encima del primer cliente.
   */
  const opciones: OpcionEnCascada[] = React.useMemo(
    () => [
      { valor: '', etiqueta: 'Sin expediente' },
      ...filas.map((f) => ({
        valor: f.caso.id,
        etiqueta: f.caso.caratula,
        grupo: { titulo: f.cliente },
        /* La rama primero —es de lo que trata el caso— y el radicado en mono: lo citable. */
        detalle: (
          <span className="cn-exp-sel-detalle">
            {f.rama}
            {f.caso.radicado && (
              <>
                {' · '}
                <span className="cn-red-mono">{f.caso.radicado}</span>
              </>
            )}
          </span>
        ),
        detalleTexto: rotuloDeLaFila(f)
      }))
    ],
    [filas]
  );

  /*
   * ESCOGER UN CASO LO SUBE EN LA LISTA LA PRÓXIMA VEZ. «Sin expediente» no
   * cuenta: desatar el trabajo no es haber abierto un caso.
   */
  const escoger = (nuevo: string): void => {
    if (nuevo) setRecientes(anotarCasoAbierto(correo, nuevo));
    onCambio(nuevo);
  };

  if (expedientes.length === 0) return null;

  if (cara === 'nueva') {
    return (
      <div className="cn-inf-bloque">
        <SelectorDelFormulario
          id={id}
          etiqueta={etiqueta}
          valor={valor}
          opciones={opciones}
          onChange={escoger}
          vacio="Sin expediente"
          busquedaControlada={{
            valor: filtro,
            onCambio: setFiltro,
            total: expedientes.length + 1,
            encima: (
              <>
                {conFiltroDeRama && (
                  <div className="cn-exp-sel-ramas" role="group" aria-label="Filtrar por rama">
                    <button
                      type="button"
                      onClick={() => setRama(null)}
                      className={`cn-exp-sel-rama ${rama === null ? 'cn-exp-sel-rama--puesta' : ''}`}
                      aria-pressed={rama === null}
                    >
                      Todas
                    </button>
                    {ramas.map((r) => (
                      <button
                        key={r.valor}
                        type="button"
                        onClick={() => setRama(r.valor)}
                        className={`cn-exp-sel-rama ${rama === r.valor ? 'cn-exp-sel-rama--puesta' : ''}`}
                        aria-pressed={rama === r.valor}
                      >
                        {r.etiqueta}
                      </button>
                    ))}
                  </div>
                )}
                {/*
                  NADA COINCIDE SE DICE CON LO QUE SE ESCRIBIÓ, y con la salida
                  al lado. Un desplegable que se queda con «Sin expediente» y
                  nada más se lee como «esta firma no tiene casos», que es
                  justamente lo contrario de lo que pasa.
                */}
                {filas.length === 0 && (
                  <p className="cn-exp-sel-vacio">
                    {filtro.trim() ? <>Ninguno coincide con «{filtro.trim()}»</> : 'Ninguno en esta rama'}
                    <button
                      type="button"
                      className="cn-exp-sel-ver-todos"
                      onClick={() => {
                        setFiltro('');
                        setRama(null);
                      }}
                    >
                      Ver todos
                    </button>
                  </p>
                )}
              </>
            )
          }}
          pie={`${expedientes.length} ${expedientes.length === 1 ? 'caso' : 'casos'} de la firma. Busque por el cliente, la cédula, el radicado o la carátula.`}
        />
        {pie && <p className="cn-inf-ayuda">{pie}</p>}
      </div>
    );
  }

  /*
   * LA CARA VIEJA CONSERVA LA LISTA DEL SISTEMA, y con ella los grupos: un
   * `<optgroup>` por cliente es de fábrica y no cuesta nada. Lo que no cabe en
   * una lista nativa es la caja de búsqueda y la fila de ramas —las pinta el
   * sistema operativo—, así que ahí el orden y la agrupación son toda la ayuda.
   */
  const porCliente: { cliente: string; filas: typeof filas }[] = [];
  for (const f of filas) {
    const ultimo = porCliente[porCliente.length - 1];
    if (ultimo && ultimo.cliente === f.cliente) ultimo.filas.push(f);
    else porCliente.push({ cliente: f.cliente, filas: [f] });
  }

  return (
    <div>
      <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">{etiqueta}</p>
      <label className="sr-only" htmlFor={id}>
        {etiqueta}
      </label>
      <select id={id} className="field mt-1.5" value={valor} onChange={(e) => escoger(e.target.value)}>
        <option value="">— sin expediente —</option>
        {porCliente.map((g) => (
          <optgroup key={g.cliente} label={g.cliente}>
            {g.filas.map((f) => (
              <option key={f.caso.id} value={f.caso.id}>
                {f.caso.caratula} · {rotuloDeLaFila(f)}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {pie && (
        <p className="mt-1 text-[11px] leading-snug text-ink-500 text-justify [text-wrap:pretty]">{pie}</p>
      )}
    </div>
  );
};
