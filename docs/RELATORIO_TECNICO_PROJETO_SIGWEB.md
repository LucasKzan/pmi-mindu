# Relatório Executivo e Técnico de Desenvolvimento: Plataforma SIGWEB / PMI - MINDU

**Projeto:** Sistema de Informações Geográficas e Monitoramento Hidrológico em Tempo Real da Sub-Bacia do Igarapé do Mindu (Manaus/AM)  
**Destinatário:** Orientador do Projeto / Banca de Avaliação Acadêmica  
**Autores:** Adrielly Amaral & Lucas Kzan  
**Data:** 02 de Novembro de 2026  
**Status do Projeto:** Protótipo Funcional Validado em Ambiente Local (Pronto para Pré-Homologação)

---

## 1. Sumário Executivo

O **SIGWEB / PMI - MINDU** é uma plataforma computacional híbrida que integra **Geoprocessamento (GIS)**, **Telemetria Hidrometeorológica em Tempo Real**, **Ciência Cidadã Assistida por Inteligência Geoespacial** e **Broadcast Comunitário via Telegram**. 

O sistema foi concebido para mitigar os riscos de inundações graduais e enxurradas bruscas na **Sub-Bacia Hidrográfica do Igarapé do Mindu (64,85 km²)**, área densamente povoada de Manaus-AM que abriga centenas de pontos críticos de vulnerabilidade socioambiental.

A plataforma opera sob o paradigma de **Dupla Visão**:
1. **Visão Pública da Sociedade (`/`):** Interface focada no cidadão (*Map-First*), clara, responsiva e acessível, voltada ao consumo de dados em tempo real, emissão de boletins e reporte de ocorrências.
2. **Sala de Comando e Curadoria ADM (`/adm`):** Ambiente restrito voltado à Defesa Civil e pesquisadores para moderação de dados de campo, auditoria espacial cruzada, gerenciamento de banco e disparo de alertas institucionais.

---

## 2. O que o Sistema já Consegue Fazer (Funcionalidades Concluídas)

### 2.1. Cartografia Digital e Camadas Geoespaciais (GIS)
* **Motor Cartográfico:** Baseado em Leaflet.js e renderizado em tela cheia com mapas base vetoriais e de satélite.
* **Malha Oficial Integrada:**
  * Delimitação e compartimentação da bacia (Alto, Médio e Baixo Curso).
  * 1.294 canais de drenagem oficial (175,27 km mapeados).
  * 17 a 21 bairros oficiais de Manaus inseridos na bacia.
  * 875 setores censitários do IBGE.
  * 79 poligonais de risco mapeadas pelo Serviço Geológico do Brasil (CPRM/SGB) com laudos e tipologias (Risco Alto e Muito Alto).
* **Interatividade Espacial:** Ferramenta "Modo Mira" para captura de coordenadas geográficas exatas por clique direto no mapa, com identificação automática do bairro via *point-in-polygon*.

### 2.2. Telemetria e Monitoramento em Tempo Real
* **Conexão Fluviométrica (ANA / CPRM):** Consulta automática da cota da Estação 14990000 (Porto de Manaus / Rio Negro). Modela o efeito de remanso que represas o Mindu nos limiares de **Alerta (27,50 m)** e **Inundação Severa (29,00 m)**.
* **Conexão Meteorológica (Open-Meteo / INMET):** Monitoramento contínuo de temperatura (°C), umidade relativa (%) e taxa instantânea de chuva (mm/h), além de probabilidade e volume acumulado de precipitação previstos para 24h e 72h.
* **Simulador Hidrológico Paramétrico:** Ferramenta na interface que permite simular cotas hipotéticas (ex: cheia histórica de 30,02 m) e intensidades de chuva para avaliar o impacto imediato sobre domicílios e vias.
* **Boletim Situacional Oficial em PDF:** Geração instantânea *client-side* de documento técnico com telemetria, diagnóstico de alerta, prognóstico de 72h e assinatura institucional da Defesa Civil / PMI-Mindu.

### 2.3. Módulo de Ciência Cidadã com Triagem Geoespacial
* **Envio de Relatos pelos Moradores:**
  * Cidadãos podem registrar pontos de alagamento pela web ou pelo celular com fotos, nível estimado da água e coordenadas GPS.
  * Anonimização automática de números de telefone para conformidade com a LGPD.
* **Triagem IA/SIG de Veracidade:**
  * Ao receber um relato, o backend calcula a distância euclidiana da coordenada em relação aos 79 setores de risco do SGB/CPRM e valida o perímetro da bacia.
  * Atribui automaticamente selos de conformidade: *Alta Confiabilidade* (≤ 650 m de mancha SGB), *Média Confiabilidade* (≤ 1.800 m) ou *Fora do Perímetro / Trote*.

### 2.4. Sala de Comando e Curadoria ADM (`/adm`)
* **Autenticação e Proteção:** Acesso restrito para analistas e Defesa Civil.
* **Mapa de Auditoria Integrado:** Pinos amarelos (relatos pendentes) e pinos vermelhos (homologados/públicos).
* **Mesa de Moderação:**
  * Aprovação individual ou rejeição de relatos com atualização dinâmica no mapa público.
  * **Aprovação em Lote:** Botão para homologar de uma só vez todos os relatos classificados com *Alta Confiabilidade*.
  * **Encerramento de Alagamento (`🏁 Encerrar`):** Permite marcar que o evento cessou, removendo o pino do mapa público e disparando nota de normalização no canal.
  * **Cadastro Direto da Defesa Civil:** Lançamento de focos oficiais prioritários diretamente no mapa.
* **Painel Histórico Analítico:**
  * Filtros temporais (7, 30 e 90 dias).
  * Gráfico de barras de ocorrências por dia e histograma dos bairros mais impactados.
  * Exportação completa de relatos em **CSV** (otimizado para Excel PT-BR) e **GeoJSON** (para importação no QGIS/ArcGIS).

### 2.5. Broadcast Oficial no Telegram (`@sigweb_mindu_bot` $\rightarrow$ `@alertasigweb`)
* **Zero Cadastro / LGPD:** Moradores não precisam fornecer dados pessoais. Basta escanear o QR Code no portal e entrar no canal público [t.me/alertasigweb](https://t.me/alertasigweb).
* **Envio de Fotos e Relatos Direto pelo Telegram:**
  * O morador pode mandar foto e localização GPS diretamente para o `@sigweb_mindu_bot`.
  * O backend faz o download da imagem, armazena em `/uploads/`, identifica o bairro pelo polígono e insere o relato como pendente na fila de moderação.
  * **Proteção Anti-Spam:** Rate limit inteligente configurado (intervalo mínimo entre fotos e limite de 1 relato a cada 3 minutos por usuário).
* **Disparo Automático de Alertas com Pino de GPS:**
  * Ao aprovar um relato, o bot transmite mensagem formatada em HTML no canal e, em seguida, envia o **pino nativo de localização (`sendLocation`)** do Telegram.
* **Editor de Mensagem com Prévia em Tempo Real:**
  * No painel ADM, o gestor pode customizar o template do alerta utilizando tags HTML e variáveis dinâmicas (`{bairro}`, `{nivel_agua}`, `{descricao}`, `{lat}`, `{lng}`, `{score}`), contando com visualizador de prévia idêntico ao aplicativo Telegram.
* **Disparo de Boletins Extraordinários:** Possibilidade de transmitir avisos meteorológicos urgentes ou boletins operacionais a qualquer momento para toda a bacia ou bairros específicos.

### 2.6. Infraestrutura de Inicialização e Experiência do Usuário (UX)
* **Scripts de Execução em 1 Clique:**
  * `iniciar.bat`: Sobe os servidores de backend e frontend em segundo plano e abre o navegador automaticamente nas duas telas.
  * `parar.bat`: Encerra completamente todos os processos e libera as portas 8000 e 3000.
* **Monitoramento de Conectividade:** Banner flutuante inteligente (`BackendStatusBanner.js`) que avisa o usuário caso o servidor de dados caia ou esteja offline, reconectando-se de forma transparente.
* **Tooltips Descritivos no Header:** Informações contextuais detalhadas acionadas ao passar o mouse em cada indicador e botão da barra executiva.

---

## 3. Fundamentação Metodológica e Base Tecnológica

| Camada | Tecnologias Utilizadas | Papel no Sistema |
| :--- | :--- | :--- |
| **Frontend** | Next.js 16 (React 19), Tailwind CSS v4, Leaflet.js | Renderização reativa, dashboards, controle do mapa via postMessage e mapas de calor |
| **Backend** | Python 3.12, FastAPI, SQLAlchemy, Uvicorn | Orquestração da API REST, endpoints analíticos e poller assíncrono do Telegram |
| **Geo / Dados** | GeoPandas, Shapely, PyProj, Fiona | Processamento vetorial de polígonos, interseção espacial, cálculo geodésico e conversor multiformato |
| **Armazenamento** | SQLite local (`sigweb_teste.db`), Sistema de Arquivos (`/uploads`) | Persistência ágil e leve para prototipação e validação |
| **Integrações** | Telegram Bot API, APIs ANA, Open-Meteo, InfoDengue, OSM | Coleta de telemetria pública, séries históricas e mensageria instantânea |

---

## 4. O que Pode Ser Melhorado / Próximos Passos (Roadmap de Evolução)

Para elevar o projeto de protótipo acadêmico para **produto institucional de produção**, os seguintes pontos são recomendados para as próximas etapas:

### 4.1. Camada de Segurança e Produção (Crítico antes de ir para a Internet)
* **Substituição de Credenciais Fixas:** Migrar a autenticação simples (senha fixa `"123"`) para autenticação por **Tokens JWT** com controle de perfis de acesso (ex: Administrador, Operador Defesa Civil, Pesquisador).
* **Gestão de Segredos:** Mover o token HTTP do bot do Telegram e chaves de API para arquivos de ambiente protegidos (`.env`).
* **CORS Restritivo:** Bloquear origens livres (`*`) e restringir as chamadas apenas ao domínio oficial do sistema.

### 4.2. Arquitetura de Dados e Persistência
* **Migração para PostgreSQL + PostGIS:**
  * Atualmente, o SQLite atende perfeitamente à bancada de testes.
  * Em ambiente de produção com centenas de acessos concorrentes, o PostgreSQL com a extensão espacial **PostGIS** trará suporte a indexação espacial espacialmente indexada (R-Tree / GiST), tornando cruzamentos espaciais instantâneos.

### 4.3. Infraestrutura e Nuvem
* **Containerização (Docker & Docker Compose):** Empacotar backend e frontend em contêineres para execução idêntica em qualquer ambiente (Windows, Linux, Nuvem).
* **Hospedagem Gratuita/Econômica:** Implementação na nuvem (utilizando o *Always Free Tier* do Google Cloud via Compute Engine `e2-micro`, ou infraestrutura própria do CINDACTA/Prefeitura de Manaus).

### 4.4. Inteligência e Modelagem Hidrológica
* **Classificação Automatizada de Imagens (Visão Computacional):** Adicionar um modelo leve de Machine Learning (como YOLO ou MobileNet) para analisar a foto enviada pelo morador e estimar de forma autônoma a lâmina d'água (ex: água cobrindo pneu de carro, calçada ou porta).
* **Curva Chave e Linígrafo Local:** Calibração de cotas com sensores IoT de baixo custo espalhados em pontes estratégicas do Parque do Mindu.

---

## 5. Conclusão

O projeto **SIGWEB / PMI - MINDU** atingiu maturidade técnica suficiente para ser apresentado como uma **solução viável, moderna e de alto impacto social e científico**. 

O sistema não se limita a exibir dados estáticos em um mapa: ele fecha um ciclo operacional completo entre **previsão meteorológica, dados geológicos oficiais, participação popular e resposta rápida da Defesa Civil**, comprovando rigor metodológico e potencial de aplicação prática na gestão de riscos urbanos na Amazônia.
