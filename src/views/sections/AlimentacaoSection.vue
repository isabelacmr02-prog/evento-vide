<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal modal-lg">
      <div class="modal-header">
        <h2>🍽 Alimentação</h2>
        <button class="btn-icon" @click="$emit('close')">✕</button>
      </div>
      <div class="modal-body">
        <!-- Indicadores calculados -->
        <div class="calc-box mb-3">
          <div class="calc-item">
            <span class="calc-val">{{ store.aguaLitros }} L</span>
            <span class="calc-lbl">Água necessária ({{ store.totalPessoas }} pessoas × {{ store.dias }} dias × {{ store.evento?.litros_agua_pessoa_dia }}L)</span>
          </div>
          <div class="calc-item">
            <span class="calc-val">{{ store.aguaGaloes }}</span>
            <span class="calc-lbl">Galões de 20L</span>
          </div>
          <div class="calc-item">
            <span class="calc-val">{{ store.evento?.folga_alimentacao_pct }}%</span>
            <span class="calc-lbl">Folga nas quantidades</span>
          </div>
        </div>

        <!-- Restrições alimentares -->
        <div v-if="store.pessoas.filter(p=>p.restricoes_alimentares).length > 0" class="alert alert-atencao mb-3">
          <strong>Restrições alimentares:</strong>
          <ul style="margin:.3rem 0 0 1rem;font-size:.85rem">
            <li v-for="p in store.pessoas.filter(x=>x.restricoes_alimentares)" :key="p.id">
              <strong>{{ p.nome }}:</strong> {{ p.restricoes_alimentares }}
            </li>
          </ul>
        </div>

        <!-- Adicionar refeição -->
        <div class="card mb-3" style="padding:1rem">
          <h3 class="mb-2">+ Adicionar Refeição</h3>
          <div v-if="erroRef" class="alert alert-erro mb-2">{{ erroRef }}</div>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Data</label>
              <input v-model="formRef.data" type="date" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Tipo</label>
              <select v-model="formRef.tipo" class="form-control">
                <option value="cafe_manha">Café da manhã</option>
                <option value="almoco">Almoço</option>
                <option value="lanche">Lanche</option>
                <option value="jantar">Jantar</option>
                <option value="ceia">Ceia</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div class="form-group" style="grid-column:1/-1">
              <label class="form-label">Descrição</label>
              <input v-model="formRef.descricao" class="form-control" placeholder="Ex.: Galinhada, salada de repolho" />
            </div>
          </div>
          <button class="btn btn-primary btn-sm" :disabled="salvandoRef" @click="adicionarRefeicao">{{ salvandoRef ? '...' : 'Adicionar' }}</button>
        </div>

        <!-- Lista de refeições por dia -->
        <div v-for="(refs, dia) in refeicoesPorDia" :key="dia" class="mb-4">
          <h3 class="mb-2" style="border-bottom:2px solid var(--primary);padding-bottom:.3rem">📅 {{ formatarData(dia) }}</h3>
          <div v-for="ref in refs" :key="ref.id" class="ref-block card mb-2">
            <div class="ref-header">
              <strong>{{ labelTipo(ref.tipo) }}</strong>
              <span class="text-muted" style="font-size:.82rem">{{ ref.descricao }}</span>
              <div class="flex gap-1 ml-auto">
                <button class="btn-icon btn-sm" @click="excluirRefeicao(ref.id)">🗑</button>
              </div>
            </div>
            <!-- Itens do cardápio -->
            <div class="ref-itens">
              <div v-for="item in ref.cardapio_itens" :key="item.id" class="cardapio-item">
                <span>{{ item.nome }}</span>
                <span class="text-muted" style="font-size:.8rem">
                  {{ item.qtd_por_pessoa ? `${item.qtd_por_pessoa} ${item.unidade || ''}/pessoa → ${calcTotal(item.qtd_por_pessoa)} ${item.unidade || ''}` : '' }}
                </span>
                <button class="btn-icon btn-sm" @click="excluirItem(ref.id, item.id)">✕</button>
              </div>
              <!-- Adicionar item -->
              <div class="add-item-row">
                <input v-model="novoItem[ref.id].nome" class="form-control" placeholder="Item (ex.: arroz)" style="flex:2" />
                <input v-model.number="novoItem[ref.id].qtd_por_pessoa" type="number" step="0.01" class="form-control" placeholder="Qtd/pessoa" style="flex:1" />
                <input v-model="novoItem[ref.id].unidade" class="form-control" placeholder="Un (kg, un, L)" style="flex:1" />
                <button class="btn btn-secondary btn-sm" @click="adicionarItem(ref.id)">+</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Lista de compras consolidada -->
        <div v-if="store.listaCompras.length > 0" class="card" style="padding:1rem">
          <h3 class="mb-2">🛒 Lista de Compras Calculada (com {{ store.evento?.folga_alimentacao_pct }}% de folga)</h3>
          <table class="table">
            <thead><tr><th>Item</th><th>Quantidade Total</th><th>Unidade</th></tr></thead>
            <tbody>
              <tr v-for="item in store.listaCompras" :key="item.nome">
                <td>{{ item.nome }}</td>
                <td><strong>{{ item.qtd }}</strong></td>
                <td>{{ item.unidade }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('close')">Fechar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useEventoDataStore } from '@/stores/eventoData'
import { supabase } from '@/services/supabase'
import { calcQtdCompra } from '@/services/calculations'

const emit = defineEmits(['close'])
const store = useEventoDataStore()
const salvandoRef = ref(false)
const erroRef = ref('')
const formRef = ref({ data: store.evento?.data_inicio || '', tipo: 'cafe_manha', descricao: '' })
const novoItem = reactive({})

// Inicializar novoItem para cada refeição existente
store.refeicoes.forEach(r => { novoItem[r.id] = { nome: '', qtd_por_pessoa: null, unidade: '' } })

const refeicoesPorDia = computed(() => {
  const grupos = {}
  for (const ref of store.refeicoes) {
    if (!grupos[ref.data]) grupos[ref.data] = []
    grupos[ref.data].push(ref)
  }
  return grupos
})

function calcTotal(qtdPorPessoa) {
  return Math.ceil(calcQtdCompra(qtdPorPessoa, store.totalPessoas, store.evento?.folga_alimentacao_pct ?? 10) * 100) / 100
}

async function adicionarRefeicao() {
  if (!formRef.value.data) { erroRef.value = 'Data obrigatória'; return }
  salvandoRef.value = true; erroRef.value = ''
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase.from('refeicoes').insert({ ...formRef.value, evento_id: store.eventoId, owner_id: user.id }).select().single()
  if (error) { erroRef.value = error.message; salvandoRef.value = false; return }
  store.addRefeicao(data)
  novoItem[data.id] = { nome: '', qtd_por_pessoa: null, unidade: '' }
  formRef.value = { data: store.evento?.data_inicio || '', tipo: 'cafe_manha', descricao: '' }
  salvandoRef.value = false
}

async function excluirRefeicao(id) {
  if (!confirm('Excluir refeição e todos os itens?')) return
  const { error } = await supabase.from('refeicoes').delete().eq('id', id)
  if (!error) store.removeRefeicao(id)
}

async function adicionarItem(refId) {
  const item = novoItem[refId]
  if (!item?.nome) return
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase.from('cardapio_itens').insert({ ...item, refeicao_id: refId, owner_id: user.id }).select().single()
  if (!error) { store.addCardapioItem(refId, data); novoItem[refId] = { nome: '', qtd_por_pessoa: null, unidade: '' } }
}

async function excluirItem(refId, itemId) {
  const { error } = await supabase.from('cardapio_itens').delete().eq('id', itemId)
  if (!error) store.removeCardapioItem(refId, itemId)
}

function formatarData(d) { return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }) }
function labelTipo(t) { return { cafe_manha: 'Café da manhã', almoco: 'Almoço', lanche: 'Lanche', jantar: 'Jantar', ceia: 'Ceia', outro: 'Outro' }[t] || t }
</script>

<style scoped>
.calc-box { background: #f8fafc; border: 1px solid var(--border); border-radius: 8px; padding: .75rem 1rem; display: flex; gap: 1.5rem; flex-wrap: wrap; }
.calc-item { display: flex; flex-direction: column; }
.calc-val { font-size: 1.4rem; font-weight: 700; color: var(--primary); }
.calc-lbl { font-size: .75rem; color: var(--text-muted); }
.ref-block { overflow: hidden; }
.ref-header { padding: .6rem 1rem; background: #f8fafc; display: flex; align-items: center; gap: .75rem; border-bottom: 1px solid var(--border); }
.ref-itens { padding: .5rem 1rem; }
.cardapio-item { display: flex; align-items: center; gap: .5rem; padding: .25rem 0; font-size: .85rem; border-bottom: 1px solid #f8fafc; }
.cardapio-item span:first-child { flex: 1; }
.cardapio-item span:nth-child(2) { flex: 2; }
.add-item-row { display: flex; gap: .4rem; margin-top: .4rem; align-items: center; }
</style>
