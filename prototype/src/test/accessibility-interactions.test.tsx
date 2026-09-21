import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { LeadFormModal } from '../components/LeadForm'

describe('modal keyboard behavior', () => {
  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup()
    function Harness() {
      const [open, setOpen] = useState(false)
      return <MemoryRouter><button onClick={() => setOpen(true)} type="button">Открыть форму</button><LeadFormModal context="Тест" onClose={() => setOpen(false)} open={open} /></MemoryRouter>
    }

    render(<Harness />)
    const trigger = screen.getByRole('button', { name: 'Открыть форму' })
    await user.click(trigger)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })
})
