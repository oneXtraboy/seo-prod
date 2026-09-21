import type { ArticleContentBlock } from '../types'
import { TextLink } from './ui'

export function ArticleBlocks({ blocks }: { blocks: ArticleContentBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        const key = block.type + '-' + index
        if (block.type === 'paragraph') return <p key={key}>{block.text}</p>
        if (block.type === 'heading') return block.level === 3 ? <h3 key={key}>{block.text}</h3> : <h4 key={key}>{block.text}</h4>
        if (block.type === 'list') {
          const Tag = block.ordered ? 'ol' : 'ul'
          return <Tag key={key}>{block.items.map((item) => <li key={item}>{item}</li>)}</Tag>
        }
        if (block.type === 'table') {
          return (
            <div className="article-table-wrap" key={key}>
              <table>
                {block.table.caption && <caption>{block.table.caption}</caption>}
                <thead><tr>{block.table.headers.map((header) => <th key={header} scope="col">{header}</th>)}</tr></thead>
                <tbody>
                  {block.table.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => cellIndex === 0
                        ? <th key={cellIndex} scope="row">{cell}</th>
                        : <td key={cellIndex}>{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
        if (block.type === 'figure') {
          const { figure } = block
          return (
            <figure className="article-figure" key={key}>
              <img
                alt={figure.alt}
                decoding="async"
                fetchPriority={figure.eager ? 'high' : undefined}
                height={figure.height}
                loading={figure.eager ? 'eager' : 'lazy'}
                src={figure.src}
                width={figure.width}
              />
              <figcaption>{figure.caption}</figcaption>
            </figure>
          )
        }
        if (block.type === 'links') {
          return (
            <aside className="article-context-links" key={key}>
              <h3>{block.title}</h3>
              <ul>{block.links.map((link) => <li key={link.path}><TextLink to={link.path}>{link.label}</TextLink></li>)}</ul>
            </aside>
          )
        }
        return <ArticleInfographic key={key} variant={block.variant} />
      })}
    </>
  )
}

function ArticleInfographic({ variant }: { variant: Extract<ArticleContentBlock, { type: 'infographic' }>['variant'] }) {
  if (variant === 'query-to-solution') {
    const steps = ['Исходный запрос', 'Задача клиента', 'Отрасль и масштаб', 'Риски и интеграции', 'Доказательства и экономика', 'Коммерческое решение']
    return (
      <figure className="article-native-visual">
        <h3>От запроса к решению в B2B</h3>
        <div className="article-native-flow">{steps.map((step, index) => <div key={step}><span>{index + 1}</span><strong>{step}</strong></div>)}</div>
        <figcaption>Один запрос раскрывается через контекст покупки. Отдельный URL нужен только там, где меняется самостоятельный сценарий выбора.</figcaption>
      </figure>
    )
  }

  if (variant === 'b2b-layers') {
    const layers = [
      ['01', 'Базовое решение', 'Услуга и задача бизнеса'],
      ['02', 'Сценарий и отрасль', 'Масштаб, процессы и контекст'],
      ['03', 'Ограничения и интеграции', 'SLA, WMS, API и пороги входа'],
      ['04', 'Доказательства', 'Кейсы, процессы и спецификации'],
      ['05', 'Экономика и следующий шаг', 'Условия, расчёт и обращение'],
    ]
    return (
      <figure className="article-native-visual">
        <h3>Пятислойная архитектура B2B-сайта</h3>
        <div className="article-layer-stack">{layers.map(([number, title, detail]) => <div key={number}><span>{number}</span><strong>{title}</strong><p>{detail}</p></div>)}</div>
        <figcaption>Слои помогают связать поисковый спрос с вопросами, которые клиент последовательно проверяет перед выбором подрядчика.</figcaption>
      </figure>
    )
  }

  if (variant === 'three-pl-before-after') {
    return (
      <figure className="article-native-visual">
        <h3>3PL-сайт: до и после перестройки</h3>
        <div className="article-before-after">
          <div><span>До</span><strong>Аренда склада</strong><ul><li>Площадь</li><li>Класс склада</li><li>Охрана</li><li>Расположение</li></ul></div>
          <div aria-hidden="true" className="article-before-after__arrow">→</div>
          <div><span>После</span><strong>Передача операций</strong><ul><li>Хранение и приёмка</li><li>Комплектация и упаковка</li><li>Отгрузка</li><li>WMS и API</li></ul></div>
        </div>
        <figcaption>Структура сместилась от продажи квадратных метров к задачам фулфилмента и комплексной логистики.</figcaption>
      </figure>
    )
  }

  const separate = ['Отдельный интент', 'Отличающееся предложение', 'Собственные доказательства', 'Отдельный следующий шаг']
  const existing = ['Тот же интент', 'То же решение', 'Общие доказательства', 'Тот же CTA']
  return (
    <figure className="article-native-visual">
      <h3>Отдельная страница или блок на существующей</h3>
      <div className="article-page-decision">
        <div><strong>Создать отдельную страницу</strong><ul>{separate.map((item) => <li key={item}>{item}</li>)}</ul></div>
        <div><strong>Добавить блок на существующую</strong><ul>{existing.map((item) => <li key={item}>{item}</li>)}</ul></div>
      </div>
      <figcaption>Решение о новом URL принимается по различию задачи, предложения, доказательств и следующего действия, а не по одному ключевому слову.</figcaption>
    </figure>
  )
}
