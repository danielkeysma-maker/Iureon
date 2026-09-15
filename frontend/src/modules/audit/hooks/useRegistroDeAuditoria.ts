import React from 'react';
import { auditApi, type AuditLogEntry } from '../services/audit.api';
import {
  csvDeEventos,
  estadoDeLaLista,
  filtrarEventos,
  inicioDelPeriodo,
  quedanPorLeer,
  unirPartes,
  type PeriodoId
} from '../registro';

/** Lo que se trae en cada lectura. Cabe holgado bajo el tope de 1.000 de PostgREST. */
export const POR_PAGINA = 200;

/**
 * EL REGISTRO QUE LEEN LAS DOS PANTALLAS DE AUDITORÍA.
 *
 * Escritorio y teléfono consumen este mismo estado. Antes cada una hacía su
 * propia llamada con su propio manejo de error, y la del teléfono no tenía
 * forma de pedir más: dos lecturas del mismo registro que podían discrepar.
 *
 * UNA RESPUESTA VIEJA NO PISA A UNA NUEVA. Cambiar de periodo mientras llega la
 * página anterior dejaría en pantalla eventos del periodo que ya no se pidió;
 * cada lectura lleva su número y solo la última escribe.
 */
export const useRegistroDeAuditoria = () => {
  const [eventos, setEventos] = React.useState<AuditLogEntry[]>([]);
  const [total, setTotal] = React.useState<number | null>(null);
  const [hayMas, setHayMas] = React.useState(false);
  const [cargando, setCargando] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [periodo, setPeriodo] = React.useState<PeriodoId>('30');
  const [busqueda, setBusqueda] = React.useState('');
  const [usuario, setUsuario] = React.useState('TODOS');
  const [vista, setVista] = React.useState<string | null>(null);
  const [hashCsv, setHashCsv] = React.useState('');
  const lectura = React.useRef(0);
  /* El inicio se fija al abrir el periodo: «cargar más» sigue el mismo corte, no uno que se corre con el reloj. */
  const inicio = React.useRef<string | null>(null);

  const leer = React.useCallback(async (desde: number, previos: AuditLogEntry[]) => {
    const esta = ++lectura.current;
    setCargando(true);
    setError(null);
    try {
      const pagina = await auditApi.listLogs({ desde, limite: POR_PAGINA, inicio: inicio.current });
      if (esta !== lectura.current) return;
      setEventos(unirPartes(previos, pagina.logs));
      setTotal(pagina.total);
      setHayMas(pagina.hayMas);
    } catch (e) {
      if (esta !== lectura.current) return;
      setError(e instanceof Error ? e.message : 'No se pudo leer la auditoría.');
    } finally {
      if (esta === lectura.current) setCargando(false);
    }
  }, []);

  const recargar = React.useCallback(() => {
    inicio.current = inicioDelPeriodo(periodo);
    setEventos([]);
    setTotal(null);
    setHayMas(false);
    setHashCsv('');
    void leer(0, []);
  }, [leer, periodo]);

  React.useEffect(() => {
    recargar();
  }, [recargar]);

  /*
   * «Leer más» pide desde lo que YA se tiene, no desde páginas × tamaño: si una
   * página vino repetida por un evento nuevo, contar páginas saltaría filas.
   */
  const cargarMas = React.useCallback(() => {
    if (cargando) return;
    void leer(eventos.length, eventos);
  }, [cargando, eventos, leer]);

  const visibles = React.useMemo(
    () => filtrarEventos(eventos, { busqueda, usuario, vista }),
    [eventos, busqueda, usuario, vista]
  );

  const usuarios = React.useMemo(() => Array.from(new Set(eventos.map((e) => e.userEmail))).sort(), [eventos]);

  const hayFiltro = busqueda.trim() !== '' || usuario !== 'TODOS' || vista !== null;
  const limpiar = () => {
    setBusqueda('');
    setUsuario('TODOS');
    setVista(null);
  };

  /**
   * El CSV con su hash de integridad, calculado sobre los bytes exactos del
   * archivo. Quien lo reciba puede recomputarlo y compararlo; no es una firma
   * del servidor, y no se llama firma. Exporta LO QUE SE VE: las filas leídas
   * que pasan el filtro, y el botón dice cuántas son.
   */
  const exportar = async () => {
    const bytes = new TextEncoder().encode(csvDeEventos(visibles));
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    setHashCsv([...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join(''));
    const url = URL.createObjectURL(new Blob([bytes], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return {
    eventos,
    visibles,
    usuarios,
    total,
    hayMas,
    quedan: quedanPorLeer(eventos.length, total),
    estado: estadoDeLaLista({ cargando, error, leidos: eventos.length }),
    cargando,
    error,
    periodo,
    setPeriodo,
    busqueda,
    setBusqueda,
    usuario,
    setUsuario,
    vista,
    setVista,
    hayFiltro,
    limpiar,
    cargarMas,
    recargar,
    exportar,
    hashCsv
  };
};

export type RegistroDeAuditoria = ReturnType<typeof useRegistroDeAuditoria>;
