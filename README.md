# ✍️ Redação Aprovada 2.0 | Concursos Públicos & ENEM

Plataforma profissional de estudo, treino simulado e correção contextual de redações com **avaliação criteriosa conforme as exigências oficiais de cada banca organizadora**, **cascata inteligente de múltiplos modelos de Inteligência Artificial (com fallback automático sequencial)** e **reconhecimento de alunos via Conta Google com persistência integral de assuntos e histórico**.

---

## 🏛️ Critérios Documentados e Rigorosos por Banca

- **PMPE (Polícia Militar de Pernambuco):** Instituto AOCP (`AOCP-Discursiva-v2.4` · 5 critérios de 8,0 pts · Máximo: 40,0 pts · Folha oficial: 15 a 20 linhas · Logotipo oficial `4060864b87ab4736e6efeda0032a7a40.jpg`).
  - *Critério 1:* Atendimento e desenvolvimento do tema (8,0 pts)
  - *Critério 2:* Coesão referencial e sequencial (8,0 pts)
  - *Critério 3:* Estrutura textual e coerência (8,0 pts)
  - *Critério 4:* Informatividade e argumentação / repertório produtivo (8,0 pts)
  - *Critério 5:* Modalidade gramatical / norma culta (8,0 pts)
- **PCPE (Polícia Civil de Pernambuco):** CESPE / CEBRASPE (`CEBRASPE-Discursiva-v3.1` · Macroestrutura + Microestrutura com fórmula líquida documental oficial $NPD = NC - \frac{2 \times NE}{TL}$ · Máximo: 30,00 pts · Folha oficial de até 30 linhas · Logotipo oficial `images (1).jfif`).
  - *Macroestrutura (NC):* Apresentação (1,5 pts) + Tópicos 1, 2 e 3 do comando (9,5 pts cada)
  - *Microestrutura:* Desconto proporcional de erros gramaticais ($NE$) em relação ao total de linhas escritas ($TL$)
- **CBMPE (Corpo de Bombeiros Militar de PE):** Instituto AOCP (`AOCP-Discursiva-v2.4` · 5 critérios de 8,0 pts · Máximo: 40,0 pts · Folha oficial: 15 a 20 linhas · Logotipo oficial `logo_cbmpe.png`).
- **PMSP (Polícia Militar de São Paulo):** Fundação VUNESP (`VUNESP-Dissertativa-v2.2` · Critérios A, B e C · Máximo: 100,0 pts · Folha oficial de até 30 linhas · Logotipo oficial `Logo_PMESP.jpg`).
  - *Critério A:* Tema (30,0 pts) — Fuga total zera; tangenciamento reduz expressivamente
  - *Critério B:* Estrutura dissertativo-argumentativa e coerência (40,0 pts)
  - *Critério C:* Expressão verbal, modalidade e coesão (30,0 pts)
- **ENEM (Exame Nacional do Ensino Médio):** INEP (`INEP-Matriz-ENEM-v2024` · 5 Competências oficiais de 0 a 200 pts em saltos estritos de 40 pts · Máximo: 1000 pts · Folha oficial de até 30 linhas · Logotipo oficial `images.png`).
  - *Competência 5:* Auditoria detalhada dos 5 elementos da proposta de intervenção social (Agente, Ação, Meio/Modo, Detalhamento e Efeito/Finalidade).

---

## 🤖 Cascata Multi-Modelo de Inteligência Artificial com Fallback Automático

O motor de avaliação foi arquitetado com uma fila sequencial de modelos de IA de última geração. **Se qualquer modelo falhar (limite de cota, timeout ou erro de conexão), o sistema aciona imediatamente o próximo modelo da fila sem interrupção para o aluno**:

1. **Google Gemini 2.5 Pro** — Avaliação analítica e aprofundada de alta precisão
2. **Google Gemini 2.5 Flash** — Velocidade e alto desempenho
3. **Google Gemini 2.0 Flash** — Modelo de resposta rápida
4. **Google Gemini 1.5 Pro** — Análise estruturada e detalhada
5. **Google Gemini 1.5 Flash** — Contingência de alta disponibilidade
6. **OpenAI GPT-4o** — Avaliação externa independente (quando configurada chave)
7. **OpenAI GPT-4o Mini** — Fallback rápido da OpenAI
8. **Anthropic Claude 3.5 Sonnet / Haiku** — Alternativa analítica
9. **Groq Llama 3.3 70B** — Velocidade ultra-rápida
10. **Motor Contextual Determinístico Especializado** — Garantia offline incondicional que nunca deixa o aluno na mão caso todas as conexões externas estejam indisponíveis.

O espelho do resultado exibe com transparência o modelo de IA que realizou a correção e informa se algum fallback de contingência foi acionado.

---

## 👤 Reconhecimento de Alunos & Login com Google

- **Reconhecimento Inteligente:** Ao acessar o site, a plataforma detecta automaticamente se é o **Primeiro Login** do aluno ou um **Retorno**:
  - *Primeiro Login:* O aluno é recebido com uma mensagem especial de boas-vindas e seus dados são cadastrados na nuvem vinculados à sua Conta Google.
  - *Login Recorrente:* O sistema restaura imediatamente todo o histórico de redações, notas anteriores e **assuntos/temas salvos**.
- **Persistência de Assuntos e Temas:**
  - O aluno pode marcar temas favoritos com o botão **⭐ Salvar Assunto** no Banco de Temas.
  - Temas já praticados são automaticamente marcados com o selo de verificação e a maior nota obtida.
  - Ao fazer login novamente com a mesma Conta Google (seja no mesmo computador ou em outro aparelho conectado ao servidor), todos os assuntos, redações e estatísticas continuam salvos e sincronizados.

---

## 🚀 Como Executar a Aplicação

### Modo 1: Execução Direta / Offline (Sem Instalação)
1. Dê um duplo clique em **`ABRIR-APP.bat`** ou abra o arquivo **`index.html`** no seu navegador.
2. Todos os recursos funcionam imediatamente (folha pautada, corretor contextual, banco de temas, assuntos salvos, biblioteca de repertórios, quizzes comentados e testes).

### Modo 2: Execução Full-Stack com Backend e Cascata de IA (`server.js`)
1. Copie `.env.example` para `.env` e insira sua chave `GEMINI_API_KEY` (ou `OPENAI_API_KEY`, etc.):
   ```bash
   copy .env.example .env
   ```
2. Inicie o servidor:
   ```bash
   node server.js
   ```
3. Acesse `http://localhost:3000` no seu navegador.

### Suíte de Testes Automatizados (23 Testes)
- **Na Interface:** Clique no botão **`🧪 Testes`** no menu superior (topbar) para abrir a auditoria em tempo real com todos os 23 testes de qualidade aprovados.
- **Via URL:** Abra `index.html?autorun_tests=1`.

---

## 🏗️ Estrutura de Arquivos

- `index.html` — Interface responsiva, sistema multi-tema por banca, folha pautada dinâmica, modal do Google e modais de auditoria.
- `app.js` — Controlador da aplicação, integração com Conta Google, persistência de assuntos salvos, disparo da cascata de IA e renderização do relatório A–I.
- `server.js` — Servidor Node.js sem dependências externas com autenticação Google, sincronização de dados por aluno, proxy HTTPS seguro e cascata sequencial de provedores de IA com fallback automático.
- `motor-correcao.js` — Motor contextual calibrado em 13 etapas com fórmulas documentadas por banca, análise semântica e auditoria de repertório sociocultural.
- `dados-pedagogicos.js` — Rubricas versionadas por banca, logos institucionais oficiais (`<img>`), acervo de 28 fichas de repertório e 36 temas estruturados.
- `tests.js` — Suíte com 23 testes automatizados (Logotipos, Navegação, Fórmulas AOCP/Cebraspe/Vunesp/ENEM, Google Auth e IA Fallback).
- `.env.example` — Documentação e modelo de variáveis de ambiente para a cascata de IA e Google OAuth.
