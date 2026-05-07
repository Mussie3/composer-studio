# Composer Studio

A drag-and-drop email composer built as a portfolio piece. Compose marketing
emails from blocks (sections), reorder them, edit content inline, preview on
desktop and mobile, export to email-client-friendly HTML, manage recipients,
and schedule or send — all backed by a mocked API that persists to
`localStorage` so the project runs end-to-end without a backend.

## Run it

```sh
npm install
npm run dev
```

Open `http://localhost:5173`. The list page seeds a few sample emails on first
run; click any draft to open it in the editor.

To reset state, run `localStorage.clear()` in the browser console.

## What's implemented

**Composer**

- Multi-column blocks (1-col, 2-equal, 1:2, 2:1) with drag-to-reorder via
  `@dnd-kit/core` + `@dnd-kit/sortable`.
- Inline rich text editing via Tiptap with a sticky format toolbar (bold,
  italic, strike, H1/H2/H3, ordered/unordered lists, alignment, links).
- Element types: rich text, image, button, divider, spacer.
- Click-to-select for the document, blocks, columns, elements, or footer —
  the right-side **Control Panel** drives whatever's selected.
- Snapshot-based undo / redo (50-step ring) and dirty/saved indicator.
- Desktop / mobile viewport toggle (preview at 380 px vs. document width).
- **Personalization tokens** (`{{firstName}}`, `{{lastName}}`, `{{email}}`,
  `{{businessName}}`, `{{unsubscribeUrl}}`) inserted via a dropdown in the
  Tiptap toolbar and the Send modal subject/preheader fields.

**HTML export**

- `View HTML` modal in the editor header generates email-client-safe markup
  on demand. Source / Rendered (iframe) tabs, Copy, and Download.
- Generator is intentionally conservative: nested `<table role="presentation">`
  for layout, all styles inlined, the only `<style>` block carries the
  responsive `display: block` media query that stacks 2-col blocks under
  620 px (which inlining cannot replace).
- Outlook-friendly nice-to-haves: `mso-line-height-rule: exactly` on
  buttons, explicit `width` attributes on images, hidden preheader trick
  (`display:none` + `maxHeight: 0`) for inbox preview text, and a
  `{{unsubscribeUrl}}` token in the footer for ESP substitution at send.

**Mail CRUD + workflow**

- List (`/mail`): filter by status, search by title, delete inline.
- Create (`/mail/new`): title + starting point (sample layout vs. blank).
- Detail (`/mail/:id`): read-only `DocumentPreview`, status header, stats
  grid for sent emails, edit / duplicate / delete.
- Edit (`/mail/:id/edit`): the full Composer, with debounced auto-save back
  through the mail saga.
- **Send / Schedule** modal: subject, preheader, recipients (paste, CSV
  upload via Papa Parse, dedup, validation), Send now or Schedule for a
  future datetime. A single saga updates the mail and hits the send
  endpoint atomically.

**Templates**

- Picker (`/mail/templates`) with four seed documents: Blank, Announcement,
  Weekly newsletter, Product update. Preview in a modal, then **Use** to
  spawn a new draft from a deep-cloned template document.

**Settings** (`/mail/settings`)

- Sender identity (name, sender email, reply-to email, verification badge).
- Business profile (name, mailing address, website, optional logo).
- React Hook Form + Zod with inline validation; Save buttons stay disabled
  until the form is dirty.

**Usage** (`/mail/usage`)

- Aggregate stats: campaigns, recipients, average open + click rates,
  unsubscribes, bounces.
- Three Chart.js panels: 30-day sends line chart, engagement-breakdown
  doughnut, per-email open vs. click rate bar chart.
- Recent-sends table linking to detail pages.

**History** (`/mail/history`)

- Vertical timeline of sent + scheduled emails grouped by month, newest
  first, with inline stats on each card.

## Tech stack

| Layer | Choice |
| --- | --- |
| Build | Vite + React 19 + TypeScript |
| State | Redux Toolkit + Redux-Saga |
| Styling | Tailwind CSS |
| Rich text | Tiptap (StarterKit + TextAlign + Color) |
| Drag & drop | `@dnd-kit/core` + `@dnd-kit/sortable` |
| Routing | React Router v7 |
| Forms | React Hook Form + Zod |
| Charts | Chart.js / `react-chartjs-2` |
| CSV | Papa Parse |
| Mock backend | `axios-mock-adapter` + `localStorage` |

## Architecture

```
src/
├── app/         Store, router, App entry, typed hooks
├── shared/      Reusable UI (AppShell, StatusBadge, TokenMenu, helpers)
├── domains/
│   └── mail/    Types, factories, repository, Redux slices, sagas, HTML
│                generator, templates, tokens
├── pages/
│   └── mail/    Composer (the editor), List, Create, Detail, Settings,
│                Templates, Usage, History
└── api/         Axios client, localStorage namespace, mock handlers
```

### Composer data model

A document is a **list of blocks**. Each block has a layout (1- or 2-column
variants) and a list of cells; each cell holds a list of elements. Elements
are a discriminated union: `text`, `image`, `button`, `divider`, or `spacer`.

```ts
type ComposerDocument = {
  blocks: Block[]
  footer: FooterBlock
  styles: DocumentStyles
}
```

The composer slice holds the document, the current selection, the view mode,
and an undo/redo history. Mutations push a deep-cloned snapshot of the
previous document onto a `past` stack; undo/redo swap between `past` and
`future`.

### Why Redux + Saga (vs. just hooks)

Two reasons:

1. The composer document is a deeply nested tree mutated from many places
   (canvas, navigation panel, control panel, element components, drag
   handlers). A single store with typed actions keeps that surface area
   sane and makes undo/redo trivial.
2. Side effects (load, save, send, schedule, image upload, profile fetch)
   live in sagas. The `submitForSendRequest` saga, for instance, updates
   the mail and triggers send in a single chain — components don't need
   to coordinate two awaits.

### Mock backend

Every API call goes through Axios → `axios-mock-adapter` → `localStorage`
under the `composer-studio:v1:*` namespace. The mock endpoints respond with
a 220 ms delay so loading states are exercised. Sending a mail synthesizes
plausible mock stats; scheduling marks the mail as `scheduled` until the
scheduled time passes.

## Roadmap

- [x] Block / element domain model and Redux store
- [x] Canvas with selection, drag-reorder, inline rich text
- [x] Property panel for document, blocks, elements, and footer
- [x] Mocked backend (mails CRUD, sender, business, image upload)
- [x] HTML export (table-based email-client-safe markup)
- [x] Mail list / create / detail views
- [x] Templates picker
- [x] Send and schedule modal
- [x] Personalization tokens
- [x] CSV recipient upload
- [x] Settings (sender, business profile)
- [x] Usage stats page
- [x] History timeline
- [ ] HTML import (round-trip back into the document model)
- [ ] Image upload UI in the canvas (the API mock exists)
- [ ] Floating block-add menu between blocks
- [ ] Light theme variants for templates

## License

MIT
