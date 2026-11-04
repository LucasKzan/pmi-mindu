-- =========================================================================
-- SIGWEB - ATLAS DO RACISMO AMBIENTAL (BACIA DO MINDU)
-- Arquivo de Inicialização do Banco de Dados Relacional e Espacial (PostGIS)
-- =========================================================================

-- Habilitando a extensão espacial (Obrigatório para dados geográficos)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. TABELA DE VULNERABILIDADE (DADOS IBGE)
-- Armazena os polígonos dos setores censitários e os dados socioeconômicos.
CREATE TABLE setores_censitarios (
    id_setor VARCHAR(20) PRIMARY KEY,
    bairro VARCHAR(100),
    renda_media NUMERIC(10, 2),
    perc_pop_negra_parda NUMERIC(5, 2), -- Percentual
    domicilios_palafita INT,            -- Contagem de domicílios rústicos/madeira
    ivs_score NUMERIC(5, 2),            -- Índice de Vulnerabilidade Social (Calculado)
    geom GEOMETRY(Polygon, 4326)        -- O Polígono real do quarteirão no mapa
);

-- 2. TABELA DE PERIGO FÍSICO (DADOS CPRM/MAPBIOMAS)
-- Armazena as manchas de inundação de acordo com o tempo de retorno (ex: cheia de 10 anos, 100 anos).
CREATE TABLE manchas_inundacao (
    id_mancha SERIAL PRIMARY KEY,
    tempo_retorno_anos INT,
    nivel_risco VARCHAR(50),            -- Ex: Alto, Muito Alto
    fonte_dado VARCHAR(100),            -- Ex: CPRM, Defesa Civil
    geom GEOMETRY(MultiPolygon, 4326)   -- A Mancha de Inundação
);

-- 3. TABELA IOT (SENSORES CEMADEN)
-- Cadastro dos pluviômetros e fluviômetros.
CREATE TABLE sensores_iot (
    codigo_sensor VARCHAR(50) PRIMARY KEY,
    tipo VARCHAR(50),                   -- Pluviômetro ou Fluviômetro
    nome_estacao VARCHAR(150),
    leitura_atual NUMERIC(10, 2),       -- mm de chuva ou cota do rio em metros
    data_ultima_leitura TIMESTAMP,
    status_alerta VARCHAR(50),          -- Normal, Atenção, Alerta, Emergência
    geom GEOMETRY(Point, 4326)          -- Localização exata do sensor
);

-- 4. TABELA DE CIÊNCIA CIDADÃ (RELATOS DA COMUNIDADE)
-- Onde caem os alertas de alagamento enviados pelos moradores via celular/WhatsApp.
CREATE TABLE relatos_comunidade (
    id_relato SERIAL PRIMARY KEY,
    telefone_anonimizado VARCHAR(50),
    bairro_relatado VARCHAR(100),
    nivel_agua_estimado VARCHAR(50),    -- Ex: No tornozelo, No joelho, Dentro de casa
    descricao TEXT,
    url_foto VARCHAR(255),              -- Link para a foto enviada no bucket da nuvem
    data_relato TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status_verificacao BOOLEAN DEFAULT FALSE,
    geom GEOMETRY(Point, 4326)          -- Coordenada do GPS do celular da pessoa
);

-- =========================================================================
-- ÍNDICES ESPACIAIS (CRÍTICO PARA PERFORMANCE DO MAPA)
-- =========================================================================
CREATE INDEX idx_setores_geom ON setores_censitarios USING GIST (geom);
CREATE INDEX idx_manchas_geom ON manchas_inundacao USING GIST (geom);
CREATE INDEX idx_sensores_geom ON sensores_iot USING GIST (geom);
CREATE INDEX idx_relatos_geom ON relatos_comunidade USING GIST (geom);

-- =========================================================================
-- EXEMPLO DO PODER DA CONSULTA ESPACIAL (RACISMO AMBIENTAL)
-- A view abaixo responde dinamicamente: "Quantas famílias negras e de baixa renda 
-- morando em palafitas serão atingidas se a mancha de inundação de 100 anos ocorrer?"
-- =========================================================================
CREATE OR REPLACE VIEW view_impacto_racismo_ambiental AS
SELECT 
    s.id_setor,
    s.bairro,
    s.renda_media,
    s.perc_pop_negra_parda,
    s.domicilios_palafita
FROM 
    setores_censitarios s
JOIN 
    manchas_inundacao m 
ON 
    ST_Intersects(s.geom, m.geom) -- Mágica do PostGIS: Cruza a geografia automaticamente
WHERE 
    m.nivel_risco = 'Muito Alto';
