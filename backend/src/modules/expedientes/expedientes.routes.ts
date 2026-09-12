import { Router } from 'express';
import { bloquearSiPlanVencido } from '../subscriptions/planVigente.middleware';
import {
  actualizarExpedienteController,
  agregarActorController,
  atarPiezaController,
  borrarActorController,
  borrarExpedienteController,
  candidatosController,
  borrarCarpetaController,
  buscarEnExpedienteController,
  carpetasController,
  contenidoDeCarpetaController,
  crearCarpetaController,
  moverCarpetaController,
  moverDocumentoController,
  documentosDelExpedienteController,
  textoDelDocumentoController,
  quitarDocumentoController,
  crearExpedienteController,
  listarExpedientesController,
  obtenerExpedienteController
} from './expedientes.controller';
import { preguntasDelExpedienteController } from './preguntas.controller';
import { indexarEnExpedienteController } from './indexar.controller';

/**
 * Los expedientes de la firma.
 *
 * ─── EL ORDEN DE ESTE ARCHIVO NO ES ESTÉTICO ───────────────────────────────
 *
 * `/expedientes/atar` va ANTES que `/expedientes/:id`. Con Express, la segunda
 * casaría con la primera y `atar` se leería como el identificador de un
 * expediente: la petición de atar terminaría intentando actualizar un
 * expediente llamado «atar», y el error sería un 404 que no explica nada.
 * `clients.routes.ts` ya toma esta precaución con `/clients/link`.
 *
 * ─── EL PLAN VENCIDO BLOQUEA LO QUE ESCRIBE, NO LO QUE LEE ─────────────────
 *
 * Misma regla que la agenda: una firma que no ha pagado sigue viendo sus
 * expedientes. Quitarle la vista de sus propios asuntos por un pago atrasado
 * sería tomarle el trabajo de rehén, y además es lo que necesita consultar
 * justamente cuando está decidiendo si renueva.
 */
const router = Router();

router.get('/expedientes', listarExpedientesController as any);
router.post('/expedientes', bloquearSiPlanVencido, crearExpedienteController as any);

/* ANTES de `/:id`, las dos. Ver la nota de arriba. */
router.get('/expedientes/candidatos', candidatosController as any);
router.patch('/expedientes/atar', bloquearSiPlanVencido, atarPiezaController as any);

router.get('/expedientes/:id', obtenerExpedienteController as any);
router.patch('/expedientes/:id', bloquearSiPlanVencido, actualizarExpedienteController as any);
router.delete('/expedientes/:id', bloquearSiPlanVencido, borrarExpedienteController as any);

router.post('/expedientes/:id/actores', bloquearSiPlanVencido, agregarActorController as any);
router.delete('/expedientes/:id/actores/:actorId', bloquearSiPlanVencido, borrarActorController as any);

/*
 * El interrogatorio. Cuesta saldo, así que va detrás de `bloquearSiPlanVencido`
 * como toda escritura, y además `exigirModulo` dentro del controlador.
 */
router.post('/expedientes/:id/preguntas', bloquearSiPlanVencido, preguntasDelExpedienteController as any);

/*
 * Indexar el expediente de 300 paginas. No cuesta saldo del motor de redaccion
 * —son embeddings, no un modelo de lenguaje— pero es escritura, asi que va
 * detras de `bloquearSiPlanVencido` como todas.
 */
router.post('/expedientes/:id/indexar', bloquearSiPlanVencido, indexarEnExpedienteController as any);

/* Lo que el expediente tiene indexado. La lectura no bloquea con el plan vencido. */
router.get('/expedientes/:id/documentos', documentosDelExpedienteController as any);
/* Leer el texto de un documento indexado. Va antes del DELETE del mismo camino. */
router.get('/expedientes/:id/documentos/:documentId/texto', textoDelDocumentoController as any);

/*
 * Buscar dentro del expediente. NO lleva `bloquearSiPlanVencido`: es lectura de
 * lo que la firma ya subio, y quitarle la busqueda de sus propios papeles por
 * un pago atrasado seria tomarle el trabajo de rehen.
 */
router.get('/expedientes/:id/buscar', buscarEnExpedienteController as any);

/*
 * Las carpetas. Organizar no cuesta saldo, pero es escritura: detras de
 * `bloquearSiPlanVencido` como todas, salvo la lectura.
 */
router.get('/expedientes/:id/carpetas', carpetasController as any);
router.post('/expedientes/:id/carpetas', bloquearSiPlanVencido, crearCarpetaController as any);
router.patch('/expedientes/:id/carpetas/:carpetaId', bloquearSiPlanVencido, moverCarpetaController as any);
/* Lo que se llevaria borrar la carpeta. Lo pide el dialogo ANTES de borrar. */
router.get('/expedientes/:id/carpetas/:carpetaId/contenido', contenidoDeCarpetaController as any);
router.delete('/expedientes/:id/carpetas/:carpetaId', bloquearSiPlanVencido, borrarCarpetaController as any);
router.patch(
  '/expedientes/:id/documentos/:documentId/carpeta',
  bloquearSiPlanVencido,
  moverDocumentoController as any
);
router.delete(
  '/expedientes/:id/documentos/:documentId',
  bloquearSiPlanVencido,
  quitarDocumentoController as any
);

export const expedientesRoutes = router;
