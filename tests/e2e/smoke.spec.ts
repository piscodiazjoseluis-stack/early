import { expect, test } from '@playwright/test'

test('la pantalla de acceso carga sin errores técnicos', async ({ page }) => {
  const pageErrors: Error[] = []
  page.on('pageerror', (error) => pageErrors.push(error))

  await page.goto('/iniciar-sesion')

  await expect(page.getByRole('heading', { name: 'Bienvenido de nuevo' })).toBeVisible()
  await expect(page.getByLabel('Correo corporativo')).toBeVisible()
  await expect(page.locator('#password')).toBeVisible()
  expect(pageErrors).toEqual([])
})

test('el detalle visual de aprobación abre y mantiene acciones accesibles', async ({ page }) => {
  const pageErrors: Error[] = []
  page.on('pageerror', (error) => pageErrors.push(error))

  await page.goto('/sistema-visual/jefe/aprobaciones/preview-jose')

  await expect(page.getByText('Validaciones de negocio')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Aprobar' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Rechazar' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Solicitar información' })).toBeVisible()
  expect(pageErrors).toEqual([])
})

test('el detalle no desborda horizontalmente en móvil', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'), 'Validación específica del viewport móvil')

  await page.goto('/sistema-visual/jefe/aprobaciones/preview-jose')
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }))

  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1)
})

test('el calendario operativo filtra por estado sin errores', async ({ page }) => {
  const pageErrors: Error[] = []
  page.on('pageerror', (error) => pageErrors.push(error))

  await page.goto('/sistema-visual/jefe/calendario')

  await expect(page.getByRole('heading', { name: 'Calendario del equipo' })).toBeVisible()
  await page.getByRole('combobox', { name: 'Estado' }).selectOption('USED')
  await expect(page.getByText('1 registro coincide con los filtros.')).toBeVisible()
  expect(pageErrors).toEqual([])
})

test('el reporte histórico aplica filtros y protege la exportación de la vista visual', async ({
  page,
}) => {
  await page.goto('/sistema-visual/jefe/bi-equipo')

  await page.getByRole('combobox', { name: 'Estado' }).selectOption('USED')
  await expect(
    page.getByText('1 solicitudes visibles para el reporte de Team Hugo Ramirez.'),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Exportar CSV' })).toBeDisabled()
})

test('la vista visual de análisis no escribe recomendaciones', async ({ page }) => {
  await page.goto('/sistema-visual/jefe/analisis-inteligente')

  await expect(
    page.getByText(
      'La generación se habilita al iniciar sesión; la vista visual no escribe datos en Supabase.',
    ),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Generar análisis' })).toBeDisabled()
})
