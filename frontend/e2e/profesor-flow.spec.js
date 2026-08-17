import { test, expect } from '@playwright/test';
import { USERS, login, goToFirstCourse } from './helpers/e2e-helpers';

test.describe('Flujo del Profesor', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, USERS.profesor);
  });

  test('Ve su dashboard con cursos asignados', async ({ page }) => {
    await expect(page).toHaveURL(/\/profesor\/dashboard/);
  });

  test('Puede ver el listado de sus cursos y entrar a uno', async ({ page }) => {
    await goToFirstCourse(page);

    await expect(page).toHaveURL(/\/cursos\/\d+/);

    // El profesor NO debe ver la barra de "Mi Progreso" (es exclusiva de estudiantes)
    await expect(page.getByText(/mi progreso/i)).not.toBeVisible();
  });

  test('Puede ver el botón de gestión de temas dentro de su curso', async ({ page }) => {
    await goToFirstCourse(page);

    await expect(page.getByRole('button', { name: /nuevo tema/i })).toBeVisible();
  });

});