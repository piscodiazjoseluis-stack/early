import { X } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export function Modal({
  open,
  title,
  children,
  onClose,
  showFooter = true,
  className,
}: {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
  showFooter?: boolean
  className?: string
}) {
  if (!open) return null

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 grid place-items-center bg-[#061b45]/45 p-4 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="visual-modal-title"
        className={cn(
          'modal-panel border-border shadow-card w-full max-w-md rounded-3xl border bg-white p-6',
          className,
        )}
      >
        <header className="flex items-center justify-between gap-4">
          <h2 id="visual-modal-title" className="text-primary text-lg font-extrabold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:bg-background hover:text-primary grid size-10 place-items-center rounded-xl transition"
            aria-label="Cerrar modal"
          >
            <X className="size-5" />
          </button>
        </header>
        <div className="mt-5">{children}</div>
        {showFooter ? (
          <footer className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={onClose}>Confirmar</Button>
          </footer>
        ) : null}
      </section>
    </div>
  )
}
