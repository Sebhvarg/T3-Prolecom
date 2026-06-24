# Etapa base para extensiones de Laravel
FROM php:8.4-apache AS base

# Habilitar mod_rewrite para Laravel
RUN a2enmod rewrite

# Instalar el instalador de extensiones de PHP (muy rápido y maneja dependencias)
COPY --from=mlocati/php-extension-installer /usr/bin/install-php-extensions /usr/local/bin/

# Instalar dependencias del sistema y extensiones de PHP necesarias
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Extensiones de PHP requeridas por Laravel
RUN install-php-extensions pdo pdo_mysql mbstring zip exif pcntl bcmath gd opcache

# Configurar OPcache para desarrollo (rápido y con validación de cambios al instante)
RUN { \
    echo 'opcache.enable=1'; \
    echo 'opcache.enable_cli=1'; \
    echo 'opcache.memory_consumption=256'; \
    echo 'opcache.interned_strings_buffer=16'; \
    echo 'opcache.max_accelerated_files=20000'; \
    echo 'opcache.revalidate_freq=0'; \
    echo 'opcache.validate_timestamps=1'; \
} > /usr/local/etc/php/conf.d/docker-php-ext-opcache.ini

# Configurar límites de subida de PHP para permitir videos
RUN { \
    echo 'upload_max_filesize=100M'; \
    echo 'post_max_size=100M'; \
    echo 'memory_limit=256M'; \
} > /usr/local/etc/php/conf.d/docker-php-upload-limits.ini

# Configuración de Apache para apuntar a la carpeta /public de Laravel
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf
RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf


# Resolver conflictos de MPM deshabilitando event/worker y habilitando prefork de forma definitiva
RUN a2dismod mpm_event mpm_worker || true
RUN a2enmod mpm_prefork || true

WORKDIR /var/www/html

# Crear estructura de carpetas de almacenamiento (storage) requeridas por Laravel
RUN mkdir -p \
    storage/app/public \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/testing \
    storage/framework/views \
    storage/logs \
    bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache


# Forzar eliminación de módulos MPM conflictivos al arrancar (RUNTIME)
CMD rm -f /etc/apache2/mods-enabled/mpm_event.* /etc/apache2/mods-enabled/mpm_worker.* \
    && php artisan storage:link --force \
    && exec apache2-foreground




# Etapa de Desarrollo
FROM base AS development
# Copiar solo archivos de dependencias para aprovechar la caché
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
COPY composer.json composer.lock* ./
RUN composer install --no-interaction --no-scripts --no-autoloader

# Copiar el resto del código
COPY . .
RUN composer dump-autoload

RUN chown -R www-data:www-data /var/www/html && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache
EXPOSE 80

# Etapa de Producción (Optimización)
FROM base AS production
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
COPY composer.json composer.lock* ./
RUN composer install --no-interaction --no-dev --no-scripts --no-autoloader

COPY . .
RUN composer dump-autoload --optimize --no-dev

RUN chown -R www-data:www-data /var/www/html && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache
EXPOSE 80
