import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

// ============================================================
// 应用入口
// ============================================================
// BrowserRouter 包裹整个 App，让路由（/capture, /notes 等）生效
// StrictMode 是 React 的开发模式检查，帮你发现潜在问题
// ============================================================

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
