/**
 * Guarda la cara nueva de «Avisos en este dispositivo» y de «Instalar la
 * aplicación»: que cada estado se diga con sus palabras y que la lista de lo
 * que se avisa sea EXACTAMENTE lo que el servidor envía.
 *
 * Run with: npm run check:avisos-cara
 *
 * ─── LOS DEFECTOS QUE VIGILA ───────────────────────────────────────────────
 *
 * 1. TRES SILENCIOS QUE PARECEN UNO. Navegador sin Push, permiso bloqueado y
 *    servidor sin llaves VAPID se ven idénticos desde fuera: no llega nada.
 *    Tienen arreglos distintos, así que la pantalla no puede ofrecer el mismo
 *    interruptor en los tres.
 *
 * 2. LA LISTA QUE ENVEJECE. La nota anterior decía «tres cosas» cuando el
 *    servidor ya avisaba también de los términos de la agenda. La maqueta de
 *    Ajustes dibuja avisos de transcripción y de saldo que no existen. Aquí se
 *    lee el código del backend y se exige que cada llamada de envío tenga su
 *    renglón, y que no haya renglón sin llamada.
 *
 * 3. EL «INSTALADA» QUE NUNCA SE VEÍA. El mensaje de aceptación vivía dentro
 *    de la rama «hay evento», y el evento se consume al pedir la instalación:
 *    la rama desaparecía antes de que llegara la respuesta.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  caraDeLosAvisos,
  dispositivosEnPalabras,
  resultadoDeLaPrueba,
  TIPOS_DE_AVISO,
  tiposQueLeLlegan,
  type EntradaDeLaCara
} from '../avisosEnPantalla';
import { situacionDeInstalacion } from '../../pwa/instalacionEnPantalla';

const AQUI = dirname(fileURLToPath(import.meta.url));
const SRC = join(AQUI, '..', '..', '..');
const BACKEND = join(SRC, '..', '..', 'backend', 'src');

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const base: EntradaDeLaCara = { local: 'desactivados', permiso: 'default', servidor: { enabled: true, dispositivos: 0 }, enCurso: null };
const cara = (cambios: Partial<EntradaDeLaCara>) => caraDeLosAvisos({ ...base, ...cambios });

/* ─── 1. CADA ESTADO, CON SU INTERRUPTOR ─────────────────────────────────── */
const comprobando = cara({ local: 'cargando', servidor: null });
check('cargando es «comprobando», sin interruptor', comprobando.situacion === 'comprobando' && !comprobando.interruptor.visible);

const sinPush = cara({ local: 'no-soportado', permiso: 'sin-api' });
check('sin Push no ofrece interruptor', sinPush.situacion === 'no-soportado' && !sinPush.interruptor.visible);

const ios = cara({ local: 'ios-sin-instalar', permiso: 'sin-api', servidor: { enabled: false, dispositivos: 0 } });
check('iOS sin instalar gana al servidor sin llaves: el arreglo es instalar', ios.situacion === 'ios-sin-instalar' && !ios.interruptor.visible);
check('iOS pide instalar primero', /instal/i.test(ios.estado + ios.detalle));

const sinLlaves = cara({ servidor: { enabled: false, dispositivos: 0 } });
check('servidor sin llaves: no disponibles, sin interruptor', sinLlaves.situacion === 'servidor-sin-llaves' && !sinLlaves.interruptor.visible);
check('servidor sin llaves no culpa al dispositivo', /no depende de este dispositivo/i.test(sinLlaves.detalle ?? ''));
check('la activación que descubre el servidor sin llaves también lo dice', cara({ local: 'servidor-sin-llaves' }).situacion === 'servidor-sin-llaves');
check('servidor sin llaves gana aunque el navegador tenga suscripción', cara({ local: 'activados', servidor: { enabled: false, dispositivos: 1 } }).situacion === 'servidor-sin-llaves');

const bloqueados = cara({ local: 'denegado', permiso: 'denied' });
check('permiso denegado: bloqueados, interruptor apagado y quieto', bloqueados.situacion === 'bloqueados' && bloqueados.interruptor.visible && !bloqueados.interruptor.encendido && bloqueados.interruptor.deshabilitado);
check('bloqueados manda a los ajustes del sitio del navegador', /ajustes del sitio/i.test(bloqueados.detalle ?? ''));
check('el permiso denegado basta aunque el estado local llegue tarde', cara({ permiso: 'denied' }).situacion === 'bloqueados');

const sinPedir = cara({});
check('permiso sin pedir: desactivados, interruptor libre', sinPedir.situacion === 'sin-pedir' && sinPedir.interruptor.visible && !sinPedir.interruptor.encendido && !sinPedir.interruptor.deshabilitado);
check('sin pedir anuncia la pregunta del navegador', /preguntar/i.test(sinPedir.detalle ?? ''));
const permitidos = cara({ permiso: 'granted' });
check('permiso concedido sin suscripción: falta activarlos aquí', permitidos.situacion === 'permitidos-sin-activar' && !permitidos.interruptor.encendido);

const activados = cara({ local: 'activados', permiso: 'granted', servidor: { enabled: true, dispositivos: 2 } });
check('activados: encendido, libre y con prueba', activados.situacion === 'activados' && activados.interruptor.encendido && !activados.interruptor.deshabilitado && activados.puedeProbar && activados.tono === 'ok');
check('solo activados puede probar', !sinPedir.puedeProbar && !bloqueados.puedeProbar && !sinLlaves.puedeProbar);

const activando = cara({ enCurso: 'activando' });
check('activando: encendido en espera, deshabilitado', activando.situacion === 'activando' && activando.interruptor.encendido && activando.interruptor.deshabilitado);
const desactivando = cara({ local: 'activados', permiso: 'granted', enCurso: 'desactivando' });
check('desactivando: apagado en espera, deshabilitado', desactivando.situacion === 'desactivando' && !desactivando.interruptor.encendido && desactivando.interruptor.deshabilitado);
const probando = cara({ local: 'activados', permiso: 'granted', enCurso: 'probando' });
check('probando: activados, pero nada se toca dos veces', probando.situacion === 'activados' && probando.interruptor.deshabilitado && !probando.puedeProbar);

const mudo = cara({ servidor: 'sin-respuesta' });
check('sin respuesta del servidor se muestra lo local y se dice', mudo.situacion === 'sin-pedir' && mudo.servidorSinRespuesta);
check('con respuesta no se anuncia silencio', !sinPedir.servidorSinRespuesta);

check('toda situación tiene línea de estado', [comprobando, sinPush, ios, sinLlaves, bloqueados, sinPedir, permitidos, activados, activando, desactivando].every((c) => c.estado.trim().length > 0));

check('cero dispositivos no se dice', dispositivosEnPalabras(0) === null);
check('un dispositivo, en singular', dispositivosEnPalabras(1) === 'Su cuenta tiene avisos activos en 1 dispositivo.', String(dispositivosEnPalabras(1)));
check('tres dispositivos, en plural', dispositivosEnPalabras(3) === 'Su cuenta tiene avisos activos en 3 dispositivos.', String(dispositivosEnPalabras(3)));
check('la prueba enviada se cuenta', /1 dispositivo\./.test(resultadoDeLaPrueba(1)) && /2 dispositivos\./.test(resultadoDeLaPrueba(2)));
check('la prueba sin destino pide activar', /Active los avisos/.test(resultadoDeLaPrueba(0)));

/* ─── 2. INSTALAR: CADA CASO, Y EL «INSTALADA» QUE SÍ SE VE ──────────────── */
const inst = (c: Partial<Parameters<typeof situacionDeInstalacion>[0]>) =>
  situacionDeInstalacion({ instalada: false, hayEvento: false, esIOS: false, resultado: '', ...c });
check('abierta desde el icono: instalada', inst({ instalada: true, hayEvento: true }) === 'instalada');
check('con evento guardado: instalable', inst({ hayEvento: true }) === 'instalable');
check('aceptada se ve aunque el evento ya se consumió', inst({ resultado: 'aceptada' }) === 'aceptada');
check('rechazada se dice', inst({ resultado: 'rechazada' }) === 'rechazada');
check('iPhone sin evento: instrucciones', inst({ esIOS: true }) === 'ios-instrucciones');
check('lo demás: nada que ofrecer', inst({}) === 'no-disponible');

/* ─── 3. LO QUE SE AVISA ES LO QUE EL SERVIDOR ENVÍA ─────────────────────── */
const archivos = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return n === '__checks__' ? [] : archivos(p);
    return p.endsWith('.ts') ? [p] : [];
  });
const LLAMADA = /\b(enviarAFirma|enviarAUsuario|enviarAlOperador)\(/g;
const llamadas: Record<string, number> = {};
for (const p of archivos(BACKEND)) {
  const rel = relative(BACKEND, p).replace(/\\/g, '/');
  if (rel.startsWith('modules/push/')) continue;
  const n = [...readFileSync(p, 'utf8').matchAll(LLAMADA)].length;
  if (n > 0) llamadas[rel] = n;
}
const ESPERADAS: Record<string, number> = {
  'modules/agenda/avisosDelDia.service.ts': 2,
  'modules/drafts/drafts.service.ts': 2,
  'modules/support/supportChat.service.ts': 2
};
check(
  'las llamadas de envío del backend son las que la lista conoce (si cambia, añada o quite el renglón)',
  JSON.stringify(llamadas, Object.keys(llamadas).sort()) === JSON.stringify(ESPERADAS, Object.keys(ESPERADAS).sort()),
  JSON.stringify(llamadas)
);

const back = (rel: string): string => readFileSync(join(BACKEND, rel), 'utf8');
const AGENDA = back('modules/agenda/avisosDelDia.service.ts');
const HITOS = back('modules/agenda/avisos.ts');
const BORRADORES = back('modules/drafts/drafts.service.ts');
const SOPORTE = back('modules/support/supportChat.service.ts');
const PUSH = back('modules/push/push.service.ts');

const ids = TIPOS_DE_AVISO.map((t) => t.id).sort();
check('cinco tipos, ni uno más', JSON.stringify(ids) === JSON.stringify(['borrador-creado', 'borrador-editado', 'soporte-a-operador', 'soporte-respondio', 'termino']), ids.join(', '));
const tipo = (id: string) => TIPOS_DE_AVISO.find((t) => t.id === id);
const texto = (id: string) => `${tipo(id)?.titulo ?? ''} ${tipo(id)?.detalle ?? ''}`;

check('término: la pasada diaria envía a responsable o a la firma', AGENDA.includes('enviarAUsuario(') && AGENDA.includes('enviarAFirma(') && /responsable/i.test(texto('termino')));
check('término: los hitos del servidor son 5, 2 y 0 días', /HITOS[^=]*=\s*\[5,\s*2,\s*0\]/.test(HITOS) && /cinco días/i.test(texto('termino')) && /dos días/i.test(texto('termino')) && /día del vencimiento/i.test(texto('termino')));
check('término: la pasada corre a las 12:00 UTC (7:00 a. m. en Colombia)', /12:00 UTC/.test(AGENDA) && /7:00 a\. m\./.test(texto('termino')));
check('borrador creado: existe y excluye a quien lo crea', BORRADORES.includes('creó un borrador') && /exceptoEmail:\s*creado\.user_email/.test(BORRADORES) && /otro abogado/i.test(texto('borrador-creado')));
check('borrador editado: existe, cada diez minutos por borrador', BORRADORES.includes('editó un borrador') && /AVISO_CADA_MS\s*=\s*10\s*\*\s*60\s*\*\s*1000/.test(BORRADORES) && /diez minutos/i.test(texto('borrador-editado')));
check('soporte respondió: existe y va a la firma', SOPORTE.includes("'Soporte de Iureon respondió'") && /firma/i.test(texto('soporte-respondio')));
check('mensaje al operador: existe y va por rol SUPER_ADMIN', SOPORTE.includes('nuevo mensaje de soporte') && /q\.eq\('role', 'SUPER_ADMIN'\)/.test(PUSH) && tipo('soporte-a-operador')?.soloOperador === true);
check('el operador no se le ofrece a un abogado', !tiposQueLeLlegan(false).some((t) => t.soloOperador) && tiposQueLeLlegan(true).length === TIPOS_DE_AVISO.length);
const inventados = TIPOS_DE_AVISO.map((t) => `${t.titulo} ${t.detalle}`).join(' ');
check('ningún tipo inventado (transcripción, saldo, plan, audiencia, pago)', !/transcrip|saldo|plan\b|audiencia|pago/i.test(inventados));

/* ─── 4. LAS PANTALLAS, LEÍDAS COMO TEXTO ────────────────────────────────── */
const sinComentarios = (codigo: string): string =>
  codigo
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
const leer = (ruta: string): string => sinComentarios(readFileSync(join(SRC, ruta), 'utf8'));
const AVISOS = leer('modules/push/components/AvisosEnEsteDispositivo.tsx');
const INSTALAR = leer('modules/pwa/InstalarApp.tsx');
const APP = leer('App.tsx');

check('Avisos abre su alcance: raíz cara-nueva cn-avi', /className=\{?[`"]cara-nueva cn-avi\b/.test(AVISOS));
check('Instalar abre su alcance: raíz cara-nueva cn-avi', /className=\{?[`"]cara-nueva cn-avi-instalar\b/.test(INSTALAR));
check('el estado lo decide el ayudante puro', AVISOS.includes('caraDeLosAvisos(') && INSTALAR.includes('situacionDeInstalacion('));
check('el interruptor es un switch con nombre y estado', AVISOS.includes('role="switch"') && AVISOS.includes('aria-checked={') && /aria-label="[^"]+"/.test(AVISOS.slice(AVISOS.indexOf('role="switch"') - 400, AVISOS.indexOf('role="switch"') + 400)));
check('el estado se anuncia a lectores de pantalla', AVISOS.includes('aria-live="polite"'));
check('el error del servidor se dice como alerta', AVISOS.includes('role="alert"'));
check('la lista sale de los tipos, no de un párrafo escrito a mano', AVISOS.includes('tiposQueLeLlegan(') && !/borrador nuevo|tres cosas/i.test(AVISOS));
check('Avisos ya no repite las instrucciones de instalar', !AVISOS.includes('<InstalarApp'));
check('el permiso se lee del navegador, sin romper donde no existe', /typeof Notification/.test(AVISOS) && AVISOS.includes('Notification.permission'));
for (const s of ['instalada', 'aceptada', 'instalable', 'ios-instrucciones', 'rechazada']) {
  check(`Instalar pinta «${s}»`, INSTALAR.includes(`'${s}'`));
}
const bloqueDialogo = APP.slice(APP.indexOf('abierto={avisosAbiertos}') - 20, APP.indexOf('</Dialog>', APP.indexOf('abierto={avisosAbiertos}')));
check('el diálogo le pasa al operador su tipo de aviso', bloqueDialogo.includes('esOperador={esSuperusuario}'));

/* ─── 5. EL BLOQUE DE CSS NO SE SALE DE `.cara-nueva` ───────────────────── */
const CSS = readFileSync(join(SRC, 'design', 'cara-nueva.css'), 'utf8');
const MARCA = '/* ─── Avisos ─── */';
const FIN = '/* ─── fin Avisos ─── */';
const inicio = CSS.indexOf(MARCA);
const final = CSS.indexOf(FIN);
check('cara-nueva.css tiene el bloque de Avisos, cerrado', inicio !== -1 && final > inicio);
const bloque = inicio === -1 || final === -1 ? '' : CSS.slice(inicio + MARCA.length, final).replace(/\/\*[\s\S]*?\*\//g, ' ');
const sueltos: string[] = [];
const ajenos: string[] = [];
const reglas: Record<string, string> = {};
for (const m of bloque.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  const cabeza = m[1].replace(/@media[^{]*\{/g, '').trim();
  for (const sel of cabeza.split(',').map((s) => s.trim()).filter(Boolean)) {
    const bien =
      sel.startsWith('.cara-nueva') ||
      sel.startsWith(":root:not([data-theme='light']) .cara-nueva") ||
      sel.startsWith(":root[data-theme='dark'] .cara-nueva");
    if (!bien) sueltos.push(sel);
    if (!/cn-avi/.test(sel)) ajenos.push(sel);
    reglas[sel] = (reglas[sel] ?? '') + m[2];
  }
}
check('todo selector del bloque vive bajo .cara-nueva', bloque !== '' && sueltos.length === 0, sueltos.join(' · '));
check('todo selector del bloque es de cn-avi', bloque !== '' && ajenos.length === 0, ajenos.join(' · '));
check(
  'el bloque trae su modo oscuro por los dos caminos',
  bloque.includes(":root:not([data-theme='light']) .cara-nueva") && bloque.includes(":root[data-theme='dark'] .cara-nueva")
);
const chicos = [...bloque.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)].map((m) => Number(m[1])).filter((n) => n < 14);
check('ningún tamaño del bloque baja de 14 px', bloque !== '' && chicos.length === 0, chicos.join(', '));
for (const sel of ['.cara-nueva .cn-avi-interruptor', '.cara-nueva .cn-avi-boton']) {
  check(`${sel} mide al menos 44 px`, /min-height:\s*(4[4-9]|[5-9]\d)px/.test(reglas[sel] ?? ''), reglas[sel] ?? 'sin regla');
}
check('el interruptor enseña el foco', /outline/.test(reglas['.cara-nueva .cn-avi-interruptor:focus-visible'] ?? ''));

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
