import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

import { apiRoutes } from './routes/api.js';
import { publicRoutes } from './routes/public.js';
import { authRoutes } from './routes/auth.js';
import { adminMediaRoutes } from './routes/admin-media.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8000;

// CORS
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] }));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files (build from Vite, public assets)
app.use(express.static(path.join(__dirname, '../public')));
// Storage (uploads) - same as Laravel's storage:link
app.use('/storage', express.static(path.join(__dirname, '../storage/app/public')));

// Routes
app.use('/api', apiRoutes);
app.use('/public', publicRoutes);
app.use('/auth', authRoutes);
app.use('/admin/media', adminMediaRoutes);

// Health
app.get('/up', (req, res) => res.status(200).send('OK'));
app.get('/api/health', (req, res) =>
  res.json({ status: 'OK', message: 'API funcionando correctamente', database: 'MySQL' })
);

// SPA fallback (si existe index.html)
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../public/index.html');
  if (existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
