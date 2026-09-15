import React from 'react';
import { ExternalLink, Loader2, RefreshCw, X } from 'lucide-react';
import { privacyApi, type Disclosure, type Subprocessor, type DataClass } from '../privacy.api';
import { partirEnTituloYDetalle } from '../../audit/registro';
import { SeguridadDeLaFirma } from '../../support/components/SeguridadDeLaFirma';
import type { SupportAccess } from '../../support/support.api';

/**
 * Privacidad y seguridad. La pantalla que se muestra ante un cliente.
 *
 * ─── SIGUE LOS ARTBOARDS DE `public/handoff/app-ajustes-y-plan.html` ────────
 *
 *  · :78-134 — cabecera en tinta con la posición de la firma, los sellos
 *    («N subencargados activos», «leída de la configuración») y la descarga;
 *    «Quién toca el contenido de sus casos» en tabla de cuatro columnas;
 *    «Quién no toca el contenido» en filas; la nota de que la lista se lee de
 *    la configuración.
 *  · :136-159 — «Lo que nunca ocurre», tarjetas verdes con aspa.
 *
 * ─── LA LISTA LA DECIDE EL SERVIDOR, TAMBIÉN LA DIVISIÓN ────────────────────
 *
 * Aquí no se escribe ningún proveedor. Lo que va arriba es lo que el servidor
 * declara que recibe contenido del caso, audio o transcritos —lo que cubre el
 * secreto profesional—; lo demás va abajo. Así la frase «no reciben el texto
 * de sus escritos» es cierta por construcción, no por revisión.
 *
 * ─── LO QUE EL ARTBOARD PIDE Y AQUÍ NO ESTÁ, con la razón ──────────────────
 *
 * · «Actualizado hoy»: no hay historial del registro. Se dice la hora de ESTA
 *   lectura, que es lo único verdadero.
 * · Las líneas de «Lo que nunca ocurre» que el servidor no declara («está
 *   contratado así con cada proveedor», «ninguna otra firma ve lo suyo»,
 *   «Iureon no radica ni firma nada»): una afirmación sobre privacidad solo se
 *   publica si el registro del servidor la sostiene y su check la vigila.
 * · «Descargar para el cliente» como documento: sale la lista en CSV con la hora
 *   de lectura, que es lo que el artboard promete («sale con la fecha y con la
 *   configuración vigente ese día»), sin maquetar un certificado.
 *
 * ─── LO QUE ESTÁ Y EL ARTBOARD NO DIBUJA ────────────────────────────────────
 *
 * · La base de transferencia bajo la ubicación: es la pregunta que exige la
 *   Ley 1581 para sacar un dato del país, y el servidor la trae.
 * · «Lo que sí se conserva»: la auditoría sobrevive al borrado de la firma, y
 *   callarlo dejaría creer que eliminar la firma lo borra todo.
 * · «Seguridad» (`support/components/SeguridadDeLaFirma.tsx`), DERIVADA.
 */

const ETIQUETA_DATOS: Record<DataClass, string> = {
  IDENTIFICACION: 'Identificación',
  CONTENIDO_DEL_CASO: 'Contenido del caso',
  AUDIO_DE_AUDIENCIA: 'Audio de audiencia',
  TRANSCRITO: 'Transcrito',
  DATOS_DE_PAGO: 'Datos de pago',
  METADATOS_DE_USO: 'Metadatos de uso'
};

const esSensible = (dato: DataClass): boolean =>
  dato === 'CONTENIDO_DEL_CASO' || dato === 'AUDIO_DE_AUDIENCIA' || dato === 'TRANSCRITO';

const tocaElCaso = (s: Subprocessor): boolean => s.datos.some(esSensible);

const campo = (v: string | null): string => `"${String(v ?? '').replace(/"/g, '""')}"`;

/** La lista tal como llegó, con la hora de la lectura en cada fila: es lo que el cliente de la firma recibe. */
const csvDeLaLista = (lista: Subprocessor[], leidoEl: Date): string => {
  const cabecera = ['Subencargado', 'Para qué', 'Qué recibe', 'Ubicación', 'Base de transferencia', 'Conserva', 'Retención', 'A través de', 'Política', 'Leído de la configuración'];
  const filas = lista.map((s) =>
    [
      s.nombre,
      s.proposito,
      s.datos.map((d) => ETIQUETA_DATOS[d]).join('; '),
      s.ubicacion,
      s.baseDeTransferencia,
      s.retiene ? 'Sí' : 'No',
      s.retencion,
      s.atravesDe ?? '',
      s.sitio,
      leidoEl.toISOString()
    ]
      .map(campo)
      .join(',')
  );
  return '﻿' + [cabecera.map(campo).join(','), ...filas].join('\r\n');
};

interface SubprocessorsViewProps {
  puedeDecidirAcceso?: boolean;
  onAbrirSolicitud?: (solicitud: SupportAccess) => void;
  refrescoAcceso?: number;
  onIrAuditoria?: () => void;
}

export const SubprocessorsView: React.FC<SubprocessorsViewProps> = ({
  puedeDecidirAcceso = false,
  onAbrirSolicitud,
  refrescoAcceso,
  onIrAuditoria
}) => {
  const [disclosure, setDisclosure] = React.useState<Disclosure | null>(null);
  const [lista, setLista] = React.useState<Subprocessor[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [error, setError] = React.useState('');
  /* La hora de la lectura: es lo que respalda el sello «leída de la configuración». */
  const [leidoEl, setLeidoEl] = React.useState<Date | null>(null);

  const cargar = React.useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const { disclosure: d, subprocessors: s } = await privacyApi.subprocessors();
      setDisclosure(d);
      setLista(s);
      setLeidoEl(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'La lectura falló.');
    } finally {
      setCargando(false);
    }
  }, []);

  React.useEffect(() => {
    void cargar();
  }, [cargar]);

  const descargar = () => {
    if (!leidoEl) return;
    const url = URL.createObjectURL(new Blob([csvDeLaLista(lista, leidoEl)], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `subencargados-${leidoEl.toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sensibles = lista.filter(tocaElCaso);
  const otros = lista.filter((s) => !tocaElCaso(s));
  const leida = disclosure !== null;
  const horaDeLectura = leidoEl?.toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div data-visita="vista-privacidad" className="cara-nueva cn-pri">
      <div className="cn-pri-scroll">
        <header className="cn-pri-cabecera">
          <div className="cn-pri-ancho">
            <h1 className="cn-pri-titulo">Privacidad y seguridad</h1>
            <p className="cn-pri-entrada">
              Su firma es la <b>responsable</b> de los datos de sus clientes; Iureon es su <b>encargado</b>. Cada proveedor
              de esta lista es, por tanto, un <b>subencargado de su firma</b>
              {disclosure ? ` — ${disclosure.marcoLegal}.` : '.'}
            </p>
            <div className="cn-pri-sellos">
              {leida && (
                <span className="cn-pri-sello">
                  <span className="cn-pri-punto" aria-hidden="true" />
                  {lista.length} subencargados activos
                </span>
              )}
              {error && !leida && <span className="cn-pri-sello cn-pri-sello--peligro">No se pudo leer el registro</span>}
              <span className="cn-pri-sello cn-pri-sello--suave">
                Leída de la configuración del sistema, no escrita a mano{horaDeLectura ? ` · ${horaDeLectura}` : ''}
              </span>
              <button type="button" onClick={descargar} disabled={!leida} className="cn-pri-boton cn-pri-boton--blanco">
                Descargar la lista (CSV)
              </button>
            </div>
          </div>
        </header>

        <div className="cn-pri-cuerpo cn-pri-ancho">
          {cargando && !leida && (
            <p className="cn-pri-estado" role="status">
              <Loader2 className="cn-pri-icono cn-pri-icono--girando" aria-hidden="true" />
              Leyendo la configuración…
            </p>
          )}

          {error && (
            <div className="cn-pri-aviso" role="alert">
              <p className="cn-pri-aviso-titulo">No se pudo leer el registro de subencargados</p>
              <p className="cn-pri-parrafo">
                {error} Esto no significa que ningún proveedor reciba datos: la lectura falló y no se sabe qué dice hoy la
                configuración.
              </p>
              <button type="button" onClick={() => void cargar()} className="cn-pri-boton cn-pri-boton--suave">
                Intentar de nuevo
              </button>
            </div>
          )}

          {leida && (
            <>
              <section className="cn-pri-seccion">
                <h2 className="cn-pri-h2">Quién toca el contenido de sus casos</h2>
                <p className="cn-pri-parrafo">
                  Reciben texto de sus escritos o de sus grabaciones: lo que cubre el secreto profesional. Los que no lo
                  reciben van aparte, abajo.
                </p>

                {sensibles.length === 0 ? (
                  <p className="cn-pri-estado">La configuración vigente no declara ningún proveedor que reciba contenido del caso.</p>
                ) : (
                  <div className="cn-pri-tabla">
                    <div className="cn-pri-encabezado" aria-hidden="true">
                      <span>SUBENCARGADO</span>
                      <span>QUÉ RECIBE</span>
                      <span>UBICACIÓN</span>
                      <span>RETENCIÓN</span>
                    </div>
                    {sensibles.map((s, i) => (
                      <div key={`${s.nombre}-${i}`} className="cn-pri-fila">
                        <div className="cn-pri-quien">
                          <p className="cn-pri-nombre">{s.nombre}</p>
                          {s.atravesDe && <p className="cn-pri-sub">A través de {s.atravesDe}</p>}
                          <a href={s.sitio} target="_blank" rel="noopener noreferrer" className="cn-pri-enlace">
                            Su política <ExternalLink className="cn-pri-enlace-icono" aria-hidden="true" />
                          </a>
                        </div>
                        <div className="cn-pri-celda">
                          <span className="cn-pri-rotulo">Qué recibe</span>
                          <p className="cn-pri-texto">{s.proposito}</p>
                          <p className="cn-pri-datos">
                            {s.datos.map((d) => (
                              <span key={d} className={`cn-pri-dato${esSensible(d) ? ' cn-pri-dato--sensible' : ''}`}>
                                {ETIQUETA_DATOS[d]}
                              </span>
                            ))}
                          </p>
                        </div>
                        <div className="cn-pri-celda">
                          <span className="cn-pri-rotulo">Ubicación</span>
                          <p className="cn-pri-texto">{s.ubicacion}</p>
                          <p className="cn-pri-sub">{s.baseDeTransferencia}</p>
                        </div>
                        <div className="cn-pri-celda">
                          <span className="cn-pri-rotulo">{s.retiene ? 'Retención' : 'No conserva'}</span>
                          <p className="cn-pri-texto">{s.retencion}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="cn-pri-seccion">
                <h2 className="cn-pri-h2">Quién no toca el contenido</h2>
                <p className="cn-pri-parrafo">No reciben el texto de sus escritos ni sus grabaciones.</p>
                {otros.length === 0 ? (
                  <p className="cn-pri-estado">La configuración vigente no declara proveedores de este grupo.</p>
                ) : (
                  <div className="cn-pri-filas-simples">
                    {otros.map((s, i) => (
                      <div key={`${s.nombre}-${i}`} className="cn-pri-fila-simple">
                        <a href={s.sitio} target="_blank" rel="noopener noreferrer" className="cn-pri-nombre cn-pri-enlace-nombre">
                          {s.nombre}
                        </a>
                        <span className="cn-pri-texto">
                          {s.proposito} <span className="cn-pri-sub">Recibe: {s.datos.map((d) => ETIQUETA_DATOS[d]).join(', ')}.</span>
                        </span>
                        <span className="cn-pri-texto">{s.ubicacion}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="cn-pri-seccion cn-pri-posicion">
                {(
                  [
                    ['Su firma', disclosure.posicionDeLaFirma],
                    ['Iureon', disclosure.posicionDeIureon],
                    ['Estos terceros', disclosure.posicionDeEstosTerceros]
                  ] as const
                ).map(([titulo, texto]) => (
                  <div key={titulo} className="cn-pri-posicion-item">
                    <p className="cn-pri-posicion-titulo">{titulo}</p>
                    <p className="cn-pri-parrafo">{texto}</p>
                  </div>
                ))}
              </section>

              <div className="cn-pri-caja">
                <p className="cn-pri-parrafo">{disclosure.advertencia}</p>
              </div>

              <section className="cn-pri-seccion">
                <h2 className="cn-pri-h2">Lo que nunca ocurre</h2>
                <div className="cn-pri-tarjetas">
                  {disclosure.loQueNoHacemos.map((linea, i) => {
                    const { titulo, detalle } = partirEnTituloYDetalle(linea);
                    return (
                      <div key={i} className="cn-pri-tarjeta">
                        <X className="cn-pri-tarjeta-icono" aria-hidden="true" />
                        <div className="cn-pri-tarjeta-texto">
                          <p className="cn-pri-tarjeta-titulo">{titulo}</p>
                          {detalle && <p className="cn-pri-tarjeta-detalle">{detalle}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {(disclosure.loQueSeConserva ?? []).length > 0 && (
                <section className="cn-pri-seccion">
                  <h2 className="cn-pri-h2">Lo que sí se conserva</h2>
                  <div className="cn-pri-tarjetas">
                    {(disclosure.loQueSeConserva ?? []).map((linea, i) => {
                      const { titulo, detalle } = partirEnTituloYDetalle(linea);
                      return (
                        <div key={i} className="cn-pri-tarjeta cn-pri-tarjeta--neutra">
                          <div className="cn-pri-tarjeta-texto">
                            <p className="cn-pri-tarjeta-titulo">{titulo}</p>
                            {detalle && <p className="cn-pri-tarjeta-detalle">{detalle}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </>
          )}

          <SeguridadDeLaFirma
            puedeDecidir={puedeDecidirAcceso}
            onAbrirSolicitud={onAbrirSolicitud}
            refresco={refrescoAcceso}
            onIrAuditoria={onIrAuditoria}
          />

          <div className="cn-pri-final">
            <button type="button" onClick={() => void cargar()} disabled={cargando} className="cn-pri-boton cn-pri-boton--suave">
              <RefreshCw className={`cn-pri-icono${cargando ? ' cn-pri-icono--girando' : ''}`} aria-hidden="true" />
              Volver a leer la configuración
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
