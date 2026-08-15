import { test, expect } from '@playwright/test';
import { USERS, login } from './helpers/e2e-helpers';

test.describe('Flujo del Moderador', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, USERS.moderador);
  });

  test('Ve el Panel de Supervisión de Contenido con sus métricas', async ({ page }) => {
    await expect(page).toHaveURL(/\/moderador\/dashboard/);
    await expect(page.getByText(/panel de supervisión de contenido/i)).toBeVisible();
    await expect(page.getByText(/reportes pendientes/i)).toBeVisible();
    await expect(page.getByText(/reportes resueltos/i)).toBeVisible();
  });

  test(
    'Ve el registro de auditoría de acciones del sistema',
    async ({ page }) => {
      await page.getByRole('button', { name: /auditoría/i }).click();
      await expect(
        page.getByText(/registro de auditoría de acciones del sistema/i)
      ).toBeVisible({ timeout: 8000 });
    }
  );

});