import { jsPDF } from 'jspdf';
import { EMISOR } from './emisor';

/**
 * La cuenta de cobro de un pago de suscripción, en PDF, hecha en el servidor.
 *
 * GEMELO DE `frontend/src/modules/subscriptions/cuentaDeCobro.pdf.ts`. El
 * navegador produce este mismo documento cuando la firma lo descarga desde la
 * pantalla de plan; el servidor lo produce para adjuntarlo al correo que
 * confirma el pago. El trazado se reproduce línea por línea a propósito: un
 * documento contable que se ve distinto según de dónde salió invita a preguntar
 * cuál de los dos es el bueno. Cualquier cambio de diseño se hace en los dos.
 *
 * POR QUÉ «CUENTA DE COBRO» Y NO «FACTURA». Una factura de venta en Colombia
 * es la factura electrónica validada por la DIAN, con numeración autorizada y
 * CUFE; este documento no pasa por ahí. Lo que sí puede entregar hoy la
 * plataforma es el soporte del pago: quién cobró, a quién, por qué concepto,
 * cuánto y con qué referencia de la pasarela. Titularlo «factura» le prometería
 * al contador de la firma algo que el papel no cumple.
 *
 * SIN IVA DISCRIMINADO. El titular pidió que el documento muestre solo el
 * valor pagado por la suscripción, sin desglose de IVA. El documento lo dice
 * con esas palabras en vez de callarlo, para que nadie lo lea como un error.
 *
 * Fuente Helvetica del propio PDF: no se incrusta ninguna, así el adjunto pesa
 * unos pocos KB y el correo no se rechaza por tamaño.
 */

export type PlanPagado = 'ESENCIAL' | 'PREMIUM' | 'FIRMA';
export type PeriodoPagado = 'MENSUAL' | 'ANUAL';

/** Lo que el servidor sabe de un pago aplicado (la fila de `subscription_payments`). */
export interface PagoDePlanServidor {
  reference: string;
  plan: PlanPagado;
  period: PeriodoPagado;
  amountCop: number;
  validFrom: string;
  validUntil: string;
  userEmail: string;
  createdAt: string;
}

export interface ClienteDeLaCuenta {
  nombre: string;
  nit?: string | null;
  correo?: string;
}

const pesos = (n: number): string => `$${Math.round(n).toLocaleString('es-CO')} COP`;

/*
 * Zona horaria explícita: el servidor corre en UTC y un pago hecho a las 8 de
 * la noche en Bogotá caería al día siguiente en el papel. El navegador no tiene
 * ese problema porque usa la zona del contador; aquí hay que decirla.
 */
const fecha = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Bogota'
  });

const NOMBRE_DE_PLAN: Record<PlanPagado, string> = { ESENCIAL: 'Esencial', PREMIUM: 'Premium', FIRMA: 'Firma' };
const NOMBRE_DE_PERIODO: Record<PeriodoPagado, string> = {
  MENSUAL: 'mensual (1 mes)',
  ANUAL: 'anual (12 meses)'
};

/** Número legible y estable: la referencia de Wompi ya es única por pago. */
export const numeroDeCuenta = (referencia: string): string => referencia.replace(/^IUR-/, 'CC-').slice(0, 40);

/** El nombre con el que viaja el adjunto; el navegador guarda el suyo igual. */
export const nombreDeArchivo = (referencia: string): string => `Cuenta-de-cobro-${numeroDeCuenta(referencia)}.pdf`;

/**
 * Lo mínimo que el papel necesita, sea lo que sea que se pagó.
 *
 * POR QUÉ SE EXTRAJO. La cuenta de cobro solo sabía de suscripciones, y una
 * recarga de saldo también es dinero que entró y también necesita su soporte.
 * El trazado NO se duplicó: lo que cambia entre una y otra es el concepto y su
 * detalle, así que eso es lo único que se recibe. El dibujo sigue siendo uno y
 * sigue siendo el gemelo del que produce el navegador.
 */
interface CuentaDibujable {
  reference: string;
  createdAt: string;
  /** La línea grande del concepto. */
  concepto: string;
  /** La línea pequeña bajo el concepto; vacía cuando no hay nada que precisar. */
  detalle: string;
  amountCop: number;
  userEmail: string;
  /** Cómo se nombra lo pagado en el pie. */
  loPagado: string;
}

/** Devuelve el PDF como Buffer, listo para adjuntar a un correo. */
export const generarCuentaDeCobro = (pago: PagoDePlanServidor, cliente: ClienteDeLaCuenta): Buffer =>
  dibujarCuenta(
    {
      reference: pago.reference,
      createdAt: pago.createdAt,
      concepto: `Suscripción a ${EMISOR.nombreComercial} · Plan ${NOMBRE_DE_PLAN[pago.plan]} ${NOMBRE_DE_PERIODO[pago.period]}`,
      detalle: `Periodo cubierto: del ${fecha(pago.validFrom)} al ${fecha(pago.validUntil)}.`,
      amountCop: pago.amountCop,
      userEmail: pago.userEmail,
      loPagado: 'el pago de la suscripción'
    },
    cliente
  );

/** Lo que el servidor sabe de una recarga aplicada: no hay plan ni periodo que cubrir. */
export interface RecargaServidor {
  reference: string;
  amountCop: number;
  userEmail: string;
  createdAt: string;
}

/**
 * La misma cuenta de cobro para una recarga de saldo.
 *
 * SIN PERIODO CUBIERTO, y eso no es un olvido: una recarga no compra tiempo,
 * acredita un saldo que se gasta cuando la firma lo gasta. Poner ahí unas
 * fechas cualesquiera sería inventarle al contador una vigencia que el pago no
 * tiene. El detalle dice lo que sí es cierto: que el saldo quedó acreditado.
 */
export const generarCuentaDeCobroDeRecarga = (
  recarga: RecargaServidor,
  cliente: ClienteDeLaCuenta
): Buffer =>
  dibujarCuenta(
    {
      reference: recarga.reference,
      createdAt: recarga.createdAt,
      concepto: `Recarga de saldo de inteligencia artificial en ${EMISOR.nombreComercial}`,
      detalle: `Saldo acreditado a la cuenta de la firma el ${fecha(recarga.createdAt)}.`,
      amountCop: recarga.amountCop,
      userEmail: recarga.userEmail,
      loPagado: 'la recarga de saldo'
    },
    cliente
  );

const dibujarCuenta = (pago: CuentaDibujable, cliente: ClienteDeLaCuenta): Buffer => {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'letter' });
  const ancho = doc.internal.pageSize.getWidth();
  const margen = 20;
  const derecha = ancho - margen;
  let y = 22;

  /* Cabecera */
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(EMISOR.nombreComercial, margen, y);
  doc.setFontSize(11);
  doc.text('CUENTA DE COBRO', derecha, y, { align: 'right' });
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(80);
  doc.text(`No. ${numeroDeCuenta(pago.reference)}`, derecha, y, { align: 'right' });
  y += 5;
  doc.text(`Fecha: ${fecha(pago.createdAt)}`, derecha, y, { align: 'right' });
  doc.setTextColor(0);

  /* Emisor */
  y += 10;
  doc.setDrawColor(200);
  doc.line(margen, y, derecha, y);
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('EMITE', margen, y);
  doc.text('A NOMBRE DE', ancho / 2 + 4, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const emisor = [EMISOR.titular, EMISOR.documento, `NIT ${EMISOR.nit}`, EMISOR.ciudad, EMISOR.correo];
  const clienteLineas = [
    cliente.nombre,
    cliente.nit ? `NIT ${cliente.nit}` : 'Sin NIT registrado',
    cliente.correo ?? ''
  ].filter(Boolean);
  const yEmisor = y;
  emisor.forEach((l, i) => doc.text(l, margen, yEmisor + i * 5));
  clienteLineas.forEach((l, i) => doc.text(l, ancho / 2 + 4, yEmisor + i * 5));
  y = yEmisor + Math.max(emisor.length, clienteLineas.length) * 5 + 6;

  /* Concepto */
  doc.line(margen, y, derecha, y);
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('CONCEPTO', margen, y);
  doc.text('VALOR', derecha, y, { align: 'right' });
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const lineasConcepto = doc.splitTextToSize(pago.concepto, ancho - margen * 2 - 45) as string[];
  doc.text(lineasConcepto, margen, y);
  doc.text(pesos(pago.amountCop), derecha, y, { align: 'right' });
  y += lineasConcepto.length * 5;
  doc.setTextColor(80);
  doc.setFontSize(9);
  if (pago.detalle) doc.text(pago.detalle, margen, y);
  doc.setTextColor(0);
  y += 8;
  doc.line(margen, y, derecha, y);
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL PAGADO', ancho / 2 + 4, y);
  doc.text(pesos(pago.amountCop), derecha, y, { align: 'right' });
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.text('Este documento no discrimina IVA.', ancho / 2 + 4, y);
  doc.setTextColor(0);

  /* Pago */
  y += 12;
  doc.setFontSize(9.5);
  doc.text(`Pagado a través de la pasarela Wompi. Referencia: ${pago.reference}.`, margen, y);
  y += 5;
  doc.text(`Pagó: ${pago.userEmail}.`, margen, y);

  /* Pie */
  const pie = doc.internal.pageSize.getHeight() - 18;
  doc.setFontSize(8);
  doc.setTextColor(120);
  const nota = doc.splitTextToSize(
    `Cuenta de cobro emitida por ${EMISOR.titular} (${EMISOR.nombreComercial}) como soporte de ${pago.loPagado}. ` +
      `No es factura electrónica de venta validada por la DIAN. Generada el ${fecha(new Date().toISOString())}.`,
    ancho - margen * 2
  ) as string[];
  doc.text(nota, margen, pie);

  return Buffer.from(doc.output('arraybuffer'));
};
