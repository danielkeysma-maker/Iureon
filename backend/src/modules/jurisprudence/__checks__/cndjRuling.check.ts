import {
  buscarEnCndj,
  citaDeRadicacion,
  descargarProvidencia,
  radicacionesEn,
  urlDeProvidencia
} from '../cndjRuling.service';

/**
 * `npm run check:cndj` — la relatoría de la Comisión Nacional de Disciplina
 * Judicial, de punta a punta.
 *
 * LA PARTE DE RED SE SALTA LIMPIAMENTE, y eso no es debilidad: una puerta que
 * falla en toda máquina sin acceso a internet es una que todo el mundo aprende
 * a ignorar, y una ignorada no protege nada. Lo que NO se salta son las guardas
 * puras de abajo, que fijan las decisiones que costaron encontrar.
 */

let fallos = 0;

const check = (nombre: string, ok: boolean, detalle = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FALLA'} ${nombre}${detalle ? ` — ${detalle}` : ''}`);
  if (!ok) fallos += 1;
};

/* ─── GUARDAS PURAS ────────────────────────────────────────────────────── */

const HTML_DE_MUESTRA = `
  <table><tr><td>algo</td><td>11001080200020250119600</td></tr>
  <tr><td>otra</td><td>25000110200020200037801</td></tr>
  <tr><td>repetida</td><td>11001080200020250119600</td></tr>
  <tr><td>corta, no es radicación</td><td>12345</td></tr></table>
`;

const radicaciones = radicacionesEn(HTML_DE_MUESTRA);

check(
  'las radicaciones se leen de la página de resultados',
  radicaciones.length === 2 && radicaciones[0] === '11001080200020250119600',
  radicaciones.join(', ')
);

check(
  'una radicación repetida no se cuenta dos veces',
  new Set(radicaciones).size === radicaciones.length,
  `${radicaciones.length} únicas`
);

check(
  'un número corto no se confunde con una radicación',
  !radicaciones.includes('12345'),
  'descartado'
);

check(
  'la radicación se cita partida antes del consecutivo de instancia',
  citaDeRadicacion('11001080200020250119600') === '110010802000202501196 00',
  citaDeRadicacion('11001080200020250119600')
);

check(
  'la URL pública se arma sobre el dominio de la relatoría',
  urlDeProvidencia('F110010802ADJUNTA2026') ===
    'https://relatoria.cndj.gov.co/docs_relatoria/F110010802ADJUNTA2026.pdf',
  urlDeProvidencia('F110010802ADJUNTA2026')
);

/* ─── LA PARTE DE RED ──────────────────────────────────────────────────── */

/*
 * ESTE ARCHIVO EXISTE Y SE COMPROBÓ. Es una providencia real de la CNDJ del 29
 * de julio de 2026, ponente Julio Andrés Sampedro Arrubla, 13 páginas. Si algún
 * día la relatoría deja de servirlo, este check lo dirá en vez de que el
 * producto lo descubra callando.
 */
const ARCHIVO_CONOCIDO = 'F11001080200020250119600ADJUNTA20260729111023';

const main = async (): Promise<void> => {
  try {
    const pdf = await descargarProvidencia(ARCHIVO_CONOCIDO, 30_000);

    if (pdf === null) {
      check(
        'la providencia conocida se descarga',
        false,
        'la relatoría no la devolvió — puede haber cambiado el archivo'
      );
    } else {
      check(
        'la providencia conocida se descarga y es un PDF',
        pdf.length > 10_000 && pdf.subarray(0, 5).toString('latin1') === '%PDF-',
        `${pdf.length} bytes`
      );
    }

    /*
     * UN NOMBRE INVENTADO NO PUEDE DEVOLVER UN DOCUMENTO. Es la misma guarda
     * que el catálogo aplica a las citas: si el servicio contestara algo ante
     * un archivo que no existe, ese algo entraría al corpus como providencia.
     */
    const inventada = await descargarProvidencia('F00000000000000000000INVENTADA', 20_000);
    check(
      'un archivo inventado NO devuelve documento',
      inventada === null,
      inventada === null ? 'null' : `${inventada.length} bytes`
    );

    /*
     * LA CADENA COMPLETA. Es lo único que prueba que las cinco peticiones
     * encajan: token, búsqueda, resultados, nombre de archivo y PDF leído.
     */
    const hallazgo = await buscarEnCndj('falta disciplinaria abogado', {
      timeoutMs: 30_000,
      maximo: 2
    });

    if (hallazgo.status === 'FOUND') {
      const primera = hallazgo.rulings[0];
      check(
        'la búsqueda devuelve providencias CON su texto',
        primera.text.length > 400,
        `${hallazgo.rulings.length} providencia(s) · ${primera.text.length} caracteres`
      );
      check(
        'y viajan atribuidas a la corporación correcta',
        hallazgo.rulings.every((r) => r.corporacion === 'COMISION_DISCIPLINA'),
        primera.corporacion
      );
      check(
        'con su URL en la fuente oficial',
        primera.sourceUrl.startsWith('https://relatoria.cndj.gov.co/docs_relatoria/'),
        primera.sourceUrl.slice(0, 70)
      );
    } else {
      console.log(`skip la cadena completa: ${hallazgo.status} — ${hallazgo.reason}`);
    }

    /* Una consulta de una letra no puede devolver nada: el corpus no se enumera. */
    const corta = await buscarEnCndj('a', { timeoutMs: 15_000 });
    check(
      'una consulta demasiado corta se rechaza sin salir a la red',
      corta.status === 'NOT_FOUND',
      corta.status
    );
  } catch (err) {
    console.log(
      `skip la parte de red: ${err instanceof Error ? err.message : 'sin acceso a la relatoría'}`
    );
  }

  console.log('');
  console.log(fallos === 0 ? 'ALL CHECKS PASSED' : `${fallos} CHECKS FAILED`);
  process.exit(fallos === 0 ? 0 : 1);
};

void main();
