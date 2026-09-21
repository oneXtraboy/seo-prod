import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ServiceCatalog } from '../components/ServiceCatalog'

describe('ServiceCatalog', () => {
  it('filters directions by a plain-language query', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><ServiceCatalog /></MemoryRouter>)

    await user.type(screen.getByRole('searchbox', { name: 'Что нужно решить?' }), 'ChatGPT')
    expect(screen.getByRole('button', { name: /GEO \/ AEO \/ AI SEO/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Local SEO/ })).not.toBeInTheDocument()
  })

  it('opens a grouped direction in a dialog', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><ServiceCatalog /></MemoryRouter>)

    await user.click(screen.getByRole('button', { name: /SEO-аналитика/ }))
    const dialog = screen.getByRole('dialog', { name: 'SEO-аналитика' })
    expect(dialog).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Поисковая видимость' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Обсудить задачу/ })).toHaveAttribute('href', '/services/seo-audit/')
  })
})
