import { jsPDF } from 'jspdf';
import { EMISOR } from './emisor';
import type { PagoDePlan, Plan } from './types';

/**
 * La cuenta de cobro de un pago de suscripción, en PDF, hecha en el navegador.
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
 * Fuente Helvetica del propio PDF: no se incrusta ninguna, así el archivo pesa
 * unos pocos KB y se abre igual en el teléfono del contador.
 */

const pesos = (n: number): string => `$${Math.round(n).toLocaleString('es-CO')} COP`;
const fecha = (iso: string): string => new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

export interface ClienteDeLaCuenta {
  nombre: string;
  nit?: string | null;
  correo?: string;
}

const NOMBRE_DE_PLAN: Record<Plan, string> = { ESENCIAL: 'Esencial', PREMIUM: 'Premium' };
const NOMBRE_DE_PERIODO = { MENSUAL: 'mensual (1 mes)', ANUAL: 'anual (12 meses)' } as const;

/** Número legible y estable: la referencia de Wompi ya es única por pago. */
export const numeroDeCuenta = (pago: PagoDePlan): string => pago.reference.replace(/^IUR-/, 'CC-').slice(0, 40);

export const generarCuentaDeCobro = (pago: PagoDePlan, cliente: ClienteDeLaCuenta): void => {
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
  doc.text(`No. ${numeroDeCuenta(pago)}`, derecha, y, { align: 'right' });
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
  const clienteLineas = [cliente.nombre, cliente.nit ? `NIT ${cliente.nit}` : 'Sin NIT registrado', cliente.correo ?? ''].filter(Boolean);
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
  const concepto = `Suscripción a ${EMISOR.nombreComercial} · Plan ${NOMBRE_DE_PLAN[pago.plan]} ${NOMBRE_DE_PERIODO[pago.period]}`;
  const detalle = `Periodo cubierto: del ${fecha(pago.validFrom)} al ${fecha(pago.validUntil)}.`;
  const lineasConcepto = doc.splitTextToSize(concepto, ancho - margen * 2 - 45) as string[];
  doc.text(lineasConcepto, margen, y);
  doc.text(pesos(pago.amountCop), derecha, y, { align: 'right' });
  y += lineasConcepto.length * 5;
  doc.setTextColor(80);
  doc.setFontSize(9);
  doc.text(detalle, margen, y);
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
    `Cuenta de cobro emitida por ${EMISOR.titular} (${EMISOR.nombreComercial}) como soporte del pago de la suscripción. No es factura electrónica de venta validada por la DIAN. Generada el ${fecha(new Date().toISOString())}.`,
    ancho - margen * 2
  ) as string[];
  doc.text(nota, margen, pie);

  doc.save(`Cuenta-de-cobro-${numeroDeCuenta(pago)}.pdf`);
};
