import os
import json
import requests
import geopandas as gpd

# Definindo caminhos
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DATA_DIR = os.path.join(BASE_DIR, 'data', 'raw')

# Constantes CEMADEN
# A API pública do Cemaden permite consultar as estações pluviométricas e fluviométricas
CEMADEN_API_ESTACOES = "http://api.cemaden.gov.br/estacoes"

def baixar_estacoes_cemaden_manaus():
    """
    Busca os metadados das estações de monitoramento (pluviômetros e fluviômetros) do Cemaden.
    Esses sensores são essenciais para o nosso 'Módulo IoT e Alertas', pois nos dirão 
    onde está chovendo na bacia do Mindu em tempo real.
    """
    print("Buscando estações de monitoramento do Cemaden...")
    try:
        response = requests.get(CEMADEN_API_ESTACOES)
        response.raise_for_status()
        estacoes = response.json()
        
        # Filtrar apenas as estações do Estado do Amazonas (ou especificamente Manaus)
        estacoes_am = [e for e in estacoes if e.get('uf') == 'AM' and e.get('municipio') == 'MANAUS']
        
        output_file = os.path.join(RAW_DATA_DIR, 'cemaden_estacoes_manaus.json')
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(estacoes_am, f, ensure_ascii=False, indent=4)
            
        print(f"Sucesso! {len(estacoes_am)} estações do Cemaden encontradas em Manaus.")
        print(f"Arquivo salvo em: {output_file}")
        
    except Exception as e:
        print(f"Erro ao acessar API do Cemaden: {e}")

def mapear_risco_cprm():
    """
    Rotina para ingestão das Áreas de Risco Geológico e Hidrológico da CPRM 
    (Serviço Geológico do Brasil).
    
    Nota Metodológica: A CPRM disponibiliza essas camadas via Web Feature Service (WFS) 
    no Geobank ou através de shapefiles nos relatórios de Setorização de Risco.
    Aqui estruturamos a leitura de uma URL WFS pública ou arquivo local.
    """
    print("\nPreparando ingestão de Setorização de Risco da CPRM...")
    
    # Exemplo de como consumiremos o WFS da Infraestrutura Nacional de Dados Espaciais (INDE)
    # ou diretamente do repositório de shapefiles da CPRM.
    # Como as URLs WFS mudam, em um ambiente de produção baixaríamos o shapefile oficial
    # de "Setorização de Risco Alto e Muito Alto" para o Amazonas.
    
    arquivo_local_mock = os.path.join(RAW_DATA_DIR, 'cprm_risco_manaus_mock.geojson')
    
    print("Atenção: Os dados de manchas de inundação detalhados (Cota de 100 anos)")
    print("geralmente requerem solicitação formal à Defesa Civil Municipal ou download")
    print("direto do Sistema de Informações Geográficas de Manaus (SIGMANAUS).")
    print("Nesta etapa da arquitetura, o pipeline está preparado para receber este GeoJSON.")

if __name__ == "__main__":
    print("=== SIGWEB: Ingestão de Dados Hidrológicos e de Risco ===")
    baixar_estacoes_cemaden_manaus()
    mapear_risco_cprm()
    print("=== Processo Finalizado ===")
    print("O próximo passo analítico será cruzar a geometria das estações e das")
    print("áreas de risco com os Setores Censitários de alta vulnerabilidade.")
