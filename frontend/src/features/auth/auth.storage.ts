import type { AuthTokens, User } from './auth.types'

const accessTokenKey = 'documind.accessToken'
const refreshTokenKey = 'documind.refreshToken'
const userKey = 'documind.user'
const authClearedEvent = 'documind.auth-cleared'

export const authStorage = {
  getAccessToken: () => localStorage.getItem(accessTokenKey),
  getRefreshToken: () => localStorage.getItem(refreshTokenKey),
  getUser: (): User | null => {
    const storedUser = localStorage.getItem(userKey)
    if (!storedUser) return null

    try {
      return JSON.parse(storedUser) as User
    } catch {
      return null
    }
  },
  save: (auth: AuthTokens & { user: User }) => {
    localStorage.setItem(accessTokenKey, auth.accessToken)
    localStorage.setItem(refreshTokenKey, auth.refreshToken)
    localStorage.setItem(userKey, JSON.stringify(auth.user))
  },
  updateAccessToken: (accessToken: string) => {
    localStorage.setItem(accessTokenKey, accessToken)
  },
  updateRefreshToken: (refreshToken: string) => {
    localStorage.setItem(refreshTokenKey, refreshToken)
  },
  clear: () => {
    localStorage.removeItem(accessTokenKey)
    localStorage.removeItem(refreshTokenKey)
    localStorage.removeItem(userKey)
    window.dispatchEvent(new Event(authClearedEvent))
  },
  subscribeToClear: (onClear: () => void) => {
    const handleStorage = (event: StorageEvent) => {
      if (
        event.newValue === null &&
        (event.key === accessTokenKey ||
          event.key === refreshTokenKey ||
          event.key === userKey)
      ) {
        onClear()
      }
    }

    window.addEventListener(authClearedEvent, onClear)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener(authClearedEvent, onClear)
      window.removeEventListener('storage', handleStorage)
    }
  },
}
