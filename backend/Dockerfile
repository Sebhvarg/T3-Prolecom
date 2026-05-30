# Etapa base para extensiones comunes
FROM php:8.4-apache AS base
RUN a2enmod rewrite
RUN apt-get update && apt-get install -y libzip-dev git unzip && rm -rf /var/lib/apt/lists/*
RUN docker-php-ext-install pdo pdo_mysql
RUN echo "variables_order = \"EGPCS\"" > /usr/local/etc/php/conf.d/env.ini
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf
RUN sed -i 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf
RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf
WORKDIR /var/www/html

# Etapa de Desarrollo (Incluye Composer para instalaciones al vuelo)
FROM base AS development
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
COPY . .
RUN if [ -f "composer.json" ]; then composer install --no-interaction; fi
RUN chown -R www-data:www-data /var/www/html
EXPOSE 80

# Etapa de Producción (Optimización de dependencias)
FROM composer:latest AS vendor
WORKDIR /app
COPY composer.json composer.lock* ./
RUN composer install --no-interaction --no-plugins --no-scripts --no-dev --prefer-dist

FROM base AS production
COPY . .
COPY --from=vendor /app/vendor /var/www/html/vendor
RUN chown -R www-data:www-data /var/www/html
EXPOSE 80
