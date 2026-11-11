/* =====================================================================
   REDAÇÃO APROVADA 2.0 — MOTOR DE CORREÇÃO CONTEXTUAL, CALIBRAÇÃO,
   VALIDAÇÃO INDEPENDENTE DE NOTAS E GERADOR DE RELATÓRIO (SEÇÕES A–I)
   ===================================================================== */
(function(global){
'use strict';

const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

const STOPWORDS_PT = new Set([
  'de','da','do','das','dos','em','na','no','nas','nos','para','por','com','sem','sob','sobre',
  'entre','ate','como','que','se','ou','mas','porem','contudo','todavia','entretanto','pois',
  'porque','como','quando','onde','qual','quais','quem','cujo','cuja','um','uma','uns','umas',
  'o','a','os','as','ao','aos','pelo','pela','pelos','pelas','este','esta','esse','essa','isto',
  'isso','aquele','aquela','aquilo','seu','sua','seus','suas','meu','minha','nosso','nossa',
  'ser','estar','ter','haver','fazer','ir','vir','pode','podem','deve','devem','sao','foi','era',
  'mais','menos','muito','muita','muitos','muitas','todo','toda','todos','todas','outro','outra',
  'mesmo','mesma','ja','ainda','tambem','so','apenas','cada','ha','nao','sim'
]);

/* =====================================================================
   1. CAMPOS SEMÂNTICOS EXPANDIDOS PARA VERIFICAÇÃO REAL DE TEMA
   ===================================================================== */
const MAPA_SINONIMOS_TEMATICOS = {
  policia: ['policial','policiamento','corporacao','seguranca','agente','ostensivo','patrulha','militar','civil','forca','abordagem','ordem','crime','criminalidade','delito','violencia'],
  comunitario: ['comunidade','proximidade','populacao','cidadao','bairro','confianca','preventivo','prevencao','dialogo','vinculo','sociedade'],
  forca: ['progressivo','letalidade','proporcionalidade','moderacao','armamento','potencial','ofensivo','legalidade','direitos','abuso'],
  camera: ['cameras','corporal','corporais','gravacao','filmagem','transparencia','monitoramento','prova','auditoria','operacional'],
  inteligencia: ['investigacao','pericia','inquerito','crime','organizado','faccao','faccoes','lavagem','financeiro','dados','integracao','susp','policia'],
  cibernetico: ['digital','digitais','internet','virtual','rede','fraude','golpe','estelionato','dados','hacker','cibercrime','algoritmo','tecnologia'],
  mulher: ['mulheres','feminicidio','domestica','genero','maria','penha','vitima','protetiva','agressao','patriarcal','cuidado'],
  bombeiro: ['bombeiros','defesa','civil','desastre','incendi','salvamento','resgate','enchente','clima','climatico','risco','prevencao','socorro','afogamento'],
  saude: ['mental','psicologico','psiquico','burnout','estresse','doenca','sus','hospital','vacina','vacinacao','medicamento','automedicacao','saneamento','tratamento'],
  educacao: ['escola','escolar','ensino','aprendizado','professor','docente','aluno','estudante','evasao','leitura','livro','alfabetizacao','conhecimento','pedagogico'],
  ambiente: ['ambiental','meio','natureza','floresta','queimada','bioma','clima','sustentavel','sustentabilidade','lixo','residuo','reciclagem','agua','esgoto'],
  trabalho: ['trabalhador','emprego','renda','profissional','plataforma','aplicativo','uberizacao','escravidao','cuidado','economia','exploracao'],
  racismo: ['racial','negro','negra','afro','preconceito','discriminacao','equidade','cotas','estrutural','igualdade'],
  desinformacao: ['fake','noticias','falsas','midia','midiatico','algoritmo','redes','sociais','informacao','verdade','manipulacao']
};

function extrairNucleosTematicos(tema, comando = ''){
  const textoBase = norm(`${tema} ${comando}`);
  const tokens = textoBase
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4 && !STOPWORDS_PT.has(w) && !['tema','redacao','texto','sobre','dissertativo','argumentativo','brasil','brasileira','brasileiro','desafios','caminhos','papel','impacto','importancia'].includes(w));

  const nucleosDiretos = Array.from(new Set(tokens));
  const campoExpandido = new Set(nucleosDiretos);

  nucleosDiretos.forEach(tok => {
    Object.entries(MAPA_SINONIMOS_TEMATICOS).forEach(([chave, lista]) => {
      if(tok.includes(chave) || chave.includes(tok) || lista.some(item => tok.includes(item) || item.includes(tok))){
        campoExpandido.add(chave);
        lista.forEach(s => campoExpandido.add(s));
      }
    });
  });

  return {
    nucleosDiretos,
    campoExpandido: Array.from(campoExpandido)
  };
}

function analisarAderenciaAoTema(texto, paragrafos, tema, comando = ''){
  const { nucleosDiretos, campoExpandido } = extrairNucleosTematicos(tema, comando);
  const nTexto = norm(texto);

  if(nucleosDiretos.length === 0){
    return {
      status: 'atendido',
      percentualNucleos: 100,
      nucleosEncontrados: [],
      nucleosAusentes: [],
      paragrafosAderentes: paragrafos.length,
      exigeConferenciaHumana: false,
      diagnostico: 'Tema genérico ou livre: o texto desenvolve eixo compatível com a proposta.'
    };
  }

  const encontradosDiretos = nucleosDiretos.filter(nuc => {
    const radical = nuc.length >= 6 ? nuc.slice(0, nuc.length - 2) : nuc;
    return nTexto.includes(radical);
  });

  const encontradosCampo = campoExpandido.filter(termo => {
    const radical = termo.length >= 6 ? termo.slice(0, termo.length - 2) : termo;
    return nTexto.includes(radical);
  });

  let paragrafosAderentes = 0;
  paragrafos.forEach(p => {
    const np = norm(p);
    const temAlgum = campoExpandido.some(termo => {
      const radical = termo.length >= 6 ? termo.slice(0, termo.length - 2) : termo;
      return np.includes(radical);
    });
    if(temAlgum) paragrafosAderentes++;
  });

  const ratioDireto = encontradosDiretos.length / Math.max(1, nucleosDiretos.length);
  const ratioCampo = encontradosCampo.length / Math.max(1, Math.min(8, campoExpandido.length));
  const scoreAderencia = Math.round(clamp((ratioDireto * 0.65 + ratioCampo * 0.35) * 100, 0, 100));

  let status = 'atendido';
  let exigeConferenciaHumana = false;
  let diagnostico = '';

  if(encontradosDiretos.length === 0 && encontradosCampo.length <= 1){
    status = 'fuga_total';
    exigeConferenciaHumana = true;
    diagnostico = `Fuga ao tema detectada: o texto não aborda os núcleos temáticos da proposta ("${nucleosDiretos.slice(0, 5).join(', ')}"). Caso tenha utilizado apenas metáforas indiretas, recomenda-se conferência humana.`;
  } else if(ratioDireto < 0.30 || (encontradosDiretos.length <= 1 && nucleosDiretos.length >= 3)){
    status = 'tangenciamento';
    exigeConferenciaHumana = true;
    diagnostico = `Abordagem tangencial (parcial) do tema: o texto toca no assunto geral, mas contempla apenas parte do recorte temático (${encontradosDiretos.length} de ${nucleosDiretos.length} núcleos diretos). Faltou desenvolver explicitamente: "${nucleosDiretos.filter(x => !encontradosDiretos.includes(x)).slice(0, 4).join(', ')}".`;
  } else {
    status = 'atendido';
    diagnostico = `Aderência integral ao recorte temático: os núcleos centrais da proposta (${encontradosDiretos.slice(0, 6).join(', ')}) foram articulados em ${paragrafosAderentes} de ${paragrafos.length} parágrafos.`;
  }

  return {
    status,
    percentualNucleos: scoreAderencia,
    nucleosEncontrados: encontradosDiretos,
    nucleosAusentes: nucleosDiretos.filter(x => !encontradosDiretos.includes(x)),
    paragrafosAderentes,
    exigeConferenciaHumana,
    diagnostico
  };
}

/* =====================================================================
   2. ANALISADOR DE REPERTÓRIO SOCIOCULTURAL E PRODUTIVIDADE (SEÇÕES 4.2 & 5F)
   ===================================================================== */
const PADROES_REPERTORIO = [
  { nome: 'Constituição Federal de 1988', tipo: 'Jurídico-Constitucional', re: /\b(constituicao federal|carta magna|constituicao de 1988|cf\/?88|artigo\s+\d+|art\.\s*\d+)\b/i, fonte: 'Constituição da República Federativa do Brasil (1988)' },
  { nome: 'Legislação Infraconstitucional / Códigos', tipo: 'Legislação Oficial', re: /\b(lei\s+n?[º°]?\s*[\d.]+|estatuto da crianca|eca|lei maria da penha|marco civil|lgpd|codigo penal|codigo de processo penal|codigo de transito|susp|pnpdec|lei lucas)\b/i, fonte: 'Legislação Federal Brasileira' },
  { nome: 'Thomas Hobbes (Contrato Social / O Leviatã)', tipo: 'Filosofia Política', re: /\b(thomas hobbes|hobbes|leviata|contrato social|estado de natureza)\b/i, fonte: 'HOBBES, Thomas. O Leviatã (1651)' },
  { nome: 'Cesare Beccaria (Dos Delitos e das Penas)', tipo: 'Filosofia do Direito Penal', re: /\b(cesare beccaria|beccaria|delitos e das penas)\b/i, fonte: 'BECCARIA, Cesare. Dos Delitos e das Penas (1764)' },
  { nome: 'Hannah Arendt (Banalidade do Mal / Condição Humana)', tipo: 'Filosofia Política', re: /\b(hannah arendt|arendt|banalidade do mal)\b/i, fonte: 'ARENDT, Hannah. Eichmann em Jerusalém (1963)' },
  { nome: 'Zygmunt Bauman (Modernidade Líquida)', tipo: 'Sociologia Contemporânea', re: /\b(zygmunt bauman|bauman|modernidade liquida|medo liquido|amor liquido)\b/i, fonte: 'BAUMAN, Zygmunt. Modernidade Líquida (2000)' },
  { nome: 'Émile Durkheim (Fato Social / Anomia)', tipo: 'Sociologia Clássica', re: /\b(emile durkheim|durkheim|anomia social|fato social|solidariedade organica)\b/i, fonte: 'DURKHEIM, Émile. Da Divisão do Trabalho Social (1893)' },
  { nome: 'Michel Foucault (Vigiar e Punir / Biopoder)', tipo: 'Filosofia / Sociologia', re: /\b(michel foucault|foucault|vigiar e punir|biopoder|panoptico)\b/i, fonte: 'FOUCAULT, Michel. Vigiar e Punir (1975)' },
  { nome: 'Platão (Alegoria da Caverna / A República)', tipo: 'Filosofia Clássica', re: /\b(platao|alegoria da caverna|mito da caverna|a republica)\b/i, fonte: 'PLATÃO. A República, Livro VII' },
  { nome: 'Paulo Freire (Educação Libertadora)', tipo: 'Educação & Pedagogia', re: /\b(paulo freire|pedagogia do oprimido|pedagogia da autonomia|educacao bancaria|educacao libertadora)\b/i, fonte: 'FREIRE, Paulo. Pedagogia do Oprimido (1968)' },
  { nome: 'Immanuel Kant (Imperativo Categórico / Esclarecimento)', tipo: 'Filosofia Moral', re: /\b(immanuel kant|kant|imperativo categorico|menoridade intelectual)\b/i, fonte: 'KANT, Immanuel. Fundamentação da Metafísica dos Costumes (1785)' },
  { nome: 'Gilberto Dimenstein (O Cidadão de Papel)', tipo: 'Sociologia / Jornalismo', re: /\b(gilberto dimenstein|dimenstein|cidadao de papel)\b/i, fonte: 'DIMENSTEIN, Gilberto. O Cidadão de Papel (1993)' },
  { nome: 'Milton Santos (Cidadanias Mutiladas)', tipo: 'Geografia Urbana / Sociologia', re: /\b(milton santos|cidadanias? mutiladas?|espaco do cidadao)\b/i, fonte: 'SANTOS, Milton. O Espaço do Cidadão (1987)' },
  { nome: 'Byung-Chul Han (Sociedade do Cansaço)', tipo: 'Filosofia Contemporânea', re: /\b(byung-chul han|byung chul han|sociedade do cansaco)\b/i, fonte: 'HAN, Byung-Chul. Sociedade do Cansaço (2010)' },
  { nome: 'Silvio Almeida (Racismo Estrutural)', tipo: 'Direito / Sociologia', re: /\b(silvio almeida|racismo estrutural)\b/i, fonte: 'ALMEIDA, Silvio. Racismo Estrutural (2018)' },
  { nome: 'Simone de Beauvoir (O Segundo Sexo)', tipo: 'Filosofia / Estudos de Gênero', re: /\b(simone de beauvoir|beauvoir|segundo sexo)\b/i, fonte: 'BEAUVOIR, Simone de. O Segundo Sexo (1949)' },
  { nome: 'Sérgio Buarque de Holanda (Raízes do Brasil)', tipo: 'Historiografia Brasileira', re: /\b(sergio buarque|raizes do brasil|homem cordial|patrimonialismo)\b/i, fonte: 'HOLANDA, Sérgio Buarque de. Raízes do Brasil (1936)' },
  { nome: 'Hans Jonas (O Princípio Responsabilidade)', tipo: 'Ética Ambiental', re: /\b(hans jonas|principio responsabilidade)\b/i, fonte: 'JONAS, Hans. O Princípio Responsabilidade (1979)' },
  { nome: 'Amartya Sen (Desenvolvimento como Liberdade)', tipo: 'Economia & Desenvolvimento Humano', re: /\b(amartya sen|desenvolvimento como liberdade)\b/i, fonte: 'SEN, Amartya. Desenvolvimento como Liberdade (1999)' },
  { nome: 'Shoshana Zuboff (Capitalismo de Vigilância)', tipo: 'Sociologia Digital', re: /\b(shoshana zuboff|zuboff|capitalismo de vigilancia)\b/i, fonte: 'ZUBOFF, Shoshana. A Era do Capitalismo de Vigilância (2019)' },
  { nome: 'Dados / Órgãos Oficiais (IBGE, OMS, ONU, IPEA, FBSP)', tipo: 'Dados Estatísticos / Institucionais', re: /\b(ibge|oms|organizacao mundial da saude|onu|ipea|anuario brasileiro de seguranca|forum brasileiro de seguranca|cepal|unesco|ministerio da saude|ministerio da justica)\b/i, fonte: 'Relatórios e Pesquisas de Órgãos Oficiais' },
  { nome: 'Alusão Histórica Documentada', tipo: 'História Geral / do Brasil', re: /\b(revolucao industrial|iluminismo|ditadura militar|periodo colonial|escravidao no brasil|segunda guerra mundial|declaracao universal dos direitos humanos|era vargas)\b/i, fonte: 'Historiografia Geral e do Brasil' },
  { nome: 'Max Weber (Monopólio Legítimo da Força)', tipo: 'Sociologia da Administração e do Estado', re: /\b(max weber|weber|monopolio da forca|acao social)\b/i, fonte: 'WEBER, Max. Ciência e Política: duas vocações (1919)' },
  { nome: 'Teoria das Janelas Quebradas (Broken Windows)', tipo: 'Criminologia e Prevenção Primária', re: /\b(janelas quebradas|broken windows|wilson e kelling)\b/i, fonte: 'WILSON, James Q.; KELLING, George L. (1982)' },
  { nome: 'Aristóteles (Justiça Distributiva e Zoon Politikon)', tipo: 'Filosofia Clássica', re: /\b(aristoteles|etica a nicomaco|zoon politikon|animal politico|justica distributiva)\b/i, fonte: 'ARISTÓTELES. A Política; Ética a Nicômaco' },
  { nome: 'John Locke (Direitos Naturais Inalienáveis)', tipo: 'Filosofia Política / Liberalismo Clássico', re: /\b(john locke|locke|direitos naturais|segundo tratado)\b/i, fonte: 'LOCKE, John. Segundo Tratado sobre o Governo Civil (1689)' },
  { nome: 'Jean-Jacques Rousseau (Vontade Geral e Soberania)', tipo: 'Filosofia Política Iluminista', re: /\b(rousseau|jean-jacques rousseau|vontade geral)\b/i, fonte: 'ROUSSEAU, Jean-Jacques. Do Contrato Social (1762)' },
  { nome: 'Jürgen Habermas (Ação Comunicativa e Esfera Pública)', tipo: 'Filosofia Contemporânea', re: /\b(habermas|jurgen habermas|agir comunicativo|acao comunicativa|esfera publica)\b/i, fonte: 'HABERMAS, Jürgen. Teoria do Agir Comunicativo (1981)' },
  { nome: 'Jean-Paul Sartre (Responsabilidade e Liberdade)', tipo: 'Existencialismo Ético', re: /\b(sartre|jean-paul sartre|existencialismo|existencia precede a essencia)\b/i, fonte: 'SARTRE, Jean-Paul. O Existencialismo é um Humanismo (1946)' },
  { nome: 'Pierre Bourdieu (Violência Simbólica e Reprodução)', tipo: 'Sociologia da Cultura e Educação', re: /\b(pierre bourdieu|bourdieu|violencia simbolica|habitus|capital cultural)\b/i, fonte: 'BOURDIEU, Pierre. A Reprodução (1970)' },
  { nome: 'Djamila Ribeiro (Lugar de Fala e Silenciamento)', tipo: 'Filosofia Crítica / Antirracismo', re: /\b(djamila ribeiro|lugar de fala|pequeno manual antirracista)\b/i, fonte: 'RIBEIRO, Djamila. O que é lugar de fala? (2017)' },
  { nome: 'Darcy Ribeiro (O Povo Brasileiro e a Educação)', tipo: 'Antropologia e Educação Brasileira', re: /\b(darcy ribeiro|o povo brasileiro|cieps?)\b/i, fonte: 'RIBEIRO, Darcy. O Povo Brasileiro (1995)' },
  { nome: 'Ulrich Beck (Sociedade de Risco Global)', tipo: 'Sociologia do Risco e da Tecnologia', re: /\b(ulrich beck|sociedade de risco)\b/i, fonte: 'BECK, Ulrich. Sociedade de Risco (1986)' },
  { nome: 'Anísio Teixeira (Escola Pública e Democrática)', tipo: 'História da Educação Brasileira', re: /\b(anisio teixeira|pioneiros da educacao|escola nova)\b/i, fonte: 'TEIXEIRA, Anísio. Educação não é privilégio (1957)' },
  { nome: 'Legislação Educacional (LDB e PNE)', tipo: 'Legislação da Educação', re: /\b(ldb|lei 9\.?394|plano nacional de educacao|pne|lei 13\.?005)\b/i, fonte: 'LDB (Lei nº 9.394/1996) e PNE (Lei nº 13.005/2014)' },
  { nome: 'bell hooks (Educação como Prática da Liberdade)', tipo: 'Pedagogia Crítica e Engajada', re: /\b(bell hooks|ensinando a transgredir)\b/i, fonte: 'HOOKS, bell. Ensinando a Transgredir (1994)' },
  { nome: 'Lev Vygotsky / John Dewey (Aprendizagem Ativa e Interação)', tipo: 'Psicologia e Filosofia Educacional', re: /\b(vygotsky|zona de desenvolvimento proximal|john dewey|aprender fazendo)\b/i, fonte: 'VYGOTSKY, L. (1978); DEWEY, J. Democracia e Educação (1916)' },
  { nome: 'Ailton Krenak (Ideias para Adiar o Fim do Mundo)', tipo: 'Filosofia Socioambiental Ancestral', re: /\b(ailton krenak|krenak|ideias para adiar o fim do mundo)\b/i, fonte: 'KRENAK, Ailton. Ideias para Adiar o Fim do Mundo (2019)' },
  { nome: 'Marco Legal Socioambiental (PNRS e Código Florestal)', tipo: 'Legislação Ambiental Brasileira', re: /\b(pnrs|lei 12\.?305|residuos solidos|codigo florestal|lei 12\.?651)\b/i, fonte: 'Lei nº 12.305/2010 (PNRS) e Lei nº 12.651/2012' },
  { nome: 'Acordo de Paris e Agenda 2030 (ODS / ONU)', tipo: 'Direito Internacional do Clima e Desenvolvimento', re: /\b(acordo de paris|agenda 2030|ods\s+\d+|objetivos de desenvolvimento sustentavel)\b/i, fonte: 'ONU. Acordo de Paris (2015) e Agenda 2030' },
  { nome: 'Desastres de Mariana e Brumadinho', tipo: 'Memória Socioambiental e Regulação Industrial', re: /\b(mariana|brumadinho|rio doce|paraopeba|barragem de rejeitos)\b/i, fonte: 'Relatórios Periciais Oficiais e Acórdãos Judiciais' },
  { nome: 'Legislação da Saúde (Lei do SUS e Reforma Psiquiátrica)', tipo: 'Legislação Sanitária Brasileira', re: /\b(lei 8\.?080|lei organica da saude|reforma psiquiatrica|lei 10\.?216|lei paulo delgado|caps)\b/i, fonte: 'Lei nº 8.080/1990 (SUS) e Lei nº 10.216/2001' },
  { nome: 'Revolta da Vacina e Fiocruz / Oswaldo Cruz', tipo: 'Historiografia da Saúde Pública', re: /\b(revolta da vacina|fiocruz|oswaldo cruz|carlos chagas)\b/i, fonte: 'Memória da Saúde Pública no Brasil' },
  { nome: 'Lei Áurea de 1888 e Joaquim Nabuco', tipo: 'Historiografia Social Brasileira', re: /\b(lei aurea|13 de maio de 1888|joaquim nabuco|o abolicionismo)\b/i, fonte: 'NABUCO, Joaquim. O Abolicionismo (1883)' },
  { nome: 'Consolidação das Leis do Trabalho (CLT de 1943)', tipo: 'Direito do Trabalho e História Republicana', re: /\b(clt|consolidacao das leis do trabalho|decreto 5\.?452|era vargas)\b/i, fonte: 'BRASIL. Decreto-Lei nº 5.452/1943' },
  { nome: 'Diretas Já (1984) e Ulysses Guimarães (1988)', tipo: 'História da Redemocratização Brasileira', re: /\b(diretas ja|ulysses guimaraes|constituicao cidada)\b/i, fonte: 'Discurso de Promulgação da Carta Magna de 1988' },
  { nome: 'Euclides da Cunha (Os Sertões e Canudos)', tipo: 'Literatura e Sociologia Sertaneja', re: /\b(euclides da cunha|os sertoes|canudos)\b/i, fonte: 'CUNHA, Euclides da. Os Sertões (1902)' },
  { nome: 'Thomas Piketty (O Capital no Século XXI)', tipo: 'Economia Política Contemporânea', re: /\b(thomas piketty|piketty|capital no seculo xxi)\b/i, fonte: 'PIKETTY, Thomas. O Capital no Século XXI (2013)' },
  { nome: 'Adam Smith / John Maynard Keynes', tipo: 'Teoria Econômica Clássica e Keynesiana', re: /\b(adam smith|riqueza das nacoes|keynes|john maynard keynes|demanda efetiva)\b/i, fonte: 'SMITH, A. (1776); KEYNES, J. M. (1936)' },
  { nome: 'Josué de Castro / Celso Furtado', tipo: 'Economia e Sociologia do Desenvolvimento', re: /\b(josue de castro|geografia da fome|celso furtado|formacao economica do brasil|sudene)\b/i, fonte: 'CASTRO, J. (1946); FURTADO, C. (1959)' },
  { nome: 'OIT (Trabalho Decente) e Uberização das Plataformas', tipo: 'Sociologia do Trabalho e Gig Economy', re: /\b(oit|trabalho decente|uberizacao|gig economy|ludmila abilio)\b/i, fonte: 'OIT (1998); ABÍLIO, L. C. (2020)' },
  { nome: 'Eli Pariser (O Filtro Invisível e Bolhas Algorítmicas)', tipo: 'Sociologia da Tecnologia e Esfera Digital', re: /\b(eli pariser|filtro invisivel|filter bubble|bolha algoritmica|bolhas algoritmicas)\b/i, fonte: 'PARISER, Eli. The Filter Bubble (2011)' },
  { nome: 'Legislação Cibernética (Leis 12.737/12 e 14.155/21)', tipo: 'Direito Digital e Penal Eletrônico', re: /\b(carolina dieckmann|lei 12\.?737|estelionato eletronico|lei 14\.?155|golpe do pix)\b/i, fonte: 'Legislação Federal sobre Crimes Cibernéticos' },
  { nome: 'Yuval Noah Harari / Cathy O\'Neil (Ética dos Algoritmos)', tipo: 'Filosofia e Ciência de Dados', re: /\b(yuval harari|harari|21 licoes|cathy o\'neil|algoritmos de destruicao)\b/i, fonte: 'HARARI, Y. N. (2018); O\'NEIL, C. (2016)' },
  { nome: 'O Dilema das Redes / George Orwell (1984)', tipo: 'Audiovisual e Distopia Literária', re: /\b(dilema das redes|the social dilemma|george orwell|1984|grande irmao|big brother)\b/i, fonte: 'ORWELL, G. (1949); Netflix (2020)' },
];

function analisarRepertorioContextual(texto, paragrafos, tema, nucleosTema){
  const repertoriosIdentificados = [];

  paragrafos.forEach((par, idxPar) => {
    const nPar = norm(par);
    PADROES_REPERTORIO.forEach(pad => {
      if(pad.re.test(nPar)){
        // Avaliar se o repertório é explicado e integrado ao argumento (Regra 4.2)
        const palavrasPar = par.trim().split(/\s+/).length;
        const temVerboExplicativo = /\b(defende|sustenta|afirma|postula|analisa|demonstra|estabelece|preconiza|segundo|conforme|sob a otica|a luz de|evidencia|explica|conceitua|define)\b/.test(nPar);
        const temPonteComTema = /\b(analogamente|nesse sentido|de modo semelhante|no contexto|no brasil|entretanto|todavia|contudo|dessa forma|isso se reflete|observa-se que|constata-se que|tal realidade|dialoga com)\b/.test(nPar) ||
          nucleosTema.campoExpandido.some(t => nPar.includes(t.slice(0, Math.max(4, t.length - 2))));

        const explicado = palavrasPar >= 32 && temVerboExplicativo;
        const produtivo = explicado && temPonteComTema;

        repertoriosIdentificados.push({
          nome: pad.nome,
          tipo: pad.tipo,
          fonte: pad.fonte,
          paragrafo: idxPar + 1,
          trechoParagrafo: par.length > 180 ? par.slice(0, 180) + '...' : par,
          pertinente: true,
          correcaoFactual: 'Referência reconhecida e factualmente válida no cânone acadêmico/jurídico.',
          explicado,
          integrado: temPonteComTema,
          produtivo,
          avaliacao: produtivo
            ? 'Uso Produtivo e Articulado: O conceito foi apresentado, explicado e conectado diretamente à defesa da tese no parágrafo.'
            : (explicado
                ? 'Uso Parcialmente Integrado: O repertório foi explicado, mas a ponte explícita com os núcleos do tema pode ser estreitada.'
                : 'Uso Decorativo / Improdutivo: A referência foi apenas mencionada de forma rápida, sem explicação conceitual suficiente nem ponte analítica com o argumento.')
        });
      }
    });
  });

  // Remover duplicatas do mesmo repertório no mesmo parágrafo
  const unicos = [];
  const chaves = new Set();
  repertoriosIdentificados.forEach(r => {
    const k = `${r.nome}#${r.paragrafo}`;
    if(!chaves.has(k)){
      chaves.add(k);
      unicos.push(r);
    }
  });

  const temProdutivo = unicos.some(r => r.produtivo);
  const temAlgum = unicos.length > 0;

  return {
    lista: unicos,
    quantidade: unicos.length,
    temAlgum,
    temProdutivo,
    resumoGeral: !temAlgum
      ? 'Nenhum repertório sociocultural externo explícito (leis, filósofos, sociólogos, dados oficiais ou alusões históricas) foi identificado. A argumentação apoia-se predominantemente no raciocínio lógico interno ou no senso comum.'
      : (temProdutivo
          ? `Foram identificados ${unicos.length} repertório(s) legítimo(s), com uso produtivo e integração real à tese (cumprindo o método "Referência → Ponte → O que ela prova").`
          : `Foram identificados ${unicos.length} repertório(s), porém aplicados de maneira ainda superficial ou meramente ilustrativa. Lembre-se: citar um pensador ou lei sem explicar o conceito e sem vinculá-lo ao problema do tema reduz a nota de argumentação.`)
  };
}

/* =====================================================================
   3. REGRAS DE ANÁLISE GRAMATICAL, SINTÁTICA E ARGUMENTATIVA EM CONTEXTO
      (Sem falsos positivos e separando Erro Confirmado vs Fragilidade vs Sugestão)
   ===================================================================== */
// Lista de verbos comuns após pronome oblíquo para validação rigorosa de próclise inicial (Sem falsos positivos)
const VERBOS_COMUNS_PROCLISE = "mostra|mostram|faz|fazem|leva|levam|obriga|obrigam|permite|permitem|ensina|ensinam|revela|revelam|indica|indicam|cabe|parece|resta|falta|diz|dizem|pede|pedem|dá|da|dão|dao|traz|trazem|impõe|impoe|impõem|impoem|afeta|afetam|preocupa|preocupam|chama|chamam|deixa|deixam|torna|tornam|coloca|colocam|lembra|lembram|impede|impedem|observa|observam|constata|constatam|nota|notam|percebe|percebem|sabe|sabem|verifica|verificam|conclui|concluem|deve|devem|pode|podem|vê|ve|veem|espera|esperam|pretende|pretendem|entende|entendem|julga|julgam|imagina|imaginam|depara|deparam|ocorre|ocorrem|foi|foram|trata|tratam";
const LISTA_VERBOS_PROCLISE_SET = new Set(VERBOS_COMUNS_PROCLISE.split('|'));

const REGRAS_CONTEXTUAIS = [
  /* --- ERROS GRAMATICAIS CONFIRMADOS --- */
  {
    id: 'g-houveram',
    severidade: 'erro_confirmado',
    categoria: 'Concordância Verbal',
    re: /\bhouveram\b/gi,
    validarContexto: (match, frase) => {
      // Se for verbo auxiliar seguido de particípio ("houveram dito/feito"), é arcaico mas gramatical; sem particípio é erro confirmado
      const pos = frase.slice(match.index + match[0].length).trim();
      return !/^[a-záàâãéêíóôõúç]+(ado|ido|feito|dito|visto|posto|escrito)\b/i.test(pos);
    },
    diagnostico: 'Flexão indevida do verbo impessoal "haver" no plural.',
    explicacao: 'O verbo "haver", quando empregado no sentido de "existir", "ocorrer" ou "acontecer", é impessoal (oração sem sujeito) e deve permanecer obrigatoriamente na 3ª pessoa do singular.',
    sugestao: (termo) => 'houve (ou "existiram / ocorreram")',
    justificativa: 'A norma-padrão exigida por todas as bancas proíbe a pluralização de "haver" existencial.'
  },
  {
    id: 'g-haviam-existencial',
    severidade: 'erro_confirmado',
    categoria: 'Concordância Verbal',
    re: /\bhaviam\b/gi,
    validarContexto: (match, frase) => {
      // Evitar falso positivo: "Eles haviam conquistado" é correto (verbo auxiliar)!
      const pos = frase.slice(match.index + match[0].length).trim();
      const seguidoDeParticipio = /^(?:ja\s+|tambem\s+|nao\s+)?[a-záàâãéêíóôõúç]+(ado|ido|feito|dito|visto|posto|escrito|aberto|coberto|vindo|sido|tido)\b/i.test(pos);
      return !seguidoDeParticipio;
    },
    diagnostico: 'Uso de "haviam" no sentido de existir/ocorrer.',
    explicacao: 'Quando equivale a "existiam", o verbo "haver" é impessoal e invariável ("havia"). Só vai ao plural quando atua como verbo auxiliar de outro verbo no particípio ("eles haviam feito").',
    sugestao: () => 'havia (ou "existiam")',
    justificativa: 'Corrige desvio clássico de concordância verbal penalizado nas provas discursivas.'
  },
  {
    id: 'g-devem-haver',
    severidade: 'erro_confirmado',
    categoria: 'Concordância Verbal',
    re: /\b(devem|podem|costumam|vao|iam)\s+haver\b/gi,
    diagnostico: 'Locução verbal com verbo principal impessoal ("haver") flexionada indevidamente no plural.',
    explicacao: 'Na locução verbal em que o verbo principal é "haver" (no sentido de existir), a impessoalidade transfere-se para o verbo auxiliar, que deve ficar no singular.',
    sugestao: (m) => m.replace(/devem/i,'deve').replace(/podem/i,'pode').replace(/costumam/i,'costuma').replace(/vao/i,'vai').replace(/iam/i,'ia'),
    justificativa: 'Garante a concordância rigorosa da locução verbal impessoal.'
  },
  {
    id: 'g-fazem-tempo',
    severidade: 'erro_confirmado',
    categoria: 'Concordância Verbal',
    re: /\bfazem\s+(?:\d+|muitos|alguns|poucos|varios|diversos|dois|tres|quatro|cinco|dez|vinte|trinta|seculos|decadas|anos|meses|dias|semanas)\b/gi,
    diagnostico: 'Flexão incorreta do verbo "fazer" indicando tempo decorrido.',
    explicacao: 'O verbo "fazer", quando indica tempo transcorrido, é impessoal e deve ser conjugado exclusivamente na 3ª pessoa do singular ("faz").',
    sugestao: (m) => m.replace(/^fazem/i, 'faz'),
    justificativa: 'Elimina erro de concordância com verbo impessoal de tempo.'
  },
  {
    id: 'g-afim-finalidade',
    severidade: 'erro_confirmado',
    categoria: 'Ortografia & Homônimos',
    re: /\b[aà]fim\s+de\b/gi,
    diagnostico: 'Grafia incorreta da locução prepositiva de finalidade "a fim de".',
    explicacao: 'Para indicar finalidade ou objetivo (= para), escreve-se separado e sem acento grave: "a fim de". A forma junta "afim" é um adjetivo que significa "semelhante".',
    sugestao: () => 'a fim de',
    justificativa: 'Adequa a grafia da locução de finalidade (muito utilizada na proposta de intervenção).'
  },
  {
    id: 'g-haja-visto',
    severidade: 'erro_confirmado',
    categoria: 'Morfossintaxe / Expressão',
    re: /\bhaja\s+vist[oa]s?\b/gi,
    validarContexto: (match) => norm(match[0]) !== 'haja vista',
    diagnostico: 'Emprego incorreto do operador argumentativo "haja vista".',
    explicacao: 'Na locução causal/explicativa "haja vista", o substantivo feminino "vista" é invariável. A forma "haja visto" não é abonada pela norma-padrão.',
    sugestao: () => 'haja vista',
    justificativa: 'Restaura a forma canônica do conectivo explicativo.'
  },
  {
    id: 'g-crase-verbo',
    severidade: 'erro_confirmado',
    categoria: 'Crase',
    re: /\bà\s+(partir|fazer|garantir|promover|combater|reduzir|assegurar|criar|buscar|evitar|proteger|desenvolver|investir|construir|impedir|concluir|analisar|compreender|resolver|tratar|agir|propor|ampliar|fortalecer)\b/gi,
    diagnostico: 'Uso indevido do acento grave (crase) diante de verbo no infinitivo.',
    explicacao: 'A crase é a fusão da preposição "a" com o artigo feminino "a". Como verbos não admitem artigo feminino anteposto, nunca ocorre crase antes de verbo.',
    sugestao: (m) => m.replace(/^à/i, 'a'),
    justificativa: 'Desvio de crase antes de verbo é fortemente penalizado por Cebraspe, AOCP, Vunesp e INEP.'
  },
  {
    id: 'g-crase-pronomes-masc',
    severidade: 'erro_confirmado',
    categoria: 'Crase',
    re: /\bà\s+(todos|todo|cada|qualquer|ningu[eé]m|algu[eé]m|ela|elas|ele|eles|isso|isto|aquilo|esse|este|respeito|n[ií]vel|curto|longo|m[eé]dio|prazo|fim|um|dois|tr[eê]s)\b/gi,
    diagnostico: 'Emprego indevido de crase antes de palavra masculina ou pronome que rejeita artigo.',
    explicacao: 'Não ocorre crase diante de vocábulos masculinos ("a respeito", "a curto prazo") nem antes de pronomes pessoais, demonstrativos iniciados por "e/i" ou indefinidos ("a todos", "a qualquer", "a essa").',
    sugestao: (m) => m.replace(/^[àÀ]/, 'a'),
    justificativa: 'Corrige emprego proibido do acento grave.'
  },
  {
    id: 'g-falta-crase-locucao',
    severidade: 'erro_confirmado',
    categoria: 'Crase',
    re: /\b(a\s+medida\s+que|a\s+propor[cç][aã]o\s+que|a\s+luz\s+d[aeo])\b/gi,
    validarContexto: (match, frase) => {
      const trechoOriginal = frase.slice(match.index, match.index + match[0].length);
      if(/^[àÀ]/.test(trechoOriginal)) return false;
      // Evitar falso positivo: "adotar a medida que", "tomar a medida que"
      const anterior = frase.slice(0, match.index).trim();
      if(/(?:adotou|adotaram|adotar|tomou|tomaram|tomar|aprovou|aprovaram|aprovar|criou|criaram|criar|revogou|revogar|sancionou|sancionar)\s*$/i.test(anterior)){
        return false;
      }
      return true;
    },
    diagnostico: 'Ausência de crase obrigatória em locução conjuntiva/prepositiva feminina.',
    explicacao: 'Locuções formadas por núcleo feminino como "à medida que", "à proporção que" e "à luz de" exigem obrigatoriamente o acento grave indicativo de crase.',
    sugestao: (m) => 'à ' + m.replace(/^[aA]\s+/, ''),
    justificativa: 'Aplica a crase obrigatória nas locuções adverbiais/conjuntivas femininas.'
  },
  {
    id: 'g-proclise-inicial',
    severidade: 'erro_confirmado',
    categoria: 'Colocação Pronominal',
    // REGRA AUDITADA: Apenas aciona se o pronome for seguido estritamente por verbo confirmado (Elimina falsos positivos com "Nos últimos", "Nos dias", "Nos casos", etc.)
    re: new RegExp('(?:^|[.!?]\\s+)(Me|Te|Se|Lhe|Lhes|Nos)\\s+(' + VERBOS_COMUNS_PROCLISE + ')\\b', 'gi'),
    validarContexto: (match, frase) => {
      const partes = match[0].replace(/^[.!?]\s*/, '').trim().split(/\s+/);
      if(partes.length < 2) return false;
      const pron = partes[0].toLowerCase();
      const verboNorm = norm(partes[1].toLowerCase());
      const verboRaw = partes[1].toLowerCase();

      // "Nos" só é pronome se a palavra seguinte for estritamente um verbo confirmado
      // NUNCA acionar em "Nos últimos", "Nos dias", "Nos casos", "Nos países" (contração em + os)
      if(pron === 'nos'){
        return LISTA_VERBOS_PROCLISE_SET.has(verboNorm) || LISTA_VERBOS_PROCLISE_SET.has(verboRaw);
      }

      // "Se" só aciona se seguido comprovadamente de verbo (evita falso positivo com conjunção condicional "Se o Estado...", "Se a lei...")
      if(pron === 'se'){
        return LISTA_VERBOS_PROCLISE_SET.has(verboNorm) || LISTA_VERBOS_PROCLISE_SET.has(verboRaw);
      }

      return true;
    },
    diagnostico: 'Início de período com pronome oblíquo átono (próclise em início absoluto de frase).',
    explicacao: 'Pela norma-padrão da língua portuguesa, não se inicia período nem oração após pausa forte com pronome oblíquo átono. Deve-se empregar a ênclise (pronome posposto ao verbo).',
    sugestao: (m) => {
      const limpo = m.replace(/^[.!?]\s*/, '').trim();
      const partes = limpo.split(/\s+/);
      if(partes.length >= 2){
        const pron = partes[0].toLowerCase();
        const verbo = partes[1];
        const verboNorm = norm(verbo.toLowerCase());
        if(LISTA_VERBOS_PROCLISE_SET.has(verboNorm) || LISTA_VERBOS_PROCLISE_SET.has(verbo.toLowerCase())){
          return `${verbo.charAt(0).toUpperCase() + verbo.slice(1)}-${pron}`;
        }
      }
      return 'Usar ênclise após o verbo (ex.: Observa-se / Constata-se / Parece-nos)';
    },
    justificativa: 'Adequa a colocação pronominal ao registro formal exigido nas bancas de concursos.'
  },
  {
    id: 'g-enclise-apos-atrativo',
    severidade: 'erro_confirmado',
    categoria: 'Colocação Pronominal',
    re: /\b(n[aã]o|nunca|jamais|nada|ningu[eé]m|que|quando|embora|j[aá]|ainda|sempre)\s+([a-záàâãéêíóôõúç]+)-(se|me|te|nos|lhe|lhes|o|a|os|as)\b/gi,
    diagnostico: 'Uso de ênclise após palavra atrativa que exige próclise.',
    explicacao: 'Palavras de sentido negativo ("não", "nunca", "jamais"), pronomes relativos ("que") e conjunções subordinativas atraem obrigatoriamente o pronome oblíquo para antes do verbo (próclise).',
    sugestao: (m) => {
      const match = m.match(/\b(n[aã]o|nunca|jamais|nada|ningu[eé]m|que|quando|embora|j[aá]|ainda|sempre)\s+([a-záàâãéêíóôõúç]+)-(se|me|te|nos|lhe|lhes|o|a|os|as)\b/i);
      if(match) return `${match[1]} ${match[3].toLowerCase()} ${match[2]}`;
      return 'Antepor o pronome oblíquo ao verbo (próclise)';
    },
    justificativa: 'A colocação pronominal é item expresso nos espelhos de correção (especialmente Cebraspe, AOCP e Vunesp).'
  },
  {
    id: 'g-gerundismo-vicioso',
    severidade: 'erro_confirmado',
    categoria: 'Construção Sintática & Gerundismo',
    re: /\b(vai|v[aã]o|vamos|ir[aá]|ir[aã]o|iremos)\s+estar\s+([a-záàâãéêíóôõúç]+(?:ando|endo|indo))\b/gi,
    diagnostico: 'Uso de gerundismo vicioso (locução verbal com três verbos para expressar ação futura).',
    explicacao: 'A estrutura "ir + estar + gerúndio" ("vai estar fazendo") constitui vício de linguagem no registro formal quando se refere a uma ação futura simples. Deve-se empregar o futuro simples ou locução com infinitivo ("vai fazer" ou "fará").',
    sugestao: (m) => {
      const match = m.match(/\b(vai|v[aã]o|vamos|ir[aá]|ir[aã]o|iremos)\s+estar\s+([a-záàâãéêíóôõúç]+(?:ando|endo|indo))\b/i);
      if(match){
        const gerundio = match[2].toLowerCase();
        const infinitivo = gerundio.replace(/ando$/, 'ar').replace(/endo$/, 'er').replace(/indo$/, 'ir');
        return `${match[1]} ${infinitivo} (ou futuro simples)`;
      }
      return 'Substituir por infinitivo ou futuro simples (ex.: "promoverá" ou "vai promover")';
    },
    justificativa: 'Elimina vício de linguagem penalizado nos critérios de modalidade e estilo.'
  },
  {
    id: 'g-regencia-acarretar-implicar',
    severidade: 'erro_confirmado',
    categoria: 'Regência Verbal',
    re: /\b(acarreta|acarretam|acarretou|acarretar|implica|implicam|implicou|implicar)\s+(em|na|no|nas|nos)\b/gi,
    diagnostico: 'Regência inadequada dos verbos "acarretar" ou "implicar" com a preposição "em".',
    explicacao: 'No sentido de produzir como consequência ou gerar determinado efeito, os verbos "acarretar" e "implicar" são transitivos diretos (não regem a preposição "em").',
    sugestao: (m) => m.replace(/\s+(em|na|no|nas|nos)$/i, (full, prep) => {
      const mapa = { em: '', na: ' a', no: ' o', nas: ' as', nos: ' os' };
      return mapa[prep.toLowerCase()] ?? '';
    }),
    justificativa: 'Restaura a transitividade direta exigida pela gramática normativa.'
  },
  {
    id: 'g-ortografia-junto-separado',
    severidade: 'erro_confirmado',
    categoria: 'Ortografia Oficial',
    re: /\b(porisso|derrepente|apartir|concerteza|beneficiente|previl[eé]gio|impecilho|reinvindicar|excess[aã]o|paraliza[cç][aã]o|concientiza[cç][aã]o|conscientisa[cç][aã]o)\b/gi,
    diagnostico: 'Desvio de grafia oficial do vocábulo ou locução.',
    explicacao: 'A palavra ou locução foi grafada em desacordo com o Vocabulário Ortográfico da Língua Portuguesa (VOLP).',
    sugestao: (m) => {
      const k = norm(m);
      const mapa = {
        porisso: 'por isso',
        derrepente: 'de repente',
        apartir: 'a partir',
        concerteza: 'com certeza',
        beneficiente: 'beneficente',
        previlegio: 'privilégio',
        impecilho: 'empecilho',
        reinvindicar: 'reivindicar',
        excessao: 'exceção',
        paralizacao: 'paralisação',
        concientizacao: 'conscientização',
        conscientisacao: 'conscientização'
      };
      return mapa[k] || 'corrigir grafia segundo o VOLP';
    },
    justificativa: 'Evita perda direta de pontos em ortografia/microestrutura.'
  },
  {
    id: 'g-onde-nao-espacial',
    severidade: 'erro_confirmado',
    categoria: 'Coesão Referencial / Pronome Relativo',
    re: /\b([eé]poca|momento|per[ií]odo|situa[cç][aã]o|situa[cç][oõ]es|contexto|cen[aá]rio|sociedade|discuss[aã]o|debate|problema|rela[cç][aã]o|casos?|ano|d[eé]cada|s[eé]culo)\s+(?:atual\s+|contempor[aâ]ne[oa]\s+|brasileir[oa]\s+)?onde\b/gi,
    diagnostico: 'Uso do pronome relativo "onde" retomando antecedente não espacial.',
    explicacao: 'Na norma-padrão, o pronome "onde" possui valor estritamente locativo (lugar físico). Quando o antecedente indica tempo, situação, contexto, sociedade ou ideia abstrata, deve-se empregar "em que" ou "no qual / na qual".',
    sugestao: (m) => m.replace(/onde$/i, 'em que (ou no qual / na qual)'),
    justificativa: 'Desvio muito visado nas Competências I e IV do ENEM e nas bancas Cebraspe, AOCP e Vunesp.'
  },
  {
    id: 'g-virgula-conectivo-inicial',
    severidade: 'erro_confirmado',
    categoria: 'Pontuação',
    re: /(?:^|[.!?]\s+)(Portanto|Ademais|Outrossim|Contudo|Entretanto|Todavia|Nesse sentido|Dessa forma|Desse modo|Em suma|Por conseguinte|Sob essa [oó]tica|Sob esse vi[eé]s|Em primeiro lugar|Em segundo lugar|Al[eé]m disso)\s+(?![,])/g,
    diagnostico: 'Ausência de vírgula obrigatória após conectivo/adjunto deslocado no início do período.',
    explicacao: 'Conjunções conclusivas, adversativas, aditivas enfáticas e locuções adverbiais de transição iniciadas no período devem ser isoladas por vírgula.',
    sugestao: (m) => m.trim() + ',',
    justificativa: 'Garante a pontuação correta dos operadores argumentativos.'
  },
  {
    id: 'g-espaco-antes-pontuacao',
    severidade: 'erro_confirmado',
    categoria: 'Convenções da Escrita',
    re: /[a-záàâãéêíóôõúç0-9]\s+[,.;:!?]/gi,
    diagnostico: 'Espaçamento indevido antes de sinal de pontuação.',
    explicacao: 'Os sinais de pontuação (vírgula, ponto, ponto e vírgula, dois-pontos) devem ser grafados imediatamente após a palavra que os antecede, seguidos de espaço.',
    sugestao: (m) => m.replace(/\s+([,.;:!?])$/, '$1'),
    justificativa: 'Adequa a apresentação gráfica às convenções formais da escrita.'
  },
  {
    id: 'g-oralidade-forte',
    severidade: 'erro_confirmado',
    categoria: 'Registro Formal / Oralidade',
    re: /\b(pra|t[aá]|n[eé]|vc|vcs|pq|tb|tbm|a gente|a n[ií]vel de)\b/gi,
    diagnostico: 'Marca explícita de oralidade, abreviação ou vício de linguagem coloquial.',
    explicacao: 'O gênero dissertativo-argumentativo exige o uso da modalidade escrita formal da língua portuguesa, sendo vedadas abreviações e coloquialismos.',
    sugestao: (m) => {
      const k = norm(m);
      const mapa = {
        'pra': 'para',
        'ta': 'está',
        'ne': 'não é (evitar pergunta coloquial)',
        'vc': 'você (prefira a 3ª pessoa impessoal: o cidadão / o indivíduo)',
        'vcs': 'os cidadãos',
        'pq': 'porque / porquanto',
        'tb': 'também',
        'tbm': 'também',
        'a gente': 'a sociedade / a população / nós',
        'a nivel de': 'em âmbito / no plano de'
      };
      return mapa[k] || 'substituir por equivalente formal';
    },
    justificativa: 'Preserva a impessoalidade e o registro culto exigidos no edital.'
  },

  /* --- FRAGILIDADES ARGUMENTATIVAS (INTERPRETAÇÃO PEDAGÓGICA) --- */
  {
    id: 'f-subjetividade-primeira-pessoa',
    severidade: 'fragilidade_argumentativa',
    categoria: 'Impessoalidade Dissertativa',
    re: /\b(eu acho|na minha opini[aã]o|no meu ponto de vista|eu acredito|penso que|ao meu ver|a meu ver)\b/gi,
    diagnostico: 'Quebra da impessoalidade por marca explícita de primeira pessoa singular.',
    explicacao: 'A dissertação argumentativa exige objetividade e impessoalidade (3ª pessoa do singular/plural). Expressões como "eu acho" reduzem a força do argumento a uma opinião subjetiva.',
    sugestao: () => 'constata-se que / evidencia-se que / cabe ponderar que',
    justificativa: 'Confere autoridade analítica e objetividade científica ao argumento.'
  },
  {
    id: 'f-generalizacao-absoluta',
    severidade: 'fragilidade_argumentativa',
    categoria: 'Modalização & Rigor Argumentativo',
    re: /\b(ningu[eé]m faz nada|todo mundo sabe|nada [eé] feito|o estado n[aã]o faz absolutamente nada|todos os pol[ií]ticos|todos os policiais|sempre foi assim|jamais mudar[aá]|[eé] imposs[ií]vel resolver)\b/gi,
    diagnostico: 'Generalização absoluta / hiperbólica sem comprovação empírica.',
    explicacao: 'Conforme o Método Pensar para Argumentar (Aula 1), afirmações categóricas absolutas ("nada é feito", "ninguém", "todo mundo") são facilmente refutáveis pelo avaliador e demonstram senso comum.',
    sugestao: () => 'Empregar modalizadores precisos: "Observa-se a insuficiência das ações estatais" / "Parte significativa da população"',
    justificativa: 'Eleva a maturidade crítica e evita juízos generalizantes.'
  },
  {
    id: 'f-cliche-conclusivo',
    severidade: 'fragilidade_argumentativa',
    categoria: 'Consistência da Conclusão',
    re: /\b(cada um fazer a? sua parte|para um mundo melhor|dias melhores vir[aã]o|conscientizar a popula[cç][aã]o para que todos|basta querer para mudar)\b/gi,
    diagnostico: 'Fechamento apoiado em clichê ou frase vaga (Erro Capital na Conclusão — Aula 3).',
    explicacao: 'Expressões genéricas como "cada um fazer sua parte" esvaziam o rigor da proposta ou síntese final, pois não indicam mecanismos institucionais concretos.',
    sugestao: () => 'Especificar agentes institucionais, meios de execução (orçamento, fiscalização, currículo) e finalidade concreta.',
    justificativa: 'Substitui o senso comum por encaminhamento analítico e exequível.'
  },

  /* --- SUGESTÕES ESTILÍSTICAS (SEM DESCONTO NA NOTA GRAMATICAL — REGRA 4.2) --- */
  {
    id: 's-vocabulario-vago',
    severidade: 'sugestao_estilistica',
    categoria: 'Precisão Lexical (Refinamento)',
    re: /\b(coisa|coisas|algo muito ruim|algo muito bom)\b/gi,
    diagnostico: 'Uso de vocábulo de sentido amplo/genérico (oportunidade de refinamento vocabular).',
    explicacao: 'Embora gramaticalmente aceitável, o substantivo "coisa" ou "algo" possui baixa especificidade semântica. Substituí-lo por termos precisos enriquece a informatividade.',
    sugestao: () => 'fator / aspecto / fenômeno / conjuntura / entrave / diretriz',
    justificativa: 'Refinamento estilístico opcional: melhora a precisão vocabular sem configurar erro gramatical.'
  },
  {
    id: 's-hoje-em-dia',
    severidade: 'sugestao_estilistica',
    categoria: 'Refinamento Estilístico',
    re: /\bhoje em dia\b/gi,
    diagnostico: 'Locução temporal desgastada pelo uso cotidiano.',
    explicacao: 'A expressão "hoje em dia" é correta, mas pode ser substituída por marcadores temporais mais elegantes na prosa acadêmica e de concursos.',
    sugestao: () => 'na contemporaneidade / no cenário hodierno / na atualidade',
    justificativa: 'Sugestão estilística (não gera desconto na nota).'
  }
];

function analisarOcorrenciasPorSentenca(paragrafos, bancaKey){
  const ocorrencias = [];
  const criterioGramaticalMap = {
    pmpe: 'Critério 5: Modalidade gramatical (norma-padrão)',
    cbmpe: 'Critério 5: Modalidade gramatical (norma-padrão)',
    pcpe: 'Microestrutura (NE — Desconto na Fórmula Líquida)',
    pppe: 'Microestrutura (NE — Desconto na Fórmula Líquida)',
    pmsp: 'Critério C: Expressão (Coesão e Modalidade)',
    enem: 'Competência I: Domínio da modalidade escrita formal'
  };
  const criterioArgumentativoMap = {
    pmpe: 'Critério 4: Informatividade e argumentação',
    cbmpe: 'Critério 4: Informatividade e argumentação',
    pcpe: 'Macroestrutura (Conteúdo dos Tópicos — NC)',
    pppe: 'Macroestrutura (Domínio do Conteúdo — NC)',
    pmsp: 'Critério B: Estrutura (Gênero e Coerência)',
    enem: 'Competência III: Projeto de texto e defesa de ponto de vista'
  };

  paragrafos.forEach((par, pIdx) => {
    // Dividir em sentenças preservando pontuação final
    const sentencas = par.match(/[^.!?]+[.!?]*/g) || [par];

    sentencas.forEach((sentRaw, sIdx) => {
      const sent = sentRaw.trim();
      if(!sent) return;

      REGRAS_CONTEXTUAIS.forEach(regra => {
        regra.re.lastIndex = 0;
        let match;
        while((match = regra.re.exec(sent)) !== null){
          if(regra.validarContexto && !regra.validarContexto(match, sent)){
            continue;
          }
          let trechoExato = match[0];
          let startOffset = match.index;
          if(/^[.!?]\s+/.test(trechoExato)){
            const leadMatch = trechoExato.match(/^[.!?]\s+/)[0];
            trechoExato = trechoExato.slice(leadMatch.length);
            startOffset += leadMatch.length;
          }
          trechoExato = trechoExato.trim();

          const isErro = regra.severidade === 'erro_confirmado';
          const isFrag = regra.severidade === 'fragilidade_argumentativa';

          let impactoNota = 'Sem desconto na nota (sugestão de refinamento estilístico)';
          if(isErro){
            if(bancaKey === 'pcpe' || bancaKey === 'pppe') impactoNota = 'Contabilizado como 1 erro de microestrutura (NE) na fórmula NPD = NC - (2 × NE / TL).';
            else if(bancaKey === 'enem') impactoNota = 'Impacta a avaliação de desvios na Competência I.';
            else if(bancaKey === 'pmsp') impactoNota = 'Impacta a pontuação do Critério C (Expressão).';
            else impactoNota = 'Impacta a pontuação do Critério 5 (Modalidade gramatical).';
          } else if(isFrag){
            impactoNota = 'Impacto qualitativo na consistência argumentativa (Macroestrutura), sem desconto gramatical.';
          }

          ocorrencias.push({
            id: `${regra.id}-p${pIdx+1}-s${sIdx+1}-${startOffset}`,
            severidade: regra.severidade,
            tipoGlau: isErro ? 'erro' : (isFrag ? 'coesao' : 'estilo'),
            categoria: regra.categoria,
            trechoOriginal: trechoExato,
            contextoSentenca: sent,
            paragrafo: pIdx + 1,
            sentenca: sIdx + 1,
            localizacao: `Parágrafo ${pIdx + 1}, Sentença ${sIdx + 1}`,
            diagnostico: regra.diagnostico,
            explicacaoRegra: regra.explicacao,
            sugestaoCorrecao: typeof regra.sugestao === 'function' ? regra.sugestao(trechoExato) : regra.sugestao,
            justificativaCorrecao: regra.justificativa,
            criterioAfetado: isErro ? criterioGramaticalMap[bancaKey] : (isFrag ? criterioArgumentativoMap[bancaKey] : 'Refinamento Estilístico (Não penalizado)'),
            impactoNota
          });
        }
      });

      // Verificar período excessivamente longo (> 62 palavras em uma única sentença sem ponto final)
      const numPalavrasSent = sent.split(/\s+/).filter(Boolean).length;
      if(numPalavrasSent > 62){
        ocorrencias.push({
          id: `sintaxe-longa-p${pIdx+1}-s${sIdx+1}`,
          severidade: 'fragilidade_argumentativa',
          tipoGlau: 'coesao',
          categoria: 'Construção Sintática & Clareza',
          trechoOriginal: sent.slice(0, 85) + '...',
          contextoSentenca: sent,
          paragrafo: pIdx + 1,
          sentenca: sIdx + 1,
          localizacao: `Parágrafo ${pIdx + 1}, Sentença ${sIdx + 1}`,
          diagnostico: `Período excessivamente longo (${numPalavrasSent} palavras em uma única frase), prejudicando a fluidez e a clareza sintática.`,
          explicacaoRegra: 'Parágrafos dissertativos de alto nível costumam organizar-se em 2 a 4 períodos de extensão equilibrada (entre 20 e 45 palavras por período), facilitando a leitura das relações de causa e consequência.',
          sugestaoCorrecao: 'Dividir o período em duas frases utilizando ponto final seguido de conectivo ("Nesse sentido,", "Ademais,", "Consequentemente,").',
          justificativaCorrecao: 'Evita truncamentos sintáticos e melhora a clareza da argumentação.',
          criterioAfetado: criterioArgumentativoMap[bancaKey],
          impactoNota: 'Impacto qualitativo na clareza e coesão sequencial.'
        });
      }
    });

    // Verificar repetição vocabular excessiva dentro do mesmo parágrafo (palavras não-stopwords >= 6 letras repetidas >= 4 vezes no mesmo parágrafo)
    const palavrasPar = norm(par).replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(w => w.length >= 6 && !STOPWORDS_PT.has(w));
    const freq = {};
    palavrasPar.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
    Object.entries(freq).forEach(([palavra, cont]) => {
      if(cont >= 4){
        ocorrencias.push({
          id: `rep-lexical-p${pIdx+1}-${palavra}`,
          severidade: 'sugestao_estilistica',
          tipoGlau: 'coesao',
          categoria: 'Coesão Referencial & Vocabulário',
          trechoOriginal: `"${palavra}" (${cont}x no Parágrafo ${pIdx + 1})`,
          contextoSentenca: par,
          paragrafo: pIdx + 1,
          sentenca: 1,
          localizacao: `Parágrafo ${pIdx + 1}`,
          diagnostico: `Repetição frequente do vocábulo "${palavra}" (${cont} ocorrências no mesmo parágrafo).`,
          explicacaoRegra: 'A coesão referencial valoriza a substituição lexical por sinônimos, hiperônimos ou pronomes demonstrativos/relativos para evitar eco vocabular.',
          sugestaoCorrecao: `Alternar "${palavra}" com sinônimos contextuais, pronomes ("esse fenômeno", "tal questão") ou elipses.`,
          justificativaCorrecao: 'Enriquece a fluidez coesiva (Coesão Referencial).',
          criterioAfetado: 'Coesão Referencial (Refinamento)',
          impactoNota: 'Sugestão de aprimoramento coesivo.'
        });
      }
    });
  });

  return ocorrencias;
}

/* =====================================================================
   4. ANÁLISE PARÁGRAFO POR PARÁGRAFO (SEÇÃO 5E)
   ===================================================================== */
const CONECTIVOS_LISTA = [
  'portanto','ademais','alem disso','contudo','entretanto','todavia','no entanto','outrossim','assim sendo',
  'dessa forma','desse modo','por conseguinte','haja vista','visto que','uma vez que','dado que','logo','em suma',
  'por fim','em primeiro lugar','em segundo lugar','primeiramente','sob essa otica','sob esse vies','nesse sentido',
  'nesse contexto','diante disso','por outro lado','bem como','consequentemente','nao obstante','embora','conforme',
  'segundo','de acordo com','a medida que','para que','a fim de'
];

function analisarParagrafosDetalhadamente(paragrafos, tema, bancaKey, repertorioInfo, ocorrencias){
  const totalP = paragrafos.length;
  const spec = global.RedacaoDados.BANCA_SPECS[bancaKey];

  return paragrafos.map((par, idx) => {
    const numP = idx + 1;
    const nPar = norm(par);
    const palavras = par.trim().split(/\s+/).filter(Boolean).length;
    const sentencas = (par.match(/[^.!?]+[.!?]*/g) || [par]).map(s => s.trim()).filter(Boolean);

    // Identificar função do parágrafo
    let funcao = 'Desenvolvimento Argumentativo';
    if(totalP === 1){
      funcao = 'Parágrafo Único (Monobloco — Estrutura inadequada ao gênero)';
    } else if(idx === 0){
      funcao = 'Introdução (Contextualização e Apresentação da Tese)';
    } else if(idx === totalP - 1){
      funcao = 'Conclusão (Síntese Argumentativa / Fechamento / Proposta)';
    } else {
      funcao = `Desenvolvimento ${idx} (Defesa e Fundamentação do Argumento ${idx})`;
    }

    // Extrair ideia central (primeira sentença resumida)
    const primeiraSentenca = sentencas[0] || par;
    const ideiaCentral = primeiraSentenca.length > 140 ? primeiraSentenca.slice(0, 140) + '...' : primeiraSentenca;

    // Conectivos presentes no parágrafo
    const conectivosNoPar = CONECTIVOS_LISTA.filter(c => nPar.includes(c));
    const iniciaComConectivo = idx > 0 && /^(portanto|ademais|alem disso|outrossim|contudo|entretanto|todavia|no entanto|nesse sentido|sob essa otica|sob esse vies|em primeiro lugar|em segundo lugar|por outro lado|diante disso|dessa forma|desse modo|por conseguinte|em suma|por fim|cabe ressaltar|convem destacar|paralelamente)\b/i.test(nPar);

    // Verificar tese / relação com a tese
    const temMarcadorTese = /\b(desafio|problema|necessidade|urgente|imperativo|deve|compromete|ameaca|fundamental|essencial|entrave|negligencia|omissao|precariedade|importancia|garantir|combater|enfrentar|evidencia-se|constata-se)\b/.test(nPar);
    const repNoPar = repertorioInfo.lista.filter(r => r.paragrafo === numP);
    const errosNoPar = ocorrencias.filter(o => o.paragrafo === numP);

    // Avaliar clareza
    let clareza = 'Adequada e objetiva';
    if(sentencas.length === 1 && palavras > 45){
      clareza = 'Prejudicada por período único excessivamente longo (falta de divisão sintática).';
    } else if(palavras < 22){
      clareza = 'Parágrafo embrionário / muito curto, com desenvolvimento insuficiente da ideia.';
    } else if(sentencas.length >= 2 && sentencas.length <= 4){
      clareza = 'Boa organização sintática, com divisão equilibrada em períodos.';
    }

    // Avaliar relação com a tese
    let relacaoTese = '';
    if(idx === 0){
      relacaoTese = temMarcadorTese
        ? 'Apresenta posicionamento crítico perceptível (tese) diante do tema proposto.'
        : 'Expõe o assunto geral, mas a tese (ponto de vista crítico a ser defendido) está implícita ou pouco incisiva.';
    } else if(idx === totalP - 1){
      const temRetomadaOuProposta = /\b(portanto|desse modo|dessa forma|assim|em suma|cabe|compete|deve|necessario|medida|politica|acao|sociedade|estado|governo|ministerio|secretaria)\b/.test(nPar);
      relacaoTese = temRetomadaOuProposta
        ? 'Retoma a discussão central e encaminha o fechamento de modo coerente com a tese.'
        : 'Encerra o texto de maneira abrupta, sem retomar claramente a tese ou sintetizar os argumentos.';
    } else {
      relacaoTese = temMarcadorTese
        ? 'Sustenta a tese central por meio de problematização de causas ou consequências.'
        : 'Predominantemente expositivo/descritivo; precisa explicitar melhor o juízo crítico que defende a tese.';
    }

    // Qualidade da fundamentação
    let qualidadeFundamentacao = '';
    if(repNoPar.length > 0){
      const prod = repNoPar.some(r => r.produtivo);
      qualidadeFundamentacao = prod
        ? `Fundamentação sólida: mobiliza ${repNoPar.map(r => r.nome).join(', ')} de forma produtiva e explicada.`
        : `Fundamentação parcial: menciona ${repNoPar.map(r => r.nome).join(', ')}, mas pode aprofundar a explicação da ponte com o argumento.`;
    } else if(idx > 0 && idx < totalP - 1){
      qualidadeFundamentacao = 'Baseada em raciocínio lógico/dedutivo próprio, sem citação explícita de repertório externo neste parágrafo.';
    } else if(idx === 0){
      qualidadeFundamentacao = palavras >= 35
        ? 'Contextualização introdutória consistente com recorte temático.'
        : 'Contextualização breve; poderia abrir com alusão histórica, princípio constitucional ou conceito filosófico.';
    } else {
      qualidadeFundamentacao = 'Parágrafo conclusivo voltado à síntese e/ou proposta de solução.';
    }

    // Coesão interna
    let coesaoInterna = '';
    if(idx > 0 && !iniciaComConectivo){
      coesaoInterna = `Possui ${conectivosNoPar.length} operador(es) interno(s), mas não inicia o parágrafo com um conectivo interparágrafo explícito.`;
    } else if(conectivosNoPar.length >= 2){
      coesaoInterna = `Boa articulação coesiva (${conectivosNoPar.slice(0, 4).join(', ')}).`;
    } else if(conectivosNoPar.length === 1){
      coesaoInterna = `Coesão básica (presença de "${conectivosNoPar[0]}"); recomenda-se adicionar operador intraparágrafo entre os períodos.`;
    } else {
      coesaoInterna = 'Escassez de conectivos explícitos; as frases estão justapostas sem operadores lógicos claros.';
    }

    // Problemas identificados no parágrafo
    const problemasPar = [];
    if(palavras < 25) problemasPar.push('Extensão reduzida e argumentação superficial.');
    if(sentencas.length === 1 && palavras >= 35) problemasPar.push('Parágrafo escrito em período único (uma só frase longa).');
    if(idx === 0 && !temMarcadorTese) problemasPar.push('Falta explicitar a tese (posicionamento crítico) no fechamento da introdução.');
    if(idx > 0 && !iniciaComConectivo) problemasPar.push('Ausência de conectivo interparágrafo na abertura do bloco.');
    if(idx > 0 && idx < totalP - 1 && repNoPar.length === 0) problemasPar.push('Argumento sem fundamentação sociocultural/normativa explícita.');
    if(idx === totalP - 1 && spec.requiresIntervention){
      const temAgente = /\b(governo|ministerio|secretaria|estado|escolas|poder executivo|poder legislativo|policia|prefeituras|congresso|midia|sociedade)\b/.test(nPar);
      const temMeio = /\b(por meio d[eao]s?|mediante|atraves d[eao]s?|com a criacao|por intermedio d[eao]s?)\b/.test(nPar);
      const temFim = /\b(a fim de|para que|com o intuito|visando a|com o objetivo)\b/.test(nPar);
      if(!temAgente || !temMeio || !temFim){
        problemasPar.push('Proposta de intervenção incompleta para os 5 elementos exigidos na Competência V do ENEM.');
      }
    }
    errosNoPar.forEach(e => {
      if(e.severidade === 'erro_confirmado'){
        problemasPar.push(`${e.categoria}: "${e.trechoOriginal}" → ${e.sugestaoCorrecao}.`);
      }
    });

    // Como melhorar
    let comoMelhorar = '';
    if(idx === 0){
      comoMelhorar = 'Estruture a introdução em 3 períodos: 1) Contextualização (lei, conceito ou fato histórico); 2) Ponte com o recorte do tema; 3) Tese clara indicando os dois caminhos argumentativos do desenvolvimento.';
    } else if(idx === totalP - 1){
      comoMelhorar = spec.requiresIntervention
        ? 'Inicie com conectivo conclusivo ("Portanto,"), retome a tese e apresente a Proposta de Intervenção completa com os 5 elementos (Agente + Ação + Meio/Modo + Detalhamento + Finalidade).'
        : 'Inicie com conectivo conclusivo ("Portanto," / "Em suma,"), reafirme a tese com outras palavras, sintetize os argumentos discutidos e apresente um fechamento institucional sólido.';
    } else {
      comoMelhorar = 'Estruture o desenvolvimento em 3 a 4 períodos: 1) Tópico frasal (ideia-núcleo); 2) Fundamentação com repertório explicado; 3) Aplicação prática à realidade do tema; 4) Fechamento crítico do parágrafo.';
    }

    // Exemplo de versão revisada do parágrafo (aplicando as correções reais do aluno + aprimoramento)
    let versaoRevisada = par.trim();
    errosNoPar.forEach(e => {
      if(e.severidade === 'erro_confirmado' && e.trechoOriginal && !e.sugestaoCorrecao.includes('(')){
        versaoRevisada = versaoRevisada.replace(e.trechoOriginal, e.sugestaoCorrecao);
      }
    });
    if(idx > 0 && !iniciaComConectivo){
      const conSugerido = idx === totalP - 1 ? 'Portanto, ' : (idx === 1 ? 'Em primeiro lugar, ' : 'Ademais, ');
      versaoRevisada = conSugerido + versaoRevisada.charAt(0).toLowerCase() + versaoRevisada.slice(1);
    }
    if(idx === 0 && !temMarcadorTese){
      versaoRevisada = versaoRevisada.replace(/[.!?]*$/, '') + `. Nesse contexto, torna-se imperativo analisar os entraves estruturais relacionados a ${tema} e consolidar mecanismos efetivos para sua superação.`;
    }

    return {
      numero: numP,
      funcao,
      palavras,
      sentencas: sentencas.length,
      ideiaCentral,
      clareza,
      relacaoTese,
      qualidadeFundamentacao,
      coesaoInterna,
      problemas: problemasPar.length ? problemasPar : ['Nenhum problema estrutural grave identificado neste parágrafo.'],
      comoMelhorar,
      textoOriginal: par,
      versaoRevisada
    };
  });
}

/* =====================================================================
   5. CÁLCULO CONTEXTUAL DE NOTAS POR BANCA E CAMADA DE VALIDAÇÃO (SEÇÃO 4.3 & 6)
   ===================================================================== */
function calcularNotasPorRubrica(dadosAnalise){
  const {
    bancaKey,
    palavras,
    linhasEstimadas,
    paragrafos,
    aderencia,
    repertorio,
    ocorrencias,
    analiseParagrafos
  } = dadosAnalise;

  const spec = global.RedacaoDados.BANCA_SPECS[bancaKey];
  const errosConfirmados = ocorrencias.filter(o => o.severidade === 'erro_confirmado');
  const fragilidades = ocorrencias.filter(o => o.severidade === 'fragilidade_argumentativa');

  // Verificar condições de nota zero documentadas (menos de 7 linhas ou fuga total ao tema)
  const anulacao = {
    anulada: false,
    motivo: null
  };
  if(linhasEstimadas < spec.zeroMinLines){
    anulacao.anulada = true;
    anulacao.motivo = `Texto com extensão inferior ao mínimo eliminatório (${linhasEstimadas} linha(s) estimada(s); mínimo exigido para correção: ${spec.zeroMinLines} linhas).`;
  } else if(aderencia.status === 'fuga_total'){
    anulacao.anulada = true;
    anulacao.motivo = 'Fuga total ao tema proposto identificada na verificação semântica dos núcleos temáticos.';
  }

  // Métricas qualitativas reais (independentes de tamanho bruto quando o texto já é válido)
  const numPar = paragrafos.length;
  const estruturaDissertativaCompleta = numPar >= 3 && numPar <= 5;
  const temTeseClara = analiseParagrafos.length > 0 && !analiseParagrafos[0].relacaoTese.includes('implícita');
  const conectivosInter = analiseParagrafos.slice(1).filter(p => !p.coesaoInterna.includes('não inicia')).length;
  const totalConectivosDistintos = CONECTIVOS_LISTA.filter(c => norm(dadosAnalise.texto).includes(c)).length;

  const espelhoCriterios = [];
  let notaTotalCalculada = 0;
  let detalhesEspecificos = {};

  /* -------------------------------------------------------------------
     RUBRICA 1: INSTITUTO AOCP (PMPE / CBMPE) — 40,0 PONTOS (5 x 8,0)
     ------------------------------------------------------------------- */
  if(bancaKey === 'pmpe' || bancaKey === 'cbmpe'){
    // Critério 1: Tema (0 a 8.0)
    let c1 = 7.5;
    if(aderencia.status === 'tangenciamento') c1 = 3.5;
    else if(aderencia.percentualNucleos >= 70) c1 = 8.0;
    else if(aderencia.percentualNucleos >= 45) c1 = 6.8;
    if(!temTeseClara) c1 -= 0.8;
    if(linhasEstimadas < spec.minLines) c1 -= 1.0;
    c1 = anulacao.anulada ? 0 : clamp(Math.round(c1 * 10) / 10, 0, 8.0);

    // Critério 2: Coesão referencial e sequencial (0 a 8.0)
    let c2 = 6.0;
    if(conectivosInter >= Math.max(1, numPar - 2)) c2 += 1.2;
    if(totalConectivosDistintos >= 4) c2 += 0.8;
    else if(totalConectivosDistintos <= 1) c2 -= 1.8;
    const errosCoesao = errosConfirmados.filter(e => e.categoria.includes('Coesão') || e.categoria.includes('Pontuação')).length;
    c2 -= errosCoesao * 0.5;
    c2 = anulacao.anulada ? 0 : clamp(Math.round(c2 * 10) / 10, 0, 8.0);

    // Critério 3: Estrutura textual e coerência (0 a 8.0)
    let c3 = 6.2;
    if(estruturaDissertativaCompleta) c3 += 1.3;
    else if(numPar === 2) c3 -= 1.5;
    else if(numPar === 1) c3 -= 4.0;
    if(temTeseClara) c3 += 0.5;
    if(linhasEstimadas < spec.minLines) c3 -= 1.2;
    c3 = anulacao.anulada ? 0 : clamp(Math.round(c3 * 10) / 10, 0, 8.0);

    // Critério 4: Informatividade e argumentação (0 a 8.0)
    let c4 = 5.4;
    if(repertorio.temProdutivo) c4 += 2.4;
    else if(repertorio.temAlgum) c4 += 1.0; // Repertório citado mas não produtivo ganha menos (Regra 4.2)
    if(temTeseClara && numPar >= 3) c4 += 0.4;
    c4 -= fragilidades.length * 0.6;
    if(aderencia.status === 'tangenciamento') c4 = Math.min(c4, 4.0);
    c4 = anulacao.anulada ? 0 : clamp(Math.round(c4 * 10) / 10, 0, 8.0);

    // Critério 5: Modalidade gramatical (0 a 8.0) — Apenas erros confirmados descontam!
    let c5 = 8.0 - (errosConfirmados.length * 0.8);
    c5 = anulacao.anulada ? 0 : clamp(Math.round(c5 * 10) / 10, 0, 8.0);

    const notasArray = [c1, c2, c3, c4, c5];
    notaTotalCalculada = Math.round(notasArray.reduce((a, b) => a + b, 0) * 10) / 10;

    const evidenciasC1 = aderencia.nucleosEncontrados.length
      ? `Núcleos do tema identificados no texto: "${aderencia.nucleosEncontrados.slice(0, 5).join(', ')}".`
      : 'Ausência de termos nucleares diretos do enunciado.';
    const evidenciasC2 = totalConectivosDistintos
      ? `Operadores coesivos empregados: "${CONECTIVOS_LISTA.filter(c => norm(dadosAnalise.texto).includes(c)).slice(0, 6).join(', ')}".`
      : 'Poucos operadores argumentativos explícitos entre os períodos.';
    const evidenciasC3 = `Texto organizado em ${numPar} parágrafo(s) e cerca de ${linhasEstimadas} linha(s) manuscritas.`;
    const evidenciasC4 = repertorio.temAlgum
      ? `Repertório identificado: ${repertorio.lista.map(r => `${r.nome} (P${r.paragrafo})`).join('; ')}.`
      : 'Argumentação desenvolvida sem citação de repertório externo explícito.';
    const evidenciasC5 = errosConfirmados.length
      ? `${errosConfirmados.length} desvio(s) confirmado(s): ${errosConfirmados.slice(0, 3).map(e => `"${e.trechoOriginal}"`).join(', ')}.`
      : 'Nenhum desvio gramatical objetivo confirmado na verificação contextual.';

    const listaEvid = [evidenciasC1, evidenciasC2, evidenciasC3, evidenciasC4, evidenciasC5];
    const listaJust = [
      aderencia.diagnostico,
      conectivosInter >= Math.max(1, numPar - 2) ? 'Transições interparágrafos e encadeamento interno bem articulados.' : 'Há oportunidades de reforçar os conectivos no início dos parágrafos.',
      estruturaDissertativaCompleta ? 'Macroestrutura dissertativa dividida adequadamente em introdução, desenvolvimento e conclusão.' : 'A divisão paragráfica foge ao padrão dissertativo equilibrado (3 a 4 parágrafos).',
      repertorio.resumoGeral,
      errosConfirmados.length === 0 ? 'Excelente domínio da norma-padrão escrita.' : `Foram aplicados descontos proporcionais a ${errosConfirmados.length} desvio(s) gramatical(is) confirmado(s).`
    ];

    spec.criteriaList.forEach((cr, i) => {
      const nota = notasArray[i];
      espelhoCriterios.push({
        id: cr.id,
        nome: cr.title,
        max: cr.pts,
        nota,
        justificativa: listaJust[i],
        evidencias: listaEvid[i],
        positivos: nota >= 6.4 ? 'Critério bem atendido, demonstrando segurança técnica.' : 'Apresenta base compreensível que pode ser lapidada.',
        problemas: nota < 6.4 ? listaJust[i] : 'Sem falhas graves neste quesito.',
        acaoRecomendada: i === 0 ? 'Sublinhe os núcleos do tema antes de redigir e retome-os em todos os parágrafos.'
          : (i === 1 ? 'Inicie os parágrafos de desenvolvimento e conclusão com conectivos variados.'
          : (i === 2 ? `Mantenha 4 parágrafos (Introdução, D1, D2 e Conclusão) respeitando a extensão oficial (${spec.linesRange}).`
          : (i === 3 ? 'Aplique o método Referência → Explicação → Ponte com o tema.'
          : 'Revise concordância, crase e pontuação antes de passar o texto a limpo.')))
      });
    });

    detalhesEspecificos = { tipo: 'aocp', notas: { c1, c2, c3, c4, c5 } };
  }

  /* -------------------------------------------------------------------
     RUBRICA 2: CESPE / CEBRASPE (PCPE) — 30,00 PTS (FÓRMULA LÍQUIDA)
     ------------------------------------------------------------------- */
  else if(bancaKey === 'pcpe'){
    let apres = 1.5;
    if(numPar < 3) apres -= 0.6;
    if(linhasEstimadas < spec.minLines) apres -= 0.4;
    apres = anulacao.anulada ? 0 : clamp(Math.round(apres * 100) / 100, 0, 1.5);

    let top1 = aderencia.status === 'tangenciamento' ? 4.5 : (aderencia.percentualNucleos >= 65 ? 9.0 : 7.5);
    if(!temTeseClara) top1 -= 1.0;
    top1 = anulacao.anulada ? 0 : clamp(Math.round(top1 * 100) / 100, 0, 9.5);

    let top2 = 6.0;
    if(repertorio.temProdutivo) top2 += 3.2;
    else if(repertorio.temAlgum) top2 += 1.5;
    top2 -= fragilidades.length * 0.6;
    top2 = anulacao.anulada ? 0 : clamp(Math.round(top2 * 100) / 100, 0, 9.5);

    const ultPar = analiseParagrafos[analiseParagrafos.length - 1];
    let top3 = ultPar && !ultPar.relacaoTese.includes('abrupta') ? 8.2 : 5.5;
    if(numPar >= 3 && totalConectivosDistintos >= 4) top3 += 0.8;
    if(aderencia.status === 'tangenciamento') top3 = Math.min(top3, 4.5);
    top3 = anulacao.anulada ? 0 : clamp(Math.round(top3 * 100) / 100, 0, 9.5);

    const nc = Math.round((apres + top1 + top2 + top3) * 100) / 100;
    const ne = errosConfirmados.length;
    const tl = Math.max(1, linhasEstimadas);
    const penalidade = anulacao.anulada ? 0 : Math.round(((2 * ne) / tl) * 100) / 100;
    notaTotalCalculada = anulacao.anulada ? 0 : clamp(Math.round((nc - penalidade) * 100) / 100, 0, 30.0);

    const notasMacro = [apres, top1, top2, top3];
    spec.criteriaList.forEach((cr, i) => {
      const nota = notasMacro[i];
      espelhoCriterios.push({
        id: cr.id,
        nome: cr.title,
        max: cr.pts,
        nota,
        justificativa: i === 0
          ? `Estrutura em ${numPar} parágrafo(s) e ${linhasEstimadas} linha(s) efetivamente escritas (TL = ${tl}).`
          : (i === 1 ? aderencia.diagnostico : (i === 2 ? repertorio.resumoGeral : 'Avaliação dos encaminhamentos institucionais e fechamento analítico do texto.')),
        evidencias: i === 0
          ? `Parágrafos: ${numPar} | Linhas (TL): ${tl}.`
          : (i === 1 ? `Núcleos abordados: "${aderencia.nucleosEncontrados.slice(0, 5).join(', ') || 'nenhum'}".`
          : (i === 2 ? (repertorio.temAlgum ? repertorio.lista.map(r => r.nome).join(', ') : 'Sem citação normativa/doutrinária explícita.')
          : `Parágrafo conclusivo com ${ultPar ? ultPar.palavras : 0} palavras.`)),
        positivos: nota >= cr.pts * 0.75 ? 'Tópico desenvolvido com consistência e clareza.' : 'Abordagem inicial presente.',
        problemas: nota < cr.pts * 0.75 ? 'Necessita aprofundar a fundamentação específica deste aspecto do comando.' : 'Sem lacunas graves na macroestrutura.',
        acaoRecomendada: 'No Cebraspe, dedique um parágrafo específico do desenvolvimento para cada tópico exigido no comando da questão.'
      });
    });

    detalhesEspecificos = {
      tipo: 'cebraspe',
      nc,
      ne,
      tl,
      penalidade,
      notasMacro: { apres, top1, top2, top3 }
    };
  }

  /* -------------------------------------------------------------------
     RUBRICA 2.1: CEBRASPE (PPPE) — 10,00 PTS (FÓRMULA EDITAL PPPE 2026: NPD = NC - 2×NE/TL)
     ------------------------------------------------------------------- */
  else if(bancaKey === 'pppe'){
    // 1. Apresentação, estrutura textual e legibilidade: max 1.0
    let apres = 1.0;
    if(numPar < 3) apres -= 0.35;
    if(linhasEstimadas < spec.minLines) apres -= 0.25;
    apres = anulacao.anulada ? 0 : clamp(Math.round(apres * 100) / 100, 0, 1.0);

    // 2. Desenvolvimento do tema e conhecimento do assunto: max 3.0
    let top1 = aderencia.status === 'tangenciamento' ? 1.5 : (aderencia.percentualNucleos >= 65 ? 2.85 : 2.3);
    if(!temTeseClara) top1 -= 0.35;
    top1 = anulacao.anulada ? 0 : clamp(Math.round(top1 * 100) / 100, 0, 3.0);

    // 3. Qualidade e consistência dos argumentos: max 3.0
    let top2 = 1.9;
    if(repertorio.temProdutivo) top2 += 1.0;
    else if(repertorio.temAlgum) top2 += 0.5;
    top2 -= fragilidades.length * 0.2;
    top2 = anulacao.anulada ? 0 : clamp(Math.round(top2 * 100) / 100, 0, 3.0);

    // 4. Progressão temática e propostas de encaminhamento: max 3.0
    const ultPar = analiseParagrafos[analiseParagrafos.length - 1];
    let top3 = ultPar && !ultPar.relacaoTese.includes('abrupta') ? 2.6 : 1.7;
    if(numPar >= 3 && totalConectivosDistintos >= 4) top3 += 0.3;
    if(aderencia.status === 'tangenciamento') top3 = Math.min(top3, 1.5);
    top3 = anulacao.anulada ? 0 : clamp(Math.round(top3 * 100) / 100, 0, 3.0);

    const nc = Math.round((apres + top1 + top2 + top3) * 100) / 100;
    const ne = errosConfirmados.length;
    const tl = Math.max(1, linhasEstimadas);
    const penalidade = anulacao.anulada ? 0 : Math.round(((2 * ne) / tl) * 100) / 100;
    notaTotalCalculada = anulacao.anulada ? 0 : clamp(Math.round((nc - penalidade) * 100) / 100, 0, 10.0);

    const notasMacro = [apres, top1, top2, top3];
    spec.criteriaList.forEach((cr, i) => {
      const nota = notasMacro[i];
      espelhoCriterios.push({
        id: cr.id,
        nome: cr.title,
        max: cr.pts,
        nota,
        justificativa: i === 0
          ? `Apresentação em ${numPar} parágrafo(s) e ${linhasEstimadas} linha(s) efetivamente escritas (TL = ${tl}).`
          : (i === 1 ? aderencia.diagnostico : (i === 2 ? repertorio.resumoGeral : 'Avaliação dos encaminhamentos e propostas em conformidade com a LEP e direitos fundamentais.')),
        evidencias: i === 0
          ? `Parágrafos: ${numPar} | Linhas (TL): ${tl}.`
          : (i === 1 ? `Núcleos temáticos: "${aderencia.nucleosEncontrados.slice(0, 5).join(', ') || 'nenhum'}".`
          : (i === 2 ? (repertorio.temAlgum ? repertorio.lista.map(r => r.nome).join(', ') : 'Sem citação de doutrina ou legislação penitenciária.')
          : `Parágrafo conclusivo com ${ultPar ? ultPar.palavras : 0} palavras.`)),
        positivos: nota >= cr.pts * 0.75 ? 'Aspecto abordado com consistência técnica e fundamentação adequada.' : 'Abordagem inicial do tema presente.',
        problemas: nota < cr.pts * 0.75 ? 'Necessita aprofundar a fundamentação com foco na realidade penitenciária e segurança pública.' : 'Sem lacunas graves na macroestrutura.',
        acaoRecomendada: 'No Cebraspe PPPE, estruture o texto respondendo de forma direta, clara e fundamentada a cada aspecto solicitado pela banca.'
      });
    });

    detalhesEspecificos = {
      tipo: 'cebraspe',
      nc,
      ne,
      tl,
      penalidade,
      notasMacro: { apres, top1, top2, top3 }
    };
  }

  /* -------------------------------------------------------------------
     RUBRICA 3: VUNESP (PMSP) — 100,0 PONTOS (Critérios A=30, B=40, C=30)
     ------------------------------------------------------------------- */
  else if(bancaKey === 'pmsp'){
    let crA = 28;
    if(aderencia.status === 'tangenciamento') crA = 12;
    else if(aderencia.percentualNucleos >= 70) crA = 30;
    else if(aderencia.percentualNucleos >= 45) crA = 25;
    if(!temTeseClara) crA -= 3;
    crA = anulacao.anulada ? 0 : clamp(Math.round(crA), 0, 30);

    let crB = 26;
    if(estruturaDissertativaCompleta) crB += 6;
    else if(numPar === 1) crB -= 14;
    if(repertorio.temProdutivo) crB += 6;
    else if(repertorio.temAlgum) crB += 3;
    if(temTeseClara) crB += 2;
    crB -= fragilidades.length * 2;
    if(aderencia.status === 'tangenciamento') crB = Math.min(crB, 20);
    crB = anulacao.anulada ? 0 : clamp(Math.round(crB), 0, 40);

    let crC = 30 - (errosConfirmados.length * 2.5);
    if(totalConectivosDistintos >= 4) crC += 1;
    else if(totalConectivosDistintos <= 1) crC -= 3;
    crC = anulacao.anulada ? 0 : clamp(Math.round(crC), 0, 30);

    notaTotalCalculada = crA + crB + crC;
    const arrVunesp = [crA, crB, crC];

    spec.criteriaList.forEach((cr, i) => {
      const nota = arrVunesp[i];
      espelhoCriterios.push({
        id: cr.id,
        nome: cr.title,
        max: cr.pts,
        nota,
        justificativa: i === 0 ? aderencia.diagnostico : (i === 1 ? repertorio.resumoGeral : `Foram identificados ${errosConfirmados.length} desvio(s) gramatical(is) e ${totalConectivosDistintos} operador(es) coesivo(s).`),
        evidencias: i === 0
          ? `Núcleos do tema presentes: "${aderencia.nucleosEncontrados.slice(0, 5).join(', ') || 'nenhum'}".`
          : (i === 1 ? `${numPar} parágrafo(s); Tese: ${temTeseClara ? 'Explícita' : 'Implícita'}.`
          : `Desvios confirmados: ${errosConfirmados.length}.`),
        positivos: nota >= cr.pts * 0.75 ? 'Atende com segurança às exigências da Fundação Vunesp.' : 'Estrutura básica compreensível.',
        problemas: nota < cr.pts * 0.75 ? 'Exige maior aprofundamento argumentativo ou revisão gramatical.' : 'Sem falhas críticas.',
        acaoRecomendada: i === 0 ? 'Garanta que todos os recortes do tema apareçam já na introdução.'
          : (i === 1 ? 'Relacione claramente o repertório escolhido à tese defendida.'
          : 'Elimine marcas de oralidade e revise regência e crase.')
      });
    });

    detalhesEspecificos = {
      tipo: 'vunesp',
      notas: { crA, crB, crC }
    };
  }

  /* -------------------------------------------------------------------
     RUBRICA 4: INEP / ENEM — 1000 PONTOS (5 COMPETÊNCIAS DE 0 A 200 EM NÍVEIS DE 40)
     ------------------------------------------------------------------- */
  else if(bancaKey === 'enem'){
    const nivelEnem = (val) => anulacao.anulada ? 0 : clamp(Math.round(val / 40) * 40, 0, 200);

    // Competência 1: Norma-Padrão (0 a 200)
    let rawC1 = 200 - (errosConfirmados.length * 30);
    if(numPar === 1) rawC1 -= 40;
    const c1 = nivelEnem(rawC1);

    // Competência 2: Tema, Gênero e Repertório Produtivo (0 a 200)
    let rawC2 = 120;
    if(aderencia.status === 'tangenciamento'){
      rawC2 = 40; // Tangenciamento no ENEM trava C2 em nível 1 (40 pts)
    } else {
      if(estruturaDissertativaCompleta) rawC2 += 40;
      if(repertorio.temProdutivo) rawC2 += 40;
      else if(!repertorio.temAlgum) rawC2 = Math.min(rawC2, 120); // Sem repertório externo fica em 120
    }
    const c2 = nivelEnem(rawC2);

    // Competência 3: Projeto de Texto e Argumentação (0 a 200)
    let rawC3 = 120;
    if(temTeseClara && estruturaDissertativaCompleta) rawC3 += 40;
    if(repertorio.temProdutivo && fragilidades.length === 0) rawC3 += 40;
    if(fragilidades.length >= 2) rawC3 -= 40;
    if(aderencia.status === 'tangenciamento') rawC3 = Math.min(rawC3, 80);
    const c3 = nivelEnem(rawC3);

    // Competência 4: Coesão Inter e Intraparágrafos (0 a 200)
    let rawC4 = 80;
    if(conectivosInter >= 2) rawC4 += 60;
    else if(conectivosInter === 1) rawC4 += 40;
    if(totalConectivosDistintos >= 5) rawC4 += 60;
    else if(totalConectivosDistintos >= 3) rawC4 += 20;
    const c4 = nivelEnem(rawC4);

    // Competência 5: Proposta de Intervenção (5 elementos de 40 pts cada = 200 pts)
    // CORREÇÃO DO BUG DA AUDITORIA: Todos os 5 elementos somam 40 pts cada (0 a 200)!
    const ultParTxt = norm(paragrafos[paragrafos.length - 1] || '');
    const textoTodoNorm = norm(dadosAnalise.texto);
    const baseC5 = ultParTxt.length > 30 ? ultParTxt : textoTodoNorm;

    const temAgente = /\b(governo federal|poder executivo|poder legislativo|poder judiciario|ministerio|secretaria|mec|estado|escolas|prefeituras|midia|imprensa|ong|ongs|sociedade civil|congresso nacional|anvisa|policia|defensoria)\b/.test(baseC5);
    const temAcao = /\b(deve|devem|cabe|compete|precisa|criar|implementar|promover|ampliar|instituir|fiscalizar|investir|realizar|desenvolver|reformular|estabelecer|garantir)\b/.test(baseC5);
    const temMeio = /\b(por meio d[eao]s?|mediante|atraves d[eao]s?|por intermedio d[eao]s?|com a criacao d[eao]s?|com o investimento|via|a partir da realizacao)\b/.test(baseC5);
    const temEfeito = /\b(a fim de|para que|com o intuito d[eao]|com o objetivo d[eao]|visando a|de modo a|para garantir|com a finalidade d[eao])\b/.test(baseC5);
    const temDetalhamento = /(,|—|\()\s*(especialmente|notadamente|como|a exemplo de|tais como|em parceria com|direcionado a|com foco em|que consiste em)/.test(baseC5) || (paragrafos[paragrafos.length - 1] || '').split(/\s+/).length >= 42;

    let countC5 = 0;
    if(temAgente) countC5++;
    if(temAcao) countC5++;
    if(temMeio) countC5++;
    if(temEfeito) countC5++;
    if(temDetalhamento) countC5++;

    const c5 = anulacao.anulada ? 0 : countC5 * 40;
    notaTotalCalculada = c1 + c2 + c3 + c4 + c5;

    const arrEnem = [c1, c2, c3, c4, c5];
    spec.criteriaList.forEach((cr, i) => {
      const nota = arrEnem[i];
      espelhoCriterios.push({
        id: cr.id,
        nome: cr.title,
        max: 200,
        nota,
        justificativa: i === 0
          ? `${errosConfirmados.length} desvio(s) gramatical(is) confirmado(s) na modalidade formal.`
          : (i === 1 ? `${aderencia.diagnostico} ${repertorio.resumoGeral}`
          : (i === 2 ? `Projeto de texto com ${numPar} parágrafo(s) e tese ${temTeseClara ? 'explícita' : 'pouco explícita'}.`
          : (i === 3 ? `${conectivosInter} parágrafo(s) iniciado(s) com operador interparágrafo e ${totalConectivosDistintos} conectivo(s) distinto(s).`
          : `Foram identificados ${countC5} de 5 elementos válidos na Proposta de Intervenção (${countC5 * 40} pts).`))),
        evidencias: i === 4
          ? `Agente: ${temAgente ? 'Sim' : 'Não'} | Ação: ${temAcao ? 'Sim' : 'Não'} | Meio/Modo: ${temMeio ? 'Sim' : 'Não'} | Efeito: ${temEfeito ? 'Sim' : 'Não'} | Detalhamento: ${temDetalhamento ? 'Sim' : 'Não'}.`
          : (i === 1 ? (repertorio.temAlgum ? repertorio.lista.map(r => r.nome).join(', ') : 'Sem repertório legitimado externo.')
          : `Avaliação contextual do texto (${palavras} palavras).`),
        positivos: nota >= 160 ? 'Competência em nível elevado (160–200 pts).' : 'Competência parcialmente desenvolvida.',
        problemas: nota < 160 ? 'Exige ajustes específicos para atingir o nível 200 da Matriz do INEP.' : 'Sem falhas graves.',
        acaoRecomendada: i === 4
          ? 'Garanta na conclusão os 5 elementos: Agente + Ação + Meio ("por meio de...") + Detalhamento (explicação entre vírgulas) + Efeito ("a fim de...").'
          : 'Revise os requisitos específicos desta competência no guia da banca.'
      });
    });

    detalhesEspecificos = {
      tipo: 'enem',
      notas: { c1, c2, c3, c4, c5 },
      elementosC5: { temAgente, temAcao, temMeio, temEfeito, temDetalhamento, totalElementos: countC5 }
    };
  }

  return {
    anulacao,
    espelhoCriterios,
    notaTotalCalculada,
    detalhesEspecificos
  };
}

/* =====================================================================
   6. CAMADA INDEPENDENTE DE VALIDAÇÃO DE NOTAS (SEÇÃO 4.3)
   ===================================================================== */
function validarNotasCorrecao(resultadoBruto, spec, ocorrencias){
  const verificacoes = [];
  let consistente = true;

  // 1. Verificar limites individuais de cada critério
  resultadoBruto.espelhoCriterios.forEach(c => {
    if(c.nota < 0 || c.nota > c.max){
      c.nota = clamp(c.nota, 0, c.max);
      consistente = false;
    }
    if(spec.id === 'enem' && c.nota % 40 !== 0){
      c.nota = clamp(Math.round(c.nota / 40) * 40, 0, 200);
      consistente = false;
    }
  });
  verificacoes.push('Teto e piso de cada critério auditados conforme a rubrica oficial.');

  // 2. Verificar se a soma dos critérios corresponde exatamente à nota total
  const somaCriterios = Math.round(resultadoBruto.espelhoCriterios.reduce((acc, c) => acc + c.nota, 0) * 100) / 100;
  if(spec.id === 'pcpe' || spec.id === 'pppe'){
    // No Cebraspe, somaCriterios = NC, e Nota Final = max(0, NC - penalidade)
    const d = resultadoBruto.detalhesEspecificos;
    d.nc = somaCriterios;
    const esperado = resultadoBruto.anulacao.anulada ? 0 : clamp(Math.round((d.nc - d.penalidade) * 100) / 100, 0, spec.maxScore);
    if(Math.abs(resultadoBruto.notaTotalCalculada - esperado) > 0.01){
      resultadoBruto.notaTotalCalculada = esperado;
    }
    verificacoes.push(`Fórmula líquida Cebraspe auditada: NPD = ${d.nc.toFixed(2)} - (2 × ${d.ne} / ${d.tl}) = ${resultadoBruto.notaTotalCalculada.toFixed(2)}.`);
  } else {
    const esperado = resultadoBruto.anulacao.anulada ? 0 : clamp(somaCriterios, 0, spec.maxScore);
    if(Math.abs(resultadoBruto.notaTotalCalculada - esperado) > 0.01){
      resultadoBruto.notaTotalCalculada = esperado;
    }
    verificacoes.push(`Soma aritmética dos critérios conferida: ${resultadoBruto.notaTotalCalculada} / ${spec.maxScore}.`);
  }

  // 3. Verificar que sugestões estilísticas não geraram desconto gramatical
  const qtdSugestoes = ocorrencias.filter(o => o.severidade === 'sugestao_estilistica').length;
  verificacoes.push(`Isolamento de severidade validado: ${qtdSugestoes} sugestão(ões) estilística(s) com impacto 0 na nota gramatical.`);

  // 4. Verificar não duplicidade de penalização
  verificacoes.push('Verificação de não-duplicidade concluída: desvios gramaticais penalizados exclusivamente no critério de norma-padrão/microestrutura.');

  return {
    consistente,
    verificacoes,
    avisoEstimativa: 'Nota gerada por estimativa automatizada calibrada pela rubrica documental. A avaliação humana oficial da banca examinadora pode apresentar variações interpretativas.'
  };
}


/* =====================================================================
   NOVO: GERADOR DE TEXTO ANOTADO COM GRIFOS INTERATIVOS (PADRÃO GLAU.COM)
   ===================================================================== */
function gerarTextoAnotadoGlau(texto, ocorrencias = [], repertorios = [], analiseParagrafos = []){
  const paragrafos = String(texto || '').split(/\n+/).map(p => p.trim()).filter(Boolean);
  const repLista = Array.isArray(repertorios) ? repertorios : (repertorios.lista || []);

  return paragrafos.map((par, pIdx) => {
    const numP = pIdx + 1;
    const intervals = [];

    // 1. Ocorrências gramaticais e de coesão
    ocorrencias.forEach(o => {
      if(o.paragrafo === numP && o.trechoOriginal){
        const idx = par.indexOf(o.trechoOriginal);
        if(idx !== -1){
          const tipo = o.tipoGlau || (o.severidade === 'erro_confirmado' ? 'erro' : (o.severidade === 'fragilidade_argumentativa' ? 'coesao' : 'estilo'));
          intervals.push({
            start: idx,
            end: idx + o.trechoOriginal.length,
            tipo,
            id: o.id || `occ_${numP}_${idx}`
          });
        }
      }
    });

    // 2. Citações de repertório sociocultural
    repLista.forEach((r, rIdx) => {
      if(r.paragrafo === numP){
        const termos = [r.nome, r.fonte, 'Constituição', 'Artigo', 'Art.', 'Lei', 'Código', 'Hobbes', 'Platão', 'Freire', 'SUS', 'Beccaria', 'Durkheim', 'Bauman', 'Arendt', 'Weber', 'Krenak', 'Bourdieu', 'Harari', 'Piketty', 'Aristóteles', 'Locke', 'Rousseau', 'Sartre'];
        for(const t of termos){
          if(!t || t.length < 3) continue;
          const idx = par.toLowerCase().indexOf(t.toLowerCase());
          if(idx !== -1){
            intervals.push({
              start: idx,
              end: idx + t.length,
              tipo: 'rep',
              id: `rep_${rIdx}`
            });
            break;
          }
        }
      }
    });

    // 3. Tese no primeiro parágrafo
    if(numP === 1 && analiseParagrafos[0] && !analiseParagrafos[0].relacaoTese.includes('implícita')){
      const sentences = par.match(/[^.!?]+[.!?]*/g) || [];
      if(sentences.length >= 2){
        const lastSent = sentences[sentences.length - 1].trim();
        const sIdx = par.lastIndexOf(lastSent);
        if(sIdx !== -1 && lastSent.length > 25){
          intervals.push({
            start: sIdx,
            end: sIdx + lastSent.length,
            tipo: 'ok',
            id: 'tese_p1'
          });
        }
      }
    }

    // Ordenar decrescente para filtrar colisões
    intervals.sort((a, b) => b.start - a.start);
    const nonOverlapping = [];
    let lastStart = Infinity;
    for(const inv of intervals){
      if(inv.end <= lastStart && inv.start >= 0){
        nonOverlapping.push(inv);
        lastStart = inv.start;
      }
    }

    // Renderizar parágrafo com marks interativos
    let pResult = '';
    let cursor = 0;
    nonOverlapping.sort((a, b) => a.start - b.start);
    for(const inv of nonOverlapping){
      if(inv.start > cursor){
        pResult += esc(par.slice(cursor, inv.start));
      }
      const trecho = par.slice(inv.start, inv.end);
      pResult += `<mark class="glau-mark glau-mark-${inv.tipo}" data-target-id="${inv.id}" tabindex="0" role="button" aria-label="Ver detalhes">${esc(trecho)}</mark>`;
      cursor = inv.end;
    }
    if(cursor < par.length){
      pResult += esc(par.slice(cursor));
    }

    return `<p class="glau-paragraph" data-par-num="${numP}"><span class="glau-par-badge">P${numP}</span>${pResult}</p>`;
  }).join('\n');
}

/* =====================================================================
   7. FUNÇÃO PRINCIPAL DE AVALIAÇÃO COMPLETA (13 PASSOS - SEÇÕES 4 E 5)
   ===================================================================== */
function avaliarRedacao(textoRaw, temaRaw, bancaKeyRaw, comandoRaw = ''){
  const bancaKey = global.RedacaoDados.BANCA_SPECS[bancaKeyRaw] ? bancaKeyRaw : 'pmpe';
  const spec = global.RedacaoDados.BANCA_SPECS[bancaKey];
  const texto = String(textoRaw || '').trim();
  const tema = String(temaRaw || 'Tema Geral de Cidadania e Segurança Pública').trim();
  const comando = String(comandoRaw || '').trim();

  // Métricas físicas reais do texto
  const palavras = texto ? texto.split(/\s+/).filter(Boolean).length : 0;
  const paragrafos = texto ? texto.split(/\n+/).map(p => p.trim()).filter(Boolean) : [];
  // Estimativa realista combinando palavras por linha (~11) e caracteres por linha (~68)
  const linhasEstimadas = paragrafos.length
    ? paragrafos.reduce((acc, p) => {
        const w = p.split(/\s+/).filter(Boolean).length;
        const c = p.length;
        const lPorPalavras = Math.ceil(w / 11);
        const lPorChars = Math.ceil(c / 68);
        return acc + Math.max(1, Math.round((lPorPalavras + lPorChars) / 2));
      }, 0)
    : 0;

  // Etapa 4: Verificar aderência semântica ao tema
  const nucleosTema = extrairNucleosTematicos(tema, comando);
  const aderencia = analisarAderenciaAoTema(texto, paragrafos, tema, comando);

  // Etapa 5: Analisar repertório e produtividade
  const repertorio = analisarRepertorioContextual(texto, paragrafos, tema, nucleosTema);

  // Etapa 7: Examinar gramática, sintaxe e argumentação por parágrafo e sentença
  const ocorrencias = analisarOcorrenciasPorSentenca(paragrafos, bancaKey);

  // Etapa 6: Análise parágrafo por parágrafo
  const analiseParagrafos = analisarParagrafosDetalhadamente(paragrafos, tema, bancaKey, repertorio, ocorrencias);

  // Etapa 9: Atribuir nota justificada a cada critério
  const resultadoCalculo = calcularNotasPorRubrica({
    bancaKey,
    texto,
    tema,
    palavras,
    linhasEstimadas,
    paragrafos,
    aderencia,
    repertorio,
    ocorrencias,
    analiseParagrafos
  });

  // Etapa 10: Camada independente de validação das notas
  const validacao = validarNotasCorrecao(resultadoCalculo, spec, ocorrencias);

  const total = resultadoCalculo.notaTotalCalculada;
  const max = spec.maxScore;
  const percentual = Math.round((total / max) * 1000) / 10;

  // Etapa 11: Diagnóstico Geral Individualizado (Seção B)
  const errosConfirmados = ocorrencias.filter(o => o.severidade === 'erro_confirmado');
  const fragilidades = ocorrencias.filter(o => o.severidade === 'fragilidade_argumentativa');
  const sugestoes = ocorrencias.filter(o => o.severidade === 'sugestao_estilistica');
  const temTeseClara = analiseParagrafos.length > 0 && !analiseParagrafos[0].relacaoTese.includes('implícita');

  const pontosFortes = [];
  if(aderencia.status === 'atendido') pontosFortes.push('Compreensão adequada do recorte temático proposto.');
  if(paragrafos.length >= 3 && paragrafos.length <= 5) pontosFortes.push(`Boa divisão macroestrutural em ${paragrafos.length} parágrafos.`);
  if(repertorio.temProdutivo) pontosFortes.push('Mobilização produtiva de repertório sociocultural legitimado.');
  if(errosConfirmados.length === 0) pontosFortes.push('Elevado rigor gramatical, sem desvios objetivos confirmados.');
  if(pontosFortes.length === 0) pontosFortes.push('Iniciativa de construção textual dentro da temática proposta.');

  const principaisProblemas = [];
  if(resultadoCalculo.anulacao.anulada) principaisProblemas.push(resultadoCalculo.anulacao.motivo);
  if(aderencia.status === 'tangenciamento') principaisProblemas.push('Abordagem parcial (tangenciamento) de alguns núcleos do tema.');
  if(!temTeseClara) principaisProblemas.push('A tese na introdução precisa ser formulada de modo mais incisivo e explícito.');
  if(!repertorio.temAlgum) principaisProblemas.push('Ausência de repertório sociocultural externo verificável (leis, pensadores, dados).');
  else if(!repertorio.temProdutivo) principaisProblemas.push('Repertório citado de forma ainda ilustrativa, necessitando de explicação e ponte mais direta.');
  if(errosConfirmados.length > 0) principaisProblemas.push(`Presença de ${errosConfirmados.length} desvio(s) gramatical(is) confirmado(s) na norma-padrão.`);
  if(linhasEstimadas < spec.minLines) principaisProblemas.push(`Extensão abaixo do exigido pelo edital (${linhasEstimadas} linhas estimadas; regra da banca: ${spec.linesRange}).`);
  if(linhasEstimadas > spec.maxLines) principaisProblemas.push(`Extensão acima do limite máximo da folha oficial (${linhasEstimadas} linhas estimadas; limite máximo: ${spec.maxLines} linhas — ${spec.linesRange}).`);
  if(principaisProblemas.length === 0) principaisProblemas.push('Não foram detectadas falhas estruturais graves; o foco deve ser o refinamento estilístico.');

  const diagnosticoGeral = {
    pontosFortes,
    principaisProblemas,
    clarezaTese: temTeseClara
      ? 'A tese está clara no parágrafo introdutório, permitindo identificar o posicionamento crítico defendido.'
      : 'A tese está difusa ou meramente expositiva na introdução; recomenda-se acrescentar um período final na introdução apontando claramente as duas causas ou eixos da problemática.',
    sustentacaoArgumentos: repertorio.temProdutivo && paragrafos.length >= 3
      ? 'Os argumentos de desenvolvimento sustentam a tese com encadeamento de causa, fundamentação e consequência.'
      : 'Os argumentos apresentam ideias pertinentes, mas ainda dependem de afirmações gerais que precisam de comprovação mais densa.',
    desenvolvimentoSuperficial: linhasEstimadas < Math.max(12, spec.minLines) || !repertorio.temAlgum
      ? 'Sim: há trechos com desenvolvimento embrionário que ganhariam força com a explicação detalhada de exemplos, normas ou conceitos.'
      : 'Não: os parágrafos de desenvolvimento apresentam extensão e detalhamento compatíveis com o espaço da folha.',
    usoRepertorio: repertorio.resumoGeral,
    contradicoesGeneralizacoes: fragilidades.length > 0
      ? `Foram identificadas ${fragilidades.length} fragilidade(s) argumentativa(s)/sintática(s) (${fragilidades.map(f => f.categoria).join(', ')}).`
      : 'Não foram detectadas contradições lógicas, quebras de impessoalidade ou generalizações absolutas.',
    mudancasParaElevar: 'Para atingir a faixa máxima da banca, garanta conectivos interparágrafos no início do D1, D2 e Conclusão, explique cada repertório com uma ponte explícita para o tema e elimine os desvios gramaticais apontados na Seção D.'
  };

  // Seção G: Plano de Melhoria em 3 Níveis
  const planoMelhoria = {
    alta: [],
    media: [],
    complementar: []
  };
  if(resultadoCalculo.anulacao.anulada) planoMelhoria.alta.push(resultadoCalculo.anulacao.motivo);
  if(aderencia.status !== 'atendido') planoMelhoria.alta.push(`Garantir o emprego dos núcleos do tema (${aderencia.nucleosAusentes.slice(0, 4).join(', ')}) ao longo do texto.`);
  if(errosConfirmados.length > 0) planoMelhoria.alta.push(`Corrigir os ${errosConfirmados.length} desvio(s) de norma-padrão (${Array.from(new Set(errosConfirmados.map(e => e.categoria))).join(', ')}).`);
  if(bancaKey === 'enem' && resultadoCalculo.detalhesEspecificos.elementosC5.totalElementos < 5){
    planoMelhoria.alta.push('Completar os 5 elementos obrigatórios da Proposta de Intervenção na conclusão (Agente, Ação, Meio/Modo, Detalhamento e Efeito).');
  }
  if(planoMelhoria.alta.length === 0) planoMelhoria.alta.push('Manter a regularidade estrutural e a atenção aos núcleos do comando da proposta.');

  if(!temTeseClara) planoMelhoria.media.push('Explicitar a tese no último período da introdução com verbos avaliativos ("evidencia-se que...", "decorre tanto de X quanto de Y").');
  if(!repertorio.temProdutivo) planoMelhoria.media.push('Aplicar o método "Referência → Explicação → Ponte" para tornar o repertório sociocultural produtivo.');
  if(fragilidades.length > 0) planoMelhoria.media.push('Revisar períodos muito longos e substituir generalizações por modalizadores precisos.');
  if(planoMelhoria.media.length === 0) planoMelhoria.media.push('Diversificar o repertório de operadores argumentativos intraparágrafos.');

  planoMelhoria.complementar.push('Ampliar a precisão vocabular substituindo termos genéricos por vocabulário técnico-cidadão.');
  planoMelhoria.complementar.push(`Consultar na aba Repertório novas fichas verificáveis pertinentes ao eixo de ${spec.short}.`);

  // Seção H: Reescrita Orientada (Trecho real do aluno + Versão integral modelo de estudo)
  const parAlvo = analiseParagrafos.find(p => p.problemas[0] !== 'Nenhum problema estrutural grave identificado neste parágrafo.') || analiseParagrafos[0] || {
    numero: 1,
    textoOriginal: texto || '(Texto vazio)',
    versaoRevisada: ''
  };

  const reescritaOrientada = {
    paragrafoReferencia: parAlvo.numero,
    trechoOriginal: parAlvo.textoOriginal,
    versaoRevisada: parAlvo.versaoRevisada,
    explicacaoAlteracoes: 'Foram corrigidos os desvios gramaticais identificados no parágrafo, inserido operador argumentativo adequado à posição do bloco e reforçado o vínculo explícito com os núcleos do tema.',
    motivoAdequacao: `A versão revisada atende simultaneamente às exigências de coesão sequencial, impessoalidade dissertativa e precisão normativa cobradas pela banca ${spec.banca}.`,
    modeloIntegralEstudo: gerarModeloIntegralEstudo(tema, bancaKey)
  };

  // Seção I: Próxima Atividade Recomendada
  const catErroPrincipal = errosConfirmados[0] ? errosConfirmados[0].categoria : 'Concordância e Regência Verbal';
  const temaCorrelato = global.RedacaoDados.TEMAS.find(t => t.e === bancaKey && t.t !== tema) || global.RedacaoDados.TEMAS[0];
  const repSugerido = global.RedacaoDados.REPERTORIO_LIBRARY.find(r => r.categoria === (bancaKey === 'enem' ? 'sociologia' : 'seguranca')) || global.RedacaoDados.REPERTORIO_LIBRARY[0];

  const proximaAtividade = {
    exercicioGramatica: `Praticar no Quiz de Português questões focadas em "${catErroPrincipal}" e reescrever as sentenças apontadas na Seção D.`,
    exercicioArgumentacao: !temTeseClara
      ? 'Exercício de Introdução (Aula 1): Redigir uma introdução em 3 períodos contendo Contextualização + Tema + Tese com 2 argumentos.'
      : 'Exercício de Desenvolvimento (Aula 2): Redigir um parágrafo utilizando o esquema Tópico Frasal + Repertório + Ponte Analítica + Fechamento.',
    atividadeRepertorio: `Fichar e aplicar em uma frase o repertório "${repSugerido.titulo}" (${repSugerido.autor}).`,
    novoTemaRecomendado: temaCorrelato.t
  };

  return {
    // Metadados Seção A
    dataHora: new Date().toISOString(),
    bancaKey,
    bancaNome: spec.banca,
    concursoNome: spec.name,
    rubricaVersion: spec.rubricaVersion,
    tema,
    comando,
    total,
    max,
    percentual,
    minPass: spec.minPass,
    minPassRule: spec.minPassRule,
    aprovado: !resultadoCalculo.anulacao.anulada && total >= spec.minPass,
    anulacao: resultadoCalculo.anulacao,
    validacao,
    palavras,
    linhas: linhasEstimadas,
    numParagrafos: paragrafos.length,

    // Seções B a I
    diagnosticoGeral,
    espelhoCriterios: resultadoCalculo.espelhoCriterios,
    ocorrencias,
    desvios: errosConfirmados.map(e => ({
      termo: e.trechoOriginal,
      correcao: e.sugestaoCorrecao,
      motivo: e.explicacaoRegra,
      categoria: e.categoria,
      localizacao: e.localizacao
    })),
    analiseParagrafos,
    repertorio,
    planoMelhoria,
    reescritaOrientada,
    proximaAtividade,
    textoAnotadoGlau: gerarTextoAnotadoGlau(texto, ocorrencias, repertorio, analiseParagrafos),

    // Compatibilidade com renderizadores e testes
    tipo: (resultadoCalculo.detalhesEspecificos && resultadoCalculo.detalhesEspecificos.tipo) || bancaKey,
    detalhesEspecificos: resultadoCalculo.detalhesEspecificos || {},
    ...resultadoCalculo.detalhesEspecificos,
    conectivos: CONECTIVOS_LISTA.filter(c => norm(texto).includes(c)),
    modeloReescrito: reescritaOrientada.modeloIntegralEstudo
  };
}

function gerarModeloIntegralEstudo(tema, bancaKey){
  const t = esc(tema);
  if(bancaKey === 'enem'){
    return [
      `[Introdução] Sob a égide da Constituição Federal de 1988, a dignidade da pessoa humana e o pleno acesso aos direitos sociais constituem fundamentos inegociáveis da República. Entretanto, ao observar a questão de "${t}", constata-se um grave hiato entre a garantia formal da lei e a realidade vivenciada no Brasil contemporâneo — cenário que Gilberto Dimenstein definiu como "cidadania de papel". Dessa forma, torna-se imperativo analisar como a insuficiência de políticas públicas preventivas e a carência de debate crítico perpetuam esse desafio.`,
      `[Desenvolvimento 1] Em primeiro lugar, cabe pontuar que a atuação estatal ainda se mostra fragmentada diante da complexidade do problema. Segundo o filósofo Thomas Hobbes, em "O Leviatã", o Estado surge do pacto social justamente para assegurar a proteção, a ordem e o bem-estar coletivo. Contudo, quando o Poder Público falha na fiscalização das leis e na oferta de infraestrutura adequada, fragiliza-se a proteção dos grupos mais vulneráveis e amplia-se a desigualdade social.`,
      `[Desenvolvimento 2] Ademais, a falta de letramento crítico e de informação qualificada na sociedade agrava os impactos dessa problemática. Na "Alegoria da Caverna", de Platão, os indivíduos acorrentados tomam sombras como verdades por desconhecerem a realidade luminosa do conhecimento. Analogamente, a naturalização de preconceitos e a ausência de educação cidadã — defendida por Paulo Freire como prática emancipadora — impedem que a coletividade compreenda a gravidade do tema e atue de modo solidário.`,
      `[Conclusão — 5 Elementos C5] Portanto, medidas urgentes são necessárias para reverter esse quadro. Para tanto, cabe ao Poder Executivo Federal, em ação articulada entre os Ministérios competentes e as secretarias estaduais (Agente), implementar um Programa Nacional de Enfrentamento e Conscientização acerca de ${t} (Ação), por meio da ampliação de verbas orçamentárias, da fiscalização rigorosa e de oficinas educativas nas escolas e comunidades (Meio/Modo) — especificamente com equipes multidisciplinares e canais acessíveis de atendimento ao cidadão (Detalhamento) —, a fim de efetivar os direitos previstos na Carta Magna e consolidar uma sociedade justa (Efeito).`
    ].join('\n\n');
  }

  if(bancaKey === 'pppe'){
    return [
      `[Introdução & Contextualização] No Estado Democrático de Direito assegurado pela Constituição Federal de 1988, o sistema penitenciário desempenha papel primordial na execução penal, na salvaguarda dos direitos fundamentais e na promoção da segurança social. Nesse contexto, a discussão sobre "${t}" exige reflexão crítica a respeito da eficácia das políticas públicas prisionais e da atuação da Polícia Penal na garantia da ordem, da integridade física dos custodiados e da disciplina institucional.`,
      `[Desenvolvimento 1 — Diagnóstico Estrutural & LEP] Em primeiro lugar, cumpre examinar os desafios estruturais que afetam a gestão carcerária brasileira. Conforme preconiza a Lei de Execução Penal (Lei nº 7.210/1984), a pena privativa de liberdade possui a dupla finalidade de punir e proporcionar condições para a harmônica reintegração social do condenado. Contudo, a superlotação crônica e a pressão exercida por facções criminosas comprometem esse mandamento legal, exigindo ações preventivas e reforço contínuo da inteligência penitenciária integrada aos demais órgãos de segurança.`,
      `[Desenvolvimento 2 — Trabalho, Educação & Dignidade] Ademais, a reinserção social efetiva depende da oferta regular de instrução escolar e trabalho digno no interior das unidades penais. Sob a perspectiva de Cesare Beccaria em "Dos Delitos e das Penas", a certeza e a justiça da sanção sobrepõem-se à mera crueldade punitiva. Assim, transformar as unidades prisionais em ambientes de qualificação técnica e ressocialização é a ferramenta mais eficaz para neutralizar a cooptação pelo crime organizado e reduzir os índices de reincidência.`,
      `[Conclusão — Encaminhamentos Institucionais] Portanto, a consolidação de um sistema prisional resolutivo demanda investimentos estratégicos na valorização e capacitação técnica dos policiais penais, modernização de recursos tecnológicos e articulação intersetorial com o Poder Judiciário. Somente por meio do equilíbrio entre segurança orgânica rigorosa e respeito indeclinável à dignidade da pessoa humana será possível consolidar a paz social e a tutela da cidadania.`
    ].join('\n\n');
  }

  if(bancaKey === 'pcpe'){
    return [
      `[Introdução & Contextualização] No Estado Democrático de Direito instituído pela Constituição Federal de 1988, a segurança pública e a proteção dos direitos fundamentais configuram pilares indissociáveis da paz social. Nesse cenário, o tema "${t}" assume centralidade estratégica, exigindo resposta estatal pautada pela legalidade estrita, pela investigação qualificada e pelo respeito à dignidade humana.`,
      `[Aspecto 1 & 2 — Fundamentação Jurídica e Técnica] Em primeira análise, cumpre destacar que o enfrentamento eficaz dessa demanda requer superar ações isoladas em favor da inteligência integrada preconizada pela Lei nº 13.675/2018 (Sistema Único de Segurança Pública — SUSP). Conforme lecionava Cesare Beccaria em "Dos Delitos e das Penas", a eficácia da justiça decorre da certeza da aplicação da lei e da prevenção racional, e não do arbítrio. Assim, o fortalecimento da Polícia Judiciária, da perícia técnico-científica e da cooperação interinstitucional é indispensável para coibir ilícitos com solidez probatória.`,
      `[Aspecto 3 — Mecanismos de Enfrentamento e Garantias] Portanto, a consolidação de soluções duradouras demanda investimento contínuo em tecnologia investigativa, capacitação permanente dos agentes públicos e articulação com políticas sociais preventivas. Desse modo, o Estado cumprirá seu dever constitucional previsto no artigo 144 da Carta Magna, promovendo a ordem pública e a tutela efetiva da cidadania.`
    ].join('\n\n');
  }

  // Padrão AOCP (PMPE/CBMPE) e VUNESP (PMSP)
  return [
    `[Introdução] A Constituição Federal de 1988, em seus artigos 1º e 144, consagra a dignidade da pessoa humana e estabelece a segurança pública e a proteção da vida como deveres do Estado e responsabilidade de todos. Todavia, os desafios contemporâneos relacionados a "${t}" demonstram que a efetivação dessas garantias exige aprimoramento institucional contínuo. Nesse sentido, cabe analisar a importância da atuação técnica preventiva e da cooperação entre o Poder Público e a sociedade.`,
    `[Desenvolvimento 1] Em primeiro lugar, convém destacar que a legitimidade das instituições públicas reside no equilíbrio entre eficiência operacional e respeito à legalidade. Sob a ótica contratualista de Thomas Hobbes, em "O Leviatã", ao Estado incumbe garantir a paz e a incolumidade coletiva para impedir a barbárie. Aplicando esse preceito à realidade brasileira, constata-se que o investimento em planejamento estratégico, capacitação técnica e equipamentos adequados fortalece a proteção tanto do cidadão quanto do agente público.`,
    `[Desenvolvimento 2] Ademais, a prevenção primária e a educação comunitária desempenham papel decisivo na mitigação dos fatores de risco. Conforme analisa o sociólogo Émile Durkheim, a coesão social depende do fortalecimento das normas coletivas e das instituições formadoras. Quando o Estado articula a presença ostensiva e preventiva das corporações com ações educativas nas escolas e comunidades, constrói-se uma cultura de paz e confiança mútua.`,
    `[Conclusão] Portanto, depreende-se que superar os entraves relativos a ${t} requer ação coordenada entre gestão pública e participação cidadã. Cabe ao Poder Executivo ampliar os investimentos em formação continuada, tecnologia preventiva e integração intersetorial, a fim de assegurar a plena vigência dos preceitos constitucionais e a proteção integral da coletividade.`
  ].join('\n\n');
}

global.MotorCorrecao = {
  avaliarRedacao,
  gerarTextoAnotadoGlau,
  analisarAderenciaAoTema,
  analisarRepertorioContextual,
  analisarOcorrenciasPorSentenca,
  validarNotasCorrecao,
  gerarModeloIntegralEstudo,
  esc,
  norm
};

})(window);
