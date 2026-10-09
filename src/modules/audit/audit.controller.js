import * as auditService from './audit.service.js';

export async function list(req, res) {
  const { items, meta } = await auditService.listAuditLogs(req.user, req.validatedQuery);
  res.json({ data: items, meta });
}
