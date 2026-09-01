import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'

import { AuthProvider } from '@/features/auth/context/AuthContext'
import { queryClient } from '@/lib/query-client'

import { router } from './router'
import { AppErrorBoundary } from './AppErrorBoundary'

export function App() {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  )
}
