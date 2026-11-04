import os
import ee

# Definindo caminhos
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROCESSED_DATA_DIR = os.path.join(BASE_DIR, 'data', 'processed')

def autenticar_ee():
    """
    Autentica e inicializa a API do Google Earth Engine (GEE).
    O GEE é o motor por trás do MapBiomas. Requer uma conta Google gratuita.
    """
    try:
        ee.Initialize()
        print("Google Earth Engine inicializado com sucesso!")
    except Exception as e:
        print("Autenticação necessária. Por favor, execute no terminal: earthengine authenticate")
        # ee.Authenticate() # Descomente esta linha ao rodar pela primeira vez
        raise e

def extrair_impermeabilizacao_mindu():
    """
    Extrai o histórico de expansão da Área Urbana (Classe 24 do MapBiomas)
    para a bacia do Mindu (Manaus) comparando as décadas.
    """
    print("\nIniciando extração de dados do MapBiomas (Coleção 8/9)...")
    
    # Coordenada central da Bacia do Mindu para criar uma Área de Interesse (AOI)
    # Em produção, usaremos o polígono exato (Shapefile) da bacia hidrográfica.
    ponto_central_mindu = ee.Geometry.Point([-60.0076, -3.0766])
    aoi_mindu = ponto_central_mindu.buffer(8000).bounds() # Buffer de 8km englobando a bacia
    
    # Acessando a Coleção 8 do MapBiomas
    # O asset oficial do MapBiomas no Earth Engine
    mapbiomas = ee.Image('projects/mapbiomas-workspace/public/collection8/mapbiomas_collection80_integration_v1')
    
    # No MapBiomas, a Classe 24 representa "Infraestrutura Urbana" (Asfalto, Concreto, Telhados)
    CLASSE_URBANA = 24
    
    # Vamos extrair a mancha urbana em três recortes temporais críticos:
    # 1985 (Início da série histórica), 2005 (Boom imobiliário do Parque 10) e 2022 (Cenário atual)
    anos_analise = ['classification_1985', 'classification_2005', 'classification_2022']
    
    for ano in anos_analise:
        print(f"Processando a imagem do ano: {ano.replace('classification_', '')}")
        
        # Isolar a banda do ano específico
        imagem_ano = mapbiomas.select(ano)
        
        # Criar uma máscara (mask): Manter apenas os pixels que são Classe 24 (Urbano)
        mancha_urbana = imagem_ano.updateMask(imagem_ano.eq(CLASSE_URBANA))
        
        # Gerar a URL de download do GeoTIFF recortado para a nossa Bacia do Mindu
        try:
            url_download = mancha_urbana.getDownloadURL({
                'scale': 30, # Resolução espacial de 30 metros (padrão Landsat/MapBiomas)
                'crs': 'EPSG:4326',
                'region': aoi_mindu,
                'format': 'GEO_TIFF'
            })
            print(f"-> Link de Download ({ano}): {url_download}")
        except Exception as e:
            print(f"Erro ao gerar link para {ano}: {e}")

if __name__ == "__main__":
    print("=== SIGWEB: Módulo MapBiomas (Evolução da Impermeabilização) ===")
    try:
        autenticar_ee()
        extrair_impermeabilizacao_mindu()
        print("\n=== Processo Finalizado ===")
        print("Os arquivos GeoTIFF baixados serão cruzados com a malha censitária")
        print("para provar a correlação entre bairros de alta renda e a supressão das APPs.")
    except Exception as e:
        print("\nO script foi interrompido. Resolva a autenticação do Earth Engine e tente novamente.")
