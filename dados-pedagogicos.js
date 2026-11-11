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
  pmsp: 'Logo_PMESP.jpg',
  enem: 'images.png'
};

function renderLogoImg(targetKey, customClass = 'inst-logo-img'){
  const file = LOGO_FILES[targetKey] || LOGO_FILES.pmpe;
  const altMap = {
    pmpe: 'Brasão Polícia Militar de Pernambuco (PMPE)',
    cbmpe: 'Brasão Corpo de Bombeiros Militar de Pernambuco (CBMPE)',
    pcpe: 'Brasão Polícia Civil de Pernambuco (PCPE)',
    pmsp: 'Brasão Polícia Militar do Estado de São Paulo (PMSP)',
    enem: 'Logotipo Oficial ENEM'
  };
  const alt = altMap[targetKey] || 'Logotipo Institucional';
  return `<img src="${file}" alt="${alt}" class="${customClass}" loading="eager">`;
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
  },
  enem: {
    id: 'enem',
    name: 'ENEM · Exame Nacional do Ensino Médio',
    short: 'ENEM',
    banca: 'INEP / ENEM',
    rubricaVersion: 'INEP-Matriz-ENEM-v2024 (5 Competências · Níveis 0, 40, 80, 120, 160, 200 · Total 1000 pts)',
    genero: 'Texto Dissertativo-Argumentativo em prosa com Proposta de Intervenção obrigatória',
    maxScore: 1000.0,
    minPass: 600.0,
    minPassRule: 'O ENEM não possui nota de corte única (varia por curso/Sisu/Prouni), mas notas acima de 800 pontos representam alto desempenho competitivo.',
    minLines: 8,
    maxLines: 30,
    zeroMinLines: 7,
    requiresIntervention: true,
    badgeClass: 'badge-blue',
    linesRange: '8 a 30 linhas',
    description: 'Matriz de Referência oficial do INEP com 5 Competências avaliadas em níveis estritos de 40 em 40 pontos (0 a 200 por competência), exigindo extensão de 8 a 30 linhas, repertório sociocultural produtivo e proposta de intervenção com 5 elementos.',
    criteriaList: [
      { id: 'comp1', title: 'Competência I: Domínio da modalidade escrita formal', pts: 200.0, desc: 'Avalia a construção sintática (períodos completos, sem truncamentos ou justaposições) e a ausência de desvios gramaticais e de convenções da escrita.' },
      { id: 'comp2', title: 'Competência II: Compreensão do tema e repertório sociocultural', pts: 200.0, desc: 'Avalia a abordagem completa do tema dentro do gênero dissertativo-argumentativo e a presença de repertório legitimado, pertinente e com uso produtivo.' },
      { id: 'comp3', title: 'Competência III: Projeto de texto e defesa de ponto de vista', pts: 200.0, desc: 'Avalia o planejamento estratégico do texto, o desenvolvimento consistente dos argumentos sem lacunas e a defesa da tese do início ao fim.' },
      { id: 'comp4', title: 'Competência IV: Mecanismos linguísticos de coesão', pts: 200.0, desc: 'Avalia a presença de operadores argumentativos interparágrafos (em pelo menos 2 parágrafos) e intraparágrafos, com repertório diversificado e sem repetições.' },
      { id: 'comp5', title: 'Competência V: Proposta de intervenção e direitos humanos', pts: 200.0, desc: 'Exige proposta concreta articulada à discussão com 5 elementos: Agente, Ação, Meio/Modo, Efeito/Finalidade e Detalhamento de pelo menos um elemento.' }
    ],
    regrasAnulacao: [
      'Até 7 linhas escritas (texto insuficiente).',
      'Fuga total ao tema ou não atendimento ao tipo dissertativo-argumentativo.',
      'Desrespeito aos Direitos Humanos zera a Competência V.'
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
];

/* 4. BANCO DE TEMAS AMPLIADO POR BANCA E EIXO TEMÁTICO (SEÇÃO 8) */
const EIXOS = {
  pmpe: { n: 'PMPE · Policiamento & Ordem', c: '#15803d', banca: 'Instituto AOCP' },
  pcpe: { n: 'PCPE · Investigação & Justiça', c: '#ca8a04', banca: 'CESPE / CEBRASPE' },
  cbmpe: { n: 'CBMPE · Defesa Civil & Vida', c: '#b91c1c', banca: 'Instituto AOCP' },
  pmsp: { n: 'PMSP · Segurança Urbana & Ética', c: '#1e3a8a', banca: 'VUNESP' },
  enem: { n: 'ENEM · Sociedade & Cidadania', c: '#6366f1', banca: 'INEP' },
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

  /* --- ENEM / INEP --- */
  {
    e: 'enem',
    banca: 'INEP / ENEM',
    t: 'Desafios para a valorização do trabalho de cuidado realizado pela mulher no Brasil',
    problema: 'Invisibilidade histórica e econômica das atividades domésticas e de cuidado de crianças, idosos e pessoas com deficiência.',
    comando: 'A partir da leitura dos textos motivadores, redija texto dissertativo-argumentativo em modalidade escrita formal sobre o tema, apresentando proposta de intervenção que respeite os direitos humanos.',
    teses: [
      'A invisibilidade do trabalho de cuidado no Brasil decorre tanto da persistência de uma cultura patriarcal quanto da insuficiência de equipamentos públicos de apoio às famílias.',
      'A sobrecarga feminina com o cuidado não remunerado limita a inserção profissional das mulheres e perpetua desigualdades socioeconômicas.'
    ],
    f: 'Desigualdade de gênero, economia do cuidado, sobrecarga feminina e escassez de creches e centros-dia públicos.',
    r: 'Simone de Beauvoir (O Segundo Sexo); CF/88 (Art. 5º, I e Art. 6º); Amartya Sen (Desenvolvimento como Liberdade).',
    p: 'Ministério das Mulheres, em parceria com o MEC e municípios, amplia a rede de creches em tempo integral e centros de apoio a idosos, além de campanhas sobre corresponsabilidade familiar.'
  },
  {
    e: 'enem',
    banca: 'INEP / ENEM',
    t: 'Caminhos para combater a desinformação e fortalecer o letramento midiático na era dos algoritmos',
    problema: 'Disseminação acelerada de notícias falsas, câmaras de eco algorítmicas e prejuízos à saúde pública e ao debate democrático.',
    comando: 'Redija texto dissertativo-argumentativo sobre os impactos da desinformação digital e apresente proposta de intervenção detalhada.',
    teses: [
      'A proliferação da desinformação no Brasil é alimentada pela combinação entre a arquitetura lucrativa dos algoritmos e a carência de educação midiática crítica.',
      'Sem letramento informacional e transparência das plataformas digitais, o debate público democrático é substituído pela manipulação emocional.'
    ],
    f: 'Bolhas algorítmicas, verificação de fatos, educação midiática nas escolas e responsabilidade das plataformas.',
    r: 'Platão (Alegoria da Caverna em A República); Paulo Freire (Pedagogia da Autonomia); Shoshana Zuboff (Capitalismo de Vigilância).',
    p: 'MEC deve inserir oficinas obrigatórias de Educação Midiática e Checagem de Fatos na Educação Básica, mediante formação docente e material didático interdisciplinar.'
  },
  {
    e: 'enem',
    banca: 'INEP / ENEM',
    t: 'A persistência do racismo estrutural e os desafios para a valorização da herança africana no Brasil',
    problema: 'Apagamento histórico-cultural, intolerância religiosa e desigualdade de oportunidades enfrentados pela população negra.',
    problemaCentral: 'Desigualdade socioeconômica e simbólica decorrente do passado escravocrata não reparado.',
    comando: 'Aborde as raízes históricas do racismo no Brasil, a importância da educação antirracista (Lei 10.639/2003) e medidas de promoção da equidade.',
    teses: [
      'O enfrentamento ao racismo no Brasil exige a efetiva implementação da educação antirracista nas escolas e o fortalecimento de políticas públicas de equidade.',
      'O apagamento da memória e da cultura afro-brasileira perpetua estereótipos discriminatórios que violam a dignidade humana.'
    ],
    f: 'Memória histórica, Lei nº 10.639/2003, igualdade de oportunidades e combate à discriminação.',
    r: 'Silvio Almeida (Racismo Estrutural); Lei nº 10.639/2003 (História e Cultura Afro-Brasileira); CF/88 (Art. 3º, IV e Art. 5º, XLII).',
    p: 'Ministério da Educação e secretarias estaduais devem fiscalizar e financiar a aplicação efetiva da Lei nº 10.639/2003 por meio de formação continuada de professores e projetos culturais.'
  },
  {
    e: 'enem',
    banca: 'INEP / ENEM',
    t: 'Desafios para a inclusão social e produtiva das pessoas com deficiência no Brasil contemporâneo',
    problema: 'Barreiras arquitetônicas, comunicacionais e atitudinais (capacitismo) que restringem a cidadania plena das pessoas com deficiência.',
    comando: 'Discuta os obstáculos à acessibilidade e à inclusão escolar e laboral das pessoas com deficiência, propondo intervenção concreta.',
    teses: [
      'A exclusão das pessoas com deficiência no Brasil persiste devido à inefetividade na fiscalização das normas de acessibilidade e à permanência do preconceito capacitista.',
      'Garantir autonomia às pessoas com deficiência requer adaptar o espaço urbano, o ensino e o mercado de trabalho às necessidades humanas diversas.'
    ],
    f: 'Combate ao capacitismo, acessibilidade arquitetônica e pedagógica, cumprimento da Lei Brasileira de Inclusão.',
    r: 'Lei nº 13.146/2015 (Estatuto da Pessoa com Deficiência); Gilberto Dimenstein (O Cidadão de Papel); Amartya Sen.',
    p: 'Ministério dos Direitos Humanos e da Cidadania, em conjunto com o Ministério do Trabalho, deve ampliar a fiscalização de acessibilidade e oferecer incentivos para adaptação das escolas e empresas.'
  },
  {
    e: 'enem',
    banca: 'INEP / ENEM',
    t: 'O impacto do envelhecimento populacional e a garantia da qualidade de vida da pessoa idosa no Brasil',
    problema: 'Transição demográfica acelerada acompanhada de despreparo previdenciário, urbano, familiar e de saúde para acolher os idosos.',
    comando: 'Analise os desafios do envelhecimento da população brasileira, o combate ao etarismo e a garantia dos direitos previstos no Estatuto da Pessoa Idosa.',
    teses: [
      'O rápido envelhecimento demográfico brasileiro exige planejamento estatal imediato em saúde preventiva, acessibilidade urbana e combate ao etarismo.',
      'A negligência familiar e estatal perante a pessoa idosa viola o princípio constitucional da dignidade humana e a proteção prioritária.'
    ],
    f: 'Transição demográfica, combate ao etarismo, inclusão digital do idoso e redes de saúde geriátrica.',
    r: 'Lei nº 10.741/2003 (Estatuto da Pessoa Idosa); CF/88 (Art. 230); Simone de Beauvoir (A Velhice).',
    p: 'Ministério da Saúde e prefeituras devem expandir centros-dia de atenção integral ao idoso e promover programas de inclusão digital e convivência intergeracional.'
  },

  /* --- EIXO TECNOLOGIA, IA & CIBERCRIMES (MULTI-BANCAS) --- */
  {
    e: 'tec',
    banca: 'Multi-Bancas (AOCP / Cebraspe / Vunesp / ENEM)',
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
    banca: 'Multi-Bancas (AOCP / Cebraspe / Vunesp / ENEM)',
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
    banca: 'Multi-Bancas (AOCP / Cebraspe / Vunesp / ENEM)',
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
    banca: 'Multi-Bancas (AOCP / Cebraspe / Vunesp / ENEM)',
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
    banca: 'Multi-Bancas (AOCP / Cebraspe / Vunesp / ENEM)',
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
    banca: 'Multi-Bancas (AOCP / Cebraspe / Vunesp / ENEM)',
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
    banca: 'Multi-Bancas (AOCP / Cebraspe / Vunesp / ENEM)',
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
    banca: 'Multi-Bancas (AOCP / Cebraspe / Vunesp / ENEM)',
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
    banca: 'Multi-Bancas (AOCP / Cebraspe / Vunesp / ENEM)',
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
    e: 'enem',
    banca: 'INEP / ENEM',
    t: 'Desafios para o enfrentamento da automedicação e a promoção do uso racional de medicamentos no Brasil',
    problema: 'Hábito cultural de consumir fármacos sem prescrição médica, impulsionado pela dificuldade de acesso rápido a consultas e pela publicidade.',
    comando: 'Discorra sobre os riscos da automedicação para a saúde individual e coletiva (como a resistência bacteriana) e apresente proposta de intervenção.',
    teses: [
      'A prática generalizada da automedicação no Brasil resulta tanto de gargalos no acesso à atenção primária de saúde quanto da banalização publicitária de fármacos.',
      'O consumo indiscriminado de medicamentos mascara sintomas graves, provoca intoxicações e agrava o problema global da resistência microbiana.'
    ],
    f: 'Saúde coletiva, atenção básica do SUS, educação sanitária e controle farmacêutico.',
    r: 'CF/88 (Art. 196 - Direito à Saúde); OMS (Conceito de Saúde e Uso Racional de Medicamentos); Platão (Senso comum vs. conhecimento técnico).',
    p: 'Ministério da Saúde e Anvisa devem promover campanhas educativas sobre os riscos da automedicação e ampliar o atendimento farmacêutico orientador nas Unidades Básicas de Saúde.'
  },
  {
    e: 'enem',
    banca: 'INEP / ENEM',
    t: 'Caminhos para combater a intolerância religiosa e assegurar a liberdade de crença no Brasil',
    problema: 'Ataques a templos, discriminação contra matrizes religiosas afro-brasileiras e incompreensão sobre o conceito de Estado laico.',
    comando: 'Analise as raízes históricas da intolerância religiosa no Brasil, o significado da laicidade estatal e proponha medidas de respeito à diversidade.',
    teses: [
      'A persistência da intolerância religiosa no Brasil fere o princípio constitucional do Estado laico e decorre do preconceito histórico contra crenças de matriz africana.',
      'A garantia da liberdade religiosa exige tanto a responsabilização penal dos atos discriminatórios quanto a promoção do diálogo inter-religioso na educação.'
    ],
    f: 'Estado laico, liberdade de consciência e crença, respeito às religiões de matriz africana e cultura de paz.',
    r: 'CF/88 (Art. 5º, VI - Inviolabilidade da Liberdade de Crença e Art. 19, I - Estado Laico); Lei nº 14.532/2023; Hannah Arendt (Pluralidade humana).',
    p: 'Ministério dos Direitos Humanos e secretarias de segurança devem fortalecer delegacias de combate a crimes raciais e de intolerância, enquanto o MEC promove projetos pedagógicos sobre diversidade cultural.'
  },
  {
    e: 'tec',
    banca: 'Multi-Bancas (AOCP / Cebraspe / Vunesp / ENEM)',
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
    banca: 'Multi-Bancas (AOCP / Cebraspe / Vunesp / ENEM)',
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
    banca: 'Multi-Bancas (AOCP / Cebraspe / Vunesp / ENEM)',
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
    q: 'Assinale a alternativa que respeita rigorosamente a concordância verbal exigida pelas bancas (AOCP, Cebraspe, Vunesp e INEP):',
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

})(window);
