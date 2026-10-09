// Session token persistence. Wrapped in try/catch because storage can be
// unavailable (private mode, blocked site data); the app then simply keeps the
// session in memory for the current tab.
const KEY = 'wd.token'
let memoryToken = null

export const tokenStore = {
  get() {
    try {
      return localStorage.getItem(KEY) ?? memoryToken
    } catch {
      return memoryToken
    }
  },
  set(token) {
    memoryToken = token
    try {
      localStorage.setItem(KEY, token)
    } catch {
      /* in-memory only */
    }
  },
  clear() {
    memoryToken = null
    try {
      localStorage.removeItem(KEY)
    } catch {
      /* nothing to clear */
    }
  },
}
