/**
 * Legal topics the drafting pipeline routes on.
 *
 * WHAT THIS FILE USED TO HOLD. A `JURISPRUDENCE_BY_TOPIC` map of 57 citations
 * fed straight into the drafting prompt as the "RAG stage". Twenty of them used
 * dockets no Colombian court issues — TSB-LAB-2024-1102, CE-SEC3-2020-0756,
 * TAC-089/2024, TSV-ADM-2023-445 — templates built from an acronym, a branch, a
 * year and a sequence number. One more cited SU-049 de 2022, a providencia that
 * does not exist. And openrouter.service logged "[pgvector RAG] Encontradas N
 * providencias aplicables en SYSTEM_CORPUS" while reading this array, naming
 * Supabase, pgvector and the corpus without touching any of them.
 *
 * It is deleted, not corrected. Auditing the remaining 37 would only have
 * produced a shorter hand-written list competing with the real corpus — the same
 * mistake the four fabricating scrapers made. runPrecedentSearch now queries
 * SYSTEM_CORPUS, whose 62 providencias were each downloaded from an official
 * relatoría, and returns nothing when the corpus has nothing.
 *
 * The topic type stays: topicDetector still routes on it.
 */

export type LegalTopic =
  | 'TUTELA'
  | 'PETICION_TRANSITO'
  | 'PETICION'
  | 'REPARACION_ESTADO'
  | 'LABORAL'
  | 'PENAL'
  | 'FAMILIA'
  | 'TRIBUTARIO'
  | 'SOCIETARIO'
  | 'ADMINISTRATIVO'
  | 'GENERAL';
