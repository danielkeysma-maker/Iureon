import React, { useEffect, useState } from 'react';
import { Dialog } from '../../../design/Dialog';
import { brandingApi, type FirmBranding } from '../services/branding.api';
import { lineasDeMembrete } from '../../documents/services/membrete';

interface FirmBrandingModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Se llama con la marca guardada, para que la exportación la use al momento. */
  onSaved?: (branding: FirmBranding) => void;
}

/**
 * Membrete. Pantalla de `app-administrar-y-saldo.html` (artboard 6): el
 * formulario a la izquierda y, sobre el escritorio gris, el papel del escrito.
 *
 * ─── EL PAPEL SE ARMA CON LAS LÍNEAS DEL EXPORTADOR ─────────────────────────
 *
 * La previsualización no decide dónde va cada dato: llama a `lineasDeMembrete`,
 * la misma función con que el PDF y el Word arman su membrete. Así el nombre
 * encabeza, el NIT y la dirección van debajo, y los pies dicen lo que de verdad
 * imprime cada formato. Una previsualización con su propia idea del membrete
 * enseñaría un documento que no sale.
 *
 * ─── LO QUE EL ARTBOARD PIDE Y AQUÍ NO ESTÁ, con la razón ──────────────────
 *
 * · Los datos de ejemplo del artboard (nombre de firma, abogada, T.P.): van
 *   los marcadores del README §3. La versión anterior traía un nombre, una
 *   cédula, un NIT y una resolución de Colpensiones verosímiles.
 *
 * ─── LO QUE SE QUITÓ PORQUE NO SE IMPRIME ───────────────────────────────────
 *
 * · «Firma escaneada»: el servidor la guarda, pero NINGÚN exportador la lee
 *   (ni `documentExport.service` ni el acta). Ofrecer subirla era prometer una
 *   firma en el escrito que nunca aparecía. El dato guardado se conserva: se
 *   envía tal como llegó.
 * · El logotipo en SVG: el exportador solo incrusta PNG y JPG
 *   (`data:image/(png|jpe?g)`), así que el selector ya no ofrece SVG.
 *
 * ─── EL VELO NO CIERRA CON CAMBIOS SIN GUARDAR ──────────────────────────────
 *
 * Es el único caso del sistema donde el clic afuera pregunta en vez de cerrar.
 */

/* El papel se ve al tamaño del documento (1 pt = 4/3 px), sin bajar de 14 px en pantalla. */
const px = (pt: number): string => `${Math.max(14, Math.round((pt * 4) / 3))}px`;

const titulo = (m: FirmBranding, texto: string, n: number): string =>
  m.sectionTitles === 'ROMANOS' ? `${['I', 'II', 'III'][n - 1]}. ${texto}` : m.sectionTitles === 'ARABIGOS' ? `${n}. ${texto}` : texto;

const LETRAS_LIBRES = ['Plus Jakarta Sans', 'Manrope', 'Public Sans', 'Satoshi', 'Work Sans'];

export const FirmBrandingModal: React.FC<FirmBrandingModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [marca, setMarca] = useState<FirmBranding | null>(null);
  const [original, setOriginal] = useState<string>('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [avisoVelo, setAvisoVelo] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setAvisoVelo(false);
    brandingApi
      .get()
      .then(({ branding }) => {
        setMarca(branding);
        setOriginal(JSON.stringify(branding));
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'No se pudo leer el membrete.'));
  }, [isOpen]);

  const hayCambios = marca !== null && JSON.stringify(marca) !== original;

  const poner = <K extends keyof FirmBranding>(campo: K, valor: FirmBranding[K]) =>
    setMarca((m) => (m ? { ...m, [campo]: valor } : m));

  const subirLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = (ev) => poner('logoUrl', (ev.target?.result as string) ?? null);
    lector.readAsDataURL(archivo);
    e.target.value = '';
  };

  const guardar = async () => {
    if (!marca) return;
    setGuardando(true);
    setError('');
    try {
      const guardada = await brandingApi.put(marca);
      setMarca(guardada);
      setOriginal(JSON.stringify(guardada));
      onSaved?.(guardada);
      /*
       * El servidor sanea y descarta una imagen demasiado pesada sin fallar.
       * Si el logotipo enviado no volvió, se dice aquí en vez de cerrar como si
       * todo se hubiera guardado.
       */
      if (marca.logoUrl && !guardada.logoUrl) {
        setError('El servidor no guardó el logotipo: pruebe con una imagen más liviana. Lo demás quedó guardado.');
        return;
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el membrete.');
    } finally {
      setGuardando(false);
    }
  };

  const descartar = () => {
    setMarca(original ? (JSON.parse(original) as FirmBranding) : null);
    setAvisoVelo(false);
    onClose();
  };

  const m = marca;
  const lineas = m ? lineasDeMembrete(m) : null;

  return (
    <div className="cara-nueva cn-adm-dialogos">
      <div className="cn-adm-pantalla">
      <Dialog
        abierto={isOpen}
        onCerrar={onClose}
        tamano="L"
        titulo="Membrete"
        subtitulo="Va en los escritos que exporte y manda sobre el formato por defecto."
        hayCambiosSinGuardar={hayCambios}
        onIntentoDeCerrarConCambios={() => setAvisoVelo(true)}
        pieIzquierda={
          hayCambios ? <span className="cn-adm-pie-aviso">Cambios sin guardar</span> : <span>Se aplica a toda la firma</span>
        }
        acciones={
          <>
            <button type="button" onClick={descartar} className="cn-adm-boton cn-adm-boton--terciario" disabled={guardando}>
              Descartar
            </button>
            <button
              type="button"
              onClick={() => void guardar()}
              className="cn-adm-boton cn-adm-boton--primario"
              disabled={!hayCambios || guardando}
            >
              {guardando ? 'Guardando…' : 'Guardar el membrete'}
            </button>
          </>
        }
      >
        <div className="cn-adm-cuerpo">
          {error && (
            <p role="alert" className="cn-adm-error">
              {error}
            </p>
          )}
          {avisoVelo && hayCambios && (
            <p role="status" className="cn-adm-recuadro cn-adm-recuadro--arriba">
              Hay cambios sin guardar. Use «Guardar el membrete» o «Descartar»: el clic afuera no decide por usted.
            </p>
          )}

          {!m || !lineas ? (
            <p className="cn-adm-vacio">{error ? '' : 'Leyendo el membrete de la firma…'}</p>
          ) : (
            <div className="cn-adm-membrete">
              {/* ─── EL FORMULARIO ─────────────────────────────────────────── */}
              <div className="cn-adm-membrete-form">
                <section className="cn-adm-grupo" aria-labelledby="cn-adm-mem-datos">
                  <h3 id="cn-adm-mem-datos" className="cn-adm-seccion-titulo">
                    Datos de la firma
                  </h3>
                  <Campo
                    id="cn-adm-mem-nombre"
                    etiqueta="Nombre de la firma"
                    valor={m.firmName}
                    onCambio={(v) => poner('firmName', v)}
                    marcador="Nombre de la firma"
                    ayuda="Encabeza el escrito, en mayúsculas."
                  />
                  <Campo id="cn-adm-mem-nit" etiqueta="NIT" valor={m.firmNit} onCambio={(v) => poner('firmNit', v)} marcador="000.000.000-0" cifra />
                  <Campo
                    id="cn-adm-mem-direccion"
                    etiqueta="Dirección"
                    valor={m.firmAddress}
                    onCambio={(v) => poner('firmAddress', v)}
                    marcador="Dirección 00, ciudad"
                    ayuda="Va bajo el nombre, junto al NIT, y en el pie del Word."
                  />
                  <Campo
                    id="cn-adm-mem-telefono"
                    etiqueta="Teléfono"
                    valor={m.firmPhone}
                    onCambio={(v) => poner('firmPhone', v)}
                    marcador="(000) 000 00 00"
                    ayuda="Va en el pie del Word."
                  />
                  <Campo
                    id="cn-adm-mem-correo"
                    etiqueta="Correo de notificaciones judiciales"
                    valor={m.firmEmail}
                    onCambio={(v) => poner('firmEmail', v)}
                    marcador="notificaciones@sufirma.co"
                    ayuda="Va en el pie del PDF, y el motor lo escribe al cierre de los escritos nuevos."
                  />

                  <div>
                    <p className="cn-adm-etiqueta">
                      Logotipo <span className="cn-adm-etiqueta-opcional">(opcional)</span>
                    </p>
                    <div className="cn-adm-logo">
                      {m.logoUrl ? (
                        <img src={m.logoUrl} alt="Logotipo actual de la firma" />
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3" />
                          <polyline points="8 9 12 5 16 9" />
                          <line x1="12" y1="5" x2="12" y2="16" />
                        </svg>
                      )}
                      <span className="cn-adm-logo-texto">PNG o JPG, idealmente con fondo transparente.</span>
                      <label className="cn-adm-boton cn-adm-boton--blanco">
                        {m.logoUrl ? 'Reemplazar' : 'Elegir'}
                        <input type="file" accept="image/png,image/jpeg" className="cn-adm-archivo" onChange={subirLogo} />
                      </label>
                      {m.logoUrl && (
                        <button type="button" onClick={() => poner('logoUrl', null)} className="cn-adm-boton cn-adm-boton--terciario">
                          Quitar
                        </button>
                      )}
                    </div>
                  </div>
                </section>

                <section className="cn-adm-grupo" aria-labelledby="cn-adm-mem-formato">
                  <h3 id="cn-adm-mem-formato" className="cn-adm-seccion-titulo">
                    Formato del escrito
                  </h3>
                  <div className="cn-adm-par">
                    <div>
                      <label className="cn-adm-etiqueta" htmlFor="cn-adm-mem-letra">
                        Tipografía
                      </label>
                      <select
                        id="cn-adm-mem-letra"
                        value={m.fontFamily}
                        onChange={(e) => poner('fontFamily', e.target.value as FirmBranding['fontFamily'])}
                        className="cn-adm-campo"
                      >
                        {['Times New Roman', 'Arial', 'Calibri', 'Tahoma', 'Plus Jakarta Sans', 'Manrope', 'Public Sans', 'Satoshi', 'Work Sans', 'Inter'].map((f) => (
                          <option key={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="cn-adm-etiqueta" htmlFor="cn-adm-mem-tamano">
                        Tamaño
                      </label>
                      <select
                        id="cn-adm-mem-tamano"
                        value={m.fontSizePt}
                        onChange={(e) => poner('fontSizePt', Number(e.target.value))}
                        className="cn-adm-campo"
                      >
                        {[10, 11, 12, 13, 14].map((n) => (
                          <option key={n} value={n}>
                            {n} pt
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {/*
                    LO QUE PASA CON CADA LETRA AL SALIR, dicho antes de elegir: un
                    PDF solo se ve igual en todas partes si la letra va dentro; las
                    libres se incrustan, las propietarias no se pueden.
                  */}
                  <p className="cn-adm-ayuda">
                    {LETRAS_LIBRES.includes(m.fontFamily)
                      ? 'Letra libre: el PDF la lleva incrustada y se ve igual en todas partes. En Word solo se ve así si quien lo abre la tiene instalada.'
                      : m.fontFamily === 'Times New Roman'
                        ? 'Clásica: en Word está en todo equipo. El PDF usa Times, su equivalente estándar.'
                        : 'En Word está en todo equipo con Office. El PDF usa Helvetica, la equivalente estándar, porque esta letra no se puede incrustar sin licencia.'}
                  </p>

                  <Pastillas
                    etiqueta="Interlineado"
                    valor={m.lineSpacing}
                    opciones={[['1.0', '1,0'], ['1.5', '1,5'], ['2.0', '2,0']]}
                    onCambio={(v) => poner('lineSpacing', v as FirmBranding['lineSpacing'])}
                  />
                  <Pastillas
                    etiqueta="Numeración de hechos"
                    valor={m.factNumbering}
                    opciones={[['ARABIGA', '1. 2. 3.'], ['ORDINAL', 'PRIMERO.']]}
                    onCambio={(v) => poner('factNumbering', v as FirmBranding['factNumbering'])}
                  />
                  <Pastillas
                    etiqueta="Títulos de sección"
                    valor={m.sectionTitles}
                    opciones={[['ROMANOS', 'I. Romanos'], ['ARABIGOS', '1. Arábigos'], ['SIN_NUMERAR', 'Sin numerar']]}
                    onCambio={(v) => poner('sectionTitles', v as FirmBranding['sectionTitles'])}
                  />
                  {/* La numeración se impone al GENERAR: el texto ya escrito no se renumera. */}
                  <p className="cn-adm-ayuda">Numeración y títulos se aplican a los escritos que se generen desde ahora.</p>
                </section>

                <section className="cn-adm-grupo" aria-labelledby="cn-adm-mem-firma">
                  <h3 id="cn-adm-mem-firma" className="cn-adm-seccion-titulo">
                    Bloque de firma
                  </h3>
                  <Campo
                    id="cn-adm-mem-tp"
                    etiqueta="T.P. del abogado que firma"
                    valor={m.tpNumber}
                    onCambio={(v) => poner('tpNumber', v)}
                    marcador="000.000 del C.S.J."
                    ayuda="El motor la incluye en el bloque de firma de los escritos nuevos."
                    cifra
                  />
                </section>
              </div>

              {/* ─── EL PAPEL · siempre blanco, como sale el Word y el PDF ───── */}
              <div className="cn-adm-escritorio">
                <div
                  className="cn-adm-papel"
                  aria-label="Previsualización del escrito"
                  style={{
                    fontFamily: `'${m.fontFamily}', Georgia, serif`,
                    fontSize: px(m.fontSizePt),
                    lineHeight: m.lineSpacing === '1.0' ? 1.35 : m.lineSpacing === '1.5' ? 1.7 : 2.1
                  }}
                >
                  <div className="cn-adm-papel-membrete">
                    {m.logoUrl && <img src={m.logoUrl} alt="" />}
                    <div>
                      {lineas.encabezado ? (
                        <p className="cn-adm-papel-firma">{lineas.encabezado}</p>
                      ) : (
                        <p className="cn-adm-papel-vacio">Sin nombre: el escrito sale sin encabezado.</p>
                      )}
                      {lineas.identificacion && (
                        <p className="cn-adm-papel-datos" style={{ fontSize: px(m.fontSizePt - 2) }}>
                          {lineas.identificacion}
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="cn-adm-papel-centro">JUZGADO 00 CIVIL MUNICIPAL</p>
                  <p className="cn-adm-papel-centro cn-adm-papel-centro--suave">E. S. D.</p>
                  <p className="cn-adm-papel-parrafo">
                    <strong>Referencia:</strong> contestación de la demanda.
                  </p>

                  <p className="cn-adm-papel-titulo">{titulo(m, 'PRETENSIONES', 1)}</p>
                  <p className="cn-adm-papel-parrafo">Texto de las pretensiones del escrito.</p>

                  <p className="cn-adm-papel-titulo">{titulo(m, 'HECHOS', 2)}</p>
                  <p className="cn-adm-papel-parrafo">{m.factNumbering === 'ORDINAL' ? 'PRIMERO.' : '1.'} Texto del primer hecho.</p>

                  <p className="cn-adm-papel-cierre">Atentamente,</p>
                  <p className="cn-adm-papel-firma">Nombre del abogado</p>
                  <p style={{ fontSize: px(m.fontSizePt - 2) }}>
                    C.C. 00.000.000{m.tpNumber ? ` · T.P. ${m.tpNumber}` : ''}
                  </p>
                  {m.firmEmail && <p style={{ fontSize: px(m.fontSizePt - 2) }}>{m.firmEmail}</p>}

                  {(lineas.pieIzquierda || lineas.pieContacto) && (
                    <div className="cn-adm-papel-pie" style={{ fontSize: px(m.fontSizePt - 2) }}>
                      {lineas.pieIzquierda && <p>Pie del PDF: {lineas.pieIzquierda}</p>}
                      {lineas.pieContacto && <p>Pie del Word: {lineas.pieContacto}</p>}
                    </div>
                  )}
                </div>
                <p className="cn-adm-escritorio-nota">
                  Sobre papel blanco a propósito: así sale el Word y el PDF, esté la aplicación en el tema que esté.
                </p>
              </div>
            </div>
          )}
        </div>
      </Dialog>
      </div>
    </div>
  );
};

/** Un campo de texto con su etiqueta y su ayuda. `cifra` = mono, solo para lo citable (NIT, T.P.). */
const Campo: React.FC<{
  id: string;
  etiqueta: string;
  valor: string;
  onCambio: (v: string) => void;
  marcador: string;
  ayuda?: string;
  cifra?: boolean;
}> = ({ id, etiqueta, valor, onCambio, marcador, ayuda, cifra }) => (
  <div>
    <label className="cn-adm-etiqueta" htmlFor={id}>
      {etiqueta}
    </label>
    <input
      id={id}
      value={valor}
      onChange={(e) => onCambio(e.target.value)}
      placeholder={marcador}
      className={`cn-adm-campo ${cifra ? 'cn-adm-campo--cifra' : ''}`}
    />
    {ayuda && <p className="cn-adm-ayuda">{ayuda}</p>}
  </div>
);

/** Opciones en pastillas del tamaño del dedo. */
const Pastillas: React.FC<{
  etiqueta: string;
  valor: string;
  opciones: Array<[string, string]>;
  onCambio: (v: string) => void;
}> = ({ etiqueta, valor, opciones, onCambio }) => (
  <div role="radiogroup" aria-label={etiqueta}>
    <p className="cn-adm-etiqueta">{etiqueta}</p>
    <div className="cn-adm-pastillas">
      {opciones.map(([v, texto]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={valor === v}
          onClick={() => onCambio(v)}
          className={`cn-adm-pastilla ${valor === v ? 'cn-adm-pastilla--elegida' : ''}`}
        >
          {texto}
        </button>
      ))}
    </div>
  </div>
);
