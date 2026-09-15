import React from 'react';
import { Loader2, Search } from 'lucide-react';
import { POR_PAGINA, useRegistroDeAuditoria } from '../hooks/useRegistroDeAuditoria';
import { PERIODOS, VISTAS, claveDelDia, hora, nombreCorto, nombreDeAccion, rotuloDelDia } from '../registro';
import type { AuditLogEntry } from '../services/audit.api';

/**
 * Auditoría en el teléfono. DERIVADA: ningún `public/handoff/app-*.html` dibuja
 * la auditoría a 375 px. Toma la escala de la cara nueva del artboard de
 * escritorio (`app-administrar-y-saldo.html`:303) y conserva la instrucción de
 * la maqueta móvil anterior (4e):
 *
 *   «La tabla densa de auditoría no cabe en 390px y NO SE INTENTA: se convierte
 *    en lista de eventos agrupada por día.»
 *
 * AGRUPAR POR DÍA ES LO QUE HACE ÚTIL EL REGISTRO. A esta pantalla se viene con
 * una pregunta con fecha —«¿quién descargó eso el martes?»—; el rótulo del día
 * convierte una lista larga en una consulta. El día es el LOCAL de quien mira:
 * agrupar por fecha UTC ponía un evento de las 11 p. m. en el día siguiente.
 *
 * Lee el MISMO registro que escritorio (`useRegistroDeAuditoria`): mismas
 * páginas, mismo periodo, mismo «no se pudo leer». Antes el teléfono no podía
 * pedir más que la primera lectura.
 *
 * LO QUE 4e DIBUJA Y NO SE PINTA: el sello «OK» por evento (solo se registran
 * acciones que ocurrieron) y la hoja «Antes / Después» (exigiría guardar el
 * estado previo de cada cambio, que la tabla no guarda).
 */
export const AuditMobileView: React.FC = () => {
  const r = useRegistroDeAuditoria();
  const periodo = PERIODOS.find((p) => p.id === r.periodo)?.etiqueta ?? '';

  /*
   * Agrupado por día CONSERVANDO EL ORDEN del servidor —lo más reciente
   * primero—. Reordenar aquí pondría a esta pantalla a discrepar del registro.
   */
  const porDia = React.useMemo(() => {
    const orden: string[] = [];
    const mapa = new Map<string, AuditLogEntry[]>();
    for (const e of r.visibles) {
      const dia = claveDelDia(e.timestamp);
      if (!mapa.has(dia)) {
        mapa.set(dia, []);
        orden.push(dia);
      }
      mapa.get(dia)!.push(e);
    }
    return orden.map((dia) => ({ dia, eventos: mapa.get(dia)! }));
  }, [r.visibles]);

  return (
    <div data-visita="vista-audit" className="cara-nueva cn-aud2 cn-aud2--movil">
      <div className="cn-aud2-movil-scroll">
        <h1 className="cn-aud2-titulo">Auditoría</h1>
        <p className="cn-aud2-entrada">El registro de lo que hizo su firma. Se consulta cuando algo ya pasó.</p>

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

        <div className="cn-aud2-movil-filtros">
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
          <select value={r.usuario} onChange={(e) => r.setUsuario(e.target.value)} className="cn-aud2-selector" aria-label="Usuario">
            <option value="TODOS">Usuario: todos</option>
            {r.usuarios.map((u) => (
              <option key={u} value={u}>
                {nombreCorto(u)}
              </option>
            ))}
          </select>
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
        </div>

        {r.estado === 'CARGANDO' && (
          <p className="cn-aud2-estado" role="status">
            <Loader2 className="cn-aud2-icono cn-aud2-icono--girando" aria-hidden="true" />
            Leyendo la auditoría…
          </p>
        )}

        {r.estado === 'NO_SE_PUDO_LEER' && (
          <div className="cn-aud2-aviso cn-aud2-aviso--peligro" role="alert">
            <p className="cn-aud2-aviso-titulo">No se pudo leer la auditoría</p>
            <p className="cn-aud2-aviso-texto">{r.error} Esto no significa que no haya eventos.</p>
            <button type="button" onClick={r.recargar} className="cn-aud2-boton cn-aud2-boton--suave">
              Intentar de nuevo
            </button>
          </div>
        )}

        {r.estado === 'VACIO' && <p className="cn-aud2-estado">No hay eventos registrados en {periodo.toLowerCase()}.</p>}

        {(r.estado === 'LISTA' || r.estado === 'INCOMPLETA') && r.visibles.length === 0 && (
          <p className="cn-aud2-estado">Ningún evento leído coincide con el filtro.</p>
        )}

        {porDia.map(({ dia, eventos }) => (
          <section key={dia} className="cn-aud2-dia-grupo">
            <p className="cn-aud2-dia">{rotuloDelDia(eventos[0].timestamp)}</p>
            <ul className="cn-aud2-tarjetas">
              {eventos.map((e) => (
                <li key={e.id} className="cn-aud2-tarjeta">
                  <div className="cn-aud2-tarjeta-arriba">
                    <span className="cn-aud2-accion">{nombreDeAccion(e.action)}</span>
                    <span className="cn-aud2-hora">{hora(e.timestamp)}</span>
                  </div>
                  {e.resource && <p className="cn-aud2-recurso">{e.resource}</p>}
                  <p className="cn-aud2-tarjeta-quien">
                    <span className="cn-aud2-detalle-valor">{e.userEmail}</span>
                    {e.ipAddress && <span className="cn-aud2-ip">{e.ipAddress}</span>}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {(r.estado === 'LISTA' || r.estado === 'INCOMPLETA') && (
          <div className="cn-aud2-pie">
            <p className="cn-aud2-conteo">
              {r.total !== null ? `Leídos ${r.eventos.length} de ${r.total} eventos` : `Leídos ${r.eventos.length} eventos`} · {periodo}
            </p>
            {r.hayMas && r.estado === 'LISTA' && (
              <button type="button" onClick={r.cargarMas} disabled={r.cargando} className="cn-aud2-boton cn-aud2-boton--suave">
                {r.cargando ? 'Leyendo…' : `Leer ${Math.min(POR_PAGINA, r.quedan ?? POR_PAGINA)} más`}
              </button>
            )}
            <button
              type="button"
              onClick={() => void r.exportar()}
              disabled={r.visibles.length === 0}
              className="cn-aud2-boton cn-aud2-boton--fantasma"
            >
              Descargar CSV · {r.visibles.length} {r.visibles.length === 1 ? 'fila' : 'filas'}
            </button>
          </div>
        )}

        {r.estado === 'INCOMPLETA' && (
          <div className="cn-aud2-aviso cn-aud2-aviso--peligro" role="alert">
            <p className="cn-aud2-aviso-titulo">No se pudo leer el resto del registro</p>
            <p className="cn-aud2-aviso-texto">{r.error} Lo que ve arriba está incompleto.</p>
            <button type="button" onClick={r.cargarMas} className="cn-aud2-boton cn-aud2-boton--suave">
              Intentar de nuevo
            </button>
          </div>
        )}

        {r.hashCsv && (
          <p className="cn-aud2-aviso cn-aud2-aviso--ok">
            CSV descargado · SHA-256 <span className="cn-aud2-hash">{r.hashCsv.slice(0, 16)}…</span>
          </p>
        )}

        <p className="cn-aud2-nota">
          El registro no se puede editar ni borrar, tampoco al eliminar la firma: conserva el correo de cada usuario, la IP
          y una descripción breve de cada acción.
        </p>
      </div>
    </div>
  );
};
