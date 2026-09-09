import { catalogService } from '../catalog.service';
import { applyVerification, applyVerifications } from '../verification.merge';
import { validateVerificationInput } from '../verification.validate';
import {
  ACTUACIONES_QUE_SE_PRESTAN,
  MARCA_POR_REMISION,
  RAMAS_QUE_NO_REMITEN,
  REMISIONES
} from '../remisiones';
import type { Actuacion, CatalogVerification, LegalBranch } from '../types';

/**
 * `npm run check:remision` — que una ficha prestada llegue, se note y no mienta.
 *
 * ─── LO QUE VIGILA ──────────────────────────────────────────────────────────
 *
 * El defecto que este check existe para impedir es UNO: que el recurso de
 * reposición aparezca en familia con sus tres días del proceso civil intactos.
 * Eso sería publicar el reloj de otro con sello de verificado, que es el
 * defecto número uno de la doctrina de verificación y el que explica 59 de las
 * 76 fichas defectuosas de la pasada de agosto.
 *
 * Por eso las guardas no comprueban «aparece»: comprueban «aparece, dice que
 * es prestada, y NO afirma su plazo».
 */

let fallos = 0;

const falla = (mensaje: string): void => {
  console.error(`FAIL ${mensaje}`);
  fallos++;
};

const ok = (mensaje: string): void => console.log(`  ok · ${mensaje}`);

/* ─── 1. UNA RAMA CON REMISIÓN LAS LISTA, AL FINAL, MARCADAS Y DEGRADADAS ─── */

const CON_REMISION: LegalBranch = 'FAMILIA';

const familia = catalogService.list(CON_REMISION);
const prestadasEnFamilia = familia.filter((a) => a.porRemision);

if (prestadasEnFamilia.length === 0) {
  falla(`${CON_REMISION} no recibió ninguna ficha por remisión y la rama sí remite al CGP.`);
} else {
  ok(`${CON_REMISION} alcanza ${prestadasEnFamilia.length} actuaciones por remisión.`);
}

const reposicion = familia.find((a) => a.exactName === 'Recurso de reposición');

if (!reposicion) {
  falla(`«Recurso de reposición» sigue sin ser alcanzable desde ${CON_REMISION}.`);
} else {
  if (!reposicion.porRemision) {
    falla('La reposición llegó a FAMILIA sin sobre: se leería como propia de la rama.');
  } else {
    if (reposicion.porRemision.paraRama !== CON_REMISION) {
      falla('El sobre no dice a qué rama llegó la ficha.');
    }
    if (reposicion.porRemision.ramaFuente !== 'CIVIL') {
      falla('El sobre no dice de qué rama viene la ficha.');
    }
    if (reposicion.porRemision.marca !== MARCA_POR_REMISION) {
      falla('El sobre no trae la marca que pinta la pantalla.');
    }
  }

  /*
   * LA GUARDA QUE IMPORTA. Si esto se rompe, el catálogo está afirmando en
   * familia un plazo que solo se leyó para lo civil.
   */
  if (reposicion.term.status !== 'NO_VERIFICADO') {
    falla(
      `La reposición llega a FAMILIA con term.status = ${reposicion.term.status}. Debe llegar NO_VERIFICADO: nadie leyó ese plazo para esta rama.`
    );
  } else if (reposicion.term.description !== null) {
    falla(
      'La reposición llega NO_VERIFICADO pero con descripción de término, que es exactamente el estado que TermStatus existe para impedir.'
    );
  } else {
    ok('La reposición llega a FAMILIA sin afirmar plazo.');
  }

  // El plazo civil no se pierde: se conserva rotulado como referencia.
  if (reposicion.porRemision?.terminoEnLaRamaFuente.status !== 'VERIFICADO') {
    falla('El sobre perdió el término que la ficha sí tiene verificado en lo civil.');
  }

  // Y el fundamento se lo dice al motor, que solo lee `legalBasis` verbatim.
  if (!reposicion.legalBasis.includes('por remisión')) {
    falla('El fundamento no menciona la remisión, así que el motor la afirmaría como propia de la rama.');
  }

  // Va al final de la lista, detrás de lo propio y de lo transversal.
  const propiasDespues = familia
    .slice(familia.indexOf(reposicion))
    .filter((a) => !a.porRemision);
  if (propiasDespues.length > 0) {
    falla(
      `Hay ${propiasDespues.length} actuaciones sin sobre después de la primera prestada: lo prestado debe ir al final.`
    );
  } else {
    ok('Lo prestado va al final de la rama.');
  }
}

/* ─── 2. UNA RAMA SIN REMISIÓN NO LAS LISTA ────────────────────────────── */

for (const rama of Object.keys(RAMAS_QUE_NO_REMITEN) as LegalBranch[]) {
  const conSobre = catalogService.list(rama).filter((a) => a.porRemision);
  if (conSobre.length > 0) {
    falla(
      `${rama} está declarada como rama que NO remite y aun así recibió ${conSobre.length} fichas prestadas.`
    );
  } else {
    ok(`${rama} no recibe nada prestado, como se declaró.`);
  }
}

/*
 * Y una rama que no está en NINGUNA de las dos tablas tampoco recibe: la
 * ausencia es «no se leyó», no «adelante».
 */
const sinDeclarar = catalogService
  .listBranches()
  .filter((b) => !(b in REMISIONES) && !(b in RAMAS_QUE_NO_REMITEN));

const filtradas = sinDeclarar.filter((b) => catalogService.list(b).some((a) => a.porRemision));

if (filtradas.length > 0) {
  falla(`Ramas sin declaración que aun así reciben fichas prestadas: ${filtradas.join(', ')}.`);
} else {
  ok(`Las ${sinDeclarar.length} ramas sin declaración no reciben nada.`);
}

/* ─── 3. LA RAMA FUENTE NO CAMBIA ──────────────────────────────────────── */

const civil = catalogService.list('CIVIL');

if (civil.some((a) => a.porRemision)) {
  falla('CIVIL se está prestando fichas a sí misma.');
}

const reposicionCivil = civil.find((a) => a.id === 'civil/recurso-de-reposicion');

if (!reposicionCivil) {
  falla('La reposición desapareció de CIVIL.');
} else if (reposicionCivil.term.status !== 'VERIFICADO') {
  falla('La reposición perdió su término verificado en CIVIL, que es su rama.');
} else if (!reposicionCivil.term.description?.includes('Tres (3) días')) {
  falla('La reposición civil dejó de publicar sus tres días.');
} else {
  ok('CIVIL conserva su reposición con los tres días verificados.');
}

/* ─── 4. EL NOMBRE RESUELVE DESDE LA RAMA, CON EL SOBRE ────────────────── */

const resuelta = catalogService.findByDocumentType('Recurso de reposición', CON_REMISION);

if (!resuelta) {
  falla('«Recurso de reposición» no resuelve desde FAMILIA, así que el motor redactaría sin ficha.');
} else if (!resuelta.porRemision) {
  falla(
    'Resolvió desde FAMILIA pero devolvió la ficha desnuda de CIVIL: el motor recibiría el plazo civil como si fuera el de familia.'
  );
} else if (resuelta.term.status !== 'NO_VERIFICADO') {
  falla('La ficha resuelta desde FAMILIA afirma un plazo.');
} else {
  ok('El nombre resuelve desde FAMILIA con el sobre puesto.');
}

/*
 * Y SIN RAMA SIGUE SIN RESOLVER. Es la colisión que `catalog.check.ts` ya
 * vigila —tres días ante el juez civil, diez ante la administración— y prestar
 * fichas no puede haberla reabierto.
 */
if (catalogService.findByDocumentType('Recurso de reposición') !== null) {
  falla('«Recurso de reposición» sin rama volvió a resolver. Debe negarse.');
} else {
  ok('Sin rama, la reposición sigue sin resolverse.');
}

/* ─── 5. LO QUE SE PRESTA ESTÁ ACOTADO Y EXISTE ────────────────────────── */

for (const id of ACTUACIONES_QUE_SE_PRESTAN) {
  if (!catalogService.getById(id)) {
    falla(`La lista de lo que se presta nombra «${id}», que no existe en el catálogo.`);
  }
}

const demandaEnFamilia = familia.find(
  (a) => a.porRemision && a.exactName.toLowerCase().includes('pertenencia')
);

if (demandaEnFamilia) {
  falla('Se está prestando una demanda civil a familia. Solo se prestan recursos y trámites comunes.');
} else {
  ok(`Lo prestado está acotado a ${ACTUACIONES_QUE_SE_PRESTAN.length} fichas genéricas.`);
}

/* ─── 6. LA CURADURÍA SE CLAVA A LA RAMA, NO SOLO AL ID ────────────────── */

const curaduriaDeFamilia: CatalogVerification = {
  actuacionId: 'civil/recurso-de-reposicion',
  rama: 'FAMILIA',
  term: { status: 'VERIFICADO', description: 'Tres (3) días, comprobados para familia por la firma.' },
  legalBasis: null,
  sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=48425',
  note: null,
  verifiedBy: 'Dra. Ana Ruiz',
  verifiedAt: '2026-09-09T00:00:00.000Z'
};

const familiaCurada = applyVerifications(familia, [curaduriaDeFamilia]);
const civilTrasCurarFamilia = applyVerifications(civil, [curaduriaDeFamilia]);

const reposicionFamiliaCurada = familiaCurada.find(
  (a) => a.id === 'civil/recurso-de-reposicion' && a.porRemision
);
const reposicionCivilIntacta = civilTrasCurarFamilia.find(
  (a) => a.id === 'civil/recurso-de-reposicion'
);

if (!reposicionFamiliaCurada || reposicionFamiliaCurada.term.status !== 'VERIFICADO') {
  falla('Verificar para FAMILIA no se aplicó a la ficha prestada de FAMILIA.');
} else {
  ok('Verificar para FAMILIA sí mueve la ficha de FAMILIA.');
}

/*
 * LA GUARDA QUE PIDIÓ LA CLAVE COMPUESTA. Con la clave vieja —solo el id— esta
 * línea fallaría: el término escrito para familia habría reemplazado el del
 * proceso civil, que está verificado y es otro.
 */
if (reposicionCivilIntacta?.verification) {
  falla('Verificar en FAMILIA alteró la ficha de CIVIL. La clave tiene que ser rama + id.');
} else {
  ok('Verificar en FAMILIA no toca CIVIL.');
}

// Y al revés: la curaduría de la rama propia no se cuela en la prestada.
const curaduriaCivil: CatalogVerification = { ...curaduriaDeFamilia, rama: null };
const familiaConCuraduriaCivil = applyVerifications(familia, [curaduriaCivil]);

if (familiaConCuraduriaCivil.find((a) => a.porRemision)?.verification) {
  falla('La curaduría de CIVIL se aplicó a la ficha prestada de FAMILIA.');
} else {
  ok('La curaduría de CIVIL no se cuela en FAMILIA.');
}

/*
 * Y CUANDO LA FIRMA SÍ VERIFICA PARA SU RAMA, la coletilla que dice «no afirme
 * que este plazo es el de esta rama» tiene que desaparecer: dejarla puesta le
 * entregaría al motor un término verificado y la orden de no afirmarlo.
 */
if (reposicion?.porRemision) {
  const curada = applyVerification(reposicion, curaduriaDeFamilia);
  if (curada.legalBasis.includes('No afirme')) {
    falla('El fundamento sigue prohibiendo afirmar un plazo que la firma ya verificó para la rama.');
  } else if (!curada.legalBasis.includes('por remisión')) {
    falla('El fundamento curado dejó de decir que la ficha llega por remisión.');
  } else {
    ok('Al curarla, el fundamento deja de prohibir y sigue diciendo de dónde viene.');
  }
}

/* ─── 7. LA VALIDACIÓN NO ADMITE UNA RAMA INVENTADA ────────────────────── */

const ramas = catalogService.listBranches();

const conRamaMala = validateVerificationInput(
  {
    actuacionId: 'civil/recurso-de-reposicion',
    rama: 'CONTENCIOSO',
    termStatus: 'NO_VERIFICADO',
    verifiedBy: 'Dra. Ana Ruiz'
  },
  'civil/recurso-de-reposicion',
  ramas
);

if (conRamaMala.ok) {
  falla('La validación admitió una rama que no existe: la curaduría no aparecería en ninguna pantalla.');
} else {
  ok('Una rama inventada se rechaza.');
}

const sinRama = validateVerificationInput(
  {
    actuacionId: 'civil/recurso-de-reposicion',
    termStatus: 'NO_VERIFICADO',
    verifiedBy: 'Dra. Ana Ruiz'
  },
  'civil/recurso-de-reposicion',
  ramas
);

if (!sinRama.ok || sinRama.value.rama !== null) {
  falla('Sin rama, la curaduría debe quedar clavada a la rama propia de la ficha (null).');
} else {
  ok('Sin rama, la curaduría es la de la rama propia.');
}

/* ─── 8. NINGUNA REMISIÓN SIN SU CITA ──────────────────────────────────── */

for (const [rama, remision] of Object.entries(REMISIONES)) {
  if (!remision) continue;
  if (remision.citas.length === 0) {
    falla(`La remisión de ${rama} no trae cita verbatim. Sin cita no se declara.`);
  }
  if (!remision.fuente.startsWith('https://')) {
    falla(`La remisión de ${rama} no trae fuente oficial.`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(remision.consultadoEl)) {
    falla(`La remisión de ${rama} no dice cuándo se consultó.`);
  }
}

for (const [rama, exclusion] of Object.entries(RAMAS_QUE_NO_REMITEN)) {
  if (!exclusion) continue;
  if (exclusion.citas.length === 0) {
    falla(`La exclusión de ${rama} no trae cita. Una exclusión sin cita es indistinguible de un olvido.`);
  }
}

/* ─── 9. LA MEDICIÓN QUE ORIGINÓ TODO ESTO ─────────────────────────────── */

const alcanzanLaReposicion = (Object.keys(REMISIONES) as LegalBranch[]).filter((rama) =>
  catalogService.list(rama).some((a: Actuacion) => a.exactName === 'Recurso de reposición')
);

if (alcanzanLaReposicion.length !== Object.keys(REMISIONES).length) {
  falla(
    `Hay ramas declaradas con remisión que no alcanzan la reposición: ${(Object.keys(REMISIONES) as LegalBranch[])
      .filter((r) => !alcanzanLaReposicion.includes(r))
      .join(', ')}.`
  );
} else {
  ok(`Las ${alcanzanLaReposicion.length} ramas con remisión alcanzan la reposición.`);
}

console.log('');
if (fallos > 0) {
  console.log(`${fallos} guarda(s) rota(s).`);
  process.exitCode = 1;
} else {
  console.log('ALL CHECKS PASSED');
}
