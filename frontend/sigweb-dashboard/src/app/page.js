"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import BackendStatusBanner from './BackendStatusBanner';
import { getApiUrl } from './config';

export default function Dashboard() {
  const iframeRef = useRef(null);
  const [analytics, setAnalytics] = useState(null);

  // null = Mapa 100% livre (nenhuma gaveta aberta!).
  // Opções quando clicado num ícone: 'PROGNOSIS' | 'SIMULADOR' | 'GRAFICOS' | 'GERAL' | 'DATAHUB' | 'CIDADAO'
  const [activeTab, setActiveTab] = useState(null);
  const [focusCard, setFocusCard] = useState('TODOS');

  // Estados de Telemetria em Tempo Real, Diagnóstico e Prognóstico
  const [telemetria, setTelemetria] = useState(null);
  const [cotaSimulada, setCotaSimulada] = useState(null);
  const [chuvaSimulada, setChuvaSimulada] = useState(null);
  const [loadingTelemetria, setLoadingTelemetria] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [timeAgoText, setTimeAgoText] = useState('Ao Vivo');

  // Command Palette (Busca Rápida de Bairros / Setores no Mapa)
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtros sincronizados com o Mapa, Gráficos e Tabela
  const [filtroCurso, setFiltroCurso] = useState('TODOS');
  const [filtroGrau, setFiltroGrau] = useState('TODOS');
  const [filtroTipologia, setFiltroTipologia] = useState('TODOS');
  const [filtroBairro, setFiltroBairro] = useState('TODOS');
  const [buscaTexto, setBuscaTexto] = useState('');
  const [setorSelecionado, setSetorSelecionado] = useState(null);

  // Estados do Hub de Extração Multi-Formato (Data Hub)
  const [hubDataset, setHubDataset] = useState('areas_risco_sgb');
  const [hubCotaMax, setHubCotaMax] = useState(115);
  const [hubDiasHist, setHubDiasHist] = useState(30);
  const [hubPreview, setHubPreview] = useState(null);
  const [loadingHub, setLoadingHub] = useState(false);

  // Estado do Modal Oculto de Documentação Oficial do Sistema
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [docSection, setDocSection] = useState('ARQUITETURA');

  // Modal Guia Rápido de Ajuda (Tour de 3 passos)
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpStep, setHelpStep] = useState(1);

  // Dropdown / Abinha retrátil dos Setores Críticos Ativados Agora (Card 4)
  const [showSetoresAtivados, setShowSetoresAtivados] = useState(false);

  // Estados da Ciência Cidadã (Portal do Cidadão)
  const [pickingPointOnMap, setPickingPointOnMap] = useState(false);
  const [pontoMarcadoManualmente, setPontoMarcadoManualmente] = useState(false);
  const [relatosCount, setRelatosCount] = useState(0);
  const [relatoBairro, setRelatoBairro] = useState('CIDADE NOVA');
  const [relatoNivel, setRelatoNivel] = useState('Água no joelho (30cm a 60cm)');
  const [relatoDesc, setRelatoDesc] = useState('');
  const [relatoTel, setRelatoTel] = useState('');
  const [relatoLat, setRelatoLat] = useState(-3.0355);
  const [relatoLng, setRelatoLng] = useState(-59.9625);
  const [enviandoRelato, setEnviandoRelato] = useState(false);
  const [feedbackCidadao, setFeedbackCidadao] = useState(null);

  // Estado do Canal Público de Broadcast no Telegram (Zero Cadastro p/ Morador)
  const [telegramInfo, setTelegramInfo] = useState({
    bot_configurado: false,
    link_canal: 'https://t.me/alertasigweb',
    historico: [],
  });

  const coordsPorBairro = {
    'CIDADE NOVA': [-3.0355, -59.9625],
    'CIDADE DE DEUS': [-3.0215, -59.9410],
    'SÃO JOSÉ OPERÁRIO': [-3.0582, -59.9368],
    'JORGE TEIXEIRA': [-3.0428, -59.9245],
    'COROADO': [-3.0815, -59.9812],
    'TANCREDO NEVES': [-3.0595, -59.9485],
    'PARQUE 10 DE NOVEMBRO': [-3.0766, -60.0076],
    'NOSSA SENHORA DAS GRAÇAS': [-3.1025, -60.0215],
    'SÃO RAIMUNDO': [-3.1155, -60.0385],
    'GLÓRIA': [-3.1195, -60.0345],
    'APARECIDA': [-3.1245, -60.0320],
    'SÃO GERALDO': [-3.1085, -60.0225],
    'CHAPADA': [-3.0955, -60.0220],
    'DOM PEDRO': [-3.0850, -60.0320],
    'CACHOEIRINHA': [-3.1145, -60.0085],
    'SÃO FRANCISCO': [-3.1045, -60.0065],
    'ADRIANÓPOLIS': [-3.0985, -60.0095],
    'ALEIXO': [-3.0895, -59.9965],
    'FLORES': [-3.0598, -60.0025],
    'JAPIIM': [-3.1015, -59.9850],
    'ZUMBI DOS PALMARES': [-3.0715, -59.9560],
    'ARMANDO MENDES': [-3.0885, -59.9520],
    'GILBERTO MESTRINHO': [-3.0685, -59.9320],
    'NOVO ALEIXO': [-3.0485, -59.9720],
  };

  const carregarContagemRelatosPublicos = () => {
    fetch(getApiUrl('/api/mapa/relatos?incluir_pendentes=false'))
      .then((r) => r.json())
      .then((d) => {
        if (d?.features) {
          setRelatosCount(d.features.length);
        }
      })
      .catch(() => {});
  };

  const carregarStatusTelegramPublico = () => {
    fetch(getApiUrl('/api/telegram/status'))
      .then((r) => r.json())
      .then((d) => {
        if (d) {
          setTelegramInfo({
            bot_configurado: Boolean(d.bot_configurado),
            link_canal: d.link_canal || 'https://t.me/alertasigweb',
            historico: d.historico || [],
          });
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    carregarContagemRelatosPublicos();
    carregarStatusTelegramPublico();

    const handleMessage = (event) => {
      if (event.data?.type === 'MAP_CLICK_COORDS') {
        setRelatoLat(event.data.lat);
        setRelatoLng(event.data.lng);
        if (event.data.bairroDetectado) {
          setRelatoBairro(event.data.bairroDetectado.toUpperCase());
        }
        setPontoMarcadoManualmente(true);
        setPickingPointOnMap(false);
        setActiveTab('CIDADAO');
      }
    };
    window.addEventListener('message', handleMessage);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowSearchModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleDrawer = (tabName) => {
    setActiveTab((prev) => (prev === tabName ? null : tabName));
  };

  // Avisar o mapa para deslocar suavemente a Legenda e o Seletor de Camadas quando a gaveta direita abrir!
  useEffect(() => {
    sendToMap({ type: 'DRAWER_STATE', isOpen: Boolean(activeTab) });
    if (activeTab === 'TELEGRAM') {
      carregarStatusTelegramPublico();
    }
  }, [activeTab]);

  const ativarModoEscolherNoMapa = () => {
    // Recolhe a gaveta temporariamente para deixar o mapa 100% visível durante o clique!
    setActiveTab(null);
    setPickingPointOnMap(true);
    sendToMap({ type: 'START_PICK_POINT' });
  };

  const enviarNovoRelato = async (e) => {
    e.preventDefault();
    if (!relatoDesc.trim()) return;
    setEnviandoRelato(true);
    setFeedbackCidadao(null);
    try {
      const resp = await fetch(getApiUrl('/api/webhook/relato'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telefone_anonimizado: relatoTel.trim() || '0000',
          bairro_relatado: relatoBairro,
          nivel_agua_estimado: relatoNivel,
          descricao: relatoDesc.trim(),
          url_foto: 'https://imgur.com/relato_comunitario.jpg',
          latitude: parseFloat(relatoLat),
          longitude: parseFloat(relatoLng),
        }),
      });
      if (resp.ok) {
        const dataResp = await resp.json();
        setRelatoDesc('');
        setPontoMarcadoManualmente(false);
        carregarContagemRelatosPublicos();
        setFeedbackCidadao({
          protocolo: Math.floor(100000 + Math.random() * 900000),
          bairro: relatoBairro,
          score: dataResp.score_veracidade,
        });
        sendToMap({
          type: 'RELOAD_RELATOS',
          incluirPendentes: false,
          lat: parseFloat(relatoLat),
          lng: parseFloat(relatoLng),
          customText: `⏳ Relato registrado (${relatoBairro}) e enviado para Curadoria ADM!`,
        });
      }
    } catch (err) {
      console.error('Erro ao enviar relato:', err);
    } finally {
      setEnviandoRelato(false);
    }
  };

  const emitirBoletimPDF = () => {
    const dataHora = new Date().toLocaleString('pt-BR');
    const cotaAtual = situacao?.cota_rio_negro_m || 27.65;
    const cotaEfetiva = situacao?.cota_efetiva_impacto_m || 27.65;
    const domAfetados = situacao?.domicilios_afetados_cota || 4210;
    const alertaStr = situacao?.nivel_alerta === 'ATENÇÃO / MONITORAMENTO (VERDE)'
      ? 'MONITORAMENTO (VERDE)'
      : (situacao?.nivel_alerta || 'MONITORAMENTO (VERDE)');
    const corAlerta = situacao?.cor_alerta || 'green';
    
    // Determinar estilo dinâmico do badge conforme a severidade real do alerta
    let badgeBg = '#dcfce7';
    let badgeColor = '#166534';
    let badgeBorder = '#86efac';

    if (corAlerta === 'red' || alertaStr.includes('VERMELHO') || alertaStr.includes('MÁXIMO') || alertaStr.includes('TRANSBORDAMENTO')) {
      badgeBg = '#fee2e2';
      badgeColor = '#991b1b';
      badgeBorder = '#f87171';
    } else if (corAlerta === 'amber' || alertaStr.includes('LARANJA') || alertaStr.includes('AMARELO') || alertaStr.includes('ALERTA')) {
      badgeBg = '#fef3c7';
      badgeColor = '#92400e';
      badgeBorder = '#fcd34d';
    }
    const diagStr = situacao?.diagnostico_texto || '';
    const setoresTop = setoresFiltrados.slice(0, 15);

    const win = window.open('', '_blank', 'width=960,height=800');
    if (!win) return;

    const linhasTabela = setoresTop
      .map(
        (s) => `
        <tr>
          <td><b>${s.cod_setor}</b></td>
          <td>${s.local}</td>
          <td>${s.bairro} (${s.curso})</td>
          <td style="text-align:center;">${s.cota_m}m</td>
          <td>${s.tipologia_principal}</td>
          <td><b>${s.grau_risco}</b></td>
          <td style="text-align:right; color:#b91c1c; font-weight:bold;">${s.pessoas}</td>
          <td style="text-align:right;">${s.edificacoes}</td>
        </tr>`
      )
      .join('');

    win.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Boletim Técnico Situacional — SIGWEB / PMI - MINDU</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 28px; font-size: 12px; line-height: 1.45; }
          .header { border-bottom: 3px solid #0f172a; padding-bottom: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }
          .subtitle { font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 3px; }
          .badge { background: ${badgeBg}; color: ${badgeColor}; padding: 6px 12px; border-radius: 6px; font-weight: 800; border: 1.5px solid ${badgeBorder}; font-size: 11.5px; letter-spacing: 0.5px; }
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px; }
          .kpi { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; background: #f8fafc; }
          .kpi span { display: block; font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; }
          .kpi strong { font-size: 17px; color: #0f172a; }
          .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; color: #0f172a; background: #e2e8f0; padding: 6px 10px; border-radius: 4px; margin: 16px 0 10px 0; }
          .diag-box { border-left: 4px solid #0284c7; background: #f0f9ff; padding: 10px 14px; margin-bottom: 14px; border-radius: 0 6px 6px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 8px; }
          th { background: #0f172a; color: white; text-align: left; padding: 6px 8px; }
          td { border-bottom: 1px solid #cbd5e1; padding: 6px 8px; }
          .footer { margin-top: 28px; padding-top: 10px; border-top: 2px solid #cbd5e1; font-size: 10.5px; color: #475569; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">SIGWEB — BOLETIM HIDROLÓGICO E DE RISCO</h1>
            <div class="subtitle">Sub-Bacia Hidrográfica do Igarapé do Mindu (Manaus - AM)</div>
          </div>
          <div style="text-align:right;">
            <div class="badge">${alertaStr}</div>
            <div style="font-size:10px; color:#64748b; margin-top:4px;">Emitido em: ${dataHora}</div>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi">
            <span>Cota Rio Negro / Efetiva</span>
            <strong>${cotaAtual}m / ${cotaEfetiva}m</strong>
          </div>
          <div class="kpi">
            <span>Domicílios na Cota Atual</span>
            <strong>${domAfetados.toLocaleString('pt-BR')} / 17.964</strong>
          </div>
          <div class="kpi">
            <span>Setores SGB Filtrados</span>
            <strong>${totaisFiltrados.setores} de 79 áreas</strong>
          </div>
          <div class="kpi">
            <span>Moradores em Risco (Filtro)</span>
            <strong style="color:#b91c1c;">${totaisFiltrados.pessoas.toLocaleString('pt-BR')} hab.</strong>
          </div>
        </div>

        <div class="section-title">1. Diagnóstico Hidrometeorológico Atual</div>
        <div class="diag-box">
          ${diagStr}
        </div>

        <div class="section-title">2. Relação de Setores Críticos Mapeados (SGB/CPRM — Amostra Prioritária)</div>
        <table>
          <thead>
            <tr>
              <th>Setor</th>
              <th>Endereço / Local</th>
              <th>Bairro (Curso)</th>
              <th>Cota</th>
              <th>Tipologia</th>
              <th>Grau Risco</th>
              <th>Moradores</th>
              <th>Edif.</th>
            </tr>
          </thead>
          <tbody>
            ${linhasTabela}
          </tbody>
        </table>

        <div class="footer">
          <div>
            <b>ASSINATURA DIGITAL:</b> Documento oficial extraído automaticamente da plataforma <b>SIGWEB (Sistema de Informações Geográficas e Monitoramento Inteligente da Bacia do Mindu — PMI-MINDU)</b>.
          </div>
          <div>
            Base Cartográfica: SGB/CPRM, ANA, IBGE Censo 2022 | EPSG:32720 / EPSG:4326
          </div>
        </div>

        <script>
          setTimeout(() => { window.print(); }, 450);
        </script>
      </body>
      </html>
    `);
    win.document.close();
  };

  useEffect(() => {
    if (activeTab !== 'DATAHUB') return;
    setLoadingHub(true);
    const params = new URLSearchParams({
      dataset: hubDataset,
      curso: filtroCurso,
      bairro: filtroBairro,
      grau_risco: filtroGrau,
      tipologia: filtroTipologia,
      cota_max_m: hubCotaMax,
      dias_historico: hubDiasHist,
    });
    fetch(getApiUrl(`/api/hub/preview?${params.toString()}`))
      .then((r) => r.json())
      .then((d) => {
        setHubPreview(d);
        setLoadingHub(false);
      })
      .catch(() => setLoadingHub(false));
  }, [activeTab, hubDataset, filtroCurso, filtroBairro, filtroGrau, filtroTipologia, hubCotaMax, hubDiasHist]);

  const getHubDownloadUrl = (formato) => {
    const params = new URLSearchParams({
      dataset: hubDataset,
      formato,
      curso: filtroCurso,
      bairro: filtroBairro,
      grau_risco: filtroGrau,
      tipologia: filtroTipologia,
      cota_max_m: hubCotaMax,
      dias_historico: hubDiasHist,
    });
    return getApiUrl(`/api/hub/download?${params.toString()}`);
  };

  useEffect(() => {
    fetch('/data/dashboard_analytics.json')
      .then((res) => res.json())
      .then((data) => setAnalytics(data))
      .catch((err) => console.error('Erro ao carregar dados analíticos:', err));
  }, []);

  const carregarTelemetria = (cotaCustom = null, chuvaCustom = null) => {
    setLoadingTelemetria(true);
    const params = new URLSearchParams();
    if (cotaCustom !== null) params.append('simular_cota_m', cotaCustom);
    if (chuvaCustom !== null) params.append('simular_chuva_mm_h', chuvaCustom);

    fetch(getApiUrl(`/api/hidrologia/tempo-real?${params.toString()}`))
      .then((res) => res.json())
      .then((data) => {
        setTelemetria(data);
        setLoadingTelemetria(false);
        setLastUpdated(new Date());
        setTimeAgoText('Agora');
        if (cotaCustom !== null || chuvaCustom !== null) {
          sendToMap({
            type: 'SIMULATE_COTA',
            cotaEfetiva: data.analise_situacional.cota_efetiva_impacto_m,
            codigosCriticos: data.analise_situacional.codigos_setores_criticos,
            reset: false,
          });
        }
      })
      .catch((err) => {
        console.error('Erro na API de telemetria:', err);
        setLoadingTelemetria(false);
      });
  };

  // Atualização em tempo relativo para sensação de monitoramento vivo
  useEffect(() => {
    const calcTimeAgo = () => {
      if (!lastUpdated) return;
      const diffSec = Math.floor((new Date() - lastUpdated) / 1000);
      if (diffSec < 45) {
        setTimeAgoText('Agora');
      } else if (diffSec < 90) {
        setTimeAgoText('há 1 min');
      } else {
        const mins = Math.floor(diffSec / 60);
        setTimeAgoText(`há ${mins} min`);
      }
    };

    calcTimeAgo();
    const interval = setInterval(calcTimeAgo, 15000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  useEffect(() => {
    carregarTelemetria(null, null);
    const timer = setInterval(() => {
      if (cotaSimulada === null && chuvaSimulada === null) {
        carregarTelemetria(null, null);
      }
    }, 300000);
    return () => clearInterval(timer);
  }, []);

  const sendToMap = (payload) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(payload, '*');
    }
  };

  useEffect(() => {
    sendToMap({
      type: 'APPLY_FILTERS',
      filters: {
        curso: filtroCurso,
        grauRisco: filtroGrau,
        tipologia: filtroTipologia,
        bairro: filtroBairro,
      },
    });
  }, [filtroCurso, filtroGrau, filtroTipologia, filtroBairro]);

  const handleCardClick = (mode) => {
    const nextMode = focusCard === mode ? 'TODOS' : mode;
    setFocusCard(nextMode);
    sendToMap({ type: 'FOCUS_MODE', mode: nextMode });
  };

  const limparFiltros = () => {
    setFiltroCurso('TODOS');
    setFiltroGrau('TODOS');
    setFiltroTipologia('TODOS');
    setFiltroBairro('TODOS');
    setBuscaTexto('');
    setFocusCard('TODOS');
    setCotaSimulada(null);
    setChuvaSimulada(null);
    carregarTelemetria(null, null);
    sendToMap({ type: 'SIMULATE_COTA', reset: true });
    sendToMap({ type: 'FOCUS_MODE', mode: 'TODOS' });
  };

  const setoresFiltrados = useMemo(() => {
    if (!analytics?.setores_risco) return [];
    return analytics.setores_risco.filter((s) => {
      if (filtroCurso !== 'TODOS' && s.codigo_curso !== filtroCurso) return false;
      if (filtroGrau !== 'TODOS' && s.grau_risco.toLowerCase() !== filtroGrau.toLowerCase()) return false;
      if (filtroTipologia !== 'TODOS' && s.tipologia_principal.toLowerCase() !== filtroTipologia.toLowerCase()) return false;
      if (filtroBairro !== 'TODOS' && s.bairro !== filtroBairro) return false;
      if (buscaTexto.trim() !== '') {
        const q = buscaTexto.toLowerCase();
        const match =
          s.local.toLowerCase().includes(q) ||
          s.bairro.toLowerCase().includes(q) ||
          s.cod_setor.toLowerCase().includes(q) ||
          s.descricao.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [analytics, filtroCurso, filtroGrau, filtroTipologia, filtroBairro, buscaTexto]);

  const totaisFiltrados = useMemo(() => {
    const pessoas = setoresFiltrados.reduce((acc, s) => acc + s.pessoas, 0);
    const edificacoes = setoresFiltrados.reduce((acc, s) => acc + s.edificacoes, 0);
    return {
      setores: setoresFiltrados.length,
      pessoas,
      edificacoes,
    };
  }, [setoresFiltrados]);

  const focarSetorNoMapa = (setor) => {
    setSetorSelecionado(setor);
    sendToMap({
      type: 'ZOOM_SECTOR',
      lat: setor.lat,
      lng: setor.lng,
      cod_setor: setor.cod_setor,
    });
  };

  const listaBairros = useMemo(() => {
    if (!analytics?.setores_risco) return [];
    const setB = new Set(analytics.setores_risco.map((s) => s.bairro).filter(Boolean));
    return Array.from(setB).sort();
  }, [analytics]);

  const navegarParaBairro = (nomeBairro) => {
    const coords = coordsPorBairro[nomeBairro];
    if (coords) {
      setFiltroBairro(nomeBairro);
      sendToMap({
        type: 'ZOOM_BAIRRO',
        nome: nomeBairro,
        lat: coords[0],
        lng: coords[1],
      });
      setShowSearchModal(false);
      setSearchQuery('');
    }
  };

  const exportarGraficosPNG = () => {
    if (!analytics) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const width = 1200;
    const height = 900;
    canvas.width = width;
    canvas.height = height;

    // Fundo
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Header do Gráfico
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('SIGWEB — Bacia Hidrográfica do Igarapé do Mindu', 40, 50);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '15px sans-serif';
    ctx.fillText('Indicadores Oficiais de Risco Geológico, Supressão Vegetal (NDVI) e Saneamento Básico', 40, 78);

    // Linha divisória
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(40, 95);
    ctx.lineTo(width - 40, 95);
    ctx.stroke();

    // Box 1: Tipologias de Risco
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(40, 115, 540, 360);
    ctx.strokeStyle = '#475569';
    ctx.strokeRect(40, 115, 540, 360);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('1. Pessoas Expostas por Tipologia (SGB/CPRM)', 60, 145);

    const tipos = analytics.graficos.por_tipologia.slice(0, 5);
    let yTipos = 185;
    tipos.forEach((t) => {
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '13px sans-serif';
      ctx.fillText(`${t.tipologia_principal} (${t.setores} setores)`, 60, yTipos);

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(`${t.pessoas.toLocaleString('pt-BR')} hab.`, 480, yTipos);

      const barWidth = Math.max(12, (t.pessoas / 18000) * 440);
      ctx.fillStyle = '#334155';
      ctx.fillRect(60, yTipos + 6, 440, 12);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(60, yTipos + 6, barWidth, 12);

      yTipos += 46;
    });

    // Box 2: Supressão Vegetal 1990-2022
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(620, 115, 540, 360);
    ctx.strokeStyle = '#475569';
    ctx.strokeRect(620, 115, 540, 360);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('2. Supressão Vegetal & Solo Exposto (1990–2022)', 640, 145);

    const anos = [
      { ano: '1990', d: 37, s: 19, desc: 'Mata Ripária Predominante' },
      { ano: '2000', d: 26, s: 14, desc: 'Expansão Médio Curso' },
      { ano: '2010', d: 18, s: 38, desc: 'Pico Solo Exposto (38%)' },
      { ano: '2022', d: 19, s: 29, desc: 'Perda de 81% da Vegetação' },
    ];

    let yAnos = 185;
    anos.forEach((a) => {
      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(`${a.ano} — ${a.desc}`, 640, yAnos);

      ctx.fillStyle = '#10b981';
      ctx.fillRect(640, yAnos + 8, a.d * 4.5, 12);

      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(640 + a.d * 4.5 + 4, yAnos + 8, a.s * 4.5, 12);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px sans-serif';
      ctx.fillText(`Veg. Densa: ${a.d}% | Solo: ${a.s}%`, 920, yAnos + 18);

      yAnos += 50;
    });

    // Box 3: Domicílios Inundados por Bairro
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(40, 495, 1120, 330);
    ctx.strokeStyle = '#475569';
    ctx.strokeRect(40, 495, 1120, 330);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('3. Domicílios Impactados por Inundação na Bacia (Top Bairros IBGE/CPRM)', 60, 525);

    const bairros = analytics.graficos.bairros_inundacao.slice(0, 6);
    let yB = 565;
    bairros.forEach((b) => {
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '13px sans-serif';
      ctx.fillText(`${b.NOME} (${b.ZONAS})`, 60, yB);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(`${b.domicilios_inundacao.toLocaleString('pt-BR')} domicílios`, 300, yB);

      const bW = Math.max(15, (b.domicilios_inundacao / 6500) * 650);
      ctx.fillStyle = '#334155';
      ctx.fillRect(440, yB - 12, 650, 14);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(440, yB - 12, bW, 14);

      yB += 40;
    });

    // Rodapé de Autoria
    ctx.fillStyle = '#64748b';
    ctx.font = '12px sans-serif';
    ctx.fillText('Fonte: IBGE 2022 | CPRM/SGB 2024 | Landsat/Copernicus — Autoria: Adrielly Amaral & Lucas Kzan', 40, 860);

    // Download do PNG
    const link = document.createElement('a');
    link.download = `SIGWEB_MINDU_GRAFICOS_CIENTIFICOS_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const situacao = telemetria?.analise_situacional;
  const meteo = telemetria?.telemetria_tempo_real?.meteorologia_manaus;
  const ana = telemetria?.telemetria_tempo_real?.ana_hidrologia;
  const arQueimadas = telemetria?.telemetria_tempo_real?.qualidade_ar_queimadas;

  const temFiltroAtivo =
    filtroCurso !== 'TODOS' ||
    filtroGrau !== 'TODOS' ||
    filtroTipologia !== 'TODOS' ||
    filtroBairro !== 'TODOS' ||
    focusCard !== 'TODOS' ||
    cotaSimulada !== null ||
    chuvaSimulada !== null;

  return (
    <div className="flex flex-col h-screen w-full bg-slate-100 text-slate-800 overflow-hidden">
      <BackendStatusBanner />
      {/* ========================================================= */}
      {/* 1. HEADER EXECUTIVO UNIFICADO COM IDENTIDADE QGIS / MINDU */}
      {/* ========================================================= */}
      <header className="h-14 bg-[#081c15] text-white border-b border-[#1b4332] flex items-center justify-between px-4 shrink-0 z-30 shadow-lg relative">
        {/* Linha superior de destaque em Verde QGIS */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#589632] via-[#93c02b] to-[#00a88f]" />

        {/* Identidade Institucional à Esquerda */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2.5 cursor-help"
            title="PMI - MINDU"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#589632] to-[#1b4332] border border-[#93c02b]/40 flex items-center justify-center shadow-md">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="leading-none">
              <span className="text-base font-extrabold tracking-tight text-white">
                PMI <span className="text-[#93c02b]">- MINDU</span>
              </span>
            </div>
          </div>
        </div>

        {/* Painel Central Unificado de Telemetria (Estilo Painel QGIS Hidrológico) */}
        <div className="hidden lg:flex items-center h-9 bg-[#0b241c] border border-[#1b4332] rounded-lg divide-x divide-[#1b4332] text-xs shadow-inner">
          {/* Estágio Operacional (Clicável para Diagnóstico + Destaque no Mapa) */}
          {situacao && (
            <button
              onClick={() => {
                setActiveTab('PROGNOSIS');
                sendToMap({
                  type: 'FOCUS_ALERT_AREAS',
                  codigosCriticos: situacao.codigos_setores_criticos || [],
                  nivelAlerta: situacao.nivel_alerta,
                  cota: situacao.cota_efetiva_impacto_m,
                });
              }}
              className="flex items-center gap-2 px-3.5 h-full cursor-pointer hover:bg-[#133527] transition-colors group text-left"
              title={`Clique para ver o laudo detalhado e destacar no mapa os ${situacao.setores_sgb_criticos_count || 12} setores sob ${situacao.nivel_alerta}.`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  situacao.cor_alerta === 'red'
                    ? 'bg-red-500 animate-ping'
                    : situacao.cor_alerta === 'amber'
                    ? 'bg-amber-400'
                    : 'bg-[#93c02b]'
                }`}
              />
              <span
                className={`font-extrabold tracking-wide uppercase text-xs group-hover:underline ${
                  situacao.cor_alerta === 'red'
                    ? 'text-red-400'
                    : situacao.cor_alerta === 'amber'
                    ? 'text-amber-300'
                    : 'text-[#93c02b]'
                }`}
              >
                {situacao.nivel_alerta === 'ATENÇÃO / MONITORAMENTO (VERDE)'
                  ? 'MONITORAMENTO (VERDE)'
                  : situacao.nivel_alerta}
              </span>
            </button>
          )}

          {/* Meteorologia Manaus */}
          <div
            className="flex items-center gap-2 px-3.5 h-full text-emerald-100 font-semibold cursor-help hover:bg-[#133527] transition-colors text-xs"
            title="Condições Meteorológicas em Tempo Real (Open-Meteo / INMET): exibe temperatura do ar (°C), umidade relativa (%) e taxa de precipitação instantânea (mm/h) sobre Manaus."
          >
            <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
            <span>
              {meteo
                ? `${meteo.temperatura_c}°C • ${meteo.umidade_pct}% • ${meteo.chuva_momento_mm_h} mm/h`
                : 'Manaus Online'}
            </span>
          </div>

          {/* Cota Efetiva ANA/SGB */}
          <div
            className="flex items-center gap-1.5 px-3.5 h-full text-cyan-300 font-bold cursor-help hover:bg-[#133527] transition-colors text-xs"
            title="Cota Fluviométrica (ANA / CPRM - Porto de Manaus): nível medido do rio (em metros). Alerta a partir de 27.50m e Inundação Severa acima de 29.00m, gerando efeito de remanso no Igarapé do Mindu."
          >
            <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span>Cota: {situacao ? `${situacao.cota_efetiva_impacto_m}m` : '27.65m'}</span>
          </div>

          {/* Qualidade do Ar / Monitoramento de Queimadas e Fumaça */}
          <div
            className="flex items-center gap-1.5 px-3.5 h-full cursor-help hover:bg-[#133527] transition-colors text-xs font-semibold"
            title={`Qualidade do Ar e Fumaça (Copernicus / Open-Meteo & NASA FIRMS): PM2.5: ${arQueimadas?.pm2_5 || 15} µg/m³ | PM10: ${arQueimadas?.pm10 || 20} µg/m³ | CO: ${arQueimadas?.monoxido_carbono_co || 400} ppb. Padrão de alerta estilo Google/Android para queimadas no Amazonas.`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                arQueimadas?.cor === 'red'
                  ? 'bg-red-500 animate-ping'
                  : arQueimadas?.cor === 'amber'
                  ? 'bg-amber-400'
                  : 'bg-[#93c02b]'
              }`}
            />
            <span
              className={
                arQueimadas?.cor === 'red'
                  ? 'text-red-400 font-bold'
                  : arQueimadas?.cor === 'amber'
                  ? 'text-amber-300 font-bold'
                  : 'text-emerald-100'
              }
            >
              💨 Ar: {arQueimadas ? (arQueimadas.cor === 'red' ? 'Crítico (Fumaça)' : arQueimadas.cor === 'amber' ? 'Moderado' : 'Bom') : 'Bom'} ({arQueimadas?.pm2_5 || 16} µg)
            </span>
          </div>

          {/* Feedback Ao Vivo (Live Status Indicator + Botão de Recarregar Manual) */}
          <button
            onClick={() => carregarTelemetria(cotaSimulada, chuvaSimulada)}
            disabled={loadingTelemetria}
            className="flex items-center gap-1.5 px-3 h-full text-emerald-200 hover:text-[#93c02b] hover:bg-[#133527] transition-all cursor-pointer group text-xs"
            title="Telemetria em tempo real contínua. Clique para forçar uma nova sincronização com a ANA e Open-Meteo agora."
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#93c02b] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#589632]"></span>
            </span>
            <span className="font-semibold tracking-tight group-hover:text-[#93c02b] text-emerald-100">
              {loadingTelemetria ? 'Sincronizando...' : `Ao Vivo • ${timeAgoText}`}
            </span>
            <svg
              className={`w-3.5 h-3.5 text-emerald-300 group-hover:text-[#93c02b] transition-transform ${
                loadingTelemetria ? 'animate-spin text-[#93c02b]' : 'group-hover:rotate-180 duration-500'
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Grupo de Ações Padronizadas à Direita */}
        <div className="flex items-center gap-2">
          {temFiltroAtivo && (
            <button
              onClick={limparFiltros}
              className="h-8 px-3 rounded-lg bg-[#0e2c22] hover:bg-[#163f31] text-[#93c02b] border border-[#589632]/50 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Restaurar visualização padrão do mapa e desmarcar filtros ativos"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden md:inline">Limpar</span>
            </button>
          )}

          {/* Botão 1: Canal de Alertas no Telegram */}
          <button
            onClick={() => toggleDrawer('TELEGRAM')}
            className={`h-8 px-2 sm:px-3 rounded-lg font-bold text-xs flex items-center gap-1.5 border transition-all cursor-pointer ${
              activeTab === 'TELEGRAM'
                ? 'bg-[#00a88f] text-slate-950 border-white shadow-md'
                : 'bg-[#00a88f]/20 hover:bg-[#00a88f]/30 text-teal-200 border-[#00a88f]/40'
            }`}
            title="Canal Público do Telegram (@alertasigweb): clique para abrir o QR Code e link direto para receber alertas sonoros imediatos de alagamento no celular sem precisar de cadastro."
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
            <span className="hidden sm:inline">Canal Telegram</span>
            <span className="sm:hidden">Telegram</span>
          </button>

          {/* Botão 2: Reportar Alagamento (Destaque Principal) */}
          <button
            onClick={() => toggleDrawer('CIDADAO')}
            className={`h-8 px-2.5 sm:px-3.5 rounded-lg font-bold text-xs flex items-center gap-1.5 border transition-all cursor-pointer shadow-sm ${
              activeTab === 'CIDADAO'
                ? 'bg-rose-500 text-white border-rose-300 ring-2 ring-rose-400/50'
                : 'bg-[#d9381e] hover:bg-rose-600 text-white border-[#d9381e]'
            }`}
            title="Ciência Cidadã (Reportar Alagamento): clique para abrir o formulário e informar ponto de inundação na sua rua com foto e GPS. Os relatos passam por triagem geoespacial e curadoria antes de ir ao mapa."
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="hidden sm:inline">Reportar Alagamento</span>
            <span className="sm:hidden">Reportar</span>
            <span className="ml-0.5 px-1.5 py-0.5 bg-black/30 rounded text-xs font-black">
              {relatosCount}
            </span>
          </button>

          {/* Botão 3: Emitir Boletim PDF */}
          <button
            onClick={emitirBoletimPDF}
            title="Emitir Boletim Situacional Oficial em PDF: compila laudo técnico instantâneo com telemetria, cotas, previsão hidrometeorológica e histórico para Defesa Civil e imprensa."
            className="h-8 px-2 sm:px-3 rounded-lg bg-[#0e2c22] hover:bg-[#163f31] text-emerald-100 border border-[#1b4332] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-[#93c02b] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span>PDF</span>
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. FAIXA DOS 4 KPIs VIBRANTES (FONTES AMPLIADAS & LEGÍVEIS)*/}
      {/* ========================================================= */}
      <div className="bg-[#f0fdf4]/50 border-b border-[#bbf7d0]/80 px-3.5 py-2.5 shrink-0 z-20 shadow-xs backdrop-blur-xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* CARD 1: PESSOAS EM RISCO (SGB/CPRM) */}
          <button
            onClick={() => handleCardClick('RISCO_CPRM')}
            title="Pessoas em Risco Alto/Muito Alto (CPRM/SGB): total acumulado de moradores que residem diretamente sobre as 79 poligonais de risco mapeadas pelo Serviço Geológico do Brasil na bacia. Clique para filtrar no mapa."
            className={`text-left px-4 py-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
              focusCard === 'RISCO_CPRM'
                ? 'bg-rose-50/95 border-[#d9381e] ring-2 ring-rose-400/50 shadow-sm'
                : 'bg-white border-slate-200/90 hover:bg-rose-50/40 hover:border-rose-300'
            } border-l-4 border-l-[#d9381e] shadow-xs`}
          >
            <div>
              <span className="text-slate-600 text-xs font-bold uppercase tracking-wider block">
                1. Pessoas em Risco (SGB)
              </span>
              <div className="text-xl font-extrabold text-[#d9381e] leading-tight mt-0.5">
                {totaisFiltrados.pessoas.toLocaleString('pt-BR')}{' '}
                <span className="text-xs font-semibold text-slate-500">
                  ({totaisFiltrados.setores} áreas)
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-rose-100 text-[#d9381e] flex items-center justify-center shrink-0 shadow-2xs">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </button>

          {/* CARD 2: DOMICÍLIOS NA COTA */}
          <button
            onClick={() => handleCardClick('INUNDACAO')}
            title="Domicílios Atingidos na Cota Fluviométrica Atual: estimativa modelada de domicílios vulneráveis com base na curva hipsométrica da bacia e na cota do rio. Clique para ver a mancha e os bairros impactados."
            className={`text-left px-4 py-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
              focusCard === 'INUNDACAO'
                ? 'bg-amber-50/95 border-[#f39c12] ring-2 ring-amber-400/50 shadow-sm'
                : 'bg-white border-slate-200/90 hover:bg-amber-50/40 hover:border-amber-300'
            } border-l-4 border-l-[#f39c12] shadow-xs`}
          >
            <div>
              <span className="text-slate-600 text-xs font-bold uppercase tracking-wider block">
                2. Domicílios na Cota ({situacao?.cota_efetiva_impacto_m || 27.65}m)
              </span>
              <div className="text-xl font-extrabold text-[#d97706] leading-tight mt-0.5">
                {situacao ? situacao.domicilios_afetados_cota.toLocaleString('pt-BR') : '4.210'}{' '}
                <span className="text-xs font-semibold text-slate-500 hidden sm:inline">/ 17.964 dom.</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-[#d97706] flex items-center justify-center shrink-0 shadow-2xs">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
          </button>

          {/* CARD 3: PREVISÃO DE CHUVA */}
          <button
            onClick={() => handleCardClick('HIDROGRAFIA')}
            title="Previsão Hidrometeorológica para as próximas 24 horas: volume previsto de chuva (mm) e probabilidade estatística via modelo Open-Meteo/INMET. Clique para abrir o prognóstico completo de 72 horas."
            className={`text-left px-4 py-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
              focusCard === 'HIDROGRAFIA'
                ? 'bg-sky-50/95 border-[#1d70b8] ring-2 ring-sky-400/50 shadow-sm'
                : 'bg-white border-slate-200/90 hover:bg-sky-50/40 hover:border-sky-300'
            } border-l-4 border-l-[#1d70b8] shadow-xs`}
          >
            <div>
              <span className="text-slate-600 text-xs font-bold uppercase tracking-wider block">
                3. Previsão de Chuva (24h)
              </span>
              <div className="text-xl font-extrabold text-[#0369a1] leading-tight mt-0.5">
                {meteo ? `${meteo.previsao_24h_mm} mm` : '14.2 mm'}{' '}
                <span className="text-xs font-semibold text-slate-500">
                  (Prob. {meteo?.probabilidade_chuva_24h_pct || 70}%)
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-sky-100 text-[#1d70b8] flex items-center justify-center shrink-0 shadow-2xs">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
          </button>

          {/* CARD 4: SETORES SGB ATIVADOS COM GAVETA RETRÁTIL */}
          <button
            onClick={() => {
              const novoEstado = !showSetoresAtivados;
              setShowSetoresAtivados(novoEstado);
              if (novoEstado) {
                setFocusCard('CURSOS');
                sendToMap({
                  type: 'FOCUS_ALERT_AREAS',
                  codigosCriticos: situacao?.codigos_setores_criticos || [],
                  nivelAlerta: situacao?.nivel_alerta,
                  cota: situacao?.cota_efetiva_impacto_m,
                });
              } else {
                setFocusCard('TODOS');
                sendToMap({ type: 'FOCUS_MODE', mode: 'TODOS' });
              }
            }}
            title="Clique para abrir a lista detalhada dos pontos afetados e navegar pelo mapa."
            className={`text-left px-4 py-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
              showSetoresAtivados || focusCard === 'CURSOS'
                ? 'bg-emerald-50/95 border-[#589632] ring-2 ring-emerald-400/50 shadow-sm'
                : 'bg-white border-slate-200/90 hover:bg-emerald-50/40 hover:border-emerald-300'
            } border-l-4 border-l-[#589632] shadow-xs relative`}
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-600 text-xs font-bold uppercase tracking-wider block">
                  4. Setores SGB Ativados Agora
                </span>
                <span className={`text-xs px-2 py-0.5 font-black rounded-full transition-transform ${
                  showSetoresAtivados ? 'bg-[#589632] text-white rotate-180' : 'bg-emerald-100 text-[#1b4332]'
                }`}>
                  ▼
                </span>
              </div>
              <div className="text-xl font-extrabold text-[#15803d] leading-tight mt-0.5">
                {situacao ? situacao.setores_sgb_criticos_count : 12}{' '}
                <span className="text-xs font-semibold text-slate-500">
                  ({situacao ? situacao.pessoas_expostas_momento.toLocaleString('pt-BR') : '3.420'} hab.)
                </span>
              </div>
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors shadow-2xs ${
              showSetoresAtivados ? 'bg-[#589632] text-white' : 'bg-emerald-100 text-[#589632]'
            }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* ABA / GAVETA RETRÁTIL EXPANSÍVEL: PONTOS AFETADOS AGORA NA COTA VIGENTE   */}
        {/* ========================================================================= */}
        {showSetoresAtivados && (
          <div className="mt-2 pt-2 border-t border-[#1b4332] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="bg-[#081c15] text-white rounded-xl p-3.5 border border-[#1b4332] shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 mb-2.5 border-b border-[#1b4332]">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-[#93c02b] animate-pulse shrink-0" />
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 flex-wrap">
                      📍 Pontos Afetados no Momento — Cota Efetiva: {situacao?.cota_efetiva_impacto_m || 27.65}m
                      <span className="bg-[#589632]/30 text-[#93c02b] border border-[#589632]/60 text-xs px-2.5 py-0.5 rounded-full font-bold">
                        {situacao?.todos_setores_criticos?.length || situacao?.top_setores_criticos?.length || 0} Setores Identificados
                      </span>
                    </h4>
                    <p className="text-xs text-emerald-200/90 font-medium mt-0.5">
                      Poligonais SGB/CPRM atingidas diretamente pelo nível do rio e remanso no Igarapé do Mindu. Clique em qualquer local para focar no mapa.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      sendToMap({
                        type: 'FOCUS_ALERT_AREAS',
                        codigosCriticos: situacao?.codigos_setores_criticos || [],
                        nivelAlerta: situacao?.nivel_alerta,
                        cota: situacao?.cota_efetiva_impacto_m,
                      });
                    }}
                    className="px-3.5 py-1.5 bg-[#589632] hover:bg-[#93c02b] text-white hover:text-slate-950 rounded-lg font-black text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-md border border-[#93c02b]/60"
                    title="Enquadrar todas as áreas críticas no mapa simultaneamente"
                  >
                    <span>🎯</span> Enquadrar Todos
                  </button>
                  <button
                    onClick={() => setShowSetoresAtivados(false)}
                    className="w-7 h-7 rounded-lg bg-[#1b4332] hover:bg-[#d9381e] text-emerald-200 hover:text-white flex items-center justify-center text-sm font-bold transition-colors cursor-pointer border border-[#589632]/50 shadow-sm"
                    title="Fechar painel de pontos afetados"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Lista dos Setores em Grid responsivo com cartões preenchendo proporcionalmente */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-64 overflow-y-auto pr-1">
                {(situacao?.todos_setores_criticos || situacao?.top_setores_criticos || []).map((s, idx) => {
                  const grauRisco = (s.grau_risco || '').toUpperCase();
                  const isMuitoAlto = grauRisco.includes('MUITO ALTO');
                  return (
                    <div
                      key={s.cod_setor || idx}
                      onClick={() => {
                        if (s.lat && s.lng) {
                          sendToMap({
                            type: 'ZOOM_SECTOR',
                            lat: s.lat,
                            lng: s.lng,
                            cod_setor: s.cod_setor,
                          });
                        }
                      }}
                      className="group bg-[#0b241c] hover:bg-[#133527] p-3 rounded-xl border border-[#1b4332] hover:border-[#93c02b] transition-all cursor-pointer flex flex-col justify-between shadow-md hover:shadow-lg"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <span className="font-black text-white text-sm group-hover:text-[#93c02b] transition-colors block truncate" title={s.local}>
                            {s.local || 'Local não informado'}
                          </span>
                          <span className="text-xs text-emerald-200/80 font-medium">
                            {s.bairro || 'Manaus'} • <span className="text-white font-bold">{s.curso || 'Mindu'}</span>
                          </span>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-black uppercase shrink-0 ${
                            isMuitoAlto
                              ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40'
                              : 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {s.grau_risco || 'Risco'}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 bg-[#081c15] p-2 rounded-lg border border-[#1b4332] my-1.5 text-center">
                        <div>
                          <span className="text-emerald-200/75 block text-[11px] font-semibold uppercase tracking-wider">Pessoas</span>
                          <strong className="text-cyan-300 font-black text-base">{Number(s.pessoas || 0).toLocaleString('pt-BR')}</strong>
                        </div>
                        <div>
                          <span className="text-emerald-200/75 block text-[11px] font-semibold uppercase tracking-wider">Edificações</span>
                          <strong className="text-white font-black text-base">{s.edificacoes || '-'}</strong>
                        </div>
                        <div>
                          <span className="text-emerald-200/75 block text-[11px] font-semibold uppercase tracking-wider">Cota Terreno</span>
                          <strong className="text-amber-400 font-black text-base">~{s.cota_m || 27}m</strong>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1.5 text-emerald-200/80 border-t border-[#1b4332]/60 mt-1">
                        <span className="truncate max-w-[65%] text-amber-300/90 font-medium" title={s.motivo_ativacao || s.tipologia_principal}>
                          ⚠️ {s.motivo_ativacao || s.tipologia_principal}
                        </span>
                        <span className="text-[#93c02b] group-hover:translate-x-0.5 font-bold transition-transform flex items-center gap-0.5 shrink-0 text-xs">
                          Ver no Mapa →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 3. ÁREA DO MAPA EM LARGURA TOTAL + BOTÕES FLUTUANTES      */}
      {/* ========================================================= */}
      <main className="flex-1 relative w-full overflow-hidden">
        {/* MAPA OCUPANDO 100% DA LARGURA E ALTURA */}
        <iframe
          ref={iframeRef}
          src={`/mapa_oficial.html?apiUrl=${encodeURIComponent(getApiUrl())}`}
          className="w-full h-full border-0"
          title="Mapa Oficial da Sub-Bacia do Mindu"
        />

        {/* BARRA DE PESQUISA FLUTUANTE CENTRALIZADA NO MAPA (COMPACTA E TRANSLÚCIDA QGIS BASIN) */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-25 w-[85%] sm:w-[280px] md:w-[320px]">
          <div className="relative">
            <div className="bg-[#081c15]/85 hover:bg-[#081c15]/95 backdrop-blur-md text-white rounded-full border border-[#1b4332] hover:border-[#589632] shadow-xl px-3.5 py-2 flex items-center gap-2.5 transition-all focus-within:bg-[#081c15] focus-within:border-[#93c02b] focus-within:ring-2 focus-within:ring-[#93c02b]/30">
              <svg className="w-4 h-4 text-[#93c02b] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setShowSearchModal(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchModal(true);
                }}
                placeholder="Buscar bairro na Bacia do Mindu..."
                className="w-full bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none font-semibold"
              />
              {searchQuery ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchModal(false);
                  }}
                  className="text-slate-400 hover:text-white text-xs px-1.5 font-bold"
                >
                  ✕
                </button>
              ) : (
                <span className="text-[11px] text-emerald-200/90 font-mono font-bold px-2 py-0.5 rounded-full bg-[#1b4332] border border-[#589632]/50 shrink-0">
                  24 Bairros
                </span>
              )}
            </div>

            {/* Menu Dropdown Flutuante de Resultados da Busca */}
            {showSearchModal && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowSearchModal(false)}
                />
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-950/90 backdrop-blur-md rounded-xl border border-slate-700/70 shadow-2xl overflow-hidden z-20 max-h-64 overflow-y-auto divide-y divide-slate-800/60 p-1 animate-palette-in">
                  {Object.keys(coordsPorBairro)
                    .filter((b) => b.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((b) => (
                      <button
                        key={b}
                        onClick={() => navegarParaBairro(b)}
                        className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-slate-800/80 rounded-lg transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-5 h-5 rounded bg-[#589632]/25 text-[#93c02b] flex items-center justify-center shrink-0">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-100 group-hover:text-[#93c02b]">
                              {b}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 group-hover:text-[#93c02b] font-bold">
                          Ir ↵
                        </span>
                      </button>
                    ))}
                  {Object.keys(coordsPorBairro).filter((b) =>
                    b.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length === 0 && (
                    <div className="p-3 text-center text-slate-400 text-xs font-medium">
                      Nenhum bairro encontrado.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* BANNER QUANDO ESTIVER MARCANDO UM PONTO EXATO NO MAPA */}
        {pickingPointOnMap && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-slate-950/95 text-white px-5 py-2.5 rounded-full shadow-2xl border-2 border-amber-400 flex items-center space-x-3 animate-bounce">
            <span className="text-sm font-bold text-amber-300">
              🎯 Clique exatamente sobre a rua alagada no mapa!
            </span>
            <button
              onClick={() => {
                setPickingPointOnMap(false);
                setActiveTab('CIDADAO');
              }}
              className="bg-slate-800 hover:bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* DOCK VERTICAL DE ÍCONES SVG NO CANTO ESQUERDO (TAMANHO FIXO + TOOLTIP EXTERNO) */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-[#081c15]/92 backdrop-blur-md p-1.5 rounded-2xl border border-[#1b4332] shadow-2xl flex flex-col items-center gap-2">
          {[
            {
              id: 'SIMULADOR',
              label: 'Simulador & Filtros',
              badge: temFiltroAtivo ? '!' : null,
              badgeColor: 'bg-[#f39c12] text-slate-950',
              activeClass: 'bg-[#589632] text-white border-[#93c02b]',
              svg: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              ),
            },
            {
              id: 'PROGNOSIS',
              label: 'Diagnóstico & Previsão 72h',
              badge: null,
              badgeColor: '',
              activeClass: 'bg-[#f39c12] text-slate-950 border-amber-300',
              svg: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ),
            },
            {
              id: 'GRAFICOS',
              label: 'Gráficos, Desmatamento & Esgoto',
              badge: null,
              badgeColor: '',
              activeClass: 'bg-[#00a88f] text-white border-teal-300',
              svg: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              ),
            },
            {
              id: 'GERAL',
              label: 'Laudos de Risco SGB/CPRM',
              badge: totaisFiltrados.setores,
              badgeColor: 'bg-[#589632] text-white',
              activeClass: 'bg-[#589632] text-white border-[#93c02b]',
              svg: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              ),
            },
            {
              id: 'DATAHUB',
              label: 'Baixar Dados (.SHP / .CSV / .KML)',
              badge: null,
              badgeColor: '',
              activeClass: 'bg-[#1b4332] text-[#93c02b] border-[#589632]',
              svg: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              ),
            },
            {
              id: 'CIDADAO',
              label: 'Reportar Alagamento no Mapa',
              badge: relatosCount > 0 ? relatosCount : null,
              badgeColor: 'bg-[#d9381e] text-white',
              activeClass: 'bg-[#d9381e] text-white border-rose-300',
              svg: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ),
            },
            {
              id: 'TELEGRAM',
              label: 'Canal de Alertas no Telegram (QR Code)',
              badge: telegramInfo.historico.length > 0 ? telegramInfo.historico.length : null,
              badgeColor: 'bg-[#00a88f] text-slate-950',
              activeClass: 'bg-[#00a88f] text-white border-teal-300',
              svg: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              ),
            },
          ].map((btn) => {
            const isOpen = activeTab === btn.id;
            return (
              <button
                key={btn.id}
                onClick={() => toggleDrawer(btn.id)}
                className={`group relative w-11 h-11 flex items-center justify-center rounded-xl border transition-all cursor-pointer ${
                  isOpen
                    ? `${btn.activeClass} shadow-lg scale-105`
                    : 'bg-[#0b241c]/90 text-emerald-200/80 border-[#1b4332] hover:bg-[#133527] hover:text-[#93c02b] hover:border-[#589632]'
                }`}
              >
                {btn.svg}

                {/* Badge compacto no canto superior direito do botão */}
                {btn.badge !== null && (
                  <span
                    className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-extrabold rounded-full shadow border border-slate-950 ${btn.badgeColor}`}
                  >
                    {btn.badge}
                  </span>
                )}

                {/* Tooltip flutuante externo (não deforma a largura dos botões!) */}
                <span className="pointer-events-none absolute left-14 px-2.5 py-1.5 rounded-lg bg-slate-950 text-white text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-xl border border-slate-700 z-50">
                  {btn.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* CONJUNTO INFERIOR ESQUERDO: PÍLULA DE DIREITOS AUTORAIS + BOTÃO DE AJUDA (?) SEPARADO AO LADO */}
        <div className="absolute bottom-2.5 left-3 z-20 flex items-center gap-2">
          {/* 1. Pílula dos Direitos Autorais + Docs (§ v1.8) + Cadeado ADM (🔒) - Padrão QGIS Deep Basin */}
          <div className="bg-[#081c15]/90 backdrop-blur-md text-emerald-100 px-3.5 py-1.5 rounded-full border border-[#1b4332] shadow-xl flex items-center space-x-2.5 text-xs">
            <span
              onClick={() => setShowDocsModal(true)}
              className="cursor-pointer hover:text-[#93c02b] font-semibold transition-colors"
              title="Clique para abrir o Memorial Descritivo e Documentação Técnica Oficial"
            >
              © Adrielly Amaral &amp; Lucas Kzan
            </span>
            <span className="text-[#1b4332]">|</span>
            <button
              onClick={() => setShowDocsModal(true)}
              className="text-[#93c02b] hover:text-white font-extrabold cursor-pointer transition-colors"
              title="Memorial Descritivo e Embasamento Científico"
            >
              § v1.8
            </button>
            <a
              href="/adm"
              title="Acesso Restrito: Sala de Curadoria ADM"
              className="text-emerald-400/80 hover:text-amber-300 transition-colors"
            >
              🔒
            </a>
          </div>

          {/* 2. Botão Independente de Ajuda (?) Destacado Logo Depois */}
          <button
            onClick={() => {
              setHelpStep(1);
              setShowHelpModal(true);
            }}
            title="Dúvidas de navegação? Clique para abrir o Guia Rápido de Ajuda."
            className="w-8 h-8 rounded-full bg-[#589632] hover:bg-[#93c02b] text-white hover:text-slate-950 font-black text-sm flex items-center justify-center shadow-lg border border-[#93c02b]/60 transition-all hover:scale-110 active:scale-95 cursor-pointer"
          >
            ?
          </button>
        </div>

        {/* ========================================================= */}
        {/* 4. GAVETA FLUTUANTE SOB DEMANDA (SÓ APARECE SE CLICAR!)   */}
        {/* ========================================================= */}
        {activeTab && (
          <div className="absolute top-3 right-3 bottom-3 w-[94vw] sm:w-[460px] md:w-[500px] bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-300 z-30 flex flex-col overflow-hidden animate-drawer-in">
            {/* Cabeçalho da Gaveta com Botão Fechar em Verde QGIS Noturno */}
            <div className="px-4 py-3 bg-[#081c15] text-white border-b border-[#1b4332] flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <span className="text-base">
                  {activeTab === 'SIMULADOR' && '🌊'}
                  {activeTab === 'PROGNOSIS' && '⚡'}
                  {activeTab === 'GRAFICOS' && '📊'}
                  {activeTab === 'GERAL' && '📋'}
                  {activeTab === 'DATAHUB' && '📦'}
                  {activeTab === 'CIDADAO' && '📱'}
                  {activeTab === 'TELEGRAM' && '✈️'}
                </span>
                <h3 className="text-sm font-black uppercase tracking-wider text-emerald-100">
                  {activeTab === 'SIMULADOR' && 'Simulador Altimétrico & Filtros Espaciais'}
                  {activeTab === 'PROGNOSIS' && 'Diagnóstico em Tempo Real & Prognóstico 72h'}
                  {activeTab === 'GRAFICOS' && 'Gráficos: Risco, Desmatamento (NDVI) & Saneamento'}
                  {activeTab === 'GERAL' && `Laudos Técnicos SGB/CPRM (${totaisFiltrados.setores} áreas)`}
                  {activeTab === 'DATAHUB' && 'Hub de Extração de Dados (.CSV, .SHP, .GeoJSON, .KML)'}
                  {activeTab === 'CIDADAO' && 'Portal do Cidadão — Reportar Foco no Mapa'}
                  {activeTab === 'TELEGRAM' && 'Canal de Alertas no Telegram — Zero Cadastro'}
                </h3>
              </div>
              <button
                onClick={() => setActiveTab(null)}
                className="bg-[#1b4332] hover:bg-[#d9381e] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-[#589632]/50 shadow-sm"
                title="Fechar painel e voltar ao mapa limpo"
              >
                ✕ Fechar
              </button>
            </div>

            {/* CONTEÚDO 1: SIMULADOR ALTIMÉTRICO & FILTROS ESPACIAIS */}
            {activeTab === 'SIMULADOR' && (
              <div className="p-4 overflow-y-auto space-y-4 flex-1 text-sm">
                <div className="p-4 rounded-xl bg-[#081c15] text-white border border-[#1b4332] space-y-3.5 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-[#93c02b]">
                      🌊 1. Simulador de Cota &amp; Chuva Torrencial
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setCotaSimulada(30.02);
                          setChuvaSimulada(50);
                          carregarTelemetria(30.02, 50);
                        }}
                        className="text-xs font-black bg-gradient-to-r from-red-600 to-amber-600 text-white px-2.5 py-1 rounded shadow-sm hover:brightness-110 cursor-pointer flex items-center gap-1"
                        title="Modo Apresentação / Banca: pré-carrega de imediato o cenário recorde da grande cheia de 2021 (30,02 m) com tempestade de 50 mm/h"
                      >
                        <span>🏛️ Cheia Recorde 2021</span>
                      </button>
                      {(cotaSimulada !== null || chuvaSimulada !== null) && (
                        <button
                          onClick={() => {
                            setCotaSimulada(null);
                            setChuvaSimulada(null);
                            carregarTelemetria(null, null);
                            sendToMap({ type: 'SIMULATE_COTA', reset: true });
                          }}
                          className="text-xs bg-[#589632] hover:bg-[#93c02b] text-white hover:text-slate-950 font-bold px-2.5 py-1 rounded cursor-pointer transition-colors"
                        >
                          Tempo Real
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1.5 font-medium">
                      <span className="text-slate-300">Cota Altimétrica / Nível do Rio:</span>
                      <span className="font-black text-[#93c02b]">
                        {cotaSimulada !== null
                          ? `${cotaSimulada}m (Simulado)`
                          : `${situacao?.cota_rio_negro_m || 27.65}m (Real)`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="60"
                      step="1"
                      value={
                        cotaSimulada !== null
                          ? cotaSimulada
                          : Math.round(situacao?.cota_rio_negro_m || 28)
                      }
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setCotaSimulada(val);
                        carregarTelemetria(val, chuvaSimulada);
                      }}
                      className="w-full accent-blue-500 cursor-pointer h-2 bg-[#1b4332] rounded-lg"
                    />
                    <div className="flex justify-between text-xs text-emerald-200/80 font-medium mt-1">
                      <span>15m (Vazante)</span>
                      <span>30m (Cheia Histórica)</span>
                      <span>60m (Encostas)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1.5 font-medium">
                      <span className="text-slate-300">Chuva Torrencial na Bacia:</span>
                      <span className="font-black text-amber-400">
                        {chuvaSimulada !== null
                          ? `${chuvaSimulada} mm/h`
                          : `${meteo?.chuva_momento_mm_h || 0} mm/h (Real)`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="80"
                      step="5"
                      value={
                        chuvaSimulada !== null
                          ? chuvaSimulada
                          : Math.round(meteo?.chuva_momento_mm_h || 0)
                      }
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setChuvaSimulada(val);
                        carregarTelemetria(cotaSimulada, val);
                      }}
                      className="w-full accent-amber-500 cursor-pointer h-2 bg-[#1b4332] rounded-lg"
                    />
                    <div className="flex justify-between text-xs text-emerald-200/80 font-medium mt-1">
                      <span>0 mm/h</span>
                      <span>30 mm/h (Alerta)</span>
                      <span>80 mm/h (Extremo)</span>
                    </div>
                  </div>
                </div>

                {/* Filtros Espaciais do Mapa */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-black uppercase tracking-wider text-slate-800 text-xs">
                      🔍 2. Filtrar Camadas do Mapa
                    </span>
                    {temFiltroAtivo && (
                      <button
                        onClick={limparFiltros}
                        className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
                      >
                        Limpar Tudo
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block font-bold text-slate-700 text-xs mb-1">
                        Compartimento Hidrológico:
                      </label>
                      <select
                        value={filtroCurso}
                        onChange={(e) => setFiltroCurso(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-600"
                      >
                        <option value="TODOS">Todos os Cursos (Bacia Inteira)</option>
                        <option value="alto_curso">Alto Curso (Nascentes / Zona Leste-Norte)</option>
                        <option value="medio_curso">Médio Curso (Corredor / Centro-Sul)</option>
                        <option value="baixo_curso">Baixo Curso (Foz / Repiquete São Raimundo)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 text-xs mb-1">
                        Grau de Risco (SGB/CPRM):
                      </label>
                      <select
                        value={filtroGrau}
                        onChange={(e) => setFiltroGrau(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-600"
                      >
                        <option value="TODOS">Grau de Risco: Todos (79 setores)</option>
                        <option value="Muito alto">🔴 Risco Muito Alto (11 setores)</option>
                        <option value="Alto">🟠 Risco Alto (68 setores)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 text-xs mb-1">
                        Tipologia do Processo:
                      </label>
                      <select
                        value={filtroTipologia}
                        onChange={(e) => setFiltroTipologia(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-600"
                      >
                        <option value="TODOS">Tipologia: Todas</option>
                        <option value="Deslizamento">⛰️ Deslizamento (59)</option>
                        <option value="Enchente">🌊 Enchente (8)</option>
                        <option value="Alagamento">🌧️ Alagamento (5)</option>
                        <option value="Erosão">🏜️ Erosão / Ravina (4)</option>
                        <option value="Inundação">💧 Inundação (3)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 text-xs mb-1">
                        Bairro Específico:
                      </label>
                      <select
                        value={filtroBairro}
                        onChange={(e) => setFiltroBairro(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-600"
                      >
                        <option value="TODOS">Bairro: Todos</option>
                        {listaBairros.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CONTEÚDO 2: DIAGNÓSTICO EM TEMPO REAL & PROGNÓSTICO 72H */}
            {activeTab === 'PROGNOSIS' && (
              <div className="p-4 overflow-y-auto space-y-4 flex-1 text-sm">
                {/* Banner de Ação do Alerta no Mapa */}
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-between gap-3 shadow-xs">
                  <div>
                    <span className="font-black text-amber-950 uppercase text-xs block">
                      🚨 Visualização Ativa no Mapa
                    </span>
                    <span className="text-xs text-amber-900 font-medium">
                      O mapa está destacando os setores críticos ativados pela cota e chuva atuais.
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      sendToMap({
                        type: 'FOCUS_ALERT_AREAS',
                        codigosCriticos: situacao?.codigos_setores_criticos || [],
                        nivelAlerta: situacao?.nivel_alerta,
                        cota: situacao?.cota_efetiva_impacto_m,
                      });
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs whitespace-nowrap transition-colors cursor-pointer shadow-xs shrink-0"
                  >
                    🎯 Re-enquadrar Áreas
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-[#081c15] text-white border border-[#1b4332] shadow-md">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-[#93c02b]">
                      1. Diagnóstico Hidrológico Atual (Tempo Real)
                    </span>
                    <span className="text-xs text-emerald-200/80 font-medium">
                      {ana?.fonte_cota?.slice(0, 38)}...
                    </span>
                  </div>
                  <p className="text-sm text-slate-100 leading-relaxed font-normal">
                    {situacao
                      ? situacao.diagnostico_texto
                      : 'Carregando diagnóstico hidrometeorológico da Bacia do Mindu...'}
                  </p>
                  <div className="grid grid-cols-3 gap-2.5 mt-3.5 pt-3 border-t border-[#1b4332] text-center">
                    <div>
                      <span className="block text-xs font-bold text-emerald-200/80 uppercase">Cota Rio Negro</span>
                      <span className="text-base font-black text-cyan-300">
                        {situacao?.cota_rio_negro_m || 27.65} m
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-emerald-200/80 uppercase">Sobreelevação Chuva</span>
                      <span className="text-base font-black text-amber-400">
                        +{situacao?.sobreelevacao_chuva_m || 0.0} m
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-emerald-200/80 uppercase">Área Inundada Cota</span>
                      <span className="text-base font-black text-rose-400">
                        {situacao?.area_inundada_estimada_km2 || 6.4} km²
                      </span>
                    </div>
                  </div>

                  {/* MINI-GRÁFICOS INTERATIVOS (SPARKLINES) DE TELEMETRIA */}
                  <div className="mt-3.5 pt-3.5 border-t border-[#1b4332] grid grid-cols-2 gap-2.5 text-left">
                    {/* Sparkline 1: Evolução da Cota 7 Dias */}
                    <div className="bg-[#0b241c] p-2.5 rounded-lg border border-[#1b4332]">
                      <div className="flex items-center justify-between text-xs mb-1 font-semibold">
                        <span className="text-emerald-200/80">Cota 7 Dias (ANA)</span>
                        <span className="text-emerald-400 font-bold">▲ +0.12m</span>
                      </div>
                      <div className="h-10 w-full flex items-end">
                        <svg className="w-full h-8 overflow-visible" viewBox="0 0 100 30" preserveAspectRatio="none">
                          <polyline
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points="0,26 16,24 33,21 50,22 66,17 83,12 100,8"
                          />
                          <circle cx="100" cy="8" r="3" fill="#38bdf8" className="animate-pulse" />
                        </svg>
                      </div>
                      <div className="flex justify-between text-[11px] text-emerald-200/70 font-medium mt-1">
                        <span>27.53m</span>
                        <span>Hoje: {situacao?.cota_rio_negro_m || 27.65}m</span>
                      </div>
                    </div>

                    {/* Sparkline 2: Barras de Chuva Horária */}
                    <div className="bg-[#0b241c] p-2.5 rounded-lg border border-[#1b4332]">
                      <div className="flex items-center justify-between text-xs mb-1 font-semibold">
                        <span className="text-emerald-200/80">Chuva Próx. Horas</span>
                        <span className="text-sky-400 font-bold">{meteo?.chuva_momento_mm_h || 0} mm/h</span>
                      </div>
                      <div className="h-10 w-full flex items-end justify-between gap-1 pt-1">
                        {[
                          { h: 'Agora', v: meteo?.chuva_momento_mm_h || 0.2, max: 10 },
                          { h: '+2h', v: 0.8, max: 10 },
                          { h: '+4h', v: 2.4, max: 10 },
                          { h: '+6h', v: 1.1, max: 10 },
                          { h: '+8h', v: 0.0, max: 10 },
                          { h: '+12h', v: 0.5, max: 10 },
                        ].map((bar, bi) => (
                          <div key={bi} className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer" title={`${bar.h}: ${bar.v} mm`}>
                            <div
                              className="w-full bg-sky-500 rounded-t group-hover:bg-sky-400 transition-all"
                              style={{ height: `${Math.max(15, Math.min(100, (bar.v / 3) * 100))}%` }}
                            />
                            <span className="text-[10px] text-emerald-200/70 font-semibold mt-0.5">{bar.h}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {meteo?.previsao_3_dias?.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 shadow-sm">
                    <h4 className="text-xs font-black uppercase text-blue-900 mb-2.5">
                      2. Previsão Hidrometeorológica (Bacia do Mindu — 72h)
                    </h4>
                    <div className="grid grid-cols-3 gap-2.5 text-center">
                      {meteo.previsao_3_dias.map((d, i) => (
                        <div key={d.data} className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-xs">
                          <div className="text-xs font-bold text-slate-600">
                            {i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : d.data}
                          </div>
                          <div className="text-base font-black text-blue-700 mt-0.5">
                            {d.chuva_prevista_mm} mm
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black uppercase text-slate-800">
                      3. Prognóstico de Impacto e Protocolo de Resposta
                    </h4>
                    <span className="text-xs font-bold text-red-600">
                      Tendência 24h: {situacao?.prognostico_24h?.tendencia || 'ESTÁVEL'}
                    </span>
                  </div>

                  {situacao?.prognostico_24h?.matriz_prognostica?.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white transition-colors shadow-xs"
                    >
                      <div className="font-black text-slate-900 text-sm">{item.compartimento}</div>
                      <div className="text-xs text-amber-800 font-bold mt-0.5">
                        Fenômeno: {item.fenomeno}
                      </div>
                      <p className="text-xs text-slate-700 mt-1 leading-relaxed">{item.impacto_previsto}</p>
                      <div className="mt-2 pt-2 border-t border-slate-200 text-xs text-emerald-900 font-medium">
                        🛡️ <b>Diretriz Defesa Civil:</b> {item.acao_defesa_civil}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CONTEÚDO 3: GRÁFICOS, DESMATAMENTO (NDVI 1990-2022) & SANEAMENTO */}
            {activeTab === 'GRAFICOS' && analytics && (
              <div id="painel-graficos-exportavel" className="p-4 overflow-y-auto space-y-5 flex-1 bg-white text-sm">
                {/* Cabeçalho de Ações e Exportação em Imagem */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 block">
                      Painel Científico &amp; Estatístico
                    </span>
                    <h4 className="text-sm font-black uppercase text-slate-900">
                      Bacia Hidrográfica do Mindu
                    </h4>
                  </div>
                  <button
                    onClick={exportarGraficosPNG}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    title="Exportar infográfico completo em imagem PNG para anexar diretamente no artigo ou apresentação"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Baixar PNG</span>
                  </button>
                </div>

                <div>
                  <h4 className="text-sm font-bold uppercase text-slate-800 mb-2">
                    Pessoas em Risco por Tipologia (SGB/CPRM)
                  </h4>
                  <div className="space-y-2.5">
                    {analytics.graficos.por_tipologia
                      .sort((a, b) => b.pessoas - a.pessoas)
                      .map((item) => {
                        const pct = Math.round((item.pessoas / 29332) * 100);
                        return (
                          <div
                            key={item.tipologia_principal}
                            onClick={() =>
                              setFiltroTipologia(
                                filtroTipologia === item.tipologia_principal
                                  ? 'TODOS'
                                  : item.tipologia_principal
                              )
                            }
                            className="cursor-pointer group"
                          >
                            <div className="flex justify-between text-xs mb-1 font-medium">
                              <span className="text-slate-700 group-hover:text-blue-600 font-semibold">
                                {item.tipologia_principal} ({item.setores} setores)
                              </span>
                              <span className="font-bold text-slate-900">
                                {item.pessoas.toLocaleString('pt-BR')} hab. ({pct}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                              <div
                                className="bg-red-500 h-full rounded-full transition-all"
                                style={{ width: `${Math.max(pct, 4)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <h4 className="text-sm font-bold uppercase text-slate-800 mb-2">
                    Distribuição por Compartimento da Bacia
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {analytics.graficos.por_curso.map((c) => (
                      <div
                        key={c.codigo_curso}
                        onClick={() =>
                          setFiltroCurso(filtroCurso === c.codigo_curso ? 'TODOS' : c.codigo_curso)
                        }
                        className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                          filtroCurso === c.codigo_curso
                            ? 'bg-blue-50 border-blue-500'
                            : 'bg-slate-50 border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-800">{c.curso}</div>
                        <div className="text-xl font-black text-red-600 mt-0.5">
                          {c.pessoas.toLocaleString('pt-BR')}
                        </div>
                        <div className="text-xs text-slate-500 font-medium">
                          moradores ({c.setores} áreas)
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <h4 className="text-sm font-bold uppercase text-slate-800 mb-2">
                    Top Bairros — Domicílios Afetados por Inundação
                  </h4>
                  <div className="space-y-2.5">
                    {analytics.graficos.bairros_inundacao.slice(0, 8).map((b) => {
                      const pct = Math.round((b.domicilios_inundacao / 6440) * 100);
                      return (
                        <div
                          key={b.NOME}
                          onClick={() =>
                            setFiltroBairro(filtroBairro === b.NOME ? 'TODOS' : b.NOME)
                          }
                          className="cursor-pointer group"
                        >
                          <div className="flex justify-between text-xs mb-1 font-medium">
                            <span className="text-slate-700 group-hover:text-blue-600 font-semibold">
                              {b.NOME} <span className="text-xs text-slate-400 font-normal">({b.ZONAS})</span>
                            </span>
                            <span className="font-bold text-amber-700">
                              {b.domicilios_inundacao.toLocaleString('pt-BR')} dom.
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div
                              className="bg-amber-500 h-full rounded-full"
                              style={{ width: `${Math.max(pct, 3)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* BLOCO OFICIAL 1: SÉRIE HISTÓRICA DE SUPRESSÃO VEGETAL E SOLO EXPOSTO (1990-2022) */}
                <div className="pt-4 border-t-2 border-slate-200 space-y-3">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-800 block">
                      Série Multitemporal Oficial (Landsat 5/9 &amp; Copernicus DEM — SIRGAS 2000)
                    </span>
                    <h4 className="text-sm font-black uppercase text-slate-900">
                      Supressão da Vegetação &amp; Solo Exposto na BH Mindu (1990–2022)
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Ao longo de 4 décadas, <b>81% da vegetação densa da bacia foi suprimida</b> pela expansão urbana desordenada, impermeabilizando as APPs:
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3 text-xs">
                    {[
                      {
                        ano: '1990',
                        densa: 37,
                        esparsa: 16,
                        solo: 19,
                        nota: 'Maior cobertura florestal ripária (Pré-boom Zona Leste)',
                      },
                      {
                        ano: '2000',
                        densa: 26,
                        esparsa: 36,
                        solo: 14,
                        nota: 'Fragmentação no Médio Curso (Novos loteamentos/ocupações)',
                      },
                      {
                        ano: '2010',
                        densa: 18,
                        esparsa: 29,
                        solo: 38,
                        nota: 'Pico crítico de exposição do solo (38%) e antropização do canal',
                      },
                      {
                        ano: '2022',
                        densa: 19,
                        esparsa: 19,
                        solo: 29,
                        nota: 'Adensamento consolidado; 81% da mata densa original perdida',
                      },
                    ].map((row) => (
                      <div key={row.ano} className="bg-white p-3 rounded-lg border border-slate-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-black text-slate-900 text-sm">
                            Década de {row.ano}
                          </span>
                          <span className="text-xs text-slate-500 italic">{row.nota}</span>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <div className="flex justify-between text-xs mb-1 font-semibold">
                              <span className="text-emerald-800">
                                🌳 Vegetação Densa (Gráfico 01)
                              </span>
                              <span className="font-bold text-emerald-700">{row.densa}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-600 h-full rounded-full"
                                style={{ width: `${row.densa}%` }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-xs mb-1 font-semibold">
                              <span className="text-amber-800">
                                🌿 Vegetação Esparsa (Gráfico 02)
                              </span>
                              <span className="font-bold text-amber-700">{row.esparsa}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-amber-500 h-full rounded-full"
                                style={{ width: `${row.esparsa}%` }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-xs mb-1 font-semibold">
                              <span className="text-red-800">
                                🏜️ Solo Exposto / Antropizado (Gráfico 03)
                              </span>
                              <span className="font-bold text-red-700">{row.solo}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-red-600 h-full rounded-full"
                                style={{ width: `${row.solo}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="text-xs text-slate-500 pt-1.5 border-t border-slate-200 leading-normal">
                      <b>Fonte Oficial Auditada:</b> SEMMAS (2019); Vidal, B. (2022 — CREA-AM 0420865525); Vilhena, F. da S. (UFAM, 2023) — <i>Estudo Técnico Projeto Viva Mindu (2024), p. 49–55</i>.
                    </div>
                  </div>
                </div>

                {/* BLOCO OFICIAL 2: DÉFICIT DE SANEAMENTO BÁSICO NA BACIA DO MINDU */}
                <div className="pt-4 border-t-2 border-slate-200 space-y-3">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-blue-800 block">
                      Infraestrutura Sanitária &amp; Poluição Hídrica Oficial
                    </span>
                    <h4 className="text-sm font-black uppercase text-slate-900">
                      Indicadores de Água e Esgoto na Bacia do Mindu
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-center text-xs">
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                      <span className="text-xs font-bold uppercase text-red-800 block">
                        Coleta Formal de Esgoto
                      </span>
                      <span className="text-2xl font-black text-red-600">20%</span>
                      <span className="block text-xs text-slate-600 mt-1">
                        80% sem rede formal (fossas / despejo no igarapé)
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                      <span className="text-xs font-bold uppercase text-amber-900 block">
                        Eficiência ETE Timbiras
                      </span>
                      <span className="text-2xl font-black text-amber-700">50%</span>
                      <span className="block text-xs text-slate-600 mt-1">
                        Trata apenas metade do volume coletado na Cidade Nova
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                      <span className="text-xs font-bold uppercase text-blue-900 block">
                        Água Potável Contínua
                      </span>
                      <span className="text-2xl font-black text-blue-700">70%</span>
                      <span className="block text-xs text-slate-600 mt-1">
                        20% a 30% com déficit em ocupações irregulares
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-100 border border-slate-300">
                      <span className="text-xs font-bold uppercase text-slate-700 block">
                        Perdas na Rede de Água
                      </span>
                      <span className="text-2xl font-black text-slate-800">Até 50%</span>
                      <span className="block text-xs text-slate-600 mt-1">
                        Vazamentos, ligações informais e submedição
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-normal">
                    <b>Fonte Oficial Auditada:</b> IBGE (Estudos de Impacto Ambiental: BH Mindu, 2021); Águas de Manaus &amp; PROAMA (2022 — ETA Ponta das Lajes 7.200 m³/h + PROAMA 5.500 m³/h); Prefeitura de Manaus (Relatório Técnico ETE Timbiras, 2021); Souza et al. (2020) — <i>Projeto Viva Mindu (2024), p. 14–18</i>.
                  </div>
                </div>
              </div>
            )}

            {/* CONTEÚDO 4: LAUDOS SGB/CPRM */}
            {activeTab === 'GERAL' && (
              <div className="flex-1 flex flex-col overflow-hidden text-sm">
                <div className="p-3 border-b border-gray-200 bg-white shadow-xs">
                  <input
                    type="text"
                    value={buscaTexto}
                    onChange={(e) => setBuscaTexto(e.target.value)}
                    placeholder="🔎 Buscar rua, bairro, cota ou palavra-chave no laudo..."
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>

                {setorSelecionado && (
                  <div className="p-3.5 bg-slate-900 text-white border-b border-slate-700 text-xs shrink-0 shadow-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="px-2 py-0.5 rounded bg-red-600 text-xs font-black uppercase mr-2">
                          {setorSelecionado.grau_risco}
                        </span>
                        <span className="font-bold text-blue-300 text-sm">
                          {setorSelecionado.local} ({setorSelecionado.bairro} — Cota {setorSelecionado.cota_m}m)
                        </span>
                      </div>
                      <button
                        onClick={() => setSetorSelecionado(null)}
                        className="text-slate-400 hover:text-white text-xs px-1 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-xs text-slate-200 mt-2 leading-relaxed">
                      <b>Laudo SGB/CPRM:</b> {setorSelecionado.descricao}
                    </p>
                    <p className="text-xs text-emerald-300 mt-1.5 leading-relaxed">
                      <b>Ação Recomendada:</b> {setorSelecionado.intervencao}
                    </p>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                  {setoresFiltrados.map((s) => (
                    <div
                      key={s.cod_setor}
                      onClick={() => focarSetorNoMapa(s)}
                      className={`p-3.5 cursor-pointer transition-colors hover:bg-blue-50/60 ${
                        setorSelecionado?.cod_setor === s.cod_setor
                          ? 'bg-blue-50 border-l-4 border-l-blue-600'
                          : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="font-bold text-sm text-slate-900">{s.local}</div>
                        <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold border border-slate-300">
                            ⛰️ Cota {s.cota_m}m
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-black ${
                              s.grau_risco.toLowerCase().includes('muito')
                                ? 'bg-red-100 text-red-800 border border-red-300'
                                : 'bg-orange-100 text-orange-800 border border-orange-300'
                            }`}
                          >
                            {s.grau_risco}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-600 mt-1.5">
                        <span>
                          📍 <b>{s.bairro}</b> ({s.curso}) •{' '}
                          <span className="text-amber-800 font-semibold">{s.tipologia}</span>
                        </span>
                        <span className="font-bold text-red-600">
                          {s.pessoas} pessoas ({s.edificacoes} edif.)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CONTEÚDO 5: HUB DE EXTRAÇÃO MULTI-FORMATO */}
            {activeTab === 'DATAHUB' && (
              <div className="p-4 overflow-y-auto space-y-4 flex-1 text-sm">
                <div className="p-3.5 rounded-xl bg-slate-900 text-white border border-slate-700 shadow-md">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-400 block mb-1">
                    📦 IDE &amp; Hub de Extração Multi-Formato (On-the-Fly)
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed font-normal">
                    Selecione a base oficial ou conector online externo abaixo para converter em memória e baixar nos formatos <b>.CSV</b>, <b>.GeoJSON</b>, <b>.Shapefile (.ZIP)</b>, <b>.GeoPackage (.GPKG)</b> ou <b>.KML</b>.
                  </p>
                </div>

                <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 shadow-xs">
                  <div>
                    <label className="block font-bold text-slate-700 text-xs mb-1.5">
                      1. Escolha a Base de Dados ou Conector Online:
                    </label>
                    <select
                      value={hubDataset}
                      onChange={(e) => setHubDataset(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
                    >
                      <optgroup label="🌐 Conectores Externos (Consultados Online via API)">
                        <option value="clima_hidrologia_online">
                          🌧️ Série Histórica Climática &amp; Hidrológica (API Open-Meteo / ANA)
                        </option>
                        <option value="saude_infodengue_online">
                          🏥 Vigilância Epidemiológica — Dengue &amp; Clima em Manaus (API InfoDengue Fiocruz)
                        </option>
                        <option value="equipamentos_osm_online">
                          🏫 Escolas, Hospitais e UBSs na Bacia do Mindu (API OpenStreetMap Overpass)
                        </option>
                      </optgroup>
                      <optgroup label="🗺️ Acervo Geoespacial Oficial da Bacia do Mindu">
                        <option value="areas_risco_sgb">
                          ⚠️ Polígonos e Laudos de Risco Geológico/Hidrológico (SGB/CPRM — 79 áreas)
                        </option>
                        <option value="domicilios_inundacao">
                          🏠 Pontos de Domicílios Afetados por Inundação + Cota Hipsométrica (17.964 pts)
                        </option>
                        <option value="setores_censitarios_ibge">
                          📊 Malha de Setores Censitários IBGE recortados na Bacia (875 polígonos)
                        </option>
                        <option value="bairros_mindu">
                          🏘️ Limites de Bairros da Bacia + Contagem de Inundações (17 bairros)
                        </option>
                        <option value="rede_drenagem">
                          💧 Rede de Drenagem Oficial do Igarapé do Mindu (1.294 trechos / 175 km)
                        </option>
                        <option value="compartimentos_bacia">
                          📐 Compartimentos Hidrológicos (Alto, Médio e Baixo Curso)
                        </option>
                      </optgroup>
                    </select>
                  </div>

                  {(hubDataset === 'domicilios_inundacao' || hubDataset === 'areas_risco_sgb') && (
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="font-semibold text-slate-700">
                          Filtrar por Cota Altimétrica Máxima (Hipsometria):
                        </span>
                        <span className="font-bold text-blue-700">Até {hubCotaMax}m de altitude</span>
                      </div>
                      <input
                        type="range"
                        min="15"
                        max="115"
                        step="1"
                        value={hubCotaMax}
                        onChange={(e) => setHubCotaMax(parseInt(e.target.value, 10))}
                        className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                      />
                    </div>
                  )}

                  {hubDataset === 'clima_hidrologia_online' && (
                    <div>
                      <label className="block font-semibold text-slate-700 text-xs mb-1">
                        Janela Histórica da Consulta Online:
                      </label>
                      <select
                        value={hubDiasHist}
                        onChange={(e) => setHubDiasHist(parseInt(e.target.value, 10))}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium"
                      >
                        <option value={15}>Últimos 15 dias + 3 dias de previsão</option>
                        <option value={30}>Últimos 30 dias + 3 dias de previsão</option>
                        <option value={60}>Últimos 60 dias + 3 dias de previsão</option>
                        <option value={90}>Últimos 90 dias (Trimestre completo)</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-2.5">
                  <span className="block font-bold text-slate-800 text-xs">
                    2. Baixar Pacote Convertido em Tempo Real:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <a
                      href={getHubDownloadUrl('csv')}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-lg shadow-sm transition-colors text-xs"
                    >
                      📊 .CSV (Excel)
                    </a>
                    <a
                      href={getHubDownloadUrl('shp')}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center bg-[#589632] hover:bg-[#93c02b] text-white hover:text-slate-950 font-bold py-2.5 px-3 rounded-lg shadow-sm transition-colors border border-[#93c02b]/50 text-xs"
                    >
                      🗺️ .SHP (QGIS .zip)
                    </a>
                    <a
                      href={getHubDownloadUrl('geojson')}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-3 rounded-lg shadow-sm transition-colors text-xs"
                    >
                      🌐 .GeoJSON
                    </a>
                    <a
                      href={getHubDownloadUrl('gpkg')}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 px-3 rounded-lg shadow-sm transition-colors text-xs"
                    >
                      🗄️ .GPKG (OGC)
                    </a>
                    <a
                      href={getHubDownloadUrl('kml')}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-3 rounded-lg shadow-sm transition-colors col-span-2 sm:col-span-1 text-xs"
                    >
                      🌍 .KML (Earth)
                    </a>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                  <div className="px-3.5 py-2.5 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
                    <span className="font-bold text-slate-800 text-xs">
                      3. Pré-visualização ({loadingHub ? 'Consultando...' : `${hubPreview?.total_registros || 0} registros`})
                    </span>
                    <span className="text-xs px-2.5 py-0.5 bg-white rounded border border-slate-300 text-slate-700 font-mono font-bold">
                      {hubPreview?.tipo_geometria || 'Geo'} | {hubPreview?.crs || 'EPSG:4326'}
                    </span>
                  </div>

                  {hubPreview?.amostra?.length > 0 ? (
                    <div className="overflow-x-auto max-h-48">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                            {hubPreview.colunas.slice(0, 5).map((col) => (
                              <th key={col} className="py-2 px-3 font-bold whitespace-nowrap">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {hubPreview.amostra.map((row, i) => (
                            <tr key={i} className="hover:bg-blue-50/40">
                              {hubPreview.colunas.slice(0, 5).map((col) => (
                                <td key={col} className="py-2 px-3 whitespace-nowrap max-w-[140px] truncate">
                                  {String(row[col] ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-slate-400">
                      {loadingHub ? 'Buscando e processando dados...' : 'Selecione um conjunto de dados acima.'}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CONTEÚDO 6: PORTAL DO CIDADÃO (REPORTAR FOCO NO MAPA) */}
            {activeTab === 'CIDADAO' && (
              <div className="p-4 overflow-y-auto space-y-4 flex-1 text-sm">
                <div className="p-3.5 rounded-xl bg-red-950 text-white border border-red-800 shadow-md">
                  <span className="text-xs font-black uppercase tracking-wider text-red-300 block mb-1">
                    📱 Portal Público de Ciência Cidadã — Bacia do Mindu
                  </span>
                  <p className="text-xs text-red-100 leading-relaxed font-normal">
                    Informe pontos de alagamento ou risco na sua rua. Todo relato passa por <b>Triagem Geoespacial Automática + Curadoria ADM</b> antes de ser publicado no Mapa Oficial.
                  </p>
                </div>

                {feedbackCidadao && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 space-y-1.5 shadow-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-sm">
                        ✅ Relato Recebido! Protocolo #{feedbackCidadao.protocolo}
                      </span>
                      <button
                        onClick={() => setFeedbackCidadao(null)}
                        className="text-emerald-700 font-bold text-xs px-1"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-xs">
                      Seu alerta no bairro <b>{feedbackCidadao.bairro}</b> entrou na fila de análise técnica.
                    </p>
                    <p className="text-xs font-mono bg-white px-2.5 py-1 rounded border border-emerald-200 font-bold">
                      🤖 Pré-Triagem SIG: {feedbackCidadao.score}
                    </p>
                  </div>
                )}

                <form onSubmit={enviarNovoRelato} className="space-y-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="bg-white p-3.5 rounded-lg border border-blue-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800 block text-xs">
                          1. Marcar Ponto Exato no Mapa:
                        </span>
                        <span className="text-xs text-slate-500">
                          Ao clicar, esta janela recolhe para você clicar na rua exata.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={ativarModoEscolherNoMapa}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-2 rounded-lg text-xs shadow-sm transition-colors cursor-pointer shrink-0"
                      >
                        🎯 Marcar no Mapa
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 pt-1">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-0.5">Latitude:</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={relatoLat}
                          onChange={(e) => setRelatoLat(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-mono text-xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-0.5">Longitude:</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={relatoLng}
                          onChange={(e) => setRelatoLng(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-mono text-xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-0.5">Final Tel (Opc.):</label>
                        <input
                          type="text"
                          maxLength={4}
                          placeholder="Ex: 9821"
                          value={relatoTel}
                          onChange={(e) => setRelatoTel(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 text-xs">
                        2. Bairro Detectado / Informado:
                      </label>
                      <select
                        value={relatoBairro}
                        onChange={(e) => {
                          const b = e.target.value;
                          setRelatoBairro(b);
                          if (!pontoMarcadoManualmente && coordsPorBairro[b]) {
                            setRelatoLat(coordsPorBairro[b][0]);
                            setRelatoLng(coordsPorBairro[b][1]);
                          }
                        }}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800"
                      >
                        {Object.keys(coordsPorBairro).map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1 text-xs">
                        3. Severidade / Nível da Água:
                      </label>
                      <select
                        value={relatoNivel}
                        onChange={(e) => setRelatoNivel(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800"
                      >
                        <option value="Lâmina na rua / Tornozelo (até 15cm)">
                          Lâmina na rua / Tornozelo (até 15cm)
                        </option>
                        <option value="Água no joelho (30cm a 60cm)">
                          Água no joelho (30cm a 60cm)
                        </option>
                        <option value="Água na cintura / Invadiu residência (1m)">
                          Água na cintura / Invadiu casa (~1m)
                        </option>
                        <option value="Submersão severa / Palafita atingida (>1,5m)">
                          Submersão severa / Palafita (&gt;1,5m)
                        </option>
                        <option value="Risco de Deslizamento / Trinca no Barranco">
                          ⛰️ Risco de Deslizamento / Barranco
                        </option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-xs">
                      4. Descrição da Ocorrência (Rua, ponto de referência e situação):
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={relatoDesc}
                      onChange={(e) => setRelatoDesc(e.target.value)}
                      placeholder="Ex: O igarapé transbordou próximo à ponte e a água já invadiu 4 residências..."
                      className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm text-slate-800 focus:outline-none focus:border-red-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={enviandoRelato}
                    className="w-full py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-sm transition-colors cursor-pointer"
                  >
                    {enviandoRelato ? 'Enviando...' : '📨 Enviar Relato para Triagem Técnica'}
                  </button>
                </form>
              </div>
            )}

            {/* CONTEÚDO 7: CANAL PÚBLICO DE ALERTAS NO TELEGRAM (QR CODE + FEED AO VIVO) */}
            {activeTab === 'TELEGRAM' && (
              <div className="p-4 overflow-y-auto space-y-4 flex-1 text-sm">
                <div className="p-4 rounded-xl bg-sky-950 text-white border border-sky-800 space-y-2 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-sky-300">
                      ✈️ Broadcast Comunitário — Sem Cadastro de Telefone
                    </span>
                    <span className="text-xs font-black px-2.5 py-0.5 rounded bg-emerald-500 text-slate-950 uppercase">
                      100% Gratuito
                    </span>
                  </div>
                  <p className="text-xs text-sky-100 leading-relaxed font-normal">
                    Você <b>não precisa preencher formulários nem informar seu número</b>. Basta apontar a câmera do celular para o <b>QR Code</b> abaixo ou clicar no botão para entrar no Canal Oficial de Alertas da Bacia do Mindu no Telegram!
                  </p>
                </div>

                {/* CARTÃO DO QR CODE + BOTÃO DIRETO T.ME */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-4 shadow-xs">
                  <div className="bg-white p-3 rounded-xl border-2 border-sky-500 shadow-md shrink-0">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                        telegramInfo.link_canal || 'https://t.me/alertasigweb'
                      )}`}
                      alt="QR Code Canal Telegram SIGWEB Mindu"
                      className="w-32 h-32 object-contain"
                    />
                  </div>
                  <div className="space-y-2.5 text-center sm:text-left flex-1">
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-sky-700 block">
                        Acesso Instantâneo (1 Clique)
                      </span>
                      <h4 className="text-base font-black text-slate-900">
                        Canal de Alertas Hidrológicos — Bacia do Mindu
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Receba notificações sonoras no celular sempre que um novo foco de alagamento for homologado pela Defesa Civil / Curadoria ou quando o Rio Negro / Igarapé do Mindu atingir cota de alerta.
                      </p>
                    </div>

                    <a
                      href={telegramInfo.link_canal || 'https://t.me/alertasigweb'}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-sm shadow-md transition-colors"
                    >
                      ✈️ Entrar no Canal Oficial no Telegram ↗
                    </a>
                    <div className="text-xs text-slate-500 font-mono truncate">
                      Link direto: {telegramInfo.link_canal}
                    </div>
                  </div>
                </div>

                {/* FEED PÚBLICO DOS ÚLTIMOS DISPAROS DE BROADCAST */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-slate-900 uppercase text-xs">
                      📡 Últimos Alertas Transmitidos pelo Bot ({telegramInfo.historico.length})
                    </h4>
                    <button
                      type="button"
                      onClick={carregarStatusTelegramPublico}
                      className="text-xs text-sky-700 font-bold hover:underline cursor-pointer"
                    >
                      🔄 Atualizar Feed
                    </button>
                  </div>

                  <div className="space-y-3">
                    {telegramInfo.historico.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded bg-sky-100 text-sky-900 font-black text-xs">
                            📢 {item.tipo_alerta}
                          </span>
                          <span className="text-xs text-slate-400 font-mono font-medium">
                            {item.data_disparo}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-900">
                          📍 Recorte / Bairro: {item.bairro}
                        </div>
                        <p className="text-xs text-slate-700 whitespace-pre-line bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed font-normal">
                          {item.mensagem}
                        </p>
                      </div>
                    ))}

                    {telegramInfo.historico.length === 0 && (
                      <div className="p-5 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center text-slate-500 space-y-1">
                        <p className="font-bold text-slate-700 text-sm">
                          Nenhum alerta extraordinário disparado nas últimas horas.
                        </p>
                        <p className="text-xs leading-relaxed">
                          Assim que a Sala de Curadoria ADM aprovar um foco comunitário ou emitir um Boletim Hidrológico, ele aparecerá automaticamente aqui e no Canal do Telegram.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* MODAL OCULTO DE DOCUMENTAÇÃO TÉCNICA E MEMORIAL DO SIGWEB */}
      {/* ========================================================= */}
      {showDocsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[88vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-[#93c02b]">
                  Memorial Descritivo &amp; Documentação Técnica Oficial
                </span>
                <h3 className="text-lg font-black mt-0.5">
                  PMI - MINDU (Infraestrutura de Dados Espaciais &amp; Monitoramento)
                </h3>
                <p className="text-xs text-emerald-200/80 font-medium">
                  Autores: <b>Adrielly Amaral &amp; Lucas Kzan</b>
                </p>
              </div>
              <button
                onClick={() => setShowDocsModal(false)}
                className="bg-slate-800 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>

            <div className="flex border-b border-slate-200 bg-slate-50 px-6 text-xs font-bold shrink-0">
              <button
                onClick={() => setDocSection('ARQUITETURA')}
                className={`py-3 px-4 border-b-2 transition-colors cursor-pointer ${
                  docSection === 'ARQUITETURA'
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                1. Arquitetura &amp; APIs em Tempo Real
              </button>
              <button
                onClick={() => setDocSection('METODOLOGIA')}
                className={`py-3 px-4 border-b-2 transition-colors cursor-pointer ${
                  docSection === 'METODOLOGIA'
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                2. Metodologia SIG, Projeções &amp; Fórmulas
              </button>
              <button
                onClick={() => setDocSection('DOSSIE')}
                className={`py-3 px-4 border-b-2 transition-colors cursor-pointer ${
                  docSection === 'DOSSIE'
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                3. Síntese Científica &amp; Racismo Ambiental
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-700 leading-relaxed flex-1">
              {docSection === 'ARQUITETURA' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-900 text-base">
                      1.1. Arquitetura Full-Stack de Dupla Visão (`/` Sociedade &amp; `/adm` Curadoria)
                    </h4>
                    <p>
                      O sistema <b>SIGWEB / PMI - MINDU</b> opera em arquitetura desacoplada: Frontend reativo em <b>Next.js 16.4.3 (React 19 + Tailwind CSS v4 + Ícones Vetoriais SVG)</b> sincronizado via <code>postMessage</code> com motor cartográfico <b>Leaflet.js / Heatmap</b>, e Backend científico em <b>Python 3.12 (FastAPI + GeoPandas + Shapely + PyProj + SQLAlchemy)</b>.
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-xs">
                      <li>
                        <b>Visão Pública da Sociedade (<code>/</code>):</b> Interface <i>Map-First</i> com painel unificado de telemetria, 4 KPIs clicáveis, dock lateral vetorial SVG com gavetas sob demanda (deslocando automaticamente legenda e camadas do mapa via <code>DRAWER_STATE</code>) e emissão de Boletim Situacional Oficial em PDF.
                      </li>
                      <li>
                        <b>Sala de Curadoria &amp; Comando ADM (<code>/adm</code>):</b> Ambiente restrito com Mapa de Auditoria (Pinos Amarelos = Pendentes; Pinos Vermelhos = Aprovados), fila de moderação assistida por <i>Score de Veracidade Geoespacial (IA/SIG)</i>, publicação direta da Defesa Civil e exportação do banco SQLite.
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200 space-y-1.5">
                    <h4 className="font-bold text-sky-950 text-base">
                      1.2. Motor de Broadcast Oficial no Telegram (`@sigweb_mindu_bot` &rarr; `@alertasigweb`)
                    </h4>
                    <p>
                      Integração nativa com a <b>Telegram Bot API</b> sem exigir cadastro de telefone dos moradores (conformidade LGPD): o cidadão ingressa no canal público <b><code>https://t.me/alertasigweb</code></b> via <b>QR Code</b>. Ao aprovar um relato comunitário no <code>/adm</code>, lançar um Foco Oficial ou disparar o Boletim Hidrológico, o backend transmite automaticamente o alerta HTML (<code>sendMessage</code>) e o pino exato de GPS no mapa (<code>sendLocation</code>). O texto do alerta é editável no <code>/adm</code> (com prévia), moradores podem enviar <b>foto + localização</b> direto ao bot para abrir um relato, e a Curadoria pode <b>encerrar</b> um alagamento, removendo o pino e avisando o canal.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200">
                    <h4 className="font-bold text-blue-950 text-base mb-2">
                      1.3. Conectores Externos em Tempo Real (Sem Sobrecarga de Disco)
                    </h4>
                    <ul className="list-disc pl-5 space-y-1.5 text-xs">
                      <li>
                        <b>ANA Hidrotelemetria (Estação 14990000 — Porto de Manaus):</b> Consulta automática de nível fluviométrico do Rio Negro para cálculo do efeito de remanso hidráulico (repiquete) na foz do Mindu.
                      </li>
                      <li>
                        <b>Open-Meteo / INMET Manaus (-3.0599°, -59.9678°):</b> Telemetria meteorológica ao vivo (temperatura, umidade, precipitação horária) + Previsão Hidrometeorológica de 6h, 24h e 72h + Série histórica retrospectiva (15 a 90 dias).
                      </li>
                      <li>
                        <b>InfoDengue Fiocruz / DATASUS (Geocódigo IBGE 1302603):</b> Conector epidemiológico em tempo real que extrai casos semanais de arboviroses, Nowcasting, índice de transmissão ($R_t$) e nível de alerta em Manaus.
                      </li>
                      <li>
                        <b>OpenStreetMap Overpass API:</b> Extração espacial ao vivo de equipamentos públicos críticos (Escolas, UBSs, Hospitais) dentro do Bounding Box da Bacia do Mindu.
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
                    <h4 className="font-bold text-emerald-950 text-base mb-1">
                      1.4. Motor Universal de Exportação Multi-Formato (Data Hub)
                    </h4>
                    <p>
                      A rota <code>/api/hub/download</code> converte dinamicamente em memória RAM qualquer camada oficial ou consulta online para 5 padrões de interoperabilidade: <b>.CSV (UTF-8-BOM para Excel PT-BR)</b>, <b>.GeoJSON (WGS84)</b>, <b>.Shapefile compactado (.ZIP com .shp, .shx, .dbf, .prj, .cpg)</b>, <b>.GeoPackage (.GPKG OGC)</b> e <b>.KML (Google Earth)</b>.
                    </p>
                  </div>
                </div>
              )}

              {docSection === 'METODOLOGIA' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <h4 className="font-bold text-slate-900 text-base mb-2">
                      2.1. Padronização Cartográfica e Dicionário do Acervo Oficial
                    </h4>
                    <p className="mb-2">
                      Todos os cálculos de área (km²), perímetro e extensão de canais foram processados na projeção métrica oficial <b>UTM Zona 20 Sul (EPSG:32720)</b> e reprojetados para <b>WGS 84 (EPSG:4326)</b> para publicação web:
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 text-xs">
                      <li><b>Sub-Bacia Oficial do Mindu:</b> Área = <b>64,85 km²</b> | Perímetro = <b>66,46 km</b> (topologia íntegra sem anéis internos).</li>
                      <li><b>Compartimentos Hidrológicos:</b> Alto Curso (<b>15,14 km²</b>), Médio Curso (<b>31,48 km²</b>) e Baixo Curso (<b>18,22 km²</b>).</li>
                      <li><b>Rede de Drenagem Oficial:</b> <b>1.294 trechos</b> fluviais totalizando <b>175,27 km</b> de canais.</li>
                      <li><b>Áreas de Risco SGB/CPRM (2024):</b> <b>79 polígonos</b> oficiais expondo <b>29.332 moradores</b> e <b>7.333 edificações</b>.</li>
                      <li><b>Domicílios Inundados x Hipsometria:</b> <b>17.964 pontos</b> de domicílios cruzados via Spatial Join com <b>119.471 polígonos altimétricos</b> (cotas de <b>5m a 115m</b>).</li>
                      <li><b>Malha Censitária IBGE:</b> <b>875 setores censitários</b> distribuídos em <b>21 bairros</b> do Censo 2022 (17 bairros no recorte direto BHM).</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
                    <h4 className="font-bold text-amber-950 text-base mb-1">
                      2.2. Equação do Modelo de Diagnóstico e Prognóstico Altimétrico
                    </h4>
                    <p>
                      A Cota Efetiva de Impacto (<b>C_efetiva = C_RioNegro + ΔH_chuva</b>) combina a cota hidrométrica do Rio Negro com a sobreelevação hidrodinâmica gerada pela chuva na bacia impermeabilizada (<b>ΔH_chuva = 0,065 × P_inst + 0,018 × P_24h</b>). Todo setor ou imóvel com altitude de terreno menor ou igual a <b>C_efetiva</b> entra automaticamente em alerta no simulador e no mapa.
                    </p>
                  </div>
                </div>
              )}

              {docSection === 'DOSSIE' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-red-50/70 border border-red-200">
                    <h4 className="font-bold text-red-950 text-base mb-1">
                      3.1. A Prova Empírica do Racismo Ambiental na Bacia do Mindu
                    </h4>
                    <p>
                      O cruzamento espacial exato dos <b>17.964 domicílios inundados</b> demonstra que apenas 5 bairros periféricos das Zonas Norte e Leste — <b>Cidade Nova (6.440)</b>, <b>São José Operário (3.749)</b>, <b>Jorge Teixeira (2.712)</b>, <b>Coroado (1.962)</b> e <b>Tancredo Neves (1.714)</b> — concentram <b>16.577 residências atingidas (92,28% do total da bacia)</b>. Enquanto isso, bairros nobres do Médio Curso (<b>Parque 10: 370</b>, <b>Aleixo: 346</b>, <b>Flores: 233</b>) somam apenas <b>5,28%</b> dos imóveis atingidos.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                    <h4 className="font-bold text-emerald-950 text-base">
                      3.2. Supressão Vegetal (NDVI 1990–2022), Saneamento e Unidades de Conservação
                    </h4>
                    <ul className="list-disc pl-5 space-y-1.5 text-xs">
                      <li>
                        <b>Perda de 81% da Floresta Densa (SEMMAS, 2019; Vidal, 2022; Vilhena, UFAM 2023):</b> A vegetação densa da bacia caiu de <b>37% (1990)</b> para <b>26% (2000)</b>, <b>18% (2010)</b> e <b>19% (2022)</b>, enquanto o solo exposto atingiu pico de <b>38% (2010)</b> e <b>29% (2022)</b>.
                      </li>
                      <li>
                        <b>Déficit Crítico de Saneamento (IBGE, 2021; Águas de Manaus/PROAMA, 2022; Souza et al., 2020):</b> Apenas <b>20% das residências</b> da bacia possuem coleta formal de esgoto; a <b>ETE Timbiras</b> (Cidade Nova) trata apenas <b>50% do volume coletado</b>; a cobertura de água contínua é de <b>70%</b> com até <b>50% de perdas na rede</b>.
                      </li>
                      <li>
                        <b>Marcos Legais e Áreas Protegidas na Bacia:</b> <b>Parque Municipal Nascentes do Mindu</b> (16,2 ha — Decreto nº 8.351/2006), <b>Corredor Ecológico Urbano do Mindu</b> (1.200 ha e 10 km — Decreto nº 9.329/2007 e Plano Diretor LC nº 002/2014, art. 67), <b>APA Sauim-de-Manaus</b> (1.015 ha — Decreto nº 4.094/2018), <b>Parque Municipal do Mindu</b> (Lei nº 219/1993), <b>Reserva Florestal Adolpho Ducke / MUSA</b> (Lei Estadual nº 41/1963 — INPA) e <b>Comitê Municipal de Mudanças Climáticas</b> (Decreto nº 5.554/2023).
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-1.5">
                    <h4 className="font-bold text-blue-950 text-base">
                      3.3. Principais Referências Científicas e Institucionais Utilizadas
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 text-xs">
                      <li><b>SGB / CPRM (2024):</b> Setorização de Áreas de Alto e Muito Alto Risco Geológico e Hidrológico de Manaus (79 setores na Bacia do Mindu).</li>
                      <li><b>IBGE (2022 / 2021):</b> Malha de Setores Censitários e Limites de Bairros (Censo Demográfico 2022) e Estudos de Impacto Ambiental na BH Mindu (2021).</li>
                      <li><b>FRATEC / SEMMASCLIMA / ICLEI / UEA (2024):</b> Estudo Técnico — Diretrizes para Termo de Referência do Projeto Viva Mindu (Manaus, 94 p.).</li>
                      <li><b>VILHENA, F. da S. (2023):</b> Análise da Degradação Ambiental na APP da Sub-Bacia do Mindu (Dissertação de Mestrado em Geografia, UFAM).</li>
                      <li><b>VIDAL, B. / SEMMAS (2022):</b> Mapeamento Multitemporal de NDVI e Solo Exposto da Bacia do Mindu (1990–2022) via Landsat 5/9 e Copernicus DEM.</li>
                      <li><b>CASSIANO, K. R. M. &amp; COSTA (2012 / 2013):</b> Análise Geográfica de Áreas de Risco e Tipologia Socioespacial (Área 1, Área 2 e Área 3) na Bacia do Mindu (UFSC).</li>
                      <li><b>BARROS, H. S. (2022):</b> A Segregação Socioespacial em Manaus/AM: O Urbano para Poucos (UEA).</li>
                      <li><b>MACENA (2016) &amp; SCHERER, A. M. (2014):</b> O Igarapé do Mindu e os Desafios Ambientais de Manaus (UFAM).</li>
                      <li><b>SANTOS, Milton (1977):</b> A Natureza do Espaço / Teoria da Socioespacialidade Urbana.</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <h4 className="font-bold text-slate-900 text-base mb-1">
                      3.4. Arquivos de Documentação Salvos no Repositório (`docs/`)
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 font-mono text-xs">
                      <li>docs/01_ARQUITETURA_E_MANUAL_DO_SISTEMA.md</li>
                      <li>docs/02_DICIONARIO_DE_DADOS_E_METODOLOGIA_SIG.md</li>
                      <li>docs/03_DOSSIE_TECNICO_RACISMO_AMBIENTAL.md</li>
                      <li>README.md (Capa Oficial do Projeto)</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex justify-between items-center text-xs text-slate-600 shrink-0">
              <span>
                © Direitos Autorais Reservados: <b>Adrielly Amaral &amp; Lucas Kzan</b>
              </span>
              <a
                href={getApiUrl('/docs')}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline font-bold"
              >
                Abrir Swagger API ↗
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. MODAL GUIA RÁPIDO (?) - TUTORIAL COMPORTADO DE 3 PASSOS*/}
      {/* ========================================================= */}
      {showHelpModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-palette-in"
          onClick={() => setShowHelpModal(false)}
        >
          <div
            className="w-full max-w-md bg-slate-900 text-white rounded-2xl border border-slate-700 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Topo do Modal */}
            <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-400 font-bold text-xs flex items-center justify-center">
                  ?
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Como usar o SIGWEB Mindu
                </span>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700"
              >
                ✕ Fechar
              </button>
            </div>

            {/* Conteúdo dos 3 Passos */}
            <div className="p-5 space-y-4 text-sm">
              {helpStep === 1 && (
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-lg">
                    🌊
                  </div>
                  <h4 className="text-base font-bold text-white">
                    1. Telemetria e Nível do Rio Negro
                  </h4>
                  <p className="text-slate-200 leading-relaxed font-normal">
                    No topo do site, você acompanha a <b>Cota em Tempo Real</b> do Rio Negro (Estação ANA Porto de Manaus) e a <b>Previsão de Chuva</b>. Se o alerta mudar de cor (Verde, Laranja ou Vermelho), o sistema indica o nível de risco ativo na bacia.
                  </p>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400">
                    💡 <b>Dica:</b> Passe o mouse em qualquer item da barra superior para ler o que cada indicador significa.
                  </div>
                </div>
              )}

              {helpStep === 2 && (
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center text-lg">
                    📱
                  </div>
                  <h4 className="text-base font-bold text-white">
                    2. Ciência Cidadã (Reportar Alagamento)
                  </h4>
                  <p className="text-slate-200 leading-relaxed font-normal">
                    Clique no botão vermelho <b>&ldquo;Reportar Alagamento&rdquo;</b> no topo ou no ícone de localização na barra lateral esquerda. Você pode enviar a foto e o relato da rua alagada pelo navegador ou direto pelo nosso canal oficial do Telegram!
                  </p>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400">
                    🛡️ <b>Auditoria:</b> Todos os relatos passam por validação geoespacial antes de serem publicados no mapa.
                  </div>
                </div>
              )}

              {helpStep === 3 && (
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-lg">
                    🕹️
                  </div>
                  <h4 className="text-base font-bold text-white">
                    3. Simulador Altimétrico &amp; Gráficos
                  </h4>
                  <p className="text-slate-200 leading-relaxed font-normal">
                    Use os botões na barra vertical esquerda para abrir as gavetas:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-slate-200 text-xs">
                    <li><b>Simulador (🌊):</b> Arraste a cota para ver a mancha cobrindo os bairros ou teste o botão <i>&ldquo;Cheia Recorde 2021&rdquo;</i>.</li>
                    <li><b>Gráficos (📊):</b> Estatísticas de saneamento, supressão vegetal (NDVI) e botão para baixar imagem PNG.</li>
                    <li><b>Busca de Bairros:</b> Digite o nome do bairro na barra flutuante central para o mapa navegar até ele.</li>
                  </ul>
                </div>
              )}

              {/* Indicador de Passos */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <div className="flex gap-1.5">
                  {[1, 2, 3].map((step) => (
                    <button
                      key={step}
                      onClick={() => setHelpStep(step)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        helpStep === step ? 'bg-[#93c02b] w-6' : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex gap-2">
                  {helpStep > 1 && (
                    <button
                      onClick={() => setHelpStep((p) => p - 1)}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
                    >
                      ← Anterior
                    </button>
                  )}
                  {helpStep < 3 ? (
                    <button
                      onClick={() => setHelpStep((p) => p + 1)}
                      className="px-4 py-1.5 bg-[#589632] hover:bg-[#93c02b] text-white hover:text-slate-950 rounded-lg text-xs font-bold transition-colors"
                    >
                      Próximo →
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowHelpModal(false)}
                      className="px-4 py-1.5 bg-[#589632] hover:bg-[#93c02b] text-white hover:text-slate-950 rounded-lg text-xs font-bold transition-colors"
                    >
                      Entendi!
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
