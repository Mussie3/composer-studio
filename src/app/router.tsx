import { Navigate, createBrowserRouter } from 'react-router-dom'
import AppShell from '@shared/components/AppShell'
import PageStub from '@shared/components/PageStub'
import ComposerPage from '@pages/mail/Composer/ComposerPage'
import MailListPage from '@pages/mail/List/MailListPage'
import NewMailPage from '@pages/mail/Create/NewMailPage'
import MailDetailPage from '@pages/mail/Detail/MailDetailPage'
import SettingsPage from '@pages/mail/Settings/SettingsPage'
import TemplatesPage from '@pages/mail/Templates/TemplatesPage'
import UsagePage from '@pages/mail/Usage/UsagePage'
import HistoryPage from '@pages/mail/History/HistoryPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/mail" replace /> },
      { path: 'mail', element: <MailListPage /> },
      { path: 'mail/new', element: <NewMailPage /> },
      { path: 'mail/history', element: <HistoryPage /> },
      { path: 'mail/usage', element: <UsagePage /> },
      { path: 'mail/templates', element: <TemplatesPage /> },
      { path: 'mail/settings', element: <SettingsPage /> },
      { path: 'mail/:id', element: <MailDetailPage /> },
      { path: 'mail/:id/edit', element: <ComposerPage /> },
      { path: 'mail/:id/preview', element: <PageStub title="Preview" /> },
      { path: 'compose', element: <ComposerPage /> },
    ],
  },
])
