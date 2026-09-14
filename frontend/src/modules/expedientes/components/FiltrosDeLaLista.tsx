import React from 'react';
import { SelectorEnCascada, type OpcionEnCascada } from '../../workspace/components/SelectorEnCascada';
import { useVentanaAncha } from '../../workspace/components/SelectorDelFormulario';
import { MESES, aniosDeRegistro, mesesDeRegistro, type CasoIndexado } from '../services/buscarCasos';

/**
 * AÑO Y MES DE REGISTRO, junto a la búsqueda de la lista.
 *
 * ─── QUÉ FECHA ES ──────────────────────────────────────────────────────────
 *
 * La de REGISTRO EN IUREON, y lo dice el rótulo. No es la fecha de la demanda
 * ni la del reparto: el expediente no guarda ninguna de las dos, y un «Año»
 * sin apellido se leería como el del proceso. El año del radicado sí se busca,
 * pero escribiéndolo en la caja: es otro dato.
 *
 * ─── LOS AÑOS Y LOS MESES SALEN DE LOS CASOS ───────────────────────────────
 *
 * Solo los años en que la firma registró algo, y dentro de cada año solo sus
 * meses: elegir un mes vacío sería un callejón sin salida. Se calculan sobre
 * TODOS los casos y no sobre la pestaña, para que la lista de años no cambie
 * al cambiar de pestaña.
 *
 * ─── EL MES ESPERA AL AÑO ──────────────────────────────────────────────────
 *
 * «Marzo» de todos los años mezcla periodos que nadie busca juntos, y un mes
 * suelto obliga a recordar que el año sigue en «Todos». Con el mes apagado
 * hasta elegir año, lo que se ve puesto es exactamente lo que filtra.
 *
 * ─── ESCRITORIO Y TELÉFONO ─────────────────────────────────────────────────
 *
 * En escritorio, `SelectorEnCascada` FLOTANTE: es el mismo selector que
 * `SelectorDelFormulario`, que en escritorio lo abre en línea porque vive
 * dentro de un diálogo; en esta barra, abrirlo en línea empujaría la lista
 * entera hacia abajo. En el teléfono, la lista del sistema, por la misma razón
 * que da `SelectorDelFormulario`.
 *
 * Sin `localStorage`: los filtros duran lo que dura la pantalla y sobreviven al
 * cambio de pestaña. Al recargar se vuelve a ver todo, que es lo que se espera
 * al entrar a la lista.
 */

export const FiltrosDeLaLista: React.FC<{
  indices: readonly CasoIndexado[];
  anio: number | null;
  mes: number | null;
  onCambiar: (anio: number | null, mes: number | null) => void;
}> = ({ indices, anio, mes, onCambiar }) => {
  const ancha = useVentanaAncha();
  const base = React.useId();
  const anios = React.useMemo(() => aniosDeRegistro(indices), [indices]);
  const meses = React.useMemo(() => (anio === null ? [] : mesesDeRegistro(indices, anio)), [indices, anio]);

  const opcionesDeAnio: OpcionEnCascada[] = [
    { valor: '', etiqueta: 'Todos' },
    ...anios.map((a) => ({ valor: String(a), etiqueta: String(a) }))
  ];
  const opcionesDeMes: OpcionEnCascada[] = [
    { valor: '', etiqueta: 'Todos' },
    ...meses.map((m) => ({ valor: String(m), etiqueta: MESES[m - 1] }))
  ];

  const elegirAnio = (valor: string): void => {
    const nuevo = valor === '' ? null : Number(valor);
    /* Un mes que no existe en el año nuevo se suelta, en vez de dejar la lista vacía sin razón visible. */
    const sigueElMes = nuevo !== null && mes !== null && mesesDeRegistro(indices, nuevo).includes(mes);
    onCambiar(nuevo, sigueElMes ? mes : null);
  };
  const elegirMes = (valor: string): void => onCambiar(anio, valor === '' ? null : Number(valor));

  return (
    <div className="cn-exp-fechas" role="group" aria-labelledby={`${base}-rotulo`}>
      <span id={`${base}-rotulo`} className="cn-exp-fechas-rotulo">
        Registrado en Iureon
      </span>
      {ancha ? (
        <>
          <SelectorEnCascada
            etiqueta="Año"
            valor={anio === null ? '' : String(anio)}
            opciones={opcionesDeAnio}
            onChange={elegirAnio}
            conBusqueda={false}
            anchoCampo="cn-exp-fecha"
          />
          {anio === null ? (
            <div className="cn-red-campo cn-exp-fecha">
              <span className="cn-red-rotulo">Mes</span>
              <button type="button" className="cn-red-disparador cn-exp-fecha-apagada" disabled={anio === null}>
                <span className="cn-red-disparador-texto">Elija primero el año</span>
              </button>
            </div>
          ) : (
            <SelectorEnCascada
              etiqueta="Mes"
              valor={mes === null ? '' : String(mes)}
              opciones={opcionesDeMes}
              onChange={elegirMes}
              conBusqueda={false}
              anchoCampo="cn-exp-fecha"
            />
          )}
        </>
      ) : (
        <>
          <label className="cn-exp-fecha cn-exp-fecha-movil">
            <span className="cn-exp-fecha-rotulo">Año</span>
            <select
              className="cn-exp-select cn-exp-fecha-select"
              value={anio === null ? '' : String(anio)}
              onChange={(e) => elegirAnio(e.target.value)}
            >
              {opcionesDeAnio.map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.etiqueta}
                </option>
              ))}
            </select>
          </label>
          <label className="cn-exp-fecha cn-exp-fecha-movil">
            <span className="cn-exp-fecha-rotulo">Mes</span>
            <select
              className="cn-exp-select cn-exp-fecha-select"
              value={mes === null ? '' : String(mes)}
              onChange={(e) => elegirMes(e.target.value)}
              disabled={anio === null}
            >
              {anio === null ? (
                <option value="">Elija primero el año</option>
              ) : (
                opcionesDeMes.map((o) => (
                  <option key={o.valor} value={o.valor}>
                    {o.etiqueta}
                  </option>
                ))
              )}
            </select>
          </label>
        </>
      )}
    </div>
  );
};
