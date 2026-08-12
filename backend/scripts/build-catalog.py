"""Converts verified research JSON files into typed TypeScript catalogue modules.

Kept as a generator rather than a runtime JSON import so the data is plain
TypeScript: no build-time file copying, no path differences between src and
dist, and the compiler checks the shape.

Run with: python backend/scripts/build-catalog.py
"""
import json
import os
import re
import unicodedata

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
RESEARCH_DIR = os.path.join(REPO_ROOT, 'research')
DATA_DIR = os.path.join(REPO_ROOT, 'backend', 'src', 'modules', 'catalog', 'data')

# One entry per researched branch:
# (research file, generated module, export name, branch constant, id prefix)
BRANCHES = [
    (
        'actuaciones-administrativo-tributario-transito.json',
        'administrativo.ts',
        'ADMINISTRATIVO_CATALOG',
        'ADMINISTRATIVO',
        'administrativo',
    ),
    (
        'actuaciones-constitucional.json',
        'constitucional.ts',
        'CONSTITUCIONAL_CATALOG',
        'CONSTITUCIONAL',
        'constitucional',
    ),
    (
        'actuaciones-civil.json',
        'civil.ts',
        'CIVIL_CATALOG',
        'CIVIL',
        'civil',
    ),
]


def slugify(text):
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

    escaped = str(value).replace('\\', '\\\\').replace("'", "\\'")
    escaped = re.sub(r'\s+', ' ', escaped).strip()
    return "'" + escaped + "'"


def build_entry(item, branch, prefix, seen):
    name = item['exact_name']
    slug = slugify(name)
    key = prefix + '/' + slug

    # Guarantee unique ids even if two names slugify identically.
    suffix = 2
    while key in seen:
        key = prefix + '/' + slug + '-' + str(suffix)
        suffix += 1
    seen.add(key)

    status, description = classify_term(item.get('term'))

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

    lines = [
        '  {',
        '    id: %s,' % ts(key),
        '    exactName: %s,' % ts(name),
        "    branch: '%s'," % branch,
        '    role: %s,' % ts(item.get('role') or 'LITIGANTE'),
        '    legalBasis: %s,' % ts(item.get('legal_basis')),
        '    competentAuthority: %s,' % ts(item.get('competent_authority')),
        "    term: { status: '%s', description: %s }," % (status, ts(description)),
        '    requiredSections: [',
        ',\n'.join(sections),
        '    ],',
        '    sourceUrl: %s' % ts(item.get('source_url')),
        '  }',
    ]

    return '\n'.join(lines), status


HEADER = """import type {{ BranchCatalog }} from '../types';

/**
 * {branch} catalogue.
 *
 * Generated from research/{src_name}, whose entries were verified against the
 * official text of the governing norms. Do not hand-edit: regenerate with
 * `python backend/scripts/build-catalog.py` so data and provenance never drift.
 *
 * Coverage is partial by design and the gaps are declared below rather than
 * hidden, because a silent gap in procedural deadlines is the dangerous kind.
 */
export const {export_name}: BranchCatalog = {{
  meta: {{
    branch: '{branch}',
    verifiedAt: {verified_at},
    sourceOfTruth: {source_of_truth},
    gaps: [
{gaps}
    ]
  }},
  actuaciones: [
{entries}
  ]
}};
"""


def build(src_name, out_name, export_name, branch, prefix):
    src = os.path.join(RESEARCH_DIR, src_name)
    out = os.path.join(DATA_DIR, out_name)

    data = json.load(open(src, encoding='utf-8'))
    meta = data['_meta']

    seen = set()
    entries = []
    counts = {'VERIFICADO': 0, 'NO_CADUCA': 0, 'NO_VERIFICADO': 0}

    for item in data['actuaciones']:
        entry, status = build_entry(item, branch, prefix, seen)
        entries.append(entry)
        counts[status] += 1

    output = HEADER.format(
        branch=branch,
        src_name=src_name,
        export_name=export_name,
        verified_at=ts(meta.get('verified_at')),
        source_of_truth=ts(meta.get('source_of_truth')),
        gaps=',\n'.join('    ' + ts(g) for g in meta.get('gaps', [])),
        entries=',\n'.join(entries),
    )

    open(out, 'w', encoding='utf-8', newline='\n').write(output)

    print('%s: %d actuaciones -> %s' % (branch, len(entries), out_name))
    print(
        '  terms: VERIFICADO=%d NO_CADUCA=%d NO_VERIFICADO=%d'
        % (counts['VERIFICADO'], counts['NO_CADUCA'], counts['NO_VERIFICADO'])
    )


INDEX_HEADER = """import type {{ BranchCatalog }} from '../types';
{imports}
/**
 * Every branch catalogue the product ships with.
 *
 * Generated by `python backend/scripts/build-catalog.py`. Adding a branch means
 * adding one entry to that script's BRANCHES list — nothing else in the module
 * changes, so the service never has to learn a branch name to load it.
 */
export const ALL_CATALOGS: BranchCatalog[] = [
{entries}
];
"""


def build_index(branches):
    """Emits data/index.ts so registering a branch stays a one-place change."""
    out = os.path.join(DATA_DIR, 'index.ts')

    imports = '\n'.join(
        "import {{ {export_name} }} from './{module}';".format(
            export_name=export_name,
            module=out_name[:-3],
        )
        for _, out_name, export_name, _, _ in branches
    )

    entries = ',\n'.join('  ' + export_name for _, _, export_name, _, _ in branches)

    output = INDEX_HEADER.format(imports=imports + '\n', entries=entries)
    open(out, 'w', encoding='utf-8', newline='\n').write(output)

    print('index.ts: %d catálogos registrados' % len(branches))


if __name__ == '__main__':
    for args in BRANCHES:
        build(*args)

    build_index(BRANCHES)
