import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { authStorage } from '../features/auth/auth.storage'

export const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

type RefreshResponse = {
  data: {
    accessToken: string
    refreshToken: string
  }
}

let refreshPromise: Promise<RefreshResponse['data']> | null = null

function refreshTokens(refreshToken: string) {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<RefreshResponse>(`${apiBaseUrl}/auth/refresh`, { refreshToken })
      .then((response) => response.data.data)
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

api.interceptors.request.use((config) => {
  const accessToken = authStorage.getAccessToken()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableRequestConfig | undefined
    const refreshToken = authStorage.getRefreshToken()

    if (
      error.response?.status !== 401 ||
      !config ||
      config._retry ||
      config.url?.includes('/auth/refresh') ||
      !refreshToken
    ) {
      return Promise.reject(error)
    }

    config._retry = true

    try {
      const tokens = await refreshTokens(refreshToken)
      authStorage.updateAccessToken(tokens.accessToken)
      authStorage.updateRefreshToken(tokens.refreshToken)
      config.headers.Authorization = `Bearer ${tokens.accessToken}`
      return api(config)
    } catch (refreshError) {
      authStorage.clear()
      return Promise.reject(refreshError)
    }
  },
)
