#!/usr/bin/env bash
# El flujo de CI tiene que ser YAML valido, y esto se comprueba ANTES de empujar.
#
# POR QUE EXISTE: el 10 de septiembre de 2026 un nombre de paso con «: » sin
# comillas dejo el archivo invalido y tumbo tres empujes seguidos. Se corrigio,
# se escribio el aviso arriba de `jobs:`... y el mismo dia volvio a pasar. Un
# aviso en un comentario no lo lee quien anade el siguiente paso; un guard si.
#
# Y ES EL PEOR FALLO DE LEER: GitHub no reporta un check en rojo, reporta el
# flujo en fallo CON CERO TRABAJOS. Desde fuera parece que fallaron las pruebas
# —que en local pasan— cuando lo que fallo fue este archivo antes de arrancar.
set -u
raiz="$(cd "$(dirname "$0")/.." && pwd)"
archivo="$raiz/.github/workflows/ci.yml"

python - "$archivo" <<'PY'
import sys, re
try:
    import yaml
except ImportError:
    print('AVISO: sin PyYAML no se puede validar el flujo; instale pyyaml.')
    sys.exit(0)
ruta = sys.argv[1]
texto = open(ruta, encoding='utf-8').read()
try:
    datos = yaml.safe_load(texto)
except yaml.YAMLError as e:
    print('EL FLUJO DE CI NO ES YAML VALIDO:'); print(' ', e); sys.exit(1)

# La causa concreta, senalada por su nombre para que el mensaje ensene el arreglo.
malos = [l for l in texto.splitlines() if re.match(r'^\s*- name: (?!["\']).*: ', l)]
if malos:
    print('NOMBRES DE PASO CON «: » SIN COMILLAS (rompen el YAML):')
    for l in malos: print('  ', l.strip())
    print('Arreglo: entrecomille el nombre entero.')
    sys.exit(1)

pasos = sum(len(j.get('steps', [])) for j in datos.get('jobs', {}).values())
print(f'Flujo de CI valido: {len(datos.get("jobs", {}))} trabajos, {pasos} pasos.')
PY
