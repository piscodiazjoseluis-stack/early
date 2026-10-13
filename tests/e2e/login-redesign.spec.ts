import { expect, test } from '@playwright/test'

test('login accesible conserva campos, video e interacción sin enviar credenciales', async ({
  page,
}, info) => {
  const writes: string[] = []
  const errors: string[] = []
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().includes('/auth/v1/'))
      writes.push(request.url())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/iniciar-sesion')
  await page.evaluate(() => document.fonts.ready)
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'Iniciar sesión', exact: true })).toBeInViewport()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await expect(page.locator('video source')).toHaveAttribute(
    'src',
    '/brand/login-wellbeing-loop.mp4',
  )
  await page.screenshot({
    path: `evidencias/login-redesign/after-${info.project.name}.png`,
    fullPage: true,
  })
  await page.getByRole('button', { name: 'Mostrar contraseña' }).click()
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveAttribute('type', 'text')
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click()
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveAttribute(
    'aria-invalid',
    'true',
  )
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveAttribute(
    'aria-describedby',
    'password-error',
  )
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect
    .poll(() => page.locator('video').evaluate((video) => (video as HTMLVideoElement).paused))
    .toBe(true)
  await expect(page.getByRole('button', { name: 'Reproducir video' })).toBeVisible()
  expect(writes).toEqual([])
  expect(errors).toEqual([])
})
