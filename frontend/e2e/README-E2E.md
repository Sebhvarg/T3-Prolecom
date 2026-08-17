# Pruebas End-to-End (E2E) — SCRUM-63

Suite de pruebas E2E con [Playwright](https://playwright.dev) que simula el flujo real de los distintos perfiles de usuario sobre la aplicación completa (frontend + backend + base de datos).

## Estructura

```
frontend/
  e2e/
    helpers/
      e2e-helpers.js       # Credenciales y funciones de login/logout compartidas
    auth.spec.js            # Login de los 4 roles + casos de error
    estudiante-flow.spec.js # Catálogo, detalle de curso, progreso, foro, perfil
    profesor-flow.spec.js   # Dashboard, cursos propios, gestión de temas
    admin-flow.spec.js      # Panel de administración (extensible a futuro)
  playwright.config.js
```

## Cómo correr los tests localmente

1. Levanta el proyecto completo con Docker (`docker-compose up -d`) y asegúrate de tener la BD sembrada (`php artisan migrate:fresh --seed`).
2. Instala las dependencias del frontend si no lo has hecho: `yarn install`
3. Instala los navegadores de Playwright (solo la primera vez): `npx playwright install --with-deps chromium`
4. Corre la suite completa:
   ```bash
   yarn test:e2e
   ```
5. Para depurar visualmente con la interfaz de Playwright:
   ```bash
   yarn test:e2e:ui
   ```

## Cómo agregar tests de nuevas features (SCRUM-19, SCRUM-20, SCRUM-21)

Cuando el equipo integre Quizzes, Moderación o Soporte a `dev`, crear un nuevo archivo `.spec.js` dentro de `e2e/` siguiendo el mismo patrón:

```js
import { test, expect } from '@playwright/test';
import { USERS, login } from './helpers/e2e-helpers';

test.describe('Nombre del flujo', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USERS.estudiante); // o el rol que corresponda
  });

  test('descripción del comportamiento esperado', async ({ page }) => {
    // navegar y hacer aserciones
  });
});
```

No es necesario modificar los archivos existentes — cada `.spec.js` es independiente y se ejecuta de forma aislada.

## CI/CD

Estos tests corren automáticamente como parte del pipeline de Producción (`production.yml`, SCRUM-65), después de que Backend CI y Frontend CI pasen, y antes de la aprobación manual de despliegue.