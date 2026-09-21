import { useState } from 'react'
import { LeadForm, LeadFormModal } from '../components/LeadForm'
import { Button, Section } from '../components/ui'
import { PageHero } from '../components/PageHero'
import { cleaningCaseSummary } from '../data/cleaningCaseData'

const variantContent = [
  {
    id: 'home',
    label: 'Главная',
    title: 'SEO, которое превращается в понятный план работ и измеримый результат.',
    summary: 'Я лично веду стратегию, техническую проверку и контроль внедрения.',
    meta: cleaningCaseSummary.top5 + ' из ' + cleaningCaseSummary.monitored + ' запросов в ТОП-5 · 8 месяцев',
  },
  {
    id: 'service',
    label: 'Типовая услуга',
    title: 'SEO-аудит с приоритетным планом роста',
    summary: 'Техника, спрос, страницы, доверие и roadmap на 60–90 дней.',
    meta: 'от 39 000 ₽ · срок после оценки объёма',
  },
  {
    id: 'pricing',
    label: 'Pricing',
    title: 'Стоимость SEO-работ и форматы сотрудничества',
    summary: 'Четыре формата по задаче, результату и участию команды.',
    meta: 'аудит от 39 000 ₽ · сопровождение от 69 000 ₽/мес.',
  },
]

function VariantDemo({
  item,
  variant,
  viewport,
  onOpen,
}: {
  item: (typeof variantContent)[number]
  variant: 'A' | 'B'
  viewport: 'desktop' | 'mobile'
  onOpen: () => void
}) {
  return (
    <article className={`variant-demo variant-demo--${viewport}`}>
      <header className="variant-demo__header">
        <div><span>Вариант {variant}</span><strong>{variant === 'A' ? 'Форма в первом экране' : 'CTA открывает форму'}</strong></div>
      </header>
      <div className="variant-demo__viewport">
        <div className="variant-demo__chrome"><i /><i /><i /><span>synapsee.local/{item.id}</span></div>
        <div className="variant-demo__nav"><strong>Synapsee</strong><span>Услуги · Кейсы · Цены · Процесс</span><b>Разобрать сайт</b></div>
        <div className="variant-demo__hero">
          <div className="variant-demo__copy">
            <small>{item.label}</small>
            <h3>{item.title}</h3>
            <p>{item.summary}</p>
            <div className="variant-demo__proof">{item.meta}</div>
            {variant === 'B' && <Button onClick={onOpen}>Обсудить задачу</Button>}
          </div>
          {variant === 'A' ? <LeadForm compact context={`A/B: ${item.label}, вариант A`} /> : <div className="variant-demo__artifact"><span>01</span><strong>Сначала доказательство</strong><p>Форма появляется только после осознанного действия.</p></div>}
        </div>
      </div>
    </article>
  )
}

export function VariantsPage() {
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop')
  const [modalContext, setModalContext] = useState<string | null>(null)

  return (
    <>
      <PageHero
        breadcrumbs={[{ label: 'Главная', path: '/' }, { label: 'Служебная страница A/B' }]}
        compact
        eyebrow="Служебная страница вариантов"
        summary="Рабочий прототип использует вариант A. Эта страница сохраняет вариант B для последующего визуального выбора без остановки основной сборки."
        title="Сравнение первых экранов: форма сразу или после CTA"
      />
      <Section eyebrow="Prototype Variant Switcher" title="Режим просмотра" tone="muted">
        <div aria-label="Размер варианта" className="variant-switcher" role="group">
          <button aria-pressed={viewport === 'desktop'} className={viewport === 'desktop' ? 'is-active' : undefined} onClick={() => setViewport('desktop')} type="button">Desktop · 1366×768</button>
          <button aria-pressed={viewport === 'mobile'} className={viewport === 'mobile' ? 'is-active' : undefined} onClick={() => setViewport('mobile')} type="button">Mobile · 390×844</button>
        </div>
        <div className="variant-key">
          <p><strong>A — рекомендуемый:</strong> действие начинается прямо в hero; меньше шагов до контакта.</p>
          <p><strong>B — альтернативный:</strong> сначала оффер и доказательство; форма открывается по CTA и возвращает фокус после закрытия.</p>
        </div>
      </Section>
      {variantContent.map((item) => (
        <Section eyebrow={item.label} key={item.id} title={`Два первых экрана: ${item.label}`}>
          <div className="variant-pair">
            <VariantDemo item={item} onOpen={() => setModalContext(`${item.label}, вариант B`)} variant="A" viewport={viewport} />
            <VariantDemo item={item} onOpen={() => setModalContext(`${item.label}, вариант B`)} variant="B" viewport={viewport} />
          </div>
        </Section>
      ))}
      <LeadFormModal context={modalContext ?? 'A/B-вариант'} onClose={() => setModalContext(null)} open={Boolean(modalContext)} />
    </>
  )
}
