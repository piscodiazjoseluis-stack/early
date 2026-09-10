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
