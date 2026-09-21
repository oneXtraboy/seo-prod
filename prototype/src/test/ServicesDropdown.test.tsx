import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ServicesDropdown } from '../components/Layout'

describe('ServicesDropdown', () => {
  it('closes outside, after selecting a link, and on Escape', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><ServicesDropdown /><button type="button">Вне меню</button></MemoryRouter>)

    const summary = screen.getByText('Услуги').closest('summary') as HTMLElement
    const details = summary.closest('details') as HTMLDetailsElement

    await user.click(summary)
    expect(details).toHaveAttribute('open')
    await user.click(screen.getByRole('button', { name: 'Вне меню' }))
    expect(details).not.toHaveAttribute('open')

    await user.click(summary)
    await user.click(screen.getByRole('link', { name: 'Все услуги' }))
    expect(details).not.toHaveAttribute('open')

    await user.click(summary)
    await user.keyboard('{Escape}')
    expect(details).not.toHaveAttribute('open')
    expect(summary).toHaveFocus()
  })
})
