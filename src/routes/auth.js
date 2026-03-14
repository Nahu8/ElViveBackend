import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { jwtAuth } from '../middleware/jwtAuth.js';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'elvive-iglesia-secret-2024';

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 8 * 3600,
  };
  const token = jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' });

  return res.json({
    token,
    user: { id: user.id, username: user.username, role: user.role },
  });
});

router.post('/users', jwtAuth, async (req, res) => {
  if (req.jwtUser.role !== 'superadmin') {
    return res.status(403).json({ error: 'Permisos insuficientes' });
  }

  const { username, password, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return res.status(400).json({ error: 'El usuario ya existe' });
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { username, password: hashed, role: role || 'admin' },
  });

  return res.status(201).json({ id: user.id, username: user.username, role: user.role });
});

export { router as authRoutes };
