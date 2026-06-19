<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal modal-lg">
      <div class="modal-header">
        <h2>🚗 Transporte</h2>
        <button class="btn-icon" @click="$emit('close')">✕</button>
      </div>
      <div class="modal-body">
        <!-- Indicadores -->
        <div class="calc-box mb-3">
          <div class="calc-item">
            <span class="calc-val">{{ store.totalPessoas }}</span>
            <span class="calc-lbl">pessoas a transportar</span>
          </div>
          <div class="calc-item">
            <span class="calc-val" :class="store.capacidadeTransporte >= store.totalPessoas ? 'text-success' : 'text-danger'">{{ store.capacidadeTransporte }}</span>
            <span class="calc-lbl">assentos disponíveis</span>
          </div>
          <div v-if="store.capacidadeTransporte < store.totalPessoas" class="calc-item">
            <span class="calc-val text-danger">{{ store.totalPessoas - store.capacidadeTransporte }}</span>
            <span class="calc-lbl">assentos faltando</span>
          </div>
        </div>

        <!-- Formulário -->
        <div class="card mb-3" style="padding:1rem">
          <h3 class="mb-2">{{ editando ? 'Editar veículo' : '+ Adicionar veículo' }}</h3>
          <div v-if="erroForm" class="alert alert-erro mb-2">{{ erroForm }}</div>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Tipo *</label>
              <select v-model="form.tipo" class="form-control">
                <option value="carro">Carro</option>
                <option value="van">Van</option>
                <option value="onibus">Ônibus</option>
                <option value="barco">Barco</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Identificação</label>
              <input v-model="form.identificacao" class="form-control" placeholder="Ex.: Carro do João, Barco do rancho" />
            </div>
            <div class="form-group">
              <label class="form-label">Capacidade (pessoas)</label>
              <input v-model.number="form.capacidade_pessoas" type="number" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Motorista/Piloto</label>
              <input v-model="form.motorista_piloto" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-check">
                <input v-model="form.habilitado" type="checkbox" />
                Habilitado / CNH em dia
              </label>
            </div>
            <div class="form-group">
              <label class="form-label">Custo estimado (R$)</label>
              <input v-model.number="form.custo_estimado" type="number" step="0.01" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Rota</label>
              <input v-model="form.rota" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Horário</label>
              <input v-model="form.horario" class="form-control" />
            </div>
            <div class="form-group" style="grid-column:1/-1">
              <label class="form-label">Capacidade de bagagem</label>
              <input v-model="form.capacidade_bagagem" class="form-control" />
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

        <!-- Lista de veículos -->
        <table v-if="store.transporte.length > 0" class="table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Identificação</th>
              <th>Capacidade</th>
              <th>Viagens calculadas</th>
              <th>Piloto</th>
              <th>Custo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="v in store.viagensTransporte" :key="v.id">
              <td>{{ labelTipo(v.tipo) }}</td>
              <td>{{ v.identificacao || '—' }}</td>
              <td>{{ v.capacidade_pessoas || '—' }}</td>
              <td>
                <strong v-if="v.viagens">{{ v.viagens }} viagem{{ v.viagens !== 1 ? 's' : '' }}</strong>
                <span v-else class="text-muted">—</span>
              </td>
              <td>
                {{ v.motorista_piloto || '—' }}
                <span v-if="v.tipo === 'barco' && v.habilitado === false" class="badge badge-alta ml-1">Sem habilitação</span>
              </td>
              <td>{{ v.custo_estimado ? `R$ ${Number(v.custo_estimado).toFixed(2)}` : '—' }}</td>
              <td>
                <div class="flex gap-1">
                  <button class="btn-icon" @click="iniciarEdicao(v)">✏️</button>
                  <button class="btn-icon" @click="excluir(v.id)">🗑</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">Nenhum veículo cadastrado</div>
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

const formDefault = () => ({ tipo: 'carro', identificacao: '', capacidade_pessoas: null, motorista_piloto: '', habilitado: true, custo_estimado: null, rota: '', horario: '', capacidade_bagagem: '', observacoes: '' })
const form = ref(formDefault())

function iniciarEdicao(v) { editando.value = v; form.value = { ...v } }
function cancelar() { editando.value = null; form.value = formDefault() }

async function salvar() {
  salvando.value = true; erroForm.value = ''
  const { data: { user } } = await supabase.auth.getUser()
  const payload = { ...form.value, evento_id: store.eventoId, owner_id: user.id }
  delete payload.id; delete payload.viagens; delete payload.created_at

  if (editando.value) {
    const { data, error } = await supabase.from('transporte').update(payload).eq('id', editando.value.id).select().single()
    if (error) { erroForm.value = error.message; salvando.value = false; return }
    store.updateTransporte(data); cancelar()
  } else {
    const { data, error } = await supabase.from('transporte').insert(payload).select().single()
    if (error) { erroForm.value = error.message; salvando.value = false; return }
    store.addTransporte(data); form.value = formDefault()
  }
  salvando.value = false
}

async function excluir(id) {
  if (!confirm('Excluir veículo?')) return
  const { error } = await supabase.from('transporte').delete().eq('id', id)
  if (!error) store.removeTransporte(id)
}

function labelTipo(t) { return { carro: 'Carro', van: 'Van', onibus: 'Ônibus', barco: 'Barco', outro: 'Outro' }[t] || t }
</script>

<style scoped>
.calc-box { background: #f8fafc; border: 1px solid var(--border); border-radius: 8px; padding: .75rem 1rem; display: flex; gap: 1.5rem; flex-wrap: wrap; }
.calc-item { display: flex; flex-direction: column; }
.calc-val { font-size: 1.5rem; font-weight: 700; color: var(--primary); }
.calc-lbl { font-size: .75rem; color: var(--text-muted); }
</style>
