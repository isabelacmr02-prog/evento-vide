<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal modal-lg">
      <div class="modal-header">
        <h2>🎒 Materiais e Equipamentos</h2>
        <button class="btn-icon" @click="$emit('close')">✕</button>
      </div>
      <div class="modal-body">
        <!-- Itens automáticos calculados -->
        <div class="card mb-3" style="padding:.75rem 1rem;background:#eff6ff;border-color:#bfdbfe">
          <p class="fw-bold mb-1" style="font-size:.85rem;color:#1d4ed8">📊 Itens calculados automaticamente:</p>
          <div class="flex gap-3 flex-wrap">
            <div style="font-size:.85rem">
              💧 <strong>Água potável:</strong> {{ store.aguaLitros }} L ({{ store.aguaGaloes }} galões de 20L)
              — {{ store.totalPessoas }} pessoas × {{ store.dias }} dias × {{ store.evento?.litros_agua_pessoa_dia }}L
            </div>
          </div>
        </div>

        <!-- Formulário -->
        <div class="card mb-3" style="padding:1rem">
          <h3 class="mb-2">{{ editando ? 'Editar item' : '+ Adicionar material' }}</h3>
          <div v-if="erroForm" class="alert alert-erro mb-2">{{ erroForm }}</div>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Nome *</label>
              <input v-model="form.nome" class="form-control" placeholder="Ex.: Colete salva-vidas" />
            </div>
            <div class="form-group">
              <label class="form-label">Categoria</label>
              <input v-model="form.categoria" class="form-control" placeholder="som, segurança, cozinha..." />
            </div>
            <div class="form-group">
              <label class="form-label">Qtd necessária</label>
              <input v-model.number="form.qtd_necessaria" type="number" step="0.01" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Qtd disponível</label>
              <input v-model.number="form.qtd_disponivel" type="number" step="0.01" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Unidade</label>
              <input v-model="form.unidade" class="form-control" placeholder="un, kg, L..." />
            </div>
            <div class="form-group">
              <label class="form-label">Origem</label>
              <input v-model="form.origem" class="form-control" placeholder="local / comprar / emprestado / participante" />
            </div>
            <div class="form-group">
              <label class="form-label">Custo estimado (R$)</label>
              <input v-model.number="form.custo_estimado" type="number" step="0.01" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <select v-model="form.status" class="form-control">
                <option value="a_providenciar">A providenciar</option>
                <option value="reservado">Reservado</option>
                <option value="confirmado">Confirmado</option>
                <option value="no_local">No local</option>
              </select>
            </div>
            <div class="form-group" style="grid-column:1/-1">
              <label class="form-label">Observações</label>
              <textarea v-model="form.observacoes" class="form-control" rows="2"></textarea>
            </div>
          </div>
          <div class="flex gap-2 mt-1">
            <button class="btn btn-primary btn-sm" :disabled="salvando" @click="salvar">{{ salvando ? '...' : (editando ? 'Atualizar' : 'Adicionar') }}</button>
            <button v-if="editando" class="btn btn-secondary btn-sm" @click="cancelar">Cancelar</button>
          </div>
        </div>

        <!-- Lista -->
        <div v-if="store.materiais.length > 0">
          <div class="flex gap-2 mb-2 flex-wrap">
            <button v-for="cat in categorias" :key="cat" class="btn btn-secondary btn-sm" :class="{ 'btn-primary': filtroCategoria === cat }" @click="filtroCategoria = filtroCategoria === cat ? '' : cat">{{ cat }}</button>
          </div>
          <table class="table">
            <thead>
              <tr><th>Nome</th><th>Categoria</th><th>Necessário</th><th>Disponível</th><th>Origem</th><th>Custo</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              <tr v-for="m in materiaisFiltrados" :key="m.id" :class="m.qtd_disponivel < m.qtd_necessaria ? 'row-alerta' : ''">
                <td><strong>{{ m.nome }}</strong></td>
                <td>{{ m.categoria || '—' }}</td>
                <td>{{ m.qtd_necessaria != null ? `${m.qtd_necessaria} ${m.unidade || ''}` : '—' }}</td>
                <td>{{ m.qtd_disponivel != null ? `${m.qtd_disponivel} ${m.unidade || ''}` : '—' }}</td>
                <td>{{ m.origem || '—' }}</td>
                <td>{{ m.custo_estimado ? `R$ ${Number(m.custo_estimado).toFixed(2)}` : '—' }}</td>
                <td><span :class="`badge badge-${m.status}`">{{ labelStatus(m.status) }}</span></td>
                <td>
                  <div class="flex gap-1">
                    <button class="btn-icon" @click="iniciarEdicao(m)">✏️</button>
                    <button class="btn-icon" @click="excluir(m.id)">🗑</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-state">Nenhum material cadastrado</div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('close')">Fechar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useEventoDataStore } from '@/stores/eventoData'
import { supabase } from '@/services/supabase'

const emit = defineEmits(['close'])
const store = useEventoDataStore()
const salvando = ref(false)
const erroForm = ref('')
const editando = ref(null)
const filtroCategoria = ref('')

const formDefault = () => ({ nome: '', categoria: '', qtd_necessaria: null, qtd_disponivel: 0, unidade: '', origem: '', custo_estimado: null, status: 'a_providenciar', observacoes: '' })
const form = ref(formDefault())

const categorias = computed(() => [...new Set(store.materiais.map(m => m.categoria).filter(Boolean))])
const materiaisFiltrados = computed(() => filtroCategoria.value ? store.materiais.filter(m => m.categoria === filtroCategoria.value) : store.materiais)

function iniciarEdicao(m) { editando.value = m; form.value = { ...m } }
function cancelar() { editando.value = null; form.value = formDefault() }

async function salvar() {
  if (!form.value.nome) { erroForm.value = 'Nome obrigatório'; return }
  salvando.value = true; erroForm.value = ''
  const { data: { user } } = await supabase.auth.getUser()
  const payload = { ...form.value, evento_id: store.eventoId, owner_id: user.id }
  delete payload.id; delete payload.created_at

  if (editando.value) {
    const { data, error } = await supabase.from('materiais').update(payload).eq('id', editando.value.id).select().single()
    if (error) { erroForm.value = error.message; salvando.value = false; return }
    store.updateMaterial(data); cancelar()
  } else {
    const { data, error } = await supabase.from('materiais').insert(payload).select().single()
    if (error) { erroForm.value = error.message; salvando.value = false; return }
    store.addMaterial(data); form.value = formDefault()
  }
  salvando.value = false
}

async function excluir(id) {
  if (!confirm('Excluir material?')) return
  const { error } = await supabase.from('materiais').delete().eq('id', id)
  if (!error) store.removeMaterial(id)
}

function labelStatus(s) { return { a_providenciar: 'Providenciar', reservado: 'Reservado', confirmado: 'Confirmado', no_local: 'No local' }[s] || s }
</script>

<style scoped>
.row-alerta td { background: #fff7ed; }
</style>
