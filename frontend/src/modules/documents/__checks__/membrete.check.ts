/**
 * Guards the letterhead lines: only what the firm wrote is printed, and no
 * placeholder ever reaches a filing. Run with: npm run check:membrete
 */
import { readFileSync } from 'node:fs';
import { lineasDeMembrete } from '../services/membrete';

/*
 * La configuración por defecto se lee del FUENTE, no se importa: el servicio
 * de exportación arrastra archivos de fuente por Vite («?inline») que Node no
 * resuelve. Lo que se comprueba es lo que importa: que ningún relleno de
 * maqueta viva en ese objeto.
 */
// El check corre desde frontend/ (npm run), como los demás.
const fuenteDelExportador = readFileSync('src/modules/documents/services/documentExport.service.ts', 'utf8');
const bloqueDefault = fuenteDelExportador.slice(
  fuenteDelExportador.indexOf('export const DEFAULT_FIRM_BRANDING'),
  fuenteDelExportador.indexOf('};', fuenteDelExportador.indexOf('export const DEFAULT_FIRM_BRANDING'))
);
const valorDe = (campo: string): string => {
  const m = new RegExp(`${campo}:\\s*'([^']*)'`).exec(bloqueDefault);
  return m ? m[1] : '<<sin campo>>';
};
const DEFAULT_FIRM_BRANDING = {
  firmName: valorDe('firmName'),
  firmNit: valorDe('firmNit'),
  firmAddress: valorDe('firmAddress'),
  firmPhone: valorDe('firmPhone'),
  firmEmail: valorDe('firmEmail')
};

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const completa = lineasDeMembrete({
  firmName: 'Restrepo & Cárdenas Abogados',
  firmNit: '900.482.117-3',
  firmAddress: 'Cra. 11 # 93-46, Bogotá',
  firmPhone: '(601) 742 18 90',
  firmEmail: 'notificaciones@restrepocardenas.co'
});
check('el encabezado es el nombre en mayúsculas', completa.encabezado === 'RESTREPO & CÁRDENAS ABOGADOS');
check('la identificación une NIT y dirección', completa.identificacion === 'NIT 900.482.117-3 · Cra. 11 # 93-46, Bogotá', completa.identificacion);
check('el pie del PDF lleva firma y correo', completa.pieIzquierda === 'Restrepo & Cárdenas Abogados · notificaciones@restrepocardenas.co');
check('el pie del Word lleva dirección y teléfono', completa.pieContacto === 'Cra. 11 # 93-46, Bogotá · (601) 742 18 90');

const sinNit = lineasDeMembrete({ firmName: 'Aníbal Díaz Contreras', firmEmail: 'anibal@correo.co' });
check('sin NIT no aparece la palabra NIT', !/NIT/.test(sinNit.identificacion) && sinNit.identificacion === '');
check('un litigante sin dirección ni teléfono no tiene pie de contacto', sinNit.pieContacto === '' && sinNit.tieneMembrete === true);

const nada = lineasDeMembrete({});
check('sin datos no hay membrete que imprimir', nada.tieneMembrete === false && nada.encabezado === '' && nada.pieIzquierda === '');

const espacios = lineasDeMembrete({ firmName: '   ', firmNit: ' ' });
check('espacios en blanco cuentan como vacío', espacios.tieneMembrete === false);

/* La configuración por defecto ya no trae relleno que pueda imprimirse. */
const porDefecto = lineasDeMembrete(DEFAULT_FIRM_BRANDING);
check('la configuración por defecto no imprime nada', porDefecto.tieneMembrete === false, JSON.stringify(porDefecto));
check('y en particular no dice Rama Judicial ni tufirma.co', !/RAMA JUDICIAL|tufirma/i.test(JSON.stringify(DEFAULT_FIRM_BRANDING)));

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
