import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log('main.jsx executing');

// default to yellow theme; users can toggle by changing the class on <html>
document.documentElement.classList.add('theme-yellow');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
