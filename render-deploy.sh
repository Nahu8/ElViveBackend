#!/usr/bin/env bash
set -e

cd /var/www/html

# Package discover (composer --no-scripts lo omite en build)
php artisan package:discover --ansi

# Permisos para storage y cache
chmod -R 775 storage bootstrap/cache 2>/dev/null || true

# Migraciones (crítico)
echo "Running migrations..."
php artisan migrate --force

# Storage link
php artisan storage:link 2>/dev/null || true

# Cache (opcional)
php artisan config:cache 2>/dev/null || true
php artisan route:cache 2>/dev/null || true

exec /start.sh
