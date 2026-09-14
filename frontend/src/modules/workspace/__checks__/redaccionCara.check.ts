/**
 * Guarda la cara nueva de Redacción —la barra en cascada, el panel de la
 * instrucción y el lienzo— contra lo que la maqueta promete y el producto no
 * hace, y contra lo que la piel no puede tumbar.
 *
 * Run with: npm run check:redaccion-cara
 *
 * ─── LOS DEFECTOS QUE VIGILA ───────────────────────────────────────────────
 *
 * El artboard 10 de `public/handoff/app-redaccion-revision.html` se dibujó con
 * un panel lateral viejo con «Saldo $14.000» y «Un escrito cuesta $2.000», y el
 * bloque «No sé cómo se llama» con «$300». Ninguna de las tres cifras es
 * verdad: el panel lateral ya es otro, $2.000 es un PISO (se cobra el mayor
 * entre el piso y lo medido) y la orientación de la guía es gratis diez veces
 * al día y después cuesta `PRICE_COP.ORIENTACION`. Copiarlas no rompe nada.
 *
 * Y la cascada: quién firma → rama → actuación, con las tres salidas de
 * servicio antes de toda ficha y la lista en orden alfabético español. Un
 * reordenamiento de JSX la deshace sin que falle nada.
 *
 * Lo que la piel no puede tumbar: la raíz con su visita guiada, el selector de
 * caso del que depende `check:posicion-expediente`, la letra del papel que
 * manda `estiloDelLienzo` y las acciones del taller (README-app §2).
 *
 * Se leen los componentes como TEXTO y sin comentarios: los comentarios que
 * explican por qué no hay precio contienen las cifras.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Actuacion } from '../../catalog/types';
import { articuloDe, estadoDeLaFicha, ordenarParaLaLista } from '../services/fichaEnLaLista';
import { desacuerdoDeRama, ramaAlElegirCaso } from '../services/ramaDelCaso';

const AQUI = dirname(fileURLToPath(import.meta.url));
const SRC = join(AQUI, '..', '..', '..');

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

const leer = (ruta: string): string => sinComentarios(readFileSync(join(SRC, ruta), 'utf8'));

const APP = leer('App.tsx');
const BARRA = leer('modules/workspace/components/WorkshopConfigBar.tsx');
const MOVIL = leer('modules/workspace/components/WorkshopConfigMobile.tsx');
const PESTANAS = leer('modules/workspace/components/MobileWorkshopTabs.tsx');
const PANEL = leer('modules/workspace/components/AgentPanelLeft.tsx');
const CONSOLA = leer('modules/agent/components/AgentConsoleStream.tsx');
const LIENZO = leer('modules/workspace/components/DocumentCanvasRight.tsx');
const VISOR = leer('modules/documents/components/LegalDraftViewer.tsx');
const PROCEDENCIA = leer('modules/documents/components/DraftProvenanceBar.tsx');
const SELECTOR = leer('modules/workspace/components/SelectorEnCascada.tsx');
const BARRA_BORRADOR = leer('modules/workspace/components/BarraDelBorrador.tsx');
const RESPALDO = leer('modules/workspace/components/LoQueRespaldaElEscrito.tsx');
const ELEGIDA = leer('modules/workspace/components/ActuacionElegida.tsx');
const GUIA = leer('modules/workspace/components/GuiaEligeActuacionDialog.tsx');
const PROPIA = leer('modules/workspace/components/ActuacionPropiaDialog.tsx');
const SIN_ACTUACION = leer('modules/workspace/components/EscritoSinNombreDialog.tsx');
const CABECERA = leer('modules/tenant/components/HeaderTop.tsx');
const CABECERA_MOVIL = leer('modules/tenant/components/MobileHeader.tsx');
const MANUAL = leer('modules/help/content/manual.ts');

/*
 * Las pantallas de la unidad de Redacción de septiembre de 2026 entran a la lista:
 * la barra del borrador, la columna de respaldo, la tarjeta de la actuación y los
 * tres diálogos de servicio. Sobre todas corren las mismas reglas de precio,
 * ejemplos y escala.
 */
const PANTALLAS: Record<string, string> = {
  'WorkshopConfigBar.tsx': BARRA,
  'WorkshopConfigMobile.tsx': MOVIL,
  'MobileWorkshopTabs.tsx': PESTANAS,
  'AgentPanelLeft.tsx': PANEL,
  'AgentConsoleStream.tsx': CONSOLA,
  'DocumentCanvasRight.tsx': LIENZO,
  'LegalDraftViewer.tsx': VISOR,
  'DraftProvenanceBar.tsx': PROCEDENCIA,
  'SelectorEnCascada.tsx': SELECTOR,
  'BarraDelBorrador.tsx': BARRA_BORRADOR,
  'LoQueRespaldaElEscrito.tsx': RESPALDO,
  'ActuacionElegida.tsx': ELEGIDA,
  'GuiaEligeActuacionDialog.tsx': GUIA,
  'ActuacionPropiaDialog.tsx': PROPIA,
  'EscritoSinNombreDialog.tsx': SIN_ACTUACION
};

/* ─── 1. LA RAÍZ Y LAS PIELES ───────────────────────────────────────────── */
check(
  'App.tsx: la raíz de Redacción conserva la visita guiada y lleva la cara nueva',
  /data-visita="vista-workspace"\s+className="cara-nueva [^"]*"/.test(APP)
);
const RAICES: [string, string, string][] = [
  ['WorkshopConfigBar.tsx', BARRA, 'className="cn-red-barra"'],
  ['WorkshopConfigMobile.tsx', MOVIL, 'className="cn-red-movil"'],
  ['MobileWorkshopTabs.tsx', PESTANAS, 'className="cn-red-pestanas'],
  ['AgentPanelLeft.tsx', PANEL, '`cn-red-panel '],
  ['AgentConsoleStream.tsx', CONSOLA, 'className="cn-red-consola"'],
  ['DocumentCanvasRight.tsx', LIENZO, '`cn-red-lienzo '],
  ['LegalDraftViewer.tsx', VISOR, 'className="paper-canvas cn-red-papel '],
  ['DraftProvenanceBar.tsx', PROCEDENCIA, "'cn-red-procedencia cn-red-procedencia--ambar'"],
  ['BarraDelBorrador.tsx', BARRA_BORRADOR, 'className="cn-red-bdb hidden lg:flex"'],
  ['LoQueRespaldaElEscrito.tsx', RESPALDO, 'className="cn-red-respaldo-cuerpo"'],
  ['ActuacionElegida.tsx', ELEGIDA, 'className="cn-red-elegida"'],
  /* Los diálogos abren su propio alcance: el marco compartido vive fuera de `.cara-nueva`. */
  ['GuiaEligeActuacionDialog.tsx', GUIA, 'className="cara-nueva cn-red-dlg"'],
  ['ActuacionPropiaDialog.tsx', PROPIA, 'className="cara-nueva cn-red-dlg"'],
  ['EscritoSinNombreDialog.tsx', SIN_ACTUACION, 'className="cara-nueva cn-red-dlg"']
];
for (const [nombre, codigo, raiz] of RAICES) check(`${nombre} lleva su piel cn-red`, codigo.includes(raiz), raiz);

/* ─── 2. LO QUE LA PIEL NO PUEDE TUMBAR ─────────────────────────────────── */
for (const [nombre, codigo] of [['WorkshopConfigBar.tsx', BARRA], ['WorkshopConfigMobile.tsx', MOVIL]]) {
  check(
    `${nombre} ofrece el caso con el gancho compartido`,
    /expedienteId/.test(codigo) && /De qu[eé] caso/.test(codigo) && /useExpedientes\(\)/.test(codigo)
  );
  check(
    `${nombre} conserva los tres diálogos y la rama de la candidata`,
    ['<GuiaEligeActuacionDialog', '<ActuacionPropiaDialog', '<EscritoSinNombreDialog', 'onElegir={(exactName, branch)', 'if (branch) setLegalBranch(branch)'].every(
      (t) => codigo.includes(t)
    )
  );
}
check(
  'el panel conserva instrucción, adjuntos con sus límites, revisión, consola y visor',
  ['Qué debe hacer este escrito', 'admitirArchivo(', 'MAX_ADJUNTOS', 'MAX_BYTES_TOTAL', '<RevisarEscritoDialog', '<AgentConsoleStream', '<VisorDeArchivo'].every((t) =>
    PANEL.includes(t)
  )
);
check('la consola sigue siendo «Ejecución»', CONSOLA.includes('Ejecución'));
check(
  'el lienzo conserva sus dos pestañas y el vacío',
  ['>Documento<', '>Expediente<', 'Aún no hay borrador', 'Abrir un borrador guardado'].every((t) => LIENZO.includes(t))
);
/*
 * CAMBIÓ EL 14 DE SEPTIEMBRE DE 2026: la franja de procedencia salió del visor y
 * pasó al lienzo, a todo lo ancho bajo la barra del borrador (artboard 756–841).
 * Por eso `<DraftProvenanceBar` se busca en el lienzo; las acciones del taller
 * siguen todas en el visor.
 */
check('la franja de procedencia sigue sobre el borrador, ahora a todo lo ancho', LIENZO.includes('<DraftProvenanceBar'));
check(
  'el papel conserva todas las acciones del taller (README-app §2)',
  ['Taller', "'Ver' : 'Editar'", 'Sugerir jerga', 'Enseñar estilo', 'Mis borradores', 'Guardar', '<ControlDeLetra'].every((t) => VISOR.includes(t))
);
check(
  'la letra del papel sigue llegando de la firma y del control de letra',
  VISOR.includes('estiloDelLienzo(formato)') &&
    VISOR.includes("useTamanoDeLetra('borrador')") &&
    (VISOR.match(/style=\{estiloLectura\}/g) ?? []).length === 2 &&
    (VISOR.match(/font-legal/g) ?? []).length === 2
);

/* ─── 3. LA CASCADA, EN ESTE ORDEN Y CON SUS FLECHAS ────────────────────── */
{
  const rol = BARRA.indexOf('etiqueta="Quién firma"');
  const rama = BARRA.indexOf('etiqueta="Rama"');
  const act = BARRA.indexOf('etiqueta="Actuación"');
  check('escritorio: quién firma → rama → actuación', rol !== -1 && rol < rama && rama < act, `${rol} ${rama} ${act}`);
  check(
    'escritorio: una flecha entre cada par de cajas',
    BARRA.slice(rol, rama).includes('<Flecha />') && BARRA.slice(rama, act).includes('<Flecha />')
  );
  const mRol = MOVIL.indexOf('>Quién firma<');
  const mRama = MOVIL.indexOf('>Rama<');
  const mAct = MOVIL.indexOf('>Actuación<');
  check('móvil: quién firma → rama → actuación', mRol !== -1 && mRol < mRama && mRama < mAct, `${mRol} ${mRama} ${mAct}`);
  check('móvil: las listas siguen siendo nativas', (MOVIL.match(/<select\b/g) ?? []).length >= 3 && !MOVIL.includes('SelectorEnCascada'));
}

/* ─── 4. LAS TRES SALIDAS VAN ANTES DE TODA FICHA ───────────────────────── */
{
  /*
   * EL ORDEN CAMBIÓ EL 14 DE SEPTIEMBRE DE 2026, con los nombres que aprobó el
   * titular: de más a menos respaldo. La guía propone fichas verificadas;
   * «la escribo yo» conserva un nombre; «Redactar sin actuación» renuncia a los
   * dos y va la última.
   */
  const g = BARRA.indexOf('valor: OPCION_GUIA');
  const s = BARRA.indexOf('valor: OPCION_SIN_NOMBRE');
  const p = BARRA.indexOf('valor: OPCION_PROPIA');
  const fichas = BARRA.indexOf('ordenarParaLaLista(');
  check('escritorio: guía → la escribo yo → sin actuación, antes de las fichas', g !== -1 && g < p && p < s && s < fichas, `${g} ${p} ${s} ${fichas}`);
  check(
    'escritorio: las tres salidas con los nombres aprobados',
    [
      "'No sé cuál es: que la guía la proponga'",
      "'Cuente los hechos y la guía le propone actuaciones del catálogo.'",
      "'No está en la lista: la escribo yo'",
      "'Usted pone el nombre; el escrito dirá que no tiene norma verificada.'",
      "'Redactar sin actuación'",
      "'Describa qué debe lograr el escrito; saldrá sin norma ni término verificados.'"
    ].every((t) => BARRA.includes(t))
  );
  check(
    'los nombres viejos no vuelven a ninguna pantalla ni al manual',
    ![...Object.values(PANTALLAS), MANUAL].some((c) => /Que la gu[ií]a proponga la actuaci[oó]n…|No s[eé] c[oó]mo se llama: describir|Ninguna de estas: escribir el nombre/.test(c))
  );
  const inicioTipo = BARRA.indexOf('const opcionesTipo');
  const finTipo = BARRA.indexOf('[catalogo.actuaciones]', inicioTipo);
  check('escritorio: las salidas no están entre las fichas (ni se ordenan ni se filtran)', inicioTipo !== -1 && !/OPCION_/.test(BARRA.slice(inicioTipo, finTipo)));
  check('escritorio: las salidas se pintan en el bloque de antes de la lista', /antesDeLaLista=\{\(cerrar\) => \([\s\S]*SERVICIOS\.map/.test(BARRA));
  check('el selector pinta ese bloque antes de las filas filtradas', SELECTOR.indexOf('antesDeLaLista?.(') !== -1 && SELECTOR.indexOf('antesDeLaLista?.(') < SELECTOR.indexOf('visibles.map('));

  const mg = MOVIL.indexOf('value={OPCION_GUIA}');
  const ms = MOVIL.indexOf('value={OPCION_SIN_NOMBRE}');
  const mp = MOVIL.indexOf('value={OPCION_PROPIA}');
  const mf = Math.min(...['propias.map(', 'prestadas.map('].map((t) => MOVIL.indexOf(t)).filter((i) => i !== -1));
  check('móvil: guía → la escribo yo → sin actuación, antes de las fichas', mg !== -1 && mg < mp && mp < ms && ms < mf, `${mg} ${mp} ${ms} ${mf}`);
  check('móvil: cada salida aparece una sola vez', ['value={OPCION_GUIA}', 'value={OPCION_SIN_NOMBRE}', 'value={OPCION_PROPIA}'].every((t) => MOVIL.split(t).length === 2));
  check('móvil: las salidas en su grupo propio', /<optgroup label="Si no está en la lista">\s*<option value=\{OPCION_GUIA\}/.test(MOVIL));
}

/* ─── 5. ORDEN ALFABÉTICO EN ESPAÑOL, POR BLOQUES ───────────────────────── */
{
  const prestada = { ramaFuente: 'CIVIL' } as unknown as NonNullable<Actuacion['porRemision']>;
  const lista = [
    { exactName: 'Nulidad' },
    { exactName: 'Zeta prestada', porRemision: prestada },
    { exactName: 'Ñame' },
    { exactName: 'Apelación' },
    { exactName: 'Amparo prestado', porRemision: prestada },
    { exactName: 'acción de tutela' },
    { exactName: 'Árbitro' }
  ];
  const copia = lista.map((x) => x.exactName).join('|');
  const orden = ordenarParaLaLista(lista).map((x) => x.exactName);
  check(
    'propias en orden español (tildes y mayúsculas no cuentan; ñ tras n) y luego las prestadas',
    orden.join('|') === 'acción de tutela|Apelación|Árbitro|Nulidad|Ñame|Amparo prestado|Zeta prestada',
    orden.join(' · ')
  );
  check('ordenar no muta la lista compartida', lista.map((x) => x.exactName).join('|') === copia);
  check('escritorio y móvil usan el mismo orden', BARRA.includes('ordenarParaLaLista(catalogo.actuaciones)') && MOVIL.includes('ordenarParaLaLista(catalogo.actuaciones)'));
}

/* ─── 6. EL ESTADO DE LA FILA DICE SOLO LO QUE LA FICHA TRAE ────────────── */
{
  check('el artículo sale del fundamento tal como está escrito', articuloDe('Ley 1564 de 2012, art. 96') === 'art. 96');
  check('sin artículo en el fundamento no se pinta ninguno', articuloDe('Decreto 2591 de 1991') === null && articuloDe(null) === null);
  const base = { exactName: 'X', legalBasis: 'Ley 0 de 0000, art. 000', term: { status: 'VERIFICADO' } } as unknown as Actuacion;
  const ok = estadoDeLaFicha(base, false);
  check('lo verificado es el término, no el artículo', ok.texto === 'término verificado' && ok.articulo === 'art. 000' && ok.tono === 'ok');
  const sin = estadoDeLaFicha({ ...base, term: { status: 'NO_VERIFICADO' } } as unknown as Actuacion, false);
  check('sin verificar va con el tono del guion y sin artículo', sin.tono === 'sin' && sin.articulo === null);
  const firma = estadoDeLaFicha({ ...base, firmDefined: true } as Actuacion, false);
  check('la de la firma dice que no tiene norma verificada', firma.texto === 'de su firma, sin norma verificada' && firma.tono === 'sin');
}

/* ─── 5b. LAS DOS PANTALLAS: ASISTENTE Y BORRADOR ───────────────────────── */
{
  check('App: el asistente se ve sin borrador o cuando se vuelve a él', /const verAsistente = !workflow\.generatedDraft \|\| vistaTaller === 'instruccion'/.test(APP));
  check('App: el asistente se oculta, no se desmonta', APP.includes('oculto={!verAsistente}') && APP.includes('oculto={verAsistente}'));
  check('App: no se salta al papel mientras el escrito se genera', APP.includes("if (tituloGenerado && !workflow.isProcessing) setVistaTaller('documento')"));
  check('App: la barra del borrador solo con borrador y fuera del asistente', APP.includes('{workflow.generatedDraft && !verAsistente && (') && APP.includes('<BarraDelBorrador'));
  check('el hook enciende «generando» al empezar', /setIsProcessing\(true\)/.test(leer('modules/workspace/hooks/useLegalAgentWorkflow.ts')));
  check(
    'el asistente trae su título, sus pasos y el precio con «desde»',
    ['Redactar un escrito', 'titulo="Qué va a presentar"', 'titulo="Los hechos y las pruebas"', 'Desde $2.000 de su saldo; un escrito largo cuesta lo que mida.'].every((t) =>
      PANEL.includes(t)
    )
  );
  check('«Cómo escribe su firma» solo existe con Membrete configurado y sin interruptor', /\{formatoDeFirmaConfigurado && \(\s*<Paso n=\{3\} titulo="Cómo escribe su firma">/.test(PANEL) && !/type="checkbox"[^>]*role="switch"|role="switch"/.test(PANEL));
  check('la consola va debajo del botón, solo cuando hay algo que decir', PANEL.indexOf('className="cn-red-generar"') < PANEL.indexOf('<AgentConsoleStream') && PANEL.includes('isProcessing || logs.length > 0'));
  check('el asistente no promete lo que no existe', !/Usar[aá] los \d+ documentos|Armar el borrador|jerga que usted ense[nñ][oó]/.test(PANEL));

  check(
    'la cabecera global ya no repite las acciones del escrito',
    !/setRightView|onExportWord|onExportPdf|Marcar listo|Vista dividida|Pantalla completa|>Documento<|'Documento'/.test(CABECERA) && CABECERA.includes('onLogout')
  );
  check('la cabecera no ofrece «Firmas» en Redacción: vive en la barra lateral', CABECERA.includes('!enRedaccion'));
  check(
    'la barra del borrador reúne Word, PDF, Copiar, las opciones y «Marcar como listo»',
    ['>\n          Word', '>\n          PDF', "'Copiar'", 'Membrete de la firma', 'Marcar como listo', 'Modo concentración'].every((t) => BARRA_BORRADOR.includes(t))
  );
  check('la hoja de fuentes solo se ofrece cuando hay fuentes', /\{hayFuentes && \(\s*<label[^>]*>[\s\S]*?Anexar hoja de fuentes citadas/.test(BARRA_BORRADOR));
  check("«Marcar como listo» no aparece en LISTO ni en RADICADO", BARRA_BORRADOR.includes("estado !== 'LISTO' && estado !== 'RADICADO'"));
  check("el menú del teléfono tampoco lo ofrece sobre un borrador radicado", CABECERA_MOVIL.includes("estadoDelBorrador !== 'RADICADO'") && CABECERA_MOVIL.includes('Marcar como listo'));
  check('la barra del borrador no pinta una hora relativa que no se refresca', !/hace un minuto|hace \d+ minutos/.test(BARRA_BORRADOR));

  check('el lienzo ya no cuenta «Secciones exigidas N/M»: lo dice la columna, sección por sección', !LIENZO.includes('Secciones exigidas') && RESPALDO.includes('seccionesEnElEscrito('));
  check(
    'la columna dice lo medido: «encontrada» o «no se encontró el rótulo», con salto al párrafo',
    ["'encontrada'", "'no se encontró el rótulo'", 'Ir al párrafo', 'Secciones que pide la ficha', 'Ver la norma'].every((t) => RESPALDO.includes(t))
  );
  check('la columna no inventa «De dónde sale cada cosa»', !/De d[oó]nde sale cada cosa/.test(RESPALDO + VISOR));
  check('el término de la columna no va en mono', !/cn-red-mono[^>]*>\s*\{actuacion\.term\.description/.test(RESPALDO + ELEGIDA));
  check('la tarjeta dice «término verificado» y no «Término y artículo comprobados»', !/T[eé]rmino y art[ií]culo comprobados/.test(ELEGIDA + BARRA + MOVIL) && ELEGIDA.includes('estadoDeLaFicha('));

  check('«Enseñar estilo» ya no dice «Aprendido»', !/Aprendido/.test(VISOR));
  check(
    '«Enseñar estilo» y «Sugerir jerga» siguen cableados pero apagados, con «Próximamente»',
    /onClick=\{handleSaveAndTeachStyle\} disabled/.test(VISOR) && /onClick=\{\(\) => setIsJargonModalOpen\(true\)\} disabled/.test(VISOR) && VISOR.includes('Próximamente')
  );
  check('la columna y «Trabajar el escrito» se van en modo concentración', VISOR.includes('{!isFocusMode && (') && VISOR.includes('{isFocusMode && trabajar}'));
  check('lo editado sale con keepalive también al desmontar el visor', /return \(\) => \{[\s\S]*?removeEventListener\('pagehide', vaciar\);\s*vaciar\(\);/.test(VISOR));
  check('el Taller sigue apagable desde la operación', VISOR.includes("useFuncionHabilitada('REDACCION.TALLER_BORRADOR')"));

  check('el diálogo de la guía no afirma precio ni cupo', !/\$\s?\d|gratis|cupo/i.test(GUIA));
  check('«Escribir la actuación yo» no ofrece campos que no existen', !/Qu[eé] debe llevar el escrito|Proponerla al cat[aá]logo/.test(PROPIA));
}

/* ─── 6b. LA RAMA ES DEL CASO, NO DEL CLIENTE ───────────────────────────── */
{
  const ETIQUETAS: Record<string, string> = { CIVIL: 'Civil', LABORAL: 'Laboral' };
  check('un caso con rama la propone si todavía no hay actuación', ramaAlElegirCaso('LABORAL', 'CIVIL', false, ETIQUETAS) === 'LABORAL');
  check('con actuación elegida el caso no la pisa', ramaAlElegirCaso('LABORAL', 'CIVIL', true, ETIQUETAS) === null);
  check('si ya coincide no hay nada que cambiar', ramaAlElegirCaso('CIVIL', 'CIVIL', false, ETIQUETAS) === null);
  check('un caso sin rama no cambia nada', ramaAlElegirCaso(null, 'CIVIL', false, ETIQUETAS) === null && desacuerdoDeRama(null, 'CIVIL', ETIQUETAS) === null);
  check('una rama que el catálogo no conoce no se propone ni se avisa', ramaAlElegirCaso('INVENTADA', 'CIVIL', false, ETIQUETAS) === null && desacuerdoDeRama('INVENTADA', 'CIVIL', ETIQUETAS) === null);
  const d = desacuerdoDeRama('LABORAL', 'CIVIL', ETIQUETAS);
  check(
    'el desacuerdo se dice con las etiquetas de las dos ramas',
    d !== null && d.delCaso === 'LABORAL' && d.texto === 'Este caso está registrado en Laboral; el escrito se está redactando en Civil.' && d.boton === 'Usar Laboral',
    d?.texto ?? 'null'
  );
  check('sin desacuerdo no hay aviso', desacuerdoDeRama('CIVIL', 'CIVIL', ETIQUETAS) === null);
  for (const [nombre, codigo] of [['WorkshopConfigBar.tsx', BARRA], ['WorkshopConfigMobile.tsx', MOVIL]]) {
    check(`${nombre}: elegir el caso consulta su rama y avisa el desacuerdo`, codigo.includes('ramaAlElegirCaso(') && codigo.includes('desacuerdoDeRama('));
  }
}

/* ─── 7. PRECIOS QUE LA MAQUETA INVENTA ─────────────────────────────────── */
for (const [nombre, codigo] of Object.entries(PANTALLAS)) {
  check(`${nombre} no pinta «Saldo $14.000»`, !/\$\s*14\.000/.test(codigo), 'el panel lateral ya es otro');
  check(`${nombre} no pinta «$300»`, !/\$\s*300\b/.test(codigo), 'la guía es gratis diez al día y después PRICE_COP.ORIENTACION');
  check(
    `${nombre} no dice «cuesta $2.000» sin «desde»`,
    !/cuesta\s+(?!desde)[^.]{0,20}\$\s*2\.000/i.test(codigo),
    '$2.000 es el piso, no el precio'
  );
}
for (const [nombre, codigo] of [['WorkshopConfigBar.tsx', BARRA], ['WorkshopConfigMobile.tsx', MOVIL]]) {
  check(`${nombre} no anuncia ningún precio`, !/\$\s?\d/.test(codigo), 'ninguna cifra de la barra está probada en código');
}

/* ─── 8. EJEMPLOS DE MENTIRA Y ESCALA ───────────────────────────────────── */
for (const [nombre, codigo] of Object.entries(PANTALLAS)) {
  check(`${nombre} no trae un despacho verosímil`, !/Juzgado\s+(?!00\b)\d+/i.test(codigo), 'README-app §3: «Juzgado 00 …»');
  check(`${nombre} no trae un radicado verosímil`, !/\b(?!0+\b)\d{15,}\b/.test(codigo), 'README-app §3: ceros');
  check(
    `${nombre}: nada por debajo de 14 px escrito a mano`,
    !/text-\[(?:\d|1[0-3])(?:\.\d+)?px\]|\btext-(?:meta|label|ui|subtitle)\b|btn-sm/.test(codigo),
    'la escala de la cara nueva empieza en 14'
  );
}

/* ─── 9. EL BLOQUE DE CSS NO SE SALE DE `.cara-nueva` ───────────────────── */
const CSS = readFileSync(join(SRC, 'design', 'cara-nueva.css'), 'utf8');
const MARCA = '/* ─── Redacción ─── */';
const inicio = CSS.indexOf(MARCA);
check('cara-nueva.css tiene el bloque de Redacción', inicio !== -1);
/* El bloque termina donde empieza el siguiente que otra pantalla añada después. */
const siguiente = CSS.indexOf('/* ─── ', inicio + MARCA.length);
const bloque = CSS.slice(inicio, siguiente === -1 ? undefined : siguiente).replace(/\/\*[\s\S]*?\*\//g, ' ');
const sueltos: string[] = [];
const ajenos: string[] = [];
const guiones: string[] = [];
const papel: string[] = [];
for (const m of bloque.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  const cabeza = m[1].replace(/@media[^{]*\{/g, '').trim();
  const cuerpo = m[2];
  for (const sel of cabeza.split(',').map((s) => s.trim()).filter(Boolean)) {
    const bien =
      sel.startsWith('.cara-nueva') ||
      sel.startsWith(":root:not([data-theme='light']) .cara-nueva") ||
      sel.startsWith(":root[data-theme='dark'] .cara-nueva");
    if (!bien) sueltos.push(sel);
    if (!/\.cn-red-/.test(sel)) ajenos.push(sel);
    /* El guion es solo de «sin verificar». */
    if (/dashed/.test(cuerpo) && !/--sin\b|--ambar\b|cn-red-sin-actuacion/.test(sel)) guiones.push(sel);
    /* Y la letra del papel no la toca la piel. */
    if (/cn-red-papel(?![\w-])/.test(sel) && /font-(?:family|size)|line-height/.test(cuerpo)) papel.push(sel);
  }
}
check('todo selector del bloque vive bajo .cara-nueva', sueltos.length === 0, sueltos.join(' · '));
check('todo selector del bloque es de cn-red', ajenos.length === 0, ajenos.join(' · '));
check('el borde discontinuo solo aparece en lo que no está verificado', guiones.length === 0, guiones.join(' · '));
check('ninguna regla cambia la letra del papel', papel.length === 0, papel.join(' · '));
const chicos = [...bloque.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)].map((m) => Number(m[1])).filter((n) => n < 14);
check('ningún tamaño del bloque baja de 14 px', chicos.length === 0, chicos.join(', '));
check(
  'el bloque trae su modo oscuro por los dos caminos',
  bloque.includes(":root:not([data-theme='light']) .cara-nueva") && bloque.includes(":root[data-theme='dark'] .cara-nueva")
);
check('el rojo de peligro no se usa en el bloque', !/var\(--danger\)(?!-bg)/.test(bloque), '#8C2F26 solo para lo destructivo');

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
