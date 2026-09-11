import React from 'react';
import { Plus, UserRound, X } from 'lucide-react';
import { expedientesApi } from '../services/expedientes.api';
import {
  NOMBRE_DE_LADO,
  NOMBRE_DE_PAPEL,
  PAPELES_EN_ORDEN,
  SE_LE_PREGUNTA,
  type ExpedienteConDetalle,
  type LadoEnElExpediente,
  type PapelEnElExpediente
} from '../types';

/**
 * QUIÉN ES QUIÉN EN EL ASUNTO.
 *
 * ─── POR QUÉ ESTA LISTA VALE LA PENA LLENARLA ──────────────────────────────
 *
 * Es lo que convierte «preguntas para el testigo de la contraparte» en
 * preguntas para Jorge Pineda, que declara sobre la entrega del inmueble y es
 * cuñado del demandado. Un interrogatorio se prepara contra una persona, no
 * contra una categoría, y sin esta lista el motor solo puede ofrecer cajones.
 *
 * ─── TRES CAMPOS, Y NINGUNO SOBRA ──────────────────────────────────────────
 *
 * El PAPEL y el LADO deciden la TÉCNICA —al propio se le interroga con
 * abiertas, al ajeno se le contrainterroga con cerradas, al perito se le va
 * por el método—, y esa decisión la toma el código a partir de estos dos
 * campos: no se le vuelve a preguntar al abogado en otro formulario.
 *
 * «SOBRE QUÉ DECLARA» es el que más rinde y el más fácil de saltarse. Sin él
 * el motor sabe que existe un testigo; con él sabe qué tiene que sacarle.
 */
export const ActoresDelExpediente: React.FC<{
  expediente: ExpedienteConDetalle;
  onCambio: () => Promise<void>;
}> = ({ expediente, onCambio }) => {
  const [agregando, setAgregando] = React.useState(false);
  const [guardando, setGuardando] = React.useState(false);
  const [error, setError] = React.useState('');
  const [nuevo, setNuevo] = React.useState<{
    nombre: string;
    papel: PapelEnElExpediente;
    lado: LadoEnElExpediente;
    sobreQue: string;
  }>({ nombre: '', papel: 'TESTIGO', lado: 'PROPIO', sobreQue: '' });

  const agregar = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!nuevo.nombre.trim()) return;
    setGuardando(true);
    setError('');
    try {
      await expedientesApi.agregarActor(expediente.id, {
        nombre: nuevo.nombre,
        papel: nuevo.papel,
        lado: nuevo.lado,
        sobreQue: nuevo.sobreQue || undefined
      });
      setNuevo({ nombre: '', papel: 'TESTIGO', lado: 'PROPIO', sobreQue: '' });
      setAgregando(false);
      await onCambio();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  const quitar = async (actorId: string): Promise<void> => {
    setError('');
    try {
      await expedientesApi.borrarActor(expediente.id, actorId);
      await onCambio();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  /* Los grupos salen del orden declarado en `types.ts`, no de un `sort`. */
  const grupos = [...new Set(PAPELES_EN_ORDEN.map((p) => p.grupo))];

  return (
    <section className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-h3">Quién es quién</h2>
          <p className="text-meta text-ink-500">
            Las partes, los testigos y el perito. Es de aquí de donde salen las preguntas con nombre propio.
          </p>
        </div>
        <button type="button" onClick={() => setAgregando((v) => !v)} className="btn-secondary btn-sm gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Agregar
        </button>
      </div>

      {agregando && (
        <form onSubmit={agregar} className="mt-3 space-y-3 rounded-card border border-line-200 bg-canvas p-3">
          <div>
            <label className="field-label" htmlFor="actor-nombre">
              Nombre
            </label>
            <input
              id="actor-nombre"
              className="field"
              value={nuevo.nombre}
              onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="actor-papel">
                Qué es en el proceso
              </label>
              <select
                id="actor-papel"
                className="field"
                value={nuevo.papel}
                onChange={(e) => setNuevo({ ...nuevo, papel: e.target.value as PapelEnElExpediente })}
              >
                {grupos.map((g) => (
                  <optgroup key={g} label={g}>
                    {PAPELES_EN_ORDEN.filter((p) => p.grupo === g).map((p) => (
                      <option key={p.papel} value={p.papel}>
                        {p.nombre}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="actor-lado">
                De qué lado
              </label>
              <select
                id="actor-lado"
                className="field"
                value={nuevo.lado}
                onChange={(e) => setNuevo({ ...nuevo, lado: e.target.value as LadoEnElExpediente })}
              >
                <option value="PROPIO">De mi lado</option>
                <option value="CONTRARIO">De la contraparte</option>
                <option value="NEUTRAL">De ninguno</option>
              </select>
              {/*
                El lado decide la técnica, así que se dice para qué sirve. Un
                abogado que lo deja en el valor por defecto porque no sabe qué
                cambia recibe preguntas con la técnica equivocada.
              */}
              <p className="mt-1 text-meta text-ink-500">
                Decide cómo se le pregunta: al propio se le interroga, al de enfrente se le contrainterroga.
              </p>
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="actor-sobre">
              Sobre qué declara <span className="font-normal text-ink-500">(opcional, pero es el que más sirve)</span>
            </label>
            <input
              id="actor-sobre"
              className="field"
              value={nuevo.sobreQue}
              onChange={(e) => setNuevo({ ...nuevo, sobreQue: e.target.value })}
              placeholder="la entrega del inmueble y el estado en que estaba"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn-primary btn-sm" disabled={guardando || !nuevo.nombre.trim()}>
              {guardando ? 'Agregando…' : 'Agregar'}
            </button>
            <button type="button" className="btn-ghost btn-sm" onClick={() => setAgregando(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {error && <p className="mt-2 text-meta text-ink-700 [overflow-wrap:anywhere]">{error}</p>}

      {expediente.listaDeActores.length === 0 ? (
        <p className="mt-3 text-meta text-ink-500">
          Nadie registrado todavía. Sin al menos una persona no se puede preparar un interrogatorio.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {expediente.listaDeActores.map((a) => (
            <li
              key={a.id}
              className="flex items-start justify-between gap-2 rounded-card border border-line-200 p-2.5"
            >
              <div className="min-w-0">
                <p className="flex flex-wrap items-baseline gap-x-2 text-body">
                  <UserRound className="h-3.5 w-3.5 shrink-0 text-ink-500" />
                  <span className="font-medium [overflow-wrap:anywhere]">{a.nombre}</span>
                  <span className="text-meta text-ink-500">
                    {NOMBRE_DE_PAPEL[a.papel]} · {NOMBRE_DE_LADO[a.lado].toLowerCase()}
                  </span>
                  {/*
                    Se marca a quién se le puede preparar interrogatorio, porque
                    no es a todos: al juez, al secretario, a los apoderados y al
                    intérprete no se les pregunta. Sin la marca, el abogado
                    registraría al juez esperando preguntas para él.
                  */}
                  {SE_LE_PREGUNTA.includes(a.papel) && <span className="chip-neutral">se le pregunta</span>}
                </p>
                {a.sobreQue && (
                  <p className="mt-0.5 text-meta text-ink-500 [overflow-wrap:anywhere]">
                    Declara sobre: {a.sobreQue}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => void quitar(a.id)}
                className="btn-ghost btn-sm shrink-0 px-1.5"
                aria-label={`Quitar a ${a.nombre}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
