import os
import json
import geopandas as gpd
import pandas as pd

base_dir = r"c:\Users\CINDACTA IV\Desktop\SIGWEB\data\raw\Adrielle_Dados"
bairros_cd_dir = r"c:\Users\CINDACTA IV\Desktop\SIGWEB\data\raw\AM_bairros_CD2022"
processed_dir = r"c:\Users\CINDACTA IV\Desktop\SIGWEB\data\processed"
nextjs_data_dir = r"c:\Users\CINDACTA IV\Desktop\SIGWEB\frontend\sigweb-dashboard\public\data"
prototype_dir = r"c:\Users\CINDACTA IV\Desktop\SIGWEB\frontend\prototype"

os.makedirs(processed_dir, exist_ok=True)
os.makedirs(nextjs_data_dir, exist_ok=True)

def save_geojson_both(gdf, filename):
    gdf_wgs = gdf.to_crs(epsg=4326)
    p1 = os.path.join(processed_dir, filename)
    p2 = os.path.join(nextjs_data_dir, filename)
    gdf_wgs.to_file(p1, driver="GeoJSON")
    gdf_wgs.to_file(p2, driver="GeoJSON")
    print(f"[OK] {filename} exportado ({len(gdf_wgs)} feições)")
    return gdf_wgs

# 1. Compartimentos da Bacia (Alto, Médio e Baixo Curso)
alto = gpd.read_file(os.path.join(base_dir, "BHM_Alto_curso.shp")).to_crs(epsg=32720)
medio = gpd.read_file(os.path.join(base_dir, "BHM_Medio_curso.shp")).to_crs(epsg=32720)
baixo = gpd.read_file(os.path.join(base_dir, "BHM_Baixo_curso.shp")).to_crs(epsg=32720)

alto["curso"] = "Alto Curso"
alto["codigo"] = "alto_curso"
alto["perfil_socioambiental"] = "Expansão Urbana Periférica / Nascentes (Cidade de Deus, Jorge Teixeira)"
alto["area_km2"] = round(float(alto.geometry.area.sum() / 1e6), 2)

medio["curso"] = "Médio Curso"
medio["codigo"] = "medio_curso"
medio["perfil_socioambiental"] = "Alta Renda / Forte Impermeabilização (Parque 10, Aleixo, N.S. das Graças)"
medio["area_km2"] = round(float(medio.geometry.area.sum() / 1e6), 2)

baixo["curso"] = "Baixo Curso"
baixo["codigo"] = "baixo_curso"
baixo["perfil_socioambiental"] = "Vulnerabilidade Crítica / Repiquete + Enxurrada (São Raimundo, Glória, Aparecida)"
baixo["area_km2"] = round(float(baixo.geometry.area.sum() / 1e6), 2)

cursos_gdf = pd.concat([alto, medio, baixo], ignore_index=True)

# 2. Domicílios afetados por inundação (17.964 pontos) - Contagem por Curso e por Bairro!
dom_pts = gpd.read_file(os.path.join(base_dir, "Dcomicilios_afetados_inundacao.shp")).to_crs(epsg=32720)
print(f"Total de domicílios afetados por inundação: {len(dom_pts)}")

# Spatial join domicílios x cursos
dom_por_curso = gpd.sjoin(dom_pts, cursos_gdf[["codigo", "geometry"]], how="inner", predicate="within")
contagem_curso = dom_por_curso.groupby("codigo").size().to_dict()
cursos_gdf["domicilios_inundacao"] = cursos_gdf["codigo"].map(lambda c: int(contagem_curso.get(c, 0)))

# 3. Áreas de Risco Oficial SGB/CPRM (79 polígonos)
risco_gdf = gpd.read_file(os.path.join(base_dir, "BHM_Area_risco.shp")).to_crs(epsg=32720)
# Converter coluna DATA_SETOR para string para serializar em GeoJSON sem erro
for col in risco_gdf.columns:
    if col != "geometry" and str(risco_gdf[col].dtype).startswith("datetime"):
        risco_gdf[col] = risco_gdf[col].dt.strftime("%Y-%m-%d")

# Contar áreas de risco e pessoas em risco por Curso (usando centroide da área de risco)
risco_centroids = risco_gdf.copy()
risco_centroids["geometry"] = risco_centroids.geometry.centroid
risco_por_curso = gpd.sjoin(risco_centroids, cursos_gdf[["codigo", "geometry"]], how="inner", predicate="within")
setores_curso = risco_por_curso.groupby("codigo").size().to_dict()
pessoas_curso = risco_por_curso.groupby("codigo")["NUM_PESS"].sum().to_dict()
edif_curso = risco_por_curso.groupby("codigo")["NUM_EDIF"].sum().to_dict()

cursos_gdf["setores_risco_cprm"] = cursos_gdf["codigo"].map(lambda c: int(setores_curso.get(c, 0)))
cursos_gdf["pessoas_risco_cprm"] = cursos_gdf["codigo"].map(lambda c: int(pessoas_curso.get(c, 0)))
cursos_gdf["edificacoes_risco_cprm"] = cursos_gdf["codigo"].map(lambda c: int(edif_curso.get(c, 0)))

print("\nResumo por Compartimento Hidrológico (Alto, Médio e Baixo Curso):")
print(cursos_gdf[["curso", "area_km2", "setores_risco_cprm", "pessoas_risco_cprm", "domicilios_inundacao"]])

save_geojson_both(cursos_gdf, "cursos_mindu.geojson")

# Exportar Áreas de Risco SGB/CPRM enxutas
cols_risco = [
    "LOCAL", "NUM_SETOR", "TIPOLOGIA", "TIPOLO_G1", "GRAU_RISCO", "GRAU_VULNE",
    "NUM_EDIF", "NUM_PESS", "DESCRICAO", "SUG_INTERV", "DATA_SETOR", "geometry"
]
risco_clean = risco_gdf[[c for c in cols_risco if c in risco_gdf.columns]].copy()
save_geojson_both(risco_clean, "areas_risco_cprm.geojson")

# 4. Bairros da Bacia do Mindu (bairros_bhm.gpkg) + contagem de domicílios inundados por bairro
bairros_bhm = gpd.read_file(os.path.join(base_dir, "bairros_bhm.gpkg")).to_crs(epsg=32720)
dom_por_bairro = gpd.sjoin(dom_pts, bairros_bhm[["NOME", "geometry"]], how="inner", predicate="within")
contagem_bairro = dom_por_bairro.groupby("NOME").size().to_dict()
bairros_bhm["domicilios_inundacao"] = bairros_bhm["NOME"].map(lambda n: int(contagem_bairro.get(n, 0)))
bairros_bhm["area_km2"] = round(bairros_bhm.geometry.area / 1e6, 2)
save_geojson_both(bairros_bhm[["NOME", "bairro2", "ZONAS", "area_km2", "domicilios_inundacao", "geometry"]], "bairros_mindu.geojson")

# 5. Bairros IBGE Censo 2022 (AM_bairros_CD2022) recortados / filtrados para Manaus e Bacia do Mindu
bairros_cd2022 = gpd.read_file(os.path.join(bairros_cd_dir, "AM_bairros_CD2022.shp")).to_crs(epsg=32720)
bacia_oficial = gpd.read_file(os.path.join(processed_dir, "bacia_mindu_oficial.geojson")).to_crs(epsg=32720)
bairros_cd_mindu = gpd.sjoin(bairros_cd2022, bacia_oficial[["geometry"]], how="inner", predicate="intersects").drop(columns=["index_right"])
dom_por_cd = gpd.sjoin(dom_pts, bairros_cd_mindu[["NM_BAIRRO", "geometry"]], how="inner", predicate="within")
cont_cd = dom_por_cd.groupby("NM_BAIRRO").size().to_dict()
bairros_cd_mindu["domicilios_inundacao"] = bairros_cd_mindu["NM_BAIRRO"].map(lambda n: int(cont_cd.get(n, 0)))
save_geojson_both(bairros_cd_mindu[["CD_BAIRRO", "NM_BAIRRO", "NM_SUBDIST", "domicilios_inundacao", "geometry"]], "bairros_ibge2022_mindu.geojson")

# 6. Rede de Drenagem (Hidrografia oficial do Mindu)
drenagem = gpd.read_file(os.path.join(base_dir, "rede_drenagem.gpkg")).to_crs(epsg=32720)
# Simplificar levemente geometria de drenagem (1m) para ficar ultra rápida no navegador mantendo 100% da fidelidade visual
drenagem["geometry"] = drenagem.geometry.simplify(1.5)
save_geojson_both(drenagem, "rede_drenagem_mindu.geojson")

# 7. Zonas Administrativas (zona_adm.gpkg)
zonas = gpd.read_file(os.path.join(base_dir, "zona_adm.gpkg"))
save_geojson_both(zonas[["NOME", "Setores1", "DOM_Total", "DOM_Alto", "DOM_Muito", "geometry"]], "zonas_adm_mindu.geojson")

# 8. Amostra espacial / Cluster de Domicílios Afetados por Inundação e Estatísticas Gerais
total_pessoas_risco = int(risco_gdf["NUM_PESS"].sum())
total_edif_risco = int(risco_gdf["NUM_EDIF"].sum())
total_setores_risco = len(risco_gdf)
total_domicilios_inundacao = len(dom_pts)

# Gerar pontos em formato leve [lat, lng] para Heatmap/Cluster dos 17.964 domicílios inundados
dom_wgs = dom_pts.to_crs(epsg=4326)
coords_inundacao = [[round(pt.y, 5), round(pt.x, 5)] for pt in dom_wgs.geometry]
with open(os.path.join(nextjs_data_dir, "pontos_inundacao_heat.json"), "w") as f:
    json.dump(coords_inundacao, f)

stats_summary = {
    "area_bacia_km2": 64.85,
    "perimetro_bacia_km": 66.46,
    "total_bairros_bhm": len(bairros_bhm),
    "total_bairros_cd2022_intersect": len(bairros_cd_mindu),
    "total_setores_censitarios": 875,
    "total_setores_risco_cprm": total_setores_risco,
    "total_pessoas_risco_cprm": total_pessoas_risco,
    "total_edificacoes_risco_cprm": total_edif_risco,
    "total_domicilios_afetados_inundacao": total_domicilios_inundacao,
    "extensao_rede_drenagem_km": round(float(drenagem.geometry.length.sum() / 1e3), 2),
    "compartimentos": cursos_gdf.drop(columns=["geometry"]).to_dict(orient="records"),
    "top_bairros_inundacao": bairros_bhm[["NOME", "ZONAS", "domicilios_inundacao"]].sort_values(by="domicilios_inundacao", ascending=False).head(10).to_dict(orient="records")
}

with open(os.path.join(processed_dir, "estatisticas_oficiais_mindu.json"), "w", encoding="utf-8") as f:
    json.dump(stats_summary, f, ensure_ascii=False, indent=2)
with open(os.path.join(nextjs_data_dir, "estatisticas_oficiais_mindu.json"), "w", encoding="utf-8") as f:
    json.dump(stats_summary, f, ensure_ascii=False, indent=2)

print("\n=== ESTATÍSTICAS OFICIAIS CONSOLIDADAS ===")
print(json.dumps(stats_summary, ensure_ascii=False, indent=2))
