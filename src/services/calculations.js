// Todos os cálculos derivados — NUNCA digitados manualmente

export function calcDias(dataInicio, dataFim) {
  if (!dataInicio || !dataFim) return 1
  const a = new Date(dataInicio)
  const b = new Date(dataFim)
  return Math.max(1, Math.round((b - a) / 86400000) + 1)
}

export function calcTotalPessoas(pessoas) {
  return pessoas?.length ?? 0
}

export function calcAguaLitros(totalPessoas, dias, litrosPorPessoaDia = 4) {
  return totalPessoas * dias * litrosPorPessoaDia
}

export function calcAguaGaloes(litros, litrosPorGalao = 20) {
  return Math.ceil(litros / litrosPorGalao)
}

export function calcQtdCompra(qtdPorPessoa, totalPessoas, folgatPct = 10) {
  if (!qtdPorPessoa) return null
  return qtdPorPessoa * totalPessoas * (1 + folgatPct / 100)
}

export function calcViagens(totalPessoas, capacidade) {
  if (!capacidade || capacidade <= 0) return null
  return Math.ceil(totalPessoas / capacidade)
}

export function calcCapacidadeTotal(veiculos) {
  return veiculos.reduce((sum, v) => sum + (v.capacidade_pessoas || 0), 0)
}

export function calcBarracasEsperadas(pessoas) {
  return pessoas.filter(p => p.leva_barraca).length
}

export function calcFinanceiro(itens) {
  const receitas = itens.filter(i => i.tipo === 'receita').reduce((s, i) => s + Number(i.valor || 0), 0)
  const despesas = itens.filter(i => i.tipo === 'despesa').reduce((s, i) => s + Number(i.valor || 0), 0)
  return { receitas, despesas, saldo: receitas - despesas }
}

export function calcCustoPorPessoa(totalDespesas, totalPessoas) {
  if (!totalPessoas) return 0
  return totalDespesas / totalPessoas
}

// Matriz Probabilidade × Impacto → Severidade
const matrizSeveridade = {
  baixa: { baixo: 'baixa', medio: 'baixa', alto: 'media', critico: 'alta' },
  media: { baixo: 'baixa', medio: 'media', alto: 'alta',  critico: 'critica' },
  alta:  { baixo: 'media', medio: 'alta',  alto: 'critica', critico: 'critica' }
}

export function calcSeveridade(probabilidade, impacto) {
  return matrizSeveridade[probabilidade]?.[impacto] ?? 'media'
}

// Consolidar lista de compras (agrupa itens iguais de todas as refeições)
export function calcListaCompras(refeicoes, totalPessoas, folgatPct = 10) {
  const mapa = {}
  for (const ref of refeicoes) {
    for (const item of (ref.cardapio_itens || [])) {
      if (!item.qtd_por_pessoa) continue
      const key = `${item.nome.toLowerCase()}|${item.unidade || ''}`
      const qtd = calcQtdCompra(item.qtd_por_pessoa, totalPessoas, folgatPct)
      if (!mapa[key]) mapa[key] = { nome: item.nome, unidade: item.unidade, qtd: 0 }
      mapa[key].qtd += qtd
    }
  }
  return Object.values(mapa).map(i => ({ ...i, qtd: Math.ceil(i.qtd * 100) / 100 }))
}

// % de completude por seção
export function calcCompletudeEvento(evento, local, hospedagem, pessoas, refeicoes, transporte, equipes, materiais, financeiro, riscos, tarefas) {
  const secoes = []

  secoes.push({
    nome: 'Informações Gerais',
    total: 4,
    preenchidos: [evento.nome, evento.data_inicio, evento.data_fim, evento.objetivo].filter(Boolean).length
  })
  secoes.push({
    nome: 'Local',
    total: 5,
    preenchidos: local
      ? [local.nome_local, local.endereco, local.unidade_saude_proxima, local.contato_saude, local.pontos_de_risco].filter(Boolean).length
      : 0
  })
  secoes.push({
    nome: 'Hospedagem',
    total: 2,
    preenchidos: hospedagem ? [hospedagem.modelo, hospedagem.barracas_disponiveis].filter(v => v != null && v !== '').length : 0
  })
  secoes.push({
    nome: 'Pessoas',
    total: 1,
    preenchidos: pessoas.length > 0 ? 1 : 0
  })
  secoes.push({
    nome: 'Alimentação',
    total: 1,
    preenchidos: refeicoes.length > 0 ? 1 : 0
  })
  secoes.push({
    nome: 'Transporte',
    total: 1,
    preenchidos: transporte.length > 0 ? 1 : 0
  })
  secoes.push({
    nome: 'Equipes',
    total: 1,
    preenchidos: equipes.length > 0 ? 1 : 0
  })
  secoes.push({
    nome: 'Materiais',
    total: 1,
    preenchidos: materiais.length > 0 ? 1 : 0
  })
  secoes.push({
    nome: 'Orçamento',
    total: 1,
    preenchidos: financeiro.length > 0 ? 1 : 0
  })
  secoes.push({
    nome: 'Riscos',
    total: 1,
    preenchidos: riscos.length > 0 ? 1 : 0
  })
  secoes.push({
    nome: 'Tarefas',
    total: 1,
    preenchidos: tarefas.length > 0 ? 1 : 0
  })

  const total = secoes.reduce((s, c) => s + c.total, 0)
  const preenchidos = secoes.reduce((s, c) => s + c.preenchidos, 0)
  const pct = total > 0 ? Math.round((preenchidos / total) * 100) : 0

  return { secoes, pct }
}
