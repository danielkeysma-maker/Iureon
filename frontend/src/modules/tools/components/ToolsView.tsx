import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { ProceduralTermsModal } from '../../procedural-terms/components/ProceduralTermsModal';
import { LaborSettlementModal } from '../../settlements/components/LaborSettlementModal';
import { LegalSearchGlossaryModal } from '../../search/components/LegalSearchGlossaryModal';
import { IndexacionModal } from './IndexacionModal';
import { InteresesModal } from './InteresesModal';
import { CuantiaModal } from './CuantiaModal';
import { CalendarioModal } from './CalendarioModal';
import { AgendaModal } from '../../agenda/components/AgendaModal';
import { hayPendiente } from '../../agenda/pendiente';
import { PANTALLAS, recordado, recordar } from '../../tenant/pantallaRecordada';
import { coincideConLaBusqueda, herramientaAlAbrir, type IdDeHerramienta } from '../herramientas';

/**
 * Herramientas (módulo 10). Portada y pantallas según
 * `public/handoff/app-herramientas.html`: la portada es el artboard :78 y cada
 * herramienta abre su propia pantalla (:131 términos, :188 intereses, :253
 * calendario, :297 teléfono, :335 indexación, :365 cuantía, :400 liquidación,
 * :445 glosario).
 *
 * ─── QUÉ SE TOMÓ DE LA MAQUETA ──────────────────────────────────────────────
 *
 * La DISPOSICIÓN, no solo el color: título grande con su bajada, la búsqueda de
 * ancho completo y la retícula en tres filas —el contador ancho y en tinta junto
 * a intereses; indexación, cuantía y liquidación en tres; agenda y glosario en
 * dos sobre gris lavado— y el pie que dice qué es y qué no es un resultado.
 * Abrir una tarjeta ya no levanta un diálogo: cambia la pantalla entera.
 *
 * ─── QUÉ NO SE TOMÓ, Y POR QUÉ ──────────────────────────────────────────────
 *
 * · LOS NOMBRES. La maqueta rebautiza «Contar un término», «Cuantía del
 *   proceso», «Calendario judicial»; el manual de uso y la visita guiada enseñan
 *   «Contador de términos», «Competencia por cuantía», «Agenda de términos». Una
 *   tarjeta que no se llama como la describe el manual obliga a adivinar cuál es.
 * · «CON LA TABLA POR TRAMOS» en intereses se omitió mientras se liquidaba con
 *   una sola tasa escrita por el abogado. Desde el 14 de septiembre de 2026 el
 *   servidor guarda las certificaciones de la Superintendencia periodo por
 *   periodo y la tarjeta ya lo dice.
 * · «Y SANCIÓN» en liquidación: el servidor no calcula la moratoria.
 * · EL SEGMENTADO DE FILTROS de la versión anterior: la maqueta nueva lo quita y
 *   deja la búsqueda, que encuentra por nombre y por lo que hace.
 *
 * ─── LA MAQUETA NO DIBUJA ───────────────────────────────────────────────────
 *
 * La portada en el teléfono ni la búsqueda sin resultados: se derivan de la
 * misma retícula en una columna y del vacío que anuncia de
 * `app-dialogos-y-estados.html` :278. La ejecutoria con traslados sigue sin
 * construir y se declara en el pie en vez de pintarse como tarjeta muerta.
 */

type Forma = 'tinta' | 'grande' | 'normal' | 'suave';

interface Tarjeta {
  id: IdDeHerramienta;
  nombre: string;
  queHace: string;
  forma: Forma;
  /** Normas que la tarjeta nombra; son las mismas que la calculadora declara como fuente. */
  citas?: string[];
}

/*
 * LAS TRES FILAS DE LA MAQUETA. Cada descripción dice lo que la calculadora
 * hace hoy, con las normas que ya declaraba esta pantalla antes del rediseño;
 * donde la maqueta prometía algo más, manda el módulo.
 */
const FILAS: Tarjeta[][] = [
  [
    {
      id: 'terminos',
      nombre: 'Contador de términos',
      queHace:
        'Desde la fecha de notificación, en días hábiles o calendario, meses o años. Muestra qué descontó y por qué, y lo lleva a la agenda.',
      forma: 'tinta',
      citas: ['Ley 51 de 1983', 'CGP art. 118']
    },
    {
      id: 'intereses',
      nombre: 'Intereses de mora',
      queHace:
        'Comercial a 1,5 × el bancario corriente, legal civil al 6 % anual o tasa pactada con control de usura. Por tramos, con la tasa certificada de cada periodo.',
      forma: 'grande'
    }
  ],
  [
    {
      id: 'indexacion',
      nombre: 'Indexación por IPC',
      queHace: 'Traer a hoy un valor histórico con los índices que usted toma del DANE.',
      forma: 'normal'
    },
    {
      id: 'cuantia',
      nombre: 'Competencia por cuantía',
      queHace: 'En salarios mínimos del año de presentación, con el juez competente.',
      forma: 'normal'
    },
    {
      id: 'liquidacion',
      nombre: 'Liquidación de prestaciones',
      queHace: 'Prestaciones e indemnización desde el salario y las fechas, cada una con su norma.',
      forma: 'normal'
    }
  ],
  [
    {
      id: 'agenda',
      nombre: 'Agenda de términos',
      queHace:
        'Los términos de su firma sobre el calendario, con festivos y vacancia, y el aviso antes de que venzan.',
      forma: 'suave'
    },
    {
      id: 'glosario',
      nombre: 'Glosario jurídico',
      queHace: 'Los términos del oficio, leídos del catálogo verificado con la norma que los define.',
      forma: 'suave'
    }
  ]
];

export const ToolsView: React.FC = () => {
  /*
   * UNA PANTALLA ABIERTA A LA VEZ, recordada entre recargas. Lo que trae un
   * borrador o una revisión abre la agenda aunque se recordara otra cosa: el
   * botón «Poner en la agenda» tiene que llevar a la agenda.
   */
  const [abierta, setAbierta] = useState<IdDeHerramienta | null>(() =>
    herramientaAlAbrir(recordado(PANTALLAS.herramienta), hayPendiente())
  );
  const [busqueda, setBusqueda] = useState('');

  const abrir = (id: IdDeHerramienta) => {
    setAbierta(id);
    recordar(PANTALLAS.herramienta, id);
  };
  const cerrar = () => {
    setAbierta(null);
    recordar(PANTALLAS.herramienta, null);
  };

  const filas = FILAS.map((fila) =>
    fila.filter((t) => coincideConLaBusqueda([t.nombre, t.queHace, ...(t.citas ?? [])], busqueda))
  ).filter((fila) => fila.length > 0);

  return (
    /*
      `min-w-0` NO ES ADORNO: esta columna es un ítem flex y nace con
      `min-width: auto`, así que cualquier mínimo de dentro subiría hasta aquí y
      la pantalla mediría de más en un teléfono, recortada en silencio por la
      raíz. Lo pone la regla `.cn-her` del CSS.
    */
    <div data-visita="vista-tools" className="cara-nueva cn-her">
      {abierta === null && (
        <div className="cn-her-desplazable cn-her-desplazable--portada">
          <div className="cn-her-portada">
            <h1 className="cn-her-h1">Herramientas</h1>
            <p className="cn-her-bajada">Cálculos con su regla a la vista. Ninguna consume saldo.</p>

            <div className="cn-her-buscar">
              <Search aria-hidden="true" size={17} strokeWidth={1.5} className="cn-her-buscar-icono" />
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Por nombre o por lo que necesita calcular"
                aria-label="Buscar una herramienta"
                className="cn-her-buscar-campo"
              />
            </div>

            {filas.length === 0 && (
              <div className="cn-her-vacio cn-her-vacio--portada">
                <p className="cn-her-vacio-titulo">Ninguna herramienta coincide con esa búsqueda</p>
                <p className="cn-her-vacio-texto">
                  Busque por el nombre o por lo que necesita calcular: un plazo, unos intereses, una cuantía.
                </p>
                <button type="button" className="cn-her-boton cn-her-boton--suave" onClick={() => setBusqueda('')}>
                  Ver todas
                </button>
              </div>
            )}

            {filas.map((fila, i) => (
              <div key={fila.map((t) => t.id).join('-')} className={`cn-her-fila cn-her-fila--${i === 0 && fila.length === 2 && fila[0].forma === 'tinta' ? 'destacada' : fila.length}`}>
                {fila.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => abrir(t.id)}
                    className={`cn-her-tarjeta cn-her-tarjeta--${t.forma}`}
                  >
                    <span className="cn-her-tarjeta-nombre">{t.nombre}</span>
                    <span className="cn-her-tarjeta-texto">{t.queHace}</span>
                    {t.citas && (
                      <span className="cn-her-pastillas">
                        {t.citas.map((c) => (
                          <span key={c} className="cn-her-pastilla">
                            {c}
                          </span>
                        ))}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ))}

            <div className="cn-her-pie-portada">
              <p>
                Las cinco calculadoras se exportan a Excel y a PDF{' '}
                <b className="cn-her-fuerte">con su desglose y sus fuentes</b>: una cifra sin la regla que la
                produjo no sirve en un escrito. Lo que estas herramientas calculan no es asesoría: es aritmética
                sobre las reglas citadas. El cómputo de ejecutoria con traslados se agrega cuando esté construido y
                verificado, no antes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* «Poner en la agenda» deja el pendiente y abre la agenda; tras guardar, la agenda puede volver aquí. */}
      <ProceduralTermsModal isOpen={abierta === 'terminos'} onClose={cerrar} onPonerEnAgenda={() => abrir('agenda')} />
      <LaborSettlementModal isOpen={abierta === 'liquidacion'} onClose={cerrar} />
      <LegalSearchGlossaryModal isOpen={abierta === 'glosario'} onClose={cerrar} />
      <IndexacionModal isOpen={abierta === 'indexacion'} onClose={cerrar} />
      <InteresesModal isOpen={abierta === 'intereses'} onClose={cerrar} />
      <CuantiaModal isOpen={abierta === 'cuantia'} onClose={cerrar} />
      {/* El detalle de festivos solo se abre desde la agenda, y a la agenda vuelve. */}
      <CalendarioModal isOpen={abierta === 'calendario'} onClose={() => abrir('agenda')} />
      <AgendaModal
        isOpen={abierta === 'agenda'}
        onClose={cerrar}
        onVerFestivos={() => abrir('calendario')}
        onVolverAlContador={() => abrir('terminos')}
      />
    </div>
  );
};
