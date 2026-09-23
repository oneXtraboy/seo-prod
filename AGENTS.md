# Synapsee project working context

## Source of truth

- The active website application is `prototype/` (React + Vite + TypeScript).
- Public production output is `prototype/dist/`.
- Do not treat the legacy generated HTML at the repository root as the implementation source.
- Public URLs, prices, canonical URLs, existing cases, analytics events, forms, and SEO signals must remain stable unless the user explicitly requests a change.
- The working tree contains user-owned changes. Never discard, reset, or broadly rewrite unrelated files.

## Known paths

- Route registry: `prototype/src/data/routes.ts`
- Service data and prices: `prototype/src/data/services.ts`
- Service presentation copy: `prototype/src/data/servicePresentation.ts`
- SEO metadata and JSON-LD: `prototype/src/data/seo.ts`
- Shared layout/header: `prototype/src/components/Layout.tsx`
- Shared UI and sticky section navigation: `prototype/src/components/ui.tsx`
- Lead form: `prototype/src/components/LeadForm.tsx`
- Service chooser: `prototype/src/components/ServiceChooser.tsx`
- Service quiz: `prototype/src/components/SeoFormatQuiz.tsx`
- Main page implementations: `prototype/src/pages/`
- Final CSS overrides: `prototype/src/final-alignment.css`
- Build entrypoint: `tools/build.sh`
- Deploy script: `tools/deploy.sh` (must publish `prototype/dist/`)
- Focused Chrome QA script: `tools/qa-final.mjs`
- Latest QA result: `reports/qa-final/report.json`
- Read-only Yandex Metrika CLI: `tools/metrika.mjs`; run from the repository root with `node --env-file=.env.local tools/metrika.mjs <command>`.
- Metrika credentials stay only in ignored `.env.local`; generated aggregate reports go to ignored `reports/metrika/`.
- Read-only Google Search Console CLI: `tools/gsc.mjs`; run from the repository root with `node tools/gsc.mjs <command>`.
- GSC OAuth credentials stay in ignored `secrets/gsc-oauth-client.json`, the local token in ignored `.gsc-token.json`, and generated reports in ignored `reports/gsc/`; both credential files use mode 600.

## Efficient workflow

1. Start from the user-reported component or page. Do not repeat a repository-wide audit.
2. If the defect is in a shared component, reproduce it on one representative page, patch the shared implementation, and verify one other page type.
3. Run the smallest relevant test file first, for example:
   - `cd prototype && npm test -- src/test/ServiceChooser.test.tsx`
   - `cd prototype && npm test -- src/test/final-alignment.test.tsx`
4. Run `npm run lint` only after the focused test passes.
5. Run the full `npm run check`, all-route Chrome QA, screenshots, or SEO audit only when:
   - the user explicitly asks for a full audit;
   - route/SEO/build infrastructure changed;
   - preparing a release or deploy.
6. Do not generate new reports, screenshots, or broad inventories for a small UI/content correction.
7. Keep progress updates short and report only actions relevant to the current request.
8. Minimize token and tool usage: do not reread known files, repeat inventories, or rerun checks whose result cannot be affected by the current change.
9. After each completed task, update this file only with new durable project facts, paths, constraints, or proven commands that will prevent repeated work. Do not add temporary status, verbose history, or information already present.
10. Optimize for the requested result first. Do not broaden the task into audits, refactors, screenshots, reports, or documentation unless they are necessary for that result or explicitly requested.
11. User-owned QA policy: after deployment, the user performs visual and functional verification. Do not independently run browser QA, take screenshots, inspect every route, or perform post-deploy content checks unless the user explicitly asks for them.
12. For ordinary content and layout edits, use the shortest path: inspect only the affected source, implement once, run only the checks that the build/deploy command strictly requires, and deploy. Do not repeat checks already executed by the deploy pipeline.
13. Do not reprocess unchanged assets, regenerate broad inventories, or audit unrelated pages. If the user reports a problem after deployment, fix only that reported problem and redeploy.
14. Token efficiency is a primary operating constraint. Use the minimum context, reasoning, tool calls, and tool output needed to complete the requested change without reducing correctness, progress, or implementation quality. Read only relevant file sections, cap command output, summarize large inputs once, avoid reopening the same documents or images, and never repeat a completed inspection or check.
15. Token savings must not omit requested functionality or introduce guesswork. Spend additional context only when it is necessary to implement the request correctly or resolve a concrete blocker.

## Existing baseline

- 45 public routes are registered and prerendered.
- The form backend protocol and anti-spam controls are already implemented; preserve compatibility.
- The second sticky menu is implemented in `StickySectionNav` inside `prototype/src/components/ui.tsx`.
- Route scroll behavior is centralized in `ScrollManager` inside `prototype/src/components/Layout.tsx`: links without a hash open at the top; valid hashes scroll to their target; missing hashes fall back to the top; `location.key` handles repeated same-page menu navigation.
- `SeoFormatQuiz` must not focus its first question on mount: that focus caused automatic jumps into the quiz on both `/services/` and `/pricing/`. Later step changes use `focus({ preventScroll: true })`.
- Mobile hides the second sticky menu below 900px.
- The in-app browser may fail with `helper_unknown_error` in this Windows/WSL setup. Do not repeatedly retry it. Use the existing local Chrome QA path only when browser validation is necessary.
- Codex desktop for this WSL-hosted repository must use Windows Subsystem for Linux; the user config stores this as desktop.runCodexInWindowsSubsystemForLinux = true. Windows-native mode attempts Windows ACL setup on the WSL UNC path and produces helper_unknown_error.
- User preference for this site: after completing and checking requested edits, deploy them immediately unless the user explicitly says not to. Do not commit unless explicitly requested.
- Верхняя строка карточек услуг защищена от разрыва слов через `.service-card__topline > span` в `prototype/src/styles.css`.
- Общая адаптивная стабилизация service price grid и method flow находится в финальном блоке `prototype/src/final-alignment.css` с маркером `Service templates: stable pricing cards...`; она покрывает все 11 service routes.
- Общий вертикальный ритм сайта задан в финальном блоке prototype/src/final-alignment.css: .section использует 64 px на desktop, 58 px до 1024 px, 52 px до 899 px и 44 px до 640 px; базовые hero-отступы находятся в prototype/src/styles.css.
- Квиз на `/services/` использует одну рамку: внешний `.quiz-fallback-section > .container` сброшен, визуальная карточка оставлена на `.seo-quiz` в финальном CSS-блоке `Services quiz: one visual frame...`.
- Кнопка печати/PDF удалена из `ReportExamplePage`; не возвращать её без прямого запроса пользователя.
- `/about/`: ключевые тезисы остаются видимыми; вторичный контекст результата и описания шести направлений опыта оформлены через `about-disclosure` и `about-expertise-item` в `InfoPages.tsx`/`final-alignment.css`.
- В source блок главной «Почему работаю один» использует desktop-композицию 2 широкие карточки + 3 компактные, tablet 2 колонки с последней полноширинной, mobile 1 колонку; финальный CSS-маркер `Home personal-capacity block: compact card composition`.





## Последнее production-состояние
- Деплой: release-20260923-220947 (HTTPS 200), previous release-20260921-230453.
- Яндекс Метрика 112847372 подключена один раз в `prototype/index.html`; SPA-просмотры при смене pathname/search отправляет общий `AnalyticsBridge`, без повторного hit на первой загрузке.
- IndexNow подключён через `tools/indexnow.mjs` и post-deploy шаг в `tools/deploy.sh`: перед публикацией сравниваются indexable HTML текущего и нового релиза, после успешного promote отправляются только добавленные, изменённые и удалённые canonical URL; key-файл находится в `prototype/public/671cb5b4f4d70cae668eb28c8890f013051df9b1472fbf9dc19371614a8847a1.txt`.
- Journal rich content uses prototype/src/data/newArticles.generated.ts and prototype/src/components/ArticleContent.tsx; 12 Journal articles are registered, with semantic tables, responsive figures and Article JSON-LD.
- Контакты опубликованы только на `/contacts/`; старый `/contact/` отсутствует и возвращает 404 без редиректа.
- Кейсы используют ЧПУ из `prototype/src/data/cases.ts`; числовые `/cases/1/`–`/cases/6/` отсутствуют и возвращают 404.
- Sitemap генерируется из 45 `publicRoutes`; после деплоя все 45 production URL проверены с кодом 200.
- Schema.org централизован в `prototype/src/data/seo.ts`: каждый маршрут получает один связанный `@graph` со стабильными WebSite/Organization/Person `@id`; `#structured-data` обновляется в `DocumentMeta` при SPA-навигации, а `prototype/src/test/structured-data.test.tsx` и `prototype/scripts/audit-dist.mjs` проверяют графы и дубли.
- MAX показывается по текущему номеру без ссылки, потому что подтверждённого публичного MAX URL нет.
- Пояснение цены «от» реализовано общим компонентом `StartingPriceNote` в `prototype/src/components/ui.tsx`.
- Главная в production: hero содержит только основные CTA и короткую фотокарточку; блок «Почему работаю один» использует desktop-композицию 2 широкие карточки + 3 компактные, tablet 2 колонки с последней полноширинной, mobile 1 колонку; затем cases → services → process → FAQ → contact. Старые hero-цены и блок situations удалены.
- Build/deploy: `tools/deploy.sh --approve`; 74 теста.
- Кейс /cases/local-seo-avtoservisy/ использует prototype/src/data/autoServiceCaseData.ts как master dataset и отдельный шаблон prototype/src/pages/AutomotiveServiceCasePage.tsx; аналитические screenshots удалены, proof-блоки собраны нативно в HTML/SVG, адаптивная композиция дополнена CSS-блоком Local SEO auto-service case: native proof system, no analytics screenshots в prototype/src/final-alignment.css.
- Кейс `/cases/seo-3pl-logistika/` использует отдельный long-form шаблон `prototype/src/pages/ThreePLLogisticsCasePage.tsx`; оформление находится в CSS-блоке `3PL logistics case: B2B qualification long-form composition` в `prototype/src/final-alignment.css`.
- Кейс /cases/seo-proizvodstvo-nastolnyh-igr/ использует prototype/src/data/caseBoardGamesData.ts как master dataset и отдельный шаблон prototype/src/pages/BoardGameProductionCasePage.tsx; нативная proof-система находится в CSS-блоке Board game production case: native proof system and analytics в prototype/src/final-alignment.css; Wordstat используется только для входного спроса, а фулфилмент остаётся развитием продукта.
- Кейс /cases/seo-proizvodstvo-mercha/ использует prototype/src/data/merchCaseData.ts как master dataset и отдельный шаблон prototype/src/pages/MerchProductionCasePage.tsx; доказательный слой про печать и нанесение находится в CSS-блоке Merchandise production case: printing and application native proof system в prototype/src/final-alignment.css; общая семантика мерча в новых proof-блоках не дублируется.
- Кейс /cases/seo-meditsinskaya-klinika/ использует prototype/src/data/medicalCaseData.ts как master dataset и отдельный шаблон prototype/src/pages/MedicalClinicCasePage.tsx; коммерческий Wordstat, YMYL и отдельный AI/AEO-слой оформлены в CSS-блоке Medical clinic case: commercial demand, YMYL and AI native proof system в prototype/src/final-alignment.css; симптомная семантика в новых proof-блоках не используется.
- Кейс /cases/seo-klining-dlya-biznesa/ использует Wordstat по 9 направлениям и контрольную группу из 20 запросов; старый /cases/seo-dostavka-vody/ отсутствует без редиректа. Выдуманные URL клиентского сайта не показываются и не регистрируются как маршруты, ссылки или sitemap URL. Master dataset — prototype/src/data/cleaningCaseData.ts, страница — prototype/src/pages/CleaningBusinessCasePage.tsx.
