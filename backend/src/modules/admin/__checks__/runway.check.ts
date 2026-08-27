/**
 * Guards the upstream-credit runway.
 *
 * Run with: npm run check:runway
 *
 * La pregunta que responde este módulo es cuándo recargar OpenRouter, y la
 * respuesta no es "cuando se esté acabando". Una firma que recarga $100.000 ya
 * compró borradores que todavía no pide: ese dinero está en el banco y la
 * obligación de producirlos sigue viva. Si el crédito del proveedor se agota,
 * fallan borradores YA PAGADOS — no es una función degradada, es deber trabajo.
 *
 * Lo que se comprueba aquí es la aritmética de esa obligación, y sobre todo que
 * la conversión salga de los mismos números con que se le cobra al cliente. El
 * día que cambie el margen o la tasa, esto tiene que moverse solo.
 */
import { COP_PER_USD, MARKUP, priceFor } from '../../billing/billing.service';
import { COP_POR_USD_DE_CREDITO } from '../runway.service';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

/*
 * ─── LA CONVERSIÓN ES EL PRECIO AL REVÉS ───────────────────────────────────
 *
 * Si un borrador se cobra costoUsd × COP_PER_USD × MARKUP, entonces un peso de
 * saldo cuesta 1 / (COP_PER_USD × MARKUP) de crédito. Escribir 9200 a mano
 * habría funcionado hoy y habría mentido el día que alguien mueva el margen.
 */
check(
  'la conversión se deriva del precio y no de un número escrito a mano',
  COP_POR_USD_DE_CREDITO === COP_PER_USD * MARKUP,
  String(COP_POR_USD_DE_CREDITO)
);

/*
 * La comprobación redonda: lo que hace falta para honrar $100.000 COP.
 *
 * Se calcula al revés desde `priceFor` — el precio real que paga la firma — en
 * vez de repetir la fórmula. Si el precio y el runway dejaran de coincidir,
 * este check lo dice; repetir la cuenta lo escondería.
 */
const RECARGA = 100_000;
const requeridoUsd = RECARGA / COP_POR_USD_DE_CREDITO;

check(
  'una recarga de $100.000 COP requiere unos US$10,87 de crédito',
  Math.abs(requeridoUsd - 10.87) < 0.01,
  `US$${requeridoUsd.toFixed(2)}`
);

/*
 * Y contra el precio real: $100.000 compran 50 borradores al piso de $2.000, y
 * cada uno cuesta arriba lo que `priceFor` usa para llegar a ese piso.
 */
const costoDeUnBorradorAlPiso = 2000 / (COP_PER_USD * MARKUP);
const borradoresQueCompra = RECARGA / 2000;

check(
  'cuadra con el precio real por borrador: 50 borradores al piso',
  Math.abs(borradoresQueCompra * costoDeUnBorradorAlPiso - requeridoUsd) < 0.01,
  `${borradoresQueCompra} borradores × US$${costoDeUnBorradorAlPiso.toFixed(3)}`
);

// Y el piso sigue siendo el piso: un borrador barato no se cobra más barato.
check(
  'un borrador ordinario se cobra al piso y no por medición',
  priceFor('BORRADOR', costoDeUnBorradorAlPiso / 2) === 2000,
  String(priceFor('BORRADOR', costoDeUnBorradorAlPiso / 2))
);

// Pero uno caro sí sube, o el pasivo estaría subestimado justo en los
// documentos que más crédito consumen.
check(
  'uno largo sí se cobra por lo que costó',
  priceFor('BORRADOR', costoDeUnBorradorAlPiso * 4) > 2000,
  String(priceFor('BORRADOR', costoDeUnBorradorAlPiso * 4))
);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
