"""
Iconos PROVISIONALES de la PWA.

Genera los PNG que el manifest y iOS exigen (SVG no sirve para ninguno de los
dos): 192 y 512 (purpose "any"), un 512 "maskable" con la zona segura del 80 %
y el apple-touch-icon de 180. Es un cuadrado redondeado en brand-700 con una
«I» blanca de palo y remates, dibujada con rectángulos: no es la marca, es lo
que hay hasta que llegue un icono diseñado. Cuando llegue, se reemplaza el
dibujo en `dibujar()` y se vuelve a correr:

    python frontend/scripts/generar-iconos-pwa.py

Requiere Pillow (`pip install pillow`).
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

BRAND_700 = (0x17, 0x45, 0x6B)  # tokens.css --brand-700
BLANCO = (255, 255, 255)

RAIZ = Path(__file__).resolve().parent.parent / "public"


def dibujar(tamano: int, *, maskable: bool = False, transparente: bool = False) -> Image.Image:
    """Cuadrado redondeado + «I» serif. En maskable el dibujo ocupa el 80 % central."""
    modo = "RGBA" if transparente else "RGB"
    fondo = (0, 0, 0, 0) if transparente else BRAND_700
    img = Image.new(modo, (tamano, tamano), fondo)
    d = ImageDraw.Draw(img)

    if maskable:
        # El sistema recorta hasta el 10 % por cada lado: el fondo llena todo y
        # el glifo se queda dentro del 80 % central.
        d.rectangle([0, 0, tamano, tamano], fill=BRAND_700)
        escala = 0.8
    else:
        if not transparente:
            radio = int(tamano * 0.22)
            d.rounded_rectangle([0, 0, tamano - 1, tamano - 1], radius=radio, fill=BRAND_700)
        escala = 1.0

    # Geometría de la «I», relativa al lado útil.
    lado = tamano * escala
    cx = tamano / 2
    cy = tamano / 2
    alto = lado * 0.52
    grosor_palo = lado * 0.13
    ancho_remate = lado * 0.34
    grosor_remate = lado * 0.10

    arriba = cy - alto / 2
    abajo = cy + alto / 2
    color = BLANCO

    d.rectangle([cx - grosor_palo / 2, arriba, cx + grosor_palo / 2, abajo], fill=color)
    d.rectangle([cx - ancho_remate / 2, arriba, cx + ancho_remate / 2, arriba + grosor_remate], fill=color)
    d.rectangle([cx - ancho_remate / 2, abajo - grosor_remate, cx + ancho_remate / 2, abajo], fill=color)
    return img


def guardar(img: Image.Image, ruta: Path) -> None:
    ruta.parent.mkdir(parents=True, exist_ok=True)
    img.save(ruta, format="PNG", optimize=True)
    print(f"  {ruta.relative_to(RAIZ.parent)}  {img.size[0]}x{img.size[1]}")


def main() -> None:
    print("Generando iconos PWA provisionales…")
    pwa = RAIZ / "pwa"
    guardar(dibujar(192), pwa / "icon-192.png")
    guardar(dibujar(512), pwa / "icon-512.png")
    guardar(dibujar(512, maskable=True), pwa / "icon-maskable-512.png")
    # El «badge» de Android es monocromo sobre transparente: solo el glifo.
    guardar(dibujar(96, transparente=True), pwa / "badge-96.png")
    # iOS ignora el manifest para el icono de inicio: lo lee de este enlace.
    guardar(dibujar(180), RAIZ / "apple-touch-icon.png")


if __name__ == "__main__":
    main()
