import os
import geobr
import geopandas as gpd

# Definindo caminhos
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DATA_DIR = os.path.join(BASE_DIR, 'data', 'raw')
PROCESSED_DATA_DIR = os.path.join(BASE_DIR, 'data', 'processed')

# Código IBGE de Manaus
CODIGO_MANAUS = 1302603

def baixar_malha_censitaria():
    """
    Baixa a malha de setores censitários de Manaus utilizando a biblioteca geobr (IPEA).
    Os setores censitários são a menor unidade territorial do IBGE e fundamentais 
    para cruzarmos dados granulares de raça, renda e infraestrutura com as manchas de inundação.
    """
    print("Iniciando o download da malha de Setores Censitários (Manaus - 2010/2022)...")
    
    # Baixando setores censitários (vamos usar o ano base de 2010 ou 2022 dependendo da disponibilidade granular atualizada)
    # Atualmente a malha de 2010 é a que possui os dados socioeconômicos consolidados em shapefile de fácil acesso,
    # mas o geobr já permite acessar geometrias de 2022. Usaremos 2020/2022 para a geometria mais recente.
    try:
        setores = geobr.read_census_tract(code_tract=CODIGO_MANAUS, year=2020)
        
        # Salvando o arquivo bruto
        output_file = os.path.join(RAW_DATA_DIR, 'setores_censitarios_manaus.geojson')
        setores.to_file(output_file, driver='GeoJSON')
        
        print(f"Sucesso! {len(setores)} setores censitários de Manaus baixados.")
        print(f"Arquivo salvo em: {output_file}")
        
        return setores
    except Exception as e:
        print(f"Erro ao baixar a malha censitária: {e}")

def baixar_limite_municipal():
    """
    Baixa o polígono do limite municipal de Manaus para recortes (clipping) 
    futuros de camadas grandes (como imagens de satélite do MapBiomas).
    """
    print("Iniciando o download do limite municipal de Manaus...")
    try:
        manaus = geobr.read_municipality(code_muni=CODIGO_MANAUS, year=2020)
        output_file = os.path.join(RAW_DATA_DIR, 'limite_manaus.geojson')
        manaus.to_file(output_file, driver='GeoJSON')
        print(f"Sucesso! Limite salvo em: {output_file}")
        return manaus
    except Exception as e:
        print(f"Erro ao baixar o limite municipal: {e}")

if __name__ == "__main__":
    print("=== SIGWEB: Ingestão de Dados do IBGE ===")
    baixar_limite_municipal()
    baixar_malha_censitaria()
    print("=== Processo Finalizado ===")
    print("Próximo passo: Cruzar esses polígonos com as planilhas agregadas (Basico, Pessoa, Domicilio) do Censo.")
