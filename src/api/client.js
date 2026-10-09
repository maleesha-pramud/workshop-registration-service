import axios from 'axios'
import { tokenStore } from './tokenStore'

export const SESSION_EXPIRED_EVENT = 'auth:session-expired'

/** Uniform error shape for every failed request, whatever went wrong. */
export class ApiError extends Error {
  constructor({ status, code, message, details }) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }

  /** Maps API validation details ("body.email") to { email: message } for forms. */
  fieldErrors() {
    const out = {}
    for (const d of this.details ?? []) {
      const field = d.field?.split('.').slice(1).join('.') || d.field
      if (field && !out[field]) out[field] = d.message
    }
    return out
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      return Promise.reject(
        new ApiError({
          status: 0,
          code: 'NETWORK_ERROR',
          message: 'Cannot reach the server. Check your connection and try again.',
        }),
      )
    }

    const { status, data } = error.response
    const body = data?.error ?? {}

    // Expired session or deactivated account: sign the user out everywhere.
    if (status === 401 && !error.config.url?.includes('/auth/login')) {
      tokenStore.clear()
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
    }

    return Promise.reject(
      new ApiError({
        status,
        code: body.code ?? 'UNKNOWN_ERROR',
        message: body.message ?? 'Something went wrong. Please try again.',
        details: body.details,
      }),
    )
  },
)

/** Unwraps the { data, meta } envelope used by every endpoint. */
export const unwrap = (request) => request.then((res) => res.data)
