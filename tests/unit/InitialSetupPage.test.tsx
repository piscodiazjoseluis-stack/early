import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { InitialSetupPage } from '@/features/dashboard/pages/InitialSetupPage'

describe('InitialSetupPage', () => {
  it('communicates that only the initialization stage is ready', () => {
    render(<InitialSetupPage />)

    expect(
      screen.getByRole('heading', { name: /base técnica lista para construir con orden/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/próximo paso sujeto a aprobación/i)).toBeInTheDocument()
  })
})
