/**
 * La guarda jurídica: una lección de estilo nunca lleva derecho.
 *
 * Run with: npm run check:estilo-guarda
 *
 * ─── POR QUÉ ES LA PIEZA QUE MÁS IMPORTA ──────────────────────────────────
 *
 * El bloque del estilo viaja al prompt de la redacción de TODOS los escritos
 * de ese rol y esa rama. Si una fórmula guardada dice «dentro de los diez (10)
 * días», el motor la leerá como la costumbre de la casa y la repetirá en un
 * escrito donde el plazo es otro — el reloj de otro, con la autoridad de la
 * firma. Por eso se descarta todo lo que huela a artículo, norma, providencia,
 * plazo o pretensión, y se DICE por qué: lo descartado vuelve a la pantalla.
 *
 * Puro: sin red, sin base, sin modelo.
 */
import { filtrarContenido, motivoJuridico, normalizarContenido } from '../guardaJuridica';
import type { ContenidoDeLeccion } from '../types';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' - ' + d : ''}`);
  if (!ok) fallos += 1;
};

/* ─── Debe rechazar ─────────────────────────────────────────────────────── */
const RECHAZAR: Array<[string, RegExp]> = [
  ['conforme al art. 384 del CGP', /artículo/],
  ['en los términos del artículo 90 del Código General del Proceso', /artículo/],
  ['dentro de los diez (10) días siguientes', /plazo/],
  ['dentro del término de ejecutoria', /plazo/],
  ['antes de que opere la caducidad', /plazo/],
  ['según la Ley 820 de 2003', /norma/],
  ['como lo dispone el Decreto 2591 de 1991', /norma/],
  ['en la sentencia T-025 de 2004', /providencia/],
  ['reiterado en SL4102-2022', /providencia/],
  ['como dijo la Corte en SU-049', /providencia/],
  ['condenar al demandado al pago de costas', /pretensión/],
  ['declarar que existió contrato de trabajo', /pretensión/],
  ['ordenar el pago de las acreencias', /pretensión/],
  ['bajo el radicado 110013103001', /cifra/],
  ['en representación de Carlos Mendoza Ruiz', /persona/]
];
for (const [texto, motivo] of RECHAZAR) {
  const m = motivoJuridico(texto);
  check(`rechaza «${texto}»`, m !== null && motivo.test(m), m ?? 'lo dejó pasar');
}

/* ─── Debe conservar ────────────────────────────────────────────────────── */
const CONSERVAR = [
  'Con todo respeto, me permito',
  'Del señor Juez,',
  'PRIMERO.',
  'Señor Juez Civil del Circuito',
  'Respetuosamente,',
  'Atentamente,',
  'FUNDAMENTOS DE DERECHO',
  'Honorable Magistrado',
  'su señoría',
  'Señor [DESPACHO]',
  '[NOMBRE DEL APODERADO]',
  'C.C. [IDENTIFICACIÓN]',
  'el suscrito apoderado',
  'Me permito presentar',
  'libelo'
];
for (const texto of CONSERVAR) {
  const m = motivoJuridico(texto);
  check(`conserva «${texto}»`, m === null, m ?? '');
}

/* ─── Sobre el contenido: descarta el ítem, no la lección, y dice por qué ─ */
const contenido: ContenidoDeLeccion = {
  titulosDeSeccion: [
    { titulo: 'HECHOS', numeracion: 'ROMANOS' },
    { titulo: 'PROCEDENCIA SEGÚN EL ART. 318 DEL CGP', numeracion: 'ROMANOS' }
  ],
  numeracionHechos: 'ORDINALES',
  ordenDeSecciones: ['HECHOS', 'PRETENSIONES', 'Ley 1564 de 2012'],
  encabezado: 'Señor [DESPACHO]',
  formulasDeApertura: ['Con todo respeto, me permito', 'dentro de los tres (3) días siguientes a la notificación'],
  formulasDeCierre: ['Del señor Juez,'],
  bloqueDeFirma: ['[NOMBRE DEL APODERADO]', 'C.C. [IDENTIFICACIÓN]'],
  tratamiento: { formula: 'su señoría', persona: 'PRIMERA_SINGULAR' },
  glosario: [
    { preferido: 'libelo', variantes: ['demanda', 'artículo 82'], ejemplo: 'el libelo cumple el art. 82' },
    { preferido: 'condenar al pago', variantes: [], ejemplo: '' }
  ]
};
const { contenido: filtrado, descartados } = filtrarContenido(contenido);
check('conserva el título limpio y descarta el que cita artículo', filtrado.titulosDeSeccion.length === 1 && filtrado.titulosDeSeccion[0].titulo === 'HECHOS');
check('descarta la norma del orden de secciones', filtrado.ordenDeSecciones.join('|') === 'HECHOS|PRETENSIONES');
check('descarta la fórmula con plazo y conserva la otra', filtrado.formulasDeApertura.length === 1);
check('descarta la variante y el ejemplo con artículo, conserva el término', filtrado.glosario.length === 1 && filtrado.glosario[0].variantes.join() === 'demanda' && filtrado.glosario[0].ejemplo === '');
check('descarta la entrada de glosario que es una pretensión', !filtrado.glosario.some((g) => g.preferido === 'condenar al pago'));
check('cada descarte vuelve con campo, texto y motivo', descartados.length === 6 && descartados.every((d) => d.campo && d.texto && d.motivo), JSON.stringify(descartados));
check('el motivo se lee como frase: «menciona un plazo»', descartados.some((d) => d.motivo === 'menciona un plazo'));

/* ─── El normalizador: forma, topes y tipos ─────────────────────────────── */
const largo = 'a'.repeat(301);
const norm = normalizarContenido({
  titulosDeSeccion: [{ titulo: 'HECHOS', numeracion: 'INVENTADA' }, 'suelto', { titulo: largo, numeracion: 'ROMANOS' }],
  numeracionHechos: 'ORDINALES',
  ordenDeSecciones: 'no es lista',
  encabezado: 42,
  formulasDeApertura: ['Con todo respeto, me permito', largo],
  formulasDeCierre: null,
  bloqueDeFirma: ['[NOMBRE]'],
  tratamiento: { formula: 'usted', persona: 'SEGUNDA' },
  glosario: [{ preferido: 'libelo', variantes: 'demanda', ejemplo: null }],
  textoDelEscrito: 'nunca debe sobrevivir'
});
check('una numeración desconocida queda en NINGUNA', norm.contenido.titulosDeSeccion[0]?.numeracion === 'NINGUNA');
check('una cadena de más de 300 caracteres se descarta con motivo', norm.descartados.filter((d) => d.motivo === 'es demasiado largo').length === 2);
check('los campos con tipo equivocado quedan vacíos', norm.contenido.ordenDeSecciones.length === 0 && norm.contenido.encabezado === '' && norm.contenido.formulasDeCierre.length === 0);
check('una persona desconocida queda en null', norm.contenido.tratamiento?.persona === null);
check('no sobrevive ninguna clave ajena al esquema', !('textoDelEscrito' in (norm.contenido as unknown as Record<string, unknown>)));
check('lo que no es objeto da un contenido vacío', normalizarContenido('texto').contenido.titulosDeSeccion.length === 0);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
