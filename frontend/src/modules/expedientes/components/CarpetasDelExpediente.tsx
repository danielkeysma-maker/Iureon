import React from 'react';
import {
  AlertCircle,
  ChevronRight,
  FileText,
  Folder,
  FolderPlus,
  LayoutGrid,
  List,
  Rows3,
  X
} from 'lucide-react';
import { ConfirmarDialog, type Confirmacion } from '../../../design/ConfirmarDialog';
import { LeerDocumentoIndexado } from './LeerDocumentoIndexado';
import { expedientesApi, type Carpeta, type DocumentoIndexado } from '../services/expedientes.api';
import type { ExpedienteConDetalle } from '../types';

/**
 * LAS CARPETAS DEL EXPEDIENTE, Y LO QUE HAY EN CADA UNA.
 *
 * ─── LAS TRES REGLAS QUE FIJÓ EL DUEÑO ─────────────────────────────────────
 *
 *   1. Se ANIDAN.
 *   2. Un documento está en UNA sola carpeta.
 *   3. El interrogatorio lee TODO el expediente, no solo la carpeta abierta.
 *
 * La tercera es la que hace segura esta pantalla: organizar NO cambia lo que el
 * motor lee. Mover un documento de sitio no altera una sola respuesta, así que
 * el abogado puede reordenar sin miedo a esconderle algo al sistema. Se dice en
 * pantalla, porque desde fuera no se puede saber.
 *
 * ─── TRES MODOS, Y CADA UNO SIRVE PARA ALGO DISTINTO ───────────────────────
 *
 * No son tres pinturas del mismo dato: son tres preguntas distintas.
 *
 *   LISTA    — «¿qué hay aquí?». Lo más denso, para recorrer con la vista.
 *   DETALLE  — «¿cuánto pesa cada cosa?». Trae fragmentos y fecha, que es lo
 *              que se mira cuando hay que decidir qué reindexar o quitar.
 *   TARJETAS — «¿dónde está?». Cuadrícula, para reconocer por forma y no por
 *              lectura; es el modo con el que se navega rápido.
 *
 * El modo escogido se recuerda por navegador, no por expediente: quien prefiere
 * tarjetas las prefiere siempre, y volver a escogerlas en cada asunto sería
 * pedirle que repita una decisión que ya tomó.
 */

type Modo = 'lista' | 'detalle' | 'tarjetas';

const MODOS: readonly { modo: Modo; nombre: string; icono: typeof List }[] = [
  { modo: 'lista', nombre: 'Lista', icono: List },
  { modo: 'detalle', nombre: 'Detalle', icono: Rows3 },
  { modo: 'tarjetas', nombre: 'Tarjetas', icono: LayoutGrid }
];

const CLAVE_DEL_MODO = 'iureon.expedientes.modo';

const modoGuardado = (): Modo => {
  /*
   * `localStorage` puede lanzar —ventana privada, datos de sitio bloqueados—
   * y un modo de vista no puede tumbar la pantalla del expediente.
   */
  try {
    const v = window.localStorage.getItem(CLAVE_DEL_MODO);
    return v === 'lista' || v === 'detalle' || v === 'tarjetas' ? v : 'lista';
  } catch {
    return 'lista';
  }
};

export const CarpetasDelExpediente: React.FC<{
  expediente: ExpedienteConDetalle;
  /** Se recarga desde fuera cuando se indexa o se quita un documento. */
  recargarSenal: number;
}> = ({ expediente, recargarSenal }) => {
  const [carpetas, setCarpetas] = React.useState<Carpeta[]>([]);
  const [documentos, setDocumentos] = React.useState<DocumentoIndexado[]>([]);
  const [aqui, setAqui] = React.useState<string | null>(null);
  const [modo, setModo] = React.useState<Modo>(modoGuardado);
  const [creando, setCreando] = React.useState(false);
  const [nombre, setNombre] = React.useState('');
  const [error, setError] = React.useState('');
  const [ocupado, setOcupado] = React.useState(false);
  const [confirmacion, setConfirmacion] = React.useState<Confirmacion | null>(null);
  /* El documento abierto para leerlo. Las tres vistas comparten el visor. */
  const [leyendoDoc, setLeyendoDoc] = React.useState<string | null>(null);

  const cargar = React.useCallback(async () => {
    setError('');
    try {
      const [c, d] = await Promise.all([
        expedientesApi.carpetas(expediente.id),
        expedientesApi.documentos(expediente.id)
      ]);
      setCarpetas(c);
      setDocumentos(d);
    } catch (err) {
      setError((err as Error).message);
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

  /** La ruta desde la raíz hasta donde estoy. Se sube por los padres. */
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

  const subcarpetas = carpetas.filter((c) => c.padreId === aqui);
  const archivos = documentos.filter((d) => (d.carpetaId ?? null) === aqui);

  const crear = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setOcupado(true);
    setError('');
    try {
      await expedientesApi.crearCarpeta(expediente.id, { nombre: nombre.trim(), padreId: aqui });
      setNombre('');
      setCreando(false);
      await cargar();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setOcupado(false);
    }
  };

  /**
   * ─── BORRAR UNA CARPETA SE LLEVA LO DE DENTRO, Y SE PREGUNTA ANTES ───────
   *
   * La primera versión borraba de un clic y conservaba los documentos,
   * subiéndolos a la raíz. Las dos cosas estaban mal.
   *
   * Lo de conservar, porque en cualquier gestor de archivos borrar una carpeta
   * borra su contenido: pelear con esa intuición no evita el daño, lo cambia
   * de sitio — el abogado da los documentos por perdidos mientras siguen
   * apareciendo en las búsquedas desde una raíz donde nadie los puso.
   *
   * Y lo del clic, porque una acción que no se deshace no puede no preguntar.
   * El diálogo dice CUÁNTO se va, no solo que se va: «se borrará todo lo que
   * contiene» sin números no advierte nada — el abogado no sabe si son dos
   * archivos o trescientas páginas que costó vectorizar.
   */
  const pedirBorrado = async (c: Carpeta): Promise<void> => {
    setError('');
    let dentro = { subcarpetas: 0, documentos: 0 };
    try {
      dentro = await expedientesApi.contenidoDeCarpeta(expediente.id, c.id);
    } catch (err) {
      /*
       * Si no se pudo contar, se pregunta igual pero SIN prometer un número.
       * Decir «está vacía» porque la cuenta falló sería la peor forma de
       * equivocarse en un diálogo de borrado.
       */
      setError((err as Error).message);
    }

    const partes = [
      dentro.subcarpetas > 0 ? `${dentro.subcarpetas} subcarpeta(s)` : null,
      dentro.documentos > 0 ? `${dentro.documentos} documento(s) indexado(s)` : null
    ].filter(Boolean);

    setConfirmacion({
      titulo: `Borrar «${c.nombre}»`,
      texto:
        partes.length > 0 ? (
          <>
            Se borrará la carpeta con <span className="font-semibold">{partes.join(' y ')}</span>. Los
            documentos dejarán de estar en el expediente y de aparecer en las búsquedas; para volver a
            tenerlos habría que indexarlos de nuevo. Esto no se deshace.
          </>
        ) : (
          <>Esta carpeta está vacía. Se borrará la carpeta.</>
        ),
      etiqueta: 'Borrar la carpeta',
      peligro: true,
      onConfirmar: async () => {
        setOcupado(true);
        try {
          /* El mensaje del servidor dice, con números, lo que efectivamente se fue. */
          setError(await expedientesApi.borrarCarpeta(expediente.id, c.id));
          if (aqui === c.id) setAqui(c.padreId);
          await cargar();
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setOcupado(false);
        }
      }
    });
  };

  const mover = async (documentId: string, destino: string | null): Promise<void> => {
    setOcupado(true);
    setError('');
    try {
      await expedientesApi.moverDocumento(expediente.id, documentId, destino);
      await cargar();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setOcupado(false);
    }
  };

  /** El desplegable para mover: todas las carpetas menos donde ya está. */
  const selectorDeDestino = (d: DocumentoIndexado): React.ReactNode => (
    <select
      className="field w-auto text-meta"
      value={d.carpetaId ?? ''}
      disabled={ocupado}
      aria-label={`Mover ${d.titulo} a otra carpeta`}
      onChange={(e) => void mover(d.documentId, e.target.value || null)}
    >
      <option value="">Raíz del expediente</option>
      {carpetas.map((c) => (
        <option key={c.id} value={c.id}>
          {c.nombre}
        </option>
      ))}
    </select>
  );

  return (
    <section className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-h3">Carpetas</h2>
          {/*
            SE DICE QUE ORGANIZAR NO CAMBIA LO QUE EL MOTOR LEE. Desde fuera no
            se puede saber, y la duda razonable —«¿si lo meto aquí, el sistema
            deja de verlo?»— haría que nadie organizara nada.
          */}
          <p className="text-meta text-ink-500">
            Para ordenar sus documentos. El interrogatorio y la búsqueda leen todo el expediente, esté cada
            cosa en la carpeta que esté.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-card border border-line-200" role="group" aria-label="Modo de vista">
            {MODOS.map(({ modo: m, nombre: rotulo, icono: Icono }) => (
              <button
                key={m}
                type="button"
                onClick={() => escogerModo(m)}
                aria-pressed={modo === m}
                title={rotulo}
                className={`btn-sm gap-1.5 ${modo === m ? 'btn-secondary' : 'btn-ghost'}`}
              >
                <Icono className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only">{rotulo}</span>
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setCreando((v) => !v)} className="btn-secondary btn-sm gap-1.5">
            <FolderPlus className="h-3.5 w-3.5" />
            Nueva carpeta
          </button>
        </div>
      </div>

      {/* ─── DÓNDE ESTOY ─────────────────────────────────────────────────── */}
      <nav className="mt-3 flex flex-wrap items-center gap-1 text-meta" aria-label="Ruta de carpetas">
        <button
          type="button"
          onClick={() => setAqui(null)}
          className={`btn-ghost btn-sm ${aqui === null ? 'font-medium' : 'text-ink-500'}`}
        >
          {expediente.caratula}
        </button>
        {migas.map((c) => (
          <React.Fragment key={c.id}>
            <ChevronRight className="h-3 w-3 shrink-0 text-ink-500" />
            <button
              type="button"
              onClick={() => setAqui(c.id)}
              className={`btn-ghost btn-sm ${aqui === c.id ? 'font-medium' : 'text-ink-500'}`}
            >
              {c.nombre}
            </button>
          </React.Fragment>
        ))}
      </nav>

      {creando && (
        <form onSubmit={crear} className="mt-3 flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="nombre-carpeta">
            Nombre de la carpeta
          </label>
          <input
            id="nombre-carpeta"
            className="field min-w-0 flex-1"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder={aqui ? `Dentro de ${migas[migas.length - 1]?.nombre}` : 'Pruebas, Poderes, Notificaciones…'}
            autoFocus
          />
          <button type="submit" className="btn-primary btn-sm shrink-0" disabled={ocupado || !nombre.trim()}>
            Crear
          </button>
          <button type="button" className="btn-ghost btn-sm shrink-0" onClick={() => setCreando(false)}>
            Cancelar
          </button>
        </form>
      )}

      {error && (
        <p className="mt-2 flex items-start gap-2 text-meta text-ink-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="[overflow-wrap:anywhere]">{error}</span>
        </p>
      )}

      {subcarpetas.length === 0 && archivos.length === 0 && (
        <p className="mt-3 text-meta text-ink-500">
          {aqui ? 'Esta carpeta está vacía.' : 'Todo está en la raíz. Cree carpetas para agrupar por prueba, por etapa o como prefiera.'}
        </p>
      )}

      {/* ─── TARJETAS ────────────────────────────────────────────────────── */}
      {modo === 'tarjetas' && (subcarpetas.length > 0 || archivos.length > 0) && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {subcarpetas.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setAqui(c.id)}
              className="card p-3 text-left transition-colors hover:bg-canvas"
            >
              <Folder className="h-5 w-5 text-ink-500" />
              <p className="mt-1.5 text-body font-medium [overflow-wrap:anywhere]">{c.nombre}</p>
            </button>
          ))}
          {archivos.map((d) => (
            /* La tarjeta ABRE el documento: hasta hoy no hacia nada al pulsarla. */
            <button
              key={d.documentId}
              type="button"
              onClick={() => setLeyendoDoc(d.documentId)}
              className="card p-3 text-left hover:border-brand-700"
              title="Leer lo que quedó indexado de este documento"
            >
              <FileText className="h-5 w-5 text-ink-500" />
              <p className="mt-1.5 text-body [overflow-wrap:anywhere]">{d.titulo}</p>
              <p className="mt-0.5 text-meta text-ink-500">{d.fragmentos.toLocaleString('es-CO')} fragmentos</p>
            </button>
          ))}
        </div>
      )}

      {/* ─── LISTA Y DETALLE ─────────────────────────────────────────────── */}
      {modo !== 'tarjetas' && (subcarpetas.length > 0 || archivos.length > 0) && (
        <ul className="mt-3 space-y-1.5">
          {subcarpetas.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-2 rounded-card border border-line-200 p-2.5"
            >
              <button
                type="button"
                onClick={() => setAqui(c.id)}
                className="flex min-w-0 items-center gap-1.5 text-left text-body"
              >
                <Folder className="h-3.5 w-3.5 shrink-0 text-ink-500" />
                <span className="font-medium [overflow-wrap:anywhere]">{c.nombre}</span>
              </button>
              <button
                type="button"
                onClick={() => void pedirBorrado(c)}
                className="btn-ghost btn-sm shrink-0 px-1.5"
                disabled={ocupado}
                aria-label={`Borrar la carpeta ${c.nombre}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}

          {archivos.map((d) => (
            <li key={d.documentId} className="rounded-card border border-line-200 p-2.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setLeyendoDoc(d.documentId)}
                  className="flex min-w-0 items-baseline gap-1.5 text-left text-body"
                  title="Leer lo que quedó indexado de este documento"
                >
                  <FileText className="h-3.5 w-3.5 shrink-0 text-ink-500" />
                  <span className="underline decoration-line-200 underline-offset-2 [overflow-wrap:anywhere]">
                    {d.titulo}
                  </span>
                </button>
                {selectorDeDestino(d)}
              </div>
              {/*
                EL DETALLE TRAE LO QUE SIRVE PARA DECIDIR: cuántos fragmentos
                quedaron buscables y cuándo se indexó. Es lo que se mira antes
                de reindexar o de quitar algo, y en la lista sería ruido.
              */}
              {modo === 'detalle' && (
                <p className="mt-1 text-meta text-ink-500">
                  {d.fragmentos.toLocaleString('es-CO')} fragmentos buscables
                  {d.indexadoEl ? ` · indexado el ${d.indexadoEl.slice(0, 10)}` : ''}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmarDialog confirmacion={confirmacion} onCerrar={() => setConfirmacion(null)} />
      <LeerDocumentoIndexado
        expedienteId={expediente.id}
        documentId={leyendoDoc}
        onCerrar={() => setLeyendoDoc(null)}
      />
    </section>
  );
};
