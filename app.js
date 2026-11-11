/* =====================================================================
   REDAÇÃO APROVADA 2.0 — CONTROLADOR PRINCIPAL DA INTERFACE (UI & UX),
   RENDERIZADOR DO RELATÓRIO (SEÇÕES A–I), REPERTÓRIO, TEMAS, PORTUGUÊS,
   EVOLUÇÃO/HISTÓRICO E ISOLAMENTO DE PERFIS DE ALUNOS
   ===================================================================== */
(function(global){
'use strict';

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const { LOGO_FILES, renderLogoImg, BANCA_SPECS, REPERTORIO_CATEGORIAS, REPERTORIO_LIBRARY, EIXOS, TEMAS, QUIZ_BANCA } = global.RedacaoDados;
const { avaliarRedacao, esc, norm } = global.MotorCorrecao;

/* =====================================================================
   1. ARMAZENAMENTO SEGURO E ISOLAMENTO DE DADOS POR ALUNO (SEÇÃO 12)
   ===================================================================== */
const store = {
  get(k, d){
    try {
      const v = localStorage.getItem(k);
      return v === null ? d : JSON.parse(v);
    } catch(e){
      return d;
    }
  },
  set(k, v){
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch(e){}
  }
};

let currentGoogleUser = store.get('redacao_google_user', null);
let isGoogleFirstLogin = false;
let activeProfileId = currentGoogleUser
  ? `google_${currentGoogleUser.googleId || currentGoogleUser.id}`
  : store.get('redacao_active_profile', 'default');

function getProfiles(){
  let list = store.get('redacao_profiles', null);
  if(!Array.isArray(list) || list.length === 0){
    const legacyName = store.get('redacao_nome', '') || (currentGoogleUser ? currentGoogleUser.nome : 'Aluno Principal');
    list = [{ id: 'default', nome: legacyName }];
    store.set('redacao_profiles', list);
  }
  if(currentGoogleUser && !list.some(p => p.id === activeProfileId)){
    list.unshift({ id: activeProfileId, nome: `Google: ${currentGoogleUser.nome}` });
  }
  return list;
}

function userKey(baseKey){
  if(activeProfileId === 'default'){
    // Preserva compatibilidade total com chaves existentes no projeto original
    return baseKey;
  }
  return `${baseKey}__u_${activeProfileId}`;
}

function getUserData(baseKey, fallback){
  return store.get(userKey(baseKey), fallback);
}

function setUserData(baseKey, val){
  store.set(userKey(baseKey), val);
}

async function syncUserDataToServer(){
  const token = store.get('google_session_token');
  if(!token) return;
  try {
    const hist = getUserData('redacao_hist', []);
    const temasSalvos = getUserData('redacao_temas_salvos', []);
    const target = getUserData('redacao_target', 'pmpe');
    const rascunho = getUserData('redacao_draft', '');
    const checklist = getUserData('redacao_check', {});

    await fetch('/api/user/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        essays: hist,
        temasSalvos,
        target,
        rascunho,
        checklist
      })
    });
  } catch(e){
    console.warn('[Sync] Falha na sincronização em nuvem:', e.message);
  }
}

/* =====================================================================
   1.1 AUTENTICAÇÃO COM CONTA GOOGLE (RECONHECIMENTO DE PRIMEIRO LOGIN)
   ===================================================================== */
function renderGoogleAuthUI(){
  const box = $('#googleAuthBox');
  if(!box) return;

  if(currentGoogleUser){
    box.innerHTML = `
      <div class="google-user-badge" id="googleUserBadge" title="Conta Google: ${esc(currentGoogleUser.email)}">
        <img src="${currentGoogleUser.picture || 'https://lh3.googleusercontent.com/a/default-user'}" alt="Avatar Google" class="google-avatar-img" onerror="this.src='https://lh3.googleusercontent.com/a/default-user'">
        <div class="google-user-info">
          <b>${esc(currentGoogleUser.nome)}</b>
          <small>● Google Conectado</small>
        </div>
        <button type="button" class="btn-logout-google" id="btnLogoutGoogle" title="Sair da Conta Google">Sair</button>
      </div>
    `;
    const btnOut = $('#btnLogoutGoogle');
    if(btnOut) btnOut.onclick = (e) => { e.stopPropagation(); logoutGoogle(); };
  } else {
    box.innerHTML = `
      <button type="button" class="google-auth-btn" id="btnOpenGoogleAuth" title="Fazer Login com a Conta Google para salvar temas e redações">
        <svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
        <span>Entrar com Google</span>
      </button>
    `;
    const btnIn = $('#btnOpenGoogleAuth');
    if(btnIn) btnIn.onclick = () => $('#googleAuthModal')?.classList.add('show');
  }
}

async function processGoogleLogin(payload){
  try {
    let respData = null;
    try {
      const resp = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if(resp.ok){
        respData = await resp.json();
      }
    } catch(err){
      console.warn('[Google Auth] Servidor backend offline. Operando em modo seguro local:', err.message);
    }

    let isFirst = false;
    let userObj = null;

    if(respData && respData.ok){
      isFirst = Boolean(respData.isFirstLogin);
      userObj = respData.user;
      store.set('google_session_token', respData.token);
    } else {
      // Modo seguro local / offline quando rodando sem server.js
      const email = payload.email || 'aluno.concursos@gmail.com';
      const normEmail = email.trim().toLowerCase();
      const googleId = payload.googleId || 'g_' + btoa(normEmail).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
      const reg = store.get('redacao_known_google_users', []);
      isFirst = !reg.includes(normEmail);
      if(isFirst){
        reg.push(normEmail);
        store.set('redacao_known_google_users', reg);
      }
      userObj = {
        id: googleId,
        googleId,
        email: normEmail,
        nome: payload.nome || payload.name || normEmail.split('@')[0],
        picture: payload.picture || 'https://lh3.googleusercontent.com/a/default-user',
        createdAt: new Date().toISOString()
      };
    }

    currentGoogleUser = userObj;
    isGoogleFirstLogin = isFirst;
    store.set('redacao_google_user', userObj);
    store.set('redacao_google_logged_once', true);

    activeProfileId = `google_${userObj.googleId || userObj.id}`;
    store.set('redacao_active_profile', activeProfileId);

    // Se o backend retornou dados salvos da conta Google do aluno, restaura tudo
    if(respData && respData.data){
      if(Array.isArray(respData.data.essays) && respData.data.essays.length > 0){
        setUserData('redacao_hist', respData.data.essays);
      }
      if(Array.isArray(respData.data.temasSalvos)){
        setUserData('redacao_temas_salvos', respData.data.temasSalvos);
      }
      if(respData.data.target){
        applyTarget(respData.data.target, true);
      }
      if(respData.data.rascunho && $('#essay')){
        $('#essay').value = respData.data.rascunho;
        atualizarMetricas();
      }
    }

    // Preenche o nome do aluno no formulário de redação
    if($('#inNome') && userObj.nome){
      $('#inNome').value = userObj.nome;
      setUserData('redacao_nome', userObj.nome);
    }

    // Fecha o modal do Google
    if($('#googleAuthModal')) $('#googleAuthModal').classList.remove('show');

    // Atualiza todos os módulos visuais
    renderGoogleAuthUI();
    renderHome();
    renderEvolution();
    renderTemas();
    renderPortugues();

    const histList = getUserData('redacao_hist', []);
    if(isFirst){
      toast(`🎉 Bem-vindo(a), ${userObj.nome}! Primeiro login com o Google concluído. Seus dados estão salvos.`);
    } else {
      toast(`✨ Bem-vindo(a) de volta, ${userObj.nome}! ${histList.length} redação(ões) e seus assuntos foram restaurados.`);
    }
  } catch(e){
    console.error('[Google Auth Error]', e);
    toast('Ocorreu um erro ao processar o login com o Google.');
  }
}

function logoutGoogle(){
  currentGoogleUser = null;
  isGoogleFirstLogin = false;
  store.set('redacao_google_user', null);
  store.set('google_session_token', null);
  activeProfileId = 'default';
  store.set('redacao_active_profile', 'default');
  renderGoogleAuthUI();
  carregarDadosPerfilAtivo();
  renderHome();
  renderEvolution();
  renderTemas();
  renderPortugues();
  toast('Você saiu da sua conta Google. Os dados locais continuam acessíveis.');
}

global.handleGoogleCredentialResponse = function(response){
  if(response && response.credential){
    processGoogleLogin({ credential: response.credential });
  }
};

/* =====================================================================
   2. UTILITÁRIOS DE UI (TOAST E CLIPBOARD)
   ===================================================================== */
let toastT;
function toast(m){
  const t = $('#toast');
  if(!t) return;
  t.textContent = m;
  t.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('show'), 2600);
}

function copy(text, msg){
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(() => toast(msg || 'Copiado com sucesso!'), () => fallbackCopy(text, msg));
  } else {
    fallbackCopy(text, msg);
  }
}
function fallbackCopy(text, msg){
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    toast(msg || 'Copiado!');
  } catch(e){
    toast('Não foi possível copiar automaticamente.');
  }
  ta.remove();
}

/* =====================================================================
   3. GERENCIADOR DE OBJETIVO / BANCA E LOGOTIPOS OFICIAIS (SEÇÃO 11)
   ===================================================================== */
let currentTarget = getUserData('redacao_target', 'pmpe');
if(!BANCA_SPECS[currentTarget]) currentTarget = 'pmpe';

function applyTarget(tId, save = true){
  if(!BANCA_SPECS[tId]) tId = 'pmpe';
  currentTarget = tId;
  if(save) setUserData('redacao_target', tId);

  document.body.setAttribute('data-target', tId);
  const spec = BANCA_SPECS[tId];
  const logoHtml = renderLogoImg(tId, 'inst-logo-img');

  // Topbar com <img> oficial
  if($('#topbarLogoBox')) $('#topbarLogoBox').innerHTML = logoHtml;
  if($('#topbarBancaTag')) $('#topbarBancaTag').textContent = spec.banca;
  if($('#topbarPillTarget')) $('#topbarPillTarget').textContent = spec.short;
  if($('#topbarPillName')) $('#topbarPillName').textContent = spec.banca;

  // Hero na Home com <img> oficial
  if($('#heroBadge')) $('#heroBadge').innerHTML = `🎯 Foco Ativo: <b>${esc(spec.name)}</b>`;
  if($('#heroCrestSvg')) $('#heroCrestSvg').innerHTML = logoHtml;
  if($('#heroCrestTitle')) $('#heroCrestTitle').textContent = spec.name;
  if($('#heroCrestBanca')) $('#heroCrestBanca').textContent = `${spec.banca} · Nota Máx: ${spec.maxScore.toFixed(0)} pts`;
  if($('#heroHeadline')) $('#heroHeadline').innerHTML = `Domine a redação para <em>${esc(spec.short)}</em> na banca <em>${esc(spec.banca)}</em>`;
  if($('#heroSubtext')) $('#heroSubtext').textContent = spec.description;

  // Banner de aviso da rubrica ativa
  if($('#targetBannerNotice')){
    const cls = tId === 'pcpe' ? 'notice-gold' : (tId === 'pmpe' ? 'notice-militar' : (tId === 'cbmpe' ? 'notice-crimson' : 'notice-blue'));
    $('#targetBannerNotice').innerHTML = `
      <div class="notice ${cls}">
        <b>Rubrica Versionada Ativa (${esc(spec.rubricaVersion)}):</b> Você está no modo <b>${esc(spec.name)}</b>. O motor contextual aplica exclusivamente os critérios documentados da banca <b>${esc(spec.banca)}</b> (Extensão: ${esc(spec.linesRange)} · Pontuação Máxima: ${spec.maxScore.toFixed(0)} pts).
      </div>
    `;
  }

  // Editor com <img> oficial
  if($('#editorCrestSvg')) $('#editorCrestSvg').innerHTML = logoHtml;
  if($('#editorTargetName')) $('#editorTargetName').textContent = spec.name;
  if($('#editorBancaDesc')) $('#editorBancaDesc').textContent = `Rubrica: ${spec.rubricaVersion} · Extensão na Folha: ${spec.linesRange}`;
  if($('#editorBancaBadge')) $('#editorBancaBadge').textContent = spec.banca;
  if($('#inTarget')) $('#inTarget').value = tId;

  // Atualizar folha pautada e métricas de acordo com o limite de linhas da banca
  renderizarFolhaPautada();
  atualizarMetricas();

  // Seleção visual nos cards do Modal
  $$('.target-choice-card').forEach(c => {
    c.classList.toggle('selected', c.dataset.setTarget === tId);
  });

  // Chips na aba de critérios
  $$('#criteriaChips .chipbtn').forEach(b => {
    b.classList.toggle('on', b.dataset.targetTab === tId);
  });

  renderHome();
  renderCriteriaTab(tId);
}

function renderizarFolhaPautada(){
  const spec = BANCA_SPECS[currentTarget] || BANCA_SPECS.pmpe;
  const maxLines = spec.maxLines || 30;
  const minLines = spec.minLines || 1;
  const gutterEl = $('#gutter');
  const essayEl = $('#essay');

  if(gutterEl){
    gutterEl.innerHTML = '';
    for(let i = 1; i <= maxLines; i++){
      const div = document.createElement('div');
      div.textContent = i;
      if(minLines > 1 && i >= minLines){
        div.style.color = 'var(--th-primary)';
        div.style.fontWeight = '800';
        div.title = `Faixa obrigatória (${spec.linesRange})`;
      }
      gutterEl.appendChild(div);
    }
    const visibleLines = maxLines <= 20 ? maxLines : 22;
    const sheetHeight = `calc(var(--lh)*${visibleLines} + 20px)`;
    gutterEl.style.height = sheetHeight;
    if(essayEl) essayEl.style.height = sheetHeight;
  }

  if($('#linesRuleTip')){
    $('#linesRuleTip').textContent = `Extensão na folha (${spec.short} · ${spec.banca}): ${spec.linesRange}. Estimativa combinada de linhas manuscritas (≈ 11 palavras / 68 caracteres por linha).`;
  }
}

function atualizarMetricas(){
  const essayEl = $('#essay');
  if(!essayEl) return;
  const spec = BANCA_SPECS[currentTarget] || BANCA_SPECS.pmpe;
  const maxLines = spec.maxLines || 30;
  const minLines = spec.minLines || 1;

  const val = essayEl.value;
  const words = val.trim() ? val.trim().split(/\s+/).filter(Boolean).length : 0;
  const pars = val.split(/\n+/).map(p => p.trim()).filter(Boolean);
  const lines = pars.length
    ? pars.reduce((acc, p) => {
        const w = p.split(/\s+/).filter(Boolean).length;
        const lPorW = Math.ceil(w / 11);
        const lPorC = Math.ceil(p.length / 68);
        return acc + Math.max(1, Math.round((lPorW + lPorC) / 2));
      }, 0)
    : 0;

  if($('#pWords')) $('#pWords').textContent = `${words} palavra${words === 1 ? '' : 's'}`;
  if($('#pPar')) $('#pPar').textContent = `${pars.length} parágrafo${pars.length === 1 ? '' : 's'}`;

  const pLines = $('#pLines');
  if(pLines){
    pLines.textContent = `≈ ${lines} / ${maxLines} linhas (${spec.linesRange})`;
    const foraDoLimite = lines > maxLines || (lines > 0 && lines < minLines);
    const dentroDoLimite = lines > 0 && lines >= minLines && lines <= maxLines;
    pLines.className = 'pill' + (foraDoLimite ? ' bad' : (dentroDoLimite ? ' ok' : ''));
  }

  const bar = $('#barLines');
  if(bar){
    bar.style.width = Math.min(100, (lines / maxLines) * 100) + '%';
    bar.className = lines > maxLines ? 'over' : '';
  }
}

/* =====================================================================
   4. RENDERIZADOR COMPLETO DO RELATÓRIO PÓS-CORREÇÃO (SEÇÕES A a I)
      Ordem Obrigatória: Seção A → B → C → D → E → F → G → H → I
   ===================================================================== */
function renderizarResultado(res, nome, tema, bancaKey){
  const spec = BANCA_SPECS[bancaKey] || BANCA_SPECS.pmpe;
  const box = $('#resultado');
  if(!box) return;

  const casasDecimais = res.tipo === 'cebraspe' ? 2 : (res.tipo === 'enem' ? 0 : 1);
  const dataFormatada = new Date(res.dataHora || Date.now()).toLocaleString('pt-BR');
  const errosConfirmados = (res.ocorrencias || []).filter(o => o.severidade === 'erro_confirmado');
  const fragilidades = (res.ocorrencias || []).filter(o => o.severidade === 'fragilidade_argumentativa');
  const sugestoes = (res.ocorrencias || []).filter(o => o.severidade === 'sugestao_estilistica');

  // Bloco complementar da fórmula Cebraspe ou 5 elementos do ENEM na Seção C
  let blocoEspecialBanca = '';
  if(res.tipo === 'cebraspe'){
    blocoEspecialBanca = `
      <div class="cebraspe-formula-box" style="margin-bottom:18px">
        <h4>📐 MEMÓRIA DE CÁLCULO — FÓRMULA LÍQUIDA DOCUMENTAL CEBRASPE</h4>
        <p style="font-size:15px;margin-bottom:8px"><strong>NPD = NC − (2 × NE ÷ TL)</strong></p>
        <div style="font-size:13px;line-height:1.75">
          • <b>NC (Nota de Conteúdo / Soma da Macroestrutura):</b> ${res.nc.toFixed(2)} de 30,00 pts<br>
          • <b>NE (Número de Erros Gramaticais Confirmados na Microestrutura):</b> ${res.ne} erro(s)<br>
          • <b>TL (Total de Linhas Efetivamente Escritas):</b> ${res.tl} linha(s)<br>
          • <b>Desconto Proporcional (2 × ${res.ne} ÷ ${res.tl}):</b> −${res.penalidade.toFixed(2)} pts<br>
          • <b>Nota Final na Prova Discursiva (NPD):</b> <span style="color:#fde047;font-weight:800">${res.total.toFixed(2)} / 30,00 pts</span>
        </div>
      </div>
    `;
  } else if(res.tipo === 'enem' && res.elementosC5){
    const c5el = res.elementosC5;
    blocoEspecialBanca = `
      <div class="card" style="background:#eef2ff;border-left:5px solid #4f46e5;margin-bottom:18px">
        <h4>🔎 Auditoria Detalhada dos 5 Elementos da Competência V (INEP/ENEM)</h4>
        <p style="font-size:13.5px;margin:6px 0 10px">Cada elemento válido e conectado ao tema adiciona 40 pontos na Competência V (Total obtido: <b>${res.notas.c5} / 200 pts</b>):</p>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          <span class="pill ${c5el.temAgente ? 'ok' : 'bad'}">${c5el.temAgente ? '✅ 1. Agente Identificado' : '❌ 1. Falta Agente'}</span>
          <span class="pill ${c5el.temAcao ? 'ok' : 'bad'}">${c5el.temAcao ? '✅ 2. Ação Interventiva' : '❌ 2. Falta Ação'}</span>
          <span class="pill ${c5el.temMeio ? 'ok' : 'bad'}">${c5el.temMeio ? '✅ 3. Meio / Modo' : '❌ 3. Falta Meio/Modo'}</span>
          <span class="pill ${c5el.temEfeito ? 'ok' : 'bad'}">${c5el.temEfeito ? '✅ 4. Efeito / Finalidade' : '❌ 4. Falta Finalidade'}</span>
          <span class="pill ${c5el.temDetalhamento ? 'ok' : 'bad'}">${c5el.temDetalhamento ? '✅ 5. Detalhamento' : '❌ 5. Falta Detalhamento'}</span>
        </div>
      </div>
    `;
  }

  // Agrupamento de ocorrências para a Seção D
  const renderOcorrenciaCard = (o) => {
    const badgeMap = {
      erro_confirmado: { txt: 'Erro Confirmado (Norma-Padrão)', bg: '#fee2e2', col: '#991b1b' },
      fragilidade_argumentativa: { txt: 'Fragilidade Argumentativa / Sintática', bg: '#fef3c7', col: '#92400e' },
      sugestao_estilistica: { txt: 'Sugestão Estilística (Sem Penalização)', bg: '#e0f2fe', col: '#075985' }
    };
    const b = badgeMap[o.severidade] || badgeMap.sugestao_estilistica;
    return `
      <div class="rep-issue-card" style="border-left:4px solid ${b.col}">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px">
          <div>
            <span class="badge" style="background:${b.bg};color:${b.col};font-size:11.5px">${esc(b.txt)}</span>
            <b style="margin-left:6px;font-size:14px">${esc(o.categoria)}</b>
          </div>
          <span class="pill" style="font-size:11.5px">📍 ${esc(o.localizacao)}</span>
        </div>
        <div style="font-size:13.5px;line-height:1.65;display:grid;gap:4px">
          <div><b>Trecho Original Exato:</b> <span class="mark-bad">${esc(o.trechoOriginal)}</span> <small style="color:var(--muted)">(Contexto: "${esc(o.contextoSentenca.slice(0, 130))}")</small></div>
          <div><b>Diagnóstico:</b> ${esc(o.diagnostico)}</div>
          <div><b>Regra / Princípio:</b> ${esc(o.explicacaoRegra)}</div>
          <div><b>Sugestão de Correção:</b> <span class="mark-good">${esc(o.sugestaoCorrecao)}</span></div>
          <div><b>Justificativa Pedagógica:</b> ${esc(o.justificativaCorrecao)}</div>
          <div style="font-size:12.5px;color:var(--muted);margin-top:2px">
            <b>Critério Relacionado:</b> ${esc(o.criterioAfetado)} · <b>Impacto na Nota:</b> ${esc(o.impactoNota)}
          </div>
        </div>
      </div>
    `;
  };

  box.innerHTML = `
    <!-- ================= SEÇÃO A — RESULTADO GERAL ================= -->
    <div class="report-section" id="sec-a">
      <div class="section-header-tag">SEÇÃO A — RESULTADO GERAL</div>
      <div class="scorebox ${res.anulacao?.anulada ? 'fail' : (res.percentual >= 60 ? 'pass' : 'fail')}">
        <div class="ring">
          <div>
            <b>${res.total.toFixed(casasDecimais)}</b>
            <small>de ${res.max.toFixed(0)} pts<br>(${res.percentual.toFixed(1)}%)</small>
          </div>
        </div>
        <div style="flex:1;min-width:260px">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px">
            <span class="badge" style="background:rgba(255,255,255,0.2);border-color:rgba(255,255,255,0.4)">${esc(spec.banca)} · ${esc(spec.short)}</span>
            <span class="badge" style="background:rgba(0,0,0,0.25);border-color:rgba(255,255,255,0.3)">🕒 ${esc(dataFormatada)}</span>
            <span class="badge" style="background:#0f172a;color:#38bdf8;border-color:#0284c7">🤖 Avaliado via: <b>${esc(res.modeloUtilizado || 'IA Especializada da Banca')}</b></span>
          </div>
          <h2 style="font-size:22px;margin-bottom:4px">
            ${res.anulacao?.anulada
              ? '⚠️ Redação com Condição de Anulação / Nota Zero Detectada'
              : `Nota Estimada: ${res.total.toFixed(casasDecimais)} de ${res.max.toFixed(0)} pontos (${res.percentual.toFixed(1)}%)`}
          </h2>
          <p style="opacity:0.95;font-size:14px"><b>Aluno(a):</b> ${esc(nome || 'Candidato(a)')} · <b>Extensão:</b> ${res.palavras} palavras | ${res.numParagrafos} parágrafo(s) | ≈ ${res.linhas} linha(s)</p>
          <p style="opacity:0.95;font-size:13.5px;margin-top:3px"><b>Tema Avaliado:</b> ${esc(tema)}</p>
          <p style="opacity:0.9;font-size:12.5px;margin-top:3px"><b>Rubrica Aplicada:</b> ${esc(res.rubricaVersion)}</p>
          ${Array.isArray(res.tentativasFalhadas) && res.tentativasFalhadas.length > 0 ? `
            <div style="margin-top:8px;padding:8px 12px;background:rgba(0,0,0,0.3);border-radius:8px;font-size:12px;color:#fef08a">
              ⚠️ <b>Cascata de IA com Fallback Ativo:</b> ${res.tentativasFalhadas.length} modelo(s) anterior(es) enfrentaram instabilidade e a correção foi finalizada com sucesso pelo modelo <b>${esc(res.modeloUtilizado)}</b>.
            </div>
          ` : ''}
        </div>
      </div>

      <div class="notice notice-gold" style="margin-bottom:14px">
        <b>⚖️ Aviso de Transparência e Calibração (Estimativa Automatizada):</b> ${esc(res.validacao?.avisoEstimativa || '')}
        <br><b>Referência Documental do Concurso:</b> ${esc(res.minPassRule || '')}
        <br><b>Auditoria Interna de Validação de Notas:</b> ✅ ${esc((res.validacao?.verificacoes || []).join(' | '))}
      </div>
    </div>

    <!-- ================= SEÇÃO B — DIAGNÓSTICO GERAL ================= -->
    <div class="card report-section" id="sec-b">
      <div class="section-header-tag">SEÇÃO B — DIAGNÓSTICO GERAL INDIVIDUALIZADO</div>
      <h3>📋 Parecer Analítico da Redação</h3>
      <div class="grid g2" style="margin-top:12px">
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:14px;border-radius:12px">
          <b style="color:#166534">✅ O que você fez bem:</b>
          <ul class="list" style="margin-top:6px">
            ${res.diagnosticoGeral.pontosFortes.map(p => `<li>${esc(p)}</li>`).join('')}
          </ul>
        </div>
        <div style="background:#fef2f2;border:1px solid #fecaca;padding:14px;border-radius:12px">
          <b style="color:#991b1b">⚠️ Problemas que mais comprometeram a nota:</b>
          <ul class="list" style="margin-top:6px">
            ${res.diagnosticoGeral.principaisProblemas.map(p => `<li>${esc(p)}</li>`).join('')}
          </ul>
        </div>
      </div>
      <div style="margin-top:14px;display:grid;gap:8px;font-size:14px;line-height:1.6">
        <div><b>• Clareza da Tese:</b> ${esc(res.diagnosticoGeral.clarezaTese)}</div>
        <div><b>• Sustentação dos Argumentos:</b> ${esc(res.diagnosticoGeral.sustentacaoArgumentos)}</div>
        <div><b>• Avaliação de Superficialidade:</b> ${esc(res.diagnosticoGeral.desenvolvimentoSuperficial)}</div>
        <div><b>• Uso do Repertório Sociocultural:</b> ${esc(res.diagnosticoGeral.usoRepertorio)}</div>
        <div><b>• Contradições, Generalizações ou Repetições:</b> ${esc(res.diagnosticoGeral.contradicoesGeneralizacoes)}</div>
        <div><b>• Como Elevar o Desempenho:</b> ${esc(res.diagnosticoGeral.mudancasParaElevar)}</div>
      </div>
    </div>

    <!-- ================= SEÇÃO C — ESPELHO DE CORREÇÃO ================= -->
    <div class="card report-section" id="sec-c">
      <div class="section-header-tag">SEÇÃO C — ESPELHO DE CORREÇÃO POR CRITÉRIO</div>
      <h3>📊 Detalhamento Justificado por Critério (${esc(spec.banca)})</h3>
      ${blocoEspecialBanca}
      <div style="display:grid;gap:14px;margin-top:12px">
        ${res.espelhoCriterios.map(cr => {
          const pct = Math.min(100, Math.round((cr.nota / cr.max) * 100));
          return `
            <div style="background:#f8fafc;border:1px solid var(--line);border-radius:14px;padding:16px">
              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:6px">
                <b style="font-size:15px;color:var(--ink)">${esc(cr.nome)}</b>
                <span class="pill ${pct >= 70 ? 'ok' : (pct < 45 ? 'bad' : '')}" style="font-size:13.5px">
                  ${cr.nota.toFixed(casasDecimais)} / ${cr.max.toFixed(casasDecimais)} pts (${pct}%)
                </span>
              </div>
              <div class="bar" style="margin-bottom:10px"><i style="width:${pct}%"></i></div>
              <div style="font-size:13.5px;line-height:1.6;display:grid;gap:4px">
                <div><b>Justificativa Específica:</b> ${esc(cr.justificativa)}</div>
                <div><b>Evidências Textuais:</b> <span style="color:var(--ink-light)">${esc(cr.evidencias)}</span></div>
                <div><b>Aspectos Positivos:</b> <span style="color:#15803d">${esc(cr.positivos)}</span></div>
                <div><b>Problemas Encontrados:</b> <span style="color:#b45309">${esc(cr.problemas)}</span></div>
                <div><b>Ação Recomendada:</b> <b>${esc(cr.acaoRecomendada)}</b></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- ================= SEÇÃO D — TODOS OS ERROS ENCONTRADOS ================= -->
    <div class="card report-section" id="sec-d">
      <div class="section-header-tag">SEÇÃO D — MAPEAMENTO DE ERROS, FRAGILIDADES E SUGESTÕES</div>
      <h3>🔍 Ocorrências Localizadas por Parágrafo e Sentença</h3>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 14px">
        <span class="pill ${errosConfirmados.length ? 'bad' : 'ok'}">Erros Gramaticais Confirmados: ${errosConfirmados.length}</span>
        <span class="pill">Fragilidades Argumentativas/Sintáticas: ${fragilidades.length}</span>
        <span class="pill">Sugestões Estilísticas (Sem Desconto): ${sugestoes.length}</span>
      </div>
      ${res.ocorrencias.length === 0
        ? `<div class="notice notice-militar">✨ <b>Excelente!</b> Nenhum desvio gramatical objetivo ou fragilidade estrutural grave foi confirmado na análise contextual das suas sentenças.</div>`
        : `<div style="display:grid;gap:12px">${res.ocorrencias.map(renderOcorrenciaCard).join('')}</div>`
      }
    </div>

    <!-- ================= SEÇÃO E — ANÁLISE PARÁGRAFO POR PARÁGRAFO ================= -->
    <div class="card report-section" id="sec-e">
      <div class="section-header-tag">SEÇÃO E — ANÁLISE PARÁGRAFO POR PARÁGRAFO</div>
      <h3>📑 Anatomia Discursiva dos Seus Parágrafos</h3>
      <div style="display:grid;gap:14px;margin-top:12px">
        ${res.analiseParagrafos.map(p => `
          <div style="background:#f8fafc;border:1px solid var(--line);border-radius:14px;padding:16px">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px">
              <b style="font-size:15px;color:var(--th-primary)">Parágrafo ${p.numero} — ${esc(p.funcao)}</b>
              <span class="pill">${p.palavras} palavras · ${p.sentencas} período(s)</span>
            </div>
            <div style="font-size:13.5px;line-height:1.65;display:grid;gap:4px">
              <div><b>Ideia Central Extraída:</b> <i>"${esc(p.ideiaCentral)}"</i></div>
              <div><b>Clareza Sintática:</b> ${esc(p.clareza)}</div>
              <div><b>Relação com a Tese:</b> ${esc(p.relacaoTese)}</div>
              <div><b>Qualidade da Fundamentação:</b> ${esc(p.qualidadeFundamentacao)}</div>
              <div><b>Coesão Interna e Transição:</b> ${esc(p.coesaoInterna)}</div>
              <div><b>Problemas Identificados:</b> ${p.problemas.map(pr => esc(pr)).join(' | ')}</div>
              <div><b>Como Melhorá-lo:</b> ${esc(p.comoMelhorar)}</div>
              <div style="margin-top:8px;padding:12px;background:#fff;border-left:4px solid var(--green);border-radius:8px">
                <b style="color:#15803d;display:block;margin-bottom:4px">✍️ Exemplo de Versão Revisada do Parágrafo ${p.numero}:</b>
                <span style="font-style:italic">${esc(p.versaoRevisada)}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- ================= SEÇÃO F — REPERTÓRIO SOCIOCULTURAL ================= -->
    <div class="card report-section" id="sec-f">
      <div class="section-header-tag">SEÇÃO F — AUDITORIA DE REPERTÓRIO SOCIOCULTURAL</div>
      <h3>🏛️ Pertinência, Explicação e Produtividade das Referências</h3>
      <p style="margin:6px 0 12px;font-size:14px">${esc(res.repertorio.resumoGeral)}</p>
      ${res.repertorio.lista.length === 0
        ? `<div class="notice notice-gold">
            <b>Oportunidade de Melhoria:</b> Sua redação não apresentou referências externas explícitas. Na aba <b>Repertório</b> você encontra mais de 28 fichas verificáveis de Filosofia, Sociologia, Direito, Saúde, Meio Ambiente e Segurança para aplicar usando o método <i>Referência → Explicação → Ponte com a Tese</i>.
           </div>`
        : `<div class="grid g2">
            ${res.repertorio.lista.map(r => `
              <div style="background:#f8fafc;border:1px solid var(--line);border-radius:12px;padding:14px;font-size:13.5px;line-height:1.6">
                <div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:6px">
                  <b>${esc(r.nome)}</b>
                  <span class="pill ${r.produtivo ? 'ok' : 'bad'}">${r.produtivo ? 'Produtivo ✓' : 'Pouco Articulado'}</span>
                </div>
                <div><b>Área / Tipo:</b> ${esc(r.tipo)} (Parágrafo ${r.paragrafo})</div>
                <div><b>Pertinência ao Tema:</b> Pertinente e legitimado</div>
                <div><b>Correção Factual:</b> ${esc(r.correcaoFactual)}</div>
                <div><b>Explicação do Conceito:</b> ${r.explicado ? 'Sim (conceito desenvolvido no parágrafo)' : 'Mencionado de forma breve sem explicação detida'}</div>
                <div><b>Integração com o Argumento:</b> ${r.integrado ? 'Conectado aos termos do tema' : 'Faltou ponte explícita com o problema'}</div>
                <div><b>Diagnóstico de Produtividade:</b> <b>${esc(r.avaliacao)}</b></div>
              </div>
            `).join('')}
           </div>`
      }
    </div>

    <!-- ================= SEÇÃO G — PLANO DE MELHORIA PERSONALIZADO ================= -->
    <div class="card report-section" id="sec-g">
      <div class="section-header-tag">SEÇÃO G — PLANO DE MELHORIA PERSONALIZADO (3 NÍVEIS)</div>
      <h3>🎯 Roteiro Priorizado de Evolução</h3>
      <div class="grid g3" style="margin-top:12px">
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:14px;padding:16px">
          <span class="badge" style="background:#b91c1c;color:#fff;margin-bottom:8px">1. Prioridade Alta</span>
          <h4 style="font-size:15px;margin-bottom:6px">O que mais compromete a nota</h4>
          <ul class="list" style="font-size:13.5px">
            ${res.planoMelhoria.alta.map(item => `<li>${esc(item)}</li>`).join('')}
          </ul>
        </div>
        <div style="background:#fefce8;border:1px solid #fde047;border-radius:14px;padding:16px">
          <span class="badge" style="background:#ca8a04;color:#fff;margin-bottom:8px">2. Prioridade Média</span>
          <h4 style="font-size:15px;margin-bottom:6px">Clareza e força argumentativa</h4>
          <ul class="list" style="font-size:13.5px">
            ${res.planoMelhoria.media.map(item => `<li>${esc(item)}</li>`).join('')}
          </ul>
        </div>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;padding:16px">
          <span class="badge" style="background:#15803d;color:#fff;margin-bottom:8px">3. Prioridade Complementar</span>
          <h4 style="font-size:15px;margin-bottom:6px">Refinamento e repertório</h4>
          <ul class="list" style="font-size:13.5px">
            ${res.planoMelhoria.complementar.map(item => `<li>${esc(item)}</li>`).join('')}
          </ul>
        </div>
      </div>
    </div>

    <!-- ================= SEÇÃO H — REESCRITA ORIENTADA ================= -->
    <div class="card report-section" id="sec-h">
      <div class="section-header-tag">SEÇÃO H — REESCRITA ORIENTADA & MODELO DE ESTUDO</div>
      <h3>✍️ Comparativo de Reescrita (Parágrafo ${res.reescritaOrientada.paragrafoReferencia})</h3>
      <div class="grid g2" style="margin-top:12px">
        <div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:12px;padding:14px">
          <b style="color:#be123c;display:block;margin-bottom:6px">Trecho Original do Aluno:</b>
          <p style="font-size:13.5px;line-height:1.65">${esc(res.reescritaOrientada.trechoOriginal)}</p>
        </div>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:14px">
          <b style="color:#15803d;display:block;margin-bottom:6px">Versão Revisada Orientada:</b>
          <p style="font-size:13.5px;line-height:1.65">${esc(res.reescritaOrientada.versaoRevisada)}</p>
        </div>
      </div>
      <div style="margin-top:10px;font-size:13.5px;line-height:1.6">
        <div><b>Explicação das Alterações:</b> ${esc(res.reescritaOrientada.explicacaoAlteracoes)}</div>
        <div><b>Por que a versão revisada é mais adequada:</b> ${esc(res.reescritaOrientada.motivoAdequacao)}</div>
      </div>

      <div class="rewrite-box" style="margin-top:18px">
        <h4>📘 Versão Integral Revisada — Modelo de Estudo Completo (Padrão ${esc(spec.banca)})</h4>
        <div style="white-space:pre-line;font-size:14px;line-height:1.75;color:#1e293b;margin-top:8px">${esc(res.reescritaOrientada.modeloIntegralEstudo)}</div>
        <small style="display:block;margin-top:10px;color:var(--muted)">
          <b>Nota Pedagógica:</b> Este texto integral é fornecido exclusivamente como <b>Modelo de Estudo</b> estrutural para demonstrar como articular introdução, desenvolvimento com repertório produtivo e conclusão sobre o tema avaliado.
        </small>
      </div>
    </div>

    <!-- ================= SEÇÃO I — PRÓXIMA ATIVIDADE ================= -->
    <div class="card report-section" id="sec-i">
      <div class="section-header-tag">SEÇÃO I — PRÓXIMA ATIVIDADE RECOMENDADA</div>
      <h3>🚀 Plano de Ação Imediato</h3>
      <div class="grid g2" style="margin-top:12px">
        <div style="background:#f8fafc;padding:14px;border-radius:12px;border:1px solid var(--line)">
          <b>1. Exercício de Gramática:</b>
          <p style="font-size:13.5px;margin:4px 0 8px">${esc(res.proximaAtividade.exercicioGramatica)}</p>
          <button type="button" class="btn btn-light btn-sm" data-go="portugues">🔤 Ir para Exercícios de Português</button>
        </div>
        <div style="background:#f8fafc;padding:14px;border-radius:12px;border:1px solid var(--line)">
          <b>2. Exercício de Argumentação:</b>
          <p style="font-size:13.5px;margin:4px 0 8px">${esc(res.proximaAtividade.exercicioArgumentacao)}</p>
          <button type="button" class="btn btn-light btn-sm" data-go="aulas">💡 Revisar Método dos PDFs</button>
        </div>
        <div style="background:#f8fafc;padding:14px;border-radius:12px;border:1px solid var(--line)">
          <b>3. Atividade de Repertório:</b>
          <p style="font-size:13.5px;margin:4px 0 8px">${esc(res.proximaAtividade.atividadeRepertorio)}</p>
          <button type="button" class="btn btn-light btn-sm" data-go="repertorio">🏛️ Abrir Biblioteca de Repertório</button>
        </div>
        <div style="background:#f8fafc;padding:14px;border-radius:12px;border:1px solid var(--line)">
          <b>4. Novo Tema Relacionado Recomendado:</b>
          <p style="font-size:13.5px;margin:4px 0 8px"><i>"${esc(res.proximaAtividade.novoTemaRecomendado)}"</i></p>
          <button type="button" class="btn btn-primary btn-sm" id="btnLoadRecommendedTheme" data-theme="${esc(res.proximaAtividade.novoTemaRecomendado)}">✍️ Praticar Este Tema Agora</button>
        </div>
      </div>

      <div class="no-print" style="margin-top:18px;display:flex;gap:10px;flex-wrap:wrap">
        <button type="button" class="btn btn-light btn-sm" id="btnPrintResult">🖨️ Imprimir / Salvar Relatório Completo (PDF)</button>
        <button type="button" class="btn btn-light btn-sm" data-go="evolucao">📈 Consultar Histórico & Evolução</button>
      </div>
    </div>
  `;

  box.style.display = 'block';
  box.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const btnPrint = $('#btnPrintResult');
  if(btnPrint){
    btnPrint.onclick = () => {
      document.body.classList.add('print-result');
      window.print();
      setTimeout(() => document.body.classList.remove('print-result'), 500);
    };
  }

  const btnLoadTheme = $('#btnLoadRecommendedTheme');
  if(btnLoadTheme){
    btnLoadTheme.onclick = () => {
      const novoTema = btnLoadTheme.getAttribute('data-theme');
      $('#inTema').value = novoTema;
      setUserData('redacao_tema', novoTema);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast('Novo tema carregado na folha de redação!');
    };
  }
}

/* =====================================================================
   5. DISPARO DA CORREÇÃO E PERSISTÊNCIA COMPLETA NO HISTÓRICO
   ===================================================================== */
function configurarCorretor(){
  const btnEval = $('#btnEval');
  if(!btnEval) return;

  btnEval.onclick = async () => {
    const texto = $('#essay').value.trim();
    const tema = $('#inTema').value.trim() || 'Tema Geral de Segurança Pública, Direitos e Cidadania';
    const comando = ($('#inComando') ? $('#inComando').value.trim() : '');
    const nome = $('#inNome').value.trim() || (currentGoogleUser ? currentGoogleUser.nome : 'Aluno(a)');
    const bancaKey = $('#inTarget').value;

    if(texto.length < 50){
      toast('Escreva um texto com pelo menos 50 caracteres para iniciar a análise contextual.');
      return;
    }

    btnEval.disabled = true;
    const originalText = btnEval.innerHTML;
    btnEval.innerHTML = '⏳ Conectando aos modelos de IA (Cascata Multi-Modelo)...';

    let res = null;
    let usedModel = null;
    let failedAttempts = [];

    try {
      const token = store.get('google_session_token');
      const resp = await fetch('/api/evaluate-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          texto,
          tema,
          comando,
          bancaKey,
          alunoNome: nome,
          geminiKey: store.get('redacao_gemini_key', ''),
          openaiKey: store.get('redacao_openai_key', '')
        })
      });

      if(resp.ok){
        const data = await resp.json();
        if(data.ok && data.relatorio){
          res = data.relatorio;
          usedModel = data.modeloUtilizado || res.modeloUtilizado;
          failedAttempts = data.tentativasFalhadas || [];
        }
      }
    } catch(err){
      console.warn('[Avaliação IA] Servidor offline. Acionando Motor Contextual Local Determinístico:', err.message);
    }

    // Se o backend falhar ou estiver offline, usa o Motor Contextual determinístico especializado
    if(!res){
      res = avaliarRedacao(texto, tema, bancaKey, comando);
      res.modeloUtilizado = 'Motor Contextual Especializado da Banca (Modo Local)';
      usedModel = res.modeloUtilizado;
    }

    try {
      renderizarResultado(res, nome, tema, bancaKey);

      // Salvar resultado completo no histórico do aluno
      const hist = getUserData('redacao_hist', []);
      const record = {
        id: 'red_' + Date.now(),
        d: res.dataHora || new Date().toISOString(),
        nome: nome,
        tema,
        comando,
        texto,
        target: bancaKey,
        banca: BANCA_SPECS[bancaKey].banca,
        total: res.total,
        max: res.max,
        percentual: res.percentual,
        palavras: res.palavras,
        linhas: res.linhas,
        modeloUtilizado: usedModel,
        relatorioCompleto: res
      };
      hist.push(record);
      setUserData('redacao_hist', hist.slice(-100));

      // Salvar nos assuntos estudados e praticados do aluno
      const salvos = getUserData('redacao_temas_salvos', []);
      const jaExiste = salvos.find(s => (s.tema || s.t || s) === tema);
      if(jaExiste){
        if(typeof jaExiste === 'object'){
          jaExiste.notaMax = Math.max(jaExiste.notaMax || 0, res.total);
          jaExiste.praticadoEm = new Date().toISOString();
        }
      } else {
        salvos.push({ tema, bancaKey, notaMax: res.total, praticadoEm: new Date().toISOString() });
      }
      setUserData('redacao_temas_salvos', salvos);

      // Sincronizar na nuvem se autenticado com Google
      syncUserDataToServer();

      // Atualizar exercícios personalizados de português com base nos novos erros
      renderPortugues();
      renderTemas();

      toast(`Redação avaliada com sucesso via ${usedModel}!`);
    } catch(err){
      console.error(err);
      toast('Ocorreu um erro ao processar a avaliação. Verifique os dados inseridos.');
    } finally {
      btnEval.disabled = false;
      btnEval.innerHTML = originalText;
    }
  };
}

/* =====================================================================
   6. ABA CRITÉRIOS DA BANCA (DOCUMENTADOS E VERSIONADOS)
   ===================================================================== */
function renderCriteriaTab(targetKey){
  const spec = BANCA_SPECS[targetKey] || BANCA_SPECS.pmpe;
  const box = $('#criteriaContentBox');
  if(!box) return;

  box.innerHTML = `
    <div class="card" style="margin-bottom:20px;border-left:5px solid var(--th-primary)">
      <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
        <div class="criteria-logo-box">${renderLogoImg(targetKey, 'inst-logo-img')}</div>
        <div>
          <span class="badge" style="background:var(--th-card-highlight);color:var(--th-primary);margin-bottom:4px">${esc(spec.rubricaVersion)}</span>
          <h2 style="font-size:22px">${esc(spec.name)}</h2>
          <p style="color:var(--muted)">Banca: <b>${esc(spec.banca)}</b> · Gênero: <b>${esc(spec.genero)}</b> · Máximo: <b>${spec.maxScore.toFixed(0)} pts</b> · Extensão: <b>${esc(spec.linesRange)}</b></p>
        </div>
      </div>
      <p style="margin-top:12px;line-height:1.6">${esc(spec.description)}</p>
      <div style="margin-top:10px;padding:12px;background:#f8fafc;border-radius:10px;border:1px solid var(--line);font-size:13.5px">
        <b>📌 Regra de Corte / Referência Documental:</b> ${esc(spec.minPassRule)}
      </div>
    </div>

    <div class="grid g2">
      ${spec.criteriaList.map((c, i) => `
        <div class="card">
          <span class="badge" style="background:var(--th-card-highlight);color:var(--th-primary)">Critério ${i+1} · Máximo: ${c.pts.toFixed(1)} pts</span>
          <h4 style="margin:8px 0;font-size:16px">${esc(c.title)}</h4>
          <p style="font-size:14px;color:var(--ink-light)">${esc(c.desc)}</p>
        </div>
      `).join('')}
    </div>

    <div class="card" style="margin-top:18px;border-left:4px solid var(--red)">
      <h3>🚫 Condições Documentadas de Nota Zero ou Penalização Severa (${esc(spec.banca)})</h3>
      <ul class="list" style="margin-top:8px">
        ${(spec.regrasAnulacao || []).map(r => `<li>${esc(r)}</li>`).join('')}
      </ul>
    </div>
  `;
}

/* =====================================================================
   7. ABA REPERTÓRIO — BIBLIOTECA AMPLA E PESQUISÁVEL (SEÇÃO 7)
   ===================================================================== */
let repCatFiltro = 'all';

function renderRepertorioLibrary(){
  const chipsBox = $('#repChips');
  const gridBox = $('#repGrid');
  const searchIn = $('#repSearch');
  if(!chipsBox || !gridBox) return;

  const q = norm(searchIn ? searchIn.value.trim() : '');

  chipsBox.innerHTML = Object.entries(REPERTORIO_CATEGORIAS).map(([k, label]) => {
    const count = k === 'all' ? REPERTORIO_LIBRARY.length : REPERTORIO_LIBRARY.filter(r => r.categoria === k).length;
    return `<button type="button" class="chipbtn ${repCatFiltro === k ? 'on' : ''}" data-rep-cat="${k}">${esc(label)} (${count})</button>`;
  }).join('');

  const filtrados = REPERTORIO_LIBRARY.filter(r => {
    const matchCat = repCatFiltro === 'all' || r.categoria === repCatFiltro;
    const matchQ = !q || norm(`${r.titulo} ${r.autor} ${r.conceito} ${r.explicacao} ${r.aplicacao} ${r.fonte} ${(r.tags || []).join(' ')}`).includes(q);
    return matchCat && matchQ;
  });

  if($('#repCountInfo')){
    $('#repCountInfo').textContent = `Exibindo ${filtrados.length} de ${REPERTORIO_LIBRARY.length} fichas verificáveis no acervo sociocultural.`;
  }

  gridBox.innerHTML = filtrados.length ? filtrados.map(r => `
    <div class="card" style="display:flex;flex-direction:column;gap:8px;border-top:4px solid var(--th-primary)">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap">
        <span class="badge" style="background:var(--th-card-highlight);color:var(--th-primary);font-size:11.5px">${esc(REPERTORIO_CATEGORIAS[r.categoria] || r.categoria)}</span>
        <small style="color:var(--muted);font-weight:700">${esc(r.autor)}</small>
      </div>
      <h3 style="font-size:16.5px;line-height:1.35">${esc(r.titulo)}</h3>
      <div style="font-size:13.5px;line-height:1.6;color:var(--ink-light);display:grid;gap:6px">
        <div><b>Conceito-Chave:</b> ${esc(r.conceito)}</div>
        <div><b>Explicação Teórica:</b> ${esc(r.explicacao)}</div>
        <div style="background:#f8fafc;padding:10px 12px;border-radius:10px;border-left:3px solid var(--green)">
          <b style="color:#15803d;display:block;margin-bottom:2px">✍️ Exemplo Prático de Aplicação na Redação:</b>
          <i>"${esc(r.aplicacao)}"</i>
        </div>
        <div style="font-size:12px;color:var(--muted)"><b>📚 Fonte Verificável:</b> ${esc(r.fonte)}</div>
      </div>
      <div style="display:flex;gap:8px;margin-top:auto;padding-top:8px">
        <button type="button" class="btn btn-light btn-sm" data-copy-rep="${esc(r.aplicacao)}">📋 Copiar Aplicação</button>
        <button type="button" class="btn btn-primary btn-sm" data-insert-rep="${esc(r.aplicacao)}">➕ Inserir no Rascunho</button>
      </div>
    </div>
  `).join('') : `<div class="card">Nenhum repertório encontrado para "${esc(searchIn ? searchIn.value : '')}".</div>`;
}

/* =====================================================================
   8. BANCO DE TEMAS EXPANDIDO (SEÇÃO 8)
   ===================================================================== */
let eixoFiltro = 'all';

function renderTemas(){
  const searchEl = $('#tSearch');
  const chipsEl = $('#tChips');
  const gridEl = $('#tGrid');
  if(!chipsEl || !gridEl) return;

  const q = norm(searchEl ? searchEl.value.trim() : '');
  const temasSalvos = getUserData('redacao_temas_salvos', []);
  const hist = getUserData('redacao_hist', []);
  const savedCount = temasSalvos.length;

  const chips = ['all', 'saved', ...Object.keys(EIXOS)];
  chipsEl.innerHTML = chips.map(k => {
    let label = '';
    let extraStyle = '';
    if(k === 'all') label = `Todos os Eixos (${TEMAS.length})`;
    else if(k === 'saved') {
      label = `⭐ Meus Assuntos Salvos (${savedCount})`;
      extraStyle = 'background:#fef3c7;color:#92400e;border-color:#fcd34d;font-weight:700;';
    } else {
      label = `${EIXOS[k].n} (${TEMAS.filter(t => t.e === k).length})`;
    }
    return `<button type="button" style="${extraStyle}" class="chipbtn ${eixoFiltro === k ? 'on' : ''}" data-eixo="${k}">${esc(label)}</button>`;
  }).join('');

  const filtrados = TEMAS.map((t, i) => ({ t, i })).filter(({ t }) => {
    let matchEixo = true;
    if(eixoFiltro === 'saved'){
      matchEixo = temasSalvos.some(s => (s.tema || s.t || s) === t.t);
    } else if(eixoFiltro !== 'all'){
      matchEixo = (t.e === eixoFiltro);
    }
    const matchQ = !q || norm(`${t.t} ${t.banca} ${t.problema} ${t.comando} ${(t.teses || []).join(' ')} ${t.f} ${t.r} ${t.p}`).includes(q);
    return matchEixo && matchQ;
  });

  gridEl.innerHTML = filtrados.length ? filtrados.map(({ t, i }) => {
    const ex = EIXOS[t.e] || { n: 'Geral', c: '#4f46e5' };
    const isSaved = temasSalvos.some(s => (s.tema || s.t || s) === t.t);
    const redacoesPraticadas = hist.filter(h => h.tema === t.t);
    const bestScore = redacoesPraticadas.length ? Math.max(...redacoesPraticadas.map(h => h.total)) : null;

    return `
      <div class="card tcard" style="--c:${ex.c}" data-i="${i}">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
          <span class="badge" style="background:${ex.c}18;color:${ex.c}">${esc(ex.n)}</span>
          <span class="pill" style="font-size:11px">🏛️ ${esc(t.banca || ex.banca)}</span>
        </div>
        <h3 style="font-size:16px;line-height:1.4">${esc(t.t)}</h3>
        <p style="font-size:13.5px;color:var(--muted)"><b>Problema Central:</b> ${esc(t.problema || t.f)}</p>
        <div class="det">
          <div style="display:grid;gap:6px;margin-top:6px;padding-top:8px;border-top:1px solid var(--line)">
            <div><b>📋 Comando / Recorte da Proposta:</b> ${esc(t.comando || t.f)}</div>
            <div><b>🎯 Possíveis Teses para Defender:</b>
              <ul class="list" style="margin-top:4px">
                ${(t.teses || [t.f]).map(ts => `<li>${esc(ts)}</li>`).join('')}
              </ul>
            </div>
            <div><b>🏛️ Repertórios Pertinentes Verificáveis:</b> ${esc(t.r)}</div>
            <div><b>💡 Diretriz de Proposta / Fechamento:</b> ${esc(t.p)}</div>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-top:auto;padding-top:10px;border-top:1px dashed var(--line)">
          <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
            <button type="button" class="btn-save-topic ${isSaved ? 'saved' : ''}" data-toggle-save-topic="${esc(t.t)}">
              ${isSaved ? '⭐ Assunto Salvo' : '☆ Salvar Assunto'}
            </button>
            ${bestScore !== null ? `<span class="topic-practiced-badge">✅ Praticado (${bestScore.toFixed(1)} pts)</span>` : ''}
          </div>
          <div style="display:flex;gap:6px">
            <button type="button" class="btn btn-light btn-sm" data-act="det">Ver Roteiro</button>
            <button type="button" class="btn btn-primary btn-sm" data-act="use">✍️ Escrever</button>
          </div>
        </div>
      </div>
    `;
  }).join('') : `<div class="card" style="padding:28px;text-align:center">
    <div style="font-size:32px;margin-bottom:8px">${eixoFiltro === 'saved' ? '⭐' : '🔍'}</div>
    <b>${eixoFiltro === 'saved' ? 'Você ainda não salvou nenhum assunto.' : 'Nenhum tema encontrado para a sua pesquisa.'}</b>
    <p style="color:var(--muted);font-size:13px;margin-top:4px">${eixoFiltro === 'saved' ? 'Clique no botão "☆ Salvar Assunto" nos cards para criar sua lista personalizada de treino que fica salva na sua conta Google.' : 'Tente buscar por outros termos ou selecionar outro eixo temático.'}</p>
  </div>`;
}

/* =====================================================================
   9. PORTUGUÊS, CONECTIVOS, QUIZ DETALHADO E EXERCÍCIOS PERSONALIZADOS (SEÇÃO 9)
   ===================================================================== */
const CONECTIVOS_CATEGORIAS = [
  { t: 'Adição & Continuidade (D2 / Intraparágrafo)', c: ['além disso', 'ademais', 'outrossim', 'bem como', 'não apenas... mas também', 'soma-se a isso', 'paralelamente'] },
  { t: 'Oposição, Contraste & Ressalva', c: ['contudo', 'entretanto', 'todavia', 'no entanto', 'por outro lado', 'não obstante', 'embora'] },
  { t: 'Causa, Explicação & Justificativa', c: ['visto que', 'uma vez que', 'haja vista', 'dado que', 'em razão de', 'porquanto', 'já que'] },
  { t: 'Conclusão & Síntese (4º Parágrafo)', c: ['portanto', 'desse modo', 'dessa forma', 'por conseguinte', 'assim sendo', 'em suma', 'logo'] },
  { t: 'Finalidade & Proposta de Intervenção', c: ['a fim de', 'com o intuito de', 'para que', 'com o objetivo de', 'visando a', 'por meio de', 'mediante'] },
  { t: 'Abertura & Transição Temática (D1)', c: ['em primeiro lugar', 'primeiramente', 'sob essa ótica', 'nesse sentido', 'diante desse cenário', 'convém destacar que'] }
];

function renderPortugues(){
  const connGrid = $('#connGrid');
  if(connGrid){
    connGrid.innerHTML = CONECTIVOS_CATEGORIAS.map(cat => `
      <div class="card">
        <h3 style="font-size:15px;margin-bottom:10px">${esc(cat.t)}</h3>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          ${cat.c.map(x => `<button type="button" class="btn btn-light btn-sm" data-copy-conn="${esc(x)}">${esc(x)}</button>`).join('')}
        </div>
      </div>
    `).join('');
  }

  // Checklist persistido por aluno
  const checkBox = $('#checklist');
  if(checkBox){
    const checkSalvo = getUserData('redacao_check', {});
    const itensCheck = [
      'Recorte temático: Todos os núcleos do comando da proposta foram contemplados.',
      'Introdução: Contextualização inicial + Tese explícita no último período.',
      'Desenvolvimento: Dois parágrafos analíticos com tópico frasal e fundamentação.',
      'Repertório Produtivo: Conceito explicado e conectado diretamente à tese.',
      'Coesão: Conectivos interparágrafos na abertura do D1, D2 e Conclusão.',
      'Gramática: Revisão de crase, concordância (haver/fazer), regência e pontuação.',
      'Extensão: Texto dentro do limite oficial da folha da banca (PMPE/CBMPE: 15 a 20 linhas | PCPE/VUNESP: Até 30 linhas | ENEM: 8 a 30 linhas).'
    ];

    checkBox.innerHTML = itensCheck.map((txt, i) => `
      <label style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid var(--line);cursor:pointer;font-size:13.5px">
        <input type="checkbox" data-check="${i}" ${checkSalvo[i] ? 'checked' : ''} style="margin-top:3px;accent-color:var(--th-primary)">
        <span>${esc(txt)}</span>
      </label>
    `).join('');
  }

  // Exercícios personalizados gerados a partir dos erros reais do aluno no histórico!
  const customBox = $('#customErrorsExercises');
  if(customBox){
    const hist = getUserData('redacao_hist', []);
    const errosReais = [];
    hist.slice(-10).reverse().forEach(h => {
      const ocs = h.relatorioCompleto?.ocorrencias || [];
      ocs.filter(o => o.severidade === 'erro_confirmado' || o.severidade === 'fragilidade_argumentativa').forEach(o => {
        if(errosReais.length < 8 && !errosReais.some(x => x.trechoOriginal === o.trechoOriginal && x.categoria === o.categoria)){
          errosReais.push({ ...o, temaRedacao: h.tema });
        }
      });
    });

    if(errosReais.length === 0){
      customBox.innerHTML = `
        <p style="font-size:14px;color:var(--muted)">
          Assim que você corrigir suas redações na aba <b>Folha & Corretor</b>, este módulo gerará automaticamente exercícios práticos de revisão baseados nos desvios reais encontrados nos seus textos!
        </p>
      `;
    } else {
      customBox.innerHTML = `
        <p style="font-size:13.5px;margin-bottom:12px">
          Estes exercícios foram montados automaticamente a partir de <b>${errosReais.length} ocorrência(s) real(is)</b> detectada(s) nas suas últimas redações:
        </p>
        <div style="display:grid;gap:10px">
          ${errosReais.map((er, idx) => `
            <div style="background:#f8fafc;border:1px solid var(--line);border-left:4px solid var(--th-primary);border-radius:10px;padding:12px;font-size:13.5px">
              <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap">
                <b>Desafio Personalizado #${idx + 1} · ${esc(er.categoria)}</b>
                <small style="color:var(--muted)">Tema: ${esc(er.temaRedacao.slice(0, 45))}...</small>
              </div>
              <div style="margin-top:6px"><b>Sua frase original:</b> <i>"${esc(er.contextoSentenca)}"</i></div>
              <div style="margin-top:4px"><b>Trecho sinalizado:</b> <span class="mark-bad">${esc(er.trechoOriginal)}</span></div>
              <details style="margin-top:6px;cursor:pointer">
                <summary style="font-weight:700;color:var(--th-primary)">Ver Resposta, Regra e Correção Aplicada</summary>
                <div style="margin-top:6px;padding:8px;background:#fff;border-radius:8px;border:1px solid var(--line)">
                  <div><b>✅ Correção Recomendada:</b> <span class="mark-good">${esc(er.sugestaoCorrecao)}</span></div>
                  <div style="margin-top:4px"><b>📚 Regra:</b> ${esc(er.explicacaoRegra)}</div>
                  <div style="margin-top:4px"><b>💡 Justificativa:</b> ${esc(er.justificativaCorrecao)}</div>
                </div>
              </details>
            </div>
          `).join('')}
        </div>
      `;
    }
  }
}

let qIdx = 0;
function renderQuiz(){
  const qBox = $('#quiz');
  if(!qBox) return;

  if(qIdx >= QUIZ_BANCA.length){
    qBox.innerHTML = `
      <h3>🎉 Bateria de Questões Concluída!</h3>
      <p style="margin:10px 0">Você completou todas as ${QUIZ_BANCA.length} questões comentadas de gramática aplicada à redação.</p>
      <button type="button" class="btn btn-primary btn-sm" id="btnRestartQuiz">↺ Reiniciar Bateria de Exercícios</button>
    `;
    return;
  }
  const q = QUIZ_BANCA[qIdx];
  qBox.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <span style="font-size:12px;font-weight:800;color:var(--th-primary)">QUESTÃO ${qIdx + 1} DE ${QUIZ_BANCA.length}</span>
      <span class="pill" style="font-size:11px">${esc(q.categoria || 'Norma-Padrão')}</span>
    </div>
    <h4 style="margin-bottom:12px;font-size:15px;line-height:1.45">${esc(q.q)}</h4>
    <div style="display:grid;gap:8px">
      ${q.o.map((opt, i) => `
        <button type="button" class="btn btn-light btn-sm" style="text-align:left;justify-content:flex-start;line-height:1.4" data-quiz-opt="${i}">${esc(opt)}</button>
      `).join('')}
    </div>
    <div id="quizFeed" style="margin-top:12px;font-size:13.5px;line-height:1.6"></div>
  `;
}

/* =====================================================================
   10. EVOLUÇÃO, DIAGNÓSTICO POR CRITÉRIO E HISTÓRICO INTERATIVO (SEÇÃO 10)
   ===================================================================== */
let periodoFiltroHist = 'all'; // 'all' | '7d' | '30d'

function renderEvolution(){
  const histAll = getUserData('redacao_hist', []);
  const evStats = $('#evStats');
  const histBox = $('#histBox');
  const chartBox = $('#chartBox');
  const critEvBox = $('#critEvolutionBox');
  const errFreqBox = $('#errorFreqBox');
  if(!evStats || !histBox || !chartBox) return;

  const agora = Date.now();
  const histPeriodo = histAll.filter(h => {
    if(periodoFiltroHist === '7d') return (agora - new Date(h.d).getTime()) <= 7 * 86400000;
    if(periodoFiltroHist === '30d') return (agora - new Date(h.d).getTime()) <= 30 * 86400000;
    return true;
  });

  const spec = BANCA_SPECS[currentTarget];
  const targetHist = histPeriodo.filter(h => h.target === currentTarget);
  const avg = targetHist.length ? (targetHist.reduce((s, h) => s + h.total, 0) / targetHist.length) : 0;
  const best = targetHist.length ? Math.max(...targetHist.map(h => h.total)) : 0;

  evStats.innerHTML = `
    <div class="card stat s1"><div class="n">${histPeriodo.length}</div><div class="l">Redações no Período</div></div>
    <div class="card stat s2"><div class="n">${targetHist.length}</div><div class="l">Na Banca ${esc(spec.short)}</div></div>
    <div class="card stat s3"><div class="n">${targetHist.length ? avg.toFixed(1) : '–'}</div><div class="l">Média / ${spec.maxScore.toFixed(0)}</div></div>
    <div class="card stat s4"><div class="n">${targetHist.length ? best.toFixed(1) : '–'}</div><div class="l">Melhor Nota (${esc(spec.short)})</div></div>
  `;

  // Gráfico de Curva de Desempenho
  if(targetHist.length < 2){
    chartBox.innerHTML = `<p style="color:var(--muted)">Corrija pelo menos 2 redações no objetivo <b>${esc(spec.name)}</b> para visualizar o gráfico de evolução por data.</p>`;
  } else {
    const pts = targetHist.slice(-12);
    const W = 680, H = 210, P = 34;
    const x = i => P + (W - 2 * P) * (pts.length === 1 ? 0 : i / (pts.length - 1));
    const y = v => H - P - (H - 2 * P) * (v / spec.maxScore);
    const path = pts.map((p, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.total).toFixed(1)).join(' ');

    chartBox.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto" role="img" aria-label="Curva de evolução de notas">
        <defs><linearGradient id="chGrad" x1="0" x2="1"><stop offset="0" stop-color="var(--th-primary)"/><stop offset="1" stop-color="var(--th-secondary)"/></linearGradient></defs>
        <line x1="${P}" x2="${W-P}" y1="${y(spec.minPass)}" y2="${y(spec.minPass)}" stroke="#10b981" stroke-dasharray="5 5"/>
        <text x="${W-P-135}" y="${y(spec.minPass)-6}" font-size="11" fill="#059669" font-weight="700">Ref. Corte: ${spec.minPass.toFixed(0)} pts</text>
        <path d="${path}" fill="none" stroke="url(#chGrad)" stroke-width="4" stroke-linecap="round"/>
        ${pts.map((p, i) => `
          <circle cx="${x(i)}" cy="${y(p.total)}" r="5.5" fill="#fff" stroke="var(--th-primary)" stroke-width="3">
            <title>${p.total.toFixed(1)} pts em ${new Date(p.d).toLocaleDateString('pt-BR')} — ${esc(p.tema)}</title>
          </circle>
          <text x="${x(i)}" y="${y(p.total)-10}" text-anchor="middle" font-size="10.5" font-weight="700" fill="#334155">${p.total.toFixed(spec.id==='enem'?0:1)}</text>
        `).join('')}
      </svg>
    `;
  }

  // Evolução Média por Critério e Frequência de Erros
  if(critEvBox){
    const comRelatorio = targetHist.filter(h => h.relatorioCompleto && Array.isArray(h.relatorioCompleto.espelhoCriterios));
    if(comRelatorio.length === 0){
      critEvBox.innerHTML = `<p style="color:var(--muted);font-size:14px">Ainda não há relatórios detalhados salvos para calcular a média por critério de <b>${esc(spec.short)}</b>.</p>`;
    } else {
      critEvBox.innerHTML = spec.criteriaList.map((cr, idx) => {
        const mediaCrit = comRelatorio.reduce((acc, h) => {
          const item = h.relatorioCompleto.espelhoCriterios[idx];
          return acc + (item ? item.nota : 0);
        }, 0) / comRelatorio.length;
        const pct = Math.min(100, Math.round((mediaCrit / cr.pts) * 100));
        return `
          <div class="crit">
            <div class="row"><span>${esc(cr.title)}</span><b>Média: ${mediaCrit.toFixed(1)} / ${cr.pts.toFixed(1)} pts (${pct}%)</b></div>
            <div class="bar"><i style="width:${pct}%"></i></div>
          </div>
        `;
      }).join('');
    }
  }

  if(errFreqBox){
    const mapaCategorias = {};
    histPeriodo.forEach(h => {
      (h.relatorioCompleto?.ocorrencias || []).forEach(o => {
        if(o.severidade === 'erro_confirmado' || o.severidade === 'fragilidade_argumentativa'){
          mapaCategorias[o.categoria] = (mapaCategorias[o.categoria] || 0) + 1;
        }
      });
    });
    const ranking = Object.entries(mapaCategorias).sort((a, b) => b[1] - a[1]);
    if(ranking.length === 0){
      errFreqBox.innerHTML = `<p style="color:var(--muted);font-size:14px">Nenhum erro recorrente registrado nas redações do período selecionado.</p>`;
    } else {
      errFreqBox.innerHTML = `
        <ul class="list" style="font-size:14px">
          ${ranking.map(([cat, count]) => `<li><b>${esc(cat)}:</b> ${count} ocorrência(s) registrada(s)</li>`).join('')}
        </ul>
      `;
    }
  }

  // Tabela de Histórico com botão para abrir qualquer redação corrigida
  if(!histPeriodo.length){
    histBox.innerHTML = '<p style="padding:20px;color:var(--muted)">Nenhuma redação corrigida neste período.</p>';
  } else {
    const listaReversa = histPeriodo.map((item, idxOriginal) => ({ item, idxOriginal })).reverse();
    histBox.innerHTML = `
      <table style="width:100%;border-collapse:collapse;font-size:13.5px">
        <thead>
          <tr style="background:#f8fafc;border-bottom:2px solid var(--line);text-align:left">
            <th style="padding:10px 14px">Data & Hora</th>
            <th style="padding:10px 14px">Concurso / Banca</th>
            <th style="padding:10px 14px">Tema Avaliado</th>
            <th style="padding:10px 14px">Nota Estimada</th>
            <th style="padding:10px 14px">Ações</th>
          </tr>
        </thead>
        <tbody>
          ${listaReversa.map(({ item }) => `
            <tr style="border-bottom:1px solid var(--line)">
              <td style="padding:10px 14px;white-space:nowrap">${new Date(item.d).toLocaleDateString('pt-BR')} <small style="color:var(--muted)">${new Date(item.d).toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'})}</small></td>
              <td style="padding:10px 14px"><span class="badge" style="font-size:11px">${esc(item.banca)}</span></td>
              <td style="padding:10px 14px;max-width:300px">${esc(item.tema)}</td>
              <td style="padding:10px 14px"><b>${item.total.toFixed(item.target==='enem'?0:1)} / ${(item.max || 40).toFixed(0)} pts</b></td>
              <td style="padding:10px 14px;white-space:nowrap">
                <button type="button" class="btn btn-primary btn-sm" data-open-hist="${esc(item.id || item.d)}">📄 Abrir Relatório</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
}

/* =====================================================================
   11. HOME: ESTATÍSTICAS E TEMA DO DIA
   ===================================================================== */
function renderHome(){
  const hist = getUserData('redacao_hist', []);
  const spec = BANCA_SPECS[currentTarget];
  const targetHist = hist.filter(h => h.target === currentTarget);
  const avg = targetHist.length ? (targetHist.reduce((s, h) => s + h.total, 0) / targetHist.length) : 0;
  const best = targetHist.length ? Math.max(...targetHist.map(h => h.total)) : 0;

  // Renderizar o Banner de Boas-Vindas / Primeiro Login / Conexão Google
  if($('#userWelcomeBanner')){
    const temasSalvos = getUserData('redacao_temas_salvos', []);
    if(currentGoogleUser){
      if(isGoogleFirstLogin){
        $('#userWelcomeBanner').innerHTML = `
          <div class="first-login-banner">
            <div class="first-login-banner-left">
              <div class="first-login-icon">🎉</div>
              <div>
                <h3>Primeiro Login Detectado! Bem-vindo(a), ${esc(currentGoogleUser.nome)}!</h3>
                <p>Sua conta Google (<b>${esc(currentGoogleUser.email)}</b>) foi vinculada com sucesso. A partir de agora, todos os seus temas praticados, assuntos salvos, notas e redações ficarão salvos automaticamente!</p>
              </div>
            </div>
            <button type="button" class="btn btn-light btn-sm" data-go="escrever" style="background:#fff;color:#1e1b4b;font-weight:800">✍️ Começar Primeira Redação</button>
          </div>
        `;
      } else {
        $('#userWelcomeBanner').innerHTML = `
          <div class="first-login-banner" style="background:linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%)">
            <div class="first-login-banner-left">
              <div class="first-login-icon">✨</div>
              <div>
                <h3 style="color:#a7f3d0">Bem-vindo(a) de volta, ${esc(currentGoogleUser.nome)}!</h3>
                <p>Seus <b>${temasSalvos.length} assunto(s) salvo(s)</b> e histórico de <b>${hist.length} redação(ões)</b> estão salvos e sincronizados com a sua Conta Google.</p>
              </div>
            </div>
            <button type="button" class="btn btn-light btn-sm" data-go="evolucao" style="background:#fff;color:#064e3b;font-weight:800">📊 Consultar Meu Histórico</button>
          </div>
        `;
      }
    } else {
      $('#userWelcomeBanner').innerHTML = `
        <div class="first-login-banner" style="background:linear-gradient(135deg, #1e293b 0%, #334155 100%);border-color:#475569">
          <div class="first-login-banner-left">
            <div class="first-login-icon">🔒</div>
            <div>
              <h3 style="color:#fde047">Identifique-se com sua Conta Google para Salvar seus Assuntos</h3>
              <p>Conecte-se com o Google para que suas redações, temas favoritados e notas nunca sejam perdidos e fiquem sempre salvos.</p>
            </div>
          </div>
          <button type="button" class="btn btn-primary btn-sm" id="btnBannerGoogleLogin" style="font-weight:800">👤 Conectar Conta Google Agora</button>
        </div>
      `;
      const bBtn = $('#btnBannerGoogleLogin');
      if(bBtn) bBtn.onclick = () => $('#googleAuthModal')?.classList.add('show');
    }
  }

  if($('#homeStats')){
    $('#homeStats').innerHTML = `
      <div class="card stat s1"><div class="n">${targetHist.length}</div><div class="l">Redações na Banca</div></div>
      <div class="card stat s2"><div class="n">${targetHist.length ? avg.toFixed(1) : '–'}</div><div class="l">Média Atual (${esc(spec.short)})</div></div>
      <div class="card stat s3"><div class="n">${targetHist.length ? best.toFixed(1) : '–'}</div><div class="l">Recorde Pessoal</div></div>
      <div class="card stat s4"><div class="n">${spec.maxScore.toFixed(0)}</div><div class="l">Pontuação Máxima</div></div>
    `;
  }

  const temaDoDia = TEMAS.find(t => t.e === currentTarget) || TEMAS[0];
  if($('#dailyCard') && temaDoDia){
    $('#dailyCard').innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap">
        <span class="badge" style="background:var(--th-primary);color:#fff">Foco: ${esc(spec.short)} · ${esc(spec.banca)}</span>
        <small style="color:var(--muted)">Proposta selecionada para o seu objetivo</small>
      </div>
      <h3 style="font-size:20px;margin-bottom:8px">${esc(temaDoDia.t)}</h3>
      <p style="margin-bottom:6px"><b>Problema Central:</b> ${esc(temaDoDia.problema || temaDoDia.f)}</p>
      <p style="margin-bottom:6px"><b>Comando da Proposta:</b> ${esc(temaDoDia.comando || temaDoDia.f)}</p>
      <p><b>Repertório Sugerido:</b> ${esc(temaDoDia.r)}</p>
      <div style="margin-top:14px">
        <button type="button" class="btn btn-primary btn-sm" id="btnUseDaily">✍️ Escrever sobre este Tema</button>
      </div>
    `;

    $('#btnUseDaily').onclick = () => {
      $('#inTema').value = temaDoDia.t;
      if($('#inComando')) $('#inComando').value = temaDoDia.comando || '';
      setUserData('redacao_tema', temaDoDia.t);
      go('escrever');
      toast('Tema e comando carregados na folha de redação!');
    };
  }
}

/* =====================================================================
   12. ROTEAMENTO DE ABAS E INICIALIZAÇÃO COMPLETA DE EVENTOS
   ===================================================================== */
const VIEWS = ['inicio', 'escrever', 'criterios', 'aulas', 'temas', 'repertorio', 'portugues', 'evolucao'];

function go(id){
  if(!VIEWS.includes(id)) id = 'inicio';
  $$('.view').forEach(v => v.classList.toggle('active', v.id === 'v-' + id));
  $$('#nav button').forEach(b => b.classList.toggle('active', b.dataset.go === id));
  if(typeof location !== 'undefined' && location.hash !== '#' + id && typeof history !== 'undefined' && history.replaceState) {
    history.replaceState(null, '', '#' + id);
  }
  if(typeof window !== 'undefined' && window.scrollTo) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if(id === 'inicio') renderHome();
  if(id === 'criterios') renderCriteriaTab(currentTarget);
  if(id === 'repertorio') renderRepertorioLibrary();
  if(id === 'temas') renderTemas();
  if(id === 'portugues') renderPortugues();
  if(id === 'evolucao') renderEvolution();
}

function inicializarApp(){
  // 1. Folha pautada dinâmica por banca e métricas
  const essayEl = $('#essay');
  const gutterEl = $('#gutter');
  renderizarFolhaPautada();
  if(essayEl && gutterEl){
    essayEl.addEventListener('scroll', () => { gutterEl.scrollTop = essayEl.scrollTop; });
  }

  function carregarDadosPerfilAtivo(){
    currentTarget = getUserData('redacao_target', 'pmpe');
    applyTarget(currentTarget, false);

    if($('#inNome')) $('#inNome').value = getUserData('redacao_nome', '');
    if($('#inTema')) $('#inTema').value = getUserData('redacao_tema', '');
    if($('#inComando')) $('#inComando').value = getUserData('redacao_comando', '');
    if(essayEl){
      essayEl.value = getUserData('redacao_draft', '');
      atualizarMetricas();
      if($('#pSave')) $('#pSave').textContent = essayEl.value ? 'Rascunho recuperado ✓' : 'Rascunho vazio';
    }
  }

  if(essayEl){
    essayEl.addEventListener('input', () => {
      atualizarMetricas();
      setUserData('redacao_draft', essayEl.value);
      if($('#pSave')) $('#pSave').textContent = 'Rascunho salvo ✓';
    });
  }

  if($('#inNome')){
    $('#inNome').addEventListener('input', e => setUserData('redacao_nome', e.target.value));
  }
  if($('#inTema')){
    $('#inTema').addEventListener('input', e => setUserData('redacao_tema', e.target.value));
  }
  if($('#inComando')){
    $('#inComando').addEventListener('input', e => setUserData('redacao_comando', e.target.value));
  }

  // Botões da barra de ferramentas do editor
  if($('#btnCopy')){
    $('#btnCopy').onclick = () => {
      if(!essayEl.value.trim()) return toast('Nada para copiar.');
      copy(essayEl.value, 'Texto da redação copiado!');
    };
  }
  if($('#btnClear')){
    $('#btnClear').onclick = () => {
      if(essayEl.value && !confirm('Deseja limpar todo o texto da folha?')) return;
      essayEl.value = '';
      setUserData('redacao_draft', '');
      atualizarMetricas();
      if($('#resultado')) $('#resultado').style.display = 'none';
      if($('#pSave')) $('#pSave').textContent = 'Rascunho vazio';
    };
  }
  if($('#btnRandom')){
    $('#btnRandom').onclick = () => {
      const temasDaBanca = TEMAS.filter(t => t.e === currentTarget);
      const pool = temasDaBanca.length ? temasDaBanca : TEMAS;
      const t = pool[Math.floor(Math.random() * pool.length)];
      $('#inTema').value = t.t;
      if($('#inComando')) $('#inComando').value = t.comando || '';
      setUserData('redacao_tema', t.t);
      setUserData('redacao_comando', t.comando || '');
      toast(`Tema sorteado (${BANCA_SPECS[currentTarget].short}): ${t.t.slice(0, 48)}...`);
    };
  }

  // Cronômetro
  let timerInterval = null, timerSeconds = 0, timerStart = 0;
  const formatTime = s => {
    s = Math.max(0, s);
    const m = Math.floor(s / 60), r = s % 60;
    return String(m).padStart(2, '0') + ':' + String(r).padStart(2, '0');
  };
  function updateTimerView(){
    const limit = +($('#timerPreset') ? $('#timerPreset').value : 0) * 60;
    const el = $('#timer');
    if(!el) return;
    if(limit > 0){
      const left = limit - timerSeconds;
      el.textContent = formatTime(left);
      el.classList.toggle('warn', left <= 300 && left > 0);
      if(left <= 0 && timerInterval){
        clearInterval(timerInterval);
        timerInterval = null;
        if($('#btnTimer')) $('#btnTimer').textContent = '▶ Iniciar';
        toast('⏰ Tempo limite do simulado atingido!');
      }
    } else {
      el.textContent = formatTime(timerSeconds);
      el.classList.remove('warn');
    }
  }
  if($('#timerPreset')){
    $('#timerPreset').addEventListener('change', updateTimerView);
  }
  if($('#btnTimer')){
    $('#btnTimer').onclick = () => {
      if(timerInterval){
        clearInterval(timerInterval);
        timerInterval = null;
        $('#btnTimer').textContent = '▶ Iniciar';
        return;
      }
      const base = timerSeconds;
      timerStart = Date.now();
      timerInterval = setInterval(() => {
        timerSeconds = base + Math.floor((Date.now() - timerStart) / 1000);
        updateTimerView();
      }, 250);
      $('#btnTimer').textContent = '⏸ Pausar';
    };
  }
  if($('#btnTimerReset')){
    $('#btnTimerReset').onclick = () => {
      clearInterval(timerInterval);
      timerInterval = null;
      timerSeconds = 0;
      if($('#btnTimer')) $('#btnTimer').textContent = '▶ Iniciar';
      updateTimerView();
    };
  }
  updateTimerView();

  // Modal de seleção de Concurso/Banca
  const openModal = () => $('#targetModal') && $('#targetModal').classList.add('show');
  const closeModal = () => $('#targetModal') && $('#targetModal').classList.remove('show');
  if($('#btnOpenTargetModal')) $('#btnOpenTargetModal').onclick = openModal;
  if($('#heroBtnChangeTarget')) $('#heroBtnChangeTarget').onclick = openModal;
  if($('#btnChangeTargetFromEditor')) $('#btnChangeTargetFromEditor').onclick = openModal;
  if($('#btnCloseTargetModal')) $('#btnCloseTargetModal').onclick = closeModal;

  $$('.target-choice-card').forEach(card => {
    card.addEventListener('click', () => {
      const sel = card.dataset.setTarget;
      applyTarget(sel, true);
      toast(`Objetivo atualizado para ${BANCA_SPECS[sel].name}`);
    });
  });

  if($('#btnConfirmTarget')){
    $('#btnConfirmTarget').onclick = () => {
      closeModal();
      go('escrever');
    };
  }

  if($('#inTarget')){
    $('#inTarget').addEventListener('change', e => {
      applyTarget(e.target.value, true);
      toast(`Banca alterada para ${BANCA_SPECS[e.target.value].banca}`);
    });
  }

  // Seletor de Perfil de Aluno (Isolamento de Dados)
  const profileSelect = $('#profileSelect');
  function syncProfileSelector(){
    if(!profileSelect) return;
    const profiles = getProfiles();
    profileSelect.innerHTML = profiles.map(p => `<option value="${esc(p.id)}" ${p.id === activeProfileId ? 'selected' : ''}>👤 ${esc(p.nome)}</option>`).join('') +
      `<option value="__new__">➕ Novo Perfil de Aluno...</option>`;
  }
  if(profileSelect){
    syncProfileSelector();
    profileSelect.addEventListener('change', e => {
      if(e.target.value === '__new__'){
        const novoNome = prompt('Digite o nome do novo perfil de aluno(a):');
        if(novoNome && novoNome.trim()){
          const profiles = getProfiles();
          const newId = 'u_' + Date.now();
          profiles.push({ id: newId, nome: novoNome.trim().slice(0, 50) });
          store.set('redacao_profiles', profiles);
          activeProfileId = newId;
          store.set('redacao_active_profile', activeProfileId);
          setUserData('redacao_nome', novoNome.trim().slice(0, 50));
          syncProfileSelector();
          carregarDadosPerfilAtivo();
          renderEvolution();
          renderPortugues();
          toast(`Perfil "${novoNome.trim()}" criado com histórico isolado!`);
        } else {
          profileSelect.value = activeProfileId;
        }
        return;
      }
      activeProfileId = e.target.value;
      store.set('redacao_active_profile', activeProfileId);
      carregarDadosPerfilAtivo();
      renderEvolution();
      renderPortugues();
      toast('Perfil de aluno alternado com sucesso!');
    });
  }

  // Eventos de Abas de Critérios e PDFs
  if($('#criteriaChips')){
    $('#criteriaChips').addEventListener('click', e => {
      const btn = e.target.closest('[data-target-tab]');
      if(!btn) return;
      $$('#criteriaChips .chipbtn').forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
      renderCriteriaTab(btn.dataset.targetTab);
    });
  }

  $$('.pdf-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.pdf-tab-btn').forEach(b => b.classList.remove('active'));
      $$('.pdf-module').forEach(m => m.classList.remove('active'));
      btn.classList.add('active');
      const mod = $('#pdf-' + btn.dataset.pdf);
      if(mod) mod.classList.add('active');
    });
  });

  // Eventos de Temas
  if($('#tSearch')) $('#tSearch').addEventListener('input', renderTemas);
  if($('#tChips')){
    $('#tChips').addEventListener('click', e => {
      const b = e.target.closest('[data-eixo]');
      if(b){ eixoFiltro = b.dataset.eixo; renderTemas(); }
    });
  }
  if($('#tGrid')){
    $('#tGrid').addEventListener('click', e => {
      const b = e.target.closest('[data-act]');
      if(!b) return;
      const card = b.closest('.tcard');
      const t = TEMAS[+card.dataset.i];
      if(b.dataset.act === 'det'){
        card.classList.toggle('open');
        b.textContent = card.classList.contains('open') ? 'Ocultar Roteiro' : 'Ver Roteiro Completo';
      } else {
        $('#inTema').value = t.t;
        if($('#inComando')) $('#inComando').value = t.comando || '';
        setUserData('redacao_tema', t.t);
        setUserData('redacao_comando', t.comando || '');
        go('escrever');
        toast('Tema e comando carregados na folha de redação!');
      }
    });
  }

  // Eventos da Biblioteca de Repertório
  if($('#repSearch')) $('#repSearch').addEventListener('input', renderRepertorioLibrary);
  if($('#repChips')){
    $('#repChips').addEventListener('click', e => {
      const b = e.target.closest('[data-rep-cat]');
      if(b){ repCatFiltro = b.dataset.repCat; renderRepertorioLibrary(); }
    });
  }

  // Delegação global de cliques (Navegação, Conectivos, Repertório, Quiz, Histórico)
  document.addEventListener('click', e => {
    const goBtn = e.target.closest('[data-go]');
    if(goBtn){
      go(goBtn.dataset.go);
      return;
    }

    const copyConn = e.target.closest('[data-copy-conn]');
    if(copyConn){
      copy(copyConn.dataset.copyConn, `Conectivo "${copyConn.dataset.copyConn}" copiado!`);
      return;
    }

    const copyRep = e.target.closest('[data-copy-rep]');
    if(copyRep){
      copy(copyRep.dataset.copyRep, 'Aplicação de repertório copiada!');
      return;
    }

    const insertRep = e.target.closest('[data-insert-rep]');
    if(insertRep && essayEl){
      const txt = insertRep.dataset.insertRep;
      essayEl.value = (essayEl.value ? essayEl.value.trim() + '\n\n' : '') + txt;
      setUserData('redacao_draft', essayEl.value);
      atualizarMetricas();
      go('escrever');
      toast('Repertório inserido na sua folha de redação!');
      return;
    }

    // Salvar / Desfavoritar Assunto no Banco de Temas
    const saveTopicBtn = e.target.closest('[data-toggle-save-topic]');
    if(saveTopicBtn){
      const tTitle = saveTopicBtn.dataset.toggleSaveTopic;
      let salvos = getUserData('redacao_temas_salvos', []);
      const idx = salvos.findIndex(s => (s.tema || s.t || s) === tTitle);
      if(idx !== -1){
        salvos.splice(idx, 1);
        toast('Assunto removido dos seus salvos.');
      } else {
        salvos.push({ tema: tTitle, salvoEm: new Date().toISOString() });
        toast('⭐ Assunto salvo com sucesso na sua conta Google!');
      }
      setUserData('redacao_temas_salvos', salvos);
      syncUserDataToServer();
      renderTemas();
      return;
    }

    // Quiz
    if(e.target.id === 'btnRestartQuiz'){
      qIdx = 0;
      renderQuiz();
      return;
    }
    if(e.target.id === 'btnNextQuiz'){
      qIdx++;
      renderQuiz();
      return;
    }
    const quizOpt = e.target.closest('[data-quiz-opt]');
    if(quizOpt){
      const picked = +quizOpt.dataset.quizOpt;
      const q = QUIZ_BANCA[qIdx];
      const feed = $('#quizFeed');
      if(feed){
        const statusHtml = picked === q.a
          ? `<span style="color:#15803d;font-weight:800">✅ Resposta Correta!</span>`
          : `<span style="color:#b91c1c;font-weight:800">❌ Resposta Incorreta.</span>`;
        feed.innerHTML = `
          <div style="background:#f8fafc;padding:12px;border-radius:10px;border:1px solid var(--line);margin-top:8px">
            <div>${statusHtml} ${esc(q.exp)}</div>
            <div style="margin-top:6px"><b>📏 Regra Gramatical:</b> ${esc(q.regra || '')}</div>
            <div style="margin-top:6px"><b>✍️ Exemplo Adicional:</b> <i>${esc(q.exemploAdicional || '')}</i></div>
            <button type="button" class="btn btn-primary btn-sm" id="btnNextQuiz" style="margin-top:10px">Próxima Questão ➔</button>
          </div>
        `;
      }
      $$('#quiz [data-quiz-opt]').forEach((b, i) => {
        b.disabled = true;
        if(i === q.a) b.style.borderColor = '#15803d';
        if(i === picked && picked !== q.a) b.style.borderColor = '#b91c1c';
      });
      return;
    }

    // Abrir relatório completo salvo no histórico
    const openHist = e.target.closest('[data-open-hist]');
    if(openHist){
      const id = openHist.dataset.openHist;
      const hist = getUserData('redacao_hist', []);
      const item = hist.find(h => (h.id || h.d) === id);
      if(item){
        applyTarget(item.target || 'pmpe', false);
        if($('#inTema')) $('#inTema').value = item.tema || '';
        if($('#inComando')) $('#inComando').value = item.comando || '';
        if(essayEl && item.texto){
          essayEl.value = item.texto;
          atualizarMetricas();
        }
        const rel = item.relatorioCompleto || avaliarRedacao(item.texto || item.tema, item.tema, item.target || 'pmpe', item.comando || '');
        go('escrever');
        setTimeout(() => {
          renderizarResultado(rel, item.nome || $('#inNome')?.value, item.tema, item.target || 'pmpe');
          toast('Relatório completo recuperado do histórico!');
        }, 120);
      }
      return;
    }

    // Filtro de período no histórico
    const histFilter = e.target.closest('[data-hist-period]');
    if(histFilter){
      periodoFiltroHist = histFilter.dataset.histPeriod;
      $$('[data-hist-period]').forEach(b => b.classList.toggle('on', b.dataset.histPeriod === periodoFiltroHist));
      renderEvolution();
      return;
    }
  });

  document.addEventListener('change', e => {
    if(e.target.matches('[data-check]')){
      const c = getUserData('redacao_check', {});
      c[e.target.dataset.check] = e.target.checked;
      setUserData('redacao_check', c);
    }
  });

  if($('#btnHistClear')){
    $('#btnHistClear').onclick = () => {
      if(confirm('Tem certeza de que deseja apagar o histórico de redações deste perfil?')){
        setUserData('redacao_hist', []);
        renderEvolution();
        renderPortugues();
        toast('Histórico limpo com sucesso.');
      }
    };
  }

  // Modal de Auditoria & Testes Automatizados (Seção 13)
  if($('#btnOpenTests')){
    $('#btnOpenTests').onclick = () => {
      const modal = $('#testModal');
      const body = $('#testModalBody');
      if(!modal || !body) return;
      const suite = global.RedacaoTestes.executarSuiteTestes();
      body.innerHTML = `
        <div class="notice ${suite.todosPassaram ? 'notice-militar' : 'notice-crimson'}">
          <b>Resultado da Execução: ${suite.aprovados} / ${suite.total} testes aprovados (${suite.falhas} falhas)</b> · Executado em ${new Date(suite.executadoEm).toLocaleTimeString('pt-BR')}
        </div>
        <div style="display:grid;gap:8px;max-height:55vh;overflow-y:auto">
          ${suite.resultados.map(r => `
            <div style="padding:10px 12px;border:1px solid var(--line);border-left:4px solid ${r.passou ? '#15803d' : '#b91c1c'};border-radius:10px;background:#f8fafc;font-size:13px">
              <div style="display:flex;justify-content:space-between;gap:8px">
                <b>${r.passou ? '✅' : '❌'} ${esc(r.nome)}</b>
                <span class="pill" style="font-size:11px">${esc(r.categoria)}</span>
              </div>
              <div style="color:var(--muted);margin-top:4px">${esc(r.detalhe)}</div>
            </div>
          `).join('')}
        </div>
      `;
      modal.classList.add('show');
    };
  }
  if($('#btnCloseTestsModal')){
    $('#btnCloseTestsModal').onclick = () => $('#testModal').classList.remove('show');
  }

  // Handlers do Modal de Autenticação Google
  if($('#btnCloseGoogleModal')){
    $('#btnCloseGoogleModal').onclick = () => $('#googleAuthModal')?.classList.remove('show');
  }
  if($('#btnSkipGoogleLogin')){
    $('#btnSkipGoogleLogin').onclick = () => {
      $('#googleAuthModal')?.classList.remove('show');
      toast('Continuando em modo visitante. Para salvar suas redações e assuntos, faça login com o Google.');
    };
  }
  if($('#btnConfirmGoogleLogin')){
    $('#btnConfirmGoogleLogin').onclick = () => {
      const email = $('#googleModalEmail')?.value.trim();
      const nome = $('#googleModalNome')?.value.trim();
      if(!email || !email.includes('@')){
        toast('Por favor, informe um endereço de e-mail Google válido (ex: seu.nome@gmail.com).');
        return;
      }
      processGoogleLogin({ email, nome: nome || email.split('@')[0] });
    };
  }
  if($('#btnQuickDemoGoogle')){
    $('#btnQuickDemoGoogle').onclick = () => {
      processGoogleLogin({
        email: 'aluno.concursos@gmail.com',
        nome: 'Aluno Concurseiro (Demo)',
        picture: 'https://lh3.googleusercontent.com/a/default-user'
      });
    };
  }

  // Handlers do Modal de Configuração de Chaves de IA
  const openAiModal = () => {
    const modal = $('#aiConfigModal');
    if(!modal) return;
    if($('#aiKeyGemini')) $('#aiKeyGemini').value = store.get('redacao_gemini_key', '');
    if($('#aiKeyOpenai')) $('#aiKeyOpenai').value = store.get('redacao_openai_key', '');
    modal.classList.add('show');
  };
  const closeAiModal = () => $('#aiConfigModal')?.classList.remove('show');

  if($('#btnOpenAiConfig')) $('#btnOpenAiConfig').onclick = openAiModal;
  if($('#aiStatusPill')) $('#aiStatusPill').onclick = openAiModal;
  if($('#btnCloseAiModal')) $('#btnCloseAiModal').onclick = closeAiModal;
  if($('#btnCancelAiModal')) $('#btnCancelAiModal').onclick = closeAiModal;

  if($('#btnSaveAiKeys')){
    $('#btnSaveAiKeys').onclick = async () => {
      const geminiKey = $('#aiKeyGemini')?.value.trim() || '';
      const openaiKey = $('#aiKeyOpenai')?.value.trim() || '';
      store.set('redacao_gemini_key', geminiKey);
      store.set('redacao_openai_key', openaiKey);

      try {
        const resp = await fetch('/api/config/save-keys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ geminiKey, openaiKey })
        });
        if(resp.ok){
          const data = await resp.json();
          toast(data.message || 'Chaves salvas com sucesso no arquivo .env!');
        } else {
          toast('Chave salva no seu navegador.');
        }
      } catch(err){
        toast('Chave salva no navegador (modo offline).');
      }

      closeAiModal();
      if($('#aiStatusText')){
        if(geminiKey){
          $('#aiStatusText').innerHTML = 'IA Conectada: <b>Google Gemini Ativo (Cascata Pro/Flash)</b>';
        } else {
          $('#aiStatusText').innerHTML = 'IA Multi-Modelo: <b>Gemini Pro/Flash ➔ OpenAI ➔ Motor Local</b>';
        }
      }
    };
  }

  function initGsi(){
    if(typeof google !== 'undefined' && google.accounts && google.accounts.id){
      try {
        const c = $('#googleGsiBtnContainer');
        if(c){
          google.accounts.id.initialize({
            client_id: '1088484920482-mockredacao.apps.googleusercontent.com',
            callback: global.handleGoogleCredentialResponse,
            auto_select: false
          });
          google.accounts.id.renderButton(c, {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 280
          });
        }
      } catch(err){
        console.warn('[GSI] Erro ao renderizar botão oficial Google:', err.message);
      }
    }
  }
  setTimeout(initGsi, 500);

  window.addEventListener('hashchange', () => go(location.hash.slice(1)));

  // Inicialização
  renderGoogleAuthUI();
  carregarDadosPerfilAtivo();
  configurarCorretor();
  renderTemas();
  renderRepertorioLibrary();
  renderPortugues();
  renderQuiz();

  // Se o aluno nunca fez login com Google nesta máquina, abre o modal de boas-vindas do Google
  if(!store.get('redacao_google_visited') && !currentGoogleUser){
    store.set('redacao_google_visited', true);
    setTimeout(() => $('#googleAuthModal')?.classList.add('show'), 400);
  } else if(!localStorage.getItem('redacao_target')){
    setTimeout(() => $('#targetModal')?.classList.add('show'), 400);
  }

  go(location.hash.slice(1) || 'inicio');
}

global.RedacaoApp = {
  go,
  applyTarget,
  renderizarResultado,
  inicializarApp
};

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', inicializarApp);
} else {
  inicializarApp();
}

})(window);
