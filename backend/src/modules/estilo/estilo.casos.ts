import { renderBloqueDelEstilo } from './bloqueDelEstilo';
import { consolidarEstilo, elegirAlcance, MENSAJE_TOPE, puedeAgregarLeccion } from './consolidarEstilo';
import { contenidoEstaVacio, filtrarContenido, normalizarContenido } from './guardaJuridica';
import { extraerJson, mensajeDelLector, PROMPT_LECTOR_DE_FORMATO } from './lectorDeFormato';
import { sanearContenido, sanearTexto, type DatosDelCaso } from './saneamiento';
import {
  ErrorDeEstilo,
  FUENTES_DE_LECCION,
  ROLES_DEL_ESTILO,
  type ContenidoDeLeccion,
  type EstiloAplicado,
  type FuenteDeLeccion,
  type ItemDescartado,
  type LeccionGuardada,
  type RolDelEstilo
} from './types';

/**
 * Los casos de uso del estilo de la firma, sin base, sin red y sin motor.
 *
 * ─── POR QUÉ UNA FÁBRICA CON DEPENDENCIAS ──────────────────────────────────
 *
 * Aquí viven las tres reglas que no se pueden romper —solo el socio enseña y
 * retira, el cobro se reserva y se devuelve si no hay resultado, y el texto del
 * escrito no se guarda nunca—, y las tres se prueban con dobles en
 * `check:estilo-prompt`. Si esta lógica llamara a la base o al motor
 * directamente, probarla exigiría una base viva, y en este proyecto la única
 * base que hay es la de producción.
 */

export interface UsuarioDelEstilo {
  firmId: string;
  email: string;
  role?: string | null;
}

export interface Alcance {
  rol: RolDelEstilo;
  rama: string | null;
}

export interface DependenciasDelEstilo {
  store: {
    contar(firmId: string, rol: RolDelEstilo, rama: string | null): Promise<number>;
    insertar(
      firmId: string,
      fila: { rol: RolDelEstilo; rama: string | null; fuente: FuenteDeLeccion; contenido: ContenidoDeLeccion; taughtBy: string }
    ): Promise<LeccionGuardada>;
    listar(firmId: string, rol: RolDelEstilo, rama: string | null): Promise<LeccionGuardada[]>;
    retirar(firmId: string, id: string): Promise<LeccionGuardada | null>;
  };
  cobro: {
    reservar(input: { firmId: string; userEmail: string }): Promise<{ reserved: number }>;
    registrarUso(input: { firmId: string; userEmail: string; operationId: string; usage: unknown }): Promise<void>;
    liquidar(input: {
      firmId: string;
      userEmail: string;
      operationId: string;
      reserved: number;
      description: string;
    }): Promise<{ charged: number; balance: number }>;
    devolver(input: { firmId: string; userEmail: string; reason: string }): Promise<void>;
  };
  auditoria: {
    registrar(input: { firmId: string; userEmail: string; action: 'ESTILO_ENSENADO' | 'ESTILO_RETIRADO'; resource: string }): Promise<void>;
  };
  leerConModelo(sistema: string, usuario: string): Promise<{ text: string; usage: unknown }>;
  /** Rol y rama del escrito: los de la ficha cuando la actuación resuelve, si no los del taller. null si no valen. */
  resolverAlcance(firmId: string, input: { documentType?: unknown; rol?: unknown; rama?: unknown }): Promise<Alcance | null>;
  nuevoId(): string;
}

/** Enseñar y retirar es del socio administrador. El operador de la plataforma también, como en el resto del producto. */
export const puedeEnsenar = (role?: string | null): boolean => role === 'FIRM_ADMIN' || role === 'SUPER_ADMIN';

export const MENSAJE_SOLO_SOCIO = 'Solo el socio administrador puede enseñar o retirar el formato de la firma.';
export const MIN_CARACTERES_DEL_ESCRITO = 200;
export const MAX_CARACTERES_DEL_ESCRITO = 120_000;
export const ETIQUETA_ROL: Record<RolDelEstilo, string> = { LITIGANTE: 'Litigante', DESPACHO: 'Despacho', SECRETARIA: 'Secretaría' };

const esRol = (x: unknown): x is RolDelEstilo => ROLES_DEL_ESTILO.includes(x as RolDelEstilo);

/**
 * Con qué rol y qué rama se busca el estilo al redactar.
 *
 * El rol es el de la FICHA cuando la actuación resuelve —quién firma una
 * contestación no lo decide un selector— y solo sin ficha el del taller. La
 * rama es la del escrito. Apagar el interruptor devuelve null: ese escrito se
 * redacta sin estilo, y la próxima vez el interruptor vuelve a nacer encendido.
 */
export const alcanceParaRedactar = (input: {
  usarEstilo: boolean;
  rolDeLaFicha: string | null;
  ramaDeLaFicha: string | null;
  rolDelTaller?: unknown;
  legalBranch?: unknown;
  ramasValidas: readonly string[];
}): Alcance | null => {
  if (!input.usarEstilo) return null;
  const rol = esRol(input.rolDeLaFicha) ? input.rolDeLaFicha : esRol(input.rolDelTaller) ? input.rolDelTaller : null;
  if (!rol) return null;
  const rama =
    input.ramaDeLaFicha && input.ramasValidas.includes(input.ramaDeLaFicha)
      ? input.ramaDeLaFicha
      : typeof input.legalBranch === 'string' && input.ramasValidas.includes(input.legalBranch)
        ? input.legalBranch
        : null;
  return { rol, rama };
};

export interface MetaDeLeccion {
  id: string;
  rol: RolDelEstilo;
  rama: string | null;
  fuente: FuenteDeLeccion;
  taughtBy: string;
  createdAt: string;
}

const metaDe = (l: LeccionGuardada): MetaDeLeccion => ({
  id: l.id,
  rol: l.rol,
  rama: l.rama,
  fuente: l.fuente,
  taughtBy: l.taughtBy,
  createdAt: l.createdAt
});

const etiquetaDelAlcance = (a: Alcance): string => `${ETIQUETA_ROL[a.rol]} · ${a.rama ?? 'general del rol'}`;

export const crearCasosDeEstilo = (deps: DependenciasDelEstilo) => {
  const exigirSocio = (usuario: UsuarioDelEstilo): void => {
    if (!puedeEnsenar(usuario.role)) throw new ErrorDeEstilo(403, 'FORBIDDEN', MENSAJE_SOLO_SOCIO);
  };

  const exigirAlcance = async (firmId: string, input: { documentType?: unknown; rol?: unknown; rama?: unknown }): Promise<Alcance> => {
    const alcance = await deps.resolverAlcance(firmId, input);
    if (!alcance) throw new ErrorDeEstilo(400, 'ALCANCE_INVALIDO', 'No se reconoce el rol o la rama del escrito.');
    return alcance;
  };

  return {
    /**
     * «Leer el formato · $100». Sanea, cobra, pregunta al motor, filtra y
     * DEVUELVE la vista previa. No guarda nada: guardar es otro paso, con lo
     * que el socio marque.
     */
    async leerFormato(input: {
      usuario: UsuarioDelEstilo;
      texto: unknown;
      rol?: unknown;
      rama?: unknown;
      documentType?: unknown;
      datosDelCaso?: DatosDelCaso;
    }): Promise<Alcance & { contenido: ContenidoDeLeccion; descartados: ItemDescartado[]; cobrado: number; saldo: number }> {
      const { usuario } = input;
      exigirSocio(usuario);

      const texto = typeof input.texto === 'string' ? input.texto.trim() : '';
      if (texto.length < MIN_CARACTERES_DEL_ESCRITO) {
        throw new ErrorDeEstilo(400, 'ESCRITO_CORTO', 'El escrito es demasiado corto para leer su formato.');
      }
      if (texto.length > MAX_CARACTERES_DEL_ESCRITO) {
        throw new ErrorDeEstilo(400, 'ESCRITO_LARGO', 'El escrito es demasiado largo para leer su formato de una vez.');
      }

      const alcance = await exigirAlcance(usuario.firmId, input);
      /* El tope se comprueba ANTES de cobrar: no se cobra la lectura de algo que no se podrá guardar. */
      if (!puedeAgregarLeccion(await deps.store.contar(usuario.firmId, alcance.rol, alcance.rama))) {
        throw new ErrorDeEstilo(409, 'TOPE_DE_LECCIONES', MENSAJE_TOPE);
      }

      /* SANEADO ANTES DEL MOTOR. Lo que se le manda al proveedor ya salió de la plataforma. */
      const escritoSaneado = sanearTexto(texto, input.datosDelCaso);
      const documentType = typeof input.documentType === 'string' ? input.documentType : null;

      const base = { firmId: usuario.firmId, userEmail: usuario.email };
      const { reserved } = await deps.cobro.reservar(base);
      const operationId = deps.nuevoId();

      try {
        const respuesta = await deps.leerConModelo(
          PROMPT_LECTOR_DE_FORMATO,
          mensajeDelLector({ escritoSaneado, rol: alcance.rol, rama: alcance.rama, documentType })
        );
        await deps.cobro.registrarUso({ ...base, operationId, usage: respuesta.usage });

        const json = extraerJson(respuesta.text);
        if (json === null) throw new Error('El motor no devolvió un JSON legible.');

        const normal = normalizarContenido(json);
        const filtrado = filtrarContenido(sanearContenido(normal.contenido, input.datosDelCaso));
        const descartados = [...normal.descartados, ...filtrado.descartados];

        if (contenidoEstaVacio(filtrado.contenido)) {
          await deps.cobro.devolver({ ...base, reason: 'Leer el formato: no quedó forma que guardar' });
          throw new ErrorDeEstilo(
            422,
            'NADA_QUE_GUARDAR',
            'De este escrito no quedó ninguna fórmula ni estructura que se pueda guardar sin datos del caso. No se descontó saldo.',
            descartados
          );
        }

        const cobro = await deps.cobro.liquidar({
          ...base,
          operationId,
          reserved,
          description: `Leer el formato · ${etiquetaDelAlcance(alcance)}`
        });

        return { ...alcance, contenido: filtrado.contenido, descartados, cobrado: cobro.charged, saldo: cobro.balance };
      } catch (err) {
        if (err instanceof ErrorDeEstilo) throw err;
        console.error('[ESTILO] No se pudo leer el formato:', (err as Error).message);
        await deps.cobro.devolver({ ...base, reason: 'Leer el formato: el motor no entregó resultado' });
        throw new ErrorDeEstilo(502, 'LECTURA_FALLIDA', 'No se pudo leer el formato de este escrito. No se descontó saldo.');
      }
    },

    /**
     * «Guardar el formato». Lo que manda el navegador NO se cree: se normaliza,
     * se sanea y se filtra otra vez, como si viniera del motor.
     */
    async guardarLeccion(input: {
      usuario: UsuarioDelEstilo;
      contenido: unknown;
      rol?: unknown;
      rama?: unknown;
      fuente?: unknown;
      documentType?: unknown;
    }): Promise<{ leccion: MetaDeLeccion; descartados: ItemDescartado[]; leccionesEnElAlcance: number }> {
      const { usuario } = input;
      exigirSocio(usuario);

      const fuente = input.fuente ?? 'BORRADOR';
      if (!FUENTES_DE_LECCION.includes(fuente as FuenteDeLeccion)) {
        throw new ErrorDeEstilo(400, 'FUENTE_INVALIDA', 'No se reconoce de dónde sale este formato.');
      }

      const alcance = await exigirAlcance(usuario.firmId, input);

      const normal = normalizarContenido(input.contenido);
      const filtrado = filtrarContenido(sanearContenido(normal.contenido));
      const descartados = [...normal.descartados, ...filtrado.descartados];
      if (contenidoEstaVacio(filtrado.contenido)) {
        throw new ErrorDeEstilo(422, 'NADA_QUE_GUARDAR', 'No quedó nada que guardar: todo lo marcado traía datos del caso o afirmaciones jurídicas.', descartados);
      }

      const enElAlcance = await deps.store.contar(usuario.firmId, alcance.rol, alcance.rama);
      if (!puedeAgregarLeccion(enElAlcance)) throw new ErrorDeEstilo(409, 'TOPE_DE_LECCIONES', MENSAJE_TOPE);

      /* SOLO LA FORMA. Ni el texto del escrito ni el título del borrador viajan a la fila. */
      const guardada = await deps.store.insertar(usuario.firmId, {
        rol: alcance.rol,
        rama: alcance.rama,
        fuente: fuente as FuenteDeLeccion,
        contenido: filtrado.contenido,
        taughtBy: usuario.email
      });

      /* A la auditoría ANTES de responder: una función serverless se congela al responder. */
      await deps.auditoria.registrar({
        firmId: usuario.firmId,
        userEmail: usuario.email,
        action: 'ESTILO_ENSENADO',
        resource: `Enseñó el formato de ${etiquetaDelAlcance(alcance)}`
      });

      return { leccion: metaDe(guardada), descartados, leccionesEnElAlcance: enElAlcance + 1 };
    },

    /** El perfil que se aplicaría a un escrito de ese rol y esa rama, con el respaldo al general del rol. */
    async perfil(input: { usuario: UsuarioDelEstilo; rol?: unknown; rama?: unknown }) {
      const alcancePedido = await exigirAlcance(input.usuario.firmId, { rol: input.rol, rama: input.rama });
      const deLaRama = alcancePedido.rama ? await deps.store.listar(input.usuario.firmId, alcancePedido.rol, alcancePedido.rama) : [];
      const generales = deLaRama.length > 0 ? [] : await deps.store.listar(input.usuario.firmId, alcancePedido.rol, null);
      const elegido = elegirAlcance({ rama: alcancePedido.rama, deLaRama, generales });
      return {
        rol: alcancePedido.rol,
        ramaPedida: alcancePedido.rama,
        rama: elegido.rama,
        perfil: consolidarEstilo(elegido.lecciones),
        lecciones: elegido.lecciones.map(metaDe),
        puedeEnsenar: puedeEnsenar(input.usuario.role)
      };
    },

    async retirarLeccion(input: { usuario: UsuarioDelEstilo; id: unknown }): Promise<{ id: string }> {
      const { usuario } = input;
      exigirSocio(usuario);
      const id = typeof input.id === 'string' ? input.id : '';
      if (!/^[0-9a-f-]{36}$/i.test(id)) throw new ErrorDeEstilo(400, 'ID_INVALIDO', 'La lección indicada no es válida.');

      const retirada = await deps.store.retirar(usuario.firmId, id);
      if (!retirada) throw new ErrorDeEstilo(404, 'NO_ENCONTRADA', 'Esa lección no existe o ya se retiró.');

      await deps.auditoria.registrar({
        firmId: usuario.firmId,
        userEmail: usuario.email,
        action: 'ESTILO_RETIRADO',
        resource: `Retiró un formato de ${etiquetaDelAlcance(retirada)} (enseñado por ${retirada.taughtBy})`
      });
      return { id };
    },

    /**
     * El bloque para el prompt de la redacción, o null. NUNCA LANZA: sin estilo
     * el escrito se redacta con el formato por defecto, que es exactamente lo
     * que se redactaba antes de que esto existiera.
     */
    async paraRedactar(input: { firmId: string; rol: RolDelEstilo; rama: string | null }): Promise<{ bloque: string; aplicado: EstiloAplicado } | null> {
      try {
        const deLaRama = input.rama ? await deps.store.listar(input.firmId, input.rol, input.rama) : [];
        const generales = deLaRama.length > 0 ? [] : await deps.store.listar(input.firmId, input.rol, null);
        const elegido = elegirAlcance({ rama: input.rama, deLaRama, generales });
        if (elegido.lecciones.length === 0) return null;
        const perfil = consolidarEstilo(elegido.lecciones);
        const bloque = renderBloqueDelEstilo(perfil, { rol: input.rol, rama: elegido.rama });
        if (!bloque) return null;
        return {
          bloque,
          aplicado: { rol: input.rol, rama: elegido.rama, lecciones: perfil.lecciones, actualizado: perfil.actualizado }
        };
      } catch (err) {
        console.error('[ESTILO] No se pudo cargar el estilo para redactar:', (err as Error).message);
        return null;
      }
    }
  };
};

export type CasosDeEstilo = ReturnType<typeof crearCasosDeEstilo>;
