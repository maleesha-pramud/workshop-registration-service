import { prisma } from '../../lib/prisma.js';

export function listLocations() {
  return prisma.location.findMany({ orderBy: { name: 'asc' } });
}
