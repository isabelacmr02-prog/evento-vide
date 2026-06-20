<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal modal-lg">
      <div class="modal-header">
        <h2>💰 Orçamento</h2>
        <button class="btn-icon" @click="$emit('close')">✕</button>
      </div>
      <div class="modal-body">
        <!-- Resumo calculado -->
        <div class="resumo-grid mb-4">
          <div class="resumo-card resumo-receita">
            <span class="resumo-label">Total Receitas</span>
            <span class="resumo-val">R$ {{ fmt(store.resumoFinanceiro.receitas) }}</span>
          </div>
          <div class="resumo-card resumo-despesa">
            <span class="resumo-label">Total Despesas</span>
            <span class="resumo-val">R$ {{ fmt(store.resumoFinanceiro.despesas) }}</span>
          </div>
          <div class="resumo-card" :class="store.resumoFinanceiro.saldo >= 0 ? 'resumo-positivo' : 'resumo-negativo'">
            <span class="resumo-label">Saldo</span>
            <span class="resumo-val">R$ {{ fmt(store.resumoFinanceiro.saldo) }}</span>
          </div>
          <div class="resumo-card resumo-neutro">
            <span class="resumo-label">Custo por pessoa</span>
            <span class="resumo-val">R$ {{ fmt(store.custoPorPessoa) }}</span>
          </div>
        </div>

        <!-- Adicionar item -->
        <div class="card mb-3" style="padding:1rem">
          <h3 class="mb-2">{{ editando ? 'Editar item' : '+ Adicionar item financeiro' }}</h3>
          <div v-if="erroForm" class="alert alert-erro mb-2">{{ erroForm }}</div>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Tipo *</label>
              <select v-model="form.tipo" class="form-control">
                <option value="receita">Receita</option>
                <option value="despesa">Despesa</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Categoria</label>
              <input v-model="form.categoria" class="form-control" placeholder="inscrições, alimentação, transporte..." />
            </div>
            <div class="form-group" style="grid-column:1/-1">
              <label class="form-label">Descrição</label>
              <input v-model="form.descricao" class="form-control" placeholder="Ex.: Aluguel do rancho" />
            </div>
            <div class="form-group">
              <label class="form-label">Valor *</label>
              <CurrencyInput v-model="form.valor" placeholder="0,00" />
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <select v-model="form.status" class="form-control">
                <option value="previsto">Previsto</option>
                <option value="confirmado">Confirmado</option>
                <option value="pago_recebido">Pago / Recebido</option>
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

        <!-- Tabelas Receitas / Despesas -->
        <div class="grid-2">
          <div>
            <h3 class="mb-2 text-success">↑ Receitas</h3>
            <table class="table" v-if="receitas.length > 0">
              <thead><tr><th>Descrição</th><th>Categoria</th><th>Valor</th><th>Status</th><th></th></tr></thead>
              <tbody>
                <tr v-for="f in receitas" :key="f.id">
                  <td>{{ f.descricao || f.categoria }}</td>
                  <td>{{ f.categoria }}</td>
                  <td class="text-success fw-bold">R$ {{ fmt(f.valor) }}</td>
                  <td><span :class="`badge badge-${badgeStatus(f.status)}`">{{ labelStatus(f.status) }}</span></td>
                  <td><div class="flex gap-1"><button class="btn-icon" @click="iniciarEdicao(f)">✏️</button><button class="btn-icon" @click="excluir(f.id)">🗑</button></div></td>
                </tr>
              </tbody>
            </table>
            <div v-else class="alert alert-atencao" style="font-size:.82rem">Nenhuma receita cadastrada</div>
          </div>
          <div>
            <h3 class="mb-2 text-danger">↓ Despesas</h3>
            <table class="table" v-if="despesas.length > 0">
              <thead><tr><th>Descrição</th><th>Categoria</th><th>Valor</th><th>Status</th><th></th></tr></thead>
              <tbody>
                <tr v-for="f in despesas" :key="f.id">
                  <td>{{ f.descricao || f.categoria }}</td>
                  <td>{{ f.categoria }}</td>
                  <td class="text-danger fw-bold">R$ {{ fmt(f.valor) }}</td>
                  <td><span :class="`badge badge-${badgeStatus(f.status)}`">{{ labelStatus(f.status) }}</span></td>
                  <td><div class="flex gap-1"><button class="btn-icon" @click="iniciarEdicao(f)">✏️</button><button class="btn-icon" @click="excluir(f.id)">🗑</button></div></td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty-state" style="padding:.5rem">Nenhuma despesa</div>
          </div>
        </div>
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
import CurrencyInput from '@/components/common/CurrencyInput.vue'

const emit = defineEmits(['close'])
const store = useEventoDataStore()
const salvando = ref(false)
const erroForm = ref('')
const editando = ref(null)

const formDefault = () => ({ tipo: 'despesa', categoria: '', descricao: '', valor: null, status: 'previsto', observacoes: '' })
const form = ref(formDefault())

const receitas = computed(() => store.financeiro.filter(f => f.tipo === 'receita'))
const despesas = computed(() => store.financeiro.filter(f => f.tipo === 'despesa'))

function iniciarEdicao(f) { editando.value = f; form.value = { ...f } }
function cancelar() { editando.value = null; form.value = formDefault() }

async function salvar() {
  if (!form.value.valor) { erroForm.value = 'Valor obrigatório'; return }
  salvando.value = true; erroForm.value = ''
  const { data: { user } } = await supabase.auth.getUser()
  const payload = { ...form.value, evento_id: store.eventoId, owner_id: user.id }
  delete payload.id; delete payload.created_at

  if (editando.value) {
    const { data, error } = await supabase.from('financeiro').update(payload).eq('id', editando.value.id).select().single()
    if (error) { erroForm.value = error.message; salvando.value = false; return }
    store.updateFinanceiro(data); cancelar()
  } else {
    const { data, error } = await supabase.from('financeiro').insert(payload).select().single()
    if (error) { erroForm.value = error.message; salvando.value = false; return }
    store.addFinanceiro(data); form.value = formDefault()
  }
  salvando.value = false
}

async function excluir(id) {
  if (!confirm('Excluir item?')) return
  const { error } = await supabase.from('financeiro').delete().eq('id', id)
  if (!error) store.removeFinanceiro(id)
}

function fmt(n) { return Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function labelStatus(s) { return { previsto: 'Previsto', confirmado: 'Confirmado', pago_recebido: 'Pago/Recebido' }[s] || s }
function badgeStatus(s) { return { previsto: 'pendente', confirmado: 'em_andamento', pago_recebido: 'concluida' }[s] || 'pendente' }
</script>

<style scoped>
.resumo-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: .75rem; }
@media (max-width: 768px) { .resumo-grid { grid-template-columns: 1fr 1fr; } }
.resumo-card { border-radius: 8px; padding: .75rem 1rem; display: flex; flex-direction: column; gap: .2rem; border: 1px solid transparent; }
.resumo-label { font-size: .75rem; font-weight: 600; text-transform: uppercase; letter-spacing: .03em; }
.resumo-val { font-size: 1.35rem; font-weight: 700; }
.resumo-receita { background: #f0fdf4; border-color: #bbf7d0; color: #166534; }
.resumo-despesa { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
.resumo-positivo { background: #f0fdf4; border-color: #86efac; color: #166534; }
.resumo-negativo { background: #fef2f2; border-color: #fca5a5; color: #991b1b; }
.resumo-neutro { background: #f8fafc; border-color: var(--border); color: var(--text); }
</style>
