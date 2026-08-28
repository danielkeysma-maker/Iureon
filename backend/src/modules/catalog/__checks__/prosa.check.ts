import { ALL_CATALOGS } from '../data';
import { detectarProsaDeAuditoria } from '../auditProse';
import type { Actuacion } from '../types';

/*
 * Vigila que la corrección de una verificación no se quede escrita DENTRO del
 * campo que el motor de redacción le entrega al modelo como derecho aplicable.
 *
 * Las guardas prueban que el detector sigue detectando y sigue callando donde
 * debe. La lista final es trabajo pendiente para un abogado, no un semáforo:
 * son fichas cuyo contenido es correcto y está verificado, y lo que hay que
 * hacer con ellas es reescribir el término afirmando la norma en vez de narrar
 * lo que a la ficha le faltaba.
 */

let fallos = 0;

const ficha = (termino: string): Actuacion =>
  ({
    id: 'x/y',
    exactName: 'Ficha de prueba',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'x',
    competentAuthority: 'x',
    term: { status: 'VERIFICADO', description: termino },
    requiredSections: [],
    sourceUrl: 'https://example.org',
  }) as unknown as Actuacion;

const guarda = (nombre: string, condicion: boolean): void => {
  if (condicion) {
    console.log(`ok   ${nombre}`);
  } else {
    console.log(`FAIL ${nombre}`);
    fallos += 1;
  }
};

guarda(
  'detecta la corrección narrada como omisión de la ficha',
  detectarProsaDeAuditoria([
    ficha('Tres (3) días. Efecto que la ficha omite: la solicitud desplaza la ejecutoria.'),
  ]).length === 1
);

guarda(
  'detecta la reforma señalada como no advertida',
  detectarProsaDeAuditoria([
    ficha('El estado se fija en secretaría. Reforma vigente que la ficha no advierte: hoy es virtual.'),
  ]).length === 1
);

guarda(
  'detecta el inciso señalado como faltante',
  detectarProsaDeAuditoria([
    ficha('Ejecutoriada a los tres días. Falta el inciso 2 del art. 302, que desplaza la fecha.'),
  ]).length === 1
);

guarda(
  'calla ante una omisión que es del deudor o de la autoridad, no de la ficha',
  detectarProsaDeAuditoria([
    ficha(
      'La OMISIÓN INJUSTIFICADA de enviar esas pruebas al juez acarreará responsabilidad, y la ' +
        'omisión del empleador no extingue el derecho del trabajador.'
    ),
  ]).length === 0
);

guarda(
  'calla ante un término que afirma la norma sin narrar defecto alguno',
  detectarProsaDeAuditoria([
    ficha(
      'DIEZ (10) DÍAS, RELOJ DEL CLIENTE Y PRECLUSIVO. «deberá manifestar su inconformidad dentro ' +
        'de los diez (10) días siguientes».'
    ),
  ]).length === 0
);

guarda(
  'calla ante una ficha sin término',
  detectarProsaDeAuditoria([{ ...ficha('x'), term: undefined } as unknown as Actuacion]).length === 0
);

const todas = ALL_CATALOGS.flatMap((c) => c.actuaciones);
const conProsa = detectarProsaDeAuditoria(todas);

console.log('');
console.log(`Catálogo: ${todas.length} fichas · ${conProsa.length} con auditoría dentro del término`);

for (const hallazgo of conProsa) {
  console.log('');
  console.log(`  [${hallazgo.branch}] ${hallazgo.exactName}`);
  console.log(`     marcador: «${hallazgo.marcador}»`);
  console.log(`     ${hallazgo.fragmento}`);
}

console.log('');
if (fallos > 0) {
  console.log(`${fallos} guarda(s) rota(s).`);
  process.exitCode = 1;
} else {
  console.log(
    conProsa.length === 0
      ? 'Ninguna ficha le entrega al modelo un reporte de auditoría como si fuera derecho.'
      : 'Cada una de arriba se arregla DOBLANDO la frase, no borrándola: la norma que el auditor señaló como faltante se afirma, y el andamio se retira.'
  );
  console.log('ALL CHECKS PASSED');
}
