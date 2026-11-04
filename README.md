# 🌍 SIGWEB / PMI - MINDU: Plataforma de Monitoramento Hidrológico e IDE da Sub-Bacia do Igarapé do Mindu

> **Observatório Socioambiental, Centro de Situação Hidrológica em Tempo Real, Broadcast Oficial no Telegram (`@alertasigweb`) e Infraestrutura de Dados Espaciais (Data Hub) em Manaus-AM.**

**Autores e Direitos Autorais:** © **Adrielly Amaral & Lucas Kzan**

---

## 📌 Resumo do Projeto

O **SIGWEB / PMI - MINDU** é um ecossistema computacional e científico desenvolvido para monitorar em tempo real os eventos hidrometeorológicos na **Sub-Bacia do Igarapé do Mindu ($64,85\text{ km}^2$)** em Manaus-AM, diagnosticar e prognosticar impactos altimétricos sobre a população, operar um fluxo completo de **Ciência Cidadã com Curadoria ADM (`/adm`)**, disparar alertas automáticos com localização GPS no **Telegram (`https://t.me/alertasigweb`)** e disponibilizar um **Hub de Dados Abertos Multi-Formato** (`.CSV`, `.GeoJSON`, `.SHP.zip`, `.GPKG`, `.KML`).

### Principais Indicadores Consolidados e Auditados no Sistema
* **Área Oficial da Sub-Bacia:** $64,85\text{ km}^2$ (Perímetro: $66,46\text{ km}$)
* **Rede de Drenagem Mapeada:** $175,27\text{ km}$ ($1.294$ trechos fluviais)
* **Áreas de Risco Oficial (SGB/CPRM):** $79$ polígonos ($29.332$ moradores expostos e $7.333$ edificações)
* **Domicílios Atingidos por Inundação:** $17.964$ imóveis georreferenciados e cruzados com $119.471$ polígonos hipsométricos ($5\text{ m}$ a $115\text{ m}$), onde $92,28\%$ se concentram em $5$ bairros periféricos das Zonas Norte e Leste
* **Supressão Vegetal Histórica (NDVI 1990–2022):** Perda de **$81\%$ da vegetação densa** original da bacia (*SEMMAS, 2019; Vidal, 2022; Vilhena, UFAM 2023*)
* **Déficit de Saneamento Básico (*Projeto Viva Mindu, 2024*):** Apenas **$20\%$** de coleta formal de esgoto e **$50\%$** de eficiência de tratamento na ETE Timbiras (*IBGE, 2021; Águas de Manaus/PROAMA, 2022*)
* **Broadcast Oficial no Telegram (Zero Cadastro):** Bot `@sigweb_mindu_bot` integrado ao canal público **`@alertasigweb`** com ingresso instantâneo por **QR Code**

---

## 🖥️ Duas Visões Independentes do Sistema

| Ambiente | Rota / URL | Público-Alvo & Funcionalidades |
| :--- | :--- | :--- |
| **Visão Pública da Sociedade** | `http://localhost:3000/` | Interface *Map-First* com 100% ícones vetoriais SVG, barra unificada de telemetria, 4 KPIs clicáveis, dock lateral esquerdo com gavetas sob demanda (Simulador, Prognóstico 72h, Gráficos NDVI/Saneamento, Laudos SGB, Data Hub, Reportar Alagamento e QR Code do Canal Telegram `@alertasigweb`) e emissão de Boletim Oficial em PDF. |
| **Sala de Curadoria & Comando ADM** | `http://localhost:3000/adm` | Ambiente restrito (Senha: `123`) com Mapa de Auditoria (Pinos Amarelos = Pendentes; Pinos Vermelhos = Aprovados), Fila de Moderação com *Score de Veracidade IA/SIG*, Publicação Direta da Defesa Civil, Painel de Broadcast Telegram (`@sigweb_mindu_bot` $\rightarrow$ `@alertasigweb`) e Gerenciador/Exportador do Banco SQLite. |

---

## 📚 Documentação Oficial (Pasta `docs/`)

1. [**01_ARQUITETURA_E_MANUAL_DO_SISTEMA.md**](docs/01_ARQUITETURA_E_MANUAL_DO_SISTEMA.md) — Arquitetura de dupla visão (`/` e `/adm`), integração com a API Oficial do Telegram (`@sigweb_mindu_bot`), catálogo completo de endpoints REST e manual de operação.
2. [**02_DICIONARIO_DE_DADOS_E_METODOLOGIA_SIG.md**](docs/02_DICIONARIO_DE_DADOS_E_METODOLOGIA_SIG.md) — Memorial descritivo cartográfico, sistemas de projeção (`EPSG:32720` / `EPSG:4326`), dicionário de camadas e equação de Diagnóstico/Prognóstico Altimétrico.
3. [**03_DOSSIE_TECNICO_RACISMO_AMBIENTAL.md**](docs/03_DOSSIE_TECNICO_RACISMO_AMBIENTAL.md) — Dossiê analítico consolidado com o ranking de desigualdade entre bairros (Zonas Norte/Leste vs. Centro-Sul), série multitemporal NDVI (1990–2022), saneamento básico, unidades de conservação e referências científicas.

---

## 🆕 Novidades Recentes

* **Modelo de mensagem editável** do alerta do Telegram, com prévia ao vivo e variáveis (`{bairro}`, `{nivel_agua}`, `{descricao}`, `{lat}`, `{lng}`, `{score}`).
* **Relatos com foto pelo Telegram:** foto + localização enviadas ao `@sigweb_mindu_bot` entram na fila de moderação.
* **Encerrar alagamento:** remove o pino do mapa e avisa o canal.
* **Aba Histórico** no `/adm` (relatos por dia/bairro, exportação CSV/GeoJSON).
* **`iniciar.bat` / `parar.bat`** para subir e derrubar os serviços.

---

## 🚀 Como Iniciar Rápido

**Atalho:** duplo clique em `iniciar.bat` (sobe tudo e abre o navegador); `parar.bat` encerra os serviços.

Ou manualmente:

1. **Backend (API FastAPI na porta `8000`):**
   ```powershell
   python backend/api/main.py
   ```
2. **Frontend (Painel Next.js na porta `3000`):**
   ```powershell
   cd frontend/sigweb-dashboard
   npm run dev
   ```
3. Abra **`http://localhost:3000`** (Visão da Sociedade) ou **`http://localhost:3000/adm`** (Sala de Curadoria ADM). *(Para abrir o Memorial Descritivo dentro do sistema, clique em `§ v1.0` na pílula inferior esquerda do mapa).*
