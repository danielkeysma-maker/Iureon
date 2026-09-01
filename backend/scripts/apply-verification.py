# -*- coding: utf-8 -*-
"""Applies a verification pass back onto the research files.

WHY AN APPLICATOR AND NOT HAND EDITS. A verification pass produces a hundred
small corrections across thirteen files, and the failure mode is not getting one
wrong — it is getting one applied to the WRONG entry and never noticing, because
a plausible deadline under a plausible name looks exactly like a verified one.

So the rule this script exists to enforce: A KEY THAT MATCHES NOTHING IS FATAL
AND NOTHING IS WRITTEN. Not a warning, not a skip. A patch that names an entry
which no longer exists means the patch and the catalogue disagree about reality,
and applying the rest of it would bury that disagreement under a green run.

Usage:
    python backend/scripts/apply-verification.py <dir-with-out-*.json> [--dry]

Then regenerate:
    python backend/scripts/build-catalog.py
"""
import glob
import io
import json
import os
import re
import sys
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RESEARCH_DIR = os.path.join(ROOT, 'research')

# Same mapping the generator uses. Kept explicit so a new branch has to be added
# here deliberately rather than silently missing its corrections.
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
    'AGRARIO': 'actuaciones-agrario.json',
    'ADUANERO': 'actuaciones-aduanero.json',
    'PROPIEDAD_INTELECTUAL': 'actuaciones-propiedad-intelectual.json',
    'POLICIVO': 'actuaciones-policivo.json',
    'DISCIPLINARIO': 'actuaciones-disciplinario.json',
    'ARBITRAJE': 'actuaciones-arbitraje.json',
    'INSOLVENCIA': 'actuaciones-insolvencia.json',
    'AMBIENTAL': 'actuaciones-ambiental.json',
    'FAMILIA_ADMINISTRATIVA': 'actuaciones-familia-administrativa.json',
    'SEGURIDAD_SOCIAL': 'actuaciones-seguridad-social.json',
    'RESPONSABILIDAD_FISCAL': 'actuaciones-responsabilidad-fiscal.json',
    'CONTRATOS': 'actuaciones-contratos.json',
    'EXTINCION_DOMINIO': 'actuaciones-extincion-dominio.json',
    'RESTITUCION_TIERRAS': 'actuaciones-restitucion-tierras.json',
    'URBANISMO': 'actuaciones-urbanismo.json',
}

PREFIX_FOR_BRANCH = {b: b.lower() for b in FILE_FOR_BRANCH}

# INCOMPLETO earns its own verdict because CORRECTO was swallowing the defect
# this catalogue actually has. Six entries so far published a deadline that was
# accurate and useless: the court's clock, the counterparty's clock, the term to
# file — while the one whose expiry destroys the client's right went unmentioned.
# Under a two-way CORRECTO/ERRADO split those all read as correct, and the
# correction ended up in a free-text note where no applicator could reach it.
#
# A term that omits the clock that kills the right is not a correct term.
VEREDICTOS = {'CORRECTO', 'INCOMPLETO', 'TERMINO_ERRADO', 'ARTICULO_ERRADO',
              'NORMA_DEROGADA', 'ILEGIBLE'}


def slugify(text):
    """Must stay byte-identical to build-catalog.py, or no id will ever match."""
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode()
    text = re.sub(r'[^a-zA-Z0-9]+', '-', text).strip('-').lower()
    return re.sub(r'-+', '-', text)


def build_index():
    """Maps the generated id back to (research file, entry), the way the generator built it.

    Ids are rebuilt here with the SAME slug and the SAME collision suffix, rather
    than read from the generated TypeScript: reading the output to patch the
    input makes the input depend on a file it is supposed to produce, and a
    stale build would then decide which entry a correction lands on.
    """
    index = {}
    cargados = {}
    for branch, filename in FILE_FOR_BRANCH.items():
        path = os.path.join(RESEARCH_DIR, filename)
        if not os.path.exists(path):
            continue

        # Loaded ONCE per file and kept, so the entries the patches mutate are
        # the very objects written back. Reloading to write would silently drop
        # every correction made through the index.
        if filename not in cargados:
            cargados[filename] = json.load(io.open(path, encoding='utf-8'))
        data = cargados[filename]
        seen = set()

        for item in data.get('actuaciones', []):
            # One research file can hold several branches; only index this one's.
            if (item.get('area') or branch) != branch:
                continue

            slug = slugify(item['exact_name'])
            key = PREFIX_FOR_BRANCH[branch] + '/' + slug
            suffix = 2
            while key in seen:
                key = PREFIX_FOR_BRANCH[branch] + '/' + slug + '-' + str(suffix)
                suffix += 1
            seen.add(key)

            index[key] = (filename, item)

    return index, cargados


def main():
    if len(sys.argv) < 2:
        raise SystemExit('uso: apply-verification.py <dir-con-out-*.json> [--dry]')

    out_dir = sys.argv[1]
    dry = '--dry' in sys.argv

    parches = sorted(glob.glob(os.path.join(out_dir, 'out-*.json')))
    if not parches:
        raise SystemExit('FATAL: no hay archivos out-*.json en ' + out_dir)

    index, cargados = build_index()
    errores = []
    cambios = []
    ilegibles = []
    # Entries that WERE declared unverified and now carry a term read from an
    # official source. Without this the correction lands in the research file
    # and the generator still stamps NO_VERIFICADO, because `_meta.unverified`
    # outranks the term text — which is exactly the fix made in 422fc5e working
    # against itself. Verification has to be able to move in both directions.
    resueltos = []
    resumen = {v: 0 for v in VEREDICTOS}

    for parche in parches:
        datos = json.load(io.open(parche, encoding='utf-8'))
        nombre = os.path.basename(parche)

        # The petition patch adds new actuaciones; it is not a verification of
        # existing ones and is applied by hand after review.
        if 'resultados' not in datos:
            print('   (omitido, no es un parche de verificacion: %s)' % nombre)
            continue

        for r in datos['resultados']:
            rid = r.get('id')
            veredicto = r.get('veredicto')

            if veredicto not in VEREDICTOS:
                errores.append('%s: veredicto desconocido %r en %s' % (nombre, veredicto, rid))
                continue

            resumen[veredicto] += 1

            if rid not in index:
                errores.append('%s: id sin correspondencia en el catalogo: %s' % (nombre, rid))
                continue

            filename, item = index[rid]

            # A verdict that changes something must bring the evidence for it.
            if veredicto in ('INCOMPLETO', 'TERMINO_ERRADO', 'ARTICULO_ERRADO', 'NORMA_DEROGADA'):
                if not (r.get('cita_verbatim') or '').strip():
                    errores.append('%s: %s corrige sin cita verbatim: %s' % (nombre, veredicto, rid))
                    continue

                # A verdict that says something is wrong must also say what is
                # right, in a field the applicator reads. Prose is not a patch.
                if not any(r.get(k) for k in ('termino_correcto', 'termino_faltante',
                                              'articulo_correcto', 'autoridad_correcta')):
                    errores.append('%s: %s sin ninguna correccion estructurada: %s'
                                   % (nombre, veredicto, rid))
                    continue

            antes = {'term': item.get('term'), 'legal_basis': item.get('legal_basis'),
                     'source_url': item.get('source_url'),
                     'competent_authority': item.get('competent_authority')}

            if veredicto != 'ILEGIBLE' and (r.get('termino_correcto') or r.get('termino_faltante')):
                resueltos.append((filename, item['exact_name']))

            if veredicto == 'ILEGIBLE':
                # Unverified means unverified: the term goes, and the reason is
                # recorded where the generator will read it.
                item['term'] = None
                ilegibles.append((filename, item['exact_name'], r.get('nota') or 'No se pudo leer en fuente oficial.'))
            else:
                if r.get('termino_correcto'):
                    item['term'] = r['termino_correcto']
                if r.get('termino_faltante'):
                    item['term'] = ((item.get('term') or '') + ' ' + r['termino_faltante']).strip()
                if r.get('articulo_correcto'):
                    item['legal_basis'] = r['articulo_correcto']
                if r.get('source_url_oficial'):
                    item['source_url'] = r['source_url_oficial']
                # A CORRECT term filed before the wrong court is still a lost
                # case: the arbitration entries named the Tribunal Superior,
                # which is the NATIONAL rule, while art. 68 sends international
                # annulment to the Corte Suprema — inside a one-month window
                # with no second chance. The verdict was CORRECTO and the defect
                # sat in a free-text note, where no applicator could reach it.
                if r.get('autoridad_correcta'):
                    item['competent_authority'] = r['autoridad_correcta']

            despues = {'term': item.get('term'), 'legal_basis': item.get('legal_basis'),
                       'source_url': item.get('source_url'),
                       'competent_authority': item.get('competent_authority')}
            if antes != despues:
                cambios.append((filename, rid, veredicto, antes, despues))

    if errores:
        print('\nFATAL: %d problema(s). NO SE ESCRIBIO NADA.\n' % len(errores))
        for e in errores:
            print('  -', e)
        raise SystemExit(1)

    # Record every unreadable one where the generator reads it, so the label the
    # app shows comes from the same place the reason is written.
    por_archivo = {}
    for filename, nombre_act, razon in ilegibles:
        por_archivo.setdefault(filename, []).append({'actuacion': nombre_act, 'reason': razon})

    print('\nVeredictos: ' + ' | '.join('%s=%d' % (k, v) for k, v in sorted(resumen.items()) if v))
    print('Entradas modificadas: %d' % len(cambios))
    print('Nuevas sin verificar: %d' % len(ilegibles))

    for filename, rid, veredicto, antes, despues in cambios:
        print('\n  %s  [%s]' % (rid, veredicto))
        for campo in ('legal_basis', 'term', 'source_url', 'competent_authority'):
            if antes[campo] != despues[campo]:
                print('     %s:' % campo)
                print('       - %s' % str(antes[campo])[:160])
                print('       + %s' % str(despues[campo])[:160])

    if dry:
        print('\n--dry: no se escribio nada.')
        return

    escritos = (set(f for f, _, _, _, _ in cambios) | set(por_archivo)
                | set(f for f, _ in resueltos))
    for filename in sorted(escritos):
        path = os.path.join(RESEARCH_DIR, filename)
        data = cargados[filename]

        # Clear the ones this pass managed to verify, before adding the new
        # gaps: an entry can appear in both lists across successive passes.
        nombres_resueltos = {n for f, n in resueltos if f == filename}
        if nombres_resueltos:
            meta = data.setdefault('_meta', {})
            previos = meta.get('unverified') or []
            meta['unverified'] = [x for x in previos if x.get('actuacion') not in nombres_resueltos]
            quitados = len(previos) - len(meta['unverified'])
            if quitados:
                print('  %s: %d salieron de unverified (ya tienen termino oficial)' % (filename, quitados))

        if filename in por_archivo:
            meta = data.setdefault('_meta', {})
            existentes = meta.setdefault('unverified', [])
            ya = {x.get('actuacion') for x in existentes}
            for nuevo in por_archivo[filename]:
                if nuevo['actuacion'] not in ya:
                    existentes.append(nuevo)

        io.open(path, 'w', encoding='utf-8', newline='\n').write(
            json.dumps(data, ensure_ascii=False, indent=2) + '\n'
        )
        print('escrito: %s' % filename)

    print('\nAhora: python backend/scripts/build-catalog.py')


if __name__ == '__main__':
    main()
