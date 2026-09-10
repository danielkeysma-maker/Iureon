import { PLANES, type Modulo, type Plan } from '../subscriptions/plan.catalog';
import { PRICE_COP } from '../billing/billing.service';
import { pesos } from './plantilla';

/**
 * LAS PALABRAS QUE LOS CORREOS COMPARTEN, Y DE DÓNDE SALEN SUS CIFRAS.
 *
 * La tabla de módulos estaba escrita tres veces —`mail.service.ts`,
 * `trial.mail.ts` y a medias en `avisos.mail.ts`—, y una de las tres se había
 * quedado sin Audiencias, Entrevistas ni Orientación. Un módulo nuevo obligaba
 * a acordarse de tres archivos, así que aquí vive una sola vez.
 *
 * NINGÚN PRECIO, NINGÚN CUPO Y NINGÚN MÓDULO SE ESCRIBE A MANO EN UN CORREO.
 * Todo sale de `plan.catalog.ts` y de `PRICE_COP`, que es lo que el sistema
 * cobra de verdad. La maqueta ofrecía «Redacción u Orientación» a una firma
 * Esencial, que no tiene Orientación: un correo que ofrece un módulo que la
 * pantalla no muestra es una falsa promesa el primer día de uso.
 */

const NOMBRE_DE_MODULO: Record<Modulo, string> = {
  REDACCION: 'Redacción',
  BORRADORES: 'Borradores',
  REVISIONES: 'Revisiones',
  BUSCADOR: 'Buscador',
  CATALOGO: 'Catálogo',
  HERRAMIENTAS: 'Herramientas',
  MANUAL: 'Manual',
  SOPORTE: 'Soporte',
  MEMBRETE: 'Membrete',
  AUDIENCIAS: 'Audiencias',
  ENTREVISTAS: 'Entrevistas',
  ORIENTACION: 'Orientación'
};

export const nombreDeModulo = (m: Modulo): string => NOMBRE_DE_MODULO[m];

/** Los módulos del plan, en castellano y separados por comas. Del catálogo, nunca a mano. */
export const modulosDe = (plan: Plan): string => PLANES[plan].modulos.map(nombreDeModulo).join(', ');

/** «1 usuario» o «hasta 5 usuarios». */
export const usuariosDe = (cupo: number): string => (cupo === 1 ? '1 usuario' : `hasta ${cupo} usuarios`);

/** Una línea con el cupo y los módulos: lo que un plan da, resumido. */
export const loQueIncluye = (plan: Plan): string =>
  `${usuariosDe(PLANES[plan].maxUsuarios)} · ${modulosDe(plan)}`;

/** La frase que cierra toda bienvenida: la tesis del producto en una línea. */
export const TESIS =
  'Un escrito de Iureon es un borrador hasta que un abogado lo lee. La aplicación existe para que esa lectura sea corta.';

/**
 * Qué cuesta cada operación de inteligencia artificial, leído de `PRICE_COP`.
 *
 * ES UN PISO Y SE DICE QUE LO ES. `priceFor` cobra `max(piso, costo medido)`,
 * así que un escrito muy largo cuesta más que el piso: anunciar el piso como
 * precio fijo sería prometer un cobro que el sistema no hace. Solo se listan
 * las operaciones con piso mayor que cero — transcribir y buscar no se cobran,
 * y una línea de «$0» invita a preguntarse si algún día se cobrará.
 */
export const QUE_CUESTA: ReadonlyArray<{ titulo: string; detalle: string }> = [
  {
    titulo: `Un escrito nuevo: desde ${pesos(PRICE_COP.BORRADOR)}.`,
    detalle:
      'Redacción completa desde los hechos, con la estructura de la actuación. Un escrito muy largo cuesta más, según lo que consuma.'
  },
  {
    titulo: `Una revisión: desde ${pesos(PRICE_COP.REVISION)}.`,
    detalle: 'Informe de lo que la actuación exige, lo que falla en su escrito y la corrección textual.'
  },
  {
    titulo: `Una consulta a la guía del taller: ${pesos(PRICE_COP.CONSULTA_REVISION)}.`,
    detalle: 'Cada pregunta que le hace a la guía mientras corrige un escrito en el taller.'
  }
];

/** Lo que NO consume saldo, dicho con las mismas palabras en todos los correos. */
export const SIN_CONSUMO =
  'El Catálogo, el Buscador, las Herramientas y el Manual no consumen saldo: van incluidos en su plan.';
