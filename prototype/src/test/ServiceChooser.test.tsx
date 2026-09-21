import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ServiceChooser } from '../components/ServiceChooser'

describe('ServiceChooser', () => {
  beforeEach(() => {
    vi.stubGlobal('scrollTo', vi.fn())
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }))
  })

  it('changes recommendations by situation and brings the result into view', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><ServiceChooser /></MemoryRouter>)

    await user.click(screen.getByRole('button', { name: 'Интернет-магазин плохо растёт' }))
    expect(screen.getByRole('heading', { name: /Интернет-магазин плохо растёт/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /SEO интернет-магазина/ })).toBeInTheDocument()
    await waitFor(() => expect(window.scrollTo).toHaveBeenCalled())
  })
})
