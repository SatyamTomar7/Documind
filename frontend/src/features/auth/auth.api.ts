import { api } from '../../lib/api'
import type { AuthResponse, User } from './auth.types'

type ApiEnvelope<T> = {
  data: T
}

export const login = async (email: string, password: string) => {
  const response = await api.post<ApiEnvelope<AuthResponse>>('/auth/login', {
    email,
    password,
  })

  return response.data.data
}

export const register = async (
  name: string,
  email: string,
  password: string,
) => {
  const response = await api.post<ApiEnvelope<User>>('/users', {
    name,
    email,
    password,
  })

  return response.data.data
}

export const refreshAccessToken = async (refreshToken: string) => {
  const response = await api.post<ApiEnvelope<{ accessToken: string; refreshToken: string }>>(
    '/auth/refresh',
    { refreshToken },
  )

  return response.data.data
}
