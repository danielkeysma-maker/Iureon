/**
 * «Lo que más se pregunta», la primera sección del índice del manual.
 *
 * ─── UNA SITUACIÓN, NO UN MÓDULO ────────────────────────────────────────────
 *
 * La maqueta (`public/handoff/app-manual-y-soporte.html`, índice) abre el
 * manual con cuatro frases que dice el abogado —«Me llegó un auto y quiero
 * entenderlo»— y no con los nombres del producto. Cada una abre un artículo que
 * ya existe; el check confirma que el artículo sigue ahí.
 *
 * ─── EL COSTO VA SIN CIFRA, Y ES A PROPÓSITO ────────────────────────────────
 *
 * La maqueta pinta «Consume $2.000» y «Consume $300». El precio de un escrito
 * es «desde» un piso y crece con lo que mide, y el de la orientación depende
 * del cupo diario de la firma: una cifra fija aquí sería una promesa que el
 * botón que cobra podría desmentir. El precio exacto lo dice ese botón antes de
 * cobrar; aquí solo se dice si la tarea toca el saldo o no.
 */

export type CostoDeLaTarea = 'saldo' | 'sin-costo' | 'cupo';

export interface PreguntaFrecuente {
  readonly pregunta: string;
  readonly detalle: string;
  readonly articuloId: string;
  readonly costo: CostoDeLaTarea;
}

export const ETIQUETA_DE_COSTO: Record<CostoDeLaTarea, string> = {
  saldo: 'Consume saldo',
  'sin-costo': 'Sin costo',
  cupo: 'Sin costo dentro del cupo diario'
};

export const FRECUENTES: readonly PreguntaFrecuente[] = [
  {
    pregunta: 'Necesito presentar un escrito',
    detalle: 'Elegir la actuación del catálogo, contar los hechos y trabajar el borrador.',
    articuloId: 'primer-escrito',
    costo: 'saldo'
  },
  {
    pregunta: 'Me llegó un auto y quiero entenderlo',
    detalle: 'Subirlo a Revisiones como un documento que recibió.',
    articuloId: 'documento-recibido',
    costo: 'saldo'
  },
  {
    pregunta: 'No sé qué actuación presentar',
    detalle: 'Contar los hechos en Orientación y ver las actuaciones posibles.',
    articuloId: 'orientacion',
    costo: 'cupo'
  },
  {
    pregunta: 'Quiero saber cuándo vence un término',
    detalle: 'Calcularlo en Herramientas, con los festivos de ley.',
    articuloId: 'herramientas',
    costo: 'sin-costo'
  }
];
