/**
 * Guards the on-screen document format: what the firm chose in Membrete is
 * what the canvas shows. Run with: npm run check:formato
 */
import { estiloDelLienzo, puntosAPixeles } from '../formatoEnPantalla';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

check('12 pt son 16 px, como en el papel', puntosAPixeles(12) === 16);
check('11 pt son 14,7 px', puntosAPixeles(11) === 14.7, String(puntosAPixeles(11)));

const times = estiloDelLienzo({ fontFamily: 'Times New Roman', fontSizePt: 12, lineSpacing: '1.5' });
check('Times New Roman llega al lienzo con sus sustitutos serif', !!times && /Times New Roman/.test(times.fontFamily) && /serif$/.test(times.fontFamily));
check('con el tamaño en píxeles', times?.fontSize === '16px', times?.fontSize);
check('y el interlineado elegido', times?.lineHeight === 1.75, String(times?.lineHeight));

const calibri = estiloDelLienzo({ fontFamily: 'Calibri', fontSizePt: 11, lineSpacing: '1.0' });
check('Calibri cae a Carlito donde no existe', !!calibri && /Carlito/.test(calibri.fontFamily));
check('el «sencillo» de Word no es 1.0 de CSS', calibri?.lineHeight === 1.35, String(calibri?.lineHeight));

const arial = estiloDelLienzo({ fontFamily: 'Arial' });
check('sin tamaño ni interlineado, 12 pt y 1,5 por defecto', arial?.fontSize === '16px' && arial?.lineHeight === 1.75);

for (const f of ['Tahoma', 'Plus Jakarta Sans', 'Manrope', 'Public Sans', 'Satoshi'] as const) {
  const e = estiloDelLienzo({ fontFamily: f, fontSizePt: 12 });
  check(`${f} llega al lienzo con su propia familia`, !!e && e.fontFamily.includes(f), e?.fontFamily);
}

const raro = estiloDelLienzo({ fontFamily: 'Comic Sans', fontSizePt: 12 });
check('una familia desconocida no se inventa: el lienzo conserva su serif', raro === null);

const fuera = estiloDelLienzo({ fontFamily: 'Arial', fontSizePt: 72 });
check('un tamaño absurdo vuelve a 12 pt', fuera?.fontSize === '16px', fuera?.fontSize);

check('sin formato, null (el lienzo usa su serif por defecto)', estiloDelLienzo(null) === null && estiloDelLienzo(undefined) === null);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
