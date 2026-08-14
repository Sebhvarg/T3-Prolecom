import { test, expect } from '@playwright/test';
import { USERS, login, goToFirstCourse } from './helpers/e2e-helpers';

test.describe('Flujo del Estudiante', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, USERS.estudiante);
  });

  test('Puede ver el catálogo de cursos', async ({ page }) => {
    await page.goto('/cursos');
    await expect(page.getByText(/cursos/i).first()).toBeVisible();
  });

  test('Puede entrar al detalle de un curso y ver su progreso', async ({ page }) => {
    await goToFirstCourse(page);

    // La barra de progreso (CourseProgressBar) debe estar visible para el estudiante
    await expect(page.getByText(/mi progreso/i)).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/progreso total del curso/i)).toBeVisible();
  });

  test('Puede navegar a la pestaña del Foro dentro de un curso', async ({ page }) => {
    await goToFirstCourse(page);

    await page.getByText(/foro de preguntas/i).click();
    await expect(page.getByText(/foro/i).first()).toBeVisible();
  });

  test('Puede acceder a su perfil y ver el formulario de cambio de contraseña', async ({ page }) => {
    await page.goto('/perfil');
    await expect(page.getByText(/cambiar contraseña/i)).toBeVisible();
  });

});