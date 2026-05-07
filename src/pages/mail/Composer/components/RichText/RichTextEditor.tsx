import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TextAlign } from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { useEffect } from 'react'
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List as ListIcon,
  ListOrdered,
  Link as LinkIcon,
  Strikethrough,
} from 'lucide-react'
import TokenMenu from '@shared/components/TokenMenu'
import { cx } from '@shared/utils/cx'

type Props = {
  html: string
  onChange: (html: string) => void
  autoFocus?: boolean
  className?: string
}

export default function RichTextEditor({ html, onChange, autoFocus, className }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: html,
    autofocus: autoFocus,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none min-h-[1.5em] [&_p]:my-1',
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
  })

  useEffect(() => {
    if (!editor) return
    if (editor.getHTML() !== html) editor.commands.setContent(html, { emitUpdate: false })
  }, [html, editor])

  if (!editor) return null

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} className={className} />
    </div>
  )
}

function Toolbar({ editor }: { editor: Editor }) {
  const insertToken = (token: string) => editor.chain().focus().insertContent(token).run()
  const insertLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Link URL', previous ?? 'https://')
    if (url === null) return
    const chain = editor.chain().focus().extendMarkRange('link')
    if (url === '') chain.unsetMark('link').run()
    else chain.setMark('link', { href: url, target: '_blank', rel: 'noreferrer' }).run()
  }
  return (
    <div
      className="sticky top-0 z-10 -mx-1 mb-1 flex items-center gap-0.5 bg-white/95 backdrop-blur border-b border-ink-100 py-1 px-1"
    >
      <Btn
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold"
      >
        <Bold size={14} />
      </Btn>
      <Btn
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic"
      >
        <Italic size={14} />
      </Btn>
      <Btn
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Strikethrough"
      >
        <Strikethrough size={14} />
      </Btn>
      <Sep />
      <Btn
        active={editor.isActive('heading', { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        title="Heading 1"
      >
        <Heading1 size={14} />
      </Btn>
      <Btn
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Heading 2"
      >
        <Heading2 size={14} />
      </Btn>
      <Btn
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        title="Heading 3"
      >
        <Heading3 size={14} />
      </Btn>
      <Sep />
      <Btn
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet list"
      >
        <ListIcon size={14} />
      </Btn>
      <Btn
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Numbered list"
      >
        <ListOrdered size={14} />
      </Btn>
      <Sep />
      <Btn
        active={editor.isActive({ textAlign: 'left' })}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        title="Align left"
      >
        <AlignLeft size={14} />
      </Btn>
      <Btn
        active={editor.isActive({ textAlign: 'center' })}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        title="Align center"
      >
        <AlignCenter size={14} />
      </Btn>
      <Btn
        active={editor.isActive({ textAlign: 'right' })}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        title="Align right"
      >
        <AlignRight size={14} />
      </Btn>
      <Sep />
      <Btn active={editor.isActive('link')} onClick={insertLink} title="Insert link">
        <LinkIcon size={14} />
      </Btn>
      <div className="ml-auto pl-1">
        <TokenMenu onInsert={insertToken} variant="button" />
      </div>
    </div>
  )
}

function Btn({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className={cx(
        'w-7 h-7 grid place-items-center rounded transition',
        active ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50',
      )}
    >
      {children}
    </button>
  )
}

function Sep() {
  return <div className="w-px h-4 bg-ink-100 mx-0.5" />
}
