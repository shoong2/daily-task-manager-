import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import SearchResultsPage from './views/SearchResultsPage.jsx'
import FilterManagerPage from './views/FilterManagerPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/filter-manager" element={<FilterManagerPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
