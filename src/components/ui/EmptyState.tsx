import { CalendarPlus } from 'lucide-react'

import { Button } from '@/components/ui/Button'

export function EmptyState() {
  return (
    <div className="border-border bg-gradient-to-br from-white to-info-soft/35 grid min-h-64 place-items-center rounded-3xl border border-dashed p-8 text-center">
      <div>
        <span className="bg-info-soft text-electric-blue shadow-soft mx-auto grid size-14 place-items-center rounded-2xl">
          <CalendarPlus className="size-6" />
        </span>
        <h3 className="text-primary mt-4 font-extrabold">Aún no hay solicitudes</h3>
        <p className="text-muted-foreground mx-auto mt-2 max-w-xs text-sm leading-6">
          Cuando registres tu primer Early Friday, aparecerá aquí.
        </p>
        <Button className="mt-5" size="sm">
          Crear solicitud
        </Button>
      </div>
    </div>
  )
}
