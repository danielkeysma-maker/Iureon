/**
 * El paquete `mammoth` declara sus tipos para su entrada de Node
 * (`lib/index.js`), que no sirve en un navegador: su lector de zip usa
 * `Buffer`, y sin polyfill la conversión falla al abrir el archivo. Lo que se
 * carga aquí es el paquete UMD ya construido para el navegador —trae su propio
 * zip y su propio Buffer—, que no lleva tipos.
 *
 * Se declara lo único que este proyecto usa. No es un `any` de conveniencia:
 * si mañana hiciera falta otra opción, tiene que escribirse aquí primero.
 */
declare module 'mammoth/mammoth.browser.min.js' {
  interface ResultadoDeMammoth {
    value: string;
    messages: Array<{ type: string; message: string }>;
  }
  interface OpcionesDeMammoth {
    styleMap?: string | string[];
    includeDefaultStyleMap?: boolean;
    ignoreEmptyParagraphs?: boolean;
    idPrefix?: string;
  }
  export function convertToHtml(entrada: { arrayBuffer: ArrayBuffer }, opciones?: OpcionesDeMammoth): Promise<ResultadoDeMammoth>;
  const mammoth: { convertToHtml: typeof convertToHtml };
  export default mammoth;
}
