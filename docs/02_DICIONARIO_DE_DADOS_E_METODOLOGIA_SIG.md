# 🗺️ Memorial Descritivo Cartográfico, Dicionário de Dados e Metodologia SIG

**Sistema:** PMI - MINDU (Plataforma de Monitoramento Inteligente da Sub-Bacia do Mindu)  
**Autores e Direitos Autorais:** © Adrielly Amaral & Lucas Kzan  

---

## 1. Padronização Geodésica e Cartográfica

O acervo geoespacial original foi recebido em três sistemas de referência distintos (`EPSG:32720`, `EPSG:4674` e `EPSG:4618`). Para garantir **precisão métrica nos cálculos de área/extensão** e **compatibilidade universal na renderização Web**, o pipeline Python (`analysis/04` a `08`) aplica a seguinte regra:

* **Cálculos Planimétricos (Área em $\text{km}^2$, Perímetro e Extensão de Canais em $\text{km}$):** Executados rigorosamente na projeção métrica **UTM Zona 20 Sul (`EPSG:32720` — WGS 84)**.
* **Publicação Web e Interoperabilidade OGC (`GeoJSON`, `KML`, `Shapefile` exportado):** Reprojetados para coordenadas geográficas **WGS 84 (`EPSG:4326`)**.

---

## 2. Dicionário de Camadas Oficiais Integradas

### 2.1. Limite Oficial da Sub-Bacia do Igarapé do Mindu
* **Arquivo Original:** `data/raw/bacia_mindu/Delimitacao_Mindu_sem_buracos.shp`
* **CRS de Origem:** `EPSG:32720` (*WGS 84 / UTM Zone 20S*)
* **Tratamento Topológico:** Remoção de 15 micro-anéis internos espúrios ($\sum = 800,57\text{ m}^2$), preservando 100% do contorno externo do divisor de águas.
* **Área Oficial Calculada:** **$64,85\text{ km}^2$** ($64.845976\text{ km}^2$)
* **Perímetro Oficial Calculado:** **$66,46\text{ km}$**
* **Centroide Geográfico (`EPSG:4326`):** `Lat -3.059891°, Lng -59.967774°`
* **Bounding Box (`EPSG:4326`):** `[-60.028397, -3.114769]` a `[-59.914736, -3.004456]`

### 2.2. Subdivisão Hidrográfica (Alto, Médio e Baixo Curso)
* **Arquivos Originais:** `BHM_Alto_curso.shp`, `BHM_Medio_curso.shp`, `BHM_Baixo_curso.shp` (`EPSG:4674`)
* **Síntese do Cruzamento Espacial (`Spatial Join`):**

| Compartimento Hidrológico | Área Oficial ($\text{km}^2$) | % da Bacia | Setores de Risco SGB/CPRM | Pessoas Expostas (SGB) | Edificações em Risco | Domicílios Afetados por Inundação |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Alto Curso** | $15,14\text{ km}^2$ | $23,3\%$ | $31$ setores | $15.080$ hab. ($51,4\%$) | $3.770$ edif. | $7.886$ dom. ($43,9\%$) |
| **Médio Curso** | $31,48\text{ km}^2$ | $48,6\%$ | $38$ setores | $11.100$ hab. ($37,8\%$) | $2.775$ edif. | $8.166$ dom. ($45,5\%$) |
| **Baixo Curso** | $18,22\text{ km}^2$ | $28,1\%$ | $10$ setores | $3.152$ hab. ($10,8\%$) | $788$ edif. | $1.912$ dom. ($10,6\%$) |
| **TOTAL BACIA** | **$64,85\text{ km}^2$** | **$100\%$** | **$79$ setores** | **$29.332$ hab.** | **$7.333$ edif.** | **$17.964$ dom.** |

### 2.3. Cartografia de Áreas de Risco Geológico e Hidrológico (SGB / CPRM)
* **Arquivo Original:** `BHM_Area_risco.shp` (`79 polígonos`, atualização `2024-06-04`)
* **Atributos Principais:** `NUM_SETOR` (Código SGB), `LOCAL` (Logradouro e Bairro), `TIPOLOGIA` / `TIPOLO_G1` (Processo físico), `GRAU_RISCO` (`Alto` ou `Muito alto`), `GRAU_VULNE`, `NUM_PESS` (Moradores expostos), `NUM_EDIF` (Imóveis), `DESCRICAO` (Laudo técnico de campo) e `SUG_INTERV` (Obras estruturais e não-estruturais recomendadas).
* **Distribuição por Tipologia Principal:**
  * **Enchente:** `8` setores | **$16.204$ pessoas expostas** ($4.051$ edificações)
  * **Deslizamento:** `59` setores | **$9.412$ pessoas expostas** ($2.353$ edificações)
  * **Inundação:** `3` setores | **$2.012$ pessoas expostas** ($503$ edificações)
  * **Alagamento:** `5` setores | **$900$ pessoas expostas** ($225$ edificações)
  * **Erosão / Ravina:** `4` setores | **$804$ pessoas expostas** ($201$ edificações)

### 2.4. Cadastro de Domicílios Afetados por Inundação e Hipsometria
* **Arquivos Originais:** `Dcomicilios_afetados_inundacao.shp` (`17.964 pontos`) + `BHM_Hipsometria.shp` (`119.471 polígonos altimétricos`).
* **Metodologia de Cruzamento Hipsométrico (`analysis/08_Extrair_Cotas_Hipsometria.py`):**
  * Cada um dos `17.964` domicílios e dos `79` setores de risco foi cruzado espacialmente (`gpd.sjoin` com predicado `within`) contra os `119.471` polígonos de altitude (` atributo DN`, variando de $5\text{ m}$ na foz a $115\text{ m}$ nos divisores do Alto Curso).
  * **Estatísticas Altimétricas dos Domicílios Inundados:**
    * Cota Mínima: **$9,0\text{ m}$** | 1º Quartil (25%): **$29,0\text{ m}$** | Mediana (50%): **$36,0\text{ m}$** | Média: **$41,35\text{ m}$** | 3º Quartil (75%): **$53,0\text{ m}$**.

### 2.5. Hidrografia, Bairros e Malha Censitária
* **Rede de Drenagem (`rede_drenagem.gpkg`):** `1.294` segmentos de canais fluviais totalizando **$175,27\text{ km}$** de extensão linear dentro da sub-bacia.
* **Malha de Bairros (`bairros_bhm.gpkg` e `AM_bairros_CD2022.shp`):** `17` bairros no recorte hidrográfico direto e `21` bairros na malha oficial do Censo IBGE 2022 que interceptam a sub-bacia.
* **Setores Censitários (`setores_mindu.gpkg`):** `875` polígonos de setores censitários urbanos do IBGE.

---

## 3. Modelo Matemático de Diagnóstico e Prognóstico Altimétrico

O motor hidrológico em tempo real (`calcular_diagnostico_prognostico` em `backend/api/main.py`) combina o efeito de **remanso hidráulico (repiquete)** provocado pelo Rio Negro com a **onda de cheia superficial (enxurrada)** gerada pela chuva sobre a bacia impermeabilizada:

$$C_{\text{efetiva}} = C_{\text{RioNegro}} + \Delta H_{\text{chuva}}$$

Onde a sobreelevação hidrodinâmica na calha do Mindu ($\Delta H_{\text{chuva}}$) é parametrizada por:

$$\Delta H_{\text{chuva}} = 0,065 \cdot P_{\text{inst}} + 0,018 \cdot P_{24\text{h}}$$

* $C_{\text{RioNegro}}$: Cota fluviométrica atual na Estação `14990000` (Porto de Manaus, em metros);
* $P_{\text{inst}}$: Precipitação instantânea na Bacia do Mindu ($\text{mm/h}$);
* $P_{24\text{h}}$: Precipitação acumulada/prevista em 24 horas ($\text{mm}$).

Todos os domicílios e setores de risco cuja cota altimétrica de terreno ($Z_{\text{terreno}}$ extraída de `BHM_Hipsometria`) satisfazem $Z_{\text{terreno}} \le C_{\text{efetiva}}$ são automaticamente sinalizados como **Atingidos no Cenário Atual/Simulado**.
