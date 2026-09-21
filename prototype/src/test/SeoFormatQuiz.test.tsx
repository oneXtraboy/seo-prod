import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SeoFormatQuiz } from '../components/SeoFormatQuiz'

async function answerQuiz(situation: string, outcome: string, implementation = 'Есть разработчик или команда') {
  const user = userEvent.setup()
  render(<MemoryRouter><SeoFormatQuiz /></MemoryRouter>)

  await user.click(screen.getByRole('button', { name: new RegExp(situation) }))
  await user.click(screen.getByRole('button', { name: new RegExp(outcome) }))
  await user.click(screen.getByRole('button', { name: new RegExp(implementation) }))
}

describe('SeoFormatQuiz', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'challenge-token', question: '2 + 3' }),
    }))
  })

  it('recommends a consultation for one specific question', async () => {
    await answerQuiz('Есть проблемы с индексацией', 'Решить один конкретный вопрос')
    expect(screen.getByRole('heading', { name: 'SEO-консультация' })).toBeInTheDocument()
    expect(screen.getByText(/техническое SEO/)).toBeInTheDocument()
  })

  it('recommends an audit when the cause is unknown', async () => {
    await answerQuiz('Трафик или позиции снизились', 'Понять, что мешает росту')
    expect(screen.getByRole('heading', { name: 'SEO-аудит' })).toBeInTheDocument()
  })

  it('recommends a strategy for a development plan', async () => {
    await answerQuiz('Планируем новый сайт или редизайн', 'Получить план развития SEO')
    expect(screen.getByRole('heading', { name: 'SEO-стратегия' })).toBeInTheDocument()
    expect(screen.getByText(/SEO нового сайта/)).toBeInTheDocument()
  })

  it('recommends a four-month retainer for a full implementation cycle', async () => {
    await answerQuiz('Хотим системно развивать SEO', 'Не только найти проблемы', 'Есть подрядчики')
    expect(screen.getByRole('heading', { name: 'SEO-сопровождение' })).toBeInTheDocument()
    expect(screen.getByText('Минимальный срок сопровождения — 4 месяца')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Покажите сайт — проверю рекомендацию' })).toBeInTheDocument()
  })
})

