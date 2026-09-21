import { useState } from 'react'
import { articles } from '../data/articles'
import { cases } from '../data/cases'
import { services } from '../data/services'
import { getServicePresentation } from '../data/servicePresentation'
import { contactDetails } from '../data/routes'
import type { ArticleData } from '../types'
import { LeadForm } from '../components/LeadForm'
import { ArticleBlocks } from '../components/ArticleContent'
import { PageHero } from '../components/PageHero'
import {
  ArticleCard,
  AuthorCard,
  ButtonLink,
  CaseCard,
  LegacyRouteNotice,
  Section,
  TextLink,
} from '../components/ui'

const topics = ['\u0412\u0441\u0435 \u0442\u0435\u043c\u044b', '\u0422\u0435\u0445\u043d\u0438\u043a\u0430', '\u041a\u043e\u043c\u043c\u0435\u0440\u0447\u0435\u0441\u043a\u0438\u0435 \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u044b', '\u0410\u043d\u0430\u043b\u0438\u0442\u0438\u043a\u0430', 'GEO / AI', '\u041b\u043e\u043a\u0430\u043b\u044c\u043d\u043e\u0435 SEO']

const articleServiceCopy: Record<string, { eyebrow: string; title: string; cta: string }> = {
  'seo-growth-without-chaos': { eyebrow: 'Следующий рабочий шаг', title: 'Нужен последовательный план внедрения → SEO-стратегия', cta: 'Посмотреть SEO-стратегию' },
  'measure-seo-honestly': { eyebrow: 'Диагностика и измерение', title: 'Нужно найти ограничения и настроить измерение → SEO-аудит', cta: 'Посмотреть SEO-аудит' },
  'commercial-page-errors': { eyebrow: 'Страницы и конверсия', title: 'Нужно проверить SEO и конверсионную структуру → SEO-аудит', cta: 'Посмотреть SEO-аудит' },
  'seo-audit-composition': { eyebrow: 'Приоритетный план', title: 'Нужен аудит с понятным roadmap → SEO-аудит', cta: 'Посмотреть SEO-аудит' },
  'technical-audit-checklist': { eyebrow: 'Индексация и релизы', title: 'Нужна диагностика индексации → Технический SEO-аудит', cta: 'Посмотреть технический аудит' },
  'geo-ai-visibility': { eyebrow: 'AI-видимость', title: 'Нужно проверить видимость бренда в AI → GEO / AEO / AI SEO', cta: 'Посмотреть GEO / AI SEO' },
}

export function JournalPage() {
  const [topic, setTopic] = useState(topics[0])
  const visible = topic === 'Все темы' ? articles : articles.filter((article) => article.topic === topic)

  return (
    <>
      <PageHero
        breadcrumbs={[{ label: 'Главная', path: '/' }, { label: 'Журнал' }]}
        eyebrow="Практические материалы"
        summary="Техника, коммерческие страницы, аналитика и AI-видимость — практические материалы с источниками, ограничениями и связанными услугами."
        title="Журнал о SEO, внедрении и проверке результата"
      />
      <Section eyebrow="Тематические маршруты" title="Выберите вопрос" tone="muted">
        <div aria-label="Фильтр журнала" className="filter-bar" role="group">
          {topics.map((item) => <button aria-pressed={topic === item} className={topic === item ? 'is-active' : undefined} key={item} onClick={() => setTopic(item)} type="button">{item}</button>)}
        </div>
        <p aria-live="polite" className="filter-result">Материалов: {visible.length}</p>
        <div className="card-grid card-grid--three">
          {visible.map((article) => <ArticleCard article={article} key={article.id} />)}
        </div>
      </Section>
      <Section eyebrow="Авторство" title="Материалы связаны с практикой автора">
        <AuthorCard />
      </Section>
    </>
  )
}

export function ArticlePage({ article }: { article: ArticleData }) {
  const related = article.relatedPaths
    ? article.relatedPaths.map((path) => articles.find((item) => item.path === path)).filter((item): item is ArticleData => Boolean(item)).slice(0, 4)
    : articles.filter((item) => item.id !== article.id && (item.topic === article.topic || item.servicePath === article.servicePath)).slice(0, 2)
  const linkedService = services.find((service) => service.path === article.servicePath)
  const linkedServiceCode = linkedService ? getServicePresentation(linkedService.id).serviceCode : 'journal_article'
  const serviceCopy = articleServiceCopy[article.id] || { eyebrow: 'Следующий рабочий шаг', title: linkedService?.title || 'Разобрать задачу', cta: 'Посмотреть услугу' }
  const primarySources = article.sources.filter((source) => source.startsWith('http'))
  const practiceSources = article.sources.filter((source) => !source.startsWith('http'))

  return (
    <>
      <PageHero
        breadcrumbs={[{ label: 'Главная', path: '/' }, { label: 'Журнал', path: '/journal/' }, { label: article.title }]}
        compact
        eyebrow={`${article.topic} · ${article.readingTime}`}
        meta={(
          <div className="article-meta">
            {article.published && <span>{article.published}</span>}
            <span>{article.updated}</span>
            <LinkAuthor path={article.authorPath} />
          </div>
        )}
        summary={article.summary}
        title={article.title}
      />
      <section className="article-shell">
        <div className="container article-layout">
          <article className="article-body">
            <div className="short-answer">
              <p className="eyebrow">Короткий ответ</p>
              <p>{article.shortAnswer}</p>
            </div>
            {article.intro && article.intro.length > 0 && <div className="article-intro">{article.intro.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>}
            <nav aria-label="Содержание статьи" className="article-toc article-toc--mobile">
              <strong>Содержание</strong>
              <ol>{article.sections.map((section) => <li key={section.id}><a href={`#${section.id}`}>{section.title}</a></li>)}</ol>
            </nav>
            {article.sections.map((section, sectionIndex) => (
              <section id={section.id} key={section.id}>
                <p className="article-section-number">{String(sectionIndex + 1).padStart(2, '0')}</p>
                <h2>{section.title}</h2>
                {section.blocks ? <ArticleBlocks blocks={section.blocks} /> : <>
                  {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  {section.bullets && <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}
                </>}
              </section>
            ))}
            {!article.hideDefaultChecklist && <section className="article-checklist" id="checklist">
              <p className="eyebrow">Практический вывод</p>
              <h2>Чек-лист перед следующим шагом</h2>
              <ul>{article.checklist.map((item) => <li key={item}><span aria-hidden="true">✓</span>{item}</li>)}</ul>
            </section>}
            <section className="article-sources" id="sources">
              {primarySources.length > 0 && <><h2>Источники</h2><ul>{primarySources.map((source) => { const [url, label] = source.split(' \u2014 '); const internal = url.startsWith('https://synapsee.ru'); return <li key={source}><a href={internal ? url.replace('https://synapsee.ru', '') : url} rel={internal ? undefined : 'nofollow noopener noreferrer'} target={internal ? undefined : '_blank'}>{label || url}</a></li> })}</ul></>}
              {practiceSources.length > 0 && <><h2>Практика автора</h2><ul>{practiceSources.map((source) => <li key={source}>{source.replace(/^Практика Synapsee:\s*/, '')}</li>)}</ul></>}
            </section>
            <AuthorCard />
          </article>
          <aside className="article-sidebar">
            <nav aria-label="Содержание статьи" className="article-toc">
              <strong>Содержание</strong>
              <ol>
                {article.sections.map((section) => <li key={section.id}><a href={`#${section.id}`}>{section.title}</a></li>)}
                {!article.hideDefaultChecklist && <li className="article-toc__extra"><a href="#checklist">{'\u0427\u0435\u043a-\u043b\u0438\u0441\u0442'}</a></li>}
                <li className="article-toc__extra"><a href="#sources">Источники</a></li>
              </ol>
            </nav>
          </aside>
        </div>
      </section>
      {linkedService && <Section eyebrow={serviceCopy.eyebrow} title={serviceCopy.title}><div className="article-service-next"><div><p className="eyebrow">{linkedService.eyebrow}</p><h3>{linkedService.title}</h3><p>{linkedService.summary}</p><strong>{linkedService.price}</strong></div><ButtonLink analytics="service_cta_click" analyticsParams={{ service: linkedServiceCode, article_slug: article.id, placement: "article" }} dataCta="view_related_service" dataContext={article.id} to={linkedService.path}>{serviceCopy.cta}</ButtonLink></div></Section>}
      <Section eyebrow="Продолжить чтение" title="Связанные материалы" tone="muted">
        <div className="card-grid card-grid--two">{related.map((item) => <ArticleCard article={item} key={item.id} />)}</div>
      </Section>
      <Section className="final-form-section final-form-section--priority" eyebrow="Применить к проекту" id="contact">
        <div className="final-form-grid final-form-grid--form-priority"><LeadForm compact context={"\u0421\u0442\u0430\u0442\u044c\u044f: " + article.title} description={article.cta?.text || '\u042f \u043f\u043e\u0441\u043c\u043e\u0442\u0440\u044e \u0441\u0430\u0439\u0442 \u0438 \u043e\u0442\u0432\u0435\u0447\u0443 \u043f\u043e \u0443\u043a\u0430\u0437\u0430\u043d\u043d\u043e\u043c\u0443 \u043a\u043e\u043d\u0442\u0430\u043a\u0442\u0443.'} serviceCode={linkedServiceCode} submitLabel={article.cta?.label} title={article.cta?.title || '\u041f\u043e\u043a\u0430\u0436\u0438\u0442\u0435 \u0441\u0430\u0439\u0442 \u2014 \u043f\u0440\u0438\u043c\u0435\u043d\u044e \u0432\u044b\u0432\u043e\u0434\u044b \u043a \u0432\u0430\u0448\u0435\u0439 \u0437\u0430\u0434\u0430\u0447\u0435'} /><aside className="form-service-context"><span>Связанная услуга</span><strong>{linkedService?.title || 'Подберу после оценки сайта'}</strong></aside></div>
      </Section>
    </>
  )
}

function LinkAuthor({ path = '/authors/synapsee/' }: { path?: string }) {
  return <TextLink to={path}>Фёдор Магеря</TextLink>
}

export function AuthorPage() {
  return (
    <>
      <PageHero
        aside={<div className="profile-hero-card"><img src="/images/fedor-magerya.jpg" alt="Фёдор Магеря, SEO-специалист Synapsee" /><div><strong>Фёдор Магеря</strong><span>SEO-специалист</span><ButtonLink to="/about/" variant="secondary">Обо мне</ButtonLink></div></div>}
        breadcrumbs={[{ label: 'Главная', path: '/' }, { label: 'Автор' }]}
        eyebrow="Автор материалов Synapsee"
        summary="Я лично веду стратегию, техническую проверку, приоритеты и контроль внедрения в SEO-проектах."
        title="Фёдор Магеря"
      />
      <Section eyebrow="Направления работы" title="С чем я работаю" tone="muted">
        <div className="tag-cloud">
          {['Яндекс SEO', 'Google SEO', 'Локальное SEO', 'Техническое SEO', 'Коммерческие страницы', 'Поисковая аналитика', 'GEO / AEO / AI SEO'].map((item) => <span key={item}>{item}</span>)}
        </div>
      </Section>
      <Section eyebrow="Роль в проектах" title="Что я веду лично">
        <div className="large-number-list">
          <div><span>01</span><p>Диагностика и связь SEO с задачей бизнеса.</p></div>
          <div><span>02</span><p>Стратегия, приоритеты и постановки.</p></div>
          <div><span>03</span><p>Контроль внедрения и качества релиза.</p></div>
          <div><span>04</span><p>Методика измерения и следующий этап.</p></div>
        </div>
      </Section>
      <Section eyebrow="Внешний профиль" title="Проверяемая связь" tone="blue">
        <div className="external-profile-card">
          <span>Telegram</span><strong>{contactDetails.telegramLabel}</strong><a data-analytics="telegram_click" href={contactDetails.telegramHref}>Открыть внешний профиль</a>
        </div>
      </Section>
      <Section eyebrow="Все материалы" title="Статьи автора" tone="muted">
        <div className="card-grid card-grid--three">{articles.map((article) => <ArticleCard article={article} key={article.id} />)}</div>
      </Section>
      <Section eyebrow="Связанные проекты" title="Кейсы с указанной ролью">
        <div className="card-grid card-grid--three">{cases.slice(0, 3).map((item) => <CaseCard item={item} key={item.id} />)}</div>
      </Section>
    </>
  )
}

export function LegacyIndexPage() {
  return (
    <>
      <PageHero breadcrumbs={[{ label: 'Главная', path: '/' }, { label: 'Блог' }]} eyebrow="Ранние материалы" summary="Публикации, доступные по старым ссылкам. Актуальные разборы собраны в основном журнале." title="Архив материалов Synapsee" />
      <Section eyebrow="Архив" title="Последние материалы">
        <LegacyRouteNotice />
        <div className="card-grid card-grid--three">{articles.slice(0, 3).map((article) => <ArticleCard article={article} key={article.id} />)}</div>
      </Section>
    </>
  )
}

export function LegacyArticlePage() {
  return (
    <>
      <PageHero breadcrumbs={[{ label: 'Главная', path: '/' }, { label: 'Блог', path: '/blog/' }, { label: 'Материал' }]} compact eyebrow="Архивный материал" summary="Как собрать спокойную коммерческую страницу вокруг одного сценария выбора, доказательства и следующего шага." title="Как собрать лаконичную SEO-страницу" />
      <Section>
        <LegacyRouteNotice article />
        <div className="legacy-article-body">
          <h2>Сначала ответ, затем доказательство</h2>
          <p>Коммерческая страница должна быстро объяснить, кому подходит услуга, что получает клиент, сколько стоит старт и чем подтверждается сильное утверждение.</p>
          <h2>Не смешивайте все услуги</h2>
          <p>Один основной сценарий выбора помогает и поиску, и пользователю. Остальные маршруты лучше дать контекстными ссылками.</p>
          <h2>Снизьте цену первого действия</h2>
          <p>Двух полей достаточно для первого шага, если дальше ясно объяснены срок и порядок работы.</p>
        </div>
      </Section>
      <Section eyebrow="Страницы и конверсия" title="Нужно проверить SEO и конверсионную структуру → SEO-аудит" tone="muted">
        <div className="article-service-next"><div><p className="eyebrow">Комплексная диагностика</p><h3>SEO-аудит</h3><p>Техника, спрос, коммерческие страницы, доверие и аналитика соединяются в один приоритетный план.</p><strong>от 39 000 ₽</strong></div><ButtonLink analytics="service_cta_click" analyticsParams={{ service: 'seo_audit', article_slug: 'agency-os-landing-mvp', placement: 'legacy_article' }} dataCta="view_related_service" dataContext="agency-os-landing-mvp" to="/services/seo-audit/">Посмотреть SEO-аудит</ButtonLink></div>
      </Section>
      <Section eyebrow="Продолжить чтение" title="Связанные материалы"><div className="card-grid card-grid--two">{articles.slice(1, 3).map((article) => <ArticleCard article={article} key={article.id} />)}</div></Section>
      <Section className="final-form-section final-form-section--priority" eyebrow="Применить к проекту" id="contact">
        <div className="final-form-grid"><div><p className="section__intro">Для первого шага достаточно сайта и Telegram или email.</p></div><LeadForm compact context="Архивная статья: коммерческая SEO-страница" serviceCode="seo_audit" title="Покажите сайт — проверю страницу" /></div>
      </Section>
    </>
  )
}

