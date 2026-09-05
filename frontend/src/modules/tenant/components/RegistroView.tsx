import React, { useState } from 'react';
import { AlertCircle, Check, Eye, EyeOff } from 'lucide-react';
import { IureonMark } from './IureonMark';
import { authApi, type ModoDeRegistro, type PlanDeRegistro } from '../../auth/auth.api';
import type { Session } from '../../auth/session';

interface RegistroViewProps {
  /** PRUEBA abre siete días de Esencial; COMPRA crea la cuenta y lleva al pago del plan. */
  modo: ModoDeRegistro;
  plan: PlanDeRegistro;
  onLoginSuccess: (session: Session) => void;
}

/**
 * La puerta pública: una sola pantalla para dos entradas.
 *
 * `?prueba=1` abre la prueba gratuita de Esencial (siete días, un usuario, sin
 * tarjeta). `?registro=PREMIUM` crea la cuenta para CONTRATAR ese plan: la
 * firma nace con el plan vencido, entra en solo lectura y la pantalla del plan
 * se abre sola con el plan elegido; el primer pago en Wompi la activa. No hay
 * un tercer estado «pendiente de pago»: lo que ya cierra una prueba vencida
 * cierra también una compra sin pagar.
 *
 * MISMA FORMA QUE `LoginPortalView` A PROPÓSITO: mitad izquierda con lo que se
 * ofrece, mitad derecha con el formulario. Quien llega desde la portada ya
 * leyó el argumento comercial; aquí la izquierda dice exactamente qué abre
 * ESTE plan y cuánto cuesta, para que nadie descubra después del pago que
 * Audiencias no venía en Esencial.
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

const MIN_CONTRASENA = 10;

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
 * número desfasado aquí no cobra de más — solo se vería distinto en el modal,
 * y `check:plan` vigila los precios del catálogo.
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
      // El servidor explica en español: «Ese correo ya tiene cuenta; inicie
      // sesión», «Desde esta conexión ya se abrieron 3 pruebas…».
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo crear la cuenta.');
    } finally {
      setEnviando(false);
    }
  };

  const kicker = esCompra ? `Contratar · plan ${ficha.nombre}` : 'Prueba gratuita · plan Esencial';
  const titulo = esCompra
    ? `${ficha.nombre}: ${pesos(ficha.precioMensual)} al mes o ${pesos(ficha.precioAnual)} al año.`
    : 'Siete días de Esencial. Sin tarjeta, sin llamada, sin cobro al terminar.';
  const bajada = esCompra
    ? 'La cuenta se crea ahora mismo y la aplicación abre en la pantalla del plan para pagar por Wompi. Al confirmarse el pago, todo queda habilitado en el acto; el periodo cuenta desde ese día y no se renueva solo.'
    : 'La cuenta se abre ahora mismo y entra directo a la aplicación. Al cumplirse los siete días pasa a solo lectura: conserva lo que hizo y decide si contrata.';
  const etiquetaBoton = enviando
    ? 'Creando la cuenta…'
    : esCompra
      ? `Crear cuenta y pagar ${ficha.nombre}`
      : 'Crear cuenta y probar 7 días';

  return (
    <div className="flex min-h-screen w-full font-sans">
      <aside className="hidden w-[46%] max-w-[596px] flex-col bg-nav p-8 lg:flex">
        <div className="flex items-center gap-1">
          <IureonMark size={28} onDark />
          <span className="text-subtitle tracking-[0.02em] text-white">Iureon</span>
        </div>

        <div className="mt-auto">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/55">{kicker}</p>
          <h1 className="mt-3 max-w-[440px] text-[30px] font-semibold leading-[1.25] text-white [text-wrap:pretty]">
            {titulo}
          </h1>
          <p className="mt-3.5 max-w-[430px] text-body leading-[1.65] text-white/70 [text-wrap:pretty]">{bajada}</p>

          <ul className="mt-7 max-w-[440px] space-y-2.5">
            {ficha.incluye.map((texto) => (
              <li key={texto} className="flex items-start gap-2.5 text-meta leading-[1.5] text-white/80">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/60" />
                <span>{texto}</span>
              </li>
            ))}
          </ul>

          <p className="mt-6 max-w-[440px] border-t border-white/15 pt-4 text-meta leading-[1.6] text-white/55 [text-wrap:pretty]">
            {ficha.usuarios}. {ficha.noIncluye && `${ficha.noIncluye} `}
            {esCompra && 'Precios con IVA incluido; el anual son doce meses por el precio de diez. '}
            Los escritos que genera la inteligencia artificial se descuentan de un saldo aparte, que
            empieza en cero y se recarga cuando usted quiera; el Catálogo, el Buscador y las
            Herramientas no consumen saldo.
          </p>
        </div>

        <p className="mt-auto pt-8 font-mono text-[11px] leading-[1.6] text-white/45">
          Tratamiento de datos conforme a la Ley 1581 de 2012 · subencargados publicados en la
          sección Privacidad
        </p>
      </aside>

      <main className="flex flex-1 items-center justify-center bg-surface p-6">
        <div className="w-full max-w-[380px]">
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <IureonMark size={26} />
            <span className="text-subtitle text-ink-900">Iureon</span>
          </div>

          <h2 className="text-title text-ink-900">
            {esCompra ? `Contratar ${ficha.nombre}` : 'Probar Esencial gratis'}
          </h2>
          <p className="mt-1 text-ui text-ink-500">
            {esCompra
              ? `${pesos(ficha.precioMensual)}/mes o ${pesos(ficha.precioAnual)}/año · ${ficha.usuarios.toLowerCase()} · se paga después de crear la cuenta.`
              : 'Siete días, un usuario, sin tarjeta.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3.5" autoComplete="on">
            <div>
              <label htmlFor="firma" className="mb-1.5 block text-meta font-medium text-ink-700">
                Nombre de la firma o del abogado
              </label>
              <input
                id="firma"
                type="text"
                value={firma}
                onChange={(e) => setFirma(e.target.value)}
                placeholder="Restrepo & Asociados"
                autoComplete="organization"
                className="field h-[38px]"
                maxLength={120}
                required
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-baseline gap-2">
                <label htmlFor="nit" className="text-meta font-medium text-ink-700">
                  NIT
                </label>
                <span className="ml-auto text-meta text-ink-400">Opcional</span>
              </div>
              <input
                id="nit"
                type="text"
                inputMode="numeric"
                value={nit}
                onChange={(e) => setNit(e.target.value)}
                placeholder="900.123.456-7"
                className="field h-[38px] font-mono"
                maxLength={20}
              />
            </div>

            <div>
              <label htmlFor="nombre" className="mb-1.5 block text-meta font-medium text-ink-700">
                Su nombre y apellido
              </label>
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Carolina Restrepo"
                autoComplete="name"
                className="field h-[38px]"
                maxLength={120}
                required
              />
            </div>

            <div>
              <label htmlFor="correo-registro" className="mb-1.5 block text-meta font-medium text-ink-700">
                Correo
              </label>
              <input
                id="correo-registro"
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="nombre@sufirma.co"
                autoComplete="email"
                className="field h-[38px]"
                required
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-baseline gap-2">
                <label htmlFor="clave-registro" className="text-meta font-medium text-ink-700">
                  Contraseña
                </label>
                <span className="ml-auto text-meta text-ink-400">Mínimo {MIN_CONTRASENA} caracteres</span>
              </div>
              <div className="relative">
                <input
                  id="clave-registro"
                  type={verContrasena ? 'text' : 'password'}
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  placeholder="••••••••••"
                  autoComplete="new-password"
                  className="field h-[38px] pr-10 font-mono tracking-[0.12em]"
                  minLength={MIN_CONTRASENA}
                  required
                />
                <button
                  type="button"
                  onClick={() => setVerContrasena((v) => !v)}
                  aria-label={verContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-0 top-0 flex h-[38px] w-10 items-center justify-center text-ink-400 hover:text-ink-700"
                >
                  {verContrasena ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
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

            <label className="flex cursor-pointer items-start gap-2.5 text-meta leading-[1.55] text-ink-700">
              <input
                type="checkbox"
                checked={acepta}
                onChange={(e) => setAcepta(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-brand-700"
                required
              />
              <span>
                Acepto el{' '}
                <a
                  href="/?entrar=1&ir=privacidad"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4 hover:text-ink-900"
                >
                  tratamiento de mis datos
                </a>{' '}
                conforme a la Ley 1581 de 2012. La dirección desde la que creo la cuenta se conserva
                para prevenir abusos.
              </span>
            </label>

            {errorMsg && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-card border border-[rgb(var(--danger-line))] bg-[rgb(var(--danger)/0.07)] px-3 py-2.5 text-ui text-ink-900"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button type="submit" disabled={enviando} className="btn-primary mt-1 h-10 w-full">
              {etiquetaBoton}
            </button>
          </form>

          <p className="mt-5 text-meta leading-[1.6] text-ink-400">
            ¿Ya tiene cuenta?{' '}
            <a href="/?entrar=1" className="text-ink-500 underline underline-offset-4 hover:text-ink-900">
              Inicie sesión
            </a>
            .{' '}
            {esCompra ? (
              <>
                ¿Prefiere probar primero?{' '}
                <a href="/?prueba=1" className="text-ink-500 underline underline-offset-4 hover:text-ink-900">
                  Siete días de Esencial gratis
                </a>
                .
              </>
            ) : (
              <>
                ¿Necesita Premium o Firma para varios abogados?{' '}
                <a href="/landing/index.html#planes" className="text-ink-500 underline underline-offset-4 hover:text-ink-900">
                  Contrátelo desde la página principal
                </a>
                .
              </>
            )}
          </p>
          <a
            href="/landing/index.html"
            className="mt-4 inline-block text-meta text-ink-500 underline underline-offset-4 hover:text-ink-900"
          >
            ← Volver a la página principal
          </a>
        </div>
      </main>
    </div>
  );
};
