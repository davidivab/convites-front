type Props = {
  porQueTitulo: string
  porQue: string[]
  funcionesTitulo: string
  funciones: string[]
}

/**
 * Intro de dos columnas: importancia del rol + listado de funciones.
 */
export function RolIntroColumnas({
  porQueTitulo,
  porQue,
  funcionesTitulo,
  funciones,
}: Props) {
  return (
    <div className="mb-10 grid gap-6 md:grid-cols-2 md:gap-8">
      <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-7">
        <h2 className="font-serif text-2xl leading-snug text-foreground text-balance">
          {porQueTitulo}
        </h2>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-foreground/85">
          {porQue.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 md:p-7">
        <h2 className="font-serif text-2xl leading-snug text-foreground text-balance">
          {funcionesTitulo}
        </h2>
        <ul className="mt-4 list-disc space-y-2.5 pl-5 text-sm leading-relaxed text-muted-foreground">
          {funciones.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}
