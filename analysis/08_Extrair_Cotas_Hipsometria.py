import os
import json
import geopandas as gpd
import pandas as pd

base_dir = r"c:\Users\CINDACTA IV\Desktop\SIGWEB\data\raw\Adrielle_Dados"
processed_dir = r"c:\Users\CINDACTA IV\Desktop\SIGWEB\data\processed"
nextjs_data_dir = r"c:\Users\CINDACTA IV\Desktop\SIGWEB\frontend\sigweb-dashboard\public\data"

print("Carregando BHM_Hipsometria.shp (119.471 polígonos de altitude)...")
hipso = gpd.read_file(os.path.join(base_dir, "BHM_Hipsometria.shp")).to_crs(epsg=32720)

print("Carregando Setores de Risco SGB/CPRM e Domicílios Inundados...")
risco_gdf = gpd.read_file(os.path.join(processed_dir, "areas_risco_cprm.geojson")).to_crs(epsg=32720)
dom_pts = gpd.read_file(os.path.join(base_dir, "Dcomicilios_afetados_inundacao.shp")).to_crs(epsg=32720)

# 1. Cruzar os 17.964 domicílios afetados por inundação com a Hipsometria (DN = cota altimétrica em metros!)
dom_hipso = gpd.sjoin(dom_pts, hipso[["DN", "geometry"]], how="left", predicate="within")
# Remover duplicatas caso um ponto caia na borda
dom_hipso = dom_hipso[~dom_hipso.index.duplicated(keep="first")]
dom_hipso["cota_m"] = dom_hipso["DN"].fillna(28).astype(int)

print("Distribuição altimétrica dos 17.964 domicílios afetados por inundação (em metros):")
print(dom_hipso["cota_m"].describe())

# 2. Cruzar os 79 setores de risco SGB/CPRM (centroide e ponto mínimo) com a Hipsometria
risco_centroids = risco_gdf.copy()
risco_centroids["geometry"] = risco_centroids.geometry.centroid
risco_hipso = gpd.sjoin(risco_centroids, hipso[["DN", "geometry"]], how="left", predicate="within")
risco_hipso = risco_hipso[~risco_hipso.index.duplicated(keep="first")]
risco_gdf["cota_media_m"] = risco_hipso["DN"].fillna(40).astype(int).values

print("\nDistribuição altimétrica dos 79 Setores de Risco SGB/CPRM (em metros):")
print(pd.Series(risco_gdf["cota_media_m"]).describe())

# Atualizar areas_risco_cprm.geojson com a cota altimétrica oficial do terreno (cota_media_m)
risco_wgs = risco_gdf.to_crs(epsg=4326)
risco_wgs.to_file(os.path.join(processed_dir, "areas_risco_cprm.geojson"), driver="GeoJSON")
risco_wgs.to_file(os.path.join(nextjs_data_dir, "areas_risco_cprm.geojson"), driver="GeoJSON")

# Atualizar pontos_inundacao_heat.json para incluir a cota [lat, lng, cota_m]
dom_wgs = dom_hipso.to_crs(epsg=4326)
pts_com_cota = [[round(geom.y, 5), round(geom.x, 5), int(cota)] for geom, cota in zip(dom_wgs.geometry, dom_wgs["cota_m"])]
with open(os.path.join(nextjs_data_dir, "pontos_inundacao_cota.json"), "w") as f:
    json.dump(pts_com_cota, f)

# Salvar curva Hipsométrica (Hipsograma) da Bacia por faixa de altitude para o modelo de Diagnóstico/Prognóstico
hipso["area_m2"] = hipso.geometry.area
curva_hipso = hipso.groupby("DN")["area_m2"].sum().reset_index()
curva_hipso["area_km2"] = round(curva_hipso["area_m2"] / 1e6, 4)

dom_por_cota = dom_hipso.groupby("cota_m").size().to_dict()
curva_hipso["domicilios_na_cota"] = curva_hipso["DN"].map(lambda d: int(dom_por_cota.get(int(d), 0)))
curva_hipso["domicilios_acumulados"] = curva_hipso["domicilios_na_cota"].cumsum()

hipso_summary = {
    "cota_min_m": int(hipso["DN"].min()),
    "cota_max_m": int(hipso["DN"].max()),
    "cota_media_m": round(float(hipso["DN"].mean()), 1),
    "curva_cotas": curva_hipso[["DN", "area_km2", "domicilios_na_cota", "domicilios_acumulados"]].to_dict(orient="records")
}

with open(os.path.join(processed_dir, "hipsometria_curva_mindu.json"), "w", encoding="utf-8") as f:
    json.dump(hipso_summary, f, ensure_ascii=False, indent=2)
with open(os.path.join(nextjs_data_dir, "hipsometria_curva_mindu.json"), "w", encoding="utf-8") as f:
    json.dump(hipso_summary, f, ensure_ascii=False, indent=2)

# Atualizar também o dashboard_analytics.json com a cota_media_m de cada setor
with open(os.path.join(nextjs_data_dir, "dashboard_analytics.json"), "r", encoding="utf-8") as f:
    dash = json.load(f)

cota_by_cod = dict(zip(risco_wgs["NUM_SETOR"], risco_wgs["cota_media_m"]))
for s in dash["setores_risco"]:
    s["cota_m"] = int(cota_by_cod.get(s["cod_setor"], 40))

dash["hipsometria"] = hipso_summary

with open(os.path.join(nextjs_data_dir, "dashboard_analytics.json"), "w", encoding="utf-8") as f:
    json.dump(dash, f, ensure_ascii=False, indent=2)

print("Hipsometria integrada com sucesso aos domicílios e setores de risco!")
