import { useLocation, useNavigate } from 'react-router-dom'
import type { NavigateFunction, NavigateOptions, To } from 'react-router-dom'

/** Keeps visual demonstrations in their role; authenticated destinations are unchanged. */
export function useExperienceNavigate(): NavigateFunction {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  return ((to: To | number, options?: NavigateOptions) => {
    if (typeof to === 'number') return navigate(to)
    if (pathname.startsWith('/sistema-visual/portfolio') && typeof to === 'string') {
      const destination = to.startsWith('/sistema-visual')
        ? to.replace(/^\/sistema-visual(?:\/jefe|\/portfolio)?/, '')
        : to
      if (destination !== '/iniciar-sesion' && destination.startsWith('/')) {
        return navigate(
          `/sistema-visual/portfolio${destination === '/panel' ? '' : destination}`,
          options,
        )
      }
    }
    if (
      pathname.startsWith('/sistema-visual/jefe') &&
      typeof to === 'string' &&
      to.startsWith('/sistema-visual') &&
      !to.startsWith('/sistema-visual/jefe') &&
      !to.startsWith('/sistema-visual/equipos')
    ) {
      return navigate(to.replace('/sistema-visual', '/sistema-visual/jefe'), options)
    }
    return navigate(to, options)
  }) as NavigateFunction
}
