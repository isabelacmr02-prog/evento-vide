<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal modal-lg">
      <div class="modal-header">
        <h2>⚠️ Riscos</h2>
        <button class="btn-icon" @click="$emit('close')">✕</button>
      </div>
      <div class="modal-body">
        <!-- Matriz de referência -->
        <div class="matriz-ref mb-3">
          <p class="fw-bold mb-1" style="font-size:.8rem">Matriz Probabilidade × Impacto:</p>
          <table class="matriz-table">
            <thead>
              <tr>
                <th>Prob \ Impacto</th>
                <th>Baixo</th>
                <th>Médio</th>
                <th>Alto</th>
                <th>Crítico</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="fw-bold">Baixa</td>
                <td class="sev-baixa">Baixa</td>
                <td class="sev-baixa">Baixa</td>
                <td class="sev-media">Média</td>
                <td class="sev-alta">Alta</td>
              </tr>
              <tr>
                <td class="fw-bold">Média</td>
                <td class="sev-baixa">Baixa</td>
                <td class="sev-media">Média</td>
                <td class="sev-alta">Alta</td>
                <td class="sev-critica">Crítica</td>
              </tr>
              <tr>
                <td class="fw-bold">Alta</td>
                <td class="sev-media">Média</td>
                <td class="sev-alta">Alta</td>
                <td class="sev-critica">Crítica</td>
                <td class="sev-critica">Crítica</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Formulário -->
        <div class="card mb-3" style="padding:1rem">
          <h3 class="mb-2">{{ editando ? 'Editar risco' : '+ Adicionar risco' }}</h3>
          <div v-if="erroForm" class="alert alert-erro mb-2">{{ erroForm }}</div>
          <div class="grid-2">
            <div class="form-group" style="grid-column:1/-1">
              <label class="form-label">Descrição *</label>
              <input v-model="form.descricao" class="form-control" placeholder="Ex.: Afogamento no rio" />
            </div>
            <div class="form-group">
              <label class="form-label">Categoria</label>
              <input v-model="form.categoria" class="form-control" placeholder="clima, saúde, segurança, logística..." />
            </div>
            <div class="form-group">
              <label class="form-label">Responsável</label>
              <select v-model="form.responsavel_id" class="form-control">
                <option value="">— Nenhum —</option>
                <option v-for="p in store.pessoas" :key="p.id" :value="p.id">{{ p.nome }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Probabilidade *</label>
              <select v-model="form.probabilidade" class="form-control">
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Impacto *</label>
              <select v-model="form.impacto" class="form-control">
                <option value="baixo">Baixo</option>
                <option value="medio">Médio</option>
                <option value="alto">Alto</option>
                <option value="critico">Crítico</option>
              </select>
            </div>
            <!-- Severidade calculada em tempo real -->
            <div class="form-group" style="grid-column:1/-1" v-if="form.probabilidade && form.impacto">
              <label class="form-label">Severidade calculada</label>
              <span :class="`badge badge-${severidadePreview} badge-lg`">{{ severidadePreview?.toUpperCase() }}</span>
            </div>
            <div class="form-group" style="grid-column:1/-1">
              <label class="form-label">Medidas preventivas</label>
              <textarea v-model="form.medidas_preventivas" class="form-control" rows="2"></textarea>
            </div>
            <div class="form-group" style="grid-column:1/-1">
              <label class="form-label">Plano de contingência <span v-if="['alta','critica'].includes(severidadePreview)" class="text-danger">*</span></label>
              <textarea v-model="form.plano_contingencia" class="form-control" rows="2" :placeholder="['alta','critica'].includes(severidadePreview) ? 'Obrigatório para riscos alta/crítica!' : ''"></textarea>
            </div>
            <div class="form-group" style="grid-column:1/-1">
              <label class="form-label">Observações</label>
              <textarea v-model="form.observacoes" class="form-control" rows="1"></textarea>
            </div>
          </div>
          <div class="flex gap-2 mt-1">
            <button class="btn btn-primary btn-sm" :disabled="salvando" @click="salvar">{{ salvando ? '...' : (editando ? 'Atualizar' : 'Adicionar') }}</button>
            <button v-if="editando" class="btn btn-secondary btn-sm" @click="cancelar">Cancelar</button>
          </div>
        </div>

        <!-- Lista -->
        <div v-if="store.riscos.length > 0">
          <table class="table">
            <thead>
              <tr><th>Descrição</th><th>Categoria</th><th>Prob.</th><th>Impacto</th><th>Severidade</th><th>Responsável</th><th>Contingência</th><th></th></tr>
            </thead>
            <tbody>
              <tr v-for="r in store.riscos" :key="r.id" :class="!r.plano_contingencia && ['alta','critica'].includes(r.severidade) ? 'row-alerta' : ''">
                <td><strong>{{ r.descricao }}</strong></td>
                <td>{{ r.categoria || '—' }}</td>
                <td>{{ labelProb(r.probabilidade) }}</td>
                <td>{{ labelImpacto(r.impacto) }}</td>
                <td><span :class="`badge badge-${r.severidade}`">{{ r.severidade }}</span></td>
                <td>{{ r.pessoas?.nome || '⚠️ Sem resp.' }}</td>
                <td style="font-size:.78rem;max-width:150px;overflow:hidden;text-overflow:ellipsis">
                  {{ r.plano_contingencia || '⚠️ Sem plano' }}
                </td>
                <td>
                  <div class="flex gap-1">
                    <button class="btn-icon" @click="iniciarEdicao(r)">✏️</button>
                    <button class="btn-icon" @click="excluir(r.id)">🗑</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-state">Nenhum risco cadastrado</div>
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
import { calcSeveridade } from '@/services/calculations'

const emit = defineEmits(['close'])
const store = useEventoDataStore()
const salvando = ref(false)
const erroForm = ref('')
const editando = ref(null)

const formDefault = () => ({ descricao: '', categoria: '', probabilidade: 'media', impacto: 'medio', medidas_preventivas: '', plano_contingencia: '', responsavel_id: '', observacoes: '' })
const form = ref(formDefault())

const severidadePreview = computed(() => form.value.probabilidade && form.value.impacto ? calcSeveridade(form.value.probabilidade, form.value.impacto) : null)

function iniciarEdicao(r) { editando.value = r; form.value = { ...r, responsavel_id: r.responsavel_id || '' } }
function cancelar() { editando.value = null; form.value = formDefault() }

async function salvar() {
  if (!form.value.descricao) { erroForm.value = 'Descrição obrigatória'; return }
  salvando.value = true; erroForm.value = ''
  const { data: { user } } = await supabase.auth.getUser()
  const payload = { ...form.value, responsavel_id: form.value.responsavel_id || null, evento_id: store.eventoId, owner_id: user.id }
  delete payload.id; delete payload.created_at; delete payload.severidade; delete payload.pessoas

  if (editando.value) {
    const { data, error } = await supabase.from('riscos').update(payload).eq('id', editando.value.id).select().single()
    if (error) { erroForm.value = error.message; salvando.value = false; return }
    store.updateRisco(data); cancelar()
  } else {
    const { data, error } = await supabase.from('riscos').insert(payload).select().single()
    if (error) { erroForm.value = error.message; salvando.value = false; return }
    store.addRisco(data); form.value = formDefault()
  }
  salvando.value = false
}

async function excluir(id) {
  if (!confirm('Excluir risco?')) return
  const { error } = await supabase.from('riscos').delete().eq('id', id)
  if (!error) store.removeRisco(id)
}

function labelProb(p) { return { baixa: 'Baixa', media: 'Média', alta: 'Alta' }[p] || p }
function labelImpacto(i) { return { baixo: 'Baixo', medio: 'Médio', alto: 'Alto', critico: 'Crítico' }[i] || i }
</script>

<style scoped>
.matriz-ref { background: #f8fafc; border: 1px solid var(--border); border-radius: 8px; padding: .75rem; }
.matriz-table { border-collapse: collapse; font-size: .78rem; }
.matriz-table th, .matriz-table td { padding: .3rem .6rem; border: 1px solid var(--border); text-align: center; }
.sev-baixa { background: #f0fdf4; color: #166534; font-weight: 600; }
.sev-media { background: #fffbeb; color: #92400e; font-weight: 600; }
.sev-alta { background: #fff7ed; color: #c2410c; font-weight: 600; }
.sev-critica { background: #fef2f2; color: #991b1b; font-weight: 600; }
.row-alerta td { background: #fff7ed; }
.badge-lg { font-size: .9rem; padding: .3rem .8rem; }
</style>
