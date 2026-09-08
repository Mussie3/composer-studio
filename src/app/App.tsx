import { Provider } from 'react-redux'
import { RouterProvider } from 'react-router-dom'
import { store } from './store'
import { router } from './router'
import { installMockApi } from '@api/mocks'
import { backend } from '@domains/mail/repository/mail.repository'
import AuthGate from '@shared/components/AuthGate'

// Only stand up the localStorage backend when that is the one in use. Installing
// the mock adapter against a live Supabase build would intercept nothing useful
// and seed a parallel set of drafts nobody sees.
if (backend === 'mock') {
  installMockApi()
}

export default function App() {
  const app = (
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  )

  return backend === 'supabase' ? <AuthGate>{app}</AuthGate> : app
}
