/* =====================================================================
   REDAÇÃO APROVADA 2.0 — DADOS PEDAGÓGICOS, RUBRICAS VERSIONADAS,
   REPERTÓRIOS VERIFICÁVEIS, TEMAS E BANCO DE PORTUGUÊS
   ===================================================================== */
(function(global){
'use strict';

/* 1. LOGOTIPOS OFICIAIS (REGRA CRÍTICA DE UI - SEÇÃO 11) */
const LOGO_FILES = {
  pmpe: '4060864b87ab4736e6efeda0032a7a40.jpg',
  cbmpe: 'logo_cbmpe.png',
  pcpe: 'images (1).jfif',
  pppe: 'logo_pppe.jpg',
  pmsp: 'Logo_PMESP.jpg'
};

function renderLogoImg(targetKey, customClass = 'inst-logo-img'){
  const file = LOGO_FILES[targetKey] || LOGO_FILES.pmpe;
  const altMap = {
    pmpe: 'Brasão Polícia Militar de Pernambuco (PMPE)',
    cbmpe: 'Brasão Corpo de Bombeiros Militar de Pernambuco (CBMPE)',
    pcpe: 'Brasão Polícia Civil de Pernambuco (PCPE)',
    pppe: 'Brasão Polícia Penal de Pernambuco (PPPE)',
    pmsp: 'Brasão Polícia Militar do Estado de São Paulo (PMSP)'
  };
  const alt = altMap[targetKey] || 'Logotipo Institucional';
  return `<img src="${file}" alt="${alt}" class="${customClass}" loading="eager" onerror="this.onerror=null;this.src='4060864b87ab4736e6efeda0032a7a40.jpg';">`;
}

/* 2. RUBRICAS INDEPENDENTES E VERSIONADAS POR BANCA (SEÇÃO 6) */
const BANCA_SPECS = {
  pmpe: {
    id: 'pmpe',
    name: 'PMPE · Polícia Militar de Pernambuco',
    short: 'PMPE',
    banca: 'Instituto AOCP',
    rubricaVersion: 'AOCP-Discursiva-v2.4 (Editais Segurança Pública PE · 40,0 pts)',
    genero: 'Texto Dissertativo-Argumentativo em prosa',
    maxScore: 40.0,
    minPass: 12.0,
    minPassRule: 'Referência de corte documental em editais AOCP/Segurança PE: 12,0 pontos (30% da nota máxima). Consulte o edital específico do certame.',
    minLines: 15,
    maxLines: 20,
    zeroMinLines: 7,
    requiresIntervention: false,
    badgeClass: 'badge-militar',
    linesRange: '15 a 20 linhas',
    description: 'Avaliação estruturada nos 5 critérios do Instituto AOCP: Atendimento ao Tema, Coesão, Estrutura/Coerência, Informatividade/Argumentação e Modalidade Gramatical (Extensão: 15 a 20 linhas).',
    criteriaList: [
      { id: 'c1', title: '1. Atendimento e desenvolvimento do tema', pts: 8.0, desc: 'Avalia a compreensão da proposta, o recorte temático, a abordagem dos núcleos semânticos do comando e a ausência de tangenciamento.' },
      { id: 'c2', title: '2. Coesão referencial e sequencial', pts: 8.0, desc: 'Avalia a articulação entre períodos e parágrafos por operadores argumentativos adequados e a retomada referencial sem repetições viciosas.' },
      { id: 'c3', title: '3. Estrutura textual e coerência', pts: 8.0, desc: 'Avalia a macroestrutura dissertativo-argumentativa (introdução com tese, desenvolvimento analítico e conclusão), progressão temática e não contradição.' },
      { id: 'c4', title: '4. Informatividade e argumentação', pts: 8.0, desc: 'Avalia a pertinência, explicação e produtividade do repertório sociocultural na defesa da tese, superando o senso comum.' },
      { id: 'c5', title: '5. Modalidade gramatical (norma-padrão)', pts: 8.0, desc: 'Avalia ortografia oficial, acentuação, concordância, regência, crase, pontuação, colocação pronominal e construção sintática.' }
    ],
    regrasAnulacao: [
      'Fuga total ao tema proposto.',
      'Não atendimento à tipologia dissertativo-argumentativa.',
      'Extensão obrigatória da folha oficial: mínimo de 15 e máximo de 20 linhas.'
    ]
  },
  pcpe: {
    id: 'pcpe',
    name: 'PCPE · Polícia Civil de Pernambuco',
    short: 'PCPE',
    banca: 'CESPE / CEBRASPE',
    rubricaVersion: 'CEBRASPE-Discursiva-v3.1 (Fórmula Líquida NPD = NC - 2×NE/TL · 30,00 pts)',
    genero: 'Texto Dissertativo em prosa com atendimento a tópicos determinantes',
    maxScore: 30.0,
    minPass: 15.0,
    minPassRule: 'Referência de corte documental em editais Cebraspe/PCPE: NPD ≥ 15,00 pontos (50% da pontuação total).',
    minLines: 1,
    maxLines: 30,
    zeroMinLines: 7,
    requiresIntervention: false,
    badgeClass: 'badge-gold',
    linesRange: 'Até 30 linhas',
    description: 'Separa estritamente a avaliação de Macroestrutura (Apresentação + Atendimento aos Tópicos do Comando = NC) e Microestrutura (Desvios gramaticais NE descontados proporcionalmente ao total de linhas escritas TL, em folha de até 30 linhas).',
    criteriaList: [
      { id: 'apres', title: 'Apresentação, estrutura textual e legibilidade (Macro)', pts: 1.5, desc: 'Respeito às margens, paragrafação clara, organização lógica dos blocos e adequação ao registro formal.' },
      { id: 'topico1', title: 'Aspecto 1: Contextualização e problematização temática (Macro)', pts: 9.5, desc: 'Abordagem analítica do problema central proposto e de suas causas estruturais.' },
      { id: 'topico2', title: 'Aspecto 2: Fundamentação normativa, técnica ou sociológica (Macro)', pts: 9.5, desc: 'Articulação de repertório legítimo (Constituição, legislação penal/processual, doutrina ou dados) pertinente ao tema.' },
      { id: 'topico3', title: 'Aspecto 3: Mecanismos de enfrentamento e garantias institucionais (Macro)', pts: 9.5, desc: 'Apresentação de diretrizes ou encaminhamentos institucionais viáveis e coerentes com o Estado Democrático de Direito.' }
    ],
    regrasAnulacao: [
      'Nota final líquida NPD calculada pela fórmula documental: NPD = NC - (2 × NE / TL), sendo limitada a no mínimo 0,00.',
      'Quanto maior o Total de Linhas Efetivamente Escritas (TL, até o limite de 30 linhas), menor o impacto proporcional de cada erro (NE).',
      'Fuga total ao tema ou texto em branco implica nota zero.'
    ]
  },
  pppe: {
    id: 'pppe',
    name: 'PPPE · Polícia Penal de Pernambuco',
    short: 'PPPE',
    banca: 'CEBRASPE',
    rubricaVersion: 'CEBRASPE-PPPE-v1.0 (Edital 2026 · NPD = NC - 2×NE/TL · 10,00 pts)',
    genero: 'Texto Dissertativo em prosa com atendimento a aspectos temáticos',
    maxScore: 10.0,
    minPass: 5.0,
    minPassRule: 'Critério oficial do Edital PPPE 2026: NPD ≥ 5,00 pontos para aprovação. Nota zero em caso de fuga total ao tema ou ausência de texto.',
    minLines: 20,
    maxLines: 30,
    zeroMinLines: 7,
    requiresIntervention: false,
    badgeClass: 'badge-gold',
    linesRange: '20 a 30 linhas',
    description: 'Avaliação conforme o Edital da Polícia Penal de PE 2026 (CEBRASPE): Domínio do Conteúdo (NC até 10,00 pts: apresentação, estrutura, conhecimento e consistência dos argumentos) e Domínio da Língua Portuguesa com desconto líquido proporcional: NPD = NC - 2 × NE ÷ TL.',
    criteriaList: [
      { id: 'apres', title: '1. Apresentação, estrutura textual e legibilidade (Macro)', pts: 1.0, desc: 'Respeito às margens, paragrafação nítida, organização lógica dos blocos e adequação formal.' },
      { id: 'topico1', title: '2. Desenvolvimento do tema e conhecimento do assunto (Macro)', pts: 3.0, desc: 'Domínio técnico sobre segurança pública, sistema penitenciário, execução penal e direitos fundamentais.' },
      { id: 'topico2', title: '3. Qualidade e consistência dos argumentos (Macro)', pts: 3.0, desc: 'Fundamentação consistente em causas, consequências, dados concretos e normas (ex.: LEP - Lei nº 7.210/1984 e CF/88).' },
      { id: 'topico3', title: '4. Progressão temática e propostas de encaminhamento (Macro)', pts: 3.0, desc: 'Articulação lógica entre os parágrafos, encaminhamentos institucionais e respeito à dignidade humana.' }
    ],
    regrasAnulacao: [
      'Nota final da prova discursiva calculada pela fórmula oficial do Edital PPPE 2026: NPD = NC - 2 × (NE / TL).',
      'Nota mínima para aprovação: 5,00 pontos (reprovação automática se NPD < 5,00).',
      'Fuga total ao tema ou texto em branco implica nota zero (0,00).',
      'Extensão padrão da folha de redação: até 30 linhas.'
    ]
  },
  cbmpe: {
    id: 'cbmpe',
    name: 'CBMPE · Corpo de Bombeiros Militar de PE',
    short: 'CBMPE',
    banca: 'Instituto AOCP',
    rubricaVersion: 'AOCP-Discursiva-v2.4 (Editais CBMPE / Defesa Social PE · 40,0 pts)',
    genero: 'Texto Dissertativo-Argumentativo em prosa',
    maxScore: 40.0,
    minPass: 12.0,
    minPassRule: 'Referência de corte documental em editais AOCP/CBMPE: 12,0 pontos (30% da pontuação máxima).',
    minLines: 15,
    maxLines: 20,
    zeroMinLines: 7,
    requiresIntervention: false,
    badgeClass: 'badge-crimson',
    linesRange: '15 a 20 linhas',
    description: 'Critérios oficiais do Instituto AOCP aplicados a temas de proteção à vida, prevenção de desastres, defesa civil, meio ambiente e cidadania (Extensão: 15 a 20 linhas).',
    criteriaList: [
      { id: 'c1', title: '1. Atendimento e desenvolvimento do tema', pts: 8.0, desc: 'Compreensão do recorte temático proposto, articulação dos núcleos do comando e ausência de tangenciamento.' },
      { id: 'c2', title: '2. Coesão referencial e sequencial', pts: 8.0, desc: 'Conexão inter e intraparágrafos fluida, uso adequado de pronomes e conectivos sem repetições.' },
      { id: 'c3', title: '3. Estrutura textual e coerência', pts: 8.0, desc: 'Organização em introdução, desenvolvimento e conclusão com unidade lógica e progressão discursiva.' },
      { id: 'c4', title: '4. Informatividade e argumentação', pts: 8.0, desc: 'Sustentação da tese com conceitos pertinentes, legislação, dados ou referências históricas/filosóficas explicadas.' },
      { id: 'c5', title: '5. Modalidade gramatical (norma-padrão)', pts: 8.0, desc: 'Domínio da norma culta: ortografia, concordância, regência, crase, pontuação e sintaxe.' }
    ],
    regrasAnulacao: [
      'Fuga total ao tema proposto.',
      'Não atendimento ao gênero dissertativo-argumentativo.',
      'Extensão obrigatória da folha oficial: mínimo de 15 e máximo de 20 linhas.'
    ]
  },
  pmsp: {
    id: 'pmsp',
    name: 'PMSP · Polícia Militar de São Paulo (VUNESP)',
    short: 'PMSP',
    banca: 'VUNESP',
    rubricaVersion: 'VUNESP-Dissertativa-v2.2 (Padrão Concursos/Vestibulares · 100,0 pts)',
    genero: 'Texto Dissertativo-Argumentativo em prosa',
    maxScore: 100.0,
    minPass: 50.0,
    minPassRule: 'Referência documental de aprovação em editais VUNESP/PMESP: 50,0 pontos (50% da nota máxima).',
    minLines: 1,
    maxLines: 30,
    zeroMinLines: 7,
    requiresIntervention: false,
    badgeClass: 'badge-blue',
    linesRange: 'Até 30 linhas',
    description: 'Avaliação segundo o espelho da Fundação VUNESP estruturado em três eixos: Critério A (Tema), Critério B (Estrutura: Gênero e Coerência) e Critério C (Expressão: Coesão e Modalidade), em folha de até 30 linhas.',
    criteriaList: [
      { id: 'critA', title: 'Critério A: Tema', pts: 30.0, desc: 'Avalia se o texto compreende o recorte temático proposto pela banca sem fuga (que zera a prova) nem extrapolação/tangenciamento.' },
      { id: 'critB', title: 'Critério B: Estrutura (Gênero e Coerência)', pts: 40.0, desc: 'Avalia a tipologia dissertativo-argumentativa, a clareza do ponto de vista (tese), a progressão lógica dos argumentos e a pertinência do desfecho.' },
      { id: 'critC', title: 'Critério C: Expressão (Coesão e Modalidade)', pts: 30.0, desc: 'Avalia o uso dos recursos coesivos, a precisão vocabular, a impessoalidade e o respeito às normas gramaticais do padrão culto.' }
    ],
    regrasAnulacao: [
      'Nota zero no Critério A (fuga total ao tema) anula toda a redação.',
      'Predominância de outro gênero textual (narração, carta, poema).',
      'Limite máximo da folha oficial: até 30 linhas.'
    ]
  }
};

/* 3. BIBLIOTECA AMPLA E PESQUISÁVEL DE REPERTÓRIO SOCIOCULTURAL (SEÇÃO 7)
   Todas as referências são reais, historicamente/juridicamente verificáveis e cobrem
   Filosofia, Sociologia, História, Educação, Saúde, Meio Ambiente, Economia, Tecnologia, Segurança e Direito. */
const REPERTORIO_CATEGORIAS = {
  all: 'Todos os Eixos',
  filosofia: 'Filosofia & Ética',
  sociologia: 'Sociologia & Sociedade',
  direito: 'Constituição & Legislação',
  historia: 'História & Formação do Brasil',
  educacao: 'Educação & Cultura',
  saude: 'Saúde Pública & Bem-Estar',
  ambiente: 'Meio Ambiente & Urbanismo',
  economia: 'Economia & Trabalho',
  tecnologia: 'Tecnologia & Informação',
  seguranca: 'Segurança Pública & Justiça'
};

const REPERTORIO_LIBRARY = [
  {
    id: 'rep-cf88-art1',
    titulo: 'Dignidade da Pessoa Humana e Fundamentos da República',
    autor: 'Assembleia Nacional Constituinte (Brasil)',
    categoria: 'direito',
    conceito: 'Princípio da Dignidade da Pessoa Humana e Cidadania',
    explicacao: 'A Constituição Federal de 1988 estabelece em seu artigo 1º, incisos II e III, a cidadania e a dignidade da pessoa humana como pilares do Estado Democrático de Direito, obrigando o Poder Público a proteger a integridade física, moral e social de todos os indivíduos.',
    aplicacao: 'Sob a égide do artigo 1º, inciso III, da Constituição Federal de 1988, a dignidade da pessoa humana constitui fundamento inegociável da República; todavia, a persistência do problema analisado revela um hiato entre a garantia formal e a realidade fática dos cidadãos.',
    fonte: 'BRASIL. Constituição da República Federativa do Brasil de 1988, Art. 1º, incisos II e III.',
    tags: ['cidadania', 'direitos humanos', 'estado', 'constituição', 'dignidade', 'vulnerabilidade']
  },
  {
    id: 'rep-cf88-art6',
    titulo: 'Direitos Sociais Constitucionais',
    autor: 'Assembleia Nacional Constituinte (Brasil)',
    categoria: 'direito',
    conceito: 'Mínimo Existencial e Deveres Prestacionais do Estado',
    explicacao: 'O artigo 6º da Carta Magna elenca como direitos sociais a educação, a saúde, a alimentação, o trabalho, a moradia, o transporte, o lazer, a segurança, a previdência social e a proteção à maternidade e à infância.',
    aplicacao: 'Embora o artigo 6º da Constituição Federal assegure a saúde, a educação e a segurança como direitos sociais universais, observa-se que parcelas vulneráveis da população ainda enfrentam barreiras estruturais para usufruir dessas garantias.',
    fonte: 'BRASIL. Constituição da República Federativa do Brasil de 1988, Art. 6º.',
    tags: ['educação', 'saúde', 'segurança', 'moradia', 'trabalho', 'desigualdade', 'direitos sociais']
  },
  {
    id: 'rep-cf88-art144',
    titulo: 'Segurança Pública como Dever do Estado e Responsabilidade Coletiva',
    autor: 'Assembleia Nacional Constituinte (Brasil)',
    categoria: 'seguranca',
    conceito: 'Preservação da Ordem Pública e Incolumidade das Pessoas',
    explicacao: 'O artigo 144 da Constituição de 1988 define que a segurança pública é dever do Estado, direito e responsabilidade de todos, sendo exercida para a preservação da ordem pública e da incolumidade das pessoas e do patrimônio.',
    aplicacao: 'Nos termos do artigo 144 da Constituição Federal, a segurança pública não se resume à repressão estatal, mas configura direito e responsabilidade compartilhada, demandando integração entre as forças policiais e a comunidade.',
    fonte: 'BRASIL. Constituição da República Federativa do Brasil de 1988, Art. 144.',
    tags: ['polícia', 'segurança pública', 'ordem pública', 'pmpe', 'pcpe', 'pmsp', 'cbmpe', 'violência']
  },
  {
    id: 'rep-hobbes',
    titulo: 'O Contrato Social e o Estado garantidor da paz',
    autor: 'Thomas Hobbes (1588–1679)',
    categoria: 'filosofia',
    conceito: 'Pacto Social e Superação do Estado de Natureza',
    explicacao: 'Em sua obra clássica "O Leviatã", o filósofo inglês Thomas Hobbes argumenta que, sem leis e instituições eficazes, prevalece a insegurança generalizada ("o homem é o lobo do homem"). O Estado surge do contrato social justamente para assegurar a paz, a proteção da vida e a ordem coletiva.',
    aplicacao: 'Para o filósofo contratualista Thomas Hobbes, em "O Leviatã", a razão de existir do Estado reside na garantia da segurança e da paz social. Quando o Poder Público se omite diante dessa problemática, fragiliza-se o próprio pacto civilizatório.',
    fonte: 'HOBBES, Thomas. Leviatã, ou Matéria, forma e poder de um Estado eclesiástico e civil (1651).',
    tags: ['estado', 'segurança', 'violência', 'contrato social', 'ordem', 'leis', 'omissão estatal']
  },
  {
    id: 'rep-beccaria',
    titulo: 'Proporcionalidade, Legalidade e Prevenção dos Delitos',
    autor: 'Cesare Beccaria (1738–1794)',
    categoria: 'seguranca',
    conceito: 'Racionalidade Penal, Certeza da Punição e Educação Preventiva',
    explicacao: 'O jurista iluminista Cesare Beccaria consolidou as bases do Direito Penal moderno ao defender que a eficácia da justiça não decorre da crueldade das penas, mas da certeza de sua aplicação dentro da legalidade e, sobretudo, da prevenção dos crimes por meio da educação e de leis claras.',
    aplicacao: 'Conforme postulava o jurista iluminista Cesare Beccaria em "Dos Delitos e das Penas", é mais eficaz prevenir os crimes pela clareza das leis e pela educação do que apenas reprimi-los tardiamente — premissa essencial para modernizar a segurança pública.',
    fonte: 'BECCARIA, Cesare. Dos Delitos e das Penas (Dei delitti e delle pene, 1764).',
    tags: ['justiça', 'direito penal', 'prevenção', 'legalidade', 'direitos humanos', 'polícia', 'impunidade']
  },
  {
    id: 'rep-arendt-banalidade',
    titulo: 'A Banalidade do Mal e a Responsabilidade Moral',
    autor: 'Hannah Arendt (1906–1975)',
    categoria: 'filosofia',
    conceito: 'Naturalização da Injustiça e Ausência de Reflexão Crítica',
    explicacao: 'A filósofa política Hannah Arendt cunhou o conceito de "banalidade do mal" para explicar como graves violações humanas passam a ser vistas como normais e rotineiras quando os indivíduos e as instituições deixam de refletir criticamente sobre o impacto ético de suas ações ou omissões.',
    aplicacao: 'Sob a ótica de Hannah Arendt, o conceito de "banalidade do mal" evidencia o perigo de uma sociedade que naturaliza violações cotidianas de direitos sem questionar suas causas, tornando invisível o sofrimento de grupos vulneráveis.',
    fonte: 'ARENDT, Hannah. Eichmann em Jerusalém: um relato sobre a banalidade do mal (1963).',
    tags: ['ética', 'violência', 'indiferença', 'direitos humanos', 'cidadania', 'intolerância']
  },
  {
    id: 'rep-bauman',
    titulo: 'Modernidade Líquida e Fragilidade dos Laços Sociais',
    autor: 'Zygmunt Bauman (1925–2017)',
    categoria: 'sociologia',
    conceito: 'Individualismo, Insegurança e Volatilidade Contemporânea',
    explicacao: 'O sociólogo polonês Zygmunt Bauman analisa como a sociedade contemporânea é marcada pela fluidez das relações humanas, pelo individualismo exacerbado, pelo consumo imediato e pelo enfraquecimento das instituições coletivas de solidariedade.',
    aplicacao: 'De acordo com o sociólogo Zygmunt Bauman, na obra "Modernidade Líquida", a fragilização dos laços comunitários e o avanço do individualismo acentuam a sensação de desamparo social, dificultando respostas coletivas e solidárias ao problema.',
    fonte: 'BAUMAN, Zygmunt. Modernidade Líquida (Liquid Modernity, 2000).',
    tags: ['sociedade', 'individualismo', 'redes sociais', 'saúde mental', 'comunidade', 'consumo']
  },
  {
    id: 'rep-durkheim',
    titulo: 'Fato Social, Coesão e Anomia Social',
    autor: 'Émile Durkheim (1858–1917)',
    categoria: 'sociologia',
    conceito: 'Anomia (Ausência ou Enfraquecimento das Normas Coletivas)',
    explicacao: 'Para Émile Durkheim, um dos fundadores da Sociologia, quando as normas jurídicas e morais deixam de regular eficazmente a conduta coletiva ou quando as instituições falham em integrar os indivíduos, instala-se um estado de "anomia social", gerando desintegração e conflitos.',
    aplicacao: 'À luz da sociologia de Émile Durkheim, a deficiência de regulamentação e fiscalização estatal produz um cenário de anomia social, no qual o enfraquecimento das regras coletivas compromete a coesão e a ordem pública.',
    fonte: 'DURKHEIM, Émile. Da Divisão do Trabalho Social (1893) e O Suicídio (1897).',
    tags: ['leis', 'normas', 'crime', 'anomia', 'sociedade', 'instituições', 'coesão social']
  },
  {
    id: 'rep-foucault',
    titulo: 'Sociedade Disciplinar, Instituições e Controle Social',
    autor: 'Michel Foucault (1926–1984)',
    categoria: 'filosofia',
    conceito: 'Biopoder, Vigilância e Função Ressocializadora das Instituições',
    explicacao: 'Em "Vigiar e Punir", o filósofo francês Michel Foucault estuda a transição das punições corporais para os mecanismos modernos de vigilância e disciplina (escolas, hospitais, prisões), problematizando como o controle institucional deve respeitar a racionalidade e evitar abusos de poder.',
    aplicacao: 'Conforme analisa Michel Foucault em "Vigiar e Punir", os mecanismos de vigilância e controle estatal exercem profundo impacto sobre os corpos e a conduta social, exigindo limites éticos claros para que a segurança não se converta em arbítrio.',
    fonte: 'FOUCAULT, Michel. Vigiar e Punir: nascimento da prisão (Surveiller et punir, 1975).',
    tags: ['vigilância', 'câmeras', 'prisões', 'segurança', 'poder', 'estado', 'disciplina']
  },
  {
    id: 'rep-platao-caverna',
    titulo: 'Alegoria da Caverna e Emancipação pelo Conhecimento',
    autor: 'Platão (428–347 a.C.)',
    categoria: 'filosofia',
    conceito: 'Superação da Ignorância (Doxa) pela Razão Crítica (Episteme)',
    explicacao: 'No Livro VII de "A República", Platão narra a situação de prisioneiros que tomam sombras projetadas na parede como a única verdade. A saída da caverna simboliza o processo educativo e filosófico de questionar aparências, preconceitos e manipulações.',
    aplicacao: 'Na "Alegoria da Caverna", presente na obra "A República" de Platão, os indivíduos acorrentados confundem sombras projetadas com a realidade. Analogamente, a falta de letramento crítico aprisiona cidadãos em bolhas de desinformação.',
    fonte: 'PLATÃO. A República, Livro VII (c. 380 a.C.).',
    tags: ['educação', 'desinformação', 'fake news', 'algoritmos', 'conhecimento', 'senso crítico']
  },
  {
    id: 'rep-freire',
    titulo: 'Educação Libertadora e Consciência Crítica',
    autor: 'Paulo Freire (1921–1997)',
    categoria: 'educacao',
    conceito: 'Superação da Educação Bancária pela Pedagogia Crítica',
    explicacao: 'O educador brasileiro Paulo Freire, Patrono da Educação Brasileira (Lei nº 12.612/2012), defende que a educação não deve ser um depósito mecânico de conteúdos ("educação bancária"), mas uma prática dialógica capaz de desenvolver a autonomia intelectual e transformar a realidade social.',
    aplicacao: 'Como ensinava o educador Paulo Freire em "Pedagogia do Oprimido", uma educação autêntica deve formar sujeitos críticos capazes de ler o mundo e intervir em sua realidade, sendo indispensável para reverter o quadro analisado.',
    fonte: 'FREIRE, Paulo. Pedagogia do Oprimido (1968) e Pedagogia da Autonomia (1996).',
    tags: ['educação', 'escola', 'cidadania', 'letramento', 'conscientização', 'juventude']
  },
  {
    id: 'rep-kant',
    titulo: 'Imperativo Categórico e Maioridade Intelectual (Esclarecimento)',
    autor: 'Immanuel Kant (1724–1804)',
    categoria: 'filosofia',
    conceito: 'Pessoa Humana como Fim em Si Mesma e Autonomia da Razão',
    explicacao: 'Immanuel Kant formula no Imperativo Categórico que o ser humano jamais deve ser tratado apenas como um meio ou instrumento, mas sempre como um fim em si mesmo. Além disso, define o Esclarecimento (Aufklärung) como a saída do ser humano da menoridade intelectual.',
    aplicacao: 'Segundo a ética de Immanuel Kant, na "Fundamentação da Metafísica dos Costumes", todo ser humano possui dignidade intrínseca e deve ser tratado como um fim em si mesmo, jamais sendo reduzido a mero objeto de exploração ou descaso.',
    fonte: 'KANT, Immanuel. Fundamentação da Metafísica dos Costumes (1785).',
    tags: ['ética', 'dignidade', 'trabalho', 'direitos humanos', 'autonomia', 'educação']
  },
  {
    id: 'rep-gilberto-dimenstein',
    titulo: 'O Cidadão de Papel e a Inefetividade dos Direitos',
    autor: 'Gilberto Dimenstein (1956–2020)',
    categoria: 'sociologia',
    conceito: 'Cidadania Formal (no papel) vs. Cidadania Real (na prática)',
    explicacao: 'Na obra "O Cidadão de Papel", o jornalista e escritor Gilberto Dimenstein analisa como o Brasil possui uma legislação avançada e protetiva no plano formal, mas falha na materialização dessas garantias no cotidiano das populações vulneráveis.',
    aplicacao: 'Tal cenário corrobora a tese de Gilberto Dimenstein em "O Cidadão de Papel": embora o ordenamento jurídico brasileiro seja formalmente avançado, a insuficiência de políticas públicas efetivas mantém a cidadania restrita ao texto da lei.',
    fonte: 'DIMENSTEIN, Gilberto. O Cidadão de Papel: a infância, a adolescência e os Direitos Humanos no Brasil (1993).',
    tags: ['cidadania', 'leis', 'desigualdade', 'estado', 'direitos humanos', 'infância', 'políticas públicas']
  },
  {
    id: 'rep-milton-santos',
    titulo: 'Cidadanias Mutiladas e Desigualdade Socioespacial',
    autor: 'Milton Santos (1926–2001)',
    categoria: 'ambiente',
    conceito: 'Segregação Urbana e Cidadania Incompleta',
    explicacao: 'O geógrafo brasileiro Milton Santos, vencedor do Prêmio Vautrin Lud, demonstrou como a urbanização desigual nas metrópoles brasileiras produz "cidadanias mutiladas", nas quais o acesso a equipamentos públicos, saneamento, segurança e mobilidade depende da localização geográfica e da renda.',
    aplicacao: 'Conforme analisa o geógrafo Milton Santos em "O Espaço do Cidadão", a ocupação desordenada do território brasileiro gera "cidadanias mutiladas", privando moradores de áreas periféricas e de risco do pleno acesso à infraestrutura e à proteção estatal.',
    fonte: 'SANTOS, Milton. O Espaço do Cidadão (1987).',
    tags: ['urbanismo', 'periferia', 'desastres', 'moradia', 'desigualdade', 'cidades', 'cbmpe', 'pmsp']
  },
  {
    id: 'rep-byung-chul-han',
    titulo: 'Sociedade do Cansaço e Esgotamento Psíquico',
    autor: 'Byung-Chul Han (1959–)',
    categoria: 'saude',
    conceito: 'Hiperprodutividade, Autoexploração e Adoecimento Mental',
    explicacao: 'O filósofo sul-coreano Byung-Chul Han analisa que o século XXI é marcado pela cobrança incessante por desempenho, velocidade e hiperconexão, levando ao esgotamento profissional (burnout), à ansiedade e ao sofrimento psíquico.',
    aplicacao: 'Na obra "Sociedade do Cansaço", o filósofo Byung-Chul Han adverte que o excesso de cobrança por produtividade e a sobrecarga contínua convertem-se em motores de adoecimento psíquico — realidade que afeta trabalhadores e agentes públicos.',
    fonte: 'HAN, Byung-Chul. Sociedade do Cansaço (Müdigkeitsgesellschaft, 2010).',
    tags: ['saúde mental', 'trabalho', 'burnout', 'tecnologia', 'policiais', 'estresse', 'redes sociais']
  },
  {
    id: 'rep-silvio-almeida',
    titulo: 'Racismo Estrutural e Institucional',
    autor: 'Silvio Almeida',
    categoria: 'sociologia',
    conceito: 'Naturalização de Desigualdades Raciais nas Estruturas Sociais',
    explicacao: 'Na obra "Racismo Estrutural", o jurista e filósofo brasileiro analisa como o racismo não se limita a atos individuais isolados, mas encontra-se enraizado nas relações econômicas, políticas, jurídicas e institucionais formadas historicamente no país.',
    aplicacao: 'Como explica Silvio Almeida na obra "Racismo Estrutural", a desigualdade racial no Brasil possui raízes históricas que permeiam o mercado de trabalho e as instituições, exigindo políticas afirmativas e letramento antidiscriminatório.',
    fonte: 'ALMEIDA, Silvio Luiz de. Racismo Estrutural. Coleção Feminismos Plurais (2018).',
    tags: ['racismo', 'igualdade', 'direitos humanos', 'história', 'cidadania', 'mercado de trabalho']
  },
  {
    id: 'rep-simone-beauvoir',
    titulo: 'Construção Social dos Papéis de Gênero',
    autor: 'Simone de Beauvoir (1908–1986)',
    categoria: 'sociologia',
    conceito: 'Desigualdade Histórica de Gênero e Invisibilidade Feminina',
    explicacao: 'A filósofa francesa Simone de Beauvoir analisa como a subordinação histórica das mulheres e a divisão desigual das responsabilidades domésticas e de cuidado não são determinações biológicas naturais, mas construções sociais passíveis de transformação.',
    aplicacao: 'Sob a perspectiva de Simone de Beauvoir em "O Segundo Sexo", as assimetrias impostas às mulheres resultam de condicionamentos históricos e culturais que precisam ser superados por meio da igualdade de direitos e da proteção estatal.',
    fonte: 'BEAUVOIR, Simone de. O Segundo Sexo (Le Deuxième Sexe, 1949).',
    tags: ['mulheres', 'violência doméstica', 'cuidado', 'igualdade de gênero', 'direitos humanos']
  },
  {
    id: 'rep-sergio-buarque',
    titulo: 'Raízes do Brasil e Patrimonialismo',
    autor: 'Sérgio Buarque de Holanda (1902–1982)',
    categoria: 'historia',
    conceito: 'Homem Cordial e Confusão entre o Público e o Privado',
    explicacao: 'O historiador Sérgio Buarque de Holanda identifica na formação histórica brasileira a persistência do patrimonialismo e do conceito de "homem cordial" — a tendência de sobrepor relações pessoais, afetivas ou interesses privados à impessoalidade da lei e do interesse público.',
    aplicacao: 'Em "Raízes do Brasil", o historiador Sérgio Buarque de Holanda aponta que a herança patrimonialista brasileira dificulta a consolidação da impessoalidade estatal, demandando transparência e rigor no cumprimento da lei.',
    fonte: 'HOLANDA, Sérgio Buarque de. Raízes do Brasil (1936).',
    tags: ['história', 'corrupção', 'estado', 'administração pública', 'cidadania', 'leis']
  },
  {
    id: 'rep-hans-jonas',
    titulo: 'Princípio Responsabilidade e Ética para o Futuro',
    autor: 'Hans Jonas (1903–1993)',
    categoria: 'ambiente',
    conceito: 'Responsabilidade Intergeracional diante do Avanço Técnico',
    explicacao: 'O filósofo alemão Hans Jonas propõe que, diante do poder destrutivo da tecnologia moderna sobre a natureza, a ética deve guiar-se pelo "Princípio Responsabilidade": agir de modo que os efeitos de nossa ação sejam compatíveis com a permanência de uma vida humana autêntica na Terra.',
    aplicacao: 'À luz de Hans Jonas, na obra "O Princípio Responsabilidade", o desenvolvimento econômico e tecnológico deve submeter-se ao dever ético de preservar as condições ambientais para as presentes e futuras gerações, em consonância com o artigo 225 da CF/88.',
    fonte: 'JONAS, Hans. O Princípio Responsabilidade: ensaio de uma ética para a civilização tecnológica (1979).',
    tags: ['meio ambiente', 'sustentabilidade', 'clima', 'desastres', 'tecnologia', 'futuro']
  },
  {
    id: 'rep-amartya-sen',
    titulo: 'Desenvolvimento como Liberdade e Capacidades Humanas',
    autor: 'Amartya Sen (1933–)',
    categoria: 'economia',
    conceito: 'Pobreza como Privação de Capacidades Básicas',
    explicacao: 'Vencedor do Prêmio Nobel de Economia, Amartya Sen demonstra que o verdadeiro desenvolvimento de uma nação não se mede apenas pelo PIB, mas pela expansão das liberdades substantivas e capacidades reais das pessoas (acesso à educação de qualidade, saúde, segurança e participação cívica).',
    aplicacao: 'Para o economista Amartya Sen, em "Desenvolvimento como Liberdade", o progresso de um país exige remover as privações que limitam as capacidades humanas, tais como a precariedade educacional, a insegurança e a exclusão produtiva.',
    fonte: 'SEN, Amartya. Desenvolvimento como Liberdade (Development as Freedom, 1999).',
    tags: ['economia', 'desigualdade', 'educação', 'saúde', 'trabalho', 'pobreza', 'desenvolvimento']
  },
  {
    id: 'rep-shoshana-zuboff',
    titulo: 'Capitalismo de Vigilância e Algoritmos Digitais',
    autor: 'Shoshana Zuboff (1951–)',
    categoria: 'tecnologia',
    conceito: 'Extração de Dados Comportamentais e Modulação de Condutas',
    explicacao: 'A pesquisadora e professora de Harvard Shoshana Zuboff analisa como grandes plataformas digitais coletam massivamente dados pessoais para prever e direcionar o comportamento dos usuários, impactando a privacidade, a democracia e a autonomia individual.',
    aplicacao: 'Conforme analisa Shoshana Zuboff em "A Era do Capitalismo de Vigilância", a coleta massiva de dados e a arquitetura algorítmica das redes não são neutras, exigindo regulamentação protetiva e educação digital dos cidadãos.',
    fonte: 'ZUBOFF, Shoshana. A Era do Capitalismo de Vigilância (2019).',
    tags: ['tecnologia', 'algoritmos', 'redes sociais', 'privacidade', 'lgpd', 'cibercrimes', 'inteligência artificial']
  },
  {
    id: 'rep-lei-susp',
    titulo: 'Sistema Único de Segurança Pública (SUSP)',
    autor: 'Legislação Federal Brasileira',
    categoria: 'seguranca',
    conceito: 'Integração Operacional, Inteligência e Prevenção Social da Violência',
    explicacao: 'A Lei nº 13.675/2018 instituiu o Sistema Único de Segurança Pública (SUSP), estabelecendo a atuação integrada, cooperativa e sistêmica dos órgãos de segurança pública (Polícias Militares, Polícias Civis, Corpos de Bombeiros e Polícia Científica) com foco em inteligência, estatística e prevenção.',
    aplicacao: 'A Lei nº 13.675/2018, que instituiu o Sistema Único de Segurança Pública (SUSP), preconiza a integração de inteligência e o compartilhamento de dados entre as forças policiais como diretriz essencial para o enfrentamento qualificado à criminalidade.',
    fonte: 'BRASIL. Lei nº 13.675, de 11 de junho de 2018 (Institui o SUSP).',
    tags: ['susp', 'polícia', 'integração', 'inteligência', 'segurança pública', 'pmpe', 'pcpe', 'cbmpe', 'pmsp']
  },
  {
    id: 'rep-lei-maria-da-penha',
    titulo: 'Lei Maria da Penha e Enfrentamento à Violência Doméstica',
    autor: 'Legislação Federal Brasileira',
    categoria: 'direito',
    conceito: 'Proteção Integral da Mulher e Medidas Protetivas de Urgência',
    explicacao: 'A Lei nº 11.340/2006 criou mecanismos para coibir e prevenir a violência doméstica e familiar contra a mulher (física, psicológica, sexual, patrimonial e moral), articulando Polícia Judiciária, Polícia Militar, Ministério Público, Defensoria e Poder Judiciário.',
    aplicacao: 'O fortalecimento da rede de proteção prevista na Lei nº 11.340/2006 (Lei Maria da Penha), aliado à fiscalização rigorosa das medidas protetivas de urgência, é indispensável para interromper o ciclo da violência doméstica e prevenir o feminicídio.',
    fonte: 'BRASIL. Lei nº 11.340, de 7 de agosto de 2006 (Lei Maria da Penha).',
    tags: ['mulheres', 'violência doméstica', 'feminicídio', 'polícia', 'direitos humanos']
  },
  {
    id: 'rep-lei-uso-forca',
    titulo: 'Uso Progressivo da Força e Instrumentos de Menor Potencial Ofensivo',
    autor: 'Legislação Federal Brasileira',
    categoria: 'seguranca',
    conceito: 'Princípios da Legalidade, Necessidade, Proporcionalidade e Moderação',
    explicacao: 'A Lei nº 13.060/2014 disciplina o uso dos instrumentos de menor potencial ofensivo pelos agentes de segurança pública em todo o território nacional, determinando que a força policial deve priorizar a preservação da vida e a redução da letalidade.',
    aplicacao: 'Nos termos da Lei nº 13.060/2014, a atuação dos agentes de segurança pública deve pautar-se pelos princípios da legalidade, necessidade, razoabilidade e proporcionalidade, priorizando meios de menor potencial ofensivo e a preservação da vida.',
    fonte: 'BRASIL. Lei nº 13.060, de 22 de dezembro de 2014.',
    tags: ['força policial', 'direitos humanos', 'pmpe', 'pmsp', 'abordagem', 'legalidade']
  },
  {
    id: 'rep-pnpdec',
    titulo: 'Política Nacional de Proteção e Defesa Civil (PNPDEC)',
    autor: 'Legislação Federal Brasileira',
    categoria: 'ambiente',
    conceito: 'Prevenção, Mitigação, Preparação, Resposta e Recuperação em Desastres',
    explicacao: 'A Lei nº 12.608/2012 institui a Política Nacional de Proteção e Defesa Civil, determinando que União, Estados e Municípios atuem de forma articulada no mapeamento de áreas de risco, ordenamento territorial e prevenção de desastres socioambientais.',
    aplicacao: 'Conforme estabelece a Lei nº 12.608/2012 (Política Nacional de Proteção e Defesa Civil), a gestão de eventos climáticos extremos exige não apenas resposta emergencial dos Corpos de Bombeiros, mas planejamento preventivo e mapeamento de áreas de risco.',
    fonte: 'BRASIL. Lei nº 12.608, de 10 de abril de 2012.',
    tags: ['defesa civil', 'bombeiros', 'cbmpe', 'desastres', 'clima', 'enchentes', 'meio ambiente']
  },
  {
    id: 'rep-lgpd-marco-civil',
    titulo: 'Marco Civil da Internet e Lei Geral de Proteção de Dados (LGPD)',
    autor: 'Legislação Federal Brasileira',
    categoria: 'tecnologia',
    conceito: 'Neutralidade da Rede, Responsabilidade Civil e Autodeterminação Informativa',
    explicacao: 'A Lei nº 12.965/2014 (Marco Civil da Internet) e a Lei nº 13.709/2018 (LGPD) regulamentam os direitos e deveres no uso da internet no Brasil e a proteção dos dados pessoais como garantia fundamental da privacidade e da liberdade.',
    aplicacao: 'Diante da expansão dos crimes digitais, a aplicação rigorosa do Marco Civil da Internet (Lei nº 12.965/2014) e da Lei Geral de Proteção de Dados (Lei nº 13.709/2018) mostra-se essencial para tutelar a privacidade e responsabilizar ilícitos cibernéticos.',
    fonte: 'BRASIL. Lei nº 12.965/2014 e Lei nº 13.709/2018.',
    tags: ['internet', 'dados', 'privacidade', 'cibercrimes', 'tecnologia', 'redes sociais']
  },
  {
    id: 'rep-oms-saude',
    titulo: 'Conceito Integral de Saúde da Organização Mundial da Saúde',
    autor: 'Organização Mundial da Saúde (OMS / ONU)',
    categoria: 'saude',
    conceito: 'Saúde como Completo Bem-Estar Físico, Mental e Social',
    explicacao: 'Na Constituição da Organização Mundial da Saúde (1946), a saúde é definida não apenas como a ausência de doenças ou enfermidades, mas como um estado de completo bem-estar físico, mental e social, diretamente influenciado pelos determinantes sociais.',
    aplicacao: 'De acordo com a Constituição da Organização Mundial da Saúde (OMS), a saúde compreende o pleno bem-estar físico, mental e social, razão pela qual a negligência com os fatores socioambientais e psíquicos compromete o direito previsto no artigo 196 da CF/88.',
    fonte: 'OMS. Constituição da Organização Mundial da Saúde (1946) e BRASIL, CF/88, Art. 196.',
    tags: ['saúde', 'saúde mental', 'sus', 'bem-estar', 'qualidade de vida', 'saneamento']
  },
  {
    id: 'rep-eca-estatuto-idoso',
    titulo: 'Doutrina da Proteção Integral de Crianças, Adolescentes e Idosos',
    autor: 'Legislação Federal Brasileira',
    categoria: 'direito',
    conceito: 'Prioridade Absoluta e Responsabilidade Solidária (Família, Sociedade e Estado)',
    explicacao: 'O artigo 227 da CF/88, o Estatuto da Criança e do Adolescente (Lei nº 8.069/1990) e o Estatuto da Pessoa Idosa (Lei nº 10.741/2003) consagram o dever compartilhado da família, da sociedade e do Estado de proteger com absoluta prioridade os grupos etários vulneráveis.',
    aplicacao: 'Em observância ao artigo 227 da Constituição Federal e ao Estatuto da Criança e do Adolescente (Lei nº 8.069/1990), cabe à família, à sociedade e ao Estado assegurar, com absoluta prioridade, a proteção integral da juventude frente às vulnerabilidades contemporâneas.',
    fonte: 'BRASIL. CF/88, Art. 227 e Art. 230; Lei nº 8.069/1990 (ECA); Lei nº 10.741/2003.',
    tags: ['infância', 'adolescência', 'idosos', 'família', 'educação', 'vulnerabilidade']
  }
,
  {
    "id": "rep-cf88-art5",
    "titulo": "Igualdade Formal e Direitos Fundamentais (Art. 5º)",
    "autor": "Assembleia Nacional Constituinte (Brasil)",
    "categoria": "direito",
    "conceito": "Isonomia Material e Inviolabilidade dos Direitos",
    "explicacao": "O artigo 5º da CF/88 proclama que todos são iguais perante a lei, sem distinção de qualquer natureza, garantindo-se a inviolabilidade do direito à vida, à liberdade, à igualdade, à segurança e à propriedade.",
    "aplicacao": "À luz do artigo 5º da Constituição Federal de 1988, a igualdade de todos perante a lei é garantia basilar do Estado Democrático de Direito; todavia, desigualdades históricas perpetuam a vulnerabilidade de grupos marginalizados.",
    "fonte": "BRASIL. Constituição da República Federativa do Brasil de 1988, Art. 5º, caput.",
    "tags": [
      "igualdade",
      "direitos fundamentais",
      "isonomia",
      "constituição",
      "cidadania",
      "liberdade"
    ]
  },
  {
    "id": "rep-cf88-art225",
    "titulo": "Direito ao Meio Ambiente Ecologicamente Equilibrado (Art. 225)",
    "autor": "Assembleia Nacional Constituinte (Brasil)",
    "categoria": "direito",
    "conceito": "Bem de Uso Comum do Povo e Solidariedade Intergeracional",
    "explicacao": "O artigo 225 da Carta Magna consagra o direito ao meio ambiente ecologicamente equilibrado, impondo ao Poder Público e à coletividade o dever de defendê-lo e preservá-lo para as presentes e futuras gerações.",
    "aplicacao": "Conforme preceitua o artigo 225 da Constituição de 1988, o meio ambiente sadio é direito difuso inalienável, competindo ao Estado e à sociedade civil coibir práticas predatórias que comprometam as futuras gerações.",
    "fonte": "BRASIL. Constituição da República Federativa do Brasil de 1988, Art. 225.",
    "tags": [
      "meio ambiente",
      "sustentabilidade",
      "constituição",
      "gerações futuras",
      "políticas públicas"
    ]
  },
  {
    "id": "rep-cf88-art196",
    "titulo": "Saúde como Direito de Todos e Dever do Estado (Art. 196)",
    "autor": "Assembleia Nacional Constituinte (Brasil)",
    "categoria": "direito",
    "conceito": "Universalidade e Acesso Igualitário aos Serviços de Saúde",
    "explicacao": "O artigo 196 da CF/88 determina que a saúde é direito de todos e dever do Estado, garantido mediante políticas sociais e econômicas que visem à redução do risco de doença e ao acesso universal e igualitário.",
    "aplicacao": "O artigo 196 da Constituição Federal estabelece a saúde como prerrogativa universal e dever estatal indeclinável, o que evidencia a urgência de fortalecer a atenção primária e o atendimento em regiões periféricas.",
    "fonte": "BRASIL. Constituição da República Federativa do Brasil de 1988, Art. 196.",
    "tags": [
      "saúde",
      "sus",
      "dever do estado",
      "constituição",
      "direitos sociais",
      "acesso"
    ]
  },
  {
    "id": "rep-dudh-1948",
    "titulo": "Declaração Universal dos Direitos Humanos (1948)",
    "autor": "Organização das Nações Unidas (ONU)",
    "categoria": "direito",
    "conceito": "Universalidade, Indivisibilidade e Interdependência dos Direitos",
    "explicacao": "Adotada em 1948 pela Assembleia Geral da ONU, a DUDH estabelece que todo ser humano nasce livre e igual em dignidade e direitos, constituindo marco normativo global contra a tirania e a opressão.",
    "aplicacao": "Proclamada pela ONU em 1948, a Declaração Universal dos Direitos Humanos assevera que a liberdade e a dignidade pertencem a todos os indivíduos, exigindo o repúdio a qualquer forma de discriminação institucional.",
    "fonte": "ONU. Declaração Universal dos Direitos Humanos (1948), Artigo 1º.",
    "tags": [
      "direitos humanos",
      "onu",
      "dignidade",
      "universalidade",
      "justiça internacional"
    ]
  },
  {
    "id": "rep-estatuto-pcd",
    "titulo": "Estatuto da Pessoa com Deficiência (Lei nº 13.146/2015)",
    "autor": "Congresso Nacional do Brasil",
    "categoria": "direito",
    "conceito": "Acessibilidade, Desenho Universal e Autonomia Cidadã",
    "explicacao": "A Lei Brasileira de Inclusão da Pessoa com Deficiência redefine a deficiência sob o modelo social (biopsicossocial), atribuindo as barreiras ao meio ambiente e não ao indivíduo, exigindo acessibilidade integral.",
    "aplicacao": "Nos termos da Lei Brasileira de Inclusão (Lei nº 13.146/2015), as limitações não residem na pessoa com deficiência, mas nas barreiras arquitetônicas e atitudinais impostas por uma sociedade que ainda falha em garantir acessibilidade.",
    "fonte": "BRASIL. Lei nº 13.146, de 6 de julho de 2015 (Estatuto da Pessoa com Deficiência).",
    "tags": [
      "inclusão",
      "acessibilidade",
      "pcd",
      "cidadania",
      "igualdade de oportunidades"
    ]
  },
  {
    "id": "rep-lei-execucao-penal",
    "titulo": "Lei de Execução Penal (Lei nº 7.210/1984 - LEP)",
    "autor": "Congresso Nacional do Brasil",
    "categoria": "direito",
    "conceito": "Humanização da Pena e Efetiva Ressocialização do Apenado",
    "explicacao": "A LEP prevê que o objetivo da execução penal é efetivar as disposições da sentença condenatória e proporcionar condições para a harmônica integração social do condenado e do internado.",
    "aplicacao": "Conforme dispõe a Lei de Execução Penal (Lei nº 7.210/1984), a sanção estatal deve conciliar punição e reintegração social; no entanto, a superlotação carcerária contraria a finalidade ressocializadora da lei.",
    "fonte": "BRASIL. Lei nº 7.210, de 11 de julho de 1984 (LEP), Art. 1º.",
    "tags": [
      "sistema prisional",
      "ressocialização",
      "lep",
      "direitos humanos",
      "justiça"
    ]
  },
  {
    "id": "rep-cf88-art205",
    "titulo": "Educação como Direito Público Subjetivo (Art. 205 da CF/88)",
    "autor": "Assembleia Nacional Constituinte (Brasil)",
    "categoria": "direito",
    "conceito": "Pleno Desenvolvimento da Pessoa e Preparo para o Exercício da Cidadania",
    "explicacao": "O artigo 205 estabelece a educação como direito de todos e dever do Estado e da família, visando ao pleno desenvolvimento da pessoa, seu preparo para a cidadania e sua qualificação para o trabalho.",
    "aplicacao": "Em conformidade com o artigo 205 da Constituição Federal, a educação é pilar de emancipação e exercício da cidadania, tornando inaceitável a persistência de abismos na qualidade do ensino entre diferentes estratos sociais.",
    "fonte": "BRASIL. Constituição da República Federativa do Brasil de 1988, Art. 205.",
    "tags": [
      "educação",
      "cidadania",
      "constituição",
      "desenvolvimento humano",
      "escola"
    ]
  },
  {
    "id": "rep-max-weber-forca",
    "titulo": "O Monopólio Legítimo da Força Física pelo Estado",
    "autor": "Max Weber (1864–1920)",
    "categoria": "seguranca",
    "conceito": "Legitimidade, Racionalidade Jurídica e Limites da Coação Estatal",
    "explicacao": "Na conferência \"A Política como Vocação\", o sociólogo alemão Max Weber define o Estado moderno como a comunidade humana que reivindica, nos limites de um território, o monopólio do uso legítimo da força física subordinado à lei.",
    "aplicacao": "Segundo o sociólogo Max Weber, o Estado detém o monopólio legítimo da coação física; todavia, a legitimidade dessa prerrogativa depende da estrita observância da legalidade e do controle democrático da atuação policial.",
    "fonte": "WEBER, Max. Ciência e Política: duas vocações (1919).",
    "tags": [
      "weber",
      "monopólio da força",
      "estado",
      "polícia",
      "legalidade",
      "ordem pública"
    ]
  },
  {
    "id": "rep-teoria-janelas-quebradas",
    "titulo": "Teoria das Janelas Quebradas (Broken Windows Theory)",
    "autor": "James Q. Wilson e George L. Kelling (1982)",
    "categoria": "seguranca",
    "conceito": "Prevenção Primária da Desordem Urbana e Segurança Comunitária",
    "explicacao": "A teoria sustenta que sinais visíveis de desordem, vandalismo e negligência no espaço público incentivam pequenos delitos que gradativamente escalam para crimes graves se não houver pronta intervenção estatal.",
    "aplicacao": "De acordo com a Teoria das Janelas Quebradas, formulada por Wilson e Kelling, a desordem urbana e a sensação de abandono abrem margem para a escalada da criminalidade, reforçando a relevância do policiamento comunitário preventivo.",
    "fonte": "WILSON, James Q.; KELLING, George L. Broken Windows: The Police and Neighborhood Safety (1982).",
    "tags": [
      "policiamento comunitário",
      "prevenção",
      "ordem urbana",
      "segurança",
      "criminologia"
    ]
  },
  {
    "id": "rep-anuario-fbsp",
    "titulo": "Anuário Brasileiro de Segurança Pública",
    "autor": "Fórum Brasileiro de Segurança Pública (FBSP)",
    "categoria": "seguranca",
    "conceito": "Evidências Científicas e Diagnóstico Estatístico da Violência",
    "explicacao": "Publicação de referência que compila dados oficiais de criminalidade, letalidade violenta, violência contra a mulher e sistema penitenciário de todas as unidades federativas do país.",
    "aplicacao": "Dados do Anuário Brasileiro de Segurança Pública evidenciam a necessidade premente de substituir políticas reativas por investimentos em inteligência policial, perícia técnica e programas de proteção à juventude vulnerável.",
    "fonte": "FÓRUM BRASILEIRO DE SEGURANÇA PÚBLICA (FBSP). Anuário Brasileiro de Segurança Pública.",
    "tags": [
      "estatísticas",
      "fbsp",
      "criminalidade",
      "inteligência policial",
      "dados oficiais"
    ]
  },
  {
    "id": "rep-atlas-violencia-ipea",
    "titulo": "Atlas da Violência (IPEA / FBSP)",
    "autor": "Instituto de Pesquisa Econômica Aplicada (IPEA)",
    "categoria": "seguranca",
    "conceito": "Vulnerabilidade Social e Perfil das Vítimas de Violência Letal",
    "explicacao": "O relatório anual do IPEA mapeia a dinâmica dos homicídios no Brasil, demonstrando que a violência armada incide desproporcionalmente sobre jovens pretos e pardos de baixa renda das periferias urbanas.",
    "aplicacao": "Conforme revela o Atlas da Violência, elaborado pelo IPEA, a letalidade violenta no Brasil atinge de forma seletiva a juventude negra e periférica, demonstrando que a segurança pública não se dissocia do enfrentamento da desigualdade social.",
    "fonte": "IPEA; FBSP. Atlas da Violência (edições anuais).",
    "tags": [
      "atlas da violência",
      "ipea",
      "juventude",
      "desigualdade",
      "homicídios",
      "periferia"
    ]
  },
  {
    "id": "rep-estatuto-desarmamento",
    "titulo": "Estatuto do Desarmamento (Lei nº 10.826/2003)",
    "autor": "Congresso Nacional do Brasil",
    "categoria": "seguranca",
    "conceito": "Regulação, Registro e Controle Social de Armas e Munições",
    "explicacao": "Marco legislativo que regulamentou a posse e o porte de armas de fogo no Brasil, estabelecendo critérios rigorosos com o objetivo de conter os índices de homicídios e violência armada.",
    "aplicacao": "A promulgação do Estatuto do Desarmamento (Lei nº 10.826/2003) consolidou o entendimento científico de que a circulação descontrolada de armas de fogo potencializa crimes letais e agrava conflitos interpessoais.",
    "fonte": "BRASIL. Lei nº 10.826, de 22 de dezembro de 2003.",
    "tags": [
      "armas",
      "desarmamento",
      "homicídios",
      "violência armada",
      "legislação penal"
    ]
  },
  {
    "id": "rep-loic-wacquant",
    "titulo": "As Prisões da Miséria e a Gestão Punitiva da Pobreza",
    "autor": "Loïc Wacquant (1960–presente)",
    "categoria": "seguranca",
    "conceito": "Hiperencarceramento e Substituição do Estado Social pelo Estado Penal",
    "explicacao": "O sociólogo francês analisa como a retração das redes de proteção social (Estado de bem-estar) estimula a hipertrofia do sistema prisional, transformando a cadeia em instrumento de contenção da miséria.",
    "aplicacao": "Em \"As Prisões da Miséria\", Loïc Wacquant alerta que o recuo dos investimentos sociais converte o encarceramento em ferramenta de gestão da pobreza, desvio que sobrecarrega as corporações de segurança sem resolver as causas do delito.",
    "fonte": "WACQUANT, Loïc. As Prisões da Miséria (2001).",
    "tags": [
      "sistema prisional",
      "encarceramento",
      "pobreza",
      "sociologia do crime",
      "estado penal"
    ]
  },
  {
    "id": "rep-lei-perseguicao-stalking",
    "titulo": "Tipificação do Crime de Perseguição / Stalking (Lei nº 14.132/2021)",
    "autor": "Congresso Nacional do Brasil",
    "categoria": "seguranca",
    "conceito": "Proteção à Liberdade Pessoal e Privacidade contra Ameaças Físicas e Digitais",
    "explicacao": "Inseriu o artigo 147-A no Código Penal para criminalizar a conduta de perseguir alguém reiteradamente por qualquer meio, ameaçando a integridade física ou psicológica ou invadindo a esfera de liberdade.",
    "aplicacao": "A criminalização do \"stalking\" pela Lei nº 14.132/2021 reflete a adaptação necessária das forças de segurança diante das novas modalidades de coação psicológica e perseguição no ambiente virtual.",
    "fonte": "BRASIL. Lei nº 14.132, de 31 de março de 2021 (Art. 147-A do Código Penal).",
    "tags": [
      "perseguição",
      "stalking",
      "segurança digital",
      "violência contra mulher",
      "código penal"
    ]
  },
  {
    "id": "rep-aristoteles-politica",
    "titulo": "O Homem como Animal Político e a Justiça Distributiva",
    "autor": "Aristóteles (384 a.C.–322 a.C.)",
    "categoria": "filosofia",
    "conceito": "Zoon Politikon e Equidade Social",
    "explicacao": "Em \"A Política\" e \"Ética a Nicômaco\", Aristóteles postula que o ser humano só se realiza plenamente na vida comunitária (Polis) e que a justiça consiste em tratar igualmente os iguais e desigualmente os desiguais, na medida de sua desigualdade.",
    "aplicacao": "Para Aristóteles, o indivíduo é um ser naturalmente político cuja plena dignidade requer a convivência cidadã na Polis; quando o Estado falha na justiça distributiva, compromete a própria harmonia social.",
    "fonte": "ARISTÓTELES. A Política; Ética a Nicômaco (Livro V).",
    "tags": [
      "aristóteles",
      "justiça",
      "ética",
      "cidadania",
      "polis",
      "bem comum"
    ]
  },
  {
    "id": "rep-john-locke-direitos",
    "titulo": "Direitos Naturais Inalienáveis e Limites do Poder Político",
    "autor": "John Locke (1632–1704)",
    "categoria": "filosofia",
    "conceito": "Direito à Vida, à Liberdade e à Propriedade como Limite Estatal",
    "explicacao": "Pai do liberalismo político clássico, Locke assevera que os direitos à vida, à liberdade e aos bens são inatos ao ser humano, devendo o governo civil ser dissolvido ou reformado caso viole essa confiança fundamental.",
    "aplicacao": "Conforme concebeu John Locke no \"Segundo Tratado sobre o Governo Civil\", o Poder Público é instituído para proteger os direitos inatos à vida e à liberdade, sendo ilegítima qualquer inércia que exponha os governados ao desamparo.",
    "fonte": "LOCKE, John. Segundo Tratado sobre o Governo Civil (1689).",
    "tags": [
      "locke",
      "direitos naturais",
      "liberdade",
      "contrato social",
      "estado",
      "filosofia"
    ]
  },
  {
    "id": "rep-rousseau-contrato",
    "titulo": "A Vontade Geral e a Soberania Popular",
    "autor": "Jean-Jacques Rousseau (1712–1778)",
    "categoria": "filosofia",
    "conceito": "Vontade Geral, Desigualdade e Cidadania Participativa",
    "explicacao": "Em \"Do Contrato Social\", Rousseau afirma que a soberania reside no povo e que a lei deve expressar o interesse coletivo (Vontade Geral), condenando as desigualdades artificiais criadas pela concentração de poder.",
    "aplicacao": "À luz da teoria do filósofo iluminista Jean-Jacques Rousseau, as instituições devem exprimir a vontade geral e priorizar o interesse público sobre privilégios corporativos ou privados.",
    "fonte": "ROUSSEAU, Jean-Jacques. Do Contrato Social (1762).",
    "tags": [
      "rousseau",
      "vontade geral",
      "democracia",
      "soberania",
      "desigualdade",
      "pacto social"
    ]
  },
  {
    "id": "rep-habermas-comunicativa",
    "titulo": "A Teoria da Ação Comunicativa e a Esfera Pública",
    "autor": "Jürgen Habermas (1929–presente)",
    "categoria": "filosofia",
    "conceito": "Racionalidade Dialógica e Democracia Deliberativa",
    "explicacao": "O filósofo alemão propõe que a legitimidade das normas decorre do debate público livre de coerções, no qual argumentos racionais são confrontados para alcançar o consenso democrático.",
    "aplicacao": "Sob a ótica de Jürgen Habermas em sua Teoria da Ação Comunicativa, a superação de impasses sociais demanda uma esfera pública inclusiva, onde o diálogo racional substitua o autoritarismo e a intolerância.",
    "fonte": "HABERMAS, Jürgen. Teoria do Agir Comunicativo (1981).",
    "tags": [
      "habermas",
      "esfera pública",
      "democracia",
      "diálogo",
      "comunicação",
      "ética"
    ]
  },
  {
    "id": "rep-sartre-responsabilidade",
    "titulo": "A Condenação à Liberdade e a Responsabilidade Universal",
    "autor": "Jean-Paul Sartre (1905–1980)",
    "categoria": "filosofia",
    "conceito": "Existencialismo e Escolha Ética",
    "explicacao": "Ao sustentar que a \"existência precede a essência\", Sartre pontua que o homem não pode transferir para o destino ou para outrem a culpa de suas ações: ao escolher a si mesmo, o indivíduo engaja toda a humanidade.",
    "aplicacao": "Como sintetizou o filósofo existencialista Jean-Paul Sartre, ao fazer uma escolha, o ser humano responsabiliza-se perante toda a sociedade, tornando a omissão cívica uma escolha política com consequências diretas na coletividade.",
    "fonte": "SARTRE, Jean-Paul. O Existencialismo é um Humanismo (1946).",
    "tags": [
      "sartre",
      "existencialismo",
      "liberdade",
      "responsabilidade",
      "ética",
      "sociedade"
    ]
  },
  {
    "id": "rep-schopenhauer-etica",
    "titulo": "A Compaixão como Fundamento da Moralidade",
    "autor": "Arthur Schopenhauer (1788–1860)",
    "categoria": "filosofia",
    "conceito": "Superação do Egoísmo e Empatia com o Sofrimento do Outro",
    "explicacao": "Schopenhauer defende que a verdadeira moralidade não nasce do dever frio, mas do sentimento de compaixão imediata diante da dor e da vulnerabilidade de outros seres humanos.",
    "aplicacao": "Segundo a reflexão ética de Arthur Schopenhauer, a compaixão e o reconhecimento do sofrimento alheio constituem a base indispensável da justiça, desafiando a indiferença social diante das vulnerabilidades urbanas.",
    "fonte": "SCHOPENHAUER, Arthur. Sobre o Fundamento da Moral (1840).",
    "tags": [
      "ética",
      "empatia",
      "moral",
      "compaixão",
      "vulnerabilidade",
      "filosofia"
    ]
  },
  {
    "id": "rep-pierre-bourdieu",
    "titulo": "A Violência Simbólica e a Reprodução Social",
    "autor": "Pierre Bourdieu (1930–2002)",
    "categoria": "sociologia",
    "conceito": "Capital Cultural, Habitus e Dominação Invisível",
    "explicacao": "Bourdieu demonstra como as estruturas dominantes impõem significados e hierarquias sem recorrer à força física, fazendo com que as próprias vítimas naturalizem sua condição de subordinação.",
    "aplicacao": "De acordo com o sociólogo Pierre Bourdieu, a violência simbólica se consolida quando desigualdades sociais são naturalizadas pela sociedade, perpetuando desvantagens históricas sem necessidade de coação física explícita.",
    "fonte": "BOURDIEU, Pierre. A Reprodução: elementos para uma teoria do sistema de ensino (1970).",
    "tags": [
      "bourdieu",
      "violência simbólica",
      "capital cultural",
      "reprodução social",
      "desigualdade"
    ]
  },
  {
    "id": "rep-djamila-ribeiro",
    "titulo": "O Lugar de Fala e a Desconstrução de Silenciamentos",
    "autor": "Djamila Ribeiro (1980–presente)",
    "categoria": "sociologia",
    "conceito": "Epistemologia Crítica e Democratização do Discurso",
    "explicacao": "A filósofa e socióloga brasileira examina as condições sociais que historicamente determinaram quem tinha autorização para falar e quem era silenciado, defendendo a pluralidade de vozes nas decisões públicas.",
    "aplicacao": "Conforme analisa a pensadora Djamila Ribeiro em \"O que é lugar de fala?\", as políticas públicas tornam-se ineficazes quando desconsideram a escuta direta dos grupos que vivenciam as vulnerabilidades na pele.",
    "fonte": "RIBEIRO, Djamila. O que é lugar de fala? (2017).",
    "tags": [
      "djamila ribeiro",
      "lugar de fala",
      "minorias",
      "cidadania",
      "democracia",
      "direitos"
    ]
  },
  {
    "id": "rep-darcy-ribeiro",
    "titulo": "O Povo Brasileiro e a Fratura das Desigualdades",
    "autor": "Darcy Ribeiro (1922–1997)",
    "categoria": "sociologia",
    "conceito": "Matriz Étnica, Colonização e a Dívida Social Histórica",
    "explicacao": "Em sua obra clássica, o antropólogo Darcy Ribeiro descreve a formação do povo brasileiro a partir da confluência de matrizes indígenas, africanas e europeias, denunciando o descaso das elites com a educação e com o bem-estar popular.",
    "aplicacao": "Em \"O Povo Brasileiro\", Darcy Ribeiro advertiu que as carências educacionais e sociais do país decorrem de um projeto deliberado de exclusão, cuja reversão exige compromisso prioritário do Estado com as maiorias populares.",
    "fonte": "RIBEIRO, Darcy. O Povo Brasileiro: a formação e o sentido do Brasil (1995).",
    "tags": [
      "darcy ribeiro",
      "formação do brasil",
      "identidade",
      "povo brasileiro",
      "educação",
      "desigualdade"
    ]
  },
  {
    "id": "rep-bauman-cegueira",
    "titulo": "Cegueira Moral e a Perda da Sensibilidade na Contemporaneidade",
    "autor": "Zygmunt Bauman e Leonidas Donskis",
    "categoria": "sociologia",
    "conceito": "Adiaforização e Naturalização da Indiferença",
    "explicacao": "Bauman analisa o fenômeno da adiaforização: o distanciamento moral em relação ao sofrimento de terceiros, no qual problemas humanos graves passam a ser tratados como estatísticas impessoais.",
    "aplicacao": "Na obra \"Cegueira Moral\", Zygmunt Bauman diagnostica a anestesia da empatia na contemporaneidade, na qual a dor dos invisibilizados é normalizada e tratada como mera externalidade urbana.",
    "fonte": "BAUMAN, Zygmunt; DONSKIS, Leonidas. Cegueira Moral: a perda da sensibilidade na modernidade líquida (2013).",
    "tags": [
      "bauman",
      "cegueira moral",
      "empatia",
      "indiferença",
      "ética social",
      "modernidade"
    ]
  },
  {
    "id": "rep-norbert-elias",
    "titulo": "O Processo Civilizador e o Autocontrole dos Conflitos",
    "autor": "Norbert Elias (1897–1990)",
    "categoria": "sociologia",
    "conceito": "Controle de Pulsões, Relações Interpessoais e Pacificação Social",
    "explicacao": "O sociólogo alemão estuda como a transição histórica para sociedades pacíficas esteve vinculada à internalização de regras de autocontrole individual e à centralização da justiça pelo Estado.",
    "aplicacao": "Segundo a perspectiva de Norbert Elias em \"O Processo Civilizador\", a maturidade democrática exige a substituição de desfechos violentos pelo autocontrole cívico e pela confiança nas instituições legais.",
    "fonte": "ELIAS, Norbert. O Processo Civilizador (1939).",
    "tags": [
      "norbert elias",
      "processo civilizador",
      "violência",
      "pacificação",
      "cultura cívica"
    ]
  },
  {
    "id": "rep-ulrich-beck-risco",
    "titulo": "A Sociedade de Risco Global",
    "autor": "Ulrich Beck (1944–2015)",
    "categoria": "sociologia",
    "conceito": "Incertezas Manufaturadas e Ameaças Tecnológicas e Ambientais",
    "explicacao": "Beck formula que a modernidade contemporânea produz riscos globais (climáticos, industriais, nucleares e biológicos) que não respeitam fronteiras nacionais nem classes sociais, exigindo governança cooperativa.",
    "aplicacao": "Consoante a tese da Sociedade de Risco de Ulrich Beck, as decisões de gestão pública devem pautar-se pela precaução científica, haja vista que os danos socioambientais e tecnológicos afetam toda a coletividade.",
    "fonte": "BECK, Ulrich. Sociedade de Risco: rumo a uma outra modernidade (1986).",
    "tags": [
      "ulrich beck",
      "sociedade de risco",
      "modernidade",
      "meio ambiente",
      "tecnologia"
    ]
  },
  {
    "id": "rep-ldb-9394",
    "titulo": "Lei de Diretrizes e Bases da Educação Nacional (LDB - Lei nº 9.394/1996)",
    "autor": "Congresso Nacional do Brasil",
    "categoria": "educacao",
    "conceito": "Gestão Democrática e Direito à Aprendizagem Significativa",
    "explicacao": "A LDB estabelece os princípios da educação brasileira, consagrando a igualdade de condições para acesso e permanência na escola, a liberdade de aprender e a valorização do profissional docente.",
    "aplicacao": "A Lei de Diretrizes e Bases da Educação Nacional (Lei nº 9.394/1996) assevera que o ensino deve vincular-se ao mundo do trabalho e à prática social, finalidade comprometida pela precariedade estrutural de muitas unidades de ensino.",
    "fonte": "BRASIL. Lei nº 9.394, de 20 de dezembro de 1996 (LDB).",
    "tags": [
      "ldb",
      "educação",
      "escola pública",
      "docência",
      "aprendizagem",
      "políticas educacionais"
    ]
  },
  {
    "id": "rep-anisio-teixeira",
    "titulo": "Escola Pública, Democrática e Integral",
    "autor": "Anísio Teixeira (1900–1971)",
    "categoria": "educacao",
    "conceito": "Educação Pública como Condição Inegociável da Democracia",
    "explicacao": "Líder do movimento dos Pioneiros da Educação Nova, Anísio Teixeira sustentava que a democracia só se sustenta sobre uma rede de escolas públicas, gratuitas, laicas e em tempo integral de excelente qualidade para todas as classes.",
    "aplicacao": "Como preconizava o educador Anísio Teixeira, \"só existirá democracia no Brasil no dia em que se montar no país a máquina que prepara as democracias: a escola pública de tempo integral\".",
    "fonte": "TEIXEIRA, Anísio. Educação não é privilégio (1957).",
    "tags": [
      "anísio teixeira",
      "escola pública",
      "democracia",
      "tempo integral",
      "educação"
    ]
  },
  {
    "id": "rep-plano-nacional-educacao",
    "titulo": "Plano Nacional de Educação (PNE - Lei nº 13.005/2014)",
    "autor": "Congresso Nacional do Brasil",
    "categoria": "educacao",
    "conceito": "Metas Decenais de Financiamento, Qualidade e Equidade Escolar",
    "explicacao": "Estabelece 20 metas decenais estratégicas para a educação básica e superior no Brasil, incluindo a erradicação do analfabetismo, a universalização do atendimento escolar e a aplicação de percentual do PIB em educação.",
    "aplicacao": "O descumprimento de metas basilares do Plano Nacional de Educação (Lei nº 13.005/2014) evidencia o subfinanciamento crônico do setor, obstáculo que amplia a defasagem entre o ensino público e o privado.",
    "fonte": "BRASIL. Lei nº 13.005, de 25 de junho de 2014 (Plano Nacional de Educação).",
    "tags": [
      "pne",
      "metas educacionais",
      "financiamento",
      "pib",
      "qualidade do ensino"
    ]
  },
  {
    "id": "rep-pisa-ocde",
    "titulo": "Programa Internacional de Avaliação de Estudantes (PISA / OCDE)",
    "autor": "Organização para a Cooperação e Desenvolvimento Econômico (OCDE)",
    "categoria": "educacao",
    "conceito": "Letramento Leitor, Científico e Matemático em Escala Comparada",
    "explicacao": "Avaliação internacional padronizada aplicada a jovens de 15 anos para mensurar a capacidade de aplicar conhecimentos escolares na resolução de problemas do cotidiano em sociedade.",
    "aplicacao": "Os relatórios periódicos do PISA, divulgados pela OCDE, demonstram a fragilidade do letramento leitor e do raciocínio analítico no Brasil, apontando para a urgência de reformulações curriculares e pedagógicas profundas.",
    "fonte": "OCDE. Programme for International Student Assessment (PISA).",
    "tags": [
      "pisa",
      "ocde",
      "leitura",
      "matemática",
      "avaliação educacional",
      "dados"
    ]
  },
  {
    "id": "rep-bell-hooks-ensinar",
    "titulo": "Ensinando a Transgredir: A Educação como Prática da Liberdade",
    "autor": "bell hooks (1952–2021)",
    "categoria": "educacao",
    "conceito": "Pedagogia Engajada, Afeto e Descolonização do Conhecimento",
    "explicacao": "A teórica e ativista propõe uma pedagogia participativa e engajada na qual a sala de aula se torna um espaço aberto para o pensamento crítico, a inclusão de identidades diversas e o bem-estar mútuo.",
    "aplicacao": "Em \"Ensinando a Transgredir\", a pensadora bell hooks ressalta que a educação deve transcender a memorização mecânica, operando como espaço acolhedor e libertador capaz de romper com silenciamentos históricos.",
    "fonte": "HOOKS, bell. Ensinando a Transgredir: a educação como prática da liberdade (1994).",
    "tags": [
      "bell hooks",
      "pedagogia crítica",
      "liberdade",
      "antirracismo",
      "inclusão"
    ]
  },
  {
    "id": "rep-vygotsky-interacao",
    "titulo": "A Teoria Histórico-Cultural e a Zona de Desenvolvimento Proximal",
    "autor": "Lev Vygotsky (1896–1934)",
    "categoria": "educacao",
    "conceito": "Mediação Social, Linguagem e Construção do Conhecimento",
    "explicacao": "Vygotsky comprova que o aprendizado humano é produto da mediação cultural e da interação social com outros indivíduos, destacando o papel indispensável do educador e do ambiente cooperativo.",
    "aplicacao": "Conforme a psicologia sociointeracionista de Lev Vygotsky, o conhecimento humano constrói-se na mediação com os pares e com o meio cultural, reforçando a importância de ambientes escolares estimulantes e colaborativos.",
    "fonte": "VYGOTSKY, Lev. A Formação Social da Mente (1978).",
    "tags": [
      "vygotsky",
      "interação social",
      "aprendizagem",
      "mediação",
      "desenvolvimento cognitivo"
    ]
  },
  {
    "id": "rep-john-dewey-democracia",
    "titulo": "Democracia e Educação: A Aprendizagem Prática pela Ação",
    "autor": "John Dewey (1859–1952)",
    "categoria": "educacao",
    "conceito": "Escola Progressista, Pensamento Crítico e \"Aprender Fazendo\"",
    "explicacao": "Dewey argumenta que a educação não é mera preparação para o futuro, mas a própria experiência vivida no presente, onde os estudantes aprendem a solucionar problemas reais cooperativamente.",
    "aplicacao": "Como afirmava o filósofo pragmatista John Dewey em \"Democracia e Educação\", a escola não deve ser um refúgio teórico isolado, mas um laboratório democrático onde os jovens aprendem a construir soluções para dilemas sociais reais.",
    "fonte": "DEWEY, John. Democracia e Educação (1916).",
    "tags": [
      "john dewey",
      "aprendizagem ativa",
      "democracia",
      "pensamento reflexivo"
    ]
  },
  {
    "id": "rep-rubem-alves",
    "titulo": "A Alegria de Ensinar e a Educação dos Sentidos",
    "autor": "Rubem Alves (1933–2014)",
    "categoria": "educacao",
    "conceito": "Curiosidade Epistêmica, Humanização Escolar e Afeto",
    "explicacao": "O pedagogo e escritor defende que o objetivo supremo da escola é despertar a curiosidade e o gosto pelo saber, transformando o ato de ensinar em uma experiência estética e humanizadora.",
    "aplicacao": "Nas palavras do educador Rubem Alves, \"ensinar é um exercício de imortalidade\", premissa que desafia o modelo escolar engessado e reafirma a urgência de cultivar o pensamento criativo nas salas de aula.",
    "fonte": "ALVES, Rubem. A Alegria de Ensinar (1994).",
    "tags": [
      "rubem alves",
      "humanização",
      "curiosidade",
      "leitura",
      "criatividade"
    ]
  },
  {
    "id": "rep-cieps-brizola-darcy",
    "titulo": "Os Centros Integrados de Educação Pública (CIEPs)",
    "autor": "Darcy Ribeiro e Leonel Brizola",
    "categoria": "educacao",
    "conceito": "Educação Integral com Alimentação, Saúde e Atividades Esportivas",
    "explicacao": "Projeto pioneiro implantado na década de 1980 no Rio de Janeiro (os \"Brizolões\") projetados por Oscar Niemeyer, que ofereciam jornada escolar de 8 horas com quatro refeições, assistência médica e odontológica.",
    "aplicacao": "A experiência histórica dos CIEPs, idealizados por Darcy Ribeiro, comprovou que a escola em tempo integral aliada a serviços básicos de nutrição e esporte é o mais potente antídoto contra a vulnerabilidade juvenil.",
    "fonte": "RIBEIRO, Darcy. O Livro dos CIEPs (1986).",
    "tags": [
      "ciep",
      "tempo integral",
      "darcy ribeiro",
      "nutrição escolar",
      "proteção social"
    ]
  },
  {
    "id": "rep-censo-escolar-inep",
    "titulo": "Censo Escolar da Educação Básica (INEP)",
    "autor": "Instituto Nacional de Estudos e Pesquisas Educacionais Anísio Teixeira (INEP)",
    "categoria": "educacao",
    "conceito": "Diagnóstico Infraestrutural, Evasão Escolar e Distorção Idade-Série",
    "explicacao": "Pesquisa estatística anual que mapeia a realidade de todas as escolas do país, apontando carências de bibliotecas, saneamento, laboratórios e internet de alta velocidade.",
    "aplicacao": "Registros do Censo Escolar do INEP revelam que milhares de escolas públicas brasileiras ainda carecem de bibliotecas, quadras esportivas e conectividade digital, impondo barreiras materiais ao pleno aprendizado.",
    "fonte": "BRASIL. INEP. Censo Escolar da Educação Básica (edições anuais).",
    "tags": [
      "censo escolar",
      "inep",
      "infraestrutura",
      "evasão escolar",
      "estatísticas"
    ]
  },
  {
    "id": "rep-ailton-krenak",
    "titulo": "Ideias para Adiar o Fim do Mundo",
    "autor": "Ailton Krenak (1953–presente)",
    "categoria": "ambiente",
    "conceito": "Crítica ao Antropocentrismo Predatório e Saberes Ancestrais",
    "explicacao": "O líder indígena e escritor denuncia a ilusão ocidental de que a humanidade é separada da natureza, demonstrando que a mercantilização desenfreada dos rios, florestas e solos ameaça a própria sobrevida da espécie humana.",
    "aplicacao": "Em \"Ideias para Adiar o Fim do Mundo\", Ailton Krenak adverte que a voracidade do consumo moderno transformou a Terra em mero almoxarifado de recursos, urgindo a reconciliação do ser humano com os ciclos naturais.",
    "fonte": "KRENAK, Ailton. Ideias para Adiar o Fim do Mundo (2019).",
    "tags": [
      "krenak",
      "indígena",
      "meio ambiente",
      "sustentabilidade",
      "antropoceno",
      "natureza"
    ]
  },
  {
    "id": "rep-pnrs-12305",
    "titulo": "Política Nacional de Resíduos Sólidos (PNRS - Lei nº 12.305/2010)",
    "autor": "Congresso Nacional do Brasil",
    "categoria": "ambiente",
    "conceito": "Responsabilidade Compartilhada, Logística Reversa e Economia Circular",
    "explicacao": "Determina a erradicação dos lixões a céu aberto, institui a logística reversa obrigatória para fabricantes e valoriza o papel econômico e social dos catadores de materiais recicláveis.",
    "aplicacao": "Conforme estabelece a Política Nacional de Resíduos Sólidos (Lei nº 12.305/2010), fabricantes, governos e consumidores compartilham a responsabilidade pelo ciclo de vida dos produtos, princípio indispensável para viabilizar a reciclagem em larga escala.",
    "fonte": "BRASIL. Lei nº 12.305, de 2 de agosto de 2010 (PNRS).",
    "tags": [
      "resíduos sólidos",
      "lixo",
      "reciclagem",
      "logística reversa",
      "saneamento",
      "pnrs"
    ]
  },
  {
    "id": "rep-codigo-florestal-12651",
    "titulo": "Código Florestal Brasileiro (Lei nº 12.651/2012)",
    "autor": "Congresso Nacional do Brasil",
    "categoria": "ambiente",
    "conceito": "Áreas de Preservação Permanente (APP) e Reserva Legal (RL)",
    "explicacao": "Regulamenta a proteção da vegetação nativa, nascentes, topos de morro e encostas, conciliando produção agrossilvipastoril sustentável com a conservação da biodiversidade e dos recursos hídricos.",
    "aplicacao": "Nos termos da Lei de Proteção da Vegetação Nativa (Lei nº 12.651/2012), a salvaguarda das Áreas de Preservação Permanente é requisito técnico indeclinável para conter deslizamentos, proteger mananciais e manter o equilíbrio climático.",
    "fonte": "BRASIL. Lei nº 12.651, de 25 de maio de 2012 (Código Florestal).",
    "tags": [
      "código florestal",
      "preservação",
      "nascentes",
      "desmatamento",
      "biodiversidade"
    ]
  },
  {
    "id": "rep-ipcc-clima",
    "titulo": "Relatórios do Painel Intergovernamental sobre Mudanças Climáticas (IPCC)",
    "autor": "Painel Intergovernamental sobre Mudanças Climáticas (IPCC / ONU)",
    "categoria": "ambiente",
    "conceito": "Aquecimento Global Antropogênico e Justiça Climática",
    "explicacao": "O corpo científico da ONU compila evidências irrefutáveis de que a queima de combustíveis fósseis e o desmatamento provocam eventos climáticos extremos mais frequentes e severos, afetando principalmente populações vulneráveis.",
    "aplicacao": "Os relatórios científicos do IPCC demonstram que as emissões de gases de efeito estufa aceleram eventos climáticos extremos (secas e enchentes), exigindo planos governamentais ambiciosos de mitigação e adaptação urbana.",
    "fonte": "IPCC; ONU. Climate Change Assessment Reports (AR6).",
    "tags": [
      "ipcc",
      "clima",
      "aquecimento global",
      "eventos extremos",
      "ciência",
      "onu"
    ]
  },
  {
    "id": "rep-desastres-mariana-brumadinho",
    "titulo": "Tragédias Socioambientais de Mariana (2015) e Brumadinho (2019)",
    "autor": "História Contemporânea Brasileira / Perícia Oficial",
    "categoria": "ambiente",
    "conceito": "Rompimento de Barragens de Rejeitos, Danos Ecossistêmicos e Falha na Fiscalização",
    "explicacao": "Os maiores desastres socioambientais e trabalhistas da história minerária do Brasil resultaram na morte de centenas de pessoas e na devastação das bacias dos rios Doce e Paraopeba, evidenciando fragilidades na fiscalização estatal.",
    "aplicacao": "As tragédias socioambientais de Mariana (2015) e Brumadinho (2019) evidenciaram os custos humanos e ecológicos da leniência regulatória, comprovando a urgência de auditorias técnicas rigorosas em atividades industriais de alto risco.",
    "fonte": "MINISTÉRIO PÚBLICO FEDERAL; POLÍCIA FEDERAL. Relatórios Periciais sobre Mariana e Brumadinho.",
    "tags": [
      "barragens",
      "mineração",
      "brumadinho",
      "mariana",
      "desastre ambiental",
      "fiscalização"
    ]
  },
  {
    "id": "rep-chico-mendes",
    "titulo": "Reservas Extrativistas e a Aliança dos Povos da Floresta",
    "autor": "Chico Mendes (1944–1988)",
    "categoria": "ambiente",
    "conceito": "Desenvolvimento Sustentável Comunitário e Conservação da Amazônia",
    "explicacao": "Seringueiro, líder sindical e ambientalista acreano que concebeu o modelo de Reservas Extrativistas (RESEX), demonstrando que a floresta em pé e habitada por povos tradicionais é mais rentável do que sua devastação.",
    "aplicacao": "Como demonstrou o ambientalista Chico Mendes, a proteção da Amazônia não exclui as comunidades tradicionais, mas depende diretamente da criação de reservas extrativistas que aliem subsistência digna e conservação ecológica.",
    "fonte": "MENDES, Chico. Discursos e entrevistas reunidos; MEMORIAL CHICO MENDES.",
    "tags": [
      "chico mendes",
      "amazônia",
      "resex",
      "sustentabilidade",
      "povos da floresta"
    ]
  },
  {
    "id": "rep-acordo-de-paris",
    "titulo": "O Acordo de Paris sobre o Clima (2015)",
    "autor": "Convenção-Quadro das Nações Unidas sobre a Mudança do Clima (COP 21)",
    "categoria": "ambiente",
    "conceito": "Descarbonização da Economia e Contribuições Nacionalmente Determinadas (NDC)",
    "explicacao": "Tratado internacional juridicamente vinculante firmado por 195 nações para limitar o aumento da temperatura média global bem abaixo de 2°C acima dos níveis pré-industriais.",
    "aplicacao": "Ratificado pelo Brasil, o Acordo de Paris impõe metas estritas de neutralidade de carbono e combate ao desmatamento ilegal, compromissos que demandam a transição célere para matrizes energéticas limpas.",
    "fonte": "ONU. Acordo de Paris sob a Convenção-Quadro da ONU sobre Mudança do Clima (2015).",
    "tags": [
      "acordo de paris",
      "cop21",
      "clima",
      "transição energética",
      "carbono zero"
    ]
  },
  {
    "id": "rep-agenda-2030-ods",
    "titulo": "Agenda 2030 e os Objetivos de Desenvolvimento Sustentável (ODS)",
    "autor": "Organização das Nações Unidas (ONU)",
    "categoria": "ambiente",
    "conceito": "Metas Universais de Erradicação da Pobreza e Sustentabilidade Planetária",
    "explicacao": "Conjunto de 17 objetivos e 169 metas adotados pelos líderes mundiais para equilibrar o desenvolvimento econômico, a inclusão social e a preservação ambiental até o ano de 2030.",
    "aplicacao": "Em conformidade com a Agenda 2030 da ONU, a preservação ambiental (ODS 13 e 15) é condição prévia para a erradicação da pobreza e a garantia de cidades resilientes e sustentáveis (ODS 11).",
    "fonte": "ONU. Transformando Nosso Mundo: A Agenda 2030 para o Desenvolvimento Sustentável (2015).",
    "tags": [
      "agenda 2030",
      "ods",
      "sustentabilidade",
      "onu",
      "desenvolvimento global"
    ]
  },
  {
    "id": "rep-lei-8080-sus",
    "titulo": "Lei Orgânica da Saúde (Lei nº 8.080/1990 - Criação do SUS)",
    "autor": "Congresso Nacional do Brasil",
    "categoria": "saude",
    "conceito": "Universalidade, Integralidade e Equidade na Assistência",
    "explicacao": "Regulamenta o Sistema Único de Saúde (SUS), garantindo a todos os cidadãos acesso a ações e serviços para promoção, proteção e recuperação da saúde, do atendimento básico a transplantes de alta complexidade.",
    "aplicacao": "Instituído pela Lei nº 8.080/1990, o Sistema Único de Saúde é regido pelo princípio da equidade, determinando que o Estado ofereça atenção proporcional às necessidades individuais e coletivas da população.",
    "fonte": "BRASIL. Lei nº 8.080, de 19 de setembro de 1990 (Lei Orgânica da Saúde).",
    "tags": [
      "sus",
      "saúde pública",
      "universalidade",
      "equidade",
      "sistema de saúde"
    ]
  },
  {
    "id": "rep-reforma-psiquiatrica-10216",
    "titulo": "Lei da Reforma Psiquiátrica (Lei nº 10.216/2001 - Lei Paulo Delgado)",
    "autor": "Congresso Nacional do Brasil",
    "categoria": "saude",
    "conceito": "Desinstitucionalização, Dignidade e Redes de Atenção Psicossocial (RAPS)",
    "explicacao": "Redirecionou o modelo assistencial em saúde mental, substituindo o confinamento asilar em manicômios pelo tratamento em serviços comunitários abertos (CAPS), preservando os direitos civis e humanos dos pacientes.",
    "aplicacao": "A Lei da Reforma Psiquiátrica (Lei nº 10.216/2001) consolidou o tratamento humanizado e em liberdade para pessoas em sofrimento mental, modelo que requer a contínua expansão e investimento nos Centros de Atenção Psicossocial (CAPS).",
    "fonte": "BRASIL. Lei nº 10.216, de 6 de abril de 2001.",
    "tags": [
      "saúde mental",
      "reforma psiquiátrica",
      "caps",
      "direitos humanos",
      "inclusão social"
    ]
  },
  {
    "id": "rep-revolta-da-vacina-1904",
    "titulo": "A Revolta da Vacina (Rio de Janeiro, 1904)",
    "autor": "Historiografia da Saúde Pública no Brasil",
    "categoria": "saude",
    "conceito": "Comunicação Pública, Desinformação e Resistência Popular Sanitária",
    "explicacao": "Conflito social eclodido no Rio de Janeiro contra a vacinação obrigatória anti-varíola capitaneada por Oswaldo Cruz, provocado pelo autoritarismo estatal e pela falta de informação clara à população.",
    "aplicacao": "O episódio histórico da Revolta da Vacina (1904) ilustra que intervenções de saúde pública exigem, além de base científica sólida, comunicação transparente e combate incisivo à desinformação.",
    "fonte": "CHALHOUB, Sidney. Cidade Febril: cortiços e epidemias na corte imperial (1996).",
    "tags": [
      "vacina",
      "revolta da vacina",
      "saúde coletiva",
      "desinformação",
      "história da medicina"
    ]
  },
  {
    "id": "rep-oswaldo-cruz-fiocruz",
    "titulo": "Fundação Oswaldo Cruz (Fiocruz) e a Soberania Científica",
    "autor": "Oswaldo Cruz (1872–1917) e Fundação Oswaldo Cruz",
    "categoria": "saude",
    "conceito": "Pesquisa Biomédica, Imunobiológicos e Defesa da Vida",
    "explicacao": "Instituição secular de ciência e tecnologia em saúde pública, pioneira no controle da febre amarela e peste bubônica no início do século XX e peça-chave na produção de vacinas e medicamentos essenciais.",
    "aplicacao": "O legado de Oswaldo Cruz e a atuação estratégica da Fiocruz comprovam que a autossuficiência científica e a produção nacional de vacinas são requisitos de soberania e segurança sanitária nacional.",
    "fonte": "FUNDAÇÃO OSWALDO CRUZ (FIOCRUZ). Acervo Histórico e Memória da Saúde.",
    "tags": [
      "fiocruz",
      "vacinas",
      "ciência",
      "pesquisa biomédica",
      "saúde pública"
    ]
  },
  {
    "id": "rep-oms-saude-mental-jovens",
    "titulo": "Relatório da OMS sobre Ansiedade e Saúde Mental da Juventude",
    "autor": "Organização Mundial da Saúde (OMS)",
    "categoria": "saude",
    "conceito": "Depressão, Ansiedade e o Impacto das Mídias Digitais no Desenvolvimento",
    "explicacao": "Documento global alertando que os transtornos de ansiedade e depressão aumentaram expressivamente entre adolescentes, potencializados pela solidão urbana, pressão por desempenho e uso abusivo de telas.",
    "aplicacao": "Conforme alerta a Organização Mundial da Saúde (OMS), o aumento vertiginoso de transtornos ansiosos na juventude demanda a criação de programas multidisciplinares de acolhimento psicológico nas escolas.",
    "fonte": "ORGANIZAÇÃO MUNDIAL DA SAÚDE (OMS). World Mental Health Report (2022).",
    "tags": [
      "saúde mental",
      "ansiedade",
      "depressão",
      "juventude",
      "oms",
      "escola"
    ]
  },
  {
    "id": "rep-lei-lucas-13722",
    "titulo": "Lei Lucas (Lei nº 13.722/2018 - Primeiros Socorros nas Escolas)",
    "autor": "Congresso Nacional do Brasil",
    "categoria": "saude",
    "conceito": "Capacitação Preventiva em Primeiros Socorros e Preservação da Vida Infantil",
    "explicacao": "Obriga estabelecimentos públicos e privados de educação básica e recreação a capacitar professores e funcionários em noções de primeiros socorros para evitar mortes por asfixia e engasgos.",
    "aplicacao": "A promulgação da Lei Lucas (Lei nº 13.722/2018) evidencia a importância da cultura de prevenção primária e da integração entre conhecimentos de saúde e rotinas escolares para resguardar a integridade física de crianças.",
    "fonte": "BRASIL. Lei nº 13.722, de 4 de outubro de 2018.",
    "tags": [
      "lei lucas",
      "primeiros socorros",
      "escola",
      "infância",
      "segurança",
      "saúde"
    ]
  },
  {
    "id": "rep-drogas-reducao-danos",
    "titulo": "Política de Redução de Danos em Saúde Pública",
    "autor": "Ministério da Saúde do Brasil / OMS",
    "categoria": "saude",
    "conceito": "Cuidado em Saúde, Prevenção de Agravos e Atenção Integral ao Usuário",
    "explicacao": "Estratégia de saúde pública que visa minimizar os prejuízos biológicos, sociais e econômicos associados ao uso de substâncias sem exigir como condição prévia imediata a abstinência total.",
    "aplicacao": "Sob a ótica da saúde coletiva, a estratégia de redução de danos adota o acolhimento multiprofissional como instrumento de reinserção cidadã, superando o estigma punitivo e assegurando acesso aos serviços do SUS.",
    "fonte": "BRASIL. Ministério da Saúde. Portaria nº 1.028/2005 (Ações de Redução de Danos).",
    "tags": [
      "redução de danos",
      "saúde coletiva",
      "drogas",
      "acolhimento",
      "sus"
    ]
  },
  {
    "id": "rep-determinantes-sociais-saude",
    "titulo": "Comissão Nacional sobre Determinantes Sociais da Saúde (CNDSS)",
    "autor": "Comissão sobre Determinantes Sociais da Saúde (OMS / Fiocruz)",
    "categoria": "saude",
    "conceito": "Saneamento, Moradia, Renda e Escolaridade como Fatores de Saúde",
    "explicacao": "Demonstra que a saúde de uma população é reflexo direto das condições em que as pessoas nascem, crescem, vivem, trabalham e envelhecem, sendo o saneamento básico fator primordial de prevenção de endemias.",
    "aplicacao": "Estudos da Comissão sobre Determinantes Sociais da Saúde revelam que garantir acesso a água tratada e esgotamento sanitário impacta mais a longevidade da população vulnerável do que a expansão de leitos hospitalares reativos.",
    "fonte": "OMS; FIOCRUZ. As Causas Sociais das Iniquidades em Saúde (Relatório CNDSS).",
    "tags": [
      "determinantes sociais",
      "saneamento",
      "prevenção",
      "saúde pública",
      "desigualdade"
    ]
  },
  {
    "id": "rep-lei-aurea-1888",
    "titulo": "A Incompletude da Abolição da Escravidão (1888)",
    "autor": "Historiografia Brasileira / Joaquim Nabuco (1849–1910)",
    "categoria": "historia",
    "conceito": "Abolição Inacabada e Ausência de Reparação e Cidadania",
    "explicacao": "A assinatura da Lei Áurea em 13 de maio de 1888 libertou formalmente os escravizados, mas não garantiu terras, indenizações, moradia ou educação, lançando a população negra na informalidade e na exclusão social.",
    "aplicacao": "Como alertava o abolicionista Joaquim Nabuco em \"O Abolicionismo\", a mera extinção legal do cativeiro em 1888, desprovida de inclusão econômica e escolar, legou ao Brasil um abismo estrutural que ainda reverbera nas periferias.",
    "fonte": "NABUCO, Joaquim. O Abolicionismo (1883).",
    "tags": [
      "lei áurea",
      "abolição",
      "escravidão",
      "joaquim nabuco",
      "racismo estrutural",
      "história"
    ]
  },
  {
    "id": "rep-era-vargas-clt-1943",
    "titulo": "A Era Vargas e a Consolidação das Leis do Trabalho (CLT - 1943)",
    "autor": "Getúlio Vargas (1882–1954) e História do Trabalho no Brasil",
    "categoria": "historia",
    "conceito": "Cidadania Regulada, Direitos Trabalhistas e Industrialização",
    "explicacao": "O Decreto-Lei nº 5.452/1943 unificou as normas trabalhistas (salário mínimo, férias, jornada de 8 horas), transformando a relação entre capital e trabalho no processo de urbanização do país.",
    "aplicacao": "A instituição da CLT em 1943 estabeleceu patamares civilizatórios de dignidade ao trabalhador urbano, cuja proteção exige contínua atualização diante dos desafios da precarização e da economia digital.",
    "fonte": "BRASIL. Decreto-Lei nº 5.452, de 1º de maio de 1943 (Consolidação das Leis do Trabalho).",
    "tags": [
      "era vargas",
      "clt",
      "trabalho",
      "direitos trabalhistas",
      "industrialização"
    ]
  },
  {
    "id": "rep-diretas-ja-1984",
    "titulo": "A Campanha das Diretas Já (1984) e a Redemocratização",
    "autor": "Movimento Social e Político Brasileiro",
    "categoria": "historia",
    "conceito": "Mobilização Popular, Soberania do Voto e Transição Democrática",
    "explicacao": "O maior movimento de massa da história política recente do Brasil, mobilizando milhões de cidadãos em praça pública pela aprovação da Emenda Dante de Oliveira para restaurar eleições presidenciais diretas.",
    "aplicacao": "A mobilização cívica das Diretas Já (1984) evidenciou que a cidadania plena decorre da participação ativa do povo nos destinos da nação, antecedendo o pacto consagrado na Constituição de 1988.",
    "fonte": "MEMORIAL DA DEMOCRACIA. O movimento pelas Diretas Já (1984).",
    "tags": [
      "diretas já",
      "redemocratização",
      "voto direto",
      "cidadania",
      "democracia"
    ]
  },
  {
    "id": "rep-constituicao-cidada-1988",
    "titulo": "A Promulgação da Constituição Cidadã (5 de outubro de 1988)",
    "autor": "Ulysses Guimarães (1916–1992) / Assembleia Constituinte",
    "categoria": "historia",
    "conceito": "Superação do Autoritarismo e Consagração do Estado de Direito",
    "explicacao": "No discurso histórico de promulgação, o deputado Ulysses Guimarães declarou a Carta Magna de 1988 como a \"Constituição Cidadã\", proclamando ódio e nojo à tirania e elevando a dignidade humana a valor central.",
    "aplicacao": "Ao promulgar a Carta de 1988, Ulysses Guimarães denominou-a \"Constituição Cidadã\" pelo compromisso inequívoco com a justiça social, desafio que ainda demanda empenho estatal diário para concretizar suas promessas.",
    "fonte": "GUIMARÃES, Ulysses. Discurso de Promulgação da Constituição de 1988 (Diário da Constituinte).",
    "tags": [
      "constituição cidadã",
      "ulysses guimarães",
      "democracia",
      "constituinte",
      "história"
    ]
  },
  {
    "id": "rep-revolta-canudos-euclides",
    "titulo": "A Guerra de Canudos (1896–1897) e \"Os Sertões\"",
    "autor": "Euclides da Cunha (1866–1909)",
    "categoria": "historia",
    "conceito": "Desigualdades Regionais, Fanatismo e Incompreensão do Sertão pelo Litoral",
    "explicacao": "A destruição do arraial de Antônio Conselheiro pelo Exército expôs a violência estatal contra uma comunidade de sertanejos famintos, denunciada por Euclides da Cunha como crime de lesa-pátria.",
    "aplicacao": "Em \"Os Sertões\", obra imortalizada pela máxima \"o sertanejo é, antes de tudo, um forte\", Euclides da Cunha denunciou a brutalidade estatal sobre populações excluídas da jovem República, reflexo de descompassos regionais que persistem.",
    "fonte": "CUNHA, Euclides da. Os Sertões (1902).",
    "tags": [
      "canudos",
      "euclides da cunha",
      "sertão",
      "desigualdade regional",
      "literatura e história"
    ]
  },
  {
    "id": "rep-criacao-policia-militar-1809",
    "titulo": "A Chegada da Família Real e a Criação da Guarda Real de Polícia (1809)",
    "autor": "D. João VI / História das Forças de Segurança no Brasil",
    "categoria": "historia",
    "conceito": "Institucionalização da Ordem Pública e Gênese das Polícias Militares",
    "explicacao": "Pelo Decreto de 13 de maio de 1809, o Príncipe Regente D. João criou a Divisão Militar da Guarda Real de Polícia no Rio de Janeiro, marco inaugural da organização policial militar brasileira.",
    "aplicacao": "A criação da Guarda Real de Polícia em 1809 marca a institucionalização da segurança pública no Brasil, cuja evolução contemporânea exige aprimoramento contínuo em direitos humanos e inteligência preventiva.",
    "fonte": "BRASIL. Decreto de 13 de maio de 1809 (Criação da Guarda Real de Polícia).",
    "tags": [
      "polícia militar",
      "d joão vi",
      "história da segurança",
      "ordem pública",
      "pmpe",
      "pmsp"
    ]
  },
  {
    "id": "rep-ditadura-estado-novo-1937",
    "titulo": "O Estado Novo de Getúlio Vargas (1937–1945)",
    "autor": "Historiografia Política do Brasil",
    "categoria": "historia",
    "conceito": "Centralização Autoritária, Censura (DIP) e Modernização da Burocracia",
    "explicacao": "Regime autoritário que fechou o Congresso, outorgou a Constituição \"Polaca\" de 1937 e criou o Departamento de Imprensa e Propaganda (DIP) para controle ideológico, paralelamente à criação do DASP para profissionalizar o serviço público.",
    "aplicacao": "A experiência do Estado Novo (1937–1945) demonstra os perigos da censura e da hipertrofia executiva, reforçando por contraste a necessidade de manter o controle democrático e a transparência no serviço público.",
    "fonte": "FAUSTO, Boris. História do Brasil (1994).",
    "tags": [
      "estado novo",
      "vargas",
      "autoritarismo",
      "censura",
      "história republicana"
    ]
  },
  {
    "id": "rep-plano-real-1994",
    "titulo": "O Plano Real (1994) e a Estabilização Monetária",
    "autor": "Equipe Econômica do Ministério da Fazenda / Brasil",
    "categoria": "historia",
    "conceito": "Superação da Hiperinflação e Preservação do Poder de Compra",
    "explicacao": "Implementado com a Unidade Real de Valor (URV) e a nova moeda (Real), encerrou décadas de inflação galopante que corroía prioritariamente os salários das famílias mais vulneráveis do país.",
    "aplicacao": "A estabilização econômica propiciada pelo Plano Real em 1994 demonstrou que a higidez da moeda é condição preliminar de justiça distributiva, já que a inflação descontrolada pune severamente as classes de menor renda.",
    "fonte": "BANCO CENTRAL DO BRASIL. História do Plano Real e da Estabilização Econômica.",
    "tags": [
      "plano real",
      "inflação",
      "economia",
      "história econômica",
      "cidadania"
    ]
  },
  {
    "id": "rep-cidadania-mulher-voto-1932",
    "titulo": "A Conquista do Voto Feminino no Brasil (Código Eleitoral de 1932)",
    "autor": "Bertha Lutz (1894–1976) e Movimento Sufragista Brasileiro",
    "categoria": "historia",
    "conceito": "Sufrágio Universal Feminino e Reconhecimento dos Direitos Políticos",
    "explicacao": "Pelo Decreto nº 21.076 de 1932, consolidado na Constituição de 1934, as mulheres brasileiras conquistaram o direito ao voto após décadas de mobilização da Federação Brasileira pelo Progresso Feminino.",
    "aplicacao": "A conquista do voto feminino no Código Eleitoral de 1932, liderada por figuras como Bertha Lutz, assinalou um passo decisivo rumo à isonomia política, embora a paridade de gênero nos espaços de poder permaneça como desafio premente.",
    "fonte": "BRASIL. Decreto nº 21.076, de 24 de fevereiro de 1932 (Código Eleitoral).",
    "tags": [
      "voto feminino",
      "sufrágio",
      "bertha lutz",
      "direitos das mulheres",
      "história"
    ]
  },
  {
    "id": "rep-thomas-piketty",
    "titulo": "O Capital no Século XXI e a Concentração de Riqueza",
    "autor": "Thomas Piketty (1971–presente)",
    "categoria": "economia",
    "conceito": "Taxa de Rendimento do Capital Superior ao Crescimento Econômico (r > g)",
    "explicacao": "Apoiado em registros de três séculos, o economista francês demonstra que a rentabilidade do capital tende a superar o crescimento da renda e da produção, gerando concentração extrema de patrimônio se não houver tributação progressiva.",
    "aplicacao": "Conforme demonstra Thomas Piketty em \"O Capital no Século XXI\", a ausência de tributação progressiva aprofunda a desigualdade estrutural, concentrando patrimônio nas mãos de uma minoria enquanto a maioria depende exclusivamente de salários.",
    "fonte": "PIKETTY, Thomas. O Capital no Século XXI (2013).",
    "tags": [
      "piketty",
      "desigualdade",
      "capital",
      "economia",
      "tributação",
      "riqueza"
    ]
  },
  {
    "id": "rep-adam-smith-nacoes",
    "titulo": "A Riqueza das Nações e a Divisão do Trabalho",
    "autor": "Adam Smith (1723–1790)",
    "categoria": "economia",
    "conceito": "Produtividade, Especialização e os Deveres do Soberano",
    "explicacao": "Marco da economia clássica que analisa como a divisão do trabalho eleva a produtividade, frisando igualmente que compete ao Estado garantir a defesa, a justiça e a infraestrutura básica de transportes e educação pública.",
    "aplicacao": "Pai da economia clássica, Adam Smith reconhecia em \"A Riqueza das Nações\" que a livre iniciativa necessita de um Estado apto a assegurar a justiça, a segurança e a educação básica como pré-requisitos do desenvolvimento.",
    "fonte": "SMITH, Adam. Uma Investigação sobre a Natureza e as Causas da Riqueza das Nações (1776).",
    "tags": [
      "adam smith",
      "economia clássica",
      "divisão do trabalho",
      "mercado",
      "estado"
    ]
  },
  {
    "id": "rep-keynes-anticiclico",
    "titulo": "Teoria Geral do Emprego e a Atuação Anticíclica do Estado",
    "autor": "John Maynard Keynes (1883–1946)",
    "categoria": "economia",
    "conceito": "Demanda Efetiva, Pleno Emprego e Investimento Público",
    "explicacao": "O economista britânico provou que o mercado livre não tem mecanismo de autocura instantânea em crises severas, devendo o Poder Público expandir gastos e obras públicas para reativar o emprego e o consumo.",
    "aplicacao": "Em consonância com o pensamento de John Maynard Keynes, em cenários de recessão cabe ao Estado ampliar investimentos públicos para reaquecer a atividade produtiva e proteger os níveis de emprego.",
    "fonte": "KEYNES, John Maynard. Teoria Geral do Emprego, do Juro e da Moeda (1936).",
    "tags": [
      "keynes",
      "investimento público",
      "emprego",
      "políticas anticíclicas",
      "economia"
    ]
  },
  {
    "id": "rep-josue-de-castro-fome",
    "titulo": "Geografia da Fome: A Fome como Flagelo Político e Não Natural",
    "autor": "Josué de Castro (1908–1973)",
    "categoria": "economia",
    "conceito": "Fome como Fenômeno Social e Econômico Decorrente da Má Distribuição",
    "explicacao": "Médico, geógrafo e presidente da FAO/ONU, Josué de Castro desmistificou que a fome decorreria de clima ou superpopulação, comprovando que ela é produto da estrutura agrária concentrada e de baixos salários.",
    "aplicacao": "Em \"Geografia da Fome\", o pioneiro Josué de Castro comprovou que a subnutrição não é um acidente geográfico, mas uma anomalia socioeconômica gerada pela má distribuição de renda e alimentos.",
    "fonte": "CASTRO, Josué de. Geografia da Fome: o dilema brasileiro (1946).",
    "tags": [
      "josué de castro",
      "fome",
      "segurança alimentar",
      "desigualdade",
      "pobreza",
      "fao"
    ]
  },
  {
    "id": "rep-celso-furtado",
    "titulo": "Formação Econômica do Brasil e o Subdesenvolvimento Estrutural",
    "autor": "Celso Furtado (1920–2004)",
    "categoria": "economia",
    "conceito": "Dependência do Centro-Periferia, Heterogeneidade e Planejamento Regional",
    "explicacao": "Um dos maiores economistas do país e fundador da SUDENE, Furtado demonstrou que o subdesenvolvimento não é uma etapa anterior ao desenvolvimento, mas um processo histórico de dependência tecnológica e concentração de renda.",
    "aplicacao": "Conforme lecionava o economista Celso Furtado, superar o subdesenvolvimento requer planejamento estatal focado em desconcentrar renda e modernizar a infraestrutura das regiões historicamente alijadas do progresso.",
    "fonte": "FURTADO, Celso. Formação Econômica do Brasil (1959).",
    "tags": [
      "celso furtado",
      "subdesenvolvimento",
      "sudene",
      "planejamento",
      "economia brasileira"
    ]
  },
  {
    "id": "rep-oit-trabalho-decente",
    "titulo": "A Convenção sobre o Trabalho Decente e Combate ao Trabalho Escravo",
    "autor": "Organização Internacional do Trabalho (OIT)",
    "categoria": "economia",
    "conceito": "Dignidade Laboral, Liberdade Sindical e Proteção Social Integral",
    "explicacao": "A OIT preconiza o conceito de \"Trabalho Decente\" como atividade produtiva adequadamente remunerada, exercida em condições de liberdade, equidade, segurança e dignidade humana.",
    "aplicacao": "De acordo com as diretrizes da Organização Internacional do Trabalho (OIT), o desenvolvimento econômico sustentável pressupõe a garantia do trabalho decente e a fiscalização incansável de práticas análogas à escravidão contemporânea.",
    "fonte": "OIT. Declaração sobre os Princípios e Direitos Fundamentais no Trabalho (1998).",
    "tags": [
      "oit",
      "trabalho decente",
      "trabalho escravo",
      "dignidade laboral",
      "direitos trabalhistas"
    ]
  },
  {
    "id": "rep-uberizacao-gig-economy",
    "titulo": "A \"Uberização\" e a Precarização do Trabalho por Plataformas",
    "autor": "Ludmila Costhek Abílio e Sociologia do Trabalho Contemporânea",
    "categoria": "economia",
    "conceito": "Trabalhador Just-in-Time, Desregulamentação e Transferência de Custos",
    "explicacao": "Estudos sociológicos demonstram como as plataformas digitais convertem o trabalhador em suposto \"empreendedor de si mesmo\", transferindo custos e riscos operacionais sem contrapartida de seguridade social ou jornada limite.",
    "aplicacao": "A chamada \"uberização do trabalho\", analisada pela socióloga Ludmila Abílio, exemplifica a erosão das garantias laborais na economia de aplicativo, gerando desproteção previdenciária em caso de acidentes ou enfermidades.",
    "fonte": "ABÍLIO, Ludmila Costhek. Uberização: do empreendedorismo à viração (2020).",
    "tags": [
      "uberização",
      "gig economy",
      "plataformas",
      "precarização",
      "trabalho",
      "seguridade"
    ]
  },
  {
    "id": "rep-karl-marx-alienacao",
    "titulo": "A Alienação do Trabalho e a Mercantilização da Vida",
    "autor": "Karl Marx (1818–1883)",
    "categoria": "economia",
    "conceito": "Coisificação das Relações Sociais e Fetichismo da Mercadoria",
    "explicacao": "Nos \"Manuscritos Econômico-Filosóficos\", Marx formula que, no modelo industrial desregulado, o trabalhador se torna estranho ao produto de sua própria força de trabalho, convertendo a atividade humana em mera mercadoria.",
    "aplicacao": "Sob a ótica de Karl Marx em seus Manuscritos Econômicos, quando o labor humano é desumanizado e despido de valor intrínseco, o trabalhador perde o protagonismo de sua própria existência.",
    "fonte": "MARX, Karl. Manuscritos Econômico-Filosóficos de 1844.",
    "tags": [
      "marx",
      "trabalho",
      "alienação",
      "capitalismo",
      "filosofia econômica"
    ]
  },
  {
    "id": "rep-cepal-desigualdade",
    "titulo": "Comissão Econômica para a América Latina (CEPAL / ONU)",
    "autor": "CEPAL / Raúl Prebisch (1901–1986)",
    "categoria": "economia",
    "conceito": "Deterioração dos Termos de Troca e Diversificação Industrial",
    "explicacao": "A comissão econômica da ONU analisa que países exportadores de commodities sofrem perdas constantes frente a nações de tecnologia avançada, exigindo diversificação produtiva e inovação científica nacional.",
    "aplicacao": "Diagnósticos da CEPAL reiteram que a superação da dependência econômica na América Latina exige investimentos massivos em ciência, tecnologia e agregação de valor às cadeias produtivas internas.",
    "fonte": "CEPAL; ONU. O Desenvolvimento Econômico da América Latina e seus Principais Problemas.",
    "tags": [
      "cepal",
      "américa latina",
      "industrialização",
      "commodities",
      "produtividade"
    ]
  },
  {
    "id": "rep-eli-pariser-bolha",
    "titulo": "O Filtro Invisível (The Filter Bubble) e a Polarização Algorítmica",
    "autor": "Eli Pariser (1980–presente)",
    "categoria": "tecnologia",
    "conceito": "Personalização Extrema e Isolamento em Câmaras de Eco",
    "explicacao": "O ativista digital demonstra que os algoritmos das redes sociais selecionam conteúdos que confirmam vieses prévios dos usuários, isolando-os em bolhas informacionais que fragmentam o tecido democrático.",
    "aplicacao": "Em \"O Filtro Invisível\", Eli Pariser alerta que os algoritmos de personalização aprisionam os indivíduos em câmaras de eco, incentivando a radicalização e dificultando a formação de consensos cívicos.",
    "fonte": "PARISER, Eli. O Filtro Invisível: o que a internet está escondendo de você (2011).",
    "tags": [
      "bolha algorítmica",
      "redes sociais",
      "polarização",
      "internet",
      "algoritmos",
      "desinformação"
    ]
  },
  {
    "id": "rep-lei-carolina-dieckmann",
    "titulo": "Lei Carolina Dieckmann (Lei nº 12.737/2012 - Crimes Cibernéticos)",
    "autor": "Congresso Nacional do Brasil",
    "categoria": "tecnologia",
    "conceito": "Invasão de Dispositivo Informático e Tipificação de Delitos Virtuais",
    "explicacao": "Alterou o Código Penal brasileiro para tipificar a invasão de aparelhos celulares ou computadores alheios com o intuito de obter, adulterar ou destruir dados sem autorização do titular.",
    "aplicacao": "A promulgação da Lei nº 12.737/2012 (Lei Carolina Dieckmann) representou marco inicial no combate a invasões de dados e fraudes cibernéticas, exigindo o contínuo aparelhamento das delegacias especializadas.",
    "fonte": "BRASIL. Lei nº 12.737, de 30 de novembro de 2012 (Art. 154-A do Código Penal).",
    "tags": [
      "crimes cibernéticos",
      "invasão",
      "privacidade",
      "segurança digital",
      "código penal"
    ]
  },
  {
    "id": "rep-yuval-harari-21licoes",
    "titulo": "21 Lições para o Século XXI: Inteligência Artificial e Biotecnologia",
    "autor": "Yuval Noah Harari (1976–presente)",
    "categoria": "tecnologia",
    "conceito": "Ditaduras de Dados, Algoritmos Preditivos e a Nova Classe de Inúteis",
    "explicacao": "O historiador israelense analisa como a fusão entre big data e inteligência artificial pode concentrar autoridade em algoritmos opacos, desestabilizando o mercado de trabalho e a soberania do livre-arbítrio humano.",
    "aplicacao": "Em \"21 Lições para o Século XXI\", Yuval Noah Harari adverte que a automação desenfreada e a concentração de dados criam o risco de marginalização em massa, exigindo regulação ética transparente sobre o avanço da inteligência artificial.",
    "fonte": "HARARI, Yuval Noah. 21 Lições para o Século XXI (2018).",
    "tags": [
      "harari",
      "inteligência artificial",
      "automação",
      "futuro do trabalho",
      "dados",
      "ética"
    ]
  },
  {
    "id": "rep-dilema-das-redes",
    "titulo": "O Dilema das Redes (The Social Dilemma)",
    "autor": "Direção de Jeff Orlowski / Center for Humane Technology",
    "categoria": "tecnologia",
    "conceito": "Economia da Atenção, Dependência Psicológica e Desinformação como Modelo de Negócio",
    "explicacao": "Documentário que reúne depoimentos de pioneiros do Vale do Silício revelando como plataformas digitais usam design persuasivo e neurociência para monetizar o tempo dos usuários, potencializando crises de saúde mental.",
    "aplicacao": "O documentário \"O Dilema das Redes\" evidencia que as mídias sociais operam sob a lógica da economia da atenção, na qual o engajamento alimentado por polêmicas artificiais tem prevalecido sobre a veracidade dos fatos.",
    "fonte": "THE SOCIAL DILEMMA. Direção: Jeff Orlowski. Netflix (2020).",
    "tags": [
      "dilema das redes",
      "economia da atenção",
      "mídias sociais",
      "saúde mental",
      "desinformação"
    ]
  },
  {
    "id": "rep-george-orwell-1984",
    "titulo": "1984: Teletelas, Vigilância Total e Manipulação da Verdade",
    "autor": "George Orwell (1903–1950)",
    "categoria": "tecnologia",
    "conceito": "O Grande Irmão (Big Brother), Vigilância Panóptica e Novilíngua",
    "explicacao": "A distopia orwelliana retrata um regime totalitário onde o Estado vigia integralmente o comportamento e o pensamento de todos os cidadãos por meio de teletelas e altera sistematicamente os registros históricos.",
    "aplicacao": "Na célebre distopia \"1984\", George Orwell profetizou os riscos da vigilância onipresente sobre a vida privada, metáfora que se atualiza na coleta massiva e indiscriminada de dados na sociedade digital contemporânea.",
    "fonte": "ORWELL, George. 1984 (1949).",
    "tags": [
      "orwell",
      "1984",
      "vigilância",
      "privacidade",
      "totalitarismo",
      "dados"
    ]
  },
  {
    "id": "rep-fraudes-digitais-14155",
    "titulo": "Agravamento de Penas para Fraudes e Golpes Virtuais (Lei nº 14.155/2021)",
    "autor": "Congresso Nacional do Brasil",
    "categoria": "tecnologia",
    "conceito": "Estelionato Eletrônico, Furto Mediante Fraude Digital e Defesa do Cidadão",
    "explicacao": "Endureceu as penas para crimes de furto qualificado e estelionato praticados por meio eletrônico, redes sociais ou contatos telefônicos fraudulentos (golpe do Pix, clonagem de WhatsApp e engenharia social).",
    "aplicacao": "A promulgação da Lei nº 14.155/2021 reforçou a resposta penal do Estado contra o estelionato eletrônico e golpes virtuais, tornando imperiosa a educação midiática do cidadão para prevenir fraudes informáticas.",
    "fonte": "BRASIL. Lei nº 14.155, de 27 de maio de 2021 (Art. 171 do Código Penal).",
    "tags": [
      "fraudes virtuais",
      "golpes digitais",
      "estelionato eletrônico",
      "segurança pública",
      "pix"
    ]
  },
  {
    "id": "rep-cathy-oneil-algoritmos",
    "titulo": "Algoritmos de Destruição em Massa (Weapons of Math Destruction)",
    "autor": "Cathy O'Neil (1972–presente)",
    "categoria": "tecnologia",
    "conceito": "Opacidade Algorítmica, Viés Discriminatório e Desigualdade Automatizada",
    "explicacao": "A matemática e cientista de dados norte-americana demonstra que sistemas automatizados de ranqueamento (crédito, contratação de pessoal e policiamento preditivo) frequentemente perpetuam preconceitos raciais e de classe sob aparência de neutralidade matemática.",
    "aplicacao": "Em \"Algoritmos de Destruição em Massa\", Cathy O'Neil desfaz o mito da neutralidade computacional, demonstrando que softwares preditivos reproduzem discriminações prévias quando treinados com bases de dados desiguais.",
    "fonte": "O'NEIL, Cathy. Algoritmos de Destruição em Massa (2016).",
    "tags": [
      "algoritmos",
      "viés algorítmico",
      "discriminação",
      "inteligência artificial",
      "dados"
    ]
  },
  {
    "id": "rep-unesco-etica-ia",
    "titulo": "Recomendação sobre a Ética da Inteligência Artificial",
    "autor": "UNESCO (Organização das Nações Unidas para a Educação, a Ciência e a Cultura)",
    "categoria": "tecnologia",
    "conceito": "Transparência, Direitos Humanos e Supervisão Humana da Tecnologia",
    "explicacao": "Primeiro instrumento normativo global aprovado por 193 Estados-membros estabelecendo princípios éticos mandatórios para o ciclo de vida da IA, garantindo a dignidade humana, a sustentabilidade e a não discriminação.",
    "aplicacao": "A Recomendação sobre a Ética da Inteligência Artificial da UNESCO estabelece que a tecnologia deve servir ao bem-estar coletivo sob constante supervisão humana, repudiando o uso de sistemas que violem liberdades fundamentais.",
    "fonte": "UNESCO. Recomendação sobre a Ética da Inteligência Artificial (2021).",
    "tags": [
      "unesco",
      "ética na ia",
      "inteligência artificial",
      "direitos humanos",
      "regulação"
    ]
  }];

/* 4. BANCO DE TEMAS AMPLIADO POR BANCA E EIXO TEMÁTICO (SEÇÃO 8) */
const EIXOS = {
  pmpe: { n: 'PMPE · Policiamento & Ordem', c: '#15803d', banca: 'Instituto AOCP' },
  pcpe: { n: 'PCPE · Investigação & Justiça', c: '#ca8a04', banca: 'CESPE / CEBRASPE' },
  cbmpe: { n: 'CBMPE · Defesa Civil & Vida', c: '#b91c1c', banca: 'Instituto AOCP' },
  pmsp: { n: 'PMSP · Segurança Urbana & Ética', c: '#1e3a8a', banca: 'VUNESP' },
  pppe: { n: 'PPPE · Execução Penal & LEP', c: '#0f766e', banca: 'CEBRASPE' },
  tec: { n: 'Tecnologia, IA & Cibercrimes', c: '#0891b2', banca: 'Multi-Bancas' },
  amb: { n: 'Meio Ambiente, Clima & Saúde', c: '#059669', banca: 'Multi-Bancas' },
  edu: { n: 'Educação, Cultura & Trabalho', c: '#9333ea', banca: 'Multi-Bancas' }
};

const TEMAS = [
  /* --- PMPE / INSTITUTO AOCP --- */
  {
    e: 'pmpe',
    banca: 'Instituto AOCP',
    t: 'Policiamento comunitário e o fortalecimento do vínculo de confiança entre a Polícia Militar e a sociedade',
    problema: 'Distanciamento histórico entre forças de segurança e comunidades periféricas, dificultando a prevenção primária do crime.',
    comando: 'Redija um texto dissertativo-argumentativo abordando: 1) a diferença entre repressão reativa e policiamento de proximidade; 2) o papel da confiança mútua na prevenção da violência; 3) caminhos institucionais para fortalecer a segurança cidadã.',
    teses: [
      'A superação da criminalidade urbana exige substituir o modelo exclusivamente reativo por estratégias de policiamento comunitário baseadas no diálogo e na prevenção primária.',
      'A legitimidade da ação policial ostensiva depende diretamente da confiança construída junto à comunidade e do respeito irrestrito às garantias constitucionais.'
    ],
    f: 'Prevenção primária versus repressão reativa; legitimidade da corporação; aproximação dos bairros periféricos.',
    r: 'Constituição Federal (Art. 144); Lei nº 13.675/2018 (SUSP); Thomas Hobbes (Contrato Social em O Leviatã).',
    p: 'Secretaria de Defesa Social amplia conselhos comunitários de segurança, capacita o efetivo em mediação de conflitos e cria canais transparentes de escuta.'
  },
  {
    e: 'pmpe',
    banca: 'Instituto AOCP',
    t: 'O uso progressivo da força e a garantia da dignidade da pessoa humana na atividade policial ostensiva',
    problema: 'O desafio de conciliar a resposta firme à criminalidade violenta com a observância estrita da legalidade e da proporcionalidade.',
    comando: 'Discorra sobre os limites legais e éticos do uso da força estatal, a importância do treinamento continuado e a proteção dos direitos fundamentais.',
    teses: [
      'O uso diferenciado da força não fragiliza a autoridade policial; pelo contrário, confere amparo jurídico ao agente e preserva a dignidade humana.',
      'A deficiência de treinamento continuado e de tecnologias de menor potencial ofensivo expõe tanto o profissional de segurança quanto o cidadão a riscos evitáveis.'
    ],
    f: 'Legalidade, necessidade e proporcionalidade; redução da letalidade; capacitação técnica contínua.',
    r: 'CF/88 (Art. 1º, III - Dignidade Humana); Lei nº 13.060/2014 (Instrumentos de Menor Potencial Ofensivo); Cesare Beccaria (Dos Delitos e das Penas).',
    p: 'Governo estadual investe em simuladores operacionais de tomada de decisão, protocolos operacionais padrão (POP) e equipamentos de menor potencial ofensivo.'
  },
  {
    e: 'pmpe',
    banca: 'Instituto AOCP',
    t: 'O emprego de câmeras operacionais corporais nas polícias militares como garantia de proteção mútua',
    problema: 'Debate sobre transparência pública, produção de provas idôneas e segurança jurídica do policial e do cidadão durante abordagens.',
    comando: 'Analise os impactos das câmeras corporais na redução da letalidade, na proteção do agente contra falsas acusações e na transparência estatal.',
    teses: [
      'A adoção de câmeras corporais representa um avanço civilizatório que protege o policial cumpridor da lei e qualifica a prova judicial.',
      'A transparência na atividade ostensiva fortalece a credibilidade das instituições militares perante o Estado Democrático de Direito.'
    ],
    f: 'Transparência institucional, produção de prova jurídica inequívoca e preservação da integridade do policial e do cidadão.',
    r: 'CF/88 (Art. 37 - Princípios da Administração Pública e Art. 144); Michel Foucault (Vigiar e Punir); Lei nº 13.869/2019.',
    p: 'Corporação estabelece protocolo de custódia digital inviolável das gravações em serviço, garantindo auditoria técnica e respaldo jurídico.'
  },
  {
    e: 'pmpe',
    banca: 'Instituto AOCP',
    t: 'O papel das forças de segurança na prevenção da violência no ambiente escolar',
    problema: 'Aumento de episódios de violência, intimidação e ameaças no entorno e no interior de instituições de ensino.',
    comando: 'Aborde a articulação entre patrulhamento escolar especializado, comunidade pedagógica e cultura de paz.',
    teses: [
      'A segurança no ambiente escolar requer a integração entre rondas preventivas especializadas e projetos pedagógicos de mediação de conflitos.',
      'A proteção de crianças e adolescentes nas escolas é dever prioritário que exige cooperação entre Polícia Militar, gestores escolares e famílias.'
    ],
    f: 'Patrulha escolar comunitária, prevenção ao bullying e ataques, proteção prioritária da infância e juventude.',
    r: 'CF/88 (Art. 227 - Prioridade Absoluta); Lei nº 8.069/1990 (ECA); Paulo Freire (Educação dialógica e cultura de paz).',
    p: 'Ampliação de batalhões de patrulha escolar integrados às secretarias de educação com protocolos de prevenção e acolhimento psicossocial.'
  },

  /* --- PCPE / CEBRASPE --- */
  {
    e: 'pcpe',
    banca: 'CESPE / CEBRASPE',
    t: 'A integração da inteligência policial e o enfrentamento às organizações criminosas no âmbito estadual',
    problema: 'Sofisticação financeira e interestadual das facções criminosas, exigindo investigação qualificada e descapitalização.',
    comando: 'Em seu texto, aborde obrigatoriamente: 1) as limitações do enfrentamento meramente ostensivo contra o crime organizado; 2) a importância da integração de inteligência e perícia; 3) o estrangulamento financeiro e lavagem de ativos.',
    teses: [
      'O combate eficaz às organizações criminosas depende primordialmente da asfixia financeira e da integração de inteligência policial sob o modelo do SUSP.',
      'A investigação criminal moderna exige substituir ações isoladas pela cooperação interinstitucional entre Polícia Civil, Ministério Público e órgãos de controle financeiro.'
    ],
    f: 'Descapitalização do crime organizado, lavagem de dinheiro, cooperação interestadual e perícia técnica.',
    r: 'Lei nº 12.850/2013 (Organizações Criminosas); Lei nº 13.675/2018 (SUSP); Émile Durkheim (Anomia Social).',
    p: 'Fortalecimento de delegacias de repressão ao crime organizado com laboratórios de lavagem de dinheiro e interoperabilidade de bancos de dados.'
  },
  {
    e: 'pcpe',
    banca: 'CESPE / CEBRASPE',
    t: 'Crimes cibernéticos e estelionatos digitais: a proteção da cidadania frente à vulnerabilidade no ambiente virtual',
    problema: 'Crescimento exponencial de fraudes eletrônicas, golpes financeiros, engenharia social e extorsão digital contra cidadãos.',
    comando: 'Discorra sobre: 1) os fatores tecnológicos e comportamentais que favorecem os cibercrimes; 2) os desafios da investigação policial digital; 3) medidas de prevenção e repressão qualificada.',
    teses: [
      'O avanço dos crimes cibernéticos demanda a modernização técnico-pericial da Polícia Judiciária aliada à educação digital da população.',
      'A sensação de anonimato na rede alimenta a criminalidade virtual, exigindo rastreabilidade financeira ágil e cooperação com plataformas digitais.'
    ],
    f: 'Engenharia social, fraudes bancárias digitais, vazamento de dados de idosos e necessidade de delegacias especializadas.',
    r: 'Lei nº 14.155/2021 (Fraude Eletrônica); Marco Civil da Internet (Lei nº 12.965/2014); LGPD (Lei nº 13.709/2018); Shoshana Zuboff.',
    p: 'Expansão de núcleos especializados em cibercrimes na Polícia Civil, bloqueio cautelar célere de contas fraudulentas e campanhas de letramento digital.'
  },
  {
    e: 'pcpe',
    banca: 'CESPE / CEBRASPE',
    t: 'A atuação da Polícia Judiciária na proteção integral das mulheres vítimas de violência doméstica e familiar',
    problema: 'Subnotificação, revitimização institucional e descumprimento de medidas protetivas que culminam no feminicídio.',
    comando: 'Analise: 1) as raízes socioculturais da violência de gênero; 2) o papel das Delegacias Especializadas de Atendimento à Mulher (DEAMs); 3) a efetividade das medidas protetivas de urgência.',
    teses: [
      'A prevenção ao feminicídio exige acolhimento humanizado e funcionamento ininterrupto das Delegacias da Mulher, evitando a revitimização.',
      'A eficácia da Lei Maria da Penha depende da articulação célere entre o registro policial, a concessão judicial da medida protetiva e seu monitoramento ostensivo.'
    ],
    f: 'Eficácia das medidas protetivas de urgência, atendimento humanizado nas Delegacias da Mulher e enfrentamento ao feminicídio.',
    r: 'Lei nº 11.340/2006 (Lei Maria da Penha); Simone de Beauvoir (O Segundo Sexo); CF/88 (Art. 226, § 8º).',
    p: 'Funcionamento 24h das DEAMs com salas de acolhimento humanizado, inquérito digital célere e monitoramento integrado das medidas protetivas.'
  },
  {
    e: 'pcpe',
    banca: 'CESPE / CEBRASPE',
    t: 'A cadeia de custódia da prova pericial e sua importância para o devido processo legal e o combate à impunidade',
    problema: 'Nulidades processuais e fragilização de investigações decorrentes da preservação inadequada de vestígios criminais.',
    comando: 'Aborde: 1) o conceito e a finalidade da cadeia de custódia; 2) a relação entre prova técnica e direitos fundamentais; 3) investimentos em polícia científica e investigação.',
    teses: [
      'O rigor na preservação da cadeia de custódia da prova é condição indispensável tanto para evitar condenações injustas quanto para impedir a impunidade.',
      'A valorização da prova técnico-científica no inquérito policial fortalece o devido processo legal e reduz a dependência de provas meramente testemunhais.'
    ],
    f: 'Preservação do local de crime, rastreabilidade de vestígios, pacote anticrime (Lei 13.964/2019) e segurança jurídica.',
    r: 'CF/88 (Art. 5º, LIV e LVI - Devido Processo Legal e Provas Ilícitas); Código de Processo Penal (Arts. 158-A a 158-F); Cesare Beccaria.',
    p: 'Padronização de protocolos de isolamento de local de crime entre PM e PC, além de investimento em laboratórios forenses.'
  },

  /* --- PPPE / CEBRASPE --- */
  {
    e: 'pppe',
    banca: 'CEBRASPE',
    t: 'O sistema penitenciário brasileiro e os desafios contemporâneos para a ressocialização de pessoas privadas de liberdade',
    problema: 'A elevada taxa de reincidência criminal e a escassez de oportunidades reais de reinserção social no cárcere.',
    comando: 'Considerando a Lei de Execução Penal (Lei nº 7.210/1984), redija um texto dissertativo abordando: 1) o duplo caráter da pena privativa de liberdade; 2) o papel da educação e do trabalho no ambiente prisional; 3) medidas estatais e sociais para prevenir a reincidência.',
    teses: [
      'A ressocialização não é concessão leniente, mas estratégia fundamental de segurança pública para diminuir a criminalidade e desarticular a dependência de facções.',
      'A garantia do trabalho e da instrução escolar nos estabelecimentos penais é mandamento legal indeclinável para a efetivação da dignidade humana.'
    ],
    f: 'Ressocialização, Lei de Execução Penal, trabalho carcerário, remição de pena, dignidade humana e redução da reincidência.',
    r: 'CF/88 (Art. 1º, III - Dignidade da Pessoa Humana); Lei nº 7.210/1984 (LEP, Arts. 10 e 28); Cesare Beccaria (Dos Delitos e das Penas).',
    p: 'Expansão de oficinas de trabalho e polos educacionais nos presídios em parceria com o Sistema S e empresas privadas, com incentivos fiscais para contratação de egressos.'
  },
  {
    e: 'pppe',
    banca: 'CEBRASPE',
    t: 'O enfrentamento às facções criminosas e o fortalecimento da inteligência policial no sistema penitenciário',
    problema: 'A utilização das penitenciárias como centros de comando para delitos extramuros e a expansão do crime organizado.',
    comando: 'Discorra sobre: 1) os mecanismos de controle e cooptação utilizados pelo crime organizado nas prisões; 2) a importância do isolamento de lideranças e da inteligência penitenciária; 3) a integração operacional entre a Polícia Penal e os demais órgãos do SUSP.',
    teses: [
      'A retomada plena do controle estatal sobre os estabelecimentos prisionais é premissa indispensável para conter a violência urbana.',
      'O fortalecimento da inteligência da Polícia Penal constitui elemento estratégico para neutralizar a comunicação e o fluxo financeiro das facções.'
    ],
    f: 'Regime Disciplinar Diferenciado (RDD), bloqueio de sinal de telecomunicações, inteligência penitenciária e integração com o SUSP.',
    r: 'Lei nº 12.850/2013 (Organizações Criminosas); Lei nº 13.675/2018 (SUSP); Emenda Constitucional nº 104/2019 (Criação da Polícia Penal); Michel Foucault.',
    p: 'Modernização de bloqueadores de sinal celular, escâneres corporais de alta precisão e criação de núcleos integrados de inteligência penitenciária com as Polícias Civil e Federal.'
  },
  {
    e: 'pppe',
    banca: 'CEBRASPE',
    t: 'Superlotação carcerária no Brasil e a efetivação da dignidade da pessoa humana',
    problema: 'Déficit de vagas nos estabelecimentos penais, proliferação de doenças e condições degradantes de custódia.',
    comando: 'Aborde: 1) o estado de coisas inconstitucional reconhecido pelo STF no sistema prisional; 2) o impacto da superlotação na rotina e segurança dos servidores penitenciários; 3) alternativas penais e medidas estruturantes de gestão prisional.',
    teses: [
      'O reconhecimento do sistema prisional como estado de coisas inconstitucional impõe ao Poder Público investimentos estruturais inadiáveis.',
      'A superlotação carcerária degrada a custódia do detento e compromete severamente a segurança e a integridade física e psíquica dos policiais penais.'
    ],
    f: 'Estado de coisas inconstitucional (ADPF 347 do STF), audiências de custódia, monitoração eletrônica e dignidade humana.',
    r: 'STF (ADPF 347); Regras Mínimas da ONU para Tratamento de Reclusos (Regras de Mandela); CF/88 (Art. 5º, XLVII, XLIX); Giorgio Agamben.',
    p: 'Adoção responsável de monitoração eletrônica para crimes sem violência, investimentos do Fundo Penitenciário Nacional em novas unidades e celeridade na revisão processual.'
  },
  {
    e: 'pppe',
    banca: 'CEBRASPE',
    t: 'A valorização profissional e a preservação da saúde dos policiais penais no exercício de suas atribuições',
    problema: 'Ambiente de alta periculosidade, estresse ocupacional crônico e sobrecarga de trabalho que afetam o policial penal.',
    comando: 'Analise: 1) as especificidades e os riscos inerentes à função de policial penal; 2) o impacto do ambiente prisional na saúde física e mental do servidor; 3) políticas públicas de valorização, capacitação e apoio biopsicossocial.',
    teses: [
      'A eficiência da execução penal e a garantia dos direitos dos custodiados dependem diretamente da valorização e do suporte à saúde do policial penal.',
      'O atendimento psicológico preventivo e o aparelhamento tático das equipes de custódia são medidas urgentes de valorização da categoria.'
    ],
    f: 'Saúde ocupacional, síndrome de burnout, capacitação contínua, equipamentos de proteção individual e modernização da carreira.',
    r: 'EC nº 104/2019; Lei nº 13.675/2018 (SUSP - Valorização dos Profissionais de Segurança); Byung-Chul Han (Sociedade do Cansaço); Christophe Dejours.',
    p: 'Criação de centros estaduais de atenção psicossocial dedicados aos servidores da segurança pública e planos de carreira estruturados com formação continuada.'
  },

  /* --- CBMPE / INSTITUTO AOCP --- */
  {
    e: 'cbmpe',
    banca: 'Instituto AOCP',
    t: 'O papel da Defesa Civil e do Corpo de Bombeiros na mitigação de desastres provocados por eventos climáticos extremos',
    problema: 'Vulnerabilidade de populações em encostas e áreas alagáveis diante do agravamento de chuvas intensas e secas severas.',
    comando: 'Discorra sobre a relação entre desigualdade urbana, mudanças climáticas e a atuação preventiva e operacional dos Corpos de Bombeiros e da Defesa Civil.',
    teses: [
      'As tragédias decorrentes de eventos climáticos extremos não são meras fatalidades naturais, mas reflexos da ocupação urbana desordenada e da falta de prevenção estatal.',
      'A proteção da vida diante da crise climática exige integrar o planejamento urbano municipal à atuação preventiva da Defesa Civil e do Corpo de Bombeiros.'
    ],
    f: 'Ocupação desordenada de encostas, chuvas torrenciais, planejamento urbano e resposta rápida a desastres.',
    r: 'Lei nº 12.608/2012 (PNPDEC); CF/88 (Art. 144, § 5º e Art. 225); Milton Santos (Cidadanias Mutiladas); Hans Jonas.',
    p: 'Mapeamento geotécnico de áreas de risco, sistemas de alerta precoce nas comunidades e simulados de evacuação coordenados pelo CBMPE e Defesa Civil.'
  },
  {
    e: 'cbmpe',
    banca: 'Instituto AOCP',
    t: 'Cultura de prevenção a incêndios em edificações coletivas e a conscientização comunitária para primeiros socorros',
    problema: 'Negligência com normas técnicas de segurança contra incêndio e desconhecimento básico da população sobre ações iniciais de salvamento.',
    comando: 'Aborde a importância do poder de polícia administrativa dos Bombeiros na fiscalização predial e a difusão de primeiros socorros nas escolas e comunidades.',
    teses: [
      'A consolidação de uma cultura preventiva de segurança contra incêndios e pânico salva mais vidas do que a atuação exclusivamente emergencial.',
      'A capacitação comunitária e escolar em noções de primeiros socorros reduz drasticamente a mortalidade em acidentes domésticos e escolares.'
    ],
    f: 'Fiscalização de normas técnicas de prevenção contra incêndio, educação comunitária e aplicação da Lei Lucas nas escolas.',
    r: 'Lei nº 13.722/2018 (Lei Lucas - Primeiros Socorros nas Escolas); CF/88 (Art. 144, § 5º); Émile Durkheim (Fato Social e educação coletiva).',
    p: 'Intensificação de vistorias técnicas preventivas em edificações e realização de oficinas periódicas de primeiros socorros em escolas públicas.'
  },
  {
    e: 'cbmpe',
    banca: 'Instituto AOCP',
    t: 'Queimadas florestais e crimes ambientais: desafios para a preservação dos biomas brasileiros e da saúde coletiva',
    problema: 'Avanço de incêndios florestais de origem antrópica que destroem a biodiversidade, agravam doenças respiratórias e sobrecarregam os bombeiros.',
    comando: 'Analise as causas das queimadas ilegais, seus impactos socioambientais e o papel integrado da fiscalização ambiental e do combate florestal.',
    teses: [
      'O enfrentamento aos incêndios florestais exige aliar o aparelhamento dos grupamentos de combate a incêndio florestal à responsabilização rigorosa dos ilícitos ambientais.',
      'A destruição dos biomas por queimadas compromete simultaneamente o equilíbrio ecológico e a saúde pública, violando o direito constitucional ao meio ambiente sadio.'
    ],
    f: 'Combate a incêndios florestais, responsabilidade ambiental, monitoramento por satélite e proteção da saúde respiratória.',
    r: 'CF/88 (Art. 225); Lei nº 9.605/1998 (Lei de Crimes Ambientais); Hans Jonas (O Princípio Responsabilidade).',
    p: 'Criação de brigadas florestais permanentes equipadas com monitoramento por satélite e campanhas de manejo sustentável junto a produtores rurais.'
  },

  /* --- PMSP / VUNESP --- */
  {
    e: 'pmsp',
    banca: 'VUNESP',
    t: 'A gestão da segurança pública nos grandes centros urbanos: entre a repressão qualificada e a prevenção social',
    problema: 'Complexidade da violência metropolitana, degradação de centros urbanos e sensação de insegurança coletiva.',
    comando: 'Redija uma dissertação argumentativa discutindo como conciliar o policiamento ostensivo inteligente com políticas sociais e urbanísticas nas metrópoles.',
    teses: [
      'A redução sustentável dos índices criminais nas metrópoles requer a articulação entre o policiamento ostensivo orientado por dados e a requalificação social do espaço urbano.',
      'A segurança pública nos grandes centros não pode atuar isoladamente; ela depende da presença integrada do Estado em iluminação, saúde, educação e assistência social.'
    ],
    f: 'Concentração demográfica, ocupação de espaços degradados, sensação de segurança e respeito às liberdades.',
    r: 'CF/88 (Art. 144); Zygmunt Bauman (Medo Líquido e Modernidade Líquida); Milton Santos (O Espaço do Cidadão).',
    p: 'Policiamento orientado por estatísticas georreferenciadas aliado a programas municipais de revitalização urbana e assistência psicossocial.'
  },
  {
    e: 'pmsp',
    banca: 'VUNESP',
    t: 'A saúde mental dos profissionais de segurança pública e o dever do Estado na preservação da vida do agente',
    problema: 'Altos índices de estresse ocupacional, síndrome de burnout, depressão e vitimização psíquica entre policiais e bombeiros.',
    comando: 'Analise os fatores de desgaste emocional na carreira policial, o estigma institucional sobre o sofrimento psíquico e a responsabilidade do Estado.',
    teses: [
      'Cuidar da saúde mental do agente de segurança pública não é apenas um dever trabalhista do Estado, mas condição indispensável para a qualidade do atendimento prestado à sociedade.',
      'A superação do estigma em torno do adoecimento psíquico nas corporações exige acompanhamento psicológico contínuo, sigiloso e institucionalizado.'
    ],
    f: 'Estresse pós-traumático, jornada exaustiva, desconstrução do estigma e suporte biopsicossocial ao servidor.',
    r: 'CF/88 (Art. 196 - Direito à Saúde e Art. 1º, III); Byung-Chul Han (Sociedade do Cansaço); Lei nº 13.675/2018 (Valorização dos profissionais no SUSP).',
    p: 'Estruturação de programas permanentes e sigilosos de atenção psicossocial nas corporações, com avaliação periódica e adequação das escalas.'
  },
  {
    e: 'pmsp',
    banca: 'VUNESP',
    t: 'A ética e a disciplina no serviço público como pilares de legitimidade das instituições democráticas',
    problema: 'Impacto de desvios de conduta individuais sobre a imagem coletiva das instituições públicas e a confiança cidadã.',
    comando: 'Discorra sobre a relação entre legalidade estrita, responsabilidade ética do agente público e fortalecimento da democracia.',
    teses: [
      'A autoridade do agente público em uma democracia sustenta-se na exemplaridade ética e na estrita observância da legalidade constitucional.',
      'O fortalecimento das corregedorias e da formação ética continuada protege a honra das instituições contra desvios individuais.'
    ],
    f: 'Princípios da administração pública (LIMPE), controle interno/externo, formação ética e confiança social.',
    r: 'CF/88 (Art. 37 - Legalidade, Impessoalidade, Moralidade, Publicidade e Eficiência); Immanuel Kant (Ética do Dever); Hannah Arendt.',
    p: 'Reforço das disciplinas de Direitos Humanos e Deontologia nos cursos de formação e fortalecimento da transparência institucional.'
  },

  /* --- EIXO TECNOLOGIA, IA & CIBERCRIMES (MULTI-BANCAS) --- */
  {
    e: 'tec',
    banca: 'Multi-Bancas (AOCP / Cebraspe / Vunesp)',
    t: 'Os impactos éticos, educacionais e laborais da Inteligência Artificial generativa na sociedade contemporânea',
    problema: 'Transformação acelerada do mundo do trabalho, riscos de plágio e dependência cognitiva, uso de deepfakes e necessidade de regulação ética.',
    comando: 'Analise os benefícios e os riscos da Inteligência Artificial, abordando a qualificação profissional, a ética no uso de dados e o papel regulador do Estado.',
    teses: [
      'A Inteligência Artificial deve ser orientada como ferramenta de ampliação das capacidades humanas, exigindo regulamentação ética e requalificação dos trabalhadores.',
      'O uso acrítico de sistemas automatizados pode aprofundar desigualdades e disseminar fraudes informacionais caso não haja governança transparente.'
    ],
    f: 'Automação do trabalho, ética algorítmica, combate a deepfakes e formação crítica.',
    r: 'Hans Jonas (O Princípio Responsabilidade); Shoshana Zuboff (Capitalismo de Vigilância); CF/88 (Art. 5º - Proteção de Dados).',
    p: 'Poder Legislativo e Executivo devem estabelecer marco regulatório de transparência para sistemas de IA e criar programas nacionais de capacitação tecnológica.'
  },
  {
    e: 'tec',
    banca: 'Multi-Bancas (AOCP / Cebraspe / Vunesp)',
    t: 'O uso de reconhecimento facial na segurança pública: entre a eficiência investigativa e a proteção de direitos fundamentais',
    problema: 'Potencial tecnológico na localização de foragidos e desaparecidos contraposto aos riscos de viés algorítmico e falsos positivos.',
    comando: 'Pondere sobre os ganhos operacionais da biometria facial na segurança pública e as salvaguardas jurídicas necessárias para evitar erros judiciais.',
    teses: [
      'As tecnologias de reconhecimento facial constituem importante instrumento de apoio policial, desde que submetidas à supervisão humana e a critérios rigorosos de auditoria.',
      'Nenhuma ferramenta tecnológica pode substituir o devido processo legal e a verificação probatória complementar na investigação criminal.'
    ],
    f: 'Biometria, inteligência policial, proteção de dados sensíveis e prevenção de erros de identificação.',
    r: 'CF/88 (Art. 5º, LIV - Devido Processo Legal); LGPD (Lei nº 13.709/2018); Michel Foucault (Sociedade de Vigilância).',
    p: 'Ministério da Justiça e Secretarias de Segurança devem instituir protocolo nacional proibindo prisões baseadas exclusivamente em reconhecimento facial sem confirmação pericial.'
  },
  {
    e: 'tec',
    banca: 'Multi-Bancas (AOCP / Cebraspe / Vunesp)',
    t: 'Dependência digital e os efeitos do uso excessivo de telas no desenvolvimento cognitivo e emocional de crianças e jovens',
    problema: 'Queda na atenção concentrada, isolamento social, cyberbullying e transtornos de ansiedade associados à hiperconexão precoce.',
    comando: 'Aborde as consequências pedagógicas e psíquicas da exposição excessiva às telas na infância e adolescência e o dever da família e da escola.',
    teses: [
      'A hiperexposição precoce às telas compromete a atenção, a socialização presencial e a saúde mental de crianças e adolescentes, exigindo mediação familiar e escolar.',
      'A regulação do uso de dispositivos móveis no ambiente escolar é medida pedagógica necessária para restaurar o foco no aprendizado e na convivência.'
    ],
    f: 'Economia da atenção, saúde mental juvenil, regulamentação de celulares nas escolas e responsabilidade parental.',
    r: 'Byung-Chul Han (Sociedade do Cansaço); CF/88 (Art. 227); Lei nº 8.069/1990 (ECA).',
    p: 'Escolas e famílias, apoiadas pelos Ministérios da Educação e da Saúde, devem estabelecer limites claros ao uso de telas em sala de aula e fomentar atividades esportivas e culturais.'
  },

  /* --- EIXO MEIO AMBIENTE, CLIMA & SAÚDE PÚBLICA (MULTI-BANCAS) --- */
  {
    e: 'amb',
    banca: 'Multi-Bancas (AOCP / Cebraspe / Vunesp)',
    t: 'Saneamento básico e saúde pública: o desafio da universalização da água tratada e do esgotamento sanitário no Brasil',
    problema: 'Milhões de brasileiros ainda vivem sem coleta de esgoto e água potável regular, perpetuando doenças de veiculação hídrica e desigualdade.',
    comando: 'Analise a relação direta entre saneamento básico, dignidade humana, redução de gastos hospitalares no SUS e preservação hídrica.',
    teses: [
      'A carência de saneamento básico no Brasil configura grave violação à dignidade humana e perpetua doenças evitáveis nas populações mais pobres.',
      'Investir na universalização da água potável e da coleta de esgoto é a política preventiva de saúde pública e preservação ambiental mais eficiente para o Estado.'
    ],
    f: 'Medicina preventiva, dignidade humana, poluição de rios urbanos e desigualdade socioespacial.',
    r: 'CF/88 (Art. 6º, Art. 196 e Art. 225); Milton Santos (Cidadanias Mutiladas); OMS (Determinantes Sociais da Saúde).',
    p: 'União, estados e municípios devem cumprir as metas de universalização do saneamento com fiscalização de investimentos prioritários em periferias e áreas rurais.'
  },
  {
    e: 'amb',
    banca: 'Multi-Bancas (AOCP / Cebraspe / Vunesp)',
    t: 'Insegurança alimentar e o paradoxo da fome em um dos maiores produtores agrícolas do mundo',
    problema: 'Coexistência entre recordes na produção de alimentos para exportação, desperdício na cadeia logística e famílias em vulnerabilidade nutricional.',
    comando: 'Discuta os fatores socioeconômicos e logísticos da insegurança alimentar no Brasil e caminhos para assegurar o direito humano à alimentação adequada.',
    teses: [
      'A persistência da insegurança alimentar no Brasil não decorre da escassez produtiva, mas da concentração de renda e do desperdício ao longo da cadeia de distribuição.',
      'Garantir a soberania alimentar exige fortalecer a agricultura familiar, os bancos de alimentos e as políticas de geração de emprego e renda.'
    ],
    f: 'Direito à alimentação, agricultura familiar, combate ao desperdício e redução da desigualdade.',
    r: 'CF/88 (Art. 6º - Direito à Alimentação); Josué de Castro (Geografia da Fome); Amartya Sen (Desenvolvimento como Liberdade).',
    p: 'Governo Federal e estados devem ampliar a compra direta da agricultura familiar para merenda escolar e restaurantes populares, além de incentivar bancos de alimentos.'
  },
  {
    e: 'amb',
    banca: 'Multi-Bancas (AOCP / Cebraspe / Vunesp)',
    t: 'Queda nas taxas de cobertura vacinal e os riscos de reemergência de doenças erradicadas no Brasil',
    problema: 'Hesitação vacinal alimentada por desinformação e falsa sensação de segurança, ameaçando a imunidade coletiva.',
    comando: 'Analise a importância histórica do Programa Nacional de Imunizações (PNI), as causas da queda vacinal e estratégias de mobilização comunitária.',
    teses: [
      'A vacinação em massa é um pacto coletivo de saúde pública que não pode ser comprometido pela desinformação científica nem pela negligência logística.',
      'Recuperar os índices históricos do Programa Nacional de Imunizações requer busca ativa nos territórios e comunicação científica acessível.'
    ],
    f: 'Imunidade coletiva, história da saúde pública brasileira, combate às fake news em saúde e atenção primária do SUS.',
    r: 'CF/88 (Art. 196 e Art. 227); Lei nº 8.069/1990 (ECA - obrigatoriedade da vacinação infantil); Émile Durkheim (Coesão e dever coletivo).',
    p: 'Ministério da Saúde e secretarias municipais devem ampliar os horários dos postos de vacinação, realizar campanhas em escolas e esclarecer dúvidas com linguagem acessível.'
  },

  /* --- EIXO EDUCAÇÃO, CULTURA & TRABALHO (MULTI-BANCAS) --- */
  {
    e: 'edu',
    banca: 'Multi-Bancas (AOCP / Cebraspe / Vunesp)',
    t: 'Evasão escolar no ensino médio brasileiro: entre a necessidade precoce de trabalho e a crise de sentido da escola',
    problema: 'Jovens de baixa renda abandonam os estudos para complementar a renda familiar ou por desmotivação com a infraestrutura escolar.',
    comando: 'Aborde os fatores socioeconômicos e pedagógicos da evasão escolar e o impacto dessa exclusão no desenvolvimento nacional.',
    teses: [
      'O combate à evasão escolar no ensino médio exige conciliar políticas de permanência estudantil com a modernização pedagógica e estrutural da escola pública.',
      'Quando o jovem vulnerável é forçado a escolher entre trabalhar e estudar, perpetua-se o ciclo intergeracional da pobreza e da baixa qualificação.'
    ],
    f: 'Permanência estudantil, desigualdade educacional, ensino técnico integrado e futuro da juventude.',
    r: 'CF/88 (Art. 205 e Art. 206); Paulo Freire (Pedagogia da Autonomia); Amartya Sen (Expansão das capacidades humanas).',
    p: 'MEC e governos estaduais devem fortalecer programas de bolsa-permanência vinculados à frequência escolar e expandir laboratórios, bibliotecas e ensino técnico integrado.'
  },
  {
    e: 'edu',
    banca: 'Multi-Bancas (AOCP / Cebraspe / Vunesp)',
    t: 'A precarização do trabalho na era das plataformas digitais (uberização) e a proteção social do trabalhador',
    problema: 'Crescimento de trabalhadores por aplicativos submetidos a jornadas exaustivas sem garantias previdenciárias ou segurança ocupacional.',
    comando: 'Discuta o equilíbrio entre inovação tecnológica, geração de renda e preservação dos direitos sociais do trabalhador.',
    teses: [
      'A modernização tecnológica das relações de trabalho não pode servir de pretexto para suprimir a proteção previdenciária e a dignidade do trabalhador.',
      'É dever do Estado construir uma regulamentação equilibrada que preserve a geração de renda por aplicativos e garanta segurança jurídica e social.'
    ],
    f: 'Uberização, jornadas exaustivas, previdência social e dignidade do trabalho.',
    r: 'CF/88 (Art. 1º, IV - Valores Sociais do Trabalho e Art. 7º); Byung-Chul Han (Sociedade do Cansaço); Zygmunt Bauman (Modernidade Líquida).',
    p: 'Ministério do Trabalho e Congresso Nacional devem regulamentar pisos de remuneração por hora efetiva, cobertura previdenciária simplificada e pontos de apoio urbano.'
  },
  {
    e: 'edu',
    banca: 'Multi-Bancas (AOCP / Cebraspe / Vunesp)',
    t: 'A importância da leitura e da democratização do acesso ao livro para a formação cidadã no Brasil',
    problema: 'Baixo índice de leitura crítica, escassez de bibliotecas comunitárias ativas e concentração de equipamentos culturais nos grandes centros.',
    comando: 'Analise como o hábito da leitura desenvolve o repertório vocabular, a empatia e o senso crítico indispensáveis à cidadania.',
    teses: [
      'O déficit de leitura crítica no Brasil reflete a histórica desigualdade de acesso aos bens culturais e a precariedade de bibliotecas escolares e comunitárias.',
      'Democratizar o livro e a literatura é instrumento essencial para emancipar o pensamento e fortalecer a participação democrática.'
    ],
    f: 'Letramento crítico, bibliotecas públicas, direito à cultura e formação intelectual.',
    r: 'CF/88 (Art. 215 - Direito à Cultura); Antonio Candido (O Direito à Literatura); Paulo Freire (A Importância do Ato de Ler).',
    p: 'Ministério da Cultura e MEC devem revitalizar bibliotecas escolares e comunitárias com acervos atualizados e promover feiras literárias e clubes de leitura.'
  },
  {
    e: 'pmpe',
    banca: 'Instituto AOCP',
    t: 'O combate à perturbação do sossego e a mediação de conflitos de vizinhança pela Polícia Militar',
    problema: 'Elevado volume de ocorrências de poluição sonora e desentendimentos comunitários que demandam atuação técnica e preventiva.',
    comando: 'Aborde o equilíbrio entre o direito ao lazer e o direito ao repouso e à saúde coletiva, bem como o papel mediador da Polícia Militar.',
    teses: [
      'A preservação da ordem pública tranquila exige fiscalização integrada contra a poluição sonora aliada à educação para a convivência urbana.',
      'A mediação policial técnica em conflitos cotidianos previne a escalada da violência interpessoal e desafoga o sistema de justiça.'
    ],
    f: 'Ordem pública, convivência comunitária, mediação policial e respeito aos direitos de vizinhança.',
    r: 'CF/88 (Art. 144); Decreto-Lei nº 3.688/1941 (Lei das Contravenções Penais - Art. 42); Émile Durkheim (Coesão e regras de convivência).',
    p: 'Ações conjuntas entre Polícia Militar, secretarias municipais de meio ambiente e conselhos comunitários para fiscalização preventiva e orientação.'
  },
  {
    e: 'pmpe',
    banca: 'Instituto AOCP',
    t: 'A proteção do patrimônio histórico, cultural e turístico e o policiamento especializado em grandes eventos',
    problema: 'Desafios de segurança pública na preservação de centros históricos e na proteção de cidadãos em eventos de grande concentração popular.',
    comando: 'Discorra sobre o planejamento estratégico do policiamento ostensivo em eventos culturais e a defesa do patrimônio público.',
    teses: [
      'A segurança em grandes eventos populares e centros históricos depende de planejamento preventivo integrado, tecnologia de monitoramento e efetivo capacitado.',
      'Proteger o patrimônio cultural e a segurança dos eventos fortalece a identidade regional, o turismo e o desenvolvimento econômico.'
    ],
    f: 'Policiamento turístico e de grandes eventos, preservação do patrimônio histórico e planejamento operacional.',
    r: 'CF/88 (Art. 144 e Art. 216 - Patrimônio Cultural); Zygmunt Bauman (Convivência no espaço público).',
    p: 'Integração entre centros de comando e controle, policiamento a pé de proximidade e videomonitoramento preventivo em áreas históricas.'
  },
  {
    e: 'pcpe',
    banca: 'CESPE / CEBRASPE',
    t: 'O enfrentamento à corrupção e aos crimes contra a Administração Pública como condição para a justiça social',
    problema: 'Desvio de recursos públicos que deveriam financiar saúde, educação, infraestrutura e segurança pública.',
    comando: 'Aborde: 1) os impactos sociais dos crimes contra a Administração Pública; 2) o papel da investigação financeira e patrimonial; 3) transparência e controle social.',
    teses: [
      'O desvio de verbas públicas atinge diretamente os direitos sociais mais elementares da população vulnerável, exigindo investigação especializada e recuperação de ativos.',
      'A superação do patrimonialismo histórico requer transparência ativa, controle institucional e responsabilização técnica dentro do devido processo legal.'
    ],
    f: 'Investigação de crimes de colarinho branco, recuperação de ativos, moralidade administrativa e controle social.',
    r: 'CF/88 (Art. 37 - Moralidade e Eficiência); Sérgio Buarque de Holanda (Patrimonialismo em Raízes do Brasil); Gilberto Dimenstein.',
    p: 'Fortalecimento de delegacias fazendárias e de combate à corrupção com intercâmbio de dados junto aos Tribunais de Contas e Controladorias.'
  },
  {
    e: 'pcpe',
    banca: 'CESPE / CEBRASPE',
    t: 'Tráfico de pessoas e trabalho análogo à escravidão no século XXI: desafios de investigação e resgate da dignidade',
    problema: 'Persistência de aliciamento de trabalhadores vulneráveis em condições degradantes no campo e nas cidades.',
    comando: 'Analise as causas socioeconômicas da escravidão contemporânea, a repressão policial integrada e a assistência às vítimas resgatadas.',
    teses: [
      'A erradicação do trabalho análogo à escravidão exige aliar a repressão policial e trabalhista à quebra do ciclo de vulnerabilidade socioeconômica das vítimas.',
      'Sem políticas de qualificação profissional e reinserção social pós-resgate, trabalhadores vulneráveis permanecem expostos ao realiciamento.'
    ],
    f: 'Dignidade humana no trabalho, investigação de redes de aliciamento e reinserção produtiva de resgatados.',
    r: 'CF/88 (Art. 1º, III e IV; Art. 5º, III); Código Penal (Art. 149); Immanuel Kant (Ser humano como fim em si mesmo).',
    p: 'Operações integradas entre Polícia Judiciária, Ministério Público do Trabalho e auditoria fiscal, seguidas de inclusão das vítimas em programas de qualificação.'
  },
  {
    e: 'cbmpe',
    banca: 'Instituto AOCP',
    t: 'Segurança aquática e prevenção a afogamentos: educação comunitária e atuação dos guarda-vidas',
    problema: 'Elevado número de mortes evitáveis por afogamento em praias, rios, açudes e piscinas no território brasileiro.',
    comando: 'Aborde a importância da sinalização preventiva, da educação aquática desde a infância e do salvamento marítimo e fluvial pelo Corpo de Bombeiros.',
    teses: [
      'O afogamento é um grave problema de saúde e segurança pública cuja redução depende fundamentalmente de educação preventiva e sinalização das áreas de risco.',
      'O fortalecimento dos grupamentos de guarda-vidas deve caminhar junto com campanhas educativas para banhistas e comunidades ribeirinhas.'
    ],
    f: 'Prevenção de afogamentos, salvamento aquático, sinalização de áreas balneáveis e conscientização cidadã.',
    r: 'CF/88 (Art. 5º - Direito à Vida e Art. 144, § 5º); OMS (Relatórios de Prevenção a Afogamentos).',
    p: 'Ampliação de postos de guarda-vidas, sinalização clara em praias e rios e projetos sociais de natação e segurança aquática para estudantes da rede pública.'
  },
  {
    e: 'cbmpe',
    banca: 'Instituto AOCP',
    t: 'Acidentes domésticos na infância e na terceira idade: prevenção, arquitetura segura e atendimento pré-hospitalar',
    problema: 'Quedas, queimaduras, engasgos e intoxicações residenciais que figuram entre as principais causas de hospitalização de crianças e idosos.',
    comando: 'Discorra sobre o papel educativo do Corpo de Bombeiros e das famílias na prevenção de sinistros domésticos e no atendimento pré-hospitalar (APH).',
    teses: [
      'A maioria dos acidentes domésticos envolvendo crianças e idosos pode ser evitada mediante adaptações simples no ambiente domiciliar e orientação familiar.',
      'O tempo-resposta do atendimento pré-hospitalar (APH) aliado ao conhecimento básico da família em primeiros socorros é decisivo para preservar vidas.'
    ],
    f: 'Prevenção de quedas e queimaduras, proteção de crianças e idosos, atendimento pré-hospitalar.',
    r: 'Lei nº 8.069/1990 (ECA); Lei nº 10.741/2003 (Estatuto da Pessoa Idosa); Lei nº 13.722/2018 (Lei Lucas).',
    p: 'Campanhas comunitárias do Corpo de Bombeiros e agentes comunitários de saúde sobre prevenção de acidentes no lar e manobras de desengasgo.'
  },
  {
    e: 'pmsp',
    banca: 'VUNESP',
    t: 'Violência no trânsito brasileiro: entre a imprudência individual, a fiscalização estatal e a educação viária',
    problema: 'Milhares de mortes e sequelas permanentes causadas anualmente por sinistros de trânsito associados ao álcool, velocidade e uso de celular.',
    comando: 'Redija texto dissertativo-argumentativo sobre os fatores humanos e estruturais da violência viária e medidas para um trânsito seguro.',
    teses: [
      'A redução da mortalidade no trânsito brasileiro exige combinar fiscalização rigorosa da Lei Seca com educação viária permanente e infraestrutura segura.',
      'A imprudência ao volante reflete uma crise de empatia e desrespeito às normas coletivas que sobrecarrega o sistema público de saúde.'
    ],
    f: 'Segurança viária, fiscalização de alcoolemia, engenharia de tráfego e responsabilidade cidadã.',
    r: 'Lei nº 9.503/1997 (Código de Trânsito Brasileiro); Lei nº 11.705/2008 (Lei Seca); Sérgio Buarque de Holanda (Homem Cordial e desrespeito às regras impessoais).',
    p: 'Intensificação de blitze educativas e fiscalizatórias, melhoria da sinalização viária e inclusão transversal da educação para o trânsito nas escolas.'
  },
  {
    e: 'pmsp',
    banca: 'VUNESP',
    t: 'O enfrentamento à população em situação de rua nos centros urbanos: entre a segurança pública e a dignidade humana',
    problema: 'Crescimento da população em situação de vulnerabilidade extrema nas ruas das metrópoles, demandando políticas intersetoriais.',
    comando: 'Analise como o Poder Público deve articular assistência social, saúde mental, moradia e segurança urbana sem violar direitos fundamentais.',
    teses: [
      'A questão da população em situação de rua é um fenômeno social complexo que não se resolve por ações meramente higienistas, exigindo rede intersetorial de acolhimento.',
      'Cabe ao Estado conciliar a ordenação segura do espaço público com políticas efetivas de saúde mental, qualificação e moradia digna.'
    ],
    f: 'Vulnerabilidade social, políticas de acolhimento, saúde mental e convivência no espaço urbano.',
    r: 'CF/88 (Art. 1º, III e Art. 6º - Direito à Moradia); Milton Santos (Cidadanias Mutiladas); Gilberto Dimenstein (O Cidadão de Papel).',
    p: 'Atuação conjunta de equipes de abordagem social, saúde (Consultório na Rua), habitação solidária e policiamento comunitário capacitado.'
  },
  {
    e: 'tec',
    banca: 'Multi-Bancas (AOCP / Cebraspe / Vunesp)',
    t: 'Exposição infantil nas redes sociais (sharenting) e a proteção dos direitos de personalidade de crianças e adolescentes',
    problema: 'Superexposição da rotina e da imagem de menores na internet, muitas vezes com fins comerciais, gerando riscos à segurança e ao desenvolvimento psíquico.',
    comando: 'Discuta os limites da autoridade parental diante da privacidade digital da criança, os riscos do trabalho infantil artístico digital e o dever de proteção.',
    teses: [
      'A hiperexposição de crianças nas redes sociais viola o direito fundamental à privacidade e expõe menores a riscos de segurança e exploração comercial.',
      'O princípio do melhor interesse da criança deve prevalecer no ambiente digital, exigindo conscientização familiar e regulamentação das plataformas.'
    ],
    f: 'Privacidade infantil, direito à imagem, responsabilidade parental e segurança digital.',
    r: 'CF/88 (Art. 227); Lei nº 8.069/1990 (ECA - Direito ao Respeito e à Dignidade); LGPD (Lei nº 13.709/2018 - Art. 14 sobre dados de crianças).',
    p: 'Conselhos dos Direitos da Criança e do Adolescente e Ministério Público devem estabelecer diretrizes contra a adultização e exploração comercial infantil nas redes, acompanhadas de campanhas de educação parental.'
  },
  {
    e: 'amb',
    banca: 'Multi-Bancas (AOCP / Cebraspe / Vunesp)',
    t: 'Gestão de resíduos sólidos e logística reversa: desafios para a erradicação dos lixões e o avanço da reciclagem no Brasil',
    problema: 'Baixo índice de coleta seletiva, persistência de descarte inadequado de lixo e subvalorização dos catadores de materiais recicláveis.',
    comando: 'Aborde os entraves para o cumprimento da Política Nacional de Resíduos Sólidos, a responsabilidade compartilhada e a inclusão socioeconômica de catadores.',
    teses: [
      'A superação da crise dos resíduos sólidos no Brasil exige que municípios, indústrias e cidadãos cumpram a responsabilidade compartilhada pelo ciclo de vida dos produtos.',
      'A transição para uma economia circular depende da expansão da coleta seletiva municipal e da valorização das cooperativas de catadores.'
    ],
    f: 'Política Nacional de Resíduos Sólidos, logística reversa, coleta seletiva e sustentabilidade urbana.',
    r: 'Lei nº 12.305/2010 (Política Nacional de Resíduos Sólidos); CF/88 (Art. 225); Zygmunt Bauman (Vida para o Consumo); Hans Jonas.',
    p: 'Prefeituras e Ministério do Meio Ambiente devem ampliar a coleta seletiva porta a porta, fiscalizar acordos de logística reversa com indústrias e estruturar cooperativas de reciclagem.'
  },
  {
    e: 'edu',
    banca: 'Multi-Bancas (AOCP / Cebraspe / Vunesp)',
    t: 'Valorização do magistério e melhoria da infraestrutura escolar como alicerces do desenvolvimento nacional',
    problema: 'Desvalorização salarial e social da carreira docente, sobrecarga de trabalho e carência de laboratórios e recursos pedagógicos em escolas públicas.',
    comando: 'Redija texto dissertativo-argumentativo sobre a centralidade do professor e da estrutura escolar para a qualidade da educação pública brasileira.',
    teses: [
      'Nenhuma reforma educacional alcança êxito duradouro sem a valorização remuneratória, formativa e institucional dos professores da educação básica.',
      'A desigualdade de infraestrutura entre as escolas brasileiras compromete a equidade de oportunidades e o desenvolvimento socioeconômico do país.'
    ],
    f: 'Carreira docente, piso salarial, formação continuada e infraestrutura das escolas públicas.',
    r: 'CF/88 (Art. 205 e Art. 206, V - Valorização dos Profissionais da Educação); Paulo Freire (Professora Sim, Tia Não / Pedagogia da Autonomia); Amartya Sen.',
    p: 'União, estados e municípios devem assegurar o cumprimento integral do piso e dos planos de carreira do magistério, destinando recursos do Fundeb para modernização física e formação docente.'
  }
];

/* 5. BANCO DE PORTUGUÊS AMPLIADO: QUESTÕES EXPLICADAS COM REGRA E EXEMPLO ADICIONAL (SEÇÃO 9) */
const QUIZ_BANCA = [
  {
    id: 'q1',
    categoria: 'Concordância Verbal',
    q: 'Assinale a alternativa que respeita rigorosamente a concordância verbal exigida pelas bancas examinadoras (AOCP, Cebraspe e Vunesp):',
    o: [
      'Houveram diversos avanços tecnológicos na investigação criminal.',
      'Houve diversos avanços tecnológicos na investigação criminal.',
      'Haviam diversos avanços tecnológicos na investigação criminal.'
    ],
    a: 1,
    exp: 'O verbo "haver" no sentido de existir, ocorrer ou acontecer é impessoal (não possui sujeito). Por isso, deve permanecer obrigatoriamente na 3ª pessoa do singular.',
    regra: 'Verbos impessoais (haver = existir/ocorrer; fazer = tempo decorrido) não flexionam no plural, transmitindo sua impessoalidade também ao verbo auxiliar nas locuções (ex.: "Deve haver soluções", nunca "Devem haver").',
    exemploAdicional: 'Correto: "Houve intensos debates sobre segurança pública." / Equivalente com existir: "Existiram intensos debates sobre segurança pública."'
  },
  {
    id: 'q2',
    categoria: 'Regência Verbal',
    q: 'Indique a alternativa correta quanto à regência formal do verbo "visar" no sentido de ter por objetivo / almejar:',
    o: [
      'As políticas públicas visam o fortalecimento da cidadania.',
      'As políticas públicas visam ao fortalecimento da cidadania.',
      'As políticas públicas visam pelo fortalecimento da cidadania.'
    ],
    a: 1,
    exp: 'Na norma-padrão cobrada em concursos, o verbo "visar", na acepção de ter em vista ou objetivar, é transitivo indireto e rege a preposição "a".',
    regra: 'Visar (almejar/objetivar) = VTI (exige preposição "a"). Quando seguido de verbo no infinitivo, a preposição costuma ser omitida por eufonia ("visa garantir"), mas diante de substantivo exige "a" ("visa ao bem-estar", "visa à proteção").',
    exemploAdicional: 'Correto: "O policiamento preventivo visa à preservação da ordem pública."'
  },
  {
    id: 'q3',
    categoria: 'Pontuação Sintática',
    q: 'Qual dos períodos abaixo NÃO apresenta erro de pontuação segundo a gramática normativa?',
    o: [
      'A atuação integrada das forças policiais, garante maior eficiência investigativa.',
      'A atuação integrada das forças policiais garante maior eficiência investigativa.',
      'A atuação integrada das forças policiais garante, maior eficiência investigativa.'
    ],
    a: 1,
    exp: 'Jamais se deve separar por vírgula o sujeito ("A atuação integrada das forças policiais") de seu verbo ("garante"), nem o verbo de seu complemento direto ("maior eficiência investigativa").',
    regra: 'Na ordem direta (Sujeito + Verbo + Complemento), não se emprega vírgula entre os termos essenciais e integrantes da oração, mesmo quando o sujeito é longo.',
    exemploAdicional: 'Correto com adjunto deslocado: "No Brasil contemporâneo, a atuação integrada das forças policiais garante maior eficiência."'
  },
  {
    id: 'q4',
    categoria: 'Ortografia & Homônimos',
    q: 'Assinale a frase em que a expressão destacada foi empregada com a grafia CORRETA:',
    o: [
      'O Estado deve investir em prevenção afim de reduzir os índices de violência.',
      'O Estado deve investir em prevenção a fim de reduzir os índices de violência.',
      'O Estado deve investir em prevenção à fim de reduzir os índices de violência.'
    ],
    a: 1,
    exp: 'A locução prepositiva/conjuntiva que indica finalidade escreve-se sempre separada e sem crase: "a fim de" (= para). O vocábulo junto "afim" é adjetivo que significa semelhante ou correlato.',
    regra: '"A fim de" (separado) = finalidade/objetivo. "Afim / afins" (junto) = afinidade/semelhança (ex.: "Direito e Sociologia são áreas afins").',
    exemploAdicional: 'Correto: "Foram criadas delegacias especializadas a fim de coibir crimes digitais."'
  },
  {
    id: 'q5',
    categoria: 'Crase',
    q: 'Em qual alternativa o emprego do acento grave indicativo de crase está CORRETO?',
    o: [
      'As medidas preventivas devem ser aplicadas à partir do planejamento estratégico.',
      'O policiamento comunitário traz benefícios à toda a população.',
      'O respeito às normas constitucionais é dever inegociável do Estado.'
    ],
    a: 2,
    exp: 'Em "respeito às normas", o substantivo "respeito" exige a preposição "a" e o substantivo feminino plural "normas" é antecedido pelo artigo definido "as" (a + as = às). Não ocorre crase antes de verbo ("a partir") nem antes de pronome indefinido ("a toda").',
    regra: 'A crase ocorre na fusão da preposição "a" com o artigo definido feminino "a/as". É proibida antes de verbos, palavras masculinas e pronomes indefinidos (todos, toda, qualquer, cada, ninguém).',
    exemploAdicional: 'Correto: "À medida que a educação avança, reduz-se a vulnerabilidade social."'
  },
  {
    id: 'q6',
    categoria: 'Colocação Pronominal',
    q: 'Segundo as regras de colocação pronominal da norma culta, assinale a construção CORRETA para uma redação formal:',
    o: [
      'Se observa, na atualidade, um crescimento das fraudes digitais.',
      'Não observa-se, na atualidade, um crescimento das fraudes digitais.',
      'Observa-se, na atualidade, que não se deve negligenciar a segurança digital.'
    ],
    a: 2,
    exp: 'Não se inicia período com pronome oblíquo átono (proibida a próclise inicial em "Se observa" -> correto: "Observa-se"). Além disso, palavras negativas como "não" funcionam como fatores atrativos obrigatórios de próclise ("não se deve").',
    regra: '1) Proibido iniciar frase com pronome átono (use ênclise: "Constata-se", "Nota-se"). 2) Palavras negativas (não, nunca, jamais), advérbios sem vírgula e conjunções subordinativas (que, embora, quando, conforme) exigem próclise.',
    exemploAdicional: 'Correto: "Verifica-se que o problema se agrava quando não se investe em prevenção."'
  },
  {
    id: 'q7',
    categoria: 'Regência Verbal',
    q: 'Quanto à regência dos verbos "acarretar" e "implicar" (no sentido de gerar/produzir consequência), assinale a opção CORRETA:',
    o: [
      'A omissão estatal acarreta em graves prejuízos sociais e implica na violação de direitos.',
      'A omissão estatal acarreta graves prejuízos sociais e implica a violação de direitos.',
      'A omissão estatal acarreta a graves prejuízos sociais e implica com a violação de direitos.'
    ],
    a: 1,
    exp: 'Na norma-padrão estrita, tanto "acarretar" quanto "implicar" (no sentido de causar/trazer como consequência) são verbos transitivos diretos (VTD), ou seja, não admitem a preposição "em".',
    regra: 'Evite "acarretar em" e "implicar em". Use diretamente: "acarreta prejuízos", "implica mudanças estruturais".',
    exemploAdicional: 'Correto: "O descumprimento das normas ambientais acarreta severos danos coletivos."'
  },
  {
    id: 'q8',
    categoria: 'Coesão & Operadores Argumentativos',
    q: 'Qual alternativa emprega corretamente a expressão "haja vista" em um texto dissertativo-argumentativo?',
    o: [
      'O investimento em inteligência é urgente, haja visto o avanço das facções.',
      'O investimento em inteligência é urgente, haja vista o avanço das facções.',
      'O investimento em inteligência é urgente, hajam vistas os avanços das facções.'
    ],
    a: 1,
    exp: 'A expressão conectiva causal/explicativa consagrada na norma culta é "haja vista" (com a palavra "vista" invariável no feminino). A forma "haja visto" é considerada desvio gramatical.',
    regra: 'Use sempre "haja vista" (= tendo em vista, visto que, uma vez que). Nunca escreva "haja visto".',
    exemploAdicional: 'Correto: "A prevenção mostra-se indispensável, haja vista a complexidade dos crimes cibernéticos."'
  },
  {
    id: 'q9',
    categoria: 'Concordância Verbal (Tempo Decorrido)',
    q: 'Assinale a alternativa gramaticalmente CORRETA na indicação de tempo transcorrido:',
    o: [
      'Fazem quase quatro décadas que a Constituição de 1988 foi promulgada.',
      'Faz quase quatro décadas que a Constituição de 1988 foi promulgada.',
      'Vão fazer quatro décadas que a Constituição de 1988 foi promulgada.'
    ],
    a: 1,
    exp: 'O verbo "fazer", quando indica tempo decorrido ou fenômeno meteorológico, é impessoal e deve permanecer na 3ª pessoa do singular ("Faz quase quatro décadas", "Vai fazer dez anos").',
    regra: 'Fazer (tempo decorrido) = impessoal (singular obligatorio, inclusive em locuções verbais: "Deve fazer dois anos").',
    exemploAdicional: 'Correto: "Faz mais de dois séculos que Cesare Beccaria publicou sua obra clássica."'
  },
  {
    id: 'q10',
    categoria: 'Pronome Relativo "Onde"',
    q: 'As bancas examinadoras penalizam o uso inadequado do pronome "onde". Assinale a frase em que "onde" foi usado CORRETAMENTE:',
    o: [
      'Vivemos um momento histórico onde a desinformação se espalha rapidamente.',
      'A legislação prevê situações onde o Estado deve intervir imediatamente.',
      'As regiões periféricas, onde a infraestrutura estatal é precária, demandam atenção prioritária.'
    ],
    a: 2,
    exp: 'O pronome "onde" só deve ser utilizado para retomar lugares físicos/espaciais ("As regiões periféricas, onde..."). Para retomar ideias abstratas, tempo ou situações ("momento", "situações", "contexto"), deve-se usar "em que" ou "no qual / na qual".',
    regra: 'Onde = exclusivamente lugar físico. Em que / no qual / na qual = tempo, situação, contexto, sociedade, cenário.',
    exemploAdicional: 'Correto: "Observa-se um cenário social em que (ou no qual) a tecnologia transforma as relações de trabalho."'
  }
];

global.RedacaoDados = {
  LOGO_FILES,
  renderLogoImg,
  BANCA_SPECS,
  REPERTORIO_CATEGORIAS,
  REPERTORIO_LIBRARY,
  EIXOS,
  TEMAS,
  QUIZ_BANCA
};

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
