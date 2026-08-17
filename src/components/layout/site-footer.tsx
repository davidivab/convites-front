import Link from 'next/link'
import { Wordmark } from '@/components/layout/brand-mark'

const LINKS = [
  {
    titulo: 'Plataforma',
    items: [
      { href: '/explorar', label: 'Explorar iniciativas' },
      { href: '/crear', label: 'Crear una iniciativa' },
      { href: '/panel/aportante', label: 'Mi panel' },
    ],
  },
  {
    titulo: 'Comunidad',
    items: [
      { href: '/quienes-somos', label: 'Quiénes somos' },
      { href: '/moderacion', label: 'Moderación' },
      { href: '/terminos', label: 'Términos y condiciones' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-sidebar">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-xs">
          <Wordmark />
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Plataforma ciudadana de convites comunitarios en las zonas afectadas de Risaralda. No
            somos fundación ni empresa: somos vecinos organizándonos.
          </p>
        </div>

        {LINKS.map((col) => (
          <div key={col.titulo}>
            <h3 className="text-sm font-semibold text-foreground">{col.titulo}</h3>
            <ul className="mt-3 flex flex-col gap-2">
              {col.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Convites · convites.co · Risaralda, Colombia</p>
          <p>Convites no recibe ni administra dinero.</p>
        </div>
      </div>
    </footer>
  )
}
