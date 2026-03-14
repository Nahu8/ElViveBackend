# Stage 1: Build frontend assets
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Laravel app
FROM richarvey/nginx-php-fpm:3.1.6

COPY . .
COPY --from=frontend /app/public/build /var/www/html/public/build

# Image config
ENV SKIP_COMPOSER 1
ENV WEBROOT /var/www/html/public
ENV PHP_ERRORS_STDERR 1
ENV RUN_SCRIPTS 1
ENV REAL_IP_HEADER 1

# Laravel config
ENV APP_ENV production
ENV APP_DEBUG false
ENV LOG_CHANNEL stderr

ENV COMPOSER_ALLOW_SUPERUSER 1

COPY render-deploy.sh /render-deploy.sh
RUN chmod +x /render-deploy.sh

CMD ["/render-deploy.sh"]
