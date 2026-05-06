import { Navigate, createBrowserRouter } from 'react-router-dom'
import AppShell from '@shared/components/AppShell'
import PageStub from '@shared/components/PageStub'
import ComposerPage from '@pages/mail/Composer/ComposerPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/mail" replace /> },
      { path: 'mail', element: <PageStub title="Emails" description="Drafts, scheduled, and sent emails." /> },
      { path: 'mail/new', element: <PageStub title="New email" description="Start from a blank canvas or a template." /> },
      { path: 'mail/:id', element: <PageStub title="Email detail" /> },
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
