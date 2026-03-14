#!/usr/bin/env bash
set -e

cd /app

# Verificar MySQL
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: Configura DATABASE_URL en Render Environment (formato: mysql://user:pass@host:port/db)"
  exit 1
fi

# Migraciones
echo "Running migrations..."
npx prisma migrate deploy

# Crear directorios necesarios
mkdir -p storage/app/public/uploads
mkdir -p storage/app/public/uploads/images
mkdir -p storage/app/public/uploads/videos
mkdir -p storage/app/public/uploads/icons

exec node src/server.js
