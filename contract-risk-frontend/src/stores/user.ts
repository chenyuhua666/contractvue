import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LoginResponse } from '../api/auth'

const TOKEN_KEY = 'contract_risk_token'
const USER_INFO_KEY = 'contract_risk_user'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem(TOKEN_KEY) || '')
  const userInfo = ref<LoginResponse | null>(
    localStorage.getItem(USER_INFO_KEY)
      ? JSON.parse(localStorage.getItem(USER_INFO_KEY)!)
      : null
  )

  const isLoggedIn = computed(() => !!token.value)
  const username = computed(() => userInfo.value?.username || '')
  const userId = computed(() => userInfo.value?.userId || 0)
  const role = computed(() => userInfo.value?.role || '')

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem(TOKEN_KEY, newToken)
  }

  function setUserInfo(info: LoginResponse) {
    userInfo.value = info
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(info))
  }

  function login(loginResponse: LoginResponse) {
    setToken(loginResponse.token)
    setUserInfo(loginResponse)
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_INFO_KEY)
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    username,
    userId,
    role,
    login,
    logout,
    setToken,
    setUserInfo
  }
})
