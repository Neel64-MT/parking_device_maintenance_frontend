import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { PageMetaProvider } from './context/PageMetaContext'
import { ToastProvider } from './context/ToastContext'
import { AppRoutes } from './routes'

function routerBasename() {
  const raw = import.meta.env.BASE_URL || '/'
  try {
    if (/^https?:\/\//i.test(raw)) {
      return new URL(raw).pathname.replace(/\/$/, '') || '/'
    }
  } catch {
    /* use path below */
  }
  return raw.replace(/\/$/, '') || '/'
}

export default function App() {
  return (
    <BrowserRouter basename={routerBasename()} useTransitions={false}>
      <ToastProvider>
        <AuthProvider>
          <PageMetaProvider>
            <AppRoutes />
          </PageMetaProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
