// =============================================================
// Zeco e a Ilha das Gemas — História e capítulos
// =============================================================
const ZECO_LEVEL_NAMES = [
  'Costa dos Coqueiros','Trilha das Cascatas','Geleira Escorregadia','Penhascos Ventosos','Caverna da Meia-Noite',
  'Praia Encantada','Ruínas Perdidas','Vulcão em Fúria','Ilhas Flutuantes','Ápice da Ilha'
];

const ZECO_STORY = [
  {
    title: 'A Lenda das Gemas', chapter: 'Prólogo',
    text: 'Há muitas luas, dez Gemas Ancestrais mantinham a Ilha de Aruana em equilíbrio. Quando o Barão Sombra roubou os cristais e espalhou seus capangas pela ilha, rios secaram, ventos enlouqueceram e antigas ruínas despertaram. Zeco, um aventureiro teimoso de coração enorme, encontrou o último mapa dos guardiões e partiu para recuperar as gemas antes que a ilha desapareça no mar.'
  },
  {
    title: 'Costa dos Coqueiros', chapter: 'Capítulo 1',
    text: 'A trilha começa na costa. Entre caixas abandonadas e os primeiros capangas do Barão, Zeco descobre que cada portal reage às gemas recuperadas. O caminho para o coração da ilha está aberto.'
  },
  {
    title: 'Trilha das Cascatas', chapter: 'Capítulo 2',
    text: 'As marcas no mapa levam Zeco para dentro da mata. A presença do Barão Sombra é mais forte aqui, e as criaturas da ilha parecem ter sido corrompidas por uma energia escura.'
  },
  {
    title: 'Geleira Escorregadia', chapter: 'Capítulo 3',
    text: 'Um frio impossível cobre a montanha. O gelo não pertence àquela região. Zeco percebe que as gemas não foram apenas roubadas: estão sendo usadas para deformar a própria natureza.'
  },
  {
    title: 'Penhascos Ventosos', chapter: 'Capítulo 4',
    text: 'Rajadas violentas protegem os penhascos. No alto, Zeco encontra o símbolo do antigo clã dos Guardiões e uma mensagem: “Quando as dez luzes retornarem, a sombra terá um rosto.”'
  },
  {
    title: 'Caverna da Meia-Noite', chapter: 'Capítulo 5',
    text: 'A caverna guarda ecos de uma batalha antiga. Pelas paredes, Zeco descobre que o Barão Sombra já tentou dominar a ilha antes — e foi selado pelas mesmas gemas que agora procura destruir.'
  },
  {
    title: 'Praia Encantada', chapter: 'Capítulo 6',
    text: 'Ao sair da caverna, a praia brilha como se fosse noite e dia ao mesmo tempo. A magia está instável. Zeco encontra pegadas recentes: alguém está levando a última carga de cristais para o ápice da ilha.'
  },
  {
    title: 'Ruínas Perdidas', chapter: 'Capítulo 7',
    text: 'Nas ruínas, está a chave do mistério. O Barão não quer riqueza: ele pretende quebrar o selo ancestral e libertar uma força capaz de cobrir Aruana em escuridão permanente.'
  },
  {
    title: 'Vulcão em Fúria', chapter: 'Capítulo 8',
    text: 'O chão treme. O vulcão desperta conforme a energia das gemas é drenada. Cada passo de Zeco agora é uma corrida contra o tempo.'
  },
  {
    title: 'Ilhas Flutuantes', chapter: 'Capítulo 9',
    text: 'Acima das nuvens, fragmentos da ilha flutuam ao redor da torre do Barão. Zeco enxerga o destino final: o Ápice, onde a última gema alimenta o ritual.'
  },
  {
    title: 'Ápice da Ilha', chapter: 'Capítulo 10',
    text: 'A tempestade cerca o topo de Aruana. Zeco reúne tudo o que aprendeu e avança para o portal final. Se falhar, a ilha será consumida. Se vencer, as dez gemas voltarão a cantar.'
  },
  {
    title: 'O Coração de Aruana', chapter: 'Epílogo',
    text: 'Com as gemas reunidas, a luz atravessa a ilha. O gelo recua, o vulcão adormece e os ventos voltam a soprar suaves. O Barão Sombra desaparece no brilho do portal — mas, por um instante, uma risada distante ecoa entre as ruínas. Zeco guarda o mapa. A ilha foi salva... por enquanto.'
  }
];

function getStoryForLevel(levelIndex) {
  return ZECO_STORY[Math.min(levelIndex + 1, ZECO_STORY.length - 2)];
}


// NPCs que aparecem dentro das fases para contar a história sem tirar o jogador da ação.
const ZECO_NPCS = {
  0: {x:420, name:'Mestre Tupi', text:'Zeco! O Barão Sombra levou as Gemas Ancestrais. Use sua lâmina, atravesse os portais e não deixe a escuridão alcançar o coração de Aruana.'},
  4: {x:930, name:'Mestre Tupi', text:'As paredes desta caverna contam a verdade: o Barão já foi um guardião. Foi a ambição que o transformou em sombra.'},
  6: {x:760, name:'Lina, a Cartógrafa', text:'Encontrei a rota para o Ápice. As ilhas flutuantes são o último caminho. Mas cuidado: o Barão está esperando você.'},
  9: {x:Math.max(500, levels[9].portalX-820), name:'Mestre Tupi', text:'É aqui, Zeco. O portal está selado pelo próprio Barão. Derrote-o com sua lâmina e devolva as dez luzes à ilha!'}
};
