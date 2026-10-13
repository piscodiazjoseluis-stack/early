import { expect, test } from '@playwright/test'

test('el estado del detalle se ajusta al texto en los tres perfiles', async ({ page }) => {
  for (const route of [
    '/sistema-visual/solicitudes/preview-returned',
    '/sistema-visual/jefe/aprobaciones/preview-jose',
    '/sistema-visual/portfolio/aprobaciones/preview-23-may',
  ]) {
    await page.goto(route)
    const badge = route.includes('/solicitudes/')
      ? page.locator('.collab-request-detail-page span.rounded-full').first()
      : page
          .locator('.leader-object-header')
          .getByText(/^(Pendiente del jefe|Pendiente de Portfolio)$/)
    await expect(badge).toBeVisible()
    await expect
      .poll(() =>
        badge.evaluate((element) => {
          const range = document.createRange()
          range.selectNodeContents(element)
          const style = getComputedStyle(element)
          const fittedWidth =
            Array.from(range.getClientRects()).reduce((total, rect) => total + rect.width, 0) +
            parseFloat(style.paddingLeft) +
            parseFloat(style.paddingRight) +
            parseFloat(style.borderLeftWidth) +
            parseFloat(style.borderRightWidth)
          // Wrapped text may be clamped by its column; reject only unused stretching.
          return Math.max(0, element.getBoundingClientRect().width - fittedWidth)
        }),
      )
      .toBeLessThan(2)
  }
})

test('el texto de próxima etapa permanece centrado en jefe y portfolio', async ({ page }) => {
  for (const role of ['jefe', 'portfolio']) {
    await page.goto(`/sistema-visual/${role}/aprobaciones`)
    const badge = page.getByText('Próxima etapa', { exact: true })
    await expect(badge).toBeVisible()
    await expect(badge).toHaveCSS('text-align', 'center')
    await expect(badge).toHaveCSS('justify-content', 'center')
  }
})
