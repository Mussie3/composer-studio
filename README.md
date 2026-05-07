# Composer Studio

> A drag-and-drop email composer that runs end-to-end in the browser.
> Compose, preview, export, and "send" — backed by a mocked API persisting
> to `localStorage`, so the whole thing works after a single
> `npm run dev`.

Built as a portfolio piece to show off a real editor architecture: a
single deeply-nested document tree mutated from many places, with
typed Redux actions, sagas for I/O, snapshot-based undo, drag-and-drop
reordering, inline Tiptap editing, and a faithful HTML export +
round-trip importer.

## Run it

```sh
npm install
npm run dev
```

Open `http://localhost:5173`. The list page seeds three sample emails
on first run; click any draft to open it in the editor.

To reset state, run `localStorage.clear()` in the browser console.

## Feature tour

### The composer

- **Multi-column blocks** — 1-col, 2 equal, 1 : 2, and 2 : 1 layouts,
  drag-to-reorder via `@dnd-kit`.
- **Floating block inserter** — hover the gap between any two blocks
  (or above the very first) and a brand-colored "+" appears with a
  popover layout picker so you can insert at an exact position, not
  just append.
- **Five element types** — rich text, image, button, divider, spacer.
  Each one has its own colored gradient tile in the navigation panel.
- **Inline Tiptap editing** with a sticky format toolbar: bold,
  italic, strike, H1/H2/H3, ordered + unordered lists, alignment,
  links, and a personalization-token dropdown.
- **Click-to-select** for the document, blocks, columns, elements, or
  footer. The right-side **Control Panel** drives whatever's selected
  (background, padding, layout, button styling, image source, etc.).
- **Snapshot-based undo / redo** (50-step ring) for every mutation,
  including HTML imports. Cmd+Z works.
- **Desktop / mobile preview** — toggle in the header to render at the
  document width vs. 380 px.
- **Personalization tokens** — `{{firstName}}`, `{{lastName}}`,
  `{{email}}`, `{{businessName}}`, `{{unsubscribeUrl}}`. Inserted via
  a dropdown in the Tiptap toolbar and the Send modal subject /
  preheader fields.
- **Image upload** — file picker in the property panel and native
  drag-drop directly onto an image on the canvas. The mock API
  returns a data URL so the upload "round-trips" without a server.

### HTML export

The **View HTML** button in the editor header opens a portal modal with
two tabs (Source / Rendered) plus Copy and Download. The generator is
intentionally conservative for cross-client support:

- Nested `<table role="presentation">` for layout — outer table for the
  body background, inner table for the content column at the configured
  width.
- Two-column blocks render as side-by-side `<td>` cells with width
  percentages. The only `<style>` block carries reset rules and a
  `@media (max-width: 620px)` query that stacks columns on mobile —
  inlining cannot replace that one rule.
- All other styles are inlined.
- **Outlook / Apple Mail nice-to-haves**: `mso-line-height-rule:
  exactly` on buttons, explicit `width` attributes on images alongside
  inline styles, the hidden-preheader trick (`display: none` +
  `maxHeight: 0` + `fontSize: 1`) for inbox preview text, and a
  `{{unsubscribeUrl}}` token in the footer for ESP substitution at
  send time.

### HTML import (round-trip)

The **Import** button (next to View HTML) accepts paste or `.html`
upload and reconstructs a `ComposerDocument` from the markup the
generator produces.

The parser walks the `cs-content` table, treats each row as a block,
and infers `block.layout` from cell width percentages
(50/50, 33/67, 67/33). Per-element heuristics:

- `<hr>` → divider
- `<img>` (optionally wrapped in `<a>`) → image
- `<a>` with `display: inline-block` + `background` → button
- `<div>` with explicit height + `&nbsp;` → spacer
- everything else → text (preserves inner HTML)

The footer is the last footer-shaped row; helper text, business name +
address, and unsubscribe label are hydrated. External / non-matching
HTML falls back to a single text element wrapping `body.innerHTML`,
so the user always gets *something* to start from. Imports push to
the undo stack — Cmd+Z restores the previous document.

### Mail CRUD + workflow

- **List** (`/mail`) — filter by status, search by title, four
  card-tiles for at-a-glance counts, delete inline.
- **New** (`/mail/new`) — title + starting point (sample layout vs.
  blank canvas), then redirect into the editor on the freshly created
  draft.
- **Detail** (`/mail/:id`) — read-only `DocumentPreview`, status
  header, gradient stat tiles for sent emails, edit / duplicate /
  delete actions.
- **Edit** (`/mail/:id/edit`) — the full Composer with debounced
  auto-save back through the mail saga.
- **Send / Schedule** modal — subject, preheader, recipients (paste,
  CSV upload via Papa Parse with email-column detection, dedup,
  validation), Send now or Schedule for a future datetime. A single
  saga updates the mail and hits the send endpoint in one chain so
  the UI doesn't have to coordinate two awaits.

### Templates

`/mail/templates` ships seven curated starting points, covering the
common email archetypes:

| Template | Vibe | What it shows |
| --- | --- | --- |
| Blank | Empty | A clean slate |
| Announcement | Light + image-led | Hero image, headline, single CTA |
| Weekly newsletter | Editorial dark header | Table of contents + 2-col reading list |
| Product update | Friendly informational | Personalized greeting + stacked feature highlights |
| Soft launch | Warm cream + pastel | Centered headline, low-key invite |
| Order receipt | Minimal transactional | Itemized line + total + single action |
| Bold onboarding | Dark navy + brand accents | Three numbered steps for new users |

Click **Preview** to render a template in the read-only previewer, or
**Use** to spawn a new draft from a deep-cloned template document.

### Settings · Usage · History

- **Settings** (`/mail/settings`) — Sender identity (name, sender
  email, reply-to email, verification badge) and Business profile
  (name, mailing address, website, optional logo). React Hook Form +
  Zod with inline validation; Save buttons stay disabled until the
  form is dirty.
- **Usage** (`/mail/usage`) — campaign count, recipient total, average
  open + click rates, unsubscribes, bounces. Three Chart.js panels:
  30-day sends line chart, engagement-breakdown doughnut, per-email
  open vs. click rate bar chart. Recent-sends table at the bottom.
- **History** (`/mail/history`) — vertical timeline of sent +
  scheduled emails grouped by month, newest first, with inline
  recipient + open + click stats on every card.

## Design

The visual identity is built around the editor's "stacked layers"
mental model — the same way a composed email is built up from blocks.

- **Brand mark** — a rounded indigo→violet gradient square with three
  white horizontal layers ([public/favicon.svg](public/favicon.svg) +
  [src/shared/components/BrandLogo.tsx](src/shared/components/BrandLogo.tsx)).
  Doubles as favicon, app icon, and the empty-canvas hero.
- **Element tiles** — every block / element type gets its own gradient
  tile (text = indigo, heading = violet, paragraph = teal,
  image = pink, button = orange, divider = sky, spacer = slate). The
  tiles appear in the navigation panel, the templates picker, the
  detail-page stats, and the empty states.
- **Color tokens** — instead of default Tailwind grays, the project
  uses a custom `ink` ramp (cool, warm-leaning) and a `brand` ramp
  (indigo→violet) defined in
  [tailwind.config.js](tailwind.config.js). The body sits on a soft
  lavender + violet radial-gradient background.
- **Typography** — Inter (display + body) at weight 800 with tight
  display tracking for big headings; JetBrains Mono for code blocks
  and the HTML view.
- **Buttons & cards** — `.btn-primary` carries a real gradient with
  inset highlight, soft hover lift, and a brand-tinted shadow.
  `.panel` rolls up bg + border + radius + soft shadow as a single
  class so cards stay consistent.

## Tech stack

| Layer | Choice |
| --- | --- |
| Build | Vite + React 19 + TypeScript |
| State | Redux Toolkit + Redux-Saga |
| Styling | Tailwind CSS with custom `ink` / `brand` / `surface` palettes |
| Rich text | Tiptap (StarterKit + TextAlign + Color) |
| Drag & drop | `@dnd-kit/core` + `@dnd-kit/sortable` |
| Routing | React Router v7 |
| Forms | React Hook Form + Zod |
| Charts | Chart.js / `react-chartjs-2` |
| CSV | Papa Parse |
| Type guards | TypeScript discriminated unions for the element model |
| Mock backend | `axios-mock-adapter` + `localStorage` |

## Architecture

```
src/
├── app/                  Store, router, App entry, typed hooks
├── shared/
│   ├── components/       AppShell, BrandLogo, StatusBadge, TokenMenu, PageStub
│   └── utils/            cx, format helpers
├── domains/
│   └── mail/
│       ├── types.ts             Discriminated-union element model
│       ├── factories.ts         createBlock / createCell / createElement / etc.
│       ├── tokens.ts            Personalization tokens
│       ├── templates.ts         Seven template documents
│       ├── html/
│       │   ├── generate.ts      ComposerDocument → email-safe HTML
│       │   ├── parse.ts         HTML → ComposerDocument (round-trip)
│       │   └── inline-style.ts  Style-object → "key: value;" serializer
│       ├── repository/          Axios calls
│       └── store/
│           ├── mail.slice.ts          List / current / sender / business
│           ├── mail.saga.ts           CRUD + send + profile sagas
│           ├── mail.selectors.ts
│           └── composer/              Document, selection, view, undo/redo
├── pages/
│   └── mail/
│       ├── Composer/
│       │   ├── ComposerPage.tsx
│       │   ├── components/
│       │   │   ├── Header/            EditorHeader
│       │   │   ├── NavigationPanel/   Layouts + element tiles + outline
│       │   │   ├── Canvas/            Canvas, CanvasBlock, CanvasElement,
│       │   │   │                      CanvasFooter, BlockInserter, EmptyCanvas
│       │   │   ├── ControlPanel/      Selection-driven property editor
│       │   │   ├── PropertySpecs/     Inputs (color, number, select, …)
│       │   │   ├── RichText/          Tiptap wrapper + format toolbar
│       │   │   └── Preview/           DocumentPreview (read-only renderer)
│       │   ├── modals/                HtmlSourceModal, HtmlImportModal,
│       │   │                          SendScheduleModal (all rendered via portal)
│       │   └── hooks/                 useComposerWiring, useImageUpload
│       ├── List/      Mail list with filters and search
│       ├── Create/    New mail (name + starting point)
│       ├── Detail/    Read-only preview + stats grid
│       ├── Templates/ Picker with preview modal
│       ├── Settings/  Sender + business forms
│       ├── Usage/     Chart.js dashboard
│       └── History/   Sent timeline grouped by month
└── api/               Axios client, localStorage namespace, mock handlers + seed
```

### Composer data model

A document is a **list of blocks**. Each block has a layout (1- or
2-column variants) and a list of cells; each cell holds a list of
elements. Elements are a discriminated union — `text`, `image`,
`button`, `divider`, or `spacer` — which makes exhaustive switches
type-safe.

```ts
type ComposerDocument = {
  blocks: Block[]
  footer: FooterBlock
  styles: DocumentStyles
}
```

The composer slice holds the document, the current selection, the view
mode, and an undo/redo history. Mutations push a deep-cloned snapshot
of the previous document onto a `past` stack; undo/redo swap between
`past` and `future`.

### Why Redux + Saga (vs. just hooks)

Two reasons:

1. The composer document is a deeply nested tree mutated from many
   places — canvas, navigation panel, control panel, element
   components, drag-end handlers, the HTML importer. A single store
   with typed actions keeps that surface area sane and makes undo /
   redo trivial.
2. Side effects (load, save, send, schedule, image upload, profile
   fetch) live in sagas. The `submitForSendRequest` saga, for
   instance, updates the mail then triggers send in a single chain
   so components don't need to coordinate two awaits.

### Mock backend

Every API call goes through Axios → `axios-mock-adapter` →
`localStorage` under the `composer-studio:v1:*` namespace. The mock
endpoints respond with a 220 ms delay so loading states are
exercised. Sending a mail synthesizes plausible mock stats;
scheduling marks the mail as `scheduled` until its time passes.

### Modals

All three full-screen modals (HTML view, HTML import, Send /
Schedule) render via `createPortal(..., document.body)`. The editor
header uses `backdrop-filter: blur` to get its glass effect, and
backdrop-filter establishes a containing block for `position: fixed`
descendants — modals would otherwise be clipped to the header's box.
Portaling sidesteps that and any other future stacking-context
landmines.

## Possible extensions

Everything in the original scope shipped. Things I'd reach for next:

- A real Node + SQLite backend behind the same repository surface, so
  the project can be deployed with persistence beyond `localStorage`.
- A Tiptap custom node for personalization tokens so they render as
  styled chips (with autocomplete) instead of plain `{{foo}}` text.
- Image-cropper / focal-point picker on upload.
- A second editor split-view that keeps the rendered HTML preview in
  sync with edits in real time, side by side with the canvas.
- Block templates (saved blocks the user can reuse across emails).
- Variant-based A/B testing fields on the mail model.

## License

MIT
