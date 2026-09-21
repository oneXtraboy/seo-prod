import { cleanup, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { RoutePage } from '../App'
import { publicRoutes } from '../data/routes'

describe('public route smoke render', () => {
  for (const route of publicRoutes) {
    it(`renders ${route.path}`, () => {
      const view = render(<MemoryRouter initialEntries={[route.path]}><RoutePage route={route} /></MemoryRouter>)
      expect(view.container.querySelector('h1')).not.toBeNull()
      cleanup()
    })
  }
})
