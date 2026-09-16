/**
 * Guarda que borrar una firma borre TODO lo que es de la firma.
 *
 * Se corre con: npm run check:borrado-firma-completo
 *
 * Sin base de datos y sin red: lee `supabase/schema.sql` y cada
 * `supabase/migration-*.sql` como texto, arma el inventario de las tablas que
 * pertenecen a una firma y lo compara con la definición VIGENTE de
 * `borrar_firma_completa`.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * EL DEFECTO QUE ESTE ARCHIVO EXISTE PARA IMPEDIR (14 de septiembre de 2026).
 * `borrar_firma_completa` enumera las tablas A MANO. Cada módulo nuevo creó su
 * tabla y nadie la añadió a la función: una firma que pedía la supresión de
 * sus datos se iba dejando en la base sus expedientes, los actores de cada
 * expediente, sus carpetas, su agenda de términos con los avisos y las
 * actuaciones propias de su catálogo. `borrar_expedientes_de_la_firma` se
 * escribió para eso y nadie la llamaba. El check de expedientes miraba que esa
 * función EXISTIERA, no que se USARA, y pasaba en verde.
 *
 * Y había un segundo defecto, peor, en la dirección contraria: la función
 * BORRABA `audit_logs`, y `migration-auditoria-inmutable.sql` pone sobre esa
 * tabla un disparador que rechaza todo DELETE. Con los dos archivos corridos,
 * la función entera aborta en ese paso y la firma no se puede borrar.
 *
 * Por eso aquí no se lista qué tablas deben borrarse: se DEDUCEN del esquema.
 * Una tabla nueva con `firm_id` —o colgada por llave foránea de una que lo
 * tiene— rompe este check hasta que entre en la función o en la lista de
 * excluidas, con su razón escrita.
 * ══════════════════════════════════════════════════════════════════════════
 */
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import {
  auditarBorrado,
  borradosEnOrden,
  cuerpoDeLaFuncion,
  llavesForaneas,
  tablasDeLaFirma,
  tablasReportadas
} from '../inventarioDeBorrado';
import type { Excluida } from '../inventarioDeBorrado';
import { barrerArchivosDeLaFirma } from '../barridoDeArchivos';

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
  if (!ok) fallos++;
};

/*
 * LAS VERSIONES DE LA FUNCIÓN, EN EL ORDEN EN QUE SE CORRIERON. La última es
 * la vigente. El orden no se puede deducir del nombre de archivo, así que se
 * declara; y el check exige que coincida con los archivos que de verdad la
 * definen, para que una cuarta versión no pase inadvertida detrás de la
 * tercera.
 */
const VERSIONES = [
  'migration-borrar-firma.sql',
  'migration-borrar-firma-estilo.sql',
  'migration-borrar-firma-completa-v3.sql',
  'migration-borrar-firma-completa-v4.sql'
];

/*
 * LO QUE A PROPÓSITO NO SE BORRA. Cada entrada lleva su razón y su evidencia:
 * si la evidencia desaparece del repositorio, la exclusión deja de valer y el
 * check lo dice.
 */
const EXCLUIDAS: Excluida[] = [
  {
    tabla: 'audit_logs',
    razon:
      'Inalterable por disparador (migration-auditoria-inmutable.sql): un DELETE aborta la función entera y la firma no se podría borrar.',
    evidencia: { archivo: 'migration-auditoria-inmutable.sql', patron: /BEFORE UPDATE OR DELETE ON public\.audit_logs/ }
  },
  {
    tabla: 'trial_signups',
    razon: 'Sostiene «una prueba gratuita por dirección»; se creó sin llave foránea para sobrevivir al borrado.',
    evidencia: { archivo: 'migration-borrar-firma.sql', patron: /`trial_signups`: la regla/ }
  }
];

/* ─── 1. LA LÓGICA PURA, CONTRA ESQUEMAS DE JUGUETE ──────────────────────── */

const ESQUEMA = `
CREATE TABLE IF NOT EXISTS public.firms (firm_id TEXT PRIMARY KEY);
-- CREATE TABLE public.comentada (firm_id TEXT);
CREATE TABLE IF NOT EXISTS public.casos (
    id UUID PRIMARY KEY,
    firm_id TEXT NOT NULL,
    nota TEXT CHECK (btrim(nota) <> '')
);
CREATE TABLE IF NOT EXISTS public.hijos (
    id UUID PRIMARY KEY,
    caso_id UUID NOT NULL REFERENCES public.casos(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS public.nietos (
    hijo_id UUID NOT NULL REFERENCES public.hijos(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS public.corpus (id UUID PRIMARY KEY, texto TEXT);
CREATE TABLE IF NOT EXISTS public.bitacora (firm_id TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS public.retirada (firm_id TEXT NOT NULL);
DROP TABLE IF EXISTS public.retirada;
ALTER TABLE public.casos
    ADD COLUMN IF NOT EXISTS corpus_id UUID
    REFERENCES public.corpus(id) ON DELETE SET NULL;
`;

const inventario = tablasDeLaFirma([ESQUEMA]);
check('una tabla con firm_id es de la firma', inventario.has('casos') && inventario.has('firms'));
check('una hija sin firm_id, colgada de una tabla de la firma, también', inventario.has('hijos'));
check('y la nieta, por transitividad', inventario.has('nietos'));
check('una tabla sin firm_id ni padre de la firma no lo es', !inventario.has('corpus'));
check('una tabla comentada no cuenta', !inventario.has('comentada'));
check('una tabla retirada con DROP TABLE no cuenta', !inventario.has('retirada'));

const llaves = llavesForaneas([ESQUEMA]);
check(
  'las llaves se leen del CREATE TABLE y del ALTER TABLE',
  llaves.some((l) => l.hija === 'hijos' && l.padre === 'casos') &&
    llaves.some((l) => l.hija === 'casos' && l.padre === 'corpus')
);

const funcion = (cuerpo: string): string => `
CREATE OR REPLACE FUNCTION public.borrar_firma_completa(p_firm_id TEXT)
RETURNS TABLE(tabla TEXT, filas BIGINT)
LANGUAGE plpgsql
AS $$
BEGIN
${cuerpo}
END;
$$;`;

const paso = (t: string): string =>
  `DELETE FROM public.${t} WHERE firm_id = p_firm_id;\n    tabla := '${t}'; filas := 1; RETURN NEXT;`;

const EXCLUIDA_DE_JUGUETE: Excluida[] = [
  { tabla: 'bitacora', razon: 'prueba', evidencia: { archivo: 'x', patron: /x/ } }
];

const auditar = (sql: string) => {
  const cuerpo = cuerpoDeLaFuncion(sql, 'borrar_firma_completa');
  return auditarBorrado({
    inventario,
    llaves,
    borrados: borradosEnOrden(cuerpo ?? ''),
    reportadas: tablasReportadas(cuerpo ?? ''),
    excluidas: EXCLUIDA_DE_JUGUETE
  });
};

const completa = funcion([paso('nietos'), paso('hijos'), paso('casos'), paso('firms')].join('\n'));
check('la función completa y ordenada no tiene faltas', auditar(completa).length === 0, auditar(completa).join(' | '));

const sinHijos = funcion([paso('nietos'), paso('casos'), paso('firms')].join('\n'));
check('una tabla olvidada se nombra', auditar(sinHijos).some((f) => f.includes('hijos')), auditar(sinHijos).join(' | '));

const alReves = funcion([paso('casos'), paso('hijos'), paso('nietos'), paso('firms')].join('\n'));
check(
  'un padre borrado antes que su hija se señala',
  auditar(alReves).some((f) => f.includes('hijos') && f.includes('casos') && /antes/.test(f)),
  auditar(alReves).join(' | ')
);

const firmaNoAlFinal = funcion([paso('firms'), paso('nietos'), paso('hijos'), paso('casos')].join('\n'));
check('la ficha de la firma tiene que ir de última', auditar(firmaNoAlFinal).some((f) => f.includes('firms')));

const borraExcluida = funcion([paso('nietos'), paso('hijos'), paso('casos'), paso('bitacora'), paso('firms')].join('\n'));
check('borrar una tabla excluida es una falta', auditar(borraExcluida).some((f) => f.includes('bitacora')));

const inventada = funcion([paso('nietos'), paso('hijos'), paso('casos'), paso('fantasma'), paso('firms')].join('\n'));
check('borrar una tabla que no existe es una falta', auditar(inventada).some((f) => f.includes('fantasma')));

const malReportada = funcion(
  [paso('nietos'), paso('hijos'), 'DELETE FROM public.casos WHERE firm_id = p_firm_id;\n    tabla := \'hijos\'; RETURN NEXT;', paso('firms')].join('\n')
);
check(
  'lo que la función reporta tiene que ser lo que borró',
  auditar(malReportada).some((f) => /reporta/.test(f)),
  auditar(malReportada).join(' | ')
);

const conGuarda = funcion(
  [
    paso('nietos'),
    `IF to_regclass('public.hijos') IS NOT NULL THEN
        EXECUTE 'DELETE FROM public.hijos WHERE caso_id IS NOT NULL';
        tabla := 'hijos'; RETURN NEXT;
    END IF;`,
    paso('casos'),
    paso('firms')
  ].join('\n')
);
check('un DELETE dinámico con to_regclass cuenta como borrado', auditar(conGuarda).length === 0, auditar(conGuarda).join(' | '));

const dinamicoSinGuarda = funcion(
  [paso('nietos'), `EXECUTE 'DELETE FROM public.hijos WHERE x'; tabla := 'hijos'; RETURN NEXT;`, paso('casos'), paso('firms')].join('\n')
);
check(
  'pero sin to_regclass es una falta: si la tabla falta, aborta la función entera',
  auditar(dinamicoSinGuarda).some((f) => f.includes('to_regclass')),
  auditar(dinamicoSinGuarda).join(' | ')
);

const excluidaFantasma = auditarBorrado({
  inventario,
  llaves,
  borrados: borradosEnOrden(cuerpoDeLaFuncion(completa, 'borrar_firma_completa') ?? ''),
  reportadas: tablasReportadas(cuerpoDeLaFuncion(completa, 'borrar_firma_completa') ?? ''),
  excluidas: [...EXCLUIDA_DE_JUGUETE, { tabla: 'ya_no_existe', razon: 'x', evidencia: { archivo: 'x', patron: /x/ } }]
});
check('una exclusión de una tabla que ya no existe se señala', excluidaFantasma.some((f) => f.includes('ya_no_existe')));

/* ─── 2. EL BARRIDO DE ARCHIVOS, CON UN ALMACÉN FALSO ────────────────────── */

/**
 * Un almacén que lista de a `pagina` claves en orden, como B2, y que no puede
 * borrar las que se le indiquen.
 */
const almacenFalso = (claves: string[], rotas: string[] = [], pagina = 3) => {
  const vivas = new Set(claves);
  return {
    listar: async () => [...vivas].sort().slice(0, pagina).map((fileKey) => ({ fileKey })),
    borrar: async (clave: string) => {
      if (rotas.includes(clave)) return false;
      vivas.delete(clave);
      return true;
    },
    vivas
  };
};

const correrBarridos = async (): Promise<void> => {
  const limpio = almacenFalso(['f/a', 'f/b', 'f/c', 'f/d', 'f/e', 'f/f', 'f/g']);
  const r1 = await barrerArchivosDeLaFirma(limpio, { tamanoDePagina: 3 });
  check('el barrido pagina hasta vaciar el prefijo', limpio.vivas.size === 0 && r1.borrados === 7, `${r1.borrados} borrados`);
  check('y sin fallas no deja advertencias', r1.advertencias.length === 0, r1.advertencias.join(' | '));

  const conUnaRota = almacenFalso(['f/a', 'f/b', 'f/c', 'f/d', 'f/e'], ['f/a']);
  const r2 = await barrerArchivosDeLaFirma(conUnaRota, { tamanoDePagina: 3 });
  check('un archivo que no se borra no detiene a los demás', conUnaRota.vivas.size === 1 && r2.borrados === 4);
  check(
    'y se advierte UNA vez, con su clave',
    r2.advertencias.filter((a) => a === 'Archivo en B2 no borrado: f/a').length === 1 && r2.advertencias.length === 1,
    r2.advertencias.join(' | ')
  );

  const tapada = almacenFalso(['f/a', 'f/b', 'f/c', 'f/d'], ['f/a', 'f/b', 'f/c']);
  const r3 = await barrerArchivosDeLaFirma(tapada, { tamanoDePagina: 3 });
  check(
    'una página entera de fallas tapa lo que hay detrás, y se dice',
    r3.advertencias.some((a) => /pueden quedar m[áa]s archivos/i.test(a)),
    r3.advertencias.join(' | ')
  );

  const infinita = {
    listar: async () => [{ fileKey: `f/${Math.random()}` }],
    borrar: async () => true
  };
  const r4 = await barrerArchivosDeLaFirma(infinita, { tamanoDePagina: 3, maxRondas: 4 });
  check(
    'agotar las rondas con archivos pendientes NO se calla',
    r4.advertencias.some((a) => /rondas/.test(a)),
    r4.advertencias.join(' | ')
  );

  const caida = {
    listar: async (): Promise<Array<{ fileKey: string }>> => {
      throw new Error('B2 no responde');
    },
    borrar: async () => true
  };
  const r5 = await barrerArchivosDeLaFirma(caida, { tamanoDePagina: 3 });
  check('un almacén que no lista se reporta con su motivo', r5.advertencias.some((a) => a.includes('B2 no responde')));

  const lanza = almacenFalso(['f/a', 'f/b']);
  const r6 = await barrerArchivosDeLaFirma(
    {
      listar: lanza.listar,
      borrar: async (clave: string) => {
        if (clave === 'f/a') throw new Error('red caída');
        return lanza.borrar(clave);
      }
    },
    { tamanoDePagina: 3 }
  );
  check(
    'un borrado que lanza cuenta como no borrado y dice por qué',
    r6.borrados === 1 && r6.advertencias.some((a) => a.includes('f/a') && a.includes('red caída')),
    r6.advertencias.join(' | ')
  );
};

/* ─── 3. EL REPOSITORIO DE VERDAD ────────────────────────────────────────── */

const SUPABASE = join(process.cwd(), '..', 'supabase');
const archivosSql = readdirSync(SUPABASE)
  .filter((n) => n === 'schema.sql' || /^migration-.*\.sql$/.test(n))
  .sort();
const sqlDe = (n: string): string => readFileSync(join(SUPABASE, n), 'utf8');
const todos = archivosSql.map(sqlDe);

const definen = archivosSql.filter((n) => /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.borrar_firma_completa\s*\(/i.test(sqlDe(n)));
check(
  'las versiones declaradas son exactamente los archivos que definen la función',
  definen.length === VERSIONES.length && VERSIONES.every((v) => definen.includes(v)),
  `definen: ${definen.join(', ')}`
);

const vigente = VERSIONES[VERSIONES.length - 1];
const cuerpo = cuerpoDeLaFuncion(sqlDe(vigente), 'borrar_firma_completa');
check('la versión vigente tiene cuerpo legible', Boolean(cuerpo), vigente);

const inventarioReal = tablasDeLaFirma(todos);
const borradosReales = borradosEnOrden(cuerpo ?? '');
const faltas = auditarBorrado({
  inventario: inventarioReal,
  llaves: llavesForaneas(todos),
  borrados: borradosReales,
  reportadas: tablasReportadas(cuerpo ?? ''),
  excluidas: EXCLUIDAS
});
check(
  `${vigente} borra todas las tablas de la firma, en orden`,
  faltas.length === 0,
  faltas.length ? faltas.join(' | ') : `${borradosReales.length} tablas; excluidas: ${EXCLUIDAS.map((e) => e.tabla).join(', ')}`
);

for (const e of EXCLUIDAS) {
  check(
    `la razón para no borrar ${e.tabla} sigue en el repositorio`,
    archivosSql.includes(e.evidencia.archivo) && e.evidencia.patron.test(sqlDe(e.evidencia.archivo)),
    e.razon
  );
}

const vigenteSql = sqlDe(vigente);
check(
  'la vigente conserva SECURITY DEFINER y el search_path fijo',
  /SECURITY DEFINER/.test(vigenteSql) && /SET search_path = public, pg_temp/.test(vigenteSql)
);
check(
  'y vuelve a quitar el permiso a todos menos a service_role',
  ['PUBLIC', 'anon', 'authenticated'].every((r) =>
    new RegExp(`REVOKE ALL ON FUNCTION public\\.borrar_firma_completa\\(TEXT\\) FROM ${r};`).test(vigenteSql)
  ) && /GRANT EXECUTE ON FUNCTION public\.borrar_firma_completa\(TEXT\) TO service_role;/.test(vigenteSql)
);
check('y sigue rechazando SYSTEM_CORPUS', /p_firm_id = 'SYSTEM_CORPUS'/.test(cuerpo ?? ''));

/*
 * La constancia nombra cada tabla en castellano. La plantilla cae al nombre
 * técnico cuando falta la traducción —y eso está bien como respaldo—, pero una
 * tabla nueva que llega así a la persona que pidió el borrado es un olvido.
 */
const RAIZ_SRC = join(process.cwd(), 'src');
const avisos = readFileSync(join(RAIZ_SRC, 'modules/mail/avisos.mail.ts'), 'utf8');
const bloqueDeNombres = avisos.match(/const NOMBRE_DE_TABLA[^{]*\{([\s\S]*?)\n\};/)?.[1] ?? '';
const nombradas = new Set([...bloqueDeNombres.matchAll(/^\s*(\w+):\s*'/gm)].map((m) => m[1]));
const sinNombre = [...new Set(borradosReales.map((b) => b.tabla))].filter((t) => !nombradas.has(t));
check('cada tabla que se borra tiene su nombre en la constancia', sinNombre.length === 0, sinNombre.join(', ') || `${nombradas.size} nombres`);
const nombresHuerfanos = [...nombradas].filter((t) => !borradosReales.some((b) => b.tabla === t));
check('y la constancia no nombra tablas que ya no se borran', nombresHuerfanos.length === 0, nombresHuerfanos.join(', '));

const servicio = readFileSync(join(RAIZ_SRC, 'modules/firms/borradoDeFirma.service.ts'), 'utf8');
check(
  'si falta la función, el servidor pide correr la versión vigente',
  servicio.includes(`supabase/${vigente}`),
  vigente
);
check(
  'y el barrido de B2 pasa por la pieza probada aquí',
  /barrerArchivosDeLaFirma\(/.test(servicio)
);

correrBarridos()
  .then(() => {
    console.log('');
    if (fallos === 0) {
      console.log('ALL CHECKS PASSED');
    } else {
      console.log(`${fallos} FALLA(S)`);
      process.exitCode = 1;
    }
  })
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
