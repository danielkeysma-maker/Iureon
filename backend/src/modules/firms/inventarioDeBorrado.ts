/**
 * El inventario de lo que es de una firma, leído del SQL del repositorio.
 *
 * PURO A PROPÓSITO: recibe texto y devuelve texto. No abre la base ni el
 * disco; quien lo llama (el check `borrado-firma-completo`) lee los archivos y
 * se los pasa. Así la regla —«todo lo que tiene `firm_id`, o cuelga de algo
 * que lo tiene, se borra con la firma»— se prueba contra esquemas de juguete
 * antes de aplicarse al esquema real.
 *
 * POR QUÉ SE LEE EL SQL Y NO `information_schema`. La base de producción es la
 * única base que existe, y un check que la consulte no puede gatear el CI (ver
 * `scripts/run-all-checks.mjs`). El repositorio es, además, lo que se revisa:
 * si una migración crea una tabla, la omisión se ve en el mismo cambio que la
 * introduce, no después de correrla.
 *
 * LOS LÍMITES DE UN LECTOR DE SQL CON EXPRESIONES REGULARES, dichos para que
 * nadie los descubra por las malas: reconoce `CREATE TABLE public.x (...)`,
 * `ALTER TABLE public.x ... REFERENCES public.y` y `DROP TABLE public.x`, en el
 * estilo en que están escritas las migraciones de esta casa. Una tabla creada
 * con otra sintaxis (dentro de un `DO $$`, fuera del esquema `public`) no la
 * vería. Es un guardián de olvidos, no un analizador de Postgres.
 */

export interface Excluida {
  tabla: string;
  /** Por qué NO se borra con la firma. Se imprime en el check. */
  razon: string;
  /** Dónde está escrita esa razón en el repositorio; si desaparece, la exclusión deja de valer. */
  evidencia: { archivo: string; patron: RegExp };
}

export interface Llave {
  hija: string;
  padre: string;
}

export interface Borrado {
  tabla: string;
  /** `EXECUTE 'DELETE ...'`: la tabla se resuelve al ejecutar, no al crear la función. */
  dinamico: boolean;
  /** Si el cuerpo pregunta `to_regclass('public.<tabla>') IS NOT NULL`. */
  conGuarda: boolean;
}

/** Quita los comentarios `--` y `/* *\/`: una tabla comentada no existe. */
export const quitarComentarios = (sql: string): string =>
  sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--[^\n]*/g, '');

/** El contenido entre el paréntesis que abre en `desde` y el que lo cierra. */
const entreParentesis = (texto: string, desde: number): string => {
  let nivel = 0;
  for (let i = desde; i < texto.length; i++) {
    if (texto[i] === '(') nivel++;
    else if (texto[i] === ')') {
      nivel--;
      if (nivel === 0) return texto.slice(desde + 1, i);
    }
  }
  return texto.slice(desde + 1);
};

/** Cada `CREATE TABLE public.x (...)`, con su cuerpo. Una tabla definida dos veces suma sus cuerpos. */
const leerTablas = (sqls: readonly string[]): Map<string, string> => {
  const cuerpos = new Map<string, string>();
  for (const sql of sqls.map(quitarComentarios)) {
    const patron = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?public\.(\w+)\s*\(/gi;
    let m: RegExpExecArray | null;
    while ((m = patron.exec(sql))) {
      const cuerpo = entreParentesis(sql, m.index + m[0].length - 1);
      cuerpos.set(m[1], `${cuerpos.get(m[1]) ?? ''}\n${cuerpo}`);
    }
  }
  return cuerpos;
};

const leerRetiradas = (sqls: readonly string[]): Set<string> => {
  const retiradas = new Set<string>();
  for (const sql of sqls.map(quitarComentarios)) {
    for (const m of sql.matchAll(/DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?public\.(\w+)/gi)) retiradas.add(m[1]);
  }
  return retiradas;
};

/**
 * Las tablas que pertenecen a una firma, con el motivo.
 *
 * Dos maneras de pertenecer: tener la columna `firm_id`, o declarar en su
 * propio CREATE TABLE una llave foránea hacia una tabla que ya pertenece
 * (`expediente_actores`, `expediente_carpetas`, `agenda_avisos` no llevan
 * `firm_id` a propósito: su aislamiento va por el padre). Se itera hasta que
 * no entra ninguna más, para alcanzar a las nietas.
 *
 * Solo cuentan las llaves del CREATE TABLE, no las añadidas con ALTER TABLE:
 * `transcriptions.client_id` apunta a `clients`, pero la transcripción no es
 * «de» un cliente por eso; es de la firma por su propio `firm_id`. Una tabla
 * compartida que algún día ganara una columna opcional hacia un expediente
 * no debe volverse, por esa columna, material a borrar con la firma.
 */
export const tablasDeLaFirma = (sqls: readonly string[]): Map<string, string> => {
  const cuerpos = leerTablas(sqls);
  const retiradas = leerRetiradas(sqls);
  const deLaFirma = new Map<string, string>();

  for (const [tabla, cuerpo] of cuerpos) {
    if (retiradas.has(tabla)) continue;
    if (/\bfirm_id\s+(?:TEXT|UUID|VARCHAR)/i.test(cuerpo)) deLaFirma.set(tabla, 'tiene firm_id');
  }

  let entroAlguna = true;
  while (entroAlguna) {
    entroAlguna = false;
    for (const [tabla, cuerpo] of cuerpos) {
      if (retiradas.has(tabla) || deLaFirma.has(tabla)) continue;
      for (const m of cuerpo.matchAll(/REFERENCES\s+public\.(\w+)/gi)) {
        if (deLaFirma.has(m[1])) {
          deLaFirma.set(tabla, `cuelga de ${m[1]}`);
          entroAlguna = true;
          break;
        }
      }
    }
  }
  return deLaFirma;
};

/** Toda llave foránea declarada, en CREATE TABLE o en ALTER TABLE. */
export const llavesForaneas = (sqls: readonly string[]): Llave[] => {
  const llaves: Llave[] = [];
  for (const [hija, cuerpo] of leerTablas(sqls)) {
    for (const m of cuerpo.matchAll(/REFERENCES\s+public\.(\w+)/gi)) llaves.push({ hija, padre: m[1] });
  }
  for (const sql of sqls.map(quitarComentarios)) {
    for (const m of sql.matchAll(/ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:ONLY\s+)?public\.(\w+)([^;]*);/gi)) {
      for (const r of m[2].matchAll(/REFERENCES\s+public\.(\w+)/gi)) llaves.push({ hija: m[1], padre: r[1] });
    }
  }
  return llaves;
};

/** El cuerpo `$$ ... $$` de la función, sin comentarios, o `null` si el archivo no la define. */
export const cuerpoDeLaFuncion = (sql: string, nombre: string): string | null => {
  const patron = new RegExp(
    `CREATE\\s+OR\\s+REPLACE\\s+FUNCTION\\s+public\\.${nombre}\\s*\\([\\s\\S]*?AS\\s+\\$\\$([\\s\\S]*?)\\$\\$`,
    'i'
  );
  return quitarComentarios(sql).match(patron)?.[1] ?? null;
};

/** Cada DELETE del cuerpo, en el orden en que corre. */
export const borradosEnOrden = (cuerpo: string): Borrado[] =>
  [...cuerpo.matchAll(/(EXECUTE\s+')?DELETE\s+FROM\s+public\.(\w+)/gi)].map((m) => ({
    tabla: m[2],
    dinamico: Boolean(m[1]),
    conGuarda: new RegExp(`to_regclass\\(\\s*'public\\.${m[2]}'\\s*\\)\\s+IS\\s+NOT\\s+NULL`, 'i').test(cuerpo)
  }));

/** Lo que la función DICE que borró: cada `tabla := '...'`. Es lo que llega a la constancia. */
export const tablasReportadas = (cuerpo: string): string[] =>
  [...cuerpo.matchAll(/tabla\s*:=\s*'(\w+)'/g)].map((m) => m[1]);

/**
 * El veredicto: la lista de faltas, vacía si la función está completa.
 *
 * Además de «falta tal tabla», exige cuatro cosas que ya fallaron o fallarían
 * sin ruido:
 *  · que nada se borre DESPUÉS de su padre: con `ON DELETE SET NULL` borrar el
 *    padre primero no rompe, pero reescribe filas que un instante después se
 *    borran; con una llave sin acción, abortaría la función;
 *  · que `firms` sea lo último, porque es la única prueba de que la firma
 *    existía mientras se borraba lo demás;
 *  · que un DELETE dinámico pregunte antes si la tabla existe: si no, una tabla
 *    ausente hace fallar la función ENTERA y la firma no se puede borrar;
 *  · que lo reportado coincida con lo borrado, porque la constancia que recibe
 *    la firma se escribe con lo reportado.
 */
export const auditarBorrado = (d: {
  inventario: ReadonlyMap<string, string>;
  llaves: readonly Llave[];
  borrados: readonly Borrado[];
  reportadas: readonly string[];
  excluidas: readonly Excluida[];
}): string[] => {
  const faltas: string[] = [];
  const orden = d.borrados.map((b) => b.tabla);
  const excluidas = new Set(d.excluidas.map((e) => e.tabla));

  for (const [tabla, motivo] of d.inventario) {
    if (!excluidas.has(tabla) && !orden.includes(tabla)) faltas.push(`no se borra ${tabla} (${motivo})`);
  }
  for (const e of d.excluidas) {
    if (!d.inventario.has(e.tabla)) faltas.push(`se excluye ${e.tabla}, que ya no es una tabla de la firma`);
    if (orden.includes(e.tabla)) faltas.push(`se excluye ${e.tabla} y aun así se borra`);
  }
  for (const b of d.borrados) {
    if (!d.inventario.has(b.tabla)) faltas.push(`se borra ${b.tabla}, que no es una tabla de la firma en el esquema`);
    if (b.dinamico && !b.conGuarda) faltas.push(`DELETE dinámico sobre ${b.tabla} sin preguntar to_regclass`);
  }
  const repetidas = orden.filter((t, i) => orden.indexOf(t) !== i);
  if (repetidas.length) faltas.push(`se borra dos veces: ${[...new Set(repetidas)].join(', ')}`);

  if (orden.length && orden[orden.length - 1] !== 'firms') {
    faltas.push('firms no es lo último que se borra');
  }
  for (const l of d.llaves) {
    if (l.hija === l.padre) continue;
    const hija = orden.indexOf(l.hija);
    const padre = orden.indexOf(l.padre);
    if (hija >= 0 && padre >= 0 && padre < hija) {
      faltas.push(`${l.padre} se borra antes que ${l.hija}, que la referencia`);
    }
  }
  if (d.reportadas.join(',') !== orden.join(',')) {
    faltas.push(`la función reporta [${d.reportadas.join(', ')}] pero borra [${orden.join(', ')}]`);
  }
  return faltas;
};
