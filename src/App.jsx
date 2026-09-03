import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { PageMetaProvider } from './context/PageMetaContext'
import { ToastProvider } from './context/ToastContext'
import { AppRoutes } from './routes'

export default function App() {
  return (
    <BrowserRouter useTransitions={false}>
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
