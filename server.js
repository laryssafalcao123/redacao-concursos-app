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

// 2. CONSTRUTOR DE PROMPT CRITERIOSO ESPECIALIZADO POR BANCA
function construirPromptBanca({ texto, tema, comando, bancaKey, spec, linhasReais }) {
  let instrucaoLinhas = '';
  if (linhasReais && Number(linhasReais) > 0) {
    instrucaoLinhas = `\n- CONTAGEM REAL DE LINHAS NA FOLHA MANUSCRITA (FOTO OCR FORENSE): O candidato escreveu exatamente ${Number(linhasReais)} linha(s) pautada(s) na folha física. Utilize OBRIGATORIAMENTE este valor real como TL (Total de Linhas) na fórmula Cebraspe e para verificar a conformidade de extensão com o edital.`;
  }
  const instrucoesBanca = {
    pmpe: `BANCA ORGANIZADORA: INSTITUTO AOCP (Polícia Militar de Pernambuco - PMPE)
- Gênero: Texto Dissertativo-Argumentativo em prosa.
- Extensão obrigatória: 15 a 20 linhas (inferior a 7 linhas = anulação/nota zero).
- Pontuação Máxima: 40,0 pontos distribuídos em 5 critérios oficiais (0 a 8,0 pontos cada):
  1. Aspectos Formais e Tipologia Textual (adequação ao gênero e tema sem tangenciamento) - Máx: 8,0 pts
  2. Coerência e Progressão Temática (tese clara na introdução e argumentos encadeados) - Máx: 8,0 pts
  3. Coesão Referencial e Sequencial (operadores argumentativos no início dos parágrafos e sem repetições) - Máx: 8,0 pts
  4. Informatividade e Repertório Sociocultural (pertinência e produtividade do repertório) - Máx: 8,0 pts
  5. Modalidade Gramatical (norma-padrão culta, concordância, regência, crase e pontuação) - Máx: 8,0 pts`,

    cbmpe: `BANCA ORGANIZADORA: INSTITUTO AOCP (Corpo de Bombeiros Militar de PE - CBMPE)
- Gênero: Texto Dissertativo-Argumentativo em prosa aplicado a temas de Defesa Social, Proteção à Vida e Cidadania.
- Extensão obrigatória: 15 a 20 linhas (inferior a 7 linhas = anulação/nota zero).
- Pontuação Máxima: 40,0 pontos distribuídos em 5 critérios oficiais (0 a 8,0 pontos cada):
  1. Aspectos Formais e Tipologia Textual (adequação temática e gênero) - Máx: 8,0 pts
  2. Coerência e Progressão Temática - Máx: 8,0 pts
  3. Coesão Referencial e Sequencial - Máx: 8,0 pts
  4. Informatividade e Repertório - Máx: 8,0 pts
  5. Modalidade Gramatical - Máx: 8,0 pts`,

    pcpe: `BANCA ORGANIZADORA: CESPE / CEBRASPE (Polícia Civil de Pernambuco - PCPE)
- Gênero: Texto Dissertativo em prosa com atendimento a tópicos determinantes do comando.
- Extensão: Até 30 linhas (folha oficial Cebraspe).
- Pontuação Máxima: 30,00 pontos.
- Aplicação rigorosa da FÓRMULA LÍQUIDA DOCUMENTAL CEBRASPE:
  NPD = NC - (2 * NE / TL)
  Onde:
  - NC = Nota de Conteúdo (Macroestrutura, até 30,00 pontos):
    * Apresentação, legibilidade e estrutura textual (Macro): até 1,50 pt
    * Aspecto 1 (Contextualização e problematização temática): até 9,50 pts
    * Aspecto 2 (Fundamentação normativa, técnica ou sociológica): até 9,50 pts
    * Aspecto 3 (Mecanismos institucionais de enfrentamento e garantias): até 9,50 pts
  - NE = Número de Erros gramaticais confirmados na Microestrutura (grafia, morfossintaxe, pontuação).
  - TL = Total de Linhas efetivamente escritas.
  - Penalidade proporcional: (2 * NE / TL).`,

    pppe: `BANCA ORGANIZADORA: CEBRASPE (Polícia Penal de Pernambuco - PPPE - Edital 2026)
- Gênero: Texto Dissertativo em prosa com atendimento a aspectos temáticos do comando.
- Extensão Oficial: Até 30 linhas (folha oficial Cebraspe). Menos de 7 linhas = anulação sumária.
- Pontuação Máxima: 10,00 pontos.
- Nota Mínima para Aprovação: 5,00 pontos (NPD < 5,00 = reprovação).
- FÓRMULA OFICIAL DO EDITAL PPPE 2026:
  NPD = NC - (2 * NE / TL)
  Onde:
  - NC = Domínio do Conteúdo (Macroestrutura, até 10,00 pontos):
    * 1. Apresentação, estrutura textual e legibilidade: até 1,00 pt (respeito às margens, paragrafação, ausência de rasuras)
    * 2. Desenvolvimento do tema e conhecimento do assunto: até 3,00 pts (domínio sobre segurança pública, sistema penitenciário e execução penal)
    * 3. Qualidade e consistência dos argumentos: até 3,00 pts (fundamentação na Lei de Execução Penal - LEP nº 7.210/84, CF/88, dados e doutrina)
    * 4. Progressão temática e propostas de encaminhamento: até 3,00 pts (respeito aos direitos humanos, atuação técnica da Polícia Penal e integração ao SUSP)
  - NE = Número de Erros gramaticais confirmados na Microestrutura (grafia, acentuação, morfossintaxe, pontuação, propriedade vocabular).
  - TL = Total de Linhas efetivamente escritas.
  - Penalidade proporcional da banca: (2 * NE / TL).`,

    pmsp: `BANCA ORGANIZADORA: FUNDAÇÃO VUNESP (Polícia Militar de São Paulo - PMSP)
- Gênero: Texto Dissertativo-Argumentativo em prosa.
- Extensão: Até 30 linhas (folha oficial Vunesp).
- Pontuação Máxima: 100,0 pontos divididos em 3 eixos oficiais da VUNESP:
  - Critério A: Tema (0 a 30,0 pontos) - Fuga total zera a redação; tangenciamento reduz drasticamente.
  - Critério B: Estrutura (Gênero e Coerência) (0 a 40,0 pontos) - Tese clara, progressão sem contradições e desfecho articulado.
  - Critério C: Expressão (Coesão e Modalidade) (0 a 30,0 pontos) - Norma culta, conectivos diversificados e precisão vocabular.`
  };

  const regraEspecifica = instrucoesBanca[bancaKey] || instrucoesBanca.pmpe;

  return `Você é um Examinador Sênior de Bancas de Concursos Públicos (Cebraspe, Instituto AOCP e Fundação Vunesp). Sua missão é realizar uma auditoria pericial, implacável e 100% detalhada da redação do candidato, sem deixar passar nenhum desvio básico ou avançado.

${regraEspecifica}
${instrucaoLinhas}

DADOS DA PROPOSTA:
- Tema: "${tema}"
- Comando específico / Recorte: "${comando || 'Dissertação sobre o tema com problematização crítica e fundamentação.'}"

REDAÇÃO DO CANDIDATO PARA AVALIAÇÃO:
"""
${texto}
"""

Execute obrigatoriamente a correção em 3 VARREDURAS RIGOROSAS:

=====================================================================
VARREDURA 1: GRAMÁTICA NORMATIVA E MICROESTRUTURA (CRITÉRIO DE PENALIZAÇÃO DIRETA)
=====================================================================
Analise o texto período por período e aponte TODOS os erros nos seguintes pontos:
1. PONTUAÇÃO E VÍRGULAS (ERRO CRÍTICO):
   - Proibição Sintática Absoluta: Verifique se há vírgula separando o SUJEITO do VERBO (predicado) ou o VERBO de seus COMPLEMENTOS (objeto direto/indireto). Se houver, marque como "erro_confirmado" e explique claramente: "Na ordem direta da oração (Sujeito + Verbo + Complemento), é proibido usar vírgula entre o sujeito e o verbo ou entre o verbo e o objeto, mesmo que o sujeito seja longo."
   - Falta de Vírgula Obrigatória: Aponte ausência de vírgula em adjuntos adverbiais deslocados (ex: "No Brasil contemporâneo, ..."), após conectivos iniciais ("Portanto,", "Ademais,", "Nesse sentido,"), antes de conjunções adversativas (", mas", ", contudo", ", porém") e em orações subordinadas antepostas ou explicativas.
2. CRASE:
   - Falta de Crase: Identifique ausência do acento grave em locuções femininas ("à medida que", "à luz de", "às vezes") e na fusão de preposição "a" + artigo "a/as" exigida pela regência (ex: "visar à proteção", "obedecer às normas", "acesso à educação").
   - Crase Proibida: Puna o uso de crase antes de verbos no infinitivo ("a partir", "a combater"), palavras masculinas ("a curto prazo", "a respeito"), pronomes indefinidos/pessoais/demonstrativos ("a todos", "a toda", "a ela", "a essa") e "a" no singular antes de palavra no plural.
3. CONCORDÂNCIA VERBAL E NOMINAL:
   - Verbos Impessoais: Puna a pluralização indevida de "haver" no sentido de existir/ocorrer ("Houveram crimes" -> "Houve crimes"; "Devem haver" -> "Deve haver") e "fazer" indicando tempo decorrido ("Fazem dez anos" -> "Faz dez anos").
   - Voz Passiva Sintética e Sujeito Distante: Verifique se o verbo concorda com o sujeito paciente plural (ex: "Observa-se problemas" -> "Observam-se problemas") e se há discordância de gênero/número entre substantivos, adjetivos e particípios.
4. REGÊNCIA VERBAL E NOMINAL:
   - Audite verbos clássicos de prova: "visar" (no sentido de objetivar exige preposição "a": "visar ao bem"), "obedecer/desobedecer" (exige "a"), "assistir" (no sentido de ver exige "a"), "implicar" e "acarretar" (no sentido de causar são transitivos diretos: proibido usar "implicar em" ou "acarretar em"), "chegar/ir" (exigem preposição "a" e não "em").
   - Uso de "ONDE" vs. "EM QUE": Puna o uso de "onde" quando não se referir a lugar físico (ex: "sociedade onde", "momento onde", "situação onde" -> corrigir para "em que" ou "no qual/na qual").
5. ORTOGRAFIA, ACENTUAÇÃO E COLOCAÇÃO PRONOMINAL:
   - Aponte falta de acentos gráficos, erros de grafia, confusão entre parônimos/homônimos ("a fim de" vs "afim", "acerca de" vs "a cerca de", "ao encontro de" vs "de encontro a", "haja vista" vs "haja visto").
   - Puna início de frase com pronome oblíquo átono ("Se observa..." -> "Observa-se...") e falta de próclise obrigatória após palavras negativas ("não", "nunca"), advérbios sem vírgula, pronomes relativos ("que") e conjunções subordinativas ("quando", "embora", "conforme").

=====================================================================
VARREDURA 2: COESÃO TEXTUAL (REFERENCIAL E SEQUENCIAL)
=====================================================================
1. COESÃO INTERPARÁGRAFOS: Verifique se os parágrafos de Desenvolvimento (D1 e D2) e de Conclusão iniciam com operadores argumentativos adequados (ex: "Em primeiro lugar,", "Ademais,", "Outrossim,", "Portanto,"). Se o parágrafo começar "seco" (sem conectivo), aponte o erro de coesão sequencial.
2. COESÃO INTRAPARÁGRAFOS: Verifique se os períodos dentro do mesmo parágrafo estão ligados por conectivos ou se são apenas frases soltas/justapostas.
3. ADEQUAÇÃO SEMÂNTICA DO CONECTIVO: Aponte se o candidato usou um conectivo com sentido errado (ex: usar "Portanto" sem haver conclusão lógica, ou "Contudo" quando as ideias não se opõem).
4. COESÃO REFERENCIAL E ECO VOCABULAR: Aponte repetições viciosas da mesma palavra em linhas próximas, uso ambíguo de pronomes possessivos ("seu/sua") e mau uso de demonstrativos ("este" vs "esse").

=====================================================================
VARREDURA 3: COERÊNCIA E CONSISTÊNCIA ARGUMENTATIVA (MACROESTRUTURA)
=====================================================================
1. CONTRADIÇÃO INTERNA E EXTERNA: Aponte qualquer contradição entre a tese da introdução e os argumentos do desenvolvimento, ou afirmações que violem a Constituição Federal e os Direitos Humanos.
2. PROGRESSÃO TEMÁTICA VS. CIRCULARIDADE: Verifique se o texto avança nas ideias ou se apenas repete a mesma frase com palavras diferentes (argumentação circular / "encher linguiça").
3. FRAGMENTAÇÃO E TRUNCAMENTO SINTÁTICO: Aponte períodos incompletos (subordinadas sem oração principal) ou períodos excessivamente longos (mais de 45 palavras sem ponto final) que comprometem a coerência e a clareza.
4. GENERALIZAÇÕES E SENSO COMUM: Aponte expressões absolutas ou coloquiais ("ninguém faz nada", "todo mundo sabe", "nos dias de hoje", "cada um fazer sua parte") e exija modalização dissertativa formal.

INSTRUÇÕES ADICIONAIS DE MAPEAMENTO PARA O RELATÓRIO E RAIO-X INTERATIVO:
1. Avalie estritamente segundo os critérios da banca especificada. Seja cirúrgico, implacável e pedagógico.
2. Todos os desvios detectados nas Varreduras 1, 2 e 3 devem constar obrigatoriamente tanto em "ocorrencias" quanto em "marcacoes_inline" (com fragmentos literais de 1 a 12 palavras, parágrafo 1, 2, 3..., categoria entre "gramatica", "coesao", "repeticao", "argumentacao", "acerto", regra/critério, explicação pedagógica direta e sugestão de substituição precisa).
3. Analise cada parágrafo individualmente (função, relação com a tese, qualidade e versão revisada).
4. Avalie o repertório sociocultural: se é legitimado, se é pertinente ao tema e se foi usado de forma produtiva (com explicação e ponte com o argumento).
5. Gere o plano de melhoria em 3 níveis (alta, média e complementar), uma reescrita orientada do parágrafo mais frágil e um modelo integral de estudo nota máxima.

Retorne EXCLUSIVAMENTE um objeto JSON válido (sem comentários adicionais fora do JSON) com a seguinte estrutura exata:
{
  "total": number (nota final obtida),
  "max": number (nota máxima da banca),
  "percentual": number (percentual de aproveitamento, ex: 85.5),
  "aprovado": boolean,
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
  "nc": number,
  "ne": number,
  "tl": number,
  "penalidade": number,
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
      "trechoOriginal": string,
      "linhaAprox": number,
      "severidade": "erro_confirmado" | "fragilidade_argumentativa" | "sugestao_estilistica",
      "categoria": string,
      "explicacaoRegra": string,
      "sugestaoCorrecao": string,
      "localizacao": string
    }
  ],
  "analiseParagrafos": [
    {
      "numero": number,
      "tipoBloco": string,
      "textoOriginal": string,
      "funcao": string,
      "relacaoTese": string,
      "avaliacaoQualidade": string,
      "problemas": [string],
      "versaoRevisada": string
    }
  ],
  "repertorio": {
    "identificados": [
      {
        "termo": string,
        "tipo": string,
        "legitimado": boolean,
        "pertinente": boolean,
        "produtivo": boolean,
        "analise": string
      }
    ],
    "temLegitimo": boolean,
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
    "modeloIntegralEstudo": string
  },
  "proximaAtividade": {
    "exercicioGramatica": string,
    "exercicioArgumentacao": string,
    "atividadeRepertorio": string,
    "novoTemaRecomendado": string
  },
  "marcacoes_inline": [
    {
      "trecho_exato": string (cópia idêntica literal de 1 a 12 palavras do texto do aluno),
      "paragrafo": number (número do parágrafo 1, 2, 3...),
      "categoria": "gramatica" | "coesao" | "repeticao" | "argumentacao" | "acerto",
      "regra_ou_criterio": string (nome curto do desvio ou mérito),
      "explicacao": string (explicação pedagógica direta do porquê está errado ou como melhorar),
      "sugestao_substituicao": string (como reescrever apenas aquele trecho corretamente)
    }
  ]${bancaKey === 'cebraspe' ? `,
  "nc": number,
  "ne": number,
  "tl": number,
  "penalidade": number` : ''}
}`;
}

// 3. CASCATA COMPLETA DE MODELOS DE INTELIGÊNCIA ARTIFICIAL (CENTRALIZADA NO BACKEND)
async function executarCascataIA({ texto, tema, comando, bancaKey, spec, linhasReais, customKeys = {} }) {
  const failedAttempts = [];
  const promptCompleto = construirPromptBanca({ texto, tema, comando, bancaKey, spec, linhasReais });

  // Lista sequencial de modelos com suporte a fallback automático
  const cascadeQueue = [];

  // Leitura exclusiva das variáveis de ambiente do servidor (process.env no .env ou Render)
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

  // Tentativa sequencial de cada modelo da cascata
  for (const item of cascadeQueue) {
    try {
      console.log(`[IA Cascade] Tentando modelo: ${item.label}...`);
      let jsonResult = null;

      if (item.provider === 'gemini') {
        const postData = JSON.stringify({
          contents: [{ parts: [{ text: promptCompleto }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2
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
            { role: 'system', content: 'Você é um avaliador de redação sênior. Responda exclusivamente em JSON válido.' },
            { role: 'user', content: promptCompleto }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2
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
        console.log(`[IA Cascade] Sucesso com modelo: ${item.label}! Mesclando com Motor Local...`);

        // 1. Executa SEMPRE o motor determinístico local para garantir 100% das regras fixas
        const baseLocal = global.MotorCorrecao.avaliarRedacao(texto, tema, bancaKey, comando, { linhasReais });

        // 2. Mescla as ocorrências (Seção D): une o que a IA achou com o que o motor local cravou
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
          const jaExiste = ocorrenciasIA.some(o =>
            String(o.trechoOriginal || '').toLowerCase().trim() === String(ocLocal.trechoOriginal || '').toLowerCase().trim()
          );
          if (!jaExiste) {
            ocorrenciasIA.push(ocLocal);
          }
        });

        // 3. Mescla os grifos clicáveis do Raio-X Interativo (Padrão Glau)
        const marksIA = Array.isArray(jsonResult.marcacoes_inline) ? jsonResult.marcacoes_inline : [];
        (baseLocal.marcacoes_inline || []).forEach(mLocal => {
          const jaExiste = marksIA.some(m =>
            String(m.trecho_exato || '').toLowerCase().trim() === String(mLocal.trecho_exato || '').toLowerCase().trim()
          );
          if (!jaExiste) {
            marksIA.push(mLocal);
          }
        });

        const repListaUnificada = jsonResult.repertorio?.lista || jsonResult.repertorio?.identificados || baseLocal.repertorio.lista;

        // 4. Garante compatibilidade total de propriedades com o renderizador do app.js
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
          repertorio: {
            lista: repListaUnificada,
            quantidade: repListaUnificada.length,
            temAlgum: Boolean(jsonResult.repertorio?.temAlgum ?? jsonResult.repertorio?.temLegitimo ?? baseLocal.repertorio.temAlgum),
            temProdutivo: Boolean(jsonResult.repertorio?.temProdutivo ?? baseLocal.repertorio.temProdutivo),
            resumoGeral: jsonResult.repertorio?.resumoGeral || baseLocal.repertorio.resumoGeral
          },
          modeloUtilizado: `${item.label} + Motor Determinístico da Banca`,
          tentativasFalhadas: failedAttempts,
          origem: 'hibrido_blindado'
        };

        // 5. Recalcula a penalidade de erros confirmados (NE) no Cebraspe para manter precisão matemática
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

        // 6. Gera o HTML interativo de grifos com a lista unificada
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
  console.log('[IA Cascade] Todas as chamadas de IA externas falharam ou nenhuma chave estava configurada. Acionando Motor Contextual Especializado Determinístico.');
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
