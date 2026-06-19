<template>
  <div style="max-width:600px;margin:3rem auto;padding:1.5rem">
    <div class="card" style="padding:2rem">
      <h2 style="margin-bottom:1rem">🌱 Seed — Acampamento SV</h2>
      <p class="text-muted mb-3" style="font-size:.9rem">
        Popula o banco com os dados reais do Acampamento SV para demonstrar todos os cálculos e alertas do sistema.
        <br><strong>Atenção:</strong> execute apenas uma vez por conta.
      </p>
      <div v-if="sucesso" class="alert alert-ok mb-3">
        ✅ Seed executado com sucesso! Evento ID: <strong>{{ eventoId }}</strong>
        <br><button class="btn btn-primary btn-sm mt-2" @click="$router.push(`/eventos/${eventoId}`)">Abrir Dashboard</button>
      </div>
      <div v-if="erro" class="alert alert-erro mb-3">{{ erro }}</div>
      <button class="btn btn-primary" :disabled="executando" @click="executar">
        {{ executando ? '⏳ Executando seed...' : '🚀 Executar Seed do Acampamento SV' }}
      </button>
      <div class="mt-3">
        <button class="btn btn-secondary btn-sm" @click="$router.push('/eventos')">← Voltar para eventos</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '@/services/supabase'
import { seedAcampamentoSV } from '@/services/seed'

const executando = ref(false)
const sucesso = ref(false)
const erro = ref('')
const eventoId = ref('')

async function executar() {
  executando.value = true
  erro.value = ''
  sucesso.value = false
  try {
    const id = await seedAcampamentoSV(supabase)
    eventoId.value = id
    sucesso.value = true
  } catch (e) {
    erro.value = e.message || 'Erro ao executar seed'
  } finally {
    executando.value = false
  }
}
</script>
