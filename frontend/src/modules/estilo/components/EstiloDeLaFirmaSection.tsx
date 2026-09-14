import React, { useMemo, useState } from 'react';
import { Check, RefreshCw, Trash2 } from 'lucide-react';
import { Dialog } from '../../../design/Dialog';
import { SelectorDelFormulario } from '../../workspace/components/SelectorDelFormulario';
import { useCatalogBranchesState } from '../../catalog/hooks/useCatalogBranches';
import { branchLabel } from '../../catalog/branchLabels';
import { usePerfilDeEstilo } from '../hooks/usePerfilDeEstilo';
import { estiloApi } from '../services/estilo.api';
import {
  ETIQUETA_FUENTE,
  ETIQUETA_ROL,
  LINEA_RECALCULO,
  MENSAJE_QUITADO,
  MENSAJE_SOLO_SOCIO_QUITAR,
  OPCION_GENERAL_DEL_ROL,
  TEXTO_SECCION_AJUSTES,
  TITULO_SECCION_AJUSTES,
  confirmacionDeQuitar,
  filasDelEstilo,
  lecturaDeLaSeccion
} from '../estiloEnPantalla';
import type { MetaDeLeccion, RolDelEstilo } from '../types';

/**
 * Ajustes → Estilo de la firma.
 *
 * Es el sitio que el pie de «Enseñar este formato» promete: «Puede quitarlo
 * cuando quiera, desde Ajustes → Estilo de la firma». Sin esta sección esa
 * frase apuntaba a nada.
 *
 * ─── LO QUE SE VE ES LO QUE SE APLICA ──────────────────────────────────────
 *
 * Rol y rama eligen el MISMO alcance que usa la redacción, con el mismo
 * respaldo al general del rol: el servidor lo resuelve en `GET /api/estilo` y
 * aquí no se recalcula nada. Si para la rama no hay lecciones, se muestra el
 * general y se dice, porque quitar ahí quita del general.
 *
 * ─── LEER ES DE TODOS; QUITAR, DEL SOCIO ───────────────────────────────────
 *
 * Cualquier usuario de la firma lee el estilo (el abogado debe saber con qué
 * forma saldrán sus borradores). «Quitar» se ofrece solo cuando el servidor
 * responde `puedeEnsenar`, que calcula con el rol del token; el `DELETE` lo
 * vuelve a exigir. A los demás se les dice por qué no ven el botón.
 *
 * ─── UN FALLO NO ES UN VACÍO ───────────────────────────────────────────────
 *
 * Si la consulta falla se dice «No se pudo leer el estilo de la firma», con
 * «Volver a intentar», y nunca «aún no ha enseñado un formato».
 */

const ROLES: RolDelEstilo[] = ['LITIGANTE', 'DESPACHO', 'SECRETARIA'];

const fechaLarga = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

export const EstiloDeLaFirmaSection: React.FC = () => {
  const [rol, setRol] = useState<RolDelEstilo>('LITIGANTE');
  const [rama, setRama] = useState('');
  const ramas = useCatalogBranchesState();
  const estado = usePerfilDeEstilo(rol, rama || null);
  const lectura = lecturaDeLaSeccion(estado);

  const [porQuitar, setPorQuitar] = useState<MetaDeLeccion | null>(null);
  const [quitando, setQuitando] = useState(false);
  const [errorAlQuitar, setErrorAlQuitar] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const opciones = useMemo(
    () => [{ valor: '', etiqueta: OPCION_GENERAL_DEL_ROL }, ...ramas.ramas.map((r) => ({ valor: r, etiqueta: branchLabel(r) }))],
    [ramas.ramas]
  );

  const abrirConfirmacion = (leccion: MetaDeLeccion) => {
    setErrorAlQuitar(null);
    setAviso(null);
    setPorQuitar(leccion);
  };

  const quitar = async () => {
    if (!porQuitar) return;
    setQuitando(true);
    setErrorAlQuitar(null);
    try {
      /* `retirar` avisa a los oyentes del estilo: esta sección y el asistente releen el perfil solos. */
      await estiloApi.retirar(porQuitar.id);
      setPorQuitar(null);
      setAviso(MENSAJE_QUITADO);
    } catch (err) {
      setErrorAlQuitar(err instanceof Error ? err.message : 'No se pudo quitar el escrito. El estilo no cambió.');
    } finally {
      setQuitando(false);
    }
  };

  const respuesta = estado.estado === 'LISTO' ? estado.respuesta : null;
  const confirmacion = porQuitar ? confirmacionDeQuitar(porQuitar, fechaLarga) : null;

  return (
    <section className="cn-est-seccion">
      <header className="cn-aju-cabecera">
        <h2 className="cn-aju-cabecera-titulo">{TITULO_SECCION_AJUSTES}</h2>
        <p className="cn-aju-cabecera-texto">{TEXTO_SECCION_AJUSTES}</p>
      </header>

      <div className="cn-est-roles" role="tablist" aria-label="Quién firma el escrito">
        {ROLES.map((r) => (
          <button
            key={r}
            type="button"
            role="tab"
            aria-selected={rol === r}
            onClick={() => {
              setRol(r);
              setAviso(null);
            }}
            className="cn-est-rol"
          >
            {ETIQUETA_ROL[r]}
          </button>
        ))}
      </div>

      <div className="cn-est-filtros">
        <SelectorDelFormulario
          id="cn-est-rama"
          etiqueta="Rama"
          valor={rama}
          opciones={opciones}
          onChange={(v) => {
            setRama(v);
            setAviso(null);
          }}
          cargando={ramas.estado === 'CARGANDO'}
          pie={
            ramas.estado === 'ERROR'
              ? 'No se pudo leer la lista de ramas; queda el general del rol.'
              : 'Sin rama, el general del rol: el que se aplica cuando una rama no tiene formato propio.'
          }
        />
      </div>

      <p className="cn-est-recalculo">{LINEA_RECALCULO}</p>

      {aviso && (
        <p className="cn-est-aviso-ok" role="status">
          <Check className="cn-est-icono cn-est-icono--si" strokeWidth={2.2} aria-hidden />
          {aviso}
        </p>
      )}

      {lectura.tipo === 'CARGANDO' && (
        <p className="cn-est-estado" role="status">
          <RefreshCw className="cn-aju-girando" aria-hidden="true" />
          {lectura.texto}
        </p>
      )}

      {lectura.tipo === 'ERROR' && (
        <div className="cn-est-error-lectura" role="alert">
          <p>{lectura.texto}. Nada de lo guardado se modificó.</p>
          <button type="button" className="cn-est-reintentar" onClick={estado.recargar}>
            Volver a intentar
          </button>
        </div>
      )}

      {lectura.tipo === 'VACIO' && <p className="cn-est-vacio">{lectura.texto}</p>}

      {lectura.tipo === 'PERFIL' && respuesta && (
        <>
          {lectura.respaldo && <p className="cn-est-respaldo">{lectura.respaldo}</p>}

          <div>
            <h3 className="cn-aju-subtitulo">Cómo escribe la firma · {lectura.alcance}</h3>
            <dl className="cn-est-perfil">
              {filasDelEstilo(respuesta.perfil).map((fila) => (
                <div key={fila.clave} className="cn-est-perfil-fila">
                  <dt className="cn-est-perfil-rotulo">{fila.titulo}</dt>
                  <dd className="cn-est-perfil-valor">
                    <ul className="cn-est-perfil-items">
                      {fila.items.map((item, i) => (
                        <li key={`${fila.clave}-${i}`} className="cn-est-perfil-item">
                          <span>{item.texto}</span>
                          {item.detalle && <span className="cn-est-visto">{item.detalle}</span>}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <h3 className="cn-aju-subtitulo">
              Escritos enseñados ({respuesta.lecciones.length})
            </h3>
            {!respuesta.puedeEnsenar && <p className="cn-est-solo-socio">{MENSAJE_SOLO_SOCIO_QUITAR}</p>}
            <ul className="cn-est-lecciones">
              {respuesta.lecciones.map((l) => (
                <li key={l.id} className="cn-est-leccion">
                  <div className="cn-est-leccion-textos">
                    <span className="cn-est-leccion-fecha">{fechaLarga(l.createdAt)}</span>
                    <span className="cn-est-leccion-detalle">
                      Enseñó {l.taughtBy} · {ETIQUETA_FUENTE[l.fuente]}
                    </span>
                  </div>
                  {respuesta.puedeEnsenar ? (
                    <button type="button" className="cn-est-quitar" onClick={() => abrirConfirmacion(l)}>
                      <Trash2 className="cn-est-quitar-icono" strokeWidth={1.8} aria-hidden />
                      Quitar
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <div className="cn-est-dialogos">
        <Dialog
          abierto={porQuitar !== null}
          onCerrar={() => {
            if (!quitando) setPorQuitar(null);
          }}
          titulo={confirmacion?.titulo ?? ''}
          tamano="S"
          hayCambiosSinGuardar={quitando}
          acciones={
            <>
              <button type="button" className="cn-est-boton" onClick={() => setPorQuitar(null)} disabled={quitando}>
                Cancelar
              </button>
              <button type="button" className="cn-est-boton cn-est-boton--peligro" onClick={() => void quitar()} disabled={quitando}>
                {quitando ? 'Quitando…' : 'Quitar el escrito'}
              </button>
            </>
          }
        >
          {confirmacion && (
            <div className="cn-est-cuerpo">
              <p className="cn-est-confirmacion">{confirmacion.texto}</p>
              <p className="cn-est-confirmacion-detalle">{confirmacion.detalle}</p>
              {errorAlQuitar && (
                <p className="cn-est-alerta" role="alert">
                  {errorAlQuitar}
                </p>
              )}
            </div>
          )}
        </Dialog>
      </div>
    </section>
  );
};
