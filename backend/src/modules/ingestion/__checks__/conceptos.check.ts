/**
 * Guards the doctrine corpus.
 *
 * Run with: npm run check:conceptos
 *
 * Un concepto entra al corpus solo si la frase que lo sostiene aparece de
 * verdad en el texto de su propia fuente. Todo lo demás de esa tubería es
 * fontanería; esto es lo que impide indexar una cita que nadie puede encontrar
 * donde dice que está — el mismo defecto que costó una jornada entera de
 * verificación en el catálogo.
 *
 * Sin red y sin base de datos: se comprueba la función, que es donde vive la
 * decisión.
 */
import { quoteIsInSource } from '../conceptoIngestion.service';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const TEXTO_FUENTE = `
DIRECCIÓN DE IMPUESTOS Y ADUANAS NACIONALES
Concepto 000123 de 2024

Descriptores: Retención en la fuente. Base gravable.

Tesis jurídica: Los pagos efectuados por concepto de servicios prestados desde
el exterior no están sometidos a retención en la fuente a título de renta cuando
el servicio se presta íntegramente fuera del territorio nacional y no se
configura ninguno de los supuestos del artículo 24 del Estatuto Tributario.

En los anteriores términos se absuelve la consulta.
`;

// ─── La cita literal se encuentra ───────────────────────────────────────────
const literal = 'no están sometidos a retención en la fuente a título de renta cuando el servicio se presta íntegramente fuera del territorio nacional';
check('una cita literal se encuentra en su fuente', quoteIsInSource(literal, TEXTO_FUENTE) === null);

// Comillas tipográficas, tildes y saltos de línea no deben romper la búsqueda:
// una fuente oficial rara vez se transcribe carácter por carácter.
const conAdornos = '“Los pagos efectuados por concepto de servicios prestados desde el exterior no están sometidos a retención”';
check(
  'las comillas tipográficas y los saltos de línea no rompen la comprobación',
  quoteIsInSource(conAdornos, TEXTO_FUENTE) === null
);

const sinTildes = 'los pagos efectuados por concepto de servicios prestados desde el exterior no estan sometidos a retencion';
check('la comprobación no depende de las tildes', quoteIsInSource(sinTildes, TEXTO_FUENTE) === null);

/*
 * ─── LO QUE ESTE CHECK EXISTE PARA IMPEDIR ─────────────────────────────────
 *
 * Una cita que suena a concepto de la DIAN, que cabría perfectamente en uno, y
 * que no está en el documento citado. Indexada, se vuelve indistinguible de una
 * real: se recupera con la misma confianza, se cita en un escrito, y nadie abre
 * la URL hasta que la contraparte lo hace.
 */
const inventada = 'La Administración reconoce que el contribuyente que actuó amparado en un concepto vigente no podrá ser sancionado por ello';
check(
  'una cita que NO está en la fuente se rechaza',
  quoteIsInSource(inventada, TEXTO_FUENTE) !== null,
  String(quoteIsInSource(inventada, TEXTO_FUENTE))
);

// Una cita demasiado corta coincide con cualquier cosa y no prueba nada.
check(
  'una cita demasiado corta se rechaza',
  quoteIsInSource('se absuelve', TEXTO_FUENTE) !== null
);

// Palabras sueltas del documento, reordenadas, no son una cita.
const revuelta = 'retención territorio consulta servicios gravable descriptores nacional exterior renta';
check(
  'palabras sueltas del documento no pasan por cita',
  quoteIsInSource(revuelta, TEXTO_FUENTE) !== null
);

// Un texto vacío —el caso de la descarga que falló y devolvió nada— no puede
// validar ninguna cita.
check('una fuente vacía no valida ninguna cita', quoteIsInSource(literal, '') !== null);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exit(fallos === 0 ? 0 : 1);
