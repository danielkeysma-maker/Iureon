/**
 * El estilo de la firma de punta a punta, con dobles: el bloque del prompt y su
 * precedencia, el permiso del socio, el cobro con devolución, la auditoría, el
 * filtro por firma en cada consulta y que el texto del escrito no se guarde.
 *
 * Run with: npm run check:estilo-prompt
 *
 * Nada aquí sale a la red, toca la base ni llama a un modelo: el motor, el
 * cobro, la auditoría y la tabla son dobles que anotan lo que se les pidió.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildClaudeDraftPrompt } from '../../agent/claudeDraft.prompt';
import { MAX_CARACTERES_DEL_BLOQUE, PRECEDENCIA_DEL_ESTILO, renderBloqueDelEstilo } from '../bloqueDelEstilo';
import { consolidarEstilo } from '../consolidarEstilo';
import { alcanceParaRedactar, crearCasosDeEstilo, type DependenciasDelEstilo, type UsuarioDelEstilo } from '../estilo.casos';
import { ErrorDeEstilo, type ContenidoDeLeccion, type LeccionGuardada } from '../types';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' - ' + d : ''}`);
  if (!ok) fallos += 1;
};

const SRC = join(__dirname, '..', '..', '..');
const leer = (ruta: string): string => readFileSync(join(SRC, ruta), 'utf8');

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

const leccion = (parcial: Partial<ContenidoDeLeccion>, rama: string | null = 'LABORAL', fecha = '2026-09-10T10:00:00Z'): LeccionGuardada => ({
  id: '00000000-0000-0000-0000-00000000000' + Math.floor(Math.random() * 9),
  rol: 'LITIGANTE',
  rama,
  fuente: 'BORRADOR',
  taughtBy: 'socia@firma.co',
  createdAt: fecha,
  contenido: { ...vacio(), ...parcial }
});

/* ─── Dobles ────────────────────────────────────────────────────────────── */

interface Llamadas {
  reservar: number;
  registrarUso: number;
  liquidar: number;
  devolver: number;
  insertar: Array<Record<string, unknown>>;
  retirar: number;
  auditoria: string[];
  alModelo: string[];
}

const dobles = (opciones: {
  respuestaDelModelo?: string | Error;
  enElAlcance?: number;
  lecciones?: LeccionGuardada[];
  generales?: LeccionGuardada[];
} = {}): { deps: DependenciasDelEstilo; llamadas: Llamadas } => {
  const llamadas: Llamadas = { reservar: 0, registrarUso: 0, liquidar: 0, devolver: 0, insertar: [], retirar: 0, auditoria: [], alModelo: [] };
  const deps: DependenciasDelEstilo = {
    store: {
      contar: async () => opciones.enElAlcance ?? 0,
      insertar: async (_firmId, fila) => {
        llamadas.insertar.push(fila as unknown as Record<string, unknown>);
        return { id: 'nueva', ...fila, createdAt: '2026-09-14T00:00:00Z' };
      },
      listar: async (_firmId, _rol, rama) => (rama ? opciones.lecciones ?? [] : opciones.generales ?? []),
      retirar: async () => {
        llamadas.retirar += 1;
        return leccion({ formulasDeCierre: ['Atentamente,'] });
      }
    },
    cobro: {
      reservar: async () => {
        llamadas.reservar += 1;
        return { reserved: 100 };
      },
      registrarUso: async () => {
        llamadas.registrarUso += 1;
      },
      liquidar: async () => {
        llamadas.liquidar += 1;
        return { charged: 100, balance: 9900 };
      },
      devolver: async () => {
        llamadas.devolver += 1;
      }
    },
    auditoria: {
      registrar: async ({ action }) => {
        llamadas.auditoria.push(action);
      }
    },
    leerConModelo: async (_sistema, usuario) => {
      llamadas.alModelo.push(usuario);
      const r = opciones.respuestaDelModelo ?? '';
      if (r instanceof Error) throw r;
      return { text: r, usage: null };
    },
    resolverAlcance: async (_firmId, input) => ({ rol: 'LITIGANTE', rama: typeof input.rama === 'string' ? input.rama : null }),
    nuevoId: () => 'op-1'
  };
  return { deps, llamadas };
};

const SOCIA: UsuarioDelEstilo = { firmId: 'firma-a', email: 'socia@firma.co', role: 'FIRM_ADMIN' };
const ABOGADO: UsuarioDelEstilo = { firmId: 'firma-a', email: 'abogado@firma.co', role: 'LAWYER' };

const ESCRITO = `Señor Juez Laboral del Circuito de Sincelejo
Referencia: proceso ordinario laboral de JUAN CARLOS PÉREZ GÓMEZ, identificado con cédula de ciudadanía No. 1.102.811.692, contra Constructora Andina S.A.S.
Radicado: 11001-31-05-001-2024-00123-00

Con todo respeto, me permito presentar demanda ordinaria laboral.

I. HECHOS
PRIMERO. El demandante laboró desde el 15 de marzo de 2020, devengando $ 2.500.000 mensuales.

Del señor Juez,
[firma]`;

const RESPUESTA_BUENA = JSON.stringify({
  titulosDeSeccion: [{ titulo: 'HECHOS', numeracion: 'ROMANOS' }],
  numeracionHechos: 'ORDINALES',
  ordenDeSecciones: ['HECHOS', 'PRETENSIONES'],
  encabezado: 'Señor [DESPACHO]',
  formulasDeApertura: ['Con todo respeto, me permito', 'dentro de los diez (10) días siguientes'],
  formulasDeCierre: ['Del señor Juez,'],
  bloqueDeFirma: ['[NOMBRE DEL APODERADO]'],
  tratamiento: { formula: 'su señoría', persona: 'PRIMERA_SINGULAR' },
  glosario: []
});

const rechaza = async (nombre: string, trabajo: () => Promise<unknown>, status: number): Promise<ErrorDeEstilo | null> => {
  try {
    await trabajo();
    check(nombre, false, 'no rechazó');
    return null;
  } catch (err) {
    const ok = err instanceof ErrorDeEstilo && err.status === status;
    check(nombre, ok, err instanceof Error ? err.message : String(err));
    return err instanceof ErrorDeEstilo ? err : null;
  }
};

const main = async (): Promise<void> => {
  /* ─── 1. El bloque en el prompt ──────────────────────────────────────── */
  const perfil = consolidarEstilo([
    leccion({ formulasDeApertura: ['Con todo respeto, me permito'], formulasDeCierre: ['Del señor Juez,'], encabezado: 'Señor [DESPACHO]' })
  ]);
  const bloque = renderBloqueDelEstilo(perfil, { rol: 'LITIGANTE', rama: 'LABORAL' }) ?? '';
  const base = { documentType: 'Demanda ordinaria laboral', prompt: 'hechos', citations: [], customFormat: 'Numere los hechos en ordinales.' };
  const conEstilo = buildClaudeDraftPrompt({ ...base, estiloDeLaFirma: bloque });
  const sinEstilo = buildClaudeDraftPrompt(base);

  check(
    'la frase de precedencia es la que fijó el dueño',
    PRECEDENCIA_DEL_ESTILO.startsWith('ESTILO ENSEÑADO POR LA FIRMA — gobierna solo la REDACCIÓN') &&
      PRECEDENCIA_DEL_ESTILO.includes('No aporta hechos, normas, plazos, pretensiones ni jurisprudencia.') &&
      PRECEDENCIA_DEL_ESTILO.includes('Si choca con la estructura obligatoria, la regla de citación o el formato de la firma, ganan esos.') &&
      PRECEDENCIA_DEL_ESTILO.includes('Los marcadores entre corchetes se llenan con los datos del caso o se dejan entre corchetes.')
  );
  check('el bloque abre con la frase de precedencia', bloque.startsWith(PRECEDENCIA_DEL_ESTILO));
  const finFormato = conEstilo.indexOf('Numere los hechos en ordinales.') + 'Numere los hechos en ordinales.'.length;
  const inicioEstilo = conEstilo.indexOf(PRECEDENCIA_DEL_ESTILO);
  check(
    'el bloque va justo después del FORMATO DE LA FIRMA, sin nada en medio',
    conEstilo.indexOf('FORMATO DE LA FIRMA') < inicioEstilo && inicioEstilo > finFormato && conEstilo.slice(finFormato, inicioEstilo).trim() === ''
  );
  check('y después de la estructura obligatoria', conEstilo.indexOf('— obligatoria.') < inicioEstilo);
  const sinFormato = buildClaudeDraftPrompt({ ...base, customFormat: undefined, estiloDeLaFirma: bloque });
  check('sin Membrete, el bloque sigue a la estructura obligatoria', sinFormato.indexOf('— obligatoria.') < sinFormato.indexOf(PRECEDENCIA_DEL_ESTILO));
  check('sin estilo, el prompt no nombra ningún estilo enseñado', !sinEstilo.includes('ESTILO ENSEÑADO'));
  check('el bloque dice «visto en N escritos»', bloque.includes('(visto en 1 escrito)'));

  /* ─── 2. El interruptor y el alcance al redactar ─────────────────────── */
  const ramas = ['LABORAL', 'CIVIL'];
  check('interruptor apagado: no hay alcance', alcanceParaRedactar({ usarEstilo: false, rolDeLaFicha: 'LITIGANTE', ramaDeLaFicha: 'LABORAL', ramasValidas: ramas }) === null);
  const deLaFicha = alcanceParaRedactar({ usarEstilo: true, rolDeLaFicha: 'DESPACHO', ramaDeLaFicha: 'CIVIL', rolDelTaller: 'LITIGANTE', legalBranch: 'LABORAL', ramasValidas: ramas });
  check('con ficha, mandan el rol y la rama de la ficha', deLaFicha?.rol === 'DESPACHO' && deLaFicha.rama === 'CIVIL');
  const delTaller = alcanceParaRedactar({ usarEstilo: true, rolDeLaFicha: null, ramaDeLaFicha: null, rolDelTaller: 'SECRETARIA', legalBranch: 'LABORAL', ramasValidas: ramas });
  check('sin ficha, el rol del taller y la rama del escrito', delTaller?.rol === 'SECRETARIA' && delTaller.rama === 'LABORAL');
  check('un rol inventado no aplica estilo', alcanceParaRedactar({ usarEstilo: true, rolDeLaFicha: null, ramaDeLaFicha: null, rolDelTaller: 'JUEZ', ramasValidas: ramas }) === null);

  const sinLecciones = dobles();
  check('sin lecciones no hay bloque', (await crearCasosDeEstilo(sinLecciones.deps).paraRedactar({ firmId: 'firma-a', rol: 'LITIGANTE', rama: 'LABORAL' })) === null);

  const conGeneral = dobles({ generales: [leccion({ formulasDeCierre: ['Atentamente,'] }, null)] });
  const general = await crearCasosDeEstilo(conGeneral.deps).paraRedactar({ firmId: 'firma-a', rol: 'LITIGANTE', rama: 'FAMILIA' });
  check('la rama sin lecciones cae al general del rol y lo dice', general?.aplicado.rama === null && Boolean(general?.bloque.includes('estilo general del rol')));

  /* Una fila envenenada: escrita a mano en la base, se salta la guarda de enseñar. */
  const envenenada = dobles({
    lecciones: [
      leccion({
        formulasDeCierre: ['Atentamente,', 'dentro de los tres (3) días siguientes a la notificación'],
        encabezado: 'Señor Juez, conforme al art. 318 del CGP',
        glosario: [{ preferido: 'Carlos Mendoza Ruiz', variantes: [], ejemplo: '' }],
        bloqueDeFirma: ['C.C. 1.102.811.692']
      })
    ]
  });
  const veneno = await crearCasosDeEstilo(envenenada.deps).paraRedactar({ firmId: 'firma-a', rol: 'LITIGANTE', rama: 'LABORAL' });
  check(
    'una fila envenenada pierde lo jurídico al renderizar y conserva la forma',
    Boolean(veneno?.bloque.includes('Atentamente,')) &&
      !veneno?.bloque.includes('tres (3) días') &&
      !veneno?.bloque.includes('318') &&
      !veneno?.bloque.includes('Mendoza') &&
      !veneno?.bloque.includes('811'),
    veneno?.bloque ? '' : 'sin bloque'
  );

  /* El tope del bloque. */
  const enorme = consolidarEstilo(
    Array.from({ length: 30 }, (_, i) =>
      leccion(
        {
          formulasDeApertura: Array.from({ length: 8 }, (_, j) => `Con el mayor respeto y consideración me permito exponer ante su Despacho, fórmula ${'x'.repeat(i + j)}`),
          formulasDeCierre: Array.from({ length: 8 }, (_, j) => `Agradezco de antemano la atención prestada a la presente, fórmula ${'y'.repeat(i + j)}`),
          glosario: Array.from({ length: 20 }, (_, j) => ({ preferido: `vocablo ${i}-${j}`, variantes: ['uno', 'otro'], ejemplo: 'un ejemplo sin datos' }))
        },
        'LABORAL',
        `2026-09-${String((i % 28) + 1).padStart(2, '0')}T10:00:00Z`
      )
    )
  );
  const bloqueEnorme = renderBloqueDelEstilo(enorme, { rol: 'LITIGANTE', rama: 'LABORAL' }) ?? '';
  check(`el bloque no pasa de ${MAX_CARACTERES_DEL_BLOQUE} caracteres`, bloqueEnorme.length > 0 && bloqueEnorme.length <= MAX_CARACTERES_DEL_BLOQUE, String(bloqueEnorme.length));

  /* ─── 3. Solo el socio enseña y retira ───────────────────────────────── */
  const permiso = dobles({ respuestaDelModelo: RESPUESTA_BUENA });
  const casosPermiso = crearCasosDeEstilo(permiso.deps);
  await rechaza('un abogado no puede leer el formato (403)', () => casosPermiso.leerFormato({ usuario: ABOGADO, texto: ESCRITO, rol: 'LITIGANTE', rama: 'LABORAL' }), 403);
  await rechaza('un abogado no puede guardar (403)', () => casosPermiso.guardarLeccion({ usuario: ABOGADO, contenido: JSON.parse(RESPUESTA_BUENA), rol: 'LITIGANTE', rama: 'LABORAL' }), 403);
  await rechaza('un abogado no puede retirar (403)', () => casosPermiso.retirarLeccion({ usuario: ABOGADO, id: '11111111-1111-1111-1111-111111111111' }), 403);
  check('y ninguno de los tres cobró, guardó ni retiró', permiso.llamadas.reservar === 0 && permiso.llamadas.insertar.length === 0 && permiso.llamadas.retirar === 0);
  const perfilAbogado = await casosPermiso.perfil({ usuario: ABOGADO, rol: 'LITIGANTE', rama: 'LABORAL' });
  check('pero sí puede leer el perfil, que le dice que no enseña', perfilAbogado.puedeEnsenar === false);
  const operador = await casosPermiso.retirarLeccion({ usuario: { ...SOCIA, role: 'SUPER_ADMIN' }, id: '11111111-1111-1111-1111-111111111111' });
  check('el operador de la plataforma sí puede, como en el resto del producto', operador.id.length === 36);

  /* ─── 4. Leer el formato: saneado antes, cobro con devolución ─────────── */
  const bien = dobles({ respuestaDelModelo: RESPUESTA_BUENA });
  const lectura = await crearCasosDeEstilo(bien.deps).leerFormato({
    usuario: SOCIA,
    texto: ESCRITO,
    rol: 'LITIGANTE',
    rama: 'LABORAL',
    documentType: 'Demanda ordinaria laboral'
  });
  const alModelo = bien.llamadas.alModelo.join('\n');
  check(
    'al motor no llega la cédula, el radicado, el valor, la fecha ni el nombre',
    !alModelo.includes('811') && !alModelo.includes('00123') && !alModelo.includes('2.500.000') && !alModelo.includes('marzo') && !alModelo.includes('PÉREZ') && !alModelo.includes('Andina'),
    alModelo
  );
  check('cobra: reserva, registra el uso y liquida; no devuelve', bien.llamadas.reservar === 1 && bien.llamadas.registrarUso === 1 && bien.llamadas.liquidar === 1 && bien.llamadas.devolver === 0);
  check('la vista previa trae lo que se conservó y lo descartado con su motivo', lectura.contenido.formulasDeApertura.length === 1 && lectura.descartados.some((d) => d.motivo === 'menciona un plazo'));
  check('leer NO guarda nada', bien.llamadas.insertar.length === 0 && bien.llamadas.auditoria.length === 0);

  const mudo = dobles({ respuestaDelModelo: '' });
  const errMudo = await rechaza('motor mudo: 502', () => crearCasosDeEstilo(mudo.deps).leerFormato({ usuario: SOCIA, texto: ESCRITO, rol: 'LITIGANTE', rama: 'LABORAL' }), 502);
  check('y devuelve la reserva y lo dice', mudo.llamadas.devolver === 1 && mudo.llamadas.liquidar === 0 && Boolean(errMudo?.message.includes('No se descontó saldo')));

  const caido = dobles({ respuestaDelModelo: new Error('timeout') });
  await rechaza('motor caído: 502', () => crearCasosDeEstilo(caido.deps).leerFormato({ usuario: SOCIA, texto: ESCRITO, rol: 'LITIGANTE', rama: 'LABORAL' }), 502);
  check('y también devuelve', caido.llamadas.devolver === 1);

  const todoJuridico = dobles({ respuestaDelModelo: JSON.stringify({ formulasDeApertura: ['conforme al art. 25 del CPT'] }) });
  const errVacio = await rechaza('si no queda forma que guardar: 422', () => crearCasosDeEstilo(todoJuridico.deps).leerFormato({ usuario: SOCIA, texto: ESCRITO, rol: 'LITIGANTE', rama: 'LABORAL' }), 422);
  check('devuelve y entrega lo descartado', todoJuridico.llamadas.devolver === 1 && (errVacio?.descartados?.length ?? 0) === 1);

  const lleno = dobles({ respuestaDelModelo: RESPUESTA_BUENA, enElAlcance: 30 });
  await rechaza('con 30 lecciones, leer se niega (409) antes de cobrar', () => crearCasosDeEstilo(lleno.deps).leerFormato({ usuario: SOCIA, texto: ESCRITO, rol: 'LITIGANTE', rama: 'LABORAL' }), 409);
  check('sin reservar', lleno.llamadas.reservar === 0);
  await rechaza('y guardar la 31.ª también (409)', () => crearCasosDeEstilo(lleno.deps).guardarLeccion({ usuario: SOCIA, contenido: JSON.parse(RESPUESTA_BUENA), rol: 'LITIGANTE', rama: 'LABORAL' }), 409);
  check('sin insertar', lleno.llamadas.insertar.length === 0);

  /* ─── 5. Guardar: se re-sanea, se audita y no lleva el texto ─────────── */
  const guardar = dobles();
  const casosGuardar = crearCasosDeEstilo(guardar.deps);
  const guardada = await casosGuardar.guardarLeccion({
    usuario: SOCIA,
    rol: 'LITIGANTE',
    rama: 'LABORAL',
    fuente: 'BORRADOR',
    contenido: {
      ...JSON.parse(RESPUESTA_BUENA),
      encabezado: 'Señor Juez, proceso de Juan Pérez, identificado con C.C. 1.102.811.692',
      texto: ESCRITO,
      hechos: 'El demandante laboró desde 2020'
    }
  });
  const fila = guardar.llamadas.insertar[0] ?? {};
  check('la fila solo lleva rol, rama, fuente, contenido y quién enseñó', Object.keys(fila).sort().join(',') === 'contenido,fuente,rama,rol,taughtBy', Object.keys(fila).join(','));
  const guardado = JSON.stringify(fila.contenido);
  check('el contenido guardado no trae el texto del escrito ni sus datos', !guardado.includes('laboró') && !guardado.includes('811') && !guardado.includes('dentro de los diez'), guardado);
  check('guardar audita ESTILO_ENSENADO', guardar.llamadas.auditoria.join() === 'ESTILO_ENSENADO');
  check('y devuelve lo descartado al re-sanear', guardada.descartados.some((d) => d.motivo === 'menciona un plazo'));
  await casosGuardar.retirarLeccion({ usuario: SOCIA, id: '11111111-1111-1111-1111-111111111111' });
  check('retirar audita ESTILO_RETIRADO', guardar.llamadas.auditoria.join() === 'ESTILO_ENSENADO,ESTILO_RETIRADO');

  /* ─── 6. Lectura del código: firma en cada consulta, texto que no viaja ─ */
  const store = leer('modules/estilo/estilo.store.ts');
  const consultasSinFirma = (fuente: string): string[] =>
    fuente
      .split('.from(TABLA)')
      .slice(1)
      .map((trozo) => trozo.slice(0, trozo.indexOf(';')))
      .filter((consulta) => !consulta.includes(".eq('firm_id', firmId)") && !consulta.includes('firm_id: firmId'));
  const consultas = store.split('.from(TABLA)').length - 1;
  check('el store consulta la tabla por un solo nombre', consultas >= 4 && !store.includes(".from('estilo_lecciones')"), String(consultas));
  check('toda consulta del store filtra por firma', consultasSinFirma(store).length === 0, consultasSinFirma(store).join(' | '));
  check('muerde: una consulta sin firma se detecta', consultasSinFirma("db().from(TABLA).select('*').eq('rol', rol);").length === 1);
  check('el store no escribe ninguna columna de texto del escrito', !/texto|legal_text|escrito:/i.test(store.slice(store.indexOf('.insert('), store.indexOf('.insert(') + 200)));

  const controlador = leer('modules/agent/agent.controller.ts');
  check('la redacción recibe del navegador solo el interruptor y el rol del taller', controlador.includes('usarEstilo: usarEstilo === true') && !/estiloDeLaFirma/.test(controlador));
  const pipeline = leer('modules/agent/openrouter.service.ts');
  check('el pipeline pasa el bloque al prompt de la redacción', pipeline.includes('estiloDeLaFirma: req.estiloDeLaFirma') && pipeline.includes('estiloParaRedactar('));
  check('y el estilo aplicado viaja en la procedencia', pipeline.includes('estiloAplicado: estilo?.aplicado ?? null'));
  const casos = leer('modules/estilo/estilo.casos.ts');
  check('solo FIRM_ADMIN y SUPER_ADMIN enseñan', casos.includes("role === 'FIRM_ADMIN' || role === 'SUPER_ADMIN'"));
  const rutas = leer('modules/estilo/estilo.routes.ts');
  check(
    'las cuatro rutas existen',
    ["router.get('/estilo'", "router.post('/estilo/leer'", "router.post('/estilo/lecciones'", "router.delete('/estilo/lecciones/:id'"].every((r) => rutas.includes(r))
  );
  const indice = leer('index.ts');
  check('se montan después de la sesión', indice.indexOf("app.use('/api', authMiddleware)") < indice.indexOf("app.use('/api', estiloRoutes)"));

  console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
  process.exitCode = fallos === 0 ? 0 : 1;
};

void main();
