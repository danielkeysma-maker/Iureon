import { ClipboardCheck, Compass, FolderOpen, Mic, Sparkles, type LucideIcon } from 'lucide-react';
import type { MainView } from '../tenant/types';

/**
 * POR DÓNDE EMPIEZA ALGUIEN QUE NO SABE USAR LA APLICACIÓN.
 *
 * ─── EL PROBLEMA: LOS NOMBRES SON DE PRODUCTO, NO DE ABOGADO ───────────────
 *
 * La barra dice «Orientación», «Redacción», «Revisiones», «Expedientes». Son
 * nombres correctos y no significan nada para quien entra por primera vez: un
 * litigante con un auto en la mano no busca «Revisiones», busca dónde se dice
 * qué hacer con el papel que le llegó. Y el que tiene los hechos de un caso
 * nuevo no adivina que «Orientación» es «de los hechos a la actuación».
 *
 * ─── LO QUE ESTO REEMPLAZA, Y POR QUÉ NO SE SUMA ──────────────────────────
 *
 * Inicio tenía TRES tarjetas —«Redactar un escrito», «Revisar un documento»,
 * «Transcribir una audiencia»—, que son verbos del producto y dejaban fuera
 * justo los dos módulos que un recién llegado no encuentra solo: Orientación,
 * que existe para quien NO sabe cómo se llama lo suyo, y Expedientes, que es
 * el más nuevo.
 *
 * Se reemplazan en vez de añadirse debajo. Dos filas de puertas a los mismos
 * sitios, una en lenguaje de producto y otra en lenguaje de abogado, no es el
 * doble de ayuda: es una pantalla de inicio que pregunta dos veces lo mismo y
 * obliga a leer las dos antes de escoger.
 *
 * ─── CADA UNA ES UNA SITUACIÓN, NO UNA FUNCIÓN ────────────────────────────
 *
 * El título es lo que el abogado TIENE DELANTE —«Me llegó un documento»— y
 * debajo va qué obtiene. Al revés («Lee autos y sentencias») se lee como un
 * folleto: describe la herramienta y deja al lector la traducción, que es
 * exactamente el trabajo que no sabe hacer todavía.
 *
 * ─── EL ORDEN ES EL DE LA FRECUENCIA, NO EL DEL MENÚ ──────────────────────
 *
 * Primero lo que llega solo —un documento del juzgado—, después lo que se
 * empieza, y de último lo que se registra. La barra lateral tiene su propio
 * orden por grupos-verbo y no tiene por qué ser éste.
 *
 * ─── SIN MODELO DE POR MEDIO ──────────────────────────────────────────────
 *
 * Se consideró un cuadro de «¿qué quiere hacer?» en lenguaje libre que
 * enrutara solo. Costaría una llamada a un modelo por pregunta para resolver
 * lo que cinco frases fijas resuelven gratis y sin equivocarse — y quien no
 * sabe usar la aplicación tampoco sabe todavía cómo describir lo que quiere.
 */
export interface PuertaDeInicio {
  /** Lo que el abogado tiene delante, en sus palabras. */
  titulo: string;
  /** Qué obtiene si entra por aquí. */
  queHace: string;
  destino: MainView;
  icono: LucideIcon;
  /**
   * LLEGAR AL MODULO NO ES LLEGAR A LA PUERTA.
   *
   * «Me llegó un documento» deja al abogado en la lista de Revisiones, y
   * desde ahi todavia tiene que pulsar «Revisar un documento» y escoger, de
   * dos botones, «Un documento que recibi». Son dos pasos que la tarjeta ya
   * habia contestado: si acaba de decir que le llego un documento, volver a
   * preguntarselo es devolverle el trabajo.
   *
   * Con esto encendido, Inicio deja anotado que lo que viene es un documento
   * recibido y Revisiones abre el dialogo YA en ese modo, vacio. Se reutiliza
   * el mismo traspaso con el que Orientacion manda aqui un auto adjunto; la
   * diferencia es que aqui no hay texto todavia, y el traspaso ya sabia
   * llegar sin el.
   */
  abreDocumentoRecibido?: true;
}

/*
 * Los iconos son los MISMOS que usa la barra lateral para cada módulo. Darle
 * a Orientación una brújula aquí y otra cosa allá haría que la misma puerta
 * pareciera dos sitios distintos; reconocer por forma es la mitad de aprender
 * dónde vive cada cosa.
 */
export const PUERTAS_DE_INICIO: readonly PuertaDeInicio[] = [
  {
    titulo: 'Me llegó un documento',
    queHace: 'Un auto, una sentencia, un oficio. Qué dice, qué le exigen y para cuándo, y por dónde se ataca.',
    destino: 'taller',
    icono: ClipboardCheck,
    abreDocumentoRecibido: true
  },
  {
    titulo: 'Tengo los hechos y no el nombre',
    queHace: 'Cuente el caso como a un colega y el catálogo le dice qué actuación cabe, con su término y su artículo.',
    destino: 'orientacion',
    icono: Compass
  },
  {
    titulo: 'Ya sé qué voy a presentar',
    queHace: 'El primer borrador de una actuación del catálogo, con su término y su fuente.',
    destino: 'workspace',
    icono: Sparkles
  },
  {
    titulo: 'Tengo un caso con muchos papeles',
    queHace: 'Reúna el expediente, busque dentro de él por significado y prepare el interrogatorio.',
    destino: 'expedientes',
    icono: FolderOpen
  },
  {
    titulo: 'Grabé una audiencia',
    queHace: 'El transcrito con cada interlocutor separado, y su acta.',
    destino: 'audiencias',
    icono: Mic
  }
];
