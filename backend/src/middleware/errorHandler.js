import { Prisma } from '@prisma/client';
import { AppError } from '../lib/errors.js';
import { env } from '../config/env.js';

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} not found` },
  });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  // Malformed JSON body
  if (err.type === 'entity.parse.failed') {
    return res
      .status(400)
      .json({ error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON' } });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation: a race lost against another request.
    if (err.code === 'P2002') {
      const target = [].concat(err.meta?.target ?? []).join(', ');
      return res.status(409).json({
        error: { code: 'DUPLICATE', message: `A record with this ${target || 'value'} already exists` },
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Record not found' } });
    }
  }

  // The DB-level capacity CHECK fired: application logic should prevent this,
  // but if it ever slips through, the database refuses and the user sees "full".
  if (String(err.message).includes('workshops_active_count_within_capacity_chk')) {
    return res
      .status(409)
      .json({ error: { code: 'WORKSHOP_FULL', message: 'Sorry, this workshop is full' } });
  }

  console.error(err);
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong on our side',
      ...(env.isProduction ? {} : { details: err.message }),
    },
  });
}
