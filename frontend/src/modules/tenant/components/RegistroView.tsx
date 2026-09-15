import React, { useState } from 'react';
import { AlertCircle, Check, Eye, EyeOff } from 'lucide-react';
import { IureonMark } from './IureonMark';
import { authApi, type ModoDeRegistro, type PlanDeRegistro } from '../../auth/auth.api';
import type { Session } from '../../auth/session';
import { MIN_CONTRASENA } from '../../auth/contrasena';
import { DIAS_DE_PRUEBA_GRATUITA } from '../../subscriptions/pruebaTerminada';
import '../../../design/cara-nueva.css';

interface RegistroViewProps {
  /** PRUEBA abre la prueba gratuita de Esencial; COMPRA crea la cuenta y lleva al pago del plan. */
  modo: ModoDeRegistro;
  plan: PlanDeRegistro;
  onLoginSuccess: (session: Session) => void;
}

/**
 * La puerta pública: una sola pantalla para dos entradas.
 *
 * `/prueba` abre la prueba gratuita de Esencial (`DIAS_DE_PRUEBA_GRATUITA`
 * días, un usuario, sin tarjeta). `/registro/premium` crea la cuenta para
 * CONTRATAR ese plan: la firma nace con el plan vencido, entra en solo lectura
 * y la pantalla del plan se abre sola con el plan elegido; el primer pago en
 * Wompi la activa.
 *
 * LA CARA NUEVA (marco «Registre su firma» de
 * `public/handoff/app-entrada-y-sesion.html`), con el panel oscuro de la
 * entrada a la derecha en escritorio: quien llega desde la portada ya leyó el
 * argumento comercial, y ahí se dice exactamente qué abre ESTE plan y cuánto
 * cuesta, para que nadie descubra después del pago que Audiencias no venía en
 * Esencial. Estilos en `design/cara-nueva.css`, bajo `.cara-nueva`.
 *
 * LO QUE LA MAQUETA DECÍA Y ES FALSO, CORREGIDO:
 * - «14 días del plan Premium y $14.000 de saldo de cortesía». La prueba es de
 *   Esencial, dura `DIAS_DE_PRUEBA_GRATUITA` (`trial.rules.ts`) y abre con
 *   saldo cero (`initialCredits: 0`, `trial.service.ts`).
 * - «Una firma solo tiene una prueba gratuita». La regla es por PERSONA: el
 *   correo o la conexión desde la que se pide, sin ventana de tiempo, y el
 *   registro sobrevive al borrado de la firma (`pruebaYaUsada`).
 * - «Declaro que soy quien puede obligarla»: una declaración jurídica que el
 *   producto no ha decidido pedir. Se conserva el consentimiento de hoy.
 * Y lo que decía ESTA pantalla: «al cumplirse los siete días pasa a solo
 * lectura». Desde e9d23a2 la prueba terminada sin pago pierde todo el acceso y
 * solo puede contratar o borrar sus datos; nada se borra solo.
 *
 * `check:cifras-entrada` (backend) vigila precios, usuarios y esas frases.
 *
 * LO QUE SE DICE DEL SALDO SE DICE ANTES DE PEDIR LA CONTRASEÑA. El plan es el
 * derecho a usar la aplicación; la redacción consume un saldo aparte que
 * empieza en cero. Callarlo produciría una cuenta abierta con ilusión y un
 * primer escrito que responde «recargue».
 *
 * El campo `empresa` es un honeypot: oculto para una persona, tentador para
 * un robot que llena todo. El servidor rechaza la solicitud si trae algo, con
 * un mensaje genérico para no enseñarle al robot qué campo dejar vacío.
 */

/** sessionStorage: el plan elegido, que `App.tsx` lee para abrir la pantalla del plan. */
const PLAN_ELEGIDO_KEY = 'iureon.plan-elegido';

// La misma regla que el restablecimiento por correo: `auth/contrasena.ts`.

interface FichaDePlan {
  nombre: string;
  precioMensual: number;
  precioAnual: number;
  usuarios: string;
  incluye: readonly string[];
  /** Lo que NO trae, dicho aquí y no descubierto adentro. Vacío si trae todo. */
  noIncluye: string;
}

/*
 * Copia local del catálogo, no una llamada: esta pantalla existe antes de
 * cualquier sesión y el servidor firma el precio real al pagar, así que un
 * número desfasado aquí no cobra de más — pero sí promete mal. Por eso
 * `check:cifras-entrada` compara precios y usuarios con `PLANES` de
 * `plan.catalog.ts`.
 */
const FICHAS: Record<PlanDeRegistro, FichaDePlan> = {
  ESENCIAL: {
    nombre: 'Esencial',
    precioMensual: 85_000,
    precioAnual: 850_000,
    usuarios: 'Un usuario',
    incluye: [
      'Redacción de escritos con el término y el artículo verificados',
      'Revisión de escritos ya redactados, con guía',
      'Catálogo de actuaciones, Buscador de jurisprudencia y Herramientas',
      'Borradores, Membrete, Manual y Soporte'
    ],
    noIncluye: 'No incluye Audiencias, Entrevistas ni Orientación, que son de Premium y Firma.'
  },
  PREMIUM: {
    nombre: 'Premium',
    precioMensual: 120_000,
    precioAnual: 1_200_000,
    usuarios: 'Hasta cinco usuarios',
    incluye: [
      'Todo lo de Esencial: Redacción, Revisiones, Catálogo, Buscador y Herramientas',
      'Audiencias: transcripción que separa quién habla y actas',
      'Entrevistas de cliente con sugerencia de jurisprudencia',
      'Orientación: de los hechos a la actuación, con término y precio'
    ],
    noIncluye: ''
  },
  FIRMA: {
    nombre: 'Firma',
    precioMensual: 250_000,
    precioAnual: 2_500_000,
    usuarios: 'Hasta quince usuarios',
    incluye: [
      'Todos los módulos de Premium, sin excepción',
      'Audiencias, Entrevistas y Orientación',
      'Quince cuentas para la oficina que superó las cinco de Premium',
      'Auditoría de la firma, Membrete, Manual y Soporte'
    ],
    noIncluye: ''
  }
};

const pesos = (valor: number): string => `$${valor.toLocaleString('es-CO')}`;

/** Una cuantía: va en mono porque es citable. */
const Cuantia: React.FC<{ valor: number }> = ({ valor }) => <span className="cn-mono">{pesos(valor)}</span>;

export const RegistroView: React.FC<RegistroViewProps> = ({ modo, plan, onLoginSuccess }) => {
  const esCompra = modo === 'COMPRA';
  const ficha = FICHAS[plan];

  const [firma, setFirma] = useState('');
  const [nit, setNit] = useState('');
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [acepta, setAcepta] = useState(false);
  const [empresa, setEmpresa] = useState('');
  const [verContrasena, setVerContrasena] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Las mismas reglas que el servidor, para no viajar por un error obvio.
    if (firma.trim().length < 3) return setErrorMsg('Escriba el nombre de la firma o del abogado.');
    if (!nombre.trim().includes(' ')) return setErrorMsg('Escriba su nombre y su apellido.');
    if (!correo.includes('@')) return setErrorMsg('Escriba un correo válido: es donde recibirá el acceso.');
    if (contrasena.length < MIN_CONTRASENA) {
      return setErrorMsg(`La contraseña debe tener al menos ${MIN_CONTRASENA} caracteres.`);
    }
    if (!acepta) return setErrorMsg('Debe aceptar la política de tratamiento de datos para crear la cuenta.');

    setEnviando(true);
    try {
      const { session } = await authApi.registro({
        modo,
        plan,
        firma: firma.trim(),
        nit: nit.trim(),
        nombre: nombre.trim(),
        correo: correo.trim(),
        contrasena,
        acepta: true,
        empresa
      });
      /*
       * Para la compra, el plan elegido se deja donde `App.tsx` ya lo busca al
       * nacer la sesión: la pantalla del plan se abre sola con esa tarjeta
       * destacada. Se escribe ANTES de entregar la sesión, porque el efecto
       * que la lee corre en el mismo render en que la sesión aparece.
       */
      if (esCompra) sessionStorage.setItem(PLAN_ELEGIDO_KEY, plan);
      onLoginSuccess(session);
    } catch (err) {
      // El servidor explica en español: «Ese correo ya tiene cuenta…», «Ya usó
      // su prueba gratuita…». Se muestra tal como llega.
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo crear la cuenta.');
    } finally {
      setEnviando(false);
    }
  };

  const etiquetaBoton = enviando
    ? 'Creando la cuenta…'
    : esCompra
      ? `Crear la cuenta y pagar ${ficha.nombre}`
      : `Crear la firma y probar ${DIAS_DE_PRUEBA_GRATUITA} días`;

  return (
    <div className="cara-nueva cara-nueva--pagina">
      <main className="cn-columna cn-columna--ancha">
        <div className="cn-columna-cuerpo">
          <div className="cn-marca">
            <IureonMark size={24} />
            <span>IUREON</span>
          </div>

          <h1 className="cn-titulo">{esCompra ? `Registre su firma y contrate ${ficha.nombre}` : 'Registre su firma'}</h1>
          <p className="cn-bajada">
            {esCompra ? (
              <>
                <Cuantia valor={ficha.precioMensual} /> al mes o <Cuantia valor={ficha.precioAnual} /> al año, IVA
                incluido · {ficha.usuarios.toLowerCase()}. Se paga por Wompi después de crear la cuenta.
              </>
            ) : (
              <>{DIAS_DE_PRUEBA_GRATUITA} días del plan Esencial gratis, para un usuario. Sin tarjeta.</>
            )}
          </p>

          <form onSubmit={handleSubmit} className="cn-campos" autoComplete="on">
            <div>
              <label htmlFor="firma" className="cn-etiqueta">
                Nombre de la firma o del abogado
              </label>
              <input
                id="firma"
                type="text"
                value={firma}
                onChange={(e) => setFirma(e.target.value)}
                placeholder="Restrepo & Asociados"
                autoComplete="organization"
                className="cn-campo"
                maxLength={120}
                required
              />
            </div>

            <div>
              <div className="cn-etiqueta-fila">
                <label htmlFor="nit" className="cn-etiqueta">
                  NIT
                </label>
                <span className="cn-nota-campo">Opcional</span>
              </div>
              <input
                id="nit"
                type="text"
                inputMode="numeric"
                value={nit}
                onChange={(e) => setNit(e.target.value)}
                placeholder="900.123.456-7"
                className="cn-campo cn-campo--mono"
                maxLength={20}
              />
            </div>

            <div>
              <label htmlFor="nombre" className="cn-etiqueta">
                Su nombre y apellido
              </label>
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Carolina Restrepo"
                autoComplete="name"
                className="cn-campo"
                maxLength={120}
                required
              />
            </div>

            <div className="cn-dos">
              <div>
                <label htmlFor="correo-registro" className="cn-etiqueta">
                  Su correo
                </label>
                <input
                  id="correo-registro"
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="nombre@sufirma.co"
                  autoComplete="email"
                  className="cn-campo"
                  required
                />
              </div>

              <div>
                <label htmlFor="clave-registro" className="cn-etiqueta">
                  Contraseña
                </label>
                <div className="cn-con-boton">
                  <input
                    id="clave-registro"
                    type={verContrasena ? 'text' : 'password'}
                    value={contrasena}
                    onChange={(e) => setContrasena(e.target.value)}
                    placeholder="••••••••••"
                    autoComplete="new-password"
                    aria-describedby="clave-registro-ayuda"
                    className="cn-campo cn-campo--clave"
                    minLength={MIN_CONTRASENA}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setVerContrasena((v) => !v)}
                    aria-label={verContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="cn-ver-clave"
                  >
                    {verContrasena ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
                  </button>
                </div>
                <p id="clave-registro-ayuda" className="cn-ayuda">
                  Mínimo {MIN_CONTRASENA} caracteres
                </p>
              </div>
            </div>

            {/*
              Honeypot: fuera de la vista y del orden de tabulación, sin
              autocompletar. Una persona nunca lo toca.
            */}
            <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
              <label htmlFor="empresa">Empresa</label>
              <input
                id="empresa"
                name="empresa"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
              />
            </div>

            {/*
              LA REGLA DE LA PRUEBA SE LEE ANTES DE CREAR LA CUENTA, no después
              (SPEC §4): encima del consentimiento y del botón, también en móvil,
              donde el panel de la derecha no existe.
            */}
            {esCompra ? (
              <div className="cn-recuadro">
                <p>
                  Pago por Wompi, sin tarjeta guardada. Nunca hay cobro automático: el periodo no se renueva solo.
                </p>
              </div>
            ) : (
              <div className="cn-aviso">
                <p>
                  <strong>Una prueba gratuita por persona.</strong> Se reconoce por el correo o por la conexión a
                  internet desde la que se pide, sin importar cuánto tiempo haya pasado, y el registro se conserva
                  aunque la firma se elimine.
                </p>
                <p>
                  Al terminar los {DIAS_DE_PRUEBA_GRATUITA} días, la firma pierde el acceso a la aplicación: solo podrá
                  contratar un plan o borrar sus datos. Nada se borra por sí solo.
                </p>
              </div>
            )}

            <label className="cn-acepto">
              <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} required />
              <span>
                Acepto el{' '}
                <a href="/privacidad" target="_blank" rel="noreferrer">
                  tratamiento de mis datos
                </a>{' '}
                conforme a la Ley 1581 de 2012. La dirección desde la que creo la cuenta se conserva para prevenir
                abusos.
              </span>
            </label>

            {errorMsg && (
              <div role="alert" className="cn-error">
                <AlertCircle size={18} aria-hidden="true" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button type="submit" disabled={enviando} className="cn-boton h-solid">
              {etiquetaBoton}
            </button>
          </form>

          <div className="cn-texto" style={{ marginTop: 20 }}>
            <p>
              ¿Ya tiene cuenta? <a href="/entrar">Entrar</a>
            </p>
            {esCompra ? (
              <p>
                ¿Prefiere probar primero?{' '}
                <a href="/prueba">
                  {DIAS_DE_PRUEBA_GRATUITA} días de Esencial gratis
                </a>
              </p>
            ) : (
              <p>
                ¿Necesita Premium o Firma para varios abogados?{' '}
                <a href="/#planes">Contrátelo desde la página principal</a>
              </p>
            )}
          </div>

          <div className="cn-pie-flujo">
            <a href="/" className="cn-volver">
              ← Volver a la página principal
            </a>
          </div>
        </div>
      </main>

      <aside className="cn-panel" aria-label={esCompra ? `Lo que incluye ${ficha.nombre}` : 'Lo que incluye la prueba'}>
        <div className="cn-panel-cuerpo">
          <p className="cn-kicker">{esCompra ? `Contratar · plan ${ficha.nombre}` : 'Prueba gratuita · plan Esencial'}</p>
          <h2 className="cn-panel-titulo">
            {esCompra ? (
              <>
                {ficha.nombre}: <Cuantia valor={ficha.precioMensual} /> al mes o <Cuantia valor={ficha.precioAnual} />{' '}
                al año.
              </>
            ) : (
              <>{DIAS_DE_PRUEBA_GRATUITA} días de Esencial. Sin tarjeta y sin cobro al terminar.</>
            )}
          </h2>
          <p className="cn-panel-bajada">
            {esCompra
              ? 'La cuenta se crea ahora mismo y la aplicación abre en la pantalla del plan para pagar por Wompi. Al confirmarse el pago, todo queda habilitado en el acto; el periodo cuenta desde ese día y no se renueva solo.'
              : 'La cuenta se abre ahora mismo y entra directo a la aplicación.'}
          </p>

          <ul className="cn-incluye">
            {ficha.incluye.map((texto) => (
              <li key={texto}>
                <Check size={16} aria-hidden="true" />
                <span>{texto}</span>
              </li>
            ))}
          </ul>

          <p className="cn-panel-letra">
            {ficha.usuarios}. {ficha.noIncluye && `${ficha.noIncluye} `}
            {esCompra && 'Precios con IVA incluido; el anual son doce meses por el precio de diez. '}
            Los escritos que genera la inteligencia artificial se descuentan de un saldo aparte, que empieza en cero y
            se recarga cuando usted quiera; el Catálogo, el Buscador y las Herramientas no consumen saldo.
          </p>
        </div>

        <p className="cn-panel-ley">
          Tratamiento de datos conforme a la Ley 1581 de 2012 · subencargados publicados en la sección Privacidad
        </p>
      </aside>
    </div>
  );
};
