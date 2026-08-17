export const USERS = {
  admin: { user: 'admin', password: 'password123', rol: 'Administrador' },
  profesor: { user: 'profesor', password: 'password123', rol: 'Profesor' },
  ayudante: { user: 'ayudante', password: 'password123', rol: 'Ayudante' },
  estudiante: { user: 'estudiante', password: 'password123', rol: 'Estudiante' },
  moderador: { user: 'moderador', password: 'password123', rol: 'Moderador' },
};

export const ROLE_REDIRECTS = {
  Administrador: '/admin',
  Moderador: '/moderador/dashboard',
  Profesor: '/profesor/dashboard',
  Ayudante: '/ayudante/dashboard',
  Estudiante: '/dashboard/estudiante',
};

/**
 * Realiza login con un usuario dado y espera la redirección a su dashboard.
 * @param {import('@playwright/test').Page} page
 * @param {{user: string, password: string, rol: string}} credentials
 */
export async function login(page, credentials) {
  await page.goto('/login');
  await page.locator('#user').fill(credentials.user);
  await page.locator('#password').fill(credentials.password);
  await page.getByRole('button', { name: /iniciar sesión/i }).click();

  const expectedPath = ROLE_REDIRECTS[credentials.rol];
  await page.waitForURL(`**${expectedPath}`, { timeout: 10000 });
}

/**
 * Cierra sesión limpiando el almacenamiento local, para dejar el
 * navegador listo para el siguiente test sin depender de un botón UI.
 * Navega primero a una página con origen válido — localStorage no es
 * accesible desde about:blank y lanza SecurityError si se intenta antes.
 * @param {import('@playwright/test').Page} page
 */
export async function logout(page) {
  await page.goto('/login');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

/**
 * Navega a /cursos y entra al primer curso al que el usuario tiene acceso.
 * Espera que la URL cambie a /cursos/:id y que el contenido del curso se cargue.
 * @param {import('@playwright/test').Page} page
 */
export async function goToFirstCourse(page) {
  await page.goto('/cursos');

  const primerCurso = page.getByTestId('curso-titulo-link').first();
  await primerCurso.waitFor({ state: 'visible', timeout: 15000 });
  await primerCurso.click();

  await page.waitForURL(/\/cursos\/\d+/, { timeout: 10000 });
}