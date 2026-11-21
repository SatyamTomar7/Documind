type Props = { title: string; description: string }

export function PlaceholderPage({ title, description }: Props) {
  return (
    <section className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-slate-400">{description}</p>
    </section>
  )
}

export function NotFoundPage() {
  return (
    <section className="mx-auto max-w-5xl">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-400">
        404
      </p>
      <h1 className="mt-4 text-3xl font-semibold">Page not found</h1>
      <p className="mt-3 text-slate-400">
        The page you requested does not exist.
      </p>
    </section>
  )
}
