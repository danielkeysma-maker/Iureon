/**
 * El saneamiento corre ANTES de cualquier modelo y otra vez sobre lo que se
 * guarda. Este check fija lo que tiene que borrar de un escrito colombiano real.
 *
 * Run with: npm run check:estilo-saneamiento
 *
 * Puro: sin red, sin base, sin modelo.
 */
import { sanearContenido, sanearTexto } from '../saneamiento';
import type { ContenidoDeLeccion } from '../types';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' - ' + d : ''}`);
  if (!ok) fallos += 1;
};

const debeBorrar = (nombre: string, texto: string, prohibido: string, marcador: string): void => {
  const limpio = sanearTexto(texto);
  check(nombre, !limpio.includes(prohibido) && limpio.includes(marcador), limpio);
};

/* ─── Identificación ────────────────────────────────────────────────────── */
debeBorrar('cédula con puntos', 'identificado con cédula de ciudadanía No. 1.102.811.692 de Sincelejo', '811', '[IDENTIFICACIÓN]');
debeBorrar('NIT con dígito de verificación', 'sociedad con NIT 900.123.456-7, representada', '123', '[IDENTIFICACIÓN]');
debeBorrar('NIT sin puntos', 'NIT 900123456-7', '900123456', '[IDENTIFICACIÓN]');
debeBorrar('cédula sin puntos', 'C.C. 1102811692', '1102811692', '[IDENTIFICACIÓN]');

/* ─── Radicado ──────────────────────────────────────────────────────────── */
debeBorrar('radicado de 23 dígitos corrido', 'Radicado: 11001310300120200012300', '1100131', '[RADICADO]');
debeBorrar('radicado de 23 dígitos con guiones', 'Rad. 11001-31-03-001-2020-00123-00', '00123', '[RADICADO]');
check(
  'el radicado no se confunde con una cédula',
  sanearTexto('Rad. 11001-31-03-001-2020-00123-00').includes('[RADICADO]') &&
    !sanearTexto('Rad. 11001-31-03-001-2020-00123-00').includes('[IDENTIFICACIÓN]')
);

/* ─── Valores, correos, teléfonos, direcciones, fechas ──────────────────── */
debeBorrar('valor con signo y espacio', 'por la suma de $ 44.441.250 m/cte', '44.441.250', '[VALOR]');
debeBorrar('valor con centavos', 'la suma de $44.441.250,00', '441', '[VALOR]');
debeBorrar('valor en letras con pesos', 'la suma de 3.500.000 pesos', '3.500.000', '[VALOR]');
debeBorrar('correo', 'notificaciones: juan.perez@firma.com.co', 'juan.perez', '[CORREO]');
debeBorrar('celular', 'teléfono 300 123 4567', '4567', '[TELÉFONO]');
debeBorrar('celular con indicativo', 'celular +57 3001234567', '3001234567', '[TELÉFONO]');
debeBorrar('dirección urbana', 'domiciliado en la Calle 45 # 12-30, apto 301', '12-30', '[DIRECCIÓN]');
debeBorrar('dirección con Cra.', 'oficina en la Cra. 7 No. 32-16', '32-16', '[DIRECCIÓN]');
debeBorrar('fecha en palabras', 'el 15 de marzo de 2024 se celebró', 'marzo', '[FECHA]');
debeBorrar('fecha con barras', 'el día 15/03/2024', '2024', '[FECHA]');

/* ─── Nombres por su contexto ───────────────────────────────────────────── */
debeBorrar('nombre después de «señor»', 'el señor Juan Carlos Pérez Gómez manifestó', 'Pérez', '[PARTE]');
debeBorrar('nombre después de «señora»', 'la señora MARÍA JOSÉ RUIZ presentó', 'RUIZ', '[PARTE]');
debeBorrar(
  'nombre antes de «identificado con»',
  'JUAN CARLOS PÉREZ GÓMEZ, identificado con cédula de ciudadanía No. 1.102.811.692',
  'PÉREZ',
  '[PARTE]'
);
debeBorrar('nombre después de «identificada con»... y el número también', 'Ana Ruiz, identificada con C.C. 52.123.456', '52.123', '[IDENTIFICACIÓN]');
debeBorrar('nombre después de «en contra de»', 'demanda ejecutiva en contra de Constructora Andina S.A.S.', 'Andina', '[PARTE]');
debeBorrar('nombre después de «apoderado de»', 'actuando como apoderado de Luis Fernando Mora', 'Mora', '[PARTE]');

/*
 * Tres defectos que destapó `check:estilo-prompt` con un escrito entero, y que
 * los casos de una línea no veían: el nombre cruzaba el salto de línea, una
 * cédula seguida de coma se reemplazaba a medias, y «contra» sin «en» no
 * disparaba.
 */
debeBorrar('cédula seguida de coma, entera', 'identificado con C.C. No. 1.102.811.692, contra', '692', '[IDENTIFICACIÓN]');
debeBorrar('nombre después de «contra»', 'proceso de [PARTE] contra Constructora Andina S.A.S.', 'Andina', '[PARTE]');
check(
  'el nombre no cruza el salto de línea',
  sanearTexto('Señor Juez Laboral del Circuito de Sincelejo\nReferencia: proceso') === 'Señor Juez Laboral del Circuito de Sincelejo\nReferencia: proceso',
  sanearTexto('Señor Juez Laboral del Circuito de Sincelejo\nReferencia: proceso')
);
debeBorrar('pero «señor Juez Pedro Gómez» sí es un nombre', 'el señor Juez Pedro Gómez dijo', 'Gómez', '[PARTE]');

/* ─── Lo que NO puede borrar: las fórmulas son la lección ───────────────── */
const formulas = ['Del señor Juez,', 'Con todo respeto, me permito', 'Señor Juez Civil del Circuito', 'Señor Juez Laboral del Circuito de Sincelejo', 'PRIMERO.', 'Respetuosamente,', 'su señoría'];
for (const f of formulas) {
  check(`conserva «${f}»`, sanearTexto(f) === f, sanearTexto(f));
}

/* ─── Datos del caso, por coincidencia exacta ───────────────────────────── */
const datos = { partes: ['Rosa Elvira Cárdenas', 'Inversiones Delta'], despachos: ['Juzgado Tercero Civil del Circuito de Sincelejo'], radicados: ['2021-00456'] };
const conCaso = sanearTexto(
  'En el proceso de ROSA ELVIRA CARDENAS contra Inversiones Delta, ante el Juzgado Tercero Civil del Circuito de Sincelejo, radicado 2021-00456',
  datos
);
check('parte del caso por coincidencia exacta (sin tildes ni mayúsculas)', !/c[aá]rdenas/i.test(conCaso) && !conCaso.includes('Delta'), conCaso);
check('despacho del caso por coincidencia exacta', !conCaso.includes('Tercero Civil') && conCaso.includes('[DESPACHO]'), conCaso);
check('radicado del caso por coincidencia exacta', !conCaso.includes('00456'), conCaso);

/* ─── Sobre el contenido estructurado ───────────────────────────────────── */
const contenido: ContenidoDeLeccion = {
  titulosDeSeccion: [{ titulo: 'HECHOS', numeracion: 'ROMANOS' }],
  numeracionHechos: 'ORDINALES',
  ordenDeSecciones: ['HECHOS', 'PRETENSIONES'],
  encabezado: 'Señor Juez, ref: proceso de Juan Pérez, identificado con C.C. 1.102.811.692',
  formulasDeApertura: ['Con todo respeto, me permito'],
  formulasDeCierre: ['Del señor Juez,'],
  bloqueDeFirma: ['[NOMBRE DEL APODERADO]', 'T.P. 123.456 del C.S. de la J.'],
  tratamiento: { formula: 'su señoría', persona: 'PRIMERA_SINGULAR' },
  glosario: [{ preferido: 'libelo', variantes: ['demanda'], ejemplo: 'el libelo radicado el 15 de marzo de 2024' }]
};
const saneado = sanearContenido(contenido);
check('el contenido saneado no conserva la cédula del encabezado', !saneado.encabezado.includes('811'), saneado.encabezado);
check('ni la tarjeta profesional del bloque de firma', !saneado.bloqueDeFirma.join(' ').includes('123.456'), saneado.bloqueDeFirma.join(' | '));
check('ni la fecha del ejemplo del glosario', !saneado.glosario[0].ejemplo.includes('marzo'), saneado.glosario[0].ejemplo);
check('y deja las fórmulas intactas', saneado.formulasDeCierre[0] === 'Del señor Juez,' && saneado.formulasDeApertura[0] === 'Con todo respeto, me permito');

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
