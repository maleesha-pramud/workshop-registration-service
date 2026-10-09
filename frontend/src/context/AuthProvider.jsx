import { useCallback, useEffect, useMemo, useState } from 'react'
import { authApi } from '../api/endpoints'
import { SESSION_EXPIRED_EVENT } from '../api/client'
import { tokenStore } from '../api/tokenStore'
import { AuthContext } from './auth-context'

/**
 * Holds the signed-in user. The user's permissions come from the API
 * (GET /auth/me), so the UI and backend share one permission matrix.
 * Hiding things in the UI is only for convenience; the backend enforces it.
 *
 * status: 'loading' (restoring a saved session) | 'authenticated' | 'anonymous'
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState(() => (tokenStore.get() ? 'loading' : 'anonymous'))
  const [sessionExpired, setSessionExpired] = useState(false)

  // Restore the session on page load.
  useEffect(() => {
    if (status !== 'loading') return
    authApi
      .me()
      .then(({ data }) => {
        setUser(data)
        setStatus('authenticated')
      })
      .catch(() => {
        tokenStore.clear()
        setStatus('anonymous')
      })
  }, [status])

  // Any 401 from the API (expired token, deactivated account) signs the user out.
  useEffect(() => {
    const onExpired = () => {
      setUser(null)
      setStatus('anonymous')
      setSessionExpired(true)
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login(email, password)
    tokenStore.set(data.token)
    setUser(data.user)
    setStatus('authenticated')
    setSessionExpired(false)
    return data.user
  }, [])

  const logout = useCallback(() => {
    tokenStore.clear()
    setUser(null)
    setStatus('anonymous')
  }, [])

  const can = useCallback((permission) => Boolean(user?.permissions?.includes(permission)), [user])

  const value = useMemo(
    () => ({ user, status, sessionExpired, login, logout, can }),
    [user, status, sessionExpired, login, logout, can],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
