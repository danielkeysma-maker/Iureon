import React from 'react';
import { Loader2, RefreshCw, Search } from 'lucide-react';
import { POR_PAGINA, useRegistroDeAuditoria } from '../hooks/useRegistroDeAuditoria';
import { PERIODOS, VISTAS, fechaYHora, nombreCorto, nombreDeAccion } from '../registro';

/**
 * Auditoría, escritorio. Registro para consultar hacia atrás, no tablero.
 *
 * ─── SIGUE EL ARTBOARD «AUDITORÍA» DE `public/handoff/app-administrar-y-saldo.html`
 * (:303-353): título de 34 px con su frase, fila de herramientas —buscar,
 * usuario, periodo, descargar—, tabla de cuatro columnas con encabezado en
 * versales y la nota al pie sobre las palabras y la inalterabilidad.
 *
 * ─── LO QUE EL ARTBOARD PIDE Y AQUÍ NO ESTÁ, con la razón ──────────────────
 *
 * · Columna «Resultado» («Hecho» / «No se hizo»): solo se registran acciones
 *   que OCURRIERON; una columna que siempre dice «Hecho» es ruido, y «No se
 *   hizo» exigiría registrar los intentos fallidos, que no se registran. En su
 *   lugar va «Origen»: la IP que el servidor sí anota.
 * · «Descargar en Excel»: sale CSV, con su hash SHA-256, y se llama CSV.
 * · Frases como «Verificó el término de "Demanda de restitución"»: el servidor
 *   guarda la acción y una descripción breve por separado, y así se pintan —
 *   nombre de la acción arriba, descripción debajo—, sin componer una frase que
 *   el registro no contiene.
 *
 * ─── LO QUE ESTÁ Y EL ARTBOARD NO DIBUJA ────────────────────────────────────
 *
 * · «Vistas frecuentes»: preguntas ya formuladas sobre el registro. Existían
 *   antes de esta cara y funcionan; quitarlas escondería algo útil.
 * · El detalle en línea con el identificador del evento: es lo que permite
 *   encontrarlo en la base.
 * · «Leer más»: el registro se lee por páginas con su total (servidor,
 *   `check:auditoria-paginas`), y el pie dice cuántos eventos quedan.
 *
 * La inalterabilidad es real y de dos capas: la aplicación no tiene operación
 * de editar ni borrar eventos, y la base los bloquea con disparador
 * (migration-auditoria-inmutable.sql), para cualquiera.
 */
export const AuditView: React.FC = () => {
  const r = useRegistroDeAuditoria();
  const [abierto, setAbierto] = React.useState<string | null>(null);
  const periodo = PERIODOS.find((p) => p.id === r.periodo)?.etiqueta ?? '';

  const conteo = (() => {
    const leidos = r.eventos.length;
    const base = r.total !== null ? `Leídos ${leidos} de ${r.total} eventos` : `Leídos ${leidos} eventos`;
    const filtro = r.hayFiltro ? ` · ${r.visibles.length} coinciden con el filtro entre los leídos` : '';
    return `${base} · ${periodo}${filtro}`;
  })();

  return (
    <div data-visita="vista-audit" className="cara-nueva cn-aud2">
      <header className="cn-aud2-cabecera">
        <h1 className="cn-aud2-titulo">Auditoría</h1>
        <p className="cn-aud2-entrada">El registro de lo que hizo su firma. Se consulta cuando algo ya pasó; no es un tablero.</p>

        <div className="cn-aud2-herramientas">
          <label className="cn-aud2-buscar">
            <Search className="cn-aud2-buscar-icono" aria-hidden="true" />
            <input
              value={r.busqueda}
              onChange={(e) => r.setBusqueda(e.target.value)}
              placeholder="Por documento, actuación o usuario"
              aria-label="Buscar entre los eventos leídos"
              className="cn-aud2-campo"
            />
          </label>

          <select value={r.usuario} onChange={(e) => r.setUsuario(e.target.value)} className="cn-aud2-selector" aria-label="Usuario">
            <option value="TODOS">Usuario: todos</option>
            {r.usuarios.map((u) => (
              <option key={u} value={u}>
                {nombreCorto(u)}
              </option>
            ))}
          </select>

          <select
            value={r.periodo}
            onChange={(e) => r.setPeriodo(e.target.value as typeof r.periodo)}
            className="cn-aud2-selector"
            aria-label="Periodo"
          >
            {PERIODOS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.etiqueta}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => void r.exportar()}
            className="cn-aud2-boton cn-aud2-boton--fantasma"
            disabled={r.visibles.length === 0}
          >
            Descargar CSV · {r.visibles.length} {r.visibles.length === 1 ? 'fila' : 'filas'}
          </button>
          <button
            type="button"
            onClick={r.recargar}
            className="cn-aud2-boton cn-aud2-boton--icono"
            aria-label="Volver a leer la auditoría"
            title="Volver a leer la auditoría"
          >
            <RefreshCw className={`cn-aud2-icono${r.cargando ? ' cn-aud2-icono--girando' : ''}`} aria-hidden="true" />
          </button>
        </div>

        <div className="cn-aud2-vistas" role="group" aria-label="Vistas frecuentes">
          {VISTAS.map((v) => (
            <button
              key={v.etiqueta}
              type="button"
              aria-pressed={r.vista === v.etiqueta}
              onClick={() => r.setVista(r.vista === v.etiqueta ? null : v.etiqueta)}
              className={`cn-aud2-chip${r.vista === v.etiqueta ? ' cn-aud2-chip--activo' : ''}`}
            >
              {v.etiqueta}
            </button>
          ))}
          {r.hayFiltro && (
            <button type="button" onClick={r.limpiar} className="cn-aud2-boton cn-aud2-boton--fantasma">
              Limpiar
            </button>
          )}
        </div>
      </header>

      <div className="cn-aud2-cuerpo">
        {r.hashCsv && (
          <p className="cn-aud2-aviso cn-aud2-aviso--ok">
            CSV descargado · SHA-256{' '}
            <span className="cn-aud2-hash">
              {r.hashCsv.slice(0, 16)}…{r.hashCsv.slice(-8)}
            </span>{' '}
            — quien lo reciba puede recomputar el hash y compararlo.
          </p>
        )}

        {r.estado === 'CARGANDO' && (
          <p className="cn-aud2-estado" role="status">
            <Loader2 className="cn-aud2-icono cn-aud2-icono--girando" aria-hidden="true" />
            Leyendo la auditoría…
          </p>
        )}

        {r.estado === 'NO_SE_PUDO_LEER' && (
          <div className="cn-aud2-aviso cn-aud2-aviso--peligro" role="alert">
            <p className="cn-aud2-aviso-titulo">No se pudo leer la auditoría</p>
            <p className="cn-aud2-aviso-texto">
              {r.error} Esto no significa que no haya eventos: la lectura falló y no se sabe qué contiene el registro.
            </p>
            <button type="button" onClick={r.recargar} className="cn-aud2-boton cn-aud2-boton--suave">
              Intentar de nuevo
            </button>
          </div>
        )}

        {r.estado === 'VACIO' && (
          <p className="cn-aud2-estado">
            No hay eventos registrados en {periodo.toLowerCase()}.
            {r.periodo !== 'todo' && ' Puede ampliar el periodo a todo el registro.'}
          </p>
        )}

        {(r.estado === 'LISTA' || r.estado === 'INCOMPLETA') && (
          <>
            <div className="cn-aud2-tabla">
              <div className="cn-aud2-encabezado" aria-hidden="true">
                <span>FECHA Y HORA</span>
                <span>USUARIO</span>
                <span>QUÉ HIZO</span>
                <span>ORIGEN</span>
              </div>

              {r.visibles.length === 0 && (
                <p className="cn-aud2-estado">Ningún evento leído coincide con el filtro.</p>
              )}

              {r.visibles.map((e) => {
                const esteAbierto = abierto === e.id;
                return (
                  <div key={e.id} className={`cn-aud2-renglon${esteAbierto ? ' cn-aud2-renglon--abierto' : ''}`}>
                    <button
                      type="button"
                      className="cn-aud2-fila-boton"
                      aria-expanded={esteAbierto}
                      onClick={() => setAbierto(esteAbierto ? null : e.id)}
                    >
                      <span className="cn-aud2-hora">{fechaYHora(e.timestamp)}</span>
                      <span className="cn-aud2-usuario">{nombreCorto(e.userEmail)}</span>
                      <span className="cn-aud2-que">
                        <span className="cn-aud2-accion">{nombreDeAccion(e.action)}</span>
                        {e.resource && <span className="cn-aud2-recurso">{e.resource}</span>}
                      </span>
                      <span className="cn-aud2-ip">{e.ipAddress ?? '—'}</span>
                    </button>

                    {/*
                      EL DETALLE SE ABRE EN LÍNEA BAJO LA FILA, no en un panel:
                      conserva las filas vecinas a la vista, que es lo que se
                      reconstruye al consultar hacia atrás.
                    */}
                    {esteAbierto && (
                      <dl className="cn-aud2-detalle">
                        <div className="cn-aud2-detalle-par">
                          <dt className="cn-aud2-detalle-rotulo">Evento</dt>
                          <dd className="cn-aud2-id">{e.id}</dd>
                        </div>
                        <div className="cn-aud2-detalle-par">
                          <dt className="cn-aud2-detalle-rotulo">Registrado</dt>
                          <dd className="cn-aud2-hora">{e.timestamp}</dd>
                        </div>
                        <div className="cn-aud2-detalle-par">
                          <dt className="cn-aud2-detalle-rotulo">Usuario</dt>
                          <dd className="cn-aud2-detalle-valor">{e.userEmail}</dd>
                        </div>
                        <div className="cn-aud2-detalle-par">
                          <dt className="cn-aud2-detalle-rotulo">Origen (IP)</dt>
                          <dd className="cn-aud2-ip">{e.ipAddress ?? 'No se anotó'}</dd>
                        </div>
                        <div className="cn-aud2-detalle-par cn-aud2-detalle-par--ancho">
                          <dt className="cn-aud2-detalle-rotulo">Detalle</dt>
                          <dd className="cn-aud2-detalle-valor">{e.resource || 'Sin descripción'}</dd>
                        </div>
                      </dl>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="cn-aud2-pie">
              <p className="cn-aud2-conteo">{conteo}</p>
              {r.hayMas && r.estado === 'LISTA' && (
                <button type="button" onClick={r.cargarMas} disabled={r.cargando} className="cn-aud2-boton cn-aud2-boton--suave">
                  {r.cargando ? 'Leyendo…' : `Leer ${Math.min(POR_PAGINA, r.quedan ?? POR_PAGINA)} más`}
                </button>
              )}
            </div>

            {r.estado === 'INCOMPLETA' && (
              <div className="cn-aud2-aviso cn-aud2-aviso--peligro" role="alert">
                <p className="cn-aud2-aviso-titulo">No se pudo leer el resto del registro</p>
                <p className="cn-aud2-aviso-texto">{r.error} Lo que ve arriba está incompleto.</p>
                <button type="button" onClick={r.cargarMas} className="cn-aud2-boton cn-aud2-boton--suave">
                  Intentar de nuevo
                </button>
              </div>
            )}
          </>
        )}

        <p className="cn-aud2-nota">
          Cada línea se escribe en palabras, no en códigos; el identificador de cada evento está en su detalle y en el CSV.
          El registro no se puede editar ni borrar, y retirar a un usuario no borra lo que hizo. Tampoco se borra al
          eliminar la firma: conserva el correo de cada usuario, la IP y una descripción breve de cada acción.
        </p>
      </div>
    </div>
  );
};
