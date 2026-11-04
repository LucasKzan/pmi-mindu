# 📑 Dossiê Técnico Consolidado: Monitoramento Inteligente e Atlas do Racismo Ambiental na Bacia do Mindu (Manaus-AM)

**Projeto:** PMI - MINDU  
**Autores e Direitos Autorais:** © Adrielly Amaral & Lucas Kzan  

---

## 1. Sumário Executivo: A Geografia da Desigualdade Climática em Manaus

A **Sub-Bacia Hidrográfica do Igarapé do Mindu** ($64,85\text{ km}^2$ de área e $175,27\text{ km}$ de rede de drenagem) corta diagonalmente a cidade de Manaus no sentido Nordeste–Sudoeste, atravessando realidades urbanas profundamente desiguais.

Os resultados consolidados pelo geoprocessamento oficial do sistema **PMI - MINDU** comprovam empiricamente que os eventos hidrometeorológicos extremos não atingem a população de maneira homogênea: **91,8% de todos os domicílios afetados por inundação nos principais bairros da bacia concentram-se nas Zonas Norte e Leste (periferias densamente povoadas), enquanto os bairros de alta renda da Zona Centro-Sul absorvem uma fração ínfima do impacto habitacional direto**, embora contribuam fortemente para a impermeabilização do solo no Médio Curso.

---

## 2. Evidências Quantitativas do Cruzamento Espacial (SGB/CPRM + IBGE)

### 2.1. A Disparidade Brutal entre Bairros (Zonas Norte/Leste vs. Centro-Sul)
O cruzamento espacial exato (`Spatial Join`) dos **17.964 domicílios atingidos por inundação** (`Dcomicilios_afetados_inundacao.shp`) contra a malha oficial de bairros (`bairros_bhm.gpkg`) revela a hierarquia socioespacial do risco:

| Posição | Bairro (Bacia do Mindu) | Zona Administrativa | Domicílios Atingidos por Inundação | % do Total da Bacia | Perfil Socioespacial Predominante |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **1º** | **Cidade Nova** | Zona Norte | **$6.440$** | $35,85\%$ | Adensamento popular e margens canalizadas/ocupadas |
| **2º** | **São José Operário** | Zona Leste | **$3.749$** | $20,87\%$ | Periferia consolidada com déficit de macrodrenagem |
| **3º** | **Jorge Teixeira** | Zona Leste | **$2.712$** | $15,10\%$ | Expansão periférica, nascentes degradadas e taludes |
| **4º** | **Coroado** | Zona Leste | **$1.962$** | $10,92\%$ | Ocupação densa de fundos de vale e planície aluvial |
| **5º** | **Tancredo Neves** | Zona Leste | **$1.714$** | $9,54\%$ | Baixadas sujeitas a transbordamento brusco |
| **6º** | **Nossa Senhora das Graças** | Zona Centro-Sul | **$417$** | $2,32\%$ | Transição / Média-Alta renda com pontos de retenção |
| **7º** | **Parque 10 de Novembro** | Zona Centro-Sul | **$370$** | $2,06\%$ | Alta renda, forte impermeabilização e infraestrutura |
| **8º** | **Aleixo** | Zona Centro-Sul | **$346$** | $1,93\%$ | Média-Alta renda, verticalização e condomínios |
| **9º** | **Flores** | Zona Centro-Sul | **$233$** | $1,30\%$ | Eixo comercial/residencial valorizado |
| **10º** | **Zumbi dos Palmares** | Zona Leste | **$16$** | $0,09\%$ | Porção limítrofe de divisor |

> **Conclusão Analítica:** Apenas os **5 bairros periféricos das Zonas Norte e Leste** (`Cidade Nova`, `São José Operário`, `Jorge Teixeira`, `Coroado` e `Tancredo Neves`) somam **$16.577$ domicílios inundados** — o que representa **92,28% de todas as residências atingidas em toda a Bacia do Mindu**. Em contrapartida, os bairros valorizados da Zona Centro-Sul (`Parque 10`, `Aleixo` e `Flores`) somam juntos apenas **$949$ domicílios** ($5,28\%$).

---

### 2.2. Anatomia do Risco nos Três Compartimentos da Bacia

1. **Alto Curso ($15,14\text{ km}^2$ — Nascentes, Jorge Teixeira, Cidade Nova, São José):**
   * **Dupla Penalização:** Concentra simultaneamente **15.080 moradores em áreas de risco SGB/CPRM** ($51,4\%$ de toda a bacia) e **7.886 domicílios inundados**.
   * **Mecanismo Físico:** Cortes subverticais em taludes de alta declividade sem contenção geotécnica (`59` setores de deslizamento) somados a enxurradas rápidas nos tributários de cabeceira.
2. **Médio Curso ($31,48\text{ km}^2$ — Parque 10, Flores, Aleixo, N.S. das Graças, Coroado):**
   * **Geração de Escoamento Superficial:** A intensa impermeabilização histórica (aumento superior a $45\%$ na área urbanizada desde 1985 segundo a Classe 24 do MapBiomas) impede a infiltração da água da chuva, acelerando a onda de cheia que desce em direção à foz.
3. **Baixo Curso ($18,22\text{ km}^2$ — São Raimundo, Glória, Aparecida, Cachoeirinha):**
   * **O Fenômeno do Repiquete (Remanso Hidráulico):** Quando a cota do Rio Negro (Estação ANA `14990000`) ultrapassa a marca de atenção/alerta ($27,50\text{ m}$ a $28,94\text{ m}$), o Rio Negro represa a foz do Igarapé do Mindu. A água poluída que desce do Alto e Médio Curso fica estagnada sob as palafitas e moradias ribeirinhas situadas entre as cotas $9\text{ m}$ e $30\text{ m}$, gerando exposição prolongada a patógenos de veiculação hídrica (**Leptospirose, Hepatite A, Dengue e Doenças Diarreicas Agudas**).

---

## 3. Recomendações de Políticas Públicas e Justiça Climática

1. **Priorização Orçamentária Baseada em Evidência:** Direcionar recursos de contenção de encostas e drenagem sustentável prioritariamente para os **11 setores classificados como Risco Muito Alto (`GRAU_RISCO = Muito alto`)** pelo SGB/CPRM no Alto e Médio Curso (`1.832` moradores em risco iminente de morte por soterramento/enchente).
2. **Protocolo de Alerta Precoce Comunitário:** Utilizar o motor hidrometeorológico do **PMI - MINDU** integrado à Ciência Cidadã para disparar alertas preventivos sempre que a precipitação prevista em 6h superar $20\text{ mm}$ ou a cota efetiva atingir $28,0\text{ m}$.
3. **Infraestrutura Verde no Médio Curso:** Exigir compensação de drenagem (jardins de chuva, bacias de detenção e permeabilidade mínima) nos empreendimentos imobiliários do Médio Curso (`Parque 10`, `Flores`, `Aleixo`) para amortecer a onda de cheia que atinge as populações vulneráveis a jusante.

---

## 4. Série Multitemporal de Supressão Vegetal e Solo Exposto (1990–2022) e Déficit de Saneamento

Conforme o *Estudo Técnico — Diretrizes para Termo de Referência do Projeto Viva Mindu (Fratec Engenharia / SEMMASCLIMA / ICLEI / UEA, 2024, p. 49–55)*, fundamentado em levantamentos de sensoriamento remoto (**Landsat 5**, **Landsat 9** e **Copernicus DEM** em **SIRGAS 2000 / EPSG:4674**) conduzidos por **SEMMAS (2019)**, **Vidal (2022)** e **Vilhena (UFAM, 2023)**, **81% da vegetação densa da Bacia do Mindu foi desmatada ao longo de quatro décadas**:

| Década Analisada | Vegetação Densa (Gráfico 01) | Vegetação Esparsa (Gráfico 02) | Solo Exposto / Antropizado (Gráfico 03) | Dinâmica Territorial Observada |
| :---: | :---: | :---: | :---: | :--- |
| **1990** | **$37\%$** | $16\%$ | $19\%$ | Maior integridade da mata ciliar (pré-adensamento da Zona Leste) |
| **2000** | **$26\%$** | $36\%$ | $14\%$ | Fragmentação intensa por loteamentos e conjuntos no Médio Curso |
| **2010** | **$18\%$** | $29\%$ | **$38\%$** | Pico crítico de exposição do solo e antropização nas duas margens |
| **2022** | **$19\%$** | $19\%$ | **$29\%$** | Consolidação da impermeabilização urbana ($81\%$ da mata densa perdida) |

### 4.1. Indicadores Auditados de Saneamento Básico na Bacia (p. 14–18)
* **Coleta Formal de Esgoto:** Apenas **20% das residências** da Bacia do Mindu têm acesso à rede coletora formalizada (*meta do Programa Trata Bem Manaus: 45%*). O restante recorre a fossas rudimentares ou lançamento *in natura* nos cursos d'água.
* **Subdimensionamento das ETEs:** A **ETE Timbiras** (no bairro Cidade Nova) opera tratando apenas cerca de **50% do volume de esgoto coletado na área** (Prefeitura de Manaus, 2021).
* **Abastecimento de Água e Perdas:** A capacidade combinada da **ETA Ponta das Lajes** ($7.200\text{ m}^3/\text{h}$) e do **PROAMA** ($5.500\text{ m}^3/\text{h}$) soma **$12.700\text{ m}^3/\text{h}$**, atendendo de forma contínua **70% dos domicílios**, enquanto **20% a 30%** das residências em áreas de ocupação irregular enfrentam intermitência/escassez (IBGE, 2021), agravada por um índice de **perdas na rede de distribuição de até 50%** (Souza et al., 2020).

---

## 5. Mosaico de Áreas Protegidas e Arcabouço Jurídico-Institucional

* **Lei Federal nº 9.433/1997:** Política Nacional de Recursos Hídricos (define a bacia hidrográfica como unidade territorial de gestão — art. 1º, V).
* **Lei Federal nº 9.985/2000 (SNUC):** Sistema Nacional de Unidades de Conservação e definição legal de Corredores Ecológicos (art. 2º, XIX).
* **Lei Federal nº 12.651/2012:** Código Florestal Brasileiro (delimitação de APPs hídricas e urbanas).
* **Lei Municipal nº 605/2001:** Código Ambiental de Manaus (define APPs municipais e tipifica a supressão vegetal e poluição em APP como infrações gravíssimas).
* **Lei Complementar Municipal nº 002/2014:** Plano Diretor Urbano e Ambiental de Manaus (art. 67 sobre Corredores Ecológicos Urbanos).
* **Decreto Municipal nº 8.351/2006:** Institui o **Parque Municipal Nascentes do Mindu** ($16,2\text{ hectares}$, Unidade de Proteção Integral entre Cidade de Deus e Jorge Teixeira).
* **Decreto Municipal nº 9.329/2007:** Institui o **Corredor Ecológico Urbano do Igarapé do Mindu (CEUM)** ($10\text{ km}$ de extensão, largura de $100\text{ m}$ a $500\text{ m}$, área total de **$1.200\text{ hectares}$**).
* **Decreto Municipal nº 4.094/2018:** Institui a **Área de Proteção Ambiental (APA) Sauim-de-Manaus** (**$1.015\text{ hectares}$**, interligando Parque 10, Novo Aleixo, Cidade Nova e Cidade de Deus até a Reserva Florestal Adolpho Ducke).
* **Lei Municipal nº 219/1993 & Lei Estadual nº 41/1963:** Criam o **Parque Municipal do Mindu** e a **Reserva Florestal Adolpho Ducke (INPA)**.
* **Decreto Municipal nº 5.554/2023:** Institui o **Comitê Municipal de Mudanças Climáticas de Manaus**.

---

## 6. Referências Bibliográficas e Fontes Oficiais

1. **AGÊNCIA NACIONAL DE ÁGUAS E SANEAMENTO BÁSICO (ANA).** *Relatório de Conjuntura dos Recursos Hídricos no Brasil / Hidrotelemetria Estação 14990000*. Brasília, 2022–2024.
2. **ÁGUAS DE MANAUS / PROAMA.** *Relatório de Progresso e Impacto Ambiental / Relatório Técnico PROAMA*. Manaus, 2022.
3. **BARROS, Hellyzabeth da Silva.** *A segregação socioespacial em Manaus/AM: o urbano para poucos*. Monografia (Geografia) — Universidade do Estado do Amazonas (UEA), Manaus, 2022.
4. **CASSIANO, K. R. M.** *Análise Geográfica de Áreas de Risco na Bacia Hidrográfica do Igarapé do Mindu – Manaus (AM)*. Dissertação (Mestrado em Geografia) — UFSC, Florianópolis, 2013.
5. **FRATEC ENGENHARIA / SEMMASCLIMA / ICLEI / UEA.** *Projeto Viva Mindu — Estudo Técnico: Diretrizes para Termo de Referência*. Manaus-AM, 15 jul. 2024. 94 p.
6. **INSTITUTO BRASILEIRO DE GEOGRAFIA E ESTATÍSTICA (IBGE).** *Censo Demográfico 2022 (Malha de Setores Censitários e Bairros)* e *Estudos de Impacto Ambiental: Bacia Hidrográfica do Mindu (2021)*. Rio de Janeiro: IBGE.
7. **MACENA.** *Dinâmica Socioambiental do Igarapé do Mindu em Manaus*. Manaus, 2016.
8. **MENDONÇA, R. S.** *Políticas Públicas e a Gestão de Riscos Ambientais em Manaus*. Tese (Doutorado) — Universidade Federal do Amazonas (UFAM), Manaus, 2018.
9. **RODRIGUES, S. C.; SILVA, V. P.** *Impactos da urbanização sobre o igarapé do Mindu em Manaus*. 1. ed. Manaus: Editora Valer, 2015.
10. **SANTOS, Milton.** *A Natureza do Espaço: Técnica e Tempo, Razão e Emoção*. São Paulo: Hucitec, 1977.
11. **SCHERER, A. M.** *O Igarapé do Mindu e os desafios ambientais de Manaus*. Dissertação (Mestrado) — UFAM, Manaus, 2014.
12. **SERVIÇO GEOLÓGICO DO BRASIL (SGB / CPRM).** *Setorização de Áreas em Alto e Muito Alto Risco a Movimentos de Massa, Enchentes e Inundações — Manaus/AM*. 2024.
13. **SOUZA, R. S. et al.** *Esgotamento Sanitário e Qualidade da Água na Bacia do Mindu, Manaus: Desafios e Soluções*. Revista Brasileira de Recursos Hídricos, 2020.
14. **VIDAL, B. / SEMMAS.** *Mapeamento de Índice de Vegetação por Diferença Normalizada (NDVI) e Solo Exposto da Bacia Hidrográfica do Mindu (1990–2022)*. Manaus: SEMMAS, 2022.
15. **VILHENA, F. da S.** *Análise da Degradação Ambiental na Área de Proteção Permanente (APP) da Sub-Bacia do Mindu no Contexto de Gestão dos Recursos Hídricos — Manaus (AM)*. Dissertação (Mestrado em Geografia) — UFAM, 2023.
