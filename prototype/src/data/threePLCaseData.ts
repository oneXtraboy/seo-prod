export const threePLCaseData = {
  period: 'март — август 2026',
  duration: '6 месяцев',
  wordstatPeriod: '17.08–17.09.2026',
  demand: [
    ['Фулфилмент', 4849],
    ['Аренда склада', 3044],
    ['3PL', 729],
    ['Кросс-докинг', 629],
    ['Складское хранение', 606],
    ['Складские услуги', 448],
  ],
  operationSteps: [
    ['Аренда склада', 3044, 'Покупают площадь'],
    ['Складское хранение', 606, 'Покупают хранение товара'],
    ['Складские услуги', 448, 'Покупают операции с товаром'],
    ['Фулфилмент', 4849, 'Покупают обработку заказа целиком'],
    ['3PL', 729, 'Покупают комплексную работу со складскими процессами'],
  ],
  crossDocking: ['Кросс-докинг', 629, 'Отдельная услуга для быстрого прохождения товара без длительного хранения'],
  clusters: [
    { name: 'Аренда склада', queries: [['аренда склада', 3044], ['аренда склада в спб', 505], ['складские площади', 327], ['аренда складских помещений', 300]] },
    { name: 'Складское хранение', queries: [['складское хранение', 606], ['складское хранение спб', 37], ['ответственное складское хранение', 27]] },
    { name: 'Складские услуги', queries: [['складские услуги', 448], ['складские услуги спб', 37]] },
    { name: 'Фулфилмент', queries: [['фулфилмент', 4849], ['фулфилмент спб', 309], ['фулфилмент для маркетплейсов', 272], ['услуги фулфилмента', 111], ['фулфилмент цена', 27]] },
    { name: '3PL', queries: [['3pl', 729], ['3pl склад', 86], ['3pl услуги', 48], ['3pl компании', 32], ['3pl спб', 19], ['3pl цены', 11], ['3pl фулфилмент', 11]] },
    { name: 'Кросс-докинг', queries: [['кросс докинг', 629], ['стоимость кросс-докинга', 23], ['кросс докинг спб', 12], ['услуги кросс-докинга', 8]] },
  ],
  economics: { cpl: 1800, leadToContract: 1.2, cpaBefore: 185000, cpaAfter: 62000, irrelevantLeadsChange: -70 },
  qualification: ['Поисковый запрос', 'Страница услуги', 'Состав работ', 'Стоимость и условия', 'Порог: от 500 отгрузок в месяц', 'Аудит текущих издержек', 'Технический специалист', 'Квалифицированный B2B-лид'],
  qualificationResults: { irrelevantLeadsChange: -70, meetingConversionChange: 35, responseSlaMinutes: 15 },
  capabilities: [
    ['Остатки', 'Текущие остатки по складу'],
    ['Приёмка', 'Поступление товара'],
    ['Заказы', 'Статусы обработки'],
    ['Комплектация', 'Подготовка заказов'],
    ['Отгрузка', 'Передача в доставку'],
    ['Контроль', 'Прозрачность операций без ручных уточнений'],
  ],
  hypotheses: [
    { title: 'Анти-прайс', before: 'расчёт аренды', after: 'аудит логистических издержек', result: '−70% нецелевых заявок' },
    { title: 'Разделение предложений', before: 'аренда и 3PL смешаны', after: 'разные сценарии выбора', result: 'трафик перестал смешиваться' },
    { title: 'Порог входа', before: 'без явного ограничения', after: 'от 500 отгрузок в месяц', result: 'отдел продаж работал с более подходящими компаниями' },
  ],
  topvisor: {
    total: 18,
    trend: [
      { date: '01.03', top3: 1, top10: 4, top20: 7 },
      { date: '01.04', top3: 2, top10: 6, top20: 9 },
      { date: '01.05', top3: 4, top10: 8, top20: 12 },
      { date: '01.06', top3: 5, top10: 10, top20: 14 },
      { date: '01.07', top3: 7, top10: 13, top20: 16 },
      { date: '31.08', top3: 8, top10: 15, top20: 18 },
    ],
    queries: [
      ['аренда склада', 18, 9],
      ['складские услуги', 22, 7],
      ['фулфилмент', 14, 3],
      ['фулфилмент спб', 19, 5],
      ['3pl', 27, 8],
      ['кросс докинг', 24, 6],
    ],
  },
  gsc: [
    { month: 'Мар', clicks: 186, impressions: 8900, ctr: 2.09, position: 19.2 },
    { month: 'Апр', clicks: 244, impressions: 11800, ctr: 2.07, position: 16.8 },
    { month: 'Май', clicks: 327, impressions: 15900, ctr: 2.06, position: 13.9 },
    { month: 'Июн', clicks: 438, impressions: 21600, ctr: 2.03, position: 11.7 },
    { month: 'Июл', clicks: 566, impressions: 28100, ctr: 2.01, position: 9.8 },
    { month: 'Авг', clicks: 714, impressions: 35700, ctr: 2.0, position: 8.1 },
  ],
  metrika: [
    { month: 'Мар', sessions: 418, leads: 19, conversion: 4.5, bounce: 41, depth: 2.2, time: '1:46' },
    { month: 'Апр', sessions: 523, leads: 24, conversion: 4.6, bounce: 39, depth: 2.4, time: '1:58' },
    { month: 'Май', sessions: 667, leads: 31, conversion: 4.6, bounce: 37, depth: 2.6, time: '2:11' },
    { month: 'Июн', sessions: 842, leads: 40, conversion: 4.8, bounce: 35, depth: 2.8, time: '2:24' },
    { month: 'Июл', sessions: 1021, leads: 47, conversion: 4.6, bounce: 33, depth: 2.9, time: '2:36' },
    { month: 'Авг', sessions: 1184, leads: 53, conversion: 4.5, bounce: 31, depth: 3.1, time: '2:49' },
  ],
  business: {
    newClients: 12,
    cpaBefore: 185000,
    cpaAfter: 62000,
    salesCycleBefore: 65,
    salesCycleAfter: 22,
    revenueShareBefore: 20,
    revenueShareAfter: 78,
    averageCheck: 400000,
    irrelevantLeadsChange: -70,
    meetingConversionChange: 35,
    responseSlaMinutes: 15,
  },
} as const

const lastTopvisor = threePLCaseData.topvisor.trend.at(-1)!
const firstGsc = threePLCaseData.gsc[0]
const lastGsc = threePLCaseData.gsc.at(-1)!
const firstMetrika = threePLCaseData.metrika[0]
const lastMetrika = threePLCaseData.metrika.at(-1)!

export const threePLSummary = {
  top3: lastTopvisor.top3,
  top10: lastTopvisor.top10,
  top20: lastTopvisor.top20,
  gscBefore: firstGsc,
  gscAfter: lastGsc,
  metrikaBefore: firstMetrika,
  metrikaAfter: lastMetrika,
} as const
