// Seed com dados reais do Acampamento SV
// Execute via: import e chame seedAcampamentoSV(supabase) após login
import { calcSeveridade } from './calculations'

export async function seedAcampamentoSV(supabase) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Faça login antes de executar o seed')

  const ownerId = user.id
  const log = (msg) => console.log('[SEED]', msg)

  // 1. Criar evento
  log('Criando evento...')
  const { data: evento, error: eErr } = await supabase.from('eventos').insert({
    owner_id: ownerId,
    nome: 'Acampamento SV',
    objetivo: 'Comunhão, lazer e descanso',
    data_inicio: '2025-07-03',
    data_fim: '2025-07-04',
    publico_alvo: 'Jovens',
    participantes_estimados: 22,
    litros_agua_pessoa_dia: 4,
    folga_alimentacao_pct: 10,
    observacoes: 'Acampamento anual da juventude SV'
  }).select().single()
  if (eErr) throw eErr
  const eventoId = evento.id
  log('Evento criado: ' + eventoId)

  // 2. Local
  log('Criando local...')
  await supabase.from('locais').insert({
    owner_id: ownerId,
    evento_id: eventoId,
    nome_local: 'Rancho Brisas do Araguaia',
    endereco: 'Caseara - TO',
    distancia_km: 189,
    tem_banheiro: true,
    qtd_banheiros: 1,
    tem_cozinha: true,
    tem_energia: true,
    fonte_energia: 'Gerador',
    tem_agua_potavel: false,
    tem_estacionamento: false,
    pontos_de_risco: 'Rio (risco de afogamento), animais peçonhentos, mosquitos. Acesso por travessia de barco.',
    unidade_saude_proxima: null, // campo faltando → alerta
    custo_diaria: 500,
    observacoes: 'Acesso por travessia de barco pelo Rio Araguaia. 189 km de Paraíso do Tocantins.'
  })

  // 3. Hospedagem
  log('Criando hospedagem...')
  await supabase.from('hospedagem').insert({
    owner_id: ownerId,
    evento_id: eventoId,
    modelo: 'Barracas próprias',
    barracas_disponiveis: 0,
    observacoes: 'Cada participante leva barraca, colchonete, saco de dormir e cobertor'
  })

  // 4. Pessoas (22 total: 20 jovens + 2 organizadoras)
  log('Criando pessoas...')
  const pessoasData = [
    { nome: 'Isabela', papel: 'organizador', leva_barraca: true },
    { nome: 'Jéssica', papel: 'organizador', leva_barraca: true },
    { nome: 'Ana Clara', papel: 'participante', leva_barraca: true },
    { nome: 'Beatriz', papel: 'participante', leva_barraca: true },
    { nome: 'Carlos', papel: 'participante', leva_barraca: true },
    { nome: 'Daniel', papel: 'participante', leva_barraca: true },
    { nome: 'Eduardo', papel: 'participante', leva_barraca: true },
    { nome: 'Fernanda', papel: 'participante', leva_barraca: true },
    { nome: 'Gabriel', papel: 'participante', leva_barraca: true },
    { nome: 'Helena', papel: 'participante', leva_barraca: true },
    { nome: 'Igor', papel: 'participante', leva_barraca: true },
    { nome: 'Juliana', papel: 'participante', leva_barraca: true, restricoes_alimentares: 'Vegetariana' },
    { nome: 'Kauan', papel: 'participante', leva_barraca: true },
    { nome: 'Laura', papel: 'participante', leva_barraca: true },
    { nome: 'Marcos', papel: 'participante', leva_barraca: true },
    { nome: 'Natália', papel: 'participante', leva_barraca: true },
    { nome: 'Otávio', papel: 'participante', leva_barraca: true },
    { nome: 'Paula', papel: 'participante', leva_barraca: true },
    { nome: 'Rafael', papel: 'participante', leva_barraca: true },
    { nome: 'Sofia', papel: 'participante', leva_barraca: true },
    { nome: 'Thiago', papel: 'participante', leva_barraca: true },
    { nome: 'Valentina', papel: 'participante', leva_barraca: true }
  ]
  const { data: pessoas } = await supabase.from('pessoas').insert(pessoasData.map(p => ({ ...p, evento_id: eventoId, owner_id: ownerId }))).select()
  const isabela = pessoas.find(p => p.nome === 'Isabela')
  const jessica = pessoas.find(p => p.nome === 'Jéssica')

  // 5. Equipes
  log('Criando equipes...')
  const { data: eqCoord } = await supabase.from('equipes').insert({ owner_id: ownerId, evento_id: eventoId, nome: 'Coordenação', descricao: 'Coordenação geral do evento' }).select().single()
  const { data: eqLog } = await supabase.from('equipes').insert({ owner_id: ownerId, evento_id: eventoId, nome: 'Logística e Transporte', descricao: 'Responsável pelo transporte e logística' }).select().single()
  const { data: eqAlim } = await supabase.from('equipes').insert({ owner_id: ownerId, evento_id: eventoId, nome: 'Alimentação', descricao: 'Preparação e organização das refeições' }).select().single()
  const { data: eqSeg } = await supabase.from('equipes').insert({ owner_id: ownerId, evento_id: eventoId, nome: 'Segurança', descricao: 'Monitoramento do rio e segurança do acampamento' }).select().single()
  const { data: eqLimp } = await supabase.from('equipes').insert({ owner_id: ownerId, evento_id: eventoId, nome: 'Limpeza', descricao: 'Organização e limpeza do espaço' }).select().single()

  // Membros das equipes
  if (isabela && jessica) {
    await supabase.from('equipe_membros').insert([
      { equipe_id: eqCoord.id, pessoa_id: isabela.id, owner_id: ownerId, responsabilidade: 'Coordenação geral' },
      { equipe_id: eqCoord.id, pessoa_id: jessica.id, owner_id: ownerId, responsabilidade: 'Coordenação geral' },
      { equipe_id: eqLog.id, pessoa_id: jessica.id, owner_id: ownerId, responsabilidade: 'Logística e transporte' }
    ])
  }

  // 6. Transporte
  log('Criando transporte...')
  await supabase.from('transporte').insert([
    {
      owner_id: ownerId, evento_id: eventoId,
      tipo: 'carro', identificacao: 'Carros próprios dos participantes',
      capacidade_pessoas: 20, motorista_piloto: 'A definir',
      habilitado: true, rota: 'Paraíso do Tocantins → Caseara-TO',
      observacoes: 'Cada participante vem com carro próprio. Confirmar quantidade de veículos.'
    },
    {
      owner_id: ownerId, evento_id: eventoId,
      tipo: 'barco', identificacao: 'Barco do rancho',
      capacidade_pessoas: 10, motorista_piloto: 'A definir',
      habilitado: null, rota: 'Travessia do Rio Araguaia para o rancho',
      observacoes: 'OBRIGATÓRIO: confirmar habilitação do piloto e disponibilidade de coletes salva-vidas para 22 pessoas'
    }
  ])

  // 7. Refeições e cardápio
  log('Criando refeições...')
  const refeicoes = [
    { data: '2025-07-03', tipo: 'cafe_manha', descricao: 'Café da manhã — 03/07', itens: [
      { nome: 'Café', qtd_por_pessoa: 0.2, unidade: 'L' },
      { nome: 'Leite', qtd_por_pessoa: 0.2, unidade: 'L' },
      { nome: 'Toddy', qtd_por_pessoa: 0.03, unidade: 'kg' },
      { nome: 'Cuscuz', qtd_por_pessoa: 0.15, unidade: 'kg' },
      { nome: 'Pão de forma', qtd_por_pessoa: 2, unidade: 'fatias' },
      { nome: 'Presunto', qtd_por_pessoa: 0.05, unidade: 'kg' },
      { nome: 'Queijo', qtd_por_pessoa: 0.05, unidade: 'kg' },
      { nome: 'Ovo', qtd_por_pessoa: 1, unidade: 'un' },
      { nome: 'Melão', qtd_por_pessoa: 0.2, unidade: 'kg' },
      { nome: 'Banana', qtd_por_pessoa: 1, unidade: 'un' }
    ]},
    { data: '2025-07-03', tipo: 'almoco', descricao: 'Almoço — 03/07', itens: [
      { nome: 'Galinha (galinhada)', qtd_por_pessoa: 0.3, unidade: 'kg' },
      { nome: 'Arroz', qtd_por_pessoa: 0.15, unidade: 'kg' },
      { nome: 'Repolho', qtd_por_pessoa: 0.1, unidade: 'kg' },
      { nome: 'Tomate', qtd_por_pessoa: 0.1, unidade: 'kg' }
    ]},
    { data: '2025-07-03', tipo: 'lanche', descricao: 'Lanche — 03/07', itens: [
      { nome: 'Bolo', qtd_por_pessoa: 0.1, unidade: 'kg' },
      { nome: 'Pão', qtd_por_pessoa: 2, unidade: 'un' },
      { nome: 'Salsicha', qtd_por_pessoa: 2, unidade: 'un' }
    ]},
    { data: '2025-07-03', tipo: 'jantar', descricao: 'Jantar — 03/07', itens: [
      { nome: 'Arroz', qtd_por_pessoa: 0.15, unidade: 'kg' },
      { nome: 'Chambari', qtd_por_pessoa: 0.25, unidade: 'kg' },
      { nome: 'Salada (folhas)', qtd_por_pessoa: 0.1, unidade: 'kg' }
    ]},
    { data: '2025-07-04', tipo: 'cafe_manha', descricao: 'Café da manhã — 04/07', itens: [
      { nome: 'Pão de queijo', qtd_por_pessoa: 3, unidade: 'un' },
      { nome: 'Bolo', qtd_por_pessoa: 0.1, unidade: 'kg' },
      { nome: 'Pão francês', qtd_por_pessoa: 2, unidade: 'un' },
      { nome: 'Tapioca', qtd_por_pessoa: 1, unidade: 'un' },
      { nome: 'Melancia', qtd_por_pessoa: 0.3, unidade: 'kg' }
    ]},
    { data: '2025-07-04', tipo: 'almoco', descricao: 'Almoço — 04/07', itens: [
      { nome: 'Arroz', qtd_por_pessoa: 0.15, unidade: 'kg' },
      { nome: 'Feijão', qtd_por_pessoa: 0.1, unidade: 'kg' },
      { nome: 'Macarrão', qtd_por_pessoa: 0.1, unidade: 'kg' },
      { nome: 'Carne de panela', qtd_por_pessoa: 0.25, unidade: 'kg' },
      { nome: 'Salada mista', qtd_por_pessoa: 0.1, unidade: 'kg' }
    ]},
    { data: '2025-07-04', tipo: 'lanche', descricao: 'Lanche — 04/07', itens: [
      { nome: 'Torta de frango', qtd_por_pessoa: 1, unidade: 'fatia' },
      { nome: 'Torta de carne', qtd_por_pessoa: 1, unidade: 'fatia' }
    ]},
    { data: '2025-07-04', tipo: 'jantar', descricao: 'Jantar — 04/07', itens: [
      { nome: 'Arroz', qtd_por_pessoa: 0.15, unidade: 'kg' },
      { nome: 'Carne na chapa', qtd_por_pessoa: 0.25, unidade: 'kg' }
    ]}
  ]

  for (const ref of refeicoes) {
    const { data: refData } = await supabase.from('refeicoes').insert({
      owner_id: ownerId, evento_id: eventoId,
      data: ref.data, tipo: ref.tipo, descricao: ref.descricao
    }).select().single()
    if (ref.itens?.length > 0) {
      await supabase.from('cardapio_itens').insert(ref.itens.map(i => ({ ...i, refeicao_id: refData.id, owner_id: ownerId })))
    }
  }

  // 8. Programação
  log('Criando programação...')
  await supabase.from('programacao').insert([
    { owner_id: ownerId, evento_id: eventoId, inicio: '2025-07-03T06:00:00-03:00', fim: '2025-07-03T09:00:00-03:00', titulo: 'Saída de Paraíso do Tocantins', tipo: 'logística', local: 'Paraíso do Tocantins' },
    { owner_id: ownerId, evento_id: eventoId, inicio: '2025-07-03T09:00:00-03:00', titulo: 'Chegada e montagem das barracas', tipo: 'chegada', local: 'Rancho Brisas do Araguaia' },
    { owner_id: ownerId, evento_id: eventoId, inicio: '2025-07-03T10:00:00-03:00', fim: '2025-07-03T11:00:00-03:00', titulo: 'Café da manhã', tipo: 'refeição', local: 'Rancho' },
    { owner_id: ownerId, evento_id: eventoId, inicio: '2025-07-03T11:00:00-03:00', fim: '2025-07-03T12:30:00-03:00', titulo: 'Devocional de abertura', tipo: 'devocional', local: 'Área do rancho' },
    { owner_id: ownerId, evento_id: eventoId, inicio: '2025-07-03T12:30:00-03:00', fim: '2025-07-03T14:00:00-03:00', titulo: 'Almoço', tipo: 'refeição', local: 'Rancho' },
    { owner_id: ownerId, evento_id: eventoId, inicio: '2025-07-03T14:00:00-03:00', fim: '2025-07-03T17:00:00-03:00', titulo: 'Tempo livre — Rio (com coletes)', tipo: 'lazer', local: 'Rio Araguaia' },
    { owner_id: ownerId, evento_id: eventoId, inicio: '2025-07-03T17:00:00-03:00', fim: '2025-07-03T18:00:00-03:00', titulo: 'Gincana', tipo: 'gincana', local: 'Rancho' },
    { owner_id: ownerId, evento_id: eventoId, inicio: '2025-07-03T18:00:00-03:00', fim: '2025-07-03T19:00:00-03:00', titulo: 'Lanche', tipo: 'refeição', local: 'Rancho' },
    { owner_id: ownerId, evento_id: eventoId, inicio: '2025-07-03T19:00:00-03:00', fim: '2025-07-03T20:30:00-03:00', titulo: 'Culto / Momento espiritual', tipo: 'culto', local: 'Rancho' },
    { owner_id: ownerId, evento_id: eventoId, inicio: '2025-07-03T20:30:00-03:00', fim: '2025-07-03T21:30:00-03:00', titulo: 'Jantar', tipo: 'refeição', local: 'Rancho' },
    { owner_id: ownerId, evento_id: eventoId, inicio: '2025-07-03T21:30:00-03:00', titulo: 'Fogueira / Confraternização', tipo: 'lazer', local: 'Rancho' },
    { owner_id: ownerId, evento_id: eventoId, inicio: '2025-07-04T07:00:00-03:00', fim: '2025-07-04T08:30:00-03:00', titulo: 'Café da manhã', tipo: 'refeição', local: 'Rancho' },
    { owner_id: ownerId, evento_id: eventoId, inicio: '2025-07-04T08:30:00-03:00', fim: '2025-07-04T09:30:00-03:00', titulo: 'Devocional matinal', tipo: 'devocional', local: 'Rancho' },
    { owner_id: ownerId, evento_id: eventoId, inicio: '2025-07-04T09:30:00-03:00', fim: '2025-07-04T12:00:00-03:00', titulo: 'Tempo livre — Rio e atividades', tipo: 'lazer', local: 'Rio / Rancho' },
    { owner_id: ownerId, evento_id: eventoId, inicio: '2025-07-04T12:00:00-03:00', fim: '2025-07-04T14:00:00-03:00', titulo: 'Almoço', tipo: 'refeição', local: 'Rancho' },
    { owner_id: ownerId, evento_id: eventoId, inicio: '2025-07-04T14:00:00-03:00', fim: '2025-07-04T15:00:00-03:00', titulo: 'Lanche e desmontagem', tipo: 'refeição', local: 'Rancho' },
    { owner_id: ownerId, evento_id: eventoId, inicio: '2025-07-04T15:00:00-03:00', titulo: 'Jantar + retorno para Paraíso', tipo: 'refeição', local: 'Rancho / Viagem' }
  ])

  // 9. Materiais
  log('Criando materiais...')
  await supabase.from('materiais').insert([
    { owner_id: ownerId, evento_id: eventoId, nome: 'Colete salva-vidas', categoria: 'segurança', qtd_necessaria: 22, qtd_disponivel: 0, unidade: 'un', origem: 'a providenciar / barco do rancho', status: 'a_providenciar', observacoes: 'URGENTE: verificar se barco do rancho tem coletes para 22 pessoas' },
    { owner_id: ownerId, evento_id: eventoId, nome: 'Galão de água (20L)', categoria: 'alimentação', qtd_necessaria: 9, qtd_disponivel: 0, unidade: 'un', origem: 'comprar', status: 'a_providenciar', observacoes: 'Calculado: 176L ÷ 20L = 9 galões (arredondado p/ cima)' },
    { owner_id: ownerId, evento_id: eventoId, nome: 'Kit primeiros socorros', categoria: 'saúde', qtd_necessaria: 1, qtd_disponivel: 0, unidade: 'un', origem: 'providenciar', status: 'a_providenciar' },
    { owner_id: ownerId, evento_id: eventoId, nome: 'Repelente', categoria: 'saúde', qtd_necessaria: 5, unidade: 'un', origem: 'participantes', status: 'a_providenciar' },
    { owner_id: ownerId, evento_id: eventoId, nome: 'Protetor solar', categoria: 'saúde', qtd_necessaria: 5, unidade: 'un', origem: 'participantes', status: 'a_providenciar' },
    { owner_id: ownerId, evento_id: eventoId, nome: 'Lanterna/Headlamp', categoria: 'equipamento', qtd_necessaria: 22, unidade: 'un', origem: 'participantes', status: 'a_providenciar' },
    { owner_id: ownerId, evento_id: eventoId, nome: 'Barco', categoria: 'transporte', qtd_necessaria: 1, qtd_disponivel: 1, unidade: 'un', origem: 'rancho', status: 'a_providenciar', observacoes: 'Confirmar disponibilidade e combustível' },
    { owner_id: ownerId, evento_id: eventoId, nome: 'Combustível (barco)', categoria: 'transporte', qtd_necessaria: null, unidade: 'L', origem: 'comprar', status: 'a_providenciar' },
    { owner_id: ownerId, evento_id: eventoId, nome: 'Gerador (combustível)', categoria: 'energia', qtd_necessaria: null, unidade: 'L', origem: 'rancho / comprar', status: 'a_providenciar' },
    { owner_id: ownerId, evento_id: eventoId, nome: 'Lixeiras / sacos de lixo', categoria: 'limpeza', qtd_necessaria: 10, unidade: 'un', origem: 'comprar', status: 'a_providenciar' }
  ])

  // 10. Financeiro
  log('Criando financeiro...')
  await supabase.from('financeiro').insert([
    { owner_id: ownerId, evento_id: eventoId, tipo: 'despesa', categoria: 'local', descricao: 'Aluguel do Rancho Brisas do Araguaia (2 dias)', valor: 500, status: 'previsto' },
    { owner_id: ownerId, evento_id: eventoId, tipo: 'despesa', categoria: 'transporte', descricao: 'Combustível carros (ida e volta)', valor: 800, status: 'previsto', observacoes: 'Estimativa a confirmar' },
    { owner_id: ownerId, evento_id: eventoId, tipo: 'despesa', categoria: 'transporte', descricao: 'Transporte fluvial (barco)', valor: 200, status: 'previsto', observacoes: 'A confirmar com dono do barco' },
    { owner_id: ownerId, evento_id: eventoId, tipo: 'despesa', categoria: 'alimentação', descricao: 'Alimentação geral (2 dias, 22 pessoas)', valor: 1500, status: 'previsto' },
    { owner_id: ownerId, evento_id: eventoId, tipo: 'despesa', categoria: 'materiais', descricao: 'Água potável (galões)', valor: 180, status: 'previsto' },
    { owner_id: ownerId, evento_id: eventoId, tipo: 'despesa', categoria: 'segurança', descricao: 'Coletes salva-vidas (locação/compra)', valor: 300, status: 'previsto' },
    { owner_id: ownerId, evento_id: eventoId, tipo: 'despesa', categoria: 'saúde', descricao: 'Kit primeiros socorros', valor: 80, status: 'previsto' }
  ])
  // Nota: sem receita cadastrada → alerta "despesa sem receita"

  // 11. Riscos (prob/impacto → sistema calcula severidade)
  log('Criando riscos...')
  await supabase.from('riscos').insert([
    { owner_id: ownerId, evento_id: eventoId, descricao: 'Afogamento no rio', categoria: 'segurança', probabilidade: 'media', impacto: 'critico', medidas_preventivas: 'Uso obrigatório de coletes, monitoramento constante da equipe de segurança, proibição de nadar sozinho' },
    { owner_id: ownerId, evento_id: eventoId, descricao: 'Afogamento na travessia de barco', categoria: 'segurança', probabilidade: 'media', impacto: 'critico', medidas_preventivas: 'Coletes obrigatórios, piloto habilitado, número máximo de passageiros respeitado' },
    { owner_id: ownerId, evento_id: eventoId, descricao: 'Animais peçonhentos (cobras, escorpiões)', categoria: 'saúde', probabilidade: 'media', impacto: 'alto', medidas_preventivas: 'Iluminar o chão à noite, sacudir sapatos, não andar descalço, orientar participantes' },
    { owner_id: ownerId, evento_id: eventoId, descricao: 'Picadas de mosquito / doença', categoria: 'saúde', probabilidade: 'alta', impacto: 'medio', medidas_preventivas: 'Uso de repelente obrigatório, roupas compridas ao entardecer' },
    { owner_id: ownerId, evento_id: eventoId, descricao: 'Falta de água potável', categoria: 'logística', probabilidade: 'media', impacto: 'critico', medidas_preventivas: 'Levar galões suficientes (mínimo 9 galões de 20L), água reserva', plano_contingencia: 'Comprar galões extras em Caseara antes de embarcar' },
    { owner_id: ownerId, evento_id: eventoId, descricao: 'Banheiro único insuficiente para 22 pessoas', categoria: 'logística', probabilidade: 'alta', impacto: 'medio', medidas_preventivas: 'Organizar revezamento, criar tabela de horários', plano_contingencia: 'Levar banheiro químico portátil' },
    { owner_id: ownerId, evento_id: eventoId, descricao: 'Falha do gerador', categoria: 'logística', probabilidade: 'media', impacto: 'alto', medidas_preventivas: 'Verificar gerador antes do evento, levar combustível extra', plano_contingencia: 'Lanternas e headlamps para todos' },
    { owner_id: ownerId, evento_id: eventoId, descricao: 'Noites frias (julho)', categoria: 'clima', probabilidade: 'media', impacto: 'medio', medidas_preventivas: 'Orientar participantes a levar cobertor/saco de dormir adequado para noites frias' },
    { owner_id: ownerId, evento_id: eventoId, descricao: 'Problema no transporte terrestre', categoria: 'logística', probabilidade: 'media', impacto: 'medio', medidas_preventivas: 'Verificar veículos antes, ter número de reboque, organizar caronas' },
    { owner_id: ownerId, evento_id: eventoId, descricao: 'Ausência de verba para custear o evento', categoria: 'financeiro', probabilidade: 'alta', impacto: 'critico', medidas_preventivas: 'Confirmar comprometimento de todos, arrecadar antecipado', plano_contingencia: 'Reduzir cardápio, buscar doações' }
  ])

  // 12. Tarefas
  log('Criando tarefas...')
  await supabase.from('tarefas').insert([
    { owner_id: ownerId, evento_id: eventoId, o_que: 'Confirmar disponibilidade do barco', como: 'Ligar para o dono do rancho e confirmar barco, piloto habilitado e coletes', responsavel_id: jessica?.id, prazo: '2025-06-20', prioridade: 'urgente', status: 'pendente' },
    { owner_id: ownerId, evento_id: eventoId, o_que: 'Confirmar número de vagas nos carros', como: 'Fazer lista de quem vai de carro e capacidade de cada veículo', responsavel_id: jessica?.id, prazo: '2025-06-20', prioridade: 'urgente', status: 'pendente' },
    { owner_id: ownerId, evento_id: eventoId, o_que: 'Fazer lista de participantes confirmados', como: 'Coletar confirmações de cada jovem', responsavel_id: isabela?.id, prazo: '2025-06-15', prioridade: 'alta', status: 'pendente' },
    { owner_id: ownerId, evento_id: eventoId, o_que: 'Comprar alimentos para o acampamento', como: 'Usar a lista de compras gerada pelo sistema', responsavel_id: isabela?.id, prazo: '2025-07-02', prioridade: 'alta', status: 'pendente' },
    { owner_id: ownerId, evento_id: eventoId, o_que: 'Comprar galões de água (mínimo 9 de 20L)', como: 'Comprar antes de sair de Paraíso do Tocantins', responsavel_id: jessica?.id, prazo: '2025-07-03', prioridade: 'urgente', status: 'pendente' },
    { owner_id: ownerId, evento_id: eventoId, o_que: 'Verificar/adquirir coletes salva-vidas para 22 pessoas', como: 'Confirmar se barco do rancho tem coletes. Se não, locar ou comprar.', responsavel_id: isabela?.id, prazo: '2025-06-25', prioridade: 'urgente', status: 'pendente' },
    { owner_id: ownerId, evento_id: eventoId, o_que: 'Definir unidade de saúde próxima ao rancho', como: 'Pesquisar hospital/UPA mais próximo de Caseara-TO e salvar endereço/telefone', responsavel_id: isabela?.id, prazo: '2025-06-25', prioridade: 'alta', status: 'pendente' },
    { owner_id: ownerId, evento_id: eventoId, o_que: 'Montar equipes de alimentação, limpeza e segurança', como: 'Distribuir tarefas entre os participantes voluntários', responsavel_id: isabela?.id, prazo: '2025-06-28', prioridade: 'media', status: 'pendente' },
    { owner_id: ownerId, evento_id: eventoId, o_que: 'Preparar kit de primeiros socorros', como: 'Reunir: curativo, antisséptico, antialérgico, analgésico, termômetro', responsavel_id: null, prazo: '2025-07-02', prioridade: 'alta', status: 'pendente' },
    { owner_id: ownerId, evento_id: eventoId, o_que: 'Comunicar programação para todos os participantes', como: 'Enviar no grupo do WhatsApp: datas, ponto de encontro, lista de itens para levar', responsavel_id: isabela?.id, prazo: '2025-06-28', prioridade: 'media', status: 'pendente' }
  ])

  log('Seed concluído! Evento criado com ID: ' + eventoId)
  return eventoId
}
