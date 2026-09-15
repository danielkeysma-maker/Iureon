/**
 * Guarda el manual contra la pantalla que describe.
 *
 * Run with: npm run check:manual-vigente
 *
 * ─── EL DEFECTO QUE VIGILA ─────────────────────────────────────────────────
 *
 * El 14 de septiembre de 2026 se releyó el manual contra el código y había
 * decenas de pasajes vencidos: botones que ya se llamaban de otra forma
 * («Pagar» por «Ir a pagar»), campos que ya no existían («Razón social»,
 * «Firma escaneada», «Guardar y aplicar»), un «calendario del año» donde la
 * agenda muestra un mes, y la recarga atribuida al administrador cuando el
 * servidor la permite a todos. Ningún check fallaba: el manual es texto, y el
 * texto no se rompe al compilar.
 *
 * Esto no prueba que el manual diga la verdad. Prueba dos cosas más baratas y
 * que sí se degradan solas:
 *
 * 1. Cada etiqueta de una lista curada, que el manual nombra en un artículo
 *    concreto, sigue existiendo en el código del módulo que la pinta. Si
 *    alguien renombra el botón, este check le avisa que el manual quedó
 *    mintiendo.
 * 2. Las frases vencidas no vuelven al manual ni a sus contenidos vecinos.
 *
 * El código se lee como TEXTO y sin comentarios: los comentarios que explican
 * por qué se retiró algo nombran lo retirado.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { entradaPorId, textoPlano } from '../content/manual';

const AQUI = dirname(fileURLToPath(import.meta.url));
const MODULOS = join(AQUI, '..', '..');

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const sinComentarios = (codigo: string): string =>
  codigo
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

/** Every source file under a module folder, checks and manual content excluded. */
const fuentesDe = (carpeta: string): string[] => {
  const salida: string[] = [];
  const recorrer = (dir: string): void => {
    for (const nombre of readdirSync(dir)) {
      const ruta = join(dir, nombre);
      if (statSync(ruta).isDirectory()) {
        if (nombre !== '__checks__' && nombre !== 'content') recorrer(ruta);
      } else if (/\.tsx?$/.test(nombre)) {
        salida.push(ruta);
      }
    }
  };
  recorrer(join(MODULOS, carpeta));
  return salida;
};

const cache = new Map<string, string>();
const codigoDe = (carpeta: string): string => {
  if (!cache.has(carpeta)) {
    cache.set(carpeta, fuentesDe(carpeta).map((f) => sinComentarios(readFileSync(f, 'utf8'))).join('\n'));
  }
  return cache.get(carpeta) ?? '';
};

/*
 * ─── 1. LO QUE EL MANUAL NOMBRA, EN EL MÓDULO QUE LO PINTA ────────────────
 *
 * [artículo, carpeta de `src/modules`, etiquetas]. La etiqueta tiene que
 * aparecer tal cual en el texto del artículo Y en el código de esa carpeta.
 */
const CURADAS: ReadonlyArray<readonly [string, string, readonly string[]]> = [
  ['inicio', 'inicio', ['Por dónde empiezo', 'Empezar la visita', 'Prefiero leer el manual', 'Ir a Inicio', 'Volver a verla', 'Ver la agenda completa']],
  ['primer-escrito', 'workspace', ['No sé cuál es: que la guía la proponga', 'No está en la lista: la escribo yo', 'Redactar sin actuación', 'Guardar y redactar', 'Lo que respalda este escrito']],
  ['primer-escrito', 'estilo', ['Usar el formato y la jerga que su firma enseñó']],
  ['exportar', 'workspace', ['Marcar como listo', 'Membrete de la firma']],
  ['exportar', 'documents', ['Trabajar el escrito']],
  ['exportar', 'estilo', ['Guardar el formato', 'Qué se guarda', 'Qué no se guarda']],
  ['borradores', 'documents', ['Datos del proceso', 'Marcar radicado', 'Exportar lista']],
  ['revisar-escrito', 'workspace', ['Leer en grande', 'Ir al punto', 'Lo que exige la norma', 'Criterio del revisor', 'Restaurar esta versión', '¿Conservar el escrito y su trabajo?', 'Desde $2.000 de su saldo']],
  ['documento-recibido', 'workspace', ['Según el propio documento', 'Esta carga no es suya.', '¿Y con qué lo ataco?', 'Llevar los flancos a la guía de actuaciones']],
  ['orientacion', 'catalog', ['Los hechos, como se los contaría a un colega', 'Qué pedirle al motor', 'Cupo gratuito de hoy agotado', 'Leerlo primero: qué le exige y para cuándo']],
  ['verificar', 'catalog', ['Guardar verificación', 'Revertir al catálogo base', 'Fuente donde lo verificó']],
  ['expediente', 'expedientes', ['Nuevo caso', 'Esta semana', 'Nombre, cédula o radicado', 'Abrir la agenda', 'Mover a otra carpeta', 'Quitar del caso', 'Traer algo de otro módulo']],
  ['audiencia', 'transcription', ['Transcribir y separar las voces', 'Es de otra persona', 'Marcar acta lista', 'Generar el resumen']],
  ['entrevista', 'clients', ['Transcribir esta entrevista', 'Declinar con motivo', 'Decidir después', 'Exportar la constancia']],
  ['herramientas', 'agenda', ['Poner en la agenda', 'Festivos y vacancia del año']],
  ['herramientas', 'tools', ['Por tramos de tasa', 'Ver certificaciones']],
  ['herramientas', 'procedural-terms', ['Clase de término']],
  ['buscador', 'search', ['Solo lo que alguien leyó', 'Lo que una persona leyó', 'Encontrado automáticamente']],
  ['datos-cliente', 'audit', ['Por documento, actuación o usuario']],
  ['datos-cliente', 'privacy', ['Descargar la lista (CSV)', 'Lo que nunca ocurre']],
  ['roles-saldo', 'billing', ['Ir a pagar', 'Imprimir comprobante']],
  ['roles-saldo', 'tenant', ['¿Olvidó su contraseña?', 'Enviarme el enlace', 'Guardar la contraseña']],
  ['planes-y-pago', 'subscriptions', ['Renovar o cambiar de plan', 'Pagos del plan', 'Cuenta de cobro']],
  ['formato', 'tenant', ['Guardar el membrete', 'Datos de la firma', 'Bloque de firma']],
  ['movil', 'push', ['Avisos en este dispositivo', 'Enviar una prueba']],
  ['soporte', 'help', ['Nueva conversación', 'Abrir conversación', 'Soporte respondió', 'Antes de escribir']]
];

for (const [id, carpeta, etiquetas] of CURADAS) {
  const entrada = entradaPorId(id);
  if (!entrada) {
    check(`el artículo «${id}» existe`, false, 'id renombrado o borrado: actualice esta lista y los enlaces');
    continue;
  }
  const texto = textoPlano(entrada.articulo);
  let codigo = '';
  try {
    codigo = codigoDe(carpeta);
  } catch {
    check(`la carpeta ${carpeta} existe`, false);
    continue;
  }
  const noEnManual = etiquetas.filter((e) => !texto.includes(e));
  const noEnPantalla = etiquetas.filter((e) => !codigo.includes(e));
  check(`«${id}» sigue nombrando sus etiquetas`, noEnManual.length === 0, noEnManual.join(' · '));
  check(`las etiquetas de «${id}» existen en ${carpeta}`, noEnPantalla.length === 0, noEnPantalla.join(' · '));
}

/* ─── 2. LAS FRASES VENCIDAS NO VUELVEN ─────────────────────────────────── */
const CONTENIDO = ['manual.ts', 'support.ts', 'frecuentes.ts']
  .map((f) => readFileSync(join(AQUI, '..', 'content', f), 'utf8'))
  .map(sinComentarios)
  .join('\n');

const VENCIDAS: ReadonlyArray<readonly [string, string]> = [
  ['calendario del año', 'la agenda muestra un mes a la vez'],
  ['Solo curadas', 'el filtro es «Solo lo que alguien leyó»'],
  ['Corpus curado ·', 'el bloque es «Lo que una persona leyó»'],
  ['Descubrimiento automático', 'el bloque es «Encontrado automáticamente»'],
  ['Guardar y aplicar', 'el botón es «Guardar el membrete»'],
  ['Firma escaneada', 'el membrete no recibe firma escaneada'],
  ['Razón social', 'el campo es el nombre de la firma'],
  ['Pie de página', 'el membrete no tiene ese campo'],
  ['Verificarlo toma unos dos minutos', 'una cifra que nadie midió'],
  ['pídalo por Soporte', 'la pantalla dice «escríbanos por Soporte antes de pagar»'],
  ['«Pagar»', 'el botón de la recarga es «Ir a pagar»'],
  ['«Otra voz»', 'la herramienta es «Es de otra persona»'],
  ['Usuarios y roles', 'la pantalla se llama «Su firma»'],
  ['Eliminar mi usuario', 'el botón es «Borrar mi acceso»'],
  ['una captura', 'el chat de soporte no recibe adjuntos'],
  ['Poner una contraseña nueva', 'el botón del correo es «Elegir una contraseña nueva»']
];
for (const [frase, porque] of VENCIDAS) {
  check(`el manual no dice «${frase}»`, !CONTENIDO.includes(frase), porque);
}

check(
  'la recarga no se atribuye al administrador',
  !/recarg[a-z]*[^.]{0,80}(corresponde al administrador|solo (un|el) administrador)/i.test(CONTENIDO)
);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
