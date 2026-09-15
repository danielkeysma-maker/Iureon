/**
 * El estilo de la firma en pantalla: el diálogo, el permiso del socio, el
 * precio, el interruptor del asistente y las palabras prohibidas.
 *
 * Run with: npm run check:estilo
 *
 * ─── LOS DEFECTOS QUE VIGILA ───────────────────────────────────────────────
 *
 * 1. «APRENDIDO». El botón anterior respondía eso sin guardar nada. La
 *    plataforma guarda un formato; «aprende» y «entrena» solo pueden aparecer
 *    negados, en el pie del diálogo.
 * 2. EL PRECIO ESCRITO A MANO. «$100» sale de una constante que se compara con
 *    `PRICE_COP.ESTILO` del servidor; si se separan, este check falla.
 * 3. EL BOTÓN PARA TODOS. Solo el socio administrador enseña: el servidor lo
 *    impone y la pantalla no lo ofrece a quien se le negará.
 * 4. EL INTERRUPTOR SIN NADA DETRÁS. Solo hay interruptor cuando la firma
 *    enseñó un formato para ese rol; si no, una línea lo dice.
 *
 * Se leen los componentes como TEXTO y sin comentarios. Puro: sin red.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LINEA_RECALCULO,
  MENSAJE_ERROR_AL_LEER,
  MENSAJE_GUARDADO,
  MENSAJE_SOLO_SOCIO,
  MENSAJE_SOLO_SOCIO_QUITAR,
  OPCION_GENERAL_DEL_ROL,
  PRECIO_LEER_FORMATO_COP,
  TEXTO_BOTON_LEER,
  TITULO_SECCION_AJUSTES,
  confirmacionDeQuitar,
  contenidoConLoMarcado,
  etiquetaEstiloAplicado,
  filasDelEstilo,
  itemsDeLaLectura,
  lecturaDeLaSeccion,
  lineaDelPaso3,
  motivoLegible,
  pieDelDialogo,
  puedeEnsenar,
  subtituloDelDialogo
} from '../estiloEnPantalla';
import type { EstadoDelPerfil } from '../hooks/usePerfilDeEstilo';
import type { ContenidoDeLeccion } from '../types';

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
  if (!ok) fallos++;
};

const AQUI = dirname(fileURLToPath(import.meta.url));
const SRC = join(AQUI, '..', '..', '..');
const BACKEND = join(SRC, '..', '..', 'backend', 'src');
const sinComentarios = (codigo: string): string =>
  codigo
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
const leer = (ruta: string): string => sinComentarios(readFileSync(join(SRC, ruta), 'utf8'));

const DIALOGO = leer('modules/estilo/components/EnsenarFormatoDialog.tsx');
const PANTALLA = leer('modules/estilo/estiloEnPantalla.ts');
const VISOR = leer('modules/documents/components/LegalDraftViewer.tsx');
const PANEL = leer('modules/workspace/components/AgentPanelLeft.tsx');
const PROCEDENCIA = leer('modules/documents/components/DraftProvenanceBar.tsx');
const API = leer('modules/estilo/services/estilo.api.ts');
const FLUJO = leer('modules/workspace/hooks/useLegalAgentWorkflow.ts');

/* ─── 1. Nunca «aprende» ────────────────────────────────────────────────── */

const NEGACION = 'La plataforma no aprende de sus escritos ni entrena nada';
const prohibidas = (texto: string): string[] => texto.replace(NEGACION, '').match(/aprendid[oa]|aprende|aprendi[oó]|entrena/gi) ?? [];
check('ningún componente del estilo dice «Aprendido», «aprende» ni «entrena»', prohibidas(DIALOGO + VISOR + PANEL + PROCEDENCIA).length === 0, prohibidas(DIALOGO + VISOR + PANEL + PROCEDENCIA).join(', '));
check('en las frases, solo aparecen negadas', prohibidas(PANTALLA).length === 0 && PANTALLA.includes(NEGACION), prohibidas(PANTALLA).join(', '));
check('muerde: «Aprendido de su firma» se detecta', prohibidas('<span>Aprendido de su firma</span>').length === 1);
check('el éxito dice «Guardado»', MENSAJE_GUARDADO === 'Guardado. Se usará desde el próximo borrador.' && DIALOGO.includes('MENSAJE_GUARDADO'));

/* ─── 2. El precio ──────────────────────────────────────────────────────── */

const billing = readFileSync(join(BACKEND, 'modules', 'billing', 'billing.service.ts'), 'utf8');
const pisoServidor = Number(/ESTILO:\s*(\d+)/.exec(billing)?.[1] ?? NaN);
check('el precio de la pantalla es el piso del servidor', PRECIO_LEER_FORMATO_COP === pisoServidor, `pantalla ${PRECIO_LEER_FORMATO_COP} · servidor ${pisoServidor}`);
check('el botón dice «Leer el formato · $100»', TEXTO_BOTON_LEER === 'Leer el formato · $100');
check('el diálogo no escribe el precio a mano', DIALOGO.includes('TEXTO_BOTON_LEER') && !/\$\s?100\b/.test(DIALOGO));

/* ─── 3. Los estados del diálogo ────────────────────────────────────────── */

check(
  'el diálogo trae sus cinco pasos',
  ["'INICIO'", "'LEYENDO'", "'VISTA'", "'GUARDANDO'", "'GUARDADO'"].every((p) => DIALOGO.includes(p))
);
check(
  'inicio: qué se guarda y qué no, con el pie que niega aprender',
  ['Qué se guarda', 'Qué no se guarda', 'QUE_SE_GUARDA', 'QUE_NO_SE_GUARDA', 'pieDelDialogo('].every((t) => DIALOGO.includes(t))
);
check(
  'vista previa: casillas por elemento y lo descartado con su motivo',
  ['Esto es lo que se guardaría', 'type="checkbox"', 'No se guardó', 'motivoLegible('].every((t) => DIALOGO.includes(t))
);
check('guardar manda solo lo marcado', DIALOGO.includes('contenidoConLoMarcado(lectura.contenido, desmarcadas)'));
check('un fallo se dice en voz alta, con el mensaje del servidor', DIALOGO.includes('role="alert"') && DIALOGO.includes('err.message'));
check('el diálogo va a 20 px por su envoltorio de la cara nueva', DIALOGO.includes('className="cn-est-dialogos"'));
check(
  'el subtítulo nombra rol y rama',
  subtituloDelDialogo('LITIGANTE', 'LABORAL') === 'Los próximos borradores de Litigante · Laboral & Seguridad Social saldrán con el formato y la jerga de este escrito.'
);
check('el pie nombra rol y rama y dónde se quita', pieDelDialogo('DESPACHO', 'CIVIL').includes('escritos de Despacho en Civil & Comercial (CGP)') && pieDelDialogo('DESPACHO', 'CIVIL').includes('Ajustes → Estilo de la firma'));
check('el motivo se lee como frase', motivoLegible({ campo: 'x', texto: 'y', motivo: 'menciona un plazo' }) === 'No se guardó: menciona un plazo');

/* ─── 4. Solo el socio ──────────────────────────────────────────────────── */

check('enseña el socio administrador y el operador; no el abogado', puedeEnsenar('FIRM_ADMIN') && puedeEnsenar('SUPER_ADMIN') && !puedeEnsenar('LAWYER') && !puedeEnsenar(undefined));
check(
  'el visor apaga el botón para quien no es socio y dice por qué',
  VISOR.includes('disabled={!puedeEnsenarFormato}') && VISOR.includes('MENSAJE_SOLO_SOCIO') && MENSAJE_SOLO_SOCIO === 'Solo el socio administrador puede enseñar el formato de la firma.'
);
/*
 * CAMBIÓ EL 14 DE SEPTIEMBRE DE 2026, a propósito: «Sugerir jerga» dejó de ser
 * un botón apagado con «Próximamente» y abre «Jerga de su firma». Lo que se
 * exige ahora es que ya no quede ningún botón apagado a mano ni la promesa.
 */
check(
  'el visor abre el diálogo real y «Sugerir jerga» abre el panel de jerga, sin «Próximamente»',
  VISOR.includes('<EnsenarFormatoDialog') &&
    VISOR.includes('<JergaDeLaFirma') &&
    VISOR.includes('{TEXTO_BOTON_JERGA}') &&
    !/<button type="button" disabled className="cn-red-trabajar-boton">/.test(VISOR) &&
    !VISOR.includes('Próximamente')
);

/* ─── 5. El paso 3 del asistente ────────────────────────────────────────── */

const con = lineaDelPaso3({ lecciones: 4, rama: 'LABORAL' }, 'LITIGANTE');
check(
  'con perfil: interruptor con «N escritos de rol · rama» y la regla de precedencia',
  con.tipo === 'CON_PERFIL' && con.detalle === '4 escritos de Litigante · Laboral & Seguridad Social · manda sobre el formato por defecto, nunca sobre lo que exige la norma',
  con.tipo === 'CON_PERFIL' ? con.detalle : con.texto
);
const general = lineaDelPaso3({ lecciones: 1, rama: null }, 'DESPACHO');
check('con el general del rol no inventa rama', general.tipo === 'CON_PERFIL' && general.detalle.startsWith('1 escrito de Despacho · manda'));
const sin = lineaDelPaso3({ lecciones: 0, rama: null }, 'SECRETARIA');
check('sin perfil: la línea que lo dice', sin.tipo === 'SIN_PERFIL' && sin.texto === 'Su firma aún no ha enseñado un formato para Secretaría. Se redacta con el formato por defecto.');
check('el interruptor existe una sola vez y solo con perfil', (PANEL.match(/role="switch"/g) ?? []).length === 1 && /lineaDeEstilo\?\.tipo === 'CON_PERFIL' && \(\s*<label className="cn-est-interruptor">/.test(PANEL));
check('la redacción manda el interruptor y el rol del taller, nunca texto de estilo', FLUJO.includes('usarEstilo,') && FLUJO.includes('rolDelTaller') && !/estiloDeLaFirma/.test(FLUJO));
check('apagarlo vale para este borrador: vuelve a encenderse al terminar', /finally \{[\s\S]*?setUsarEstilo\(true\)/.test(FLUJO));

/* ─── 6. La procedencia y la API ────────────────────────────────────────── */

check(
  'la procedencia dice «Con el estilo de su firma (Litigante · Laboral · 4 escritos)»',
  etiquetaEstiloAplicado({ rol: 'LITIGANTE', rama: 'LABORAL', lecciones: 4, actualizado: null }) === 'Con el estilo de su firma (Litigante · Laboral & Seguridad Social · 4 escritos)' &&
    etiquetaEstiloAplicado({ rol: 'LITIGANTE', rama: null, lecciones: 1, actualizado: null }) === 'Con el estilo de su firma (Litigante · general del rol · 1 escrito)' &&
    PROCEDENCIA.includes('etiquetaEstiloAplicado(')
);
check('la API habla con /api/estilo', ['/api/estilo?rol=', "'/api/estilo/leer'", "'/api/estilo/lecciones'", '/api/estilo/lecciones/${'].every((t) => API.includes(t)));

/* ─── 7. Casillas: ida y vuelta ─────────────────────────────────────────── */

const contenido: ContenidoDeLeccion = {
  titulosDeSeccion: [{ titulo: 'HECHOS', numeracion: 'ROMANOS' }],
  numeracionHechos: 'ORDINALES',
  ordenDeSecciones: ['HECHOS', 'PRETENSIONES'],
  encabezado: 'Señor [DESPACHO]',
  formulasDeApertura: ['Con todo respeto, me permito', 'Me permito presentar'],
  formulasDeCierre: ['Del señor Juez,'],
  bloqueDeFirma: ['[NOMBRE DEL APODERADO]'],
  tratamiento: { formula: 'su señoría', persona: 'PRIMERA_SINGULAR' },
  glosario: [{ preferido: 'libelo', variantes: ['demanda'], ejemplo: '' }]
};
const items = itemsDeLaLectura(contenido);
check('una casilla por elemento', items.length === 10, String(items.length));
const todo = contenidoConLoMarcado(contenido, new Set());
check('sin desmarcar, se guarda todo', JSON.stringify(todo) === JSON.stringify(contenido));
const parcial = contenidoConLoMarcado(contenido, new Set(['formulasDeApertura.0', 'encabezado', 'glosario.0']));
check(
  'desmarcar quita exactamente eso',
  parcial.formulasDeApertura.join() === 'Me permito presentar' && parcial.encabezado === '' && parcial.glosario.length === 0 && parcial.formulasDeCierre.length === 1
);

/* ─── 8. Ajustes → Estilo de la firma ───────────────────────────────────── */

const SECCION = leer('modules/estilo/components/EstiloDeLaFirmaSection.tsx');
const AJUSTES = leer('modules/settings/components/SettingsView.tsx');
const APP = leer('App.tsx');
const JERGA = leer('modules/estilo/components/JergaDeLaFirma.tsx');
const CASOS = readFileSync(join(BACKEND, 'modules', 'estilo', 'estilo.casos.ts'), 'utf8');
const RUTAS = readFileSync(join(BACKEND, 'modules', 'estilo', 'estilo.routes.ts'), 'utf8');

const perfilDePrueba = (lecciones: number, ramaPedida: string | null, rama: string | null): EstadoDelPerfil => ({
  estado: 'LISTO',
  respuesta: {
    rol: 'LITIGANTE',
    ramaPedida,
    rama,
    perfil: {
      lecciones,
      actualizado: null,
      titulosDeSeccion: [{ titulo: 'HECHOS', numeracion: 'ROMANOS' }],
      numeracionHechos: null,
      ordenDeSecciones: [],
      encabezado: { texto: 'Señor [DESPACHO]', vistoEn: 2 },
      formulasDeApertura: [{ texto: 'Con todo respeto', vistoEn: 1 }],
      formulasDeCierre: [],
      bloqueDeFirma: [],
      tratamiento: null,
      glosario: [{ preferido: 'libelo', variantes: ['demanda'], ejemplo: '', vistoEn: 3 }]
    },
    lecciones: [],
    puedeEnsenar: false
  }
});

const enError = lecturaDeLaSeccion({ estado: 'ERROR', respuesta: null });
check('un fallo dice «No se pudo leer el estilo de la firma», nunca vacío', enError.tipo === 'ERROR' && enError.texto === 'No se pudo leer el estilo de la firma' && MENSAJE_ERROR_AL_LEER === enError.texto);
check('muerde: el fallo no afirma que la firma no enseñó nada', enError.tipo === 'ERROR' && !/aún no|vac[ií]o/i.test(enError.texto));
const vacio = lecturaDeLaSeccion(perfilDePrueba(0, 'LABORAL', null));
check('sin lecciones: el vacío nombra rol y rama', vacio.tipo === 'VACIO' && vacio.texto.startsWith('Su firma aún no ha enseñado un formato para Litigante en Laboral & Seguridad Social ni para el general del rol.'), vacio.tipo === 'VACIO' ? vacio.texto : vacio.tipo);
const respaldo = lecturaDeLaSeccion(perfilDePrueba(2, 'LABORAL', null));
check('con respaldo al general: se dice, porque quitar ahí quita del general', respaldo.tipo === 'PERFIL' && respaldo.alcance === 'Litigante · general del rol' && (respaldo.respaldo ?? '').includes('general de Litigante'));
const propio = lecturaDeLaSeccion(perfilDePrueba(2, 'LABORAL', 'LABORAL'));
check('con formato propio de la rama: sin aviso de respaldo', propio.tipo === 'PERFIL' && propio.respaldo === null);
const filas = filasDelEstilo(perfilDePrueba(2, null, null).respuesta!.perfil);
check(
  'la vista consolidada muestra lo que hay, con «visto en N escritos», y omite lo vacío',
  filas.map((f) => f.clave).join() === 'titulos,encabezado,apertura,glosario' &&
    filas.find((f) => f.clave === 'glosario')!.items[0].detalle === 'visto en 3 escritos' &&
    filas.find((f) => f.clave === 'apertura')!.items[0].detalle === 'visto en 1 escrito',
  filas.map((f) => f.clave).join()
);
check('la línea del recálculo, literal', LINEA_RECALCULO === 'Quitar un escrito recalcula el estilo al instante. Ningún texto de sus casos está guardado aquí.' && SECCION.includes('{LINEA_RECALCULO}'));
const conf = confirmacionDeQuitar({ id: 'x', rol: 'DESPACHO', rama: 'CIVIL', fuente: 'BORRADOR', taughtBy: 'socia@firma.co', createdAt: '2026-09-01T10:00:00Z' }, () => '1 de septiembre de 2026');
check('la confirmación dice que se recalcula al instante y quién lo enseñó', conf.texto.includes('se recalcula al instante') && conf.texto.includes('Despacho · Civil & Comercial (CGP)') && conf.detalle === 'Enseñado el 1 de septiembre de 2026 por socia@firma.co · Desde un borrador');

check(
  '«Quitar» solo si el servidor dice que puede, con confirmación; a los demás, la razón',
  /respuesta\.puedeEnsenar \? \(\s*<button type="button" className="cn-est-quitar"/.test(SECCION) &&
    SECCION.includes('{!respuesta.puedeEnsenar && <p className="cn-est-solo-socio">{MENSAJE_SOLO_SOCIO_QUITAR}</p>}') &&
    SECCION.includes('confirmacionDeQuitar(') &&
    SECCION.includes('estiloApi.retirar(porQuitar.id)') &&
    MENSAJE_SOLO_SOCIO_QUITAR.startsWith('Solo el socio administrador puede quitar')
);
check('muerde: un «Quitar» sin condición se detecta', !/respuesta\.puedeEnsenar \? \(\s*<button type="button" className="cn-est-quitar"/.test('<button type="button" className="cn-est-quitar" onClick={q}>Quitar</button>'));
check(
  'la sección pinta cada estado: cargando, error con reintento, vacío y perfil',
  ["lectura.tipo === 'CARGANDO'", "lectura.tipo === 'ERROR'", 'onClick={estado.recargar}', "lectura.tipo === 'VACIO'", "lectura.tipo === 'PERFIL'"].every((t) => SECCION.includes(t))
);
check('los roles y la rama con «General del rol» por SelectorDelFormulario', SECCION.includes('role="tablist"') && SECCION.includes('<SelectorDelFormulario') && SECCION.includes('OPCION_GENERAL_DEL_ROL') && OPCION_GENERAL_DEL_ROL === 'General del rol');
check('la confirmación va a 20 px por el envoltorio de la cara nueva', SECCION.includes('<div className="cn-est-dialogos">'));

/* El pie promete «Ajustes → Estilo de la firma»: la entrada existe con ese nombre y la puerta lleva ahí. */
check(
  'la promesa del pie tiene sección: la entrada de Ajustes se llama igual y monta la sección',
  pieDelDialogo('LITIGANTE', null).includes(`Ajustes → ${TITULO_SECCION_AJUSTES}`) &&
    AJUSTES.includes("{ id: 'estilo', label: TITULO_SECCION_AJUSTES }") &&
    AJUSTES.includes("{seccion === 'estilo' && <EstiloDeLaFirmaSection />}")
);
check(
  'el enlace del diálogo lleva a la sección: pide ir, App navega y Ajustes abre en ella',
  DIALOGO.includes('irAlEstiloDeLaFirma();') &&
    APP.includes('alPedirElEstiloDeLaFirma(') &&
    /recordar\(PANTALLAS\.ajustes, SECCION_ESTILO\);\s*setMainView\('ajustes'\);/.test(APP) &&
    AJUSTES.includes('const pedida = recordado(PANTALLAS.ajustes);') &&
    /useState<Seccion>\(inicial \?\? 'cuenta'\)/.test(AJUSTES) &&
    /const SECCIONES: readonly Seccion\[\] = \[[^\]]*'estilo'/.test(AJUSTES)
);
/* Desde el 14 sep 2026 `?ir=estilo` es `/ajustes/estilo`: la tabla de rutas lo traduce y App lo aplica. */
check(
  'y `?ir=estilo` hace lo mismo',
  leer('modules/tenant/rutas.ts').includes("estilo: '/ajustes/estilo'") && APP.includes('const ruta = destinoSeguro(destino);')
);

/* Leer el estilo es de cualquier usuario de la firma; enseñar y quitar, del socio. */
const bloquePerfil = /async perfil\([\s\S]*?(?=async retirarLeccion)/.exec(CASOS)?.[0] ?? '';
check('el servidor deja leer el perfil a cualquiera de la firma', bloquePerfil.length > 0 && !bloquePerfil.includes('exigirSocio') && /router\.get\('\/estilo', perfilDeEstiloController\)/.test(RUTAS));
check('muerde: un perfil con exigirSocio se detecta', /exigirSocio/.test('async perfil(input) { exigirSocio(input.usuario);'));
check('y retirar sí exige al socio', /async retirarLeccion\([\s\S]*?exigirSocio\(usuario\)/.test(CASOS));

/* La jerga: sin modelo, sin cobro, con sus cuatro estados dichos. */
check(
  'la jerga solo lee el perfil: no llama a leer el formato, ni a la red, ni cobra',
  JERGA.includes('usePerfilDeEstilo(rol, rama)') && !/estiloApi|httpClient|fetch\(|\/api\//.test(JERGA)
);
check(
  'la jerga dice cada estado: error, sin glosario, sin hallazgos y selección sin hallazgos',
  ['TEXTO_ERROR_GLOSARIO', 'TEXTO_SIN_GLOSARIO', 'TEXTO_SIN_HALLAZGOS', 'TEXTO_SELECCION_SIN_HALLAZGOS', 'vistoEnEscritos('].every((t) => JERGA.includes(t))
);
check('la jerga reemplaza por posición y «todas» cuenta sus posiciones', JERGA.includes('reemplazarUno(texto, h)') && JERGA.includes('reemplazarTodas(texto, lista)') && JERGA.includes('Reemplazar todas (${g.hallazgos.length})'));
check('el visor toma la selección antes de que el clic la colapse', VISOR.includes('onMouseDown={') && VISOR.includes("addEventListener('selectionchange'"));

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
