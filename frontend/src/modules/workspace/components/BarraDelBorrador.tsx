import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronLeft, Maximize2, Minimize2 } from 'lucide-react';
import { rotuloDeExpediente, useExpedientes } from '../../expedientes/useExpedientes';
import type { EstadoBorrador } from '../../documents/types';

/**
 * La barra del borrador. Artboard «Borrador» (líneas 756–841) de
 * `public/handoff/app-redaccion-revision.html`, solo escritorio.
 *
 * ─── POR QUÉ ESTAS ACCIONES VIVEN AQUÍ Y NO EN LA CABECERA GLOBAL ──────────
 *
 * La cabecera de la aplicación repetía el título del escrito, las pestañas
 * Documento/Expediente, Copiar, Word, PDF, «Marcar listo para firma», «Vista
 * dividida» y «Firmas»: la mitad ya existía en el lienzo o en la barra lateral.
 * Y su desplegable de exportación se pintaba DEBAJO de la barra de la cascada,
 * porque vivía dentro de una cabecera de menor capa. Aquí las acciones quedan
 * sobre el escrito al que se refieren, en una barra que manda sobre todo lo que
 * tiene debajo.
 *
 * ─── «←» NO BORRA NADA ─────────────────────────────────────────────────────
 *
 * Vuelve al asistente de Redactar. El borrador sigue guardado en la firma y
 * sigue abierto en esta pestaña: el asistente ofrece volver a él, y lo que se
 * haya editado en el papel sale con keepalive antes de que nada se desmonte.
 *
 * ─── LO QUE EL ARTBOARD PIDE Y AQUÍ NO ESTÁ, con la razón ───────────────────
 *
 * · «guardado hace un minuto». La fila guarda una fecha, no un reloj que se
 *   actualice solo; una hora relativa que no se refresca miente al minuto
 *   siguiente. Se dice la fecha y la hora del guardado.
 * · La × de «Salir del taller». Salir es la flecha de la izquierda: dos salidas
 *   con dos destinos distintos obligarían a adivinar cuál es cuál.
 */

export interface OpcionesDeExportarBorrador {
  conMembrete: boolean;
  conFuentes: boolean;
}

interface BarraDelBorradorProps {
  titulo: string;
  /** El caso al que está atado el escrito; sin caso la flecha dice «Redactar». */
  expedienteId: string;
  onVolver: () => void;
  /** Lo que devuelve la lista de borradores; `null` si todavía no se guardó. */
  guardadoEl: string | null;
  copied: boolean;
  onCopiar: () => void;
  onWord: (opciones: OpcionesDeExportarBorrador) => void;
  onPdf: (opciones: OpcionesDeExportarBorrador) => void;
  /** Si hay fuentes que anexar: ofrecer una hoja vacía es prometer lo que la exportación no cumple. */
  hayFuentes: boolean;
  estado: EstadoBorrador | null;
  onMarcarListo?: () => void;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
}

/*
 * LA FECHA SE ESCRIBE COMO LLEGA SI NO SE PUEDE LEER. Los borradores de la nube
 * traen una fecha ya formateada y los de este navegador otra; reinterpretar un
 * texto que no es una fecha daría «Invalid Date» justo donde se dice cuándo se
 * guardó el trabajo.
 */
const fechaDelGuardado = (valor: string): string => {
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleString('es-CO', { day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });
};

export const BarraDelBorrador: React.FC<BarraDelBorradorProps> = ({
  titulo,
  expedienteId,
  onVolver,
  guardadoEl,
  copied,
  onCopiar,
  onWord,
  onPdf,
  hayFuentes,
  estado,
  onMarcarListo,
  isFocusMode,
  onToggleFocusMode
}) => {
  const expedientes = useExpedientes();
  const caso = expedienteId ? expedientes.find((e) => e.id === expedienteId) ?? null : null;

  /*
   * LAS CASILLAS DE EXPORTACIÓN VIVEN JUNTO AL BOTÓN, no en Ajustes: son
   * decisiones por escrito. El mismo abogado radica un PDF con membrete y manda
   * un Word sin membrete a un colega, en la misma tarde.
   */
  const [opcionesAbiertas, setOpcionesAbiertas] = useState(false);
  const [conMembrete, setConMembrete] = useState(true);
  const [conFuentes, setConFuentes] = useState(true);
  const grupoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!opcionesAbiertas) return;
    const fuera = (e: MouseEvent) => {
      if (!grupoRef.current?.contains(e.target as Node)) setOpcionesAbiertas(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpcionesAbiertas(false);
    };
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('keydown', escape);
    };
  }, [opcionesAbiertas]);

  const opciones = (): OpcionesDeExportarBorrador => ({ conMembrete, conFuentes: conFuentes && hayFuentes });

  /* Listo o radicado ya no se marca otra vez: el botón desaparece en vez de repetir un estado que ya tiene. */
  const puedeMarcar = Boolean(onMarcarListo && estado && estado !== 'LISTO' && estado !== 'RADICADO');

  return (
    <div className="cn-red-bdb hidden lg:flex">
      <button type="button" onClick={onVolver} className="cn-red-bdb-volver" title="Volver al asistente; el borrador sigue guardado">
        <ChevronLeft className="cn-red-bdb-svg" strokeWidth={1.8} aria-hidden />
        <span className="cn-red-bdb-volver-texto">{caso ? rotuloDeExpediente(caso) : 'Redactar'}</span>
      </button>

      <div className="cn-red-bdb-textos">
        <p className="cn-red-bdb-titulo" title={titulo}>
          {titulo}
        </p>
        <p className="cn-red-bdb-sub">{guardadoEl ? `Borrador · guardado el ${fechaDelGuardado(guardadoEl)}` : 'Borrador · sin guardar todavía'}</p>
      </div>

      <div ref={grupoRef} className="cn-red-bdb-grupo">
        <button type="button" onClick={() => onWord(opciones())} className="cn-red-bdb-boton" title="Word conserva estilos y numeración editables">
          Word
        </button>
        <button type="button" onClick={() => onPdf(opciones())} className="cn-red-bdb-boton" title="El PDF sale en papel blanco, aunque la aplicación esté en oscuro">
          PDF
        </button>
        <button type="button" onClick={onCopiar} className="cn-red-bdb-boton">
          {copied && <Check className="cn-red-bdb-svg cn-red-bdb-svg--ok" strokeWidth={2} aria-hidden />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
        <button
          type="button"
          onClick={() => setOpcionesAbiertas((v) => !v)}
          aria-label="Opciones de exportación"
          aria-expanded={opcionesAbiertas}
          className="cn-red-bdb-boton cn-red-bdb-boton--icono"
        >
          <ChevronDown className="cn-red-bdb-svg" strokeWidth={1.8} aria-hidden />
        </button>

        {opcionesAbiertas && (
          <div className="cn-red-bdb-pop">
            <p className="cn-red-bdb-pop-rotulo">Al exportar</p>
            <label className="cn-red-bdb-pop-casilla">
              <input type="checkbox" checked={conMembrete} onChange={(e) => setConMembrete(e.target.checked)} />
              <span>Membrete de la firma</span>
            </label>
            {hayFuentes && (
              <label className="cn-red-bdb-pop-casilla">
                <input type="checkbox" checked={conFuentes} onChange={(e) => setConFuentes(e.target.checked)} />
                <span>Anexar hoja de fuentes citadas</span>
              </label>
            )}
            <p className="cn-red-bdb-pop-nota">Word conserva estilos editables. El PDF sale en papel blanco, aunque la aplicación esté en oscuro.</p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onToggleFocusMode}
        aria-label={isFocusMode ? 'Salir del modo concentración' : 'Modo concentración'}
        title={isFocusMode ? 'Salir del modo concentración' : 'Modo concentración: solo el papel'}
        aria-pressed={isFocusMode}
        className="cn-red-bdb-icono"
      >
        {isFocusMode ? (
          <Minimize2 className="cn-red-bdb-svg" strokeWidth={1.8} aria-hidden />
        ) : (
          <Maximize2 className="cn-red-bdb-svg" strokeWidth={1.8} aria-hidden />
        )}
      </button>

      {puedeMarcar && (
        <button type="button" onClick={onMarcarListo} className="cn-red-bdb-primario">
          Marcar como listo
        </button>
      )}
    </div>
  );
};
