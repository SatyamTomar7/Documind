export type User = {
  id: number
  name: string
  email: string
}

export type AuthTokens = {
  accessToken: string
  refreshToken: string
}

export type AuthResponse = {
  user: User
  accessToken: string
  refreshToken: string
}
