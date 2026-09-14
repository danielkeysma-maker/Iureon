/**
 * El perfil de estilo es una función pura de las lecciones.
 *
 * Run with: npm run check:estilo-consolidar
 *
 * Lo que fija: el orden de secciones sale de la lección más reciente; las
 * fórmulas y el glosario se ordenan por cuántos escritos los usan; retirar una
 * lección recalcula todo (no hay acumulado que se quede viejo); el tope de 30
 * por alcance se niega en voz alta; y la rama sin lecciones cae al estilo
 * general del rol.
 *
 * Puro: sin red, sin base, sin modelo.
 */
import { consolidarEstilo, elegirAlcance, MAX_LECCIONES_POR_ALCANCE, puedeAgregarLeccion } from '../consolidarEstilo';
import type { ContenidoDeLeccion, LeccionGuardada } from '../types';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' - ' + d : ''}`);
  if (!ok) fallos += 1;
};

const vacio = (): ContenidoDeLeccion => ({
  titulosDeSeccion: [],
  numeracionHechos: null,
  ordenDeSecciones: [],
  encabezado: '',
  formulasDeApertura: [],
  formulasDeCierre: [],
  bloqueDeFirma: [],
  tratamiento: null,
  glosario: []
});

let n = 0;
const leccion = (fecha: string, parcial: Partial<ContenidoDeLeccion>, rama: string | null = 'LABORAL'): LeccionGuardada => ({
  id: `l${++n}`,
  rol: 'LITIGANTE',
  rama,
  fuente: 'BORRADOR',
  taughtBy: 'socia@firma.co',
  createdAt: fecha,
  contenido: { ...vacio(), ...parcial }
});

const vieja = leccion('2026-09-01T10:00:00Z', {
  ordenDeSecciones: ['HECHOS', 'PRETENSIONES', 'PRUEBAS'],
  formulasDeApertura: ['Me permito presentar', 'Con todo respeto, me permito'],
  formulasDeCierre: ['Atentamente,'],
  encabezado: 'Señor [DESPACHO]',
  glosario: [{ preferido: 'libelo', variantes: ['demanda'], ejemplo: 'el libelo introductorio' }]
});
const media = leccion('2026-09-05T10:00:00Z', {
  formulasDeApertura: ['Con todo respeto, me permito'],
  formulasDeCierre: ['Del señor Juez,'],
  encabezado: 'Señor [DESPACHO]',
  glosario: [
    { preferido: 'Libelo', variantes: ['escrito de demanda'], ejemplo: '' },
    { preferido: 'apoderado', variantes: ['abogado'], ejemplo: '' }
  ]
});
const reciente = leccion('2026-09-10T10:00:00Z', {
  ordenDeSecciones: ['PRETENSIONES', 'HECHOS', 'PRUEBAS'],
  formulasDeApertura: ['con todo respeto, me permito '],
  formulasDeCierre: ['Del señor Juez,'],
  encabezado: 'Honorable [DESPACHO]'
});

/* Se entregan desordenadas a propósito: el orden no puede depender de la consulta. */
const perfil = consolidarEstilo([media, vieja, reciente]);

check('cuenta las lecciones', perfil.lecciones === 3);
check('actualizado es la fecha más reciente', perfil.actualizado === '2026-09-10T10:00:00Z');
check('el orden de secciones sale de la lección más reciente', perfil.ordenDeSecciones.join('|') === 'PRETENSIONES|HECHOS|PRUEBAS');
check(
  'la fórmula que más escritos usan va primero, con «visto en N»',
  perfil.formulasDeApertura[0]?.vistoEn === 3 && /con todo respeto/i.test(perfil.formulasDeApertura[0].texto),
  JSON.stringify(perfil.formulasDeApertura)
);
check('la variación de mayúsculas y espacios cuenta como la misma fórmula', perfil.formulasDeApertura.length === 2);
check('el cierre en empate de uso lo decide el más reciente', perfil.formulasDeCierre[0]?.texto === 'Del señor Juez,' && perfil.formulasDeCierre[0].vistoEn === 2);
check('el encabezado es el más usado', perfil.encabezado?.texto === 'Señor [DESPACHO]' && perfil.encabezado.vistoEn === 2);
check(
  'el glosario agrupa por término y une variantes',
  perfil.glosario[0]?.preferido.toLowerCase() === 'libelo' && perfil.glosario[0].vistoEn === 2 && perfil.glosario[0].variantes.length === 2,
  JSON.stringify(perfil.glosario)
);
check('el ejemplo del glosario es el más reciente que no está vacío', perfil.glosario[0]?.ejemplo === 'el libelo introductorio');

/* Retirar recalcula. */
const sinReciente = consolidarEstilo([media, vieja]);
check('al retirar la más reciente, el orden vuelve al de la siguiente que lo tenga', sinReciente.ordenDeSecciones.join('|') === 'HECHOS|PRETENSIONES|PRUEBAS');
check('y los conteos bajan', sinReciente.formulasDeApertura[0]?.vistoEn === 2 && sinReciente.actualizado === '2026-09-05T10:00:00Z');
check('sin lecciones no hay perfil que inventar', consolidarEstilo([]).lecciones === 0 && consolidarEstilo([]).encabezado === null);

/* El tope. */
check('el tope es 30 por firma × rol × rama', MAX_LECCIONES_POR_ALCANCE === 30);
check('la 30.ª todavía cabe', puedeAgregarLeccion(29));
check('la 31.ª no', !puedeAgregarLeccion(30));

/* El respaldo por rama. */
const general = leccion('2026-08-01T10:00:00Z', { formulasDeCierre: ['Atentamente,'] }, null);
const conRama = elegirAlcance({ rama: 'LABORAL', deLaRama: [vieja], generales: [general] });
check('con lecciones en la rama, usa la rama', conRama.rama === 'LABORAL' && conRama.lecciones.length === 1);
const sinRama = elegirAlcance({ rama: 'FAMILIA', deLaRama: [], generales: [general] });
check('sin lecciones en la rama, cae al general del rol', sinRama.rama === null && sinRama.lecciones.length === 1);
const nada = elegirAlcance({ rama: 'FAMILIA', deLaRama: [], generales: [] });
check('sin ninguna, no hay alcance', nada.lecciones.length === 0);
const sinRamaPedida = elegirAlcance({ rama: null, deLaRama: [vieja], generales: [general] });
check('sin rama pedida, solo el general', sinRamaPedida.rama === null && sinRamaPedida.lecciones[0].id === general.id);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
