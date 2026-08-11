"""Converts a verified research JSON into a typed TypeScript catalogue module.

Kept as a script rather than a runtime JSON import so the data is plain
TypeScript: no build-time file copying, no path differences between src and
dist, and the compiler checks the shape.
"""
import json
import re
import sys
import unicodedata

import os

# Paths are resolved from this file so the script runs from any working
# directory and on any machine.
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(REPO_ROOT, 'research', 'actuaciones-administrativo-tributario-transito.json')
OUT = os.path.join(REPO_ROOT, 'backend', 'src', 'modules', 'catalog', 'data', 'administrativo.ts')


def slugify(text: str) -> str:
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode()
    text = re.sub(r'[^a-zA-Z0-9]+', '-', text).strip('-').lower()
    return re.sub(r'-+', '-', text)


def classify_term(raw):
    """Split 'no deadline' from 'nobody checked'. Conflating them is dangerous."""
    if not raw or not str(raw).strip():
        return 'NO_VERIFICADO', None

    text = str(raw).strip()
    lowered = text.lower()

    # Only treat as NO_CADUCA when the source explicitly says so.
    if 'no opera caducidad' in lowered or 'no caduca' in lowered:
        return 'NO_CADUCA', text

    return 'VERIFICADO', text


def ts(value):
    """Render a Python value as a TypeScript literal."""
    if value is None:
        return 'null'
    if isinstance(value, bool):
        return 'true' if value else 'false'
    if isinstance(value, (int, float)):
        return str(value)
    escaped = str(value).replace('\\', '\\\\').replace("'", "\\'").replace('\n', ' ').strip()
    escaped = re.sub(r'\s+', ' ', escaped)
    return f"'{escaped}'"


data = json.load(open(SRC, encoding='utf-8'))
meta = data['_meta']
raw_items = data['actuaciones']

seen = set()
entries = []
counts = {'VERIFICADO': 0, 'NO_CADUCA': 0, 'NO_VERIFICADO': 0}

for item in raw_items:
    name = item['exact_name']
    slug = slugify(name)
    key = f'administrativo/{slug}'

    # Guarantee unique ids even if two names slugify identically.
    suffix = 2
    while key in seen:
        key = f'administrativo/{slug}-{suffix}'
        suffix += 1
    seen.add(key)

    status, description = classify_term(item.get('term'))
    counts[status] += 1

    sections = []
    for section in item.get('required_sections') or []:
        sections.append(
            '      { n: %d, name: %s, mandatory: %s, basis: %s }'
            % (
                section.get('n', 0),
                ts(section.get('name')),
                ts(bool(section.get('mandatory'))),
                ts(section.get('basis')),
            )
        )

    entries.append(
        "  {\n"
        f"    id: {ts(key)},\n"
        f"    exactName: {ts(name)},\n"
        "    branch: 'ADMINISTRATIVO',\n"
        f"    role: {ts(item.get('role') or 'LITIGANTE')},\n"
        f"    legalBasis: {ts(item.get('legal_basis'))},\n"
        f"    competentAuthority: {ts(item.get('competent_authority'))},\n"
        f"    term: {{ status: '{status}', description: {ts(description)} }},\n"
        "    requiredSections: [\n" + ',\n'.join(sections) + "\n    ],\n"
        f"    sourceUrl: {ts(item.get('source_url'))}\n"
        "  }"
    )

gaps = ',\n'.join(f'    {ts(g)}' for g in meta.get('gaps', []))

output = f"""import type {{ BranchCatalog }} from '../types';

/**
 * Contencioso administrativo catalogue (Ley 1437 de 2011, CPACA).
 *
 * Generated from research/actuaciones-administrativo-tributario-transito.json,
 * whose entries were verified article by article against the Función Pública
 * text. Do not hand-edit: regenerate from the research file so provenance and
 * data never drift apart.
 *
 * Coverage is partial by design and the gaps are declared below rather than
 * hidden, because a silent gap in procedural deadlines is the dangerous kind.
 */
export const ADMINISTRATIVO_CATALOG: BranchCatalog = {{
  meta: {{
    branch: 'ADMINISTRATIVO',
    verifiedAt: {ts(meta.get('verified_at'))},
    sourceOfTruth: {ts(meta.get('source_of_truth'))},
    gaps: [
{gaps}
    ]
  }},
  actuaciones: [
{',\n'.join(entries)}
  ]
}};
"""

open(OUT, 'w', encoding='utf-8', newline='\n').write(output)

print(f'wrote {len(entries)} actuaciones -> {OUT}')
print(f'terms: VERIFICADO={counts["VERIFICADO"]} NO_CADUCA={counts["NO_CADUCA"]} NO_VERIFICADO={counts["NO_VERIFICADO"]}')
