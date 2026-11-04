import os
import shutil
import json
import geopandas as gpd

# Caminhos de origem e destino (100% dentro do projeto SIGWEB)
raw_dir = r"c:\Users\CINDACTA IV\Desktop\SIGWEB\data\raw\bacia_mindu"
processed_dir = r"c:\Users\CINDACTA IV\Desktop\SIGWEB\data\processed"
prototype_dir = r"c:\Users\CINDACTA IV\Desktop\SIGWEB\frontend\prototype"
nextjs_public_dir = r"c:\Users\CINDACTA IV\Desktop\SIGWEB\frontend\sigweb-dashboard\public\data"

os.makedirs(raw_dir, exist_ok=True)
os.makedirs(processed_dir, exist_ok=True)
os.makedirs(nextjs_public_dir, exist_ok=True)

shp_path = os.path.join(raw_dir, "Delimitacao_Mindu_sem_buracos.shp")
print(f"Lendo Shapefile: {shp_path}")

# 2. Carregar o Shapefile com GeoPandas
gdf = gpd.read_file(shp_path)
print("CRS Original:", gdf.crs)
print("Colunas:", gdf.columns.tolist())
print("Número de feições:", len(gdf))
print(gdf.head())

# Calcular área em km2 no CRS original (UTM 20S - metros)
area_km2 = gdf.geometry.area.sum() / 1e6
perimetro_km = gdf.geometry.length.sum() / 1e3
print(f"Área calculada (UTM 20S): {area_km2:.4f} km²")
print(f"Perímetro calculado: {perimetro_km:.4f} km")

# 3. Reprojetar para WGS84 (EPSG:4326) para uso na Web (Leaflet / Mapbox / PostGIS)
gdf_wgs84 = gdf.to_crs(epsg=4326)
bounds = gdf_wgs84.total_bounds  # [minx, miny, maxx, maxy]
centroid = gdf_wgs84.geometry.union_all().centroid
print(f"Bounding Box (WGS84): {bounds}")
print(f"Centroide (Lat, Lng): [{centroid.y:.6f}, {centroid.x:.6f}]")

# Adicionar propriedades padronizadas ao GeoDataFrame
gdf_wgs84["nome"] = "Limite Oficial da Sub-Bacia do Mindu"
gdf_wgs84["tipo"] = "bacia"
gdf_wgs84["area_km2"] = round(float(area_km2), 2)
gdf_wgs84["perimetro_km"] = round(float(perimetro_km), 2)
gdf_wgs84["epsg_origem"] = "EPSG:32720 (WGS 84 / UTM zone 20S)"

# 4. Exportar GeoJSON oficial para data/processed e para o Next.js public/data
geojson_out_processed = os.path.join(processed_dir, "bacia_mindu_oficial.geojson")
geojson_out_nextjs = os.path.join(nextjs_public_dir, "bacia_mindu_oficial.geojson")

gdf_wgs84.to_file(geojson_out_processed, driver="GeoJSON")
gdf_wgs84.to_file(geojson_out_nextjs, driver="GeoJSON")
print(f"GeoJSON salvo em: {geojson_out_processed}")
print(f"GeoJSON salvo em: {geojson_out_nextjs}")

# 5. Atualizar também o mindu_basemap.js do protótipo HTML com o polígono oficial real!
geojson_dict = json.loads(gdf_wgs84.to_json())

basemap_js_path = os.path.join(prototype_dir, "mindu_basemap.js")
with open(basemap_js_path, "w", encoding="utf-8") as f:
    f.write("// Geometria Oficial da Sub-Bacia do Igarapé do Mindu (Convertido de EPSG:32720 para EPSG:4326)\n")
    f.write(f"const baciaMinduGeoJSON = {json.dumps(geojson_dict, ensure_ascii=False, indent=2)};\n")

print(f"Arquivo do protótipo atualizado com sucesso: {basemap_js_path}")
