import * as authService from './auth.service.js';

export async function login(req, res) {
  res.json({ data: await authService.login(req.body) });
}

export function me(req, res) {
  res.json({ data: authService.toSessionUser(req.user) });
}
