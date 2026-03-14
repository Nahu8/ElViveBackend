/**
 * Crear usuario inicial. Ejecutar: node scripts/seed-user.js
 * 
 * Usa variables de entorno: SEED_USERNAME, SEED_PASSWORD, SEED_ROLE
 * Por defecto: admin / admin123 / superadmin
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const username = process.env.SEED_USERNAME || 'admin';
const password = process.env.SEED_PASSWORD || 'admin123';
const role = process.env.SEED_ROLE || 'superadmin';

async function main() {
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.log(`Usuario "${username}" ya existe.`);
    return;
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { username, password: hashed, role },
  });
  console.log(`Usuario creado: ${user.username} (${user.role})`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
