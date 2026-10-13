import { expect, test } from '@playwright/test'

const base = '/sistema-visual/portfolio'
test('las once vistas ejecutivas conservan shell, título y navegación', async ({ page }) => {
  for (const route of [
    '',
    '/aprobaciones',
    '/aprobaciones/preview-23-may',
    '/calendario',
    '/equipos',
    '/bi-global',
    '/analisis-inteligente',
    '/excepciones-auditoria',
    '/notificaciones',
    '/perfil',
    '/reglas-ayuda',
  ]) {
    await page.goto(`${base}${route}`)
    await expect(page.locator('.app-shell')).toHaveAttribute('data-experience', 'portfolio')
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    await expect(page.getByText('No pudimos mostrar esta pantalla', { exact: true })).toHaveCount(0)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true)
    if (route === '' && (page.viewportSize()?.width ?? 1600) <= 767) {
      const context = page.locator('.portfolio-context-grid')
      const fullWidth = (await context.boundingBox()).width
      for (const card of await context.locator(':scope > *').all()) {
        expect((await card.boundingBox()).width).toBeGreaterThan(fullWidth - 2)
      }
    }
  }
})

test('la decisión final mantiene contexto, validaciones y simulación sin escrituras', async ({
  page,
}, info) => {
  const writes: string[] = []
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().includes('/rest/v1/rpc/'))
      writes.push(request.url())
  })
  await page.goto(`${base}/aprobaciones`)
  await expect(page.getByRole('combobox', { name: 'Estado', exact: true })).toHaveValue(
    'PENDING_PORTFOLIO',
  )
  await page.getByPlaceholder('Escribe un nombre...').fill('no existe')
  await page.getByRole('button', { name: 'Aplicar filtros' }).click()
  await expect(page.getByText('No encontramos solicitudes')).toBeVisible()
  await page.goto(`${base}/aprobaciones/preview-23-may`)
  await expect(page.locator('.leader-timeline-panel')).toHaveCSS('position', 'static')
  await page.getByRole('button', { name: 'Aprobar', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText('Jose Pisco', { exact: true })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Confirmar aprobación final' })).toBeEnabled()
  await expect(dialog).toHaveCSS('opacity', '1')
  await page.screenshot({
    path: `evidencias/portfolio-redesign/after/${info.project.name}-aprobar.png`,
  })
  await dialog.getByRole('button', { name: 'Volver', exact: true }).click()
  await page.getByRole('button', { name: 'Rechazar', exact: true }).click()
  await expect(dialog.getByRole('button', { name: 'Confirmar rechazo' })).toBeDisabled()
  await dialog.getByLabel('Motivo', { exact: true }).fill('Prueba de presentación')
  await dialog.getByLabel('Comentario').fill('No se envían decisiones a Supabase.')
  await expect(dialog.getByRole('button', { name: 'Confirmar rechazo' })).toBeEnabled()
  await page.screenshot({
    path: `evidencias/portfolio-redesign/after/${info.project.name}-rechazar.png`,
  })
  await dialog.getByRole('button', { name: 'Cerrar modal' }).press('Escape')
  expect(writes).toEqual([])
})

test('BI conserva filtros, gráficos, modal de personas y protección de insight', async ({
  page,
}, info) => {
  await page.goto(`${base}/bi-global`)
  await expect(
    page.getByRole('heading', { name: 'Solicitudes por viernes solicitado' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Ver todas las personas' }).click()
  await expect(
    page
      .getByRole('dialog')
      .getByRole('heading', { name: 'Personas que aún no utilizaron el beneficio' }),
  ).toBeInViewport()
  await expect(page.getByRole('dialog')).toHaveCSS('opacity', '1')
  await page.screenshot({
    path: `evidencias/portfolio-redesign/after/${info.project.name}-personas.png`,
  })
  await page.getByRole('button', { name: 'Cerrar modal' }).press('Escape')
  await page.getByRole('combobox', { name: 'Estado', exact: true }).selectOption('USED')
  await expect(
    page.locator('.portfolio-report-metrics .portfolio-kpi').first().locator('p').nth(1),
  ).toHaveText('2')
  await page.goto(`${base}/analisis-inteligente`)
  await expect(page.getByRole('button', { name: 'Generar análisis', exact: true })).toBeDisabled()
  await page.goto(`${base}/excepciones-auditoria`)
  await page.getByRole('button', { name: /Ver excepciones abiertas/ }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByText('Corrección', { exact: true })).toBeVisible()
})

test('formularios administrativos retienen campos y no guardan datos en demo', async ({
  page,
}, info) => {
  await page.goto(`${base}/equipos`)
  for (const [button, title] of [
    ['Crear equipo', 'Crear equipo'],
    ['Editar equipo', 'Editar equipo'],
    ['Asignar jefe', 'Asignar jefe directo'],
    ['Agregar integrante', 'Agregar o mover integrante'],
    ['Configurar elegibilidad', 'Configurar elegibilidad'],
  ]) {
    await page.getByRole('button', { name: button, exact: true }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: title, exact: true })).toBeVisible()
    await expect(
      dialog.getByRole('button', {
        name: button === 'Crear equipo' ? 'Crear equipo' : 'Guardar cambios',
        exact: true,
      }),
    ).toBeDisabled()
    await page.screenshot({
      path: `evidencias/portfolio-redesign/after/${info.project.name}-${button.replaceAll(' ', '-')}.png`,
    })
    await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click()
  }
  await page.goto(`${base}/perfil`)
  await expect(page.getByLabel('Nombre completo')).toHaveValue('María Luisa Temoche')
  await page.goto('/sistema-visual/jefe/perfil')
  await expect(page.getByLabel('Nombre completo')).toHaveValue('Hugo Ramirez')
  await page.goto('/sistema-visual/perfil')
  await expect(page.getByLabel('Nombre completo')).toHaveValue('Jose Pisco')
})
