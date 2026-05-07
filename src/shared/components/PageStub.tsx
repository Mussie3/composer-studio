type Props = {
  title: string
  description?: string
}

export default function PageStub({ title, description }: Props) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-2">{title}</h1>
      {description && <p className="text-ink-500">{description}</p>}
      <div className="mt-6 panel p-6 text-sm text-ink-500">
        This page is part of the MVP scope and will be filled in next.
      </div>
    </div>
  )
}
