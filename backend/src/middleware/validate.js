import { ValidationError } from '../lib/errors.js';

/**
 * Validates and normalises request input with zod schemas.
 * Parsed values replace the raw ones, so controllers only ever see clean data.
 * Usage: validate({ body: schema, query: schema, params: schema })
 */
export const validate = (schemas) => (req, res, next) => {
  const details = [];

  for (const part of ['params', 'query', 'body']) {
    const schema = schemas[part];
    if (!schema) continue;

    const result = schema.safeParse(req[part] ?? {});
    if (!result.success) {
      for (const issue of result.error.issues) {
        details.push({ field: [part, ...issue.path].join('.'), message: issue.message });
      }
      continue;
    }
    // Express 5 exposes req.query as a getter; store the parsed copy separately.
    if (part === 'query') req.validatedQuery = result.data;
    else req[part] = result.data;
  }

  if (details.length) return next(new ValidationError('Some fields are invalid', details));
  next();
};
