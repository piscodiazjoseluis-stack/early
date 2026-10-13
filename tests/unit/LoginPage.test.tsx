import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { login } = vi.hoisted(() => ({ login: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@/features/auth/hooks/useAuth', () => ({ useAuth: () => ({ login, error: null }) }))
import { LoginPage } from '@/features/auth/pages/LoginPage'

beforeEach(() => {
  login.mockClear()
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined)
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
const renderLogin = () =>
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  )

describe('Login visual, contrato de autenticación conservado', () => {
  it('conserva video, poster y acceso a recuperación', () => {
    const { container } = renderLogin()
    expect(container.querySelector('video source')).toHaveAttribute(
      'src',
      '/brand/login-wellbeing-loop.mp4',
    )
    expect(container.querySelector('video')).toHaveAttribute(
      'poster',
      '/brand/login-wellbeing-illustration.png',
    )
    expect(screen.getByRole('link', { name: '¿Olvidaste tu contraseña?' })).toHaveAttribute(
      'href',
      '/recuperar-contrasena',
    )
    expect(screen.getByRole('link', { name: 'Contactar al administrador' })).toHaveAttribute(
      'href',
      'mailto:administrador@empresa.com',
    )
  })
  it('conserva los campos y entrega las mismas credenciales al hook existente', async () => {
    renderLogin()
    fireEvent.change(screen.getByLabelText('Correo corporativo'), {
      target: { value: 'revision@example.test' },
    })
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'OnlyInUnitTest42!' },
    })
    fireEvent.click(screen.getByLabelText('Recordarme'))
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    await waitFor(() =>
      expect(login).toHaveBeenCalledWith({
        email: 'revision@example.test',
        password: 'OnlyInUnitTest42!',
        remember: true,
      }),
    )
  })
  it('mostrar contraseña no envía el formulario', () => {
    renderLogin()
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'text')
    expect(login).not.toHaveBeenCalled()
  })
})
