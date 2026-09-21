# Каталог компонентов

## Глобальная оболочка

- `SiteLayout`, `Header`, `MobileMenu`, `Footer`, `MobileBottomCTA`, `ScrollManager` — `src/components/Layout.tsx`.
- `PageHero` — общий первый экран со split-layout, breadcrumbs, meta и aside.
- `Section`, `Container`, `ButtonLink`, `Button`, `TextLink`, `Breadcrumbs` — базовые примитивы.

## Формы и интерактивы

- `LeadForm` — два локальных шага, inline-валидация, honeypot и demo success state.
- `LeadFormModal` — modal, focus trap, Escape, клик по overlay и возврат фокуса.
- `ServiceChooser` — 9 ситуаций и 1–2 рекомендуемые услуги.
- `FAQAccordion` — нативные `details/summary`, первый важный вопрос открыт.
- `StickySectionNav` — доступная якорная навигация услуги/кейса.
- Фильтры кейсов, Journal и Results встроены в соответствующие страницы.
- `Prototype Variant Switcher` — desktop/mobile переключатель на `/_prototype/variants/`.

## Доказательства и карточки

- `SourceBadge` — три статуса достоверности.
- `ProofCard` — метрика, baseline, период, источник, роль и ограничение.
- `HonestPlaceholder` — явный запрос недостающего материала.
- `WorkArtifactPreview` — демонстрационная схема, не имитирующая реальный документ.
- `ServiceCard`, `CaseCard`, `ArticleCard`, `PriceCard`, `AuthorCard`.
- `LegacyRouteNotice` — пометка старых маршрутов без имитации HTTP 301.

## Шаблоны страниц

- `HomePage`.
- `ServicesIndexPage`, `ServicePage`.
- `CasesIndexPage`, `CasePage`.
- `PricingPage`.
- `AboutPage`, `ProcessPage`, `ReportExamplePage`, `ResultsPage`, `ContactPage`.
- `JournalPage`, `ArticlePage`, `AuthorPage`.
- `LegalPage`, `LegacyIndexPage`, `LegacyArticlePage`.
- `VariantsPage`, `NotFoundPage`.

Контент отделён от шаблонов в `src/data/services.ts`, `src/data/cases.ts`, `src/data/articles.ts`, `src/data/routes.ts`.
