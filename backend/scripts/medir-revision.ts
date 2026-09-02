/**
 * Mide cuánto tarda una revisión real contra OpenRouter, para dimensionar el
 * límite de tiempo de la función serverless y el tope de caracteres.
 *
 * Correr a mano: npx ts-node -P tsconfig.check.json --transpile-only scripts/medir-revision.ts [caracteres] [maxTokens]
 * Cuesta centavos de dólar del crédito de OpenRouter: NO va en la suite.
 */
import { ENGINE, callOpenRouterWithUsage } from '../src/modules/agent/openrouter.client';
import { buildReviewSystemPrompt, buildReviewUserPrompt, parsearInforme, prepararTexto } from '../src/modules/agent/review/documentReview';

const caracteres = Number(process.argv[2] ?? 40_000);
const maxTokens = Number(process.argv[3] ?? 2_000);

const parrafo =
  'HECHOS. PRIMERO: El día 3 de marzo de 2026 el accionante solicitó a la EPS la autorización del procedimiento ordenado por su médico tratante, sin obtener respuesta. SEGUNDO: El 20 de marzo reiteró la solicitud por escrito, radicada bajo el número 2026-0345, y la entidad guardó silencio. TERCERO: El accionante padece una enfermedad que compromete su vida en condiciones dignas, según la historia clínica que se anexa. DERECHOS VULNERADOS: salud, vida digna, petición. FUNDAMENTOS DE DERECHO: artículos 11, 23, 49 y 86 de la Constitución; Decreto 2591 de 1991. PRETENSIONES: que se ordene a la EPS autorizar el procedimiento dentro de las cuarenta y ocho horas siguientes. ';
const texto = parrafo.repeat(Math.ceil(caracteres / parrafo.length)).slice(0, caracteres);

(async () => {
  const preparado = prepararTexto(texto);
  const inicio = Date.now();
  const r = await callOpenRouterWithUsage(
    ENGINE.OPUS,
    buildReviewSystemPrompt(),
    buildReviewUserPrompt({ documentType: 'Acción de tutela', guidance: null, pregunta: '', texto: preparado.texto, truncado: preparado.truncado }),
    maxTokens
  );
  const segundos = (Date.now() - inicio) / 1000;
  const informe = parsearInforme(r.text ?? '');
  const salida = process.argv[4];
  if (salida) require('node:fs').writeFileSync(salida, r.text ?? '', 'utf8');
  console.log(JSON.stringify({
    caracteres: preparado.caracteres,
    segundos,
    usage: r.usage,
    largoRespuesta: (r.text ?? '').length,
    informeLegible: informe !== null,
    fortalezas: informe?.fortalezas.length,
    debilidades: informe?.debilidades.length
  }, null, 1));
})();
