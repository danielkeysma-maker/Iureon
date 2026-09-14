import type { EstadoDeAvisos } from './pushCliente';

/**
 * Lo que la pantalla de avisos dice y ofrece, decidido sin tocar el navegador.
 *
 * ─── POR QUÉ UNA FUNCIÓN PURA ───────────────────────────────────────────────
 *
 * Los estados vienen de tres fuentes que no se conocen entre sí: el navegador
 * (¿hay Push?, ¿hay suscripción?), el permiso (¿se preguntó?, ¿se negó?) y el
 * servidor (¿tiene llaves VAPID?, ¿contestó?). Mezclarlos dentro del JSX dejó
 * antes un párrafo que no distinguía «no llega nada porque el servidor no
 * puede» de «no llega nada porque usted lo bloqueó». Aquí la precedencia se
 * escribe una vez y el check la recorre entera sin navegador.
 *
 * ─── LA PRECEDENCIA, Y POR QUÉ ESE ORDEN ────────────────────────────────────
 *
 *  1. Sin Push o iPhone sin instalar: el arreglo es de este aparato y ningún
 *     otro dato cambia lo que el usuario puede hacer.
 *  2. Servidor sin llaves: aunque el navegador tenga suscripción, no saldrá
 *     nada. Ofrecer el interruptor sería mentir.
 *  3. Una acción en curso: el interruptor queda quieto hasta que termine.
 *  4. Permiso bloqueado: el navegador no deja volver a preguntar desde la
 *     página, así que el interruptor se ve apagado y no se puede tocar.
 *  5. Suscrito o no, y si el navegador ya concedió el permiso.
 *
 * Si el servidor no contesta, se muestra lo que sabe el navegador y se dice
 * que es solo eso: callarlo haría pasar un fallo de red por un estado.
 */

export type Permiso = NotificationPermission | 'sin-api';

export type ServidorLeido = { enabled: boolean; dispositivos: number } | 'sin-respuesta' | null;

export type EnCurso = 'activando' | 'desactivando' | 'probando' | null;

export interface EntradaDeLaCara {
  local: EstadoDeAvisos;
  permiso: Permiso;
  /** `null` mientras no se ha preguntado; `'sin-respuesta'` si la consulta falló. */
  servidor: ServidorLeido;
  enCurso: EnCurso;
}

export type Situacion =
  | 'comprobando'
  | 'no-soportado'
  | 'ios-sin-instalar'
  | 'servidor-sin-llaves'
  | 'bloqueados'
  | 'activando'
  | 'desactivando'
  | 'activados'
  | 'sin-pedir'
  | 'permitidos-sin-activar';

export type Tono = 'ok' | 'neutro' | 'atencion';

export interface CaraDeLosAvisos {
  situacion: Situacion;
  /** La línea de estado, corta: se lee junto al interruptor. */
  estado: string;
  detalle: string | null;
  tono: Tono;
  interruptor: { visible: boolean; encendido: boolean; deshabilitado: boolean };
  puedeProbar: boolean;
  servidorSinRespuesta: boolean;
}

const SIN_INTERRUPTOR = { visible: false, encendido: false, deshabilitado: true };

export const caraDeLosAvisos = ({ local, permiso, servidor, enCurso }: EntradaDeLaCara): CaraDeLosAvisos => {
  const servidorSinRespuesta = servidor === 'sin-respuesta';
  const armar = (c: Omit<CaraDeLosAvisos, 'servidorSinRespuesta' | 'puedeProbar'> & { puedeProbar?: boolean }): CaraDeLosAvisos => ({
    puedeProbar: false,
    ...c,
    servidorSinRespuesta
  });

  if (local === 'cargando') {
    return armar({ situacion: 'comprobando', estado: 'Comprobando este dispositivo…', detalle: null, tono: 'neutro', interruptor: SIN_INTERRUPTOR });
  }
  if (local === 'no-soportado') {
    return armar({
      situacion: 'no-soportado',
      estado: 'No disponibles en este navegador',
      detalle: 'Este navegador no puede recibir avisos. Donde usted los tenga activados en otro dispositivo, siguen llegando.',
      tono: 'atencion',
      interruptor: SIN_INTERRUPTOR
    });
  }
  if (local === 'ios-sin-instalar') {
    return armar({
      situacion: 'ios-sin-instalar',
      estado: 'Primero instale la aplicación',
      detalle: 'En iPhone y iPad los avisos solo llegan a Iureon instalada en la pantalla de inicio. Instálela, ábrala desde ahí y actívelos.',
      tono: 'atencion',
      interruptor: SIN_INTERRUPTOR
    });
  }
  const sinLlaves = local === 'servidor-sin-llaves' || (servidor !== null && servidor !== 'sin-respuesta' && !servidor.enabled);
  if (sinLlaves) {
    return armar({
      situacion: 'servidor-sin-llaves',
      estado: 'No disponibles por ahora',
      detalle: 'El servidor de Iureon todavía no tiene configurados los avisos. No depende de este dispositivo ni de su navegador.',
      tono: 'atencion',
      interruptor: SIN_INTERRUPTOR
    });
  }
  if (enCurso === 'activando') {
    return armar({
      situacion: 'activando',
      estado: 'Activando…',
      detalle: 'Si el navegador le pregunta, elija «Permitir».',
      tono: 'neutro',
      interruptor: { visible: true, encendido: true, deshabilitado: true }
    });
  }
  if (enCurso === 'desactivando') {
    return armar({
      situacion: 'desactivando',
      estado: 'Desactivando…',
      detalle: null,
      tono: 'neutro',
      interruptor: { visible: true, encendido: false, deshabilitado: true }
    });
  }
  if (local === 'denegado' || permiso === 'denied') {
    return armar({
      situacion: 'bloqueados',
      estado: 'Bloqueados en este navegador',
      detalle:
        'El permiso de avisos para Iureon está bloqueado y el navegador no deja volver a preguntar desde aquí. Se permite en los ajustes del sitio de su navegador; después, vuelva a abrir estos avisos.',
      tono: 'atencion',
      interruptor: { visible: true, encendido: false, deshabilitado: true }
    });
  }
  if (local === 'activados') {
    return armar({
      situacion: 'activados',
      estado: 'Activados en este dispositivo',
      detalle: null,
      tono: 'ok',
      interruptor: { visible: true, encendido: true, deshabilitado: enCurso === 'probando' },
      puedeProbar: enCurso !== 'probando'
    });
  }
  if (permiso === 'granted') {
    return armar({
      situacion: 'permitidos-sin-activar',
      estado: 'Desactivados en este dispositivo',
      detalle: 'El navegador ya permite los avisos de Iureon; falta activarlos aquí.',
      tono: 'neutro',
      interruptor: { visible: true, encendido: false, deshabilitado: enCurso === 'probando' }
    });
  }
  return armar({
    situacion: 'sin-pedir',
    estado: 'Desactivados en este dispositivo',
    detalle: 'Al activarlos, el navegador le preguntará si permite los avisos de Iureon.',
    tono: 'neutro',
    interruptor: { visible: true, encendido: false, deshabilitado: enCurso === 'probando' }
  });
};

export const dispositivosEnPalabras = (n: number): string | null =>
  n > 0 ? `Su cuenta tiene avisos activos en ${n} dispositivo${n === 1 ? '' : 's'}.` : null;

export const resultadoDeLaPrueba = (enviados: number): string =>
  enviados > 0
    ? `Prueba enviada a ${enviados} dispositivo${enviados === 1 ? '' : 's'}. Debería aparecer en segundos.`
    : 'No se envió a ningún dispositivo. Active los avisos primero.';

/*
 * ─── LO QUE SE AVISA ───────────────────────────────────────────────────────
 *
 * Cada renglón corresponde a una llamada de envío del backend, y el check
 * `avisosCara` lee ese código: si alguien añade un envío sin su renglón, o un
 * renglón sin envío, falla. La maqueta de Ajustes dibuja avisos de
 * transcripción terminada y de saldo bajo; no existen, y por eso no están.
 *
 *  · término   → `agenda/avisosDelDia.service.ts` (hitos 5, 2 y 0 de `avisos.ts`)
 *  · borradores → `drafts/drafts.service.ts`, crear y editar
 *  · soporte   → `support/supportChat.service.ts`, a la firma y al operador
 */
export interface TipoDeAviso {
  id: 'termino' | 'soporte-respondio' | 'borrador-creado' | 'borrador-editado' | 'soporte-a-operador';
  titulo: string;
  detalle: string;
  /** Solo lo recibe quien opera la plataforma (rol SUPER_ADMIN). */
  soloOperador: boolean;
}

export const TIPOS_DE_AVISO: readonly TipoDeAviso[] = [
  {
    id: 'termino',
    titulo: 'Un término de la agenda por vencer',
    detalle:
      'Cinco días antes, dos días antes y el día del vencimiento, hacia las 7:00 a. m. Si el término tiene responsable, solo a esa persona; si no, a toda la firma.',
    soloOperador: false
  },
  {
    id: 'soporte-respondio',
    titulo: 'Soporte de Iureon respondió',
    detalle: 'A toda la firma, porque la conversación de soporte es de la firma.',
    soloOperador: false
  },
  {
    id: 'borrador-creado',
    titulo: 'Otro abogado de su firma creó un borrador',
    detalle: 'A quien lo crea no le llega.',
    soloOperador: false
  },
  {
    id: 'borrador-editado',
    titulo: 'Otro abogado de su firma editó un borrador',
    detalle: 'Como mucho un aviso cada diez minutos por borrador.',
    soloOperador: false
  },
  {
    id: 'soporte-a-operador',
    titulo: 'Una firma escribió a soporte',
    detalle: 'Solo a quien opera la plataforma.',
    soloOperador: true
  }
];

export const tiposQueLeLlegan = (esOperador: boolean): readonly TipoDeAviso[] =>
  TIPOS_DE_AVISO.filter((t) => !t.soloOperador || esOperador);
