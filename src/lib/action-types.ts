export type ImpactDomain = "ecological" | "social" | "digital" | "individual";

export interface ActionType {
  id: string;
  domain: ImpactDomain;
  group: string;
  name: string;
  baseScore: number;
  tags: string[];
  description?: string;
  emoji?: string;
  isCommunity?: boolean;
}

export const ACTION_TYPES_SEED: ActionType[] = [
  // Ecological
  { id: 'horta_domestica', domain: 'ecological', group: 'Cultivo e Solo Vivo', name: 'Horta doméstica', baseScore: 20, tags: ['horta', 'cultivo', 'solo', 'alimento'], emoji: '🌱', description: 'Cultivo de alimentos em casa, promovendo autonomia alimentar.' },
  { id: 'horta_comunitaria', domain: 'ecological', group: 'Cultivo e Solo Vivo', name: 'Horta comunitária', baseScore: 30, tags: ['horta', 'comunidade', 'grupo', 'alimento'], emoji: '🧑‍🌾', description: 'Criação e manutenção de horta com participação de várias pessoas.' },
  { id: 'agrofloresta', domain: 'ecological', group: 'Cultivo e Solo Vivo', name: 'Agrofloresta', baseScore: 40, tags: ['agrofloresta', 'sintropia', 'biodiversidade'], emoji: '🌳', description: 'Sistema agroflorestal integrando árvores, alimentos e biodiversidade.' },
  { id: 'compostagem', domain: 'ecological', group: 'Cultivo e Solo Vivo', name: 'Compostagem doméstica', baseScore: 25, tags: ['composto', 'residuos', 'lixo organico', 'adubo'], emoji: '♻️', description: 'Reaproveitamento de resíduos orgânicos para produzir adubo.' },
  { id: 'plantio_isolado', domain: 'ecological', group: 'Restauração e Plantio', name: 'Plantio isolado de árvores (até 5)', baseScore: 15, tags: ['plantio', 'arvore', 'cidade'], emoji: '🌳', description: 'Ações de plantio individuais em áreas urbanas ou rurais.' },
  { id: 'mutirao_plantio', domain: 'ecological', group: 'Restauração e Plantio', name: 'Mutirão de plantio coletivo', baseScore: 35, tags: ['mutirao', 'coletivo', 'plantio', 'reflorestamento'], emoji: '🙌', description: 'Ação organizada de reflorestamento em grupo.' },
  { id: 'restauracao_mata_ciliar', domain: 'ecological', group: 'Restauração e Plantio', name: 'Restauração de mata ciliar', baseScore: 45, tags: ['rio', 'agua', 'mata', 'recomposicao'], emoji: '🏞️', description: 'Recuperação de áreas degradadas próximas a rios.' },
  { id: 'limpeza_area', domain: 'ecological', group: 'Água e Resíduos', name: 'Limpeza de rios, praias ou ruas', baseScore: 25, tags: ['limpeza', 'mutirao', 'lixo', 'residuos'], emoji: '🧹', description: 'Mutirões de coleta de resíduos.' },
  
  // Social
  { id: 'oficina_educativa', domain: 'social', group: 'Educação e Cultura', name: 'Oficina educativa', baseScore: 25, tags: ['educacao', 'oficina', 'aprendizado'], emoji: '🎓', description: 'Ensino de práticas regenerativas a grupos ou comunidades.' },
  { id: 'roda_conversa', domain: 'social', group: 'Educação e Cultura', name: 'Palestra ou roda de conversa', baseScore: 20, tags: ['conversa', 'dialogo', 'partilha'], emoji: '💬', description: 'Compartilhamento de conhecimento e experiências.' },
  { id: 'criacao_rede_local', domain: 'social', group: 'Conexão e Comunidade', name: 'Criação de grupo ou rede local', baseScore: 20, tags: ['rede', 'vizinhos', 'comunidade'], emoji: '🏘️', description: 'Rede de apoio entre vizinhos, famílias, ou grupos de interesse.' },
  { id: 'evento_comunitario', domain: 'social', group: 'Conexão e Comunidade', name: 'Organização de evento comunitário', baseScore: 30, tags: ['evento', 'festa', 'feira', 'festival'], emoji: '🎉', description: 'Encontros, feiras, festivais com propósito regenerativo.' },
  { id: 'doacao_bens', domain: 'social', group: 'Solidariedade', name: 'Doação de bens ou alimentos', baseScore: 20, tags: ['doacao', 'solidariedade', 'partilha'], emoji: '💝', description: 'Ações diretas de partilha de recursos materiais.' },

  // Digital
  { id: 'criacao_app_regen', domain: 'digital', group: 'Desenvolvimento e Software', name: 'Criação de app ou dApp regenerativo', baseScore: 50, tags: ['app', 'dapp', 'protocolo', 'software', 'codigo'], emoji: '🧠', description: 'Desenvolvimento de tecnologias regenerativas e abertas.' },
  { id: 'contribuicao_opensource', domain: 'digital', group: 'Desenvolvimento e Software', name: 'Contribuição em código aberto regenerativo', baseScore: 35, tags: ['github', 'opensource', 'codigo', 'dev'], emoji: '🧑‍💻', description: 'Participação em projetos de impacto com código, design ou docs.' },
  { id: 'conteudo_educativo', domain: 'digital', group: 'Conteúdo e Comunicação', name: 'Produção de conteúdo (vídeo, blog, podcast)', baseScore: 25, tags: ['conteudo', 'video', 'blog', 'podcast', 'artigo'], emoji: '📝', description: 'Comunicação e disseminação de ideias regenerativas.' },
  { id: 'documentacao_aberta', domain: 'digital', group: 'Infraestrutura e Dados', name: 'Documentação técnica aberta', baseScore: 30, tags: ['docs', 'tutorial', 'guia', 'manual'], emoji: '📚', description: 'Criação de guias, manuais e dados públicos para o ecossistema.' },

  // Individual
  { id: 'meditacao_regular', domain: 'individual', group: 'Autocuidado e Presença', name: 'Meditação diária', baseScore: 10, tags: ['meditar', 'presenca', 'mindfulness', 'bem-estar'], emoji: '🧘‍♀️', description: 'Prática regular de atenção e equilíbrio interior.' },
  { id: 'terapia_pessoal', domain: 'individual', group: 'Autocuidado e Presença', name: 'Terapia pessoal', baseScore: 10, tags: ['terapia', 'autoconhecimento', 'cura'], emoji: '❤️‍🩹', description: 'Processos de autoconhecimento e cura emocional.' },
  { id: 'leitura_regenerativa', domain: 'individual', group: 'Desenvolvimento Interior', name: 'Leitura de livro sobre regeneração', baseScore: 5, tags: ['livro', 'estudo', 'leitura'], emoji: '📖', description: 'Estudo e reflexão pessoal sobre temas regenerativos.' },
  { id: 'diario_introspeccao', domain: 'individual', group: 'Desenvolvimento Interior', name: 'Escrita de diário regenerativo', baseScore: 5, tags: ['diario', 'escrita', 'reflexao'], emoji: '✍️', description: 'Auto-observação e registro de insights pessoais.' }
];
