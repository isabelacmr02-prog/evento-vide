import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/services/supabase'

export const useAuthStore = defineStore('auth', () => {
  const session = ref(null)
  const loading = ref(true)

  async function init() {
    const { data } = await supabase.auth.getSession()
    session.value = data.session
    loading.value = false

    supabase.auth.onAuthStateChange((_event, s) => {
      session.value = s
    })
  }

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    session.value = data.session
  }

  async function signup(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    return data
  }

  async function logout() {
    await supabase.auth.signOut()
    session.value = null
  }

  return { session, loading, init, login, signup, logout }
})
