# -*- coding: utf-8 -*-
"""Merges newly catalogued actuaciones into a branch's research file.

WHY THIS IS NOT THE SAME AS apply-verification.py. That one CORRECTS entries
that already exist and refuses anything it cannot match. This one ADDS entries
that do not exist yet and refuses anything it CAN match — a name already in the
branch is a collision, not an update, because two fichas with the same
`exact_name` resolve ambiguously and the drafting engine picks one at random.

WHAT IT REFUSES, AND WHY EACH ONE MATTERS:

  - A name that already exists in the branch. See above.
  - An entry naming an abolished figure. Cataloguing interdicción after Ley 1996
    de 2019 abolished it hands a lawyer a procedure that no longer exists.
  - `_meta_unverified` naming something not in `actuaciones`. An entry published
    without a verified term and an actuación deliberately NOT catalogued are
    different claims: the first is a ficha wearing a warning, the second is a
    hole. Conflating them makes the generator abort, and it should — that
    confusion is how a catalogue promises something it does not have.
  - A source outside the official allowlist. Provenance was the defect that put
    76 of 103 entries wrong; it is not metadata.

Usage:
    python backend/scripts/merge-actuaciones.py <out-file.json> [--dry]

Then regenerate:
    python backend/scripts/build-catalog.py
"""
import io
import json
import os
import sys
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RESEARCH_DIR = os.path.join(ROOT, 'research')

FILE_FOR_BRANCH = {
    'ADMINISTRATIVO': 'actuaciones-administrativo-tributario-transito.json',
    'CONSTITUCIONAL': 'actuaciones-constitucional.json',
    'CIVIL': 'actuaciones-civil.json',
    'LABORAL': 'actuaciones-laboral.json',
    'FAMILIA': 'actuaciones-familia.json',
    'PENAL': 'actuaciones-penal.json',
    'SOCIETARIO': 'actuaciones-societario.json',
    'TRIBUTARIO': 'actuaciones-tributario.json',
    'TRANSITO': 'actuaciones-transito.json',
    'NOTARIAL': 'actuaciones-notarial.json',
    'CONTRATACION': 'actuaciones-contratacion.json',
    'INTERNACIONAL': 'actuaciones-internacional.json',
    'SUPERINTENDENCIAS': 'actuaciones-superintendencias.json',
}

# Mirrors the allowlist in catalog.check.ts. Duplicated on purpose: a merge that
# only fails later, in CI, has already written the file.
OFICIALES = (
    'funcionpublica.gov.co', 'secretariasenado.gov.co', 'suin-juriscol.gov.co',
    'alcaldiabogota.gov.co', 'corteconstitucional.gov.co', 'ramajudicial.gov.co',
    'icbf.gov.co', 'supersalud.gov.co', 'colpensiones.gov.co',
    'oas.org', 'hcch.net', 'tribunalandino.org.ec',
)

# Figures a later law abolished. Cataloguing one is worse than omitting it.
ABOLIDAS = ('interdicción', 'interdiccion', 'quiebra')

CAMPOS = ('exact_name', 'area', 'role', 'legal_basis', 'competent_authority',
          'term', 'required_sections', 'source_url')

ROLES = ('LITIGANTE', 'DESPACHO', 'SECRETARIA')


def es_oficial(url):
    if not url:
        return False
    try:
        host = urllib.parse.urlparse(url).hostname or ''
    except Exception:
        return False
    host = host.replace('www.', '', 1)
    return any(host == d or host.endswith('.' + d) for d in OFICIALES)


def main():
    if len(sys.argv) < 2:
        raise SystemExit('uso: merge-actuaciones.py <out-file.json> [--dry]')

    src_path = sys.argv[1]
    dry = '--dry' in sys.argv

    src = json.load(io.open(src_path, encoding='utf-8'))
    rama = (src.get('rama') or src.get('branch') or '').upper()

    if rama not in FILE_FOR_BRANCH:
        raise SystemExit('FATAL: rama desconocida %r. Debe ser una de: %s'
                         % (rama, ', '.join(sorted(FILE_FOR_BRANCH))))

    nuevas = src.get('actuaciones') or []
    if not nuevas:
        raise SystemExit('FATAL: el archivo no trae actuaciones')

    dest_path = os.path.join(RESEARCH_DIR, FILE_FOR_BRANCH[rama])
    dest = json.load(io.open(dest_path, encoding='utf-8'))

    existentes = {a['exact_name'] for a in dest.get('actuaciones', [])}
    nombres_nuevos = set()
    errores = []

    for a in nuevas:
        nombre = a.get('exact_name')

        if not nombre:
            errores.append('una ficha no tiene exact_name')
            continue

        faltan = [c for c in CAMPOS if c not in a]
        if faltan:
            errores.append('%s: le faltan campos: %s' % (nombre, ', '.join(faltan)))

        if nombre in existentes:
            errores.append('%s: ya existe en %s (colision, no actualizacion)' % (nombre, rama))
        if nombre in nombres_nuevos:
            errores.append('%s: repetida dentro del propio archivo' % nombre)
        nombres_nuevos.add(nombre)

        if a.get('area') != rama:
            errores.append('%s: area %r no coincide con la rama %s' % (nombre, a.get('area'), rama))

        if a.get('role') not in ROLES:
            errores.append('%s: role %r no valido' % (nombre, a.get('role')))

        if any(p in nombre.lower() for p in ABOLIDAS):
            errores.append('%s: nombra una figura abolida' % nombre)

        if not es_oficial(a.get('source_url')):
            errores.append('%s: fuente no oficial o ausente: %s' % (nombre, a.get('source_url')))

        secciones = a.get('required_sections') or []
        if not isinstance(secciones, list) or not secciones:
            errores.append('%s: sin required_sections' % nombre)

    # An unverified list that names something absent stops protecting silently.
    unv = src.get('_meta_unverified') or []
    for x in unv:
        if x.get('actuacion') not in nombres_nuevos:
            errores.append('_meta_unverified nombra algo que no se cataloga: %r. '
                           'Si decidiste NO catalogarla, va en _gaps.' % x.get('actuacion'))
        if not (x.get('reason') or '').strip():
            errores.append('_meta_unverified sin razon: %r' % x.get('actuacion'))

    # A null term must be declared, and a declared one must be null: otherwise
    # the generator's own guard and this file disagree about the same entry.
    declaradas = {x.get('actuacion') for x in unv}
    for a in nuevas:
        sin_termino = not (a.get('term') or '').strip() if isinstance(a.get('term'), str) else not a.get('term')
        if sin_termino and a.get('exact_name') not in declaradas:
            errores.append('%s: term vacio pero no esta en _meta_unverified' % a.get('exact_name'))

    if errores:
        print('\nFATAL: %d problema(s). NO SE ESCRIBIO NADA.\n' % len(errores))
        for e in errores:
            print('  -', e)
        raise SystemExit(1)

    con_termino = sum(1 for a in nuevas if a.get('term'))
    print('rama:        %s  (%s)' % (rama, FILE_FOR_BRANCH[rama]))
    print('actuales:    %d' % len(dest.get('actuaciones', [])))
    print('nuevas:      %d  (%d con termino, %d declaradas sin verificar)'
          % (len(nuevas), con_termino, len(unv)))
    print('huecos:      %d declarados en _gaps' % len(src.get('_gaps') or []))
    for a in nuevas:
        print('   [%-9s] %s' % (a['role'], a['exact_name'][:70]))

    if dry:
        print('\n--dry: no se escribio nada.')
        return

    dest.setdefault('actuaciones', []).extend(nuevas)

    meta = dest.setdefault('_meta', {})
    lista_unv = meta.setdefault('unverified', [])
    ya = {x.get('actuacion') for x in lista_unv}
    for x in unv:
        if x['actuacion'] not in ya:
            lista_unv.append({'actuacion': x['actuacion'], 'reason': x['reason']})

    gaps = meta.setdefault('gaps', [])
    for g in (src.get('_gaps') or []):
        gaps.append('%s: %s' % (rama, g))
    if src.get('vigencia'):
        gaps.append('%s, verificado el %s: %s'
                    % (rama, src.get('verified_at', 'esta pasada'), src['vigencia'][:1500]))

    io.open(dest_path, 'w', encoding='utf-8', newline='\n').write(
        json.dumps(dest, ensure_ascii=False, indent=2) + '\n'
    )
    print('\nescrito: %s  (%d actuaciones)' % (FILE_FOR_BRANCH[rama], len(dest['actuaciones'])))
    print('Ahora: python backend/scripts/build-catalog.py')


if __name__ == '__main__':
    main()
