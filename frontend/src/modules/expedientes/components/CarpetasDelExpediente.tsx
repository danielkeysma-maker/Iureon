import React from 'react';
import {
  AlertCircle,
  ChevronRight,
  EllipsisVertical,
  FileText,
  Folder,
  LayoutGrid,
  ListTree,
  Plus,
  Rows3,
  Search
} from 'lucide-react';
import { Dialog } from '../../../design/Dialog';
import { ConfirmarDialog, type Confirmacion } from '../../../design/ConfirmarDialog';
import { LeerDocumentoIndexado } from './LeerDocumentoIndexado';
import { MenuDeAcciones, type AccionDelMenu, type PosicionDelMenu } from './MenuDeAcciones';
import { expedientesApi, type Carpeta, type DocumentoIndexado } from '../services/expedientes.api';
import {
  MOTIVO_EN_PALABRAS,
  destinosDeCarpeta,
  destinosDeDocumento,
  enPalabrasElResumen,
  resumenDeCarpeta,
  rutaDe,
  textoDelBorrado,
  type ContenidoParaBorrar,
  type Destino
} from '../services/casoEnPantalla';
import type { ExpedienteConDetalle } from '../types';

/**
 * LAS CARPETAS DEL EXPEDIENTE, Y LO QUE HAY EN CADA UNA.
 *
 * Maqueta: `public/handoff/app-carpetas-y-vista-previa.html` — raíz en
 * tarjetas (:78), dentro de una carpeta (:141), árbol sangrado (:207), los
 * diálogos de crear, mover y borrar (:405) y el teléfono (:451).
 *
 * ─── LAS TRES REGLAS QUE FIJÓ EL DUEÑO ─────────────────────────────────────
 *
 *   1. Se ANIDAN.
 *   2. Un documento está en UNA sola carpeta.
 *   3. El interrogatorio lee TODO el expediente, no solo la carpeta abierta.
 *
 * La tercera es la que hace segura esta pantalla: organizar NO cambia lo que el
 * motor lee. Se dice en pantalla, porque desde fuera no se puede saber.
 *
 * ─── TRES MODOS, Y LA MAQUETA DIBUJA DOS ───────────────────────────────────
 *
 *   TARJETAS — «¿dónde está?». La raíz en tarjetas de la maqueta: cada carpeta
 *              dice cuánto tiene, contado con lo que ya se cargó.
 *   LISTA    — «¿qué hay en todo el caso?». El árbol sangrado de la maqueta,
 *              con los documentos colgados de su carpeta. Es la lista ÚNICA de
 *              documentos: antes había dos —la de «Documentos del expediente»
 *              y la de cada carpeta— con las mismas filas y acciones distintas.
 *   DETALLE  — «¿cuánto pesa cada cosa?». Filas de la carpeta abierta con sus
 *              fragmentos y fecha de indexación; la maqueta no lo dibuja y se
 *              pinta con las mismas filas del árbol para que no sea otra cara.
 *
 * El modo escogido se recuerda por navegador, no por expediente: quien prefiere
 * tarjetas las prefiere siempre.
 *
 * ─── LO QUE LA MAQUETA DIBUJA Y AQUÍ NO ESTÁ, CON LA RAZÓN ─────────────────
 *
 *  · «Movida hace 2 días» y la columna «Movida»: las carpetas no guardan fecha
 *    de cambio.
 *  · «Buscable: Sí» y «1 sin indexar»: todo documento de esta lista está
 *    indexado por construcción —lo que no se lee no se agrega—, así que la
 *    columna diría siempre lo mismo.
 *  · «12 páginas»: el servidor guarda fragmentos, no páginas.
 *  · «Agregar aquí»: indexar no recibe carpeta; el documento llega a la raíz y
 *    desde ahí se mueve. Un botón que prometiera «aquí» lo dejaría en otro
 *    sitio.
 *  · «Buscar dentro de los documentos de esta carpeta»: la búsqueda por
 *    significado lee todo el caso (arriba). Aquí se filtra por NOMBRE lo que ya
 *    está cargado, y el campo lo dice así.
 */

type Modo = 'lista' | 'detalle' | 'tarjetas';

const MODOS: readonly { modo: Modo; nombre: string; icono: typeof ListTree }[] = [
  { modo: 'tarjetas', nombre: 'Tarjetas', icono: LayoutGrid },
  { modo: 'lista', nombre: 'Árbol', icono: ListTree },
  { modo: 'detalle', nombre: 'Detalle', icono: Rows3 }
];

const CLAVE_DEL_MODO = 'iureon.expedientes.modo';

const modoGuardado = (): Modo => {
  /*
   * `localStorage` puede lanzar —ventana privada, datos de sitio bloqueados—
   * y un modo de vista no puede tumbar la pantalla del expediente.
   */
  try {
    const v = window.localStorage.getItem(CLAVE_DEL_MODO);
    return v === 'lista' || v === 'detalle' || v === 'tarjetas' ? v : 'tarjetas';
  } catch {
    return 'tarjetas';
  }
};

/** Sin tildes ni mayúsculas: «notificacion» encuentra «Notificaciones». */
const normalizar = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

type DialogoAbierto =
  | { tipo: 'nueva' }
  | { tipo: 'renombrar'; carpeta: Carpeta }
  | { tipo: 'moverCarpeta'; carpeta: Carpeta }
  | { tipo: 'moverDocumento'; documento: DocumentoIndexado }
  | { tipo: 'renombrarDocumento'; documento: DocumentoIndexado };

/* El servidor rechaza un nombre de documento de más de 160 caracteres. */
const LARGO_MAXIMO_DEL_NOMBRE = 160;

export const CarpetasDelExpediente: React.FC<{
  expediente: ExpedienteConDetalle;
  /** Se recarga desde fuera cuando se indexa o se quita un documento. */
  recargarSenal: number;
  /** La carpeta abierta; `null` es la raíz. La lleva el caso porque su columna derecha también la abre. */
  aqui: string | null;
  onAqui: (id: string | null) => void;
  /** Lo que se cargó, para que la columna derecha lo pinte sin volver a pedirlo. */
  onCargado?: (carpetas: Carpeta[], documentos: DocumentoIndexado[]) => void;
  /** Algo cambió que mueve las cuentas del caso (se quitó un documento, se borró una carpeta). */
  onCambio?: () => Promise<void>;
  /** Abre «Agregar un documento». */
  onAgregar: () => void;
}> = ({ expediente, recargarSenal, aqui, onAqui, onCargado, onCambio, onAgregar }) => {
  const [carpetas, setCarpetas] = React.useState<Carpeta[]>([]);
  const [documentos, setDocumentos] = React.useState<DocumentoIndexado[]>([]);
  const [cargado, setCargado] = React.useState(false);
  const [modo, setModo] = React.useState<Modo>(modoGuardado);
  const [filtro, setFiltro] = React.useState('');
  const [error, setError] = React.useState('');
  const [aviso, setAviso] = React.useState('');
  const [ocupado, setOcupado] = React.useState(false);
  const [dialogo, setDialogo] = React.useState<DialogoAbierto | null>(null);
  const [nombre, setNombre] = React.useState('');
  const [destino, setDestino] = React.useState<string | null | undefined>(undefined);
  const [errorDialogo, setErrorDialogo] = React.useState('');
  const [porBorrar, setPorBorrar] = React.useState<{ carpeta: Carpeta; contenido: ContenidoParaBorrar | null } | null>(
    null
  );
  const [tecleado, setTecleado] = React.useState('');
  const [porQuitar, setPorQuitar] = React.useState<DocumentoIndexado | null>(null);
  /* El documento abierto para leerlo. Las tres vistas comparten el lector. */
  const [leyendoDoc, setLeyendoDoc] = React.useState<string | null>(null);

  /*
   * LOS AVISOS HACIA ARRIBA VAN POR REF. El padre los escribe como flechas en
   * el JSX, así que cambian de identidad en cada render; con ellas en las
   * dependencias de `cargar`, cada aviso volvería a disparar la carga, que
   * vuelve a avisar: un bucle de peticiones sin que nadie toque nada.
   */
  const onCargadoRef = React.useRef(onCargado);
  const onCambioRef = React.useRef(onCambio);
  React.useEffect(() => {
    onCargadoRef.current = onCargado;
    onCambioRef.current = onCambio;
  });

  const cargar = React.useCallback(async (): Promise<Carpeta[] | null> => {
    setError('');
    try {
      const [c, d] = await Promise.all([
        expedientesApi.carpetas(expediente.id),
        expedientesApi.documentos(expediente.id)
      ]);
      setCarpetas(c);
      setDocumentos(d);
      setCargado(true);
      onCargadoRef.current?.(c, d);
      return c;
    } catch (err) {
      setError((err as Error).message);
      return null;
    }
  }, [expediente.id]);

  React.useEffect(() => {
    void cargar();
  }, [cargar, recargarSenal]);

  const escogerModo = (m: Modo): void => {
    setModo(m);
    try {
      window.localStorage.setItem(CLAVE_DEL_MODO, m);
    } catch {
      /* Sin almacenamiento, el modo dura lo que dure la pantalla. No es un error. */
    }
  };

  /** La ruta desde la raíz hasta donde estoy. Se sube por los padres, con tope. */
  const migas = React.useMemo(() => {
    const camino: Carpeta[] = [];
    let actual = aqui;
    for (let i = 0; actual && i < 50; i += 1) {
      const c = carpetas.find((x) => x.id === actual);
      if (!c) break;
      camino.unshift(c);
      actual = c.padreId;
    }
    return camino;
  }, [aqui, carpetas]);

  const carpetaAbierta = aqui ? carpetas.find((c) => c.id === aqui) ?? null : null;
  const coincide = (texto: string): boolean => !filtro.trim() || normalizar(texto).includes(normalizar(filtro.trim()));
  const subcarpetas = carpetas
    .filter((c) => c.padreId === aqui && coincide(c.nombre))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  const archivos = documentos.filter((d) => (d.carpetaId ?? null) === aqui && coincide(d.titulo));
  const sueltos = documentos.filter((d) => (d.carpetaId ?? null) === null).length;

  /* ─── DIÁLOGOS DE CREAR, RENOMBRAR Y MOVER ──────────────────────────────── */

  const abrirDialogo = (d: DialogoAbierto): void => {
    setErrorDialogo('');
    setNombre(d.tipo === 'renombrar' ? d.carpeta.nombre : d.tipo === 'renombrarDocumento' ? d.documento.titulo : '');
    setDestino(undefined);
    setDialogo(d);
  };

  const guardarDialogo = async (): Promise<void> => {
    if (!dialogo) return;
    setOcupado(true);
    setErrorDialogo('');
    try {
      if (dialogo.tipo === 'renombrarDocumento') {
        const limpio = nombre.trim();
        if (!limpio || limpio.length > LARGO_MAXIMO_DEL_NOMBRE) return;
        /*
         * SE PINTA EL NOMBRE QUE DEVUELVE EL SERVIDOR, no el que se escribió:
         * él recorta y normaliza, y es el que verán los demás. Se cambia en su
         * sitio, sin recargar el caso, y se avisa hacia arriba para que la
         * columna derecha no se quede con el nombre viejo. El lector no
         * necesita aviso: vuelve a pedir el título cada vez que se abre.
         * Un nombre repetido, largo o con barras vuelve con el mensaje del
         * servidor y se queda DENTRO del diálogo (ver el `catch`).
         */
        const r = await expedientesApi.renombrarDocumento(expediente.id, dialogo.documento.documentId, limpio);
        const nuevos = documentos.map((x) => (x.documentId === r.documentId ? { ...x, titulo: r.titulo } : x));
        setDocumentos(nuevos);
        onCargadoRef.current?.(carpetas, nuevos);
        setDialogo(null);
        return;
      }
      if (dialogo.tipo === 'nueva') {
        if (!nombre.trim()) return;
        await expedientesApi.crearCarpeta(expediente.id, { nombre: nombre.trim(), padreId: aqui });
      } else if (dialogo.tipo === 'renombrar') {
        if (!nombre.trim()) return;
        await expedientesApi.renombrarCarpeta(expediente.id, dialogo.carpeta.id, nombre.trim());
      } else if (dialogo.tipo === 'moverCarpeta') {
        if (destino === undefined) return;
        await expedientesApi.moverCarpeta(expediente.id, dialogo.carpeta.id, destino);
      } else {
        if (destino === undefined) return;
        await expedientesApi.moverDocumento(expediente.id, dialogo.documento.documentId, destino);
      }
      setDialogo(null);
      await cargar();
    } catch (err) {
      /* El error se queda DENTRO del diálogo: el nombre repetido se corrige ahí mismo. */
      setErrorDialogo((err as Error).message);
    } finally {
      setOcupado(false);
    }
  };

  /**
   * ─── BORRAR UNA CARPETA SE LLEVA LO DE DENTRO, Y SE PREGUNTA ANTES ───────
   *
   * En cualquier gestor de archivos borrar una carpeta borra su contenido, y
   * el servidor lo hace así: subcarpetas, documentos indexados y sus archivos
   * guardados. Una acción que no se deshace no puede no preguntar, y el
   * diálogo dice CUÁNTO se va: «subcarpeta(s)» y «documento(s) indexado(s)»,
   * con números, que arma `textoDelBorrado`.
   *
   * EL DEFECTO QUE ESTO CORRIGE: la cuenta empezaba en ceros y, si la consulta
   * del contenido fallaba, el diálogo decía «Esta carpeta está vacía». Ahora un
   * fallo es el estado «sin contar»: se pregunta igual pero
   * SIN prometer un número, se dice que no se pudo contar, se advierte que lo
   * que haya dentro se borrará, y se exige escribir el nombre de la carpeta.
   */
  const pedirBorrado = async (c: Carpeta): Promise<void> => {
    setError('');
    setTecleado('');
    setPorBorrar({ carpeta: c, contenido: null });
    let contenido: ContenidoParaBorrar;
    try {
      const dentro = await expedientesApi.contenidoDeCarpeta(expediente.id, c.id);
      contenido = { estado: 'contado', subcarpetas: dentro.subcarpetas, documentos: dentro.documentos };
    } catch {
      contenido = { estado: 'sin-contar' };
    }
    setPorBorrar((antes) => (antes && antes.carpeta.id === c.id ? { carpeta: c, contenido } : antes));
  };

  const confirmacionDeBorrado = ((): Confirmacion | null => {
    if (!porBorrar) return null;
    const { carpeta, contenido } = porBorrar;
    const texto = contenido ? textoDelBorrado(contenido) : null;
    const nombreBien = tecleado.trim() === carpeta.nombre.trim();
    return {
      titulo: `Borrar «${carpeta.nombre}»`,
      texto: (
        <div className="cn-exp-dlg">
          {!contenido || !texto ? (
            <p className="cn-exp-dlg-texto">Contando lo que tiene dentro…</p>
          ) : contenido.estado === 'sin-contar' ? (
            <p className="cn-exp-dlg-texto" role="alert">
              <span className="cn-exp-fuerte">No se pudo contar lo que tiene dentro.</span> Si tiene subcarpetas o
              documentos, se borrarán con ella —incluidos los archivos guardados— y dejarán de aparecer en las
              búsquedas. Esto no se deshace.
            </p>
          ) : texto.vacia ? (
            <p className="cn-exp-dlg-texto">Esta carpeta está vacía. Se borrará la carpeta.</p>
          ) : (
            <p className="cn-exp-dlg-texto">
              Se borrará la carpeta con <span className="cn-exp-fuerte">{texto.partes.join(' y ')}</span>. Los
              documentos dejarán de estar en el expediente y de aparecer en las búsquedas; para volver a tenerlos
              habría que agregarlos de nuevo. <span className="cn-exp-fuerte">Esto no se deshace.</span>
            </p>
          )}
          {texto?.exigeNombre && (
            <div className="cn-exp-campo">
              <label className="cn-exp-rotulo" htmlFor="confirmar-carpeta">
                Para confirmar, escriba «{carpeta.nombre}»
              </label>
              <input
                id="confirmar-carpeta"
                className="cn-exp-entrada"
                value={tecleado}
                onChange={(e) => setTecleado(e.target.value)}
                autoComplete="off"
              />
            </div>
          )}
        </div>
      ),
      etiqueta: 'Borrar la carpeta',
      peligro: true,
      deshabilitado: !contenido || (texto?.exigeNombre === true && !nombreBien),
      onConfirmar: async () => {
        setOcupado(true);
        try {
          /* El mensaje del servidor dice, con números, lo que efectivamente se fue. */
          setAviso(await expedientesApi.borrarCarpeta(expediente.id, carpeta.id));
          const nuevas = await cargar();
          if (aqui && nuevas && !nuevas.some((x) => x.id === aqui)) onAqui(carpeta.padreId);
          await onCambioRef.current?.();
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setOcupado(false);
        }
      }
    };
  })();

  /*
   * QUITAR UN DOCUMENTO TAMBIÉN PREGUNTA. Hasta hoy la × lo borraba de un clic.
   * Y el texto dice lo que el servidor hace, que no es lo que la maqueta de
   * diálogos supone («no se borra, puede volver a traerlo»): quitar borra los
   * fragmentos, la fila del documento y su archivo guardado.
   */
  const confirmacionDeQuitar: Confirmacion | null = porQuitar
    ? {
        titulo: `Quitar «${porQuitar.titulo}» del caso`,
        texto: (
          <p className="cn-exp-dlg-texto">
            Deja de aparecer en la búsqueda del caso y en el interrogatorio, y se borra también el archivo
            guardado. Para volver a tenerlo habría que agregarlo de nuevo.{' '}
            <span className="cn-exp-fuerte">Esto no se deshace.</span>
          </p>
        ),
        etiqueta: 'Quitar del caso',
        peligro: true,
        onConfirmar: async () => {
          try {
            await expedientesApi.quitarDocumento(expediente.id, porQuitar.documentId);
            await cargar();
            await onCambioRef.current?.();
          } catch (err) {
            setError((err as Error).message);
          }
        }
      }
    : null;

  /* ─── PIEZAS ────────────────────────────────────────────────────────────── */

  /*
   * ─── «MÁS ACCIONES»: BORRAR, MOVER Y RENOMBRAR SIN ABRIR EL ARCHIVO ──────
   *
   * El dueño pidió poder borrar documentos y carpetas sin entrar al lector.
   * Cada tarjeta y cada fila, en las TRES vistas, lleva un «⋮» que abre el
   * mismo menú; el clic derecho y la tecla de menú (o Mayús+F10) lo abren
   * también, como camino secundario. Antes el árbol y el detalle traían tres
   * iconos sueltos por fila —con la papelera roja a un dedo del lápiz— y las
   * tarjetas no traían ninguno: un solo menú deja las mismas acciones en las
   * tres vistas y aparta lo destructivo.
   *
   * Solo operaciones que ya existen, y lo destructivo pasa por los mismos
   * diálogos de confirmación: «Eliminar carpeta» abre el borrado que cuenta
   * el contenido (y que dice «no se pudo contar» si la cuenta falla), y
   * «Quitar del caso» abre el diálogo que dice que se borra el archivo.
   * «Renombrar» un documento usa la ruta PATCH del servidor, que solo cambia el
   * nombre visible y no el archivo guardado.
   */
  type ObjetivoDelMenu = { tipo: 'carpeta'; carpeta: Carpeta } | { tipo: 'documento'; documento: DocumentoIndexado };
  const [menu, setMenu] = React.useState<{
    objetivo: ObjetivoDelMenu;
    posicion: PosicionDelMenu;
    disparador: HTMLElement | null;
  } | null>(null);

  const idDe = (o: ObjetivoDelMenu): string => (o.tipo === 'carpeta' ? `c-${o.carpeta.id}` : `d-${o.documento.documentId}`);
  const nombreDe = (o: ObjetivoDelMenu): string => (o.tipo === 'carpeta' ? o.carpeta.nombre : o.documento.titulo);

  const abrirMenuDesdeBoton = (objetivo: ObjetivoDelMenu, e: React.MouseEvent<HTMLButtonElement>): void => {
    const r = e.currentTarget.getBoundingClientRect();
    setMenu({
      objetivo,
      posicion: { x: r.right, y: r.bottom + 4, yArriba: r.top - 4, alinearDerecha: true },
      disparador: e.currentTarget
    });
  };

  /** Clic derecho en la tarjeta o la fila. El foco vuelve a su botón principal. */
  const abrirMenuContextual = (objetivo: ObjetivoDelMenu, e: React.MouseEvent<HTMLElement>): void => {
    e.preventDefault();
    const principal = e.currentTarget.querySelector<HTMLElement>('button');
    /*
     * La tecla de menú dispara `contextmenu` sin puntero (0, 0): el menú se
     * coloca bajo el elemento con foco y no en la esquina de la ventana.
     */
    if (e.clientX === 0 && e.clientY === 0) {
      const ancla = (document.activeElement instanceof HTMLElement && e.currentTarget.contains(document.activeElement)
        ? document.activeElement
        : principal ?? e.currentTarget
      ).getBoundingClientRect();
      setMenu({
        objetivo,
        posicion: { x: ancla.left, y: ancla.bottom + 4, yArriba: ancla.top - 4, alinearDerecha: false },
        disparador: principal
      });
      return;
    }
    setMenu({
      objetivo,
      posicion: { x: e.clientX, y: e.clientY, yArriba: e.clientY, alinearDerecha: false },
      disparador: principal
    });
  };

  /** Mayús+F10 y la tecla de menú, para quien no usa el ratón. */
  const alTeclearMenu = (objetivo: ObjetivoDelMenu, e: React.KeyboardEvent<HTMLElement>): void => {
    if (e.key !== 'ContextMenu' && !(e.shiftKey && e.key === 'F10')) return;
    e.preventDefault();
    const foco = e.target instanceof HTMLElement ? e.target : e.currentTarget;
    const r = foco.getBoundingClientRect();
    setMenu({
      objetivo,
      posicion: { x: r.left, y: r.bottom + 4, yArriba: r.top - 4, alinearDerecha: false },
      disparador: foco
    });
  };

  const accionesDelMenu = (o: ObjetivoDelMenu): AccionDelMenu[] => {
    if (o.tipo === 'carpeta') {
      const c = o.carpeta;
      return [
        { etiqueta: 'Abrir', onElegir: () => onAqui(c.id) },
        { etiqueta: 'Renombrar', onElegir: () => abrirDialogo({ tipo: 'renombrar', carpeta: c }) },
        { etiqueta: 'Mover', onElegir: () => abrirDialogo({ tipo: 'moverCarpeta', carpeta: c }) },
        { etiqueta: 'Eliminar carpeta', peligro: true, deshabilitado: ocupado, onElegir: () => void pedirBorrado(c) }
      ];
    }
    const d = o.documento;
    return [
      { etiqueta: 'Abrir', onElegir: () => setLeyendoDoc(d.documentId) },
      { etiqueta: 'Renombrar', onElegir: () => abrirDialogo({ tipo: 'renombrarDocumento', documento: d }) },
      { etiqueta: 'Mover a otra carpeta', onElegir: () => abrirDialogo({ tipo: 'moverDocumento', documento: d }) },
      { etiqueta: 'Quitar del caso', peligro: true, onElegir: () => setPorQuitar(d) }
    ];
  };

  /** Lo que cuelga de cada tarjeta y fila: el clic derecho y la tecla de menú. */
  const conMenu = (objetivo: ObjetivoDelMenu) => ({
    onContextMenu: (e: React.MouseEvent<HTMLElement>) => abrirMenuContextual(objetivo, e),
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => alTeclearMenu(objetivo, e)
  });

  const botonMas = (objetivo: ObjetivoDelMenu): React.ReactNode => (
    <button
      type="button"
      className="cn-exp-icono cn-exp-mas"
      aria-haspopup="menu"
      aria-expanded={menu !== null && idDe(menu.objetivo) === idDe(objetivo)}
      aria-label={`Más acciones para «${nombreDe(objetivo)}»`}
      title="Más acciones"
      onClick={(e) => abrirMenuDesdeBoton(objetivo, e)}
    >
      <EllipsisVertical className="h-5 w-5" aria-hidden="true" />
    </button>
  );

  const filaDeCarpeta = (c: Carpeta, nivel: number): React.ReactNode => (
    <li
      key={`c-${c.id}`}
      className="cn-exp-fila"
      style={{ ['--nivel' as string]: nivel }}
      {...conMenu({ tipo: 'carpeta', carpeta: c })}
    >
      <button type="button" className="cn-exp-fila-nombre" onClick={() => onAqui(c.id)}>
        <Folder className="cn-exp-fila-icono h-5 w-5" aria-hidden="true" />
        <span className={`[overflow-wrap:anywhere] ${nivel === 0 ? 'cn-exp-fuerte' : ''}`}>{c.nombre}</span>
      </button>
      <span className="cn-exp-fila-dato">{enPalabrasElResumen(resumenDeCarpeta(c.id, carpetas, documentos))}</span>
      <span className="cn-exp-fila-dato" aria-hidden="true" />
      <span className="cn-exp-fila-acciones">{botonMas({ tipo: 'carpeta', carpeta: c })}</span>
    </li>
  );

  const filaDeDocumento = (d: DocumentoIndexado, nivel: number): React.ReactNode => (
    <li
      key={`d-${d.documentId}`}
      className="cn-exp-fila"
      style={{ ['--nivel' as string]: nivel }}
      {...conMenu({ tipo: 'documento', documento: d })}
    >
      <button
        type="button"
        className="cn-exp-fila-nombre"
        onClick={() => setLeyendoDoc(d.documentId)}
        title="Abrir el documento"
      >
        <FileText className="cn-exp-fila-icono h-5 w-5" aria-hidden="true" />
        <span className="[overflow-wrap:anywhere]">{d.titulo}</span>
      </button>
      {/*
        EL DETALLE TRAE LO QUE SIRVE PARA DECIDIR: cuántos fragmentos quedaron
        buscables y cuándo se indexó. Es lo que se mira antes de quitar algo.
      */}
      <span className="cn-exp-fila-dato">{d.fragmentos.toLocaleString('es-CO')} fragmentos</span>
      <span className="cn-exp-fila-dato">{d.indexadoEl ? d.indexadoEl.slice(0, 10) : ''}</span>
      <span className="cn-exp-fila-acciones">{botonMas({ tipo: 'documento', documento: d })}</span>
    </li>
  );

  /** El árbol desde la carpeta abierta: carpetas y, bajo cada una, sus documentos. */
  const arbol = (padreId: string | null, nivel: number, vistas: Set<string>): React.ReactNode[] => {
    if (nivel > 50) return [];
    const filas: React.ReactNode[] = [];
    carpetas
      .filter((c) => c.padreId === padreId && !vistas.has(c.id))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
      .forEach((c) => {
        vistas.add(c.id);
        const hijos = arbol(c.id, nivel + 1, vistas);
        if (coincide(c.nombre) || hijos.length > 0) filas.push(filaDeCarpeta(c, nivel));
        filas.push(...hijos);
      });
    documentos
      .filter((d) => (d.carpetaId ?? null) === padreId && coincide(d.titulo))
      .forEach((d) => filas.push(filaDeDocumento(d, nivel)));
    return filas;
  };

  const vacio = cargado && subcarpetas.length === 0 && archivos.length === 0;
  const hayAlgo = carpetas.length > 0 || documentos.length > 0;
  const filasDelArbol = modo === 'lista' ? arbol(aqui, 0, new Set()) : [];

  const destinos: Destino[] =
    dialogo?.tipo === 'moverCarpeta'
      ? destinosDeCarpeta(carpetas, dialogo.carpeta.id)
      : dialogo?.tipo === 'moverDocumento'
        ? destinosDeDocumento(carpetas, dialogo.documento.carpetaId ?? null)
        : [];

  const modos = (
    <div className="cn-exp-segmento" role="group" aria-label="Modo de vista">
      {MODOS.map(({ modo: m, nombre: rotulo, icono: Icono }) => (
        <button
          key={m}
          type="button"
          onClick={() => escogerModo(m)}
          aria-pressed={modo === m}
          aria-label={`Ver en ${rotulo.toLowerCase()}`}
          title={rotulo}
          className="cn-exp-segmento-boton"
        >
          <Icono className="h-4 w-4" aria-hidden="true" />
        </button>
      ))}
    </div>
  );

  return (
    <section className="cn-exp-carpetas" aria-label="Carpetas y documentos">
      {/* ─── DÓNDE ESTOY ─────────────────────────────────────────────────── */}
      {aqui !== null && (
        <nav className="cn-exp-migas" aria-label="Ruta de carpetas">
          <button type="button" onClick={() => onAqui(null)} className="cn-exp-miga">
            Raíz del expediente
          </button>
          {migas.map((c) => (
            <React.Fragment key={c.id}>
              <ChevronRight className="cn-exp-miga-flecha h-4 w-4" aria-hidden="true" />
              {c.id === aqui ? (
                <span className="cn-exp-miga cn-exp-miga--aqui" aria-current="page">
                  {c.nombre}
                </span>
              ) : (
                <button type="button" onClick={() => onAqui(c.id)} className="cn-exp-miga">
                  {c.nombre}
                </button>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="cn-exp-seccion-cabeza">
        <div className="min-w-0">
          <h2 className="cn-exp-h2 [overflow-wrap:anywhere]">{carpetaAbierta ? carpetaAbierta.nombre : 'Carpetas'}</h2>
          {/*
            SE DICE QUE ORGANIZAR NO CAMBIA LO QUE EL MOTOR LEE. Desde fuera no
            se puede saber, y la duda razonable —«¿si lo meto aquí, el sistema
            deja de verlo?»— haría que nadie organizara nada.
          */}
          <p className="cn-exp-bajada-2">
            {carpetaAbierta
              ? enPalabrasElResumen(resumenDeCarpeta(carpetaAbierta.id, carpetas, documentos))
              : 'Para ordenar sus documentos. El interrogatorio y la búsqueda leen todo el expediente, esté cada cosa en la carpeta que esté.'}
          </p>
        </div>
        <div className="cn-exp-acciones">
          {modos}
          {carpetaAbierta && (
            <>
              <button
                type="button"
                className="cn-ini-boton cn-ini-boton--suave cn-exp-boton"
                onClick={() => abrirDialogo({ tipo: 'renombrar', carpeta: carpetaAbierta })}
              >
                Renombrar
              </button>
              <button
                type="button"
                className="cn-ini-boton cn-ini-boton--suave cn-exp-boton"
                onClick={() => abrirDialogo({ tipo: 'moverCarpeta', carpeta: carpetaAbierta })}
              >
                Mover
              </button>
            </>
          )}
          <button
            type="button"
            className="cn-ini-boton cn-ini-boton--suave cn-exp-boton"
            onClick={() => abrirDialogo({ tipo: 'nueva' })}
          >
            Nueva carpeta
          </button>
          <button type="button" className="cn-ini-boton cn-ini-boton--primario cn-exp-boton" onClick={onAgregar}>
            Agregar documento
          </button>
        </div>
      </div>

      {aqui === null && cargado && (
        <p className="cn-exp-nota">
          Raíz del expediente · {carpetas.filter((c) => c.padreId === null).length} carpeta(s) · {sueltos} documento(s)
          suelto(s)
        </p>
      )}

      {hayAlgo && (
        <div className="cn-exp-filtro">
          <Search className="cn-exp-filtro-icono h-4 w-4" aria-hidden="true" />
          <label className="sr-only" htmlFor="filtro-carpeta">
            Filtrar por nombre
          </label>
          <input
            id="filtro-carpeta"
            className="cn-exp-entrada cn-exp-entrada--con-icono"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder={carpetaAbierta ? 'Filtrar por nombre en esta carpeta' : 'Filtrar carpetas y documentos por nombre'}
          />
        </div>
      )}

      {aviso && <p className="cn-exp-nota cn-exp-nota--caja [overflow-wrap:anywhere]">{aviso}</p>}
      {error && (
        <p className="cn-error" role="alert">
          <AlertCircle className="h-4 w-4" />
          <span className="min-w-0 [overflow-wrap:anywhere]">{error}</span>
        </p>
      )}

      {!cargado && !error && <p className="cn-exp-nota">Cargando carpetas y documentos…</p>}

      {vacio && modo !== 'lista' && (
        <div className="cn-exp-vacio cn-exp-vacio--suave">
          <p className="cn-exp-vacio-titulo">
            {filtro.trim()
              ? 'Nada coincide con ese nombre'
              : carpetaAbierta
                ? 'Esta carpeta está vacía'
                : 'Este caso está vacío'}
          </p>
          {!filtro.trim() && (
            <p className="cn-exp-vacio-texto">
              {carpetaAbierta
                ? 'Mueva aquí documentos desde la raíz o cree una subcarpeta.'
                : 'Agregue un documento o traiga algo que ya tenga en otro módulo. Las carpetas son opcionales: si el asunto es corto, todo puede vivir en la raíz.'}
            </p>
          )}
        </div>
      )}

      {/* ─── TARJETAS ────────────────────────────────────────────────────── */}
      {modo === 'tarjetas' && !vacio && cargado && (
        <ul className="cn-exp-rejilla">
          {subcarpetas.map((c) => (
            <li key={c.id} className="cn-exp-tarjeta-celda" {...conMenu({ tipo: 'carpeta', carpeta: c })}>
              <button type="button" onClick={() => onAqui(c.id)} className="cn-exp-tarjeta cn-exp-tarjeta--carpeta">
                <Folder className="cn-exp-fila-icono h-6 w-6" aria-hidden="true" />
                <span className="cn-exp-tarjeta-nombre [overflow-wrap:anywhere]">{c.nombre}</span>
                <span className="cn-exp-tarjeta-dato">
                  {enPalabrasElResumen(resumenDeCarpeta(c.id, carpetas, documentos))}
                </span>
              </button>
              {botonMas({ tipo: 'carpeta', carpeta: c })}
            </li>
          ))}
          {archivos.map((d) => (
            <li key={d.documentId} className="cn-exp-tarjeta-celda" {...conMenu({ tipo: 'documento', documento: d })}>
              <button
                type="button"
                onClick={() => setLeyendoDoc(d.documentId)}
                className="cn-exp-tarjeta cn-exp-tarjeta--documento"
                title="Abrir el documento"
              >
                <FileText className="cn-exp-fila-icono h-5 w-5" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="cn-exp-tarjeta-nombre [overflow-wrap:anywhere]">{d.titulo}</span>
                  <span className="cn-exp-tarjeta-dato">{d.fragmentos.toLocaleString('es-CO')} fragmentos buscables</span>
                </span>
              </button>
              {botonMas({ tipo: 'documento', documento: d })}
            </li>
          ))}
          <li>
            <button type="button" onClick={() => abrirDialogo({ tipo: 'nueva' })} className="cn-exp-tarjeta cn-exp-tarjeta--nueva">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nueva carpeta
            </button>
          </li>
        </ul>
      )}

      {/* ─── DETALLE ─────────────────────────────────────────────────────── */}
      {modo === 'detalle' && !vacio && cargado && (
        <div className="cn-exp-tabla">
          <div className="cn-exp-tabla-cabeza" aria-hidden="true">
            <span>Nombre</span>
            <span>Contiene</span>
            <span>Indexado</span>
            <span />
          </div>
          <ul className="cn-exp-filas-tabla">
            {subcarpetas.map((c) => filaDeCarpeta(c, 0))}
            {archivos.map((d) => filaDeDocumento(d, 0))}
          </ul>
        </div>
      )}

      {/* ─── ÁRBOL ───────────────────────────────────────────────────────── */}
      {modo === 'lista' && cargado && (
        filasDelArbol.length > 0 ? (
          <ul className="cn-exp-filas-tabla cn-exp-arbol">{filasDelArbol}</ul>
        ) : (
          <div className="cn-exp-vacio cn-exp-vacio--suave">
            <p className="cn-exp-vacio-titulo">{filtro.trim() ? 'Nada coincide con ese nombre' : 'Nada todavía'}</p>
          </div>
        )
      )}

      {/* ─── DIÁLOGOS ────────────────────────────────────────────────────── */}
      <Dialog
        abierto={dialogo !== null}
        onCerrar={() => (ocupado ? undefined : setDialogo(null))}
        tamano="S"
        titulo={
          dialogo?.tipo === 'nueva'
            ? 'Nueva carpeta'
            : dialogo?.tipo === 'renombrar'
              ? `Renombrar «${dialogo.carpeta.nombre}»`
              : dialogo?.tipo === 'moverCarpeta'
                ? `Mover «${dialogo.carpeta.nombre}»`
                : dialogo?.tipo === 'moverDocumento'
                  ? `Mover «${dialogo.documento.titulo}»`
                  : dialogo?.tipo === 'renombrarDocumento'
                    ? `Renombrar «${dialogo.documento.titulo}»`
                    : ''
        }
        acciones={
          <>
            <button
              type="button"
              className="cn-ini-boton cn-ini-boton--texto cn-exp-boton"
              onClick={() => setDialogo(null)}
              disabled={ocupado}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="cn-ini-boton cn-ini-boton--primario cn-exp-boton"
              onClick={() => void guardarDialogo()}
              disabled={
                ocupado ||
                ((dialogo?.tipo === 'nueva' || dialogo?.tipo === 'renombrar' || dialogo?.tipo === 'renombrarDocumento') &&
                  !nombre.trim()) ||
                (dialogo?.tipo === 'renombrarDocumento' && nombre.trim().length > LARGO_MAXIMO_DEL_NOMBRE) ||
                ((dialogo?.tipo === 'moverCarpeta' || dialogo?.tipo === 'moverDocumento') && destino === undefined)
              }
            >
              {ocupado
                ? 'Un momento…'
                : dialogo?.tipo === 'nueva'
                  ? 'Crear'
                  : dialogo?.tipo === 'renombrar' || dialogo?.tipo === 'renombrarDocumento'
                    ? 'Guardar el nombre'
                    : 'Mover aquí'}
            </button>
          </>
        }
      >
        <div className="cn-exp-dlg">
          {dialogo?.tipo === 'renombrarDocumento' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void guardarDialogo();
              }}
              className="cn-exp-dlg"
            >
              <div className="cn-exp-campo">
                <label className="cn-exp-rotulo" htmlFor="nombre-documento">
                  Nombre del documento
                </label>
                <input
                  id="nombre-documento"
                  className="cn-exp-entrada"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  maxLength={LARGO_MAXIMO_DEL_NOMBRE}
                  autoComplete="off"
                  autoFocus
                />
                <p className="cn-exp-ayuda">
                  Solo cambia el nombre que se ve en el caso; el archivo guardado no se toca. Hasta{' '}
                  {LARGO_MAXIMO_DEL_NOMBRE} caracteres, sin barras.
                </p>
              </div>
            </form>
          )}

          {(dialogo?.tipo === 'nueva' || dialogo?.tipo === 'renombrar') && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void guardarDialogo();
              }}
              className="cn-exp-dlg"
            >
              {dialogo.tipo === 'nueva' && (
                <p className="cn-exp-dlg-texto">
                  {carpetaAbierta ? (
                    <>
                      Se creará dentro de <span className="cn-exp-fuerte">{carpetaAbierta.nombre}</span>.
                    </>
                  ) : (
                    'Se creará en la raíz del expediente.'
                  )}
                </p>
              )}
              <div className="cn-exp-campo">
                <label className="cn-exp-rotulo" htmlFor="nombre-carpeta">
                  Nombre
                </label>
                <input
                  id="nombre-carpeta"
                  className="cn-exp-entrada"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder={
                    dialogo.tipo === 'nueva' && carpetaAbierta
                      ? `Dentro de ${carpetaAbierta.nombre}`
                      : 'Pruebas, Poderes, Notificaciones…'
                  }
                  autoFocus
                />
                {dialogo.tipo === 'nueva' && (
                  <p className="cn-exp-ayuda">Agrupe como le sirva: por prueba, por etapa o por quien lo aportó.</p>
                )}
              </div>
            </form>
          )}

          {(dialogo?.tipo === 'moverCarpeta' || dialogo?.tipo === 'moverDocumento') && (
            <>
              <p className="cn-exp-dlg-texto">
                Está en{' '}
                {(() => {
                  const actual = dialogo.tipo === 'moverCarpeta' ? dialogo.carpeta.padreId : dialogo.documento.carpetaId ?? null;
                  return actual ? rutaDe(actual, carpetas) : 'la raíz del expediente';
                })()}
                .
              </p>
              <ul className="cn-exp-destinos" role="radiogroup" aria-label="Destino">
                {destinos.map((d) => (
                  <li key={d.id ?? 'raiz'}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={destino === d.id}
                      disabled={d.motivo !== null}
                      onClick={() => setDestino(d.id)}
                      className="cn-exp-destino"
                    >
                      <span className="min-w-0 [overflow-wrap:anywhere]">{d.ruta}</span>
                      {d.motivo && <span className="cn-exp-destino-motivo">{MOTIVO_EN_PALABRAS[d.motivo]}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {errorDialogo && (
            <p className="cn-error" role="alert">
              <AlertCircle className="h-4 w-4" />
              <span className="min-w-0 [overflow-wrap:anywhere]">{errorDialogo}</span>
            </p>
          )}
        </div>
      </Dialog>

      <ConfirmarDialog
        confirmacion={confirmacionDeBorrado}
        onCerrar={() => {
          setPorBorrar(null);
          setTecleado('');
        }}
      />
      <ConfirmarDialog confirmacion={confirmacionDeQuitar} onCerrar={() => setPorQuitar(null)} />

      {menu && (
        <MenuDeAcciones
          key={idDe(menu.objetivo)}
          titulo={nombreDe(menu.objetivo)}
          posicion={menu.posicion}
          acciones={accionesDelMenu(menu.objetivo)}
          disparador={menu.disparador}
          onCerrar={() => setMenu(null)}
        />
      )}

      <LeerDocumentoIndexado
        expedienteId={expediente.id}
        documentId={leyendoDoc}
        onCerrar={() => setLeyendoDoc(null)}
        caratula={expediente.caratula}
        ubicacion={(() => {
          const d = documentos.find((x) => x.documentId === leyendoDoc);
          return d?.carpetaId ? rutaDe(d.carpetaId, carpetas) : 'Raíz del expediente';
        })()}
        onMover={() => {
          const d = documentos.find((x) => x.documentId === leyendoDoc);
          setLeyendoDoc(null);
          if (d) abrirDialogo({ tipo: 'moverDocumento', documento: d });
        }}
        onQuitar={() => {
          const d = documentos.find((x) => x.documentId === leyendoDoc);
          setLeyendoDoc(null);
          if (d) setPorQuitar(d);
        }}
      />
    </section>
  );
};
