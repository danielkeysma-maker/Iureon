import React from 'react';
import { AlertCircle, Lock, RefreshCw } from 'lucide-react';
import { Dialog } from '../../../design/Dialog';
import { adminApi, type CatalogoMaestro } from '../admin.api';

/**
 * Catálogo maestro. Artboard 8b.
 *
 * ─── LA TARJETA ROJA ES LA PANTALLA, NO UN PIE DE PÁGINA ────────────────────
 *
 * El artboard llama a esto «la línea que no se cruza»: lo que una firma cura es
 * suyo y nunca vuelve al maestro. Aquí eso no se promete, se demuestra — lo
 * único que llega del servidor son cuentas (cuántas firmas tocaron cada
 * actuación), porque la consulta no selecciona una sola columna de texto
 * escrito por un abogado de otra firma. Lo que no se lee no se puede filtrar
 * por descuido.
 *
 * ─── LO QUE EL ARTBOARD PIDE Y AQUÍ NO ESTÁ, con la razón ───────────────────
 *
 * Tres bloques del diseño no se pintaron, y NO por falta de tiempo: pintarlos
 * hoy sería mentir sobre lo que el producto puede hacer.
 *
 * · «Norma derogada · 38». El tipo `Actuacion` no tiene campo de derogatoria.
 *   Ninguna ficha declara si su norma sigue viva, así que la cifra no se puede
 *   calcular; adivinarla leyendo el texto del artículo daría un número que
 *   parece dato. Se dice que no se sabe, que es lo que se sabe.
 * · «Publicar cambios» y la propagación a las firmas. El maestro es un
 *   ARTEFACTO DE COMPILACIÓN: sale de `research/actuaciones-*.json`, pasa por
 *   `build-catalog.py` y viaja dentro del paquete. No hay nada que escribir en
 *   caliente, así que un botón «Publicar» no propagaría nada — y el propio
 *   artboard llama a esa acción la más peligrosa de toda la consola. Un botón
 *   peligroso que no hace nada enseña a pulsarlo.
 * · «Propuestas de las firmas». No hay tabla ni flujo: hoy una firma no puede
 *   ofrecer una actuación al maestro. La lista está vacía por inexistente, no
 *   por estar a cero, y la diferencia importa.
 *
 * La regla de fondo del artboard —una derogatoria no borra la verificación de
 * la firma, la reetiqueta como «verificada contra norma derogada»— se escribe
 * aquí como lo que gobernará esa publicación cuando exista, para que quien la
 * construya no tenga que redescubrirla.
 */

const numero = (n: number): string => n.toLocaleString('es-CO');

const RAMA: Record<string, string> = {
  ADMINISTRATIVO: 'Administrativo',
  CIVIL: 'Civil',
  FAMILIA: 'Familia',
  FAMILIA_ADMINISTRATIVA: 'Familia administrativa',
  NOTARIAL: 'Notarial',
  CONSTITUCIONAL: 'Constitucional',
  LABORAL: 'Laboral',
  SEGURIDAD_SOCIAL: 'Seguridad social',
  RESPONSABILIDAD_FISCAL: 'Responsabilidad fiscal',
  CONTRATOS: 'Contratos privados',
  EXTINCION_DOMINIO: 'Extinción de dominio',
  RESTITUCION_TIERRAS: 'Restitución de tierras',
  URBANISMO: 'Urbanismo y licencias',
  DISCIPLINARIO: 'Disciplinario',
  PENAL: 'Penal',
  AMBIENTAL: 'Ambiental',
  ADUANERO: 'Aduanero',
  INSOLVENCIA: 'Insolvencia',
  SOCIETARIO: 'Societario',
  POLICIVO: 'Policivo',
  ARBITRAJE: 'Arbitraje',
  PROPIEDAD_INTELECTUAL: 'Propiedad intelectual',
  CONTRATACION: 'Contratación',
  TRIBUTARIO: 'Tributario',
  SUPERINTENDENCIAS: 'Superintendencias',
  TRANSITO: 'Tránsito',
  INTERNACIONAL: 'Internacional',
  AGRARIO: 'Agrario'
};

const ROL: Record<string, string> = {
  LITIGANTE: 'Litigante',
  DESPACHO: 'Despacho',
  SECRETARIA: 'Secretaría'
};

const Metrica: React.FC<{ rotulo: string; valor: string; nota: string }> = ({
  rotulo,
  valor,
  nota
}) => (
  <div className="rounded-card border border-line-200 bg-surface px-4 py-3">
    <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">
      {rotulo}
    </p>
    <p className="mt-1 text-[19px] font-semibold leading-none text-ink-900">{valor}</p>
    <p className="mt-1.5 text-justify text-[11px] leading-snug text-ink-500 [text-wrap:pretty]">
      {nota}
    </p>
  </div>
);

interface CatalogMasterDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CatalogMasterDialog: React.FC<CatalogMasterDialogProps> = ({ isOpen, onClose }) => {
  const [maestro, setMaestro] = React.useState<CatalogoMaestro | null>(null);
  const [cargando, setCargando] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    let vigente = true;
    setCargando(true);
    setError(null);
    adminApi
      .catalogMaster()
      .then((m) => {
        if (vigente) setMaestro(m);
      })
      .catch((e: unknown) => {
        if (vigente) setError(e instanceof Error ? e.message : 'No se pudo leer el maestro.');
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [isOpen]);

  return (
    <Dialog
      abierto={isOpen}
      onCerrar={onClose}
      titulo="Catálogo maestro"
      subtitulo="La base que reciben todas las firmas. Cada una la extiende y la verifica por su cuenta; lo que una firma cura nunca vuelve aquí."
      tamano="L"
      cuerpoEnCanvas
    >
      {cargando && (
        <div className="flex items-center justify-center gap-2 py-16 text-ink-400">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-[13px]">Leyendo el maestro…</span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-card border border-[rgb(var(--danger)/0.35)] bg-[rgb(var(--danger)/0.06)] px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          <p className="text-justify text-[12px] leading-snug text-danger [text-wrap:pretty]">
            {error}
          </p>
        </div>
      )}

      {maestro && !cargando && (
        <div className="space-y-4">
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metrica
              rotulo="Actuaciones base"
              valor={numero(maestro.actuacionesBase)}
              nota={`En ${maestro.ramas} ramas · ${maestro.transversales} transversales, que aparecen en todas`}
            />
            <Metrica
              rotulo="Con término verificado"
              valor={numero(maestro.conTerminoVerificado)}
              nota={`${numero(maestro.noCaduca)} más no caducan, que es una respuesta y no un hueco`}
            />
            <Metrica
              rotulo="Sin verificar"
              valor={numero(maestro.sinVerificar)}
              nota="Publican advertencia al abogado en vez de un plazo que nadie comprobó"
            />
            <Metrica
              rotulo="Con norma derogada"
              valor="—"
              nota="No se sabe: ninguna ficha declara si su norma sigue viva. Ver abajo."
            />
          </section>

          <section className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-card border border-line-200 bg-surface">
              <header className="border-b border-line-200 px-4 py-2.5">
                <h3 className="text-[13px] font-semibold text-ink-900">Reparto por rama</h3>
              </header>
              <ul className="max-h-64 divide-y divide-line-200 overflow-y-auto">
                {maestro.reparticion.porRama.map((r) => (
                  <li key={r.branch} className="flex justify-between px-4 py-1.5 text-[12px]">
                    <span className="text-ink-900">{RAMA[r.branch] ?? r.branch}</span>
                    <span className="tabular-nums text-ink-500">{r.total}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <div className="rounded-card border border-line-200 bg-surface">
                <header className="border-b border-line-200 px-4 py-2.5">
                  <h3 className="text-[13px] font-semibold text-ink-900">Reparto por rol</h3>
                  <p className="mt-0.5 text-[11px] text-ink-500">Quién firma el documento.</p>
                </header>
                <ul className="divide-y divide-line-200">
                  {maestro.reparticion.porRol.map((r) => (
                    <li key={r.role} className="flex justify-between px-4 py-1.5 text-[12px]">
                      <span className="text-ink-900">{ROL[r.role] ?? r.role}</span>
                      <span className="tabular-nums text-ink-500">{r.total}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-card border border-line-200 bg-surface px-4 py-3">
                <h3 className="text-[13px] font-semibold text-ink-900">
                  Alcance de la curaduría de las firmas
                </h3>
                <p className="mt-1 text-justify text-[12px] leading-snug text-ink-700 [text-wrap:pretty]">
                  <strong className="font-semibold">{numero(maestro.firmasQueCuraron)}</strong>{' '}
                  {maestro.firmasQueCuraron === 1 ? 'firma ha' : 'firmas han'} corregido o
                  confirmado alguna ficha, con{' '}
                  <strong className="font-semibold">
                    {numero(maestro.verificacionesDeFirmas)}
                  </strong>{' '}
                  verificaciones en total.
                </p>
                <p className="mt-1.5 text-justify text-[11px] leading-snug text-ink-500 [text-wrap:pretty]">
                  Son cuentas, no contenido: esta pantalla sabe cuántas firmas tocaron una
                  actuación y no qué escribieron. Sirve para avisar antes de publicar un cambio, que
                  es exactamente para lo que hace falta.
                </p>
              </div>
            </div>
          </section>

          {maestro.masCuradas.length > 0 && (
            <section className="rounded-card border border-line-200 bg-surface">
              <header className="border-b border-line-200 px-4 py-2.5">
                <h3 className="text-[13px] font-semibold text-ink-900">
                  Las que más firmas han corregido
                </h3>
                <p className="mt-0.5 text-justify text-[11px] leading-snug text-ink-500 [text-wrap:pretty]">
                  Una ficha que varias firmas corrigen por separado es una señal sobre el maestro,
                  no sobre las firmas: probablemente su término está incompleto de origen.
                </p>
              </header>
              <ul className="divide-y divide-line-200">
                {maestro.masCuradas.map((a) => (
                  <li key={a.actuacionId} className="flex gap-3 px-4 py-2 text-[12px]">
                    <span className="min-w-0 flex-1 text-ink-900">
                      {a.exactName ?? (
                        <span className="text-ink-500">
                          {a.actuacionId} · ya no está en este paquete
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 tabular-nums text-ink-500">
                      {a.firmas} {a.firmas === 1 ? 'firma' : 'firmas'}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-card border border-[rgb(var(--danger)/0.35)] bg-[rgb(var(--danger)/0.06)] px-4 py-3">
            <h3 className="flex items-center gap-2 text-[13px] font-semibold text-danger">
              <Lock className="h-4 w-4" />
              La línea que no se cruza
            </h3>
            <p className="mt-1.5 text-justify text-[12px] leading-relaxed text-ink-900 [text-wrap:pretty]">
              El catálogo curado por una firma —sus verificaciones, sus notas, sus correcciones— es
              suyo. No se agrega, no se anonimiza y no alimenta el maestro. Es lo mismo que le
              promete Privacidad al cliente: no compartimos datos entre firmas.
            </p>
            <p className="mt-2 text-justify text-[11px] leading-snug text-ink-500 [text-wrap:pretty]">
              La restricción es técnica, no de interfaz: el servidor consulta dos columnas —qué
              firma y qué actuación— y ninguna de texto. Aunque alguien quisiera pintar aquí lo que
              escribió un abogado de otra firma, no tendría de dónde sacarlo.
            </p>
          </section>

          <section className="rounded-card border border-line-200 bg-canvas px-4 py-3">
            <h3 className="text-[13px] font-semibold text-ink-900">
              Lo que esta pantalla todavía no puede hacer
            </h3>
            <ul className="mt-2 space-y-2 text-[12px] text-ink-700">
              <li className="text-justify [text-wrap:pretty]">
                <strong className="font-semibold">Publicar un cambio normativo.</strong> El maestro
                no vive en base de datos: se compila desde los archivos de investigación y viaja
                dentro del paquete, así que hoy un cambio se publica desplegando. Un botón
                «Publicar» aquí no propagaría nada, y el propio diseño llama a esa acción la más
                peligrosa de la consola — un botón peligroso que no hace nada enseña a pulsarlo.
              </li>
              <li className="text-justify [text-wrap:pretty]">
                <strong className="font-semibold">Contar las fichas con norma derogada.</strong>{' '}
                Ninguna ficha declara si su norma sigue vigente. La cifra no se estima leyendo el
                texto del artículo: un número inventado se lee igual que uno medido.
              </li>
              <li className="text-justify [text-wrap:pretty]">
                <strong className="font-semibold">Recibir propuestas de las firmas.</strong> No hay
                flujo para que una firma ofrezca una actuación suya al maestro, así que la lista
                está vacía por inexistente y no por estar en cero.
              </li>
            </ul>
            <p className="mt-3 text-justify text-[11px] leading-snug text-ink-500 [text-wrap:pretty]">
              La regla que gobernará esa publicación cuando exista, escrita aquí para que no haya
              que redescubrirla: una derogatoria <strong>no borra</strong> la verificación de la
              firma, la reetiqueta como «verificada contra norma derogada» y muestra el artículo
              equivalente al lado. Y su recíproca: publicar <strong>nunca</strong> marca como
              verificada una ficha que la firma no verificó — si el maestro pudiera conceder
              verificaciones, el sello dejaría de significar que alguien de esa firma lo leyó.
            </p>
          </section>
        </div>
      )}
    </Dialog>
  );
};
