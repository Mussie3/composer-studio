import { Navigate, createBrowserRouter } from 'react-router-dom'
import AppShell from '@shared/components/AppShell'
import PageStub from '@shared/components/PageStub'
import ComposerPage from '@pages/mail/Composer/ComposerPage'
import MailListPage from '@pages/mail/List/MailListPage'
import NewMailPage from '@pages/mail/Create/NewMailPage'
import MailDetailPage from '@pages/mail/Detail/MailDetailPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/mail" replace /> },
      { path: 'mail', element: <MailListPage /> },
      { path: 'mail/new', element: <NewMailPage /> },
      { path: 'mail/:id', element: <MailDetailPage /> },
      { path: 'mail/:id/edit', element: <ComposerPage /> },
      { path: 'mail/:id/preview', element: <PageStub title="Preview" /> },
      { path: 'mail/history', element: <PageStub title="History" description="Sent emails and their performance." /> },
      { path: 'mail/usage', element: <PageStub title="Usage" description="Volume, opens, clicks." /> },
      { path: 'mail/templates', element: <PageStub title="Templates" description="Reusable starting points." /> },
      { path: 'mail/settings', element: <PageStub title="Settings" description="Sender identity, business info, footer." /> },
      { path: 'compose', element: <ComposerPage /> },
    ],
  },
])
