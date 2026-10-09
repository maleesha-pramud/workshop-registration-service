import { api, unwrap } from './client'

// One function per endpoint. Components never build URLs themselves.

export const authApi = {
  login: (email, password) => unwrap(api.post('/auth/login', { email, password })),
  me: () => unwrap(api.get('/auth/me')),
}

export const usersApi = {
  list: (params) => unwrap(api.get('/users', { params })),
  create: (body) => unwrap(api.post('/users', body)),
  update: (id, body) => unwrap(api.patch(`/users/${id}`, body)),
  resetPassword: (id, password) => unwrap(api.post(`/users/${id}/reset-password`, { password })),
}

export const locationsApi = {
  list: () => unwrap(api.get('/locations')),
}

export const workshopsApi = {
  list: (params) => unwrap(api.get('/workshops', { params })),
  get: (id) => unwrap(api.get(`/workshops/${id}`)),
  create: (body) => unwrap(api.post('/workshops', body)),
  update: (id, body) => unwrap(api.patch(`/workshops/${id}`, body)),
}

export const registrationsApi = {
  listForWorkshop: (workshopId, params) =>
    unwrap(api.get(`/workshops/${workshopId}/registrations`, { params })),
  register: (workshopId, body) => unwrap(api.post(`/workshops/${workshopId}/registrations`, body)),
  cancel: (id, reason) => unwrap(api.post(`/registrations/${id}/cancel`, { reason })),
  search: (params) => unwrap(api.get('/registrations', { params })),
}

export const auditApi = {
  list: (params) => unwrap(api.get('/audit-logs', { params })),
}
