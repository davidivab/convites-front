import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { CrearClient } from './crear-client'

export const metadata = {
  title: 'Crear un convite — Convites',
  description: 'Cuéntanos qué necesita tu barrio o vereda y arma la lista de insumos del convite.',
}

export default function CrearPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-sidebar/40">
        <CrearClient />
      </main>
      <SiteFooter />
    </div>
  )
}
