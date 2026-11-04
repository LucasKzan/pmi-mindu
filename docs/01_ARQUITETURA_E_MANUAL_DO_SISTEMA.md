# 📘 Documentação Técnica, Arquitetura e Manual de Operação — PMI - MINDU

**Sistema:** Plataforma de Monitoramento Inteligente e Infraestrutura de Dados Espaciais da Sub-Bacia do Igarapé do Mindu (`SIGWEB / PMI - MINDU`)  
**Município / UF:** Manaus — Amazonas, Brasil  
**Autores e Direitos Autorais:** © Adrielly Amaral & Lucas Kzan  

---

## 1. Visão Geral da Arquitetura do Sistema

O **SIGWEB / PMI - MINDU** é uma plataforma híbrida composta por um **Centro de Situação Hidrológica em Tempo Real**, um **Observatório Socioambiental Cartográfico**, um **Motor de Broadcast Comunitário no Telegram** e uma **Infraestrutura de Dados Espaciais (IDE / Data Hub)** com conversão multi-formato em memória (*On-the-Fly*).

### 1.1. Arquitetura de Dupla Visão (Sociedade vs. Administração)
Para garantir usabilidade limpa ao cidadão e rigor de auditoria à Defesa Civil e pesquisadores, o frontend opera em duas rotas independentes:
1. **Visão Pública da Sociedade (`http://localhost:3000/`):**
   * **Interface Map-First (100% Mapa Livre):** Barra superior executiva unificada (`Instrument Cluster` de telemetria + botões padronizados com ícones vetoriais SVG), 4 KPIs clicáveis e mapa interativo ocupando toda a área útil.
   * **Dock Lateral Vetorial SVG & Gavetas Sob Demanda:** Menu vertical esquerdo com botões quadrados fixos (`44x44px`), *tooltips* flutuantes e abertura de gaveta lateral direita sob demanda (quando a gaveta abre, os controles do mapa e a legenda se deslocam automaticamente via `DRAWER_STATE` para nunca haver sobreposição).
   * **Apenas Focos Validados:** Exibe exclusivamente os relatos comunitários e focos oficiais com status `APROVADO` (pinos vermelhos).
2. **Sala de Curadoria & Comando ADM (`http://localhost:3000/adm` — Senha: `123`):**
   * **Ambiente Restrito de Gestão:** Autenticação em tela cheia para administradores, pesquisadores e Defesa Civil.
   * **Mapa de Auditoria (`/mapa_oficial.html?modo=adm`):** Exibe simultaneamente os relatos aguardando triagem (`PENDENTE` — pinos amarelos) e os relatos homologados (`APROVADO` — pinos vermelhos), confrontando-os com as manchas do SGB/CPRM e a hipsometria.
   * **4 Módulos Operacionais ADM:**
     1. *Fila de Moderação (`📋`):* Aprovação/rejeição individual ou aprovação em lote de relatos com *Score de Alta Confiabilidade Geoespacial*;
     2. *Lançamento Direto de Foco Oficial (`➕`):* Publicação imediata de ocorrências da Defesa Civil sem passar por fila;
     3. *Motor de Broadcast no Telegram (`✈️`):* Configuração do Bot e disparo automático ou manual de alertas e boletins;
     4. *Gerenciador do Banco SQLite (`🗄️`):* Exportação de auditoria em `.CSV` e `.GeoJSON` (QGIS) e limpeza de lotes.

### 1.2. Camadas Tecnológicas
1. **Frontend (Painel Interativo & Backoffice ADM):**
   * **Framework:** Next.js 16.4.3 (React 19) + Tailwind CSS v4 + Ícones Vetoriais SVG (`icon.svg` customizado).
   * **Motor Cartográfico:** Leaflet.js + Leaflet.heat (`mapa_oficial.html`) com escala métrica cartográfica (`km/m`), indicador de Norte (`N▲`), legenda retrátil e camadas *Mapa Viário (Esri)* e *Satélite (Esri World Imagery)*.
2. **Backend (API REST, Motor Hidrológico, Telegram Broadcast & Conversor Geoespacial):**
   * **Framework:** FastAPI (Python 3.12) + Uvicorn + SQLAlchemy.
   * **Motor Geoespacial:** `GeoPandas`, `Shapely`, `PyProj`, `PyOGRIO` (processamento vetorial em memória RAM).
3. **Persistência e Acervo Geoespacial:**
   * **Banco Relacional Local (`sigweb_teste.db`):** Tabelas `relatos_comunidade`, `config_telegram`, `destinos_telegram` e `historico_disparos_telegram`.
   * **Acervo Processado (`data/processed/` e `public/data/`):** Camadas padronizadas em `WGS84 (EPSG:4326)` e cubos analíticos JSON.

---

## 2. Motor de Broadcast e Alertas no Telegram (Zero Cadastro para o Morador)

Para eliminar a burocracia de cadastro de números de telefone e garantir conformidade com a LGPD, o sistema implementa um **Motor de Broadcast Oficial via Telegram Bot API**:

* **Bot Oficial Configurado:** `@sigweb_mindu_bot` (`SIGWEB Mindu`)
* **Canal Público de Alertas:** `@alertasigweb` (`https://t.me/alertasigweb`)
* **Ingresso por QR Code (1 Clique):** Na Visão Pública (`/`), o botão **`Canal Telegram`** exibe um **QR Code dinâmico** e link direto para `https://t.me/alertasigweb`, além do feed ao vivo dos últimos alertas transmitidos.
* **Descoberta Automática de Inscritos e Canais (`sincronizar_assinantes_telegram`):** O backend consulta `getUpdates` automaticamente, registra novos inscritos/grupos/canais na tabela `destinos_telegram` e envia mensagem institucional de boas-vindas.
* **Disparo Automático com Pino de GPS (`sendMessage` + `sendLocation`):**
  1. Ao **Aprovar um Relato Comunitário** na fila do `/adm`;
  2. Ao **Aprovar em Lote** relatos de Alta Confiabilidade;
  3. Ao publicar um **Foco Oficial da Defesa Civil**;
  4. Ao acionar o botão **`📡 Disparar Boletim Hidrológico (ANA + INMET)`** ou enviar um **Alerta Personalizado** no `/adm`;
  5. Ao **Encerrar um Alagamento** (aviso de normalização, sem pino GPS).
* **Modelo de Mensagem Editável:** Na aba `Telegram` do `/adm`, o card **`📝 Modelo da Mensagem Automática de Alerta`** permite editar o texto enviado ao aprovar/publicar um alerta, com HTML do Telegram (`<b>`, `<i>`, `<code>`) e variáveis `{bairro}`, `{nivel_agua}`, `{descricao}`, `{lat}`, `{lng}`, `{score}`. Possui **prévia ao vivo** (dados de exemplo) e botão **Restaurar Padrão**. O modelo fica na coluna `config_telegram.template_alerta`. Os boletins em lote e o aviso de encerramento usam texto fixo.
* **Configurações Técnicas Recolhidas:** Token, Chat ID e link do canal ficam ocultos atrás da barra `⚙️ Configurações Técnicas do Bot e Canal`, abrindo só sob demanda.
* **Relatos com Foto pelo Telegram:** O morador envia uma **foto** (a legenda vira a descrição) ao `@sigweb_mindu_bot` e depois sua **localização** (📎 → Localização). Um *poller* em segundo plano (`_tg_poll_loop`, a cada ~4 s, `getUpdates` com `offset`) baixa a foto (`getFile`) para `backend/uploads/` (servida em `/uploads/...`), detecta o bairro por *point-in-polygon* em `bairros_mindu.geojson` e cria o relato como `PENDENTE` com Score de Veracidade. A foto aparece na fila de moderação e no popup do mapa. Só localização = relato sem foto. A foto pendente expira em 15 min.

### 2.1. Ciclo de Vida de um Relato

`PENDENTE` → `APROVADO` (pino público + alerta no Telegram) → `ENCERRADO` (pino removido do mapa + aviso de normalização). Também pode ser `REJEITADO` ou excluído. O `/adm` possui a aba **`📈 Histórico`** (7/30/90 dias): relatos por dia, ranking de bairros, totais por status, disparos no Telegram e exportação CSV/GeoJSON.

---

## 3. Catálogo Completo de Endpoints da API (`FastAPI`)

| Método | Rota (Endpoint) | Descrição Técnica | Parâmetros / Autenticação |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/hidrologia/tempo-real` | Consulta telemetria da ANA + Open-Meteo Manaus e executa o modelo de Diagnóstico Atual, Previsão (72h) e Prognóstico Altimétrico. | `simular_cota_m`, `simular_chuva_mm_h` |
| `GET` | `/api/hub/preview` | Retorna metadados, CRS, contagem de feições e amostra tabular de qualquer dataset do Data Hub antes do download. | `dataset`, `curso`, `bairro`, `grau_risco`, `tipologia`, `cota_max_m`, `dias_historico` |
| `GET` | `/api/hub/download` | Converte em memória RAM qualquer dataset e entrega nos formatos `.CSV`, `.GeoJSON`, `.SHP (.zip)`, `.GPKG` ou `.KML`. | Filtros acima + `formato` |
| `POST` | `/api/webhook/relato` | Recebe relatos georreferenciados, calcula o *Score de Veracidade Geoespacial (IA/SIG)* cruzando com o SGB/CPRM e, se for inserção direta ADM, publica e dispara no Telegram. | `RelatoComunidadePayload` |
| `GET` | `/api/mapa/relatos` | Retorna os relatos estruturados como `FeatureCollection` GeoJSON (`incluir_pendentes=false` na visão pública; `true` no `/adm`). | `incluir_pendentes` |
| `GET` | `/api/adm/relatos` | Lista completa de relatos (`PENDENTE`, `APROVADO`, `REJEITADO`, `ENCERRADO`), com `foto`, para auditoria no `/adm`. | Uso na Sala de Curadoria |
| `GET` | `/api/adm/historico` | Série histórica: relatos por dia, top 10 bairros, totais por status e disparos Telegram no período. | `dias` (1–365) |
| `GET` | `/uploads/{arquivo}` | Serve as fotos de relatos recebidas pelo Telegram. | — |
| `PATCH` | `/api/adm/relatos/{id}` | Aprova, rejeita, **encerra** ou exclui um relato. Ao aprovar, dispara alerta + pino GPS; ao encerrar, avisa o canal e remove o pino do mapa. | `acao` (`APROVADO`/`REJEITADO`/`ENCERRADO`/`EXCLUIR`), `senha_adm="123"` |
| `POST` | `/api/adm/aprovar-lote-alta` | Aprova em lote todos os relatos pendentes classificados com Alta Confiabilidade e transmite resumo no Telegram. | `senha_adm="123"` |
| `GET` | `/api/adm/exportar-relatos` | Exporta a base auditada de relatos comunitários em `.CSV` ou `.GeoJSON`. | `formato`, `apenas_aprovados` |
| `DELETE` | `/api/webhook/relatos` | Limpa apenas relatos pendentes ou zera todos os focos comunitários do banco SQLite. | `senha_adm="123"`, `apenas_pendentes` |
| `GET` | `/api/telegram/status` | Sincroniza inscritos via `getUpdates` e retorna status do Bot, link do canal (`https://t.me/alertasigweb`) e histórico dos últimos 15 disparos. | `incluir_token_adm`, `senha_adm` |
| `POST` | `/api/adm/telegram/config` | Atualiza `bot_token`, `chat_id`, `link_canal`, `auto_disparo` e `template_alerta` no banco SQLite. | `ConfigTelegramPayload` (`senha_adm="123"`) |
| `GET` | `/api/adm/telegram/descobrir-chats` | Consulta `getUpdates` na API do Telegram para detectar automaticamente canais e grupos vinculados ao Bot. | `bot_token`, `senha_adm="123"` |
| `POST` | `/api/adm/telegram/disparar-boletim` | Dispara imediatamente no Canal Telegram o Boletim Hidrológico em Tempo Real (ANA + INMET) ou Comunicado Personalizado da Defesa Civil. | `DisparoManualTelegramPayload` (`senha_adm="123"`) |

---

## 4. Conectores Externos e Bases Científicas Auditadas

1. **Hidrotelemetria ANA (`Estação 14990000 - Porto de Manaus / Rio Negro`):** Nível fluviométrico em tempo real e limiares de Alerta (`27,50m`) e Inundação Severa (`29,00m`).
2. **Meteorologia e Previsão Hidrometeorológica (`API Open-Meteo / INMET`):** Temperatura, umidade, chuva instantânea (`mm/h`), previsão `6h/24h/72h` e série retrospectiva (`15` a `90` dias).
3. **Vigilância Epidemiológica (`API InfoDengue Fiocruz / DATASUS — Geocódigo 1302603`):** Série semanal de arboviroses, *Nowcasting*, $R_t$ e nível de alerta em Manaus.
4. **Infraestrutura Crítica Exposta (`API Overpass / OpenStreetMap`):** Escolas, UBSs e Hospitais na Bacia do Mindu.
5. **Série Multitemporal de Desmatamento NDVI (1990–2022) e Saneamento Básico (*Estudo Técnico Projeto Viva Mindu, 2024*):**
   * Dados oficiais validados (*SEMMAS, 2019; Vidal, 2022; Vilhena, UFAM 2023*) comprovando a supressão de **81% da vegetação densa** da bacia entre 1990 (`37%`) e 2022 (`19%`) e pico de solo exposto (`38%` em 2010; `29%` em 2022).
   * Indicadores auditados de saneamento (*IBGE, 2021; Águas de Manaus/PROAMA, 2022*): apenas **20% de coleta formal de esgoto**, **50% de eficiência da ETE Timbiras**, **70% de abastecimento contínuo de água** e até **50% de perdas na rede**.

---

## 5. Como Executar o Sistema Localmente

**Atalho (recomendado):** dê duplo clique em `iniciar.bat` (sobe backend e frontend e abre o navegador) e use `parar.bat` para encerrar tudo.

**Manual:**

1. **Iniciar o Servidor Backend (API Python na porta `8000`):**
   ```powershell
   cd "C:\Users\CINDACTA IV\Desktop\SIGWEB"
   python backend/api/main.py
   ```
2. **Iniciar o Servidor Frontend (Painel Next.js na porta `3000`):**
   ```powershell
   cd "C:\Users\CINDACTA IV\Desktop\SIGWEB\frontend\sigweb-dashboard"
   npm run dev
   ```
3. **Acessar no Navegador:**
   * **Visão Pública da Sociedade:** `http://localhost:3000/`
   * **Sala de Curadoria e Comando ADM:** `http://localhost:3000/adm` *(Senha: `123`)*
   * **Documentação Interativa da API (Swagger):** `http://localhost:8000/docs`
