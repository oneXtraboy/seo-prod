import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LeadForm } from '../components/LeadForm'

describe('LeadForm', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('saves the lead on the first submit and makes enrichment optional', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ token: 'signed-token', question: '4 + 5' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, id: 'AUD-TEST-1', enrichment_token: 'enrich-token' }), { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    render(<LeadForm context="Тестовая заявка" serviceCode="seo_audit" />)

    const submit = await screen.findByRole('button', { name: 'Отправить сайт' })
    await waitFor(() => expect(submit).toBeEnabled())
    await user.type(screen.getByLabelText('Адрес сайта'), 'https://example.ru')
    await user.type(screen.getByLabelText('Telegram или email для ответа'), '@example_user')
    expect(screen.queryByText(/Антиспам/)).not.toBeInTheDocument()
    await user.click(screen.getByRole('checkbox'))
    expect(screen.getByRole('checkbox')).toBeRequired()
    await user.click(submit)

    expect(await screen.findByText(/Заявка AUD-TEST-1 уже сохранена/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Добавить контекст?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Пропустить' })).toBeInTheDocument()
    const [, request] = fetchMock.mock.calls[1]
    const body = request.body as URLSearchParams
    expect(body.get('form_type')).toBe('quick_lead')
    expect(body.get('service')).toBe('seo_audit')
    expect(body.get('contact')).toBe('@example_user')
    expect(body.get('website')).toBe('https://example.ru')
    expect(body.get('challenge_token')).toBe('signed-token')
    expect(body.get('challenge_answer')).toBe('9')
    expect(body.get('privacy_consent')).toBe('yes')
  })

  it('shows a clear error if the challenge service is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    render(<LeadForm />)
    expect(await screen.findByText('Не удалось подтвердить защиту формы. Обновите страницу.')).toBeInTheDocument()
  })
})
