/**
 * Smoke test for the local embeddings provider. Temporary, not part of CI.
 *
 * Checks three things a type-check cannot: the model loads, it returns vectors
 * of the width the column demands, and those vectors carry MEANING — a legal
 * query must sit closer to a relevant passage than to an unrelated one.
 */
import { LocalEmbeddingsProvider } from '../modules/embeddings/providers/local.provider';
import { EMBEDDING_DIMENSIONS } from '../modules/embeddings/types';

const cosine = (a: number[], b: number[]): number =>
  a.reduce((sum, value, i) => sum + value * b[i], 0);

void (async () => {
  const started = Date.now();
  const provider = new LocalEmbeddingsProvider();

  const [query, relevant, unrelated] = await provider.embed([
    'término para interponer recurso de apelación contra sentencia civil',
    'El recurso de apelación deberá interponerse dentro de los tres días siguientes a la notificación de la sentencia.',
    'La sociedad por acciones simplificada se constituye mediante documento privado inscrito en el registro mercantil.'
  ]);

  const near = cosine(query, relevant);
  const far = cosine(query, unrelated);

  console.log(`proveedor      : ${provider.name}`);
  console.log(`dimensiones    : ${query.length} (la columna exige ${EMBEDDING_DIMENSIONS})`);
  console.log(`norma L2       : ${Math.sqrt(cosine(query, query)).toFixed(4)} (debe ser ~1)`);
  console.log(`similitud rel. : ${near.toFixed(4)}  <- apelación`);
  console.log(`similitud irr. : ${far.toFixed(4)}  <- sociedades`);
  console.log(`tiempo total   : ${((Date.now() - started) / 1000).toFixed(1)}s`);

  const ok = query.length === EMBEDDING_DIMENSIONS && near > far;
  console.log(ok ? '\nSMOKE OK' : '\nSMOKE FAILED');
  process.exit(ok ? 0 : 1);
})();
