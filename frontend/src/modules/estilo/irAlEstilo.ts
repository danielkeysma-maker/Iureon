/**
 * Ir a Ajustes → Estilo de la firma desde cualquier pantalla.
 *
 * ─── POR QUÉ UN EVENTO Y NO UNA PROP ───────────────────────────────────────
 *
 * El diálogo «Enseñar este formato» vive tres componentes por debajo de App
 * (App → lienzo → visor → diálogo), y la navegación entre módulos es de App.
 * Subir un `onIrAjustes` por las tres capas ata el visor a una pantalla que no
 * es suya. Un evento de ventana lo desacopla: el diálogo pide ir, App —y
 * Ajustes, si ya está abierto— deciden cómo. Sin oyente no pasa nada, que es lo
 * correcto para quien monte el visor fuera de App.
 */

const EVENTO = 'iureon:ir-al-estilo-de-la-firma';

/** El valor de `?ir=` y de la sección de Ajustes. */
export const SECCION_ESTILO = 'estilo';

export const irAlEstiloDeLaFirma = (): void => {
  window.dispatchEvent(new CustomEvent(EVENTO));
};

export const alPedirElEstiloDeLaFirma = (oyente: () => void): (() => void) => {
  const alPedir = () => oyente();
  window.addEventListener(EVENTO, alPedir);
  return () => window.removeEventListener(EVENTO, alPedir);
};
