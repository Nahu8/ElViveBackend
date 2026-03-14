#!/usr/bin/env bash
set -e

cd /var/www/html

echo "Running composer..."
composer install --no-dev --optimize-autoloader

echo "Caching config..."
php artisan config:cache

echo "Caching routes..."
php artisan route:cache

echo "Running migrations..."
php artisan migrate --force

echo "Creating storage link..."
php artisan storage:link 2>/dev/null || true

exec /start.sh
