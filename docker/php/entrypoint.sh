#!/bin/bash
set -e

# Pastikan direktori uploads, downloads, storage, dan bootstrap/cache ada dan permission benar
mkdir -p /var/www/backend/public/uploads/icons /var/www/backend/public/downloads
chown -R www-data:www-data /var/www/backend/public /var/www/backend/storage /var/www/backend/bootstrap/cache
chmod -R 775 /var/www/backend/public /var/www/backend/storage /var/www/backend/bootstrap/cache

# Buat symbolic link storage jika belum ada
if [ ! -L /var/www/backend/public/storage ]; then
    php /var/www/backend/artisan storage:link || true
fi

# Tunggu database siap sebelum migrasi (jika berjalan sebagai app server)
if [ "$1" = "php-fpm" ]; then
    echo ">> Checking database connectivity..."
    max_retries=30
    count=0
    until php -r "new PDO('mysql:host=' . getenv('DB_HOST') . ';port=' . getenv('DB_PORT') . ';dbname=' . getenv('DB_DATABASE'), getenv('DB_USERNAME'), getenv('DB_PASSWORD'));" 2>/dev/null || [ $count -ge $max_retries ]; do
        echo ">> Waiting for database ($count/$max_retries)..."
        sleep 2
        count=$((count+1))
    done

    if [ $count -lt $max_retries ]; then
        echo ">> Database connected! Running migrations..."
        php /var/www/backend/artisan migrate --force
        
        echo ">> Caching Laravel configurations..."
        php /var/www/backend/artisan config:cache
        php /var/www/backend/artisan route:cache
        php /var/www/backend/artisan view:cache
    else
        echo ">> WARNING: Database not reachable after 60s, skipping automatic migration."
    fi
fi

exec "$@"
