import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { App } from './App'
import './styles.css'
import './production.css'
import './quiz.css'
import './commercial.css'
import './audit-final.css'
import './audit-mobile-fixes.css'
import './audit-mobile-chooser.css'
import './final-alignment.css'

hydrateRoot(
  document.getElementById('root')!,
  <StrictMode><App /></StrictMode>,
)
