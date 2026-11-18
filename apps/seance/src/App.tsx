import { Routes, Route } from 'react-router-dom'
import { PageShell } from './components/PageShell'
import { IntroPage } from './pages/IntroPage'
import { BookingPage } from './pages/BookingPage'
import { AboutPage } from './pages/AboutPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { BookingProvider } from './contexts/BookingContext'
import { BookingServiceProvider } from './contexts/BookingServiceContext'
import { useFocusOnRouteChange } from './hooks/useFocusOnRouteChange'
import type { BookingService } from './lib/bookingService'

/** Router root: wraps every route in PageShell, keeps the booking in memory above the routes, and manages focus on route change. */
interface AppProps {
  /** Tests pass a fixed today and an instant service. The real app passes nothing. */
  today?: Date
  service?: BookingService
}

function App({ today, service }: AppProps = {}) {
  useFocusOnRouteChange()

  return (
    <BookingServiceProvider service={service}>
      <BookingProvider today={today}>
        <PageShell>
          <Routes>
            <Route path="/" element={<IntroPage />} />
            <Route path="/book/spirit" element={<BookingPage key="spirit" step="spirit" />} />
            <Route path="/book/time" element={<BookingPage key="time" step="time" />} />
            <Route path="/book/details" element={<BookingPage key="details" step="details" />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </PageShell>
      </BookingProvider>
    </BookingServiceProvider>
  )
}

export default App