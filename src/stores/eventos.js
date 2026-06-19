import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/services/supabase'

export const useEventosStore = defineStore('eventos', () => {
  const lista = ref([])
  const atual = ref(null)
  const loading = ref(false)

  async function carregar() {
    loading.value = true
    const { data, error } = await supabase.from('eventos').select('*').order('data_inicio', { ascending: false })
    if (!error) lista.value = data
    loading.value = false
    return { error }
  }

  async function carregarPorId(id) {
    const { data, error } = await supabase.from('eventos').select('*').eq('id', id).single()
    if (!error) atual.value = data
    return { data, error }
  }

  async function criar(payload) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('eventos').insert({ ...payload, owner_id: user.id }).select().single()
    if (!error) lista.value.unshift(data)
    return { data, error }
  }

  async function atualizar(id, payload) {
    const { data, error } = await supabase.from('eventos').update(payload).eq('id', id).select().single()
    if (!error) {
      atual.value = data
      const idx = lista.value.findIndex(e => e.id === id)
      if (idx >= 0) lista.value[idx] = data
    }
    return { data, error }
  }

  async function duplicar(id) {
    const { data: orig } = await supabase.from('eventos').select('*').eq('id', id).single()
    if (!orig) return { error: 'Evento não encontrado' }
    const { id: _id, created_at, updated_at, ...rest } = orig
    return criar({ ...rest, nome: `${orig.nome} (cópia)` })
  }

  async function excluir(id) {
    const { error } = await supabase.from('eventos').delete().eq('id', id)
    if (!error) lista.value = lista.value.filter(e => e.id !== id)
    return { error }
  }

  return { lista, atual, loading, carregar, carregarPorId, criar, atualizar, duplicar, excluir }
})
