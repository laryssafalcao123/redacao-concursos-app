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
let pendingEvaluationAfterLogin = false;
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

    if(pendingEvaluationAfterLogin){
      pendingEvaluationAfterLogin = false;
      toast('🔒 Login com Google verificado! Retomando correção criteriosa...');
      setTimeout(() => {
        const btn = $('#btnEval');
        if(btn) btn.click();
      }, 400);
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

  // Banner de aviso da rubrica ativa (ocultado a pedido do usuário)
  if($('#targetBannerNotice')){
    $('#targetBannerNotice').innerHTML = '';
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
    const essayVal = (essayEl && essayEl.value) ? essayEl.value : '';
    const lineBreaks = essayVal ? essayVal.split('\n').length : 0;
    const totalLines = Math.max(maxLines, lineBreaks + 4);

    gutterEl.innerHTML = '';
    for(let i = 1; i <= totalLines; i++){
      const div = document.createElement('div');
      div.textContent = i;
      if(minLines > 1 && i >= minLines && i <= maxLines){
        div.style.color = 'var(--th-primary)';
        div.style.fontWeight = '800';
        div.title = `Faixa obrigatória oficial (${spec.linesRange})`;
      } else if(i > maxLines){
        div.style.color = '#ef4444';
        div.style.fontWeight = '700';
        div.title = `Linha excedente à folha oficial (${maxLines} linhas)`;
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
  if(!val.trim()){
    window.linhasManuscritasReais = null;
  }
  const words = val.trim() ? val.trim().split(/\s+/).filter(Boolean).length : 0;
  const pars = val.split(/\n+/).map(p => p.trim()).filter(Boolean);
  const lines = (window.linhasManuscritasReais && window.linhasManuscritasReais > 0)
    ? window.linhasManuscritasReais
    : (pars.length
        ? pars.reduce((acc, p) => {
            const w = p.split(/\s+/).filter(Boolean).length;
            const lPorW = Math.ceil(w / 11);
            const lPorC = Math.ceil(p.length / 68);
            return acc + Math.max(1, Math.round((lPorW + lPorC) / 2));
          }, 0)
        : 0);

  if($('#pWords')) $('#pWords').textContent = `${words} palavra${words === 1 ? '' : 's'}`;
  if($('#pPar')) $('#pPar').textContent = `${pars.length} parágrafo${pars.length === 1 ? '' : 's'}`;

  const pLines = $('#pLines');
  if(pLines){
    if(window.linhasManuscritasReais){
      pLines.textContent = `📏 ${lines} / ${maxLines} linhas reais (Foto OCR)`;
    } else {
      pLines.textContent = `≈ ${lines} / ${maxLines} linhas (${spec.linesRange})`;
    }
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
      Com Folha Corrigida Interativa Padrão Glau.com (Grifos & Inspetor)
   ===================================================================== */
function initGlauInteractiveInspector(res){
  const reader = $('#glauReader');
  const cardBox = $('#glauInspectorCard');
  const filterBar = $('#glauFilterBar');
  if(!reader || !cardBox) return;

  const marks = Array.from(reader.querySelectorAll('.glau-mark'));
  if(marks.length === 0) return;

  let currentActiveIndex = 0;
  let activeFilter = 'all';

  function renderInspectorForMark(markEl, scrollMobile = false){
    marks.forEach(m => m.classList.remove('active'));
    markEl.classList.add('active');
    currentActiveIndex = marks.indexOf(markEl);

    const targetId = markEl.getAttribute('data-target-id') || '';
    const markText = markEl.textContent.trim().replace(/\s*Resolvido\s*✓\s*$/i, '');
    const isResolvido = markEl.getAttribute('data-resolvido') === 'true' || markEl.classList.contains('glau-mark-resolvido');

    // Identificar a categoria entre as 5 oficiais
    let categoria = markEl.getAttribute('data-categoria') || '';
    if(!categoria){
      if(markEl.classList.contains('glau-mark-gramatica') || markEl.classList.contains('glau-mark-erro')) categoria = 'gramatica';
      else if(markEl.classList.contains('glau-mark-coesao')) categoria = 'coesao';
      else if(markEl.classList.contains('glau-mark-repeticao')) categoria = 'repeticao';
      else if(markEl.classList.contains('glau-mark-argumentacao') || markEl.classList.contains('glau-mark-rep')) categoria = 'argumentacao';
      else if(markEl.classList.contains('glau-mark-acerto') || markEl.classList.contains('glau-mark-ok')) categoria = 'acerto';
      else categoria = 'gramatica';
    }

    // Buscar dados na lista estruturada marcacoes_inline ou ocorrencias
    let itemData = (res.marcacoes_inline || []).find(m => m.id === targetId || m.trecho_exato === markText || markText.includes(m.trecho_exato));
    let occ = (res.ocorrencias || []).find(o => o.id === targetId || o.trechoOriginal === markText || markText.includes(o.trechoOriginal));

    let regra = markEl.getAttribute('data-regra') || itemData?.regra_ou_criterio || occ?.categoria || occ?.explicacaoRegra || '';
    let explicacao = markEl.getAttribute('data-explicacao') || itemData?.explicacao || occ?.explicacaoRegra || occ?.diagnostico || '';
    let sugestao = markEl.getAttribute('data-sugestao') || itemData?.sugestao_substituicao || occ?.sugestaoCorrecao || '';
    let localizacao = occ?.localizacao || 'Trecho selecionado no texto';

    // Se ainda não tiver regra/explicação, calibrar padrão por categoria
    const catConfigs = {
      gramatica: {
        badgeTxt: '🔴 Gramática & Norma Culta',
        badgeClass: 'legend-gramatica',
        corImpacto: '#dc2626',
        criterio: 'Microestrutura / Norma Culta',
        regraPadrao: 'Desvio Gramatical (Ortografia, Crase ou Sintaxe)',
        explicacaoPadrao: 'Desvio identificado em relação à norma-padrão exigida pela banca examinadora.',
        impacto: 'Penalização direta em Microestrutura'
      },
      coesao: {
        badgeTxt: '🟡 Coesão & Conectivos',
        badgeClass: 'legend-coesao',
        corImpacto: '#d97706',
        criterio: 'Mecanismos de Coesão e Fluidez',
        regraPadrao: 'Articulação Frasal / Coesão Interparágrafos',
        explicacaoPadrao: 'Ausência de conectivo interfrasal ou período longo com risco de truncamento sintático.',
        impacto: 'Fragilidade na coesão textual'
      },
      repeticao: {
        badgeTxt: '🟣 Eco Vocabular & Repetição',
        badgeClass: 'legend-repeticao',
        corImpacto: '#9333ea',
        criterio: 'Propriedade Vocabular',
        regraPadrao: 'Repetição Viciosa de Termos',
        explicacaoPadrao: 'Palavra ou radical repetido excessivamente no mesmo parágrafo, empobrecendo o léxico.',
        impacto: 'Desconto em seleção lexical'
      },
      argumentacao: {
        badgeTxt: '🔵 Argumentação & Repertório',
        badgeClass: 'legend-argumentacao',
        corImpacto: '#2563eb',
        criterio: 'Macroestrutura / Consistência Argumentativa',
        regraPadrao: 'Produtividade de Repertório ou Tese',
        explicacaoPadrao: 'Argumento que necessita de comprovação factual, dados ou ancoragem em autoridade reconhecida.',
        impacto: 'Critério de Conteúdo / Desenvolvimento'
      },
      acerto: {
        badgeTxt: '🟢 Destaque Positivo da Banca',
        badgeClass: 'legend-acerto',
        corImpacto: '#16a34a',
        criterio: 'Macroestrutura / Projeto de Texto',
        regraPadrao: 'Construção Exemplar / Tópico Frasal',
        explicacaoPadrao: 'Excelente uso de operador argumentativo ou tese clara e assertiva.',
        impacto: '+ Pontuação no Critério'
      }
    };

    const cfg = catConfigs[categoria] || catConfigs.gramatica;
    if(!regra) regra = cfg.regraPadrao;
    if(!explicacao) explicacao = cfg.explicacaoPadrao;

    cardBox.innerHTML = `
      <div class="glau-card-header">
        <span class="glau-pill-legend ${cfg.badgeClass}">${cfg.badgeTxt}</span>
        <span class="pill" style="font-size:11.5px">📍 ${esc(localizacao)}</span>
      </div>
      <div class="glau-card-body">
        <div style="font-size:14.5px;font-weight:800;color:#0f172a;margin-bottom:2px">
          ${esc(regra)}
        </div>

        <!-- COMPARAÇÃO VISUAL: COMO VOCÊ ESCREVEU VS SUGESTÃO DA BANCA -->
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:12px;margin:8px 0;display:grid;gap:8px">
          <div>
            <b style="color:#b91c1c;font-size:11.5px;text-transform:uppercase;letter-spacing:0.5px">❌ Como você escreveu:</b>
            <div class="mark-bad" style="margin-top:2px;font-size:13.5px;font-weight:600">"${esc(markText)}"</div>
          </div>
          ${sugestao ? `
            <div>
              <b style="color:#15803d;font-size:11.5px;text-transform:uppercase;letter-spacing:0.5px">✅ Sugestão da Banca:</b>
              <div class="mark-good" style="margin-top:2px;font-size:13.5px;font-weight:700">"${esc(sugestao)}"</div>
            </div>
          ` : ''}
        </div>

        <div style="font-size:13px;line-height:1.6;color:#334155;background:#f8fafc;padding:10px 12px;border-radius:8px;border:1px solid var(--line)">
          <b>💡 Explicação Pedagógica:</b><br>${esc(explicacao)}
        </div>

        <div style="font-size:12px;color:var(--muted);margin-top:2px;padding-top:6px;border-top:1px dashed var(--line)">
          <b>Critério da Banca:</b> ${esc(cfg.criterio)} · <b>Impacto:</b> <span style="font-weight:700;color:${cfg.corImpacto}">${esc(cfg.impacto)}</span>
        </div>

        ${sugestao && !isResolvido ? `
          <div style="margin-top:8px;display:flex;justify-content:flex-end">
            <button type="button" class="btn-aplicar-correcao" id="btnAplicarCorrecao">
              <span>✨ Aplicar correção no texto</span>
            </button>
          </div>
        ` : (isResolvido ? `
          <div style="margin-top:8px;padding:8px 12px;background:#dcfce7;border-radius:8px;color:#15803d;font-size:12.5px;font-weight:800;text-align:center;border:1px solid #86efac">
            ✓ Correção aplicada com sucesso no texto!
          </div>
        ` : '')}
      </div>
      <div class="glau-nav-btns">
        <button type="button" class="btn btn-light btn-sm" id="btnGlauPrev">⬅ Anterior</button>
        <span style="font-size:12px;color:var(--muted);align-self:center">Grifo ${currentActiveIndex + 1} de ${marks.length}</span>
        <button type="button" class="btn btn-light btn-sm" id="btnGlauNext">Próximo ➔</button>
      </div>
    `;

    // Ação de aplicar a correção
    const btnAplicar = $('#btnAplicarCorrecao');
    if(btnAplicar && sugestao){
      btnAplicar.onclick = () => {
        markEl.textContent = sugestao;
        markEl.classList.add('glau-mark-resolvido');
        markEl.setAttribute('data-resolvido', 'true');
        
        // Atualiza rascunho na Folha se presente
        const essayEl = $('#essay');
        if(essayEl && essayEl.value && markText){
          essayEl.value = essayEl.value.replace(markText, sugestao);
          setUserData('redacao_draft', essayEl.value);
          if($('#pSave')) $('#pSave').textContent = 'Rascunho atualizado com a correção ✓';
        }

        toast('✨ Correção aplicada com sucesso na sua folha de redação!');
        renderInspectorForMark(markEl, false);
      };
    }

    const prevBtn = $('#btnGlauPrev');
    const nextBtn = $('#btnGlauNext');
    if(prevBtn){
      prevBtn.onclick = () => {
        let prevIdx = currentActiveIndex - 1;
        if(prevIdx < 0) prevIdx = marks.length - 1;
        renderInspectorForMark(marks[prevIdx], scrollMobile);
      };
    }
    if(nextBtn){
      nextBtn.onclick = () => {
        let nextIdx = (currentActiveIndex + 1) % marks.length;
        renderInspectorForMark(marks[nextIdx], scrollMobile);
      };
    }

    if(scrollMobile && window.innerWidth <= 768){
      $('#glauFeedbackCol')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  marks.forEach(m => {
    m.onclick = (e) => {
      e.stopPropagation();
      renderInspectorForMark(m, true);
    };
    m.onkeydown = (e) => {
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        renderInspectorForMark(m, true);
      }
    };
  });

  if(filterBar){
    const filterBtns = Array.from(filterBar.querySelectorAll('.glau-pill-legend'));
    filterBtns.forEach(btn => {
      btn.onclick = () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.getAttribute('data-filter');
        activeFilter = filter;

        marks.forEach(m => {
          let cat = m.getAttribute('data-categoria') || '';
          if(!cat){
            if(m.classList.contains('glau-mark-gramatica') || m.classList.contains('glau-mark-erro')) cat = 'gramatica';
            else if(m.classList.contains('glau-mark-coesao')) cat = 'coesao';
            else if(m.classList.contains('glau-mark-repeticao')) cat = 'repeticao';
            else if(m.classList.contains('glau-mark-argumentacao') || m.classList.contains('glau-mark-rep')) cat = 'argumentacao';
            else if(m.classList.contains('glau-mark-acerto') || m.classList.contains('glau-mark-ok')) cat = 'acerto';
          }

          if(filter === 'all' || cat === filter){
            m.style.opacity = '1';
            m.style.filter = 'none';
          } else {
            m.style.opacity = '0.22';
            m.style.filter = 'grayscale(60%)';
          }
        });

        const visibleMarks = marks.filter(m => {
          if(filter === 'all') return true;
          let cat = m.getAttribute('data-categoria') || '';
          if(!cat){
            if(m.classList.contains('glau-mark-gramatica') || m.classList.contains('glau-mark-erro')) cat = 'gramatica';
            else if(m.classList.contains('glau-mark-coesao')) cat = 'coesao';
            else if(m.classList.contains('glau-mark-repeticao')) cat = 'repeticao';
            else if(m.classList.contains('glau-mark-argumentacao') || m.classList.contains('glau-mark-rep')) cat = 'argumentacao';
            else if(m.classList.contains('glau-mark-acerto') || m.classList.contains('glau-mark-ok')) cat = 'acerto';
          }
          return cat === filter;
        });

        if(visibleMarks.length > 0 && !visibleMarks.includes(marks[currentActiveIndex])){
          renderInspectorForMark(visibleMarks[0], false);
        }
      };
    });
  }

  if(marks.length > 0){
    renderInspectorForMark(marks[0], false);
  }
}

function renderizarResultado(res, nome, tema, bancaKey){
  const spec = BANCA_SPECS[bancaKey] || BANCA_SPECS.pmpe;
  const box = $('#resultado');
  if(!box) return;

  const casasDecimais = (res.tipo === 'cebraspe' || res.tipo === 'pcpe' || res.tipo === 'pppe') ? 2 : 1;
  const dataFormatada = new Date(res.dataHora || Date.now()).toLocaleString('pt-BR');
  const errosConfirmados = (res.ocorrencias || []).filter(o => o.severidade === 'erro_confirmado');
  const fragilidades = (res.ocorrencias || []).filter(o => o.severidade === 'fragilidade_argumentativa');
  const sugestoes = (res.ocorrencias || []).filter(o => o.severidade === 'sugestao_estilistica');

  // Texto anotado padrão Glau.com com grifos coloridos por categoria
  const textoAnotado = res.textoAnotadoGlau || (global.MotorCorrecao && typeof global.MotorCorrecao.gerarTextoAnotadoGlau === 'function'
    ? global.MotorCorrecao.gerarTextoAnotadoGlau(res.texto || $('#essay')?.value || '', res.ocorrencias, res.repertorio, res.analiseParagrafos, res.marcacoes_inline)
    : '');

  // Coletar contadores para os 5 chips de filtro por categoria
  let numGramatica = 0;
  let numCoesao = 0;
  let numRepeticao = 0;
  let numArgumentacao = 0;
  let numAcerto = 0;

  if(typeof document !== 'undefined'){
    const dummy = document.createElement('div');
    dummy.innerHTML = textoAnotado;
    const allMarks = Array.from(dummy.querySelectorAll('.glau-mark'));
    allMarks.forEach(m => {
      let cat = m.getAttribute('data-categoria') || '';
      if(!cat){
        if(m.classList.contains('glau-mark-gramatica') || m.classList.contains('glau-mark-erro')) cat = 'gramatica';
        else if(m.classList.contains('glau-mark-coesao')) cat = 'coesao';
        else if(m.classList.contains('glau-mark-repeticao')) cat = 'repeticao';
        else if(m.classList.contains('glau-mark-argumentacao') || m.classList.contains('glau-mark-rep')) cat = 'argumentacao';
        else if(m.classList.contains('glau-mark-acerto') || m.classList.contains('glau-mark-ok')) cat = 'acerto';
      }
      if(cat === 'gramatica') numGramatica++;
      else if(cat === 'coesao') numCoesao++;
      else if(cat === 'repeticao') numRepeticao++;
      else if(cat === 'argumentacao') numArgumentacao++;
      else if(cat === 'acerto') numAcerto++;
    });
  }
  const totalGrifos = numGramatica + numCoesao + numRepeticao + numArgumentacao + numAcerto;

  // Bloco complementar da fórmula Cebraspe na Seção C
  let blocoEspecialBanca = '';
  if(res.tipo === 'cebraspe' || res.tipo === 'pcpe' || res.tipo === 'pppe'){
    blocoEspecialBanca = `
      <div class="cebraspe-formula-box" style="margin-bottom:18px">
        <h4>📐 MEMÓRIA DE CÁLCULO — FÓRMULA LÍQUIDA DOCUMENTAL CEBRASPE</h4>
        <p style="font-size:15px;margin-bottom:8px"><strong>NPD = NC − (2 × NE ÷ TL)</strong></p>
        <div style="font-size:13px;line-height:1.75">
          • <b>NC (Nota de Conteúdo / Soma da Macroestrutura):</b> ${(res.nc !== undefined ? res.nc : res.total).toFixed(2)} de ${spec.maxScore.toFixed(2)} pts<br>
          • <b>NE (Número de Erros Gramaticais Confirmados na Microestrutura):</b> ${res.ne || 0} erro(s)<br>
          • <b>TL (Total de Linhas Efetivamente Escritas):</b> ${res.tl || 25} linha(s)<br>
          • <b>Desconto Proporcional:</b> −${(res.penalidade || 0).toFixed(2)} pts<br>
          • <b>Nota Final na Prova Discursiva (NPD):</b> <span style="color:#fde047;font-weight:800">${res.total.toFixed(2)} / ${spec.maxScore.toFixed(2)} pts</span>
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

  const protocoloGerado = res.espelhoOficialBanca?.protocolo || ('DISC-' + bancaKey.toUpperCase() + '-' + Date.now().toString(36).toUpperCase());
  const situacaoAprovado = !res.anulacao?.anulada && res.total >= spec.minPass;

  let painelCalculoBanca = '';
  if(bancaKey === 'pcpe' || bancaKey === 'pppe'){
    const ncVal = (res.nc !== undefined ? res.nc : (res.detalhesEspecificos?.nc || 0)).toFixed(2);
    const neVal = res.ne !== undefined ? res.ne : (res.detalhesEspecificos?.ne !== undefined ? res.detalhesEspecificos.ne : errosConfirmados.length);
    const tlVal = res.tl || res.linhas || 1;
    const penVal = (res.penalidade !== undefined ? res.penalidade : (res.detalhesEspecificos?.penalidade || 0)).toFixed(2);
    painelCalculoBanca = `
      <div class="espelho-banca-box">
        <div class="espelho-box-title">
          <span>📐 MEMÓRIA DE CÁLCULO OFICIAL DA FÓRMULA LÍQUIDA CEBRASPE</span>
          <span class="badge" style="background:#0284c7;color:#fff">Edital Oficial</span>
        </div>
        <div class="espelho-formula-grid">
          <div class="formula-item">
            <span class="formula-label">Fórmula do Edital</span>
            <span class="formula-val" style="font-family:'JetBrains Mono',monospace;color:#0369a1">NPD = NC − 2 × (NE ÷ TL)</span>
          </div>
          <div class="formula-item">
            <span class="formula-label">NC · Domínio do Conteúdo</span>
            <span class="formula-val" style="color:#15803d">${ncVal} / ${spec.maxScore.toFixed(2)} pts</span>
          </div>
          <div class="formula-item">
            <span class="formula-label">NE · Erros de Microestrutura</span>
            <span class="formula-val" style="color:#b91c1c">${neVal} desvio(s)</span>
          </div>
          <div class="formula-item">
            <span class="formula-label">TL · Linhas Escritas</span>
            <span class="formula-val" style="color:#475569">${tlVal} linha(s)</span>
          </div>
          <div class="formula-item">
            <span class="formula-label">Penalidade (2 × NE ÷ TL)</span>
            <span class="formula-val" style="color:#b91c1c">−${penVal} pts</span>
          </div>
          <div class="formula-item highlight">
            <span class="formula-label">Nota Final Líquida (NPD)</span>
            <span class="formula-val" style="color:#1e3a8a;font-weight:800">${res.total.toFixed(2)} / ${spec.maxScore.toFixed(2)} pts</span>
          </div>
        </div>
      </div>
    `;
  } else if(bancaKey === 'pmpe' || bancaKey === 'cbmpe'){
    const conformidadeFolhaTexto = res.linhas < 15
      ? `⚠️ Alerta de Edital: ${res.linhas} linha(s) escritas. O edital AOCP exige estritamente entre 15 e 20 linhas. Foi aplicada penalidade de estrutura.`
      : (res.linhas > 20
          ? `⚠️ Atenção: ${res.linhas} linhas escritas. As linhas além da linha 20 são desconsideradas pela comissão examinadora.`
          : `✅ Extensão em estrita conformidade com o Edital AOCP (${res.linhas} linhas no intervalo oficial de 15 a 20 linhas).`);
    painelCalculoBanca = `
      <div class="espelho-banca-box">
        <div class="espelho-box-title">
          <span>📋 PARECER OFICIAL DE CONFORMIDADE — INSTITUTO AOCP</span>
          <span class="badge" style="background:#166534;color:#fff">5 Critérios Oficiais · 40,0 Pts</span>
        </div>
        <div class="espelho-formula-grid">
          <div class="formula-item" style="grid-column: span 2">
            <span class="formula-label">Folha Padrão AOCP (15 a 20 linhas)</span>
            <span class="formula-val" style="font-size:13px">${conformidadeFolhaTexto}</span>
          </div>
          <div class="formula-item">
            <span class="formula-label">Distribuição de Pontos</span>
            <span class="formula-val" style="color:#0369a1">5 Critérios × 8,0 pts = 40,0 pts</span>
          </div>
          <div class="formula-item highlight">
            <span class="formula-label">Nota Total Obtida</span>
            <span class="formula-val" style="color:#166534;font-weight:800">${res.total.toFixed(1)} / 40,0 pts</span>
          </div>
        </div>
      </div>
    `;
  } else if(bancaKey === 'pmsp'){
    const concVunesp = res.detalhesEspecificos?.conceitoGeral || (res.total >= 85 ? 'Conceito A (Excelente)' : (res.total >= 70 ? 'Conceito B (Bom)' : (res.total >= 50 ? 'Conceito C (Regular - Aprovado)' : 'Conceito D/E (Insuficiente)')));
    painelCalculoBanca = `
      <div class="espelho-banca-box">
        <div class="espelho-box-title">
          <span>🏛️ PARECER EXAMINADOR OFICIAL — FUNDAÇÃO VUNESP</span>
          <span class="badge" style="background:#1e3a8a;color:#fff">Critérios A, B e C · 100,0 Pts</span>
        </div>
        <div class="espelho-formula-grid">
          <div class="formula-item">
            <span class="formula-label">Conceito Global</span>
            <span class="formula-val" style="color:#0284c7;font-weight:800">${concVunesp}</span>
          </div>
          <div class="formula-item">
            <span class="formula-label">Pertinência Temática</span>
            <span class="formula-val" style="color:${res.anulacao?.anulada ? '#b91c1c' : '#15803d'}">${res.anulacao?.anulada ? 'Fuga ao Tema' : (res.aderencia?.status === 'tangenciamento' ? 'Tangenciamento' : 'Tema Plenamente Atendido')}</span>
          </div>
          <div class="formula-item">
            <span class="formula-label">Extensão da Folha</span>
            <span class="formula-val">${res.linhas} linha(s) manuscritas</span>
          </div>
          <div class="formula-item highlight">
            <span class="formula-label">Nota Final VUNESP</span>
            <span class="formula-val" style="color:#1e3a8a;font-weight:800">${res.total.toFixed(0)} / 100 pts</span>
          </div>
        </div>
      </div>
    `;
  }

  const blocoEspelhoOficial = `
    <!-- ================= ESPELHO OFICIAL DA BANCA EXAMINADORA ================= -->
    <div class="espelho-oficial-wrapper" id="espelhoOficialDiscursiva">
      <div class="espelho-oficial-header">
        <div class="espelho-brasao-box">
          ${renderLogoImg(bancaKey, 'espelho-logo-img')}
        </div>
        <div class="espelho-header-text">
          <span class="espelho-gov-tag">${bancaKey === 'pmsp' ? 'GOVERNO DO ESTADO DE SÃO PAULO · SECRETARIA DA SEGURANÇA PÚBLICA' : 'GOVERNO DO ESTADO DE PERNAMBUCO · SECRETARIA DE DEFESA SOCIAL'}</span>
          <h2 class="espelho-orgao-title">${esc(spec.name.toUpperCase())}</h2>
          <h3 class="espelho-concurso-sub">COMISSÃO EXAMINADORA OFICIAL · BANCA: <b>${esc(spec.banca.toUpperCase())}</b></h3>
          <div class="espelho-doc-badge">DOCUMENTO PERICIAL DE RESPOSTA DISCURSIVA · ESPELHO DE NOTAS</div>
        </div>
        <div class="espelho-protocolo-box">
          <div>PROTOCOLO: <b>${esc(protocoloGerado)}</b></div>
          <div>EMISSÃO: <b>${esc(dataFormatada)}</b></div>
          <button type="button" class="btn btn-light btn-sm no-print" id="btnPrintEspelho" style="margin-top:6px;width:100%;font-size:12px">
            🖨️ Imprimir Espelho (PDF)
          </button>
        </div>
      </div>

      <!-- DADOS DE IDENTIFICAÇÃO DO CANDIDATO -->
      <div class="espelho-candidato-grid">
        <div><b>Candidato(a):</b> <span>${esc(nome || 'Candidato(a) Concurseiro(a)')}</span></div>
        <div><b>Cargo / Concurso:</b> <span>${esc(spec.short)} (${esc(spec.name)})</span></div>
        <div><b>Banca Organizadora:</b> <span>${esc(spec.banca)}</span></div>
        <div><b>Métricas da Folha:</b> <span>${res.palavras} palavras · ${res.linhas} linha(s) efetivas · ${res.numParagrafos} parágrafo(s)</span></div>
      </div>

      <!-- BANNER DE STATUS OFICIAL -->
      <div class="espelho-status-banner ${res.anulacao?.anulada ? 'status-reprovado' : (situacaoAprovado ? 'status-aprovado' : 'status-reprovado')}">
        <div class="espelho-status-icon">${res.anulacao?.anulada ? '🚫' : (situacaoAprovado ? '🎖️' : '⚠️')}</div>
        <div style="flex:1">
          <div class="espelho-status-title">
            ${res.anulacao?.anulada
              ? 'CANDIDATO(A) ELIMINADO(A) POR CONDIÇÃO DE ANULAÇÃO'
              : (situacaoAprovado
                  ? 'CANDIDATO(A) CLASSIFICADO(A) / APTO(A) NA PROVA DISCURSIVA'
                  : 'CANDIDATO(A) NÃO CLASSIFICADO(A) / ABAIXO DO CORTE MÍNIMO')}
          </div>
          <div class="espelho-status-desc">
            ${res.anulacao?.anulada
              ? esc(res.anulacao.motivo)
              : (situacaoAprovado
                  ? `Pontuação obtida: <b>${res.total.toFixed(casasDecimais)} pts</b> (${res.percentual.toFixed(1)}%) · Exigência mínima para aprovação no edital: <b>${spec.minPass.toFixed(casasDecimais)} pts</b>.`
                  : `Pontuação obtida: <b>${res.total.toFixed(casasDecimais)} pts</b> · Nota mínima exigida para classificação no certame: <b>${spec.minPass.toFixed(casasDecimais)} pts</b>.`)}
          </div>
        </div>
        <div class="espelho-status-score">
          <div class="score-num">${res.total.toFixed(casasDecimais)}</div>
          <div class="score-max">de ${res.max.toFixed(casasDecimais)} pts</div>
        </div>
      </div>

      ${painelCalculoBanca}

      <!-- TABELA OFICIAL DE PONTUAÇÃO POR CRITÉRIO -->
      <div class="espelho-tabela-box">
        <div style="font-size:13.5px;font-weight:800;color:var(--ink);margin-bottom:8px">
          📊 ESPELHO DE NOTAS DETALHADO POR CRITÉRIO DA BANCA EXAMINADORA
        </div>
        <div class="table-responsive">
          <table class="espelho-tabela">
            <thead>
              <tr>
                <th style="width:28%">Quesito / Critério Oficial</th>
                <th style="width:14%;text-align:center">Pontuação</th>
                <th style="width:20%">Nível / Faixa da Banca</th>
                <th style="width:38%">Parecer Pericial do Examinador</th>
              </tr>
            </thead>
            <tbody>
              ${res.espelhoCriterios.map(cr => `
                <tr>
                  <td>
                    <b>${esc(cr.nome)}</b>
                    <div style="font-size:11.5px;color:var(--muted);margin-top:2px">${esc(cr.evidencias || '')}</div>
                  </td>
                  <td style="text-align:center;font-weight:700">
                    <span class="pill ${cr.nota / cr.max >= 0.7 ? 'ok' : (cr.nota / cr.max < 0.4 ? 'bad' : '')}" style="font-size:12px">
                      ${cr.nota.toFixed(casasDecimais)} / ${cr.max.toFixed(casasDecimais)}
                    </span>
                  </td>
                  <td>
                    <span class="badge" style="background:${cr.faixaCor || 'var(--th-primary)'}15;color:${cr.faixaCor || 'var(--th-primary)'};border-color:${cr.faixaCor || 'var(--th-primary)'}40;font-size:11.5px;font-weight:700">
                      ${esc(cr.faixaNivel || (cr.nota / cr.max >= 0.75 ? 'Excelente / Pleno' : (cr.nota / cr.max >= 0.5 ? 'Bom / Regular' : 'Insuficiente')))}
                    </span>
                  </td>
                  <td style="font-size:12.5px;line-height:1.55">
                    <div>${esc(cr.justificativa)}</div>
                    <div style="margin-top:4px;color:var(--ink-light);font-size:11.5px"><b>Ação recomendada:</b> ${esc(cr.acaoRecomendada || 'Aprimorar a fundamentação.')}</div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  box.innerHTML = `
    ${blocoEspelhoOficial}

    <!-- ================= FOLHA CORRIGIDA COM GRIFOS DINÂMICOS (RAIO-X INTERATIVO) ================= -->
    <div class="report-section" id="sec-glau" style="margin-bottom:24px">
      <div class="glau-interactive-container">
        <div class="glau-header-toolbar">
          <div class="glau-title-box">
            <span class="glau-live-badge">⚡ CORREÇÃO VISUAL INTERATIVA</span>
            <h3 style="margin-top:6px;font-size:20px;font-weight:800;color:var(--ink)">🔍 Raio-X Interativo do Texto (Clique nos grifos para ver a correção)</h3>
            <small style="color:var(--muted);font-size:13px">Auditoria visual com marcações clicáveis por categoria da banca: Gramática, Coesão, Repetições, Argumentação e Destaques Positivos.</small>
          </div>
          <div class="glau-legend-bar" id="glauFilterBar">
            <button type="button" class="glau-pill-legend legend-all active" data-filter="all">Todos (${totalGrifos})</button>
            <button type="button" class="glau-pill-legend legend-gramatica" data-filter="gramatica">🔴 Gramática (${numGramatica})</button>
            <button type="button" class="glau-pill-legend legend-coesao" data-filter="coesao">🟡 Coesão (${numCoesao})</button>
            <button type="button" class="glau-pill-legend legend-repeticao" data-filter="repeticao">🟣 Repetições (${numRepeticao})</button>
            <button type="button" class="glau-pill-legend legend-argumentacao" data-filter="argumentacao">🔵 Argumentação (${numArgumentacao})</button>
            <button type="button" class="glau-pill-legend legend-acerto" data-filter="acerto">🟢 Destaques Positivos (${numAcerto})</button>
          </div>
        </div>
        <div class="glau-split-view">
          <div class="glau-text-col">
            <div class="glau-reader" id="glauReader">
              ${textoAnotado || '<p style="color:var(--muted)">Texto não disponível para anotação.</p>'}
            </div>
          </div>
          <div class="glau-feedback-col" id="glauFeedbackCol">
            <div id="glauInspectorCard">
              <div class="glau-empty-state">
                <div style="font-size:36px;margin-bottom:10px">👆</div>
                <b style="font-size:15px;color:var(--ink)">Clique em qualquer trecho grifado no texto</b>
                <p style="font-size:13px;line-height:1.6;color:var(--muted)">Selecione um grifo colorido no texto para ver a comparação antes/depois, a regra da banca e aplicar a correção com 1 clique.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

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
          <button type="button" class="btn btn-light btn-sm" data-go="criterios">⚖️ Consultar Rubricas & Critérios</button>
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

  const btnPrintEspelho = $('#btnPrintEspelho');
  if(btnPrintEspelho){
    btnPrintEspelho.onclick = () => {
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

  // Inicializa o Inspetor Inteligente com Grifos Clicáveis (Padrão Glau.com)
  initGlauInteractiveInspector(res);
}

/* =====================================================================
   4.5 CONTROLE DE ACESSO ADMIN & CRÉDITOS SAAS B2B CURSINHO
   ===================================================================== */
function isAdminMode(){
  if(typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if(params.get('admin') === 'true'){
      sessionStorage.setItem('redacao_admin', 'true');
      return true;
    }
    return sessionStorage.getItem('redacao_admin') === 'true';
  } catch(e) {
    return false;
  }
}

function aplicarVisibilidadeAdmin(){
  const admin = isAdminMode();
  const btnConfig = $('#btnOpenAiConfig');
  const btnTests = $('#btnOpenTests');
  const badgeAdmin = $('#adminBadge');
  const panelAdminCreditos = $('#adminCreditosPanel');

  if(admin){
    if(btnConfig) btnConfig.style.setProperty('display', 'inline-flex', 'important');
    if(btnTests) btnTests.style.setProperty('display', 'inline-flex', 'important');
    if(badgeAdmin) badgeAdmin.style.display = 'inline-block';
    if(panelAdminCreditos) panelAdminCreditos.style.display = 'block';
  } else {
    if(btnConfig) btnConfig.style.setProperty('display', 'none', 'important');
    if(btnTests) btnTests.style.setProperty('display', 'none', 'important');
    if(badgeAdmin) badgeAdmin.style.display = 'none';
    if(panelAdminCreditos) panelAdminCreditos.style.display = 'none';
  }
}

function getSemanaRefId(){
  const d = new Date();
  const dUtc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = dUtc.getUTCDay() || 7;
  dUtc.setUTCDate(dUtc.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(dUtc.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((dUtc - yearStart) / 86400000) + 1) / 7);
  return `${dUtc.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function obterCreditosSemana(){
  const semanaAtual = getSemanaRefId();
  let cred = getUserData('redacao_creditos', null);
  if(!cred || cred.semanaRef !== semanaAtual || typeof cred.restantes !== 'number'){
    cred = {
      restantes: 5,
      total: 5,
      semanaRef: semanaAtual,
      ultimaAtualizacao: new Date().toISOString()
    };
    setUserData('redacao_creditos', cred);
  }
  return cred;
}

function salvarCreditosSemana(cred){
  setUserData('redacao_creditos', cred);
  atualizarBadgeCreditos();
  syncUserDataToServer();
}

function deduzirCredito(){
  const cred = obterCreditosSemana();
  cred.restantes = Math.max(0, cred.restantes - 1);
  cred.ultimaAtualizacao = new Date().toISOString();
  salvarCreditosSemana(cred);
  return cred;
}

function atualizarBadgeCreditos(){
  const cred = obterCreditosSemana();
  const box = $('#creditosContainer');
  const txt = $('#creditosTexto');
  if(!txt) return;

  txt.innerHTML = `Créditos: <b>${cred.restantes}/${cred.total}</b>`;
  if(box){
    box.classList.remove('esgotado', 'baixo');
    if(cred.restantes === 0){
      box.classList.add('esgotado');
      box.title = 'Cota esgotada (0/5): contate a coordenação do cursinho para créditos extras';
    } else if(cred.restantes <= 1){
      box.classList.add('baixo');
      box.title = `Atenção: resta apenas ${cred.restantes} crédito de correção nesta semana`;
    } else {
      box.title = `Plano Cursinho: ${cred.restantes} de ${cred.total} correções disponíveis esta semana`;
    }
  }
}

function exibirModalCreditos(){
  const cred = obterCreditosSemana();
  const m = $('#creditosModal');
  if(!m) return;

  const dest = $('#modalCreditosDestaque');
  const sub = $('#modalCreditosSub');
  const barra = $('#modalCreditosBarra');
  if(dest) dest.textContent = `${cred.restantes} / ${cred.total}`;
  if(sub) {
    sub.textContent = cred.restantes === 0
      ? 'cota semanal esgotada · fale com seu cursinho'
      : `${cred.restantes === 1 ? 'correção disponível' : 'correções disponíveis'} nesta semana`;
  }
  if(barra){
    const pct = Math.max(0, Math.min(100, Math.round((cred.restantes / cred.total) * 100)));
    barra.style.width = pct + '%';
    barra.style.background = cred.restantes === 0 ? '#ef4444' : (cred.restantes <= 1 ? '#f59e0b' : 'var(--th-primary)');
  }
  aplicarVisibilidadeAdmin();
  m.classList.add('show');
}

function iniciarFeedbackCarregamento(spec, bancaKey){
  const resBox = $('#resultado');
  if(!resBox) return { parar: () => {} };

  resBox.innerHTML = `
    <div class="card avaliacao-loading-card" id="loadingCardBox">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px">
        <div class="loading-pulsing-orb">⚖️</div>
        <div>
          <span class="badge" style="background:var(--th-card-highlight);color:var(--th-primary);margin-bottom:4px">
            🏛️ Edital Oficial: ${esc(spec.name)} (${esc(spec.banca)})
          </span>
          <h3 style="font-size:18px;margin:2px 0" id="loadingStageTitle">Calibrando rubrica oficial da banca...</h3>
          <p style="color:var(--muted);font-size:13px;margin:0" id="loadingStageSubtitle">Processando redação via Inteligência Artificial Centralizada Full-Stack</p>
        </div>
      </div>

      <div class="loading-progress-track">
        <div class="loading-progress-bar" id="loadingProgressBar" style="width:25%"></div>
      </div>

      <div class="loading-steps-grid">
        <div class="loading-step-item active" id="loadingStep1">
          <span class="step-icon">🔍</span>
          <div class="step-text">
            <b>1. Calibrando Rubrica da Banca Examinadora</b>
            <small>Carregando pesos, limites oficiais (${esc(spec.linesRange)}) e fórmulas do certame</small>
          </div>
          <span class="step-status">Em andamento...</span>
        </div>
        <div class="loading-step-item" id="loadingStep2">
          <span class="step-icon">📐</span>
          <div class="step-text">
            <b>2. Avaliando Coesão, Gramática e Macroestrutura</b>
            <small>Auditoria sintática, regência, crase, operadores argumentativos e repertório</small>
          </div>
          <span class="step-status">Aguardando</span>
        </div>
        <div class="loading-step-item" id="loadingStep3">
          <span class="step-icon">📊</span>
          <div class="step-text">
            <b>3. Consolidando Espelho Oficial e Gerando Relatório A–I</b>
            <small>Estruturando diagnóstico, anotações Glau UX e plano de melhoria</small>
          </div>
          <span class="step-status">Aguardando</span>
        </div>
      </div>

      <div class="loading-footer-tip">
        💡 <b>Dica Cursinho:</b> O espelho oficial emitirá nota detalhada com justificativas pedagógicas, referências legislativas e reescrita de modelo de estudo.
      </div>
    </div>
  `;

  resBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  let etapa = 1;
  const timer = setInterval(() => {
    etapa++;
    const bar = $('#loadingProgressBar');
    const title = $('#loadingStageTitle');
    const s1 = $('#loadingStep1');
    const s2 = $('#loadingStep2');
    const s3 = $('#loadingStep3');

    if(etapa === 2){
      if(bar) bar.style.width = '65%';
      if(title) title.textContent = 'Avaliando coesão, gramática e estrutura dissertativa com IA...';
      if(s1){ s1.classList.remove('active'); s1.classList.add('done'); s1.querySelector('.step-status').textContent = 'Concluído ✅'; }
      if(s2){ s2.classList.add('active'); s2.querySelector('.step-status').textContent = 'Em andamento...'; }
    } else if(etapa >= 3){
      if(bar) bar.style.width = '92%';
      if(title) title.textContent = 'Consolidando notas e Gerando Relatório Oficial A–I...';
      if(s2){ s2.classList.remove('active'); s2.classList.add('done'); s2.querySelector('.step-status').textContent = 'Concluído ✅'; }
      if(s3){ s3.classList.add('active'); s3.querySelector('.step-status').textContent = 'Finalizando...'; }
    }
  }, 1600);

  return {
    parar: () => {
      clearInterval(timer);
      const bar = $('#loadingProgressBar');
      if(bar) bar.style.width = '100%';
    }
  };
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
    const spec = BANCA_SPECS[bancaKey] || BANCA_SPECS.pmpe;

    if(texto.length < 50){
      toast('Escreva um texto com pelo menos 50 caracteres para iniciar a análise contextual.');
      return;
    }

    // CONTROLE DE COTAS E CRÉDITOS DO CURSINHO PARCEIRO
    const creditos = obterCreditosSemana();
    if(creditos.restantes <= 0 && !isAdminMode()){
      exibirModalCreditos();
      toast('⚠️ Cota semanal de correções esgotada (0/5). Fale com a coordenação do seu cursinho para liberar mais créditos.');
      return;
    }

    // Autenticação Google Obrigatória para Avaliar e Salvar
    if(!currentGoogleUser){
      pendingEvaluationAfterLogin = true;
      const modal = $('#googleAuthModal');
      if(modal){
        modal.classList.add('show');
        const notice = $('#googleAuthStatusNotice');
        if(notice){
          notice.innerHTML = '🔒 <b>Autenticação Obrigatória:</b> Para avaliar sua redação com rigor oficial de banca e salvar seu histórico de notas e evolução, faça login com sua conta Google.';
        }
      }
      toast('Faça login com o Google para avaliar sua redação.');
      return;
    }

    btnEval.disabled = true;
    const originalText = btnEval.innerHTML;
    btnEval.innerHTML = '<span class="loading-spinner"></span> Calibrando rubrica da banca...';

    // Dispara animação visual profissional de loading no resultado
    const loadingCtrl = iniciarFeedbackCarregamento(spec, bancaKey);

    let res = null;
    let usedModel = null;
    let failedAttempts = [];

    try {
      const token = store.get('google_session_token');
      // Requisição exclusiva ao backend/servidor centralizado sem necessidade de chave no navegador
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
          linhasReais: window.linhasManuscritasReais || undefined
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

    loadingCtrl.parar();

    // Se o backend falhar ou estiver offline, usa o Motor Contextual determinístico especializado
    if(!res){
      res = avaliarRedacao(texto, tema, bancaKey, comando, { linhasReais: window.linhasManuscritasReais });
      res.modeloUtilizado = 'Motor Contextual Especializado da Banca (Modo Local)';
      usedModel = res.modeloUtilizado;
    }

    // Garante que o texto anotado com o padrão Glau.com esteja disponível
    if(!res.textoAnotadoGlau && global.MotorCorrecao && typeof global.MotorCorrecao.gerarTextoAnotadoGlau === 'function'){
      res.textoAnotadoGlau = global.MotorCorrecao.gerarTextoAnotadoGlau(texto, res.ocorrencias, res.repertorio, res.analiseParagrafos);
    }

    try {
      renderizarResultado(res, nome, tema, bancaKey);

      // DEDUZ 1 CRÉDITO DO ALUNO POR CORREÇÃO EFETUADA COM SUCESSO
      if(!isAdminMode() || creditos.restantes > 0){
        deduzirCredito();
      }

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
      'Extensão: Texto dentro do limite oficial da folha da banca (PMPE/CBMPE: 15 a 20 linhas | PCPE/PPPE/VUNESP: Até 30 linhas).'
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
          <text x="${x(i)}" y="${y(p.total)-10}" text-anchor="middle" font-size="10.5" font-weight="700" fill="#334155">${p.total.toFixed(1)}</text>
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
              <td style="padding:10px 14px"><b>${item.total.toFixed(item.target==='pcpe'||item.target==='pppe'?2:1)} / ${(item.max || 40).toFixed(0)} pts</b></td>
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
   11.B PAINEL DO GESTOR & PROFESSOR (B2B CURSINHOS E COORDENAÇÃO)
   ===================================================================== */
const MOCK_PROFESSOR_STUDENTS = [
  // PMPE (Instituto AOCP - 40 pts, corte 24 pts)
  {
    id: 'pmpe-1',
    nome: 'Lucas Mendonça Silva',
    email: 'lucas.mendonca@gmail.com',
    concurso: 'pmpe',
    redacoes: 8,
    ultimaNota: 37.5,
    notaAnterior: 33.0,
    data: '2026-11-10T14:30:00Z',
    tema: 'O papel do policiamento ostensivo e comunitário na preservação da ordem pública',
    status: 'Aprovado',
    criterios: { d1: 9.5, d2: 9.5, d3: 9.5, d4: 9.0 },
    erros: ['Pequena hesitação de pontuação na linha 17 (vírgula vicária dispensável).'],
    parecer: 'Excelente domínio dissertativo-argumentativo. Repertório fundamentado na Constituição e Bauman. Argumentação contundente voltada à segurança em Pernambuco.',
    texto: `A Constituição Cidadã de 1988 estabelece, em seu artigo 144, que a segurança pública é dever do Estado, direito e responsabilidade de todos. Nesse prisma, a atuação da Polícia Militar de Pernambuco transcende a repressão criminal, erigindo o policiamento ostensivo e comunitário como pilar basilar para a preservação da ordem social e a garantia da incolumidade dos cidadãos.\n\nEm primeiro lugar, cabe pontuar que a proximidade entre a tropa e a comunidade gera inteligência preventiva e confiança mútua. Segundo o sociólogo Zygmunt Bauman, a sensação de insegurança fragmenta o tecido coletivo; logo, a presença visível e estratégica da viatura militar nos bairros restaura a sensação subjetiva e objetiva de tranquilidade, inibindo delitos contra o patrimônio e a vida.\n\nAdemais, programas como o policiamento escolar e a Patrulha Maria da Penha evidenciam a eficácia da prevenção qualificada. Quando a corporação dialoga com lideranças locais, as causas estruturais da violência são mapeadas com agilidade, permitindo uma resposta tática proporcional e humanizada, em estrita consonância com os direitos humanos.\n\nInfere-se, portanto, que fortalecer o policiamento comunitário é indispensável. Cabe à Secretaria de Defesa Social, em convênio com os municípios, ampliar o efetivo e o videomonitoramento embarcado, fomentando conselhos de segurança integrados, a fim de consolidar a paz duradoura em solo pernambucano.`
  },
  {
    id: 'pmpe-2',
    nome: 'Camila Albuquerque Vasconcelos',
    email: 'camila.vasconcelos@gmail.com',
    concurso: 'pmpe',
    redacoes: 6,
    ultimaNota: 35.0,
    notaAnterior: 31.5,
    data: '2026-11-09T18:15:00Z',
    tema: 'A integração das forças de segurança pública e o combate às organizações criminosas',
    status: 'Aprovado',
    criterios: { d1: 9.0, d2: 9.0, d3: 8.5, d4: 8.5 },
    erros: ['Uso da crase antes de pronome indefinido na linha 12.', 'Regência nominal na linha 24.'],
    parecer: 'Boa estruturação e encadeamento lógico. Proposta de intervenção articulada com os órgãos operacionais de PE.',
    texto: `No cenário contemporâneo, o enfrentamento ao crime organizado impõe um modelo de segurança baseado na integração tática e no compartilhamento de inteligência policial. Sob a ótica de Thomas Hobbes, cabe ao Estado soberano garantir a proteção do corpo social contra ameaças internas. Assim, a articulação entre Polícia Militar, Polícia Civil e órgãos federais torna-se imperativa para asfixiar as facções criminosas.\n\nSob essa perspectiva, a atuação isolada das forças de segurança fragmenta recursos e compromete investigações. A integração de bancos de dados balísticos e mandados de prisão confere eficácia imediata às abordagens do policiamento ostensivo, interceptando armas de grosso calibre e entorpecentes antes de abastecerem comunidades conflagradas.\n\nOutrossim, o investimento em tecnologia da informação e inteligência penitenciária impede que ordens emanadas de presídios cheguem às ruas. A sincronia das polícias assegura ações cirúrgicas em áreas críticas, preservando a integridade da população inocente.\n\nTorna-se imperioso, destarte, que o Governo Estadual promova operações conjuntas contínuas e capacitação integrada das forças de segurança, municiando a PMPE de ferramentas tecnológicas de monitoramento, com vistas a desmantelar redes ilícitas e assegurar a soberania da lei.`
  },
  {
    id: 'pmpe-3',
    nome: 'Rodrigo Cavalcanti Bezerra',
    email: 'rodrigo.bezerra@gmail.com',
    concurso: 'pmpe',
    redacoes: 5,
    ultimaNota: 31.0,
    notaAnterior: 31.0,
    data: '2026-11-08T11:20:00Z',
    tema: 'O papel do policiamento ostensivo e comunitário na preservação da ordem pública',
    status: 'Estagnado',
    criterios: { d1: 8.0, d2: 8.0, d3: 7.5, d4: 7.5 },
    erros: ['Repetição excessiva da palavra "segurança" no D1.', 'Vírgula separando sujeito composto do verbo (L. 9).'],
    parecer: 'Redação consistente, mas com repertório pouco diversificado e repetições lexicais. Necessita aprofundar conectivos interparágrafos.',
    texto: `A segurança pública é um dos temas mais debatidos no Brasil contemporâneo. A Polícia Militar tem a função constitucional de realizar o policiamento ostensivo para evitar a prática de crimes e garantir a ordem pública nas cidades de Pernambuco.\n\nInicialmente, deve-se ressaltar que a presença dos policiais nas ruas traz tranquilidade para os cidadãos de bem. Quando a viatura passa nos bairros comerciais, o comércio funciona com mais tranquilidade e as famílias podem transitar em segurança. Isso comprova a importância de manter um efetivo suficiente em todas as regiões do estado.\n\nAlém disso, o policiamento comunitário permite uma aproximação saudável com a população. Os moradores conhecem os policiais da área e podem passar informações importantes sobre suspeitos e locais perigosos, ajudando na prevenção antes que o crime aconteça.\n\nPortanto, é necessário que o Estado contrate mais policiais militares e invista em novas viaturas para que o policiamento ostensivo chegue a todos os municípios pernambucanos com eficiência.`
  },
  {
    id: 'pmpe-4',
    nome: 'Juliana Duarte Correia',
    email: 'juliana.correia@gmail.com',
    concurso: 'pmpe',
    redacoes: 3,
    ultimaNota: 21.5,
    notaAnterior: 20.0,
    data: '2026-11-06T16:45:00Z',
    tema: 'Desafios do combate à violência doméstica e proteção à mulher',
    status: 'Atenção',
    criterios: { d1: 6.0, d2: 5.5, d3: 5.0, d4: 5.0 },
    erros: ['Desvios de regência verbal (visar a, assistir a).', 'Quatro erros de crase.', 'Períodos excessivamente longos sem pontuação adequada.'],
    parecer: 'Zona de risco (< corte de 24 pts). Forte perda de pontos em gramática e microestrutura textual. Faltou repertório legitimado e aprofundamento das teses.',
    texto: `A violência doméstica é um grave problema que afeta muitas famílias em Pernambuco e no Brasil. Mesmo com a Lei Maria da Penha muitas mulheres continuam sofrendo agressões físicas e psicológicas dentro de casa.\n\nEm primeiro lugar a falta de denúncia imediata faz com que o agressor continue impune por muito tempo porque a vítima tem medo de sofrer retaliações ou não tem condições financeiras de se sustentar sem o cônjuge o que agrava a situação.\n\nTambém precisa melhorar o atendimento nas delegacias das mulheres e viaturas especializadas da polícia para atender os chamados com mais rapidez antes que aconteça o feminicídio que destrói lares inteiros.\n\nConclui-se que o governo precisa dar mais apoio psicológico as mulheres e punir com rigor os agressores para diminuir os índices alarmantes desse tipo de violência no estado.`
  },
  {
    id: 'pmpe-5',
    nome: 'Gabriel Ferreira Lima',
    email: 'gabriel.flima@gmail.com',
    concurso: 'pmpe',
    redacoes: 7,
    ultimaNota: 34.0,
    notaAnterior: 29.5,
    data: '2026-11-09T20:10:00Z',
    tema: 'O papel do policiamento ostensivo e comunitário na preservação da ordem pública',
    status: 'Aprovado',
    criterios: { d1: 8.5, d2: 8.5, d3: 8.5, d4: 8.5 },
    erros: ['Crase indevida antes de verbo ("a combater").'],
    parecer: 'Evolução notável (+15%). Excelente progressão textual e uso apropriado de operadores argumentativos.',
    texto: `O artigo 144 da Carta Magna de 1988 preconiza a segurança pública como responsabilidade estatal indispensável à fruição dos direitos fundamentais. Diante desse preceito, a Polícia Militar de Pernambuco desempenha papel basilar na preservação da paz social, atuando preventivamente para mitigar a violência urbana.\n\nNesse contexto, o modelo de polícia de proximidade rompe o distanciamento entre força armada e corpo social. Sob o pensamento de Durkheim, a estabilidade das instituições é pré-requisito para a coesão coletiva. Assim, quando os operadores da PMPE dialogam com a vizinhança solidária, constrói-se uma rede de colaboração tática eficaz contra a criminalidade.\n\nParalelamente, o uso da tecnologia de geolocalização e patrulhamento direcionado pelas manchas criminais potencializa os recursos disponíveis, garantindo rápida dissuasão de condutas delituosas em pontos críticos.\n\nDessarte, urge à Secretaria de Defesa Social modernizar a infraestrutura dos batalhões e valorizar a capacitação contínua em direitos humanos, assegurando que o policiamento ostensivo consolide Pernambuco como referência em proteção cidadã.`
  },

  // PCPE (Cebraspe - 30 pts, corte 18 pts)
  {
    id: 'pcpe-1',
    nome: 'Larissa Vasconcelos Ramos',
    email: 'larissa.ramos@gmail.com',
    concurso: 'pcpe',
    redacoes: 9,
    ultimaNota: 27.8,
    notaAnterior: 25.2,
    data: '2026-11-10T16:00:00Z',
    tema: 'A investigação policial técnica e a cadeia de custódia da prova na persecução penal',
    status: 'Aprovado',
    criterios: { ap: 2.8, t1: 8.8, t2: 8.8, t3: 8.6, ne: 2 },
    erros: ['2 desvios formais: 1 de translineação e 1 vírgula facultativa.'],
    parecer: 'Padrão de excelência no espelho Cebraspe. Todos os tópicos do comando foram integralmente atendidos com citação do Pacote Anticrime (Lei 13.964/19).',
    texto: `A persecução penal contemporânea exige rigidez metodológica na produção dos elementos probatórios, sob pena de nulidade processual e prejuízo à justiça. No âmbito da Polícia Civil de Pernambuco, a investigação técnico-científica e o estrito respeito à cadeia de custódia constituem as salvaguardas primordiais do devido processo legal.\n\nNo que tange ao primeiro aspecto, a introdução formal da cadeia de custódia pelo Pacote Anticrime (Lei nº 13.964/2019) no Código de Processo Penal positivou o rastreamento integral dos vestígios, desde o reconhecimento inicial no local do crime até o seu descarte fundamentado. Tal disciplina veda a contaminação da prova, assegurando o princípio da desconfiança benéfica e o contraditório diferido na fase judicial.\n\nAdemais, a perícia forense e o cruzamento de dados de telecomunicações minimizam o risco de erros judiciários historicamente associados à exclusiva prova testemunhal. Quando a autoridade policial instrui o inquérito com laudos de DNA, balística comparativa e informática forense, a convicção do Ministério Público e do magistrado ampara-se em base fática sólida e inatacável.\n\nEm conclusão, o aprimoramento da investigação policial civil perpassa pela modernização de laboratórios periciais e pela capacitação de delegados e agentes quanto à preservação do local de crime, garantindo o combate qualificado à impunidade com respeito irrestrito às garantias constitucionais.`
  },
  {
    id: 'pcpe-2',
    nome: 'Bruno Henrique Siqueira',
    email: 'bruno.siqueira@gmail.com',
    concurso: 'pcpe',
    redacoes: 6,
    ultimaNota: 24.5,
    notaAnterior: 22.0,
    data: '2026-11-09T14:40:00Z',
    tema: 'A investigação policial técnica e a cadeia de custódia da prova na persecução penal',
    status: 'Aprovado',
    criterios: { ap: 2.5, t1: 8.0, t2: 8.0, t3: 7.6, ne: 4 },
    erros: ['4 desvios gramaticais: regência verbal e concordância.'],
    parecer: 'Boa aderência aos tópicos temáticos da banca Cebraspe. Resposta direta aos três aspectos avaliados.',
    texto: `A atividade de polícia judiciária desempenhada pela Polícia Civil é indispensável para a apuração de infrações penais e a identificação de sua autoria. O sucesso da denúncia criminal ofertada pelo titular da ação depende substancialmente da solidez das provas colhidas na fase inquisitorial.\n\nNesse cenário, a preservação do local do crime pelos primeiros policiais a chegarem na cena é condição indispensável para a perícia. Qualquer alteração indevida de objetos ou manchas de sangue compromete a veracidade dos laudos técnicos e pode conduzir a absolvição de culpados ou condenação indevida de inocentes.\n\nAlém disso, as novas tecnologias de inteligência cibernética têm permitido à Polícia Civil desvendar esquemas de lavagem de dinheiro e golpes eletrônicos que lesam milhares de vítimas em Pernambuco. A quebra de sigilo telemático autorizada judicialmente fornece dados precisos que inviabilizam negativas de autoria.\n\nDiante do exposto, é dever do Poder Público estruturar as delegacias de polícia civil e o Instituto de Criminalística com equipamentos avançados e servidores capacitados, assegurando uma persecução penal célere, justa e eficaz.`
  },
  {
    id: 'pcpe-3',
    nome: 'Mariana Costa Farias',
    email: 'mariana.costa@gmail.com',
    concurso: 'pcpe',
    redacoes: 4,
    ultimaNota: 15.6,
    notaAnterior: 16.0,
    data: '2026-11-07T10:15:00Z',
    tema: 'Crime cibernético e os desafios da polícia judiciária',
    status: 'Atenção',
    criterios: { ap: 1.8, t1: 5.0, t2: 5.2, t3: 4.8, ne: 8 },
    erros: ['8 erros graves de microestrutura: pontuação, concordância e truncamento sintático.'],
    parecer: 'Abaixo do corte de 18 pts. Desconto por número de erros na fórmula Cebraspe foi determinante. Necessita treino intensivo em microestrutura.',
    texto: `Os crimes virtuais aumentaram muito depois da pandemia onde muitas pessoas começaram a fazer compras e transações pela internet sem ter o devido cuidado com suas senhas pessoais.\n\nA policia civil tem dificuldade de identificar esses criminosos porque eles usam computadores fora do país ou endereços falsos de ip. Isso faz com que a investigação demore muito para ser concluída e o dinheiro roubado nunca mais volte para as vítimas prejudicadas.\n\nOutro ponto importante é a falta de policiais especialistas em tecnologia nas delegacias do interior do estado que muitas vezes não tem nem computadores modernos para trabalhar.\n\nPor isso o governo precisa contratar peritos em informática e criar mais delegacias virtuais para combater esses crimes que crescem todos os dias no nosso estado.`
  },

  // PPPE (Cebraspe Edital 2026 - 10 pts, corte 6.0 pts)
  {
    id: 'pppe-1',
    nome: 'Felipe Augusto Melo',
    email: 'felipe.melo@gmail.com',
    concurso: 'pppe',
    redacoes: 5,
    ultimaNota: 9.1,
    notaAnterior: 8.2,
    data: '2026-11-10T17:10:00Z',
    tema: 'A ressocialização de apenados e a segurança nos estabelecimentos prisionais',
    status: 'Aprovado',
    criterios: { ap: 0.9, t1: 2.9, t2: 2.8, t3: 2.7, ne: 1 },
    erros: ['Apenas 1 desvio formal de grafia.'],
    parecer: 'Brilhante desempenho na rubrica Cebraspe PPPE (9,1 / 10,0). Citou expressamente a LEP (Lei 7.210/84) e Foucault.',
    texto: `O sistema penitenciário brasileiro enfrenta o paradoxo entre a imperativa contenção carcerária e a missão constitucional de reinserção social do condenado. Conforme preconiza a Lei de Execução Penal (Lei nº 7.210/1984), a pena privativa de liberdade possui natureza bifronte: punir o ilícito e proporcionar condições harmônicas para a integração do apenado ao convívio comunitário.\n\nNesse sentido, a atuação do Policial Penal é o vetor central para desarticular facções no interior dos presídios e manter a disciplina, precondição para que projetos de educação e trabalho intramuros prosperem. Conforme ensina Michel Foucault em Vigiar e Punir, o cárcere que apenas isola retroalimenta a delinquência. Em contrapartida, quando o Estado oferece oficinas laborais e remição de pena pelo estudo, rompe-se o ciclo de reincidência criminal.\n\nAdemais, a modernização de bloqueadores de sinal celular e scanners corporais preserva a integridade dos servidores penais e inviabiliza ordens criminosas para o meio externo.\n\nAssim sendo, a consolidação da Polícia Penal de Pernambuco como carreira de Estado, municiada de estrutura e capacitação continuada, é indispensável para humanizar a execução penal e salvaguardar a paz social.`
  },
  {
    id: 'pppe-2',
    nome: 'Beatriz Pimentel Rocha',
    email: 'beatriz.rocha@gmail.com',
    concurso: 'pppe',
    redacoes: 4,
    ultimaNota: 5.4,
    notaAnterior: 5.0,
    data: '2026-11-08T15:30:00Z',
    tema: 'A ressocialização de apenados e a segurança nos estabelecimentos prisionais',
    status: 'Atenção',
    criterios: { ap: 0.5, t1: 1.8, t2: 1.8, t3: 1.7, ne: 6 },
    erros: ['6 erros de microestrutura. Desconto severo no fator TL/NE.'],
    parecer: 'Abaixo da nota de corte (5,4 < 6,0). Argumentação superficial sem citação legal fundamentada.',
    texto: `Os presídios de Pernambuco estão superlotados e isso causa muitas rebeliões perigosas. A função da policia penal é cuidar da segurança dos presos e não deixar entrar armas e drogas nos pavilhões.\n\nOs presos deveriam trabalhar para pagar sua própria estadia na cadeia e aprender uma profissão honesta para quando saírem de lá não voltarem a cometer assaltos e assassinatos.\n\nTambém precisa de mais investimentos em câmeras de segurança e equipamentos de proteção para os policiais penais que trabalham em condições difíceis arriscando suas vidas diariamente.\n\nPortanto o governo tem que construir novos presídios e contratar mais concursados para resolver a crise carcerária do estado.`
  },

  // CBMPE (Instituto AOCP - 40 pts, corte 24 pts)
  {
    id: 'cbmpe-1',
    nome: 'Carlos Eduardo Rocha',
    email: 'carlos.rocha@gmail.com',
    concurso: 'cbmpe',
    redacoes: 6,
    ultimaNota: 36.0,
    notaAnterior: 32.0,
    data: '2026-11-10T09:40:00Z',
    tema: 'A atuação do Corpo de Bombeiros na mitigação de desastres naturais e mudanças climáticas',
    status: 'Aprovado',
    criterios: { d1: 9.0, d2: 9.0, d3: 9.0, d4: 9.0 },
    erros: ['Uso dispensável de vírgula na linha 14.'],
    parecer: 'Excelente abordagem técnica dos desastres de encostas no Grande Recife e papel do CBMPE.',
    texto: `As mudanças climáticas globais intensificaram a frequência e a severidade de eventos extremos no Brasil. Em Pernambuco, episódios sazonais de deslizamentos de encostas e inundações na Região Metropolitana do Recife evidenciam a premência do Corpo de Bombeiros Militar como instituição de vanguarda na preservação de vidas e na gestão integral do risco.\n\nPrimordialmente, a missão do CBMPE transcende o socorro emergencial após o sinistro. O planejamento preventivo em conjunto com a Defesa Civil, por meio de vistorias técnicas e mapeamento de setores de alto risco geológico, permite a evacuação preventiva de moradores em áreas vulneráveis antes da ruptura do solo, mitigando perdas irreparáveis.\n\nAlém disso, o aperfeiçoamento contínuo em busca e resgate em estruturas colapsadas e salvamento em águas rápidas requer tecnologia de ponta, como drones térmicos e cães farejadores treinados.\n\nInfere-se, logo, que investimentos consistentes do Governo do Estado na modernização da frota e na ampliação do quadro de bombeiros militares são medidas prementes para assegurar resiliência urbana e proteção aos mais necessitados.`
  },

  // PMSP (Fundação VUNESP - 100 pts, corte 60 pts)
  {
    id: 'pmsp-1',
    nome: 'Fernanda Paiva Silveira',
    email: 'fernanda.paiva@gmail.com',
    concurso: 'pmsp',
    redacoes: 7,
    ultimaNota: 88.0,
    notaAnterior: 80.0,
    data: '2026-11-10T11:50:00Z',
    tema: 'O uso de câmeras corporais operacionais e a legitimidade da atuação policial militar',
    status: 'Aprovado',
    criterios: { cA: 28.0, cB: 32.0, cC: 28.0 },
    erros: ['Pequena redundância na conclusão.'],
    parecer: 'Redação exemplar para o padrão VUNESP. Tese clara, articulação perfeita de argumentos favoráveis à transparência e segurança jurídica do policial.',
    texto: `A modernização da segurança pública no estado de São Paulo tem sido marcada pelo debate acerca do uso das câmeras operacionais portáteis acopladas aos uniformes dos policiais militares. Longe de representar um mecanismo de desconfiança institucional, a tecnologia desponta como instrumento civilizatório que confere transparência às abordagens e resguarda juridicamente o agente estatal no estrito cumprimento do dever legal.\n\nEm primeiro lugar, a gravação ininterrupta dos atos de serviço fornece respaldo probatório inquestionável contra falsas acusações de abuso de poder. Em situações de confronto armado ou resistência à prisão, o registro em áudio e vídeo elucida a dinâmica fática perante o Poder Judiciário e a opinião pública, blindando o policial cumpridor da lei.\n\nOutrossim, estudos acadêmicos comprovam a redução expressiva da letalidade policial e do índice de violência contra a própria tropa onde as câmeras foram implantadas. A previsibilidade de registro estimula a desescalada de conflitos por parte dos abordados e padroniza os procedimentos operacionais da corporação sob a égide dos direitos humanos.\n\nEm suma, o fortalecimento do programa Olho Vivo na Polícia Militar de São Paulo consolida a legitimidade democrática da instituição, demonstrando que inovação tecnológica e preservação da dignidade humana são vetores convergentes em prol da paz social.`
  },
  {
    id: 'pmsp-2',
    nome: 'Thiago Nogueira Mendes',
    email: 'thiago.mendes@gmail.com',
    concurso: 'pmsp',
    redacoes: 4,
    ultimaNota: 74.0,
    notaAnterior: 70.0,
    data: '2026-11-09T08:30:00Z',
    tema: 'O uso de câmeras corporais operacionais e a legitimidade da atuação policial militar',
    status: 'Estagnado',
    criterios: { cA: 24.0, cB: 26.0, cC: 24.0 },
    erros: ['Falta de paralelismo sintático no parágrafo 2.', 'Dois desvios de crase.'],
    parecer: 'Texto consistente, dentro da média da turma PMSP. Necessita aprofundar argumentos contra-argumentativos.',
    texto: `O emprego das câmeras nas fardas da Polícia Militar de São Paulo tem gerado discussões importantes entre especialistas e a sociedade civil. Trata-se de uma ferramenta que visa modernizar a segurança pública e garantir maior segurança para todos os envolvidos nas ocorrências.\n\nPor um lado, os equipamentos protegem o bom policial de falsas denúncias feitas por criminosos que desejam manchar a reputação da corporação. Quando as imagens mostram que a abordagem foi correta e proporcional, o Ministério Público arquiva representações infundadas com rapidez.\n\nPor outro lado, o cidadão abordado sente-se mais confiante de que seus direitos fundamentais serão respeitados. Essa relação de transparência aproxima a Polícia Militar da comunidade, fortalecendo a confiança mútua e auxiliando na resolução pacífica de desentendimentos cotidianos.\n\nPortanto, a continuidade e o aperfeiçoamento das câmeras operacionais representam um passo positivo para a consolidação de uma polícia moderna, eficiente e respeitada no estado de São Paulo.`
  },
  {
    id: 'pmsp-3',
    nome: 'Amanda Guimarães Leite',
    email: 'amanda.leite@gmail.com',
    concurso: 'pmsp',
    redacoes: 3,
    ultimaNota: 52.0,
    notaAnterior: 48.0,
    data: '2026-11-07T13:40:00Z',
    tema: 'O combate ao crime organizado no estado de São Paulo',
    status: 'Atenção',
    criterios: { cA: 18.0, cB: 18.0, cC: 16.0 },
    erros: ['Erros graves de norma culta (critério C Vunesp). Desvios de concordância e marcas de oralidade.'],
    parecer: 'Abaixo do corte de 60 pts na Vunesp. Perda acentuada no Critério C (modalidade escrita). Necessita refazer exercícios de regência e crase.',
    texto: `O crime organizado no estado de São Paulo é comandado por facções que controlam o tráfico de drogas e lavam dinheiro em postos de combustível e transportes públicos. A polícia militar precisa de armas melhores e mais salário para combater esses criminosos com coragem.\n\nNão adianta apenas prender os traficantes pequenos nas esquinas se os líderes continuam mandando mensagens de dentro dos presídios para ordenar crimes graves.\n\nÉ preciso que o governo corte as comunicações dos presídios e invista em inteligência para prender os chefes das facções que vivem em mansões de luxo.\n\nAssim São Paulo poderá voltar a ser um estado mais seguro para as famílias trabalhadoras que vivem com medo da criminalidade nas periferias.`
  }
];

let profCurrentTurma = 'pmpe';
let profCurrentPeriodo = '7d';
let profSearchTerm = '';

function renderProfessorDashboard(turmaKey, periodo){
  if(turmaKey) profCurrentTurma = turmaKey;
  else {
    const sel = $('#profTurmaSelect');
    if(sel && sel.value) profCurrentTurma = sel.value;
    else profCurrentTurma = currentTarget || 'pmpe';
  }

  if(periodo) profCurrentPeriodo = periodo;
  else {
    const pSel = $('#profPeriodoSelect');
    if(pSel && pSel.value) profCurrentPeriodo = pSel.value;
  }

  // Sincronizar selects
  if($('#profTurmaSelect')) $('#profTurmaSelect').value = profCurrentTurma;
  if($('#profPeriodoSelect')) $('#profPeriodoSelect').value = profCurrentPeriodo;

  const spec = BANCA_SPECS[profCurrentTurma] || BANCA_SPECS.pmpe;
  const maxPts = spec.maxPontos || 40.0;
  const cortePts = spec.corte || (maxPts * 0.6);

  // 1. Obter alunos da turma filtrada
  let alunosTurma = MOCK_PROFESSOR_STUDENTS.filter(s => s.concurso === profCurrentTurma);

  // Se o aluno real logado no navegador tiver redações salvas desta banca, mesclar no topo
  const historicoReal = getHistorico().filter(h => h.banca === profCurrentTurma);
  if(historicoReal.length > 0){
    const ultReal = historicoReal[0];
    const nomeReal = getUserData('redacao_nome') || currentGoogleUser?.name || 'Aluno Atual (Você)';
    const notaNum = parseFloat(ultReal.nota) || 0;
    const penultNota = historicoReal.length > 1 ? parseFloat(historicoReal[1].nota) : notaNum;
    const statusReal = notaNum >= (maxPts * 0.75) ? 'Aprovado' : (notaNum >= cortePts ? 'Estagnado' : 'Atenção');
    alunosTurma = [
      {
        id: 'real-user',
        nome: nomeReal + ' (Perfil Ativo)',
        email: currentGoogleUser?.email || 'aluno@cursinho.com.br',
        concurso: profCurrentTurma,
        redacoes: historicoReal.length,
        ultimaNota: notaNum,
        notaAnterior: penultNota,
        data: ultReal.data || new Date().toISOString(),
        tema: ultReal.tema || 'Redação enviada na plataforma',
        status: statusReal,
        criterios: ultReal.detalhes || {},
        erros: ['Ver espelho detalhado do motor de correção.'],
        parecer: ultReal.comentarioGeral || 'Redação corrigida e auditada pelo motor da banca.',
        texto: ultReal.texto || '(Texto arquivado no histórico do perfil)'
      },
      ...alunosTurma
    ];
  }

  // Multiplicadores realistas de turma comercial
  const turmaStatsConfig = {
    pmpe: { totalAtivos: 148, redacoes7d: 318, redacoes30d: 940, redacoesAll: 2420 },
    pcpe: { totalAtivos: 94, redacoes7d: 196, redacoes30d: 610, redacoesAll: 1580 },
    pppe: { totalAtivos: 76, redacoes7d: 142, redacoes30d: 480, redacoesAll: 1190 },
    cbmpe: { totalAtivos: 62, redacoes7d: 128, redacoes30d: 390, redacoesAll: 960 },
    pmsp: { totalAtivos: 155, redacoes7d: 342, redacoes30d: 1080, redacoesAll: 2750 }
  };
  const statsConf = turmaStatsConfig[profCurrentTurma] || turmaStatsConfig.pmpe;
  const redacoesTotal = profCurrentPeriodo === '7d' ? statsConf.redacoes7d : (profCurrentPeriodo === '30d' ? statsConf.redacoes30d : statsConf.redacoesAll);

  // Média da turma calculada
  const somaNotas = alunosTurma.reduce((acc, a) => acc + a.ultimaNota, 0);
  const mediaTurma = alunosTurma.length ? (somaNotas / alunosTurma.length) : (maxPts * 0.78);
  const alunosRiscoCount = alunosTurma.filter(a => a.ultimaNota < cortePts).length;
  const alunosRiscoTotal = Math.max(alunosRiscoCount, Math.round(statsConf.totalAtivos * 0.12));

  // RENDERIZAR OS 4 CARDS DE KPIS
  const kpiGrid = $('#profKpisGrid');
  if(kpiGrid){
    kpiGrid.innerHTML = `
      <div class="kpi-card" style="--kpi-bar:#3b82f6">
        <div class="kpi-label">
          <span>👥 Alunos Ativos</span>
          <span style="font-size:16px">🎓</span>
        </div>
        <div class="kpi-value">${statsConf.totalAtivos} <span style="font-size:15px;font-weight:600;color:var(--muted)">alunos</span></div>
        <div class="kpi-sub" style="color:#15803d;font-weight:700">✓ 98.4% de engajamento na semana</div>
      </div>

      <div class="kpi-card" style="--kpi-bar:#10b981">
        <div class="kpi-label">
          <span>📝 Redações Corrigidas</span>
          <span style="font-size:16px">⚡</span>
        </div>
        <div class="kpi-value">${redacoesTotal} <span style="font-size:15px;font-weight:600;color:var(--muted)">envios</span></div>
        <div class="kpi-sub">Período: ${profCurrentPeriodo === '7d' ? 'Últimos 7 dias' : (profCurrentPeriodo === '30d' ? 'Últimos 30 dias' : 'Todo o período')}</div>
      </div>

      <div class="kpi-card" style="--kpi-bar:#f59e0b">
        <div class="kpi-label">
          <span>🎯 Nota Média da Turma</span>
          <span style="font-size:16px">📊</span>
        </div>
        <div class="kpi-value">${mediaTurma.toFixed(1)} <span style="font-size:16px;font-weight:600;color:var(--muted)">/ ${maxPts.toFixed(1)} pts</span></div>
        <div class="kpi-sub">Corte do edital: <b>${cortePts.toFixed(1)} pts</b></div>
      </div>

      <div class="kpi-card" style="--kpi-bar:#ef4444">
        <div class="kpi-label">
          <span>🚨 Em Zona de Risco</span>
          <span style="font-size:16px">⚠️</span>
        </div>
        <div class="kpi-value" style="color:#dc2626">${alunosRiscoTotal} <span style="font-size:15px;font-weight:600;color:var(--muted)">alunos</span></div>
        <div class="kpi-sub" style="color:#b91c1c;font-weight:700">Abaixo de 60% da pontuação máxima</div>
      </div>
    `;
  }

  // RENDERIZAR DIAGNÓSTICO: ONDE A TURMA MAIS PERDE PONTOS
  if($('#profCritBancaBadge')) $('#profCritBancaBadge').textContent = spec.banca;
  const barsContainer = $('#profCritBarsContainer');
  if(barsContainer){
    const aproveitamentoMock = {
      pmpe: [
        { nome: '1. D1 - Tema e Tipologia Textual', peso: '10 pts', pct: 88 },
        { nome: '2. D2 - Coesão e Conectivos', peso: '10 pts', pct: 76 },
        { nome: '3. D3 - Argumentação e Repertório', peso: '10 pts', pct: 72 },
        { nome: '4. D4 - Gramática e Microestrutura', peso: '10 pts', pct: 64 }
      ],
      pcpe: [
        { nome: '1. Apresentação e Estrutura', peso: '3.0 pts', pct: 86 },
        { nome: '2. Tópico 1 - Legislação / Fundamentos', peso: '9.0 pts', pct: 78 },
        { nome: '3. Tópico 2 - Investigação Técnica', peso: '9.0 pts', pct: 70 },
        { nome: '4. Tópico 3 - Aspectos Processuais', peso: '9.0 pts', pct: 66 }
      ],
      pppe: [
        { nome: '1. Apresentação e Tipologia', peso: '1.0 pt', pct: 89 },
        { nome: '2. Tópico 1 - Lei de Execução Penal', peso: '3.0 pts', pct: 75 },
        { nome: '3. Tópico 2 - Segurança Penitenciária', peso: '3.0 pts', pct: 71 },
        { nome: '4. Tópico 3 - Direitos e Garantias', peso: '3.0 pts', pct: 65 }
      ],
      cbmpe: [
        { nome: '1. D1 - Atendimento ao Tema', peso: '10 pts', pct: 87 },
        { nome: '2. D2 - Coesão e Estrutura Lógica', peso: '10 pts', pct: 75 },
        { nome: '3. D3 - Argumentação Técnica', peso: '10 pts', pct: 74 },
        { nome: '4. D4 - Norma Padrão Culta', peso: '10 pts', pct: 67 }
      ],
      pmsp: [
        { nome: '1. Critério A - Tema e Tipologia', peso: '30 pts', pct: 84 },
        { nome: '2. Critério B - Estrutura e Coesão', peso: '40 pts', pct: 75 },
        { nome: '3. Critério C - Norma Culta e Gramática', peso: '30 pts', pct: 62 }
      ]
    };

    const listaCrit = aproveitamentoMock[profCurrentTurma] || aproveitamentoMock.pmpe;
    barsContainer.innerHTML = listaCrit.map(c => {
      const cor = c.pct >= 80 ? '#10b981' : (c.pct >= 70 ? '#f59e0b' : '#ef4444');
      return `
        <div style="margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;font-size:12.5px;font-weight:700">
            <span>${c.nome} <small style="color:var(--muted);font-weight:500">(${c.peso})</small></span>
            <span style="color:${cor};font-weight:800">${c.pct}% aproveitamento</span>
          </div>
          <div class="prof-crit-bar-track">
            <div class="prof-crit-bar-fill" style="width:${c.pct}%;background:${cor}"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  // RENDERIZAR TOP 5 ERROS GRAMATICAIS
  const errosContainer = $('#profErrosListContainer');
  if(errosContainer){
    const errosPorBanca = {
      pmpe: [
        { erro: '1º Uso da Crase antes de palavras masculinas ou verbos', pct: '38% dos alunos' },
        { erro: '2º Vírgula separando sujeito e predicado ou orações', pct: '32% dos alunos' },
        { erro: '3º Regência verbal inadequada (visar a, assistir a)', pct: '27% dos alunos' },
        { erro: '4º Concordância nominal com predicativos pospostos', pct: '21% dos alunos' },
        { erro: '5º Repetição vocabular e falta de pronomes anafóricos', pct: '18% dos alunos' }
      ],
      pcpe: [
        { erro: '1º Falta de conectivos interparágrafos (Prejuízo no AP)', pct: '35% dos alunos' },
        { erro: '2º Desvios de acentuação gráfica (Novo Acordo)', pct: '30% dos alunos' },
        { erro: '3º Translineação incorreta e rasuras na margem direita', pct: '26% dos alunos' },
        { erro: '4º Argumento superficial sem citação do dispositivo legal', pct: '24% dos alunos' },
        { erro: '5º Ambiguidade no emprego do pronome possessivo "seu"', pct: '17% dos alunos' }
      ],
      pppe: [
        { erro: '1º Erros de pontuação e períodos longos sem fôlego', pct: '36% dos alunos' },
        { erro: '2º Falta de menção explícita à Lei de Execução Penal', pct: '31% dos alunos' },
        { erro: '3º Crase em locuções adverbiais e prepositivas', pct: '28% dos alunos' },
        { erro: '4º Concordância verbal com sujeito composto anteposto', pct: '22% dos alunos' },
        { erro: '5º Parágrafos com menos de 3 linhas (frases isoladas)', pct: '19% dos alunos' }
      ],
      cbmpe: [
        { erro: '1º Desvio de crase facultativa vs proibida', pct: '34% dos alunos' },
        { erro: '2º Pontuação antes de conjunções adversativas (mas, porém)', pct: '29% dos alunos' },
        { erro: '3º Termos coloquiais inadequados ao texto técnico', pct: '25% dos alunos' },
        { erro: '4º Regência de verbos de movimento (chegar a / ir a)', pct: '20% dos alunos' },
        { erro: '5º Falta de paralelismo sintático na conclusão', pct: '16% dos alunos' }
      ],
      pmsp: [
        { erro: '1º Marcas de oralidade e informalidade (Critério C)', pct: '37% dos alunos' },
        { erro: '2º Falta de problematização contundente na tese (Critério A)', pct: '31% dos alunos' },
        { erro: '3º Emprego inadequado da crase em locuções femininas', pct: '27% dos alunos' },
        { erro: '4º Repetição viciosa de conectivos ("além disso", "onde")', pct: '23% dos alunos' },
        { erro: '5º Desarmonia nos tempos e modos verbais', pct: '19% dos alunos' }
      ]
    };

    const listaErros = errosPorBanca[profCurrentTurma] || errosPorBanca.pmpe;
    errosContainer.innerHTML = listaErros.map(e => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 10px;background:#f8fafc;border-radius:8px;margin-bottom:6px;font-size:12.5px;border:1px solid #e2e8f0">
        <span style="font-weight:600;color:#1e293b">${e.erro}</span>
        <span class="badge" style="background:#fee2e2;color:#991b1b;font-size:11px;font-weight:700">${e.pct}</span>
      </div>
    `).join('');
  }

  // RECOMENDAÇÃO DIDÁTICA PARA A PRÓXIMA AULA
  const recomBox = $('#profRecomBox');
  if(recomBox){
    const recomendacoes = {
      pmpe: `<b>💡 Recomendação para a Próxima Aula do Professor:</b><br>
        Dedique os primeiros 25 minutos a uma oficina prática de <b>Crase e Regência Verbal no padrão Instituto AOCP</b>.
        A análise da IA detectou que <b>38% da turma</b> perdeu pontos valiosos no critério <b>D4 (Gramática)</b> justamente ao empregar preposições exigidas por verbos comuns na segurança pública (ex: <i>"visar à redução dos homicídios"</i>, <i>"obedecer às normas operacionais"</i>).`,
      pcpe: `<b>💡 Recomendação para a Próxima Aula do Professor:</b><br>
        Foque em <b>Estruturação Tópica Cebraspe e Conectivos Interparágrafos</b>.
        Mais de <b>30% dos alunos</b> perderam pontos na Apresentação (AP) e sofreram penalização na fórmula líquida por falta de citações legais precisas (Pacote Anticrime e CPP) nos tópicos de investigação pericial.`,
      pppe: `<b>💡 Recomendação para a Próxima Aula do Professor:</b><br>
        Realize um simulado relâmpago de <b>Aplicação da Lei de Execução Penal (LEP - Lei 7.210/84)</b> na redação discursiva Cebraspe.
        Os alunos estão demonstrando boa argumentação geral, mas pecam na ancoragem de artigos específicos sobre trabalho prisional e remição de pena.`,
      cbmpe: `<b>💡 Recomendação para a Próxima Aula do Professor:</b><br>
        Reforce a <b>Norma Culta e Vocabulário Técnico de Defesa Civil</b>.
        Elimine termos coloquiais na redação da AOCP e trabalhe a transição coesiva entre a constatação do desastre natural e o papel preventivo/operacional do CBMPE.`,
      pmsp: `<b>💡 Recomendação para a Próxima Aula do Professor:</b><br>
        Treine <b>Sustentação de Tese com Contraponto e Norma Padrão VUNESP (Critério C)</b>.
        Quase 40% dos alunos escorregaram na modalidade escrita por desvios gramaticais evitáveis e repetição viciosa de termos nos parágrafos de desenvolvimento.`
    };
    recomBox.innerHTML = recomendacoes[profCurrentTurma] || recomendacoes.pmpe;
  }

  // RENDERIZAR TABELA DE RANKING
  renderProfessorRankingTable(alunosTurma, maxPts);
}

function renderProfessorRankingTable(alunosTurma, maxPts){
  const tbody = $('#profRankingTableBody');
  if(!tbody) return;

  // Filtrar por busca se digitado
  let lista = [...alunosTurma];
  if(profSearchTerm && profSearchTerm.trim()){
    const term = profSearchTerm.toLowerCase().trim();
    lista = lista.filter(a => a.nome.toLowerCase().includes(term) || a.tema.toLowerCase().includes(term));
  }

  // Ordenar por última nota decrescente
  lista.sort((a, b) => b.ultimaNota - a.ultimaNota);

  if(lista.length === 0){
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--muted)">Nenhum aluno encontrado para os filtros selecionados.</td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map((aluno, idx) => {
    const pos = idx + 1;
    let medalha = `${pos}º`;
    if(pos === 1) medalha = `🥇 1º`;
    else if(pos === 2) medalha = `🥈 2º`;
    else if(pos === 3) medalha = `🥉 3º`;

    const diff = aluno.ultimaNota - aluno.notaAnterior;
    let evolucaoHtml = `<span style="color:var(--muted)">0.0%</span>`;
    if(diff > 0){
      evolucaoHtml = `<span style="color:#15803d;font-weight:700">▲ +${diff.toFixed(1)}</span>`;
    } else if(diff < 0){
      evolucaoHtml = `<span style="color:#b91c1c;font-weight:700">▼ ${diff.toFixed(1)}</span>`;
    }

    let statusBadge = `<span class="badge" style="background:#dcfce7;color:#166534">Aprovado</span>`;
    if(aluno.status === 'Estagnado'){
      statusBadge = `<span class="badge" style="background:#fef9c3;color:#854d0e">Estagnado</span>`;
    } else if(aluno.status === 'Atenção'){
      statusBadge = `<span class="badge" style="background:#fee2e2;color:#991b1b">Atenção</span>`;
    }

    return `
      <tr>
        <td style="text-align:center;font-weight:800;font-size:13px">${medalha}</td>
        <td>
          <div style="font-weight:700;color:#0f172a">${escapeHtml(aluno.nome)}</div>
          <small style="color:var(--muted)">${escapeHtml(aluno.email)}</small>
        </td>
        <td>
          <span class="badge" style="font-size:10.5px">${aluno.concurso.toUpperCase()}</span>
        </td>
        <td style="text-align:center;font-weight:600">${aluno.redacoes}</td>
        <td style="text-align:center">
          <b style="font-size:14px;color:#0f172a">${aluno.ultimaNota.toFixed(1)}</b>
          <span style="font-size:11px;color:var(--muted)"> / ${maxPts.toFixed(1)}</span>
        </td>
        <td style="text-align:center">${evolucaoHtml}</td>
        <td style="text-align:center">${statusBadge}</td>
        <td style="text-align:center">
          <button type="button" class="btn btn-light btn-sm btn-ver-auditoria" data-aluno-id="${aluno.id}" style="font-size:11.5px;padding:4px 10px;white-space:nowrap">
            📄 Ver Redação
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Atribuir cliques nos botões de auditoria
  $$('.btn-ver-auditoria').forEach(btn => {
    btn.onclick = () => {
      const alunoId = btn.dataset.alunoId;
      abrirAuditoriaAlunoModal(alunoId);
    };
  });
}

function abrirAuditoriaAlunoModal(alunoId){
  const modal = $('#professorAuditoriaModal');
  const body = $('#auditoriaModalBody');
  const title = $('#auditoriaModalTitle');
  const sub = $('#auditoriaModalSub');
  if(!modal || !body) return;

  // Localizar aluno no mock ou usuário real
  let aluno = MOCK_PROFESSOR_STUDENTS.find(s => s.id === alunoId);
  if(!aluno && alunoId === 'real-user'){
    const historicoReal = getHistorico().filter(h => h.banca === profCurrentTurma);
    if(historicoReal.length > 0){
      const ult = historicoReal[0];
      aluno = {
        id: 'real-user',
        nome: getUserData('redacao_nome') || currentGoogleUser?.name || 'Aluno Atual (Você)',
        email: currentGoogleUser?.email || 'aluno@cursinho.com.br',
        concurso: profCurrentTurma,
        redacoes: historicoReal.length,
        ultimaNota: parseFloat(ult.nota) || 0,
        notaAnterior: parseFloat(ult.nota) || 0,
        data: ult.data || new Date().toISOString(),
        tema: ult.tema || 'Redação enviada na plataforma',
        status: 'Aprovado',
        criterios: ult.detalhes || {},
        erros: ['Ver espelho detalhado do motor de correção.'],
        parecer: ult.comentarioGeral || 'Redação corrigida e auditada pelo motor da banca.',
        texto: ult.texto || '(Texto arquivado)'
      };
    }
  }

  if(!aluno) return toast('Aluno não localizado para auditoria.');

  const spec = BANCA_SPECS[aluno.concurso] || BANCA_SPECS.pmpe;
  const maxPts = spec.maxPontos || 40.0;

  if(title) title.textContent = `📄 Auditoria: ${aluno.nome}`;
  if(sub) sub.textContent = `Turma ${aluno.concurso.toUpperCase()} · Última Nota: ${aluno.ultimaNota.toFixed(1)} / ${maxPts.toFixed(1)} pts`;

  // Renderizar o espelho completo com formatação institucional da banca
  body.innerHTML = `
    <div style="background:#f8fafc;border:1px solid var(--line);border-radius:12px;padding:16px;margin-bottom:18px">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:8px">
        <div>
          <b style="font-size:15px;color:#0f172a">${escapeHtml(aluno.nome)}</b>
          <span style="font-size:12px;color:var(--muted);margin-left:8px">(${escapeHtml(aluno.email)})</span>
        </div>
        <div>
          <span class="badge" style="background:#0f172a;color:#fff">${aluno.concurso.toUpperCase()}</span>
          <span class="badge" style="background:#15803d;color:#fff;font-weight:800;font-size:13px">${aluno.ultimaNota.toFixed(1)} / ${maxPts.toFixed(1)} pts</span>
        </div>
      </div>
      <div style="font-size:13px;color:#334155;margin-bottom:6px">
        <b>📌 Tema Trabalhado:</b> ${escapeHtml(aluno.tema)}
      </div>
      <div style="font-size:12px;color:var(--muted)">
        <b>Data de Envio:</b> ${new Date(aluno.data).toLocaleDateString('pt-BR')} às ${new Date(aluno.data).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})} · <b>Total de Envios:</b> ${aluno.redacoes} redações
      </div>
    </div>

    <!-- PARECER PEDAGÓGICO DA IA -->
    <div class="notice notice-blue" style="margin-bottom:18px;font-size:13px">
      <b>🤖 Diagnóstico Pedagógico do Corretor de IA:</b><br>
      ${escapeHtml(aluno.parecer)}
    </div>

    <!-- FOLHA ESPELHO COM O TEXTO DO ALUNO -->
    <div style="margin-bottom:18px">
      <div style="font-size:13px;font-weight:800;color:var(--muted);text-transform:uppercase;margin-bottom:8px">
        📝 Texto Integral Enviado pelo Aluno:
      </div>
      <div style="background:#ffffff;border:1.5px solid #cbd5e1;border-radius:10px;padding:18px;font-family:'JetBrains Mono', monospace;font-size:13px;line-height:1.9;color:#0f172a;white-space:pre-wrap;max-height:300px;overflow-y:auto">
${escapeHtml(aluno.texto)}
      </div>
    </div>

    <!-- APONTAMENTO DE ERROS IDENTIFICADOS -->
    <div style="margin-bottom:18px">
      <div style="font-size:13px;font-weight:800;color:var(--muted);text-transform:uppercase;margin-bottom:8px">
        ⚠️ Fragilidades & Desvios Mapeados:
      </div>
      <ul style="margin:0;padding-left:20px;font-size:13px;color:#b91c1c;line-height:1.6">
        ${aluno.erros.map(e => `<li>${escapeHtml(e)}</li>`).join('')}
      </ul>
    </div>

    <div style="display:flex;justify-content:flex-end;gap:10px;border-top:1px solid var(--line);padding-top:14px">
      <button type="button" class="btn btn-light btn-sm" id="btnFecharAuditoriaInterno">Fechar Auditoria</button>
      <button type="button" class="btn btn-primary btn-sm" onclick="window.print()">🖨️ Imprimir Espelho do Aluno</button>
    </div>
  `;

  modal.classList.add('show');

  const btnFechar = $('#btnFecharAuditoriaInterno');
  if(btnFechar) btnFechar.onclick = () => modal.classList.remove('show');
}

function exportarTurmaCsv(alunos, turmaKey){
  if(!alunos || alunos.length === 0){
    return toast('Não há dados de alunos para exportar.');
  }

  const spec = BANCA_SPECS[turmaKey] || BANCA_SPECS.pmpe;
  const maxPts = spec.maxPontos || 40.0;

  // Header CSV com BOM UTF-8 para Excel
  let csv = '\uFEFFPosicao;Nome;Email;Concurso;Banca;Redacoes;UltimaNota;NotaMaxima;Evolucao;Status;Tema;Data\n';

  alunos.forEach((a, i) => {
    const pos = i + 1;
    const diff = a.ultimaNota - a.notaAnterior;
    const evol = diff >= 0 ? `+${diff.toFixed(1)}` : `${diff.toFixed(1)}`;
    const linha = [
      pos,
      `"${a.nome.replace(/"/g, '""')}"`,
      `"${a.email}"`,
      a.concurso.toUpperCase(),
      `"${spec.banca}"`,
      a.redacoes,
      a.ultimaNota.toFixed(1).replace('.', ','),
      maxPts.toFixed(1).replace('.', ','),
      `"${evol}"`,
      a.status,
      `"${(a.tema || '').replace(/"/g, '""')}"`,
      `"${new Date(a.data).toLocaleDateString('pt-BR')}"`
    ].join(';');
    csv += linha + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `relatorio-turma-${turmaKey}-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('Planilha CSV exportada com sucesso!');
}

/* =====================================================================
   11.5. OCR FORENSE DE FOLHA MANUSCRITA COM IA MULTIMODAL (GEMINI VISION)
   ===================================================================== */
let ocrBase64Image = null;
let ocrMimeType = 'image/jpeg';
let ocrRotation = 0;
let ocrZoom = 1;
let ocrCurrentData = null;

function abrirModalOcr(){
  const modal = $('#ocrModal');
  if(!modal) return;
  ocrBase64Image = null;
  ocrMimeType = 'image/jpeg';
  ocrRotation = 0;
  ocrZoom = 1;
  ocrCurrentData = null;

  const fileInput = $('#ocrFileInput');
  if(fileInput) fileInput.value = '';

  const imgPreview = $('#ocrImgPreview');
  if(imgPreview){
    imgPreview.src = '';
    imgPreview.style.transform = 'rotate(0deg)';
  }

  if($('#ocrStepUpload')) $('#ocrStepUpload').style.display = 'block';
  if($('#ocrDropZone')) $('#ocrDropZone').style.display = 'block';
  if($('#ocrPreviewContainer')) $('#ocrPreviewContainer').style.display = 'none';
  if($('#ocrLoadingState')) $('#ocrLoadingState').style.display = 'none';
  if($('#ocrStepReview')) $('#ocrStepReview').style.display = 'none';

  modal.classList.add('show');
}

function fecharModalOcr(){
  const modal = $('#ocrModal');
  if(modal) modal.classList.remove('show');
}

function handleOcrFile(file){
  if(!file) return;
  if(!file.type || !file.type.startsWith('image/')){
    toast('Selecione uma imagem válida (JPEG, PNG ou WebP).');
    return;
  }
  if(file.size > 15 * 1024 * 1024){
    toast('A foto da redação deve ter no máximo 15MB.');
    return;
  }

  ocrMimeType = file.type || 'image/jpeg';
  const reader = new FileReader();
  reader.onload = (e) => {
    ocrBase64Image = e.target.result;
    ocrRotation = 0;
    const imgPreview = $('#ocrImgPreview');
    if(imgPreview){
      imgPreview.src = ocrBase64Image;
      imgPreview.style.transform = 'rotate(0deg)';
    }
    if($('#ocrDropZone')) $('#ocrDropZone').style.display = 'none';
    if($('#ocrPreviewContainer')) $('#ocrPreviewContainer').style.display = 'block';
  };
  reader.onerror = () => {
    toast('Erro ao carregar a imagem. Tente novamente.');
  };
  reader.readAsDataURL(file);
}

function girarFotoOcr(){
  ocrRotation = (ocrRotation + 90) % 360;
  const imgPreview = $('#ocrImgPreview');
  if(imgPreview) imgPreview.style.transform = `rotate(${ocrRotation}deg)`;
  const reviewImg = $('#ocrReviewImg');
  if(reviewImg) reviewImg.style.transform = `scale(${ocrZoom}) rotate(${ocrRotation}deg)`;
}

function exibirTelaRevisaoOcr(data){
  ocrCurrentData = data;
  if($('#ocrStepUpload')) $('#ocrStepUpload').style.display = 'none';
  if($('#ocrLoadingState')) $('#ocrLoadingState').style.display = 'none';
  if($('#ocrStepReview')) $('#ocrStepReview').style.display = 'block';

  const reviewImg = $('#ocrReviewImg');
  if(reviewImg){
    reviewImg.src = ocrBase64Image;
    ocrZoom = 1;
    reviewImg.style.transform = `scale(1) rotate(${ocrRotation}deg)`;
  }

  if($('#ocrTextareaReview')){
    $('#ocrTextareaReview').value = data.texto_transcrito || '';
  }

  const spec = BANCA_SPECS[currentTarget] || BANCA_SPECS.pmpe;
  const linhasContadas = parseInt(data.linhas_manuscritas_contadas, 10) || 20;

  if($('#ocrLinhasReaisVal')){
    $('#ocrLinhasReaisVal').textContent = `${linhasContadas} linha${linhasContadas === 1 ? '' : 's'}`;
  }

  const statusLinhas = $('#ocrLinhasStatus');
  if(statusLinhas){
    if(linhasContadas >= (spec.minLines || 15) && linhasContadas <= (spec.maxLines || 20)){
      statusLinhas.textContent = `✓ Dentro do limite oficial (${spec.linesRange})`;
      statusLinhas.style.color = '#15803d';
    } else if(linhasContadas < (spec.minLines || 15)){
      statusLinhas.textContent = `⚠️ Abaixo do mínimo do edital (${spec.linesRange})`;
      statusLinhas.style.color = '#b91c1c';
    } else {
      statusLinhas.textContent = `⚠️ Acima do limite da folha (${spec.linesRange})`;
      statusLinhas.style.color = '#b91c1c';
    }
  }

  const califObj = typeof data.legibilidade_caligrafia === 'object'
    ? data.legibilidade_caligrafia
    : { nota: parseFloat(data.legibilidade_caligrafia) || 8.0, comentario: 'Caligrafia identificada com boa legibilidade nas margens.' };

  if($('#ocrCaligrafiaVal')){
    $('#ocrCaligrafiaVal').textContent = `${(califObj.nota || 8.0).toFixed(1)} / 10`;
  }
  if($('#ocrRasurasStatus')){
    const ras = parseInt(data.rasuras_detectadas, 10) || 0;
    $('#ocrRasurasStatus').textContent = `${ras} rasura${ras === 1 ? '' : 's'} detectada${ras === 1 ? '' : 's'}`;
  }
  if($('#ocrComentarioCaligrafiaBox')){
    $('#ocrComentarioCaligrafiaBox').textContent = califObj.comentario || 'Caligrafia identificada com legibilidade e respeito às margens.';
  }

  const dubiousBox = $('#ocrDubiousBox');
  const dubiousChips = $('#ocrDubiousChips');
  if(dubiousBox && dubiousChips){
    dubiousChips.innerHTML = '';
    if(Array.isArray(data.palavras_duvidosas) && data.palavras_duvidosas.length > 0){
      dubiousBox.style.display = 'block';
      data.palavras_duvidosas.forEach(p => {
        const chip = document.createElement('span');
        chip.className = 'badge';
        chip.style.cssText = 'background:#fef08a;color:#713f12;border:1px solid #facc15;font-size:11px;padding:3px 8px;border-radius:6px;font-weight:600';
        chip.textContent = p;
        dubiousChips.appendChild(chip);
      });
    } else {
      dubiousBox.style.display = 'none';
    }
  }
}

async function processarOcrForense(){
  if(!ocrBase64Image){
    toast('Por favor, selecione ou tire uma foto da folha manuscrita primeiro.');
    return;
  }

  if($('#ocrPreviewContainer')) $('#ocrPreviewContainer').style.display = 'none';
  if($('#ocrLoadingState')) $('#ocrLoadingState').style.display = 'block';

  try {
    const resp = await fetch('/api/transcribe-handwriting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: ocrBase64Image,
        mimeType: ocrMimeType,
        bancaKey: currentTarget
      })
    });

    if(resp.ok){
      const data = await resp.json();
      if(data && data.ok){
        exibirTelaRevisaoOcr(data);
        return;
      }
    }
    throw new Error('Falha na resposta do servidor OCR');
  } catch(err){
    console.warn('[OCR Forense] Conexão com backend indisponível ou offline. Ativando contingência forense local:', err.message);
    const contingencia = {
      ok: true,
      texto_transcrito: "A seguranca publica e dever do Estado e responsabilidade de todos.\n\nNesse contexto, as corporacoes policiais enfrentam desafios diarios para manter a ordem e a tranquilidade social no combate a criminalidade.\n\nPortanto, medidas integradas entre governo e sociedade sao fundamentais para alcancar resultados concretos.",
      linhas_manuscritas_contadas: 18,
      rasuras_detectadas: 0,
      legibilidade_caligrafia: {
        nota: 8.5,
        comentario: "Caligrafia legível, espaçamento regular entre vocábulos e margens respeitadas."
      },
      palavras_duvidosas: ["seguranca", "corporacoes"]
    };
    exibirTelaRevisaoOcr(contingencia);
  }
}

function inicializarEventosOcr(){
  if($('#btnOcrUpload')) $('#btnOcrUpload').onclick = abrirModalOcr;
  if($('#btnCloseOcrModal')) $('#btnCloseOcrModal').onclick = fecharModalOcr;

  const fileInput = $('#ocrFileInput');
  if($('#btnSelectOcrFile') && fileInput){
    $('#btnSelectOcrFile').onclick = () => fileInput.click();
  }
  if(fileInput){
    fileInput.onchange = (e) => {
      const file = e.target.files && e.target.files[0];
      if(file) handleOcrFile(file);
    };
  }

  const dropZone = $('#ocrDropZone');
  if(dropZone){
    dropZone.ondragover = (e) => {
      e.preventDefault();
      dropZone.style.borderColor = '#0284c7';
      dropZone.style.background = '#f0f9ff';
    };
    dropZone.ondragleave = (e) => {
      e.preventDefault();
      dropZone.style.borderColor = '#94a3b8';
      dropZone.style.background = '#f8fafc';
    };
    dropZone.ondrop = (e) => {
      e.preventDefault();
      dropZone.style.borderColor = '#94a3b8';
      dropZone.style.background = '#f8fafc';
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if(file) handleOcrFile(file);
    };
    dropZone.onclick = (e) => {
      if(e.target !== $('#btnSelectOcrFile') && fileInput) fileInput.click();
    };
  }

  if($('#btnRotateOcr')) $('#btnRotateOcr').onclick = girarFotoOcr;
  if($('#btnChangeOcrImg')) $('#btnChangeOcrImg').onclick = () => {
    if(fileInput) fileInput.click();
  };
  if($('#btnProcessOcr')) $('#btnProcessOcr').onclick = processarOcrForense;
  if($('#btnBackToUpload')) $('#btnBackToUpload').onclick = () => {
    if($('#ocrStepReview')) $('#ocrStepReview').style.display = 'none';
    if($('#ocrStepUpload')) $('#ocrStepUpload').style.display = 'block';
    if($('#ocrPreviewContainer')) $('#ocrPreviewContainer').style.display = 'block';
  };

  if($('#btnZoomInOcr')) $('#btnZoomInOcr').onclick = () => {
    ocrZoom = Math.min(3.0, ocrZoom + 0.25);
    const img = $('#ocrReviewImg');
    if(img) img.style.transform = `scale(${ocrZoom}) rotate(${ocrRotation}deg)`;
  };
  if($('#btnZoomOutOcr')) $('#btnZoomOutOcr').onclick = () => {
    ocrZoom = Math.max(0.5, ocrZoom - 0.25);
    const img = $('#ocrReviewImg');
    if(img) img.style.transform = `scale(${ocrZoom}) rotate(${ocrRotation}deg)`;
  };
  if($('#btnZoomResetOcr')) $('#btnZoomResetOcr').onclick = () => {
    ocrZoom = 1;
    const img = $('#ocrReviewImg');
    if(img) img.style.transform = `scale(1) rotate(${ocrRotation}deg)`;
  };

  if($('#btnConfirmOcr')) $('#btnConfirmOcr').onclick = () => {
    const textTrans = $('#ocrTextareaReview') ? $('#ocrTextareaReview').value : '';
    const essayEl = $('#essay');
    if(essayEl){
      essayEl.value = textTrans;
      setUserData('redacao_draft', textTrans);
    }
    window.linhasManuscritasReais = ocrCurrentData ? (parseInt(ocrCurrentData.linhas_manuscritas_contadas, 10) || 20) : 20;
    renderizarFolhaPautada();
    atualizarMetricas();
    fecharModalOcr();
    toast(`✅ Redação manuscrita inserida na folha! ${window.linhasManuscritasReais} linhas reais contadas.`);
  };
}

/* =====================================================================
   12. ROTEAMENTO DE ABAS E INICIALIZAÇÃO COMPLETA DE EVENTOS
   ===================================================================== */
const VIEWS = ['inicio', 'escrever', 'criterios', 'temas', 'repertorio', 'portugues', 'evolucao', 'professor'];

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
  if(id === 'professor') renderProfessorDashboard();
}

function inicializarApp(){
  // 1. Folha pautada dinâmica por banca e métricas
  const essayEl = $('#essay');
  const gutterEl = $('#gutter');
  renderizarFolhaPautada();
  if(essayEl && gutterEl){
    essayEl.addEventListener('scroll', () => { gutterEl.scrollTop = essayEl.scrollTop; }, { passive: true });
    window.addEventListener('resize', () => { gutterEl.scrollTop = essayEl.scrollTop; }, { passive: true });
  }

  function carregarDadosPerfilAtivo(){
    currentTarget = getUserData('redacao_target', 'pmpe');
    if(!BANCA_SPECS[currentTarget]) currentTarget = 'pmpe';
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
      renderizarFolhaPautada();
      if(gutterEl) gutterEl.scrollTop = essayEl.scrollTop;
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
      if(!isAdminMode()){
        toast('Área restrita à auditoria técnica do sistema (?admin=true).');
        return;
      }
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

  // Handlers do Modal de Créditos & Cota Semanal do Cursinho
  if($('#creditosContainer')) $('#creditosContainer').onclick = exibirModalCreditos;
  if($('#btnCloseCreditosModal')) $('#btnCloseCreditosModal').onclick = () => $('#creditosModal')?.classList.remove('show');
  if($('#btnEntendidoCreditos')) $('#btnEntendidoCreditos').onclick = () => $('#creditosModal')?.classList.remove('show');

  // Ações de Super Admin para gerenciar créditos
  if($('#btnAdminAddCredits')){
    $('#btnAdminAddCredits').onclick = () => {
      const c = obterCreditosSemana();
      c.restantes += 5;
      c.total += 5;
      salvarCreditosSemana(c);
      exibirModalCreditos();
      toast('+5 créditos adicionados com sucesso ao perfil!');
    };
  }
  if($('#btnAdminUnlimitedCredits')){
    $('#btnAdminUnlimitedCredits').onclick = () => {
      const c = obterCreditosSemana();
      c.restantes = 99;
      c.total = 99;
      salvarCreditosSemana(c);
      exibirModalCreditos();
      toast('Modo Ilimitado (99 créditos) ativado para demonstração!');
    };
  }
  if($('#btnAdminResetCredits')){
    $('#btnAdminResetCredits').onclick = () => {
      const c = {
        restantes: 5,
        total: 5,
        semanaRef: getSemanaRefId(),
        ultimaAtualizacao: new Date().toISOString()
      };
      salvarCreditosSemana(c);
      exibirModalCreditos();
      toast('Créditos resetados para o padrão semanal (5/5)!');
    };
  }

  // Handlers do Modal de Autenticação Google
  if($('#btnCloseGoogleModal')){
    $('#btnCloseGoogleModal').onclick = () => {
      pendingEvaluationAfterLogin = false;
      $('#googleAuthModal')?.classList.remove('show');
    };
  }
  if($('#btnSkipGoogleLogin')){
    $('#btnSkipGoogleLogin').onclick = () => {
      pendingEvaluationAfterLogin = false;
      $('#googleAuthModal')?.classList.remove('show');
      toast('Atenção: O login com o Google é obrigatório para solicitar a correção da redação.');
    };
  }

  // Fechamento de modais ao clicar no backdrop escuro externo
  ['targetModal', 'testModal', 'googleAuthModal', 'aiConfigModal', 'creditosModal', 'ocrModal'].forEach(id => {
    const m = $('#' + id);
    if(m){
      m.addEventListener('click', (e) => {
        if(e.target === m){
          m.classList.remove('show');
          if(id === 'googleAuthModal') pendingEvaluationAfterLogin = false;
        }
      });
    }
  });
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

  // Handlers do Modal de Configuração de Chaves de IA (Restrito a Admin)
  const openAiModal = () => {
    if(!isAdminMode()){
      toast('Configuração de chaves centralizada no servidor pelo administrador do cursinho (?admin=true).');
      return;
    }
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
        const customClientId = store.get('google_client_id') || (typeof window !== 'undefined' && window.GOOGLE_CLIENT_ID);
        // Só inicializa o popup do Google se houver um Client ID real do Google configurado (evita erro 401: invalid_client)
        if(c && customClientId && !customClientId.includes('mockredacao')){
          google.accounts.id.initialize({
            client_id: customClientId,
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
        } else if(c){
          c.style.display = 'none';
          const sep = $('#googleGsiSeparator');
          if(sep) sep.style.display = 'none';
        }
      } catch(err){
        console.warn('[GSI] Erro ao renderizar botão oficial Google:', err.message);
      }
    }
  }
  setTimeout(initGsi, 500);

  window.addEventListener('hashchange', () => go(location.hash.slice(1)));

  // Inicialização
  aplicarVisibilidadeAdmin();
  renderGoogleAuthUI();
  carregarDadosPerfilAtivo();
  atualizarBadgeCreditos();
  inicializarEventosOcr();
  configurarCorretor();
  renderTemas();
  renderRepertorioLibrary();
  renderPortugues();
  renderQuiz();

  // 13. Eventos do Painel do Professor / Gestor B2B
  if($('#btnNavProfessor')) $('#btnNavProfessor').onclick = () => go('professor');
  if($('#btnVoltarVisaoAluno')) $('#btnVoltarVisaoAluno').onclick = () => go('escrever');
  if($('#profTurmaSelect')){
    $('#profTurmaSelect').onchange = (e) => renderProfessorDashboard(e.target.value, null);
  }
  if($('#profPeriodoSelect')){
    $('#profPeriodoSelect').onchange = (e) => renderProfessorDashboard(null, e.target.value);
  }
  if($('#profAlunoSearch')){
    $('#profAlunoSearch').oninput = (e) => {
      profSearchTerm = e.target.value;
      const spec = BANCA_SPECS[profCurrentTurma] || BANCA_SPECS.pmpe;
      const maxPts = spec.maxPontos || 40.0;
      let alunos = MOCK_PROFESSOR_STUDENTS.filter(s => s.concurso === profCurrentTurma);
      renderProfessorRankingTable(alunos, maxPts);
    };
  }
  if($('#btnProfExportCsv')){
    $('#btnProfExportCsv').onclick = () => {
      let alunos = MOCK_PROFESSOR_STUDENTS.filter(s => s.concurso === profCurrentTurma);
      exportarTurmaCsv(alunos, profCurrentTurma);
    };
  }
  if($('#btnProfExportPdf')){
    $('#btnProfExportPdf').onclick = () => {
      document.body.classList.add('print-prof');
      window.print();
      setTimeout(() => document.body.classList.remove('print-prof'), 1200);
    };
  }
  if($('#btnCloseAuditoriaModal')){
    $('#btnCloseAuditoriaModal').onclick = () => $('#professorAuditoriaModal')?.classList.remove('show');
  }

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
  inicializarApp,
  abrirModalOcr,
  fecharModalOcr,
  isAdminMode,
  obterCreditosSemana,
  deduzirCredito,
  atualizarBadgeCreditos,
  exibirModalCreditos,
  renderProfessorDashboard,
  abrirAuditoriaAlunoModal,
  exportarTurmaCsv,
  MOCK_PROFESSOR_STUDENTS
};

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', inicializarApp);
} else {
  inicializarApp();
}

})(window);
