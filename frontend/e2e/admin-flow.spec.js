import { test, expect } from '@playwright/test';
import { USERS, login } from './helpers/e2e-helpers';

test.describe('Flujo del Administrador', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, USERS.admin);
  });

  test('Ve su panel de administración', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin/);
  });

  test('Puede ver el catálogo completo de cursos de la plataforma', async ({ page }) => {
    await page.goto('/cursos');
    await expect(page.getByText(/cursos/i).first()).toBeVisible();
  });

  // TODO (SCRUM-62): agregar test de gestión de usuarios cuando el
  // panel de Administrador de usuarios esté disponible en /admin/usuarios.

});