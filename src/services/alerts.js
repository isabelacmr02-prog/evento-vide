// Geração automática de alertas baseada nos dados do evento
import { calcDias, calcTotalPessoas, calcCapacidadeTotal, calcBarracasEsperadas, calcFinanceiro, calcSeveridade } from './calculations'

export function gerarAlertas(evento, local, hospedagem, pessoas, refeicoes, programacao, transporte, equipes, equipesMembros, materiais, financeiro, riscos, tarefas) {
  const alertas = []
  const hoje = new Date()
  const totalPessoas = calcTotalPessoas(pessoas)

  // ── TRANSPORTE ──────────────────────────────────────────────
  const capacTotal = calcCapacidadeTotal(transporte)
  if (transporte.length > 0 && capacTotal < totalPessoas) {
    alertas.push({
      nivel: 'erro',
      secao: 'Transporte',
      msg: `Capacidade total de transporte (${capacTotal} assentos) é menor que total de pessoas (${totalPessoas}). Faltam ${totalPessoas - capacTotal} assentos.`
    })
  }

  const barcos = transporte.filter(t => t.tipo === 'barco')
  if (barcos.length === 0) {
    // Verifica se há risco aquático → sugere barco
    const riscoAquatico = riscos.find(r => r.descricao?.toLowerCase().includes('barco') || r.descricao?.toLowerCase().includes('afogamento'))
    if (riscoAquatico) {
      alertas.push({ nivel: 'atencao', secao: 'Transporte', msg: 'Há risco aquático/afogamento cadastrado mas nenhum barco registrado no transporte.' })
    }
  } else {
    const semHabilitacao = barcos.filter(b => b.habilitado === false)
    if (semHabilitacao.length > 0) {
      alertas.push({ nivel: 'atencao', secao: 'Transporte', msg: `${semHabilitacao.length} barco(s) com piloto sem habilitação registrada.` })
    }
  }

  // ── HOSPEDAGEM ───────────────────────────────────────────────
  const barracasEsperadas = calcBarracasEsperadas(pessoas)
  const barracasDisp = hospedagem?.barracas_disponiveis ?? null
  if (barracasDisp !== null && barracasEsperadas > barracasDisp) {
    alertas.push({
      nivel: 'atencao',
      secao: 'Hospedagem',
      msg: `${barracasEsperadas} pessoas vão levar barraca, mas apenas ${barracasDisp} disponíveis registradas.`
    })
  }
  const semCobertura = pessoas.filter(p => !p.leva_barraca && p.papel === 'participante')
  if (semCobertura.length > 0 && hospedagem && !hospedagem.modelo?.toLowerCase().includes('alojamento') && !hospedagem.modelo?.toLowerCase().includes('rede')) {
    alertas.push({
      nivel: 'atencao',
      secao: 'Hospedagem',
      msg: `${semCobertura.length} participante(s) sem barraca registrada e modelo de hospedagem não é alojamento/redes.`
    })
  }

  // ── ORÇAMENTO ────────────────────────────────────────────────
  const fin = calcFinanceiro(financeiro)
  if (fin.saldo < 0) {
    alertas.push({ nivel: 'erro', secao: 'Orçamento', msg: `Saldo negativo: R$ ${fin.saldo.toFixed(2)}. Receitas insuficientes para cobrir despesas.` })
  }
  const temDespesas = financeiro.some(f => f.tipo === 'despesa')
  const temReceitas = financeiro.some(f => f.tipo === 'receita')
  if (temDespesas && !temReceitas) {
    alertas.push({ nivel: 'atencao', secao: 'Orçamento', msg: 'Há despesas cadastradas mas nenhuma receita. Como o evento será financiado?' })
  }

  // ── RISCOS ───────────────────────────────────────────────────
  for (const risco of riscos) {
    const sev = calcSeveridade(risco.probabilidade, risco.impacto)
    if ((sev === 'alta' || sev === 'critica') && !risco.plano_contingencia) {
      alertas.push({
        nivel: 'erro',
        secao: 'Riscos',
        msg: `Risco "${risco.descricao}" tem severidade ${sev} mas sem plano de contingência!`
      })
    }
    if (!risco.responsavel_id) {
      alertas.push({ nivel: 'atencao', secao: 'Riscos', msg: `Risco "${risco.descricao}" sem responsável atribuído.` })
    }
  }

  // ── SEGURANÇA AQUÁTICA ───────────────────────────────────────
  const riscoAfogamento = riscos.find(r =>
    r.descricao?.toLowerCase().includes('afogamento') || r.descricao?.toLowerCase().includes('rio') || r.descricao?.toLowerCase().includes('barco')
  )
  if (riscoAfogamento) {
    const coletes = materiais.filter(m => m.nome?.toLowerCase().includes('colete'))
    const totalColetes = coletes.reduce((s, c) => s + Number(c.qtd_necessaria || 0), 0)
    if (totalColetes < totalPessoas) {
      alertas.push({
        nivel: 'erro',
        secao: 'Materiais',
        msg: `Risco de afogamento identificado! Coletes salva-vidas disponíveis (${totalColetes}) são menos que o total de pessoas (${totalPessoas}).`
      })
    }
  }

  // ── EQUIPES ESSENCIAIS ───────────────────────────────────────
  const essenciais = ['Coordenação', 'Alimentação', 'Segurança']
  for (const nome of essenciais) {
    const eq = equipes.find(e => e.nome?.toLowerCase() === nome.toLowerCase())
    if (eq) {
      const membros = equipesMembros.filter(m => m.equipe_id === eq.id)
      if (membros.length === 0) {
        alertas.push({ nivel: 'atencao', secao: 'Equipes', msg: `Equipe essencial "${nome}" não tem membros.` })
      }
    } else {
      alertas.push({ nivel: 'atencao', secao: 'Equipes', msg: `Equipe essencial "${nome}" não foi criada.` })
    }
  }

  // ── TAREFAS ──────────────────────────────────────────────────
  const tarefasVencidas = tarefas.filter(t => {
    if (!t.prazo || t.status === 'concluida' || t.status === 'cancelada') return false
    return new Date(t.prazo) < hoje
  })
  tarefasVencidas.forEach(t => {
    alertas.push({ nivel: 'erro', secao: 'Tarefas', msg: `Tarefa "${t.o_que}" venceu em ${t.prazo} e ainda não foi concluída.` })
  })

  const tarefasBloqueadas = tarefas.filter(t => t.status === 'bloqueada')
  tarefasBloqueadas.forEach(t => {
    alertas.push({ nivel: 'atencao', secao: 'Tarefas', msg: `Tarefa "${t.o_que}" está bloqueada.` })
  })

  // ── RESTRIÇÕES ALIMENTARES ──────────────────────────────────
  const comRestricao = pessoas.filter(p => p.restricoes_alimentares)
  if (comRestricao.length > 0) {
    alertas.push({
      nivel: 'atencao',
      secao: 'Alimentação',
      msg: `${comRestricao.length} participante(s) com restrições alimentares: ${comRestricao.map(p => `${p.nome} (${p.restricoes_alimentares})`).join('; ')}`
    })
  }

  // ── LOCAL ────────────────────────────────────────────────────
  if (local && !local.unidade_saude_proxima) {
    alertas.push({ nivel: 'atencao', secao: 'Local', msg: 'Unidade de saúde próxima não informada.' })
  }
  if (local && !local.tem_agua_potavel) {
    alertas.push({ nivel: 'atencao', secao: 'Local', msg: 'Local sem água potável — lembrar de providenciar galões.' })
  }

  // ── PROGRAMAÇÃO FORA DAS DATAS ────────────────────────────────
  if (evento.data_inicio && evento.data_fim) {
    const ini = new Date(evento.data_inicio)
    const fim = new Date(evento.data_fim)
    fim.setHours(23, 59, 59)
    for (const ativ of programacao) {
      const aIni = new Date(ativ.inicio)
      if (aIni < ini || aIni > fim) {
        alertas.push({ nivel: 'erro', secao: 'Programação', msg: `Atividade "${ativ.titulo}" está fora do intervalo do evento.` })
      }
    }
  }

  return alertas
}
