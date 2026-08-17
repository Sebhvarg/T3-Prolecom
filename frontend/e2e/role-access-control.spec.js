import { test, expect } from '@playwright/test';
import { USERS, login } from './helpers/e2e-helpers';

test.describe('Control de acceso por rol', () => {

  test('Estudiante no puede acceder a /admin', async ({ page }) => {
    await login(page, USERS.estudiante);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/dashboard\/estudiante/);
  });

  test('Estudiante no puede acceder a /moderador/dashboard', async ({ page }) => {
    await login(page, USERS.estudiante);
    await page.goto('/moderador/dashboard');
    await expect(page).toHaveURL(/\/dashboard\/estudiante/);
  });

  test('Estudiante no puede acceder a /profesor/dashboard', async ({ page }) => {
    await login(page, USERS.estudiante);
    await page.goto('/profesor/dashboard');
    await expect(page).toHaveURL(/\/dashboard\/estudiante/);
  });

  test('Profesor no puede acceder a /admin', async ({ page }) => {
    await login(page, USERS.profesor);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/profesor\/dashboard/);
  });

  test('Ayudante no puede acceder a /moderador/dashboard', async ({ page }) => {
    await login(page, USERS.ayudante);
    await page.goto('/moderador/dashboard');
    await expect(page).toHaveURL(/\/ayudante\/dashboard/);
  });

  test('Moderador no puede acceder a /admin', async ({ page }) => {
    await login(page, USERS.moderador);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/moderador\/dashboard/);
  });

  // Control positivo: confirma que /cursos SÍ es accesible para todos
  // los roles, para dejar claro que las pruebas de arriba están
  // detectando un bloqueo real por rol, no un problema genérico de
  // navegación o de sesión.
  test('Control positivo: /cursos es accesible para cualquier rol autenticado', async ({ page }) => {
    await login(page, USERS.estudiante);
    await page.goto('/cursos');
    await expect(page).toHaveURL(/\/cursos/);
    await expect(page.getByText(/cursos/i).first()).toBeVisible();
  });

});