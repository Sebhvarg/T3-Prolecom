import { test, expect } from '@playwright/test';
import { USERS, login, logout } from './helpers/e2e-helpers';

test.describe('Autenticación por rol', () => {

  test('Administrador inicia sesión y llega a su panel', async ({ page }) => {
    await login(page, USERS.admin);
    await expect(page).toHaveURL(/\/admin/);
  });

  test('Profesor inicia sesión y llega a su dashboard', async ({ page }) => {
    await login(page, USERS.profesor);
    await expect(page).toHaveURL(/\/profesor\/dashboard/);
  });

  test('Ayudante inicia sesión y llega a su dashboard', async ({ page }) => {
    await login(page, USERS.ayudante);
    await expect(page).toHaveURL(/\/ayudante\/dashboard/);
  });

  test('Estudiante inicia sesión y llega a su dashboard', async ({ page }) => {
    await login(page, USERS.estudiante);
    await expect(page).toHaveURL(/\/dashboard\/estudiante/);
  });

  test('Login con credenciales inválidas muestra error y no redirige', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#user').fill('estudiante');
    await page.locator('#password').fill('contraseña-incorrecta');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/incorrect|inválid|error/i)).toBeVisible({ timeout: 5000 });
  });

  test('Rutas protegidas redirigen a /login si no hay sesión', async ({ page }) => {
    await logout(page);
    await page.goto('/dashboard/estudiante');
    await expect(page).toHaveURL(/\/login/);
  });

});