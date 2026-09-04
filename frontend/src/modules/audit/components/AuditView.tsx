import React, { useEffect, useMemo, useState } from 'react';
import { Download, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { auditApi, type AuditLogEntry } from '../services/audit.api';

/**
 * Auditoría. Registro denso para consultar hacia atrás, no tablero de métricas.
 *
 * ─── CERO GRÁFICAS, CERO CONTADORES GRANDES ─────────────────────────────────
 *
 * El valor de esta pantalla es ENCONTRAR un evento, no resumirlos. Filas de
 * 26px, la hora en mono a la izquierda: quien consulta auditoría escanea una
 * columna de tiempos buscando una franja, no lee registros de a uno.
 *
 * ─── LAS VISTAS FRECUENTES SON PREGUNTAS, NO FILTROS ────────────────────────
 *
 * Cada chip es una pregunta real ya formulada («cambios en el catálogo»), no
 * una combinación que el usuario deba armar campo por campo. Solo se ofrecen
 * las que los datos de hoy pueden responder.
 *
 * ─── LO QUE EL ARTBOARD 2b PIDE Y AQUÍ NO ESTÁ, con la razón ────────────────
 *
 * · «Accesos fallidos»: los intentos de login fallidos no se registran todavía
 *   (la autenticación vive en Supabase Auth y sus eventos no llegan a esta
 *   tabla). Ofrecer el chip sería prometer una respuesta vacía.
 * · Columna «Resultado»: todo lo que hoy se registra son acciones que
 *   ocurrieron — una columna que siempre dice OK es ruido.
 * · «CSV firmado»: el CSV sale con su hash SHA-256 calculado y mostrado — un
 *   hash de integridad, no una firma criptográfica del servidor. Se etiqueta
 *   como lo que es; la firma del servidor queda en cola.
 * · Detalle antes/después de un evento: exigiría guardar el estado previo en
 *   cada escritura, que hoy no se guarda.
 *
 * La inalterabilidad sí es real y de dos capas: la aplicación no tiene
 * operación de editar ni borrar eventos, y la base los bloquea con disparador
 * (migration-auditoria-inmutable.sql) — para cualquiera, incluido el rol de
 * servicio.
 */

/**
 * Se exporta para que la pantalla móvil (4e) nombre las acciones con ESTE mapa.
 * Una copia acabaría mostrando el código crudo —`DRAFT_GENERATED`— el día que
 * se añada una acción y solo se actualice una de las dos listas, y el registro
 * de auditoría es justo donde eso no puede pasar.
 */
export const ACCIONES: Record<string, string> = {
  DRAFT_GENERATED: 'Generó escrito',
  TRANSCRIPTION_CREATED: 'Transcribió',
  TRANSCRIPTION_DELETED: 'Eliminó transcripción',
  CATALOG_TERM_VERIFIED: 'Verificó actuación',
  INTERVIEW_DECIDED: 'Decidió entrevista',
  ACTA_LISTA: 'Revisión de acta',
  FIRM_CREATED: 'Creó la firma',
  FIRM_UPDATED: 'Actualizó la firma',
  FIRM_CREDITS_ADDED: 'Acreditó saldo',
  FIRM_STATUS_CHANGED: 'Cambió estado de la firma',
  USER_CREATED: 'Creó usuario',
  SUPERADMIN_LISTED_FIRMS: 'Operación listó firmas',
  SUPPORT_CHAT_MESSAGE: 'Chat de soporte',
  PUSH_SUBSCRIBED: 'Avisos activados en un dispositivo',
  PUSH_UNSUBSCRIBED: 'Avisos desactivados en un dispositivo',
  PLAN_PAGADO: 'Pagó el plan',
  PLAN_ACTUALIZADO: 'Operación fijó el plan'
};

/** Las preguntas reales que estos datos pueden responder hoy. */
const VISTAS: Array<{ etiqueta: string; acciones: string[] }> = [
  { etiqueta: 'Escritos generados', acciones: ['DRAFT_GENERATED'] },
  { etiqueta: 'Cambios en el catálogo', acciones: ['CATALOG_TERM_VERIFIED'] },
  { etiqueta: 'Transcripciones', acciones: ['TRANSCRIPTION_CREATED', 'TRANSCRIPTION_DELETED', 'ACTA_LISTA'] },
  { etiqueta: 'Decisiones de entrevista', acciones: ['INTERVIEW_DECIDED'] },
  { etiqueta: 'Saldo y firma', acciones: ['FIRM_CREDITS_ADDED', 'FIRM_UPDATED', 'FIRM_STATUS_CHANGED', 'PLAN_PAGADO', 'PLAN_ACTUALIZADO'] }
];

const fechaHora = (iso: string): { fecha: string; hora: string } => {
  const d = new Date(iso);
  return {
    fecha: d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' }),
    hora: d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  };
};

const csvCampo = (v: string | null): string => `"${String(v ?? '').replace(/"/g, '""')}"`;

export const AuditView: React.FC = () => {
  const [eventos, setEventos] = useState<AuditLogEntry[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [usuario, setUsuario] = useState('TODOS');
  const [vista, setVista] = useState<string | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [hashCsv, setHashCsv] = useState('');

  const cargar = async () => {
    setCargando(true);
    setError('');
    try {
      setEventos(await auditApi.listLogs());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo leer la auditoría.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void cargar();
  }, []);

  const usuarios = useMemo(
    () => Array.from(new Set(eventos.map((e) => e.userEmail))).sort(),
    [eventos]
  );

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const accionesDeVista = vista ? VISTAS.find((v) => v.etiqueta === vista)?.acciones : null;

    return eventos.filter((e) => {
      if (usuario !== 'TODOS' && e.userEmail !== usuario) return false;
      if (accionesDeVista && !accionesDeVista.includes(e.action)) return false;
      if (!q) return true;
      return (
        e.resource.toLowerCase().includes(q) ||
        e.userEmail.toLowerCase().includes(q) ||
        (ACCIONES[e.action] ?? e.action).toLowerCase().includes(q)
      );
    });
  }, [eventos, busqueda, usuario, vista]);

  /**
   * El CSV con su hash de integridad, calculado sobre los bytes exactos del
   * archivo. Quien lo reciba puede recomputarlo y compararlo — eso es lo que
   * el hash garantiza. No es una firma del servidor, y no se llama firma.
   */
  const exportar = async () => {
    const cabecera = ['Fecha y hora', 'Usuario', 'Acción', 'Detalle', 'Origen (IP)'];
    const filas = visibles.map((e) =>
      [
        csvCampo(e.timestamp),
        csvCampo(e.userEmail),
        csvCampo(ACCIONES[e.action] ?? e.action),
        csvCampo(e.resource),
        csvCampo(e.ipAddress)
      ].join(',')
    );
    const contenido = '﻿' + [cabecera.map((c) => csvCampo(c)).join(','), ...filas].join('\r\n');

    const bytes = new TextEncoder().encode(contenido);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const hash = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
    setHashCsv(hash);

    const blob = new Blob([bytes], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-canvas font-sans">
      <header className="flex shrink-0 flex-wrap items-end gap-3 border-b border-line-200 bg-surface px-5 py-3.5">
        <div className="min-w-0 flex-1">
          <h1 className="text-title text-ink-900">Auditoría</h1>
          <p className="mt-0.5 text-meta text-ink-500">
            Todo lo que hizo la firma en Iureon. Inalterable: los eventos no se editan ni se
            borran, y la base lo impone.
          </p>
        </div>

        <button onClick={() => void exportar()} className="btn-secondary btn-sm" disabled={visibles.length === 0}>
          <Download className="h-3.5 w-3.5" />
          Exportar CSV con hash
        </button>
        <button onClick={() => void cargar()} className="btn-neutral btn-sm">
          <RefreshCw className={`h-3.5 w-3.5 ${cargando ? 'animate-spin' : ''}`} />
        </button>
      </header>

      {/* ─── FILTROS ─────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-line-200 bg-surface px-5 py-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Por documento, actuación o usuario"
            className="field w-[280px] max-w-full pl-8"
          />
        </div>

        <select value={usuario} onChange={(e) => setUsuario(e.target.value)} className="field max-w-[200px] py-1">
          <option value="TODOS">Usuario: todos</option>
          {usuarios.map((u) => (
            <option key={u} value={u}>
              {u.split('@')[0]}
            </option>
          ))}
        </select>

        {(busqueda || usuario !== 'TODOS' || vista) && (
          <button
            onClick={() => {
              setBusqueda('');
              setUsuario('TODOS');
              setVista(null);
            }}
            className="text-meta text-brand-700 underline underline-offset-2"
          >
            Limpiar
          </button>
        )}

        <span className="ml-auto font-mono text-[11px] text-ink-400">
          {visibles.length} de {eventos.length} eventos
        </span>
      </div>

      {/* ─── VISTAS FRECUENTES · preguntas, no filtros ────────────────────── */}
      <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-line-200 bg-surface px-5 py-2">
        <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
          Vistas frecuentes
        </span>
        {VISTAS.map((v) => (
          <button
            key={v.etiqueta}
            onClick={() => setVista(vista === v.etiqueta ? null : v.etiqueta)}
            className={`rounded-control px-2.5 py-1 text-[12px] font-medium ${
              vista === v.etiqueta ? 'bg-brand-700 text-white' : 'bg-canvas text-ink-500 hover:text-ink-900'
            }`}
          >
            {v.etiqueta}
          </button>
        ))}
      </div>

      {/* ─── LA TABLA ─────────────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <div className="mx-auto max-w-5xl">
          {error && <p className="notice-unverified mb-3">{error}</p>}

          {hashCsv && (
            <p className="mb-3 rounded-card border border-line-200 bg-surface px-3 py-2 font-mono text-[11px] text-ink-500">
              <ShieldCheck className="mr-1.5 inline h-3.5 w-3.5 text-verified" />
              CSV exportado · SHA-256 <span className="text-ink-900">{hashCsv.slice(0, 16)}…{hashCsv.slice(-8)}</span>{' '}
              — quien lo reciba puede recomputar el hash y compararlo.
            </p>
          )}

          {!cargando && eventos.length === 0 && !error && (
            <p className="card py-10 text-center text-meta text-ink-500">
              Todavía no hay eventos registrados. Aparecerán aquí a medida que la firma trabaje.
            </p>
          )}

          {visibles.length > 0 && (
            <div className="overflow-hidden rounded-card border border-line-200 bg-surface">
              <div className="t-head hidden items-center gap-3 md:flex">
                <span className="w-[104px] shrink-0">Fecha y hora</span>
                <span className="w-[110px] shrink-0">Usuario</span>
                <span className="w-[150px] shrink-0">Acción</span>
                <span className="min-w-0 flex-1">Objeto</span>
                <span className="w-[100px] shrink-0">Origen</span>
              </div>

              {visibles.map((e) => {
                const { fecha, hora } = fechaHora(e.timestamp);
                const abiertoEste = abierto === e.id;

                return (
                  <React.Fragment key={e.id}>
                    <button
                      onClick={() => setAbierto(abiertoEste ? null : e.id)}
                      className={`flex w-full items-center gap-3 border-b border-line-100 px-3 py-[5px] text-left last:border-0 ${
                        abiertoEste ? 'bg-brand-50' : 'hover:bg-canvas'
                      }`}
                    >
                      {/* La hora en mono a la izquierda: se escanea la columna de tiempos. */}
                      <span className="w-[104px] shrink-0 font-mono text-[11.5px] text-ink-700">
                        {fecha} {hora}
                      </span>
                      <span className="w-[110px] shrink-0 truncate text-[12.5px] text-ink-700">
                        {e.userEmail.split('@')[0]}
                      </span>
                      <span className="w-[150px] shrink-0 truncate text-[12.5px] font-medium text-ink-900">
                        {ACCIONES[e.action] ?? e.action}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink-700">
                        {e.resource}
                      </span>
                      <span className="w-[100px] shrink-0 truncate font-mono text-[11px] text-ink-400">
                        {e.ipAddress ?? '—'}
                      </span>
                    </button>

                    {/*
                      EL DETALLE SE ABRE EN LÍNEA BAJO LA FILA, no en un panel:
                      conserva las filas vecinas a la vista, que es exactamente
                      lo que se está reconstruyendo al consultar hacia atrás.
                    */}
                    {abiertoEste && (
                      <div className="border-b border-line-100 bg-canvas px-3 py-2.5">
                        <dl className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
                          <div className="flex gap-2">
                            <dt className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">
                              Evento
                            </dt>
                            <dd className="font-mono text-[11px] text-ink-700">{e.id}</dd>
                          </div>
                          <div className="flex gap-2">
                            <dt className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">
                              Usuario
                            </dt>
                            <dd className="text-[12px] text-ink-700">{e.userEmail}</dd>
                          </div>
                          <div className="flex gap-2 sm:col-span-2">
                            <dt className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">
                              Detalle
                            </dt>
                            <dd className="text-[12px] text-ink-900">{e.resource}</dd>
                          </div>
                        </dl>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
