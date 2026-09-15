import type { AuditLogEntry } from './services/audit.api';

/**
 * EL REGISTRO DE AUDITORÍA, EN PURO. Sin React, sin red.
 *
 * Aquí vive todo lo que decide qué dice la pantalla: el nombre de cada acción,
 * el estado de la lista, cómo se unen las páginas, qué filtra cada pregunta y
 * cómo sale el CSV. Las dos pantallas —escritorio y teléfono— pasan por aquí,
 * así que no pueden contar dos historias distintas del mismo registro, y
 * `check:privacidad-seguridad-auditoria-cara` lo puede probar sin montar nada.
 */

/**
 * EL NOMBRE DE CADA ACCIÓN, en palabras y en pasado, como la maqueta pide
 * (`app-administrar-y-saldo.html`:351: «cada línea se escribe en palabras, no
 * en códigos»). La lista es la unión `AuditAction` del backend ENTERA: una
 * acción que falte aquí sale como código crudo justo en la pantalla que un
 * socio abre cuando algo salió mal. El check compara las dos listas.
 */
export const ACCIONES: Record<string, string> = {
  DRAFT_GENERATED: 'Generó escrito',
  DOCUMENT_REVIEWED: 'Revisó un documento',
  DOCUMENT_REREVIEWED: 'Volvió a revisar un documento',
  REVIEW_CHAT: 'Conversó sobre una revisión',
  REVIEW_TEXT_STORAGE_AUTHORIZED: 'Autorizó conservar los escritos del taller',
  HEARING_QUESTIONS_GENERATED: 'Preguntas para la audiencia',
  TRANSCRIPTION_CREATED: 'Transcribió',
  TRANSCRIPTION_DELETED: 'Eliminó transcripción',
  ACTA_LISTA: 'Revisión de acta',
  INTERVIEW_DECIDED: 'Decidió entrevista',
  CATALOG_TERM_VERIFIED: 'Verificó actuación',
  FIRM_ACTUACION_CREATED: 'Añadió una actuación de la firma',
  FIRM_ACTUACION_DELETED: 'Retiró una actuación de la firma',
  EXPEDIENTE_CREATED: 'Abrió un expediente',
  EXPEDIENTE_DELETED: 'Eliminó un expediente',
  EXPEDIENTE_UPDATED: 'Editó los datos de un expediente',
  EXPEDIENTE_INDEXED: 'Indexó un documento del expediente',
  EXPEDIENTE_DOCUMENT_RENAMED: 'Cambió el nombre de un documento del expediente',
  EXPEDIENTE_CARPETA_CREATED: 'Creó una carpeta del expediente',
  EXPEDIENTE_CARPETA_RENAMED: 'Cambió el nombre de una carpeta del expediente',
  EXPEDIENTE_CARPETA_MOVED: 'Movió una carpeta del expediente',
  EXPEDIENTE_CARPETA_DELETED: 'Eliminó una carpeta del expediente',
  AGENDA_TERM_CREATED: 'Puso un término en la agenda',
  AGENDA_TERM_DELETED: 'Retiró un término de la agenda',
  ESTILO_ENSENADO: 'Enseñó una lección de estilo',
  ESTILO_RETIRADO: 'Retiró una lección de estilo',
  FIRM_CREATED: 'Creó la firma',
  FIRM_UPDATED: 'Actualizó la firma',
  FIRM_CREDITS_ADDED: 'Acreditó saldo',
  FIRM_CREDITS_ADJUSTED: 'Ajustó el saldo',
  FIRM_STATUS_CHANGED: 'Cambió estado de la firma',
  USER_CREATED: 'Creó usuario',
  TRIAL_STARTED: 'Abrió la prueba gratuita',
  REGISTRO_PARA_COMPRA: 'Creó la cuenta para contratar',
  SUPERADMIN_LISTED_FIRMS: 'Operación listó firmas',
  PLAN_PAGADO: 'Pagó el plan',
  PLAN_ACTUALIZADO: 'Operación fijó el plan',
  PLAN_SUSPENDIDO: 'Operación suspendió el acceso',
  MODULOS_AJUSTADOS: 'Operación ajustó los módulos de la firma',
  FIRMA_ELIMINADA: 'Operación eliminó una firma',
  CLAVE_RESTABLECIDA_POR_OPERADOR: 'Operación restableció una contraseña',
  CONTRASENA_RECUPERACION_SOLICITADA: 'Pidió un enlace para cambiar su contraseña',
  CONTRASENA_RESTABLECIDA: 'Cambió su contraseña con el enlace del correo',
  USUARIO_ELIMINADO_POR_SI_MISMO: 'Eliminó su propio usuario',
  NOMBRE_ACTUALIZADO: 'Fijó su nombre',
  SUPPORT_ACCESS_REQUESTED: 'Operación pidió acceso de soporte',
  SUPPORT_ACCESS_AUTHORIZED: 'Autorizó el acceso de soporte',
  SUPPORT_ACCESS_DENIED: 'No autorizó el acceso de soporte',
  SUPPORT_ACCESS_REVOKED: 'Retiró el acceso de soporte',
  SUPPORT_ACCESS_VIEWED: 'Soporte abrió material de la firma',
  SUPPORT_CHAT_MESSAGE: 'Chat de soporte',
  PUSH_SUBSCRIBED: 'Avisos activados en un dispositivo',
  PUSH_UNSUBSCRIBED: 'Avisos desactivados en un dispositivo',
  EMAIL_SENT: 'Correo enviado'
};

/**
 * Un código que el servidor escriba mañana y esta lista no conozca se muestra
 * TAL CUAL, marcado como sin nombre: inventarle un sentido sería peor que
 * dejarlo crudo, y el check avisa antes de que llegue a producción.
 */
export const nombreDeAccion = (codigo: string): string => ACCIONES[codigo] ?? `Acción sin nombre (${codigo})`;

/**
 * LAS VISTAS FRECUENTES SON PREGUNTAS, NO FILTROS. Cada una junta las acciones
 * que responden algo que un socio pregunta de verdad. La de «Accesos y
 * contraseñas» es la que responde por la seguridad de la firma: quién pidió un
 * enlace, quién entró como soporte, quién creó o retiró una cuenta.
 */
export const VISTAS: ReadonlyArray<{ etiqueta: string; acciones: readonly string[] }> = [
  { etiqueta: 'Escritos y revisiones', acciones: ['DRAFT_GENERATED', 'DOCUMENT_REVIEWED', 'DOCUMENT_REREVIEWED', 'REVIEW_CHAT', 'REVIEW_TEXT_STORAGE_AUTHORIZED'] },
  { etiqueta: 'Expedientes', acciones: ['EXPEDIENTE_CREATED', 'EXPEDIENTE_UPDATED', 'EXPEDIENTE_DELETED', 'EXPEDIENTE_INDEXED', 'EXPEDIENTE_DOCUMENT_RENAMED', 'EXPEDIENTE_CARPETA_CREATED', 'EXPEDIENTE_CARPETA_RENAMED', 'EXPEDIENTE_CARPETA_MOVED', 'EXPEDIENTE_CARPETA_DELETED'] },
  { etiqueta: 'Catálogo y estilo', acciones: ['CATALOG_TERM_VERIFIED', 'FIRM_ACTUACION_CREATED', 'FIRM_ACTUACION_DELETED', 'ESTILO_ENSENADO', 'ESTILO_RETIRADO'] },
  { etiqueta: 'Audiencias y entrevistas', acciones: ['TRANSCRIPTION_CREATED', 'TRANSCRIPTION_DELETED', 'ACTA_LISTA', 'INTERVIEW_DECIDED', 'HEARING_QUESTIONS_GENERATED'] },
  {
    etiqueta: 'Accesos y contraseñas',
    acciones: [
      'CONTRASENA_RECUPERACION_SOLICITADA',
      'CONTRASENA_RESTABLECIDA',
      'CLAVE_RESTABLECIDA_POR_OPERADOR',
      'SUPPORT_ACCESS_REQUESTED',
      'SUPPORT_ACCESS_AUTHORIZED',
      'SUPPORT_ACCESS_DENIED',
      'SUPPORT_ACCESS_REVOKED',
      'SUPPORT_ACCESS_VIEWED',
      'USER_CREATED',
      'USUARIO_ELIMINADO_POR_SI_MISMO',
      'PUSH_SUBSCRIBED',
      'PUSH_UNSUBSCRIBED'
    ]
  },
  {
    etiqueta: 'Saldo y plan',
    acciones: ['FIRM_CREDITS_ADDED', 'FIRM_CREDITS_ADJUSTED', 'FIRM_UPDATED', 'FIRM_STATUS_CHANGED', 'PLAN_PAGADO', 'PLAN_ACTUALIZADO', 'PLAN_SUSPENDIDO', 'MODULOS_AJUSTADOS', 'TRIAL_STARTED', 'REGISTRO_PARA_COMPRA', 'EMAIL_SENT']
  }
];

/* ─── EL PERIODO ─────────────────────────────────────────────────────────── */

export type PeriodoId = '7' | '30' | '90' | 'todo';

/**
 * La maqueta abre en «Últimos 30 días». El periodo se aplica EN EL SERVIDOR
 * (`inicio`), no sobre lo leído: filtrar en pantalla una primera página
 * dejaría fuera eventos del periodo que aún no se habían traído.
 */
export const PERIODOS: ReadonlyArray<{ id: PeriodoId; etiqueta: string; dias: number | null }> = [
  { id: '7', etiqueta: 'Últimos 7 días', dias: 7 },
  { id: '30', etiqueta: 'Últimos 30 días', dias: 30 },
  { id: '90', etiqueta: 'Últimos 90 días', dias: 90 },
  { id: 'todo', etiqueta: 'Todo el registro', dias: null }
];

export const inicioDelPeriodo = (id: PeriodoId, ahora: Date = new Date()): string | null => {
  const dias = PERIODOS.find((p) => p.id === id)?.dias ?? null;
  return dias === null ? null : new Date(ahora.getTime() - dias * 86_400_000).toISOString();
};

/* ─── EL ESTADO DE LA LISTA ──────────────────────────────────────────────── */

export type EstadoDeLaLista = 'CARGANDO' | 'NO_SE_PUDO_LEER' | 'INCOMPLETA' | 'VACIO' | 'LISTA';

/**
 * FALLAR NO ES ESTAR VACÍO. Una auditoría que no se pudo leer pintada como «no
 * hay eventos» se lee como «nadie hizo nada», que es la conclusión más cara
 * posible en esta pantalla. Y un error al leer la página siguiente no borra lo
 * que ya se ve: la lista queda INCOMPLETA, y se dice.
 */
export const estadoDeLaLista = (p: { cargando: boolean; error: string | null; leidos: number }): EstadoDeLaLista => {
  if (p.leidos > 0) return p.error ? 'INCOMPLETA' : 'LISTA';
  if (p.cargando) return 'CARGANDO';
  if (p.error) return 'NO_SE_PUDO_LEER';
  return 'VACIO';
};

/* ─── LAS PÁGINAS ────────────────────────────────────────────────────────── */

/**
 * Une una página nueva a lo leído SIN REPETIR. El servidor pagina por
 * desplazamiento sobre un registro al que solo se le añaden filas: si alguien
 * trabaja mientras se lee, la página siguiente trae otra vez la última fila de
 * la anterior. Nunca se salta una; repetir se corrige aquí, por `id`.
 */
export const unirPartes = (previos: AuditLogEntry[], nuevos: AuditLogEntry[]): AuditLogEntry[] => {
  const vistos = new Set(previos.map((e) => e.id));
  return [...previos, ...nuevos.filter((e) => !vistos.has(e.id))];
};

/** Sin total no se inventa cuántos quedan. */
export const quedanPorLeer = (leidos: number, total: number | null): number | null =>
  total === null ? null : Math.max(0, total - leidos);

/* ─── FILTROS ────────────────────────────────────────────────────────────── */

export interface Filtro {
  busqueda: string;
  usuario: string;
  vista: string | null;
}

/**
 * Filtra LO LEÍDO. La pantalla lo dice («entre los N leídos»), porque la
 * búsqueda por texto no viaja al servidor: buscar en lo que no se ha traído
 * exigiría otra consulta, y fingir que se buscó en todo sería mentir.
 */
export const filtrarEventos = (eventos: AuditLogEntry[], f: Filtro): AuditLogEntry[] => {
  const q = f.busqueda.trim().toLowerCase();
  const acciones = f.vista ? VISTAS.find((v) => v.etiqueta === f.vista)?.acciones ?? null : null;
  return eventos.filter((e) => {
    if (f.usuario !== 'TODOS' && e.userEmail !== f.usuario) return false;
    if (acciones && !acciones.includes(e.action)) return false;
    if (!q) return true;
    return (
      e.resource.toLowerCase().includes(q) ||
      e.userEmail.toLowerCase().includes(q) ||
      nombreDeAccion(e.action).toLowerCase().includes(q)
    );
  });
};

/* ─── EL CSV ─────────────────────────────────────────────────────────────── */

const campo = (v: string | null): string => `"${String(v ?? '').replace(/"/g, '""')}"`;

/**
 * El CSV lleva la marca de orden de bytes para que una hoja de cálculo en
 * español lea bien las tildes, y el identificador de cada evento, que es lo que
 * permite volver a encontrarlo en la base. Se llama CSV porque es CSV: la
 * maqueta dice «Excel», y un archivo que no es Excel no se anuncia como tal.
 */
export const csvDeEventos = (eventos: AuditLogEntry[]): string => {
  const cabecera = ['Fecha y hora', 'Usuario', 'Acción', 'Detalle', 'Origen (IP)', 'Evento'];
  const filas = eventos.map((e) =>
    [campo(e.timestamp), campo(e.userEmail), campo(nombreDeAccion(e.action)), campo(e.resource), campo(e.ipAddress), campo(e.id)].join(',')
  );
  return '﻿' + [cabecera.map(campo).join(','), ...filas].join('\r\n');
};

/* ─── TEXTOS QUE LLEGAN DEL SERVIDOR ─────────────────────────────────────── */

/**
 * Parte una línea del servidor en título y detalle para la tarjeta de «Lo que
 * nunca ocurre» (`app-ajustes-y-plan.html`:136), sin reescribirla: el texto
 * sigue siendo el que el servidor declara y su check vigila. Corta en los dos
 * puntos o, si no hay, en el primer punto seguido.
 */
export const partirEnTituloYDetalle = (linea: string): { titulo: string; detalle: string } => {
  const texto = linea.trim();
  const dosPuntos = texto.indexOf(': ');
  const punto = texto.indexOf('. ');
  const corte = dosPuntos > -1 ? dosPuntos : punto;
  if (corte === -1) return { titulo: texto.replace(/\.$/, ''), detalle: '' };
  const resto = texto.slice(corte + 2).trim();
  return {
    titulo: texto.slice(0, corte).replace(/\.$/, ''),
    detalle: resto.charAt(0).toLocaleUpperCase('es-CO') + resto.slice(1)
  };
};

/* ─── FECHAS ─────────────────────────────────────────────────────────────── */

export const nombreCorto = (correo: string): string => correo.split('@')[0];

export const fechaYHora = (iso: string): string => {
  const d = new Date(iso);
  const fecha = d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' });
  const hora = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${fecha} ${hora}`;
};

export const hora = (iso: string): string =>
  new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });

/** Día en la hora local de quien mira: un evento de las 11 p. m. es de ese día, no del siguiente en UTC. */
export const claveDelDia = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const rotuloDelDia = (iso: string, ahora: Date = new Date()): string => {
  const hoy = new Date(ahora);
  hoy.setHours(0, 0, 0, 0);
  const dia = new Date(iso);
  dia.setHours(0, 0, 0, 0);
  const dias = Math.round((hoy.getTime() - dia.getTime()) / 86_400_000);
  const largo = dia.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' });
  if (dias === 0) return `Hoy · ${largo}`;
  if (dias === 1) return `Ayer · ${largo}`;
  return dia.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
};
