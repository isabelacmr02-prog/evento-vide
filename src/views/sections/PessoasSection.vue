<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal modal-lg">
      <div class="modal-header">
        <h2>👥 Pessoas ({{ store.totalPessoas }} no total)</h2>
        <button class="btn-icon" @click="$emit('close')">✕</button>
      </div>
      <div class="modal-body">
        <!-- Formulário adicionar/editar -->
        <div class="card mb-3" style="padding:1rem">
          <h3 class="mb-3">{{ editando ? 'Editar pessoa' : '+ Adicionar pessoa' }}</h3>
          <div v-if="erroForm" class="alert alert-erro mb-2">{{ erroForm }}</div>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Nome *</label>
              <input v-model="form.nome" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Papel</label>
              <select v-model="form.papel" class="form-control">
                <option value="participante">Participante</option>
                <option value="organizador">Organizador</option>
                <option value="voluntario">Voluntário</option>
                <option value="convidado">Convidado</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Telefone</label>
              <input v-model="form.telefone" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Contato de emergência</label>
              <input v-model="form.contato_emergencia" class="form-control" />
            </div>
            <div class="form-group" style="grid-column:1/-1">
              <label class="form-label">Restrições alimentares</label>
              <input v-model="form.restricoes_alimentares" class="form-control" placeholder="Ex.: vegetariano, alergia a frango, sem lactose" />
            </div>
            <div class="form-group">
              <label class="form-check">
                <input v-model="form.leva_barraca" type="checkbox" />
                Leva barraca própria
              </label>
            </div>
            <div class="form-group">
              <label class="form-label">Observações</label>
              <input v-model="form.observacoes" class="form-control" />
            </div>
          </div>
          <div class="flex gap-2 mt-2">
            <button class="btn btn-primary btn-sm" :disabled="salvando" @click="salvar">{{ salvando ? '...' : (editando ? 'Atualizar' : 'Adicionar') }}</button>
            <button v-if="editando" class="btn btn-secondary btn-sm" @click="cancelarEdicao">Cancelar</button>
          </div>
        </div>

        <!-- Lista -->
        <div v-if="store.pessoas.length > 0">
          <p class="text-muted mb-2" style="font-size:.8rem">
            {{ store.pessoas.filter(p=>p.restricoes_alimentares).length }} com restrições alimentares ·
            {{ store.barracasEsperadas }} levam barraca
          </p>
          <table class="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Papel</th>
                <th>Barraca</th>
                <th>Restrições</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in store.pessoas" :key="p.id">
                <td><strong>{{ p.nome }}</strong></td>
                <td><span class="badge badge-pendente">{{ labelPapel(p.papel) }}</span></td>
                <td>{{ p.leva_barraca ? '✅' : '—' }}</td>
                <td style="font-size:.8rem;color:var(--text-muted)">{{ p.restricoes_alimentares || '—' }}</td>
                <td>
                  <div class="flex gap-1">
                    <button class="btn-icon btn-sm" @click="iniciarEdicao(p)">✏️</button>
                    <button class="btn-icon btn-sm" @click="excluir(p.id)">🗑</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-state">Nenhuma pessoa cadastrada</div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('close')">Fechar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useEventoDataStore } from '@/stores/eventoData'
import { supabase } from '@/services/supabase'

const emit = defineEmits(['close'])
const store = useEventoDataStore()
const salvando = ref(false)
const erroForm = ref('')
const editando = ref(null)

const formDefault = () => ({ nome: '', papel: 'participante', telefone: '', contato_emergencia: '', restricoes_alimentares: '', leva_barraca: false, observacoes: '' })
const form = ref(formDefault())

function iniciarEdicao(p) { editando.value = p; form.value = { ...p } }
function cancelarEdicao() { editando.value = null; form.value = formDefault() }

async function salvar() {
  if (!form.value.nome) { erroForm.value = 'Nome obrigatório'; return }
  salvando.value = true; erroForm.value = ''
  const { data: { user } } = await supabase.auth.getUser()
  const payload = { ...form.value, evento_id: store.eventoId, owner_id: user.id }
  delete payload.id; delete payload.created_at

  if (editando.value) {
    const { data, error } = await supabase.from('pessoas').update(payload).eq('id', editando.value.id).select().single()
    if (error) { erroForm.value = error.message; salvando.value = false; return }
    store.updatePessoa(data)
    cancelarEdicao()
  } else {
    const { data, error } = await supabase.from('pessoas').insert(payload).select().single()
    if (error) { erroForm.value = error.message; salvando.value = false; return }
    store.addPessoa(data)
    form.value = formDefault()
  }
  salvando.value = false
}

async function excluir(id) {
  if (!confirm('Remover pessoa?')) return
  const { error } = await supabase.from('pessoas').delete().eq('id', id)
  if (!error) store.removePessoa(id)
}

function labelPapel(p) { return { participante: 'Participante', organizador: 'Organizador', voluntario: 'Voluntário', convidado: 'Convidado' }[p] || p }
</script>
