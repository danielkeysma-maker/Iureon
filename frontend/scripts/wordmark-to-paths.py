#!/usr/bin/env python
"""
Convierte el wordmark a TRAZADOS, y esa conversion no es un detalle tecnico.

POR QUE. Mientras el SVG diga `<text font-family="Tenor Sans">`, la palabra se
dibuja con la tipografia que tenga QUIEN LO ABRE. Un socio que reciba el logo
por correo, un impresor, la pagina de un directorio juridico: ninguno tiene
Tenor Sans instalada, y todos veran otra marca. Un wordmark que depende de una
fuente instalada no es un wordmark, es una sugerencia.

Convertido a trazados el archivo lleva las formas, no el nombre de la fuente.
Se ve igual en todas partes, no carga una cuarta familia en la aplicacion, y
deja de importar si Google Fonts esta caido.

LA FUENTE SE ELIGIO MIDIENDO. Tenor Sans reproduce la forma que el dueno de la
marca reconocio en su propia referencia: proporciones romanas, trazo uniforme, y
la I con barras arriba y abajo — que ademas resuelve el problema clasico de una
I sola, confundirse con l o con 1. Se probo contra Marcellus, Julius Sans One,
Cinzel, Jost, Questrial, Cormorant Garamond y Gilda Display, y contra Plus
Jakarta Sans a veinte pixeles, que es el tamano al que el logo mas se ve.

Licencia: Tenor Sans es Open Font License. Permite uso comercial y conversion a
trazados para una marca. Georgia, Constantia y Segoe, que estuvieron antes aqui,
son de Microsoft y su licencia NO lo permite.

Correr con:  python scripts/wordmark-to-paths.py
Salida:      scripts/wordmark-paths.json  (lo consume build-brand.mjs)
"""
import json
import os
import urllib.request

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont

AQUI = os.path.dirname(os.path.abspath(__file__))
# La URL del .ttf se RESUELVE, no se escribe: Google versiona sus archivos y
# una direccion fija caduca sin avisar — esta ya lo hizo una vez, con un 404.
CSS_URL = 'https://fonts.googleapis.com/css2?family=Tenor+Sans'
CACHE = os.path.join(AQUI, '.tenor-sans.ttf')

# Lo que hay que convertir. Todo en versales: la marca no usa minusculas.
TEXTOS = {
    'marca': 'IUREON',
    'eslogan_en': 'SMART JUSTICE',
    'eslogan_es': 'JUSTICIA VERIFICADA',
    'fundacion': 'FOUNDED 2026',
}


def descargar_fuente() -> str:
    if os.path.exists(CACHE):
        return CACHE

    # Con un User-Agent viejo Google devuelve TTF; con uno moderno, woff2, que
    # fontTools solo lee si esta instalado brotli.
    req = urllib.request.Request(CSS_URL, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 6.1)'})
    with urllib.request.urlopen(req, timeout=60) as r:
        css = r.read().decode('utf-8')

    import re
    m = re.search(r'https://[^)]+\.ttf', css)
    if not m:
        raise SystemExit('Google no devolvio un .ttf para Tenor Sans; revisa el User-Agent.')

    with urllib.request.urlopen(m.group(0), timeout=60) as r:
        datos = r.read()
    with open(CACHE, 'wb') as f:
        f.write(datos)
    return CACHE


def trazar(texto: str, fuente: TTFont, tamano: float, tracking: float) -> dict:
    """
    Devuelve un unico path con todas las letras ya posicionadas.

    El tracking se aplica AQUI y no con `letter-spacing`, porque ese atributo
    solo existe para texto vivo: una vez convertido a trazados, el espaciado
    tiene que estar horneado en las coordenadas.
    """
    glyphset = fuente.getGlyphSet()
    cmap = fuente.getBestCmap()
    upm = fuente['head'].unitsPerEm
    escala = tamano / upm

    partes = []
    x = 0.0

    for ch in texto:
        nombre = cmap.get(ord(ch))
        if nombre is None:
            # Un caracter sin glifo se salta en silencio en la mayoria de
            # herramientas; aqui truena, porque una marca a la que le falta una
            # letra es peor que un build roto.
            raise SystemExit(f'La fuente no tiene glifo para {ch!r}')

        glifo = glyphset[nombre]

        if ch != ' ':
            pen = SVGPathPen(glyphset)
            glifo.draw(pen)
            d = pen.getCommands()
            if d:
                # El eje Y de una fuente crece hacia arriba y el de SVG hacia
                # abajo: sin el -escala las letras salen de cabeza.
                partes.append(
                    f'<g transform="translate({x:.2f} 0) scale({escala:.5f} {-escala:.5f})">'
                    f'<path d="{d}"/></g>'
                )

        x += glifo.width * escala + tracking

    return {'paths': partes, 'ancho': round(x - tracking, 2), 'alto': tamano}


def main() -> None:
    fuente = TTFont(descargar_fuente())

    # Tamanos y tracking medidos sobre el lockup real, no elegidos a ojo.
    salida = {
        'fuente': 'Tenor Sans (OFL) — convertido a trazados',
        'marca': trazar(TEXTOS['marca'], fuente, 40, 6.5),
        'marca_pequena': trazar(TEXTOS['marca'], fuente, 28, 4.5),
        'eslogan_en': trazar(TEXTOS['eslogan_en'], fuente, 12, 4.5),
        'eslogan_es': trazar(TEXTOS['eslogan_es'], fuente, 12, 4.0),
        'fundacion': trazar(TEXTOS['fundacion'], fuente, 10, 3.0),
    }

    destino = os.path.join(AQUI, 'wordmark-paths.json')
    with open(destino, 'w', encoding='utf-8') as f:
        json.dump(salida, f, ensure_ascii=False, indent=2)

    print(f'Escrito {destino}')
    for k, v in salida.items():
        if isinstance(v, dict):
            print(f'  {k:16} {len(v["paths"])} glifos, {v["ancho"]}px de ancho')


if __name__ == '__main__':
    main()
