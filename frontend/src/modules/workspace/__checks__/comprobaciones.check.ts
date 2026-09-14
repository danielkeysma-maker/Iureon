/**
 * GUARDA DE LA COMPROBACIÓN AUTOMÁTICA EN PANTALLA. Run with: npm run check:comprobaciones
 *
 * ─── LO QUE SE JUEGA ───────────────────────────────────────────────────────
 *
 * Desde el 14 de septiembre de 2026 («opción 2») el servidor manda la vigencia
 * y la glosa del informe como DATO (`informe.comprobaciones`) y deja el texto
 * con las palabras del revisor. Pero los informes GUARDADOS antes traen la
 * comprobación escrita dentro del texto: corchetes donde el revisor nombró el
 * artículo y dos avisos al frente de las recomendaciones. Esos no se reescriben.
 *
 * Tres cosas tienen que aguantar, y ninguna falla a la vista:
 *
 *  1. EL INFORME VIEJO SE LEE COMO DATO, reconociendo cada marca por su
 *     apertura y su cierre EXACTOS —el detalle trae «», corchetes y puntos—, y
 *     nunca por un corchete suelto, que puede ser del revisor.
 *  2. NADA SE DUPLICA: la advertencia que se saca del texto se muestra una vez
 *     en la banda o junto al hallazgo, no además dentro del párrafo.
 *  3. NADA DESAPARECE: todo lo que el abogado veía antes sigue visible.
 *
 * Las marcas de abajo se construyen con las plantillas del backend
 * (`vigenciaDelInforme.ts`, `glosaDelInforme.ts`), en su forma guardada.
 */
import {
  lineaDePasajes,
  lineasDeLaBanda,
  marcasDelHallazgo,
  normalizarInforme
} from '../services/comprobaciones';
import type { ComprobacionesDelInforme, InformeDeRevision } from '../services/review.api';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

/* ─── Plantillas guardadas, copiadas del backend ─────────────────────────── */
const derogada = (detalle: string): string =>
  `[NORMA DEROGADA — este artículo NO está vigente: ${detalle}. La revisión lo nombró de todos modos; no se apoye en él.]`;
const modulada = (detalle: string): string =>
  `[NORMA VIGENTE PERO MODULADA POR LA CORTE — rige, pero su texto publicado no es el que rige: ${detalle} Léalo en la sentencia antes de usarlo.]`;
const discrepante = (detalle: string): string =>
  `[LAS FUENTES OFICIALES NO COINCIDEN sobre este artículo — ${detalle} Esta casa no elige: compruébelo usted.]`;
const glosa = (extracto: string, motivo: string): string =>
  `[LO QUE ESTA REVISIÓN AFIRMA NO LO DICE ESE ARTÍCULO — el texto oficial dice: «${extracto}». ${motivo} No se apoye en este punto sin leer la norma.]`;

const M_DEROGADA = derogada('Artículo derogado por el artículo 43 de la Ley 820 de 2003 [nota: «texto» del Senado]');
const M_MODULADA = modulada('Nota del artículo: «Aparte subrayado CONDICIONALMENTE exequible» [C-123/05].');
const M_DISCREPANTE = discrepante('El Senado lo da por VIGENTE] y Función Pública por DEROGADO.');
const M_GLOSA = glosa('Son obligaciones del arrendador, las siguientes: [...] 1. Entregar', 'El artículo regula al arrendador]. No al arrendatario.');
const M_GLOSA_90 = glosa('El juez deberá admitir la demanda', 'No dice eso.');

const AVISO_VIGENCIA =
  'COMPROBACIÓN AUTOMÁTICA DE VIGENCIA — esta revisión citó artículos por fuera de la ficha verificada, y el sistema los consultó uno por uno en las fuentes normativas oficiales (la Secretaría del Senado y el Gestor Normativo de Función Pública): 1 DEROGADO(S): CODIGO CIVIL, art. 2035. 1 vigente(s) pero MODULADO(S) por la Corte: CODIGO CIVIL, art. 1602. 1 sobre el/los que las fuentes oficiales NO COINCIDEN: CGP, art. 384. Cada uno queda señalado en el punto donde la revisión lo nombra. El resto del informe no cambia; lo señalado no se puede usar tal como está.';
const AVISO_GLOSA =
  'COMPROBACIÓN AUTOMÁTICA DE LO QUE ESTA REVISIÓN AFIRMA DE CADA ARTÍCULO — el sistema descargó el texto oficial de los artículos que la revisión cita por fuera de la ficha verificada y comparó, con ese texto delante, lo que la revisión dice que cada uno dice: 2 que el texto oficial NO SOSTIENE: Ley 820 de 2003, art. 8 — la revisión afirma «fija las obligaciones; del arrendatario»; Código General del Proceso, art. 90 — la revisión afirma «admite». 1 que no se pudo dar por comprobada(s): Código General del Proceso, art. 206. Lo no sostenido queda marcado en el punto donde la revisión lo afirma; no se apoye en esos puntos. Lo dudoso no se da por bueno ni por malo: ábralo en la fuente oficial antes de usarlo.';

/* ─── EL INFORME GUARDADO ANTES DEL CAMBIO, CON LA FORMA REAL ────────────────
 *
 * El 2035 aparece DOS veces en la misma debilidad (dos corchetes idénticos), el
 * 90 solo en el reemplazo —con el aviso subido al problema, que es la forma del
 * arreglo de hoy— y un reemplazo más viejo trae el corchete dentro.
 */
const LIMPIO = {
  resumen: 'El escrito se apoya en el artículo 1602 del Código Civil.',
  debilidad: 'Debe revisarse el artículo 2035 del Código Civil; otra vez, el artículo 2035 del Código Civil. Y el art. 8 de la Ley 820 fija las obligaciones.',
  correccion: 'Debe invocarse el artículo 384 del CGP.',
  problema: 'Falta el fundamento.',
  reemplazoNuevo: 'con fundamento en el artículo 90 del CGP',
  reemplazoViejo: 'solicito [de manera subsidiaria] con fundamento en el artículo 2035 del Código Civil',
  recomendacion: 'Aportar el contrato [anexo 3].'
};

const GUARDADO: InformeDeRevision = {
  resumen: `El escrito se apoya en el artículo 1602 ${M_MODULADA} del Código Civil.`,
  fortalezas: ['Hechos ordenados.'],
  debilidades: [
    `Debe revisarse el artículo 2035 ${M_DEROGADA} del Código Civil; otra vez, el artículo 2035 ${M_DEROGADA} del Código Civil. Y el art. 8 ${M_GLOSA} de la Ley 820 fija las obligaciones.`
  ],
  seccionesFaltantes: [],
  erroresDeAplicacion: [{ donde: 'Fundamentos', problema: 'Cita mal.', correccion: `Debe invocarse el artículo 384 ${M_DISCREPANTE} del CGP.` }],
  correccionesTextuales: [
    {
      cita: 'con fundamento en la ley',
      problema: `Falta el fundamento. Sobre el artículo 90 que cita el reemplazo propuesto: ${M_GLOSA_90}`,
      reemplazo: 'con fundamento en el artículo 90 del CGP'
    },
    {
      cita: 'solicito',
      problema: 'Poco concreto.',
      reemplazo: `solicito [de manera subsidiaria] con fundamento en el artículo 2035 ${M_DEROGADA} del Código Civil`
    }
  ],
  recomendaciones: [AVISO_VIGENCIA, AVISO_GLOSA, 'Aportar el contrato [anexo 3].']
};
const COPIA = JSON.stringify(GUARDADO);

const n = normalizarInforme(GUARDADO);
const i = n.informe;
const c = n.comprobaciones as ComprobacionesDelInforme;

/* ─── 1. EL TEXTO VUELVE A SER DEL REVISOR ───────────────────────────────── */

check('el origen se reconoce como texto guardado', n.origen === 'TEXTO_GUARDADO', n.origen);
check('el resumen queda sin la marca de modulada', i.resumen === LIMPIO.resumen, i.resumen);
check('la debilidad queda sin las dos marcas repetidas ni la de glosa, aunque traigan «», ] y puntos', i.debilidades[0] === LIMPIO.debilidad, i.debilidades[0]);
check('la corrección del error queda sin la discrepancia', i.erroresDeAplicacion[0].correccion === LIMPIO.correccion, i.erroresDeAplicacion[0].correccion);
check('el problema pierde el aviso que subió del reemplazo, con su «Sobre el artículo…»', i.correccionesTextuales?.[0].problema === LIMPIO.problema, i.correccionesTextuales?.[0].problema);
check('un reemplazo viejo marcado queda limpio y conserva sus corchetes propios', i.correccionesTextuales?.[1].reemplazo === LIMPIO.reemplazoViejo, i.correccionesTextuales?.[1].reemplazo);
check('las citas del abogado no se tocan', i.correccionesTextuales?.[0].cita === 'con fundamento en la ley' && i.correccionesTextuales?.[1].cita === 'solicito');
check(
  'las recomendaciones pierden los dos avisos del frente y conservan lo del revisor, con su corchete',
  JSON.stringify(i.recomendaciones) === JSON.stringify([LIMPIO.recomendacion]),
  JSON.stringify(i.recomendaciones)
);
check('el informe guardado no se muta', JSON.stringify(GUARDADO) === COPIA);

/* ─── 2. NADA SE DUPLICA ─────────────────────────────────────────────────── */

const textoVisible = JSON.stringify(i);
check('en el texto no queda ningún corchete de comprobación', !/\[NORMA |\[LAS FUENTES|\[LO QUE ESTA REVISI/.test(textoVisible), textoVisible.slice(0, 200));
check('ni ningún aviso de cabecera', !textoVisible.includes('COMPROBACIÓN AUTOMÁTICA'));
check(
  'los avisos viajan una sola vez, en la banda, en su orden',
  c.avisos.length === 2 && c.avisos[0] === AVISO_VIGENCIA && c.avisos[1] === AVISO_GLOSA
);
const banda = lineasDeLaBanda(n);
check('y la banda los trae una vez cada uno', (banda?.avisos ?? []).filter((a) => a === AVISO_VIGENCIA).length === 1 && (banda?.avisos ?? []).length === 2);
const enLaDebilidad = marcasDelHallazgo(c, 'debilidades', 0);
check(
  'el 2035 nombrado dos veces en la misma debilidad da UNA marca sobre ese hallazgo',
  enLaDebilidad.filter((m) => m.articulo === 2035 && m.clase === 'DEROGADA').length === 1,
  JSON.stringify(enLaDebilidad.map((m) => `${m.articulo}:${m.clase}`))
);

/* ─── 3. NADA DESAPARECE ─────────────────────────────────────────────────── */

check(
  'la marca de la debilidad trae el mensaje entero de antes, sin corchetes',
  enLaDebilidad.some((m) => m.clase === 'DEROGADA' && `[${m.mensaje}]` === M_DEROGADA),
  enLaDebilidad.map((m) => m.mensaje.slice(0, 40)).join(' | ')
);
check('y la glosa del art. 8 también', enLaDebilidad.some((m) => m.articulo === 8 && m.clase === 'NO_LO_DICE_EL_ARTICULO' && `[${m.mensaje}]` === M_GLOSA));
check('la modulada del resumen', marcasDelHallazgo(c, 'resumen', 0).some((m) => m.articulo === 1602 && m.clase === 'MODULADA'));
check(
  'la discrepancia del error de aplicación, con su campo',
  marcasDelHallazgo(c, 'erroresDeAplicacion', 0).some((m) => m.articulo === 384 && m.clase === 'FUENTES_EN_DESACUERDO' && m.campos.includes('correccion'))
);
const enLaCorreccion0 = marcasDelHallazgo(c, 'correccionesTextuales', 0);
check(
  'el aviso que había subido al problema vuelve como marca del REEMPLAZO de esa corrección',
  enLaCorreccion0.some((m) => m.articulo === 90 && m.clase === 'NO_LO_DICE_EL_ARTICULO' && m.campos.includes('reemplazo') && `[${m.mensaje}]` === M_GLOSA_90),
  JSON.stringify(enLaCorreccion0)
);
check(
  'y la del reemplazo viejo, también en el reemplazo',
  marcasDelHallazgo(c, 'correccionesTextuales', 1).some((m) => m.articulo === 2035 && m.campos.includes('reemplazo'))
);
check(
  'la norma se recupera del aviso cuando la trae',
  enLaDebilidad.find((m) => m.articulo === 8)?.norma === 'Ley 820 de 2003' && enLaDebilidad.find((m) => m.articulo === 2035)?.norma === 'CODIGO CIVIL',
  JSON.stringify(enLaDebilidad.map((m) => m.norma))
);
check(
  'la cuenta sale del aviso y de las marcas: también lo dudoso, que nunca se marcó',
  JSON.stringify(c.cuenta) === JSON.stringify({ derogada: 1, modulada: 1, fuentesEnDesacuerdo: 1, noLoDiceElArticulo: 2, noComprobada: 1 }),
  JSON.stringify(c.cuenta)
);

/* ─── 4. UN CORCHETE SUELTO NO ES UNA MARCA ──────────────────────────────── */

const SOLO_CORCHETES: InformeDeRevision = {
  resumen: 'Revise [NORMA INTERNA] y el [art. 384].',
  fortalezas: [],
  debilidades: ['[NORMA DEROGADA — este artículo NO está vigente: sin cierre'],
  seccionesFaltantes: [],
  erroresDeAplicacion: [],
  correccionesTextuales: [],
  recomendaciones: ['COMPROBACIÓN hecha por el revisor, no por el sistema.']
};
const soloCorchetes = normalizarInforme(SOLO_CORCHETES);
check(
  'corchetes propios, una apertura sin cierre y una recomendación parecida quedan intactos',
  JSON.stringify(soloCorchetes.informe) === JSON.stringify(SOLO_CORCHETES),
  JSON.stringify(soloCorchetes.informe)
);
check('y sin nada que leer no hay banda', soloCorchetes.origen === 'SIN_DATOS' && lineasDeLaBanda(soloCorchetes) === null, soloCorchetes.origen);

/* ─── 5. EL INFORME NUEVO, COMO DATO ─────────────────────────────────────── */

const NUEVO: InformeDeRevision = {
  resumen: 'El escrito se apoya en el artículo 2035 del Código Civil.',
  fortalezas: [],
  debilidades: ['Revise el art. 8 de la Ley 820.'],
  seccionesFaltantes: [],
  erroresDeAplicacion: [],
  correccionesTextuales: [],
  recomendaciones: ['Aporte el contrato.'],
  pasajesDelCaso: 4,
  comprobaciones: {
    articulos: [
      {
        codigo: 'CODIGO CIVIL',
        norma: 'Código Civil',
        articulo: 2035,
        vigencia: { estado: 'DEROGADO', detalle: 'Derogado.', fuentes: ['SENADO'], consultadoEn: '2026-09-14' },
        glosa: null,
        glosas: [],
        clases: ['DEROGADA'],
        mensajes: [{ clase: 'DEROGADA', texto: 'NORMA DEROGADA — este artículo NO está vigente: Derogado.. La revisión lo nombró de todos modos; no se apoye en él.' }],
        dondeAparece: [{ seccion: 'resumen', indice: 0 }]
      },
      {
        codigo: 'LEY 820 DE 2003',
        norma: 'Ley 820 de 2003',
        articulo: 8,
        vigencia: { estado: 'NO_VERIFICABLE', detalle: 'Ninguna fuente respondió.', fuentes: [], consultadoEn: '2026-09-14' },
        glosa: null,
        glosas: [],
        clases: ['NO_COMPROBADA'],
        mensajes: [{ clase: 'NO_COMPROBADA', texto: 'No se pudo comprobar: Ninguna fuente respondió.' }],
        dondeAparece: [{ seccion: 'debilidades', indice: 0 }]
      },
      {
        codigo: 'CGP',
        norma: 'Código General del Proceso',
        articulo: 206,
        vigencia: { estado: 'VIGENTE', detalle: 'Vigente.', fuentes: ['SENADO'], consultadoEn: '2026-09-14' },
        glosa: null,
        glosas: [],
        clases: [],
        mensajes: [],
        dondeAparece: []
      }
    ],
    cuenta: { derogada: 1, modulada: 0, fuentesEnDesacuerdo: 0, noLoDiceElArticulo: 0, noComprobada: 1 },
    avisos: ['COMPROBACIÓN AUTOMÁTICA DE VIGENCIA — aviso del servidor.'],
    vigenciaComprobada: true,
    glosaComprobada: true
  }
};
const nuevo = normalizarInforme(NUEVO);
check('el informe nuevo se reconoce como dato del servidor', nuevo.origen === 'SERVIDOR', nuevo.origen);
check('y su texto no se toca', nuevo.informe.resumen === NUEVO.resumen && JSON.stringify(nuevo.informe.recomendaciones) === '["Aporte el contrato."]');
check('la marca sobre el hallazgo sale del dato', marcasDelHallazgo(nuevo.comprobaciones, 'resumen', 0).some((m) => m.clase === 'DEROGADA' && m.etiqueta === 'Derogada'));
check(
  'lo no comprobado NO se marca sobre el hallazgo (la falsa alarma es peor que el silencio)',
  marcasDelHallazgo(nuevo.comprobaciones, 'debilidades', 0).length === 0
);
const bandaNueva = lineasDeLaBanda(nuevo);
check(
  'la banda cuenta solo las clases con algo, con su etiqueta',
  JSON.stringify(bandaNueva?.cuenta.map((x) => `${x.etiqueta}:${x.cantidad}`)) === JSON.stringify(['Derogada:1', 'No comprobada:1']),
  JSON.stringify(bandaNueva?.cuenta)
);
check('y nombra lo no comprobado, que no tiene marca propia', (bandaNueva?.noComprobadas ?? []).some((l) => l.includes('Ley 820 de 2003, art. 8')), JSON.stringify(bandaNueva?.noComprobadas));
check('los pasajes del caso se dicen', lineaDePasajes(nuevo) === 'Se cruzó con 4 pasajes del caso.', String(lineaDePasajes(nuevo)));
check('uno solo, en singular', lineaDePasajes(normalizarInforme({ ...NUEVO, pasajesDelCaso: 1 })) === 'Se cruzó con 1 pasaje del caso.');
check('y cero no dice nada', lineaDePasajes(normalizarInforme({ ...NUEVO, pasajesDelCaso: 0 })) === null);

const todoBien = normalizarInforme({
  ...NUEVO,
  comprobaciones: { ...NUEVO.comprobaciones!, articulos: [NUEVO.comprobaciones!.articulos[2]], avisos: [], cuenta: { derogada: 0, modulada: 0, fuentesEnDesacuerdo: 0, noLoDiceElArticulo: 0, noComprobada: 0 } }
});
check('con todo vigente la banda lo dice en una línea, sin conteos', (lineasDeLaBanda(todoBien)?.nota ?? '').includes('ninguno requiere atención') && lineasDeLaBanda(todoBien)?.cuenta.length === 0, String(lineasDeLaBanda(todoBien)?.nota));

/* ─── 6. LA NUEVA REVISIÓN NO COMPROBÓ ───────────────────────────────────── */

const rerevisado = normalizarInforme({ ...NUEVO, comprobaciones: null, pasajesDelCaso: 0 });
check('una nueva revisión se reconoce', rerevisado.origen === 'NO_SE_REPITIO', rerevisado.origen);
check('y la banda lo dice', lineasDeLaBanda(rerevisado)?.nota === 'Esta revisión no repitió la comprobación automática.', String(lineasDeLaBanda(rerevisado)?.nota));

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
