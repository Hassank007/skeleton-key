import { Routes, Route } from 'react-router-dom'
import { PageShell } from './components/PageShell'
import { HomePage } from './pages/HomePage'
import { AboutPage } from './pages/AboutPage'
import { useFocusOnRouteChange } from './hooks/useFocusOnRouteChange'

/** Router root — wraps every route in PageShell and manages focus on route change. */
function App() {
  useFocusOnRouteChange()

  return (
    <PageShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </PageShell>
  )
}

export default App
