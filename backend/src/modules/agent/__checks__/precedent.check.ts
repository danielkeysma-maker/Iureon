/**
 * Guards what the draft is told about jurisprudence — above all, its absence.
 *
 * Run with: npm run check:precedent
 *
 * Este módulo existe por un defecto que llegó a producción: cuando el corpus no
 * devolvía nada, el prompt decía literalmente `JURISPRUDENCIA: .` — una etiqueta
 * vacía dos líneas debajo de una orden de citar. Un modelo no lee un campo en
 * blanco como "no hay"; lo lee como una casilla, y las casillas se llenan. De
 * ahí salió una redacción citando SU-049 de 2022, que no existe.
 *
 * Nada de esto llama a un modelo ni a la red: es la forma del prompt, y la forma
 * es la garantía.
 */
import { renderJurisprudencia, buildClaudeDraftPrompt, buildClaudeUserMessage } from '../claudeDraft.prompt';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const CITAS = [
  'T-760 de 2008 (CORTE CONSTITUCIONAL — M.P. Manuel José Cepeda — https://www.corteconstitucional.gov.co/relatoria/2008/T-760-08.htm)',
  'C-590 de 2005 (CORTE CONSTITUCIONAL — M.P. Jaime Córdoba Triviño — https://www.corteconstitucional.gov.co/relatoria/2005/C-590-05.htm)'
];

/*
 * ─── EL VACÍO SE DICE ──────────────────────────────────────────────────────
 */
const vacio = renderJurisprudencia([]);

check(
  'sin providencias, el prompt lo declara en vez de dejar el campo en blanco',
  /NINGUNA/.test(vacio),
  vacio.slice(0, 60)
);

check(
  'y prohíbe expresamente citar de memoria',
  /NO cites ninguna sentencia/i.test(vacio) && /radicado/i.test(vacio),
  ''
);

/*
 * La forma exacta del defecto viejo. Si alguien vuelve a interpolar una lista
 * vacía detrás de la etiqueta, esto tiene que fallar.
 */
const promptVacio = buildClaudeDraftPrompt({
  documentType: 'Acción de tutela',
  prompt: 'a mi cliente le negaron una cirugía autorizada',
  citations: [],
  catalogGuidance: null
});

check(
  'la etiqueta nunca queda seguida de nada',
  !/JURISPRUDENCIA:\s*\.\s/.test(promptVacio) && !/Jurisprudencia:\s*\.\s/.test(promptVacio),
  ''
);

const mensajeVacio = buildClaudeUserMessage({
  documentType: 'Acción de tutela',
  prompt: 'a mi cliente le negaron una cirugía autorizada',
  facts: 'EPS negó cirugía autorizada hace cuatro meses.',
  citations: [],
  gptSchemaOutput: ''
});

check(
  'el mensaje de usuario arrastra la misma prohibición, no el vacío',
  /NINGUNA/.test(mensajeVacio) && /NO cites ninguna sentencia/i.test(mensajeVacio),
  ''
);

/*
 * ─── Y LO ENCONTRADO SE ENTREGA COMPLETO ───────────────────────────────────
 *
 * El otro lado del mismo error sería filtrar tanto que la jurisprudencia real
 * no llegue: el modelo redactaría sin precedente teniéndolo, y nadie lo notaría
 * porque el escrito saldría igual de bien formado.
 */
const conCitas = renderJurisprudencia(CITAS);
const perdidas = CITAS.filter((c) => !conCitas.includes(c));

check('cada providencia encontrada llega al prompt', perdidas.length === 0, perdidas.join(', '));

check(
  'y se dice que su existencia fue confirmada contra el registro oficial',
  /registro oficial/i.test(conCitas),
  ''
);

check(
  'con la orden de no agregarle otras',
  /ÚNICAMENTE las providencias de esta lista/.test(conCitas),
  ''
);

const promptConCitas = buildClaudeDraftPrompt({
  documentType: 'Acción de tutela',
  prompt: 'a mi cliente le negaron una cirugía autorizada',
  citations: CITAS,
  catalogGuidance: null
});

check(
  'y no queda rastro de la prohibición del caso vacío cuando sí hay',
  !/NO cites ninguna sentencia/i.test(promptConCitas) && promptConCitas.includes(CITAS[0]),
  ''
);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
