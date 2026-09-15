import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { PageMetaProvider } from './context/PageMetaContext'
import { ToastProvider } from './context/ToastContext'
import { AppRoutes } from './routes'

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

export default function App() {
  return (
    <BrowserRouter basename={routerBasename} useTransitions={false}>
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
