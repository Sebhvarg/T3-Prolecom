// SCRUM-63 - QA: E2E - Flujo completo del perfil Ayudante
//
// CONTEXTO DE PERMISOS (verificado en backend/routes/api.php,
// TemaController::checkPermission, MaterialController::checkPermission,
// y ForoController::toggleValidarRespuesta):
// Según PB13 y PB16 del backlog, un Ayudante comparte permisos de
// gestión con Profesor sobre CUALQUIER curso (no solo los propios,
// a diferencia de Profesor): puede crear/editar/eliminar temas,
// materiales, desafíos, y además validar respuestas del foro como
// "oficiales" (PB16 - Validación / Mentoría). Confirmado en frontend:
// checkCanManage() en CursoDetallePage.jsx y checkAuthToValidate()
// en ForoSeccion.jsx incluyen 'Ayudante' explícitamente.
//
// LIMITACIÓN REAL DETECTADA (no es un bug de este test, es un gap
// de producto a reportar):
// El usuario 'ayudante' del seeder no está inscrito en ningún curso,
// y CursosPage.jsx define su propio `canManage` SIN incluir 'Ayudante':
//   const canManage = user?.rol === 'Administrador' || user?.rol === 'Profesor';
// Como hasAccess = canManage || esta_matriculado, ningún título de
// curso es clickeable para un Ayudante en el catálogo — no hay forma
// de entrar a un curso navegando por la UI normal. Por eso estos tests
// navegan DIRECTO por URL a /cursos/1 para validar los permisos reales
// dentro del curso. Sugerencia para el equipo: ¿debería existir una
// relación de "ayudantes asignados a curso", similar a idProfeCreador?

import { test, expect } from '@playwright/test';
import { USERS, login } from './helpers/e2e-helpers';

test.describe('Flujo del Ayudante', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, USERS.ayudante);
  });

  test('Ve su dashboard tras iniciar sesión', async ({ page }) => {
    await expect(page).toHaveURL(/\/ayudante\/dashboard/);
  });

  test('No ve el catálogo con cursos clickeables (limitación conocida)', async ({ page }) => {
    await page.goto('/cursos');
    await expect(page.getByText(/cursos/i).first()).toBeVisible();

    // Documenta el estado actual: sin inscripción ni "canManage" en el
    // catálogo, el Ayudante no tiene ningún título de curso clickeable.
    const testidLinks = page.getByTestId('curso-titulo-link');
    await expect(testidLinks).toHaveCount(0);
  });

  test('Dentro de un curso (acceso directo por URL), tiene permisos de gestión de contenido', async ({ page }) => {
    // Navegación directa porque la UI del catálogo no ofrece un camino
    // de entrada para este rol hoy (ver nota arriba).
    await page.goto('/cursos/1');
    await expect(page).toHaveURL(/\/cursos\/1/);

    await expect(page.getByRole('button', { name: /nuevo tema/i })).toBeVisible({ timeout: 8000 });
  });

  test('Puede ver y usar el control de validación de respuestas del Foro (PB16)', async ({ page }) => {
    await page.goto('/cursos/1');

    // La pregunta fijada del Tema 1 ya tiene una respuesta pre-validada
    // en el seeder (TestUserSeeder::seedQuestionsAndAnswers, $r1Id).
    await page.getByText(/foro del curso/i).click();

    // "Foro del Curso" primero lista los foros disponibles (ForosDelCurso);
    // hay que entrar al foro del Tema 1 -donde vive la pregunta fijada-
    // antes de que ForoSeccion renderice sus preguntas.
    await page
      .locator('div.space-y-3')
      .filter({ hasText: /tema 1: sintaxis y control de flujo/i })
      .getByRole('button', { name: /abrir foro/i })
      .click();

    await expect(page.getByText(/instrucciones y preguntas frecuentes/i)).toBeVisible({ timeout: 8000 });
    await page.getByText(/instrucciones y preguntas frecuentes/i).click();

    // Como la respuesta ya está validada, el badge "Respuesta Oficial"
    // debe ser visible, y el botón debe ofrecer "Remover Validación"
    // (confirma que Ayudante puede interactuar con el control, sin
    // necesidad de alterar el estado y afectar corridas futuras del test).
    await expect(page.getByText(/respuesta oficial/i).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: /remover validación/i })).toBeVisible();
  });

});