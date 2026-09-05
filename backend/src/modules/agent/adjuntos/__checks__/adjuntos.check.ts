/**
 * Guards the pure half of attachment reading: limits, block rendering and the
 * parsing of the vision model's answer.
 *
 * Run with: npm run check:adjuntos
 *
 * The defect this module ends: a lawyer attached the comparendo and the draft
 * still said [•] where the plate, the number and the place were. These checks
 * do not prove a model reads a photo well — that is measured on real files —
 * but they do prove that what was read reaches the prompt intact, that an
 * empty read produces NO header for the model to fill, and that a JSON cut by
 * the token budget keeps the data it already carried.
 */
import {
  ENCABEZADO_BLOQUE,
  MAX_ADJUNTOS,
  MAX_CARACTERES_POR_ADJUNTO,
  MAX_CARACTERES_TOTAL,
  PROMPT_IMAGEN,
  aplicarTopeTotal,
  datosLegiblesDe,
  esImagen,
  mensajeInicioLectura,
  parsearRespuestaImagen,
  recortar,
  renderBloqueAdjuntos,
  resumenDeLectura,
  textoDeLecturaDeImagen,
  validarAdjuntos,
  type AdjuntoLeido
} from '../adjuntos';
import { buildClaudeDraftPrompt, buildClaudeUserMessage } from '../../claudeDraft.prompt';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

// ─── validarAdjuntos ────────────────────────────────────────────────────────
check('sin adjuntos es válido y vacío', (() => {
  const r = validarAdjuntos(undefined);
  return r.ok && r.adjuntos.length === 0;
})());
check('una lista con más de MAX_ADJUNTOS se rechaza', (() => {
  const r = validarAdjuntos(Array.from({ length: MAX_ADJUNTOS + 1 }, (_, i) => ({ nombre: `a${i}.pdf`, tipo: 'application/pdf', contentBase64: 'QQ==' })));
  return !r.ok && /hasta 8/.test(r.motivo);
})());
check('un adjunto con base64 Y storageKey se rechaza', !validarAdjuntos([{ nombre: 'x.pdf', tipo: '', contentBase64: 'QQ==', storageKey: 'f/x' }]).ok);
check('un adjunto sin payload se rechaza', !validarAdjuntos([{ nombre: 'x.pdf', tipo: '' }]).ok);
check('un adjunto sin nombre se rechaza', !validarAdjuntos([{ nombre: '  ', tipo: '', contentBase64: 'QQ==' }]).ok);
check('un adjunto bien formado pasa con el tipo en minúsculas', (() => {
  const r = validarAdjuntos([{ nombre: 'Comparendo.PDF', tipo: 'Application/PDF', storageKey: 'firma/adjuntos/x' }]);
  return r.ok && r.adjuntos[0].tipo === 'application/pdf' && r.adjuntos[0].storageKey === 'firma/adjuntos/x';
})());

// ─── esImagen ───────────────────────────────────────────────────────────────
check('image/jpeg es imagen', esImagen({ tipo: 'image/jpeg', nombre: 'foto.jpg' }));
check('sin tipo, la extensión .png decide', esImagen({ tipo: '', nombre: 'cedula.PNG' }));
check('un PDF no es imagen aunque se llame foto', !esImagen({ tipo: 'application/pdf', nombre: 'foto.pdf' }));

// ─── recortar / tope total ──────────────────────────────────────────────────
const largo = 'x'.repeat(MAX_CARACTERES_POR_ADJUNTO + 500);
check('recortar corta al tope y lo declara', (() => {
  const r = recortar(largo);
  return r.recortado && r.texto.startsWith('x'.repeat(MAX_CARACTERES_POR_ADJUNTO)) && /recortado/.test(r.texto) && r.texto.length < largo.length;
})());
check('recortar no toca lo que cabe', !recortar('hola').recortado);

const leido = (nombre: string, n: number): AdjuntoLeido => ({ nombre, clase: 'documento', ok: true, caracteres: n, texto: 'a'.repeat(n) });
const topados = aplicarTopeTotal([leido('1.pdf', 40_000), leido('2.pdf', 40_000), leido('3.pdf', 40_000), leido('4.pdf', 40_000)]);
check('el tope total deja intactos los primeros', topados[0].texto?.length === 40_000 && topados[2].texto?.length === 40_000);
check('el archivo que ya no cabe queda NO leído con motivo, no desaparece', !topados[3].ok && /tope|ocupan/.test(topados[3].motivo ?? '') && topados.length === 4);
const parcial = aplicarTopeTotal([leido('1.pdf', MAX_CARACTERES_TOTAL - 100), leido('2.pdf', 1_000)]);
check('el que cabe a medias se recorta y lo dice', parcial[1].ok && /tope total/.test(parcial[1].texto ?? '') && (parcial[1].caracteres ?? 0) < 1_000);

// ─── parsearRespuestaImagen ─────────────────────────────────────────────────
const respuesta = `TRANSCRIPCIÓN:
COMPARENDO No. 11001000000012345678
Placa ABC123 · Fecha 12/03/2026 · Lugar: Calle 26 con Cra 50, Bogotá

DATOS:
{"tipo_documento":"comparendo","numeros":{"comparendo":"11001000000012345678","placa":"ABC123","cedula":""},"fechas":["12/03/2026"],"lugares":["Calle 26 con Cra 50, Bogotá"],"personas_entidades":[],"valores":[],"autoridad":"Secretaría de Movilidad","otros":""}`;
const l1 = parsearRespuestaImagen(respuesta);
check('separa transcripción y JSON', /COMPARENDO No\. 11001/.test(l1.transcripcion) && !/DATOS:/.test(l1.transcripcion) && l1.datos !== null);
check('los datos legibles nombran solo lo que trae valor', (() => {
  const d = l1.datosLegibles;
  return d.includes('placa') && d.includes('comparendo') && d.includes('fecha') && d.includes('lugar') && d.includes('autoridad') && !d.includes('cédula') && !d.includes('valor');
})(), l1.datosLegibles.join(','));

const cortada = respuesta.slice(0, respuesta.indexOf('"fechas"') + 22); // cut inside the array
const l2 = parsearRespuestaImagen(cortada);
check('un JSON cortado por el presupuesto conserva los datos ya leídos', l2.datos !== null && (l2.datos?.numeros as Record<string, string>)?.placa === 'ABC123', JSON.stringify(l2.datos));
check('y la transcripción sobrevive al corte', /Placa ABC123/.test(l2.transcripcion));

const l3 = parsearRespuestaImagen('TRANSCRIPCIÓN:\nsin texto legible\n\nDATOS:\nNo hay datos que extraer.');
check('prosa donde iba JSON: datos null, transcripción intacta', l3.datos === null && l3.transcripcion === 'sin texto legible' && l3.datosLegibles.length === 0);

const l4 = parsearRespuestaImagen('Placa XYZ987 leída en la foto');
check('sin marcas: todo es transcripción', l4.transcripcion === 'Placa XYZ987 leída en la foto' && l4.datos === null);

const l5 = parsearRespuestaImagen('TRANSCRIPCIÓN:\nOficio 123\n\nDATOS:\n```json\n{"tipo_documento":"oficio"}\n```');
check('tolera la valla de código alrededor del JSON', l5.datos?.tipo_documento === 'oficio');

check('datosLegiblesDe(null) es vacío', datosLegiblesDe(null).length === 0);
check('el texto de una imagen lleva transcripción y JSON', (() => {
  const t = textoDeLecturaDeImagen(l1);
  return /TEXTO LEÍDO EN LA IMAGEN/.test(t) && /DATOS IDENTIFICADOS/.test(t) && /ABC123/.test(t);
})());

// ─── renderBloqueAdjuntos ───────────────────────────────────────────────────
check('sin lecturas el bloque es VACÍO (ningún encabezado que llenar)', renderBloqueAdjuntos([]) === '' && renderBloqueAdjuntos([{ nombre: 'x.pdf', clase: 'documento', ok: false, caracteres: 0, motivo: 'PDF ilegible' }]) === '');
const bloque = renderBloqueAdjuntos([
  leido('comparendo.pdf', 1_204),
  { nombre: 'foto.jpg', clase: 'imagen', ok: true, caracteres: 300, texto: 'TEXTO LEÍDO EN LA IMAGEN:\nPlaca ABC123', datos: ['placa'] },
  { nombre: 'anexo.pdf', clase: 'documento', ok: false, caracteres: 0, motivo: 'no leído: tardó más de 20 s' }
]);
check('el bloque abre con el encabezado acordado', bloque.startsWith(ENCABEZADO_BLOQUE) && /\[•\]/.test(ENCABEZADO_BLOQUE));
check('cada archivo va numerado con su nombre y sus caracteres', /Adjunto 1: comparendo\.pdf \(documento, 1\.204 caracteres\)/.test(bloque) && /Adjunto 2: foto\.jpg \(imagen/.test(bloque));
check('el no leído se declara para que el modelo no lo suponga', /Adjunto 3: anexo\.pdf/.test(bloque) && /NO SE PUDO LEER \(no leído: tardó más de 20 s\)/.test(bloque));

// ─── Status lines ───────────────────────────────────────────────────────────
check('«Leyendo 1 adjunto…» / «Leyendo 2 adjuntos…»', mensajeInicioLectura(1) === 'Leyendo 1 adjunto…' && mensajeInicioLectura(2) === 'Leyendo 2 adjuntos…');
const resumen = resumenDeLectura([
  leido('comparendo.pdf', 1_204),
  { nombre: 'foto.jpg', clase: 'imagen', ok: true, caracteres: 300, texto: 'x', datos: ['placa', 'fecha', 'lugar'] },
  { nombre: 'anexo.pdf', clase: 'documento', ok: false, caracteres: 0, motivo: 'PDF ilegible' }
]);
check('el resumen dice caracteres del documento y datos de la foto', /comparendo\.pdf \(1\.204 caracteres\)/.test(resumen) && /foto\.jpg \(datos: placa, fecha, lugar\)/.test(resumen), resumen);
check('y nombra el no leído con su motivo', /no leídos: anexo\.pdf \(PDF ilegible\)/.test(resumen));

// ─── The block reaches the writer, and the rule only travels with it ────────
const sinAdjuntos = buildClaudeDraftPrompt({ documentType: 'Acción de tutela', prompt: 'p', citations: [], catalogGuidance: null });
const conAdjuntosPrompt = buildClaudeDraftPrompt({ documentType: 'Acción de tutela', prompt: 'p', citations: [], catalogGuidance: null, adjuntos: bloque });
check('sin adjuntos el sistema no menciona la regla de adjuntos', !/REGLA DE LOS ADJUNTOS/.test(sinAdjuntos));
check('con adjuntos el sistema manda usarlos tal cual y resolver la contradicción a favor del abogado', /REGLA DE LOS ADJUNTOS/.test(conAdjuntosPrompt) && /prevalece lo que escribió el abogado/.test(conAdjuntosPrompt));
const mensaje = buildClaudeUserMessage({ documentType: 'Acción de tutela', prompt: 'p', facts: 'f', citations: [], adjuntos: bloque });
check('el bloque entero llega al mensaje del redactor', mensaje.includes(bloque));
check('sin bloque el mensaje no cambia de forma', !/DATOS DE LOS ADJUNTOS/.test(buildClaudeUserMessage({ documentType: 'x', prompt: 'p', facts: 'f', citations: [] })));

// ─── The vision prompt ──────────────────────────────────────────────────────
check('el prompt de imagen exige fidelidad y prohíbe inventar', /Transcribe fielmente|transcribe fielmente/.test(PROMPT_IMAGEN) && /No inventes/.test(PROMPT_IMAGEN) && /comparendo/.test(PROMPT_IMAGEN) && /placa/.test(PROMPT_IMAGEN));

if (fallos > 0) {
  console.error(`\n${fallos} check(s) failed.`);
  process.exitCode = 1;
} else {
  console.log('\nALL CHECKS PASSED');
}
