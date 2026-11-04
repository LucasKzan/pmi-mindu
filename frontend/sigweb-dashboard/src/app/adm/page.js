"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import BackendStatusBanner from '../BackendStatusBanner';
import { getApiUrl } from '../config';

export default function AdminCuradoriaPage() {
  const iframeRef = useRef(null);

  // Autenticação da View Exclusiva ADM
  const [autenticado, setAutenticado] = useState(false);
  const [adminToken, setAdminToken] = useState('');
  const [senhaInput, setSenhaInput] = useState('');
  const [erroLogin, setErroLogin] = useState('');
  const [loginCarregando, setLoginCarregando] = useState(false);

  // Aba ativa dentro do Backoffice ADM: 'FILA' | 'CADASTRO_OFICIAL' | 'BANCO_DADOS'
  const [abaAdm, setAbaAdm] = useState('FILA');

  // Dados da fila de relatos comunitários
  const [relatos, setRelatos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('PENDENTE'); // 'TODOS', 'PENDENTE', 'APROVADO', 'REJEITADO'
  const [busca, setBusca] = useState('');

  // Estados para Cadastro Direto de Foco Oficial pela Defesa Civil / ADM
  const [pickingPoint, setPickingPoint] = useState(false);
  const [pontoManual, setPontoManual] = useState(false);
  const [oficialBairro, setOficialBairro] = useState('CIDADE NOVA');
  const [oficialNivel, setOficialNivel] = useState('Água na cintura / Invadiu residência (1m)');
  const [oficialDesc, setOficialDesc] = useState('');
  const [oficialLat, setOficialLat] = useState(-3.0355);
  const [oficialLng, setOficialLng] = useState(-59.9625);
  const [salvandoOficial, setSalvandoOficial] = useState(false);
  const [msgSucesso, setMsgSucesso] = useState('');

  // Estados do Motor de Broadcast no Telegram (Zero Cadastro p/ Morador)
  const [tgBotToken, setTgBotToken] = useState('');
  const [tgChatId, setTgChatId] = useState('');
  const [tgLinkCanal, setTgLinkCanal] = useState('https://t.me/alertasigweb');
  const [tgAutoDisparo, setTgAutoDisparo] = useState(true);
  const [tgBotConfigurado, setTgBotConfigurado] = useState(false);
  const [tgHistorico, setTgHistorico] = useState([]);
  const [tgChatsDescobertos, setTgChatsDescobertos] = useState([]);
  const [tgMensagemCustom, setTgMensagemCustom] = useState('');
  const [tgBairroAlvo, setTgBairroAlvo] = useState('TODA A BACIA DO MINDU');
  const [tgFeedback, setTgFeedback] = useState('');
  const [tgCarregando, setTgCarregando] = useState(false);
  const [tgTemplateAlerta, setTgTemplateAlerta] = useState('');
  const [historico, setHistorico] = useState(null);
  const [histDias, setHistDias] = useState(30);
  const [tgTemplatePadrao, setTgTemplatePadrao] = useState('');
  const [mostrarConfigTecnicaBot, setMostrarConfigTecnicaBot] = useState(false);
  const [mostrarModeloMsg, setMostrarModeloMsg] = useState(false);
  const [mostrarLogDisparos, setMostrarLogDisparos] = useState(false);

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

  const sendToMap = (payload) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(payload, '*');
    }
  };

  const carregarRelatos = () => {
    setLoading(true);
    fetch(getApiUrl('/api/adm/relatos'))
      .then((r) => r.json())
      .then((d) => {
        if (d?.relatos) {
          setRelatos(d.relatos);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const carregarTelegramStatus = (tokenAtivo = adminToken) => {
    const url = getApiUrl(`/api/telegram/status?incluir_token_adm=true&senha_adm=${encodeURIComponent(tokenAtivo || '')}`);
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (d) {
          setTgBotToken(d.bot_token || '');
          setTgChatId(d.chat_id || '');
          setTgLinkCanal(d.link_canal || 'https://t.me/alertasigweb');
          setTgAutoDisparo(Boolean(d.auto_disparo));
          setTgBotConfigurado(Boolean(d.bot_configurado));
          setTgHistorico(d.historico || []);
          setTgTemplateAlerta(d.template_alerta || d.template_padrao || '');
          setTgTemplatePadrao(d.template_padrao || '');
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (autenticado) {
      carregarRelatos();
      carregarTelegramStatus(adminToken);
    }
  }, [autenticado]);

  useEffect(() => {
    if (autenticado && abaAdm === 'HISTORICO') {
      fetch(getApiUrl(`/api/adm/historico?dias=${histDias}`))
        .then((r) => r.json())
        .then((d) => setHistorico(d))
        .catch(() => {});
    }
  }, [autenticado, abaAdm, histDias, relatos]);

  useEffect(() => {
    document.title = 'Curadoria ADM | SIGWEB — Bacia do Mindu';
    const handleMessage = (event) => {
      if (event.data?.type === 'MAP_CLICK_COORDS') {
        setOficialLat(event.data.lat);
        setOficialLng(event.data.lng);
        if (event.data.bairroDetectado) {
          setOficialBairro(event.data.bairroDetectado.toUpperCase());
        }
        setPontoManual(true);
        setPickingPoint(false);
        setAbaAdm('CADASTRO_OFICIAL');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!senhaInput.trim()) return;
    setLoginCarregando(true);
    setErroLogin('');
    try {
      const resp = await fetch(getApiUrl('/api/adm/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha: senhaInput.trim() }),
      });
      const data = await resp.json();
      if (resp.ok && data.autenticado) {
        setAdminToken(data.token || senhaInput.trim());
        setAutenticado(true);
        setErroLogin('');
      } else {
        setErroLogin(data.detail || 'Credencial inválida! Digite a senha correta de administrador.');
      }
    } catch {
      setErroLogin('Falha ao conectar com o servidor para autenticação.');
    } finally {
      setLoginCarregando(false);
    }
  };

  const moderarItem = async (id, acao, lat, lng) => {
    try {
      const resp = await fetch(getApiUrl(`/api/adm/relatos/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao, senha_adm: adminToken }),
      });
      if (resp.ok) {
        carregarRelatos();
        carregarTelegramStatus(adminToken);
        sendToMap({
          type: 'RELOAD_RELATOS',
          incluirPendentes: true,
          lat: acao === 'APROVADO' ? lat : undefined,
          lng: acao === 'APROVADO' ? lng : undefined,
          customText:
            acao === 'APROVADO'
              ? `✅ Relato #${id} APROVADO e publicado no Mapa da Sociedade!`
              : `❌ Relato #${id} atualizado para ${acao}.`,
        });
      }
    } catch (err) {
      console.error('Erro ao moderar:', err);
    }
  };

  const aprovarLoteAltaConfiabilidade = async () => {
    try {
      const resp = await fetch(getApiUrl(`/api/adm/aprovar-lote-alta?senha_adm=${encodeURIComponent(adminToken)}`), {
        method: 'POST',
      });
      if (resp.ok) {
        carregarRelatos();
        carregarTelegramStatus(adminToken);
        sendToMap({
          type: 'RELOAD_RELATOS',
          incluirPendentes: true,
          customText: '⚡ Todos os relatos pendentes de ALTA CONFIABILIDADE foram aprovados!',
        });
      }
    } catch (err) {
      console.error('Erro ao aprovar em lote:', err);
    }
  };

  const limparBancoRelatos = async (apenasPendentes) => {
    const msg = apenasPendentes
      ? 'Confirma a limpeza de todos os relatos PENDENTES da fila?'
      : 'ATENÇÃO: Isso removerá TODOS os focos comunitários (incluindo os aprovados) do mapa público. Confirmar?';
    if (!window.confirm(msg)) return;
    try {
      const resp = await fetch(
        getApiUrl(`/api/webhook/relatos?senha_adm=${encodeURIComponent(adminToken)}&apenas_pendentes=${apenasPendentes}`),
        { method: 'DELETE' }
      );
      if (resp.ok) {
        carregarRelatos();
        carregarTelegramStatus(adminToken);
        sendToMap({ type: 'RELOAD_RELATOS', incluirPendentes: true, cleared: true });
      }
    } catch (err) {
      console.error('Erro ao limpar:', err);
    }
  };

  const cadastrarFocoOficialDireto = async (e) => {
    e.preventDefault();
    if (!oficialDesc.trim()) return;
    setSalvandoOficial(true);
    setMsgSucesso('');
    try {
      const resp = await fetch(getApiUrl('/api/webhook/relato'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telefone_anonimizado: 'DEFESA-CIVIL',
          bairro_relatado: oficialBairro,
          nivel_agua_estimado: oficialNivel,
          descricao: `[OFICIAL DEFESA CIVIL] ${oficialDesc.trim()}`,
          url_foto: 'https://imgur.com/defesa_civil.jpg',
          latitude: parseFloat(oficialLat),
          longitude: parseFloat(oficialLng),
          publicar_direto_adm: true,
          senha_adm: adminToken,
        }),
      });
      if (resp.ok) {
        setOficialDesc('');
        setPontoManual(false);
        setMsgSucesso(`✅ Foco Oficial publicado imediatamente no Mapa Público (${oficialBairro})!`);
        carregarRelatos();
        sendToMap({
          type: 'RELOAD_RELATOS',
          incluirPendentes: true,
          lat: parseFloat(oficialLat),
          lng: parseFloat(oficialLng),
          customText: `🛡️ Foco Oficial publicado em ${oficialBairro}!`,
        });
      }
    } catch (err) {
      console.error('Erro ao publicar foco oficial:', err);
    } finally {
      setSalvandoOficial(false);
    }
  };

  const salvarConfigTelegram = async (e) => {
    e.preventDefault();
    setTgCarregando(true);
    setTgFeedback('');
    try {
      const resp = await fetch(getApiUrl('/api/adm/telegram/config'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_token: tgBotToken,
          chat_id: tgChatId,
          link_canal: tgLinkCanal,
          auto_disparo: tgAutoDisparo,
          template_alerta: tgTemplateAlerta,
          senha_adm: adminToken,
        }),
      });
      const d = await resp.json();
      if (resp.ok) {
        setTgFeedback(`✅ ${d.mensagem}`);
        carregarTelegramStatus(adminToken);
      } else {
        setTgFeedback(`❌ Erro: ${d.detail || 'Falha ao salvar'}`);
      }
    } catch {
      setTgFeedback('❌ Erro de conexão com o backend FastAPI.');
    } finally {
      setTgCarregando(false);
    }
  };

  const descobrirCanaisTelegram = async () => {
    if (!tgBotToken.trim()) {
      setTgFeedback('⚠️ Cole primeiro o Bot Token gerado no @BotFather!');
      return;
    }
    setTgCarregando(true);
    setTgFeedback('');
    try {
      const resp = await fetch(
        getApiUrl(`/api/adm/telegram/descobrir-chats?bot_token=${encodeURIComponent(
          tgBotToken.trim()
        )}&senha_adm=${encodeURIComponent(adminToken)}`)
      );
      const d = await resp.json();
      if (resp.ok) {
        setTgChatsDescobertos(d.chats || []);
        if (d.chats && d.chats.length > 0) {
          setTgChatId(d.chats[0].chat_id);
          if (d.chats[0].link_sugerido) setTgLinkCanal(d.chats[0].link_sugerido);
          setTgFeedback(`✅ ${d.chats.length} Canal/Grupo detectado(s) e preenchido automaticamente!`);
        } else {
          setTgFeedback(`ℹ️ ${d.dica}`);
        }
      } else {
        setTgFeedback(`❌ ${d.detail || 'Token inválido ou sem permissão.'}`);
      }
    } catch {
      setTgFeedback('❌ Erro ao consultar getUpdates no Telegram.');
    } finally {
      setTgCarregando(false);
    }
  };

  const dispararBoletimTelegram = async (tipo) => {
    setTgCarregando(true);
    setTgFeedback('');
    try {
      const resp = await fetch(getApiUrl('/api/adm/telegram/disparar-boletim'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo_boletim: tipo,
          bairro_alvo: tgBairroAlvo,
          mensagem_customizada: tgMensagemCustom,
          senha_adm: adminToken,
        }),
      });
      const d = await resp.json();
      if (resp.ok) {
        setTgFeedback(`📢 ${d.mensagem}`);
        if (tipo === 'PERSONALIZADO') setTgMensagemCustom('');
        carregarTelegramStatus(adminToken);
      } else {
        setTgFeedback(`❌ ${d.detail || 'Erro ao disparar boletim.'}`);
      }
    } catch {
      setTgFeedback('❌ Erro de conexão ao disparar boletim.');
    } finally {
      setTgCarregando(false);
    }
  };

  const previewAlertaHtml = useMemo(() => {
    const exemplo = {
      '{bairro}': 'CIDADE NOVA',
      '{nivel_agua}': 'Na cintura',
      '{descricao}': 'Rua totalmente alagada, carros ilhados.',
      '{lat}': '-3.03550',
      '{lng}': '-59.96250',
      '{score}': '✅ ALTA CONFIABILIDADE (A 320m do setor SGB)',
    };
    let t = tgTemplateAlerta || '';
    Object.entries(exemplo).forEach(([k, v]) => {
      t = t.split(k).join(v);
    });
    t = t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    t = t.replace(/&lt;(\/?)(b|i|u|code)&gt;/g, '<$1$2>');
    return t.replace(/\n/g, '<br/>');
  }, [tgTemplateAlerta]);

  const kpis = useMemo(() => {
    const pendentes = relatos.filter((r) => r.status === 'PENDENTE').length;
    const aprovados = relatos.filter((r) => r.status === 'APROVADO').length;
    const rejeitados = relatos.filter((r) => r.status === 'REJEITADO').length;
    const encerrados = relatos.filter((r) => r.status === 'ENCERRADO').length;
    const altaConf = relatos.filter(
      (r) => r.status === 'PENDENTE' && r.score_veracidade?.includes('ALTA')
    ).length;
    return { total: relatos.length, pendentes, aprovados, rejeitados, encerrados, altaConf };
  }, [relatos]);

  const relatosFiltrados = useMemo(() => {
    return relatos.filter((r) => {
      if (filtroStatus !== 'TODOS' && r.status !== filtroStatus) return false;
      if (busca.trim() !== '') {
        const q = busca.toLowerCase();
        const match =
          r.bairro?.toLowerCase().includes(q) ||
          r.descricao?.toLowerCase().includes(q) ||
          r.nivel_agua?.toLowerCase().includes(q) ||
          String(r.id).includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [relatos, filtroStatus, busca]);

  // =====================================================================
  // TELA DE LOGIN MINIMALISTA QUANDO AINDA NÃO AUTENTICADO EM /adm
  // =====================================================================
  if (!autenticado) {
    return (
      <div className="min-h-screen w-full bg-slate-950 text-white flex flex-col justify-center items-center p-4">
        <div className="max-w-sm w-full bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-8 text-center space-y-6">
          {/* Ícone Geoespacial Customizado + Título Enxuto */}
          <div className="flex flex-col items-center space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-900 border border-blue-400/30 text-white flex items-center justify-center shadow-lg shadow-blue-500/15">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8.5" stroke="#38bdf8" strokeWidth="1.6" strokeDasharray="3 2" />
                <circle cx="12" cy="12" r="4" stroke="#ffffff" strokeWidth="1.8" />
                <circle cx="12" cy="12" r="1.5" fill="#38bdf8" />
                <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22" stroke="#93c5fd" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-white">
                SIGWEB <span className="text-blue-400">- ADMINISTRADOR</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Área restrita para a Curadoria do SIGWEB
              </p>
            </div>
          </div>

          {/* Formulário Direto */}
          <form onSubmit={handleLogin} className="space-y-3.5 text-left">
            <div className="relative">
              <svg className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input
                type="password"
                autoFocus
                value={senhaInput}
                onChange={(e) => setSenhaInput(e.target.value)}
                placeholder="Senha de acesso..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            {erroLogin && (
              <p className="text-red-400 text-xs text-center font-semibold">{erroLogin}</p>
            )}

            <button
              type="submit"
              disabled={loginCarregando}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-extrabold py-2.5 rounded-xl text-sm shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {loginCarregando ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                  <span>Autenticando...</span>
                </>
              ) : (
                <span>Entrar no Painel</span>
              )}
            </button>
          </form>

          {/* Rodapé Discreto com Retorno ao Mapa */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <Link
              href="/"
              className="text-slate-400 hover:text-white font-semibold flex items-center gap-1 transition-colors"
            >
              <span>←</span>
              <span>Voltar ao Mapa</span>
            </Link>
            <span>Adrielly Amaral &amp; Lucas Kzan</span>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================================
  // SALA DE COMANDO E CURADORIA ADM DESBLOQUEADA (/adm)
  // =====================================================================
  return (
    <div className="flex flex-col h-screen w-full bg-slate-100 text-slate-800 overflow-hidden">
      <BackendStatusBanner />
      {/* 1. HEADER EXECUTIVO DO BACKOFFICE ADM */}
      <header className="h-14 bg-slate-950 text-white border-b border-slate-800/90 flex items-center justify-between px-4 shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-900 border border-blue-400/30 text-white flex items-center justify-center shadow-inner shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="8.5" stroke="#38bdf8" strokeWidth="1.8" strokeDasharray="3 2" />
              <circle cx="12" cy="12" r="4" stroke="#ffffff" strokeWidth="1.8" />
              <circle cx="12" cy="12" r="1.5" fill="#38bdf8" />
              <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22" stroke="#93c5fd" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-sm font-extrabold tracking-tight text-white">
            SIGWEB <span className="text-blue-400">- ADMINISTRADOR</span>
          </span>
        </div>

        {/* Painel Central de Status Operacional ADM & Broadcast Telegram */}
        <div className="hidden lg:flex items-center h-8 bg-slate-900/90 border border-slate-800 rounded-lg divide-x divide-slate-800 text-xs shadow-inner">
          <div
            className="flex items-center gap-2 px-3 h-full cursor-help hover:bg-slate-800/60 transition-colors"
            title="Conexão com o Telegram: status do bot oficial e canal público vinculado para disparo automático de alertas hidrológicos."
          >
            <span className={`w-2 h-2 rounded-full ${tgBotConfigurado ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="font-semibold text-slate-300">
              Telegram:{' '}
              <b className="text-sky-400">{tgChatId || '@alertasigweb'}</b>
            </span>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 h-full text-slate-300 cursor-help hover:bg-slate-800/60 transition-colors"
            title="Status da Fila de Moderação: quantidade de relatos comunitários aguardando análise (pendentes) e já homologados no mapa (publicados)."
          >
            <span className="text-amber-400 font-bold">{kpis.pendentes}</span>
            <span>pendentes</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-bold">{kpis.aprovados}</span>
            <span>publicados</span>
          </div>

          <div
            className="flex items-center gap-1.5 px-2.5 h-full text-slate-300 cursor-default"
            title="Sessão Operacional Conectada em Tempo Real."
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold tracking-tight text-emerald-400">Ao Vivo</span>
          </div>
        </div>

        {/* Botões Padronizados à Direita (h-8, rounded-lg, SVG nítidos) */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => {
              carregarRelatos();
              carregarTelegramStatus();
              sendToMap({ type: 'RELOAD_RELATOS', incluirPendentes: true });
            }}
            className="h-8 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Sincronizar fila e mapa de auditoria"
          >
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">Atualizar</span>
          </button>

          <Link
            href="/"
            className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Visão da Sociedade</span>
          </Link>

          <button
            onClick={() => {
              setAutenticado(false);
              setSenhaInput('');
            }}
            className="h-8 px-2.5 rounded-lg bg-red-500/15 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Encerrar sessão administrativa"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="hidden md:inline">Bloquear</span>
          </button>
        </div>
      </header>

      {/* 2. FAIXA COMPACTA DOS 4 CARDS DE AUDITORIA NO TOPO (IGUAL À VISÃO PÚBLICA) */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 shrink-0 shadow-xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {/* Card 1: Fila Pendente */}
          <button
            onClick={() => {
              setAbaAdm('FILA');
              setFiltroStatus('PENDENTE');
            }}
            className={`text-left px-3.5 py-2 rounded-xl border transition-all flex items-center justify-between cursor-pointer border-l-4 border-l-amber-500 ${
              filtroStatus === 'PENDENTE' && abaAdm === 'FILA'
                ? 'bg-amber-50/90 border-amber-500 ring-2 ring-amber-400/50'
                : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-amber-300'
            }`}
          >
            <div>
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block">
                1. Fila Pendente (Triagem)
              </span>
              <div className="text-xl font-black text-amber-600 leading-tight">
                {kpis.pendentes}{' '}
                <span className="text-xs font-semibold text-slate-500">
                  ({kpis.altaConf} alta conf.)
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </button>

          {/* Card 2: Publicados no Mapa */}
          <button
            onClick={() => {
              setAbaAdm('FILA');
              setFiltroStatus('APROVADO');
            }}
            className={`text-left px-3.5 py-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer border-l-4 border-l-emerald-600 ${
              filtroStatus === 'APROVADO' && abaAdm === 'FILA'
                ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-400/50'
                : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-emerald-300'
            }`}
          >
            <div>
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block">
                2. Homologados no Mapa
              </span>
              <div className="text-xl font-black text-emerald-700 leading-tight">
                {kpis.aprovados}{' '}
                <span className="text-xs font-semibold text-slate-500">pinos vermelhos</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </button>

          {/* Card 3: Broadcast Telegram */}
          <button
            onClick={() => setAbaAdm('TELEGRAM')}
            className={`text-left px-3.5 py-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer border-l-4 border-l-sky-500 ${
              abaAdm === 'TELEGRAM'
                ? 'bg-sky-50/90 border-sky-500 ring-2 ring-sky-400/50'
                : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-sky-300'
            }`}
          >
            <div>
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block">
                3. Broadcast Telegram
              </span>
              <div className="text-xl font-black text-sky-700 leading-tight">
                {tgHistorico.length}{' '}
                <span className="text-xs font-semibold text-slate-500">
                  disparos ({tgChatId || '@alertasigweb'})
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
            </div>
          </button>

          {/* Card 4: Lançar Foco Oficial */}
          <button
            onClick={() => setAbaAdm('CADASTRO_OFICIAL')}
            className={`text-left px-3.5 py-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer border-l-4 border-l-blue-600 ${
              abaAdm === 'CADASTRO_OFICIAL'
                ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-400/50'
                : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-blue-300'
            }`}
          >
            <div>
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block">
                4. Ação Direta Defesa Civil
              </span>
              <div className="text-sm font-black text-blue-700 leading-tight mt-0.5">
                Lançar Foco Oficial
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </button>
        </div>
      </div>

      {/* 3. ÁREA PRINCIPAL DIVIDIDA: MAPA DE AUDITORIA (7 COL) + MESA DE DECISÃO ADM (5 COL) */}
      <div className="flex-1 p-3 flex flex-col overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
          {/* MAPA DE AUDITORIA ADM */}
          <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-950 text-white flex flex-wrap justify-between items-center gap-2 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-800 text-blue-400 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <h3 className="font-bold text-xs tracking-wide">
                  Mapa de Auditoria Geoespacial
                </h3>
              </div>

              {/* Legenda Visual dos Pinos Integrada ao Cabeçalho do Mapa + Botão de Captura */}
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-3 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-semibold">
                  <span className="flex items-center gap-1.5 text-amber-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-amber-400/30" />
                    Pino Pendente ({kpis.pendentes})
                  </span>
                  <span className="text-slate-700">|</span>
                  <span className="flex items-center gap-1.5 text-red-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-500/30" />
                    Pino Homologado ({kpis.aprovados})
                  </span>
                </div>

                <button
                  onClick={() => {
                    setPickingPoint(true);
                    sendToMap({ type: 'START_PICK_POINT' });
                  }}
                  className={`h-8 px-3 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                    pickingPoint
                      ? 'bg-amber-400 text-slate-950 animate-pulse'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{pickingPoint ? 'Clique no Mapa...' : 'Capturar Ponto'}</span>
                </button>
              </div>
            </div>
            <div className="flex-1 relative">
              <iframe
                ref={iframeRef}
                src="/mapa_oficial.html?modo=adm"
                className="w-full h-full border-0"
                title="Mapa de Auditoria ADM"
              />
            </div>
          </div>

          {/* PAINEL DIREITO: 4 ABAS DE ADMINISTRAÇÃO COM ÍCONES VETORIAIS SVG */}
          <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            <div className="flex border-b border-slate-200 bg-slate-50 text-[11px] font-bold shrink-0">
              <button
                onClick={() => setAbaAdm('FILA')}
                className={`flex-1 py-2.5 px-1.5 border-b-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  abaAdm === 'FILA'
                    ? 'border-amber-500 text-amber-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span>Moderação ({kpis.pendentes})</span>
              </button>
              <button
                onClick={() => setAbaAdm('CADASTRO_OFICIAL')}
                className={`flex-1 py-2.5 px-1.5 border-b-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  abaAdm === 'CADASTRO_OFICIAL'
                    ? 'border-blue-600 text-blue-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Foco Oficial</span>
              </button>
              <button
                onClick={() => setAbaAdm('TELEGRAM')}
                className={`flex-1 py-2.5 px-1.5 border-b-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  abaAdm === 'TELEGRAM'
                    ? 'border-sky-500 text-sky-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
                <span>Telegram ({tgHistorico.length})</span>
              </button>
              <button
                onClick={() => setAbaAdm('HISTORICO')}
                className={`flex-1 py-2.5 px-1.5 border-b-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  abaAdm === 'HISTORICO'
                    ? 'border-violet-600 text-violet-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>📈 Histórico</span>
              </button>
              <button
                onClick={() => setAbaAdm('BANCO_DADOS')}
                className={`flex-1 py-2.5 px-1.5 border-b-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  abaAdm === 'BANCO_DADOS'
                    ? 'border-emerald-600 text-emerald-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                <span>Banco SQLite</span>
              </button>
            </div>

            {/* MÓDULO 1: FILA DE MODERAÇÃO DE RELATOS */}
            {abaAdm === 'FILA' && (
              <div className="flex-1 flex flex-col overflow-hidden p-3.5 gap-2.5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <div className="flex space-x-1">
                    {[
                      { id: 'PENDENTE', label: `Pendentes (${kpis.pendentes})` },
                      { id: 'APROVADO', label: `Aprovados (${kpis.aprovados})` },
                      { id: 'REJEITADO', label: `Rejeitados (${kpis.rejeitados})` },
                      { id: 'ENCERRADO', label: `Encerrados (${kpis.encerrados})` },
                      { id: 'TODOS', label: `Todos (${kpis.total})` },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setFiltroStatus(tab.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                          filtroStatus === tab.id
                            ? 'bg-slate-900 text-white'
                            : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {kpis.altaConf > 0 && (
                    <button
                      onClick={aprovarLoteAltaConfiabilidade}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] shadow-sm flex items-center gap-1 cursor-pointer"
                      title="Aprovar automaticamente todos os pendentes que caíram perto de setores oficiais SGB/CPRM"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Aprovar {kpis.altaConf} de Alta Conf.</span>
                    </button>
                  )}
                </div>

                <div className="relative">
                  <svg className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Filtrar relatos por bairro, rua, palavra-chave ou ID..."
                    className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-slate-800"
                  />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {relatosFiltrados.map((r) => (
                    <div
                      key={r.id}
                      className={`p-3 rounded-xl border transition-all ${
                        r.status === 'PENDENTE'
                          ? 'bg-amber-50/60 border-amber-300 shadow-xs'
                          : r.status === 'APROVADO'
                          ? 'bg-white border-emerald-300'
                          : 'bg-slate-100 border-slate-300 opacity-75'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold uppercase mr-1.5 ${
                              r.status === 'PENDENTE'
                                ? 'bg-amber-400 text-slate-950'
                                : r.status === 'APROVADO'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-600 text-white'
                            }`}
                          >
                            {r.status}
                          </span>
                          <span className="font-bold text-slate-900">
                            #{r.id} • {r.bairro}
                          </span>
                          <span className="text-[10px] text-slate-500 ml-1.5">
                            ({r.data})
                          </span>
                        </div>

                        <button
                          onClick={() =>
                            sendToMap({
                              type: 'ZOOM_SECTOR',
                              lat: r.lat,
                              lng: r.lng,
                            })
                          }
                          className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold px-2.5 py-1 rounded-lg border border-blue-200 flex items-center gap-1 cursor-pointer"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <span>Inspecionar</span>
                        </button>
                      </div>

                      <div className="mt-1.5 text-[11px] font-bold text-red-700 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>Severidade: {r.nivel_agua}</span>
                      </div>

                      <p className="mt-1 text-[11px] text-slate-800 bg-white p-2 rounded-lg border border-slate-200">
                        &ldquo;{r.descricao}&rdquo;
                      </p>

                      {r.foto && String(r.foto).startsWith('/uploads/') && (
                        <a href={getApiUrl(r.foto)} target="_blank" rel="noreferrer">
                          <img
                            src={getApiUrl(r.foto)}
                            alt={`Foto do relato #${r.id}`}
                            className="mt-1.5 w-full max-h-40 object-cover rounded-lg border border-slate-200"
                          />
                        </a>
                      )}

                      <div className="mt-1.5 text-[10px] font-mono bg-slate-900 text-emerald-300 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span><b>Parecer IA/SIG:</b> {r.score_veracidade}</span>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 font-mono">
                          {Number(r.lat).toFixed(4)}, {Number(r.lng).toFixed(4)} • Tel: {r.telefone}
                        </span>

                        <div className="flex space-x-1.5">
                          {r.status !== 'APROVADO' && (
                            <button
                              onClick={() => moderarItem(r.id, 'APROVADO', r.lat, r.lng)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] shadow-xs flex items-center gap-1 cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Aprovar</span>
                            </button>
                          )}
                          {r.status === 'APROVADO' && (
                            <button
                              onClick={() => moderarItem(r.id, 'ENCERRADO', r.lat, r.lng)}
                              className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] shadow-xs flex items-center gap-1 cursor-pointer"
                              title="Remove o pino do mapa e avisa o Canal que o alagamento acabou"
                            >
                              <span>🏁 Encerrar</span>
                            </button>
                          )}
                          {r.status !== 'REJEITADO' && (
                            <button
                              onClick={() => moderarItem(r.id, 'REJEITADO', r.lat, r.lng)}
                              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] shadow-xs flex items-center gap-1 cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              <span>Rejeitar</span>
                            </button>
                          )}
                          <button
                            onClick={() => moderarItem(r.id, 'EXCLUIR', r.lat, r.lng)}
                            className="bg-slate-200 hover:bg-red-600 text-slate-700 hover:text-white font-bold px-2 py-1 rounded-lg text-[11px] transition-colors flex items-center justify-center cursor-pointer"
                            title="Apagar definitivamente do banco SQLite"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {relatosFiltrados.length === 0 && (
                    <div className="p-8 text-center text-slate-400 border border-dashed border-slate-300 rounded-xl">
                      {loading
                        ? 'Carregando fila de relatos...'
                        : `Nenhum relato encontrado com o status "${filtroStatus}".`}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MÓDULO 2: CADASTRO DIRETO DE FOCO OFICIAL PELA DEFESA CIVIL / ADM */}
            {abaAdm === 'CADASTRO_OFICIAL' && (
              <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
                <div className="p-3.5 rounded-xl bg-blue-950 text-white border border-blue-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 block mb-1">
                    🛡️ Inserção Oficial Direta — Defesa Civil / Administração
                  </span>
                  <p className="text-[11px] text-blue-100 leading-relaxed">
                    Use este formulário para registrar pontos confirmados por equipes de campo. Diferente do formulário público da sociedade, o ponto inserido aqui <b>entra diretamente como APROVADO (Pino Vermelho)</b> no mapa público.
                  </p>
                </div>

                {msgSucesso && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold flex justify-between items-center">
                    <span>{msgSucesso}</span>
                    <button onClick={() => setMsgSucesso('')} className="text-emerald-700">
                      ✕
                    </button>
                  </div>
                )}

                <form onSubmit={cadastrarFocoOficialDireto} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="bg-white p-3 rounded-lg border border-blue-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">
                        1. Coordenada Exata da Ocorrência:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setPickingPoint(true);
                          sendToMap({ type: 'START_PICK_POINT' });
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] cursor-pointer"
                      >
                        🎯 Marcar Ponto no Mapa ao Lado
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500">Latitude:</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={oficialLat}
                          onChange={(e) => setOficialLat(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500">Longitude:</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={oficialLng}
                          onChange={(e) => setOficialLng(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">2. Bairro:</label>
                      <select
                        value={oficialBairro}
                        onChange={(e) => {
                          const b = e.target.value;
                          setOficialBairro(b);
                          if (!pontoManual && coordsPorBairro[b]) {
                            setOficialLat(coordsPorBairro[b][0]);
                            setOficialLng(coordsPorBairro[b][1]);
                          }
                        }}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 font-semibold"
                      >
                        {Object.keys(coordsPorBairro).map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">3. Tipo / Severidade:</label>
                      <select
                        value={oficialNivel}
                        onChange={(e) => setOficialNivel(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 font-medium"
                      >
                        <option value="Água na cintura / Invadiu residência (1m)">
                          🌊 Inundação Severa (~1m)
                        </option>
                        <option value="Submersão severa / Palafita atingida (>1,5m)">
                          🚨 Submersão Crítica (&gt;1,5m)
                        </option>
                        <option value="Risco de Deslizamento / Trinca no Barranco">
                          ⛰️ Interdição por Risco de Deslizamento
                        </option>
                        <option value="Água no joelho (30cm a 60cm)">
                          🌧️ Via Alagada / Trânsito Interrompido
                        </option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      4. Laudo Sumário da Equipe / Ponto de Referência:
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={oficialDesc}
                      onChange={(e) => setOficialDesc(e.target.value)}
                      placeholder="Ex: Equipe em campo constatou transbordamento na margem esquerda do Mindu próximo à ponte..."
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={salvandoOficial}
                    className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    {salvandoOficial ? 'Publicando...' : '✅ Publicar Foco Oficial Diretamente no Mapa'}
                  </button>
                </form>
              </div>
            )}

            {/* MÓDULO 3: MOTOR DE BROADCAST E CANAL OFICIAL NO TELEGRAM (ZERO CADASTRO) */}
            {abaAdm === 'TELEGRAM' && (
              <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
                <div className="p-3.5 rounded-xl bg-sky-950 text-white border border-sky-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300">
                      ✈️ Broadcast Oficial no Telegram — Zero Cadastro para Moradores
                    </span>
                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase ${
                        tgBotConfigurado
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-amber-400 text-slate-950'
                      }`}
                    >
                      {tgBotConfigurado ? '🟢 BOT ATIVO NA API' : '🟡 MODO FEED LOCAL / DEMO'}
                    </span>
                  </div>
                  <p className="text-[11px] text-sky-100 leading-relaxed">
                    Os moradores entram no Canal Público escaneando o <b>QR Code</b> na View Pública (sem preencher formulários). Sempre que você <b>Aprovar um Relato</b> ou <b>Lançar um Foco Oficial</b>, o Bot transmite o alerta + pino GPS automaticamente para todos!
                  </p>
                </div>

                {tgFeedback && (
                  <div className="p-3 rounded-xl bg-sky-50 border border-sky-300 text-sky-950 font-bold flex justify-between items-center">
                    <span>{tgFeedback}</span>
                    <button onClick={() => setTgFeedback('')} className="text-sky-700 ml-2">
                      ✕
                    </button>
                  </div>
                )}

                {/* DISPARO IMEDIATO EM 1 CLIQUE */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-slate-800 uppercase text-[11px]">
                      📢 Disparo de Boletim ou Alerta de Emergência Agora
                    </h4>
                    <button
                      type="button"
                      disabled={tgCarregando}
                      onClick={() => dispararBoletimTelegram('HIDROLOGICO')}
                      className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold px-3 py-1.5 rounded-lg text-[11px] shadow-sm transition-colors cursor-pointer"
                    >
                      📡 Disparar Boletim Hidrológico (ANA + INMET)
                    </button>
                  </div>

                  <div className="border-t border-slate-200 pt-2.5 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          Recorte / Bairro Alvo do Comunicado:
                        </label>
                        <select
                          value={tgBairroAlvo}
                          onChange={(e) => setTgBairroAlvo(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 font-semibold text-[11px]"
                        >
                          <option value="TODA A BACIA DO MINDU">🚨 TODA A BACIA DO MINDU (Geral)</option>
                          {Object.keys(coordsPorBairro).map((b) => (
                            <option key={b} value={b}>
                              📍 {b}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          disabled={tgCarregando || !tgMensagemCustom.trim()}
                          onClick={() => dispararBoletimTelegram('PERSONALIZADO')}
                          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-bold py-1.5 px-3 rounded-lg text-[11px] shadow-sm transition-colors cursor-pointer"
                        >
                          🚨 Transmitir Alerta Personalizado no Canal
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      value={tgMensagemCustom}
                      onChange={(e) => setTgMensagemCustom(e.target.value)}
                      placeholder="Digite um aviso extraordinário da Defesa Civil para disparo imediato no Canal do Telegram..."
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-[11px]"
                    />
                  </div>
                </div>

                {/* HISTÓRICO DE DISPAROS DE BROADCAST (RECOLHIDO POR PADRÃO) */}
                <button
                  type="button"
                  onClick={() => setMostrarLogDisparos((v) => !v)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  <span>📜 Log de Disparos de Broadcast ({tgHistorico.length})</span>
                  <span>{mostrarLogDisparos ? '▲' : '▼'}</span>
                </button>
                {mostrarLogDisparos && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-slate-800 uppercase text-[11px]">
                        📜 Log de Disparos de Broadcast ({tgHistorico.length})
                      </h4>
                      <button
                        type="button"
                        onClick={carregarTelegramStatus}
                        className="text-[10px] text-sky-700 font-bold hover:underline cursor-pointer"
                      >
                        🔄 Atualizar Log
                      </button>
                    </div>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {tgHistorico.map((item) => (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-lg bg-white border border-slate-200 text-[11px] space-y-1"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-sky-900">
                              #{item.id} • {item.tipo_alerta} — {item.bairro}
                            </span>
                            <span className="text-[9px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                              {item.data_disparo}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-600 whitespace-pre-line line-clamp-3">
                            {item.mensagem}
                          </p>
                          <div className="text-[9px] font-bold text-emerald-700">
                            📡 Status: {item.status_envio}
                          </div>
                        </div>
                      ))}
                      {tgHistorico.length === 0 && (
                        <p className="text-center text-slate-400 py-4 text-[11px]">
                          Nenhum disparo registrado ainda. Clique em &ldquo;Disparar Boletim Hidrológico&rdquo; acima ou aprove um relato para testar!
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* MODELO EDITÁVEL DA MENSAGEM AUTOMÁTICA DE ALERTA (RECOLHIDO POR PADRÃO) */}
                <button
                  type="button"
                  onClick={() => setMostrarModeloMsg((v) => !v)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  <span>📝 Modelo da Mensagem Automática de Alerta</span>
                  <span>{mostrarModeloMsg ? '▲' : '▼'}</span>
                </button>
                {mostrarModeloMsg && (
                <form
                  onSubmit={salvarConfigTelegram}
                  className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2"
                >
                  <h4 className="font-extrabold text-slate-800 uppercase text-[11px]">
                    📝 Modelo da Mensagem Automática de Alerta
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Texto enviado ao Canal sempre que um alerta é aprovado ou publicado. Aceita HTML do Telegram
                    (<code>&lt;b&gt;</code>, <code>&lt;i&gt;</code>, <code>&lt;code&gt;</code>) e as variáveis abaixo.
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {['{bairro}', '{nivel_agua}', '{descricao}', '{lat}', '{lng}', '{score}'].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setTgTemplateAlerta((t) => t + v)}
                        className="px-2 py-0.5 rounded bg-sky-50 border border-sky-200 text-sky-800 font-mono text-[10px] cursor-pointer hover:bg-sky-100"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={9}
                    value={tgTemplateAlerta}
                    onChange={(e) => setTgTemplateAlerta(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-[11px]"
                  />
                  <div className="rounded-xl bg-sky-50 border border-sky-200 p-2.5">
                    <span className="text-[10px] font-bold text-sky-800 uppercase block mb-1">
                      👁️ Prévia no Telegram (dados de exemplo)
                    </span>
                    <div
                      className="bg-white rounded-lg border border-sky-100 p-2.5 text-[12px] text-slate-800 leading-snug"
                      dangerouslySetInnerHTML={{ __html: previewAlertaHtml }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setTgTemplateAlerta(tgTemplatePadrao)}
                      className="text-[11px] font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      ↺ Restaurar Padrão
                    </button>
                    <button
                      type="submit"
                      disabled={tgCarregando}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-[11px] shadow-sm cursor-pointer"
                    >
                      💾 Salvar Modelo de Mensagem
                    </button>
                  </div>
                  {tgFeedback && <p className="text-[11px] font-semibold text-slate-700">{tgFeedback}</p>}
                </form>
                )}

                {/* TOGGLE DISCRETO DAS CONFIGURAÇÕES TÉCNICAS */}
                <button
                  type="button"
                  onClick={() => setMostrarConfigTecnicaBot((v) => !v)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  <span>⚙️ Vincular Bot (@BotFather) e Canal Público do Telegram ({tgChatId || '@alertasigweb'} conectado)</span>
                  <span>{mostrarConfigTecnicaBot ? '▲' : '▼'}</span>
                </button>

                {/* CONFIGURAÇÃO DO BOTFATHER E CANAL */}
                {mostrarConfigTecnicaBot && (
                <form
                  onSubmit={salvarConfigTelegram}
                  className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-slate-800 uppercase text-[11px]">
                      ⚙️ Vincular Bot (@BotFather) e Canal Público do Telegram
                    </h4>
                    <span className="text-[10px] text-slate-500">100% Gratuito • API Oficial</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[10px] text-slate-600 space-y-1">
                    <p>
                      <b>Como criar em 1 minuto no Telegram:</b> 1) Abra <b>@BotFather</b> no Telegram e envie <code>/newbot</code> para pegar o <b>Token</b>. 2) Crie um <b>Canal Público</b> (ex: <code>t.me/alerta_mindu_sigweb</code>) ou Grupo e adicione seu Bot como <b>Administrador</b>. 3) Clique em <b>🔍 Detectar Canal</b> abaixo!
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Bot Token HTTP (fornecido pelo @BotFather):
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={tgBotToken}
                        onChange={(e) => setTgBotToken(e.target.value)}
                        placeholder="Ex: 7123456789:AAHxyz..."
                        className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-[11px]"
                      />
                      <button
                        type="button"
                        onClick={descobrirCanaisTelegram}
                        className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-2.5 py-1.5 rounded-lg text-[10px] shrink-0 cursor-pointer"
                      >
                        🔍 Detectar Canal
                      </button>
                    </div>
                  </div>

                  {tgChatsDescobertos.length > 0 && (
                    <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 space-y-1">
                      <span className="text-[10px] font-bold text-emerald-900 block">
                        Canais/Grupos detectados no seu Bot (clique para usar):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {tgChatsDescobertos.map((ch) => (
                          <button
                            key={ch.chat_id_numerico}
                            type="button"
                            onClick={() => {
                              setTgChatId(ch.chat_id);
                              if (ch.link_sugerido) setTgLinkCanal(ch.link_sugerido);
                            }}
                            className="bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-1 rounded text-[10px] font-bold cursor-pointer"
                          >
                            {ch.titulo} ({ch.chat_id})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                        Chat ID ou @username do Canal:
                      </label>
                      <input
                        type="text"
                        value={tgChatId}
                        onChange={(e) => setTgChatId(e.target.value)}
                        placeholder="Ex: @alerta_mindu_sigweb ou -100..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                        Link Público do Convite (gera o QR Code):
                      </label>
                      <input
                        type="text"
                        value={tgLinkCanal}
                        onChange={(e) => setTgLinkCanal(e.target.value)}
                        placeholder="https://t.me/alertasigweb"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-[11px]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tgAutoDisparo}
                        onChange={(e) => setTgAutoDisparo(e.target.checked)}
                        className="rounded border-slate-300"
                      />
                      <span className="text-[11px] font-semibold text-slate-700">
                        Disparar automaticamente no Telegram sempre que eu Aprovar um Relato
                      </span>
                    </label>
                    <button
                      type="submit"
                      disabled={tgCarregando}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-[11px] shadow-sm cursor-pointer"
                    >
                      💾 Salvar Configuração
                    </button>
                  </div>
                </form>
                )}
              </div>
            )}

            {/* MÓDULO 4: GERENCIADOR DO BANCO DE DADOS E EXPORTAÇÃO DE AUDITORIA */}
            {/* MÓDULO: HISTÓRICO DE RELATOS POR PERÍODO */}
            {abaAdm === 'HISTORICO' && (
              <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-800 uppercase text-[11px]">📈 Histórico de Relatos</h4>
                  <div className="flex gap-1">
                    {[7, 30, 90].map((d) => (
                      <button
                        key={d}
                        onClick={() => setHistDias(d)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                          histDias === d
                            ? 'bg-slate-900 text-white'
                            : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {d} dias
                      </button>
                    ))}
                  </div>
                </div>

                {historico && (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                        <div className="text-lg font-extrabold text-slate-900">{historico.total}</div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold">Relatos</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                        <div className="text-lg font-extrabold text-emerald-700">{historico.por_status?.APROVADO || 0}</div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold">Aprovados</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-center">
                        <div className="text-lg font-extrabold text-sky-700">{historico.disparos_telegram}</div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold">Disparos TG</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-600 uppercase block mb-2">Relatos por dia</span>
                      <div className="flex items-end gap-px h-24">
                        {historico.por_dia.map((p) => {
                          const max = Math.max(1, ...historico.por_dia.map((x) => x.total));
                          return (
                            <div
                              key={p.dia}
                              title={`${p.dia}: ${p.total}`}
                              className="flex-1 bg-blue-500 hover:bg-blue-700 rounded-t-sm min-h-[2px]"
                              style={{ height: `${Math.max(2, (p.total / max) * 100)}%`, opacity: p.total ? 1 : 0.25 }}
                            />
                          );
                        })}
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                        <span>{historico.por_dia[0]?.dia}</span>
                        <span>{historico.por_dia[historico.por_dia.length - 1]?.dia}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-600 uppercase block">Bairros com mais relatos</span>
                      {historico.por_bairro.length === 0 && (
                        <span className="text-slate-400">Sem relatos no período.</span>
                      )}
                      {historico.por_bairro.map((b) => (
                        <div key={b.bairro} className="flex items-center gap-2">
                          <span className="w-40 truncate text-[11px] font-semibold text-slate-700">{b.bairro}</span>
                          <div className="flex-1 bg-slate-100 rounded h-2.5">
                            <div
                              className="bg-red-500 h-2.5 rounded"
                              style={{ width: `${(b.total / historico.por_bairro[0].total) * 100}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-slate-800 w-6 text-right">{b.total}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <a
                        href={getApiUrl('/api/adm/exportar-relatos?formato=csv&apenas_aprovados=false')}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-bold text-[11px] hover:bg-slate-700"
                      >
                        ⬇ Exportar relatos (CSV)
                      </a>
                      <a
                        href={getApiUrl('/api/adm/exportar-relatos?formato=geojson&apenas_aprovados=false')}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold text-[11px] hover:bg-slate-100"
                      >
                        ⬇ GeoJSON
                      </a>
                    </div>
                  </>
                )}
              </div>
            )}

            {abaAdm === 'BANCO_DADOS' && (
              <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-900 text-white border border-slate-700">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                    🗄️ Administração do Banco de Dados Comunitário (SQLite)
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Exporte os registros de Ciência Cidadã para relatórios oficiais ou execute operações de limpeza de lotes no banco <code>sigweb_teste.db</code>.
                  </p>
                </div>

                {/* Bloco de Exportação dos Relatos */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <h4 className="font-bold text-slate-800 text-xs uppercase">
                    📥 1. Exportar Base de Relatos Comunitários
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <a
                      href={getApiUrl('/api/adm/exportar-relatos?formato=csv&apenas_aprovados=false')}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-lg shadow-sm transition-colors"
                    >
                      📊 Baixar Auditoria Completa (.CSV)
                    </a>
                    <a
                      href={getApiUrl('/api/adm/exportar-relatos?formato=geojson&apenas_aprovados=false')}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-3 rounded-lg shadow-sm transition-colors"
                    >
                      🌍 Baixar Tudo p/ QGIS (.GeoJSON)
                    </a>
                    <a
                      href={getApiUrl('/api/adm/exportar-relatos?formato=csv&apenas_aprovados=true')}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-3 rounded-lg transition-colors"
                    >
                      ✅ Apenas Focos Aprovados (.CSV)
                    </a>
                    <a
                      href={getApiUrl('/api/adm/exportar-relatos?formato=geojson&apenas_aprovados=true')}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-3 rounded-lg transition-colors"
                    >
                      🗺️ Apenas Focos Aprovados (.GeoJSON)
                    </a>
                  </div>
                </div>

                {/* Bloco de Manutenção / Expurgo do Banco */}
                <div className="p-4 rounded-xl bg-red-50/70 border border-red-200 space-y-3">
                  <h4 className="font-bold text-red-900 text-xs uppercase">
                    ⚠️ 2. Operações de Limpeza e Reset do Mapa
                  </h4>
                  <p className="text-[11px] text-red-800">
                    Utilize os controles abaixo após o encerramento de um evento chuvoso ou para descartar filas de teste:
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={() => limparBancoRelatos(true)}
                      className="w-full py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold shadow-sm transition-colors cursor-pointer"
                    >
                      🧹 Limpar Apenas Relatos PENDENTES ({kpis.pendentes} registros)
                    </button>
                    <button
                      onClick={() => limparBancoRelatos(false)}
                      className="w-full py-2.5 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold shadow-sm transition-colors cursor-pointer"
                    >
                      🗑️ Zerar TODOS os Focos Comunitários do Mapa ({kpis.total} registros)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
