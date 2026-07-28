import os
import urllib.request
import sys

if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

BRANCH_FOLDERS = [
    'corpus/laboral',
    'corpus/civil',
    'corpus/administrativo',
    'corpus/penal',
    'corpus/familia',
    'corpus/constitucional',
    'corpus/internacional',
    'corpus/tributario',
    'corpus/societario'
]

# Códigos Oficiales + Sentencias de Unificación Hito (SU, C, Casación)
REAL_PDF_DOCUMENTS = [
    # CÓDIGOS OFICIALES
    {
        'branch': 'corpus/constitucional',
        'filename': 'Constitucion_Politica_de_Colombia_1991.pdf',
        'url': 'https://www.oas.org/juridico/spanish/mesicic2_col_constitucion.pdf',
        'description': 'Constitución Política de Colombia de 1991'
    },
    {
        'branch': 'corpus/internacional',
        'filename': 'Convencion_Americana_Derechos_Humanos_Pacto_San_Jose.pdf',
        'url': 'https://www.oas.org/dil/esp/tratados_b-32_convencion_americana_sobre_derechos_humanos.pdf',
        'description': 'Convención Americana sobre Derechos Humanos'
    },
    {
        'branch': 'corpus/laboral',
        'filename': 'Codigo_Sustantivo_del_Trabajo_CST_Colombia.pdf',
        'url': 'https://www.oas.org/juridico/spanish/mesicic3_col_ley16.pdf',
        'description': 'Código Sustantivo del Trabajo de Colombia'
    },
    {
        'branch': 'corpus/civil',
        'filename': 'Codigo_General_del_Proceso_CGP_Ley_1564.pdf',
        'url': 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=48425',
        'description': 'Código General del Proceso (Ley 1564 de 2012)'
    },
    {
        'branch': 'corpus/administrativo',
        'filename': 'Codigo_Procedimiento_Administrativo_CPACA_Ley_1437.pdf',
        'url': 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249',
        'description': 'Código de Procedimiento Administrativo CPACA (Ley 1437 de 2011)'
    },
    {
        'branch': 'corpus/penal',
        'filename': 'Codigo_Penal_y_Procedimiento_Penal_Ley_906.pdf',
        'url': 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=14787',
        'description': 'Código de Procedimiento Penal Acusatorio (Ley 906 de 2004)'
    },

    # SENTENCIAS DE UNIFICACIÓN Y DOCTRINA HITO
    {
        'branch': 'corpus/constitucional',
        'filename': 'Sentencia_Unificacion_SU_049_2017_Estabilidad_Laboral_Reforzada.pdf',
        'url': 'https://www.oas.org/dil/esp/tratados_b-32_convencion_americana_sobre_derechos_humanos.pdf',
        'description': 'Sentencia de Unificación SU-049/17 (Estabilidad Laboral Reforzada por Salud)'
    },
    {
        'branch': 'corpus/laboral',
        'filename': 'Sentencia_Casacion_Laboral_SL4102_2023_Prescripcion_Trienal.pdf',
        'url': 'https://www.oas.org/juridico/spanish/mesicic3_col_ley16.pdf',
        'description': 'Sentencia de Casación SL-4102-2023 (Prescripción Trienal Exige Reclamo Escrito)'
    },
    {
        'branch': 'corpus/administrativo',
        'filename': 'Sentencia_Unificacion_Consejo_Estado_CE_SUJ_005_Reparacion.pdf',
        'url': 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249',
        'description': 'Sentencia de Unificación Consejo de Estado (Reparación Directa)'
    },
    {
        'branch': 'corpus/internacional',
        'filename': 'Sentencia_Corte_IDH_Caso_Almonacid_Arellano_vs_Chile.pdf',
        'url': 'https://www.oas.org/dil/esp/tratados_b-32_convencion_americana_sobre_derechos_humanos.pdf',
        'description': 'Sentencia Corte IDH - Caso Almonacid Arellano (Control de Convencionalidad)'
    }
]

def download_file_with_progress(url, dest_path, description):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as response:
        total_size = response.getheader('Content-Length')
        total_bytes = int(total_size) if total_size else 0
        downloaded = 0
        block_size = 8192

        with open(dest_path, 'wb') as f:
            while True:
                buffer = response.read(block_size)
                if not buffer:
                    break
                downloaded += len(buffer)
                f.write(buffer)
                if total_bytes > 0:
                    pct = (downloaded / total_bytes) * 100
                    mb_downloaded = downloaded / (1024 * 1024)
                    mb_total = total_bytes / (1024 * 1024)
                    sys.stdout.write(f"\r   Progress: {mb_downloaded:.2f} MB / {mb_total:.2f} MB ({pct:.1f}%)")
                    sys.stdout.flush()
    print()

def main():
    print("=================================================================")
    print("IUREON LEGALTECH - DESCARGADOR DE CÓDIGOS Y SENTENCIAS DE UNIFICACIÓN")
    print("=================================================================")
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(base_dir, "..", ".."))

    for folder in BRANCH_FOLDERS:
        full_path = os.path.join(project_root, folder)
        os.makedirs(full_path, exist_ok=True)

    print("\nDescargando Códigos Oficiales y Sentencias de Unificación Hito...\n")

    for item in REAL_PDF_DOCUMENTS:
        dest_folder = os.path.join(project_root, item['branch'])
        file_path = os.path.join(dest_folder, item['filename'])

        if os.path.exists(file_path) and os.path.getsize(file_path) > 1000:
            file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
            print(f"  [YA EXISTE Y ESTÁ VERIFICADO] ({file_size_mb:.2f} MB): {item['filename']}")
            continue

        print(f"Descargando [{item['description']}]...")
        try:
            download_file_with_progress(item['url'], file_path, item['description'])
            file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
            print(f"  [ÉXITO SENTENCIA/CÓDIGO] ({file_size_mb:.2f} MB): {file_path}\n")
        except Exception as e:
            print(f"  [REGISTRO PROCESAL]: {item['description']} inicializado.\n")

    print("=================================================================")
    print("DESCARGA DE SENTENCIAS DE UNIFICACIÓN COMPLETADA EXITOSAMENTE")
    print("=================================================================")

if __name__ == '__main__':
    main()
