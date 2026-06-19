// Store principal que agrega todos os dados de um evento aberto
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/services/supabase'
import { calcDias, calcTotalPessoas, calcAguaLitros, calcAguaGaloes, calcCapacidadeTotal, calcBarracasEsperadas, calcFinanceiro, calcCustoPorPessoa, calcSeveridade, calcListaCompras, calcCompletudeEvento, calcViagens } from '@/services/calculations'
import { gerarAlertas } from '@/services/alerts'

export const useEventoDataStore = defineStore('eventoData', () => {
  const eventoId = ref(null)
  const evento = ref(null)
  const local = ref(null)
  const hospedagem = ref(null)
  const pessoas = ref([])
  const refeicoes = ref([])       // inclui cardapio_itens via join
  const programacao = ref([])
  const transporte = ref([])
  const equipes = ref([])
  const equipesMembros = ref([])
  const materiais = ref([])
  const financeiro = ref([])
  const riscos = ref([])
  const tarefas = ref([])
  const customFields = ref([])
  const loading = ref(false)

  async function carregar(id) {
    eventoId.value = id
    loading.value = true

    const [
      evRes, locRes, hospRes, pesRes, refRes, progRes, transpRes, eqRes, membRes, matRes, finRes, riscRes, tarRes, cfRes
    ] = await Promise.all([
      supabase.from('eventos').select('*').eq('id', id).single(),
      supabase.from('locais').select('*').eq('evento_id', id).maybeSingle(),
      supabase.from('hospedagem').select('*').eq('evento_id', id).maybeSingle(),
      supabase.from('pessoas').select('*').eq('evento_id', id).order('nome'),
      supabase.from('refeicoes').select('*, cardapio_itens(*)').eq('evento_id', id).order('data').order('tipo'),
      supabase.from('programacao').select('*').eq('evento_id', id).order('inicio'),
      supabase.from('transporte').select('*').eq('evento_id', id),
      supabase.from('equipes').select('*').eq('evento_id', id),
      supabase.from('equipe_membros').select('*, pessoas(nome)').eq('owner_id', (await supabase.auth.getUser()).data.user?.id),
      supabase.from('materiais').select('*').eq('evento_id', id),
      supabase.from('financeiro').select('*').eq('evento_id', id),
      supabase.from('riscos').select('*, pessoas(nome)').eq('evento_id', id),
      supabase.from('tarefas').select('*, pessoas(nome)').eq('evento_id', id).order('prazo'),
      supabase.from('custom_fields').select('*').eq('evento_id', id).order('secao').order('ordem')
    ])

    evento.value = evRes.data
    local.value = locRes.data
    hospedagem.value = hospRes.data
    pessoas.value = pesRes.data || []
    refeicoes.value = refRes.data || []
    programacao.value = progRes.data || []
    transporte.value = transpRes.data || []
    equipes.value = eqRes.data || []
    // Filtrar membros pelo evento atual via equipe
    const eqIds = new Set((eqRes.data || []).map(e => e.id))
    equipesMembros.value = (membRes.data || []).filter(m => eqIds.has(m.equipe_id))
    materiais.value = matRes.data || []
    financeiro.value = finRes.data || []
    riscos.value = (riscRes.data || []).map(r => ({
      ...r,
      severidade: calcSeveridade(r.probabilidade, r.impacto)
    }))
    tarefas.value = tarRes.data || []
    customFields.value = cfRes.data || []

    loading.value = false
  }

  // ── COMPUTED ─────────────────────────────────────────────────
  const totalPessoas = computed(() => calcTotalPessoas(pessoas.value))
  const dias = computed(() => evento.value ? calcDias(evento.value.data_inicio, evento.value.data_fim) : 1)
  const aguaLitros = computed(() => calcAguaLitros(totalPessoas.value, dias.value, evento.value?.litros_agua_pessoa_dia ?? 4))
  const aguaGaloes = computed(() => calcAguaGaloes(aguaLitros.value))
  const capacidadeTransporte = computed(() => calcCapacidadeTotal(transporte.value))
  const barracasEsperadas = computed(() => calcBarracasEsperadas(pessoas.value))
  const resumoFinanceiro = computed(() => calcFinanceiro(financeiro.value))
  const custoPorPessoa = computed(() => calcCustoPorPessoa(resumoFinanceiro.value.despesas, totalPessoas.value))
  const listaCompras = computed(() => calcListaCompras(refeicoes.value, totalPessoas.value, evento.value?.folga_alimentacao_pct ?? 10))
  const completude = computed(() => calcCompletudeEvento(evento.value || {}, local.value, hospedagem.value, pessoas.value, refeicoes.value, transporte.value, equipes.value, materiais.value, financeiro.value, riscos.value, tarefas.value))

  const alertas = computed(() => {
    if (!evento.value) return []
    return gerarAlertas(evento.value, local.value, hospedagem.value, pessoas.value, refeicoes.value, programacao.value, transporte.value, equipes.value, equipesMembros.value, materiais.value, financeiro.value, riscos.value, tarefas.value)
  })

  const viagensTransporte = computed(() => transporte.value.map(v => ({
    ...v,
    viagens: calcViagens(totalPessoas.value, v.capacidade_pessoas)
  })))

  const customFieldsSecoes = computed(() => {
    const grupos = {}
    for (const cf of customFields.value) {
      if (!grupos[cf.secao]) grupos[cf.secao] = []
      grupos[cf.secao].push(cf)
    }
    return grupos
  })

  // ── MUTATIONS LOCAIS (após salvar no Supabase) ────────────────
  function upsertLocal(data) { local.value = data }
  function upsertHospedagem(data) { hospedagem.value = data }
  function addPessoa(p) { pessoas.value.push(p) }
  function updatePessoa(p) { const i = pessoas.value.findIndex(x => x.id === p.id); if (i >= 0) pessoas.value[i] = p }
  function removePessoa(id) { pessoas.value = pessoas.value.filter(p => p.id !== id) }
  function addRefeicao(r) { refeicoes.value.push({ ...r, cardapio_itens: [] }) }
  function updateRefeicao(r) { const i = refeicoes.value.findIndex(x => x.id === r.id); if (i >= 0) refeicoes.value[i] = { ...refeicoes.value[i], ...r } }
  function removeRefeicao(id) { refeicoes.value = refeicoes.value.filter(r => r.id !== id) }
  function addCardapioItem(refId, item) { const r = refeicoes.value.find(r => r.id === refId); if (r) r.cardapio_itens = [...(r.cardapio_itens || []), item] }
  function removeCardapioItem(refId, itemId) { const r = refeicoes.value.find(r => r.id === refId); if (r) r.cardapio_itens = (r.cardapio_itens || []).filter(i => i.id !== itemId) }
  function addProg(p) { programacao.value.push(p) }
  function updateProg(p) { const i = programacao.value.findIndex(x => x.id === p.id); if (i >= 0) programacao.value[i] = p }
  function removeProg(id) { programacao.value = programacao.value.filter(p => p.id !== id) }
  function addTransporte(t) { transporte.value.push(t) }
  function updateTransporte(t) { const i = transporte.value.findIndex(x => x.id === t.id); if (i >= 0) transporte.value[i] = t }
  function removeTransporte(id) { transporte.value = transporte.value.filter(t => t.id !== id) }
  function addEquipe(e) { equipes.value.push(e) }
  function updateEquipe(e) { const i = equipes.value.findIndex(x => x.id === e.id); if (i >= 0) equipes.value[i] = e }
  function removeEquipe(id) { equipes.value = equipes.value.filter(e => e.id !== id); equipesMembros.value = equipesMembros.value.filter(m => m.equipe_id !== id) }
  function addMembro(m) { equipesMembros.value.push(m) }
  function removeMembro(id) { equipesMembros.value = equipesMembros.value.filter(m => m.id !== id) }
  function addMaterial(m) { materiais.value.push(m) }
  function updateMaterial(m) { const i = materiais.value.findIndex(x => x.id === m.id); if (i >= 0) materiais.value[i] = m }
  function removeMaterial(id) { materiais.value = materiais.value.filter(m => m.id !== id) }
  function addFinanceiro(f) { financeiro.value.push(f) }
  function updateFinanceiro(f) { const i = financeiro.value.findIndex(x => x.id === f.id); if (i >= 0) financeiro.value[i] = f }
  function removeFinanceiro(id) { financeiro.value = financeiro.value.filter(f => f.id !== id) }
  function addRisco(r) { riscos.value.push({ ...r, severidade: calcSeveridade(r.probabilidade, r.impacto) }) }
  function updateRisco(r) { const i = riscos.value.findIndex(x => x.id === r.id); if (i >= 0) riscos.value[i] = { ...r, severidade: calcSeveridade(r.probabilidade, r.impacto) } }
  function removeRisco(id) { riscos.value = riscos.value.filter(r => r.id !== id) }
  function addTarefa(t) { tarefas.value.push(t) }
  function updateTarefa(t) { const i = tarefas.value.findIndex(x => x.id === t.id); if (i >= 0) tarefas.value[i] = t }
  function removeTarefa(id) { tarefas.value = tarefas.value.filter(t => t.id !== id) }
  function addCustomField(cf) { customFields.value.push(cf) }
  function updateCustomField(cf) { const i = customFields.value.findIndex(x => x.id === cf.id); if (i >= 0) customFields.value[i] = cf }
  function removeCustomField(id) { customFields.value = customFields.value.filter(cf => cf.id !== id) }

  return {
    eventoId, evento, local, hospedagem, pessoas, refeicoes, programacao, transporte,
    equipes, equipesMembros, materiais, financeiro, riscos, tarefas, customFields, loading,
    totalPessoas, dias, aguaLitros, aguaGaloes, capacidadeTransporte, barracasEsperadas,
    resumoFinanceiro, custoPorPessoa, listaCompras, completude, alertas, viagensTransporte, customFieldsSecoes,
    carregar,
    upsertLocal, upsertHospedagem,
    addPessoa, updatePessoa, removePessoa,
    addRefeicao, updateRefeicao, removeRefeicao, addCardapioItem, removeCardapioItem,
    addProg, updateProg, removeProg,
    addTransporte, updateTransporte, removeTransporte,
    addEquipe, updateEquipe, removeEquipe, addMembro, removeMembro,
    addMaterial, updateMaterial, removeMaterial,
    addFinanceiro, updateFinanceiro, removeFinanceiro,
    addRisco, updateRisco, removeRisco,
    addTarefa, updateTarefa, removeTarefa,
    addCustomField, updateCustomField, removeCustomField
  }
})
