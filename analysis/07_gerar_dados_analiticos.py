import os
import json
import geopandas as gpd
import pandas as pd

processed_dir = r"c:\Users\CINDACTA IV\Desktop\SIGWEB\data\processed"
nextjs_data_dir = r"c:\Users\CINDACTA IV\Desktop\SIGWEB\frontend\sigweb-dashboard\public\data"

risco_gdf = gpd.read_file(os.path.join(processed_dir, "areas_risco_cprm.geojson")).to_crs(epsg=32720)
cursos_gdf = gpd.read_file(os.path.join(processed_dir, "cursos_mindu.geojson")).to_crs(epsg=32720)
bairros_gdf = gpd.read_file(os.path.join(processed_dir, "bairros_mindu.geojson")).to_crs(epsg=32720)

# Atribuir curso e bairro a cada um dos 79 setores de risco SGB/CPRM via centroide
centroids = risco_gdf.copy()
centroids["geometry"] = centroids.geometry.centroid

join_curso = gpd.sjoin(centroids, cursos_gdf[["curso", "codigo", "geometry"]], how="left", predicate="within")
risco_gdf["curso"] = join_curso["curso"].fillna("Médio Curso").values
risco_gdf["codigo_curso"] = join_curso["codigo"].fillna("medio_curso").values

join_bairro = gpd.sjoin(centroids, bairros_gdf[["NOME", "ZONAS", "geometry"]], how="left", predicate="within")
risco_gdf["bairro"] = join_bairro["NOME"].fillna("NÃO IDENTIFICADO").values
risco_gdf["zona_adm"] = join_bairro["ZONAS"].fillna("LESTE/NORTE").values

# Adicionar coordenadas do centroide em WGS84 para permitir que a tabela dê "Zoom" direto no polígono!
risco_wgs = risco_gdf.to_crs(epsg=4326)
centroids_wgs = risco_wgs.geometry.centroid
risco_wgs["lat"] = [round(pt.y, 6) for pt in centroids_wgs]
risco_wgs["lng"] = [round(pt.x, 6) for pt in centroids_wgs]

# Salvar areas_risco_cprm.geojson enriquecido
risco_wgs.to_file(os.path.join(processed_dir, "areas_risco_cprm.geojson"), driver="GeoJSON")
risco_wgs.to_file(os.path.join(nextjs_data_dir, "areas_risco_cprm.geojson"), driver="GeoJSON")

# Criar JSON analítico completo para os Gráficos, Filtros e Tabelas do Dashboard
setores_lista = []
for idx, row in risco_wgs.iterrows():
    setores_lista.append({
        "id": int(idx) + 1,
        "cod_setor": str(row.get("NUM_SETOR", f"SR_{idx}")),
        "local": str(row.get("LOCAL", "Sem endereço")),
        "bairro": str(row.get("bairro", "")),
        "zona": str(row.get("zona_adm", "")),
        "curso": str(row.get("curso", "")),
        "codigo_curso": str(row.get("codigo_curso", "")),
        "tipologia": str(row.get("TIPOLOGIA") or row.get("TIPOLO_G1") or "Hidrológico/Geológico"),
        "tipologia_principal": str(row.get("TIPOLO_G1") or "Não especificada"),
        "grau_risco": str(row.get("GRAU_RISCO") or "Alto"),
        "grau_vulne": str(row.get("GRAU_VULNE") or "Alto"),
        "pessoas": int(row.get("NUM_PESS") or 0),
        "edificacoes": int(row.get("NUM_EDIF") or 0),
        "data": str(row.get("DATA_SETOR") or "2024"),
        "descricao": str(row.get("DESCRICAO") or ""),
        "intervencao": str(row.get("SUG_INTERV") or ""),
        "lat": float(row["lat"]),
        "lng": float(row["lng"])
    })

df_setores = pd.DataFrame(setores_lista)

# Agregações para gráficos
por_tipologia = df_setores.groupby("tipologia_principal").agg(
    setores=("id", "count"),
    pessoas=("pessoas", "sum"),
    edificacoes=("edificacoes", "sum")
).reset_index().to_dict(orient="records")

por_grau_risco = df_setores.groupby("grau_risco").agg(
    setores=("id", "count"),
    pessoas=("pessoas", "sum"),
    edificacoes=("edificacoes", "sum")
).reset_index().to_dict(orient="records")

por_curso = df_setores.groupby(["curso", "codigo_curso"]).agg(
    setores=("id", "count"),
    pessoas=("pessoas", "sum"),
    edificacoes=("edificacoes", "sum")
).reset_index().to_dict(orient="records")

bairros_lista = bairros_gdf.to_crs(epsg=4326).drop(columns=["geometry"]).sort_values(by="domicilios_inundacao", ascending=False).to_dict(orient="records")

dashboard_data = {
    "resumo": {
        "total_pessoas_risco": int(df_setores["pessoas"].sum()),
        "total_edificacoes_risco": int(df_setores["edificacoes"].sum()),
        "total_setores_risco": len(df_setores),
        "total_domicilios_inundacao": 17964,
        "extensao_drenagem_km": 175.27,
        "area_bacia_km2": 64.85,
        "total_setores_ibge": 875,
        "total_bairros_bhm": len(bairros_lista)
    },
    "graficos": {
        "por_tipologia": por_tipologia,
        "por_grau_risco": por_grau_risco,
        "por_curso": por_curso,
        "bairros_inundacao": bairros_lista
    },
    "setores_risco": sorted(setores_lista, key=lambda x: x["pessoas"], reverse=True)
}

out_path = os.path.join(nextjs_data_dir, "dashboard_analytics.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(dashboard_data, f, ensure_ascii=False, indent=2)

print("Arquivo dashboard_analytics.json gerado com sucesso!")
print("Por tipologia:", por_tipologia)
print("Por grau de risco:", por_grau_risco)
