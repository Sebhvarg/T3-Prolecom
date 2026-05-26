FROM php:8.2-apache

# Habilitar mod_rewrite de Apache para rutas limpias
RUN a2enmod rewrite

# Instalar utilidades necesarias para Composer (git y unzip)
RUN apt-get update && apt-get install -y git unzip && rm -rf /var/lib/apt/lists/*

# Instalar extensiones necesarias, incluyendo PDO MySQL
RUN docker-php-ext-install pdo pdo_mysql

# Configurar para que la variable global $_ENV lea correctamente el entorno
RUN echo "variables_order = \"EGPCS\"" > /usr/local/etc/php/conf.d/env.ini

# Cambiar el DocumentRoot de Apache y habilitar .htaccess (AllowOverride All)
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf
RUN sed -i 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf

RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Configurar el directorio de trabajo
WORKDIR /var/www/html

# Copiar archivos (en entorno de dev, el volumen de docker-compose suele sobreescribir esto)
COPY . .

# Instalar dependencias si existe composer.json
RUN if [ -f "composer.json" ]; then composer install --no-interaction --optimize-autoloader; fi

# Dar permisos a la carpeta
RUN chown -R www-data:www-data /var/www/html
