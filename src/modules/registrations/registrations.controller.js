import * as registrationsService from './registrations.service.js';

export async function listForWorkshop(req, res) {
  const items = await registrationsService.listForWorkshop(req.params.workshopId, req.validatedQuery);
  res.json({ data: items });
}

export async function register(req, res) {
  const registration = await registrationsService.register(req.params.workshopId, req.body, req.user);
  res.status(201).json({ data: registration });
}

export async function search(req, res) {
  const { items, meta } = await registrationsService.search(req.validatedQuery);
  res.json({ data: items, meta });
}

export async function cancel(req, res) {
  res.json({ data: await registrationsService.cancel(req.params.id, req.body, req.user) });
}
