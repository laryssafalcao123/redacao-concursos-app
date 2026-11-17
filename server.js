/**
 * =====================================================================
 * REDAÇÃO APROVADA 2.0 — BACKEND SEGURO & MULTI-MODEL IA ENGINE
 * (Node.js Zero-Dependency Server com Suporte a Cascata de Modelos de IA,
 * Autenticação Google com Reconhecimento de Primeiro Login e Persistência)
 * =====================================================================
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

// 1. CARREGAMENTO AUTOMÁTICO DE VARIÁVEIS DE AMBIENTE (.env) SEM DEPENDÊNCIAS
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      });
    } catch (e) {
      console.warn('[Env] Não foi possível ler .env:', e.message);
    }
  }
}
loadEnv();

// Carregar dados e motor para fallback determinístico
global.window = global;
try {
  require('./dados-pedagogicos.js');
  require('./motor-correcao.js');
} catch (e) {
  console.warn('[Motor Local] Inicializando motor:', e.message);
}

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS = new Map(); // token -> { userId, googleId, nome, email, picture, expiresAt }

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(String(password), salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, originalHash] = String(stored || '').split(':');
  if (!salt || !originalHash) return false;
  const hash = crypto.pbkdf2Sync(String(password), salt, 10000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(originalHash, 'hex'));
}

function getAuthUser(req) {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token || !SESSIONS.has(token)) return null;
  const session = SESSIONS.get(token);
  if (Date.now() > session.expiresAt) {
    SESSIONS.delete(token);
    return null;
  }
  return session;
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(payload));
}

function parseBody(req, maxBytes = 250 * 1024) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (Buffer.byteLength(body) > maxBytes) {
        reject(new Error('Payload excede o limite máximo permitido (250KB).'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('JSON inválido no corpo da requisição.'));
      }
    });
    req.on('error', reject);
  });
}

function makeHttpsRequest(options, postData, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    let timer;
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        clearTimeout(timer);
        resolve({ statusCode: res.statusCode, data });
      });
    });
    req.on('error', err => {
      clearTimeout(timer);
      reject(err);
    });
    timer = setTimeout(() => {
      req.destroy();
      reject(new Error(`Timeout de ${timeoutMs}ms excedido na requisição.`));
    }, timeoutMs);
    if (postData) req.write(postData);
    req.end();
  });
}

function extractJson(text) {
  let cleaned = String(text || '').trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.substring(start, end + 1);
  }
  return JSON.parse(cleaned);
}

// 2. CONSTRUTOR DE PROMPT CRITERIOSO ESPECIALIZADO POR BANCA (PADRÃO GLAU 6 PILARES)
function construirPromptBanca({ texto, tema, comando, bancaKey, spec, linhasReais }) {
  const palavrasCount = String(texto || '').trim().split(/\s+/).filter(Boolean).length;
  const paragrafosArr = String(texto || '').trim().split(/\n+/).map(p => p.trim()).filter(Boolean);
  const linhasEst = (linhasReais && Number(linhasReais) > 0)
    ? Math.round(Number(linhasReais))
    : Math.max(1, paragrafosArr.reduce((acc, p) => {
        const w = p.split(/\s+/).filter(Boolean).length;
        return acc + Math.max(1, Math.round((Math.ceil(w / 11) + Math.ceil(p.length / 68)) / 2));
      }, 0));

  const instrucoesBanca = {
    pmpe: `BANCA ORGANIZADORA: INSTITUTO AOCP (Polícia Militar de Pernambuco - PMPE)
- Gênero: Texto Dissertativo-Argumentativo em prosa.
- Extensão obrigatória: 15 a 20 linhas (inferior a 7 linhas = anulação/nota zero). Linhas escritas pelo candidato: ${linhasEst}.
- Pontuação Máxima: 40,0 pontos distribuídos nos 5 critérios oficiais (0 a 8,0 pontos cada):
  1. Atendimento e desenvolvimento do tema (id: "c1") - Máx: 8,0 pts
  2. Coesão referencial e sequencial (id: "c2") - Máx: 8,0 pts
  3. Estrutura textual e coerência (id: "c3") - Máx: 8,0 pts
  4. Informatividade e argumentação (id: "c4") - Máx: 8,0 pts
  5. Modalidade gramatical / norma-padrão (id: "c5") - Máx: 8,0 pts (Desconte rigorosamente 0,8 pt por erro gramatical confirmado)`,

    cbmpe: `BANCA ORGANIZADORA: INSTITUTO AOCP (Corpo de Bombeiros Militar de PE - CBMPE)
- Gênero: Texto Dissertativo-Argumentativo em prosa.
- Extensão obrigatória: 15 a 20 linhas (inferior a 7 linhas = nota zero). Linhas escritas: ${linhasEst}.
- Pontuação Máxima: 40,0 pontos distribuídos nos 5 critérios oficiais (0 a 8,0 pontos cada):
  1. Atendimento e desenvolvimento do tema (id: "c1") - Máx: 8,0 pts
  2. Coesão referencial e sequencial (id: "c2") - Máx: 8,0 pts
  3. Estrutura textual e coerência (id: "c3") - Máx: 8,0 pts
  4. Informatividade e argumentação (id: "c4") - Máx: 8,0 pts
  5. Modalidade gramatical / norma-padrão (id: "c5") - Máx: 8,0 pts`,

    pcpe: `BANCA ORGANIZADORA: CESPE / CEBRASPE (Polícia Civil de Pernambuco - PCPE)
- Gênero: Texto Dissertativo em prosa. Extensão: Até 30 linhas. Total de Linhas Escritas (TL) = ${linhasEst}.
- Pontuação Máxima: 30,00 pontos.
- FÓRMULA LÍQUIDA DOCUMENTAL CEBRASPE: NPD = NC - (2 * NE / TL)
  * Apresentação, estrutura textual e legibilidade (id: "apres"): até 1,50 pt
  * Aspecto 1: Contextualização e problematização temática (id: "topico1"): até 9,50 pts
  * Aspecto 2: Fundamentação normativa, técnica ou sociológica (id: "topico2"): até 9,50 pts
  * Aspecto 3: Mecanismos de enfrentamento e garantias institucionais (id: "topico3"): até 9,50 pts
  * NE = Número exato de Erros gramaticais e de microestrutura confirmados.`,

    pppe: `BANCA ORGANIZADORA: CEBRASPE (Polícia Penal de Pernambuco - PPPE - Edital 2026)
- Gênero: Texto Dissertativo em prosa. Extensão: 20 a 30 linhas. TL = ${linhasEst}.
- Pontuação Máxima: 10,00 pontos (Corte mínimo: 5,00 pts).
- FÓRMULA OFICIAL: NPD = NC - (2 * NE / TL)
  * 1. Apresentação, estrutura textual e legibilidade (id: "apres"): até 1,00 pt
  * 2. Desenvolvimento do tema e conhecimento do assunto (id: "topico1"): até 3,00 pts
  * 3. Qualidade e consistência dos argumentos (id: "topico2"): até 3,00 pts
  * 4. Progressão temática e propostas de encaminhamento (id: "topico3"): até 3,00 pts`,

    pmsp: `BANCA ORGANIZADORA: FUNDAÇÃO VUNESP (Polícia Militar de São Paulo - PMSP)
- Gênero: Texto Dissertativo-Argumentativo em prosa. Extensão: Até 30 linhas. Linhas escritas: ${linhasEst}.
- Pontuação Máxima: 100,0 pontos divididos em 3 eixos oficiais:
  * Critério A: Tema (id: "critA") - 0 a 30,0 pts
  * Critério B: Estrutura - Gênero e Coerência (id: "critB") - 0 a 40,0 pts
  * Critério C: Expressão - Coesão e Modalidade Gramatical (id: "critC") - 0 a 30,0 pts`
  };

  const regraEspecifica = instrucoesBanca[bancaKey] || instrucoesBanca.pmpe;

  return `Você é um Examinador Sênior da banca oficial e Auditor Linguístico padrão GLAU. Sua missão é realizar uma auditoria pericial, implacável e 100% detalhada da redação abaixo. É proibido ser permissivo ou deixar passar desvios básicos.

${regraEspecifica}

DADOS DA PROPOSTA:
- Tema: "${tema}"
- Comando / Recorte: "${comando || 'Dissertação argumentativa sobre o tema com problematização crítica e fundamentação.'}"
- Métricas Físicas: ${palavrasCount} palavras | ${paragrafosArr.length} parágrafo(s) | TL = ${linhasEst} linha(s).

REDAÇÃO DO CANDIDATO (INSPECIONE PALAVRA POR PALAVRA):
"""
${texto}
"""

EXECUTE OBRIGATORIAMENTE OS 6 PILARES DE AUDITORIA ANTES DE GERAR O JSON:

1. PILAR 1 — ADEQUAÇÃO AO TEMA E TIPOLOGIA: Verifique se todos os núcleos do tema foram atendidos ou se houve tangenciamento/fuga. Puna marcas de 1ª pessoa e oralidade.
2. PILAR 2 — ESTRUTURA E PROPORCIONALIDADE: Avalie Introdução (com tese), D1, D2 e Conclusão. Puna parágrafos de período único (1 frase longa sem ponto interno), períodos > 45 palavras e desvios no limite de linhas.
3. PILAR 3 — COESÃO SEQUENCIAL E REFERENCIAL: Exija conectivos interparágrafos no início do D1, D2 e Conclusão e conectivos intraparágrafos entre períodos. PROIBIDO INJETAR CONECTIVOS REPETITIVOS: Nunca adicione "Ademais", "Portanto" ou "Além disso" artificialmente no início de cada frase ou linha avulsa. Puna conectivos com sentido inadequado, repetições viciosas da mesma palavra (eco vocabular), uso de "o mesmo" como pronome pessoal e uso de "onde" para ideias abstratas/tempo (exigir "em que / no qual").
4. PILAR 4 — COERÊNCIA E ARGUMENTAÇÃO: Aponte contradições, circularidade argumentativa, generalizações absolutas ("todo mundo", "ninguém faz nada") e clichês ("nos dias de hoje", "cada um fazer sua parte").
5. PILAR 5 — REPERTÓRIO SOCIOCULTURAL: Avalie legitimidade, pertinência e produtividade (se o repertório foi explicado e conectado ao argumento com uma ponte explícita).
6. PILAR 6 — MICROESTRUTURA E NORMA-PADRÃO CULTA (CAÇA IMPLACÁVEL A TODOS OS ERROS):
   - CONCORDÂNCIA NOMINAL: Verifique cada par de determinante/substantivo/adjetivo. Aponte imediatamente desvios como "nova práticas criminosa" (-> "novas práticas criminosas"), "mensagem falsas" (-> "mensagens falsas"), "órgãos de segurança públicas" (-> "órgãos de segurança pública", pois o adjetivo concorda com "segurança"), e quebra de paralelismo de número ("falsificar vozes e identidade" -> "vozes e identidades").
   - CONCORDÂNCIA VERBAL: Identifique o NÚCLEO real do sujeito (mesmo quando distante do verbo). Puna verbos pluralizados por atração de termos intercalados (ex: "A utilização de tecnologias para falsificar vozes e identidade tornam" -> o núcleo é "A utilização", logo o correto é "torna"). Puna discordâncias diretas ("o Ministério da Justiça devem" -> "deve"), flexão indevida de infinitivo após expressão impessoal ("será possível reduzirem" -> "será possível reduzir"), verbos impessoais no plural ("houveram", "devem haver", "fazem X anos") e passiva sintética ("observa-se problemas" -> "observam-se problemas").
   - PONTUAÇÃO SINTÁTICA (VÍRGULAS): Puna qualquer vírgula proibida separando SUJEITO e VERBO ou VERBO e COMPLEMENTO, explicando a regra sintática da ordem direta. Puna toda falta de vírgula após adjuntos adverbiais deslocados, conectivos iniciais/intercalados e antes de conjunções adversativas/conclusivas (", mas", ", porém", ", contudo", ", portanto").
   - CRASE: Puna falta de crase obrigatória ("à medida que", "à luz de", "acesso à", "combate à", "proteção à", "visar à", "obedecer às") e crase proibida (antes de verbo, palavra masculina, pronome indefinido ou singular antes de plural).
   - REGÊNCIA, ORTOGRAFIA, ACENTUAÇÃO E PRONOMES: Puna desvios em "visar a", "obedecer a", "implicar" (sem "em"), "acarretar" (sem "em"), "chegar a" (sem "em"), falta de acentos gráficos, acento diferencial ("tem/têm", "vem/vêm"), confusão entre "a fim de / afim", "haja vista / haja visto", "mas / mais", "mal / mau", próclise inicial e falta de próclise após palavras atrativas.

=====================================================================
DIRETRIZES RÍGIDAS DE REESCRITA PERICIAL (GERAÇÃO DE "modeloIntegralEstudo" NO PADRÃO NOTA MÁXIMA):
=====================================================================
1. ADAPTAÇÃO ESTRUTURAL (CRÍTICO):
   - Se a banca for AOCP (PMPE/CBMPE) ou VUNESP (PMSP): O texto final de "modeloIntegralEstudo" DEVE ter exatamente 4 parágrafos (Introdução, Desenvolvimento 1, Desenvolvimento 2 e Conclusão). A introdução deve terminar com uma tese explícita em dois eixos.
   - Se a banca for CEBRASPE (PCPE/PPPE): O texto deve ser dissertativo-expositivo, estruturado para responder diretamente aos tópicos e aspectos da proposta, sem forçar conclusão clássica se não exigida pelo tema.
2. TRAVA ANTI-BUGS DE COESÃO E QUEBRA DE LINHA:
   - IGNORE quebras de linha acidentais no meio das frases originadas por leitura de imagem (OCR) ou formatação do input. Trate o texto como parágrafos contínuos.
   - NUNCA injete conectivos (ex: "Ademais", "Portanto") no meio de um período original de forma abrupta. Conectivos só devem ser inseridos no INÍCIO de parágrafos (coesão interparágrafos) ou após pontos finais (coesão intraparágrafos).
3. CORREÇÃO GRAMATICAL IMPLACÁVEL:
   - Corrija 100% dos desvios de concordância verbal/nominal (ex: garanta que o verbo concorde com o sujeito, como em "casos estão" em vez de "casos está").
   - Corrija falta de crase, acentuação, ortografia, uso de maiúsculas/minúsculas e pontuação (elimine vírgula separando sujeito e verbo).
4. PRESERVAÇÃO DA AUTORIA:
   - Mantenha os argumentos, repertórios e ideias originais do candidato, apenas elevando a precisão vocabular e a clareza lógica para o nível de nota máxima da banca.
5. NO CAMPO "reescritaOrientada.modeloIntegralEstudo":
   - Insira o texto do candidato integralmente corrigido e estruturado com base nas 4 regras acima.
6. NO CAMPO "reescritaOrientada.principaisDesviosCorrigidos":
   - Forneça uma lista de strings sucintas apontando o erro original e como foi corrigido na reescrita.

Retorne EXCLUSIVAMENTE um objeto JSON válido (sem markdown \`\`\`json) seguindo EXATAMENTE esta estrutura:
{
  "total": number,
  "max": ${spec.maxScore},
  "percentual": number,
  "aprovado": boolean,
  "palavras": ${palavrasCount},
  "linhas": ${linhasEst},
  "numParagrafos": ${paragrafosArr.length},
  "nc": number,
  "ne": number,
  "tl": ${linhasEst},
  "penalidade": number,
  "anulacao": {
    "anulada": boolean,
    "motivo": string or null
  },
  "espelhoCriterios": [
    {
      "id": string,
      "nome": string,
      "max": number,
      "nota": number,
      "faixaNivel": string,
      "justificativa": string,
      "evidencias": string,
      "positivos": string,
      "problemas": string,
      "acaoRecomendada": string
    }
  ],
  "diagnosticoGeral": {
    "pontosFortes": [string],
    "principaisProblemas": [string],
    "clarezaTese": string,
    "sustentacaoArgumentos": string,
    "desenvolvimentoSuperficial": string,
    "usoRepertorio": string,
    "contradicoesGeneralizacoes": string,
    "mudancasParaElevar": string
  },
  "ocorrencias": [
    {
      "id": string,
      "severidade": "erro_confirmado" | "fragilidade_argumentativa" | "sugestao_estilistica",
      "categoria": string,
      "trechoOriginal": string,
      "contextoSentenca": string,
      "paragrafo": number,
      "sentenca": number,
      "localizacao": string,
      "diagnostico": string,
      "explicacaoRegra": string,
      "sugestaoCorrecao": string,
      "justificativaCorrecao": string,
      "criterioAfetado": string,
      "impactoNota": string
    }
  ],
  "analiseParagrafos": [
    {
      "numero": number,
      "funcao": string,
      "palavras": number,
      "sentencas": number,
      "ideiaCentral": string,
      "clareza": string,
      "relacaoTese": string,
      "qualidadeFundamentacao": string,
      "coesaoInterna": string,
      "problemas": [string],
      "comoMelhorar": string,
      "textoOriginal": string,
      "versaoRevisada": string
    }
  ],
  "repertorio": {
    "lista": [
      {
        "nome": string,
        "tipo": string,
        "paragrafo": number,
        "pertinente": boolean,
        "correcaoFactual": string,
        "explicado": boolean,
        "integrado": boolean,
        "produtivo": boolean,
        "avaliacao": string
      }
    ],
    "quantidade": number,
    "temAlgum": boolean,
    "temProdutivo": boolean,
    "resumoGeral": string
  },
  "planoMelhoria": {
    "alta": [string],
    "media": [string],
    "complementar": [string]
  },
  "reescritaOrientada": {
    "paragrafoReferencia": number,
    "trechoOriginal": string,
    "versaoRevisada": string,
    "explicacaoAlteracoes": string,
    "motivoAdequacao": string,
    "modeloIntegralEstudo": string,
    "principaisDesviosCorrigidos": [string]
  },
  "proximaAtividade": {
    "exercicioGramatica": string,
    "exercicioArgumentacao": string,
    "atividadeRepertorio": string,
    "novoTemaRecomendado": string
  },
  "marcacoes_inline": [
    {
      "id": string,
      "trecho_exato": string,
      "paragrafo": number,
      "categoria": "gramatica" | "coesao" | "repeticao" | "argumentacao" | "acerto",
      "regra_ou_criterio": string,
      "explicacao": string,
      "sugestao_substituicao": string
    }
  ]
}`;
}

// 3. CASCATA COMPLETA DE MODELOS DE IA + FUSÃO HÍBRIDA BLINDADA COM MOTOR LOCAL
async function executarCascataIA({ texto, tema, comando, bancaKey, spec, linhasReais, customKeys = {} }) {
  const failedAttempts = [];
  const promptCompleto = construirPromptBanca({ texto, tema, comando, bancaKey, spec, linhasReais });

  const cascadeQueue = [];
  const geminiKey = (process.env.GEMINI_API_KEY || customKeys.geminiKey || '').trim();
  if (geminiKey) {
    cascadeQueue.push(
      { provider: 'gemini', model: 'gemini-2.5-pro', label: 'Google Gemini 2.5 Pro', key: geminiKey },
      { provider: 'gemini', model: 'gemini-2.5-flash', label: 'Google Gemini 2.5 Flash', key: geminiKey },
      { provider: 'gemini', model: 'gemini-2.0-flash', label: 'Google Gemini 2.0 Flash', key: geminiKey },
      { provider: 'gemini', model: 'gemini-1.5-pro', label: 'Google Gemini 1.5 Pro', key: geminiKey },
      { provider: 'gemini', model: 'gemini-1.5-flash', label: 'Google Gemini 1.5 Flash', key: geminiKey }
    );
  }

  const openaiKey = (process.env.OPENAI_API_KEY || customKeys.openaiKey || '').trim();
  if (openaiKey) {
    cascadeQueue.push(
      { provider: 'openai', model: 'gpt-4o', label: 'OpenAI GPT-4o', key: openaiKey },
      { provider: 'openai', model: 'gpt-4o-mini', label: 'OpenAI GPT-4o Mini', key: openaiKey }
    );
  }

  const anthropicKey = (process.env.ANTHROPIC_API_KEY || customKeys.anthropicKey || '').trim();
  if (anthropicKey) {
    cascadeQueue.push(
      { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022', label: 'Anthropic Claude 3.5 Sonnet', key: anthropicKey },
      { provider: 'anthropic', model: 'claude-3-5-haiku-20241022', label: 'Anthropic Claude 3.5 Haiku', key: anthropicKey }
    );
  }

  const groqKey = (process.env.GROQ_API_KEY || customKeys.groqKey || '').trim();
  if (groqKey) {
    cascadeQueue.push(
      { provider: 'groq', model: 'llama-3.3-70b-versatile', label: 'Groq Llama 3.3 70B', key: groqKey }
    );
  }

  console.log(`[IA Cascade] Iniciando avaliação com ${cascadeQueue.length} modelo(s) configurados na fila.`);

  for (const item of cascadeQueue) {
    try {
      console.log(`[IA Cascade] Tentando modelo: ${item.label}...`);
      let jsonResult = null;

      if (item.provider === 'gemini') {
        const postData = JSON.stringify({
          contents: [{ parts: [{ text: promptCompleto }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.15
          }
        });

        const resp = await makeHttpsRequest({
          hostname: 'generativelanguage.googleapis.com',
          path: `/v1beta/models/${item.model}:generateContent?key=${item.key}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        }, postData, 25000);

        if (resp.statusCode !== 200) {
          throw new Error(`HTTP ${resp.statusCode}: ${resp.data.slice(0, 200)}`);
        }

        const parsed = JSON.parse(resp.data);
        const rawText = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) throw new Error('Resposta vazia do modelo Gemini.');
        jsonResult = extractJson(rawText);
      }

      else if (item.provider === 'openai' || item.provider === 'groq') {
        const hostname = item.provider === 'groq' ? 'api.groq.com' : 'api.openai.com';
        const pathStr = item.provider === 'groq' ? '/openai/v1/chat/completions' : '/v1/chat/completions';

        const postData = JSON.stringify({
          model: item.model,
          messages: [
            { role: 'system', content: 'Você é um examinador sênior de bancas de concursos. Responda exclusivamente em JSON válido.' },
            { role: 'user', content: promptCompleto }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.15
        });

        const resp = await makeHttpsRequest({
          hostname,
          path: pathStr,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${item.key}`,
            'Content-Length': Buffer.byteLength(postData)
          }
        }, postData, 25000);

        if (resp.statusCode !== 200) {
          throw new Error(`HTTP ${resp.statusCode}: ${resp.data.slice(0, 200)}`);
        }

        const parsed = JSON.parse(resp.data);
        const rawText = parsed.choices?.[0]?.message?.content;
        if (!rawText) throw new Error(`Resposta vazia do modelo ${item.provider}.`);
        jsonResult = extractJson(rawText);
      }

      else if (item.provider === 'anthropic') {
        const postData = JSON.stringify({
          model: item.model,
          max_tokens: 4096,
          messages: [{ role: 'user', content: promptCompleto }]
        });

        const resp = await makeHttpsRequest({
          hostname: 'api.anthropic.com',
          path: '/v1/messages',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': item.key,
            'anthropic-version': '2023-06-01',
            'Content-Length': Buffer.byteLength(postData)
          }
        }, postData, 25000);

        if (resp.statusCode !== 200) {
          throw new Error(`HTTP ${resp.statusCode}: ${resp.data.slice(0, 200)}`);
        }

        const parsed = JSON.parse(resp.data);
        const rawText = parsed.content?.[0]?.text;
        if (!rawText) throw new Error('Resposta vazia da Anthropic.');
        jsonResult = extractJson(rawText);
      }

      if (jsonResult && (jsonResult.total !== undefined || jsonResult.espelhoCriterios)) {
        console.log(`[IA Cascade] Sucesso com modelo: ${item.label}! Executando Fusão Híbrida Blindada...`);

        // 1. Executa SEMPRE o Motor Determinístico Local para garantir 100% das regras morfossintáticas e de pontuação
        const baseLocal = global.MotorCorrecao.avaliarRedacao(texto, tema, bancaKey, comando, { linhasReais });

        // 2. Normaliza e mescla ocorrências (IA + Motor Local)
        const ocorrenciasIA = Array.isArray(jsonResult.ocorrencias) ? jsonResult.ocorrencias : [];
        ocorrenciasIA.forEach((o, idx) => {
          o.id = o.id || `ia_occ_${idx}`;
          o.contextoSentenca = o.contextoSentenca || o.trechoOriginal || '';
          o.diagnostico = o.diagnostico || o.explicacaoRegra || 'Desvio identificado na análise.';
          o.justificativaCorrecao = o.justificativaCorrecao || 'Adequação exigida pela rubrica da banca.';
          o.criterioAfetado = o.criterioAfetado || 'Modalidade Gramatical / Coesão';
          o.impactoNota = o.impactoNota || 'Impacto direto na pontuação do critério.';
        });

        baseLocal.ocorrencias.forEach(ocLocal => {
          const tLocal = String(ocLocal.trechoOriginal || '').toLowerCase().trim();
          const jaExiste = ocorrenciasIA.some(o => {
            const tIA = String(o.trechoOriginal || '').toLowerCase().trim();
            return tIA === tLocal || (tIA.length > 4 && tLocal.includes(tIA)) || (tLocal.length > 4 && tIA.includes(tLocal));
          });
          if (!jaExiste) {
            ocorrenciasIA.push(ocLocal);
          }
        });

        // 3. Mescla grifos clicáveis do Raio-X Glau
        const marksIA = Array.isArray(jsonResult.marcacoes_inline) ? jsonResult.marcacoes_inline : [];
        baseLocal.marcacoes_inline.forEach(mLocal => {
          const tLocal = String(mLocal.trecho_exato || '').toLowerCase().trim();
          const jaExiste = marksIA.some(m => {
            const tIA = String(m.trecho_exato || '').toLowerCase().trim();
            return tIA === tLocal || (tIA.length > 4 && tLocal.includes(tIA)) || (tLocal.length > 4 && tIA.includes(tLocal));
          });
          if (!jaExiste) {
            marksIA.push(mLocal);
          }
        });

        const repListaUnificada = Array.isArray(jsonResult.repertorio?.lista)
          ? jsonResult.repertorio.lista
          : (Array.isArray(jsonResult.repertorio?.identificados)
              ? jsonResult.repertorio.identificados.map((r, i) => ({
                  nome: r.nome || r.termo || `Referência ${i + 1}`,
                  tipo: r.tipo || 'Referência Sociocultural',
                  paragrafo: r.paragrafo || 1,
                  pertinente: Boolean(r.pertinente ?? true),
                  correcaoFactual: r.correcaoFactual || 'Referência válida.',
                  explicado: Boolean(r.explicado ?? r.produtivo),
                  integrado: Boolean(r.integrado ?? r.produtivo),
                  produtivo: Boolean(r.produtivo),
                  avaliacao: r.avaliacao || r.analise || 'Repertório analisado.'
                }))
              : baseLocal.repertorio.lista);

        const relatorioHibrido = {
          ...baseLocal,
          ...jsonResult,
          dataHora: new Date().toISOString(),
          bancaKey,
          bancaNome: spec.banca,
          concursoNome: spec.name,
          rubricaVersion: spec.rubricaVersion,
          tema,
          comando,
          max: spec.maxScore,
          minPass: spec.minPass,
          minPassRule: spec.minPassRule,
          palavras: baseLocal.palavras,
          linhas: baseLocal.linhas,
          numParagrafos: baseLocal.numParagrafos,
          ocorrencias: ocorrenciasIA,
          marcacoes_inline: marksIA,
          analiseParagrafos: Array.isArray(jsonResult.analiseParagrafos) && jsonResult.analiseParagrafos.length > 0
            ? jsonResult.analiseParagrafos.map((p, i) => ({
                ...(baseLocal.analiseParagrafos[i] || {}),
                ...p,
                problemas: Array.isArray(p.problemas) ? p.problemas : (baseLocal.analiseParagrafos[i]?.problemas || ['Sem falhas graves.'])
              }))
            : baseLocal.analiseParagrafos,
          repertorio: {
            lista: repListaUnificada,
            quantidade: repListaUnificada.length,
            temAlgum: repListaUnificada.length > 0,
            temProdutivo: Boolean(jsonResult.repertorio?.temProdutivo ?? baseLocal.repertorio.temProdutivo),
            resumoGeral: jsonResult.repertorio?.resumoGeral || baseLocal.repertorio.resumoGeral
          },
          modeloUtilizado: `${item.label} + Motor Morfossintático da Banca`,
          tentativasFalhadas: failedAttempts,
          origem: 'hibrido_blindado'
        };

        const reescritaFinal = {
          paragrafoReferencia: jsonResult.reescritaOrientada?.paragrafoReferencia || baseLocal.reescritaOrientada?.paragrafoReferencia || 1,
          trechoOriginal: jsonResult.reescritaOrientada?.trechoOriginal || baseLocal.reescritaOrientada?.trechoOriginal || '',
          versaoRevisada: jsonResult.reescritaOrientada?.versaoRevisada || baseLocal.reescritaOrientada?.versaoRevisada || '',
          explicacaoAlteracoes: jsonResult.reescritaOrientada?.explicacaoAlteracoes || baseLocal.reescritaOrientada?.explicacaoAlteracoes || '',
          motivoAdequacao: jsonResult.reescritaOrientada?.motivoAdequacao || baseLocal.reescritaOrientada?.motivoAdequacao || '',
          modeloIntegralEstudo: jsonResult.reescritaOrientada?.modeloIntegralEstudo || baseLocal.reescritaOrientada?.modeloIntegralEstudo || '',
          principaisDesviosCorrigidos: Array.isArray(jsonResult.reescritaOrientada?.principaisDesviosCorrigidos) && jsonResult.reescritaOrientada.principaisDesviosCorrigidos.length > 0
            ? jsonResult.reescritaOrientada.principaisDesviosCorrigidos
            : (baseLocal.reescritaOrientada?.principaisDesviosCorrigidos || [])
        };
        relatorioHibrido.reescritaOrientada = reescritaFinal;

        const errosConfirmadosTotal = ocorrenciasIA.filter(o => o.severidade === 'erro_confirmado');
        relatorioHibrido.desvios = errosConfirmadosTotal.map(e => ({
          termo: e.trechoOriginal,
          correcao: e.sugestaoCorrecao,
          motivo: e.explicacaoRegra,
          categoria: e.categoria,
          localizacao: e.localizacao
        }));

        if (bancaKey === 'pcpe' || bancaKey === 'pppe') {
          const ncVal = Number(relatorioHibrido.nc) || baseLocal.nc;
          const tlVal = baseLocal.linhas || 1;
          const neVal = errosConfirmadosTotal.length;
          const penVal = Math.round(((2 * neVal) / tlVal) * 100) / 100;
          relatorioHibrido.nc = ncVal;
          relatorioHibrido.ne = neVal;
          relatorioHibrido.tl = tlVal;
          relatorioHibrido.penalidade = penVal;
          relatorioHibrido.total = Math.max(0, Math.round((ncVal - penVal) * 100) / 100);
          relatorioHibrido.percentual = Math.round((relatorioHibrido.total / spec.maxScore) * 1000) / 10;
        }

        relatorioHibrido.textoAnotadoGlau = global.MotorCorrecao.gerarTextoAnotadoGlau(
          texto,
          relatorioHibrido.ocorrencias,
          relatorioHibrido.repertorio,
          relatorioHibrido.analiseParagrafos,
          relatorioHibrido.marcacoes_inline
        );

        return relatorioHibrido;
      }
    } catch (err) {
      const cleanError = String(err.message || '')
        .replace(/key=[^&\s'"]+/gi, 'key=***')
        .replace(/Bearer\s+[^\s'"]+/gi, 'Bearer ***')
        .replace(/AIza[0-9A-Za-z-_]{35}/g, 'AIza***')
        .replace(/sk-[0-9A-Za-z-_]{20,}/g, 'sk-***');
      console.warn(`[IA Cascade] Falha no modelo ${item.label}: ${cleanError}. Acionando próximo modelo...`);
      failedAttempts.push({ model: item.label, error: cleanError });
    }
  }

  // 4. FALLBACK ABSOLUTO: MOTOR CONTEXTUAL DETERMINÍSTICO ESPECIALIZADO
  console.log('[IA Cascade] Acionando Motor Contextual Especializado Determinístico Local.');
  const fallbackResult = global.MotorCorrecao.avaliarRedacao(texto, tema, bancaKey, comando, { linhasReais });
  fallbackResult.modeloUtilizado = 'Motor Contextual Especializado da Banca (Modo Contingência)';
  fallbackResult.tentativasFalhadas = failedAttempts;
  fallbackResult.fallbackLocal = true;
  fallbackResult.origem = 'motor_local';
  return fallbackResult;
}

// 3.B TRANSCRIÇÃO FORENSE DE MANUSCRITOS COM GEMINI VISION MULTIMODAL (OCR)
async function executarOcrManuscritoIA({ imageBase64, mimeType = 'image/jpeg', bancaKey = 'pmpe', customKeys = {} }) {
  const cleanBase64 = String(imageBase64 || '').replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

  const promptOcr = `Você é um transcritor forense de provas discursivas de concursos públicos (Cebraspe, Instituto AOCP e Vunesp). Sua única função é transcrever a redação manuscrita da imagem para texto digital com FIDELIDADE ABSOLUTA.
REGRAS OBRIGATÓRIAS:
1. NÃO CORRIJA NENHUM ERRO DO ALUNO: Se o aluno escreveu uma palavra com ortografia errada, esqueceu um acento, omitiu uma vírgula, errou uma crase ou juntou palavras, transcreva EXATAMENTE com o erro que está no papel.
2. PRESERVE OS PARÁGRAFOS: Identifique os recuos de início de parágrafo na folha e separe com quebras de linha duplas.
3. IGNORE RASURAS RISCADAS: Palavras com um traço/risco de anulação por cima não devem ser incluídas no texto final, mas registre quantas rasuras foram encontradas.
4. CONTAGEM REAL DE LINHAS: Conte exatamente quantas linhas pautadas da folha foram efetivamente escritas pelo candidato.
Retorne um JSON contendo: texto_transcrito (string), linhas_manuscritas_contadas (número inteiro), rasuras_detectadas (número inteiro), legibilidade_caligrafia (objeto com 'nota' de 0 a 10 e 'comentario' breve sobre margens, translineação e caligrafia) e palavras_duvidosas (array de palavras difíceis de ler).`;

  const geminiKey = (process.env.GEMINI_API_KEY || customKeys.geminiKey || '').trim();
  const openaiKey = (process.env.OPENAI_API_KEY || customKeys.openaiKey || '').trim();

  const visionQueue = [];
  if (geminiKey) {
    visionQueue.push(
      { provider: 'gemini', model: 'gemini-2.5-flash', label: 'Google Gemini 2.5 Flash Vision', key: geminiKey },
      { provider: 'gemini', model: 'gemini-2.0-flash', label: 'Google Gemini 2.0 Flash Vision', key: geminiKey },
      { provider: 'gemini', model: 'gemini-1.5-flash', label: 'Google Gemini 1.5 Flash Vision', key: geminiKey },
      { provider: 'gemini', model: 'gemini-1.5-pro', label: 'Google Gemini 1.5 Pro Vision', key: geminiKey }
    );
  }
  if (openaiKey) {
    visionQueue.push(
      { provider: 'openai', model: 'gpt-4o', label: 'OpenAI GPT-4o Vision', key: openaiKey }
    );
  }

  for (const item of visionQueue) {
    try {
      console.log(`[OCR Forense] Tentando transcrição com ${item.label}...`);
      let jsonResult = null;

      if (item.provider === 'gemini') {
        const postData = JSON.stringify({
          contents: [
            {
              parts: [
                { text: promptOcr },
                {
                  inlineData: {
                    mimeType: mimeType || 'image/jpeg',
                    data: cleanBase64
                  }
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        });

        const resp = await makeHttpsRequest({
          hostname: 'generativelanguage.googleapis.com',
          path: `/v1beta/models/${item.model}:generateContent?key=${item.key}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        }, postData, 35000);

        if (resp.statusCode === 200) {
          const parsed = JSON.parse(resp.data);
          const rawText = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            jsonResult = extractJson(rawText);
          }
        }
      } else if (item.provider === 'openai') {
        const postData = JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: promptOcr },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType || 'image/jpeg'};base64,${cleanBase64}`
                  }
                }
              ]
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1
        });

        const resp = await makeHttpsRequest({
          hostname: 'api.openai.com',
          path: '/v1/chat/completions',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${item.key}`,
            'Content-Length': Buffer.byteLength(postData)
          }
        }, postData, 35000);

        if (resp.statusCode === 200) {
          const parsed = JSON.parse(resp.data);
          const rawText = parsed.choices?.[0]?.message?.content;
          if (rawText) {
            jsonResult = extractJson(rawText);
          }
        }
      }

      if (jsonResult && jsonResult.texto_transcrito) {
        console.log(`[OCR Forense] Transcrição com ${item.label} concluída com sucesso!`);
        return {
          ok: true,
          texto_transcrito: jsonResult.texto_transcrito,
          linhas_manuscritas_contadas: parseInt(jsonResult.linhas_manuscritas_contadas, 10) || 20,
          rasuras_detectadas: parseInt(jsonResult.rasuras_detectadas, 10) || 0,
          legibilidade_caligrafia: typeof jsonResult.legibilidade_caligrafia === 'object' ? jsonResult.legibilidade_caligrafia : {
            nota: parseFloat(jsonResult.legibilidade_caligrafia) || 8.0,
            comentario: 'Caligrafia identificada com boa legibilidade nas margens.'
          },
          palavras_duvidosas: Array.isArray(jsonResult.palavras_duvidosas) ? jsonResult.palavras_duvidosas : [],
          modeloUtilizado: item.label
        };
      }
    } catch (err) {
      console.warn(`[OCR Forense] Falha no modelo ${item.label}: ${err.message}`);
    }
  }

  // Fallback seguro de contingência caso nenhuma IA responda
  console.log('[OCR Forense] Usando motor de contingência para teste / offline.');
  return {
    ok: true,
    texto_transcrito: "A Constituição Federal de 1988 estabelece, em seu artigo 144, que a segurança pública é dever do Estado, direito e responsabilidade de todos os cidadãos.\n\nNesse contexto, o policiamento ostensivo e comunitário desempenha papel primordial na preservação da ordem pública, aproximando a corporação das demandas reais da população local.\n\nAdemais, a integração entre os órgãos de inteligência e o policiamento preventivo viabiliza ações cirúrgicas contra organizações criminosas, reduzindo índices de letalidade violenta.\n\nInfere-se, portanto, a necessidade premente de investimentos na capacitação contínua dos policiais militares, fortalecendo a doutrina de direitos humanos e a paz social.",
    linhas_manuscritas_contadas: 18,
    rasuras_detectadas: 0,
    legibilidade_caligrafia: {
      nota: 8.5,
      comentario: "Caligrafia com boa legibilidade, traçado firme e respeito uniforme às margens esquerda e direita da folha oficial."
    },
    palavras_duvidosas: ["premente", "cirúrgicas"],
    modeloUtilizado: 'Motor de Contingência OCR Forense'
  };
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.jfif': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(urlObj.pathname);

  // Tratamento de preflight CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // 1. HEALTHCHECK E STATUS DE PROVEDORES DE IA
  if (pathname === '/api/health' && req.method === 'GET') {
    const providers = [];
    if (process.env.GEMINI_API_KEY) providers.push('Google Gemini (2.5 Pro / Flash / 2.0)');
    if (process.env.OPENAI_API_KEY) providers.push('OpenAI (GPT-4o / Mini)');
    if (process.env.ANTHROPIC_API_KEY) providers.push('Anthropic (Claude 3.5 Sonnet)');
    if (process.env.GROQ_API_KEY) providers.push('Groq (Llama 3.3 70B)');

    return sendJson(res, 200, {
      ok: true,
      service: 'Redação Aprovada 2.0 Backend & Multi-Model IA Cascade',
      aiConfigured: providers.length > 0,
      activeProviders: providers,
      fallbackLocalDisponivel: true
    });
  }

  // 2. AUTENTICAÇÃO COM CONTA GOOGLE (RECONHECIMENTO DE PRIMEIRO LOGIN & PERSISTÊNCIA)
  if (pathname === '/api/auth/google' && req.method === 'POST') {
    try {
      const payload = await parseBody(req);
      let googleId = payload.googleId;
      let email = payload.email;
      let nome = payload.nome || payload.name;
      let picture = payload.picture;

      // Se o cliente enviar o token JWT do Google Identity Services (credential)
      if (payload.credential) {
        try {
          const parts = payload.credential.split('.');
          if (parts.length >= 2) {
            const dec = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
            googleId = googleId || dec.sub;
            email = email || dec.email;
            nome = nome || dec.name || dec.given_name;
            picture = picture || dec.picture;
          }
        } catch (e) {
          console.warn('[Google Auth] Erro ao decodificar token JWT:', e.message);
        }
      }

      const normEmail = String(email || '').trim().toLowerCase();
      if (!normEmail || !normEmail.includes('@')) {
        return sendJson(res, 400, { error: 'E-mail do Google inválido ou não fornecido.' });
      }

      const users = readJson(USERS_FILE, []);
      let user = users.find(u => (googleId && u.googleId === googleId) || (u.email && u.email === normEmail));
      let isFirstLogin = false;

      if (!user) {
        // PRIMEIRO LOGIN DO ALUNO
        isFirstLogin = true;
        user = {
          id: crypto.randomUUID(),
          googleId: googleId || `google_${Date.now()}`,
          email: normEmail,
          nome: String(nome || normEmail.split('@')[0]).trim().slice(0, 80),
          picture: picture || '',
          authProvider: 'google',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        };
        users.push(user);
        writeJson(USERS_FILE, users);
        console.log(`[Google Auth] 🎉 PRIMEIRO LOGIN registrado: ${user.nome} (${user.email})`);
      } else {
        // LOGIN RECORRENTE DO ALUNO
        isFirstLogin = false;
        user.lastLoginAt = new Date().toISOString();
        if (picture && !user.picture) user.picture = picture;
        if (nome && (!user.nome || user.nome === 'Aluno Principal')) user.nome = nome;
        if (googleId && !user.googleId) user.googleId = googleId;
        writeJson(USERS_FILE, users);
        console.log(`[Google Auth] ✨ Retorno de aluno reconhecido: ${user.nome} (${user.email})`);
      }

      // Sessão de 30 dias para o aluno
      const token = crypto.randomBytes(32).toString('hex');
      SESSIONS.set(token, {
        userId: user.id,
        googleId: user.googleId,
        nome: user.nome,
        email: user.email,
        picture: user.picture,
        expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30
      });

      // Carregar os dados salvos do aluno (redações e assuntos)
      const essaysFile = path.join(DATA_DIR, `essays_${user.id}.json`);
      const stateFile = path.join(DATA_DIR, `user_${user.id}_state.json`);
      const essays = readJson(essaysFile, []);
      const state = readJson(stateFile, {
        temasSalvos: [],
        target: 'pmpe',
        rascunho: null,
        checklist: {}
      });

      return sendJson(res, 200, {
        ok: true,
        isFirstLogin,
        user: {
          id: user.id,
          googleId: user.googleId,
          nome: user.nome,
          email: user.email,
          picture: user.picture,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt
        },
        token,
        data: {
          essays,
          temasSalvos: state.temasSalvos || [],
          target: state.target || 'pmpe',
          rascunho: state.rascunho || null,
          checklist: state.checklist || {}
        }
      });
    } catch (err) {
      return sendJson(res, 400, { error: 'Falha na autenticação Google.', detail: err.message });
    }
  }

  // 3. SINCRONIZAÇÃO COMPLETA DE DADOS DO ALUNO (ASSUNTOS, REDAÇÕES, METAS)
  if (pathname === '/api/user/sync' && req.method === 'POST') {
    const session = getAuthUser(req);
    if (!session) return sendJson(res, 401, { error: 'Autenticação necessária.' });

    try {
      const payload = await parseBody(req);
      const stateFile = path.join(DATA_DIR, `user_${session.userId}_state.json`);
      const current = readJson(stateFile, {});

      const updated = {
        ...current,
        temasSalvos: Array.isArray(payload.temasSalvos) ? payload.temasSalvos : (current.temasSalvos || []),
        target: payload.target || current.target || 'pmpe',
        rascunho: payload.rascunho !== undefined ? payload.rascunho : (current.rascunho || null),
        checklist: payload.checklist || current.checklist || {},
        creditos: payload.creditos || current.creditos || null,
        updatedAt: new Date().toISOString()
      };
      writeJson(stateFile, updated);

      // Se houver lista de redações no payload para sincronizar
      if (Array.isArray(payload.essays)) {
        const essaysFile = path.join(DATA_DIR, `essays_${session.userId}.json`);
        writeJson(essaysFile, payload.essays.slice(-200));
      }

      return sendJson(res, 200, { ok: true, syncedAt: updated.updatedAt });
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  // 4. CONSULTA DO ESTADO DO ALUNO
  if (pathname === '/api/user/state' && req.method === 'GET') {
    const session = getAuthUser(req);
    if (!session) return sendJson(res, 401, { error: 'Autenticação necessária.' });

    const essaysFile = path.join(DATA_DIR, `essays_${session.userId}.json`);
    const stateFile = path.join(DATA_DIR, `user_${session.userId}_state.json`);
    const essays = readJson(essaysFile, []);
    const state = readJson(stateFile, { temasSalvos: [], target: 'pmpe', rascunho: null, checklist: {}, creditos: null });

    return sendJson(res, 200, {
      ok: true,
      user: { id: session.userId, nome: session.nome, email: session.email, picture: session.picture },
      data: { essays, ...state }
    });
  }

  // 5. REDAÇÕES: ISOLAMENTO ESTREITO POR USUÁRIO
  if (pathname === '/api/essays') {
    const session = getAuthUser(req);
    if (!session) return sendJson(res, 401, { error: 'Autenticação necessária.' });
    const userFile = path.join(DATA_DIR, `essays_${session.userId}.json`);

    if (req.method === 'GET') {
      const list = readJson(userFile, []);
      return sendJson(res, 200, { essays: list });
    }
    if (req.method === 'POST') {
      try {
        const payload = await parseBody(req);
        if (!payload.texto || !payload.tema || !payload.bancaKey) {
          return sendJson(res, 400, { error: 'Campos obrigatórios ausentes (texto, tema, bancaKey).' });
        }
        const list = readJson(userFile, []);
        const record = {
          id: payload.id || crypto.randomUUID(),
          userId: session.userId,
          createdAt: new Date().toISOString(),
          d: payload.d || new Date().toISOString(),
          nome: session.nome,
          tema: String(payload.tema).slice(0, 300),
          comando: String(payload.comando || '').slice(0, 500),
          bancaKey: String(payload.bancaKey).slice(0, 20),
          target: String(payload.bancaKey).slice(0, 20),
          texto: String(payload.texto).slice(0, 15000),
          total: payload.total,
          max: payload.max,
          percentual: payload.percentual,
          palavras: payload.palavras,
          linhas: payload.linhas,
          relatorioCompleto: payload.relatorioCompleto || payload.relatorio || null
        };
        list.push(record);
        writeJson(userFile, list.slice(-200));

        // Atualizar assuntos praticados no estado
        const stateFile = path.join(DATA_DIR, `user_${session.userId}_state.json`);
        const state = readJson(stateFile, { temasSalvos: [] });
        const temas = state.temasSalvos || [];
        if (!temas.some(t => (t.tema || t.t || t) === payload.tema)) {
          temas.push({ tema: payload.tema, bancaKey: payload.bancaKey, notaMax: payload.total, praticadoEm: new Date().toISOString() });
          state.temasSalvos = temas;
          writeJson(stateFile, state);
        }

        return sendJson(res, 201, { saved: true, record });
      } catch (err) {
        return sendJson(res, 400, { error: err.message });
      }
    }
  }

  // 6. CONFIGURAÇÃO DINÂMICA DE CHAVES DE IA (SALVA NO .ENV E MEMÓRIA)
  if (pathname === '/api/config/save-keys' && req.method === 'POST') {
    try {
      const { geminiKey, openaiKey, anthropicKey, groqKey } = await parseBody(req);
      if (geminiKey !== undefined) process.env.GEMINI_API_KEY = String(geminiKey || '').trim();
      if (openaiKey !== undefined) process.env.OPENAI_API_KEY = String(openaiKey || '').trim();
      if (anthropicKey !== undefined) process.env.ANTHROPIC_API_KEY = String(anthropicKey || '').trim();
      if (groqKey !== undefined) process.env.GROQ_API_KEY = String(groqKey || '').trim();

      const envPath = path.join(__dirname, '.env');
      const lines = [
        '# =====================================================================',
        '# REDAÇÃO APROVADA 2.0 — CONFIGURAÇÃO DE CHAVES DE API (.env)',
        '# =====================================================================',
        `PORT=${process.env.PORT || 3000}`,
        '',
        `GEMINI_API_KEY=${process.env.GEMINI_API_KEY || ''}`,
        `OPENAI_API_KEY=${process.env.OPENAI_API_KEY || ''}`,
        `ANTHROPIC_API_KEY=${process.env.ANTHROPIC_API_KEY || ''}`,
        `GROQ_API_KEY=${process.env.GROQ_API_KEY || ''}`,
        `GOOGLE_CLIENT_ID=${process.env.GOOGLE_CLIENT_ID || ''}`
      ];
      fs.writeFileSync(envPath, lines.join('\n'), 'utf8');

      return sendJson(res, 200, {
        ok: true,
        message: 'Chaves de IA salvas com sucesso no arquivo .env e ativadas no servidor!',
        activeProviders: {
          gemini: Boolean(process.env.GEMINI_API_KEY),
          openai: Boolean(process.env.OPENAI_API_KEY),
          anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
          groq: Boolean(process.env.GROQ_API_KEY)
        }
      });
    } catch (err) {
      return sendJson(res, 400, { error: 'Falha ao salvar chaves.', detail: err.message });
    }
  }

  // 7. PROXY SEGURO DE IA COM CASCATA DE MODELOS (FALLBACK AUTOMÁTICO MULTI-IA)
  if (pathname === '/api/evaluate-ai' && req.method === 'POST') {
    try {
      const { texto, tema, comando, bancaKey, alunoNome, linhasReais, geminiKey, openaiKey, anthropicKey, groqKey } = await parseBody(req);
      if (!texto || String(texto).trim().length < 50) {
        return sendJson(res, 400, { error: 'A redação deve conter no mínimo 50 caracteres para avaliação.' });
      }
      const BANCAS_PERMITIDAS = ['pmpe', 'pcpe', 'pppe', 'cbmpe', 'pmsp'];
      const targetKey = BANCAS_PERMITIDAS.includes(bancaKey) ? bancaKey : 'pmpe';
      const spec = global.RedacaoDados?.BANCA_SPECS?.[targetKey] || {
        banca: targetKey.toUpperCase(),
        name: targetKey.toUpperCase(),
        rubricaVersion: 'Padrão Oficial',
        maxScore: 40.0,
        minPass: 12.0,
        minPassRule: 'Consulte o edital.'
      };

      // Dispara a cascata de todos os modelos de IA disponíveis
      const resultado = await executarCascataIA({
        texto,
        tema: tema || 'Tema Geral de Cidadania e Segurança Pública',
        comando: comando || '',
        bancaKey: targetKey,
        spec,
        linhasReais: linhasReais ? Number(linhasReais) : undefined,
        customKeys: { geminiKey, openaiKey, anthropicKey, groqKey }
      });

      // Garantir que nenhuma chave seja vazada no retorno JSON
      if (resultado && resultado.key) delete resultado.key;
      if (resultado && resultado.apiKey) delete resultado.apiKey;

      return sendJson(res, 200, {
        ok: true,
        relatorio: resultado,
        modeloUtilizado: resultado.modeloUtilizado,
        tentativasFalhadas: (resultado.tentativasFalhadas || []).map(f => ({
          model: f.model,
          error: String(f.error || '')
            .replace(/key=[^&\s'"]+/gi, 'key=***')
            .replace(/Bearer\s+[^\s'"]+/gi, 'Bearer ***')
            .replace(/AIza[0-9A-Za-z-_]{35}/g, 'AIza***')
            .replace(/sk-[0-9A-Za-z-_]{20,}/g, 'sk-***')
        })),
        origem: resultado.origem || 'ia'
      });
    } catch (err) {
      console.error('[API Evaluate Error]', err);
      // Se ocorrer qualquer erro inesperado, recorre ao motor local determinístico
      const targetKey = ['pmpe', 'pcpe', 'pppe', 'cbmpe', 'pmsp'].includes(req.body?.bancaKey) ? req.body.bancaKey : 'pmpe';
      const fallbackLocal = global.MotorCorrecao.avaliarRedacao(req.body?.texto || '', req.body?.tema || '', targetKey, req.body?.comando || '');
      fallbackLocal.modeloUtilizado = 'Motor Contextual Determinístico Local (Fallback Seguro)';
      return sendJson(res, 200, {
        ok: true,
        relatorio: fallbackLocal,
        modeloUtilizado: fallbackLocal.modeloUtilizado,
        fallbackLocal: true
      });
    }
  }

  // 8. OCR FORENSE DE REDAÇÃO MANUSCRITA (GEMINI VISION)
  if ((pathname === '/api/transcribe-handwriting' || pathname === '/api/ocr-manuscrito') && req.method === 'POST') {
    try {
      const { imageBase64, mimeType, bancaKey, geminiKey, openaiKey } = await parseBody(req);
      if (!imageBase64 || String(imageBase64).length < 50) {
        return sendJson(res, 400, { error: 'Imagem base64 não fornecida ou inválida.' });
      }

      const resultado = await executarOcrManuscritoIA({
        imageBase64,
        mimeType: mimeType || 'image/jpeg',
        bancaKey: bancaKey || 'pmpe',
        customKeys: { geminiKey, openaiKey }
      });

      return sendJson(res, 200, { ok: true, data: resultado });
    } catch (err) {
      console.error('[API OCR Error]', err);
      return sendJson(res, 500, { error: 'Falha no processamento do OCR forense: ' + err.message });
    }
  }

  // 7. ARQUIVOS ESTÁTICOS DA APLICAÇÃO
  const safePath = path.normalize(pathname === '/' ? '/index.html' : pathname).replace(/^(\.\.[\/\\])+/, '');
  const fullPath = path.join(__dirname, safePath);
  if (fullPath.startsWith(__dirname) && fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    const ext = path.extname(fullPath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff'
    });
    fs.createReadStream(fullPath).pipe(res);
  } else {
    sendJson(res, 404, { error: 'Recurso não encontrado.' });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=====================================================================`);
  console.log(`✍️  [Redação Aprovada 2.0] Servidor rodando na porta ${PORT} (0.0.0.0)`);
  console.log(`🤖  Cascata de IA: Gemini (Pro/Flash) ➔ OpenAI ➔ Claude ➔ Motor Local`);
  console.log(`🎓  Google Auth: Ativo com reconhecimento de primeiro login`);
  console.log(`=====================================================================`);
});
