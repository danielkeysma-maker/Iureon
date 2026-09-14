import React from 'react';
import { rotuloDeExpediente, useExpedientes } from '../useExpedientes';
import { SelectorDelFormulario } from '../../workspace/components/SelectorDelFormulario';

/*
 * El tipo de la opción se deduce del componente que se compone, en vez de
 * importarlo del archivo de otro módulo: la frontera de módulos prohíbe traer
 * tipos de componentes ajenos (scripts/check-module-boundaries.sh), no usarlos.
 */
type OpcionEnCascada = React.ComponentProps<typeof SelectorDelFormulario>['opciones'][number];

/**
 * «DE QUÉ CASO ES», UNA SOLA VEZ.
 *
 * ─── POR QUÉ EXISTE ────────────────────────────────────────────────────────
 *
 * Este control se escribió a mano cuatro veces en dos días —la revisión, la
 * agenda, y las dos barras de Redacción— y hacían falta dos más, para el
 * transcrito y la orientación. Seis copias de la misma lista, el mismo
 * «— sin expediente —», el mismo «solo si la firma tiene alguno», y la misma
 * carga silenciosa.
 *
 * Copiarlo una sexta vez es cómo se separan: la primera corrección se hace en
 * una y las otras cinco se quedan atrás, sin que nada falle. Es exactamente el
 * defecto que este proyecto ya documentó con las dos barras de configuración y
 * con el gancho de los adjuntos.
 *
 * LA CARGA DE LA LISTA VIVE EN `useExpedientes`, no aquí: las dos barras de
 * configuración de Redacción no caben en este bloque —su control es un
 * `Combobox` horizontal— y aun así comparten los datos. Se parte por donde de
 * verdad se comparte.
 *
 * ─── NO SE PINTA SI NO HAY EXPEDIENTES ─────────────────────────────────────
 *
 * Una firma que no ha creado ninguno vería un desplegable con una sola opción
 * —«sin expediente»— que no ofrece nada y enseña que sobra un campo. Mientras
 * carga tampoco se pinta: aparecer vacío y llenarse después mueve el
 * formulario bajo el cursor.
 *
 * ─── Y SU FALLO NO ES EL FALLO DE LA PANTALLA ──────────────────────────────
 *
 * Si la lista no se puede leer, el control desaparece y lo demás sigue: nadie
 * deja de redactar, de orientar ni de transcribir porque el catálogo de casos
 * no respondió. Atar es un extra; el trabajo es el trabajo.
 */
export const SelectorDeExpediente: React.FC<{
  valor: string;
  onCambio: (id: string) => void;
  /** Encima del control. Cambia según la pantalla: no es lo mismo un escrito que un audio. */
  etiqueta?: string;
  /** Debajo. Qué gana el abogado por atarlo aquí. */
  pie?: React.ReactNode;
  id?: string;
  /**
   * LA CARA NUEVA ES OPT-IN, POR PANTALLA. La agenda, el triaje y el diálogo de
   * subir audiencias todavía llevan la cara vieja y se rediseñan por su lado:
   * cambiarla aquí para todos les movería pantallas que nadie pidió tocar. La
   * lista, el «sin expediente» y la regla de no pintarse sin casos siguen
   * siendo UNA sola, que es la razón de ser de este componente.
   */
  cara?: 'vieja' | 'nueva';
}> = ({ valor, onCambio, etiqueta = 'De qué caso es', pie, id = 'expediente-del-trabajo', cara = 'vieja' }) => {
  const expedientes = useExpedientes();

  /*
   * El radicado va aparte y en mono: es lo único citable de la fila. Y cuenta
   * para el filtro, porque es lo que el abogado escribe al buscar un caso.
   */
  const opciones: OpcionEnCascada[] = React.useMemo(
    () => [
      { valor: '', etiqueta: 'Sin expediente' },
      ...expedientes.map((e) => ({
        valor: e.id,
        etiqueta: e.caratula,
        detalle: e.radicado ? <span className="cn-red-mono">{e.radicado}</span> : undefined,
        detalleTexto: e.radicado ?? undefined,
        busqueda: e.radicado ?? undefined
      }))
    ],
    [expedientes]
  );

  if (expedientes.length === 0) return null;

  if (cara === 'nueva') {
    return (
      <div className="cn-inf-bloque">
        <SelectorDelFormulario
          id={id}
          etiqueta={etiqueta}
          valor={valor}
          opciones={opciones}
          onChange={onCambio}
          vacio="Sin expediente"
          pie={`${expedientes.length} ${expedientes.length === 1 ? 'caso' : 'casos'} de la firma. Busque por la carátula o por el radicado.`}
        />
        {pie && <p className="cn-inf-ayuda">{pie}</p>}
      </div>
    );
  }

  return (
    <div>
      <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">{etiqueta}</p>
      <label className="sr-only" htmlFor={id}>
        {etiqueta}
      </label>
      <select id={id} className="field mt-1.5" value={valor} onChange={(e) => onCambio(e.target.value)}>
        <option value="">— sin expediente —</option>
        {expedientes.map((e) => (
          <option key={e.id} value={e.id}>
            {rotuloDeExpediente(e)}
          </option>
        ))}
      </select>
      {pie && (
        <p className="mt-1 text-[11px] leading-snug text-ink-500 text-justify [text-wrap:pretty]">{pie}</p>
      )}
    </div>
  );
};
