import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * «ESTE DOCUMENTO ANUNCIA UN PLAZO, Y ORIENTACIÓN NO LO LEE.»
 *
 * ─── LAS DOS PUERTAS, Y LA CORTA PIERDE EL RELOJ ───────────────────────────
 *
 * Un abogado que recibe un auto tiene dos caminos que se ven igual de
 * razonables. «Revisiones» → «Un documento que recibí» lo LEE: dice qué le
 * exige, para cuándo, con la cita, y de quién es cada carga. Orientación lo
 * acepta adjunto y devuelve actuaciones del catálogo con el término de la
 * NORMA — su instrucción le prohíbe al modelo afirmar plazos.
 *
 * Así que quien entra por aquí con un auto que dice «dentro de los cinco (5)
 * días» se va con una lista correcta y sin el número cinco. No falla nada: se
 * pierde el dato que más caro cuesta perder.
 *
 * ─── POR QUÉ CITA EN VEZ DE AFIRMAR ────────────────────────────────────────
 *
 * El aviso no dice «usted tiene cinco días»: eso sería la aplicación contando
 * días por su cuenta, que es justo lo que esta casa no hace. Dice qué frase
 * encontró, entre comillas y copiada del documento, y deja que el abogado
 * decida en un segundo si le interesa. Una cita se comprueba de un vistazo;
 * una afirmación hay que creerla.
 *
 * ─── Y NO CIERRA EL PASO ───────────────────────────────────────────────────
 *
 * El botón de orientar sigue encendido y donde estaba. Quien solo quiere saber
 * qué actuación presentar tiene derecho a seguir: el aviso ofrece, no obliga.
 * Un aviso que bloquea se aprende a esquivar, y entonces deja de avisar.
 */
export const AvisoDePlazoEnElAdjunto: React.FC<{
  /** La frase del documento que anunció el término, copiada de él. */
  plazo: string;
  /**
   * Llevar el documento a Revisiones ya leído. Ausente cuando quien monta esto
   * no sabe navegar allí: entonces se dice dónde está y no se ofrece el botón,
   * en vez de ofrecerlo y que no haga nada.
   */
  onLeer?: () => void;
}> = ({ plazo, onLeer }) => (
  <div className="notice-unverified mt-2" role="status">
    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-unverified" />
    <div className="min-w-0">
      <p className="text-justify [text-wrap:pretty]">
        Este documento anuncia un término: <span className="font-semibold [overflow-wrap:anywhere]">«{plazo}»</span>.
        Orientación no lee plazos — le dirá qué actuación presentar, con el término de la norma, no el de este
        papel.
      </p>
      {onLeer && (
        <button type="button" onClick={onLeer} className="btn-secondary btn-sm mt-2">
          Leerlo primero: qué le exige y para cuándo
        </button>
      )}
    </div>
  </div>
);
