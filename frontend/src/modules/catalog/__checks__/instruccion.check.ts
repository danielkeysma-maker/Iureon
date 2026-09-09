import { componerCuadroDeRedaccion, sugerenciasDeInstruccion } from '../instruccionSugerida';
import type { Actuacion } from '../types';

/**
 * Una sugerencia de instrucción no puede afirmar derecho que la ficha no traiga.
 *
 * Corre con: npm run check:instruccion (desde `frontend`)
 *
 * ─── POR QUÉ ESTE CHECK EXISTE ──────────────────────────────────────────────
 *
 * El defecto que vigila no se ve leyendo el código: una plantilla con un
 * artículo, un plazo o una autoridad escritos a mano se lee exactamente igual
 * que una armada con los campos de la ficha, y el abogado recibe la instrucción
 * ya redactada, con cara de haber salido del catálogo. Es la misma forma de
 * fabricación que este proyecto lleva quitando — no una cita falsa, sino una
 * afirmación sin fuente vestida de dato verificado.
 *
 * La guarda de fondo es aritmética y no de estilo: TODO fragmento jurídico del
 * texto tiene que aparecer literalmente en algún campo de la ficha de entrada.
 * Con una ficha vacía, la sugerencia se queda sin ninguno.
 *
 * SIN RED Y SIN MODELO. El módulo es puro precisamente para poder comprobarlo
 * así.
 */

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
  if (!ok) fallos++;
};

/** Ficha completa, con la forma real de una del catálogo. */
const COMPLETA: Actuacion = {
  id: 'civil-recurso-reposicion',
  exactName: 'Recurso de reposición',
  branch: 'CIVIL',
  role: 'LITIGANTE',
  legalBasis: 'Ley 1564 de 2012, art. 318',
  competentAuthority: 'El mismo juez que profirió el auto',
  term: {
    status: 'VERIFICADO',
    description: 'Tres (3) días siguientes a la notificación del auto'
  },
  requiredSections: [
    { n: 1, name: 'Identificación de la providencia recurrida', mandatory: true, basis: 'art. 318' },
    { n: 2, name: 'Sustentación', mandatory: true, basis: 'art. 318' },
    { n: 3, name: 'Anexos', mandatory: false, basis: null }
  ],
  sourceUrl: 'https://www.example.org/norma'
};

/** Ficha en el otro extremo: nombre y nada más. */
const PELADA: Actuacion = {
  id: 'x',
  exactName: 'Escrito sin ficha',
  branch: 'CIVIL',
  role: 'LITIGANTE',
  legalBasis: '',
  competentAuthority: null,
  term: { status: 'NO_VERIFICADO', description: null },
  requiredSections: [],
  sourceUrl: null
};

const HECHOS = 'A mi cliente le notificaron un auto que niega la prueba pericial.';

// ───────────────────────────────────────────────────────────────────────────
// 1. LA GARANTÍA DE FONDO: nada jurídico que la ficha no traiga.
// ───────────────────────────────────────────────────────────────────────────
/*
 * Se prueba por la vía dura: se BORRAN del texto todos los campos de la ficha y
 * lo que sobra no puede contener ni un número de artículo, ni un plazo, ni el
 * nombre de una autoridad. Un fixture nuevo con una plantilla escrita a mano
 * dispara esto sin que nadie tenga que acordarse de la regla.
 */
const HUELLA_DE_DERECHO =
  /(art[íi]culos?|arts?\.|ley(?:es)?\s+\d|decreto|c[óo]digo|sentencia|juez|juzgado|tribunal|superintendencia|d[íi]as?|meses?|a[ñn]os?|t[ée]rmino de)/i;

const sinLaFicha = (texto: string, a: Actuacion): string => {
  let resto = texto;
  const campos = [
    a.exactName,
    a.legalBasis,
    a.competentAuthority ?? '',
    a.term.description ?? '',
    ...a.requiredSections.map((s) => s.name)
  ].filter(Boolean);
  for (const campo of campos) resto = resto.split(campo).join(' ');
  return resto;
};

const FIXTURES: Array<[string, Actuacion]> = [
  ['ficha completa', COMPLETA],
  ['ficha pelada', PELADA]
];

for (const [nombre, ficha] of FIXTURES) {
  for (const s of sugerenciasDeInstruccion(ficha, HECHOS)) {
    const resto = sinLaFicha(s.texto, ficha);
    const huella = resto.match(HUELLA_DE_DERECHO);
    check(
      `${nombre} · «${s.id}» no aporta derecho propio`,
      huella === null,
      huella ? `sobra «${huella[0]}» fuera de los campos de la ficha` : ''
    );
  }
}

// ───────────────────────────────────────────────────────────────────────────
// 2. LO QUE LA FICHA NO TRAE, NO SE PINTA.
// ───────────────────────────────────────────────────────────────────────────
const dePelada = sugerenciasDeInstruccion(PELADA, HECHOS);

check(
  'una ficha sin autoridad, sin norma, sin secciones y sin término da UNA sola sugerencia',
  dePelada.length === 1,
  `dio ${dePelada.length}`
);
check(
  'y esa sugerencia es solo el encargo con los hechos',
  dePelada[0]?.texto ===
    'Redacte «Escrito sin ficha» con los hechos que se indican en este mismo cuadro.',
  dePelada[0]?.texto ?? '(ninguna)'
);

// Faltando solo la autoridad, su línea desaparece y las demás siguen en pie.
const sinAutoridad = sugerenciasDeInstruccion({ ...COMPLETA, competentAuthority: null }, HECHOS);
check(
  'sin autoridad no se nombra ninguna autoridad',
  sinAutoridad.every((s) => s.texto.indexOf('la autoridad que registra') === -1)
);
check(
  'sin autoridad las secciones siguen apareciendo',
  sinAutoridad.some((s) => s.texto.includes('Sustentación'))
);

// ───────────────────────────────────────────────────────────────────────────
// 3. UN TÉRMINO SIN VERIFICAR NO VIAJA A LA INSTRUCCIÓN.
// ───────────────────────────────────────────────────────────────────────────
/*
 * Es la regla más cara del producto puesta aquí: llevar un plazo que nadie
 * comprobó al cuadro que instruye al motor lo convierte en premisa del escrito,
 * y el abogado deja de verlo como dudoso.
 */
for (const estado of ['NO_VERIFICADO', 'NO_CADUCA'] as const) {
  const s = sugerenciasDeInstruccion(
    { ...COMPLETA, term: { status: estado, description: 'Treinta (30) dias' } },
    HECHOS
  );
  check(
    `un término ${estado} no se escribe en la instrucción`,
    s.every((x) => !x.texto.includes('Treinta (30) dias'))
  );
}

/*
 * UN CAMPO QUE YA TERMINA EN PUNTO NO RECIBE OTRO. El catálogo no sigue una
 * convención de puntuación, y «(art. 318)..» resta crédito justo al fragmento
 * que sí es exacto.
 */
check(
  'un campo de la ficha que ya trae punto no se cierra dos veces',
  sugerenciasDeInstruccion(
    { ...COMPLETA, legalBasis: 'Ley 1564 de 2012, art. 318.' },
    HECHOS
  ).every((s) => !s.texto.includes('..'))
);

check(
  'un término VERIFICADO sí se cita, atribuido a la ficha',
  sugerenciasDeInstruccion(COMPLETA, HECHOS).some((s) =>
    s.texto.includes(
      'Tenga presente el término que registra la ficha: Tres (3) días siguientes a la notificación del auto.'
    )
  )
);

// ───────────────────────────────────────────────────────────────────────────
// 4. SOLO LAS SECCIONES OBLIGATORIAS.
// ───────────────────────────────────────────────────────────────────────────
const completas = sugerenciasDeInstruccion(COMPLETA, HECHOS);
check(
  'las secciones obligatorias se listan',
  completas.some(
    (s) =>
      s.texto.includes('Identificación de la providencia recurrida') &&
      s.texto.includes('Sustentación')
  )
);
check(
  'una sección NO obligatoria no se exige',
  completas.every((s) => !s.texto.includes('Anexos'))
);

// ───────────────────────────────────────────────────────────────────────────
// 5. EL NOMBRE VIAJA TAL CUAL: es el contrato con el motor de redacción.
// ───────────────────────────────────────────────────────────────────────────
check(
  'el nombre exacto aparece literal en todas',
  completas.every((s) => s.texto.includes('«Recurso de reposición»'))
);

// Sin hechos escritos, no se remite a unos hechos que no existen.
check(
  'sin hechos no se promete un relato que nadie escribió',
  sugerenciasDeInstruccion(COMPLETA, '   ').every(
    (s) => !s.texto.includes('con los hechos que se indican')
  )
);

check('sin actuación no hay sugerencias', sugerenciasDeInstruccion(null, HECHOS).length === 0);

// ───────────────────────────────────────────────────────────────────────────
// 6. EL CUADRO DE REDACCIÓN NO PIERDE NINGUNA DE LAS DOS MITADES.
// ───────────────────────────────────────────────────────────────────────────
const cuadro = componerCuadroDeRedaccion('Redacte «Recurso de reposición».', HECHOS);
check('la instrucción sobrevive al viaje', cuadro.includes('Redacte «Recurso de reposición».'));
check('los hechos sobreviven al viaje', cuadro.includes(HECHOS));
check('van rotulados y separados, no fundidos', cuadro.includes('\n\nHECHOS\n'));

/*
 * EL CAMINO DE HOY, INTACTO. Sin instrucción viajan los hechos solos y sin
 * rótulo: cualquier añadido cambiaría lo que el motor recibe en el flujo que ya
 * funciona.
 */
check(
  'sin instrucción viajan los hechos exactamente como hoy',
  componerCuadroDeRedaccion('', HECHOS) === HECHOS
);
check(
  'sin instrucción ni hechos el cuadro queda vacío',
  componerCuadroDeRedaccion('  ', '  ') === ''
);
check(
  'sin hechos viaja solo la instrucción',
  componerCuadroDeRedaccion('Redacte esto.', '') === 'Redacte esto.'
);

console.log(fallos === 0 ? '\nOK — instrucción sugerida' : `\n${fallos} fallo(s)`);
process.exitCode = fallos === 0 ? 0 : 1;
