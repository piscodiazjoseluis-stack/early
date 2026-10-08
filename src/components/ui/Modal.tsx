import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'

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
  const panelRef = useRef<HTMLElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return
    previousFocusRef.current = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    const focusable = panel?.querySelector<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )
    focusable?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab' || !panel) return
      const items = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      )
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousFocusRef.current?.focus()
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 grid place-items-center bg-[#071d49]/55 p-4 backdrop-blur-[5px]"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="visual-modal-title"
        className={cn(
          'modal-panel border-border shadow-card w-full max-w-md rounded-[24px] border bg-white p-6 sm:p-7',
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
