import os
import geopandas as gpd
import pyogrio

base_dir = r"c:\Users\CINDACTA IV\Desktop\SIGWEB\data\raw\Adrielle_Dados"
bairros_cd_dir = r"c:\Users\CINDACTA IV\Desktop\SIGWEB\data\raw\AM_bairros_CD2022"

files_to_inspect = [
    os.path.join(base_dir, "BHM_Alto_curso.shp"),
    os.path.join(base_dir, "BHM_Medio_curso.shp"),
    os.path.join(base_dir, "BHM_Baixo_curso.shp"),
    os.path.join(base_dir, "BHM_Area_risco.shp"),
    os.path.join(base_dir, "Dcomicilios_afetados_inundacao.shp"),
    os.path.join(base_dir, "bairros_bhm.gpkg"),
    os.path.join(base_dir, "rede_drenagem.gpkg"),
    os.path.join(base_dir, "setores_mindu.gpkg"),
    os.path.join(base_dir, "zona_adm.gpkg"),
    os.path.join(bairros_cd_dir, "AM_bairros_CD2022.shp")
]

for fp in files_to_inspect:
    print("="*70)
    print("ARQUIVO:", os.path.basename(fp))
    try:
        if fp.endswith(".gpkg"):
            layers = pyogrio.list_layers(fp)
            print("Layers no GPKG:", layers)
        gdf = gpd.read_file(fp)
        print("CRS:", gdf.crs)
        print("Feições:", len(gdf), "| Tipo Geom:", gdf.geom_type.unique().tolist())
        cols = [c for c in gdf.columns if c != 'geometry']
        print("Colunas:", cols)
        if len(gdf) > 0 and len(cols) > 0:
            print("Amostra (primeiras 2 linhas):")
            print(gdf[cols].head(2).to_dict(orient="records"))
    except Exception as e:
        print("Erro ao ler:", e)
