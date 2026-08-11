import { LegalTopic } from './data/jurisprudence';

/**
 * Classifies a drafting request into the legal topic whose jurisprudence and
 * document structures apply.
 *
 * The rules read both the selected document type and the user's free-text
 * prompt, because the branch is often only stated in one of the two. Order
 * matters: the first match wins, so the narrower topics (a petition about a
 * traffic fine) are tested before the broader ones (any petition).
 */
export const detectLegalTopic = (documentType: string, legalPrompt: string): LegalTopic => {
  const doc = documentType.toLowerCase();
  const prompt = legalPrompt.toLowerCase();
  const has = (...needles: string[]): boolean =>
    needles.some((needle) => doc.includes(needle) || prompt.includes(needle));

  const isTutela = has('tutela');
  const isDerechoPeticion = doc.includes('derecho de petición')
    || doc.includes('petición')
    || prompt.includes('derecho de petición');
  const isTransito = prompt.includes('tránsito')
    || prompt.includes('movilidad')
    || prompt.includes('comparendo')
    || prompt.includes('fotomulta')
    || prompt.includes('simit')
    || prompt.includes('placa');
  const isMilitaresOEstado = prompt.includes('soldado')
    || prompt.includes('bomba')
    || prompt.includes('mina')
    || has('reparación directa');

  if (isTutela) return 'TUTELA';
  if (isDerechoPeticion && isTransito) return 'PETICION_TRANSITO';
  if (isDerechoPeticion) return 'PETICION';
  if (isMilitaresOEstado) return 'REPARACION_ESTADO';
  if (has('laboral') || prompt.includes('despido') || prompt.includes('salario')) return 'LABORAL';
  if (has('penal') || prompt.includes('ley 906') || prompt.includes('hábeas corpus')) return 'PENAL';
  if (doc.includes('familia') || doc.includes('alimentos') || doc.includes('divorcio')
    || prompt.includes('custodia') || prompt.includes('paternidad')) return 'FAMILIA';
  if (doc.includes('tributar') || prompt.includes('dian') || prompt.includes('impuesto')) return 'TRIBUTARIO';
  if (doc.includes('societar') || prompt.includes('supersociedades') || prompt.includes('sic')) return 'SOCIETARIO';
  if (doc.includes('nulidad') || doc.includes('administrativ') || prompt.includes('cpaca')) return 'ADMINISTRATIVO';

  return 'GENERAL';
};
