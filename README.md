# Composer Studio

A drag-and-drop email composer built as a portfolio piece. Single-page editor that
lets you build a marketing email from blocks (sections), reorder them, edit content
inline, preview on desktop and mobile, and (soon) export to email-client-friendly HTML.

> Status: **MVP in progress.** The Composer page is interactive end-to-end with a seed
> document, drag-to-reorder blocks, live inline editing, and a working property panel.
> CRUD list, settings, templates, send/schedule, and HTML export/import are coming next
> — see [Roadmap](#roadmap).

## Tech stack

| Layer | Choice |
| --- | --- |
| Build | Vite + React 19 + TypeScript |
| State | Redux Toolkit + Redux-Saga |
| Styling | Tailwind CSS |
| Rich text | Tiptap (StarterKit + TextAlign + Color + Link) |
| Drag & drop | `@dnd-kit/core` + `@dnd-kit/sortable` |
| Routing | React Router v7 |
| Forms | React Hook Form + Zod |
| Mock backend | `axios-mock-adapter` + `localStorage` |
| Charts | Chart.js / `react-chartjs-2` (used by the upcoming Usage page) |

## Run it

```sh
npm install
npm run dev
```

Open `http://localhost:5173`. The Composer is reachable directly at `/compose`, or
via the **Edit** route on any mail item.

The mocked backend seeds a few sample emails on first run, stored under the
`composer-studio:v1:*` namespace in `localStorage`. Run `localStorage.clear()` in
the browser console to reset state.

## Architecture

```
src/
├── app/         Store, router, App entry, typed hooks
├── core/        Reserved for cross-cutting concerns
├── shared/      Reusable UI (AppShell, page stubs, helpers)
├── domains/
│   └── mail/    Domain types, factories, repository, Redux slices, sagas
├── pages/
│   └── mail/
│       ├── Composer/   The drag-and-drop editor (the interesting part)
│       └── ...         Stubs for List / Create / Edit / Settings / Usage / etc.
└── api/         Axios client, localStorage helpers, mock handlers
```

### Composer data model

A document is a **list of blocks**. Each block has a layout (1- or 2-column variants)
and a list of cells; each cell holds a list of elements. Elements are a discriminated
union: `text`, `image`, `button`, `divider`, or `spacer`.

```ts
type ComposerDocument = {
  blocks: Block[]
  footer: FooterBlock
  styles: DocumentStyles
}
```

The composer slice (`composer.slice.ts`) holds the document, the current selection,
the view mode, and an undo/redo history. Mutations push a snapshot of the previous
document onto a `past` stack; undo/redo move the document between `past` and `future`.

### Why Redux + Saga (vs. just hooks)

Two reasons:

1. The composer document is a deeply nested tree mutated from many places (canvas,
   navigation panel, control panel, element components). A single store with typed
   actions keeps that surface area sane.
2. Side effects (load, save, send, image upload) live in sagas, not components.
   This keeps the canvas pure and easy to test.

## Roadmap

- [x] Block / element domain model and Redux store
- [x] Canvas with selection, drag-reorder, inline rich text
- [x] Property panel for document, blocks, elements, and footer
- [x] Mocked backend (mails CRUD, sender, business, image upload)
- [ ] HTML export (table-based email-client-safe markup)
- [ ] HTML import (round-trip back into the document model)
- [ ] Mail list / create / detail views
- [ ] Templates picker
- [ ] Send and schedule modal
- [ ] Personalization tokens (e.g. `{{firstName}}`) in text and buttons
- [ ] CSV recipient upload
- [ ] Settings (sender, business profile, footer defaults)
- [ ] Usage stats page

## License

MIT
