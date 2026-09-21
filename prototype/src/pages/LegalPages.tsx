import type { ReactNode } from 'react'
import privacyPolicyRaw from '../data/privacy-policy.txt?raw'
import { PageHero } from '../components/PageHero'

interface LegalSection { id: string; title: string; paragraphs: string[] }

function parsePrivacyPolicy(raw: string): LegalSection[] {
  const lines = raw.replace(/\r/g, '').split('\n')
  const sections: LegalSection[] = []
  let current: LegalSection | null = null
  for (const line of lines.slice(1)) {
    const text = line.trim()
    if (!text) continue
    if (/^\d+\.\s/.test(text)) {
      current = { id: `privacy-${sections.length + 1}`, title: text, paragraphs: [] }
      sections.push(current)
    } else if (current) current.paragraphs.push(text)
  }
  return sections
}

function InlineLinks({ text }: { text: string }) {
  const parts: ReactNode[] = []
  const pattern = /\[([^\]]+)]\(([^)]+)\)/g
  let cursor = 0
  let match = pattern.exec(text)
  while (match) {
    if (match.index > cursor) parts.push(text.slice(cursor, match.index))
    parts.push(<a href={match[2]} key={`${match[2]}-${match.index}`}>{match[1]}</a>)
    cursor = match.index + match[0].length
    match = pattern.exec(text)
  }
  if (cursor < text.length) parts.push(text.slice(cursor))
  return <>{parts}</>
}

const privacySections = parsePrivacyPolicy(privacyPolicyRaw)
const termsSections: LegalSection[] = [
  { id: 'terms-general', title: '1. Общие условия', paragraphs: ['Используя сайт, пользователь соглашается, что материалы предоставляются «как есть» для ознакомления с подходом, экспертизой и форматами работы Synapsee.'] },
  { id: 'terms-info', title: '2. Информационный характер материалов', paragraphs: ['Публикации, услуги, кейсы и ориентиры по срокам и метрикам не являются персональной рекомендацией без отдельного анализа проекта.'] },
  { id: 'terms-offer', title: '3. Не является автоматической офертой', paragraphs: ['Содержимое сайта само по себе не образует публичную оферту, если это прямо не указано. Коммерческие условия, объём, сроки и стоимость согласуются индивидуально.'] },
  { id: 'terms-start', title: '4. Как начинается коммерческая работа', paragraphs: ['Сотрудничество начинается после обращения, обсуждения задачи и подтверждения условий в переписке и/или договоре. До этого материалы сайта не считаются гарантийным обязательством результата.'] },
]

const consentSections: LegalSection[] = [
  { id: 'consent-subject', title: '1. Согласие пользователя', paragraphs: ['Отправляя форму на сайте synapsee.ru и отмечая соответствующее поле, пользователь свободно, своей волей и в своём интересе даёт Оператору согласие на обработку указанных им персональных данных. Оператор определён в Политике конфиденциальности сайта.'] },
  { id: 'consent-data', title: '2. Состав данных', paragraphs: ['Обрабатываются адрес сайта и Telegram или email для ответа. По желанию пользователь может дополнительно указать нишу, регион, задачу, ранее предпринятые действия и сведения о команде внедрения. Также сохраняются технические данные, необходимые для защиты формы от спама и ограничения повторных отправок.'] },
  { id: 'consent-purpose', title: '3. Цели обработки', paragraphs: ['Данные используются для регистрации обращения, ответа пользователю, предварительной оценки задачи и выбора подходящего формата работы. Они не используются для автоматического принятия решений, создающих юридические последствия для пользователя.'] },
  { id: 'consent-actions', title: '4. Действия с данными', paragraphs: ['Согласие распространяется на сбор, запись, систематизацию, хранение, уточнение, использование, предоставление техническим сервисам в необходимом для обработки заявки объёме, блокирование, удаление и уничтожение данных. Обработка может выполняться с использованием средств автоматизации.'] },
  { id: 'consent-term', title: '5. Срок и отзыв согласия', paragraphs: ['Согласие действует до достижения целей обработки или его отзыва. Заявка хранится на сервере не более 30 дней. Отозвать согласие или уточнить данные можно письмом на [1extraboy@gmail.com](mailto:1extraboy@gmail.com) с темой «Отзыв согласия на обработку персональных данных».'] },
  { id: 'consent-links', title: '6. Связанные документы', paragraphs: ['Подробный порядок обработки и защиты данных опубликован в [Политике конфиденциальности](https://synapsee.ru/privacy/).'] },
]

export type LegalType = 'privacy' | 'terms' | 'consent'

export function LegalPage({ type }: { type: LegalType }) {
  const config = type === 'privacy'
    ? { sections: privacySections, title: 'Политика конфиденциальности', summary: 'Порядок обработки персональных данных, которые пользователь отправляет через форму сайта.' }
    : type === 'consent'
      ? { sections: consentSections, title: 'Согласие на обработку персональных данных', summary: 'Состав данных, цели обработки, срок действия и порядок отзыва согласия при отправке формы.' }
      : { sections: termsSections, title: 'Условия использования', summary: 'Общий порядок использования сайта и интерпретации размещённых материалов.' }

  return (
    <>
      <PageHero breadcrumbs={[{ label: 'Главная', path: '/' }, { label: config.title }]} compact eyebrow="Юридическая информация" meta={<span>Действующая редакция для synapsee.ru</span>} summary={config.summary} title={config.title} />
      <section className="legal-shell">
        <div className="container legal-layout">
          <nav aria-label="Содержание документа" className="legal-toc"><strong>Содержание</strong><ol>{config.sections.map((section) => <li key={section.id}><a href={`#${section.id}`}>{section.title}</a></li>)}</ol></nav>
          <article className="legal-body">{config.sections.map((section) => <section id={section.id} key={section.id}><h2>{section.title}</h2>{section.paragraphs.map((paragraph, index) => <p key={`${paragraph}-${index}`}><InlineLinks text={paragraph} /></p>)}</section>)}</article>
        </div>
      </section>
    </>
  )
}
