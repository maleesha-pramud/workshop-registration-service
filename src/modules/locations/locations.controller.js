import * as locationsService from './locations.service.js';

export async function list(req, res) {
  res.json({ data: await locationsService.listLocations() });
}
