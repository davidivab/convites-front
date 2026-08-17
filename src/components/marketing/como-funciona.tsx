import { ClipboardList, HandHeart, Hammer } from 'lucide-react'

const PASOS = [
  {
    icon: ClipboardList,
    titulo: 'Se abre una iniciativa',
    texto:
      'Un vecino o una junta cuenta qué se necesita y arma la lista de insumos. Un moderador la revisa antes de publicarla.',
  },
  {
    icon: HandHeart,
    titulo: 'Cada quien suma lo que puede',
    texto:
      'Tú eliges qué vas a llevar: tejas, cemento, comida, herramientas o tus manos. Todo suma y se ve reflejado al instante.',
  },
  {
    icon: Hammer,
    titulo: 'Nos juntamos en el convite',
    texto:
      'El día acordado nos encontramos en el lugar, llevamos lo prometido y construimos o reparamos entre todos.',
  },
]

export function ComoFunciona() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 md:py-20">
      <div className="max-w-2xl">
        <span className="text-sm font-semibold uppercase tracking-wide text-primary">
          Cómo funciona un convite
        </span>
        <h2 className="mt-2 font-serif text-3xl font-semibold text-balance text-foreground md:text-4xl">
          Un convite es la gente reunida para construir junta
        </h2>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          No es una colecta de plata. Es una lista de lo que falta y un montón de manos dispuestas a
          poner el hombro.
        </p>
      </div>

      <ol className="mt-10 grid gap-6 md:grid-cols-3">
        {PASOS.map((paso, i) => {
          const Icon = paso.icon
          return (
            <li
              key={paso.titulo}
              className="relative flex flex-col gap-4 rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <Icon className="size-5" />
                </span>
                <span className="font-serif text-2xl font-semibold text-primary/40">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <div>
                <h3 className="font-serif text-xl font-semibold text-foreground">{paso.titulo}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{paso.texto}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
