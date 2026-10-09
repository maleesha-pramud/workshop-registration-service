import * as workshopsService from './workshops.service.js';

export async function list(req, res) {
  const { items, meta } = await workshopsService.listWorkshops(req.validatedQuery);
  res.json({ data: items, meta });
}

export async function get(req, res) {
  res.json({ data: await workshopsService.getWorkshop(req.params.id) });
}

export async function create(req, res) {
  res.status(201).json({ data: await workshopsService.createWorkshop(req.body, req.user) });
}

export async function update(req, res) {
  res.json({ data: await workshopsService.updateWorkshop(req.params.id, req.body, req.user) });
}
