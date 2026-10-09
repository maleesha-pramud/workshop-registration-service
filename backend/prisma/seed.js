// Idempotent seed: safe to run repeatedly.
// By default it creates only what the business requires up front: the centre's
// three locations and the first Admin. Admins create every other account.
// SEED_DEMO=true additionally creates demo users and workshops for evaluation.
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const LOCATIONS = [
  { name: 'Colombo', address: '12 Madapatha Road' },
  { name: 'Horana', address: '40 Panadura Road' },
  { name: 'Gampaha', address: '16 Gampaha Road' },
];

async function upsertUser({ name, email, password, role }) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { name, email, passwordHash, role },
  });
}

function daysFromNow(days, hour, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function seedDemo(locations) {
  const manager = await upsertUser({
    name: 'Madushan Manager',
    email: 'manager@centre.local',
    password: 'Manager@12345',
    role: 'MANAGER',
  });
  await upsertUser({
    name: 'Kasun Staff',
    email: 'staff@centre.local',
    password: 'Staff@12345',
    role: 'STAFF',
  });

  const workshops = [
    {
      code: 'POT-101',
      title: 'Intro to Pottery',
      instructor: 'Lena Clay',
      days: 2,
      hour: 10,
      capacity: 20,
      loc: 0,
    },
    {
      code: 'CODE-201',
      title: 'Python for Beginners',
      instructor: 'Arun Patel',
      days: 3,
      hour: 18,
      capacity: 15,
      loc: 1,
    },
    {
      code: 'FIT-110',
      title: 'Morning HIIT',
      instructor: 'Jo Rivers',
      days: 1,
      hour: 7,
      capacity: 3,
      loc: 2,
    },
    {
      code: 'ART-150',
      title: 'Watercolour Basics',
      instructor: 'Mia Chen',
      days: 9,
      hour: 14,
      capacity: 12,
      loc: 0,
    },
    {
      code: 'CODE-305',
      title: 'Build a Website',
      instructor: 'Arun Patel',
      days: 12,
      hour: 18,
      capacity: 10,
      loc: 1,
    },
  ];

  for (const w of workshops) {
    const startsAt = daysFromNow(w.days, w.hour);
    await prisma.workshop.upsert({
      where: { code: w.code },
      update: {},
      create: {
        code: w.code,
        title: w.title,
        instructor: w.instructor,
        description: `${w.title} with ${w.instructor}.`,
        locationId: locations[w.loc].id,
        startsAt,
        endsAt: new Date(startsAt.getTime() + 2 * 60 * 60 * 1000),
        capacity: w.capacity,
        createdById: manager.id,
      },
    });
  }
}

async function main() {
  const locations = [];
  for (const loc of LOCATIONS) {
    locations.push(await prisma.location.upsert({ where: { name: loc.name }, update: {}, create: loc }));
  }

  const admin = await upsertUser({
    name: process.env.SEED_ADMIN_NAME || 'System Administrator',
    email: (process.env.SEED_ADMIN_EMAIL || 'admin@centre.local').toLowerCase(),
    password: process.env.SEED_ADMIN_PASSWORD || 'Admin@12345',
    role: 'ADMIN',
  });
  console.log(`Admin ready: ${admin.email}`);

  if (process.env.SEED_DEMO === 'true') {
    await seedDemo(locations);
    console.log(
      'Demo users (manager@centre.local / Manager@12345, staff@centre.local / Staff@12345) and workshops ready',
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
