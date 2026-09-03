import { BrowserRouter } from 'react-router-dom'
import { PageMetaProvider } from './context/PageMetaContext'
import { ToastProvider } from './context/ToastContext'
import { AppRoutes } from './routes'

export default function App() {
  return (
    <BrowserRouter useTransitions={false}>
      <ToastProvider>
        <PageMetaProvider>
          <AppRoutes />
        </PageMetaProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
