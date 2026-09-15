import React from 'react';
import { BookMarked, Check, ChevronLeft } from 'lucide-react';
import type { MainView } from '../../tenant/types';
import { navModule } from '../../tenant/navigation';
import { PANTALLAS, recordado, recordar } from '../../tenant/pantallaRecordada';
import { NOVEDADES } from '../content/novedades';
import { entradaPorId } from '../content/manual';
import type { Novedad } from '../types';
import {
  agruparPorMes,
  alcanceDelPlan,
  esNueva,
  fechaLarga,
  fechaMasReciente,
  fechaNumerica,
  filtrarNovedades,
  modulosConNovedades,
  visiblesParaRol,
  type AlcanceDelPlan
} from '../novedades.logica';
import { marcarNovedadesVistas, vistasHasta } from '../useNovedades';

/**
 * Novedades (módulo 13): `public/handoff/app-novedades.html`.
 *
 * ─── DE DÓNDE SALE CADA ZONA ────────────────────────────────────────────────
 *
 * Cabecera con «Marcar todo como visto» :80 · filas con punto azul si no se ha
 * visto y gris si sí, título, insignia de plan y fecha a la derecha :131 ·
 * detalle con «volver», chip de tipo, fecha, título y cajas :191 · vacío con
 * el visto verde y «Ver todo lo que cambió» :281 · teléfono con el botón de
 * marcar anclado abajo :330. Una sola página para los dos tamaños: la
 * diferencia es CSS, y el filtro por módulo pasa de chips a un selector en el
 * teléfono porque dieciocho chips de 44 px son seis renglones antes de la
 * primera novedad.
 *
 * ─── LO QUE EL ARTBOARD DIBUJA Y AQUÍ NO ESTÁ, CON SU RAZÓN ────────────────
 *
 * · «3 escritos suyos se apoyaron en la versión anterior» y «Ver los 3
 *   escritos» (:104, :223): exige guardar en cada escrito la versión de la
 *   ficha con que se generó, y ese dato no existe. «Le afecta» se deriva de
 *   los módulos que el plan de la firma abre (`novedades.logica.ts`).
 * · «ANTES / AHORA» de un cambio normativo (:202): ninguna entrada guarda el
 *   valor anterior de una ficha; una tabla con uno inventado sería peor que
 *   no tenerla.
 * · El aviso por correo al socio administrador (:187, :276): no hay correo de
 *   novedades. La pantalla no lo promete.
 * · Secciones «Le afecta» / «Lo demás» como bloques ámbar: con la derivación
 *   por plan casi todo le afecta a una firma Premium, y cuarenta tarjetas
 *   ámbar dejarían de significar algo. Es un filtro, y la insignia de la fila
 *   dice «Su plan lo incluye» o «No lo abre su plan».
 *
 * ─── CARGA ─────────────────────────────────────────────────────────────────
 *
 * La lista viaja con la aplicación: no hay nada que esperar ni que pueda
 * fallar. Lo único que llega del servidor es el plan; mientras no llega, la
 * pantalla calla sobre el plan —ni filtro «Le afecta» ni insignias— en vez de
 * pintar un estado de carga.
 *
 * ─── «VISTO» ───────────────────────────────────────────────────────────────
 *
 * Se lee UNA vez al entrar qué había visto este navegador, así las filas
 * nuevas conservan su punto durante la visita. Se da por visto todo al SALIR
 * de la pantalla o al pulsar «Marcar todo como visto»: marcar al entrar
 * apagaba el contador del panel antes de que nadie leyera nada.
 */

interface NovedadesViewProps {
  /** `PlanDeFirma.modulosPermitidos`; `null` mientras el servidor no responde. */
  modulosPermitidos: readonly string[] | null;
  /** Superusuario: ve también lo de operación. */
  esOperador: boolean;
  /** Vistas que el plan oculta: su «Ir a…» no se ofrece. */
  ocultas: readonly MainView[];
  onIr: (vista: MainView) => void;
  onManual: (articuloId: string) => void;
}

const ETIQUETA_TIPO: Record<Novedad['tipo'], string> = {
  nuevo: 'Función nueva',
  mejora: 'Mejora',
  correccion: 'Corrección'
};

const INSIGNIA_DE_ALCANCE: Partial<Record<AlcanceDelPlan, { clase: string; texto: string }>> = {
  incluido: { clase: 'cn-nov-insignia--incluido', texto: 'Su plan lo incluye' },
  'no-incluido': { clase: 'cn-nov-insignia--fuera', texto: 'No lo abre su plan' }
};

const FRASE_DE_ALCANCE: Record<AlcanceDelPlan, string> = {
  incluido: 'Toca un módulo que su plan incluye.',
  'no-incluido': 'Ninguno de los módulos que toca está en su plan.',
  general: 'Es de toda la aplicación: le llega con cualquier plan.'
};

export const NovedadesView: React.FC<NovedadesViewProps> = ({
  modulosPermitidos,
  esOperador,
  ocultas,
  onIr,
  onManual
}) => {
  const raiz = React.useRef<HTMLDivElement>(null);
  const todas = React.useMemo(() => visiblesParaRol(NOVEDADES, esOperador), [esOperador]);
  const masReciente = React.useMemo(() => fechaMasReciente(todas), [todas]);

  const [vistasAntes, setVistasAntes] = React.useState<string | null>(() => vistasHasta());
  React.useEffect(() => () => marcarNovedadesVistas(), []);

  const [modulo, setModulo] = React.useState<MainView | null>(null);
  const [soloLeAfecta, setSoloLeAfecta] = React.useState(false);
  const [abiertaId, setAbiertaId] = React.useState<string | null>(() => recordado(PANTALLAS.novedad));
  const abierta = abiertaId ? todas.find((n) => n.id === abiertaId) : undefined;

  const abrir = React.useCallback((id: string | null) => {
    setAbiertaId(id);
    recordar(PANTALLAS.novedad, id);
    raiz.current?.scrollTo({ top: 0 });
  }, []);

  const nueva = (n: Novedad): boolean => esNueva(n.fecha, vistasAntes, masReciente);
  const visibles = filtrarNovedades(todas, { modulo, soloLeAfecta }, modulosPermitidos);
  const grupos = agruparPorMes(visibles);
  const nuevas = todas.filter(nueva).length;
  const modulosDelFiltro = modulosConNovedades(todas);

  const marcarTodo = (): void => {
    marcarNovedadesVistas();
    setVistasAntes(masReciente);
  };
  const verTodo = (): void => {
    setModulo(null);
    setSoloLeAfecta(false);
  };

  /* ─── Detalle ─────────────────────────────────────────────────────────── */
  if (abierta) {
    const alcance = alcanceDelPlan(abierta.modulos, modulosPermitidos);
    const articulo = abierta.comoUsarlo ? entradaPorId(abierta.comoUsarlo) : undefined;
    return (
      <div ref={raiz} data-visita="vista-novedades" className="cara-nueva cn-nov">
        <article className="cn-nov-pagina cn-nov-detalle">
          <button type="button" className="cn-nov-volver" onClick={() => abrir(null)}>
            <ChevronLeft className="cn-nov-icono" aria-hidden="true" />
            Novedades
          </button>
          <div className="cn-nov-detalle-meta">
            <span className={`cn-nov-tipo-chip cn-nov-tipo-chip--${abierta.tipo}`}>
              <span className="cn-nov-tipo-punto" aria-hidden="true" />
              {ETIQUETA_TIPO[abierta.tipo]}
            </span>
            <span className="cn-nov-fecha">{fechaLarga(abierta.fecha)}</span>
            {nueva(abierta) && <span className="cn-nov-insignia cn-nov-insignia--nueva">Nuevo</span>}
          </div>
          <h1 className="cn-nov-detalle-titulo">{abierta.titulo}</h1>
          <p className="cn-nov-detalle-texto">{abierta.queCambio}</p>

          <section className="cn-nov-caja" aria-labelledby="nov-donde">
            <h2 id="nov-donde" className="cn-nov-caja-titulo">
              Dónde está
            </h2>
            <ul className="cn-nov-modulos">
              {abierta.modulos.map((m) => {
                const { label, icon: Icono } = navModule(m);
                return (
                  <li key={m} className="cn-nov-modulo">
                    <span className="cn-nov-modulo-nombre">
                      <Icono className="cn-nov-icono" aria-hidden="true" />
                      {label}
                    </span>
                    {ocultas.includes(m) ? (
                      <span className="cn-nov-insignia cn-nov-insignia--fuera">No lo abre su plan</span>
                    ) : (
                      <button type="button" className="cn-nov-boton cn-nov-boton--suave" onClick={() => onIr(m)}>
                        Ir a {label}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
            {alcance && <p className="cn-nov-caja-texto">{FRASE_DE_ALCANCE[alcance]}</p>}
          </section>

          <div className="cn-nov-acciones">
            {articulo && (
              <button type="button" className="cn-nov-boton" onClick={() => onManual(articulo.articulo.id)}>
                <BookMarked className="cn-nov-icono" aria-hidden="true" />
                Cómo usarlo: {articulo.articulo.titulo}
              </button>
            )}
            <button type="button" className="cn-nov-boton cn-nov-boton--suave" onClick={() => abrir(null)}>
              Volver a la lista
            </button>
          </div>
        </article>
      </div>
    );
  }

  /* ─── Lista ───────────────────────────────────────────────────────────── */
  return (
    <div ref={raiz} data-visita="vista-novedades" className="cara-nueva cn-nov">
      <div className="cn-nov-pagina">
        <header className="cn-nov-cabeza">
          <div className="cn-nov-cabeza-textos">
            <h1 className="cn-nov-titulo">Novedades</h1>
            <p className="cn-nov-entradilla">Qué cambió en Iureon, y cuándo. Solo aparece lo que ya está en la aplicación.</p>
          </div>
          {nuevas > 0 && (
            <button type="button" className="cn-nov-boton cn-nov-boton--suave cn-nov-marcar" onClick={marcarTodo}>
              Marcar todo como visto
            </button>
          )}
        </header>

        <div className="cn-nov-filtros" role="group" aria-label="Filtrar novedades">
          <button
            type="button"
            className="cn-nov-chip"
            aria-pressed={modulo === null && !soloLeAfecta}
            onClick={verTodo}
          >
            Todas
          </button>
          {modulosPermitidos !== null && (
            <button
              type="button"
              className="cn-nov-chip cn-nov-chip--afecta"
              aria-pressed={soloLeAfecta}
              onClick={() => setSoloLeAfecta((v) => !v)}
              title="Cambios en módulos que su plan incluye o que son de toda la aplicación"
            >
              <span className="cn-nov-punto cn-nov-punto--afecta" aria-hidden="true" />
              Le afecta
            </button>
          )}
          {modulosDelFiltro.map((m) => (
            <button
              key={m}
              type="button"
              className="cn-nov-chip cn-nov-chip--modulo"
              aria-pressed={modulo === m}
              onClick={() => setModulo(modulo === m ? null : m)}
            >
              {navModule(m).label}
            </button>
          ))}
          <label className="cn-nov-select-rotulo">
            <span className="cn-nov-sr">Módulo</span>
            <select
              className="cn-nov-select"
              value={modulo ?? ''}
              onChange={(e) => setModulo(e.target.value ? (e.target.value as MainView) : null)}
            >
              <option value="">Todos los módulos</option>
              {modulosDelFiltro.map((m) => (
                <option key={m} value={m}>
                  {navModule(m).label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="cn-nov-resumen" aria-live="polite">
          {visibles.length} {visibles.length === 1 ? 'cambio' : 'cambios'}
          {soloLeAfecta && modulosPermitidos !== null ? ' que le afectan' : ''}
          {modulo ? ` en ${navModule(modulo).label}` : ''}
          {nuevas > 0 ? ` · ${nuevas} ${nuevas === 1 ? 'nuevo' : 'nuevos'} para usted` : ''}
        </p>

        {grupos.map((g) => (
          <section key={g.mes} className="cn-nov-mes" aria-label={g.mes}>
            <h2 className="cn-nov-mes-titulo">{g.mes}</h2>
            <ul className="cn-nov-lista">
              {g.entradas.map((n) => {
                const esNuevaParaUsted = nueva(n);
                const insignia = INSIGNIA_DE_ALCANCE[alcanceDelPlan(n.modulos, modulosPermitidos) ?? 'general'];
                return (
                  <li key={n.id}>
                    <button type="button" className="cn-nov-fila" onClick={() => abrir(n.id)}>
                      <span
                        className={`cn-nov-punto${esNuevaParaUsted ? ' cn-nov-punto--nueva' : ''}`}
                        aria-hidden="true"
                      />
                      <span className="cn-nov-fila-cuerpo">
                        <span className="cn-nov-fila-cabeza">
                          <span className="cn-nov-fila-titulo">{n.titulo}</span>
                          {esNuevaParaUsted && <span className="cn-nov-insignia cn-nov-insignia--nueva">Nuevo</span>}
                          {insignia && <span className={`cn-nov-insignia ${insignia.clase}`}>{insignia.texto}</span>}
                          {n.soloOperacion && <span className="cn-nov-insignia cn-nov-insignia--fuera">Operación</span>}
                        </span>
                        <span className="cn-nov-fila-meta">
                          <span className={`cn-nov-tipo cn-nov-tipo--${n.tipo}`}>{ETIQUETA_TIPO[n.tipo]}</span>
                          <span aria-hidden="true"> · </span>
                          {n.modulos.map((m) => navModule(m).label).join(', ')}
                        </span>
                        <span className="cn-nov-fila-texto">{n.queCambio}</span>
                      </span>
                      <span className="cn-nov-fecha cn-nov-fila-fecha">{fechaNumerica(n.fecha)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        {visibles.length === 0 && (
          <div className="cn-nov-vacio">
            <span className="cn-nov-vacio-icono" aria-hidden="true">
              <Check className="cn-nov-icono" />
            </span>
            <h2 className="cn-nov-vacio-titulo">{soloLeAfecta ? 'Nada que le afecte' : 'Sin cambios en este módulo'}</h2>
            <p className="cn-nov-vacio-texto">
              {soloLeAfecta
                ? `Ningún cambio registrado${modulo ? ` en ${navModule(modulo).label}` : ''} toca los módulos que su plan incluye.`
                : `Todavía no hay cambios registrados${modulo ? ` en ${navModule(modulo).label}` : ''}.`}
            </p>
            <button type="button" className="cn-nov-boton cn-nov-boton--suave" onClick={verTodo}>
              Ver todo lo que cambió
            </button>
          </div>
        )}

        <p className="cn-nov-nota">
          «Nuevo» marca lo que no había visto en este navegador desde su última visita; la primera vez, lo de los
          últimos 30 días. Queda visto al salir de Novedades o con «Marcar todo como visto».
          {modulosPermitidos !== null &&
            ' «Le afecta» quiere decir que el cambio toca un módulo que su plan incluye o que es de toda la aplicación.'}
        </p>
      </div>

      {nuevas > 0 && (
        <div className="cn-nov-pie-movil">
          <button type="button" className="cn-nov-boton cn-nov-boton--suave cn-nov-boton--ancho" onClick={marcarTodo}>
            Marcar todo como visto
          </button>
        </div>
      )}
    </div>
  );
};
