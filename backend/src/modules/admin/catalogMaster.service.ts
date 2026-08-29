import { supabase } from '../../config/supabase.config';
import { catalogService } from '../catalog/catalog.service';
import type { ActuacionRole, LegalBranch } from '../catalog/types';

/**
 * El catálogo maestro visto desde operación. Artboard 8b.
 *
 * ─── LA LÍNEA QUE NO SE CRUZA, IMPUESTA POR CÓDIGO ──────────────────────────
 *
 * El artboard dedica una tarjeta roja entera a la frontera de 2c: lo que una
 * firma cura es suyo y NUNCA vuelve al maestro. Aquí esa frontera no es una
 * advertencia en pantalla, es la forma de las consultas: todo lo que se lee de
 * `catalog_verifications` es `count`, `actuacion_id` y `firm_id`. Ni un
 * `term_description`, ni un `legal_basis`, ni una `note`. Operación puede saber
 * CUÁNTAS firmas tocaron una actuación; nunca QUÉ escribieron.
 *
 * Esa distinción la autoriza el propio artboard, que muestra «Firmas con lo
 * curado en juego: 41». Contar es lo que permite avisar antes de publicar; leer
 * sería exactamente lo que 2c promete que no ocurre.
 *
 * ─── LO QUE EL ARTBOARD PIDE Y AQUÍ NO ESTÁ, con la razón ───────────────────
 *
 * · «Norma derogada · 38». **No existe campo de derogatoria en `Actuacion`.**
 *   Ninguna ficha declara si su norma sigue viva, así que ese número no se
 *   puede calcular: publicarlo exigiría inventarlo o adivinarlo leyendo el
 *   texto del `legalBasis`, y una cifra de fichas caducas que resulte falsa es
 *   peor que ninguna cifra. Se devuelve `null` y la pantalla dice por qué.
 * · «Publicar cambios · 3» y la propagación a las firmas. **El maestro es un
 *   artefacto de compilación**: nace de `research/actuaciones-*.json`, pasa por
 *   `build-catalog.py` y viaja dentro del paquete. No hay tabla que escribir,
 *   así que un botón «Publicar» no propagaría nada — sería teatro sobre la
 *   acción que el propio artboard llama la más peligrosa de la consola.
 *   Cambiar esto es mover el maestro a base de datos, no añadir un endpoint.
 * · «Propuestas de las firmas · 27». No hay tabla de propuestas ni flujo para
 *   ofrecerlas: hoy una firma no puede proponer nada, así que no hay lista que
 *   pintar. Se declara vacío por inexistente, no por estar a cero.
 * · El aviso por correo a los socios. No hay correo saliente en este backend.
 */

export interface ReparticionMaestro {
  porRama: Array<{ branch: LegalBranch; total: number }>;
  porRol: Array<{ role: ActuacionRole; total: number }>;
}

export interface ActuacionMasCurada {
  actuacionId: string;
  exactName: string | null;
  /** Cuántas firmas distintas la tocaron. Nunca qué escribieron. */
  firmas: number;
}

export interface CatalogoMaestro {
  /** Lo que reciben todas las firmas, tal como sale del paquete. */
  actuacionesBase: number;
  conTerminoVerificado: number;
  sinVerificar: number;
  noCaduca: number;
  transversales: number;
  ramas: number;
  reparticion: ReparticionMaestro;

  /**
   * `null` a propósito: el modelo no registra si una norma fue derogada, así
   * que el número del artboard no se puede calcular sin adivinarlo.
   */
  conNormaDerogada: null;

  /** Alcance de la curaduría, EN CUENTAS. Nunca en contenido. */
  firmasQueCuraron: number;
  verificacionesDeFirmas: number;
  masCuradas: ActuacionMasCurada[];

  /** Vacías por inexistentes, no por estar a cero. Ver el docblock. */
  propuestasDeFirmas: [];
  cambiosPorPublicar: [];
}

export const leerCatalogoMaestro = async (): Promise<CatalogoMaestro> => {
  /*
   * Sin rama y sin rol: `list()` devuelve el catálogo entero UNA vez. Pedirlo
   * rama por rama contaría dos veces las transversales, que aparecen en todas
   * — y el total del maestro dejaría de coincidir con el que publica
   * `GET /api/catalog/actuaciones`, que es con el que se verifica producción.
   */
  const todas = catalogService.list();

  const porRama = new Map<LegalBranch, number>();
  const porRol = new Map<ActuacionRole, number>();
  let verificadas = 0;
  let sinVerificar = 0;
  let noCaduca = 0;
  let transversales = 0;

  for (const a of todas) {
    porRama.set(a.branch, (porRama.get(a.branch) ?? 0) + 1);
    porRol.set(a.role, (porRol.get(a.role) ?? 0) + 1);
    if (a.transversal) transversales += 1;
    if (a.term.status === 'VERIFICADO') verificadas += 1;
    else if (a.term.status === 'NO_CADUCA') noCaduca += 1;
    else sinVerificar += 1;
  }

  const base: CatalogoMaestro = {
    actuacionesBase: todas.length,
    conTerminoVerificado: verificadas,
    sinVerificar,
    noCaduca,
    transversales,
    ramas: catalogService.listBranches().length,
    reparticion: {
      porRama: [...porRama.entries()]
        .map(([branch, total]) => ({ branch, total }))
        .sort((a, b) => b.total - a.total),
      porRol: [...porRol.entries()]
        .map(([role, total]) => ({ role, total }))
        .sort((a, b) => b.total - a.total)
    },
    conNormaDerogada: null,
    firmasQueCuraron: 0,
    verificacionesDeFirmas: 0,
    masCuradas: [],
    propuestasDeFirmas: [],
    cambiosPorPublicar: []
  };

  if (!supabase) return base;

  /*
   * SOLO DOS COLUMNAS, Y ES DELIBERADO. Traer la fila entera pondría el término
   * que escribió un abogado de otra firma al alcance de esta pantalla, y a
   * partir de ahí solo haría falta que alguien lo pintara. Lo que no se lee no
   * se puede filtrar por descuido.
   */
  const { data, error } = await supabase
    .from('catalog_verifications')
    .select('firm_id, actuacion_id');

  if (error || !data) return base;

  const firmas = new Set<string>();
  const porActuacion = new Map<string, Set<string>>();

  for (const fila of data as Array<{ firm_id: string; actuacion_id: string }>) {
    firmas.add(fila.firm_id);
    const yaEstan = porActuacion.get(fila.actuacion_id) ?? new Set<string>();
    yaEstan.add(fila.firm_id);
    porActuacion.set(fila.actuacion_id, yaEstan);
  }

  const nombres = new Map(todas.map((a) => [a.id, a.exactName]));

  return {
    ...base,
    firmasQueCuraron: firmas.size,
    verificacionesDeFirmas: data.length,
    masCuradas: [...porActuacion.entries()]
      .map(([actuacionId, firmasDeEsa]) => ({
        actuacionId,
        /*
         * `null` cuando la actuación curada no está en el maestro: la firma
         * corrigió algo que este paquete ya no trae. No se oculta la fila —
         * esa discrepancia es justamente lo que operación necesita ver.
         */
        exactName: nombres.get(actuacionId) ?? null,
        firmas: firmasDeEsa.size
      }))
      .sort((a, b) => b.firmas - a.firmas)
      .slice(0, 12)
  };
};
