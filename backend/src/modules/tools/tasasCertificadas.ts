/**
 * Interés bancario corriente certificado por la Superintendencia Financiera,
 * periodo por periodo, con su resolución y su fuente oficial.
 *
 * ─── DE DÓNDE SALE CADA FILA ────────────────────────────────────────────────
 *
 * De los dos archivos históricos que la Superintendencia publica en su página
 * de Interés Bancario Corriente, descargados y leídos el 14 de septiembre de
 * 2026: «Histórico TIBC» (resolución, fecha, vigencia desde/hasta y tasa por
 * modalidad) e «Histórico Tasa de Usura» (vigencia, IBC y usura). Las dos
 * series se cruzaron fila por fila: mismo periodo, mismo IBC, y usura igual a
 * 1,5 × IBC en todas. La fila de septiembre de 2026 se leyó además en el PDF
 * de la Resolución 1260 de 2026, art. 1: «Certificar en un 19.49% efectivo
 * anual el interés bancario corriente para la modalidad de crédito de consumo y
 * ordinario». Ninguna tasa se escribió de memoria, de un blog ni de la maqueta.
 *
 * El Decreto 19 de 2012, art. 29 —citado al pie del propio histórico— dispone
 * que la certificación se surte con la publicación en la web de la entidad y
 * que los datos históricos de al menos diez años deben quedar a disposición del
 * público. Por eso la URL de cada fila es el histórico oficial: es el documento
 * que prueba esa tasa.
 *
 * ─── POR QUÉ CONSUMO Y ORDINARIO ────────────────────────────────────────────
 *
 * Decreto 2555 de 2010, art. 11.2.5.1.3, inc. 2: en los intereses de mora de
 * «obligaciones mercantiles de carácter dinerario diferentes de las
 * provenientes de las operaciones activas de crédito» y en los demás casos en
 * que los intereses se definan en función del IBC, «únicamente deberá tenerse
 * en cuenta el interés bancario corriente certificado para el crédito de
 * consumo y ordinario». Una deuda que sí nace de una operación activa de
 * crédito (un microcrédito, un crédito productivo) se rige por la modalidad de
 * esa operación (inciso 1) y esta herramienta no la liquida: lo dice en sus
 * supuestos. https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=40032
 *
 * ─── LA RELACIÓN ENTRE LAS TRES TASAS ───────────────────────────────────────
 *
 * - Código de Comercio, art. 884 (modificado por la Ley 510 de 1999, art. 111):
 *   si las partes no estipularon el interés moratorio, «será equivalente a una
 *   y media veces del bancario corriente y en cuanto sobrepase cualquiera de
 *   estos montos el acreedor perderá todos los intereses».
 *   https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=41102
 * - Código Penal, art. 305: comete usura quien cobre utilidad «que exceda en
 *   la mitad del interés bancario corriente que para el período correspondiente
 *   estén cobrando los bancos, según certificación de la Superintendencia».
 *   https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=6388
 *
 * Así, la mora legal comercial y el techo de usura coinciden: 1,5 × IBC del
 * periodo. La Superintendencia publica la usura «a nivel informativo» (su
 * comunicado de septiembre de 2026 la rotula «Tasas no certificadas por la SFC
 * basadas en el Interés Bancario Corriente»): lo certificado es el IBC. La
 * columna `usuraEA` guarda la cifra tal como la trae el histórico oficial —sin
 * redondear en los años en que la publicó con tres decimales— y el check exige
 * que coincida con 1,5 × IBC.
 *
 * ─── LA IRREGULARIDAD DE SEPTIEMBRE DE 2017 ─────────────────────────────────
 *
 * La Resolución 0907 de 2017 certificó el trimestre julio–septiembre de 2017
 * (21,98 %). El 30 de agosto de 2017 la Resolución 1155 certificó septiembre
 * solo (21,48 %), y desde entonces la certificación es mensual. Los dos
 * históricos traen ambas filas solapadas. El art. 11.2.5.1.1 del Decreto 2555
 * dice que las tasas «regirán por el periodo que determine la Superintendencia
 * Financiera»; el comunicado oficial de la 1155 fija la usura de septiembre en
 * 32,22 % y la compara con «el período anterior» (32,97 %). Aquí la 0907 rige
 * julio y agosto, y la 1155 septiembre; la fila lo anota.
 * https://www.superfinanciera.gov.co/publicaciones/10090163/certificacion-del-interes-bancario-corriente-para-la-modalidad-de-credito-de-consumo-y-ordinario-10090163/
 *
 * ─── CÓMO SE ACTUALIZA (CADA MES) ───────────────────────────────────────────
 *
 * La Superintendencia certifica el último día hábil de cada mes la tasa del
 * mes siguiente. Para añadirla: leer la resolución en
 * https://www.superfinanciera.gov.co/publicaciones/10829/ (su PDF, art. 1),
 * agregar la fila al final con su resolución, fecha, URL y la fecha de
 * consulta, mover `CONSULTADO_EL`, y correr `npm run check:intereses-tramos`
 * —que rechaza un hueco, un solape, una fila sin fuente o una usura que no sea
 * 1,5 × IBC—. Hasta que alguien lo haga, la herramienta liquida hasta el último
 * día certificado y lo dice: nunca extiende la última tasa.
 */
import type { Fuente } from './fuentes';

export interface CertificacionIbc {
  /** Primer día de vigencia, AAAA-MM-DD. */
  desde: string;
  /** Último día de vigencia, inclusive. */
  hasta: string;
  resolucion: string;
  fechaResolucion: string;
  /** % efectivo anual, modalidad de crédito de consumo y ordinario. */
  interesBancarioCorrienteEA: number;
  /** % efectivo anual: 1,5 × IBC, tope de mora comercial y de usura. */
  usuraEA: number;
  url: string;
  consultadoEl: string;
  nota?: string;
}

export const MODALIDAD_CERTIFICADA = 'crédito de consumo y ordinario';
export const CONSULTADO_EL = '2026-09-14';

const DESCARGA = 'https://www.superfinanciera.gov.co/loader.php?lServicio=Tools2&lTipo=descargas&lFuncion=descargar&idFile=';
const HISTORICO_TIBC = `${DESCARGA}1069305`;
const HISTORICO_USURA = `${DESCARGA}1069287`;
const SEP_2026_PDF = `${DESCARGA}1083363`;

type FilaSinConsulta = Omit<CertificacionIbc, 'consultadoEl'>;

const FILAS: readonly FilaSinConsulta[] = [
  { desde: '2016-07-01', hasta: '2016-09-30', resolucion: 'Resolución 0811 de 2016', fechaResolucion: '2016-06-28', interesBancarioCorrienteEA: 21.34, usuraEA: 32.01, url: HISTORICO_TIBC },
  { desde: '2016-10-01', hasta: '2016-12-31', resolucion: 'Resolución 1233 de 2016', fechaResolucion: '2016-09-29', interesBancarioCorrienteEA: 21.99, usuraEA: 32.985, url: HISTORICO_TIBC },
  { desde: '2017-01-01', hasta: '2017-03-31', resolucion: 'Resolución 1612 de 2016', fechaResolucion: '2016-12-26', interesBancarioCorrienteEA: 22.34, usuraEA: 33.51, url: HISTORICO_TIBC },
  { desde: '2017-04-01', hasta: '2017-06-30', resolucion: 'Resolución 0488 de 2017', fechaResolucion: '2017-03-28', interesBancarioCorrienteEA: 22.33, usuraEA: 33.495, url: HISTORICO_TIBC },
  { desde: '2017-07-01', hasta: '2017-08-31', resolucion: 'Resolución 0907 de 2017', fechaResolucion: '2017-06-30', interesBancarioCorrienteEA: 21.98, usuraEA: 32.97, url: HISTORICO_TIBC, nota: 'La Resolución 0907 de 2017 certificó el periodo del 1 de julio al 30 de septiembre de 2017; la Resolución 1155 de 2017 certificó por separado septiembre de 2017, así que esta fila rige solo julio y agosto.' },
  { desde: '2017-09-01', hasta: '2017-09-30', resolucion: 'Resolución 1155 de 2017', fechaResolucion: '2017-08-30', interesBancarioCorrienteEA: 21.48, usuraEA: 32.22, url: HISTORICO_TIBC },
  { desde: '2017-10-01', hasta: '2017-10-31', resolucion: 'Resolución 1298 de 2017', fechaResolucion: '2017-09-29', interesBancarioCorrienteEA: 21.15, usuraEA: 31.725, url: HISTORICO_TIBC },
  { desde: '2017-11-01', hasta: '2017-11-30', resolucion: 'Resolución 1447 de 2017', fechaResolucion: '2017-10-27', interesBancarioCorrienteEA: 20.96, usuraEA: 31.44, url: HISTORICO_TIBC },
  { desde: '2017-12-01', hasta: '2017-12-31', resolucion: 'Resolución 1619 de 2017', fechaResolucion: '2017-11-29', interesBancarioCorrienteEA: 20.77, usuraEA: 31.155, url: HISTORICO_TIBC },
  { desde: '2018-01-01', hasta: '2018-01-31', resolucion: 'Resolución 1890 de 2017', fechaResolucion: '2017-12-28', interesBancarioCorrienteEA: 20.69, usuraEA: 31.035, url: HISTORICO_TIBC },
  { desde: '2018-02-01', hasta: '2018-02-28', resolucion: 'Resolución 0131 de 2018', fechaResolucion: '2018-01-31', interesBancarioCorrienteEA: 21.01, usuraEA: 31.515, url: HISTORICO_TIBC },
  { desde: '2018-03-01', hasta: '2018-03-31', resolucion: 'Resolución 0259 de 2018', fechaResolucion: '2018-02-28', interesBancarioCorrienteEA: 20.68, usuraEA: 31.02, url: HISTORICO_TIBC },
  { desde: '2018-04-01', hasta: '2018-04-30', resolucion: 'Resolución 0398 de 2018', fechaResolucion: '2018-03-28', interesBancarioCorrienteEA: 20.48, usuraEA: 30.72, url: HISTORICO_TIBC },
  { desde: '2018-05-01', hasta: '2018-05-31', resolucion: 'Resolución 0527 de 2018', fechaResolucion: '2018-04-27', interesBancarioCorrienteEA: 20.44, usuraEA: 30.66, url: HISTORICO_TIBC },
  { desde: '2018-06-01', hasta: '2018-06-30', resolucion: 'Resolución 0687 de 2018', fechaResolucion: '2018-05-30', interesBancarioCorrienteEA: 20.28, usuraEA: 30.42, url: HISTORICO_TIBC },
  { desde: '2018-07-01', hasta: '2018-07-31', resolucion: 'Resolución 0820 de 2018', fechaResolucion: '2018-06-28', interesBancarioCorrienteEA: 20.03, usuraEA: 30.045, url: HISTORICO_TIBC },
  { desde: '2018-08-01', hasta: '2018-08-31', resolucion: 'Resolución 0954 de 2018', fechaResolucion: '2018-07-27', interesBancarioCorrienteEA: 19.94, usuraEA: 29.91, url: HISTORICO_TIBC },
  { desde: '2018-09-01', hasta: '2018-09-30', resolucion: 'Resolución 1112 de 2018', fechaResolucion: '2018-08-31', interesBancarioCorrienteEA: 19.81, usuraEA: 29.715, url: HISTORICO_TIBC },
  { desde: '2018-10-01', hasta: '2018-10-31', resolucion: 'Resolución 1294 de 2018', fechaResolucion: '2018-09-28', interesBancarioCorrienteEA: 19.63, usuraEA: 29.45, url: HISTORICO_TIBC },
  { desde: '2018-11-01', hasta: '2018-11-30', resolucion: 'Resolución 1521 de 2018', fechaResolucion: '2018-10-31', interesBancarioCorrienteEA: 19.49, usuraEA: 29.24, url: HISTORICO_TIBC },
  { desde: '2018-12-01', hasta: '2018-12-31', resolucion: 'Resolución 1708 de 2018', fechaResolucion: '2018-11-29', interesBancarioCorrienteEA: 19.4, usuraEA: 29.1, url: HISTORICO_TIBC },
  { desde: '2019-01-01', hasta: '2019-01-31', resolucion: 'Resolución 1872 de 2018', fechaResolucion: '2018-12-27', interesBancarioCorrienteEA: 19.16, usuraEA: 28.74, url: HISTORICO_TIBC },
  { desde: '2019-02-01', hasta: '2019-02-28', resolucion: 'Resolución 0111 de 2019', fechaResolucion: '2019-01-31', interesBancarioCorrienteEA: 19.7, usuraEA: 29.55, url: HISTORICO_TIBC },
  { desde: '2019-03-01', hasta: '2019-03-31', resolucion: 'Resolución 0263 de 2019', fechaResolucion: '2019-02-28', interesBancarioCorrienteEA: 19.37, usuraEA: 29.06, url: HISTORICO_TIBC },
  { desde: '2019-04-01', hasta: '2019-04-30', resolucion: 'Resolución 0389 de 2019', fechaResolucion: '2019-03-29', interesBancarioCorrienteEA: 19.32, usuraEA: 28.98, url: HISTORICO_TIBC },
  { desde: '2019-05-01', hasta: '2019-05-31', resolucion: 'Resolución 0574 de 2019', fechaResolucion: '2019-04-30', interesBancarioCorrienteEA: 19.34, usuraEA: 29.01, url: HISTORICO_TIBC },
  { desde: '2019-06-01', hasta: '2019-06-30', resolucion: 'Resolución 0697 de 2019', fechaResolucion: '2019-05-30', interesBancarioCorrienteEA: 19.3, usuraEA: 28.95, url: HISTORICO_TIBC },
  { desde: '2019-07-01', hasta: '2019-07-31', resolucion: 'Resolución 0829 de 2019', fechaResolucion: '2019-06-28', interesBancarioCorrienteEA: 19.28, usuraEA: 28.92, url: HISTORICO_TIBC },
  { desde: '2019-08-01', hasta: '2019-08-31', resolucion: 'Resolución 1018 de 2019', fechaResolucion: '2019-07-31', interesBancarioCorrienteEA: 19.32, usuraEA: 28.98, url: HISTORICO_TIBC },
  { desde: '2019-09-01', hasta: '2019-09-30', resolucion: 'Resolución 1145 de 2019', fechaResolucion: '2019-08-30', interesBancarioCorrienteEA: 19.32, usuraEA: 28.98, url: HISTORICO_TIBC },
  { desde: '2019-10-01', hasta: '2019-10-31', resolucion: 'Resolución 1293 de 2019', fechaResolucion: '2019-09-30', interesBancarioCorrienteEA: 19.1, usuraEA: 28.65, url: HISTORICO_TIBC },
  { desde: '2019-11-01', hasta: '2019-11-30', resolucion: 'Resolución 1474 de 2019', fechaResolucion: '2019-10-30', interesBancarioCorrienteEA: 19.03, usuraEA: 28.55, url: HISTORICO_TIBC },
  { desde: '2019-12-01', hasta: '2019-12-31', resolucion: 'Resolución 1603 de 2019', fechaResolucion: '2019-11-29', interesBancarioCorrienteEA: 18.91, usuraEA: 28.37, url: HISTORICO_TIBC },
  { desde: '2020-01-01', hasta: '2020-01-31', resolucion: 'Resolución 1768 de 2019', fechaResolucion: '2019-12-27', interesBancarioCorrienteEA: 18.77, usuraEA: 28.16, url: HISTORICO_TIBC },
  { desde: '2020-02-01', hasta: '2020-02-29', resolucion: 'Resolución 0094 de 2020', fechaResolucion: '2020-01-30', interesBancarioCorrienteEA: 19.06, usuraEA: 28.59, url: HISTORICO_TIBC },
  { desde: '2020-03-01', hasta: '2020-03-31', resolucion: 'Resolución 0205 de 2020', fechaResolucion: '2020-02-27', interesBancarioCorrienteEA: 18.95, usuraEA: 28.43, url: HISTORICO_TIBC },
  { desde: '2020-04-01', hasta: '2020-04-30', resolucion: 'Resolución 0351 de 2020', fechaResolucion: '2020-03-27', interesBancarioCorrienteEA: 18.69, usuraEA: 28.04, url: HISTORICO_TIBC },
  { desde: '2020-05-01', hasta: '2020-05-31', resolucion: 'Resolución 0437 de 2020', fechaResolucion: '2020-04-30', interesBancarioCorrienteEA: 18.19, usuraEA: 27.29, url: HISTORICO_TIBC },
  { desde: '2020-06-01', hasta: '2020-06-30', resolucion: 'Resolución 0505 de 2020', fechaResolucion: '2020-05-29', interesBancarioCorrienteEA: 18.12, usuraEA: 27.18, url: HISTORICO_TIBC },
  { desde: '2020-07-01', hasta: '2020-07-31', resolucion: 'Resolución 0605 de 2020', fechaResolucion: '2020-06-30', interesBancarioCorrienteEA: 18.12, usuraEA: 27.18, url: HISTORICO_TIBC },
  { desde: '2020-08-01', hasta: '2020-08-31', resolucion: 'Resolución 0685 de 2020', fechaResolucion: '2020-07-31', interesBancarioCorrienteEA: 18.29, usuraEA: 27.44, url: HISTORICO_TIBC },
  { desde: '2020-09-01', hasta: '2020-09-30', resolucion: 'Resolución 0769 de 2020', fechaResolucion: '2020-08-28', interesBancarioCorrienteEA: 18.35, usuraEA: 27.53, url: HISTORICO_TIBC },
  { desde: '2020-10-01', hasta: '2020-10-31', resolucion: 'Resolución 0869 de 2020', fechaResolucion: '2020-09-30', interesBancarioCorrienteEA: 18.09, usuraEA: 27.14, url: HISTORICO_TIBC },
  { desde: '2020-11-01', hasta: '2020-11-30', resolucion: 'Resolución 0947 de 2020', fechaResolucion: '2020-10-29', interesBancarioCorrienteEA: 17.84, usuraEA: 26.76, url: HISTORICO_TIBC },
  { desde: '2020-12-01', hasta: '2020-12-31', resolucion: 'Resolución 1034 de 2020', fechaResolucion: '2020-11-26', interesBancarioCorrienteEA: 17.46, usuraEA: 26.19, url: HISTORICO_TIBC },
  { desde: '2021-01-01', hasta: '2021-01-31', resolucion: 'Resolución 1215 de 2020', fechaResolucion: '2020-12-30', interesBancarioCorrienteEA: 17.32, usuraEA: 25.98, url: HISTORICO_TIBC },
  { desde: '2021-02-01', hasta: '2021-02-28', resolucion: 'Resolución 0064 de 2021', fechaResolucion: '2021-01-29', interesBancarioCorrienteEA: 17.54, usuraEA: 26.31, url: HISTORICO_TIBC },
  { desde: '2021-03-01', hasta: '2021-03-31', resolucion: 'Resolución 0161 de 2021', fechaResolucion: '2021-02-26', interesBancarioCorrienteEA: 17.41, usuraEA: 26.115, url: HISTORICO_TIBC },
  { desde: '2021-04-01', hasta: '2021-04-30', resolucion: 'Resolución 0305 de 2021', fechaResolucion: '2021-03-31', interesBancarioCorrienteEA: 17.31, usuraEA: 25.965, url: HISTORICO_TIBC },
  { desde: '2021-05-01', hasta: '2021-05-31', resolucion: 'Resolución 0407 de 2021', fechaResolucion: '2021-04-30', interesBancarioCorrienteEA: 17.22, usuraEA: 25.83, url: HISTORICO_TIBC },
  { desde: '2021-06-01', hasta: '2021-06-30', resolucion: 'Resolución 0509 de 2021', fechaResolucion: '2021-05-28', interesBancarioCorrienteEA: 17.21, usuraEA: 25.815, url: HISTORICO_TIBC },
  { desde: '2021-07-01', hasta: '2021-07-31', resolucion: 'Resolución 0622 de 2021', fechaResolucion: '2021-06-30', interesBancarioCorrienteEA: 17.18, usuraEA: 25.77, url: HISTORICO_TIBC },
  { desde: '2021-08-01', hasta: '2021-08-31', resolucion: 'Resolución 0804 de 2021', fechaResolucion: '2021-07-30', interesBancarioCorrienteEA: 17.24, usuraEA: 25.86, url: HISTORICO_TIBC },
  { desde: '2021-09-01', hasta: '2021-09-30', resolucion: 'Resolución 0931 de 2021', fechaResolucion: '2021-08-30', interesBancarioCorrienteEA: 17.19, usuraEA: 25.785, url: HISTORICO_TIBC },
  { desde: '2021-10-01', hasta: '2021-10-31', resolucion: 'Resolución 1095 de 2021', fechaResolucion: '2021-09-30', interesBancarioCorrienteEA: 17.08, usuraEA: 25.62, url: HISTORICO_TIBC },
  { desde: '2021-11-01', hasta: '2021-11-30', resolucion: 'Resolución 1259 de 2021', fechaResolucion: '2021-10-29', interesBancarioCorrienteEA: 17.27, usuraEA: 25.905, url: HISTORICO_TIBC },
  { desde: '2021-12-01', hasta: '2021-12-31', resolucion: 'Resolución 1405 de 2021', fechaResolucion: '2021-11-30', interesBancarioCorrienteEA: 17.46, usuraEA: 26.19, url: HISTORICO_TIBC },
  { desde: '2022-01-01', hasta: '2022-01-31', resolucion: 'Resolución 1597 de 2021', fechaResolucion: '2021-12-30', interesBancarioCorrienteEA: 17.66, usuraEA: 26.49, url: HISTORICO_TIBC },
  { desde: '2022-02-01', hasta: '2022-02-28', resolucion: 'Resolución 0143 de 2022', fechaResolucion: '2022-01-28', interesBancarioCorrienteEA: 18.3, usuraEA: 27.45, url: HISTORICO_TIBC },
  { desde: '2022-03-01', hasta: '2022-03-31', resolucion: 'Resolución 0256 de 2022', fechaResolucion: '2022-02-25', interesBancarioCorrienteEA: 18.47, usuraEA: 27.705, url: HISTORICO_TIBC },
  { desde: '2022-04-01', hasta: '2022-04-30', resolucion: 'Resolución 0382 de 2022', fechaResolucion: '2022-03-31', interesBancarioCorrienteEA: 19.05, usuraEA: 28.575, url: HISTORICO_TIBC },
  { desde: '2022-05-01', hasta: '2022-05-31', resolucion: 'Resolución 0498 de 2022', fechaResolucion: '2022-04-29', interesBancarioCorrienteEA: 19.71, usuraEA: 29.565, url: HISTORICO_TIBC },
  { desde: '2022-06-01', hasta: '2022-06-30', resolucion: 'Resolución 0617 de 2022', fechaResolucion: '2022-05-31', interesBancarioCorrienteEA: 20.4, usuraEA: 30.6, url: HISTORICO_TIBC },
  { desde: '2022-07-01', hasta: '2022-07-31', resolucion: 'Resolución 0801 de 2022', fechaResolucion: '2022-06-30', interesBancarioCorrienteEA: 21.28, usuraEA: 31.92, url: HISTORICO_TIBC },
  { desde: '2022-08-01', hasta: '2022-08-31', resolucion: 'Resolución 0973 de 2022', fechaResolucion: '2022-07-29', interesBancarioCorrienteEA: 22.21, usuraEA: 33.315, url: HISTORICO_TIBC },
  { desde: '2022-09-01', hasta: '2022-09-30', resolucion: 'Resolución 1126 de 2022', fechaResolucion: '2022-08-31', interesBancarioCorrienteEA: 23.5, usuraEA: 35.25, url: HISTORICO_TIBC },
  { desde: '2022-10-01', hasta: '2022-10-31', resolucion: 'Resolución 1327 de 2022', fechaResolucion: '2022-09-29', interesBancarioCorrienteEA: 24.61, usuraEA: 36.915, url: HISTORICO_TIBC },
  { desde: '2022-11-01', hasta: '2022-11-30', resolucion: 'Resolución 1537 de 2022', fechaResolucion: '2022-10-28', interesBancarioCorrienteEA: 25.78, usuraEA: 38.67, url: HISTORICO_TIBC },
  { desde: '2022-12-01', hasta: '2022-12-31', resolucion: 'Resolución 1715 de 2022', fechaResolucion: '2022-11-30', interesBancarioCorrienteEA: 27.64, usuraEA: 41.46, url: HISTORICO_TIBC },
  { desde: '2023-01-01', hasta: '2023-01-31', resolucion: 'Resolución 1968 de 2022', fechaResolucion: '2022-12-29', interesBancarioCorrienteEA: 28.84, usuraEA: 43.26, url: HISTORICO_TIBC },
  { desde: '2023-02-01', hasta: '2023-02-28', resolucion: 'Resolución 0100 de 2023', fechaResolucion: '2023-01-27', interesBancarioCorrienteEA: 30.18, usuraEA: 45.27, url: HISTORICO_TIBC },
  { desde: '2023-03-01', hasta: '2023-03-31', resolucion: 'Resolución 0236 de 2023', fechaResolucion: '2023-02-24', interesBancarioCorrienteEA: 30.84, usuraEA: 46.26, url: HISTORICO_TIBC },
  { desde: '2023-04-01', hasta: '2023-04-30', resolucion: 'Resolución 0472 de 2023', fechaResolucion: '2023-03-30', interesBancarioCorrienteEA: 31.39, usuraEA: 47.085, url: HISTORICO_TIBC },
  { desde: '2023-05-01', hasta: '2023-05-31', resolucion: 'Resolución 0606 de 2023', fechaResolucion: '2023-04-28', interesBancarioCorrienteEA: 30.27, usuraEA: 45.405, url: HISTORICO_TIBC },
  { desde: '2023-06-01', hasta: '2023-06-30', resolucion: 'Resolución 0766 de 2023', fechaResolucion: '2023-05-31', interesBancarioCorrienteEA: 29.76, usuraEA: 44.64, url: HISTORICO_TIBC },
  { desde: '2023-07-01', hasta: '2023-07-31', resolucion: 'Resolución 0945 de 2023', fechaResolucion: '2023-06-30', interesBancarioCorrienteEA: 29.36, usuraEA: 44.04, url: HISTORICO_TIBC },
  { desde: '2023-08-01', hasta: '2023-08-31', resolucion: 'Resolución 1090 de 2023', fechaResolucion: '2023-07-31', interesBancarioCorrienteEA: 28.75, usuraEA: 43.125, url: HISTORICO_TIBC },
  { desde: '2023-09-01', hasta: '2023-09-30', resolucion: 'Resolución 1328 de 2023', fechaResolucion: '2023-08-31', interesBancarioCorrienteEA: 28.03, usuraEA: 42.045, url: HISTORICO_TIBC },
  { desde: '2023-10-01', hasta: '2023-10-31', resolucion: 'Resolución 1520 de 2023', fechaResolucion: '2023-09-27', interesBancarioCorrienteEA: 26.53, usuraEA: 39.795, url: HISTORICO_TIBC },
  { desde: '2023-11-01', hasta: '2023-11-30', resolucion: 'Resolución 1801 de 2023', fechaResolucion: '2023-10-30', interesBancarioCorrienteEA: 25.52, usuraEA: 38.28, url: HISTORICO_TIBC },
  { desde: '2023-12-01', hasta: '2023-12-31', resolucion: 'Resolución 2074 de 2023', fechaResolucion: '2023-11-30', interesBancarioCorrienteEA: 25.04, usuraEA: 37.56, url: HISTORICO_TIBC },
  { desde: '2024-01-01', hasta: '2024-01-31', resolucion: 'Resolución 2331 de 2023', fechaResolucion: '2023-12-29', interesBancarioCorrienteEA: 23.32, usuraEA: 34.98, url: HISTORICO_TIBC },
  { desde: '2024-02-01', hasta: '2024-02-29', resolucion: 'Resolución 0150 de 2024', fechaResolucion: '2024-01-29', interesBancarioCorrienteEA: 23.31, usuraEA: 34.97, url: HISTORICO_TIBC },
  { desde: '2024-03-01', hasta: '2024-03-31', resolucion: 'Resolución 0400 de 2024', fechaResolucion: '2024-02-29', interesBancarioCorrienteEA: 22.2, usuraEA: 33.3, url: HISTORICO_TIBC },
  { desde: '2024-04-01', hasta: '2024-04-30', resolucion: 'Resolución 0598 de 2024', fechaResolucion: '2024-03-21', interesBancarioCorrienteEA: 22.06, usuraEA: 33.09, url: HISTORICO_TIBC },
  { desde: '2024-05-01', hasta: '2024-05-31', resolucion: 'Resolución 0872 de 2024', fechaResolucion: '2024-04-30', interesBancarioCorrienteEA: 21.02, usuraEA: 31.53, url: HISTORICO_TIBC },
  { desde: '2024-06-01', hasta: '2024-06-30', resolucion: 'Resolución 1143 de 2024', fechaResolucion: '2024-05-31', interesBancarioCorrienteEA: 20.56, usuraEA: 30.84, url: HISTORICO_TIBC },
  { desde: '2024-07-01', hasta: '2024-07-31', resolucion: 'Resolución 1308 de 2024', fechaResolucion: '2024-06-28', interesBancarioCorrienteEA: 19.66, usuraEA: 29.49, url: HISTORICO_TIBC },
  { desde: '2024-08-01', hasta: '2024-08-31', resolucion: 'Resolución 1519 de 2024', fechaResolucion: '2024-07-31', interesBancarioCorrienteEA: 19.47, usuraEA: 29.21, url: HISTORICO_TIBC },
  { desde: '2024-09-01', hasta: '2024-09-30', resolucion: 'Resolución 1688 de 2024', fechaResolucion: '2024-08-30', interesBancarioCorrienteEA: 19.23, usuraEA: 28.85, url: HISTORICO_TIBC },
  { desde: '2024-10-01', hasta: '2024-10-31', resolucion: 'Resolución 1901 de 2024', fechaResolucion: '2024-09-30', interesBancarioCorrienteEA: 18.78, usuraEA: 28.17, url: HISTORICO_TIBC },
  { desde: '2024-11-01', hasta: '2024-11-30', resolucion: 'Resolución 2168 de 2024', fechaResolucion: '2024-10-31', interesBancarioCorrienteEA: 18.6, usuraEA: 27.9, url: HISTORICO_TIBC },
  { desde: '2024-12-01', hasta: '2024-12-31', resolucion: 'Resolución 2394 de 2024', fechaResolucion: '2024-11-29', interesBancarioCorrienteEA: 17.59, usuraEA: 26.39, url: HISTORICO_TIBC },
  { desde: '2025-01-01', hasta: '2025-01-31', resolucion: 'Resolución 2620 de 2024', fechaResolucion: '2024-12-27', interesBancarioCorrienteEA: 16.59, usuraEA: 24.89, url: HISTORICO_TIBC },
  { desde: '2025-02-01', hasta: '2025-02-28', resolucion: 'Resolución 0138 de 2025', fechaResolucion: '2025-01-30', interesBancarioCorrienteEA: 17.53, usuraEA: 26.3, url: HISTORICO_TIBC },
  { desde: '2025-03-01', hasta: '2025-03-31', resolucion: 'Resolución 0352 de 2025', fechaResolucion: '2025-02-28', interesBancarioCorrienteEA: 16.61, usuraEA: 24.92, url: HISTORICO_TIBC },
  { desde: '2025-04-01', hasta: '2025-04-30', resolucion: 'Resolución 0579 de 2025', fechaResolucion: '2025-03-31', interesBancarioCorrienteEA: 17.08, usuraEA: 25.62, url: HISTORICO_TIBC },
  { desde: '2025-05-01', hasta: '2025-05-31', resolucion: 'Resolución 0837 de 2025', fechaResolucion: '2025-04-30', interesBancarioCorrienteEA: 17.31, usuraEA: 25.97, url: HISTORICO_TIBC },
  { desde: '2025-06-01', hasta: '2025-06-30', resolucion: 'Resolución 1078 de 2025', fechaResolucion: '2025-05-30', interesBancarioCorrienteEA: 17.03, usuraEA: 25.55, url: HISTORICO_TIBC },
  { desde: '2025-07-01', hasta: '2025-07-31', resolucion: 'Resolución 1254 de 2025', fechaResolucion: '2025-06-27', interesBancarioCorrienteEA: 16.52, usuraEA: 24.78, url: HISTORICO_TIBC },
  { desde: '2025-08-01', hasta: '2025-08-31', resolucion: 'Resolución 1490 de 2025', fechaResolucion: '2025-07-31', interesBancarioCorrienteEA: 16.78, usuraEA: 25.17, url: HISTORICO_TIBC },
  { desde: '2025-09-01', hasta: '2025-09-30', resolucion: 'Resolución 1658 de 2025', fechaResolucion: '2025-08-29', interesBancarioCorrienteEA: 16.67, usuraEA: 25.01, url: HISTORICO_TIBC },
  { desde: '2025-10-01', hasta: '2025-10-31', resolucion: 'Resolución 1821 de 2025', fechaResolucion: '2025-09-30', interesBancarioCorrienteEA: 16.24, usuraEA: 24.36, url: HISTORICO_TIBC },
  { desde: '2025-11-01', hasta: '2025-11-30', resolucion: 'Resolución 1995 de 2025', fechaResolucion: '2025-10-31', interesBancarioCorrienteEA: 16.66, usuraEA: 24.99, url: HISTORICO_TIBC },
  { desde: '2025-12-01', hasta: '2025-12-31', resolucion: 'Resolución 2134 de 2025', fechaResolucion: '2025-11-28', interesBancarioCorrienteEA: 16.68, usuraEA: 25.02, url: HISTORICO_TIBC },
  { desde: '2026-01-01', hasta: '2026-01-31', resolucion: 'Resolución 2288 de 2025', fechaResolucion: '2025-12-26', interesBancarioCorrienteEA: 16.24, usuraEA: 24.36, url: HISTORICO_TIBC },
  { desde: '2026-02-01', hasta: '2026-02-28', resolucion: 'Resolución 0250 de 2026', fechaResolucion: '2026-01-30', interesBancarioCorrienteEA: 16.82, usuraEA: 25.23, url: HISTORICO_TIBC },
  { desde: '2026-03-01', hasta: '2026-03-31', resolucion: 'Resolución 0405 de 2026', fechaResolucion: '2026-02-27', interesBancarioCorrienteEA: 17.01, usuraEA: 25.52, url: HISTORICO_TIBC },
  { desde: '2026-04-01', hasta: '2026-04-30', resolucion: 'Resolución 0517 de 2026', fechaResolucion: '2026-03-27', interesBancarioCorrienteEA: 17.84, usuraEA: 26.76, url: HISTORICO_TIBC },
  { desde: '2026-05-01', hasta: '2026-05-31', resolucion: 'Resolución 0662 de 2026', fechaResolucion: '2026-04-30', interesBancarioCorrienteEA: 18.78, usuraEA: 28.17, url: HISTORICO_TIBC },
  { desde: '2026-06-01', hasta: '2026-06-30', resolucion: 'Resolución 0823 de 2026', fechaResolucion: '2026-05-29', interesBancarioCorrienteEA: 19.19, usuraEA: 28.79, url: HISTORICO_TIBC },
  { desde: '2026-07-01', hasta: '2026-07-31', resolucion: 'Resolución 0965 de 2026', fechaResolucion: '2026-06-30', interesBancarioCorrienteEA: 19.19, usuraEA: 28.79, url: HISTORICO_TIBC },
  { desde: '2026-08-01', hasta: '2026-08-31', resolucion: 'Resolución 1139 de 2026', fechaResolucion: '2026-07-31', interesBancarioCorrienteEA: 19.77, usuraEA: 29.66, url: HISTORICO_TIBC },
  { desde: '2026-09-01', hasta: '2026-09-30', resolucion: 'Resolución 1260 de 2026', fechaResolucion: '2026-08-31', interesBancarioCorrienteEA: 19.49, usuraEA: 29.24, url: SEP_2026_PDF }
];

export const CERTIFICACIONES_IBC: readonly CertificacionIbc[] = FILAS.map((f) => ({ ...f, consultadoEl: CONSULTADO_EL }));

export const PRIMER_DIA_CERTIFICADO = CERTIFICACIONES_IBC[0].desde;
export const ULTIMO_DIA_CERTIFICADO = CERTIFICACIONES_IBC[CERTIFICACIONES_IBC.length - 1].hasta;

// ─── Fuentes que acompañan toda liquidación por tramos ──────────────────────

export const FUENTE_HISTORICO_TIBC: Fuente = {
  nombre: 'Histórico del interés bancario corriente certificado (resolución, vigencia y tasa por modalidad)',
  norma: 'Superintendencia Financiera de Colombia · Histórico TIBC',
  url: HISTORICO_TIBC,
  consultadoEl: CONSULTADO_EL
};

export const FUENTE_HISTORICO_USURA: Fuente = {
  nombre: 'Histórico de la tasa de usura (1,5 × interés bancario corriente, por periodo)',
  norma: 'Superintendencia Financiera de Colombia · Histórico Tasa de Usura',
  url: HISTORICO_USURA,
  consultadoEl: CONSULTADO_EL
};

export const FUENTE_DECRETO_2555_IBC: Fuente = {
  nombre: 'Obligaciones distintas de operaciones activas de crédito: solo el IBC certificado para crédito de consumo y ordinario, del respectivo período',
  norma: 'Decreto 2555 de 2010, arts. 11.2.5.1.1 y 11.2.5.1.3',
  url: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=40032',
  consultadoEl: CONSULTADO_EL
};

export const FUENTE_EQUIVALENCIA_EA: Fuente = {
  nombre: '«Una tasa efectiva anual nunca se puede dividir por ningún denominador, por cuanto se trata de una función exponencial»',
  norma: 'Superintendencia Financiera, Concepto 2006022407-002 del 8 de agosto de 2006',
  url: `${DESCARGA}12369`,
  consultadoEl: CONSULTADO_EL
};

export const FUENTE_CC_67: Fuente = {
  nombre: 'Plazos: «el plazo de un año de 365 o 366 días, según los casos»',
  norma: 'Código Civil, art. 67',
  // La Secretaría del Senado solo responde por HTTP simple (igual que el art. 1617 en fuentes.ts).
  url: 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_civil_pr001.html',
  consultadoEl: CONSULTADO_EL
};
