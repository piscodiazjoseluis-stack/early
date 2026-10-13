import { expect, test } from '@playwright/test'

const base = '/sistema-visual/jefe'

type MeasuredGrid = {
  children: ArrayLike<{ getBoundingClientRect: () => { top: number; bottom: number } }>
}

test('el menú del jefe conserva activa cada vista compartida y su detalle', async ({ page }) => {
  for (const [route, label] of [
    ['mi-equipo', 'Mi equipo'],
    ['solicitudes', 'Mis solicitudes'],
    ['notificaciones', 'Notificaciones'],
    ['solicitudes/preview-jose', 'Mis solicitudes'],
  ]) {
    await page.goto(`${base}/${route}`)
    const menu = page.getByRole('button', { name: 'Abrir navegación' })
    if (await menu.isVisible()) await menu.click()
    const active = page.locator('.sidebar-nav-item[aria-current="page"]')
    await expect(active).toHaveCount(1)
    await expect(active).toContainText(label)
    await expect(active).toHaveClass(/sidebar-nav-item-active/)
  }
})

test('los paneles del jefe se alinean y la cronología permanece en flujo normal', async ({
  page,
}, testInfo) => {
  const desktop = testInfo.project.name === 'desktop-chromium'
  if (desktop) await page.setViewportSize({ width: 1600, height: 1000 })
  await page.goto(base)
  const dashboard = await page.locator('.leader-work-grid').evaluate((grid: MeasuredGrid) => {
    const panels = Array.from(grid.children).map((panel) => panel.getBoundingClientRect())
    return {
      sameRow: Math.abs(panels[0].top - panels[1].top) < 1,
      delta: Math.abs(panels[0].bottom - panels[1].bottom),
    }
  })
  expect(dashboard.sameRow).toBe(desktop)
  if (desktop) expect(dashboard.delta).toBeLessThan(1)
  await page.screenshot({
    path: `evidencias/leader-redesign/ajustes/${testInfo.project.name}-dashboard.png`,
    fullPage: true,
  })
  await page.goto(`${base}/aprobaciones/preview-valeria`)
  const evidence = await page.locator('.leader-review-evidence').evaluate((grid: MeasuredGrid) => {
    const panels = Array.from(grid.children).map((panel) => panel.getBoundingClientRect())
    return {
      sameRow: Math.abs(panels[0].top - panels[1].top) < 1,
      delta: Math.abs(panels[0].bottom - panels[1].bottom),
    }
  })
  expect(evidence.sameRow).toBe(desktop)
  if (desktop) expect(evidence.delta).toBeLessThan(1)
  await expect(page.locator('.leader-timeline-panel')).toHaveCSS('position', 'static')
  await page.screenshot({
    path: `evidencias/leader-redesign/ajustes/${testInfo.project.name}-detalle.png`,
    fullPage: true,
  })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
})

test('la bandeja conserva sus filtros y todos los datos de cada solicitud', async ({ page }) => {
  await page.goto(`${base}/aprobaciones`)
  await page.getByRole('combobox', { name: 'Estado', exact: true }).selectOption('ALL')
  await page.getByRole('combobox', { name: 'Prioridad', exact: true }).selectOption('ALL')
  await page.getByPlaceholder('Escribe un nombre...').fill('Valeria')
  await page.getByRole('button', { name: 'Aplicar filtros' }).click()
  await expect(page.getByText('Mostrando 1 de 4')).toBeVisible()
  await expect(
    page.getByText('Valeria Cabrera', { exact: true }).filter({ visible: true }),
  ).toBeVisible()
  await expect(
    page.getByText('Team Hugo Ramirez', { exact: true }).filter({ visible: true }),
  ).toBeVisible()
  await expect(
    page.getByText('13:30–15:00', { exact: true }).filter({ visible: true }),
  ).toBeVisible()
  await page.getByPlaceholder('Escribe un nombre...').fill('sin coincidencias')
  await page.getByRole('button', { name: 'Aplicar filtros' }).click()
  await expect(page.getByText('No encontramos solicitudes')).toBeVisible()
})

test('las tres decisiones abren confirmaciones conservando campos y restricciones', async ({
  page,
}, testInfo) => {
  const writes: string[] = []
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().includes('/rest/v1/rpc/'))
      writes.push(request.url())
  })
  await page.goto(`${base}/aprobaciones/preview-jose`)
  await page.getByRole('button', { name: 'Aprobar', exact: true }).click()
  const approval = page.getByRole('dialog')
  await expect(approval.getByRole('heading', { name: 'Aprobar solicitud' })).toBeVisible()
  await expect(approval.getByText('Jose Pisco', { exact: true })).toBeVisible()
  await expect(approval.getByRole('button', { name: 'Aprobar y enviar a Portfolio' })).toBeEnabled()
  await page.screenshot({
    path: `evidencias/leader-redesign/after/${testInfo.project.name}-approve-modal.png`,
  })
  await approval.getByRole('button', { name: 'Volver', exact: true }).click()
  await page.getByRole('button', { name: 'Rechazar', exact: true }).click()
  const rejection = page.getByRole('dialog')
  await expect(rejection.getByRole('button', { name: 'Confirmar rechazo' })).toBeDisabled()
  await rejection.getByLabel('Motivo', { exact: true }).fill('Prueba visual de rechazo')
  await rejection
    .getByLabel('Comentario', { exact: true })
    .fill('Solo se comprueba la presentación y la habilitación del control.')
  await expect(rejection.getByRole('button', { name: 'Confirmar rechazo' })).toBeEnabled()
  await page.screenshot({
    path: `evidencias/leader-redesign/after/${testInfo.project.name}-reject-modal.png`,
  })
  await rejection.getByRole('button', { name: 'Volver', exact: true }).click()
  await page.getByRole('button', { name: 'Solicitar información' }).click()
  const correction = page.getByRole('dialog')
  // The existing form retains its draft across decision modes.
  await correction.getByLabel('Motivo', { exact: true }).fill('')
  await correction.getByLabel('Comentario').fill('')
  await expect(correction.getByRole('button', { name: 'Devolver para corrección' })).toBeDisabled()
  await correction.getByLabel('Motivo', { exact: true }).fill('Prueba visual de devolución')
  await correction.getByLabel('Comentario').fill('Se preservan ambos campos obligatorios.')
  await expect(correction.getByRole('button', { name: 'Devolver para corrección' })).toBeEnabled()
  await page.screenshot({
    path: `evidencias/leader-redesign/after/${testInfo.project.name}-return-modal.png`,
  })
  await correction.getByRole('button', { name: 'Cerrar modal' }).press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(writes).toEqual([])
})

test('las vistas compartidas conservan la navegación en el perfil del jefe', async ({ page }) => {
  await page.goto(`${base}/solicitudes`)
  await page.getByRole('button', { name: 'Nueva solicitud', exact: true }).click()
  await expect(page).toHaveURL(/sistema-visual\/jefe\/solicitudes\/nueva$/)
  await expect(page.locator('.app-shell')).toHaveAttribute('data-experience', 'leader')
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
  await expect(page).toHaveURL(/sistema-visual\/jefe$/)
  const mobileMenu = page.getByRole('button', { name: 'Abrir navegación' })
  if (await mobileMenu.isVisible()) await mobileMenu.click()
  await page.getByRole('button', { name: 'Ayuda', exact: true }).click()
  await expect(page).toHaveURL(/sistema-visual\/jefe\/reglas-ayuda$/)
  await page.getByRole('button', { name: 'Ir a mis solicitudes', exact: true }).click()
  await expect(page).toHaveURL(/sistema-visual\/jefe\/solicitudes$/)
})

test('los otros perfiles mantienen su variante aprobada', async ({ page }) => {
  await page.goto('/sistema-visual')
  await expect(page.locator('.app-shell')).toHaveAttribute('data-experience', 'collaborator')
  await expect(page.getByRole('heading', { name: 'Hola, Jose' })).toBeVisible()
  await page.goto(`${base}/perfil`)
  await expect(page.getByLabel('Nombre completo')).toHaveValue('Hugo Ramirez')
  await page.goto('/sistema-visual/perfil')
  await expect(page.getByLabel('Nombre completo')).toHaveValue('Jose Pisco')
})
