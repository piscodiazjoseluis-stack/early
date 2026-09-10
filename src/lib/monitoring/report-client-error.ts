import { supabase } from '@/lib/supabase/client'

import { getClientErrorRoute, sanitizeClientError, type ClientErrorSource } from './error-payload'

export function reportClientError(source: ClientErrorSource, error: unknown) {
  const message = sanitizeClientError(error)

  void supabase
    .rpc('report_client_error', {
      error_source: source,
      error_message: message,
      error_route: getClientErrorRoute(),
      app_release: import.meta.env.MODE,
      error_metadata: {
        online: typeof navigator === 'undefined' ? null : navigator.onLine,
        visibility_state: typeof document === 'undefined' ? null : document.visibilityState,
      },
    })
    .then(({ error: reportError }) => {
      if (reportError && import.meta.env.DEV) {
        console.warn('No se pudo registrar el error del cliente.', reportError.message)
      }
    })
}
