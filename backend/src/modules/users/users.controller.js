import * as usersService from './users.service.js';

// Controllers translate HTTP <-> service calls. Business rules live in the service.

export async function list(req, res) {
  const { items, meta } = await usersService.listUsers(req.validatedQuery);
  res.json({ data: items, meta });
}

export async function create(req, res) {
  res.status(201).json({ data: await usersService.createUser(req.body, req.user) });
}

export async function update(req, res) {
  res.json({ data: await usersService.updateUser(req.params.id, req.body, req.user) });
}

export async function resetPassword(req, res) {
  await usersService.resetPassword(req.params.id, req.body.password, req.user);
  res.status(204).end();
}
